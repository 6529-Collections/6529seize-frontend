# Product and experience specification

## 1. Product thesis

The differentiator is knowledge of 6529 collecting: editions, seasons, artist relationships, trait sets, consolidation, and TDH. Ordinary execution is the foundation. A collector should be able to say “finish this season” and receive a transparent, editable acquisition plan without reconstructing their holdings across several marketplaces.

Use **Collect** as the destination label. Its primary views are **Explore**, **My collection**, **Goals**, and **Orders**. Exploration works while disconnected. A public profile can be used to preview a plan; authentication is required to save private goals or orders, and asset-control authorization is separately required to trade.

The visual direction follows existing collection cards and dark `iron-*` surfaces: real artwork, compact readable metadata, restrained borders, and blue primary actions. Preserve artwork proportions. Avoid treating floor price as the artwork's headline. The title and artist remain primary; availability, ownership and price support the decision. Advanced trading details belong behind a clear expansion, not between the art and the first useful action.

## 2. Collection semantics

All identifiers use `(chainId, contract, tokenId)`, never a name or token number alone. The initial universe is the canonical Ethereum mainnet Memes, Gradients and NextGen contracts. Meme Lab, Rememes, third-party collections, primary minting, swaps, lending and other chains are later scope; names containing “6529” do not qualify a contract.

**Current NextGen product scope is Pebbles, the sole project confirmed by the owner in this review.** Its existing Trait Sets and Ultimate views are the starting point. Configuration for other collection IDs is not evidence of another live project. Any cross-project collecting idea below is future scope.

**All set collecting is primarily per account/profile, across its confirmed consolidated wallets.** This applies to Memes seasons/full sets, artist selections, Gradients selections, Pebbles facets and Ultimate. Counts, missing requirements, rankings, goals and completion celebrations use that same scope. A wallet breakdown shows custody; changing the connected signing wallet or a custody filter does not change the profile's collection score. Multiple logged-in accounts are not combined merely because one browser can access them.

| Family | Ownable unit | Useful completion targets | Meaning that must not be implied |
|---|---|---|---|
| The Memes | Integer copies of an ERC-1155 card ID | One or N copies of every required ID in a season, released-to-date set, artist selection, Genesis/Nakamoto selection | A spare copy of one card cannot substitute for a missing card. An ERC-1155 copy has no individually tradeable serial number. |
| Gradients | A unique ERC-721 token | Specific ID, any eligible Gradient, a curated selection, a chosen count of distinct Gradients | Buying one Gradient is not completing the entire collection. Five is a current TDH boost threshold, not a collecting requirement. |
| NextGen / Pebbles | A unique ERC-721 output, linked to Pebbles and its traits | Specific Pebble, exact trait intersection, existing Palette/Size/Traced sets and Ultimate set | Buying every unique Pebble is not the default meaning of a complete set. Trait completion has no assumed TDH bonus. |

**Version every target.** A goal includes a definition version, exact required IDs or canonical requirement graph, quantity policy, ownership scope, and snapshot. Two distinct Memes targets must remain visible: “All released cards as of [time]” and “Full collection eligible for TDH snapshot [block/date].” Mint eligibility timing means these can differ. A current season can be complete to date while still open. The planner must not silently expand a signed target when a new card appears.

For full set N, each required Meme ID needs N copies. If a collector has two of every card except one, “Complete your second set” buys the missing quantity; it does not use a binary owned/not-owned model. A sealed historic season has a stable target; current-season targets explicitly show whether future releases are excluded or monitored.

**Artist coverage:** a canonical artist ID can relate to several profiles, aliases, collaboration credits and projects. Initially let the collector choose “Meme cards by this artist” and “Include collaborations”. Preview every included work before creating an artist goal. Freeze the membership. “One work from each selected project” is a future option if multiple projects exist. Never derive automatic spending authority from a substring search, mutable display name, or a free-form metadata field. Artist-set curation is collecting functionality; there is no assumed artist TDH boost.

