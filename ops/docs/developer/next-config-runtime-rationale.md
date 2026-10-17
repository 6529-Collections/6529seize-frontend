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

## Public File Cache Policy

Next.js serves files from `public/` with `Cache-Control: public, max-age=0`
because their names carry no content hash, so a browser re-validates every one
on every page view. `config/staticAssetCacheHeaders.ts` adds a bounded policy
through the shared `headers()` config instead of `immutable`, which would pin old
bytes in browsers after a deploy:

| Files | `Cache-Control` | Why |
| --- | --- | --- |
| Root-level images and icons (`png`, `jpg`, `svg`, `webp`, `avif`) | `public, max-age=86400, stale-while-revalidate=604800` | Brand assets change a few times a year at most. A replaced file shows within a day for returning visitors and on the next view after that. |
| `/help-index.json`, `/llms.txt`, `/glossary.json` | `public, max-age=300, stale-while-revalidate=3600` | Regenerated on every deploy and read by crawlers and the help bot, so they stay short-lived. Next still sends `ETag` and `Last-Modified`, so a stale copy revalidates with a 304. |

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
