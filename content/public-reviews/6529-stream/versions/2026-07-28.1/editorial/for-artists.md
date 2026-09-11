# For artists

Stream is designed to let an artist define the life of a digital artwork, not
just mint its token. It can make the work's identity, materials, supply, sale,
revenue, randomness, mutable state, preservation package, and final state
visible as connected commitments.

## What publishing a 1/1 could look like

For an artist, the intended journey is:

1. **Create the collection identity.** Confirm the artist address and the
   collection record in Stream's shared token contract, called the Core, that
   will permanently identify the work.
2. **Assemble the artwork.** List the exact files, scripts, token data,
   dependencies, images, attributes, and runtime assumptions.
3. **Choose the edition and audience.** Set the maximum supply, mint policy,
   sale path, eligibility rules, and recipient behavior.
4. **Choose the economics.** Confirm the price, currency, collaborators,
   curator allocation, protocol allocation, withdrawal rules, and royalty
   information.
5. **Choose the randomness policy.** If the work uses randomness, identify the
   provider, cost, failure states, retry rules, and recovery limits.
6. **Approve one readable state.** Compare the wallet signature with a
   human-readable package showing exactly what the signed hash commits to.
7. **Publish and observe.** Watch the mint or auction, token identity,
   randomness result, metadata, payments, and any burn history.
8. **Close supply.** Confirm that every mint path is closed, not only the one
   visible in the main interface.
9. **Freeze the Core boundary.** Verify the exact fields and functions that
   become unchangeable.
10. **Preserve and finalize the artwork.** Retrieve the materials independently,
    inspect collection and token-specific manifests, wait through the finality
    delay, and verify the terminal state.

The machinery exists so these choices do not remain private operator settings.
Its value depends on whether the artist can understand the choices before
signing and independently check the result afterward.

## What the system is trying to protect

For artists, Stream is trying to protect:

- **Identity:** the work should not receive a new identity when a sale,
  renderer, or other replaceable module changes.
- **Specific consent:** a signature for one state should not approve a later
  state with different bound terms.
- **Attribution:** an artist statement should remain distinguishable from an
  owner, curator, institution, administrator, or independent observer.
- **Complete artwork materials:** the protocol should describe more than a
  thumbnail or mutable URL.
- **Economic clarity:** recipients, percentages, liabilities, and royalty
  limits should be visible before a sale.
- **Deliberate finality:** “finished” should name the exact supply, data,
  preservation, and mutation promises being made.

It cannot remove every outside dependency. The artist still depends on
curation services, signers, randomness providers, storage, browsers,
marketplaces, governance, and the quality of the human-readable interface.
Those boundaries should be named rather than hidden behind “trustless” or
“immutable.”

## Your collection has a durable identity

Stream uses one shared ERC-721 Core—the standard kind of contract that records
NFT ownership—for many native collections. The Core stores the collection
record and its artist address. Each token receives both a global Stream token
ID and a collection-local serial.

A Stream collection therefore does not receive a separate ERC-721 contract
address. Its identity comes from the Core collection record, collection reads,
and token metadata.

This protects continuity: the artwork does not acquire a new identity when a
sale module, renderer, randomness integration, or other replaceable component
changes. The tradeoff is that Core correctness and governance affect every
collection, and marketplaces or indexers must understand Stream's native
collection identity instead of grouping only by contract address.

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

The artist should be able to see which contract owns each value, who may change
it, and what closes that mutation path.

## You approve a specific state

