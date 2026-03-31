# Share Modal

## Overview

The desktop-web share modal lets users reopen the current route in other 6529
clients, copy the active browser URL, and share an authenticated connection
into supported 6529 apps. The same dialog also surfaces mobile-app and desktop-
app download targets.

## Location in the Site

- Disconnected desktop-web sidebar lower `Share` row.
- Connected desktop-web account dropdown `Share` action.
- Desktop-web routes that render those sidebar/account entry points.
- Modal overlay above the current route.

## Entry Points

- Disconnected desktop web: select `Share` from the lower sidebar utility rows.
- Connected desktop web: open the sidebar account dropdown, then select
  `Share`.
- Requires desktop web; Capacitor/native and mobile-device web do not render
  the entry.

## User Journey

1. Open `Share` from a supported desktop-web surface.
2. The dialog opens over the current route, background scroll locks, and focus
   moves into the dialog; on close, focus returns to the previously active
   element.
3. Review the `Share Type` row:
   - authenticated session with shareable auth context: `Connection`,
     `Current URL`, `6529 Apps`
   - otherwise: `Current URL`, `6529 Apps`
4. Default selection is state-driven:
   - authenticated sessions open on `Connection` -> `6529 Mobile`
   - unauthenticated sessions open on `Current URL` -> `6529 Mobile`
5. Use the second control row for the active mode:
   - `Connection` shows `Open Link In`
   - `Current URL` shows `Open URL In`
   - `6529 Apps` shows `Select Platform`
6. In `Current URL`, choose the destination format:
   - `6529 Mobile`: QR code plus mobile-app deep link for the current route
   - `Browser`: QR code plus the absolute web URL for the current route
   - `6529 Desktop`: desktop deep link/open target when not already running
     inside Electron
7. In `Connection`, share the active authenticated session into supported 6529
   clients:
   - `6529 Mobile`: QR code plus share-connection deep link
   - `6529 Desktop`: desktop accept-connection deep link when not in Electron
8. In `6529 Apps`, choose install/open targets:
   - `6529 Mobile`: iOS and Android app targets
   - `6529 Desktop`: Windows, macOS, and Linux download targets when not in
     Electron
9. Use the copy action next to the visible URL to copy the currently selected
   target.
10. Close the dialog by pressing `Escape` or activating the backdrop outside the
   panel.

## Common Scenarios

- Copy a browser URL for the current page.
- Open the current route in 6529 Mobile from a desktop QR code.
- Share an authenticated connection from desktop web into 6529 Mobile or 6529
  Desktop.
- Use the dialog as an install/open surface for 6529 apps.
- Share routes with query state preserved; generated targets keep the current
  pathname plus search params.

## Edge Cases

- Share entry is hidden entirely in Capacitor/native and mobile-device web.
- `Connection` appears only when refresh-token and wallet state are available
  for the current authenticated session.
- `6529 Desktop` subtabs are hidden when the modal is rendered inside Electron.
- `Browser` exists only under `Current URL`; `Connection` and `6529 Apps` do
  not expose a browser target.
- QR panels can show a loading placeholder while codes or desktop version
  manifests are generated/fetched.
- Copy feedback is transient (`Copied!`) and applies only to the currently
  visible URL row.
- Clipboard-copy failure is silent in the UI; errors log to console and the
  dialog stays open.
- The dialog has no in-panel close button; dismissal is backdrop or `Escape`.

## Failure and Recovery

- If `Share` is missing, verify you are on desktop web and check whether the
  expected entry point is the disconnected sidebar row or the connected account
  menu.
- If `Connection` is missing or empty, reconnect so refresh-token and wallet
  state are available, then reopen the dialog.
- If a QR panel stays blank, switch tabs or reopen the dialog; the visible URL
  row still shows the target being shared.
- If 6529 Desktop download entries do not load, retry from `6529 Apps`, or use
  the mobile/browser targets as fallback.
- If keyboard focus feels stuck, press `Escape` to close the dialog and reopen
  it from the original entry point.

## Limitations / Notes

- The modal is desktop-web only and is not exposed inside native/app web
  runtimes.
- Generated current-route targets reuse the active pathname and query string;
  non-URL UI state is not serialized beyond what is already in the route.
- Connection sharing depends on existing auth/session state and is not
  available as a disconnected onboarding flow.
- Desktop download metadata is fetched from release manifests at runtime.

## Related Pages

- [Navigation Index](README.md)
- [Web Sidebar Navigation](feature-sidebar-navigation.md)
- [Wallet and Account Controls](feature-wallet-account-controls.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
- [Mobile App Landing Page](feature-mobile-app-landing.md)
