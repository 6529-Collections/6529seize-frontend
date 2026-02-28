# Shared

Shared docs cover user-facing behavior reused across multiple product areas.

## Overview

- Use this area when the same behavior appears in multiple areas.
- Covers cross-area redirects, shared route-failure surfaces, and shared UI
  patterns.
- Route scope: any app-shell route plus legacy URLs that redirect into current
  routes.
- Route-specific feature behavior stays in each product area.

## Features

### Routing and Recovery

- [Legacy Route Redirects](feature-legacy-route-redirects.md): retired URLs and
  legacy query aliases that forward to current routes or assets.
- [Route Errors and Not-Found Screens](feature-route-error-and-not-found.md):
  shared `404` and route-error fallback surfaces.

### Shared UI Patterns

- [Loading Status Indicators](feature-loading-status-indicators.md):
  indeterminate loading feedback and screen-reader status behavior.
- [Pagination Controls](feature-pagination-controls.md): shared page-jump and
  next/previous controls across paginated lists.
- [Hover Cards and Tooltip Positioning](feature-hover-cards-and-tooltips.md):
  `CustomTooltip`-based profile/wave hover cards and helper tooltips with
  viewport-aware placement.
- [Browser Zoom and Pinch Scaling](feature-browser-zoom-and-pinch-scaling.md):
  web zoom defaults plus native-wrapper zoom lock and text-entry safeguards.

### App Delivery

- [Static Asset Delivery Mode](feature-static-asset-delivery-mode.md):
  origin vs CloudFront app-bundle delivery behavior.

## Flows

- None.

## Troubleshooting

- None.

## Stubs

- None.

## Related Areas

- [Docs Home](../README.md)
- [Navigation Index](../navigation/README.md)
- [Notifications Index](../notifications/README.md)
- [Profiles Index](../profiles/README.md)
- [Waves Index](../waves/README.md)
- [Realtime Index](../realtime/README.md)
