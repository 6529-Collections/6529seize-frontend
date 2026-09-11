// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./StreamArtworkFinalityTypes.sol";

/// @notice StreamArtworkFinalityRegistry surface: the five-scope artwork finality registry and
///         its single governed terminal-freeze path ([LTA-FINALITY], [LTA-FREEZE], ADR 0009
///         decision 6, [CMC-FINALITY-INPUTS]).
interface IStreamArtworkFinalityRegistry {
    // ------------------------------------------------------------------
    // Events (schemaVersion pinned at 1; shapes follow the [LTA-FINALITY]
    // recommended events, staging events follow [LTA-GOV] rules 2-3)
    // ------------------------------------------------------------------

    event CollectionArtworkFinalized(
        uint16 schemaVersion,
        uint256 indexed collectionId,
        bytes32 indexed finalityRecordHash,
        address indexed actor,
        bytes32 componentsHash,
        bytes32 manifestContentHash,
        string finalityManifestURI
    );

    event ArtworkScopeFinalized(
        uint16 schemaVersion,
        uint8 indexed scopeType,
        uint256 indexed collectionId,
        bytes32 indexed finalityRecordHash,
        uint256 tokenId,
        bytes32 scopeId,
        bytes32 componentsHash,
        bytes32 manifestContentHash,
        string finalityManifestURI
    );

    /// @notice Canonical manifest bytes staged in registry storage ([LTA-FINALITY] req 14).
    event FinalityManifestStaged(
        uint16 schemaVersion, bytes32 indexed manifestContentHash, uint256 byteLength, address actor
    );

    /// @notice Manifest pointer evented for indexers (ADR 0010 decision D4.5).
    event FinalityManifestPointerRecorded(
        uint16 schemaVersion,
        bytes32 indexed finalityRecordHash,
        address manifestPointer,
        bytes32 manifestContentHash
    );

    event ArtworkTerminalFreezeScheduled(
        uint16 schemaVersion,
        uint8 indexed scopeType,
        uint256 indexed collectionId,
        bytes32 indexed scopeKey,
        uint256 tokenId,
        bytes32 scopeId,
        bytes32 expectedFinalityRecordHash,
        uint64 notBefore,
        uint64 expiresAfter,
        address vetoGuardian,
        address scheduler
    );

    event ArtworkTerminalFreezeVetoed(
        uint16 schemaVersion,
        bytes32 indexed scopeKey,
        bytes32 expectedFinalityRecordHash,
        bytes32 reasonHash,
        address indexed guardian
    );

    event ArtworkTerminalFreezeCancelled(
        uint16 schemaVersion,
        bytes32 indexed scopeKey,
        bytes32 expectedFinalityRecordHash,
        bytes32 reasonHash,
        address indexed canceller
    );

    event ArtworkTerminalFreezeExpired(
        uint16 schemaVersion, bytes32 indexed scopeKey, bytes32 expectedFinalityRecordHash
    );

    event ArtworkTerminalFreezeExecuted(
        uint16 schemaVersion,
        bytes32 indexed scopeKey,
        bytes32 indexed finalityRecordHash,
        address executor
    );

    // ------------------------------------------------------------------
    // Errors
    // ------------------------------------------------------------------

