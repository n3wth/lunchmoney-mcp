# Threat model

Status: draft for beta review. Scope: the hosted read-only Lunch Money MCP
server, the Auth0 authorization boundary, and the Nango credential store.

## Assets

- Lunch Money personal access tokens (stored only in Nango).
- Financial data returned by the Lunch Money API (never persisted by us).
- Auth0 access tokens for the MCP resource.
- Per-user connection metadata (internal user ID, connection ID, state).

## Trust boundaries

1. MCP client -> MCP server: bearer token verified against issuer JWKS,
   audience = resource, RS256 only, `lunchmoney:read` scope required.
2. MCP server -> Auth0 JWKS: remote key set with timeout/cooldown/cache;
   unknown issuers, keys, algorithms and audiences fail closed.
3. MCP server -> Nango: server-side secret only; connection IDs are scoped
   to the authenticated internal user; the Lunch Money token is entered only
   in Nango's hosted Connect UI and never passes through a tool argument or
   model message.
4. MCP server -> Lunch Money: the adapter only issues GET requests to a fixed
   origin and an allowlisted set of read paths; `redirect: error` prevents a
   bearer token ever being forwarded to a different host.

## Identity and isolation

- Tenant identity is `(iss, sub)` from a verified token. Email claims,
  session IDs, and caller-supplied IDs are never used.
- One active Lunch Money connection per internal user; reconnect replaces
  the old connection atomically (old marked revoked).
- Cross-user access fails closed: connection ownership is checked by
  internal user ID on every lifecycle operation.

## Threats and mitigations

| Threat | Mitigation |
| --- | --- |
| Stolen/forged access token | issuer+audience+signature+expiry verified; zero clock tolerance; required claims enforced |
| Scope escalation | exact `lunchmoney:read` match; write/destructive scopes rejected with 403 |
| Token replay via redirect | `redirect: error`; fixed upstream origin |
| Financial data exfiltration | zod projections strip undeclared fields (to_base, notes, metadata); bounded pages; 1 MiB response cap |
| Cross-tenant data access | per-user connection binding; isolation test with two users |
| Brute force / abuse | per-user and global request rate limiting; 429 + Retry-After |
| Credential leakage in logs | errors normalized to fixed codes; no token or provider payload in messages/stacks; `onEvent` carries no bodies |
| Malformed/oversized upstream data | schema validation; body size cap; deadline; bounded retries honoring Retry-After |
| Confused-deputy connect flow | Nango session bound to internal user ID and restricted to the Lunch Money integration; completion must be validated server-side before activation |

## Known gaps (beta blockers if unverified)

- No durable store yet: identity/connection state is in-memory. A restart
  loses all mappings; a persistent store is required before staging.
- Nango webhook/connection-completion verification is not implemented;
  `pending:` placeholder connections must not be activatable without a real
  Nango connection ID.
- Real Auth0 authorization-code + PKCE flow not yet executed end-to-end.
- No revocation propagation from Lunch Money token revocation to
  `invalid`/`revoked` state yet.
- No audit trail; `onEvent` hook exists but is not wired to a sink.

## Out of scope for beta

- Write and destructive Lunch Money operations (no such tools exist).
- Multi-budget selection and shared connections.
- Cached financial data of any kind.
