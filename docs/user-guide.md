# User guide (beta)

This is an unofficial connector for Lunch Money. It is not affiliated with
Lunch Money. It is read-only: it can view your data, never change it.

## Connect

1. Follow the [Codex](../packages/codex-plugin/README.md) or
   [Claude Code](../packages/claude-plugin/README.md) setup instructions.
   Production is available at `https://mcp.lunchmoney.sh/mcp`, with login at
   `auth.n3wth.com`. Staging remains at `https://mcp-staging.lunchmoney.sh/mcp`.
   Each environment requires its own connection.
2. Sign in when prompted (Auth0).
3. Call `lunchmoney_connect`. Open the returned link in a browser — it is a
   Nango-hosted page. Create a personal access token in Lunch Money
   (Settings -> Developers) and paste it there.
4. Never paste the token into chat or any tool argument.

## Tools

- `lunchmoney_get_overview` — user and budget summary.
- `lunchmoney_list_accounts` — manual and synced accounts.
- `lunchmoney_list_transactions` — one bounded page; pass `next_offset` to
  continue.
- `lunchmoney_list_categories`, `lunchmoney_list_tags`,
  `lunchmoney_list_recurring_items`, `lunchmoney_budget_summary`.
- `lunchmoney_connection_status`, `lunchmoney_connect`,
  `lunchmoney_disconnect`.

## Privacy

- Your Lunch Money token is stored in Nango, not by us.
- The server retrieves that token transiently to make allowlisted Lunch Money
  API requests. Read-only enforcement is in this service; the underlying token
  may have broader permissions in Lunch Money.
- Financial results are returned to your MCP client and may be included in
  your conversation with its model provider. That provider's data handling
  settings apply.
- We do not persist financial responses and do not log request bodies,
  tokens, or account data. Hosting request logs (method, path, status,
  timestamp) may be retained by the platform.
- Disconnect blocks further reads and deletes the Nango connection. Lifecycle
  records remain as tombstones to prevent replay or reconnection races.
  Revoking the Lunch Money token itself must be done in the Lunch Money app.

## Reconnect and disconnect

Call `lunchmoney_connection_status` to check your connection. If it is missing
or invalid, call `lunchmoney_connect` and complete the browser flow. Call
`lunchmoney_disconnect` to disconnect. If deletion is pending, retry disconnect
until it succeeds. Uninstalling a client plugin does not disconnect the service
or revoke the Lunch Money token.

## Result limits

The adapter targets Lunch Money v2. Tool schemas describe the supported filters
and bounds. A transaction result is one page, not your full history; follow its
pagination metadata before drawing conclusions about totals. Preserve currency
and decimal values as returned and avoid adding amounts across currencies.
