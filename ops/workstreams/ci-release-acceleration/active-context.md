# Active context

- Branch: `codex/accelerate-ci-release`
- Base: frontend main `11c91ab0576dd69ee3bc4dec671702dbc0d0bf69`
- Scope: release-duration audit, PR CI matrix, scoped Museum browser lane,
  secret-free caches, immutable staging activation, production prebuild and
  promotion, automatic post-deploy E2E, runner indirection, and stale Meme
  Calendar contract correction.
- Source input: open PR #3582 was inspected and selectively integrated. Open
  PR #3586 and older E2E proposals were dispositioned in the audit.
- Local validation: nine workflow/runner/classifier suites and all 200 tests
  pass; changed lint, changed application typecheck, the Jest and Playwright
  typecheck ratchets, E2E manifest synchronization, dependency risk, Debt
  Ratchet, portable whitespace validation, agent-file synchronization, and
  React Doctor 100/100 pass. The earlier 17-suite Windows replay had 332
  passing tests and four platform-specific failures from existing
  `O_NOFOLLOW`, fake-`gh` PATH and Bash fixture contracts; hosted Linux remains
  authoritative for those suites.
- The clean worktree-local optimized production build passed in 334.4 seconds.
  An earlier attempt failed before compilation because the ignored
  `node_modules` directory was a cross-worktree junction; a frozen local
  install removed that host-only caveat before the passing build.
- Frontend `main` advanced to `aaf35662bf0ca664c05a6f9cdc16db396d99e251`
  during validation. It merged conflict-free; the exact combined signed head
  passed the complete short-gate replay and a fresh optimized production build
  in 371.1 seconds.
- Release actions still required: PR review iteration, merge, exact staging
  deploy/E2E, production prebuild readback, production promotion, automatic
  production E2E, retained endpoint/version sweep, and measured before/after
  update.
