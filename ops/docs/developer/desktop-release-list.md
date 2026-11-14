# 6529 Desktop release list

Parent: [Developer Operations](README.md)

## Overview

6529 Desktop checks for updates by fetching a signed release list from the
website. The site serves it the way it serves the validator's feed (see
[Validator download page](../validator-download-page.md)): byte for byte,
from a private S3 bucket, read through the servers' instance role.

| Route | What it serves | Access |
| --- | --- | --- |
| `/desktop/releases.json` | The signed release list, byte for byte | Public |
| `/desktop/releases.json.sig` | The list's signature, byte for byte | Public |

The site does not check the signature: the app does, with the key built into
it. The site never serves a list without a signature.

## Responses

| Situation | Status | Headers |
| --- | --- | --- |
| A list and its signature are stored | 200 | `application/json; charset=utf-8` (list) or `application/octet-stream` (signature), `Cache-Control: public, max-age=300`, `ETag` and `Last-Modified` from S3, `Access-Control-Allow-Origin: *`, `X-Content-Type-Options: nosniff`, `X-Robots-Tag: noindex, nofollow` |
| `If-None-Match` matches the ETag | 304 | The same headers, no body |
| No bucket is set, or no list is stored yet | 404, `No release list yet.` | `text/plain; charset=utf-8`, `Cache-Control: public, max-age=60` |
| A list is stored without its signature, or S3 fails | 503, `The release list is unavailable.` | `Cache-Control: no-store`, `Retry-After: 60` |

Both objects are read together and reused for a minute, so the list and the
signature always match. When S3 fails after a good read, the last good pair
is served for up to an hour.

There is no redirect (the app refuses redirects) and no password gate.
Production serves both paths to everyone; on staging they sit behind the
staging access gate like every other page. The CloudFront page cache's
default behaviour stores the 200 answers for up to five minutes and the 404
for up to one minute, as the origin's `Cache-Control` says.

## Configuration

Server environment, read at request time:

- `DESKTOP_RELEASES_BUCKET`: the private bucket that holds
  `feed/releases.json` and `feed/releases.json.sig`. Unset: both paths
  answer 404 without reading anything.
- `DESKTOP_RELEASES_REGION`: the bucket's region; `us-east-1` when unset.

The servers' instance role needs `s3:GetObject` on those two keys and
`s3:ListBucket` on the bucket, so that a missing list reads as 404 rather
than 403.

Code: `app/desktop/releases.json/route.ts`,
`app/desktop/releases.json.sig/route.ts` and
`lib/desktop-releases/releaseList.ts`, sharing the validator's
`lib/validator-page/feedResponse.ts` and `lib/validator-page/releasesBucket.ts`.
