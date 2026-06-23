# Decentralized Media Resolver Review and Rollout Plan

Audience: 6529 frontend, backend, mobile, Electron, API, infra, QA, and release reviewers.

This document covers both implementation branches for the decentralized media resolver work. The canonical contract files are in the frontend repository under `ops/contracts/`; this review and rollout document is intentionally mirrored in both PRs so each team has the same context.

## Executive Summary

The protocol goal is to stop treating third-party DNS gateways such as `ipfs.io`, `cf-ipfs.com`, `arweave.net`, and similar hosts as canonical media storage. The new default model is:

1. Store and pass native decentralized identifiers where the surface can represent them:
   - `ipfs://<cid>/<path?>`
   - `ipns://<name>/<path?>`
   - `ar://<txid>/<path?>`
2. Resolve web-renderable URLs through the 6529 resolver layer:
   - `https://media.6529.io/ipfs/<cid>/<path?>`
   - `https://media.6529.io/ipns/<name>/<path?>`
   - `https://media.6529.io/arweave/<txid>/<path?>`
3. Keep public DNS gateways only as explicit fallback/debug/share options, never as new canonical storage.

Version 1 does not proxy bytes inside these repos. It standardizes canonical parsing, normalization, resolver URL construction, fallback URL construction, frontend rendering defaults, backend API shape, and backend consumer behavior. The actual `media.6529.io` DNS/CDN/edge byte-serving infrastructure is assumed to be provisioned outside these PRs.

## Why This Change Exists

6529 wants to be a decentralized protocol, not a product whose protocol references silently depend on someone else's DNS gateway. Before this change, the frontend and backend both had scattered IPFS and Arweave handling with different defaults:

- Some flows converted native `ipfs://` to `https://ipfs.io/ipfs/...`.
- Some flows preferred `cf-ipfs.com`.
- Arweave rendering and fallbacks commonly assumed `https://arweave.net/...`.
- A few paths already knew about `ipfs.6529.io`, but it was mixed with third-party gateway behavior.
- Parsing and fallback behavior lived in many small helpers with subtly different path, query, hash, and validation semantics.

That creates protocol drift and makes it hard to reason about what is canonical. This work centralizes the rules so:

- Native decentralized URIs are the first-class representation.
- 6529 is the resolver layer for web contexts.
- External DNS gateways remain available but are visibly secondary.
- FE, BE, mobile, and Electron can share one mental model.

## Non-Goals

This PR pair intentionally does not:

- Implement `media.6529.io` byte proxying.
- Add database migrations.
- Rewrite legacy IPFS upload/MFS flows.
- Remove all third-party gateway allowlist entries.
- Remove legacy `IPFS_GATEWAY_ENDPOINT`.
- Require every copy/share UI in the app to change at once where no copy/debug surface exists yet.

## Contract Summary

Canonical native forms:

- `ipfs://<cid>/<path?>`
- `ipns://<name>/<path?>`
- `ar://<txid>/<path?>`

6529 resolver forms:

- `https://media.6529.io/ipfs/<cid>/<path?>`
- `https://media.6529.io/ipns/<name>/<path?>`
- `https://media.6529.io/arweave/<txid>/<path?>`

Recognized external fallback gateways:

- IPFS path gateways: `ipfs.io`, `cf-ipfs.com`, `cloudflare-ipfs.com`, `gateway.pinata.cloud`, `ipfs.6529.io`
- IPFS subdomain gateways: `<cid>.ipfs.nftstorage.link`, `<cid>.ipfs.dweb.link`, `<cid>.ipfs.cf-ipfs.com`
- Arweave gateways: `arweave.net`, `gateway.arweave.net`, `gateway.ar.io`, `ar-io.net`, `ardrive.net`
- Arweave transaction subdomains: `<txid>.arweave.net`, `<txid>.ar.io`

Rules:

- Recognized gateway URLs are parsed back to native form.
- Query strings and hashes are stripped from recognized decentralized media references and surfaced as warnings in resolver responses.
- Unrecognized HTTP(S) URLs remain unrecognized rather than being rewritten.
- Invalid URLs produce item-level warnings instead of failing a whole batch request.
- `ipfs.6529.io` remains accepted as legacy input/fallback-compatible output, but new default web URLs use `media.6529.io`.

## Backend Changes

Main new module:

- `src/decentralized-media/decentralized-media.ts`

Shared helper API:

- `parseDecentralizedMediaRef(input)`
- `toNativeUri(ref)`
- `to6529ResolverUrl(ref)`
- `toExternalFallbackUrls(ref)`
- `resolveDecentralizedMediaInputs(inputs, options)`
- Compatibility helpers for normalization and fetch fallback lists.

