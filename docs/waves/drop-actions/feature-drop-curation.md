# Wave Drop Curation Actions

## Overview

In curated waves, eligible users can mark leaderboard and participation drops as
curated from the drop action controls. The action toggles between `Curate` and
`Uncurate` and is tracked per drop for your account.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages with an active wave: `/messages?wave={waveId}`
- Waves and drop rows that include the drop action bar (leaderboard list, gallery
  grid, participation view, and completed participation view)

## Entry Points

- Open a wave or DM thread that supports curation.
- Locate a drop card in leaderboard list/grid or participation feed.
- Tap or click `Curate` on desktop or mobile action controls.
- The button becomes `Curated` when the action is active.

## User Journey

1. Open a curation-enabled wave and navigate to a drop where actions are shown.
2. If you are eligible to curate that drop, a `Curate` button is available.
3. Tap/click `Curate`.
4. If successful, the control updates to `Curated`.
5. Tap/click `Uncurate drop` (desktop) or `Curated`/`Curate drop` (mobile) to
   remove the curation tag.
6. Return to leaderboard filtering to review only curation-group-curated drops.

## Common Scenarios

- Use curation on leaderboard list cards in the drop footer actions row.
- In gallery/content cards, curating is available as an inline action over the
  card and in mobile action sheets.
- In participation card views, the curation action appears near voting and
  reaction controls.
- Users can toggle curation on and off quickly without leaving the feed.

## Edge Cases

- The control is not shown for drops you are not eligible to curate.
- Temporary draft drops (IDs prefixed with `temp-`) do not expose curation actions.
- The action is not available in chat-only wave contexts.
- In constrained mobile actions, curation may appear in the same menu as `Open`
  and voting actions.

## Failure and Recovery

- If a curation request fails, the action state returns to the previous value.
- Failed actions surface as an inline toast message.
- Retry by tapping the same curation button again.

## Limitations / Notes

- Curation is independent from voting; it does not submit a vote.
- Curation state is visible only for the currently eligible subset of wave drops.
- If you do not have curation eligibility in the current wave, the control does
  not render.

## Related Pages

- [Waves Index](../README.md)
- [Wave Leaderboard Sort and Group Filters](../leaderboard/feature-sort-and-group-filters.md)
- [Wave Right Sidebar Group and Curation Management](../sidebars/feature-right-sidebar-group-management.md)
- [Wave Leaderboard Gallery Cards](../leaderboard/feature-gallery-cards.md)
- [Docs Home](../../README.md)
