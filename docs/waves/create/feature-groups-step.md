# Wave Creation Group Access and Permissions

## Overview

The `Groups` step sets who can view, submit, vote, chat, and administer a
wave.
Current create-wave UI supports `Chat` and `Rank` wave types.

## Location in the Site

- Full-page wave creation flow: `/waves/create`
- Create-wave modal flows that reuse the same step sequence
- Step label: `Groups`
- Available for `Chat` and `Rank` wave creation

## Entry Points

- Start a new wave and continue from `Overview` to `Groups`.
- Select `Groups` from the create-wave step rail to revisit access settings.
- Return to `Groups` from later steps before finishing wave creation.

## User Journey

1. Open the `Groups` step.
2. Review permission rows for the selected wave type:
   - `Chat`: `Who can view`, `Who can chat`, `Admin`
   - `Rank`: `Who can view`, `Who can drop`, `Who can vote`, `Who can chat`,
     `Admin`
3. Focus `Search groups…` in a row to open suggestions.
4. Type a group name to filter matches.
5. Select a group from the list (pointer click or keyboard selection).
6. Use the clear control on a selected row to reset that row to its default
   scope.
7. For `Rank` waves, optionally:
   - toggle `Enable chat` for the chat scope row,
   - toggle `Allow admins to delete drops` in the admin row.
8. Continue to the next step:
   - `Dates` for `Rank`
   - `Description` for `Chat`

## Common Scenarios

- Leave `Who can view` as default (`Anyone`) for an open wave.
- Restrict visibility by selecting a specific group in `Who can view`.
- Use different groups for `Who can drop` and `Who can vote` in `Rank` waves.
- Keep admin access at default (`Only me`) or assign an explicit admin group.
- Enable admin drop deletion for rank waves that need moderator cleanup.

## Edge Cases

- Group suggestions are limited to the first 7 matches.
- If no group matches current search text, the picker shows `No groups found`.
- Keyboard navigation is supported in the suggestion list:
  - `ArrowDown` / `ArrowUp` move active selection (with wrap-around)
  - `Enter` selects the active group
  - `Escape` closes the list
- Clicking outside the picker closes the suggestion list.
- Typing into a row that already has a selected group clears that selection
  until a new group is chosen.
- On rank waves, turning `Enable chat` off disables editing for `Who can chat`.
- If both `Who can view` and `Admin` are restricted, the step shows a
  limited-access warning.

## Failure and Recovery

- While group results are loading, the picker shows a loading spinner.
- If search returns no matches, adjust or clear search text and try again.
- If submit reaches completion without an explicit admin group, creation still
  requires a valid primary wallet for default admin-group handling.
- If admin-group setup fails during submit, creation stops and users stay in
  the flow to retry.

## Limitations / Notes

- The `Groups` step assigns existing groups only; it does not create/edit
  groups.
- Helper text under each row shows either `Selected: <group name>` or
  `Default: <scope>`.
- Defaults are `Anyone` for view/drop/vote/chat and `Only me` for admin.
- The `Approve` type is currently shown as disabled in `Overview`, so
  approve-specific group combinations are not user-selectable.

## Related Pages

- [Waves Index](../README.md)
- [Wave Creation Overview Step](feature-overview-step.md)
- [Wave Creation Dates and Timeline](feature-dates-step.md)
- [Wave Creation Drop Settings](feature-drops-step.md)
- [Wave Right Sidebar Group and Curation Management](../sidebars/feature-right-sidebar-group-management.md)
- [Groups List Filters](../../groups/feature-groups-list-filters.md)
- [Docs Home](../../README.md)
