// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../vendor/openzeppelin/IERC165.sol";
import "../../vendor/openzeppelin/IERC2981.sol";
import "../../vendor/openzeppelin/IERC721Metadata.sol";
import "../standards/IERC7572.sol";

/// @notice Permanent token lifecycle values returned by StreamCore.
/// @dev Numeric values are pinned: UNKNOWN=0, PREPARED_INCOMPLETE=1,
///      MINTED=2, BURNED=3.
enum StreamTokenLifecycle {
    UNKNOWN,
    PREPARED_INCOMPLETE,
    MINTED,
    BURNED
}

/// @notice Public part of the singleton prepared-mint record.
struct StreamPreparedMintRecord {
    bool exists;
    bytes32 operationId;
    uint256 collectionId;
}

interface IStreamCoreCollectionView {
    function collectionExists(uint256 collectionId) external view returns (bool);

    function collectionSupplyMode(uint256 collectionId) external view returns (uint8);

    function collectionStatus(uint256 collectionId) external view returns (uint8);

    function collectionHasMaxSupply(uint256 collectionId) external view returns (bool);

    function collectionMaxSupply(uint256 collectionId) external view returns (uint256);

    function collectionMintedEver(uint256 collectionId) external view returns (uint256);

    function collectionNextSerial(uint256 collectionId) external view returns (uint256);

    function totalSupplyOfCollection(uint256 collectionId) external view returns (uint256);

    function collectionFreezeStatus(uint256 collectionId) external view returns (bool);
}

interface IStreamCoreCollectionManagement is IStreamCoreCollectionView {
    event StreamCollectionCreated(
        uint16 schemaVersion,
        uint256 indexed collectionId,
        bytes32 indexed actionId,
        uint8 supplyMode,
        bool hasMaxSupply,
        uint256 maxSupply,
        uint8 initialStatus
    );

    event StreamCollectionStatusUpdated(
        uint16 schemaVersion,
        uint256 indexed collectionId,
        bytes32 indexed actionId,
        uint8 oldStatus,
        uint8 newStatus
    );

    event StreamCollectionMaxSupplyUpdated(
        uint16 schemaVersion,
        uint256 indexed collectionId,
        bytes32 indexed actionId,
        uint256 oldMaxSupply,
        uint256 newMaxSupply
    );

    event CollectionFrozen(
        uint16 schemaVersion, uint256 indexed collectionId, bytes32 indexed actionId
    );

    function createCollection(
        uint8 supplyMode,
        bool hasMaxSupply,
        uint256 maxSupply,
        uint8 initialStatus
    ) external returns (uint256 collectionId);

    function setCollectionStatus(uint256 collectionId, uint8 status) external;

    function setCollectionMaxSupply(uint256 collectionId, uint256 newMaxSupply) external;

    function freezeCollection(uint256 collectionId) external;
}

interface IStreamCoreIdentity {
    function tokenCollectionIdentity(uint256 tokenId)
        external
        view
        returns (bool mappingExists, uint256 collectionId, uint256 collectionSerial, bool burned);

    function tokenLifecycle(uint256 tokenId) external view returns (uint8 lifecycle);

    function coordinatorAtMint(uint256 tokenId) external view returns (address);
}

interface IStreamCoreEnumeration {
    function totalSupply() external view returns (uint256);

    function lastAllocatedTokenId() external view returns (uint256);

    function lastAllocatedCollectionId() external view returns (uint256);
}

interface IStreamCoreMint {
    event TokenCollectionRegistered(
        uint16 schemaVersion,
        uint256 indexed tokenId,
        uint256 indexed collectionId,
        uint256 collectionSerial
    );

    event TokenCollectionRegistrationReverted(
        uint16 schemaVersion, uint256 indexed tokenId, uint256 indexed collectionId
    );

    function mintFromManager(
        uint256 collectionId,
        address initialRecipient,
        bytes calldata tokenData_,
        bytes32 tokenDataHash,
        bytes32 mintCommitment
    ) external returns (uint256 tokenId, uint256 collectionSerial);

