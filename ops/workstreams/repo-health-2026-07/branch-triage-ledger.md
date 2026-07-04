# Branch triage ledger — codex/polish-boosted-link-cards (2026-07-05, Thread B)

Accounting for every commit on the 138-commit divergent branch (plus its rescue
snapshot) against `origin/main`, per the repo-health campaign policy
"triage-then-land-delta". Method: patch-id cherry check, 3-way
`git merge-tree` end-state analysis vs current main, message-namespace
presence checks, PR-stack archaeology (gh), and per-cluster subagent review.

## How this branch relates to main

- The 138 commits (2026-06-11..14) were mirrored into a 40-PR stack
  (#2603-#2645, branches `codex/*-a11y-i18n`). PRs merged into each other's
  branches; the root PR #2604 squash-merged the accumulated stack into main as
  `3f9b94127` (2026-06-17). Patch-ids therefore never match (0/139 by
  `git cherry`).
- End-state verdict: everything reached main EXCEPT two topics whose stack tail
  never cascaded to the root — `user.profileHeader` (header identity + About,
  #2643-#2645) and `user.statsRow` (#2642). Their message namespaces are absent
  from both `main` and `1a-staging`.
- Recovery: re-landed on current main as PR #3034 (stats row) and PR #3035
  (header identity + About), three-way merged with main's later profile-CMS
  work and verified with typecheck + the full header/stats test suites.

## Disposition summary (138 pre-rescue commits)

| Disposition | Count |
| --- | --- |
| Superseded — end-state already in main (#2604 squash + later evolution) | 76 |
| Records — ops bookkeeping (run-logs/PR trackers); superseded by main's evolved records + this ledger | 56 |
| Re-landed — recovered via PR #3034 / #3035 | 6 |

## Rescue snapshot (dirty-tree commit `dac8f5cf1`, originally `09ef4659c`)

454 paths captured from the 2026-06-14..17-era dirty tree. Cluster verdicts
(subagent-reviewed against current main):

| Cluster | Verdict |
| --- | --- |
| Delegation (components/localization + IPFS content pipeline + walletChecker) | Superseded — main shipped a superior pipeline (#2969 Tailwind migration 2026-07-01; hardened build script, published IPFS CID) |
| Boosted link cards / open-graph / waves previews / lexical | Superseded — polish landed as PR #2723 (2026-06-17); main evolved further (#2725, #2989, #3030); rescue copies are older |
| Profile CMS + video-player workstream docs | Superseded — main is weeks ahead (Phase 5-8 CMS work) |
| Tech hub (`app/tech`, `components/tech`, spec, workstream) | NOVEL (~5.4k lines, complete per its run-log incl. Opus review PASS) — needs product decision; sidebar glue incompatible with main's 2026-07-03 navigation IA restructure (#3010) |
| Sidebar touch-listener passive-option fix | Novel, tiny, independent — worth a micro-PR |
| EnsAddressInput a11y (id/aria-describedby), `scripts/nextgen/count-pebbles.cjs`, read-only Playwright e2e harness (`tests/e2e`, `tests/support/e2e`) | Novel-wanted — small, standalone candidates |
| Durable specs: `ops/docs/specs/2026-06-15-wave-rep.md`, `2026-06-17-tech-hub.md`, `2026-06-18-6529-spatial-network.md`; delegation source-of-truth + IPFS pilot docs; `ops/scripts/wave-score-snapshot.mjs` | Novel-wanted docs/tooling — candidates for a docs-only PR pending orchestrator/user call |
| `tmp/**` (219 files), `.reviewbot-responsiveness/` | Session debris — archived in the branch snapshot only, never to be PRed |
| `tmp/punk6529bot-browser-auth.json` | SECURITY: contained live JWT + refresh token; excised from the pushed branch (rewritten `09ef4659c` -> `dac8f5cf1`), preserved off-repo for rotation. Credential must be revoked. |

Snapshot preservation: the full rescue tree (minus the excised credential)
remains available as branch tip `dac8f5cf1` recorded in
`.git/branch-cleanup-manifest-2026-07-05.txt` when the branch is deleted.

## Per-commit dispositions (oldest first)

| Commit | Subject | Disposition |
| --- | --- | --- |
| 0e445da1b | Add The Memes card accessibility i18n groundwork | superseded (in main via #2604 squash + later evolution) |
| 3ad505225 | Record The Memes card implementation PR | records (ops bookkeeping; superseded by main records + this ledger) |
| f719e6904 | Address Sonar feedback on i18n helpers | superseded (in main via #2604 squash + later evolution) |
| e3192a9f5 | Address CodeRabbit feedback on memes i18n | superseded (in main via #2604 squash + later evolution) |
| e63d1e21c | Fix react-doctor diff on Windows | superseded (in main via #2604 squash + later evolution) |
| df4460ff4 | Improve The Memes detail a11y i18n | superseded (in main via #2604 squash + later evolution) |
| f71a55a4b | Record The Memes detail implementation PR | records (ops bookkeeping; superseded by main records + this ledger) |
| ff9ae2a3f | Address CodeRabbit feedback on memes detail | superseded (in main via #2604 squash + later evolution) |
| f31e90bc2 | Thread locale through memes detail | superseded (in main via #2604 squash + later evolution) |
| 9f688f2b6 | Improve Meme Lab cards a11y i18n | superseded (in main via #2604 squash + later evolution) |
| f57defd0e | Record Meme Lab card PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 24f0f2fcc | Reduce Meme Lab card duplication | superseded (in main via #2604 squash + later evolution) |
| b9cf3f9c0 | Address Meme Lab route feedback | superseded (in main via #2604 squash + later evolution) |
| ca9b5e83f | Improve Rememes cards a11y i18n | superseded (in main via #2604 squash + later evolution) |
| ce4126bd3 | Track Rememes a11y i18n PR | records (ops bookkeeping; superseded by main records + this ledger) |
| baa5363e2 | Improve Rememe detail a11y i18n | superseded (in main via #2604 squash + later evolution) |
| 230dc913f | Record Rememe detail PR | records (ops bookkeeping; superseded by main records + this ledger) |
| fd9b0d9ae | Reduce Rememe detail message duplication | superseded (in main via #2604 squash + later evolution) |
| 61e912b75 | Address Rememe detail review feedback | superseded (in main via #2604 squash + later evolution) |
| 4d4e5332b | Improve Meme Lab detail a11y i18n | superseded (in main via #2604 squash + later evolution) |
| 9f46a6637 | Record Meme Lab detail PR | records (ops bookkeeping; superseded by main records + this ledger) |
| a8581690b | Address Meme Lab detail review feedback | records (ops bookkeeping; superseded by main records + this ledger) |
| 33cd79ee8 | Improve Meme Lab distribution a11y i18n | superseded (in main via #2604 squash + later evolution) |
| 899adfcca | Record Meme Lab distribution PR | records (ops bookkeeping; superseded by main records + this ledger) |
| da9fd0095 | Address distribution review feedback | superseded (in main via #2604 squash + later evolution) |
| dbfd2f03c | Address distribution bot feedback | superseded (in main via #2604 squash + later evolution) |
| 864b899e0 | Localize The Memes live stats | superseded (in main via #2604 squash + later evolution) |
| 269928eba | Record The Memes live stats PR | records (ops bookkeeping; superseded by main records + this ledger) |
| f9dde1ec2 | Record live stats PR review state | records (ops bookkeeping; superseded by main records + this ledger) |
| 0b799601e | Address live stats review nitpick | superseded (in main via #2604 squash + later evolution) |
| 9f8e1ad96 | Localize The Memes card activity | superseded (in main via #2604 squash + later evolution) |
| 5db95862d | Record The Memes activity PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 45caff7ae | Address activity loading accessibility feedback | superseded (in main via #2604 squash + later evolution) |
| 0d76e8f33 | Localize shared timeline labels | superseded (in main via #2604 squash + later evolution) |
| 09e6bc49d | Record shared timeline PR | records (ops bookkeeping; superseded by main records + this ledger) |
| bd8ba444a | Render timeline metadata as safe text | superseded (in main via #2604 squash + later evolution) |
| 7fbb3321e | Improve timeline media accessibility | superseded (in main via #2604 squash + later evolution) |
| d1d146d53 | Record timeline media PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 529e503cb | Localize The Memes art viewer actions | superseded (in main via #2604 squash + later evolution) |
| 5987023a0 | Record The Memes art viewer PR | records (ops bookkeeping; superseded by main records + this ledger) |
| dee34770b | Localize The Memes art details | superseded (in main via #2604 squash + later evolution) |
| 6b317d49d | Record The Memes art details PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 621346032 | Address art details review feedback | superseded (in main via #2604 squash + later evolution) |
| 7d1f2c368 | Localize The Memes references tab | superseded (in main via #2604 squash + later evolution) |
| 31559ced5 | Record The Memes references PR | records (ops bookkeeping; superseded by main records + this ledger) |
| dd554fb8b | Address references review feedback | superseded (in main via #2604 squash + later evolution) |
| 8e0f6d50e | Localize meme calendar periods | superseded (in main via #2604 squash + later evolution) |
| fd22a7eaa | Record meme calendar periods PR | records (ops bookkeeping; superseded by main records + this ledger) |
| b7f13972c | Localize meme calendar overview | superseded (in main via #2604 squash + later evolution) |
| 7acc1326e | Record meme calendar overview PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 02de51b8d | Use native group semantics for calendar timezone | superseded (in main via #2604 squash + later evolution) |
| 4f6f6d7fb | Escape calendar invite style attributes | superseded (in main via #2604 squash + later evolution) |
| 2465b79ab | Record meme calendar overview bot state | records (ops bookkeeping; superseded by main records + this ledger) |
| 7f5facea4 | Improve meme calendar grid accessibility and i18n | superseded (in main via #2604 squash + later evolution) |
| 8aee83301 | Record meme calendar grid PR state | records (ops bookkeeping; superseded by main records + this ledger) |
| 092e40ea0 | Address meme calendar grid bot feedback | superseded (in main via #2604 squash + later evolution) |
| a1cc353ca | Localize meme calendar drilldown cards | superseded (in main via #2604 squash + later evolution) |
| 43afb6d89 | Record meme calendar drilldown PR state | records (ops bookkeeping; superseded by main records + this ledger) |
| c8a666d55 | Address meme calendar drilldown duplication | superseded (in main via #2604 squash + later evolution) |
| 8faddcc02 | Address meme calendar drilldown review notes | superseded (in main via #2604 squash + later evolution) |
| 2b868ba73 | Reduce meme calendar launch card duplication | superseded (in main via #2604 squash + later evolution) |
| dadbdce67 | Improve Rememes browse accessibility follow-up | superseded (in main via #2604 squash + later evolution) |
| 41b4c9df2 | Record Rememes browse follow-up PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 359697a08 | Address Rememes follow-up Sonar notes | superseded (in main via #2604 squash + later evolution) |
| 9387d880d | Address Rememe video fallback review | superseded (in main via #2604 squash + later evolution) |
| bf8b7a382 | Improve Meme Lab browse list semantics | superseded (in main via #2604 squash + later evolution) |
| a1217a026 | Record Meme Lab browse follow-up PR | records (ops bookkeeping; superseded by main records + this ledger) |
| a323c8845 | Address Meme Lab test helper review | superseded (in main via #2604 squash + later evolution) |
| 2bfbe20a3 | Hoist Meme Lab test default props | superseded (in main via #2604 squash + later evolution) |
| 2d8bf994d | Improve collected card grid semantics | superseded (in main via #2604 squash + later evolution) |
| 4ea0df157 | Record collected cards follow-up PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 980dd17c2 | Address collected cards list review | superseded (in main via #2604 squash + later evolution) |
| a414ab0bc | Address collected cards tracker wording | superseded (in main via #2604 squash + later evolution) |
| 31762c0c2 | Document collected list role rationale | superseded (in main via #2604 squash + later evolution) |
| 8c7402ff3 | Refine collected list role rationale | superseded (in main via #2604 squash + later evolution) |
| 388024328 | Use collected list compatibility props | superseded (in main via #2604 squash + later evolution) |
| 354a306c0 | Record collected cards bot status | records (ops bookkeeping; superseded by main records + this ledger) |
| bb0bd4a56 | Improve collected network card semantics | superseded (in main via #2604 squash + later evolution) |
| 052bc0e12 | Record collected network PR link | records (ops bookkeeping; superseded by main records + this ledger) |
| 121a5f4ac | Record collected network bot status | records (ops bookkeeping; superseded by main records + this ledger) |
| d2592f6e7 | Localize collected empty states | superseded (in main via #2604 squash + later evolution) |
| c843f5659 | Track collected empty states PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 70cc14594 | Address collected empty state bot feedback | superseded (in main via #2604 squash + later evolution) |
| 57691282b | Record collected empty states bot outcome | records (ops bookkeeping; superseded by main records + this ledger) |
| 7674a6340 | Localize collected filter controls | superseded (in main via #2604 squash + later evolution) |
| 7771f47e1 | Track collected filter controls PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 60ccf4b56 | Record collected filter controls bot outcome | records (ops bookkeeping; superseded by main records + this ledger) |
| 7ecb37a42 | Localize collected season strip | superseded (in main via #2604 squash + later evolution) |
| 4fac79e51 | Record collected season strip PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 36c9c7af3 | Record collected season strip bot outcome | records (ops bookkeeping; superseded by main records + this ledger) |
| 477165ccf | Localize collected stats summary | superseded (in main via #2604 squash + later evolution) |
| 6e0cf51e1 | Record collected stats summary PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 92863eac5 | Reduce collected stats message duplication | superseded (in main via #2604 squash + later evolution) |
| e2154d9e1 | Record collected stats summary bot outcome | records (ops bookkeeping; superseded by main records + this ledger) |
| fa7225eb5 | Localize collected details tables | superseded (in main via #2604 squash + later evolution) |
| 8ab8271fe | Record collected details table PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 42aae48d3 | Reduce collected details table duplication | superseded (in main via #2604 squash + later evolution) |
| e43ac7d57 | Reduce collected totals duplication | superseded (in main via #2604 squash + later evolution) |
| 70ed57e13 | Reduce collected details message duplication | superseded (in main via #2604 squash + later evolution) |
| 684c9eebd | Record collected details PR status | records (ops bookkeeping; superseded by main records + this ledger) |
| 5f64a664b | Address collected details tracker feedback | records (ops bookkeeping; superseded by main records + this ledger) |
| b5e4fd3b7 | Localize collected boost breakdown | superseded (in main via #2604 squash + later evolution) |
| 40b9f25cb | Record boost breakdown PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 3df235fef | Localize collected activity overview | superseded (in main via #2604 squash + later evolution) |
| 3df29b002 | Record activity overview PR | records (ops bookkeeping; superseded by main records + this ledger) |
| d9f10cbe3 | Reduce activity overview config duplication | superseded (in main via #2604 squash + later evolution) |
| 2a4b316f5 | Wait for activity overview season rows | superseded (in main via #2604 squash + later evolution) |
| 1f661dd89 | Localize collected activity tabs | superseded (in main via #2604 squash + later evolution) |
| fcb3ab6fd | Track collected activity tabs PR | records (ops bookkeeping; superseded by main records + this ledger) |
| b84560e37 | Clarify page PR merge policy | records (ops bookkeeping; superseded by main records + this ledger) |
| 4c8a6a6fd | Record collected activity tabs review | records (ops bookkeeping; superseded by main records + this ledger) |
| afcf2e211 | Clarify next collected follow-up | records (ops bookkeeping; superseded by main records + this ledger) |
| daf9560d4 | Localize collected wallet activity filter | superseded (in main via #2604 squash + later evolution) |
| dede24d84 | Record wallet activity PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 047d3573e | Address wallet activity empty state semantics | superseded (in main via #2604 squash + later evolution) |
| 3a985d10b | Record wallet activity review | records (ops bookkeeping; superseded by main records + this ledger) |
| 632a080b0 | Localize collected distributions details | superseded (in main via #2604 squash + later evolution) |
| 0ea633c91 | Record collected distributions PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 677fcbdb7 | Address distributions loading label | superseded (in main via #2604 squash + later evolution) |
| 591a48a9f | Localize collected TDH history | superseded (in main via #2604 squash + later evolution) |
| 108392603 | Record TDH history PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 741b440a4 | Localize profile tabs shell | superseded (in main via #2604 squash + later evolution) |
| f19b22d03 | Record profile tabs PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 8ec2f86c6 | Localize profile followers modal | superseded (in main via #2604 squash + later evolution) |
| 206f1e523 | Record followers modal PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 447864a79 | Handle followers without handles | superseded (in main via #2604 squash + later evolution) |
| 6c17b784a | Localize profile stats row | re-landed (#3034/#3035) |
| ff4111b57 | Record stats row PR | records (ops bookkeeping; superseded by main records + this ledger) |
| d11ca8f4c | Record stats row bot review | records (ops bookkeeping; superseded by main records + this ledger) |
| 5f53b4272 | Localize profile header identity | re-landed (#3034/#3035) |
| da6512824 | Record profile header identity PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 6274c3fec | Fix profile header test accessibility mocks | re-landed (#3034/#3035) |
| 371c8d88d | Address profile header review feedback | re-landed (#3034/#3035) |
| e24f5a614 | Localize profile about statement controls | re-landed (#3034/#3035) |
| 5f6069e3c | Record profile about PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 8af0db84a | Localize profile about edit form | re-landed (#3034/#3035) |
| 0dfc2bfb3 | Record profile about edit PR | records (ops bookkeeping; superseded by main records + this ledger) |
| 6c048340a | Update frontend a11y i18n workstream audit | records (ops bookkeeping; superseded by main records + this ledger) |
