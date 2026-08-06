# Run log

## 2026-08-05 — execution authorization

- The owner authorized the complete six-PR implementation, merge, staging,
  production, E2E qualification, and developer-Wave closeout.
- Refreshed frontend `origin/main` to
  `d448d4c282c034fa2a1d5d1d95ce90fc85561e54`.
- Confirmed authenticated GitHub access as the existing repository owner
  account and a clean understanding of the proposal worktree changes.
- Confirmed the repository declares Simple Release Bus v2 as the sole
  automated release authority. No environment mutation has occurred.
- Started five read-only parallel audits covering PRs 2, 4, 5, 6, and final
  Release Bus execution.
- Began PR 1 locally: measurement, trusted report-only classification,
  immediate retry-amplification repair, duplicate-work removal, and cache
  correctness.

### Safety boundary

- Each PR remains separately reviewable and receives exact-head CI/review.
- Candidate tooling cannot authorize a narrower lane for itself.
- Unknown classification escalates to broad coverage.
- Staging precedes production and `STAGING_DEPLOYED` is never treated as
  validation.
- The dev-team Wave post is sent only after exact production and E2E closeout.

## 2026-08-05 — PR 1 implementation checkpoint

- Added a report-only `museum-release-classification-v1` classifier. It binds
  exact base/head commits, fails closed to P3, proves a registered P0 only when
  the production component differs solely in approved literal `className`
  values, and cannot reduce any check in this phase.
- Bound the classifier, test, and package command into the PR CI policy bundle.
- Added its structured report and digest to the quality-lane evidence and job
  summary.
- Deduplicated Jest suites selected both directly and through
  `--findRelatedTests`.
- Preserved `.next/cache` while cleaning other Release Bus build output.
- Reproduced the Casey gift console failure from PR #3628. React identified
  unkeyed caller-provided children of `MuseumDossierDocument`; keyed the
  summary and content at their construction site. The exact focused Chromium
  route changed from failure to 1/1 passing in 37.6 seconds without an
  allowlist change.

### Validation

- Focused application/policy tests: 51/51 passed.
- Changed lint: passed.
- Changed TypeScript: passed for 1,358 files under the repository ratchet.
- Jest and Playwright test typecheck ratchets: passed.
- Package script lint and whitespace checks: passed.
- The complete policy-bundle suite remains intentionally Linux-only because
  Windows does not expose `O_NOFOLLOW`; its other focused dependants passed
  locally and hosted Linux remains authoritative.
- A local production build is deferred to hosted CI because the reversible
  local dependency junction required after two Windows linker stalls is
  rejected by Turbopack. No tracked source depends on the junction.

## 2026-08-05 — PR 1 exact-head review

- Opened frontend PR #3632 at signed head
  `11f536d6a2d23c5d4f9eb936a4401d78712bb0c2`.
- The first 6529bot review identified an eager blob-read exception that could
  report P3 instead of the intended P2 fallback, and two inconsistent digest
  definitions. Both findings were valid.
- Moved the read into an explicit fail-closed boundary, defined the digest once
  over the unsigned report, rejected option flags as missing values, and made
  the workflow reject malformed report shapes before rendering its summary.
- Added regression coverage for unreadable registered blobs, option parsing,
  and digest identity. No release selection is active in this PR.

## 2026-08-05 — bilateral Museum-source compatibility repair

- Frontend PR CI resolved canonical Museum commit
  `42236950a8976825861b6785613e3837405f486c` while testing PR #3632.
- The source commit passed the Museum validator on Ubuntu and Windows, but the
  frontend rejected its newly added museum-practice rights matrix because the
  bilateral adapter contract did not yet include those fields.
- Extended the strict frontend projection with exact museum-practice status and
  per-action matrix shapes. The parser retains the legal-license matrix and
  records the new ordinary-practice matrix as a distinct fact; it does not
  collapse legal permission into museum practice.
- Bound registry version 1.1.0 and its six new primary-source references to
  exact HTTPS locations; unreviewed source-key drift still fails closed.
- Added malformed-definition and malformed-matrix rejection tests. This defect
  establishes a permanent requirement for cross-repository compatibility
  evidence before a canonical Museum source change is considered releasable.

## 2026-08-05 — PR 1 final CodeRabbit review

- CodeRabbit found one valid order-dependent fold in the report-only tier
  classifier: a P1 file appearing after a P2 file could lower the aggregate
  result to P1. The fold now starts at `NONE` and applies `maxTier` to each
  file result. P1-only and mixed P1/P2 order permutations are covered.
- The registered P0 proposition component and its contract test now trigger
  the Release Bus contract suite directly, so renames or deletions cannot
  bypass registry-drift coverage.
- The build proposal now permits duplicate Next typechecking suppression only
  after full exact-tree typechecking has run after `.next` type generation.
  Without that evidence, Next typechecking remains enabled.
- Fixed two Markdown PR-reference warnings and added this run log to the
  workstream's current-status index.
- The legacy dual-profile bridge now clears `.next/cache` between staging and
  production builds, preventing profile-specific runtime inputs from crossing
  that boundary. The normal v3 single-environment path still reuses its
  environment-keyed cache.