## 3. Core journeys

### 3.1 Find the cheapest

Entry: collection toolbar **Buy lowest**, or Collect → Explore → **Lowest total cost**.

The user selects the family or verified collection, quantity, and optional “Only cards I need”. Default quantity is one. Results expose artwork/title, exact identity, owned quantity in the selected scope, unit price, available quantity, venue, and freshness. Sorting uses a recipient-aware executable estimate where available. Before wallet selection, label it “Estimated total”; approval and wallet-specific gas may change the ordering.

Always distinguish “lowest unit price” from “lowest total cost”. A single seller with several copies can beat individually cheaper copies after execution costs. A low-price listing may be partially filled or unavailable. Missing prices are unavailable, never zero. Exclude sellers in the target ownership group and already-satisfied quantities from acquisition recommendations by default. An owned card ID can still need another copy for a second-set goal.

Do not claim a global market minimum. Use “Lowest available across [supported sources]”, with a freshness time and coverage expansion. Unsupported external prices may remain available as separately labeled links; they must not enter an executable basket.

### 3.2 Find something specific

Provide typed search for title, canonical artist, card ID, season and collection. NextGen adds its existing collection-specific trait filters with AND across trait types and explicit OR selections within one trait type. Persist browse filters in the URL. A plain-language field may translate “a blue Pebble I don't own under my budget” into these visible structured filters, but cannot silently invent a trait value or submit a transaction.

Results distinguish **Buy now**, **Make offer**, **Listed above your limit**, and **No supported listing**. Save unavailable targets to a goal. For an ERC-1155 token page, show listings as seller/quantity/price rows for the same artwork; do not render indistinguishable copies as separate collectibles.

### 3.3 Complete a season or full set

Entry: Collected season tile **Complete**, collection page **Build a set**, or Goals → **Complete a season**.

1. Choose a public or own profile for the ownership calculation. Show the included wallet count and an expandable address list. Choose the receive wallet separately.
2. Show a season mosaic with explicit owned, missing, selected, unavailable and pending states. The primary summary is “You own 34 of 40 required cards”, with target version/date. These example numbers are illustrative.
3. Calculate a plan containing missing quantities, immediately purchasable items, unlisted requirements, total cost bounds, number of transactions, and projected completion.
4. Let the user exclude an item, change a price ceiling, protect existing offers, and select a budget. Do not replace an exact card with a cheap different card to fit the budget.
5. Offer **Buy available**, **Review offers for the rest**, or **Watch this goal**. An unavailable requirement remains a visible blocker. The interface must never label a partial acquisition “complete season”.
6. Review the exact basket and execution mode. If the user requires all items together and no supported atomic route can enforce that, explain the constraint and require a deliberate change to partial mode.
7. After execution, show each confirmed acquisition and the remaining requirements. Reconcile the goal against chain ownership; show an intermediate “Purchase confirmed; holdings updating” state while the index catches up.

For large full sets, group by season and highlight blockers. Offer “Most progress within budget” separately from “Finish this target”. Preserve protected requirements and explain the selected objective. An open offer is not ownership or a completed requirement; show **Offer active** alongside the still-missing card.

### 3.4 Complete an artist or NextGen trait set

Start from the artist context or the existing Pebbles Trait Sets page and show the definition, not just a completion percentage. The user approves included collaborations and collection families. For Pebbles, reuse the exact existing set rules. Cross-project representation is future scope. “All unique outputs” is an explicit advanced custom target, with the full denominator and availability, never the default.

For Pebbles, reuse `/nextgen/collection/pebbles/trait-sets` and the `top-trait-sets` collection preview. The existing facets are Palette, Size and Traced, with values fetched from collection metadata. A facet set contains every distinct value of that facet. Ultimate covers all values across all three facets; it is not every combination or every Pebble.

