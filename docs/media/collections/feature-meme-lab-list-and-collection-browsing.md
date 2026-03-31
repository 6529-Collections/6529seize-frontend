# Meme Lab List and Collection Browsing

## Overview

- `/meme-lab` is the main Meme Lab browse route.
- `/meme-lab/collection/{collection}` shows one collection.
- Both routes open card tiles at `/meme-lab/{id}`.
- Only `/meme-lab` shows grouped `Artists` and `Collections` modes.
- Only `/meme-lab` shows `LFG: Start the Show!`.

## Location in the Site

- Main list: `/meme-lab`
- Collection list: `/meme-lab/collection/{collection}`
- Card handoff: `/meme-lab/{id}` (documented in
  [Meme Lab Card Route Tabs and Navigation](feature-meme-lab-card-route-tabs-and-navigation.md))

## Entry Points

- Open `/meme-lab` from sidebar `Collections > Meme Lab`.
- Search `Meme Lab` in header search, then open the page result.
- Open `/meme-lab` directly.
- On `/meme-lab`, switch to `Collections`, then select `view` for a collection.
- Open `/meme-lab/collection/{collection}` directly.
- On mobile and tablet (`< xl`), use the collections dropdown on `/meme-lab`.

## User Journey

### Main List Route `/meme-lab`

1. Open `/meme-lab`.
2. Wait for `Fetching ...` to finish.
3. Optional: select `LFG: Start the Show!` to open the slideshow.
4. Set sort direction with the up/down arrows.
5. Pick a sort mode: `Age`, `Edition Size`, `Collectors`, `Artists`,
   `Collections`, `Unique %`, `Unique % Exc. Museum`, `Floor Price`,
   `Market Cap`, `Highest Offer`, or `Volume`.
6. In `Volume`, pick `24 Hours`, `7 Days`, `30 Days`, or `All Time`.
7. If `Volume` is not active, picking a volume window also switches sort to
   `Volume`.
8. In grouped `Collections`, select `view` to open
   `/meme-lab/collection/{collection}`.
9. Open any card tile to go to `/meme-lab/{id}`.

### Collection Route `/meme-lab/collection/{collection}`

1. Open the route directly or from a `view` link on `/meme-lab`.
2. Use the same sort controls, except `Artists` and `Collections`.
3. Use collection website links (when shown) to open external pages.
4. Open any card tile to go to `/meme-lab/{id}`.

## URL and Query Behavior

- `/meme-lab` reads `sort` and `sort_dir`, then rewrites both after sort
  changes.
- `/meme-lab/collection/{collection}` reads `sort` and `sortDir` on first load,
  then writes `sort_dir`.
- On collection routes, a URL with `sort_dir` but no `sortDir` reloads to the
  default ascending direction.
- Unsupported `sort` or direction values fall back to `Age` plus ascending
  direction.
- On collection routes, forcing `sort=artists` or `sort=collections` in the URL
  keeps those query values even though those buttons are hidden and grouping is
  not shown.
- Sort changes use in-place URL replacement and keep only sort keys in the
  query string.

## Loading, Empty, and Error States

- `/meme-lab` shows a `Fetching ...` row during initial load.
- If `/meme-lab` fetch calls fail, the route falls back to `Nothing here yet`
  with no inline error banner.
- `/meme-lab/collection/{collection}` does not show a dedicated loading row.
- Empty or unknown collections show `Nothing here yet`.
- If collection fetch calls fail, the route can stay on header and sort controls
  with no cards and no inline error panel.

## Edge Cases

- Changing volume window on collection routes while already in `Volume` can
  update the label without immediately re-sorting cards.
- Grouped `Artists` and `Collections` views change group order with sort
  direction, but card order inside each group stays by token ID.
- On collection routes, forcing hidden `artists` or `collections` sort values
  does not open grouped sections.
- Manually malformed collection slugs can resolve to an empty-state collection
  route.

## Recovery

- Refresh the current route to retry data fetch.
- If a collection route is empty, reopen it from `/meme-lab` grouped
  `Collections` `view` links.
- If sort output looks stale, change sort mode or sort direction once to force
  a fresh sort pass.
- If a shared collection URL keeps resetting direction after reload, reapply
  direction with the arrow controls.

## Limitations / Notes

- Sorting and grouping are client-side and are not saved per user profile.
- Volume window choice is not stored in the URL.
- List and collection routes do not share one sort-direction query key on first
  read (`sort_dir` vs `sortDir`).
- Sort updates use in-place URL replacement, so browser Back does not step
  through each sort change.
- Card tiles reuse shared NFT rendering, including wallet balance chips when
  signed in.
- Card-level tabs and navigation are documented in
  [Meme Lab Card Route Tabs and Navigation](feature-meme-lab-card-route-tabs-and-navigation.md).
- Card-level action details are documented in media NFT pages.

## Related Pages

- [Media Collections Index](README.md)
- [Meme Lab Card Route Tabs and Navigation](feature-meme-lab-card-route-tabs-and-navigation.md)
- [NFT Balance Indicators](../nft/feature-balance-indicators.md)
- [NFT Media Source Fallbacks](../nft/feature-media-source-fallbacks.md)
- [NFT Transfer](../nft/feature-transfer.md)
- [Media Discovery and Actions Flow](../flow-media-discovery-and-actions.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
