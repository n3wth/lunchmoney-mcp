export interface AnalyticsSink {
  writeDataPoint(event: { blobs: string[]; doubles: number[] }): void
}
const types = new Set(['request', 'rate_limited', 'connection_discovery_failed',
  'connection_activated', 'connection_invalid', 'connection_validation_failed',
  'webhook_processed', 'webhook_failed', 'upstream_response', 'upstream_failed', 'request_failed'])
const toolNames = new Set(['lunchmoney_get_overview', 'lunchmoney_list_accounts',
  'lunchmoney_list_transactions', 'lunchmoney_list_categories', 'lunchmoney_list_tags',
  'lunchmoney_list_recurring_items', 'lunchmoney_budget_summary',
  'lunchmoney_connection_status', 'lunchmoney_connect', 'lunchmoney_disconnect'])
for (const name of toolNames) types.add('tool_call:' + name)

// Count authenticated, rate-limit-admitted tool requests, not successful reads.
export function toolCallEvent(body: unknown): string | undefined {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return
  const message = body as { method?: unknown; params?: { name?: unknown } }
  if (message.method !== 'tools/call' || typeof message.params?.name !== 'string') return
  if (toolNames.has(message.params.name)) return 'tool_call:' + message.params.name
}
export function createObserver(sink?: AnalyticsSink) {
  return (event: { type: string; status?: number }): void => {
    const type = types.has(event.type) ? event.type : 'request_failed'
    const status = Number.isInteger(event.status) && event.status! >= 100 && event.status! <= 599 ? event.status! : 0
    // Only allowlisted labels and status codes; no errors, URLs or identities.
    console.warn(type, status)
    try { sink?.writeDataPoint({ blobs: [type], doubles: [status] }) } catch { /* best effort */ }
  }
}
