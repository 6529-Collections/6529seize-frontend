# Active Context

## Resume first

Read this after compaction or session handoff. Orchestrator session memory:
`repo-health-campaign-2026-07.md` in the operator's Claude project auto-memory
for this repo (machine-local; not tracked in the repository).

## Wave state

- Wave 1: Thread B COMPLETE 2026-07-05 (see run-log; 167 branches pruned, 138 commits accounted, PRs #3034-#3037 merged). Thread A in wrapup (gate LIVE: ruleset 18018081 requires DCO, snyk, "Plan risk and security checks", "Installed app checks"; coverage floor on main pushes; debt-ratchet PR + e2e verify + secret-hygiene PR outstanding).
- Wave 2 LAUNCHED 2026-07-05: Thread C (Bootstrap exit; owns components/delegation/*), Thread D (layout unification; src/ fold-in, pages-router retirement, splits ex-delegation), Thread E (dead patterns; Redux first, then any/TODO burn-down behind A's ratchet).
- Wave 3: burn-down loops until every ratchet metric hits its target, then remove grandfather lists.
- Ownership map: A = .github/workflows + ratchet/coverage scripts; B = branches/worktrees; C = styling + delegation dir; D = src/, pages remnants, giant-file splits elsewhere; E = store/redux, typing sweeps, TODO triage.

## Sequencing constraints

- A merges first: its PR CI + ratchet is the gate everything else lands through.
- B rescue-commits the primary tree before anything else; B is the ONLY thread allowed to touch the primary checkout.
- C waits for B to land/archive the delegation-heavy dirty-tree work before migrating `components/delegation/`.
- C, D, E partition by directory ownership to avoid conflicts; orchestrator staggers merges.

## Escalation triggers (back to user)

- Stale-unmerged branch deletion (needs sign-off on B's report).
- Any deploy decision.
- Any destructive action outside approved policy scope.
