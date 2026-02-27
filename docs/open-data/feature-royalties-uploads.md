# Royalties Downloads

Parent: [Open Data Index](README.md)

## Overview

`/open-data/royalties` lists royalties export files with date and link rows.

## Location in the Site

- Route: `/open-data/royalties`
- Hub route: `/open-data`
- Sidebar path: `Tools -> Open Data -> Royalties`

## Entry Points

- Open the `Royalties` card on `/open-data`.
- Open `/open-data/royalties` directly.

## Data Source

- Endpoint: `/api/royalties/uploads`
- Request params: `page_size=25` and `page=<current page>`
- Table columns: `Date` and `Link`

## User Journey

1. Open `/open-data/royalties`.
2. Wait for the first request to return.
3. Review date and link rows.
4. Open a link to open the file URL in a new tab.
5. Use pagination when more than 25 rows are available.

## Load / Error / Empty States

- Loading: the page shows `Loading downloads...` while data is initially fetching.
- Error: the page shows `Failed to load community downloads. Please try again.`
- Empty: `Nothing here yet` appears when there are no rows.

## Navigation Behavior

- Pagination is shown only when `count > 25`.
- Page changes request the next page and scroll to top.
- While a new page is loading, previous rows stay visible.

## Related Route Behavior

- [Open Data Hub](feature-open-data-hub.md)
- [Consolidated Network Metrics Downloads](feature-network-metrics-downloads.md)
- [Rememes Downloads](feature-rememes-uploads.md)
- [Open Data Routes and Download States](troubleshooting-open-data-routes-and-downloads.md)