New public API boundary:

- `POST /api/media/resolve`

OpenAPI request:

```json
{
  "inputs": ["ipfs://...", "https://ipfs.io/ipfs/...", "ar://..."],
  "include_external_fallbacks": true
}
```

OpenAPI response item:

```json
{
  "input": "https://ipfs.io/ipfs/<cid>/metadata.json",
  "recognized": true,
  "protocol": "ipfs",
  "native_uri": "ipfs://<cid>/metadata.json",
  "id": "<cid>",
  "path": "metadata.json",
  "resolver_url": "https://media.6529.io/ipfs/<cid>/metadata.json",
  "external_fallback_urls": ["https://ipfs.io/ipfs/<cid>/metadata.json"],
  "warnings": []
}
```

Backend consumers updated:

- NFT-link URI normalization now goes through the shared resolver module.
- OG metadata media URLs now normalize recognized IPFS/Arweave inputs to 6529 resolver URLs.
- Minting-claim Arweave upload fetch/location handling now uses central Arweave parsing/fallbacks.
- Legacy IPFS helper/media checker now delegates parsing and fetch URL generation to the shared module.
- Drop HTML media validation recognizes native and resolver-layer decentralized media references.
- NFT metadata fetch normalization now recognizes native, 6529 resolver, legacy gateway, and fallback gateway forms.

Backend generated/API files updated:

- `src/api-serverless/openapi.yaml`
- generated resolver request/response models
- generated object serializer/route operation wiring

Backend architecture docs updated:

- `docs/architecture.md`

## Frontend Changes

Main new module:

- `lib/media/decentralized-media.ts`

Shared helper API:

- `parseDecentralizedMediaRef(input)`
- `toNativeUri(ref)`
- `to6529ResolverUrl(ref, options?)`
- `toExternalFallbackUrls(ref, options?)`
- `resolveDecentralizedMediaInputs(inputs, options?)`
- `normalizeDecentralizedMediaUrl(input, options?)`
- `getDecentralizedMediaFetchUrls(input, options?)`
- gateway recognition constants

Contract files:

- `ops/contracts/decentralized-media-resolver-v1.md`
- `ops/contracts/decentralized-media-resolver-v1.openapi.yaml`

Configuration:

- Added optional public `MEDIA_RESOLVER_ENDPOINT`.
- Default is `https://media.6529.io`.
- Kept `IPFS_GATEWAY_ENDPOINT` for legacy upload/MFS flows.
- Added `media.6529.io` to CSP and Next image remote patterns.
- Retained third-party gateway allowlist entries as fallback compatibility entries.
- Added IPFS subdomain gateway recognition where CSP/image handling already had gateway awareness.

Frontend consumers updated:

- IPFS context/rendering now defaults decentralized refs to the 6529 resolver URL.
- Gateway fallback handling now tries resolver URL first, then explicit external fallbacks.
- Drop Forge accepts native `ipfs://`, `ipns://`, `ar://`, 6529 resolver URLs, recognized external gateways, bare IPFS CIDs, and bare Arweave transaction IDs where previously supported.
- Interactive memes submission stores native decentralized URIs where possible and previews via `media.6529.io`.
- Attachment metadata URL construction uses native IPFS metadata roots.
- OpenGraph, ENS, Pepe resolve, profile banner/avatar, unsupported media links, Meme additional details, and static Arweave references now normalize through the central module.
- Public copy/share semantics are set up around native URI and 6529 web URL outputs, with third-party fallbacks staying limited to fallback/debug surfaces.

## Review Map

Backend reviewers should focus on:

- Parser correctness for native URI forms, 6529 resolver forms, path gateways, subdomain gateways, nested paths, query/hash stripping, and invalid URLs.
- OpenAPI shape and generated model compatibility.
- API behavior for partial failures. One invalid input must not fail the whole request.
- Whether `external_fallback_urls` should default to included or excluded for every caller. Current contract defaults inclusion to `true`.
- Callers that fetch metadata/media. Confirm resolver-first plus fallback behavior is safe.
- Any deployable loop that imports the changed helper modules.
- Whether route naming and serverless wiring match backend conventions.

Frontend reviewers should focus on:

- The central resolver helper and whether it mirrors backend behavior closely enough for v1.
- CSP and Next image remote patterns. We want `media.6529.io` first-class and third-party gateways retained only as fallback allowlist entries.
- UX surfaces that copy/open links. Native URI and 6529 web URL should be the visible primary pair where such UI exists.
- Interactive memes validation. Security constraints around HTML, path traversal, hashes, encoded path separators, and allowed hosts must remain strict.
- Drop Forge storage link parsing. Native forms should work without regressing bare CID/txid behavior.
- Mobile and Electron rendering. Confirm no runtime assumes only `http(s)` inputs before centralized normalization runs.

