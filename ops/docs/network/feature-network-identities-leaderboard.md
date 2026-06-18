# Network Identities Leaderboard

Parent: [Network Index](README.md)

## Overview

`/network` is the main Network identities leaderboard.
It is a read-only ranking route with sorting, group scope filtering, pagination, and profile links.

## Location in the Site

- Route: `/network`
- Sidebar path: `Network -> Identities`
- Query params:
  - `page` (page number)
  - `sort-by` (UI options: `level`, `tdh`, `xtdh`, `rep`, `cic`)
  - `sort-direction` (`asc`, `desc`)
  - `group` (group id)
- URL-only advanced `sort-by` values are also accepted:
  - `display`, `tdh_rate`, `xtdh_rate`, `xtdh_outgoing`, `xtdh_incoming`,
    `combined_tdh`, `combined_tdh_rate`

## Entry Points

- Open `Network -> Identities` from the sidebar.
- Open `/network` directly.
- Open a deep link, for example `/network?page=1&group={groupId}`.
- Open a group card from `/network/groups` to land on `/network?page=1&group={groupId}`.

## Controls and URL State

- `Filter` opens the group filter panel.
- `Sort` button is shown on small screens; desktop sorting is done by clicking table headers.
- Clicking the same sort field toggles direction; switching to a different field starts at descending.
- Changing sort or group scope resets `page` to `1`.
- `Nerd view` opens `/network/nerd`.
- URL/state sync rules:
  - First mount: `group` in the URL is copied into active Network group scope.
  - After first mount: active group scope is the source of truth and syncs back into the URL.
  - Shared URLs preserve sort and scope query values.

## User Journey

1. Open `/network`.
2. (Optional) open `Filter` and pick a group scope.
3. Sort by `Level`, `TDH`, `xTDH`, `REP`, or `NIC`.
4. Move through pages with pagination when more than one page exists.
5. Open a profile from a row/card.
6. Open `Nerd view` when you need the alternate leaderboard.

## Data and Display Behavior

- Desktop uses a table; small screens use cards.
- Table/card rank is continuous across pages.
- Profile links use `detail_view_key` and can point to handle routes or address routes.
- `TDH` and `xTDH` show compact values; desktop cells include hover tooltips with value and rate.
- `Last Seen` is shown only when activity timestamp is available.

## Edge Cases

- Missing/invalid `sort-by` falls back to `level`.
- Missing/invalid `sort-direction` falls back to descending.
- Missing/non-numeric `page` falls back to `1`.
- Changing `group` in the URL after first mount does not reapply scope automatically.
- If `page` is higher than the available page count, the UI rewrites it to the last page.
- When total results are `0`, the UI resets to page `1`.

## Loading, Empty, Error, Recovery

- Initial load shows the leaderboard skeleton.
- Query changes keep previous rows visible while new data fetches.
- If a fetch returns an empty result, the table/card container stays visible with no row items.
- Pagination is hidden when only one page exists.
- There is no route-level inline error banner or retry button on `/network`.
- Recovery path:
  - Refresh `/network`.
  - Clear or change `group`, `sort-by`, and `page`.
  - Reopen from `Network -> Identities`.

## Constraints / Notes

- The community leaderboard query size is fixed to `50` rows per page.
- `/network` is read-only; no mutation actions are available on this route.
- Group-scope lifecycle across Network routes is documented here:
  [Network Group Scope Flow](flow-network-group-scope.md).
- `Create A Group` in the filter panel requires a connected wallet with a profile handle.

## Related Pages

- [Network Index](README.md)
- [Network Group Scope Flow](flow-network-group-scope.md)
- [Network Nerd Leaderboard](feature-network-nerd-leaderboard.md)
- [Network Activity Feed](feature-network-activity-feed.md)
- [Network Routes and Health Troubleshooting](troubleshooting-network-routes-and-health.md)
- [Groups List Filters](../groups/feature-groups-list-filters.md)
- [Group Card Keyboard Navigation and Actions](../groups/feature-group-card-keyboard-navigation-and-actions.md)
