# Actual changes: address-only NFT collection lookup

The implementation in [FE PR #3897](https://github.com/6529-Collections/6529seize-frontend/pull/3897)
uses a pasted Ethereum contract address to select a collection. It is paired
with [BE PR #1974](https://github.com/6529-Collections/6529seize-backend/pull/1974).
These are implementation changes awaiting deployment, not a claim about the live site.

## Behavior that is not an exact match

| Capability | Before | After |
| --- | --- | --- |
| Collection-name or partial-name discovery | Non-address text used Alchemy collection search. | Removed. The input explains that a complete contract address is required. No replacement search provider or index is added. |
| Multiple collection suggestions and search pagination | Search could return a list; the server helper supported a page key (the picker did not expose paging). | One contract result, or no result. Search response types, normalizer, cache, and helper are removed. |
| Spam filtering in search | Keyword results were filtered by default, with a control to reveal hidden entries. Pasted-address results bypassed that filtering. | The keyword filter and toggle are removed. Address selection retains its previous behavior: it is not a spam or authenticity check. |
| Search fallback | FE fell back to BE search, but the BE array / FE envelope mismatch could hide successful results. | Search failover is removed, eliminating that mismatch. Address lookup still falls back to BE contract metadata. |
| Existing clients calling the search route | Could request collection-name search while Alchemy supported it. | Both retired search routes return HTTP 410 and a clear error, without an Alchemy request. Older clients might show no suggestions rather than the error text. |
| Unsupported NFT standards | Mouse selection disabled non-ERC-721 results, but Enter could bypass it. | Keyboard and mouse both enforce the existing ERC-721 restriction. |

V3 `getContractMetadata` does not document `isSpam` or
`spamClassifications`. No `isSpamContract` request is added in this change.
Do not interpret the existing normalizer's default non-spam value, collection
name, image, or verification metadata as an affirmative safety verdict.

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
