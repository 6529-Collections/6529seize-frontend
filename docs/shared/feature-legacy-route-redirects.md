# Legacy Route Redirects

Parent: [Shared Index](README.md)

## Overview

Some historical URLs and retired My Stream routes are kept as compatibility
entry points. Opening one of these URLs immediately sends the browser to the
current destination page or asset, without showing an intermediate
"redirecting" screen.

## Location in the Site

These redirects apply to the following legacy routes:

- `/city/6529-museum-district` -> `/om/6529-museum-district/`
- `/element_category/columns` -> `/`
- `/element_category/sections` -> `/`
- `/feed` -> `/index.xml`
- `/gm-or-die-small-mp4` ->
  `https://videos.files.wordpress.com/Pr49XLee/gm-or-die-small.mp4`
- `/om/OM` -> `/om/`
- `/om/partnership-request` -> `/om/join-om/`
- `/slide-page/6529-initiatives` -> `/`
- `/slide-page/homepage-slider` -> `/`
- `/my-stream/notifications` -> `/notifications` (desktop-class browsers)
- `/my-stream` -> canonical Brain routes (desktop-class browsers):
  - `?view=messages` routes to `/messages` (and keeps `wave`, `drop`, and
    `serialNo` when present)
  - `?view=waves` or `?wave=...` routes to `/waves` or `/waves/{waveId}`
  - `?drop=...` without `wave` routes to `/waves?drop=...`
  - no supported query parameters routes to `/`

## Entry Points

- Opening older bookmarks that still use historical paths.
- Clicking old links shared in posts, chats, or external sites.
- Visiting legacy search-engine results.

## User Journey

1. User requests one of the legacy routes.
2. The app immediately redirects to the mapped destination.
3. The destination route or asset loads as the page the user interacts with.

## Common Scenarios

- A user opens `/feed` and lands on `/index.xml` for the feed file.
- A user opens `/om/OM` and lands on the canonical `/om/` route.
- A user opens `/slide-page/homepage-slider` and lands on the site home page.
- A user opens `/gm-or-die-small-mp4` and is sent directly to the hosted video
  URL.
- A user opens `/my-stream/notifications` and lands on `/notifications` in
  desktop-class browsers.
- A user opens `/my-stream?view=messages&wave=<id>` and lands on
  `/messages?wave=<id>` in desktop-class browsers.

## Edge Cases

- Some redirects point to internal routes while others point to external hosts.
- `/my-stream` compatibility redirects are applied only for desktop-class
  browsers. Other user agents continue normal route resolution for the legacy
  URL.
- `/my-stream` query values are normalized during redirect routing (for example,
  trailing slashes on some params are trimmed).
- If a destination route has its own redirect rules, users may see a redirect
  chain before final content loads.
- Query strings and hash fragments from legacy URLs are not guaranteed to be
  carried into the destination URL.

## Failure and Recovery

- If the destination is temporarily unavailable, users see the destination
  route's error page (or a browser/network error for external targets).
- If `/my-stream` is opened from a non-desktop browser and no compatibility
  redirect is applied, users can open canonical routes directly (`/`,
  `/waves`, `/messages`, `/notifications`).
- If the external video host is blocked or unavailable, users can retry later
  or open the destination URL in a different network/browser context.
- If `/index.xml` is unavailable, feed readers or direct visitors can retry
  later and verify the canonical feed URL.

## Limitations / Notes

- Legacy routes are compatibility entry points, not canonical navigation paths.
- `/my-stream` compatibility redirects are limited to desktop-class browsers.
- No manual fallback link or inline redirect message is shown on these routes.

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [Navigation Index](../navigation/README.md)
