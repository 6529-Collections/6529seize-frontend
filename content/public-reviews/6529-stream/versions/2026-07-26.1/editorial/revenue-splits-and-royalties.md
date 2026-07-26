# Revenue, splits, and royalties

This repository contains several accounting systems. They must not be read as
one end-to-end pipeline.

## Which value path exists today?

| Value path                                      | Evidence status                       | Current behavior                                                                                                                                        |
| ----------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Signed fixed-price ETH                          | **CURRENTLY WIRED BASELINE**          | `StreamDrops` applies its own token, collection, or contract-default BPS split and creates poster, protocol, and curator-reserve credits.               |
| English-auction ETH                             | **CURRENTLY WIRED BASELINE**          | The Auction contract applies its own token, collection, or contract-default BPS split and creates poster, protocol, curator, and bidder credits.        |
| Resolver, split wallets, and primary settlement | **SEPARATELY DEPLOYED FOUNDATION**    | The rehearsal deploys these contracts, but the native Drop and Auction paths do not call them and the rehearsal does not configure a settlement caller. |
| ERC-20 payer-bound sale orchestration           | **PROPOSED**                          | The current settlement foundation can pull approved ERC-20s, but the required PaymentIntent verifier and top-level sale adapter do not exist.           |
| ERC-2981 royalty information                    | **CURRENTLY WIRED BASELINE**          | Core returns one fixed receiver and 690 basis points for every token. It does not call the current resolver.                                            |
| Resolver-backed royalty architecture            | **ACCEPTED TARGET - NOT IMPLEMENTED** | The accepted target keeps royalty policy in a replaceable resolver with a bounded validation adapter.                                                   |

