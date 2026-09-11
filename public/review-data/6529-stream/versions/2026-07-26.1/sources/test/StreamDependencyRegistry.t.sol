// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/DependencyRegistry.sol";
import "../smart-contracts/StreamCore.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";
import "./helpers/TestHashingUtils.sol";

contract StreamDependencyRegistryTest is CharacterizationTestBase, StreamFixture, TestHashingUtils {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for string;
    using Assertions for uint256;

    bytes32 private constant DEPENDENCY_VERSION_CREATED_TOPIC =
        keccak256("DependencyVersionCreated(bytes32,uint256,bytes32,address)");
    bytes32 private constant DEPENDENCY_VERSION_DEPRECATED_TOPIC =
        keccak256("DependencyVersionDeprecated(bytes32,uint256,address)");
    bytes32 private constant DEPENDENCY_VERSION_PINNED_TOPIC =
        keccak256("DependencyVersionPinned(uint256,bytes32,uint256,bytes32,address)");

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant TOKEN_ID = 1;
    address private constant RECIPIENT = address(0xA11CE);

    function testDependencyVersionsAreImmutableAndExposeProvenance() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 dependencyKey = keccak256("versioned-library");
        string[] memory v1 = _chunks("alpha", "beta");
        string[] memory v2 = _chunks("gamma", "delta");
        bytes32 v1Hash = _contentHash(dependencyKey, v1);
        bytes32 v2Hash = _contentHash(dependencyKey, v2);

        vm.recordLogs();
        deployed.dependencyRegistry
            .addDependencyWithProvenance(dependencyKey, v1, "ipfs://deps/versioned-library-v1");
        _assertDependencyVersionCreatedLog(
            vm.getRecordedLogs(), address(deployed.dependencyRegistry), dependencyKey, 1, v1Hash
        );

        deployed.dependencyRegistry.latestDependencyVersion(dependencyKey)
            .assertEq(1, "latest version after v1");
        _assertDependencyRecord(
            deployed.dependencyRegistry,
            dependencyKey,
            1,
            2,
            v1Hash,
            "ipfs://deps/versioned-library-v1",
            false
        );

        vm.recordLogs();
        deployed.dependencyRegistry.addDependency(dependencyKey, v2);
        _assertDependencyVersionCreatedLog(
            vm.getRecordedLogs(), address(deployed.dependencyRegistry), dependencyKey, 2, v2Hash
        );

        deployed.dependencyRegistry.latestDependencyVersion(dependencyKey)
            .assertEq(2, "latest version after v2");
        deployed.dependencyRegistry.getDependencyScriptAtVersion(dependencyKey, 1, 0)
            .assertEq("alpha", "v1 chunk changed");
        deployed.dependencyRegistry.getDependencyScript(dependencyKey, 0)
            .assertEq("gamma", "latest chunk not updated");
        deployed.dependencyRegistry.getDependencyScriptContentHash(dependencyKey)
            .assertEq(v2Hash, "latest content hash");
        deployed.dependencyRegistry.getDependencyScriptContentHashAtVersion(dependencyKey, 1)
            .assertEq(v1Hash, "v1 content hash changed");

        vm.recordLogs();
        deployed.dependencyRegistry.deprecateDependencyVersion(dependencyKey, 1);
        _assertDependencyVersionDeprecatedLog(
            vm.getRecordedLogs(), address(deployed.dependencyRegistry), dependencyKey, 1
        );

        _assertDependencyRecord(
            deployed.dependencyRegistry,
            dependencyKey,
            1,
            2,
            v1Hash,
            "ipfs://deps/versioned-library-v1",
            true
        );
    }

    function testChunkIndexUpdateCreatesNewVersionWithoutMutatingPrevious() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 dependencyKey = keccak256("chunk-patch-library");
        string[] memory v1 = _chunks("prefix", "old");
        bytes32 v1Hash = _contentHash(dependencyKey, v1);

        deployed.dependencyRegistry
            .addDependencyWithProvenance(dependencyKey, v1, "ipfs://deps/chunk-patch-v1");
        deployed.dependencyRegistry.addDependencyScriptIndex(dependencyKey, 1, "new");

        deployed.dependencyRegistry.latestDependencyVersion(dependencyKey)
            .assertEq(2, "derived version");
        deployed.dependencyRegistry.getDependencyScriptAtVersion(dependencyKey, 1, 1)
            .assertEq("old", "v1 chunk mutated");
        deployed.dependencyRegistry.getDependencyScriptAtVersion(dependencyKey, 2, 1)
            .assertEq("new", "v2 chunk missing");
        deployed.dependencyRegistry.getDependencyScriptContentHashAtVersion(dependencyKey, 1)
            .assertEq(v1Hash, "v1 hash mutated");

        bytes32 v2Hash =
            deployed.dependencyRegistry.getDependencyScriptContentHashAtVersion(dependencyKey, 2);
        (v1Hash == v2Hash).assertFalse("derived hash unchanged");
        _assertDependencyRecord(
            deployed.dependencyRegistry,
            dependencyKey,
            2,
            2,
            v2Hash,
            "ipfs://deps/chunk-patch-v1",
            false
        );
    }

    function testChunkIndexUpdateRequiresExistingVersionAndValidIndex() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 dependencyKey = keccak256("missing-library");

        vm.expectRevert(
            abi.encodeWithSelector(
                DependencyRegistry.DependencyVersionMissing.selector, dependencyKey, uint256(0)
            )
        );
        deployed.dependencyRegistry.addDependencyScriptIndex(dependencyKey, 0, "missing");

        string[] memory v1 = _chunks("only", "");
        deployed.dependencyRegistry.addDependency(dependencyKey, v1);

        vm.expectRevert(
            abi.encodeWithSelector(
                DependencyRegistry.DependencyChunkIndexOutOfBounds.selector,
                dependencyKey,
                uint256(1),
                uint256(2)
            )
        );
        deployed.dependencyRegistry.addDependencyScriptIndex(dependencyKey, 2, "out-of-range");
    }

    function testZeroDependencyKeyIsReservedForRegistryWrites() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 zeroKey = bytes32(0);
        string[] memory v1 = _singleChunk("zero-key-version");
        bytes memory expectedRevert =
            abi.encodeWithSelector(DependencyRegistry.DependencyKeyReserved.selector, zeroKey);

        vm.expectRevert(expectedRevert);
        deployed.dependencyRegistry.addDependency(zeroKey, v1);

        vm.expectRevert(expectedRevert);
        deployed.dependencyRegistry.addDependencyWithProvenance(zeroKey, v1, "ipfs://zero-key");

        vm.expectRevert(expectedRevert);
        deployed.dependencyRegistry.addDependencyScriptIndex(zeroKey, 0, "new");

        vm.expectRevert(expectedRevert);
        deployed.dependencyRegistry.deprecateDependencyVersion(zeroKey, 1);

        deployed.dependencyRegistry.latestDependencyVersion(zeroKey)
            .assertEq(0, "zero-key latest version");
    }

    function testExplicitNoDependencyPinsEmptyVersion() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 emptyHash =
            deployed.dependencyRegistry.getDependencyScriptContentHashAtVersion(bytes32(0), 0);

        _assertCollectionDependencyState(deployed, bytes32(0), 0, emptyHash);
    }

    function testNoDependencyPinSkipsZeroKeyLatestLookup() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 emptyHash =
            deployed.dependencyRegistry.getDependencyScriptContentHashAtVersion(bytes32(0), 0);
        ZeroKeyLatestRevertingRegistry replacement = new ZeroKeyLatestRevertingRegistry(emptyHash);

        deployed.core.updateContracts(3, address(replacement));
        _pinCollectionDependency(deployed, bytes32(0));

        (bytes32 pinnedKey, uint256 pinnedVersion, bytes32 pinnedContentHash, address registry) =
            deployed.core.collectionDependencyVersionState(COLLECTION_ID);
        pinnedKey.assertEq(bytes32(0), "pinned zero key");
        pinnedVersion.assertEq(0, "pinned zero version");
        pinnedContentHash.assertEq(emptyHash, "pinned empty content hash");
        registry.assertEq(address(replacement), "pinned replacement registry");
    }

    function testDependencyRegistrySwapRejectsNonContracts() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        vm.expectRevert(
            abi.encodeWithSelector(StreamCore.InvalidDependencyRegistryContract.selector)
        );
        deployed.core.updateContracts(3, address(0));

        vm.expectRevert(
            abi.encodeWithSelector(StreamCore.InvalidDependencyRegistryContract.selector)
        );
        deployed.core.updateContracts(3, address(0x1234));
    }

    function testCollectionRejectsUnknownDependencyKey() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 unknownDependencyKey = keccak256("unknown-library");
        string[] memory scripts = _singleChunk("function draw(){}");

        vm.expectRevert(
            abi.encodeWithSelector(StreamCore.UnknownDependency.selector, unknownDependencyKey)
        );
        deployed.core
            .createCollection(
                "Unknown",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "ipfs://unknown/",
                "https://cdn.example/script.js",
                unknownDependencyKey,
                scripts
            );
    }

    function testCollectionPinsDependencyVersionUntilExplicitRepin() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 dependencyKey = keccak256("collection-pin-library");
        string[] memory v1 = _singleChunk("depV1");
        string[] memory v2 = _singleChunk("depV2");
        bytes32 v1Hash = _contentHash(dependencyKey, v1);
        bytes32 v2Hash = _contentHash(dependencyKey, v2);

        deployed.dependencyRegistry
            .addDependencyWithProvenance(dependencyKey, v1, "ipfs://deps/pin-v1");

        vm.recordLogs();
        _pinCollectionDependency(deployed, dependencyKey);
        _assertDependencyVersionPinnedLog(
            vm.getRecordedLogs(),
            address(deployed.core),
            dependencyKey,
            1,
            v1Hash,
            address(deployed.dependencyRegistry)
        );
        _assertCollectionDependencyState(deployed, dependencyKey, 1, v1Hash);

        _mintToken(deployed, TOKEN_ID, 7);
        string memory firstRenderedScript = deployed.core.retrieveGenerativeScript(TOKEN_ID);
        firstRenderedScript.assertEq(
            _expectedGenerativeScript(
                TOKEN_ID, keccak256(abi.encode(uint256(1), TOKEN_ID, uint256(7))), "depV1"
            ),
            "first rendered script"
        );

        deployed.dependencyRegistry.addDependency(dependencyKey, v2);
        deployed.dependencyRegistry.getDependencyScriptContentHash(dependencyKey)
            .assertEq(v2Hash, "latest registry hash");
        deployed.core.retrieveDependencyScriptContentHash(TOKEN_ID)
            .assertEq(v1Hash, "pinned token hash changed");
        deployed.core.retrieveGenerativeScript(TOKEN_ID)
            .assertEq(firstRenderedScript, "pinned rendered script changed");

        vm.recordLogs();
        _pinCollectionDependency(deployed, dependencyKey);
        _assertDependencyVersionPinnedLog(
            vm.getRecordedLogs(),
            address(deployed.core),
            dependencyKey,
            2,
            v2Hash,
            address(deployed.dependencyRegistry)
        );
        _assertCollectionDependencyState(deployed, dependencyKey, 2, v2Hash);
        deployed.core.retrieveDependencyScriptContentHash(TOKEN_ID)
            .assertEq(v2Hash, "repinned token hash");
        deployed.core.retrieveGenerativeScript(TOKEN_ID)
            .assertEq(
                _expectedGenerativeScript(
                    TOKEN_ID, keccak256(abi.encode(uint256(1), TOKEN_ID, uint256(7))), "depV2"
                ),
                "repinned rendered script"
            );
    }

    function testCollectionPinsDependencyRegistryAddressUntilExplicitRepin() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 dependencyKey = keccak256("registry-pinned-library");
        string[] memory originalChunks = _singleChunk("originalRegistryDep");
        string[] memory replacementChunks = _singleChunk("replacementRegistryDep");
        bytes32 originalHash = _contentHash(dependencyKey, originalChunks);
        bytes32 replacementHash = _contentHash(dependencyKey, replacementChunks);

        deployed.dependencyRegistry.addDependency(dependencyKey, originalChunks);
        _pinCollectionDependency(deployed, dependencyKey);
        _mintToken(deployed, TOKEN_ID, 7);
        bytes32 manifestBeforeRegistrySwap =
            deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID);

        DependencyRegistry replacementRegistry = new DependencyRegistry(address(deployed.admins));
        replacementRegistry.addDependency(dependencyKey, replacementChunks);
        deployed.core.updateContracts(3, address(replacementRegistry));

        _assertCollectionDependencyState(
            deployed, dependencyKey, 1, originalHash, address(deployed.dependencyRegistry)
        );
        deployed.core.retrieveDependencyScriptContentHash(TOKEN_ID)
            .assertEq(originalHash, "pinned token hash changed after registry swap");
        deployed.core.retrieveGenerativeScript(TOKEN_ID)
            .assertEq(
                _expectedGenerativeScript(
                    TOKEN_ID,
                    keccak256(abi.encode(uint256(1), TOKEN_ID, uint256(7))),
                    "originalRegistryDep"
                ),
                "rendered script used replacement registry before repin"
            );
        deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(manifestBeforeRegistrySwap, "manifest changed after registry swap");

        vm.recordLogs();
        _pinCollectionDependency(deployed, dependencyKey);
        _assertDependencyVersionPinnedLog(
            vm.getRecordedLogs(),
            address(deployed.core),
            dependencyKey,
            1,
            replacementHash,
            address(replacementRegistry)
        );
        _assertCollectionDependencyState(
            deployed, dependencyKey, 1, replacementHash, address(replacementRegistry)
        );
        deployed.core.retrieveDependencyScriptContentHash(TOKEN_ID)
            .assertEq(replacementHash, "repinned replacement hash");
        deployed.core.retrieveGenerativeScript(TOKEN_ID)
            .assertEq(
                _expectedGenerativeScript(
                    TOKEN_ID,
                    keccak256(abi.encode(uint256(1), TOKEN_ID, uint256(7))),
                    "replacementRegistryDep"
                ),
                "repinned rendered script"
            );
    }

    function testFrozenCollectionIgnoresLaterDependencyVersions() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 dependencyKey = keccak256("frozen-library");
        string[] memory v1 = _singleChunk("frozenV1");
        string[] memory v2 = _singleChunk("frozenV2");
        bytes32 v1Hash = _contentHash(dependencyKey, v1);

        deployed.dependencyRegistry
            .addDependencyWithProvenance(dependencyKey, v1, "ipfs://deps/frozen-v1");
        _pinCollectionDependency(deployed, dependencyKey);
        _mintToken(deployed, TOKEN_ID, 7);
        _warpPastFinalSupplyWindow();

        bytes32 expectedManifest = deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID);
        deployed.core.freezeCollection(COLLECTION_ID);
        deployed.core.collectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "stored freeze manifest");

        deployed.dependencyRegistry.addDependency(dependencyKey, v2);
        deployed.dependencyRegistry.latestDependencyVersion(dependencyKey)
            .assertEq(2, "latest version after freeze");
        deployed.core.retrieveDependencyScriptContentHash(TOKEN_ID)
            .assertEq(v1Hash, "frozen token dependency hash changed");
        deployed.core.retrieveGenerativeScript(TOKEN_ID)
            .assertEq(
                _expectedGenerativeScript(
                    TOKEN_ID, keccak256(abi.encode(uint256(1), TOKEN_ID, uint256(7))), "frozenV1"
                ),
                "frozen rendered script changed"
            );
        deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "freeze manifest changed after new registry version");
    }

    function _assertCollectionDependencyState(
        DeployedStream memory deployed,
        bytes32 dependencyKey,
        uint256 version,
        bytes32 contentHash
    ) private view {
        _assertCollectionDependencyState(
            deployed, dependencyKey, version, contentHash, address(deployed.dependencyRegistry)
        );
    }

    function _assertCollectionDependencyState(
        DeployedStream memory deployed,
        bytes32 dependencyKey,
        uint256 version,
        bytes32 contentHash,
        address expectedRegistry
    ) private view {
        (bytes32 pinnedKey, uint256 pinnedVersion, bytes32 pinnedContentHash, address registry) =
            deployed.core.collectionDependencyVersionState(COLLECTION_ID);
        pinnedKey.assertEq(dependencyKey, "pinned key");
        pinnedVersion.assertEq(version, "pinned version");
        pinnedContentHash.assertEq(contentHash, "pinned content hash");
        registry.assertEq(expectedRegistry, "pinned registry");
    }

    function _assertDependencyVersionCreatedLog(
        Vm.Log[] memory logs,
        address emitter,
        bytes32 dependencyKey,
        uint256 version,
        bytes32 contentHash
    ) private view {
        bool found = false;
        for (uint256 i; i < logs.length; i++) {
            if (logs[i].emitter != emitter || logs[i].topics[0] != DEPENDENCY_VERSION_CREATED_TOPIC)
            {
                continue;
            }
            logs[i].topics.length.assertEq(4, "created topic count");
            logs[i].topics[1].assertEq(dependencyKey, "created key topic");
            logs[i].topics[2].assertEq(bytes32(version), "created version topic");
            logs[i].topics[3].assertEq(contentHash, "created hash topic");
            address admin = abi.decode(logs[i].data, (address));
            admin.assertEq(address(this), "created admin");
            found = true;
            break;
        }
        found.assertTrue("missing created event");
    }

    function _assertDependencyVersionDeprecatedLog(
        Vm.Log[] memory logs,
        address emitter,
        bytes32 dependencyKey,
        uint256 version
    ) private view {
        bool found = false;
        for (uint256 i; i < logs.length; i++) {
            if (
                logs[i].emitter != emitter
                    || logs[i].topics[0] != DEPENDENCY_VERSION_DEPRECATED_TOPIC
            ) {
                continue;
            }
            logs[i].topics.length.assertEq(4, "deprecated topic count");
            logs[i].topics[1].assertEq(dependencyKey, "deprecated key topic");
            logs[i].topics[2].assertEq(bytes32(version), "deprecated version topic");
            logs[i].topics[3].assertEq(
                bytes32(uint256(uint160(address(this)))), "deprecated admin topic"
            );
            found = true;
            break;
        }
        found.assertTrue("missing deprecated event");
    }

    function _assertDependencyVersionPinnedLog(
        Vm.Log[] memory logs,
        address emitter,
        bytes32 dependencyKey,
        uint256 version,
        bytes32 contentHash,
        address expectedRegistry
    ) private pure {
        bool found = false;
        for (uint256 i; i < logs.length; i++) {
            if (logs[i].emitter != emitter || logs[i].topics[0] != DEPENDENCY_VERSION_PINNED_TOPIC)
            {
                continue;
            }
            logs[i].topics.length.assertEq(4, "pinned topic count");
            logs[i].topics[1].assertEq(bytes32(COLLECTION_ID), "pinned collection topic");
            logs[i].topics[2].assertEq(dependencyKey, "pinned key topic");
            logs[i].topics[3].assertEq(bytes32(version), "pinned version topic");
            (bytes32 pinnedContentHash, address registry) =
                abi.decode(logs[i].data, (bytes32, address));
            pinnedContentHash.assertEq(contentHash, "pinned content hash");
            registry.assertEq(expectedRegistry, "pinned registry");
            found = true;
            break;
        }
        found.assertTrue("missing pinned event");
    }

    function _assertDependencyRecord(
        DependencyRegistry registry,
        bytes32 dependencyKey,
        uint256 expectedVersion,
        uint256 expectedChunkCount,
        bytes32 expectedHash,
        string memory expectedProvenance,
        bool expectedDeprecated
    ) private view {
        registry.getDependencyScriptCountAtVersion(dependencyKey, expectedVersion)
            .assertEq(expectedChunkCount, "record chunk count");
        registry.getDependencyScriptContentHashAtVersion(dependencyKey, expectedVersion)
            .assertEq(expectedHash, "record content hash");
        registry.getDependencyVersionProvenance(dependencyKey, expectedVersion)
            .assertEq(expectedProvenance, "record provenance");
        registry.getDependencyVersionCreator(dependencyKey, expectedVersion)
            .assertEq(address(this), "record creator");
        registry.getDependencyVersionCreatedBlock(dependencyKey, expectedVersion)
            .assertEq(block.number, "record block");
        registry.getDependencyVersionCreatedTimestamp(dependencyKey, expectedVersion)
            .assertEq(block.timestamp, "record timestamp");
        (registry.isDependencyVersionDeprecated(dependencyKey, expectedVersion)
                == expectedDeprecated)
        .assertTrue("record deprecated");
    }

    function _mintToken(DeployedStream memory deployed, uint256 tokenId, uint256 salt) private {
        vm.prank(address(deployed.minter));
        deployed.core.mint(tokenId, RECIPIENT, "1,2,3", salt, COLLECTION_ID);
    }

    function _warpPastFinalSupplyWindow() private {
        vm.warp(block.timestamp + 31 days + 1);
    }

    function _singleChunk(string memory chunk) private pure returns (string[] memory) {
        string[] memory chunks = new string[](1);
        chunks[0] = chunk;
        return chunks;
    }

    function _chunks(string memory first, string memory second)
        private
        pure
        returns (string[] memory)
    {
        string[] memory chunks = new string[](2);
        chunks[0] = first;
        chunks[1] = second;
        return chunks;
    }
}

contract ZeroKeyLatestRevertingRegistry {
    bytes32 private immutable emptyContentHash;

    constructor(bytes32 _emptyContentHash) {
        emptyContentHash = _emptyContentHash;
    }

    function latestDependencyVersion(bytes32 dependencyNameAndVersion)
        external
        pure
        returns (uint256)
    {
        require(dependencyNameAndVersion != bytes32(0), "zero latest lookup");
        return 1;
    }

    function getDependencyScriptContentHashAtVersion(
        bytes32 dependencyNameAndVersion,
        uint256 version
    ) external view returns (bytes32) {
        require(dependencyNameAndVersion == bytes32(0), "unexpected dependency");
        require(version == 0, "unexpected version");
        return emptyContentHash;
    }
}
