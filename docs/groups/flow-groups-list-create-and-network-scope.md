# Groups List, Create, and Network Scope Flow

Parent: [Groups Index](README.md)

## Overview

This flow covers the full `/network/groups` journey: filter the list, create or
clone a group, then open `/network` with one group in scope.

## Location in the Site

- List route: `/network/groups`
- Create deep link: `/network/groups?edit=new`
- Edit/clone deep link: `/network/groups?edit={groupId}`
- Group scope target: `/network?page=1&group={groupId}`

## Entry Points

- Open `Network -> Groups` from the sidebar.
- Open `/network/groups` directly.
- Open a shared `/network/groups` URL with filter or `edit` params.
- Open a seize group link preview and continue to the scoped network route.

## User Journey

1. Open `/network/groups`.
2. (Optional) Apply `By Identity`, `By Group Name`, or `My groups`.
3. (Optional) Open `Create New`, `Edit`, or `Clone`.
4. Configure filters, run `Test`, then run `Create`.
5. Return to base `/network/groups` after `Back`, `Cancel`, or save success.
6. Open a group card to navigate to `/network?page=1&group={groupId}`.
7. In `/network`, keep, switch, or clear group scope from the filter panel.

## Common Scenarios

- Find your own groups fast, then edit one.
- Clone another user’s group, adjust filters, and publish your own copy.
- Test group membership count before publishing.
- Jump from group list to a scoped network leaderboard.

## Edge Cases

- Create/edit requires an authenticated, non-proxy session.
- `By Identity` applies only after selecting a suggestion (3+ typed chars).
- `Rep all` and `NIC all` pause card navigation while active.
- Only one card can run vote-all mode at a time.
- Opening or exiting create/edit clears list query params and returns to base
  `/network/groups`.

## Failure and Recovery

- If create/edit opens list mode, sign in with a non-proxy profile and reopen.
- If list results are empty, clear filters and reapply one at a time.
- If `Test` or `Create` stays disabled, add at least one valid filter and fix
  any min/max range conflicts.
- If group-scoped `/network` shows no rows, clear group scope in `Filter`.

## Limitations / Notes

- The primary save action label is always `Create`, including edit mode.
- Group scope on `/network` is single-select.
- Group filter scope is URL-driven and shareable.

## Related Pages

- [Groups Index](README.md)
- [Groups List Filters](feature-groups-list-filters.md)
- [Group Card Keyboard Navigation and Actions](feature-group-card-keyboard-navigation-and-actions.md)
- [Group Creation and Edit Flow](feature-group-create-and-edit.md)
- [Groups List and Create Actions Troubleshooting](troubleshooting-groups-list-and-create-actions.md)
- [Network Group Scope Flow](../network/flow-network-group-scope.md)
