# Wallet and Account Controls

## Overview

Wallet and account controls cover connect/disconnect actions, account switching,
proxy-profile selection, and session-level actions exposed from sidebar user
menus in web and app layouts.

## Location in the Site

- Desktop/small-screen web sidebar user area.
- App sidebar account section (opened from app header menu).
- Connected-user dropdown actions (including proxy selection) in sidebar user
  menus.

## Entry Points

- Disconnected web sidebar:
  select `Connect` from the user area.
- Connected web sidebar:
  select the user row to open account/proxy actions.
- App layout:
  open the header menu and use account controls in the bottom account section.

## User Journey

1. Start disconnected and open a connect action.
2. Complete wallet connection and return to navigation with connected state.
3. Open account controls to manage session actions:
   - connect/disconnect,
   - switch account,
   - disconnect and logout,
   - select active proxy profile when available.
4. Continue routing with updated profile/account context.

## Common Scenarios

- Connect from web sidebar:
  select `Connect`; connected state replaces the connect action with user menu
  controls.
- Connect from app sidebar:
  select `Connect` in the account section.
- Switch account:
  select `Switch Account` to disconnect current session and reopen connect flow.
- Disconnect/logout:
  select `Disconnect Wallet` (desktop dropdown) or `Disconnect & Logout`
  (desktop/app controls) to end active session state.
- Proxy selection:
  choose a proxy profile from the user dropdown to switch active identity
  context.
- App-only account actions:
  use `Push Notifications` settings and QR-scanner account flows in app sidebar.

## Edge Cases

- While identity data is loading, sidebar account surfaces show placeholder
  skeletons.
- If handle data is unavailable, account labels fall back to wallet/address-based
  text.
- In collapsed desktop mode, account controls are icon-first and rely on
  tooltips for quick affordance hints.
- `Profile` shortcut routing in sidebar is shown only when connected and uses
  handle-first fallback-to-wallet resolution.
- Proxy actions appear only when proxy profiles are available for the session.

## Failure and Recovery

- If connect flow is canceled or wallet handoff is declined, account state
  stays disconnected; retry from the same connect surface.
- If wallet UI fails at runtime, the wallet error boundary shows `Connection
  Problem` with `Try Again` and `Clear Storage & Reload`.
- If account state looks stale after switching/disconnecting, run
  `Disconnect & Logout`, then reconnect.

## Limitations / Notes

- Available wallet providers and connection UX depend on platform and wallet-app
  availability.
- Some account actions differ by layout (desktop dropdown vs app sidebar).
- Proxy behavior depends on current authenticated profile-proxy permissions.

## Related Pages

- [Navigation Index](README.md)
- [Sidebar Navigation](feature-sidebar-navigation.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
- [Profile Navigation Flow](../profiles/navigation/flow-navigation.md)
- [Docs Home](../README.md)
