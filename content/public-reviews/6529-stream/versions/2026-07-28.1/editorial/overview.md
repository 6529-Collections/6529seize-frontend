# 6529 Stream: public review

Stream is our attempt to build what we believe may be the most sophisticated
and complete artist-centered contract system yet designed for serious 1/1
digital art. It treats the artwork as more than a token ID: the artist's
approval, exact materials, sale, revenue, randomness, dependencies,
preservation, finality, and future stewardship all belong to the same public
history.

## A concrete 1/1 journey

Imagine an artist publishing one generative artwork.

1. **The work receives an identity.** A collection is created in Stream's
   shared token contract, called the Core, and the token will receive both a
   global Stream ID and a serial inside that collection.
2. **The artist assembles the work.** Scripts, token data, images, attributes,
   dependency versions, randomness policy, supply, sale terms, and revenue
   recipients are recorded or committed.
3. **The artist approves a specific state.** The signature is tied to the chain,
   Core contract, artist, freeze manifest, supply, purchase limit, and final-
   supply delay. It is not a reusable “I approve Stream” message.
4. **A community decision becomes an exact sale.** Curation and Total Days Held
   (TDH), 6529's time-weighted holding measure, remain offchain, but the
   resulting signed authorization fixes the collection, token data, quantity,
   timing, sale mode, signer era, and a one-use identifier. For fixed price it
   also binds the recipient, payer, and price: a paid mint names the payer and
   exact price, while a free mint sets its payer and price to zero. For auction,
   payer, recipient, and fixed price must be zero; later bids determine the
   bidder and winner.
5. **The token is minted and sold.** A fixed-price mint or English auction
   applies the authorized terms, updates supply, and records the resulting
   payment obligations.
6. **Randomness follows a visible lifecycle.** The request identifies its
   provider and era. Fulfillment stores evidence, and a failed Core write can
   retry the same accepted seed while that provider and era remain current,
   rather than drawing again.
7. **The artwork can be reconstructed.** Metadata can combine onchain state,
   token data, scripts, images, attributes, randomness, and named dependency
   versions.
8. **The artist closes the work deliberately.** Supply closure, Core freeze,
   preservation records, and terminal artwork finality answer different
   questions and happen as separate commitments.
9. **Infrastructure can outlive its first implementation.** If a replaceable
   module later fails or becomes obsolete, an explicit successor can take over
   future duties without rewriting the permanent Core or erasing the old
   contract's history.

Not every artwork needs every step. Stream's purpose is to make the relevant
steps explicit, inspectable, and attributable instead of leaving them scattered
across a website, marketplace settings, private databases, and operator
promises.

## Why Stream goes beyond a mint contract

A minimal ERC-721 can assign a token ID to an owner. That is useful, but it does
not answer many of the questions that matter to an artwork expected to last for
decades:

- What exactly did the artist approve?
- Which files, scripts, libraries, and runtime assumptions make up the work?
- Who may still change them?
- How was a community curation decision translated into this sale?
- Which payer funded the mint, and which address received the token?
- What happens if a randomness provider is late or a callback partly fails?
- How are artists, collaborators, curators, and the protocol paid?
- Which liabilities must remain available for withdrawal?
- What does “frozen” cover?
- How can surrounding infrastructure change without changing the artwork's
  identity?

Stream takes those questions into the protocol design. That creates more
contracts and more state, but it also makes responsibilities visible that would
otherwise still exist offchain.

## Why this complexity exists

Complexity should earn its place. The useful question is not whether Stream has
many components, but which real requirement each component addresses and where
that responsibility would go if the component were removed.

