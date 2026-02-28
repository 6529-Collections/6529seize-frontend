# Browser Zoom and Pinch Scaling

Parent: [Shared Index](README.md)

## Overview

Browser sessions keep page zoom enabled. Capacitor native sessions lock page
scale to `1`. Shared form styles in native sessions and
`mobile-wrapper-dialog` keep text-entry controls readable and reduce
focus-triggered zoom jumps.

## Location in the Site

- Any app-shell route rendered by the shared root layout in web browsers.
- Any app-shell route opened in the native Capacitor app wrapper (iOS/Android).
- Bottom-sheet or dialog flows using the shared `mobile-wrapper-dialog` class.

## Entry Points

- Open a route in a desktop or mobile browser and use browser zoom controls.
- On touch browsers, use pinch gestures.
- Open the same route in the native app wrapper.
- Focus text fields (`input`, `textarea`, `select`, `[contenteditable="true"]`)
  while editing.

## User Journey

1. In a web browser, open any route at default scale.
2. Zoom in/out with `Cmd/Ctrl + +/-`, browser menu controls, or pinch.
3. Keep navigating; the app does not override browser-managed zoom level.
4. In the native wrapper, viewport is forced to
   `initial/minimum/maximum scale = 1` with `user-scalable=no`, so page
   zoom and pinch zoom are disabled.
5. While editing in native sessions and shared mobile dialogs, form fields keep
   at least `16px` text sizing plus `touch-action: manipulation` for more
   stable tap and focus behavior.

## Common Scenarios

- Increase web zoom for readability on dense feeds or long-form pages.
- Keep a preferred browser zoom level while moving between routes.
- Edit form content in native sessions without automatic page zoom on focus.
- Use bottom-sheet dialog forms on mobile with stable tap/edit behavior.

## Edge Cases

- Very high web zoom can require horizontal scrolling in wide layouts.
- Third-party embeds/iframes can apply their own internal zoom behavior.
- Native wrapper sessions intentionally disable browser-style pinch/page zoom.

## Failure and Recovery

- If layout looks clipped after heavy web zoom, reduce zoom or reset with
  `Cmd/Ctrl + 0`.
- If pinch-to-zoom is unavailable in the native app wrapper, this is expected;
  open the route in a browser session when pinch zoom is required.
- If browser zoom behaves unexpectedly after device/browser setting changes,
  reload the route.

## Limitations / Notes

- Web viewport zoom is capped at `maximumScale: 10`.
- Native wrapper viewport uses
  `width=device-width,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no`.
- This page covers browser/page zoom behavior, not media-viewer-specific zoom
  controls.

## Related Pages

- [Shared Index](README.md)
- [Wave Image Viewer and Scaling](../waves/drop-actions/feature-image-viewer-and-scaling.md)
- [Static Asset Delivery Mode](feature-static-asset-delivery-mode.md)
- [Mobile App Landing Page](../navigation/feature-mobile-app-landing.md)
- [Docs Home](../README.md)
