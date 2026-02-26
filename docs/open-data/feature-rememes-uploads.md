# Rememes Data Uploads

Parent: [Open Data Index](README.md)

## Overview

`/open-data/rememes` is an open-data export page for Rememes upload files. It renders a paginated, server-provided list of date/link pairs through the shared community-download shell.

## Location in the Site

- Route: `/open-data/rememes`
- Hub route: `/open-data`
- Sidebar path: `Tools -> Open Data -> Rememes`

## Entry Points

- Open the `Rememes` card on `/open-data`.
- Open `/open-data/rememes` directly.

## Data Source

- Endpoint: `/api/rememes_uploads`
- The page requests:
  - `page_size=25`
  - `page=<current page>`
- Rows are rendered as two columns: `Date`, `Link`.

## User Journey

1. Open `/open-data/rememes`.
2. The page requests the first data page from the endpoint.
3. The table shows converted date values and links for each upload.
4. Click a link to open the file in a new browser tab.
5. Use pagination when the total result count exceeds 25.

## Load / Error / Empty States

- Loading: `Loading downloads...` appears while the first request is in flight.
- Error: an inline red banner reads `Failed to load community downloads. Please try again.`
- Empty: the shared `Nothing here yet` state is shown.

## Navigation Behavior

- Changing pages triggers a new request and resets page scroll to the top.
- Pagination controls are hidden when total results are `<= 25`.

## Limitations / Notes

- Results are displayed in API order; no custom sorting/search is provided.
- Link targets open in a new tab and are not fetched in-app.

## Related Pages

- [Open Data Hub](feature-open-data-hub.md)
- [Open Data Index](README.md)
- [Meme Subscriptions](feature-meme-subscriptions.md)
- [Consolidated Network Metrics Downloads](feature-network-metrics-downloads.md)
