# Block Finder

## Overview

`/tools/block-finder` predicts Ethereum block numbers for a selected date and
time.

- Closest-block mode returns one predicted block for a timestamp.
- Include-sequence mode finds blocks that contain selected numeric sequences
  inside a time window.
- Requests run in the browser against the allowlist API.

## Location in the Site

- Route: `/tools/block-finder`
- Web sidebar path: `Tools -> Other Tools -> Block Finder`
- Native app drawer path: `Tools -> Block Finder`

## Entry Points

- Open `Block Finder` from the Tools menu.
- Open `/tools/block-finder` directly.

## User Journey

1. Select date.
2. Select time (enabled after date).
3. Optional: select a window and enter `Block number includes` values
   (`1, 7, 42`).
4. Select `Submit`.
5. Review either a closest-block result card or an include-sequence result
   table.
6. In include-sequence mode, select a row to open matching blocks in a modal.
7. In the modal, copy block numbers or open Etherscan countdown links.

## Mode and Validation Rules

- `Submit` is disabled until both date and time are set.
- Date input minimum uses the current UTC date
  (`new Date().toISOString().slice(0, 10)`).
- Time input is disabled until date is selected.
- Window default is `None`.
- `Block number includes` input is disabled while window is `None`.
- If window is not `None` and includes is empty, the page shows toast:
  `You must provide some block number inclusions when using a time window!`.
- Includes must match numeric comma-separated format (`1, 7, 42`); invalid text
  shows toast: `Block numbers must be numeric and comma-separated!`.
- Available windows: `None`, `1 minute`, `5 minutes`, `10 minutes`,
  `30 minutes`, `1 hour`, `2 hours`, `4 hours`, `6 hours`, `12 hours`,
  `1 day`, `2 days`.
- If includes text remains after switching window back to `None`, submit still
  runs include-sequence mode with a zero-length window.

## Request and Loading Behavior

- Every submit clears old results before sending a new request.
- Submit button shows loading while request is in flight.
- Closest-block mode (`includes` empty): `POST /other/predict-block-number`
  with `{ timestamp }` (milliseconds).
- Include-sequence mode (`includes` has value):
  `POST /other/predict-block-numbers` with
  `{ minTimestamp, maxTimestamp, blockNumberIncludes }`.
- `maxTimestamp` is `minTimestamp + selectedWindowMilliseconds`.

## Result States and Actions

- Closest-block mode shows:
  - predicted block number with Etherscan countdown link
    (`https://etherscan.io/block/countdown/{block}`),
  - local timestamp text for selected date/time,
  - countdown.
- Include-sequence mode shows a table with `Block includes`, `Count`, and
  `Blocks`.
- Selecting a table row opens a modal with matching blocks for that include
  value.
- Modal behavior:
  - matching digits are highlighted,
  - each block row has copy action with temporary `Copied` state,
  - each block links to Etherscan countdown.
- If include-sequence response is empty, no result table or empty-state message
  is shown.

## Failure and Recovery

- Failed requests stop loading and keep results cleared.
- API failures do not show a dedicated toast or inline error on this page.
- Failures are logged in browser console.
- Retry by submitting again (or refresh and retry).

## Limitations / Notes

- Predictions depend on backend availability and may differ from mined outcomes.
- Includes supports numeric sequence matching only (no ranges/wildcards).

## Related Pages

- [API Tool Index](README.md)
- [API Authentication and Media Drop Flow](feature-api-authentication-and-media-drop-flow.md)
- [App Wallets Management](feature-app-wallets.md)
- [Memes Subscriptions Report](feature-memes-subscriptions-report.md)
- [Web Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [App Sidebar Menu](../navigation/feature-app-sidebar-menu.md)
- [Docs Home](../README.md)
