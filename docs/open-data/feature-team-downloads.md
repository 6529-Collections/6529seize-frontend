# Team Downloads

Parent: [Open Data Index](README.md)

## Overview

`/open-data/team` renders a static list of team data exports.

The page reuses shared download UI primitives but does not fetch live results from an
API; the exported links are currently hardcoded in the client component.

## Location in the Site

- Route: `/open-data/team`
- Hub route: `/open-data`
- Sidebar path: `Tools -> Open Data -> Team`

## Entry Points

- Open the `Team` card on `/open-data`.
- Open `/open-data/team` directly.

## User Journey

1. Open `/open-data/team`.
2. The page renders a heading: `Team Downloads`.
3. A table appears with:
   - `Date`
   - `Link`
4. Click a link to open the destination file in a new browser tab.

## Data Source and Shape

- Source: `TeamDownload[]` is defined inline in
  `components/community-downloads/CommunityDownloadsTeam.tsx`.
- Each row contains `created_at` and `url`.
- Dates are normalized through `formatDate`, then displayed in browser-local
  `Date.toDateString()` style output.

## Load, Empty, and Error Behavior

- No loading state is shown, because the dataset is local and static in the component.
- No fetch-level API error state exists for this route.
- If a future code change sets the row list to `undefined`, the shared table shell
  returns nothing.
- If the row list is empty, the shared download helper falls back to the shared
  `Nothing here yet` empty state.

## Limitations / Notes

- There is no sorting, filtering, or pagination for this page.
- Link targets are external URLs.
- Updating this page requires a code change, not a backend configuration change.

## Related Pages

- [Open Data Hub](feature-open-data-hub.md)
- [Open Data Index](README.md)
