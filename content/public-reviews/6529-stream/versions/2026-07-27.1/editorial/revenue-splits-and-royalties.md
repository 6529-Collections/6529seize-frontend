# Revenue, splits, and royalties

This review covers an incomplete, undeployed candidate; [Current Implementation and Readiness](./security-testing-and-known-limitations) is the authoritative record of what is connected, implemented, proposed, and still required.

Art sales often need to pay more than one person: an artist, collaborator,
poster, protocol, curator, institution, or estate. The hard problem is not
writing down percentages. It is ensuring that the sale selects the intended
profile, every unit of value is accounted for once, hostile recipients cannot
block everyone else, replacements do not lose liabilities, and collectors are
not promised royalties a marketplace can ignore.

Stream makes those questions explicit. A smaller contract can push all value to
one address, but then the split, withdrawal, reconciliation, and recovery
obligations move to that recipient or to a private accounting system.

## One wei should have one accountable path

Every sale path should answer:

- Which sale created the value?
- Which asset and amount were received?
- Which revenue rule was selected, and by what precedence?
- Which accounts became entitled?
- How were division and residual units handled?
- Where is the value held before withdrawal?
- Which liabilities must be excluded from emergency recovery?
- Which events and reads reconstruct every later movement?

These are protocol invariants, not accounting polish. If the same wei is
credited twice, a liability is omitted from surplus, or a profile changes
between approval and settlement, the contract can remain syntactically correct
while paying the wrong people.

## The current native-sale paths keep local accounting

At the pinned commit, signed fixed-price ETH runs through `StreamDrops`.
English-auction ETH runs through `AuctionContract`.

Each contract selects a local proceeds split in this order:

1. token-specific rule;
2. collection rule;
3. contract default.

The Drop contract creates poster, protocol, and curator-reserve credits. The
Auction contract creates poster, protocol, curator, and bidder credits. Both use
pull withdrawals rather than pushing arbitrary recipients during the mint,
bid, or settlement that created the liability.

This local accounting is the current sale behavior. It does not call the
repository's separate revenue resolver, primary-sale settlement contract, split
factory, or split wallets. The rehearsal deploys that wider foundation but does
not connect current native Drops and Auctions to it.

Parallel accounting systems are not a benefit by themselves. Before launch,
the design needs one deliberate answer: retain and fully specify the local
native paths, or integrate the resolver and settlement foundation without
leaving ambiguous duplicate routes.

## Pull credits keep one recipient from blocking everyone

Synchronous payment looks simple: calculate shares and call each recipient
during mint or settlement. It also puts the entire transaction at the mercy of
every recipient contract.

Pull accounting records an entitlement first and lets the recipient withdraw
later. That means:

- a recipient that rejects ETH does not block the sale;
- a failed withdrawal can preserve the credit;
- state can be updated before external transfer;
- liabilities remain visible between sale and withdrawal;
- a recipient can use an alternate compatible address where the contract
  permits it.

The complexity moves from a fragile chain of external calls into explicit
credit and solvency state. It does not disappear. Each value-holding contract
must still prove that credits plus reserves never exceed held value.

The current system has no single protocol-wide credit ledger. Fixed-price
recipients withdraw Drop-local credits, auction recipients and displaced
bidders withdraw Auction-local credits, and split-wallet recipients withdraw
wallet-local allocations after that wallet has been funded. Cross-contract
solvency evidence is therefore essential.

## The settlement foundation gives a sale one replay-safe identity

