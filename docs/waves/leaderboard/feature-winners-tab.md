# Wave Winners Tab

## What This Covers

This page covers when `Winners` appears, how winners render in main thread and
right sidebar, and what users see for loading and empty states.

## Where Users See It

- Rank-wave thread routes: `/waves/{waveId}`
- Rank-wave direct-message routes: `/messages?wave={waveId}`
- Main thread tab row on desktop and mobile
- Right-sidebar `Winners` tab on rank waves

## Availability Rules

- `Winners` appears only after the first decision time passes.
- If first decision time is missing or still in the future, `Winners` is
  hidden.
- Before voting ends, `Leaderboard` and `Winners` can both be visible.
- After voting ends, `Leaderboard` is removed; `Winners` can remain.
- Tab choice is UI state and is not encoded in URL tab parameters.

## Open and Use Winners

1. Open a rank wave and switch to `Winners`.
2. Review winner cards/rows in the current surface (main thread or sidebar).
3. Select a winner to open that drop in the current thread context.
4. Close the drop and continue from `Winners`.

## Main Thread Behavior

### Single-decision waves

- Podium shows first, second, and third place when available.
- Winner rows render below the podium.
- If no winners exist, empty state shows:
  - `No Winners to Display`
  - `This wave ended without any submissions`
- Podium can render fewer than three winners.

### Multi-decision waves

- Winners render in decision-time groups.
- Groups are ordered newest decision first.
- Decision groups with zero winners are hidden.
- If no decision has winners, empty state shows:
  - `No Winners Yet`
  - `No winners have been announced for this wave yet. Check back later!`

## Right Sidebar Behavior

- `Winners` appears in sidebar tabs only after first decision time passes.
- Loading state shows compact skeleton placeholders.
- If no decision points are returned, sidebar empty state shows `No Winners
  Yet`.
- Single-decision waves render compact winners from the first decision.
- Multi-decision waves show a decision selector with date/time and winner
  counts.
- The selector defaults to the first returned decision point.
- If the selected decision has zero winners, the list area is empty with no
  extra message.
- Single-decision waves can show the same empty list behavior when the first
  decision exists but has zero winners.

## Common Scenarios

- Memes waves show media-rich winner cards with traits and vote context.
- Non-memes waves show compact winner rows with rank, vote totals, voter
  counts, and outcome summaries.
- Winner rank labels use ordinal place formatting (`1st`, `2nd`, `3rd`,
  `4th`, and so on).
- Winner rows can show your vote value when you voted on that drop.
- On touch devices, winner-card actions use the touch action sheet instead of
  desktop hover/open controls.

## Loading, Failure, and Recovery

- While decisions load, winners surfaces show loading placeholders.
- There is no dedicated winners error panel.
- If decision data is unavailable, winners can resolve to empty-state messaging.
- Refresh the current wave route and retry.
- If one winner drop fails to open, close that overlay and open another winner.

## Related Pages

- [Wave Leaderboards Index](README.md)
- [Wave Content Tabs](../chat/feature-content-tabs.md)
- [Wave Leaderboard Decision Timeline](feature-decision-timeline.md)
- [Wave Outcome Lists](../feature-outcome-lists.md)
- [Wave Right Sidebar Tabs](../sidebars/feature-right-sidebar-tabs.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Docs Home](../../README.md)
