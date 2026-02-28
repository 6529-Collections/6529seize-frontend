# NFT Activity Browsing Flow

Parent: [Realtime Index](README.md)

## Overview

This flow covers opening `/nft-activity`, filtering transactions, paging
results, and opening row-level links.

## Location in the Site

- Route: `/nft-activity` under `Network`.

## Entry Points

- Open `Network -> NFT Activity`.
- Open `/nft-activity` directly.

## User Journey

1. Open `/nft-activity`.
2. Wait for the header loader while the first fetch runs.
3. Adjust `Collection` and/or `Transaction Type` filters.
4. Confirm each filter change resets the table to page `1`.
5. Use pagination controls when available:
   previous/next, page input, or last-page shortcut.
6. Open token links (`The Memes`, `Gradients`, `MemeLab`, `NextGen`) or the
   transaction icon in the row for contextual details.

## Common Scenarios

- Compare activity across `The Memes`, `NextGen`, and `Gradients`.
- View only transfers, sales, burns, airdrops, or mints.
- Open a NextGen row and jump to `/nextgen/token/{tokenId}/provenance`.
- Inspect a transaction in Etherscan from the same row.

## Edge Cases

- Filter and page state are local and do not update the URL.
- Some transactions without token metadata will render with fallback text labels.
- Rows with no token count are omitted.
- This route is request-driven and does not subscribe to websocket events.

## Failure and Recovery

- If a fetch fails, the table clears and the loader stops.
- Retry by changing filters/page or refreshing `/nft-activity`.

## Limitations / Notes

- No dedicated date-range picker.
- No dedicated empty-state copy when filters return no rows.
- No inline route-level error banner for failed loads.

## Related Pages

- [NFT Activity Feed](feature-nft-activity-feed.md)
- [Realtime Index](README.md)
- [Pagination Controls](../shared/feature-pagination-controls.md)
- [Loading Status Indicators](../shared/feature-loading-status-indicators.md)
- [Docs Home](../README.md)
