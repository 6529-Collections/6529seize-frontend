# Page Sharing and Device Connection

## Overview

The navigation controls expose two separate flows:

- `Share` publishes the exact shareable web URL through copy, QR code, X,
  Farcaster, or the `More` system-share action when the platform allows it.
- `Connect Device` creates an additional authenticated session in 6529 Mobile
  or 6529 Desktop, optionally with device permissions.

Desktop page sharing and device connection use the same accessible dialog
foundation and one consistent content inset, but never show each other's
controls. Page sharing on mobile web and in the native app bypasses the Share
dialog and opens the platform share sheet directly.

Individual Meme, Gradient, and NextGen pages also have a `Share artwork` icon
in their artwork media controls. It opens a separate dialog for credited
image exports and captions. See
[Artwork Sharing](../media/nft/feature-artwork-sharing.md) for that flow.

## Location in the Site

Page sharing belongs to the shared navigation surface. On supported desktop-web
pages it opens from the persistent sidebar. Device connection opens from the
profile menu. Mobile web and native apps open page sharing from the app header.

## Entry Points

- Desktop web: select the persistent `Share` icon in the sidebar on supported
  routes.
- Mobile web: select the page-share icon in the small-screen header on supported
  routes.
- Desktop web connection: select the profile picture, then
  `Connect Device`. The account menu distinguishes wallet connection from
  device connection with a full-width divider inside the connection-actions
  section and stronger section boundaries around the pair.
- Native app: select the page-share icon in the app header on supported routes.
  When a wave is active, use its arrow-style share action inside the `More`
  menu instead of a separate page-share icon.

## User Journey

### Share a Page

1. Select the Share icon.
2. On mobile web, the browser opens the operating-system share sheet directly.
   In the native app, Capacitor opens the native share sheet directly. Neither
   mobile surface opens the 6529 Share dialog.
3. On desktop web, the `Share` dialog opens in two columns on wider screens.
   The left column contains the persistent `Browser` / `App` toggle, which
   defaults to `Browser` when no target has been selected, and the QR code,
   aligned to the same width; the right column uses the remaining space and
   contains equal-width sharing actions with an icon and visible label. A
   divider separates the sections. On wider screens, the QR size responds to
   whether four or five actions are available so both sections have equal
   height. On narrow screens, the sections stack inside a narrower dialog and
   retain a fixed compact QR.
4. In the desktop dialog, choose an action:
   - `Copy Link` copies the current shareable URL
   - `Open in 6529 Desktop` opens the same route in the desktop app
   - `Share on X` opens an X composer
   - `Share on Farcaster` opens a Farcaster composer
   - `More` opens the system share sheet, when it is available
5. Close with the close button, backdrop, or `Escape`.

The QR code is visible in the desktop-web dialog. Browser mode contains
the complete shareable URL, including pathname, search parameters, and hash
fragment. App mode uses the existing `mobile6529://navigate` deep-link shape
with that same route. The Desktop action uses the corresponding
`core6529://navigate` route. Copy, social composer links, and system sharing
always use the shareable web URL regardless of the selected QR target. For a
NextGen token opened from a profile's Collected tab, sharing removes the
transient profile-return parameter while preserving other route state. Copy
shows a green `Copied` state for about 1.5 seconds. System sharing reads the
browser URL again when selected and applies the same cleanup. Mobile web opens
the Web Share API directly from the header button, and the native header button
opens Capacitor's system share sheet directly. Native system-share failure
never falls back to Copy.

## Unsupported Share Pages

Messages, Notifications, and the Messages query view are excluded on every
surface. Home differs by surface: desktop web supports Share on `/`, while
mobile web and the native app hide it. Specifically, Share is hidden on:

- Messages (`/messages` and child routes)
- Notifications (`/notifications` and child routes)
- any route currently rendered in the `messages` query view
- home (`/`) on mobile web and in the native app only

All other pages, including `/waves`, wave detail routes, and the `waves` query
view, support Share. Desktop web uses the sidebar entry and mobile web uses its
header entry. In the native app, the general header entry is hidden while a
wave is active because the wave-specific share action is already available in
the `More` menu.

## Connect Device

1. Open the desktop-web account menu, then **Connect Device**.
2. Confirm the avatar, handle and full wallet address. Under **Which app are you
   connecting?**, select **6529 Mobile** or **6529 Desktop**.
3. Choose **Connect only**, or **Connect with Post Signing & DM Encryption**.
   Secure setup asks for a wallet signature before preparing its link; Connect
   only does not grant signing or encryption. The Desktop secure option is
   currently disabled with a **Coming soon** tooltip; Connect only works.
