import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NangoProvider, validateAndActivateConnection } from '../src/credentials.js'
import { InMemoryIdentityStore } from '../src/identity.js'

const SECRET = 'nango-secret-shhh'
const API_TOKEN = 'lm-user-token-shhh'
const CONNECTION_ID = 'e0eeb7b1-ee2c-4410-9a72-1ed1a8291197'
const ISSUER = 'https://issuer.example.com/'

interface SeenRequest {
  url: string
  method: string
  authorization: string | null
  body: unknown
}

function mockFetch(handler: (req: SeenRequest) => Response | Promise<Response>) {
  const seen: SeenRequest[] = []
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = input instanceof Request ? input : new Request(input, init)
    const record: SeenRequest = {
      url: req.url,
      method: req.method,
      authorization: req.headers.get('authorization'),
      body: req.method !== 'GET' && req.method !== 'DELETE' ? await req.clone().json().catch(() => undefined) : undefined
    }
    seen.push(record)
    return handler(record)
  }) as typeof globalThis.fetch
  return { impl, seen }
}

const connectionBody = {
  id: 1,
  connection_id: CONNECTION_ID,
  provider_config_key: 'lunch-money',
  credentials: { type: 'API_KEY', apiKey: API_TOKEN }
}

function provider(handler: (req: SeenRequest) => Response | Promise<Response>) {
  const mock = mockFetch(handler)
  const nango = new NangoProvider({ secretKey: SECRET, fetch: mock.impl })
  return { nango, seen: mock.seen }
}

test('getToken reads credentials.apiKey and uses lunch-money integration key', async () => {
  const { nango, seen } = provider(() => new Response(JSON.stringify(connectionBody), { status: 200 }))
  const token = await nango.getToken(CONNECTION_ID)
  assert.equal(token, API_TOKEN)
  assert.equal(seen.length, 1)
  const url = new URL(seen[0].url)
  assert.equal(url.pathname, `/connections/${CONNECTION_ID}`)
  assert.equal(url.searchParams.get('provider_config_key'), 'lunch-money')
  assert.equal(seen[0].authorization, `Bearer ${SECRET}`)
})

test('getToken returns undefined on 404 and on missing credentials', async () => {
  const missing = provider(() => new Response(JSON.stringify({ error: 'not found' }), { status: 404 }))
  assert.equal(await missing.nango.getToken(CONNECTION_ID), undefined)
  const noCreds = provider(() => new Response(JSON.stringify({ id: 1, credentials: null }), { status: 200 }))
  assert.equal(await noCreds.nango.getToken(CONNECTION_ID), undefined)
})

test('getToken error is sanitized: no secret, token or upstream body', async () => {
  const { nango } = provider(() => new Response(
    JSON.stringify({ error: `denied for key ${SECRET} and token ${API_TOKEN}` }),
    { status: 500 }
  ))
  const err = await nango.getToken(CONNECTION_ID).then(() => undefined, (e: Error) => e)
  assert.ok(err instanceof Error)
  assert.ok(!err.message.includes(SECRET))
  assert.ok(!err.message.includes(API_TOKEN))
  assert.ok(!err.message.includes('denied'))
})

test('getToken sanitizes network errors that may embed request details', async () => {
  const nango = new NangoProvider({
    secretKey: SECRET,
    fetch: (async () => { throw new Error(`fetch failed: Bearer ${SECRET}`) }) as typeof globalThis.fetch
  })
  const err = await nango.getToken(CONNECTION_ID).then(() => undefined, (e: Error) => e)
  assert.ok(err instanceof Error)
  assert.ok(!err.message.includes(SECRET))
})

test('fetch impl is invoked without a receiver (workerd illegal-invocation guard)', async () => {
  // workerd's `fetch` throws "Illegal invocation" when called on a non-global
  // `this` (e.g. as `this.fetchImpl(...)`). A plain function sees `this ===
  // undefined` under strict mode, so a throwing-on-receiver mock reproduces it.
  let receiver: unknown = 'unset'
  const impl = function (this: unknown) {
    receiver = this
    return Promise.resolve(new Response(JSON.stringify(connectionBody), { status: 200 }))
  } as typeof globalThis.fetch
  const nango = new NangoProvider({ secretKey: SECRET, fetch: impl })
  assert.equal(await nango.getToken(CONNECTION_ID), API_TOKEN)
  assert.equal(receiver, undefined)
})

test('createSession restricts to lunch-money and tags the end user', async () => {
  const { nango, seen } = provider(() => new Response(JSON.stringify({
    data: { token: 'sess-tok', connect_link: 'https://connect.nango.dev/s/x', expires_at: '2026-09-14T12:00:00Z' }
  }), { status: 201 }))
  const session = await nango.createSession('test_oliver_newth')
  assert.equal(session.sessionToken, 'sess-tok')
  assert.equal(session.connectLink, 'https://connect.nango.dev/s/x')
  assert.equal(session.expiresAt, '2026-09-14T12:00:00Z')
  const url = new URL(seen[0].url)
  assert.equal(url.pathname, '/connect/sessions')
  assert.equal(seen[0].method, 'POST')
  assert.deepEqual(seen[0].body, {
    allowed_integrations: ['lunch-money'],
    tags: { end_user_id: 'test_oliver_newth' }
  })
})

