# 6529 Apps Page

Parent: [Navigation Index](README.md)

## Overview

The `6529 Apps` page presents official mobile and desktop downloads in one
place. **6529 Desktop** links to the test release at `/desktop`, and
**6529 Desktop Classic** lists Classic installers. The page also links to
`6529 Validator` and `6529 AI`. The whole Validator section links to `/validator`, with the
description `Read more about 6529 validator`; the whole 6529 AI section links
to `/ai`, with the description `Run open-weights AI models on your own
computer, and chat with them in your browser`. Mobile and desktop options remain visible together rather than
being hidden behind tabs.

Ask `@help6529` "is there a 6529 app?" to find 6529 Mobile, the 6529 Desktop
test release, 6529 Desktop Classic, and the official Apps page.

## Location in the Site

- Route: `/about/6529-apps`
- Sidebar and app menu: `About -> About 6529 -> 6529 Apps`
- About contents menu: `About 6529 -> 6529 Apps`
- Site-wide page search: `6529 Apps`, `6529 Mobile`, and
  `6529 Desktop Classic` find the Apps page. `6529 Desktop`, `desktop`, and
  `/desktop` find the test-release download page directly.
- Site footer: `6529 Apps` appears between `License` and `API` in the second
  text-link row.

## Entry Points

- Open `6529 Apps` from the `About 6529` group in navigation.
- Search for an app or platform term in the header search modal.
- Open `6529 Apps` from the site footer.
- Open `/about/6529-apps` directly.

## User Journey

1. Open the `6529 Apps` page.
2. Use `6529 Mobile` to choose the iOS App Store or Android Google Play.
3. Select **6529 Desktop** for the Windows x64 or Apple silicon Mac test
   release, install guide, and release notes.
4. Select **6529 Desktop Classic** to expand its downloads. Windows, macOS or
   Linux opens automatically when the browser detects that OS. On phones,
   tablets and unrecognized devices, choose an OS from the collapsed rows.
   Select the Classic header again to close the downloads.
5. Choose the Classic version appropriate for your OS, then the architecture or package
   format. `Download` opens the installer directly. Each installer shows
   `Arweave mirror · Coming soon` until its mirror is published, then shows a
   clickable `Arweave mirror` link.
6. Select anywhere in the `6529 Validator` section to read more and download
   the validator from `/validator`. Signed-in members with a profile also get
   a direct `Validator` row in the primary navigation and can search `Pages`
   for `validator`, `6529 Validator`, or `/validator`. Newcomers see `Join 6529`
   in navigation and search instead.
7. Select anywhere in the `6529 AI` section to download 6529 AI from `/ai`.
   Everyone also gets a `6529 AI` row in the primary navigation, after the
   `Join 6529` / `Validator` slot, and can search `Pages` for `6529 AI` or
   `AI`.

## Common Scenarios

- Install 6529 Mobile on an iPhone, iPad, or Android device.
- Download the latest 6529 Desktop Classic release for Windows, macOS, or Linux.
- Find all official app options from one route without opening the Share modal.
- Search with a broad term such as `apps`, `desktop`, or `mobile`.

## Mobile Compatibility

6529 Mobile requires iOS 16.4 or later to load the current website. Signed Posts
additionally need iOS 17 or later; iOS 16.4–16.x can use Encrypted DMs without
post signing. Android signing depends on sufficiently recent WebView support.
Use a signed iOS build so cryptographic keys can persist across app restarts.

An existing installation on an older iOS engine sees **6529 Mobile needs iOS
16.4 or later** in production, or **6529 Staging needs iOS 16.4 or later** on
staging. It directs the user to **Settings > General > Software Update**, then
to reopen the named app. Other engines unable to run the site get **6529 needs
a newer browser**. These are compatibility notices in place of the app, not
claims that every device without Signed Posts is unsupported. Modern browsers
keep both notice variants hidden.

## Edge Cases

- The shared About contents button stays disabled until the page is interactive.
  Clicks while it is disabled are not queued; click again once it is enabled.
- Desktop releases are loaded independently, so available platforms can still
  appear when one platform's release manifest is temporarily unavailable.
- macOS has separate current and macOS 12 download feeds. A failed current feed
  does not hide Monterey recovery downloads, and a failed legacy feed does not
  hide current downloads. Partial failures include `Try again`.
- The page shows a loading state while desktop release versions are resolved.
- Mobile store actions remain available if desktop release data cannot load.

## Failure and Recovery

- If desktop downloads are unavailable, select `Try again` without leaving the
  page.
- If one expected desktop platform is missing, refresh or retry after its
  release manifest is restored.
- If an update stops the app opening on macOS 12 Monterey, use its separate
  last-compatible release, choose Apple silicon or Intel, and reinstall the
  downloaded app. Keep existing application data; do not delete the profile or
  database as part of recovery.
- If an external store does not open, verify browser pop-up or external-link
  settings and select the store action again.

## Limitations / Notes

- Desktop links point to the latest version advertised by each platform's
  release manifest.
- Current Mac releases require macOS 13 or later. The macOS 12 feed currently
  advertises 0.3.15. Both version numbers and installer URLs come from feeds,
  rather than frontend release constants; feed updates need no frontend deploy.
- Windows offers x64 and ARM64 EXE installers. Linux offers x64 AppImage,
  Debian/Ubuntu DEB and Fedora/Red Hat RPM packages. Build/updater ZIP archives
  are not installation choices on this page.
- The mobile and desktop sections span the page width. Accordion headers show
  only the operating system; version and compatibility appear after expanding.
  Compact download rows show architectures for Windows/macOS and package names
  for Linux, with a secondary mirror link or status. macOS 12 compatibility is
  explained once below its version, without a duplicate badge.
- Accordions use a short height/fade and chevron transition in supporting
  browsers. Reduced-motion preferences disable it; older browsers retain the
  native disclosure behavior.
- Download and store destinations are external and can have their own regional
  or device restrictions.
- The site footer opens this page in the same tab; it does not link directly to
  platform-specific downloads.
- The Share modal handles route and connection sharing only; app installation
  belongs on this page.

## Related Pages

- [Navigation Index](README.md)
- [Web Sidebar Navigation](feature-sidebar-navigation.md)
- [Header Search Modal](feature-header-search-modal.md)
- [Page Sharing and Device Connection](feature-share-modal.md)
- [Mobile App Landing Page](feature-mobile-app-landing.md)
- [Get started with 6529 Desktop](../desktop/flow-getting-started.md)
