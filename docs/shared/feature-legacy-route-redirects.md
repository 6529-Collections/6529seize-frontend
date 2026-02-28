# Legacy Route Redirects

Parent: [Shared Index](README.md)

## Overview

Legacy URLs still work as compatibility entry points. Opening one redirects to
the current route or asset.

Redirect systems covered here:

- Middleware exact-path legacy map (`301`)
- Middleware `/my-stream` compatibility redirects (`301`, desktop OS only)
- Redirect-only route pages (`307`)
- Legacy `/waves?wave={id}` normalization (`307`)

## Scope Boundaries

- Profile legacy aliases are documented in:
  [Legacy Profile Route Redirects](../profiles/navigation/feature-legacy-profile-route-redirects.md)

## Location in the Site

- Middleware legacy routes:
  - exact-path map in `proxy.ts`
  - `/my-stream` and `/my-stream/notifications` compatibility in `proxy.ts`
- Route alias pages (`redirect()`):
  - `/city/6529-museum-district`
  - `/element_category/columns`
  - `/element_category/sections`
  - `/feed`
  - `/gm-or-die-small-mp4`
  - `/om/OM`
  - `/om/partnership-request`
  - `/slide-page/6529-initiatives`
  - `/slide-page/homepage-slider`
- Query-based legacy normalization (`redirect()`):
  - `/waves?wave={id}` in `app/waves/page.tsx`

## Redirect Execution Order

1. Middleware exact-path redirect map (`301`).
2. Middleware `/my-stream` compatibility redirect (`301`, desktop OS only).
3. Access-control check (`307` to `/access` on `401`, `/restricted` on `403`).
4. Route-level `redirect()` pages and `/waves?wave={id}` normalization.

This order matters: middleware redirects run before access control, while
route-level redirects run after access control.

## Route-Level Redirect Pages (`307`)

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

## Middleware Exact-Path Legacy Map (`301`)

Rules:

- Matching is case-insensitive.
- Trailing slash variants still match (for example `/abc1` and `/abc1/`).
- Mapping is exact-path only; unknown paths are not redirected.
- Existing query parameters are preserved unless the redirect target defines its
  own query string (for example `/the-memes?szn=2`).

Mappings:

### General

- `/6529-dubai/` -> `/`
- `/6529-puerto-rico/` -> `/`
- `/abc1/` -> `/`
- `/abc2/` -> `/`
- `/about/contact/` -> `/about/contact-us`
- `/about/jobs/` -> `/about/contact-us`
- `/about/news/` -> `/`
- `/bridge/` -> `/waves`
- `/education/something-else/` -> `/`
- `/privacy-policy/` -> `/about/privacy-policy`
- `/studio/` -> `/`
- `/om/bug/report/` -> `/about/contact-us`
- `/om/om/` -> `/om`

### Collections

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

### Standalone Allowlist

- `/the-hamily-wagmi-allowlist/` -> `/the-memes/74`

## Desktop-Only `/my-stream` Compatibility (`301`)

Compatibility redirects apply only for desktop OS user agents and only for:

- `/my-stream`
- `/my-stream/notifications`

Outcomes:

- `/my-stream/notifications` -> `/notifications`
- `/my-stream?view=messages` -> `/messages`
- `/my-stream?view=messages&wave=<id>` -> `/messages?wave=<id>`
- `/my-stream?view=messages&wave=<id>&drop=<id>&serialNo=<n>` ->
  `/messages` with `wave`, `drop`, and `serialNo`
- `/my-stream?view=waves` -> `/waves`
- `/my-stream?view=waves&wave=<id>` -> `/waves/<id>`
- `/my-stream?wave=<id>` -> `/waves/<id>` (also true when `view` is unsupported)
- `/my-stream?wave=<id>&drop=<id>&serialNo=<n>` ->
  `/waves/<id>?drop=<id>&serialNo=<n>`
- `/my-stream?drop=<id>` -> `/waves?drop=<id>`
- `/my-stream?view=messages&drop=<id>` -> `/messages` (drop ignored without
  `wave`)
- `/my-stream?view=waves&drop=<id>` -> `/waves` (drop ignored without `wave`)
- `/my-stream` (or unsupported params without `wave` or `drop`) -> `/`

Query normalization:

- `drop` removes all trailing `/`.
- `serialNo` removes one trailing `/`.
- `serialNo` is only forwarded when `wave` is present.
- `/my-stream/notifications` does not forward source query parameters.

## Legacy `/waves?wave={id}` Normalization (`307`)

`/waves` redirects old query-based wave URLs to canonical wave paths.

- `/waves?wave=<id>` -> `/waves/<id>`
- `/waves?wave=<id>&serialNo=<n>&divider=<d>` ->
  `/waves/<id>?serialNo=<n>&divider=<d>`

Rules:

- The `wave` query key is removed from the destination.
- Other query keys are preserved.
- If `wave` has multiple values, only the first value is used.

## Failure and Recovery

- Middleware map and `/my-stream` redirects run before access-control checks.
- Route-level redirect pages and `/waves?wave={id}` normalization run only after
  access-control checks pass.
- If access is blocked at either source or destination route, user is sent to
  `/access` or `/restricted`.
- If destination route data fails, user sees destination route recovery UI.
  - [Route Error and Not-Found Screens](feature-route-error-and-not-found.md)
- If external target is unavailable (for example hosted video), retry later or
  open in another network/browser context.
- On non-desktop user agents, `/my-stream` compatibility redirects do not run.
  Open canonical routes directly: `/`, `/waves`, `/messages`, and
  `/notifications`.

## Limits and Notes

- Legacy URLs are compatibility-only, not canonical navigation.
- Query carry-over is redirect-system specific:
  - Middleware exact-path map usually preserves source query values.
  - `/my-stream` forwards only supported keys (`wave`, `drop`, `serialNo`).
  - `/waves?wave={id}` preserves all keys except `wave`.
  - Route-level redirect pages send users to fixed destinations.
- Redirect coverage can change as legacy routes are added or retired.

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [Navigation Index](../navigation/README.md)
- [Legacy Profile Route Redirects](../profiles/navigation/feature-legacy-profile-route-redirects.md)
