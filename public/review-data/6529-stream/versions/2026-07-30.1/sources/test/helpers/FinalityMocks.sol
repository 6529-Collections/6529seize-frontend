// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../smart-contracts/StreamArtworkFinalityTypes.sol";

/// @notice Governance-authority mock for the IStreamFinalityGovernanceAuthority seam.
contract MockFinalityAuthority {
    mapping(bytes32 => mapping(address => bool)) private _roles;
    mapping(bytes32 => address) private _guardians;
    address private _defaultGuardian;
    uint64 private _vetoDeadline;

    function setRole(bytes32 roleId, address account, bool granted) external {
        _roles[roleId][account] = granted;
    }

    function setDefaultGuardian(address guardian) external {
        _defaultGuardian = guardian;
    }

    function setGuardian(bytes32 scopeHash, address guardian) external {
        _guardians[scopeHash] = guardian;
    }

    function setVetoDeadline(uint64 deadline) external {
        _vetoDeadline = deadline;
    }

    function hasStreamRole(bytes32 roleId, address account) external view returns (bool) {
        return _roles[roleId][account];
    }

    function terminalFreezeVetoGuardian(bytes32 scopeHash)
        external
        view
        returns (address guardian, uint64 vetoDeadline)
    {
        address specific = _guardians[scopeHash];
        return (specific == address(0) ? _defaultGuardian : specific, _vetoDeadline);
    }
}

/// @notice Granular target-Core mock consumed by StreamCoreFinalityAdapter.
contract MockFinalityCore {
    struct TokenIdentity {
        bool mappingExists;
        uint256 collectionId;
        uint256 collectionSerial;
        bool burned;
    }

    mapping(uint256 => bool) private _collectionExists;
    mapping(uint256 => bool) private _collectionHasMaxSupply;
    mapping(uint256 => uint8) private _collectionStatus;
    mapping(uint256 => uint8) private _collectionSupplyMode;
    mapping(uint256 => uint256) private _collectionMaxSupply;
    mapping(uint256 => uint256) private _collectionMintedEver;
    mapping(uint256 => uint256) private _collectionNextSerial;
    mapping(uint256 => uint256) private _liveSupply;
    mapping(uint256 => bool) private _burnsBlocked;
    mapping(uint256 => bool) private _collectionFrozen;
    mapping(uint256 => TokenIdentity) private _tokenIdentities;
    mapping(uint256 => uint8) private _tokenLifecycles;

    function setCollectionFacts(
        uint256 collectionId,
        StreamCoreCollectionFinalityFacts calldata facts
    ) external {
        _collectionExists[collectionId] = facts.exists;
        _collectionHasMaxSupply[collectionId] = facts.hasMaxSupply;
        _collectionStatus[collectionId] = facts.status;
        _collectionSupplyMode[collectionId] = facts.supplyMode;
        _collectionMaxSupply[collectionId] = facts.maxSupply;
        _collectionMintedEver[collectionId] = facts.mintedSupply;
        _collectionNextSerial[collectionId] = facts.nextCollectionSerial;
        _liveSupply[collectionId] = facts.mintedSupply - facts.burnedSupply;
    }

    function setCollectionExists(uint256 collectionId, bool exists) external {
        _collectionExists[collectionId] = exists;
    }

    function setCollectionStatus(uint256 collectionId, uint8 status) external {
        _collectionStatus[collectionId] = status;
    }

    function setCollectionSupply(
        uint256 collectionId,
        bool hasMaxSupply,
        uint8 supplyMode,
        uint256 maxSupply,
        uint256 mintedSupply,
        uint256 nextCollectionSerial
    ) external {
        _collectionHasMaxSupply[collectionId] = hasMaxSupply;
        _collectionSupplyMode[collectionId] = supplyMode;
        _collectionMaxSupply[collectionId] = maxSupply;
        _collectionMintedEver[collectionId] = mintedSupply;
        _collectionNextSerial[collectionId] = nextCollectionSerial;
    }

    function setLiveSupply(uint256 collectionId, uint256 liveSupply) external {
        _liveSupply[collectionId] = liveSupply;
    }

    function setBurnsBlocked(uint256 collectionId, bool blocked) external {
        _burnsBlocked[collectionId] = blocked;
    }

    function setCollectionFrozen(uint256 collectionId, bool frozen) external {
        _collectionFrozen[collectionId] = frozen;
    }

    function setTokenIdentity(
        uint256 tokenId,
        bool mappingExists,
        uint256 collectionId,
        uint256 collectionSerial,
        bool burned
    ) external {
        _tokenIdentities[tokenId] = TokenIdentity(
            mappingExists, collectionId, collectionSerial, burned
        );
    }

    function setTokenLifecycle(uint256 tokenId, uint8 lifecycle) external {
        _tokenLifecycles[tokenId] = lifecycle;
    }

    function collectionExists(uint256 collectionId) external view returns (bool) {
        return _collectionExists[collectionId];
    }

    function collectionHasMaxSupply(uint256 collectionId) external view returns (bool) {
        return _collectionHasMaxSupply[collectionId];
    }

    function collectionStatus(uint256 collectionId) external view returns (uint8) {
        return _collectionStatus[collectionId];
    }

    function collectionSupplyMode(uint256 collectionId) external view returns (uint8) {
        return _collectionSupplyMode[collectionId];
    }

    function collectionMaxSupply(uint256 collectionId) external view returns (uint256) {
        return _collectionMaxSupply[collectionId];
    }

    function collectionMintedEver(uint256 collectionId) external view returns (uint256) {
        return _collectionMintedEver[collectionId];
    }

    function collectionNextSerial(uint256 collectionId) external view returns (uint256) {
        return _collectionNextSerial[collectionId];
    }

    function totalSupplyOfCollection(uint256 collectionId) external view returns (uint256) {
        return _liveSupply[collectionId];
    }

    function tokenCollectionIdentity(uint256 tokenId)
        external
        view
        returns (bool mappingExists, uint256 collectionId, uint256 collectionSerial, bool burned)
    {
        TokenIdentity memory identity = _tokenIdentities[tokenId];
        return (
            identity.mappingExists,
            identity.collectionId,
            identity.collectionSerial,
            identity.burned
        );
    }

    function tokenLifecycle(uint256 tokenId) external view returns (uint8) {
        return _tokenLifecycles[tokenId];
    }

    function collectionBurnsBlocked(uint256 collectionId) external view returns (bool) {
        return _burnsBlocked[collectionId];
    }

    function collectionFreezeStatus(uint256 collectionId) external view returns (bool) {
        return _collectionFrozen[collectionId];
    }
}

