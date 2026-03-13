# Chat and Gallery View Toggle

## Overview

In supported wave threads, the app header includes a compact toggle that switches the main content between:
- Chat mode (message list with composer)
- Gallery mode (media-first gallery layout)

This control is available in the mobile app shell where wave tabs are not rendered in the desktop tab bar.

## Location in the Site

- Mobile wave views with an active wave context under `/waves/{waveId}`.
- The toggle is not shown for direct-message threads accessed via `/messages?wave={id}`.

## Entry Points

- Open any supported wave that is not a rank wave, meme wave, or direct message thread.
- Locate the header icon next to the wave title:
  - Grid icon indicates switching to gallery mode.
  - Chat bubble icon indicates switching to chat mode.

## User Journey

1. Open the thread.
2. Tap the header mode icon.
3. The chat panel swaps between:
   - chat list and composer (chat mode), or
   - gallery layout (`WaveGallery` content) without the composer area (gallery mode).
4. Repeat the action to switch back.
5. Leave the thread and return; the selected mode is restored for that wave.

## Common Scenarios

- Default mode starts in chat view.
- In mobile, this replaces the desktop tab-based view-mode controls.
- Users can quickly inspect visual drops in gallery mode while keeping all same thread content context.

## Edge Cases

- The toggle is hidden for unsupported wave types:
  - rank waves
  - meme waves
  - direct-message waves
- When no wave is active, no mode toggle is shown.
- If a wave has no gallery-ready drops, gallery mode may appear sparse compared to chat mode.

## Failure and Recovery

- If a mode switch seems unresponsive, refreshing the thread usually restores controls and state.
- If you still cannot switch modes, reopening the wave resets active UI context and re-enables the toggle flow.

## Limitations / Notes

- This control affects the active chat content view only; it does not change sidebars, search, or creator actions.
- Gallery mode is still part of the same wave stream and uses the same wave context.

## Related Pages

- [Wave Header Index](README.md)
- [App Header Context](../../navigation/feature-app-header-context.md)
- [Wave Chat Index](../chat/README.md)
- [Wave Gallery Content](../drop-actions/README.md)
