# NextGen Collection Slideshow

Parent: [NextGen Index](README.md)

## Overview

The NextGen collection slideshow is a carousel of collection tokens with
navigation controls and a direct path to the full art view.

## Location in the Site

- NextGen featured collection page: `/nextgen`
- NextGen collection overview/tab routes (slideshow shown only when
  `mint_count > 0`): `/nextgen/collection/{collection}`,
  `/nextgen/collection/{collection}/about`,
  `/nextgen/collection/{collection}/provenance`, and
  `/nextgen/collection/{collection}/top-trait-sets`
- Full collection art route linked from slideshow: `/nextgen/collection/{collection}/art`

## Entry Points

- Open the NextGen featured route `/nextgen`.
- Open a collection overview/tab route listed above.
- Use `View All` in the slideshow header to open:
  `/nextgen/collection/{collection}/art`.

## User Journey

1. Open a page containing the slideshow.
2. Scroll to the slideshow section.
3. Browse token cards with carousel navigation arrows.
4. Open a token card to jump to `/nextgen/token/{token}`.
5. Use the play/pause control (when present) to override autoplay behavior.
6. Select `View All` to move from carousel preview to the full collection art
   view.

## Common Scenarios

- Desktop shows up to 4 slides, medium screens show up to 2, and small screens
  show 1.
- The carousel auto-plays when the slideshow enters the viewport.
- On Capacitor clients, the control starts in a paused state until the user
  presses play.
- Additional tokens are loaded as users approach the end of the currently shown
  slides.

## Edge Cases

- The play/pause control only appears when more than one token is displayed.
- Collection pages only render this slideshow when the collection has minted
  tokens (`mint_count > 0`).
- The carousel starts at slide index 2 when enough tokens are available.
- The initial token order is randomized by the collection token endpoint.

## Failure and Recovery

- If token loading fails or returns no tokens, the section can appear empty
  without an inline error message.
- Scrolling the section out of view pauses autoplay; returning to view resumes
  autoplay unless manually paused.
- There is no explicit retry button inside the slideshow shell.
- Refreshing or reopening the route retries token loading.

## Limitations / Notes

- Token order is not user-sortable in the slideshow.
- The carousel does not provide a direct jump-to-index control.
- The view depends on JavaScript-enabled client rendering for interaction.

## Related Pages

- [NextGen Index](README.md)
- [NFT Activity Feed](../realtime/feature-nft-activity-feed.md)
- [Docs Home](../README.md)
