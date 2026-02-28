# Legacy Route Redirects

Parent: [Shared Index](README.md)

## Overview

Legacy and retired URLs are kept as compatibility entry points. Opening one of
these routes sends the browser directly to the current route or asset.

## Location in the Site

- Middleware redirect map (`proxy.ts`) for legacy aliases and old campaign
  routes.
- Route-level redirect pages (`app/.../page.tsx`) for legacy published URLs.
- Desktop-only compatibility redirects for `/my-stream*`.

## Route-Level Redirect Pages

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

## Middleware Redirect Map

- `/6529-dubai/` -> `/`
- `/6529-puerto-rico/` -> `/`
- `/abc1/` -> `/`
- `/abc2/` -> `/`
- `/about/contact/` -> `/about/contact-us`
- `/about/jobs/` -> `/about/contact-us`
- `/about/news/` -> `/`
- `/bridge/` -> Waves route home
- `/collections/` -> `/the-memes`
- `/collections/6529gradient/` -> `/6529-gradient`
- `/collections/brand/` -> `/the-memes`
- `/collections/collections-form/` -> `/about/apply`
- `/collections/memelab/` -> `/meme-lab`
- `/collections/memelab/pepiano-allowlist/` -> `/meme-lab/8`
- `/collections/memelab/the-great-restoration/` -> `/meme-lab/12`
- `/collections/memelab/the-nftimes-issue-1-allowlist/` -> `/meme-lab/7`
- `/collections/memelab/wen-summer-allowlist/` -> `/meme-lab/10`
- `/collections/the-memes/` -> `/the-memes`
- `/collections/the-memes/evolution-allowlist/` -> `/the-memes/73`
- `/collections/the-memes/faces-of-freedom-allowlist/` -> `/the-memes/72`
- `/collections/the-memes/freedom-fighter-allowlist/` -> `/the-memes/77`
- `/collections/the-memes/meme4-season2-card6/gm-or-die-allowlist/` ->
  `/the-memes/71`
- `/collections/the-memes/metaverse-starter-pack-allowlist/` -> `/the-memes/78`
- `/collections/the-memes/no-meme-no-life-allowlist/` -> `/the-memes/75`
- `/collections/the-memes/staying-alive-allowlist/` -> `/the-memes/76`
- `/collections/the-memes/the-memes-season2/` -> `/the-memes?szn=2`
- `/education/something-else/` -> `/`
- `/om/bug/report/` -> `/about/contact-us`
- `/om/om/` -> `/om`
- `/privacy-policy/` -> `/about/privacy-policy`
- `/studio/` -> `/`
- `/the-hamily-wagmi-allowlist/` -> `/the-memes/74`

## Desktop-Only `/my-stream` Compatibility

`/my-stream` redirects run only for desktop-class user agents.

- `/my-stream/notifications` -> `/notifications`
- `/my-stream?view=messages` -> Messages route home
- `/my-stream?view=messages&wave=<id>` -> `/messages?wave=<id>`
- `/my-stream?view=waves&wave=<id>` or `/my-stream?wave=<id>` -> `/waves/<id>`
- `/my-stream?drop=<id>` (without `wave`) -> `/waves?drop=<id>`
- No supported query params -> `/`
- `drop` and `serialNo` trailing slashes are normalized before redirecting.

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
- A user opens `/collections/the-memes/freedom-fighter-allowlist/` and lands
  on `/the-memes/77`.

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
  route's shared error surface (or a browser/network error for external
  targets).
  - [Route Error and Not-Found Screens](feature-route-error-and-not-found.md)
- If `/my-stream` is opened from a non-desktop browser and no compatibility
  redirect is applied, users can open canonical routes directly (`/`,
  Waves route home, Messages route home, `/notifications`).
- If the external video host is blocked or unavailable, users can retry later
  or open the destination URL in a different network/browser context.
- If `/index.xml` is unavailable, feed readers or direct visitors can retry
  later and verify the canonical feed URL.

## Limitations / Notes

- Legacy routes are compatibility entry points, not canonical navigation paths.
- `/my-stream` compatibility redirects are limited to desktop-class browsers.
- No inline "redirecting" message is shown on these routes.
- Redirect coverage can change as retired URLs are added or removed.

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [Navigation Index](../navigation/README.md)
