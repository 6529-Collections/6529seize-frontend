# Active Context

## Resume first

Read this after compaction or session handoff. Orchestrator session memory:
`C:\Users\Administrator\.claude\projects\D--repos-6529seize-frontend\memory\repo-health-campaign-2026-07.md`

## Wave state

- Wave 1 (launched 2026-07-04): Thread A (merge gate) + Thread B (branch amnesty). Thread ids in run-log.md.
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
