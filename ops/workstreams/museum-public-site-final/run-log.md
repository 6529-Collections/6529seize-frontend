# Run log

## 2026-08-14T11:29:00Z

- User authorized complete autonomous PR, review, staging, production, and E2E
  release and requested aggressive Luna fan-out.
- Estimated a three-hour minimum with a four-hour external-latency ceiling.

## 2026-08-14T11:31:00Z

- Fetched current frontend main
  `bfb7f04643f02e9ff8204d56eda660ef71add71b` and created clean integration
  branch `codex/museum-public-site-final`.
- Dispatched four Luna xhigh worktrees with disjoint runtime and test scopes.
- Dispatched read-only integration and release-path subagents.

## 2026-08-14T11:36:00Z

- Read-only integration audit proved the three earlier Luna commits are already
  integrated or superseded by current main. Abandoned cherry-pick replay without
  changing the tree.
- Confirmed production runtime
  `962e6882648d0b3cb3c28820c553a99f16c8c17d` is behind the current-main Museum
  visual merge.
- Began the captain-owned compact source and contribution treatment and removed
  the redundant Museum-specific footer.

## 2026-08-14T13:05:00Z

- Integrated the four parallel lanes on current main: Home, Collection and
  Acquisitions; Acquisition Programs and About; Research; deterministic release
  acceptance.
- Corrected the root box defect: directional Tailwind borders paired with
  `border-solid` were producing implicit side borders. Explicit zero-width
  counterparts now protect 18 Museum surfaces, and browser geometry acceptance
  checks long rails, nested framed surfaces, narrow editorial columns, copy
  floors, and overflow.
- Collection now presents all seven Casey and five Magnum works as permanent
  holdings, with native image proportions and reviewed derivatives. Keys and
  Gates remains a selected, unminted acquisition in progress and is excluded
  from permanent holdings.
- Research now uses reviewed presentation media when retained work media is not
  published. The Magnum study therefore presents a Magnum photograph through
  its 1280 px derivative instead of a Casey image or the 16.9 MB source.
- Local qualification passed: 14 focused suites / 72 assertions; changed-file
  lint; changed-file typecheck across 1,715 files; diff hygiene; deterministic
  browser acceptance for Collection, Acquisitions, and Research; desktop route
  sweep with no horizontal overflow or broken visible images.

## 2026-08-14T13:00:00Z

- Hosted App PR CI run `31802132247` stopped at the Museum surface registry
  before browser execution. The registry identified one exact omission: the new
  Research media aspect-ratio helper was absent from the component inventory.
- Added the helper to the `museum.research` surface. Exact local registry replay
  now passes with 65 components, 57 routes, 22 surfaces, no unmapped files, and
  no unresolved imports.
- Disposed the first advisory bot review on substance. Moved the remaining
  Research labels into the Museum message catalog, made image readiness checks
  concurrent within the release timeout, and made an unclassified acquisition
  program fail closed instead of silently disappearing. The Collection program
  media path is already non-null and type-safe through
  `MuseumReviewedProgramMediaMatch`; no runtime change was required there.
- Follow-up validation passed: focused Programs and Research suites, four
  assertions; changed-file lint; and changed-file typecheck across 1,715 files.
