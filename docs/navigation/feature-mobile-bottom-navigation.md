# Mobile Bottom Navigation

Parent: [Navigation Index](README.md)

## Overview

In native app layout, primary section switching uses a fixed bottom icon bar.
The bar uses a fixed `85px` shell height with top-aligned icon buttons in a
shared icon slot.

Tabs render left-to-right as `Discovery`, `Waves`, `Messages`, `Home`,
`Network`, `Collections`, and `Notifications`.

`Messages` and `Notifications` can show unread dots for connected profiles.
Profile access is no longer part of the bottom-tab set and stays in the app
drawer/account surfaces.

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
   - `Messages` -> `/messages`, or cached DM thread (`/messages?wave={waveId}`)
   - `Home` -> `/`
   - `Network` -> `/network`
   - `Collections` -> `/the-memes`
   - `Notifications` -> `/notifications`
3. Active-tab highlight updates from route path plus `wave`/`view` query state.
4. Keep switching primary sections without opening the app sidebar.

## Common Scenarios

- From any app-shell route, tap `Discovery` to open the dedicated wave
  discovery page.
- From `/waves` or `/messages`, tap `Home` to return to `/`.
- Use the app drawer/profile avatar when you need your own profile route.
- From `/waves/{waveId}`, tap `Waves` once to clear cached wave thread state
  and return to `/waves`.
- From `/messages?wave={id}`, tap `Messages` once to clear cached DM thread
  state and return to `/messages`.
- From `/waves` or `/messages` roots, tap the same tab to reopen the last
  cached thread in that category (if one exists).

## Edge Cases

- `Discovery` is active only on `/discover`.
- `Waves` and `Messages` can be active from `?view=waves` or `?view=messages`
  even when path is not `/waves` or `/messages`.
- `Network` is active on `/network`, `/network/*`, `/nft-activity`, and `/xtdh`.
- `Collections` is active on `/the-memes`, `/6529-gradient`, `/nextgen`,
  `/meme-lab`, and `/rememes`.
- `Home` is active only on `/` when no `wave`/`view` override is active.
- `Notifications` is active only on `/notifications`.
- `Messages` is active on `/messages` and `/messages/*` (for example
  `/messages/create`).
- `Messages` and `Notifications` unread dots show only when a connected profile
  has unread items.
- Active-tab underline stays pinned to the top edge for every tab, including
  `Home`.
- On non-stream routes (for example `/network`, `/the-memes`),
  layout adds `85px` bottom reserve spacing so content is not hidden behind the
  bar.
- While the mobile keyboard is open, the bar stays mounted but slides out of
  view and is non-interactive.
- While a single drop is open (`?drop=...`) or an inline drop edit is active,
  the bar is not rendered.

## Failure and Recovery

- If a tab switch does not apply, wait for in-flight transition and tap again.
- If you expected a profile tab, use the app drawer instead; profile access is
  no longer part of bottom navigation.
- If `Waves` or `Messages` keeps reopening a stale thread, tap that tab from an
  active thread once to reset to section root, then retry.
- If the bar is hidden, dismiss keyboard and close drop/edit overlays first.
- If content appears clipped under the bar, return to a section root route once
  to reapply bottom reserve spacing.
- If unread dots look stale, reopen the section after unread state refresh.

## Limitations / Notes

- This page documents app-shell behavior only.
- Bottom navigation uses icon buttons (no visible text labels in the bar).
- Standard shell reserve height is `85px` when the bar is visible.
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