/// @notice Metadata-satellite mock for the IStreamFinalityMetadataReads seam.
contract MockFinalityMetadata {
    struct ContentRoot {
        bytes32 contentRoot;
        uint64 leafCount;
        bytes32 schemaId;
    }

    struct ScopeManifest {
        bool published;
        bytes32 manifestHash;
    }

    mapping(uint256 => mapping(bytes32 => ContentRoot)) private _contentRoots;
    mapping(uint256 => bytes32) private _snapshotHashes;
    mapping(uint256 => mapping(bytes32 => bool)) private _locks;
    mapping(uint256 => mapping(bytes32 => ScopeManifest)) private _scopeManifests;
    mapping(uint256 => uint8) private _metadataMode;

    /// @notice Sets the collection metadata mode (OFFCHAIN=0 by default, ONCHAIN=1, HYBRID=2).
    function setMetadataMode(uint256 collectionId, uint8 mode) external {
        _metadataMode[collectionId] = mode;
    }

    function collectionMetadataMode(uint256 collectionId) external view returns (uint8) {
        return _metadataMode[collectionId];
    }

    function setContentRoot(
        uint256 collectionId,
        bytes32 scopeSubject,
        bytes32 contentRoot,
        uint64 leafCount,
        bytes32 schemaId
    ) external {
        _contentRoots[collectionId][scopeSubject] = ContentRoot(contentRoot, leafCount, schemaId);
    }

    function setSnapshotHash(uint256 collectionId, bytes32 snapshotHash) external {
        _snapshotHashes[collectionId] = snapshotHash;
    }

    function setLock(uint256 collectionId, bytes32 recordType, bool locked) external {
        _locks[collectionId][recordType] = locked;
    }

    function setScopeManifest(uint256 collectionId, bytes32 scopeId, bool published, bytes32 hash)
        external
    {
        _scopeManifests[collectionId][scopeId] = ScopeManifest(published, hash);
    }

    function tokenContentRoot(uint256 collectionId, bytes32 scopeSubject)
        external
        view
        returns (bytes32 contentRoot, uint64 leafCount, bytes32 schemaId)
    {
        ContentRoot memory root = _contentRoots[collectionId][scopeSubject];
        return (root.contentRoot, root.leafCount, root.schemaId);
    }

    function latestCollectionSnapshotHash(uint256 collectionId) external view returns (bytes32) {
        return _snapshotHashes[collectionId];
    }

    function collectionRecordTypeLocked(uint256 collectionId, bytes32 recordType)
        external
        view
        returns (bool)
    {
        return _locks[collectionId][recordType];
    }

    function scopeManifest(uint256 collectionId, bytes32 scopeId)
        external
        view
        returns (bool published, bytes32 manifestHash)
    {
        ScopeManifest memory manifest = _scopeManifests[collectionId][scopeId];
        return (manifest.published, manifest.manifestHash);
    }
}

