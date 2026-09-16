# User guide (beta)

This is an unofficial connector for Lunch Money. It is not affiliated with
Lunch Money. It is read-only: it can view your data, never change it.

## Connect

1. Choose your app in the [website setup picker](https://lunchmoney.sh/#connect),
   or follow [Codex](../packages/codex-plugin/README.md),
   [Claude Code / Cowork](../packages/claude-plugin/README.md), or
   [Cursor](../packages/cursor-plugin/README.md) setup instructions.
   Cursor also has a one-click installer:
   [Add to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=lunchmoney&config=eyJ1cmwiOiJodHRwczovL21jcC5sdW5jaG1vbmV5LnNoL21jcCIsImF1dGgiOnsiQ0xJRU5UX0lEIjoieERBRk13WWt3akMzR2lXb0tzclF2WmFFcU9nOHNieEkiLCJzY29wZXMiOlsib3BlbmlkIiwib2ZmbGluZV9hY2Nlc3MiLCJsdW5jaG1vbmV5OnJlYWQiXX19).
   Production is available at `https://mcp.lunchmoney.sh/mcp`, with login at
   `auth.n3wth.com`. Staging remains at `https://mcp-staging.lunchmoney.sh/mcp`.
   Each environment requires its own connection.
2. Sign in when prompted (Auth0).
3. Call `lunchmoney_connect`. Open the returned link in a browser — it is a
   Nango-hosted page. Keep it open. In another tab, open
   [Lunch Money’s Developers page](https://my.lunchmoney.app/developers) and
   click **Request New Access Token**. The label and usage fields are optional.
   Copy the token and paste it into the Nango connection page. After it confirms
   success, return to your AI and ask “List my Lunch Money accounts.”
4. Never paste the token into chat or any tool argument.

## Other apps and availability

Other clients need remote HTTP MCP, OAuth with PKCE, and support for a
pre-registered public OAuth client. The endpoint alone is not a universal
installer: each callback URL must be registered with this service before
authentication can succeed. Never supply a Lunch Money token as an MCP header.

ChatGPT directory review is pending. Cowork authentication and Grok Bot
compatibility have not been verified. See [submission status](plugin-submissions.md).

## Installation references

- [Claude marketplace installation](https://code.claude.com/docs/en/discover-plugins)
- [Claude marketplace format](https://code.claude.com/docs/en/plugin-marketplaces)
- [Cowork plugins](https://claude.com/docs/cowork/guide/plugins)
- [Codex plugin format](https://developers.openai.com/codex/plugins/build)
- [Add to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=lunchmoney&config=eyJ1cmwiOiJodHRwczovL21jcC5sdW5jaG1vbmV5LnNoL21jcCIsImF1dGgiOnsiQ0xJRU5UX0lEIjoieERBRk13WWt3akMzR2lXb0tzclF2WmFFcU9nOHNieEkiLCJzY29wZXMiOlsib3BlbmlkIiwib2ZmbGluZV9hY2Nlc3MiLCJsdW5jaG1vbmV5OnJlYWQiXX19)
- [Cursor install links](https://cursor.com/docs/mcp/install-links)
- [Cursor OAuth configuration](https://cursor.com/docs/mcp)
- [Compound Engineering installation example](https://github.com/EveryInc/compound-engineering-plugin)

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

Read the [privacy notice](https://lunchmoney.sh/privacy) for storage,
service providers, retention, and contact information.

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