    error FinalityCallerNotFinalityAdmin(address caller);
    error FinalityCallerNotVetoGuardian(address caller, address guardian);
    error FinalityScopeShapeInvalid();
    error FinalityScopeUsesCollectionEntry();
    error FinalityAlreadyFinalized(bytes32 scopeKey);
    error FinalityFreezeAlreadyScheduled(bytes32 scopeKey);
    error FinalityFreezeNotScheduled(bytes32 scopeKey);
    error FinalityFreezeNotExpired(bytes32 scopeKey);
    error FinalityFreezeDelayTooShort(uint64 notBefore, uint64 earliestAllowed);
    error FinalityFreezeWindowTooShort(uint64 expiresAfter, uint64 earliestAllowed);
    error FinalityFreezeVetoWindowClosed(uint64 notBefore);
    error FinalityFreezeNotOpen(uint64 notBefore, uint64 expiresAfter);
    error FinalityFreezeGuardianUnset(bytes32 scopeKey);
    error FinalityExpectedRecordHashZero();
    error FinalityStagedHashMismatch(bytes32 staged, bytes32 supplied);
    error FinalityExpectedRecordHashMismatch(bytes32 expected, bytes32 computed);
    error FinalityCalldataTooLarge(uint256 size, uint256 maxSize);
    error FinalityComponentCountInvalid(uint256 count, uint256 maxCount);
    error FinalityComponentsUnsorted(uint256 index);
    error FinalityComponentUnreadable(uint256 index);
    error FinalityComponentCodeHashMismatch(uint256 index);
    error FinalityComponentMismatch(uint256 index);
    error FinalitySanctionComponentMissing();
    error FinalitySanctionComponentDuplicated();
    error FinalitySanctionComponentWrongType(bytes32 requiredType, bytes32 suppliedType);
    error FinalitySanctionInvalid(bytes32 sanctionSubjectHash);
    error FinalitySanctionRecordHashMismatch(bytes32 componentDataHash, bytes32 sanctionRecordHash);
    error FinalityManifestURIHashMismatch(bytes32 expected, bytes32 actual);
    error FinalityManifestFieldZero();
    error FinalityManifestBytesMissing(bytes32 contentHash);
    error FinalityManifestBytesInvalid();
    error FinalityCollectionUnknown(uint256 collectionId);
    error FinalityCollectionStatusInvalid(uint256 collectionId, uint8 status);
    error FinalityCollectionSupplyModeInvalid(uint256 collectionId, uint8 supplyMode);
    error FinalityCollectionNotClosed(uint256 collectionId, uint8 status);
    error FinalityCollectionBurnsNotBlocked(uint256 collectionId);
    error FinalityContentRootMissing(bytes32 scopeSubject);
    error FinalityContentRootLeafCountMismatch(uint256 expectedLeafCount, uint256 actualLeafCount);
    error FinalityScopeUnknown();
    error FinalityTokenNotInScope();
    error FinalityScopedFactsMismatch();
    error FinalityCollectionNotFrozen(uint256 collectionId);
    error FinalityMissingRequiredComponent(bytes32 componentType);
    error FinalitySnapshotManifestMissing(uint256 collectionId, uint8 metadataMode);
    error FinalityMetadataModeInvalid(uint8 metadataMode);
    error FinalityDiscoveryCountMismatch(uint256 discoveredCount, uint256 submittedCount);
    error FinalityDiscoveryHashMismatch(bytes32 discoveredHash, bytes32 submittedHash);
    error FinalityDiscoveryFactsUnreadable();
    error FinalityDiscoveryComponentUnreadable(uint256 index);
    error FinalityDiscoveryComponentMismatch(uint256 index);

    // ------------------------------------------------------------------
    // Terminal-freeze staging (single governed freeze path, [LTA-FREEZE] rule 4)
    // ------------------------------------------------------------------

    function scheduleArtworkTerminalFreeze(
        StreamFinalityScope calldata scope,
        bytes32 expectedFinalityRecordHash,
        uint64 notBefore,
        uint64 expiresAfter
    ) external;

    function vetoArtworkTerminalFreeze(StreamFinalityScope calldata scope, bytes32 reasonHash)
        external;

    function cancelArtworkTerminalFreeze(StreamFinalityScope calldata scope, bytes32 reasonHash)
        external;

    function materializeExpiredArtworkTerminalFreeze(StreamFinalityScope calldata scope) external;

    function artworkTerminalFreezeAction(StreamFinalityScope calldata scope)
        external
        view
        returns (StreamTerminalFreezeAction memory);

    /// @notice [LTA-FREEZE] freeze-mode report for a scope: NONE with no record, EXACT for a
    ///         scope with its own executed scoped record, INHERITED for the collection key and
    ///         every scope under an executed collection-scope finality.
    function artworkFreezeMode(StreamFinalityScope calldata scope)
        external
        view
        returns (StreamArtworkFreezeMode);

    // ------------------------------------------------------------------
    // Manifest byte staging ([LTA-FINALITY] requirement 14)
    // ------------------------------------------------------------------

    function stageFinalityManifest(bytes calldata manifestBytes)
        external
        returns (bytes32 contentHash);

    function finalityManifestStored(bytes32 contentHash) external view returns (bool);

