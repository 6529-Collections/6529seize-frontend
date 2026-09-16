# Open in 6529 Mobile

## Overview

On supported pages in the small-screen iOS and Android website, a compact
`6529 Mobile` banner appears above the site header. It offers `Open`,
`Get the app`, and a dismiss button. You can keep reading and using the page
without choosing an action.

The banner is hidden inside 6529 Mobile and 6529 Desktop, in desktop browsers,
and on app handoff, access, authentication, and app-wallet routes.

## Open the Current Page

1. Browse to a wave, drop, profile, or another supported page.
2. Tap `Open` in the banner.
3. Accept the browser's app-opening prompt if one appears.

The app link preserves the current page, query parameters, and fragment,
including a selected drop or profile tab. The destination is captured when you
tap, so it follows navigation within the website. The app's normal sign-in,
access permissions, and regional restrictions still apply. Opening the app does
not transfer the browser's login session.

## Dismiss the Banner

Tap the dismiss button to hide the banner for seven days in the same browser.
The preference survives page navigation, reloads, and return visits, and also
applies to other tabs on the same website. After seven days it can appear again.
Clearing website data resets the preference. When browser storage is blocked,
dismissal lasts for the current browsing session; a full reload can show it again.

## Get the App

`Get the app` opens the App Store on iOS or Google Play on Android.
After installing, return to the original browser page and tap `Open` to open
that destination. Installation does not automatically carry the destination
through the store into the app.

## Browser Handoff Page

`/open-mobile?path=<url-encoded-route>` is a separate browser handoff and fallback
page. Successful banner launches go directly to the app.

The handoff page offers:

- `Open app`: attempt to open the preserved page in 6529 Mobile.
- `Download`: the appropriate store action, or both stores on an unclassified device.
- `Continue in browser`: return to the preserved page on the current website.

The handoff page does not launch the app automatically. It never shows an
indefinite `Opening` state. When the destination is missing, malformed, external,
or an unsupported handoff route, it explains that the home page will be used.
Opening this page inside 6529 Mobile and choosing `Open app` navigates internally.

## If the App Does Not Open

- Android Chrome can send you to `/open-mobile` when its app-opening intent
  does not launch. The fallback retains your destination.
- On iOS and other browsers, a custom app link may show a browser error or
  leave you on the website if the app is absent or the launch is blocked.
- The banner does not add a status message after an attempt. `Get the app`
  and dismiss remain available if you stay in the browser.
- After an attempt on the handoff page, neutral help reads: `App didn’t open?
Get the app or continue browsing.` This is not an installation or success check.
- Use the store action, retry `Open app` on the handoff page, or continue browsing.
- Retrying from the handoff page uses a direct app link to avoid a fallback loop.
- There is no timed automatic store redirect.

## Related Pages

- [Navigation Index](README.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
- [Internal Link Navigation](feature-internal-link-navigation.md)
- [Docs Home](../README.md)
