# Mobile Pull-to-Refresh Behavior

Parent: [Navigation Index](README.md)

## Overview

In native app layout, you can pull down from the header to refresh data
without leaving the current route.

This refresh invalidates cached query data and triggers an in-app refresh
cycle. It is not a full browser reload.

## Location in the Site

- Native app routes rendered through `AppLayout`.
- Available on app-shell routes that show the app header.
- Not available on desktop web or small-screen web layouts.
- Not available on access/restricted route families that bypass layout wrappers.

## Entry Points

- Open the app in native app-shell context.
- Open an app-shell route and scroll to the top.
- Start the gesture from the header area.

## User Journey

1. At top-of-page, pull down from the header.
2. The pull indicator appears and rotates with pull distance.
3. Release after the trigger threshold (about `80px`) to start refresh.
4. The indicator switches to a spinner while app/query refresh runs.
5. The spinner clears after a short hold (about 1 second), and the route stays
   in place.

## Trigger Rules

- Gesture must begin inside the app header trigger zone.
- Window must be at top (`scrollY <= 0`).
- If the gesture starts in nested scrollable content, that scroll container
  must also be at top.
- Short pulls or upward movement do not trigger refresh.
- While one refresh is running, new pulls are ignored.

## Common Scenarios

- Refresh list-heavy app routes (Discover, Waves, Messages, Notifications,
  Network) without leaving the route.
- Refresh deeper app routes (collections/tools/profile) in place.
- If indicator appears but refresh does not run, pull farther before release.

## Failure and Recovery

- If refresh does not trigger, return to top and restart from header.
- If data still looks stale, use in-route retry actions first, then pull again.
- If stale state persists, switch routes and return, then retry.

## Limitations / Notes

- Native app layout only.
- Keeps current URL and route context.
- Refreshes app/query state; does not force a full page reload.

## Related Pages

- [Navigation Index](README.md)
- [App Header Context](feature-app-header-context.md)
- [Mobile Bottom Navigation](feature-mobile-bottom-navigation.md)
- [Navigation Entry and Switching Flow](flow-navigation-entry-and-switching.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
- [Docs Home](../README.md)
