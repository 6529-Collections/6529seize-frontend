# Profile Native CMS Agentic Storm Execution Plan

Last updated: 2026-06-17.

## Purpose

Organize the profile-native CMS roadmap into logical phases that many agents can
execute aggressively in parallel.

This is the storm map. The deeper product detail lives in:

- `product-technical-roadmap.md`
- `art-nft-display-best-practices.md`
- `active-context.md`
- `run-log.md`

## North Star

Ship a profile-native CMS where any 6529 profile can publish a signed,
content-addressed, decentralized website at `/{handle}/index.html`, while the
normal profile remains at `/{handle}`.

The first public version should prove the whole architecture:

- Profile website route.
- Profile page website button.
- Signed immutable package.
- IPFS and/or Arweave storage receipt.
- 6529 CDN acceleration as convenience only.
- Simple guided builder.
- Wallet gallery generator.
- Home, collection, and NFT pages.
- Strong 2D art/NFT display.
- Basic 3D room/object display primitives.
- Package export and provenance.
- AI-agent affordances: schemas, source packets, MCP, `SKILL.md`, validation,
  and patch review.

## Storm Rules

### Rule 1: Package Contract First

No large implementation lane should invent its own package shape.

Before feature PRs fan out, lock:

- Schema names.
- Canonical JSON/hash rules.
- Package fixture corpus.
- Route manifest rules.
- Storage receipt rules.
- Signature envelope rules.
- Pointer event rules.
- Art/NFT media entity names.

### Rule 2: Small PRs, Shared Fixtures

Agents should work in small PRs that compile against shared fixtures.

Required shared fixtures:

- Minimal profile homepage package.
- Wallet gallery package.
- NFT detail package.
- Collection page package.
- Art/media package with image/video/model/poster variants.
- 3D room package.
- Invalid package corpus.
- Legacy/migration package for Museum/Capital-style content.

### Rule 3: Parallel Lanes, Explicit Owners

Each lane owns paths and APIs. Cross-lane edits require a comment in the PR
description explaining why.

### Rule 4: Feature Flags Until The Path Is Whole

Use feature flags or hidden routes until:

- Package validates.
- Route renders.
- Publish signs.
- Storage receipt exists.
- Profile link works.
- Browser checks pass.

### Rule 5: Decentralization Is A Gate, Not A Slogan

For launch scope, every published package must be:

- Downloadable.
- Hashable.
- Signed.
- Validatable.
- Stored on decentralized storage or explicitly blocked from public launch.
- Renderable from package data without live indexer access.

### Rule 6: Agents Do Not Own Final Publish Authority

Agents can create drafts, patches, packages, fixtures, and PRs.

Human/profile authority controls:

- Package signing.
- Primary pointer publish.
- Institutional profile ownership.
- Production launch.

## Phase Overview

### Phase 0: Command Center And Decision Lock

Goal:

Prepare the storm so agents can move fast without creating incompatible
architecture.

Outputs:

- Final V1 decision record.
- Path ownership map.
- PR labels.
- Fixture list.
- Shared schema package plan.
- FE/BE branch plan.
- Test matrix.

Must decide:

- IPFS only, Arweave only, or one required plus one recommended.
- EIP-712 vs EIP-191.
- Canonical JSON library/rules.
- Pointer concurrency model.
- Route conflict policy.
- Media/package size limits.
- First custom 6529 collections.
- V1 AI-agent affordance list.

Parallel agents:

- `storm-lead`: owns decision record and phase gates.
- `schema-captain`: owns package contract.
- `repo-coordinator`: maps FE/BE paths and PR order.
- `qa-captain`: owns test matrix.

Exit criteria:

- `agentic-storm-execution-plan.md` is accepted.
- Decision record exists.
- No open V1 blocker decisions remain for Phase 1.

### Phase 1: Protocol And Fixture Foundation

Goal:

Create the stable contract every lane can build against.

