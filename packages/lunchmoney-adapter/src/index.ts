import { LunchMoneyClient } from '@lunch-money/lunch-money-js-v2'
import { z } from 'zod'

export interface AdapterOptions {
  fetch?: typeof globalThis.fetch
  timeoutMs?: number
  maxAttempts?: number
}

export interface ReadContext {
  token: string
  signal?: AbortSignal
}

export interface TransactionQuery {
  limit?: number
  offset?: number
  start_date?: string
  end_date?: string
  manual_account_id?: number
  plaid_account_id?: number
  category_id?: number
  tag_id?: number
  include_pending?: boolean
}

export type AdapterErrorCode =
  | 'INVALID_INPUT'
  | 'UPSTREAM_UNAUTHORIZED'
  | 'UPSTREAM_FORBIDDEN'
  | 'RATE_LIMITED'
  | 'DEADLINE_EXCEEDED'
  | 'CANCELLED'
  | 'UPSTREAM_UNAVAILABLE'
  | 'INVALID_RESPONSE'

const ERROR_MESSAGES: Record<AdapterErrorCode, string> = {
  INVALID_INPUT: 'Invalid input',
  UPSTREAM_UNAUTHORIZED: 'Upstream authorization failed',
  UPSTREAM_FORBIDDEN: 'Upstream request forbidden',
  RATE_LIMITED: 'Upstream rate limit exceeded',
  DEADLINE_EXCEEDED: 'Request deadline exceeded',
  CANCELLED: 'Request cancelled',
  UPSTREAM_UNAVAILABLE: 'Upstream service unavailable',
  INVALID_RESPONSE: 'Invalid upstream response'
}

export class AdapterError extends Error {
  readonly code: AdapterErrorCode
  readonly retryAfterSeconds?: number

  constructor(code: AdapterErrorCode, retryAfterSeconds?: number) {
    super(ERROR_MESSAGES[code])
    this.name = 'AdapterError'
    this.code = code
    if (retryAfterSeconds !== undefined && Number.isSafeInteger(retryAfterSeconds) && retryAfterSeconds >= 0) {
      this.retryAfterSeconds = retryAfterSeconds
    }
  }
}

export interface UserOverview {
  id: number
  account_id: number
  budget_name: string
  primary_currency: string
}

export interface AccountOverview {
  id: number
  name: string
  balance: string
  currency: string
  status: string
}

export interface TransactionSummary {
  id: number
  date: string
  amount: string
  currency: string
  payee: string
  category_id: number | null
  manual_account_id: number | null
  plaid_account_id: number | null
  status: 'reviewed' | 'unreviewed' | 'delete_pending'
  is_pending: boolean
  is_group_parent: boolean
  split_parent_id: number | null
  group_parent_id: number | null
  tag_ids: number[]
}

export interface TransactionPage {
  transactions: TransactionSummary[]
  has_more: boolean
  next_offset: number | null
  limit: number
  offset: number
}

const BASE_ORIGIN = 'https://api.lunchmoney.dev'
const BASE_PATH = '/v2'
const ALLOWED_PATHS = new Set([
  '/v2/me', '/v2/manual_accounts', '/v2/plaid_accounts', '/v2/transactions',
  '/v2/categories', '/v2/tags', '/v2/recurring_items', '/v2/summary'
])
const MAX_BODY_BYTES = 1024 * 1024
const RETRYABLE_STATUS = new Set([429, 502, 503, 504])
const DEFAULT_TIMEOUT_MS = 8000
const MAX_TIMEOUT_MS = 30000
const DEFAULT_MAX_ATTEMPTS = 2
const FALLBACK_RETRY_DELAY_MS = 250

const decimalString = z.string().regex(/^-?\d+(\.\d{1,4})?$/).max(64)
const currencyString = z.string().regex(/^[a-z]{3}$/)
const positiveId = z.number().int().positive().safe()
const nullableId = z.number().int().positive().safe().nullable()
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(
  (value) => {
    const parsed = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  },
  { message: 'invalid date' }
)

const userSchema = z.object({
  id: positiveId,
  account_id: positiveId,
  budget_name: z.string(),
  primary_currency: currencyString
})

const manualAccountSchema = z.object({
  id: positiveId,
  name: z.string(),
  balance: decimalString,
  currency: currencyString,
  status: z.string()
})

