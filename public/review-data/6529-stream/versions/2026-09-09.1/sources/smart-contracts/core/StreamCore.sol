// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../vendor/openzeppelin/ERC721.sol";
import "../vendor/openzeppelin/IERC165.sol";
import "../interfaces/stream/IStreamCore.sol";
import "./StreamCoreReadBuffer.sol";
import "./StreamCoreExternalReads.sol";
import "../domains/metadata/StreamMetadataRenderer.sol";

/// @notice Protocol-v1 ERC-721 Core with only the Permanent pre-genesis surface.
/// @dev Display metadata, entropy state, mint policy, artist authority, revenue
///      policy, finality manifests, and module lifecycle state live in satellites.
contract StreamCore is ERC721, IStreamCore {
    uint16 private constant _SCHEMA_VERSION = 1;
    uint16 private constant _GGP_SCHEMA_VERSION = 2;

    uint8 private constant _SUPPLY_FIXED = 0;
    uint8 private constant _SUPPLY_CAPPED_OPEN = 1;
    uint8 private constant _SUPPLY_UNCAPPED_OPEN = 2;

    uint8 private constant _STATUS_ACTIVE = 0;
    uint8 private constant _STATUS_PAUSED = 1;
    uint8 private constant _STATUS_CLOSED = 2;

    uint8 private constant _ACTION_IMMEDIATE_TIGHTENING = 0;
    uint8 private constant _ACTION_DELAYED_LOOSENING = 1;
    uint8 private constant _ACTION_TERMINAL_FREEZE = 2;
    uint8 private constant _ACTION_POINTER_REPLACEMENT = 3;
    uint8 private constant _FAILURE_FORWARDING_CAP = 1;
    uint8 private constant _FAILURE_FAIL_CLOSED_PRECHECK = 2;

    uint256 private constant _MAX_TOKEN_DATA_BYTES = 16_384;
    uint256 private constant _MAX_REFRESH_RANGE = 5_000;
    uint256 private constant _ENTROPY_PARENT_GAS_RESERVE = 162_000;
    uint256 private constant _ENTROPY_CALL_UPFRONT_GAS = 3_300;

    bytes32 private constant _STREAM_SUBJECT_COLLECTION_V1 =
        0x3a882a22dad9915c9193738f63216234155080ed4c4fc9bfae446e90f1df6e16;
    bytes32 private constant _STREAM_COLLECTION_CONFIG_STATE_V1 =
        0x854c83f82b7677e58c61a2482a7a430a8318d765d99a95d3fbce5c84be6cc2b5;
    bytes32 private constant _STREAM_COLLECTION_FROZEN_STATE_V1 =
        0xa54d2564d797e7eec4b1cd68d067d7c297bfae640f401ff3b8fde47441079692;
    bytes32 private constant _STREAM_COLLECTION_BURNS_BLOCKED_STATE_V1 =
        0x0a834b49bdbe94b7d08a85a25431e3405b397e5f84bf90a90107edb2a58013ec;

    bytes32 private constant _GGP_ROYALTY_RESOLVER_GAS_LIMIT =
        0x9bae92ab1dd0c5535c65125ea4ee7cff3d55fc31fc2555096c2b5eabceb5bcda;
    bytes32 private constant _GGP_ROYALTY_RETURN_GAS_BUFFER =
        0x0af6f5a1a5059e398191fa0af185be12fee6d609933826603244c7f247793be7;
    bytes32 private constant _GGP_METADATA_ROUTER_GAS_LIMIT =
        0x02ad62929eaa837b9d1704745193125454925fd11a6bf273d7bb1faa23272e93;
    bytes32 private constant _GGP_ENTROPY_REGISTRATION_GAS_LIMIT =
        0x51125071e3dfb233a2711689d4cc377bbda429f1356ebc09a58d763548541e17;

    bytes32 private constant _POINTER_SYSTEM_MANIFEST =
        0x03f4d9e115b9c4c43ab58684ef44935e7cf92d54b8db1d97a707c8526faa3c1b;
    bytes32 private constant _POINTER_STATE_EXPORT_PUBLISHER =
        0x03f5dfc0687afbbc9c86bda58667bf3bb235a2d1cbe7273bbbe4d5301fb0b6d2;
    bytes32 private constant _POINTER_MINT_MANAGER =
        0x136326f089f522351128a5fb79275bd12b2d84fe5bb50d5e46c9f5508d6df7e2;
    bytes32 private constant _POINTER_METADATA_ROUTER =
        0x7024d3e2544fc48a261933c43d901dca0ee3fc26ea2b857748ab0c295a16f20a;
    bytes32 private constant _POINTER_ARTIST_REGISTRY =
        0xaef5244b535c06d7f8e259ec85024ebdfc2d95b38d64f6570dc627a2684749f4;
    bytes32 private constant _POINTER_ARTWORK_FINALITY_RECOVERY =
        0xead6d91d79d13e47343aa9d24c2198c5e4fcd612fdd9531d8b2549bab7651474;
    bytes32 private constant _POINTER_ROYALTY_RESOLVER =
        0xafcd60ac064e6f5b3428ca05e721b02c16a658af3989d079e29e38df5fab9c91;
    bytes32 private constant _POINTER_ENTROPY_COORDINATOR =
        0xb3b3ef20764c647bdeda70b21ab009ff2783106d6995be14389ec6f42ea6dfbb;
    bytes32 private constant _POINTER_ARTWORK_FINALITY_REGISTRY =
        0xd43cf73a122b502fe5e16c9100883f4371b93df4467921d97b4e220819fb8ebe;
    bytes32 private constant _POINTER_COLLECTION_METADATA =
        0xd90b9e0160ba8e56a77078d6022d52bf0cd862ba5a5adfb6f792287e31399f90;
    bytes32 private constant _POINTER_MODULE_REGISTRY =
        0xde86dd5f33a5b2bd22cfbe7752609f5086a946f705768f7e2e6cb501157a41c4;
    bytes32 private constant _POINTER_MINT_LEDGER =
        0xe5dd56591e517e4085238d3b93e69c570fcfba756eed59ca2c4e234606e661cd;

    bytes4 private constant _INTERFACE_ERC4906 = 0x49064906;
    bytes4 private constant _INTERFACE_ERC7572 = 0xe8a3d485;
    bytes4 private constant _INTERFACE_FINALITY_RECOVERY_CORE = 0xb5c73a01;

    bytes4 private constant _ROUTER_TOKEN_URI_SELECTOR =
        bytes4(keccak256("tokenURI(address,uint256)"));
    bytes4 private constant _ROUTER_CONTRACT_URI_SELECTOR =
        bytes4(keccak256("contractURIForCore(address)"));
    bytes4 private constant _ON_TOKEN_MINTED_SELECTOR =
        bytes4(keccak256("onTokenMinted(uint256,uint256,address,bytes32)"));

    error InvalidCoreConfiguration();
    error InvalidGenesisModuleRegistry(address registry);
    error InvalidGasParameterConfiguration(bytes32 parameterId);
    error GasParameterUnknown(bytes32 parameterId);
    error GasParameterTransitionInvalid(bytes32 parameterId);
    error UnauthorizedGovernanceExecutor(address caller);
    error NoExecutingGovernanceAction();
    error GovernanceTransitionMismatch();
    error GovernanceActionClassMismatch(uint8 expected, uint8 actual);
    error GovernanceActionAlreadyApplied(bytes32 actionId);
    error UnknownSatellitePointer(bytes32 pointerType);
    error SatellitePointerInterfaceUnresolved(bytes32 pointerType);
    error InvalidSatellitePointer(bytes32 pointerType, address target);
    error SatellitePointerFrozen(bytes32 pointerType);
    error SatellitePointerNoOp(bytes32 pointerType);
    error RevisionOverflow();
    error CollectionUnknown(uint256 collectionId);
    error InvalidCollectionConfiguration();
    error InvalidCollectionTransition();
    error CollectionIsFrozen(uint256 collectionId);
    error CollectionBurnsAreBlocked(uint256 collectionId);
    error CollectionSupplyReached(uint256 collectionId);
    error MintExecutionInProgress();
    error NotMintManager(address caller);
    error InvalidMintRecipient();
    error InvalidTokenData();
    error PreparedMintAlreadyPending();
    error PreparedMintNotFound();
    error PreparedMintMismatch();
    error PreparedMintAbortNotReplacement();
    error EntropyRegistrationFailed();
    error UnauthorizedMetadataEmitter(address caller);
    error InvalidMetadataRefresh();
    error InvalidBlockHeight();

    struct GenesisModuleRegistryConfig {
        address registry;
        bytes32 runtimeCodeHash;
        bytes32 moduleManifestHash;
        bytes32 deploymentManifestHash;
    }

    struct GasParameterGenesisConfig {
        bytes32 parameterId;
        uint256 genesisValue;
        uint256 floor;
        uint8 failureClass;
    }

    struct CollectionState {
        uint256 maxSupply;
        uint256 mintedEver;
        uint256 burned;
        uint256 nextSerial;
        uint64 burnsBlockedAtBlock;
        uint64 frozenAtBlock;
        uint8 supplyMode;
        uint8 status;
    }

    struct TokenIdentity {
        uint256 collectionId;
        uint256 collectionSerial;
    }

    struct GovernanceContext {
        bytes32 actionId;
        uint8 actionClass;
        bytes32 scopeHash;
        bytes32 oldValueHash;
        bytes32 newValueHash;
    }

    address private immutable _governanceExecutor;

    uint256 private _lastCollectionId;
    uint256 private _lastTokenId;
    uint256 private _liveSupply;

    mapping(uint256 => CollectionState) private _collections;
    mapping(uint256 => TokenIdentity) private _tokenIdentities;
    mapping(uint256 => bytes) private _tokenData;
    mapping(uint256 => address) private _coordinatorAtMint;

    uint256 private _pendingTokenId;
    bytes32 private _pendingOperationId;
    uint256 private _pendingCollectionId;
    address private _pendingPreparingManager;
    uint256 private _completionTokenId;

    mapping(bytes32 => StreamCorePointerState) private _satellitePointers;
    mapping(bytes32 => StreamCoreGasParameterState) private _gasParameters;
    mapping(bytes32 => bytes32) private _lastGasParameterActionIds;

    constructor(
        string memory name_,
        string memory symbol_,
        address governanceExecutor_,
        GenesisModuleRegistryConfig memory genesisRegistry,
        GasParameterGenesisConfig[] memory gasParameters
    ) ERC721(name_, symbol_) {
        if (!StreamCoreExternalReads.isGovernanceExecutor(governanceExecutor_)) {
            revert InvalidCoreConfiguration();
        }
        _governanceExecutor = governanceExecutor_;
        _initializeGenesisRegistry(genesisRegistry);

        if (gasParameters.length != 4) revert InvalidCoreConfiguration();
        for (uint256 i; i < gasParameters.length;) {
            _registerGasParameter(gasParameters[i]);
            unchecked {
                ++i;
            }
        }
        if (
            _gasParameters[_GGP_ROYALTY_RESOLVER_GAS_LIMIT].revision == 0
                || _gasParameters[_GGP_ROYALTY_RETURN_GAS_BUFFER].revision == 0
                || _gasParameters[_GGP_METADATA_ROUTER_GAS_LIMIT].revision == 0
                || _gasParameters[_GGP_ENTROPY_REGISTRATION_GAS_LIMIT].revision == 0
        ) {
            revert InvalidCoreConfiguration();
        }
    }

    // ---------------------------------------------------------------------
    // ERC standards and enumeration
    // ---------------------------------------------------------------------

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, IERC165)
        returns (bool)
    {
        return interfaceId == type(IERC2981).interfaceId || interfaceId == _INTERFACE_ERC4906
            || interfaceId == _INTERFACE_ERC7572 || interfaceId == _INTERFACE_FINALITY_RECOVERY_CORE
            || super.supportsInterface(interfaceId);
    }

    function totalSupply() external view override returns (uint256) {
        return _liveSupply;
    }

    function lastAllocatedTokenId() external view override returns (uint256) {
        return _lastTokenId;
    }

    function lastAllocatedCollectionId() external view override returns (uint256) {
        return _lastCollectionId;
    }

    // ---------------------------------------------------------------------
    // Collection facts and governed collection mutations
    // ---------------------------------------------------------------------

    function collectionExists(uint256 collectionId) public view override returns (bool) {
        return collectionId != 0 && collectionId <= _lastCollectionId;
    }

    function collectionSupplyMode(uint256 collectionId) external view override returns (uint8) {
        return collectionExists(collectionId) ? _collections[collectionId].supplyMode : 0;
    }

    function collectionStatus(uint256 collectionId) external view override returns (uint8) {
        return collectionExists(collectionId) ? _collections[collectionId].status : 0;
    }

    function collectionHasMaxSupply(uint256 collectionId) external view override returns (bool) {
        return collectionExists(collectionId)
            && _collections[collectionId].supplyMode != _SUPPLY_UNCAPPED_OPEN;
    }

    function collectionMaxSupply(uint256 collectionId) external view override returns (uint256) {
        return collectionExists(collectionId) ? _collections[collectionId].maxSupply : 0;
    }

    function collectionMintedEver(uint256 collectionId) external view override returns (uint256) {
        return collectionExists(collectionId) ? _collections[collectionId].mintedEver : 0;
    }

    function collectionNextSerial(uint256 collectionId) external view override returns (uint256) {
        return collectionExists(collectionId) ? _collections[collectionId].nextSerial : 0;
    }

    function totalSupplyOfCollection(uint256 collectionId)
        external
        view
        override
        returns (uint256)
    {
        if (!collectionExists(collectionId)) return 0;
        CollectionState storage collection = _collections[collectionId];
        return collection.mintedEver - collection.burned;
    }

    function collectionFreezeStatus(uint256 collectionId) public view override returns (bool) {
        return collectionExists(collectionId) && _collections[collectionId].frozenAtBlock != 0;
    }

    function createCollection(
        uint8 supplyMode,
        bool hasMaxSupply,
        uint256 maxSupply,
        uint8 initialStatus
    ) external override returns (uint256 collectionId) {
        GovernanceContext memory context = _governanceContext();
        _requireNoMintExecution();
        if (
            initialStatus > _STATUS_PAUSED || supplyMode > _SUPPLY_UNCAPPED_OPEN
                || (supplyMode == _SUPPLY_UNCAPPED_OPEN
                        ? hasMaxSupply || maxSupply != 0
                        : !hasMaxSupply || maxSupply == 0)
        ) {
            revert InvalidCollectionConfiguration();
        }
        if (_lastCollectionId == type(uint256).max) revert RevisionOverflow();
        collectionId = _lastCollectionId + 1;
        bytes32 scopeHash = _collectionScopeHash(collectionId);
        bytes32 oldValueHash = _collectionConfigStateHash(scopeHash, false, 0, 0, false, 0);
        bytes32 newValueHash = _collectionConfigStateHash(
            scopeHash, true, supplyMode, initialStatus, hasMaxSupply, maxSupply
        );
        _requireGovernanceTransition(
            context, _ACTION_DELAYED_LOOSENING, scopeHash, oldValueHash, newValueHash
        );

        _lastCollectionId = collectionId;
        CollectionState storage collection = _collections[collectionId];
        collection.maxSupply = maxSupply;
        collection.nextSerial = 1;
        collection.supplyMode = supplyMode;
        collection.status = initialStatus;
        emit StreamCollectionCreated(
            _SCHEMA_VERSION,
            collectionId,
            context.actionId,
            supplyMode,
            hasMaxSupply,
            maxSupply,
            initialStatus
        );
    }

    function setCollectionStatus(uint256 collectionId, uint8 newStatus) external override {
        GovernanceContext memory context = _governanceContext();
        _requireNoMintExecution();
        _requireCollection(collectionId);
        if (collectionFreezeStatus(collectionId)) revert CollectionIsFrozen(collectionId);
        CollectionState storage collection = _collections[collectionId];
        uint8 oldStatus = collection.status;
        if (
            newStatus > _STATUS_CLOSED || newStatus == oldStatus || oldStatus == _STATUS_CLOSED
                || (newStatus != _STATUS_CLOSED
                    && !((oldStatus == _STATUS_ACTIVE && newStatus == _STATUS_PAUSED)
                        || (oldStatus == _STATUS_PAUSED && newStatus == _STATUS_ACTIVE)))
        ) {
            revert InvalidCollectionTransition();
        }
        uint8 expectedClass = newStatus == _STATUS_CLOSED
            ? _ACTION_TERMINAL_FREEZE
            : (newStatus == _STATUS_PAUSED
                    ? _ACTION_IMMEDIATE_TIGHTENING
                    : _ACTION_DELAYED_LOOSENING);
        bytes32 scopeHash = _collectionScopeHash(collectionId);
        bytes32 oldValueHash = _collectionConfigStateHash(
            scopeHash,
            true,
            collection.supplyMode,
            oldStatus,
            collection.supplyMode != _SUPPLY_UNCAPPED_OPEN,
            collection.maxSupply
        );
        bytes32 newValueHash = _collectionConfigStateHash(
            scopeHash,
            true,
            collection.supplyMode,
            newStatus,
            collection.supplyMode != _SUPPLY_UNCAPPED_OPEN,
            collection.maxSupply
        );
        _requireGovernanceTransition(context, expectedClass, scopeHash, oldValueHash, newValueHash);
        collection.status = newStatus;
        emit StreamCollectionStatusUpdated(
            _SCHEMA_VERSION, collectionId, context.actionId, oldStatus, newStatus
        );
    }

    function setCollectionMaxSupply(uint256 collectionId, uint256 newMaxSupply) external override {
        GovernanceContext memory context = _governanceContext();
        _requireNoMintExecution();
        _requireCollection(collectionId);
        if (collectionFreezeStatus(collectionId)) revert CollectionIsFrozen(collectionId);
        CollectionState storage collection = _collections[collectionId];
        uint256 oldMaxSupply = collection.maxSupply;
        if (
            collection.supplyMode != _SUPPLY_CAPPED_OPEN || collection.status == _STATUS_CLOSED
                || newMaxSupply == oldMaxSupply || newMaxSupply < collection.mintedEver
                || newMaxSupply == 0
        ) {
            revert InvalidCollectionTransition();
        }
        uint8 expectedClass =
            newMaxSupply < oldMaxSupply ? _ACTION_IMMEDIATE_TIGHTENING : _ACTION_DELAYED_LOOSENING;
        bytes32 scopeHash = _collectionScopeHash(collectionId);
        bytes32 oldValueHash = _collectionConfigStateHash(
            scopeHash, true, collection.supplyMode, collection.status, true, oldMaxSupply
        );
        bytes32 newValueHash = _collectionConfigStateHash(
            scopeHash, true, collection.supplyMode, collection.status, true, newMaxSupply
        );
        _requireGovernanceTransition(context, expectedClass, scopeHash, oldValueHash, newValueHash);
        collection.maxSupply = newMaxSupply;
        emit StreamCollectionMaxSupplyUpdated(
            _SCHEMA_VERSION, collectionId, context.actionId, oldMaxSupply, newMaxSupply
        );
    }

    function blockCollectionBurns(uint256 collectionId) external override {
        GovernanceContext memory context = _governanceContext();
        _requireNoMintExecution();
        _requireCollection(collectionId);
        CollectionState storage collection = _collections[collectionId];
        if (
            collection.status != _STATUS_CLOSED || collection.burnsBlockedAtBlock != 0
                || collection.frozenAtBlock != 0
        ) {
            revert InvalidCollectionTransition();
        }
        bytes32 scopeHash = _collectionScopeHash(collectionId);
        bytes32 oldValueHash =
            keccak256(abi.encode(_STREAM_COLLECTION_BURNS_BLOCKED_STATE_V1, scopeHash, false));
        bytes32 newValueHash =
            keccak256(abi.encode(_STREAM_COLLECTION_BURNS_BLOCKED_STATE_V1, scopeHash, true));
        _requireGovernanceTransition(
            context, _ACTION_TERMINAL_FREEZE, scopeHash, oldValueHash, newValueHash
        );
        collection.burnsBlockedAtBlock = _blockNumber64();
        emit CollectionBurnsBlocked(_SCHEMA_VERSION, collectionId, context.actionId);
    }

    function collectionBurnsBlocked(uint256 collectionId) public view override returns (bool) {
        return collectionExists(collectionId) && _collections[collectionId].burnsBlockedAtBlock != 0;
    }

    function collectionBurnsBlockedAtBlock(uint256 collectionId)
        external
        view
        override
        returns (uint64)
    {
        return collectionExists(collectionId) ? _collections[collectionId].burnsBlockedAtBlock : 0;
    }

    function freezeCollection(uint256 collectionId) external override {
        GovernanceContext memory context = _governanceContext();
        _requireNoMintExecution();
        _requireCollection(collectionId);
        CollectionState storage collection = _collections[collectionId];
        if (
            collection.status != _STATUS_CLOSED || collection.burnsBlockedAtBlock == 0
                || collection.frozenAtBlock != 0
        ) {
            revert InvalidCollectionTransition();
        }
        bytes32 scopeHash = _collectionScopeHash(collectionId);
        bytes32 oldValueHash =
            keccak256(abi.encode(_STREAM_COLLECTION_FROZEN_STATE_V1, scopeHash, false));
        bytes32 newValueHash =
            keccak256(abi.encode(_STREAM_COLLECTION_FROZEN_STATE_V1, scopeHash, true));
        _requireGovernanceTransition(
            context, _ACTION_TERMINAL_FREEZE, scopeHash, oldValueHash, newValueHash
        );
        collection.frozenAtBlock = _blockNumber64();
        emit CollectionFrozen(_SCHEMA_VERSION, collectionId, context.actionId);
    }

    // ---------------------------------------------------------------------
    // Token identity, manager-only minting, and burn
    // ---------------------------------------------------------------------

    function tokenCollectionIdentity(uint256 tokenId)
        public
        view
        override
        returns (bool mappingExists, uint256 collectionId, uint256 collectionSerial, bool burned)
    {
        TokenIdentity storage identity = _tokenIdentities[tokenId];
        collectionId = identity.collectionId;
        if (collectionId == 0) return (false, 0, 0, false);
        mappingExists = true;
        collectionSerial = identity.collectionSerial;
        burned = _ownerOf(tokenId) == address(0) && tokenId != _pendingTokenId
            && tokenId != _completionTokenId;
    }

    function tokenLifecycle(uint256 tokenId) public view override returns (uint8 lifecycle) {
        if (_tokenIdentities[tokenId].collectionId == 0) {
            return uint8(StreamTokenLifecycle.UNKNOWN);
        }
        if (_ownerOf(tokenId) != address(0)) return uint8(StreamTokenLifecycle.MINTED);
        if (tokenId == _pendingTokenId || tokenId == _completionTokenId) {
            return uint8(StreamTokenLifecycle.PREPARED_INCOMPLETE);
        }
        return uint8(StreamTokenLifecycle.BURNED);
    }

    function coordinatorAtMint(uint256 tokenId) external view override returns (address) {
        return _coordinatorAtMint[tokenId];
    }

    function tokenData(uint256 tokenId) external view override returns (bytes memory) {
        return _tokenData[tokenId];
    }

    function pendingPreparedMintTokenId() external view override returns (uint256 tokenId) {
        return _pendingTokenId;
    }

    function preparedMint(uint256 tokenId)
        external
        view
        override
        returns (StreamPreparedMintRecord memory record)
    {
        if (tokenId == _pendingTokenId && tokenId != 0) {
            record = StreamPreparedMintRecord(true, _pendingOperationId, _pendingCollectionId);
        }
    }

    function mintFromManager(
        uint256 collectionId,
        address initialRecipient,
        bytes calldata tokenData_,
        bytes32 tokenDataHash,
        bytes32 mintCommitment
    ) external override returns (uint256 tokenId, uint256 collectionSerial) {
        _requireMintManager();
        _requireNoMintExecution();
        if (initialRecipient == address(0)) revert InvalidMintRecipient();
        _validateTokenData(tokenData_, tokenDataHash);
        (tokenId, collectionSerial) = _allocateTokenIdentity(collectionId, tokenData_);
        _completionTokenId = tokenId;
        _completeMint(collectionId, tokenId, initialRecipient, mintCommitment);
        _completionTokenId = 0;
    }

    function prepareMintFromManager(
        uint256 collectionId,
        bytes calldata tokenData_,
        bytes32 tokenDataHash,
        bytes32 operationId
    ) external override returns (uint256 tokenId, uint256 collectionSerial) {
        address manager = _requireMintManager();
        _requireNoMintExecution();
        if (operationId == bytes32(0)) revert PreparedMintMismatch();
        _validateTokenData(tokenData_, tokenDataHash);
        (tokenId, collectionSerial) = _allocateTokenIdentity(collectionId, tokenData_);
        _pendingTokenId = tokenId;
        _pendingOperationId = operationId;
        _pendingCollectionId = collectionId;
        _pendingPreparingManager = manager;
    }

    function completePreparedMintFromManager(
        uint256 tokenId,
        address initialRecipient,
        bytes32 operationId,
        bytes32 mintCommitment
    ) external override {
        address manager = _requireMintManager();
        if (initialRecipient == address(0)) revert InvalidMintRecipient();
        if (_completionTokenId != 0) revert MintExecutionInProgress();
        if (_pendingTokenId == 0) revert PreparedMintNotFound();
        if (
            tokenId != _pendingTokenId || operationId != _pendingOperationId
                || manager != _pendingPreparingManager
        ) {
            revert PreparedMintMismatch();
        }
        uint256 collectionId = _pendingCollectionId;
        _pendingTokenId = 0;
        _pendingOperationId = bytes32(0);
        _pendingCollectionId = 0;
        _pendingPreparingManager = address(0);
        _completionTokenId = tokenId;
        _completeMint(collectionId, tokenId, initialRecipient, mintCommitment);
        _completionTokenId = 0;
    }

    function abortPreparedMintFromManager(uint256 tokenId, bytes32 operationId) external override {
        address manager = _requireMintManager();
        if (_completionTokenId != 0) revert MintExecutionInProgress();
        if (_pendingTokenId == 0) revert PreparedMintNotFound();
        if (tokenId != _pendingTokenId || operationId != _pendingOperationId) {
            revert PreparedMintMismatch();
        }
        if (manager == _pendingPreparingManager) revert PreparedMintAbortNotReplacement();
        uint256 collectionId = _pendingCollectionId;
        _pendingTokenId = 0;
        _pendingOperationId = bytes32(0);
        _pendingCollectionId = 0;
        _pendingPreparingManager = address(0);
        delete _tokenIdentities[tokenId];
        delete _tokenData[tokenId];
        delete _coordinatorAtMint[tokenId];
        CollectionState storage collection = _collections[collectionId];
        unchecked {
            --_lastTokenId;
            --collection.nextSerial;
        }
        emit TokenCollectionRegistrationReverted(_SCHEMA_VERSION, tokenId, collectionId);
    }

    function burn(uint256 tokenId) external override {
        if (_completionTokenId != 0) revert MintExecutionInProgress();
        if (!_isApprovedOrOwner(msg.sender, tokenId)) {
            revert("ERC721: caller is not token owner or approved");
        }
        TokenIdentity storage identity = _tokenIdentities[tokenId];
        uint256 collectionId = identity.collectionId;
        if (collectionBurnsBlocked(collectionId) || collectionFreezeStatus(collectionId)) {
            revert CollectionBurnsAreBlocked(collectionId);
        }
        uint256 collectionSerial = identity.collectionSerial;
        _burn(tokenId);
        CollectionState storage collection = _collections[collectionId];
        unchecked {
            ++collection.burned;
            --_liveSupply;
        }
        emit StreamTokenBurned(tokenId, collectionId, collectionSerial, _SCHEMA_VERSION);
    }

    // ---------------------------------------------------------------------
    // Core satellite pointers
    // ---------------------------------------------------------------------

    function getSatellitePointer(bytes32 pointerType)
        external
        view
        override
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
        )
    {
        StreamCorePointerState storage pointer = _satellitePointers[pointerType];
        return (
            pointer.target,
            pointer.codeHash,
            pointer.frozen,
            pointer.moduleType,
            pointer.interfaceId,
            pointer.registry,
            pointer.registryStatus,
            pointer.moduleManifestHash,
            pointer.deploymentManifestHash,
            pointer.revision
        );
    }

    function updateSatellitePointer(bytes32 pointerType, address newTarget) external override {
        GovernanceContext memory context = _governanceContext();
        if (_completionTokenId != 0) revert MintExecutionInProgress();
        if (_pendingTokenId != 0 && pointerType != _POINTER_MINT_MANAGER) {
            revert PreparedMintAlreadyPending();
        }
        StreamCorePointerState storage current = _satellitePointers[pointerType];
        if (current.frozen) revert SatellitePointerFrozen(pointerType);
        StreamCorePointerState memory previous = current;
        StreamCorePointerState memory registryPointer = _satellitePointers[_POINTER_MODULE_REGISTRY];
        uint64 prospectiveRevision = previous.revision;
        if (prospectiveRevision != type(uint64).max) {
            unchecked {
                ++prospectiveRevision;
            }
        }
        (StreamCoreValidationStatus status, StreamCorePointerTransitionPlan memory plan) = StreamCoreExternalReads.preparePointerUpdate(
            registryPointer,
            previous,
            pointerType,
            newTarget,
            _governanceExecutor,
            prospectiveRevision
        );
        if (status == StreamCoreValidationStatus.UNKNOWN_POINTER) {
            revert UnknownSatellitePointer(pointerType);
        }
        if (status == StreamCoreValidationStatus.UNRESOLVED_INTERFACE) {
            revert SatellitePointerInterfaceUnresolved(pointerType);
        }
        if (status == StreamCoreValidationStatus.INVALID_REGISTRY) {
            revert InvalidSatellitePointer(_POINTER_MODULE_REGISTRY, registryPointer.target);
        }
        if (status != StreamCoreValidationStatus.VALID) {
            revert InvalidSatellitePointer(pointerType, newTarget);
        }
        plan.candidate.revision = _nextRevision(previous.revision);
        if (plan.preRevisionCandidateHash == plan.oldValueHash) {
            revert SatellitePointerNoOp(pointerType);
        }
        _requireGovernanceTransition(
            context,
            _ACTION_POINTER_REPLACEMENT,
            plan.scopeHash,
            plan.oldValueHash,
            plan.newValueHash
        );
        address oldTarget = current.target;
        _satellitePointers[pointerType] = plan.candidate;
        emit CoreSatellitePointerUpdated(
            _SCHEMA_VERSION, pointerType, context.actionId, newTarget, oldTarget
        );
    }

    function freezeSatellitePointer(bytes32 pointerType) external override {
        GovernanceContext memory context = _governanceContext();
        _requireNoMintExecution();
        _pointerConfiguration(pointerType, address(0));
        StreamCorePointerState storage current = _satellitePointers[pointerType];
        if (current.target == address(0)) revert InvalidSatellitePointer(pointerType, address(0));
        if (current.frozen) revert SatellitePointerFrozen(pointerType);
        StreamCorePointerState memory previous = current;
        StreamCorePointerState memory candidate = current;
        candidate.frozen = true;
        candidate.revision = _nextRevision(current.revision);
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            StreamCoreExternalReads.pointerTransitionHashes(pointerType, previous, candidate);
        _requireGovernanceTransition(
            context, _ACTION_TERMINAL_FREEZE, scopeHash, oldValueHash, newValueHash
        );
        _satellitePointers[pointerType] = candidate;
        emit CoreSatellitePointerFrozen(
            _SCHEMA_VERSION, pointerType, context.actionId, candidate.target, newValueHash
        );
    }

    // ---------------------------------------------------------------------
    // Core-minimal Governed Gas Parameters
    // ---------------------------------------------------------------------

    function gasParameterInfo(bytes32 parameterId)
        external
        view
        override
        returns (uint256 value, uint256 floor, uint8 failureClass, uint64 revision)
    {
        StreamCoreGasParameterState storage parameter = _gasParameters[parameterId];
        return (parameter.value, parameter.floor, parameter.failureClass, parameter.revision);
    }

    function raiseGasParameter(bytes32 parameterId, uint256 newValue) external override {
        GovernanceContext memory context = _governanceContext();
        _requireNoMintExecution();
        StreamCoreGasParameterState storage parameter = _requireGasParameter(parameterId);
        _requireRaise(parameterId, parameter.value, newValue);
        _setGovernedGasValue(parameterId, parameter, newValue, context);
    }

    // ---------------------------------------------------------------------
    // Bounded metadata and royalty reads
    // ---------------------------------------------------------------------

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, IERC721Metadata)
        returns (string memory)
    {
        _requireMinted(tokenId);
        StreamCorePointerState storage pointer = _satellitePointers[_POINTER_METADATA_ROUTER];
        if (pointer.target == address(0)) {
            return StreamMetadataRenderer.coreFallbackTokenURI(tokenId, 4);
        }
        if (!_pointerCodeIsLive(pointer)) {
            return StreamMetadataRenderer.coreFallbackTokenURI(tokenId, 5);
        }
        (uint8 status, string memory value) = StreamCoreExternalReads.boundedRouterString(
            pointer.target,
            abi.encodeWithSelector(_ROUTER_TOKEN_URI_SELECTOR, address(this), tokenId),
            _gasParameters[_GGP_METADATA_ROUTER_GAS_LIMIT].value,
            _gasParameters[_GGP_ROYALTY_RETURN_GAS_BUFFER].value
        );
        return status == 0 ? value : StreamMetadataRenderer.coreFallbackTokenURI(tokenId, status);
    }

    function contractURI() external view override returns (string memory) {
        StreamCorePointerState storage pointer = _satellitePointers[_POINTER_METADATA_ROUTER];
        if (pointer.target == address(0)) {
            return StreamMetadataRenderer.coreFallbackContractURI(4);
        }
        if (!_pointerCodeIsLive(pointer)) {
            return StreamMetadataRenderer.coreFallbackContractURI(5);
        }
        (uint8 status, string memory value) = StreamCoreExternalReads.boundedRouterString(
            pointer.target,
            abi.encodeWithSelector(_ROUTER_CONTRACT_URI_SELECTOR, address(this)),
            _gasParameters[_GGP_METADATA_ROUTER_GAS_LIMIT].value,
            _gasParameters[_GGP_ROYALTY_RETURN_GAS_BUFFER].value
        );
        return status == 0 ? value : StreamMetadataRenderer.coreFallbackContractURI(status);
    }

    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        StreamCorePointerState storage pointer = _satellitePointers[_POINTER_ROYALTY_RESOLVER];
        if (!_pointerCodeIsLive(pointer)) return (address(0), 0);
        (bool mappingExists, uint256 collectionId,,) = tokenCollectionIdentity(tokenId);
        return StreamCoreExternalReads.resolveRoyalty(
            pointer.target,
            _gasParameters[_GGP_ROYALTY_RESOLVER_GAS_LIMIT].value,
            _gasParameters[_GGP_ROYALTY_RETURN_GAS_BUFFER].value,
            abi.encodeWithSelector(
                bytes4(keccak256("royaltyReceiverAndBps(address,uint256,uint256,uint256,bool)")),
                address(this),
                tokenId,
                salePrice,
                collectionId,
                mappingExists
            ),
            salePrice
        );
    }

    // ---------------------------------------------------------------------
    // Restricted Core-originated metadata refresh events
    // ---------------------------------------------------------------------

    function emitMetadataUpdate(uint256 tokenId, bytes32 reasonHash) external override {
        uint8 lifecycle = tokenLifecycle(tokenId);
        address caller = msg.sender;
        if (
            !_isCurrentPointerCaller(_POINTER_METADATA_ROUTER, caller)
                && !_isCurrentPointerCaller(_POINTER_ARTWORK_FINALITY_REGISTRY, caller)
                && (_coordinatorAtMint[tokenId] == address(0)
                    || _coordinatorAtMint[tokenId] != caller)
        ) {
            revert UnauthorizedMetadataEmitter(caller);
        }
        if (
            reasonHash == bytes32(0)
                || (lifecycle != uint8(StreamTokenLifecycle.MINTED)
                    && lifecycle != uint8(StreamTokenLifecycle.BURNED))
        ) {
            revert InvalidMetadataRefresh();
        }
        emit MetadataUpdate(tokenId);
        emit StreamMetadataRefresh(_SCHEMA_VERSION, reasonHash, tokenId, tokenId);
    }

    function emitBatchMetadataUpdate(uint256 fromTokenId, uint256 toTokenId, bytes32 reasonHash)
        external
        override
    {
        if (
            !_isCurrentPointerCaller(_POINTER_METADATA_ROUTER, msg.sender)
                && !_isCurrentPointerCaller(_POINTER_ARTWORK_FINALITY_REGISTRY, msg.sender)
                && !_isCurrentPointerCaller(_POINTER_ARTWORK_FINALITY_RECOVERY, msg.sender)
        ) {
            revert UnauthorizedMetadataEmitter(msg.sender);
        }
        if (
            reasonHash == bytes32(0) || fromTokenId == 0 || fromTokenId > toTokenId
                || toTokenId > _lastTokenId || toTokenId - fromTokenId >= _MAX_REFRESH_RANGE
        ) {
            revert InvalidMetadataRefresh();
        }
        emit BatchMetadataUpdate(fromTokenId, toTokenId);
        emit StreamMetadataRefresh(_SCHEMA_VERSION, reasonHash, fromTokenId, toTokenId);
    }

    function emitContractURIUpdated() external override {
        if (!_isCurrentPointerCaller(_POINTER_METADATA_ROUTER, msg.sender)) {
            revert UnauthorizedMetadataEmitter(msg.sender);
        }
        emit ContractURIUpdated();
    }

    // ---------------------------------------------------------------------
    // Mint internals
    // ---------------------------------------------------------------------

    function _allocateTokenIdentity(uint256 collectionId, bytes calldata tokenData_)
        private
        returns (uint256 tokenId, uint256 collectionSerial)
    {
        _requireCollection(collectionId);
        CollectionState storage collection = _collections[collectionId];
        if (collection.status != _STATUS_ACTIVE || collection.frozenAtBlock != 0) {
            revert InvalidCollectionTransition();
        }
        if (
            collection.supplyMode != _SUPPLY_UNCAPPED_OPEN
                && collection.mintedEver >= collection.maxSupply
        ) {
            revert CollectionSupplyReached(collectionId);
        }
        if (_lastTokenId == type(uint256).max || collection.nextSerial == type(uint256).max) {
            revert RevisionOverflow();
        }
        tokenId = _lastTokenId + 1;
        collectionSerial = collection.nextSerial;
        _lastTokenId = tokenId;
        collection.nextSerial = collectionSerial + 1;
        _tokenIdentities[tokenId] = TokenIdentity(collectionId, collectionSerial);
        _tokenData[tokenId] = tokenData_;
        emit TokenCollectionRegistered(_SCHEMA_VERSION, tokenId, collectionId, collectionSerial);
    }

    function _completeMint(
        uint256 collectionId,
        uint256 tokenId,
        address initialRecipient,
        bytes32 mintCommitment
    ) private {
        StreamCorePointerState storage entropyPointer =
            _satellitePointers[_POINTER_ENTROPY_COORDINATOR];
        if (!_pointerCodeIsLive(entropyPointer)) revert EntropyRegistrationFailed();
        address coordinator = entropyPointer.target;
        _coordinatorAtMint[tokenId] = coordinator;
        uint256 callGas = _gasParameters[_GGP_ENTROPY_REGISTRATION_GAS_LIMIT].value;
        bytes memory callData = abi.encodeWithSelector(
            _ON_TOKEN_MINTED_SELECTOR, collectionId, tokenId, initialRecipient, mintCommitment
        );
        if (!StreamCoreReadBuffer.hasSufficientParentGas(
                gasleft(), callGas, _ENTROPY_PARENT_GAS_RESERVE + _ENTROPY_CALL_UPFRONT_GAS
            )) {
            revert EntropyRegistrationFailed();
        }
        bool ok;
        uint256 returnSize;
        assembly ("memory-safe") {
            ok := call(callGas, coordinator, 0, add(callData, 0x20), mload(callData), 0, 0)
            returnSize := returndatasize()
        }
        if (!ok || returnSize != 0) revert EntropyRegistrationFailed();

        CollectionState storage collection = _collections[collectionId];
        unchecked {
            ++collection.mintedEver;
            ++_liveSupply;
        }
        _safeMint(initialRecipient, tokenId);
    }

    function _validateTokenData(bytes calldata tokenData_, bytes32 tokenDataHash) private pure {
        if (tokenData_.length > _MAX_TOKEN_DATA_BYTES || keccak256(tokenData_) != tokenDataHash) {
            revert InvalidTokenData();
        }
    }

    function _requireMintManager() private view returns (address manager) {
        StreamCorePointerState storage pointer = _satellitePointers[_POINTER_MINT_MANAGER];
        manager = pointer.target;
        if (msg.sender != manager || !_pointerCodeIsLive(pointer)) {
            revert NotMintManager(msg.sender);
        }
    }

    function _requireNoMintExecution() private view {
        if (_pendingTokenId != 0) revert PreparedMintAlreadyPending();
        if (_completionTokenId != 0) revert MintExecutionInProgress();
    }

    // ---------------------------------------------------------------------
    // Governance and collection hash internals
    // ---------------------------------------------------------------------

    function _governanceContext() private view returns (GovernanceContext memory context) {
        if (msg.sender != _governanceExecutor) {
            revert UnauthorizedGovernanceExecutor(msg.sender);
        }
        (bool ok, StreamCoreExternalReads.CurrentAction memory action) =
            StreamCoreExternalReads.readCurrentAction(_governanceExecutor);
        if (!ok || !action.executing || action.actionId == bytes32(0)) {
            revert NoExecutingGovernanceAction();
        }
        context = GovernanceContext(
            action.actionId,
            action.actionClass,
            action.scopeHash,
            action.oldValueHash,
            action.newValueHash
        );
    }

    function _requireGovernanceTransition(
        GovernanceContext memory context,
        uint8 expectedClass,
        bytes32 scopeHash,
        bytes32 oldValueHash,
        bytes32 newValueHash
    ) private pure {
        if (context.actionClass != expectedClass) {
            revert GovernanceActionClassMismatch(expectedClass, context.actionClass);
        }
        if (
            context.scopeHash != scopeHash || context.oldValueHash != oldValueHash
                || context.newValueHash != newValueHash
        ) {
            revert GovernanceTransitionMismatch();
        }
    }

    function _collectionScopeHash(uint256 collectionId) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                _STREAM_SUBJECT_COLLECTION_V1, uint256(block.chainid), address(this), collectionId
            )
        );
    }

    function _collectionConfigStateHash(
        bytes32 scopeHash,
        bool exists,
        uint8 supplyMode,
        uint8 status,
        bool hasMaxSupply,
        uint256 maxSupply
    ) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                _STREAM_COLLECTION_CONFIG_STATE_V1,
                scopeHash,
                exists,
                supplyMode,
                status,
                hasMaxSupply,
                maxSupply
            )
        );
    }

    function _requireCollection(uint256 collectionId) private view {
        if (!collectionExists(collectionId)) revert CollectionUnknown(collectionId);
    }

    function _blockNumber64() private view returns (uint64 value) {
        if (block.number == 0 || block.number > type(uint64).max) revert InvalidBlockHeight();
        value = uint64(block.number);
    }

    // ---------------------------------------------------------------------
    // Pointer validation and hashing
    // ---------------------------------------------------------------------

    function _initializeGenesisRegistry(GenesisModuleRegistryConfig memory config) private {
        address registry = config.registry;
        (bool valid, StreamCorePointerState memory pointer) = StreamCoreExternalReads.genesisModuleRegistry(
            registry,
            config.runtimeCodeHash,
            config.moduleManifestHash,
            config.deploymentManifestHash
        );
        if (!valid) revert InvalidGenesisModuleRegistry(registry);
        _satellitePointers[_POINTER_MODULE_REGISTRY] = pointer;
    }

    function _pointerConfiguration(bytes32 pointerType, address target)
        private
        view
        returns (bytes32 moduleType, bytes4 interfaceId)
    {
        bool known;
        (known, moduleType, interfaceId) = StreamCoreExternalReads.pointerConfiguration(
            pointerType, target, _governanceExecutor
        );
        if (!known) revert UnknownSatellitePointer(pointerType);
    }

    function _pointerCodeIsLive(StreamCorePointerState storage pointer)
        private
        view
        returns (bool)
    {
        return StreamCoreExternalReads.codeIsLive(pointer.target, pointer.codeHash);
    }

    function _isCurrentPointerCaller(bytes32 pointerType, address caller)
        private
        view
        returns (bool)
    {
        StreamCorePointerState storage pointer = _satellitePointers[pointerType];
        return caller != address(0) && caller == pointer.target && _pointerCodeIsLive(pointer);
    }

    // ---------------------------------------------------------------------
    // Core-minimal raise-only GGP validation and hashing
    // ---------------------------------------------------------------------

    function _registerGasParameter(GasParameterGenesisConfig memory config) private {
        bytes32 parameterId = config.parameterId;
        uint8 expectedClass = _expectedFailureClass(parameterId);
        if (
            _gasParameters[parameterId].revision != 0 || config.genesisValue < config.floor
                || config.floor == 0 || config.failureClass != expectedClass
        ) {
            revert InvalidGasParameterConfiguration(parameterId);
        }
        _gasParameters[parameterId] = StreamCoreGasParameterState({
            value: config.genesisValue,
            floor: config.floor,
            failureClass: config.failureClass,
            revision: 1
        });
    }

    function _expectedFailureClass(bytes32 parameterId) private pure returns (uint8) {
        if (
            parameterId == _GGP_ROYALTY_RESOLVER_GAS_LIMIT
                || parameterId == _GGP_ROYALTY_RETURN_GAS_BUFFER
                || parameterId == _GGP_METADATA_ROUTER_GAS_LIMIT
        ) {
            return _FAILURE_FORWARDING_CAP;
        }
        if (parameterId == _GGP_ENTROPY_REGISTRATION_GAS_LIMIT) {
            return _FAILURE_FAIL_CLOSED_PRECHECK;
        }
        revert GasParameterUnknown(parameterId);
    }

    function _requireGasParameter(bytes32 parameterId)
        private
        view
        returns (StreamCoreGasParameterState storage parameter)
    {
        parameter = _gasParameters[parameterId];
        if (parameter.revision == 0) revert GasParameterUnknown(parameterId);
    }

    function _requireRaise(bytes32 parameterId, uint256 oldValue, uint256 newValue) private pure {
        if (newValue <= oldValue || newValue - oldValue > oldValue || oldValue == type(uint256).max)
        {
            revert GasParameterTransitionInvalid(parameterId);
        }
    }

    function _setGovernedGasValue(
        bytes32 parameterId,
        StreamCoreGasParameterState storage parameter,
        uint256 newValue,
        GovernanceContext memory context
    ) private {
        StreamCoreGasParameterState memory previous = parameter;
        StreamCoreGasParameterState memory candidate = parameter;
        uint256 oldValue = candidate.value;
        candidate.value = newValue;
        candidate.revision = _nextRevision(candidate.revision);
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            StreamCoreExternalReads.gasParameterTransitionHashes(parameterId, previous, candidate);
        _requireGovernanceTransition(
            context, _ACTION_DELAYED_LOOSENING, scopeHash, oldValueHash, newValueHash
        );
        if (_lastGasParameterActionIds[parameterId] == context.actionId) {
            revert GovernanceActionAlreadyApplied(context.actionId);
        }
        _gasParameters[parameterId] = candidate;
        _lastGasParameterActionIds[parameterId] = context.actionId;
        emit GasParameterUpdated(
            _GGP_SCHEMA_VERSION,
            parameterId,
            address(this),
            context.actionId,
            oldValue,
            newValue,
            candidate.floor
        );
    }

    function _nextRevision(uint64 revision) private pure returns (uint64) {
        if (revision == type(uint64).max) revert RevisionOverflow();
        return revision + 1;
    }
}
