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

## Public Runtime Config And Server-Only Values

Everything in `publicEnvSchema` (`config/env.schema.ts`) is serialized into
`PUBLIC_RUNTIME`, which `next.config.ts` inlines into browser bundles. The same
applies to every key in the `env` block. Neither may hold a credential.

Server-only values are read at request time through `config/serverEnv.ts`:

- `STAGING_API_KEY`: the `x-6529-auth` value server-side requests send to a
  staging API when the visitor has no access cookie. `lib/fetch/ssrFetch.ts`
  adds it to first-party API requests that carry no access value, and the OG
  image routes use it for crawlers. Browser requests and the staging access
  gate in `proxy.ts` use only the visitor's access cookie.
- `FARCASTER_WARPCAST_API_KEY`: used by the Farcaster preview route.

Dev auth (`USE_DEV_AUTH`, `DEV_MODE_AUTH_JWT`, `DEV_MODE_WALLET_ADDRESS`) must
reach the browser in local development, so it stays in the public schema with
two guards. `config/devAuth.ts` ignores it outside development and test
runtimes, and `config/devAuthBuildGuard.ts` fails any production build whose
`BASE_ENDPOINT` is not `localhost` or `127.0.0.1` while one of those values is
set.
