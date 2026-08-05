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
- PR #3597 merged the checkout-owner hotfix as
  `8cfb1d53d2b56d78f49821260d15fe10dc1b9783`. Its exact App CI completed in
  11m38s and omitted the Museum lane. Staging retry `30961248107` built the
  exact artifact in 9m35s and promoted it in 1m33s; the complete deploy took
  about 11m30s. Production prebuild `30961224309` ran concurrently and
  completed in 13m17s.
- Automatic staging E2E run `30961887383` proved the sparse immutable tooling
  checkout in one second and ran twelve packs at a maximum concurrency of
  three. Ten packs passed; the broad shell pack caught transient staging API
  fetch failures, and the public groups/tools pack exposed a stale assertion:
  Meme Calendar now presents SZN, Year, and Epoch as table rows rather than
  buttons. The retained accessibility snapshot proved the rows and their date
  ranges rendered correctly on desktop and mobile. The assertion now follows
  those row roles; browser console failures remain release-blocking.
- A local exact replay of the broad staging pack passed 38 routes before a
  mobile open-data/block-finder case logged Coinbase Wallet SDK's same-origin
  header probe as `Failed to fetch`. Source inspection showed the SDK performs
  an asynchronous `HEAD` against the current route; the test then navigated the
  same page to its second route and aborted that request. The earlier
  notifications/messages failures had the same cross-navigation shape. Each
  route now runs as an isolated Playwright test, keeping console errors strict
  while removing navigation-induced errors and giving every route its own
  failure boundary.
- The shared staging fixture also performed an eager home-page navigation for
  every test even though the browser context already receives the staging
  access cookie. That duplicated a full route load, then abandoned its
  background SDK requests when the test opened its actual route. The wrapper
  now starts at the requested route and retains its existing gate detection,
  credential submission, exact-route retry, and non-staging guard. This removes
  one unnecessary application navigation per staging test and its associated
  false console noise. The strict broad pack then passed 44/44 applicable
  cases in 1m51s; the calendar pack passed 10/10 in 36s.
- Local validation exposed a related formatter defect: `format:changed` used a
  potentially stale local `main...HEAD` range, ignored the working-tree side of
  tracked edits, and selected 552 unrelated files in an isolated worktree. The
  accidental formatter output was discarded. The command now uses the exact
  `origin/main` merge base and diffs that commit against the current index and
  working tree, matching the changed-lint boundary. A contract test rejects a
  return to the local-main range.

## 2026-08-05

- PR #3598 merged as `1b88da6214d1c97c6a22ea40e8e7e0d5285dcd0d`.
  Exact App CI run 30963778437 completed with a 10m34s longest lane and omitted
  Museum coverage for its non-Museum change set.
- Staging composition `dbc152937798086696f007b43e0c83652ab9074b`
  deployed in run 30964484960. Automatic staging E2E 30965170461 passed all
  twelve selected packs in 6m55s dispatch-to-finish. Concurrent production
  prebuild 30964439072 completed in 13m33s.
- Production run 30965594547 promoted the verified prebuild in 5m16s, down
  from the audited 22m12s. Automatic production E2E 30965872983 passed all
  twelve packs; exact live version and representative Museum/non-Museum routes
  were healthy.
- Merge-to-production was 27m38s; merge-to-complete-production-E2E was 38m46s.
  Both beat the target pipeline's initial service levels.
- Final live evidence showed the non-Museum production release still selected
  the 8m14s Museum pack. A shared exact path classifier now owns staging and
  production selection. Production derives its base from the immediately prior
  successful production deployment rather than assuming the new commit's first
  parent. Missing history, invalid SHAs, Git failures, and older runners all
  retain Museum E2E fail-closed.
- Keys and Gates staging E2E 30967900031 proved the full Museum pack green in
  9m14s. Its only failed pack was unrelated collections coverage: staging
  returned HTTP 200 documents containing the `6529 Error` shell for `/nextgen`
  and `/nextgen/about`. A direct replay found those routes healthy, then hit a
  second HTTP 200 soft failure (`404 | PAGE NOT FOUND`) on the collection-art
  route. The existing retry recognized only HTTP 502/503/504. Route readiness
  now retries either soft failure document once, then blocks on persistence.
