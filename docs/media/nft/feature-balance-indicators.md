# NFT Balance Indicators

## Overview

Some NFT media surfaces show signed-in users a balance indicator tied to their
connected profile. The indicator reflects whether the connected profile holds
the NFT (`SEIZED xN`) or does not (`UNSEIZED`). Surfaces that do not show
balance text can still show a badge-based ownership marker.

## Location in the Site

- The Memes list: `/the-memes`
- The Memes card page: `/the-memes/{id}` in `Live`, `Your Cards`, and
  `Collectors`
- Meme Lab list: `/meme-lab`
- Meme Lab collection pages: `/meme-lab/collection/{collection}`
- Meme Lab card page: `/meme-lab/{id}` in `Live` and `Your Cards`
- Home latest-drop stats: `/` (`Edition` row shows a compact balance chip with
  tooltip text)
- 6529 Gradient list and card pages: `/6529-gradient`, `/6529-gradient/{id}`
  (ownership badge marker only)

## Entry Points

- Connect a wallet/profile and open supported routes above.
- Open a direct card URL and switch tabs with `focus=...` query params.
- Browse list/grid pages where NFT cards are rendered.

## User Journey

1. User opens a supported page with NFT artwork.
2. On The Memes and Meme Lab image surfaces, signed-in users see `...` while
   balance data loads.
3. The image-surface indicator resolves to:
   - `SEIZED xN` when the connected profile holds one or more editions.
   - `UNSEIZED` when the connected profile holds none.
4. On home latest-drop stats, the compact chip stays hidden during loading,
   then appears with the numeric balance and tooltip text (`SEIZED xN` or
   `UNSEIZED`).
5. On Gradient list/detail pages, users who own the NFT see a certificate badge
   next to the owner address with tooltip text `You own this NFT`.
6. If the user is not signed in, balance indicators and ownership badges stay
   hidden.

## Common Scenarios

- Browsing `/the-memes` or `/meme-lab` while signed in shows per-card balance
  state under artwork.
- Opening `/the-memes/{id}` or `/meme-lab/{id}` in main trading/collector tabs
  shows balance state on the primary large artwork panel.
- On home latest drop, the balance appears as a small numeric chip in the
  `Edition` stat row beside the edition count, with tooltip text
  (`SEIZED xN` or `UNSEIZED`).
- On Gradient list/detail pages, owned NFTs show a certificate badge next to
  owner identity instead of a `SEIZED` / `UNSEIZED` text chip.

## Edge Cases

- If a connected session exists but profile consolidation data is missing, the
  image indicator can resolve to `UNSEIZED`, and home stats can show `0` with
  an `UNSEIZED` tooltip.
- Some media views intentionally disable this indicator:
  - `The Art` tabs in The Memes and Meme Lab
  - 6529 Gradient list/detail artwork
  - Rememe reference thumbnails
  - Manifold mint artwork panels
  - Home latest-drop artwork image itself (indicator is in stats instead)
- On meme list pages, signed-in users get extra card spacing so the indicator
  does not overlap surrounding content.

## Failure and Recovery

- If the balance fetch fails on image surfaces, the indicator shows `N/A`.
  Refreshing or reconnecting retries.
- On home latest-drop stats, the balance chip is hidden while loading and then
  appears once data resolves.
- Ownership badges on Gradient pages do not rely on balance-fetch responses.
- Signing out removes all balance indicators immediately.

## Limitations / Notes

- Indicator values are scoped to the currently connected profile
  consolidation key.
- Badge-based ownership markers are scoped to the connected profile wallet
  list and token owner match.
- These indicators are informational and do not by themselves grant transfer or
  claim actions.
- Different site areas can show different ownership affordances; for example,
  Gradient pages use separate ownership badges.

## Related Pages

- [Media Index](../README.md)
- [Latest Drop Stats Grid](../memes/feature-latest-drop-stats-grid.md)
- [The Memes Card Tabs and Focus Links](../memes/feature-card-tabs-and-focus-links.md)
- [NFT Media Source Fallbacks](feature-media-source-fallbacks.md)
- [Docs Home](../../README.md)
