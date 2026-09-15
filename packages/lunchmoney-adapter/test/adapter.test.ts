import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createReadOnlyAdapter, AdapterError, type AdapterErrorCode } from '../src/index.js'

const TOKEN_A = 'token-sentinel-AAAA'
const TOKEN_B = 'token-sentinel-BBBB'
const SECRET = 'provider-secret-sentinel'

interface RecordedRequest {
  method: string
  url: string
  redirect: string
  authorization: string | null
}

function mockFetch(handler: (req: RecordedRequest, attempt: number) => Response | Promise<Response>) {
  const requests: RecordedRequest[] = []
  let count = 0
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = input instanceof Request ? input : new Request(input, init)
    const recorded: RecordedRequest = {
      method: req.method,
      url: req.url,
      redirect: req.redirect,
      authorization: req.headers.get('authorization')
    }
    requests.push(recorded)
    count += 1
    return handler(recorded, count)
  }) as typeof globalThis.fetch
  return { fetchImpl, requests }
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers }
  })
}

const userBody = { id: 7, account_id: 99, budget_name: 'Main', primary_currency: 'usd', name: 'X', email: 'x@y.z', api_key_label: null }
const manualAccountsBody = {
  manual_accounts: [
    { id: 1, name: 'Cash', balance: '12.3400', currency: 'usd', status: 'active', to_base: 12.34, secret: SECRET },
    { id: 2, name: 'Euro', balance: '-0.0100', currency: 'eur', status: 'closed' }
  ]
}
const plaidAccountsBody = {
  plaid_accounts: [{ id: 5, name: 'Bank', balance: '9007199254740993.1234', currency: 'usd', status: 'active' }]
}
const txBody = {
  id: 11,
  date: '2026-09-01',
  amount: '-0.0100',
  currency: 'usd',
  payee: 'Store',
  category_id: null,
  manual_account_id: 1,
  plaid_account_id: null,
  status: 'reviewed',
  is_pending: false,
  is_group_parent: false,
  split_parent_id: null,
  group_parent_id: null,
  tag_ids: [3, 4],
  to_base: -0.01,
  notes: SECRET
}

async function expectCode(promise: Promise<unknown>, code: AdapterErrorCode) {
  await assert.rejects(promise, (err: unknown) => {
    assert.ok(err instanceof AdapterError, `expected AdapterError, got ${err}`)
    assert.equal(err.code, code)
    return true
  })
}

function routeFetch(map: Record<string, unknown>) {
  return mockFetch((req) => {
    const path = new URL(req.url).pathname
    const body = map[path]
    if (body === undefined) return json({ message: 'not found' }, 404)
    return json(body)
  })
}

test('happy path: four routes, GET only, correct origin and redirect=manual', async () => {
  const { fetchImpl, requests } = routeFetch({
    '/v2/me': userBody,
    '/v2/manual_accounts': manualAccountsBody,
    '/v2/plaid_accounts': plaidAccountsBody,
    '/v2/transactions': { transactions: [txBody], has_more: false }
  })
  const adapter = createReadOnlyAdapter({ fetch: fetchImpl })
  const ctx = { token: TOKEN_A }

  const me = await adapter.getMe(ctx)
  assert.deepEqual(me, { id: 7, account_id: 99, budget_name: 'Main', primary_currency: 'usd' })

  const manual = await adapter.listManualAccounts(ctx)
  assert.equal(manual.manual_accounts.length, 2)
  assert.equal(manual.manual_accounts[0].balance, '12.3400')
  assert.equal(manual.manual_accounts[1].balance, '-0.0100')
  assert.equal((manual.manual_accounts[0] as unknown as Record<string, unknown>).secret, undefined)
  assert.equal((manual.manual_accounts[0] as unknown as Record<string, unknown>).to_base, undefined)

  const plaid = await adapter.listPlaidAccounts(ctx)
  assert.equal(plaid.plaid_accounts[0].balance, '9007199254740993.1234')

  const page = await adapter.listTransactions(ctx)
  assert.equal(page.transactions.length, 1)
  assert.equal(page.transactions[0].amount, '-0.0100')
  assert.equal((page.transactions[0] as unknown as Record<string, unknown>).notes, undefined)
  assert.equal((page.transactions[0] as unknown as Record<string, unknown>).to_base, undefined)
  assert.equal(page.next_offset, null)
  assert.equal(page.has_more, false)

  for (const req of requests) {
    assert.equal(req.method, 'GET')
    assert.equal(req.redirect, 'manual')
    assert.ok(req.url.startsWith('https://api.lunchmoney.dev/v2/'))
    assert.equal(new URL(req.url).origin, 'https://api.lunchmoney.dev')
    assert.equal(req.authorization, `Bearer ${TOKEN_A}`)
  }
})