Infra/release reviewers should focus on:

- Whether `media.6529.io` is fully provisioned before frontend rollout.
- Whether CDN/cache behavior for `media.6529.io` matches expected IPFS/IPNS/Arweave semantics.
- Whether `MEDIA_RESOLVER_ENDPOINT` should be environment-overridden per deployment stage.
- Whether old gateway egress patterns need monitoring during rollout.

## Test Coverage Added Or Updated

Backend:

- Parser matrix for native IPFS/IPNS/Arweave, 6529 resolver URLs, path gateways, subdomain gateways, invalid URLs, nested paths, and query/hash stripping.
- API route tests for batch success, invalid inputs, and external fallback inclusion.
- NFT-link URI normalization tests.
- OG metadata URL normalization tests.
- Minting-claim Arweave upload/fetch handling tests.
- Legacy IPFS helper tests.
- Drop HTML validation tests.

Frontend:

- Parser/resolver matrix equivalent to backend.
- IPFS context normalization tests.
- Gateway fallback tests.
- Interactive memes validation/submission tests.
- Drop Forge storage link tests.
- Attachment/media display tests.
- ENS preview tests.
- OpenGraph service tests.
- Existing avatar/notification tests updated for resolver URL expectations.

## Verification Notes From Implementation

Backend verification completed:

- Focused no-Docker Jest run passed.
- Root TypeScript check passed.
- ESLint equivalent passed in this Windows environment.
- Standard `npm test` is blocked locally by Docker credential helper setup for Testcontainers.
- Standard `npm run lint` has a PowerShell environment assignment issue locally; equivalent ESLint command was used.

Frontend verification completed:

- Focused Jest run passed.
- Changed-surface ESLint equivalent passed.
- Source TypeScript check passed.
- The repo-local `6529` wrapper failed on this Windows worktree because the shell wrapper has CRLF/path handling issues; guarded equivalent commands were used with `SEIZE_6529_COMMAND=1`.
- `pnpm run build` fails before app build in the frontend `generate` step because the script uses Unix `rm`/`mv` under PowerShell.
- `pnpm run base-build` with required env values reaches Next build. Turbopack fails resolving Bootstrap Sass imports in this Windows/pnpm setup.
- `next build --webpack` compiles, then fails existing generated Next route prop checks under `[user]` routes. That failure is not introduced by this resolver change, but it means a full local production build was not green on this machine.

## Manual QA Plan

Run these checks against an environment where `media.6529.io` is provisioned and the backend API branch is deployed.

Backend API:

1. `POST /api/media/resolve` with native IPFS, IPNS, and Arweave inputs.
2. `POST /api/media/resolve` with `https://media.6529.io/ipfs/...`, `/ipns/...`, and `/arweave/...`.
3. `POST /api/media/resolve` with every recognized external fallback gateway.
4. Confirm unrecognized `https://example.com/foo` returns `recognized=false`.
5. Confirm malformed input returns item-level warning and does not fail the whole request.
6. Confirm query/hash stripping warnings appear for recognized gateway URLs with query/hash.
7. Confirm `include_external_fallbacks=false` suppresses external fallback URL arrays.

Frontend web:

1. Render NFTs whose metadata image/animation fields contain `ipfs://`.
2. Render NFTs whose metadata image/animation fields contain `ar://`.
3. Render existing content that still stores `ipfs.io`, `cf-ipfs.com`, `ipfs.6529.io`, or `arweave.net` URLs.
4. Confirm rendered web URL is `https://media.6529.io/...` before fallback.
5. Simulate resolver failure and confirm explicit fallback logic still reaches recognized third-party gateways where fallback UI/path already exists.
6. Upload/select Drop Forge storage links using native IPFS, native Arweave, 6529 resolver URLs, legacy gateway URLs, bare CID, and bare Arweave txid.
7. Submit interactive meme content with safe IPFS HTML paths and confirm unsafe hash/traversal cases remain rejected.
8. Confirm copy/open actions expose native URI and 6529 web URL where the UI has those actions.
9. Confirm OpenGraph previews normalize decentralized media through `media.6529.io`.
10. Confirm ENS avatar/contenthash previews normalize recognized decentralized refs.

Mobile and Electron:

1. Repeat media rendering checks for `ipfs://`, `ipns://`, `ar://`, and old gateway URLs.
2. Confirm webviews or native shells do not reject native URI values before FE normalization runs.
3. Confirm CSP/image allowlist changes are reflected in packaged runtime configuration.
4. Confirm share sheets or copy flows do not expose third-party DNS gateways as the default link.

