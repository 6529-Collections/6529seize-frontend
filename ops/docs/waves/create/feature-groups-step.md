# Wave Creation Group Access and Permissions

## Overview

Use `Groups` to review or customize wave access and permissions, including
viewing, dropping, voting, chatting, and administration where supported. This
step is user-reachable for `Chat`, `Rank`, and `Approve`.

## Location in the Site

- Full-page create route: `/waves/create`
- Desktop modal create route mode: `?create=wave` on `/waves`,
  `/waves/{waveId}`, `/messages`, and `/messages/{waveId}`
- Step label: `Groups`

## Step Paths

- `Chat`: `Overview` -> `Groups` -> `Rules` -> `Description`
- `Rank`: `Overview` -> `Groups` -> `Dates` -> `Drops` -> `Rules` ->
  `Voting` -> `Outcomes` -> `Description`
- `Approve`: `Overview` -> `Groups` -> `Dates` -> `Drops` -> `Rules` ->
  `Voting` -> `Outcomes` -> `Description`

## Entry Points

- Continue from `Overview` to `Groups`.
- Use `Back` from later steps to return to `Groups`.
- On large screens, reopen `Groups` from the step rail after you move past it.

## What You Configure

- All access and moderation rows are visible when the step opens. Each row
  groups its permission name, current scope, and related actions so the page can
  be scanned from `Who can view` through `Admin` without opening a disclosure.
- Helper copy clarifies that `Who can view` controls who can access the wave,
  and that followers who can view the wave may get a notification when it is
  created.
- `Chat` rows: `Who can view`, `Who can chat`, `Admin`
- `Rank` and `Approve` rows: `Who can view`, `Who can drop`, `Who can vote`,
  `Who can chat`, `Admin`
- `Rank` and `Approve` only:
  - `Enable chat` toggle controls whether `Who can chat` is editable
- All wave types:
  - `Allow admins to delete posts` toggle sets admin delete permission
- Defaults:
  - `Anyone` for view/drop/vote/chat
  - `Only me` for admin when creating a top-level wave
  - the parent wave's admin group when creating a subwave
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
- Typing in a row that already has a selected group keeps that current group
  selected until the row is explicitly cleared or a new group is picked.
- Clear control (`x`) resets the row to its default scope.
- Helper text under each row shows `Current group: <group-or-scope>`.
- Inline identity groups use access-group wording and warn when the connected
  creator is excluded, because excluding yourself from a `Who can view` group
  can prevent you from opening the created wave.

## Warnings and State Changes

- When `Who can view` is restricted, every active `Drop`, `Vote`, `Chat`, and
  `Admin` group must contain only people who also belong to the view group.
- The app checks the active groups together, highlights each incompatible row,
  and keeps `Next` unavailable while the check is running.
- `Warning: Limited Access` explains that all privilege-group members must also
  be members of `Who can view`.
- On `Rank` and `Approve`, turning `Enable chat` off disables editing for
  `Who can chat`.
- `Allow admins to delete posts` does not show extra helper text when enabled.

## Failure and Recovery

- If search shows no matches, clear or change search text and retry.
- Public waves can leave every scope as `Anyone`. For a restricted wave,
  `Next` stops on `Groups` if an active permission is open to `Anyone` or its
  selected group includes somebody outside `Who can view`.
- If access cannot be checked, the step stays open and offers a retry through
  `Next`; changing a group also starts a fresh check.
- If no explicit admin group is selected, submit tries to create and publish a
  personal admin group (`Only {handle}` / `Only Me`) for a top-level wave.
- A subwave reuses its parent wave's admin group instead of creating another
  personal group when no different group is selected.
- If a top-level personal admin group cannot be created or made visible, submit
  stops and identifies the failed stage. Add a primary wallet when requested,
  choose an existing admin group, or retry later.
- Submit checks the final group configuration again after authentication and
  before creating a personal admin group or creating the wave.

## Limitations / Notes

- The inline group builder can select an existing group or create an identity,
  NFT, or combined group without leaving wave creation.
- `Approve` uses the same group rows as `Rank`.

## Related Pages

- [Wave Creation Index](README.md)
- [Waves Index](../README.md)
- [Wave Creation Overview Step](feature-overview-step.md)
- [Wave Creation Dates and Timeline](feature-dates-step.md)
- [Wave Creation Drop Settings](feature-drops-step.md)
- [Wave Creation Rules Step](feature-rules-step.md)
- [Wave Creation Description Step](feature-description-step.md)
- [Wave Right Sidebar Group and Curation Management](../sidebars/feature-right-sidebar-group-management.md)
- [Groups List Filters](../../groups/feature-groups-list-filters.md)
- [Docs Home](../../README.md)
