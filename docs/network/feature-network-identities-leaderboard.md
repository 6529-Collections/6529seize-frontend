# Network Identities Leaderboard

Parent: [Network Index](README.md)

## Overview

`/network` is the community identity leaderboard for Network section users. It shows ranked identities with score columns and supports group filtering and metric sorting.

## Location in the Site

- Route: `/network`
- Sidebar path: `Network -> Identities`
- Deep links are supported with these query params:
  - `page` (for pagination)
  - `sort-by` (`level`, `tdh`, `xtdh`, `rep`, `cic`)
  - `sort-direction` (`asc`, `desc`)
  - `group` (group id)

## Entry Points

- Open `Network -> Identities` from the sidebar.
- Open `/network` directly.
- Open a group-scoped network link, for example:
  `/network?page=1&group={groupId}`.
- Open a group card in `/network/groups` and select it if available.

## User Journey

1. Open `/network`.
2. Use the header controls:
   - Sort by clicking the metric header in desktop tables.
   - Open `Sort` on small screens for mobile sort options.
   - Open `Filter` to apply a group filter.
3. Use row sorting in this order:
   - `Level`, `TDH`, `xTDH`, `REP`, `NIC`.
4. Use pagination controls to move through result pages.
5. Open a row card/profile link to jump to that identity profile.
6. Open `Nerd view` for the alternate detailed route.

## Common Scenarios

- Compare identities with `sort-by` set to `xtdh` to surface top xTDH holders.
- Filter to a group by opening the `Filter` panel and choosing a group.
- Read quick metrics:
  - `TDH` row value plus `TDH Rate` tooltip
  - `xTDH` row value plus `xTDH Rate` tooltip
  - `Last Seen` activity timestamp
- Open profile routes from identity names or avatars.
- Share a stable filter state by copying a `/network?...` URL with query params.

## Edge Cases

- Invalid `sort-by`, `sort-direction`, or `page` values in the URL fall back to defaults.
- Sorting a different column resets to page `1`.
- When group filtering changes, pagination resets to page `1`.
- Values are shown as rounded display values; detailed rate values are shown in hover tooltips.
- `Last Seen` is blank when the backend does not provide an activity timestamp.
- Empty result pages render without rows; when there are no extra pages, pagination controls stay hidden.

## Failure and Recovery

- If the network leaderboard request returns no rows for the selected filter/sort combination, users can clear or change `sort-by`, `page`, or `group` values and reopen `/network`.
- Query changes are reflected in URL state, so users can reload or re-open the same URL to retry the same filtered and sorted view.
- If the app page-level network route encounters a load failure, users can return using `Network -> Identities` and retry from a clean state.

## Limitations / Notes

- The community leaderboard query size is fixed to `50` rows per page.
- Group filter scope is identity-group based and managed by the active group context.
- `/network` remains read-only; it does not include grant creation or mutation actions.

## Related Pages

- [Network Index](README.md)
- [xTDH Rules and Distribution Formula](feature-xtdh-formulas.md)
- [xTDH Network Overview](feature-xtdh-network-overview.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
- [Network Definitions](feature-network-definitions.md)
- [Groups List Filters](../groups/feature-groups-list-filters.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Group Card Keyboard Navigation and Actions](../groups/feature-group-card-keyboard-navigation-and-actions.md)
