# 6529 Apps Page

Parent: [Navigation Index](README.md)

## Overview

The `6529 Apps` page presents official mobile and desktop downloads in one
place. Mobile and desktop options remain visible together rather than being
hidden behind tabs.

## Location in the Site

- Route: `/about/6529-apps`
- Sidebar and app menu: `About -> About 6529 -> 6529 Apps`
- About contents menu: `About 6529 -> 6529 Apps`
- Site-wide page search: `6529 Apps`, `6529 Mobile`, `6529 Desktop`, `apps`,
  `mobile`, and `desktop` all find the page.
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
3. Use `6529 Desktop` to choose Windows, macOS, or Linux.
4. The selected store or versioned desktop download opens in a new browser tab.

## Common Scenarios

- Install 6529 Mobile on an iPhone, iPad, or Android device.
- Download the latest 6529 Desktop release for Windows, macOS, or Linux.
- Find all official app options from one route without opening the Share modal.
- Search with a broad term such as `apps`, `desktop`, or `mobile`.

## Edge Cases

- Desktop releases are loaded independently, so available platforms can still
  appear when one platform's release manifest is temporarily unavailable.
- The page shows a loading state while desktop release versions are resolved.
- Mobile store actions remain available if desktop release data cannot load.

## Failure and Recovery

- If desktop downloads are unavailable, select `Try again` without leaving the
  page.
- If one expected desktop platform is missing, refresh or retry after its
  release manifest is restored.
- If an external store does not open, verify browser pop-up or external-link
  settings and select the store action again.

## Limitations / Notes

- Desktop links point to the latest version advertised by each platform's
  release manifest.
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
- [Share Modal](feature-share-modal.md)
- [Mobile App Landing Page](feature-mobile-app-landing.md)
