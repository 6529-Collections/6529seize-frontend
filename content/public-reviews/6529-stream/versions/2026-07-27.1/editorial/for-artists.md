# For artists

This review covers an incomplete, undeployed candidate; [Current Implementation and Readiness](./security-testing-and-known-limitations) is the authoritative record of what is connected, implemented, proposed, and still required.

Stream is designed to let an artist define more than a token. It can describe
the life of a work: its identity, files and scripts, supply, distribution,
sale, collaborators and revenue recipients, randomness, mutable state,
preservation package, and path to finality.

The artist-centered promise is not that an artist must operate every contract.
It is that the artist can inspect the commitments made in the artist's name,
understand which other actors still have power, and recognize the point at
which an artistic decision becomes irreversible.

## Your collection has a durable identity

Stream uses one shared ERC-721 Core for many native collections. The Core stores
a collection record and the artist address associated with it. Each token
receives both a globally sequential token ID and a collection-local serial.

This means a Stream collection does not receive a separate ERC-721 contract
address. Its identity comes from the Core collection record, collection reads,
and token metadata rather than from a unique contract deployment for every
artist or project.

The advantage is continuity. An artwork does not acquire a new identity when a
sale module, renderer, randomness integration, or other replaceable component
changes. The tradeoff is that the correctness and governance of the shared Core
matter to every collection, and marketplaces or indexers must understand
Stream's native collection identity instead of relying only on contract
address.

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

Those values do not all carry the same authority or permanence. The artist
should be able to see which contract owns each value, who may change it, and
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

If one of the bound fields changes, the old signature describes an earlier
state rather than silently approving the new one. That is the essential value
of typed approval: the artist approves one inspectable version of the work.

Signing a hash is not meaningful consent by itself. The artist-facing product
should render the hashed state in ordinary language, show the exact source
version and contract, and make every irreversible consequence visible before
the wallet asks for a signature.

## Approval is not the same as total control

The current artist approval is not a universal veto over all administrative
actions. Different modules and roles can still change fields within their
authority. The present Core-freeze call is an administrative action and does
not itself demand a new artist signature.

The design decision is therefore not “does the artist approve Stream?” It is
which exact actions become impossible without current artist consent.

The most consequential candidates are:

- initial collection state;
- maximum and final supply;
- sale and revenue terms;
- randomness-provider selection;
- collection and one-of-one manifests;
- Core freeze;
- terminal artwork finality;
- recovery or successor actions that change what viewers receive.

Some actions may reasonably need both artist approval and protocol governance.
A guardian may have power to stop a suspicious action without gaining power to
author a different artistic payload. Those combinations should be described
action by action.

## Statements made in the artist's name

Collection metadata and preservation records can carry different kinds of
claims. Stream's record-family design distinguishes artist, owner, independent,
curator, institution, rights, archive, fixity, C2PA, IIIF, media-relationship,
identity-display, snapshot, and agent records.

That distinction protects provenance. An owner statement should not be mistaken
for an artist statement. An archive location should not be mistaken for a
rights grant. A permissionless independent observation should remain
self-attributed rather than appearing as protocol endorsement.

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

A recorded statement can prove who submitted it under the configured authority
model. It does not automatically make a rights claim, institutional
attestation, archive location, or provenance credential true.

## Artwork files, scripts, and token data

Stream can represent work through collection information, scripts,
token-specific data, images, attributes, dependency records, metadata modes,
and randomness output.

That breadth matters for generative and executable art. A `tokenURI` alone may
not reveal:

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

A content hash proves that retrieved bytes match a commitment. It does not
upload the file, keep it available, operate a gateway, or preserve the software
needed to execute it.

## One-of-ones and editions

The shared Core can represent a one-of-one, a fixed edition, or another
supported collection pattern by assigning a collection supply and mint policy.

The protocol gives one-of-one work special attention where collection-wide
records are not enough. A token can require its own materials and manifest so
that the finality package binds the exact work rather than only a shared
collection description.

