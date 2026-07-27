# Active Context

## Current goal

Burn the scanner-visible production generic-argument `any` inventory from 23 to
zero, then burn the separate test inventory from 135 to zero. The parser-backed
scanner shipped in PR #3444; this active workstream now owns the cleanup slices
and keeps their baseline and per-file inventory current.

## Current state

- PR #3444 merged to `main` as
  `63fa7edafa699a509baae6a8344e92c66065e76e`.
- The scanner counts `AnyKeyword` occurrences inside generic type arguments
  without counting comments, prose, strings, identifiers, or generic parameter
  defaults.
- The checked-in baseline remains the authoritative machine-enforced floor.
- Cleanup branches must be refreshed from current `origin/main`; the former
  scanner branch is historical evidence, not the active execution branch.

## Constraints

- Keep production and test scopes separately visible and ratcheting.
- Land an honest temporary nonzero baseline before burn-down slices.
- Burn production to zero before declaring the test phase complete.
- Refresh every later slice from then-current `origin/main`; do not build a
  stale stacked chain.

## Evidence so far

- The starting `origin/main` `any_casts` baseline was zero despite the blind
  spot; this scanner slice refreshes it to the exact interim production count.
- Before this workstream, the scanner was already TypeScript-AST-aware for
  direct annotations and assertions but deliberately ignored generic type
  arguments. This scanner slice adds that generic-argument counting.
- Historical PR #3110 used a delimiter regex. Its own review identified a
  delimiter-consumption weakness for adjacent generic arguments, so that
  matcher will not be reused.

## Inventory

- Production: 23 occurrences across 11 files.
- Tests: 135 occurrences across 46 files.
- The complete per-file inventory is recorded in
  `ops/workstreams/generic-any-ratchet-2026-07/any-exceptions.md`.

## Open decisions

- Final PR slicing will follow the inventory's type-domain boundaries.

## Next actions

1. Publish and review the production cleanup slices from current `origin/main`.
2. Reduce the production baseline from 23 to zero without runtime behavior
   changes.
3. Publish the test cleanup slices and reduce `test_generic_any` from 135 to
   zero.
4. Keep `any-exceptions.md`, the baseline, and scanner detail output aligned
   after every slice.
