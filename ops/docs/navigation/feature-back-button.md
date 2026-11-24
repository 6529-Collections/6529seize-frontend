# Back Button Behavior

## Overview

In the app layout, header `Back` is context-aware. It appears only in supported
contexts, then runs route rules before history. In the native app, ordinary wave
and direct-message details also support a rightward swipe across conversation
content to return to their matching list. Profile Waves Feed supports the same
swipe back to Waves. Opening a chat from that feed makes both `Back` and a right
swipe return to the feed at the saved reading position.

## Location in the Site

- App header in app-layout routes.
- Create routes: `/waves/create`, `/messages/new`.
- Active wave routes: `/waves/{waveId}` and `/messages/{waveId}`.
- Profile Waves Feed: `/waves?view=profile-feed`.
- Discovery at `/discover` when opened from Profile Waves Feed in the native app.
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
   - the native app is showing Profile Waves Feed,
   - route is `/waves/create` or `/messages/new`,
   - native-app Discovery carries a Profile Waves Feed return context,
   - Preferences includes its explicit profile-entry context,
   - route is a profile page and in-app history can go back.
2. User taps `Back`. In a native-app wave or DM, the user can instead swipe
   right across ordinary conversation content.
3. The app applies the first match in this order:
   - `/waves/create` -> replace to `/waves`
   - `/messages/new` -> replace to `/messages`
   - profile-origin Preferences -> return to the active profile
   - `drop` query exists -> remove only `drop`, keep path and other query params
   - native-app chat opened from Profile Waves Feed -> return to the feed
   - native-app Profile Waves Feed -> return to Waves
   - native-app Discovery opened from Profile Waves Feed -> return to the feed
   - active wave context -> clear active wave state and return to `/waves` or
     `/messages`
4. If no route rule matches, `Back` returns to the previous app page with its
   URL settings. Fast returns keep the arrow; longer navigation shows a spinner
   after a brief delay.

## Common Scenarios

- Leave create flow: `Back` from `/waves/create` or `/messages/new` returns
  to the matching list route.
- Return from Preferences: when it was opened from the active profile, `Back`
  returns to that profile.
- Return from Discover Waves: after opening it from Profile Waves Feed in the
  native app, header `Back` returns to the feed at its saved reading position,
  including after changing Discovery tabs, sort, or score filters.
- Close focused drop: if `?drop=` exists, `Back` removes only `drop`.
- Leave thread: `Back` clears active thread state and returns to section root.
- Return to reading: after opening a post or its Wave-name link from Profile
  Waves Feed in the native app, `Back` or a right swipe returns to the same feed position. The feed's
  own `Back` or right swipe returns to Waves, including after direct entry.
  Opening Profile Waves Feed again from the Waves More menu starts at the top.
- Android system Back follows the same Feed return: from a feed-origin chat it
  returns to Feed; from Feed itself it returns to Waves before considering
  another section's history or minimizing the app.
- Leave a wave or DM in the native app: a completed rightward swipe clears the
  active thread and returns to `/waves` or `/messages`, using the same state
  reset as `Back`.
- Return from profile: if in-app history has a valid target, `Back` returns to
  it. For example, Network returns to the same page and sorting, with the saved
  reading position. Opening the profile from another section in the native app
  starts at the top, keeping its Back control reachable. Changing filters does
  not add another Back step.

## Edge Cases

- Repeat taps are ignored while fallback loading is active.
- The swipe applies to native-app wave and DM details and Profile Waves Feed. It
  does not run on web or the Waves/Messages lists or create routes, or while a focused drop or create overlay
  is active. Screen edges remain available to the system or browser.
- Reverse below the gesture threshold before release to cancel. A slow, short
  drag also stays in the conversation; a longer drag or quick flick returns to
  the list.
- Returning to the Waves list moves the channel header, including the wave name
  and Join action, with the content. The bottom navigation stays in place.
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
- Loading spinner appears only during history fallback after a brief delay. It
  indicates pending navigation, not necessarily a fresh download of the list.
- Native Back prepares the previously visited route ahead of selection. Cached
  content can return while its data refreshes in the background.
- When motion and browser support allow, a right swipe to Waves completes its outgoing slide before navigation. On supported
  native app browsers, a Feed return reveals the destination during the remaining
  slide. Cached cards appear when ready; a cold return can show the loading
  state while data arrives. Reduced Motion skips the motion.

## Related Pages

- [Navigation Index](README.md)
- [Navigation Entry and Switching Flow](flow-navigation-entry-and-switching.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
- [App Header Context](feature-app-header-context.md)
- [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
