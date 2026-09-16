---
title: Lunch Money MCP execution plan
description: Dated snapshot of the Lunch Money MCP execution plan, including scope, architecture, milestones, and validation requirements.
---

Source: https://linear.app/newth/project/lunch-money-mcp-5e3cbc5d645d
Source date: 2026-09-14
Provenance: project reviewed and revised in Codex task 01a09f3c-41a2-7e03-8103-00cadb4d71cb; current Linear readback. Linear is the live execution tracker; this is a dated GBrain snapshot.

## Objective

Build and publish a multi-user hosted Lunch Money MCP and Codex plugin using the existing [auth.n3wth.com](<https://auth.n3wth.com>) authorization service and Nango for downstream credentials. Ship a usable read-only external beta before introducing mutations.

## First-release scope

* One active Lunch Money connection per authenticated user, entered through trusted browser UI.
* User/account overview, filtered transaction list/detail, categories/tags, recurring items, and budget summary where supported by the pinned production API.
* Installable Codex plugin, connection/reconnect/disconnect/deletion flows, privacy disclosure, operator runbook and external-user validation.
* Explicitly bounded results with currency, decimal/sign/date semantics and visible pagination/partial-data limits.

Later: additional history/crypto reads, scoped writes, then individually approved destructive tools. Full API exposure is not a beta requirement.

## Architecture and trust boundaries

1. MCP client obtains an access token from [auth.n3wth.com](<http://auth.n3wth.com>) for this MCP resource. [N-614](https://linear.app/newth/issue/N-614/audit-authn3wthcom-oauth-and-mcp-compatibility) verifies actual protocol, discovery, registration, PKCE, refresh/revocation and client compatibility.
2. MCP server validates token and scope on every request and maps verified (issuer, subject) to an internal user. A session ID or caller-supplied connection ID never establishes ownership.
3. Backend issues a short-lived Nango connect session restricted to Lunch Money. Server verifies completion and binds the owned connection; token entry never passes through the model.
4. An allowlisted typed adapter resolves the user's active connection and calls the pinned Lunch Money API. [N-625](https://linear.app/newth/issue/N-625/configure-nango-lunch-money-bearer-token-connection) selects Nango proxy versus transient server-side credential retrieval and verifies logging/egress implications.
5. Shared upstream limits, per-user fairness, bounded retries/deadlines and redacted telemetry protect every call. No financial replication or persistent response cache in the initial design.

Store identity/connection lifecycle metadata only. Downstream credentials remain in Nango; MCP tokens are never passed through to Lunch Money. MCP read/write/destructive scopes are application enforcement, independent of permissions carried by the Lunch Money token.

## Delivery order and release gates

| Milestone | Deliverable and exit gate |
| -- | -- |
| 1. Architecture and vertical slice | [N-614](https://linear.app/newth/issue/N-614/audit-authn3wthcom-oauth-and-mcp-compatibility) → [N-611](https://linear.app/newth/issue/N-611/define-identity-tenant-and-credential-data-model) → [N-618](https://linear.app/newth/issue/N-618/implement-authenticated-mcp-server-skeleton)/[N-625](https://linear.app/newth/issue/N-625/configure-nango-lunch-money-bearer-token-connection), alongside [N-616](https://linear.app/newth/issue/N-616/pin-lunch-money-v2-contract-and-implement-typed-adapter) contract work; [N-613](https://linear.app/newth/issue/N-613/complete-end-to-end-lunch-money-vertical-slice) proves two isolated staging users can read /me, accounts and transactions and disconnect safely. |
| 2. Read-only MCP implementation | [N-620](https://linear.app/newth/issue/N-620/design-and-implement-curated-read-only-tool-surface) reads, [N-615](https://linear.app/newth/issue/N-615/implement-connection-status-and-revocation-ux) lifecycle and [N-612](https://linear.app/newth/issue/N-612/add-privacy-safe-observability-and-rate-limiting) operational controls pass. [N-619](https://linear.app/newth/issue/N-619/threat-model-and-security-validation) starts threat modeling during architecture and completes security validation on the candidate. |
| 3. Plugin packaging and external beta | [N-623](https://linear.app/newth/issue/N-623/build-and-validate-the-codex-plugin-package) plugin and [N-624](https://linear.app/newth/issue/N-624/publish-user-and-operator-documentation) docs precede [N-617](https://linear.app/newth/issue/N-617/deploy-production-service-and-run-external-beta) release. Two users other than the developer complete setup/read/disconnect flows; no unresolved high/critical findings; rollback and failure recovery demonstrated. |
| 4. Post-beta mutations and safety | [N-622](https://linear.app/newth/issue/N-622/add-scoped-write-tools-with-confirmation-controls) begins after [N-617](https://linear.app/newth/issue/N-617/deploy-production-service-and-run-external-beta) passes; trusted operation approval, scopes and duplicate/uncertain-outcome handling proven before enablement. [N-621](https://linear.app/newth/issue/N-621/add-destructive-tools-and-recovery-safeguards) separately gates destructive operations. |

Plugin packaging and read-only beta do not depend on mutations. Dependencies are recorded on the existing issues. Oliver remains project lead; implementation assignees, estimates and dates should be set after milestone 1 resolves feasibility and capacity, rather than inventing a deadline now.

## Decisions to resolve before implementation depends on them

* [N-614](https://linear.app/newth/issue/N-614/audit-authn3wthcom-oauth-and-mcp-compatibility): auth source/deployment, actual token validation method, MCP/SDK/client versions, hosting/runtime and metadata storage. Preserve the existing auth service unless a documented incompatibility requires a decision.
* [N-616](https://linear.app/newth/issue/N-616/pin-lunch-money-v2-contract-and-implement-typed-adapter): exact OpenAPI version/source/checksum and deployed endpoint support. v2.11 compatibility is a target to verify; determine preview/stable status and derive operation count rather than assuming 59 live operations. Evaluate the official client before generating another.
* [N-625](https://linear.app/newth/issue/N-625/configure-nango-lunch-money-bearer-token-connection): Nango bearer integration and plan support, secure completion verification, proxy versus retrieval, and effective upstream egress quota.
* [N-611](https://linear.app/newth/issue/N-611/define-identity-tenant-and-credential-data-model)/[N-615](https://linear.app/newth/issue/N-615/implement-connection-status-and-revocation-ux)/[N-612](https://linear.app/newth/issue/N-612/add-privacy-safe-observability-and-rate-limiting): retention periods, backup expiry, revocation/in-flight behavior, deletion retry and measurable beta capacity.
* [N-622](https://linear.app/newth/issue/N-622/add-scoped-write-tools-with-confirmation-controls): trusted human approval mechanism supported by the intended client or authenticated first-party UI. A model-supplied confirmation flag and tool annotations cannot enforce approval.

WorkOS/Auth0/Composio remain alternatives only if discovery justifies replacing a dependency; they are not additional components.

## Validation and security requirements

* Tenant isolation tested with two identities across direct calls, session reuse, guessed connection IDs, forged/replayed completion events and reconnect races.
* Read-only allowlist enforced at execution; no generic proxy or mutation/refresh path accessible during beta.
* Disconnect blocks subsequent provider dispatches and invalidates credential caches. Deleting Nango storage is distinct from revoking the original Lunch Money token.
* No credentials, financial bodies or sensitive connection links in application/proxy/SDK logs, traces, errors or test artifacts; verify using sentinel fixtures.
* Deterministic tests cover empty/multi-page results, partial totals, transfers/refunds/splits, mixed currencies, 401/429/timeouts, stale state and provider failures.
* Static mock testing checks contracts; real test-budget/client validation checks authentication and behavior. Attach redacted evidence and CI build/typecheck/test results to each implementation issue.
* Beta is blocked by unresolved high/critical security findings, missing lifecycle/observability/docs, or failed external-user workflows.
* Later writes require scopes plus trusted short-lived approval bound to exact operation/user/connection; stale/replayed/tampered approvals fail. Never blindly retry uncertain mutations or promise unsupported undo.

## Out of scope for initial release

Recreating the Lunch Money UI; custody or movement of funds; financial advice; background transaction replication; unrelated providers; shared/multiple connections per user; full API coverage; writes and destructive operations.

## Review basis — 2026-09-14

Reviewed the project, all 15 issues and their dependency relations. Corrected destructive-tools → plugin → beta ordering, brought typed contract work into the vertical slice, made operational controls and documentation beta prerequisites, and replaced blanket urgent priorities with staged delivery priorities.

Primary references:

* [Lunch Money API/client introduction](<https://lunchmoney.dev/introduction>), [API reference](<https://lunchmoney.dev/v2/docs>), [version history](<https://lunchmoney.dev/v2/changelog>).
* [Pagination](<https://lunchmoney.dev/pagination>) and [rate limits](<https://lunchmoney.dev/rate-limits>): published upstream limit is 100 requests/minute per IP, requiring shared-egress coordination.
* [Nango connect sessions](<https://nango.dev/docs/reference/backend/http-api/connect/sessions/create>) and [bearer-token entry](<https://docs.nango.dev/integrations/all/private-api-bearer/connect>).
* [MCP authorization reference](<https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization>); implementation must pin and verify its selected protocol version.

This review improves the execution plan; it does not certify the deployed auth service, source code, or provider integration. Those checks remain explicit milestone-1 deliverables.

## Approved execution routing — 2026-09-14

Use a lightweight coordinator for dispatch and Linear status; Devin Local SWE-2 High for bounded research/implementation/tests; stronger Codex reasoning for architecture, OAuth/tenant isolation, hard debugging and release review. Start with two independent workers, isolated ownership and feature-branch worktrees for code changes. Re-diagnose after two unsuccessful fixes; integrate only reviewed diffs with test evidence.

Verify exact model IDs, allowance and expiry before each batch. SWE-2 Medium/High/Max are currently listed Free by the installed Devin CLI; Oliver confirms unlimited SWE-2 for the next month (exact expiry pending). Do not silently use billed models, Fusion variants or cloud sessions. Other providers remain unknown until verified.

Initial bounded discovery: [N-614](https://linear.app/newth/issue/N-614/audit-authn3wthcom-oauth-and-mcp-compatibility) public auth metadata/source references and [N-616](https://linear.app/newth/issue/N-616/pin-lunch-money-v2-contract-and-implement-typed-adapter) pinned API/client contract. Implementation follows reviewed findings and repository/runtime selection; these issues are not complete merely because discovery was dispatched.

