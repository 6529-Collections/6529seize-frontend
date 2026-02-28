# NFT Activity Browsing Flow

Parent: [Realtime Index](README.md)

## Overview

Use this flow to browse `/nft-activity`, narrow results, and open row-level
details.

## Location in the Site

- Route: `/nft-activity` from `Network -> NFT Activity`.
- This route is separate from `Network -> Activity` (`/network/activity`).

## Entry Points

- Open `Network -> NFT Activity` from the sidebar.
- Open `/nft-activity` directly.

## User Journey

1. Open `/nft-activity`.
2. Wait for the header loader while the first fetch runs.
3. Set `Collection` and/or `Transaction Type` filters:
   `All Collections`, `The Memes`, `NextGen`, `Gradients`; and
   `All Transactions`, `Sales`, `Mints`, `Transfers`, `Airdrops`, `Burns`.
4. Confirm each filter change resets the table to page `1`.
5. Use pagination controls when total results exceed `50`:
   previous/next, page input (`Enter` to apply), or last-page shortcut.
6. Confirm page changes scroll the route back to top.
7. Open row links for details:
   The Memes/Gradients token links (when token metadata is available), NextGen
   provenance links, and Etherscan.

## Common Scenarios

- Compare one transaction type across `The Memes`, `NextGen`, and `Gradients`.
- View only transfers, sales, burns, airdrops, or mints.
- Open a NextGen row and jump to `/nextgen/token/{tokenId}/provenance`.
- Inspect a transaction in Etherscan from the same row.

## Edge Cases

- Filter and page state are local and do not update the URL.
- `MemeLab` transactions can appear, but there is no `MemeLab` filter.
- `MemeLab` rows render text labels (`MemeLab #{id}`), not token image links.
- Some transactions without token metadata will render with fallback text labels.
- NextGen rows with missing collection metadata fall back to
  `NextGen #{collectionId}` naming.
- Rows with no token count are omitted.
- Invalid page input (not a number or out of range) resets back to the current
  page when you press `Enter`.
- Some filter/page combinations return zero rows with no dedicated empty-state
  message.
- Wallet authentication is not required for this route.
- This route is request-driven and does not subscribe to websocket events.

## Failure and Recovery

- If transaction fetch fails, rows clear, pagination hides, and loader stops.
- There is no inline error banner or retry button on this route.
- Retry by changing filters/page or refreshing `/nft-activity`.
- If metadata fetch fails, rows still render with fallback text labels.

## Limitations / Notes

- No dedicated date-range picker.
- No user-configurable sort control.
- Filter/page state is not persisted across refresh.

## Related Pages

- [NFT Activity Feed](feature-nft-activity-feed.md)
- [Realtime Index](README.md)
- [Realtime Connectivity Troubleshooting](troubleshooting-realtime-connectivity.md)
- [Network Activity Feed](../network/feature-network-activity-feed.md)
- [Pagination Controls](../shared/feature-pagination-controls.md)
- [Loading Status Indicators](../shared/feature-loading-status-indicators.md)
- [Docs Home](../README.md)
