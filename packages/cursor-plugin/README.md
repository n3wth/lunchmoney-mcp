# Lunch Money for Agents — Cursor setup

Read transactions, accounts, categories, tags, recurring items, and budget
summaries from your own Lunch Money account. Financial data is read-only.
This independent project is not affiliated with or endorsed by Lunch Money.

[Website](https://lunchmoney.sh) · [Privacy](https://lunchmoney.sh/privacy)

## Direct MCP setup

Merge the `lunchmoney` entry from [mcp.json](mcp.json) into your project's
`.cursor/mcp.json` or your personal `~/.cursor/mcp.json`. Preserve existing
server entries. In Cursor's Customize page, enable the server and authenticate.

1. Sign in through `auth.n3wth.com` when Cursor prompts you.
2. Ask Cursor to run `lunchmoney_connect` and open its returned browser link.
3. Enter your Lunch Money token only in Nango's browser connection page.
   Never paste it into chat or MCP configuration.
4. Ask about your spending. Use `lunchmoney_disconnect` to disconnect; revoke
   the underlying token separately in Lunch Money.

The public OAuth client ID in this package is not a secret. Cursor uses its
own static OAuth configuration, rather than Claude's callback settings.
The OAuth application must allow Cursor's documented redirect URLs:

- Desktop: `http://localhost:8787/callback`
- Web and Agents: `https://www.cursor.com/agents/mcp/oauth/callback`

Financial results are returned to Cursor and may be processed by its model
provider. Cursor's data settings apply. Transaction results are paginated:
follow `next_offset` before claiming a complete total and never sum currencies.

## Marketplace submission

This directory uses Cursor's `.cursor-plugin/plugin.json` format and root
`mcp.json` discovery. The repository marketplace points to this package.
Submit the public repository at
[Cursor Marketplace](https://cursor.com/marketplace/publish). Submission and
review do not establish publication or Grok Bot compatibility. Grok Bot
availability depends on Cursor's team marketplace and authentication support.

References: [plugin format](https://cursor.com/docs/reference/plugins) and
[static OAuth](https://cursor.com/docs/mcp#static-oauth-for-remote-servers).
