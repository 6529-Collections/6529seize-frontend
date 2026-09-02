# Wave Right Sidebar Group and Curation Management

## Overview

Wave details `Configuration` lets users inspect access groups. Editors can also
manage them in place from the same consolidated view.

Users can:

- review `Visibility`, `Drop`, `Vote`, `Chat access`, and `Admins` scopes
- follow visible `1 user` or `X users` counts to inspect both criteria and
  current members
- open a prefilled group editor directly from each access-row gear
- edit criteria and identities or choose a different existing group
- make wave visibility public or align an eligible access row with Visibility
- create, edit, delete, and reorder wave curations without leaving the thread

## Location in the Site

- Wave thread: `/waves/{waveId}`
- Direct-message thread: `/messages/{waveId}`
- Open Wave details, then select `Configuration`
- Mobile Wave details reuses the same Configuration content

## Entry Points

- Open a wave thread and open the right sidebar.
- Select `Configuration` to inspect or manage access.
- In `Access`, select the gear on a row to open its group editor.
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
6. Editors can select a Configuration access-row gear to open the group editor
   directly. There is no intermediate action menu.
7. The modal renders the same group assignment editor used during wave
   creation, including its `Edit criteria` and `Choose group` actions, privacy
   row, criteria chips, expanded editors, draft summary, and save actions. The
   selected row's rules, included and excluded identities, NFT requirements,
   grant requirement, and criteria/member privacy setting are prefilled.
8. Continue editing the prefilled criteria, or select `Choose group` to assign
   another saved group. `View members` remains available for both the saved
   group and a valid draft.
9. Visibility with a group also offers `Make wave public`. The app explains
   that everyone will be able to find and view the wave and requires explicit
   confirmation.
10. When Visibility, Drop, Vote, and Chat access are all public, assigning a
    Visibility group assigns that same group to Drop, Vote, and Chat access in
    the same save. The Admins group is not changed.
11. `Drop`, `Vote`, and `Chat access` offer `Use visibility criteria` when
    their effective criteria differ from Visibility. Confirmation changes only
    that row to the Visibility group; when Visibility is public, the selected
    row becomes public too. `Admins` does not offer this shortcut.
12. Authenticate when prompted.
13. Saving edited criteria creates a separate group and assigns that copy only
    to the access row whose gear was opened. The original group, other access
    rows, and other waves using it remain unchanged. Choosing an existing group
    also changes only the selected access row, except for the fully public
    Visibility cascade described above.
14. The app verifies that an updated `Drop`, `Vote`, `Chat access`, or `Admins`
    group is contained in `Visibility` before saving.
15. After success, the affected rows refresh.
16. In `Curations`, administrators can create or delete curations, edit their
    name and group, and move them up or down.

## Common Scenarios

- Restrict `Drop` or `Vote` to a specific group.
- Restrict a fully public wave by assigning one Visibility group to all
  non-admin access rows in one save.
- Make Visibility public with confirmation.
- Align Drop, Vote, or Chat access with Visibility in one confirmed action.
- Add or remove included and excluded identities while editing a copied group.
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
- Eligible direct-message participants get the same member count and criteria
  summary for their DM access groups. The generated direct-message group name
  is not used as the visible value.
- Scope stubs hidden from the current viewer never render a link, group
  identity, or group metadata.
- If multiple access rows currently share a group, changing identities or
  criteria from one row does not modify the group assigned to the other rows.
- The Visibility shortcut is omitted when two different groups have equivalent
  criteria and identity lists, and it is never shown for `Admins`.
- A public access row opens a new criteria draft with the editor explicitly
  included by default. The editor can turn off `Include me` from `Identities`,
  and `Choose group` remains available.
- Editing an already restricted row preserves its saved included and excluded
  identities instead of adding the editor automatically.
- The Visibility cascade runs only when Visibility, Drop, Vote, and Chat access
  are all public before the change. If any one of those rows is already
  restricted, editing Visibility changes only Visibility and normal containment
  validation applies.
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
- If a save request fails, an error toast is shown, the editor remains
  available, and existing settings stay as-is.
- If the saved criteria or identity lists cannot be loaded, the editor does not
  substitute empty criteria; it shows a retry state and applies no change.
- If a replacement group is created but cannot be attached to the wave, the
  unattached copy is hidden after the app verifies it is not in use.
- If identity-list limits are hit, validation blocks the change before apply.
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
- [Docs Home](../../README.md)
