# Route Errors and Not-Found Screens

## Overview

Users see dedicated full-screen surfaces for unrecoverable route failures and missing routes.
This covers:

- `500`-style runtime error screens from route, layout, and global error boundaries.
- `404` screens for missing routes.

The error screen includes a support contact and optional diagnostics actions for recoverable
errors.

## Location in the Site

- Missing routes across the app:
  - `/` subroutes that do not exist.
  - Invalid profile routes under `/{user}` when the user or tab does not resolve.
- Route or layout exceptions:
  - Errors thrown while rendering a page segment.
  - Errors inside the main layout wrapper.
- Manual diagnostic URL for shared route-level errors:
  - `/error?stack=<encoded-message>`

## Entry Points

- Open a URL that does not exist.
- Open a page route that throws during render.
- Return to a route after an in-app exception and rely on retry actions.
- Open a route with a prebuilt `stack` query parameter for diagnostics.

## User Journey

1. User opens a route.
2. If the route resolves, normal content renders.
3. If resolution fails:
   - the app shows the `404` page for unknown routes.
4. If rendering fails:
   - the app shows the error page with a support email and optional stack trace
     tools.

## Common Scenarios

- Unknown URL:
  - `404 | PAGE NOT FOUND` appears for regular routes.
- Unknown user route:
  - `404 | USER OR PAGE NOT FOUND` appears when `/{user}` cannot resolve.
- Runtime exception in content rendering:
  - `Welcome to the 6529 Page of Doom` screen appears.
- Recoverable rendering error:
  - `Try Again` appears and can be used to re-run the route render path.

## Failure and Recovery

- Not-found screens are terminal for that URL.
- Stack trace availability:
  - If an error object has diagnostics, users can expand `Show Stacktrace`.
  - Expanded diagnostics show full trace text and optional digest.
  - Copy is available from the expanded panel and sets temporary `Copied` state.
- Retry behavior:
  - `Try Again` resets only when reset is available from the active error boundary
    (for example, route and layout errors).
  - Without a reset action, users can refresh, reopen the route, or contact support.

## Edge Cases

- If no stack trace is available, the stack section is hidden.
- For profile-like unknown routes, users receive the `USER OR PAGE` variant of the
  not-found title.
- In production, stack details are still shown when available from the error object.
- Stack text is copied as plain text; long traces can be pasted into issue reports.

## Limitations / Notes

- The stack section is optional and not always visible on first render.
- The page does not render home or back links.
- Support contact shown on error screens is:
  - `support@6529.io`.
- Copy behavior is disabled for a short duration after each copy action.

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [Navigation Index](../navigation/README.md)
- [Internal Link Navigation](../navigation/feature-internal-link-navigation.md)
- [Profile Navigation Failure Cases](../profiles/navigation/feature-tabs.md)
