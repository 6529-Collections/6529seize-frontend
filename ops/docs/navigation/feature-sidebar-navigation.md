# Web Sidebar Navigation

Parent: [Navigation Index](README.md)

## Overview

On web layouts, route switching is sidebar-first.

- Desktop: fixed left rail with collapse/expand toggle.
- Narrow desktop web: collapsed icon rail that can open as an overlay panel.
- Touch small-screen web: header menu button opens the same sidebar as overlay.
- In collapsed rail mode, flyout submenus keep the same subsection labels and
  nested route grouping shown in the expanded rail.
- In collapsed rail mode, a mouse hover opens `NFTs` and `About` after a short
  intent delay; tap or click remains available for touch and pointer users.
- Collapsed flyouts enter with a short opacity and horizontal-position reveal;
  reduced-motion preferences show them immediately without animation.
- The 6529 logo links to `/`; there is no labeled `Home` product row.
- Primary menu concepts are ordered `NFTs`, `Museum`, `Waves`, `DMs`,
  `Join 6529`, and `About` so art destinations stay together while Waves and
  DMs remain adjacent.
- `NFTs` and `About` are expandable groups; `Museum`, `Waves`, `DMs`, and
  `Join 6529` are direct rows.
- The `Museum` row opens `/museum/network` in one click.
- The `Waves` sidebar row opens `/waves` in one click. `Discover Waves`
  remains a secondary Waves experience link and searchable destination.
- When the connected wallet can access Drop Forge, the sidebar adds a
  standalone `Drop Forge` row after `About`.
- `DMs` keeps a main-nav unread dot; connected users get a lower
  `Notifications` row with its own unread dot.
- Connected account avatar in the sidebar account area can show an unread dot
  when another connected account has unread notifications.
- In the collapsed rail, the connected account avatar gets a visible hover
  highlight; the account menu still opens by click or keyboard activation.

## Location in the Site

- Web routes rendered with `WebLayout` or `SmallScreenLayout` (non-app).
- Home entry: 6529 logo link to `/`.
- Primary rows/groups: `NFTs`, `Museum`, `Waves`, `DMs`, `Join 6529`,
  `About`.
- Gated primary row: `Drop Forge`, after `About`, only when the connected
  wallet can access it.
- Utility rows: desktop `Search`, `Share` (only on supported desktop-web
  routes), connected-only `Notifications`, then the profile control.
- Bottom account area: connect action, loading placeholders, and the connected
  user menu.

## Entry Points

- Desktop and narrow desktop web: use sidebar chevron toggle.
- Touch small-screen web: use header menu button.
- Select direct rows or expand groups for nested routes.
- Open `Museum` directly from the primary sidebar row.
- Open `Waves` directly from the primary sidebar row.
- Open `Join 6529` directly from the primary sidebar row.
- Open `Discover Waves` from the expanded Waves panel header or search.
- Open `Drop Forge` from the standalone row after `About` when the current
  wallet can access `/drop-forge`.
- Open `Search` from the desktop sidebar row.
- Open connected `Notifications` from the lower utility rows.
- Open `Share` from the desktop sidebar on a supported route.
- Open `Profile` or `Connect Device` from the connected user menu.
- Press `⌘K` or `Ctrl+K` when desktop sidebar navigation is mounted.

## User Journey

1. Open a web route.
2. Switch primary sections with direct rows.
3. Use lower utility rows in `Search`, `Share`, `Notifications`, profile order.
4. Open `NFTs` or `About` for nested routes; use the `Museum`, `Waves`, and
   `Join 6529` rows for direct navigation.
5. In collapsed mode, hover a group row with a mouse or activate it by tap,
   click, or keyboard to open an anchored flyout submenu. The flyout preserves
   subsection labels such as `Network & Reputation`, `Delegation & Wallets`, or
   `Data & Developer Tools`.
6. Select a destination and watch active state update.
7. In overlay mode, sidebar closes after route change.

## Common Scenarios

- Open `NFTs` routes:
  `/the-memes`, `/6529-gradient`, `/nextgen`, `/meme-lab`, `/rememes`,
  `/nft-activity`, `/meme-calendar`.
- On local development and shared staging, open the pre-deployment Stream
  review from `NFTs > 6529 Stream — Review`. It appears after `ReMemes` and
  before `NFT Activity` and opens `/reviews/6529-stream`. It is absent on
  production.
- Open `Waves` routes:
  use the primary `Waves` row for `/waves`; use `Discover Waves` in the Waves
  panel header or search for `/discover`.
- Open `Museum`:
  use the primary `Museum` row for `/museum/network`.
- Open `Join 6529`:
  use the primary `Join 6529` row for the shareable onboarding guide at
  `/join-6529`.
- Open `About > Network & Reputation` routes:
  `/network`, `/network/activity`, `/network/tdh`,
  `/network/xtdh` (`xTDH Overview`), `/xtdh` (`xTDH Allocations Dashboard`),
  `/network/wave-score`, `/rep/categories`, `/network/health`,
  `/network/definitions`, `/network/levels`, `/network/health/network-tdh`,
  `/network/nerd`, `/network/prenodes`, and
  `/network/tdh/historic-boosts`.
