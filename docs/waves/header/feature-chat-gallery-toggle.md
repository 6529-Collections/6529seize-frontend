# Chat and Gallery View Toggle

## Overview

Supported waves expose a header toggle that switches thread content between:

- `Chat`: drop list plus composer
- `Gallery`: media-first gallery view

View mode is stored per wave on the current device.

## Location in the Site

- App header when a supported wave is active.
- Desktop web wave header row on:
  - `/waves/{waveId}`
  - `/messages?wave={waveId}`
- Hidden on narrow web headers and unsupported wave types.

## Entry Points

- Open a supported wave.
- Use the header icon near the wave title:
  - grid icon: switch to gallery
  - chat-bubble icon: switch to chat

## Eligibility Rules

The toggle is shown only when the active wave is:

- not a rank wave
- not a memes wave
- not a direct-message wave

## User Journey

1. Open a supported wave.
2. Select the toggle icon.
3. In gallery mode, chat list and composer are replaced by gallery content.
4. Select again to return to chat mode.
5. Reopen the same wave later; the last saved mode for that wave is restored.

## Common Scenarios

- New waves open in chat mode.
- Users switch to gallery to scan media, then back to chat to post/reply.
- Mode memory is per wave, so changing one wave does not change others.
- App and desktop headers use the same stored mode state.

## Edge Cases

- No active wave means no toggle.
- Unsupported wave types never show the toggle.
- If local storage is unavailable, mode works for the session but may not persist
  after reload.
- Sparse-media waves can show thin gallery results.

## Failure and Recovery

- If toggle response is delayed, wait for wave data load and try again.
- If view mode looks stale, reopen the wave to reinitialize state.
- If persistence is lost after reload, toggle mode again to rewrite saved state.

## Limitations / Notes

- The toggle changes chat-panel presentation only; it does not change route,
  sidebars, or active content tab.
- Gallery mode hides the chat composer while active.
- Mode state is UI preference and is not encoded in URL params.

## Related Pages

- [Wave Header Index](README.md)
- [Wave Header Controls](feature-wave-header-controls.md)
- [Wave Chat Index](../chat/README.md)
- [Wave Content Tabs](../chat/feature-content-tabs.md)
- [Wave Content Display](../drop-actions/feature-content-display.md)
