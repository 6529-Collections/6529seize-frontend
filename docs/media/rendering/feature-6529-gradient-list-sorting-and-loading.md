# 6529 Gradient List Sorting and Loading

## Overview

The `6529 Gradient` list route (`/6529-gradient`) renders collection cards with
query-backed sorting. The page normalizes unsupported query values and rewrites
the URL to the active normalized state.

## Location in the Site

- Collection list route: `/6529-gradient`
- Gradient detail handoff route: `/6529-gradient/{id}`
- Collections dropdown entry: `Gradient` (where the dropdown is available)
- Header search result entry: `6529 Gradient`

## Entry Points

- Open `/6529-gradient` directly.
- Use header search and choose `6529 Gradient`.
- Open `Gradient` from the collections dropdown.
- Open a gradient token card from related app surfaces and land on
  `/6529-gradient/{id}`.

## User Journey

1. Open `/6529-gradient` (with or without `sort` and `sort_dir`).
2. The page header renders `6529 Gradient` with `LFG: Start the Show!` and sort
   controls.
3. While data is loading, the page shows `Fetching ...`.
4. After load, cards render with token name, owner row, `TDH`, and rank.
5. Use `ID` or `TDH` plus sort-direction arrows to change ordering.
6. The route rewrites to normalized query values (`sort`, `sort_dir`) without
   scroll reset.
7. Open any card to continue to `/6529-gradient/{id}`.

## Common Scenarios

- Open `/6529-gradient` with no query params and browse default `id + asc`.
- Deep-link to a preferred order, for example `?sort=tdh&sort_dir=desc`.
- Signed-in users see `You own this NFT` when the token owner matches a
  connected wallet.
- Select `LFG: Start the Show!` to open the collection slideshow overlay.

## Edge Cases

- Unsupported `sort` values normalize to `id`.
- Unsupported `sort_dir` values normalize to `asc`.
- Query parsing is case-insensitive (`TDH`, `tdh`, `DESC`, `desc` all map).
- `TDH` ordering is intentionally inverted versus ID ordering:
  - `asc` shows higher TDH first.
  - `desc` shows lower TDH first.
- If the fetch returns no items, the grid renders with no dedicated empty-state
  message.

## Failure and Recovery

- While requests are in flight, users see `Fetching ...`.
- If the collection request fails, loading ends and the page renders an empty
  grid without an inline error banner.
- Refreshing `/6529-gradient` retries the collection request.

## Limitations / Notes

- Only `id` and `tdh` sort keys are supported.
- Only `asc` and `desc` directions are supported.
- Query params are always rewritten to normalized lowercase values.
- Sort controls are click/tap targets and do not expose dedicated keyboard
  button semantics.

## Related Pages

- [Media Rendering Index](README.md)
- [NFT Balance Indicators](../nft/feature-balance-indicators.md)
- [NFT Media Source Fallbacks](../nft/feature-media-source-fallbacks.md)
- [NFT Transfer](../nft/feature-transfer.md)
- [Media Discovery and Actions Flow](../flow-media-discovery-and-actions.md)
