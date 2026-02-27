# NextGen Token Media Rendering

Parent: [NextGen Index](README.md)

## Overview

- `/nextgen/token/{token}` shows token media and opens `About` by default.
- Token media modes are `2K`, high-res (`8K` mobile, `16K` desktop), and `Live`.
- Token detail views are `About`, `Provenance`, `Display Center`, and `Rarity`.
- If indexed token data is missing or pending, the route falls back to the
  on-chain token panel.

## Location in the Site

- Default token route: `/nextgen/token/{token}` (`About`)
- Token subviews:
  `/nextgen/token/{token}/{provenance|display-center|rarity}`
- Common token-entry surfaces:
  `/nextgen`, `/nextgen/collection/{collection}/{view}`,
  `/nextgen/collection/{collection}/art`

## Entry Points

- Open a token card from a NextGen slideshow.
- Open a token card from collection `The Art`.
- Open `/nextgen/token/{token}` directly.
- Open a token subview URL directly.

## User Journey

1. Open `/nextgen/token/{token}`.
2. Review token art in `2K` mode.
3. Switch to high-res or `Live` when needed.
4. In high-res mode, wait for the loading overlay, then zoom/drag.
5. Use media actions: light viewer, dark viewer, `Download`, `Open in new tab`,
   and `Fullscreen`.
6. Switch token views (`About`, `Provenance`, `Display Center`, `Rarity`).
7. If your connected wallet owns the token, use transfer controls in `About`.
8. Use previous/next token arrows when enabled.

## Route Behavior

- `About` is the default token view.
- Valid token subview slugs are `provenance`, `display-center`, and `rarity`.
- Unsupported token subview segments resolve to `About`.
- If indexed token data is unavailable or pending, the route renders the
  on-chain token panel instead of full token-media layout.

## Common Scenarios

- Slideshow and art cards open `/nextgen/token/{token}`.
- `Live` shows iframe output only when `animation_url` exists. Otherwise, users
  stay on static image output.
- The top media toolbar `Download` menu lists `1K`, `2K`, `4K`, `8K`, and `16K`.
- `Display Center` includes rendered downloads (`1K`, `2K`, `4K`, `8K`, `16K`),
  thumbnail-use variants (`Thumbnail`, `0.5K`), and custom render launch
  options (`Animated|Static`, `Final|OG`, optional custom height).
- Download items verify source availability. Missing outputs show `Coming Soon`.
- On-chain fallback can progress from `Fetching Token` to `Token Not Found`, or
  show token metadata with `Token Indexing, check back later`.

## Edge Cases

- High-res zoom controls stay hidden until high-res image loading completes.
- Pressing `Escape` or clicking closes light/dark viewer modes.
- First/last token positions disable previous/next arrow navigation.
- Switching away from high-res hides zoom controls until high-res is loaded
  again.

## Failure and Recovery

- Standard image failures fall back to `/pebbles-loading.jpeg`.
- High-res failures fall back to `/fallback-image.jpeg`.
- Fullscreen failures stay in normal layout and show a browser alert.
- If a resolution shows `Coming Soon`, pick another resolution.
- There is no dedicated retry button for token-media fetches. Refresh or reopen
  the route to retry.

## Limitations / Notes

- On-screen media modes are fixed to `2K`, high-res, and `Live`.
- `Live` iframe rendering depends on `animation_url` availability.
- Resolution availability is fixed by generated assets and can remain
  `Coming Soon` for some tokens/resolutions.

## Related Pages

- [NextGen Index](README.md)
- [NextGen Collection Routes and Art Browser](feature-nextgen-collection-routes-and-art-browser.md)
- [NextGen Collection Slideshow](feature-collection-slideshow.md)
- [NextGen Collection and Token Media Flow](flow-nextgen-collection-and-token-media.md)
- [NextGen Slideshow and Token Media Troubleshooting](troubleshooting-nextgen-slideshow-and-token-media.md)
- [Docs Home](../README.md)
