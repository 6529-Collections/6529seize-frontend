# Mobile App Landing Page

## Overview

`/open-mobile` is a web handoff page for the 6529 mobile app.
When `path` is provided, it tries an app deep link first and keeps store and
return actions visible.

## Location in the Site

- Route: `/open-mobile` (optional `path` query).
- Query format: `path=<url-encoded-route>`, for example `%2Fwaves%2F123`.
- Visible UI:
  - `Opening 6529 Mobile...`
  - `Get 6529 Mobile` with platform store actions
  - `Back to 6529.io`

## Entry Points

- A shared web URL that points to `/open-mobile?path=...`.
- Manual navigation to `/open-mobile` with or without `path`.

## User Journey

1. Open `/open-mobile`.
2. If `path` exists, the page decodes it and builds
   `<MOBILE_APP_SCHEME>://navigate<decoded-path>`.
3. The browser attempts to open that deep link.
4. If the app does not open, use the iOS/Android store action.
5. Use `Back to 6529.io` to return to `<origin><decoded-path>`, or `/` when no
   decoded path is available.

## Common Scenarios

- Apple mobile clients (including iPad touch-desktop UA): show only iOS action.
- Android clients: show only Android action.
- Desktop and unclassified environments: show both store actions.
- Missing `path`: no deep-link attempt; `Back to 6529.io` returns to `/`.

## Edge Cases

- The page is client-only; users can see a brief blank state before content mounts.
- Deep-link redirect runs after first client render, so the landing UI can flash
  briefly before app handoff.
- Store actions force top-level full-page redirects to app-store URLs.
- `path` must be valid URL encoding and should decode to an app/web route.

## Failure and Recovery

- If app handoff is blocked or canceled, use store actions to install/open app.
- If store actions are not useful for the current device, use `Back to 6529.io`.
- To retry handoff, reopen `/open-mobile` with a valid encoded `path`.

## Limitations / Notes

- App handoff depends on browser/device support for custom URL schemes.
- The page does not show explicit in-page error or retry UI for failed
  deep-link handoff.
- Route validation is limited to URL decoding; invalid route shapes are not
  corrected on this page.

## Related Pages

- [Navigation Index](README.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
- [Internal Link Navigation](feature-internal-link-navigation.md)
- [Docs Home](../README.md)
