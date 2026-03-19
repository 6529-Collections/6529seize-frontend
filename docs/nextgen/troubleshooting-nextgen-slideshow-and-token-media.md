# NextGen Slideshow and Token Media Troubleshooting

## When to Use This Page

Use this page when:

- slideshow cards are missing, static, or not advancing;
- token media mode (`2K`, `8K`/`16K`, `Live`) does not behave as expected;
- high-res zoom controls do not appear;
- fullscreen fails;
- token media route falls back to loading/not-found/indexing states;
- Display Center rows stay on spinner or show `Coming Soon`.

## Location in the Site

- Featured slideshow: `/nextgen`
- Collection slideshow routes:
  `/nextgen/collection/{collection}` and
  `/nextgen/collection/{collection}/{overview|about|provenance|top-trait-sets}`
- Collection art route: `/nextgen/collection/{collection}/art`
- Token media routes:
  `/nextgen/token/{token}` and
  `/nextgen/token/{token}/{provenance|display-center|rarity}`

## Quick Checks (Do in Order)

1. Confirm the route and whether the issue is slideshow, token media, or both.
2. If issue is collection slideshow, confirm the collection has minted tokens (`mint_count > 0`).
3. Scroll slideshow into view; autoplay only runs while visible.
4. Retry the exact action once (`2K`, high-res, `Live`, fullscreen, Display Center row).
5. Refresh the route to re-run fetch and media load.
6. Open the same URL in a new tab if state still looks stale.

## Scenario Guide

- Collection slideshow is missing:
  collection `mint_count = 0`, so slideshow is intentionally hidden.
- Slideshow container renders but has no cards:
  slideshow token fetch returned empty/failed; refresh route to retry.
- Slideshow does not autoplay:
  autoplay pauses when out of viewport and can also be manually paused.
- `Live` mode still shows a static image:
  token has no `animation_url`, so static output is expected.
- High-res (`8K`/`16K`) stays on loading overlay:
  large asset load + render delay; zoom controls appear only after load completes.
- Fullscreen click shows browser alert:
  fullscreen request failed in current browser/device context.
- Token subview opens `About`:
  unsupported token subview slug falls back to `About`.
- Token route shows `Fetching Token`, `Token Not Found`, or `Token Indexing, check back later`:
  token payload is missing, pending, or still indexing; on-chain fallback is expected.
- Display Center rows stay on spinner or show `Coming Soon`:
  that token/resolution output is not currently available.

## Recovery Limits and Expected Fallbacks

- Slideshow has no inline retry control.
- Token media controls have no per-source retry control.
- Standard token image failures fall back to `/pebbles-loading.jpeg`.
- High-res image failures fall back to `/fallback-image.jpeg`.
- Fullscreen failures keep normal layout and show a browser alert.
- If high-res appears stuck, switch to `2K`, then retry high-res.
- If one Display Center row is unavailable, use another available resolution and retry later.

## Not a Bug (Current Behavior)

- Play/pause control is hidden when slideshow has one token.
- Capacitor clients start slideshow autoplay paused until user interaction.
- Token art mode set is fixed to `2K`, high-res (`8K`/`16K`), and `Live`.

## Related Pages

- [NextGen Index](README.md)
- [NextGen Collection and Token Media Flow](flow-nextgen-collection-and-token-media.md)
- [NextGen Collection Slideshow](feature-collection-slideshow.md)
- [NextGen Token Media Rendering](feature-token-media-rendering.md)
- [NextGen Routes, Mint, and Admin Troubleshooting](troubleshooting-nextgen-routes-mint-and-admin.md)
