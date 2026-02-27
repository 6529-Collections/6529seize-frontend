# Wallet and Account Controls

## Overview

Wallet/account controls cover connect/disconnect actions, account switching, and
session actions exposed in web sidebar user menus and app sidebar account
section. Proxy-profile switching is a web-sidebar dropdown behavior.

## Location in the Site

- Web sidebar user area (expanded or collapsed desktop, plus small-screen web
  overlay).
- App sidebar account section (opened from app header menu).
- Web connected-user dropdown for proxy selection.

## Entry Points

- Disconnected web sidebar: select `Connect`.
- Connected web sidebar: select user row to open account menu.
- App layout: open header menu and use account controls in account footer.

## User Journey

1. User opens a connect action from web/app sidebar.
2. After wallet connection, connected account controls replace `Connect`.
3. User manages session actions:
   - `Disconnect Wallet` (web dropdown),
   - `Switch Account`,
   - `Disconnect & Logout`.
4. On web, user can switch active proxy identity from proxy dropdown entries.
5. User continues routing with updated identity/session state.

## Common Scenarios

- Connect from web sidebar and continue with connected `Profile` + user menu.
- Connect from app sidebar account section.
- Switch account to reopen wallet selection flow.
- Disconnect/logout to clear active session.
- Web-only proxy selection: choose a proxy profile to change active identity.
- App-only account actions: open `Push Notifications` settings or use `Scan QR
  Code`.

## Edge Cases

- While identity data loads, account surfaces render placeholders.
- If handle data is missing, labels fall back to wallet-based display.
- In collapsed desktop sidebar, account controls become icon-first with
  tooltips.
- Sidebar `Profile` shortcut appears only when connected.
- Proxy controls appear only on web dropdown when proxy entries exist.
- App QR scanner action appears only when scanner support exists in the app
  runtime.

## Failure and Recovery

- If wallet connection is canceled/declined, state stays disconnected; retry
  from same surface.
- If wallet runtime fails, wallet error boundary exposes `Try Again` and
  `Clear Storage & Reload`.
- If account context looks stale after switch/disconnect, use `Disconnect &
  Logout`, then reconnect.

## Limitations / Notes

- Wallet-provider availability depends on platform/device runtime.
- Web and app account menus expose different action sets.
- Proxy switching depends on authenticated proxy permissions and available proxy
  data.

## Related Pages

- [Navigation Index](README.md)
- [Web Sidebar Navigation](feature-sidebar-navigation.md)
- [App Sidebar Menu](feature-app-sidebar-menu.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
- [Profile Navigation Flow](../profiles/navigation/flow-navigation.md)
