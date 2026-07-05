# Layout Unification Plan (Thread D)

Owner: Thread D ("One layout") of the repo-health 2026-07 campaign.
Baseline for all numbers: `main` @ `98cd4984e` (2026-07-05). This plan is the
Phase 0 deliverable; later PRs update the checklists here via run-log entries.

Definition of done (from campaign README): `src/` folded into the root-level
layout; pages-router remnants migrated or deleted with evidence; no source
file over the 800-line cap; `oversized_file_allowlist` in
`scripts/debt-ratchet-baseline.json` empty.

Out of scope for Thread D: `.github/workflows/*` (Thread A), branch operations
(Thread B), `components/delegation/**` content (Thread C — including its two
grandfathered files), `1a-staging`, deploys.

## Phase 0 — Inventory (done, this PR)

### (a) Stray `src/` tree

14 files, 1,616 lines total. All imports go through the `@/src/...` alias
(no relative `../src` imports). No name collisions with root-level targets.

| src module | lines | target | production importers |
| --- | ---: | --- | --- |
| `src/components/waves/ArtBlocksTokenCard.tsx` | 397 | `components/waves/` | `components/drops/view/part/dropPartMarkdown/handlers/artBlocks.tsx` |
| `src/errors/adapter.ts` | 20 | `errors/` | `components/providers/AppKitAdapterManager.ts`, `utils/appkit-initialization.utils.ts` |
| `src/errors/appkit-initialization.ts` | 15 | `errors/` | `components/providers/WagmiSetup.tsx` |
| `src/errors/wallet.ts` | 30 | `errors/` | `components/auth/SeizeConnectContext.tsx`, `components/drops/create/utils/CreateDropWrapper.tsx` |
| `src/errors/wallet-auth.ts` | 24 | `errors/` | `wagmiConfig/wagmiAppWalletConnector.ts` |
| `src/errors/wallet-validation.ts` | 13 | `errors/` | `components/providers/AppKitAdapterManager.ts`, `utils/wallet-validation.utils.ts` |
| `src/services/api/artblocks.ts` | 322 | `services/api/` | `src/components/waves/ArtBlocksTokenCard.tsx` |
| `src/services/artblocks/url.ts` | 182 | `services/artblocks/` | `dropPartMarkdown/handlers/artBlocks.tsx`, `ArtBlocksTokenCard.tsx` |
| `src/services/farcaster/url.ts` | 132 | `services/farcaster/` | `app/api/farcaster/route.ts`, `dropPartMarkdown/handlers/farcaster.tsx` |
| `src/services/wikimedia/url.ts` | 42 | `services/wikimedia/` | `dropPartMarkdown/handlers/wikimedia.tsx` |
| `src/services/youtube/url.ts` | 172 | `services/youtube/` | `app/api/open-graph/youtube/service.ts`, `dropPartMarkdown/linkUtils.tsx` |
| `src/types/security.ts` | 46 | `types/` | `components/auth/SeizeConnectContext.tsx` |
| `src/types/window.d.ts` | 11 | `types/` | ambient declaration (no imports) |
| `src/utils/security-logger.ts` | 210 | `utils/` | `components/auth/SeizeConnectContext.tsx`, `components/auth/error-boundary/WalletErrorBoundary.tsx` |

Test importers (move alongside): 13 suites under `__tests__/` reference
`@/src/...`; five live under `__tests__/src/**` and move to the mirrored
root-level test paths (no collisions there). Tooling scan: no `src/`
references in `jest.config.js`, `tsconfig*.json`, `next.config.ts`,
`tailwind.config.ts`, `knip.jsonc`, `sonar-project.properties`, or eslint
configs (the `standalone/standalone-memes-mint/src/**` tree is a separate
app and stays). `scripts/debt-ratchet.cjs` lists `src` in `SCAN_DIRS`;
missing dirs are skipped gracefully, so the entry stays (Thread A owns that
script).

### (b) Pages-router surface — already retired; hygiene remains

The audit line "~134 legacy pages-router files" is stale. Evidence on
`main` @ `98cd4984e`:

- No root `pages/` directory. It was fully removed by "App Routing
  Migration - final cleanup" (PR #1378, merged 2025-09-03, `5785e37b8`).
- `git ls-tree` of the branch-amnesty rescue snapshot (`dac8f5cf1`) also
  contains zero `pages/` paths — the dirty tree had none either.
- 0 imports of `next/router`; 0 occurrences of
  `getServerSideProps`/`getStaticProps`/`getInitialProps`; 0 uses of
  `NextPage`/`AppProps`/`next/document`/`next/app`.