test('query serialization', async () => {
  const { fetchImpl, requests } = routeFetch({
    '/v2/transactions': { transactions: [], has_more: false }
  })
  const adapter = createReadOnlyAdapter({ fetch: fetchImpl })
  await adapter.listTransactions({ token: TOKEN_A }, {
    limit: 10, offset: 20, start_date: '2026-01-01', end_date: '2026-01-31',
    manual_account_id: 0, plaid_account_id: 5, category_id: 9, tag_id: 2, include_pending: true
  })
  const url = new URL(requests[0].url)
  assert.equal(url.searchParams.get('limit'), '10')
  assert.equal(url.searchParams.get('offset'), '20')
  assert.equal(url.searchParams.get('start_date'), '2026-01-01')
  assert.equal(url.searchParams.get('end_date'), '2026-01-31')
  assert.equal(url.searchParams.get('manual_account_id'), '0')
  assert.equal(url.searchParams.get('plaid_account_id'), '5')
  assert.equal(url.searchParams.get('category_id'), '9')
  assert.equal(url.searchParams.get('tag_id'), '2')
  assert.equal(url.searchParams.get('include_pending'), 'true')
})

test('pagination: two pages via continuation offsets', async () => {
  const full = Array.from({ length: 2 }, (_, i) => ({ ...txBody, id: 100 + i }))
  const { fetchImpl } = mockFetch((req) => {
    const url = new URL(req.url)
    const offset = Number(url.searchParams.get('offset'))
    if (offset === 0) return json({ transactions: full, has_more: true })
    if (offset === 2) return json({ transactions: [{ ...txBody, id: 200 }], has_more: false })
    return json({ transactions: [], has_more: false })
  })
  const adapter = createReadOnlyAdapter({ fetch: fetchImpl })
  const p1 = await adapter.listTransactions({ token: TOKEN_A }, { limit: 2, offset: 0 })
  assert.equal(p1.next_offset, 2)
  assert.equal(p1.has_more, true)
  const p2 = await adapter.listTransactions({ token: TOKEN_A }, { limit: 2, offset: p1.next_offset ?? 0 })
  assert.equal(p2.next_offset, null)
  assert.equal(p2.transactions[0].id, 200)
})

test('envelope invariants: has_more, sizes, error string', async () => {
  const cases: { body: unknown; label: string }[] = [
    { body: { transactions: [] }, label: 'missing has_more' },
    { body: { transactions: [txBody, txBody, txBody], has_more: false }, label: 'over-limit array' },
    { body: { transactions: [], has_more: true }, label: 'has_more empty' },
    { body: { transactions: [txBody], has_more: true }, label: 'partial nonterminal' },
    { body: { transactions: [txBody], has_more: false, error: SECRET }, label: 'error envelope' }
  ]
  for (const { body, label } of cases) {
    const { fetchImpl } = routeFetch({ '/v2/transactions': body })
    const adapter = createReadOnlyAdapter({ fetch: fetchImpl })
    await expectCode(adapter.listTransactions({ token: TOKEN_A }, { limit: 2 }), 'INVALID_RESPONSE')
    assert.ok(label)
  }
})

test('terminal partial page valid with next_offset null', async () => {
  const { fetchImpl } = routeFetch({
    '/v2/transactions': { transactions: [txBody], has_more: false }
  })
  const adapter = createReadOnlyAdapter({ fetch: fetchImpl })
  const page = await adapter.listTransactions({ token: TOKEN_A }, { limit: 5 })
  assert.equal(page.next_offset, null)
  assert.equal(page.limit, 5)
  assert.equal(page.offset, 0)
})

test('strict query validation', async () => {
  const adapter = createReadOnlyAdapter({ fetch: mockFetch(() => json({})) .fetchImpl })
  const ctx = { token: TOKEN_A }
  const bad: Record<string, unknown>[] = [
    { limit: 0 }, { limit: 101 }, { limit: 1.5 }, { limit: '10' },
    { offset: -1 }, { offset: 1.2 }, { offset: Number.NaN },
    { start_date: '2026-02-30', end_date: '2026-03-01' },
    { start_date: '2026-03-02', end_date: '2026-03-01' },
    { start_date: '2026-01-01' },
    { end_date: '2026-01-01' },
    { manual_account_id: -1 }, { include_children: true }, { nope: 1 }
  ]
  for (const q of bad) {
    await expectCode(adapter.listTransactions(ctx, q as never), 'INVALID_INPUT')
  }
  const validDates = await adapter.listTransactions(ctx, { start_date: '2024-02-29', end_date: '2024-02-29' }).catch((e) => e)
  assert.ok(!(validDates instanceof AdapterError && validDates.code === 'INVALID_INPUT'))
})

