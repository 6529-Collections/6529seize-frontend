# Network Group Scope Flow

Parent: [Network Index](README.md)

## Overview

`/network` and `/network/activity` share one active group scope.
`/network` owns scope controls (`Filter`).
`/network/activity` can use active scope, but has no scope controls.
Saved-group search and criteria-based group creation both happen inside the
`/network` filter. There is no standalone Network Groups page.

## Location in the Site

- Routes: `/network`, `/network/activity`
- Scoped handoff links:
  - `/network?page=1&group={groupId}`
  - `/network?group={groupId}`
  - `/network/activity?group={groupId}`
- Scope controls: `/network` -> `Filter` -> criteria builder or `Choose group`

## Entry Points

- Open `/network`, build criteria in `Filter`, or select `Choose group` and
  choose a saved group.
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

1. Open `/network` and select `Filter`.
2. Build and save criteria, or select `Choose group` and choose a saved group.
3. `/network` applies the selected scope and stores its group id in the URL.
   Group links shared from supported app surfaces can also open
   `/network?group={groupId}` directly.
4. Public groups and private groups available to the
   current authenticated member or creator show the selected group's name and
   criteria above its scoped member results.
5. Inspect both how membership is determined and the current member list in the
   same view. Signed-in users can also open `REP everyone matching criteria` or
   `NIC everyone matching criteria` from the summary when the group has active
   criteria.
6. Use `Clear selected group` to close the group summary and return to the
   default Network member view.
7. Open `/network/activity` to view activity under the same scope.
8. Return to `/network`, open `Filter`, then create another criteria-based
   group, choose a saved group, or select `All Network members` to clear scope.

## Common Scenarios

- Keep one scope while moving between `/network` and `/network/activity`.
- Reopen a saved deep link with `group=...` to restore a scoped view on first load.
- Build a one-off Network audience from the same criteria controls available
  during Wave group assignment, then save and apply it without leaving the
  leaderboard.

## Loading and Consistency

- `/network/activity` first server fetch is unscoped, then client refetch applies `group_id` when scope is active.
- Right after load, `/network/activity` can briefly look unscoped before scoped data arrives.
- `/network/activity` does not show an active-group badge. Verify scope on `/network` `Filter`.

## Edge Cases

- Bulk rating actions are not shown for an empty, loading, unavailable, or
  signed-out group scope.
- A stale `group` id deep link can load empty or unexpected results.
- `/network/activity` has no inline control to clear/switch scope.
- Signing out or switching profiles while a group is selected reloads the
  group and member results for the new viewer. Results from the previous viewer
  are not reused.
- Reopening the filter with an active group starts from that group's saved
  criteria. Saving the draft creates a new group rather than changing the
  original group.

## Failure and Recovery

- If `/network/activity` looks unexpectedly scoped, open `/network`, clear scope in `Filter`, then reopen `/network/activity`.
- If a deep link scope is stale, open `/network` and reselect or clear scope.
- If URL edits do not change scope, apply scope through `/network` `Filter`.
- If the selected group's criteria cannot be loaded, use `Try again` in the
  filter sheet. Network does not replace the unavailable group with an empty
  criteria draft.
- If a bulk rating action fails, use the error toast details, confirm the
  required amount and REP category, then reopen the action from `/network`.
- If `/network/activity` looks briefly unscoped, wait for scoped refetch to finish.

## Limitations / Notes

- Scope persists in current app session/tab state, not as URL-only state.
- `/network/activity` consumes scope but does not manage scope.
- Membership counts in `/network` filter can refresh asynchronously after scope changes.
- Private group details are inspectable only when the API makes the full group
  available to the current authenticated member or creator.
- If a group is hidden from the current viewer, deleted, malformed, or
  temporarily unavailable, Network shows a non-identifying unavailable state
  and does not show cached member results from another group or viewer.

## Related Pages

- [Network Index](README.md)
- [Network Activity Feed](feature-network-activity-feed.md)
- [Network Identities Leaderboard](feature-network-identities-leaderboard.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
