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
