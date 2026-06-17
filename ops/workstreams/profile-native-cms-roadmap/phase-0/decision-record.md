# Phase 0 Decision Record

Last updated: 2026-06-17.

## Status

Agent-default implementation decisions for Phase 1.

These decisions are concrete enough for an agentic storm to begin. They remain
human-overridable before public launch or before a cross-repo protocol package
is cut.

Decision owner:

- `storm-lead` until a human owner signs off.

Signoff format:

- `Accepted by: <name or handle>`
- `Accepted at: <YYYY-MM-DD>`
- `Scope: Phase 0/1 protocol foundation`

Current signoff:

- `Accepted by: pending human review`
- `Accepted at: pending`
- `Scope: Phase 0/1 protocol foundation`

## Scope

Phase 0 locks the choices that prevent frontend, backend, storage, renderer,
builder, and AI-agent lanes from inventing incompatible protocol assumptions.

## Decisions

### URL Model

Decision:

- `/{handle}` remains the normal profile page.
- `/{handle}/index.html` is the profile's primary CMS website.
- CMS subpages use `/{handle}/{path}/index.html`.
- App-owned reserved routes win over handles.
- CMS pages must use the `index.html` suffix.

Rationale:

- Preserves existing profile behavior.
- Makes static export and IPFS/Arweave directory packaging natural.
- Avoids ambiguous app/profile/CMS routing.

### Storage Policy

Decision:

- V1 public publish requires at least one decentralized storage receipt.
- Default publish should attempt both IPFS and Arweave.
- If one provider is degraded, publish may proceed with one decentralized
  receipt only when the UI clearly labels partial storage.
- S3/CloudFront/CDN locations are acceleration receipts, never canonical
  storage receipts.

Rationale:

- Meets the "not migrate later" requirement without blocking all publishing on
  one provider outage.
- Keeps canonical artifact decentralized from first real publish.

### Signature Policy

Decision:

- Production package signing uses EIP-712.
- `fixture` signatures are allowed only in fixtures/tests/dev examples.
- EIP-191 is not the production default.
- Signature signs the profile, package hash, payload hash, package schema,
  storage receipt hashes, and intended pointer target.
- EIP-1271/Safe signature verification is required before institutional
  profiles rely on multi-sig publishing.
- Signatures must include domain separation for environment and chain where
  applicable.
- Replay protection uses package hash plus profile pointer target and expected
  previous pointer.

Rationale:

- EIP-712 gives structured, inspectable signing semantics.
- Fixtures need deterministic non-wallet examples.

### Hashing And Canonicalization

Decision:

- Canonical JSON uses RFC 8785 JSON Canonicalization Scheme.
- Hash algorithm is SHA-256 over canonical UTF-8 bytes.
- Hash string format is `sha256:<64-lowercase-hex>`.
- Package hash excludes mutable delivery locations that are not part of the
  signed package payload.
- Storage receipts include provider-specific content ids such as IPFS CID or
  Arweave transaction id.

Rationale:

- Deterministic across languages and clients.
- Friendly to standalone validators and non-JS clients.

### Pointer Model

Decision:

- Profile primary pointer is mutable and append-only-audited.
- Pointer update requires expected previous pointer version/hash.
- Every publish or rollback creates a pointer event.
- Rollback points to an earlier immutable package; it never mutates that
  package.
- Pointer state starts in backend and is later replicated to decentralized
  profile state.
- Duplicate publish requests should be idempotent by idempotency key and
  package hash.
- Stale expected previous pointer must fail.

Rationale:

- Prevents lost updates.
- Keeps rollback auditable.
- Allows launch before the 6529 special-purpose chain exists.

### Package Versioning

Decision:

- V1 schemas use explicit names such as `6529.cms.package.v1`.
- Breaking schema changes require `.v2`.
- Backward-compatible optional fields can stay in `.v1`.
- A package corpus must be kept for compatibility tests.

Rationale:

- Lets alternative clients safely detect support.

### Route Conflict Examples

Decision:

- `/about` remains the app route, even if a profile handle `about` exists.
- `/about/index.html` is not enabled unless product explicitly allows reserved
  root handles later.