    function prepareMintFromManager(
        uint256 collectionId,
        bytes calldata tokenData_,
        bytes32 tokenDataHash,
        bytes32 operationId
    ) external returns (uint256 tokenId, uint256 collectionSerial);

    function completePreparedMintFromManager(
        uint256 tokenId,
        address initialRecipient,
        bytes32 operationId,
        bytes32 mintCommitment
    ) external;

    function abortPreparedMintFromManager(uint256 tokenId, bytes32 operationId) external;

    function preparedMint(uint256 tokenId) external view returns (StreamPreparedMintRecord memory);

    function pendingPreparedMintTokenId() external view returns (uint256 tokenId);

    function tokenData(uint256 tokenId) external view returns (bytes memory);
}

interface IStreamCoreBurn {
    event CollectionBurnsBlocked(
        uint16 schemaVersion, uint256 indexed collectionId, bytes32 indexed actionId
    );

    event StreamTokenBurned(
        uint256 indexed tokenId,
        uint256 indexed collectionId,
        uint256 collectionSerial,
        uint16 schemaVersion
    );

    function burn(uint256 tokenId) external;

    function blockCollectionBurns(uint256 collectionId) external;

    function collectionBurnsBlocked(uint256 collectionId) external view returns (bool);

    function collectionBurnsBlockedAtBlock(uint256 collectionId) external view returns (uint64);
}

interface IStreamCorePointers {
    event CoreSatellitePointerUpdated(
        uint16 schemaVersion,
        bytes32 indexed pointerType,
        bytes32 indexed actionId,
        address indexed newTarget,
        address oldTarget
    );

    event CoreSatellitePointerFrozen(
        uint16 schemaVersion,
        bytes32 indexed pointerType,
        bytes32 indexed actionId,
        address target,
        bytes32 manifestHash
    );

    function getSatellitePointer(bytes32 pointerType)
        external
        view
        returns (
            address target,
            bytes32 codeHash,
            bool frozen,
            bytes32 moduleType,
            bytes4 interfaceId,
            address registry,
            uint8 registryStatus,
            bytes32 moduleManifestHash,
            bytes32 deploymentManifestHash,
            uint64 revision
        );

    function updateSatellitePointer(bytes32 pointerType, address newTarget) external;

    function freezeSatellitePointer(bytes32 pointerType) external;
}

interface IStreamCoreGasParameters {
    event GasParameterUpdated(
        uint16 schemaVersion,
        bytes32 indexed parameterId,
        address indexed host,
        bytes32 indexed actionId,
        uint256 oldValue,
        uint256 newValue,
        uint256 floor
    );

    function gasParameterInfo(bytes32 parameterId)
        external
        view
        returns (uint256 value, uint256 floor, uint8 failureClass, uint64 revision);

    function raiseGasParameter(bytes32 parameterId, uint256 newValue) external;
}

interface IStreamCoreMetadataEmitters {
    event MetadataUpdate(uint256 tokenId);
    event BatchMetadataUpdate(uint256 fromTokenId, uint256 toTokenId);

    event StreamMetadataRefresh(
        uint16 schemaVersion,
        bytes32 indexed reasonHash,
        uint256 indexed fromTokenId,
        uint256 indexed toTokenId
    );

    function emitMetadataUpdate(uint256 tokenId, bytes32 reasonHash) external;

    function emitBatchMetadataUpdate(uint256 fromTokenId, uint256 toTokenId, bytes32 reasonHash)
        external;

    function emitContractURIUpdated() external;
}

/// @notice Complete Permanent StreamCore surface. Constructors and custom
///         errors are intentionally outside the locked selector catalog.
interface IStreamCore is
    IERC165,
    IERC721Metadata,
    IERC2981,
    IERC7572,
    IStreamCoreCollectionManagement,
    IStreamCoreIdentity,
    IStreamCoreEnumeration,
    IStreamCoreMint,
    IStreamCoreBurn,
    IStreamCorePointers,
    IStreamCoreGasParameters,
    IStreamCoreMetadataEmitters
{ }
