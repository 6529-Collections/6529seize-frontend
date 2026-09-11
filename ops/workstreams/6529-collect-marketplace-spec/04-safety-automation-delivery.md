# Safety, automation and delivery specification

## 1. Trust boundaries and release invariants

This is prospective system design, not a vulnerability report or a completed security audit. The authorization boundary is the user's actual asset-controlling wallet and the exact order/transaction it signs. Profile identity, social proxy access, consolidation, TDH, subscription balance and a backend API session do not provide trading authority.

| Boundary / failure | Required control |
|---|---|
| Counterfeit or wrong asset | Chain + allowlisted contract + exact token ID + standard + explicit quantity; NextGen true ID distinct from normalized display number. |
| Provider returns malicious or malformed payload | Closed action schema, independent decoding, verified protocol/conduit/zone registry, asset/fee/recipient comparison and fail-closed simulation. |
| NFT metadata or seller text instructs an agent | Treat as untrusted content; it cannot alter policy, issue wallet calls or override exact selected IDs. |
| Login confused with order authorization | Separate signature kind, domain, expiry and plain-language review. No opaque `eth_sign` fallback. |
| Consolidation/proxy confused with custody | Verify raw onchain ownership and live signer; authorize private goal access separately. |
| ERC-1155 quantity omitted or rounded | Required positive integer; default UI one; validate provider request, signed fields, fill fraction, fees and receipt quantities. |
| Price/royalty or currency confusion | Chain-bound currency identity, integer math, explicit fee recipients and buyer total/seller net. No ticker-only or floating-point settlement math. |
| Stale order, partial fill or cancel race | Fresh order reads and simulation plus immutable economic limits; actual receipt reconciliation and recoverable partial results. |
| Quote TTL mistaken for trade expiry | Distinct UI terms; app freshness check before wallet prompt; hard deadlines only where enforced by the onchain path. |
| Broad approvals | Least privilege supported by the token/protocol; known spender registry; clear actual approval scope and revocation consequences. |
| Several orders spend the same balance | Worst-case known exposure reservations; disclose external uncertainty; enforce any promised aggregate limit at settlement time. |
| Unknown broadcast retried | Persistent economic intent/idempotency; reconcile wallet/nonce/hash before another send. |
| Provider/worker outage | Pause new unsafe execution while preserving order inspection and verified cancellation/revocation paths. |
| Reorg / missed event | Canonical block journal, replay and reservation/progress correction; stream events are advisory. |

The application must never silently change the selected NFT, quantity, recipient, currency, fee policy or spending ceiling. An exact-item request must not use a collection sweep that substitutes the next cheapest token when a listing disappears. A successful available-orders transaction is not proof all items filled. No signing keys, session secrets or wallet seeds enter the normal web/backend workflow.

## 2. Approvals, signatures and wallet support

ERC-721 can support token-specific approval, depending on the tested execution route. ERC-1155 standard approval is collection-wide; do not label it “approve this one card”. The reviewed screen names the actual spender/conduit and scope. A shared conduit may serve other marketplace channels, so “approval to 6529” can be misleading.

For WETH, default to a bounded allowance covering known intended exposure with explicit top-up. Unlimited allowance is not the default. A smaller approval can make other offers unfillable; that consequence belongs in review. Revoking approval or reducing the wallet balance may temporarily invalidate a standing order; later reapproval or replenishment can revive it unless the order was permanently cancelled or expired.

Trade signatures are economic authorizations even without immediate gas. Verify EIP-712 domain, chain, verifying contract/version, maker, signed items, recipients, price/fees, expiry, salt/counter and criteria semantics. Replay protection must come from the actual protocol/order state as well as API idempotency. Do not assume a social signed nonce invalidates an exchange order.

Support Safe deliberately. ERC-1271 defines contract signature validation, but does not certify every Safe/version/provider flow. Prove listing creation, message aggregation, venue publication, fill, cancellation, changed threshold and receiving ERC-1155 NFTs. Recheck current signature validity; a queued Safe proposal is not an executed trade. Do not weaken a Safe's signers, threshold, modules or guards to make checkout work.