test('token isolation between interleaved calls', async () => {
  const { fetchImpl, requests } = mockFetch(async (req) => {
    await new Promise((r) => setTimeout(r, 5))
    return json(userBody)
  })
  const adapter = createReadOnlyAdapter({ fetch: fetchImpl })
  const [a, b] = await Promise.all([
    adapter.getMe({ token: TOKEN_A }),
    adapter.getMe({ token: TOKEN_B })
  ])
  assert.equal(a.id, 7)
  assert.equal(b.id, 7)
  const auths = requests.map((r) => r.authorization)
  assert.deepEqual(auths.sort(), [`Bearer ${TOKEN_A}`, `Bearer ${TOKEN_B}`].sort())
  await adapter.getMe({ token: TOKEN_A })
  assert.equal(requests[2].authorization, `Bearer ${TOKEN_A}`)
})

test('401/403 no retry; 503 bounded retries; network sanitized', async () => {
  for (const status of [401, 403]) {
    const { fetchImpl, requests } = mockFetch(() => json({ message: SECRET }, status))
    const adapter = createReadOnlyAdapter({ fetch: fetchImpl })
    await expectCode(adapter.getMe({ token: TOKEN_A }), status === 401 ? 'UPSTREAM_UNAUTHORIZED' : 'UPSTREAM_FORBIDDEN')
    assert.equal(requests.length, 1)
  }
  let calls = 0
  const { fetchImpl } = mockFetch(() => {
    calls += 1
    return json({ message: SECRET }, 503)
  })
  const adapter = createReadOnlyAdapter({ fetch: fetchImpl, maxAttempts: 3 })
  await expectCode(adapter.getMe({ token: TOKEN_A }), 'UPSTREAM_UNAVAILABLE')
  assert.equal(calls, 3)

  const netFail = createReadOnlyAdapter({ fetch: (() => Promise.reject(new Error(SECRET))) as typeof globalThis.fetch })
  try {
    await netFail.getMe({ token: TOKEN_A })
    assert.fail('expected throw')
  } catch (err) {
    assert.ok(err instanceof AdapterError)
    const s = `${String(err)} ${JSON.stringify(err)} ${(err as Error).stack}`
    assert.equal(s.includes(SECRET), false)
  }
})

test('429 honors Retry-After seconds and date; exhaustion returns RATE_LIMITED', async () => {
  let calls = 0
  const { fetchImpl } = mockFetch(() => {
    calls += 1
    return json({}, 429, { 'retry-after': '0' })
  })
  const adapter = createReadOnlyAdapter({ fetch: fetchImpl, maxAttempts: 2 })
  await expectCode(adapter.getMe({ token: TOKEN_A }), 'RATE_LIMITED')
  assert.equal(calls, 2)

  const dateRetry = mockFetch(() => json({}, 429, { 'retry-after': new Date(Date.now() + 1000).toUTCString() }))
  const short = createReadOnlyAdapter({ fetch: dateRetry.fetchImpl, timeoutMs: 200, maxAttempts: 3 })
  try {
    await short.getMe({ token: TOKEN_A })
    assert.fail('expected throw')
  } catch (err) {
    assert.ok(err instanceof AdapterError)
    assert.equal(err.code, 'RATE_LIMITED')
    assert.equal(typeof err.retryAfterSeconds, 'number')
  }
})

test('redirect responses rejected as invalid (redirects never followed)', async () => {
  const { fetchImpl, requests } = mockFetch(() => json({}, 302, { location: 'https://evil.example.com/' }))
  const adapter = createReadOnlyAdapter({ fetch: fetchImpl })
  await expectCode(adapter.getMe({ token: TOKEN_A }), 'INVALID_RESPONSE')
  assert.equal(requests.length, 1)
  assert.equal(requests[0].redirect, 'manual')
})

test('malformed JSON and oversize bodies rejected', async () => {
  const badJson = mockFetch(() => new Response('not json{', { status: 200 }))
  await expectCode(createReadOnlyAdapter({ fetch: badJson.fetchImpl }).getMe({ token: TOKEN_A }), 'INVALID_RESPONSE')

  const big = 'x'.repeat(1024 * 1024 + 10)
  const oversize = mockFetch(() => new Response(JSON.stringify({ pad: big, ...userBody }), { status: 200 }))
  await expectCode(createReadOnlyAdapter({ fetch: oversize.fetchImpl }).getMe({ token: TOKEN_A }), 'INVALID_RESPONSE')
})

test('stalled fetch and stalled stream hit deadline', async () => {
  const stalledFetch = createReadOnlyAdapter({
    fetch: (() => new Promise(() => undefined)) as typeof globalThis.fetch,
    timeoutMs: 50
  })
  await expectCode(stalledFetch.getMe({ token: TOKEN_A }), 'DEADLINE_EXCEEDED')

  const stalledStream = createReadOnlyAdapter({
    fetch: (() => Promise.resolve(new Response(new ReadableStream({
      start() {}
    }), { status: 200 }))) as typeof globalThis.fetch,
    timeoutMs: 50
  })
  await expectCode(stalledStream.getMe({ token: TOKEN_A }), 'DEADLINE_EXCEEDED')
})

