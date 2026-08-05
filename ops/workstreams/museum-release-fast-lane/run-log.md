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
