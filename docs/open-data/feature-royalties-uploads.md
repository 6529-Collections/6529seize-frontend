# Royalties Uploads

Parent: [Open Data Index](README.md)

## Overview

`/open-data/royalties` is an open-data export page for community royalties upload files.
It uses the shared community download shell with a paginated, date-based listing.

## Location in the Site

- Route: `/open-data/royalties`
- Hub route: `/open-data`
- Sidebar path: `Tools -> Open Data -> Royalties`

## Entry Points

- Open the `Royalties` card on `/open-data`.
- Open `/open-data/royalties` directly.

## Data Source

- Endpoint: `/api/royalties/uploads`
- Request pattern:
  - `page_size=25`
  - `page=<current page>`
- Response shape follows the shared `ApiUploadsPage` format with `count` and `data`.
- Data rows are shown as a two-column `Date` / `Link` table.

## User Journey

1. Open `/open-data/royalties`.
2. The first page request loads royalty upload links and dates.
3. Click a row link to open the exported file in a new tab.
4. Use pagination when total results exceed 25 to access older export files.

## Load / Error / Empty States

- Loading: the page shows `Loading downloads...` while data is initially fetching.
- Error: the page shows `Failed to load community downloads. Please try again.`
- Empty: the shared `Nothing here yet` component appears when no uploads are available.

## Navigation Behavior

- Page changes update the list request and reset scroll to the top.
- Pagination controls render only when `count > 25`.

## Related Route Behavior

- [Open Data Hub](feature-open-data-hub.md)
- [Consolidated Network Metrics Downloads](feature-network-metrics-downloads.md)
- [Rememes Data Uploads](feature-rememes-uploads.md)
- [Open Data Index](README.md)
