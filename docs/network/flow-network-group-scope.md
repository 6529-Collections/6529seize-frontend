# Network Group Scope Flow

Parent: [Network Index](README.md)

## Overview

`/network` and `/network/activity` share one active group scope.
`/network` owns scope controls (`Filter`).
`/network/activity` can use active scope, but has no scope controls.

`/network/groups` owns group browsing and creation.
This page owns only the scope handoff into network routes and cross-route scope behavior.

## Location in the Site

- Routes: `/network`, `/network/activity`
- Scoped handoff links:
  - `/network?page=1&group={groupId}`
  - `/network?group={groupId}`
  - `/network/activity?group={groupId}`
- Scope controls: `/network` -> `Filter` -> groups list

## Entry Points

- Open a group card on `/network/groups`.
- Open `/network` and choose a group in `Filter`.
- Open a deep link with `group={groupId}`.
- Open `/network/activity` after scope is already active.

## State and URL Rules

- Only one group can be active at a time.
- First mount on `/network` or `/network/activity` reads `group` from the URL and applies scope.
- After first mount on `/network`, active scope is the source of truth and syncs back to the URL.
- On `/network`, changing scope rewrites `page` to `1`.
- `/network/activity` can stay scoped even when its URL has no `group`.
- Changing `group` in the URL after first mount does not reliably switch scope. Use `/network` `Filter`.

## User Journey

1. Open `/network/groups`.
2. Open a group card while it is in idle state.
3. The app opens `/network?page=1&group={groupId}` (or `/network?group={groupId}` from chat links).
4. `/network` applies scope and shows scoped leaderboard results.
5. Open `/network/activity` to view activity under the same scope.
6. Return to `/network`, open `Filter`, then switch or clear scope.

## Common Scenarios

- Jump from a group card to a scoped identities leaderboard.
- Keep one scope while moving between `/network` and `/network/activity`.
- Reopen a saved deep link with `group=...` to restore a scoped view on first load.

## Loading and Consistency

- `/network/activity` first server fetch is unscoped, then client refetch applies `group_id` when scope is active.
- Right after load, `/network/activity` can briefly look unscoped before scoped data arrives.
- `/network/activity` does not show an active-group badge. Verify scope on `/network` `Filter`.

## Edge Cases

- Group-card open navigation is unavailable while that card is in `Rep all` or `NIC all`.
- A stale `group` id deep link can load empty or unexpected results.
- `/network/activity` has no inline control to clear/switch scope.

## Failure and Recovery

- If `/network/activity` looks unexpectedly scoped, open `/network`, clear scope in `Filter`, then reopen `/network/activity`.
- If a deep link scope is stale, open `/network` and reselect or clear scope.
- If URL edits do not change scope, apply scope through `/network` `Filter`.
- If a group card is not openable, exit `Rep all`/`NIC all` first.
- If `/network/activity` looks briefly unscoped, wait for scoped refetch to finish.

## Limitations / Notes

- Scope persists in current app session/tab state, not as URL-only state.
- `/network/activity` consumes scope but does not manage scope.
- Membership counts in `/network` filter can refresh asynchronously after scope changes.

## Related Pages

- [Network Index](README.md)
- [Network Activity Feed](feature-network-activity-feed.md)
- [Network Identities Leaderboard](feature-network-identities-leaderboard.md)
- [Groups Index](../groups/README.md)
- [Groups List Filters](../groups/feature-groups-list-filters.md)
- [Group Card Keyboard Navigation and Actions](../groups/feature-group-card-keyboard-navigation-and-actions.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