For any collection pattern, the artist should be able to inspect:

- maximum possible supply;
- minted-ever supply;
- live supply after burns;
- collection-local serials;
- every phase or authorization that can still mint;
- who may change a time window or supply setting;
- what closes supply permanently;
- whether a successor can reopen a path that was represented as closed.

Minted-ever and live supply answer different questions. Burning a token should
not erase the fact that it was minted or automatically restore a lifetime mint
allowance.

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

That separation allows an artist to choose a distribution model without making
every future sale mechanism part of the permanent Core.

The signed Drop path binds a sale to a payer, recipient, collection, quantity,
price, deadline, sale mode, token-data hash, signer epoch, and replay
identifier. In that path, `quantity` is currently required to equal `1`, so one
authorization mints one token. A many-token edition can use multiple
authorizations or another configured mint lane; the field should not be
presented as a batch mint when this path does not provide one.

See
[`StreamDrops._validateAuthorization`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L561-L581)
and
[`_executeFixedPriceDrop`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L609-L632).

## Curation and TDH

TDH and curation are calculated outside Solidity. Stream does not choose an
artist or run an onchain TDH vote. A service constructs the exact authorized
action, a configured signer signs it, and the contract verifies the payload.

This creates a clear division:

- the community and its processes decide what should happen;
- the signed payload records the intended result;
- the contract prevents execution from quietly changing the bound collection,
  participants, price, quantity, timing, or sale mode.

Artists still depend on transparent curation rules, correct authorization
construction, signer security, visible key rotation, and public evidence of the
offchain decision.

An artist should be able to inspect the complete typed payload before the sale,
not merely a website summary.

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

The contract uses pull credits for proceeds and refunds so an arbitrary
recipient cannot block sale progress by rejecting an inline ETH transfer.
That design also creates an accounting obligation: every bidder, artist,
curator, and protocol credit must remain fully backed.

Additional sale profiles can be introduced through future modules without
placing speculative mechanisms in the permanent Core. A generic extension
point does not make an unreviewed sale profile safe; each profile needs its own
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

Core also exposes ERC-2981 royalty information. ERC-2981 is a signal to a
marketplace, not a mechanism that forces every secondary sale to pay.

## Randomness

If a work uses randomness, the artist should know the provider and failure
policy before minting.

Stream can bind a request to the token, collection, provider address, and
provider epoch. It stores a hash of the raw provider output, derives a
context-bound seed, and exposes pending, fulfilled, stale, and
failed-post-processing states.

If provider output is accepted but the Core write fails, the retry path uses the
same derived seed rather than requesting a new random result. That protects
technical recovery from becoming a reroll.

The artist should be able to answer:

- Can I reject a provider before minting?
- Who can change the provider?
- What happens to pending or failed requests?
- When may a request be declared stale?
- Can a stale token recover without creating selective rerolls?
- Can a token be burned while randomness is pending?
- Which provider fees or subscriptions must remain funded?
- Which provider settings can change without creating a new Core epoch?

Randomness should not be described as trustless without naming the selected
provider and its operating assumptions.

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

Artists should not have to read transaction traces to understand what they are
signing. The approval experience should name the work, exact source, materials,
supply, sale terms, revenue recipients, randomness provider, mutable fields,
other actors with power, and irreversible actions.

The strongest version of Stream is not merely a contract that respects an
artist address. It is a system in which artistic consent is inspectable,
version-specific, and carried through the full lifecycle of the work.

## Questions for artists

1. Which actions must be impossible without your current signature?
2. Which actions should require both artist approval and protocol governance?
3. Should collaborators receive narrow onchain roles, or should the artist
   remain the only signing identity?
4. What recovery and estate process is credible over a fifty-year horizon?
5. Is the approval package understandable enough to sign without Solidity
   knowledge?
6. What preservation evidence would make you comfortable freezing a work?
7. Which sale, revenue, and royalty settings must become permanent, and when?
8. Would the finality ceremony make you more confident, or does it place too
   much operational burden on the artist?