## Deployment Plan

Deploy backend first.

1. Deploy the API service containing `/api/media/resolve`.
2. Redeploy backend deployables that bundle changed resolver consumers. At minimum review and redeploy:
   - API service
   - `nftsLoop`
   - NFT-link/media-preview related loop deployables that import `src/nft-links/lib/uri.ts`
   - Any minting-claim deployable that imports `src/minting-claims/claims-media-arweave-upload.ts`
   - Any media-checker deployable that imports `src/media-checker.ts`
3. Confirm `/api/media/resolve` behavior in staging.
4. Confirm `media.6529.io` byte resolution is available for IPFS, IPNS, and Arweave resolver paths.
5. Deploy frontend web with `MEDIA_RESOLVER_ENDPOINT=https://media.6529.io`.
6. Build and release mobile/Electron after web/API smoke tests pass.

Important: if deploy tooling proves that some touched modules are API-only in practice, document that in the release ticket. The safe default is to redeploy every deployable that bundles touched shared modules.

## Rollback Plan

Backend rollback:

- Revert the backend PR or roll back the API deployment to the previous version.
- If frontend has already shipped, resolver URLs may still point at `media.6529.io`; ensure the resolver infrastructure remains available during backend rollback.

Frontend rollback:

- Revert the frontend PR or roll back the frontend deployment.
- If only resolver infrastructure is unhealthy and the frontend code is otherwise sound, temporarily override `MEDIA_RESOLVER_ENDPOINT` only if infra has a vetted 6529-controlled replacement endpoint.
- Do not switch canonical frontend defaults back to third-party gateways except as an emergency rollback decision.

Data rollback:

- No database migration is included in v1.
- No data backfill is required for this PR pair.
- Existing gateway URLs remain parseable as legacy inputs.

## Monitoring And Observability

Recommended rollout monitors:

- `/api/media/resolve` request volume, latency, and 4xx/5xx rates.
- Warning counts by warning code, especially invalid URL and query/hash stripping warnings.
- `media.6529.io` CDN/cache hit rate and origin error rate.
- Frontend image/media load failures grouped by host.
- Fallback gateway usage after resolver-first attempts.
- OpenGraph media fetch failures.
- Minting-claim media upload/fetch failures.
- NFT metadata fetch failures in `nftsLoop`.

Expected healthy behavior:

- `media.6529.io` usage should increase.
- New third-party gateway URLs should stop appearing as canonical app-generated links.
- External gateway traffic should still exist during fallback and legacy rendering but should trend lower over time.

## Risks And Mitigations

Risk: parser mismatch between FE and BE.

- Mitigation: both repos now have parser matrix tests. Reviewers should compare fixtures and edge cases directly.

Risk: `media.6529.io` not ready at frontend release time.

- Mitigation: deploy backend/API first, verify resolver infrastructure separately, and keep external fallbacks available.

Risk: IPNS behavior differs from IPFS/Arweave because names can resolve dynamically.

- Mitigation: v1 only standardizes URL forms. Infra must define cache/TTL behavior for IPNS.

Risk: hidden copy/share surfaces still expose third-party gateway URLs.

- Mitigation: this PR covers known surfaces touched by current helpers. Reviewers should search for remaining direct `ipfs.io`, `cf-ipfs.com`, and `arweave.net` references before merge.

Risk: mobile/Electron native URI handling differs from web.

- Mitigation: native URIs should be normalized before webview/image rendering. QA must test package builds, not only browser dev.

Risk: generated backend OpenAPI files drift.

- Mitigation: generated models were updated for this endpoint. On Unix-like CI, run the repo generation commands and compare output.

## Reviewer Search Checklist

Before approval, run targeted searches in both repos:

- `ipfs.io`
- `cf-ipfs.com`
- `cloudflare-ipfs.com`
- `gateway.pinata.cloud`
- `ipfs.6529.io`
- `arweave.net`
- `gateway.arweave.net`
- `gateway.ar.io`
- `ar-io.net`
- `ardrive.net`
- `ipfs://`
- `ipns://`
- `ar://`
- `MEDIA_RESOLVER_ENDPOINT`
- `media.6529.io`

Remaining direct gateway references should be either:

- central parser/fallback constants,
- tests,
- docs/contracts,
- explicit legacy upload/MFS behavior,
- explicit fallback/debug behavior.

## Merge Order

1. Backend PR: add shared resolver module and `/api/media/resolve`.
2. Frontend PR: consume central FE resolver and contract files.

The frontend PR should not be deployed before the backend API and `media.6529.io` infrastructure are verified.
