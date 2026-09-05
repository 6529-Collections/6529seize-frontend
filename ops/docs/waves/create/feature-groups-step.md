# Wave Creation Access and Permissions

## Overview

Use `Access` to choose who can open a wave and, when needed, give different
groups permission to chat, submit, vote, or administer it. This step is
user-reachable for `Chat`, `Rank`, and `Approve` waves.

## Location in the Site

- Full-page create route: `/waves/create`
- Desktop modal create route mode: `?create=wave` on `/waves`,
  `/waves/{waveId}`, `/messages`, and `/messages/{waveId}`
- Step label: `Access`

## Step Paths

- `Chat`: `Overview` -> `Access` -> `Rules` -> `Description`
- `Rank`: `Overview` -> `Access` -> `Schedule` -> `Drops` -> `Rules` ->
  `Voting` -> `Outcomes` -> `Description`
- `Approve`: `Overview` -> `Access` -> `Schedule` -> `Drops` -> `Rules` ->
  `Voting` -> `Outcomes` -> `Description`

## Entry Points

- Continue from `Overview` to `Access`.
- Use `Back` from later steps to return to `Access`.
- On large screens, reopen `Access` from the step rail after moving past it.

## Default Access

- The step initially shows only `Who can access this wave`.
- Helper copy explains that everyone with access can participate by default and
  only the creator can administer the wave.
- Selecting an access group also applies it to chat and, for `Rank` and
  `Approve`, submission and voting.
- `Customize other permissions` expands the less common controls:
  - `Chat`: `Who can chat`, `Admins`
  - `Rank` and `Approve`: `Who can drop`, `Who can vote`, `Who can chat`,
    `Admins`
- The expanded section shows `Customized` and reopens automatically after
  navigating away and back when Admins was changed, a participation group
  differs from access, chat is disabled, or admin deletion is disabled.
- `Enable chat` controls whether `Who can chat` is active on `Rank` and
  `Approve` waves.
- `Allow admins to delete posts` is enabled by default.
- Default scopes are `Everyone` for access, drop, vote, and chat, and `Only me`
  for top-level-wave administration. Subwaves inherit the parent admin group.

## Editing Criteria

- Every wave access row offers one `Edit` action with a pencil icon. Wave access
  editors do not offer `Choose group`.
- `Edit` opens the full criteria builder. `Identities`, `Level`, `TDH`, `NIC`,
  `Rep`, `Required NFTs`, `Collection Access`, and `xTDH Grant` remain directly
  available as prominent buttons.
- A blue dot and stronger button treatment identify each criterion that has a
  value. Screen readers receive the same state as `Configured` in the button
  name.
- While editing, `Before editing` shows the currently applied audience,
  including `Everyone`, and `After editing` shows the proposed audience and
  readable criteria summary.
- `View members` is available in the before/after summaries when membership can
  be evaluated. The member browser is searchable, paginated, links identities
  to their profiles, and explains why identities qualify.
- `Hide criteria and members` makes criteria and membership visible to group
  members but hidden from everyone else. It starts off for a new group and
  preserves the setting copied from an existing assignment.
- `Save changes` creates a new group and assigns it to the row; the existing
  group is not mutated. `Next` remains unavailable while an edit is pending.
- While an edit is open, the header action becomes `Cancel`. Cancel discards
  the draft and restores the applied audience. There is no separate Close,
  Discard draft, or Preview matches action.
- Moving between identity and rule buttons keeps the current draft. Navigating
  to another wizard step clears an unapplied criteria replacement.

## Identity Criteria

- Identities can be explicitly included or excluded through profile search, an
  authenticated EMMA allowlist, or a dragged or selected CSV file.
- Wallets from profile search, EMMA, and CSV are normalized and deduplicated.
  If a wallet is later added to the opposite treatment, the latest action wins.
- The identity editor shows the unique total for the active treatment. Inline
  groups can include up to 10,000 identities and exclude up to 1,000.
- Search orders exact, prefix, and substring profile-handle matches before
  ENS-only matches, then orders each match group by profile level.
- New inline groups include the connected creator by default, including groups
  composed only from rules. `Include me` can be switched off.
- Excluding the creator from the main access group shows a warning because the
  creator may be unable to reopen the wave.

## Permission Shortcuts

- A restricted `Who can access this wave` row offers `Make wave public`.
- At the moment it is selected, the access row changes to `Everyone`. Chat,
  submission, and voting also change to `Everyone` only when each one still
  matches the access group at that moment. Independently customized rows remain
  unchanged. Admins is never changed.
- A customized chat, submission, or voting row offers `Match wave access` when
  it differs from the access row. Selecting it copies the current access group
  into that row and resumes default synchronization for later access changes.

## Validation, Failure, and Recovery

- When wave access is restricted, every active Drop, Vote, Chat, and Admins
  group must contain only people who can also access the wave.
- The app validates active groups together, exposes and highlights incompatible
  rows, and keeps `Next` unavailable while validation runs or fails.
- If current criteria or members cannot load, the editor preserves the draft
  and offers `Try again`. Older saved assignments whose criteria are unavailable
  can still show any current members the group endpoint resolves.
- EMMA load failures offer retry or removal. CSV import accepts `.csv`, ignores
  malformed entries, and reports when no valid Ethereum addresses are found.
- If access cannot be checked, `Next` keeps the step open; changing a group
  starts a fresh check.
- If no admin group is selected, submission creates and publishes a personal
  admin group for a top-level wave. A subwave reuses its parent admin group.
- Submission checks the final group configuration again after authentication
  and before creating the personal admin group or the wave.

## Limitations / Notes

- `Approve` uses the same access rows as `Rank`.
- Group membership is live: profile, reputation, and ownership changes can
  change who matches criteria over time.

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
