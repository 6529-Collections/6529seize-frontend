# Legacy Route Redirects

Parent: [Shared Index](README.md)

## Overview

Legacy non-profile URLs still work as compatibility links.
They redirect to active routes or external assets.

This page covers:

- middleware exact-path redirects (`301`)
- middleware desktop `/my-stream*` compatibility redirects (`301`)
- route-level legacy aliases (`307`)
- `/waves?wave=<id>` normalization to `/waves/<id>` (`307`)

Profile-only legacy aliases are documented in
[Legacy Profile Route Redirects](../profiles/navigation/feature-legacy-profile-route-redirects.md).

## User Journey

1. Request starts at a legacy URL.
2. Middleware exact-path map runs first.
3. Desktop-only `/my-stream*` middleware compatibility runs next.
4. Access control runs (`401 -> /access`, `403 -> /restricted`).
5. Route-level redirects run (including `/waves?wave=<id>` normalization).
6. Canonical destination route loads.

## Redirect Families

| Legacy family | Status | Destination type | Query behavior |
| --- | --- | --- | --- |
| Middleware exact-path map | `301` | fixed target per mapping | source query preserved unless target defines its own query |
| Middleware `/my-stream` + `/my-stream/notifications` (desktop OS only) | `301` | computed route (`/`, `/waves`, `/waves/<id>`, `/messages`, `/messages?wave=<id>`, `/notifications`) | reads only `view`, `wave`, `drop`, `serialNo`; ignores all other keys |
| Route-level legacy aliases | `307` | fixed route/asset target | source query not forwarded |
| `/waves?wave=<id>` | `307` | `/waves/<id>` | keeps all keys except `wave` |

## Middleware Exact-Path Legacy Map (`301`)

Rules:

- Match is case-insensitive.
- `/path` and `/path/` both match.
- Match is exact-path only.
- Source query is preserved unless the target sets its own query
  (for example `/the-memes?szn=2`).
- Full mapping list:
  [Legacy Exact-Path Redirect Map](feature-legacy-route-exact-path-map.md)

## Desktop `/my-stream` Compatibility (`301`)

Applies only to desktop OS user agents and only to:

- `/my-stream`
- `/my-stream/notifications`

Rules:

- Reads only `view`, `wave`, `drop`, `serialNo`.
- Uses the first value when a supported key is repeated.
- Ignores all unsupported query keys.
- `/my-stream/notifications` always redirects to `/notifications` and drops
  source query.
- `drop` removes all trailing `/`.
- `serialNo` removes one trailing `/`.
- `serialNo` is forwarded only when `wave` exists.

Common outcomes:

- `/my-stream/notifications` -> `/notifications`
- `/my-stream?view=messages` -> `/messages`
- `/my-stream?view=messages&wave=<id>` -> `/messages?wave=<id>`
- `/my-stream?view=messages&wave=<id>&drop=<id>&serialNo=<n>` ->
  `/messages` with `wave`, `drop`, and `serialNo`
- `/my-stream?view=waves` -> `/waves`
- `/my-stream?view=waves&wave=<id>` -> `/waves/<id>`
- `/my-stream?wave=<id>` -> `/waves/<id>` (also when `view` is unsupported)
- `/my-stream?wave=<id>&drop=<id>&serialNo=<n>` ->
  `/waves/<id>` with `drop` and `serialNo`
- `/my-stream?drop=<id>` -> `/waves?drop=<id>`
- `/my-stream?view=messages&drop=<id>` -> `/messages` (`drop` ignored without
  `wave`)
- `/my-stream?view=waves&drop=<id>` -> `/waves` (`drop` ignored without `wave`)
- `/my-stream` (or unsupported params without `wave` or `drop`) -> `/`

## Route-Level Legacy Aliases (`307`)

- `/about/tos` -> `/about/terms-of-service`
- `/city/6529-museum-district` -> `/om/6529-museum-district/`
- `/element_category/columns` -> `/`
- `/element_category/sections` -> `/`
- `/feed` -> `/index.xml`
- `/gm-or-die-small-mp4` ->
  `https://videos.files.wordpress.com/Pr49XLee/gm-or-die-small.mp4`
- `/om/partnership-request` -> `/om/join-om/`
- `/slide-page/6529-initiatives` -> `/`
- `/slide-page/homepage-slider` -> `/`

Rules:

- Destination is fixed.
- Source query is not forwarded.

## Legacy `/waves?wave=<id>` Normalization (`307`)

- `/waves?wave=<id>` -> `/waves/<id>`
- `/waves?wave=<id>&serialNo=<n>&divider=<d>` ->
  `/waves/<id>?serialNo=<n>&divider=<d>`

Rules:

- Remove `wave` from destination query.
- Preserve all other query keys.
- If `wave` is repeated, use the first value.
- Preserve repeated values for non-`wave` keys.

## Edge Cases

- `/om/OM` resolves through middleware exact-path map (case-insensitive match to
  `/om/om/`), so it is treated as middleware redirect behavior.
- On non-desktop user agents, `/my-stream*` compatibility redirect does not run.
  These URLs can continue to access control and then fall through to not-found.

## Failure and Recovery

- Middleware redirects run before access control.
- Route-level redirects run only after access control passes.
- Access denied redirects to `/access` (`401`) or `/restricted` (`403`).
- Middleware failures redirect to `/error`.
- If the destination route fails, use
  [Route Error and Not-Found Screens](feature-route-error-and-not-found.md).
- External redirect targets can fail independently; retry from another network
  or browser context.

## Limitations / Notes

- Legacy URLs are compatibility-only and not canonical navigation.
- Redirect coverage can change as legacy entries are added or retired.

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [Legacy Exact-Path Redirect Map](feature-legacy-route-exact-path-map.md)
- [Navigation Index](../navigation/README.md)
- [Legacy Profile Route Redirects](../profiles/navigation/feature-legacy-profile-route-redirects.md)
