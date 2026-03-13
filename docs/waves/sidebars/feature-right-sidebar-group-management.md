# Wave Right Sidebar Group and Curation Management

## Overview

The wave right sidebar `About` content shows wave metadata (`Type`, `Creator`)
and editable scope rows for who can view, drop, vote, chat, and administer a
wave.

For chat waves, the `Voting` metadata row is hidden, so the `About` block shows
`Type` and `Creator` without a vote summary.

Eligible editors can use `Group options` to add, change, or remove scope groups
and to include or exclude individual identities without leaving the current
wave view.

For non-chat waves, the same panel also includes `Curation Groups` management.
Curated groups drive curation tagging in curation-capable leaderboard waves.

## Location in the Site

- Wave routes: `/waves/{waveId}`
- Messages with a selected wave: `/messages?wave={waveId}`
- Mobile wave `About` view uses the same group-management content.
- In rank waves, this appears inside the right-sidebar `About` tab.

## Entry Points

- Open a wave and open the right sidebar.
- On rank waves, select `About`.
- In `General` or `Curation Groups`, open the gear menu (`Group options`) on a
  row.

## User Journey

1. Open the right-sidebar groups area.
2. Review `General` scope rows (`View`, `Drop`, `Vote`, `Chat`, `Admin`).
3. Open `Group options` for the scope row you want to edit.
4. Choose one action:
   - `Include identity`
   - `Exclude identity`
   - `Add group` / `Change group`
   - `Remove group` (not available for `Admin`)
5. For include/exclude, search for an identity and confirm.
6. The row refreshes after success and shows updated scope state.
7. On non-chat waves, use `Curation Groups` rows and `Add group` for additional
   curation-group management.

## Common Scenarios

- Restrict `Drop` or `Vote` to a specific group from the right sidebar.
- Add one identity quickly to a scoped group without opening full group-edit
  workflows.
- Exclude an identity from an existing scoped group.
- Return a scope to open access by removing its assigned group.
- Add or update curation groups in non-chat waves.

## Edge Cases

- `Admin` scope does not offer `Remove group`.
- If a scope uses a direct-message group, edit controls are not shown for that
  row.
- In `General`, `Include identity` and `Exclude identity` are shown only when
  the user can edit the wave and is either a wave admin or the current scope
  group's author.
- Hidden groups display `Hidden` instead of a linked group name.
- `Curation Groups` is not shown on chat waves.
- The `Voting` metadata row in the `About` block is omitted for chat waves.
- Identity suggestions open after at least 3 typed characters.
- Keyboard navigation is supported in identity suggestions (`ArrowUp`,
  `ArrowDown`, `Enter`).
- Curation groups are managed separately from access scope rows and do not alter
  general wave visibility by themselves.

## Failure and Recovery

- If authentication is canceled or fails, no group change is applied.
- If an update request fails, an error toast is shown and current scope settings
  remain unchanged.
- If curation-group loading fails, the section shows `Unavailable`; users can
  retry by reloading the wave.
- When include/exclude identity limits are reached, users see validation errors
  instead of a partial update.

## Limitations / Notes

- Editing controls are unavailable in proxy profile sessions.
- Curation-group actions (`Add group`, include/exclude, change, remove) are
  available only when the user can edit that wave.
- Include/exclude identity limits are enforced per group:
  - Include list max: `10,000` identities
  - Exclude list max: `1,000` identities
- Include/exclude actions update group configuration and then re-apply that
  group to the wave scope.

## Related Pages

- [Waves Index](../README.md)
- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Wave Creation Group Access and Permissions](../create/feature-groups-step.md)
- [Groups List Filters](../../groups/feature-groups-list-filters.md)
- [Docs Home](../../README.md)
