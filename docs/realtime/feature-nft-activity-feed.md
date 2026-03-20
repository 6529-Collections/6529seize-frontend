# NFT Activity Feed

Parent: [Realtime Index](README.md)

## Overview

`/nft-activity` shows recent NFT transactions in a table.
It refetches on first load, filter changes, and page changes.
Wallet authentication is not required.

## Location in the Site

- Route: `/nft-activity`
- Navigation path: `Network -> NFT Activity`

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
5. Review each row: timestamp, transaction-type icon, description, royalties
   (when present), gas indicator, and an Etherscan transaction link.
6. Open row links in a new tab:
   The Memes/Gradients token pages (`/the-memes/{id}`, `/6529-gradient/{id}`),
   NextGen provenance (`/nextgen/token/{tokenId}/provenance`), and Etherscan.

## Pagination

- Page size is fixed to `50`.
- Pagination controls appear only when total results are greater than `50`.
- Controls include previous/next buttons, page-number input (`Enter` to apply),
  and a last-page shortcut.
- Invalid page input resets back to the current page.
- Page changes scroll the window to top.

## Common Scenarios

- Compare activity by collection while keeping one transaction type.
- Filter for one transaction type (for example `Sales` or `Burns`) across all
  collections.
- Jump from a NextGen row to `/nextgen/token/{tokenId}/provenance`.
- Open the transaction icon to inspect on-chain details in Etherscan.

## Edge Cases

- `MemeLab` transactions can appear in results, but there is no dedicated
  `MemeLab` collection filter.
- `MemeLab` rows render as text labels (`MemeLab #{id}`), not token image links.
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
- There is no dedicated inline error banner or retry button for load failures.
- Retry by refreshing the route or changing filters/page.
- If metadata fetches fail, transactions still render with fallback text labels.

## Limitations / Notes

- There is no date-range picker.
- Sorting is not user-configurable.
- Filter and page choices are not persisted in URL query parameters.

## Related Pages

- [Realtime Index](README.md)
- [NFT Activity Browsing Flow](flow-nft-activity-browsing.md)
- [Realtime Connectivity Troubleshooting](troubleshooting-realtime-connectivity.md)
- [NextGen Token Media Rendering](../nextgen/feature-token-media-rendering.md)
- [Pagination Controls](../shared/feature-pagination-controls.md)
- [Loading Status Indicators](../shared/feature-loading-status-indicators.md)
- [Docs Home](../README.md)
