import { test } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import type { Server } from 'node:http'
import { generateKeyPair, createLocalJWKSet, SignJWT, exportJWK } from 'jose'
import { createAccessTokenVerifier } from '@lunchmoney-mcp/auth-contract'
import { createReadOnlyAdapter } from '@lunchmoney-mcp/adapter'
import { createMcpFetchHandler, createMcpHttpServer } from '../src/index.js'
import { InMemoryIdentityStore } from '../src/identity.js'
import type { CredentialProvider } from '../src/credentials.js'

const ISSUER = 'https://issuer.example.com/'
const RESOURCE = 'https://mcp.example.com/mcp'
const JWKS_URI = 'https://issuer.example.com/.well-known/jwks.json'
const METADATA_URL = 'https://mcp.example.com/.well-known/oauth-protected-resource'
const TOKEN = 'lm-sentinel-token'

async function listen(server: Server): Promise<string> {
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const addr = server.address()
  if (addr === null || typeof addr === 'string') throw new Error('no address')
  return `http://127.0.0.1:${addr.port}`
}

const userBody = { id: 1, account_id: 2, budget_name: 'B', primary_currency: 'usd' }

function upstreamFetch() {
  const seen: string[] = []
  const impl = (async (input: RequestInfo | URL) => {
    const req = input instanceof Request ? input : new Request(input)
    seen.push(req.headers.get('authorization') ?? '')
    const path = new URL(req.url).pathname
    if (path === '/v2/me') return new Response(JSON.stringify(userBody), { status: 200 })
    if (path === '/v2/transactions') return new Response(JSON.stringify({ transactions: [], has_more: false }), { status: 200 })
    return new Response(JSON.stringify({ manual_accounts: [], plaid_accounts: [] }), { status: 200 })
  }) as typeof globalThis.fetch
  return { impl, seen }
}

async function setup() {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const jwks = { keys: [{ ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' }] }
  const resolver = createLocalJWKSet(jwks as Parameters<typeof createLocalJWKSet>[0])
  const verify = createAccessTokenVerifier({ issuer: ISSUER, resource: RESOURCE, jwksUri: JWKS_URI }, resolver)

  const sign = (sub: string, scope = 'lunchmoney:read') => new SignJWT({ iss: ISSUER, aud: RESOURCE, sub, scope })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' }).setIssuedAt().setExpirationTime('5m').sign(privateKey)

  const upstream = upstreamFetch()
  const adapter = createReadOnlyAdapter({ fetch: upstream.impl })
  const store = new InMemoryIdentityStore()
  const credentials: CredentialProvider = {
    getToken: async (connectionId) => connectionId === 'conn-1' ? TOKEN : undefined
  }
  const server = createMcpHttpServer({
    auth: { issuer: ISSUER, resource: RESOURCE, jwksUri: JWKS_URI },
    metadataUrl: METADATA_URL,
    store,
    credentials,
    adapter,
    verifyToken: verify
  })
  const base = await listen(server)
  return { server, base, sign, store, upstream }
}

function rpc(body: unknown, token?: string) {
  return (base: string) => fetch(`${base}/mcp`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  })
}

async function rpcJson(base: string, body: unknown, token?: string) {
  const res = await rpc(body, token)(base)
  const text = await res.text()
  const data = text.startsWith('event:') || text.includes('data:')
    ? JSON.parse(text.split('data:')[1].trim())
    : JSON.parse(text)
  return { res, data }
}

test('protected resource metadata endpoint', async () => {
  const { server, base } = await setup()
  try {
    const res = await fetch(`${base}/.well-known/oauth-protected-resource`)
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), {
      resource: RESOURCE,
      authorization_servers: [ISSUER],
      scopes_supported: ['lunchmoney:read'],
      bearer_methods_supported: ['header']
    })
  } finally {
    server.close()
  }
})

test('unauthenticated requests get 401 with resource_metadata challenge', async () => {
  const { server, base } = await setup()
  try {
    const res = await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} })(base)
    assert.equal(res.status, 401)
    const challenge = res.headers.get('www-authenticate') ?? ''
    assert.ok(challenge.startsWith('Bearer resource_metadata="https://mcp.example.com/'))
    assert.ok(challenge.includes('error="invalid_token"'))
  } finally {
    server.close()
  }
})

test('wrong-scope token gets 403 insufficient_scope challenge', async () => {
  const { server, base, sign } = await setup()
  try {
    const token = await sign('auth0|user-a', 'lunchmoney:write')
    const res = await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }, token)(base)
    assert.equal(res.status, 403)
    const challenge = res.headers.get('www-authenticate') ?? ''
    assert.ok(challenge.includes('error="insufficient_scope"'))
    assert.ok(challenge.includes('scope="lunchmoney:read"'))
  } finally {
    server.close()
  }
})

