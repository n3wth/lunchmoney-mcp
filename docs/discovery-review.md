# Lunch Money MCP initial discovery review

Date: 2026-09-14
Source: https://linear.app/newth/project/lunch-money-mcp-5e3cbc5d645d
Provenance: two Devin Local SWE-2 High discovery workers; independent GPT-6 Astra high-reasoning source review; coordinator verification. This is a reviewed summary, not approval of a deployment.

## N-614: existing authorization service

Public OIDC and authorization-server discovery returned HTTP 200 and advertise issuer `https://auth.n3wth.com/`, authorization endpoint `/authorize`, token endpoint `/oauth/token`, JWKS `/.well-known/jwks.json`, registration `/oidc/register`, and revocation `/oauth/revoke`. Metadata advertises PKCE S256 and plain, public-client token authentication method `none`, and refresh-token grants. These are advertised capabilities, not proof that a particular client is permitted to use them or that security checks are enforced.

Response headers and the supporting n3wth-agents repository identify Auth0 behind the custom domain. The portal uses Cloudflare Access JWTs; that implementation is not the Lunch Money MCP resource server. Preserve the existing identity service while verifying the specific MCP configuration.

The authorization-server domain returned 404 for protected-resource metadata. That metadata belongs on the future MCP resource, so this result does not establish a missing implementation there.

Remaining gates:

- Identify the intended MCP endpoint, code repository, runtime, storage and registered API/resource identifier.
- Verify selected client registration, exact redirect policy, S256 enforcement, consent and public-client grant configuration using an actual test client.
- Verify RFC 8707 resource binding at authorization and token requests; an Auth0 audience parameter is not automatically an equivalent client-compatible substitute.
- Pin the trusted issuer in configuration. Validate signatures/allowed algorithms, audience, expiry and scopes on each request; never trust an issuer supplied by the caller.
- Verify refresh/revocation policy and stable principal-to-owned-Lunch-Money-connection mapping. Keep incoming MCP tokens separate from downstream credentials.
- Publish and test resource discovery and WWW-Authenticate behavior on the actual MCP endpoint.

Scope exception: the worker sent a malformed registration POST and an empty token POST in addition to the requested GET/OPTIONS discovery. Both failed; no successful registration or token issuance was observed. These probes were not needed and should not be repeated. A JSON parse error does not prove registration is open. The reviewed conclusion is **MCP OAuth compatibility remains unverified**.

References: https://auth.n3wth.com/.well-known/openid-configuration ; https://auth.n3wth.com/.well-known/oauth-authorization-server ; https://github.com/n3wth/n3wth-agents . Local portal code and metadata are evidence of their respective surfaces only.

## N-616: contract and client

The pinned `@lunch-money/v2-api-spec@2.11.0` artifact contains OpenAPI 3.0.2 with `info.version: 2.11.0`. Coordinator execution of the worker's local verification script passed the tarball SHA-512 integrity check and counted **59 operations: 25 GET, 11 POST, 10 PUT, 13 DELETE**. This counts the specification; it is not a production test of all endpoints.

Specification YAML SHA-256: `7f1dff2b3cf9e85e91ff7271d3a866981556c44868b5faff60b3932334541076`.

The official changelog labels v2.11.0 dated July 31, 2026. The specification package contains YAML, not an executable SDK. The visible runtime repository snapshot is `@lunch-money/lunch-money-js-v2@2.9.0` with older types, but the published SDK artifact is 2.11.0 and declares spec dependency 2.11.0. Independent offline inspection found crypto/history paths in its generated declarations and a typed raw client; only convenience methods omit those routes. Repository HEAD is not a reliable substitute for inspecting the shipped package.

Published SDK tarball SHA-256: `f35706a7e5aeb3cc6262d5a9123ba8e669d80e0149c2940fd677724a5f8183d0`. Its registry integrity was not captured in this batch, so source authenticity/reproducibility remains a package-pinning gate before installation.

Independent source review found:

- Transaction `getAll` makes one request, not a complete pagination loop; missing `has_more` is defaulted to false.
- No built-in retry/backoff/deadline handling in the inspected client. Convenience errors do not retain response headers needed for Retry-After.
- Transport exceptions are not consistently normalized; provider payloads require sanitization before MCP output.
- Generated TypeScript types do not validate runtime responses. The README's broad runtime-validation claim is unsupported by the inspected implementation.

For a TypeScript runtime, first evaluate the exact published SDK's raw response path and transport extension points behind a narrow adapter. Its typed raw client may avoid unnecessary regeneration. Generate directly from the pinned contract only if fixture tests expose a concrete gap. Preserve response headers and validate consumed response shapes either way. Select this after the repository/runtime decision, not by assuming that the old repository snapshot represents the shipped SDK.

Start with GET `/me`, `/manual_accounts`, `/plaid_accounts`, and one bounded `/transactions` page. Preserve string amounts, currency and sign semantics. Fixture-test continuation/malformed envelopes, 401/403, 429 with Retry-After, network failure/abort, and credential isolation. The shared documented quota is 100 requests/minute per IP.

References: https://lunchmoney.dev/introduction ; https://lunchmoney.dev/v2/changelog ; https://lunchmoney.dev/pagination ; https://lunchmoney.dev/rate-limits ; https://github.com/lunch-money/lunch-money-js-v2 .

## Execution outcome

Model routing is operational: explicit `swe-2-high` workers perform discovery and a separate stronger reviewer checks consequential conclusions. Restricted noninteractive modes failed on approval prompts; Oliver then explicitly approved dangerous mode for the bounded tasks. Mode selection does not expand task scope.

N-614 and N-616 remain In Progress. Auth flow/configuration validation and typed-adapter implementation are still outstanding. No service was built or deployed in this initial batch. GBrain is the durable record; Linear remains the live tracker.
