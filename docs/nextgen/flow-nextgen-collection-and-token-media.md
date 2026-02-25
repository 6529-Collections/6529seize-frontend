# NextGen Collection and Token Media Flow

## Overview

This flow covers browsing the featured NextGen slideshow, moving into a
collection art route, and opening a token route to use image/live/high-res
media controls.

## Location in the Site

- Featured NextGen route: `/nextgen`
- Collection slideshow routes: `/nextgen/collection/{collection}`,
  `/nextgen/collection/{collection}/about`,
  `/nextgen/collection/{collection}/provenance`, and
  `/nextgen/collection/{collection}/top-trait-sets`
- Collection art route: `/nextgen/collection/{collection}/art`
- Token routes: `/nextgen/token/{token}` and `/nextgen/token/{token}/{view}`

## Entry Points

- Open `/nextgen` from navigation or direct URL.
- Open a shared collection URL directly.
- Open a shared token URL directly.

## User Journey

1. Open `/nextgen` and browse the featured collection slideshow.
2. Use carousel arrows (and play/pause when shown) to preview tokens.
3. Open `View All` to move into `/nextgen/collection/{collection}/art`.
4. Use the collection art list to open a token route.
5. On the token route, review default `2K` media.
6. Switch to `8K`/`16K` high-res mode, wait for load completion, then zoom/pan.
7. Optionally switch to `Live`, open media in a new tab, download assets, or
   enter fullscreen.

## Common Scenarios

- Start from `/nextgen`, then use `View All` and open a token from the art list.
- Open a token URL directly and only use media controls (`2K`, high-res,
  `Live`) without returning to collection routes.
- Navigate across token subviews (`provenance`, `display-center`, `rarity`)
  while keeping the token media panel available at the top.

## Edge Cases

- Collection routes render the slideshow only when the collection has minted
  tokens.
- The slideshow play/pause control appears only when more than one token is
  available.
- `Live` mode keeps static image output when a token has no animation URL.

## Failure and Recovery

- If slideshow token loading fails, the slideshow section can stay empty and
  does not expose an inline retry button.
- If token image/high-res sources fail, fallback placeholders are used
  (`/pebbles-loading.jpeg` and `/fallback-image.jpeg`).
- If fullscreen is blocked by browser policy, users stay in normal mode and see
  a browser alert.
- Refreshing or reopening the route retries slideshow and token-media fetches.

## Limitations / Notes

- Slideshow order is randomized and cannot be user-sorted.
- On-screen token media mode choices are fixed (`2K`, high-res, `Live`).
- Token routes with unavailable token payloads can switch to an on-chain
  fallback panel instead of the token media renderer.

## Related Pages

- [NextGen Index](README.md)
- [NextGen Collection Slideshow](feature-collection-slideshow.md)
- [NextGen Token Media Rendering](feature-token-media-rendering.md)
- [NextGen Slideshow and Token Media Troubleshooting](troubleshooting-nextgen-slideshow-and-token-media.md)
