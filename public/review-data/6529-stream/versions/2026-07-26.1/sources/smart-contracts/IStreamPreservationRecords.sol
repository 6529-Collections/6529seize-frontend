// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IERC165.sol";

/// @notice Interface for outside-Core collection preservation and provenance records.
interface IStreamPreservationRecords is IERC165 {
    /// @notice Tagged hash reference for PREMIS, C2PA, IIIF, fixity, and archive payloads.
    /// @dev Variable-length hash algorithms are opaque byte commitments at launch.
    /// `canonicalizationId` is presence-validated; the release manifest defines recognized
    /// canonicalization profile IDs for offchain consumers.
    struct HashRef {
        uint16 algorithm;
        bytes digest;
        bytes32 canonicalizationId;
    }

    /// @notice Generic launch record for preservation, provenance, relationship, and fixity data.
    struct CollectionRecord {
        bytes32 recordType;
        bytes32 subjectId;
        HashRef contentHash;
        string uri;
        bytes32 schemaId;
        bytes32 signatureScheme;
        HashRef signatureHash;
        uint64 effectiveAt;
    }

    /// @notice Stored summary for cheap latest-record reads and event-log verification.
    struct CollectionRecordSummary {
        uint256 collectionId;
        bytes32 recordType;
        bytes32 subjectId;
        bytes32 recordHash;
        uint16 contentHashAlgorithm;
        bytes32 contentHashDigestHash;
        bytes32 contentHashCanonicalizationId;
        string uri;
        bytes32 uriHash;
        bytes32 schemaId;
        bytes32 signatureScheme;
        uint16 signatureHashAlgorithm;
        bytes32 signatureHashDigestHash;
        bytes32 signatureHashCanonicalizationId;
        uint64 effectiveAt;
        address recorder;
        uint64 recordedAt;
    }

    /// @notice Reverts when Core is not a deployed 6529Stream Core.
    error InvalidCoreContract();
    /// @notice Reverts when the admin dependency is not a StreamAdmins contract.
    error InvalidAdminContract();
    /// @notice Reverts when caller lacks global or target-scoped function authority.
    error FunctionAdminUnauthorized(address caller, bytes4 selector);
    /// @notice Reverts when preservation mutation pause is active.
    error MetadataMutationPaused();
    /// @notice Reverts when the collection has not been created in Core.
    error CollectionDoesNotExist(uint256 collectionId);
    /// @notice Reverts when required record identity fields are zero.
    error InvalidCollectionRecord(bytes32 recordType, bytes32 subjectId, bytes32 schemaId);
    /// @notice Reverts when a hash reference is malformed or uses an unsupported algorithm.
    error InvalidHashRef(uint16 algorithm, uint256 digestLength);
    /// @notice Reverts when a preservation URI exceeds launch limits.
    error PreservationURITooLarge(uint256 actual, uint256 maximum);
    /// @notice Reverts when the same record hash has already been stored.
    error CollectionRecordAlreadyExists(bytes32 recordHash);

    /// @notice Emitted when the admin dependency changes.
    event PreservationAdminContractUpdated(
        address indexed oldAdminContract, address indexed newAdminContract, address indexed admin
    );
    /// @notice Emitted when a generic collection preservation record is stored.
    event CollectionRecordRecorded(
        uint256 indexed collectionId,
        bytes32 indexed recordType,
        bytes32 indexed subjectId,
        CollectionRecord record,
        bytes32 recordHash,
        address recorder
    );

    /// @notice Returns the Core contract this preservation module extends.
    function streamCore() external view returns (address);
    /// @notice Returns the active StreamAdmins dependency.
    function adminsContract() external view returns (address);
    /// @notice Returns true for deployment validation.
    function isStreamPreservationRecords() external pure returns (bool);
    /// @notice Returns the module family beacon.
    function streamModuleFamily() external pure returns (bytes32);
    /// @notice Returns the module version beacon.
    function streamModuleVersion() external pure returns (bytes32);
    /// @notice Returns the launch schema hash for this module.
    function streamModuleSchemaHash() external view returns (bytes32);
    /// @notice Returns the immediate predecessor module, or zero for the first version.
    function streamModuleSupersedes() external view returns (address);
    /// @notice Updates the active admin contract.
    function updateAdminContract(address newAdminsContract) external;
    /// @notice Stores a generic preservation record and updates the latest subject pointer.
    /// @dev Intentionally omits Core freeze checks so append-only preservation records can
    /// document frozen collections. Re-recording the exact same collection payload reverts
    /// because the derived record hash is already present.
    function recordCollectionRecord(uint256 collectionId, CollectionRecord calldata record)
        external
        returns (bytes32 recordHash);
    /// @notice Returns the latest recorded hash for one collection/type/subject key.
    /// @dev Latest is last-write-wins by record time, not max `effectiveAt`.
    function latestCollectionRecordHash(uint256 collectionId, bytes32 recordType, bytes32 subjectId)
        external
        view
        returns (bytes32);
    /// @notice Returns the stored summary for a record hash.
    function collectionRecordSummary(bytes32 recordHash)
        external
        view
        returns (CollectionRecordSummary memory);
    /// @notice Returns the full stored payload for a record hash.
    /// @dev Signature fields are hash commitments only; this contract does not verify signatures.
    function collectionRecord(bytes32 recordHash) external view returns (CollectionRecord memory);
    /// @notice Computes the domain-separated record hash without writing.
    function deriveCollectionRecordHash(uint256 collectionId, CollectionRecord calldata record)
        external
        view
        returns (bytes32);
}
