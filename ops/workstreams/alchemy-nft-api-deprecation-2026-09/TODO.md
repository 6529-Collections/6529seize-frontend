# Alchemy NFT API deprecation TODO

Status: Address-only implementation complete; rollout and manual acceptance tracked below

For the point-by-point baseline comparison, see
[what to test: main versus revised](ACTUAL_CHANGES.md#what-to-test-main-versus-revised)
and [features removed](ACTUAL_CHANGES.md#features-removed-main-versus-revised).

Deadline: September 30, 2026

Audit basis: `main` at `05ab9c809686998a8f06fdf401a3ab9e71e61694`

Alchemy will stop serving ten deprecated NFT API endpoint families on the
deadline above. This repository uses one of them: V3
`searchContractMetadata`. The migration is not a one-for-one endpoint rename
because the current product supports free-text collection discovery, while
Alchemy's suggested `getContractMetadata` replacement requires a contract
address.

Sources:

- [Alchemy deprecation notice](https://www.alchemy.com/docs/changelog/2026/8/18)
- [V3 `getContractMetadata`](https://www.alchemy.com/docs/reference/nft-api-endpoints/nft-api-endpoints/nft-metadata-endpoints/get-contract-metadata-v-3)
- [V3 `getNFTsForOwner`](https://www.alchemy.com/docs/reference/nft-api-endpoints/nft-api-endpoints/nft-ownership-endpoints/get-nf-ts-for-owner-v-3)
- [Current NFT API endpoint inventory](https://www.alchemy.com/docs/reference/nft-api-endpoints)

## Original audit result (before implementation)

| Deprecated endpoint family | Repository status | Assessment |
| --- | --- | --- |
| `getCollectionsForOwner` | Not used | No change. |
| `getCollectionMetadata` | Not used | No change. Existing contract lookups already use V3 `getContractMetadata`. |
| `isHolderOfCollection` / `isHolderOfContract` | Not used | No change. The owner lookup already uses V3 `getNFTsForOwner` with `contractAddresses[]`. |
| `getSpamContracts` | Not used | No change. Existing response parsing reads inline spam flags. |
| `searchContractMetadata` | **Used** | Must be removed or replaced before the deadline. Free-text behavior cannot be preserved by passing the query to `getContractMetadata`. |
| `summarizeNftAttributes` / `summarizeNFTAttributes` | Not used | No change. |
| `computeRarity` | Not used | No change. Other occurrences of rarity terminology are application data, not Alchemy endpoint calls. |
| `invalidateContract` | Not used | No change. |
| `isAirdrop` / `isAirdropNFT` | Not used | No change. `LatestActivityRow`'s local `isAirdrop()` classification is unrelated to Alchemy. |
| `getNFTSales` | Not used | No change. Sales views use 6529 data paths, not this Alchemy endpoint. |

The affected call path is:

1. `components/nft-picker/hooks/useNftSearch.ts` enables free-text collection
   search for non-address input.
2. `hooks/useAlchemyNftQueries.ts` calls the local
   `/api/alchemy/collections` route and falls back to backend
   `/alchemy-proxy/collections`.
3. `app/api/alchemy/collections/route.ts` and
   `services/alchemy/collections.ts` call Alchemy V3
   `searchContractMetadata` directly.
4. `NftPicker` is used by the xTDH grant flow and the wave Meme Card Set
   picker, so the migration affects product behavior rather than only an
   unused helper.

## Implementation checklist

- [x] Select address-only behavior; reuse the existing contract metadata route and BE fallback.
- [x] Remove keyword lookup, its query cache, search response normalization/types, and server helper.
- [x] Return HTTP 410 from the old local search route without contacting Alchemy.
- [x] Add debounced address validation, loading/not-found/error states, retry, and stale-result protection.
- [x] Remove the keyword spam filter and Show anyway control; document that pasted-address lookup remains unfiltered.
- [x] Enforce the existing ERC-721 restriction for keyboard and mouse selection.
- [x] Update focused tests, product guidance, and the help corpus.
- [x] Keep the network/open-data E2E empty-query check compatible with both the old 400 (`query is required`) and retired 410 (address-only error), requiring the matching response body and no-store header. Other routes retain their 400 validation checks. The route unit test and post-migration manual checks still require 410; the shared E2E check alone does not prove retirement.
- [x] Add [Actual changes](ACTUAL_CHANGES.md) and [What to test](WHAT_TO_TEST.md).
- [ ] Complete manual acceptance on the deployed environment.
- [ ] Coordinate FE/BE rollout and the explicit loss of old-client keyword fallback.
- [ ] Sync and release Core through its separate PR/workflow before September 30.
- [ ] Obtain the external allowlist-service owner's audit and migrate its
  Distribution Plan search if it calls a retired endpoint.

The initial audit's Meme Card Set impact was overstated: its collection is fixed
and its separate 6529 card-name search remains supported. The shared picker
is still included in regression coverage. See ACTUAL_CHANGES.md for details.

## Original exactness and logic assessment

- Existing `getContractMetadata` calls match the recommended V3 endpoint and
  pass `contractAddress`. The normalization layer already tolerates the
  observed `openSeaMetadata`/`openseaMetadata` casing variants and reads
  collection name, floor price, and imagery. It can normalize spam fields from
  responses that contain them, but `getContractMetadata` does not document
  those fields and the current normalizer defaults missing spam data to
  non-spam; this cannot be treated as a spam check.
- Existing ownership checks match Alchemy's recommended pattern: V3
  `getNFTsForOwner` plus a contract-address filter. Pagination is already
  implemented for the server helper.
- The `searchContractMetadata` migration is **not behaviorally exact**. A
  direct substitution would turn keyword search into an invalid-address call
  or misleading partial behavior. Product input rules, API semantics, response
  types, caching, empty/error states, and tests must change together unless a
  new discovery data source is introduced.
- No evidence in this repository requires a replacement for the other nine
  deprecated endpoint families.
