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
- Full staging qualification run 30972152707 attempt 1 passed thirteen of
  fourteen packs, including both Museum packs. Collections failed on persistent
  NextGen soft-error documents; an immediate isolated replay passed 20/20 in
  77 seconds. Attempt 2 passed collections and both Museum packs but failed the
  social pack on a public-profile `6529 Error`; its immediate isolated replay
  passed 12/12 in 36 seconds.
- Added one capability-negotiated serial retry for failed E2E packs after the
  bounded parallel first pass. Only failed packs rerun. Per-attempt logs and
  classifications are preserved, and a persistent retry failure still blocks
  the release. Focused runner and performance contracts pass 31/31; changed
  lint, application/test/Playwright typechecks, manifest sync, and Debt Ratchet
  are green.
- PR #3603 merged as `852b43fd9dc5af86aaf75c2942aea6e490544e25`.
  Its App CI completed in 11m32s; quality/contracts took 2m36s, smoke 3m14s,
  critical shell 4m23s, and Museum PR CI was omitted.
- Staging composition `474a04f67701028807fb49747d5aa0e548f7a3a4`
  deployed successfully in run 30975793722. Production prebuild 30975744759
  completed concurrently in 13m28s. Automatic staging E2E 30976430422 passed
  in 7m23s with three workers and the new retry evidence contract.
- Retained evidence showed 13 packs: institutional-practice was correctly
  absent, but the newly added Inside the System Museum pack was still present.
  Production promotion was stopped. Replaced literal single-pack exclusion
  with manifest-owned Museum scope selection plus a validator ratchet and
  rollback-compatible `museum-*` fallback.
- PR #3604 first head `cb658f7c8e6af83af438ab61a1c368ac964eaf0b`
  failed the quality lane because one compatibility test still expected a
  single literal Museum alias. The 6529 reviewer also required a contract that
  the run-step and evidence-step predicates cannot drift. Updated the mock to
  enumerate both scoped aliases, asserted both exclusions in staging and
  production, and added byte-identical predicate plus local-pack-count
  ratchets. Product lanes were cancelled immediately after the quality failure.
- The follow-up review also added executable coverage for the legacy
  `museum-*` rollback classifier, locked both selector snippets to the correct
  deployed environment and `post-deploy` trigger, and rejected mixed Museum and
  non-Museum specs in every automatic post-deploy pack. The intentionally mixed
  production aggregate remains available only as a manual operator diagnostic.
  The release-bus compatibility fixture now writes checksums with the same
  platform tool used by the workflow and normalizes its Bash-facing temporary
  path, eliminating a Windows-only false failure without weakening evidence
  validation.
- A full `__tests__/scripts` sweep found and replaced one more stale literal
  single-pack assertion in `testing-strategy.test.ts`. The same Windows run also
  reported the repository's existing POSIX-only security-test baseline:
  `O_NOFOLLOW` is unavailable and directory-descriptor `fchmod` returns `EPERM`.
  Those twelve platform failures are unrelated; hosted Linux remains the
  authoritative environment for those fail-closed controls.
- PR #3604 final head `8aee301944e9140515cd6b07a2bac7e10621e0d2`
  passed all 17 hosted checks. App CI run 30979078634 completed in 12m23s;
  quality/contracts took 2m56s, smoke 3m33s, critical shell 4m39s, production
  build 11m23s, and Museum was omitted. Zero review threads remained. The
  controlled merge audit is PR comment 5188141004. PR #3604 merged as
  `2edfb2610c0cca9f49d45c5465c43bba8a20077e` at 05:58:51 UTC.
- Staging composition `12b40bd96de7f3769c4738a8796e7f915d34db0f`
  deployed in run 30979848612. Concurrent production prebuild 30979804039
  produced artifact `production-frontend-2edfb2610c0cca9f49d45c5465c43bba8a20077e`
  with SHA-256
  `5006419d86d2ab7faad723896a22590fac69b40caddf277f295bf6cd3e96c0d9`.
