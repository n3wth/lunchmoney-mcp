# Plugin directory submissions

## Listing materials

- Name: Lunch Money MCP
- Publisher: Oliver Newth (independent; not affiliated with Lunch Money)
- Summary: Read-only access to your Lunch Money data.
- Description: Connect your own Lunch Money account through a secure browser flow, then query transactions, categories, accounts, tags, and budget summaries. Financial data tools are read-only. Connection management can connect or disconnect the account; account deletion removes connector data.
- Website: https://lunchmoney.sh
- Privacy: https://lunchmoney.sh/privacy
- Support: https://github.com/n3wth/lunchmoney-mcp/issues
- MCP endpoint: https://mcp.lunchmoney.sh/mcp
- Source: https://github.com/n3wth/lunchmoney-mcp
- Codex package: `packages/codex-plugin`
- Claude package: `packages/claude-plugin`
- Canonical logo: `site/icon.png`; package copies: `assets/icon.png`.

## OpenAI Plugins Directory (ChatGPT and Codex)

[Official submission guide](https://developers.openai.com/plugins/deploy/submission)
and [submission portal](https://platform.openai.com/plugins).
Choose **Create plugin > With MCP**. Local marketplace registration is not a
directory submission.

On 2026-09-15, the portal's Newth organization blocked draft creation with:
“You need a verified developer identity before you can create or upload a plugin.”
The publisher must complete identity verification before submission can proceed.
No OpenAI submission was created.

The review also requires public privacy and terms URLs, domain verification,
accurate tool annotations, test access, supported countries, and policy
attestations. Do not mark live tests complete or invent review credentials.

### Review cases

Expected positive behavior:

1. Check connection status: return current state for the authenticated account.
2. Connect: return a trusted Nango browser link without requesting an API token in chat.
3. List transactions for a small date range: return only the authenticated account's data.
4. List categories: return categories from the connected account.
5. Read budget summary: return data with the requested period preserved.

Expected negative behavior:

1. Request a transaction modification: explain that financial writes are unavailable.
2. Request another user's financial data: deny access; no cross-account disclosure.
3. Query with missing/expired authentication: require authentication without leaking data.

These are reviewer scenarios, not a claim that all live flows have been tested.

## Claude official plugin directory

[Official submission guide](https://claude.com/docs/plugins/submit).
Submit the public package URL
`https://github.com/n3wth/lunchmoney-mcp/tree/main/packages/claude-plugin` through
[Claude Console](https://platform.claude.com/plugins/submit) or
[Claude organization settings](https://claude.ai/admin-settings/directory/submissions/plugins/new).
Console requires Developer, Admin, or Owner; Claude organization settings require
a Team/Enterprise organization with directory management access.

On 2026-09-15, the publisher submitted the listing as **Lunch Money**.
Claude Console independently confirmed **Submitted and pending review**.
The submission includes Claude Code and Cowork; Cowork validation remains open.
Review is pending, and acceptance or publication is not yet confirmed.

Validate with `claude plugin validate packages/claude-plugin` before submitting.
A submitted form must return a confirmation or submission record before its
status is recorded as submitted. Acceptance and publication are separate steps.
The Claude manifest has no documented logo field, so the shared logo is bundled
and displayed in its README and supplied to the submission form when requested.

## Official MCP Registry

Published version `0.1.0` on 2026-09-15 as `io.github.n3wth/lunchmoney-mcp`.
The registry API confirms status `active` and `isLatest: true`.
[Publishing run](https://github.com/n3wth/lunchmoney-mcp/actions/runs/34928352424).

## Publisher permission

The creator of Lunch Money has been contacted to request written permission
for directory listings and descriptive use of the product name. A response is
pending; no endorsement or permission is claimed.
