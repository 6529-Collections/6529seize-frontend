# Profile Native CMS Run Log

## 2026-06-17

### Current Objective

Define the full roadmap for a profile-native 6529 CMS that can launch before
full decentralization while minimizing future migration cost.

The CMS should let any profile publish a website at `/{handle}/index.html`,
with the normal profile page staying at `/{handle}`.

### Current Status

Roadmap/spec docs exist and are being iterated:

- `ops/workstreams/profile-native-cms-roadmap/README.md`
- `ops/workstreams/profile-native-cms-roadmap/active-context.md`
- `ops/workstreams/profile-native-cms-roadmap/product-technical-roadmap.md`
- `ops/workstreams/profile-native-cms-roadmap/run-log.md`

No implementation code has been changed in this specific roadmap pass. This is
planning/spec work.

### Decisions Captured

- CMS capability should be available to all profiles.
- Museum, Capital, About, Education, Blog, News, OM, and similar sections should
  become profile-owned CMS sites, not privileged app route families.
- `/{handle}` remains the profile page.
- `/{handle}/index.html` is the primary profile website.
- The profile page should link directly to the CMS site when a primary site is
  published.
- The first real publish path should use decentralized storage from the start.
- AWS/S3/CloudFront can accelerate content, but should not be canonical.
- The durable artifact should be a signed, content-addressed, portable CMS
  package.
- 6529 should not pay for arbitrary user inference.
- Instead, 6529 should expose AI-agent affordances: schemas, MCP tools,
  `SKILL.md`, source packets, validation output, package examples, and patch
  import/review.
- Astro/Starlight exporters are not needed in V1.
- Jekyll/Hugo/Eleventy/Docusaurus/VitePress/MkDocs/Gatsby/Zola exporters are
  also not needed in V1.
- We should steal proven static-site ideas and implement them natively in the
  6529 CMS package/renderer.

### Prior Art Studied

Astro/Starlight:

- Typed content collections.
- Source loaders.
- Static-first islands.
- Frontmatter-style metadata.
- Generated navigation.
- Static search.
- I18n-ready fields.
- Plugin boundaries.
- Docs ergonomics.
- Editor/agent schema support.

Additional static-site systems:

- Jekyll: front matter, front matter defaults, collections.
- Hugo: archetypes, taxonomies.
- Eleventy: data cascade, pagination, permalinks, collections, directory data.
- Docusaurus: sidebar, docs versioning, i18n.
- VitePress: frontmatter, build-time data loading.
- MkDocs/Material: simple site config, docs defaults, search/i18n ergonomics.
- Gatsby: source plugin/data normalization idea, without GraphQL lock-in.
- Zola: single-binary/local-first/static/no-database posture.

### Native 6529 Ideas Added From Prior Art

- Typed CMS collections.
- Site manifest.
- Scoped metadata defaults.
- Data cascade and override semantics.
- Archetypes as page/site creation recipes.
- Taxonomies, tags, terms, and facets.
- Safe block macros.
- Deterministic pagination.
- Permalinks, aliases, and route collision validation.
- Static search manifest.
- I18n-ready package fields.
- Source loaders/source packets.
- Markdown import/export for docs/posts.
- Controlled theme slots rather than arbitrary runtime swizzling.
- Static build manifest.
- Standalone validator/exporter/local tooling direction.

### Current Roadmap Shape

Near-term sequence:

1. Lock V1 cutline.
2. Decide storage/signing/hash/pointer/route/media details.
3. Add package schemas for typed collections, site manifest, defaults, cascade,
   archetypes, taxonomies, macros, pagination, permalinks, aliases, search,
   locale/i18n, loader outputs, plugin manifests, and build manifests.
4. Add profile CMS route and profile-page website button.
5. Add signed publish flow with IPFS/Arweave receipts.
6. Harden renderer and validator.
7. Add plain static HTML export.
8. Build dashboard/builder V1.
9. Expand wallet gallery generator into home, collection, NFT, taxonomy, and
   paginated pages.
10. Add AI-agent affordances.
11. Add 3D rooms.
12. Add transaction explainers.
13. Add standalone validator/renderer and mirror/Electron workflows.

### Open Decisions

- Required storage policy: IPFS only, Arweave only, or one required plus one
  recommended.
