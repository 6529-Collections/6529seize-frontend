# Run Log

## 2026-07-04

- Audit completed (Explore agent + orchestrator): see README baseline section.
- User approved campaign + policies (merge: auto-merge when green; prune: merged now / stale report; 138-commit branch: triage-then-land-delta).
- Campaign state dir created (untracked in primary checkout; Thread A commits it in its first PR; Thread B excludes it from the rescue snapshot).
- Wave 1 threads launched: Thread A (merge gate) and Thread B (branch amnesty), both fresh Fable 5 background threads managed by the orchestrator session. Thread ids are session-internal; cross-session resume goes through this state dir, not thread ids.

## 2026-07-04 (Thread B — branch amnesty)

- Phase 1 complete: dirty tree (117 status entries / 454 staged paths) rescue-committed on `codex/polish-boosted-link-cards` as `09ef4659c` ("WIP rescue snapshot: pre-campaign dirty tree (2026-07-04)"), signed off, pushed to origin as new remote branch (backup). Primary tree clean; campaign dir left untracked per convention.

## 2026-07-04 (Thread A — merge gate)

- Sibling worktree `6529seize-frontend-ci` created on `ci/pr-gate` from `origin/main` (6af669907).
- Audit correction: the merge-gate baseline is stale. `origin/main` already ships
  `.github/workflows/app-pr-ci.yml` — a risk-plan-driven PR CI (jobs: "Plan risk and
  security checks" + "Installed app checks") covering secret scan, workflow security
  review, knip, `lint:changed`, `typecheck:changed`, `typecheck:playwright`, related
  Jest, conditional production build, and conditional Playwright smoke/critical-shell
  packs. It landed via the frontend-a11y-i18n testing-improvement workstream.
- `tests/testHelpers.ts` exists on `origin/main` with a full `tests/support/` harness;
  the "Cannot find module '../testHelpers'" break may already be repaired — local
  verification pending.
- Real gap found: ruleset 18018081 ("main maintainer review and merge policy")
  requires only `DCO` and `security/snyk (6529)` status checks — the PR CI jobs are
  NOT required, so red CI does not block merges. Plan: require the two app-pr-ci job
  names (plus the debt ratchet once it lands) in the ruleset instead of authoring a
  duplicate workflow.
- Measured app-pr-ci wall times (last 8 runs): ~13–15 min typical, 26–27 min when the
  build + Playwright packs are required. A separate always-on full-suite job would
  roughly double PR latency; keeping the risk-plan conditionality.
- Adjusted Thread A deliverables: PR 1 = campaign state dir (this PR); PR 2 = debt
  ratchet (script + baseline + install-free CI job); PR 3 = coverage floor on main
  pushes; PR 4 = e2e harness verify/fix; then ruleset update for required checks.

## 2026-07-04 (Thread A — coverage floor + required checks step 1)

- PR #3031 (campaign state dir) merged to main after green checks and clean
  reviewbot lanes.
- Ruleset 18018081 updated via API: required status checks are now `DCO`,
  `security/snyk (6529)`, `Plan risk and security checks`, `Installed app checks`
  (the last two from app-pr-ci, GitHub Actions integration). Review policy, update/
  deletion/non-fast-forward rules, and team bypass preserved unchanged. Red PR CI
  now blocks merges to main. `Debt ratchet` joins the required list once its PR
  has merged and burned in.
- Full Jest suite measured on a clean main checkout: 1957 suites / 11018 tests in
  ~6 min wall (with coverage). Well under the 20-minute bar, but PR lanes stay
  risk-plan-driven; the full suite runs with coverage on every main push instead
  (Coverage Floor workflow), keeping PR latency owned by app-pr-ci.
- Coverage floor added: `scripts/coverage-floor.cjs` + checked-in
  `scripts/coverage-floor-baseline.json` compared on every main push; fails when a
  global metric drops more than 0.1 points, warns to bump the baseline when it
  rises. Seed baseline (local clean-main run): lines 74.76 / statements 74.39 /
  functions 70.31 / branches 60.98.
- Pre-existing red fixed here as a gate prerequisite: `__tests__/hooks/
  useDownloader.test.ts` failed to LOAD on main (its bare `@capacitor/core` mock
  drops `registerPlugin`/`WebPlugin`, which capacitor-secure-storage-plugin needs
  when pulled in through the jest.setup requireActual chain). Fixed with a local
  `capacitor-secure-storage-plugin` mock in that suite (6 tests now run). Note for
  the record: an earlier claim that "Jest exits 0 despite the failed suite" was a
  measurement artifact (exit code read after piping through `tail`); Jest exit
  codes are correct, which is exactly why the Coverage Floor job needed main's
  suite green before it could ship.
