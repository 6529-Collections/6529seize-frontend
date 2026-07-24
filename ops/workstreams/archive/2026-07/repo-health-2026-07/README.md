# Repo Health Campaign — 2026-07

> Archive notice (2026-07-23): This is a historical snapshot. It is
> non-authoritative and must not be used as current status, branch, PR, release,
> security, or execution guidance. Start at `ops/workstreams/README.md` and
> verify current repository and GitHub state.

Mission: close the five structural gaps found in the 2026-07-04 audit. Finish the
problems, don't just freeze them: ratchets are backstops, burn-down waves drive
counts to zero, and the ratchet floor lowers automatically as counts drop.

This campaign was coordinated through parallel implementation and review lanes.

## Workstreams and definition of done

| ID | Workstream | Done means |
| --- | --- | --- |
| A | Merge gate | Required PR CI on main (typecheck, lint, tests); debt/coverage ratchets active; Playwright harness runs again (`testHelpers` fixed) |
| B | Branch amnesty | Dirty tree rescue-committed; the 138-commit `codex/polish-boosted-link-cards` branch triaged and landed-or-archived; merged branches pruned with manifest; stale-unmerged report delivered for sign-off; nightly branch-janitor workflow live |
| C | One styling system | Zero `bootstrap`/`react-bootstrap` imports; both deps removed from package.json; delegation area migrated to Tailwind |
| D | One layout | `src/` tree folded into root-level layout; pages-router remnants migrated or deleted (knip-verified); no source file over the agreed line cap; grandfather list empty |
| E | Dead patterns | Redux fully removed (`@reduxjs/toolkit`, `react-redux`, `next-redux-wrapper` gone); `any` count driven to ~0 with documented exceptions; TODO/FIXME/HACK triaged to near-zero (fixed, ticketed, or deleted) |

## Audit baseline (2026-07-04)

- CI gates: deploy workflows only; PR-time enforcement = lint + build. No typecheck/test gate. No coverage thresholds.
- Branches: ~1,053 total (`branch -a`), incl. 232 remote `codex/*`; current branch 138 ahead of main, diverged, 116-file dirty tree.
- Styling: Bootstrap 5 + react-bootstrap + SCSS modules + Tailwind coexist.
- Layout: stray `src/` tree (13 files) duplicating root dirs; ~134 legacy pages-router files; top file sizes 2,410 / 2,347 / 2,241 lines (drop-forge, CreateDropContent, CollectionDelegation…).
- Debt counts: 317 `: any`/`as any` (components+hooks); 2,841 TODO/FIXME/HACK across 1,279 files; Redux = 2 slices (`editSlice`, `groupSlice`).
- E2E: `test:e2e:staging` broken — `Cannot find module '../testHelpers'`.

## Policies (user-approved 2026-07-04)

1. **Merge**: auto-merge campaign PRs once PR CI is green and reviewbot passes. Every merge is reported. Deploys remain manual (staging = `1a-staging` push, prod = manual workflow) — merging main ships nothing.
2. **Branch prune**: merged branches may be deleted now (manifest first, `.git/branch-cleanup-manifest-*.txt` scheme). Unmerged-stale branches: report for user sign-off before deletion.
3. **138-commit branch**: triage-then-land-delta. Rescue-commit dirty tree, archive superseded work to manifest, rebase + land novel work as small PRs.

## Conventions (hard rules for all threads)

- Worktrees: use non-hidden sibling directories; nested hidden tool-state
  directories caused historical test-discovery failures.
- Commands via repo wrapper: `./bin/6529 run <script>`; plain pnpm is blocked. In fresh worktrees, prepend real pnpm to PATH (bin/ shim shadows it) — see memory/worktree-and-tooling-gotchas.
- Commits: `git commit -s` (DCO). Small, scoped PRs; reviewbot reviews every PR.
- Never push to `1a-staging`; never trigger deploy workflows.
