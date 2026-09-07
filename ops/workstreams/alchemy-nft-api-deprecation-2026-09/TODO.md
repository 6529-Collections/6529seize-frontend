# Alchemy NFT API deprecation TODO

Status: Open

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

## Audit result

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

## Required TODOs

### 1. Decide the replacement behavior

- [ ] Choose between the following intentionally different product contracts:
  - **Recommended minimal migration:** make collection lookup address-only and
    reuse `useContractOverviewQuery`, `/api/alchemy/contract`, and backend
    `/alchemy-proxy/contract`, all of which already use V3
    `getContractMetadata`.
  - **Preserve free-text discovery:** select and document a different search
    provider or a 6529-owned indexed catalogue. `getContractMetadata` alone
    cannot implement keyword search.
- [ ] Confirm whether the picker should show an explicit "enter a contract
  address" state or retain search suggestions from a new source.
- [ ] Define spam filtering for the chosen path. Exact-address metadata exposes
  a single contract's inline spam state; it does not reproduce a filtered list
  of search results.

### 2. Remove the deprecated frontend call path

- [ ] Remove or replace `app/api/alchemy/collections/route.ts`.
- [ ] Remove or replace `searchNftCollections` in
  `services/alchemy/collections.ts` and its server-only export.
- [ ] Refactor `useCollectionSearch` and its suggestion cache in
  `hooks/useAlchemyNftQueries.ts` according to the chosen behavior.
- [ ] Retire obsolete `AlchemySearchResponse`, search params/results, response
  normalization, and `NFT_COLLECTION_SEARCH` cache-key code if free-text
  discovery is removed.
- [ ] Update `NftPicker` loading, empty, invalid-address, keyboard, and helper
  text states so the UI accurately describes the new contract.
- [ ] Exercise both consumers: xTDH grant selection and Meme Card Set voting
  configuration.

### 3. Coordinate the backend fallback contract

- [ ] Land the backend removal or replacement of
  `/alchemy-proxy/collections` in coordination with this change. Do not leave a
  fallback that still calls the deprecated endpoint.
- [ ] Fix or eliminate the existing response-shape mismatch: the backend
  wrapper returns an array after unwrapping Alchemy's `{ contracts: [...] }`
  envelope, while frontend `processSearchResponse` expects the envelope. The
  current backend fallback can therefore normalize a successful response to an
  empty suggestion list.
- [ ] If a public 6529 API contract replaces the runtime-only proxy route,
  define it in the backend OpenAPI source and regenerate/synchronize the
  frontend client through the repositories' documented workflow.

### 4. Audit the separate allowlist service

- [ ] Ask the owner of `ALLOWLIST_API_ENDPOINT` to inspect
  `POST /other/search-contract-metadata` and
  `GET /other/contract-metadata/{contract}`. Their implementation is not in
  FE, BE, or Core, so this three-repository audit cannot prove whether that
  service calls either deprecated Alchemy endpoint.
- [ ] If the allowlist search uses `searchContractMetadata`, coordinate its
  migration with the Distribution Plan "Search NFT collection" UI. This is a
  second free-text discovery flow and has the same non-equivalent replacement
  problem.

### 5. Validate and roll out before September 30

- [ ] Add focused tests for the selected address-only or replacement-search
  contract, including primary-route failure and backend fallback behavior.
- [ ] Update tests that currently fixture the `contracts` search envelope and
  NftPicker keyword suggestions.
- [ ] Run the frontend changed-file checks and focused Alchemy/NftPicker tests.
- [ ] Re-scan production source for all endpoint names in Alchemy's notice.
- [ ] Deploy any required backend API change before or atomically with the
  frontend behavior that depends on it.
- [ ] Sync the merged frontend change into Core through Core's `pull-web`
  workflow; do not patch Core's imported renderer independently.

## Exactness and logic assessment

- Existing `getContractMetadata` calls match the recommended V3 endpoint and
  pass `contractAddress`. The normalization layer already tolerates the
  observed `openSeaMetadata`/`openseaMetadata` casing variants and reads
  collection name, floor price, imagery, and spam metadata used by the UI.
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
