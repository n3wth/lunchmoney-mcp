import type { IdentityStore } from './identity.js'
import { validateAndActivateConnection, type CredentialProvider, type CredentialValidator } from './credentials.js'

export function createNangoWebhook(options: {
  signingKey: string
  environment: string
  store: IdentityStore
  credentials: CredentialProvider & CredentialValidator
  onEvent?: (event: { type: string; status?: number }) => void
}) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') return new Response(null, { status: 405 })
    const signature = request.headers.get('x-nango-hmac-sha256')
    if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) return new Response(null, { status: 401 })
    const reader = request.body?.getReader()
    if (!reader) return new Response(null, { status: 400 })
    const chunks: Uint8Array[] = []
    let size = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > 65536) {
        await reader.cancel()
        return new Response(null, { status: 413 })
      }
      chunks.push(value)
    }
    const body = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length }
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(options.signingKey),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const bytes = Uint8Array.from(signature.match(/../g)!, hex => parseInt(hex, 16))
    if (!await crypto.subtle.verify('HMAC', key, bytes, body)) return new Response(null, { status: 401 })
    let event
    try { event = JSON.parse(new TextDecoder().decode(body)) } catch { return new Response(null, { status: 400 }) }
    if (!event || typeof event !== 'object') return new Response(null, { status: 400 })
    if (event.type !== 'auth' || event.providerConfigKey !== 'lunch-money' ||
        event.environment !== options.environment || event.success !== true ||
        !['creation', 'deletion'].includes(event.operation)) return new Response(null, { status: 204 })
    const userId = event.tags?.end_user_id
    const connectionId = event.connectionId
    if (typeof userId !== 'string' || typeof connectionId !== 'string' || !connectionId || connectionId.startsWith('pending:')) {
      return new Response(null, { status: 400 })
    }
    try {
      if (!await options.store.getUser(userId)) return new Response(null, { status: 204 })
      if (event.operation === 'deletion') {
        await options.store.markConnection(userId, connectionId, 'deleted')
      } else {
        await options.store.claimPendingConnection(userId, connectionId)
        const conn = await options.store.getActiveConnection(userId)
        // Replays cannot revive a tombstone or overwrite another connection.
        if (conn?.connectionId === connectionId && conn.state === 'pending') {
          await validateAndActivateConnection({ ...options, userId, connectionId })
        }
      }
      options.onEvent?.({ type: 'webhook_processed', status: 204 })
      return new Response(null, { status: 204 })
    } catch {
      options.onEvent?.({ type: 'webhook_failed', status: 503 })
      return new Response(null, { status: 503 })
    }
  }
}
