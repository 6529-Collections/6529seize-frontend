# Rememes Downloads

Parent: [Open Data Index](README.md)

## Overview

`/open-data/rememes` lists ReMemes export files with date and link rows.

## Location in the Site

- Route: `/open-data/rememes`
- Hub route: `/open-data`
- Sidebar path: `Tools -> Open Data -> Rememes`

## Entry Points

- Open the `Rememes` card on `/open-data`.
- Open `/open-data/rememes` directly.

## Data Source

- Endpoint: `/api/rememes_uploads`
- Request params: `page_size=25` and `page=<current page>`
- Table columns: `Date` and `Link`

## User Journey

1. Open `/open-data/rememes`.
2. Wait for the first request to return.
3. Review date and link rows.
4. Open a link to open the file URL in a new tab.
5. Use pagination when more than 25 rows are available.

## Load / Error / Empty States

- Loading: `Loading downloads...` appears while the first request is in flight.
- Error: an inline red banner reads `Failed to load community downloads. Please try again.`
- Empty: `Nothing here yet` is shown.

## Navigation Behavior

- Pagination is shown only when `count > 25`.
- Changing pages requests the next page and scrolls to the top.
- While a new page is loading, the previous page rows stay visible.

## Limitations / Notes

- No in-page sort or search controls are available.

## Related Pages

- [Open Data Hub](feature-open-data-hub.md)
- [Meme Subscriptions](feature-meme-subscriptions.md)
- [Consolidated Network Metrics Downloads](feature-network-metrics-downloads.md)
- [Royalties Downloads](feature-royalties-uploads.md)
