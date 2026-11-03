# Wave Creation Access and Permissions

## Overview

Use `Access` to choose who can open a wave and, when needed, give different
groups permission to chat or administer it. Standalone `Chat`
waves show these controls inside `Optional settings` on the first screen.
Subwaves use a separate `Access` step. Competition submission and voting groups
are configured separately in [competition setup](../competitions/feature-manage-competitions.md).

## Location in the Site

- Full-page create route: `/waves/create`
- Desktop modal create route mode: `?create=wave` on `/waves`,
  `/waves/{waveId}`, `/messages`, and `/messages/{waveId}`
- Guided step label: `Access`

## Step Paths

- Standalone `Chat`: `Start a chat wave` -> `Review`
- Chat subwave: `Setup` -> `Access` -> `Guidelines` -> `Description` -> `Overview`

## Entry Points

- Standalone Chat: expand `Optional settings` on the first screen. From Review,
  use `Previous` to return to that screen.
- Guided creation: continue from `Setup` to `Access`, or use `Previous` from
  later steps to return.
- On large screens in guided creation, reopen `Access` from the step rail after
  moving past it.

## Default Access

- The step initially shows only `Who can access this wave`.
- Helper copy explains that everyone with access can participate by default and
  only the creator can administer the wave.
- Selecting an access group also applies it to chat.
- `Customize other permissions` expands `Who can chat` and `Admins`.
- The expanded section shows `Customized` and reopens automatically after
  navigating away and back when Admins was changed, a participation group
  differs from access, chat is disabled, or admin deletion is disabled.
- `Allow admins to delete posts` is enabled by default.
- Top-level waves default to `Everyone` for access and chat, and
  `Only me` for administration.
- A new subwave starts with the parent wave's exact access group and admin
  group. Chat starts with that same access group. A public parent's subwaves start with `Everyone`.
- The inherited subwave groups are editable. Subwave access does not have to
  match the parent's group.
- Before creating a subwave, the app checks whether its access group includes
  anyone outside the parent's audience. If it does, a warning explains that
  those members cannot open the subwave. `Continue anyway` creates it with the
  chosen group; `Go back` keeps the draft open. A different group whose members
  can all access the parent needs no warning, nor does a public parent.
- Members need access to both the subwave and its parent. Making a subwave
  public does not bypass a restricted parent.

## Editing Criteria

- Every wave access row offers one `Edit` action with a pencil icon. Wave access
  editors do not offer `Choose group`.
- On desktop, `Edit` opens the full criteria builder on `Identities`, with
  `Level`, `TDH`, `NIC`, `Rep`, `Required NFTs`, `Collection Access`, and
  `xTDH Grant` in a left-side list beside the fields.
- On smaller screens and touch devices, `Edit` opens a vertical category list.
  Select a category to open its fields. The shared `Back` button returns to the
  list without discarding the draft and restores focus to the category you left.
  The editor stays inside the Create Wave form, including the full-page route.
  Desktop's currently open criterion has a calm filled background. A check identifies
  each criterion that has a value, whether or not it is open.
  Scrolling over an inline access editor scrolls the surrounding Create Wave form.
  Screen readers receive the configured state in the button name and the
  open state as current.
- In `xTDH Grant`, `Clear filters` appears only when a collection name or grantor
  is set. It clears those search fields and keeps the active status tab; changing
  status tabs alone does not show the action.
- The editor uses the same concise copy as Network Filter. It omits the
  `Before editing` and `After editing` captions, and hides the default `Everyone`
  summary while editing. A selected saved group keeps its applied audience details.
  The proposed criteria remain below the editor; an incomplete draft shows the
  shared information tooltip beside the summary.
- `View members` is available for saved groups and valid drafts when membership can
  be evaluated. The member browser is searchable, paginated, links identities
  to their profiles, and explains why identities qualify.
- `Hide criteria and members` makes criteria and membership visible to group
  members but hidden from everyone else. It starts off for a new group and
  preserves the setting copied from an existing assignment.
- `Save changes` creates a new group and assigns it to the row; the existing
  group is not mutated. `Next`, or `Review wave` for standalone Chat, remains
  unavailable while an edit is pending.
- While an edit is open, `Cancel` sits at the far right above the criteria,
  including on mobile. Inside a mobile category, `Back` and `Cancel` share one
  row, with Back on the left and Cancel on the right. Cancel discards
  the draft and restores the applied audience. There is no separate Close,
  Discard draft, or Preview matches action.
- Moving between identity and rule buttons keeps the current draft. Navigating
  to another wizard step clears an unapplied criteria replacement.
- Clicking elsewhere in the Create Wave modal keeps an open criteria editor
  and its draft available. You can return to the filters without cancelling.

## Identity Criteria

- Neither Included nor Excluded shows `No allowlist added.` or `No CSV file added.`
  when its import sections are empty.
- On phones and touch tablets, direct identity selection, EMMA, and CSV file appear in distinct stacked sections. The allowlist search and file upload are always visible. Selected source names, imported counts, loading states, errors, retry, and removal remain available. Desktop keeps its existing two-column import layout.
- While editing criteria on mobile, the access row drops its nested filled card
  and horizontal padding, giving the fields more room.

