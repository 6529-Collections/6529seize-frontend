# Roadmap

Roadmap material for this repository lives here. Use this folder for planning,
sequencing, milestones, decision notes, and future-work context that supports
repository operations but should not appear in user-facing product docs.

Keep roadmap pages current-state oriented. Archive or replace stale plans
instead of leaving conflicting guidance in place.

## Agent Release Railway Roadmap

Last reviewed: 2026-06-11 against `origin/main` at `334b02c57`.

The repository is moving from one-human-per-PR review toward a higher-throughput
agent development model. The operating goal is to stop treating "PR opened" as
the main holding point. Agents should be able to classify, validate, merge, and
exercise suitable work on staging, while humans reserve their attention for
production release decisions and genuinely high-risk changes.

The production gate stays human-owned. The system below is intended to make
staging and release state explicit enough that humans can decide "what should
ship now?" from evidence rather than reconstructing branch history by hand.

### P1: Add PR Risk Lanes

Create a deterministic PR classifier backed by a repo-owned policy file, for
example `ops/risk-areas.yml`. The classifier should inspect changed paths,
dependency deltas, generated files, configuration files, diff size, and PR
metadata, then apply GitHub labels and leave a short PR comment explaining the
classification.

Initial labels:

- `risk:low`, `risk:medium`, and `risk:high`.
- Area labels such as `area:waves`, `area:auth-wallet`,
  `area:media-resolver`, `area:deps`, `area:deploy`,
  `area:generated-api`, `area:security`, `area:ui-copy`, and `area:docs`.
- Flow labels such as `staging:eligible`, `staging:queued`,
  `staging:deployed`, `staging:passed`, `staging:failed`,
  `release:candidate`, `release:hold`, and `release:blocked`.

Default risk rules should be conservative:

- Low risk: docs, tests, isolated copy changes, and small leaf UI changes that
  do not touch shared state, auth, APIs, deployment, or generated code.
- Medium risk: shared UI, hooks, Waves behavior, cache updates, visible UX
  changes, profile flows, and changes that require focused browser validation.
- High risk: wallet/auth/signing, dependencies, `next.config.ts`, `proxy.ts`,
  CSP/security headers, OpenAPI/generated models, IPFS/IPNS/Arweave/media
  resolution, deployment scripts, app-wallet code, and production environment
  behavior.

Human overrides should be possible, but overrides must be explicit labels with
an accompanying reason in the PR discussion.

### P1: Treat Staging As The Integration Surface

Use staging to test integrated work before production selection. The preferred
branch model is:

- `main` acts as the agent integration trunk.
- Low and medium risk PRs can merge to `main` after required automated checks,
  bot review, and focused validation pass.
- High risk PRs can receive staging validation, but require explicit human
  approval before merging to the integration trunk unless the policy is later
  relaxed.
- Current frontend production deploys from `origin/main` only. Production must
  use the same `origin/main` SHA or ordered release set that passed staging. If
  `origin/main` advances after staging validation, rerun staging or pause merges
  before promotion.

This keeps new work based on a common codebase while preserving production
safety through explicit staging evidence and human production approval.

### P1: Build A Staging Train

Add a staging train workflow that serializes deploys and records exactly what
is on staging. It should build on the existing staging pattern of a dedicated
staging branch, serial deploy concurrency, and expected-SHA verification.

Triggers:

- PR merged to `main`.
- Manual dispatch.
- Applying a staging queue label.
- A scheduled bus, initially using a 30 minute maximum batching window under
  backlog. If staging is idle and one eligible release set is ready, deploy
  immediately instead of waiting for the clock.

Behavior:

- Collect merged PRs that have not yet been deployed to staging.
- Bundle waiting eligible changes when the queue is non-empty or the scheduled
  bus fires.
- Update the staging deploy target and create a GitHub Deployment for an
  environment such as `staging-integration`.
- Store the deployed SHA, included PRs, risk labels, touched areas, and required
  test packs in the deployment payload or an attached artifact.
