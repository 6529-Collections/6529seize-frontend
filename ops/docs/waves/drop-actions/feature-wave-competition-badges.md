# Wave Competition Participant and Winner Badges

## Overview

Drop author rows can show two competition badges that belong to the current wave:

- a circular violet flag when the author has one or more active participatory
  entries in that wave
- a circular emerald medal when the author has one or more winning entries in
  that wave

These badges are scoped to the wave containing the chat message. They are not
global artist status and do not appear in The Memes Main Stage, which keeps its
existing palette and trophy badges.

## Location in the Site

- Chat, participatory, and winner drop author rows on `/waves/{waveId}`.
- Chat, participatory, and winner drop author rows on `/messages/{waveId}` when the thread has
  competition entries.
- Single-drop overlays for chat messages opened with `drop={dropId}` in the
  current thread route.

## Entry Points

- Select the violet flag to open the author's active entries in the current
  wave.
- Select the emerald medal to open the author's winning entries in the current
  wave.
- On non-touch desktop devices, each badge has a tooltip with its status and
  wave name.

## User Journey

1. Open a wave chat containing a competition.
2. Find a chat message from a participant or winner.
3. Select a competition badge beside the author's handle.
4. Review that author's entries in the current wave.
5. When the author has both active and winning entries, switch between `Active
   entries` and `Winning entries`.
6. Select an entry card to open that drop in the current route context.
7. If an active participatory entry is still open for voting, use the mini vote
   control below its card.
8. Close with the close button, backdrop, Escape key, or app swipe-down action.

## Common Scenarios

- One author can show both badges when they have an active entry and a winning
  entry in the same wave.
- Multiple qualifying entries are shown in the selected modal section.
- Entry details are requested only after a badge is selected. Long entry lists
  are paginated and can be extended with `Load more entries`.
- Entry cards show available media or a text fallback, title, position, score,
  and creation date.
- Winner entries have an emerald `Winner` label.
- Opening an entry preserves the current route query and sets its `drop`
  parameter.
- In compact small-screen thread layouts, opening an entry also closes the chat
  column.

## Edge Cases

- The API supplies only participant and winner booleans scoped to the wave of
  each returned drop; it does not send competition entry IDs eagerly.
- The badges are hidden in The Memes Main Stage even if entry metadata is
  present.
- Tabs are hidden when the author has only active entries or only winning
  entries.
- Vote controls are hidden for winners and for active entries after voting
  closes.
- Normal wave voting eligibility, available-credit, and proxy rules still
  apply when a vote control is visible.

## Failure and Recovery

- While entries load, the modal shows a loading state.
- If entry loading fails, select `Retry` or close and reopen the modal.
- If no matching entries are available when the lazy request runs, the
  selected section shows an empty state.
- Realtime drop refreshes update author badge metadata after participation or
  winner state changes.

## Limitations / Notes

- The badges describe competition status only in the wave containing the chat
  message; they do not summarize participation across all waves.
- The viewer is read-only except for the existing vote controls on open active
  entries.
- The circular shape, flag/medal icons, and violet/emerald colors distinguish
  these badges from Main Stage's square palette/trophy badges.

## Related Pages

- [Wave Drop Actions Index](README.md)
- [Wave Drop Artist Preview Modal](feature-artist-preview-modal.md)
- [Wave Drop Vote Slider](feature-vote-slider.md)
- [Wave Drop Content Display](feature-content-display.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Docs Home](../../README.md)
