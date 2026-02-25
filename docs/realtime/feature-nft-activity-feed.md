# NFT Activity Feed

Parent: [Realtime Index](README.md)

## Overview

The NFT Activity feed shows recent on-chain transactions across supported
collections in one paginated stream.

## Location in the Site

- Network activity page: `/nft-activity`
- Sidebar route label: `NFT Activity`.

## Entry Points

- Open `/nft-activity` directly.
- Use browser history/deep links to reopen a previously visited page URL.

## User Journey

1. Open `/nft-activity`.
2. Review the newest rows in the activity table.
3. Filter with the `Collection` and `Transaction Type` dropdowns
   (`The Memes`, `NextGen`, `Gradients`, `All Collections`, etc.).
4. Pagination controls change result pages when more rows are available.
5. Open NFT/token links or the transaction icon for deeper details.

## Common Scenarios

- Filter to `The Memes`, `NextGen`, or `Gradients` in `Collection`
  (use `All Collections` to clear collection scope).
- Filter to `All Transactions`, `Sales`, `Mints`, `Transfers`, `Airdrops`, or
  `Burns` in `Transaction Type`.
- Open a NextGen row to its provenance route:
  `/nextgen/token/{tokenId}/provenance`.
- Open the transaction icon to view the tx on Etherscan.

## Edge Cases

- If NFT metadata is not available for a row, the feed falls back to token text
  labels such as `Meme #{id}`, `Gradient #{id}`, `MemeLab #{id}`, or
  `NextGen #{id}`.
- Rows without a token count are omitted from the table.
- Some filter combinations can return zero rows; the table is empty with no
  dedicated empty-state copy.
- Filter/page state is kept in-session and not encoded in query parameters.

## Failure and Recovery

- If loading fails, the feed clears current rows and stops loading indicators.
- Refreshing the page or changing a filter triggers a new fetch.
- While data is loading, the route header shows a loading indicator.

## Limitations / Notes

- There is no date-range picker.
- Sorting is not user-configurable.
- The page does not show a dedicated inline error banner for failed requests.

## Related Pages

- [Realtime Index](README.md)
- [NFT Activity Browsing Flow](flow-nft-activity-browsing.md)
- [Realtime Connectivity Troubleshooting](troubleshooting-realtime-connectivity.md)
- [NextGen Collection Slideshow](../nextgen/feature-collection-slideshow.md)
- [Pagination Controls](../shared/feature-pagination-controls.md)
- [Loading Status Indicators](../shared/feature-loading-status-indicators.md)
- [Docs Home](../README.md)
