# Active Context

> Archive notice (2026-07-23): This is a historical snapshot. It is
> non-authoritative and must not be used as current status, branch, PR, release,
> security, or execution guidance. Start at `ops/workstreams/README.md` and
> verify current repository and GitHub state.

## Resume first

This file and the run log preserve the historical campaign handoff state.

## Wave state

- Wave 1 (launched 2026-07-04): merge-gate and branch-amnesty lanes.
- Wave 2 (blocked on A's gate + B's rescue): Thread C (styling), Thread D (layout/splits), Thread E (dead patterns).
- Wave 3: burn-down loops until every ratchet metric hits its target, then remove grandfather lists.

## Sequencing constraints

- A merges first: its PR CI + ratchet is the gate everything else lands through.
- B rescue-commits the primary tree before anything else; B is the ONLY thread allowed to touch the primary checkout.
- C waits for B to land/archive the delegation-heavy dirty-tree work before migrating `components/delegation/`.
- C, D, E partition by directory ownership to avoid conflicts; orchestrator staggers merges.

## Escalation triggers (back to user)

- Stale-unmerged branch deletion (needs sign-off on B's report).
- Any deploy decision.
- Any destructive action outside approved policy scope.
