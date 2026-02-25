# Wave My Votes Tab

## Overview

The `My Votes` tab shows drops you have already voted on in a wave. From this
tab, you can change individual vote values and reset selected votes in one action.

## Location in the Site

- Waves where `My Votes` is enabled: `/waves/{waveId}`
- Direct messages with a selected wave: `/messages?wave={waveId}`
- Desktop and app wave surfaces that render the shared wave tab layout

## Entry Points

- Open a wave that offers the `My Votes` tab.
- Select the `My Votes` tab from the wave tab strip.
- In the list, click a row to open the drop, or use the inline controls to edit
  and reset votes.

## User Journey

1. Open a wave and switch to `My Votes`.
2. If you have no voted drops, the tab shows an empty-state message.
3. For each voted drop row, review the media, author, and current vote context.
4. Edit your vote with the numeric field and submit with `Vote`.
5. In the tab header, use `Select All` / `Deselect All` to pick visible rows.
6. Use `Reset Votes` to clear votes for the selected rows.
7. Scroll near the bottom of the list to load more rows when more results are
   available.

## Common Scenarios

- The tab shows an empty state when no drops in that wave are currently in your
  voted set.
- Each row shows a `Max` value next to the vote input, and the input enforces the
  same minimum and maximum bounds.
- You can submit a new vote only when the value differs from the current value.
- Typed vote values outside the current min/max range are constrained into range
  before submit.
- If you type `Enter` in the field, it submits the vote using the same rules as
  clicking `Vote`.
- The `Vote` button shows a loading state while the request is in flight.
- During a reset operation, row-level vote inputs are disabled and a reset progress
  bar appears.
- The header can show `Available` credits when the wave provides that budget
  value, and it is hidden when the value is not available.

## Edge Cases

- Returning rows from the backend can carry updated vote maxima. The row label and
  input clamp logic reflect the latest live context.
- If a value is edited and then blurred without a valid change, the field keeps the
  current vote value and does not submit.
- The `Vote` action is blocked while a vote update is already processing.
- Bulk reset is disabled when no items are selected.

## Failure and Recovery

- If authentication fails before voting, an error toast is shown and the row remains
  editable.
- If a vote request fails, an error toast is shown and you can try again from the
  same row.
- If a reset request fails, an error toast is shown and you can retry by running the reset action again from the tab controls.

## Limitations / Notes

- This tab is only present in wave types where the `My Votes` tab is enabled.
- Vote behavior here is inline and does not replace other vote entry points in
  drop modals or single-drop summaries.
- `Available` and `Max` values come from wave vote context and are formatted for
  readability with comma separators.

## Related Pages

- [Waves Discovery Index](README.md)
- [Wave Content Tabs](feature-content-tabs.md)
- [Wave Drop Vote Slider](../drop-actions/feature-vote-slider.md)
- [Wave Drop Vote Summary and Modal](../drop-actions/feature-vote-summary-and-modal.md)
- [Docs Home](../../README.md)
