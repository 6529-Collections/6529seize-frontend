# Metadata, scripts, and dependencies

Stream supports artwork that can be described entirely onchain, artwork whose
files live elsewhere, and generative work that combines token data, scripts,
and versioned dependencies. These are different preservation models. The UI
should not collapse them into one “onchain” badge.

The principal renderer is
[`StreamMetadataRenderer.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMetadataRenderer.sol).
Collection-level metadata is in
[`StreamCollectionMetadata.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCollectionMetadata.sol),
contract-level metadata is in
[`StreamContractMetadata.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamContractMetadata.sol),
and reusable library records are in
[`DependencyRegistry.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/DependencyRegistry.sol).

## Token metadata modes

### IMPLEMENTED

The renderer can produce a token URI from stored configuration and token state.
Depending on the selected mode, the output can refer to external metadata or
assemble JSON and artwork instructions onchain.

“Onchain metadata” can mean several things:

- the token URI itself returns an encoded JSON document;
- the JSON contains an encoded image or HTML document;
- the JSON points to an onchain script but imports other dependencies;
- the JSON or image points to IPFS, Arweave, HTTPS, or another external
  location.

Reviewers should identify which bytes are onchain at every layer, not infer it
from the first data URI.

## JSON and URI construction

The renderer constructs strings that wallets, marketplaces, browsers, and
indexers will parse.

### REVIEW CHECK

Every artist-controlled value used in JSON, SVG, HTML, JavaScript, or a URI
needs context-appropriate encoding. Escaping valid JSON is not automatically
safe inside HTML or JavaScript. Encoding for an HTML attribute is not
automatically safe in a URL.

Reviewers should test:

- quotes, backslashes, newlines, null bytes, and control characters;
- Unicode, combining characters, right-to-left text, and invalid UTF-8;
- closing script or HTML tags in artist text;
- very long names, descriptions, attributes, and URLs;
- data URI media types and base64 boundaries;
- integer and boolean values that must not accidentally become quoted strings;
- client behavior when the return value is too large for an RPC provider.

The contract may produce valid bytes that some consumers refuse to display.
Compatibility evidence needs real wallets, indexers, marketplaces, browsers,
and RPC services.

## Scripts and token data

### IMPLEMENTED

Collections can store or reference scripts and data used to render generative
artwork. Script order matters. So do the exact bytes, encoding, and the point at
which the script set becomes immutable.

A hash can establish that a retrieved script is the committed script. It does
not make the script retrievable. An external URI plus a hash has two separate
properties:

1. integrity—whether the bytes match; and
2. availability—whether anyone can still obtain the bytes.

Artists should be able to inspect both properties before approving finality.

## Dependency registry

### IMPLEMENTED

The dependency registry records reusable libraries by name and version. A
dependency can be represented in chunks and accompanied by content hashes,
locations, or pinning information. Versions are distinct records; updating a
library should create a new version rather than silently changing what an old
version means.

Important lifecycle questions include:

- who can create a dependency name;
- who can publish another version;
- when the byte content or chunk list becomes fixed;
- whether a version can be deprecated without breaking existing artwork;
- whether a URI is mutable;
- which hash covers which representation;
- how consumers know they fetched every chunk in the correct order.

Deprecation should warn against new use. It must not erase the evidence needed
to render existing work.

## Collection metadata

Collection metadata is separate from token metadata. It can include the
collection's public description and presentation information.

This separation is useful, but it creates an authorization question: a party
who may update a collection description should not automatically gain the power
to replace token scripts, mint supply, revenue policy, or final artwork.

The review should identify each metadata record family, its writer, its freeze
condition, and its emitted event. “Artist metadata” is too broad a permission
description.

### SOURCE IMPLEMENTED - CANDIDATE UNBOUND

The source now provides an exact family-to-writer matrix:

