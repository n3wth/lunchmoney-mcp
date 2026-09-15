// Cloudflare Workers entrypoint. Serves the MCP HTTP surface through a native
// fetch handler (Web Standard Request/Response) so outbound subrequests —
// Nango, Lunch Money, Auth0 JWKS — run inside the request context. The
// node:http bridge (httpServerHandler) is not used: outbound fetch() from it
// fails with Cloudflare error 1042.
import { createReadOnlyAdapter } from '@lunchmoney-mcp/adapter'
import { createMcpFetchHandler } from './index.js'
import { InMemoryIdentityStore } from './identity.js'
import { NangoProvider, type CredentialProvider } from './credentials.js'

type Vars = Record<string, string | undefined>

// Logs upstream status + URL only — never headers or bodies.
const loggingFetch: typeof fetch = async (input, init) => {
  try {
    const response = await fetch(input, init)
    console.warn('upstream fetch:', response.status, String(input instanceof Request ? input.url : input))
    return response
  } catch (error) {
    console.warn('upstream fetch threw:', String(error))
    throw error
  }
}

function required(vars: Vars, name: string): string {
  const value = vars[name]
  if (value === undefined || value === '') throw new Error(`missing required env ${name}`)
  return value
}

let handler: ((request: Request) => Promise<Response>) | undefined

export default {
  fetch(request: Request, env: Vars): Promise<Response> {
    if (handler === undefined) {
      const nangoKey = env.NANGO_SECRET_KEY
      const nango = nangoKey === undefined || nangoKey === ''
        ? undefined
        : new NangoProvider({ secretKey: nangoKey, fetch: loggingFetch })
      // Sanitized upstream-failure log: message strings only (method + status),
      // never headers, bodies, or credentials. Until a real observability sink
      // exists this is the only signal for Nango/Lunch Money failures in tail.
      const instrumented = nango === undefined ? undefined : new Proxy(nango, {
        get: (target, prop, receiver) => {
          const value = Reflect.get(target, prop, receiver)
          if (typeof value !== 'function') return value
          return async (...args: unknown[]) => {
            try {
              return await (value as (...a: unknown[]) => Promise<unknown>).apply(target, args)
            } catch (error) {
              console.warn(`nango.${String(prop)} failed: ${String(error)}`)
              throw error
            }
          }
        }
      })
      const credentials: CredentialProvider = instrumented ?? { getToken: async () => undefined }
      handler = createMcpFetchHandler({
        auth: {
          issuer: required(env, 'LM_AUTH_ISSUER'),
          resource: required(env, 'LM_AUTH_RESOURCE'),
          jwksUri: required(env, 'LM_AUTH_JWKS_URI')
        },
        metadataUrl: required(env, 'LM_METADATA_URL'),
        store: new InMemoryIdentityStore(),
        credentials,
        connectSessions: instrumented,
        adapter: createReadOnlyAdapter(),
        environment: env.LM_ENV === 'production' ? 'production' : 'development'
      })
    }
    return handler(request)
  }
}
