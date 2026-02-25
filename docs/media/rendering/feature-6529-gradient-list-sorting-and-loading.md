# 6529 Gradient List Sorting and Loading

## Overview

The `6529 Gradient` collection list (`/6529-gradient`) shows token cards and
supports URL-driven sorting controls. The page keeps sort state in query
parameters and normalizes unsupported query values to defaults.

## Location in the Site

- Collection list route: `/6529-gradient`
- Sidebar path: `About -> Gradient`
- Search result entry: `6529 Gradient`

## Entry Points

- Open `/6529-gradient` directly.
- Open `About -> Gradient` from the sidebar.
- Use header search and select `6529 Gradient`.

## User Journey

1. Open `/6529-gradient`.
2. The page shows `Fetching ...` while collection data is loading.
3. After loading, token cards render in the active sort order.
4. Use `ID` or `TDH` plus sort-direction arrows to change ordering.
5. The URL is rewritten to normalized query params (`sort`, `sort_dir`)
   without scrolling the page.

## Common Scenarios

- Open `/6529-gradient` with no query params and browse the default
  `ID` + ascending direction.
- Open with query params (for example `?sort=tdh&sort_dir=desc`) to land
  directly on a preferred ordering.
- Switch between `ID` and `TDH` while browsing cards and keep the list on the
  same route.
- Signed-in users see `You own this NFT` badges on cards where token owner
  matches one of the connected profile wallets.

## Edge Cases

- Unsupported `sort` values are coerced to `id`.
- Unsupported `sort_dir` values are coerced to `asc`.
- Query parsing is case-insensitive (`TDH`, `tdh`, `DESC`, `desc` are accepted).
- The `TDH` sort direction differs from ID-style numeric ordering:
  - `asc` shows higher TDH values first.
  - `desc` shows lower TDH values first.
- If the fetched list is empty, the grid renders with no cards and no dedicated
  empty-state message.

## Failure and Recovery

- While requests are in-flight, users see `Fetching ...`.
- If collection fetch fails, loading stops and the page renders an empty card
  grid (no inline error banner).
- Refreshing the route retries the collection request.

## Limitations / Notes

- Only two sort keys are supported: `id` and `tdh`.
- Only two directions are supported: `asc` and `desc`.
- The route always rewrites query params to normalized values after state is
  applied.
- The page does not show a dedicated error panel for failed collection loads.

## Related Pages

- [Media Index](../README.md)
- [NFT Balance Indicators](../nft/feature-balance-indicators.md)
- [NFT Media Source Fallbacks](../nft/feature-media-source-fallbacks.md)
- [Docs Home](../../README.md)