const plaidAccountSchema = z.object({
  id: positiveId,
  name: z.string(),
  balance: decimalString,
  currency: currencyString,
  status: z.string()
})

const transactionSchema = z.object({
  id: positiveId,
  date: dateString,
  amount: decimalString,
  currency: currencyString,
  payee: z.string(),
  category_id: nullableId,
  manual_account_id: nullableId,
  plaid_account_id: nullableId,
  status: z.enum(['reviewed', 'unreviewed', 'delete_pending']),
  is_pending: z.boolean(),
  is_group_parent: z.boolean(),
  split_parent_id: nullableId,
  group_parent_id: nullableId,
  tag_ids: z.array(positiveId)
})

const transactionEnvelopeSchema = z.object({
  transactions: z.array(transactionSchema),
  has_more: z.boolean(),
  error: z.string().optional()
})

export interface CategoryOverview {
  id: number
  name: string
  is_income: boolean
  exclude_from_budget: boolean
  exclude_from_totals: boolean
  group_id: number | null
  is_group: boolean
  archived: boolean
}

export interface TagOverview {
  id: number
  name: string
  archived: boolean
}

export interface RecurringOverview {
  id: number
  description: string | null
  status: string
  payee: string | null
  amount: string
  currency: string
  granularity: string
  anchor_date: string
  plaid_account_id: number | null
  manual_account_id: number | null
  category_id: number | null
}

export interface RecurringQuery {
  start_date?: string
  end_date?: string
  include_suggested?: boolean
}

export interface BudgetSummaryQuery {
  start_date: string
  end_date: string
  include_totals?: boolean
}

export interface BudgetCategorySummary {
  category_id: number
  other_activity: number
  recurring_activity: number
  budgeted: number | null
  available: number | null
}

export interface BudgetSummary {
  aligned: boolean
  categories: BudgetCategorySummary[]
  totals?: {
    inflow?: { other_activity?: number; recurring_activity?: number }
    outflow?: { other_activity?: number; recurring_activity?: number }
  }
}

const categorySchema = z.object({
  id: positiveId,
  name: z.string(),
  is_income: z.boolean(),
  exclude_from_budget: z.boolean(),
  exclude_from_totals: z.boolean(),
  group_id: nullableId,
  is_group: z.boolean(),
  archived: z.boolean()
})

const tagSchema = z.object({
  id: positiveId,
  name: z.string(),
  archived: z.boolean()
})

const recurringSchema = z.object({
  id: positiveId,
  description: z.string().nullable(),
  status: z.string(),
  transaction_criteria: z.object({
    payee: z.string().nullable().optional(),
    amount: decimalString,
    currency: currencyString,
    granularity: z.string(),
    anchor_date: dateString,
    plaid_account_id: nullableId.optional(),
    manual_account_id: nullableId.optional()
  }),
  overrides: z.object({
    payee: z.string().optional(),
    category_id: nullableId.optional()
  }).nullable().optional()
})

const budgetCategorySchema = z.object({
  category_id: positiveId,
  totals: z.object({
    other_activity: z.number().finite(),
    recurring_activity: z.number().finite(),
    budgeted: z.number().finite().nullable().optional(),
    available: z.number().finite().nullable().optional()
  })
})

const budgetSummarySchema = z.object({
  aligned: z.boolean(),
  categories: z.array(budgetCategorySchema).max(1000),
  totals: z.object({
    inflow: z.object({
      other_activity: z.number().finite().optional(),
      recurring_activity: z.number().finite().optional()
    }).optional(),
    outflow: z.object({
      other_activity: z.number().finite().optional(),
      recurring_activity: z.number().finite().optional()
    }).optional()
  }).optional()
})

const recurringQuerySchema = z.strictObject({
  start_date: dateString.optional(),
  end_date: dateString.optional(),
  include_suggested: z.boolean().optional()
}).superRefine((value, ctx) => {
  if ((value.start_date === undefined) !== (value.end_date === undefined)) {
    ctx.addIssue({ code: 'custom', message: 'start_date and end_date must be provided together' })
  }
  if (value.start_date !== undefined && value.end_date !== undefined && value.start_date > value.end_date) {
    ctx.addIssue({ code: 'custom', message: 'start_date must be on or before end_date' })
  }
})

