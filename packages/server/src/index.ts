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
import type { CredentialProvider, ConnectSessionProvider } from './credentials.js'
import { createReadOnlyServer } from './tools.js'

export interface ServerConfig {
  auth: AuthConfig
  metadataUrl: string
  store: IdentityStore
  credentials: CredentialProvider
  connectSessions?: ConnectSessionProvider
  environment?: 'development' | 'production'
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
    const connection = await config.store.getActiveConnection(user.userId)

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
