# NextGen Token Media Rendering

Parent: [NextGen Index](README.md)

## Overview

NextGen token routes provide image/live/high-res media modes with download,
fullscreen, and token-detail tabs.

## Location in the Site

- NextGen featured slideshow cards: `/nextgen`
- NextGen collection slideshow cards: `/nextgen/collection/{collection}/{view}`
- NextGen collection art list cards: `/nextgen/collection/{collection}/art`
- Token default route: `/nextgen/token/{token}`
- Token subview routes:
  `/nextgen/token/{token}/{provenance|display-center|rarity}`

## Entry Points

- Open a token from slideshow or collection-art cards.
- Open a token route directly.
- Use token-route subview URLs directly.

## User Journey

1. Open a token route and load default image mode (`2K`).
2. Switch to high-res mode (`8K` on mobile, `16K` on desktop).
3. Wait for high-res loading overlay to complete, then zoom/pan.
4. Switch to `Live` mode for token animation URL output when available.
5. Use media actions: download, open in new tab, light/dark viewer, fullscreen.
6. Switch token detail tabs (`About`, `Provenance`, `Display Center`,
   `Rarity`) while keeping token media at the top.

## Common Scenarios

- Slideshow/list cards use thumbnail media first, then token image media.
- `Display Center` exposes direct downloads (`1K`, `2K`, `4K`, `8K`, `16K`) and
  custom render options.
- Download menus show unavailable resolutions as `Coming Soon`.
- Token owners see transfer controls in the `About` view.

## Edge Cases

- `Live` mode stays on static output when animation URL is missing.
- Zoom controls appear only after the first high-res render cycle completes.
- Token API payloads marked pending/unavailable fall back to on-chain token
  panel output.

## Failure and Recovery

- Standard token image failures fall back to `/pebbles-loading.jpeg`.
- High-res image failures fall back to `/fallback-image.jpeg`.
- Fullscreen failures keep normal layout and show a browser alert.
- Refreshing or reopening the token route retries token and media fetches.

## Limitations / Notes

- On-screen media modes are fixed to `2K`, high-res, and `Live`.
- There is no dedicated per-source retry button in token media controls.

## Related Pages

- [NextGen Collection Routes and Art Browser](feature-nextgen-collection-routes-and-art-browser.md)
- [NextGen Collection Slideshow](feature-collection-slideshow.md)
- [NextGen Collection and Token Media Flow](flow-nextgen-collection-and-token-media.md)
- [NextGen Slideshow and Token Media Troubleshooting](troubleshooting-nextgen-slideshow-and-token-media.md)
