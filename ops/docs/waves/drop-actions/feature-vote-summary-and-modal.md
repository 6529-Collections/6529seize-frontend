# Wave Drop Vote Summary and Modal

## Overview

Non-chat single-drop panels show a vote summary strip with current total,
optional projected total, wave credit label (`TDH`, `XTDH`, `TDH + XTDH`, or
`Rep`), and a `Vote` action when voting is visible. Selecting `Vote` opens
`Vote for this artwork` with the shared vote-entry form.

Participatory drops in rank waves can also show a separate current-vote
distribution with signed positive and negative highlights.

## Location in the Site

- Non-chat single-drop overlays in thread contexts:
  - `/waves/{waveId}`
  - `/messages/{waveId}`
  - focused drop overlay via `?drop={dropId}`
- Both default and memes single-drop panels reuse the same summary strip.
- Container variants:
  - `VotingModal` (default panel and memes on larger screens)
  - `MobileVotingModal` (memes panel on small screens only)

## Entry Points

- Open a non-chat drop in single-drop view.
- Review the summary strip.
- Select `Vote` when visible.

## User Journey

1. Open a drop detail view.
2. Review the vote summary strip:
   - current total
   - projected total with tooltip when projection differs
   - credit label
   - `Vote` action when visible
3. Select `Vote` to open `Vote for this artwork`.
4. Use slider or numeric controls and submit.
5. Submit button transitions `Vote` -> loading -> `Voted`.
6. After success, voting closes and the same drop detail stays open.

### Read the Current Vote Distribution

1. Find the ribbon inside `Top voters`, beneath its header and `View voters`
   control. The ribbon stays visible whether the voter list is open or closed;
   it does not expand or toggle the list.
2. Review the ribbon beside `−` and `+` and the `Largest opposing vote` and
   `Largest supporting vote` labels below it. Opposing means negative and
   supporting means positive. Each available label identifies one voter and
   their signed current allocation on this drop. These labels are static
   summaries, not buttons or tooltip triggers. On narrow screens, one
   `Largest votes` label sits above a single row of signed highlights. Names
   shorten when space is limited; the amounts remain visible.
3. Hover a segment for its voter and exact signed amount. A striped segment
   shows the other voters' combined amount on that side. Tap or click anywhere
   on the ribbon, or keyboard-focus it, to see the complete breakdown, including
   very small segments. Press `Escape` or tap outside to dismiss the tooltip.
4. Select the `Top voters` header row, apart from its separate download control,
   to reveal the voter rows below the ribbon. Its `View voters` indicator changes
   to `Hide voters` while open.
   The graph and largest-vote summaries stay visible when the list is collapsed.
   Row ordering, absolute totals, and pagination are unchanged.
5. Use `Download All` in the header to download all voters as CSV.
   It stays visible when collapsed and uses an icon-only button on narrow
   screens. Downloading does not toggle the list.

The ribbon's negative and positive widths reflect the amounts on each side,
before they offset each other. Individual segments show the highlighted
voters (up to three per direction), with a striped `Others` segment when there
is a remainder. `Others` represents the remaining allocation amount on that
side, not a voter count. When voter profiles are only partly available, the
authoritative side total still renders and the unenriched amount is included in
`Others`.

These figures describe current allocations, not vote-edit history. In a wave
with time weighting, their raw net can differ from the calculated score and
projection in the existing `TDH Total` strip. That strip, its credit label,
ranking, and voting rules retain their usual meaning.

## Common Scenarios

- Eligible viewers vote directly from single-drop detail.
- When `Vote` is hidden, summary totals still show.
- `Your votes` appears only when voting ended or the drop is a winner, and only
  when the viewer vote is non-zero.
- Negative `Your votes` values display with a leading `-`.
- Default single-drop panels use centered modal overlay on all screen sizes.
- Memes single-drop panels use bottom sheet on small screens and centered modal
  on larger screens.
- The ribbon and its largest positive and negative votes remain visible
  inside the `Top voters` section. Only the voter list beneath them expands;
  there is no second expandable breakdown.
- After you change or reset a vote, an open drop's distribution refreshes.
- While the drop is open, relevant real-time drop and vote updates also request
  a fresh distribution. Closely spaced updates are grouped, so the summary may
  take a moment to catch up.

## Edge Cases

- Chat drops do not render voting summary/vote controls in single-drop details.
- `Vote` is hidden for: not logged in, missing profile handle, proxy session,
  ineligible state, temporary local drop (`temp-*`), winner drops, voting not
  started, and voting ended.
- `No credit` does not automatically hide `Vote`; input range can still resolve
  to zero-only values.
- Projected value and tooltip render only when `rating` and `rating_prediction`
  differ.
- Desktop modal supports `Esc`, backdrop click, and close-button dismissal.
- Desktop modal restores focus to the previously focused element on close.
- In app mode, modal renders inline and does not mutate `document.body`
  overflow.
- Current-vote distribution is limited to participatory rank-wave drops. It is
  omitted for winners and for chat or approve waves, even where those views
  have other voting information.
- If only one direction has votes, only that direction has a largest-voter
  highlight and a sign beside the ribbon. No opposing voter or sign is shown
  for an empty side.
- The first distribution request shows a compact loading placeholder that keeps
  the `Top voters` section stable.
- Missing, invalid, or unavailable distribution data shows a compact recovery
  message with `Retry`. It does not mean all votes are zero or that no negative
  votes exist.

## Failure and Recovery

- Submit performs an auth check first; if auth is canceled or fails, voting
  stays open.
- If vote submit request fails, voting stays open and an error toast is shown.
- Closing voting only closes the voting surface; single-drop view stays open.
- If the optional distribution cannot be loaded, the drop and its normal
  voting controls remain usable. Select `Retry` to request current data again.
- If a background refresh fails, the last valid distribution remains visible.

## Limitations / Notes

- This page owns single-drop vote summary strip and modal/sheet container
  behavior.
- Vote value-entry controls are documented in
  [Wave Drop Vote Slider](feature-vote-slider.md).
- Single-drop `Top voters` behavior is documented in
  [Wave Top Voters Lists](../leaderboard/feature-top-voters-lists.md).
- Summary strip does not show `Voting Starts In` or `Voting Ends In`
  countdown text.
- Distribution summaries do not change `Top voters` pagination, absolute
  totals, markers, or sorting. They do not change vote amounts, credit limits,
  eligibility, time weighting, or leaderboard ranking.
- The distribution loads separately from the drop. Reopening detail can reuse
  a result for up to `60` seconds unless a vote update requests fresh data.
  There is no periodic polling, and the summary is not a live activity log.

## Related Pages

- [Wave Drop Actions Index](README.md)
- [Waves Index](../README.md)
- [Wave Top Voters Lists](../leaderboard/feature-top-voters-lists.md)
- [Wave Drop Vote Slider](feature-vote-slider.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Wave Leaderboard Decision Timeline](../leaderboard/feature-decision-timeline.md)
- [Docs Home](../../README.md)
