# Wallet and Account Controls

## Overview

Wallet and account controls cover connect, disconnect, share, account
selection, network switching, logout, and proxy identity switching. Web and app
surfaces reach the same session outcomes, but they expose different controls.

## Location in the Site

- Web sidebar account area (expanded rail, collapsed rail, and small-screen
  overlay sidebar).
- Web user dropdown opened from the connected user row.
- App sidebar account section opened from the app header menu/avatar button.

## Entry Points

- Web disconnected: select `Connect` in the sidebar account area.
- Web connected: single-activate the user row to open the account dropdown.
- Web connected with multiple accounts: activate the user row twice quickly to
  switch to the next connected account.
- App layout: open the menu/avatar button, then use footer account actions.
- Web proxy switching: select an identity row in the web dropdown.

## Control Surfaces

### Web Sidebar Account Area

- Disconnected:
  - expanded sidebar button: `Connect`
  - collapsed sidebar icon button tooltip: `Connect Wallet`
- Connected:
  - single activate opens the account dropdown
  - quick double activate cycles to the next connected account when at least
    two accounts are available
  - avatar can show a small unread dot when another connected account has
    unread notifications.

### Web Account Dropdown

- Identity rows:
  - base identity row is always present
  - received proxy rows appear when available
  - connected-account rows can show unread count badges (`1-99+`) and can be
    used for direct account selection
- Session actions:
  - wallet connected: `Disconnect Wallet`, desktop-web `Share`,
    `Disconnect & Logout`
  - wallet disconnected: `Connect Wallet`, desktop-web `Share`, `Logout`
  - multi-account web sessions also expose `Sign Out All Profiles`
- Network controls:
  - when the connected wallet has more than one supported chain, the dropdown
    shows `Network: {currentChain}`
  - `Switch to {nextChain}` cycles to the next supported chain and closes the
    dropdown

### App Sidebar Footer

- Disconnected: `Connect`
- Connected: `Push Notifications`, `Disconnect Wallet`, optional
  `Switch to {nextChain}`, `Disconnect & Logout`
  - connected profile card avatar can show unread count badge (`1-99+`) for
    the active account
  - additional connected account avatars can show unread count badges (`1-99+`)
    and can be selected for account switch
- Network label:
  - when the wallet has more than one supported chain, the footer shows
    `Network: {currentChain}` above the switch action
- `Scan QR Code` appears only in Capacitor runtime with scanner support.

## User Journey

1. Open account controls from web sidebar or app sidebar footer.
2. Connect wallet if needed.
3. On web, single-activate the user row to open the dropdown, or quickly
   activate it twice to cycle to the next connected account.
4. Use connected-account controls:
   - select another connected account from the web dropdown, or
   - use app account switch controls in the app sidebar footer.
5. Use session actions:
   - `Disconnect Wallet` (web only): disconnect wallet without full logout.
   - desktop-web `Share`: open the QR/deep-link modal from the web dropdown.
   - `Switch to {nextChain}`: move to the next supported wallet network when
     chain switching is available.
   - `Disconnect & Logout` / `Logout`: full sign-out.
   - `Sign Out All Profiles` (web only): clear all connected profiles at once.
6. During known-account switch handoff, active account state stays pinned to
   the stored active wallet until the new selection settles.
7. Review unread indicators in account selectors:
   - web/account avatars can show a dot for unread activity on other connected
     accounts,
   - account rows can show unread count badges (`1-99+`).
8. Optional web proxy switch:
   - select base identity to act as yourself,
   - select proxy identity to act as that profile,
   - select the active row again to return to base identity.
9. Continue navigation with updated account/proxy state.

## Common Scenarios

- Connect from web sidebar, then open dropdown actions.
- Connect from app footer and continue on the same route.
- Use connected-account rows in the web dropdown to switch profiles without
  leaving the menu.
- Use a quick second activate on the web user row to cycle to the next
  connected account.
- Use `Disconnect & Logout` (or `Logout`) to fully sign out.
- Use web `Disconnect Wallet` when you need wallet disconnect without full
  logout.
- Use `Switch to {nextChain}` from the web dropdown or app footer when you need
  to cycle between supported wallet networks.
- Open `Share` from the web dropdown on desktop web.
- Use `Sign Out All Profiles` when you need to clear a multi-account web
  session.
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
- Connected-account controls appear only when at least one connected account is
  available.
- Proxy rows appear only when active received proxies exist.
- Proxy switching is not available in app footer.
- Web `Share` appears only on desktop web after device detection resolves; it
  is hidden in Capacitor/native and mobile-device web contexts.
- Chain switch controls appear only when the connected wallet has more than one
  supported chain.
- Quick double activate cycles accounts only when at least two connected
  accounts are available.
- Unread count badges are capped at `99+`.
- Avatar unread dots are shown only for unread activity on non-active connected
  accounts.
- While provider/account signals settle during switch-account transitions, the
  active account remains anchored to the stored active wallet to avoid brief
  flips to another already-known account.
- After web `Disconnect Wallet`, dropdown actions change to `Connect Wallet`,
  `Share`, and `Logout`.

## Failure and Recovery

- If wallet connect is canceled, stay on the same surface and retry `Connect`.
- If account state looks stale after proxy/account changes, run
  `Disconnect & Logout`, then reconnect.
- If quick re-activating the web user row switches accounts unexpectedly, wait
  a moment and use a single activate to reopen the dropdown.
- If chain switching is missing, verify the wallet is connected and the current
  session exposes more than one supported chain.
- If web `Share` is missing, verify you are on desktop web with a resolved
  device state; Capacitor/native and mobile-device web intentionally hide it.
- If unread account dots/badges look stale, open `/notifications` for the
  target account, then revisit account controls.
- If wallet controls crash, use wallet error-boundary actions: `Try Again`,
  then `Clear Storage & Reload`.

## Limitations / Notes

- Account action sets intentionally differ between web dropdown and app footer.
- Proxy switching is available only in the web dropdown.
- `Disconnect Wallet` exists only in web dropdown; app footer uses full logout
  actions.
- Chain switching cycles through the configured supported wallet networks and
  appears only when more than one chain is available.
- Desktop-web `Share` is available from the web dropdown, while disconnected
  desktop web exposes `Share` as a standalone sidebar row instead.
- Unread dots/badges are notification-count indicators only; they do not show
  notification category.

## Related Pages

- [Navigation Index](README.md)
- [Web Sidebar Navigation](feature-sidebar-navigation.md)
- [App Sidebar Menu](feature-app-sidebar-menu.md)
- [Share Modal](feature-share-modal.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
- [Mobile Push Notifications](../notifications/feature-mobile-push-notifications.md)
- [Profile Navigation Flow](../profiles/navigation/flow-navigation.md)
