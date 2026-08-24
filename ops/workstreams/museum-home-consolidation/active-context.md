# Museum homepage consolidation

Status: exact production build, deterministic captures, and three-lane visual
acceptance complete; ready for PR and release

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