Scope:

- CMS package schema.
- Site manifest.
- Typed content collections.
- Page metadata/frontmatter.
- Metadata defaults.
- Data cascade.
- Source loader output.
- Navigation.
- Taxonomies.
- Archetypes.
- Safe block macros.
- Pagination.
- Permalinks and aliases.
- Static search manifest.
- Locale/i18n fields.
- Art asset.
- Display variant.
- NFT media profile.
- Deep zoom manifest.
- Exhibition room.
- Artwork placement.
- Interactive policy.
- Storage receipts.
- Signature envelope.
- Pointer event.
- Agent patch.
- Static build manifest.
- Fixture corpus.
- Validator baseline.

Primary repos:

- FE for shared TS schemas/renderer fixtures if current architecture keeps them
  there.
- BE for validation/publish API schemas.
- 6529mono later if the team moves shared protocol packages there.

Parallel lanes:

- `schema-core`: package, payload, site manifest, hash fixtures.
- `schema-content`: pages, blocks, metadata, defaults, cascade.
- `schema-media`: art assets, variants, NFT media profile, deep zoom.
- `schema-3d`: room, placement, interactive policy.
- `schema-agent`: source packets, agent patches, validation errors.
- `fixture-agent`: valid and invalid package corpus.

Exit criteria:

- Fixture packages validate.
- Invalid corpus fails for expected reasons.
- Hash test vectors are deterministic.
- FE and BE use the same fixtures.

### Phase 2: Native Renderer, Routes, And Static Export

Goal:

Render package data as real profile websites before building a fancy editor.

Scope:

- `/{handle}/index.html` route.
- CMS subpage routes.
- Profile page website button.
- Package fetch/cache layer.
- Safe renderer shell.
- 2D grid renderer.
- NFT detail renderer.
- Collection page renderer.
- Page metadata/OpenGraph renderer.
- Navigation renderer.
- Taxonomy/term page renderer.
- Pagination route renderer.
- Static search manifest support.
- Provenance panel.
- Plain static HTML export.
- Error states.

Parallel lanes:

- `fe-route`: route resolution, handle/profile lookup, profile button.
- `fe-render-core`: page/block renderer, metadata, navigation.
- `fe-render-art`: grids, NFT detail, lightbox, posters, provenance.
- `fe-static-export`: static output directory, route list, build manifest.
- `fe-error-states`: invalid package, missing package, not accelerated,
  storage unavailable.

Dependencies:

- Phase 1 fixtures.

Exit criteria:

- Fixture packages render locally.
- `/{handle}/index.html` works behind flag.
- Static export works from fixture package.
- Browser screenshots pass desktop and mobile for home, collection, NFT detail.
- Metadata/OpenGraph tests pass.

### Phase 3: Publish, Storage, Signing, And Pointer Ledger

Goal:

Make publishing create durable artifacts, not database-only content.

Scope:

- Draft storage.
- Package validation endpoint.
- Publish candidate creation.
- Wallet/profile signing flow.
- Signature verification.
- IPFS upload/pin adapter.
- Arweave upload adapter.
- Storage receipt verification.
- Package records.
- Profile primary pointer.
- Pointer event log.
- Rollback.
- Package export.
- Pointer registry snapshot.

Parallel lanes:

- `be-drafts`: draft CRUD and validation states.
- `be-package`: package records, fetch, validation endpoint.
- `be-signing`: auth, signer authorization, signature verification.
- `be-storage-ipfs`: upload/pin/verify.
- `be-storage-arweave`: upload/verify.
- `be-pointer`: primary pointer, pointer events, rollback.
- `fe-publish`: sign/publish UX, progress states, errors.

Dependencies:

- Phase 1 package contract.
- Phase 2 route can render packages.

Exit criteria:

- User can publish a signed fixture-derived site.
- Package has decentralized storage receipt.
- Pointer resolves to package.
- Rollback works.
- Package export works.
- Unauthorized publish tests pass.

