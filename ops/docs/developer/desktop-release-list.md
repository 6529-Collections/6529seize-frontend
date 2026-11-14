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
| A list and its signature are stored | 200 | `application/json; charset=utf-8` (list) or `application/octet-stream` (signature), `Cache-Control: public, max-age=300`, `ETag` and `Last-Modified` from S3, `X-Release-List-Pair` (see [Matching list and signature](#matching-list-and-signature)), `Access-Control-Allow-Origin: *`, `Access-Control-Expose-Headers: X-Release-List-Pair`, `X-Content-Type-Options: nosniff`, `X-Robots-Tag: noindex, nofollow` |
| `If-None-Match` matches the ETag | 304 | The same headers, no body |
| No bucket is set, or no list is stored yet | 404, `No release list yet.` | `text/plain; charset=utf-8`, `Cache-Control: public, max-age=60` |
| A list is stored without its signature, or S3 fails | 503, `The release list is unavailable.` | `Cache-Control: no-store`, `Retry-After: 60` |

Both objects are read together and reused for a minute. When S3 fails after
a good read, the last good pair is served for up to an hour.

There is no redirect (the app refuses redirects) and no password gate.
Production serves both paths to everyone; on staging they sit behind the
staging access gate like every other page. The CloudFront page cache's
default behaviour stores the 200 answers for up to five minutes and the 404
for up to one minute, as the origin's `Cache-Control` says.

## Matching list and signature

What is guaranteed:

- Each server reads the list and the signature together and keeps the pair
  for a minute, so the two answers one server gives from one snapshot match.
- Both answers carry `X-Release-List-Pair`: 32 hex characters derived from
  the list's and the signature's bytes. Every server gives the same value for
  the same pair, and a new list or a new signature gives a new value. The 304
  answers carry it too.

What is not guaranteed:

- The list and the signature are two requests. Around a publish they can come
  from different snapshots: one server or edge location still has the old
  pair while another has the new one, and each answer can then be held for up
  to five minutes by CloudFront or an HTTP cache. A client can therefore
  receive the new list with the old signature (or the reverse) for up to
  about six minutes after a publish: one minute of server snapshot plus five
  of `max-age`. The signature then does not verify. The pair header tells
  this apart from a bad signature: the two values differ.
- A client request's `Cache-Control: no-cache` does not reach past
  CloudFront, which serves its stored copy. A query string does: the page
  cache keys on every query string and the routes ignore it, so
  `?pair=<value>` reaches a server. Servers can still disagree for up to one
  minute after a publish.

What a client should do when the two `X-Release-List-Pair` values differ, or
one answer has the header and the other does not:

1. Treat it as "the list is being updated", not as a refused list: keep the
   list already held and do not report a signature failure.
2. Fetch both again with the same fresh query string on both requests (for
   example `?pair=<the list's value>` or a random value), so both come from
   a server rather than an edge copy.
3. If they still differ, try again after at least a minute (the server
   snapshot lifetime), at most a few times, then give up quietly until the
   next scheduled check.
4. Only when both values match and the signature still does not verify is
   the list refused.

The validator's `/validator/releases.json` has the same two-request window but
no pair header.

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
