# Metadata, scripts, and dependencies

At the pinned commit, Stream’s Solidity describes what an artwork is and what
is needed to reconstruct it. For a simple image, that may be JSON plus one
media file. For a generative work, it may include token data, ordered scripts,
exact library versions, randomness, images, attributes, content hashes, and
instructions for the software that executes them.

Most of the machinery on this page is source-implemented rather than a proven
current path. The rehearsal includes `StreamCore`—called Core here—the permanent
token and collection identity contract. It does not establish the renderer,
dependency registry, record-family admissions, or snapshot configuration as a
release candidate.

Consider a generative token in one mode supported by the source renderer. A
viewer reads `tokenURI()`, decodes the JSON, loads the collection’s scripts in
order, combines them with token data and the stored randomness result, resolves
the named dependency version, and runs the work in a browser. If one script
chunk is missing, the dependency silently changes, or the required browser
behavior disappears, the token may still exist while the artwork no longer
renders as intended.

The source design tries to make every part of that chain inspectable. It cannot
guarantee that offchain bytes, gateways, browsers, fonts, codecs, or
marketplaces will remain available.

## Why this machinery exists

A `baseURI` and mutable JSON server would be much smaller onchain. They would
also let a server operator, domain owner, gateway, package resolver, or mutable
dependency decide what collectors see. That may be a legitimate design when the
trust model is explicit, but the complexity has moved outside the protocol.

The source design instead separates several responsibilities:

- token rendering and collection configuration;
- byte-exact scripts and versioned dependencies;
- claims made by artists, owners, institutions, curators, and others;
- snapshots and locks;
- shared contract presentation;
- notifications that metadata changed;
- preservation evidence for bytes and execution assumptions.

The goal is durable attribution and verifiability, not maximum contract surface.
Duplicate writers or representations should still be consolidated. A mechanism
that does not improve integrity, provenance, authority, or reconstruction should
not survive merely because metadata is important.

## What it protects—and what remains outside Ethereum

The source mechanisms can help answer:

- which bytes and versions were intended;
- who was allowed to make a particular claim;
- whether retrieved bytes match a stored commitment;
- which records were included in a snapshot;
- which fields were mutable at a given point;
- when consumers were told that metadata changed.

It cannot by itself keep external bytes online, pay storage providers, preserve
a domain, force a wallet to parse a large response, make a rights claim true, or
freeze browser behavior. “Onchain,” “content-addressed,” “available,” and
“reproducible” are different promises.

## The first question is: where are the bytes?

The source renderer can represent:

- artwork assembled entirely from onchain inputs;
- artwork whose metadata or media lives at external locations;
- generative work combining token data, collection scripts, randomness, and
  versioned dependencies;
- hybrid work with commitments onchain and some bytes elsewhere.

The principal rendering logic is in
[`StreamMetadataRenderer.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMetadataRenderer.sol).
Collection-level records are in
[`StreamCollectionMetadata.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCollectionMetadata.sol),
shared contract presentation is in
[`StreamContractMetadata.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamContractMetadata.sol),
and reusable libraries are in
[`DependencyRegistry.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/DependencyRegistry.sol).

“Onchain metadata” is too vague on its own. It may mean:

- `tokenURI()` returns encoded JSON;
- the JSON embeds an image or HTML document;
- the JSON points to an onchain script that imports other dependencies;
- the JSON or media points to IPFS, Arweave, HTTPS, or another external
  location.

Reviewers should follow every layer. A data URI at the first layer does not
prove that the entire work is self-contained.

## Metadata modes express different preservation promises

The renderer builds a token URI from collection configuration and token state.
Depending on the selected mode, it can return or assemble different
combinations of JSON, media, scripts, and external locations.

The flexibility is useful because artworks have different media and storage
models. It must not be collapsed into one visual “onchain” badge.

An artist and collector should be able to tell:

- whether token JSON is generated onchain;
- whether image or animation bytes are embedded or referenced;
- whether scripts are stored in chunks or fetched elsewhere;
- which dependency versions are required;
- whether URLs can change;
- which hashes cover which representation;
- which parts remain mutable;
- what a third party needs to reconstruct the work.

