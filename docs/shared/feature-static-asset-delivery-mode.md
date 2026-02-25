# Static Asset Delivery Mode

Parent: [Shared Index](README.md)

## Overview

The site can load its static app bundle (JavaScript, CSS, and related build
assets) from either the main site origin or a CloudFront static host. Users see
the same product features in both modes, but network paths and failure behavior
can differ.

## Location in the Site

- All routed pages that require the app shell bundle to render and hydrate.
- First page load, hard refresh, and any route transition that needs unloaded
  chunks.

## Entry Points

- Open any route in a new browser tab or window.
- Refresh an already open route.
- Follow a direct link into a deep route that needs code-split chunks.

## User Journey

1. User opens a route and receives the page HTML.
2. The page head provides connection hints for core backends, and may include a
   preconnect hint for the static CloudFront host.
3. The browser requests app bundle files from one of two sources:
   - Site origin (default mode).
   - `https://dnclu2fna0b2b.cloudfront.net/web_build/{build-id}/` (CloudFront
     mode).
4. When static files load successfully, the page hydrates and interactive UI
   becomes available.

## Common Scenarios

- In origin mode, static files are requested from the same domain as the page.
- In CloudFront mode, static files are requested from the static host path for
  the current build ID.
- After files are cached, subsequent navigations usually need fewer network
  round-trips before interactivity is ready.

## Edge Cases

- If a user opens the app during deploy propagation, chunk requests can briefly
  reference paths that are not yet available at every edge.
- If a browser extension, firewall, or enterprise policy blocks the CloudFront
  host while CloudFront mode is active, routes may not hydrate correctly.
- Users cannot switch delivery mode from the UI.

## Failure and Recovery

- If static chunk or stylesheet requests fail, users may see a blank page,
  unstyled content, or non-interactive controls.
- A refresh after a short delay can recover once static files become reachable.
- If the static host is blocked on the current network, switching network
  context (or temporarily disabling the blocking rule) can restore normal load.
- In origin mode, recovery depends on the main app origin being reachable.

## Limitations / Notes

- Delivery mode is deployment-configured and not user-configurable.
- This behavior covers app shell assets; media URLs rendered inside content have
  separate handling rules.

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [Loading Status Indicators](feature-loading-status-indicators.md)
- [NFT Media Source Fallbacks](../media/nft/feature-media-source-fallbacks.md)
