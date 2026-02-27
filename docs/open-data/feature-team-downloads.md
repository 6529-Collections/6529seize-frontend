# Team Downloads

Parent: [Open Data Index](README.md)

## Overview

`/open-data/team` shows a static list of team export links.

## Location in the Site

- Route: `/open-data/team`
- Hub route: `/open-data`
- Sidebar path: `Tools -> Open Data -> Team`

## Entry Points

- Open the `Team` card on `/open-data`.
- Open `/open-data/team` directly.

## User Journey

1. Open `/open-data/team`.
2. Review the `Team Downloads` heading and table.
3. Each row includes:
   - `Date`
   - `Link`
4. Open a link to open the file URL in a new tab.

## Data Source and Shape

- Source: static list in the route component.
- Current fields: `created_at` and `url`.
- There are currently three static rows.

## Load, Empty, and Error Behavior

- Loading state: none.
- API error banner: none.
- Empty state: `Nothing here yet` appears only if the static list becomes empty.

## Limitations / Notes

- No pagination, sorting, or filtering is available.
- Updating links requires a client-code change.

## Related Pages

- [Open Data Hub](feature-open-data-hub.md)
- [Open Data Routes and Download States](troubleshooting-open-data-routes-and-downloads.md)
