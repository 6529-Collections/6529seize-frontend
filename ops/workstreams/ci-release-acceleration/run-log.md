# Run log

## 2026-08-04

- Reconstructed the Museum release from GitHub PR, run, job and step metadata.
  First source commit to production was 9h37m28s; frontend PR open to production
  was 5h05m20s.
- Audited open CI/release PRs. Selected current-main-compatible ideas from
  #3582; rejected a wholesale merge of its stale branch. Kept #3586 outside the
  release because it adds a second mutation plane.
- Replaced one serialized App CI job with plan-selected matrix lanes and one
  aggregate result. Added an isolated path-selected Museum lane.
- Added pnpm, Playwright and profile-namespaced secret-free Next caches. Added
  runner variables with standard-runner defaults; larger hosted runners are not
  currently available through the organization API.
- Replaced the staging E2E ad-hoc SHA fetch with a two-minute sparse immutable
  checkout. Bounded staging and production pack concurrency at three.
- Integrated exact staging artifact build/activation and success-only staging
  E2E dispatch from #3582, retaining readiness rechecks, checksums, rollback,
  exact version verification, and cleanup reporting.
- Added exact production prebuild on `main`. Production deployment now verifies
  and promotes those bytes without dependency install or rebuild.
- Added success-only production E2E dispatch and exact deployment-run readback
  for the manual fallback lane. Release Bus dispatch retains manifest-bound
  evidence; automatic fallback evidence explicitly has no invented manifest.
- Corrected the stale Meme Calendar production test to use the current
  `Calendar timezone` tab contract (`Local` / `UTC`, `aria-selected`).
- Focused workflow, classifier, staging artifact, production artifact,
  production dispatcher, runner and manifest validation passed: 9 suites,
  200 tests.
- Changed lint, changed application typechecking, Jest and Playwright
  typechecking, manifest synchronization, dependency risk, Debt Ratchet,
  agent-file synchronization, React Doctor 100/100, formatting, and portable
  whitespace validation passed. The ratchet locked in one removed generic
  `any` from the integrated workflow test changes.
- The clean optimized production build passed in 334.4 seconds. A prior local
  attempt failed before compilation because this worktree's ignored
  `node_modules` was temporarily a junction to another worktree; replacing it
  with a frozen worktree-local install removed the Turbopack filesystem-root
  objection. This was local setup rather than a source or workflow defect.
- Current frontend `main` `aaf35662bf0ca664c05a6f9cdc16db396d99e251`
  merged conflict-free. The exact combined signed tree passed 200 focused
  tests, lint, application/test typechecking, both ratchets, manifest and
  whitespace checks, then a fresh optimized production build in 371.1 seconds.
- PR #3593 first exact-head App run `30955954466` selected quality, build,
  smoke, and critical-shell lanes concurrently and omitted Museum. The quality
  lane failed in 95 seconds on two stale public-review tests that still looked
  for production packaging inside the now promotion-only deploy workflow;
  fail-fast cancelled the three siblings before expensive work.
- Corrected those assertions to bind the dedicated production prebuild. Review
  hardening extends the staging presign to 5,400 seconds, unsets the decoded
  destination input in the exit trap, removes an incomplete destination file,
  and explicitly proves E2E packs/manifests run after the exact deployed-SHA
  checkout. Ruleset `18018081` confirms branch protection requires the stable
  `Installed app checks` aggregate.
- The exact-head dependency-governance run independently repeated a full
  typecheck and production build and spent 1m43s in full-history checkout. The
  workflow now uses `blob:none` plus the shared pnpm cache and remains focused
  on dependency provenance/install/pin/test policy. Required App CI owns the
  duplicate application gates, with an explicit workflow contract test.
- The optimized dependency workflow completed in 54 seconds. Its first
  exact-head planner replay then failed closed in 28 seconds because the legacy
  label-sync step retained PR-write permissions. Label recommendations now
  appear in the job summary and the untrusted PR workflow is strictly
  read-only; mutation is no longer mixed with dependency evaluation.
- First staging qualification of the merged pipeline built and uploaded the
  exact artifact in 11m05s, concurrent with the 12m08s production prebuild.
  Promotion then failed closed in 1m11s before activation: SSM executes as
  root, but the staging checkout belongs to `ubuntu`, so Git rejected the
  checkout as dubious ownership. The hotfix runs every repository operation as
  the configured checkout owner and deliberately avoids a global
  `safe.directory` exception.
