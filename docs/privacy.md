---
title: Privacy
description: Where your data goes — token storage in Nango, transient reads, and retention
---

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