/// @notice Artist-registry mock for the IStreamFinalitySanctionReads seam.
/// @dev Responses are keyed by the full query tuple (scope fields plus subject hash), so a
///      successful verification proves the registry passed exactly the expected arguments —
///      including the sanction subject hash it computed.
contract MockFinalitySanction {
    struct SanctionResponse {
        bool valid;
        bytes32 sanctionRecordHash;
        address signer;
        uint8 authorityClass;
    }

    mapping(uint256 => bytes32) private _requiredType;
    mapping(bytes32 => SanctionResponse) private _responses;

    function setRequiredComponentType(uint256 collectionId, bytes32 componentType) external {
        _requiredType[collectionId] = componentType;
    }

    function setSanctionResponse(
        uint8 scopeType,
        uint256 collectionId,
        uint256 tokenId,
        bytes32 scopeId,
        bytes32 sanctionSubjectHash,
        bool valid,
        bytes32 sanctionRecordHash
    ) external {
        _responses[
            _queryKey(scopeType, collectionId, tokenId, scopeId, sanctionSubjectHash)
        ] = SanctionResponse(valid, sanctionRecordHash, address(0xA271), 1);
    }

    function collectionSanctionComponentType(uint256 collectionId) external view returns (bytes32) {
        return _requiredType[collectionId];
    }

    function verifySanctionForSubject(
        uint8 scopeType,
        uint256 collectionId,
        uint256 tokenId,
        bytes32 scopeId,
        bytes32 sanctionSubjectHash
    )
        external
        view
        returns (bool valid, bytes32 sanctionRecordHash, address signer, uint8 authorityClass)
    {
        SanctionResponse memory
            response = _responses[
                _queryKey(scopeType, collectionId, tokenId, scopeId, sanctionSubjectHash)
            ];
        return
            (response.valid, response.sanctionRecordHash, response.signer, response.authorityClass);
    }

    function _queryKey(
        uint8 scopeType,
        uint256 collectionId,
        uint256 tokenId,
        bytes32 scopeId,
        bytes32 sanctionSubjectHash
    ) private pure returns (bytes32) {
        return keccak256(abi.encode(scopeType, collectionId, tokenId, scopeId, sanctionSubjectHash));
    }
}

