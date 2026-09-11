# Frontend specification

## 1. Integration with current main

The reviewed frontend uses Next.js 16.2.11, React 19.2.4, TanStack Query, Reown, wagmi and viem. It already provides canonical art/detail routes, consolidated ownership browsing, season progress, Pebbles trait sets, wallet transfer simulation and transaction feedback. Secondary-market UI currently displays market statistics and external links; these are not executable-order contracts.

Use the existing visual system and media renderers. The collection surfaces mix migrated Tailwind components and older CSS; new controls should follow modern `tw-`/`iron-*` patterns rather than extend legacy global styles. Read the installed version-matched Next.js documentation before implementation. This proposal does not change Next.js code.

| Existing source | Proposed integration |
|---|---|
| `components/the-memes/TheMemes.tsx`, `TheMemesCard.tsx` | Add Collect mode, missing-to-target filters and separate executable-price results without changing click-on-art navigation. |
| `components/the-memes/MemePageLiveStats.tsx`, `MemePageYourCards.tsx` | Add listings/offers panel and Buy, Make offer, List with exact quantity and wallet context. Keep historic/indicative statistics labeled. |
| `components/6529Gradient/6529Gradient.tsx`, `GradientPage.tsx` | Add specific-ID/lowest-available discovery and the shared single-token trade panel. |
| `components/nextGen/collections/collectionParts/NextGenTraitSets.tsx` | Add Complete my Palette/Size/Traced/Ultimate set to the existing Pebbles view; pass canonical missing-value requirements into the planner. |
| `components/nextGen/collections/NextGenTokenList.tsx`, `nextgenToken/NextGenTokenAbout.tsx` | Reuse traits/listing filters and add verified order availability and shared execution controls. |
| `components/user/collected/UserPageCollected.tsx`, `stats/helpers.ts`, `UserPageCollectedStats.tsx` | Add Complete next set and Manage listings. Keep owned counts and next-set progress distinct. |
| `components/auth/seizeConnectTypes.ts`, `SeizeConnectContext.tsx` | Consume live signer capability, Safe capability and active wallet independently from profile/proxy identity. |
| `components/common/OnchainTransactionModal.tsx`, `components/nft-transfer/TransferModal.tsx` | Reuse accessible modal and simulation conventions, extending lifecycle for signed orders, wallet proposals and partial results. |
| `services/api/common-api.ts`, `components/react-query-wrapper/query-keys.ts` | Add typed market services and query keys; use existing auth, abort, error and invalidation conventions. QueryKey is now in its own file. |

**All primary set views are account/profile-wide.** Update the existing Pebbles Trait Sets and Ultimate lists to consume profile-aggregated backend coverage. Use stable profile/collector identity keys for rows and search results, not raw owner addresses. Full route, preview and My set planner must share definition and ownership-snapshot semantics. Address searches resolve to the corresponding account/profile; show wallet custody only as a drilldown.

Apply the same rule to Memes Collected stats: its current `stats/useCollectedStatsData.ts` → `userPageStats.helpers.ts` pipeline can prioritize an active address. Primary set summaries must use canonical profile identity and ignore a custody-only wallet filter. The NFT inventory list can still filter by wallet without changing profile set totals, missing-card goals or rankings. Profile switching changes the target; merely switching signing wallets does not.

## 2. Routes and navigation

Proposed new routes:

- `/collect`: discovery, goal starters, and supported collection availability.
- `/collect/goals`: authenticated private goals and alert settings.
- `/collect/goals/[id]`: private goal definition, plan revisions and outcomes.
- `/collect/orders`: private listings, offers, purchases, cancellations and approvals context.
- `/collect/rules`: later-phase rules with permissions and activity; omit until enabled.

Canonical artwork remains at `/the-memes/[id]`, `/6529-gradient/[id]`, and `/nextgen/token/[id]`. Preserve profile return navigation and existing collection queries. Keep the current Pebbles `/trait-sets` page and `top-trait-sets` preview; add completion actions there rather than create a competing set browser. The existing “Not Seized” value links should remain useful, with an adjacent plan action.

