# Loading Status Indicators

Parent: [Shared Index](README.md)

## Overview

Shared loading indicators show when list data is still loading.
The shared spinner pattern shows loading copy and a polite screen-reader status.

## Location in the Site

- `/{user}/brain` profile drop feed.
- `/notifications` feed prerequisites and initial feed load.
- `Outcome` tabs in wave contexts that expose them, including
  `/waves/{waveId}` and `/messages?wave={waveId}`.

## Entry Points

- Open one of the routes above when its data is not cached yet.
- Scroll paginated lists to trigger next-page fetches.
- In notifications, change filters or reload feed data.

## User Journey

1. Open a route or tab that still needs server data.
2. A spinner appears with context text (for example `Loading drops...`).
3. Screen readers hear a polite status update for the same loading state.
4. After data resolves, the loading indicator is replaced by content, empty
   state, or an error state from that feature.

## Common Scenarios

- Profile Brain tab initial load shows `Loading drops...`.
- Profile Brain tab pagination shows `Loading more drops...`.
- Notifications can show `Loading profile...` before profile prerequisites are
  resolved.
- Notifications initial feed load shows `Loading notifications...` when no rows
  are rendered yet.
- Notifications background refetches and cause-filter changes keep existing rows
  visible when possible instead of replacing the list with a full spinner.
- Notifications older-page fetch shows inline `Loading older notifications...`
  near the top of the list, plus a thin top loading bar.
- Outcome tab initial load shows `Loading outcomes...`; pagination shows
  `Loading more outcomes...`.

## Edge Cases

- If loading text is blank, the spinner can render without a visible caption.
- In that case, screen readers still hear fallback text: `Loading...`.
- Current route callers pass non-empty loading text.

## Failure and Recovery

- Shared indicators do not show failure reasons or retry controls.
- Each owning feature controls failure copy and retry behavior (for example
  notifications `Try again`).
- Users can retry by using that feature's retry action, refreshing, or
  re-triggering the load action.

## Limitations / Notes

- Spinner indicators are indeterminate; they do not show percent completion.
- Spinner status announcements are polite (`aria-live="polite"`), not
  assertive alerts.
- The inline `Loading older notifications...` row and top loading bar are visual
  indicators; they are separate from the shared spinner live-region pattern.

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [Profile Brain Tab](../profiles/tabs/feature-brain-tab.md)
- [Notifications Feed](../notifications/feature-notifications-feed.md)
- [Wave Outcome Lists](../waves/feature-outcome-lists.md)
