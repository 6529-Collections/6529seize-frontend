// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IStreamArtworkFinalityComponents.sol";
import "./IStreamCoreFinalityAdapter.sol";
import "./IStreamCoreFinalitySource.sol";
import "./IStreamFinalityGovernanceAuthority.sol";
import "./IStreamFinalityMetadataReads.sol";
import "./IStreamFinalitySanctionReads.sol";
import "./StreamArtworkFinalityRegistry.sol";
import "./StreamArtworkFinalityTypes.sol";

/// @notice The finality registry's preview surface: previewFinality per [LTA-FINALITY]
///         exposes every comparison finalization performs — plus the computed sanction
///         subject hash the artist signs ([AA-SANCTION] requirement 2) — before any
///         state-changing finality transaction is sent.
/// @dev View-only periphery bound to one registry. Every pinned preimage is recomputed
///      through the registry's compute* views, never re-derived here, so preview and
///      execution cannot drift on a hash; gate semantics are covered by tests that assert
///      preview flags against execution outcomes.
contract StreamArtworkFinalityPreview {
    error FinalityPreviewZeroAddress();

    StreamArtworkFinalityRegistry public immutable registry;
    IStreamCoreFinalitySource public immutable coreReads;
    IStreamCoreFinalityAdapter public immutable coreFinalityAdapter;
    IStreamFinalityMetadataReads public immutable metadataReads;
    IStreamFinalitySanctionReads public immutable sanctionReads;
    IStreamFinalityGovernanceAuthority public immutable governanceAuthority;
    address public immutable finalityDiscovery;

    constructor(StreamArtworkFinalityRegistry registry_) {
        if (address(registry_) == address(0)) {
            revert FinalityPreviewZeroAddress();
        }
        registry = registry_;
        coreReads = registry_.coreReads();
        coreFinalityAdapter = registry_.coreFinalityAdapter();
        metadataReads = registry_.metadataReads();
        sanctionReads = registry_.sanctionReads();
        governanceAuthority = registry_.governanceAuthority();
        finalityDiscovery = registry_.finalityDiscovery();
    }

    function previewCollectionFinality(
        uint256 collectionId,
        StreamFinalityComponentExpectation[] calldata components,
        StreamFinalityManifestRef calldata manifest
    ) external view returns (StreamFinalityPreview memory) {
        return _preview(
            StreamFinalityScope({
                scopeType: StreamFinalityScopeType.COLLECTION,
                collectionId: collectionId,
                tokenId: 0,
                scopeId: bytes32(0)
            }),
            components,
            manifest
        );
    }

    function previewArtworkScopeFinality(
        StreamFinalityScope calldata scope,
        StreamFinalityComponentExpectation[] calldata components,
        StreamFinalityManifestRef calldata manifest
    ) external view returns (StreamFinalityPreview memory) {
        return _preview(scope, components, manifest);
    }

    // ------------------------------------------------------------------
    // Internal composition
    // ------------------------------------------------------------------

    function _preview(
        StreamFinalityScope memory scope,
        StreamFinalityComponentExpectation[] calldata components,
        StreamFinalityManifestRef calldata manifest
    ) private view returns (StreamFinalityPreview memory p) {
        if (!_isCanonicalScopeShape(scope)) {
            return p;
        }
        uint8 metadataMode = metadataReads.collectionMetadataMode(scope.collectionId);
        p.notAlreadyFinalized = !registry.artworkScopeFinalityRecord(scope).finalized;
        // componentsWellFormed folds the shape rule and the mode-aware mandatory-component
        // floor ([LTA-FINALITY] req 1); the registry enforces both at execution.
        p.componentsWellFormed = _componentListWellFormed(components)
            && _mandatoryComponentsPresent(components, metadataMode);
        p.computedComponentsHash = registry.computeComponentsHash(components);
        p.computedNonSanctionComponentsHash = registry.computeNonSanctionComponentsHash(components);
        p.manifestSatisfied = _manifestSatisfied(manifest);

        // coreGatesSatisfied folds the ONCHAIN/hybrid snapshot-manifest gate
        // ([CMC-FINALITY-INPUTS] rule 3) alongside the Core lifecycle gates.
        (p.coreGatesSatisfied, p.computedCoreFactsHash, p.contentRootSatisfied) =
            _coreAndContentRoot(scope);
        p.coreGatesSatisfied =
            p.coreGatesSatisfied && _snapshotManifestSatisfied(scope.collectionId, metadataMode);
        (p.sanctionSatisfied, p.computedSanctionSubjectHash) = _sanction(
            scope,
            components,
            p.computedCoreFactsHash,
            p.computedNonSanctionComponentsHash,
            manifest
        );
        p.componentsMatchLive = _componentsMatchLive(scope, components);
        p.discoveryMatches = _discoveryMatches(scope, components, p.computedComponentsHash);

        p.computedFinalityRecordHash = registry.computeFinalityRecordHash(
            scope, p.computedCoreFactsHash, p.computedComponentsHash, manifest
        );
        p.stagedFreezeReady = _stagedFreezeReady(scope, p.computedFinalityRecordHash);

        p.wouldExecute = p.notAlreadyFinalized && p.stagedFreezeReady && p.coreGatesSatisfied
            && p.contentRootSatisfied && p.manifestSatisfied && p.componentsWellFormed
            && p.componentsMatchLive && p.sanctionSatisfied && p.discoveryMatches;
    }

    function _stagedFreezeReady(StreamFinalityScope memory scope, bytes32 computedRecordHash)
        private
        view
        returns (bool)
    {
        StreamTerminalFreezeAction memory action = registry.artworkTerminalFreezeAction(scope);
        if (
            action.status != StreamTerminalFreezeStatus.SCHEDULED
                || block.timestamp < action.notBefore || block.timestamp > action.expiresAfter
                || action.expectedFinalityRecordHash != computedRecordHash
        ) {
            return false;
        }
        // Defense in depth ([LTA-FREEZE] rule 4): execution re-resolves the live veto guardian and
        // reverts FinalityFreezeGuardianUnset when it was cleared after scheduling
        // (StreamArtworkFinalityRegistry._requireExecutableFreeze). Mirror that gate so a freeze
        // that would revert is never previewed as ready. scopeKey mirrors the registry's
        // _scopeKey; the guardian is read live from the same authority, never the action's
        // scheduling-time snapshot.
        bytes32 scopeKey = keccak256(
            abi.encode(uint8(scope.scopeType), scope.collectionId, scope.tokenId, scope.scopeId)
        );
        (address guardian,) = governanceAuthority.terminalFreezeVetoGuardian(scopeKey);
        return guardian != address(0);
    }

    function _manifestSatisfied(StreamFinalityManifestRef calldata manifest)
        private
        view
        returns (bool)
    {
        return manifest.uriHash == keccak256(bytes(manifest.uri))
            && manifest.contentHash != bytes32(0) && manifest.schemaId != bytes32(0)
            && manifest.canonicalizationHash != bytes32(0)
            && registry.finalityManifestStored(manifest.contentHash);
    }

    function _coreAndContentRoot(StreamFinalityScope memory scope)
        private
        view
        returns (bool coreGatesSatisfied, bytes32 factsHash, bool contentRootSatisfied)
    {
        uint256 expectedLeafCount;
        bool exactLeafCount;
        if (scope.scopeType == StreamFinalityScopeType.COLLECTION) {
            StreamCoreCollectionFinalityFacts memory facts =
                coreFinalityAdapter.coreCollectionFinalityFacts(scope.collectionId);
            factsHash = registry.computeCollectionCoreFactsHash(scope.collectionId);
            coreGatesSatisfied = facts.exists
                && facts.status <= StreamFinalityDomains.CORE_COLLECTION_STATUS_CLOSED
                && facts.supplyMode
                    <= StreamFinalityDomains.CORE_COLLECTION_SUPPLY_MODE_UNCAPPED_OPEN
                && facts.status == StreamFinalityDomains.CORE_COLLECTION_STATUS_CLOSED
                && coreReads.collectionBurnsBlocked(scope.collectionId)
                && coreReads.collectionFreezeStatus(scope.collectionId);
            expectedLeafCount = facts.mintedSupply;
            exactLeafCount = true;
        } else {
            StreamScopedCoreFinalityFacts memory scopedFacts =
                coreFinalityAdapter.scopedCoreFinalityFacts(_adapterScope(scope));
            factsHash = registry.computeScopedCoreFactsHash(scope);
            coreGatesSatisfied = scopedFacts.scopeExists
                && scopedFacts.collectionStatus
                    <= StreamFinalityDomains.CORE_COLLECTION_STATUS_CLOSED
                && scopedFacts.collectionSupplyMode
                    <= StreamFinalityDomains.CORE_COLLECTION_SUPPLY_MODE_UNCAPPED_OPEN
                && scopedFacts.scopeType == uint8(scope.scopeType)
                && scopedFacts.collectionId == scope.collectionId
                && scopedFacts.tokenId == scope.tokenId && scopedFacts.scopeId == scope.scopeId;
            if (scope.scopeType == StreamFinalityScopeType.TOKEN) {
                coreGatesSatisfied = coreGatesSatisfied && scopedFacts.tokenMappingExists
                    && (scopedFacts.tokenLifecycle == StreamFinalityDomains.TOKEN_LIFECYCLE_MINTED
                        || scopedFacts.tokenLifecycle
                            == StreamFinalityDomains.TOKEN_LIFECYCLE_BURNED);
                expectedLeafCount = 1;
                exactLeafCount = true;
            }
        }
        contentRootSatisfied = _contentRootSatisfied(scope, expectedLeafCount, exactLeafCount);
    }

    function _contentRootSatisfied(
        StreamFinalityScope memory scope,
        uint256 expectedLeafCount,
        bool exactLeafCount
    ) private view returns (bool) {
        (bytes32 contentRoot, uint64 leafCount,) = metadataReads.tokenContentRoot(
            scope.collectionId, registry.contentRootScopeSubject(scope)
        );
        if (contentRoot == bytes32(0)) {
            return false;
        }
        return exactLeafCount ? uint256(leafCount) == expectedLeafCount : leafCount != 0;
    }

    function _mandatoryComponentsPresent(
        StreamFinalityComponentExpectation[] calldata components,
        uint8 metadataMode
    ) private pure returns (bool) {
        return StreamFinalityComponentSet.hasAllMandatory(components, metadataMode);
    }

    function _snapshotManifestSatisfied(uint256 collectionId, uint8 metadataMode)
        private
        view
        returns (bool)
    {
        if (metadataMode == StreamFinalityDomains.METADATA_MODE_OFFCHAIN) {
            return true;
        }
        if (
            metadataMode != StreamFinalityDomains.METADATA_MODE_ONCHAIN
                && metadataMode != StreamFinalityDomains.METADATA_MODE_HYBRID
        ) return false;
        return metadataReads.latestCollectionSnapshotHash(collectionId) != bytes32(0);
    }

    function _sanction(
        StreamFinalityScope memory scope,
        StreamFinalityComponentExpectation[] calldata components,
        bytes32 coreFactsHash,
        bytes32 nonSanctionComponentsHash,
        StreamFinalityManifestRef calldata manifest
    ) private view returns (bool satisfied, bytes32 sanctionSubjectHash) {
        sanctionSubjectHash = registry.computeSanctionSubjectHash(
            scope, coreFactsHash, nonSanctionComponentsHash, manifest
        );
        (uint256 index, uint256 occurrences) =
            StreamFinalityComponentSet.locateSanctionSlot(components);
        if (occurrences != 1) {
            return (false, sanctionSubjectHash);
        }
        bytes32 requiredType = sanctionReads.collectionSanctionComponentType(scope.collectionId);
        if (components[index].componentType != requiredType) {
            return (false, sanctionSubjectHash);
        }
        if (requiredType != StreamFinalityDomains.COMPONENT_ARTIST_SANCTION) {
            return (true, sanctionSubjectHash);
        }
        (bool valid, bytes32 sanctionRecordHash) = _sanctionVerification(scope, sanctionSubjectHash);
        return (valid && sanctionRecordHash == components[index].dataHash, sanctionSubjectHash);
    }

    function _sanctionVerification(StreamFinalityScope memory scope, bytes32 sanctionSubjectHash)
        private
        view
        returns (bool valid, bytes32 sanctionRecordHash)
    {
        (valid, sanctionRecordHash,,) = sanctionReads.verifySanctionForSubject(
            uint8(scope.scopeType),
            scope.collectionId,
            scope.tokenId,
            scope.scopeId,
            sanctionSubjectHash
        );
    }

    function _componentListWellFormed(StreamFinalityComponentExpectation[] calldata components)
        private
        view
        returns (bool)
    {
        uint256 count = components.length;
        if (count == 0 || count > registry.MAX_FINALITY_COMPONENTS()) {
            return false;
        }
        for (uint256 i = 1; i < count; i++) {
            if (!_strictlyAscending(components[i - 1], components[i])) {
                return false;
            }
        }
        return true;
    }

    function _strictlyAscending(
        StreamFinalityComponentExpectation calldata previous,
        StreamFinalityComponentExpectation calldata next
    ) private pure returns (bool) {
        if (previous.componentType != next.componentType) {
            return previous.componentType < next.componentType;
        }
        if (previous.component != next.component) {
            return previous.component < next.component;
        }
        if (previous.interfaceId != next.interfaceId) {
            return previous.interfaceId < next.interfaceId;
        }
        if (previous.codeHash != next.codeHash) {
            return previous.codeHash < next.codeHash;
        }
        if (previous.moduleVersion != next.moduleVersion) {
            return previous.moduleVersion < next.moduleVersion;
        }
        if (previous.manifestHash != next.manifestHash) {
            return previous.manifestHash < next.manifestHash;
        }
        if (previous.dataHash != next.dataHash) {
            return previous.dataHash < next.dataHash;
        }
        return false;
    }

    function _componentsMatchLive(
        StreamFinalityScope memory scope,
        StreamFinalityComponentExpectation[] calldata components
    ) private view returns (bool) {
        (uint8 failCode,) = StreamFinalityComponentSet.verifyComponentsStrict(
            components, _componentCallData(scope)
        );
        return failCode == StreamFinalityComponentSet.STRICT_OK;
    }

    function _componentCallData(StreamFinalityScope memory scope)
        private
        pure
        returns (bytes memory)
    {
        if (scope.scopeType == StreamFinalityScopeType.COLLECTION) {
            return abi.encodeWithSelector(
                IStreamArtworkFinalityComponent.finalityState.selector, scope.collectionId
            );
        }
        return abi.encodeWithSelector(
            IStreamArtworkScopedFinalityComponent.finalityStateForScope.selector, scope
        );
    }

    function _discoveryMatches(
        StreamFinalityScope memory scope,
        StreamFinalityComponentExpectation[] calldata components,
        bytes32 submittedHash
    ) private view returns (bool) {
        address discovery = finalityDiscovery;
        uint256 submittedCount = components.length;
        uint256 gasCap = 0;
        if (!_discoveryFactsMatch(discovery, scope, submittedCount, submittedHash, gasCap)) {
            return false;
        }
        for (uint256 i = 0; i < submittedCount; i++) {
            bytes memory componentCallData = _discoveryComponentCallData(scope, i);
            (
                bool componentReadable,
                StreamFinalityComponentExpectation memory discoveredComponent
            ) = StreamFinalityComponentSet.observeDiscoveryComponent(
                    discovery, componentCallData, gasCap
                );
            if (!componentReadable || !_sameExpectation(discoveredComponent, components[i])) {
                return false;
            }
        }
        return true;
    }

    function _discoveryFactsMatch(
        address discovery,
        StreamFinalityScope memory scope,
        uint256 submittedCount,
        bytes32 submittedHash,
        uint256 gasCap
    ) private view returns (bool) {
        bytes memory countCallData;
        bytes memory hashCallData;
        if (scope.scopeType == StreamFinalityScopeType.COLLECTION) {
            countCallData = abi.encodeWithSelector(
                IStreamArtworkFinalityDiscovery.finalityComponentCount.selector, scope.collectionId
            );
            hashCallData = abi.encodeWithSelector(
                IStreamArtworkFinalityDiscovery.finalityDiscoveryHash.selector, scope.collectionId
            );
        } else {
            countCallData = abi.encodeWithSelector(
                IStreamArtworkScopedFinalityDiscovery.finalityComponentCountForScope.selector, scope
            );
            hashCallData = abi.encodeWithSelector(
                IStreamArtworkScopedFinalityDiscovery.finalityDiscoveryHashForScope.selector, scope
            );
        }
        (bool countReadable, bytes32 discoveredCount) =
            StreamFinalityComponentSet.observeDiscoveryWord(discovery, countCallData, gasCap);
        if (!countReadable || uint256(discoveredCount) != submittedCount) {
            return false;
        }
        (bool hashReadable, bytes32 discoveredHash) =
            StreamFinalityComponentSet.observeDiscoveryWord(discovery, hashCallData, gasCap);
        if (!hashReadable || discoveredHash != submittedHash) {
            return false;
        }
        return true;
    }

    function _discoveryComponentCallData(StreamFinalityScope memory scope, uint256 index)
        private
        pure
        returns (bytes memory)
    {
        if (scope.scopeType == StreamFinalityScopeType.COLLECTION) {
            return abi.encodeWithSelector(
                IStreamArtworkFinalityDiscovery.finalityComponentAt.selector,
                scope.collectionId,
                index
            );
        }
        return abi.encodeWithSelector(
            IStreamArtworkScopedFinalityDiscovery.finalityComponentAtForScope.selector, scope, index
        );
    }

    function _sameExpectation(
        StreamFinalityComponentExpectation memory discovered,
        StreamFinalityComponentExpectation calldata submitted
    ) private pure returns (bool) {
        return discovered.componentType == submitted.componentType
            && discovered.component == submitted.component
            && discovered.interfaceId == submitted.interfaceId
            && discovered.codeHash == submitted.codeHash
            && discovered.moduleVersion == submitted.moduleVersion
            && discovered.manifestHash == submitted.manifestHash
            && discovered.dataHash == submitted.dataHash;
    }

    function _isCanonicalScopeShape(StreamFinalityScope memory scope) private pure returns (bool) {
        if (scope.collectionId == 0) {
            return false;
        }
        if (scope.scopeType == StreamFinalityScopeType.COLLECTION) {
            return scope.tokenId == 0 && scope.scopeId == bytes32(0);
        }
        if (scope.scopeType == StreamFinalityScopeType.TOKEN) {
            return scope.tokenId != 0 && scope.scopeId == bytes32(0);
        }
        return scope.tokenId == 0 && scope.scopeId != bytes32(0);
    }

    function _adapterScope(StreamFinalityScope memory scope)
        private
        pure
        returns (StreamCoreFinalityScopeQuery memory)
    {
        return StreamCoreFinalityScopeQuery({
            scopeType: uint8(scope.scopeType),
            collectionId: scope.collectionId,
            tokenId: scope.tokenId,
            scopeId: scope.scopeId
        });
    }
}