## 3. Fees and creator support

Recommended 6529 policy: creator support is included consistently in suggested acquisitions, offers and listings, with explicit breakdown and provenance. Collection fee configuration and signed consideration are authoritative; do not hardcode a remembered marketplace percentage. ERC-2981 information alone does not force payment.

The owner must approve the initial platform fee and creator-fee policy before implementation freezes it. Proposed v1 platform fee is zero until a deliberate commercial decision, while still disclosing external venue/creator costs. If optional creator-fee changes are allowed, they must require a visible user choice and replan/requote; otherwise enforce the canonical policy and label unsupported orders accordingly.

Test current API defaults explicitly: listing and offer creator-fee behavior differs, and offer expiry defaults may be longer than the proposed UI. Send every relevant field rather than inherit defaults. Evaluate candidate orders under the same fee policy so “cheapest” does not silently prefer lower creator payment.

## 4. Four automation levels

| Level | What the user can do | Authority and initial availability |
|---|---|---|
| 0 — Watch and plan | Save a target, receive alerts, compare plans and TDH scenarios | Read-only/notification access. Early release. |
| 1 — Prepare for approval | Agent or rule finds candidates and prepares exact actions | User reviews/signs each order or transaction. Initial trading release. |
| 2 — Signed limit orders | Place exact-token, fixed-quantity offers/listings valid until a stated expiry | Each signature authorizes third-party fills while the user is offline. Initial exact-order functionality, with exposure/cancel management. |
| 3 — Bounded execution | Repeated purchase execution within an explicit mandate | Separately audited, enforceable smart-account/contract policy; later project. |

Level 2 is already a form of unattended execution: the seller may accept an offer later. It must not be described as harmless monitoring. Level 3 cannot be obtained merely by letting an agent call the same API with a session token.

A rule has a human-readable preview and a deterministic schema: chain, payer, fixed recipient, catalog/goal hash, allowed exact assets or enforced criteria, target quantity and monotonic acquired count, currency, unit and total trade caps, per-period and lifetime budget, open-offer liability cap, creator-fee policy, approved protocol/spender, expiry, maximum attempts/gas settings, price freshness, protected holdings, partial-fill policy, and pause/revoke conditions. New economic terms create a new policy revision and authorization.

Example at level 1: “For these missing Season 4 cards, find exact-token purchases up to 0.08 ETH per card and 0.50 ETH in total including the configured gas reserve, receive in this wallet, and ask me to approve each plan until Friday.” Values are examples. The agent translates prose into visible fields; it cannot reinterpret “missing” to broaden a frozen target or silently use a different wallet.

## 5. Enforcing future autonomous purchases

A destination allowlist permitting arbitrary Seaport calls is insufficient. A restricted purchase method must validate the whole economic action: permitted exact assets, actual recipient, received quantities, total debits and fee destinations, per-token and lifetime limits, deadline, authorization nonce, replay prevention and reentrancy-safe accounting. It must not permit arbitrary delegatecall, wallet upgrades, new modules, owner changes, unrelated transfers, blanket approvals or signing arbitrary messages.

Recommended initial bounded-execution design direction: a dedicated, capped smart account with an independently reviewed purchase policy, receiving assets into that account initially. A configurable receiver or custody-wallet delivery requires additional receipt-verification design and tests. Smart-account compatibility and account funding/recovery are product work, not hidden setup. Keep the main custody wallet outside that new authority boundary.

Maintain monotonic counts of acquisitions made under the mandate. Selling/transferring an acquired NFT out must not automatically restart a completed goal. Snapshot-based ownership checks are useful but do not guarantee uniqueness across other independently changing wallets. Hard guarantees must state their exact scope: acquired through this mandate, in the enforced account, under the frozen target.

Independent resting offers are a separate problem. A third party can fulfill a signed order without calling the guarded purchase executor. ERC-1271 validation is read-only and cannot atomically decrement a shared budget. Several simultaneously fillable bids cannot promise “buy only one” or “stop when complete” by cancelling siblings after the first fill; another fill can win that race.

