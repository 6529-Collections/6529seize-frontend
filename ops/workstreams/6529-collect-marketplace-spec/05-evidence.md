# Evidence, references and limitations

## 1. Review baseline

The frontend and backend were fetched from their remote `main` branches into isolated, detached review checkouts. Existing development changes were preserved. The frontend baseline is [5048a8488976f43d97ffc2382e76bb4178c33407](https://github.com/6529-Collections/6529seize-frontend/commit/5048a8488976f43d97ffc2382e76bb4178c33407); the backend baseline is [337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9](https://github.com/6529-Collections/6529seize-backend/commit/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9). Review date: 2026-09-10 UTC.

Both remote heads advanced during the review. The closing pass inspected the intervening frontend CMS gallery authentication change and backend CMS ENS-address normalization change, then advanced the review checkouts and pinned links to these latest heads. Neither delta changes the collection/set/TDH/trading seams cited below.

Evidence is scoped source inspection, with independent frontend, backend/domain and protocol reviews. The owner's clarification establishes Pebbles as the only current NextGen project for this proposal. The existence of generalized multi-collection code or a second configured trait list does not establish another live project.

The owner also explicitly requires all set collecting to be account/profile-first. Accordingly, existing raw-wallet Pebbles aggregation is recorded below as current behavior to change, not a desired default. Proposed set counts, rankings and planners all aggregate the profile's confirmed consolidated holdings; per-wallet custody and signing remain separate.

## 2. Frontend evidence

| Verified observation | Source at reviewed frontend SHA |
|---|---|
| Memes browse already supports season queries and market-stat sorts | [TheMemes.tsx, sort map](https://github.com/6529-Collections/6529seize-frontend/blob/5048a8488976f43d97ffc2382e76bb4178c33407/components/the-memes/TheMemes.tsx#L51), [season loading](https://github.com/6529-Collections/6529seize-frontend/blob/5048a8488976f43d97ffc2382e76bb4178c33407/components/the-memes/TheMemes.tsx#L221) |
| Memes detail shows floor, TDH rate and highest-offer statistics | [MemePageLiveStats.tsx](https://github.com/6529-Collections/6529seize-frontend/blob/5048a8488976f43d97ffc2382e76bb4178c33407/components/the-memes/MemePageLiveStats.tsx#L639) |
| Marketplace component currently opens external venues | [NFTMarketplaceLinks.tsx](https://github.com/6529-Collections/6529seize-frontend/blob/5048a8488976f43d97ffc2382e76bb4178c33407/components/nft-marketplace-links/NFTMarketplaceLinks.tsx#L20) |
| Existing price/offer fields are numerical statistics, not signed orders | [INFT.ts](https://github.com/6529-Collections/6529seize-frontend/blob/5048a8488976f43d97ffc2382e76bb4178c33407/entities/INFT.ts#L43), [INextgen.ts](https://github.com/6529-Collections/6529seize-frontend/blob/5048a8488976f43d97ffc2382e76bb4178c33407/entities/INextgen.ts#L81) |
| Profile Collected separates consolidated browsing and actual-wallet transfer holdings | [UserPageCollected.tsx](https://github.com/6529-Collections/6529seize-frontend/blob/5048a8488976f43d97ffc2382e76bb4178c33407/components/user/collected/UserPageCollected.tsx#L479) |
| Season summary distinguishes full sets and progress toward the next set | [Collected stats helpers](https://github.com/6529-Collections/6529seize-frontend/blob/5048a8488976f43d97ffc2382e76bb4178c33407/components/user/collected/stats/helpers.ts#L80), [next-set progress](https://github.com/6529-Collections/6529seize-frontend/blob/5048a8488976f43d97ffc2382e76bb4178c33407/components/user/collected/stats/helpers.ts#L160) |
| Pebbles facets are Palette, Size and Traced, with canonical values loaded from the API | [NextGenTraitSets.tsx](https://github.com/6529-Collections/6529seize-frontend/blob/5048a8488976f43d97ffc2382e76bb4178c33407/components/nextGen/collections/collectionParts/NextGenTraitSets.tsx#L36) |
| Existing Ultimate requests all selected dimensions; missing-value links open the art browser | [Ultimate API selection](https://github.com/6529-Collections/6529seize-frontend/blob/5048a8488976f43d97ffc2382e76bb4178c33407/components/nextGen/collections/collectionParts/NextGenTraitSets.tsx#L88), [missing values](https://github.com/6529-Collections/6529seize-frontend/blob/5048a8488976f43d97ffc2382e76bb4178c33407/components/nextGen/collections/collectionParts/NextGenTraitSets.tsx#L427) |
| Actual signer capability and Safe flag are distinct from account presence/authentication | [seizeConnectTypes.ts](https://github.com/6529-Collections/6529seize-frontend/blob/5048a8488976f43d97ffc2382e76bb4178c33407/components/auth/seizeConnectTypes.ts#L64) |
| Existing transaction UI simulates transfers and waits for receipts | [TransferModal.tsx](https://github.com/6529-Collections/6529seize-frontend/blob/5048a8488976f43d97ffc2382e76bb4178c33407/components/nft-transfer/TransferModal.tsx#L408) |
| QueryKey is in a separate module on latest main | [query-keys.ts](https://github.com/6529-Collections/6529seize-frontend/blob/5048a8488976f43d97ffc2382e76bb4178c33407/components/react-query-wrapper/query-keys.ts#L16) |
| Existing native purchase visibility covers primary mint/subscription constraints | [userPageVisibility.ts](https://github.com/6529-Collections/6529seize-frontend/blob/5048a8488976f43d97ffc2382e76bb4178c33407/components/user/layout/userPageVisibility.ts#L14), [useNftPurchasingVisibility.ts](https://github.com/6529-Collections/6529seize-frontend/blob/5048a8488976f43d97ffc2382e76bb4178c33407/hooks/useNftPurchasingVisibility.ts#L31) |

Current user-facing reference routes are [The Memes](https://6529.io/the-memes), [Gradients](https://6529.io/6529-gradient), [Pebbles Trait Sets](https://6529.io/nextgen/collection/pebbles/trait-sets), and [TDH](https://6529.io/network/tdh). Source evidence, rather than a live production walkthrough, supports the behavior claims here.

## 3. Backend evidence

| Verified observation | Source at reviewed backend SHA |
|---|---|
| Market loop handles ERC-1155 Memes and ERC-721 Gradients | [nft_market_stats.ts](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/marketStatsLoop/nft_market_stats.ts#L31) |
| Existing prices are reduced summaries; schedules are periodic | [price parser](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/marketStatsLoop/nft_market_stats_prices.ts#L14), [worker schedules](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/marketStatsLoop/serverless.yaml#L27) |
| Season metadata produces indexed member boundaries/counts | [nft-extended-data.ts](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/nftsLoop/nft-extended-data.ts#L249) |
| Set counts require every member and use minimum edition balance | [tdh_memes.ts](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/tdhLoop/tdh_memes.ts#L34), [full sets](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/tdhLoop/tdh.ts#L375) |
| Artist reconciliation parses display-name strings; current NFT artist object covers selected families | [artists.ts](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/artists.ts#L14), [IArtist.ts](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/entities/IArtist.ts#L11) |
| NextGen token identity includes true/normalized ID, project, owner and rate | [INextGen.ts](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/entities/INextGen.ts#L403) |
| Pebbles trait coverage is distinct values grouped by raw wallet | [nextgen.db-api.ts](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/api-serverless/src/nextgen/nextgen.db-api.ts#L734) |
| Ultimate combines full coverage of selected traits with AND | [Ultimate query](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/api-serverless/src/nextgen/nextgen.db-api.ts#L872) |
| TDH eligibility, snapshot and rate inputs differ from live ownership stats | [eligibility and edition inputs](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/tdhLoop/tdh.ts#L112), [edition floor](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/memes-edition-size-floor.ts#L37) |
| Current boost schedule and additional-set geometric series | [tdh-rules.ts](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/tdhLoop/tdh-rules.ts#L5), [additional-set calculation](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/tdhLoop/tdh-rules.ts#L78), [indexing of additional sets](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/tdhLoop/tdh.ts#L513) |
| Acquisition-lot history preserves internal consolidation transfers and removes newest outgoing lots | [transfer replay](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/tdhLoop/tdh.ts#L699) |
| Per-token rounding and portfolio-wide boosted total | [whole-day and rate arithmetic](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/tdhLoop/tdh.ts#L651), [boosted aggregation](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/tdhLoop/tdh.ts#L818) |
| NextGen uses stored token rates, with a collection rate computation | [TDH NextGen input](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/tdhLoop/tdh.ts#L355), [rate refresh](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/nextgen/nextgen_tokens.ts#L468) |
| API auth and structured signatures have scoped actions; these are not exchange-order permissions | [auth context](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/api-serverless/src/auth/auth.ts#L120), [structured signatures](https://github.com/6529-Collections/6529seize-backend/blob/337cb0026a1ccf91b41ce79b19c5a700b1b8f0f9/src/api-serverless/src/wallet-signatures/structured-wallet-signatures.ts#L13) |

## 4. Current external integration references

Official documentation checked on 2026-09-10. These establish documented protocol/API behavior; they are not a successful integration test for these collections.

- [OpenSea SDK](https://docs.opensea.io/reference/opensea-sdk): current package and backend integration guidance.
- [Listing actions](https://docs.opensea.io/reference/create_listing_actions) and [offer actions](https://docs.opensea.io/reference/create_offer_actions): unsigned actions for client authorization, explicit expiry/quantity/fee configuration.
- [Listing fulfillment](https://docs.opensea.io/reference/generate_listing_fulfillment_data_v2): explicit ERC-1155 units and recipient.
- [Collection sweep](https://docs.opensea.io/reference/sweep_collection): replacement behavior requires special care for exact-item goals.
- [Seaport interface](https://docs.opensea.io/docs/seaport-interface) and [models](https://docs.opensea.io/docs/seaport-models): partial-order and available-order execution, counters and cancellation semantics.
- [OpenSea cancellation](https://docs.opensea.io/reference/cancel_order): conditions on offchain cancellation and previously issued fulfillment authorization.
- [OpenSea stream API](https://docs.opensea.io/reference/stream-api): current integration and missed/out-of-order event constraints.
- [OpenSea fees](https://docs.opensea.io/docs/opensea-fees) and [ERC-2981](https://eips.ethereum.org/EIPS/eip-2981): fee metadata versus settlement enforcement.
- [ERC-1155](https://eips.ethereum.org/EIPS/eip-1155), [ERC-721](https://eips.ethereum.org/EIPS/eip-721), [EIP-712](https://eips.ethereum.org/EIPS/eip-712), [ERC-1271](https://eips.ethereum.org/EIPS/eip-1271): quantities, approvals and signature boundaries.
- [Safe signatures](https://docs.safe.global/advanced/smart-account-signatures) and [Safe modules](https://docs.safe.global/advanced/smart-account-modules): wallet-specific authorization and module privilege.
- [MySQL exact numeric types](https://dev.mysql.com/doc/refman/8.4/en/fixed-point-types.html): 65-digit DECIMAL limit relevant to full uint256 storage.
- [Seaport hooks](https://docs.opensea.io/docs/seaport-hooks): possible future settlement-time enforcement, requiring separate integration/audit work.
- [Reservoir's official sunset announcement](https://x.com/reservoir0x/status/1912207186941313091): NFT/API sunset announced for 2025-10-15. The public post metadata/text were verified using X's own syndication response because the ordinary page did not render in the web reader. Historical documentation remaining online does not establish service availability.
- [Blur contract documentation](https://docs.blur.foundation/contracts) and [Blur site](https://blur.io/): contract information and API access-request entry; documented public listing prices are not proof of authorized native execution coverage.

## 5. Limitations of the original source review

The statements below describe the original September 10 design review only.
The implementation subsequently added authenticated provider checks, isolated
fork transaction tests, database tests and browser verification. The current
user guide and backend API contract describe the implemented scope; PR checks
and deployment records provide release evidence.

- No live production database, authenticated marketplace API account, wallet funds or signing credentials were used. Runtime current card count, season, artist coverage, supply, floor prices, provider health and deploy settings are not inferred from source.
- No current production browser walkthrough or app rendering verification was performed. The accompanying interaction concept is proposed UX, with illustrative data, not a screenshot of a shipped feature or a live quote.
- No implementation, dependency installation, build, app test, protocol fork test, wallet signature, transaction, PR, commit or deployment was performed. Validation for this deliverable consists of source references, independent review, document consistency and local link/whitespace checks.
- API paths, modules, schemas, fees, default timings, performance targets and phases in the specs are proposals. Existing code facts are grounded in the tables above. Capability gaps are release gates, not claims that the provider supports every proposed flow.
- Actual wallet/provider support, commercial/API terms, hard atomic baskets, native-app purchasing eligibility, creator-fee policy and any autonomous contract design still require their stated implementation proofs or owner decisions.
- A future main update can change these findings; all code links intentionally remain pinned to the reviewed SHAs so the basis is reviewable.
