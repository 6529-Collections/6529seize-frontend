# Network Group Scope Flow

Parent: [Network Index](README.md)

## Overview

`/network` can be scoped by one group via the `group` query parameter.
The main entry path is from a group card in `/network/groups`, which opens a
stable network view at `/network?page=1&group={groupId}`.

## Location in the Site

- Route: `/network`
- Filtered entry links: `/network?page=1&group={groupId}`
- Scope controls:
  - Group cards on `/network/groups`
  - `Filter` drawer on `/network` (`Groups` list)

## Entry Points

- Open `/network/groups`, activate a group card to jump directly to `/network?page=1&group={groupId}`.
- Open a deep link that already includes `group={groupId}`.
- Open `/network`, then `Filter`, and pick a group from the list.

## User Journey

1. Open `/network/groups`.
2. Open a group card while it is in an idle state.
3. The app navigates to `/network?page=1&group={groupId}`.
4. On first load, `NetworkPageLayout` copies `group` into active group state.
5. On `/network`, open the filter panel to verify selected scope.
6. Changing or clearing the active group updates the URL and keeps users on the
   scoped route context.

## Common Scenarios

- Jump directly from a group card to a scoped identity leaderboard.
- Return to a scoped view by re-opening a saved `/network?page=1&group=...` URL.
- Pivot scope from the filter panel while preserving sort intent and table context.

## Edge Cases

- Group card activation is unavailable while a group card is in `Rep all`/`NIC all`.
- Scope changes driven by the filter panel are reflected in query state.
- Changing scope resets pagination to page `1`.
- The UI keeps one group filter in scope at a time.

## Failure and Recovery

- If the scoped query returns no rows, clearing scope from the filter panel
  returns to the global leaderboard.
- If a stale `group` ID is in the URL, reselecting or removing scope via the
  filter panel replaces it with a fresh value.
- If a card link is inaccessible, using the same group through `Filter` is the
  equivalent recovery path.

## Limitations / Notes

- Filter scope is persisted in the URL only; no local session-only scope override
  exists.
- Filter membership counts in the network sidebar can refresh asynchronously after
  scope changes.

## Related Pages

- [Network Index](README.md)
- [Network Identities Leaderboard](feature-network-identities-leaderboard.md)
- [Groups Index](../groups/README.md)
- [Groups List Filters](../groups/feature-groups-list-filters.md)
- [Group Card Keyboard Navigation and Actions](../groups/feature-group-card-keyboard-navigation-and-actions.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
