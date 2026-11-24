# Decision Votes

## Overview

`My Votes` lists active submissions where your current vote is not `0`.
Past winners are excluded; their historical vote records remain preserved.
Use the compact sorting control beside **Select all**. It opens a dropdown on
desktop and the shared bottom sheet below 1024px and in the app.
The control shows the current order, with **Available in wave** on the same
toolbar when a wave-wide balance is available. The controls wrap on narrow screens.
On mobile, the balance sits above the controls. **Select** / **Done** stays on
the right; while selecting, **Select all** sits beside the sorting control.
**Reset votes** and the selected count appear only after you select a row;
clearing the selection hides them again. Choose an order:

- **Your vote amount** (the initial default): highest signed vote first, including
  negative votes. Equal amounts keep the existing allocation-update order,
  oldest first, with a stable artwork order when times match.
- **Leaderboard position**: the decision's current position, highest-ranked
  first. Ties follow its leaderboard order; entries without a rank come last.
- **Last voted**: your most recent successfully cast or changed vote first.
  Automatic credit adjustments and unchanged saves do not count as new votes.
  Entries without a known vote-change time come last; equal times use a stable
  artwork order. Older retained vote records have second-level precision.

Each order covers all eligible votes, including pages not loaded yet. Your choice
is remembered in this browser for the current decision and connected profile.
Changing sort clears the reset selection and starts the selected order from its
first page; it does not change a vote. The selector stays available during loading
and retry, and is disabled while a vote is saving or a bulk reset is running.
Saving a vote refreshes the loaded pages to reflect its new position before more
rows load.
You can update votes one row at a time, reset selected rows to `0`, or open a
prefilled reply for explaining a vote.

Open **Votes** in the wave's main row, then select **My Votes**. The other
subtabs are **All votes**, with voter profiles and totals, and **Activity**, with
vote changes. These three views use compact rounded pills below the main wave
tabs on desktop, mobile web, and the app. Notices that results are paused appear below the
pills. Submission eligibility notices belong to Leaderboard and do not appear in
Votes. Each view uses the selected decision,
including the original decision in an older wave. Switching decision changes all three views.
Signed-out viewers can inspect public All votes and Activity; personal votes
require a connected profile. My Votes rows span the full wave content pane,
with padding inside each row for its controls.
In My Votes, signed-out viewers can select **Connect Wallet** below the
connection message to open the usual wallet connection flow. Empty-state messages
in all three Votes subviews use muted, left-aligned text.

All votes places each voter's rank, avatar, name, and signed vote amounts on
the left, with the total and credit label inline on the right. Activity aligns
the voter, vote change, drop creator, and time across
wide views. Below 768px, including small tablet widths, the vote change and creator
use separate lines below the voter, with a bent arrow beside the creator. The time and
**View drop in chat** button stay on the first line. Both lists
use subtle row dividers and keep **Load more** below the rows.
While loading, both lists show placeholders that match their rows. All votes
loads profiles as their rows approach the visible area and keeps a row placeholder
while each profile loads. The placeholders stay still when reduced motion is enabled.

## Location in the Site

- Rank-wave thread routes: `/waves/{waveId}`
- Rank-wave direct-message routes: `/messages/{waveId}`
- Desktop and mobile wave tab rows when `Votes` is available

## Entry Points

- Open an eligible wave.
- Switch to `Votes`, then `My Votes`.
- Use rows or their checkboxes to select votes for reset, vote inputs to edit
  votes, and `Explain vote` actions to explain them.

## User Journey

1. Open a wave and switch to `Votes` → `My Votes`.
2. If no rows are found, the tab shows:
   `You haven't voted on any submissions in this wave yet.`
3. Review each row: preview, title, rank (when available), author, total vote
   value, voter count, and your current vote input.
4. Choose `Select` to enter selection and show `Select all`. Mobile also reveals
   checkboxes. Holding a mobile card enters selection and selects that card;
   scrolling cancels the hold.
   Desktop checkboxes remain visible at rest. Clicking the row background or
   checking its checkbox enters selection mode. `Done` leaves selection and clears selected rows.
   In selection mode, click a row
   outside its controls to select or deselect it. Artwork and title buttons open
   the drop, including with `Enter` or `Space`. Vote controls and profile links
   keep their own actions; selecting text does not toggle the row.
5. Edit a vote, then submit with `Save vote` or `Enter`. The save action appears
   only when the number differs from the saved vote and disappears after saving
   or restoring the saved number.
6. Optional: select `Explain vote` to open an inline reply composer prefilled as
   `Vote rationale (...)`.
7. With selection active, select rows by clicking outside their controls, using
   the checkboxes beside the artwork, or using `Select all` / `Deselect all`,
   then `Reset votes`. Review the selected count in the confirmation dialog
   and confirm to set those votes to `0`, or cancel without changing them.
8. Scroll to the bottom to load more rows.
   A **Load more** button remains available if automatic loading fails.

## Common Scenarios

