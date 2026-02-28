# Pagination Controls

Parent: [Shared Index](README.md)

## Overview

Pagination controls appear on multi-page lists and tables.
Two shared variants are used across the app:

- Numbered pagination: `Previous page`, page input, last-page button, and
  `Next page`.
- Table pagination: `Previous` and `Next` buttons, with optional
  `Page <current> of <total>` text.

## Location in the Site

- Numbered pagination appears on routes such as:
  `/nft-activity`, `/tools/subscriptions-report`, `/network/prenodes`,
  `/open-data/network-metrics`, `/open-data/rememes`, `/open-data/royalties`,
  `/open-data/meme-subscriptions`, and `/the-memes/{id}/distribution`.
- Table pagination appears on routes such as:
  the Network identities leaderboard, `/network/activity`, `/{user}/stats`,
  and `/{user}/collected`.

## Entry Points

- Open a route with more than one page of results.
- Use the pagination row shown on that route.

## User Journey

1. Open a paginated list or table.
2. Move one page at a time with `Previous` or `Next`.
3. If numbered pagination is shown, type a target page and press `Enter`.
4. If numbered pagination is shown, use the last-page button to jump to the
   final page.

## Edge Cases

- Numbered pagination is hidden when `totalResults <= pageSize`.
- Numbered page input accepts temporary free text while typing; no page request
  is sent until `Enter` is pressed.
- Numbered input values outside `1..lastPage` reset to the current page
  on `Enter`.
- In numbered pagination, `Previous page` is disabled on page `1`; `Next page`
  and `Go to last page` are disabled on the last page.
- In table pagination, `Previous` is hidden on page `1`.
- In table pagination, `Next` is hidden when no next page is available.
- In table pagination, `Page <current> of <total>` is hidden when total pages
  are not known.
- Table pagination buttons can be temporarily disabled while a page request is
  in flight.

## Failure and Recovery

- Pagination controls only request page changes.
- Loading, empty, error, and retry UI is owned by each feature page.
- Invalid numbered input does not show a dedicated error banner; the control
  recovers by resetting to the current page value on `Enter`.
- If page requests fail, retry using pagination controls again or refresh the
  route.

## Limitations / Notes

- There is no shared `Go to first page` control.
- There is no shared page-size selector.
- Numbered page jumps apply only on `Enter`; changing the input value alone
  does not navigate.
- URL behavior is route-specific:
  routes such as the Network identities leaderboard, `/{user}/stats`, and
  `/{user}/collected` can keep page state in query params, while other routes
  keep page state locally.

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [NFT Activity Feed](../realtime/feature-nft-activity-feed.md)
- [Memes Subscriptions Report](../api-tool/feature-memes-subscriptions-report.md)
- [Prenodes Status](../network/feature-prenodes-status.md)
- [Network Metrics Downloads](../open-data/feature-network-metrics-downloads.md)
- [Rememes Downloads](../open-data/feature-rememes-uploads.md)
- [Royalties Downloads](../open-data/feature-royalties-uploads.md)
- [Meme Subscriptions](../open-data/feature-meme-subscriptions.md)
- [Network Identities Leaderboard](../network/feature-network-identities-leaderboard.md)
- [Network Activity Feed](../network/feature-network-activity-feed.md)
- [Profile Stats Tab](../profiles/tabs/feature-stats-tab.md)
- [Collected Tab and Transfer Mode](../profiles/tabs/feature-collected-tab.md)
