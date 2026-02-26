# Meme Lab List and Collection Browsing

## Overview

Meme Lab browsing starts at `/meme-lab` and supports sortable list views,
grouping by artists/collections, and collection-specific pages at
`/meme-lab/collection/{collection}`.

## Location in the Site

- Meme Lab list route: `/meme-lab`
- Meme Lab collection route: `/meme-lab/collection/{collection}`
- Meme Lab card detail route: `/meme-lab/{id}`

## Entry Points

- Open `/meme-lab` directly.
- Open `Meme Lab` from sidebar/search.
- On `/meme-lab`, switch to `Collections` sort and choose a collection `view`
  link.
- Open a shared collection URL (`/meme-lab/collection/{collection}`).

## User Journey

1. Open `/meme-lab`.
2. The page loads collection metadata and card data, then renders the card
   grid.
3. Use sort controls (`Age`, `Edition Size`, `Collectors`, `Artists`,
   `Collections`, `Unique %`, `Unique % Exc. Museum`, `Floor Price`,
   `Market Cap`, `Highest Offer`, `Volume`) and direction arrows to reorder
   results.
4. Use the volume dropdown to switch between supported volume windows.
5. In `Artists` or `Collections` sort modes, cards are grouped under section
   headers.
6. In `Collections` mode, select `view` to open
   `/meme-lab/collection/{collection}`.
7. On collection pages, browse only cards in that collection with the same sort
   controls (except `Artists`/`Collections` grouping).
8. Open a card to continue on `/meme-lab/{id}`.

## Common Scenarios

- Open `/meme-lab?sort=volume&sort_dir=desc` to browse by volume-focused
  ordering.
- Group by `Collections`, open a specific collection page, then open a card.
- Use mobile collection dropdown controls (shown below `xl`) to switch between
  collection families.

## Edge Cases

- Unsupported `/meme-lab` `sort` or `sort_dir` values fall back to default
  ordering.
- On collection pages, empty or unknown collections render an empty-state panel.
- Collection pages do not show a dedicated loading skeleton while initial data
  is resolving.
- If data fetch fails, the page can render with no cards and no inline error
  banner.

## Failure and Recovery

- Refresh the route to retry card/meta fetches.
- If a collection URL shows no cards, verify the collection slug or return to
  `/meme-lab` and reopen from `Collections` view links.
- If sorted results look wrong, switch sort mode once to force a fresh sort
  pass.

## Limitations / Notes

- Sorting and grouping are route-local UI controls, not server-side saved
  preferences.
- Collection pages use the same card renderer as the main list, including
  balance chips for signed-in users.
- This page covers list/collection browse behavior; per-card tabs and actions
  remain documented in other media pages.

## Related Pages

- [Media Collections Index](README.md)
- [NFT Balance Indicators](../nft/feature-balance-indicators.md)
- [NFT Media Source Fallbacks](../nft/feature-media-source-fallbacks.md)
- [NFT Transfer](../nft/feature-transfer.md)
- [Media Discovery and Actions Flow](../flow-media-discovery-and-actions.md)