Options for later resting-order automation are conservative sum-of-liabilities authorization, serialized exact-order management with confirmed invalidation before replacement, or audited stateful settlement restrictions such as an accepted restricted zone/contract-offerer design. Isolated finite funding can bound financial loss, but does not by itself enforce unique-card goals or correct recipients. Vendor acceptance, upgrade controls, contract audits and adversarial tests are required before promising stronger semantics.

Do not promise a total gas-inclusive onchain budget if the account/relayer policy only controls NFT trade debits. Sponsored or account-paid gas needs enforceable limits in its own mechanism. User-sent external gas cannot be bounded by an NFT execution contract. The UI must distinguish intended platform spend/attempt limits from a hard onchain asset cap.

## 6. Pause, cancel and revoke

Use distinct actions and states:

- **Pause rule:** stops new platform preparation/execution; does not reverse pending transactions or invalidate signed offers.
- **Cancel orders:** obtains the applicable effective order invalidation; may cost gas and may lose a race to a fill.
- **Revoke execution permission:** removes future mandate/session capability where enforced; separately address already signed orders.
- **Revoke token approval:** removes spender capability for that asset/currency; may affect other sites and can be reversible if reapproved.

OpenSea offchain cancellation applies to particular protected orders and may not prevent a fill for which fulfillment authorization was already issued. A successful API response therefore remains **Cancellation requested** until the relevant effective invalidation is known. Preserve exposure through the race. For Seaport counter-wide cancellation, show that orders created elsewhere under the same offerer/protocol can also be invalidated.

Emergency mode must retain a supported inspection and recovery path. If the provider cannot serve cancellation, offer a verified direct onchain route where supported or show the remaining expiry/authority facts; never claim a pause made funds safe. Notification follows a meaningful change or required action, not periodic unchanged-status spam.

## 7. Capability proof before implementation commitment

Prove these using official supported APIs and controlled fixtures/forks/testnets. Real-value mainnet tests require separate explicit authorization; this specification does not authorize them.

1. Backend obtains unsigned listing and offer action payloads; user wallet signs locally; backend verifies/posts successfully. No API key enters a client bundle and no backend user signer is introduced.
2. Exact Memes one-unit purchase from a larger ERC-1155 listing, listing creation, quantity-specific offer posting, accepting a partial offer and cancellation; verify fee divisibility, reduced remaining quantity and required-quantity validation on both sides.
3. Gradient and Pebbles ERC-721 buy, offer, list, accept and cancellation on the actual verified protocol version.
4. Exact-item basket semantics with no substitution. Demonstrate actual partial-fill reporting. If atomic mode is offered, prove every required receipt or full revert.
5. Safe end-to-end flows for the intended wallet versions and venue posting, including delayed and invalidated signatures.
6. Explicit expiry, creator fees, fee recipients and currencies, including a provider schema/default change test.
7. Orderbook access, listing/offer distribution rights, supported contracts/zones, API/stream rate limits, incident contact and commercial terms. Native 6529 order publication does not imply global venue distribution.

Current provider direction: OpenSea first; Reservoir NFT/API services were sunset and are unsuitable as a fresh dependency; Blur native execution is gated on authorized API access and verified coverage. Existing Blur statistics in the repo do not satisfy that gate. See [evidence and official references](05-evidence.md).

## 8. Implementation phases and exit criteria

