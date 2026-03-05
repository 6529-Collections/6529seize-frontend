# Wallet and Account Controls

## Overview

Wallet and account controls cover connect, disconnect, switch account, logout,
and proxy identity switching. Web and app surfaces reach the same session
outcomes, but they expose different controls.

## Location in the Site

- Web sidebar account area (expanded rail, collapsed rail, and small-screen
  overlay sidebar).
- Web user dropdown opened from the connected user row.
- App sidebar account section opened from the app header menu/avatar button.

## Entry Points

- Web disconnected: select `Connect` in the sidebar account area.
- Web connected: select the user row to open the account dropdown.
- App layout: open the menu/avatar button, then use footer account actions.
- Web proxy switching: select an identity row in the web dropdown.

## Control Surfaces

### Web Sidebar Account Area

- Disconnected:
  - expanded sidebar button: `Connect`
  - collapsed sidebar icon button tooltip: `Connect Wallet`
- Connected: user row opens the account dropdown.
  - avatar can show a small unread dot when another connected account has
    unread notifications.

### Web Account Dropdown

- Identity rows:
  - base identity row is always present
  - received proxy rows appear when available
  - connected-account rows can show unread count badges (`1-99+`)
- Session actions:
  - wallet connected: `Disconnect Wallet`, `Switch Account`,
    `Disconnect & Logout`
  - wallet disconnected: `Connect Wallet`, `Switch Account`, `Logout`

### App Sidebar Footer

- Disconnected: `Connect`
- Connected: `Push Notifications`, `Switch Account`, `Disconnect & Logout`
  - connected profile card avatar can show unread count badge (`1-99+`) for
    the active account
  - additional connected account avatars can show unread count badges (`1-99+`)
    and can be selected for account switch
- `Scan QR Code` appears only in Capacitor runtime with scanner support.

## User Journey

1. Open account controls from web sidebar or app sidebar footer.
2. Connect wallet if needed.
3. Use session actions:
   - `Switch Account`: disconnect wallet, clear session auth, reopen connect.
   - `Disconnect Wallet` (web only): disconnect wallet without full logout.
   - `Disconnect & Logout` / `Logout`: full sign-out.
4. During known-account switch handoff, active account state stays pinned to
   the stored active wallet until the new selection settles.
5. Review unread indicators in account selectors:
   - web/account avatars can show a dot for unread activity on other connected
     accounts,
   - account rows can show unread count badges (`1-99+`).
6. Optional web proxy switch:
   - select base identity to act as yourself,
   - select proxy identity to act as that profile,
   - select the active row again to return to base identity.
7. Continue navigation with updated account/proxy state.

## Common Scenarios

- Connect from web sidebar, then open dropdown actions.
- Connect from app footer and continue on the same route.
- Use `Switch Account` to reconnect with a different wallet.
- Use `Disconnect & Logout` (or `Logout`) to fully sign out.
- Use web `Disconnect Wallet` when you need wallet disconnect without full
  logout.
- Open app `Push Notifications` settings from the account footer.
- Switch between base identity and a received proxy in web dropdown.
- Use unread count badges to identify which connected account has pending
  notifications before switching.

## Edge Cases

- Web sidebar account area shows loading placeholders while identity data loads.
- Name label fallback order is handle -> wallet display name -> wallet prefix.
- `Profile` shortcuts in web/app navigation appear only when an address is
  present.
- Web dropdown always includes the base identity row.
- Proxy rows appear only when active received proxies exist.
- Proxy switching is not available in app footer.
- Unread count badges are capped at `99+`.
- Avatar unread dots are shown only for unread activity on non-active connected
  accounts.
- While provider/account signals settle during switch-account transitions, the
  active account remains anchored to the stored active wallet to avoid brief
  flips to another already-known account.
- After web `Disconnect Wallet`, dropdown actions change to `Connect Wallet`
  and `Logout`.

## Failure and Recovery

- If wallet connect is canceled, stay on the same surface and retry `Connect`.
- If account state looks stale after proxy/account changes, run
  `Disconnect & Logout`, then reconnect.
- If unread account dots/badges look stale, open `/notifications` for the
  target account, then revisit account controls.
- If wallet controls crash, use wallet error-boundary actions: `Try Again`,
  then `Clear Storage & Reload`.

## Limitations / Notes

- Account action sets intentionally differ between web dropdown and app footer.
- Proxy switching is available only in the web dropdown.
- `Disconnect Wallet` exists only in web dropdown; app footer uses full logout
  actions.
- Unread dots/badges are notification-count indicators only; they do not show
  notification category.

## Related Pages

- [Navigation Index](README.md)
- [Web Sidebar Navigation](feature-sidebar-navigation.md)
- [App Sidebar Menu](feature-app-sidebar-menu.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
- [Mobile Push Notifications](../notifications/feature-mobile-push-notifications.md)
- [Profile Navigation Flow](../profiles/navigation/flow-navigation.md)