- Debt-ratchet metric `pages_router_files` = 0 (counts code files under a
  root `pages/`).
- App Router serves 287 `page.tsx` routes.

Remaining router-era idioms (Phase 2 scope):

1. `app/sentry-example-page/page.tsx` — imports `next/head`; `<Head>` is a
   no-op in the App Router, so the title/meta it sets are dead code.
2. `components/messages/layout/MessagesLayout.tsx` — imports `next/head` to
   inject `body { overflow: hidden }`; also a no-op in the App Router, so
   either the style is silently not applied (bug) or it is redundant.
   Verify actual behavior in the running app before changing anything.

### (c) Oversized files (ratchet scope: >800 lines, tests/generated excluded)

`oversized_file_allowlist` = 139 files (`node scripts/debt-ratchet.cjs
--details oversized_files`). Line cap = 800 (`MAX_SOURCE_FILE_LINES`).
Clusters:

| Cluster | Files | Notes |
| --- | ---: | --- |
| WordPress-scrape content pages (`app/museum/**`, `app/om/**`, `app/blog/**`, `app/about/{media,press}`, `app/capital/**`, `app/education/tweetstorms`) | 81 | Static scrapes of 6529.io; each repeats a near-identical head-asset block (~150-200 lines) and footer/to-top block (~40 lines); diff between two pages' first 400 lines is ~70 lines |
| Interactive components (`components/**`) | 37 | 2 of these are `components/delegation/**` → Thread C, not ours |
| API route handlers/services (`app/api/**`) | 13 | og-metadata OG-image JSX, open-graph/github-preview/wikimedia services |
| Hooks/contexts/lib/services/helpers/utils | 8 | incl. `utils/sentry-client-filters.ts` (2,796 — mostly typed string-list data) |

Top offenders (full ranked list = ratchet `--details` output):
`utils/sentry-client-filters.ts` 2,796; `DropForgeLaunchClaimPageClient.tsx`
2,422; `CmsSiteRenderer.tsx` 2,393; `DropForgeCraftClaimPageClient.tsx`
2,378; `app/api/og-metadata/drops/[id]/image.tsx` 2,314;
`CreateDropContent.tsx` 2,262; `DropForgeLaunchClaimPageClient.view.tsx`
2,213; `OpenGraphPreview.tsx` 2,203; `CmsThreeDViewer.tsx` 2,065;
`Auth.tsx` 2,008; `app/about/press/page.tsx` 2,005.

Outside ratchet scope (no action required for the DoD, noted for honesty):
`abis/abis.ts` (3,577) and `i18n/messages/en-US.ts` (1,468) live in dirs the
ratchet does not scan; both are data-only.

## Target layout

One tree, rooted at the repo top level, per AGENTS.md's repo map:
`app/` (routes) + `components/`, `services/`, `errors/`, `types/`, `utils/`,
`hooks/`, `contexts/`, `helpers/`, `lib/`, `store/`, `entities/`,
`wagmiConfig/`. No root `src/`; no root `pages/`. `@/*` alias unchanged.
`standalone/**` keeps its own self-contained layout.

## Phase 1 — Fold `src/` (one PR)

Mechanical move with `git mv` so history follows:

1. `git mv` each `src/*` module to its target from the table above; `git mv`
   the five `__tests__/src/**` suites to mirrored paths.
2. Rewrite `@/src/` -> `@/` across the tree (imports and jest module paths
   are alias-based, so this is the only textual change).
3. Delete the then-empty `src/`.
4. `types/window.d.ts`: confirm the ambient `Window` augmentation still
   compiles from `types/` (tsconfig `include` covers `**/*.ts`, so it will;
   verify no duplicate-identifier conflict with existing `types/*.d.ts`).

Validation: `6529 run typecheck` (or `check:changed` if typecheck script
differs), full jest, `6529 run build`, knip for orphans,
`react-doctor:diff`. No ratchet baseline change expected (no moved file is
oversized; counts move between identical scans). Risk: low — alias rewrite
plus renames, no logic edits.

## Phase 2 — Router hygiene (one small PR)

No routes to migrate or delete: the ledger in Phase 0(b) shows the pages
router is fully retired. Remaining work:

1. Remove the dead `next/head` usage in `app/sentry-example-page/page.tsx`
   (fold the title into its existing metadata path or drop it).
2. Fix `components/messages/layout/MessagesLayout.tsx`: reproduce the
   intended `body` overflow behavior with a supported App Router mechanism
   (e.g. effect-scoped class toggle, as other layouts in the repo do), or
   delete it if the behavior is already handled elsewhere. Evidence in PR:
   before/after behavior note on the `/messages` route.
