# Active Context

## Resume first

Read this after compaction or session handoff. Orchestrator session memory:
`repo-health-campaign-2026-07.md` in the operator's Claude project auto-memory
for this repo (machine-local; not tracked in the repository).

## Wave state

- Wave 1 COMPLETE 2026-07-05: Thread A (merge gate — 5 required checks incl. `Debt ratchet`; coverage floor on main pushes; push secret scan; PRs #3031/#3032/#3033/#3038/#3045) and Thread B (amnesty — PRs #3034–#3037/#3040; 167 branches pruned; janitor ARMED via `BRANCH_JANITOR_ENABLED=true`).
- Wave 2: Thread C COMPLETE 2026-07-05 (Bootstrap verified-zero + 3 guard layers; PRs #3042/#3046/#3049; repo is also Sass-free). Thread D running (layout — #3050 merged; no pages/ dir exists, so the core is src/ fold-in + splitting the 139 grandfathered oversized files, delegation included). Thread E running (dead patterns — redux_imports 21→0, any_casts 358→~0, todo_comments 6→0 per ratchet baselines).
- Wave 3: burn-down loops until every ratchet metric hits its target, then remove grandfather lists.

## Sequencing constraints

- Ownership now: D = src/ fold-in + oversized-file splits (delegation included, transferred from C); E = redux removal, any burn-down, TODO disposition. A/B/C closed (A's worktree parked on `ci-worktree-idle`).
- Merge path: required checks green + reviewbot lanes clean, then ruleset team bypass (`gh pr merge --merge --admin`) per user-approved policy. Strict up-to-date is on — update branch and re-run `debt-ratchet.cjs --update` after rebases.
- Pending user decisions: punk6529bot token rotation (security, open); stale-branch report sign-off (739); reland-or-archive for tech hub (`dac8f5cf1`) and `codex/harden-media-url-sinks-for-desktop-sync`; candidate new workstreams — slow collection routes (/rememes, /the-memes, /meme-lab, /network, /meme-calendar) and 33 open dependabot vulns (7 high).

## Escalation triggers (back to user)

- Stale-unmerged branch deletion (needs sign-off on B's report).
- Any deploy decision.
- Any destructive action outside approved policy scope.
