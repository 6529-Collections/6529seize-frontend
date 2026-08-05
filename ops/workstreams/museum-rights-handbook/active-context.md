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
