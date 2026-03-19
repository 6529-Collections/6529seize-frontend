# Static Asset Delivery Mode

Parent: [Shared Index](README.md)

## Overview

The app shell bundle (`/_next/static/*` JavaScript and CSS) loads from one of
two deployment modes:

- Site origin (`ASSETS_FROM_S3=false`, default).
- CloudFront static host (`ASSETS_FROM_S3=true`).

Users get the same product behavior in both modes. The request host and failure
pattern can differ.

## Location in the Site

- Any app-shell route that hydrates in the browser (signed-in or signed-out).
- First load in a tab, hard refresh, and route transitions that need an
  uncached chunk.

## Entry Points

- Open an app route in a new tab/window.
- Hard refresh an app route.
- Open a deep link that needs uncached code-split chunks.

## User Journey

1. User opens a route and receives HTML.
2. Deployment config picks the app-shell host:
   - `ASSETS_FROM_S3=false`: bundle requests stay on the page origin.
   - `ASSETS_FROM_S3=true`: bundle requests use `assetPrefix`
     `https://dnclu2fna0b2b.cloudfront.net/web_build/{build-id}`.
3. The root layout always preconnects to media host
   `https://d3lqz0a4bldqgf.cloudfront.net`.
4. In CloudFront mode, the root layout also preconnects to
   `https://dnclu2fna0b2b.cloudfront.net`.
5. If bundle files load, hydration completes and interactive controls work.

## Common Scenarios

- Origin mode requests `/_next/static/*` from the same hostname as the page.
- CloudFront mode requests `/_next/static/*` from
  `https://dnclu2fna0b2b.cloudfront.net/web_build/{build-id}/...`.
- If needed chunks are already cached, many route transitions fetch no new
  static files.
- Static-asset mode does not change auth rules, route access, or API endpoint
  behavior.

## Edge Cases

- During deploy rollout, HTML can reference a build ID before that static path
  is available on all edges.
- If network policy, firewall, or extensions block
  `dnclu2fna0b2b.cloudfront.net` while CloudFront mode is active, hydration can
  fail.
- Users cannot switch delivery mode in the UI.

## Failure and Recovery

- Failed static bundle requests can leave a blank page, partially styled page,
  or non-interactive UI.
- Retry with a hard refresh after a short wait, especially right after deploy.
- If CloudFront is blocked in the current network, use a different network or
  remove the blocking rule.
- In origin mode, recovery depends on the main app origin being reachable.

## Limitations / Notes

- Delivery mode is deployment-configured, not user-configurable.
- This page covers app-shell bundle delivery only.
- Content/media URLs use separate media-delivery rules.

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [Loading Status Indicators](feature-loading-status-indicators.md)
- [Route Errors and Not-Found Screens](feature-route-error-and-not-found.md)
- [NFT Media Source Fallbacks](../media/nft/feature-media-source-fallbacks.md)
