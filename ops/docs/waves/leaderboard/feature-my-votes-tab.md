# Wave My Votes Tab

## Overview

`My Votes` lists drops where your current vote is not `0`.
You can update votes one row at a time, reset selected rows to `0`, or open a
prefilled reply for explaining a vote.

The tab is available only on eligible rank-wave layouts:
- memes waves
- curation waves

## Location in the Site

- Rank-wave thread routes: `/waves/{waveId}`
- Rank-wave direct-message routes: `/messages/{waveId}`
- Desktop and mobile wave tab rows when `My Votes` is available

## Entry Points

- Open an eligible wave.
- Switch to `My Votes` from the wave tab row.
- Use row checkboxes, vote inputs, and `Explain` actions in the list.

## User Journey

1. Open a wave and switch to `My Votes`.
2. If no rows are found, the tab shows:
   `You haven't voted on any submissions in this wave yet.`
3. Review each row: preview, title, rank (when available), author, total vote
   value, voter count, and your current vote input.
4. Optional: click a row to open that drop in the current wave route.
5. Edit a vote, then submit with `Vote` or `Enter`.
6. Optional: select `Explain` to open an inline reply composer prefilled as
   `Vote rationale (...)`.
7. Use `Select All` or `Deselect All`, then `Reset Votes` to set selected rows
   to `0`.
8. Scroll to the bottom to load more rows.

## Common Scenarios

- Vote input accepts numeric text, including temporary empty and `-` while you
  edit.
- Submitted values are clamped to that row's current min/max range.
- `Vote` is enabled only when the input is valid and changed.
- `Vote` shows a spinner while the row request is running.
- `Explain` opens the normal drop reply composer and does not submit or change a
  vote by itself.
- The prefilled reply includes the user's vote total at time of posting. If the
  current session just applied a vote change and that change differs from the
  total, the prefix includes both total and change.
- During bulk reset, `Select All` and `Reset Votes` are disabled.
- During bulk reset, row vote inputs are disabled and a
  `Resetting votes...` progress bar shows progress.
- `Available` is shown only when vote context includes a numeric max rating.

## Edge Cases

- Rows with personal vote `0` are excluded from this tab.
- If wave vote context changes (current or max), draft input resets to live
  values.
- If input blurs with empty, `-`, or unchanged value, it resets without submitting.
- The tab can remain visible even when `Leaderboard` is no longer available.
- `Select All` affects loaded rows only; rows loaded later are not auto-selected.
- Bulk reset runs one selected row at a time.

## Failure and Recovery

- If wallet authentication fails before single-row submit,
  `Authentication failed` appears and the row stays editable.
- If single-row vote submit fails, an error toast appears; edit and retry in
  the same row.
- If bulk reset fails on any selected row, an error toast appears and reset stops immediately.
- If reset UI stays stuck after a failed reset row, refresh the wave route and
  reopen `My Votes`.

## Limitations / Notes

- This tab does not show drops where your current vote is already `0`.
- Editing and reset still depend on wave voting permissions and backend
  validation.
- `Explain` uses standard chat replies; it does not create a separate rationale
  object or require dedicated backend support.
- `Available` and `Max` use comma formatting.
- Tab selection is UI state and is not encoded in a URL tab parameter.

## Related Pages

- [Wave Leaderboards Index](README.md)
- [Wave Content Tabs](../chat/feature-content-tabs.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Wave Drop Vote Slider](../drop-actions/feature-vote-slider.md)
- [Wave Drop Vote Summary and Modal](../drop-actions/feature-vote-summary-and-modal.md)
- [Docs Home](../../README.md)
