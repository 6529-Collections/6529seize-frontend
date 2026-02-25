# NFT Activity Browsing Flow

Parent: [Realtime Index](README.md)

## Overview

This flow covers opening the `/nft-activity` route, applying collection/transaction
filters, paging through results, and opening row-level details.

## Location in the Site

- Route: `/nft-activity`
- Sidebar navigation label: `NFT Activity`.

## Entry Points

- Open `NFT Activity` from app navigation.
- Open `/nft-activity` directly.
- Return via browser history to a previously loaded activity state.

## User Journey

1. Open `/nft-activity`.
2. Wait for initial table data fetch; loading is surfaced in the header area.
3. Adjust `Collection` and/or `Transaction Type` filters.
4. Observe the filter state reset to page `1` after each filter change.
5. Use pagination controls to move between pages.
6. Open token links (`The Memes`, `Gradients`, `MemeLab`, `NextGen`) or the
   transaction icon in the row for contextual details.

## Common Scenarios

- Compare collection activity across `The Memes`, `NextGen`, and `Gradients`.
- View only transfers, sales, burns, airdrops, or mints.
- Open a NextGen row and jump to `/nextgen/token/{tokenId}/provenance`.
- Jump between rows and pagination pages while staying on a single route.

## Edge Cases

- Filter changes do not alter the URL; filter state is local to the page session.
- Some transactions without token metadata will render with fallback text labels.
- Very large query sets can require multiple page loads.

## Failure and Recovery

- If a fetch fails, the table becomes empty and the existing rows are replaced by
  the empty state.
- Retry by changing a filter or refreshing the route.

## Limitations / Notes

- No dedicated date-range picker.
- No dedicated empty-state copy when filters return no rows.

## Related Pages

- [NFT Activity Feed](feature-nft-activity-feed.md)
- [Realtime Index](README.md)
- [Pagination Controls](../shared/feature-pagination-controls.md)
- [Loading Status Indicators](../shared/feature-loading-status-indicators.md)
- [Docs Home](../README.md)
