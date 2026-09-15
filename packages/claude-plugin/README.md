# Lunch Money MCP for Claude Code

![Lunch Money MCP](assets/icon.png)

Unofficial plugin for read-only Lunch Money data at
`https://mcp.lunchmoney.sh/mcp`. It bundles a remote HTTP MCP connection with
a registered public OAuth client; no API token or client secret is packaged.

## Load the package

From the repository root:

```sh
claude --plugin-dir ./packages/claude-plugin
```

This loads the package for that Claude Code session. It does not publish a
marketplace entry or persistently install the plugin. For a permanent install,
a Claude plugin marketplace must list this directory as its source.

In Claude Code, run `/mcp`, select the Lunch Money plugin server, and complete
browser authentication at `auth.n3wth.com`. The fixed callback port is 8414. The registered URI is
`http://localhost:8414/callback`; older clients may use the registered
`http://127.0.0.1:8414/callback` variant. Leave this port available during login.

Ask for connection status, then call `lunchmoney_connect` and open its trusted
Nango link to enter your Lunch Money API token. Never paste the token into chat.
Do not also add the same server manually, which creates duplicate connections.

## Verify

From the repository root:

```sh
claude plugin validate ./packages/claude-plugin
```

After authenticating, confirm `lunchmoney_connection_status`, connect, and read
a small date range of transactions. Financial data tools are read-only;
connection and disconnect tools change connector state. Verify disconnect and
reconnect; disconnect deletes the Nango connection.
Uninstalling the plugin alone does not delete server data.
Revoke the API token in Lunch Money itself to fully revoke that token.

Manifest validation does not verify browser login or external-user access.
Claude Desktop and Cowork installation have not been validated by this package's
Claude Code checks. This package is not a Claude Desktop `.mcpb` extension.

## References

- [Claude plugin manifest reference](https://code.claude.com/docs/en/plugins-reference)
- [Pre-configured OAuth clients](https://code.claude.com/docs/en/mcp#use-pre-configured-oauth-credentials)
