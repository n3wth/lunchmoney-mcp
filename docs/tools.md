---
title: Tools
description: The MCP tools exposed by the connector, pagination behavior, and result limits
---

## Tools

- `lunchmoney_get_overview` — user and budget summary.
- `lunchmoney_list_accounts` — manual and synced accounts.
- `lunchmoney_list_transactions` — one bounded page; pass `next_offset` to
  continue.
- `lunchmoney_list_categories`, `lunchmoney_list_tags`,
  `lunchmoney_list_recurring_items`, `lunchmoney_budget_summary`.
- `lunchmoney_connection_status`, `lunchmoney_connect`,
  `lunchmoney_disconnect`.

## Result limits

The adapter targets Lunch Money v2. Tool schemas describe the supported filters
and bounds. A transaction result is one page, not your full history; follow its
pagination metadata before drawing conclusions about totals. Preserve currency
and decimal values as returned and avoid adding amounts across currencies.
