# Wallet and Account Controls

## Overview

Wallet and account controls cover connect, disconnect, add-account flows,
device connection, profile navigation, account selection, network switching,
logout, and proxy identity switching. Page Share is a separate navigation
action.

## Location in the Site

- Web sidebar account area (expanded rail, collapsed rail, and small-screen
  overlay sidebar).
- Web user dropdown opened from the connected user row.
- App sidebar account section opened from the app header menu/avatar button.

## Entry Points

- Web disconnected: select `Connect` in the sidebar account area.
- Web connected: single-activate the user row to open the account dropdown;
  with multiple connected profiles, double-click within 400 ms to switch to
  the next profile.
- App layout: single-tap the menu/avatar button to open the drawer; with
  multiple connected profiles, double-tap within 400 ms to switch to the next
  profile. Then use footer account actions as needed.
- Connected multi-profile surfaces: use `+` on web or in the app footer when
  another connected profile slot is available.
- Web proxy switching: select an identity row in the web dropdown.

## Control Surfaces

### Web Sidebar Account Area

- Disconnected:
  - expanded sidebar button: `Connect`
  - collapsed sidebar icon button tooltip: `Connect Wallet`
- Connected:
  - with one connected profile, single activate opens the account dropdown
    immediately
  - with multiple connected profiles, single activate opens the dropdown after
    the shared 400 ms double-activation window; double activate switches to the
    next connected profile without opening the dropdown
  - collapsed-rail hover visibly highlights the avatar without opening the
    dropdown
  - avatar can show a small unread dot when another connected account has
    unread notifications.

### Web Account Dropdown

- The dropdown enters with a short opacity and vertical-position reveal;
  reduced-motion preferences show it immediately without animation.
- Identity rows:
  - the section heading is `Profiles`; a compact outlined `+` button beside it
    replaces the full-width Add row while another profile slot is available
  - base identity row is always present
  - received proxy rows appear when available
  - connected-account rows can show unread count badges (`1-99+`) and can be
    used for direct account selection
  - a single connected profile has no selected background or active checkmark;
    those switching indicators appear only when multiple profiles are present
  - with multiple profiles, a compact outlined `Sign out all` button appears at
    the top right of the tightly spaced section header
- Session actions:
  - `Profile` opens the active handle route, with wallet-address fallback
  - `Connect Device` opens the Mobile/Desktop connection dialog on
    desktop web
  - wallet connection/disconnection and `Connect Device` share one connection
    section, separated by a lighter full-width divider; surrounding account,
    proxy, network, and profile sections use stronger boundaries
  - `Profile` and `Logout` share the final subsection; multi-profile
    `Sign out all` lives in the Profiles header
  - wallet connected: `Disconnect Wallet`, `Logout`
  - wallet disconnected: `Connect Wallet`, `Logout`
  - `Logout` signs out the active profile; multi-account sessions switch to the
    next available profile afterward
  - `Sign out all` presents one signing-out transition; profiles are revoked
    without exposing each remaining profile as an intermediate active account
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
    and can be selected for account switch; a successful switch closes the app
    sidebar so the newly active profile is immediately visible in the page
  - when fewer than five connected profiles are stored, a `+` button appears
    beside the additional-account avatars; selecting it closes the sidebar as
    the connection flow opens and shows a busy state while that flow is open
- Network label:
  - when the wallet has more than one supported chain, the footer shows
    `Network: {currentChain}` above the switch action
- `Scan QR Code` appears only in Capacitor runtime with scanner support.

### Native Connect Chooser

- In Capacitor, the top-level `Connect` and add-profile actions open a shared
  bottom sheet titled `Connect`.
- The first sheet has no subtitle and offers three destinations:
  - `App Wallets`
  - `External Wallets`
  - `Scan Connection QR`
- `App Wallets` stays in the same sheet and provides a Back control, a short
  explanation, `Create App Wallet`, and the app-local wallets available to
  connect. Selecting a wallet starts its existing unlock/connect flow.
- `Create App Wallet` closes the sheet while the existing wallet-creation
  dialog is open, then returns to the App Wallets list when creation is closed.
- `External Wallets` opens Reown's external-wallet browser. App Wallets are not
  repeated in that browser. Coinbase Wallet is excluded from new connections
  in the Capacitor app; web connections and existing native sessions remain
  unchanged.
- `Scan Connection QR` opens the native scanner in connection-only mode. This
  entry accepts only canonical 6529 connection-share deep links and routes a
  valid result to `/accept-connection-sharing`.
- The separate `Scan QR Code` action in the app sidebar remains the
  general-purpose scanner for supported 6529 links.

## User Journey

1. Open account controls from web sidebar or app sidebar footer.
2. Connect wallet if needed.
3. Single-activate the web user row or app header avatar to open its account
   surface. With multiple connected profiles, double-activate within 400 ms to
   switch to the next profile instead.
4. If another profile slot is available, use `+` on web or in the app footer
   to reopen wallet connect and authorize another account. In Capacitor, pick
   App Wallets, External Wallets, or Scan Connection QR from the shared
   `Connect` sheet.
5. Use connected-account controls:
   - select another connected account from the web dropdown, or
   - use app account switch controls in the app sidebar footer; the sidebar
     closes after a successful selection.
