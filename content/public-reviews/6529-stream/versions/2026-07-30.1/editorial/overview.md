# 6529 Stream: public review

Stream is our attempt to build what we believe may be the most sophisticated
and complete artist-centered contract system yet designed for serious 1/1
digital art.

Here, sophistication means taking direct responsibility for artist consent,
provenance, sales, preservation, governance, and long-term operation. These
responsibilities often sit across websites, private databases, marketplaces,
keyholders, storage providers, and future operators.

A work of digital art is more than a token ID. It can depend on an artist's
approval, exact files and scripts, a randomness source, versioned software,
sale terms, collaborators and revenue recipients, preservation materials, and
a credible decision about when the work is final. Those facts have different
lifespans. Some should become permanent. Some must be able to evolve.
Some will always depend on people and infrastructure outside Ethereum.

Stream's central design is to separate those categories without separating the
artwork's history. A permanent ERC-721 Core anchors token and collection
identity. Specialized modules handle responsibilities that may need to change.
When a replaceable module has a successor, the old contract and its history
remain visible alongside the new module.

Although the shared Core can support editions and other collection structures,
the hardest case—and the one that most clearly motivates this architecture—is a
serious 1/1 artwork whose identity, materials, provenance, and final state
should remain intelligible for decades.

## What Stream is designed to hold together

The protocol treats the following as parts of one artwork lifecycle:

- a permanent token and collection identity;
- artist approval of a specific, inspectable collection state;
- community curation translated into a cryptographically bound authorization;
- fixed-price sales and English auctions with explicit payer, recipient,
  custody, refund, cancellation, and settlement rules;
- mint policy that can express phases, gates, limits, and durable usage
  counters without putting every future distribution mechanism in the Core;
- primary-sale accounting, collaborator and curator allocations, pull
  withdrawals, and ERC-2981 royalty information;
- randomness with provider identity, request state, stored evidence,
  deterministic post-processing retry, and migration rules;
- onchain and offchain metadata modes, token data, scripts, images, attributes,
  and versioned dependencies;
- separate commitments for final supply, Core freeze, preservation records, and
  terminal artwork finality;
- explicit roles, domain-specific pauses, delayed governance actions, guardian
  vetoes, selector freezes, and successor modules.

Each artwork can use the mechanisms relevant to its needs. A permanent art
protocol should make those choices explicit and documented.

## Why this complexity exists

Complexity should earn its place. Each component should address a real
requirement, with clear ownership of that responsibility. The table describes
the design response; the linked readiness page owns the exact maturity of each
mechanism.

| Requirement                                                   | Design response                                                                                                                          | What simplification would externalize                                                                             |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Keep an artwork's identity stable                             | A permanent shared Core records token and collection identity                                                                            | Identity becomes dependent on one sale contract, renderer, website, or later migration                            |
| Let infrastructure improve while preserving the art           | Source-implemented module and successor records surround the non-proxy Core                                                              | Legacy infrastructure becomes permanent, or an upgradeable proxy can replace behavior beneath the same address    |
| Make artist consent specific                                  | EIP-712 state approval, with ordinary-account and ERC-1271 contract-wallet support                                                       | Consent becomes a vague message, an operator assertion, or a private workflow                                     |
| Connect community curation to exact execution                 | A signed authorization binds the chain, contract, signer era, collection, participants, economics, timing, and sale mode                 | The offchain decision and the onchain action can drift apart                                                      |
| Support different distribution policies safely                | A connected mint-manager foundation provides phases, executors, gates, policy hashes, and durable counters outside the permanent Core    | Every new distribution rule either bloats the Core or depends on a private eligibility database                   |
| Give generative randomness fixed reroll behavior              | Requests bind the provider and epoch; fulfillment stores evidence; failed Core writes retry the same derived seed                        | Provider delay, callback failure, retries, and migration become informal operator decisions                       |
| Preserve the complete executable artwork                     | Scripts, token data, dependencies, content commitments, manifests, and preservation records describe what the work needs                 | Critical materials and runtime assumptions remain scattered across mutable services                               |
| Say exactly what “final” means                                | The source separates supply finalization, Core freeze, preservation evidence, and terminal artwork finality                              | One “immutable” badge conceals which mutation paths, dependencies, or operational duties remain                   |
| Represent real artistic economics                             | Current local accounting and a connected resolver-and-split foundation make allocation, refunds, asset policy, and royalties inspectable | Collaborator payments, curator rewards, refunds, rounding, and royalty policy move into private accounting        |
| Survive organizational and technical change                   | Source-implemented delayed actions, guardians, module registration, selector freezes, and successors make change visible                 | Recovery depends on opaque emergency authority or permanent operational failure                                   |
| Respond to incidents with scoped pauses                       | Current pause controls and source-defined domains separate incident response from restart authority                                      | A single emergency switch may miss the affected path or strand unrelated users                                    |

This table is also an invitation to simplify. If a mechanism is unnecessary,
reviewers should identify the requirement that can be dropped, narrowed, moved
offchain, or served by a smaller design. “Too complex” begins an analysis that
should end with specific evidence and a clear conclusion.

## A permanent center and evolvable edges

The permanent Core is intended to hold the smallest common surface that should
survive changes in sale mechanics, randomness providers, metadata
infrastructure, and governance operations. It assigns globally sequential token
IDs, associates each token with a native Stream collection, records
collection-local serials, and enforces Core-level supply and identity rules.

The surrounding modules address concerns with different change horizons:
minting, sales, auctions, revenue resolution, split wallets, metadata,
dependencies, randomness, preservation, roles, governance, and artwork
finality.