test('initialize and tools/list succeed with valid token', async () => {
  const { server, base, sign } = await setup()
  try {
    const token = await sign('auth0|user-a')
    const init = await rpcJson(base, {
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '0' } }
    }, token)
    assert.equal(init.res.status, 200)
    const list = await rpcJson(base, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }, token)
    const names = list.data.result.tools.map((t: { name: string }) => t.name)
    assert.ok(names.includes('lunchmoney_get_overview'))
    assert.ok(names.includes('lunchmoney_list_accounts'))
    assert.ok(names.includes('lunchmoney_list_transactions'))
    const dataTools = list.data.result.tools.filter((t: { name: string }) =>
      ['lunchmoney_get_overview', 'lunchmoney_list_accounts', 'lunchmoney_list_transactions',
        'lunchmoney_list_categories', 'lunchmoney_list_tags', 'lunchmoney_list_recurring_items',
        'lunchmoney_budget_summary', 'lunchmoney_connection_status'].includes(t.name))
    assert.equal(dataTools.length, 8)
    for (const t of dataTools) {
      assert.equal(t.annotations.readOnlyHint, true)
    }
    const lifecycle = list.data.result.tools.filter((t: { name: string }) =>
      ['lunchmoney_connect', 'lunchmoney_disconnect'].includes(t.name))
    assert.equal(lifecycle.length, 2)
  } finally {
    server.close()
  }
})

test('unconnected user gets actionable tool error, no upstream call', async () => {
  const { server, base, sign, upstream } = await setup()
  try {
    const token = await sign('auth0|lonely')
    const out = await rpcJson(base, {
      jsonrpc: '2.0', id: 3, method: 'tools/call',
      params: { name: 'lunchmoney_get_overview', arguments: {} }
    }, token)
    assert.equal(out.data.result.isError, true)
    assert.match(out.data.result.content[0].text, /No active Lunch Money connection/)
    assert.equal(upstream.seen.length, 0)
  } finally {
    server.close()
  }
})

test('two-user isolation: each sees only own connection token', async () => {
  const { server, base, sign, store, upstream } = await setup()
  try {
    const tokenA = await sign('auth0|user-a')
    const tokenB = await sign('auth0|user-b')

    const userA = await store.getOrCreateUser(ISSUER, 'auth0|user-a')
    await store.beginConnection(userA.userId, 'conn-1', 'development')
    await store.activateConnection(userA.userId, 'conn-1')

    const callB = await rpcJson(base, {
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: 'lunchmoney_get_overview', arguments: {} }
    }, tokenB)
    assert.equal(callB.data.result.isError, true)
    assert.equal(upstream.seen.length, 0)

    const callA = await rpcJson(base, {
      jsonrpc: '2.0', id: 2, method: 'tools/call',
      params: { name: 'lunchmoney_get_overview', arguments: {} }
    }, tokenA)
    assert.notEqual(callA.data.result.isError, true)
    assert.deepEqual(JSON.parse(callA.data.result.content[0].text), userBody)
    assert.equal(upstream.seen.length, 1)
    assert.equal(upstream.seen[0], `Bearer ${TOKEN}`)

    const a = await store.getOrCreateUser(ISSUER, 'auth0|user-a')
    const b = await store.getOrCreateUser(ISSUER, 'auth0|user-b')
    assert.notEqual(a.userId, b.userId)
    const connB = await store.getActiveConnection(b.userId)
    assert.equal(connB, undefined)
  } finally {
    server.close()
  }
})

