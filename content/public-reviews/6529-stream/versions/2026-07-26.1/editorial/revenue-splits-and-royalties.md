# Revenue, splits, and royalties

This page follows value from a primary sale into credits, revenue resolution,
split wallets, curator claims, withdrawals, and royalty information.

## Primary-sale settlement

### IMPLEMENTED

[`StreamPrimarySaleSettlement.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamPrimarySaleSettlement.sol)
records and settles primary-sale value. Settlement uses replay protection so one
sale cannot be credited twice.

The settlement record should bind the sale, token or collection context,
currency, amount, and chosen revenue profile. A typed, unique settlement key is
an accounting invariant, not an implementation detail.

## Revenue resolution

### IMPLEMENTED

[`StreamRevenueResolver.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamRevenueResolver.sol)
can resolve configuration at several levels. A token-specific rule can take
precedence over collection configuration, which can take precedence over
defaults.

The precedence order must be visible to artists before a sale. Two valid
profiles are not helpful if the artist cannot tell which one will win.

## Split profiles

A split profile defines recipients and shares. The protocol can use a factory to
create deterministic split wallets for a profile.

Relevant sources:

- [`StreamSplitFactory.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamSplitFactory.sol)
- [`StreamSplitWallet.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamSplitWallet.sol)

### REVIEW REQUIREMENTS

- recipient addresses are validated;
- shares add to the required denominator;
- duplicate recipients are rejected or combined deterministically;
- the wallet address cannot be confused across profiles;
- deployment cannot be front-run into different code;
- profile changes have an explicit effective time;
- the artist can inspect the exact profile before approval.

## Pull withdrawals

### IMPLEMENTED

Recipients withdraw credited balances instead of requiring every sale to push
funds through an arbitrary recipient fallback.

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

### IMPLEMENTED WITH CONSTRAINTS

The current settlement path accepts only contract addresses whose
deployment-wide onchain
[`StreamAssetPolicyRegistry`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamAssetPolicyRegistry.sol#L7-L83)
status is `ACTIVE`. Unknown, inactive, deprecated, and unsupported assets fail
closed. The registry stores an evidence hash and effective timestamp for each
policy decision, and its owner controls status changes.

Settlement then requires a successful boolean-returning transfer and verifies
exact before-and-after balance changes for the payer, settlement adapter, and
split wallet. The
[`StreamPrimarySaleSettlement`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamPrimarySaleSettlement.sol#L124-L145)
path rejects a missing or false return value, fee-on-transfer behavior, no-op
transfers, failed balance reads, and wrong balance deltas. The pinned
[`settlement tests`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/test/StreamPrimarySaleSettlement.t.sol#L778-L1043)
exercise the active standard-token path and those rejection cases.

The accepted token set is deployment configuration, not a hardcoded list.
Reviewers must inspect the configured registry state before launch. A UI
allowlist alone would not be an onchain accounting control.

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

### IMPLEMENTED

The drop/revenue system includes curator accounting and Merkle-style claim
roots. A root commits to a set of claims; a claimant supplies a proof.

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

The Core exposes ERC-2981 royalty information through `royaltyInfo`.

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