- Run staging smoke/E2E checks after the deploy.
- Comment the staging result back onto included PRs and update flow labels.

The train should support two modes:

- Immediate mode: deploy one change when staging is idle and the queue is small.
- Bus mode: deploy all waiting eligible changes on the fixed interval so PR
  velocity cannot create an infinite queue.

### P1: Add Staging-Targeted E2E

Make Playwright capable of testing an already deployed staging URL without
starting a local dev server.

Implementation direction:

- Add a `PLAYWRIGHT_BASE_URL` or equivalent environment override.
- Add a `PLAYWRIGHT_SKIP_WEB_SERVER` or equivalent flag for remote targets.
- Add a `6529 run test:e2e:staging` command that targets the staging host.
- Keep the existing local E2E path for localhost development.

Organize tests into small packs that can be selected from risk and area labels:

- `e2e/smoke`
- `e2e/waves`
- `e2e/auth-wallet`
- `e2e/media`
- `e2e/profiles`
- `e2e/delegation`
- `e2e/distribution-plan`

Initial label mapping:

- `area:waves` runs smoke plus Waves tests.
- `area:auth-wallet` runs smoke plus auth-wallet tests.
- `area:media-resolver` runs smoke plus media tests.
- `area:deps` runs smoke, build, and a broader selected suite.
- `area:deploy` runs build, deployment health, and smoke.

Agents should also perform exploratory browser checks for visible behavior, but
the scripted E2E packs are the durable release signal.

### P1: Promote To Production From A Staging-Passed Main SHA

Production releases should be selected batches of validated work.

Flow:

- Resolve the latest production SHA from the last successful production deploy.
- Generate a release manifest.
- Verify the candidate is the current `origin/main` SHA and has passed staging
  as the same ordered release set.
- If new commits land on `origin/main` after staging passed, rerun staging for
  the new release set or pause merges before final validation.
- Require human approval of the manifest before production deploy.
- Deploy production through the existing production workflow against `main`.

The release manifest should include:

- PR number, title, author or agent, risk, areas, and commit SHA.
- Staging deployment SHA and staging validation result.
- Checks and E2E packs run.
- Known caveats and intentionally skipped validation.
- Include, hold, or blocked decision with reason.
- Rollback notes.

High-risk PRs must require explicit human inclusion in the release manifest.

Longer term, add a second environment:

- `staging-integration`: noisy, continuous, agent-tested.
- `preprod-release`: quiet, exact production candidate.

Until that exists, schedule release freezes where staging temporarily validates
the exact `origin/main` production candidate.

### P1: Create A Release Dashboard And Ledger

Use GitHub as the source of truth first, then add repo CLI helpers when the
workflow is stable.

Data sources:

- PR labels and comments.
- GitHub Deployments and deployment statuses.
- Workflow runs and artifacts.
- Release branch manifests.
- Latest production deployment SHA.

Dashboard views:

- Open PRs grouped by risk and area.
- Merged PRs not yet deployed to staging.
- Current staging SHA and included PRs.
- Staging failures with failing checks and owners.
- Validated PRs not yet included in a release.
- Current release candidate contents.
- High-risk holds.
- Production lag from the integration trunk.

The most important health metrics are:

- Number of integration commits ahead of production.
- Number of high-risk commits ahead of production.
- Number of validated low/medium PRs waiting for release.
- Median time from PR merge to staging validation.
- Median time from staging validation to production release decision.

### Suggested Build Order

1. Add risk policy, classifier, labels, and PR comments.
2. Add staging Playwright base-URL support.
3. Add GitHub Deployment-based staging ledger.
4. Add the staging train workflow with serial and scheduled deploy modes.
5. Add per-PR staging result comments.
6. Add release manifest generation and production candidate preflight.
7. Add pre-production or final-smoke release validation.
8. Add a `ghtrain`-style dashboard or CLI once the data model is stable.

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
