# Meme Subscriptions

Parent: [Open Data Index](README.md)

## Overview

`/open-data/meme-subscriptions` lists meme-subscription export files with token
IDs and download links.

## Location in the Site

- Route: `/open-data/meme-subscriptions`
- Sidebar path: `Tools -> Open Data -> Meme Subscriptions`
- Hub entry: `Meme Subscriptions` card on `/open-data`

## Data Source

- Endpoint: `/api/subscriptions/uploads`
- Fixed request params:
  - `contract=0x33FD426905F149f8376e227d0C9D3340AaD17aF1`
  - `page_size=25`
  - `page=<current page>`
- The route always uses the fixed contract; users cannot switch it in the UI.

## User Journey

1. Open `/open-data/meme-subscriptions` or use the Hub card.
2. Wait for the dataset request to return.
3. Review rows in a three-column table:
   - `Date`: formatted for display
   - `Token ID`: rendered as `#<token_id>`
   - `Link`: downloadable file URL (opens in a new tab)
4. Use pagination when total results exceed 25.

## Pagination Behavior

- Each page shows up to 25 rows.
- Pagination is hidden when `count <= 25`.
- Page changes request the next page and scroll the window to top.

## Load / Error / Empty States

- Loading: no explicit loading indicator is shown.
- Error: no inline error banner is shown.
- Initial-load failure: the page stays at the heading with no rows.
- Later-page failure: previously loaded rows remain visible.
- Empty success response: `Nothing here yet`.

## Edge Cases

- The Hub/desktop-sidebar `Meme Subscriptions` link can be hidden for native iOS
  app users outside the US.
- Direct navigation to `/open-data/meme-subscriptions` still opens the route.

## Related Pages

- [Open Data Hub](feature-open-data-hub.md)
- [Open Data Hub to Dataset Routes](flow-open-data-hub-to-download-routes.md)
- [Open Data Routes and Download States](troubleshooting-open-data-routes-and-downloads.md)
- [Subscriptions Report Tool](../api-tool/feature-memes-subscriptions-report.md)
