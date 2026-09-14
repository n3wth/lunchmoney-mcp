import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { createReadOnlyAdapter, AdapterError } from '@lunchmoney-mcp/adapter'

type Adapter = ReturnType<typeof createReadOnlyAdapter>

export interface ToolContext {
  adapter: Adapter
  token: string
}

function fail(message: string): { content: { type: 'text'; text: string }[]; isError: true } {
  return { content: [{ type: 'text', text: message }], isError: true }
}

function ok(data: unknown): { content: { type: 'text'; text: string }[] } {
  return { content: [{ type: 'text', text: JSON.stringify(data) }] }
}

function describe(error: unknown): string {
  if (error !== null && typeof error === 'object' && 'code' in error) {
    const code = (error as AdapterError).code
    switch (code) {
      case 'UPSTREAM_UNAUTHORIZED': return 'Lunch Money credential rejected. Reconnect your account.'
      case 'UPSTREAM_FORBIDDEN': return 'Lunch Money credential lacks access. Reconnect your account.'
      case 'RATE_LIMITED': return 'Lunch Money rate limit reached. Retry shortly.'
      case 'DEADLINE_EXCEEDED': return 'Lunch Money request timed out. Retry.'
      case 'CANCELLED': return 'Request cancelled.'
      case 'UPSTREAM_UNAVAILABLE': return 'Lunch Money is unavailable. Retry shortly.'
      case 'INVALID_RESPONSE': return 'Lunch Money returned an unexpected response.'
      default: return 'Invalid request.'
    }
  }
  return 'Request failed.'
}

export function createReadOnlyServer(context: ToolContext & { connectionState?: string }): McpServer {
  const server = new McpServer({ name: 'lunchmoney-mcp', version: '0.1.0' })
  const ctx = { token: context.token }
  const readonly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  const requireConnection = () => context.token === ''
    ? fail(`No active Lunch Money connection (state: ${context.connectionState ?? 'unconnected'}). Connect your account first.`)
    : undefined

  server.registerTool(
    'lunchmoney_get_overview',
    {
      title: 'Lunch Money overview',
      description: 'Current user, budget and primary currency summary.',
      inputSchema: {},
      annotations: readonly
    },
    async () => {
      const unconnected = requireConnection()
      if (unconnected) return unconnected
      try {
        return ok(await context.adapter.getMe(ctx))
      } catch (error) {
        return fail(describe(error))
      }
    }
  )

  server.registerTool(
    'lunchmoney_list_accounts',
    {
      title: 'List accounts',
      description: 'Manual and synced account names, balances, currencies and status.',
      inputSchema: {},
      annotations: readonly
    },
    async () => {
      const unconnected = requireConnection()
      if (unconnected) return unconnected
      try {
        const [manual, plaid] = await Promise.all([
          context.adapter.listManualAccounts(ctx),
          context.adapter.listPlaidAccounts(ctx)
        ])
        return ok({ manual_accounts: manual.manual_accounts, plaid_accounts: plaid.plaid_accounts })
      } catch (error) {
        return fail(describe(error))
      }
    }
  )

  server.registerTool(
    'lunchmoney_list_transactions',
    {
      title: 'List transactions',
      description: 'One bounded page of transactions. Use next_offset to continue; null means complete.',
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional().describe('Page size, 1-100, default 50'),
        offset: z.number().int().min(0).max(1000000).optional().describe('Continuation offset from a previous next_offset'),
        start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('YYYY-MM-DD, requires end_date'),
        end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('YYYY-MM-DD, requires start_date'),
        manual_account_id: z.number().int().min(0).optional(),
        plaid_account_id: z.number().int().min(0).optional(),
        category_id: z.number().int().min(0).optional(),
        tag_id: z.number().int().min(0).optional(),
        include_pending: z.boolean().optional()
      },
      annotations: readonly
    },
    async (args) => {
      const unconnected = requireConnection()
      if (unconnected) return unconnected
      try {
        return ok(await context.adapter.listTransactions(ctx, args))
      } catch (error) {
        return fail(describe(error))
      }
    }
  )

  return server
}
