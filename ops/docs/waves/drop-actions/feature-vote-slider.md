# Wave Drop Vote Slider

## Overview

This page covers vote value entry controls: slider mode and numeric mode.
Both modes edit one shared value for the same drop.
The value respects the current voting limits and shows the wave credit label
(`TDH`, `XTDH`, `TDH + XTDH`, or `Rep`). Decision entries use their decision's
current voting budget; other drops use their own allowed range.

## Location in the Site

- Vote modal/sheet (`Vote for this artwork`) opened from:
  - leaderboard drop cards
  - participation drop footers
  - single-drop vote summary strips
- Mini inline vote card in artist active-submission cards.
- Route contexts:
  - `/waves/{waveId}`
  - `/messages/{waveId}`
  - single-drop overlay from thread context (`?drop={dropId}`)

## Entry Points

- Select `Vote` on an eligible drop surface to open modal/sheet voting.
- In active submissions, use the inline mini vote card.
- Use the compact `Slider` / `Numeric` tabs beside `Your vote` to switch modes.

## User Journey

1. Open voting controls from modal/sheet or mini card.
2. Choose slider mode or numeric mode.
3. Set the value:
   - slider drag
   - numeric text input
   - `%` quick buttons in full-size numeric controls outside decisions
   - up/down step buttons in full-size numeric controls outside decisions
4. Review the live value and vote-credit label.
5. Optional: enable `Explain vote` and edit the rationale. Decision popups
   and full decision dialogs display the generated rationale as a placeholder;
   other vote dialogs prefill it.
6. Select `Vote`. Its button includes the current signed amount and credit
   label, such as `Vote +250 TDH`, including when an explanation is enabled.

## Common Scenarios

- Full voting dialogs and sheets open in slider mode. Decision submission
  cards also open in slider mode; mini cards outside decisions open in numeric
  mode and do not offer a rationale reply.
- Both voting forms use a `Your vote` header with compact `Slider` / `Numeric`
  tabs. Switching modes keeps the entered amount and the panel's height without
  submitting a vote.
- Compact submission cards use a smaller numeric field on desktop. Phones and
  touch devices keep a larger field and text for entry.
- Full and compact numeric fields share the app font, neutral background and
  visible keyboard focus. Existing credit labels remain beside the amount.
- In full-size dialogs and sheets, `Explain vote` uses a chat icon on its own
  row. Its reply field opens below that row, followed by a full-width `Vote`
  button, including on desktop. Compact decision submission cards that offer
  replies keep `Explain vote` on the left and a small `Vote` button on the right
  of one footer row; their reply field opens above the footer. Positive amounts
  use green, negative amounts use red, and zero uses a neutral style.
- Slider mode uses larger hit areas and logarithmic mapping so low and high
  values are easier to reach.
- Keyboard focus highlights the slider handle. Clicking or dragging does not
  draw a focus box around the whole slider area.
- Full-size numeric controls outside decisions offer `-100%`, `-50%`, `+50%`,
  and `+100%` shortcuts. Negative shortcuts are omitted when negative votes
  are not allowed. Decision numeric controls do not include these shortcuts.
- Holding an up/down step button outside decisions accelerates step size:
  `1`, then `10`, then `100`, then `1000`.
- Use `Enter` or `Space` on a focused step button to change the amount once.
  A pointer click or tap also steps once. Releasing or cancelling a held press
  stops repeated stepping. Step buttons and percentage shortcuts change the
  draft without submitting it.
- Hold-to-step snaps when crossing memetic values
  (`±69`, `±420`, `±6529`, `±42069`, `±69420`) and pauses briefly before
  continuing.
- Pressing `Enter` in numeric input starts submission.
- Normal vote modal/sheet controls include an optional rationale reply. The
  switch starts off, turns on with the first text edit, and keeps the user's
  later manual on/off choice.
- Users can turn `Explain vote` on without editing. In that case, the reply
  contains only the generated vote total, plus the vote change when it differs
  from the total.

### Decision Submission Popups

