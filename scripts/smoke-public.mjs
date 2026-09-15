import assert from 'node:assert/strict'

const endpoint = new URL(process.argv[2] ?? 'https://mcp.lunchmoney.sh/mcp')
assert.equal(endpoint.protocol, 'https:', 'use an HTTPS MCP endpoint')
assert.equal(endpoint.pathname, '/mcp')
assert.ok(!endpoint.username && !endpoint.password && !endpoint.search && !endpoint.hash)
const metadataUrl = new URL('/.well-known/oauth-protected-resource', endpoint)
const request = (url, init = {}) => fetch(url, {
  ...init,
  redirect: 'error',
  signal: AbortSignal.timeout(15000)
})

const metadataResponse = await request(metadataUrl)
assert.equal(metadataResponse.status, 200, 'public metadata status')
const metadata = await metadataResponse.json()
assert.equal(metadata.resource, endpoint.href, 'metadata audience must match requested endpoint')
assert.deepEqual(metadata.authorization_servers, ['https://newth.us.auth0.com/'])
console.log('metadata: correct public audience and issuer')

for (const authorization of [undefined, 'Bearer invalid-smoke-token']) {
  const response = await request(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...(authorization ? { authorization } : {})
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
  })
  assert.equal(response.status, 401, `${authorization ? 'invalid' : 'missing'} token must be rejected`)
  const challenge = response.headers.get('www-authenticate') ?? ''
  assert.match(challenge, /^Bearer\b/i)
  assert.ok(challenge.includes(`resource_metadata="${metadataUrl.href}"`), 'challenge must link public metadata')
  await response.arrayBuffer()
}
console.log('MCP: missing and invalid credentials rejected with discovery challenge')

// A well-formed but incorrect signature exercises HMAC verification without a secret.
const webhook = await request(new URL('/webhooks/nango', endpoint), {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-nango-hmac-sha256': '0'.repeat(64) },
  body: '{}'
})
assert.equal(webhook.status, 401, 'forged webhook must be rejected (503 means signing key is missing)')
await webhook.arrayBuffer()
console.log('webhook: forged HMAC rejected')
console.log(`Public smoke checks passed: ${endpoint.href}`)
