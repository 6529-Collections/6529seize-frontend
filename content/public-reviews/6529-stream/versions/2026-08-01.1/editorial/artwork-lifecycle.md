# Artwork lifecycle

A Stream artwork moves through a sequence of deliberate commitments. Collection
identity comes first. Artwork materials, distribution, payment, randomness, and
metadata are then assembled around it. Supply and Core configuration can later
be closed, preservation evidence can accumulate, and a final ceremony can make
the remaining artwork state terminal.

That sequence is a major part of the design. “Minted,” “sold,” “frozen,”
“preserved,” and “final” describe different facts. Keeping them separate makes
each commitment visible and reviewable.

This page follows one collection through the lifecycle and explains what each
stage protects.

## 1. The collection receives a permanent identity

An authorized caller creates a collection through
[`StreamCore.createCollection`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L336).
The Core assigns the collection ID and stores its descriptive collection
information.
[`setCollectionData`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L379)
separately records the artist address, maximum collection purchases, total
supply, and final-supply delay.

The identity exists before a sale or mint opens and remains independent of the
sale mechanism that distributes its first token.

Stream uses one shared ERC-721 Core for many native collections. Tokens receive
globally sequential IDs and collection-local serials, allowing a work to be
identified both in the protocol as a whole and within its artist collection.

## 2. The artwork package is assembled

An artwork package can include:

- collection information;
- token-specific data;
- scripts and their order;
- images, animation, and attributes;
- dependency names, versions, bytes, and locations;
- a metadata mode;
- a randomness provider and policy;
- maximum supply and mint rules;
- sale terms;
- revenue recipients;
- preservation and finality manifests.

Different modules hold different parts because those parts have different
change horizons. Token identity belongs in the permanent Core. A browser
dependency, sale module, or randomness provider may need a successor years
later.

The authority to write each part is as important as the value itself.
Collection metadata and preservation records use record-family checks so that
an artist statement, owner statement, institutional attestation, independent
observation, rights record, and archive record each keep their proper writer.

## 3. The artist can approve a specific state

The current artist-approval mechanism accepts signatures from ordinary accounts
and ERC-1271 contract wallets. Its EIP-712 domain binds the chain and Core
contract. The signed collection-state hash binds:

- artist address;
- collection-freeze manifest hash;
- maximum collection purchases;
- collection total supply;
- final-supply delay.