- The release flow now routes staging qualification through an explicit
  Museum-hold-clear decision; a red hold blocks promotion until cleared by the
  recorded nightly mechanism.
- Focused classifier/effective-plan validation passed: 44 tests. Changed lint,
  changed TypeScript ratchet (1,358 files), and scoped whitespace checks passed.

## 2026-08-05 — PR 1 current-main reconciliation

- The final pre-merge App PR CI run on head `0d6142bccff9` passed every
  substantive lane. The unconditional Network Museum browser lane took
  24m20s, versus 11m41s for the production build, 4m24s for the critical shell,
  4m03s for quality/contracts, and 3m03s for smoke. This is the measured
  before-state for the surface-selection work.
- While that lane ran, PR #3629 merged to main as
  `a888054589e7311848278c53b187033d96b1f5fb`, adding the Museum data-
  architecture reading room and a second independently reviewed implementation
  of the rights-registry v1.1 adapter.
- Reconciled PR #3632 with exact current main. The current-main rights types,
  parser, fixture, and tests were retained because they include the new data-
  architecture contract and supersede the parallel names introduced in this
  branch. The report-only classifier, cache isolation, and workstream evidence
  remain intact.
- Post-merge local validation passed: 69 focused tests across data architecture,
  rights, classifier, CI plan, and Release Bus performance; changed TypeScript
  passed for 1,358 files.
- Removed the incidental `MuseumGiftPage` React-key cleanup and its route-test
  assertion from PR #3632 after current-main reconciliation. They were
  unrelated to the fast-lane contract and were the only remaining Museum
  runtime paths in the diff; keeping them would have forced another 24-minute
  exhaustive lane and obscured the policy-only validation boundary.

## 2026-08-05 — PR 2 implementation checkpoint

- Implemented the Museum surface registry/schema and report-only checker. After
  reconciling the concurrently merged data-architecture reading room, the
  registry is complete for 32 Museum page routes, 4 support files, 32 Museum
  components, and 5 Museum E2E specs, organized into 17 stable surfaces. The
  checker uses the TypeScript compiler API for reverse imports and fails closed
  on an unmapped Museum-owned path or unresolved local import.
- Added unit tests covering the real inventory, seeded unmapped page/component/
  spec cases, shared dependency escalation, direct mapping, and unresolved
  local imports.
- Added static publication corpus contracts covering the complete institutional
  practice corpus, required section/lesson/limit/source declarations, HTTPS
  credential-free sources, route/source coherence, Casey Reas and Keys & Gates
  inventories/relations, and atomic exact-source activation. Updated only the
  test fixture's publication examples to make the new semantic checks
  substantive.
- Added `tests/museum/about-readonly.spec.ts` for `/museum/network/about`.
  It checks desktop/mobile typography floors, line-height and color hierarchy,
  horizontal overflow, safe links, exact source identity, and existing
  console/network diagnostics. The broad institutional-practice browser sweep
  remains available for manual and deployed qualification; it is not added to
  the PR lane in this report-only phase.
- Added the About pack to package scripts, the E2E pack manifest, staging
  dispatch options, generated test documentation, and the combined production
  read-only set. Updated the current-main release-bus performance contract from
  16/15 to 17/16 staging/production post-deploy packs.
- Added the registry/schema/checker/tests/About spec to the complete 97-file
  policy bundle and raised its explicit inventory ceiling from 96 to 128. Added the registry/corpus
  quality step to App PR CI as shadow/report-only; existing checks and the
  broad Museum lane are preserved.

### Exact validation results

- Registry command passed with counts: 17 surfaces, 32 routes, 4 support files,
  32 components, 5 E2E specs.
- Changed lint, changed TypeScript (1,358 files), Jest/Playwright test
  typechecks, package JSON lint, and E2E manifest check all passed.
- Focused regression run passed: 11 suites / 290 tests.
- Release-bus performance contract passed: 7 tests.
- `codex-diff-check` passed.
- The Windows policy-bundle suite was attempted and exited at its existing
  `O_NOFOLLOW` platform guard before assertions could run. This is a host
  limitation; hosted Linux remains authoritative and the protection was not
  relaxed.
- No build, browser run, push, PR, merge, staging deployment, or production
  deployment occurred in this worker boundary.

### Open issues / follow-up

- The new About browser contract is typechecked and included in hosted packs,
  but its browser execution remains a hosted-CI responsibility in this
  worktree.
- The institutional-practice browser sweep remains broad and available for
  manual and deployed qualification. Template-oriented splitting is deferred
  until it can be made runtime-neutral without weakening current evidence.

## 2026-08-05 — PR 2 hosted contract reconciliation

- The first exact-head hosted quality run found three stale cardinality
  assertions in `e2e-packs.test.ts`. The manifest, generated package scripts,
  generated README, surface registry, performance contract, and their direct
  tests were already synchronized; the umbrella E2E CLI suite still expected
  the pre-About totals.
- Updated only those exact assertions: 17 staging post-deploy packs, 16
  production post-deploy packs, and 15 dedicated Museum packs split 5/5/5
  across local, staging, and production.