### Phase 4: Builder MVP

Goal:

Let a profile owner create and edit a simple useful site without touching JSON.

Scope:

- Builder dashboard.
- Site type picker.
- Draft autosave.
- Site tree.
- Page editor.
- Block editor.
- Metadata editor.
- Navigation controls.
- Theme controls.
- Media library.
- Validation checklist.
- Preview desktop/mobile/social.
- Publish CTA.
- Version history.

Parallel lanes:

- `fe-builder-shell`: dashboard, route, profile auth state.
- `fe-builder-pages`: site tree, page CRUD, page settings.
- `fe-builder-blocks`: block add/edit/reorder.
- `fe-builder-media`: media library, asset upload/select, posters.
- `fe-builder-validation`: warnings/errors with deep links.
- `fe-builder-publish`: preview, publish, version history.

Dependencies:

- Phase 1 schemas.
- Phase 2 renderer.
- Phase 3 draft/publish APIs.

Exit criteria:

- User can create, preview, validate, publish, and roll back a basic profile
  homepage.
- Builder uses same renderer as published route.
- Validation blocks unsafe publish.
- Mobile and desktop builder critical flows are usable.

### Phase 5: Wallet Gallery Generator

Goal:

Ship the first killer feature: paste wallets, get a beautiful gallery site.

Scope:

- Wallet/ENS input.
- Wallet source loader.
- NFT ownership import.
- Collection grouping.
- Spam/unwanted asset hiding.
- Featured works/collections.
- Snapshot freeze.
- Generated home.
- Generated collections index.
- Generated collection pages.
- Generated NFT detail pages.
- Generated media profiles and display variants.
- Generated taxonomies/tags where useful.
- Paginated all-NFT and collection routes.
- Social images.

Parallel lanes:

- `be-wallet-loader`: ENS/address resolution, holdings snapshot.
- `be-nft-normalizer`: metadata normalization, media extraction, provenance.
- `be-gallery-generator`: package page generation from snapshot.
- `fe-gallery-flow`: guided wallet import and review.
- `fe-gallery-pages`: generated gallery previews and hide/feature controls.
- `media-variants`: thumbnails, posters, detail variants, social images.

Dependencies:

- Phase 1 media schemas.
- Phase 2 renderers.
- Phase 3 package/publish.
- Phase 4 builder shell.

Exit criteria:

- Multi-wallet gallery can be generated, edited, previewed, and published.
- Home, collection, NFT pages render from frozen snapshot.
- Social previews exist.
- Spam/unwanted NFTs can be hidden before publish.

### Phase 6: Art/NFT Display Excellence

Goal:

Make 6529 CMS art display materially better than marketplace pages.

Scope:

- Art-first collection grids.
- Detail page polish.
- Lightbox/focused inspection.
- Original vs derivative provenance.
- Poster/fallback coverage.
- Optional deep zoom manifest support.
- Video/audio/interactive media policies.
- Rights/license fields.
- C2PA/content credential display where present.
- Accessibility checks for alt/captions/transcripts.

Parallel lanes:

- `fe-art-grid`: editorial/dense/contact-sheet/grid modes.
- `fe-nft-detail`: layout, traits, provenance, related works.
- `fe-lightbox`: keyboard, zoom, fullscreen, metadata toggle.
- `media-pipeline`: derivatives, posters, dimensions, hashes.
- `a11y-media`: alt text, captions, transcripts, reduced motion.
- `provenance-ui`: original media, metadata URI, storage, package details.

Dependencies:

- Phase 2 renderer.
- Phase 5 NFT/media generation.

Exit criteria:

- Top fixture NFTs look excellent in 2D.
- Original media and derivatives are clearly separated.
- Accessibility/media validations run.
- Visual screenshots pass desktop and mobile.

### Phase 7: 3D Rooms And Object Viewer

