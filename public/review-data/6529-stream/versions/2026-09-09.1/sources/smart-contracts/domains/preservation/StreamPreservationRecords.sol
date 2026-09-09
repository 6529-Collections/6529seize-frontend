// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../vendor/openzeppelin/ERC165.sol";
import "../../interfaces/stream/IStreamAdmins.sol";
import "../../interfaces/stream/IStreamCore.sol";
import "../../interfaces/stream/IStreamPreservationRecords.sol";
import "../../interfaces/stream/IStreamRecordFamilyRegistry.sol";
import "../metadata/StreamMetadataRenderer.sol";
import "../access/StreamPauseDomains.sol";

contract StreamPreservationRecords is ERC165, IStreamPreservationRecords {
    uint256 public constant MAX_URI_BYTES = 2_048;
    uint256 public constant MAX_DIGEST_BYTES = 128;
    uint16 public constant HASH_KECCAK256 = 1;
    uint16 public constant HASH_SHA256 = 2;
    uint16 public constant HASH_BLAKE3 = 3;
    uint16 public constant HASH_MULTIHASH = 4;
    uint16 public constant HASH_IPFS_CID = 5;
    uint16 public constant HASH_ARWEAVE_TX = 6;

    bytes32 private constant _MODULE_FAMILY = keccak256("6529stream.module.preservation-records");
    bytes32 private constant _MODULE_VERSION =
        keccak256("6529stream.module.preservation-records.v2");
    bytes32 private constant _MODULE_SCHEMA_HASH =
        keccak256("6529stream.preservation-records.schema.v2");
    bytes32 private constant _RECORD_HASH_DOMAIN = keccak256("6529stream.preservation-record.v2");
    bytes32 private constant _FIELD_RECORD_URI = "recordURI";
    bytes32 private constant _FAMILY_INDEPENDENT =
        keccak256("6529STREAM_RECORD_FAMILY_INDEPENDENT_V1");

    address public immutable override streamCore;
    address public immutable override recordFamilyRegistry;
    address private immutable _moduleSupersedes;
    IStreamAdmins private _adminsContract;
    IStreamRecordFamilyRegistry private immutable _recordFamilyRegistry;

    mapping(bytes32 => CollectionRecordSummary) private _records;
    mapping(bytes32 => CollectionRecord) private _recordPayloads;
    mapping(uint256 => mapping(bytes32 => mapping(bytes32 => mapping(address => bytes32)))) private
        _latestRecordHash;

    modifier FunctionAdminRequired(bytes4 selector) {
        if (
            !_adminsContract.retrieveFunctionAdmin(msg.sender, address(this), selector)
                && !_adminsContract.retrieveGlobalAdmin(msg.sender)
        ) {
            revert FunctionAdminUnauthorized(msg.sender, selector);
        }
        _;
    }

    constructor(address core, address admins, address familyRegistry, address supersedes) {
        if (core.code.length == 0) revert InvalidCoreContract();
        streamCore = core;
        StreamMetadataRenderer.requireContractMarker(
            familyRegistry,
            IStreamRecordFamilyRegistry.isStreamRecordFamilyRegistry.selector,
            InvalidRecordFamilyRegistry.selector
        );
        recordFamilyRegistry = familyRegistry;
        _recordFamilyRegistry = IStreamRecordFamilyRegistry(familyRegistry);
        _moduleSupersedes = supersedes;
        _setAdminContract(admins);
    }

    function adminsContract() external view override returns (address) {
        return address(_adminsContract);
    }

    function isStreamPreservationRecords() external pure override returns (bool) {
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
        emit PreservationAdminContractUpdated(oldAdminContract, newAdminsContract, msg.sender);
    }

    function recordCollectionRecord(uint256 collectionId, CollectionRecord calldata record)
        external
        override
        returns (bytes32 recordHash)
    {
        _validateRecord(record);
        _requireRecordMutationNotPaused(record.recordType);
        _requireKnownCollection(collectionId);
        uint8 authorizationClass = _recordFamilyRegistry.requireRecordWriter(
            collectionId, record.subjectId, record.recordType, msg.sender, bytes("")
        );
        recordHash = _deriveCollectionRecordHash(msg.sender, collectionId, record);
        if (_records[recordHash].collectionId != 0) {
            revert CollectionRecordAlreadyExists(recordHash);
        }

        CollectionRecordSummary memory summary = CollectionRecordSummary({
            collectionId: collectionId,
            recordType: record.recordType,
            subjectId: record.subjectId,
            recordHash: recordHash,
            contentHashAlgorithm: record.contentHash.algorithm,
            contentHashDigestHash: keccak256(record.contentHash.digest),
            contentHashCanonicalizationId: record.contentHash.canonicalizationId,
            uri: record.uri,
            uriHash: keccak256(bytes(record.uri)),
            schemaId: record.schemaId,
            signatureScheme: record.signatureScheme,
            signatureHashAlgorithm: record.signatureHash.algorithm,
            signatureHashDigestHash: keccak256(record.signatureHash.digest),
            signatureHashCanonicalizationId: record.signatureHash.canonicalizationId,
            effectiveAt: record.effectiveAt,
            recorder: msg.sender,
            recordedAt: uint64(block.timestamp),
            authorizationClass: authorizationClass
        });
        _records[recordHash] = summary;
        _recordPayloads[recordHash] = record;
        _latestRecordHash[collectionId][record.recordType][record.subjectId][msg.sender] =
        recordHash;
        emit CollectionRecordRecorded(
            collectionId,
            record.recordType,
            record.subjectId,
            record,
            recordHash,
            msg.sender,
            authorizationClass
        );
    }

    function latestCollectionRecordHash(uint256 collectionId, bytes32 recordType, bytes32 subjectId)
        external
        view
        override
        returns (bytes32)
    {
        return _latestRecordHash[collectionId][recordType][subjectId][msg.sender];
    }

    function latestCollectionRecordHashFor(
        uint256 collectionId,
        bytes32 recordType,
        bytes32 subjectId,
        address recorder
    ) external view override returns (bytes32) {
        if (recorder == address(0)) {
            revert InvalidCollectionRecordRecorder(recorder);
        }
        return _latestRecordHash[collectionId][recordType][subjectId][recorder];
    }

    function collectionRecordSummary(bytes32 recordHash)
        external
        view
        override
        returns (CollectionRecordSummary memory)
    {
        return _records[recordHash];
    }

    function collectionRecord(bytes32 recordHash)
        external
        view
        override
        returns (CollectionRecord memory)
    {
        return _recordPayloads[recordHash];
    }

    function deriveCollectionRecordHash(uint256 collectionId, CollectionRecord calldata record)
        external
        view
        override
        returns (bytes32)
    {
        _validateRecord(record);
        return _deriveCollectionRecordHash(msg.sender, collectionId, record);
    }

    function deriveCollectionRecordHashFor(
        address recorder,
        uint256 collectionId,
        CollectionRecord calldata record
    ) external view override returns (bytes32) {
        if (recorder == address(0)) {
            revert InvalidCollectionRecordRecorder(recorder);
        }
        _validateRecord(record);
        return _deriveCollectionRecordHash(recorder, collectionId, record);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC165, IERC165)
        returns (bool)
    {
        return interfaceId == type(IStreamPreservationRecords).interfaceId
            || super.supportsInterface(interfaceId);
    }

    function _setAdminContract(address admins) private {
        StreamMetadataRenderer.requireContractMarker(
            admins, IStreamAdmins.isAdminContract.selector, InvalidAdminContract.selector
        );
        _adminsContract = IStreamAdmins(admins);
    }

    function _requireKnownCollection(uint256 collectionId) private view {
        if (collectionId == 0 || collectionId > IStreamCore(streamCore).lastAllocatedCollectionId())
        {
            revert CollectionDoesNotExist(collectionId);
        }
    }

    function _deriveCollectionRecordHash(
        address recorder,
        uint256 collectionId,
        CollectionRecord calldata record
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                _RECORD_HASH_DOMAIN,
                block.chainid,
                address(this),
                streamCore,
                recorder,
                collectionId,
                record.recordType,
                record.subjectId,
                _hashRef(record.contentHash),
                keccak256(bytes(record.uri)),
                record.schemaId,
                record.signatureScheme,
                _hashRef(record.signatureHash),
                record.effectiveAt
            )
        );
    }

    function _validateRecord(CollectionRecord calldata record) private pure {
        if (
            record.recordType == bytes32(0) || record.subjectId == bytes32(0)
                || record.schemaId == bytes32(0)
        ) {
            revert InvalidCollectionRecord(record.recordType, record.subjectId, record.schemaId);
        }
        _validateRequiredHashRef(record.contentHash);
        if (record.signatureScheme == bytes32(0)) {
            if (
                record.signatureHash.algorithm != 0 || record.signatureHash.digest.length != 0
                    || record.signatureHash.canonicalizationId != bytes32(0)
            ) {
                revert InvalidHashRef(
                    record.signatureHash.algorithm, record.signatureHash.digest.length
                );
            }
        } else {
            _validateRequiredHashRef(record.signatureHash);
        }
        if (record.effectiveAt == 0) {
            revert InvalidCollectionRecord(record.recordType, record.subjectId, record.schemaId);
        }
        uint256 uriBytes = bytes(record.uri).length;
        if (uriBytes > MAX_URI_BYTES) revert PreservationURITooLarge(uriBytes, MAX_URI_BYTES);
        StreamMetadataRenderer.requireValidUtf8ContentUri(
            _FIELD_RECORD_URI, record.uri, MAX_URI_BYTES, true
        );
    }

    function _validateRequiredHashRef(HashRef calldata ref) private pure {
        if (ref.canonicalizationId == bytes32(0)) {
            revert InvalidHashRef(ref.algorithm, ref.digest.length);
        }
        uint256 digestLength = ref.digest.length;
        if (
            ref.algorithm == HASH_KECCAK256 || ref.algorithm == HASH_SHA256
                || ref.algorithm == HASH_BLAKE3
        ) {
            if (digestLength != 32) revert InvalidHashRef(ref.algorithm, digestLength);
            return;
        }
        if (ref.algorithm == HASH_MULTIHASH || ref.algorithm == HASH_IPFS_CID) {
            if (digestLength == 0 || digestLength > MAX_DIGEST_BYTES) {
                revert InvalidHashRef(ref.algorithm, digestLength);
            }
            return;
        }
        if (ref.algorithm == HASH_ARWEAVE_TX) {
            if (digestLength != 32) revert InvalidHashRef(ref.algorithm, digestLength);
            return;
        }
        revert InvalidHashRef(ref.algorithm, digestLength);
    }

    function _hashRef(HashRef calldata ref) private pure returns (bytes32) {
        return keccak256(abi.encode(ref.algorithm, keccak256(ref.digest), ref.canonicalizationId));
    }

    function _requireMetadataMutationNotPaused() private view {
        StreamMetadataRenderer.requireNotPaused(
            address(_adminsContract),
            StreamPauseDomains.METADATA_MUTATION,
            MetadataMutationPaused.selector
        );
    }

    function _requireRecordMutationNotPaused(bytes32 recordType) private view {
        IStreamRecordFamilyRegistry.RecordTypePolicy memory policy =
            _recordFamilyRegistry.recordTypePolicy(recordType);
        if (policy.admitted && policy.familyId == _FAMILY_INDEPENDENT) return;
        _requireMetadataMutationNotPaused();
    }
}