test('pre-call and in-flight abort return CANCELLED and prevent retries', async () => {
  const aborted = AbortSignal.abort()
  const { fetchImpl, requests } = mockFetch(() => json(userBody))
  const adapter = createReadOnlyAdapter({ fetch: fetchImpl })
  await expectCode(adapter.getMe({ token: TOKEN_A, signal: aborted }), 'CANCELLED')
  assert.equal(requests.length, 0)

  const ctl = new AbortController()
  let calls = 0
  const retryFetch = mockFetch(() => {
    calls += 1
    ctl.abort()
    return json({}, 503)
  })
  const adapter2 = createReadOnlyAdapter({ fetch: retryFetch.fetchImpl, maxAttempts: 3 })
  await expectCode(adapter2.getMe({ token: TOKEN_A, signal: ctl.signal }), 'CANCELLED')
  assert.equal(calls, 1)
})

test('curated read routes: categories, tags, recurring, summary', async () => {
  const { fetchImpl, requests } = routeFetch({
    '/v2/categories': { categories: [{ id: 9, name: 'Food', is_income: false, exclude_from_budget: false, exclude_from_totals: false, group_id: null, is_group: false, archived: false, secret: SECRET }] },
    '/v2/tags': { tags: [{ id: 4, name: 'trip', archived: false, extra: SECRET }] },
    '/v2/recurring_items': {
      recurring_items: [{
        id: 77, description: 'Rent', status: 'reviewed',
        transaction_criteria: { payee: 'Landlord', amount: '1250.8400', currency: 'usd', granularity: 'month', anchor_date: '2024-09-01', plaid_account_id: 5, manual_account_id: null },
        overrides: { payee: 'Rent Payee', category_id: 9 },
        matches: { found_transactions: [{ transaction_id: 1, token: SECRET }] }
      }]
    },
    '/v2/summary': {
      aligned: true,
      categories: [{ category_id: 9, totals: { other_activity: -42.5, recurring_activity: -100, budgeted: 200, available: 57.5, secret: SECRET } }],
      totals: { inflow: { other_activity: 10, recurring_activity: 5 }, outflow: { other_activity: -20, recurring_activity: -100 } },
      junk: SECRET
    }
  })
  const adapter = createReadOnlyAdapter({ fetch: fetchImpl })
  const ctx = { token: TOKEN_A }

  const cats = await adapter.listCategories(ctx)
  assert.equal(cats.categories[0].name, 'Food')
  assert.equal((cats.categories[0] as unknown as Record<string, unknown>).secret, undefined)

  const tags = await adapter.listTags(ctx)
  assert.deepEqual(tags.tags, [{ id: 4, name: 'trip', archived: false }])

  const rec = await adapter.listRecurringItems(ctx, { start_date: '2026-09-01', end_date: '2026-09-30', include_suggested: false })
  assert.equal(rec.recurring_items[0].payee, 'Rent Payee')
  assert.equal(rec.recurring_items[0].amount, '1250.8400')
  assert.equal(rec.recurring_items[0].category_id, 9)
  assert.equal(JSON.stringify(rec).includes(SECRET), false)

  const summary = await adapter.getBudgetSummary(ctx, { start_date: '2026-09-01', end_date: '2026-09-30' })
  assert.equal(summary.aligned, true)
  assert.equal(summary.categories[0].available, 57.5)
  assert.equal(JSON.stringify(summary).includes(SECRET), false)

  const summaryUrl = new URL(requests.at(-1)!.url)
  assert.equal(summaryUrl.searchParams.get('start_date'), '2026-09-01')
  assert.equal(summaryUrl.searchParams.get('include_totals'), 'true')

  await expectCode(adapter.listRecurringItems(ctx, { start_date: '2026-01-01' }), 'INVALID_INPUT')
  await expectCode(adapter.getBudgetSummary(ctx, { start_date: '2026-02-01', end_date: '2026-01-01' }), 'INVALID_INPUT')
})

test('sentinel token and provider data absent from errors', async () => {
  const { fetchImpl } = mockFetch(() => json({ message: `bad ${SECRET}`, token: TOKEN_A }, 500))
  const adapter = createReadOnlyAdapter({ fetch: fetchImpl })
  try {
    await adapter.getMe({ token: TOKEN_A })
    assert.fail('expected throw')
  } catch (err) {
    const s = `${String(err)} ${JSON.stringify(err)} ${(err as Error).stack}`
    assert.equal(s.includes(SECRET), false)
    assert.equal(s.includes(TOKEN_A), false)
  }
})
