# NFT Balance Indicators

## Overview

- Signed-in profiles get ownership indicators on selected media routes.
- Image/media surfaces use a text indicator.
- Gradient owner rows use a certificate badge (`You own this NFT`) instead.
- Home `Latest Drop` uses a compact numeric chip in the `Edition` row.

## Location in the Site

- `/the-memes` list cards
- `/the-memes/{id}` main artwork in `Live`, `Your Cards`, and `Collectors`
- `/meme-lab` list cards
- `/meme-lab/collection/{collection}` list cards
- `/meme-lab/{id}` main artwork in `Live` and `Your Cards`
- `/` home `Latest Drop` stats grid (`Edition` row chip + tooltip)
- `/6529-gradient` and `/6529-gradient/{id}` owner rows (badge only)

## Entry Points

- Sign in with a profile.
- Open any supported route above.
- On card routes, switch tabs with `focus=...` query params.

## Indicator States

### Text indicator (`SEIZED xN` / `UNSEIZED` / `N/A`)

- Hidden when no signed-in profile exists.
- Shows `...` while the balance request is loading.
- Shows `SEIZED xN` when balance is greater than `0`.
- Shows `UNSEIZED` when balance is `0`.
- Shows `N/A` when the balance request fails.

### Home `Edition` chip (`/`)

- Chip stays hidden while balance is loading.
- When loaded, chip shows numeric balance and tooltip text:
  - `SEIZED xN` for positive balance
  - `UNSEIZED` for `0`

### Gradient owner badge (`You own this NFT`)

- Shows next to owner identity when token owner matches one wallet in the
  signed-in profile.
- Hidden for signed-out users or non-owner wallets.

## Common Scenarios

- Signed-in user browsing `/the-memes` or `/meme-lab`: each card shows a text
  ownership state under artwork.
- Signed-in user on `/the-memes/{id}` or `/meme-lab/{id}` supported tabs: main
  artwork shows a text ownership state.
- Signed-in user on `/`: `Edition` row can show a compact balance chip.
- Signed-in owner on Gradient list/detail: owner row shows `You own this NFT`
  badge instead of text indicator.

## Edge Cases

- Signed-in profile without a consolidation key: text surfaces resolve to
  `UNSEIZED`; home chip resolves to `0` + `UNSEIZED` tooltip.
- Home can switch from `Latest Drop` to `Next Drop` when current mint is ended
  and next-drop data exists; no `Edition` balance chip in `Next Drop`.
- Indicator is intentionally disabled on:
  - `The Art` tabs on The Memes and Meme Lab card pages
  - 6529 Gradient artwork panels
  - ReMemes reference thumbnails
  - `/the-memes/mint` artwork panel
  - home latest-drop artwork media (chip is in stats row, not on artwork)
- Signed-in list cards use extra spacing to avoid text indicator overlap.

## Failure and Recovery

- Text indicator request failure: surface shows `N/A`. Reloading the page or
  reconnecting profile context retries.
- Home balance request failure: chip still shows `0` with `UNSEIZED` tooltip
  (no separate error label).
- Gradient ownership badge is independent of balance request success/failure.
- Signing out hides text indicators and ownership badges.

## Limitations / Notes

- Text indicator values are scoped to the connected profile consolidation key.
- Badge visibility is scoped to connected profile wallets matching token owner.
- These indicators are informational only; they do not grant transfer, mint, or
  claim rights.

## Related Pages

- [Media Index](../README.md)
- [Latest Drop Stats Grid](../memes/feature-latest-drop-stats-grid.md)
- [6529 Gradient List Sorting and Loading](../rendering/feature-6529-gradient-list-sorting-and-loading.md)
- [NFT Media Source Fallbacks](feature-media-source-fallbacks.md)
- [Docs Home](../../README.md)
