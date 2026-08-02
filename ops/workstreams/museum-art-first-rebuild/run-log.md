# Run log

## 2026-08-02 — lane creation and audit

- Fetched `6529-Collections/6529seize-frontend` and verified
  `origin/main` at `2d310e05b886263e868eae3e06073ad20fe760df`.
- Created a fresh linked worktree and branch
  `codex/museum-art-first-rebuild` from that exact ref before tracked edits.
- Confirmed runtime repository boundary with the owning task.
- Installed frozen dependencies through the repository wrapper.
- Attempted `seize-local-dev bootstrap`; it reported no available assigned port
  in 3101–3199. No shared service or other worktree was modified.
- Audited production Museum home, gift, object, and program pages at desktop and
  mobile sizes using the in-app browser and raw CDP screenshots.
- Confirmed current presentation is registry-first and contains no artwork on
  the audited pages.
- Confirmed mobile Museum navigation horizontally overflows: 649 px document
  scroll width in a 390 px viewport.
- Audited current source adapter, normalization, presentation, routes, tests,
  CSP/image configuration, and i18n/help touchpoints.
- Read canonical Museum Casey records, public documents, visual-observation and
  rights sources; confirmed upstream still/generator URL evidence and explicit
  non-retention limitation.
- Added the ten-gate audit, implementation plan, source boundary, validation
  matrix, and resume memory to this workstream.
- Sent exact worktree/base and first implementation boundary to the owning
  Museum task.
- Received and adopted the native 6529 visual-fidelity requirement as an
  absolute acceptance gate; started a bounded parallel audit for the exact
  token/component reuse matrix.

## 2026-08-02 — rescue implementation and local acceptance

- Implemented `lib/museum/publication/`: exact moving-ref resolution, immutable
  commit reads, manifest allowlisting, SHA-256 verification, closed security
  checks, typed public entities/media, strict Casey assembly, atomic activation,
  in-flight deduplication, and bounded current/stale/unavailable caching.
- Canonical live readback resolved Museum `main` to
  `390200112363970686cf180863cec9a111b9b8e7`, accepted the 199-entry release
  boundary, and atomically assembled seven artworks, five projects, one gift,
  one artist, and fifteen public documents.
- Replaced the visitor hierarchy with an art-led home, accessioned-holdings
  collection, Casey artist/project/gift/object routes, onsite dossier, and
  technical evidence only after interpretation. Legacy collection/object/
  accession URLs remain compatible.
- Added a still-first viewer. Live work is opt-in, uses exactly one
  `sandbox="allow-scripts"` iframe to the governed Art Blocks generator, times
  out after 12 seconds, and provides a return-to-still failure state. Still and
  live media are labeled upstream/not retained; no IIIF claim is made.
- Fixed the governed display credit so CC BY-NC 4.0 appears once per credit
  context as a canonical `rel=license` link. Embedded public documents suppress
  only their redundant opening H1 while preserving governed body and metadata.
- Owning product review passed the native 6529 visual language, desktop and true
  390x844 routes, all seven source-resolution stills, gift status/donor,
  complete onsite essay/dossier, artist/project pages, object stewardship/
  evidence, unique live toggle, sandboxed generator, and zero overflow.
- Retained calibrated desktop/mobile evidence under `evidence/release-*`. Use
  the independently pixel-verified files
  `release-verified-object-01-desktop.png`,
  `release-verified-gift-mobile-ua.png`, and
  `release-verified-artist-mobile-fresh-v2.png` for the three compositor-
  sensitive views. Full-content captures are stitched from exact-width CDP
  tiles because raw `captureBeyondViewport` repeats fixed layers in this Browser
  build.
- Local validation: `format:uncommitted`, `lint:changed`, and `typecheck:ci`
  passed; 6 focused suites / 19 tests passed; 11 existing Museum suites / 80
  tests passed independently (99 Museum-relevant tests total). Coverage includes
  traversal/security, exact manifest fetch, assembler completeness, cache/
  deduplication/stale failure, overlay mismatch closure, rights, one sandboxed
  iframe, and deterministic live timeout fallback.

## Release-control preflight

- Release Bus status reported ALL running; STAGING OFF/changeable after failed
  control-plane train `d4f98824-ca9a-461c-8dfb-51088c654f15` (“Legacy artifact
  preparation does not prove an immutable portable artifact”); PRODUCTION
  OFF/changeable with an explicit owner-approved temporary serialized manual
  fallback for both lanes.
- The failed train is terminal `FAILED/CONTROL_PLANE`; its recovery message says
  staging automation is independently paused and to use the documented manual
  fallback. Scheduler/staging/production locks were unowned and all recent
  trains were terminal. Emergency fast-OFF is not the selected path.
- Preflight refs were `origin/main=2d310e05…` and
  `origin/1a-staging=e8a3ff17…`; staging did not contain current main. After this
  PR merges, re-fetch, merge current main into current `1a-staging` without
  force, freeze that composition SHA, and record its embedded main SHA. If main
  moves after qualification, repeat per policy.

## PR #3550 review and CI

- Opened ready PR #3550 at exact head `f1dc31167f5b`.
- Initial 6529bot security review reported no findings.
- General, WCAG, and i18n lanes requested one focused robustness follow-up:
  shared dossier anchors, ID-based artwork selection, malformed-route guards,
  immediate live-frame failure, one-H1/static-live-region cleanup, and message
  catalog coverage.
- App PR CI failed only on newly unused exports/types reported by Knip.
- Sonar localized its gate to two explicit deterministic-sort bugs and
  duplication in `lib/museum/casey.ts` and
  `lib/museum/publication/manifest.ts`; the follow-up is limited to those
  reported blocks and associated high-confidence findings.