4. Mobile shows a full-width QR. Desktop shows the 6529 logo and **Open in 6529
   Desktop** launch control, rather than a QR. The heading reads **Connect as
   {handle}**, with **with Post Signing & DM Encryption** for secure setup.
5. Copy with the icon inside the link field. The adjacent refresh icon generates
   a new Connect-only code directly. For secure setup, refresh clears the displayed
   link and returns to the wallet-signing state for a new signature.
6. **Back** returns to the app and connection choices. The same row reminds you:
   **Use only on a device you own. This code works once.**

The muted **Download apps** link beside the title opens the Apps page. Copy and
refresh are disabled during preparation; a failed preparation can be retried.
The modal transitions smoothly between screen heights and scrolls on short
screens without clipping the QR, controls or focus rings.

The receiving app confirms the incoming account. Secure links also list
**Signed Posts** and **Encrypted DMs**, with **Accept and enable both** instead
of **Accept connection**. One secure link both signs in and enrolls the app;
registration does not occur merely because a QR was generated. Working receiver
keys/history are preserved. Both connection types open Home after acceptance;
secure setup completes before navigation. The source session remains connected. See
[Encrypted messages setup](../encrypted-messages.md#setup-through-connection-sharing)
for history, backup and capability limits.

No page-copy, social, or current-page Share actions appear in this dialog.

## Common Scenarios

- Use `Copy Link` when you want the URL on the clipboard; system-share failures
  never trigger Copy automatically.
- Use X to open a prefilled composer with the page title on one line and the
  current shareable URL on the next. Farcaster opens a composer containing the
  current page.
- On mobile web or in the native app, select the header Share button to choose
  an installed application from the platform share sheet.
- On desktop web, use `More` to choose an application from the browser or
  operating-system share sheet.
- Switch the QR target to `App` when the recipient should open the route in
  6529 Mobile rather than a browser.

## QR Rendering

- Page-share and connection codes retain their own link payloads.
- Codes scale within their container and keep a complete four-module quiet zone.
- Foreground is pure black and background is opaque pure white.
- The image uses nearest-neighbor rendering, contains the complete QR image,
  and is not cropped, blurred, or made transparent.

## Edge Cases

- The desktop sidebar Share row and account-menu `Connect Device` action are
  hidden in Capacitor/native and mobile-device web contexts; supported mobile
  contexts share directly from the header instead.
- Desktop is hidden as a connection target when already running in Electron.
- Connection links open `Accept Connection Sharing`. Mobile connection links
  are accepted only in 6529 Mobile, and Desktop connection links only in 6529
  Desktop. Opened anywhere else, the page shows a message and a home link
  instead of `Accept connection`. The page removes the link's one-time
  credential from the address bar as soon as it loads, so reloading it does not
  reopen the connection; open the original link or QR code again instead.
- Connection preparation can show sign-in, authentication-upgrade, loading,
  or unavailable states without revealing page-sharing controls. These notice
  states retain the final connection area's footprint. The unframed loading
  message remains visible until the Mobile QR has been generated and decoded,
  then the complete QR and connection-link row appear together. Changes between
  choices, signing and ready screens animate the dialog height, unless reduced
  motion is enabled. Actionable authentication
  and unavailable notices retain their framed treatment.
- In browsers, `More` is omitted in an insecure context, when the Web Share API
  is absent, when the browser rejects the title and URL payload, or when the
  document permissions policy recognizes and blocks system sharing. An
  unrecognized `web-share` policy directive is treated as unknown rather than
  blocked, so browser capability checks remain authoritative without producing
  a warning.
- In the native app, the header Share button checks Capacitor availability and
  reports an error if the platform cannot open its system share sheet.

## Failure and Recovery

- Canceling the system share sheet leaves the current page unchanged and does
  not announce an error.
- If direct mobile sharing is unavailable or rejected, the app shows an error
  toast and leaves the user on the current page. On desktop, the `More` action
  is hidden for the current dialog and the dialog announces that system sharing
  is unavailable. Copy remains a separate desktop action.
- Clipboard errors leave the dialog open so another sharing action can be
  selected.

## Limitations / Notes

- Browser system sharing depends on browser, operating-system,
  security-context, and document permissions-policy support. Native system
  sharing depends on the Capacitor share plugin and operating system.
- A browser may expose the Web Share API but still reject a particular request;
  mobile web reports that failure without falling back to the desktop dialog.

## Related Pages

- [Navigation Index](README.md)
- [Artwork Sharing](../media/nft/feature-artwork-sharing.md)
- [Web Sidebar Navigation](feature-sidebar-navigation.md)
- [Wallet and Account Controls](feature-wallet-account-controls.md)
- [App Header Context](feature-app-header-context.md)
- [6529 Apps Page](feature-6529-apps-page.md)
