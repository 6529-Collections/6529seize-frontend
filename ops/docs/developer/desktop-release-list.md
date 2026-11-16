# 6529 Desktop release list

Parent: [Developer Operations](README.md)

## Overview

6529 Desktop checks for updates by fetching a signed release list from the
website. The site serves it like the validator's feed (see
[Validator download page](../validator-download-page.md)): byte for byte,
from a private S3 bucket, read through the servers' instance role.

| Route | What it serves | Access |
| --- | --- | --- |
| `/desktop/releases.json` | The signed release list, byte for byte | Public |
| `/desktop/releases.json.sig` | The list's signature, byte for byte | Public |

These routes do not check the signature: the app does, with the key built
into it. They never serve a list without a signature. The `/desktop` pages
and downloads ([6529 Desktop download page](../desktop-download-page.md))
check the signature before they read anything from the list.

## The bundle

Unlike the validator's feed, which is two objects, the publisher uploads the
list and its signature together as one object, so a publish can never land
between two reads:

- Key: `feed/releases.bundle.json` in the Desktop releases bucket.
- Content type: `application/json`.
- Shape, exactly these three fields:

  ```json
  {"version":1,"list":"<base64>","signature":"<base64>"}
  ```

  `list` is the exact bytes of `releases.json` and `signature` the exact
  bytes of `releases.json.sig`, each in standard padded base64 (RFC 4648
  section 4, no line breaks, no whitespace). The list may be at most
  56 KiB (57,344 bytes) and the signature at most 1 KiB (1,024 bytes)
  once decoded, the same limits the app enforces; neither may be empty.

The site refuses a bundle that is not UTF-8 JSON, has a missing, extra or
empty field, another `version`, non-canonical base64 or a part over its
limit. A refused bundle is treated like an S3 failure: the last good pair
keeps being served for up to an hour, otherwise both routes answer 503.

## Responses

| Situation | Status | Headers |
| --- | --- | --- |
| A valid bundle is stored | 200 | `application/json; charset=utf-8` (list) or `application/octet-stream` (signature), `Cache-Control: public, max-age=300`, `X-Release-List-Pair` (see [Matching list and signature](#matching-list-and-signature)), `ETag` `"<pair>-list"` or `"<pair>-sig"`, `Last-Modified` of the bundle, `Access-Control-Allow-Origin: *`, `Access-Control-Expose-Headers: X-Release-List-Pair`, `X-Content-Type-Options: nosniff`, `X-Robots-Tag: noindex, nofollow` |
| `If-None-Match` matches the ETag | 304 | The same headers, no body |
| No bucket is set, or no bundle is stored yet | 404, `No release list yet.` | `text/plain; charset=utf-8`, `Cache-Control: public, max-age=60` |
| The bundle is refused, or S3 fails, with no good pair in the last hour | 503, `The release list is unavailable.` | `Cache-Control: no-store`, `Retry-After: 60` |

Each server reads the bundle once a minute, or every ten seconds while reads
are failing. Only a served pair is kept to fall back on: a 404 is
never stretched over a later failure (no bundle, then an S3 error or a
refused bundle, answers 503). S3 reads are strongly consistent, so a missing
object is a definite answer, not a failure: once a server's refresh has
successfully seen that the bundle is gone, it answers 404 and keeps nothing
to fall back on. Clients can still receive the deleted list from caches: a
200 already stored by CloudFront or an HTTP cache stays fresh for up to five
minutes. How long a client can still see the deleted list:

- When the servers' next reads succeed: up to about six minutes (one-minute
  server snapshot plus the 200's five-minute `max-age`).
- When S3 reads fail after the deletion, before a server has seen the
  missing bundle: that server keeps serving its last good pair, so up to
  about one hour and five minutes (the last-good lifetime plus `max-age`).

To withdraw a list for certain, publish a superseding signed list (a new
bundle with a higher `sequence`) rather than rely on deletion: the app keeps
the newest verified list and refuses an older one.

There is no redirect (the app refuses redirects) and no password gate.
Production serves both paths to everyone; on staging they sit behind the
staging access gate like every other page. The CloudFront page cache's
default behaviour stores the 200 answers for up to five minutes and the 404
for up to one minute, as the origin's `Cache-Control` says.

## Matching list and signature

What is guaranteed:

- Every snapshot a server holds is a pair the publisher wrote together: it
  comes from one read of one object, and one S3 PUT replaces the whole
  object at once.
- Both answers carry `X-Release-List-Pair`: 32 hex characters derived from
  the list's and the signature's bytes. Every server gives the same value
  for the same pair, and a new list or a new signature gives a new value.
  The 304 answers carry it too.

What is not guaranteed:

- The list and the signature are still two requests. Around a publish they
  can come from different snapshots: one server or edge location still has
  the old pair while another has the new one, and each answer can be held
  for up to five minutes by CloudFront or an HTTP cache. A client can then
  receive the new list with the old signature, or the reverse, and the two
  pair headers differ. When the servers' reads succeed this lasts up to
  about six minutes after a publish (one minute of server snapshot plus five
  of `max-age`); a server whose reads fail keeps its last good pair, so it
  can last up to about one hour and five minutes.
- A `Cache-Control: no-cache` request header does not reach past CloudFront,
  which serves its stored copy. A query string does: the page cache keys on
  every query string and the routes ignore it.

What a client should do:

1. Always verify the signature over the list bytes as received, and never
   accept a list that does not verify.
2. If the two `X-Release-List-Pair` values differ, or only one answer has
   the header, the list is being updated: keep the list already held and do
   not report a signature failure. Fetch both again with
   `Cache-Control: no-cache` and the same fresh query string on both
   requests (for example `?pair=<the list's value>`), so both reach a
   server rather than an edge copy.
3. If they still differ, try again after at least a minute (the server
   snapshot lifetime), at most a few times, then wait quietly for the next
   scheduled check.
4. When both values match and the signature does not verify, refuse the list.

The validator's `/validator/releases.json` reads its list and signature as
two objects and sends no pair header, so it has both the two-read and the
two-request windows.

## Configuration

Server environment, read at request time:

- `DESKTOP_RELEASES_BUCKET`: the private bucket that holds
  `feed/releases.bundle.json`. Unset: both paths answer 404 without reading
  anything.
- `DESKTOP_RELEASES_REGION`: the bucket's region; `us-east-1` when unset.

The servers' instance role needs `s3:GetObject` on
`feed/releases.bundle.json` and `s3:ListBucket` on the bucket, so that a
missing bundle reads as 404 rather than 403. The `/desktop/download` route
also needs `s3:GetObject` on `releases/*`, where the release files are.

Code: `app/desktop/releases.json/route.ts`,
`app/desktop/releases.json.sig/route.ts` and
`lib/desktop-releases/releaseList.ts`, sharing the validator's
`lib/validator-page/feedResponse.ts` and `lib/validator-page/releasesBucket.ts`.
