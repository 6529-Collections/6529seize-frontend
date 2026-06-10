# NextGen Collection Slideshow

Parent: [NextGen Index](README.md)

## Overview

The slideshow previews random tokens from one collection. It appears on
featured and minted collection routes, links each card to its token route, and
includes a `View All` link to the collection art browser.

## Location in the Site

- Featured route with slideshow section: `/nextgen`
- Collection overview/tab routes with slideshow (when minted):
  `/nextgen/collection/{collection}` and `/nextgen/collection/{collection}/{view}`
- Token route opened from slideshow cards: `/nextgen/token/{token}`
- Collection art route opened from `View All`:
  `/nextgen/collection/{collection}/art`

## Entry Points

- Open `/nextgen`.
- Open a collection overview/tab route.
- Use `View All` in the slideshow header.

## User Journey

1. Open a route that includes the slideshow.
2. Wait for cards to load into the carousel.
3. Browse cards with arrows or pagination dots.
4. Open any card to continue to `/nextgen/token/{token}`.
5. Use `View All` to continue to `/nextgen/collection/{collection}/art`.

## Common Scenarios

- Slides per view: 4 on wide screens (`>1200px`), 2 on medium screens
  (`>500px`), and 1 on small screens.
- The carousel starts near the third position (initial index `2`).
- Autoplay runs only while the slideshow is in view and stops after it leaves
  view.
- Capacitor clients start with autoplay paused until the user presses play.
- As users near the end, more cards are revealed and more token pages are
  fetched.

## Edge Cases

- Collection overview/tab routes hide the slideshow when `mint_count = 0`.
- Featured `/nextgen` can still show the slideshow section when cards do not
  load.
- Play/pause is hidden when only one card is available.
- Card order is randomized by the token API and can change after refresh.

## Failure and Recovery

- If token loading fails, the slideshow can appear empty with no inline error
  text.
- There is no in-page retry button for slideshow fetch failures.
- Refreshing or reopening the route retries loading.
- Returning the slideshow to viewport resumes autoplay unless manually paused.

## Limitations / Notes

- Users cannot sort or pin slideshow order.
- Slide controls and autoplay require JavaScript-enabled client rendering.
- `View All` always opens the current collection `art` route.

## Related Pages

- [NextGen Index](README.md)
- [NextGen Collection Routes and Art Browser](feature-nextgen-collection-routes-and-art-browser.md)
- [NextGen Slideshow and Token Media Troubleshooting](troubleshooting-nextgen-slideshow-and-token-media.md)
- [Docs Home](../README.md)
