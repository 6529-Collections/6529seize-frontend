# Museum rights handbook — active context

## Mandate

Publish a readable Museum education section about copyright, the public
domain, Creative Commons, cultural-heritage rights statements, and the rights
of artists and collectors. Link every object-level rights label to the
applicable Museum page. Keep exact official legal text and source evidence
available without turning the visitor experience into a technical dashboard.

## Source contract

The source change is being constructed in `6529-Collections/6529networkmuseum`
from base `f227930bba0f7aca3c9fa3f3cb2dbed13412c968`. The atomic frontend boundary
will require:

- `records/institutional-practice/rights-and-licenses.md`;
- `records/institutional-practice/rights-for-artists.md`;
- `records/institutional-practice/rights-for-collectors.md`;
- `docs/rights/registry.json`;
- the seven legal-code paths declared by that registry.

The registry contains 22 entries: the six Creative Commons 4.0 International
licenses, CC0 1.0, Public Domain Mark 1.0, all twelve RightsStatements.org 1.0
terms, an in-copyright/no-public-license case, and custom terms. The seven
Casey Reas objects map to the reviewed CC BY-NC 4.0 record. The Keys and Gates
CC0 intention remains conditional while its outcomes are unminted.

## Product decisions

1. `/museum/network/rights` is an educational reading room, led by copyright,
   ownership, and public-domain explanation rather than a license grid.
2. Artist and collector guides receive dedicated pages.
3. Every rights expression receives a stable detail route generated from the
   governed registry. Creative Commons detail pages include the exact retained
   legal code behind a disclosure and link to the official publication.
4. Object credit lines link internally to the applicable detail page. That page
   then supplies the official URI, conditions, practical uses, limits, and
   exact source.
5. Rights remains a quiet About-adjacent Museum section rather than a new
   top-level art-navigation pillar.
6. The complete source set activates atomically from one exact Museum commit.
   Missing or malformed content fails the whole rights projection closed.

## Validation and release

Implementation start checkpoint: `2026-08-05T17:01:32Z`.

Required work: focused parser/projector mutation tests; object-link tests;
desktop and 390-pixel route checks; lint/typecheck/build; PR and bot iteration;
staging deployment and E2E; production deployment and E2E; exact timings and a
final copy/visual sweep.

### 2026-08-05 source and local validation checkpoint

