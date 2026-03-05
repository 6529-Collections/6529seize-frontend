# Profile Identity Tab

## Overview

`Identity` is the default profile tab at `/{user}`.
It combines `Rep` and `NIC` on one route.

- Desktop shows both surfaces at the same time.
- Rep supports direction toggles: `Received` and `Given`.
- Mobile switches between `Rep` and `Identity` subviews inside the same URL.

## Location in the Site

- Canonical route: `/{user}`
- Legacy alias: `/{user}/identity` (permanent redirect to `/{user}` and keeps
  query params)
- Unsupported legacy route: /{user}/rep (not found)

Desktop (`>= lg`):
- Left: Rep direction toggle, summary, categories, received-only grant/edit
  actions, activity log
- Right: NIC summary, ID statements, and `Rate NIC` entry point

Mobile (`< lg`):
- Top cards: direction-aware `Total Rep` and `NIC`
- `Rep` subview: rep direction toggle, categories, received-only `Grant Rep`,
  REP activity log
- `Identity` subview: `Rate NIC`, ID statements, NIC activity log

## Entry Points

- Open `/{user}` directly.
- Switch to `Identity` from another profile tab.
- Click `NIC` or `Rep` in profile header stats.
- Open a profile from header search (lands on default profile tab).

## User Journey

1. Open a profile at `/{user}`.
2. Read rep and NIC summaries.
3. In `Rep`, switch between `Received` and `Given` as needed.
4. If actions are available, open `Grant Rep` (received only) or `Rate NIC`.
5. `Rate NIC` opens a modal; submit to save or select `Cancel` to close.
6. Review activity logs and apply filters.
7. On mobile, switch between `Rep` and `NIC` cards as needed.

## Rep Behavior

- Rep has two directions:
  - `Received`: incoming rep to the viewed profile
  - `Given`: outgoing rep from the viewed profile
- `Total Rep` and contributor counts update with the active direction.
- Direction-specific contributor labels:
  - `Received`: `rater` / `raters`
  - `Given`: `receiver` / `receivers`
- Each category pill shows category, score, top-contributor avatars, and
  direction-aware contributor count.
- Contribution badge copy is direction-aware:
  - `Received`: `My Rate`
  - `Given`: `To Me`
- Category list starts at 5 items and expands in `+N more` batches of 10.
- If editing is allowed in `Received`:
  - category pill opens edit for that category
  - `Add new` (desktop) or `Grant Rep` (mobile) opens grant dialog
- In `Given`, grant/edit controls are hidden.
- Empty states are direction-aware:
  - Desktop: `This identity hasn't received any rep yet.` /
    `This identity hasn't given any rep yet.`
  - Mobile: `No rep received yet.` / `No rep given yet.`

### Grant Rep Dialog

- Category search accepts 3-100 characters.
- Results appear after a short debounce.
- Dropdown order is typed value first, then matching categories.
- Selecting a category validates availability before selection.
- If availability fails, inline error is shown.
- Editing text after category selection clears selected category and amount.
- Amount accepts integers.
- In non-proxy mode, amount clamps to allowed min/max on blur.
- `Grant Rep` stays disabled until category is selected, amount changed, amount
  is valid, and submit is idle.

## NIC and Statements Behavior

- NIC panel shows NIC value, NIC status, top-contributor avatars, and rater
  count.
- Desktop shows a `Rate NIC` CTA in the NIC section when rating is allowed.
- Mobile shows `Rate NIC` only in the `Identity` subview when rating is
  allowed.
- Desktop and mobile rating flows open a modal with `Save` and `Cancel`.
- `Rate` is enabled only when the value changed and is valid.

Statement ownership in this tab:
- [Profile Identity Statements](feature-identity-statements.md)

## Activity Log Behavior

- Desktop combined log includes:
  - matter tabs: `All`, `REP`, `NIC`
  - direction tabs: `All`, `Incoming`, `Outgoing`
  - NIC-only log-type filter when matter is `NIC`
- Mobile:
  - `Rep` subview uses REP log with direction tabs
  - `Identity` subview uses NIC log with direction tabs and NIC log-type filter
- Empty results show `No Activity Log`.

## Permissions and Visibility Rules

- Rep/NIC actions require a connected account with a profile handle.
- Outside proxy mode, you cannot rate your own profile.
- In proxy mode:
  - Rep actions require `AllocateRep`
  - NIC actions require `AllocateCic`
  - proxy grantor profile cannot be the target
- Mobile `Rep`/`Identity` switching does not change URL state.

## Failure and Recovery

- Rep submit failures show an error toast and keep dialog values.
- NIC submit failures show an error toast and keep entered value.
- Selecting `Cancel` closes NIC rating without applying changes.
- Statement or rating fetch failures can leave empty/partial sections; refresh
  to retry.
- Replace old `/{user}/rep` bookmarks with `/{user}`.

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Tabs Index](README.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Legacy Profile Route Redirects](../navigation/feature-legacy-profile-route-redirects.md)
- [Profile Header Summary](../navigation/feature-header-summary.md)
- [Profile Identity Statements](feature-identity-statements.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