The separately deployed
[`StreamPrimarySaleSettlement.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamPrimarySaleSettlement.sol#L96-L145)
records and settles primary-sale value. It uses a typed settlement key so one
sale cannot be officially credited twice.

A settlement record is intended to bind:

- sale identity;
- token or collection context;
- payer and other participant context;
- asset;
- amount;
- revenue class;
- selected profile or template;
- policy context.

That binding matters because "already paid" cannot safely be a row in a private
database. A successor settlement caller, retried transaction, or alternate sale
adapter must reach the same answer about whether the value has already been
consumed.

This contract is a foundation, not a current collector-to-mint path. It accepts
only owner-approved settlement callers, and the rehearsal does not approve one.
Its source and tests show a settlement mechanism; they do not show that a
current signed sale uses it.

## Resolution separates policy from the sale mechanic

[`StreamRevenueResolver.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRevenueResolver.sol#L170-L279)
can resolve a revenue assignment at several levels. A token-specific rule can
take precedence over collection configuration, which can take precedence over
defaults.

This separation protects two different concerns:

- a sale adapter decides how and when a sale occurs;
- a revenue resolver decides which approved economic profile applies.

Without that boundary, every sale mechanic has to duplicate split selection and
freeze semantics. Different adapters can then disagree about who should be
paid. With a resolver, precedence and profile identity can be inspected once
and reused—provided every supported sale actually calls it.

Artists need to see the selected assignment, all higher-priority overrides,
whether the assignment can still change, and when it freezes. A generic label
such as "artist split" is not sufficient when token, collection, and default
rules can compete.

The resolver in the pinned source is not the complete accepted target. The
accepted design keeps one registered, state-owning resolver as the sole Core
royalty pointer target and adds one immutable, stateless,
implementation-private validation adapter. The adapter would hold no state,
authority, roles, funds, or normative events. Resolver writes would fail closed
if exact validation could not be completed, while Core royalty reads would use
resolver storage and pure computation rather than an external adapter call.

That validation-adapter target is accepted for pre-genesis work but is not
implemented at this commit. Complete normative interface approval,
implementation, integration, and deployment evidence remain separate work.

## Immutable split profiles make collaboration inspectable

A split profile defines recipients and shares. The
[`StreamSplitFactory`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamSplitFactory.sol)
canonicalizes a profile and can deploy its
[`StreamSplitWallet`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamSplitWallet.sol)
at a deterministic address.

The profile is immutable. Rather than changing the recipients inside an
existing profile, the system can create a new profile and update an assignment
under the resolver's mutability and freeze rules. That preserves what the old
profile meant and makes the change visible.

Reviewers should verify:

- every recipient address is valid;
- shares sum to the exact denominator;
- duplicate recipients are rejected or combined deterministically;
- canonical ordering produces one profile identity;
- the expected wallet address cannot deploy different code;
- a wallet proves that its stored entries match the profile;
- profile changes have an explicit effective boundary;
- artists can inspect the exact recipients and shares before approval.

A spreadsheet can express the same percentages with far less Solidity. It
cannot, by itself, prove which profile a sale used, preserve historical profile
identity, or let a recipient withdraw without trusting the spreadsheet
operator.

## Native ETH accounting must distinguish liabilities from surplus

For every ETH-holding path, reviewers should establish:

- `msg.value` matches the required amount;
- the same value is never allocated twice;
- credits and reserves remain backed;
- rounding residuals have a defined owner;
- forced ETH does not create a false liability;
- failed withdrawals preserve entitlement;
- emergency recovery uses balance minus liabilities.

The contract's balance answers how much ETH it holds. It does not answer how
much it owns.

## Approved ERC-20 support needs more than `transferFrom`

The separate settlement foundation accepts only asset contracts whose
deployment-wide
[`StreamAssetPolicyRegistry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamAssetPolicyRegistry.sol#L7-L83)
status is active. Unknown, inactive, deprecated, or unsupported assets fail
closed. The registry stores an evidence hash and effective timestamp for each
policy decision.

Settlement requires a successful boolean-returning transfer and checks the
exact before-and-after balances of the payer, settlement contract, and split
wallet. The
[`StreamPrimarySaleSettlement`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamPrimarySaleSettlement.sol#L124-L145)
path rejects:

- missing or false return values;
- fee-on-transfer behavior;
- no-op transfers;
- failed balance reads;
- unexpected balance deltas.

The pinned
[`settlement tests`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/test/StreamPrimarySaleSettlement.t.sol#L778-L1043)
exercise the supported standard-token path and those rejection cases.

This extra checking exists because ERC-20 contracts do not all behave like the
same asset. A simple `transferFrom` can record more value than arrived, accept a
token that returned no meaningful result, or expose recipient accounting to
token-specific behavior.

The accepted asset set is deployment configuration, not a hardcoded list.
Reviewers must inspect the actual registry state. A frontend allowlist alone is
not an onchain accounting control.

## Payer-bound token sales remain a proposal

The current ERC-20 settlement foundation can pull an approved token directly
from a payer. It is not a conforming genesis sale path.

The proposed architecture separates:

1. a primary-sale adapter that verifies a payer-signed `PaymentIntent` and is
   the only protocol contract allowed to use the payer's token allowance;
2. `StreamPrimarySaleSettlement`, which resolves revenue, consumes the
   settlement key, routes value, and records the official settlement without
   pulling the payer.

That separation is intended to bind one exact token payment to one exact sale
and keep allowance authority out of the accounting recorder. The final
`PaymentIntent` fields and verification contract do not exist in this
candidate. Signer-scoped replay, revocation, escrow fallback, and top-level sale
orchestration also remain unresolved. See
[`ADR 0019`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0019-payment-intent-orchestration.md#L3-L82).

## Rounding is an allocation decision

Integer division can leave residual units. The public economic statement and
contract behavior should say:

- the denominator;
- the rounding direction;
- which account receives residual units;
- whether dust accumulates;
- how it can be withdrawn;
- whether repeated small settlements bias one participant.

"Approximately" is not a safe split rule. Small residuals become material when
repeated across many payments, and an unspecified residual owner can turn into
an emergency-withdrawal dispute.

## Curator rewards connect onchain claims to offchain allocation

The current Drop and Auction contracts create curator-reserve credits for the
configured `StreamCuratorsPool`. An authorized release moves the reserve to the
pool. The pool uses a collection Merkle root and pull credits for individual
claims.

The Merkle proof protects membership in the committed allocation without
storing every leaf in the contract. It does not prove that the offchain process
which constructed the root was fair or used correct inputs.

Reviewers should establish:

- who constructs and publishes the root;
- which data and policy version it represents;
- whether and how a root can be replaced;
- claim replay protection;
- proof encoding;
- treatment of unclaimed value;
- public reproducibility and contestability.

This is another example where a cryptographic commitment makes an external
decision inspectable but does not make the decision itself onchain.

## ERC-2981 is royalty information, not enforcement

The Core implements ERC-2981 `royaltyInfo`. At the pinned commit it returns:

- receiver `0xC8ed02aFEBD9aCB14c33B5330c803feacAF01377`;
- `690` basis points out of `10,000`;
- amount `salePrice * 690 / 10_000`;
- the same result for arbitrary token IDs;
- no runtime setter or per-token override.

See
[`StreamCore.royaltyInfo`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L1013-L1027).
The current Core does not call `StreamRevenueResolver` for this read.

ERC-2981 tells a caller which royalty recipient and amount the contract
reports. It cannot force a marketplace to pay. The honest terms are "royalty
information" or "royalty signal," not "guaranteed royalty."

Transfer-restricting enforcement would be a different protocol and collector
tradeoff. Stream should not imply that a display standard supplies enforcement
it does not contain.

## Every value movement should be reconstructable

Public reads and events should let an independent reviewer rebuild:

- sale identity and gross value;
- selected revenue assignment and precedence;
- split profile and every allocation;
- every credit and withdrawal;
- curator reserve, root, and claims;
- royalty configuration;
- rounding residuals;
- emergency or surplus movements.

If complete reconstruction requires a private database, the public accounting
record is incomplete.

## What a simpler design would externalize

Sending all proceeds to one operator makes the contracts smaller. It also asks
artists, collaborators, curators, collectors, and auditors to trust that
operator to:

- apply the agreed split;
- retain enough funds for every claimant;
- handle failed recipients;
- reconcile refunds and residuals;
- preserve historical profiles;
- survive key loss, succession, and organizational change;
- report secondary royalty limitations honestly.

Stream's split and accounting machinery exists to make those responsibilities
durable and inspectable. The system should still remove duplicated paths and
give each invariant one owner. Simplification is valuable when it eliminates
overlap, not when it turns a public obligation back into an unwritten promise.

## What can fail

- Current native-sale accounting and the separate foundation remain ambiguous
  parallel paths.
- The wrong token, collection, or default profile wins precedence.
- A sale or settlement key is consumed twice.
- Shares or rounding allocate the wrong amount.
- Contract liabilities exceed held value.
- Emergency recovery withdraws reserved funds.
- A fee-on-transfer or otherwise nonstandard token creates a false accounting
  record.
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
