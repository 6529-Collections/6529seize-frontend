# Network Group Scope Flow

Parent: [Network Index](README.md)

## Overview

`/network` and `/network/activity` can use one active group scope.
`/network` is the control surface (URL + filter controls).
`/network/activity` consumes active scope but does not expose scope controls.

## Location in the Site

- Routes: `/network`, `/network/activity`
- Filtered entry links:
  - `/network?page=1&group={groupId}`
  - `/network/activity?group={groupId}`
- Scope controls live on `/network`:
  - Group cards on `/network/groups`
  - `Filter` drawer (`Groups` list)

## Entry Points

- Open `/network/groups`, activate a group card to jump directly to `/network?page=1&group={groupId}`.
- Open a deep link that already includes `group={groupId}`.
- Open `/network`, then `Filter`, and pick a group from the list.
- Open `/network/activity` after scope is already active to inspect scoped logs.

## User Journey

1. Open `/network/groups`.
2. Open a group card while it is in an idle state.
3. The app navigates to `/network?page=1&group={groupId}`.
4. `NetworkPageLayout` copies `group` into active group state on first load.
5. `/network` syncs active scope back into URL query.
6. Open `/network/activity` to review activity under the same active scope.
7. Clear scope from `/network` filter controls to return to global results.

## Common Scenarios

- Jump directly from a group card to a scoped identity leaderboard.
- Validate the same group scope across `/network` and `/network/activity`.
- Return to a scoped view by re-opening a saved deep link with `group=...`.

## Edge Cases

- Group card activation is unavailable while a group card is in `Rep all`/`NIC all`.
- `/network/activity` has no inline scope controls or scope badge.
- `/network/activity` can still be scoped when URL has no `group` query, if active
  scope already exists in app state.
- Changing scope resets pagination to page `1`.
- The UI keeps one group filter in scope at a time.

## Failure and Recovery

- If `/network/activity` looks unexpectedly scoped, open `/network`, clear group
  scope in `Filter`, then retry.
- If a stale `group` ID is in URL, reselect or remove scope from `/network`
  filter controls.
- If a card link is inaccessible, apply the same group through `/network`
  `Filter`.

## Limitations / Notes

- Scope is not URL-only; active group state can persist across Network routes in
  the same session.
- `/network` is the canonical route for changing scope.
- `/network/activity` consumes active scope and does not manage it.
- Filter membership counts in the network sidebar can refresh asynchronously after
  scope changes.

## Related Pages

- [Network Index](README.md)
- [Network Activity Feed](feature-network-activity-feed.md)
- [Network Identities Leaderboard](feature-network-identities-leaderboard.md)
- [Groups Index](../groups/README.md)
- [Groups List Filters](../groups/feature-groups-list-filters.md)
- [Group Card Keyboard Navigation and Actions](../groups/feature-group-card-keyboard-navigation-and-actions.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