- Signature scheme: EIP-712 now or EIP-191 first.
- Canonical JSON/hash implementation.
- Pointer concurrency and rollback event model.
- Route conflict policy for handles that overlap app routes.
- Initial package size/media upload limits.
- First 6529 collections that get custom native templates.
- Which AI-agent affordances ship in V1.
- Whether agent patch import is V1 or V1.1.

### Next Work

If continuing this roadmap/spec exercise:

1. Review the schema list and turn it into concrete JSON schema file names.
2. Define V1 package manifest shape in more detail.
3. Define V1 route manifest shape in more detail.
4. Define V1 static export output directory shape.
5. Define V1 MCP tool list and permissions.
6. Define first `SKILL.md` files and what each should contain.
7. Decide whether to keep this in frontend repo or move to 6529mono before
   implementation planning begins.

## 2026-06-17: Phase 0 And Phase 1 Delivery

### Current Objective

Enter `6529-autonomous-manager` mode with subagents and deliver Phase 0 and
Phase 1 for the profile-native CMS roadmap.

### Output

Added Phase 0:

- `ops/workstreams/profile-native-cms-roadmap/phase-0/decision-record.md`
- `ops/workstreams/profile-native-cms-roadmap/phase-0/storm-lanes.md`
- `ops/workstreams/profile-native-cms-roadmap/phase-0/test-matrix.md`
- `ops/workstreams/profile-native-cms-roadmap/phase-0/pr-wave-plan.md`

Added Phase 1:

- `ops/workstreams/profile-native-cms-roadmap/phase-1/README.md`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/schema-index.md`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/schemas/cms-package-v1.schema.json`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/schemas/agent-patch-v1.schema.json`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/schemas/validation-result-v1.schema.json`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/README.md`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/minimal-profile-homepage.package.json`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/wallet-gallery.package.json`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/collection-page.package.json`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/nft-detail.package.json`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/art-media.package.json`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/exhibition-room.package.json`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/legacy-migration.package.json`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/invalid/missing-signature.package.json`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/invalid/route-collision.package.json`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/hash-test-vectors.md`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/validation-plan.md`

### Subagent Review Integrated

- Schema/fixture review: keep the Phase 1 corpus portable, then move or mirror
  executable protocol code into `lib/profile-cms/protocol/v1/` or a shared
  6529mono package.
- Publish/storage review: spell out canonicalization, signing, EIP-1271/Safe,
  storage receipts, replay protection, pointer concurrency, rollback, and
  idempotency.
- Frontend route/render review: make `/{handle}` and
  `/{handle}/index.html` distinct, reserve app roots, keep CMS pages outside
  profile-tab layout, and classify CMS analytics separately.
- Manager review: distinguish docs-only readiness from code landed, define
  artifact paths, owner/signoff state, validator behavior, and residual gaps.

### Validation Evidence

Completed locally:

- JSON parse for all Phase 1 schemas and fixtures.
- Focused route duplicate check across valid and invalid fixtures.
- `codex-diff-check -- ops/workstreams/profile-native-cms-roadmap` passed.
- Non-ASCII scan for Markdown and JSON artifacts found no non-ASCII.
- `node -e "require.resolve('ajv')"` confirmed `ajv` is not currently
  resolvable, so full schema validation is explicitly deferred.
- Documentation memory updated after review.

Known gaps:

- Full JSON Schema validation has not run because `ajv` is not currently
  resolvable in the local Node environment.
- Hash vectors are placeholder-shaped until RFC 8785 canonicalization lands.
- No runtime FE or BE code was changed in this pass.

### Next Work

Wave 0 implementation:

1. Add executable protocol code and schema validation.
2. Generate real canonical hash vectors.
3. Wire FE and BE tests to the same fixture corpus.
4. Start route/render and publish/storage implementation behind feature flags.

### Second-Pass Review

Found and fixed:

- `legacy-migration.package.json` was marked valid but emitted a CMS alias at
  `/museum/the-memes/index.html`, outside the owning `6529museum` profile
  namespace. The fixture now keeps the imported legacy route as provenance
  metadata and emits the alias at
  `/6529museum/legacy/museum/the-memes/index.html`.

Additional validation completed:

