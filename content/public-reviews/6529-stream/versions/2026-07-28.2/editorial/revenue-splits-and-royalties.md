# Revenue, splits, and royalties

Stream's revenue system is meant to answer a simple but demanding question:
after a sale receives value, who is entitled to every unit of it? The answer may
include an artist, collaborator, poster, protocol, curator, institution, or
estate. It also has to survive rounding, failed recipients, refunds, contract
replacement, and emergency recovery.

Writing down percentages is the easy part. The real work is proving which
profile applied, recording each entitlement once, keeping every credit backed,
and describing royalties without promising enforcement that ERC-2981, the
marketplace royalty-reporting standard, does not provide.

## Intended 6529 Network launch split

The proposed Network program would send **75% of primary-sale proceeds to the
artist and 25% to the Network**. That is an intended deployment policy, not a
hardcoded invariant of the reviewed Solidity.

The current
[Drop](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L168-L177)
and
[Auction](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L141-L150)
source supports contract-, collection-, and token-level proceeds rules with
poster, protocol, and curator buckets. Its constructor default is 50% poster,
25% protocol, and 25% curator, so a 75/25 launch requires an explicit
configuration in both the Drop and Auction stores—for example 75% poster, 25%
protocol, and 0% curator—or a documented allocation of the Network share. The
75% bucket goes to the `poster` address in the signed authorization; the
contracts do not prove that `poster` is the Core collection artist. Likewise,
configuration alone does not prove that the protocol payout address belongs to
the Network. A separate
[v1 target
specification](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/revenue-splits-and-royalties.md#L1572-L1584)
currently describes 90% artist and 10% protocol, so that document and the new
75/25 product intent must also be reconciled. Before launch, candidate evidence
must read back both sale-lane configurations and bind the poster, protocol, and
curator recipients to the intended artist and Network identities.

In the current auction path, those percentages are not signed or snapshotted
when the auction is registered. Settlement reads the then-current token-,
collection-, or contract-level split, and an authorized admin can change or
clear those settings during an active auction. A credible 75/25 launch promise
therefore requires the settlement split to be pinned, or an explicitly
disclosed governance restriction and verification process that prevents
configuration drift through settlement.

## Two source-described money paths, and which one is wired

These are alternative paths in the pinned source, not one reconciled accounting
system. In the present rehearsal, signed Drops and Auctions use their own
native-ETH credit accounting. The rehearsal also deploys the separate resolver,
split-wallet, asset-policy, and settlement foundation, but those sale paths do
not call it and no settlement caller is configured. [Current Implementation and
Readiness](./security-testing-and-known-limitations) records that exact wiring.

For the native-ETH Drop and Auction paths described in this review, value moves
in this order:

1. A fixed-price mint or auction settlement receives ETH.
2. The sale contract selects a token-specific, collection, or default proceeds
   rule, in that priority order.
3. It records local credits for the relevant poster, protocol, curator reserve,
   or bidder instead of paying arbitrary recipients inline.
4. Each recipient withdraws its credit separately.
5. Emergency recovery may reach only balance that is not owed to anyone.
6. Public reads and events should let another person reconstruct the full path.

The separate foundation is designed to choose an approved asset and economic
profile, ensure one sale is settled once, route its value to a split wallet with
a predictable address, and let recipients withdraw. It is implemented in source,
but it is not the accounting path used by the rehearsed Drop and Auction flow.

## Why the machinery exists

Sending every payment to one operator is smaller. It also asks artists,
collaborators, curators, collectors, and auditors to trust that operator to:

- apply the agreed split;
- keep enough funds for every claimant;
- handle recipients that cannot receive value;
- reconcile refunds, rounding, and residuals;
- preserve historical split identities;
- survive key loss, succession, or organizational change;
- describe secondary royalties honestly.

Stream moves those obligations into inspectable state. That is valuable only
when each invariant has one clear owner. Parallel routes that account for the
same kind of value must be deliberately reconciled, not celebrated as extra
features.

No contract can make a marketplace pay a reported royalty, prove that an
offchain curator allocation was fair, or guarantee that a recipient retains
its keys. The onchain machinery can make the selected rule, recorded
liabilities, withdrawals, residuals, and successor boundary inspectable.

## One wei should have one accountable path

Every sale should answer:

- Which sale created the value?
- Which asset and amount arrived?
- Which revenue rule won, and by what precedence?
- Which accounts became entitled?
- How did division and residual units work?
- Where is the value before withdrawal?
- Which liabilities are excluded from emergency recovery?
- Which reads and events reconstruct every later movement?

These are protocol invariants. A contract can compile while crediting the same
wei twice, omitting a liability from surplus, or selecting a different profile
at settlement from the one the artist approved.

## The native-ETH flow

Signed fixed-price ETH runs through `StreamDrops`; English-auction ETH runs
through `AuctionContract`. Each contract:

1. receives value through its own sale path;
2. checks token, collection, then contract-default split configuration;
3. calculates the poster, protocol, curator, and where applicable bidder
   liabilities;
4. stores those liabilities as local pull credits;
5. lets each claimant withdraw from that same contract.

`StreamDrops` creates poster, protocol, and curator-reserve credits.
`AuctionContract` creates poster, protocol, curator, and bidder credits.

Local pull credits and the resolver-and-settlement foundation are distinct
accounting paths. A release must select and fully specify one coherent route
rather than leave overlapping paths whose liabilities cannot be reconciled.

## Pull credits keep one recipient from blocking everyone

Paying every recipient during mint or settlement looks direct, but the entire
sale then depends on every recipient contract accepting the transfer.

Pull accounting records the entitlement first and moves value later. This
means:

- a recipient that rejects ETH does not block the sale;
- a failed withdrawal can leave the credit intact;
- state can be updated before the external call;
- liabilities stay visible between sale and withdrawal;
- a compatible alternate recipient can be used where permitted.

The complexity moves into explicit credit and solvency state. It does not
disappear. Credits plus reserves must never exceed the contract's held value.

There is no single protocol-wide credit ledger. Drop recipients withdraw
Drop-local credits, auction recipients and displaced bidders withdraw
Auction-local credits, and split-wallet recipients withdraw wallet-local
allocations after funding. Reviewers therefore need cross-contract solvency and
cutover evidence, not just isolated withdrawal tests.

## The settlement foundation flow

The separately deployed
[`StreamPrimarySaleSettlement.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamPrimarySaleSettlement.sol#L96-L145)
records and settles primary-sale value. Its intended sequence is:

1. an owner-approved settlement caller submits one typed settlement;
2. the settlement key binds the sale identity so it cannot be officially
   consumed twice;
3. the requested asset must be active in the asset-policy registry;
4. the revenue assignment resolves from the approved policy context;
5. value reaches the selected split wallet;
6. the settlement record becomes the public accounting identity for that sale.

A settlement record is intended to bind sale identity, token or collection
context, payer and other participants, asset, amount, revenue class, selected
profile or template, and policy context.

"Already paid" cannot safely live only in a private database. Retries,
successor callers, and alternate sale adapters must reach the same answer about
whether one sale identity has been consumed.

This foundation is designed to sit behind sale adapters. The status page owns
the exact candidate-wiring claim; the important accounting rule here is that
every adapter must reach the same answer about whether a sale identity has
already been settled.

## Resolution separates the sale from its economic policy

[`StreamRevenueResolver.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRevenueResolver.sol#L170-L279)
can select a token rule before a collection rule, and a collection rule before
defaults.

That creates a useful boundary:

- the sale adapter decides how and when a sale happens;
- the resolver decides which approved economic profile applies.

Without this separation, every sale type can duplicate split selection and
freeze semantics, then disagree about who should be paid. With it, precedence
and profile identity can be inspected once—provided every supported sale
actually uses it.

An artist needs to see the selected assignment, every higher-priority override,
whether the assignment can still change, and when it becomes fixed. A label
such as "artist split" is not enough when token, collection, and default rules
can compete.

A narrow validation-adapter design can extend this boundary without adding a
second state owner. Such an adapter would own no state, authority, roles, funds,
or normative events. Resolver writes would fail closed when exact validation
could not complete, while Core royalty reads would use resolver storage and
pure computation rather than call the adapter. The registered resolver would
remain the only state owner, writer, Core royalty pointer target, and normative
event source.

## Immutable split profiles make collaboration inspectable

A split profile identifies recipients and shares.
[`StreamSplitFactory`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamSplitFactory.sol)
canonicalizes the profile and can deploy its
[`StreamSplitWallet`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamSplitWallet.sol)
at a deterministic address.

The profile itself is immutable. To change participants or shares, the system
creates a new profile and changes the resolver assignment subject to its
mutability and freeze rules. The old profile keeps its meaning and the boundary
of the change stays visible.

Reviewers should verify that:

- every recipient is valid;
- shares total the exact denominator;
- duplicate recipients are rejected or combined deterministically;
- canonical ordering produces one profile identity;
- the expected wallet address cannot deploy different code;
- the wallet's stored entries match its profile;
- profile changes have an explicit effective boundary;
- artists can inspect exact recipients and shares before approval.

A spreadsheet expresses the same percentages with less Solidity. It does not
prove which profile a sale used, preserve historical identity, or let a
recipient withdraw without trusting its operator.

## Approved ERC-20 settlement is deliberately strict

The settlement foundation accepts only asset contracts marked active in the
deployment-wide
[`StreamAssetPolicyRegistry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamAssetPolicyRegistry.sol#L7-L83).
Unknown, inactive, deprecated, or unsupported assets fail closed. Each policy
decision includes an evidence hash and effective timestamp.

Settlement requires a successful boolean-returning transfer and exact
before-and-after balances for the payer, settlement contract, and split wallet.
The
[`StreamPrimarySaleSettlement`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamPrimarySaleSettlement.sol#L124-L145)
path rejects:

- missing or false return values;
- fee-on-transfer behavior;
- no-op transfers;
- failed balance reads;
- unexpected balance changes.

The pinned
[`settlement tests`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/test/StreamPrimarySaleSettlement.t.sol#L778-L1043)
exercise the supported standard-token path and these rejection cases.

ERC-20 contracts do not all behave alike. A bare `transferFrom` can record more
value than arrived, accept a meaningless return, or expose recipient
accounting to token-specific behavior. The actual registry state—not a
frontend allowlist—defines the accepted assets.

## A payer-bound token sale needs a separate authorization

A safer token-sale architecture separates:

1. a sale adapter that verifies a payer-signed `PaymentIntent` and is the only
   protocol contract allowed to use the payer's allowance;
2. `StreamPrimarySaleSettlement`, which resolves policy, consumes the
   settlement key, routes value, and records the official settlement without
   pulling from the payer.

This would bind one token payment to one sale and keep allowance authority out
of the accounting recorder. Its exact payment fields, signer-scoped replay,
revocation, escrow fallback, and top-level orchestration still need a complete
design. See
[`ADR 0019`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0019-payment-intent-orchestration.md#L3-L82).

## Rounding and surplus have owners

Integer division can leave residual units. The contract and public economic
statement should identify the denominator, rounding direction, residual owner,
whether dust accumulates, how it can be withdrawn, and whether repeated small
payments bias one participant.

"Approximately" is not a split rule. Tiny residuals become material across
many payments, and an unspecified owner becomes an emergency-recovery dispute.

For every ETH-holding path, reviewers should also prove:

- `msg.value` matches the required amount;
- value is never allocated twice;
- credits and reserves remain backed;
- forced ETH does not create a false liability;
- failed withdrawals preserve entitlement;
- emergency recovery uses balance minus liabilities.

A contract's balance says how much ETH it holds, not how much it owns.

## Curator rewards bind an external allocation to onchain claims

Drop and Auction create curator-reserve credits for the configured
`StreamCuratorsPool`. An authorized release moves the reserve to the pool. The
pool publishes a collection Merkle root and uses pull credits for claims.

The proof shows that a claimant belongs to the committed allocation without
storing every leaf. It does not prove that the offchain process which built the
root was fair or used correct inputs.

Reviewers should establish who builds and publishes the root, which data and
policy version it represents, whether it can be replaced, how claims prevent
replay, how proofs are encoded, what happens to unclaimed value, and whether
anyone can reproduce and contest the allocation.

The commitment makes an external decision inspectable; it does not make the
decision onchain.

## ERC-2981 reports royalties; it does not enforce them

At the pinned commit, Core's
[`royaltyInfo`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L1013-L1027)
returns:

- receiver `0xC8ed02aFEBD9aCB14c33B5330c803feacAF01377`;
- `690` basis points out of `10,000`;
- `salePrice * 690 / 10_000`;
- the same answer for arbitrary token IDs;
- no runtime setter or per-token override.

Core does not call `StreamRevenueResolver` for this read.

ERC-2981 tells a marketplace what the contract reports. It cannot compel
payment. Honest product language is "royalty information" or "royalty signal,"
not "guaranteed royalty." Transfer-restricting enforcement would be a
different protocol and collector tradeoff.

## Every value movement should be reconstructable

Public reads and events should let an independent reviewer rebuild:

- sale identity and gross value;
- selected assignment and precedence;
- split profile and every allocation;
- every credit and withdrawal;
- curator reserve, root, and claims;
- royalty configuration;
- rounding residuals;
- emergency or surplus movements.

If reconstruction needs a private database, the public accounting record is
incomplete.

## What can still fail

- Native-sale accounting and the separate foundation remain ambiguous parallel
  paths.
- The wrong token, collection, or default profile wins precedence.
- A sale or settlement key is consumed twice.
- Shares or rounding allocate the wrong amount.
- Liabilities exceed held value or emergency recovery withdraws reserved funds.
- A fee-on-transfer or other nonstandard asset creates a false record.
- A split wallet's code or stored profile differs from its expected identity.
- A curator root is valid but built from wrong inputs.
- Successor cutover duplicates or abandons credits.
- A marketplace ignores ERC-2981.

## Questions for reviewers

1. Should genesis retain the current local native-sale accounting, or connect
   every sale to the resolver and settlement foundation?
2. Can artists see exactly which assignment wins before approving a sale?
3. When should a split or royalty assignment become immutable?
4. Which assets belong in the initial onchain asset policy?
5. Who receives rounding residuals, and can repeated dust create bias?
6. Can aggregate liabilities be proven across every value-holding contract?
7. Is the curator-root process reproducible and contestable?
8. What continuity proof is required before a successor can inherit accounting
   duties?
9. Is every public royalty statement explicit that ERC-2981 does not compel
   marketplace payment?
