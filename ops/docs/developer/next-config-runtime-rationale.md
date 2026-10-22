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

## Request-Time Root Layout and Static Content Pages

`app/layout.tsx` reads cookies and request headers, and the root layout sets
`fetchCache = "force-no-store"`. Routes therefore render per request by
default. That default protects routes whose shell reads request data:

- The native iOS EULA gate uses the `native-ios` and `eula-consent` cookies.
- The environment badge uses the request host.
- The global server `fetch` wrapper (`lib/fetch/ssrFetch.ts`) reads the
  visitor's auth cookies for API requests. Calling `cookies()` keeps any route
  that fetches from the API out of static generation.

Fixed-content pages opt out with `export const dynamic = "force-static"`. Next.js
then prerenders them, gives them a cacheable `Cache-Control` header, and returns
empty cookies, headers, and search params to the shared shell:

- `components/providers/EULAConsentStartup.tsx` resolves the native iOS gate in
  the browser. Native startup styles keep the prerendered page hidden. If the
  browser finds native iOS without a current acceptance, the commit that
  reveals the app replaces the page with the blocking check.
- The environment badge uses the build's configured `BASE_ENDPOINT` origin.

`__tests__/contracts/static-content-pages.test.ts` requires the opt-in on every
migrated WordPress content page. It also rejects request data, search params,
and `fetch` in those pages, because `force-static` hides request data and
caches fetches at build time.

Making static rendering the default for all routes needs more work. Removing
the cookie and header reads alone breaks `next build`: once a route is eligible
for prerendering, shell components that call `useSearchParams()` outside a
`<Suspense>` boundary stop the build. These components include
`VersionStatusProvider`, `MixpanelSetup`, `MyStreamProvider`, `TitleProvider`,
`WaveInformationProvider`, `NavigationHistoryProvider`, `QuickDirectMessagesGate`,
and the sidebar Share trigger and QR modal.

### CSP Nonces

A nonce-based Content Security Policy needs a new nonce for every response.
Next.js adds nonces only during request-time rendering, so a nonce policy would
make prerendered pages dynamic again. Before removing `'unsafe-inline'` from
`script-src`, evaluate options that work with static HTML. Examples are
Next.js Subresource Integrity and hashes for the inline startup scripts in
`app/layout.tsx`. If the team still chooses nonces, record the loss of static
content pages as an explicit trade-off.
