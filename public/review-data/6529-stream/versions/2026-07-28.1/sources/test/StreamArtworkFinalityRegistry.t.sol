// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IStreamArtworkFinalityRegistry.sol";
import "../smart-contracts/IERC165.sol";
import "../smart-contracts/IStreamCoreFinalityAdapter.sol";
import "../smart-contracts/StreamArtworkFinalityPreview.sol";
import "../smart-contracts/StreamArtworkFinalityRegistry.sol";
import "../smart-contracts/StreamArtworkFinalityTypes.sol";
import "../smart-contracts/StreamCoreFinalityAdapter.sol";
import "./helpers/Assertions.sol";
import "./helpers/FinalityMocks.sol";
import "./helpers/FinalityTestBase.sol";

contract AdversarialFinalityAdapterERC165 {
    address private _core;
    address private _collectionMetadata;
    uint8 private immutable _mode;

    constructor(address core_, address collectionMetadata_, uint8 mode_) {
        _core = core_;
        _collectionMetadata = collectionMetadata_;
        _mode = mode_;
    }

    function supportsInterface(bytes4 interfaceId) external view returns (bool) {
        if (_mode == 7) {
            bool supported = interfaceId == type(IERC165).interfaceId
                || interfaceId == type(IStreamCoreFinalityAdapter).interfaceId;
            assembly ("memory-safe") {
                let output := mload(0x40)
                mstore(output, supported)
                mstore(add(output, 0x20), 0xfeed)
                return(output, 0x40)
            }
        }
        if (interfaceId == 0xffffffff) {
            if (_mode == 1) {
                revert("invalid-interface probe reverted");
            }
            if (_mode == 2) {
                assembly ("memory-safe") {
                    return(0, 0x1f)
                }
            }
            return false;
        }
        if (interfaceId == type(IERC165).interfaceId) {
            return _mode != 3;
        }
        return interfaceId == type(IStreamCoreFinalityAdapter).interfaceId;
    }

    function core() external view returns (address value) {
        value = _core;
        if (_mode == 8 || _mode == 9) {
            uint256 mode = _mode;
            assembly ("memory-safe") {
                let output := mload(0x40)
                let rawAddress := value
                if eq(mode, 9) { rawAddress := or(rawAddress, shl(160, 1)) }
                mstore(output, rawAddress)
                if eq(mode, 8) {
                    mstore(add(output, 0x20), 0xfeed)
                    return(output, 0x40)
                }
                return(output, 0x20)
            }
        }
    }

    function collectionMetadata() external view returns (address) {
        return _collectionMetadata;
    }

    function coreCollectionFinalityFacts(uint256)
        external
        view
        returns (StreamCoreCollectionFinalityFacts memory facts)
    {
        if (_mode == 4 || _mode == 5) {
            uint256 mode = _mode;
            assembly ("memory-safe") {
                let output := mload(0x40)
                let length := 0x120
                if eq(mode, 4) { length := 0x140 }
                for { let cursor := 0 } lt(cursor, length) { cursor := add(cursor, 0x20) } {
                    mstore(add(output, cursor), 0)
                }
                if eq(length, 0x120) { mstore(output, 2) }
                return(output, length)
            }
        }
    }

    function scopedCoreFinalityFacts(StreamCoreFinalityScopeQuery calldata scope)
        external
        view
        returns (StreamScopedCoreFinalityFacts memory facts)
    {
        if (_mode == 6) {
            assembly ("memory-safe") {
                let output := mload(0x40)
                for { let cursor := 0 } lt(cursor, 0x1a0) { cursor := add(cursor, 0x20) } {
                    mstore(add(output, cursor), 0)
                }
                mstore(add(output, 0x20), 0xff)
                mstore(add(output, 0x120), 1)
                return(output, 0x1a0)
            }
        }
        facts.scopeType = scope.scopeType;
        facts.collectionId = scope.collectionId;
        facts.tokenId = scope.tokenId;
        facts.scopeId = scope.scopeId;
    }
}

