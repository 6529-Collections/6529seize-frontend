# Actual changes: address-only NFT collection lookup

The implementation in [FE PR #3897](https://github.com/6529-Collections/6529seize-frontend/pull/3897)
uses a pasted Ethereum contract address to select a collection. It is paired
with [BE PR #1974](https://github.com/6529-Collections/6529seize-backend/pull/1974).
This is a source-code comparison, not a claim that main matches every deployed
environment. Baselines checked on September 9, 2026: FE `main` at
`447a3235bec4a3f751058c4a3cdf0a0f904c9657` and BE `main` at
`41dfb41a33b9c1c01b7f4cb6a082838febf4594e`. The revised column describes
FE #3897 and BE #1974; endpoint changes take effect in each environment only
after the corresponding deployment.

## What to test: main versus revised

Use profile xTDH → Granted → Create New Grant for collection-picker checks.
Do not submit a real grant unless that is part of the intended test.
See [What to test](WHAT_TO_TEST.md) for inputs and manual procedures.

| Check | Main at the baseline above | Revised feature / expected test result |
| --- | --- | --- |
| Collection name or keyword | More than one non-address character enables debounced Alchemy collection search and can return matching collections. | Names show complete-address guidance and cause no collection lookup request. |
| Complete contract address | Already supported through contract metadata; a valid address starts lookup directly. | Same retained metadata endpoint, now with debouncing and lowercase normalization. Mixed case, lowercase, and surrounding spaces resolve the same collection. |
| ENS name, marketplace URL, incomplete or malformed address | Can be submitted as keyword text. This is not actual ENS resolution or URL parsing. | Invalid-address guidance, no lookup request, and no endless spinner. |
| Edit while results are visible or a lookup is pending | Keyword results can remain from the previous debounced query while typing. | Previous results disappear immediately on an address edit; mouse and Enter cannot select the old collection. |
| Mouse and keyboard selection | Both exist, but Enter can bypass the visible control's non-ERC-721 restriction. ArrowDown on an empty list can leave a negative active index. | Both enforce ERC-721. ArrowDown on an empty list followed by a valid result still permits Enter selection; ERC-1155 remains unselectable. |
| Loading, missing metadata, and failure | Loading spinner exists, without this picker's dedicated lookup-error message or retry button. | Distinct invalid/loading/not-found/unsupported/error messages. Try again retries; focus returns to the input before the button disappears. |
| Backend fallback | Name search tries FE `/api/alchemy/collections`, then BE `/alchemy-proxy/collections`; BE's array versus FE's expected envelope can already hide successful search results. Address lookup separately uses `/contract` failover. | Search failover and its response-shape mismatch are removed. Block the FE contract request and verify the retained BE `/alchemy-proxy/contract` fallback supplies metadata. |
| Retired search endpoints | Both call Alchemy search; empty queries return 400 with `query is required`. BE uses a one-minute request cache. | Both return 410 with `Collection name search is no longer available. Use a contract address.` for empty and nonempty queries, with `Cache-Control: no-store` and no Alchemy search request. Test each endpoint after its own deployment. |
| Token selection and saved state | Individual IDs, ranges, Select All, limits, clearing, and saved selections exist. | Unchanged. Exercise each control and ensure changing collections does not carry over old token selections. |
| Meme card-name search | Separate fixed-Memes-contract flow using 6529 `nfts_search`. | Unchanged: card IDs/ranges and card-name search remain available. |
| Owner NFTs and token metadata | Existing owner-NFT filtering/pagination and token-metadata endpoints. | Unchanged. Smoke-test a known wallet/contract and token. |
| Accessibility and layout | Existing combobox/keyboard controls, without the new associated lookup-status region. | Associated guidance, polite announcements, invalid/busy states, and retry focus. Verify actual screen-reader speech, keyboard operation, mobile layout, and 200% zoom. |

## Features removed: main versus revised

| Feature | Main at the baseline above | Revised feature |
| --- | --- | --- |
| Collection discovery by name or keyword | Find a collection without already knowing its address. | Removed from this picker; users obtain the complete contract address elsewhere. |
| Multiple matching collection suggestions | Browse Alchemy's matches in its returned order. | Only metadata for the supplied address, not a discovery/ranking list. |
| Spam-filtered keyword results | Suspected spam is hidden by default. When the results footer is visible, it can show a filtered count and **Show anyway**. | The keyword filter, count, and reveal control are removed. Pasted-address lookup already bypassed that filter and remains no safety verdict. |
| Collection-search API access and fallback | FE and older clients can request keyword results from the search routes. | Those routes return 410; older clients lose this fallback and may show no suggestions. |

The old control is specifically **Show anyway**, not a permanently available
Hide/Show toggle. Search helpers carried pagination metadata, but the picker
had no next-page or load-more control; no visible pagination feature is removed.
Other app searches are not blanket-disabled. Distribution Plan's separately
operated allowlist search remains outside this implementation.

## Address lookup is not a safety check

V3 `getContractMetadata` does not document `isSpam` or
`spamClassifications`. No `isSpamContract` request is added in this change.
Do not interpret the existing normalizer's default non-spam value, collection
name, image, or verification metadata as an affirmative safety verdict.
No replacement search provider or index is added; the obsolete search response
types, normalizer, cache, and helper are removed.

## Retained features

- Ethereum mainnet contract metadata lookup, including lowercase and checksummed
  input, the existing metadata normalization, and BE failover.
- Explicit user selection of the returned ERC-721 collection.
- Token IDs, ranges, Select All, existing output formats and selection limits.
- Previously saved contract/token selections.
- Owner NFT queries with contract filtering and token metadata queries.
- Meme Card Set's fixed Memes contract, card-ID input, and its separate 6529
  card-name search. That card search uses `nfts_search`, not Alchemy collection
  discovery. The initial audit overstated its dependence on keyword lookup;
  it is covered here as a shared-picker regression case.
- Other collection searches, such as site search, are not blanket-disabled.

## Input and error behavior

Whitespace around an address is ignored. Only a complete `0x` plus 40 hex
characters starts a debounced lookup. Names, ENS names, partial addresses, and
marketplace URLs show address guidance without a lookup. Editing the address
immediately hides stale results. Loading, missing metadata, unsupported token
type, and request failure have distinct messages; failure offers Try again.

New collection-input copy uses the locale message system and falls back to
English for untranslated locales. The rest of the existing picker retains its
current localization debt; translating the full picker is separate work.

## Remaining work and rollout

- The separate allowlist service behind `ALLOWLIST_API_ENDPOINT` is outside
  these repositories. Its Distribution Plan collection search remains unchanged
  and still needs an owner audit before the Alchemy deadline.
- Core implementation is deferred. An installed older desktop renderer can
  still call its local Alchemy search until it is synced and released.
- Treat this as one coordinated migration: deploy the FE address-only UI first.
  The address endpoint already exists on both old and new BE versions. Gate BE
  retirement on older web/desktop clients being updated, or on explicit release
  owner acceptance of the compatibility loss for remaining older clients.
  Record that decision and the Core release plan before deploying BE. Its 410
  response ends their search fallback; neither release preserves keyword
  discovery. The provider deadline still applies to clients that are not updated.
- Do not roll back to the deprecated search implementation after September 30,
  2026. A corrective release must keep address-only behavior or use another
  supported provider.

See [What to test](WHAT_TO_TEST.md) and [remaining TODOs](TODO.md).
