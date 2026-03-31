# Team Downloads

Parent: [Open Data Index](README.md)

## Overview

`/open-data/team` shows fixed team export links.
The page heading is `Team Downloads`.

## Location in the Site

- Route: `/open-data/team`
- Hub route: `/open-data`
- Desktop sidebar path: `Tools -> Open Data -> Team`
- Mobile sidebar path: `Tools -> Open Data`, then open the `Team` card.
- Direct route: `/open-data/team`

## What You See

- Table columns:
  - `Date`
  - `Link`
- `Date` renders as a calendar date.
- `Link` shows the file URL and opens it in a new tab.
- The route uses a hard-coded list (no dataset API request).
- The route currently renders three fixed rows.
- Row order follows the hard-coded list (no automatic date sorting).

## User Flow

1. Open `/open-data/team`.
2. Review the table rows.
3. Open a `Link` value to open the file URL in a new tab.

## States and Recovery

- Loading banner: none.
- API error banner: none.
- Empty state: `Nothing here yet` appears only if the hard-coded list becomes
  empty.
- If a link does not open, allow new tabs/popups and retry.

## Limits

- No pagination, sorting, or filtering is available.
- Updating links requires a code change and deploy.

## Related Pages

- [Open Data Hub](feature-open-data-hub.md)
- [Open Data Hub to Dataset Routes](flow-open-data-hub-to-download-routes.md)
- [Open Data Routes and Download States](troubleshooting-open-data-routes-and-downloads.md)
