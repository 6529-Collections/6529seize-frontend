# Groups List, Create, and Network Scope Flow

Parent: [Groups Index](README.md)

## Overview

This page covers the end-to-end journey that starts on `/network/groups` and
hands off to a group-scoped `/network` view.

It owns:
- How users enter and use `/network/groups`
- How list/create/edit transitions work
- How group scope handoff links are produced

It does not own full `/network` filter behavior after handoff. For that, use
[Network Group Scope Flow](../network/flow-network-group-scope.md).

## Location in the Site

- List route: `/network/groups`
- List filter params: `identity`, `group`
- Create deep link: `/network/groups?edit=new`
- Edit/clone deep link: `/network/groups?edit={groupId}`
- Group-card handoff: `/network?page=1&group={groupId}`
- Seize chat-link handoff: `/network?group={groupId}`

## Entry Points

- Open `Network -> Groups` from the sidebar.
- Open `/network/groups` directly.
- Open a shared `/network/groups` URL with `identity`, `group`, or `edit`.
- Open `Create A Group` from the `/network` filter panel.
- Open a seize `/network?group={groupId}` link preview in chat.

## User Journey

1. Open `/network/groups`.
2. Optional: apply `By Identity`, `By Group Name`, or `My groups`.
3. Optional: open `Create New`, `Edit`, or `Clone`.
4. If auth succeeds and proxy mode is off, configure the group, run `Test`
   (optional), then run `Create`.
5. Exit create/edit with `Back`, `Cancel`, or save success.
6. The app returns to base `/network/groups` and clears query params.
7. Open a group card (or seize chat link) to hand off to `/network` with
   `group={groupId}`.
8. On `/network`, `Filter` can keep, switch, or clear group scope (owned by
   [Network Group Scope Flow](../network/flow-network-group-scope.md)).

## Common Scenarios

- Find your own groups fast, then edit one.
- Clone another user’s group, adjust filters, and publish your own copy.
- Test group membership count before publishing.
- Jump from groups list to a scoped network leaderboard.
- Re-open a saved scoped URL to return to the same group filter context.

## Edge Cases

- Create/edit requires an authenticated, non-proxy session.
- `By Identity` applies only after selecting a suggestion (3+ typed chars).
- `Rep all` and `NIC all` pause card navigation while active.
- Only one card can run vote-all mode at a time.
- `?edit={groupId}` and `?edit=new` stay in list mode when auth is unavailable,
  auth is cancelled, or proxy mode is active.
- `Create New` can open without rewriting list params, but exiting create/edit
  always returns to base `/network/groups`.
- Group scope changes on `/network` reset pagination to page `1` and keep one
  active group at a time.

## Failure and Recovery

- If create/edit stays in list mode, sign in with a non-proxy profile and
  reopen `Create New`, `Edit`, or `Clone`.
- If list results are empty, clear filters and reapply one at a time.
- If `Test` or `Create` is disabled, add at least one valid filter and fix
  range or wallet-limit conflicts.
- If scoped `/network` shows no rows, open `Filter` and change or clear group
  scope.
- If a scope link is stale, reselect a valid group from `Filter`.

## Limitations / Notes

- The primary save action label is always `Create`, including edit mode.
- Group scope is URL-driven and shareable.
- `/network` group scope is single-select.
- `/network/groups` has no dedicated inline fetch-error state; failed loads can
  look like an empty result set.

## Related Pages

- [Groups Index](README.md)
- [Groups List Filters](feature-groups-list-filters.md)
- [Group Card Keyboard Navigation and Actions](feature-group-card-keyboard-navigation-and-actions.md)
- [Group Creation and Edit Flow](feature-group-create-and-edit.md)
- [Groups List and Create Actions Troubleshooting](troubleshooting-groups-list-and-create-actions.md)
- [Network Group Scope Flow](../network/flow-network-group-scope.md)
