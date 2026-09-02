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
- `Rank`: `Overview` -> `Groups` -> `Schedule` -> `Drops` -> `Rules` ->
  `Voting` -> `Outcomes` -> `Description`
- `Approve`: `Overview` -> `Groups` -> `Schedule` -> `Drops` -> `Rules` ->
  `Voting` -> `Outcomes` -> `Description`

## Entry Points

- Continue from `Overview` to `Groups`.
- Use `Back` from later steps to return to `Groups`.
- On large screens, reopen `Groups` from the step rail after you move past it.

## What You Configure

- All access and moderation rows are visible when the step opens. Each row
  groups its permission name, current scope, and related actions so the page can
  be scanned from `Visibility` through `Admins` without opening a disclosure.
- Helper copy clarifies that `Visibility` controls who can access the wave,
  and that followers who can view the wave may get a notification when it is
  created.
- `Chat` rows: `Visibility`, `Who can chat`, `Admins`
- `Rank` and `Approve` rows: `Visibility`, `Who can drop`, `Who can vote`,
  `Who can chat`, `Admins`
- `Rank` and `Approve` only:
  - `Enable chat` toggle controls whether `Who can chat` is editable
- All wave types:
  - `Allow admins to delete posts` toggle sets admin delete permission
- Defaults:
  - `Public` for view/drop/vote/chat
  - `Only me` for admin when creating a top-level wave
  - the parent wave's admin group when creating a subwave
  - `Allow admins to delete posts` is enabled by default

## Group Picker Behavior

- Each access row offers `Edit criteria` and `Choose group`. `Edit criteria`
  opens the criteria editor, where `Identities` remains available alongside the
  rule choices. The identity editor supports both explicitly included and
  explicitly excluded identities.
- The criteria editor includes a `Hide criteria and members` switch. Its
  tooltip explains that the criteria and member list remain visible to members
  of the group but are hidden from everyone else. The switch is off for a new
  inline group and keeps the saved privacy setting when criteria are copied
  from the row's current group. `Create and use new group` saves its current
  setting with the new group.
- For either identity treatment, users can search for profiles, import every
  wallet from one EMMA allowlist, or drag and drop/select a CSV file. EMMA and
  CSV choices remain attached to the unsaved group when the identity editor is
  closed and reopened.
- Wallets from profile search, EMMA, and CSV are normalized and deduplicated.
  If the same wallet is later added to the opposite treatment, the latest
  action wins so it is not both included and excluded.
- The identity editor shows the unique total for the active treatment. Inline
  groups can include up to 10,000 identities and exclude up to 1,000.
- Inline identity search shows exact, prefix, and substring profile-handle
  matches in that order before ENS-only matches, and orders each match group by
  profile level, highest first.
- Opening `Edit criteria` starts a pending replacement for that row. `Next`
  remains disabled until the user applies it with `Create and use new group`,
  abandons it with `Discard draft`, or selects a saved group with `Choose
group`. Navigating away from `Groups`, including moving backward from the
  step rail, also clears the pending replacement.
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
- A public row shows `Public` without a `Current group` heading. A selected
  saved group shows the `Current group` heading, its current member total as
  `1 user` or `X users`, and a readable summary of the active criteria,
  including thresholds and explicit include or exclude counts. Its generated
  group name is not shown in this summary. Use `View members` to inspect the
  matches without leaving wave creation.
- The member browser opens as a centered dialog on larger screens and a tall
  sheet on smaller screens. It shows 20 identities per page, supports search by
  handle or wallet, links each identity to its profile in a new tab, and keeps
  the group's criteria available under `Why these identities qualify`.
- Membership is a live result rather than a frozen list. The member browser
  notes that profile, reputation, and ownership changes can change who matches
  the group.
- Inline identity groups use access-group wording and warn when the connected
  creator is excluded, because excluding yourself from a `Visibility` group
  can prevent you from opening the created wave.
- New inline groups include the connected creator by default, including groups
  composed only from rules. `Include me` can be switched off while editing
  identities. Choosing a saved group preserves that group's own membership
  instead of adding the creator to it.
- When an unsaved inline group has a valid identity or rule configuration, use
  `Preview matches` to evaluate and browse its current matches before creating
  the group. The pending-group card spells out the configured criteria rather
  than showing only a rule count. Previewing does not save the group or apply
  it to the wave.

## Warnings and State Changes

- When `Visibility` is restricted, every active `Drop`, `Vote`, `Chat`, and
  `Admins` group must contain only people who also belong to the visibility
  group.
- The app checks the active groups together, highlights each incompatible row,
  and keeps `Next` unavailable while the check is running.
- On `Rank` and `Approve`, turning `Enable chat` off disables editing for
  `Who can chat`.
- `Allow admins to delete posts` does not show extra helper text when enabled.

## Failure and Recovery

- If search shows no matches, clear or change search text and retry.
- If an EMMA allowlist cannot load, use `Try again` or remove it and select a
  different allowlist. Authentication is required to read its results.
- CSV import accepts `.csv` files, ignores malformed entries, and reports when
  no valid Ethereum wallet addresses are found. A failed import does not clear
  wallets already added from profile search or EMMA.
- If the current member list cannot load, the member browser keeps the draft
  intact and offers `Try again`.
- If an older saved draft references a group whose criteria are no longer
  available, the member browser stays open, explains that limitation, and
  continues showing any current members the group endpoint can resolve.
- Public waves can leave every scope as `Public`. For a restricted wave,
  `Next` stops on `Groups` if an active permission is `Public` or its selected
  group includes somebody outside `Visibility`.
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
- [Wave Creation Schedule](feature-dates-step.md)
- [Wave Creation Drop Settings](feature-drops-step.md)
- [Wave Creation Rules Step](feature-rules-step.md)
- [Wave Creation Description Step](feature-description-step.md)
- [Wave Right Sidebar Group and Curation Management](../sidebars/feature-right-sidebar-group-management.md)
- [Network Group Scope Flow](../../network/flow-network-group-scope.md)
- [Docs Home](../../README.md)
