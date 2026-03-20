# Legacy Exact-Path Redirect Map

Parent: [Legacy Route Redirects](feature-legacy-route-redirects.md)

## Overview

This page lists the full middleware exact-path legacy redirect map.
For redirect order, access-control behavior, and other legacy families, use
[Legacy Route Redirects](feature-legacy-route-redirects.md).

## Behavior

- Status: `301`
- Match is case-insensitive.
- `/path` and `/path/` both match.
- Match is exact-path only.
- Source query is preserved unless the destination defines its own query.

## General

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

## Collections

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

## Standalone Allowlist

- `/the-hamily-wagmi-allowlist/` -> `/the-memes/74`

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [Legacy Route Redirects](feature-legacy-route-redirects.md)
