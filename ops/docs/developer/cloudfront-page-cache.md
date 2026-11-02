# Page edge cache (CloudFront)

## Overview

A CloudFront distribution sits in front of the frontend's page host. Pages
the app marks as shared-cacheable are answered from the edge; Node renders only
cache misses and personalised responses. Static assets already use their own
distribution (`dnclu2fna0b2b.cloudfront.net`, see `config/assetPrefix.ts`) and
are unaffected.

| Environment | Distribution                                       | Origin                                                                              | Status                                     |
| ----------- | -------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------ |
| Staging     | `E1DKA1VIRRUKKC` (`d3n2q53uzk0de4.cloudfront.net`) | `origin.staging.6529.io` (nginx → Node on the staging instance)                     | Serving `staging.6529.io` since 2026-11-02 |
| Production  | not created                                        | `seizeapp-env-node22.eba-dg2ywmgz.us-east-1.elasticbeanstalk.com` (ALB → Node:3001) | [Cutover plan](#production-cutover)        |

The CloudFront definitions live in `ops/cloudfront/frontend-html/`: four cache
policies, one origin request policy, one response headers policy, and the
staging and production distribution configs. Edit those files and apply them
with the commands under [Setup](#setup) so the repository stays the record.

## What the edge caches

The origin decides. Every cache policy has a default and minimum TTL of 0, so
CloudFront stores only responses that carry `s-maxage` or a public `max-age`,
and honours `stale-while-revalidate`:

- **Prerendered pages** (`force-static`, 174 today) send
  `Cache-Control: s-maxage=31536000`. The page policy caps that at one day.
- **ISR pages and API routes** with `s-maxage` are cached for their own TTL.
- **Dynamic pages** (most routes, because the root layout reads cookies and
  headers) send `private, no-cache, no-store` and are never stored.
- **Redirects** from `proxy.ts` and Next carry no `Cache-Control`, so they are
  never stored either. Error responses use an error-caching minimum of 0, so a
  transient 5xx or 404 is never held at the edge.

| Path                            | Cache key                                                                                                                      | Notes                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| default (`*`)                   | path, every query string, `rsc`, `next-router-*` headers, `next-url`, cookies `x-6529-auth`, `wallet-auth`, `validator_access` | All viewer headers, cookies and query strings reach the origin. Max 1 day.                                               |
| `/_next/static/*`               | path                                                                                                                           | Content-hashed files, up to one year. Only the Host header is forwarded.                                                 |
| `/_next/image*`                 | `url`, `w`, `q`, `Accept`                                                                                                      | Moves sharp image resizing off the app servers. No cookies.                                                              |
| `/api/og-metadata/*`            | path, every query string, cookie `x-6529-auth`                                                                                 | Crawler cards. Max 1 day.                                                                                                |
| `/validator*`, `/my-stream*`    | not cached                                                                                                                     | The validator password gate and the user-agent based `/my-stream` redirect run in `proxy.ts` and must see every request. |
| `/.well-known/acme-challenge/*` | not cached (staging only)                                                                                                      | Plain HTTP to nginx port 80 so certbot renewals keep working.                                                            |

Why the page key looks like this:

- **`_rsc`, `rsc` and the router headers** keep React Server Component
  payloads and prefetches apart from HTML. Next.js also redirects an `rsc`
  request without a matching `_rsc` value, so a crafted request cannot store
  RSC text under a page's HTML key.
- **`x-6529-auth`** is the staging access cookie. `proxy.ts` decides the
  staging gate from it, so keying on it keeps the gate exact: a visitor without
  the cookie never receives a page cached for one who had it.
- **`wallet-auth`** (the signed-in JWT) gives every signed-in session its own
  entries, so signed-in and anonymous visitors never share a cached response.
  Prerendered pages are identical either way; this keeps the guarantee even if
  a route later starts varying.

Compression: the edge serves gzip or Brotli for responses the origin sends
uncompressed. Node already gzips pages, so pages stay gzip until origin
compression is turned off (a production follow-up below).

Headers: the app's own security headers (CSP, HSTS, frame options and the
rest, from `config/securityHeaders.ts`) pass through unchanged. The response
headers policy fills in HSTS, `nosniff`, frame options and referrer policy only
on responses that lack them, such as CloudFront's own error pages, and adds a
`Server-Timing` header with cache status, edge location and upstream timings.

Client addresses: behind CloudFront the load balancer (or nginx) sees the edge,
not the viewer. `lib/security/clientRateLimit.ts` therefore skips exactly one
CloudFront hop when keying rate limits. The CloudFront origin-facing ranges are
stored in `lib/security/cloudFrontOriginFacingRanges.json`; refresh them with
`node ops/scripts/sync-cloudfront-origin-facing.mjs` (or check for drift with
`--check`) when AWS announces CloudFront range changes. An out-of-date list
makes viewers behind a new edge share one rate-limit bucket; it never lets a
viewer choose its own key.

## Deploy-time purge

Every deployment purges the page distribution (`/*`) after the new release
answers and waits until the purge completes:

- **Staging:** `Web Deploy - STAGING` runs
  `ops/scripts/purge-page-edge-cache.sh` after the exact HTTP version check.
- **Production:** `Web Deploy - PROD` runs it after the deployed version check
  and before publishing the announced version, so tabs prompted to reload get
  the new pages. The step is skipped until the `PRODUCTION_PAGE_DISTRIBUTION_ID`
  variable is set during the cutover.

The step runs only when the version check passed. It fails the job when it
cannot start a purge, or when the distribution does not serve the deployed
host. It only warns when the purge is still running after ten minutes, or when
the distribution has been deleted: the release is already live, and an
accepted purge still completes.

Why purge instead of a short TTL: prerendered pages change only when a deploy
ships, and they embed that build's chunk URLs. A TTL short enough to bound a
stale page after a deploy (minutes) would throw away most hits between the 5–11
daily deploys, and every stale minute would make the version prompt reload
users into the same stale page. One `/*` path counts as one invalidation path;
about 300 a month fit well inside CloudFront's 1,000 free paths. The one-day
cap on page TTLs is the backstop if a purge is ever missed.

Stale pages keep working until the purge lands. Production chunks stay in S3
under every `web_build/<sha>` prefix (the bucket has no expiry rule). Staging
serves chunks from Node, so the purge also clears the edge copies of chunks
that the new build no longer has, exactly as the origin already does.

Manual purge, for example after a Museum publication fix that did not ship
through a deploy:

```bash
ops/scripts/purge-page-edge-cache.sh E1DKA1VIRRUKKC staging.6529.io
```

## Setup

The staging distribution was created with these commands from
`ops/cloudfront/frontend-html/`. The cache, origin request and response headers
policies are shared, so production only needs a distribution.

```bash
aws cloudfront create-cache-policy --cache-policy-config file://cache-policy-html.json
aws cloudfront create-cache-policy --cache-policy-config file://cache-policy-static.json
aws cloudfront create-cache-policy --cache-policy-config file://cache-policy-image.json
aws cloudfront create-cache-policy --cache-policy-config file://cache-policy-og.json
aws cloudfront create-origin-request-policy --origin-request-policy-config file://origin-request-policy-host.json
aws cloudfront create-response-headers-policy --response-headers-policy-config file://response-headers-policy.json
```

| Policy                                     | ID                                     |
| ------------------------------------------ | -------------------------------------- |
| `frontend-html-origin-controlled` (pages)  | `3d5e2933-ef97-4ca2-b075-14d8de39deff` |
| `frontend-next-static`                     | `1ecaa93f-7a0c-42f7-8775-0700dadbda9c` |
| `frontend-next-image`                      | `62848582-2076-4e33-894e-f6c575a59a64` |
| `frontend-og-metadata`                     | `d1fd2602-5e5a-4a50-ac66-82af1ad19c52` |
| `frontend-host-only` (origin request)      | `afacd8ea-6f91-46f3-8fb3-b0fec7c4d1fb` |
| `frontend-edge-headers` (response headers) | `523c541d-ef9e-4d82-8b4f-11a94b76d5c8` |
| `Managed-AllViewer` (origin request, AWS)  | `216adef6-5c7f-47e4-b989-5492eafa07d3` |
| `Managed-CachingDisabled` (AWS)            | `4135ea2d-6df8-44a3-9df3-4b5a84be39ad` |

To change a policy, edit its file, then run `aws cloudfront get-cache-policy
--id <id>` for the current ETag and `aws cloudfront update-cache-policy --id <id>
--if-match <etag> --cache-policy-config file://<file>`. Distribution changes use
`get-distribution-config` and `update-distribution` the same way.

Origin and TLS: CloudFront connects to the origin hostname over HTTPS and
forwards the viewer's `Host`, so nginx (staging) or the load balancer
(production) selects the site and presents its existing certificate for
`staging.6529.io` or `6529.io`. Staging's origin hostname,
`origin.staging.6529.io`, is an A record for the instance's public address;
update it if that address changes. The distribution uses the `*.6529.io`
certificate in `us-east-1`.

The staging deploy role may read, invalidate and poll invalidations on the
staging distribution only; see the [staging IAM runbook](../../iam/frontend-staging/README.md).

## Verification

Each case below passed on staging on 2026-11-02, first through
`curl --connect-to staging.6529.io:443:d3n2q53uzk0de4.cloudfront.net:443`
before DNS moved, then over public DNS. `X-Cache` and `Server-Timing` show the
result. Staging pages need the staging access cookie (`x-6529-auth`).

| Case                                                       | Result                                                                                 |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Prerendered `/museum`, staging cookie only                 | `Miss`, then `Hit from cloudfront` with the app's headers intact                       |
| `/museum` without the staging cookie                       | 307 to `/access`, `Miss` every time                                                    |
| `/museum` with a `wallet-auth` cookie                      | `Miss`: its own entry, never the anonymous one                                         |
| `rsc: 1` without `_rsc`                                    | 307 to `?_rsc`; the HTML entry still serves `text/html`                                |
| Dynamic `/about/the-memes`, `/api/version`                 | `private, no-store` / `no-store`, `Miss` every time                                    |
| `/_next/static/chunks/*.js`                                | `Miss`, then `Hit`                                                                     |
| `/_next/image?url=/6529io.png&w=256&q=75`                  | AVIF `Miss` then `Hit`; WebP-only `Accept` gets its own entry; cookies do not split it |
| `/api/og-metadata/image?url=…`                             | `Miss`, then `Hit` (`s-maxage=2592000`)                                                |
| `/api/og-metadata/profiles/…` with the staging cookie      | `private, no-store`, not cached                                                        |
| `/my-stream` (desktop and phone user agents), `/validator` | never cached; desktop still gets the 301 to `/waves`                                   |
| `http://…/museum`                                          | CloudFront 301 to HTTPS                                                                |
| `http://…/.well-known/acme-challenge/…`                    | reaches nginx port 80; `certbot renew --dry-run` succeeds                              |

Time to first byte, fresh connection per request, median of 7, origin in
`eu-west-1`:

| Viewer region    | `/museum` direct | `/museum` edge hit | `/about/the-memes` direct → edge |
| ---------------- | ---------------: | -----------------: | -------------------------------: |
| `us-west-2`      |           477 ms |              45 ms |                     474 → 175 ms |
| `ap-southeast-1` |           735 ms |              58 ms |                     703 → 715 ms |
| `eu-central-1`   |            86 ms |              43 ms |                     110 → 101 ms |
| `sa-east-1`      |           716 ms |              40 ms |                     713 → 722 ms |

Cached pages are 2–18× faster to first byte. Dynamic pages gain only when the
edge already holds a warm connection to the origin (samples ranged
210–800 ms); they gain nothing from the cache itself.

## Rollback

Staging: point `staging.6529.io` back at the instance. The distribution can
stay deployed; nothing else depends on it.

```json
{
  "Changes": [
    {
      "Action": "DELETE",
      "ResourceRecordSet": {
        "Name": "staging.6529.io.",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d3n2q53uzk0de4.cloudfront.net.",
          "EvaluateTargetHealth": false
        }
      }
    },
    {
      "Action": "DELETE",
      "ResourceRecordSet": {
        "Name": "staging.6529.io.",
        "Type": "AAAA",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d3n2q53uzk0de4.cloudfront.net.",
          "EvaluateTargetHealth": false
        }
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "staging.6529.io.",
        "Type": "A",
        "TTL": 5,
        "ResourceRecords": [{ "Value": "3.255.129.178" }]
      }
    }
  ]
}
```

Apply it with `aws route53 change-resource-record-sets --hosted-zone-id
Z034375922ON0KJSHH6TF --change-batch file://rollback.json`. The purge step in
`Web Deploy - STAGING` keeps purging while the distribution exists, and only
warns once it is deleted.

## Production cutover

Production is not cut over. Changing the `6529.io` record moves all traffic,
so each phase below needs explicit approval.

**Before the cutover**

1. Ship the rate-limit change (`lib/security/clientRateLimit.ts`) to production
   and keep staging on CloudFront for at least a day of normal use and green
   staging E2E.
2. Create the production distribution from `distribution-production.json`
   without its alias (set `Aliases` to `{"Quantity": 0}` for this call) and
   wait for `Deployed`. No traffic reaches it.
3. Move the `6529.io` alternate name. Distribution `E2CMJWTZ3QB8BF` (the
   `www.6529.io` S3 redirect) still lists `6529.io` although the apex record
   points at Elastic Beanstalk, and CloudFront allows a name on one
   distribution only. Remove `6529.io` from `E2CMJWTZ3QB8BF` (keep
   `www.6529.io`), then add it to the new distribution. Neither change moves
   traffic.
4. Verify the matrix above against production with
   `curl --connect-to 6529.io:443:<new>.cloudfront.net:443`, plus a signed-in
   session (wallet connect, waves, messages; the WebSocket and API use their own
   hosts), a server action, `/api/alchemy/*` rate limits and `/validator`.
5. Add a `ProductionPageCachePurge` statement for the new distribution to
   `ops/iam/frontend-production/FrontendProductionDeployment.json` (same actions
   as staging), install and verify it as that runbook describes, and set the
   `PRODUCTION_PAGE_DISTRIBUTION_ID` variable in the `production` environment.

**Cutover**

6. In hosted zone `Z034375922ON0KJSHH6TF`, `UPSERT` the `6529.io` `A` alias to
   the new distribution (`HostedZoneId` `Z2FDTNDATAQYW2`) and `CREATE` a
   matching `AAAA` alias. Leave the MX, TXT and NS records alone.
7. Watch for an hour: CloudFront `5xxErrorRate` and `4xxErrorRate`, load
   balancer 5xx and target response time, Sentry, `/api/version`, the home
   page, a prerendered Museum page and a signed-in flow. The next production
   deploy runs the purge step; check its log.

**Rollback** (resolvers follow within about a minute)

8. `UPSERT` the `6529.io` `A` alias back to
   `seizeapp-env-node22.eba-dg2ywmgz.us-east-1.elasticbeanstalk.com`
   (`HostedZoneId` `Z117KPS5GTRQ2G`, `EvaluateTargetHealth` true), `DELETE` the
   `AAAA` alias, and clear `PRODUCTION_PAGE_DISTRIBUTION_ID`. The rate-limit
   change is correct with or without CloudFront.

**After a stable week (separate changes)**

- Set `compress: false` in `config/nextConfig.ts` so CloudFront compresses
  pages with Brotli. Only do this once every page request goes through the
  edge; the load balancer does not compress.
- Restrict the load balancer to CloudFront: allow HTTPS only from the managed
  prefix list `com.amazonaws.global.cloudfront.origin-facing`
  (`pl-3b927c52`), or require a secret origin header on the listener, so
  nobody can bypass the edge.
- Consider Origin Shield in `us-east-1` to collapse misses from all edges into
  one regional cache.

## Known limits

- Dynamic routes are still rendered for every request. Making the root layout
  static-capable (Cache Components) is separate, later work.
- Revoking a staging access key does not evict pages already cached under it
  until the next deploy or the one-day cap.
- Page TTLs are capped at one day even where the app asks for a year.
- The origin still answers direct requests; see the restriction step above.