    /// @notice Typed accessor for canonical manifest bytes held in registry storage.
    function finalityManifestBytes(bytes32 contentHash) external view returns (bytes memory);

    // ------------------------------------------------------------------
    // Finality execution
    // ------------------------------------------------------------------

    function finalizeCollectionArtwork(
        uint256 collectionId,
        StreamFinalityComponentExpectation[] calldata components,
        bytes32 expectedFinalityRecordHash,
        StreamFinalityManifestRef calldata manifest
    ) external;

    function finalizeArtworkScope(
        StreamFinalityScope calldata scope,
        StreamFinalityComponentExpectation[] calldata components,
        bytes32 expectedFinalityRecordHash,
        StreamFinalityManifestRef calldata manifest
    ) external;

    // ------------------------------------------------------------------
    // Pinned-preimage computation views. These are the single onchain source for every hash
    // finalization verifies; the bound StreamArtworkFinalityPreview periphery and artist
    // signing tooling ([AA-SANCTION] requirement 2, [AA-TOOLING]) recompute through them so
    // preview and execution can never drift on a preimage.
    // ------------------------------------------------------------------

    function computeComponentsHash(StreamFinalityComponentExpectation[] calldata components)
        external
        pure
        returns (bytes32);

    function computeNonSanctionComponentsHash(StreamFinalityComponentExpectation[] calldata components)
        external
        pure
        returns (bytes32);

    function computeCollectionCoreFactsHash(uint256 collectionId) external view returns (bytes32);

    function computeScopedCoreFactsHash(StreamFinalityScope calldata scope)
        external
        view
        returns (bytes32);

    function computeFinalityRecordHash(
        StreamFinalityScope calldata scope,
        bytes32 coreFactsHash,
        bytes32 componentsHash,
        StreamFinalityManifestRef calldata manifest
    ) external view returns (bytes32);

    function computeSanctionSubjectHash(
        StreamFinalityScope calldata scope,
        bytes32 coreFactsHash,
        bytes32 nonSanctionComponentsHash,
        StreamFinalityManifestRef calldata manifest
    ) external view returns (bytes32);

    function contentRootScopeSubject(StreamFinalityScope calldata scope)
        external
        view
        returns (bytes32);

    // ------------------------------------------------------------------
    // Required reads and diagnostics ([LTA-FINALITY] required reads)
    // ------------------------------------------------------------------

    function collectionFinalityRecord(uint256 collectionId)
        external
        view
        returns (StreamCollectionFinalityRecord memory);

    function finalityComponentCount(uint256 collectionId) external view returns (uint256);

    function finalityComponents(uint256 collectionId, uint256 start, uint256 limit)
        external
        view
        returns (StreamFinalityComponentExpectation[] memory);

    function finalityStillMatches(uint256 collectionId) external view returns (bool);

    function verifyFinality(uint256 collectionId)
        external
        view
        returns (bool currentRouteMatches, bytes32 finalityRecordHash, bytes32 componentsHash);

    function verifyFinalityRange(uint256 collectionId, uint256 start, uint256 limit)
        external
        view
        returns (
            bool rangeMatches,
            bytes32 finalityRecordHash,
            bytes32 expectedRangeHash,
            bytes32 observedRangeHash,
            uint256 nextStart
        );

    function artworkScopeFinalityRecord(StreamFinalityScope calldata scope)
        external
        view
        returns (StreamScopedFinalityRecord memory);

    function verifyArtworkScopeFinality(StreamFinalityScope calldata scope)
        external
        view
        returns (bool currentRouteMatches, bytes32 finalityRecordHash, bytes32 componentsHash);

    function verifyArtworkScopeFinalityRange(
        StreamFinalityScope calldata scope,
        uint256 start,
        uint256 limit
    )
        external
        view
        returns (
            bool rangeMatches,
            bytes32 finalityRecordHash,
            bytes32 expectedRangeHash,
            bytes32 observedRangeHash,
            uint256 nextStart
        );

    function finalityComponentCountForScope(StreamFinalityScope calldata scope)
        external
        view
        returns (uint256);

    function finalityComponentsForScope(
        StreamFinalityScope calldata scope,
        uint256 start,
        uint256 limit
    ) external view returns (StreamFinalityComponentExpectation[] memory);
}
