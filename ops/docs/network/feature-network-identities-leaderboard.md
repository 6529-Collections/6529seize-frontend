# Network Identities Leaderboard

Parent: [Network Index](README.md)

## Overview

`/network` is the main Network identities leaderboard. It supports sorting,
on-the-fly criteria-based group filtering, saved-group filtering, pagination,
and profile links.

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

## Controls and URL State

- `Filter` opens the same criteria builder used by Wave group assignment.
  Criteria creation is open by default. `Choose group` provides the secondary
  path for searching and applying an existing saved group.
- Applying new criteria creates a saved group and immediately uses it as the
  Network scope. Choosing `All Network members` clears the group scope.
- When a signed-in user has an active Network scope with at least one
  criterion, the selected-group summary shows `REP everyone matching criteria`
  and `NIC everyone matching criteria` directly below the group name.
- The REP action requires an amount and category. The NIC action requires an
  amount. Both actions show the matching member count and available credit per
  member before `Grant` becomes available.
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
2. (Optional) open `Filter` and build a group with identities, Level, TDH,
   NIC, REP, required NFTs, collection access, or an xTDH grant.
3. Select `Create and use new group` to save and apply the criteria, or select
   `Choose group` to apply an existing saved group.
4. (Optional) use the REP or NIC criteria action in the selected-group summary
   to grant credits to every matching member.
5. Sort by `Level`, `TDH`, `xTDH`, `REP`, or `NIC`.
6. Move through pages with pagination when more than one page exists.
7. Open a profile from a row/card.
8. Open `Nerd view` when you need the alternate leaderboard.

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
- Reopening `Filter` while a group is active prefills that group's criteria,
  included and excluded identities, and criteria/member privacy setting.
  Applying edits creates and selects a new group; it does not mutate the
  previously selected group.
- Bulk REP/NIC actions stay hidden while no criterion is active, while group
  criteria are loading or unavailable, and while signed out.
- Only one bulk rating form is open at a time. `Cancel` returns to the two
  criteria actions without changing the active Network scope.

## Loading, Empty, Error, Recovery

- Initial load shows the leaderboard skeleton.
- Query changes keep previous rows visible while new data fetches.
- If a fetch returns an empty result, the table/card container stays visible with no row items.
- Pagination is hidden when only one page exists.
- There is no route-level inline error banner or retry button on `/network`.
- If the active group's criteria or identity lists cannot be loaded, the
  filter sheet shows a recoverable unavailable state with `Try again` instead
  of opening an empty draft.
- If group creation fails, the filter sheet remains open and an error toast
  explains that the group was not created.
- If bulk rating authentication is cancelled, no credits are sent. A failed
  rating batch closes the form and shows an error toast; a completed action
  shows `Rep distributed.` or `NIC distributed.`.
- Recovery path:
  - Refresh `/network`.
  - Clear or change `group`, `sort-by`, and `page`.
  - Reopen from `Network -> Identities`.

## Limitations / Notes

- The community leaderboard query size is fixed to `50` rows per page.
- Browsing and choosing an existing group remains available without creating a
  group. Creating a criteria-based filter requires wallet authentication.
- Group-scope lifecycle across Network routes is documented here:
  [Network Group Scope Flow](flow-network-group-scope.md).

## Related Pages

- [Network Index](README.md)
- [Network Group Scope Flow](flow-network-group-scope.md)
- [Network Nerd Leaderboard](feature-network-nerd-leaderboard.md)
- [Network Activity Feed](feature-network-activity-feed.md)
- [Network Routes and Health Troubleshooting](troubleshooting-network-routes-and-health.md)