const budgetQuerySchema = z.strictObject({
  start_date: dateString,
  end_date: dateString,
  include_totals: z.boolean().optional()
}).superRefine((value, ctx) => {
  if (value.start_date > value.end_date) {
    ctx.addIssue({ code: 'custom', message: 'start_date must be on or before end_date' })
  }
})

const querySchema = z.strictObject({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).max(1000000).safe().optional(),
  start_date: dateString.optional(),
  end_date: dateString.optional(),
  manual_account_id: z.number().int().min(0).safe().optional(),
  plaid_account_id: z.number().int().min(0).safe().optional(),
  category_id: z.number().int().min(0).safe().optional(),
  tag_id: z.number().int().min(0).safe().optional(),
  include_pending: z.boolean().optional()
}).superRefine((value, ctx) => {
  if ((value.start_date === undefined) !== (value.end_date === undefined)) {
    ctx.addIssue({ code: 'custom', message: 'start_date and end_date must be provided together' })
  }
  if (value.start_date !== undefined && value.end_date !== undefined && value.start_date > value.end_date) {
    ctx.addIssue({ code: 'custom', message: 'start_date must be on or before end_date' })
  }
})

function invalidInput(): AdapterError {
  return new AdapterError('INVALID_INPUT')
}

function invalidResponse(): AdapterError {
  return new AdapterError('INVALID_RESPONSE')
}

function parseRetryAfter(headers: Headers): number | undefined {
  const raw = headers.get('retry-after')
  if (raw === null) return undefined
  const seconds = Number(raw)
  if (Number.isFinite(seconds)) return Math.max(0, Math.floor(seconds))
  const date = Date.parse(raw)
  if (!Number.isNaN(date)) return Math.max(0, Math.ceil((date - Date.now()) / 1000))
  return undefined
}

function mapStatus(status: number, retryAfterSeconds?: number): AdapterError {
  if (status === 401) return new AdapterError('UPSTREAM_UNAUTHORIZED')
  if (status === 403) return new AdapterError('UPSTREAM_FORBIDDEN')
  if (status === 429) return new AdapterError('RATE_LIMITED', retryAfterSeconds)
  return new AdapterError('UPSTREAM_UNAVAILABLE')
}

async function readBoundedBody(response: Response, signal: AbortSignal, deadline: () => void): Promise<ArrayBuffer> {
  if (response.body === null) return new ArrayBuffer(0)
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  const onAbort = () => {
    reader.cancel().catch(() => undefined)
  }
  signal.addEventListener('abort', onAbort, { once: true })
  try {
    for (;;) {
      if (signal.aborted) deadline()
      const { done, value } = await reader.read()
      if (done) break
      if (value !== undefined) {
        total += value.byteLength
        if (total > MAX_BODY_BYTES) {
          await reader.cancel().catch(() => undefined)
          throw invalidResponse()
        }
        chunks.push(value)
      }
    }
  } finally {
    signal.removeEventListener('abort', onAbort)
  }
  const body = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return body.buffer
}

