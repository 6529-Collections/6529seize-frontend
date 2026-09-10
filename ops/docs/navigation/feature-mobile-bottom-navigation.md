# Mobile Bottom Navigation

Parent: [Navigation Index](README.md)

## Overview

In native app layout, primary section switching uses a floating bottom icon bar.

Tabs render left-to-right as `Discovery`, `Waves`, `Messages`, `Home`,
`Network`, `Collections`, and `Notifications`.

`Messages` and `Notifications` can show unread dots for connected profiles.
Profile access stays in the app drawer/account surfaces.

## Location in the Site

- Native app routes rendered through `AppLayout` (`isApp` context).
- Not used on small-screen web fallback layout (that layout uses web sidebar
  navigation).

## Entry Points

- Open the app in native mode.
- Open any app-shell route where bottom navigation is visible.
- For interaction, keep keyboard closed and avoid active `?drop` state or
  inline drop edit mode.

## User Journey

1. Open an app-shell route.
2. Tap a tab:
   - `Discovery` -> `/discover`
   - `Waves` -> `/waves`, or cached non-DM thread (`/waves/{waveId}`)
   - `Messages` -> `/messages`, or cached DM thread (`/messages/{waveId}`)
   - `Home` -> `/`
   - `Network` -> `/network`
   - `Collections` -> `/the-memes`
   - `Notifications` -> `/notifications`
3. The pressed icon dims immediately. When a cold destination needs more time,
   its lightweight route shell opens while the complete content loads.
4. Active-tab highlight updates from route path plus `wave`/`view` query state.
5. Keep switching primary sections without opening the app sidebar.

## Common Scenarios

- From any app-shell route, tap `Discovery` to open the dedicated wave
  discovery page.
- From `/waves` or `/messages`, tap `Home` to return to `/`.
- Tap the bell at the right end of the bar to open `Notifications`. The tap
  area includes the space around the bell, in both expanded and compact states.
- Icons dim while pressed to acknowledge the touch.
- Primary-tab icons and active states keep their established visual design
  while route content is loading.
- Use the app drawer/profile avatar when you need your own profile route.
- From `/waves/{waveId}`, tap `Waves` once to clear cached wave thread state
  and return to `/waves`.
- From `/messages/{id}`, tap `Messages` once to clear cached DM thread
  state and return to `/messages`.
- From `/waves` or `/messages` roots, tap the same tab to reopen the last
  cached thread in that category (if one exists).

## Edge Cases

- `Discovery` is active only on `/discover`.
- `Waves` and `Messages` can be active from `?view=waves` or `?view=messages`
  even when path is not `/waves` or `/messages`.
- `Network` is active on `/network`, `/network/*`, `/nft-activity`, and
  `/xtdh` (`xTDH Allocations Dashboard`).
- `Collections` is active on `/the-memes`, `/6529-gradient`, `/nextgen`,
  `/meme-lab`, and `/rememes`.
- `Home` is active only on `/` when no `wave`/`view` override is active.
- `Notifications` is active only on `/notifications`.
- `Messages` is active on `/messages` and `/messages/*` (for example
  `/messages/create`).
- `Messages` and `Notifications` unread dots show only when a connected profile
  has unread items.
- On non-stream routes (for example `/network`, `/the-memes`),
  layout reserves bottom space so content is not hidden behind the bar.
- Tablet-sized app viewports use wider expanded and compact dock widths so the
  seven destinations remain balanced against the available canvas.
- On phones, `Discovery` and `Notifications` keep extra tap space around their
  icons when the bar compacts during scrolling.
- In the Android app, bottom spacing respects the space the device reports
  for system navigation.
- Rotating a phone or tablet between portrait and landscape keeps the dock
  available when no other hide condition is active.
- While the mobile keyboard is open, the bar stays mounted but slides out of
  view and is non-interactive.
- The new-version refresh prompt is centered directly above the dock in the
  native app and follows the dock as it expands or compacts.
- While a single drop is open (`?drop=...`) or an inline drop edit is active,
  the bar is not rendered.
- `Home`, `Discovery`, `Network`, `Collections`, and `Notifications` provide a
  lightweight route shell so a cold switch can commit without waiting for the
  complete destination. `Notifications` data is not fully fetched in the
  background merely because its tab is visible.

## Failure and Recovery

- A tab should respond to a single tap. If taps repeatedly fail, reopen the
  app; persistent failures should be reported with the device model, app
  version, and whether the bar was expanded or compact.
- If you expected a profile tab, use the app drawer instead; profile access is
  no longer part of bottom navigation.
- If `Waves` or `Messages` keeps reopening a stale thread, tap that tab from an
  active thread once to reset to section root, then retry.
- If the bar is hidden, dismiss keyboard and close drop/edit overlays first.
- Rotation by itself should not hide the bar; if it remains hidden after
  rotating, return to portrait once and rotate again.
- If content appears clipped under the bar, return to a section root route once
  to reapply bottom reserve spacing.
- If unread dots look stale, reopen the section after unread state refresh.

## Limitations / Notes

- This page documents app-shell behavior only.
- Bottom navigation uses icon buttons (no visible text labels in the bar).
- Secondary destinations (profile/network/tools/about/account actions) are in
  [App Sidebar Menu](feature-app-sidebar-menu.md).
- Web desktop/small-screen routing is documented in
  [Web Sidebar Navigation](feature-sidebar-navigation.md).

## Related Pages

- [Navigation Index](README.md)
- [App Sidebar Menu](feature-app-sidebar-menu.md)
- [Mobile Pull-to-Refresh Behavior](feature-mobile-pull-to-refresh.md)
- [Mobile Keyboard and Bottom Navigation Layout](feature-android-keyboard-layout.md)
- [Navigation Entry and Switching Flow](flow-navigation-entry-and-switching.md)
- [Waves Index](../waves/README.md)
