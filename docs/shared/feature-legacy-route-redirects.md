# Legacy Route Redirects

Parent: [Shared Index](README.md)

## Overview

Legacy URLs still resolve as compatibility entry points. They redirect to active
routes or assets.

This page covers four redirect families:

- Middleware exact-path legacy map (`301`)
- Middleware desktop `/my-stream` compatibility (`301`)
- Route-level legacy aliases (`307`)
- Legacy `/waves?wave=<id>` normalization (`307`)

Profile-only legacy aliases are documented in
[Legacy Profile Route Redirects](../profiles/navigation/feature-legacy-profile-route-redirects.md).

## Redirect Families

| Legacy entry | Status | Destination type | Query behavior |
| --- | --- | --- | --- |
| Middleware exact-path map | `301` | fixed target per mapping | preserved unless target has its own query |
| Middleware `/my-stream` + `/my-stream/notifications` (desktop OS only) | `301` | computed route (`/`, `/waves`, `/waves/<id>`, `/messages`, `/messages?wave=<id>`, `/notifications`) | forwards only supported keys |
| Route-level legacy aliases | `307` | fixed target route/asset | source query not forwarded |
| `/waves?wave=<id>` | `307` | `/waves/<id>` | keeps all keys except `wave` |

## Execution Order

1. Middleware exact-path map redirect.
2. Middleware `/my-stream` compatibility redirect.
3. Access control check (`401 -> /access`, `403 -> /restricted`).
4. Route-level redirects and `/waves?wave=<id>` normalization.

Middleware redirects run before access control. Route-level redirects run after
access control.

## Route-Level Legacy Aliases (`307`)

- `/about/tos` -> `/about/terms-of-service`
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

Rules:

- Destination is fixed.
- Source query is not forwarded.

## Middleware Exact-Path Legacy Map (`301`)

Rules:

- Match is case-insensitive.
- `/path` and `/path/` both match.
- Match is exact-path only.
- Source query is preserved unless target defines its own query
  (example: `/the-memes?szn=2`).

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

## Desktop `/my-stream` Compatibility (`301`)

Applies only to desktop OS user agents and only to `/my-stream` or
`/my-stream/notifications` (with or without trailing slash).

Common outcomes:

- `/my-stream/notifications` -> `/notifications`
- `/my-stream?view=messages` -> `/messages`
- `/my-stream?view=messages&wave=<id>` -> `/messages?wave=<id>`
- `/my-stream?view=messages&wave=<id>&drop=<id>&serialNo=<n>` ->
  `/messages?wave=<id>&drop=<id>&serialNo=<n>`
- `/my-stream?view=waves` -> `/waves`
- `/my-stream?view=waves&wave=<id>` -> `/waves/<id>`
- `/my-stream?wave=<id>` -> `/waves/<id>` (also when `view` is unsupported)
- `/my-stream?wave=<id>&drop=<id>&serialNo=<n>` ->
  `/waves/<id>?drop=<id>&serialNo=<n>`
- `/my-stream?drop=<id>` -> `/waves?drop=<id>`
- `/my-stream?view=messages&drop=<id>` -> `/messages` (`drop` ignored without
  `wave`)
- `/my-stream?view=waves&drop=<id>` -> `/waves` (`drop` ignored without `wave`)
- `/my-stream` (or unsupported params without `wave` or `drop`) -> `/`

Normalization:

- `drop`: remove all trailing `/`.
- `serialNo`: remove one trailing `/`.
- `serialNo` is only forwarded when `wave` exists.
- `/my-stream/notifications` does not forward source query.

## Legacy `/waves?wave=<id>` Normalization (`307`)

- `/waves?wave=<id>` -> `/waves/<id>`
- `/waves?wave=<id>&serialNo=<n>&divider=<d>` ->
  `/waves/<id>?serialNo=<n>&divider=<d>`

Rules:

- Remove `wave` from destination query.
- Preserve other query keys.
- If multiple `wave` values are present, use the first value.

## Failure and Recovery

- Middleware redirects run before access control.
- Route-level redirects run only after access control passes.
- Access denied redirects to `/access` (`401`) or `/restricted` (`403`).
- Middleware failures redirect to `/error`.
- If a destination route fails, use
  [Route Error and Not-Found Screens](feature-route-error-and-not-found.md).
- On non-desktop user agents, `/my-stream` compatibility does not run. Use
  canonical routes: `/`, `/waves`, `/messages`, `/notifications`.
- External redirect targets can fail independently; retry from another network
  or browser context.

## Notes

- Legacy URLs are compatibility-only, not canonical navigation.
- Redirect coverage can change as legacy entries are added or retired.

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [Navigation Index](../navigation/README.md)
- [Legacy Profile Route Redirects](../profiles/navigation/feature-legacy-profile-route-redirects.md)
