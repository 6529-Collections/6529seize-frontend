# App Sidebar Menu

## Overview

In app layout, the top-left menu/avatar button opens a left drawer for
direct profile/discovery jumps, grouped secondary routes, and account actions.
Primary section switching stays in bottom navigation.
Connected account surfaces in this drawer can show unread notification
indicators (dot/count badges) to help account switching.

## Location in the Site

- App routes rendered with `AppLayout`, when header left control is menu/avatar
  (not `Back`).
- Direct rows: connected `Profile` and `Discovery`.
- Drawer header: connected profile avatar shortcut to
  `/{normalized-handle}` with `/{walletAddress}` fallback.
- Collapsible groups: `Network`, `Tools`, `About`.
- Footer actions: `Scan QR Code` (Capacitor + scanner support), then either
  `Connect` (disconnected) or connected actions (`Push Notifications`,
  `Switch Account`, `Disconnect & Logout`).

## Entry Points

- Open an app-layout route where the top-left control is menu/avatar.
- Tap the menu/avatar button.
- Choose a direct row, the connected avatar shortcut, or a grouped route.
- Close with close button, backdrop tap, right-to-left swipe, or route
  selection.

## User Journey

1. Open the menu/avatar button from the app header.
2. Drawer opens from the left over the current route.
3. Header shows:
   - connected: profile card (profile-avatar shortcut, handle/wallet label,
     level, stats, and unread count badge when present)
   - disconnected: `6529` logo linking to `/`
4. Drawer body shows direct rows plus grouped sections:
   - connected `Profile` row
   - `Discovery`
   - `Network`, `Tools`, `About`
5. Tap the connected profile avatar or `Profile` row to open your own profile
   route (`/{normalized-handle}` with `/{walletAddress}` fallback), tap
   `Discovery` for `/discover`, or expand grouped sections for nested routes.
6. Drawer closes and route navigation runs.
7. Use footer actions for QR scan, connect/session actions, or push settings.

## Common Scenarios

- Open network routes:
  `/network`, `/network/activity`, `/network/groups`, `/nft-activity`,
  `/meme-calendar`, `/network/tdh`, `/xtdh`, `/network/health`,
  `/network/definitions`, `/network/levels`, `/network/health/network-tdh`.
- Open `Discovery`:
  use the direct row to route into `/discover`.
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
  tap either the drawer-header avatar or the direct `Profile` row; both
  resolve `/{normalized-handle}` first, then `/{walletAddress}` fallback.
- Use `Scan QR Code` for `https://6529.io/*` links and `mobile6529://` deep
  links (`navigate/*` and `share-connection` scopes).
- Open `Push Notifications`, review per-device toggles, then save changes.
- Use unread count badges in connected account avatars to pick the account with
  pending notification activity.

## Edge Cases

- Menu/avatar is replaced by `Back` on create routes, active-wave contexts, and
  profile routes with valid in-app history.
- Connected profile shortcut is avatar-only; handle/wallet text and level badge
  do not navigate.
- `Profile` row is unavailable when disconnected.
- Discovery stays available even while disconnected.
- Profile avatar shortcut is unavailable when disconnected because the header
  shows the `6529` home link instead.
- `Network`, `Tools`, and `About` are collapsible; section headers inside them
  are labels, not links.
- `App Wallets` is prepended inside `Tools` only when app-wallet support is
  available.
- `Scan QR Code` appears only when running in Capacitor with scanner support.
- `Push Notifications` appears only when connected and opens an in-app modal.
- Connected profile/account unread badges are capped at `99+`.
- Invalid or unsupported QR content shows `Invalid QR code`.
- Push settings save is disabled until at least one toggle changes.

## Failure and Recovery

- If drawer state looks stuck, close with backdrop/icon/swipe and reopen.
- If route change does not apply, reopen the drawer and select the route again.
- If `Profile` is missing, connect wallet first or use the header avatar once a
  connected profile is available.
- If QR scan fails or shows `Invalid QR code`, rescan, update app build if
  needed, or navigate manually.
- If push settings fail to load/save, close and reopen `Push Notifications`, then
  retry save.
- Opening the target wave/DM thread should clear that wave's unread state and
  refresh unread badges after read sync. If badges still look stale, switch to
  the target account and open `/notifications`, then reopen the drawer.

## Limitations / Notes

- App-sidebar behavior is app-layout only.
- Primary section switching stays in
  [Mobile Bottom Navigation](feature-mobile-bottom-navigation.md), even though
  `Discovery` and `Profile` are also accessible here.
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
