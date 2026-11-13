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

The build does not bake a Sentry release into the bundle
(`config/sentryBuildRelease.ts`, `release.create: false`). A baked commit gave
the client Sentry chunk a new name on every deploy, so returning visitors
downloaded it again. The client, server and edge `Sentry.init` calls set
`release` from `VERSION` instead. The production deploy creates, associates
commits with and finalizes the release once the commit is live (see "Sentry
releases" in `deployment.md`). Source maps resolve through debug IDs, which are
derived from file contents, so they need no release.

## Public Runtime Config And Server-Only Values

Everything in `publicEnvSchema` (`config/env.schema.ts`) is serialized into
`PUBLIC_RUNTIME`, which `next.config.ts` inlines into browser bundles. The same
applies to every key in the `env` block. Neither may hold a credential.

`next.config.ts` validates that value with zod when it bakes a build, and
again when the production server starts. Server code reads it through the
validating `config/env.ts`. Browser bundles resolve `@/config/env` to
`config/env.browser.ts` (a `turbopack.resolveAlias` browser condition in
`config/nextConfig.ts`), which reads the baked value without zod, so the
validator stays out of the client bundle.

The browser's copy, `PUBLIC_RUNTIME_BROWSER`, leaves out the per-build stamp
(`VERSION` and `VERSION_BUILD_TIMESTAMP`, see `config/buildStamp.ts`). Chunk
names are content hashes, so a baked commit gave that chunk a new name on
every deploy and every returning visitor downloaded it again. The root layout
renders `VERSION` as `<html data-version>`, and `config/env.browser.ts` reads
it from there, so the update checker and monitoring read the same value as
before.

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

## Public File Cache Policy

Next.js serves files from `public/` with `Cache-Control: public, max-age=0`
because their names carry no content hash, so a browser re-validates every one
on every page view. `config/staticAssetCacheHeaders.ts` adds a bounded policy
through the shared `headers()` config instead of `immutable`, which would pin old
bytes in browsers after a deploy:

| Files                                                             | `Cache-Control`                                        | Why                                                                                                                                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root-level images and icons (`png`, `jpg`, `svg`, `webp`, `avif`) | `public, max-age=86400, stale-while-revalidate=604800` | Brand assets change a few times a year at most. A replaced file shows within a day for returning visitors and on the next view after that.                                        |
| `/help-index.json`, `/llms.txt`, `/glossary.json`                 | `public, max-age=300, stale-while-revalidate=3600`     | Regenerated on every deploy and read by crawlers and the help bot, so they stay short-lived. Next still sends `ETag` and `Last-Modified`, so a stale copy revalidates with a 304. |

Rules to keep:

- The rule lists exact files from `ROOT_PUBLIC_FILES` (`lib/proxy/publicPaths.ts`),
  not an extension wildcard, so app routes such as `/<profile-handle>.png` never
  receive it. A new root-level image is covered automatically once it is added to
  that list, which the public-path contract test already requires.
- Content-hashed files and `/_next/static/*` carry their own `immutable` policy.
  Put such an entry after this one in `headers()` so it wins (the last matching
  entry sets the final value).
- Development (`NODE_ENV=development` or `local`) skips the rule so edited
  assets appear on reload.
- Files under `public/` subdirectories (`museum`, `nextgen`, `pebbles`, `emojis`,
  `profile-cms`, `delegation-content`, `artwork*`) are not covered and keep
  Next.js defaults.
- The staging access gate in `proxy.ts` lets these paths through untouched and
  never sets `Cache-Control`, and `assetPrefix` only moves `/_next/static/*`,
  so neither changes this policy.

## Root Layout Prerendering and Static Content Pages

`app/layout.tsx` reads nothing from the request. Every visitor gets the same
shell HTML, and the browser makes the per-device decisions:

- `components/providers/EULAConsentStartup.tsx` resolves the native iOS gate in
  the browser. Native startup styles keep the page hidden. If the browser finds
  native iOS without a current acceptance, the commit that reveals the app
  replaces the page with the blocking check.
- The NFT purchasing gate (`useNftPurchasingVisibility`, `NftPurchasingGate`)
  never puts purchasing content in the server HTML. Web and Android mount it in
  the first render after hydration; the iOS app waits for the country check.
  Visible slots render blank, aria-hidden space with the content's first-render
  size until then, so mounting does not move the page.
- The environment badge renders the build's configured `BASE_ENDPOINT` origin.
  Each deployment is built for one host. A browser on another host, such as a
  local server on a different port, gets its own badge right after hydration.

A route that reads no request data and fetches nothing while it renders is
prerendered, `/` included. The layout sets `fetchCache = "force-no-store"`, so
a route that fetches while it renders stays request-time; see Static Rendering
Readiness for why it remains. Wave and chat routes (`/waves`, `/messages`,
`/notifications`, `/my-stream`) stay request-time in their own segments, because
the shell's wave providers read their query during the server render there.

Fixed-content pages opt out with `export const dynamic = "force-static"`.
Next.js then prerenders them, gives them a cacheable `Cache-Control` header, and
returns empty cookies, headers, and search params to the shared shell.

`__tests__/contracts/static-content-pages.test.ts` requires the opt-in on every
migrated WordPress content page. It also rejects request data, search params,
and `fetch` in those pages, because `force-static` hides request data and
caches fetches at build time.

### Static Rendering Readiness

- Shell components rendered on every route must not call `useSearchParams()`
  outside a `<Suspense>` boundary: during a static prerender it fails
  `next build` for that route. Query readers sit in small leaves inside their
  own boundaries, or read after hydration. `MyStreamProvider`
  (`useActiveWaveManager`) and `WaveInformationProvider` read it through
  `contexts/ShellSearchParamsContext.tsx`, whose provider sits above them in
  `Providers.tsx`. On the server, that provider renders a component calling
  `useSearchParams()` only on wave and chat routes (`isWaveChatPathname`), so
  those routes read the query in render as before and public routes never call
  it. Wave and chat segments export `dynamic = "force-dynamic"` so they stay
  request-time: `connection()` in a nested layout or page runs after the shell
  providers have already rendered, too late to stop the prerender. In the
  browser, public routes see no query in the hydration render, matching the
  server HTML, and the live query from the next render on. `proxy.ts` sends
  legacy `/?wave=` links to the wave route.
- A page whose own client components call `useSearchParams()` outside a
  `<Suspense>` boundary also fails the build once it can prerender. Pages that
  still do (`/6529-gradient`, `/meme-accounting`, `/meme-gas`,
  `/nextgen/manager`, `/xtdh`) export `dynamic = "force-dynamic"` until that
  read moves into a boundary.
- `fetchCache = "force-no-store"` keeps every route that fetches while it
  renders request-time, so its data is never frozen into a build-time page.
  Routes that fetch nothing are unaffected by it. It also blocks a page from
  opting into ISR with its own cache policy, so remove it only together with an
  explicit policy for each data route. Do not give those routes a `revalidate`
  while `lib/fetch/ssrFetch.ts` reads the visitor's cookies on every
  first-party request at runtime (but not at build): Next would fail the
  revalidation with "Page changed from static to dynamic at runtime".
- A `force-static` page renders the shell with empty search params on the
  server and real ones in the browser, so shell UI that reads search params in
  the hydration render mismatches for URLs that carry them. A desktop load of
  `/?view=messages` failed hydration (React error 418) that way. `/` therefore
  exports no `dynamic` setting and prerenders in Next's default (`auto`) mode,
  where a reader inside its own `<Suspense>` bails out to client rendering
  instead of reading empty params.

### CSP Nonces

A nonce-based Content Security Policy needs a new nonce for every response.
Next.js adds nonces only during request-time rendering, so a nonce policy would
make prerendered pages dynamic again. Before removing `'unsafe-inline'` from
`script-src`, evaluate options that work with static HTML. Examples are
Next.js Subresource Integrity and hashes for the inline startup scripts in
`app/layout.tsx`. If the team still chooses nonces, record the loss of static
content pages as an explicit trade-off.
