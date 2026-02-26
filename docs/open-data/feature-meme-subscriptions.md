# Meme Subscriptions

Parent: [Open Data Index](README.md)

## Overview

`/open-data/meme-subscriptions` is a data-export page that renders a paginated
download list from the `subscriptions/uploads` API. The page shows rows from the API response with:

- Date
- Token ID
- Download link

## Location in the Site

- Route: `/open-data/meme-subscriptions`
- Sidebar path: `Tools -> Open Data -> Meme Subscriptions`
- Hub entry: `Meme Subscriptions` card on `/open-data`

## Data Source

- Endpoint: `/subscriptions/uploads`
- The page always requests the endpoint with:
  - `contract=0x33FD426905F149f8376e227d0C9D3340AaD17aF1`
  - `page_size=25`
  - `page=<current page>`
- Because the contract is fixed, only uploads for the memedrop NFTs from that
  contract family are returned.
- The backend returns at least:
  - `count` (total row count)
  - `data` (rows containing `date`, `token_id`, and `upload_url`)

## User Journey

1. Open `/open-data/meme-subscriptions` or use the Hub card.
2. The page requests a page of results from the API endpoint using the fixed
   contract.
3. Rows appear in a three-column table:
   - `Date`: formatted for display
   - `Token ID`: rendered as `#<token_id>`
   - `Link`: downloadable file URL (opens in a new tab)
4. If the total result count exceeds 25, use pagination controls to move between
   pages.

## API and State Behavior

- `page_size=25` means each page shows up to 25 entries.
- Pagination controls are not shown when `count <= 25`.
- Page changes update the request and reset scroll to the top.

## Load / Error / Empty States

- Loading: there is no explicit loading message in this page shell.
- Error: API failures are not surfaced as a dedicated page-level error banner.
- Empty: when the API returns zero rows for a valid request, the shared
  `Nothing here yet` empty-state UI appears.

## Edge Cases

- On iOS outside the U.S., the Hub card may be hidden by regional logic; direct URL
  navigation still opens the page.
- The open route remains available even if the Hub card is hidden.

## Related Pages

- [Open Data Hub](feature-open-data-hub.md)
- [Consolidated Network Metrics Downloads](feature-network-metrics-downloads.md)
- [Network API Endpoint Docs (`/subscriptions/uploads`)](../api-tool/feature-memes-subscriptions-report.md)
- [Open Data Index](README.md)
- [Docs Home](../README.md)
