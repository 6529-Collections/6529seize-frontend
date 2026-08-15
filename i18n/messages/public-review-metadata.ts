export const PUBLIC_REVIEW_METADATA_MESSAGES = {
  "publicReview.pages.metadataScriptsAndDependencies.currentEditorial": `# Metadata, Scripts, and Dependencies

The basic chain is:

1. **Metadata says what the NFT is and how apps should show it.**
2. **Scripts use the NFT's inputs to make or display the artwork.**
3. **Dependencies are shared code that those scripts need.**
4. **The files and the software that runs them must remain available.**

The exact file data is called **bytes**. A **hash** is a digital fingerprint of
those bytes. It can show whether a file changed.

This page asks whether another person could rebuild the work, check that it is
the right version, and see what can still change.

## One-minute explanation

Stream can build metadata from data on Ethereum, point to files elsewhere, or
do both. The important question is not only whether metadata is called
"onchain." The important question is where every needed part lives.

### What the pinned code does

The reviewed Solidity code has onchain and offchain modes. It separates pending
metadata from final metadata. It checks input sizes and text. It hashes script
chunks in order. A dependency change creates a new version. Core saves the
chosen dependency state. Core is the shared token contract. A Core freeze then
commits to the main rendering inputs.

See the exact [\`StreamMetadataRenderer\` code](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMetadataRenderer.sol#L51-L383).

### What the accepted design says

[\`ADR 0006\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0006-metadata-freeze.md#L96-L145)
is accepted. It separates pending from final metadata. It requires new,
unchanged dependency versions. It also says a freeze must commit to rendering
inputs and metadata changes must emit notices.

[\`ADR 0004\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0004-admin-governance.md#L104-L145)
is also accepted. It says each admin power should be narrow and easy to audit.

An ADR records the agreed design. The pinned code shows what was built in this
reviewed version.

### What is still open

The accepted launch target calls for restricted Core helpers. Approved support
contracts would use them to send metadata refresh notices. However, no matching public or external helper exists in the pinned Solidity.

Real-world proof is also incomplete. The review does not yet prove that the
largest allowed responses work in common apps or that outside files will stay
available.

### Why this matters

A hash can prove that an available file is the expected file. It cannot bring a
missing file back.

For example, a contract may save the hash of an image. If the only server with
that image goes offline, the hash can still check a recovered copy. But the
hash cannot download the missing image by itself.

This public review is not proof of launch, deployment, audit, or safety.

## The first question is: where are the bytes?

The needed bytes may be in four places:

- **On Ethereum:** the contract stores the data.
- **At a content address:** a hash-based address, such as IPFS, identifies the
  data. A working source is still needed to fetch it.
- **At a normal URL:** a server and domain provide the data. The owner may
  change it, move it, or stop serving it.
- **In outside software:** a browser, font, codec, or other program is needed to
  run or display the work.

The main renderer is
[\`StreamMetadataRenderer.sol\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMetadataRenderer.sol).
Collection records are in
[\`StreamCollectionMetadata.sol\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCollectionMetadata.sol).
Shared contract presentation is in
[\`StreamContractMetadata.sol\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamContractMetadata.sol).
Shared code libraries are in
[\`DependencyRegistry.sol\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/DependencyRegistry.sol).

"Onchain metadata" is not precise enough by itself. A contract may return JSON
but still point to an outside image, script, font, or library.

For each part, ask:

- Where are the exact bytes?
- What hash covers them?
- Who can change them?
- What software is needed to use them?
- What happens if the normal host disappears?

A work is self-contained only when every required part is inside the boundary
being claimed.

## Metadata modes express different preservation promises

The pinned Core, which is the shared token contract, supports two modes.

- **Offchain mode:** \`tokenURI()\` returns a normal location. Before final
  randomness, the location ends with the current metadata state. After final
  randomness, it ends with the token ID.
- **Onchain mode:** \`tokenURI()\` returns base64-encoded JSON. The JSON names
  its schema version and current state. It adds the generated animation only
  after the token has final randomness.

See the
[\`onchain and offchain builders\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMetadataRenderer.sol#L130-L383).

The states include pending, stale, failed, and final. They show whether the
final random input is ready. Pending metadata must not look final.

An onchain JSON response can still include an outside library URL. So the page
must say which part is onchain. It should not use one broad label for the whole
work.

Before Core collection freeze, an admin with the exact permission can update
collection metadata or switch the mode. Core blocks these changes after freeze.
Artist approval is separate from admin permission.

## String construction is a security boundary

Wallets and browsers read the same contract output in different ways. One value
may pass through JSON, a URI, HTML, and JavaScript. Text that is safe in one
place can break out in another place.

The pinned renderer includes checks for:

- JSON strings;
- HTML attributes;
- single-quoted JavaScript strings;
- closing script tags;
- UTF-8 text;
- allowed URI forms;
- simple raw attribute objects;
- maximum byte sizes and item counts.

See the
[\`validation and escaping code\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMetadataRenderer.sol#L383-L925).

These checks protect the wrapper around the artwork. They do not make an artist
script or shared library safe to run.

Tests should still cover unusual text, closing tags, long values, data URIs, and
the largest valid outputs. A contract can accept an output that a normal wallet
or RPC service still refuses.

## Scripts are ordered, byte-exact artwork inputs

A large script can be split into smaller chunks. The exact chunk bytes and their
order both matter.

The renderer hashes each collection-script chunk with its position and byte
length. It then hashes the full ordered list. Changing a byte, moving a chunk,
or removing a chunk changes the final hash. See
[\`collectionScriptHash\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMetadataRenderer.sol#L261-L271).

Before freeze, an approved admin can update collection scripts. Core blocks
these updates after freeze. Artist approval and admin power remain separate.

The hash checks the bytes and their order. The file example above still applies:
the hash does not keep outside bytes available.

## Versioned dependencies prevent silent library replacement

A dependency is shared code that the artwork needs. In the pinned
[\`DependencyRegistry\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/DependencyRegistry.sol#L74-L114),
an approved admin creates a numbered version.

Changing one chunk creates another version. It does not replace the old
version's script bytes. Marking a version as deprecated adds a warning. It does
not delete that version.

Each version stores its ordered chunks, chunk hashes, full hash, source notes,
creator, creation details, and deprecation flag.

See the
[\`version and hash code\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/DependencyRegistry.sol#L243-L367).

When a collection is created or fully updated, Core pins the dependency state.
"Pins" means Core saves the dependency key, version, content hash, and registry
address. See
[\`dependency pinning\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L897-L918).
The freeze hash later commits to that pinned state.

Reviewers must still check who controls the admin function and where any needed
outside files are kept.

## What Core collection freeze does and does not lock

Core freeze is a one-way lock on the collection data that Core uses to render
the NFTs.

The pinned code allows it only when:

- the collection exists and has its required setup data;
- the mint window and final-supply wait have ended;
- every live token has final metadata.

See the
[\`freeze checks and write\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L780-L795)
and the
[\`freeze eligibility checks\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L1304-L1340).

Freeze sets final supply from the number minted over time. Burned token
identities still count in that number. The burn count is saved separately.

The freeze hash covers four groups of facts:

- the metadata schema, collection details, and metadata mode;
- the collection script and pinned dependency state;
- supply, burns, and live-token metadata;
- the randomizer state, Core address, and chain.

See the
[\`freeze hash code\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L1404-L1505).

After freeze, Core blocks changes to those rendering inputs.

The boundary is important:

- **Core freeze locks:** Core collection details, mode, scripts, token data,
  images, attributes, and randomizer state.
- **Core freeze does not lock:** the shared contract label and links. In the
  separate collection-record contract, it stops normal record edits but does
  not stop every action. Snapshots and normal record locks can still be added
  when their paths are open.

## Collection metadata separates claims by purpose and authority

Separate collection records can hold claims and notes that are not direct
inputs to \`tokenURI()\`. Examples include an artist statement, rights claim,
archive location, checksum, or museum record.

A record family is a category of claim. The family limits who may write it. A
snapshot is a saved picture of selected records at one point in time.

| Record families | Who the pinned code allows to write |
| --- | --- |
| Artist | Artist signer only |
| Owner | Current-owner signer only |
| Independent | Any outside writer, speaking only as itself |
| Institution | Institution signer only |
| Curator | Curator signer or global admin |
| Rights, identity display, snapshot, agent | Metadata admin or global admin |
| Archive | Preservation admin or global admin |
| Fixity (file checks), C2PA (content-source records) | Institution signer, preservation admin, or global admin |
| IIIF (museum image delivery) | Preservation admin, metadata admin, or global admin |
| Media relationship (master, preview, or other media link) | Preservation admin or metadata admin |

Artist, owner, independent, and institution records reject normal admin grants.
An exact record type can be admitted only once. See the
[\`family and writer rules\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRecordFamilyRegistry.sol#L76-L128).

Permission shows who was allowed to write. It does not prove the claim is true.
Reviewers must also check the live record types, role providers, grants, and
contract code.

## Snapshots preserve an authorized view

A snapshot saves selected collection records at one point in time. The snapshot
itself is locked. It has its own ID and hash.

To publish one, the writer needs an allowed snapshot type and permission for
every record type included. The list must not be empty or contain duplicates.
The related lock paths must still be open.

See
[\`publishCollectionSnapshot\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCollectionMetadata.sol#L111-L166)
and the
[\`covered-record checks\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCollectionMetadata.sol#L468-L487).

A snapshot does not freeze the underlying records. It only saves their state at
that moment. Those records can keep changing until their own lock or Core freeze
stops normal record edits. A newer snapshot does not change an older one.

Even after Core freeze, the pinned code can publish a snapshot if its paths are
still open. It can also add a normal record lock. This is why a Core freeze must
not be described as a freeze of every record action.

## Shared contract metadata serves the ERC-721 surface

Shared contract metadata describes the whole Stream ERC-721 contract. ERC-721
is the common Ethereum NFT standard. This metadata is not for one collection.

The separate \`StreamContractMetadata\` adapter can provide a shared name,
description, image, or links. A global admin or an admin allowed to call the
exact function can update its URI while metadata changes are not paused. See
[\`updateContractURI\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamContractMetadata.sol#L99-L133).

This adapter is outside an individual collection's Core freeze. The artwork
inputs can be frozen while a shared label or link still changes. A wallet or
marketplace that checks only Core may also miss this separate adapter.

## Refresh events tell consumers that state changed

ERC-4906 is a standard notice that says NFT metadata may have changed. It tells
an app that it may need to read the metadata again.

The pinned Core sends:

- \`MetadataUpdate\` when one token's data, image, attributes, or final
  randomness changes;
- \`BatchMetadataUpdate\` when a collection detail or metadata mode changes.

See the
[\`token and mode notices\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L730-L776),
[\`randomness notice\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L799-L830),
and
[\`collection notice\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L977-L986).

The batch notice covers IDs from 1 through the last allocated token. This is
wider than one collection because Stream assigns token IDs across all
collections. Apps should treat it as a broad hint.

The accepted launch target also calls for restricted helpers for approved
support contracts. See the
[\`accepted helper target\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/launch-v1-target-architecture.md#L300-L308).

Those helpers are not in the pinned Core. They remain open work.

A refresh event is only a notice. It cannot force a wallet, marketplace, or
indexer to read the new data or clear its saved copy.

## Size limits protect delivery and execution

The pinned code sets these main limits:

| Item | Limit |
| --- | ---: |
| Collection text, base URI, library URL, or token image URI | 2,048 bytes |
| Token data | 4,096 bytes |
| Raw token attributes | 8,192 bytes |
| One collection-script or dependency-script chunk | 8,192 bytes |
| Script chunks per collection script or dependency version | 32 |
| Generated token URI | 65,536 bytes |
| Dependency provenance text | 2,048 bytes |

See the
[\`renderer limits\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMetadataRenderer.sol#L12-L18)
and the
[\`dependency limits\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/DependencyRegistry.sol#L15-L23).

These limits stop some very large writes. They do not prove that the maximum is
practical. Tests still need to cover gas, public RPC response limits, wallet and
marketplace parsers, and browser memory and run time.

## The browser is part of the artwork's environment

Generative HTML and JavaScript run in software outside the contract. Browsers,
fonts, codecs, graphics hardware, security rules, and web APIs can change.

Saving source code may not be enough. A useful preservation package may also
need:

- the exact asset and dependency bytes;
- a browser or other run-time version;
- fonts and codecs;
- build and replay steps;
- expected hashes;
- a reference image or known-good browser result.

Contract security and long-term replay are different proofs. One does not prove
the other.

## Every collection needs a dependency bill of materials

A bill of materials is a checklist of every part needed to rebuild the work.
For a Stream collection, that checklist should say:

- which bytes are on Ethereum;
- which bytes use a hash-based address;
- which bytes use a normal URL;
- which dependency names and versions are needed;
- which values can still change;
- who can change each value;
- which hash covers each item;
- which browser, font, codec, or service is needed;
- how another person can rebuild the work.

"Fully onchain" should be the result of this check. It should not be the
starting label.

## What can fail

- Text breaks out of its intended JSON, HTML, JavaScript, or URI field.
- A script's chunks, order, version, or full hash are unclear.
- An outside file disappears even though its hash is still valid.
- A writer can make a claim under the wrong record family.
- The live roles or contracts do not match the reviewed setup.
- A snapshot is mistaken for a wider freeze.
- A broad refresh notice creates too much work for indexers.
- An unbuilt refresh helper is treated as working code.
- A public RPC, wallet, marketplace, indexer, or browser cannot handle the
  output.
- Future software shows the same source in a different way.

## Questions for reviewers

1. Which exact bytes must be on Ethereum before a collection is called fully
   onchain?
2. Is every artist-controlled value checked for every place where it is used?
3. Do dependency records make the bytes, order, version, source, and deprecation
   clear?
4. Which changes need artist approval, and which need admin permission?
5. Can one record family speak in another actor's name?
6. Which snapshot and lock actions remain possible after Core freeze?
7. Which contracts should be allowed to request a refresh, and for which token
   IDs?
8. What maximum sizes work through real RPC services and common apps?
9. What must stay available outside Ethereum so each artwork mode can still be
   rebuilt?`,
} as const;
