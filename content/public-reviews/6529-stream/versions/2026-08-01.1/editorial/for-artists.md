# For artists

Stream lets an artist define the full life of a work: its identity, files and
scripts, supply, distribution, sale, collaborators and revenue recipients,
randomness, mutable state, preservation package, and path to finality.

The artist-centered promise is practical control and informed consent. An
artist can inspect commitments made in the artist's name, understand every
other actor's power, and recognize the moment an artistic decision becomes
irreversible.

## Your collection has a durable identity

Stream uses one shared ERC-721 Core for many native collections. The Core stores
a collection record and the artist address associated with it. Each token
receives both a globally sequential token ID and a collection-local serial.

Each Stream collection shares the permanent ERC-721 Core contract. Its identity
comes from the Core collection record, collection reads, and token metadata.

The advantage is continuity. An artwork keeps its identity when a sale module,
renderer, randomness integration, or other replaceable component changes. The
correctness and governance of the shared Core matter to every collection, and
marketplaces or indexers must understand Stream's native collection identity
through the Core records.

The collection can refer to:

- artist identity;
- maximum and current supply;
- mint policy;
- token data, scripts, images, and attributes;
- dependency versions;
- metadata mode;
- randomness provider;
- sale and revenue configuration;
- freeze and preservation commitments.

Those values carry distinct authority and permanence. The artist should be able
to see which contract owns each value, who may change it, and
what closes that mutation path.

## Approving a specific collection state

