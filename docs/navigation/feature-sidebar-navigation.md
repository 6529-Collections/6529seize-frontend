# Web Sidebar Navigation

Parent: [Navigation Index](README.md)

## Overview

On web layouts, route switching is sidebar-first.

- Desktop: fixed left rail with collapse/expand toggle.
- Narrow desktop web: collapsed icon rail that can open as an overlay panel.
- Touch small-screen web: header menu button opens the same sidebar as overlay.
- `Messages` and `Notifications` can show unread dots for connected profiles.

## Location in the Site

- Web routes rendered with `WebLayout` or `SmallScreenLayout` (non-app).
- Direct rows: `Home`, `Waves`, `Messages`, `Discover`, `Notifications`.
- Expandable groups: `Network`, `Collections`, `Tools`, `About`.
- Utility rows: `Search`, optional `Share`, and connected-only `Profile`.
- Bottom account area: connect action, loading placeholders, and user menu.

## Entry Points

- Desktop and narrow desktop web: use sidebar chevron toggle.
- Touch small-screen web: use header menu button.
- Select direct rows or expand groups for nested routes.
- Open `Search` from sidebar row.
- Press `⌘K` when sidebar navigation is mounted.

## User Journey

1. Open a web route.
2. Switch primary sections with direct rows.
3. Open `Network`, `Collections`, `Tools`, or `About` for nested routes.
4. In collapsed mode, group rows open anchored flyout submenus.
5. Select a destination and watch active state update.
6. In overlay mode, sidebar closes after route change.

## Common Scenarios

- Open `Network` and `Metrics` routes:
  `/network`, `/network/activity`, `/network/groups`, `/nft-activity`,
  `/meme-calendar`, `/network/tdh`, `/network/xtdh`, `/network/health`,
  `/network/definitions`, `/network/levels`, `/network/health/network-tdh`.
- Open `Collections` routes:
  `/the-memes`, `/6529-gradient`, `/nextgen`, `/meme-lab`, `/rememes`,
  `/xtdh`.
- Open `Tools` routes:
  delegation pages, `/meme-accounting`, `/meme-gas`,
  optional `/tools/subscriptions-report`, optional `/tools/app-wallets`,
  `/tools/api`, `/emma`, `/tools/block-finder`,
  `/open-data`, `/open-data/network-metrics`,
  optional `/open-data/meme-subscriptions`, `/open-data/rememes`,
  `/open-data/team`, `/open-data/royalties`.
- Open `About` and `6529 Capital` routes from grouped links.
- Open `Share` to generate QR/deep links for current route.
- Use connected `Profile` shortcut (handle route first, wallet fallback).

## Edge Cases

- `Messages` and `Notifications` unread dots require connected profile handle
  plus unread state.
- Active grouped route auto-expands its section on route load/change.
- In collapsed mode, selecting the same group toggles flyout open/closed.
- Flyouts close on outside click, `Escape`, or when rail exits collapsed mode.
- Flyouts reposition on sidebar scroll and window resize.
- `Profile` row appears only when wallet connection is active.
- `Share` row is hidden in Capacitor/native context and mobile-device web.
- `App Wallets` appears only when app-wallet support is enabled.
- On iOS, subscription-related rows show only when country resolves to `US`:
  `Subscriptions Report`, `Open Data > Meme Subscriptions`,
  and `About > Subscriptions`.

## Failure and Recovery

- While identity data loads, account area shows placeholders.
- If profile handle is missing, `Profile` route falls back to wallet address.
- If overlay looks stuck, close with backdrop, `Escape`, or route change.
- If submenu state looks stale, toggle the group or rail again.
- If a row is missing, verify auth/device/country/app-wallet gating.

## Limitations / Notes

- Search is modal-only; there is no `/search` route.
- Shortcut is `⌘K`; `Ctrl+K` is not wired.
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
- [Wallet and Account Controls](feature-wallet-account-controls.md)
- [Network Index](../network/README.md)
