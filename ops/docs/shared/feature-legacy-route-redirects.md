# Legacy Route Redirects

Parent: [Shared Index](README.md)

## Overview

Legacy non-profile URLs still work as compatibility links.
They redirect to active routes or external assets.

This page covers:

- middleware exact-path redirects (`301`)
- middleware `404` not-found page for wave links whose id is not a wave id
- middleware desktop `/my-stream*` compatibility redirects (`301`)
- route-level legacy aliases (`307`)
- `/waves?wave=<id>` normalization to `/waves/<id>` (`307`)

Profile-only legacy aliases are documented in
[Legacy Profile Route Redirects](../profiles/navigation/feature-legacy-profile-route-redirects.md).

## User Journey

1. Request starts at a legacy URL.
2. Middleware exact-path map runs first.
3. Wave links whose id is not a wave id get the not-found page with a `404`
   status ([Malformed Wave Ids](#malformed-wave-ids-404)).
4. Desktop-only `/my-stream*` middleware compatibility runs next.
5. On staging deployments only, access control runs (`401 -> /access`,
   `403 -> /restricted`). Production and local development skip it.
6. Route-level redirects run (including `/waves?wave=<id>` normalization).
7. Canonical destination route loads.

## Redirect Families

| Legacy family | Status | Destination type | Query behavior |
| --- | --- | --- | --- |
| Middleware exact-path map | `301` | fixed target per mapping | source query preserved unless target defines its own query |
| Middleware `/my-stream` + `/my-stream/notifications` (desktop OS only) | `301` | computed route (`/`, `/waves`, `/waves/<id>`, `/messages`, `/messages/<id>`, `/notifications`) | reads only `view`, `wave`, `drop`, `serialNo`; ignores all other keys |
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
- `/my-stream?view=messages&wave=<id>` -> `/messages/<id>`
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

## Malformed Wave Ids (`404`)

A wave id is a UUID (for example `5f207393-5418-4a75-8738-e40edb44a94d`, upper
or lower case). When a wave link names an id that is not UUID-shaped, no wave
can have that id, so middleware answers before access control with the
standard not-found page (`404 | PAGE NOT FOUND`) and a real `404` status. The
address bar keeps the original URL:

- `/waves/<id>` and `/messages/<id>`
- `/waves/<id>/competitions` and `/waves/<id>/competitions/<competition>`
- the legacy `/waves?wave=<id>` and `/messages?wave=<id>` links

Rules:

- `/waves/create` and `/messages/create` are the create pages and are never
  answered this way.
- `/waves` and `/messages` without a `wave` value, or with an empty one, load
  normally. A repeated `wave` uses its first value.
- Only the wave id is checked. `drop`, `serialNo`, `divider` and the
  competition segment are not, and neither is `/my-stream` (its redirect target
  is checked instead).
- A UUID-shaped id is never answered here. Waves, direct messages and
  competitions that do not exist, or that the signed-in account cannot see,
  still open the app shell and resolve on the page.

## Edge Cases

- `/om/OM` resolves through middleware exact-path map (case-insensitive match to
  `/om/om/`), so it is treated as middleware redirect behavior.
- On non-desktop user agents, `/my-stream*` compatibility redirect does not run.
  These URLs can continue to access control and then fall through to not-found.

## Failure and Recovery

- Middleware redirects run before access control.
- Route-level redirects run only after access control passes.
- On staging, access denied redirects to `/access` (`401`) or `/restricted`
  (`403`). The staging decision comes from the deployment's configured base
  URL, not from request headers.
- On staging, if the access check gets no answer (timeout, network error, or a
  server error), the request gets a plain-text `503`. Retry once the API
  recovers.
- Other middleware failures redirect to `/error`.
- Paths with a dot-prefixed segment (for example `/.env` or `/.well-known/*`)
  and missing `/_next/*` files return a plain-text `404` instead of a page.
  The one exception is `/.well-known/apple-app-site-association`, which returns
  the 6529 Mobile iOS app association JSON on every deployment, including
  staging without an access cookie.
- Wave links with a malformed wave id show the not-found page. Copy a fresh
  link from the wave: a link cut short when pasted is the usual cause.
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
