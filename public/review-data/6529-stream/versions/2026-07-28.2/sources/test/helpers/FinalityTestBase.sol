// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../smart-contracts/StreamArtworkFinalityPreview.sol";
import "../../smart-contracts/StreamArtworkFinalityRegistry.sol";
import "../../smart-contracts/StreamArtworkFinalityTypes.sol";
import "../../smart-contracts/StreamCoreFinalityAdapter.sol";
import "./Assertions.sol";
import "./CharacterizationTestBase.sol";
import "./FinalityMocks.sol";

/// @notice Shared harness for the artwork finality registry tests: deploys the registry and
///         its consumer-seam mocks and builds spec-conformant happy-path fixtures per scope.
abstract contract FinalityTestBase is CharacterizationTestBase {
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;
    using Assertions for address;

    MockFinalityAuthority internal authority;
    MockFinalityCore internal coreMock;
    MockFinalityMetadata internal metadataMock;
    MockFinalitySanction internal sanctionMock;
    MockFinalityDiscovery internal discoveryMock;
    // One mock per mandatory component type ([LTA-FINALITY] req 1), plus the sanction/
    // declaration slot.
    MockFinalityComponent internal metadataComponent;
    MockFinalityComponent internal routerComponent;
    MockFinalityComponent internal rendererComponent;
    MockFinalityComponent internal renderContextComponent;
    MockFinalityComponent internal mediaComponent;
    MockFinalityComponent internal entropyComponent;
    MockFinalityComponent internal scriptComponent;
    MockFinalityComponent internal dependencyComponent;
    MockFinalityComponent internal referenceRenderComponent;
    MockFinalityComponent internal sanctionComponent;
    StreamCoreFinalityAdapter internal coreAdapter;
    StreamArtworkFinalityRegistry internal registry;
    StreamArtworkFinalityPreview internal previewer;

    address internal finalityAdmin = address(0xF14A11);
    address internal guardian = address(0x60A2D1);
    address internal outsider = address(0x00751D);

    uint256 internal constant COLLECTION_ID = 7;
    uint256 internal constant MINTED_SUPPLY = 10;
    uint256 internal constant BURNED_SUPPLY = 2;

    struct Fixture {
        StreamFinalityScope scope;
        StreamFinalityComponentExpectation[] components;
        StreamFinalityManifestRef manifest;
        bytes32 coreFactsHash;
        bytes32 componentsHash;
        bytes32 nonSanctionComponentsHash;
        bytes32 sanctionSubjectHash;
        bytes32 sanctionRecordHash;
        bytes32 expectedFinalityRecordHash;
        bytes32 scopeKey;
        uint8 metadataMode;
    }

    function setUp() public virtual {
        authority = new MockFinalityAuthority();
        coreMock = new MockFinalityCore();
        metadataMock = new MockFinalityMetadata();
        sanctionMock = new MockFinalitySanction();
        discoveryMock = new MockFinalityDiscovery();
        metadataComponent = new MockFinalityComponent();
        routerComponent = new MockFinalityComponent();
        rendererComponent = new MockFinalityComponent();
        renderContextComponent = new MockFinalityComponent();
        mediaComponent = new MockFinalityComponent();
        entropyComponent = new MockFinalityComponent();
        scriptComponent = new MockFinalityComponent();
        dependencyComponent = new MockFinalityComponent();
        referenceRenderComponent = new MockFinalityComponent();
        sanctionComponent = new MockFinalityComponent();
        coreAdapter = new StreamCoreFinalityAdapter(address(coreMock), address(metadataMock));
        registry = new StreamArtworkFinalityRegistry(
            address(coreMock),
            address(metadataMock),
            address(coreAdapter),
            address(sanctionMock),
            address(authority),
            address(discoveryMock)
        );
        previewer = new StreamArtworkFinalityPreview(registry);
        authority.setRole(StreamFinalityDomains.ROLE_COLLECTION_FINALITY_ADMIN, finalityAdmin, true);
        authority.setDefaultGuardian(guardian);
        vm.warp(1_750_000_000);
    }

    // ------------------------------------------------------------------
    // Scope builders
    // ------------------------------------------------------------------

    function _collectionScope(uint256 collectionId)
        internal
        pure
        returns (StreamFinalityScope memory)
    {
        return StreamFinalityScope({
            scopeType: StreamFinalityScopeType.COLLECTION,
            collectionId: collectionId,
            tokenId: 0,
            scopeId: bytes32(0)
        });
    }

    function _tokenScope(uint256 collectionId, uint256 tokenId)
        internal
        pure
        returns (StreamFinalityScope memory)
    {
        return StreamFinalityScope({
            scopeType: StreamFinalityScopeType.TOKEN,
            collectionId: collectionId,
            tokenId: tokenId,
            scopeId: bytes32(0)
        });
    }

    function _idScope(StreamFinalityScopeType scopeType, uint256 collectionId, bytes32 scopeId)
        internal
        pure
        returns (StreamFinalityScope memory)
    {
        return StreamFinalityScope({
            scopeType: scopeType, collectionId: collectionId, tokenId: 0, scopeId: scopeId
        });
    }

    function _scopeKeyOf(StreamFinalityScope memory scope) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(uint8(scope.scopeType), scope.collectionId, scope.tokenId, scope.scopeId)
        );
    }

    // ------------------------------------------------------------------
    // Fact builders
    // ------------------------------------------------------------------

    function _emptyConfigHash(uint256 collectionId) internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                StreamFinalityDomains.STREAM_CORE_COLLECTION_CONFIG_EMPTY_V1,
                block.chainid,
                address(coreMock),
                collectionId
            )
        );
    }

    function _closedCollectionFacts(uint256 collectionId)
        internal
        view
        returns (StreamCoreCollectionFinalityFacts memory)
    {
        return StreamCoreCollectionFinalityFacts({
            exists: true,
            hasMaxSupply: true,
            status: StreamFinalityDomains.CORE_COLLECTION_STATUS_CLOSED,
            supplyMode: 0,
            maxSupply: MINTED_SUPPLY,
            mintedSupply: MINTED_SUPPLY,
            burnedSupply: BURNED_SUPPLY,
            nextCollectionSerial: MINTED_SUPPLY + 1,
            collectionConfigHash: _emptyConfigHash(collectionId)
        });
    }

    // ------------------------------------------------------------------
    // Component builders
    // ------------------------------------------------------------------

    function _expectationFor(
        MockFinalityComponent component,
        bytes32 componentType,
        bytes32 dataHash
    ) internal view returns (StreamFinalityComponentExpectation memory) {
        return StreamFinalityComponentExpectation({
            componentType: componentType,
            component: address(component),
            interfaceId: bytes4(0x517EA000),
            codeHash: address(component).codehash,
            moduleVersion: bytes32(uint256(1)),
            manifestHash: keccak256(abi.encodePacked("module-manifest", componentType)),
            dataHash: dataHash
        });
    }

    function _stateFor(StreamFinalityComponentExpectation memory expectation)
        internal
        pure
        returns (StreamFinalityComponentState memory)
    {
        return StreamFinalityComponentState({
            frozen: true,
            componentType: expectation.componentType,
            component: expectation.component,
            interfaceId: expectation.interfaceId,
            codeHash: expectation.codeHash,
            moduleVersion: expectation.moduleVersion,
            manifestHash: expectation.manifestHash,
            dataHash: expectation.dataHash
        });
    }

    function _installComponentState(
        StreamFinalityScope memory scope,
        StreamFinalityComponentExpectation memory expectation
    ) internal {
        MockFinalityComponent component = MockFinalityComponent(expectation.component);
        if (scope.scopeType == StreamFinalityScopeType.COLLECTION) {
            component.setCollectionState(scope.collectionId, _stateFor(expectation));
        } else {
            component.setScopedState(scope, _stateFor(expectation));
        }
    }

    function _sortComponents(StreamFinalityComponentExpectation[] memory components)
        internal
        pure
        returns (StreamFinalityComponentExpectation[] memory)
    {
        uint256 count = components.length;
        for (uint256 i = 1; i < count; i++) {
            StreamFinalityComponentExpectation memory key = components[i];
            uint256 j = i;
            while (j > 0 && !_ascending(components[j - 1], key)) {
                components[j] = components[j - 1];
                j--;
            }
            components[j] = key;
        }
        return components;
    }

    function _ascending(
        StreamFinalityComponentExpectation memory previous,
        StreamFinalityComponentExpectation memory next
    ) internal pure returns (bool) {
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
        return previous.dataHash < next.dataHash;
    }

    // ------------------------------------------------------------------
    // Manifest builder
    // ------------------------------------------------------------------

    function _stagedManifest(string memory uri, bytes memory manifestBytes)
        internal
        returns (StreamFinalityManifestRef memory manifest)
    {
        manifest.uri = uri;
        manifest.uriHash = keccak256(bytes(uri));
        manifest.contentHash = registry.stageFinalityManifest(manifestBytes);
        manifest.schemaId = keccak256("6529STREAM_TEST_MANIFEST_SCHEMA_V1");
        manifest.canonicalizationHash = keccak256("RFC8785_JCS");
    }

    // ------------------------------------------------------------------
    // Full fixtures
    // ------------------------------------------------------------------

    /// @notice Builds a fully-passing fixture for any scope: Core facts, content root,
    ///         manifest bytes, live component states, verified artist sanction, and the
    ///         computed expected finality record hash.
    function _buildFixture(StreamFinalityScope memory scope, bool artistBound)
        internal
        returns (Fixture memory fixture)
    {
        return _buildFixture(scope, artistBound, StreamFinalityDomains.METADATA_MODE_OFFCHAIN);
    }

    /// @notice Full-set fixture builder honoring metadata mode (adds SCRIPT_SOURCE,
    ///         DEPENDENCY_SOURCE, REFERENCE_RENDER for ONCHAIN/HYBRID).
    function _buildFixture(StreamFinalityScope memory scope, bool artistBound, uint8 metadataMode)
        internal
        returns (Fixture memory fixture)
    {
        fixture.scope = scope;
        fixture.scopeKey = _scopeKeyOf(scope);
        fixture.metadataMode = metadataMode;

        _configureCoreAndContentRoot(fixture);
        metadataMock.setMetadataMode(scope.collectionId, metadataMode);
        // Script works require a recorded assembled-snapshot-manifest hash ([CMC-FINALITY-INPUTS]
        // rule 3); set one so mode variants finalize when they should.
        if (
            metadataMode == StreamFinalityDomains.METADATA_MODE_ONCHAIN
                || metadataMode == StreamFinalityDomains.METADATA_MODE_HYBRID
        ) {
            metadataMock.setSnapshotHash(
                scope.collectionId, keccak256(abi.encodePacked("snapshot", fixture.scopeKey))
            );
        }
        fixture.manifest = _stagedManifest(
            "ar://finality-manifest",
            abi.encodePacked("canonical finality manifest bytes for ", fixture.scopeKey)
        );

        bytes32 sanctionType = artistBound
            ? StreamFinalityDomains.COMPONENT_ARTIST_SANCTION
            : StreamFinalityDomains.COMPONENT_PLATFORM_WORKS_DECLARATION;
        sanctionMock.setRequiredComponentType(scope.collectionId, sanctionType);

        fixture.sanctionRecordHash =
            keccak256(abi.encodePacked("sanction-record", fixture.scopeKey));
        fixture.components = _assembleComponents(fixture, sanctionType);

        for (uint256 i = 0; i < fixture.components.length; i++) {
            _installComponentState(scope, fixture.components[i]);
        }

        fixture.componentsHash = registry.computeComponentsHash(fixture.components);
        _syncDiscovery(fixture);
        fixture.nonSanctionComponentsHash =
            registry.computeNonSanctionComponentsHash(fixture.components);
        fixture.sanctionSubjectHash = registry.computeSanctionSubjectHash(
            scope, fixture.coreFactsHash, fixture.nonSanctionComponentsHash, fixture.manifest
        );
        if (artistBound) {
            sanctionMock.setSanctionResponse(
                uint8(scope.scopeType),
                scope.collectionId,
                scope.tokenId,
                scope.scopeId,
                fixture.sanctionSubjectHash,
                true,
                fixture.sanctionRecordHash
            );
        }

        fixture.expectedFinalityRecordHash = registry.computeFinalityRecordHash(
            scope, fixture.coreFactsHash, fixture.componentsHash, fixture.manifest
        );
    }

    function _configureCoreAndContentRoot(Fixture memory fixture) private {
        StreamFinalityScope memory scope = fixture.scope;
        if (scope.scopeType == StreamFinalityScopeType.COLLECTION) {
            coreMock.setCollectionFacts(
                scope.collectionId, _closedCollectionFacts(scope.collectionId)
            );
            coreMock.setBurnsBlocked(scope.collectionId, true);
            coreMock.setCollectionFrozen(scope.collectionId, true);
            fixture.coreFactsHash = registry.computeCollectionCoreFactsHash(scope.collectionId);
        } else {
            coreMock.setCollectionExists(scope.collectionId, true);
            coreMock.setCollectionStatus(scope.collectionId, 0);
            coreMock.setCollectionSupply(scope.collectionId, false, 2, 0, 0, 0);
            if (scope.scopeType == StreamFinalityScopeType.TOKEN) {
                coreMock.setTokenIdentity(scope.tokenId, true, scope.collectionId, 3, false);
                coreMock.setTokenLifecycle(
                    scope.tokenId, StreamFinalityDomains.TOKEN_LIFECYCLE_MINTED
                );
            } else {
                metadataMock.setScopeManifest(
                    scope.collectionId,
                    scope.scopeId,
                    true,
                    keccak256(abi.encodePacked("scope-manifest", scope.scopeId))
                );
            }
            fixture.coreFactsHash = registry.computeScopedCoreFactsHash(scope);
        }
        uint64 leafCount = scope.scopeType == StreamFinalityScopeType.COLLECTION
            ? uint64(MINTED_SUPPLY)
            : scope.scopeType == StreamFinalityScopeType.TOKEN ? 1 : 4;
        metadataMock.setContentRoot(
            scope.collectionId,
            registry.contentRootScopeSubject(scope),
            keccak256(abi.encodePacked("content-root", fixture.scopeKey)),
            leafCount,
            keccak256("6529STREAM_TEST_CONTENT_ROOT_SCHEMA_V1")
        );
    }

    /// @notice Assembles the full mandatory component set for the fixture's mode, plus the
    ///         sanction/declaration slot.
    function _assembleComponents(Fixture memory fixture, bytes32 sanctionType)
        private
        view
        returns (StreamFinalityComponentExpectation[] memory)
    {
        bool scriptWork = fixture.metadataMode == StreamFinalityDomains.METADATA_MODE_ONCHAIN
            || fixture.metadataMode == StreamFinalityDomains.METADATA_MODE_HYBRID;
        uint256 count = 6 + 1 + (scriptWork ? 3 : 0);
        StreamFinalityComponentExpectation[] memory all =
            new StreamFinalityComponentExpectation[](count);
        uint256 c = 0;
        all[c++] = _mandatory(
            metadataComponent, StreamFinalityDomains.COMPONENT_COLLECTION_METADATA, fixture.scopeKey
        );
        all[c++] = _mandatory(
            routerComponent, StreamFinalityDomains.COMPONENT_METADATA_ROUTER, fixture.scopeKey
        );
        all[c++] = _mandatory(
            rendererComponent, StreamFinalityDomains.COMPONENT_RENDERER, fixture.scopeKey
        );
        all[c++] = _mandatory(
            renderContextComponent, StreamFinalityDomains.COMPONENT_RENDER_CONTEXT, fixture.scopeKey
        );
        all[c++] = _mandatory(
            mediaComponent, StreamFinalityDomains.COMPONENT_MEDIA_MANIFEST, fixture.scopeKey
        );
        all[c++] = _mandatory(
            entropyComponent, StreamFinalityDomains.COMPONENT_ENTROPY_COORDINATOR, fixture.scopeKey
        );
        if (scriptWork) {
            all[c++] = _mandatory(
                scriptComponent, StreamFinalityDomains.COMPONENT_SCRIPT_SOURCE, fixture.scopeKey
            );
            all[c++] = _mandatory(
                dependencyComponent,
                StreamFinalityDomains.COMPONENT_DEPENDENCY_SOURCE,
                fixture.scopeKey
            );
            all[c++] = _mandatory(
                referenceRenderComponent,
                StreamFinalityDomains.COMPONENT_REFERENCE_RENDER,
                fixture.scopeKey
            );
        }
        all[c++] = _expectationFor(sanctionComponent, sanctionType, fixture.sanctionRecordHash);
        return _sortComponents(all);
    }

    function _mandatory(MockFinalityComponent component, bytes32 componentType, bytes32 scopeKey)
        private
        view
        returns (StreamFinalityComponentExpectation memory)
    {
        return _expectationFor(
            component,
            componentType,
            keccak256(abi.encodePacked("datahash", componentType, scopeKey))
        );
    }

    function _syncDiscovery(Fixture memory fixture) internal {
        if (fixture.scope.scopeType == StreamFinalityScopeType.COLLECTION) {
            discoveryMock.setCollectionDiscovery(
                fixture.scope.collectionId, fixture.components.length, fixture.componentsHash
            );
            for (uint256 i = 0; i < fixture.components.length; i++) {
                discoveryMock.setCollectionComponent(
                    fixture.scope.collectionId, i, fixture.components[i]
                );
            }
        } else {
            discoveryMock.setScopedDiscovery(
                fixture.scope, fixture.components.length, fixture.componentsHash
            );
            for (uint256 i = 0; i < fixture.components.length; i++) {
                discoveryMock.setScopedComponent(fixture.scope, i, fixture.components[i]);
            }
        }
    }

    /// @notice Schedules the terminal freeze for a fixture and warps into the open window.
    function _scheduleAndOpen(Fixture memory fixture) internal {
        uint64 notBefore = uint64(block.timestamp) + registry.TERMINAL_FREEZE_VETO_FLOOR();
        uint64 expiresAfter = notBefore + registry.TERMINAL_FREEZE_EXECUTION_WINDOW_FLOOR();
        vm.prank(finalityAdmin);
        registry.scheduleArtworkTerminalFreeze(
            fixture.scope, fixture.expectedFinalityRecordHash, notBefore, expiresAfter
        );
        vm.warp(notBefore);
    }

    /// @notice Runs the full staged path and executes finality for the fixture.
    function _executeFixture(Fixture memory fixture) internal {
        _scheduleAndOpen(fixture);
        vm.prank(finalityAdmin);
        if (fixture.scope.scopeType == StreamFinalityScopeType.COLLECTION) {
            registry.finalizeCollectionArtwork(
                fixture.scope.collectionId,
                fixture.components,
                fixture.expectedFinalityRecordHash,
                fixture.manifest
            );
        } else {
            registry.finalizeArtworkScope(
                fixture.scope,
                fixture.components,
                fixture.expectedFinalityRecordHash,
                fixture.manifest
            );
        }
    }

    function _finalizeFixtureCall(Fixture memory fixture) internal {
        vm.prank(finalityAdmin);
        if (fixture.scope.scopeType == StreamFinalityScopeType.COLLECTION) {
            registry.finalizeCollectionArtwork(
                fixture.scope.collectionId,
                fixture.components,
                fixture.expectedFinalityRecordHash,
                fixture.manifest
            );
        } else {
            registry.finalizeArtworkScope(
                fixture.scope,
                fixture.components,
                fixture.expectedFinalityRecordHash,
                fixture.manifest
            );
        }
    }

    /// @notice Rebinds the staged hash and sanction response after fixture mutation.
    function _recomputeFixtureHashes(Fixture memory fixture, bool artistBound) internal {
        fixture.componentsHash = registry.computeComponentsHash(fixture.components);
        _syncDiscovery(fixture);
        fixture.nonSanctionComponentsHash =
            registry.computeNonSanctionComponentsHash(fixture.components);
        fixture.sanctionSubjectHash = registry.computeSanctionSubjectHash(
            fixture.scope,
            fixture.coreFactsHash,
            fixture.nonSanctionComponentsHash,
            fixture.manifest
        );
        if (artistBound) {
            sanctionMock.setSanctionResponse(
                uint8(fixture.scope.scopeType),
                fixture.scope.collectionId,
                fixture.scope.tokenId,
                fixture.scope.scopeId,
                fixture.sanctionSubjectHash,
                true,
                fixture.sanctionRecordHash
            );
        }
        fixture.expectedFinalityRecordHash = registry.computeFinalityRecordHash(
            fixture.scope, fixture.coreFactsHash, fixture.componentsHash, fixture.manifest
        );
    }
}
