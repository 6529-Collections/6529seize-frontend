## The journey in one minute

The intended journey is: prepare the artwork, agree the release, obtain artist consent, create and sell tokens, reveal any generated art, then close and preserve the work. **The complete launch journey is not connected and verified yet.**

The permanent Core, mint manager, and ledger are built. Artist authority and the full sale, payment, metadata, and reveal integrations need their own implementation and evidence. The older signed-sale rehearsal uses a test-only legacy Core.

## Prepare the work and release

The artist and release team should identify the files, program, inputs, license, edition size, sale terms, and payment recipients. Community selection and TDH decisions happen outside the contracts.

**Agreed but unfinished:** artist acceptance and the required consent must be verified for artist-bound work. The example artwork illustrates the intended review experience; it does not demonstrate an enforced approval of the whole release plan.

## Create the token

In the built permanent-Core path, the registered mint manager validates its phase and gates, consumes allowance and replay records in the ledger, then asks Core to mint. Core assigns the token's global ID and its serial within the collection. Transfers do not change those identities.

The manager supports a direct mint and a prepare/complete flow. Both bind a batch record to individual token operations. A failed transaction rolls back its state changes. Preparing a token is not evidence that payment or artist consent has been completed.

See [manager execution](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/mint/StreamMintManager.sol#L252) and [token execution](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/mint/StreamMintCoreExecutor.sol).

## Sell, reveal, and hold

The retained older contracts demonstrate fixed-price ETH sales and English auctions. An unsold auction token returns to the named poster, or gives that poster a claim path when it is a contract. The transaction submitter can be someone else.

A minted token may still be waiting for its artwork's random result. The permanent Core records the entropy coordinator used at mint; the full reveal process belongs outside Core. Legacy randomizer behavior and a test callback do not prove a complete production reveal service.

See [sales](./fixed-price-sales-and-auctions) and [randomness](./randomness).

## Close supply, block burns, then freeze

**Built in the permanent Core:** a collection can become closed. Closed is a terminal state: it cannot return to active or paused, even if no token was minted. Core checks collection status before allocating another token.

Burn blocking is a separate irreversible step after closure. Core freeze then requires closure and burn blocking in an earlier block. Freeze locks the Core collection boundary; it does not by itself freeze every external artwork record or keep a file online.

This replaces the old Core's `setFinalSupply` model. The old zero-token reopening problem should not be presented as current permanent-Core behavior.

See [closure](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L335), [burn blocking](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L409), and [Core freeze](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L445).

## Preserve and finalize the artwork

Preservation records can document copies, dependencies, and recovery instructions. Wider artwork finality checks a defined set of components and a manifest through a separate registry, with scheduling and veto controls. The deployment must prove that the required components and artist approval are connected and that no intended mutation path remains.

See [freezing and finality](./freezing-preservation-and-artwork-finality).

## Questions for reviewers

At each stage, can the artist and collector tell what is complete, what can still change, and who controls the next step? Which failure or recovery path is missing from this journey?
