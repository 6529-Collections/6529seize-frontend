# Wave Content Tabs

## Overview

Wave pages can expose a tab strip that switches the main content panel between
wave sections such as `Chat`, `Leaderboard`, `Winners`, and other
wave-dependent views.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages with an active wave: `/messages?wave={waveId}`
- In the web layout, tabs appear below the wave header and above the main
  content panel.

## Entry Points

- Open a wave from waves lists, profile wave links, or a shared wave URL.
- Open a direct message thread with a selected wave.
- Select a tab from the wave tab strip.

## User Journey

1. Open a wave.
2. If the wave is chat-only, content opens directly in chat without a tab
   strip.
3. If multiple sections are available, the tab strip appears and selects the
   active tab:
   - Most waves default to `Chat`.
   - Memes waves default to `Leaderboard` when that tab is available.
   - Returning to a previously viewed wave restores the last valid tab when it
     is still available.
4. Select a tab to switch sections.
5. The main content panel updates in place while staying on the same route.

## Common Scenarios

- Switch between `Chat` and `Leaderboard` while a wave is active.
- Open `Winners` once the first decision has passed.
- In memes waves, move between `My Votes`, `FAQ`, and other available tabs.
- In curation waves, use available tabs without an `Outcome` tab.

## Edge Cases

- Chat-type waves do not render a tab strip.
- `Leaderboard` can disappear after voting has ended for a wave.
- `Winners` is shown only after the first decision has passed.
- Non-memes waves do not expose `My Votes` and `FAQ` in the tab strip.
- Tabs expose selected-state semantics and link to the active content panel for
  assistive technologies.

## Failure and Recovery

- If a selected tab becomes unavailable because wave state changes, the
  interface moves to the first available tab.
- If an unavailable tab is requested, tab state falls back to `Chat`.
- If a wave becomes chat-only, the tab strip is removed and the chat panel
  remains available.

## Limitations / Notes

- Tab selection is UI state and is not encoded in wave URLs.
- Available tabs depend on wave type, curation settings, voting state, and
  first-decision status.
- In app-specific surfaces, tab presentation can differ from the web layout.

## Related Pages

- [Waves Index](../README.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Wave Right Sidebar Tabs](../sidebars/feature-right-sidebar-tabs.md)
- [Wave Leaderboard Decision Timeline](../leaderboard/feature-decision-timeline.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Docs Home](../../README.md)
