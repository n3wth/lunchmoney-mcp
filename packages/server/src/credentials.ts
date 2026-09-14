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

export class NangoProvider implements CredentialProvider, ConnectSessionProvider {
  private readonly secretKey: string
  private readonly baseUrl: string
  private readonly fetchImpl: typeof globalThis.fetch

  constructor(options: { secretKey: string; baseUrl?: string; fetch?: typeof globalThis.fetch }) {
    this.secretKey = options.secretKey
    this.baseUrl = options.baseUrl ?? 'https://api.nango.dev'
    this.fetchImpl = options.fetch ?? globalThis.fetch
  }

  async getToken(connectionId: string): Promise<string | undefined> {
    const url = new URL(`/connection/${encodeURIComponent(connectionId)}`, this.baseUrl)
    url.searchParams.set('provider_config_key', 'lunchmoney')
    const response = await this.fetchImpl(url, {
      headers: { authorization: `Bearer ${this.secretKey}` }
    })
    if (response.status === 404) return undefined
    if (!response.ok) throw new Error('nango lookup failed')
    const body = await response.json() as { credentials?: { type?: string; access_token?: string; token?: string } }
    const token = body.credentials?.access_token ?? body.credentials?.token
    return typeof token === 'string' && token.length > 0 ? token : undefined
  }

  async createSession(endUserId: string): Promise<ConnectSessionResult> {
    const response = await this.fetchImpl(new URL('/connect/sessions', this.baseUrl), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.secretKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        end_user_id: endUserId,
        allowed_integrations: ['lunchmoney'],
        tags: { end_user_id: endUserId }
      })
    })
    if (!response.ok) throw new Error('connect session failed')
    const body = await response.json() as {
      data?: { token?: string; connect_link?: string; expires_at?: string }
    }
    const token = body.data?.token
    const link = body.data?.connect_link
    const expiresAt = body.data?.expires_at
    if (typeof token !== 'string' || typeof link !== 'string' || typeof expiresAt !== 'string') {
      throw new Error('connect session failed')
    }
    return { sessionToken: token, connectLink: link, expiresAt }
  }

  async deleteConnection(connectionId: string): Promise<void> {
    const url = new URL(`/connection/${encodeURIComponent(connectionId)}`, this.baseUrl)
    url.searchParams.set('provider_config_key', 'lunchmoney')
    const response = await this.fetchImpl(url, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${this.secretKey}` }
    })
    if (!response.ok && response.status !== 404) throw new Error('nango delete failed')
  }
}