/// @notice Configurable finality component implementing both component read surfaces, with
///         failure modes for the never-revert diagnostic tests.
contract MockFinalityComponent {
    uint8 public constant MODE_NORMAL = 0;
    uint8 public constant MODE_REVERT = 1;
    uint8 public constant MODE_SHORT_RETURN = 2;
    uint8 public constant MODE_GAS_BURN = 3;
    uint8 public constant MODE_OVERSIZED_RETURN = 4;
    uint8 public constant MODE_SLOW_SUCCESS = 5;

    uint8 private _mode;
    mapping(uint256 => StreamFinalityComponentState) private _collectionStates;
    mapping(bytes32 => StreamFinalityComponentState) private _scopedStates;

    function setMode(uint8 mode) external {
        _mode = mode;
    }

    function setCollectionState(uint256 collectionId, StreamFinalityComponentState calldata state)
        external
    {
        _collectionStates[collectionId] = state;
    }

    function setScopedState(
        StreamFinalityScope calldata scope,
        StreamFinalityComponentState calldata state
    ) external {
        _scopedStates[_scopeKey(scope)] = state;
    }

    function finalityState(uint256 collectionId)
        external
        view
        returns (StreamFinalityComponentState memory state)
    {
        state = _collectionStates[collectionId];
        _applyMode(state);
    }

    function finalityStateForScope(StreamFinalityScope calldata scope)
        external
        view
        returns (StreamFinalityComponentState memory state)
    {
        state = _scopedStates[_scopeKey(scope)];
        _applyMode(state);
    }

    function _applyMode(StreamFinalityComponentState memory state) private view {
        uint8 mode = _mode;
        if (mode == MODE_REVERT) {
            revert("component reverted");
        }
        if (mode == MODE_SHORT_RETURN) {
            assembly ("memory-safe") {
                return(state, 0x20)
            }
        }
        if (mode == MODE_GAS_BURN) {
            assembly ("memory-safe") {
                for { } 1 { } { }
            }
        }
        if (mode == MODE_OVERSIZED_RETURN) {
            assembly ("memory-safe") {
                mstore(add(state, 0x100), 0xfeed)
                return(state, 0x120)
            }
        }
        if (mode == MODE_SLOW_SUCCESS) {
            _burnGas(45_000);
        }
    }

    function _burnGas(uint256 amount) private view {
        assembly ("memory-safe") {
            let available := gas()
            if iszero(gt(available, amount)) {
                for { } 1 { } { }
            }
            let threshold := sub(available, amount)
            for { } gt(gas(), threshold) { } { }
        }
    }

    function _scopeKey(StreamFinalityScope calldata scope) private pure returns (bytes32) {
        return keccak256(
            abi.encode(uint8(scope.scopeType), scope.collectionId, scope.tokenId, scope.scopeId)
        );
    }
}

