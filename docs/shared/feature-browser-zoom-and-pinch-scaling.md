# Browser Zoom and Pinch Scaling

Parent: [Shared Index](README.md)

## Overview

The site allows users to zoom content instead of locking the viewport at a
fixed scale. This supports mobile pinch-to-zoom and desktop browser zoom for
readability and accessibility.

## Location in the Site

- All standard app routes that use the shared app shell
- Mobile browser sessions and desktop browser sessions

## Entry Points

- Open any page in a browser.
- Use pinch gestures on touch devices.
- Use browser zoom controls (`Cmd/Ctrl` + `+`, `-`, or reset to default).

## User Journey

1. Open a page at normal scale.
2. Zoom in or out using browser/device controls.
3. Continue navigating; page content remains zoomable on subsequent routes.
4. Reset zoom from browser/device controls when finished.

## Common Scenarios

- Increase zoom on mobile to inspect dense tables, timelines, and metadata.
- Increase desktop zoom for readability in long-form pages and complex
  sidebars.
- Keep a preferred browser zoom level while navigating between routes.

## Edge Cases

- At very high zoom levels, some wide layouts can require horizontal scrolling.
- Third-party embeds and external media iframes can have their own internal
  scaling behavior.
- Native app wrappers or embedded web views can apply additional zoom
  constraints outside browser defaults.

## Failure and Recovery

- If a page looks clipped after aggressive zoom, reduce zoom level or reset to
  default browser scale.
- If pinch-to-zoom is unavailable on a device, verify browser and OS zoom
  settings, then retry.
- Refreshing the route preserves browser-managed zoom behavior.

## Limitations / Notes

- Mobile viewport scaling is capped at a high maximum zoom level, not unlimited.
- Zoom changes visual scale only; it does not alter ranking, filtering, or data
  returned by APIs.

## Related Pages

- [Shared Index](README.md)
- [Loading Status Indicators](feature-loading-status-indicators.md)
- [Static Asset Delivery Mode](feature-static-asset-delivery-mode.md)
- [Docs Home](../README.md)
