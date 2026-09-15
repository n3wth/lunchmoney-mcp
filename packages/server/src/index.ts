import { createServer as createHttpServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  createAccessTokenVerifier,
  protectedResourceMetadata,
  bearerChallenge,
  AuthorizationError,
  type AuthConfig,
  type Principal
} from '@lunchmoney-mcp/auth-contract'
import type { createReadOnlyAdapter } from '@lunchmoney-mcp/adapter'
import type { Connection, IdentityStore, User } from './identity.js'
import { validateAndActivateConnection, type CredentialProvider, type ConnectSessionProvider, type ConnectionDiscovery } from './credentials.js'
import { createReadOnlyServer } from './tools.js'
import { toolCallEvent } from './observability.js'

export interface ServerConfig {
  auth: AuthConfig
  metadataUrl: string
  store: IdentityStore
  credentials: CredentialProvider
  connectSessions?: ConnectSessionProvider
  environment?: 'development' | 'production'
  rateLimit?: { windowMs: number; maxPerUser: number; maxTotal: number }
  onEvent?: (event: { type: string; userId?: string; status?: number }) => void
  adapter: ReturnType<typeof createReadOnlyAdapter>
  verifyToken?: (authorization: string | null) => Promise<Principal>
  maxBodyBytes?: number
}

interface EarlyResponse {
  status: number
  body: unknown
  headers?: Record<string, string>
}

type GateResult = { error: EarlyResponse } | { principal: Principal }
type ContextResult = { error: EarlyResponse } | { user: User; connection: Connection | undefined }

function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, { 'content-type': 'application/json', ...headers })
  res.end(payload)
}

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers }
  })
}