| Requirement | Stream response | What simplification would externalize |
| --- | --- | --- |
| Keep an artwork's identity stable | A permanent shared Core records token and collection identity | Identity becomes dependent on one sale contract, renderer, website, or later migration |
| Let infrastructure improve without silently rewriting the art | Replaceable modules and explicit successor records surround the non-proxy Core | Either old infrastructure can never change, or an upgradeable proxy can replace behavior beneath the same address |
| Make artist consent specific | Typed state approval with ordinary-account and contract-wallet signature support | Consent becomes a vague message, operator assertion, or private workflow |
| Connect community curation to exact execution | A signed authorization binds the chain, contract, signer era, collection, participants, economics, timing, and sale mode | The offchain decision and onchain action can drift apart |
| Support different distribution policies safely | Mint phases, executors, gates, policy hashes, and durable counters live outside the permanent token layer | Every new distribution rule either bloats the Core or depends on a private eligibility database |
| Handle generative randomness without reroll ambiguity | Requests bind provider and era; fulfillment stores evidence; failed Core writes can retry the same derived seed while that provider and era remain current | Provider delay, callback failure, retries, and migration become informal operator decisions |
| Preserve executable artwork, not only a token URI | Scripts, token data, dependencies, content commitments, manifests, and preservation records describe what the work needs | Critical materials and runtime assumptions remain scattered across mutable services |
| Say exactly what “final” means | Supply finalization, Core freeze, preservation evidence, and terminal artwork finality are separate states | One “immutable” badge conceals remaining mutation paths, dependencies, and operational duties |
| Represent real artistic economics | Sale accounting, split profiles, curator allocations, refunds, asset policy, and royalty information are distinct concerns | Collaborator payments, curator rewards, refunds, rounding, and royalty policy move into private accounting |
| Survive organizational and technical change | Bound delayed actions, guardians, module registration, permanently disabled contract functions, and successors make change visible | Future operators either have no recovery path or rely on opaque emergency authority |
| Respond to incidents without freezing everything | Pause domains separate minting, bidding, settlement, metadata, and randomness, with distinct pause and resume powers | A single emergency switch either misses the affected path or strands unrelated users |

This table is also an invitation to simplify. A reviewer who thinks a mechanism
is unnecessary should identify the requirement that can be dropped, narrowed,
moved offchain, or served by a smaller design. “Too complex” begins the
analysis; it does not finish it.

## A permanent center with replaceable edges

The Core is intended to hold the smallest common set of facts that should
survive changes in sale mechanics, randomness providers, metadata
infrastructure, and governance operations. It records shared ERC-721 ownership,
native Stream collections, globally sequential token IDs, collection-local
serials, supply, artist approval, metadata state, burn history, and Core freeze.

The surrounding modules handle concerns with different lifespans:

- mint phases, gates, executors, and counters;
- fixed-price sales and English auctions;
- revenue resolution, split wallets, curator claims, and settlement;
- metadata, scripts, dependencies, and preservation records;
- randomness providers and request recovery;
- roles, pauses, delayed governance, finality, and successors.

Stream does not use a conventional upgradeable proxy for the permanent Core.
A replacement module is a new visible contract, not new bytecode hidden behind
the old Core address. The predecessor remains onchain with its code, events,
liabilities, and history.

That protects the artwork's identity, but it moves the key governance questions
to the boundary:

- Which facts must remain in Core?
- Which duties may move to a successor?
- Who can authorize the change?
- Which delay, veto, code-hash, interface, and continuity evidence is required?
- Which signatures, counters, balances, and old commitments remain binding?

## Artist-centered means inspectable consent

The current artist-approval mechanism signs a collection-state hash using
EIP-712, a standard for typed messages whose named fields can be inspected
before signing. Its signing domain binds the chain and Core contract. The
signed state binds the artist address, collection-freeze manifest hash, maximum
collection purchases, total supply, and final-supply delay. A change to a bound
field makes the earlier approval describe an older state.

The mechanism accepts ordinary account signatures and ERC-1271 signatures from
contract wallets such as a Safe.

This protects an artist from having one approval silently reused for different
bound terms. It does not yet give the artist a universal veto over every
administrative, preservation, governance, or finality action. Reviewers must
decide which irreversible steps require a current artist signature, protocol
governance, a waiting period, or more than one of those.

The human experience matters as much as the hash. An approval package should
show the collection, source version, artwork materials, supply, sale rules,
revenue recipients, randomness provider, mutable fields, other actors with
power, and irreversible actions before the artist signs.

## Social decisions become bound actions

Stream does not calculate TDH or choose artists inside Solidity. Community
curation remains a human and operational process.

Once that process reaches a result, the signed Drop authorization binds shared
values including the chain, verifying contract, signer epoch, collection,
quantity, deadline, sale mode, token-data hash, and replay identifier—a one-use
value that prevents the authorization from being executed twice. A fixed-price
authorization also binds its recipient, payer, and price. A paid mint names its
payer and exact price; a free mint sets payer and price to zero. An auction
authorization instead requires payer, recipient, and fixed price to be zero and
binds its reserve and end time. Those zero addresses are not the later bidder
and winner, which the auction determines through bids and settlement. The
contract can then verify that the submitted transaction matches the authorized
action.

This protects the result from quietly changing between community approval and
execution. It cannot prove that the offchain curation rule was fair, the TDH
calculation was correct, or the signer was not mistaken or compromised. Those
claims require transparent offchain records and operational controls.

