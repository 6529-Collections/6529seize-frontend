# Wave Link Share and Copy

## Overview

Wave headers expose a single action that either shares or copies the active
wave link, depending on device capabilities.

Users can:

- Share a wave link through native share sheets when available.
- Copy the wave link when share is unavailable or fails.
- See temporary success feedback (`Link shared` or `Link copied`).

## Location in the Site

- App header when an active wave is open on:
  - `/waves/{waveId}`
  - `/messages?wave={waveId}`
- Web thread headers in the same routes:
  - desktop wave tab headers
  - mobile right action cluster

## Availability Rules

- The action is shown only when there is an active non-DM wave.
- Direct-message waves do not show this action.
- Initial mode is:
  - `share` when native share is supported (`navigator.share` on web or
    Capacitor share in native app)
  - `copy` when native share is unavailable

## Entry Points

1. Open a non-DM wave thread.
2. Use the wave-link action button near other thread header controls.

## User Journey

1. Open `/waves/{waveId}` or `/messages?wave={waveId}` for a non-DM wave.
2. Use the wave-link action button:
   - `Share wave` in share mode
   - `Copy wave link` in copy mode
3. On share success, the control shows `Link shared` briefly, then resets.
4. On copy success, the control shows `Link copied` briefly, then resets.
5. If share fails with a non-cancel error, the UI falls back to copy for the
   current wave URL.
6. After navigating to a different wave URL, mode and feedback are recomputed
   for that new wave.

## Edge Cases

- Share-cancel (`AbortError`) does not trigger copy fallback.
- If share is unsupported, the action starts in copy mode.
- This control does not change tabs, route, or sidebar open/closed state.

## Failure and Recovery

- If share fails, retrying uses copy mode for the same wave URL.
- If expected share mode is missing, verify:
  - route has an active non-DM wave
  - platform/browser supports native share
- If feedback text appears stale, wait for the short timeout or switch waves.

## Limitations / Notes

- Feedback labels are temporary UI state and reset automatically.
- Native app share uses canonical `BASE_ENDPOINT` URLs.
- Web share/copy uses the current web origin for generated wave URLs.

## Related Pages

- [Wave Header Index](README.md)
- [Wave Header Controls](feature-wave-header-controls.md)
- [Chat and Gallery View Toggle](feature-chat-gallery-toggle.md)
- [Wave Content Tabs](../chat/feature-content-tabs.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Docs Home](../../README.md)