- `/punk6529/index.html` resolves the profile CMS primary site.
- `/punk6529/collected/index.html` is a CMS page only if emitted by the package
  route manifest; `/punk6529/collected` remains profile/app behavior.
- Route matching is case-insensitive for handle lookup, but canonical output
  paths use the profile handle chosen by the profile service.
- Duplicate CMS paths and alias collisions are validation errors.

Rationale:

- Makes frontend implementation mechanical and avoids profile tab bleed-through.

### Analytics

Decision:

- CMS primary route class: `profile_cms_site`.
- CMS subpage route class: `profile_cms_subpage`.
- Package error state class: `profile_cms_error`.
- Profile page button click event distinguishes published, not-accelerated, and
  blocked states.

Rationale:

- Prevents CMS pages from being misclassified as generic profile subpages.

### Shared Contract Location

Decision:

- Phase 1 source-of-truth artifacts live in
  `ops/workstreams/profile-native-cms-roadmap/phase-1/`.
- Implementation should move or mirror them into a shared protocol package
  before frontend and backend production code diverge.
- Preferred future frontend path is `lib/profile-cms/protocol/v1/`.
- Preferred long-term path is a shared 6529mono package if that migration
  happens before implementation begins.

Rationale:

- Delivers Phase 1 in the current repo while making split-brain schema risk
  explicit.

### Media And Package Limits

Decision:

- Package JSON target limit: 5 MB.
- Package JSON hard warning: 10 MB.
- Individual image original warning: 100 MB.
- Individual generated display derivative warning: 15 MB.
- Individual video derivative warning: 250 MB.
- Individual GLB/glTF warning: 50 MB, strong warning above 25 MB for mobile.
- Texture dimension warning: above 4096 px on either axis.
- Total package asset warning: 500 MB.

Rationale:

- Keeps IPFS/Arweave and mobile rendering practical.
- Warnings are not permanent protocol bans; they are V1 launch guardrails.

### Art/NFT Display V1

Decision:

- V1 includes art assets, display variants, NFT media profiles, posters,
  provenance panels, lightbox, optional deep zoom manifests, simple 3D rooms,
  and basic GLB/glTF object viewing.
- 2D art in 3D rooms must have a faithful mode and link to a faithful 2D detail
  page.

Rationale:

- Makes art display first-class without building a full 3D world editor.

### Static Site Prior Art

Decision:

- V1 does not build Astro, Starlight, Jekyll, Hugo, Eleventy, Docusaurus,
  VitePress, MkDocs, Gatsby, or Zola exporters.
- V1 natively adopts their best ideas: typed collections, source loaders,
  frontmatter-style metadata, static-first islands, scoped defaults,
  archetypes, taxonomies, data cascade, pagination, permalinks, aliases, static
  search, site/build manifests, Markdown import/export, and local tooling
  direction.

Rationale:

- Preserves framework-neutral protocol.
- Still benefits from decades of static-site design.

### AI-Agent Affordances

Decision:

- 6529 does not pay for arbitrary user inference.
- V1 provides AI-friendly affordances: JSON schema bundle, source packets,
  read/validate/preview MCP tools, `SKILL.md` guidance, structured validation
  errors, and agent patch schema.
- Agent patch import/review UI is V1.1 unless V1 capacity permits.
- Publishing/signing remains explicit profile-owner action.

Rationale:

- Lets users bring their own AI while keeping 6529 protocol open and low-cost.

### First Custom 6529 Collections

Decision:

- First native collection templates target:
  - The Memes by 6529.
  - 6529 Gradients.
  - NextGen, if current metadata paths are stable enough.

Rationale:

- These are core 6529 collections and good demonstrations of spectacular
  collection/card pages.

### Feature Flag

Decision:

- All runtime CMS routes, builder entry points, and publish actions launch
  behind a feature flag until Phase 3 end-to-end publish resolves a signed
  package through a pointer.

Rationale:

- Allows aggressive PR merge sequencing without exposing partial product.

## Remaining Human Review Items

- Confirm whether public launch should require both IPFS and Arweave receipts
  instead of one required plus one preferred.
- Confirm EIP-712 signing copy and exact typed-data domain.
- Confirm media limits against expected 6529 collection assets.
- Confirm first institutional migration pilot.
