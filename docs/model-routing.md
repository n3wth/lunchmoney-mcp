---
title: Lunch Money MCP model routing
description: Approved model routing, allowance ledger, and execution contract for the Lunch Money MCP project.
---

Approved 2026-09-14. Coordinate through Linear and Git; no custom orchestration platform.

Provenance: Oliver's approval and SWE-2 correction in Codex task 01a09f3c-41a2-7e03-8103-00cadb4d71cb on 2026-09-14; Devin 3000.10.21 model inventory and Codex usage tool observed the same day. Project: https://linear.app/newth/project/lunch-money-mcp-5e3cbc5d645d

Durable storage: GBrain on m4mini, default source. Oliver explicitly requested saving this work there. Linear remains the execution tracker. Prior memory saves are historical copies; GBrain is the destination for subsequent durable records from this work.

| Task | Route |
| --- | --- |
| Dispatch, status, issue maintenance | Current coordinator |
| Bounded research, implementation, fixtures, tests, docs | Devin Local `swe-2-high` |
| Simple repetitive work | Devin Local `swe-2-medium` |
| Architecture, OAuth/tenant isolation, release review | Codex `gpt-6-astra`, high reasoning, through a delegated reviewer |
| Two unsuccessful fixes | Stop, re-diagnose, escalate with evidence |

## Allowance ledger

- Devin Local SWE-2: user confirms unlimited for the next month; exact expiry not supplied. CLI verified Medium/High/Max as Free on 2026-09-14. Recheck before dispatch. Do not infer cloud/Fusion/other models are free.
- Codex: 83% weekly allowance remaining at initial setup; live usage tool is authoritative at dispatch time. No paid credits or usage-reset credits reported.
- Other providers: unknown. No automatic billed fallback.

## Execution contract

1. Start with at most two independent workers. Each gets one issue, explicit file ownership, source references, acceptance criteria and required validation.
2. Use isolated feature-branch worktrees for repository edits. Discovery without an established repository uses separate scratch directories.
3. Workers may not overwrite each other's work, deploy, merge, publish or change shared service configuration. Coordinator integrates reviewed changes within user authorization.
4. Return findings/diff, exact validation commands/results, unresolved questions and continuation/session ID. Never include credentials or financial payloads.
5. Record route and reason for each dispatch. Review evidence before dependent work; no issue is Done solely because an agent says so.
6. Choose model based on risk, ambiguity, demonstrated results and verified allowance. The coordinator cannot change its own active model; stronger reasoning runs in a delegated task.

## Initial batch

- N-614 discovery: inspect public auth metadata and local auth references, identify real source/configuration gaps. SWE-2 High gathers evidence; stronger Codex review evaluates security implications.
- N-616 discovery: pin official Lunch Money v2 artifact, count operations, assess official client and production/preview distinction. SWE-2 High gathers evidence; implementation waits for repository/runtime decision.

This setup authorizes bounded initial discovery; the current batch does not create an external repository or deploy services.
