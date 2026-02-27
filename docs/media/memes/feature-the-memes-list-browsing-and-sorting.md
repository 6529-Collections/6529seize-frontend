# The Memes List Browsing and Sorting

## Overview

`/the-memes` is the primary list route for browsing Memes cards. It supports
sort changes, season filtering, grouped view by meme, and infinite-scroll card
loading.

## Location in the Site

- Route: `/the-memes`
- Typical entries:
  - App navigation (`The Memes`)
  - Header search result (`The Memes`)
  - Direct links to filtered/sorted list URLs

## Entry Points

- Open `/the-memes`.
- Open a query URL such as:
  - `/the-memes?sort=age&sort_dir=asc`
  - `/the-memes?sort=volume_7_days&sort_dir=desc`
  - `/the-memes?sort=tdh&sort_dir=desc&szn=12`

## User Journey

1. Open `/the-memes`.
2. The page resolves current URL query state:
   - `sort`
   - `sort_dir`
   - optional `szn`
3. The first card page loads.
4. Use controls to adjust browsing:
   - sort direction (`asc` / `desc`)
   - sort field (`Age`, `Edition Size`, `Meme`, `Collectors`, `TDH`,
     `Unique %`, `Unique % Exc. Museum`, `Floor Price`, `Market Cap`,
     `Highest Offer`, `Volume`)
   - season filter (`szn`)
5. Scroll down to load additional cards automatically.
6. Open a card from the list to route to `/the-memes/{id}`.

## Common Scenarios

- Explore newest-to-oldest cards:
  - `sort=age&sort_dir=desc`
- Browse only one season:
  - set season filter (`szn`) and keep any sort.
- Group by meme family:
  - set sort to `Meme` to group cards under meme headings.
- Rank by recent trading:
  - set `Volume`, then choose `24 Hours`, `7 Days`, `30 Days`, or `All Time`.

## Edge Cases

- Unsupported `sort` values fall back to `Age`.
- Unsupported `sort_dir` values fall back to ascending (`asc`).
- Invalid or non-positive `szn` values are ignored.
- Choosing a volume window while not already in `Volume` switches the active
  sort to `Volume`.
- Query state is rewritten to normalized URL values after control changes.
- Infinite scroll only continues while another API page is available.

## Failure and Recovery

- If the list appears stale or incomplete, refresh `/the-memes`.
- If a shared URL opens unexpected ordering, reapply controls from the page and
  use the rewritten URL.
- If a card route fails after click-through, open `/the-memes/{id}` directly or
  return to `/the-memes` and retry.

## Limitations / Notes

- The list is API-backed and can lag briefly after market or metadata changes.
- Loading additional cards depends on scroll position near the page bottom.
- Card-level ownership badges and details are documented in NFT/shared pages.

## Related Pages

- [Media Memes Index](README.md)
- [The Memes Card Tabs and Focus Links](feature-card-tabs-and-focus-links.md)
- [The Memes Mint Flow](feature-mint-flow.md)
- [NFT Balance Indicators](../nft/feature-balance-indicators.md)
- [Media Discovery and Actions Flow](../flow-media-discovery-and-actions.md)
- [Docs Home](../../README.md)
