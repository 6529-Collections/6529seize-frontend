# Navigation Entry and Switching Flow

## Overview

This flow covers how users move between primary sections and deeper destinations
using web sidebar, app bottom tabs, app sidebar menu, search modal, and
context-aware back behavior.

## Location in the Site

- Web layout routes using sidebar navigation.
- Small-screen web routes using off-canvas sidebar overlay.
- Native app routes using app header, app sidebar menu, and fixed bottom
  navigation.

## Entry Points

- Open route navigation from sidebar/menu controls.
- Use app bottom navigation (`Discover`, `Waves`, `Messages`, `Home`,
  `Network`, `Collections`, `Notifications`).
- Open app sidebar menu from header menu/avatar button for secondary routes.
- Open search modal from header/sidebar search actions.
- Use header `Back` from create, wave, or profile-with-history contexts.

## User Journey

1. Open an app route and identify layout context (web sidebar vs app layout).
2. Use primary section navigation:
   - web: sidebar direct route rows or expanded section links
   - app: fixed bottom-navigation tabs
3. Use deeper route navigation:
   - web: expand sidebar groups (`Network`, `Collections`, `Tools`, `About`) or
     open `Search`
   - app: open app sidebar menu for `Profile`, grouped routes, and account
     actions
4. Continue switching routes with active indicators and unread badges.
5. Use `Back` where available to exit create routes, close `drop` query state,
   or leave active wave contexts.

## Common Scenarios

- Desktop web:
  open `Network`, expand `Metrics`, then move between `Health`,
  `Definitions`, `Levels`, and `Network Stats`.
- Collapsed desktop sidebar:
  open section flyout, choose a nested route, and continue without fully
  expanding the rail.
- Small-screen web:
  open the overlay menu, select destination, and continue after overlay
  auto-closes.
- Native app:
  tap `Waves` or `Messages` while inside a thread to return to the section
  list; from section roots, those tabs can reopen last-visited thread context
  when available.
- Native app secondary jump:
  open app sidebar menu to reach `Tools` or `About` routes that are outside
  bottom-tab primary sections.
- Cross-surface jump:
  use search to reach a route that is nested under a collapsed section.

## Edge Cases

- Profile shortcut appears only when connected and resolves handle-first with
  wallet fallback.
- Share button is available from web sidebar; `Share Connection` appears only
  when authenticated connection state is available.
- Bottom navigation is hidden/disabled while mobile keyboard is open, when a
  single drop is open, or while inline drop edit mode is active.
- In collapsed desktop mode, open flyout positioning tracks trigger movement on
  sidebar scroll/resize.

## Failure and Recovery

- If sidebar overlay appears stuck, close via backdrop, `Escape`, or route
  change.
- If a section looks stale in collapsed/expanded state, toggle the section
  again to reset open state.
- If search is in error state, use `Try Again` or refine query text.
- If app route is not reachable from bottom tabs, open app sidebar menu and use
  grouped route links.
- If back behavior is unavailable in the current context, use sidebar or bottom
  navigation to return to a section root route.

## Limitations / Notes

- Page search results are route-catalog based (navigable destinations), not
  full-document text search.
- Primary navigation surface changes by layout: web sidebar vs app bottom bar.
- App sidebar menu is app-layout only and is for secondary route navigation plus
  account actions.

## Related Pages

- [Navigation Index](README.md)
- [Web Sidebar Navigation](feature-sidebar-navigation.md)
- [Header Search Modal](feature-header-search-modal.md)
- [Back Button](feature-back-button.md)
- [Mobile Bottom Navigation](feature-mobile-bottom-navigation.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
