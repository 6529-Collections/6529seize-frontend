# Active Context

## Goal

Build and PR a superb profile-native CMS roadmap implementation across 6529seize-frontend and 6529seize-backend, aligned with decentralization goals and excellent crypto/consumer UX.

## Branches

- Frontend: `D:\repos\6529seize-frontend-profile-native-cms`, branch `codex/profile-native-cms`
- Backend: `D:\repos\6529seize-backend-profile-native-cms`, branch `codex/profile-native-cms`

## Constraints

- Current primary FE/BE worktrees are dirty with unrelated user/thread work. Use only the clean task worktrees above.
- Use `seize` / `seize-local-dev` for frontend package/local commands in this Windows Codex environment.
- Backend AGENTS says do not commit unless explicitly asked, but user requested PRs for this workstream, so commits/PRs are authorized when ready.
- Backend API types must come from OpenAPI and generated models.
- Next.js docs index has been loaded; fetch specific docs before App Router routing/metadata/static behavior changes.
- Do not read or expose secret values. Anthropic key is available in Windows Credential Manager as `ANTHROPIC_API_KEY` if a review script needs it.

## Current Strategy

Permanent substrate is underway:

1. FE CMS package contract, canonicalization, hash, validation, fixtures - built.
2. FE public renderer from fixtures, including provenance and crypto/NFT blocks - built.
3. FE profile website CTA and `/{profile}/index.html` public route - built with fixture-backed resolver boundary.
4. Backend entities/OpenAPI/CRUD skeleton for sites/packages/publish pointer - built.
5. Profile CMS Studio authoring surface for deterministic wallet-gallery package generation - built as first-pass UX.

## Current FE Slice

- Package schema/helpers: `lib/cms/*`.
- Fixture packages: gallery and transaction explainer in `lib/cms/fixtures.ts`.
- Public renderer: `components/cms/public/CmsPageRenderer.tsx`.
- Fixture routes: `/cms-fixtures/gallery`, `/cms-fixtures/transaction`.
- Profile CMS route shape: `/{profile}/index.html`, currently fixture-backed for `/punk6529/index.html`.
- Profile CTA: `Website` button appears on `/punk6529` when a primary CMS package exists.
- Resolver is backend-first via `/api/cms/profile/{identity}/primary`, validates package hashes, and falls back to fixtures for local/dev.
- Authoring surface: `/tools/profile-cms` lets a profile draft a wallet gallery package, pick editorial/grid/3D-room style intent, choose IPFS/Arweave/both storage intent, copy deterministic package JSON, export a package file, and publish through existing wallet auth to the backend CMS primary pointer.
- Dev verification blocker fixed: scoped `components/waves/drop/VoteButton.module.scss` pure selector so webpack dev can compile.

## Current BE Slice

- Entities: `cms_sites` and `cms_published_packages` via `src/entities/ICmsSite.ts`.
- Public endpoints:
  - `GET /api/cms/profile/{identity}/primary`
  - `GET /api/cms/packages/{package_hash}`
- Authenticated endpoints:
  - `GET /api/cms/my/sites`
  - `POST /api/cms/sites`
  - `POST /api/cms/sites/{site_id}/published-packages`
- Published package rows are immutable by `package_hash`; site rows carry the mutable primary pointer.
- OpenAPI regenerated; new generated models are `ApiCms*`.

## Open Decisions

- MVP signing mechanism: existing wallet signature path versus server-side placeholder publish intent until wallet UX is wired.
- IPFS provider for first live publish adapter.
- The Studio publish action currently sends a placeholder fixture-style signature envelope; production signing still needs an EIP-191/EIP-712 package signature UX.
- Initial collection knowledge packet fixtures.
- Whether CMS public routes should bypass global app providers that trigger unrelated local wave/emoji fetch noise.

## Next Actions

- Re-run final FE changed-file typecheck/tests after Studio polish.
- Re-run backend tsc/eslint/focused tests.
- Decide whether to add direct authenticated publish from Studio before PR, based on existing FE auth/API client patterns.
- Run second-review screenshot pass once screenshots are stable.
- Prepare FE/BE commits, push branches, open PRs, and iterate on review bot feedback.
