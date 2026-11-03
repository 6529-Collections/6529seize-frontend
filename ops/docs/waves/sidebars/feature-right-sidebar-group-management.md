# Wave Right Sidebar Group and Curation Management

## Overview

Wave details `Configuration` lets users inspect access groups. Editors can also
manage them in place from the same consolidated view.
Wave Configuration changes shared wave access and chat settings. Competition
entry rules, voting rules, schedules, and awards are managed in the selected
competition’s Settings and remain unchanged when the wave is edited.

Users can:

- review `Visibility`, `Chat access`, and `Admins` scopes; competition entry
  and voting access are managed in competition Settings
- follow visible `1 user` or `X users` counts to inspect both criteria and
  current members
- open a prefilled group editor from a `Visibility`, `Chat access`, or `Admins` gear
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
- In `Curations`, use the section plus button to create a curation, or a row
  gear to manage an existing curation.
- To view a curation, select its name in the
  [wave content tabs](../chat/feature-content-tabs.md) on desktop, mobile web,
  or the native app.

## User Journey

1. Select the wave name to open About, or open the desktop right sidebar.
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
5. When opened from the mobile Wave information sheet, use `Back` in the app
   header or browser Back to return to the same Wave, Configuration tab, and
   scroll position. Network filters do not change that return destination.
   Desktop sidebar links use normal browser back navigation.
6. Editors can select a Configuration access-row gear to open the group editor
   directly. There is no intermediate action menu.
7. The modal opens on `Identities` in the same criteria editor used during wave creation,
   including the privacy row, configured criteria rows, matching
   `Before editing` and `After editing` summaries, and `Save changes`. Wave
   access editors do not offer `Choose group`. The
   selected row's rules, included and excluded identities, NFT requirements,
   grant requirement, and criteria/member privacy setting are prefilled.
8. Continue editing the prefilled criteria or use `Cancel` to discard the
   pending replacement. `View members` remains available for both the saved
   group and a valid draft.
9. Visibility with a group also offers `Make wave public`. The app explains
   that everyone will be able to find and view the wave and requires explicit
   confirmation.
10. When Visibility and Chat access are both public, assigning a Visibility
    group assigns that same group to Chat access in the same save. Admins and
    competition Drop and Vote groups stay unchanged.
11. `Chat access` offers `Use visibility criteria` when its effective criteria
    differ from Visibility. Confirmation changes Chat to the Visibility group;
    when Visibility is public, Chat becomes public too. `Admins` does not offer
    this shortcut. Drop and Vote access are managed in competition Settings.
12. Authenticate when prompted.
13. Saving edited criteria creates a separate group and assigns that copy only
    to the access row whose gear was opened. The original group, other access
    rows, and other waves using it remain unchanged. Choosing an existing group
    also changes only the selected access row, except for the public Chat
    assignment described above.
14. The app verifies that an updated `Chat access` or `Admins`
    group is contained in `Visibility` before saving.
15. After success, the affected rows refresh.
16. In `Curations`, administrators can create or delete curations, edit their
    name and group, and move them up or down.
    On mobile and in the tablet overlay, create and edit use the existing
    information panel at the same height. Group selection stays inside the form.
    Back discards the draft and returns to Configuration; Close or a downward
    header swipe dismisses the panel. Successful saves return to Configuration,
    and failed saves keep the draft open. Desktop forms remain separate dialogs.

## Common Scenarios

- Use competition Settings to inspect or change entry and voting groups.
- Restrict a public wave and public Chat by assigning one Visibility group in
  one save.
- Make Visibility public with confirmation.
- Align Chat access with Visibility in one confirmed action.
- Add or remove included and excluded identities while editing a copied group.
- Create, edit, delete, or reorder wave curations.

## Edge Cases

- Subwave groups can differ from their parent's groups. Before saving a group
  with members outside the parent's audience, a warning explains that those
  members cannot open the subwave. Select `Continue anyway` to save the chosen
  group or `Go back` to keep editing. Groups fully covered by the parent's
  audience need no warning, even when the group itself is different.
- Parent visibility can change while subwaves exist. Opening a subwave always
  requires access to both waves.
- Configuration shows only `Visibility`, `Chat access`, and `Admins` for every
  wave. Competition access rows are omitted.
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
  included by default. The editor can turn off `Include me` from `Identities`.
- Editing an already restricted row preserves its saved included and excluded
  identities instead of adding the editor automatically.
- Visibility also assigns Chat only when both are public before the change.
  If either is already restricted, editing Visibility changes only Visibility
  and normal shared-access containment validation applies. Competition groups
  do not affect this behavior and are never reassigned by a wave edit.
- Curation management is entirely hidden from viewers who cannot edit the wave.
- Curation rows show an unavailable-group label when full group data is missing.
- If no curations exist, administrators see the empty state and the create plus;
  other viewers see no `Curations` management section.
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
- Curation actions are separate from `Visibility`, `Chat access`, and `Admins`
  access scope rows.
- Include/exclude limits are enforced per group:
  - include list max: `10,000`
  - exclude list max: `1,000`
- Wave edits validate shared access scopes: every member who can chat or
  administer must also be able to view the wave. Competition Settings manage
  entry and voting access. Curation groups have separate rules.

## Related Pages

- [Waves Index](../README.md)
- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Wave Right Sidebar Trending Drops](feature-right-sidebar-trending-drops.md)
- [Wave Creation Group Access and Permissions](../create/feature-groups-step.md)
- [Group to Network Scope Flow](../../network/flow-network-group-scope.md)
- [Docs Home](../../README.md)
