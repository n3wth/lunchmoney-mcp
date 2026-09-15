export interface AnalyticsSink {
  writeDataPoint(event: { blobs: string[]; doubles: number[] }): void
}
const types = new Set(['request', 'rate_limited', 'connection_discovery_failed',
  'connection_activated', 'connection_invalid', 'connection_validation_failed',
  'webhook_processed', 'webhook_failed', 'upstream_response', 'upstream_failed', 'request_failed'])
export function createObserver(sink?: AnalyticsSink) {
  return (event: { type: string; status?: number }): void => {
    const type = types.has(event.type) ? event.type : 'request_failed'
    const status = Number.isInteger(event.status) && event.status! >= 100 && event.status! <= 599 ? event.status! : 0
    // Only allowlisted labels and status codes; no errors, URLs or identities.
    console.warn(type, status)
    try { sink?.writeDataPoint({ blobs: [type], doubles: [status] }) } catch { /* best effort */ }
  }
}