function readBody(req: IncomingMessage, maxBytes: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let total = 0
    req.on('data', (chunk: Buffer) => {
      total += chunk.byteLength
      if (total > maxBytes) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new Error('invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

async function readRequestBody(request: Request, maxBytes: number): Promise<unknown> {
  const stream = request.body
  if (stream === null) throw new Error('invalid JSON')
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined)
      throw new Error('body too large')
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown
}

function createRequestPipeline(config: ServerConfig) {
  const verify = config.verifyToken ?? createAccessTokenVerifier(config.auth)
  const metadata = protectedResourceMetadata(config.auth)
  const maxBodyBytes = config.maxBodyBytes ?? 256 * 1024
  const rateWindowMs = config.rateLimit?.windowMs ?? 60000
  const maxPerUser = config.rateLimit?.maxPerUser ?? 60
  const maxTotal = config.rateLimit?.maxTotal ?? 600
  const hits = new Map<string, number[]>()
  const emit = (type: string, userId?: string, status?: number) => {
    config.onEvent?.({ type, userId, status })
  }

  function rateLimited(userId: string): boolean {
    const now = Date.now()
    const cutoff = now - rateWindowMs
    let total = 0
    for (const [key, list] of hits) {
      const kept = list.filter((t) => t > cutoff)
      if (kept.length === 0) hits.delete(key)
      else hits.set(key, kept)
      total += kept.length
    }
    const mine = hits.get(userId) ?? []
    if (mine.length >= maxPerUser || total >= maxTotal) return true
    mine.push(now)
    hits.set(userId, mine)
    return false
  }

  async function authorize(authorization: string | null): Promise<GateResult> {
    try {
      return { principal: await verify(authorization) }
    } catch (error) {
      const status = error instanceof AuthorizationError ? error.status : 401
      const code = error instanceof AuthorizationError ? error.code : 'invalid_token'
      return {
        error: {
          status,
          body: { error: code },
          headers: { 'www-authenticate': bearerChallenge(config.auth, config.metadataUrl, code) }
        }
      }
    }
  }

  async function resolveContext(principal: Principal): Promise<ContextResult> {
    const user = await config.store.getOrCreateUser(principal.issuer, principal.subject)
    if (rateLimited(user.userId)) {
      emit('rate_limited', user.userId, 429)
      return { error: { status: 429, body: { error: 'rate_limited' }, headers: { 'retry-after': '60' } } }
    }
    emit('request', user.userId)
    let connection = await config.store.getActiveConnection(user.userId)
    if (connection !== undefined && connection.state === 'pending' &&
        connection.connectionId.startsWith('pending:') &&
        typeof (config.credentials as { findConnectionId?: unknown }).findConnectionId === 'function') {
      // Placeholder pending record: the Connect UI completed out-of-band and
      // no webhook told us the real Nango connection ID. Discover it by the
      // end_user_id tag we set on the connect session.
      try {
        const discovered = await (config.credentials as CredentialProvider & ConnectionDiscovery).findConnectionId(user.userId)
        if (discovered !== undefined) {
          await config.store.claimPendingConnection(user.userId, discovered)
          connection = await config.store.getActiveConnection(user.userId)
        }
      } catch {
        emit('connection_discovery_failed', user.userId)
      }
    }
    if (connection !== undefined && connection.state === 'pending' &&
        !connection.connectionId.startsWith('pending:')) {
      // Connect-session reconciliation: a real Nango connection ID exists but
      // no webhook has activated it. Validate the credential with Lunch Money
      // first; rejected credentials mark the connection 'invalid'.
      try {
        const result = await validateAndActivateConnection({
          credentials: config.credentials,
          store: config.store,
          userId: user.userId,
          connectionId: connection.connectionId
        })
        emit(result === 'active' ? 'connection_activated' : 'connection_invalid', user.userId)
      } catch {
        emit('connection_validation_failed', user.userId)
      }
      connection = await config.store.getActiveConnection(user.userId)
    }
    return { user, connection }
  }

  async function buildServer(user: User, connection: Connection | undefined): Promise<McpServer> {
    const store = config.store
    const environment = config.environment ?? 'development'
    const sessions = config.connectSessions
    return createReadOnlyServer({
      adapter: config.adapter,
      connectionState: connection?.state ?? 'unconnected',
      userId: user.userId,
      token: connection === undefined || connection.state !== 'active'
        ? ''
        : (await config.credentials.getToken(connection.connectionId)) ?? '',
      connect: sessions === undefined ? undefined : {
        async createSession(userId: string) {
          const active = await store.getActiveConnection(userId)
          if (active !== undefined && active.state === 'pending') {
            throw new Error('connection already pending')
          }
          const session = await sessions.createSession(userId)
          return session
        },
        async onSessionCreated(userId: string) {
          await store.replaceConnection(userId, `pending:${userId}`, environment)
        },
        async disconnect(userId: string) {
          const active = await store.getActiveConnection(userId)
          if (active === undefined) return 'none'
          if (!active.connectionId.startsWith('pending:')) {
            await sessions.deleteConnection(active.connectionId)
          }
          await store.markConnection(userId, active.connectionId, 'deleted')
          return 'disconnected'
        }
      }
    })
  }

  return { metadata, maxBodyBytes, authorize, resolveContext, buildServer }
}

function closeOnFinish(response: Response, transport: WebStandardStreamableHTTPServerTransport): Response {
  const body = response.body
  if (body === null) {
    void transport.close().catch(() => undefined)
    return response
  }
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  void body.pipeTo(writable)
    .catch(() => undefined)
    .then(() => transport.close())
    .catch(() => undefined)
  return new Response(readable, response)
}

/**
 * Web Standard (Request/Response) handler for the same MCP surface. Runs on
 * Cloudflare Workers and any fetch-based runtime; outbound subrequests execute
 * in the caller's request context.
 */
export function createMcpFetchHandler(
  config: ServerConfig
): (request: Request) => Promise<Response> {
  const pipeline = createRequestPipeline(config)
  return async (request) => {
    try {
      const url = new URL(request.url)
      if (request.method === 'GET' && url.pathname === '/.well-known/oauth-protected-resource') {
        return json(200, pipeline.metadata)
      }
      if (url.pathname !== '/mcp') return json(404, { error: 'not_found' })
      if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' })

      const gate = await pipeline.authorize(request.headers.get('authorization'))
      if ('error' in gate) return json(gate.error.status, gate.error.body, gate.error.headers)

      let body: unknown
      try {
        body = await readRequestBody(request, pipeline.maxBodyBytes)
      } catch {
        return json(400, { error: 'invalid_request' })
      }

      const resolved = await pipeline.resolveContext(gate.principal)
      if ('error' in resolved) return json(resolved.error.status, resolved.error.body, resolved.error.headers)

      const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined })
      const usage = toolCallEvent(body)
      if (usage) config.onEvent?.({ type: usage })
      const server = await pipeline.buildServer(resolved.user, resolved.connection)
      await server.connect(transport)
      const response = await transport.handleRequest(request, { parsedBody: body })
      return closeOnFinish(response, transport)
    } catch {
      return json(500, { error: 'internal_error' })
    }
  }
}

export function createMcpHttpServer(config: ServerConfig): Server {
  const pipeline = createRequestPipeline(config)
  return createHttpServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')

    if (req.method === 'GET' && url.pathname === '/.well-known/oauth-protected-resource') {
      send(res, 200, pipeline.metadata)
      return
    }

    if (url.pathname !== '/mcp') {
      send(res, 404, { error: 'not_found' })
      return
    }

    if (req.method !== 'POST') {
      send(res, 405, { error: 'method_not_allowed' })
      return
    }

    const gate = await pipeline.authorize(req.headers.authorization ?? null)
    if ('error' in gate) {
      send(res, gate.error.status, gate.error.body, gate.error.headers)
      return
    }

    let body: unknown
    try {
      body = await readBody(req, pipeline.maxBodyBytes)
    } catch {
      send(res, 400, { error: 'invalid_request' })
      return
    }

    const resolved = await pipeline.resolveContext(gate.principal)
    if ('error' in resolved) {
      send(res, resolved.error.status, resolved.error.body, resolved.error.headers)
      return
    }

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    const usage = toolCallEvent(body)
    if (usage) config.onEvent?.({ type: usage })
    const server = await pipeline.buildServer(resolved.user, resolved.connection)
    res.on('close', () => {
      transport.close().catch(() => undefined)
    })
    await server.connect(transport)
    await transport.handleRequest(req, res, body)
  })
}
