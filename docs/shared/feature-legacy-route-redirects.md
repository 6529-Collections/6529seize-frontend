# Legacy Route Redirects

Parent: [Shared Index](README.md)

## Overview

Legacy URLs stay active as compatibility entry points. Opening one redirects to
the current route or asset.

This page covers four redirect systems:

- Middleware legacy map in `proxy.ts` (`301`).
- Middleware `/my-stream` compatibility redirects (`301`, desktop OS only).
- Redirect-only route pages in `app/.../page.tsx` (Next.js `redirect()`).
- Legacy `/waves?wave={id}` normalization in `app/waves/page.tsx`.

## Scope Boundaries

- Profile legacy aliases are documented in:
  [Legacy Profile Route Redirects](../profiles/navigation/feature-legacy-profile-route-redirects.md)

## Location in the Site

- Middleware source:
  - `proxy.ts`
    - `handleRedirects` for exact legacy-path mappings.
    - `resolveMyStreamRedirect` for `/my-stream` compatibility.
- Route alias pages:
  - `/city/6529-museum-district`
  - `/element_category/columns`
  - `/element_category/sections`
  - `/feed`
  - `/gm-or-die-small-mp4`
  - `/om/OM`
  - `/om/partnership-request`
  - `/slide-page/6529-initiatives`
  - `/slide-page/homepage-slider`
- Query-based legacy normalization:
  - `/waves?wave={id}`

## Entry Points

- Open an old bookmark.
- Open an old shared link.
- Open a legacy URL from search results.

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

## Middleware Exact-Path Redirect Map (`301`)

Rules:

- Matching is case-insensitive.
- Trailing slash variants still match (for example `/abc1` and `/abc1/`).
- Mapping is exact-path only; unknown paths are not redirected.

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
- `/my-stream?wave=<id>` -> `/waves/<id>`
- `/my-stream?wave=<id>&drop=<id>&serialNo=<n>` ->
  `/waves/<id>?drop=<id>&serialNo=<n>`
- `/my-stream?drop=<id>` -> `/waves?drop=<id>`
- `/my-stream` (or unsupported params without `wave` or `drop`) -> `/`

Query normalization:

- `drop` removes all trailing `/`.
- `serialNo` removes one trailing `/`.
- `serialNo` is only forwarded when `wave` is present.

## Legacy `/waves?wave={id}` Normalization

`/waves` redirects old query-based wave URLs to canonical wave paths.

- `/waves?wave=<id>` -> `/waves/<id>`
- `/waves?wave=<id>&serialNo=<n>&divider=<d>` ->
  `/waves/<id>?serialNo=<n>&divider=<d>`

Rules:

- The `wave` query key is removed from the destination.
- Other query keys are preserved.
- If `wave` has multiple values, only the first value is used.

## User Journey

1. Open a legacy URL from a bookmark, shared link, or old search result.
2. Browser receives redirect response and moves to the canonical destination.
3. User interacts only with the destination route or asset.

## Failure and Recovery

- Middleware map and `/my-stream` redirects run before access-control checks.
  If destination access is blocked, user is then sent to `/access` or
  `/restricted`.
- If destination route data fails, user sees destination route recovery UI.
  - [Route Error and Not-Found Screens](feature-route-error-and-not-found.md)
- If external target is unavailable (for example hosted video), retry later or
  open in another network/browser context.
- On non-desktop user agents, `/my-stream` compatibility redirects do not run.
  Open canonical routes directly: `/`, `/waves`, `/messages`, and
  `/notifications`.

## Limitations / Notes

- Legacy URLs are compatibility-only, not canonical navigation.
- Query/hash values from source URLs are not guaranteed to carry into the
  destination unless the redirect path rebuilds them.
- Redirect coverage can change as legacy routes are added or retired.

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [Navigation Index](../navigation/README.md)
- [Legacy Profile Route Redirects](../profiles/navigation/feature-legacy-profile-route-redirects.md)
