# Back Button Behavior

## Overview

In the app layout, header `Back` is context-aware. It appears only in supported
contexts, then runs route rules before history. In the native app, ordinary wave
and direct-message details also support a rightward swipe across conversation
content to return to their matching list.

## Location in the Site

- App header in app-layout routes.
- Create routes: `/waves/create`, `/messages/new`.
- Active wave routes: `/waves/{waveId}` and `/messages/{waveId}`.
- Legacy `/waves?wave={waveId}` links are normalized to `/waves/{waveId}`.
- Preferences at `/preferences?from=profile` when opened from the active
  profile.
- Profile routes (`/{user}` and tabs) only when in-app history can go back.

## Entry Points

- Open a wave or DM thread.
- In the native app, open a wave or DM thread and start a rightward swipe
  across ordinary conversation content.
- Open a route with `?drop={dropId}`.
- Open `/waves/create` or `/messages/new`.
- Open Preferences from the active profile's **Preferences** action.
- Open a profile route after moving from another app route.

## User Journey

1. Header shows `Back` only when at least one condition is true:
   - active wave context exists,
   - route is `/waves/create` or `/messages/new`,
   - Preferences includes its explicit profile-entry context,
   - route is a profile page and in-app history can go back.
2. User taps `Back`. In a native-app wave or DM, the user can instead swipe
   right across ordinary conversation content.
3. The app applies the first match in this order:
   - `/waves/create` -> replace to `/waves`
   - `/messages/new` -> replace to `/messages`
   - profile-origin Preferences -> return to the active profile
   - `drop` query exists -> remove only `drop`, keep path and other query params
   - active wave context -> clear active wave state and return to `/waves` or
     `/messages`
4. If no route rule matches, `Back` runs in-app history and shows a spinner
   while navigation resolves.

## Common Scenarios

- Leave create flow: `Back` from `/waves/create` or `/messages/new` returns
  to the matching list route.
- Return from Preferences: when it was opened from the active profile, `Back`
  returns to that profile.
- Close focused drop: if `?drop=` exists, `Back` removes only `drop`.
- Leave thread: `Back` clears active thread state and returns to section root.
- Leave a wave or DM in the native app: a completed rightward swipe clears the
  active thread and returns to `/waves` or `/messages`, using the same state
  reset as `Back`.
- Return from profile: if in-app history has a valid target, `Back` returns to
  it.

## Edge Cases

- Repeat taps are ignored while fallback loading is active.
- The conversation swipe applies to native-app wave and DM details. It does
  not run on web or list/create routes, or while a focused drop or create overlay
  is active. Screen edges remain available to the system or browser.
- Reverse below the gesture threshold before release to cancel. A slow, short
  drag also stays in the conversation; a longer drag or quick flick returns to
  the list.
- Vertical gestures and touches that begin on sliders, editors, media controls,
  or horizontally scrollable content do not trigger Back.
- Profile routes hide `Back` when there is no valid in-app target (for example
  direct entry or same-profile-only browsing).
- Preferences hides `Back` when opened from the sidebar or directly, because
  those entries do not carry profile-return context.
- If active wave metadata is missing, the app clears wave state and routes to
  `/waves` or `/messages`, preserving non-`wave` query params.

## Failure and Recovery

- If `Back` is missing, use menu or bottom navigation to return to section root.
- If the swipe shortcut is unavailable or does not complete, use the visible
  app-header `Back` control.
- If no valid history target exists, navigate directly to `/waves`,
  `/messages`, or another root route from navigation controls.
- If a route transition stalls, refresh the current route and retry.

## Limitations / Notes

- This behavior is app-layout only.
- `Back` is context-aware, not a strict browser-back wrapper.
- The conversation swipe is an optional shortcut and never replaces the visible `Back`
  control.
- Leaving a thread with `Back` clears last-visited thread memory for that
  section.
- Loading spinner appears only during history fallback.

## Related Pages

- [Navigation Index](README.md)
- [Navigation Entry and Switching Flow](flow-navigation-entry-and-switching.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
- [App Header Context](feature-app-header-context.md)
- [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
