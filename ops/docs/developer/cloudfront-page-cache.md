# Page edge cache (CloudFront)

## Overview

A CloudFront distribution sits in front of the frontend's page host. Pages
the app marks as shared-cacheable are answered from the edge; Node renders only
cache misses and personalised responses. Static assets already use their own
distribution (`dnclu2fna0b2b.cloudfront.net`, see `config/assetPrefix.ts`) and
are unaffected.

| Environment | Distribution                                       | Origin                                                                              | Status                                                                                               |
| ----------- | -------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Staging     | `E1DKA1VIRRUKKC` (`d3n2q53uzk0de4.cloudfront.net`) | `origin.staging.6529.io` (nginx → Node on the staging instance)                     | Serving `staging.6529.io` since 2026-11-02                                                           |
| Production  | `E3KTTDJUNHRYW9` (`d3g6odudeykxr2.cloudfront.net`) | `seizeapp-env-node22.eba-dg2ywmgz.us-east-1.elasticbeanstalk.com` (ALB → Node:3001) | Serving `6529.io` since 2026-11-04; [origin locked to CloudFront](#origin-lockdown) since 2026-11-06 |

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

Compression: Node keeps compressing (`compress` stays on in
`config/nextConfig.ts`); see [Compression](#compression) for why.

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
  the new pages. The `PRODUCTION_PAGE_DISTRIBUTION_ID` variable in the
  `production` environment names the distribution (`E3KTTDJUNHRYW9`); the
  step is skipped when it is empty.

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

Done on 2026-11-04: `6529.io` has been served by `E3KTTDJUNHRYW9`
(`d3g6odudeykxr2.cloudfront.net`) since 01:45 UTC. The steps were:

1. The rate-limit change (`lib/security/clientRateLimit.ts`) shipped to
   production. Staging had served through CloudFront since 2026-11-02 with green
   staging E2E.
2. `E3KTTDJUNHRYW9` was created from `distribution-production.json` without its
   alias and reached `Deployed`. No traffic reached it yet.
3. The `6529.io` alternate name moved from `E2CMJWTZ3QB8BF` (the `www.6529.io`
   S3 redirect, which keeps `www.6529.io`) to the new distribution. The `www`
   redirects behaved the same before, during and after the move.
4. The verification matrix passed against production with
   `curl --connect-to 6529.io:443:d3g6odudeykxr2.cloudfront.net:443`. The rate
   limiter behaved as before: 60 requests passed, then 429, and a spoofed
   `X-Forwarded-For` did not get around it.
5. Policy version `v16` of `FrontendProductionDeployment` added the
   `ProductionPageCachePurge` statement (recorded in
   `ops/iam/frontend-production/verification.json`).
   `PRODUCTION_PAGE_DISTRIBUTION_ID` was set to `E3KTTDJUNHRYW9`.
6. In hosted zone `Z034375922ON0KJSHH6TF`, the `6529.io` `A` alias was upserted
   to the distribution (`HostedZoneId` `Z2FDTNDATAQYW2`) and a matching `AAAA`
   alias was created. The MX, TXT and NS records were left alone.
7. A one-hour watch raised no alerts: CloudFront 5xx and 4xx rates, load
   balancer 5xx and target response time, and page checks. The first
   production deploy afterwards purged the distribution in about 21 seconds.

**Rollback** (resolvers follow within about a minute)

1. Reopen the load balancer first, using the
   [origin lockdown rollback](#origin-lockdown). Otherwise every request fails
   once DNS points at it.
2. `UPSERT` the `6529.io` `A` alias back to
   `seizeapp-env-node22.eba-dg2ywmgz.us-east-1.elasticbeanstalk.com`
   (`HostedZoneId` `Z117KPS5GTRQ2G`, `EvaluateTargetHealth` true), `DELETE` the
   `AAAA` alias, and clear `PRODUCTION_PAGE_DISTRIBUTION_ID`. The rate-limit
   change is correct with or without CloudFront.

## Origin lockdown

Since 2026-11-06 the production load balancer accepts traffic only from
CloudFront. Its security group (`sg-0fac1cee3a1095ef4`, the
`AWSEBLoadBalancerSecurityGroup` that Elastic Beanstalk creates) allows only
TCP 443 from the AWS-managed prefix list
`com.amazonaws.global.cloudfront.origin-facing` (`pl-3b927c52`). Direct
requests to the Elastic Beanstalk or load balancer hostname time out.

- Port 80 is closed. CloudFront connects to the origin over HTTPS only and
  redirects viewers from HTTP to HTTPS itself. The prefix list counts as 55 of
  the group's 60 inbound rules, so only one port can use it.
- Nothing else is affected:
  - Target group health checks and app traffic go from the load balancer to
    the instances inside the VPC.
  - Elastic Beanstalk reads health from its instance agent.
  - The production deploy workflow uses the Elastic Beanstalk API and
    `https://6529.io`.
  - Production E2E uses `https://6529.io`.
  - Staging has its own instance and distribution.
- Nothing else used the origin hostnames. No Route 53 record, health check,
  canary, alarm or other distribution pointed at them, and their certificate
  is for `6529.io`.
- The rule persists across deploys. Ordinary deploys update only the Auto
  Scaling group and Elastic Beanstalk metadata in the environment's
  CloudFormation stack. `.ebextensions/alb-cloudfront-only.config` also pins the
  rule in the environment template, so an environment change cannot reopen it.
- Any CloudFront distribution can still reach the origin, not only ours,
  because the prefix list covers all of CloudFront. A secret origin header
  checked at the load balancer would close that gap; none is in place.

To check, run `curl --connect-timeout 10
https://seizeapp-env-node22.eba-dg2ywmgz.us-east-1.elasticbeanstalk.com/api/version`
from outside AWS: it times out (curl exit code 28), while
`https://6529.io/api/version` answers 200.

Rollback restores the Elastic Beanstalk default rules. The prefix-list rule can
stay. Also revert `.ebextensions/alb-cloudfront-only.config`, so that the next
template change does not remove the rules again.

```bash
aws ec2 authorize-security-group-ingress --region us-east-1   --group-id sg-0fac1cee3a1095ef4 --ip-permissions   'IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges=[{CidrIp=0.0.0.0/0}]'   'IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges=[{CidrIp=0.0.0.0/0}]'
```

## Compression

`compress` stays on in `config/nextConfig.ts`, so Node gzips responses.
Turning it off would not move compression to the edge; most HTML would arrive
uncompressed instead. This was checked against production on 2026-11-06:

- CloudFront compresses a response only when the origin sends a
  `Content-Length` between 1,000 bytes and 10 MB
  ([conditions for compression](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/ServingCompressedFiles.html#compressed-content-cloudfront-notes)).
- Next streams dynamic pages, route handlers and not-found pages with chunked
  encoding and no `Content-Length`. CloudFront passes those through
  uncompressed, whether it caches them or not. Only prerendered pages and
  static files carry a `Content-Length`.
- Behaviours that use `Managed-CachingDisabled` (`/validator*`, `/my-stream*`)
  are never compressed at the edge.

Measured through CloudFront. The right-hand column used
`Accept-Encoding: br`. Node does not send Brotli, so it answered those requests
uncompressed, as it would with compression off.

| Path                         | Node gzip (today) | Without Node compression |
| ---------------------------- | ----------------: | -----------------------: |
| `/waves/{id}` (dynamic)      |           35.1 KB |  262.4 KB (uncompressed) |
| `/about/the-memes` (dynamic) |           22.0 KB |  160.1 KB (uncompressed) |
| `/museum` (prerendered)      |           27.0 KB |         18.9 KB (Brotli) |
| `/` (prerendered)            |           24.3 KB |         18.2 KB (Brotli) |

Turning compression off would save about 30% on prerendered pages and make
dynamic pages six to eight times larger. Next has no option to compress only
streamed responses, so revisit this when most routes are static. The edge
settings are already in place for that: every behaviour except
`/_next/image*` (images) has `Compress` on, and the page, static and OG cache
policies keep gzip and Brotli in the cache key.

## Known limits

- Dynamic routes are still rendered for every request. Making the root layout
  static-capable (Cache Components) is separate, later work.
- Revoking a staging access key does not evict pages already cached under it
  until the next deploy or the one-day cap.
- Page TTLs are capped at one day even where the app asks for a year.
- Each edge location forwards its own misses to the origin. Origin Shield in
  `us-east-1` would collapse them into one regional cache; it is not enabled.
