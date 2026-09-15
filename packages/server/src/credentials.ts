import type { IdentityStore } from './identity.js'

const INTEGRATION_KEY = 'lunch-money'
const DEFAULT_NANGO_URL = 'https://api.nango.dev'
const DEFAULT_LUNCHMONEY_URL = 'https://api.lunchmoney.dev'

export interface CredentialProvider {
  getToken(connectionId: string): Promise<string | undefined>
}

export interface ConnectSessionResult {
  sessionToken: string
  connectLink: string
  expiresAt: string
}

export interface ConnectSessionProvider {
  createSession(endUserId: string): Promise<ConnectSessionResult>
  deleteConnection(connectionId: string): Promise<void>
}

export interface CredentialValidator {
  validateToken(token: string): Promise<boolean>
}

export interface ConnectionDiscovery {
  findConnectionId(endUserId: string): Promise<string | undefined>
}

function nangoError(operation: string, status?: number): Error {
  return new Error(status === undefined
    ? `nango ${operation} failed`
    : `nango ${operation} failed (status ${status})`)
}

export class NangoProvider implements CredentialProvider, ConnectSessionProvider, CredentialValidator, ConnectionDiscovery {
  private readonly secretKey: string
  private readonly baseUrl: string
  private readonly lunchmoneyUrl: string
  private readonly fetchImpl: typeof globalThis.fetch

  constructor(options: {
    secretKey: string
    baseUrl?: string
    lunchmoneyUrl?: string
    fetch?: typeof globalThis.fetch
  }) {
    if (options.secretKey === '') throw new Error('nango secret key required')
    this.secretKey = options.secretKey
    this.baseUrl = options.baseUrl ?? DEFAULT_NANGO_URL
    this.lunchmoneyUrl = options.lunchmoneyUrl ?? DEFAULT_LUNCHMONEY_URL
    // Wrap rather than storing the impl directly: `this.fetchImpl(...)` invokes
    // it with the provider as `this`, and workerd's `fetch` throws
    // "Illegal invocation" on a non-global receiver (Node's fetch ignores it).
    const provided = options.fetch
    this.fetchImpl = (input, init) => (provided ?? globalThis.fetch)(input, init)
  }

  async getToken(connectionId: string): Promise<string | undefined> {
    const url = new URL(`/connections/${encodeURIComponent(connectionId)}`, this.baseUrl)
    url.searchParams.set('provider_config_key', INTEGRATION_KEY)
    let response: Response
    try {
      response = await this.fetchImpl(url, {
        headers: { authorization: `Bearer ${this.secretKey}` }
      })
    } catch {
      throw nangoError('connection lookup')
    }
    if (response.status === 404) return undefined
    if (!response.ok) throw nangoError('connection lookup', response.status)
    let body: unknown
    try {
      body = await response.json()
    } catch {
      throw nangoError('connection lookup')
    }
    const credentials = (body as { credentials?: Record<string, unknown> } | null)?.credentials
    const token = credentials?.apiKey ?? credentials?.access_token ?? credentials?.token
    return typeof token === 'string' && token.length > 0 ? token : undefined
  }

  async findConnectionId(endUserId: string): Promise<string | undefined> {
    let response: Response
    try {
      response = await this.fetchImpl(new URL('/connections', this.baseUrl), {
        headers: { authorization: `Bearer ${this.secretKey}` }
      })
    } catch {
      throw nangoError('connection list')
    }
    if (!response.ok) throw nangoError('connection list', response.status)
    let body: unknown
    try {
      body = await response.json()
    } catch {
      throw nangoError('connection list')
    }
    const connections = (body as { connections?: unknown[] } | null)?.connections ?? []
    let newest: { id: string; created: string } | undefined
    for (const conn of connections) {
      const c = conn as {
        connection_id?: unknown
        provider_config_key?: unknown
        created?: unknown
        tags?: { end_user_id?: unknown } | null
      }
      if (c.provider_config_key !== INTEGRATION_KEY) continue
      if (c.tags?.end_user_id !== endUserId) continue
      if (typeof c.connection_id !== 'string') continue
      const created = typeof c.created === 'string' ? c.created : ''
      if (newest === undefined || created > newest.created) {
        newest = { id: c.connection_id, created }
      }
    }
    return newest?.id
  }

  async validateToken(token: string): Promise<boolean> {
    const url = new URL('/v2/me', this.lunchmoneyUrl)
    let response: Response
    try {
      response = await this.fetchImpl(url, {
        headers: { authorization: `Bearer ${token}` }
      })
    } catch {
      throw new Error('lunch money credential validation failed')
    }
    if (response.status === 200) return true
    if (response.status === 401 || response.status === 403) return false
    throw new Error(`lunch money credential validation failed (status ${response.status})`)
  }

  async createSession(endUserId: string): Promise<ConnectSessionResult> {
    let response: Response
    try {
      response = await this.fetchImpl(new URL('/connect/sessions', this.baseUrl), {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.secretKey}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          allowed_integrations: [INTEGRATION_KEY],
          tags: { end_user_id: endUserId }
        })
      })
    } catch {
      throw nangoError('connect session')
    }
    if (!response.ok) throw nangoError('connect session', response.status)
    let body: unknown
    try {
      body = await response.json()
    } catch {
      throw nangoError('connect session')
    }
    const data = (body as { data?: Record<string, unknown> } | null)?.data
    const token = data?.token
    const link = data?.connect_link
    const expiresAt = data?.expires_at
    if (typeof token !== 'string' || typeof link !== 'string' || typeof expiresAt !== 'string') {
      throw nangoError('connect session')
    }
    return { sessionToken: token, connectLink: link, expiresAt }
  }

  async deleteConnection(connectionId: string): Promise<void> {
    const url = new URL(`/connections/${encodeURIComponent(connectionId)}`, this.baseUrl)
    url.searchParams.set('provider_config_key', INTEGRATION_KEY)
    let response: Response
    try {
      response = await this.fetchImpl(url, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${this.secretKey}` }
      })
    } catch {
      throw nangoError('connection delete')
    }
    if (!response.ok && response.status !== 404) throw nangoError('connection delete', response.status)
  }
}

export type ActivationResult = 'active' | 'invalid'

/**
 * Retrieves the stored credential for a pending connection, validates it
 * against Lunch Money (`GET /v2/me`), and only then activates it.
 * Missing or rejected credentials mark the connection 'invalid'.
 */
export async function validateAndActivateConnection(options: {
  credentials: CredentialProvider & Partial<CredentialValidator>
  store: IdentityStore
  userId: string
  connectionId: string
}): Promise<ActivationResult> {
  const { credentials, store, userId, connectionId } = options
  const token = await credentials.getToken(connectionId)
  const valid = token !== undefined &&
    (credentials.validateToken === undefined || await credentials.validateToken(token))
  if (!valid) {
    await store.markConnection(userId, connectionId, 'invalid')
    return 'invalid'
  }
  await store.activateConnection(userId, connectionId)
  return 'active'
}
