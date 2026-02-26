# Block Finder

## Overview

The Block Finder tool estimates Ethereum block numbers for a chosen date and
time. It supports two modes:

- Single-block prediction for one target timestamp.
- Inclusion-based prediction for blocks that include selected number sequences
  within a time window.
- Result rows can open details with copy actions and Etherscan countdown links
  for matching blocks.

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
7. Open an inclusion result row to view matched blocks in a details modal.
8. Use the copy icon for a block value (the UI confirms with `Copied`) or open
   the Etherscan countdown link for that block.

## Common Scenarios

- Estimate the closest block for one timestamp by submitting date and time
  only.
- Find blocks that include sequences such as `1, 7, 42` inside a selected
  window (for example `1 minute`, `1 hour`, or `1 day`).
- Compare multiple inclusion sequences in one request and inspect grouped
  counts.
- Open a result row to view all matching blocks and copy individual block
  numbers.
- Use the block detail links to move from predicted values to Etherscan
  verification.

## Edge Cases

- `Block number includes` is disabled while window length is `None`.
- Choosing a non-`None` window without inclusion values shows an error toast.
- Inclusion values must be numeric and comma-separated; invalid tokens trigger
  an error toast.
- The maximum built-in window is `2 days`.
- Inclusion-mode responses can return an empty list; in that case no table rows
  appear.
- The details modal appears only after selecting an inclusion-results row.

## Failure and Recovery

- `Submit` remains disabled until both date and time are filled.
- Requests use `/other/predict-block-number` (single prediction) and
  `/other/predict-block-numbers` (inclusion mode).
- If either request fails, loading stops and results remain empty for that
  submit attempt.
- The page does not render an inline API-failure panel or toast for request
  failures; retrying (or refreshing and retrying) is the primary recovery path.

## Limitations / Notes

- Predictions depend on backend availability and can differ from final mined
  outcomes.
- Inclusion mode supports numeric sequence matching only (no wildcard or range
  syntax).
- The tool documents and links the canonical path `/tools/block-finder`.
- Troubleshooting often requires checking backend health for the two prediction
  endpoints above.

## Related Pages

- [API Tool Index](README.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Memes Subscriptions Report](feature-memes-subscriptions-report.md)
- [Docs Home](../README.md)