| Record family | Plain-language purpose | Allowed source classes | Why an artist or collector should care |
| --- | --- | --- | --- |
| Artist | A statement attributed to the recognized artist, such as intent or work context | Artist signer only | Separates the artist's own statement from platform or third-party commentary |
| Owner | A statement attributed to the recognized current owner | Owner signer only | Shows that the claim came from an owner, not that the artist endorsed it |
| Independent | A self-attributed third-party observation or analysis | Independent attestor only | Anyone may write one; it is evidence of authorship, not protocol approval |
| Curator | Curatorial selection, interpretation, or exhibition context | Curator signer or global admin | Identifies who supplied curatorial framing and which admin can also write it |
| Institution | A museum, archive, university, or other recognized institution's attestation | Institution signer only | Lets readers distinguish institutional evidence from artist or owner claims |
| Rights | Copyright, license, usage, or permissions information | Metadata admin or global admin | Affects how the work may be displayed or reused; the record is not legal advice |
| Archive | Where preservation materials or manifests are held | Preservation admin or global admin | A location record does not guarantee the bytes will remain available |
| Fixity | Checksums, sizes, or other evidence used to test whether bytes changed | Institution signer, preservation admin, or global admin | Helps detect alteration when the referenced bytes can still be retrieved |
| C2PA | Content-provenance credentials using the Coalition for Content Provenance and Authenticity format | Institution signer, preservation admin, or global admin | Can carry signed creation/edit history; Stream does not make the credential true merely by recording it |
| IIIF | An International Image Interoperability Framework manifest or presentation endpoint | Preservation admin, metadata admin, or global admin | Helps compatible viewers retrieve and present high-resolution cultural-heritage media |
| Media relationship | How files relate, for example master, derivative, thumbnail, audio track, or alternate rendering | Preservation admin or metadata admin | Prevents a preview or derivative from being mistaken for the canonical artwork |
| Identity display | Preferred human-readable names, credits, and attribution display | Metadata admin or global admin | Affects presentation, but does not replace the underlying wallet/provider authority |
| Snapshot | An immutable commitment to a selected set of metadata records at one point in time | Metadata admin or global admin | Lets later readers compare a known bundle with newer records |
| Agent | A record about an automated agent, service, or machine-produced action | Metadata admin or global admin | Makes automation visible; it does not independently prove the agent was safe or authorized |

These names are authorization families, not semantic validators. The registry
decides who may write an admitted record type; it does not verify the truth of a
rights claim, preservation location, C2PA credential, IIIF response, or agent
statement. Exact record schemas and consumer behavior still need review.

Artist, owner, independent, and institution families reject admin grants. An
independent-attestor write is permissionless and self-attributed; it is not a
protocol endorsement. Exact record types are admitted once and cannot later be
remapped. The implementation is in
[`StreamRecordFamilyRegistry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRecordFamilyRegistry.sol#L85-L228).

The candidate's actual record-type admission set, live artist/owner/institution
providers, grants, runtime code hashes, and rotation/revocation evidence are not
available. The family matrix is source behavior; it is not deployment proof.

## Collection metadata snapshots

### SOURCE IMPLEMENTED

A snapshot is an immutable record with its own `snapshotId`, record hash, and
hash of the covered record-type list. Publication requires:

1. an admitted snapshot-family record type;
2. authority to write that snapshot type;
3. a nonempty, strictly ascending list of exact covered record types;
4. fresh authorization for every covered record type;
5. an unlocked snapshot path.

A snapshot is therefore not a permission shortcut. The contract emits one
authorization event for every covered record type. Published snapshots are
immutable, but a later snapshot can become the `latest` snapshot. Underlying
records can also change until their own lock or the Core collection freeze.

Snapshot publication does not itself check Core collection freeze. That allows
an authorized writer to snapshot already-frozen record state, provided the
snapshot locks remain open. Nonreserved record-specific locks can also still be
set after Core freeze. These are narrower post-freeze metadata actions than
revising a record, but they must be included in the freeze explanation.

See
[`publishCollectionSnapshot`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCollectionMetadata.sol#L124-L180)
and
[`_requireSnapshotFamilyIntersection`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCollectionMetadata.sol#L504-L524).

## Contract metadata

Contract-level metadata describes the shared Stream collection surface. It is
not owned by a single artist. Changes to contract-level name, description,
image, links, or marketplace presentation can affect every collection and need
a protocol-level authority.

The current `StreamContractMetadata.updateContractURI` path checks metadata
pause and function-admin authority, but it does not consult an individual
collection's Core freeze. A frozen artwork collection and the shared
marketplace-facing contract description are therefore different states. See
[`updateContractURI`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamContractMetadata.sol#L109-L145).

Reviewers should distinguish display metadata from ERC-721 identity. A website
label may change without changing token ownership or collection identity, but
that does not make the change unimportant.

## Refresh signals

### IMPLEMENTED

Core implements ERC-4906 and emits refresh signals as part of specific internal
state changes. `changeTokenData`, `updateImagesAndAttributes`, and live-token
randomness fulfillment emit `MetadataUpdate(tokenId)`. Collection-info and
metadata-mode changes call a private helper that emits
`BatchMetadataUpdate(1, lastAllocatedTokenId)` when the collection has minted
tokens. The range is intentionally a superset because global token IDs from
different Stream collections can interleave.

See the token-level emissions in
[`StreamCore.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L786-L823),
the randomness emission in
[`setTokenHash`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L844-L883),
and the collection helper in
[`_emitCollectionMetadataUpdate`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L1035-L1044).

