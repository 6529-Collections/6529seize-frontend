# NextGen Token Media Rendering

Parent: [NextGen Index](README.md)

## Overview

NextGen token media uses a shared renderer across slideshow cards, collection-art
lists, and token detail art. Users can view static image output, attempt live
render output, and switch to large-resolution downloads with zoom controls.

## Location in the Site

- NextGen featured slideshow cards: `/nextgen`
- NextGen collection slideshow cards: `/nextgen/collection/{collection}`
- NextGen collection art list cards: `/nextgen/collection/{collection}/art`
- NextGen token art panel: `/nextgen/token/{token}`

## Entry Points

- Open NextGen featured or collection pages and select a token card.
- Open the collection art route directly, then select a token card.
- Open a token route directly using `/nextgen/token/{token}`.

## User Journey

1. A NextGen token surface renders token media inside a bounded frame.
2. Card/list views show token previews and link to the token route.
3. On `/nextgen/token/{token}`, users can switch between `2K`, high-res
   (`8K` on mobile, `16K` on desktop), and `Live` view.
4. In high-res mode, users can zoom with controls and pan while zoomed in.
5. Users can open the currently selected source in a new tab, download assets,
   and enter fullscreen.

## Common Scenarios

- Preview surfaces use thumbnail media when available, then token image media.
- Token `2K` mode uses the token image source and scales to the available frame
  without fixed-card dimensions.
- Token high-res mode shows a loading overlay before exposing zoom controls.
- Fullscreen mode expands the art container while keeping the mode controls.

## Edge Cases

- If a token has no animation URL, selecting `Live` keeps the static-image view.
- Zoom controls appear only after the high-res image finishes its first render.
- Resetting zoom returns scale to the default centered position.
- Exiting high-res mode clears zoom controls until high-res is loaded again.

## Failure and Recovery

- If standard token image media fails to load, the view swaps to a placeholder
  image (`/pebbles-loading.jpeg`).
- If high-res media fails to load, the renderer falls back to
  `/fallback-image.jpeg`.
- If fullscreen is blocked by browser policy, users stay in normal mode and see
  a browser alert.
- Slow high-res downloads keep a blocking loading overlay visible until the
  renderer marks the asset ready.

## Limitations / Notes

- Resolution choices are fixed to `2K`, high-res (`8K`/`16K`), and `Live`.
- Live rendering depends on token animation media and browser capability.
- There is no per-source retry button inside the art panel; recovery is by
  mode switch, route reload, or reopening the token.

## Related Pages

- [NextGen Index](README.md)
- [NextGen Collection Slideshow](feature-collection-slideshow.md)
- [NFT Media Source Fallbacks](../media/feature-nft-media-source-fallbacks.md)
- [Docs Home](../README.md)
