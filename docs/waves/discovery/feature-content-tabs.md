# Wave Content Tabs

## Overview

Wave pages can expose a tab strip that switches the main content panel between
wave sections such as `Chat`, `Leaderboard`, `Winners`, and other
wave-dependent views.

In the `My Votes` tab, non-image drops use a preview image from drop metadata when available, so rows render quickly and stay stable in list form.
The app stores the last selected tab for each wave on the current device, then
restores it whenever that wave is opened again and the tab is still available.

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
   - Returning to a previously viewed wave restores the last saved valid tab when
     it is still available.
4. Select a tab to switch sections.
5. The main content panel updates in place while staying on the same route.
6. On the `My Votes` tab, each voted drop entry can show a preview thumbnail and
   an inline media format badge when that drop includes media metadata.
   For non-image media, that thumbnail comes from a `preview_image` metadata value
   when present, and media interactions stay disabled in the row.
7. If the active tab is no longer valid when entering a new wave, the active tab
   resets to that wave’s first available tab.

## Common Scenarios

- Switch between `Chat` and `Leaderboard` while a wave is active.
- Open `Winners` once the first decision has passed.
- In memes waves, move between `My Votes`, `FAQ`, and other available tabs.
- In curation waves, use available tabs without an `Outcome` tab.
- In the `My Votes` tab, users can quickly scan entries by format: image,
  video, or interactive media is indicated with a small badge at the title row.
- In `My Votes`, non-image drops show a static preview thumbnail in the row when
  `preview_image` metadata is valid.
- Move between waves and return later; the previously selected tab is restored for the
  wave if it remains available.

## Edge Cases

- Chat-type waves do not render a tab strip.
- `Leaderboard` can disappear after voting has ended for a wave.
- If local tab memory for a wave is unavailable or invalid, the wave opens with its
  default tab.
- `Winners` is shown only after the first decision has passed.
- Non-memes waves do not expose `My Votes` and `FAQ` in the tab strip.
- Tabs expose selected-state semantics and link to the active content panel for
  assistive technologies.
- For memes waves, available tabs are evaluated to prefer `Leaderboard` first; if it
  is unavailable, `Chat` becomes the fallback tab.
- In `My Votes`, non-image rows suppress inline media interaction even when the row
  includes video, audio, or HTML media.
- If `preview_image` is missing or invalid, the row still shows the drop by using
  its standard media source and keeping interaction disabled.

## Failure and Recovery

- If a selected tab becomes unavailable because wave state changes, the
  interface moves to the first available tab.
- If a previously stored tab is no longer available for that wave, the UI falls
  back to the wave default.
- If an unavailable tab is requested, tab state falls back to that wave’s first
  available tab (typically `Leaderboard` for memes waves, otherwise `Chat`).
- If a wave becomes chat-only, the tab strip is removed and the chat panel
  remains available.
- If a `My Votes` row has no preview media available, users still get row metadata
  (title, author, and vote score) and can open the drop.
- If metadata parsing for `preview_image` fails, `My Votes` entries continue to render
  with the row’s media source and remain navigable to the drop detail.

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