These events are notifications, not enforcement. Consumers can ignore them,
cache for longer than expected, or interpret the broad batch range
differently.

### TESTED

`StreamMetadataEvents.t.sol` verifies ERC-4906 interface support, token-level
emissions, collection-level batch emissions, and the intentional absence of
signals for premint or post-burn randomness and empty-collection changes. See
[`StreamMetadataEvents.t.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/test/StreamMetadataEvents.t.sol#L24-L183).

### ACCEPTED TARGET - NOT IMPLEMENTED

The launch target calls for restricted single-token and batch Core helpers that
authorized satellite contracts can use to emit standard ERC-4906 signals plus
Stream-native refresh context. No such public or external helper exists in the
reviewed Solidity. The accepted target still needs its exact caller checks,
token-lifecycle and range bounds, context binding, abuse analysis,
implementation, and tests. See the
[`launch target`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/launch-v1-target-architecture.md#L320-L333)
and the
[`Permanent interface inventory`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/release-artifacts/stream-core-permanent-interface.json#L2970-L3000).

Do not confuse Core's private refresh-record helper or its mutation-triggered
ERC-4906 emissions with a callable manual refresh API.

### SOURCE IMPLEMENTED - CANDIDATE UNBOUND

Record-family checks now exist in source and persist the authorization class on
metadata and preservation records. The remaining blocker is candidate-bound
evidence: admissions, providers, grants, runtime/code-hash bindings,
rotation/revocation exercises, and independent review. A stale risk-register
title still describes the historical whole-module problem; the source catalog
records the present state.

## Size and gas

Onchain strings and chunks cost gas to write and can produce large `eth_call`
responses. The protocol needs explicit limits that are meaningful at:

- transaction execution;
- block gas limits;
- RPC response limits;
- wallet and marketplace parsers;
- browser memory and execution time.

A local unit test that accepts a maximum-length value is not sufficient if
ordinary public RPC providers reject the resulting token URI.

## Browser execution is an external dependency

Generative HTML and JavaScript ultimately run in software Stream does not
control. Browser engines change. Security policies change. APIs disappear.
Fonts, codecs, GPU behavior, timing, randomness APIs, and cross-origin rules can
change the output.

Artwork intended to remain reproducible should state its execution assumptions.
Where exact pixel reproduction matters, the preservation package may need more
than source code: browser version, dependency bytes, fonts, assets, build
instructions, and a reference output can all matter.

## What we think

Every collection should have a human-readable dependency bill of materials.
It should show which bytes are stored onchain, which are content-addressed,
which are conventional URLs, which can still change, and what software is
required to render them.

“Fully onchain” should be an evidence-backed description with a defined scope,
not a visual badge selected by the publisher.

## What can fail

- artist text breaks or changes the meaning of constructed JSON or HTML;
- a dependency version is mutable or incompletely hashed;
- an external asset disappears even though its hash remains onchain;
- chunk ordering or completeness is ambiguous;
- a metadata writer has authority over the wrong record family;
- a future external refresh helper can be abused or target unrelated tokens;
- the broad implemented collection refresh range creates unnecessary indexer
  work;
- an RPC, indexer, wallet, or browser cannot process the returned data;
- a future runtime renders the same script differently.

## Questions for reviewers

1. Which metadata modes should Stream describe as fully onchain?
2. Are all artist-controlled values encoded for the context where they appear?
3. Should dependency deprecation ever block use, or only warn?
4. Which exact metadata writes require the artist's approval?
5. Is an external manual refresh helper needed, and if so who may call it for
   which exact token or range?
6. What maximum sizes have been tested through real consumer infrastructure?
7. What must an artist preserve outside the chain for a generative work to
   remain reproducible?
