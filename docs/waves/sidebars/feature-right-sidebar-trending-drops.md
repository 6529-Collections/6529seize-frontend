# Wave Right Sidebar Trending Drops

## Overview

The wave right sidebar `About` view now shows a **Trending** section powered by
boost activity.

The section displays top boosted drops from the current wave and lets users jump
directly to a boosted drop from the sidebar.

## Location in the Site

- Wave detail surfaces with the right sidebar (`/waves/{waveId}` and
  `/messages?wave={waveId}`).
- `About` content inside the right sidebar, both for rank waves and non-rank waves
  that show the same `About` layout.
- The section is shown when the right sidebar About content is available for a wave.

## Entry Points

- Open a wave and keep the right sidebar open.
- Select the `About` tab for rank waves, or the only side rail content for non-rank
  waves.
- Use the `Day`, `Week`, or `Month` selector in the Trending header.
- Tap/click a trending card to jump to that drop in the current wave thread.

## User Journey

1. Open a wave in `/waves` or `/messages` with the right sidebar visible.
2. Open `About` in the sidebar.
3. Read the `Trending` section at the top of that side content.
4. Use one of the time-window buttons:
   - `Day` (default)
   - `Week`
   - `Month`
5. Review up to five cards ranked by recent boost activity.
6. Click a card to jump to the referenced drop.

## Common Scenarios

- The section loads immediately after entering the sidebar with a loading skeleton.
- A freshly opened page shows most recent trending drops for the selected
  day/week/month window.
- Selecting a longer window surfaces drops that gained boosts earlier in the
  selected period.
- Empty states show a neutral "No boosted drops yet" message.
- Jumping to a referenced drop uses shared chat serial navigation:
  - In-frame targets scroll immediately.
  - Off-frame targets load nearby chat pages until the target is reachable.

## Edge Cases

- If no drops are boosted in the selected window, the list is empty but the
  section remains visible.
- The list is intentionally capped at five cards.
- Time-window filters recalculate ranking by boost activity within the selected
  window.
- This section is part of sidebar content and does not replace boost cards embedded
  in the wave message list.

## Failure and Recovery

- The section retries boosted-drop fetches automatically while visible.
- While loading or temporarily unavailable, users see loading placeholders.
- If boosted data has not loaded yet, users can still interact with other sidebar
  content and retry by revisiting the page after network recovery.

## Limitations / Notes

- The section uses a fixed day/week/month rolling window; there is no custom date
  selector.
- The section updates only from the boosted-drop feed polling behavior used by the
  app, not from a manual refresh control.
- The maximum visible ranking depth is five items.

## Related Pages

- [Waves Index](../README.md)
- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Wave Right Sidebar Group and Curation Management](feature-right-sidebar-group-management.md)
- [Wave Drop Boosting](../drop-actions/feature-drop-boosting.md)
- [Docs Home](../../README.md)
