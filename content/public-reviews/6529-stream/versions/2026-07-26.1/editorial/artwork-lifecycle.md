# Artwork lifecycle

This page follows one collection from creation to terminal finality. The purpose
is to show where authority changes hands, which records become durable, and
where a failed external service can stop progress.

## 1. A collection record is created

### IMPLEMENTED

An authorized caller creates a collection in
[`StreamCore.createCollection`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamCore.sol#L336).
The Core assigns the collection identity and stores the artist address, supply
information, and other collection state. Collection data is then set through
[`setCollectionData`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamCore.sol#L379).

Creating the record does not mean minting has opened. Sale authorization, mint
phases, executors, metadata, randomness, and economic configuration are separate
pieces.

## 2. Artwork and execution inputs are assembled

The artist-facing inputs may include collection information, scripts, token
data, images, attributes, dependency versions, a metadata mode, a randomness
provider, supply limits, sale configuration, and revenue recipients. Different
modules own different pieces.

### KNOWN LIMITATION

The existence of a field in the protocol does not tell a reviewer who should be
allowed to set it. The Roles and Trust page therefore treats every mutation as a
separate permission question. Record-family checks are implemented in source,
but the candidate's exact record-type admissions, live writer providers, grants,
runtime code hashes, and rotation evidence remain unavailable.

## 3. The artist can approve a particular state

### IMPLEMENTED

The current artist-approval mechanism supports signatures from ordinary
accounts and ERC-1271 contract wallets. Its EIP-712 domain binds the chain and
Core. The signed state binds the artist address, collection-freeze manifest
hash, maximum collection purchases, total supply, and final-supply delay. It
does not generically sign every satellite record or future finality action.

An approval is evidence that the artist approved those exact fields. If a bound
field later changes, the earlier approval no longer describes the current
state. The typed fields are defined in
[`StreamArtistApprovals`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamArtistApprovals.sol#L8-L21)
and assembled from current Core state in
[`_hashArtistApproval`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamCore.sol#L1631-L1639).

### IMPORTANT DISTINCTION

This is not a general artist veto over all administrative actions. The current
Core freeze path is an authorized administrative call and does not itself demand
a fresh artist signature. Whether that is the desired final rule is a review
question.

## 4. The source contains two mint lanes

### CURRENTLY WIRED BASELINE

The current signed Drop lane is:

1. `StreamDrops` checks the signed authorization and calls `StreamMinter`;
2. `StreamMinter` checks its own mint pause, collection time window, and supply;
3. `StreamMinter` calls the legacy `StreamCore.mint` entry.

[`StreamDrops._executeFixedPriceDrop`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamDrops.sol#L609-L632)
shows that call. The legacy minter path is visible in
[`StreamMinter.mint`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamMinter.sol#L130-L175).

### SEPARATELY DEPLOYED FOUNDATION

[`StreamMintManager`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamMintManager.sol)
defines phases, executors, optional gates, time windows, supply constraints, and
counter policies. The durable
[`StreamMintLedger`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamMintLedger.sol)
tracks usage across wallets, recipients, tokens, and contexts.

The rehearsal connects this manager to Core and makes it a ledger writer, but it
passes the legacy minter to `StreamDrops`. The two lanes are both present; they
are not one end-to-end signed-sale path. The exact construction and wiring are
visible in
[`RehearseDeployment.s.sol`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/script/RehearseDeployment.s.sol#L218-L269).

## 5. A sale is authorized

### IMPLEMENTED

For a 6529 drop, an offchain service prepares an EIP-712 authorization. The
authorization binds the intended action to values such as chain, verifying
contract, signer epoch, collection, payer, recipient, quantity, price, deadline,
sale mode, and a replay-prevention identifier. The configured signer signs that
payload. Solidity verifies the signature; Solidity does not calculate TDH or
select the work.

An authorization can drive a fixed-price execution or register an auction,
depending on its sale mode.

## 6. The selected mint lane executes

### SOURCE IMPLEMENTED

The manager lane validates the active phase, gate, policy hash, and counters,
then performs a same-transaction prepared mint. Its current source calls:

- [`prepareMintFromManager`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamCore.sol#L492-L518)
- [`completePreparedMintFromManager`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamCore.sol#L520-L550)

[`StreamMintManager.mintPrepared`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamMintManager.sol#L241-L299)
consumes counters and calls those entries atomically. A revert unwinds the whole
transaction. Core also exposes a manager-only
[`abortPreparedMintFromManager`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamCore.sol#L545-L569)
hook that rolls back the last allocation. The current manager implementation
does not call that hook in `mintPrepared`; its prepare and complete calls are
made in the same transaction. The current signed Drop lane does not call these
functions; it uses `StreamCore.mint`.

### TESTED

Tests exercise each lane's success and failure behavior. They do not establish a
signed-Drop-to-MintManager integration that the rehearsal does not contain.
Reviewers should trace the exact caller and Core entry for every supported
genesis sale profile.

## 7. The token receives a permanent identity

The Core allocates a globally sequential token ID and records the collection ID
and collection-local serial. Supply is accounted as minted-ever, not merely the
number of tokens currently held.

Burning a token does not make its identifier reusable.

## 8. Randomness enters a lifecycle

If the collection requires randomness, minting creates a request bound to the
token, collection, provider, and provider epoch. The provider may fulfill it,
the post-processing step may fail, the request may be retried, or it may become
stale.

### FAILURE BEHAVIOR

- A pending live-token request can prevent metadata finality.
- A failed post-processing step can be retried only within the configured
  bounds.
- Provider migration is constrained while requests are pending.
- Burning before fulfillment follows its own recorded path; it is not treated
  as an ordinary live token.

The Randomness page covers these states in detail.

## 9. Metadata becomes available

`tokenURI` is produced from the collection's configured metadata mode and
current token state. The renderer may use stored scripts, token data, dependency
versions, images, attributes, and randomness output.

“Available” and “final” are different. Metadata may be pending while randomness
is unresolved. A later freeze can block mutations, but a frozen content hash
still requires the corresponding bytes and execution environment to remain
available.

## 10. Money follows one of several accounting lanes

### CURRENTLY WIRED BASELINE

A paid fixed-price Drop keeps poster, protocol, and curator-reserve credits
inside `StreamDrops`. It selects a token-level split first, then a
collection-level split, then the contract default. The auction contract keeps a
separate set of poster, protocol, curator, and bidder credits. These balances
use pull withdrawals and must remain backed.

The fixed-price accounting is in
[`StreamDrops`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamDrops.sol#L542-L558)
and
[`_creditFixedPriceProceeds`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamDrops.sol#L635-L680).
Auction proceeds are credited by
[`AuctionContract._creditAuctionProceeds`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/AuctionContract.sol#L471-L508).

### SEPARATELY DEPLOYED FOUNDATION

`StreamRevenueResolver`, `StreamSplitFactory`, `StreamSplitWallet`, and
`StreamPrimarySaleSettlement` implement a different foundation that can resolve
token, collection, and default revenue assignments. The rehearsal deploys those
contracts, but the native Drop and Auction paths above do not call them.

## 11. A token may be burned

### IMPLEMENTED

[`StreamCore.burn`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamCore.sol#L631)
destroys the live ERC-721 ownership record. Normal `tokenURI` behavior no longer
applies, but the protocol retains audit information about the burned token.

### OPEN FOR FEEDBACK

Reviewers should decide which metadata and provenance facts must remain
reconstructable after burn, and whether retaining those facts creates any
privacy or storage concerns.

## 12. Supply is finalized

The collection can record final supply only after the relevant rules and delay
have been satisfied. Final supply is one prerequisite for stronger terminal
actions; it is not the same operation as freezing all collection metadata.

## 13. The Core collection is frozen

### IMPLEMENTED

[`freezeCollection`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamCore.sol#L827)
checks collection existence, required data, timing, supply, and pending metadata
conditions. It records a freeze manifest commitment and permanently rejects the
Core mutations covered by that freeze.

### IMPORTANT DISTINCTION

Core freeze is not the same as the Artwork Finality Registry's terminal
finality. Preservation records, component manifests, governance schedules, and
guardian powers live outside the Core freeze itself.

## 14. Artwork finality is scheduled and executed

### IMPLEMENTED

[`StreamArtworkFinalityRegistry`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamArtworkFinalityRegistry.sol)
supports a delayed finality process with scheduling, execution windows,
cancellation or veto paths, component manifests, and terminal state.

The delay is meant to create a visible ceremony rather than a surprise
irreversible call. It also creates an operational obligation: participants must
watch the schedule, verify the manifest, and act within the allowed window.

## 15. Successor modules may take over replaceable duties

The long-term design records module identity, code hashes, interfaces, status,
and successor relationships. A successor does not rewrite token history in the
Core. It changes which replaceable module is recognized for a future duty.

The critical review question is not merely “can this module be upgraded?” It is:
who can register the successor, under what delay, with what evidence, and which
old commitments remain binding?

## What we think

The lifecycle should be understandable without reading transaction traces. A
collector should be able to tell whether a token is pending randomness, whether
metadata is final, whether supply is final, whether the Core is frozen, and
whether terminal artwork finality has occurred. These states should never be
collapsed into one “immutable” badge.

## What can fail

- a signed authorization can be wrong, stolen, stale, or operationally
  mis-issued;
- a mint can fail between preparation and completion;
- an external gate or token can behave unexpectedly;
- a randomness provider can delay, fail, or violate its assumptions;
- content can be correctly hashed but unavailable;
- funds can be credited incorrectly or become hard to withdraw;
- an authorized administrator can act within powers the community did not
  intend;
- a finality ceremony can use the wrong manifest or go unobserved.

## Questions for reviewers

1. Which state transitions need an artist signature in addition to governance?
2. Which failures should automatically abort, and which should enter a
   recoverable pending state?
3. Are Core freeze and artwork finality separated clearly enough?
4. Which burn records must remain readable forever?
5. What evidence must be published before a terminal finality action can be
   scheduled?
