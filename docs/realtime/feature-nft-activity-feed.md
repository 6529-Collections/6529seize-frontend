# NFT Activity Feed

Parent: [Realtime Index](README.md)

## Overview

The NFT Activity feed shows recent on-chain transactions across supported
collections in one stream.

## Location in the Site

- Network activity page: `/nft-activity`

## Entry Points

- Open `/nft-activity` directly.
- Use browser history/deep links to reopen a previously shared page URL.

## User Journey

1. Open `/nft-activity`.
2. Review the newest rows in the activity table.
3. Narrow results with the `Collection` and `Transaction Type` dropdowns.
4. Move between result pages with pagination controls at the bottom.
5. Open NFT/token links or the transaction link for deeper details.

## Common Scenarios

- Filter to `The Memes`, `NextGen`, or `Gradients` in `Collection`.
- Filter to `Sales`, `Mints`, `Transfers`, `Airdrops`, or `Burns` in
  `Transaction Type`.
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

## Failure and Recovery

- If loading fails, the feed clears current rows and stops loading indicators.
- Refreshing the page or changing a filter triggers a new fetch.
- While data is loading, the route-level header shows a loading indicator.

## Limitations / Notes

- There is no date-range picker.
- Sorting is not user-configurable.
- Filter/page state is session-local and not encoded in query parameters.
- The page does not show a dedicated inline error banner for failed requests.

## Related Pages

- [Realtime Index](README.md)
- [NextGen Collection Slideshow](../nextgen/feature-collection-slideshow.md)
- [Pagination Controls](../shared/feature-pagination-controls.md)
- [Loading Status Indicators](../shared/feature-loading-status-indicators.md)
- [Docs Home](../README.md)
