# Artwork documentation v1

Status: implementation specification, 9 September 2026. No feature, API, migration, production rollout or on-chain behavior is implemented by this package.

Build reusable artwork documentation in 6529. An artist can begin while submitting a work, return after submission or selection, and add documentation later in the work's life. Keys and Gates is the first program configuration. Structured information lives in the existing database and original files in restricted object storage. **Mint preparation, IPFS/Arweave publication, contract writes and mint signing are outside this delivery.**

## Read order and ownership

| Specification | Primary implementers | Purpose |
|---|---|---|
| [01 Product and workflows](01-product-and-workflows.md) | Product, FE, BE | Scope, modules, timing, ownership, states and submission integration |
| [02 Field catalogue](02-field-catalogue.md) | Product, BE, FE, registrar | Field definitions, validation, visibility and conditional requirements |
| [03 Backend and API](03-backend-and-api.md) | BE, FE | Storage, permissions, versioning, endpoints, uploads and concurrency |
| [04 Frontend](04-frontend.md) | FE, design | Routes, component boundaries, screens, autosave and recovery |
| [05 Artist guidance and copy](05-artist-guidance-and-copy.md) | Product, editorial, FE | Ready-to-use explanation, field help, errors and marketing language |
| [06 Keys and Gates pilot](06-keys-and-gates.md) | Coordinator, product, BE | Initial configuration, source import and work-specific follow-ups |
| [07 Delivery and acceptance](07-delivery-and-acceptance.md) | All implementation teams | Ordered work packages, acceptance scenarios and launch evidence |
| [08 Stream handoff boundary](08-stream-handoff-boundary.md) | Stream, BE | Future-facing record mappings without implementing mint preparation |

The product name in the UI is **Artwork documentation**. “Dossier” is an internal domain term. Normative MUST/MUST NOT requirements govern this proposed implementation. SHOULD allows a documented implementation tradeoff. These requirements do not amend Museum program policy or claim deployed Stream conformance.

The [resolved Keys and Gates configuration example](examples/keys-and-gates-profile.json) makes module selection, field IDs, conditional-rule IDs and upload limits concrete. It is a specification fixture, not a runtime import or deployed configuration. AD-01 turns this contract into validated backend/OpenAPI schemas and generated FE types.

## Decisions fixed for implementation

1. One documentation domain serves inline submission and standalone editing. Components do not own separate copies of answers.
2. Saving documentation is independent of submitting a Wave drop. Optional documentation cannot block an otherwise valid submission.
3. Server-saved drafts are the normal persistence mechanism. No local-first platform, offline client, client-side key-management system or decentralized draft publication is required.
4. A work ID exists before any token ID. Wave drops, programs and future chain identities are relationships, not the work's primary key.
5. Artist identity information is reusable, but each work pins the artist-record revision it uses. Updates never silently rewrite confirmed works.
6. Saved, artist-confirmed and reviewed are separate states. Artist confirmation in this phase is an authenticated database action, not a wallet signature, legal identity verification, copyright transfer or mint consent.
7. All documentation is private to authorized participants during this phase. “Intended for public record” describes a future publication choice, not present public access.
8. Original uploaded bytes are preserved. Social display processing never replaces an original master.
9. Program policy and module versions are pinned. New requirements do not silently make a previously confirmed version incomplete.
10. Mint/export/publication integration is a future consumer of immutable confirmed revisions; intake remains usable without it.

## Product promise

> Your work has a history. Keep it with the work.
>
> Record how you made it, what it means and what future viewers should know. Start with what you have and return whenever you are ready.

The feature makes the value visible at the point of effort. Each module explains what the information helps future viewers, curators or conservators understand. Copy states that information is saved with 6529 now and can support a future permanent record. It does not label drafts on-chain, permanent, authenticated or accessioned.

## Existing implementation anchors

Source baseline: FE `9a4c6a41f582b7c7efc753b1c6f83e0009259e22`; BE `41dfb41a33b9c1c01b7f4cb6a082838febf4594e`; Stream main/planning `92ea123380917032f01aae09691141a2a72df935`. Also inspected Stream's current delivery integration branch at `d08bace213ac72a6d50fe33e5e699be52560a033`; its minimal accepted artist-attribution implementation is distinguished from the wider planned architecture in [the boundary specification](08-stream-handoff-boundary.md). Recheck exact APIs before implementation.

- [Submission container](../../../components/waves/memes/submission/MemesArtSubmissionContainer.tsx), [source-drop draft import](../../../components/waves/memes/submission/utils/submissionDraft.ts), [submission mutation](../../../components/waves/memes/submission/hooks/useArtworkSubmissionMutation.ts): form/preview/prefill and signed-drop patterns. Documentation must not inherit the delete-and-resubmit lifecycle.
- [Multipart upload core](../../../services/uploads/multipartUploadCore.ts): progress/retry mechanics; archival MIME policy and durable resume are new.
- [Drop Forge craft](../../../components/drop-forge/craft/DropForgeCraftClaimPageClient.tsx), [permissions](../../../hooks/useDropForgePermissions.ts), [Memes claims API](../../../services/api/memes-minting-claims-api.ts): reusable controls; the present claims API and launch behavior remain Memes-specific.
- [Profile CMS protocol](../../../lib/profile-cms/protocol/v1/index.ts): canonical package/version patterns. Website schemas and publish signatures are not artwork documentation semantics.
- [Museum catalogue contract](../../../lib/museum/publication/catalog-contract.ts): future reviewed publication projection; no direct catalogue writes in v1.
- [Backend upload service](https://github.com/6529-Collections/6529seize-backend/blob/41dfb41a33b9c1c01b7f4cb6a082838febf4594e/src/api-serverless/src/media/upload-media.service.ts), [image sanitizer](https://github.com/6529-Collections/6529seize-backend/blob/41dfb41a33b9c1c01b7f4cb6a082838febf4594e/src/drops/drop-media-sanitizer.service.ts): existing infrastructure is S3-based; the enabled sanitizer re-encodes image data and deletes ingest originals.
- [Stream metadata specification](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/collection-metadata-contract.md), [artist authority](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/stream-artist-authority.md): future vocabulary and authority boundaries, not launch dependencies for intake.

This is a cross-repository handoff stored in the frontend workstream. The backend owns persistence, validation and API authorization. The frontend owns interaction and explanatory copy. Stream owns future contract/schema admission. The Museum owns program requirements and institutional review.
