---
title: Connect your account
description: Add the MCP server to your client, sign in, and link Lunch Money through a browser flow
---

This is an unofficial connector for Lunch Money. It is not affiliated with
Lunch Money. It is read-only: it can view your data, never change it.

<Steps>
  <Step title="Add the server">
    Choose your app in the [website setup picker](https://lunchmoney.sh/#connect),
    or follow the client setup instructions for
    [Codex](https://github.com/n3wth/lunchmoney-mcp/blob/main/packages/codex-plugin/README.md),
    [Claude Code / Cowork](https://github.com/n3wth/lunchmoney-mcp/blob/main/packages/claude-plugin/README.md), or
    [Cursor](https://github.com/n3wth/lunchmoney-mcp/blob/main/packages/cursor-plugin/README.md).

    Cursor also has a one-click installer. Paste this deeplink into your
    browser's address bar:

    `cursor://anysphere.cursor-deeplink/mcp/install?name=lunchmoney&config=eyJ1cmwiOiJodHRwczovL21jcC5sdW5jaG1vbmV5LnNoL21jcCIsImF1dGgiOnsiQ0xJRU5UX0lEIjoieERBRk13WWt3akMzR2lXb0tzclF2WmFFcU9nOHNieEkiLCJzY29wZXMiOlsib3BlbmlkIiwib2ZmbGluZV9hY2Nlc3MiLCJsdW5jaG1vbmV5OnJlYWQiXX19`

    The public [Cursor directory listing](https://cursor.directory/plugins/lunch-money)
    is separate from that deeplink.

    Production is available at `https://mcp.lunchmoney.sh/mcp`, with login at
    `auth.n3wth.com`. Staging remains at `https://mcp-staging.lunchmoney.sh/mcp`.
    Each environment requires its own connection.
  </Step>
  <Step title="Sign in">
    Sign in when prompted (Auth0).
  </Step>
  <Step title="Connect Lunch Money">
    Call `lunchmoney_connect`. Open the returned link in a browser — it is a
    Nango-hosted page. Keep it open. In another tab, open
    [Lunch Money's Developers page](https://my.lunchmoney.app/developers) and
    click **Request New Access Token**. The label and usage fields are optional.
    Copy the token and paste it into the Nango connection page. After it confirms
    success, return to your AI and ask "List my Lunch Money accounts."
  </Step>
  <Step title="Keep the token out of chat">
    Never paste the token into chat or any tool argument.
  </Step>
</Steps>

## Other apps and availability

Other clients need remote HTTP MCP, OAuth with PKCE, and support for a
pre-registered public OAuth client. The endpoint alone is not a universal
installer: each callback URL must be registered with this service before
authentication can succeed. Never supply a Lunch Money token as an MCP header.

<Note>
  ChatGPT directory review is pending. Cowork authentication and Grok Bot
  compatibility have not been verified. See [submission status](/plugin-submissions).
</Note>

## Reconnect and disconnect

Call `lunchmoney_connection_status` to check your connection. If it is missing
or invalid, call `lunchmoney_connect` and complete the browser flow. Call
`lunchmoney_disconnect` to disconnect. If deletion is pending, retry disconnect
until it succeeds. Uninstalling a client plugin does not disconnect the service
or revoke the Lunch Money token.

## Installation references

- [Claude marketplace installation](https://code.claude.com/docs/en/discover-plugins)
- [Claude marketplace format](https://code.claude.com/docs/en/plugin-marketplaces)
- [Cowork plugins](https://claude.com/docs/cowork/guide/plugins)
- [Codex plugin format](https://developers.openai.com/codex/plugins/build)
- Add to Cursor deeplink: `cursor://anysphere.cursor-deeplink/mcp/install?name=lunchmoney&config=eyJ1cmwiOiJodHRwczovL21jcC5sdW5jaG1vbmV5LnNoL21jcCIsImF1dGgiOnsiQ0xJRU5UX0lEIjoieERBRk13WWt3akMzR2lXb0tzclF2WmFFcU9nOHNieEkiLCJzY29wZXMiOlsib3BlbmlkIiwib2ZmbGluZV9hY2Nlc3MiLCJsdW5jaG1vbmV5OnJlYWQiXX19`
- [Cursor directory listing](https://cursor.directory/plugins/lunch-money)
- [Cursor install links](https://cursor.com/docs/mcp/install-links)
- [Cursor OAuth configuration](https://cursor.com/docs/mcp)
- [Compound Engineering installation example](https://github.com/EveryInc/compound-engineering-plugin)