/// @notice Five-scope lifecycle, execution-gate, diagnostic, and preview coverage for
///         StreamArtworkFinalityRegistry ([LTA-FINALITY], [CMC-FINALITY-INPUTS],
///         [AA-SANCTION], ADR 0009 decision 6).
contract StreamArtworkFinalityRegistryTest is FinalityTestBase {
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;
    using Assertions for address;
    using Assertions for string;

    uint256 private constant ADVERSARIAL_CALL_GAS = 2_000_000;

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

    event FinalityManifestStaged(
        uint16 schemaVersion, bytes32 indexed manifestContentHash, uint256 byteLength, address actor
    );

    event FinalityManifestPointerRecorded(
        uint16 schemaVersion,
        bytes32 indexed finalityRecordHash,
        address manifestPointer,
        bytes32 manifestContentHash
    );

    event ArtworkTerminalFreezeExecuted(
        uint16 schemaVersion,
        bytes32 indexed scopeKey,
        bytes32 indexed finalityRecordHash,
        address executor
    );

    // ------------------------------------------------------------------
    // Construction
    // ------------------------------------------------------------------

    function testConstructorBindsActualCoreMetadataAdapterAndMandatoryDiscovery() public view {
        registry.core().assertEq(address(coreMock), "actual Core binding");
        address(registry.coreReads()).assertEq(address(coreMock), "granular Core seam");
        address(registry.metadataReads()).assertEq(address(metadataMock), "metadata seam");
        address(registry.coreFinalityAdapter()).assertEq(address(coreAdapter), "adapter seam");
        address(registry.sanctionReads()).assertEq(address(sanctionMock), "sanction seam");
        address(registry.governanceAuthority()).assertEq(address(authority), "authority seam");
        registry.finalityDiscovery().assertEq(address(discoveryMock), "mandatory discovery seam");
    }

    function testConstructorRejectsZeroMandatoryDiscovery() public {
        vm.expectRevert(
            abi.encodeWithSelector(StreamArtworkFinalityRegistry.FinalityZeroAddress.selector)
        );
        new StreamArtworkFinalityRegistry(
            address(coreMock),
            address(metadataMock),
            address(coreAdapter),
            address(sanctionMock),
            address(authority),
            address(0)
        );
    }

    function testConstructorRejectsCodelessMandatoryDiscovery() public {
        address codeless = address(0xD15C0);
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamArtworkFinalityRegistry.FinalityDependencyHasNoCode.selector, codeless
            )
        );
        new StreamArtworkFinalityRegistry(
            address(coreMock),
            address(metadataMock),
            address(coreAdapter),
            address(sanctionMock),
            address(authority),
            codeless
        );
    }

    function testConstructorRejectsAdapterCoreBindingMismatch() public {
        MockFinalityCore otherCore = new MockFinalityCore();
        StreamCoreFinalityAdapter mismatched =
            new StreamCoreFinalityAdapter(address(otherCore), address(metadataMock));
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamArtworkFinalityRegistry.FinalityAdapterBindingMismatch.selector,
                address(coreMock),
                address(otherCore),
                address(metadataMock),
                address(metadataMock)
            )
        );
        new StreamArtworkFinalityRegistry(
            address(coreMock),
            address(metadataMock),
            address(mismatched),
            address(sanctionMock),
            address(authority),
            address(discoveryMock)
        );
    }

    function testConstructorRejectsAdapterMetadataBindingMismatch() public {
        MockFinalityMetadata otherMetadata = new MockFinalityMetadata();
        StreamCoreFinalityAdapter mismatched =
            new StreamCoreFinalityAdapter(address(coreMock), address(otherMetadata));
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamArtworkFinalityRegistry.FinalityAdapterBindingMismatch.selector,
                address(coreMock),
                address(coreMock),
                address(metadataMock),
                address(otherMetadata)
            )
        );
        new StreamArtworkFinalityRegistry(
            address(coreMock),
            address(metadataMock),
            address(mismatched),
            address(sanctionMock),
            address(authority),
            address(discoveryMock)
        );
    }

    function testConstructorRejectsNonAdapterContract() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamArtworkFinalityRegistry.FinalityAdapterInterfaceUnsupported.selector,
                address(coreMock)
            )
        );
        new StreamArtworkFinalityRegistry(
            address(coreMock),
            address(metadataMock),
            address(coreMock),
            address(sanctionMock),
            address(authority),
            address(discoveryMock)
        );
    }

    function testConstructorRequiresCanonicalERC165InvalidInterfaceResponse() public {
        for (uint8 mode = 1; mode <= 3; mode++) {
            AdversarialFinalityAdapterERC165 adversarial = new AdversarialFinalityAdapterERC165(
                address(coreMock), address(metadataMock), mode
            );
            vm.expectRevert(
                abi.encodeWithSelector(
                    StreamArtworkFinalityRegistry.FinalityAdapterInterfaceUnsupported.selector,
                    address(adversarial)
                )
            );
            new StreamArtworkFinalityRegistry(
                address(coreMock),
                address(metadataMock),
                address(adversarial),
                address(sanctionMock),
                address(authority),
                address(discoveryMock)
            );
        }
    }

    function testConstructorRejectsOversizedInterfaceAndAddressReturns() public {
        AdversarialFinalityAdapterERC165 oversizedInterface =
            new AdversarialFinalityAdapterERC165(address(coreMock), address(metadataMock), 7);
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamArtworkFinalityRegistry.FinalityAdapterInterfaceUnsupported.selector,
                address(oversizedInterface)
            )
        );
        _deployRegistryWithAdapter(address(oversizedInterface));

        AdversarialFinalityAdapterERC165 oversizedCore =
            new AdversarialFinalityAdapterERC165(address(coreMock), address(metadataMock), 8);
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamArtworkFinalityRegistry.FinalityAdapterReturnShapeInvalid.selector,
                IStreamCoreFinalityAdapter.core.selector,
                uint256(64)
            )
        );
        _deployRegistryWithAdapter(address(oversizedCore));
    }

    function testConstructorRejectsNoncanonicalAddressReturn() public {
        AdversarialFinalityAdapterERC165 noncanonicalCore =
            new AdversarialFinalityAdapterERC165(address(coreMock), address(metadataMock), 9);
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamArtworkFinalityRegistry.FinalityAdapterSemanticProbeInvalid.selector,
                IStreamCoreFinalityAdapter.core.selector
            )
        );
        _deployRegistryWithAdapter(address(noncanonicalCore));
    }

    function testConstructorRejectsLegacyNoncanonicalAndSemanticAdapterPayloads() public {
        AdversarialFinalityAdapterERC165 legacyShape =
            new AdversarialFinalityAdapterERC165(address(coreMock), address(metadataMock), 4);
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamArtworkFinalityRegistry.FinalityAdapterReturnShapeInvalid.selector,
                IStreamCoreFinalityAdapter.coreCollectionFinalityFacts.selector,
                uint256(10 * 32)
            )
        );
        _deployRegistryWithAdapter(address(legacyShape));

        AdversarialFinalityAdapterERC165 noncanonical =
            new AdversarialFinalityAdapterERC165(address(coreMock), address(metadataMock), 5);
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamArtworkFinalityRegistry.FinalityAdapterSemanticProbeInvalid.selector,
                IStreamCoreFinalityAdapter.coreCollectionFinalityFacts.selector
            )
        );
        _deployRegistryWithAdapter(address(noncanonical));

        AdversarialFinalityAdapterERC165 semanticImpostor =
            new AdversarialFinalityAdapterERC165(address(coreMock), address(metadataMock), 6);
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamArtworkFinalityRegistry.FinalityAdapterSemanticProbeInvalid.selector,
                IStreamCoreFinalityAdapter.scopedCoreFinalityFacts.selector
            )
        );
        _deployRegistryWithAdapter(address(semanticImpostor));
    }

    function _deployRegistryWithAdapter(address adapter) private {
        new StreamArtworkFinalityRegistry(
            address(coreMock),
            address(metadataMock),
            adapter,
            address(sanctionMock),
            address(authority),
            address(discoveryMock)
        );
    }

    // ------------------------------------------------------------------
    // Manifest staging (requirement 14)
    // ------------------------------------------------------------------

    function testManifestStagingContentAddressedAndBounded() public {
        bytes memory manifestBytes = bytes("canonical manifest");
        bytes32 contentHash = keccak256(manifestBytes);
        registry.finalityManifestStored(contentHash).assertFalse("not staged yet");

        vm.expectEmit(true, true, true, true);
        emit FinalityManifestStaged(1, contentHash, manifestBytes.length, address(this));
        registry.stageFinalityManifest(manifestBytes).assertEq(contentHash, "content hash");

        registry.finalityManifestStored(contentHash).assertTrue("staged");
        string(registry.finalityManifestBytes(contentHash))
            .assertEq("canonical manifest", "typed accessor returns the exact bytes");

        // Idempotent restage: same hash back, no state change.
        registry.stageFinalityManifest(manifestBytes).assertEq(contentHash, "idempotent");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityManifestBytesInvalid.selector
            )
        );
        registry.stageFinalityManifest("");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityManifestBytesInvalid.selector
            )
        );
        registry.stageFinalityManifest(new bytes(32_769));
    }

    // ------------------------------------------------------------------
    // Collection lifecycle
    // ------------------------------------------------------------------

    function testCollectionLifecycleArtistBound() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        _scheduleAndOpen(fixture);

        // Preview parity before execution ([AA-SANCTION] requirement 2).
        StreamFinalityPreview memory p = previewer.previewCollectionFinality(
            COLLECTION_ID, fixture.components, fixture.manifest
        );
        p.wouldExecute.assertTrue("preview would execute");
        p.stagedFreezeReady.assertTrue("staged freeze ready");
        p.computedFinalityRecordHash
            .assertEq(fixture.expectedFinalityRecordHash, "preview record hash");
        p.computedSanctionSubjectHash
            .assertEq(fixture.sanctionSubjectHash, "preview exposes the sanction subject hash");
        p.computedComponentsHash.assertEq(fixture.componentsHash, "preview components hash");
        p.computedCoreFactsHash.assertEq(fixture.coreFactsHash, "preview core facts hash");

        // Execution emits the spec event shapes with schemaVersion 1.
        vm.expectEmit(true, true, true, true);
        emit CollectionArtworkFinalized(
            1,
            COLLECTION_ID,
            fixture.expectedFinalityRecordHash,
            finalityAdmin,
            fixture.componentsHash,
            fixture.manifest.contentHash,
            fixture.manifest.uri
        );
        vm.expectEmit(true, true, true, true);
        emit FinalityManifestPointerRecorded(
            1, fixture.expectedFinalityRecordHash, address(registry), fixture.manifest.contentHash
        );
        vm.expectEmit(true, true, true, true);
        emit ArtworkTerminalFreezeExecuted(
            1, fixture.scopeKey, fixture.expectedFinalityRecordHash, finalityAdmin
        );
        _finalizeFixtureCall(fixture);

        _assertStoredCollectionRecord(fixture);
        _assertComponentPagination(fixture);
        _assertHealthyDiagnostics(fixture);
        _assertFrozenRoutes(fixture);
        _assertCollectionImmutability(fixture);
    }

    function _assertStoredCollectionRecord(Fixture memory fixture) private {
        StreamCollectionFinalityRecord memory record =
            registry.collectionFinalityRecord(COLLECTION_ID);
        record.finalized.assertTrue("finalized");
        record.finalityRecordHash.assertEq(fixture.expectedFinalityRecordHash, "record hash");
        record.componentsHash.assertEq(fixture.componentsHash, "components hash");
        record.manifestContentHash.assertEq(fixture.manifest.contentHash, "manifest content");
        record.manifestURIHash.assertEq(fixture.manifest.uriHash, "manifest uri hash");
        record.finalityManifestURI.assertEq(fixture.manifest.uri, "manifest uri");
        record.manifestPointer.assertEq(address(registry), "manifest pointer in registry storage");
        uint256(record.finalizedAt).assertEq(block.timestamp, "finalizedAt");

        // The scoped read mirror serves the COLLECTION scope.
        StreamScopedFinalityRecord memory mirrored =
            registry.artworkScopeFinalityRecord(fixture.scope);
        mirrored.finalized.assertTrue("mirrored finalized");
        mirrored.finalityRecordHash.assertEq(fixture.expectedFinalityRecordHash, "mirrored hash");
        uint256(uint8(mirrored.scope.scopeType))
            .assertEq(uint256(uint8(StreamFinalityScopeType.COLLECTION)), "mirrored scope type");
    }

    function _assertComponentPagination(Fixture memory fixture) private {
        uint256 total = fixture.components.length; // base fixture: 6 mandatory + 1 sanction
        registry.finalityComponentCount(COLLECTION_ID).assertEq(total, "component count");
        StreamFinalityComponentExpectation[] memory page =
            registry.finalityComponents(COLLECTION_ID, 1, 1);
        page.length.assertEq(1, "page size");
        page[0].componentType.assertEq(fixture.components[1].componentType, "page content");
        registry.finalityComponents(COLLECTION_ID, total, 5).length.assertEq(0, "past-end page");
        registry.finalityComponents(COLLECTION_ID, 0, 0).length.assertEq(0, "zero limit");
    }

    function _assertHealthyDiagnostics(Fixture memory fixture) private {
        (bool matches, bytes32 recHash, bytes32 compHash) = registry.verifyFinality(COLLECTION_ID);
        matches.assertTrue("route matches");
        recHash.assertEq(fixture.expectedFinalityRecordHash, "verify record hash");
        compHash.assertEq(fixture.componentsHash, "verify components hash");
        registry.finalityStillMatches(COLLECTION_ID).assertTrue("still matches");
    }

    function _assertFrozenRoutes(Fixture memory fixture) private {
        (bool pinned, address module, bytes32 routeHash, bytes32 routeRecordHash) =
            registry.frozenRouteForScope(StreamFinalityDomains.COMPONENT_RENDERER, fixture.scope);
        pinned.assertTrue("route pinned");
        module.assertEq(address(rendererComponent), "route module");
        routeRecordHash.assertEq(fixture.expectedFinalityRecordHash, "route record hash");
        (routeHash != bytes32(0)).assertTrue("route hash nonzero");
        // OPTIONAL_SNAPSHOT_ROUTE is not in a base fixture, so it is a genuinely absent route.
        (bool unpinned,,, bytes32 stillRecord) = registry.frozenRouteForScope(
            StreamFinalityDomains.COMPONENT_OPTIONAL_SNAPSHOT_ROUTE, fixture.scope
        );
        unpinned.assertFalse("absent route type unpinned");
        stillRecord.assertEq(fixture.expectedFinalityRecordHash, "record hash still returned");
    }

    function _assertCollectionImmutability(Fixture memory fixture) private {
        uint256(uint8(registry.artworkTerminalFreezeAction(fixture.scope).status))
            .assertEq(uint256(uint8(StreamTerminalFreezeStatus.EXECUTED)), "action executed");
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityAlreadyFinalized.selector, fixture.scopeKey
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );
    }

    function testCollectionLifecyclePlatformWorks() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), false);
        _executeFixture(fixture);
        registry.collectionFinalityRecord(COLLECTION_ID).finalized
            .assertTrue("platform-works collection finalized without sanction verification");
        // The declaration component is bound inside componentsHash like any component.
        (bool pinned, address module,,) = registry.frozenRouteForScope(
            StreamFinalityDomains.COMPONENT_PLATFORM_WORKS_DECLARATION, fixture.scope
        );
        pinned.assertTrue("declaration pinned");
        module.assertEq(address(sanctionComponent), "declaration module");
    }

    // ------------------------------------------------------------------
    // Scoped lifecycles (TOKEN, RELEASE, SEASON, VIEW)
    // ------------------------------------------------------------------

    function testTokenScopeLifecycle() public {
        StreamFinalityScope memory scope = _tokenScope(COLLECTION_ID, 4321);
        Fixture memory fixture = _buildFixture(scope, true);
        _scheduleAndOpen(fixture);

        vm.expectEmit(true, true, true, true);
        emit ArtworkScopeFinalized(
            1,
            uint8(StreamFinalityScopeType.TOKEN),
            COLLECTION_ID,
            fixture.expectedFinalityRecordHash,
            4321,
            bytes32(0),
            fixture.componentsHash,
            fixture.manifest.contentHash,
            fixture.manifest.uri
        );
        _finalizeFixtureCall(fixture);

        StreamScopedFinalityRecord memory record = registry.artworkScopeFinalityRecord(scope);
        record.finalized.assertTrue("token record finalized");
        record.finalityRecordHash.assertEq(fixture.expectedFinalityRecordHash, "token record hash");
        record.scope.tokenId.assertEq(4321, "token id echo");
        record.manifestPointer.assertEq(address(registry), "manifest pointer");

        (bool matches, bytes32 recHash,) = registry.verifyArtworkScopeFinality(scope);
        matches.assertTrue("scoped route matches");
        recHash.assertEq(fixture.expectedFinalityRecordHash, "scoped verify hash");

        uint256 total = fixture.components.length;
        registry.finalityComponentCountForScope(scope).assertEq(total, "scoped component count");
        registry.finalityComponentsForScope(scope, 0, 20).length.assertEq(total, "scoped page");

        // The collection itself is untouched.
        registry.collectionFinalityRecord(COLLECTION_ID).finalized
            .assertFalse("collection not finalized by token finality");

        // Immutability at the exact scope.
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityAlreadyFinalized.selector, fixture.scopeKey
            )
        );
        registry.finalizeArtworkScope(
            scope, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );
    }

    function testReleaseSeasonViewScopeLifecycles() public {
        StreamFinalityScopeType[3] memory scopeTypes = [
            StreamFinalityScopeType.RELEASE,
            StreamFinalityScopeType.SEASON,
            StreamFinalityScopeType.VIEW
        ];
        for (uint256 i = 0; i < scopeTypes.length; i++) {
            StreamFinalityScope memory scope = _idScope(
                scopeTypes[i], COLLECTION_ID, keccak256(abi.encodePacked("scope-id", i))
            );
            Fixture memory fixture = _buildFixture(scope, true);
            _executeFixture(fixture);
            StreamScopedFinalityRecord memory record = registry.artworkScopeFinalityRecord(scope);
            record.finalized.assertTrue("scoped record finalized");
            record.finalityRecordHash
                .assertEq(fixture.expectedFinalityRecordHash, "scoped record hash");
            record.scope.scopeId.assertEq(scope.scopeId, "scope id echo");
            (bool matches,,) = registry.verifyArtworkScopeFinality(scope);
            matches.assertTrue("scoped verify");
        }
    }

    function testScopedEntryRejectsCollectionScopeAndBadShapes() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityScopeUsesCollectionEntry.selector
            )
        );
        registry.finalizeArtworkScope(
            fixture.scope, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // TOKEN scope with a nonzero scopeId is malformed (scope rule 2).
        StreamFinalityScope memory malformed = _tokenScope(COLLECTION_ID, 5);
        malformed.scopeId = keccak256("unexpected");
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityScopeShapeInvalid.selector
            )
        );
        registry.finalizeArtworkScope(
            malformed, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // RELEASE scope requires a nonzero scopeId (scope rule 3).
        StreamFinalityScope memory releaseScope =
            _idScope(StreamFinalityScopeType.RELEASE, COLLECTION_ID, bytes32(0));
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityScopeShapeInvalid.selector
            )
        );
        registry.finalizeArtworkScope(
            releaseScope, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );
    }

    function testScopedGatesCollectionExistenceAndTokenLifecycle() public {
        StreamFinalityScope memory scope = _tokenScope(COLLECTION_ID, 77);
        Fixture memory fixture = _buildFixture(scope, true);
        _scheduleAndOpen(fixture);

        // A missing parent collection produces a negative adapter fact and blocks.
        coreMock.setCollectionExists(COLLECTION_ID, false);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamArtworkFinalityRegistry.FinalityScopeUnknown.selector)
        );
        registry.finalizeArtworkScope(
            scope, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // A prepared-incomplete token is not a valid finality scope (scope rule 2).
        coreMock.setCollectionExists(COLLECTION_ID, true);
        coreMock.setTokenLifecycle(scope.tokenId, 1); // PREPARED_INCOMPLETE
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamArtworkFinalityRegistry.FinalityScopeUnknown.selector)
        );
        registry.finalizeArtworkScope(
            scope, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // A token identity mapped to another collection also returns a negative semantic fact.
        coreMock.setTokenIdentity(scope.tokenId, true, COLLECTION_ID + 1, 3, false);
        coreMock.setTokenLifecycle(scope.tokenId, StreamFinalityDomains.TOKEN_LIFECYCLE_MINTED);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamArtworkFinalityRegistry.FinalityScopeUnknown.selector)
        );
        registry.finalizeArtworkScope(
            scope, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // A BURNED token still finalizes (burn-surviving archival identity), after the facts
        // change is rebound into the staged hash.
        coreMock.setTokenIdentity(scope.tokenId, true, COLLECTION_ID, 3, true);
        coreMock.setTokenLifecycle(scope.tokenId, StreamFinalityDomains.TOKEN_LIFECYCLE_BURNED);
        fixture.coreFactsHash = registry.computeScopedCoreFactsHash(scope);
        _recomputeFixtureHashes(fixture, true);
        vm.prank(finalityAdmin);
        registry.cancelArtworkTerminalFreeze(scope, keccak256("rebind"));
        _executeFixture(fixture);
        registry.artworkScopeFinalityRecord(scope).finalized.assertTrue("burned token finalized");
    }

    function testTokenScopeRequiresExactlyOneLeaf() public {
        StreamFinalityScope memory scope = _tokenScope(COLLECTION_ID, 88);
        Fixture memory fixture = _buildFixture(scope, true);
        metadataMock.setContentRoot(
            COLLECTION_ID,
            registry.contentRootScopeSubject(scope),
            keccak256("root"),
            2, // must be exactly 1 for TOKEN scope
            keccak256("schema")
        );
        _scheduleAndOpen(fixture);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityContentRootLeafCountMismatch.selector,
                uint256(1),
                uint256(2)
            )
        );
        registry.finalizeArtworkScope(
            scope, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );
    }

    // ------------------------------------------------------------------
    // Collection execution gates (negative matrix)
    // ------------------------------------------------------------------

    function testFinalizeRequiresFinalityAdmin() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        _scheduleAndOpen(fixture);
        vm.prank(outsider);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityCallerNotFinalityAdmin.selector, outsider
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );
    }

    function testCollectionGatesExistenceClosedBurnBlockAndFreeze() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        _scheduleAndOpen(fixture);

        // Unknown collection.
        coreMock.setCollectionExists(COLLECTION_ID, false);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityCollectionUnknown.selector, COLLECTION_ID
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // ACTIVE (not CLOSED) blocks: CLOSED alone is the minting boundary (requirement 7).
        coreMock.setCollectionExists(COLLECTION_ID, true);
        coreMock.setCollectionStatus(COLLECTION_ID, 0);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityCollectionNotClosed.selector,
                COLLECTION_ID,
                uint8(0)
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // CLOSED without the one-way burn block still blocks ([CMC-BURN] rule 7).
        coreMock.setCollectionStatus(
            COLLECTION_ID, StreamFinalityDomains.CORE_COLLECTION_STATUS_CLOSED
        );
        coreMock.setBurnsBlocked(COLLECTION_ID, false);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityCollectionBurnsNotBlocked.selector,
                COLLECTION_ID
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // The separate one-way collection freeze is equally mandatory and previewed.
        coreMock.setBurnsBlocked(COLLECTION_ID, true);
        coreMock.setCollectionFrozen(COLLECTION_ID, false);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityCollectionNotFrozen.selector, COLLECTION_ID
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );
        StreamFinalityPreview memory p = previewer.previewCollectionFinality(
            COLLECTION_ID, fixture.components, fixture.manifest
        );
        p.coreGatesSatisfied.assertFalse("preview mirrors Core freeze gate");
        p.wouldExecute.assertFalse("unfrozen collection cannot execute");

        // Restore and execute to prove the gate matrix was the only blocker.
        coreMock.setCollectionFrozen(COLLECTION_ID, true);
        _finalizeFixtureCall(fixture);
        registry.collectionFinalityRecord(COLLECTION_ID).finalized.assertTrue("finalized");
    }

    function testCollectionStatusAndSupplyModeDomainsFailClosed() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        _scheduleAndOpen(fixture);
        uint8[2] memory invalidValues = [uint8(3), type(uint8).max];

        for (uint256 i = 0; i < invalidValues.length; i++) {
            uint8 invalidStatus = invalidValues[i];
            coreMock.setCollectionStatus(COLLECTION_ID, invalidStatus);

            StreamFinalityPreview memory p = previewer.previewCollectionFinality(
                COLLECTION_ID, fixture.components, fixture.manifest
            );
            p.coreGatesSatisfied.assertFalse("preview rejects invalid collection status");
            p.wouldExecute.assertFalse("invalid collection status cannot execute");

            vm.prank(finalityAdmin);
            vm.expectRevert(
                abi.encodeWithSelector(
                    IStreamArtworkFinalityRegistry.FinalityCollectionStatusInvalid.selector,
                    COLLECTION_ID,
                    invalidStatus
                )
            );
            registry.finalizeCollectionArtwork(
                COLLECTION_ID,
                fixture.components,
                fixture.expectedFinalityRecordHash,
                fixture.manifest
            );
        }

        coreMock.setCollectionStatus(
            COLLECTION_ID, StreamFinalityDomains.CORE_COLLECTION_STATUS_CLOSED
        );
        for (uint256 i = 0; i < invalidValues.length; i++) {
            uint8 invalidSupplyMode = invalidValues[i];
            coreMock.setCollectionSupply(
                COLLECTION_ID,
                true,
                invalidSupplyMode,
                MINTED_SUPPLY,
                MINTED_SUPPLY,
                MINTED_SUPPLY + 1
            );

            StreamFinalityPreview memory p = previewer.previewCollectionFinality(
                COLLECTION_ID, fixture.components, fixture.manifest
            );
            p.coreGatesSatisfied.assertFalse("preview rejects invalid collection supply mode");
            p.wouldExecute.assertFalse("invalid collection supply mode cannot execute");

            vm.prank(finalityAdmin);
            vm.expectRevert(
                abi.encodeWithSelector(
                    IStreamArtworkFinalityRegistry.FinalityCollectionSupplyModeInvalid.selector,
                    COLLECTION_ID,
                    invalidSupplyMode
                )
            );
            registry.finalizeCollectionArtwork(
                COLLECTION_ID,
                fixture.components,
                fixture.expectedFinalityRecordHash,
                fixture.manifest
            );
        }
    }

    function testScopedCollectionStatusAndSupplyModeDomainsMatchExecutionAndPreview() public {
        StreamFinalityScope memory scope =
            _idScope(StreamFinalityScopeType.SEASON, COLLECTION_ID, keccak256("season-1"));
        Fixture memory fixture = _buildFixture(scope, true);
        _scheduleAndOpen(fixture);
        uint8[2] memory invalidValues = [uint8(3), type(uint8).max];

        for (uint256 i = 0; i < invalidValues.length; i++) {
            uint8 invalidStatus = invalidValues[i];
            coreMock.setCollectionStatus(COLLECTION_ID, invalidStatus);

            StreamFinalityPreview memory p =
                previewer.previewArtworkScopeFinality(scope, fixture.components, fixture.manifest);
            p.coreGatesSatisfied.assertFalse("scoped preview rejects invalid collection status");
            p.wouldExecute.assertFalse("invalid scoped collection status cannot execute");

            vm.prank(finalityAdmin);
            vm.expectRevert(
                abi.encodeWithSelector(
                    IStreamArtworkFinalityRegistry.FinalityCollectionStatusInvalid.selector,
                    COLLECTION_ID,
                    invalidStatus
                )
            );
            registry.finalizeArtworkScope(
                scope, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
            );
        }

        coreMock.setCollectionStatus(COLLECTION_ID, 0);
        for (uint256 i = 0; i < invalidValues.length; i++) {
            uint8 invalidSupplyMode = invalidValues[i];
            coreMock.setCollectionSupply(COLLECTION_ID, false, invalidSupplyMode, 0, 0, 0);

            StreamFinalityPreview memory p =
                previewer.previewArtworkScopeFinality(scope, fixture.components, fixture.manifest);
            p.coreGatesSatisfied
                .assertFalse("scoped preview rejects invalid collection supply mode");
            p.wouldExecute.assertFalse("invalid scoped collection supply mode cannot execute");

            vm.prank(finalityAdmin);
            vm.expectRevert(
                abi.encodeWithSelector(
                    IStreamArtworkFinalityRegistry.FinalityCollectionSupplyModeInvalid.selector,
                    COLLECTION_ID,
                    invalidSupplyMode
                )
            );
            registry.finalizeArtworkScope(
                scope, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
            );
        }
    }

    function testContentRootGates() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        bytes32 scopeSubject = registry.contentRootScopeSubject(fixture.scope);
        _scheduleAndOpen(fixture);

        // Missing root blocks every scope in every metadata mode (requirement 6).
        metadataMock.setContentRoot(COLLECTION_ID, scopeSubject, bytes32(0), 0, bytes32(0));
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityContentRootMissing.selector, scopeSubject
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // Leaf count must equal minted-ever for collection scope.
        metadataMock.setContentRoot(
            COLLECTION_ID,
            scopeSubject,
            keccak256("root"),
            uint64(MINTED_SUPPLY - 1),
            keccak256("schema")
        );
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityContentRootLeafCountMismatch.selector,
                MINTED_SUPPLY,
                MINTED_SUPPLY - 1
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // Preview reports the same failing gate without reverting.
        StreamFinalityPreview memory p = previewer.previewCollectionFinality(
            COLLECTION_ID, fixture.components, fixture.manifest
        );
        p.contentRootSatisfied.assertFalse("preview content root gate");
        p.wouldExecute.assertFalse("preview would not execute");
    }

    function testCollectionMintedSupplyAboveUint64FailsClosedWithoutDowncast() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        uint256 mintedSupply = uint256(type(uint64).max) + 1;
        uint64 recordedLeafCount = type(uint64).max;
        coreMock.setCollectionSupply(
            COLLECTION_ID, true, 0, mintedSupply, mintedSupply, mintedSupply + 1
        );
        coreMock.setLiveSupply(COLLECTION_ID, mintedSupply - BURNED_SUPPLY);
        fixture.coreFactsHash = registry.computeCollectionCoreFactsHash(COLLECTION_ID);
        _recomputeFixtureHashes(fixture, true);

        bytes32 scopeSubject = registry.contentRootScopeSubject(fixture.scope);
        metadataMock.setContentRoot(
            COLLECTION_ID,
            scopeSubject,
            keccak256("large-root"),
            recordedLeafCount,
            keccak256("schema")
        );
        _scheduleAndOpen(fixture);

        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityContentRootLeafCountMismatch.selector,
                mintedSupply,
                uint256(recordedLeafCount)
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );
    }

    function _cloneManifest(StreamFinalityManifestRef memory manifest)
        private
        pure
        returns (StreamFinalityManifestRef memory)
    {
        return StreamFinalityManifestRef({
            uri: manifest.uri,
            uriHash: manifest.uriHash,
            contentHash: manifest.contentHash,
            schemaId: manifest.schemaId,
            canonicalizationHash: manifest.canonicalizationHash
        });
    }

    function _cloneComponents(StreamFinalityComponentExpectation[] memory components)
        private
        pure
        returns (StreamFinalityComponentExpectation[] memory cloned)
    {
        cloned = new StreamFinalityComponentExpectation[](components.length);
        for (uint256 i = 0; i < components.length; i++) {
            cloned[i] = StreamFinalityComponentExpectation({
                componentType: components[i].componentType,
                component: components[i].component,
                interfaceId: components[i].interfaceId,
                codeHash: components[i].codeHash,
                moduleVersion: components[i].moduleVersion,
                manifestHash: components[i].manifestHash,
                dataHash: components[i].dataHash
            });
        }
    }

    function testManifestGates() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        _scheduleAndOpen(fixture);

        // uriHash must recompute from the uri string.
        StreamFinalityManifestRef memory badManifest = _cloneManifest(fixture.manifest);
        badManifest.uriHash = keccak256("some other uri");
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityManifestURIHashMismatch.selector,
                keccak256(bytes(fixture.manifest.uri)),
                badManifest.uriHash
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, badManifest
        );

        // Zero schema / canonicalization / content hash all block.
        badManifest = _cloneManifest(fixture.manifest);
        badManifest.schemaId = bytes32(0);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityManifestFieldZero.selector
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, badManifest
        );

        // Manifest bytes must already live in registry storage (requirement 14).
        badManifest = _cloneManifest(fixture.manifest);
        badManifest.contentHash = keccak256("never staged bytes");
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityManifestBytesMissing.selector,
                badManifest.contentHash
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, badManifest
        );
    }

    function testComponentListShapeGates() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        _scheduleAndOpen(fixture);

        // Unsorted list reverts before any state is written.
        StreamFinalityComponentExpectation[] memory unsorted =
            new StreamFinalityComponentExpectation[](3);
        unsorted[0] = fixture.components[1];
        unsorted[1] = fixture.components[0];
        unsorted[2] = fixture.components[2];
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityComponentsUnsorted.selector, uint256(1)
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, unsorted, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // Duplicate full-identity tuples revert.
        StreamFinalityComponentExpectation[] memory duplicated =
            new StreamFinalityComponentExpectation[](2);
        duplicated[0] = fixture.components[0];
        duplicated[1] = fixture.components[0];
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityComponentsUnsorted.selector, uint256(1)
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, duplicated, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // Empty and over-cap lists revert.
        StreamFinalityComponentExpectation[] memory empty;
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityComponentCountInvalid.selector,
                uint256(0),
                uint256(32)
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, empty, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        StreamFinalityComponentExpectation[] memory tooMany =
            new StreamFinalityComponentExpectation[](33);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityComponentCountInvalid.selector,
                uint256(33),
                uint256(32)
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, tooMany, fixture.expectedFinalityRecordHash, fixture.manifest
        );
    }

    function testSanctionComponentGates() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        _scheduleAndOpen(fixture);

        // Missing sanction/declaration component is nonconformant (requirement 9). Removing the
        // one sanction slot leaves the six mandatory components intact, so the mandatory floor
        // passes and the sanction-missing revert fires.
        StreamFinalityComponentExpectation[] memory withoutSanction =
            new StreamFinalityComponentExpectation[](fixture.components.length - 1);
        uint256 cursor = 0;
        for (uint256 i = 0; i < fixture.components.length; i++) {
            if (
                fixture.components[i].componentType
                    != StreamFinalityDomains.COMPONENT_ARTIST_SANCTION
            ) {
                withoutSanction[cursor] = fixture.components[i];
                cursor++;
            }
        }
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalitySanctionComponentMissing.selector
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, withoutSanction, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // Carrying both ARTIST_SANCTION and PLATFORM_WORKS_DECLARATION is nonconformant.
        MockFinalityComponent declarationComponent = new MockFinalityComponent();
        StreamFinalityComponentExpectation memory declarationEntry = _expectationFor(
            declarationComponent,
            StreamFinalityDomains.COMPONENT_PLATFORM_WORKS_DECLARATION,
            keccak256("declaration")
        );
        _installComponentState(fixture.scope, declarationEntry);
        StreamFinalityComponentExpectation[] memory both =
            new StreamFinalityComponentExpectation[](fixture.components.length + 1);
        for (uint256 i = 0; i < fixture.components.length; i++) {
            both[i] = fixture.components[i];
        }
        both[fixture.components.length] = declarationEntry;
        both = _sortComponents(both);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalitySanctionComponentDuplicated.selector
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, both, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // The wrong component type for the collection's binding state blocks.
        sanctionMock.setRequiredComponentType(
            COLLECTION_ID, StreamFinalityDomains.COMPONENT_PLATFORM_WORKS_DECLARATION
        );
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalitySanctionComponentWrongType.selector,
                StreamFinalityDomains.COMPONENT_PLATFORM_WORKS_DECLARATION,
                StreamFinalityDomains.COMPONENT_ARTIST_SANCTION
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );
        sanctionMock.setRequiredComponentType(
            COLLECTION_ID, StreamFinalityDomains.COMPONENT_ARTIST_SANCTION
        );

        // An unverified sanction blocks: no unsigned finalization path (requirement 9).
        sanctionMock.setSanctionResponse(
            uint8(fixture.scope.scopeType),
            COLLECTION_ID,
            0,
            bytes32(0),
            fixture.sanctionSubjectHash,
            false,
            fixture.sanctionRecordHash
        );
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalitySanctionInvalid.selector,
                fixture.sanctionSubjectHash
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // A verified sanction whose record hash differs from the component dataHash blocks.
        sanctionMock.setSanctionResponse(
            uint8(fixture.scope.scopeType),
            COLLECTION_ID,
            0,
            bytes32(0),
            fixture.sanctionSubjectHash,
            true,
            keccak256("some other sanction record")
        );
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalitySanctionRecordHashMismatch.selector,
                fixture.sanctionRecordHash,
                keccak256("some other sanction record")
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // Restoring the verified response lets execution pass: the sanction subject hash the
        // registry computed matched the fixture's, or the keyed mock could not have answered.
        sanctionMock.setSanctionResponse(
            uint8(fixture.scope.scopeType),
            COLLECTION_ID,
            0,
            bytes32(0),
            fixture.sanctionSubjectHash,
            true,
            fixture.sanctionRecordHash
        );
        _finalizeFixtureCall(fixture);
        registry.collectionFinalityRecord(COLLECTION_ID).finalized.assertTrue("finalized");
    }

    function testLiveComponentVerificationGates() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        _scheduleAndOpen(fixture);

        // frozen = false blocks (requirement 1: every module must report frozen state).
        StreamFinalityComponentState memory thawed = _stateFor(fixture.components[1]);
        thawed.frozen = false;
        MockFinalityComponent(fixture.components[1].component)
            .setCollectionState(COLLECTION_ID, thawed);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityComponentMismatch.selector, uint256(1)
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // dataHash drift blocks.
        StreamFinalityComponentState memory drifted = _stateFor(fixture.components[1]);
        drifted.dataHash = keccak256("drifted");
        MockFinalityComponent(fixture.components[1].component)
            .setCollectionState(COLLECTION_ID, drifted);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityComponentMismatch.selector, uint256(1)
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );
        MockFinalityComponent(fixture.components[1].component)
            .setCollectionState(COLLECTION_ID, _stateFor(fixture.components[1]));

        // A reverting component read blocks recording (stricter than diagnostics).
        MockFinalityComponent(fixture.components[0].component).setMode(1);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityComponentUnreadable.selector, uint256(0)
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );
        MockFinalityComponent(fixture.components[0].component).setMode(0);

        // A codeHash expectation that no longer matches the deployed code blocks. The mutated
        // entry is the sanction slot (sorted index 0): sanction entries are excluded from the
        // subject hash, so the code-hash gate is reached rather than the sanction gate — for
        // any non-sanction entry the sanction invalidates first, which is the spec's intent
        // (the artist signed those exact components).
        StreamFinalityComponentExpectation[] memory reHashed = _cloneComponents(fixture.components);
        reHashed[0].codeHash = keccak256("not the deployed code hash");
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityComponentCodeHashMismatch.selector,
                uint256(0)
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, reHashed, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // A component address with no code blocks.
        StreamFinalityComponentExpectation[] memory codeless = _cloneComponents(fixture.components);
        codeless[0].component = address(0xDEAD);
        codeless = _sortComponents(codeless);
        uint256 codelessIndex = 0;
        for (uint256 i = 0; i < codeless.length; i++) {
            if (codeless[i].component == address(0xDEAD)) {
                codelessIndex = i;
            }
        }
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityComponentUnreadable.selector, codelessIndex
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, codeless, fixture.expectedFinalityRecordHash, fixture.manifest
        );
    }

    function testExpectedRecordHashMismatchBlocks() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        // Stage a hash that will not match the recomputation: both staged and supplied agree,
        // so the staged-hash gate passes and the recomputation gate must catch it.
        bytes32 wrongHash = keccak256("wrong expected record hash");
        uint64 notBefore = uint64(block.timestamp) + registry.TERMINAL_FREEZE_VETO_FLOOR();
        uint64 expiresAfter = notBefore + registry.TERMINAL_FREEZE_EXECUTION_WINDOW_FLOOR();
        vm.prank(finalityAdmin);
        registry.scheduleArtworkTerminalFreeze(fixture.scope, wrongHash, notBefore, expiresAfter);
        vm.warp(notBefore);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityExpectedRecordHashMismatch.selector,
                wrongHash,
                fixture.expectedFinalityRecordHash
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, wrongHash, fixture.manifest
        );
    }

    // ------------------------------------------------------------------
    // Mandatory discovery seam
    // ------------------------------------------------------------------

    function testMandatoryDiscoveryGate() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        uint256 total = fixture.components.length;
        _scheduleAndOpen(fixture);

        // Missing discovery record blocks.
        discoveryMock.setCollectionDiscovery(COLLECTION_ID, 0, bytes32(0));
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityDiscoveryCountMismatch.selector,
                uint256(0),
                total
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // Count match with hash mismatch blocks.
        discoveryMock.setCollectionDiscovery(COLLECTION_ID, total, keccak256("router disagrees"));
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityDiscoveryHashMismatch.selector,
                keccak256("router disagrees"),
                fixture.componentsHash
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // A router cannot advertise the right count/hash while enumerating a different route.
        discoveryMock.setCollectionDiscovery(COLLECTION_ID, total, fixture.componentsHash);
        StreamFinalityComponentExpectation[] memory wrongRoute =
            _cloneComponents(fixture.components);
        wrongRoute[0].dataHash = keccak256("different enumerated component");
        discoveryMock.setCollectionComponent(COLLECTION_ID, 0, wrongRoute[0]);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityDiscoveryComponentMismatch.selector,
                uint256(0)
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );
        StreamFinalityPreview memory p = previewer.previewCollectionFinality(
            COLLECTION_ID, fixture.components, fixture.manifest
        );
        p.discoveryMatches.assertFalse("preview rejects enumerated-route mismatch");

        // Exact discovery agreement passes.
        discoveryMock.setCollectionComponent(COLLECTION_ID, 0, fixture.components[0]);
        _finalizeFixtureCall(fixture);
        registry.collectionFinalityRecord(COLLECTION_ID).finalized.assertTrue("finalized");
    }

    function testDiscoveryComponentAtExact224ByteReturnPassesExecutionAndPreview() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        (bool countSuccess, bytes memory countReturndata) = address(discoveryMock)
            .staticcall(
                abi.encodeWithSelector(
                    IStreamArtworkFinalityDiscovery.finalityComponentCount.selector, COLLECTION_ID
                )
            );
        countSuccess.assertTrue("exact count read succeeds");
        countReturndata.length.assertEq(32, "count read is exactly one word");

        (bool hashSuccess, bytes memory hashReturndata) = address(discoveryMock)
            .staticcall(
                abi.encodeWithSelector(
                    IStreamArtworkFinalityDiscovery.finalityDiscoveryHash.selector, COLLECTION_ID
                )
            );
        hashSuccess.assertTrue("exact hash read succeeds");
        hashReturndata.length.assertEq(32, "hash read is exactly one word");

        (bool success, bytes memory returndata) = address(discoveryMock)
            .staticcall(
                abi.encodeWithSelector(
                    IStreamArtworkFinalityDiscovery.finalityComponentAt.selector,
                    COLLECTION_ID,
                    uint256(0)
                )
            );
        success.assertTrue("exact component read succeeds");
        returndata.length.assertEq(7 * 32, "component read is exactly seven words");

        StreamFinalityPreview memory p = previewer.previewCollectionFinality(
            COLLECTION_ID, fixture.components, fixture.manifest
        );
        p.discoveryMatches.assertTrue("preview accepts exact enumerated route");

        _scheduleAndOpen(fixture);
        _finalizeFixtureCall(fixture);
        registry.collectionFinalityRecord(COLLECTION_ID).finalized.assertTrue("finalized");
    }

    function testDiscoveryFactFailuresRejectExecutionAndFailClosedInPreview() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        _scheduleAndOpen(fixture);

        for (uint8 readMode = 1; readMode <= 4; readMode++) {
            discoveryMock.setReadMode(readMode);
            _assertCollectionDiscoveryExecutionUnreadable(fixture);
        }

        discoveryMock.setReadMode(0);
        for (uint8 readMode = 1; readMode <= 4; readMode++) {
            discoveryMock.setHashReadMode(readMode);
            _assertCollectionDiscoveryExecutionUnreadable(fixture);
        }

        discoveryMock.setHashReadMode(0);
        _finalizeFixtureCall(fixture);
        registry.collectionFinalityRecord(COLLECTION_ID).finalized.assertTrue("finalized");
    }

    function _assertCollectionDiscoveryExecutionUnreadable(Fixture memory fixture) private {
        StreamFinalityPreview memory p = _boundedPreview(fixture);
        p.discoveryMatches.assertFalse("preview fails closed on discovery fact read failure");

        _assertBoundedFinalizeRevert(
            fixture,
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityDiscoveryFactsUnreadable.selector
            )
        );
    }

    function testDiscoveryComponentAtFailuresRejectExecutionAndFailClosedInPreview() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        _scheduleAndOpen(fixture);

        for (uint8 readMode = 1; readMode <= 4; readMode++) {
            discoveryMock.setComponentReadMode(readMode);
            StreamFinalityPreview memory p = _boundedPreview(fixture);
            p.discoveryMatches.assertFalse("preview fails closed on component read failure");

            _assertBoundedFinalizeRevert(
                fixture,
                abi.encodeWithSelector(
                    IStreamArtworkFinalityRegistry.FinalityDiscoveryComponentUnreadable.selector,
                    uint256(0)
                )
            );
        }

        discoveryMock.setComponentReadMode(0);
        _finalizeFixtureCall(fixture);
        registry.collectionFinalityRecord(COLLECTION_ID).finalized.assertTrue("finalized");
    }

    function testSlowDiscoveryReadsPassStrictAndPreviewButExceedDiagnosticBudget() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        discoveryMock.setReadMode(5);
        discoveryMock.setComponentReadMode(5);

        StreamFinalityPreview memory p = previewer.previewCollectionFinality(
            COLLECTION_ID, fixture.components, fixture.manifest
        );
        p.discoveryMatches.assertTrue("preview does not impose diagnostic gas cap");

        _executeFixture(fixture);
        (bool matches,,) = registry.verifyFinality(COLLECTION_ID);
        matches.assertFalse("slow discovery facts exceed diagnostic gas cap");

        discoveryMock.setReadMode(0);
        (matches,,) = registry.verifyFinality(COLLECTION_ID);
        matches.assertFalse("slow discovery component exceeds diagnostic gas cap");

        discoveryMock.setComponentReadMode(0);
        (matches,,) = registry.verifyFinality(COLLECTION_ID);
        matches.assertTrue("normal discovery remains healthy");
    }

    function testComponentReadBombsFailClosedAcrossStrictPreviewAndDiagnostics() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        MockFinalityComponent adversarial = MockFinalityComponent(fixture.components[0].component);
        _scheduleAndOpen(fixture);

        for (
            uint8 mode = adversarial.MODE_GAS_BURN();
            mode <= adversarial.MODE_OVERSIZED_RETURN();
            mode++
        ) {
            adversarial.setMode(mode);
            StreamFinalityPreview memory p = _boundedPreview(fixture);
            p.componentsMatchLive.assertFalse("preview fails closed on component read bomb");

            _assertBoundedFinalizeRevert(
                fixture,
                abi.encodeWithSelector(
                    IStreamArtworkFinalityRegistry.FinalityComponentUnreadable.selector, uint256(0)
                )
            );
        }

        adversarial.setMode(adversarial.MODE_NORMAL());
        _finalizeFixtureCall(fixture);
        for (
            uint8 mode = adversarial.MODE_GAS_BURN();
            mode <= adversarial.MODE_OVERSIZED_RETURN();
            mode++
        ) {
            adversarial.setMode(mode);
            (bool matches, bytes32 recordHash, bytes32 componentsHash) =
                registry.verifyFinality(COLLECTION_ID);
            matches.assertFalse("diagnostic fails closed on component read bomb");
            recordHash.assertEq(fixture.expectedFinalityRecordHash, "record hash preserved");
            componentsHash.assertEq(fixture.componentsHash, "components hash preserved");
        }
    }

    function testSlowComponentReadPassesStrictAndPreviewButExceedsDiagnosticBudget() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        MockFinalityComponent slow = MockFinalityComponent(fixture.components[0].component);
        slow.setMode(slow.MODE_SLOW_SUCCESS());

        StreamFinalityPreview memory p = previewer.previewCollectionFinality(
            COLLECTION_ID, fixture.components, fixture.manifest
        );
        p.componentsMatchLive.assertTrue("preview does not impose diagnostic gas cap");

        _executeFixture(fixture);
        (bool matches,,) = registry.verifyFinality(COLLECTION_ID);
        matches.assertFalse("slow component exceeds diagnostic gas cap");

        slow.setMode(slow.MODE_NORMAL());
        (matches,,) = registry.verifyFinality(COLLECTION_ID);
        matches.assertTrue("normal component remains healthy");
    }

    function testScopedDiscoveryComponentAtFailuresFailClosedInDiagnosticsAndPreview() public {
        StreamFinalityScope memory scope =
            _idScope(StreamFinalityScopeType.SEASON, COLLECTION_ID, keccak256("season-1"));
        Fixture memory fixture = _buildFixture(scope, true);
        (bool countSuccess, bytes memory countReturndata) = address(discoveryMock)
            .staticcall(
                abi.encodeWithSelector(
                    IStreamArtworkScopedFinalityDiscovery.finalityComponentCountForScope.selector,
                    scope
                )
            );
        countSuccess.assertTrue("exact scoped count read succeeds");
        countReturndata.length.assertEq(32, "scoped count read is exactly one word");
        (bool hashSuccess, bytes memory hashReturndata) = address(discoveryMock)
            .staticcall(
                abi.encodeWithSelector(
                    IStreamArtworkScopedFinalityDiscovery.finalityDiscoveryHashForScope.selector,
                    scope
                )
            );
        hashSuccess.assertTrue("exact scoped hash read succeeds");
        hashReturndata.length.assertEq(32, "scoped hash read is exactly one word");
        (bool success, bytes memory returndata) = address(discoveryMock)
            .staticcall(
                abi.encodeWithSelector(
                    IStreamArtworkScopedFinalityDiscovery.finalityComponentAtForScope.selector,
                    scope,
                    uint256(0)
                )
            );
        success.assertTrue("exact scoped component read succeeds");
        returndata.length.assertEq(7 * 32, "scoped component read is exactly seven words");
        _executeFixture(fixture);

        for (uint8 readMode = 1; readMode <= 4; readMode++) {
            discoveryMock.setReadMode(readMode);
            _assertScopedDiscoveryDiagnosticFalse(fixture, "scoped count read fails closed");
        }
        discoveryMock.setReadMode(0);
        for (uint8 readMode = 1; readMode <= 4; readMode++) {
            discoveryMock.setHashReadMode(readMode);
            _assertScopedDiscoveryDiagnosticFalse(fixture, "scoped hash read fails closed");
        }
        discoveryMock.setHashReadMode(0);
        for (uint8 readMode = 1; readMode <= 4; readMode++) {
            discoveryMock.setComponentReadMode(readMode);
            _assertScopedDiscoveryDiagnosticFalse(fixture, "scoped component read fails closed");
        }
    }

    function testScopedDiscoveryReadFailuresRejectExecutionAndFailClosedInPreview() public {
        StreamFinalityScope memory scope =
            _idScope(StreamFinalityScopeType.SEASON, COLLECTION_ID, keccak256("season-1"));
        Fixture memory fixture = _buildFixture(scope, true);
        _scheduleAndOpen(fixture);

        for (uint8 readMode = 1; readMode <= 4; readMode++) {
            discoveryMock.setReadMode(readMode);
            _assertScopedDiscoveryExecutionUnreadable(fixture, false);
        }
        discoveryMock.setReadMode(0);
        for (uint8 readMode = 1; readMode <= 4; readMode++) {
            discoveryMock.setHashReadMode(readMode);
            _assertScopedDiscoveryExecutionUnreadable(fixture, false);
        }
        discoveryMock.setHashReadMode(0);
        for (uint8 readMode = 1; readMode <= 4; readMode++) {
            discoveryMock.setComponentReadMode(readMode);
            _assertScopedDiscoveryExecutionUnreadable(fixture, true);
        }

        discoveryMock.setComponentReadMode(0);
        _finalizeFixtureCall(fixture);
        registry.artworkScopeFinalityRecord(scope).finalized.assertTrue("scoped finalized");
    }

    function _assertScopedDiscoveryExecutionUnreadable(Fixture memory fixture, bool componentRead)
        private
    {
        StreamFinalityPreview memory p = _boundedPreview(fixture);
        p.discoveryMatches.assertFalse("scoped preview fails closed");

        if (componentRead) {
            _assertBoundedFinalizeRevert(
                fixture,
                abi.encodeWithSelector(
                    IStreamArtworkFinalityRegistry.FinalityDiscoveryComponentUnreadable.selector,
                    uint256(0)
                )
            );
        } else {
            _assertBoundedFinalizeRevert(
                fixture,
                abi.encodeWithSelector(
                    IStreamArtworkFinalityRegistry.FinalityDiscoveryFactsUnreadable.selector
                )
            );
        }
    }

    function _assertScopedDiscoveryDiagnosticFalse(Fixture memory fixture, string memory reason)
        private
        view
    {
        StreamFinalityPreview memory p = _boundedPreview(fixture);
        p.discoveryMatches.assertFalse(reason);
        (bool matches, bytes32 recordHash, bytes32 componentsHash) =
            registry.verifyArtworkScopeFinality(fixture.scope);
        matches.assertFalse(reason);
        recordHash.assertEq(
            fixture.expectedFinalityRecordHash, "scoped diagnostic preserves record hash"
        );
        componentsHash.assertEq(
            fixture.componentsHash, "scoped diagnostic preserves components hash"
        );
    }

    function _boundedPreview(Fixture memory fixture)
        private
        view
        returns (StreamFinalityPreview memory p)
    {
        bytes memory payload;
        if (fixture.scope.scopeType == StreamFinalityScopeType.COLLECTION) {
            payload = abi.encodeWithSelector(
                StreamArtworkFinalityPreview.previewCollectionFinality.selector,
                fixture.scope.collectionId,
                fixture.components,
                fixture.manifest
            );
        } else {
            payload = abi.encodeWithSelector(
                StreamArtworkFinalityPreview.previewArtworkScopeFinality.selector,
                fixture.scope,
                fixture.components,
                fixture.manifest
            );
        }
        (bool success, bytes memory returndata) =
            address(previewer).staticcall{ gas: ADVERSARIAL_CALL_GAS }(payload);
        success.assertTrue("bounded preview returns a complete result");
        p = abi.decode(returndata, (StreamFinalityPreview));
    }

    function _assertBoundedFinalizeRevert(Fixture memory fixture, bytes memory expectedRevert)
        private
    {
        bytes memory payload;
        if (fixture.scope.scopeType == StreamFinalityScopeType.COLLECTION) {
            payload = abi.encodeWithSelector(
                StreamArtworkFinalityRegistry.finalizeCollectionArtwork.selector,
                fixture.scope.collectionId,
                fixture.components,
                fixture.expectedFinalityRecordHash,
                fixture.manifest
            );
        } else {
            payload = abi.encodeWithSelector(
                StreamArtworkFinalityRegistry.finalizeArtworkScope.selector,
                fixture.scope,
                fixture.components,
                fixture.expectedFinalityRecordHash,
                fixture.manifest
            );
        }
        vm.prank(finalityAdmin);
        (bool success, bytes memory returndata) =
            address(registry).call{ gas: ADVERSARIAL_CALL_GAS }(payload);
        success.assertFalse("bounded strict execution rejects unreadable target");
        keccak256(returndata).assertEq(keccak256(expectedRevert), "exact typed execution error");
    }

    function testVerifyFinalityDetectsPostFinalizationDiscoveryDrift() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        uint256 total = fixture.components.length;
        discoveryMock.setCollectionDiscovery(COLLECTION_ID, total, fixture.componentsHash);
        _executeFixture(fixture);

        (bool healthy,,) = registry.verifyFinality(COLLECTION_ID);
        healthy.assertTrue("healthy discovered route");

        discoveryMock.setCollectionDiscovery(COLLECTION_ID, total + 1, fixture.componentsHash);
        _assertCollectionDiscoveryDiagnosticFalse(fixture, "post-finality count drift");

        discoveryMock.setCollectionDiscovery(
            COLLECTION_ID, total, keccak256("post-finality discovery drift")
        );
        _assertCollectionDiscoveryDiagnosticFalse(fixture, "post-finality hash drift");

        discoveryMock.setCollectionDiscovery(COLLECTION_ID, total, fixture.componentsHash);
        StreamFinalityComponentExpectation[] memory wrongRoute =
            _cloneComponents(fixture.components);
        wrongRoute[0].manifestHash = keccak256("post-finality enumerated route drift");
        discoveryMock.setCollectionComponent(COLLECTION_ID, 0, wrongRoute[0]);
        _assertCollectionDiscoveryDiagnosticFalse(fixture, "post-finality enumeration drift");
    }

    function testVerifyScopedFinalityDetectsPostFinalizationDiscoveryDrift() public {
        StreamFinalityScope memory scope =
            _idScope(StreamFinalityScopeType.SEASON, COLLECTION_ID, keccak256("season-1"));
        Fixture memory fixture = _buildFixture(scope, true);
        uint256 total = fixture.components.length;
        discoveryMock.setScopedDiscovery(scope, total, fixture.componentsHash);
        _executeFixture(fixture);

        (bool healthy,,) = registry.verifyArtworkScopeFinality(scope);
        healthy.assertTrue("healthy scoped discovered route");

        discoveryMock.setScopedDiscovery(
            scope, total, keccak256("post-finality scoped discovery drift")
        );
        (bool matches, bytes32 recordHash, bytes32 componentsHash) =
            registry.verifyArtworkScopeFinality(scope);
        matches.assertFalse("post-finality scoped discovery drift");
        recordHash.assertEq(fixture.expectedFinalityRecordHash, "scoped record hash preserved");
        componentsHash.assertEq(fixture.componentsHash, "scoped components hash preserved");

        discoveryMock.setScopedDiscovery(scope, total, fixture.componentsHash);
        StreamFinalityComponentExpectation[] memory wrongRoute =
            _cloneComponents(fixture.components);
        wrongRoute[0].codeHash = keccak256("scoped enumerated route drift");
        discoveryMock.setScopedComponent(scope, 0, wrongRoute[0]);
        (matches, recordHash, componentsHash) = registry.verifyArtworkScopeFinality(scope);
        matches.assertFalse("post-finality scoped enumeration drift");
        recordHash.assertEq(fixture.expectedFinalityRecordHash, "scoped record hash preserved");
        componentsHash.assertEq(fixture.componentsHash, "scoped components hash preserved");
    }

    function testVerifyFinalityDiscoveryFailuresDegradeWithoutReverting() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        discoveryMock.setCollectionDiscovery(
            COLLECTION_ID, fixture.components.length, fixture.componentsHash
        );
        _executeFixture(fixture);

        discoveryMock.setReadMode(1);
        _assertCollectionDiscoveryDiagnosticFalse(fixture, "reverting discovery");

        discoveryMock.setReadMode(2);
        _assertCollectionDiscoveryDiagnosticFalse(fixture, "malformed discovery");

        discoveryMock.setReadMode(3);
        _assertCollectionDiscoveryDiagnosticFalse(fixture, "oversized discovery");

        discoveryMock.setReadMode(4);
        _assertCollectionDiscoveryDiagnosticFalse(fixture, "gas-burning discovery");

        vm.etch(address(discoveryMock), bytes(""));
        _assertCollectionDiscoveryDiagnosticFalse(fixture, "codeless discovery");
    }

    function testVerifyFinalityGasBurningDiscoveryPreservesParentGas() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        discoveryMock.setCollectionDiscovery(
            COLLECTION_ID, fixture.components.length, fixture.componentsHash
        );
        _executeFixture(fixture);
        discoveryMock.setReadMode(4);

        bytes memory payload = abi.encodeWithSelector(
            StreamArtworkFinalityRegistry.verifyFinality.selector, COLLECTION_ID
        );
        (bool success, bytes memory returndata) =
            address(registry).staticcall{ gas: 75_000 }(payload);
        success.assertTrue("gas-burning discovery preserves parent frame");
        returndata.length.assertEq(96, "complete diagnostic return");

        (bool matches, bytes32 recordHash, bytes32 componentsHash) =
            abi.decode(returndata, (bool, bytes32, bytes32));
        matches.assertFalse("gas-burning discovery degrades false");
        recordHash.assertEq(fixture.expectedFinalityRecordHash, "record hash preserved");
        componentsHash.assertEq(fixture.componentsHash, "components hash preserved");
    }

    function _assertCollectionDiscoveryDiagnosticFalse(Fixture memory fixture, string memory reason)
        private
        view
    {
        StreamFinalityPreview memory p = _boundedPreview(fixture);
        p.discoveryMatches.assertFalse(reason);
        (bool matches, bytes32 recordHash, bytes32 componentsHash) =
            registry.verifyFinality(COLLECTION_ID);
        matches.assertFalse(reason);
        recordHash.assertEq(fixture.expectedFinalityRecordHash, "record hash preserved");
        componentsHash.assertEq(fixture.componentsHash, "components hash preserved");
        registry.finalityStillMatches(COLLECTION_ID).assertFalse(reason);
    }

    // ------------------------------------------------------------------
    // Diagnostics: never-revert semantics and range verification
    // ------------------------------------------------------------------

    function testVerifyFinalityDegradesWithoutReverting() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        _executeFixture(fixture);
        (bool matches,,) = registry.verifyFinality(COLLECTION_ID);
        matches.assertTrue("healthy route");

        // Unfinalized collections report (false, 0, 0).
        (bool unknownMatches, bytes32 unknownHash,) = registry.verifyFinality(COLLECTION_ID + 1);
        unknownMatches.assertFalse("unfinalized");
        unknownHash.assertEq(bytes32(0), "no record hash");

        // dataHash drift: still-matches flips false, stored hashes still returned.
        StreamFinalityComponentState memory drifted = _stateFor(fixture.components[1]);
        drifted.dataHash = keccak256("post-finality drift");
        MockFinalityComponent(fixture.components[1].component)
            .setCollectionState(COLLECTION_ID, drifted);
        (bool driftMatches, bytes32 recHash, bytes32 compHash) =
            registry.verifyFinality(COLLECTION_ID);
        driftMatches.assertFalse("drifted route");
        recHash.assertEq(fixture.expectedFinalityRecordHash, "record hash preserved");
        compHash.assertEq(fixture.componentsHash, "components hash preserved");
        registry.finalityStillMatches(COLLECTION_ID).assertFalse("still-matches degraded");
        MockFinalityComponent(fixture.components[1].component)
            .setCollectionState(COLLECTION_ID, _stateFor(fixture.components[1]));

        // A reverting component degrades to false, never reverts the diagnostic.
        MockFinalityComponent(fixture.components[0].component).setMode(1);
        (bool revertMatches,,) = registry.verifyFinality(COLLECTION_ID);
        revertMatches.assertFalse("reverting component");
        MockFinalityComponent(fixture.components[0].component).setMode(0);

        // Malformed (short) returndata degrades to false.
        MockFinalityComponent(fixture.components[0].component).setMode(2);
        (bool shortMatches,,) = registry.verifyFinality(COLLECTION_ID);
        shortMatches.assertFalse("short returndata");
        MockFinalityComponent(fixture.components[0].component).setMode(0);

        // A component exceeding the bounded per-read gas budget degrades to false.
        MockFinalityComponent(fixture.components[0].component).setMode(3);
        (bool gasMatches,,) = registry.verifyFinality(COLLECTION_ID);
        gasMatches.assertFalse("gas-exhausting component");
        MockFinalityComponent(fixture.components[0].component).setMode(0);

        // Replaced code (codehash change) degrades to false.
        vm.etch(fixture.components[0].component, hex"6001600101");
        (bool etchedMatches,,) = registry.verifyFinality(COLLECTION_ID);
        etchedMatches.assertFalse("code replaced");
    }

    function testVerifyFinalityRangePaginatesAndDetectsDrift() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        _executeFixture(fixture);

        (
            bool rangeMatches,
            bytes32 recHash,
            bytes32 expectedHash,
            bytes32 observedHash,
            uint256 nextStart
        ) = registry.verifyFinalityRange(COLLECTION_ID, 0, 2);
        rangeMatches.assertTrue("healthy range");
        recHash.assertEq(fixture.expectedFinalityRecordHash, "range record hash");
        expectedHash.assertEq(observedHash, "expected == observed while healthy");
        nextStart.assertEq(2, "next start");

        (,,,, uint256 tailNext) = registry.verifyFinalityRange(COLLECTION_ID, 2, 100);
        tailNext.assertEq(fixture.components.length, "tail clamps to count");

        // Drift one component: its range mismatches with divergent hashes, others stay clean.
        StreamFinalityComponentState memory drifted = _stateFor(fixture.components[2]);
        drifted.manifestHash = keccak256("drifted manifest");
        MockFinalityComponent(fixture.components[2].component)
            .setCollectionState(COLLECTION_ID, drifted);
        (bool cleanMatches,,,,) = registry.verifyFinalityRange(COLLECTION_ID, 0, 2);
        cleanMatches.assertTrue("untouched prefix still matches");
        (bool driftedMatches,, bytes32 expectedDrift, bytes32 observedDrift,) =
            registry.verifyFinalityRange(COLLECTION_ID, 2, 1);
        driftedMatches.assertFalse("drifted slice mismatches");
        (expectedDrift != observedDrift).assertTrue("hashes diverge");

        // Unfinalized scope: zeroed diagnostics.
        (bool noneMatches,, bytes32 noneExpected,, uint256 noneNext) =
            registry.verifyFinalityRange(COLLECTION_ID + 1, 0, 5);
        noneMatches.assertFalse("unfinalized range");
        noneExpected.assertEq(bytes32(0), "no expected hash");
        noneNext.assertEq(0, "no next start");
    }

    function testScopedDiagnosticsUseScopedReads() public {
        StreamFinalityScope memory scope = _tokenScope(COLLECTION_ID, 15);
        Fixture memory fixture = _buildFixture(scope, true);
        _executeFixture(fixture);

        (bool matches,,) = registry.verifyArtworkScopeFinality(scope);
        matches.assertTrue("scoped route healthy");

        // Drift the scoped state only: scoped diagnostics degrade.
        StreamFinalityComponentState memory drifted = _stateFor(fixture.components[1]);
        drifted.dataHash = keccak256("scoped drift");
        MockFinalityComponent(fixture.components[1].component).setScopedState(scope, drifted);
        (bool driftMatches, bytes32 recHash,) = registry.verifyArtworkScopeFinality(scope);
        driftMatches.assertFalse("scoped drift detected");
        recHash.assertEq(fixture.expectedFinalityRecordHash, "scoped record hash preserved");

        (bool rangeMatches,,,, uint256 nextStart) =
            registry.verifyArtworkScopeFinalityRange(scope, 0, 100);
        rangeMatches.assertFalse("scoped range mismatch");
        nextStart.assertEq(fixture.components.length, "scoped range clamp");
    }

    // ------------------------------------------------------------------
    // Calldata cap
    // ------------------------------------------------------------------

    function testCalldataCapBlocksOversizedSubmissions() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        _scheduleAndOpen(fixture);
        bytes memory hugeURI = new bytes(33_000);
        for (uint256 i = 0; i < hugeURI.length; i++) {
            hugeURI[i] = "a";
        }
        StreamFinalityManifestRef memory hugeManifest = _cloneManifest(fixture.manifest);
        hugeManifest.uri = string(hugeURI);
        hugeManifest.uriHash = keccak256(hugeURI);

        // Encode the exact calldata to assert the revert carries the precise observed size.
        bytes memory callData = abi.encodeWithSelector(
            registry.finalizeCollectionArtwork.selector,
            COLLECTION_ID,
            fixture.components,
            fixture.expectedFinalityRecordHash,
            hugeManifest
        );
        (callData.length > registry.MAX_FINALITY_CALLDATA_BYTES()).assertTrue("oversized calldata");

        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityCalldataTooLarge.selector,
                callData.length,
                registry.MAX_FINALITY_CALLDATA_BYTES()
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, hugeManifest
        );
    }

    // ------------------------------------------------------------------
    // Preview parity on remaining gates
    // ------------------------------------------------------------------

    function testPreviewParityAcrossGates() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);

        // Without staging: everything else green, staged flag red.
        StreamFinalityPreview memory p = previewer.previewCollectionFinality(
            COLLECTION_ID, fixture.components, fixture.manifest
        );
        p.stagedFreezeReady.assertFalse("not staged");
        p.coreGatesSatisfied.assertTrue("core gates");
        p.contentRootSatisfied.assertTrue("content root");
        p.manifestSatisfied.assertTrue("manifest");
        p.componentsWellFormed.assertTrue("well-formed");
        p.componentsMatchLive.assertTrue("live match");
        p.sanctionSatisfied.assertTrue("sanction");
        p.discoveryMatches.assertTrue("mandatory discovery matches");
        p.notAlreadyFinalized.assertTrue("not finalized");
        p.wouldExecute.assertFalse("blocked by staging only");

        // Break the sanction: flag flips, hashes still computed.
        sanctionMock.setRequiredComponentType(
            COLLECTION_ID, StreamFinalityDomains.COMPONENT_PLATFORM_WORKS_DECLARATION
        );
        p = previewer.previewCollectionFinality(COLLECTION_ID, fixture.components, fixture.manifest);
        p.sanctionSatisfied.assertFalse("sanction gate red");
        p.computedSanctionSubjectHash
            .assertEq(fixture.sanctionSubjectHash, "subject hash still exposed");
        sanctionMock.setRequiredComponentType(
            COLLECTION_ID, StreamFinalityDomains.COMPONENT_ARTIST_SANCTION
        );

        // Break a live component: flag flips without reverting the preview.
        MockFinalityComponent(fixture.components[0].component).setMode(1);
        p = previewer.previewCollectionFinality(COLLECTION_ID, fixture.components, fixture.manifest);
        p.componentsMatchLive.assertFalse("live gate red");
        MockFinalityComponent(fixture.components[0].component).setMode(0);

        // After execution: notAlreadyFinalized flips.
        _executeFixture(fixture);
        p = previewer.previewCollectionFinality(COLLECTION_ID, fixture.components, fixture.manifest);
        p.notAlreadyFinalized.assertFalse("already finalized");
        p.wouldExecute.assertFalse("cannot re-execute");
    }

    function testScopedPreviewMatchesScopedExecution() public {
        StreamFinalityScope memory scope =
            _idScope(StreamFinalityScopeType.SEASON, COLLECTION_ID, keccak256("season-1"));
        Fixture memory fixture = _buildFixture(scope, true);
        _scheduleAndOpen(fixture);
        StreamFinalityPreview memory p =
            previewer.previewArtworkScopeFinality(scope, fixture.components, fixture.manifest);
        p.wouldExecute.assertTrue("scoped preview executes");
        p.computedFinalityRecordHash
            .assertEq(fixture.expectedFinalityRecordHash, "scoped preview hash");
        p.computedSanctionSubjectHash.assertEq(fixture.sanctionSubjectHash, "scoped subject hash");
        _finalizeFixtureCall(fixture);
        registry.artworkScopeFinalityRecord(scope).finalized.assertTrue("executed after preview");
    }

    /// @notice Preview mirrors the [LTA-FREEZE] rule 4 live-guardian gate: clearing the veto
    ///         guardian after scheduling makes previewFinality.stagedFreezeReady and the real
    ///         finalize call reject together, so preview and execution never diverge on it.
    function testPreviewStagedFreezeMirrorsGuardianGate() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        _scheduleAndOpen(fixture);

        // Guardian live: the staged freeze previews ready and would execute.
        StreamFinalityPreview memory p = previewer.previewCollectionFinality(
            COLLECTION_ID, fixture.components, fixture.manifest
        );
        p.stagedFreezeReady.assertTrue("guardian live: staged ready");
        p.wouldExecute.assertTrue("guardian live: would execute");

        // Clear the veto guardian after scheduling; the scheduled action itself is untouched.
        authority.setDefaultGuardian(address(0));
        p = previewer.previewCollectionFinality(COLLECTION_ID, fixture.components, fixture.manifest);
        p.stagedFreezeReady.assertFalse("guardian cleared: staged not ready");
        p.wouldExecute.assertFalse("guardian cleared: would not execute");

        // Execution rejects on the same cleared-guardian gate: the preview matched reality.
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityFreezeGuardianUnset.selector,
                fixture.scopeKey
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // Restoring the guardian re-opens both preview and execution — the gate reads the live
        // guardian each call, never the action's scheduling-time snapshot.
        authority.setDefaultGuardian(guardian);
        p = previewer.previewCollectionFinality(COLLECTION_ID, fixture.components, fixture.manifest);
        p.stagedFreezeReady.assertTrue("guardian restored: staged ready");
        p.wouldExecute.assertTrue("guardian restored: would execute");
        _finalizeFixtureCall(fixture);
        registry.artworkScopeFinalityRecord(fixture.scope).finalized
            .assertTrue("executed after guardian restored");
    }
}