export function createReadOnlyAdapter(options: AdapterOptions = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > MAX_TIMEOUT_MS) throw invalidInput()
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 3) throw invalidInput()
  const baseFetch = options.fetch ?? globalThis.fetch

  async function run<T>(
    context: ReadContext,
    path: string,
    query: Record<string, string | number | boolean> | undefined,
    parse: (data: unknown) => T
  ): Promise<T> {
    if (typeof context?.token !== 'string' || context.token.length === 0) throw invalidInput()

    const deadlineAt = Date.now() + timeoutMs
    const controller = new AbortController()
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMs)
    const onExternalAbort = () => controller.abort()
    if (context.signal?.aborted) controller.abort()
    else context.signal?.addEventListener('abort', onExternalAbort, { once: true })

    const abortError = (): AdapterError =>
      timedOut ? new AdapterError('DEADLINE_EXCEEDED') : new AdapterError('CANCELLED')
    let responseReceived = false

    const guardedFetch: typeof globalThis.fetch = async (input, init) => {
      if (controller.signal.aborted) throw abortError()
      const request = new Request(input, init)
      if (request.method !== 'GET') throw invalidResponse()
      const url = new URL(request.url)
      if (url.origin !== BASE_ORIGIN || !ALLOWED_PATHS.has(url.pathname) || url.username !== '' || url.hash !== '') {
        throw invalidResponse()
      }
      const guardedRequest = new Request(request, { signal: controller.signal, redirect: 'manual' })
      const attemptFetch = baseFetch(guardedRequest)
      const response = await Promise.race([
        attemptFetch,
        new Promise<never>((_, reject) => {
          const onAbort = () => reject(abortError())
          if (controller.signal.aborted) onAbort()
          else controller.signal.addEventListener('abort', onAbort, { once: true })
        })
      ])
      // Redirects are never followed (workerd has no redirect:'error'); a 3xx
      // from a fixed-origin API is an invalid response.
      if (response.status >= 300 && response.status < 400) throw invalidResponse()
      const body = await readBoundedBody(response, controller.signal, () => {
        throw abortError()
      })
      responseReceived = true
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      })
    }

    try {
      const client = new LunchMoneyClient({ apiKey: context.token, fetch: guardedFetch })
      const raw = client.rawClient
      let lastError: AdapterError | undefined

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (controller.signal.aborted) throw abortError()
        responseReceived = false
        let status: number
        let data: unknown
        let retryAfter: number | undefined
        try {
          const result = path === '/me'
            ? await raw.GET('/me' as never, {} as never)
            : path === '/manual_accounts'
              ? await raw.GET('/manual_accounts' as never, {} as never)
              : path === '/plaid_accounts'
                ? await raw.GET('/plaid_accounts' as never, {} as never)
                : path === '/categories'
                  ? await raw.GET('/categories' as never, { params: { query } } as never)
                  : path === '/tags'
                    ? await raw.GET('/tags' as never, {} as never)
                    : path === '/recurring_items'
                      ? await raw.GET('/recurring_items' as never, { params: { query } } as never)
                      : path === '/summary'
                        ? await raw.GET('/summary' as never, { params: { query } } as never)
                        : await raw.GET('/transactions' as never, { params: { query } } as never)
          status = result.response.status
          retryAfter = parseRetryAfter(result.response.headers)
          data = result.data ?? result.error
        } catch (error) {
          if (error instanceof AdapterError) throw error
          if (controller.signal.aborted) throw abortError()
          if (responseReceived) throw invalidResponse()
          throw new AdapterError('UPSTREAM_UNAVAILABLE')
        }

        if (status === 200) {
          if (controller.signal.aborted) throw abortError()
          return parse(data)
        }

        if (!RETRYABLE_STATUS.has(status)) throw mapStatus(status, retryAfter)
        lastError = mapStatus(status, retryAfter)
        if (attempt + 1 >= maxAttempts) throw lastError

        const delay = retryAfter !== undefined ? retryAfter * 1000 : FALLBACK_RETRY_DELAY_MS
        if (Date.now() + delay > deadlineAt) throw lastError
        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(resolve, delay)
          const onAbort = () => {
            clearTimeout(t)
            reject(abortError())
          }
          if (controller.signal.aborted) onAbort()
          else controller.signal.addEventListener('abort', onAbort, { once: true })
        })
      }
      throw lastError ?? new AdapterError('UPSTREAM_UNAVAILABLE')
    } finally {
      clearTimeout(timer)
      context.signal?.removeEventListener('abort', onExternalAbort)
    }
  }

  function parseWith<T>(schema: z.ZodType<T>): (data: unknown) => T {
    return (data) => {
      const result = schema.safeParse(data)
      if (!result.success) throw invalidResponse()
      return result.data
    }
  }

  return {
    getMe(context: ReadContext): Promise<UserOverview> {
      return run(context, '/me', undefined, parseWith(userSchema))
    },

    async listManualAccounts(context: ReadContext): Promise<{ manual_accounts: AccountOverview[] }> {
      const data = await run(context, '/manual_accounts', undefined, parseWith(z.object({
        manual_accounts: z.array(manualAccountSchema)
      })))
      if (data.manual_accounts.length > 1000) throw invalidResponse()
      return data
    },

    async listPlaidAccounts(context: ReadContext): Promise<{ plaid_accounts: AccountOverview[] }> {
      const data = await run(context, '/plaid_accounts', undefined, parseWith(z.object({
        plaid_accounts: z.array(plaidAccountSchema)
      })))
      if (data.plaid_accounts.length > 1000) throw invalidResponse()
      return data
    },

    async listTransactions(context: ReadContext, query?: TransactionQuery): Promise<TransactionPage> {
      const parsed = querySchema.safeParse(query ?? {})
      if (!parsed.success) throw invalidInput()
      const limit = parsed.data.limit ?? 50
      const offset = parsed.data.offset ?? 0
      const params: Record<string, string | number | boolean> = { limit, offset }
      for (const [key, value] of Object.entries(parsed.data)) {
        if (value !== undefined && key !== 'limit' && key !== 'offset') params[key] = value
      }
      const page = await run(context, '/transactions', params, (raw) => {
        const result = transactionEnvelopeSchema.safeParse(raw)
        if (!result.success) throw invalidResponse()
        const data = result.data
        if (typeof data.error === 'string' && data.error.length > 0) throw invalidResponse()
        if (data.transactions.length > limit) throw invalidResponse()
        if (data.has_more && data.transactions.length !== limit) throw invalidResponse()
        const nextOffset = data.has_more ? offset + limit : null
        if (nextOffset !== null && !Number.isSafeInteger(nextOffset)) throw invalidResponse()
        return {
          transactions: data.transactions,
          has_more: data.has_more,
          next_offset: nextOffset,
          limit,
          offset
        }
      })
      return page
    },

    async listCategories(context: ReadContext): Promise<{ categories: CategoryOverview[] }> {
      const data = await run(context, '/categories', { format: 'flattened' }, parseWith(z.object({
        categories: z.array(categorySchema)
      })))
      if (data.categories.length > 1000) throw invalidResponse()
      return data
    },

    async listTags(context: ReadContext): Promise<{ tags: TagOverview[] }> {
      const data = await run(context, '/tags', undefined, parseWith(z.object({
        tags: z.array(tagSchema)
      })))
      if (data.tags.length > 1000) throw invalidResponse()
      return data
    },

    async listRecurringItems(context: ReadContext, query?: RecurringQuery): Promise<{ recurring_items: RecurringOverview[] }> {
      const parsed = recurringQuerySchema.safeParse(query ?? {})
      if (!parsed.success) throw invalidInput()
      const params: Record<string, string | number | boolean> = {}
      for (const [key, value] of Object.entries(parsed.data)) {
        if (value !== undefined) params[key] = value
      }
      const data = await run(context, '/recurring_items', params, (raw) => {
        const result = z.object({ recurring_items: z.array(recurringSchema) }).safeParse(raw)
        if (!result.success) throw invalidResponse()
        if (result.data.recurring_items.length > 1000) throw invalidResponse()
        return result.data
      })
      return {
        recurring_items: data.recurring_items.map((item) => ({
          id: item.id,
          description: item.description,
          status: item.status,
          payee: item.overrides?.payee ?? item.transaction_criteria.payee ?? null,
          amount: item.transaction_criteria.amount,
          currency: item.transaction_criteria.currency,
          granularity: item.transaction_criteria.granularity,
          anchor_date: item.transaction_criteria.anchor_date,
          plaid_account_id: item.transaction_criteria.plaid_account_id ?? null,
          manual_account_id: item.transaction_criteria.manual_account_id ?? null,
          category_id: item.overrides?.category_id ?? null
        }))
      }
    },

    async getBudgetSummary(context: ReadContext, query: BudgetSummaryQuery): Promise<BudgetSummary> {
      const parsed = budgetQuerySchema.safeParse(query)
      if (!parsed.success) throw invalidInput()
      const params: Record<string, string | number | boolean> = {
        start_date: parsed.data.start_date,
        end_date: parsed.data.end_date,
        include_totals: parsed.data.include_totals ?? true
      }
      const data = await run(context, '/summary', params, (raw) => {
        const result = budgetSummarySchema.safeParse(raw)
        if (!result.success) throw invalidResponse()
        return result.data
      })
      return {
        aligned: data.aligned,
        categories: data.categories.map((c) => ({
          category_id: c.category_id,
          other_activity: c.totals.other_activity,
          recurring_activity: c.totals.recurring_activity,
          budgeted: c.totals.budgeted ?? null,
          available: c.totals.available ?? null
        })),
        ...(data.totals !== undefined ? { totals: data.totals } : {})
      }
    }
  }
}
