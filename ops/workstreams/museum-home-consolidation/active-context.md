# Museum homepage consolidation

Status: merged, deployed to staging and production, and qualified by hosted and
retained browser evidence

## Release intent

Remove the repeated permanent-Collection preview from the Network Museum
homepage and present the Museum's work once, through its complete acquisition
record. The consolidated section must include the three completed acquisitions
and Keys and Gates as an in-progress acquisition program, with their distinct
statuses stated plainly.

## Exact base

- Frontend base: `2ed9d2e45cfdd0c31b01c07403848c6de220006a`
- Branch: `codex/museum-home-consolidation`
- Changed public route: `/museum/network`

## Product decisions

- Keep the current Vera Molnár hero.
- Remove the separate `In the Collection` work preview below the hero.
- Keep one acquisition section containing every current acquisition.
- Describe the permanent Collection and Keys and Gates status in ordinary
  museum language.
- Balance four acquisition cards in four columns at wide desktop, two columns
  at intermediate widths, and one column on mobile.
- Preserve direct paths to all works and the acquisition index.

## Required evidence before PR

- Exact production build.
- Full-page screenshots at 1440 x 1000, 820 x 1000, and 390 x 844.
- Geometry, overflow, media, and console checks.
- Independent museum/curatorial, visual/UX, and copy/editorial review of the
  exact screenshot hashes.
- Focused tests, changed lint and typecheck, React Doctor, and diff checks.

## Release path

PR and exact-head bot/CI review, merge, staging deployment and browser E2E,
then production deployment and live browser readback.

## Release outcome

- PR: `#3815`
- Exact qualified PR head: `f6337475f96393e1a545d354cebe962b8173ee21`
- Canonical merge/main: `06ec3e736ea5a8dc131656eef70045916ed5372c`
- Exact staging composition: `5f3c47ae2b789848d83e6b910f87fbd697f92708`
- Staging deploy: run `32676652457`, success
- Automatic staging E2E: run `32677194697`, success
- Production deploy: run `32678032156`, success
- Automatic Production E2E: run `32678816271`, success, including the isolated
  production-evidence verifier
- Live production version: three consecutive reads returned exact
  `06ec3e736ea5a8dc131656eef70045916ed5372c` with `stale: false`
- Live visual readback: one `Acquisitions` section, four acquisition cards, no
  superseded Collection preview, all nine homepage images decoded, no
  horizontal overflow, and no browser errors on desktop or 390 px mobile