An honest guarantee can be strong without claiming that everything is onchain.
Precision is stronger than a badge.

## String construction is a security boundary

The renderer constructs values that wallets, marketplaces, indexers, RPC
clients, and browsers parse as JSON, URIs, HTML, or JavaScript.

Every artist-controlled value needs encoding for the context where it is used.
Valid JSON escaping is not automatically safe in JavaScript. HTML-attribute
escaping is not automatically safe in a URI. A string can pass one parser and
close a tag or change meaning in the next.

The current renderer contains:

- JSON-string escaping;
- HTML-attribute escaping;
- JavaScript single-quoted-string escaping;
- script-end-tag handling;
- UTF-8 validation;
- URI policy checks;
- structured raw-attribute validation;
- explicit limits for collection text, token data, images, attributes, script
  chunks, chunk counts, and generated token URIs.

See the validation and encoding surface in
[`StreamMetadataRenderer.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMetadataRenderer.sol#L453-L925).

Reviewers should still test:

- quotes, backslashes, newlines, null bytes, and control characters;
- valid and invalid UTF-8;
- combining characters and right-to-left text;
- closing script and HTML tags;
- very long text, attributes, media, and URLs;
- data-URI media types and base64 boundaries;
- numeric and boolean attributes that must remain typed;
- return values near RPC and consumer limits.

Contract-valid output can still be refused or truncated by ordinary consumers.
Compatibility needs evidence from those consumers.

## Scripts are ordered, byte-exact artwork inputs

In the source renderer, collections can store or reference scripts and
token-specific data used to render generative work. Script order, chunk order,
encoding, and exact bytes all matter.

The renderer hashes script chunks and their positions rather than treating an
unordered set of strings as equivalent. That protects against rearrangement or
partial reconstruction.

The point at which scripts become immutable matters too. Authorized editing
before freeze may be part of the artist’s process. After the relevant
commitment, a collector should not have to trust an operator to remember which
draft was final.

A hash gives integrity:

> If these bytes are available, do they match the committed work?

It does not give availability:

> Can anyone still obtain these bytes?

An external URI plus a hash needs both answers. The hash does not pay a storage
provider, renew a domain, or preserve a browser runtime.

## Versioned dependencies prevent silent library replacement

Generative artwork often depends on a shared library. The
[`DependencyRegistry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/DependencyRegistry.sol)
records dependencies by name and version, with:

- ordered script chunks;
- per-chunk hashes;
- a content hash for the assembled script;
- provenance text;
- creator and creation context;
- deprecation state;
- explicit size and chunk-count limits.

Publishing a new library should create a new version, not change what an old
version means. Deprecation can warn against new use without erasing the source
needed by existing artwork.

Reviewers should establish:

- who can create a dependency name;
- who can add a version;
- when byte content and chunk order become fixed;
- whether a location can change;
- which hash covers a chunk and which covers the assembled dependency;
- how consumers detect a missing, duplicated, or reordered chunk;
- what deprecation changes and what it leaves intact;
- where every version is retained outside the contract.

The simpler alternative is an ordinary CDN or package name. That is convenient,
but it lets mutable hosting and version resolution decide what old art executes.

## Collection metadata separates claims by purpose and authority

The source collection-metadata system can carry artist statements, rights,
preservation locations, fixity evidence, institutional records, media
relationships, and presentation context.

These records are separated so one broad “metadata admin” does not inherit every
artwork-adjacent power. Permission to update a public description should not
also authorize script replacement, supply changes, revenue policy, or a
statement attributed to the artist.

The pinned source provides a closed family-to-writer model:

