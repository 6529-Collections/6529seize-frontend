# NextGen Slideshow and Token Media Troubleshooting

## Overview

Use this page when the NextGen slideshow looks empty/stuck, token media modes
do not behave as expected, or high-res/fullscreen actions fail.

## Location in the Site

- Featured slideshow: `/nextgen`
- Collection slideshow surfaces: `/nextgen/collection/{collection}`,
  `/nextgen/collection/{collection}/about`,
  `/nextgen/collection/{collection}/provenance`, and
  `/nextgen/collection/{collection}/top-trait-sets`
- Collection art route: `/nextgen/collection/{collection}/art`
- Token media routes: `/nextgen/token/{token}` and
  `/nextgen/token/{token}/{view}`

## Entry Points

- Slideshow appears empty or does not advance.
- `Live` mode does not show animated output.
- High-res mode appears stuck on loading overlay.
- Fullscreen action does not enter fullscreen.

## User Journey

1. Confirm the current route and whether the issue is slideshow or token media.
2. For collection-route slideshow issues, confirm the collection has minted
   tokens.
3. Retry the specific mode/action (`2K`, high-res, `Live`, fullscreen) once.
4. Refresh the current route to re-run data fetch and media load.
5. If needed, reopen the same route in a new tab/session to isolate stale page
   state.

## Common Scenarios

- Slideshow on collection route is missing:
  collection has `mint_count = 0`, so slideshow is intentionally not rendered.
- Slideshow is visible but contains no cards:
  token fetch returned empty/failed; refresh route to retry.
- `Live` mode still shows image output:
  token has no animation URL, so static output is expected.
- High-res mode keeps loading overlay:
  wait for the high-res source to finish before zoom controls appear.
- Fullscreen click shows an error alert:
  browser/device policy blocked fullscreen request.

## Edge Cases

- Play/pause control is hidden when slideshow has one token only.
- Capacitor clients start slideshow autoplay in a paused state until user
  interaction.
- Token routes with unavailable or pending token payloads show an on-chain panel
  instead of token media controls.

## Failure and Recovery

- Slideshow has no inline retry button; recovery is route refresh or reopen.
- Standard token image failures fall back to `/pebbles-loading.jpeg`.
- High-res failures fall back to `/fallback-image.jpeg`.
- Fullscreen failures stay in normal layout and surface a browser alert.

## Limitations / Notes

- Slideshow sorting and ordering are not user-configurable.
- Token media source selection and fallback order are fixed.
- There is no dedicated per-source retry button inside token media controls.

## Related Pages

- [NextGen Index](README.md)
- [NextGen Collection and Token Media Flow](flow-nextgen-collection-and-token-media.md)
- [NextGen Collection Slideshow](feature-collection-slideshow.md)
- [NextGen Token Media Rendering](feature-token-media-rendering.md)