The current artist-approval mechanism in
[`StreamArtistApprovals.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamArtistApprovals.sol#L8-L21)
computes a collection-state hash and verifies the artist's signature.

The typed domain binds the chain and Core contract. The signed state binds:

- artist address;
- current collection-freeze manifest hash;
- maximum collection purchases;
- collection total supply;
- final-supply delay.

The signature can come from an ordinary account or an ERC-1271 contract wallet
such as a Safe.

If a bound field changes, the old signature describes the earlier state. This
protects the artist from having one approval silently reused for new bound
terms.

The wallet still shows a hash. The product must translate that hash into a
readable package with the collection, source version, files, supply, sale
rules, recipients, randomness provider, mutable fields, and irreversible
actions. A technically valid signature is not meaningful artistic consent when
the artist cannot inspect what it means.

## Approval is not total control

The current artist approval is not a universal veto. Administrative and
governance paths can still act within their own authority. The current
Core-freeze call, for example, does not itself demand a new artist signature.

The practical question is which actions become impossible without current
artist consent. Important candidates include:

- initial collection state;
- maximum and final supply;
- sale and revenue terms;
- randomness-provider selection;
- collection and one-of-one manifests;
- Core freeze;
- terminal artwork finality;
- a recovery or successor action that changes what viewers receive.

Some actions may reasonably require both artist approval and protocol
governance. A guardian may be able to stop a suspicious action without gaining
power to author a different artwork payload.

## Statements made in your name

Collection metadata and preservation records can carry different kinds of
claims. Stream's record-family design distinguishes artist, owner, independent,
curator, institution, rights, archive, fixity evidence (checks showing whether
retrieved bytes changed), C2PA (Coalition for Content Provenance and
Authenticity) credentials, IIIF (International Image Interoperability
Framework) media records, media-relationship, identity-display, snapshot, and
agent records.

This prevents an owner statement from appearing to be an artist statement, an
archive location from appearing to be a rights grant, or a permissionless
observation from appearing to be protocol endorsement.

In the current source, artist, owner, institution, and independent families
reject ordinary administrative grants. Artist authority comes through an
artist-authority provider, and an exact record type can be admitted to only one
family.

The implementation is in
[`StreamRecordFamilyRegistry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRecordFamilyRegistry.sol#L17-L285).

The artist-facing interface should show:

- record family and exact type;
- authoring address;
- wallet or provider that established authority;
- collection or token concerned;
- whether the record can be revised, locked, superseded, or only supplemented;
- whether Stream checked authorship only or also validated the contents.

A recorded statement can prove who submitted it under the configured authority
model. It does not automatically make a rights claim, archive location,
institutional attestation, or provenance credential true.

## The artwork is more than its metadata URL

Stream can represent a work through collection information, scripts,
token-specific data, images, attributes, dependency records, metadata modes,
and randomness output.

For generative and executable work, `tokenURI` alone may not reveal:

- exact script bytes and execution order;
- library names, versions, and bytes;
- image, font, codec, or data-file dependencies;
- which values are onchain and which must be retrieved elsewhere;
- which browser or runtime assumptions affect the result.

Before approval or finality, the artist should receive a dependency bill of
materials showing:

1. every file and exact byte hash;
2. every script and its execution order;
3. every external dependency and version;
4. each retrieval location;
5. token data and randomness inputs;
6. reconstruction instructions;
7. browser, font, codec, and runtime assumptions;
8. reference outputs where visual equivalence matters.

A hash proves that retrieved bytes match a commitment. It does not upload the
file, keep it available, operate a gateway, or preserve the software needed to
execute it.

## One-of-ones and editions

The shared Core can represent a one-of-one, fixed edition, or another supported
collection pattern through supply and mint policy.

One-of-one work receives special treatment where a collection-wide record is
not enough. A token can require its own materials and manifest so the finality
package binds that exact work rather than only a shared collection description.

For any collection, the artist should be able to inspect:

- maximum possible supply;
- minted-ever supply;
- live supply after burns;
- collection-local serials;
- every phase or authorization that can still mint;
- who may change a time window or supply setting;
- what closes supply;
- whether a successor can reopen a path represented as closed.

Minted-ever and live supply answer different questions. Burning a token should
not erase its mint history or automatically restore a lifetime allowance.

## Choosing who can mint

Stream separates collection identity from distribution policy. Mint phases can
describe:

- opening and closing times;
- phase supply;
- executors;
- optional eligibility gates;
- per-wallet, per-recipient, or other durable limits;
- policy hashes;
- authorizers and one-use authorization safeguards, also called replay
  protection.

That allows distribution rules to change without putting every future sale
mechanism into the permanent Core.

The signed Drop path binds a sale to a payer, recipient, collection, quantity,
price, deadline, sale mode, token-data hash, signer epoch, and a one-use replay
identifier that prevents the authorization from being executed twice.
In that path, `quantity` is currently required to equal `1`, so one
authorization mints one token. An edition can use multiple authorizations or
another configured mint lane; the existence of a quantity field does not make
this path a batch mint.

See
[`StreamDrops._validateAuthorization`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L561-L581)
and
[`_executeFixedPriceDrop`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L609-L632).

The exact current, connected, source-only, accepted, and proposed paths are
centralized on [Current Implementation and
Readiness](./security-testing-and-known-limitations).

## Curation and TDH

Total Days Held (TDH) is 6529's time-weighted holding measure. TDH and curation
are calculated outside Solidity. Stream does not choose the artist or run an
onchain TDH vote. A service constructs the authorized action, a configured
signer signs it, and the contract checks the payload.

This protects the approved result by binding the collection, participants,
price, quantity, timing, and sale mode. It does not prove that the curation
rules were fair, the TDH calculation was correct, or the signer was not
compromised.

Artists still depend on published curation rules, correct authorization
construction, signer security, visible rotation, and public evidence of the
offchain decision. The complete typed payload should be readable before the
sale, not only after execution.

## Fixed-price sales and auctions

A sale can be a free or paid fixed-price mint or an English auction.

For a fixed-price sale, the artist should see:

- collection and token data;
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
- token custody;
- bidder refund method;
- cancellation boundary;
- winner and no-bid settlement;
- treatment of the already-minted token if no one bids.

The contract uses pull credits for proceeds and refunds so a recipient cannot
block sale progress by rejecting an inline ETH transfer. That also creates an
accounting duty: every bidder, artist, curator, and protocol credit must remain
fully backed.

Future sale profiles can use new modules rather than expanding the permanent
Core. Each still needs its own custody, pricing, refund, replay, and settlement
review.

## Revenue, collaborators, and royalties

An artist may need to divide primary-sale value among collaborators, a curator,
an institution, the protocol, an estate, or other recipients.

Before approving a sale, the artist should receive one readable revenue
statement identifying:

- every recipient and share;
- token, collection, and default-profile precedence;
- when the profile can change;
- supported currencies;
- rounding direction and residual owner;
- withdrawal behavior;
- curator allocation and claim method;
- emergency-surplus boundaries;
- royalty receiver and rate;
- which claims Stream enforces and which depend on marketplaces.

The source contains native Drop and Auction credit accounting as well as a
separate resolver, split-wallet, asset-policy, and primary-settlement
foundation. Those are distinct value paths, so the sale interface must name the
one it actually uses.

Core also exposes ERC-2981 royalty information. ERC-2981 tells a marketplace
what royalty the contract reports; it does not force every marketplace to pay.

## Randomness

If the work uses randomness, the artist should know the provider and failure
policy before minting.

Stream can bind a request to the token, collection, provider address, and
provider epoch. It stores a hash of the raw provider output, derives a
context-bound seed, and exposes pending, fulfilled, stale, and
failed-post-processing states.

If the provider output was accepted but the Core write failed, retry uses the
same derived seed instead of requesting a new result. That protects a technical
recovery from becoming a reroll.

The artist should be able to answer:

- Can I reject the provider before minting?
- Who can change it?
- What happens to pending or failed requests?
- When may a request be declared stale?
- Can a stale token recover without creating selective rerolls?
- Can a token be burned while randomness is pending?
- Which fees or subscriptions must remain funded?
- Which provider settings can change without a new Core epoch?

The selected provider remains an outside trust and availability dependency.

## Freezing the work

Stream separates:

- **Final supply:** whether more tokens can be minted.
- **Core freeze:** whether covered collection and live-token fields in the
  permanent contract can change.
- **Preservation records:** what evidence exists about the materials needed to
  understand or reconstruct the work.
- **Artwork finality:** whether the remaining artwork-affecting paths for the
  defined scope are terminal.

Before freeze or finality, the artist should:

1. Verify collection identity and artist address.
2. Verify maximum, minted-ever, live, and intended final supply.
3. Verify every open mint phase, executor, gate, sale, and authorization.
4. Verify every live token's randomness and metadata state.
5. Verify scripts, token data, images, attributes, dependency versions, and
   hashes.
6. Retrieve every required file from the published locations.
7. Reconstruct the work independently.
8. Verify recipients, percentages, currencies, curator allocation, and royalty
   information.
9. Verify burn and provenance records.
10. Inspect exact collection and one-of-one manifests.
11. Inspect what Core freeze closes and what remains outside it.
12. Sign only the intended state.
13. Preserve an independent copy of the approval and finality package.

The finality delay should provide time to find a missing file, wrong hash,
incorrect manifest, or unexpected remaining writer before the action becomes
terminal.

## Collaborators, recovery, and estates

The current artist-state approval is narrower than a complete lifetime artist
authority system.

A broader model would need to address:

- collaborators with narrow responsibilities;
- delegated signing;
- key rotation and loss;
- contract-wallet ownership changes;
- guardians and recovery;
- disputes and sanctions;
- estate instructions;
- boundaries among artist, owner, institution, and protocol authority.

One proposal would keep artist authority and history in a single registry while
delegating only narrow validation to a stateless helper. Replacing that helper
would require the full successor process. Artists should decide whether that
recovery and delegation model is understandable and worthy of permanence.

## Design position

Artists should not need transaction traces to understand what they are
signing. The approval experience should name the work, exact source, materials,
supply, sale terms, recipients, randomness provider, mutable fields, other
actors with power, and irreversible actions.

The strongest version of Stream is not merely a contract that records an artist
address. It is a system in which artistic consent is readable,
version-specific, and carried through the full life of the work.

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
