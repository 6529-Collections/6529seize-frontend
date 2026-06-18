# Phase 5-8 QA Checklist

Last updated: 2026-06-18.

## Purpose

This is the living QA and integration checklist for the profile-native CMS
Phase 5-8 lanes:

- Phase 5: wallet gallery generator.
- Phase 6: art and NFT display excellence.
- Phase 7: 3D rooms and object viewer.
- Phase 8: AI-agent affordances.

The checklist tracks expected worker branches, early contract collisions,
fixture-driven coverage, and browser smoke requirements. Keep it current as
worker PRs appear.

## Current Baseline

- Base branch for this QA lane: `codex/profile-cms-builder-mvp`.
- QA branch: `codex/cms-phase5-8-qa-integration`.
- Builder MVP reference PR: [#2726](https://github.com/6529-Collections/6529seize-frontend/pull/2726).
- Runtime bridge reference: PR #2720 per the workstream run log.
- Local worker refs for `codex/cms-gallery-builder-flow`,
  `codex/cms-art-display-excellence`, `codex/cms-3d-rooms-mvp`, and
  `codex/cms-ai-agent-affordances-ui` currently have no diff from the builder
  base. An explicit fetch found no remote ref for
  `codex/cms-gallery-builder-flow`, so the later worker branches should be
  treated as expected/local-only until pushed.

## Worker Branch Tracker

| Lane | Expected branch | Current status | Collision watch |
| --- | --- | --- | --- |
| Phase 5 gallery | `codex/cms-gallery-builder-flow` | Local ref, no diff from base, no PR observed | Builder state/types, wallet source packets, generated routes, media profiles, social image assets |
| Phase 6 art display | `codex/cms-art-display-excellence` | Local ref, no diff from base, no PR observed | `CmsSiteRenderer`, media blocks, image/video/model fallbacks, i18n keys, fixture assets |
| Phase 7 3D rooms | `codex/cms-3d-rooms-mvp` | Local ref, no diff from base, no PR observed | `room_viewer`, `object_viewer`, Three.js/model-viewer choices, canvas fallback, mobile behavior |
| Phase 8 AI-agent | `codex/cms-ai-agent-affordances-ui` | Local ref, no diff from base, no PR observed | agent patch schema, source packets, validation output, builder import/review flow, publish gating |

## Contract Collision Watch

Review these paths first when worker branches start moving:

- `ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/*.package.json`
- `lib/profile-cms/protocol/v1/*`
- `lib/profile-cms/builder/*`
- `lib/profile-cms/runtime/*`
- `components/profile-cms/CmsSiteRenderer.tsx`
- `components/profile-cms-builder/ProfileCmsBuilder.tsx`
- `app/[user]/[...cmsPath]/page.tsx`
- `app/[user]/cms/builder/page.tsx`
- `i18n/messages/en-US.ts`
- `config/env.schema.ts`
- `config/profileCmsBuilderEnv.ts`
- `config/profileCmsRuntimeEnv.ts`

## Fixture Regression Coverage

Current fixture-driven coverage added by the QA lane:

- `__tests__/components/profile-cms/CmsSiteRenderer.phase5-8.test.tsx`
  renders wallet gallery, collection, NFT detail, mixed media, object fallback,
  and 3D room fallback fixtures.
- `tests/profile-cms/phase5-8-smoke.spec.ts` prepares opt-in Playwright smoke
  coverage for branch integration. It is intentionally disabled unless
  `RUN_PROFILE_CMS_PHASE5_8_E2E=true` and the relevant route env vars are set.

Run focused fixture coverage with:

```powershell
seize run test:no-coverage -- --testMatch "**/__tests__/components/profile-cms/CmsSiteRenderer.phase5-8.test.tsx" --runInBand
```

Run optional browser smoke after a worker branch exposes the relevant routes:

```powershell
$env:RUN_PROFILE_CMS_PHASE5_8_E2E="true"
$env:PROFILE_CMS_BUILDER_SMOKE_PATH="/punk6529/cms/builder"
$env:PROFILE_CMS_GALLERY_HOME_PATH="/punk6529/index.html"
$env:PROFILE_CMS_COLLECTION_PAGE_PATH="/punk6529/collections/the-memes/index.html"
$env:PROFILE_CMS_NFT_DETAIL_PATH="/punk6529/nfts/ethereum/0x33fd426905f149f8376e227d0c9d3340aad17af1/1/index.html"
$env:PROFILE_CMS_SOCIAL_PREVIEW_PATH="/punk6529/index.html"
$env:PROFILE_CMS_ROOM_PATH="/punk6529/rooms/main/index.html"
$env:PROFILE_CMS_AGENT_PATCH_PATH="/punk6529/cms/builder/patches"
seize exec playwright test tests/profile-cms/phase5-8-smoke.spec.ts --project=chromium
```

If a worker branch uses different hidden routes during review, set the env vars
to those paths rather than changing the test.

## Phase 5 Gallery Checklist

- Wallet and ENS inputs normalize, deduplicate, and preserve user intent.
- Multi-wallet snapshots freeze block number, capture time, wallets, owner
  state, hidden NFTs, featured NFTs, and featured collections.
- Generated home, collection, NFT detail, and paginated all-NFT routes stay
  inside the owning profile namespace.
- Generated pages use `nft_media_profiles`, `display_variants`, posters, and
  social image assets rather than raw marketplace thumbnails.
- Hide/spam controls affect generated packages before publish and cannot hide
  provenance needed for audit.
- Published gallery packages do not require live wallet/indexer fetches to
  render.
- Desktop and mobile screenshots cover gallery home, collection page, and NFT
  detail page.
- Social metadata exists for generated home, collection, and NFT detail pages.

## Phase 6 Art/NFT Display Checklist

- Detail views preserve artwork aspect ratio and do not crop originals.
- Grid/dense/contact-sheet modes have stable dimensions and no horizontal
  overflow.
- Video, audio, HTML, model, and deep zoom blocks have posters or readable
  fallback states.
- Sandboxed HTML embeds never use `srcdoc` or `allow-same-origin`.
- Lightbox/focused inspection has keyboard, escape, focus return, reduced
  motion, and metadata-toggle coverage once implemented.
- Original media, derivatives, posters, metadata URI, storage receipt, and
  package provenance are visually distinguishable.
- Accessibility coverage includes alt text, captions/transcripts where media
  requires them, and reduced-motion behavior.

## Phase 7 3D Checklist

- Desktop route renders a nonblank canvas when 3D is enabled.
- Mobile route renders either a functional lightweight room or a clear fallback
  with a link to the faithful 2D detail page.
- Every room placement links to the canonical NFT/detail page.
- Poster/static preview appears before deferred 3D hydration.
- Canvas checks sample pixels and fail with route, viewport, and screenshot.
- Scene loading handles missing GLB/glTF, failed textures, and reduced-motion
  users without blank UI.
- Performance budget is documented before merge: model size, texture size,
  initial JS, and first-interaction target.

## Phase 8 AI-Agent Checklist

- Schema bundle export includes package, agent patch, and validation result
  schemas with versioned names.
- Source packets strip executable HTML and include enough context for safe
  patch generation.
- Agent patch import validates route namespace, unsafe URLs, unknown blocks,
  hash/package drift, and patch operation bounds.
- Review UI shows proposed changes before apply and never publishes directly.
- Apply flow records validation output and keeps publish/signing as a separate
  profile-authorized action.
- MCP or external-agent docs state that user agents bring their own inference
  and 6529 does not pay for arbitrary generation.

## Browser Evidence Standard

For every worker PR that claims visual readiness, capture:

- Route, branch, commit, viewport, and fixture/data mode.
- Screenshot artifact for each covered route.
- Page response status, console/page errors, image load status, and horizontal
  overflow result.
- For 3D, canvas pixel result or explicit mobile fallback result.
- For social preview, metadata values and rendered card/image output where a
  route exists.

Failures should be actionable: include the route, selector or state that failed,
viewport, screenshot name, and whether the failure is fixture, backend, or UI
owned.
