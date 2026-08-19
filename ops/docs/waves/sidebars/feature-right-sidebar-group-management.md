# Wave Right Sidebar Group and Curation Management

## Overview

The Wave details `Rules` and `Settings` content lets users inspect access
groups. Editors can also manage them in place from `Settings`.

Users can:

- review `View`, `Drop`, `Vote`, `Chat access`, and `Admin` scopes
- follow visible eligible-member counts to inspect both criteria and current
  members
- add, change, or remove scope groups from row menus
- include or exclude one identity from a scoped group
- manage non-chat `Curation Groups` without leaving the thread

## Location in the Site

- Wave thread: `/waves/{waveId}`
- Direct-message thread: `/messages/{waveId}`
- Rank waves: open Wave details, then select `Rules` or `Settings`
- Non-rank waves: same content in default non-tabbed sidebar layout
- Mobile Wave details reuses the same Rules and Settings content

## Entry Points

- Open a wave thread and open the right sidebar.
- On rank waves, select `Rules` to inspect or `Settings` to manage access.
- In Settings `Access`, open `Group options` on a row.
- In `Curation Groups` (non-chat waves), use `Add group` or row options.

## User Journey

1. Open Wave details from the right sidebar or mobile wave-actions menu.
2. Select `Rules` or `Settings`, then review the access rows.
3. Check current scope value:
   - no group: `Anyone`
   - no chat access group: `Anyone`
   - hidden/private group: `Private group`
   - visible group: linked live eligible-member count to
     `/network?page=1&group={groupId}`
4. Follow a visible group link. Network shows the group criteria above the
   current filtered member list.
5. Return with normal browser back navigation when finished inspecting.
6. Editors can open `Group options` on the Settings row to update it.
7. Choose an available action:
   - `Add group` or `Change group`
   - `Remove group` (not shown for `Admin`)
   - `Include identity` or `Exclude identity` (permission-gated)
8. Complete the modal:
   - group picker for add/change
   - identity search modal for include/exclude
   - confirmation modal for remove
9. Authenticate when prompted.
10. The app verifies that an updated `Drop`, `Vote`, `Chat access`, or `Admin`
   group is contained in `View` before saving.
11. After success, the row refreshes.
12. On non-chat waves, use the same actions under `Curation Groups`.

## Common Scenarios

- Restrict `Drop` or `Vote` to a specific group.
- Remove a scope group to return that scope to `Anyone`.
- Include or exclude a specific identity from a scope group.
- Add or replace curation groups on non-chat waves.

## Edge Cases

- Chat waves show only `View`, `Chat access`, and `Admin`.
- `Chat access` controls who can chat only when chat is enabled; it does not
  show whether chat is currently enabled or disabled.
- Chat waves require chat to stay enabled, so their Settings and Rules panels
  do not show a chat-status enable/disable row. Rank and Approve waves show
  `Chat status` separately from `Chat access`.
- Chat waves do not show `Curation Groups`.
- General-row edit controls are hidden for direct-message groups.
- Visible group inspection is available to read-only wave viewers; it does not
  depend on wave edit permission. The linked value shows the current eligible
  member count instead of the generated group name.
- Hidden/private scope stubs never render a link, group identity, or group
  metadata.
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
- If Network cannot load a linked group's criteria, it shows `Group criteria
  unavailable` without exposing the group id or treating the scope as public.
- If authentication fails or is canceled, users see `Failed to authenticate`
  and no changes are applied.
- If a save request fails, an error toast is shown and existing settings stay as-is.
- If include/exclude limits are hit, validation blocks the change before apply.
- If an access-group edit would add somebody who cannot view the wave, the
  publish or save is rejected and the existing group assignment stays active.
- If the containment check is temporarily unavailable, no Wave access change
  is saved; retry after the service recovers.

## Limitations / Notes

- Editing controls require a non-proxy profile with wave edit permission.
- Curation-group actions are separate from `View`/`Drop`/`Vote`/`Chat access`/
  `Admin` access scope rows.
- Include/exclude limits are enforced per group:
  - include list max: `10,000`
  - exclude list max: `1,000`
- These containment rules apply to general access scopes, not `Curation
  Groups`: every member who can drop, vote, chat, or administer must also be
  able to view the Wave.

## Related Pages

- [Waves Index](../README.md)
- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Wave Right Sidebar Trending Drops](feature-right-sidebar-trending-drops.md)
- [Wave Creation Group Access and Permissions](../create/feature-groups-step.md)
- [Group to Network Scope Flow](../../network/flow-network-group-scope.md)
- [Group Create and Edit](../../groups/feature-group-create-and-edit.md)
- [Docs Home](../../README.md)
