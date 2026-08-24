# Wave Right Sidebar Group and Curation Management

## Overview

Wave details `Configuration` lets users inspect access groups. Editors can also
manage them in place from the same consolidated view.

Users can:

- review `Visibility`, `Drop`, `Vote`, `Chat access`, and `Admins` scopes
- follow visible `1 user` or `X users` counts to inspect both criteria and
  current members
- add, change, or remove scope groups from row menus
- include or exclude one identity from a scoped group
- create, edit, delete, and reorder wave curations without leaving the thread

## Location in the Site

- Wave thread: `/waves/{waveId}`
- Direct-message thread: `/messages/{waveId}`
- Open Wave details, then select `Configuration`
- Mobile Wave details reuses the same Configuration content

## Entry Points

- Open a wave thread and open the right sidebar.
- Select `Configuration` to inspect or manage access.
- In `Access`, open `Group options` on a row.
- In `Curations`, use the section gear or a curation row gear.

## User Journey

1. Open Wave details from the right sidebar or mobile wave-actions menu.
2. Select `Configuration`, then review the access rows.
3. Check current scope value:
   - no group: `Public`
   - no chat access group: `Public`
   - group hidden from the current viewer: `Private group`
   - public or authorized private group available to the current viewer:
     Configuration shows a linked live `1 user` or `X users` count with a
     concise criteria summary, using `/network?page=1&group={groupId}`
4. Follow a visible group link. Network shows the complete group criteria
   above the current filtered member list.
5. Return with normal browser back navigation when finished inspecting.
6. Editors can open `Group options` on the Configuration row to update it.
7. Choose an available action:
   - `Add group` or `Change group`
   - `Remove group` (not shown for `Admins`)
   - `Include identity` or `Exclude identity` (permission-gated)
8. Complete the modal:
   - group picker for add/change; the current-group card omits the generated
     group name and shows the live `1 user` or `X users` total, readable
     criteria, and `View members` explorer
   - identity search modal for include/exclude
   - confirmation modal for remove
9. Authenticate when prompted.
10. When an identity is included or excluded, the app clones the current group
    and assigns the clone only to the access row whose menu was opened. Other
    access rows and waves that use the original group stay unchanged.
11. Creating replacement criteria also creates a separate group, and choosing
    an existing group changes only the selected access row.
12. The app verifies that an updated `Drop`, `Vote`, `Chat access`, or `Admins`
    group is contained in `Visibility` before saving.
13. After success, the row refreshes.
14. In `Curations`, administrators can create or delete curations, edit their
    name and group, and move them up or down.

## Common Scenarios

- Restrict `Drop` or `Vote` to a specific group.
- Remove a scope group to return that scope to `Public`.
- Include or exclude a specific identity from a scope group.
- Create, edit, delete, or reorder wave curations.

## Edge Cases

- Chat waves show only `Visibility`, `Chat access`, and `Admins`.
- `Chat access` controls who can chat only when chat is enabled; it does not
  show whether chat is currently enabled or disabled.
- Chat waves require chat to stay enabled, so Configuration does not show a
  chat-status enable/disable row. Rank and Approve waves show
  `Chat status` separately from `Chat access`.
- General-row edit controls are hidden for direct-message groups.
- Available group inspection is accessible to read-only wave viewers; it does
  not depend on wave edit permission. An authenticated private-group member or
  creator can inspect that group's criteria and members. Configuration shows
  the current `1 user` or `X users` count instead of the generated group name.
- Scope stubs hidden from the current viewer never render a link, group
  identity, or group metadata.
- If multiple access rows currently share a group, changing identities or
  criteria from one row does not modify the group assigned to the other rows.
- `Admins` does not show `Remove group`.
- In `General`, `Include identity` and `Exclude identity` show only when the
  user can edit the wave and is either wave admin or the scope-group author.
- Curation management is entirely hidden from viewers who cannot edit the wave.
- Curation rows show an unavailable-group label when full group data is missing.
- If no curations exist, administrators see the empty state and the create gear;
  other viewers see no curation selector.
- Identity suggestions start after at least 3 typed characters.
- Identity selection supports `ArrowUp`, `ArrowDown`, and `Enter`.

## Failure and Recovery

- While curations load, the section shows `Loading curations`.
- If the curation request fails, the section shows `Couldn't load curations`.
- If Network cannot load a linked group's criteria, it shows `Group criteria
unavailable` without exposing the group id or treating the scope as public.
- If Network cannot load scoped members, it shows a non-identifying members
  unavailable state instead of retaining results from another group or viewer.
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
- Curation actions are separate from `Visibility`/`Drop`/`Vote`/
  `Chat access`/`Admins` access scope rows.
- Include/exclude limits are enforced per group:
  - include list max: `10,000`
  - exclude list max: `1,000`
- These containment rules apply to general access scopes, not curation groups:
  every member who can drop, vote, chat, or administer must also be
  able to view the Wave.

## Related Pages

- [Waves Index](../README.md)
- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Wave Right Sidebar Trending Drops](feature-right-sidebar-trending-drops.md)
- [Wave Creation Group Access and Permissions](../create/feature-groups-step.md)
- [Group to Network Scope Flow](../../network/flow-network-group-scope.md)
- [Group Create and Edit](../../groups/feature-group-create-and-edit.md)
- [Docs Home](../../README.md)