The rehearsal construction and wiring are visible in
[`RehearseDeployment.s.sol`](https://github.com/6529-Collections/6529Stream/blob/2c666e16294401ab8f874a23d784dac074ecab73/script/RehearseDeployment.s.sol#L218-L269).

## Primary-sale settlement

### SEPARATELY DEPLOYED FOUNDATION

[`StreamPrimarySaleSettlement.sol`](https://github.com/6529-Collections/6529Stream/blob/2c666e16294401ab8f874a23d784dac074ecab73/smart-contracts/StreamPrimarySaleSettlement.sol#L96-L145)
records and settles primary-sale value. Settlement uses replay protection so one
sale cannot be credited twice.

The settlement record should bind the sale, token or collection context,
currency, amount, and chosen revenue profile. A typed, unique settlement key is
an accounting invariant, not an implementation detail.

This contract is not the current signed Drop or Auction settlement route. It
accepts only owner-approved settlement callers, and the rehearsal does not
approve one. Its presence and tests prove a foundation, not a supported
collector-to-mint flow.

## Revenue resolution

### SEPARATELY DEPLOYED FOUNDATION

[`StreamRevenueResolver.sol`](https://github.com/6529-Collections/6529Stream/blob/2c666e16294401ab8f874a23d784dac074ecab73/smart-contracts/StreamRevenueResolver.sol#L170-L279)
can resolve configuration at several levels. A token-specific rule can take
precedence over collection configuration, which can take precedence over
defaults.

That precedence applies when a caller uses this resolver foundation. It is not
the current native Drop/Auction split lookup. Before a resolver-backed sale is
supported, the precedence, selected assignment, mutability, and freeze state
must be visible to artists.

### ACCEPTED TARGET - NOT IMPLEMENTED

The linked resolver is the implementation present at the reviewed commit. It
is not the accepted target architecture. The accepted architecture keeps one
registered, state-owning `StreamRevenueResolver` as the sole Core royalty
pointer target and adds one immutable, stateless, unregistered,
implementation-private validation adapter.

The adapter owns no state, authority, roles, funds, or events. The resolver
still authenticates every request, applies every state change, and emits every
event. The Core-facing royalty read uses only resolver storage and pure
computation; it never calls the adapter or any other external contract.

That target is accepted for pre-genesis implementation, but it is not
implemented here. Resolver and adapter source work remains blocked until the
complete normative interface appendix and freeze commit are independently
approved.

## Split profiles

A split profile defines recipients and shares. The protocol can use a factory to
create deterministic split wallets for a profile. These wallets belong to the
separate resolver/settlement foundation; the current Drop and Auction contracts
do not route their native proceeds through them.

Relevant sources:

- [`StreamSplitFactory.sol`](https://github.com/6529-Collections/6529Stream/blob/2c666e16294401ab8f874a23d784dac074ecab73/smart-contracts/StreamSplitFactory.sol)
- [`StreamSplitWallet.sol`](https://github.com/6529-Collections/6529Stream/blob/2c666e16294401ab8f874a23d784dac074ecab73/smart-contracts/StreamSplitWallet.sol)

### REVIEW REQUIREMENTS

- recipient addresses are validated;
- shares add to the required denominator;
- duplicate recipients are rejected or combined deterministically;
- the wallet address cannot be confused across profiles;
- deployment cannot be front-run into different code;
- profile changes have an explicit effective time;
- the artist can inspect the exact profile before approval.

## Pull withdrawals

### SOURCE IMPLEMENTED

Pull withdrawals exist in several contracts, but there is no single protocol
credit ledger. Fixed-price recipients withdraw Drop-local credits. Auction
recipients and displaced bidders withdraw Auction-local credits. Split-wallet
recipients withdraw wallet-local allocations after a supported settlement has
funded that wallet.

Pull payments improve composability but do not remove risk. The contract must
keep separate liabilities for every account and currency, update state safely
before transfer, and preserve a recovery path for accounts that cannot receive
the asset.

## ETH accounting

For native ETH, reviewers should check:

- `msg.value` equals the required amount;
- the same wei is never allocated twice;
- credits plus reserves never exceed held balance;
- rounding residuals have an explicit owner;
- emergency withdrawal uses balance minus liabilities;
- failed withdrawals retain the recipient's credit;
- no forced ETH changes internal accounting assumptions.

## ERC-20 accounting

### SEPARATELY DEPLOYED FOUNDATION

The standalone settlement foundation accepts only contract addresses whose
deployment-wide onchain
[`StreamAssetPolicyRegistry`](https://github.com/6529-Collections/6529Stream/blob/2c666e16294401ab8f874a23d784dac074ecab73/smart-contracts/StreamAssetPolicyRegistry.sol#L7-L83)
status is `ACTIVE`. Unknown, inactive, deprecated, and unsupported assets fail
closed. The registry stores an evidence hash and effective timestamp for each
policy decision, and its owner controls status changes.

Settlement then requires a successful boolean-returning transfer and verifies
exact before-and-after balance changes for the payer, settlement adapter, and
split wallet. The
[`StreamPrimarySaleSettlement`](https://github.com/6529-Collections/6529Stream/blob/2c666e16294401ab8f874a23d784dac074ecab73/smart-contracts/StreamPrimarySaleSettlement.sol#L124-L145)
path rejects a missing or false return value, fee-on-transfer behavior, no-op
transfers, failed balance reads, and wrong balance deltas. The pinned
[`settlement tests`](https://github.com/6529-Collections/6529Stream/blob/2c666e16294401ab8f874a23d784dac074ecab73/test/StreamPrimarySaleSettlement.t.sol#L778-L1043)
exercise the active standard-token path and those rejection cases.

The accepted token set is deployment configuration, not a hardcoded list.
Reviewers must inspect the configured registry state before launch. A UI
allowlist alone would not be an onchain accounting control.

### PROPOSED - PAYER-BOUND ORCHESTRATION

This ERC-20 function is not a conforming genesis sale path. It currently acts as
both official revenue recorder and the contract that calls `transferFrom` on
the payer. The target architecture assigns those powers to two contracts:

1. contract 20 verifies a payer-bound `PaymentIntent` and is the only protocol
   allowance-pull initiator;
2. contract 9 resolves revenue, consumes the settlement key, routes value, and
   records official settlement without pulling the payer.

No contract 20 implementation exists. The foundation also lacks PaymentIntent
signature verification, signer-scoped replay, revocation, revenue-escrow
fallback, and top-level sale-adapter orchestration. This is a proposed design,
not a supported token-denominated sale. See
[`ADR 0019`](https://github.com/6529-Collections/6529Stream/blob/2c666e16294401ab8f874a23d784dac074ecab73/docs/adr/0019-payment-intent-orchestration.md#L3-L82).

## Rounding and dust

Integer division can leave residual units. The contract and public explanation
should state:

- the denominator;
- rounding direction;
- who receives dust;
- whether dust accumulates;
- how it is withdrawn;
- whether repeated small settlements create a material bias.

“Approximately” is not acceptable for an onchain split.

## Curator rewards

### CURRENTLY WIRED BASELINE

The current Drop and Auction contracts create curator-reserve credits for the
configured `StreamCuratorsPool` address. An authorized release moves the reserve
to that pool. The pool uses collection Merkle roots and pull credits for
individual curator claims. This lane does not pass through the revenue resolver.
A root commits to a set of claims; a claimant supplies a proof.

Reviewers should verify:

- who constructs and publishes the root;
- what input data it represents;
- whether the root can be replaced;
- claim replay protection;
- unclaimed balance policy;
- proof encoding;
- public reproducibility of the allocation.

A valid Merkle proof shows membership in a root. It does not prove the offchain
allocation used to build the root was fair.

## ERC-2981 royalties

### IMPLEMENTED

The Core exposes ERC-2981 royalty information through `royaltyInfo`. At this
commit it ignores token-specific revenue profiles and returns:

- fixed receiver `0xC8ed02aFEBD9aCB14c33B5330c803feacAF01377`;
- fixed rate `690` basis points out of `10,000`;
- amount `salePrice * 690 / 10_000`;
- the same answer for arbitrary token IDs;
- no runtime royalty setter and no per-token override.

The exact implementation is
[`StreamCore.royaltyInfo`](https://github.com/6529-Collections/6529Stream/blob/2c666e16294401ab8f874a23d784dac074ecab73/smart-contracts/StreamCore.sol#L1013-L1027).
The current Core does not call `StreamRevenueResolver` for this read.

### IMPORTANT LIMITATION

ERC-2981 tells a caller what royalty recipient and amount the contract reports.
It does not compel a marketplace to pay. Secondary royalty enforcement remains
a marketplace and ecosystem question unless a transfer restriction or other
mechanism explicitly changes that fact.

The public site should say “royalty information” or “royalty signal,” not
“guaranteed royalty.”

## Emergency and surplus boundaries

Every contract holding value needs a precise liability definition. An
authorized emergency call may recover true surplus. It must not withdraw:

- seller proceeds;
- artist or collaborator splits;
- curator allocations;
- bidder refunds;
- active bids;
- randomness provider reserves;
- any other credited balance.

The same rule must hold across ETH and every supported token.

## Event reconstructability

An auditor should be able to rebuild:

- sale identity and gross value;
- selected revenue profile;
- each allocation;
- every credit;
- every withdrawal;
- curator root and claims;
- royalty configuration changes;
- residual and emergency movements.

If reconstruction requires a private database, the public accounting record is
incomplete.

## Known architecture gap

### KNOWN LIMITATION

The repository records a unified protocol-wide ledger as future work. Existing
fixed-price, auction, curator, and split-wallet accounting is implemented, but
the absence of a single ledger increases the importance of cross-contract
solvency tests and aggregate evidence.

## What we think

Artists should approve a human-readable revenue statement before a sale:
recipients, percentages, precedence, currencies, curator allocation, rounding,
withdrawal behavior, and royalty limitations. The statement should link to the
exact profile and settlement code.

## What can fail

- the wrong profile wins precedence;
- a replay credits a sale twice;
- a split denominator or rounding rule is wrong;
- liabilities become unbacked;
- a fee-on-transfer token produces less value than recorded;
- an emergency call withdraws reserved funds;
- a curator root is valid but built from incorrect inputs;
- a marketplace ignores ERC-2981.

## Questions for reviewers

1. Is revenue precedence understandable before a collector pays?
2. Should split profiles become immutable at mint, sale, or finality?
3. Which currencies belong in the initial supported policy?
4. Who receives rounding residuals?
5. Can total liabilities be proven across all holding contracts?
6. Is the curator-root process reproducible and contestable?
7. Is the royalty language honest about marketplace enforcement?