Browse URLs contain public filters only: collection, season, artist ID, public target version, traits, listed status and sort. Budgets, recipient details, signatures and rule settings belong in authenticated state behind opaque IDs. Update strict query normalizers deliberately so new supported filters are retained. Unsupported values show corrected state without fabricating valid filters.

Add Collect through the existing collection navigation patterns rather than introduce a second global navigation shell. Entry points on Collected and TDH carry intent and public identifiers; the destination must re-fetch ownership and never trust quantities or authority passed in a link.

## 3. Visual and interaction contract

Desktop: art grid or missing-value browser with a 360–400px plan panel when space permits. On smaller desktop/tablet widths, the panel opens as a sheet to preserve readable art cards. The panel contains target progress, ownership scope, selected acquisitions, blockers, estimated total and one Review action. It should not become a permanent dashboard of secondary statistics.

Mobile: one or two art columns according to actual available width; selection bar above the safe area; full-height accessible plan/review sheet with a persistent total and action footer. Returning from a wallet application restores the operation and sheet state. Browser Back closes the sheet or restores the previous filter state without discarding a submitted operation.

Art click opens art; a separate labeled button adds to a plan. Do not nest buttons inside card links. Selected, owned, missing and unavailable statuses have text/icons as well as color. A disabled Buy action names the reason; unsupported venues use external links instead of a misleading disabled checkout.

Review is a stable snapshot. Live market changes may mark it stale, but must not move rows, change order, adjust quantities or switch selection while the user is reading. Show a revision comparison before signing changed economic terms. Even a lower price must come through a newly validated payload; exact-token selections never become substitutes implicitly.

Keep detail sheets task-focused: asset identity and image; operation and quantity; wallet/recipient; money breakdown; expiry/quote freshness; approval/signature explanation; confirm. Technical details expand to chain, contract, spender, order hash and decoded assets. Exact amounts remain available even where compact display rounds values.

## 4. Feature boundaries

Suggested modules, created only as needed:

| Module | Responsibility |
|---|---|
| `components/collect/catalog` | Collection-aware art results, public filters and provenance. |
| `components/collect/goals` | Requirement map, progress, missing items, plan alternatives and assumptions. |
| `components/collect/trade` | Buy, offer, list and accept forms; immutable review; shared step display. |
| `components/collect/orders` | Private status, partial fills, cancel/replace and recovery. |
| `components/collect/permissions` | Wallet capability, exact approval scope, later execution authorization. |
| `services/api/market-api.ts` | Standard-wrapper calls using generated models; no provider keys. |
| `hooks/collect` | Query subscriptions and orchestration hooks with abort/disposal, not signing side effects in render. |

Server Components can deliver public catalog/context and metadata. Interactive filters and wallet use stay in narrow client boundaries. Marketplace credentials, raw provider integration and plan policies stay on the backend. Provider SDK documentation currently requires backend usage; do not import it into the client as a wallet convenience. The browser signs only independently validated typed data or transaction envelopes returned by the 6529 API.

New domain types must not inherit floating-point money from `INFT.floor_price` or `NextGenToken.price`. Use `AssetKey`, integer-string quantities, integer-string `Money`, `RequirementSet`, `PlanRevision`, `ExecutionQuote`, `WalletCapability`, `OrderSummary` and `OperationEvent` from the backend OpenAPI source and regenerate frontend models. Convert amounts to bigint for arithmetic; perform locale formatting only at display/input boundaries.

## 5. Client state and data freshness

Keep three separate state layers:

1. Public browse state in URL/search params.
2. Editable local draft, becoming server-persisted private goal/plan on save.
3. Immutable server operation and quote revision after review/signing starts.

