# Builder MVP Integration Assumptions

Last updated: 2026-07-05 (aligned to the real backend contract that landed on
`6529seize-backend` main; the "expected" endpoint shapes below were replaced
with the actual generated `ApiProfileCms*` models).

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

## Backend Write API (real contract)

The frontend adapter is localized under `lib/profile-cms/builder/api.ts` and
now targets the real backend routes. Response models are the generated
`ApiProfileCms*` OpenAPI models (already present in the frontend
`generated/models/` output).

Real endpoints used by the builder:

```ts
POST /api/profile-cms/packages
body: { profile_id: string, cms_package: CmsPackageV1 }
returns: ApiProfileCmsPackage
  // { id, package, profile_id, profile_handle, package_id, version,
  //   status, package_hash, payload_hash, updated_at, created_at,
  //   published_at? } — epoch-millis timestamps, snake_case keys

POST /api/profile-cms/packages/validate
body: {
  cms_package: CmsPackageV1,
  allow_fixture_signatures?: boolean,
  allow_fixture_storage?: boolean,
  enforce_hashes?: boolean
}
returns: ApiProfileCmsValidationResult
  // { schema, valid, checked_at, issues[], target?{package_hash, draft_id} }

GET /api/profile-cms/packages/{id}
returns: ApiProfileCmsPackage

GET /api/profile-cms/profiles/{profile_id}/packages
returns: ApiProfileCmsPackage[]

POST /api/profile-cms/packages/{id}/publish
// Exists on the backend, but the frontend MVP keeps publish hard-blocked
// until the signed decentralized storage flow is wired end to end.
```

Frontend endpoint constants:

- `PROFILE_CMS_BUILDER_PACKAGES_ENDPOINT = "profile-cms/packages"`
- `PROFILE_CMS_BUILDER_VALIDATE_ENDPOINT =
  "profile-cms/packages/validate"`
- `PROFILE_CMS_BUILDER_PACKAGE_BY_ID_ENDPOINT = "profile-cms/packages/{id}"`
- `PROFILE_CMS_BUILDER_PROFILE_PACKAGES_ENDPOINT =
  "profile-cms/profiles/{profile_id}/packages"`
- `PROFILE_CMS_BUILDER_PUBLISH_ENDPOINT =
  "profile-cms/packages/{id}/publish"`
- `PROFILE_CMS_GALLERY_SNAPSHOT_ENDPOINT =
  "profile-cms/wallet-gallery/snapshot"`

## Wallet Gallery Snapshot And Generator Contract

The frontend gallery builder shell requests a reviewed wallet snapshot through
`lib/profile-cms/builder/api.ts` and keeps the package-generation fallback under
`lib/profile-cms/builder/gallery.ts` deliberately temporary.

Real snapshot endpoint (see `ApiProfileCmsWalletGallerySnapshot` and
`ProfileCmsWalletGalleryApiService#createSnapshot` in the backend):

```ts
POST /api/profile-cms/wallet-gallery/snapshot
body: {
  wallets: string[],                 // addresses or ENS names, 1-25
  exclude_contracts?: string[],
  exclude_assets?: Array<{ contract: string, token_id: number }>,
  include_spam?: boolean,
  max_assets?: number                // default 200, max 500
}
returns: {
  generated_at: number,              // epoch millis
  source: "indexed_ownership",
  block_reference: number,
  wallets: Array<{
    input: string, address: string | null, ens: string | null,
    display: string | null, status: "resolved" | "unresolved",
    reason: string | null
  }>,
  assets: Array<{
    contract: string, token_id: number, balance: number,
    owner_wallet: string, owner_display: string | null,
    collection: string, collection_key: "MEMES" | "MEMELAB" | "GRADIENTS" | "NEXTGEN",
    name: string, description: string | null, artist: string | null,
    artist_seize_handle: string | null, token_type: string | null,
    media: {
      image: string | null, image_preview: string | null,
      thumbnail: string | null, animation: string | null,
      animation_preview: string | null, mime_type: string | null
    },
    metadata: unknown,
    flags: { spam: boolean, excluded: boolean, exclusion_reason: string | null }
  }>,
  excluded_assets: Array<{
    contract: string, token_id: number, owner_wallet: string, reason: string
  }>,
  totals: {
    requested_wallets: number, resolved_wallets: number,
    unresolved_wallets: number, indexed_assets: number,
    visible_assets: number, excluded_assets: number,
    spam_assets: number, truncated: boolean
  }
}
```

The adapter maps this into the existing frontend `WalletGallerySnapshot`
review model in `lib/profile-cms/builder/gallery-normalize.ts` (collections
are derived by grouping assets on `collection_key`; unresolved wallets and
truncation surface as review warnings).

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

## AI-Agent Affordance Follow-Up

The Phase 8 builder follow-up adds draft-only BYO-agent affordances without
changing the backend write model:

- Package, source packet, and schema bundle downloads are client-side exports.
- Source packets separate facts, author copy, derived metadata, validation
  diagnostics, and prompt-injection-safe handling rules.
- Agent patch import accepts `6529.cms.agent_patch.v1` JSON, checks the current
  draft id/version/hash target, previews the diff, recomputes package hashes,
  and runs local V1 validation.
- Patch import never saves, server-validates, signs, stores, or publishes.
  Users must explicitly apply the patch to the local draft, then separately use
  owner-gated backend actions.
- The MCP read-tool contract is documented as a future read-only interface until
  backend draft storage and authenticated read endpoints exist.

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
- Agent tab fallback debt: `ProfileCmsAgentPanel` source packet labels,
  workspace copy, and rejection states are now message-backed in `en-US`, but
  non-source locale dictionaries intentionally fall back to `en-US`. User
  impact remains limited to the hidden flagged builder route.
- Owner/follow-up: frontend CMS builder lane should add partial-locale builder
  keys before the route exits hidden feature-flag status.
- Remediation: translate `profileCms.builder.*` chrome keys and decide whether
  seed package copy should remain authored defaults, move to locale-specific
  starter templates, or be replaced by the backend Phase 5 deterministic
  generator output once that durable source of truth is wired.