The existing Pebbles set rankings currently count each owner wallet separately. That is a gap to correct in this feature: aggregate by canonical account/profile first, then calculate trait and Ultimate coverage, with one row per collector. The full Trait Sets route, collection preview and new planner must share the same profile-level result. Choose a receiving wallet within that profile at checkout; there is no need to consolidate assets physically into one wallet to complete a set.

One Pebble can supply a missing Palette value, Size value and Traced value at once. The plan must account for that overlap. Offer **Lowest total cost** and **Choose the art myself** using the same unmet-requirement display. A collector may lock a favorite piece and let the planner finish around it. Show why each candidate contributes, such as “Adds a missing palette and size”, only when the canonical trait graph supports that statement.

### 3.5 Make and manage offers

Use **Make offer** as the UI term; explain once that this is a bid a seller may accept before expiry. It is not an auction bid unless the specific primary auction flow says so.

Initial offer types: exact token ID, explicit quantity, fixed WETH amount per copy, and expiry. Suggested expiry is 24 hours, configurable; persist the actual expiry in UTC and display local time. Show the amount reserved by 6529 for known active offers, label it “not escrowed”, and show aggregate possible spend if all fill. External orders may be unknown; never imply wallet-global protection from these reservations. Display recipient, creator fees and maximum total commitment. Explain any ETH→WETH wrap as a separate wallet action.

Token detail shows relevant incoming offers with quantity, expiry and seller net proceeds. Accepting an offer gets the same review, simulation and chain validation as buying a listing. Before selling a final copy, show which goals/sets break and the projected TDH impact. The warning applies to accepting bids as well as listings.

Collection and trait offers are a later capability. A broad offer means “any token satisfying this signed criterion”; it does not mean “one different token per missing card”. Do not implement a distinct-card completion goal with several overlapping broad bids and promise no duplicates.

Orders shows active, partially filled, pending, completed, expired, underfunded and cancellation states. Users can inspect exact terms and transaction evidence. Repricing creates new signed terms; expose the period during which the original is still executable unless effective cancellation is confirmed first.

### 3.6 List and sell

Entry: owned token **List**, Collected **Manage listings**, or Orders. Pick the actual asset-holding wallet and eligible quantity. Multiple owners mean separate wallet batches. An active social profile, proxy identity, or consolidated balance cannot authorize selling another wallet's assets.

The form displays unit price, quantity, gross amount, creator/venue/platform fees, expected net proceeds, expiry and destination currency. Suggest context from executable competing listings, with no automatic undercutting by default. Require an explicit acknowledgment for an unusually low price relative to reliable recent market data; thresholds are configurable guardrails and never imply appraised value.

Before signature, show “This may sell whenever a buyer fills it before [time]”. NFT approval and order signature are distinct steps. “Gasless signature” must not imply a harmless or reversible message. A **Keep one copy of every card** option constrains listings proposed by 6529, but cannot prevent the user moving or listing assets elsewhere; only an enforced execution policy can guarantee it.

Bulk listing is phase 2: per-item overrides, a net-proceeds summary, quantity reservations, explicit overlapping-listing warnings, and a check for collection/TDH effects across the entire proposed sale set. Never apply a single global price without previewing every affected token.

## 4. Lowest-cost TDH

The initial simple tool is **TDH per day for your budget** using canonical base rates, then a richer **Improve my projected TDH** planner. Neither treats TDH as cash income or forecasts resale profits.

Offer horizon presets at the next eligible daily snapshot, 30, 90 and 365 days. Default to 30 days. Compare the current portfolio held unchanged with the portfolio plus the proposed acquisitions at the same future snapshot:

`additionalTDH(H) = TDH(portfolio + acquisitions, snapshot H, assumptions) - TDH(portfolio, snapshot H, assumptions)`

`costPerAdditionalTDH(H) = maximum acquisition cost / additionalTDH(H)`

