# Rememes Downloads

Parent: [Open Data Index](README.md)

## Overview

`/open-data/rememes` lists rememes export files.
Page heading: `Rememes Downloads`.
Each row includes a date and file link.

## Location in the Site

- Route: `/open-data/rememes`
- Hub route: `/open-data`
- Desktop sidebar path: `Tools -> Open Data -> Rememes`
- Mobile sidebar path: `Tools -> Open Data`; from there, open the `Rememes` card
  or use a direct URL.

## Entry Points

- Open the `Rememes` card on `/open-data`.
- Open `Tools -> Open Data -> Rememes` in the desktop sidebar.
- Open `/open-data/rememes` directly.

## Data Source and Table

- Endpoint: `/api/rememes_uploads`
- Request params: `page_size=25` and `page=<current page>`
- Columns: `Date`, `Link`
- `Date` renders as a calendar date string.
- `Link` opens the file URL in a new tab.

## User Journey

1. Open `/open-data/rememes`.
2. Wait for the first request to return.
3. Review rows in the table.
4. Open a `Link` value to open the file URL in a new tab.
5. Use pagination when more than 25 rows are available.

## Loading, Error, Empty, and Recovery States

- Initial load: `Loading downloads...`.
- First-request failure: `Failed to load community downloads. Please try again.`
- Later page-request failure: the same error message appears and previous rows
  stay visible.
- Empty successful response: `Nothing here yet`.
- Recovery: reload `/open-data/rememes` (there is no inline retry button).

## Pagination Behavior

- Pagination is shown only when `count > 25`.
- Controls support previous/next, page-number input (press `Enter`), and
  jump-to-last-page.
- Invalid page-number input resets to the current page.
- Changing pages requests the selected page and scrolls to the top.
- While a page request is in flight, previous rows stay visible.

## Limitations

- No in-page search, filtering, or sorting controls are available.

## Related Pages

- [Open Data Hub](feature-open-data-hub.md)
- [Open Data Hub to Dataset Routes](flow-open-data-hub-to-download-routes.md)
- [Open Data Routes and Download States](troubleshooting-open-data-routes-and-downloads.md)
- [Consolidated Network Metrics Downloads](feature-network-metrics-downloads.md)
- [Royalties Downloads](feature-royalties-uploads.md)
