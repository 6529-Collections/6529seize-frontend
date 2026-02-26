# Mobile Bottom Navigation

Parent: [Navigation Index](README.md)

## Overview

On the mobile app shell, core destination switching uses a fixed bottom bar.
This bar is separate from the small-screen web sidebar and includes dedicated
tabs for `Discover`, `Waves`, `Messages`, `Home`, `Network`, `Collections`, and
`Notifications`.

## Location in the Site

- App routes rendered with `AppLayout` (mobile app context).
- Not shown in browser web on small-screen fallback layout, which uses the
  sidebar header flow.

## Entry Points

- Open the app shell in a mobile-capable context (`isApp` mode).
- Be on any route that supports app-shell rendering.

## User Journey

1. Open a route in app mode.
2. A fixed bar renders at the bottom of the viewport.
3. Tap:
   - `Discover` to open `/discover`.
   - `Home` to open `/`.
   - `Waves` to open the waves section.
   - `Messages` to open the messages section.
   - `Network` to open `/network`.
   - `Collections` to open `/the-memes`.
   - `Notifications` to open `/notifications` in app mode.
4. The active destination updates with route context and stays readable while
   navigating between route families.
5. The bar remains available during normal route transitions, including wave and
   notification flows.

## Common Scenarios

- Starting from `/discover`, using `Home` returns to the homepage surface at `/`.
- Returning to the `Waves` tab from `/waves/{waveId}` returns to the waves list
  rather than reopening the same in-page thread.
- Returning to the `Messages` tab from `/messages?wave={id}` returns to the message
  section home rather than forcing that same thread.
- When browsing a wave route and opening `Home`, active-wave route context is
  cleared so the app returns to a global section root.
- In app mode, `Notifications` opens the authenticated notification surface.

## Edge Cases

- On mobile app clients with an active keyboard, the bar is hidden so composer and
  input-first surfaces are not blocked.
- On web small-screen layout (not app mode), the bar is not rendered; use the
  header/sidebar layout instead.
- `Home` is only shown as active on `/` without an active wave/view override; other
  wave-focused routes use their dedicated active-section logic.
- On desktop-style or non-app navigation contexts, this bar does not render and
  bottom-space reservation is handled by different layouts.

## Failure and Recovery

- If route switching does not happen after tapping a tab, wait for any in-flight
  route transition state to settle and tap again.
- If bar visibility is lost due to an invalid app shell state, reopen the route from
  any sidebar or deep link so the app shell rehydrates the current bottom bar.

## Limitations / Notes

- This page documents app-shell behavior only.
- The side menu and header still provide additional navigation paths in small-screen
  non-app contexts.
- On web desktop, route navigation still uses the sidebar as the primary route
  surface.

## Related Pages

- [Navigation Index](README.md)
- [Mobile Pull-to-Refresh](feature-mobile-pull-to-refresh.md)
- [Mobile Keyboard and Bottom Navigation Layout](feature-android-keyboard-layout.md)
- [Sidebar Navigation](feature-sidebar-navigation.md)
- [Discover Cards](../waves/discovery/feature-discover-cards.md)
- [Docs Home](../README.md)
