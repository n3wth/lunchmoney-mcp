# Codex plugin: lunchmoney-mcp (beta)

Installs the read-only Lunch Money MCP server for Codex.

## Manual config

Equivalent `config.toml` entry:

```toml
[mcp_servers.lunchmoney]
url = "https://mcp-staging.lunchmoney.sh/mcp"
mcp_oauth_resource = "https://mcp-staging.lunchmoney.sh/mcp"
mcp_oauth_callback_port = 1455
```

The callback port must be one of the registered Auth0 loopback ports
(1455 or 8414); Auth0 does not support port wildcards.

On first tool call, Codex runs the OAuth flow (PKCE S256) against
`auth.n3wth.com` / `newth.us.auth0.com`, then `lunchmoney_connect` returns a
Nango link to enter your Lunch Money token in a trusted browser page.

## Verify

After install, `tools/list` must show only the `lunchmoney_*` tools; all
data tools are marked `readOnlyHint`.