Artist submissions place the voting footer inside each artwork card. When the
wallet is disconnected, the compact footer is hidden, including the connection
message and its spacing. Cards keep
their own height when an explanation is open. Artist submissions and participant
entries place the vote label and mode switch above the input. A compact credit
line below the input shows the remaining balance on the left and spent credits
out of available credits on the right, for example `679 remaining` and
`33,591 of 34,270 credits spent`. On narrow cards it wraps between those two groups;
numbers stay with their words. Full credit labels remain available to screen
readers. When replies are available, the footer keeps the chat-icon `Explain vote`
control on the left and a compact `Vote` button on the right. The reply field opens above that row,
with its public-reply note below the text field. It opens and closes with a short
expand/fade transition, respecting reduced-motion settings. Generated text such
as `Vote rationale (0 at time of posting):` appears as a placeholder, so typing
starts in an empty field. Opening `Explain vote` does not show an empty-field
warning. Leaving the field untouched preserves the existing generated reply;
entering text replaces it. Clearing an edited field while `Explain vote` is on
blocks `Vote` until you enter text or turn the control off. Reply fields start
at three rows in compact submission cards and four rows in full dialogs and
sheets. Long replies scroll inside the field. Drag its resize handle to enlarge
the field when needed.
Vote amounts, limits, eligibility, and saving work the same in both input modes.

The full decision voting modal and mobile sheet use the same header, reply
control, and compact remaining/spent credit line beneath the input. Their
`Explain vote` control has its own row above the reply field, followed by a
full-width `Vote` action. Generated rationale appears
as a placeholder here too: typing starts in an empty field, while an untouched
field retains the existing generated reply.

## Edge Cases

- When min and max are both zero, the slider rests at center.
- Positive and negative values share one range, with slider fill split around
  zero.
- Numeric typed and stepped values outside decisions are clamped to the drop's
  bounds. Decision votes must stay within the displayed current credit limits.
- Mini numeric mode has text input only (no `%` quick buttons, no `+`/`-`
  step buttons).
- Long-press stepping repeats every `100ms` while pressed.
- Outside decisions, vote actions can be hidden for: not logged in, no profile
  handle, proxy, ineligible drop/group, winner drops, voting not started, and
  voting ended. Decision voting follows the entry and acting profile's
  permissions, including authorized proxy voting.
- `No credit` still shows vote controls, but `max_rating` can be zero and
  submit can fail.

## Failure and Recovery

- Changing slider or numeric input does not submit automatically.
- A rationale reply is posted only when `Explain vote` is on. Turning it off
  keeps the text but submits only the vote.
- If `Explain vote` is on and all rationale text is removed, submission is
  blocked with a visible and accessible message until text is added or the
  switch is turned off.
- If the vote succeeds but the optional reply fails, the vote stays saved and
  an error toast tells the user to retry the reply.
- Submit always runs an auth check first; canceling auth keeps controls open.
- Decision forms report a save error and refresh their voting limits for retry.
  Other vote forms use an error toast. A failed save keeps the entered value
  while the form remains open.
- Decision voting closes after the server confirms the vote. Scores and
  rankings can continue refreshing in the background.
- Other modal/sheet votes validate and complete auth first, then start the vote
  request, briefly show the success state, and close. An immediate failure keeps
  the controls open. If the request fails after closing, an error toast appears
  and users can reopen voting and re-enter the amount to retry.
- In mini active-submission cards, successful submit refreshes submission/drop
  queries and keeps users in the same list.
- My Votes retains its separate compact amount, range, and saved-vote
  explanation controls; the panel layout does not replace those table rows.

## Limitations / Notes

- This page covers value-entry controls. Vote summary strip and modal container
  behavior are documented in
  [Wave Drop Vote Summary and Modal](feature-vote-summary-and-modal.md).
- This page does not document clap/rate controls in thread cards.

## Related Pages

- [Wave Drop Actions Index](README.md)
- [Waves Index](../README.md)
- [Wave Drop Vote Summary and Modal](feature-vote-summary-and-modal.md)
- [Wave Drop Reactions and Rating Actions](feature-reactions-and-ratings.md)
- [Wave Drop Artist Preview Modal](feature-artist-preview-modal.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Docs Home](../../README.md)

Decision vote dialogs include **Explain vote** when the acting profile can
chat in the wave. This also applies to authorized proxy voting. The reply posts
only after the vote succeeds; a reply failure does not undo the saved vote.

Decision artist submissions and participant entries offer the same **Slider** / **Numeric** control as the voting dialog. Switching modes keeps the entered value; it does not save a vote. **Explain vote** posts a public reply in the wave after the vote saves. It is omitted when the voter cannot chat.