- Automatic staging E2E 30980599423 passed. Retained evidence contains 12
  packs, three workers, zero Museum packs, and zero final failures. Collections
  alone used attempt 2 and passed in 55.7s; all other packs remained on attempt
  1. Reviewer evidence is the `staging-e2e-artifacts-30980599423` artifact on
     [run 30980599423](https://github.com/6529-Collections/6529seize-frontend/actions/runs/30980599423),
     retained by GitHub through 2026-09-04.
- Production run 30981038834 promoted the exact prebuilt artifact in 5m58s.
  Three consecutive live version requests returned exact main
  `2edfb2610c0cca9f49d45c5465c43bba8a20077e` for both served and announced
  versions with `stale:false`.
- Automatic production E2E 30981386269 passed in 2m53s. Retained evidence
  contains 11 packs, three workers, zero Museum packs, zero retries, and zero
  failures. Reviewer evidence is the `production-e2e-artifacts-30981038834`
  artifact on
  [run 30981386269](https://github.com/6529-Collections/6529seize-frontend/actions/runs/30981386269),
  retained by GitHub through 2026-09-04. Machine-local mirrors remain under
  `C:\Users\Administrator\.codex\artifacts\ci-release-final` for operator
  convenience only.
- Final timing: merge-to-production 27m47s; merge-to-qualified-production
  30m47s. The workstream is complete.
- Closeout PR #3605 review replaced machine-local-only evidence references with
  GitHub run/artifact references, corrected the PR comparison to total elapsed
  time on both sides, and added a tested `ops/**` staging path exclusion. The
  exclusion is deliberately narrow: public or build-input Markdown remains
  deployment-triggering. Focused workflow tests pass 62/62 and the Jest type,
  changed-lint, Bash-parse, formatting, and whitespace ratchets are green.
- The post-merge sweep observed production-prebuild run 30983293737 start for
  the closeout's `.github`, `__tests__`, and `ops`-only delta. The run was
  cancelled because it could not produce deployable application changes.
  Production prebuild now ignores `.github/**`, `__tests__/**`, `ops/**`, and
  `tests/**`-only pushes; any application source, application configuration,
  dependency, script, or public-content change still triggers the fail-closed
  exact prebuild. An ignored-only main SHA deliberately has no automatic
  deployable artifact. If an operator intentionally promotes that SHA, the
  existing manual dispatch must first build its exact artifact; production
  deployment otherwise fails closed. The contract also proves that the build
  workflow consumes no ignored local `.github` action; introducing one must
  first narrow the trigger exclusion.
- Post-rollout qualification of the six-PR extension found a constructor defect
  in staging run 31099280984 and the contemporaneous production prebuilds. The
  portability inventory was pointed at the unzipped Next.js build workspace,
  whose standalone dependency tree legitimately contains symbolic links. The
  verifier therefore failed closed after a successful build and package check,
  before any deployment mutation.
- The correction makes the manual staging, exact production prebuild, and
  Release Bus preflight constructors inventory the package ZIP's extracted
  bytes. Runtime configuration and the asset-profile flag are read from that
  same extraction. Temporary Release Bus extractions are removed before the
  artifact checksum is written or bytes are uploaded. The build workspace is
  no longer treated as if it were the deployable package.
- Focused workflow, production-constructor, performance, and portability tests
  pass 39/39. Changed lint, changed TypeScript validation, targeted formatting,
  and the Windows-aware whitespace check are green. Exact staging and
  production reruns remain the authoritative end-to-end proof.
- Corrected staging run 31102839144 proved that the constructor now inventories
  the ZIP extraction, then exposed the same expected Next.js dependency links
  inside those extracted bytes. The package had already passed its listing and
  extraction assertions; the portability scanner alone rejected the links.
- The package scan now accepts only relative symbolic links whose resolved
  targets remain inside the asserted extraction root and resolve to a regular
  file or directory. It skips the alias because the canonical target is walked
  separately, avoiding duplicate scans and cycles. Absolute, broken, escaping,
  and unsupported-target links fail closed. Source-content roots continue to
  reject every symbolic link.
- Review tightened that boundary further: both the immediate lexical target and
  the fully resolved target must remain inside the extraction root, so a link
  cannot leave the package and return through a second link. Target type is read
  from the already-resolved path. Accepted link name, target, canonical target,
  and target type are committed to the package-scan tree digest while canonical
  file bytes are scanned once through their physical path.
- Final review requires the scanner to prove completeness through every
  accepted alias rather than rely on the target also appearing elsewhere in
  the root walk. Contained directory links are now traversed under their alias
  paths, contained file links are read through their resolved physical path,
  and repeated real directories in one traversal ancestry fail closed as a
  symbolic-link cycle. The tree digest retains the link metadata and commits
  the alias-visible file projection.
