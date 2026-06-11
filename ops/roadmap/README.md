# Roadmap

Roadmap material for this repository lives here. Use this folder for planning,
sequencing, milestones, decision notes, and future-work context that supports
repository operations but should not appear in user-facing product docs.

Keep roadmap pages current-state oriented. Archive or replace stale plans
instead of leaving conflicting guidance in place.

## Public Rendering And SEO Roadmap

Last reviewed: 2026-06-11 against `origin/main` at `278c5fa1a`, with the
public rendering audit focused on App Router route metadata, server-rendered
body content, sitemap/canonical behavior, and structured data coverage.

The app has useful route metadata and a growing structured data layer, but many
important public pages still render their substantive visible content after
client-side fetches. For example, `app/the-memes/[id]/page.tsx` emits metadata
and JSON-LD on the server, then delegates the actual detail page experience to
`components/the-memes/MemePage.tsx`. Similar patterns exist for Meme Lab,
6529 Gradient, ReMemes, collection grids, homepage dynamic sections, and
Discover. Profiles and NextGen token pages are stronger examples because they
already fetch meaningful public data on the server and pass it into rendered
layouts.

The root layout currently exports `fetchCache = "force-no-store"` in
`app/layout.tsx`, which makes cacheable public rendering and ISR unavailable by
default across the route tree. Treat that as the first architectural constraint
to resolve before assuming static or revalidated public pages can work.

### P1: Establish Public Versus Personalized Rendering Boundaries

Separate public, crawlable rendering from authenticated and wallet-personalized
behavior.

Remediation:

- Remove root-level `fetchCache = "force-no-store"` and keep the shared root
  layout cache-neutral.
- Move `no-store` behavior to authenticated route segments, request-specific
  fetches, or components that truly depend on cookies, wallet state, or private
  session data.
- Add or document a public server fetch path that does not read request cookies
  or attach auth headers, and gives public data explicit `revalidate` rules.
- Keep wallet ownership, write actions, user-specific controls, private waves,
  and live-only UI client-rendered or explicitly uncached.

### P1: Server-Render High-Value Public Page Shells

Render the crawlable public content in the initial HTML, then hydrate the
interactive app experience on top.

Remediation:

- Start with `/the-memes/[id]` as the reference implementation: server-render
  the token title, artwork, artist, description, edition/supply, drop details,
  breadcrumbs, and a small public stats snapshot.
- Apply the same pattern to `/meme-lab/[id]`, `/6529-gradient/[id]`,
  `/rememes/[contract]/[id]`, and `/nextgen/token/[token]` where any content is
  still effect-only after hydration.
- Server-render the first page or top public items for `/the-memes`,
  `/meme-lab`, `/6529-gradient`, `/rememes`, `/discover`, and homepage dynamic
  sections, then hydrate filters, sorting, infinite scroll, and live refreshes.
- For Waves, either provide a public share/SEO shell for public waves and drops
  or explicitly keep private/app-only surfaces out of the index.

### P1: Define Canonical, Sitemap, And Indexing Policy

Avoid asking crawlers to choose between route variants that the app has not made
distinct in server-rendered HTML.

Remediation:

- Add `metadataBase` in the shared metadata helper and emit route-specific
  `alternates.canonical` values for public pages.
- Normalize trailing slash and query-string behavior across metadata,
  redirects, and sitemap output.
- Remove `?focus=...` sitemap entries unless those tab URLs have unique
  crawlable server-rendered content and explicit self-canonicals.
- Use real API update/mint timestamps for sitemap `lastmod` where available
  instead of build time for every URL.
- Migrate legacy pages that render manual `<title>`, `<meta>`, and canonical
  tags in JSX into App Router `metadata` or `generateMetadata`.

### P2: Align Structured Data With Visible Server Content

Structured data should describe content that is also present in the rendered
HTML response.

Remediation:

- Keep using the shared JSON-LD helpers, but expand coverage to ReMemes,
  collection list pages, article/category pages, and profile tabs where they
  are meant to be indexed.
- Add consistent `BreadcrumbList` data for public token/detail routes.
- Use `CollectionPage` and `ItemList` for server-rendered collection grids.
- Keep `VisualArtwork` or NFT-like structured data on detail pages aligned with
  the server-rendered title, image, creator, description, and collection data.

### P2: Add Public HTML Snapshot Verification

Prevent regressions where metadata exists but the meaningful page body is only
available after JavaScript executes.

Remediation:

- Add focused tests or scripts that fetch representative public routes and
  assert the raw HTML contains the expected H1, canonical link, primary image
  metadata, JSON-LD, and first set of public cards/details.
- Cover at least `/`, `/the-memes`, `/the-memes/1`, one Meme Lab token, one
  Gradient token, one ReMeme, one public profile, one NextGen token, and one
  public Wave/share route if indexing is intended.
- Run `6529 run build` during the implementation work to inspect route
  static/dynamic indicators after cache boundary changes.

## Security Remediation Backlog

Last verified: 2026-06-11 against `origin/main` at `124d99859` and the open
pull requests #186, #208, #2584, #2589, #2590, and #2591-#2598.

