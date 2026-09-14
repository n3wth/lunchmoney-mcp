# Operator runbook (staging)

Status: draft. The service is not deployed yet.

## Configuration

Environment variables for `packages/server` (`npm run start`):

| Variable | Purpose |
| --- | --- |
| `LM_AUTH_ISSUER` | `https://newth.us.auth0.com/` (trailing slash required) |
| `LM_AUTH_RESOURCE` | `https://mcp-staging.lunchmoney.sh/mcp` |
| `LM_AUTH_JWKS_URI` | `https://newth.us.auth0.com/.well-known/jwks.json` |
| `LM_METADATA_URL` | `https://mcp-staging.lunchmoney.sh/.well-known/oauth-protected-resource` |
| `NANGO_SECRET_KEY` | Nango environment secret (dev env only for staging) |
| `LM_ENV` | `development` or `production` |
| `PORT` | listen port (default 8787) |

Auth0 staging objects (tenant `newth`):

- API `Lunch Money MCP Staging`, identifier `https://mcp-staging.lunchmoney.sh/mcp`,
  permission `lunchmoney:read`.
- Native third-party app `Lunch Money MCP Staging - Codex`
  (`tpc_7LrtaTYxgcqM9cRVbinCk2`), token endpoint auth `none`, grants
  Authorization Code + Refresh Token, rotation enabled.
- Tenant: Resource Parameter Compatibility Profile and Include Issuer in
  Authorization Responses are enabled.

Codex must pin `mcp_oauth_callback_port` to 1455 or 8414 (registered
loopback callback ports; Auth0 does not allow port wildcards).

## Nango (configured 2026-09-14)

- Account: `app.nango.dev`, owner `oliver@newth.ai`.
- Environment `dev` (ID `e75ce2f6-c384-4e55-af68-e5e2429c01b7`); `prod`
  is a separate environment — staging uses `dev` keys only.
- Integration `lunch-money` (display name "Lunch Money"), template
  `private-api-bearer`, auth type API Key. Nango Connect UI prompts the
  user for the bearer token; no client/secret config is required.
- There is no prebuilt Lunch Money provider; the generic bearer template
  performs no upstream validation. The server must validate credentials
  itself with `GET /v2/me` before activating a connection (N-625).
- API Keys tab holds a "Default - Full access" key; copy it into
  `NANGO_SECRET_KEY`. Key values were not exfiltrated to this repo.
- Webhooks tab: signing key exists (use it to verify
  `Nango-Signature`); Primary URL is unset pending a deployed staging
  endpoint, so the "Auth: new connection" and "Auth: connection
  deletion" subscriptions remain disabled. Until a URL is configured,
  connection completion must rely on server-side connect-session
  reconciliation, not webhook trust.

## Health checks

- `GET /.well-known/oauth-protected-resource` -> 200 JSON.
- `POST /mcp` without a token -> 401 with `WWW-Authenticate: Bearer resource_metadata=...`.

## Failure modes

- Upstream 401/403 -> tool error telling the user to reconnect.
- Upstream 429 -> RATE_LIMITED with retryAfterSeconds when provided.
- Deadline exceeded -> DEADLINE_EXCEEDED (default 8s total budget).
- Rate limit (ours) -> HTTP 429, `retry-after: 60`.

## Restart behavior

Identity/connection state is in-memory: a restart disconnects every user.
A durable store is a staging blocker.

## Revocation

`lunchmoney_disconnect` removes our connection record and deletes the Nango
connection. It cannot revoke the underlying Lunch Money token; instruct
users to revoke it in the Lunch Money app if they want full revocation.
