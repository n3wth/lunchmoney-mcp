# Codex plugin: lunchmoney-mcp (beta)

Installs the read-only Lunch Money MCP server for Codex.

The package uses `.codex-plugin/plugin.json` with a companion `.mcp.json`.
Its package ID matches the directory (`codex-plugin`); its display name is
Lunch Money MCP. The HTTP endpoint is live. Plugin OAuth fields use camelCase;
manual TOML uses snake_case, as shown below.

## Manual config

Equivalent `config.toml` entry:

```toml
mcp_oauth_callback_port = 1455

[mcp_servers.lunchmoney]
url = "https://mcp-staging.lunchmoney.sh/mcp"
oauth_resource = "https://mcp-staging.lunchmoney.sh/mcp"

[mcp_servers.lunchmoney.oauth]
client_id = "tpc_7LrtaTYxgcqM9cRVbinCk2"
callback_url = "http://127.0.0.1:1455/callback"
callback_port = 1455
```

The callback port must be one of the registered Auth0 loopback ports
(1455 or 8414); Auth0 does not support port wildcards.

Run `codex mcp login lunchmoney --scopes lunchmoney:read,offline_access`.
Codex runs the OAuth flow (PKCE S256) against
`newth.us.auth0.com`, then `lunchmoney_connect` returns a
Nango link to enter your Lunch Money token in a trusted browser page.

## Verify

After install, `tools/list` must show only the `lunchmoney_*` tools; all
data tools are marked `readOnlyHint`.
