# Wave Right Sidebar Trending Drops

## Overview

The right sidebar `About` view shows a `Trending` section powered by boost
activity in the active wave.

Users can switch `Day`, `Week`, and `Month` windows, then jump directly to a
drop in the same thread.

The list shows up to five cards. `#1` gets the strongest visual emphasis.
Rank labels use `#1` (yellow), `#2` (silver), and `#3` (amber).

## Location in the Site

- Wave threads on `/waves/{waveId}` when the right sidebar is open.
- Direct-message threads on `/messages?wave={waveId}` when the right sidebar is
  open.
- Right sidebar `About` content:
  - rank waves: `About` tab
  - non-rank waves: default about content

## Entry Points

- Open a wave thread and keep the right sidebar open.
- Open `About`.
- Select `Day`, `Week`, or `Month`.
- Select a trending card.

## User Journey

1. Open `/waves/{waveId}` or `/messages?wave={waveId}`.
2. Open right sidebar `About`.
3. Choose `Day` (default), `Week`, or `Month`.
4. Review up to five boosted-drop cards.
5. Select a card to jump to that drop in the current thread.

## Common Scenarios

- The section loads with skeleton placeholders.
- Changing time windows recalculates ranking for that window.
- Empty windows show `No boosted drops yet`.
- Jumping uses serial navigation in the same thread:
  - already loaded target: immediate scroll
  - older target: pagination loads until reachable

## Edge Cases

- The section stays visible even when there are no boosted drops.
- The list stays capped at five cards.
- Only the top row gets the stronger card highlight.
- This section complements, not replaces, boosted cards in the message list.

## Failure and Recovery

- Boosted-drop fetches retry automatically while the section is visible.
- Polling continues in the background.
- Users can continue using other sidebar sections while data refreshes.

## Limitations / Notes

- Time windows are fixed rolling ranges (1 day, 7 days, 30 days).
- No custom date range.
- No manual refresh button for this section.
- Maximum visible ranking depth is five items.
- Canonical wave route is `/waves/{waveId}` (`/waves?wave={waveId}` is legacy
  and redirects).

## Related Pages

- [Waves Index](../README.md)
- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Wave Right Sidebar Group and Curation Management](feature-right-sidebar-group-management.md)
- [Wave Drop Boosting](../drop-actions/feature-drop-boosting.md)
- [Docs Home](../../README.md)
