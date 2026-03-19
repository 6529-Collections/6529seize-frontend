# Web Sidebar Navigation

Parent: [Navigation Index](README.md)

## Overview

On web layouts, route switching is sidebar-first.

- Desktop: fixed left rail with collapse/expand toggle.
- Narrow desktop web: collapsed icon rail that can open as an overlay panel.
- Touch small-screen web: header menu button opens the same sidebar as overlay.
- In collapsed rail mode, flyout submenus keep the same subsection labels and
  nested route grouping shown in the expanded rail.
- `Messages` keeps a main-nav unread dot; connected users get a lower
  `Notifications` row with its own unread dot.
- Connected account avatar in the sidebar account area can show an unread dot
  when another connected account has unread notifications.

## Location in the Site

- Web routes rendered with `WebLayout` or `SmallScreenLayout` (non-app).
- Direct rows: `Home`, `Waves`, `Messages`, `Discovery`.
- Expandable groups: `Network`, `Collections`, `Tools`, `About`.
- Utility rows: desktop `Search`, connected-only `Notifications`,
  connected-only `Profile`, and disconnected-only `Share`.
- Bottom account area: connect action, loading placeholders, and the connected
  user menu.

## Entry Points

- Desktop and narrow desktop web: use sidebar chevron toggle.
- Touch small-screen web: use header menu button.
- Select direct rows or expand groups for nested routes.
- Open `Discovery` from the direct row.
- Open `Search` from the desktop sidebar row.
- Open connected `Notifications` from the lower row above `Profile`.
- Open `Share` from the lower row while disconnected, or from the connected
  user menu on desktop web.
- Press `⌘K` or `Ctrl+K` when desktop sidebar navigation is mounted.

## User Journey

1. Open a web route.
2. Switch primary sections with direct rows.
3. Use lower utility rows for connected `Notifications`, connected `Profile`,
   or disconnected `Share`.
4. Open `Network`, `Collections`, `Tools`, or `About` for nested routes.
5. In collapsed mode, group rows open anchored flyout submenus that preserve
   subsection labels such as `Metrics`, `Open Data`, or `Resources`.
6. Select a destination and watch active state update.
7. In overlay mode, sidebar closes after route change.

## Common Scenarios

- Open `Network` and `Metrics` routes:
  `/network`, `/network/activity`, `/network/groups`, `/nft-activity`,
  `/meme-calendar`, `/network/tdh`, `/xtdh`, `/network/health`,
  `/network/definitions`, `/network/levels`, `/network/health/network-tdh`.
- Open `Collections` routes:
  `/the-memes`, `/6529-gradient`, `/nextgen`, `/meme-lab`, `/rememes`.
- Open `Discovery` to route into `/discover`.
- Open `Tools` routes:
  delegation pages, `/meme-accounting`, `/meme-gas`,
  optional `/tools/subscriptions-report`, optional `/tools/app-wallets`,
  `/tools/api`, `/emma`, `/tools/block-finder`,
  `/open-data`, `/open-data/network-metrics`,
  optional `/open-data/meme-subscriptions`, `/open-data/rememes`,
  `/open-data/team`, `/open-data/royalties`.
- Use collapsed-rail flyouts for grouped destinations:
  `Network` keeps `Metrics`, `Tools` keeps labels such as `NFT Delegation`,
  `The Memes Tools`, `Other Tools`, and `Open Data`, and `About` keeps its
  subsection labels instead of flattening every route into one list.
- Open `About` and `6529 Capital` routes from grouped links.
- Open connected `Notifications` from the lower row above `Profile`.
- Open `Share` to generate QR/deep links for the current route:
  disconnected desktop web uses the standalone row, while connected desktop
  web opens `Share` from the user menu.
- Use connected `Profile` shortcut (handle route first, wallet fallback).

## Edge Cases

- `Messages` unread dots stay in the main nav; `Notifications` unread dots stay
  on the lower connected-only row.
- `Discovery` active state is route-based and applies only on `/discover`.
- Connected user avatar unread dot reflects unread notifications on other
  connected accounts (not the active one).
- Active grouped route auto-expands its section on route load/change.
- In collapsed mode, selecting the same group toggles flyout open/closed.
- Collapsed flyouts keep subsection headers as labels; only the nested rows
  inside each subsection navigate.
- Flyouts close on outside click, `Escape`, or when rail exits collapsed mode.
- Flyouts reposition on sidebar scroll and window resize.
- `Notifications` row appears only when wallet connection is active.
- `Profile` row appears only when wallet connection is active.
- Connected user row opens the account menu on a single activate; a quick
  second activate cycles to the next connected account when at least two are
  available.
- Disconnected `Share` row is hidden in Capacitor/native context and
  mobile-device web.
- Connected desktop-web `Share` moves into the user menu and stays hidden until
  device detection resolves.
- `App Wallets` appears only when app-wallet support is enabled.
- On iOS, subscription-related rows show only when country resolves to `US`:
  `Subscriptions Report`, `Open Data > Meme Subscriptions`,
  and `About > Subscriptions`.

## Failure and Recovery

- While identity data loads, account area shows placeholders.
- If profile handle is missing, `Profile` route falls back to wallet address.
- If overlay looks stuck, close with backdrop, `Escape`, or route change.
- If submenu state looks stale, toggle the group or rail again.
- If `Share` looks missing, check auth/device context: disconnected desktop web
  uses the standalone row, connected desktop web uses the user menu, and
  Capacitor/mobile-device web hides it.
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
- Native app primary switching is owned by
  [Mobile Bottom Navigation](feature-mobile-bottom-navigation.md).

## Related Pages

- [Navigation Index](README.md)
- [App Sidebar Menu](feature-app-sidebar-menu.md)
- [Navigation Entry and Switching Flow](flow-navigation-entry-and-switching.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
- [Header Search Modal](feature-header-search-modal.md)
- [Share Modal](feature-share-modal.md)
- [Wallet and Account Controls](feature-wallet-account-controls.md)
- [Network Index](../network/README.md)
