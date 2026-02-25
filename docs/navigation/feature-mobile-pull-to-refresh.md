# Mobile Pull-to-Refresh Behavior

## Overview

On mobile app routes, pull-to-refresh is enabled inside the app shell and
uses the shared query cache refresh path instead of forcing a hard page reload.
A short pull-down gesture on eligible headers invalidates in-memory data and
starts a lightweight refresh cycle.

## Location in the Site

- App-shell routes using `AppLayout` (`isApp` mode), especially list- and feed-style
  pages where users need quick freshness recovery.
- The gesture is anchored to the header area in that layout, so it starts from the
  shared header region rather than from arbitrary content.

## Entry Points

- Open the app from a mobile device.
- Browse any `AppLayout`-driven screen.
- At the top of the page, pull down from the header area (including the search
  and navigation controls).

## User Journey

1. A user opens a screen in the app layout.
2. With the page already at the top, the user swipes down in the header area.
3. A pull indicator appears and moves with the gesture.
4. Passing the threshold triggers app-wide query/data invalidation.
5. The spinner/indicator animates briefly while fresh data is requested, then
   settles back.

## Common Scenarios

- While scrolling dense lists:
  - Users can recover freshness without navigating away.
  - Cached route content refreshes in place rather than fully reloading the route.
- When returning from another app and feeling out-of-date data:
  - Pull from the header to refresh in-app state quickly.
- When network errors are already visible in local retry controls:
  - Use pull-to-refresh before reopening the same route.

## Edge Cases

- The gesture is scoped to app-shell header touches; pulls that start lower in
  content do not trigger refresh.
- If the page is scrolled away from the top, pull-to-refresh does not trigger.
- In browser-based web contexts (non-app shell), behavior follows platform/browser
  defaults instead of this flow.

## Failure and Recovery

- If fresh data does not appear after one gesture, use the page's retry controls or
  reopen the route from navigation.
- If pull gesture starts repeatedly without visual change, wait a short moment for
  the refresh timeout to complete, then retry.

## Limitations / Notes

- Pull-to-refresh updates shared app data state; it does not force an unconditional
  hard reload.
- It is only available in the mobile app shell header context.
- Recovery can still rely on explicit in-route retry controls and route changes when
  needed.

## Related Pages

- [Navigation Index](README.md)
- [Profile Troubleshooting](../profiles/troubleshooting/troubleshooting-routes-and-tabs.md)
- [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
- [Docs Home](../README.md)
