## One contract, distinct artworks and collections

All Stream NFTs share one permanent ERC-721 Core. Each token has a global ID, a collection ID, and a serial within that collection. Those recorded identities support 1/1 works, series of distinct works, and editions outside The Memes.

Some marketplaces group tokens only by contract address. They may display Stream collections together unless they read the collection information. Artist and collector screens must explain the actual marketplace support; a collection ID alone does not guarantee a separate storefront.

See [token identity](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L472) and [collection display requirements](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0015-collection-identity-and-facade-readiness.md).

## Supply modes and permanent closure

**Built in this Core:** fixed-size, capped-open, and uncapped-open collection configurations. A fixed-size collection has a fixed maximum. A capped-open collection can have its maximum changed under governance rules before closure, never below the number already minted. An uncapped-open collection has no numeric maximum, but can still be closed.

Active and paused collections can change between those states through the required controls. Closed collections cannot reopen. This includes a collection closed before any token was minted. Closing supply does not automatically block burns or finalize the artwork.

Burning reduces live supply but does not reuse the token's identity or undo its minted history. A supply limit is not a count of tokens currently held by collectors.

See [collection creation](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L291), [closure](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L335), and [maximum changes](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L379).

## The built manager path

The registered manager checks the phase, caller, token batch, and required gates. Its ledger consumes counters, authorization uses, nullifiers, and the batch operation root before Core execution. A nullifier is a one-use marker that prevents the same claim from being used again.

The batch root identifies the whole operation; each token also has its own operation ID. Both the direct mint and prepare/complete path use this accounting. **ADR 0018 is accepted and implemented in this source.** It must no longer be described as an unbuilt proposal.

See [manager](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/mint/StreamMintManager.sol), [ledger consumption](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/mint/StreamMintLedger.sol#L119), and [ADR 0018](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0018-batch-operation-root-and-token-identity.md).

## What still needs connecting

The old `StreamDrops → StreamMinter` path targets the legacy Core interface. Its one-token sale authorization and rehearsal should be read separately from the new manager path.

The presence of working manager, ledger, and Core functions does not establish a completed artist-consent check or paid sale. The launch configuration still needs the required sale adapters, artist authority, settlement, and replacement-continuity evidence.

See [legacy minter interface](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/mint/StreamMinter.sol#L12-L16), [accepted mint specification](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/mint-policy-and-accounting.md), and [readiness](./security-testing-and-known-limitations).

## Questions for reviewers

Can two phases exceed a shared allowance? Can a failed batch consume a claim? Can a replacement manager reuse a completed operation? Can a collector tell whether the edition has a fixed maximum, a changeable cap, or an open supply?