- Fail-fast correctly cancelled the concurrent build, critical-shell, and
  Museum jobs after the quality failure. No cancelled lane is treated as
  evidence; all lanes must rerun on the corrected exact head.
- The next hosted Museum run proved current canonical source
  `6f7f8b2168347cb623d53eeb6b9d7fe1242d7a73` activates far enough to pass the
  data-architecture pack, then found a selector error in the new About
  contract. `header p` selected the 14px uppercase eyebrow rather than the lead
  paragraph. The contract now selects the structural adjacent sibling
  `header h1 + p`, preserving the valid 14px label while measuring the intended
  18px/20px lead copy. The branch must rerun every exact-head lane again.
- A local exact-source browser replay was attempted. Windows Turbopack rejected
  the shared dependency junction; the webpack fallback then exhausted its
  startup window while the shared local API on port 3000 was unavailable. This
  is recorded as local infrastructure failure, not passing product evidence;
  the fresh hosted Linux browser run remains authoritative.
- Independent exact-head review found that the shadow workflow passed symbolic
  Git references to a deliberately exact-SHA-only classifier. The workflow now
  resolves both endpoints to immutable 40-hex commits before classification;
  the classifier's strict input boundary remains unchanged. The same review's
  About selector finding is fixed by the adjacent-sibling selector above.
- All valid CodeRabbit findings from the first review were incorporated: the
  protected fixture and staging pack keys are explicit; source URLs and digests
  have non-vacuous exact contracts; summary logs are bounded and rendered as
  indented code; JavaScript/JSX parsing uses the correct script kinds with
  Program syntactic diagnostics; roots compare by value; ownership lookups are
  indexed once; CLI options fail closed; the alias resolver is exercised; the
  About pack preserves primary and diagnostic failures together; and the pack
  names now follow the established Museum convention. The protected policy
  inventory ceiling increases from 96 to 128 to accommodate the complete 97-file
  bundle without weakening the existing byte ceilings.
- Exact hosted run `31058132630` passed the corpus contract and every blocking
  lane, but its report-only registry emitted a warning because the Linux
  `./bin/6529` wrapper preserved pnpm's standalone `--` delimiter. The strict
  parser now accepts that delimiter as syntax while continuing to reject every
  unknown option; a regression test covers the exact hosted argument shape.
- Exact hosted run `31058952470` then proved the delimiter fix but exposed a
  Turbopack process panic after the first Museum pack completed: a new
  Playwright invocation restarted the development server against the same
  dist directory, and Turbopack's aggregation backend panicked before either
  About viewport could receive a document. The PR lane now runs all four
  Museum specs in one Playwright process and one web-server lifecycle. This
  preserves every desktop/mobile assertion while removing three redundant
  server startups and the observed restart boundary.
- Exact hosted run `31060213753` proved the consolidated lane: all four Museum
  specs across both desktop and mobile passed in one Playwright process. The
  browser step completed in 4m50s and the full Museum job in 6m01s, with one
  application-server lifecycle and no Turbopack restart panic.

## 2026-08-05 - PR 3 conservative tier-activation checkpoint

- Implemented `museum-release-selection-v1` with exact range classification,
  an auditable digest, fail-closed range/classifier handling, and explicit
  P0/P1/P2/P3 selection. Only verified P0 selects the exact About pack; P1
  remains broad because no trusted template-to-pack registry mapping exists;
  P2/P3 remain broad by policy.
- Strengthened P0 proof for the exact #3628 class: unchanged dynamic
  `className` structure is retained, approved literal style changes are
  constrained, and a focused test may only strengthen a static assertion
  program after unchanged render/setup behavior; interactions or other setup
  changes escalate. Added synthetic negative cases and exact historical
  code-range shadows for #3628, #3625, and the control-plane change. The
  evidence ledger expressly does not claim 20 releases.
- Activated the selector in App PR, staging, and production workflows. Their
  selected-pack evidence is preserved with the existing exact-SHA,
  manifest-bound, read-only staging/production controls and exact canonical
  source SHA. Calls with a missing range, invalid selector value, unknown hold
  state, unavailable pack-exclude capability, source mismatch, or rollback
  mode keep the full Museum inventory or fail before qualification.
- Aligned App PR Museum-lane activation with the classifier's own Museum and
  policy predicates, including P1 presentation assets and P3 control-plane
  files. The classifier now loads its TypeScript parser only for AST proof, so
  that trusted predicate reuse remains safe in the pre-install planning job.
- App PR selection stages the classifier and selector from the protected base
  SHA. During the one-time PR3 bootstrap, where that base has no selector yet,
  it emits an explicit full-inventory selection record; it cannot execute the
  candidate selector to obtain a narrow result. The strict-adapter workflow
  also writes a failed-result artifact if the adapter runner itself cannot
  start.
- Before matrix construction, App PR independently stages the protected-base
  classifier path predicates and forces the Museum browser lane if any changed
  path is Museum-owned or Museum policy. A predicate/Git failure also forces
  that lane, preventing a candidate planner or classifier change from omitting
  its own P3 broad qualification.
