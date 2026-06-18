# Navigation and Shell Controls Troubleshooting

## Overview

Use this page when route switching, shell controls, search, or `/open-mobile`
handoff does not behave as expected.

## Location in the Site

- Web shell: desktop sidebar and small-screen web overlay sidebar.
- App shell: header back/menu, app sidebar drawer, bottom navigation,
  pull-to-refresh.
- Search modal from sidebar/header entry points.
- `/open-mobile` handoff route.

## Entry Points

- A sidebar/menu row is missing, wrong, or not clickable.
- `Back` is missing or returns to an unexpected destination.
- Search does not open, errors, or returns unexpected states.
- App bottom navigation is hidden or highlights the wrong tab.
- Pull-to-refresh does not trigger.
- `/open-mobile` does not open the app or returns to an unexpected web route.

## User Journey

1. Confirm surface first: web sidebar, app header/sidebar/bottom nav, search,
   or `/open-mobile`.
2. Check gating for that surface: wallet state, app-wallet support, country
   gate, and app-vs-web context.
3. Clear stale UI state (open menu/search/drop), then retry from a section
   root.
4. If still failing, use the symptom checks below.

## Common Scenarios

- `Back` is missing in app header:
  it appears only when one of these is true: active wave context, create route
  (`/waves/create` or `/messages/create`), or profile route with valid in-app
  back history.
- Sidebar rows are missing on web:
  expand `Network`, `Collections`, `Tools`, or `About`; in collapsed rail,
  open the flyout first.
- `Notifications` row is missing on web:
  it appears only when connected and sits above `Profile` near the sidebar
  account area, not in the main navigation list.
- `Discovery` row/tab is missing or `/discover` looks empty:
  `Discovery` is an active route in current navigation catalogs. Web exposes a
  `Discovery` row, and the app exposes `Discovery` in bottom navigation and the
  drawer. If the page body is blank, refresh `/discover` or compare against `/`
  and `/waves`.
- `Profile` shortcut is missing:
  connect wallet first; the web sidebar profile row and the app-drawer
  `Profile` row plus profile-avatar shortcut are hidden while disconnected.
- `Share` row is missing on web:
  disconnected desktop web shows a standalone `Share` row; connected desktop
  web moves `Share` into the user menu; Capacitor/native and mobile-device web
  hide it.
- App drawer profile shortcut does not open your profile:
  tap the connected `Profile` row or the connected avatar in the drawer
  header; handle/wallet text and level badge are not navigation controls.
- `App Wallets` row is missing:
  it appears only when app-wallet support is available.
- Subscription rows are missing on iOS web:
  `Subscriptions Report`, `Open Data > Meme Subscriptions`, and
  `About > Subscriptions` are shown only for `US` country context.
- Search shortcut does nothing:
  use `⌘K` where search triggers are mounted; `Ctrl+K` works only from the
  desktop-web sidebar path.
- Search returns nothing too early:
  site-wide search starts at 3+ characters; in-wave search starts at 2+.
- `Try Again` is missing in search errors:
  `Try Again` exists only for site-wide search errors; in-wave search retries
  by query change or reopen.
- `In this Wave` tab is missing:
  it appears only when search opens with active wave context.
- Share modal `Connection` is missing or empty:
  it depends on authenticated session state; share payload requires refresh
  token plus wallet address.
- Sidebar avatar switches accounts instead of opening the menu:
  expected when you activate it twice quickly and at least two connected
  accounts are available; use a single activate to open the menu.
- App bottom navigation is hidden:
  dismiss keyboard, close single-drop view (`?drop=...`), and finish inline
  drop edit mode.
- `Waves` or `Messages` tab highlight looks wrong:
  verify both route and query state (`wave` and `view`).
- Pull-to-refresh does not trigger:
  use app-shell context, scroll to top, and start the gesture from the header
  area.
- `/open-mobile` only shows one store action:
  expected on detected iOS (App Store only) or Android (Play Store only).
- `Back to 6529.io` on `/open-mobile` returns to `/`:
  happens when no decoded `path` is available.

## Edge Cases

- In collapsed desktop mode, section flyouts close on outside click, `Escape`,
  or when sidebar exits collapsed mode.
- In small-screen web overlay mode, route changes close the menu automatically.
- Web and app account surfaces expose different action sets (for example web
  `Disconnect Wallet`).
- `/open-mobile` deep-link attempt runs after client render, so landing UI can
  flash briefly before handoff.

## Failure and Recovery

- If route switching stalls, jump to a stable root and retry:
  `/`, `/waves`, `/messages`, `/notifications`, or `/network`.
- If `/discover` is blank after refresh, retry from `/` or `/waves` to confirm
  whether discovery data is empty or filtered out.
- If a drop stays stuck open, use app-header `Back` once to clear `drop` state.
- If wave/message context looks stale, go to `/waves` or `/messages` root, then
  reopen the target thread.
- If site-wide search errors persist, use `Try Again`; if still failing, close
  and reopen search.
- If a row is missing, re-check auth, device/runtime context, country gating,
  and app-wallet support.
- If wallet/session controls fail, use wallet recovery actions (`Try Again`,
  then `Clear Storage & Reload` if needed).
- If overlay/search state remains inconsistent, reload the current route.
- If `/open-mobile` handoff fails, reopen it with a valid URL-encoded `path`
  and use store actions as fallback.

## Limitations / Notes

- Navigation and shell behavior is intentionally context-dependent by layout,
  route state, and auth/device gating.
- Search `Pages` results are limited to cataloged navigation destinations, not
  full-text site indexing.
- `/open-mobile` has no in-page retry flow beyond store actions and
  `Back to 6529.io`.

## Related Pages

- [Navigation Index](README.md)
- [Navigation Entry and Switching Flow](flow-navigation-entry-and-switching.md)
- [Web Sidebar Navigation](feature-sidebar-navigation.md)
- [App Sidebar Menu](feature-app-sidebar-menu.md)
- [Mobile Bottom Navigation](feature-mobile-bottom-navigation.md)
- [Header Search Modal](feature-header-search-modal.md)
- [Share Modal](feature-share-modal.md)
- [Back Button Behavior](feature-back-button.md)
- [Mobile Pull-to-Refresh Behavior](feature-mobile-pull-to-refresh.md)
- [Mobile App Landing Page](feature-mobile-app-landing.md)
- [Wallet and Account Controls](feature-wallet-account-controls.md)
- [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