Only rank positive denominators. Show the time horizon beside the ratio, not in a tooltip. A token's seller TDH and current aggregate token TDH are not what the buyer acquires. External purchases start new holding age. Completing a qualifying season/set or adding an eligible Gradient can increase the multiplier applied to the purchaser's already accumulated holdings; that can dominate a simple rate/price ranking.

Separate the result into new-holdings base TDH, changed boost on existing holdings, and total projected difference. Reuse the backend's exact rounding, copy-lot, eligibility, consolidation and boost calculations. Include Memes, Gradients and NextGen contributions; do not invent NextGen trait-set or artist bonuses.

Projection assumptions: estimated acquisition block/time; current confirmed consolidation group; no other transfers; current rule version, supply/rates and eligible universe frozen unless a separately modeled scenario says otherwise. New cards, supply changes and rule changes can alter future completeness and rates. Display “Scenario under current rules” and an expandable assumption list. Show the latest real snapshot separately from projected values.

Compare useful alternatives: cheapest missing season, next full set, first through fifth distinct Gradient as relevant, and individual high-rate cards. Evaluate groups as groups: greedy token ranking can miss the value of the final required card. If optimization is bounded or incomplete, say **Best plan found** and provide method/coverage rather than “optimal”. The initial feature offers plans for user review; autonomous TDH maximization is out of first-release scope.

## 5. Rules and other ideas

| Idea | User benefit | Proposed stage |
|---|---|---|
| Keep my current season complete | Identify each newly released missing card, then alert or prepare a bounded proposal | Early alerts; execution later |
| Find one spare to sell | Offer duplicates while protecting the user's chosen collection target and showing TDH effects | Phase 2, manual review |
| Gas-aware accumulation | Combine selected purchases where the supported path lowers total cost | Phase 2 |
| NextGen trait completion | Fill gaps using outputs that cover multiple desired traits | Phase 2 |
| Artist/project watchlists | Follow verified new work and price availability | Early, opt-in |
| Goal-aware market depth | Show how many missing requirements are actually buyable under a budget | Early read-only; executable depth only from live orders |
| Collector-curated sets | Share versioned selections others can copy into their own private plan | Phase 2; explicit share action |
| Gift a selected set | Purchase to an explicit verified recipient with address review | Later; no implicit profile-name resolution |
| Private strategy comparison | Buy available now versus exact-item offers versus wait | Phase 2; no invented fill probabilities |
| Preserve collection floor | Highlight a listing or sale that would remove the last necessary copy | Initial warning; enforced policy later |

Saved goals are private by default. Public share links contain the selection definition only unless the user explicitly includes ownership or budget. Intentionally published listings and offers reveal their signed terms and maker; settled trades are public onchain. Hidden strategy limits, unsubmitted bid ceilings, automation limits and private wallet groupings must not leak through analytics, public URLs, social notifications or help-bot answers.

## 6. Experience acceptance criteria

- A disconnected person can search, inspect art, view supported market availability and preview a goal without being pushed through wallet login.
- Every set view uses the same account/profile-wide holdings; changing a custody filter or signer never resets that progress. A collector sees the target profile separately from spending and receiving wallets before authorizing an action.
- “Complete” requires actual quantities across the declared target. Pending purchases, active bids and unlisted cards are represented honestly.
- Every buy, offer, listing and acceptance discloses quantity, currency, maximum spend or minimum net proceeds, expiration where applicable, and asset/recipient identity.
- Cheapest rankings distinguish unit price, estimated total and currently executable total; missing data never becomes free inventory.
- A stale item yields a visible revision with the previous and current terms. No silent increase, substitution or extra quantity is signed.
- A partial result remains recoverable after navigation or refresh. Retry only considers unresolved items.
- TDH comparison uses a stated snapshot and horizon, shows assumptions, and exactly reconciles with backend scenario output.
- Keyboard, touch, screen-reader, localization and reduced-motion behavior meet the frontend specification.