On mobile web below 1024px and in the app, cards keep the thumbnail beside the title and author. Checkboxes appear only in selection mode. Rank shares the row with Total and voters below the artwork and author. The amount and **Explain vote** remain side by side, with range help underneath only on focus or error. Controls keep 44-pixel tap targets and inputs use 16-pixel text. Titles and author names stay on one line with an ellipsis when needed. Desktop uses the same labels and editing behavior, with larger 96px artwork and the reusable media-type icon beside the title. The title and author have more vertical room, with Total, voters and rank together beneath the handle, aligned with the profile image. Where space permits, artwork, title and author, stats, the filled vote field, and a bordered **Explain vote** button share one row. Vote fields use a compact numeric box with the credit unit beside it. On narrow cards, **Save vote** appears below the amount row. Desktop **Save vote** appears beside the amount field with a solid fill when a changed amount is ready to save. Rank, totals and voters use matching text sizes, and range help stays visible on desktop so focus changes do not move it. **Explain vote** is unavailable for a saved vote of zero and is omitted when you cannot chat in the wave. Opening it does not save a vote: review and send the public reply separately.

- `Select` and `Done` highlight on mouse hover; tapping them on touch devices
  does not retain the hover highlight.
- Rows use a subtle charcoal background. Hovering an unselected row lightens
  it further. Hovering or focusing the title highlights it in blue.
- `Available in wave` appears above the bordered sorting control and
  trailing `Select` / `Done` action, on the same surface as the list.
- Mobile cards use a square-cropped 56px thumbnail with a small media badge.
  Opening the artwork retains its full presentation. Rank shares the row with
  totals and voter counts; all use matching 13px text.
- Mobile vote fields use a filled surface and a focus ring. `Explain vote` is a
  text action beside the field. Range help appears on focus or when invalid;
  server errors remain visible after leaving the field. The negative-vote field
  uses a keyboard with a minus sign.
- Selecting a row checks its checkbox for reset; it does not change the vote
  until you confirm `Reset votes`.
- Vote input accepts numeric text, including temporary empty and `-` while you
  edit.
- Competition fields keep out-of-range drafts visible and disable saving until
  corrected. Legacy fields clamp to their limit and show the applicable limit;
  review the adjusted value before submitting it.
- The save action is enabled only when the input is valid and changed.
- The save action indicates that the row request is running.
- `Explain vote` opens the normal drop reply composer and does not submit or change a
  vote by itself.
- The prefilled reply includes the user's vote total at time of posting. If the
  current session just applied a vote change and that change differs from the
  total, the prefix includes both total and change.
- During bulk reset, row selection, `Select all`, and `Reset votes` are disabled.
- During bulk reset, row vote inputs are disabled and a
  `Resetting votes...` progress bar shows progress.
- `Available in wave` is shown only when vote context includes a numeric max
  rating. Each input also shows its applicable maximum.

## Edge Cases

- Rows with personal vote `0` are excluded from this tab.
- If wave vote context changes (current or max), draft input resets to live
  values.
- If input blurs with empty, `-`, or unchanged value, it resets without submitting.
- The tab can remain visible even when `Leaderboard` is no longer available.
- When voting is closed, rows cannot be selected for reset; artwork and title
  buttons still open the drop.
- `Select all` affects loaded rows only; rows loaded later are not auto-selected.
- Artwork rows remain visible during background refreshes. Vote inputs load as
  their rows approach the visible area.
- Bulk reset runs one selected row at a time.

## Failure and Recovery

- If the list fails to load or refresh, use **Try again** or choose another sort.
  Existing rows stay visible during a failed background refresh.
- If an entry preview is unavailable, its personal vote remains visible with
  **Preview unavailable**, vote controls, and **Try again**. The entry's hidden
  artwork and author details are not displayed.

- If an All votes profile fails to load, its row keeps the rank and vote total
  and shows **Profile unavailable** with a compact **Try again** button. Retry
  reloads that profile without replacing the rest of the list.

- If wallet authentication fails before single-row submit, a toast asks you to
  reconnect your wallet and try again; the row stays editable.
- If single-row vote submit fails, an error toast appears; edit and retry in
  the same row.
- If bulk reset fails on any selected row, an error toast appears and reset stops immediately.
- After a failed reset row, the progress indicator clears and controls become
  available again. Successfully reset rows are removed from the selection;
  the remaining rows can be retried.

## Limitations / Notes

- This tab does not show drops where your current vote is already `0`.
- Editing and reset still depend on wave voting permissions and backend
  validation.
- `Explain vote` uses standard chat replies; it does not create a separate rationale
  object or require dedicated backend support.
- Vote totals, available votes, and maximum values use locale-aware number
  formatting. Vote fields show grouped values at rest and plain digits while
  editing on desktop, mobile web, and in the app.
- Reduced motion removes selection movement and save scaling; fades remain.
- Decision links use `tab=votes`; `voteTab=mine`, `voteTab=all`, or `voteTab=activity` preserves the subtab on reload and Back/Forward. Older `tab=voters` links open All votes.

## Related Pages

- [Wave Leaderboards Index](README.md)
- [Wave Content Tabs](../chat/feature-content-tabs.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Wave Drop Vote Slider](../drop-actions/feature-vote-slider.md)
- [Wave Drop Vote Summary and Modal](../drop-actions/feature-vote-summary-and-modal.md)
- [Docs Home](../../README.md)
