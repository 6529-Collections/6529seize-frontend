# Memes Quick Vote

## Overview

This page covers the dedicated Memes quick-vote flow for rating unrated
participatory submissions in the configured memes wave.

## Location in the Site

- Desktop web waves sidebar footer on non-`/messages` shells
- Collapsed desktop waves sidebar quick-vote pill
- App/mobile `Waves` view footer
- Quick-vote dialog overlay

## Entry Points

- Quick vote requires an authenticated non-proxy profile with a handle plus a
  configured memes wave.
- The trigger appears only when the viewer still has remaining voting power and
  at least one unrated memes submission left.
- Expanded footer surfaces open quick vote from the `Uncast Power` card.
- Compact surfaces open quick vote from the bolt-count trigger.
- On app/mobile, quick vote opens from the `Waves` view footer rather than a
  floating thread trigger.

## User Journey

1. Open quick vote from any available trigger.
2. Quick vote opens a full dialog skeleton while it loads the unrated memes
   queue and remembered vote amounts.
3. Review the current meme preview, including artwork, title, description,
   author, and timestamp. Submission counts appear at the top; remaining voting
   power appears above the voting controls.
4. Vote by either:
   - selecting `Vote` with the amount shown on the button
   - tapping a remembered amount button
   - opening `Change vote amount`, entering an amount, and selecting `Vote` or
     pressing Enter
   - swiping right on a touch screen in the mobile layout using the currently
     selected amount
5. Skip the current meme by clicking `Skip` or swiping left on a touch screen in
   the mobile layout.
6. After each vote or skip, quick vote advances to the next eligible meme.
7. When no unrated memes remain, or remaining power reaches zero, the dialog
   ends with `You're all caught up`.

## Common Scenarios

- Expanded surfaces show an `Uncast Power` card with remaining power plus
  `{count} unexplored`; compact surfaces show the remaining count only.
- Quick amount buttons remember up to five recent vote amounts per profile and
  memes wave. The most recent remembered amount is highlighted.
- The bottom control bar places `Change vote amount` on the left, `Vote` in the
  center, and `Skip` on the right.
- Custom entry starts closed, including when there are no remembered amounts.
  Select `Change vote amount` to open it. Closing the editor keeps the typed
  draft for reopening on the same submission; typing alone does not save a
  remembered amount for later submissions.
- In the native app's mobile layout, the dialog shrinks when the keyboard opens
  to keep the amount input and voting controls above it.
- Remembered amounts appear above the control bar while custom entry is closed.
  Selecting one submits that amount.
- Descriptions start collapsed to two lines in the mobile layout and four on
  desktop. `See more` appears only when text is hidden; `See less` collapses it
  again.
- Swipe chevrons appear only on touch screens in the mobile layout. In a narrow
  browser window without touch input, use the `Vote` and `Skip` buttons.
- Custom amounts are normalized to a whole number and capped at the current
  remaining voting power.
- `Skip` defers the current meme instead of discarding it permanently.

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
  `Couldn't load your queue`, explains that quick vote could not reach the
  leaderboard, and offers `Try again`.
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
