# Active Context

## Current goal

Finish latest-head review and CI iteration for scanner PR #3444. The scanner
uses the TypeScript AST to count `AnyKeyword` occurrences inside generic type
arguments without counting comments, prose, strings, or identifiers.

## Current branch

`codex/generic-any-scanner`, based on `origin/main` at
`d42c30336abe60fc76b6b4528ed8ca123e95f974`.

## Constraints

- Keep production and test scopes separately visible and ratcheting.
- Land an honest temporary nonzero baseline before burn-down slices.
- Burn production to zero before declaring the test phase complete.
- Refresh every later slice from then-current `origin/main`; do not build a
  stale stacked chain.

## Evidence so far

- The starting `origin/main` `any_casts` baseline was zero despite the blind
  spot; this scanner slice refreshes it to the exact interim production count.
- The current scanner is already TypeScript-AST-aware for direct annotations
  and assertions but deliberately ignores generic type arguments.
- Historical PR #3110 used a delimiter regex. Its own review identified a
  delimiter-consumption weakness for adjacent generic arguments, so that
  matcher will not be reused.

## Inventory

- Production: 23 occurrences across 11 files.
- Tests: 135 occurrences across 46 files.
- The complete per-file inventory is recorded in
  `ops/workstreams/repo-health-2026-07/any-exceptions.md`.

## Open decisions

- Final PR slicing will follow the inventory's type-domain boundaries.

## Next actions

1. Create and push a signed review-follow-up commit.
2. Track every latest-head review bot and required check to terminal state.
3. Obtain current-head maintainer approval and merge.