Goal:

Add simple, reliable 3D display without turning V1 into a game engine.

Scope:

- Basic GLB/glTF object viewer.
- Simple wall-room renderer.
- Room presets.
- Artwork placements.
- Faithful 2D art surface mode.
- Gallery ambient mode.
- Poster/static preview.
- Deferred loading.
- Mobile fallback.
- Click works to NFT detail.
- Canvas nonblank tests.
- Performance budgets.

Parallel lanes:

- `fe-object-viewer`: GLB/glTF viewer, camera controls, poster, error state.
- `fe-room-renderer`: room scene, wall frames, placement, click targets.
- `fe-room-builder`: choose style, place works, preview.
- `media-3d`: model metadata, compression flags, bounds, camera hints.
- `qa-3d`: Playwright screenshots, canvas pixel checks, mobile fallback.

Dependencies:

- Phase 1 3D schemas.
- Phase 2 renderer.
- Phase 5 media profiles.

Exit criteria:

- Simple generated room renders nonblank on desktop.
- Mobile fallback works.
- Every room work links to detail page.
- 2D faithful detail page remains canonical inspection path.

### Phase 8: AI-Agent Affordances

Goal:

Let users bring their own AI to build, inspect, repair, and improve CMS sites.

Scope:

- JSON schema bundle export.
- Source packet export.
- MCP read tools.
- MCP validate/preview tools.
- Agent patch schema.
- Agent patch validation.
- Agent patch import/review UI.
- `SKILL.md` files.
- Structured validation errors.
- Prompt-injection-safe source packets.

Parallel lanes:

- `agent-schema`: schema bundle and examples.
- `agent-source`: source packets for profile, wallet, collection, NFT,
  transaction, draft, package.
- `agent-mcp`: MCP tools.
- `agent-patch`: patch schema, validation, review/apply flow.
- `agent-skills`: `SKILL.md` docs for external agents.

Dependencies:

- Phase 1 schemas.
- Phase 3 validation APIs.
- Phase 4 draft APIs.

Exit criteria:

- External/user agent can read a draft/package, propose a patch, validate it,
  and hand it back for user review.
- Publishing still requires explicit user/profile authority.
- Agent output cannot bypass validation or renderer sanitization.

### Phase 9: Institutional Migration Pilot

Goal:

Prove that hardcoded content families can become profile-owned CMS sites.

Pilot candidates:

- `6529museum`.
- `6529capital`.
- Education/docs section.

Scope:

- Inventory old routes.
- Map route to owning profile.
- Import content into CMS package.
- Preserve SEO/social metadata.
- Publish package.
- Add redirects/canonicals/links.
- Retire bespoke content implementation where safe.

Parallel lanes:

- `migration-inventory`: routes/assets/metadata inventory.
- `migration-content`: content import and page structure.
- `migration-seo`: redirects, canonicals, social previews.
- `migration-profile`: profile ownership/publish authority.
- `migration-qa`: link checks and visual regression.

Dependencies:

- Phase 2 rendering.
- Phase 3 publishing.
- Phase 4 builder or import tooling.

Exit criteria:

- One institutional section runs as profile CMS.
- Old important URLs have migration behavior.
- No new privileged content route family is introduced.

### Phase 10: Decentralization Hardening

Goal:

Reduce dependence on 6529-operated services after V1 proves the path.

Scope:

- Standalone validator.
- Standalone renderer package.
- Static exporter CLI.
- Package inspector/diff CLI.
- Mirror guide.
- Pointer registry snapshot export.
- Electron local cache integration.
- Gateway fallback.
- Package corpus compatibility tests.
- Third-party client docs.

Parallel lanes:

- `standalone-validator`.
- `standalone-renderer`.
- `static-export-cli`.
- `mirror-operator-docs`.
- `electron-cache`.
- `registry-snapshot`.

Dependencies:

- Stable package schema.
- Real published packages.

