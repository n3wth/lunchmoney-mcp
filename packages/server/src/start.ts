import { createReadOnlyAdapter } from '@lunchmoney-mcp/adapter'
import { createMcpHttpServer } from './index.js'
import { InMemoryIdentityStore } from './identity.js'
import { NangoProvider, type CredentialProvider } from './credentials.js'

function required(name: string): string {
  const value = process.env[name]
  if (value === undefined || value === '') {
    console.error(`missing required env ${name}`)
    process.exit(1)
  }
  return value
}

const issuer = required('LM_AUTH_ISSUER')
const resource = required('LM_AUTH_RESOURCE')
const jwksUri = required('LM_AUTH_JWKS_URI')
const metadataUrl = required('LM_METADATA_URL')
const port = Number(process.env.PORT ?? '8787')
const environment = process.env.LM_ENV === 'production' ? 'production' : 'development'

const nangoKey = process.env.NANGO_SECRET_KEY
const nango = nangoKey !== undefined && nangoKey !== '' ? new NangoProvider({ secretKey: nangoKey }) : undefined
const credentials: CredentialProvider = nango ?? { getToken: async () => undefined }

const server = createMcpHttpServer({
  auth: { issuer, resource, jwksUri },
  metadataUrl,
  store: new InMemoryIdentityStore(),
  credentials,
  connectSessions: nango,
  adapter: createReadOnlyAdapter(),
  environment
})

server.listen(port, () => {
  console.log(`lunchmoney-mcp listening on :${port}`)
})
