# Network Metrics Downloads

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
- Open `/open-data/network-metrics` directly.

## User Journey

1. Open `/open-data/network-metrics`.
2. Wait for the first dataset request to return.
3. Review the table:
   - `Date`
   - `Link`
4. Open a `Link` value to open the file URL in a new tab.
5. Use pagination when more than 25 rows are available.

## Data Source

- Endpoint: `/api/consolidated_uploads`
- Request params: `page_size=25` and `page=<current page>`

## Failure and Recovery

- First load shows `Loading downloads...`.
- If the request fails, the page shows:
  `Failed to load community downloads. Please try again.`
- Retry by reloading the route.

## Empty and Pagination States

- If the response has zero rows, the page shows `Nothing here yet`.
- Pagination appears only when `count > 25`.
- Page changes keep prior rows visible until the next page response arrives.

## Limitations / Notes

- No in-page search or sorting controls are available.

## Related Pages

- [Open Data Hub](feature-open-data-hub.md)
- [Open Data Hub to Dataset Routes](flow-open-data-hub-to-download-routes.md)
- [Open Data Routes and Download States](troubleshooting-open-data-routes-and-downloads.md)
