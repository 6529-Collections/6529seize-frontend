# NFT Activity Feed

Parent: [Realtime Index](README.md)

## Overview

The `/nft-activity` route shows recent NFT transactions in a paginated table.
It is request-driven: data refreshes when the page loads, when filters change,
or when page controls change.

## Location in the Site

- Route: `/nft-activity`
- Navigation label: `NFT Activity` in the `Network` section.

## Entry Points

- Open `Network -> NFT Activity` from navigation.
- Open `/nft-activity` directly.

## User Journey

1. Open `/nft-activity`.
2. Wait for the header loader while transactions are fetched.
3. Filter with `Collection` (`All Collections`, `The Memes`, `NextGen`,
   `Gradients`) and `Transaction Type` (`All Transactions`, `Sales`, `Mints`,
   `Transfers`, `Airdrops`, `Burns`).
4. After each filter change, page resets to `1`.
5. Use pagination controls when results exceed one page (`50` rows per page):
   previous/next buttons, page-number input, and last-page shortcut.
6. Open row links for details:
   collection token links, NextGen provenance links, and Etherscan transaction
   links.

## Common Scenarios

- Compare activity by collection while keeping one transaction type.
- Filter for one transaction type (for example `Sales` or `Burns`) across all
  collections.
- Jump from a NextGen row to `/nextgen/token/{tokenId}/provenance`.
- Open the transaction icon to inspect on-chain details in Etherscan.

## Edge Cases

- If NFT metadata is not available for a row, the feed falls back to token text
  labels such as `Meme #{id}`, `Gradient #{id}`, `MemeLab #{id}`, or
  `NextGen #{id}`.
- If NextGen collection metadata is missing, rows fall back to
  `NextGen #{collectionId}` naming.
- Rows without a token count are omitted from the table.
- Filter/page state is local state only and is not encoded in the URL.
- Some filter combinations return zero rows; the table is empty with no
  dedicated empty-state message.
- This route does not stream websocket push updates.

## Failure and Recovery

- If transaction loading fails, rows are cleared and pagination is hidden.
- There is no dedicated inline error banner for load failures.
- Retry by refreshing the route or changing filters/page.

## Limitations / Notes

- There is no date-range picker.
- Sorting is not user-configurable.
- Filter and page choices are not persisted in URL query parameters.
- Wallet authentication is not required to browse this route.

## Related Pages

- [Realtime Index](README.md)
- [NFT Activity Browsing Flow](flow-nft-activity-browsing.md)
- [Realtime Connectivity Troubleshooting](troubleshooting-realtime-connectivity.md)
- [NextGen Collection Slideshow](../nextgen/feature-collection-slideshow.md)
- [Pagination Controls](../shared/feature-pagination-controls.md)
- [Loading Status Indicators](../shared/feature-loading-status-indicators.md)
- [Docs Home](../README.md)
