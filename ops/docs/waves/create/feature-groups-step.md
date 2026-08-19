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

- Each access row offers `Replace criteria` and `Choose group`. `Replace
  criteria` opens the criteria editor, where `Add identity` appears alongside
  the rule choices instead of as a separate row-level action. The identity
  search uses `Back to criteria` to return to those choices.
- Opening `Replace criteria` starts a pending replacement for that row. `Next`
  remains disabled until the user applies it with `Create and use new group`,
  abandons it with `Discard draft`, or selects a saved group with `Choose
  group`.
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
- A selected saved group also shows how many identities are currently eligible.
  Use `View members` to inspect the current identities without leaving wave
  creation.
- The member browser opens as a centered dialog on larger screens and a tall
  sheet on smaller screens. It shows 20 identities per page, supports search by
  handle or wallet, links each identity to its profile in a new tab, and keeps
  the group's criteria available under `Why these identities qualify`.
- Membership is a live result rather than a frozen list. The member browser
  notes that profile, reputation, and ownership changes can change who matches
  the group.
- Inline identity groups use access-group wording and warn when the connected
  creator is excluded, because excluding yourself from a `Who can view` group
  can prevent you from opening the created wave.
- New inline groups include the connected creator by default, including groups
  composed only from rules. `Include me` can be switched off while editing
  identities. Choosing a saved group preserves that group's own membership
  instead of adding the creator to it.
- When an unsaved inline group has a valid identity or rule configuration, use
  `Preview matches` to evaluate and browse its current matches before creating
  the group. Previewing does not save the group or apply it to the wave.

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
- If the current member list cannot load, the member browser keeps the draft
  intact and offers `Try again`.
- If an older saved draft references a group whose criteria are no longer
  available, the member browser stays open, explains that limitation, and
  continues showing any current members the group endpoint can resolve.
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
