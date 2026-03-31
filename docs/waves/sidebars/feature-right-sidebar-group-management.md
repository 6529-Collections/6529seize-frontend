# Wave Right Sidebar Group and Curation Management

## Overview

The right-sidebar `About` content lets users manage wave access groups in place.

Users can:

- review `View`, `Drop`, `Vote`, `Chat`, and `Admin` scopes
- add, change, or remove scope groups from row menus
- include or exclude one identity from a scoped group
- manage non-chat `Curation Groups` without leaving the thread

## Location in the Site

- Wave thread: `/waves/{waveId}`
- Direct-message thread: `/messages?wave={waveId}`
- Rank waves: open the right-sidebar `About` tab
- Non-rank waves: same content in default non-tabbed sidebar layout
- Mobile `About` view reuses the same group-management content

## Entry Points

- Open a wave thread and open the right sidebar.
- On rank waves, select `About`.
- In `General`, open `Group options` on a row.
- In `Curation Groups` (non-chat waves), use `Add group` or row options.

## User Journey

1. Open right-sidebar `About`.
2. Review the `General` rows.
3. Check current scope value:
   - no group: `Anyone`
   - hidden group: `Hidden`
   - visible group: linked name to `/network?page=1&group={groupId}`
4. Open `Group options` on the row to update.
5. Choose an available action:
   - `Add group` or `Change group`
   - `Remove group` (not shown for `Admin`)
   - `Include identity` or `Exclude identity` (permission-gated)
6. Complete the modal:
   - group picker for add/change
   - identity search modal for include/exclude
   - confirmation modal for remove
7. Authenticate when prompted.
8. After success, the row refreshes.
9. On non-chat waves, use the same actions under `Curation Groups`.

## Common Scenarios

- Restrict `Drop` or `Vote` to a specific group.
- Remove a scope group to return that scope to `Anyone`.
- Include or exclude a specific identity from a scope group.
- Add or replace curation groups on non-chat waves.

## Edge Cases

- Chat waves show only `View`, `Chat`, and `Admin`.
- Chat waves do not show `Curation Groups`.
- General-row edit controls are hidden for direct-message groups.
- `Admin` does not show `Remove group`.
- In `General`, `Include identity` and `Exclude identity` show only when the
  user can edit the wave and is either wave admin or the scope-group author.
- In `Curation Groups`, edit controls show only when the user can edit the wave.
- Curation rows fall back to plain text names when full group data is missing.
- If no curation groups exist:
  - editors see only `Add group`
  - read-only viewers see no curation rows or actions
- Identity suggestions start after at least 3 typed characters.
- Identity selection supports `ArrowUp`, `ArrowDown`, and `Enter`.

## Failure and Recovery

- While curation groups load, the section shows `Loading groups`.
- If curation-group fetch fails, the section shows `Unavailable`.
- If authentication fails or is canceled, users see `Failed to authenticate`
  and no changes are applied.
- If a save request fails, an error toast is shown and existing settings stay as-is.
- If include/exclude limits are hit, validation blocks the change before apply.

## Limitations / Notes

- Editing controls require a non-proxy profile with wave edit permission.
- Curation-group actions are separate from `View`/`Drop`/`Vote`/`Chat`/`Admin`
  access scope rows.
- Include/exclude limits are enforced per group:
  - include list max: `10,000`
  - exclude list max: `1,000`

## Related Pages

- [Waves Index](../README.md)
- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Wave Right Sidebar Trending Drops](feature-right-sidebar-trending-drops.md)
- [Wave Creation Group Access and Permissions](../create/feature-groups-step.md)
- [Group to Network Scope Flow](../../network/flow-network-group-scope.md)
- [Group Create and Edit](../../groups/feature-group-create-and-edit.md)
- [Docs Home](../../README.md)
