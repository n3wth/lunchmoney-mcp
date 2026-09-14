export interface CredentialProvider {
  getToken(connectionId: string): Promise<string | undefined>
}

export class NangoCredentialProvider implements CredentialProvider {
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
}
