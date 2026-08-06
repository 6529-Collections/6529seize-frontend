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
