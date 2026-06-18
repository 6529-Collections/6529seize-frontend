# Builder MVP Integration Assumptions

Last updated: 2026-06-18.

## Scope

This note covers the first frontend CMS Builder + Publish UI MVP. It is stacked
on the runtime bridge and does not change V1 protocol, hash, or
canonicalization semantics.

## Frontend Route

- Hidden route: `/{handle}/cms/builder`
- Feature flags:
  - `PROFILE_CMS_BUILDER_ENABLED=true`
  - `NEXT_PUBLIC_PROFILE_CMS_BUILDER_ENABLED=true`
- The route is intentionally not linked from the public profile page in this
  lane.
- `/{handle}` remains the normal profile page.
- `/{handle}/index.html` remains the published CMS runtime route.

## Builder Package Behavior

- The builder emits a V1 `CmsPackageV1` candidate with a homepage route:
  `/{handle}/index.html`.
- If the author adds a 3D room block, the candidate also emits one faithful 2D
  detail route per room work at `/{handle}/rooms/work-{n}/index.html`, plus a
  matching `exhibition_room` payload entry and display asset.
- The candidate uses the existing `withComputedCmsHashes` helper and validates
  with `validateCmsPackageV1(..., { allowFixtureSignatures: true,
  allowFixtureStorage: true, enforceHashes: true })`.
- Fixture signature and storage artifacts are allowed only because this is an
  unsigned draft candidate. Production publish must replace them with real
  backend signing/storage outputs before the runtime primary endpoint serves the
  package.
- The live preview uses `CmsSiteRenderer`; there is no separate fake preview
  renderer.
- JSON export/import exists for debugging, portability, and backend handoff.
- The 3D room primitive is deliberately simple: room preset, one artwork asset,
  deferred viewer policy, poster/fallback asset, and a canonical 2D detail
  route. It does not imply wallet gallery generation or automated NFT indexing.
- For that primitive, `/{handle}/rooms/work-{n}/index.html` is the canonical
  CMS detail route for the authored room work. It is not claiming to be the
  chain-indexed `/nfts/...` route; a later NFT-aware builder must collect
  chain/contract/token data and point room placements at the existing NFT detail
  convention when that data is available.

## Expected Backend Write API

The frontend adapter is localized under `lib/profile-cms/builder/api.ts`.
Backend models can replace that boundary later.

Expected endpoints:

```ts
POST /api/profile-cms/packages
body: { profile_id: string, cms_package: CmsPackageV1 }
returns: { draft_id: string, package_hash: string, message?: string }

POST /api/profile-cms/packages/validate
body: {
  cms_package: CmsPackageV1,
  allow_fixture_signatures: boolean,
  allow_fixture_storage: boolean,
  enforce_hashes: boolean
}
returns: { draft_id?: string, package_hash: string, message?: string }

POST /api/profile-cms/packages/{id}/publish
body: signed decentralized publish request fields, storage receipts, package
      hash, payload hash, and profile authority proof (exact BE model pending)
returns: { package_hash: string, message?: string }
```

Frontend endpoint constants:

- `PROFILE_CMS_BUILDER_PACKAGES_ENDPOINT = "profile-cms/packages"`
- `PROFILE_CMS_BUILDER_VALIDATE_ENDPOINT =
  "profile-cms/packages/validate"`
- `PROFILE_CMS_BUILDER_PUBLISH_ENDPOINT =
  "profile-cms/packages/{id}/publish"`
- `PROFILE_CMS_GALLERY_SNAPSHOT_ENDPOINT =
  "profile-cms/gallery/snapshots"`

## Wallet Gallery Snapshot And Generator Contract

The frontend gallery builder shell requests a reviewed wallet snapshot through
`lib/profile-cms/builder/api.ts` and keeps the package-generation fallback under
`lib/profile-cms/builder/gallery.ts` deliberately temporary.

Expected snapshot endpoint:

