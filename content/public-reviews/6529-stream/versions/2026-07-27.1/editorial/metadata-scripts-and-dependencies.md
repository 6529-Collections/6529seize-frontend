# Metadata, scripts, and dependencies

This review covers an incomplete, undeployed candidate; [Current Implementation and Readiness](./security-testing-and-known-limitations) is the authoritative record of what is connected, implemented, proposed, and still required.

For digital art, metadata is not merely a name and image URL. It can be the
recipe for reconstructing the work: token data, scripts, library versions,
media, attributes, content hashes, execution assumptions, and the record of who
was allowed to describe or preserve each part.

Stream's metadata system is designed to make that recipe inspectable. A simple
`baseURI` can make the contract much smaller, but then a server operator, domain
owner, gateway, or mutable dependency can silently determine what collectors
see. The complexity has not disappeared; it has moved outside the protocol.

## The first question is: where are the bytes?

Stream can represent:

- artwork described and assembled entirely from onchain inputs;
- artwork whose metadata or media lives at external locations;
- generative work combining token data, collection scripts, randomness, and
  versioned dependencies;
- hybrid arrangements with commitments onchain and some bytes elsewhere.

The principal rendering logic is in
[`StreamMetadataRenderer.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMetadataRenderer.sol).
Collection-level records are in
[`StreamCollectionMetadata.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCollectionMetadata.sol),
contract-level presentation is in
[`StreamContractMetadata.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamContractMetadata.sol),
and reusable libraries are in
[`DependencyRegistry.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/DependencyRegistry.sol).

"Onchain metadata" is too imprecise on its own. It can mean:

- `tokenURI()` returns encoded JSON;
- the JSON contains an encoded image or HTML document;
- the JSON points to an onchain script that still imports other dependencies;
- the JSON or media points to IPFS, Arweave, HTTPS, or another external
  location.

Reviewers should follow every layer and identify which exact bytes are onchain,
which are content-addressed, which use a conventional location, and which
software must execute them. A data URI at the first layer does not prove that
the entire work is self-contained.

## Metadata modes express different preservation promises

The renderer can build a token URI from stored collection configuration and
token state. Depending on the selected mode, it can return or assemble
different combinations of JSON, media, scripts, and external locations.

That flexibility is useful because not every artwork has the same medium or
storage model. It must not be collapsed into one visual "onchain" badge.

An artist and collector should be able to tell:

- whether token JSON is generated onchain;
- whether image or animation bytes are embedded or referenced;
- whether scripts are stored in chunks or fetched elsewhere;
- which dependency versions are required;
- whether URLs can change;
- which hashes cover which representation;
- which parts remain mutable;
- what a third party needs to reconstruct the work.

The honest guarantee may be excellent without being "everything is onchain."
Precision is stronger than a badge.

## String construction is a security boundary

The renderer constructs values that wallets, marketplaces, indexers, RPC
clients, and browsers parse as JSON, URIs, HTML, or JavaScript.

Every artist-controlled value needs encoding for the context where it is used.
Valid JSON escaping is not automatically safe in JavaScript. HTML-attribute
escaping is not automatically safe in a URI. A string may pass one parser and
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

A contract can return bytes that are valid by its own rules while ordinary
consumers refuse or truncate them. Real compatibility needs real consumer
evidence.

## Scripts are ordered, byte-exact artwork inputs

Collections can store or reference scripts and token-specific data used to
render generative work. Script order, chunk order, encoding, and exact bytes all
matter.

The renderer hashes script chunks and their positions rather than treating an
unordered set of strings as equivalent. That protects against rearrangement or
partial reconstruction.

The point at which scripts become immutable is equally important. Before
freeze, authorized mutation may be part of the artist's working process. After
the relevant commitment, a collector should not have to trust an operator to
remember which draft was final.

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
needed to render existing artwork.

Reviewers should establish:

- who can create a dependency name;
- who can add a version;
- when byte content and chunk order become fixed;
- whether a location can change;
- which hash covers the chunk and which covers the assembled dependency;
- how consumers detect a missing, duplicated, or reordered chunk;
- what deprecation changes and what it deliberately leaves intact;
- where every version is retained outside the contract.

The simpler alternative is an ordinary CDN or package name. That is operationally
convenient, but it lets mutable hosting and version resolution decide what old
art executes.

## Collection metadata separates claims by purpose and authority

Collection metadata is different from token metadata. It can carry artist
statements, rights, preservation locations, fixity evidence, institutional
records, media relationships, and presentation context.

Separating those records avoids giving one broad "metadata admin" every
artwork-adjacent power. A party authorized to update a public description should
not automatically be able to replace scripts, supply, revenue policy, or the
artist's own statement.