The current artist-approval mechanism in
[`StreamArtistApprovals.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamArtistApprovals.sol#L8-L21)
computes a collection-state hash and verifies the artist's signature over that
state.

The EIP-712 domain binds the chain and Core contract. The signed state binds:

- artist address;
- current collection-freeze manifest hash;
- maximum collection purchases;
- collection total supply;
- final-supply delay.

The signature can come from:

- an ordinary externally owned account; or
- an ERC-1271 contract wallet such as a Safe.

If one of the bound fields changes, the old signature remains attached to its
earlier state. Typed approval gives the artist one inspectable version of the
work to approve.

Meaningful consent requires the artist-facing product to render the hashed state
in ordinary language, show the exact source
version and contract, and make every irreversible consequence visible before
the wallet asks for a signature.

## The scope of artist approval

Artist approval covers the collection states and commitments defined by the
reviewed source. Different modules and roles can change fields within their
authority. The present Core-freeze call uses administrative authority.

The design decision identifies the exact actions that require current artist
consent.

The most consequential candidates are:

- initial collection state;
- maximum and final supply;
- sale and revenue terms;
- randomness-provider selection;
- collection and one-of-one manifests;
- Core freeze;
- terminal artwork finality;
- recovery or successor actions that change what viewers receive.

Some actions may need approval from both the artist and the people responsible
for operating Stream. A guardian may stop a suspicious action and has no power
to create a replacement artistic payload. The approval requirements should be
stated separately for every action.

## Statements made in the artist's name

Collection metadata and preservation records can carry different kinds of
claims. Stream's record-family design distinguishes artist, owner, independent,
curator, institution, rights, archive, fixity, C2PA, IIIF, media-relationship,
identity-display, snapshot, and agent records.

Clear record types protect provenance: owner statements come from owners,
artist statements come from artists, archive locations identify preservation
copies, rights grants define permissions, and permissionless observations
remain self-attributed.

In the current source, artist, owner, institution, and independent families
reject ordinary administrative grants. Artist authority must come through the
artist-authority provider, and an exact record type can be admitted to only one
family.

The implementation is in
[`StreamRecordFamilyRegistry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRecordFamilyRegistry.sol#L17-L285).

The artist-facing interface should show:

- the record family and exact type;
- who authored the record;
- which wallet or provider established that authority;
- the collection or token it concerns;
- whether it can be revised, locked, superseded, or only supplemented;
- whether the protocol checked only authorship or also validated the record's
  contents.

A recorded statement proves who submitted it under the configured authority
model. Independent evidence establishes the truth of a rights claim,
institutional attestation, archive location, or provenance credential.

## Artwork files, scripts, and token data

Stream can represent work through collection information, scripts,
token-specific data, images, attributes, dependency records, metadata modes,
and randomness output.

That breadth matters for generative and executable art. The full artwork record
may need to reveal:

- which script bytes create the work;
- the order in which scripts run;
- which library and version the script expects;
- which image, font, codec, or data file is required;
- which browser or runtime assumptions affect the result;
- which values are onchain and which must be retrieved elsewhere.

Before approval or finality, the artist should receive a human-readable
dependency bill of materials showing:

1. every file and exact byte hash;
2. every script and its execution order;
3. every external dependency and version;
4. the locations from which each byte sequence can be retrieved;
5. the token data and randomness inputs;
6. instructions for reconstructing the work;
7. browser, font, codec, and runtime assumptions;
8. one or more reference outputs where visual equivalence matters.

A content hash proves that retrieved bytes match a commitment. File upload,
availability, gateways, and software preservation are also needed to execute
it.

## One-of-ones and editions

The shared Core can represent a one-of-one, a fixed edition, or another
supported collection pattern by assigning a collection supply and mint policy.

The protocol gives one-of-one work special attention through token-specific
materials and manifests. The finality package can bind the exact work alongside
the shared collection description.

For any collection pattern, the artist should be able to inspect:

- maximum possible supply;
- minted-ever supply;
- live supply after burns;
- collection-local serials;
- every phase or authorization that can still mint;
- who may change a time window or supply setting;
- what closes supply permanently;
- whether a successor can reopen a path that was represented as closed.

Minted-ever and live supply answer different questions. Burning preserves the
mint history and lifetime mint allowance already used.

## Choosing who can mint

Stream separates collection identity from distribution policy. Mint phases can
describe:

- opening and closing times;
- phase supply;
- executors;
- optional eligibility gates;
- per-wallet, per-recipient, or other durable limits;
- policy hashes;
- authorizers and replay protection.

That separation lets an artist choose a distribution model while the permanent
Core stays focused on token identity and mint authority.

The signed Drop path binds a sale to a payer, recipient, collection, quantity,
price, deadline, sale mode, token-data hash, signer epoch, and replay
identifier. In that path, `quantity` is currently required to equal `1`, so one
authorization mints one token. A many-token edition can use multiple
authorizations or another configured mint lane. The product should present this
path as a single-token mint.

See
[`StreamDrops._validateAuthorization`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L561-L581)
and
[`_executeFixedPriceDrop`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L609-L632).

## Curation and TDH

The community process calculates TDH and curates artists outside Solidity. A
service constructs the exact authorized
action, a configured signer signs it, and the contract verifies the payload.

This creates a clear division:

- the community and its processes decide what should happen;
- the signed payload records the intended result;
- the contract prevents execution from quietly changing the bound collection,
  participants, price, quantity, timing, or sale mode.

Artists still depend on transparent curation rules, correct authorization
construction, signer security, visible key rotation, and public evidence of the
offchain decision.

An artist should be able to inspect the complete typed payload and its
plain-language website summary before the sale.

## Fixed-price sales and auctions

A sale can be a free or paid fixed-price mint or an English auction.

For fixed-price execution, the artist should see:

- the collection and token data;
- price and currency;
- payer and token recipient;
- deadline;
- proceeds recipients and percentages;
- curator and protocol allocation;
- withdrawal behavior;
- cancellation and replay state.

For an auction, the artist should additionally see:

- reserve price;
- start and end conditions;
- minimum next-bid calculation;
- late-bid extension rule;
- custody of the token;
- bidder refund method;
- cancellation boundary;
- winner and no-bid settlement;
- treatment of the already-minted token if no one bids.

The contract uses pull credits for proceeds and refunds, keeping sale progress
independent of each recipient's ability to accept an inline ETH transfer.
That design also creates an accounting obligation: every bidder, artist,
curator, and protocol credit must remain fully backed.

Additional sale profiles can be introduced through future modules. The
permanent Core remains focused on established identity and mint rules. Each sale
profile needs its own
custody, pricing, refund, replay, and settlement analysis.

## Revenue, collaborators, and royalties

An artist may need to divide primary-sale value among collaborators, a curator,
an institution, the protocol, or other recipients. The artist should be able
to approve one human-readable revenue statement that identifies:

- every recipient and share;
- which token, collection, or default profile has precedence;
- when the profile can change;
- supported currencies;
- rounding direction and residual owner;
- withdrawal behavior;
- curator allocation and claim method;
- emergency-surplus boundaries;
- royalty receiver and rate;
- which claims are enforced by Stream and which depend on marketplaces.

The reviewed source contains native Drop and Auction credit accounting as well
as a separate resolver, split-wallet, asset-policy, and primary-settlement
foundation. Those are distinct value paths, and an artist-facing sale should
identify the one it actually uses.

Core also exposes ERC-2981 royalty information as a signal that marketplaces
may use for secondary-sale payments.

## Randomness

If a work uses randomness, the artist should know the provider and failure
policy before minting.

Stream can bind a request to the token, collection, provider address, and
provider epoch. It stores a hash of the raw provider output, derives a
context-bound seed, and exposes pending, fulfilled, stale, and
failed-post-processing states.

If provider output is accepted and the Core write fails, the retry path uses
the same derived seed. That protects
technical recovery from becoming a reroll.

The artist should be able to answer:

- Can I reject a provider before minting?
- Who can change the provider?
- What happens to pending or failed requests?
- When may a request be declared stale?
- How should a stale token recover while preserving one fair seed?
- Can a token be burned while randomness is pending?
- Which provider fees or subscriptions must remain funded?
- Which provider-setting changes create a new Core epoch?

Every description of randomness should name the selected provider and its
operating assumptions.

## Freezing the work

Stream separates final supply, Core freeze, preservation records, and artwork
finality because each closes a different question.

- **Final supply** answers whether more tokens can be minted.
- **Core freeze** closes the covered collection and live-token mutations in the
  permanent contract.
- **Preservation records** commit evidence about the materials needed to
  understand or reconstruct the work.
- **Artwork finality** is a delayed terminal ceremony intended to close the
  remaining artwork-affecting paths.

Before Core freeze or artwork finality, the artist should complete this
checklist:

1. Verify collection identity and the artist address.
2. Verify maximum, minted-ever, live, and intended final supply.
3. Verify every open mint phase, executor, gate, sale, and authorization.
4. Verify every live token's randomness and metadata state.
5. Verify scripts, token data, images, attributes, dependency versions, and
   content hashes.
6. Retrieve every required file from the published locations.
7. Reconstruct the work independently from the package.
8. Verify revenue recipients, percentages, currencies, curator allocation, and
   royalty information.
9. Verify all burn and provenance records.
10. Inspect the exact collection and one-of-one manifests.
11. Inspect which mutation paths Core freeze closes and which remain outside it.
12. Sign only the exact state intended for approval.
13. Preserve an independent copy of the approval and finality package.

The finality delay should give the artist and independent reviewers enough time
to find a missing file, wrong hash, incorrect manifest, or unexpected remaining
writer before execution becomes terminal.

## Collaborators, delegation, recovery, and estates

The current artist-state approval is narrower than a complete lifetime artist
authority system.

A broader design under discussion would need to address:

- collaborators with narrow responsibilities;
- delegated signing powers;
- key rotation and loss;
- contract-wallet ownership changes;
- guardians and recovery;
- disputes and sanctions;
- estate instructions;
- the boundary between artist, owner, institution, and protocol authority.

One proposal would keep artist authority and history in a single registry while
delegating only narrow validation to a stateless helper. Replacing that helper
would require the full successor process. Artists should decide whether that
recovery and delegation model is understandable and worthy of permanence.

## Design position

The approval experience should explain the signature in ordinary language and
name the work, exact source, materials,
supply, sale terms, revenue recipients, randomness provider, mutable fields,
other actors with power, and irreversible actions.

The strongest version of Stream makes artistic consent inspectable,
version-specific, and carried through the full lifecycle of the work.

## Questions for artists

1. Which actions require your current signature?
2. Which actions should require approval from both the artist and the people
   responsible for operating Stream?
3. Should collaborators receive narrow onchain roles, or should the artist
   remain the only signing identity?
4. What recovery and estate process is credible over a fifty-year horizon?
5. Can an artist understand the complete approval package in ordinary language?
6. What preservation evidence would make you comfortable freezing a work?
7. Which sale, revenue, and royalty settings must become permanent, and when?
8. Would the finality ceremony make you more confident, or does it place too
   much operational burden on the artist?
