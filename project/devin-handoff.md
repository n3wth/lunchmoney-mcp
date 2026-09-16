---
title: Lunch Money MCP - Devin handoff
description: Handoff of verified completed work, next implementation gates, and canonical context for the Lunch Money MCP project.
---

Source: Oliver's Codex conversation and verified tool results, 2026-09-14.
Project: https://linear.app/newth/project/lunch-money-mcp-5e3cbc5d645d

## Ownership

Oliver will have Devin orchestrate further implementation. Codex has finished the current discovery and landing-page batch and will review and improve Devin's implementation afterward. No further implementation workers are being launched by Codex.

Use local Devin SWE-2 High for bounded implementation; escalate difficult work to SWE-2 Max. The local model inventory marks these Free; Oliver reports unlimited SWE-2 for the next month, with exact expiry unconfirmed. Hermes on Mini successfully used gemini-3.1-pro-preview; Oliver reports unlimited Gemini. Do not silently fall back to paid/cloud routes. Use independent reviewers and isolated file ownership/worktrees. Codex account allowance is shared, last observed 82% remaining in its weekly window, not a project budget.

Oliver authorized Devin dangerous permission mode for bounded project tasks. This does not authorize unrelated destructive actions or exposing secrets. Keep credentials out of prompts, logs and commits.

## Completed and verified

- Linear plan revised into architecture/vertical slice, read-only implementation, beta packaging, and post-beta mutations. Dependencies corrected; do not begin with write tools.
- Repository: https://github.com/n3wth/lunchmoney-mcp (private), local /Users/oliver/GitHub/lunchmoney-mcp. Branch feat/landing-page. Landing implementation commit 15ad677f126b68d553052d81922b86e969d639b0; subsequent handoff commit adds reviewed docs and screenshots. The repository contains the static landing page and planning evidence, not an MCP backend.
- Live landing: https://lunchmoney.sh (HTTPS 200 verified). Fallback: https://lunchmoney-landing.vercel.app.
- Vercel team n3wth / team_PV0n17OmGsIdCREzzoy8wVp7; project lunchmoney-landing / prj_LooepqkSHIjPMQvr9m1PT3IoImOS; production deployment dpl_5UeJwGkd9FVDjnNyXdRjgjF4iNfW is READY. Domain attached and nameservers match Vercel. Deployment uploaded through connector; future Git integration remains to be configured.
- Clear unofficial/pre-release disclosure; fictional interactive samples; no forms, tokens, analytics or third-party assets. Discloses Vercel request logs and future AI-provider data handling. Planned connector safeguards are explicitly unverified.
- npm run build passed. Desktop/mobile screenshots reviewed, no overflow; all sample buttons and keyboard activation checked; no console errors. Production interaction works. CSP and other security headers verified over HTTPS.
- mcp.lunchmoney.sh is planned only. No MCP server, OAuth integration or token-storage implementation has shipped.

## Next implementation gates

1. N-614: confirm existing auth.n3wth.com client configuration and real OAuth flow. Public metadata alone does not prove PKCE enforcement, public dynamic registration, refresh behavior, audience/resource binding or tenant isolation. Protected-resource metadata belongs on the future MCP server. Test using dedicated test clients/accounts, never production financial mutations.
2. N-616: exact official OpenAPI package @lunch-money/v2-api-spec@2.11.0 has 59 operations (25 GET, 11 POST, 10 PUT, 13 DELETE); checksum verified. Published SDK 2.11.0 includes crypto/history raw types missing from the older repository snapshot. Compare published rawClient transport before choosing custom generation. Account for pagination, retries, deadlines, normalized errors and rate-limit headers; getAll currently fetches one page. Static counts are not live endpoint tests.
3. Choose server runtime and implement one authenticated read-only vertical slice, including token ownership enforcement on every request and no credential logging. Nango storage and existing auth reuse are planned, not validated.
4. Expand only after authentication, tenant isolation, scope/allowlist enforcement and error behavior pass tests. Keep mutations behind the post-beta milestone. Never claim server-enforced read-only means the underlying Lunch Money token is itself read-only.
5. Return a reviewable branch/PR with build/test evidence, deployment details, security model and known limitations for Codex review. Do not publish security claims before verifying the implementation.

## Canonical context

GBrain source default on m4mini:
- projects/lunch-money-mcp/plan-2026-09-14
- projects/lunch-money-mcp/model-routing-2026-09-14
- projects/lunch-money-mcp/discovery-review-2026-09-14 (includes corrected published-SDK findings)
- projects/lunch-money-mcp/devin-handoff-2026-09-14 (this handoff)

Local reviewed documents: outputs/lunch-money-plan.md, outputs/model-routing.md, outputs/discovery-review.md in /Users/oliver/Documents/Codex/2026-09-14/rev. Screenshot evidence is under outputs/site-preview. Raw worker transcripts are not authoritative and should not be ingested as verified facts.

Discovery limitation: an early worker exceeded its read-only probe scope with malformed registration/token requests; they failed and no client/token issuance was observed. Do not repeat those probes. N-614 and N-616 remain In Progress; landing issue N-626 is Done. Begin with this handoff; other dated documents retain their original snapshot context.