## Art that depends on code and infrastructure

Stream can describe artwork assembled entirely from onchain inputs, artwork
whose files live elsewhere, and generative work that combines token data,
scripts, images, randomness, and versioned dependencies.

These modes carry different preservation promises:

- A content hash proves that retrieved bytes match a commitment. It does not
  make missing bytes available.
- An onchain script can remain readable while its browser, font, codec, library,
  or external asset changes.
- A named dependency version identifies the intended library only if its exact
  bytes and ordering can still be recovered.
- A preservation record creates public history. It does not operate a storage
  service or make every recorded claim true.

Stream therefore separates token metadata, collection metadata, reusable
dependencies, preservation records, Core freeze, and artwork finality.
“Onchain,” “permanent,” and “immutable” should describe exact properties, not
serve as broad badges.

## Finality is a sequence, not a switch

Stream distinguishes four questions:

1. Can more tokens still be minted?
2. Can the permanent collection configuration still change?
3. Can future readers retrieve and verify the materials needed to understand or
   reconstruct the work?
4. Can any remaining artwork-affecting path still act?

Final supply, Core freeze, preservation records, and artwork finality answer
those questions separately. The finality design uses a scheduled process with a
waiting period, exact manifests, cancellation or guardian veto, and terminal
execution. One-of-one works can carry token-specific manifest commitments
instead of relying only on a collection-wide package.

The machinery protects against a surprise irreversible call and gives artists,
collectors, and independent reviewers time to find a wrong hash, missing file,
incorrect manifest, or unexpected writer.

It still depends on a complete inventory of every mutation path and on people
watching the schedule. A finality label is only as strong as the code paths it
actually closes.

## What the chain can and cannot promise

Stream can make important claims verifiable:

- a configured signer authorized a particular typed payload;
- a token belongs to a particular Stream collection;
- a stored hash commits to particular bytes;
- a randomness seed was derived from recorded provider output and context;
- a governance action was scheduled with specified call data;
- an old module has a recorded successor;
- a collection crossed defined freeze or finality states.

Other claims remain partly or entirely external:

- whether TDH or curation was calculated fairly;
- whether an artist saw an accurate human-readable approval package;
- whether committed artwork bytes remain retrievable;
- whether a future browser renders a script identically;
- whether a randomness provider remains funded and available;
- whether a marketplace honors ERC-2981 royalty information;
- whether signers, guardians, administrators, and governance participants act
  wisely.

The protocol is strongest when it names these boundaries instead of hiding them
behind words such as “trustless.”

## Exact source and current state

The source is pinned to
[`513bd7e079eafe109df6ae1ae21bfbca6fec6786`](https://github.com/6529-Collections/6529Stream/tree/513bd7e079eafe109df6ae1ae21bfbca6fec6786),
with Git tree
`b50ec53109f5f8d6b4f4b07f4cb6fd3c1d0e3100`. Every code link in this review
points to that commit. A later candidate receives a new review version so its
code, explanation, and feedback remain historically reproducible.

[Current Implementation and
Readiness](./security-testing-and-known-limitations) is the single inventory of
what the pinned rehearsal connects, what exists in source, which accepted
targets still need implementation, which ideas remain proposals, and what
evidence is required before release.

The generated Technical Reference is compiled from the same pinned source. It
inventories the contracts, interfaces, libraries, functions, events, errors,
signatures, selectors, and source ranges seen by the compiler. It supports
navigation and completeness checks; it does not decide whether the design or
implementation is correct.

## Design position

A permanent art protocol should be judged by more than whether it can mint a
token. It should make artist consent legible, keep token identity stable, expose
the trust it still requires, preserve the materials needed to understand the
work, and let supporting infrastructure evolve without quietly rewriting the
artwork.

Stream is ambitious because the problem is ambitious. The purpose of this
review is to decide whether every part of that ambition is necessary, coherent,
bounded, and safe enough to deserve permanence.

## Questions for reviewers

1. Does Stream take responsibility for the right parts of a serious 1/1
   artwork's lifecycle?
2. Which mechanisms solve a real long-term requirement, and which should be
   removed or narrowed?
3. Is a shared, multi-collection permanent Core the right long-term identity
   model?
4. Is the boundary between permanent and replaceable components clear enough?
5. Which powers should require an artist signature, a delay, a guardian veto,
   or more than one of those?
6. Which external dependencies are acceptable for artwork intended to remain
   usable for decades?
7. Does the design make complexity inspectable, or merely distribute it across
   more contracts?