| Record family      | Purpose                                                                        | Allowed source classes                                  | Why the distinction matters                                                    |
| ------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Artist             | Statement attributed to the recognized artist                                  | Artist signer only                                      | Separates the artist’s words from platform or third-party commentary           |
| Owner              | Statement attributed to the recognized current owner                           | Owner signer only                                       | Shows owner authorship without implying artist endorsement                     |
| Independent        | Self-attributed third-party observation or analysis                            | Any independent attestor                                | Permissionless evidence is attributable, not protocol-approved                 |
| Curator            | Selection, interpretation, or exhibition context                               | Curator signer or global admin                          | Identifies the source of curatorial framing                                    |
| Institution        | Museum, archive, university, or other recognized institution attestation       | Institution signer only                                 | Separates institutional evidence from artist and owner claims                  |
| Rights             | Copyright, license, usage, or permissions information                          | Metadata admin or global admin                          | Affects use and display, but is not legal advice merely because it is recorded |
| Archive            | Location of preservation materials or manifests                                | Preservation admin or global admin                      | A location record does not guarantee continued availability                    |
| Fixity             | Checksums, sizes, or other alteration-detection evidence                       | Institution signer, preservation admin, or global admin | Tests retrieved bytes when those bytes remain available                        |
| C2PA               | Content-provenance credential context                                          | Institution signer, preservation admin, or global admin | Recording a credential does not make its assertions true                       |
| IIIF               | Interoperable cultural-heritage presentation or retrieval context              | Preservation admin, metadata admin, or global admin     | Helps compatible viewers find and present high-resolution media                |
| Media relationship | Master, derivative, thumbnail, soundtrack, or alternate-rendering relationship | Preservation admin or metadata admin                    | Prevents a preview or derivative from being mistaken for the canonical work    |
| Identity display   | Preferred names, credits, and attribution presentation                         | Metadata admin or global admin                          | Changes display, not the underlying authority identity                         |
| Snapshot           | Immutable commitment to selected metadata records at one time                  | Metadata admin or global admin                          | Lets later readers compare a known bundle with newer records                   |
| Agent              | Record of an automated service or machine-produced action                      | Metadata admin or global admin                          | Makes automation visible without proving it was safe                           |

The registry controls who may write an admitted record type. It does not
validate the truth of a rights claim, archive location, credential, IIIF
response, or agent statement.

