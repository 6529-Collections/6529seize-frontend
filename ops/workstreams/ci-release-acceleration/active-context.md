# Active context

- Current repair branch: `codex/e2e-release-stability`
- Current base: frontend main `8cfb1d53d2b56d78f49821260d15fe10dc1b9783`
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
- Release actions still required: merge the narrow E2E stability repair,
  compose/deploy that exact main to staging, obtain green automatic staging
  E2E, promote the exact prebuilt production artifact, obtain automatic
  production E2E, and complete retained endpoint/version evidence.
- Ready PR #3593 opened at exact signed/signed-off head `9481d5e3...`. Its
  first hosted plan selected four parallel lanes and correctly omitted the
  Museum lane. The quality lane exposed two stale public-review artifact
  assertions that still expected production packaging inside the deploy
  workflow; sibling lanes were cancelled by fail-fast before long work. The
  assertions now follow the dedicated production prebuild. Review hardening
  also gives the staging presigned URL a 90-minute lifetime over the bounded
  40-minute SSM wait, clears the decoded destination input on every exit,
  removes an incomplete destination file, and records that all pack code and
  manifests execute from the exact deployed-SHA checkout. Repository ruleset
  `18018081` already requires the stable aggregate `Installed app checks`, not
  a matrix child name.
- Hosted observation also found the separate dependency-governance workflow
  repeating a full application typecheck and production build after required
  App CI had already accepted both responsibilities. It now retains the
  dependency risk classifier, Socket Firewall, frozen install, package pin
  lint, unit tests, and risk-label recommendations while using blobless history
  and the pnpm cache. Required App CI remains the single owner of complete
  application typechecking and production build evidence. Hosted validation
  exposed the legacy workflow's PR-write permission in 28 seconds; label
  recommendations now go to the job summary and the PR workflow is strictly
  read-only.
- PR #3593 merged as `eaae62f8986a8a0f3f5d219008041b4c1f5f88d2`.
  Production prebuild run `30959015710` succeeded in 12m08s. Staging run
  `30959063209` built exact bytes in 11m05s, then failed before activation when
  root-owned SSM Git commands encountered the `ubuntu`-owned checkout. The
  active hotfix preserves Git's ownership check and executes repository
  operations as the configured checkout owner.
- PR #3597 merged that hotfix as
  `8cfb1d53d2b56d78f49821260d15fe10dc1b9783`. Staging run `30961248107`
  succeeded in about 11m30s and production prebuild `30961224309` succeeded in
  13m17s. Automatic staging E2E `30961887383` completed its immutable tooling
  checkout in one second and ten of twelve parallel packs passed. The two
  failed packs were a transient staging API fetch in the broad shell pack and
  a stale Meme Calendar test role. Retained desktop/mobile accessibility trees
  show SZN, Year, and Epoch are now rows with valid date ranges, so the repair
  asserts their current row contract without suppressing console or response
  errors.
- Local authenticated replay showed the broad pack's remaining failure came
  from tests that navigated one page across two routes. Coinbase Wallet SDK
  asynchronously checks the current route with `HEAD`; the second navigation
  aborted that check and produced the exact console error. The notifications,
  messages, open-data, and block-finder routes now have independent Playwright
  cases. No console error is allowlisted or suppressed.
- The staging fixture no longer preloads `/` before every case. Access is
  already seeded in the context cookie; if a gate still appears, the existing
  wrapped `page.goto` submits the credential and retries the originally
  requested route. This removes a duplicate navigation from every staging test
  without weakening access-gate handling. The corrected broad pack passed all
  44 applicable desktop/mobile cases in 1m51s, down from the failing 2m26s
  replay, and the calendar pack passed 10/10 in 36s.
- `format:changed` now resolves the exact `origin/main` merge base and includes
  current tracked edits. This replaces its stale local `main...HEAD` range,
  which selected 552 unrelated files during validation; that accidental output
  was discarded rather than included.
