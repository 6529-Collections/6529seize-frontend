// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../interfaces/stream/IStreamAdmins.sol";
import "../../interfaces/stream/IStreamCollectionMetadata.sol";
import "../../interfaces/stream/IStreamCore.sol";
import "../../interfaces/stream/IStreamRecordFamilyRegistry.sol";
import "./StreamMetadataRenderer.sol";
import "../access/StreamPauseDomains.sol";
import "../records/StreamRecordFamilyRegistry.sol";

contract StreamCollectionMetadata is StreamRecordFamilyRegistry, IStreamCollectionMetadata {
    uint256 public constant MAX_URI_BYTES = 2_048;
    uint256 public constant MAX_RECORD_TYPES = 128;

    bytes32 private constant _MODULE_FAMILY = keccak256("6529stream.module.collection-metadata");
    bytes32 private constant _MODULE_VERSION =
        keccak256("6529stream.module.collection-metadata.v2");
    bytes32 private constant _MODULE_SCHEMA_HASH =
        keccak256("6529stream.collection-metadata.schema.v2");
    bytes32 private constant _RECORD_HASH_DOMAIN =
        keccak256("6529stream.collection-metadata-record.v2");
    bytes32 private constant _SNAPSHOT_HASH_DOMAIN =
        keccak256("6529stream.collection-metadata-snapshot.v2");
    bytes32 private constant _LOCK_METADATA_ALL = keccak256("METADATA_ALL");
    bytes32 private constant _LOCK_SNAPSHOTS = keccak256("SNAPSHOTS");
    bytes32 private constant _FAMILY_INDEPENDENT =
        keccak256("6529STREAM_RECORD_FAMILY_INDEPENDENT_V1");
    bytes32 private constant _FAMILY_SNAPSHOT = keccak256("6529STREAM_RECORD_FAMILY_SNAPSHOT_V1");
    bytes32 private constant _FIELD_METADATA_URI = "metadataURI";

    address public immutable override streamCore;
    address public immutable override recordFamilyRegistry;
    address private immutable _moduleSupersedes;
    IStreamAdmins private _adminsContract;
    IStreamRecordFamilyRegistry private immutable _recordFamilyRegistry;

    mapping(uint256 => mapping(bytes32 => CollectionMetadataRecordView)) private _records;
    mapping(uint256 => mapping(bytes32 => bool)) private _knownRecordTypes;
    mapping(uint256 => bytes32[]) private _recordTypes;
    mapping(uint256 => mapping(bytes32 => CollectionMetadataRecordView)) private _snapshots;
    mapping(uint256 => mapping(bytes32 => bytes32)) private _snapshotHashes;
    mapping(uint256 => mapping(bytes32 => bytes32)) private _snapshotCoveredRecordTypesHashes;
    mapping(uint256 => bytes32) private _latestSnapshotIds;
    mapping(uint256 => bytes32) private _latestSnapshotHashes;

    modifier FunctionAdminRequired(bytes4 selector) {
        if (
            !_adminsContract.retrieveFunctionAdmin(msg.sender, address(this), selector)
                && !_adminsContract.retrieveGlobalAdmin(msg.sender)
        ) {
            revert FunctionAdminUnauthorized(msg.sender, selector);
        }
        _;
    }

    constructor(address core, address admins, address supersedes)
        StreamRecordFamilyRegistry(admins)
    {
        if (core.code.length == 0) revert InvalidCoreContract();
        streamCore = core;
        recordFamilyRegistry = address(this);
        _recordFamilyRegistry = IStreamRecordFamilyRegistry(address(this));
        _moduleSupersedes = supersedes;
        _setAdminContract(admins);
    }

    function adminsContract()
        public
        view
        override(StreamRecordFamilyRegistry, IStreamCollectionMetadata)
        returns (address)
    {
        return StreamRecordFamilyRegistry.adminsContract();
    }

    function isStreamCollectionMetadata() external pure override returns (bool) {
        return true;
    }

    function streamModuleFamily() external pure override returns (bytes32) {
        return _MODULE_FAMILY;
    }

    function streamModuleVersion() external pure override returns (bytes32) {
        return _MODULE_VERSION;
    }

    function streamModuleSchemaHash() external pure override returns (bytes32) {
        return _MODULE_SCHEMA_HASH;
    }

    function streamModuleSupersedes() external view override returns (address) {
        return _moduleSupersedes;
    }

    function updateAdminContract(address newAdminsContract)
        external
        override
        FunctionAdminRequired(this.updateAdminContract.selector)
    {
        _requireMetadataMutationNotPaused();
        address oldAdminContract = address(_adminsContract);
        _setAdminContract(newAdminsContract);
        emit CollectionMetadataAdminContractUpdated(oldAdminContract, newAdminsContract, msg.sender);
    }

    function setCollectionRecord(uint256 collectionId, CollectionMetadataRecord calldata record)
        external
        override
        returns (bytes32 recordHash)
    {
        return _setCollectionRecord(collectionId, record, false, 0);
    }

    function setCollectionRecordWithRevision(
        uint256 collectionId,
        CollectionMetadataRecord calldata record,
        uint64 expectedRevision
    ) external override returns (bytes32 recordHash) {
        return _setCollectionRecord(collectionId, record, true, expectedRevision);
    }

    function publishCollectionSnapshot(
        uint256 collectionId,
        bytes32 snapshotId,
        bytes32[] calldata coveredRecordTypes,
        CollectionMetadataRecord calldata snapshot
    ) external override returns (bytes32 hash) {
        if (snapshotId == bytes32(0)) {
            revert InvalidSnapshotId(snapshotId);
        }
        IStreamRecordFamilyRegistry.RecordTypePolicy memory snapshotRecordPolicy =
            _recordFamilyRegistry.recordTypePolicy(snapshot.recordType);
        if (!snapshotRecordPolicy.admitted || snapshotRecordPolicy.familyId != _FAMILY_SNAPSHOT) {
            revert InvalidSnapshotRecordType(snapshot.recordType);
        }
        uint8 authorizationClass =
            _requireRecordWriter(collectionId, bytes32(collectionId), snapshot.recordType);
        bytes32 coveredRecordTypesHash =
            _requireSnapshotFamilyIntersection(collectionId, snapshotId, coveredRecordTypes);
        _requireSnapshotPublicationAllowed(collectionId, snapshot.recordType);
        _validateRecord(snapshot);
        if (_snapshotHashes[collectionId][snapshotId] != bytes32(0)) {
            revert CollectionSnapshotAlreadyPublished(collectionId, snapshotId);
        }

        hash = _deriveCollectionSnapshotHash(
            collectionId, snapshotId, coveredRecordTypesHash, snapshot
        );
        CollectionMetadataRecordView memory stored = CollectionMetadataRecordView({
            recordType: snapshot.recordType,
            schemaId: snapshot.schemaId,
            uri: snapshot.uri,
            dataHash: snapshot.dataHash,
            auxiliaryHash: snapshot.auxiliaryHash,
            recordHash: hash,
            revision: 1,
            effectiveAt: snapshot.effectiveAt,
            writer: msg.sender,
            updatedAt: uint64(block.timestamp),
            locked: true,
            authorizationClass: authorizationClass
        });
        _snapshotHashes[collectionId][snapshotId] = hash;
        _snapshotCoveredRecordTypesHashes[collectionId][snapshotId] = coveredRecordTypesHash;
        _snapshots[collectionId][snapshotId] = stored;
        _latestSnapshotIds[collectionId] = snapshotId;
        _latestSnapshotHashes[collectionId] = hash;
        emit CollectionMetadataSnapshotPublished(
            collectionId,
            snapshotId,
            snapshot.schemaId,
            snapshot,
            hash,
            coveredRecordTypesHash,
            msg.sender,
            authorizationClass
        );
    }

    function lockCollectionRecord(uint256 collectionId, bytes32 recordType) external override {
        if (recordType == bytes32(0)) {
            revert InvalidMetadataRecord(recordType, bytes32(0), bytes32(0));
        }
        uint8 authorizationClass;
        if (_isReservedLock(recordType)) {
            authorizationClass = _requireFunctionAdmin(this.lockCollectionRecord.selector);
        } else {
            authorizationClass =
                _requireRecordWriter(collectionId, bytes32(collectionId), recordType);
            bytes32 familyId = _recordFamilyRegistry.recordTypePolicy(recordType).familyId;
            if (familyId == _FAMILY_INDEPENDENT) {
                revert RecordFamilyLockNotAllowed(recordType, familyId);
            }
        }
        _requireLockMutationAllowed(collectionId, recordType);
        _rememberRecordType(collectionId, recordType);
        CollectionMetadataRecordView storage current = _records[collectionId][recordType];
        current.recordType = recordType;
        current.locked = true;
        current.authorizationClass = authorizationClass;
        emit CollectionMetadataLockedEvent(collectionId, recordType, msg.sender, authorizationClass);
    }

    function collectionRecord(uint256 collectionId, bytes32 recordType)
        external
        view
        override
        returns (CollectionMetadataRecordView memory)
    {
        return _records[collectionId][recordType];
    }

    function collectionRecordTypeCount(uint256 collectionId)
        external
        view
        override
        returns (uint256)
    {
        return _recordTypes[collectionId].length;
    }

    function collectionRecordTypeAt(uint256 collectionId, uint256 index)
        external
        view
        override
        returns (bytes32)
    {
        return _recordTypes[collectionId][index];
    }

    function latestCollectionRecordHash(uint256 collectionId, bytes32 recordType)
        external
        view
        override
        returns (bytes32)
    {
        return _records[collectionId][recordType].recordHash;
    }

    function snapshotHash(uint256 collectionId, bytes32 snapshotId)
        external
        view
        override
        returns (bytes32)
    {
        return _snapshotHashes[collectionId][snapshotId];
    }

    function snapshotCoveredRecordTypesHash(uint256 collectionId, bytes32 snapshotId)
        external
        view
        override
        returns (bytes32)
    {
        return _snapshotCoveredRecordTypesHashes[collectionId][snapshotId];
    }

    function collectionSnapshot(uint256 collectionId, bytes32 snapshotId)
        external
        view
        override
        returns (CollectionMetadataRecordView memory)
    {
        return _snapshots[collectionId][snapshotId];
    }

    function latestCollectionSnapshotId(uint256 collectionId)
        external
        view
        override
        returns (bytes32)
    {
        return _latestSnapshotIds[collectionId];
    }

    function latestCollectionSnapshotHash(uint256 collectionId)
        external
        view
        override
        returns (bytes32)
    {
        return _latestSnapshotHashes[collectionId];
    }

    function isLocked(uint256 collectionId, bytes32 recordType)
        external
        view
        override
        returns (bool)
    {
        return _records[collectionId][recordType].locked;
    }

    function deriveCollectionRecordHash(
        uint256 collectionId,
        CollectionMetadataRecord calldata record,
        uint64 revision
    ) external view override returns (bytes32) {
        _validateRecord(record);
        return _deriveCollectionRecordHash(collectionId, record, revision);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(StreamRecordFamilyRegistry, IERC165)
        returns (bool)
    {
        return interfaceId == type(IStreamCollectionMetadata).interfaceId
            || super.supportsInterface(interfaceId);
    }

    function _setAdminContract(address admins) private {
        StreamMetadataRenderer.requireContractMarker(
            admins, IStreamAdmins.isAdminContract.selector, InvalidAdminContract.selector
        );
        _adminsContract = IStreamAdmins(admins);
        _setRecordFamilyAdminContract(admins);
    }

    function _setCollectionRecord(
        uint256 collectionId,
        CollectionMetadataRecord calldata record,
        bool checkRevision,
        uint64 expectedRevision
    ) private returns (bytes32 recordHash) {
        _validateRecord(record);
        uint8 authorizationClass =
            _requireRecordWriter(collectionId, bytes32(collectionId), record.recordType);
        bytes32 familyId = _recordFamilyRegistry.recordTypePolicy(record.recordType).familyId;
        if (familyId == _FAMILY_INDEPENDENT) {
            revert RecordFamilyHostNotAllowed(record.recordType, familyId);
        }
        _requireMutableCollection(collectionId, record.recordType);

        CollectionMetadataRecordView storage current = _records[collectionId][record.recordType];
        if (checkRevision && current.revision != expectedRevision) {
            revert MetadataRevisionMismatch(record.recordType, expectedRevision, current.revision);
        }
        if (!checkRevision && current.revision != 0) {
            revert MetadataRevisionMismatch(record.recordType, 0, current.revision);
        }
        _rememberRecordType(collectionId, record.recordType);

        uint64 nextRevision = current.revision + 1;
        recordHash = _deriveCollectionRecordHash(collectionId, record, nextRevision);
        _records[collectionId][record.recordType] = CollectionMetadataRecordView({
            recordType: record.recordType,
            schemaId: record.schemaId,
            uri: record.uri,
            dataHash: record.dataHash,
            auxiliaryHash: record.auxiliaryHash,
            recordHash: recordHash,
            revision: nextRevision,
            effectiveAt: record.effectiveAt,
            writer: msg.sender,
            updatedAt: uint64(block.timestamp),
            locked: false,
            authorizationClass: authorizationClass
        });
        emit CollectionMetadataRecordSet(
            collectionId,
            record.recordType,
            record.schemaId,
            record,
            recordHash,
            nextRevision,
            msg.sender,
            authorizationClass
        );
    }

    function _requireMutableCollection(uint256 collectionId, bytes32 recordType) private view {
        _requireMetadataMutationNotPaused();
        _requireKnownCollection(collectionId);
        if (IStreamCore(streamCore).collectionFreezeStatus(collectionId)) {
            revert CollectionMetadataFrozen(collectionId);
        }
        if (!_recordFamilyRegistry.recordTypeRejectsAdminAuthority(recordType)) {
            _requireUnlocked(collectionId, _LOCK_METADATA_ALL);
        }
        if (recordType != bytes32(0)) _requireUnlocked(collectionId, recordType);
    }

    function _requireSnapshotPublicationAllowed(uint256 collectionId, bytes32 recordType)
        private
        view
    {
        _requireMetadataMutationNotPaused();
        _requireKnownCollection(collectionId);
        _requireUnlocked(collectionId, _LOCK_METADATA_ALL);
        if (recordType != bytes32(0)) _requireUnlocked(collectionId, recordType);
        _requireUnlocked(collectionId, _LOCK_SNAPSHOTS);
    }

    function _requireLockMutationAllowed(uint256 collectionId, bytes32 recordType) private view {
        _requireMetadataMutationNotPaused();
        _requireKnownCollection(collectionId);
        _requireUnlocked(collectionId, recordType);
        if (
            IStreamCore(streamCore).collectionFreezeStatus(collectionId)
                && _isReservedLock(recordType)
        ) {
            revert CollectionMetadataFrozen(collectionId);
        }
        if (recordType != _LOCK_METADATA_ALL) _requireUnlocked(collectionId, _LOCK_METADATA_ALL);
    }

    function _requireKnownCollection(uint256 collectionId) private view {
        if (collectionId == 0 || collectionId > IStreamCore(streamCore).lastAllocatedCollectionId())
        {
            revert CollectionDoesNotExist(collectionId);
        }
    }

    function _requireUnlocked(uint256 collectionId, bytes32 lockId) private view {
        if (_records[collectionId][lockId].locked) {
            revert CollectionMetadataLocked(collectionId, lockId);
        }
    }

    function _rememberRecordType(uint256 collectionId, bytes32 recordType) private {
        if (_knownRecordTypes[collectionId][recordType]) return;
        uint256 nextCount = _recordTypes[collectionId].length + 1;
        uint256 limit = MAX_RECORD_TYPES;
        if (!_isReservedLock(recordType)) {
            limit = MAX_RECORD_TYPES - _missingReservedLockSlots(collectionId);
        }
        if (nextCount > limit) {
            revert MetadataRecordTypeLimitExceeded(nextCount, limit);
        }
        _knownRecordTypes[collectionId][recordType] = true;
        _recordTypes[collectionId].push(recordType);
    }

    function _isReservedLock(bytes32 recordType) private pure returns (bool) {
        return recordType == _LOCK_METADATA_ALL || recordType == _LOCK_SNAPSHOTS;
    }

    function _missingReservedLockSlots(uint256 collectionId)
        private
        view
        returns (uint256 missing)
    {
        if (!_knownRecordTypes[collectionId][_LOCK_METADATA_ALL]) {
            missing++;
        }
        if (!_knownRecordTypes[collectionId][_LOCK_SNAPSHOTS]) missing++;
    }

    function _validateRecord(CollectionMetadataRecord calldata record) private pure {
        if (
            record.recordType == bytes32(0) || record.schemaId == bytes32(0)
                || record.dataHash == bytes32(0) || record.recordType == _LOCK_METADATA_ALL
                || record.recordType == _LOCK_SNAPSHOTS
        ) {
            revert InvalidMetadataRecord(record.recordType, record.schemaId, record.dataHash);
        }
        uint256 uriBytes = bytes(record.uri).length;
        if (uriBytes > MAX_URI_BYTES) revert MetadataURITooLarge(uriBytes, MAX_URI_BYTES);
        StreamMetadataRenderer.requireValidUtf8ContentUri(
            _FIELD_METADATA_URI, record.uri, MAX_URI_BYTES, true
        );
    }

    function _deriveCollectionRecordHash(
        uint256 collectionId,
        CollectionMetadataRecord calldata record,
        uint64 revision
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                _RECORD_HASH_DOMAIN,
                block.chainid,
                address(this),
                streamCore,
                collectionId,
                record.recordType,
                record.schemaId,
                keccak256(bytes(record.uri)),
                record.dataHash,
                record.auxiliaryHash,
                record.effectiveAt,
                revision
            )
        );
    }

    function _deriveCollectionSnapshotHash(
        uint256 collectionId,
        bytes32 snapshotId,
        bytes32 coveredRecordTypesHash,
        CollectionMetadataRecord calldata snapshot
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                _SNAPSHOT_HASH_DOMAIN,
                snapshotId,
                coveredRecordTypesHash,
                _deriveCollectionRecordHash(collectionId, snapshot, 1)
            )
        );
    }

    function _requireRecordWriter(uint256 collectionId, bytes32 subjectId, bytes32 recordType)
        private
        view
        returns (uint8 authorizationClass)
    {
        return _recordFamilyRegistry.requireRecordWriter(
            collectionId, subjectId, recordType, msg.sender, bytes("")
        );
    }

    function _requireSnapshotFamilyIntersection(
        uint256 collectionId,
        bytes32 snapshotId,
        bytes32[] calldata coveredRecordTypes
    ) private returns (bytes32 coveredRecordTypesHash) {
        uint256 count = coveredRecordTypes.length;
        if (count == 0) revert InvalidSnapshotFamilySet(0, bytes32(0));
        bytes32 previous = bytes32(0);
        for (uint256 i = 0; i < count; i++) {
            bytes32 recordType = coveredRecordTypes[i];
            if (recordType == bytes32(0) || (i != 0 && recordType <= previous)) {
                revert InvalidSnapshotFamilySet(i, recordType);
            }
            uint8 authorizationClass =
                _requireRecordWriter(collectionId, bytes32(collectionId), recordType);
            emit CollectionMetadataSnapshotFamilyAuthorized(
                collectionId, snapshotId, recordType, authorizationClass, msg.sender
            );
            previous = recordType;
        }
        return keccak256(abi.encode(coveredRecordTypes));
    }

    function _requireFunctionAdmin(bytes4 selector)
        private
        view
        returns (uint8 authorizationClass)
    {
        if (_adminsContract.retrieveGlobalAdmin(msg.sender)) {
            return 8;
        }
        if (_adminsContract.retrieveFunctionAdmin(msg.sender, address(this), selector)) return 7;
        revert FunctionAdminUnauthorized(msg.sender, selector);
    }

    function _requireMetadataMutationNotPaused() private view {
        StreamMetadataRenderer.requireNotPaused(
            address(_adminsContract),
            StreamPauseDomains.METADATA_MUTATION,
            MetadataMutationPaused.selector
        );
    }
}
