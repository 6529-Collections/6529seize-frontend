# Wave Drop Open and Copy Links

## Overview

Wave drop actions expose two distinct link behaviors:

- `Open drop` opens selected drop details in the current thread context by setting
  a `drop` query parameter.
- `Copy link` copies a shareable thread URL that targets a specific drop serial.

In app-shell contexts, opening a drop uses a shared overlay where drop details stay
visible while discussion mode can be shown/hidden inline.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Desktop drop `More` menu
- Non-hover long-press drop menu
- Single-drop app-shell overlay

## Entry Points

- Open a wave or DM thread and use drop action controls.
- Choose `Open drop` from desktop or touch menus.
- Choose `Copy link` from desktop or touch menus.

## User Journey

1. Open a thread and locate a drop.
2. Choose an action:
   - `Open drop` sets `drop` query and opens drop details in current route context.
   - `Copy link` copies an absolute serial-target URL.
3. Copied links use route-specific formats:
   - Wave thread: `/waves/{waveId}?serialNo={serialNo}`
   - DM thread: `/messages?wave={waveId}&serialNo={serialNo}`
4. In app-shell routes, opened drops present full-viewport overlay controls:
   - Desktop: drop detail left + optional right discussion pane.
   - Mobile: full-screen drop detail + right slide-over discussion panel.
5. Closing the drop removes `drop` from query and returns to the same thread state.

## Common Scenarios

- Opening a drop keeps users in current wave/DM context instead of full route exit.
- If selected drop already exists in rendered list state, overlay opens immediately
  with local data, then refreshes with server data.
- Copying in non-DM waves uses canonical `/waves/{waveId}` serial links.
- Copying in DM waves uses `/messages` links with `wave` + `serialNo`.
- Temporary drops disable `Copy link` and show unavailable action state.
- Action controls stop propagation so open/copy actions do not also trigger parent
  card click-through.

## Edge Cases

- `Open drop` is not shown for chat-type drops.
- `Open drop` preserves other query params while replacing current `drop` value.
- If a same-origin link carries both `drop` and `serialNo`, `drop` takes precedence
  and opens drop-preview flow instead of serial quote-jump flow.
- On mobile, background scrolling is blocked while slide-over discussion is open.
- Serial-target links may require historical fetches before target becomes visible.
- Desktop copy actions can still resolve DM routing from stream context when direct
  DM metadata is incomplete.

## Failure and Recovery

- If clipboard permission is blocked, copy feedback may not appear; users can retry
  after permission/context is restored.
- If opened-drop details are stale, overlay renders latest local data first and then
  refreshes from API.
- If serial-target navigation stalls after opening copied links, temporary scroll
  overlays clear while normal scrolling remains available.

## Limitations / Notes

- `Open drop` (`drop` query) and copied links (`serialNo` query) are separate
  navigation mechanisms.
- `Copy link` is unavailable for temporary drops.
- Copied links target thread position; they do not force persistent single-drop
  overlay state.

## Related Pages

- [Waves Index](../README.md)
- [Wave Chat Serial Jump Navigation](../chat/feature-serial-jump-navigation.md)
- [Wave Drop Quote Link Cards](feature-quote-link-cards.md)
- [Wave Drop Content Display](feature-content-display.md)
- [Wave Drop Selection Copy](feature-selection-copy.md)
- [Wave Drop Reactions and Rating Actions](feature-reactions-and-ratings.md)
- [Legacy Route Redirects](../../shared/feature-legacy-route-redirects.md)
