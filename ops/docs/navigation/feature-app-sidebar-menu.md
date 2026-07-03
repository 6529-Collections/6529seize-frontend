# App Sidebar Menu

## Overview

In app layout, the top-left menu/avatar button opens a left drawer for
primary navigation concepts, grouped secondary routes, and account actions.
Connected account surfaces in this drawer can show unread notification
indicators (dot/count badges) to help account switching.
When the connected wallet can access Drop Forge, the drawer lists it inside
`About` under `Developer & Open Data`.

## Location in the Site

- App routes rendered with `AppLayout`, when header left control is menu/avatar
  (not `Back`).
- Primary rows/groups: `NFTs`, `Waves`, `DMs`, `Join 6529`, and `About`.
- Drawer header: connected profile avatar shortcut to
  `/{normalized-handle}` with `/{walletAddress}` fallback.
- Footer actions: `Scan QR Code` (Capacitor + scanner support), then either
  `Connect` (disconnected) or connected actions (`Push Notifications`,
  `Disconnect Wallet`, optional `Switch to {nextChain}`,
  `Disconnect & Logout`).

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
   - `NFTs`
   - `Waves`
   - `DMs`
   - `Join 6529`
   - `About`
5. Tap the connected profile avatar to open your own profile route
   (`/{normalized-handle}` with `/{walletAddress}` fallback), tap `DMs` for
   `/messages`, use `Drop Forge` inside `About` when present, or expand grouped
   sections for nested routes.
6. Drawer closes and route navigation runs.
7. Use footer actions for QR scan, connect/session actions, push settings, and
   optional chain switching.

## Common Scenarios

- Open `NFTs`:
  `/the-memes`, `/6529-gradient`, `/nextgen`, `/meme-lab`, `/rememes`,
  `/nft-activity`, `/meme-calendar`.
- Open `Waves`:
  `/waves` and `Discover Waves` at `/discover`.
- Open `About > Network & People` and `About > Network Data`:
  `/network`, `/network/activity`, `/network/groups`, `/network/tdh`, `/xtdh`,
  `/network/wave-score`, `/rep/categories`, `/network/health`,
  `/network/definitions`, `/network/levels`, `/network/health/network-tdh`.
- Open `Drop Forge`:
  use `About > Developer & Open Data` when the current wallet can access the
  landing route.
- Open About tool routes:
  `/delegation/delegation-center`, `/delegation/wallet-architecture`,
  `/delegation/delegation-faq`, `/delegation/consolidation-use-cases`,
  `/delegation/wallet-checker`, `/tools/subscriptions-report`,
  `/meme-accounting`, `/meme-gas`, `/tools/api`, `/emma`,
  `/tools/block-finder`, `/open-data`.
- Open about routes:
  `/about/the-memes`, `/about/subscriptions`, `/about/meme-lab`,
  `/about/6529-gradient`, `/about/gdrc1`, `/about/nft-delegation`,
  `/about/primary-address`, `/capital`, `/capital/company-portfolio`,
  `/capital/fund`, `/about/faq`, `/about/apply`, `/about/contact-us`,
  `/about/data-decentralization`, `/about/ens`, `/about/license`.
- Open connected profile shortcut:
  tap the drawer-header avatar; it resolves `/{normalized-handle}` first, then
  `/{walletAddress}` fallback.
- Use `Scan QR Code` for `https://6529.io/*` links and `mobile6529://` deep
  links (`navigate/*` and `share-connection` scopes).
- Open `Push Notifications`, review per-device toggles, then save changes.
- Review `Network: {currentChain}` and use `Switch to {nextChain}` when the
  current wallet exposes more than one supported chain.
- Use unread count badges in connected account avatars to pick the account with
  pending notification activity.

## Edge Cases

- Menu/avatar is replaced by `Back` on create routes, active-wave contexts, and
  profile routes with valid in-app history.
- Connected profile shortcut is avatar-only; handle/wallet text and level badge
  do not navigate.
- Profile access stays in account/header surfaces, not the product menu rows.
- `Discover Waves` stays available inside `Waves` even while disconnected.
- `Drop Forge` appears inside `About > Developer & Open Data` only when the
  connected wallet can access the landing route.
- Profile avatar shortcut is unavailable when disconnected because the header
  shows the `6529` home link instead.
- `NFTs`, `Waves`, and `About` are collapsible; section headers inside them are
  labels, not links.
- `App Wallets` appears inside `About > NFT & Reporting Tools` only when
  app-wallet support is available.
- `Scan QR Code` appears only when running in Capacitor with scanner support.
- `Push Notifications` appears only when connected and opens an in-app modal.
- Network switch controls appear only when the wallet is connected and more
  than one supported chain is available.
- Connected profile/account unread badges are capped at `99+`.
- Invalid or unsupported QR content shows `Invalid QR code`.
- Push settings save is disabled until at least one toggle changes.

## Failure and Recovery

- If drawer state looks stuck, close with backdrop/icon/swipe and reopen.
- If route change does not apply, reopen the drawer and select the route again.
- If profile access is missing, connect wallet first or use the header avatar
  once a connected profile is available.
- If `Drop Forge` is missing, verify the connected wallet can access the
  landing route and wait for permission checks to finish.
- If QR scan fails or shows `Invalid QR code`, rescan, update app build if
  needed, or navigate manually.
- If chain switching is missing, verify the wallet is connected and that more
  than one supported chain is configured for the current session.
- If push settings fail to load/save, close and reopen `Push Notifications`, then
  retry save.
- Opening the target wave/DM thread should clear that wave's unread state and
  refresh unread badges after read sync. If badges still look stale, switch to
  the target account and open `/notifications`, then reopen the drawer.

## Limitations / Notes

- App-sidebar behavior is app-layout only.
- Bottom navigation and this drawer expose the same primary product concepts;
  profile/account actions stay in account surfaces.
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