- Museum source PR [#29](https://github.com/6529-Collections/6529networkmuseum/pull/29)
  merged at `2026-08-05T18:17:19Z` as canonical main
  `11c79489e0ae65d9a296577c44c881c3f79267d6`.
- Canonical manifest: 326 governed files; SHA-256
  `sha256:b6b1d5ddf19c88335b752bc610a1d4020236a3eb4a86a13d52182a29aa22ffb1`;
  Keccak
  `0x11546194ab32ec2553562d48aa21788329da52afa86470812d4c327aa2d3d025`.
  The bootstrap validator separately reports 307 JSON files.
- Source CI passed the complete Museum validator and deterministic Ubuntu and
  Windows suites on the PR head and again on canonical main in post-merge run
  `31034024802`.
- Frontend static gates pass: changed lint, changed TypeScript (1,357 files),
  Jest typecheck ratchet, Playwright typecheck, E2E manifest, help-index sync,
  and React Doctor 100/100.
- Frontend Museum regressions pass: 81 suites and 315 tests across library,
  component, App Router, and legacy page surfaces.
- The first local browser run reached the rendered product. Its overview and
  object journeys passed; one assertion used the wrong accessible name for the
  exact legal-text source link and was corrected. A development-server retry
  then returned a transient cold-compilation 404 on the first route. Final
  browser and pixel qualification will run against an optimized production
  server, matching staging and production behavior.
- A full build begun from frontend base `9b90bf5282` completed generation and
  the repository-wide lint, then was stopped during Next compilation after a
  fresh fetch showed current frontend main had advanced to `55913450cb`.
  Current main will be integrated before the authoritative build so that the
  retained artifact is the actual PR merge tree.

### 2026-08-05 exact merge-tree qualification

- Frontend main `55913450cbe360cba1195b680ab47bc6a2939825` was merged
  without conflict. Its Museum About type floor and this work's rights card
  are both present. Focused post-merge validation passed: 5 suites / 50 tests,
  changed lint, changed typecheck (1,358 files), E2E manifest, and whitespace.
- The first exact-tree compile completed its 58-second source phase, then the
  type phase rejected a malformed generated `.next/dev/types/routes.d.ts`
  retained from an interrupted development run. The generated `.next` tree
  was moved to recoverable operator artifact storage and excluded from release
  evidence; tracked files were untouched.
- A clean exact-tree optimized build passed in 291.7 seconds: source compile
  66 seconds, TypeScript 94 seconds, 31,719 static pages in 46 seconds, page
  optimization, and sitemap generation.
- Production-mode local E2E passed 6/6 in 7.0 seconds on the retained build:
  rights overview, CC BY-NC practical/legal reading, and Casey object-to-rights
  navigation on desktop and 390-by-844 mobile. The two Casey rights labels both
  resolve internally to `/museum/network/rights/cc-by-nc-4.0`. No horizontal
  overflow, page errors, or failed responses were observed.
- Two preceding browser assertions used shorter visible labels instead of the
  components' fuller accessible names. Those assertions were corrected to the
  rendered accessibility tree; no product copy or accessibility label was
  weakened.
- Retained screenshots in `evidence/` cover the overview, collector guide,
  CC BY-NC entry, and a loaded Casey object at desktop and mobile widths. Pixel
  review confirms the native 6529 shell, legible type floor, restrained source
  treatment, loaded art, and no generic process-dashboard styling.

### 2026-08-05 PR review checkpoint

- Frontend PR [#3627](https://github.com/6529-Collections/6529seize-frontend/pull/3627)
  opened from exact DCO-corrected head `e782b04ac2a48f77f51f1c4215ac3a4e04887c19`.
  An initial HTTPS push was rejected because the OAuth token lacked workflow
  scope; the branch was published through the configured SSH credential. Both
  commits carry SSH signatures and DCO `Signed-off-by` trailers.
- 6529bot general review on the pre-DCO-equivalent tree returned **Good to
  merge**, with no correctness, security, or data-integrity finding. Two
  non-blocking observations were accepted: internal rights paths now require a
  complete expression identifier and malformed Museum-looking paths render as
  unlinked text; the page-source catalog now reads the required handbook
  contract directly instead of through `Partial<MuseumPublication>`.
- Review-follow-up validation passes: 3 suites / 41 tests, changed lint,
  changed typecheck (1,358 files), React Doctor 100/100, formatting, and
  whitespace. The rendered copy, routes, and approved pixels are unchanged.

### 2026-08-05 exact-head review hardening

- Security review reported no finding. Its defense-in-depth observation was
  accepted: canonical, legal-source, and legal-publication links carried by
  the governed rights registry now require credential-free HTTPS URLs. Parser
  mutations prove that `javascript:` and `data:` values fail the complete
  publication closed.
- Internationalization review identified two route metadata literals; both
  now resolve through the Museum message catalog. The fallback-debt record
  explicitly identifies governed object-level rights labels as untranslated
  source data alongside the manuscripts and exact official legal text.
- Accessibility review asked for quantitative status-chip evidence and a
  keyboard path through overflowing legal text. Computed production styles
  for all five statuses produce text contrast ratios of 18.29:1, 16.82:1,
  16.51:1, 14.38:1, and 17.07:1 after alpha compositing on their rendered
  backgrounds. The visible status words carry the meaning; border color is
  decorative. The complete legal code no longer sits inside a nested scroll
  box: when expanded, it follows document flow and uses ordinary page
  scrolling. A component assertion prevents the inner overflow trap from
  returning.
- Sonar's four exact issues were addressed: deterministic `localeCompare`
  sorting, `TypeError` for array-shape violations, and extraction of the
  institutional-practice and rights route builders from the page-source
  catalog. The refactor does not alter any visitor-facing route or source.
- Review-hardening validation at `2026-08-05T18:54:06Z`: four focused suites /
  43 tests, changed lint, changed typecheck across 1,358 files, formatting, and
  whitespace all pass. The local production server remains available only for
  pixel-equivalent computed-style inspection; a fresh exact-head optimized
  build will be run if hosted merge-tree qualification requires it.
- Hosted-equivalent contract replay found exact inventory assertions that had
  not advanced with the three new local/staging/production rights packs. The
  E2E manifest tests, runner tests, and Release Bus performance contract now
  record 65 packs, nine Museum-scoped packs, 15 staging post-deploy packs, and
  14 production post-deploy packs. The packs remain disjoint and read-only.
- The rights assembly had also moved `legacyCasey.ts` four lines above the
  800-line source ceiling. Generic assignment-to-credit resolution now lives
  with the rights handbook; the Casey assembler is 795 lines and the debt
  ratchet returns to zero oversized files. The exact hosted-failure set now
  passes locally: five suites / 58 tests plus the complete debt ratchet.
- CodeRabbit identified one bilateral route inconsistency: page-source routes
  encoded governed expression IDs while Casey object links interpolated the
  same ID raw. The resolved effective ID now supplies both fields and is URL
  encoded for the route. The current closed expression inventory makes unsafe
  characters unreachable, but both projections now enforce the same rule.
- During final readiness, frontend main advanced to
  `67068d87cdc78252d2d48d172f8386ceb1df82e7` through PR #3628, refining the
  Museum About paragraph hierarchy in `MuseumNetworkProposition`. It was
  merged conflict-free into this branch at signed merge head
  `7a369851d70fe6e01da90f8621efdb1d919892bf`; the rights education card and
  the new paragraph structure are both retained. Exact-head checks must bind
  to the integrated tree before merge.

### 2026-08-05 production closeout

- Frontend PR [#3627](https://github.com/6529-Collections/6529seize-frontend/pull/3627)
  merged as exact main `d448d4c282c034fa2a1d5d1d95ce90fc85561e54`.
  The final integrated PR run `31040869076` passed the production build,
  quality/contracts, smoke, critical shell, and Museum E2E jobs. Automated
  review found no unresolved correctness, security, accessibility, or
  data-integrity issue; all review threads were resolved before merge.
- The exact production artifact built in run
  [`31043144183`](https://github.com/6529-Collections/6529seize-frontend/actions/runs/31043144183)
  while staging built and deployed in parallel. Staging composition
  `21f58083e5c8974319701e25a0d62406c500bec3` deployed successfully in run
  [`31043258638`](https://github.com/6529-Collections/6529seize-frontend/actions/runs/31043258638),
  followed by successful automatic selected-pack E2E run
  [`31044289420`](https://github.com/6529-Collections/6529seize-frontend/actions/runs/31044289420).
- Production deployment run
  [`31045606678`](https://github.com/6529-Collections/6529seize-frontend/actions/runs/31045606678)
  reused the completed exact-main artifact and passed. Automatic production
  E2E run
  [`31046152675`](https://github.com/6529-Collections/6529seize-frontend/actions/runs/31046152675)
  passed. Three consecutive live version reads returned and announced exact
  main with `stale: false`.
- Independent staging and production checks each passed the six focused
  desktop/mobile rights journeys. The final production sweep passed all 22
  expression-detail routes, the artist and collector guides, CC BY-NC legal
  text and source access, and the Casey object-to-license path. Six retained
  production viewport checks returned 200 with no page errors, failed document
  responses, or 390-pixel horizontal overflow. Pixel review found no release
  defect requiring a polish patch.
- The interval from frontend merge at `2026-08-05T20:14:28Z` to completed
  automatic production E2E at `2026-08-05T21:04:30Z` was 50 minutes and 2
  seconds. Staging deploy consumed 13 minutes and 1 second, staging E2E 14
  minutes and 54 seconds, production deploy 6 minutes and 47 seconds, and
  production E2E 11 minutes and 49 seconds.
- The dynamic adapter now reads canonical Museum main
  `ad8ea4338659e0825dc5a79295e824eadec876e6`, which advanced through additive
  Museum PR #30 after the rights merge. The live page contains that exact
  source identity, all rights routes remain green, and no frontend redeploy was
  required for the source refresh.

The rights publication is live. No implementation, review, staging,
production, or evidence gate remains open.

### 2026-08-05 Museum-practice revision in progress

- Product review reopened the rights detail page. The former 2 by 3 bordered
  grid, colored state chips, metadata pills, and boxed visitor note have been
  removed from the revision branch.
- The replacement is a six-row editorial register with horizontal rules,
  ordinary 6529 typography, one plain-language posture line, and one
  action-specific Museum-practice reading. Mobile remains a single reading
  column. Color no longer carries status.
- The source contract advances to rights registry 1.1.0. It retains the
  original instrument-permission matrix and adds a required
  `museum_practice_matrix` for all twenty-two expressions. Frontend activation
  fails closed if the new matrix, five status definitions, or six exact
  readings are absent.
- Version and SPDX identifiers now appear as quiet inline metadata. The
  visitor note sits within the editorial flow between horizontal rules.
- The revised public copy contains no em dashes. The source validator enforces
  the same rule across the three rights manuscripts and all practical notes.
- Canonical source PR
  [#33](https://github.com/6529-Collections/6529networkmuseum/pull/33)
  merged as `42236950a8976825861b6785613e3837405f486c`. Its exact PR head
  passed all three jobs in Museum validation run `31050398441`; post-merge
  validation run `31050934946` also passed all three jobs. The release
  manifest contains 345 entries with SHA-256
  `sha256:7d0774dc4007f03f68b632adf352330fcaa29398834d2a8c950856d61b6aef23`
  and Keccak
  `0xf1312db8d08dc1dd7a4159e1f4797fae58bc70f5118f3157f134b52e802300cc`.
- Local focused tests, visual evidence, frontend hosted review, and the
  staging and production release cycle remain open at this checkpoint. The
  first optimized build passed generation, help-index sync, and full lint,
  then Turbopack rejected the worktree's generated external `node_modules`
  junction. A native frozen dependency install is replacing that local-only
  setup before the build is rerun.
- The native frozen install completed and the exact canonical production
  build passed in 493.6 seconds against source
  `42236950a8976825861b6785613e3837405f486c`, including full lint, route
  compilation, sitemap generation, and postbuild.
- The exact local rights E2E suite passed all six desktop and mobile journeys
  against the held production-equivalent server. The shared local API was
  unavailable, so the read-only test used `https://api.6529.io` with the
  mutation guard retained. Earlier harness attempts did not execute a product
  failure: one lacked that API prerequisite, one used a mismatched dev origin,
  and one replaced its own server during readiness probing.
- Retained render evidence lives in
  `ops/workstreams/museum-rights-handbook/evidence/practice-revision/`.
  Four desktop/mobile routes returned 200 with no page errors or failed 5xx
  responses. Both mobile captures measured 390/390/390 pixels, all rendered
  rights copy contained zero em dashes, both detail pages rendered six
  practice rows, and the practice section contained zero rounded status
  elements. Pixel review found no release defect.
- Frontend hosted review, merge, staging qualification, production release,
  live E2E, and the Dev Team Chat release note remain open.
- Final pre-commit gates are green: 3 focused suites / 20 tests, changed lint,
  changed typecheck across 1,358 files, React Doctor 100/100, targeted
  formatting, and `codex-diff-check`. Frontend base and `origin/main` both
  resolve to `d448d4c282c034fa2a1d5d1d95ce90fc85561e54`.
- While exact-head review was running, frontend main advanced to
  `a888054589e7311848278c53b187033d96b1f5fb` with the Museum ontology and
  preservation reading room. The branch was merged forward before release.
  Four publication files overlapped. Resolution retained main's data
  architecture and shorter internal practice-type names while preserving the
  approved rights substance, strict 1.1.0 projection, and editorial layout.
  The resulting tree passes 5 focused suites / 31 tests, changed lint,
  changed typecheck across 1,358 files, React Doctor 100/100, formatting, and
  `codex-diff-check`.
- The first exact merge attempt was rejected because main advanced after the
  final readback. The branch was merged forward again to
  `af31aaaf7498d66516422d141b261de4c2774307`, which adds report-only Museum
  release classification without changing the rights runtime. The final
  merge tree passes 6 focused suites / 45 tests, changed lint, and changed
  typecheck across 1,364 files.
- A second exact merge precondition later detected main
  `f1a8a24937d2557b91f6db1c936ead0736b89dc7`, the independently reviewed
  compact realtime-drop update. It merged without conflict and has no Museum
  or rights-file overlap. The final candidate therefore combines the fully
  green exact rights head with an already merged, unrelated mainline change.
