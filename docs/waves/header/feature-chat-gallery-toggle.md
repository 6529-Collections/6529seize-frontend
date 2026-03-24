# Chat and Gallery View Toggle

## Overview

In supported waves, a header icon switches thread view between:

- `Chat`: drop list and composer
- `Gallery`: media-only grid

The selected mode is saved per wave on the current device.

## Location in the Site

- App header when an active supported wave is open.
- Desktop web wave header row on:
  - `/waves/{waveId}`
  - `/messages?wave={waveId}`
- Hidden on mobile/tablet web headers (`<1024px`).

## Availability Rules

The toggle is shown only when the active wave is:

- not a rank wave
- not a memes wave
- not a direct-message wave

When hidden, wave content stays in chat mode.

## Entry Points

1. Open a supported wave.
2. Select the header icon next to the wave title.

Icon behavior:

- grid icon: switch to gallery
- chat-bubble icon: switch to chat

## User Journey

1. Open a supported wave.
2. Select the toggle icon.
3. Content updates in place without route change.
4. In gallery mode:
   - drop list and composer are replaced by gallery cards
   - first fetch shows `Loading gallery...`
   - no media result shows `No media drops yet`
5. Select again to return to chat.

## Persistence and Sync

- Each wave starts in chat mode until changed.
- Mode is stored per wave, so changing one wave does not change others.
- App header and desktop web header read the same saved mode on the device.
- Desktop browser tabs sync mode changes for the same wave.
- If browser storage is unavailable, mode still works for the open session but
  may reset after reload.

## Edge Cases

- No active wave: toggle is hidden.
- Unsupported wave types (rank, memes, direct-message): toggle is hidden.
- Gallery can be empty when a wave has text-only drops.

## Failure and Recovery

- Toggle missing: confirm wave type and web viewport width.
- Mode not persisting after reload: check browser storage/privacy settings and
  retry.
- Gallery appears empty: confirm the wave has media drops.
- Gallery has no dedicated fetch-error panel; failed loads can appear as a
  non-updating or empty gallery.

## Limitations / Notes

- This control changes chat-panel presentation only.
- URL, sidebars, and active tab do not change when toggling.
- Composer is hidden while gallery mode is active.

## Related Pages

- [Wave Header Index](README.md)
- [Wave Header Controls](feature-wave-header-controls.md)
- [Wave Chat Index](../chat/README.md)
- [Wave Content Tabs](../chat/feature-content-tabs.md)
- [Wave Content Display](../drop-actions/feature-content-display.md)