Successors preserve the predecessor's code and history. The important
governance questions therefore
become visible:

- Which facts are permanent in Core?
- Which duties may move to a successor?
- Who can authorize that transition?
- What delay, veto, code-hash, interface, and continuity evidence is required?
- Which signatures, counters, liabilities, and commitments remain with the old
  module?

That boundary is one of the most consequential choices in the review.

## Artist-centered means inspectable consent

The current artist-approval mechanism signs a specific collection-state hash.
The signed state binds the artist address, collection-freeze manifest hash,
maximum collection purchases, total supply, and final-supply delay. A change to
a bound field makes the earlier approval stale. The mechanism supports both
ordinary account signatures and ERC-1271 contract wallets such as a Safe.

This approval makes one version of the work distinguishable from another. Its
current scope covers a defined collection state. The review must decide which
irreversible actions require an artist signature, protocol governance, a
waiting period, or more than one of those.

The same standard should apply to every artist-facing commitment. A readable
approval package should show the collection, source version, artwork materials,
supply, sale rules, revenue recipients, randomness provider, mutable fields,
and irreversible actions before the artist signs.

## From social decisions to bound actions

Community curation calculates TDH and chooses artists through a social and
operational process. The contract's job begins
when that process produces an authorization.

The signed Drop path binds the resulting action to values including the chain,
verifying contract, signer epoch, collection, payer, recipient, quantity,
price, deadline, sale mode, token-data hash, and replay identifier. Solidity
can then verify that the submitted transaction matches the authorized action.
Public process records must establish that the offchain curation rule was fair
and correctly applied.

This division is deliberate: keep human judgment where it belongs, while
preventing its onchain execution from quietly becoming a different sale.

## Art that depends on code and infrastructure

Stream can describe artwork that is assembled entirely onchain, artwork whose
files live elsewhere, and generative work that combines token-specific data,
scripts, images, randomness, and versioned dependencies.

Those modes carry different preservation claims:

- A content hash proves that retrieved bytes match a commitment. Availability
  requires retrievable copies.
- An onchain script can remain readable while the browser, font, codec, library,
  or external asset it expects changes.
- A dependency version can identify the intended library. A durable rendering
  still requires the exact bytes, their order, and the execution assumptions.
- A preservation record establishes a public history. Storage services keep the
  bytes available, and independent evidence verifies the recorded claims.

For that reason, Stream separates token metadata, collection metadata, reusable
dependencies, preservation records, Core freeze, and terminal artwork
finality. “Onchain” and “immutable” should describe exact properties with
specific evidence.

## Finality as a ceremony

Stream distinguishes four questions that simpler systems often collapse:

1. Can more tokens still be minted?
2. Can the permanent collection configuration still change?
3. Can future readers retrieve and verify the materials needed to understand or
   reproduce the work?
4. Can any remaining artwork-affecting path still act?

Final supply, Core freeze, preservation records, and artwork finality answer
those questions separately. The artwork-finality design uses a scheduled
process with a visible waiting period, exact manifests, cancellation or
guardian veto, and terminal execution. One-of-one works can carry
token-specific manifest commitments alongside a collection-wide package.

The delay gives artists, collectors, and independent reviewers time to inspect
an irreversible action before it becomes final.

## What the chain can verify

Stream can make important claims verifiable:

- a configured signer authorized a particular typed payload;
- a token belongs to a particular Stream collection;
- a stored hash commits to particular bytes;
- a randomness result was derived from recorded provider output and context;
- a governance action was scheduled with specified call data;
- an old module has a recorded successor;
- a collection has crossed defined freeze or finality states.

Other claims remain outside the contract:

- that TDH or curation was calculated fairly;
- that an artist was shown an accurate human-readable approval package;
- that committed artwork bytes will remain retrievable;
- that a future browser will render a script identically;
- that a randomness provider will remain funded and available;
- that a marketplace will honor ERC-2981 royalty information;
- that operators, signers, guardians, and governance participants will always
  act wisely.

The protocol is strongest when it names these boundaries and gives “trustless”
a precise, limited meaning.

## The source under review

The source is pinned to
[`513bd7e079eafe109df6ae1ae21bfbca6fec6786`](https://github.com/6529-Collections/6529Stream/tree/513bd7e079eafe109df6ae1ae21bfbca6fec6786),
with exact Git tree
`b50ec53109f5f8d6b4f4b07f4cb6fd3c1d0e3100`. Every code link in this review
points to that commit. A later candidate receives a new review version so the
explanation, code, and feedback remain historically reproducible.

The generated Technical Reference is compiled from that pinned source. It
inventories the contracts, interfaces, libraries, functions, events, errors,
signatures, selectors, and source ranges seen by the compiler. That inventory
supports navigation and completeness checks. Independent review evaluates the
design and implementation.

The editorial pages explain the protocol from different perspectives:

- **Artwork Lifecycle** follows one work from collection creation through
  finality and succession.
- **For Artists** explains consent, materials, sales, revenue, randomness, and
  irreversible decisions.
- The technical topic pages cover curation, minting, sales, accounting,
  randomness, metadata, preservation, governance, and trust.
- **Community Review** explains how to submit a question, design objection,
  evidence gap, bug, or possible vulnerability against the exact version.

## Design position

A permanent art protocol should be judged by more than whether it can mint a
token. It should make artist consent legible, keep token identity stable,
expose the trust it still requires, preserve the materials needed to understand
the work, and provide a credible path for infrastructure to evolve without
quietly rewriting the artwork.

Stream is ambitious because the problem is ambitious. The purpose of this
review is to determine whether every part of that ambition is necessary,
coherent, bounded, and safe enough to deserve permanence.

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
