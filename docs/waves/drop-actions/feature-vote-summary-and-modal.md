# Wave Drop Vote Summary and Modal

## Overview

Non-chat single-drop panels show a vote summary strip with current total,
optional projected total, wave credit label (`TDH`, `XTDH`, `TDH + XTDH`, or
`Rep`), and a `Vote` action when voting is visible. Selecting `Vote` opens
`Vote for this artwork` with the shared vote-entry form.

## Location in the Site

- Non-chat single-drop overlays in thread contexts:
  - `/waves/{waveId}`
  - `/messages?wave={waveId}`
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

## Common Scenarios

- Eligible viewers vote directly from single-drop detail.
- When `Vote` is hidden, summary totals still show.
- `Your votes` appears only when voting ended or the drop is a winner, and only
  when the viewer vote is non-zero.
- Negative `Your votes` values display with a leading `-`.
- Default single-drop panels use centered modal overlay on all screen sizes.
- Memes single-drop panels use bottom sheet on small screens and centered modal
  on larger screens.

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

## Failure and Recovery

- Submit performs an auth check first; if auth is canceled or fails, voting
  stays open.
- If vote submit request fails, voting stays open and an error toast is shown.
- Closing voting only closes the voting surface; single-drop view stays open.

## Limitations / Notes

- This page owns single-drop vote summary strip and modal/sheet container
  behavior.
- Vote value-entry controls are documented in
  [Wave Drop Vote Slider](feature-vote-slider.md).
- Single-drop `Top voters` behavior is documented in
  [Wave Top Voters Lists](../leaderboard/feature-top-voters-lists.md).
- Summary strip does not show `Voting Starts In` or `Voting Ends In`
  countdown text.

## Related Pages

- [Wave Drop Actions Index](README.md)
- [Waves Index](../README.md)
- [Wave Top Voters Lists](../leaderboard/feature-top-voters-lists.md)
- [Wave Drop Vote Slider](feature-vote-slider.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Wave Leaderboard Decision Timeline](../leaderboard/feature-decision-timeline.md)
- [Docs Home](../../README.md)
