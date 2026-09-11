// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/StreamArtworkFinalityRegistry.sol";
import "../smart-contracts/StreamArtworkFinalityTypes.sol";
import "../smart-contracts/StreamCoreFinalityAdapter.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/FinalityMocks.sol";

/// @notice Golden tests: every pinned finality domain constant is recomputed from its spec
///         preimage string and asserted against both the library constant and the literal
///         hash value mirrored in docs/launch-v1-target-architecture.md.
contract StreamFinalityDomainsGoldenTest is CharacterizationTestBase {
    using Assertions for bytes32;
    using Assertions for uint256;
    using Assertions for bool;

    function _golden(bytes32 constantValue, string memory preimage, bytes32 documentedValue)
        private
        pure
    {
        constantValue.assertEq(keccak256(bytes(preimage)), "preimage recomputation");
        constantValue.assertEq(documentedValue, "documented mirror value");
    }

    function testFinalityRecordDomains() public {
        _golden(
            StreamFinalityDomains.STREAM_FINALITY_V1,
            "6529STREAM_FINALITY_V1",
            0x569714204c899f0d33a0f98879ce85708169a5f1e11f763f2897f64e5d6c8493
        );
        _golden(
            StreamFinalityDomains.STREAM_FINALITY_COMPONENTS_V1,
            "6529STREAM_FINALITY_COMPONENTS_V1",
            0xf57efb77611ea13bd3a60968beee86ec330159736aa5d42707a9c0676dbc8898
        );
        _golden(
            StreamFinalityDomains.STREAM_CORE_COLLECTION_FACTS_V1,
            "6529STREAM_CORE_COLLECTION_FACTS_V1",
            0x387b66c3b8fdca5febff2a13faa7057fef7f711c4155493c8c8087e48b28c764
        );
        _golden(
            StreamFinalityDomains.STREAM_CORE_COLLECTION_CONFIG_EMPTY_V1,
            "6529STREAM_CORE_COLLECTION_CONFIG_EMPTY_V1",
            0x6adebabfe6f92286e8678fc5f206cacb6b1a3b912afc80b6039e9240567e7f26
        );
        _golden(
            StreamFinalityDomains.STREAM_FINALITY_RECOVERY_V1,
            "6529STREAM_FINALITY_RECOVERY_V1",
            0x521e8df5a00a793a5b47409e1e7711b4b8857ba9e6c833fe59a48dfa865b19ac
        );
        _golden(
            StreamFinalityDomains.STREAM_SCOPED_FINALITY_V1,
            "6529STREAM_SCOPED_FINALITY_V1",
            0x5b56313142e6381659f9d10163ccfa5ea22cb437617c8e69b37c31ecda6f3a50
        );
        _golden(
            StreamFinalityDomains.STREAM_SCOPED_CORE_FINALITY_FACTS_V1,
            "6529STREAM_SCOPED_CORE_FINALITY_FACTS_V1",
            0x5c6390c543248a4d63630061d67c3d2245df223d9ac586deccabf40620b43f6e
        );
        _golden(
            StreamFinalityDomains.STREAM_SCOPED_FINALITY_RECOVERY_V1,
            "6529STREAM_SCOPED_FINALITY_RECOVERY_V1",
            0x7111cd2afae740dbddcd349ab0b8b9269b6a81c331cef7ca8d542e87308bc54a
        );
    }

    function testSubjectAndSanctionDomains() public {
        _golden(
            StreamFinalityDomains.STREAM_SUBJECT_TOKEN_V1,
            "6529STREAM_SUBJECT_TOKEN_V1",
            0x1e576f27850d12bc1ec9255ca277dbecfbc84fb3a9a34c474640dfca89811d7e
        );
        _golden(
            StreamFinalityDomains.STREAM_SUBJECT_SCOPE_V1,
            "6529STREAM_SUBJECT_SCOPE_V1",
            0x748002ff892f4748f1544a8191da460ca6d167aa2e13eeced354e4f66f636394
        );
        _golden(
            StreamFinalityDomains.STREAM_SUBJECT_COLLECTION_V1,
            "6529STREAM_SUBJECT_COLLECTION_V1",
            0x3a882a22dad9915c9193738f63216234155080ed4c4fc9bfae446e90f1df6e16
        );
        _golden(
            StreamFinalityDomains.SANCTION_SUBJECT_DOMAIN,
            "6529STREAM_ARTIST_SANCTION_SUBJECT_V1",
            0x47c9894872096248b3971f1551b555619aea8b63903f526c2da354a7286bb473
        );
    }

    function testComponentTypeVocabulary() public {
        _golden(
            StreamFinalityDomains.COMPONENT_COLLECTION_METADATA,
            "COLLECTION_METADATA",
            0xd90b9e0160ba8e56a77078d6022d52bf0cd862ba5a5adfb6f792287e31399f90
        );
        _golden(
            StreamFinalityDomains.COMPONENT_METADATA_ROUTER,
            "METADATA_ROUTER",
            0x7024d3e2544fc48a261933c43d901dca0ee3fc26ea2b857748ab0c295a16f20a
        );
        _golden(
            StreamFinalityDomains.COMPONENT_RENDERER,
            "RENDERER",
            0x7df206a0c907b7474a3b59ec39322d07f5cc76c424145fa560ae864e2c8334b1
        );
        _golden(
            StreamFinalityDomains.COMPONENT_RENDER_CONTEXT,
            "RENDER_CONTEXT",
            0x9ec0296f9ec64a61db0ff3a5efd1294b47d2978c32c1aecb076f216525c6d1c5
        );
        _golden(
            StreamFinalityDomains.COMPONENT_SCRIPT_SOURCE,
            "SCRIPT_SOURCE",
            0x01bcbf3ae47218f940ddca3bf4e7d92baf29ddecea1c38e63350d55b4aa53d73
        );
        _golden(
            StreamFinalityDomains.COMPONENT_DEPENDENCY_SOURCE,
            "DEPENDENCY_SOURCE",
            0xa1e40ff39c7b676a717e91c20b2ab7b7f502965d6cc6bd8b37d7ce772f8c8586
        );
        _golden(
            StreamFinalityDomains.COMPONENT_MEDIA_MANIFEST,
            "MEDIA_MANIFEST",
            0xa094a8a85bb1f5c4c5c7fa7dad9d83cdba21c78ccef9ae708217cd64dbea7c9a
        );
        _golden(
            StreamFinalityDomains.COMPONENT_ENTROPY_COORDINATOR,
            "ENTROPY_COORDINATOR",
            0xb3b3ef20764c647bdeda70b21ab009ff2783106d6995be14389ec6f42ea6dfbb
        );
        _golden(
            StreamFinalityDomains.COMPONENT_ARTIST_SANCTION,
            "ARTIST_SANCTION",
            0x1e14b418e60392f62e7baf2e6edfcfb6dfeab92fb4428eff216b492ed5cef047
        );
        _golden(
            StreamFinalityDomains.COMPONENT_PLATFORM_WORKS_DECLARATION,
            "PLATFORM_WORKS_DECLARATION",
            0x9b732a2be945a9747de080e93cd0a83076acad44dca7585847960ffebdb0d29d
        );
        _golden(
            StreamFinalityDomains.COMPONENT_REFERENCE_RENDER,
            "REFERENCE_RENDER",
            0xa814b1b6f6e0b07c5330893efc29545d7b6c242616f50f8aaf7942305569a8ca
        );
        _golden(
            StreamFinalityDomains.COMPONENT_OPTIONAL_SNAPSHOT_ROUTE,
            "OPTIONAL_SNAPSHOT_ROUTE",
            0x31768727f16bb21bf296353a211441c524fc19d478fe73d886555c8a2150ae40
        );
    }

    function testRolesAndGovernedGasDomain() public {
        _golden(
            StreamFinalityDomains.ROLE_COLLECTION_FINALITY_ADMIN,
            "ROLE_COLLECTION_FINALITY_ADMIN",
            0x3ba602f38b556566e93e274f3c25565b5efa75d4084fb99bdf6ddc5adb423226
        );
        _golden(
            StreamFinalityDomains.ROLE_TERMINAL_FREEZE_VETO,
            "ROLE_TERMINAL_FREEZE_VETO",
            0x7c0cf05bbab982f1ecb8f528f1921326b0f24dfd9baf5beabba3ebbf59a6e61c
        );
        _golden(
            StreamFinalityDomains.GGP_FINALITY_COMPONENT_READ_GAS,
            "6529STREAM_GGP_FINALITY_COMPONENT_READ_GAS",
            0xbf54fb4ba4a0942771e26fe4b1f829f8324f6f98ef66e080fd6885b75bdf3221
        );
    }

    function testNumericVocabularyPins() public {
        uint256(uint8(StreamFinalityScopeType.COLLECTION)).assertEq(0, "COLLECTION = 0");
        uint256(uint8(StreamFinalityScopeType.TOKEN)).assertEq(1, "TOKEN = 1");
        uint256(uint8(StreamFinalityScopeType.RELEASE)).assertEq(2, "RELEASE = 2");
        uint256(uint8(StreamFinalityScopeType.SEASON)).assertEq(3, "SEASON = 3");
        uint256(uint8(StreamFinalityScopeType.VIEW)).assertEq(4, "VIEW = 4");

        uint256(uint8(StreamArtworkFreezeMode.NONE)).assertEq(0, "freeze NONE = 0");
        uint256(uint8(StreamArtworkFreezeMode.EXACT)).assertEq(1, "freeze EXACT = 1");
        uint256(uint8(StreamArtworkFreezeMode.INHERITED)).assertEq(2, "freeze INHERITED = 2");
        uint256(uint8(StreamArtworkFreezeMode.GLOBAL)).assertEq(3, "freeze GLOBAL = 3");

        uint256(StreamFinalityDomains.CORE_COLLECTION_STATUS_CLOSED).assertEq(2, "CLOSED = 2");
        uint256(StreamFinalityDomains.TOKEN_LIFECYCLE_MINTED).assertEq(2, "MINTED = 2");
        uint256(StreamFinalityDomains.TOKEN_LIFECYCLE_BURNED).assertEq(3, "BURNED = 3");
    }

    function testRegistryHostedParameterConstants() public {
        StreamArtworkFinalityRegistry registry = _deployRegistry();
        registry.MAX_FINALITY_COMPONENTS().assertEq(32, "MAX_FINALITY_COMPONENTS");
        registry.MAX_FINALITY_CALLDATA_BYTES().assertEq(32_768, "MAX_FINALITY_CALLDATA_BYTES");
        uint256(registry.TERMINAL_FREEZE_VETO_FLOOR()).assertEq(72 hours, "72h veto floor");
        uint256(registry.TERMINAL_FREEZE_EXECUTION_WINDOW_FLOOR())
            .assertEq(7 days, "7d open-to-execute floor");
        registry.FINALITY_COMPONENT_READ_GAS().assertEq(30_000, "genesis diagnostic gas");
        registry.GGP_FINALITY_COMPONENT_READ_GAS_KEY()
            .assertEq(StreamFinalityDomains.GGP_FINALITY_COMPONENT_READ_GAS, "GGP key mirror");
        registry.isStreamArtworkFinalityRegistry().assertTrue("marker");
        uint256(registry.FINALITY_EVENT_SCHEMA_VERSION()).assertEq(1, "event schemaVersion");
    }

    /// @notice The registry splits wide static-argument preimages into bytes.concat halves to
    ///         stay under legacy-codegen stack limits; this golden test recomputes each pinned
    ///         preimage as a single abi.encode and asserts hash equality.
    function testSplitPreimagesMatchSingleEncode() public {
        StreamArtworkFinalityRegistry registry = _deployRegistry();
        MockFinalityCore coreMock = MockFinalityCore(registry.core());
        bytes32 emptyConfigHash = keccak256(
            abi.encode(
                StreamFinalityDomains.STREAM_CORE_COLLECTION_CONFIG_EMPTY_V1,
                block.chainid,
                address(coreMock),
                uint256(9)
            )
        );

        // Collection facts hash binds the actual Core, not the aggregate adapter.
        StreamCoreCollectionFinalityFacts memory facts = StreamCoreCollectionFinalityFacts({
            exists: true,
            hasMaxSupply: true,
            status: 2,
            supplyMode: 1,
            maxSupply: 500,
            mintedSupply: 400,
            burnedSupply: 25,
            nextCollectionSerial: 401,
            collectionConfigHash: emptyConfigHash
        });
        coreMock.setCollectionFacts(9, facts);
        bytes32 expectedFactsHash = keccak256(
            abi.encode(
                StreamFinalityDomains.STREAM_CORE_COLLECTION_FACTS_V1,
                block.chainid,
                address(coreMock),
                uint256(9),
                facts.exists,
                facts.hasMaxSupply,
                facts.status,
                facts.supplyMode,
                facts.maxSupply,
                facts.mintedSupply,
                facts.burnedSupply,
                facts.nextCollectionSerial,
                facts.collectionConfigHash
            )
        );
        registry.computeCollectionCoreFactsHash(9)
            .assertEq(expectedFactsHash, "collection facts hash split == single encode");
        bytes32 adapterAddressFactsHash = keccak256(
            abi.encode(
                StreamFinalityDomains.STREAM_CORE_COLLECTION_FACTS_V1,
                block.chainid,
                address(registry.coreFinalityAdapter()),
                uint256(9),
                facts.exists,
                facts.hasMaxSupply,
                facts.status,
                facts.supplyMode,
                facts.maxSupply,
                facts.mintedSupply,
                facts.burnedSupply,
                facts.nextCollectionSerial,
                facts.collectionConfigHash
            )
        );
        (registry.computeCollectionCoreFactsHash(9) != adapterAddressFactsHash)
        .assertTrue("facts hash must not bind adapter address");

        // Scoped facts hash.
        StreamFinalityScope memory scope = StreamFinalityScope({
            scopeType: StreamFinalityScopeType.RELEASE,
            collectionId: 9,
            tokenId: 0,
            scopeId: keccak256("release-1")
        });
        StreamScopedCoreFinalityFacts memory scopedFacts = StreamScopedCoreFinalityFacts({
            scopeExists: true,
            scopeType: uint8(scope.scopeType),
            collectionId: scope.collectionId,
            tokenId: scope.tokenId,
            scopeId: scope.scopeId,
            tokenMappingExists: false,
            collectionSerial: 0,
            tokenLifecycle: 0,
            burned: false,
            collectionStatus: 0,
            collectionSupplyMode: 2,
            collectionConfigHash: emptyConfigHash,
            scopeManifestHash: keccak256("scope-manifest")
        });
        coreMock.setCollectionStatus(scope.collectionId, scopedFacts.collectionStatus);
        coreMock.setCollectionSupply(
            scope.collectionId, true, scopedFacts.collectionSupplyMode, 500, 400, 401
        );
        MockFinalityMetadata(address(registry.metadataReads()))
            .setScopeManifest(
                scope.collectionId, scope.scopeId, true, scopedFacts.scopeManifestHash
            );
        // A 16-argument abi.encode cannot compile under legacy codegen (the reason the
        // registry splits it), so the cross-check builds the encoding definitionally: one
        // left-aligned-nothing, right-padded-nothing 32-byte word per static argument, in
        // spec order, per the ABI head encoding of static types.
        bytes memory encodedHead = bytes.concat(
            StreamFinalityDomains.STREAM_SCOPED_CORE_FINALITY_FACTS_V1,
            bytes32(block.chainid),
            bytes32(uint256(uint160(address(coreMock)))),
            bytes32(uint256(uint8(scope.scopeType))),
            bytes32(scope.collectionId),
            bytes32(scope.tokenId),
            scope.scopeId,
            bytes32(uint256(scopedFacts.scopeExists ? 1 : 0))
        );
        bytes memory encodedTail = bytes.concat(
            bytes32(uint256(scopedFacts.tokenMappingExists ? 1 : 0)),
            bytes32(scopedFacts.collectionSerial),
            bytes32(uint256(scopedFacts.tokenLifecycle)),
            bytes32(uint256(scopedFacts.burned ? 1 : 0)),
            bytes32(uint256(scopedFacts.collectionStatus)),
            bytes32(uint256(scopedFacts.collectionSupplyMode)),
            scopedFacts.collectionConfigHash,
            scopedFacts.scopeManifestHash
        );
        (encodedHead.length + encodedTail.length).assertEq(16 * 32, "16 words");
        registry.computeScopedCoreFactsHash(scope)
            .assertEq(
                keccak256(bytes.concat(encodedHead, encodedTail)),
                "scoped facts hash == definitional word encoding"
            );

        _assertRecordAndSubjectPreimages(
            registry, scope, registry.computeScopedCoreFactsHash(scope)
        );
    }

    function _assertRecordAndSubjectPreimages(
        StreamArtworkFinalityRegistry registry,
        StreamFinalityScope memory scope,
        bytes32 coreFactsHash
    ) private {
        StreamFinalityManifestRef memory manifest =
            StreamFinalityManifestRef({
                uri: "ar://manifest",
                uriHash: keccak256("ar://manifest"),
                contentHash: keccak256("content"),
                schemaId: keccak256("schema"),
                canonicalizationHash: keccak256("jcs")
            });
        bytes32 componentsHash = keccak256("components");

        bytes32 expectedScoped = keccak256(
            bytes.concat(
                bytes.concat(
                    StreamFinalityDomains.STREAM_SCOPED_FINALITY_V1,
                    bytes32(block.chainid),
                    bytes32(uint256(uint160(registry.core()))),
                    bytes32(uint256(uint8(scope.scopeType))),
                    bytes32(scope.collectionId),
                    bytes32(scope.tokenId),
                    scope.scopeId
                ),
                bytes.concat(
                    coreFactsHash,
                    componentsHash,
                    manifest.uriHash,
                    manifest.contentHash,
                    manifest.schemaId,
                    manifest.canonicalizationHash
                )
            )
        );
        registry.computeFinalityRecordHash(scope, coreFactsHash, componentsHash, manifest)
            .assertEq(expectedScoped, "scoped record hash == definitional word encoding");

        StreamFinalityScope memory collectionScope = StreamFinalityScope({
            scopeType: StreamFinalityScopeType.COLLECTION,
            collectionId: scope.collectionId,
            tokenId: 0,
            scopeId: bytes32(0)
        });
        bytes32 expectedCollection = keccak256(
            abi.encode(
                StreamFinalityDomains.STREAM_FINALITY_V1,
                block.chainid,
                registry.core(),
                collectionScope.collectionId,
                coreFactsHash,
                componentsHash,
                manifest.uriHash,
                manifest.contentHash,
                manifest.schemaId,
                manifest.canonicalizationHash
            )
        );
        registry.computeFinalityRecordHash(collectionScope, coreFactsHash, componentsHash, manifest)
            .assertEq(expectedCollection, "collection record hash split == single encode");

        bytes32 expectedSubject = keccak256(
            bytes.concat(
                bytes.concat(
                    StreamFinalityDomains.SANCTION_SUBJECT_DOMAIN,
                    bytes32(block.chainid),
                    bytes32(uint256(uint160(registry.core()))),
                    bytes32(uint256(uint160(address(registry)))),
                    bytes32(uint256(uint8(scope.scopeType))),
                    bytes32(scope.collectionId),
                    bytes32(scope.tokenId)
                ),
                bytes.concat(
                    scope.scopeId,
                    coreFactsHash,
                    keccak256("non-sanction"),
                    manifest.uriHash,
                    manifest.contentHash,
                    manifest.schemaId,
                    manifest.canonicalizationHash
                )
            )
        );
        registry.computeSanctionSubjectHash(
                scope, coreFactsHash, keccak256("non-sanction"), manifest
            ).assertEq(expectedSubject, "sanction subject hash == definitional word encoding");
    }

    function testContentRootSubjectDerivations() public {
        StreamArtworkFinalityRegistry registry = _deployRegistry();
        address core = registry.core();

        StreamFinalityScope memory collectionScope =
            StreamFinalityScope(StreamFinalityScopeType.COLLECTION, 7, 0, bytes32(0));
        registry.contentRootScopeSubject(collectionScope)
            .assertEq(
                keccak256(
                    abi.encode(
                        StreamFinalityDomains.STREAM_SUBJECT_COLLECTION_V1,
                        block.chainid,
                        core,
                        uint256(7)
                    )
                ),
                "collection subject"
            );

        StreamFinalityScope memory tokenScope =
            StreamFinalityScope(StreamFinalityScopeType.TOKEN, 7, 4321, bytes32(0));
        registry.contentRootScopeSubject(tokenScope)
            .assertEq(
                keccak256(
                    abi.encode(
                        StreamFinalityDomains.STREAM_SUBJECT_TOKEN_V1,
                        block.chainid,
                        core,
                        uint256(4321)
                    )
                ),
                "token subject"
            );

        StreamFinalityScope memory seasonScope =
            StreamFinalityScope(StreamFinalityScopeType.SEASON, 7, 0, keccak256("season-2"));
        registry.contentRootScopeSubject(seasonScope)
            .assertEq(
                keccak256(
                    abi.encode(
                        StreamFinalityDomains.STREAM_SUBJECT_SCOPE_V1,
                        block.chainid,
                        core,
                        uint256(7),
                        uint8(StreamFinalityScopeType.SEASON),
                        keccak256("season-2")
                    )
                ),
                "season scope subject"
            );
    }

    function _deployRegistry() private returns (StreamArtworkFinalityRegistry) {
        MockFinalityAuthority authority = new MockFinalityAuthority();
        MockFinalityCore coreMock = new MockFinalityCore();
        MockFinalityMetadata metadataMock = new MockFinalityMetadata();
        MockFinalitySanction sanctionMock = new MockFinalitySanction();
        MockFinalityDiscovery discoveryMock = new MockFinalityDiscovery();
        StreamCoreFinalityAdapter coreAdapter =
            new StreamCoreFinalityAdapter(address(coreMock), address(metadataMock));
        return new StreamArtworkFinalityRegistry(
            address(coreMock),
            address(metadataMock),
            address(coreAdapter),
            address(sanctionMock),
            address(authority),
            address(discoveryMock)
        );
    }
}
