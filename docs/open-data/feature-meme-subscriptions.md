# Meme Subscriptions

Parent: [Open Data Index](README.md)

## Overview

`/open-data/meme-subscriptions` lists The Memes subscription export files.
The page heading is `Meme Subscriptions Downloads`.

## Location in the Site

- Route: `/open-data/meme-subscriptions`
- Hub route: `/open-data`
- Web sidebar path: `Tools -> Open Data -> Meme Subscriptions`
- Native app menu path: `Tools -> Open Data`, then open the hub card or direct
  URL.

## Entry Points

- Open the `Meme Subscriptions` card on `/open-data`.
- Open `Tools -> Open Data -> Meme Subscriptions` in the web sidebar.
- Open `/open-data/meme-subscriptions` directly.

## Visibility Rules

- The hub card is hidden when both are true:
  - The user is in the native iOS app.
  - Cookie-country is not `US`.
- On native iOS, the hub card can be temporarily hidden while cookie-country is
  still loading.
- The iOS country rule affects hub-card visibility only.
- The web sidebar route link remains available.
- The native app menu does not list per-dataset Open Data routes.
- Direct navigation to `/open-data/meme-subscriptions` still works.

## Data Source

- Endpoint: `/api/subscriptions/uploads`
- Fixed request params:
  - `contract=0x33FD426905F149f8376e227d0C9D3340AaD17aF1`
  - `page_size=25`
  - `page=<current page>`
- The route always uses the fixed contract; users cannot switch it in the UI.

## Table Content

- `Date` is rendered as a calendar date.
- `Token ID` is rendered as `#<token_id>`.
- `Link` shows the file URL and opens it in a new tab.

## User Journey

1. Open `/open-data/meme-subscriptions` or use the hub card.
2. Wait for the dataset request.
3. Review the `Date`, `Token ID`, and `Link` columns.
4. Open a `Link` value to open the file URL in a new tab.
5. Use pagination when total results exceed 25.

## Loading, Error, Empty, and Recovery

- Initial request in flight: the page shows only the heading. There is no
  loading banner.
- Initial request failure: the page still shows only the heading. There is no
  inline error banner.
- Later page-request failure: previously loaded rows remain visible.
- Empty success response: `Nothing here yet`.
- Recovery: reload `/open-data/meme-subscriptions`.

## Pagination Behavior

- Each page shows up to 25 rows.
- Pagination controls appear only when `count > 25`.
- Page changes request `page=<current page>` and scroll to top.
- There is no in-page retry button.

## Limitations

- No contract switcher is available.
- No in-page sorting or filtering controls are available.

## Related Pages

- [Open Data Hub](feature-open-data-hub.md)
- [Open Data Hub to Dataset Routes](flow-open-data-hub-to-download-routes.md)
- [Open Data Routes and Download States](troubleshooting-open-data-routes-and-downloads.md)
- [Subscriptions Report Tool](../api-tool/feature-memes-subscriptions-report.md)
