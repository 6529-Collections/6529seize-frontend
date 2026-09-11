# 6529 Collect: trading and collection goals

Status: design baseline for the authorized Collect implementation. The current
user guide is [Collect](../../docs/media/collecting.md); the backend OpenAPI
contract defines the implemented API. Deployment evidence is tracked separately
from this design pack.

The initial implementation uses reviewed EOA execution, direct purchase delivery
to any selected profile or third-party wallet, standard offers received by their
signing wallet, and saved rules that prepare purchases for approval. Listings
include configured creator support, standard offers include required provider
fees, and purchases preserve exact signed fees. The 6529 platform fee is zero.
Safe receiving is supported; contract-wallet execution and unattended spending
mandates remain later capability work. These implementation choices supersede
prospective alternatives elsewhere in this design pack.

Review date: 2026-09-10 UTC. Frontend remote `main`: `5048a8488976f43d97ffc2382e76bb4178c33407`. Backend remote `main`: `337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9`. These are the fetched, immutable review baselines; unmerged work is outside the baseline.

## Recommendation

Build **Collect**, a native collecting experience that combines ordinary buying, offers and listings with plans to complete a season, a set, an artist selection, or a NextGen trait set. Keep the art and the collector's intent at the center. Every plan should answer: what do I already own, what am I missing, what can I obtain now, what will it cost, and what will change?

**Owner requirement: all set collecting is account/profile-first.** Aggregate holdings across the profile's confirmed consolidated wallets for every set count, progress view, goal and ranking, including Pebbles. Correct the existing wallet-based Pebbles set aggregation as part of this feature. Wallet selection is a separate execution/custody concern.

Use established settlement contracts and a replaceable marketplace adapter. The proposed first integration is OpenSea's current backend API/SDK with allowlisted Seaport settlement, subject to a capability proof on the actual collections. Add further venues only after verifying supported execution and distribution. Do not make a discontinued aggregation service, scraped prices, or an unverified private marketplace API a critical dependency.

Ship human-reviewed transactions first. Saved searches, alerts, and deterministic plan generation can be useful immediately. General unattended purchasing requires a separately reviewed, technically enforceable authorization boundary; an LLM and a backend budget field cannot provide one.

## Read the specifications

1. [Product and experience](01-product-and-experience.md): collection semantics, complete journeys, pricing, TDH optimization, and additional ideas.
2. [Frontend specification](02-frontend-spec.md): routes, components, wallet interaction, states, accessibility, API consumption, and acceptance criteria.
3. [Backend specification](03-backend-spec.md): domain model, planner, executable quotes, orders, APIs, indexing, TDH scenarios, and operations.
4. [Safety, automation, and delivery](04-safety-automation-delivery.md): threat boundaries, permission levels, cancellation races, bounded execution, tests, rollout, and decisions.
5. [Evidence and limitations](05-evidence.md): code references at the reviewed SHAs, official protocol sources, and what remains unverified.

## The important design decisions

| Question | Proposed answer |
|---|---|
| What ships first? | Ethereum mainnet, canonical Memes ERC-1155 and Gradients/NextGen ERC-721; fixed-price purchases, exact-token offers, listings, acceptance, cancellation, and private order history. |
| Where does it live? | A Collect destination and contextual entry points on existing token, collection, profile, and TDH pages. Existing art URLs remain canonical. |
| What does cheapest mean? | Lowest supported executable total for the chosen quantity and recipient, with costs and venue coverage disclosed. |
| What is a complete Meme set? | Required quantities across a versioned set of canonical IDs; distinguish released-to-date collecting from TDH-eligible snapshot membership. |
| What is an artist set? | An explicit, versioned selection of verified works; per-project representation is future scope if further generative projects exist. |
| What is the primary ownership scope? | The account/profile across confirmed consolidated wallets, for every collection and set type. A wallet filter does not redefine the profile's set score. |
| What does lowest-cost TDH mean? | Cost divided by additional projected portfolio TDH at a chosen future snapshot, compared with doing nothing under the same assumptions. |
| What authority does a consolidated profile provide? | Ownership context for planning. It does not authorize another wallet to spend, list, accept offers, or sign. |
| Can a basket fail partly? | Yes, unless an explicitly supported atomic execution path enforces the entire basket. State the mode before signing. |
| Can pause stop existing offers? | It stops new platform actions; signed orders can remain fillable until expiry or effective cancellation. |
| Who controls spending? | Initially the user signs each transaction/order. Later automation uses audited onchain restrictions with explicit budgets and revocation. |

## Initial success measures

Measure collection-goal completion and successful, understood execution: time from intent to valid plan; executable coverage of missing items; quote-to-confirmed-fill rate; correctly recovered partial results; duplicate acquisitions attributable to the platform; overspend attributable to the platform; unexplained signature rejection; cancellation time; accessibility failures; and creator fees displayed versus settled. Establish baselines before setting conversion targets. Zero unauthorized assets, recipients, or spending is a release invariant, not an optimization metric.

The inline concept accompanying this proposal uses illustrative holdings and prices. It demonstrates the plan/review interaction, not live availability or a deployed feature.
