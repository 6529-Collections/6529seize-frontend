# Wave Drop Vote Summary and Modal

## Overview

Single-drop views show a voting summary strip with current totals, projected
totals (when available), and a `Vote` action that opens the dedicated voting
modal. The voting modal opens as a full-screen overlay over current content and
locks page scroll while open. This surface does not include an inline voting
countdown.

## Location in the Site

- Single-drop detail views opened from wave threads.
- Memes artwork detail panels that reuse the same vote summary strip.
- Desktop modal overlay and mobile voting sheet opened from that summary.

## Entry Points

- Open a drop detail view from a wave thread.
- In eligible voting states, select `Vote` from the summary strip.
- On mobile, open the same action from the drop detail and use the mobile vote
  sheet.

## User Journey

1. Open a drop detail view.
2. Review the vote summary strip:
   - current total vote count,
   - projected count tooltip when projection differs from current total, and
   - `Vote` action when voting is available to the viewer.
3. Select `Vote` to open `Vote for this artwork`.
4. The overlay opens with focus moved into the modal.
5. Choose slider or numeric input and submit.
6. After a successful vote, the modal closes and the summary updates.

## Common Scenarios

- Eligible viewers can open voting directly from single-drop details without
  returning to leaderboard rows.
- When voting is unavailable, the summary remains visible but the `Vote` action
  is hidden.
- After voting ends (or for winner drops), viewers who voted see a `Your votes`
  value in the summary strip.
- Mobile users get the same voting form inside the mobile dialog layout.
- Desktop users get the same form in a full-viewport modal with backdrop.

## Edge Cases

- Chat drops do not render voting summary/vote controls in single-drop details.
- Winner drops and ineligible states hide the `Vote` action.
- If projected totals are unavailable, only the current total is shown.
- Negative prior votes are shown with a leading minus sign in the `Your votes`
  field.
- While open, page background scrolling is disabled so background content stays
  fixed.

## Failure and Recovery

- If authentication is interrupted during submit, the vote dialog remains open
  so the user can retry.
- If vote submission fails, the dialog stays open and an error toast is shown.
- Focus returns to the control that opened the dialog after the modal closes.
- Closing the dialog with `Esc`, backdrop click, or cancel keeps the user on
  the same drop detail context.

## Limitations / Notes

- This page documents single-drop vote summary/modal behavior, not inline
  leaderboard mini voting controls.
- The single-drop `Top voters` ranking section is documented separately.
- Voting availability depends on viewer eligibility, drop type, and voting
  window state.
- The summary strip does not show `Voting Starts In` or `Voting Ends In`
  countdown labels.

## Related Pages

- [Waves Index](../README.md)
- [Wave Top Voters Lists](../leaderboard/feature-top-voters-lists.md)
- [Wave Drop Vote Slider](feature-vote-slider.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Wave Leaderboard Decision Timeline](../leaderboard/feature-decision-timeline.md)
- [Docs Home](../../README.md)
