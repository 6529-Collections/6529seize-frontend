# Wave Creation Group Access and Permissions

## Overview

Use `Groups` to set who can view, drop, vote, chat, and administer a wave.
This step is user-reachable for `Chat` and `Rank`.

## Location in the Site

- Full-page create route: `/waves/create`
- Desktop modal create route mode: `?create=wave` on `/waves`,
  `/waves/{waveId}`, `/messages`, and `/messages?wave={waveId}`
- Step label: `Groups`
- `Approve` is shown in `Overview` but disabled

## Step Paths

- `Chat`: `Overview` -> `Groups` -> `Description`
- `Rank`: `Overview` -> `Groups` -> `Dates` -> `Drops` -> `Voting` ->
  `Outcomes` -> `Description`

## Entry Points

- Continue from `Overview` to `Groups`.
- Use `Back` from later steps to return to `Groups`.
- On large screens, reopen `Groups` from the step rail after you move past it.

## What You Configure

- `Chat` rows: `Who can view`, `Who can chat`, `Admin`
- `Rank` rows: `Who can view`, `Who can drop`, `Who can vote`, `Who can chat`,
  `Admin`
- `Rank` only:
  - `Enable chat` toggle controls whether `Who can chat` is editable
- `Chat` and `Rank`:
  - `Allow admins to delete posts` toggle sets admin delete permission
- Defaults:
  - `Anyone` for view/drop/vote/chat
  - `Only me` for admin
  - `Allow admins to delete posts` is enabled by default

## Group Picker Behavior

- Focus `Search groups…` to open suggestions.
- Empty input fetches default suggestions; typed input filters results.
- Suggestions are capped at `7`.
- Loading state shows a spinner.
- No-match state shows `No groups found`.
- Keyboard controls in the list:
  - `ArrowDown` / `ArrowUp` move active selection with wrap-around
  - `Enter` selects the active row
  - `Escape` closes the list
- Clicking outside closes the list.
- Typing in a row that already has a selected group clears that selection until
  a new group is picked.
- Clear control (`x`) resets the row to its default scope.
- Helper text under each row shows `Selected: <group>` or `Default: <scope>`.

## Warnings and State Changes

- If both `Who can view` and `Admin` are set to explicit groups, `Warning:
  Limited Access` appears.
- On `Rank`, turning `Enable chat` off disables editing for `Who can chat`.
- `Allow admins to delete posts` does not show extra helper text when enabled.

## Failure and Recovery

- If search shows no matches, clear or change search text and retry.
- No group selection is required to leave `Groups` and continue.
- If no explicit admin group is selected, submit tries to create and publish a
  personal admin group (`Only {handle}` / `Only Me`).
- If admin-group creation fails (for example missing primary wallet), submit
  stops on create-wave; fix prerequisites and retry.

## Limitations / Notes

- `Groups` only selects existing groups; it does not create or edit groups.
- `Approve` is disabled in the type picker, so approve-specific group settings
  are not user-selectable in normal UI flow.

## Related Pages

- [Wave Creation Index](README.md)
- [Waves Index](../README.md)
- [Wave Creation Overview Step](feature-overview-step.md)
- [Wave Creation Dates and Timeline](feature-dates-step.md)
- [Wave Creation Drop Settings](feature-drops-step.md)
- [Wave Creation Description Step](feature-description-step.md)
- [Wave Right Sidebar Group and Curation Management](../sidebars/feature-right-sidebar-group-management.md)
- [Groups List Filters](../../groups/feature-groups-list-filters.md)
- [Docs Home](../../README.md)
