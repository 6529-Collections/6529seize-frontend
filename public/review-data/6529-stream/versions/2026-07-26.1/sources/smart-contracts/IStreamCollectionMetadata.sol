// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IERC165.sol";

/// @notice Interface for outside-Core collection metadata records and snapshots.
interface IStreamCollectionMetadata is IERC165 {
    /// @notice Generic render-affecting collection metadata commitment.
    /// @dev `recordType` identifies typed launch groups such as identity, people, media, URIs,
    /// rights, display, script manifest, dependency manifest, media manifest, IIIF view,
    /// C2PA reference, catalogue record, or custom gate metadata.
    struct CollectionMetadataRecord {
        bytes32 recordType;
        bytes32 schemaId;
        string uri;
        bytes32 dataHash;
        bytes32 auxiliaryHash;
        uint64 effectiveAt;
    }

    /// @notice Stored latest record view.
    struct CollectionMetadataRecordView {
        bytes32 recordType;
        bytes32 schemaId;
        string uri;
        bytes32 dataHash;
        bytes32 auxiliaryHash;
        bytes32 recordHash;
        uint64 revision;
        uint64 effectiveAt;
        address writer;
        uint64 updatedAt;
        bool locked;
    }

    /// @notice Reverts when Core is not a deployed 6529Stream Core.
    error InvalidCoreContract();
    /// @notice Reverts when the admin dependency is not a StreamAdmins contract.
    error InvalidAdminContract();
    /// @notice Reverts when caller lacks global or target-scoped function authority.
    error FunctionAdminUnauthorized(address caller, bytes4 selector);
    /// @notice Reverts when metadata mutation pause is active.
    error MetadataMutationPaused();
    /// @notice Reverts when the collection has not been created in Core.
    error CollectionDoesNotExist(uint256 collectionId);
    /// @notice Reverts when render-affecting metadata is mutated after Core freeze.
    error CollectionMetadataFrozen(uint256 collectionId);
    /// @notice Reverts when a locked record type or snapshot is mutated.
    error CollectionMetadataLocked(uint256 collectionId, bytes32 recordType);
    /// @notice Reverts when a metadata record has missing identity or commitment fields.
    error InvalidMetadataRecord(bytes32 recordType, bytes32 schemaId, bytes32 dataHash);
    /// @notice Reverts when a metadata URI exceeds launch limits.
    error MetadataURITooLarge(uint256 actual, uint256 maximum);
    /// @notice Reverts when an optimistic revision does not match storage.
    error MetadataRevisionMismatch(bytes32 recordType, uint64 expected, uint64 actual);
    /// @notice Reverts when a collection would exceed the launch record-type cap.
    error MetadataRecordTypeLimitExceeded(uint256 count, uint256 maximum);
    /// @notice Reverts when a snapshot identifier is empty.
    error InvalidSnapshotId(bytes32 snapshotId);
    /// @notice Reverts when a snapshot identifier already exists.
    error CollectionSnapshotAlreadyPublished(uint256 collectionId, bytes32 snapshotId);

    /// @notice Emitted when the admin dependency changes.
    event CollectionMetadataAdminContractUpdated(
        address indexed oldAdminContract, address indexed newAdminContract, address indexed admin
    );
    /// @notice Emitted when a typed collection metadata record is set.
    event CollectionMetadataRecordSet(
        uint256 indexed collectionId,
        bytes32 indexed recordType,
        bytes32 indexed schemaId,
        CollectionMetadataRecord record,
        bytes32 recordHash,
        uint64 revision,
        address admin
    );
    /// @notice Emitted when a snapshot manifest record is published.
    event CollectionMetadataSnapshotPublished(
        uint256 indexed collectionId,
        bytes32 indexed snapshotId,
        bytes32 indexed schemaId,
        CollectionMetadataRecord record,
        bytes32 snapshotHash,
        address admin
    );
    /// @notice Emitted when a record type is locked against mutation.
    event CollectionMetadataLockedEvent(
        uint256 indexed collectionId, bytes32 indexed recordType, address indexed admin
    );

    /// @notice Returns the Core contract this metadata module extends.
    function streamCore() external view returns (address);
    /// @notice Returns the active StreamAdmins dependency.
    function adminsContract() external view returns (address);
    /// @notice Returns true for deployment validation.
    function isStreamCollectionMetadata() external pure returns (bool);
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
    /// @notice Stores the first typed collection metadata record for a record type.
    /// @dev Later updates must use `setCollectionRecordWithRevision`.
    function setCollectionRecord(uint256 collectionId, CollectionMetadataRecord calldata record)
        external
        returns (bytes32 recordHash);
    /// @notice Stores a typed metadata record if the expected revision matches.
    function setCollectionRecordWithRevision(
        uint256 collectionId,
        CollectionMetadataRecord calldata record,
        uint64 expectedRevision
    ) external returns (bytes32 recordHash);
    /// @notice Publishes an immutable snapshot record.
    /// @dev Snapshot publication is blocked by `METADATA_ALL`, `SNAPSHOTS`, or the snapshot
    /// record's own `recordType` lock.
    function publishCollectionSnapshot(
        uint256 collectionId,
        bytes32 snapshotId,
        CollectionMetadataRecord calldata snapshot
    ) external returns (bytes32 snapshotHash);
    /// @notice Locks a record type against mutation.
    function lockCollectionRecord(uint256 collectionId, bytes32 recordType) external;
    /// @notice Returns the latest stored record for a type.
    /// @dev Lock-only entries return `locked=true` and may have zero content fields.
    function collectionRecord(uint256 collectionId, bytes32 recordType)
        external
        view
        returns (CollectionMetadataRecordView memory);
    /// @notice Returns the number of known record types for a collection.
    function collectionRecordTypeCount(uint256 collectionId) external view returns (uint256);
    /// @notice Returns one known record type by index.
    function collectionRecordTypeAt(uint256 collectionId, uint256 index)
        external
        view
        returns (bytes32);
    /// @notice Returns the latest record hash for a collection/type pair.
    function latestCollectionRecordHash(uint256 collectionId, bytes32 recordType)
        external
        view
        returns (bytes32);
    /// @notice Returns a published snapshot hash by identifier.
    function snapshotHash(uint256 collectionId, bytes32 snapshotId) external view returns (bytes32);
    /// @notice Returns a published snapshot view by identifier.
    function collectionSnapshot(uint256 collectionId, bytes32 snapshotId)
        external
        view
        returns (CollectionMetadataRecordView memory);
    /// @notice Returns the most recently published snapshot identifier for the collection.
    function latestCollectionSnapshotId(uint256 collectionId) external view returns (bytes32);
    /// @notice Returns the most recently published snapshot hash for the collection.
    function latestCollectionSnapshotHash(uint256 collectionId) external view returns (bytes32);
    /// @notice Returns whether a record type is locked.
    function isLocked(uint256 collectionId, bytes32 recordType) external view returns (bool);
    /// @notice Computes the domain-separated record hash without writing.
    function deriveCollectionRecordHash(
        uint256 collectionId,
        CollectionMetadataRecord calldata record,
        uint64 revision
    ) external view returns (bytes32);
}
