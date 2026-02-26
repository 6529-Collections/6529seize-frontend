# Wave Leaderboard Decision Timeline

## Overview

Leaderboard views for multi-decision waves include a collapsible timeline
header that summarizes upcoming decision timing and season-transition
announcements.

## Location in the Site

- Wave detail pages that expose the `Leaderboard` tab.
- Desktop leaderboard layout above sort/filter controls and drop results.
- Mobile leaderboard view before leaderboard content sections.

## Entry Points

- Open a wave that has a `Leaderboard` tab available.
- Switch from `Chat` to `Leaderboard`.
- Look for the timeline header card at the top of leaderboard content.

## User Journey

1. Open the wave leaderboard.
2. Read the collapsed header summary:
   - `Decision Timeline` when an upcoming decision is available.
   - `Announcement history` when no upcoming decision is available.
3. Check the status text:
   - During pause windows: `Congrats to last SZN winners!` and
     `Next SZN starts: <date>`.
   - Outside pauses with an upcoming decision: next decision date/time.
   - Without upcoming events: `No upcoming events`.
4. Click the header to expand timeline details.
5. Use `Show earlier` / `Show later` controls to load additional decision
   points when those controls are available.

## Common Scenarios

- Users see the next decision time without opening the full timeline.
- During a pause between seasons, users see season-transition messaging plus
  the next season start date.
- Expanding the timeline auto-focuses near the next upcoming decision when one
  is present.
- When no future decision is currently visible, the summary remains in
  announcement mode until future decision points become available.

## Edge Cases

- If the next decision is outside the initial visible window, the timeline
  attempts short auto-expansion of future items before settling.
- In pause mode, the start date shown in `Next SZN starts` uses the pause-aware
  minting date when available, and falls back to the pause end date.
- `Show earlier` / `Show later` can appear without explicit counts when
  remaining counts are unavailable.
- If no decision points are available, expanding the timeline shows no decision
  markers.

## Failure and Recovery

- If users cannot load additional past/future decision points, already loaded
  timeline items stay visible and users can retry with the same controls.
- If no valid upcoming decision exists, the header remains readable with
  `No upcoming events` instead of a broken timestamp.
- If the page is refreshed, the timeline reverts to collapsed state; users can
  expand it again from the header.

## Limitations / Notes

- This timeline is shown only for multi-decision leaderboard waves.
- Date/time formatting follows the browser locale.
- Expanded/collapsed state is per-session UI state and is not persisted in URL
  parameters.

## Related Pages

- [Waves Index](../README.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
