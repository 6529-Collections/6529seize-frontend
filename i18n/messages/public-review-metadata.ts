export const PUBLIC_REVIEW_METADATA_MESSAGES = {
  "publicReview.pages.metadataScriptsAndDependencies.currentEditorial": `# Metadata, scripts, and dependencies

Metadata is the information and code needed to find, describe, and display an
artwork. It can include token data, images, animation, scripts, shared software,
links, hashes, and records of who made each claim.

This page asks one main question: could an independent person rebuild the work,
check that it is the intended version, and see what can still change?

## One-minute explanation

Stream metadata can be built from contract state, point to material stored
elsewhere, or combine both. Generative artwork can also use token data,
randomness, collection scripts, and a named version of a shared code library. A
work should be called fully onchain only after every required layer is checked.

### What the pinned code does

The reviewed smart-contract code, written in Solidity, can build onchain or
offchain token metadata. It validates and limits stored inputs, protects the JSON
and HTML wrapper, hashes ordered script chunks, creates versioned dependency
records, records who may write each kind of collection claim, and emits metadata
refresh events for changes made in Core, the shared token contract. See the exact
[`StreamMetadataRenderer` code](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMetadataRenderer.sol#L51-L383).

### What the accepted design says

[`ADR 0006`](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0006-metadata-freeze.md#L96-L145)
is the accepted metadata and freeze design. It says pending and final metadata
must be distinct, dependency versions must not be silently replaced, frozen
collections must commit to their rendering inputs, and metadata changes must be
announced. The ADR records intent. The Solidity and release evidence show which
parts exist in this reviewed version.

### What is still open

The pinned Core does not yet have the accepted restricted helpers that would let
approved support contracts, called satellites, emit standard metadata refresh
signals. Public RPC, wallet, marketplace, indexer, browser, and long-term
file-retrieval evidence is also still incomplete.

### Why this matters

A valid hash proves that available bytes match a commitment. It does not keep
those bytes online, make old software run, or prove that common apps can process
the result. This public review is not proof of launch, deployment, audit, or
safety.

## The first question is: where are the bytes?

Reviewers need to distinguish four broad setups:

- all required artwork data and code are stored onchain;
- token metadata or media is loaded from an outside location;
- generative art combines token data, randomness, collection scripts, and a
  named dependency version;
- a hybrid keeps commitments onchain while some required bytes live elsewhere.

The main rendering code is
[`StreamMetadataRenderer.sol`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMetadataRenderer.sol).
Collection records are handled by
[`StreamCollectionMetadata.sol`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCollectionMetadata.sol),
shared contract presentation by
[`StreamContractMetadata.sol`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamContractMetadata.sol),
and shared code libraries by
[`DependencyRegistry.sol`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/DependencyRegistry.sol).

"Onchain metadata" is not precise enough by itself. It may mean only that
`tokenURI()` returns JSON from the contract. The JSON may still point to an
outside image, HTML file, script, font, library, or service.

For every layer, reviewers should ask:

- Which exact bytes are on Ethereum?
- Which bytes are found by a content hash, such as an IPFS address?
- Which bytes are found only through a normal URL or domain?
- Which program, browser, font, codec, or service is needed to use them?
- Who can change each value, and when does that power end?

A work is self-contained only if every required layer, including its
dependencies, is inside the stated boundary.

## Metadata modes express different preservation promises

The pinned code supports two main token-metadata paths.

- **Offchain mode:** `tokenURI()` builds a location from the collection base URI
  and the token's metadata state or token ID.
- **Onchain mode:** `tokenURI()` returns base64-encoded JSON. Final metadata can
  also include generated HTML and JavaScript.

Pending, stale, failed, and final metadata are separate states. The onchain path
adds the generated animation only after the token has final randomness. See the
[`onchain and offchain builders`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMetadataRenderer.sol#L138-L383).

An admin with permission for the exact update function can change collection
metadata and switch its mode while the collection remains mutable. Core rejects
those changes after collection freeze. Artist approval is a separate check; it
is not the same power as metadata administration.

The interface should state the exact promise instead of using a broad "onchain"
label. Artists and collectors need to know:

- whether the JSON is built onchain;
- whether image or animation bytes are embedded or linked;
- whether scripts are stored in chunks or loaded elsewhere;
- which dependency name and version are used;
- whether any URL can still change;
- which hash covers each representation;
- which values remain mutable;
- what an independent person needs to rebuild the work.

## String construction is a security boundary

Wallets, marketplaces, indexers, RPC clients, and browsers read contract output
as JSON, a URI, HTML, or JavaScript. A value that is safe in one format can break
out of another format and change its meaning.

The current renderer includes:

- JSON-string escaping;
- HTML-attribute escaping;
- JavaScript single-quoted-string escaping;
- handling for closing script tags;
- UTF-8 validation;
- URI scheme and character checks;
- validation for the raw attributes fragment;
- byte and count limits for text, token data, images, attributes, scripts, and
  the final token URI.

See the exact
[`validation and encoding code`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMetadataRenderer.sol#L453-L925).

These checks protect the wrapper. They do not make artist scripts or dependency
code safe to execute. Reviewers should still test quotes, slashes, control
characters, invalid UTF-8, right-to-left text, closing tags, long values, data
URIs, typed attributes, and outputs near real consumer limits.

A contract may return bytes that satisfy its own rules while a public RPC,
wallet, marketplace, indexer, or browser refuses or truncates them. Compatibility
needs evidence from those real consumers.

## Scripts are ordered, byte-exact artwork inputs

Collection scripts and token data can help produce generative artwork. Their
exact bytes, encoding, chunk order, and dependency order all matter.

The current renderer hashes every collection-script chunk with its index, byte
length, and content hash. It then hashes the ordered sequence. Reordering,
removing, or changing a chunk therefore changes the final script hash. See
[`collectionScriptHash`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMetadataRenderer.sol#L276-L288).

An authorized admin can update collection data before freeze. Core blocks these
updates after collection freeze. The artist's approval record can show support
for one exact collection state, but the approval role and the admin role remain
different.

A hash answers one question:

> If these bytes are available, do they match the committed work?

Availability is separate:

> Can anyone still obtain and run these bytes?

An external URI plus a hash needs both answers. Storage, domain renewal, gateway
access, and runtime preservation remain operating duties.

## Versioned dependencies prevent silent library replacement

Generative art often uses a shared library. In the pinned
[`DependencyRegistry`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/DependencyRegistry.sol#L75-L125),
an admin with permission for the exact function creates a new numbered version.
Even the function that changes one chunk copies the prior chunks and creates
another version; it does not edit the old version's script bytes.

Each version records:

- its ordered script chunks;
- a hash for each chunk, including its index and byte length;
- one content hash for the complete ordered script;
- provenance text;
- the creator, block, and time of creation;
- a deprecation flag;
- size and chunk-count limits.

See the exact
[`version and hash code`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/DependencyRegistry.sol#L239-L400).

Deprecation is a warning for future use. It does not delete or replace the old
version's bytes. Core also pins a collection to a dependency key, version,
content hash, and registry address when the collection is created or fully
updated. Freeze includes that pinned state in the collection commitment. See
[`dependency pinning`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L949-L973).

Reviewers should still confirm who controls the relevant admin function, which
versions are packaged outside the contract, and whether every chunk remains easy
to retrieve. Versioning prevents silent replacement. It does not preserve an
outside copy by itself.

## Collection metadata separates claims by purpose and authority

Collection metadata is not the same as token metadata. It can hold artist or
owner statements, rights claims, archive locations, fixity evidence, museum
records, media relationships, and display context.

The pinned code assigns each admitted record type to one family. Each family has
a limited set of allowed writer classes:

| Record family | Main purpose | Who the pinned code allows to write |
| --- | --- | --- |
| Artist | A statement attributed to the artist | Artist signer only |
| Owner | A statement attributed to the current owner | Owner signer only |
| Independent | A self-attributed outside observation | Any independent attestor, writing as itself |
| Curator | Selection, exhibition, or interpretation | Curator signer or global admin |
| Institution | A museum, archive, or university statement | Institution signer only |
| Rights | Copyright, license, or use information | Metadata admin or global admin |
| Archive | A location for preservation material | Preservation admin or global admin |
| Fixity | Hashes, sizes, or other change-detection evidence | Institution signer, preservation admin, or global admin |
| C2PA | Content-provenance credential context | Institution signer, preservation admin, or global admin |
| IIIF | Cultural-heritage display or retrieval context | Preservation admin, metadata admin, or global admin |
| Media relationship | Master, preview, soundtrack, or other media relationship | Preservation admin or metadata admin |
| Identity display | Preferred names, credits, or display attribution | Metadata admin or global admin |
| Snapshot | A fixed view of selected records at one time | Metadata admin or global admin |
| Agent | A record of automated or machine-produced work | Metadata admin or global admin |

Artist, owner, independent, and institution families reject admin grants. An
exact record type can be admitted only once and keeps its family mapping. See the
[`family and writer rules`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRecordFamilyRegistry.sol#L85-L228).

The registry proves who was allowed to write. It does not prove that a rights
claim, archive location, credential, IIIF service, or automated statement is
true. Launch evidence must also bind the admitted record types, live authority
providers, grants, code hashes, and later rotations or revocations.

## Snapshots preserve an authorized view

A collection snapshot is a new, locked record with its own ID and hash. It also
stores a hash of the exact record-type list it covers.

Publishing one requires:

1. an admitted snapshot-family record type;
2. authority to write that snapshot type;
3. at least one covered record type, in strict ascending order;
4. fresh authority to write every covered record type;
5. an open metadata, snapshot, and record-specific lock path.

The contract checks every covered family and emits the authorization class used
for each one. See
[`publishCollectionSnapshot`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCollectionMetadata.sol#L124-L180)
and
[`_requireSnapshotFamilyIntersection`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCollectionMetadata.sol#L504-L524).

A snapshot does not freeze the underlying records. Those records can keep
changing until their own lock or Core freeze stops them. A later snapshot can
become `latest` without changing an older snapshot.

The pinned code still allows an authorized writer to publish a snapshot after
Core collection freeze if the snapshot path remains unlocked. It also allows
nonreserved record-specific locks after Core freeze. A statement about
"freezing metadata" must name these remaining actions.

## Shared contract metadata serves the ERC-721 surface

Contract-level metadata describes the shared Stream contract, not one artwork
collection. It can change the name, description, image, or links shown for the
shared surface.

In the pinned code, a global admin or an admin permitted for the exact function
can call
[`updateContractURI`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamContractMetadata.sol#L109-L145)
when metadata mutation is not paused. This separate adapter is outside an
individual collection's Core freeze.

This matches the accepted direction in ADR 0006: shared contract presentation is
governed and evented, but it is not part of a collection freeze manifest. A
collection's artwork inputs can therefore be frozen while the shared label or
link still changes. The interface must describe that difference clearly.

Third-party apps that inspect only the ERC-721 Core may not discover a separate
adapter. Marketplace and wallet support still needs real integration evidence.

## Refresh events tell consumers that state changed

The pinned Core emits standard ERC-4906 signals on current Core mutation paths:

- token-data changes and image or attribute changes emit
  `MetadataUpdate(tokenId)`;
- randomness fulfillment for a live token emits `MetadataUpdate(tokenId)`;
- collection-info or metadata-mode changes emit
  `BatchMetadataUpdate(1, lastAllocatedTokenId)` when the collection has minted
  tokens.

See the
[`token-level emissions`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L786-L823),
[`randomness emission`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L844-L883),
and
[`collection helper`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L1035-L1044).

The collection range is deliberately broad. Stream token IDs are global, so
tokens from different collections can appear inside the same range. Consumers
must treat the event as a refresh hint and decide what to fetch again.

The accepted launch target also calls for restricted Core helpers that approved
support contracts can use. Those helpers would emit the standard event plus
Stream-specific context and would limit callers and ranges. They are
[`required by the accepted target`](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/launch-v1-target-architecture.md#L320-L333),
but no matching public or external helper exists in the pinned Solidity. Caller
checks, lifecycle checks, range limits, abuse analysis, implementation, and tests
remain open work.

An event does not force a wallet, marketplace, or indexer to refresh. Each
consumer controls its own cache and its handling of broad ranges.

## Size limits protect delivery and execution

The current renderer limits collection text to 2,048 bytes, token data to 4,096
bytes, token image URIs to 2,048 bytes, raw attributes to 8,192 bytes,
collection script chunks to 8,192 bytes with at most 32 chunks, and a generated
token URI to 65,536 bytes. The dependency registry also limits each script chunk
to 8,192 bytes, each script to 32 chunks, and provenance text to 2,048 bytes.

These limits stop some oversized writes and responses. They do not prove that a
maximum result is practical through:

- transaction and block gas;
- the deployed bytecode limit;
- public RPC response limits;
- wallet, marketplace, and indexer parsers;
- browser memory and execution time.

Maximum-size evidence should use normal public RPC providers and real consumer
applications. Local contract tests are not enough.

## The browser is part of the artwork's environment

Generative HTML and JavaScript run in outside software. Browser engines, security
policies, APIs, fonts, codecs, graphics hardware, timing, and cross-origin rules
can change.

Preserving the source code may therefore be insufficient. A useful preservation
package can also need:

- exact dependency and asset bytes;
- a browser or runtime version;
- fonts and codecs;
- build and replay instructions;
- expected metadata, animation, and output hashes;
- a reference image or browser proof.

Contract security and artwork replay are different kinds of evidence. Both
matter before release, but neither proves the other.

## Every collection needs a dependency bill of materials

A dependency bill of materials is a plain list of everything needed to rebuild
the work. It should state:

- which bytes are onchain;
- which bytes are found by a content hash;
- which locations are normal URLs;
- which dependency names and versions are required;
- which values can still change;
- who can change each value;
- which hash covers each representation;
- which browser, font, codec, or service assumptions remain;
- how an independent person can rebuild the work from durable public material.

"Fully onchain" should be the conclusion of this evidence, with a clearly stated
scope. It should not be the starting label.

## Responsibilities carried by metadata records

Stream metadata records can help people determine:

- which image or animation a token should display;
- which collection script and dependency version should run;
- where historical bytes are meant to be retained;
- whether a statement came from an artist, owner, institution, or another party;
- whether a reconstruction includes every committed part;
- whether consumer-visible content changed after a freeze.

Each value should have one clear writer and one canonical representation. These
records can make claims attributable and bytes verifiable when the referenced
material and outside evidence remain available.

## What can fail

- Artist-controlled text breaks out of its intended JSON, HTML, JavaScript, SVG,
  or URI context.
- A dependency's bytes, version, order, or complete hash is unclear.
- An outside asset disappears even though its onchain hash remains valid.
- A writer can publish a claim under the wrong record family.
- Live authority providers or grants differ from the reviewed model.
- A snapshot or record lock is mistaken for a wider freeze.
- A broad refresh signal causes unrelated work or an unbuilt helper is assumed
  to exist.
- A public RPC, wallet, indexer, marketplace, or browser cannot process the
  output.
- Future software renders the same source differently.
- Review availability is mistaken for deployment, audit, launch, or safety
  proof.

## Questions for reviewers

1. Which exact bytes must be present before a Stream collection can be called
   fully onchain?
2. Is every artist-controlled value encoded for every place where it appears?
3. Do dependency records make byte content, chunk order, provenance, version,
   and deprecation clear?
4. Which metadata changes need direct artist approval, and which use an admin?
5. Are record families narrow enough to stop one actor from speaking as another?
6. Which snapshot and lock actions remain possible after Core freeze, and does
   the interface explain them?
7. Which contracts should be allowed to request a metadata refresh, and for
   which tokens or ranges?
8. What maximum sizes have been tested through real RPC and consumer systems?
9. What must remain available outside Ethereum for each artwork mode to stay
   reproducible?`,
} as const;