```ts
POST /api/profile-cms/gallery/snapshots
body: {
  profile_id?: string,
  wallets: Array<{
    kind: "address" | "ens",
    input: string,
    normalized: string
  }>
}
returns: {
  snapshot_id: string,
  source: "backend" | "fixture" | string,
  wallets: Array<{ kind: "address" | "ens", input: string, normalized: string }>,
  captured_at: string,
  block_number?: number,
  assets: Array<{
    id: string,
    title: string,
    collection_id: string,
    collection_name: string,
    contract: string,
    token_id: string,
    owner: string,
    image_uri?: string,
    media_state: "ready" | "partial" | "missing",
    metadata_uri?: string,
    permalink?: string
  }>,
  collections: Array<{
    id: string,
    name: string,
    contract?: string,
    description?: string,
    asset_count: number
  }>,
  warnings?: string[]
}
```

The backend Phase 5 deterministic wallet-snapshot -> CMS V1 package generator
is the durable source of truth for generated packages. Until that generator is
available to this frontend lane, the local fallback only converts the reviewed
snapshot plus simple UI choices into an existing `CmsPackageV1` shape for
preview. It must not introduce new CMS package fields or a second permanent
generation contract.

Replacement path when the backend generator lands:

- Keep the wallet parser and snapshot review controls.
- Send the reviewed snapshot id plus hidden, featured, and priority choices to
  the backend generator endpoint once the exact BE model is merged.
- Replace `buildWalletGalleryCmsPackage(...)` preview fallback with the backend
  generated `CmsPackageV1`, then continue using `CmsSiteRenderer` and the
  existing builder save/validate/publish shell.
- Keep tests that verify snake_case snapshot fields normalize cleanly into the
  frontend review model.

The route resolves the profile handle to `profile_id` server-side through the
existing identity lookup before mounting the builder. If that lookup cannot
provide an id, save-draft remains disabled with an explicit missing-profile-id
state instead of inventing a handle-shaped write API.

Write calls are disabled unless one of these flags is true:

- `PROFILE_CMS_BUILDER_API_ENABLED=true`
- `NEXT_PUBLIC_PROFILE_CMS_BUILDER_API_ENABLED=true`

When disabled, save/validate CTAs show the expected endpoint and do not pretend
the draft was saved. When enabled, save and server-validate are still gated to
the connected non-proxy profile owner before any backend request is issued.
Publish is always blocked in this frontend MVP until the signed decentralized
storage flow and exact BE publish body are wired.

## Remaining Production Gates

- Backend auth must verify the caller controls the target profile.
- Backend publish must produce real non-fixture signatures and storage receipts.
- Backend publish must discard or overwrite client-provided fixture
  `signatures` and `storage` fields, then rebuild them from server-verified
  profile authority and real decentralized storage receipts.
- Backend publish must reject schema/hash drift and unsafe URI violations.
- Storage upload and content-addressed receipt creation are out of scope here.
- Production wallet gallery generation, NFT indexing, full 3D world editing,
  multi-room navigation, and AI-agent MCP flows remain owned by their
  backend/specialist lanes. The current FE gallery shell uses a fixture-backed
  preview fallback only while waiting for the deterministic backend generator,
  and the 3D lane is limited to bounded viewer primitives rather than a full
  world editor.

## Localization Follow-Up

- Route: `/{handle}/cms/builder`
- Current source locale: `en-US`
- Current fallback behavior: partial locale dictionaries fall back to `en-US`
  for the builder chrome. Frontend-authored wallet gallery fixture warning codes
  render through `profileCms.builder.gallery.snapshot.warning.*` keys before
  they appear in the snapshot review summary.
- User impact while feature-flagged: authors using `en-GB`, `fr-FR`, `es-ES`,
  or `de-DE` see English-only builder chrome and English starter package
  content. The temporary wallet gallery preview generator also emits English
  block, callout, metadata, and fixture alt text in the Preview tab. Starter and
  preview package text is treated as editable authored content, not translated
  runtime chrome.
- Owner/follow-up: frontend CMS builder lane should add partial-locale builder
  keys before the route exits hidden feature-flag status.
- Remediation: translate `profileCms.builder.*` chrome keys and decide whether
  seed package copy should remain authored defaults, move to locale-specific
  starter templates, or be replaced by the backend Phase 5 deterministic
  generator output once that durable source of truth is wired.
