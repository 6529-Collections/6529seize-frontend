# NFT Media Source Fallbacks

## Overview

NFT artwork surfaces use ordered media-source fallbacks when an image or video
URL fails to load. This keeps cards and detail panels usable when a preferred
asset URL is unavailable.

## Location in the Site

- The Memes list: `/the-memes`
- The Memes card page: `/the-memes/{id}` (`Live`, `Your Cards`, `Collectors`,
  and `The Art`)
- Meme Lab list: `/meme-lab`
- Meme Lab collection page: `/meme-lab/collection/{collection}`
- Meme Lab card page: `/meme-lab/{id}` (`Live`, `Your Cards`, and `The Art`)
- 6529 Gradient list and card pages: `/6529-gradient`, `/6529-gradient/{id}`
- Home latest-drop artwork: `/`
- The Memes mint artwork panel: `/the-memes/mint`

## Entry Points

- Browse NFT list/grid pages where artwork appears on cards.
- Open a direct card route (`/the-memes/{id}`, `/meme-lab/{id}`,
  `/6529-gradient/{id}`).
- Open home latest-drop or The Memes mint pages.

## User Journey

1. A supported page renders NFT artwork using the preferred source URL.
2. If that source loads, media stays on screen and no fallback is needed.
3. If that source fails, the renderer switches to the next source
   automatically.
4. If a fallback source succeeds, media appears without needing a page-level
   refresh.
5. If every candidate source fails, the browser shows a failed media state.

## Common Scenarios

- List/card image surfaces (thumbnail mode) try sources in this order:
  `thumbnail -> scaled (if present) -> image -> metadata.image (if present)`.
- Large image surfaces that are not original-first try:
  `scaled (if present) -> image -> metadata.image (if present)`.
- Original image surfaces (for example, `The Art`) try:
  `image -> metadata.image (if present)`.
- Video surfaces try:
  `compressed_animation (if present) -> animation -> metadata.animation (if present)`.
- Grid/thumbnail-style image surfaces load lazily; larger detail-image surfaces
  load eagerly so hero artwork is ready sooner.

## Edge Cases

- The final metadata fallback is only available when metadata fields are present
  in the NFT payload.
- Video fallback applies only to video-rendered animation formats; non-video
  animation formats use separate renderers.
- Fallback behavior is local to each rendered media component; opening another
  page or tab starts a fresh attempt sequence for that view.

## Failure and Recovery

- If all fallback sources fail, images stay broken and videos remain
  unplayable on that rendered view.
- There is no per-media retry control on these card/detail renderers.
- Refreshing the page, reopening the route, or revisiting the tab retries the
  source order from the beginning.

## Limitations / Notes

- Source order is fixed and not user-configurable.
- Loading priority is route/surface driven and not user-configurable.
- Fallback logic swaps media URLs only; it does not guarantee successful decode
  for corrupted assets.
- If metadata fallback fields are empty or invalid, the renderer has no further
  source to try.

## Related Pages

- [Media Index](../README.md)
- [NFT Balance Indicators](feature-balance-indicators.md)
- [The Memes Card Tabs and Focus Links](../memes/feature-card-tabs-and-focus-links.md)
- [Now Minting Countdown](../memes/feature-now-minting-countdown.md)
- [Docs Home](../../README.md)
