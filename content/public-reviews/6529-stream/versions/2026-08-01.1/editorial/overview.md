# 6529 Stream: public review

Stream is our attempt to build what we believe may be the most sophisticated
and complete artist-centered contract system yet designed for serious 1/1
digital art.

Here, sophistication means taking direct responsibility for artist consent,
provenance, sales, preservation, governance, and long-term operation. These
responsibilities often sit across websites, private databases, marketplaces,
keyholders, storage providers, and future operators.

A digital artwork can include an artist's approval, exact files and scripts, a
randomness source, versioned software, sale terms, collaborators and revenue
recipients, preservation materials, and a recorded final state.

Stream gives each part the lifespan it needs while preserving one continuous
artwork history. A permanent ERC-721 Core anchors token and collection identity.
Specialized modules handle responsibilities that can evolve, and successor
records preserve the relationship between earlier and later modules.

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
- mint policy in replaceable modules that can express phases, gates, limits,
  and durable usage counters around the permanent Core;
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

## What each part is responsible for

Each component has a specific job. The linked readiness page records how far
each part has progressed.

| What Stream needs to protect | How Stream handles it | What reviewers should verify |
| --- | --- | --- |
| Stable artwork identity | A permanent shared Core records token and collection identity | Identity remains stable through sales, service changes, and module replacement |
| Evolving infrastructure | Module and successor records preserve the history of each replacement | A successor cannot rewrite permanent identity or earlier records |
| Specific artist consent | A signed collection-state approval names the artist and exact approved state | Every important artistic decision appears in readable approval material |
| Faithful community curation | A signed authorization fixes the collection, participants, economics, timing, and sale mode | The public curation decision matches the signed and executed action |
| Safe distribution | The mint manager records phases, gates, limits, and durable usage | Every mint path follows the same supply, replay, and lifetime-limit rules |
| Predictable randomness | Requests record their provider and era; retries preserve the accepted seed | Delays, failures, retries, and provider changes remain fair and traceable |
| Reconstructable artwork | Scripts, token data, dependencies, manifests, and preservation records describe the complete work | An independent person can retrieve and reproduce the intended artwork |
| Precise finality | Supply closure, Core freeze, preservation, and artwork finality are recorded separately | Each completion state has one clear meaning and sufficient evidence |
| Traceable economics | Accounting records allocations, refunds, asset rules, and royalties | Every unit of value has an intended recipient and public accounting path |
| Visible operational changes | Important changes wait, emergency powers are limited, and replacements are recorded | People can see who may act, what can change, and when a power ends |
| Focused incident response | Separate pause areas cover specific operations | An incident response protects affected users while preserving refunds and withdrawals |

Reviewers can recommend removing or narrowing a component. The most useful
suggestion identifies the responsibility involved and the smallest design that
can carry it safely.

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
irreversible actions require an artist signature, protocol approval, a waiting
period, or a combination of those protections.

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

Stream records four separate completion questions:

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

## What the contracts prove

Stream can make important claims verifiable:

- a configured signer authorized a particular typed payload;
- a token belongs to a particular Stream collection;
- a stored hash commits to particular bytes;
- a randomness result was derived from recorded provider output and context;
- a governance action was scheduled with specified call data;
- an old module has a recorded successor;
- a collection has crossed defined freeze or finality states.

People and external services provide additional evidence for:

- that TDH or curation was calculated fairly;
- that an artist was shown an accurate human-readable approval package;
- that committed artwork bytes will remain retrievable;
- that a future browser will render a script identically;
- that a randomness provider will remain funded and available;
- that a marketplace will honor ERC-2981 royalty information;
- that operators, signers, guardians, and governance participants will always
  act wisely.

Public descriptions should state exactly which claims the contracts prove and
which rely on people or external services.

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

## What Stream should achieve

Stream should make artist consent legible, keep token identity stable, identify
every remaining responsibility, preserve the materials needed to understand the
work, and give supporting infrastructure a visible path to evolve.

This review asks whether each mechanism contributes to those goals, has a clear
owner, and is safe enough for a permanent artwork system.

## Questions for reviewers

1. Does Stream take responsibility for the right parts of a serious 1/1
   artwork's lifecycle?
2. Which long-term requirement does each mechanism serve, and where can the
   design become smaller?
3. Is a shared, multi-collection permanent Core the right long-term identity
   model?
4. Is the boundary between permanent and replaceable components clear enough?
5. Which powers should require an artist signature, a delay, a guardian veto,
   or a combination of those protections?
6. Which external dependencies are acceptable for artwork intended to remain
   usable for decades?
7. Which parts of the design create duplicated responsibility or unnecessary
   complexity?
