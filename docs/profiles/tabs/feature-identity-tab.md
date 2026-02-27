# Profile Identity Tab

## Overview

The `Identity` tab is the combined profile route for `Rep` and `NIC`.
On desktop, both surfaces are visible at once.
On mobile, the same route provides an in-tab toggle between `Rep` and
`Identity` sections.

## Location in the Site

- Canonical route: `/{user}`
- Legacy alias: `/{user}/identity` (redirects to `/{user}`)
- Desktop (`>= lg`):
  - left column: `Rep` summary, top categories, grant/edit controls, and activity log
  - right column: `Network Identity Check (NIC)`, identity statements, and NIC rating action
- Mobile (`< lg`):
  - top score cards: `Total Rep` and `NIC`
  - `Rep` section: grant CTA, rep table, REP-focused activity log
  - `Identity` section: NIC CTA, identity statements, NIC-focused activity log

## Entry Points

- Open `/{user}` directly.
- Switch to `Identity` from another profile tab.
- Click profile-header quick stats for `NIC` or `Rep`.
- Open a profile from global header search (profile results default to this
  route).
- Follow a shared profile URL that lands on the profile root.

## User Journey

1. Open `/{user}`.
2. Review current `Rep` and `NIC` summary values.
3. On desktop, review/edit rep categories and open the combined activity log.
4. On desktop, review NIC status and statement sections in the side card.
5. On mobile, switch between `Rep` and `Identity` sections from the top score cards.
6. If eligible, open `Grant Rep` or `Rate NIC` actions and submit updates.
7. Share the same URL to return to this combined tab.

## Common Scenarios

- View both rep and NIC context without leaving `/{user}`.
- Use the rep table to sort by `Rep`, `Raters`, or `My Rates` (when editable).
- Expand long rep lists with `See all <count>` and collapse with `Show less`.
- Click top-rep chips or rep table rows to adjust an existing category (eligible viewers).
- Grant a new rep category by searching/selecting a category, setting a value, and saving.
- Rate NIC from the identity surface when rating permissions are available.
- On mobile, run rep actions and NIC actions in separate bottom sheets.
- Open activity logs:
  - desktop: matter selector (`All`, `REP`, `NIC`) plus direction filtering
  - mobile rep section: REP-only log context
  - mobile identity section: NIC-only log context with NIC log-type filter options

## Grant Rep Input Behavior

- The `Grant Rep` category field is live-search with a 500ms debounce:
  - It requires at least 3 and at most 100 characters.
  - While it is below/above that range, the dropdown explains the length constraint.
- While searching, a category dropdown opens on focus/typing and closes via outside click or `Esc`.
- Dropdown options include:
  - The current typed term first (when in range), then matching backend categories.
  - Duplicate entries are removed from backend matches if they match the typed term.
- Clicking a dropdown item (or pressing Enter in the search form) triggers a category availability check before selection.
- If a category is selected and the user edits the category text, the component clears the selection and amount so a fresh choose+check is required.
- The `Grant Rep` button is blocked when:
  - no category is selected,
  - amount is empty,
  - amount is unchanged from current contribution,
  - value is outside min/max rules (unless a proxy is active),
  - or submit/mutation is already in progress.

## Edge Cases

- If a profile has no rep categories, the rep table can be hidden while summary and log areas still load.
- If rating context disallows an action (for example proxy allowance limits), rating controls are replaced with context guidance.
- On your own profile, action controls that use the hidden-own-profile mode can disappear instead of showing a warning box.
- Mobile section switching (`Rep` vs `Identity`) does not change the URL.
- `/{user}/identity` redirects to `/{user}`.
- `/{user}/rep` is not a supported profile route; use `/{user}`.

## Failure and Recovery

- If rep or NIC submit actions fail, a toast error is shown and values stay unchanged.
- If statement or rating data requests fail, parts of the tab can appear empty or partially loaded; refresh to retry.
- Activity logs can show `No Activity Log` when filters produce no results or data is unavailable; change filters or refresh.
- If a legacy `/{user}/rep` bookmark returns not-found, replace it with `/{user}`.

## Limitations / Notes

- `Rep` and `NIC` share one canonical profile route: `/{user}`.
- Desktop and mobile layouts differ significantly while representing the same tab.
- Mobile subview choice (`Rep` or `Identity`) is local UI state and is not shareable in the URL.
- Edit/rating controls depend on wallet connection, profile ownership, and proxy permissions.

## Related Pages

- [Profiles Index](../README.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Legacy Profile Route Redirects](../navigation/feature-legacy-profile-route-redirects.md)
- [Profile Header Summary](../navigation/feature-header-summary.md)
- [Profile Identity Statements](feature-identity-statements.md)
- [Profiles Tabs Index](README.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
