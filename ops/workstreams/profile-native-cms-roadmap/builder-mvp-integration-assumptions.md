# Builder MVP Integration Assumptions

Last updated: 2026-06-17.

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

- The builder emits a V1 `CmsPackageV1` candidate with one homepage route:
  `/{handle}/index.html`.
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
- Wallet gallery generation, NFT indexing, 3D rooms, and AI-agent MCP flows are
  out of scope here.

## Localization Follow-Up

- Route: `/{handle}/cms/builder`
- Current source locale: `en-US`
- Current fallback behavior: partial locale dictionaries fall back to `en-US`
  for the builder chrome.
- User impact while feature-flagged: authors using `en-GB`, `fr-FR`, `es-ES`,
  or `de-DE` see English-only builder chrome and English starter package
  content. Starter package text is treated as editable authored content, not
  translated runtime chrome.
- Owner/follow-up: frontend CMS builder lane should add partial-locale builder
  keys before the route exits hidden feature-flag status.
- Remediation: translate `profileCms.builder.*` chrome keys and decide whether
  seed package copy should remain authored defaults or move to locale-specific
  starter templates.
