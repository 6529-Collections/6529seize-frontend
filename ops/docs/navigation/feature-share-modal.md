# Page Sharing and Device Connection

## Overview

Desktop web exposes two separate flows:

- `Share` publishes the exact current browser URL through copy, QR code, X,
  Farcaster, or the device share sheet when the Web Share API is available.
- `Connect Device` transfers the authenticated session to 6529 Mobile
  or 6529 Desktop.

The flows use the same accessible dialog foundation, but never show each
other's controls. Native app page sharing keeps its existing platform share
sheet behavior.

## Entry Points

- Desktop web: select the persistent `Share` icon in the sidebar on supported
  routes.
- Desktop web connection: select the profile picture, then
  `Connect Device`.
- Native app: select the page-share icon in the app header on supported routes.

## Share Flow

1. Select the Share icon.
2. The `Share this page` dialog opens with a compact QR code. Its `Browser` /
   `App` toggle defaults to Browser and remembers the last choice in a cookie.
3. Choose one of the icon-only actions, identified by accessible names and
   rendered tooltips:
   - copy the exact current URL
   - open the same route in 6529 Desktop
   - compose a post on X
   - compose a cast on Farcaster
   - open the system share sheet through `navigator.share`, when supported
4. Close with the close button, backdrop, or `Escape`.

The QR code is always visible while the dialog is open. Browser mode contains
the complete current URL, including pathname, search parameters, and hash
fragment. App mode uses the existing `mobile6529://navigate` deep-link shape
with that same route. The Desktop action uses the corresponding
`core6529://navigate` route. Copy, social composer links, and system sharing
always use the browser URL regardless of the selected QR target. Copy shows a
two-second green success state.

## Unsupported Share Pages

Desktop web and the native app use the same route-support rules. Share is
hidden on:

- home (`/`)
- Messages (`/messages` and child routes)
- Notifications (`/notifications` and child routes)
- any route currently rendered in the `messages` query view

All other pages, including `/waves`, wave detail routes, and the `waves` query
view, support Share. Desktop web uses the sidebar entry; the native app keeps
its existing header placement and platform-share behavior.

## Connect Another Device Flow

1. Select the desktop-web profile picture to open the account menu.
2. Select `Connect Device`.
3. The dialog defaults to `Mobile`; select `Desktop` when needed.
4. Mobile displays the existing one-time session-v2 connection QR code.
5. Desktop displays the existing legacy desktop connection handoff.

No copy-page, social, or current-page Share actions appear in this dialog.

## QR Rendering

- QR payload and connection behavior are unchanged.
- Codes render at 500 pixels with a four-module quiet zone.
- Foreground is pure black and background is opaque pure white.
- The image uses nearest-neighbor rendering, contains the complete QR image,
  and is not cropped, blurred, or made transparent.

## Edge Cases

- Desktop Share and Connect entries are hidden in Capacitor/native and
  mobile-device web contexts.
- Desktop is hidden as a connection target when already running in Electron.
- Connection preparation can show sign-in, authentication-upgrade, loading,
  or unavailable states without revealing page-sharing controls.
- The system-share action is omitted when `navigator.share` is unavailable.
- Clipboard and system-share errors leave the dialog open; canceled system
  sharing is not reported as an error.

## Related Pages

- [Navigation Index](README.md)
- [Web Sidebar Navigation](feature-sidebar-navigation.md)
- [Wallet and Account Controls](feature-wallet-account-controls.md)
- [App Header Context](feature-app-header-context.md)
- [6529 Apps Page](feature-6529-apps-page.md)
