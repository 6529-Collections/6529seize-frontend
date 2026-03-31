# 6529 Gradient List Sorting and Loading

## Overview

- `/6529-gradient` shows the full 6529 Gradient collection as cards.
- Sorting is URL-backed with `sort` and `sort_dir`.
- The route rewrites sort values to lowercase and keeps only those two query
  keys.
- The grid appears only after the full collection fetch finishes.

## Location in the Site

- Collection list route: `/6529-gradient`
- Gradient detail handoff route: `/6529-gradient/{id}`
- Sidebar collections entry: `6529 Gradient`
- Collections dropdown entry: `Gradient` (mobile/tablet layout)
- Header search entry: `6529 Gradient`

## Entry Points

- Open `/6529-gradient` directly.
- Open `6529 Gradient` from the sidebar collections menu.
- Use header search and choose `6529 Gradient`.
- Open `Gradient` from the collections dropdown on mobile/tablet.
- Open gradient token links from notifications, latest activity rows, or wave
  drop NFT references to land on `/6529-gradient/{id}`.

## User Journey

1. Open `/6529-gradient` (with or without `sort` and `sort_dir`).
2. The page header shows `6529 Gradient`, `LFG: Start the Show!`, and sort
   controls.
3. Query state resolves to defaults when needed: `sort=id`, `sort_dir=asc`.
4. The route rewrites query state to `sort` and `sort_dir` only.
5. While data is loading, the page shows `Fetching` with animated dots.
6. After loading finishes, cards render with token name, owner row, `TDH`, and
   rank.
7. Signed-in owners can see `You own this NFT` on cards they own.
8. Use `ID` or `TDH` plus sort-direction arrows to reorder.
9. Open a card to continue to `/6529-gradient/{id}`.

## Query Rules

- `sort` supports `id` and `tdh`.
- `sort_dir` supports `asc` and `desc`.
- Input matching is case-insensitive.
- Unsupported values fall back to `id` and `asc`.
- Query keys outside `sort` and `sort_dir` are removed.

## States and Edge Cases

- `TDH` ordering is intentionally inverted versus ID ordering:
  - `asc` shows higher TDH first.
  - `desc` shows lower TDH first.
- While requests are in flight, users see `Fetching` with animated dots.
- If the fetch returns no items, the grid renders with no dedicated empty-state
  message.
- If the request fails, the grid is also empty and no inline error banner is
  shown.
- Sort controls stay visible even when the list is empty.
- Refreshing `/6529-gradient` retries the request.

## Limitations / Notes

- Query rewrite keeps only `sort` and `sort_dir`.
- The list waits for the full collection fetch and has no `Load more` or
  pagination controls.
- Browsing works signed out; `You own this NFT` appears only when a signed-in
  profile wallet matches the card owner.
- Sort controls are click/tap targets and do not expose dedicated keyboard
  button semantics.

## Related Pages

- [Media Rendering Index](README.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
- [NFT Balance Indicators](../nft/feature-balance-indicators.md)
- [NFT Media Source Fallbacks](../nft/feature-media-source-fallbacks.md)
- [NFT Transfer](../nft/feature-transfer.md)
- [Media Discovery and Actions Flow](../flow-media-discovery-and-actions.md)
