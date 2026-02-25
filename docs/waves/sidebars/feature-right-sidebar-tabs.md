# Wave Right Sidebar Tabs

## Overview

Rank waves can show a tab row in the right sidebar so users can switch between
`About`, `Leaderboard`, `Winners`, `Voters`, and `Activity` without leaving
the current wave route.

## Location in the Site

- Right sidebar panel on wave surfaces that use the shared waves/messages
  layout.
- Shown when a wave is selected and the right sidebar is open.
- Available in inline and overlay sidebar variants.

## Entry Points

- Open a wave in `/waves` or `/messages` and open the right sidebar.
- Keep the right sidebar open while viewing a rank wave.
- Select a tab directly, or open `More` when not all tabs fit.

## User Journey

1. Open a rank wave with the right sidebar visible.
2. Use the tab row at the top of the sidebar to switch sections.
3. If more than three tabs are available, open `More` to access overflow tabs.
4. Select a tab and continue reading/updating sidebar content in place.

## Common Scenarios

- Move between `About` and `Leaderboard` during active voting.
- Open `Winners` after first decision is available.
- Use `Voters` and `Activity` as always-available reference tabs.
- Select an overflow tab and see the `More` trigger label reflect the active
  overflow tab name.
- Use keyboard navigation for visible tabs (`ArrowLeft`, `ArrowRight`, `Home`,
  `End`) and activate overflow menu options from keyboard focus.

## Edge Cases

- Non-rank waves do not show this tab row; sidebar content stays on the
  non-tabbed about/followers layout.
- Tab availability changes with wave state:
  - `Leaderboard` is hidden after voting completes.
  - `Winners` appears only after first-decision timing is reached.
- Overflow appears only when more than three tabs are available.
- When a full drop overlay is open, the right sidebar is not shown.

## Failure and Recovery

- If the active tab becomes unavailable after a wave-state transition, sidebar
  content automatically returns to `About`.
- If a user closes the overflow menu without selecting a tab, the current tab
  remains unchanged.
- If wave data is not available, right-sidebar content is not rendered until
  data is ready.

## Limitations / Notes

- Tab state is session UI state and is not encoded as a dedicated tab URL
  parameter.
- Tab ordering is fixed by wave state rules and does not support custom user
  reordering.
- Overflow tab access depends on the `More` menu when tab count exceeds visible
  capacity.

## Related Pages

- [Waves Index](../README.md)
- [Wave Top Voters Lists](../leaderboard/feature-top-voters-lists.md)
- [Wave Right Sidebar Group and Curation Management](feature-right-sidebar-group-management.md)
- [Wave Content Tabs](../discovery/feature-content-tabs.md)
- [Wave Leaderboard Decision Timeline](../leaderboard/feature-decision-timeline.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Docs Home](../../README.md)