test('deleteConnection is idempotent: 200 and 404 both succeed', async () => {
  const okDelete = provider(() => new Response(JSON.stringify({ success: true }), { status: 200 }))
  await okDelete.nango.deleteConnection(CONNECTION_ID)
  const url = new URL(okDelete.seen[0].url)
  assert.equal(url.pathname, `/connections/${CONNECTION_ID}`)
  assert.equal(url.searchParams.get('provider_config_key'), 'lunch-money')
  assert.equal(okDelete.seen[0].method, 'DELETE')

  const goneDelete = provider(() => new Response(JSON.stringify({ error: 'not found' }), { status: 404 }))
  await goneDelete.nango.deleteConnection(CONNECTION_ID)

  const failDelete = provider(() => new Response(JSON.stringify({ error: `key ${SECRET}` }), { status: 500 }))
  const err = await failDelete.nango.deleteConnection(CONNECTION_ID).then(() => undefined, (e: Error) => e)
  assert.ok(err instanceof Error)
  assert.ok(!err.message.includes(SECRET))
})

test('validateToken calls api.lunchmoney.dev/v2/me and maps 401/403 to false', async () => {
  const good = provider((req) => {
    assert.equal(req.url, 'https://api.lunchmoney.dev/v2/me')
    assert.equal(req.authorization, `Bearer ${API_TOKEN}`)
    return new Response(JSON.stringify({ id: 1 }), { status: 200 })
  })
  assert.equal(await good.nango.validateToken(API_TOKEN), true)

  for (const status of [401, 403]) {
    const bad = provider(() => new Response(JSON.stringify({ error: `bad token ${API_TOKEN}` }), { status }))
    assert.equal(await bad.nango.validateToken(API_TOKEN), false)
  }
})

test('validateToken error is sanitized on unexpected status', async () => {
  const { nango } = provider(() => new Response(
    JSON.stringify({ error: `upstream saw ${API_TOKEN} via ${SECRET}` }),
    { status: 500 }
  ))
  const err = await nango.validateToken(API_TOKEN).then(() => undefined, (e: Error) => e)
  assert.ok(err instanceof Error)
  assert.ok(!err.message.includes(SECRET))
  assert.ok(!err.message.includes(API_TOKEN))
})

test('validateAndActivateConnection activates on valid credential', async () => {
  const store = new InMemoryIdentityStore()
  const user = await store.getOrCreateUser(ISSUER, 'auth0|u')
  await store.beginConnection(user.userId, CONNECTION_ID, 'development')
  const { nango, seen } = provider((req) => {
    const path = new URL(req.url).pathname
    if (path.startsWith('/connections/')) {
      return new Response(JSON.stringify(connectionBody), { status: 200 })
    }
    return new Response(JSON.stringify({ id: 1 }), { status: 200 })
  })
  const result = await validateAndActivateConnection({
    credentials: nango, store, userId: user.userId, connectionId: CONNECTION_ID
  })
  assert.equal(result, 'active')
  assert.equal(seen.length, 2)
  const conn = await store.getActiveConnection(user.userId)
  assert.equal(conn?.state, 'active')
})

test('validateAndActivateConnection marks invalid on 401 from /v2/me', async () => {
  const store = new InMemoryIdentityStore()
  const user = await store.getOrCreateUser(ISSUER, 'auth0|u')
  await store.beginConnection(user.userId, CONNECTION_ID, 'development')
  const { nango } = provider((req) => {
    const path = new URL(req.url).pathname
    if (path.startsWith('/connections/')) {
      return new Response(JSON.stringify(connectionBody), { status: 200 })
    }
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  })
  const result = await validateAndActivateConnection({
    credentials: nango, store, userId: user.userId, connectionId: CONNECTION_ID
  })
  assert.equal(result, 'invalid')
  assert.equal(await store.getActiveConnection(user.userId), undefined)
})

test('validateAndActivateConnection marks invalid when Nango has no credential', async () => {
  const store = new InMemoryIdentityStore()
  const user = await store.getOrCreateUser(ISSUER, 'auth0|u')
  await store.beginConnection(user.userId, CONNECTION_ID, 'development')
  const { nango } = provider(() => new Response(JSON.stringify({ error: 'not found' }), { status: 404 }))
  const result = await validateAndActivateConnection({
    credentials: nango, store, userId: user.userId, connectionId: CONNECTION_ID
  })
  assert.equal(result, 'invalid')
})