3. Keep `pages_router_files` = 0 in the ratchet (already enforced;
   fail-closed if anyone reintroduces a root `pages/`).

Evidence standard for any future route deletion (recorded for the campaign,
even though none is planned): knip result + zero grep references + absence
from `next-sitemap.config.ts` output and `proxy.ts` matchers + `next build`
route table diff + fetched HTML (or screenshot) of the app-router
replacement + the pre-deletion SHA in the PR body.

## Phase 3 — Split the 137 (139 minus 2 delegation) oversized files

Standard for every split: behavior-preserving extraction; public interface
(module specifier consumers import) stays stable or all importers updated in
the same PR; one file or one tight cluster per PR; full jest + `6529 run
build` + `react-doctor:diff` green; `node scripts/debt-ratchet.cjs --update`
in the same PR so `oversized_files` and the allowlist shrink monotonically.
Splitting must produce cohesive single-concern modules (view/logic/data,
extracted hooks), not `part1.tsx`/`part2.tsx`.

Wave order (re-ranked from current main):

- **W1 — data movers (cheap, low risk).** `utils/sentry-client-filters.ts`
  (types + rule-list data -> typed data modules + thin logic);
  `app/api/og-metadata/drops/[id]/image.tsx` (constants + per-section OG
  JSX -> `_lib` section modules, pattern already exists);
  `lib/profile-cms/protocol/v1/validation.ts`; `helpers/Helpers.ts`;
  `services/api/wave-drops-v2-api.ts`; `lib/twitter/fetcher.ts`;
  `app/api/**` open-graph/github-preview/wikimedia/farcaster/pepe services
  (schema/parsing/render sections).
- **W2 — WP-scrape content cluster (81 files, mechanical).** Extract the
  shared head-asset block and footer/to-top block into parameterized shared
  components (target: `components/wp-scrape/`), rewrite pages to use them —
  this alone puts most 800-1,300-line pages under the cap and removes
  megabytes of duplicated inline CSS strings. Pages still over the cap
  (press 2,005; om-district 1,830; museum 1,800; capsule-house 1,716; a few
  more) get their remaining body split into per-section route-local
  components. Rendered-output parity checked by comparing pre/post HTML for
  a sample of pages (dev server fetch) plus full jest. Batched PRs of
  10-20 pages to keep review tractable.
- **W3 — interactive giants (one per PR, highest care).** Order:
  `DropForgeLaunchClaimPageClient.tsx` + `.view.tsx`,
  `DropForgeCraftClaimPageClient.tsx`, `CreateDropContent.tsx`,
  `OpenGraphPreview.tsx`, `CmsSiteRenderer.tsx`, `CmsThreeDViewer.tsx`,
  `Auth.tsx`, `ProfileCmsBuilder.tsx`, `WaveScoreTransparencyPage.tsx`,
  `MemeCalendar.tsx` (+ helpers), `HeaderSearchModal.tsx`,
  `HeaderShare.tsx`, `SeizeConnectContext.tsx`, `WaveDrop.tsx`,
  `TwitterPreviewCard.tsx`, `NotificationsContext.tsx`,
  `ReactQueryWrapper.tsx`, then the remaining `components/**`,
  hooks and contexts under 1,500 lines.
- ~~Skip: `components/delegation/*` (Thread C).~~ Scope update 2026-07-05:
  Thread C closed (Bootstrap exit verified), so delegation files are back in
  Thread D's W3 scope — `CollectionDelegation.tsx` (2,029) and
  `walletChecker/WalletChecker.tsx` split with the same behavior-preserving
  bar plus extra manual verification (wallet flows).

Wave-order update (2026-07-05): W2 runs before W1 — the conformance scan
found every scrape page uniform against the shared components that already
shipped in PR #2593, making W2 the highest count reduction per unit of
risk. W2 parity gate per batch: fail-closed codemod + hydrated-DOM
before/after diff with only sanctioned normalizations (font-preload
`crossorigin`, oembed URL cleanup, footer a11y attributes).

## Progress ledger

- [x] Phase 0 inventory (this PR)
- [x] Phase 1: `src/` folded (PR #3048)
- [x] Phase 2: router hygiene (PR #3050 — pages-router ledger closed)
- [ ] Phase 3 W1: data movers
- [ ] Phase 3 W2: WP-scrape cluster (batches 1-2 merged: 55 pages, 139 -> 90; ~21 body-split pages remain)
- [ ] Phase 3 W3: interactive giants (now incl. delegation)
- [ ] Grandfather list empty
