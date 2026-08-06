# Page Sharing and Device Connection

## Overview

Desktop web exposes two separate flows:

- `Share` publishes the exact current browser URL through copy, QR code, X,
  Farcaster, or the device share sheet when the Web Share API is available.
- `Connect another device` transfers the authenticated session to 6529 Mobile
  or 6529 Desktop.

The flows use the same accessible dialog foundation, but never show each
other's controls. Native app page sharing keeps its existing platform share
sheet behavior.

## Entry Points

- Desktop web: select the persistent `Share` icon in the sidebar on supported
  routes.
- Desktop web connection: select the profile picture, then
  `Connect another device`.
- Native app: select the page-share icon in the app header on supported routes.

## Share Flow

1. Select the Share icon.
2. The `Share this page` dialog opens with icon-only actions. Accessible names
   and hover titles identify each action.
3. Choose one of:
   - copy the exact current URL
   - create or hide its QR code
   - compose a post on X
   - compose a cast on Farcaster
   - open the system share sheet through `navigator.share`, when supported
4. Close with the close button, backdrop, or `Escape`.

The shared value comes from the complete current URL, including pathname,
search parameters, and hash fragment. Social composer links and the QR code use
that same value.

## Unsupported Share Pages

Desktop web and the native app use the same route-support rules. Share is
hidden on:

- home (`/`)
- Waves (`/waves` and child routes)
- Messages (`/messages` and child routes)
- Notifications (`/notifications` and child routes)
- any route currently rendered in the `waves` or `messages` query view

All other desktop-web pages show the sidebar Share entry. The native app keeps
its existing header placement and platform-share behavior.

## Connect Another Device Flow

1. Select the desktop-web profile picture to open the account menu.
2. Select `Connect another device`.
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
