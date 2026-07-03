# Mobile Bottom Navigation

Parent: [Navigation Index](README.md)

## Overview

In native app layout, primary section switching uses a floating bottom icon bar.

Tabs render left-to-right as `NFTs`, `Waves`, `DMs`, `Join 6529`, and `About`.

`DMs` can show an unread dot for connected profiles. Notifications and profile
access are account utilities and stay in header/account surfaces instead of the
bottom product-tab set.

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
   - `NFTs` -> `/the-memes`
   - `Waves` -> `/waves`, or cached non-DM thread (`/waves/{waveId}`)
   - `DMs` -> `/messages`, or cached DM thread (`/messages/{id}`)
   - `Join 6529` -> `/join`
   - `About` -> `/about`
3. Active-tab highlight updates from route path plus `wave`/`view` query state.
4. Keep switching primary sections without opening the app sidebar.

## Common Scenarios

- From any app-shell route, tap `NFTs` to open The Memes collection area.
- From `/discover`, tap `Waves` to return to Waves.
- Use the app drawer/profile avatar when you need your own profile route.
- From `/waves/{waveId}`, tap `Waves` once to clear cached wave thread state
  and return to `/waves`.
- From `/messages/{id}`, tap `DMs` once to clear cached DM thread
  state and return to `/messages`.
- From `/waves` or `/messages` roots, tap the same tab to reopen the last
  cached thread in that category (if one exists).

## Edge Cases

- `NFTs` is active on `/the-memes`, `/6529-gradient`, `/nextgen`,
  `/meme-lab`, `/rememes`, `/nft-activity`, and `/meme-calendar`.
- `Waves` is active on `/waves`, `/discover`, and from `?view=waves`.
- `DMs` is active on `/messages`, `/messages/*`, and from `?view=messages`
  even when path is not `/messages`.
- `Join 6529` is active on `/join`.
- `About` is active on `/about`, `/about/*`, network/reference routes,
  delegation routes, tools routes, `/open-data`, `/drop-forge`,
  `/drop-forge/*`, `/xtdh`, and `/rep/categories`.
- `DMs` unread dots show only when a connected profile has unread items.
- On non-stream routes (for example `/network`, `/the-memes`),
  layout reserves bottom space so content is not hidden behind the bar.
- While the mobile keyboard is open, the bar stays mounted but slides out of
  view and is non-interactive.
- While a single drop is open (`?drop=...`) or an inline drop edit is active,
  the bar is not rendered.

## Failure and Recovery

- If a tab switch does not apply, wait for in-flight transition and tap again.
- If you expected profile or notifications tabs, use account/header surfaces
  instead.
- If `Waves` or `DMs` keeps reopening a stale thread, tap that tab from an
  active thread once to reset to section root, then retry.
- If the bar is hidden, dismiss keyboard and close drop/edit overlays first.
- If content appears clipped under the bar, return to a section root route once
  to reapply bottom reserve spacing.
- If unread dots look stale, reopen the section after unread state refresh.

## Limitations / Notes

- This page documents app-shell behavior only.
- Bottom navigation uses icon buttons (no visible text labels in the bar).
- Secondary destinations (profile/account actions and nested About/NFTs/Waves
  links) are in
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