test('connect returns bounded session link; disconnect deletes connection', async () => {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const jwks = { keys: [{ ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' }] }
  const resolver = createLocalJWKSet(jwks as Parameters<typeof createLocalJWKSet>[0])
  const verify = createAccessTokenVerifier({ issuer: ISSUER, resource: RESOURCE, jwksUri: JWKS_URI }, resolver)
  const sign = (sub: string) => new SignJWT({ iss: ISSUER, aud: RESOURCE, sub, scope: 'lunchmoney:read' })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' }).setIssuedAt().setExpirationTime('5m').sign(privateKey)

  const sessions: string[] = []
  const deleted: string[] = []
  const store = new InMemoryIdentityStore()
  const server = createMcpHttpServer({
    auth: { issuer: ISSUER, resource: RESOURCE, jwksUri: JWKS_URI },
    metadataUrl: METADATA_URL,
    store,
    credentials: { getToken: async () => TOKEN },
    connectSessions: {
      createSession: async (endUserId) => {
        sessions.push(endUserId)
        return { sessionToken: 'st', connectLink: 'https://connect.nango.dev/s/abc', expiresAt: '2026-09-14T12:00:00Z' }
      },
      deleteConnection: async (id) => { deleted.push(id) }
    },
    adapter: createReadOnlyAdapter({ fetch: upstreamFetch().impl }),
    verifyToken: verify
  })
  const base = await listen(server)
  try {
    const token = await sign('auth0|connector')
    const out = await rpcJson(base, {
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: 'lunchmoney_connect', arguments: {} }
    }, token)
    const payload = JSON.parse(out.data.result.content[0].text)
    assert.equal(payload.connect_url, 'https://connect.nango.dev/s/abc')
    assert.equal(sessions.length, 1)
    assert.ok(sessions[0].startsWith('usr_'))

    const user = await store.getOrCreateUser(ISSUER, 'auth0|connector')
    const pending = await store.getActiveConnection(user.userId)
    assert.equal(pending?.state, 'pending')

    const status = await rpcJson(base, {
      jsonrpc: '2.0', id: 2, method: 'tools/call',
      params: { name: 'lunchmoney_connection_status', arguments: {} }
    }, token)
    assert.equal(JSON.parse(status.data.result.content[0].text).state, 'pending')

    const disc = await rpcJson(base, {
      jsonrpc: '2.0', id: 3, method: 'tools/call',
      params: { name: 'lunchmoney_disconnect', arguments: {} }
    }, token)
    assert.equal(JSON.parse(disc.data.result.content[0].text).result, 'disconnected')
    assert.equal(deleted.length, 0)
    assert.equal((await store.getActiveConnection(user.userId)), undefined)

    const disc2 = await rpcJson(base, {
      jsonrpc: '2.0', id: 4, method: 'tools/call',
      params: { name: 'lunchmoney_disconnect', arguments: {} }
    }, token)
    assert.equal(JSON.parse(disc2.data.result.content[0].text).result, 'none')
  } finally {
    server.close()
  }
})

test('placeholder pending connection reconciles via end_user_id discovery', async () => {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const jwks = { keys: [{ ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' }] }
  const resolver = createLocalJWKSet(jwks as Parameters<typeof createLocalJWKSet>[0])
  const verify = createAccessTokenVerifier({ issuer: ISSUER, resource: RESOURCE, jwksUri: JWKS_URI }, resolver)
  const sign = (sub: string) => new SignJWT({ iss: ISSUER, aud: RESOURCE, sub, scope: 'lunchmoney:read' })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' }).setIssuedAt().setExpirationTime('5m').sign(privateKey)

  const discovered: string[] = []
  const store = new InMemoryIdentityStore()
  const upstream = upstreamFetch()
  const credentials: CredentialProvider & {
    validateToken(t: string): Promise<boolean>
    findConnectionId(endUserId: string): Promise<string | undefined>
  } = {
    getToken: async (id) => id === 'conn-real' ? TOKEN : undefined,
    validateToken: async (t) => t === TOKEN,
    findConnectionId: async (endUserId) => {
      discovered.push(endUserId)
      return 'conn-real'
    }
  }
  const server = createMcpHttpServer({
    auth: { issuer: ISSUER, resource: RESOURCE, jwksUri: JWKS_URI },
    metadataUrl: METADATA_URL,
    store,
    credentials,
    adapter: createReadOnlyAdapter({ fetch: upstream.impl }),
    verifyToken: verify
  })
  const base = await listen(server)
  try {
    const token = await sign('auth0|reconciler')
    const user = await store.getOrCreateUser(ISSUER, 'auth0|reconciler')
    await store.replaceConnection(user.userId, `pending:${user.userId}`, 'development')

    const status = await rpcJson(base, {
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: 'lunchmoney_connection_status', arguments: {} }
    }, token)
    assert.deepEqual(discovered, [user.userId])
    assert.equal(JSON.parse(status.data.result.content[0].text).state, 'active')

    const out = await rpcJson(base, {
      jsonrpc: '2.0', id: 2, method: 'tools/call',
      params: { name: 'lunchmoney_get_overview', arguments: {} }
    }, token)
    assert.notEqual(out.data.result.isError, true)
    assert.deepEqual(JSON.parse(out.data.result.content[0].text), userBody)
    assert.equal(upstream.seen[0], `Bearer ${TOKEN}`)
  } finally {
    server.close()
  }
})

test('per-user rate limiting returns 429 with retry-after', async () => {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const jwks = { keys: [{ ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' }] }
  const resolver = createLocalJWKSet(jwks as Parameters<typeof createLocalJWKSet>[0])
  const verify = createAccessTokenVerifier({ issuer: ISSUER, resource: RESOURCE, jwksUri: JWKS_URI }, resolver)
  const sign = (sub: string) => new SignJWT({ iss: ISSUER, aud: RESOURCE, sub, scope: 'lunchmoney:read' })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' }).setIssuedAt().setExpirationTime('5m').sign(privateKey)
  const events: { type: string; userId?: string }[] = []
  const server = createMcpHttpServer({
    auth: { issuer: ISSUER, resource: RESOURCE, jwksUri: JWKS_URI },
    metadataUrl: METADATA_URL,
    store: new InMemoryIdentityStore(),
    credentials: { getToken: async () => TOKEN },
    adapter: createReadOnlyAdapter({ fetch: upstreamFetch().impl }),
    verifyToken: verify,
    rateLimit: { windowMs: 60000, maxPerUser: 2, maxTotal: 100 },
    onEvent: (e) => events.push(e)
  })
  const base = await listen(server)
  try {
    const tokenA = await sign('auth0|rl-a')
    const tokenB = await sign('auth0|rl-b')
    const call = (t: string) => rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }, t)(base)
    assert.equal((await call(tokenA)).status, 200)
    assert.equal((await call(tokenA)).status, 200)
    const limited = await call(tokenA)
    assert.equal(limited.status, 429)
    assert.equal(limited.headers.get('retry-after'), '60')
    assert.equal((await call(tokenB)).status, 200)
    assert.ok(events.some((e) => e.type === 'rate_limited'))
  } finally {
    server.close()
  }
})

test('fetch handler serves the same surface (Workers entrypoint path)', async () => {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const jwks = { keys: [{ ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' }] }
  const resolver = createLocalJWKSet(jwks as Parameters<typeof createLocalJWKSet>[0])
  const verify = createAccessTokenVerifier({ issuer: ISSUER, resource: RESOURCE, jwksUri: JWKS_URI }, resolver)
  const sign = (sub: string) => new SignJWT({ iss: ISSUER, aud: RESOURCE, sub, scope: 'lunchmoney:read' })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' }).setIssuedAt().setExpirationTime('5m').sign(privateKey)

  const upstream = upstreamFetch()
  const handler = createMcpFetchHandler({
    auth: { issuer: ISSUER, resource: RESOURCE, jwksUri: JWKS_URI },
    metadataUrl: METADATA_URL,
    store: new InMemoryIdentityStore(),
    credentials: { getToken: async () => TOKEN },
    adapter: createReadOnlyAdapter({ fetch: upstream.impl }),
    verifyToken: verify
  })
  const req = (body: unknown, token?: string) => new Request('https://worker.test/mcp', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  })
  const parse = async (res: Response) => {
    const text = await res.text()
    return text.includes('data:') ? JSON.parse(text.split('data:')[1].trim()) : JSON.parse(text)
  }

  const meta = await handler(new Request('https://worker.test/.well-known/oauth-protected-resource'))
  assert.equal(meta.status, 200)
  assert.equal((await meta.json() as { resource: string }).resource, RESOURCE)

  const noAuth = await handler(req({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }))
  assert.equal(noAuth.status, 401)
  assert.ok((noAuth.headers.get('www-authenticate') ?? '').includes('error="invalid_token"'))

  const token = await sign('auth0|fetch-user')
  const list = await handler(req({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }, token))
  assert.equal(list.status, 200)
  const listData = await parse(list)
  assert.ok(listData.result.tools.some((t: { name: string }) => t.name === 'lunchmoney_connect'))

  const call = await handler(req({
    jsonrpc: '2.0', id: 3, method: 'tools/call',
    params: { name: 'lunchmoney_get_overview', arguments: {} }
  }, token))
  const callData = await parse(call)
  assert.equal(callData.result.isError, true)
  assert.match(callData.result.content[0].text, /No active Lunch Money connection/)
})

test('connection lifecycle: pending not usable, replace revokes old, mark states', async () => {
  const store = new InMemoryIdentityStore()
  const u = await store.getOrCreateUser(ISSUER, 'auth0|u')
  const pending = await store.beginConnection(u.userId, 'c1', 'development')
  assert.equal(pending.state, 'pending')
  const active = await store.activateConnection(u.userId, 'c1')
  assert.equal(active.state, 'active')
  await assert.rejects(store.beginConnection(u.userId, 'c2', 'development'))
  const replaced = await store.replaceConnection(u.userId, 'c2', 'development')
  assert.equal(replaced.state, 'pending')
  const c1 = await store.getActiveConnection(u.userId)
  assert.equal(c1?.connectionId, 'c2')
  assert.equal(c1?.state, 'pending')
  await store.activateConnection(u.userId, 'c2')
  const marked = await store.markConnection(u.userId, 'c2', 'revoked')
  assert.equal(marked?.state, 'revoked')
  assert.equal(await store.getActiveConnection(u.userId), undefined)
  const foreign = await store.markConnection('usr_other', 'c2', 'deleted')
  assert.equal(foreign, undefined)
})