- Included and Excluded use segmented tabs. Each shows its matching title above
  the input: `Find an identity to include` or `Find an identity to exclude`.
  The placeholders are `Search identities to include...` and
  `Search identities to exclude...`, respectively. Both tabs omit the
  empty-selection sentence, empty allowlist/file messages, and zero-total line. Both tabs omit the combined identity count because the bottom
  criteria summary already includes it. Search labels, selected-source counts,
  errors, limits, and creator warnings remain.
- Saved wallets resolve to profile pictures and handles. Wallets without profiles show ENS when available or a
  shortened wallet address with a neutral avatar.
- Each saved wallet stays independently removable. A wallet label distinguishes
  entries when several wallets belong to the same profile; saving preserves the
  original wallet list unless you edit it.
- Long lists show 20 wallets at a time with `Previous wallets` and `Next wallets`.
  Profile loading does not block editing or saving. If a lookup fails, its wallet
  remains available and `Retry profile lookup` retries it.

- Identities can be explicitly included or excluded through profile search, an
  authenticated EMMA allowlist, or a dragged or selected CSV file.
- Wallets from profile search, EMMA, and CSV are normalized and deduplicated.
  If a wallet is later added to the opposite treatment, the latest action wins.
- The bottom criteria summary shows the deduplicated identity totals. On mobile,
  it appears in a filled card after the editor content and scrolls with the form.
  Inline groups can include up to 10,000 identities and exclude up to 1,000.
- Search orders exact, prefix, and substring profile-handle matches before
  ENS-only matches, then orders each match group by profile level.
- New inline groups include the connected creator by default, including groups
  composed only from rules. `Include me` can be switched off.
- Excluding the creator from the main access group shows a warning because the
  creator may be unable to reopen the wave.

## How Membership Rules Combine

- An identity must meet every configured criterion unless it is explicitly
  included. Inclusion bypasses criteria, but an exclusion always takes priority.
- With only an inclusion list, the group contains the listed identities. With
  only an exclusion list, it contains everyone except the excluded identities.
  A restored legacy group with no criteria and neither list has no members.
  New groups need at least one criterion or a nonempty identity list to save.
  Choosing `Everyone` for a wave access row allows everyone instead.
- Zero is a configured value, not an empty field. A minimum Level of `0` allows
  every Level, including profiles whose combined score is negative and whose
  Level is still `0`. Other configured criteria still apply. A maximum Level of
  `0` allows only Level `0` profiles.
- Level bounds include the named Levels. For example, maximum Level `1` includes
  Level `1` and stops before Level `2`; Level `100` is the highest Level.
- REP and NIC bounds include both endpoints. Missing rating totals count as
  zero. If a rating rule selects an identity or REP category, or uses ratings
  sent, without either bound, the matching total must be nonzero. Ratings that
  cancel each other to zero do not satisfy that unbounded filtered rule.
- Fractional xTDH rounds down before comparison, including when it contributes
  to a combined TDH and xTDH criterion. For example, `12.9` xTDH contributes
  `12` to the eligibility calculation.
- `View members` on a draft applies the same membership rules as saved member
  lists. Membership can change as profile, rating, and ownership data changes.
- A saved group marked invisible has no eligible members, including explicitly
  included identities. This differs from `Hide criteria and members`, which
  controls who can inspect a group's details.

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

- When wave access is restricted, every active Chat and Admins
  group must contain only people who can also access the wave.
- The app validates active groups together, exposes and highlights incompatible
  rows, and keeps `Next` or `Review wave` unavailable while validation runs or
  fails.
- If current criteria or members cannot load, the editor preserves the draft
  and offers `Try again`. Older saved assignments whose criteria are unavailable
  can still show any current members the group endpoint resolves.
- EMMA load failures offer retry or removal. CSV import accepts `.csv`, ignores
  malformed entries, and reports when no valid Ethereum addresses are found.
- If access cannot be checked, `Next` or `Review wave` keeps the current screen
  open; changing a group starts a fresh check.
- If no admin group is selected, submission creates and publishes a personal
  admin group for a top-level wave. A subwave reuses its parent admin group.
- Submission checks the final group configuration again after authentication
  and before creating the personal admin group or the wave.

## Limitations / Notes

- Group membership is live: profile, reputation, and ownership changes can
  change who matches criteria over time.

## Related Pages

- [Wave Creation Index](README.md)
- [Waves Index](../README.md)
- [Wave Creation Setup Step](feature-overview-step.md)
- [Wave Creation Schedule](../competitions/setup/feature-dates-step.md)
- [Wave Creation Drop Settings](../competitions/setup/feature-drops-step.md)
- [Wave Creation Guidelines Step](feature-rules-step.md)
- [Wave Creation Description Step](feature-description-step.md)
- [Wave Right Sidebar Group and Curation Management](../sidebars/feature-right-sidebar-group-management.md)
- [Network Group Scope Flow](../../network/flow-network-group-scope.md)
- [Docs Home](../../README.md)