- Custom semantic pass over all fixtures for route namespace, duplicate routes,
  page references, navigation references, metadata social-image references,
  block asset/page/NFT references, NFT media profile asset references, deep zoom
  references, room placement references, taxonomy page references, signatures,
  storage receipts, and primary routes.
- All seven valid fixtures passed that semantic pass.
- `invalid/route-collision.package.json` still fails the intended duplicate
  route check.
- Python `jsonschema` is also unavailable locally, matching the existing
  `ajv` full-schema-validation gap.

### PR Bot Review Iteration

PR #2707 bot feedback:

- 6529bot security: no security findings; non-blocking notes on unsafe URL
  schemes, extensible block fields, fixture signatures, signer normalization,
  and EIP-55 validation.
- 6529bot general: good to merge; non-blocking notes on route kind semantics,
  route/profile namespace validation, `unknown` block semantics, and placeholder
  hashes.
- CodeRabbit: review rate limit reached, with status context passing and no
  actionable inline findings.

Changes made from bot feedback:

- Added first-class `html_embed` block type.
- Removed `unknown` from the V1 valid block type enum.
- Changed the mixed-media fixture to use `html_embed` instead of `unknown`.
- Added `invalid/unknown-block.package.json` to document fail-closed behavior.
- Expanded validation-plan semantic checks for route kind variants, alias/redirect
  namespace matching, unsafe URL schemes, unknown URL-bearing block properties,
  production rejection of fixture signatures, signer normalization, and EIP-55
  validation.
- Tightened roadmap language so unsupported blocks fail closed in V1.

## 2026-06-17: Wave 0 Executable Protocol Bridge

### Current Objective

Turn the Phase 1 CMS protocol artifacts into executable frontend code that
future FE, BE, renderer, builder, and agent lanes can validate against.

### Output

Added executable protocol package:

- `lib/profile-cms/protocol/v1/constants.ts`
- `lib/profile-cms/protocol/v1/schemas.ts`
- `lib/profile-cms/protocol/v1/canonical-json.ts`
- `lib/profile-cms/protocol/v1/hash.ts`
- `lib/profile-cms/protocol/v1/validation.ts`
- `lib/profile-cms/protocol/v1/index.ts`

Added tests:

- `__tests__/lib/profile-cms/protocol/v1/canonical-json.test.ts`
- `__tests__/lib/profile-cms/protocol/v1/hash.test.ts`
- `__tests__/lib/profile-cms/protocol/v1/fixtures.test.ts`

Updated docs:

- `ops/workstreams/profile-native-cms-roadmap/active-context.md`