- Added the immediate Actions-variable rollback control:
  `MUSEUM_RELEASE_TIER_MODE=full`. Invalid or absent values are full by
  default.
- Kept `museum-institutional-practice` broad qualification on `cron`, manual,
  and post-deploy triggers. A scheduled failure, or a failing explicitly
  authorized manual full sweep, creates/updates the bot-managed
  `release-bus-museum-hold` issue. A passing authorized exact-source adapter
  plus broad sweep clears only that managed issue; foreign hold issues stop the
  clear operation.
- Added `museum-publication-compatibility.yml`: a reusable exact-source
  workflow for the canonical Museum protected-main caller, repository dispatch,
  and a nightly exact-source check. It binds the canonical source SHA before
  running the current frontend strict adapter and saves the adapter result as
  evidence. Its runner and pinned `tsx` dependency are protected by the PR
  policy bundle. The source repository still needs to invoke this workflow from
  its protected-main policy after the frontend change is merged.
- Local direct probe classification: immutable raw GitHub transport was
  healthy, but the stale PR3 frontend adapter returned
  `publication_rights_registry_shape_invalid` for source SHA
  `6f7f8b2168347cb623d53eeb6b9d7fe1242d7a73`. This branch lacks the final
  current-main v1.1 rights adapter/#3629 changes, so the result is recorded as
  non-qualifying stale-adapter evidence, not a Museum source defect. Re-run the
  exact gate after rebase onto merged PR2/current frontend main; no exception
  was added.

### Validation

- Focused regression run: 10 suites / 174 tests passed (App PR plan, tier
  classifier, selector, surface registry, synthetic adapter, E2E manifest,
  testing strategy, Release Bus performance contract, and static corpus
  contract).
- `seize run lint:changed`: passed.
- `seize run typecheck:changed`: passed for 1,359 changed TypeScript files.
- `seize run typecheck:jest`: passed; the ratchet retained 2,125 existing
  diagnostics across 872 files.
- `seize run typecheck:playwright`: passed.
- `seize run e2e-manifest:check`: passed; generated package/README targets are
  synchronized.
- YAML parsing passed for App PR, staging E2E, production E2E, and Museum
  compatibility workflows; `codex-diff-check` passed.
- The policy-bundle Jest suite remains Linux-only: Windows lacks
  `fs.constants.O_NOFOLLOW`, so it exits at the intentional fail-closed
  platform guard before assertions. No compatibility workaround weakened that
  guard.
- No build, browser run, push, pull request, merge, staging deployment,
  production deployment, or external release mutation was performed.

## 2026-08-06 - PR 3 exact-head review follow-up

- Confirmed the review bot's reported identity typo at the byte boundary: the
  foreign-hold filter closed the quoted bot login before its final bracket.
  Corrected it to the complete `github-actions[bot]` identity and added a
  regression contract for both managed and foreign predicates.
- Retained the exact deployed-SHA assertion in staging and production. A
  commit mismatch is release identity failure; a wider test selection cannot
  qualify a tree other than the one deployed. The workflows and contract test
  now state that boundary directly.
- Accepted the two hardening suggestions: the exported pack selector rejects
  unknown environments, and App PR CI proves every selected Museum spec exists
  before starting Playwright.
- Updated affected workflow-contract tests to the active selector name and
  five-pack inventory. The prior hosted failure was a stale test-contract
  expectation, not a release-workflow runtime failure.

## 2026-08-06 - PR 3 current-main integration

- Rebased the tier-activation commit onto exact current main
  `68211368a099cc7a4638febbd9346336e16e8a38`, which contains merged PR 2 at
  `fe0ad4ade31f84d6321f200bf8a0ec531e7651bb` and the later Data Architecture
  diagnostic stabilization.
- Reconciled the current five-pack Museum inventory. Full mode now selects Data
  Architecture, Institutional Practice, About, Inside the System, and Rights
  in PR, staging, and production. P0 still selects only About.
- Preserved PR 2's one-server browser topology: selected specs are collected
  first and run in one Playwright process, so narrowing does not reintroduce
  redundant application restarts.
- Exact bilateral probe passed for canonical Museum source
  `6f7f8b2168347cb623d53eeb6b9d7fe1242d7a73`: `accepted=true`,
  `adapter_status=current`, and `publication_commit` equals the source SHA.
- Integrated focused validation passed: 10 suites / 182 tests. Changed lint,
  changed TypeScript (1,371 files), Jest type ratchet (2,124 existing
  diagnostics / 871 files), Playwright typecheck, generated E2E manifest,
  Windows-safe diff check, and the new compatibility workflow's complete
  actionlint pass all succeeded.
- Synced the final review follow-up onto frontend main
  `a2d3839479484144cd37c44433df424cfd60ae9c`; the intervening PR changed only
  Data Architecture workstream records, so no selector, workflow, or runtime
  reconciliation was required.
- Hosted exact-head policy validation caught an incorrect package-field path:
  `tsx` is pinned under `dependencies`, not `devDependencies`. Corrected the
  protected key and its contract assertion; the gate failed before producing
  release evidence, as designed.

