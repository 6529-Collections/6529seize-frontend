# Navigation Entry and Switching Flow

## Overview

This flow covers how users switch routes across web sidebar navigation, small-
screen overlay menus, and app-shell controls (bottom tabs, sidebar drawer, and
context-aware `Back`).

## Location in the Site

- Desktop web: fixed left sidebar with direct rows and expandable groups.
- Narrow desktop web: collapsed icon rail with flyout submenus.
- Small-screen web: header menu opens the same sidebar as an overlay.
- App layout: bottom tabs for primary sections plus header menu/avatar drawer
  for secondary routes.

## Entry Points

- Web sidebar rows (`Home`, `Waves`, `Messages`, `Notifications`)
  and section groups (`Network`, `Collections`, `Tools`, `About`).
- Small-screen header menu button (opens the sidebar in overlay mode).
- App bottom navigation tabs (`Profile`, `Waves`, `Messages`, `Home`,
  `Network`, `Collections`, `Notifications`).
- App header menu/avatar button for drawer routes and account actions (when
  `Back` is not active).
- Search entry points: sidebar `Search`, app header search button, and `⌘K` on
  desktop sidebar.
- App header `Back` in create routes, active wave/message contexts, and
  profiles with history.

## User Journey

1. Open a route and use the active shell for your layout: web sidebar, web
   overlay sidebar, or app shell.
2. Switch primary sections:
   - web: direct sidebar rows
   - app: fixed bottom tabs
3. Open secondary destinations:
   - web: expand sidebar groups or open search
   - app: open sidebar drawer for `Profile`, grouped routes, and account actions
4. Confirm route change via active states and unread indicators.
5. In app wave/message threads:
   - tap `Waves` or `Messages` once to return to section root
   - tap again from root to reopen last visited thread (when cached)

## Common Scenarios

- Desktop web metrics jump: open `Network` -> `Metrics`, then move between
  `Health`, `Definitions`, `Levels`, and `Network Stats`.
- Collapsed desktop rail: open a flyout submenu and pick a nested route without
  expanding the rail.
- Small-screen web: open overlay menu, pick a route, and continue after
  auto-close on navigation.
- App secondary route jump: open app drawer and choose grouped `Tools` or
  `About` routes.
- Site-wide search jump: type at least 3 characters, then open a
  page/profile/NFT/wave result.
- In-wave search jump: switch to `In this Wave`, type at least 2 characters,
  then jump to a matching message.
- App profile jump: tap bottom-nav `Profile`; if disconnected, complete wallet
  connect, then retry to route into your profile.

## Edge Cases

- App top-left control switches between menu/avatar and `Back`; when `Back` is
  shown, sidebar drawer entry is not available.
- Bottom-nav `Profile` is always visible: disconnected taps open wallet
  connect, and connected taps resolve handle-first profile route with wallet
  fallback.
- Web sidebar and search-page catalogs can vary by runtime constraints:
  iOS non-US hides subscription-related entries, and `App Wallets` appears only
  when app-wallet support is enabled.
- Sidebar `Share` row is web-only and hidden in Capacitor/native app context and
  mobile-device web context.
- `Messages` and `Notifications` unread dots require a connected profile with
  unread state.
- Bottom navigation is not rendered during single-drop open or inline mobile
  edit mode, and is hidden/non-interactive while the mobile keyboard is open.
- In collapsed desktop mode, flyout submenu anchor position tracks trigger
  movement during sidebar scroll and resize.

## Failure and Recovery

- If a sidebar overlay or drawer appears stuck:
  - web overlay: close with backdrop click, `Escape`, or route change
  - app drawer: close with backdrop tap, close button, swipe, or route change
- If a route row is missing, verify auth/country/device/feature-gate constraints.
- If search is still loading, wait for debounce/fetch; if no results, refine
  query; if error appears, use `Try Again`.
- If `Waves`/`Messages` keeps reopening an outdated thread, open the active
  thread and tap that tab once to clear cached last-visited target.
- If app `Back` is unavailable in current context, use sidebar or bottom
  navigation to return to a section root route.

## Limitations / Notes

- Page search is route-catalog based (sidebar/main destinations), not
  full-document text search.
- Primary switching surface depends on layout: web sidebar vs app bottom tabs.
- App sidebar menu is app-layout only and is intended for secondary routes plus
  account actions.

## Related Pages

- [Navigation Index](README.md)
- [App Header Context](feature-app-header-context.md)
- [Web Sidebar Navigation](feature-sidebar-navigation.md)
- [App Sidebar Menu](feature-app-sidebar-menu.md)
- [Header Search Modal](feature-header-search-modal.md)
- [Back Button](feature-back-button.md)
- [Mobile Bottom Navigation](feature-mobile-bottom-navigation.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
