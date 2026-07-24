# Generic `any` Ratchet Workstream — 2026-07

## Charter

Close the generic type-argument blind spot in the TypeScript `any_casts`
ratchet, then remove every newly visible production and test occurrence.
Preserve runtime behavior and keep the checked-in baseline exact throughout
the burn-down.

## Reload order

1. `AGENTS.md`
2. This file
3. `active-context.md`
4. `run-log.md`
5. `ops/workstreams/repo-health-2026-07/any-exceptions.md`
6. `scripts/debt-ratchet.cjs`
7. `__tests__/scripts/debt-ratchet.test.ts`

## Owned paths

- `scripts/debt-ratchet.cjs`
- `scripts/debt-ratchet-baseline.json`
- `__tests__/scripts/debt-ratchet.test.ts`
- Generic-`any` sites identified by the parser-backed inventory
- `ops/workstreams/repo-health-2026-07/any-exceptions.md`
- This workstream folder

## Boundaries

- Do not hand-edit generated source.
- Do not hide debt with new exclusions, suppressions, renamed metrics, or
  unsafe assertions.
- Do not change runtime behavior merely to satisfy the scanner.
- Treat PR #3110 as historical evidence only; do not stack on, retarget, merge,
  or cherry-pick it.
- Keep user-facing documentation unchanged unless visible behavior changes.

## Evidence standard

- Parser-backed per-file production and test inventories.
- Regression fixtures for nested, adjacent, and formatted generic arguments
  plus false-positive rejection.
- Focused scanner tests and the repository changed-file quality checks.
- React Doctor for any React, TSX, hook, routing, or UI-state slice.
- Latest-head review-bot and required-check evidence for every PR.
- Exact candidate SHA evidence for staging and production validation.

## Completion gates

1. The scanner lands with an exact, ratcheting interim inventory.
2. Production generic-`any` debt reaches zero.
3. Test generic-`any` debt reaches zero.
4. The final baseline is zero and regression-proof for both scopes.
5. All PRs merge with signed commits and resolved latest-head feedback.
6. The equivalent release set passes staging and production validation under
   the deployment-bus process, followed by normal automated release closeout.

## Escalation triggers

- Missing required maintainer approval or repository access.
- A conflicting active release owner or paused deployment lane.
- A production candidate that cannot be proven equivalent to staging.
- A proposed type change that would require an unapproved runtime contract
  change.
