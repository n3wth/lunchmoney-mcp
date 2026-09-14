# User guide (beta)

This is an unofficial connector for Lunch Money. It is not affiliated with
Lunch Money. It is read-only: it can view your data, never change it.

## Connect

1. Add the MCP server `https://mcp.lunchmoney.sh/mcp` to your client (Codex).
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
- We do not persist financial responses and do not log request bodies,
  tokens, or account data. Hosting request logs (method, path, status,
  timestamp) may be retained by the platform.
- Disconnect removes our connection record. Revoking the Lunch Money token
  itself must be done in the Lunch Money app.
