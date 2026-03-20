# Royalties Downloads

Parent: [Open Data Index](README.md)

## Overview

Use `/open-data/royalties` to open royalties export files.
The page heading is `Royalties Downloads`.
Each table row shows a `Date` and `Link`.

## Location in the Site

- Route: `/open-data/royalties`
- Hub route: `/open-data`
- Desktop sidebar: `Tools -> Open Data -> Royalties`
- Mobile sidebar: `Tools -> Open Data` only, then open the `Royalties` hub card
  or use a direct URL.

## Entry Points

- Open the `Royalties` card on `/open-data`.
- Open `Tools -> Open Data -> Royalties` in the desktop sidebar.
- Open `/open-data/royalties` directly.

## Data Source and Table

- Endpoint: `/api/royalties/uploads`
- Request params: `page_size=25` and `page=<current page>`
- Columns: `Date`, `Link`
- `Date` renders as a calendar date string.
- `Link` opens the file URL in a new browser tab.

## User Journey

1. Open `/open-data/royalties`.
2. Wait for the first request to return.
3. Review date and link rows.
4. Open a link to open the file URL in a new tab.
5. Use pagination when total results are greater than 25.

## Loading, Error, Empty, and Recovery States

- Initial load: `Loading downloads...`.
- First-request failure: `Failed to load community downloads. Please try again.`
  and no rows render.
- Later page-request failure: the same error message appears and previous rows
  stay visible.
- Empty successful response: `Nothing here yet`.
- Recovery: reload `/open-data/royalties` (no inline retry button).

## Pagination Behavior

- Pagination appears only when `count > 25`.
- Controls support previous/next, page-number input (press `Enter`), and
  jump-to-last-page.
- Invalid, non-numeric, or out-of-range page input resets to the current page
  when you press `Enter`.
- Page changes request `page=<current page>` and scroll to top.
- While a page request is in flight, previous rows stay visible.

## Limitations

- No in-page search, filtering, or sorting controls.

## Related Pages

- [Open Data Hub](feature-open-data-hub.md)
- [Open Data Hub to Dataset Routes](flow-open-data-hub-to-download-routes.md)
- [Open Data Routes and Download States](troubleshooting-open-data-routes-and-downloads.md)
- [Consolidated Network Metrics Downloads](feature-network-metrics-downloads.md)
- [Rememes Downloads](feature-rememes-uploads.md)
