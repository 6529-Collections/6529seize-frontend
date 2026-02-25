# Wallet and Account Controls

## Overview

Wallet and account controls let users connect a wallet, switch accounts,
disconnect, and manage proxy profile context from sidebar user menus.

## Location in the Site

- Desktop: bottom section of the primary left sidebar.
- Small screens: menu overlay opened from the header button.
- Additional connect surfaces: reusable `Connect` button shown in auth-gated
  flows.

## Entry Points

- Desktop (disconnected): click `Connect Wallet` at the bottom of the sidebar.
- Desktop (connected): click the sidebar user row to open the user menu.
- Small screens: open the menu from the header, then use account controls at
  the bottom section.
- Proxy users: open the user menu and select a proxy profile entry.

## User Journey

1. User starts disconnected and opens a wallet connect action.
2. Wallet provider flow completes and the sidebar updates to connected state.
3. User identity UI appears (avatar/placeholder, label, level, and profile
   link behavior).
4. User opens the account menu to run actions such as connect/disconnect,
   switch account, logout, or proxy selection.
5. User returns to navigation with updated account context.

## Common Scenarios

- Connect from sidebar:
  - `Connect` opens the wallet connection flow.
- Connect on native mobile app:
  - In native app sessions, the wallet chooser includes `Coinbase Wallet` as
    a supported connection option.
- Switch account:
  - `Switch Account` disconnects and reopens the connect flow.
- Disconnect/logout:
  - `Disconnect Wallet` ends wallet connection.
  - `Disconnect & Logout` clears authenticated session state.
  - `Disconnect & Logout` also clears active proxy-role session context used by
    connection-sharing links.
- Proxy context:
  - Menu lists available proxy profiles and marks the active proxy.
  - Selecting a proxy switches active identity context for user actions.
- Label fallback behavior:
  - Preferred label is profile handle when available.
  - If no handle is available, UI falls back to wallet-based identifiers.
  - Long or address-like labels can be visually truncated in compact sidebar
    space.

## Edge Cases

- While identity data is loading, user sections show placeholder/skeleton UI.
- If profile image is missing, a default avatar placeholder is shown.
- In collapsed desktop sidebar mode, account controls become icon-first and use
  tooltips for labels.
- Wallet provider availability can differ between web and native app sessions.
- Wallet connection UI can depend on third-party provider assets (including
  hosted fonts); restrictive network policies can cause partial or degraded
  modal rendering.
- Restored wallet-connected state depends on wallet/session data in browser
  local storage.
- App-wallet connector setup can fail if stored wallet records are malformed
  (for example missing key material or invalid mnemonic format), even when the
  wallet still appears in local app-wallet lists.
- `Profile` routing uses handle-first navigation and falls back to wallet route
  when needed.
- Account menu options can differ by connection state (for example, `Connect
  Wallet` vs `Disconnect Wallet`).

## Failure and Recovery

- If wallet-connected UI throws a runtime error, users see a recovery card with
  `Connection Problem`.
- Recovery actions:
  - `Try Again` retries rendering wallet-connected UI.
  - `Clear Storage & Reload` clears local storage/auth state and reloads the
    app.
- If a wallet-app handoff is canceled or the wallet app is unavailable,
  connection does not complete and the user remains disconnected.
- If network or enterprise filtering blocks wallet-provider asset domains, the
  wallet chooser can fail to render fully; retry on an unrestricted network or
  after local allow-list updates.
- If users return with missing local wallet/session storage (for example, after
  storage cleanup or from an older cookie-only wallet session), account
  controls start disconnected; reconnect wallet to restore active session
  context.
- If app-wallet connector setup rejects malformed stored wallet data, users stay
  disconnected and may see an authentication-style error message; remove and
  re-import the affected app wallet (or use `Clear Storage & Reload`) before
  retrying connection.
- If wallet/profile data is temporarily unavailable, users can retry by
  reconnecting or reopening account controls after data reloads.

## Limitations / Notes

- Account actions depend on wallet connection state.
- Proxy actions appear only when proxy profiles are available.
- Some connect/disconnect outcomes depend on external wallet provider behavior.
- Native app wallet options depend on the wallet apps installed on the device.

## Related Pages

- [Navigation Index](README.md)
- [Sidebar Navigation](feature-sidebar-navigation.md)
- [Profile Navigation Flow](../profiles/navigation/flow-navigation.md)
- [Docs Home](../README.md)