Query keys for set coverage include chain, canonical profile/collector ID, confirmed membership version, collection/requirement version and snapshot. Execution keys additionally include actual payer/maker/recipient and currency. Goal/plan revision is part of plan keys. Do not key primary set counts to the connected wallet. Orderbook updates never overwrite an in-review quote. A wallet or chain change invalidates unsigned prepared steps while preserving the same target profile; already submitted operations remain visible under their original wallet.

Proposed starting freshness policy: order display refresh every 10 seconds while visible, with server events where available; foreground refresh on wallet return; quotes expire after at most 20 seconds or provider expiry, whichever is earlier. These are tunable targets, not current service guarantees. After long wallet interactions, revalidate before submission where the wallet exposes that checkpoint; otherwise apply the exact-term protections below. API requests use cancellation signals, bounded retries and deduplication; never poll hidden galleries at checkout frequency.

Quote freshness is an app rule, not automatically an onchain deadline. Some wallets broadcast directly when the user confirms, leaving no frontend recheck between approval and send. Revalidate immediately before opening the wallet, encode exact asset/recipient/economic limits, and distinguish the quote timestamp from the signed order expiry. If a hard execution deadline is promised, the supported contract path must enforce it. An already signed/submitted payload can remain executable beyond an API quote's TTL.

Order lifecycle uses events with a resume cursor plus a polling fallback. Refetch on reconnect to recover gaps. On fill, invalidate relevant orders, token availability and goal coverage; reconcile holdings by chain evidence before displaying acquired. TDH remains the latest actual daily snapshot until a new one is calculated; a scenario preview is not an optimistic replacement for actual TDH.

Persist action IDs before opening a wallet. Reload queries operation status and transaction hashes. If the outcome is unknown, show **Checking transaction** and reconcile by maker/nonce/hash before enabling retry. Do not store raw signatures, provider credentials, typed-data payloads or private automation secrets in local storage.

## 6. Wallet and execution flow

Before every sign/submit step, check active signer capability and chain against the quote; actual maker/payer/recipient; asset quantities; approved protocol/conduit; economic caps; expiry and plan revision. The backend repeats these checks. Profile authentication authorizes access to private drafts; it is never an alternative to the maker's cryptographic authorization.

The step list is produced from supported typed steps, not arbitrary server-supplied wallet RPC methods:

- Switch to supported chain when the user initiates the action.
- Wrap exact ETH to WETH if explicitly needed and chosen.
- Approve an allowlisted spender with disclosed scope.
- Sign a specific order or send a specific fulfillment/cancellation transaction.
- Publish/reconcile the signed order or transaction.

Unknown step types fail closed. The review displays the same asset/currency/recipient terms encoded in the request. A mismatch blocks the operation. Approval may succeed while the later step fails; show that state and link to the remaining approval instead of saying nothing happened.

Safe and other supported smart accounts have a separate state: **Proposal created → Awaiting signatures → Ready to execute → Submitted → Confirmed**. A proposal ID or signature collection is not purchase confirmation. If a wallet/protocol cannot support the requested signature/settlement path, leave browsing available and explain the unsupported action. Requote after a delayed Safe approval; expired trades must not be silently recreated.

## 7. States and copy requirements

| Condition | Required behavior |
|---|---|
| Holdings loading/failed | Unknown ownership; no automatic missing-card purchase plan from zero fallback. Retry without losing filters. |
| No listing | Make offer / Watch goal; unavailable count remains in completion summary. |
| Order changed or sold | Show removed/changed item and revised remainder; require review for a new payload. |
| Insufficient ETH for gas / WETH for offers | Separate required balances and existing commitments; offer exact wrap step only on request. |
| Approval/signature rejected | Editable plan retained; no success or repeated wallet prompt loop. |
| Signed but publication uncertain | Reconcile same order hash; avoid creating a second economically live order. |
| Partial ERC-1155 fill | Filled/remaining units and actual spend; no automatic refill above goal quantity. |
| Partial basket | Per-item receipts, unsatisfied requirements and **Review remaining**. |
| Cancel requested | Explain order may still fill; reservation retained until effective invalidation/expiry. |
| Rule paused | No new platform actions; outstanding orders and pending transactions remain visible. |
| Reorg or receipt unknown | **Reconfirming** state, reverted completion and locked duplicate retries until reconciled. |
| Provider degraded | Show supported-source coverage and stale timestamps; disable new execution dependent on untrusted state. |
| Goal membership changed | New definition revision for review; do not expand a signed target. |
| Profile wallet membership changed | Recompute coverage and invalidate unsigned plan/TDH assumptions; retain and explain already signed orders bound to their original wallets/recipients. |
| Latest TDH differs from projection | Show actual snapshot and original assumptions, never rewrite past proposal output. |