The pinned source provides a closed family-to-writer model:

| Record family      | Purpose                                                                        | Allowed source classes                                  | Why the distinction matters                                                    |
| ------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Artist             | Statement attributed to the recognized artist                                  | Artist signer only                                      | Separates the artist's words from platform or third-party commentary           |
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
cannot later be remapped to another family. See
[`StreamRecordFamilyRegistry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRecordFamilyRegistry.sol#L85-L228).

The source contains these authorization rules. The candidate's actual admitted
record types, live authority providers, grants, runtime code hashes, and
rotation or revocation evidence are not yet published. The family model should
not be presented as proof that a future deployment recognizes the correct
wallets.

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
and underlying records may continue to change until their own lock or Core
freeze.

Snapshot publication itself does not check Core collection freeze. That allows
an authorized writer to snapshot already-frozen record state if the snapshot
locks remain open. Nonreserved record-specific locks can also still be added
after Core freeze. These are narrower actions than revising frozen records, but
they must appear in any explanation of what freeze means.

See
[`publishCollectionSnapshot`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCollectionMetadata.sol#L124-L180)
and
[`_requireSnapshotFamilyIntersection`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCollectionMetadata.sol#L504-L524).

## Shared contract metadata is not an artist's token identity

Contract-level metadata describes the shared Stream ERC-721 surface. It can
affect marketplace-facing name, description, image, and links for every
collection.

The current
[`updateContractURI`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamContractMetadata.sol#L109-L145)
checks metadata pause and function-admin authority, but it does not consult an
individual collection's Core freeze.

A frozen artwork collection and the shared contract's presentation are
therefore different states. A label can change without changing ownership,
token identity, or the collection's frozen artwork inputs. That does not make
shared presentation unimportant; it means the authority and promise must be
named accurately.

## Refresh events tell consumers that state changed

Core implements ERC-4906 refresh signals for specific mutation paths:

- token-data and image/attribute changes emit `MetadataUpdate(tokenId)`;
- live-token randomness fulfillment emits `MetadataUpdate(tokenId)`;
- collection-info and metadata-mode changes emit a broad
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

The accepted launch target also calls for restricted Core helpers that
authorized satellite contracts can use to emit standard ERC-4906 signals plus
Stream-native context. No such public or external helper exists in the pinned
Solidity. Exact caller checks, lifecycle and range bounds, abuse analysis,
implementation, and tests remain target work. See the
[`launch target`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/launch-v1-target-architecture.md#L320-L333).

## Size limits protect more than gas

Onchain strings and chunks cost gas to write and can produce large `eth_call`
responses. Limits must be meaningful at several layers:

- transaction and block gas;
- deployed bytecode;
- RPC response size;
- wallet and marketplace parsers;
- browser memory and execution time.

A unit test that accepts a maximum value does not prove that ordinary public RPC
providers or consumer applications can retrieve and render it. Maximum-size
evidence should exercise the real delivery path.

## The browser is part of the artwork's environment

Generative HTML and JavaScript ultimately execute in software Stream does not
control. Browser engines, security policies, APIs, fonts, codecs, GPUs, timing,
randomness APIs, and cross-origin rules change.

Where reproducibility matters, source code alone may be insufficient. A useful
preservation package can need:

- exact dependency and asset bytes;
- browser or runtime version;
- fonts and codecs;
- build and replay instructions;
- expected metadata and animation hashes;
- a reference output or browser proof.

The contract can remain secure while the artwork stops rendering. Contract
security and artwork preservation are related but distinct release
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

"Fully onchain" should be the conclusion of that evidence, with a defined
scope—not a publisher-selected marketing badge.

## What a simpler design would externalize

A base URI and mutable JSON server can eliminate much of this contract surface.
It also lets external operators determine:

- which image or animation a token displays;
- which script and dependency version executes;
- whether historical bytes remain available;
- which statements really came from the artist, owner, institution, or third
  party;
- whether a collection was reconstructed completely;
- whether consumer-visible content changed after a supposed freeze.

That can be a legitimate architecture when the trust model is explicit.
Stream's metadata complexity exists because it is trying to make more of those
responsibilities durable, attributable, and independently verifiable.

The right simplification is to consolidate duplicate writers and representations
while preserving exact provenance and authority—not to replace them with an
opaque server.

## What can fail

- Artist-controlled text breaks or changes constructed JSON, HTML, JavaScript,
  SVG, or URI meaning.
- A dependency version is mutable or incompletely hashed.
- An external asset disappears despite a valid onchain hash.
- Chunk order or completeness is ambiguous.
- A metadata writer has authority over the wrong record family.
- The deployed authority providers or grants do not match the reviewed model.
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
