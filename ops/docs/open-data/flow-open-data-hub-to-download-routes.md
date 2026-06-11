# Open Data Hub to Dataset Routes

Parent: [Open Data Index](README.md)

## Overview

Use this flow to move from the Open Data hub to a dataset route and open a
download link.

## Location in the Site

- Hub route: `/open-data`
- Dataset routes:
  - `/open-data/network-metrics`
  - `/open-data/meme-subscriptions`
  - `/open-data/rememes`
  - `/open-data/team`
  - `/open-data/royalties`

## Entry Points

- Web sidebar (desktop and mobile web): `Tools -> Open Data -> Open Data`
- Web sidebar (desktop and mobile web): direct links to each dataset route under
  `Tools -> Open Data`
- Native app menu: `Tools -> Open Data` (hub only)
- Direct URL: `/open-data` or any dataset route
- About-page links from `/about/minting` and `/about/data-decentralization`

## User Journey

1. Open `/open-data`.
2. Pick a hub card:
   - `Network Metrics`
   - `Meme Subscriptions` (can be hidden on native iOS outside US)
   - `Rememes`
   - `Team`
   - `Royalties`
3. If `Meme Subscriptions` is hidden on native iOS (non-`US` or country still
   loading), open `/open-data/meme-subscriptions` directly.
4. Wait for route content.
5. Open a row link in a new tab.

## Route State Outcomes

- `Network Metrics`, `Rememes`, and `Royalties`:
  - first request: `Loading downloads...`
  - failed request: `Failed to load community downloads. Please try again.`
  - empty success: `Nothing here yet`
- `Meme Subscriptions`:
  - first request has no inline loading or error banner (can look heading-only)
  - empty success: `Nothing here yet`
- `Team`:
  - fixed links table
  - no API fetch, no loading banner, and no API error banner

## Pagination Rules

- API-backed routes show pagination only when total results are greater than 25:
  `/open-data/network-metrics`, `/open-data/meme-subscriptions`,
  `/open-data/rememes`, and `/open-data/royalties`.
- `/open-data/team` does not show pagination.

## Route Variants

- Direct dataset URLs:
  - `/open-data/network-metrics`
  - `/open-data/meme-subscriptions`
  - `/open-data/rememes`
  - `/open-data/team`
  - `/open-data/royalties`
- Web sidebar includes direct links to all dataset routes.
- Native app menu links only to `/open-data`; use hub cards or direct URLs for
  dataset routes.
- `Meme Subscriptions` can be hidden on the hub for native iOS app users outside
  the US, but the direct route still works.

## Failure and Recovery

- If `Failed to load community downloads. Please try again.` appears, reload the
  same route.
- If `Meme Subscriptions` shows heading-only for too long, reload or reopen
  `/open-data/meme-subscriptions` directly.
- If a download link does not open, allow new tabs/popups for the site and
  retry.

## Related Pages

- [Open Data Hub](feature-open-data-hub.md)
- [Open Data Routes and Download States](troubleshooting-open-data-routes-and-downloads.md)
- [Consolidated Network Metrics Downloads](feature-network-metrics-downloads.md)
- [Meme Subscriptions](feature-meme-subscriptions.md)
- [Rememes Downloads](feature-rememes-uploads.md)
- [Team Downloads](feature-team-downloads.md)
- [Royalties Downloads](feature-royalties-uploads.md)
