# Block Finder

## Overview

`/tools/block-finder` predicts Ethereum blocks from a selected date/time.

- Single prediction mode: returns the closest predicted block for one timestamp.
- Inclusion mode: returns grouped matches for block numbers that include selected
  numeric sequences inside a time window.

## Location in the Site

- Route: `/tools/block-finder`
- Web sidebar path: `Tools -> Other Tools -> Block Finder`
- Native app sidebar path: `Tools -> Block Finder`

## Entry Points

- Open `Block Finder` from the Tools menu.
- Open `/tools/block-finder` directly.

## User Journey

1. Open `/tools/block-finder`.
2. Select date and time.
3. Optional: select a time window and enter `Block number includes` values
   (comma-separated numbers).
4. Select `Submit`.
5. Review either:
   - single prediction result with countdown link, or
   - inclusion results table with grouped counts and matched block lists.
6. In inclusion mode, open a row to view matching blocks in a modal.
7. Use copy icons (`Copied`) or open Etherscan countdown links.

## Input Rules and States

- `Submit` is disabled until both date and time are set.
- Date input minimum is today (past dates are blocked by picker constraints).
- Time input is disabled until date is selected.
- `Block number includes` input is disabled while window is `None`.
- If window is not `None` and includes is empty, submit shows an error toast.
- Includes must match numeric comma-separated format (`1, 7, 42`); invalid text
  shows an error toast.
- Maximum built-in window is `2 days`.

## Results Behavior

- Single prediction request: `/other/predict-block-number` with one timestamp.
- Inclusion request: `/other/predict-block-numbers` with min/max timestamps and
  includes array.
- Inclusion rows open a modal showing all matched blocks for that include value.
- Empty inclusion responses show no table rows.
- If includes text remains after switching window back to `None`, submit still
  runs inclusion mode with a zero-length window.

## Failure and Recovery

- On request failure, loading stops and results stay cleared for that submit.
- The page does not show a dedicated failure banner for API errors.
- Retry by submitting again (or refresh and retry).

## Limitations / Notes

- Predictions depend on backend availability and may differ from mined outcomes.
- Includes supports numeric sequence matching only (no ranges/wildcards).

## Related Pages

- [API Tool Index](README.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Memes Subscriptions Report](feature-memes-subscriptions-report.md)
- [Docs Home](../README.md)
