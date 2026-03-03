# App Sidebar Menu

## Overview

In app layout, the top-left menu/avatar button opens a left drawer for
secondary route jumps and account actions. Primary section switching stays in
bottom navigation.

## Location in the Site

- App routes rendered with `AppLayout`, when header left control is menu/avatar
  (not `Back`).
- Direct rows: `Discover`, plus connected-only `Profile`.
- Collapsible groups: `Network`, `Tools`, `About`.
- Footer actions: `Scan QR Code` (Capacitor + scanner support), then either
  `Connect` (disconnected) or connected actions (`Push Notifications`,
  `Switch Account`, `Disconnect & Logout`).

## Entry Points

- Open an app-layout route where the top-left control is menu/avatar.
- Tap the menu/avatar button.
- Close with close button, backdrop tap, right-to-left swipe, or route
  selection.

## User Journey

1. Open the menu/avatar button from the app header.
2. Drawer opens from the left over the current route.
3. Header shows:
   - connected: profile card (avatar, handle/wallet label, level, stats)
   - disconnected: `6529` logo linking to `/`
4. Choose `Discover` or connected `Profile`, or expand `Network`, `Tools`, or
   `About` and choose a nested route.
5. Drawer closes and route navigation runs.
6. Use footer actions for QR scan, connect/session actions, or push settings.

## Common Scenarios

- Open network routes:
  `/network`, `/network/activity`, `/network/groups`, `/nft-activity`,
  `/meme-calendar`, `/network/tdh`, `/network/health`, `/network/definitions`,
  `/network/levels`, `/network/health/network-tdh`.
- Open tools routes:
  `/delegation/delegation-center`, `/delegation/wallet-architecture`,
  `/delegation/delegation-faq`, `/delegation/consolidation-use-cases`,
  `/delegation/wallet-checker`, `/tools/subscriptions-report`,
  `/meme-accounting?focus=the-memes`, `/meme-gas?focus=the-memes`,
  `/tools/api`, `/emma`, `/tools/block-finder`, `/open-data`.
- Open about routes:
  `/about/the-memes`, `/about/subscriptions`, `/about/meme-lab`,
  `/about/6529-gradient`, `/about/gdrc1`, `/about/nft-delegation`,
  `/about/primary-address`, `/capital`, `/capital/company-portfolio`,
  `/capital/fund`, `/about/faq`, `/about/apply`, `/about/contact-us`,
  `/about/data-decentralization`, `/about/ens`, `/about/license`,
  `/about/release-notes`.
- Open connected profile shortcut:
  profile route resolves handle-first, then wallet-address fallback.
- Use `Scan QR Code` for `https://6529.io/*` links and `mobile6529://` deep
  links (`navigate/*` and `share-connection` scopes).
- Open `Push Notifications`, review per-device toggles, then save changes.

## Edge Cases

- Menu/avatar is replaced by `Back` on create routes, active-wave contexts, and
  profile routes with valid in-app history.
- `Profile` row is hidden when disconnected.
- `Network`, `Tools`, and `About` are collapsible; section headers inside them
  are labels, not links.
- `App Wallets` is prepended inside `Tools` only when app-wallet support is
  available.
- `Scan QR Code` appears only when running in Capacitor with scanner support.
- `Push Notifications` appears only when connected and opens an in-app modal.
- Invalid or unsupported QR content shows `Invalid QR code`.
- Push settings save is disabled until at least one toggle changes.

## Failure and Recovery

- If drawer state looks stuck, close with backdrop/icon/swipe and reopen.
- If route change does not apply, reopen the drawer and select the route again.
- If QR scan fails or shows `Invalid QR code`, rescan, update app build if
  needed, or navigate manually.
- If push settings fail to load/save, close and reopen `Push Notifications`, then
  retry save.

## Limitations / Notes

- App-sidebar behavior is app-layout only.
- Primary section switching stays in
  [Mobile Bottom Navigation](feature-mobile-bottom-navigation.md).
- Search stays in the header search control, not in this drawer.
- Session/proxy details are owned by
  [Wallet and Account Controls](feature-wallet-account-controls.md).
- Web shell route groups are owned by
  [Web Sidebar Navigation](feature-sidebar-navigation.md).

## Related Pages

- [Navigation Index](README.md)
- [App Header Context](feature-app-header-context.md)
- [Mobile Bottom Navigation](feature-mobile-bottom-navigation.md)
- [Wallet and Account Controls](feature-wallet-account-controls.md)
- [Navigation Entry and Switching Flow](flow-navigation-entry-and-switching.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