- `ops/workstreams/profile-native-cms-roadmap/phase-1/README.md`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/schema-index.md`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/hash-test-vectors.md`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/validation-plan.md`

### Implementation Notes

- Runtime validation uses existing direct `zod` dependency, not a new AJV
  dependency.
- JSON Schema files remain the protocol reference.
- Canonical JSON rejects undefined, functions, symbols, bigint, non-finite
  numbers, non-plain objects, and cycles.
- Hash helper uses `sha256:<64 lowercase hex>`.
- Package hash input omits `integrity.package_hash`, `signatures`, and
  `storage` to avoid self-reference and mutable envelope coupling.
- Default validation accepts fixture signatures/storage for fixture/dev usage.
  Production mode can disable both.
- Hash enforcement is optional so placeholder-hash fixtures can stay useful
  until publish/signing finalizes.

### Validation Evidence

Completed locally:

- `seize run test:no-coverage -- __tests__/lib/profile-cms/protocol/v1`
  passed.
- `seize run lint:changed` passed.
- `seize run typecheck:changed` passed.
- `codex-diff-check -- lib/profile-cms __tests__/lib/profile-cms ops/workstreams/profile-native-cms-roadmap`
  passed.

Coverage from that slice:

- Canonical JSON object ordering, array order, and invalid input rejection.
- RFC 8785/JCS-oriented numeric edge cases and astral-key ordering.
- Hash vectors for object ordering and unicode title.
- Computed minimal-profile payload and package hash enforcement.
- Mutation detection for payload/package hash mismatch.
- All seven valid Phase 1 fixtures pass.
- All three invalid fixtures return documented error codes.
- Production-mode fixture signature/storage rejection.
- Unsafe URL-scheme rejection.
- Plain HTTP asset URI rejection.
- Unsafe relative URL rejection for backslash and encoded scheme-relative forms.
- Uppercase hash hex and non-`sha256:` prefix rejection.
- Type-vs-format schema failures for block types and hash fields.
- Signature/storage envelope exclusion from package hash input.

### Bot Review Iteration

6529bot general review requested changes on:

- Making the canonical number path explicit and adding JCS edge vectors.
- Adding an astral-key ordering vector.
- Narrowing `block_type` issue mapping to enum failures only.
- Narrowing `hash.invalid` issue mapping to regex failures on known hash fields.
- Excluding signatures/storage from package hash input and documenting that
  production signatures attest through EIP-712 rather than signing over their
  own signature envelope.
- Removing plain `http:` from the CMS URI allowlist.
- Rejecting unsafe relative URL forms with backslashes, control characters, and
  encoded scheme-relative prefixes.

Follow-up changes were made and revalidated locally.

### Remaining Work

- Decide whether to move the executable protocol into a shared 6529mono package
  before BE adoption.
- Add BE tests against the same fixture corpus.
- Start Wave 1 route/render/profile-button work behind feature flags.

## 2026-06-17: Art And NFT Display Research

### Current Objective

Go deep on best practices for displaying art and NFTs in both 2D and 3D.

### Output

Added:

- `ops/workstreams/profile-native-cms-roadmap/art-nft-display-best-practices.md`

Linked it from:

- `ops/workstreams/profile-native-cms-roadmap/README.md`
- `ops/workstreams/profile-native-cms-roadmap/active-context.md`

### Research Sources

Reviewed official or primary docs for:

- IIIF Image and Presentation APIs.
- ERC-721 and OpenSea metadata standards.
- Khronos glTF and glTF PBR.
- three.js GLTFLoader, DRACOLoader, KTX2Loader, LoadingManager.
- model-viewer.
- web.dev image performance and lazy loading.
- WCAG 2.2, W3C alt text guidance, captions, and transcripts.
- C2PA/content credentials.

### Design Conclusions

2D:

- Art display should be art-first, aspect-ratio preserving, and faithful by
  default.
- Detail pages should never depend on cropped marketplace-style thumbnails.
- Grids can have dense/cropped modes, but detail views need full artwork.
- High-resolution still images need optional deep zoom/IIIF-like tile manifests.
- Every heavy/non-instant media type needs a poster and fallback.
- Provenance, source media, display derivatives, social images, and original
  assets should be represented separately.

3D:

- V1 should ship simple 3D rooms and object viewers, not a full 3D world editor.
- 2D art inside 3D rooms needs a faithful display mode where room lighting does
  not alter the artwork pixels.
- 3D rooms must always link each work to a faithful 2D detail page.
- GLB/glTF should be the runtime default for 3D assets.
- Posters, deferred loading, mobile fallback, canvas nonblank tests, and
  performance budgets are required.

Schema implications:

- Add `art_asset`.
- Add `display_variant`.
- Add `nft_media_profile`.
- Add `deep_zoom_manifest`.
- Add `exhibition_room`.
- Add `artwork_placement`.
- Add `interactive_policy`.

### Next Work

- Fold the new art/NFT schema implications into the main product roadmap schema
  and track sections.
- Decide whether V1 object viewer uses `model-viewer`, Three.js directly, or
  both.
- Define V1 media size/texture budgets.
- Define V1 3D room template and fallback behavior.
- Decide which 6529 collections get custom art display templates first.

## 2026-06-17: Agentic Storm Phase Plan

### Current Objective

Do a final roadmap review and reorganize the work into logical phases for an
aggressive multi-agent implementation storm.

### Output

Added:

- `ops/workstreams/profile-native-cms-roadmap/agentic-storm-execution-plan.md`

Updated:

- `ops/workstreams/profile-native-cms-roadmap/README.md`
- `ops/workstreams/profile-native-cms-roadmap/active-context.md`

### Phase Structure

The roadmap is now organized into these execution phases:

1. Command Center And Decision Lock.
2. Protocol And Fixture Foundation.
3. Native Renderer, Routes, And Static Export.
4. Publish, Storage, Signing, And Pointer Ledger.
5. Builder MVP.
6. Wallet Gallery Generator.
7. Art/NFT Display Excellence.
8. 3D Rooms And Object Viewer.
9. AI-Agent Affordances.
10. Institutional Migration Pilot.
11. Decentralization Hardening.

### Storm Design

The storm plan defines:

- Storm rules.
- Critical path.
- Parallelization map.
- Suggested agent roster.
- PR wave plan.
- Launch readiness gate.
- Anti-patterns.
- First 72 hours plan.

### Key Recommendation

Start with Phase 0 and Phase 1 only:

- Lock decisions.
- Assign lanes.
- Build shared package schemas.
- Build shared fixture corpus.
- Build validator/hash test vectors.

Only then fan agents out across route/render, publish/storage, builder, wallet
gallery, art display, 3D, AI-agent affordances, and migration lanes.

## 2026-06-17 - FE Runtime Bridge

- Created isolated branch/worktree `codex/profile-cms-runtime-bridge`.
- Added frontend runtime bridge scope for profile-native CMS sites only:
  `/{handle}/index.html` route support, primary-site package adapter,
  V1 static renderer, and profile Website link plumbing.
- Documented the expected backend contract:
  `GET /api/profile-cms/:handle/primary` returning
  `{ package, package_id, version, package_hash, payload_hash, updated_at,
  published_at? }`, with `404` for no primary site.
- Safety notes: API packages enforce V1 hashes and reject fixture artifacts;
  dev fixture fallback is non-production opt-in; raw HTML is not executed;
  sandboxed embeds exclude `allow-same-origin`.
- Focused validation passed:
  `seize run test:no-coverage -- __tests__/lib/profile-cms/runtime/routes.test.ts __tests__/lib/profile-cms/runtime/fetcher.test.ts __tests__/components/profile-cms/CmsSiteRenderer.test.tsx __tests__/components/user/user-page-header/UserPageHeader.test.tsx __tests__/app/profile-cms-route.test.tsx --runInBand`,
  `seize run lint:changed`, `seize run typecheck:changed`,
  `seize run react-doctor:diff`, and `codex-diff-check`.
- Local browser smoke was timeboxed. The dev server reached Ready on the
  assigned port, then Turbopack exited because the temporary clean worktree
  dependency junction points outside the project root. This is a local
  dependency-shape caveat from avoiding another broad install, not a CMS
  runtime error.

## 2026-06-17 - Builder MVP Stacked Lane

Started FE CMS Builder + Publish UI MVP on
`codex/profile-cms-builder-mvp`, stacked on PR #2720 head
`d50547de0ad62e36da881659a80173d6cf619059`.

Scope guardrails:

- FE builder/publish UX only.
- No V1 protocol, hash, or canonicalization changes.
- No wallet gallery generator, NFT indexer, storage upload, 3D rooms, or
  AI-agent MCP work.
- Existing runtime bridge branch remains untouched except as the stacked base.

Implemented locally before validation:

- Hidden feature-flagged `/{handle}/cms/builder` route.
- Builder package helper that emits a one-page V1 package candidate, computes
  existing V1 hashes, and validates via the merged V1 validator.
- Builder UI with template picker, homepage metadata, navigation label, block
  editor, real `CmsSiteRenderer` preview, validation checklist, JSON
  import/export, and honest save/validate/publish adapter states.
- Narrow write adapter boundary and assumptions doc for backend save,
  server-validate, and publish endpoints.

Focused validation passed:

- `seize run format:changed`
- `seize run test:no-coverage -- __tests__/lib/profile-cms/builder/package.test.ts __tests__/components/profile-cms-builder/ProfileCmsBuilder.test.tsx __tests__/app/profile-cms-builder-route.test.tsx --runInBand`
  (3 suites, 9 tests)
- `seize run lint:changed`
- `seize run typecheck:changed`
- `seize run react-doctor:diff`
- `codex-diff-check`
- Local browser smoke was timeboxed. The assigned dev server reached Ready on
  the builder worktree port, then exited because the local helper/process
  environment surfaced `PORT_SEARCH_LIMIT=0`, even though tracked config only
  declares `PORT_SEARCH_LIMIT` as an optional positive number and the worktree
  `.env` does not set it. This is being treated as a local helper/process-env
  caveat, not a tracked CMS builder code defect.

PR status to be filled after remaining focused checks and stacked PR
publication.