Exit criteria:

- A package can be validated outside 6529.io.
- A site can be rendered from IPFS/Arweave without 6529 API.
- A mirror can serve profile sites from package/pointer data.
- Electron can browse cached/pinned sites.

## Critical Path

The critical path is:

1. Phase 0 decisions.
2. Phase 1 package/schema/fixtures.
3. Phase 2 renderer/route.
4. Phase 3 publish/storage/sign/pointer.
5. Phase 4 builder shell.
6. Phase 5 wallet gallery generator.

Everything else should support or branch from that path.

Do not let 3D rooms, AI-agent affordances, or institutional migration block the
first end-to-end profile CMS publish unless they expose a foundational schema
problem.

## Parallelization Map

Can start immediately after Phase 0:

- Schema lanes.
- Fixture corpus.
- Art/NFT display fixture design.
- AI-agent schema/skill draft docs.
- Institutional route inventory.
- QA test matrix.

Can start after Phase 1 fixtures:

- Renderer lanes.
- Static export.
- Backend package records.
- Draft APIs.
- Storage adapters.
- Builder shell.
- Wallet loader normalization design.

Can start after Phase 2 renderer:

- Art display polish.
- Lightbox.
- NFT detail page.
- 3D renderer prototype.
- Static export validation.

Can start after Phase 3 publish APIs:

- Publish UX.
- Version history.
- Rollback.
- Package provenance panel.
- Institutional migration publish path.

Can start after Phase 4 builder shell:

- Wallet gallery guided flow.
- Agent patch import UI.
- Media library.
- Page/block editor.

## Suggested Agent Roster

### Storm Lead

Owns:

- Phase gates.
- Cross-repo sequencing.
- Decision log.
- PR labels.
- Merge readiness.

### Schema Captain

Owns:

- Package contract.
- Fixture corpus.
- Hash test vectors.
- Schema review.

### Frontend Route/Renderer Agent

Owns:

- CMS route.
- Profile button.
- Renderer shell.
- Metadata/OpenGraph.

### Frontend Builder Agent

Owns:

- Dashboard.
- Site tree.
- Page/block editor.
- Validation UI.

### Art Display Agent

Owns:

- Grids.
- NFT detail.
- Lightbox.
- Posters.
- Provenance UI.

### 3D Agent

Owns:

- Object viewer.
- Room renderer.
- Canvas tests.
- Fallbacks.

### Backend Publish Agent

Owns:

- Package records.
- Validation.
- Drafts.
- Pointer events.
- Rollback.

### Storage Agent

Owns:

- IPFS.
- Arweave.
- Receipt verification.
- Retry/status.

### Wallet/Indexer Agent

Owns:

- Wallet snapshot.
- NFT metadata normalization.
- Collection grouping.
- Spam/hide model.

### AI-Agent Affordance Agent

Owns:

- MCP tools.
- Source packets.
- Agent patches.
- `SKILL.md`.
- Schema export.

### QA/Security Agent

Owns:

- Test matrix.
- Browser screenshots.
- Security checklist.
- Accessibility/media checks.
- CI/bot feedback loop.

### Migration Agent

Owns:

- Museum/Capital/About route inventory.
- Import/migration plan.
- SEO/social preservation.

## PR Wave Plan

### Wave 0: Decisions And Fixtures

PRs:

- Decision record.
- Schema skeleton.
- Fixture corpus.
- Hash/canonicalization tests.

Gate:

- FE/BE agree on fixtures.

### Wave 1: Route And Render

PRs:

- FE CMS route/profile button.
- FE renderer core.
- FE art/NFT primitive renderer.
- FE static export fixture.
- BE package fetch placeholder if needed.

Gate:

- Fixture package renders at `/{handle}/index.html`.

### Wave 2: Publish Spine

PRs:

- BE package records.
- BE draft/validation.
- BE signing/authorization.
- BE pointer events.
- BE storage adapters.
- FE publish/sign/provenance UI.

