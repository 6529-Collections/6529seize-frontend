# Next Config Runtime Rationale

## React Strict Mode

`reactStrictMode` is intentionally disabled in the shared Next.js config.

Next.js recommends Strict Mode and enables it by default for App Router apps, but
Strict Mode is a development-only diagnostic feature. This app has a large
client-side surface with wallet, websocket, media, editor, and mobile bridge
integrations where double-invoked development effects can create noisy
connectivity and lifecycle behavior before each integration has been audited.

Keep the global flag disabled until the high-risk client integrations have
Strict Mode coverage and route-level smoke testing. New or isolated React code
can still be migrated incrementally with local `<React.StrictMode>` wrappers.

## Production Browser Source Maps

Production browser source maps must not be enabled in the shared Next.js config.

Next.js writes production browser source maps beside the generated JavaScript and
serves them when requested. That is useful for debugging, but it also publishes
more source detail than the app needs to expose to browsers.

Sentry remains the approved production symbolication path. When `SENTRY_DSN` is
set, `withSentryConfig` generates and uploads the needed source maps during the
build. The Sentry config also deletes uploaded source maps from the build output
so stack traces stay readable in Sentry without making browser-served maps part
of the deployed static asset surface.
