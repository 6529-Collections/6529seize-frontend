# 1,500+ Line Splits — Plan (Thread I)

Owner-directed mission: behavior-preserving refactor splits of every production
source file over 1,500 lines, following the methodology proven by the
CollectionDelegation series (#3106 -> #3107 -> #3110). This document is the
roadmap PR: the authoritative file inventory, cross-thread boundaries, split
invariants, per-file module maps, and the validation bar per risk tier. Code
moves start only after this plan is visible to reviewers.

Review protocol for every PR in this series: review requested from the
maintainers team, no agent-side merges, iterate with review bots until every
lane is clean, stop at ready-for-review.

## Authoritative inventory

Fresh scan at `origin/main` `e70de6a90`, aligned with
`scripts/debt-ratchet.cjs` semantics (same `SCAN_DIRS`, `__tests__`/
`__mocks__`/`*.test.*`/`*.spec.*` exclusions, same line counting). 27 files
exceed 1,500 lines. `oversized_files` baseline at this commit: 89
grandfathered (cap 800).

Two expected entries from the kickoff brief are gone and verified gone:
`components/tech/tech-content.ts` does not exist on main, and
CollectionDelegation is owned by the open Thread H stack. Twelve files not in
the kickoff brief are picked up by the fresh scan (sentry filters, profile-cms
trio, waves/header/auth/meme-calendar files, github-preview service).

| # | File | Lines | Tier | Status |
| --- | --- | ---: | --- | --- |
| 1 | `utils/sentry-client-filters.ts` | 2,796 | A | in scope |
| 2 | `components/drop-forge/launch/DropForgeLaunchClaimPageClient.tsx` | 2,422 | F | in scope (last) |
| 3 | `components/profile-cms/CmsSiteRenderer.tsx` | 2,393 | C | in scope |
| 4 | `components/drop-forge/craft/DropForgeCraftClaimPageClient.tsx` | 2,378 | F | in scope (last) |
| 5 | `app/api/og-metadata/drops/[id]/image.tsx` | 2,314 | B | in scope |
| 6 | `components/waves/CreateDropContent.tsx` | 2,260 | E | in scope |
| 7 | `components/drop-forge/launch/DropForgeLaunchClaimPageClient.view.tsx` | 2,213 | F | in scope (last) |
| 8 | `components/waves/OpenGraphPreview.tsx` | 2,203 | C | in scope |
| 9 | `components/profile-cms/CmsThreeDViewer.tsx` | 2,065 | C | in scope |
| 10 | `components/delegation/CollectionDelegation.tsx` | 2,033 | — | EXCLUDED: Thread H stack (#3106) owns it |
| 11 | `components/auth/Auth.tsx` | 2,008 | D | in scope |
| 12 | `app/about/press/page.tsx` | 2,005 | S | in scope (first) |
| 13 | `components/profile-cms-builder/ProfileCmsBuilder.tsx` | 1,887 | deferred | blocked by open PRs #3093/#3096 |
| 14 | `components/waves/discovery/WaveScoreTransparencyPage.tsx` | 1,844 | C | in scope |
| 15 | `app/om/6529-museum-district/page.tsx` | 1,830 | S | in scope |
| 16 | `app/museum/page.tsx` | 1,800 | S | in scope |
| 17 | `app/api/github-preview/service.ts` | 1,722 | A | in scope |
| 18 | `app/museum/6529-fund-szn1/capsule-house/page.tsx` | 1,716 | S | in scope |
| 19 | `components/meme-calendar/MemeCalendar.tsx` | 1,672 | C | in scope |
| 20 | `app/museum/6529-fund-szn1/cod/page.tsx` | 1,636 | S | in scope |
| 21 | `components/header/header-search/HeaderSearchModal.tsx` | 1,629 | C | in scope |
| 22 | `app/museum/genesis/jiometory-no-compute/page.tsx` | 1,604 | S | in scope |
| 23 | `components/header/share/HeaderShare.tsx` | 1,597 | C | in scope |
| 24 | `app/museum/genesis/fragments-of-an-infinite-field/page.tsx` | 1,579 | S | in scope |
| 25 | `app/museum/genesis/gazers/page.tsx` | 1,568 | S | in scope |
| 26 | `app/museum/genesis/kai-gen/page.tsx` | 1,544 | S | in scope |
| 27 | `components/auth/SeizeConnectContext.tsx` | 1,506 | D | in scope |

Membership and sizes are re-verified before each split PR; the table above is
the baseline, not a frozen contract.

## Cross-thread boundaries and flags

- **`components/delegation/**` is off-limits** until Thread H's stack
  (#3106/#3107/#3110) merges. Excluded from this series entirely.
- **`ProfileCmsBuilder.tsx` deferred**: open PRs #3093 (builder API alignment)
  and #3096 (publish signing) modify it directly, with #3092/#3094/#3098
  adjacent. Splitting it now guarantees churn against an active feature lane.
  It stays on the list and is picked up after those PRs land; if they are
  still open when the rest of the series is done, it goes back to the
  orchestrator as a handoff item.
- **Museum CMS-migration flag (reviewer decision requested)**: PR #3094 lands
  a static-page-to-CMS converter with `app/museum/**` named as the follow-on
  target (143 pages, currently at feasibility-report stage). The eight
  museum/om pages in Tier S are potential future CMS-migration deletions, and
  the #3094 converter parses the current single-file TSX shape. Default plan:
  split them anyway (they are live production routes today, the split is
  cheap and parity-verified, and the converter can read pre-split shapes from
  git history or be pointed at updated manifests). If the reviewer prefers to
  hold `app/museum/**` for the migration decision, Tier S shrinks to
  `app/about/press` + `app/om/6529-museum-district` and the rest are recorded
  as deliberately-left-out. Flagging here so the call is made on this PR, not
  after code moves.
- **`components/waves/drops/**` adjacency**: another active session works in
  that directory. `CreateDropContent.tsx` imports only
  `normalizeDropMarkdown` from it; the split does not touch
  `components/waves/drops/**` files. Open-PR collision checks
  (`gh pr list --search "<filename>"`) run before every split.
- **Ratchet baseline contention**: every split PR runs
  `node scripts/debt-ratchet.cjs --update` (the healed file leaves the
  grandfather list, `oversized_files` drops monotonically). Thread H's #3110
  also touches the scanner + baseline; whoever lands second rebases and
  re-runs `--update` — trivial, documented here so nobody treats the conflict
  as a surprise.

## Split invariants (Thread H precedent, applied to every PR)

1. **Mechanical moves.** Module-level helpers/constants/types move verbatim.
   Component closures become hooks/components whose only edits are the
   explicit props/params threading. No logic edits in the move commit.
2. **Public interface unchanged.** The original path stays as the
   entry/composition shell (or a facade re-exporting the same names), so
   importers do not change unless an import update is trivially safe and
   called out in the PR body.
3. **Hook call-order preserved.** Library hooks (wagmi, AppKit, react-query,
   next/navigation) keep their exact relative call sequence — existing suites
   mock by call sequence. The PR body includes the before/after hook-order
   table for Tier D/E/F files.
4. **Contract-write code moves verbatim or not at all.** For files mixing
   write logic with view code, views/hooks are extracted around the write
   paths. Write-args builders, `writeContract`/`sendTransaction` call sites,
   and tx-receipt handling keep byte-identical bodies; the PR body includes a
   1:1 parity table of `functionName`/args-builder call sites (as in #3106).
5. **Known bugs preserved.** Zero behavior change includes buggy behavior;
   anything found gets an issue + a follow-up PR, never a drive-by fix inside
   a split (the #3106 -> #3107 pattern).
6. **Every new module under the 800-line cap.** No new grandfather entries.
7. **Quality-pass commit budgeted.** SonarCloud treats moved code as new code
   — each split PR carries a separate, clearly-labeled commit clearing
   new-code findings (duplication, cognitive complexity, map-as-loop) without
   behavior change, mirroring #3106's commit 2.
8. **Ratchet + hygiene.** `--update` in the same PR; CRLF check before every
   commit; DCO signoff; PR body per the write-prs skill.

## PR sequence (risk-ascending)

Standard validation on every PR: typecheck, ESLint `--max-warnings=0` +
Prettier on changed files, `jest --findRelatedTests` over the changed set
(CI-equivalent), full Jest before the final push of each PR,
`react-doctor:diff` for React-bearing changes, debt-ratchet `--update`,
open-PR collision re-check. Tier-specific bars below.

| Seq | Scope | Tier |
| --- | --- | --- |
| 0 | this plan doc | — |
| 1 | `app/about/press/page.tsx` (pattern-setter) | S |
| 2 | om + museum root + capsule-house + cod (4 pages) | S |
| 3 | genesis x4 (jiometory, fragments, gazers, kai-gen) | S |
| 4 | `utils/sentry-client-filters.ts` | A |
| 5 | `app/api/github-preview/service.ts` | A |
| 6 | `app/api/og-metadata/drops/[id]/image.tsx` | B |
| 7 | `components/waves/OpenGraphPreview.tsx` | C |
| 8 | `components/waves/discovery/WaveScoreTransparencyPage.tsx` | C |
| 9 | `components/meme-calendar/MemeCalendar.tsx` | C |
| 10 | `components/header/header-search/HeaderSearchModal.tsx` | C |
| 11 | `components/header/share/HeaderShare.tsx` | C |
| 12 | `components/profile-cms/CmsSiteRenderer.tsx` | C |
| 13 | `components/profile-cms/CmsThreeDViewer.tsx` | C |
| 14 | `components/auth/SeizeConnectContext.tsx` | D |
| 15 | `components/auth/Auth.tsx` | D |
| 16 | `components/waves/CreateDropContent.tsx` | E |
| 17 | `components/drop-forge/craft/DropForgeCraftClaimPageClient.tsx` | F |
| 18 | `components/drop-forge/launch/DropForgeLaunchClaimPageClient.view.tsx` | F |
| 19 | `components/drop-forge/launch/DropForgeLaunchClaimPageClient.tsx` (stacked on 18) | F |
| 20 | `components/profile-cms-builder/ProfileCmsBuilder.tsx` | deferred |

At most 2–3 split PRs open at a time; rebase + re-run `--update` after each
merge. The drop-forge pair 18/19 is a stacked sequence (client imports view);
17 is independent and warms the drop-forge review muscle on the no-writes
file first.

## Validation bar per tier

- **S — static WP-scrape pages.** Hydrated-DOM parity before/after per route
  using the campaign harness
  (`ops/workstreams/repo-health-2026-07/scripts/wp-scrape-dom-capture.mjs`);
  the normalized DOM must be byte-identical. Production build (SSG) green.
- **A — pure logic.** Full focused suites (sentry filters: 164 tests /
  4,803-line suite must stay green while importing only the facade).
  github-preview has no unit suite: before/after JSON parity of the local
  route responses for a fixed set of GitHub URLs (repo, PR, issue, release,
  actions run, file-content, commit) instead.
- **B — OG image route.** Before/after rendered-image comparison for at least
  5 representative drops (text-only chat, single image, 2–4 tile gallery,
  video/file attachment, submission drop): byte-compare first, calibrated by
  a double-render on the base commit; pixel-diff + visual review if the
  renderer proves non-deterministic. Method and results in the PR body.
- **C — presentational/UI.** Component suites green (OpenGraphPreview's
  807-line suite is the anchor); read-only browser spot-walk of the affected
  surface against the public API where cheap (search modal, share modal,
  calendar, transparency page, a wave with link previews, a published CMS
  page incl. 3D viewer).
- **D — auth providers.** Full Jest (auth suites pin hook call sequences);
  `test:e2e:auth-sandbox` before/after; read-only browser walk incl. opening
  the connect modal and the share/QR modal. No wallet operations executed.
- **E — composer.** `test:e2e:composer-sandbox` + `test:e2e:edit-drop-sandbox`
  before/after; full Jest; browser walk of a wave composer (no submissions to
  production).
- **F — drop-forge.** Everything in D/E-level rigor plus:
  `test:e2e:admin-guards-readonly` before/after (drop-forge routes fail
  closed); manual read-only browser walk of `/drop-forge`,
  `/drop-forge/craft`, `/drop-forge/launch` and one claim detail page of each
  kind against the public API — no mint/claim transactions ever; hook-order
  table and contract-write parity table in the PR body; write-path bodies
  byte-diffed against the original.

## Per-file module maps

Estimated sizes are targets from structural profiling; exact numbers land in
each PR's module-map table. Every target is under the 800 cap.

### Tier S — WP-scrape static pages (9 files)

All nine share one shape: a Yoast/WordPress meta block at the top, then a
long static content body (Avada/Fusion-Builder markup), plus footer/chrome
that Thread D's fail-closed codemod skipped on these page shapes. Pattern per
page:

- `page.tsx` keeps: metadata export(s), the meta/head block, top-level layout
  wrapper, and ordered section composition. Target 200–400 lines.
- `sections/section-*.tsx` (co-located per route): the content body moved
  verbatim into 2–4 numbered section components rendered in the original
  order. JSX subtree moves do not change emitted DOM; parity harness proves
  it per route.
- No conversion to `WordPressLegacyAssets` here (different transformation,
  Thread D's lane); chrome moves verbatim into the first/last section.

### Tier A — pure logic

`utils/sentry-client-filters.ts` (2,796) -> facade + 6 modules under
`utils/sentry-client-filters/`:

| Module | Concern | Est. lines |
| --- | --- | ---: |
| `types.ts` | public + internal event/frame/breadcrumb types, `isRecord`-class guards | ~150 |
| `constants.ts` | pattern/token/URL tables, Sets, sample-rate constant | ~200 |
| `value-utils.ts` | value getters, string/frame predicates, breadcrumb scanning | ~450 |
| `network.ts` | low-value network-error target/decision/sampling (FNV-1a hash moves verbatim), third-party telemetry span/network filters | ~600 |
| `wallets.ts` | wallet transport/extension/collision filters (Coinbase, Rabby, WalletConnect, Talisman, injected) | ~500 |
| `errors.ts` | React-DOM frame filters, route parameterization, filename exceptions, wasm-CSP, remaining `shouldFilter*` | ~600 |
| `sentry-client-filters.ts` (facade) | re-exports every current public name incl. `__testing` | ~80 |

The 164-test suite and `sentry-gif-picker-tenor-filter.ts` keep importing the
facade unchanged. Wiring in `instrumentation-client.ts` untouched.

`app/api/github-preview/service.ts` (1,722) -> facade + 5 modules under
`app/api/github-preview/service/`: `types.ts` (~220), `fetchers.ts` (REST +
GraphQL + abort/timeout, ~200), `parsers.ts` (URL/resource parsing + cache
keys, ~250), `content.ts` (binary detection, decoding, excerpts, ~250),
`builders.ts` (state mappers, review/check summaries, per-resource resolvers,
~650). The facade keeps `resolveGithubPreview`, the LRU-TTL cache map, and
the in-flight dedup map so caching semantics are provably untouched.

### Tier B — OG image route

`app/api/og-metadata/drops/[id]/image.tsx` (2,314) -> facade + modules under
`app/api/og-metadata/drops/[id]/og-image/`: `types.ts` + `constants.ts`
(canvas/colors/font tables, ~200), `measure-wrap.ts` (font-metric width
tables + wrapping, moves as one unit, ~350), `media.ts` (kind/MIME/filename +
media asset styling, ~300), `content-lines.ts` (paragraph -> word -> line
assembly, ~400), `attachments.ts` (~150), `layout.ts` (single/gallery tile
geometry, ~400), `submission.tsx` (submission-card model + JSX, ~450),
`chat.tsx` (chat-card model, author row, content lines, media components,
~500), facade `image.tsx` re-exporting `renderDropOgImage` (~80). Satori
constraints (no hooks, inline styles) hold trivially under mechanical moves;
the image-parity harness is the net.

### Tier C — presentational/UI

`components/waves/OpenGraphPreview.tsx` (2,203; no `"use client"`, extracted
modules must not add one) -> `open-graph-preview/` modules: `extract.ts`
(key-table readers, image/favicon/date extraction, ~350), `detect.ts`
(preview-kind guards + extractors per kind, ~350), `format.ts` (domain/date/
media-type/segment-wrapping, ~200), `cards.tsx` (the nine card/skeleton/
unavailable components, ~700), `route-specialized.tsx` (dispatch +
`DefaultOpenGraphPreviewContent`, ~250), shell keeps `OpenGraphPreview`,
`OpenGraphPreviewData`, `LinkPreviewCardLayout`, `hasOpenGraphContent`
(~250).

`components/waves/discovery/WaveScoreTransparencyPage.tsx` (1,844) ->
`wave-score-transparency/`: `formula.ts` (defaults, reconciliation, gates,
~300), `format.ts` (~150), `input.ts` (sanitizers/parsers, ~120),
`CalculatorPanel.tsx` (~450), `results.tsx` (formula pipeline/summary views,
~400), shell page component ~300. The `eslint max-lines` file exemption
comment is removed (dead since the file will be under every cap).

`components/meme-calendar/MemeCalendar.tsx` (1,672) -> sibling modules next
to the existing `meme-calendar.helpers.tsx`: `zoom-labels.ts` (~150),
`mint-tooltips.tsx` (~250), `DrilldownCards.tsx` (~150), `MonthGrid.tsx`
(Month/day cells, ~200), `zoom-views.tsx` (Season/Year/Epoch/Period/Era/Eon,
~450), shell ~350.

`components/header/header-search/HeaderSearchModal.tsx` (1,629) ->
`header-search/` modules: `page-search.ts` (alias tables + token ranking,
~330), `search-pages-data.ts` (category/page constants, ~150),
`HeaderSearchSiteResults.tsx` (~380), `useHeaderSearchQueries.ts` (profile/
NFT/waves queries + result mapping, ~250), shell (modal frame, mode state,
scroll/focus management, render) ~500.

`components/header/share/HeaderShare.tsx` (1,597) -> `share/` modules:
`connection-share-utils.ts` (abort/error/QR/version helpers, ~260),
`connection-share-generators.ts` (native + legacy-desktop share generation +
session verification, moved verbatim with explicit params so the
`ensureActiveSessionV2WebSession` coupling stays visible, ~350),
`ShareModalMenu.tsx` (~130), `share-modal-content.tsx` (navigate/share/apps
display-content builders, ~250), shell (modal lifecycle, cache/abort refs,
focus trap, QR render) ~600.

`components/profile-cms/CmsSiteRenderer.tsx` (2,393; zero hooks, pure
renderer) -> `cms-site-renderer/`: `asset-helpers.ts` (~300), `blocks-media.tsx`
(image/video/audio/gallery/deep-zoom, ~450), `blocks-text.tsx` (heading/
rich-text/quote/callout/button/html-embed, ~350), `blocks-reference.tsx`
(NFT/collection/transaction/wallet-gallery panels + detail/provenance pages,
~600), `blocks-viewer.tsx` (object/room viewer blocks, ~150), shell
(navigation, layout, page dispatch, block switch) ~450.

`components/profile-cms/CmsThreeDViewer.tsx` (2,065) -> `cms-three-d/`:
`runtime.ts` (`createCmsThreeDRuntime`, ~120), `room-navigation.ts` (~200),
`scene-builders.ts` (room/object scene, materials, geometry, asset loading,
~750), `overlay.tsx` (overlay/poster/status/start/fullscreen/link-tray
components, ~350), shell (component, refs/state/effects) ~550. three.js
render-loop and disposal code moves verbatim.

### Tier D — auth providers (maximum care short of drop-forge)

`components/auth/SeizeConnectContext.tsx` (1,506) -> `seize-connect/`:
`wallet-state-machine.ts` (`useConsolidatedWalletState`, ~160),
`stored-accounts.ts` (address validation, storage cleanup, logout/session
revocation utils, ~250), `useSeizeAccountSync.ts` (the account-sync +
add-account-tracking effects, moved verbatim, ~300), `connect-actions.ts`
(connect/disconnect/logout/switch/add-account callbacks, ~450), shell
(provider assembling AppKit/wagmi hooks in the exact current order + context
value memo) ~450. AppKit/wagmi hook call order pinned by the three existing
suites; the PR body carries the order table.

`components/auth/Auth.tsx` (2,008) -> `auth-provider/` (working names):
`session-reminders.ts` (pure reminder/deadline logic, ~250),
`immediate-validation.ts` (`runImmediateAuthValidation` + params, ~150),
`nonce-signing.ts` (`getNonce`/`getSignature`/sign-in flow with error
classes, moved verbatim, ~260), `SignModal.tsx` (modal state derivation +
portal JSX, ~320), `profile-switching.ts` (~180), shell (provider, wallet
sync + token verification effects, context assembly) ~700. JWT
read/validate/remove call sites stay in the shell or move whole-function
verbatim — no restructuring inside token logic.

### Tier E — composer

`components/waves/CreateDropContent.tsx` (2,260) -> `create-drop-content/`:
`part-builders.ts` (media/attachment/part generation + `toApiCreateDropParts`,
~330), `content-helpers.ts` (mentions/nfts/waves updaters, metadata
presence, ~220), `InlineIdentityPicker.tsx` (~170), `useCreateDropState.ts`
(editor/files/metadata/poll state + handlers, ~350), `CreateDropLayout.tsx`
(render sections, ~450), shell (hook composition in current order, submit
orchestration incl. `signDrop`, drop-mode session logic) ~550. Lexical suite
mocks are module-path based; sandbox packs are the behavioral net.

### Tier F — drop-forge (live minting; one coherent sequence)

`DropForgeCraftClaimPageClient.tsx` (2,378; API mutations only, no contract
writes) -> `craft/sections/`: `ImageSection.tsx` (~200),
`AnimationSection.tsx` (~380), `CoreInformationSection.tsx` (~220),
`MetadataSection.tsx` (~270), `ArweaveSection.tsx` + `DistributionSection.tsx`
(~300), `craft-claim-helpers.ts` (media-type/URL/form helpers, ~300), shell
(fetch/permission wiring + composition) ~450. `patchClaim`/`uploadClaimMedia`
call sites move verbatim inside their section components.

`DropForgeLaunchClaimPageClient.view.tsx` (2,213; zero hooks, pure view) ->
`launch/view-sections/`: header/media/details/traits (~350), on-chain claim +
arweave sections (~300), phase tabs + phase configuration form (~450),
airdrop sections (phase0/subscription/research, ~450), pay-artist + minting
actions + metadata-update notice (~350), shell view composing sections with
the same props interface (~250). `DropForgeLaunchClaimPermissionFallbackView`
stays exported from the current path.

`DropForgeLaunchClaimPageClient.tsx` (2,422; five contract-write paths:
initialize/update claim, airdrop, research airdrop, pay-artist
sendTransaction, metadata-only update) -> `launch/`: `launch-claim-helpers.ts`
(the pure helper block at the top of the file, ~490), `useLaunchClaimData.ts`
(claim/roots/airdrops/mint-stat fetch effects, ~300), `useLaunchClaimForms.ts`
(phase windows/prices/research/artist form state, ~250),
`useLaunchClaimWrites.ts` (the five write callbacks + tx-receipt/modal
effects and their ref guards, bodies byte-verbatim; wagmi write/receipt hooks
move with them preserving relative order, ~650), shell (permission gates,
hook composition in current order, render) ~450. This is the one PR where
the write-parity table, hook-order table, admin-guards pack, and the manual
read-only walk are all mandatory before ready-for-review.

## Expected ratchet effect

Each PR heals its file(s) from `oversized_file_allowlist`. Sequence 1–19
alone: `oversized_files` 89 -> 64 from this thread (26 files minus the
deferred builder, minus delegation which Thread H heals). No new entries at
any point.

## Reporting

Run-log entries ride along with milestone PRs (after Tier S, after Tier B,
after Tier D, after Tier F). Final orchestrator report: before/after line
counts per file, PR links with check status, validation evidence per tier,
`oversized_files` trajectory, bot findings with fix/defer rationale, and
anything deliberately left out.
