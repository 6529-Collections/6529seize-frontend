# Artwork lifecycle

This page follows one artwork from its first collection record to its final
state. Stream breaks that journey into visible steps so an artist or collector
can tell what has happened, what can still change, who can act next, and which
outside service could still stop progress.

## A 1/1 journey in plain language

Consider one generative 1/1:

1. The artist receives a collection identity in Stream's shared token contract,
   called the Core. It follows ERC-721, the standard contract interface for
   recording NFT ownership.
2. The work's scripts, images, data, dependencies, randomness policy, sale
   terms, and recipients are assembled.
3. The artist signs a specific collection state.
4. A community curation process produces an exact sale authorization.
5. The authorized mint or auction creates the token and its permanent ID.
6. If the work uses randomness, a named provider fulfills one recorded request.
7. Metadata combines the stored artwork inputs into a description a viewer can
   use.
8. Sale value becomes credits owed to specific people rather than an
   unexplained contract balance.
9. Supply closes, the shared token contract's collection configuration freezes,
   and preservation evidence is checked.
10. A delayed finality ceremony closes the remaining artwork-changing paths.
11. If replaceable infrastructure later becomes obsolete, a visible successor
    can take over future duties without rewriting the token's Core history.

“Minted,” “sold,” “randomized,” “preserved,” “frozen,” and “final” are
different facts. The machinery exists because collapsing them into one
“immutable” state would hide important powers and failure cases.

## What this lifecycle protects

The sequence is designed to protect four things:

- **Identity:** a token keeps the same Core identity even when surrounding
  modules change.
- **Consent:** an artist or sale signer approves exact values, not a vague
  future action.
- **Coherence:** mint supply, one-use authorization state, payment credits,
  randomness, and metadata should either move together or roll back together.
- **Finality:** irreversible claims should name the precise state they close and
  give people time to inspect it.

The lifecycle cannot make every dependency self-sufficient. Signers can be
compromised, randomness providers can fail, committed files can disappear,
browsers can change, and governance can use powers that the community later
decides were too broad. Stream's aim is to expose those boundaries and preserve
evidence about them.

## 1. The collection receives an identity

The Core is Stream's shared ERC-721 token contract. An authorized caller creates
a collection through
[`StreamCore.createCollection`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L336).
The Core assigns the collection ID and records the artist address, supply
information, and other collection state. Additional collection data is set
through
[`setCollectionData`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L379).

Creating the record does not open minting. Sale authorization, mint policy,
metadata, randomness, and revenue configuration are separate decisions.

Stream uses one shared ERC-721 Core for many native collections. A token later
receives both a globally sequential ID and a collection-local serial. That lets
the work remain part of one common Stream identity surface while still being
identified inside its artist collection.

## 2. The artwork package is assembled

The artist-facing package can include:

- collection information;
- token-specific data;
- scripts and their execution order;
- images, animation, and attributes;
- dependency names, versions, bytes, and locations;
- metadata mode;
- randomness provider and failure policy;
- maximum supply and mint rules;
- sale terms;
- revenue recipients;
- preservation and finality manifests.

Different modules hold different parts because those parts have different
lifespans. Token identity belongs in the permanent Core. A sale mechanism,
browser dependency, renderer, or randomness provider may need a successor.

Writer identity matters too. An artist statement, owner statement,
institutional attestation, independent observation, rights record, and archive
record should not all inherit the same authority merely because they are
“metadata.”

## 3. The artist approves a specific state

The current artist-approval mechanism supports ordinary account signatures and
ERC-1271 signatures from contract wallets. Its typed domain binds the chain and
Core contract. The signed state binds:

- artist address;
- collection-freeze manifest hash;
- maximum collection purchases;
- collection total supply;
- final-supply delay.