Gate:

- Signed package publishes and resolves through pointer.

### Wave 3: Builder MVP

PRs:

- FE builder shell.
- FE page/block editor.
- FE media library.
- FE validation checklist.
- FE version history.

Gate:

- User can build and publish simple site.

### Wave 4: Gallery MVP

PRs:

- Wallet loader.
- NFT metadata normalization.
- Gallery generator.
- Generated collection/NFT pages.
- Media variants/social images.
- Hide/feature controls.

Gate:

- User can paste wallets and publish gallery site.

### Wave 5: Experience Polish

PRs:

- Lightbox.
- Deep zoom manifest support.
- 3D room MVP.
- Object viewer.
- Static search.
- Taxonomy pages.
- Mobile polish.

Gate:

- Gallery and NFT display feel launch-quality.

### Wave 6: AI-Agent And Migration

PRs:

- MCP read/validate/preview tools.
- Source packet export.
- Agent patch validation/import.
- `SKILL.md` bundle.
- Institutional migration pilot.

Gate:

- External/user agent can propose valid site changes.
- One institutional site can run as profile CMS.

### Wave 7: Decentralization Hardening

PRs:

- Standalone validator.
- Standalone/static renderer direction.
- Static export CLI.
- Pointer registry snapshot.
- Mirror docs.
- Electron cache path.

Gate:

- Package can be validated and rendered without 6529.io.

## Launch Readiness Gate

Public launch requires:

- Profile site route works.
- Profile page button works.
- Builder can create/publish.
- Wallet gallery generator works with live data.
- Home, collection, NFT pages render.
- Package is signed.
- Package has decentralized storage receipt.
- Package can be exported.
- Provenance panel works.
- Social previews work.
- Mobile screenshots pass.
- Security review covers untrusted content.
- Accessibility/media checks pass.
- Rollback works.
- Agent docs do not imply 6529 pays for inference.
- Known centralized dependencies are listed with escape hatches.

## Storm Anti-Patterns

Avoid:

- Huge all-in-one PRs.
- Building 3D before package/media schemas settle.
- Building builder UI against fake local-only state.
- Treating S3/database content as canonical.
- Adding Astro/Starlight/Jekyll/etc exporters in V1.
- Letting agents invent route patterns.
- Letting AI-agent patch import bypass user review.
- Rendering arbitrary HTML/JS in the main app context.
- Cropping art detail pages like marketplace thumbnails.
- Adding "official/verified" protocol lanes.

## First 72 Hours Of A Real Storm

Hour 0-6:

- Storm lead locks V1 decision record.
- Schema captain drafts schema file list and fixture corpus.
- QA captain drafts test matrix.
- Repo coordinator assigns lanes and PR labels.

Hour 6-24:

- Schema lanes implement initial schemas and fixtures.
- FE route agent stubs route behind flag against fixture.
- BE package agent stubs package fetch/validate against fixture.
- Art display agent creates media fixture package.
- AI-agent agent drafts schema export and first `SKILL.md`.

Hour 24-48:

- Renderer renders fixture home/collection/NFT pages.
- Static export renders fixture package.
- BE package validation and pointer skeleton land.
- Storage agents prototype IPFS/Arweave receipt adapters.
- Builder shell starts against drafts/fixtures.

Hour 48-72:

- First end-to-end fixture site renders at `/{handle}/index.html`.
- First signed/pointer publish path is mocked or live in dev.
- First browser screenshots collected.
- First bot review loop starts.
- Storm lead reviews dependency graph and splits next PR wave.

## Current Recommendation

Start the storm with Phase 0 and Phase 1 only.

Reason:

The roadmap is now broad enough that implementation can move very fast, but only
if package schemas, fixtures, route rules, hash rules, and publish invariants are
stable first. Once those are locked, many agents can work in parallel without
accidental architecture drift.