The typed fields are defined in
[`StreamArtistApprovals`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamArtistApprovals.sol#L8-L21)
and assembled from Core state in
[`_hashArtistApproval`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L1631-L1639).

If a bound field changes, the current state requires a new signature. This makes
approval version-specific and tied to exact terms.

Artist approval and administrative authority remain distinct. The current
approval covers a defined collection state. Deciding which transitions need
fresh artist consent is one of
the central questions of this review.

## 4. A distribution policy is selected

Stream separates permanent token rules from replaceable distribution policy.
That allows a one-of-one sale, fixed edition, free claim, airdrop, or future
mechanism to use the same Core identity. Sale profiles live in replaceable
modules around the permanent contract.

The reviewed source contains two mint lanes with different responsibilities.
The signed Drop and current auction route use `StreamMinter`, which applies its
own time and supply checks before calling the legacy Core mint entry.
[`StreamDrops._executeFixedPriceDrop`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L609-L632)
and
[`StreamMinter.mint`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMinter.sol#L130-L175)
show that path.

The source also contains a manager-and-ledger lane.
[`StreamMintManager`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintManager.sol)
defines phases, executors, gates, time windows, supply constraints, and counter
policies.
[`StreamMintLedger`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintLedger.sol)
keeps usage across wallets, recipients, tokens, authorizers, and policy
contexts, preserving historical limits through manager replacement.

Each lane needs its own explicit caller sequence, counter model, and Core entry
for every supported sale profile.

## 5. Curation becomes a bound authorization

For a 6529 drop, an offchain process applies the relevant curation or TDH rules
and constructs an EIP-712 authorization. The configured signer then signs the
exact payload.

The payload binds values including:

- chain and verifying contract;
- signer epoch;
- collection;
- payer and token recipient;
- quantity;
- price or auction terms;
- token-data hash;
- deadline;
- sale mode;
- replay identifier.

The community process calculates TDH, chooses the artist, and establishes
fairness. Solidity verifies the resulting authorization. Its responsibility is
to prevent the submitted transaction from becoming a different action from the
one that was signed.

A valid authorization can drive a fixed-price execution or register an English
auction, depending on the bound sale mode.

## 6. The selected mint lane executes atomically

The legacy lane checks its configured pause, collection time window, and supply
before calling Core.

The manager lane has a more explicit composition sequence. It validates the
active phase, executor, optional gate, policy hash, and counters, then performs
a prepared mint through:

- [`prepareMintFromManager`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L492-L518);
- [`completePreparedMintFromManager`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L520-L550).

[`StreamMintManager.mintPrepared`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintManager.sol#L241-L299)
consumes counters and calls the Core entries in one transaction. If a later
check fails, transaction rollback restores the earlier state.

The lifecycle invariant covers every state touched by minting. After a revert,
token state, supply reservations, counters, replay identifiers, and credits
must all return to the pre-call result.

## 7. The token receives a permanent identity

The Core allocates a global token ID, associates it with the collection, and
records its collection-local serial. Supply is tracked as minted-ever history,
including tokens that were later burned.

That distinction lets the protocol preserve the fact that a token existed after
the owner burns it. A burned identifier remains permanently allocated.

## 8. Randomness enters a recorded lifecycle

If the collection uses randomness, minting creates a request bound to the
token, collection, provider address, and provider epoch.

The request can be:

1. pending;
2. fulfilled;
3. marked stale;
4. left with failed post-processing after provider output was accepted.

The lifecycle stores the provider request ID, request and fulfillment times,
derived seed, hash of the raw provider output, failure hash, and retry count.
The final seed binds the provider, request, collection, token, epoch, and raw
output commitment.

If writing an accepted seed into Core fails, the retry path uses the same
derived seed and skips a new provider request. This protects a technical
recovery from becoming a redraw.

Provider delay, stale handling, post-processing failure, provider migration,
and token burn can intersect. A state machine makes those transitions explicit.

## 9. Metadata turns stored state into an artwork description

`tokenURI` is produced from the collection's metadata mode and the token's
current state. Depending on the work, the renderer can combine collection
information, scripts, token data, dependencies, images, attributes, and
randomness output.

Metadata status needs several separate facts:

- Randomness may still be pending.
- Token JSON may point to external media.
- A stored script may require an external browser or dependency.
- A content hash verifies retrieved bytes; storage and retrieval services make
  those bytes available.

The protocol therefore needs an accurate `tokenURI` and a broader record of the
artwork's required materials and runtime.

## 10. Sale value becomes explicit liabilities

A paid fixed-price sale and an English auction both place value under contract
control. Credits and pull withdrawals keep sale progress independent of each
recipient's ability to accept ETH during the transaction.

In the current native fixed-price path, `StreamDrops` selects a token,
collection, or contract-default proceeds split and creates poster, protocol,
and curator-reserve credits. The auction contract separately accounts for
poster, protocol, curator, and bidder credits.

The exact native fixed-price credit path is in
[`_creditFixedPriceProceeds`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L635-L680).
Auction proceeds are handled by
[`AuctionContract._creditAuctionProceeds`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L471-L508).

The repository also contains a revenue resolver, deterministic split-wallet
factory, split wallets, an asset-policy registry, and a primary-sale settlement
contract. Their purpose is to make revenue precedence, recipients, supported
assets, and settlement identity explicit outside the sale modules.

Whichever accounting path is used, the invariant is the same: every credited
unit must have one source, one owner, and sufficient backing, and emergency
surplus must exclude all liabilities.

## 11. An auction reaches a terminal outcome

Auction registration mints the token into contract custody. Bids establish a
leader and amount. A displaced bidder receives a withdrawal credit, allowing
the next bid to proceed even when an inline refund would fail.

After the end time, any caller may trigger settlement using the winner, price,
recipient, and proceeds already fixed by state.

With a winner, settlement credits proceeds and transfers the token from
custody. With no bids, the token returns to the poster or follows the
contract-poster claim path. Cancellation is available only within the defined
pre-bid boundary.

The lifecycle must make each outcome terminal: settled with a winner, settled
with zero bids, or cancelled. Each auction settles, refunds, or transfers once.

## 12. Burning preserves token history

[`StreamCore.burn`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L631)
removes the live ERC-721 ownership record. The token ID remains consumed and
the protocol retains burn audit information.

Burn has consequences beyond ownership. Reviewers must trace its interaction
with:

- pending or fulfilled randomness;
- sale settlement and credits;
- minted-ever and live supply;
- metadata and preservation records;
- curator and revenue accounting;
- finality;
- offchain indexes.

A protocol that preserves provenance should let future readers distinguish
“never existed” from “minted and later burned.”

## 13. Supply is closed

Supply closure is intended to establish that no further tokens may enter the
collection. It is based on minted-ever history and is separate from whether
scripts, metadata, or other artwork state can still change.

Closing supply must disable every mint route, phase, executor, authorization,
and auction path, including signed actions prepared before closure.

The final value should be visible in state and events, including the case where
the collection closes before minting any token.

## 14. The permanent Core boundary is frozen

[`freezeCollection`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L827)
checks collection existence, required data, timing, supply, and pending metadata
conditions. It records a freeze-manifest commitment and permanently rejects the
Core mutations within its freeze boundary.

Core freeze closes minting, burn, artist-approval changes, randomizer changes,
and covered live-token or collection metadata mutations. Ordinary ERC-721
transfers remain possible. Append-only preservation records and some
post-freeze evidence operations remain separate.

This is why “collection frozen” needs an exact field and selector inventory.
Core freeze protects the permanent collection boundary. Terminal artwork
finality across every module is a separate commitment.

## 15. Preservation evidence remains available to grow

Preservation records can commit hashes, locations, manifests, signatures, and
other typed evidence about the materials needed to understand or reproduce the
work.

They are append-only. An older record remains part of history even when a later
record becomes the current `latest` record for its
type and subject. That allows a future archive or institution to add recovery
evidence while preserving the package the artist originally finalized.

A content commitment supports integrity checks. Long-term preservation also
requires the bytes, independent retrieval, operating storage providers, and enough runtime
information to execute the work.

## 16. Artwork finality becomes a visible ceremony

[`StreamArtworkFinalityRegistry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamArtworkFinalityRegistry.sol)
defines a delayed finality process with scheduling, execution windows,
cancellation or veto, component manifests, and terminal state.

The delay gives the artist, collectors, guardians, and independent reviewers
time to inspect:

- the exact collection and one-of-one manifests;
- the files, dependencies, and content hashes they cover;
- the proposed execution time and expiry;
- the artist approval;
- every mutation path the terminal state is expected to close.

Execution should apply the same payload that was visible during the waiting
period. A guardian can stop a suspicious proposal; replacement of its artistic
commitments requires a new proposal. A cancelled or expired proposal should
require a new identity and fresh approval.

The ceremony gives an irreversible action a visible, reviewable boundary.

## 17. Successor modules can carry future duties

Over decades, a renderer, storage route, randomness integration, or operational
module may fail or become obsolete. Stream's long-term model records module
identity, code hashes, interfaces, status, and successor relationships.

A successor preserves the predecessor and the token's Core history while
changing which replaceable module is recognized for a future duty.

A safe transition must answer:

- Which new actions route to the successor?
- Which liabilities and pending work remain with the predecessor?
- Which state is shared, read, migrated, or intentionally left behind?
- Can both modules act at the same time?
- Do signatures, nonces, counters, or replay keys cross the boundary?
- Which old artwork commitments remain binding?

This is the final lifecycle responsibility: preserve the artwork's identity
while making the evolution of surrounding infrastructure explicit.

## What collectors should see

The product should explain this lifecycle directly to collectors. It should show
whether a token is awaiting randomness, whether metadata is complete, whether
supply is closed, whether the Core boundary is frozen, which preservation
package applies, and whether artwork finality has occurred.

Presenting each state separately lets artists and collectors understand the
exact commitment already made.

## Failure modes reviewers should test

- a collection is created with the wrong artist, supply, or module pointers;
- an artist signs a human-readable package that diverges from the hashed state;
- a signed authorization is stolen, stale, replayed, or incorrectly assembled;
- a mint failure leaves counters, replay state, or credits changed after token
  restoration;
- overlapping phases or executors exceed the intended supply;
- a randomness provider delays, fails, or leaves a token in an unrecoverable
  state;
- metadata is correctly hashed and unavailable or impossible to execute;
- sale liabilities become unbacked or a hostile recipient blocks withdrawal;
- burn erases provenance or restores an allowance unintentionally;
- supply closes while another mint path remains open;
- Core freeze leaves an unexpected alternate mutation path;
- a finality proposal binds the wrong manifest or rereads mutable values at
  execution;
- a successor duplicates authority, replay state, or liabilities.

## Questions for reviewers

1. Is every stage necessary, and is its purpose clear in ordinary language?
2. Which transitions require an artist signature in addition to protocol
   governance?
3. Which failures should revert atomically, and which should enter a visible
   recoverable state?
4. Are supply closure, Core freeze, preservation, and artwork finality separated
   clearly enough?
5. Which burn and provenance records must remain readable forever?
6. What evidence must be published before terminal finality can be scheduled?
7. What invariants must hold before a successor module becomes current?