| Phase | Deliverable | Exit criterion |
|---|---|---|
| 0 — Foundation and proof | Provider spike; canonical/versioned catalog; account/profile aggregation for every set view including existing Pebbles rankings; artist curation plan; exact TDH fixture set; operation schema | Capability matrix documented; uncertain support visibly disabled; no user funds involved. |
| 1 — Native manual trading | Executable availability, one-item buy/list/offer/accept/cancel, private Orders, all three canonical families, web first | Exact quantity/recipient/cost evidence, recovery and wallet test matrix pass; source degradation cannot produce unsafe execution. |
| 2 — Collector goals | Season and full-set deficits, Pebbles existing-set CTAs, exact baskets, bounded solver, artist selections once verified, TDH scenarios, last-copy warnings | Reference profile holdings match; Pebbles preview/full/planner share profile-wide coverage; no substituted or double-allocated items; partial outcomes truthful. |
| 3 — Rules without new custody | Private watchlists, alerts, saved constraints, agent proposal API, user-approved limit orders | Deterministic policy preview, privacy and exposure tests; no new signing authority. |
| 4 — Restricted autonomy | Audited smart-account purchase capability; narrow opt-in limits and recovery | Independent design/contract review, adversarial invariant tests, limited controlled rollout. Resting-offer enforcement separately approved. |

Work can overlap: read-only goal analysis and UI prototype need not wait for manual execution launch, but a goal must not display a Buy action before the relevant quote/settlement path passes its gate. Prioritize Memes and Pebbles completion intelligence over speculative cross-project abstraction.

Recommended work packages: BE catalog/holdings contracts; BE order adapter/indexing; BE quote/operation journal; FE shared trade sheet/Orders; goal planner and Pebbles integration; TDH projection parity; notification/rule drafting. Each package owns matching tests and OpenAPI changes. Deploy additive backend schema/workers/API before dependent frontend. Official TDH-kernel extraction requires shadow equivalence and its own deploy scope. No release action is part of this review.

## 9. Validation plan

**Domain/solver:** edition quantities; second/third Meme set indexing; zero-day eligibility; current season boundary; S1 partial bonuses; fifth/sixth Gradient; NextGen TDH contribution; LIFO sale/internal transfer; per-token rounding; artist collaboration exclusions; profile-wide completion with complementary holdings in several wallets; no duplicate join inflation; custody filters/signers do not change set counts; membership-change invalidation; Ultimate multi-facet overlap; unavailable facet; duplicate provider order; shared ERC-1155 inventory; bounded-solver truthful status.

**Protocol/property tests:** money and quantity conservation; maximum authorized debits; no extra recipients/assets; missing quantity rejected; fee divisibility; replay; wrong chain/domain; unknown zone/conduit; malformed calldata; lost approvals; insufficient WETH; signature changed after quote; stale signed publication; late wallet confirmation; partial batch versus atomic mode; accidental sweep substitution.

**Concurrency/recovery:** two tabs; two rules; simultaneous offers; buy while own offer is live; fill/cancel race; publish timeout; unknown broadcast; same nonce replacement; worker crash after send; duplicate logs; lost stream events; provider/API disagreement; block reorg; delayed Safe execution; refund and gas-budget accounting. Assert one economic intent across retries and no false completion.

**Experience:** desktop/mobile art and review screenshots, keyboard and screen-reader pass, localized money parsing, 200% zoom, safe-area footer, rejected wallet prompt, app-return recovery, private-state authorization, disabled capabilities, and native-app gating once applicable. Use unit/contract/fork tests for exhaustive financial invariants and browser tests for browser-specific risks.

Release observability must expose actual success/partial/failure, quote age, reconciliation lag, reservation drift and unexplained transfer alarms. A kill switch is tested, not merely configured. Roll back execution by disabling new actions while preserving journals/recovery; do not roll back history tables containing live liabilities.

## 10. Decisions for the owner

The proposal can proceed using the recommended defaults, but these choices must be settled before the relevant launch: platform fee; mandatory versus optional creator support; approved marketplace coverage; initial supported wallet versions; native-app secondary-market policy; whether first baskets allow partial acquisitions; artist/collaboration curation ownership; default offer expiry; and whether later restricted automation warrants new audited contracts.

Recommended defaults are zero initial platform fee, creator support included, web-first, exact-token fixed-price orders, 24-hour offer expiry, explicit partial-basket review, private goals, and assisted execution before any new custody/automation authority. Account/profile-wide set collecting is an owner requirement for every set surface, including the existing Pebbles pages; wallet controls are for custody and execution.