Artist, owner, independent, and institution families reject admin grants. An
independent record is directly self-attributed by its caller, not endorsed by
the artist, 6529, or the protocol. Each exact record type is admitted once and
cannot later be remapped. See
[`StreamRecordFamilyRegistry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRecordFamilyRegistry.sol#L85-L228).

The family model determines real authority only when its admitted record types,
live authority providers, grants, runtime code hashes, and rotation or
revocation evidence are published. Without those bindings, it does not prove
that a future deployment recognizes the correct wallets.

## Snapshots preserve a view without freezing all future context

A collection snapshot is an immutable record with its own identifier, record
hash, and hash of the covered record-type list.

Publication requires:

1. an admitted snapshot-family record type;
2. authority to write that snapshot type;
3. a nonempty, strictly ascending list of exact covered record types;
4. fresh authorization for every covered record type;
5. an unlocked snapshot path.

A snapshot is not a permission shortcut. The contract emits authorization
evidence for every covered record type. A later snapshot can become `latest`,
and underlying records can continue to change until their own lock or Core
freeze.

Snapshot publication itself does not check Core collection freeze. An
authorized writer can therefore snapshot already-frozen record state while
snapshot locks remain open. Nonreserved record-specific locks can also be added
after Core freeze. Those actions are narrower than revising frozen records, but
they belong in any accurate explanation of freeze.

See
[`publishCollectionSnapshot`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCollectionMetadata.sol#L124-L180)
and
[`_requireSnapshotFamilyIntersection`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCollectionMetadata.sol#L504-L524).

## Shared contract metadata is not an artist's token identity

Contract-level metadata describes the shared Stream ERC-721 surface. It can
affect the marketplace-facing name, description, image, and links for every
collection.

The current
[`updateContractURI`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamContractMetadata.sol#L109-L145)
checks metadata pause and function-admin authority but does not consult an
individual collection’s Core freeze.

A frozen artwork collection and the shared contract’s presentation are
different states. A label can change without changing ownership, token
identity, or the collection’s frozen artwork inputs. Shared presentation still
matters; its authority and promise simply need accurate names.

## Refresh events tell consumers that state changed

Core implements ERC-4906 refresh signals for particular mutations:

- token-data and image/attribute changes emit `MetadataUpdate(tokenId)`;
- live-token randomness fulfillment emits `MetadataUpdate(tokenId)`;
- collection-info and metadata-mode changes emit
  `BatchMetadataUpdate(1, lastAllocatedTokenId)` when tokens exist.

The broad range is an intentional superset because tokens from different Stream
collections can interleave in the global ID sequence.

See the
[`token-level emissions`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L786-L823),
[`randomness emission`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L844-L883),
and
[`collection helper`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L1035-L1044).

These events are notifications, not enforcement. A consumer can ignore them,
cache longer than expected, or interpret a broad range differently.

The accepted launch target also calls for restricted Core helpers through which
authorized satellite contracts can emit standard ERC-4906 signals plus
Stream-native context. No public or external helper exists in the pinned
Solidity. Caller checks, lifecycle and range bounds, abuse analysis,
implementation, and tests remain target work. See the
[`launch target`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/launch-v1-target-architecture.md#L320-L333).

## Size limits protect more than gas

Onchain strings and chunks cost gas to write and can produce large `eth_call`
responses. Limits matter at several layers:

- transaction and block gas;
- deployed bytecode;
- RPC response size;
- wallet and marketplace parsers;
- browser memory and execution time.

A unit test that accepts a maximum value does not prove that public RPC
providers or consumer applications can retrieve and render it. Maximum-size
evidence should exercise the real delivery path.

## The browser is part of the artwork's environment

Generative HTML and JavaScript execute in software Stream does not control.
Browser engines, security policies, APIs, fonts, codecs, GPUs, timing,
randomness APIs, and cross-origin rules change.

Where reproducibility matters, source code alone may be insufficient. A useful
preservation package can need:

- exact dependency and asset bytes;
- browser or runtime version;
- fonts and codecs;
- build and replay instructions;
- expected metadata and animation hashes;
- a reference output or browser proof.

The contract can remain secure while the artwork stops rendering. Smart-
contract security and artwork preservation are related but distinct release
requirements.

## Every collection needs a dependency bill of materials

A human-readable package should state:

- which bytes are onchain;
- which bytes are content-addressed;
- which locations are conventional URLs;
- which dependencies and versions are required;
- which values can still change;
- who can change each one;
- which hashes cover each representation;
- which software assumptions remain;
- how an independent party reconstructs the work without the current website.

“Fully onchain” should be the conclusion of that evidence, with a defined
scope—not a publisher-selected marketing badge.

## What a simpler design would externalize

A base URI and mutable JSON server can remove much of this contract surface. It
also lets external operators determine:

- which image or animation a token displays;
- which script and dependency version executes;
- whether historical bytes remain available;
- which statements came from the artist, owner, institution, or third party;
- whether a collection was reconstructed completely;
- whether visible content changed after a supposed freeze.

Stream’s metadata complexity exists because it tries to make more of those
responsibilities durable, attributable, and independently verifiable. The right
simplification is to consolidate duplicate writers and representations while
preserving exact provenance and authority—not to replace them with an opaque
server.

## What can fail

- Artist-controlled text breaks or changes constructed JSON, HTML, JavaScript,
  SVG, or URI meaning.
- A dependency version is mutable or incompletely hashed.
- An external asset disappears despite a valid onchain hash.
- Chunk order or completeness is ambiguous.
- A metadata writer has authority over the wrong record family.
- Deployed authority providers or grants do not match the reviewed model.
- A snapshot or lock is mistaken for a broader freeze than it provides.
- A refresh helper targets unrelated tokens or creates excessive indexer work.
- An RPC, wallet, indexer, marketplace, or browser cannot process the output.
- Future software renders the same source differently.

## Questions for reviewers

1. Which exact bytes must be present before any Stream collection can be called
   fully onchain?
2. Are all artist-controlled values encoded for every context where they
   appear?
3. Do dependency records make chunk order, content identity, provenance, and
   deprecation unambiguous?
4. Which metadata writes require direct artist authority?
5. Are the record families narrow enough to prevent one role from making claims
   in another actor's name?
6. Which snapshot and lock actions remain valid after Core freeze, and are they
   presented clearly?
7. Does the protocol need external refresh helpers, and if so who may signal
   which token or range?
8. What maximum sizes have been tested through real RPC and consumer
   infrastructure?
9. What must be preserved outside Ethereum for each supported artwork mode to
   remain reproducible?
