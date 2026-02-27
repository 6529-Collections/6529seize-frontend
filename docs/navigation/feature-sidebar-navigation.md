# Web Sidebar Navigation

## Overview

On web layouts, primary route switching is sidebar-first. Desktop keeps a fixed
left rail, while small-screen web opens the same navigation in an off-canvas
overlay. Messages and notifications rows can show unread indicators.

## Location in the Site

- Desktop web layout: fixed left sidebar rail.
- Small-screen web layout: header menu button opens sidebar overlay.
- Direct rows: `Home`, `Waves`, `Messages`, `Discover`, `Notifications`.
- Expandable groups: `Network`, `Collections`, `Tools`, `About`.
- Utility rows: `Search`, `Share`, and connected `Profile`.

## Entry Points

- Use the fixed left sidebar on desktop.
- Open the small-screen header menu on narrow web layouts.
- Select a direct row or expand a group to choose a nested route.
- Open `Search` from the sidebar without leaving the current route.

## User Journey

1. User opens any web-layout route.
2. User switches sections through direct rows.
3. User opens expandable groups for nested routes.
4. In collapsed desktop mode, group rows open anchored flyout submenus.
5. User selects a destination and active-route highlighting updates.
6. On small-screen web, overlay sidebar closes after route selection.

## Common Scenarios

- Open `Network` routes such as `Identities`, `Activity`, `Groups`, `TDH`,
  `xTDH`, and `Metrics` pages.
- Open `Collections` routes (`The Memes`, `6529 Gradient`, `NextGen`,
  `Meme Lab`, `ReMemes`, `xTDH`).
- Open `Tools` routes for delegation, API, EMMA, Block Finder, and open data.
- Open `Search` to jump directly to pages, profiles, NFTs, and waves.
- Open `Share` to generate QR/deep links for the current route.
- Use `Profile` shortcut when connected (handle-first, wallet fallback).

## Edge Cases

- `App Wallets` row appears only when app-wallet support is enabled.
- `Profile` row appears only when wallet connection is active.
- `Share` row is desktop-web focused and does not appear on mobile/native app
  shells.
- Subscription-related rows are hidden on iOS outside the US in sections that
  gate those routes (for example `Subscriptions Report`, `Meme Subscriptions`,
  and `About > Subscriptions`).
- In collapsed desktop mode, selecting the same group toggles its flyout open
  and closed.
- Open flyouts track scroll/resize so they stay anchored to trigger rows.

## Failure and Recovery

- While connected profile data loads, account areas show placeholders.
- If handle data is missing, `Profile` routing falls back to wallet-address
  route.
- If small-screen overlay appears stuck, close with backdrop, `Escape`, or
  route change.
- If submenu state looks stale after collapse/expand changes, toggle the group
  again to reset submenu state.

## Limitations / Notes

- Search opens a modal and does not have a dedicated route.
- Sidebar row availability changes with auth state, app-wallet support, and
  route-visibility gating rules.
- Native app primary switching is documented in
  [Mobile Bottom Navigation](feature-mobile-bottom-navigation.md).

## Related Pages

- [Navigation Index](README.md)
- [App Sidebar Menu](feature-app-sidebar-menu.md)
- [Navigation Entry and Switching Flow](flow-navigation-entry-and-switching.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
- [Header Search Modal](feature-header-search-modal.md)
- [Wallet and Account Controls](feature-wallet-account-controls.md)
- [Network Index](../network/README.md)