6. Use session actions:
   - `Disconnect Wallet` (web only): disconnect wallet without full logout.
   - `Profile`: open the active profile.
   - desktop-web `Connect Device`: choose Mobile or Desktop without
     exposing page-share actions.
   - `Switch to {nextChain}`: move to the next supported wallet network when
     chain switching is available.
   - `Logout`: sign out the active profile.
   - `Sign out all` (multi-profile web sessions only): clear all connected
     profiles in one visible transition without switching through them.
7. During known-account switch handoff, active account state stays pinned to
   the stored active wallet until the new selection settles.
8. Review unread indicators in account selectors:
   - web/account avatars can show a dot for unread activity on other connected
     accounts,
   - account rows can show unread count badges (`1-99+`).
9. Optional web proxy switch:
   - select base identity to act as yourself,
   - select proxy identity to act as that profile,
   - select the active row again to return to base identity.
10. Continue navigation with updated account/proxy state.

## Common Scenarios

- Connect from web sidebar, then open dropdown actions.
- Connect from app footer and continue on the same route.
- Use `+` to connect another profile, up to the five-profile limit,
  without leaving the current route.
- In the native app, connect an app-local wallet without mixing those wallets
  into the Reown external-wallet list.
- In the native app, scan a connection-share QR from the `Connect` sheet when
  transferring an authenticated profile session from another device.
- Use connected-account rows in the web dropdown to switch profiles without
  leaving the menu.
- Use `Logout` to sign out the active profile.
- Use web `Disconnect Wallet` when you need wallet disconnect without full
  logout.
- Use `Switch to {nextChain}` from the web dropdown or app footer when you need
  to cycle between supported wallet networks.
- Open `Connect Device` from the web dropdown on desktop web.
- Use the compact `Sign out all` header action when you need to clear a
  multi-account web session.
- Open app `Push Notifications` settings from the account footer.
- Switch between base identity and a received proxy in web dropdown.
- Use unread count badges to identify which connected account has pending
  notifications before switching.

## Edge Cases

- Web sidebar account area shows loading placeholders while identity data loads.
- Name label fallback order is handle -> wallet display name -> wallet prefix.
- `Profile` is available in the connected web account dropdown.
- Web dropdown always includes the base identity row.
- Web dropdown positioning follows the sidebar account row when wide desktop
  layouts add centered outer margins.
- Connected-account controls appear only when at least one connected account is
  available.
- The compact Add profile control appears only while fewer than five connected
  profiles are stored.
- Proxy rows appear only when active received proxies exist.
- Proxy switching is not available in app footer.
- Web `Connect Device` appears only on desktop web after device
  detection resolves; it is hidden in Capacitor/native and mobile-device web
  contexts.
- Chain switch controls appear only when the connected wallet has more than one
  supported chain.
- Unread count badges are capped at `99+`.
- Avatar unread dots are shown only for unread activity on non-active connected
  accounts.
- While provider/account signals settle during switch-account transitions, the
  active account remains anchored to the stored active wallet to avoid brief
  flips to another already-known account.
- If add-account is canceled and the wallet flow returns to the original active
  wallet, the current session should stay on that original profile.
- Opening and canceling the native `Connect` chooser does not disconnect the
  current external wallet; disconnection is deferred until a wallet path is
  actually selected.
- The connection-only scanner rejects ordinary web URLs, navigation deep links,
  malformed connection links, duplicate parameters, and unexpected parameters.
- After web `Disconnect Wallet`, dropdown actions change to `Connect Wallet`
  and `Logout`; `Connect Wallet` remains grouped with `Connect Device`.

## Failure and Recovery

- If wallet connect is canceled, stay on the same surface and retry `Connect`.
- If a QR scanned from the native `Connect` sheet is not a canonical 6529
  connection-share link, return to the chooser and retry with a connection QR.
- If `+` closes without storing a new profile, reopen the same control
  and complete the wallet handoff again.
- If account state looks stale after proxy/account changes, use `Logout` on web
  or `Disconnect & Logout` in the app, then reconnect.
- If chain switching is missing, verify the wallet is connected and the current
  session exposes more than one supported chain.
- If `Connect Device` is missing, verify you are on desktop web with a
  resolved device state; Capacitor/native and mobile-device web intentionally
  hide it.
- If unread account dots/badges look stale, open `/notifications` for the
  target account, then revisit account controls.
- If wallet controls crash, use wallet error-boundary actions: `Try Again`,
  then `Clear Storage & Reload`.

## Limitations / Notes

- Account action sets intentionally differ between web dropdown and app footer.
- At most five connected profiles can be stored at once.
- Proxy switching is available only in the web dropdown.
- `Disconnect Wallet` exists only in web dropdown; app footer uses full logout
  actions.
- Chain switching cycles through the configured supported wallet networks and
  appears only when more than one chain is available.
- Desktop-web page Share is a supported-route sidebar action; mobile web and
  the native app use a supported-route header action. Page Share is not part of
  the account dropdown.
- Unread dots/badges are notification-count indicators only; they do not show
  notification category.
- A connection-share QR restores an authenticated profile session; it does not
  provide a live signer for actions that require wallet signatures.

## Related Pages

- [Navigation Index](README.md)
- [Web Sidebar Navigation](feature-sidebar-navigation.md)
- [App Sidebar Menu](feature-app-sidebar-menu.md)
- [Page Sharing and Device Connection](feature-share-modal.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
- [Mobile Push Notifications](../notifications/feature-mobile-push-notifications.md)
- [Profile Navigation Flow](../profiles/navigation/flow-navigation.md)