Do not announce per-second market changes to a screen reader. Announce meaningful review invalidation, step transitions and final results. Critical costs, approval scope and cancellation semantics are visible, not tooltip-only. Error messages are actionable and field-associated; support IDs replace raw errors.

## 8. Native-app policy

Current main centrally restricts first-party mint/subscription purchasing on Capacitor iOS when IP-derived country is not US, including unknown country. This is evidence of existing product behavior, not a determination that secondary trading is permitted in any storefront.

Initial rollout recommendation: web first. Gate new secondary-market execution behind an independently configured capability; keep browsing and existing allowed surfaces intact. Before native launch, approve and document the secondary-market rule, then use the existing purchasing visibility/gate conventions to prevent disallowed content and hooks from mounting during SSR, hydration and deep links. Do not silently broaden or narrow the existing mint/subscription rule. Native cancellation/revocation access must have an explicitly supported recovery path even where new order creation is unavailable.

## 9. Accessibility, localization and frontend acceptance

Meet the repo WCAG 2.2 AA and i18n standards. Use semantic links/buttons, labeled inputs, field errors, focus trapping/restoration in sheets and dialogs, sufficient text/nontext contrast, keyboard-complete interactions and touch targets approximately 44px where practical. Verify 320/390/768/1280px layouts, 200% zoom, long names, large monetary values, reduced motion and media failure. No essential information depends on hover, color or drag.

Use message keys for all visible/accessibility copy. Format dates, quantities and prices with repo helpers across en-US/en-GB/fr-FR/es-ES/de-DE. Money inputs must parse the user's displayed locale without ambiguous thousands/decimal interpretation; show normalized exact value before signing. Reject scientific notation, negative amounts, fractional NFT quantities and excess token decimals. Avoid floating-point parse/round-trip for chain values.

Implementation acceptance includes component tests for state transitions and invalidation, contract tests against generated API models, and browser tests for route history, modal focus, wallet-return recovery, hydration and mobile rendering. Test EOA, Safe, auth-only account, consolidated sibling wallet and profile proxy; wrong chain; duplicate click; stale quote; order cancellation/fill race; partially filled ERC-1155 orders; per-item basket failure; reorg; and unavailable holdings.

Add profile-level parity fixtures: the pieces of a complete set distributed across two wallets appear complete in every set surface; duplicate facets across wallets do not inflate unique coverage; Meme editions sum correctly before minimum-per-card set counting; wallet custody filters and signer switches do not change the profile score; membership changes trigger a recompute; all Pebbles preview/full/planner views agree. Public profile lookup requires no wallet login, but a lookup grants no execution authority.

Run the required scoped lint/typecheck/React Doctor checks and meaningful unit/contract tests; run build for new routing/runtime integration. Capture representative desktop/mobile visual evidence and a keyboard/screen-reader pass. A source review or passing DOM assertion alone is not visual approval.

Every implementation PR adding visible routes, controls, terminology or flows must update relevant `ops/docs`, `ops/help/help-index.json` and generated `public/help-index.json` via the existing help sync, including cancellation, partial fills, projected TDH and Pebbles completion definitions. Proposed-only routes in this document must not enter the live help corpus before the feature exists.