## 2026-08-06 - PR 3 exact-head review hardening

- Applied all eight valid exact-head review findings before merge. Unset
  `MUSEUM_RELEASE_TIER_MODE` now reaches the selector unchanged and therefore
  retains the complete Museum inventory. This is enforced in PR, staging, and
  production workflows.
- Tightened P0 test-strengthening evidence to accept only bare `it(...)` and
  `test(...)` declarations and to prove that every existing focused assertion
  remains present. Added adversarial coverage for skipped/isolated tests,
  assertion replacement, and setup changes that pass the count precondition.
- A foreign hold refusal now writes durable `hold.json` evidence before the
  workflow fails. Staging and production copy the exact selection record into
  their environment artifact root, so upload paths cannot re-root the evidence
  bundle through `$RUNNER_TEMP`.
- Empty expected-source environment values are normalized to `null` in both
  read-only Museum browser specifications, preserving exact-source discovery
  without accepting malformed non-empty SHAs.
- Replayed the exact historical About typography shadow under the strengthened
  proof. Its head replaces an existing assertion, so the record now truthfully
  expects P2 and the full five-pack inventory; the synthetic retained-assertion
  fixture continues to prove the valid P0 path.
- Rebased the complete reviewed slice without conflict onto exact frontend main
  `5c1279ecd06fe7d676d67352980bf9633750ff06`, whose intervening change is the
  documentation-only Museum Rights practice closeout. No selector inventory,
  workflow, application, or test reconciliation was required.
- Integrated the remaining prior-review hardening before final qualification:
  selection digests are recomputed by consumers, effective pack inventory is
  cross-bound to the validated selection or its conservative full fallback,
  PR pack order matches staging and production, hold-label creation is
  idempotent, test-source read failures remain structured and fail closed, and
  compatibility identity/non-current branches plus selected-pack retention are
  covered explicitly.
- An independent exact-head integrity review found that PR jobs still fetched a
  mutable base branch independently and that Release Bus preflight treated the
  embedded Museum selection digest as a shape-only field. The workflow now
  propagates the immutable pull-request base SHA through the plan output, uses
  that SHA for every diff and protected-policy read, and records it in exact PR
  evidence. Evidence binds the exact merge tree, Museum source commit,
  selection digest, and whether the Museum browser lane was required.
- Release Bus preflight now checks out its immutable selection verifier,
  compares the evidence base to the workflow run's PR base, validates the
  selection's base/head/source/check binding, recomputes its digest, and rejects
  a missing, forged, or mismatched Museum selection record before any build.
- Exact-head hosted run `31066104003` failed closed while assembling the PR
  evidence. The protected classifier had been copied under `$RUNNER_TEMP`, so
  its repository-root calculation resolved outside the checked-out merge tree
  and returned an empty P3 fallback record. The immutable copy now lives one
  directory below `$GITHUB_WORKSPACE`: it remains byte-for-byte sourced from
  the exact protected base while its Git reads resolve against the reviewed
  checkout. A workflow contract prevents regression to the runner-temporary
  location.
- A final independent trust review showed that checksum verification alone did
  not bind the selected pack semantics to the protected selector: candidate
  code could alter the pack list and recompute its own digest. Release Bus
  preflight now checks out the exact candidate tree, resolves the current hold
  and canonical Museum source independently, runs the selector from immutable
  workflow code with a pinned-integrity parser, compares the complete expected
  and supplied records, and cross-checks browser-lane cardinality. The
  adversarial test now recomputes both the forged selection digest and artifact
  checksums and is still rejected.
- The workspace-local protected scripts are added to the checkout's local Git
  exclude before creation. This preserves their repository-relative Git root
  without exposing generated control copies to changed-source lint discovery.
- Rebased onto exact current main
  `a55c83c2ad29db7c66ef55c26f45ec645a71db35`, including PR #3640's emergency
  full five-pack Museum browser restoration. The resolved workflow keeps its
  one Playwright process and `--workers=1`; full/fallback selection still
  supplies all five specs, while the validated selector array enables the
  reviewed P0 narrowing path. The merged test contract retains both the exact
  source binding and PR #3640's process/worker assertions.
- Exact-head CodeQL identified the new exact-candidate checkout as an untrusted
  checkout. The evidence job is deliberately non-privileged and secret-free,
  runs only after the separate trusted authorization job, and parses candidate
  files as data through immutable selector code without executing them. The
  workflow now records that established trust disposition at the checkout so
  CodeQL can distinguish the intended containment boundary from a privileged
  candidate execution.
- The next hosted contract run correctly rejected the stale assertion that
  preflight had only one candidate checkout. The contract now covers both
  contained boundaries: evidence needs trusted authorization and has only
  read-only actions/contents/issues permissions; build needs successful
  evidence and has only read-only contents. Neither job-level environment may
  contain secrets, and both intentional CodeQL dispositions are counted.
- Final exact-head review tightened three test/control details: authorization no
  longer receives unused repository-content permission; the adversarial
  evidence mutation restores its fixture in `finally`; and the hold-evidence
  ordering contract proves both markers exist before comparing their offsets.

