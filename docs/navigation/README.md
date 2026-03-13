# Navigation

Navigation docs explain how users switch routes and use shell controls on web
and mobile app layouts.

## Overview

- Web shell navigation: desktop left rail plus overlay behavior on small-screen
  or narrow web viewports.
- App shell navigation: header controls, bottom tabs, and app sidebar menu.
- Shared controls: search modal, context-aware back, wallet/account actions,
  and internal links.
- Mobile-specific behavior: pull-to-refresh, keyboard-aware bottom-nav
  visibility, and `/open-mobile` app handoff.

## Route Coverage

- Primary section switching: `/`, `/discover`, `/waves`, `/messages`,
  `/network`, `/the-memes`, `/notifications`.
- Secondary jumps: `/network/*`, `/nft-activity`, `/meme-calendar`,
  collections routes, tools routes, and about routes.

## Features

### Route Switching Surfaces

- [Web Sidebar Navigation](feature-sidebar-navigation.md): web route switching
  from the desktop rail and overlay sidebar modes on narrow web layouts.
- [Mobile Bottom Navigation](feature-mobile-bottom-navigation.md): app primary
  tabs for `Discover`, `Waves`, `Messages`, `Home`, `Network`, `Collections`,
  and `Notifications`.
- [App Sidebar Menu](feature-app-sidebar-menu.md): app drawer with direct rows
  (`Discover`, connected `Profile`), grouped links (`Network`, `Tools`,
  `About`), and footer account actions.

### Shared Shell Controls

- [App Header Context](feature-app-header-context.md): app-header title
  precedence, left-control switching, and contextual action-row behavior.
- [Header Search Modal](feature-header-search-modal.md): modal search for pages,
  profiles, NFTs, waves, and in-wave messages.
- [Back Button Behavior](feature-back-button.md): create-route, wave/drop, and
  history-aware back behavior.
- [Wallet and Account Controls](feature-wallet-account-controls.md):
  connect, disconnect, switch account, and proxy/account actions.
- [Internal Link Navigation](feature-internal-link-navigation.md): internal
  route links, hash anchors, and drop-content link behavior.

### Mobile-Specific Behavior

- [Mobile Pull-to-Refresh Behavior](feature-mobile-pull-to-refresh.md):
  app-shell header swipe refresh at top-of-page with in-place data/state refresh.
- [Mobile Keyboard and Bottom Navigation Layout](feature-android-keyboard-layout.md):
  keyboard-driven bottom-nav visibility and spacing adjustments.
- [Mobile App Landing Page](feature-mobile-app-landing.md): `/open-mobile`
  deep-link handoff with store fallback and return-to-web action.

## Flows

- [Navigation Entry and Switching Flow](flow-navigation-entry-and-switching.md)

## Troubleshooting

- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)

## Stubs

- None.

## Related Areas

- [Docs Home](../README.md)
- [Profiles Index](../profiles/README.md)
- [Profile Navigation Flow](../profiles/navigation/flow-navigation.md)
- [Profile Troubleshooting](../profiles/troubleshooting/troubleshooting-routes-and-tabs.md)
- [Waves Index](../waves/README.md)
- [Notifications Index](../notifications/README.md)
- [Shared Index](../shared/README.md)
