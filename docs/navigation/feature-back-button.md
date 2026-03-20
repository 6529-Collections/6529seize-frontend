# Back Button Behavior

## Overview

In the app layout, header `Back` is context-aware. It appears only in supported
contexts, then runs route rules before history.

## Location in the Site

- App header in app-layout routes.
- Create routes: `/waves/create`, `/messages/create`.
- Active wave routes: `/waves/{waveId}` and `/messages?wave={waveId}`.
- Legacy `/waves?wave={waveId}` links are normalized to `/waves/{waveId}`.
- Profile routes (`/{user}` and tabs) only when in-app history can go back.

## Entry Points

- Open a wave or DM thread.
- Open a route with `?drop={dropId}`.
- Open `/waves/create` or `/messages/create`.
- Open a profile route after moving from another app route.

## User Journey

1. Header shows `Back` only when at least one condition is true:
   - active wave context exists,
   - route is `/waves/create` or `/messages/create`,
   - route is a profile page and in-app history can go back.
2. User taps `Back`.
3. The app applies the first match in this order:
   - `/waves/create` -> replace to `/waves`
   - `/messages/create` -> replace to `/messages`
   - `drop` query exists -> remove only `drop`, keep path and other query params
   - active wave context -> clear active wave state and return to `/waves` or
     `/messages`
4. If no route rule matches, `Back` runs in-app history and shows a spinner
   while navigation resolves.

## Common Scenarios

- Leave create flow: `Back` from `/waves/create` or `/messages/create` returns
  to the matching list route.
- Close focused drop: if `?drop=` exists, `Back` removes only `drop`.
- Leave thread: `Back` clears active thread state and returns to section root.
- Return from profile: if in-app history has a valid target, `Back` returns to
  it.

## Edge Cases

- Repeat taps are ignored while fallback loading is active.
- Profile routes hide `Back` when there is no valid in-app target (for example
  direct entry or same-profile-only browsing).
- If active wave metadata is missing, the app clears wave state and routes to
  `/waves` or `/messages`, preserving non-`wave` query params.

## Failure and Recovery

- If `Back` is missing, use menu or bottom navigation to return to section root.
- If no valid history target exists, navigate directly to `/waves`,
  `/messages`, or another root route from navigation controls.
- If a route transition stalls, refresh the current route and retry.

## Limitations / Notes

- This behavior is app-layout only.
- `Back` is context-aware, not a strict browser-back wrapper.
- Leaving a thread with `Back` clears last-visited thread memory for that
  section.
- Loading spinner appears only during history fallback.

## Related Pages

- [Navigation Index](README.md)
- [Navigation Entry and Switching Flow](flow-navigation-entry-and-switching.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
- [App Header Context](feature-app-header-context.md)
- [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