## 2026-08-05 — PR 4 runner benchmark implementation

- Added a dispatch-only controller and candidate workflow for exact-SHA runner
  measurement. The controller runs on `ubuntu-latest`, validates a strict
  source SHA/label/profile/timeout/repeat request, and retains `ubuntu-latest`
  as the explicit control profile.
- Added request-correlated polling with a bounded default 90-second timeout.
  A missing or non-terminal candidate is classified as `unavailable`; only the
  controller's own timed-out run may receive a cancellation request.
- Added a trusted-tool/source split in the candidate workflow. The candidate
  source is required to be an exact commit reachable from `main`; the
  benchmark tool is checked out from the trusted workflow SHA. The candidate
  has read-only `contents` and `actions` permissions and no deployment
  credentials.
- Added canonical JSON/Markdown evidence for controller and candidate runs,
  including queue/setup, checkout, install, build, and package durations and
  non-secret runner metadata. Unique artifact names make the uploaded evidence
  immutable.
- Added the runner activation playbook. Current status remains explicitly
  unprovisioned: the organization has no larger-runner entitlement, no
  self-hosted runners, and no repository runner variables. No activation or
  settings mutation was performed.

### PR 4 local validation

- Runner workflow contract/self-check: passed.
- Focused runner contract/evidence suite: 7 tests passed, including strict
  input rejection, source ancestry rejection, reusable-call fallback,
  controller/candidate permissions, hashed JSON/Markdown output, and
  secret-shaped evidence rejection.
- Changed lint: passed.
- Changed TypeScript: passed for 1,358 files.
- Jest and Playwright typecheck ratchets: passed with the existing 2,125
  diagnostics across 872 files and no new debt.
- Changed secret scan and workflow-security validation: passed with no
  findings.
- Package metadata, script syntax, `git diff --check`, and `codex-diff-check`:
  passed.
- The policy-bundle suite remains Linux-only on this Windows host because
  Node does not expose `fs.constants.O_NOFOLLOW`; hosted Linux remains the
  authoritative gate. The local `actionlint` binary timed out and is not
  claimed as passed.

## 2026-08-05 - PR 4 closeout correction

- Corrected `validateTrustedSource` to compare against the declared
  `trustedMainSha`; the earlier implementation referenced an undeclared
  variable.
- Added explicit regression coverage for both an exact trusted-main source
  and a distinct source commit proven to be an ancestor of trusted main.
- Confirmed generated evidence Markdown contains UTF-8 em dashes rather than
  mojibake; the focused evidence test checks both candidate and controller
  documents.
- Re-ran the focused contract, evidence, lint, changed TypeScript, secret
  scan, workflow-security, and diff checks after the correction. No commit,
  push, PR, merge, deployment, runner activation, or settings mutation was
  performed.

## 2026-08-06 - PR 4 independent-review fixes

- Superseded the initial 90-second-only observation behavior with separate
  queue-availability and workload-completion budgets. The controller timeout
  is now derived from repeat count and both budgets, bounded below the GitHub
  Actions job limit, and followed by bounded final reconciliation.
- Added strict dispatch/reusable-call candidate validation for all
  cross-fields, request IDs, repeats, timeouts, and controller nonces.
  Reusable calls execute and report only the truthful `ubuntu-latest` control
  profile. Each dispatch uses a fresh 128-bit nonce, and run metadata is
  verified for event, workflow, branch, SHA, title, ID, and attempt where
  available before observation, cancellation, or evidence.
- Scoped `GH_TOKEN` to API readback/dispatch-control steps; candidate install,
  build, packaging, and evidence-writing steps do not inherit it. The candidate
  activates pnpm `10.33.0` before pnpm-aware setup-node caching or dependency
  installation.
- Added delayed-run cleanup and transient-list reconciliation. Unverified
  runs are never cancelled; unresolved cleanup remains explicit and
  fail-closed in controller evidence. The new input and workflow-contract
  helpers are included in the PR CI policy bundle.
- Validation on this Windows host: focused runner suite 14 tests passed;
  changed lint passed; changed TypeScript passed for 1,364 files; Node syntax,
  YAML parsing, extracted workflow Bash syntax, workflow contract, and
  `codex-diff-check` passed. The local actionlint binary timed out; the policy
  bundle suite remains blocked by its existing Windows `O_NOFOLLOW` limitation.
  No commit, push, PR, merge, deployment, runner activation, or settings
  mutation was performed.

## 2026-08-06 - PR 4 validated security corrections

- Replaced pre-step dynamic candidate selection with an Ubuntu authorization
  job. Direct human candidate dispatches remain on `ubuntu-latest` and fail
  before source checkout. Dynamic candidate labels are emitted only after
  `github-actions[bot]` actor, candidate run attempt 1, controller run ID and
  attempt 1, trusted workflow/path/SHA, and exact request binding all pass.
- Request IDs now contain a deterministic digest over every intended benchmark
  input, controller identity, repeat, and nonce. Replays and input mutations
  fail closed in the shared input contract and metadata verifier.
