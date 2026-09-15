# Operator runbook

## Production promotion (2026-09-15 UTC)

Production provisioning is in progress. Do not infer release readiness from a
successful bundle or unauthenticated smoke check. Linear N-617 tracks the
remaining live lifecycle, rollback, capacity, and external-user gates.

| Resource | Production value |
| --- | --- |
| Public MCP | `https://mcp.lunchmoney.sh/mcp` |
| Worker | `lunchmoney-mcp-production` |
| Wrangler config | `packages/server/wrangler.production.jsonc` |
| D1 | `lunchmoney-mcp-production-identity` |
| Database ID | `b3f05c40-2e28-4e3b-93cf-4f44cb79c162` |
| Telemetry | `lunchmoney_mcp_production` |
| Nango environment | `prod` |
| OAuth audience | `https://mcp.lunchmoney.sh/mcp` |

Production D1 was created with read replication disabled. Migration
`0001_identity.sql` was applied through the Cloudflare connector and read back
from `d1_migrations`; tables and uniqueness indexes were verified. Staging data
and credentials are not copied to production. Users must connect separately.

Auth0 production API `6aa8bf18085cb3823c3b0038` uses RS256. Native public client
`xDAFMwYkwjC3GiWoKsrQvZaEqOg8sbxI` has user-delegated `lunchmoney:read`,
authorization code and refresh grants, and no client-credentials grant.
Registered callbacks are `http://127.0.0.1:1455/callback`,
`http://127.0.0.1:8414/callback`, and `http://localhost:8414/callback`.
Configuration was saved and read back; live production OAuth still needs a
separate check after the endpoint is deployed.

From `packages/server`, use an explicit config for every production command:

```bash
npx wrangler d1 migrations apply IDENTITY_DB --remote --config wrangler.production.jsonc
npx wrangler deploy --dry-run --config wrangler.production.jsonc
npx wrangler deploy --config wrangler.production.jsonc
```

Before deployment, install the **prod** Nango key and distinct webhook signing
key as Worker secrets `NANGO_SECRET_KEY` and `NANGO_WEBHOOK_SIGNING_KEY`.
Never use the staging `.env` for this. Production secret material may be held
temporarily in gitignored `.env.production` with permissions 0600. Secrets must
not appear in Wrangler vars, plugin packages, command arguments, or logs.

Vercel project `lunchmoney-mcp` must own `mcp.lunchmoney.sh` and route it to
`https://lunchmoney-mcp-production.newth.workers.dev`. The host-conditioned
rewrite preserves the staging route. The apex landing page remains separate.

After deployment, from the repository root:

```bash
node scripts/validate-release.mjs
node scripts/smoke-public.mjs https://mcp.lunchmoney.sh/mcp
node scripts/smoke-public.mjs https://mcp-staging.lunchmoney.sh/mcp
```

These smoke checks cover discovery, unauthorized/invalid-token rejection, and
forged webhook rejection. They do not prove OAuth login, downstream reads,
real webhook delivery, or client installation. Record those separately.

### Rollback

Record the current Worker version before each release with
`npx wrangler deployments list --config wrangler.production.jsonc`. To restore
the previous compatible Worker version, use
`npx wrangler rollback <version-id> --config wrangler.production.jsonc`, then
repeat public smoke and authenticated lifecycle checks. Rollback does not undo
D1 migrations or Nango/Auth0 configuration; retain backward-compatible schema
changes. Do not delete the production database to roll back code.

If no previous healthy production version exists, remove the production host
rewrite and redeploy routing to disable public access while diagnosing. Never
point production traffic at the staging database or Worker. A rollback drill
has not yet been demonstrated; N-617 remains open until it is recorded.

### Capacity limits

Current request rate limiting is per Worker isolate (60/user and 600 total
per minute). It is not a globally shared quota and does not prove upstream
egress capacity under multiple isolates. Shared limits and measured beta
capacity remain tracked under N-612/N-617.

## Staging

Status: staging is live at `https://mcp-staging.lunchmoney.sh/mcp`.
Vercel project `lunchmoney-mcp` owns the staging hostname and rewrites requests
to Worker `lunchmoney-mcp-staging` at
`https://lunchmoney-mcp-staging.newth.workers.dev`. DNS remains on Vercel;
the separate `lunchmoney-landing` project continues serving the main site.
This is a Vercel reverse proxy, not a Cloudflare Worker Custom Domain.
The Auth0 resource/audience remains unchanged.

Deploy the Worker with `npx wrangler deploy` from `packages/server`.
Deploy routing changes with `vercel deploy --prod` from the repo root, linked
to project `lunchmoney-mcp`. `.vercelignore` excludes packages and local secrets.
`NANGO_SECRET_KEY` and `NANGO_WEBHOOK_SIGNING_KEY` are Wrangler secrets.

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
- The Worker emits only allowlisted event labels and numeric HTTP status codes
  to console and Analytics Engine dataset `lunchmoney_mcp_staging`. No raw
  exceptions, URLs, user IDs, headers, bodies, or credentials are logged.
  Sink failure does not fail the request. Runtime invocation logging is not
  enabled. The cached pipeline retains its per-isolate rate-limit counters;
  identity and connection records live in D1.

## Configuration

Environment variables for `packages/server` (`npm run start`):

