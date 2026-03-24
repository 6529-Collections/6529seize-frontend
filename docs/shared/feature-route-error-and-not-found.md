# Route Errors and Not-Found Screens

## What Users See

- Unknown app route: `404 | PAGE NOT FOUND`.
- Unknown profile route (`/{user}` miss): `404 | USER OR PAGE NOT FOUND`.
- Runtime failure screen:
  - title: `Welcome to the 6529 Page of Doom`
  - support contact: `support@6529.io`
  - optional actions: `Try Again`, `Show Stacktrace`, `Copy`

## Route and Boundary Map

- Missing non-profile route -> global not-found fallback (`app/not-found.tsx`).
- Missing profile route -> profile not-found fallback (`app/[user]/not-found.tsx`).
- Route-segment render failure -> route error boundary (`app/error.tsx`).
- Global render failure -> global error boundary (`app/global-error.tsx`).
- App-shell client render failure -> layout fallback (`components/providers/LayoutErrorFallback.tsx`).
- Manual diagnostics screen -> `/error` (`app/error/page.tsx`), supports `?stack=<encoded-message>`.
- Proxy hard failure before route render -> redirect to `/error`.

## Entry Points

- Open a URL that does not resolve.
- Open a profile route for a missing user.
- Trigger a route, layout, or global render exception.
- Trigger an app-shell client exception inside the layout error boundary.
- Open `/error` directly, with or without `?stack=...`.
- Open `/sentry-example-page` and press `Throw Sample Error`.

## Recovery Behavior

- `404` pages are terminal for that URL and show no home/back action.
- `Try Again` appears only when a boundary provides a reset callback.
- Plain `/error` does not show `Try Again`.
- `Show Stacktrace` appears only when stack text or digest exists.
- Expanded diagnostics show digest first (if present), then stack text.
- `Copy` appears only while diagnostics are expanded.
- `Copy` payload is plain text: digest + stack text, and the button flips to `Copied` briefly.

## Monitoring and Privacy

- Route and global error boundaries capture exceptions only when `SENTRY_DSN` is set.
- Sentry initialization is disabled when `SENTRY_DSN` is not set.
- Payload sanitization removes request cookies/body/query data, strips URL query/hash, and redacts sensitive headers and secret-like fields.
- Session Replay is enabled only when `NODE_ENV=production` and `SENTRY_REPLAY_ENABLED=true`.
- If Sentry is blocked by network/policy, fallback screens still render.
- On `/sentry-example-page`, `Throw Sample Error` is disabled when Sentry connectivity reports `sentry-unreachable`.

## Limitations

- Error and not-found screens do not suggest alternate routes.
- Stacktrace tools are hidden when no digest/stack data exists.
- Copied diagnostics are plain text and can be long.

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [Navigation Index](../navigation/README.md)
- [Internal Link Navigation](../navigation/feature-internal-link-navigation.md)
- [Profile Tabs](../profiles/navigation/feature-tabs.md)
