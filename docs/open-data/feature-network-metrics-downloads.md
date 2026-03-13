# Consolidated Network Metrics Downloads

Parent: [Open Data Index](README.md)

## Overview

`/open-data/network-metrics` lists consolidated network-metrics export files.
The page heading is `Consolidated Network Metrics Downloads`.

## Location in the Site

- Route: `/open-data/network-metrics`
- Hub route: `/open-data`
- Sidebar path: `Tools -> Open Data -> Network Metrics`

## Entry Points

- Open the `Network Metrics` card on `/open-data`.
- Open `Tools -> Open Data -> Network Metrics` in the sidebar.
- Open `/open-data/network-metrics` directly.

## Data Source and Table Content

- Endpoint: `/api/consolidated_uploads`
- Request params: `page_size=25` and `page=<current page>`
- Table columns:
  - `Date`
  - `Link`
- `Date` renders as a calendar date string.
- `Link` opens the export URL in a new tab.

## User Journey

1. Open `/open-data/network-metrics`.
2. Wait for the first request to complete.
3. Review the `Date` and `Link` table rows.
4. Open a link in a new tab.
5. Use pagination when total results are greater than 25.

## Loading, Error, Empty, and Recovery States

- Initial load: `Loading downloads...`.
- First-request failure: `Failed to load community downloads. Please try again.`
- Later page-request failure: the same error message appears and previous rows
  stay visible.
- Empty successful response: `Nothing here yet`.
- Recovery: reload `/open-data/network-metrics` (there is no inline retry
  button).

## Pagination Behavior

- Pagination appears only when `count > 25`.
- Page changes request `page=<current page>` and scroll to top.
- While the next page request is in flight, previous rows stay visible.
- Controls support previous/next, page-number input (press `Enter`), and
  jump-to-last-page.

## Limitations / Notes

- No in-page search, filtering, or sorting controls are available.
- The route exposes only the consolidated metrics view.

## Related Pages

- [Open Data Hub](feature-open-data-hub.md)
- [Open Data Hub to Dataset Routes](flow-open-data-hub-to-download-routes.md)
- [Open Data Routes and Download States](troubleshooting-open-data-routes-and-downloads.md)
