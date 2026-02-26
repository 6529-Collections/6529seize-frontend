# Mobile App Landing Page

## Overview

`/open-mobile` is the handoff page used to bridge between web links and the 6529
mobile app. When a target path is provided, it attempts to open the mobile app
first, then keeps app-store actions visible as a fallback.

## Location in the Site

- Route: `/open-mobile?path=<encoded-path>`
- Visible UI:
  - An app-opening loading message.
  - One or both mobile store actions.
  - A `Back to 6529.io` fallback button.

## Entry Points

- Shared deep links that resolve to the mobile app deep-link scheme.
- Manual navigation to `/open-mobile` with an encoded `path` query value.

## User Journey

1. Open `/open-mobile` with a `path` value, for example
   `/open-mobile?path=%2Fwaves%2F123`.
2. The page attempts a deep-link redirect to the 6529 mobile scheme with the
   decoded path.
3. The page stores that decoded path for fallback navigation.
4. If needed, use the store buttons to open the app from the store.
5. If app handoff is skipped or canceled, tap `Back to 6529.io` to return to
   the decoded path on the web site.

## Common Scenarios

- Apple mobile clients (including iPad with touch context):
  - show only the iOS app action.
- Android clients:
  - show only the Android app action.
- Desktop and unclassified environments:
  - show both iOS and Android store actions so users can choose.
- If `path` is missing:
  - `Back to 6529.io` returns to site root.

## Edge Cases

- The deep link is initiated in an effect after first render, so users may briefly
  see the fallback screen before the app receives the URL.
- Store actions are rendered with direct links and full-page redirects, so app-store
  failures still provide a manual path to continue.
- `Back to 6529.io` always returns to the path captured from `path` (or `/` if
  not provided).

## Failure and Recovery

- If app scheme handoff does not start or is declined, users can still choose
  store actions without losing context.
- If a store action is not suitable for the user’s device, they can still use the
  provided fallback path back to web.
- If the `path` value cannot be used by the app, users can still navigate web
  route recovery from the fallback button.

## Limitations / Notes

- The page relies on app scheme handling support in the browser/device.
- iOS/Android detection uses client-side device signals and can be conservative on
  ambiguous user agents.

## Related Pages

- [Navigation Index](README.md)
- [Internal Link Navigation](feature-internal-link-navigation.md)
- [Wave Chat Scroll Behavior](../waves/chat/feature-scroll-behavior.md)
- [Docs Home](../README.md)