- Split source measurement from evidence verification. The measured job has no
  `GH_TOKEN` and no Actions API permission; it writes only an untrusted raw
  observation. A fresh immutable verifier checkout on `ubuntu-latest` reads
  run metadata, rebinds the observation, and writes hashed evidence.
- Removed the reconciliation shortcut that cleared a missing run after a
  successful list read. Any delayed run remains `reconciliation_pending`;
  incomplete cleanup makes `reconciliation_completed` false and causes the
  evidence writer to fail rather than report completion.
- Added adversarial coverage for direct-label scheduling, bot/attempt/controller
  binding, raw-observation forgery, and pending reconciliation. Focused suite:
  18 tests passed. No commit, push, PR, merge, deployment, runner activation,
  or settings mutation was performed.

## 2026-08-06 - PR 4 hosted dead-code correction

- Hosted Linux Knip rejected the input-contract helper because the consumer
  destructured an intermediate CommonJS namespace, leaving 31 exports invisible
  to Knip's usage graph. The consumer now destructures the helper directly and
  the one genuinely private actor constant is no longer exported.
- Closed two adjacent debts exposed by the now-authoritative Knip run: the
  compatibility result interface is module-private, and the pure Museum change
  classifier's test-only exports have the same explicit Knip disposition as
  the repository's other adversarial policy helpers.
- Exact follow-up validation passes full Knip, 36 focused tests, changed lint,
  changed TypeScript, workflow syntax/expression lint, Node syntax, and
  `codex-diff-check`. No runner or repository setting was changed.

## 2026-08-06 - PR 4 exact review hardening

- Raised the candidate workload ceiling to 35 minutes so the maximum
  30-minute completion observation retains five minutes for setup, evidence
  handoff, and cancellation; the workflow contract now derives and enforces
  that minimum headroom.
- Removed the runner-label fallback and re-verifies pnpm `10.33.0` immediately
  in the frozen-install step after the second setup-node/cache action.
- Both normalized-output bridges now admit only their closed key sets and
  reject values containing equals signs or line breaks before writing to
  `GITHUB_OUTPUT`.
- Reconciliation no longer runs under `set +e`. State updates are validated as
  JSON objects before atomic replacement, malformed state fails immediately,
  and non-success discovery is handled explicitly without suppressing update
  failures. The malformed unquoted jq fallback was removed.
- Focused runner tests, changed lint/typecheck, workflow syntax/expression lint,
  Node syntax, and the diff check pass after these corrections.

## 2026-08-06 - PR 4 security-rating correction

- Sonar identified workflow-level `actions: write` on the controller. The
  workflow and validation job now hold contents-read only; Actions write is
  granted solely to the dispatch/reconciliation job that calls the API.
- The accompanying Sonar observations were resolved by using `Object.hasOwn`,
  typed validation errors, and a negative splice index.
- CodeQL alert 292 was reviewed and dismissed as a false positive. Candidate
  source is an exact commit that immutable trusted tooling proves is a current
  main ancestor before checkout; the measured job has no secrets, no candidate
  token, `actions: none`, and no persisted checkout credentials, while a fresh
  Ubuntu verifier independently binds its evidence.
- Independent Bash review caught `event_name` missing from the new closed
  normalized-output allowlist. The field is now admitted explicitly and the
  workflow regression test binds that exact allowlist segment.
- The hosted Debt Ratchet exposed two generic `any` annotations in the YAML
  fixture. They were replaced with closed workflow-fixture test types;
  the metric returns to its 126 baseline. The full Jest diagnostic ratchet and
  Playwright typecheck now pass alongside the debt ratchet.

## 2026-08-05 — PR 5 local implementation: build cardinality

- Audited all 23 page-level `generateStaticParams` contributors and removed
  the six declaration-level contributors for active and historical Stream
  review functions, events, and errors. The page handlers, metadata, runtime
  reference resolution, immutable version selection, and explicit `notFound`
  behavior remain unchanged.
- The six reviewed contributors represented 5,612 active declaration params
  and 22,448 historical declaration params (four public historical versions),
  for a measured reduction of 28,060 expected build params. The expected
  cardinality moves from the recorded 31,716 build routes / 31,437 generated
  params to 3,656 build routes / 3,377 generated params. The 279-route
  difference is the framework's route overhead, not an unaccounted source
  contributor.
- Added `museum-build-cardinality-v1`, a deterministic source-contract and
  emitted-build-evidence check. It inventories every page contributor,
  derives counts from checked-in review fixtures and source contracts, rejects
  the six reviewed exports if they return, rejects unnoticed new contributors,
  and enforces a 5,000 prerendered-route budget from
  `.next/prerender-manifest.json`. It contains no timing assertion.
- Added exact route tests for representative active and historical declaration
  deep links. They prove the pages pass request-time params to the existing
  renderer and preserve canonical active/versioned hrefs; the underlying
  resolver tests preserve public-version selection and fail-closed behavior.
- Museum pages were not the bottleneck: their retained generated contribution
  is part of the 3,377-param remainder, while the six Stream declaration
  routes account for 28,060 of the 31,437 generated params.

### PR 5 local validation

