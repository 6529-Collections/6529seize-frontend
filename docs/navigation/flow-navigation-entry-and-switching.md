# Navigation Entry and Switching Flow

## Overview

This flow covers how users move between primary sections and deeper destinations
using the sidebar, app bottom navigation, search modal, and context-aware back
behavior.

## Location in the Site

- Web layout routes using sidebar navigation.
- Small-screen web routes using off-canvas sidebar overlay.
- Native app routes using app header plus fixed bottom navigation.

## Entry Points

- Open route navigation from sidebar/menu controls.
- Use app bottom navigation (`Discover`, `Waves`, `Messages`, `Home`,
  `Network`, `Collections`, `Notifications`).
- Open search modal from header/sidebar search actions.
- Use header `Back` from create, wave, or profile-with-history contexts.

## User Journey

1. Open an app route and identify layout context (web sidebar vs app layout).
2. Use primary navigation:
   - web: sidebar direct route rows or expanded section links
   - app: fixed bottom-navigation tabs
3. Use deeper navigation:
   - expand section groups (`Network`, `Collections`, `Tools`, `About`) and
     choose nested routes
   - or open search and jump directly to a route/profile/NFT/wave result
4. Continue moving between sections with active route indicators.
5. Use `Back` where available to exit create routes, close drop query state, or
   leave active wave contexts.

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
- Cross-surface jump:
  use search to reach a route that is nested under a collapsed section.

## Edge Cases

- Profile shortcut appears only when connected and resolves handle-first with
  wallet fallback.
- Share button is available from web sidebar; `Share Connection` appears only
  when authenticated connection state is available.
- Bottom navigation hides while mobile keyboard is open.
- In collapsed desktop mode, open flyout positioning tracks trigger movement on
  sidebar scroll/resize.

## Failure and Recovery

- If sidebar overlay appears stuck, close via backdrop, `Escape`, or route
  change.
- If a section looks stale in collapsed/expanded state, toggle the section
  again to reset open state.
- If search is in error state, use `Try Again` or refine query text.
- If back behavior is unavailable in the current context, use sidebar or bottom
  navigation to return to a section root route.

## Limitations / Notes

- Page search results are route-catalog based (navigable destinations), not
  full-document text search.
- Primary navigation surface changes by layout: web sidebar vs app bottom bar.

## Related Pages

- [Navigation Index](README.md)
- [Sidebar Navigation](feature-sidebar-navigation.md)
- [Header Search Modal](feature-header-search-modal.md)
- [Back Button](feature-back-button.md)
- [Mobile Bottom Navigation](feature-mobile-bottom-navigation.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