- Open `About > About 6529 > 6529 Apps` for the combined 6529 Mobile and 6529
  Desktop download page at `/about/6529-apps`.
- Open `Drop Forge` from its standalone row after `About` when the current
  wallet has landing access.
- Open `About` tool routes:
  delegation pages under `Delegation & Wallets`, `/meme-accounting`,
  `/meme-gas`, optional `/tools/subscriptions-report`, optional
  `/tools/app-wallets`, `/tools/api`, `/emma`, `/tools/block-finder`,
  `/open-data`, `/open-data/6529bot`, `/open-data/network-metrics`,
  optional `/open-data/meme-subscriptions`, `/open-data/rememes`
  (`ReMemes Data`), `/open-data/team` (`Team Data`), and
  `/open-data/royalties`.
- Use collapsed-rail flyouts for grouped destinations:
  `NFTs` keeps collection and NFT activity links, and `About` keeps subsection
  labels such as `Network & Reputation`, `Delegation & Wallets`, and
  `Data & Developer Tools` instead of flattening every route into one list.
  `Museum`, `Waves`, and `Join 6529` remain direct rows in collapsed mode.
- Open `About` and `6529 Capital` routes from grouped links.
- Open connected `Notifications` from the lower utility rows.
- Open `Share` for copy, QR, X, Farcaster, and supported system-share actions
  using the exact current URL.
- Select the connected avatar, then `Profile` (handle route first, wallet
  fallback) or `Connect Device`.

## Edge Cases

- `DMs` unread dots stay in the main nav; `Notifications` unread dots stay
  on the lower connected-only row.
- `Discover Waves` is a secondary Waves panel/search link and routes to
  `/discover`.
- Connected user avatar unread dot reflects unread notifications on other
  connected accounts (not the active one).
- Active grouped routes auto-expand their section on route load/change.
- In collapsed mode, selecting the same group toggles flyout open/closed.
- Mouse hover uses a short intent delay before opening and a close grace period
  so crossing from the group icon into the flyout does not dismiss it.
- Only one collapsed flyout is open at a time. Moving from one group to another
  replaces the open flyout.
- Collapsed flyouts keep subsection headers as labels; only the nested rows
  inside each subsection navigate.
- Flyouts close after the mouse leaves both the trigger and flyout, on outside
  click, with `Escape`, or when the rail exits collapsed mode. Keyboard opening
  moves focus into the links, and `Escape` restores focus to the group trigger.
- The collapsed-row tooltip stays hidden while its flyout is open.
- Flyouts reposition on sidebar scroll and window resize.
- `Notifications` row appears only when wallet connection is active.
- `Drop Forge` appears as a standalone row after `About` only when the
  connected wallet can access the `/drop-forge` landing route.
- Connected user row opens the account menu immediately on a single activate.
- The web account dropdown stays horizontally anchored to the connected user
  row when the centered desktop layout adds wide-screen margins.
- The desktop-web sidebar `Share` row is hidden in Capacitor/native and
  mobile-device web contexts. Supported mobile pages expose Share from the
  header instead. The route rules are documented in
  [Page Sharing and Device Connection](feature-share-modal.md).
- `App Wallets` appears inside `About > Delegation & Wallets` only when
  app-wallet support is enabled.
- On iOS, subscription-related rows show only when country resolves to `US`:
  `Subscriptions Report`, `Open Data > Meme Subscriptions Data`,
  and `About > Subscriptions`.

## Failure and Recovery

- While identity data loads, account area shows placeholders.
- If profile handle is missing, `Profile` falls back to the wallet address.
- If overlay looks stuck, close with backdrop, `Escape`, or route change.
- If submenu state looks stale, toggle the group or rail again.
- If `Drop Forge` is missing, verify the connected wallet can access the landing
  route and wait for permission checks to finish.
- If the sidebar `Share` row looks missing, check the runtime and route-support
  list. Mobile web and the native app place page sharing in the header, while
  unsupported routes intentionally omit it.
- Opening the target wave/DM thread should clear that wave's unread state and
  refresh unread indicators after read sync. If indicators still look stale,
  open `/notifications` for the target account and retry after refresh.
- If a row is missing, verify auth/device/country/app-wallet gating.

## Limitations / Notes

- Search is modal-only; there is no `/search` route.
- Desktop web exposes `Search` as a sidebar row; touch small-screen web keeps
  search in the header instead of the overlay menu.
- Desktop-web sidebar search supports both `⌘K` and `Ctrl+K`.
- Sidebar rows change with auth, device context, country gate, and runtime
  feature gates.
- The Stream review item is controlled by the public-review environment gate,
  not wallet state. Only loopback development and the exact shared staging
  hostname enable it initially.
- Native app primary switching is owned by
  [Mobile Bottom Navigation](feature-mobile-bottom-navigation.md).

## Related Pages

- [Navigation Index](README.md)
- [App Sidebar Menu](feature-app-sidebar-menu.md)
- [Navigation Entry and Switching Flow](flow-navigation-entry-and-switching.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
- [Header Search Modal](feature-header-search-modal.md)
- [Page Sharing and Device Connection](feature-share-modal.md)
- [6529 Apps Page](feature-6529-apps-page.md)
- [Wallet and Account Controls](feature-wallet-account-controls.md)
- [Network Index](../network/README.md)
