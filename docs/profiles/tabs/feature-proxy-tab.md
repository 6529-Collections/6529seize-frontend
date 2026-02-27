# Profile Proxy Tab

## Overview

The `Proxy` tab at `/{user}/proxy` shows proxy relationships and their actions in
two sections: `Received proxies` and `Granted proxies`.

Use this page to:

- review proxy actions and statuses
- assign a proxy target from your own profile
- create and manage proxy actions when your current session is allowed

## Location in the Site

- Route: `/{user}/proxy`
- Parent route: `/{user}`

## Entry Points

- Open `/{user}/proxy` directly.
- Open your profile and switch to the `Proxy` tab.
- Open a shared link to a profile proxy route.

## Visibility and Access Rules

- The `Proxy` tab is visible only when the opened profile matches your connected
  handle or one of your connected wallets.
- If `/{user}/proxy` is opened in a context where the tab is hidden, profile tab
  routing replaces it with the first visible profile tab and keeps the current
  query string.
- `Assign Proxy` and accept/reject/revoke/restore buttons are shown only in
  owner mode (your own profile and no active proxy session).
- Credit and end-time edit controls are shown only when your connected profile
  is the grantor for that relationship.

## User Journey

1. Open `/{user}/proxy`.
2. Use the list filter (`All`, `Received`, `Granted`) to scope the visible
   sections.
3. Review each relationship row:
   - grantor and receiver profiles
   - action rows with status chips, start time, end time, and credit (when the
     action type supports credit)
4. In owner mode, click `Assign Proxy`:
   1. Search and select a profile owner target (`Search profile`).
   2. If that target already has a relationship, the existing relationship is
      reused.
   3. Choose an available action type.
   4. Configure credit (if required) and optional end time.
   5. Save and return to list view.

## Current Tab Behavior

- Default list filter is `All`.
- Loading/empty states:
  - `Loading proxies...`
  - `No received proxies`
  - `No granted proxies`
- Only relationships with at least one action appear in the list.
- Outside owner mode, only currently active actions are shown. On the
  `Received` side, revoked actions are removed from the list.
- Action rows are ordered with active/non-expired actions first, then expired
  actions. Within each group, newer rows are shown first.
- Current action creation UI supports these action types:
  - `Allocate Rep`
  - `Allocate NIC`
- A relationship can have at most one action per type; after a type exists, it
  is removed from the add-action choices.
- `Add A Proxy` appears on a relationship only when an addable action type is
  still available.

## Action Controls and Status

- Status chips are shown per side:
  - grantor side: `Granted` or `Revoked`
  - receiver side: `Pending`, `Accepted`, or `Rejected`
- Owner-side lifecycle controls:
  - grantor: `Revoke` and `Restore` (when revoked)
  - receiver: `Accept` and `Reject` (depends on current state)
- Grantors can edit:
  - credit amount (credit actions only)
  - end time (`No end time` toggle or specific end time)
- For `Allocate Rep` and `Allocate NIC`, save stays disabled until credit is
  greater than `0`.

## Failure and Recovery

- Search requests do not run until at least `3` characters are entered.
- No matches in target search leaves the dropdown without selectable options.
- If wallet auth is rejected, create/update/acceptance actions do not submit.
- Create/update/acceptance request failures show toast errors and keep the form
  in place for retry.
- On first successful `Accept`, a guidance modal can appear for proxy profile
  switching. It can be dismissed and set to not show again.

## Limitations / Notes

- List filtering (`All`/`Received`/`Granted`) is local UI state and is not
  stored in the URL.
- Query-string profile routing behavior is owned by profile navigation docs:
  [Profile Routes and Tab Visibility](../navigation/feature-tabs.md).

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Tabs Index](README.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
