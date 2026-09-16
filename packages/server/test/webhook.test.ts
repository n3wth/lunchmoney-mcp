import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { InMemoryIdentityStore } from '../src/identity.js'
import { createNangoWebhook } from '../src/webhook.js'
import { createObserver } from '../src/observability.js'

test('signed Nango lifecycle validates credentials and resists forgery, replay and wrong environment', async () => {
  const store = new InMemoryIdentityStore()
  const user = await store.getOrCreateUser('issuer', 'subject')
  await store.beginConnection(user.userId, `pending:${user.userId}`, 'development')
  let validations = 0
  const handler = createNangoWebhook({ store, signingKey: 'test-key', environment: 'DEV',
    credentials: { getToken: async () => 'token', validateToken: async () => { validations++; return true } } })
  const event = { type: 'auth', operation: 'creation', providerConfigKey: 'lunch-money', environment: 'DEV',
    success: true, connectionId: 'real', tags: { end_user_id: user.userId } }
  async function send(payload: unknown, key = 'test-key') {
    const body = JSON.stringify(payload)
    return handler(new Request('https://example.test/webhooks/nango', { method: 'POST', body,
      headers: { 'x-nango-hmac-sha256': createHmac('sha256', key).update(body).digest('hex') } }))
  }
  assert.equal((await send(event, 'wrong')).status, 401)
  assert.equal((await send({ ...event, environment: 'PROD' })).status, 204)
  assert.equal(validations, 0)
  assert.equal((await send(event)).status, 204)
  assert.equal((await store.getActiveConnection(user.userId))?.state, 'active')
  assert.equal((await send(event)).status, 204)
  assert.equal(validations, 1)
  assert.equal((await send({ ...event, operation: 'deletion' })).status, 204)
  assert.equal(await store.getActiveConnection(user.userId), undefined)
  await send(event)
  assert.equal(await store.getActiveConnection(user.userId), undefined)
  assert.equal(validations, 1)
  assert.equal((await handler(new Request('https://example.test', { method: 'POST', body: '{}', headers: { 'Nango-Signature': 'legacy' } }))).status, 401)
})

test('webhook rejects oversized input and invalid credentials never activate', async () => {
  const store = new InMemoryIdentityStore()
  const user = await store.getOrCreateUser('issuer', 'subject')
  await store.beginConnection(user.userId, `pending:${user.userId}`, 'development')
  const handler = createNangoWebhook({ store, signingKey: 'key', environment: 'DEV', credentials: {
    getToken: async () => 'rejected', validateToken: async () => false
  } })
  const body = JSON.stringify({ type: 'auth', operation: 'creation', providerConfigKey: 'lunch-money',
    environment: 'DEV', success: true, connectionId: 'invalid', tags: { end_user_id: user.userId } })
  assert.equal((await handler(new Request('https://example.test', { method: 'POST', body,
    headers: { 'x-nango-hmac-sha256': createHmac('sha256', 'key').update(body).digest('hex') } }))).status, 204)
  assert.equal(await store.getActiveConnection(user.userId), undefined)
  assert.equal((await handler(new Request('https://example.test', { method: 'POST', body: 'x'.repeat(65537),
    headers: { 'x-nango-hmac-sha256': '0'.repeat(64) } }))).status, 413)
})

test('observability only persists allowlisted labels and status codes', () => {
  const points: unknown[] = []
  const observe = createObserver({ writeDataPoint: point => { points.push(point) } })
  observe({ type: 'secret token headers body', status: 99999 })
  observe({ type: 'upstream_response', status: 401 })
  assert.deepEqual(points, [{ blobs: ['request_failed'], doubles: [0] }, { blobs: ['upstream_response'], doubles: [401] }])
})
