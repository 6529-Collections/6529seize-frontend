# App Sidebar Menu

## Overview

In the mobile app layout, the header menu opens a left-side panel for
secondary route navigation and account actions. It complements bottom-tab
navigation.

## Location in the Site

- App header menu/avatar button (shown when back is not shown).
- App-shell routes rendered with `AppLayout`.
- Route sections: `Profile` (connected only), `Discover`, `Network`, `Tools`,
  `About`.
- Account section: `Scan QR Code`, `Connect`/`Disconnect`, `Switch Account`,
  and push-notification settings.

## Entry Points

- Open the mobile app on a route where the header shows the menu/avatar button.
- Tap the menu/avatar button in the top-left header area.
- Close without navigating using close icon, backdrop tap, or right-to-left
  swipe.

## User Journey

1. User opens the menu/avatar button.
2. Sidebar panel slides in over the current route.
3. Panel header shows connected profile summary, or the 6529 logo when
   disconnected.
4. User opens `Network`, `Tools`, or `About` groups, then selects a route.
5. Sidebar closes and the selected route opens.
6. User can also run account actions from the footer section.

## Common Scenarios

- Open network destinations (for example `Groups`, `TDH`, `Health`) without
  leaving app layout.
- Open tools destinations (`Delegation Center`, `API`, `EMMA`, `Block Finder`,
  `Open Data`).
- Open connected profile route directly from the `Profile` row.
- Use `Scan QR Code` to open supported 6529 web/deep links.
- Open `Push Notifications` settings and save per-device notification toggles.

## Edge Cases

- The menu button is replaced by `Back` on create routes, active-wave contexts,
  and profile routes with valid in-app back history.
- `Profile` row is hidden when disconnected.
- `App Wallets` appears only when app-wallet support is enabled.
- `Scan QR Code` appears only when running inside the mobile app with scanner
  support.
- Selecting a route closes the panel immediately.

## Failure and Recovery

- If the panel appears stuck, close via backdrop/close icon/swipe and reopen.
- If route navigation does not apply, reopen menu and select the destination
  again.
- If QR scan fails, retry scan or navigate manually with bottom tabs/menu links.

## Limitations / Notes

- This behavior is app-layout specific.
- Primary section switching still uses
  [Mobile Bottom Navigation](feature-mobile-bottom-navigation.md).
- Search entry remains in the header search control, not inside this menu.

## Related Pages

- [Navigation Index](README.md)
- [App Header Context](feature-app-header-context.md)
- [Mobile Bottom Navigation](feature-mobile-bottom-navigation.md)
- [Wallet and Account Controls](feature-wallet-account-controls.md)
- [Navigation Entry and Switching Flow](flow-navigation-entry-and-switching.md)