This backlog tracks non-wallet security audit items that were not corrected on
`origin/main` and are not covered by the outstanding pull requests reviewed
above. Wallet-handling findings are intentionally excluded because they are
tracked in the separate wallet audit thread.

Already addressed on `origin/main` and not listed below:

- Direct production dependency advisories for `axios` and `js-cookie`; main now
  uses `axios@1.16.0` and `js-cookie@3.0.7`.
- Unbounded HTML/JSON reads in the public preview routes; main now uses shared
  byte-limited body readers in the Open Graph, Farcaster, and Pepe preview
  paths.
- The DNS rebinding gap in the public URL guard; main now validates DNS results
  and uses a pinned `undici` lookup dispatcher for guarded fetches.
- The unbounded Alchemy token metadata batch path; main now has request body
  limits, a 100-token cap, caching, and basic request rate limiting.

### P1: Remove Secret-Like Values From Public Runtime Config

`next.config.ts` still serializes the complete `publicEnv` into
`PUBLIC_RUNTIME` and individual browser-bundled env values, including
`STAGING_API_KEY`, `DEV_MODE_AUTH_JWT`, `FARCASTER_WARPCAST_API_KEY`, IPFS RPC
endpoints, and `IPFS_MFS_PATH`. Client auth helpers still read staging/dev auth
values from that public config.

Remediation:

- Split truly public configuration from server-only secrets and operational
  credentials.
- Keep staging auth, dev auth JWTs, third-party API keys, and writable service
  endpoints out of `next.config.ts env` and `.next/PUBLIC_RUNTIME.json`.
- Fail production/staging builds when `USE_DEV_AUTH` or equivalent dev auth
  values are enabled.
- Rotate any credential-like values that were ever deployed through the public
  runtime bundle.

### P1: Put Server-Side Quotas Around Remaining Alchemy Proxy Routes

`app/api/alchemy/collections/route.ts` and
`app/api/alchemy/owner-nfts/route.ts` still proxy anonymous user input through
the server Alchemy API key. The token metadata route has been capped, but these
routes still need comparable controls.

Remediation:

- Add rate limiting, bounded upstream response reads, and request timeouts.
- Validate `owner`, `contract`, `chain`, and `pageKey` inputs before calling
  Alchemy.
- Restrict supported networks explicitly and reject unknown chain values.
- Consider requiring app auth or moving these calls behind the backend quota
  layer if the frontend API key proxy is not intended to be public.

### P1: Stop Exposing Writable IPFS RPC From Browser Code

Profile image upload code still instantiates `IpfsService` in the browser using
public `IPFS_API_ENDPOINT` and `IPFS_MFS_PATH`, then calls `/api/v0/add`,
`/api/v0/files/mkdir`, `/api/v0/files/stat`, and `/api/v0/files/cp` directly.
The development setup points `IPFS_API_ENDPOINT` at `https://api-ipfs.6529.io`.

Remediation:

- Move IPFS writes behind an authenticated server route or backend service.
- Enforce server-side file size, content type, malware/image validation, user
  authorization, and per-user quota before pinning or writing to MFS.
- Keep writable IPFS RPC endpoints private or protected by short-lived upload
  tokens that cannot be reused outside the intended upload flow.
- Remove MFS write paths from public runtime configuration.

### P2: Sandbox Untrusted NFT And NextGen HTML Media

The hardened `SandboxedExternalIframe` component exists, but NFT and NextGen
renderers still create plain iframes for metadata-derived animation URLs.
Several metadata-derived `window.open` calls also omit `noopener,noreferrer`.

Remediation:

- Route NFT and NextGen interactive HTML through `SandboxedExternalIframe` or
  the same sandbox/canonicalization policy.
- Apply the existing interactive media URL allowlist/canonicalization to all
  metadata-derived HTML media URLs.
- Add `noopener,noreferrer` to metadata-derived `window.open` calls.
- Add regression tests covering unsafe schemes, disallowed hosts, and sandbox
  attributes.

### P3: Remove Or Gate The Public Sentry Example Route

`app/api/sentry-example-api/route.ts` remains public and intentionally throws on
every GET request, with a public example page that triggers it.

Remediation:

- Remove the example route/page from production builds, or gate them behind a
  local/dev-only flag or admin-only check.
- Add a test or route inventory assertion so intentional error fixtures do not
  ship publicly by accident.

### P3: Sanitize Or Render NextGen Artist Signatures As Text

`NextGenCollectionDetails` still renders `collection.artist_signature` via
`dangerouslySetInnerHTML`.

Remediation:

- Render the value as text if signatures are expected to be plain strings.
- If markup is required, sanitize against a small allowlist and add tests for
  script, event-handler, and unsafe URL payloads.

### P3: Continue CSP Tightening

The CSP has improved on `origin/main`: `object-src` is now `'none'`, and
`unsafe-eval` is conditional. The policy still allows inline scripts/styles and
broad HTTPS/WSS/image sources for operational compatibility.

Remediation:

- Move remaining inline scripts and styles to nonce/hash-based allowances where
  practical.
- Replace broad `https:`/`wss:` sources with documented service allowlists as
  media, wallet, analytics, and upload paths become better centralized.
- Keep `unsafe-eval` disabled outside local/dev tooling.
