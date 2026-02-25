# Block Finder

## Overview

The Block Finder tool estimates Ethereum block numbers for a chosen date and
time. It supports two modes:

- Single-block prediction for one target timestamp.
- Inclusion-based prediction for blocks that include selected number sequences
  within a time window.

## Location in the Site

- Route: `/tools/block-finder`
- Navigation path: `Tools -> Other Tools -> Block Finder`
- Result links open `etherscan.io` countdown pages for each block.

## Entry Points

- Open `Tools -> Other Tools -> Block Finder` from sidebar navigation.
- Open `/tools/block-finder` directly.

## User Journey

1. Open `/tools/block-finder`.
2. Select a date (past dates are blocked by the date picker minimum).
3. Select a time (the time input stays disabled until a date is set).
4. Optionally choose a window length and enter one or more block-number
   inclusion sequences.
5. Select `Submit`.
6. Review either the single closest predicted block or the grouped inclusion
   results table, depending on inputs.
7. Open a block on Etherscan or copy block values from the row-detail modal.

## Common Scenarios

- Estimate the closest block for one timestamp by submitting date and time
  only.
- Find blocks that include sequences such as `1, 7, 42` inside a selected
  window (for example `1 minute`, `1 hour`, or `1 day`).
- Compare multiple inclusion sequences in one request and inspect grouped
  counts.
- Open a result row to view all matching blocks and copy individual block
  numbers.

## Edge Cases

- `Block number includes` is disabled while window length is `None`.
- Choosing a non-`None` window without inclusion values shows an error toast.
- Inclusion values must be numeric and comma-separated; invalid tokens trigger
  an error toast.
- The maximum built-in window is `2 days`.
- Inclusion-mode responses can return an empty list; in that case no table rows
  appear.

## Failure and Recovery

- `Submit` remains disabled until both date and time are filled.
- If prediction requests fail, loading stops and prior results remain cleared;
  users can retry with the same inputs.
- The page does not render an inline API-failure panel; retrying the request is
  the primary recovery path.

## Limitations / Notes

- Predictions depend on backend availability and can differ from final mined
  outcomes.
- Inclusion mode supports numeric sequence matching only (no wildcard or range
  syntax).
- The tool documents and links the canonical path `/tools/block-finder`.

## Related Pages

- [API Tool Index](README.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Memes Subscriptions Report](feature-memes-subscriptions-report.md)
- [Docs Home](../README.md)
