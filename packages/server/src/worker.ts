// Native fetch entrypoint: cloudflare:node httpServerHandler breaks outbound
// fetch in workerd with error 1042. Both transports use the shared pipeline.
import { createReadOnlyAdapter } from '@lunchmoney-mcp/adapter'
import { createMcpFetchHandler } from './index.js'
import { D1IdentityStore, type IdentityDatabase } from './d1-identity.js'
import { createObserver, type AnalyticsSink } from './observability.js'
import { createNangoWebhook } from './webhook.js'
import { NangoProvider } from './credentials.js'

interface Env {
  IDENTITY_DB: IdentityDatabase
  TELEMETRY?: AnalyticsSink
  NANGO_SECRET_KEY: string
  NANGO_WEBHOOK_SIGNING_KEY?: string
  NANGO_ENVIRONMENT: string
  LM_AUTH_ISSUER: string
  LM_AUTH_RESOURCE: string
  LM_AUTH_JWKS_URI: string
  LM_METADATA_URL: string
  LM_ENV: string
}

function createHandlers(env: Env) {
  const onEvent = createObserver(env.TELEMETRY)
  const store = new D1IdentityStore(env.IDENTITY_DB)
  // Invoke fetch as a free function, never with a provider receiver (workerd).
  const loggingFetch: typeof fetch = async (input, init) => {
    try {
      const response = await fetch(input, init)
      onEvent({ type: 'upstream_response', status: response.status })
      return response
    } catch {
      onEvent({ type: 'upstream_failed' })
      throw new Error('upstream fetch failed')
    }
  }
  const nango = new NangoProvider({ secretKey: env.NANGO_SECRET_KEY, fetch: loggingFetch })
  const webhook = env.NANGO_WEBHOOK_SIGNING_KEY
    ? createNangoWebhook({ signingKey: env.NANGO_WEBHOOK_SIGNING_KEY,
      environment: env.NANGO_ENVIRONMENT, store, credentials: nango, onEvent })
    : undefined
  const mcp = createMcpFetchHandler({
    auth: { issuer: env.LM_AUTH_ISSUER, resource: env.LM_AUTH_RESOURCE, jwksUri: env.LM_AUTH_JWKS_URI },
    metadataUrl: env.LM_METADATA_URL,
    store, onEvent, credentials: nango, connectSessions: nango,
    adapter: createReadOnlyAdapter(),
    environment: env.LM_ENV === 'production' ? 'production' : 'development'
  })
  return { mcp, webhook, onEvent }
}

// Cache the pipeline to preserve per-isolate rate-limit counters and JWKS.
// Identity and connection state live in D1, never in this isolate.
let handlers: ReturnType<typeof createHandlers> | undefined

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      handlers ??= createHandlers(env)
      if (new URL(request.url).pathname === '/webhooks/nango') {
        return handlers.webhook ? await handlers.webhook(request) : new Response(null, { status: 503 })
      }
      return await handlers.mcp(request)
    } catch {
      createObserver(env.TELEMETRY)({ type: 'request_failed', status: 503 })
      return Response.json({ error: 'service_unavailable' }, { status: 503 })
    }
  }
}
