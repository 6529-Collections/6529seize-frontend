# Stream handoff boundary — future integration only

Parent: [index](README.md). The purpose of this document is to avoid collecting the wrong information now. It does not specify a mint ceremony, build a release package, or make permanent publication part of the current backlog.

## 1. The seam to keep stable

The documentation domain produces a stable `work_id`, context/profile ID and version, immutable confirmed `revision_id`, normalized snapshot hash, source/artist attributions, asset roles and server-verified byte hashes, per-material disclosure/terms, and version-specific review results. A future consumer can read an authorized revision using the documented internal API.

No collection address, chain ID or token ID is needed to start or finish documentation. A future integration maintains a separate mapping from this work/revision to actual collection/token identities and admitted record references. Preserve one-to-many relationships where a future release has multiple relevant representations; do not infer that one artist, one work, one collection and one token are always identical scopes.

Intake IDs and hashes are internal identifiers. A future Stream adapter must validate and transform the authorized fields into that release's accepted schema and hashing rules. It must not label the entire intake JSON as an already-conforming Stream schema. Private evidence and contact information do not become public simply because they are in a confirmed revision.

## 2. Source-backed mapping

Stream main/planning baseline reviewed: `92ea123380917032f01aae09691141a2a72df935`. Also inspect the newer delivery integration implementation on `codex/current-stack-integration`, pinned here at `d08bace213ac72a6d50fe33e5e699be52560a033`. Its planning and deployed-contract status must be rechecked at the later integration. Existing Solidity surfaces are not proof of a live, audited or complete operator workflow.

The integration branch already implements [StreamCollectionArtistRegistry](https://github.com/6529-Collections/6529Stream/blob/d08bace213ac72a6d50fe33e5e699be52560a033/smart-contracts/domains/artist/StreamCollectionArtistRegistry.sol): collection artist nomination, direct or relayed EIP-712/EOA/ERC-1271 acceptance, nonce/deadline checks and immutable accepted attribution. The [fixed-price adapter](https://github.com/6529-Collections/6529Stream/blob/d08bace213ac72a6d50fe33e5e699be52560a033/smart-contracts/domains/mint/StreamFixedPriceSaleAdapter.sol) and [auction house](https://github.com/6529-Collections/6529Stream/blob/d08bace213ac72a6d50fe33e5e699be52560a033/smart-contracts/domains/auctions/StreamEnglishAuctionHouse.sol) enforce the accepted artist; the [metadata router](https://github.com/6529-Collections/6529Stream/blob/d08bace213ac72a6d50fe33e5e699be52560a033/smart-contracts/domains/metadata/StreamMetadataRouter.sol) displays that attribution. This is built source behavior, distinct from the historical V2 directory/archive and broader planned lifecycle. It does not implement the full Museum dossier, recovery, estate or artist-authority architecture. Documentation confirmation in this spec remains a different action and cannot substitute for that on-chain artist acceptance.

| Intake material now | Stream-related destination to consider later | Boundary |
|---|---|---|
| Name, credit, biography, profile links and attributed identity revision | Artist directory/archive and artist-identity evidence vocabulary | Existing V2 directory/archive interfaces are evidence/directory surfaces; profile login is not artist authority admission |
| Title, language, dates, medium, caption, statement, history and work relationships | Work description and related collection metadata records; `STREAM_WORK_DESCRIPTION_V1` vocabulary | Work-scoped source record must be mapped to the actual future collection/token schema; do not flatten conflicting dates into release time |
| Significant properties, display wishes and acceptable changes | `STREAM_ARTIST_INTENT_V1` and preservation documentation | Preserve wishes as attributed artist intent; intake acceptance is not a contract-admin permission |
| Written interview, instrument/version, participants, recording/transcript and permissions | `STREAM_ARTIST_INTERVIEW_V1` and associated evidence | Optional/declined intake is not an admitted Stream waiver; future profile requirements can differ |
| Rights declaration, effect, collaborators, source ingredients, intended terms and consent references | `STREAM_RIGHTS_V1` and restricted supporting evidence | Retain conditional versus effective distinctions; do not publish model releases by default or imply CC0 for every attachment |
| Exact final/master/source bytes, SHA-256, format/size and derivative relationships | Preservation records, master-file/fixity/PREMIS-oriented descriptions | New preservation actions need their own events, actors and dates; uploading now is not a historical preservation event invented retrospectively |
| Source receipt, actor/date, immutable version and authenticated confirmation receipt | Evidence supporting later record preparation and artist verification | Database confirmation has no EIP-712/domain/nonce/replay semantics and cannot stand in for required future signatures |
| Review outcomes and missing-information explanations | Later operational preparation checks | Documentation review is not mint readiness, production readiness, title passage or Museum accession |

Relevant source anchors:

- [Collection metadata contract specification](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/collection-metadata-contract.md) describes the broader metadata/schema vocabulary and requirements, including work description, intent, interview and rights material. Treat unimplemented integrations as planned.
- [StreamCollectionMetadata](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/metadata/StreamCollectionMetadata.sol) supplies the contract-side record/revision/snapshot mechanisms; this intake does not call them.
- [IStreamPreservationRecords](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/interfaces/stream/IStreamPreservationRecords.sol) exposes typed subject/hash/record concepts; do not assume intake canonicalization equals its admitted schema conventions.
- [Artist authority](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/stream-artist-authority.md) explains collection-scoped artist bindings. The directory/archive does not itself grant authority, and collaborator credits do not create independent controlling artists.

## 3. Required future safeguards without implementing them now

A future publication step needs an explicit reviewed public projection, exact permitted files, terms and a separate artist-facing approval where required. It must exclude private contact, consent evidence, restricted originals and internal comments unless a specifically authorized disclosure applies. “Intended for public record” is useful input, not blanket publication consent.

A future mint-preparation step chooses a confirmed revision, shows that choice and applies the then-current release's canonical schemas, authority/signature requirements and operational checks. It must record the actual resulting chain/permanent-storage references separately. A successful draft save or content hash cannot be described as on-chain persistence.

After a work is minted, the same modules remain usable for a later interview, correction, recovered source file or exhibition history. A new confirmed documentation revision does not silently replace the one previously published. Later publication/admission machinery decides what can be appended or updated and records the actual event. The frontend can eventually show “Published revision 2; current documentation revision 3” using evidence supplied by that machinery; this delivery implements only the documentation side.

There is no mint button, readiness gate, export job, Arweave receipt, IPFS pin status or wallet transaction in v1. Future integration should add a consumer and mapping layer, not fork the artist questionnaire or migrate work identity from drop ID to token ID.
