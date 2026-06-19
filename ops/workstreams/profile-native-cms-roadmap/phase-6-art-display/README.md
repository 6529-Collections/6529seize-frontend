# Phase 6 Art Display Excellence

## Charter

Own the 2D art and NFT display lane for the profile-native CMS renderer while
staying compatible with the existing V1 package contract.

## Scope

- Art-first collection and gallery grids.
- NFT/card detail page composition.
- Focused lightbox inspection with keyboard, zoom, fullscreen, and metadata.
- Original media, derivative, poster, source, and package provenance clarity.
- Fixture-first validation for generated wallet gallery compatibility.

## Constraints

- Do not change the V1 protocol schema in this lane.
- Use existing block extension fields only when fixtures need extra authored
  display hints such as traits, collection context, or gallery mode.
- Keep primary inspection 2D and accessible.
- Keep provenance legible without competing with the art.

## Validation Bar

- Focused renderer tests for gallery, NFT detail, lightbox, and media fallback.
- `seize run lint:changed`
- `seize run typecheck:changed`
- `seize run react-doctor:diff`
- Browser or Playwright screenshot smoke if the local app can run.