The fields are defined in
[`StreamArtistApprovals`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamArtistApprovals.sol#L8-L21)
and assembled from Core state in
[`_hashArtistApproval`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L1631-L1639).

If a bound field changes, the earlier signature describes an older state. This
protects the artist from having one approval silently attached to different
bound terms.

The approval is not a universal artist veto. Different administrative and
governance paths still have their own authority. Reviewers must decide which
later steps—supply closure, Core freeze, preservation, and terminal
finality—also require fresh artist consent.

## 4. A distribution policy is chosen

The same Core can support a one-of-one sale, fixed edition, free claim,
airdrop, or another reviewed distribution policy without placing every future
sale profile in the permanent token contract.

The reviewed source contains two mint lanes:

- The signed Drop and current auction route use `StreamMinter`, which applies
  its own collection time and supply checks before calling the legacy Core mint
  entry.
- `StreamMintManager` and `StreamMintLedger` provide phases, executors, optional
  gates, policy hashes, time windows, supply constraints, and durable counters.

The signed path is visible in
[`StreamDrops._executeFixedPriceDrop`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L609-L632)
and
[`StreamMinter.mint`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMinter.sol#L130-L175).
The manager and durable ledger are in
[`StreamMintManager`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintManager.sol)
and
[`StreamMintLedger`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintLedger.sol).

These are not one combined path. The exact connected, source-only, accepted,
and proposed states are centralized on [Current Implementation and
Readiness](./security-testing-and-known-limitations). Every supported sale must
name one caller sequence, one counter model, and one Core entry.

## 5. Curation becomes an exact authorization

For a 6529 drop, an offchain process applies the relevant curation or Total Days
Held (TDH) rules. TDH is 6529's time-weighted holding measure. A service then
constructs an EIP-712 authorization—a standard typed message whose named fields
can be inspected before signing—and the configured signer signs it.

The authorization binds values including:

- chain and verifying contract;
- signer epoch;
- collection;
- payer and token recipient;
- quantity;
- price or auction terms;
- token-data hash;
- deadline;
- sale mode;
- a one-use replay identifier that prevents the authorization from being used
  again.

Solidity verifies the signed result. It does not calculate TDH, choose the
artist, or decide whether the community process was fair.

This separation protects the authorized action from drifting after the social
decision. A valid authorization can drive a fixed-price execution or register
an English auction, depending on its sale mode.

## 6. Mint execution must stay coherent

The legacy lane checks its pause state, collection time window, and supply
before calling Core.

The manager lane has a more explicit cross-module sequence. It validates the
phase, executor, optional gate, policy hash, and counters, then calls:

- [`prepareMintFromManager`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L492-L518);
- [`completePreparedMintFromManager`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L520-L550).

[`StreamMintManager.mintPrepared`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintManager.sol#L241-L299)
consumes counters and calls those entries in one transaction. If a later check
fails, transaction rollback restores the earlier changes.

The real invariant is larger than “no token was minted.” After a revert, supply
reservations, counters, replay identifiers, credits, and token state must all
return to one coherent result.

## 7. The token receives an identity that is never reused

The Core allocates a global token ID, associates it with the collection, and
records its collection-local serial. Supply is tracked as minted-ever history,
not merely as the number of tokens currently held.

This protects provenance after a burn. A token ID that once represented a work
is not returned to the allocation pool.

## 8. Randomness becomes a recorded process

If the collection uses randomness, minting creates a request bound to the token,
collection, provider address, and provider epoch.

The request can be:

1. pending;
2. fulfilled;
3. marked stale;
4. left with failed post-processing after provider output was accepted.

The lifecycle stores the provider request ID, request and fulfillment times,
derived seed, hash of the raw provider output, failure hash, and retry count.
The final seed binds the provider, request, collection, token, epoch, and raw
output commitment.

If the provider result was accepted but writing the seed into Core failed, the
retry path uses the same derived seed. It does not ask for new randomness. This
protects technical recovery from becoming a selective redraw.

Provider delay, stale handling, post-processing failure, migration, and burn can
still interact badly. A provider remains an external operational dependency,
and the current stale and migration limitations are recorded on the readiness
page.

## 9. Metadata turns state into an artwork description

`tokenURI` is produced from the collection's metadata mode and the token's
current state. Depending on the work, it can combine collection information,
scripts, token data, dependencies, images, attributes, and randomness output.

Metadata availability and artwork finality are different:

- Randomness can leave metadata pending.
- A data URI can contain JSON while the JSON points to external bytes.
- A script can be onchain while its browser or dependencies remain external.
- A content hash can verify retrieved bytes without making them retrievable.

The protocol therefore needs both accurate token metadata and a wider package
describing how to reconstruct the artwork.

## 10. Sale value becomes named obligations

A paid fixed-price sale and an English auction both place value under contract
control. Stream uses credits and pull withdrawals so sale progress does not
depend on every recipient accepting ETH during the same transaction.

In the current native fixed-price path, `StreamDrops` selects a token,
collection, or contract-default proceeds split and creates poster, protocol,
and curator-reserve credits. The auction contract separately accounts for
poster, protocol, curator, and bidder credits.

The fixed-price credit path is in
[`_creditFixedPriceProceeds`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L635-L680).
Auction proceeds are handled by
[`AuctionContract._creditAuctionProceeds`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L471-L508).

The source also contains a revenue resolver, split-wallet factory, split
wallets, asset-policy registry, and primary-sale settlement contract. Their
purpose is to make revenue precedence, recipients, supported assets, and
settlement identity explicit outside the sale modules.

Whichever path is used, every credited unit must have one source, one owner, and
sufficient backing. Emergency recovery must treat only balance beyond all
liabilities as surplus.

## 11. An auction reaches one final outcome

Auction registration mints the token into contract custody. Bids establish a
leader and amount. A displaced bidder receives a withdrawal credit instead of
an inline refund that could block the next bid.

After the end time, any caller may trigger settlement because the caller cannot
choose the winner, price, recipient, or proceeds. Those values are already
fixed by state.

With a winner, settlement credits proceeds and transfers the token from
custody. With no bids, the token returns to the poster or follows the
contract-poster claim path. Cancellation is available only within the defined
pre-bid boundary.

The protection is terminality: an auction should finish as settled with a
winner, settled without a bid, or cancelled. No path should settle, refund, or
transfer it twice.

## 12. Burn ends ownership, not history

[`StreamCore.burn`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L631)
removes the live ERC-721 ownership record. The token ID remains consumed and
the protocol retains burn audit information.

Reviewers must trace burn across:

- pending or fulfilled randomness;
- sale settlement and credits;
- minted-ever and live supply;
- metadata and preservation records;
- curator and revenue accounting;
- finality;
- offchain indexes.

A future reader should be able to distinguish “never existed” from “minted and
later burned.”

## 13. Supply closes

Supply closure is intended to establish that no further tokens can enter the
collection. It is based on minted-ever history and is separate from whether
scripts, metadata, or other artwork state can still change.

Closing supply must cover every mint route, phase, executor, authorization, and
auction path. A signed action prepared before closure must not become a hidden
way to mint afterward.

The final value should be visible in state and events, including when a
collection closes before minting any token. The current zero-mint exception is
an explicit release blocker detailed on [Current Implementation and
Readiness](./security-testing-and-known-limitations#known-limitations-and-unresolved-blockers).

## 14. The permanent Core boundary freezes

[`freezeCollection`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L827)
checks collection existence, required data, timing, supply, and pending metadata
conditions. It records a freeze-manifest commitment and permanently rejects the
Core mutations within its freeze boundary.

Core freeze closes minting, burn, artist-approval changes, randomizer changes,
and covered live-token or collection metadata mutations. Ordinary ERC-721
transfers remain possible. Append-only preservation records and some
post-freeze evidence operations remain separate.

This protects a defined Core boundary. It does not prove that every shared or
successor module has become terminal, which is why a generic “collection
frozen” label is not enough.

## 15. Preservation evidence can continue to grow

Preservation records can commit hashes, locations, manifests, signatures, and
other typed evidence about the materials needed to understand or reconstruct
the work.

They are append-only rather than overwriteable. An old record remains in
history even when a later record becomes the current `latest` record for its
type and subject. A future archive or institution can therefore add recovery
evidence without rewriting the artist's original final package.

A commitment is not storage. Long-term preservation still requires the bytes,
independent retrieval, functioning storage providers, and enough runtime
information to execute the work.

## 16. Artwork finality becomes a visible ceremony

[`StreamArtworkFinalityRegistry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamArtworkFinalityRegistry.sol)
defines a delayed finality process with scheduling, execution windows,
cancellation or veto, component manifests, and terminal state.

During the delay, the artist, collectors, guardians, and independent reviewers
should be able to inspect:

- exact collection and one-of-one manifests;
- files, dependencies, and content hashes;
- proposed execution time and expiry;
- artist approval;
- every mutation path the terminal state is expected to close.

Execution should apply the same payload that was visible during the waiting
period. A guardian can stop a suspicious proposal but should not be able to
replace its artistic commitments. A cancelled or expired proposal should
require a new identity and fresh approval.

The ceremony protects against a surprise irreversible transaction. It still
depends on a complete writer inventory and on people monitoring the schedule.

## 17. Successors carry future duties without rewriting history

Over decades, a renderer, storage route, randomness integration, or operational
module may fail or become obsolete. Stream's long-term model records module
identity, code hashes, interfaces, status, and successor relationships.

A successor does not rewrite the predecessor or the token's Core history. It
changes which replaceable module is recognized for a future duty.

A safe transition must answer:

- Which new actions route to the successor?
- Which liabilities and pending work remain with the predecessor?
- Which state is read, shared, migrated, or intentionally left behind?
- Can both modules act at once?
- Do signatures, nonces, counters, or replay keys cross the boundary?
- Which old artwork commitments remain binding?

This final step protects continuity without pretending that surrounding
infrastructure can remain unchanged forever.

## What should remain visible to a reader

A collector should not need transaction traces to understand the lifecycle.
The product should show whether a token is awaiting randomness, whether
metadata is complete, whether supply is closed, whether the Core boundary is
frozen, which preservation package applies, and whether terminal artwork
finality has occurred.

Stream's sophistication is useful only if these states become easier for
artists and collectors to understand—not merely more detailed in Solidity.

## Failure modes reviewers should test

- a collection is created with the wrong artist, supply, or module pointers;
- an artist signs a readable package that does not match the hashed state;
- a sale authorization is stolen, stale, replayed, or assembled incorrectly;
- a mint failure restores the token but not counters, replay state, or credits;
- overlapping phases or executors exceed intended supply;
- a randomness provider delays, fails, or leaves a token unrecoverable;
- metadata is correctly hashed but unavailable or impossible to execute;
- sale liabilities become unbacked or a hostile recipient blocks withdrawal;
- burn erases provenance or restores an allowance;
- supply closes while another mint path remains open;
- Core freeze leaves an alternate mutation path;
- finality binds the wrong manifest or rereads mutable values at execution;
- a successor duplicates authority, replay state, or liabilities.

## Questions for reviewers

1. Is every stage necessary, and is its purpose understandable without Solidity
   knowledge?
2. Which transitions require an artist signature in addition to protocol
   governance?
3. Which failures should revert atomically, and which should enter a visible
   recoverable state?
4. Are supply closure, Core freeze, preservation, and artwork finality separated
   clearly enough?
5. Which burn and provenance records must remain readable forever?
6. What evidence must be published before terminal finality can be scheduled?
7. What invariants must hold before a successor module becomes current?
