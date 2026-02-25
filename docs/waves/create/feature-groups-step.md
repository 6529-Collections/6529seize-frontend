# Wave Creation Group Access and Permissions

## Overview

The `Groups` step in wave creation sets access and permission scopes for who can
view, submit drops, vote/rate, chat, and administer a wave.

## Location in the Site

- Full-page wave creation flow: `/waves/create`
- Create-wave modal flows that reuse the same step sequence
- Step label: `Groups`
- Available for all wave types (`Chat`, `Rank`, and `Approve`)

## Entry Points

- Start a new wave and continue from `Overview` to `Groups`.
- Select `Groups` from the create-wave step rail to revisit access settings.
- Return to `Groups` from later steps before finishing wave creation.

## User Journey

1. Open the `Groups` step.
2. Review the available permission rows for the selected wave type:
   - `Chat`: `Who can view`, `Who can chat`, `Admin`
   - `Rank` and `Approve`: `Who can view`, `Who can drop`, `Who can vote`,
     `Who can chat`, `Admin`
3. Focus `Search groups…` in a row to open suggestions.
4. Type a group name to filter matches.
5. Select a group from the list (pointer click or keyboard selection).
6. Repeat for any other permission rows that should be restricted.
7. Use the clear control on a selected row to return that row to its default
   scope.
8. Continue to the next step:
   - `Dates` for `Rank` and `Approve`
   - `Description` for `Chat`

## Common Scenarios

- Leave `Who can view` as default (`Anyone`) for an open/public-style wave.
- Restrict visibility by selecting a specific group in `Who can view`.
- Use different groups for `Who can drop` and `Who can vote` in `Rank` or
  `Approve` waves.
- Enable chat on non-chat waves and scope `Who can chat` to a smaller group.
- Keep admin access at the default (`Only me`) or assign an explicit admin
  group.

## Edge Cases

- Group suggestions are limited to the first 7 matches.
- If no group matches the current search text, the picker shows `No groups
  found`.
- Keyboard navigation is supported in the suggestion list:
  - `ArrowDown` / `ArrowUp` move active selection (with wrap-around)
  - `Enter` selects the active group
  - `Escape` closes the list
- Clicking outside the picker closes the suggestion list.
- Typing into a field that already has a selected group clears that selected
  scope until a new group is selected.
- On non-chat waves, turning `Enable chat` off disables editing for `Who can
  chat`.
- If both `Who can view` and `Admin` are restricted to groups, the step shows a
  limited-access warning.

## Failure and Recovery

- While group results are loading, the picker shows a loading spinner.
- If search returns no matches, adjust or clear the search text and try again.
- If wave submission reaches completion without an explicit admin group, wave
  creation still requires a valid primary wallet for default admin-group
  handling. If no primary wallet is available, creation stops with an error
  message and users can fix wallet setup before retrying.
- If admin-group setup fails during submit, wave creation does not finish and
  users stay in the creation flow to retry.

## Limitations / Notes

- The `Groups` step assigns existing groups only; it does not create or edit
  groups.
- Helper text under each row always shows either `Selected: <group name>` or
  `Default: <scope>`.
- Defaults are `Anyone` for view/drop/vote/chat and `Only me` for admin.
- The step is permission-scoping UI; it does not expose extra validation rules
  beyond wave-type constraints.

## Related Pages

- [Waves Index](../README.md)
- [Wave Creation Dates and Timeline](feature-dates-step.md)
- [Wave Creation Drop Settings](feature-drops-step.md)
- [Wave Right Sidebar Group and Curation Management](../sidebars/feature-right-sidebar-group-management.md)
- [Groups List Filters](../../groups/feature-groups-list-filters.md)
- [Docs Home](../../README.md)