/// @notice Discovery mock implementing both discovery read surfaces.
contract MockFinalityDiscovery {
    struct DiscoveryFacts {
        uint256 count;
        bytes32 discoveryHash;
    }

    mapping(uint256 => DiscoveryFacts) private _collectionFacts;
    mapping(bytes32 => DiscoveryFacts) private _scopedFacts;
    mapping(uint256 => StreamFinalityComponentExpectation[]) private _collectionComponents;
    mapping(bytes32 => StreamFinalityComponentExpectation[]) private _scopedComponents;
    uint8 private _readMode;
    uint8 private _hashReadMode;
    uint8 private _componentReadMode;

    /// @notice Configures discovery read behavior for diagnostic failure-path tests:
    ///         0 = normal, 1 = revert, 2 = malformed short return, 3 = oversized return,
    ///         4 = exhaust the caller-provided gas budget.
    function setReadMode(uint8 readMode) external {
        _readMode = readMode;
    }

    /// @notice Configures hash-only behavior so count can return its exact passing word first.
    function setHashReadMode(uint8 readMode) external {
        _hashReadMode = readMode;
    }

    /// @notice Configures component-enumeration behavior without perturbing the count/hash reads:
    ///         0 = exact 224-byte return, 1 = revert, 2 = one-byte-short return,
    ///         3 = one-word-oversized return, 4 = exhaust the caller-provided gas budget.
    function setComponentReadMode(uint8 readMode) external {
        _componentReadMode = readMode;
    }

    function setCollectionDiscovery(uint256 collectionId, uint256 count, bytes32 discoveryHash)
        external
    {
        _collectionFacts[collectionId] = DiscoveryFacts(count, discoveryHash);
    }

    function setScopedDiscovery(
        StreamFinalityScope calldata scope,
        uint256 count,
        bytes32 discoveryHash
    ) external {
        _scopedFacts[_scopeKey(scope)] = DiscoveryFacts(count, discoveryHash);
    }

    function setCollectionComponent(
        uint256 collectionId,
        uint256 index,
        StreamFinalityComponentExpectation calldata component
    ) external {
        StreamFinalityComponentExpectation[] storage components =
            _collectionComponents[collectionId];
        while (components.length <= index) {
            components.push();
        }
        components[index] = component;
    }

    function setScopedComponent(
        StreamFinalityScope calldata scope,
        uint256 index,
        StreamFinalityComponentExpectation calldata component
    ) external {
        StreamFinalityComponentExpectation[] storage components =
            _scopedComponents[_scopeKey(scope)];
        while (components.length <= index) {
            components.push();
        }
        components[index] = component;
    }

    function finalityComponentCount(uint256 collectionId) external view returns (uint256) {
        _applyReadMode();
        return _collectionFacts[collectionId].count;
    }

    function finalityDiscoveryHash(uint256 collectionId) external view returns (bytes32) {
        _applyReadMode();
        _applyWordReadMode(_hashReadMode);
        return _collectionFacts[collectionId].discoveryHash;
    }

    function finalityComponentAt(uint256 collectionId, uint256 index)
        external
        view
        returns (StreamFinalityComponentExpectation memory component)
    {
        component = _collectionComponents[collectionId][index];
        _applyComponentReadMode(component);
    }

    function finalityComponentCountForScope(StreamFinalityScope calldata scope)
        external
        view
        returns (uint256)
    {
        _applyReadMode();
        return _scopedFacts[_scopeKey(scope)].count;
    }

    function finalityDiscoveryHashForScope(StreamFinalityScope calldata scope)
        external
        view
        returns (bytes32)
    {
        _applyReadMode();
        _applyWordReadMode(_hashReadMode);
        return _scopedFacts[_scopeKey(scope)].discoveryHash;
    }

    function finalityComponentAtForScope(StreamFinalityScope calldata scope, uint256 index)
        external
        view
        returns (StreamFinalityComponentExpectation memory component)
    {
        component = _scopedComponents[_scopeKey(scope)][index];
        _applyComponentReadMode(component);
    }

    function _applyReadMode() private view {
        _applyWordReadMode(_readMode);
    }

    function _applyWordReadMode(uint8 readMode) private view {
        if (readMode == 1) {
            assembly ("memory-safe") {
                revert(0, 0)
            }
        }
        if (readMode == 2) {
            assembly ("memory-safe") {
                return(0, 0x1f)
            }
        }
        if (readMode == 3) {
            assembly ("memory-safe") {
                return(0, 0x40)
            }
        }
        if (readMode == 4) {
            assembly ("memory-safe") {
                for { } 1 { } { }
            }
        }
        if (readMode == 5) {
            _burnGas(45_000);
        }
    }

    function _applyComponentReadMode(StreamFinalityComponentExpectation memory component)
        private
        view
    {
        uint8 readMode = _componentReadMode;
        if (readMode == 1) {
            assembly ("memory-safe") {
                revert(0, 0)
            }
        }
        if (readMode == 2) {
            assembly ("memory-safe") {
                return(component, 0xdf)
            }
        }
        if (readMode == 3) {
            assembly ("memory-safe") {
                mstore(add(component, 0xe0), 0xfeed)
                return(component, 0x100)
            }
        }
        if (readMode == 4) {
            assembly ("memory-safe") {
                for { } 1 { } { }
            }
        }
        if (readMode == 5) {
            _burnGas(45_000);
        }
    }

    function _burnGas(uint256 amount) private view {
        assembly ("memory-safe") {
            let available := gas()
            if iszero(gt(available, amount)) {
                for { } 1 { } { }
            }
            let threshold := sub(available, amount)
            for { } gt(gas(), threshold) { } { }
        }
    }

    function _scopeKey(StreamFinalityScope calldata scope) private pure returns (bytes32) {
        return keccak256(
            abi.encode(uint8(scope.scopeType), scope.collectionId, scope.tokenId, scope.scopeId)
        );
    }
}
