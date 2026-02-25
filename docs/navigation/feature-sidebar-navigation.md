# Sidebar Navigation

## Overview

The site uses a sidebar-first navigation model. On desktop, the sidebar stays
visible. On small screens, the same navigation is opened as an off-canvas menu
from the header menu button. Desktop layout keeps the sidebar rail and
main-content column visually stable when moving between pages that do and do
not need vertical scrolling.
On mobile app builds, quick access to core destinations is handled by the fixed
bottom app bar; this page covers sidebar behavior, while destination switching in
the app shell is documented in `feature-mobile-bottom-navigation.md`.
On desktop, a subtle divider on the sidebar edge keeps the rail visually
separate from the main content column.

## Location in the Site

- Desktop: fixed left sidebar on app routes.
- Small screens: header menu button opens the sidebar as an overlay panel.
- Navigation includes route links, expandable sections, search, sharing, and
  profile/account controls.
- On desktop routes that show the site footer, footer content aligns with the
  same content column to the right of the sidebar.

## Entry Points

- Open the menu button in the small-screen header.
- Use the always-visible sidebar on desktop.
- Select `Search` in the sidebar navigation.
- On desktop, keyboard shortcut `Meta + K` opens search.

## User Journey

1. Open any app route.
2. Choose a primary destination (`Home`, `Waves`, `Messages`, `Discover`,
   `Notifications`) or expand a section (`Network`, `Collections`, `Tools`,
   `About`).
3. Select a destination link.
4. On web small-screen layouts, continue to use overlay sidebar controls for
   profile access, sharing, and wallet/user actions.
5. Continue navigating with active-route highlighting and expanded section
   state.

## Common Scenarios

- Opening `Discover` from sidebar to reach `/discover`.
- Opening `Messages` and seeing an unread indicator when new messages exist.
- Selecting `Waves` or `Messages` while already inside a wave/DM returns to the
  section list instead of re-opening the active thread.
- Selecting `Waves` or `Messages` from other routes opens the last visited
  wave/DM when available; otherwise it opens the section home.
- Opening `Notifications` and seeing an unread indicator when notifications are
  pending.
- Opening `Notifications` from sidebar to reach `/notifications`.
- Expanding `Network` to access direct links such as `Identities`, `Activity`,
  `Groups`, `NFT Activity`, `Memes Calendar`, `TDH`, and `xTDH`.
- Opening `Network -> Metrics` to access `Health`, `Definitions`, `Levels`,
  and `Network Stats`.
- Expanding `Tools` to access delegation routes, API, EMMA, Block Finder, and
  open data routes, including:
  - `Network Metrics`
  - `Rememes`
  - `Team`
  - `Royalties`
  - `Meme Subscriptions`.
- Opening `Tools -> Delegation Center` to reach
  `/delegation/delegation-center`.
- Opening `Tools -> EMMA` to reach `/emma` and continue into `/emma/plans`.
- Opening `Tools -> Other Tools -> Block Finder` to reach
  `/tools/block-finder`.
- Opening `Search` from sidebar navigation without leaving the current route.
- Opening `Share` from the sidebar to generate QR links for the current route,
  including the `6529 Desktop` deep-link option.
- In signed-in sessions, using `Share Connection` to generate a connection link
  for another device.
- Navigating between short pages and long pages on desktop without seeing the
  sidebar/content rail jump horizontally when scrollbar visibility changes.
- Using `Profile` from the sidebar footer; it resolves to a handle route when
  available, otherwise wallet-address route.
- Opening `Network -> Memes Calendar` to reach `/meme-calendar`.
- On `/waves` and `/messages`, when an inline right sidebar is open, the left
  wave list stays compact and shows a temporary expand control to restore full
  width quickly.
- In mobile app shells, use the fixed bottom destination bar for primary section
  switching instead of sidebar-driven deep navigation.

## Edge Cases

- `Subscriptions`-related links are hidden on iOS when country is not `US`:
  - `Tools -> The Memes Tools -> Subscriptions Report`
  - `Tools -> Open Data -> Meme Subscriptions`
- Other `Open Data` links remain visible on iOS.
- `About -> NFTs -> Subscriptions` is hidden on iOS outside the `US`.
- `App Wallets` appears only when app-wallet support is enabled.
- `Profile` link in sidebar footer appears only when a wallet is connected.
- `Memes Calendar` appears under `Network` (not under `About -> NFTs`).
- `Share Connection` appears only when the user has an active authenticated
  session.
- Connection-sharing links include proxy context only when the current session
  has an active proxy role.
- In the share modal, the desktop-app option is labeled `6529 Desktop`.
- In collapsed desktop mode, expandable sections open as a flyout submenu
  anchored to the selected section row instead of an inline panel.
- In collapsed desktop mode, clicking the section trigger row while its flyout
  is open is handled as submenu interaction, so users can toggle that section
  without the flyout being dismissed as an outside click.
- While a collapsed flyout submenu is open, resizing the window or scrolling
  the sidebar keeps the submenu attached to its trigger row.
- On wide desktop viewports, the app reserves balanced scrollbar gutter space
  so the fixed sidebar and centered content area stay horizontally aligned.

## Failure and Recovery

- While identity data is loading, sidebar user/profile areas show loading
  skeletons.
- If profile handle data is unavailable, profile navigation falls back to
  wallet-based routing when wallet address exists.
- If auth is not active (for example after logout), `Share Connection` is
  hidden until the user signs in again.
- On small screens, overlay navigation closes on route change, `Escape`, or
  overlay click to recover from stale open-menu state.
- When sidebar display mode changes (expanded/collapsed), open submenus are
  reset so navigation state does not remain stale.
- In collapsed desktop mode, users can recover from an unintended open section
  by clicking the same section trigger again to close the flyout directly.

## Limitations / Notes

- Search opens a modal, not a dedicated route.
- Menu availability changes by device capabilities and region (for example, iOS
  + non-US restrictions for subscription-related pages).
- Profile and user controls depend on active wallet connection state.
- Full expanded desktop sidebar behavior is replaced by collapsed/off-canvas
  patterns on narrower viewports.
- In wave/message screens, left-sidebar width can also be driven by right-sidebar
  state; closing the inline right sidebar expands the compact left sidebar.

## Related Pages

- [Navigation Index](README.md)
- [Notifications Feed](../notifications/feature-notifications-feed.md)
- [Internal Link Navigation](feature-internal-link-navigation.md)
- [Header Search Modal](feature-header-search-modal.md)
- [Delegation Center Layout and Section Navigation](../delegation/feature-delegation-center-layout-and-section-navigation.md)
- [API Authentication and Media Drop Flow](../api-tool/feature-api-authentication-and-media-drop-flow.md)
- [EMMA Custom Snapshot Wallet Batching](../emma/feature-custom-snapshot-wallet-batching.md)
- [Block Finder](../api-tool/feature-block-finder.md)
- [Memes Subscriptions Report](../api-tool/feature-memes-subscriptions-report.md)
- [Wallet and Account Controls](feature-wallet-account-controls.md)
- [Wave Left Sidebar Expand Control](../waves/sidebars/feature-left-sidebar-expand-control.md)
- [Mobile Bottom Navigation](feature-mobile-bottom-navigation.md)
- [Docs Home](../README.md)
- [Profile Tabs](../profiles/navigation/feature-tabs.md)
- [Profile Navigation Flow](../profiles/navigation/flow-navigation.md)
- [Network Index](../network/README.md)
