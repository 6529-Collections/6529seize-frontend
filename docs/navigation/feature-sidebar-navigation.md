# Sidebar Navigation

## Overview

On web layouts, primary navigation is sidebar-first. Desktop keeps a fixed left
rail, while small-screen web uses the same navigation in an off-canvas overlay.
Section links are expandable, active-route state is highlighted, and collapsed
desktop mode uses flyout submenus for section contents.

## Location in the Site

- Desktop web layout: fixed left sidebar rail.
- Small-screen web layout: header menu button opens the sidebar as an overlay.
- Navigation rows include direct routes (`Home`, `Waves`, `Messages`,
  `Discover`, `Notifications`), expandable sections (`Network`, `Collections`,
  `Tools`, `About`), plus `Search` and `Share`.

## Entry Points

- Use the always-visible sidebar on desktop.
- Open the small-screen menu from the header.
- Select a direct route row or expand a section.
- Open `Search` from sidebar navigation.

## User Journey

1. Open an app route in a web layout.
2. Use direct route rows for fast section switches (`Home`, `Waves`,
   `Messages`, `Discover`, `Notifications`).
3. Expand section rows (`Network`, `Collections`, `Tools`, `About`) to pick
   nested destinations.
4. In collapsed desktop mode, section selections open a flyout menu anchored to
   the section row.
5. Select a destination link and continue with updated active-route highlighting.
6. On small-screen web, overlay navigation closes after route selection.

## Common Scenarios

- Open `Network` and drill into route families such as `Identities`,
  `Activity`, `Groups`, `TDH`, `xTDH`, and `Metrics` pages.
- Open `Collections` routes such as `The Memes`, `6529 Gradient`, `NextGen`,
  `Meme Lab`, and `ReMemes`.
- Open `Tools` destinations including delegation, API, EMMA, Block Finder, and
  open-data routes.
- Open `Search` without leaving the current route.
- Open `Share` to generate QR links for the current route.
- Use the sidebar `Profile` shortcut when connected; it resolves to handle-first
  profile routing and falls back to wallet-address routing.

## Edge Cases

- `App Wallets` appears only when app-wallet support is enabled.
- `Profile` appears only when a wallet is connected.
- `Share Connection` in the share modal appears only when an authenticated
  connection token exists.
- In collapsed desktop mode, section flyouts can be toggled by selecting the
  same section row again.
- While a collapsed flyout is open, resize/scroll events keep the flyout aligned
  to its section row.
- On wide desktop viewports, stable scrollbar gutter behavior keeps the fixed
  sidebar rail and content column aligned.

## Failure and Recovery

- While profile/identity data is loading, sidebar account areas show loading
  placeholders.
- If connected profile handle data is unavailable, profile navigation falls back
  to wallet-based routing.
- On small-screen overlay mode, stale open-menu state can be recovered via route
  change, `Escape`, or backdrop click.
- When sidebar display mode changes (expanded/collapsed), open submenus are
  cleared to avoid stale submenu state.

## Limitations / Notes

- Search opens a modal and does not use a dedicated route.
- Sidebar content can vary by app-wallet support, auth state, and available
  profile data.
- Native app layouts rely on
  [Mobile Bottom Navigation](feature-mobile-bottom-navigation.md) for primary
  section switching.

## Related Pages

- [Navigation Index](README.md)
- [Navigation Entry and Switching Flow](flow-navigation-entry-and-switching.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
- [Header Search Modal](feature-header-search-modal.md)
- [Wallet and Account Controls](feature-wallet-account-controls.md)
- [Mobile Bottom Navigation](feature-mobile-bottom-navigation.md)
- [Network Index](../network/README.md)
