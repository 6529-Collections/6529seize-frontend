# Metadata, scripts, and dependencies

Stream supports artwork that can be described entirely onchain, artwork whose
files live elsewhere, and generative work that combines token data, scripts,
and versioned dependencies. These are different preservation models. The UI
should not collapse them into one “onchain” badge.

The principal renderer is
[`StreamMetadataRenderer.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamMetadataRenderer.sol).
Collection-level metadata is in
[`StreamCollectionMetadata.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamCollectionMetadata.sol),
contract-level metadata is in
[`StreamContractMetadata.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamContractMetadata.sol),
and reusable library records are in
[`DependencyRegistry.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/DependencyRegistry.sol).

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

## Contract metadata

Contract-level metadata describes the shared Stream collection surface. It is
not owned by a single artist. Changes to contract-level name, description,
image, links, or marketplace presentation can affect every collection and need
a protocol-level authority.

Reviewers should distinguish display metadata from ERC-721 identity. A website
label may change without changing token ownership or collection identity, but
that does not make the change unimportant.

## Refresh signals

### IMPLEMENTED

The protocol uses ERC-4906-style metadata update events so indexers can refresh
affected tokens. Events are notifications, not enforcement. Consumers can
ignore them, cache for longer than expected, or interpret ranges differently.

The Core also exposes external metadata refresh helpers. Because a refresh can
make downstream consumers refetch large ranges, reviewers should verify the
caller's authority and the target restrictions. A public notification function
may not change storage, but it can still create indexing load or misleading
signals.

### KNOWN LIMITATION

The current risk register identifies Core metadata/preservation record-family
authorization as incomplete in several selector-level paths. That issue must be
resolved in code and tests, not papered over by describing the intended caller.

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
- refresh functions can be abused or target unrelated tokens;
- an RPC, indexer, wallet, or browser cannot process the returned data;
- a future runtime renders the same script differently.

## Questions for reviewers

1. Which metadata modes should Stream describe as fully onchain?
2. Are all artist-controlled values encoded for the context where they appear?
3. Should dependency deprecation ever block use, or only warn?
4. Which exact metadata writes require the artist's approval?
5. What maximum sizes have been tested through real consumer infrastructure?
6. What must an artist preserve outside the chain for a generative work to
   remain reproducible?