- Source-only cardinality contract: passed; 23 baseline contributors, 17
  retained contributors, 28,060 removed params, 3,377 remaining params.
- Focused tests: 20 tests passed across the new cardinality and dynamic-route
  suites plus the related Stream reference-data and identity suites.
- Changed lint: passed.
- Changed TypeScript ratchet: passed for 1,358 changed TypeScript files.
- Formatting: passed.
- The protected policy-bundle suite was attempted and remains Windows-incompatible
  at its existing `fs.constants.O_NOFOLLOW` guard (9 tests fail before their
  assertions). This is the same platform limitation recorded for PR 1; the
  new PR 5 policy entries are covered by the hosted Linux policy run.
- A local production build was not claimed. The worktree's dependency
  junction is rejected by Turbopack; hosted CI remains authoritative for the
  build-evidence phase of `build:ci`.
- Independent adversarial review found that the emitted-build gate enforced
  only a broad ceiling. It now requires all six reviewed declaration patterns
  in Next's App Router manifest, excludes them from both prerender manifests,
  and holds concrete prerendering at or below 500 routes. Tests reject a
  501-route regression and any missing request-time declaration route.

## 2026-08-06 - PR 5 exact-head review correction

- The first emitted-build contract compared against a frozen 3,656-route
  result and mapped the four current public review versions to fixed narrative
  counts. The 6529 general review correctly identified that routine publication
  growth would have required a hand-edited exception.
- The source model is now derived from current checked-in reference manifests,
  each public version's editorial manifest, and the complete contributor
  inventory. Adding an essay, definition, source, or public review version
  updates that model through authoritative inputs. The historical
  31,716-to-3,656 estimate is retained as release evidence rather than used as a
  moving-content gate.
- The contract still fails closed on a missing or duplicate active version,
  malformed editorial manifests, an unmodeled `generateStaticParams`
  contributor, restoration of any reviewed high-cardinality export, a missing
  request-time declaration route, or more than 500 concretely prerendered
  routes.
- The test declaration now includes the returned evidence path, and coverage
  proves both acceptance of ordinary growth within the tight bound and rejection
  above it. No emergency build bypass was added; rollback remains the ordinary
  revert of this isolated PR.

## 2026-08-06 - PR 5 hosted artifact correction

- Hosted build run 31074990093 completed the optimized Next build in about five
  minutes, then proved that `.next/prerender-manifest.json` contains 241 concrete
  prerendered routes. The 3,656 figure is the source model for retained
  `generateStaticParams` results plus historical framework overhead; it is not
  the manifest's concrete-route cardinality and must not be compared to that
  artifact.
- The emitted contract now follows the artifact's actual semantics: it records
  the observed concrete count, rejects a count above 500, and requires all six
  removed declaration route families to remain request-time dynamic. Exact
  source contributor accounting remains a separate deterministic gate.

## 2026-08-06 - PR 5 hosted Knip correction

- Exact-head run 31075858896 reached the parallel quality lane and found two
  unused compatibility aliases introduced on the current base by PR #3630.
  Repository search confirmed that neither alias had a consumer. The aliases
  were removed from `helpers/Helpers.ts`; the canonical UTF-16 limit exports in
  `helpers/waves/drop-content-limits.ts` remain unchanged. This restores the
  protected Linux Knip contract without changing Stream or Museum behavior.

## 2026-08-06 - PR 5 Next artifact-semantics correction

- Exact-head run 31076424716 completed the optimized Next build and generated
  3,660 pages, with all six reviewed declaration families reported by Next as
  request-time (`ƒ`) routes. The verifier then failed because it had treated
  `prerender-manifest.dynamicRoutes` as the inventory of all dynamic App Router
  routes; that field contains dynamic prerender templates instead.
- The emitted contract now cross-checks Next's two applicable artifacts. Every
  reviewed family must exist in `server/app-paths-manifest.json` and must be
  absent from both concrete and dynamic entries in `prerender-manifest.json`.
  It still enforces the 500-concrete-route ceiling. Tests reject a missing app
  route, a route that re-enters prerendering, and a 501-route regression.

## 2026-08-06 - PR 5 source-drift gate correction

- Rebasing onto main `d27148d1dfd85ed8cdaa50239d59ac1e524afdc9`
  produced signed head `9d38cdbc6aad43b76a19f25f1966d5dc495983d9`.
  Exact-head App CI run 31084985044 passed: Museum 24m30s, quality
  18m58s, build 6m58s, critical shell 4m09s, and smoke 3m13s.
- Final review correctly found that the CLI reported source-cardinality drift
  without rejecting it. The Jest suite compared the values, but `build:ci`
  invokes the CLI and therefore did not inherit those assertions.
- The CLI now fails closed unless the checked-in source model independently
  resolves both the reviewed 28,060-param reduction and the 3,377-param
  remainder. Focused mutation tests reject drift in either value. No tolerance
  or bypass was added; an intentional source-model change must update the
  reviewed baseline in the same PR.
- Follow-up validation passed: 8 focused tests, live source-only CLI, changed
  lint, 1,373-file changed TypeScript ratchet, Knip, and whitespace.