| Variable | Purpose |
| --- | --- |
| `LM_AUTH_ISSUER` | `https://newth.us.auth0.com/` (trailing slash required) |
| `LM_AUTH_RESOURCE` | `https://mcp-staging.lunchmoney.sh/mcp` |
| `LM_AUTH_JWKS_URI` | `https://newth.us.auth0.com/.well-known/jwks.json` |
| `LM_METADATA_URL` | `https://mcp-staging.lunchmoney.sh/.well-known/oauth-protected-resource` |
| `NANGO_SECRET_KEY` | Nango environment secret (dev env only for staging) |
| `NANGO_WEBHOOK_SIGNING_KEY` | Distinct Nango dev webhook signing key; Wrangler secret |
| `NANGO_ENVIRONMENT` | Exact Nango environment name, `dev` (case-sensitive) |
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
- Webhooks Primary URL is `https://mcp-staging.lunchmoney.sh/webhooks/nango`.
  Auth creation and deletion subscriptions are enabled in `dev`.
- Verification uses `X-Nango-Hmac-Sha256`, HMAC-SHA256 over the exact raw
  request bytes with the separate webhook signing key. Legacy signature
  headers are rejected. Requests are capped at 64 KiB before JSON parsing.
  Unknown events, integrations, and environments are ignored after verification.
- Creation claims an existing pending connection for the tagged user and calls
  `GET /v2/me` before activation. Deletion marks only the matching user's
  connection deleted. Atomic claims prevent polling/webhook races from
  resurrecting disconnected records; real connection IDs remain tombstones.
  Transient processing failures return 503 so Nango can retry. Lazy discovery
  remains a fallback if a webhook is missed.
- Source: https://nango.dev/docs/guides/platform/webhooks-from-nango

## Health checks

- `GET /.well-known/oauth-protected-resource` -> 200 JSON.
- `POST /mcp` without a token -> 401 with `WWW-Authenticate: Bearer resource_metadata=...`.

## Failure modes

- Upstream 401/403 -> tool error telling the user to reconnect.
- Upstream 429 -> RATE_LIMITED with retryAfterSeconds when provided.
- Deadline exceeded -> DEADLINE_EXCEEDED (default 8s total budget).
- Rate limit (ours) -> HTTP 429, `retry-after: 60`.

## Restart behavior

Worker identity/connection state is stored in D1 database
`lunchmoney-mcp-staging-identity` (`8ad2effa-96bf-40b3-b596-671a7222ca31`),
binding `IDENTITY_DB`. Read replication is disabled. Credentials remain in
Nango; D1 stores only identity and connection lifecycle records.

D1 was chosen over KV because revocation and identity creation need consistent
reads and atomic writes. SQL uniqueness enforces `(issuer, subject)` and one
pending/active connection per user. Batch transactions make replacement atomic.
Durable Objects could provide consistency but would add identity routing and
cross-object lookup complexity for this small relational store.

Apply schema changes before deploying with
`npx wrangler d1 migrations apply IDENTITY_DB --remote`. The initial migration
was applied through the Cloudflare connector because local Wrangler credentials
returned D1 code 7403; `d1_migrations` records `0001_identity.sql` as applied.
Future operators need D1 edit permission for that command.

The Node development path and unit tests can still use `InMemoryIdentityStore`.
New durable users use UUIDs. Old isolate-local `usr_1`-style identities cannot
be safely migrated (different isolates reused those IDs); existing staging
testers must connect once after the migration. Never adopt old Nango connections
by guessing their owner. Subsequent deploys preserve D1 connection state.

## Observability

Analytics Engine stores `blob1` = allowlisted event type and `double1` = status
(0 when absent). Use the Analytics Engine SQL API or dashboard to query:

```sql
SELECT blob1, double1, SUM(_sample_interval) AS events
FROM lunchmoney_mcp_staging
WHERE timestamp > NOW() - INTERVAL '1' DAY
GROUP BY blob1, double1
```

Do not enable logging of full requests or raw provider exceptions while debugging.
Check Nango's dev webhook delivery logs for delivery status; never copy headers
or payloads into issues. The Cloudflare connector's SQL wrapper currently reports
an error on the Analytics Engine API's nonstandard HTTP 200 response; use a
direct authorized SQL client or dashboard for read-back.
Direct SQL read-back verified persisted request, upstream-response, and
webhook-processed events. The local restricted token returns 403 for this API;
an existing authorized account credential succeeded. Never print credentials.

## Beta validation (2026-09-15 UTC)

- Public hostname: metadata 200; unauthenticated MCP 401.
- Codex CLI 0.154.0: Auth0 PKCE login succeeded, then connection status,
  connect, and all seven data tools succeeded through the public hostname.
- Nango creation webhook recorded SUCCESS; D1 became active before another
  MCP request (no polling reconciliation). Deleting the retired test connection
  through Nango triggered deletion in D1 while the new connection stayed active.
- Current Worker deployment: `8183d9b5-acf7-42eb-bd20-332e50bab554`.
- Server: 27 tests; adapter: 15; auth-contract: 14. Server tests exercise
  real D1 via Miniflare, concurrent identity/connection claims, cross-user
  rejection, transactional rollback, signed webhook lifecycle, replay,
  invalid credentials, and telemetry sanitization.
- Plugin manifest and companion MCP configuration validate. Codex plugin OAuth
  fields are camelCase; manual TOML fields are snake_case. Set both callback
  URL and listener port to 1455. Use explicit scopes on `codex mcp login`.

## Revocation

`lunchmoney_disconnect` removes our connection record and deletes the Nango
connection. It cannot revoke the underlying Lunch Money token; instruct
users to revoke it in the Lunch Money app if they want full revocation.
