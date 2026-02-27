# Mobile Bottom Navigation

Parent: [Navigation Index](README.md)

## Overview

In mobile app layout, primary section switching uses a fixed bottom bar with
tabs for `Discover`, `Waves`, `Messages`, `Home`, `Network`, `Collections`,
and `Notifications`. Messages/notifications tabs can show unread dots.

## Location in the Site

- App routes rendered through `AppLayout` (`isApp` context).
- Not used on small-screen web fallback layout (that layout uses web sidebar
  navigation).

## Entry Points

- Open the app in native/app-shell mode.
- Stay on any route that keeps bottom navigation available.

## User Journey

1. User opens an app-shell route.
2. Bottom bar appears with seven section tabs.
3. User taps a tab to switch sections:
   - `Discover` -> `/discover`
   - `Home` -> `/`
   - `Waves` -> waves list/thread context
   - `Messages` -> messages list/thread context
   - `Network` -> `/network`
   - `Collections` -> `/the-memes`
   - `Notifications` -> `/notifications`
4. Active tab indicator updates with route, `view`, and active-wave state.
5. User keeps switching between sections without opening side menus.

## Common Scenarios

- From `/discover`, tap `Home` to return to `/`.
- From `/waves/{waveId}`, tap `Waves` to clear active thread and return to
  waves root.
- From `/messages?wave={id}`, tap `Messages` to clear active DM thread and
  return to messages root.
- When already on section roots, `Waves`/`Messages` can reopen the last visited
  thread in that category when one is cached.
- `Network` stays active for network-context routes such as `/network/*` and
  `/nft-activity`.
- Tap `Notifications` to open notification feed with unread badge awareness.

## Edge Cases

- While mobile keyboard is open, the bar stays mounted but slides out of view
  and is non-interactive.
- While a single drop is opened (`?drop=...`) or an inline drop edit is active,
  the bar is not rendered.
- On web small-screen layout (not app mode), this bar does not render.
- `Home` is active only on `/` when no wave/view override is active.

## Failure and Recovery

- If tab switch does not apply, wait for in-flight transition and tap again.
- If a tab keeps reopening stale thread state, tap the same section tab from a
  thread first to clear cached last-visited state, then retry.
- If the bar is hidden, dismiss keyboard and close drop/edit overlays first.

## Limitations / Notes

- This page documents app-shell behavior only.
- Secondary destinations (network/tools/about/profile/account actions) are in
  [App Sidebar Menu](feature-app-sidebar-menu.md).
- Web desktop/small-screen routing is documented in
  [Web Sidebar Navigation](feature-sidebar-navigation.md).

## Related Pages

- [Navigation Index](README.md)
- [App Sidebar Menu](feature-app-sidebar-menu.md)
- [Mobile Pull-to-Refresh Behavior](feature-mobile-pull-to-refresh.md)
- [Mobile Keyboard and Bottom Navigation Layout](feature-android-keyboard-layout.md)
- [Navigation Entry and Switching Flow](flow-navigation-entry-and-switching.md)
- [Discover Cards](../waves/discovery/feature-discover-cards.md)
