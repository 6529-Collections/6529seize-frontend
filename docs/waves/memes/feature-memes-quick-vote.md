# Memes Quick Vote

## Overview

This page covers the dedicated Memes quick-vote flow for rating unrated
participatory submissions in the configured memes wave.

## Location in the Site

- Desktop web waves sidebar footer on non-`/messages` shells
- Collapsed desktop waves sidebar quick-vote pill
- App/mobile `Waves` view footer
- App/mobile non-DM wave-thread default view floating quick-vote trigger
  (top-right)
- Quick-vote dialog overlay

## Entry Points

- Quick vote requires an authenticated non-proxy profile with a handle plus a
  configured memes wave.
- The trigger appears only when the viewer still has remaining voting power and
  at least one unrated memes submission left.
- Expanded footer surfaces open quick vote from the `Uncast Power` card.
- Compact surfaces open quick vote from the bolt-count trigger.
- In app/mobile thread view, the floating trigger appears only in the main
  non-DM wave view. It is hidden on other tabs and while a single-drop overlay
  is open.

## User Journey

1. Open quick vote from any available trigger.
2. Quick vote loads the unrated memes queue from newest to oldest.
3. Review the current meme preview, including artwork, title, description,
   author, timestamp, remaining voting power, and remaining queue count.
4. Vote by either:
   - tapping a remembered amount button
   - entering a custom amount
   - swiping right on mobile using the currently selected amount
5. Skip the current meme by clicking `Skip for now` or swiping left on mobile.
6. After each vote or skip, quick vote advances to the next eligible meme.
7. When no unrated memes remain, or remaining power reaches zero, the dialog
   ends with `You are done`.

## Common Scenarios

- Expanded surfaces show an `Uncast Power` card with remaining power plus
  `{count} left`; compact surfaces show the remaining count only.
- Quick amount buttons remember up to five recent vote amounts per profile and
  memes wave. The most recent remembered amount is marked `Last used`.
- If no recent amounts are stored yet, quick vote opens with the custom-amount
  panel expanded.
- Custom amounts are normalized to a whole number and capped at the current
  remaining voting power.
- `Skip for now` defers the current meme instead of discarding it permanently.

## Edge Cases

- Skipped memes are remembered per profile and memes wave, so closing and
  reopening quick vote keeps them deferred until the active queue is exhausted.
- If a queued meme is already rated, no longer votable, outside the current
  voting window, or otherwise invalid by the time quick vote refreshes it, that
  meme is dropped from the queue and the next eligible meme is shown.
- If a meme has no usable media preview, quick vote shows `Preview unavailable`
  but keeps the voting controls available.

## Failure and Recovery

- If quick vote cannot load the queue, the dialog shows
  `Couldn't load your queue` and a `Try again` action.
- If a vote submission fails, quick vote shows an error toast, refreshes the
  queue state, and lets the user continue from the refreshed result.
- If the trigger is missing, first confirm the current surface and state:
  quick vote is hidden when there are no unrated memes left, no remaining power
  left, or the user is outside the supported waves surfaces.

## Limitations / Notes

- Quick vote covers only unrated participatory submissions from the configured
  memes wave.
- The queue follows leaderboard order (newest first), not a full all-time
  submission browser.
- Direct-message threads and the `/messages` shell do not expose quick vote.

## Related Pages

- [Memes Index](README.md)
- [Memes Submission Workflow](feature-memes-submission.md)
- [Wave Drop Entry and Eligibility](../leaderboard/feature-drop-entry-and-eligibility.md)
- [Wave Drop Vote Slider](../drop-actions/feature-vote-slider.md)
- [Wave Participation Flow](../flow-wave-participation.md)
