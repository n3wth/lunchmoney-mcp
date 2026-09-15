import { createServer as createHttpServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {
  createAccessTokenVerifier,
  protectedResourceMetadata,
  bearerChallenge,
  AuthorizationError,
  type AuthConfig,
  type Principal
} from '@lunchmoney-mcp/auth-contract'
import type { createReadOnlyAdapter } from '@lunchmoney-mcp/adapter'
import type { IdentityStore } from './identity.js'
import { validateAndActivateConnection, type CredentialProvider, type ConnectSessionProvider, type ConnectionDiscovery } from './credentials.js'
import { createReadOnlyServer } from './tools.js'

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

function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, { 'content-type': 'application/json', ...headers })
  res.end(payload)
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

export function createMcpHttpServer(config: ServerConfig): Server {
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

  return createHttpServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')

    if (req.method === 'GET' && url.pathname === '/.well-known/oauth-protected-resource') {
      send(res, 200, metadata)
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

    let principal: Principal
    try {
      principal = await verify(req.headers.authorization ?? null)
    } catch (error) {
      if (error instanceof AuthorizationError) {
        const challenge = bearerChallenge(config.auth, config.metadataUrl, error.code)
        send(res, error.status, { error: error.code }, { 'www-authenticate': challenge })
        return
      }
      send(res, 401, { error: 'invalid_token' }, {
        'www-authenticate': bearerChallenge(config.auth, config.metadataUrl, 'invalid_token')
      })
      return
    }

    let body: unknown
    try {
      body = await readBody(req, maxBodyBytes)
    } catch {
      send(res, 400, { error: 'invalid_request' })
      return
    }

    const user = await config.store.getOrCreateUser(principal.issuer, principal.subject)
    if (rateLimited(user.userId)) {
      emit('rate_limited', user.userId, 429)
      send(res, 429, { error: 'rate_limited' }, { 'retry-after': '60' })
      return
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
          connection = await config.store.replaceConnection(
            user.userId, discovered, connection.environment)
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

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    const store = config.store
    const environment = config.environment ?? 'development'
    const sessions = config.connectSessions
    const server = createReadOnlyServer({
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
    res.on('close', () => {
      transport.close().catch(() => undefined)
    })
    await server.connect(transport)
    await transport.handleRequest(req, res, body)
  })
}
