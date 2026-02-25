# The Memes Card Tabs and Focus Links

## Overview

The Memes card page supports tab-specific deep links through a `focus` query
parameter and keeps tab state synchronized in the URL while users browse a
card. The page also defers loading heavier tab content until those tabs are
opened.

## Location in the Site

- The Memes card detail route: `/the-memes/{id}`
- The Memes unresolved numeric-card fallback panel on the same route

## Entry Points

- Open a card from `/the-memes`.
- Open a direct card URL such as `/the-memes/123`.
- Open a direct tab deep link such as `/the-memes/123?focus=activity`.
- Switch tabs from the tab bar on the card page.

## User Journey

1. Open `/the-memes/{id}`.
2. If `focus` is missing or invalid, the page opens on `Live`.
3. If `focus` matches a supported tab, that tab opens directly.
4. When users switch tabs, the page updates the `focus` query value without a
   full-page jump.
5. `Live`, `Your Cards`, and `Collectors` content is available immediately.
6. `The Art`, `Activity`, and `Timeline` are loaded when first opened, then
   stay available for later tab switches in that session.
7. If the card ID resolves to an upcoming numeric card instead of a live card,
   the page shows the shared next-mint fallback panel for that numeric ID.

## Common Scenarios

- Share a direct `Activity` or `Timeline` link by copying the current URL with
  `focus=...`.
- Open a card from the list, inspect `Live`, then switch to `The Art` only
  when needed.
- Open a future numeric card URL and read the fallback next-mint details.

## Edge Cases

- Unknown `focus` values are ignored and the page falls back to `Live`.
- Non-integer `/the-memes/{id}` routes show the `MEME` not-found screen.
- When the page is in upcoming-card fallback mode, card tabs are not shown and
  `focus` is removed from the URL.
- Tab switches update the current URL entry, so browser Back does not step
  through each tab change.

## Failure and Recovery

- If card metadata resolves as unavailable for a numeric ID, users still get
  the fallback next-mint panel.
- If data requests fail transiently, refreshing the route retries card and tab
  data loading.
- If a deep link uses an unsupported tab value, users can recover by switching
  tabs from the visible tab bar.

## Limitations / Notes

- `focus` supports only the card's known tab keys.
- Deferred loading applies to `The Art`, `Activity`, and `Timeline`; first open
  can feel slower than later switches.
- The fallback next-mint panel is informational and does not expose the full
  calendar controls from `/meme-calendar`.

## Related Pages

- [Media Index](../README.md)
- [NFT Balance Indicators](../nft/feature-balance-indicators.md)
- [NFT Media Source Fallbacks](../nft/feature-media-source-fallbacks.md)
- [Memes Minting Calendar](feature-minting-calendar.md)
- [Docs Home](../../README.md)
