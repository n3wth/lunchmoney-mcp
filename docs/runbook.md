# Operator runbook (staging)

Status: deployed to Cloudflare Workers staging at
`https://lunchmoney-mcp-staging.newth.workers.dev` (worker
`lunchmoney-mcp-staging`). The custom hostname
`mcp-staging.lunchmoney.sh` is not yet mapped; the workers.dev URL is the
live endpoint. Deploy with `npx wrangler deploy` from `packages/server`;
`NANGO_SECRET_KEY` is a Wrangler secret (persists across deploys).

## Worker architecture

- `src/worker.ts` is a native `export default { fetch(request, env) }`
  entrypoint; `src/index.ts` exposes `createMcpFetchHandler` built on the
  MCP SDK `WebStandardStreamableHTTPServerTransport`. The Node path
  (`npm start`) still uses `StreamableHTTPServerTransport` via
  `createMcpHttpServer`; both share one auth/rate-limit/reconciliation
  pipeline.
- Do NOT reintroduce `cloudflare:node` `httpServerHandler`: outbound
  `fetch()` through that bridge fails with Cloudflare error 1042.
- workerd quirks found and fixed:
  - `RequestInit.redirect: 'error'` is unsupported (constructor throws);
    the adapter uses `redirect: 'manual'` and rejects any 3xx as
    INVALID_RESPONSE, preserving the no-follow/no-token-leak intent.
  - `fetch` must be invoked with the global receiver: calling a stored
    `this.fetchImpl(...)` throws `TypeError: Illegal invocation`.
    `NangoProvider` wraps the impl so the receiver never reaches it.
    Node's fetch ignores `this`, so unit tests cannot catch this — a
    this-sensitive mock test guards the regression.
- The worker logs sanitized upstream failures only (`nango.<method>
  failed` message strings, `upstream fetch: <status> <url>`); no headers,
  bodies, or credentials are ever logged.

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
  performs no upstream validation. The server validates credentials itself
  with `GET https://api.lunchmoney.dev/v2/me` before activating a connection
  (N-625). The API_KEY credential is read from `credentials.apiKey` on
  `GET /connections/{id}?provider_config_key=lunch-money`; pending
  connections with a real Nango connection ID are reconciled lazily on the
  next MCP request (no webhook required).
- API Keys tab holds a "Default - Full access" key; copy it into
  `NANGO_SECRET_KEY` in `packages/server/.env` (gitignored; `npm start`
  loads it via `--env-file`). Key values were not exfiltrated to this repo.
- Verified 2026-09-14: full-access dev key creates Connect sessions and
  reads connection credentials; dashboard-created `lunch-money` connection
  `e0eeb7b1` credential validated live against `GET /v2/me` (200).
- Verified 2026-09-15 end-to-end: real Auth0 auth-code + PKCE token
  (aud `https://mcp-staging.lunchmoney.sh/mcp`, scope `lunchmoney:read`)
  accepted by `POST /mcp`; `lunchmoney_connect` -> Connect UI -> lazy
  reconciliation discovers the connection via `tags.end_user_id` and
  activates it; all 8 read tools returned live Lunch Money data.
- Placeholder pending connections (`pending:<userId>`) are reconciled on
  the next authenticated request by listing Nango connections and matching
  `tags.end_user_id`; webhooks remain optional, not required.
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

Identity/connection state is in-memory AND per-isolate on Workers: each
isolate holds its own store, so the same user can appear `unconnected` on
one request and `active` on the next. Any deploy or isolate eviction
disconnects every user on that isolate. Self-heals: the next request
re-runs pending reconciliation or the user re-runs `lunchmoney_connect`
(free, idempotent). A durable store (D1/KV/Durable Objects) is a staging
blocker.

## Revocation

`lunchmoney_disconnect` removes our connection record and deletes the Nango
connection. It cannot revoke the underlying Lunch Money token; instruct
users to revoke it in the Lunch Money app if they want full revocation.
