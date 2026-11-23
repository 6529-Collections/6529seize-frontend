import { parseAbi } from "viem";

/**
 * The read functions of `IProvenanceRegistry` (tag `v1.0.0-rc.1`) this route
 * uses. Struct layouts match the interface field for field.
 */
export const PROVENANCE_REGISTRY_READ_ABI = parseAbi([
  "struct HashRef { uint16 algorithm; bytes32 digest; bytes32 canonicalizationId; }",
  "struct Version { uint32 version; uint32 sequence; uint32 releaseId; bytes32 schemaId; HashRef contentHash; uint64 effectiveAt; uint40 publishedAt; address publisher; bool deleted; uint32 deletionId; bytes cid; bytes32 arweaveId; string label; }",
  "struct Subject { bytes32 recordType; uint32 versionCount; uint32 firstSequence; bool deleted; uint32 liveVersionCount; uint32 deletionId; }",
  "struct Deletion { bytes32 subjectId; bytes32 reasonDigest; uint32 fromVersion; uint32 toVersion; uint32 deletedCount; bool wholeSubject; uint40 deletedAt; }",
  "struct Release { uint32 releaseId; bool isSealed; uint40 openedAt; uint40 sealedAt; uint32 firstSequence; uint32 recordCount; address openedBy; bytes manifestCid; HashRef manifestHash; bytes rootCid; bytes32 arweaveId; bytes20 sourceCommit; string label; }",
  "struct Schema { string literal; HashRef documentHash; bytes cid; address[] chunks; uint32 documentLength; uint40 registeredAt; }",
  "struct RecordType { string literal; uint40 registeredAt; }",
  "struct Canonicalization { string literal; bytes specCid; uint40 registeredAt; }",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "function owner() view returns (address)",
  "function frozen() view returns (bool)",
  "function successor() view returns (address)",
  "function deletionCount() view returns (uint32)",
  "function deletion(uint32 deletionId) view returns (Deletion)",
  "function subjectCount() view returns (uint256)",
  "function subjects(uint256 offset, uint256 limit) view returns (bytes32[] ids)",
  "function subject(bytes32 subjectId) view returns (Subject)",
  "function latest(bytes32 subjectId) view returns (Version)",
  "function current(bytes32 subjectId) view returns (Version)",
  "function releaseCount() view returns (uint32)",
  "function getRelease(uint32 releaseId) view returns (Release)",
  "function schema(bytes32 schemaId) view returns (Schema)",
  "function recordType(bytes32 recordTypeId) view returns (RecordType)",
  "function canonicalization(bytes32 canonicalizationId) view returns (Canonicalization)",
  "function schemaCount() view returns (uint256)",
  "function schemaAt(uint256 index) view returns (bytes32)",
  "function recordTypeCount() view returns (uint256)",
  "function recordTypeAt(uint256 index) view returns (bytes32)",
  "function canonicalizationCount() view returns (uint256)",
  "function canonicalizationAt(uint256 index) view returns (bytes32)",
]);
