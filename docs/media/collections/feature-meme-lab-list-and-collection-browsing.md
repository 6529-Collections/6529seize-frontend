# Meme Lab List and Collection Browsing

## Overview

Meme Lab collection browsing starts at `/meme-lab` and continues to
`/meme-lab/collection/{collection}`.
Both routes show the same card grid style and sort controls, then link to
`/meme-lab/{id}` for card detail.

## Location in the Site

- Meme Lab list route: `/meme-lab`
- Meme Lab collection route: `/meme-lab/collection/{collection}`
- Meme Lab card route: `/meme-lab/{id}`

## Entry Points

- Open `/meme-lab` directly.
- Open `Meme Lab` from sidebar or header search.
- On `/meme-lab`, switch to `Collections` sort and select `view` for a
  collection.
- Open a shared collection URL directly.

## User Journey

1. Open `/meme-lab` and wait for `Fetching ...` to finish.
2. Use sort direction arrows and sort controls:
   `Age`, `Edition Size`, `Collectors`, `Artists`, `Collections`,
   `Unique %`, `Unique % Exc. Museum`, `Floor Price`, `Market Cap`,
   `Highest Offer`, and `Volume`.
3. In `Volume`, choose a window (`24 Hours`, `7 Days`, `30 Days`,
   `All Time`).
4. In `Artists` or `Collections` mode, read grouped sections.
5. In `Collections` mode, select `view` to open
   `/meme-lab/collection/{collection}`.
6. On collection routes, keep browsing with the same controls except
   `Artists` and `Collections` group modes.
7. Open any card for `/meme-lab/{id}`.

## Common Scenarios

- Open `/meme-lab?sort=volume&sort_dir=desc` for a volume-first list.
- Group by `Collections`, open one collection route, then open a card.
- On smaller screens (`< xl`), use the collections dropdown switcher.

## Edge Cases

- On `/meme-lab`, unsupported `sort` or `sort_dir` query values fall back to
  default ordering.
- On `/meme-lab/collection/{collection}`, initial sort direction reads
  `sortDir` (camelCase), not `sort_dir`; shared links with `sort_dir` can load
  with default direction.
- Collection routes do not show a dedicated loading row while initial fetch is
  in progress.
- Empty or unknown collections render the empty-state panel.
- If `/meme-lab` fetch fails, the route can end in an empty-state panel with no
  inline error banner.
- On collection routes, changing the volume window while already in `Volume`
  mode can update labels without immediately re-sorting rows.

## Failure and Recovery

- Refresh the current route to retry data fetch.
- If a collection URL is empty, reopen it from `/meme-lab` `Collections` `view`
  links.
- If sort order looks stale, change sort mode or sort direction once to force a
  fresh pass.

## Limitations / Notes

- Sorting and grouping are client-side and are not saved per user profile.
- Collection routes and list routes do not preserve the same sort-direction
  query key format.
- Collection cards reuse shared NFT rendering (including balance chips when
  signed in).
- Per-card tabs and card actions are documented in other media pages.

## Related Pages

- [Media Collections Index](README.md)
- [NFT Balance Indicators](../nft/feature-balance-indicators.md)
- [NFT Media Source Fallbacks](../nft/feature-media-source-fallbacks.md)
- [NFT Transfer](../nft/feature-transfer.md)
- [Media Discovery and Actions Flow](../flow-media-discovery-and-actions.md)
