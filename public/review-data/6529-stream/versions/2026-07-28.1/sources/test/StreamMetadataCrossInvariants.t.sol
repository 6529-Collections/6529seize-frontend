// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/DependencyRegistry.sol";
import "../smart-contracts/StreamCore.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";
import "./helpers/TestHashingUtils.sol";
import "./mocks/MockRandomizer.sol";

contract StreamMetadataCrossInvariantsTest is
    CharacterizationTestBase,
    StreamFixture,
    TestHashingUtils
{
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for string;
    using Assertions for uint256;

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant TOKEN_ID = 1;
    address private constant RECIPIENT = address(0xA11CE);

    function testFrozenDependencyPinSurvivesVersionDeprecationAndRegistryChurn() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 dependencyKey = keccak256("cross-invariant-library");
        string[] memory v1 = _singleChunk("crossInvariantV1");
        string[] memory v2 = _singleChunk("crossInvariantV2");
        bytes32 v1Hash = _contentHash(dependencyKey, v1);
        bytes32 v2Hash = _contentHash(dependencyKey, v2);

        deployed.dependencyRegistry
            .addDependencyWithProvenance(dependencyKey, v1, "ipfs://deps/cross-invariant-v1");
        _pinCollectionDependency(deployed, dependencyKey);
        _mintToken(deployed, TOKEN_ID, 7);

        bytes32 expectedTokenHash = keccak256(abi.encode(COLLECTION_ID, TOKEN_ID, uint256(7)));
        string memory frozenScript = deployed.core.retrieveGenerativeScript(TOKEN_ID);
        frozenScript.assertEq(
            _expectedGenerativeScript(TOKEN_ID, expectedTokenHash, "crossInvariantV1"),
            "initial script"
        );
        deployed.core.retrieveDependencyScriptContentHash(TOKEN_ID)
            .assertEq(v1Hash, "initial dependency hash");

        _warpPastFinalSupplyWindow();
        bytes32 expectedManifest = deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID);
        deployed.core.freezeCollection(COLLECTION_ID);

        deployed.dependencyRegistry.addDependency(dependencyKey, v2);
        deployed.dependencyRegistry.deprecateDependencyVersion(dependencyKey, 1);
        DependencyRegistry replacementRegistry = new DependencyRegistry(address(deployed.admins));
        replacementRegistry.addDependency(dependencyKey, _singleChunk("replacementDependency"));

        deployed.dependencyRegistry.latestDependencyVersion(dependencyKey)
            .assertEq(2, "latest dependency version");
        deployed.dependencyRegistry.isDependencyVersionDeprecated(dependencyKey, 1)
            .assertTrue("v1 not deprecated");
        deployed.dependencyRegistry.getDependencyScriptContentHashAtVersion(dependencyKey, 2)
            .assertEq(v2Hash, "v2 hash");

        vm.expectRevert(
            abi.encodeWithSelector(StreamCore.FrozenCollectionDependencyRegistry.selector)
        );
        deployed.core.updateContracts(3, address(replacementRegistry));

        vm.expectRevert(abi.encodeWithSelector(StreamCore.MetadataFrozen.selector, COLLECTION_ID));
        _pinCollectionDependency(deployed, dependencyKey);

        _assertFrozenDependencyState(deployed, dependencyKey, v1Hash);
        deployed.core.collectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "stored manifest changed");
        deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "preview manifest changed");
        deployed.core.retrieveGenerativeScript(TOKEN_ID)
            .assertEq(frozenScript, "frozen script changed");
        deployed.core.retrieveTokenHash(TOKEN_ID).assertEq(expectedTokenHash, "token hash changed");
    }

    function testFrozenLiveTokenRejectsLateRandomnessAndPreservesDependencyManifest() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 dependencyKey = keccak256("late-randomness-library");
        string[] memory chunks = _singleChunk("lateRandomnessV1");
        bytes32 dependencyHash = _contentHash(dependencyKey, chunks);

        deployed.dependencyRegistry.addDependency(dependencyKey, chunks);
        _pinCollectionDependency(deployed, dependencyKey);
        _mintToken(deployed, TOKEN_ID, 9);
        bytes32 expectedTokenHash = keccak256(abi.encode(COLLECTION_ID, TOKEN_ID, uint256(9)));
        string memory frozenScript = deployed.core.retrieveGenerativeScript(TOKEN_ID);

        _warpPastFinalSupplyWindow();
        bytes32 expectedManifest = deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID);
        deployed.core.freezeCollection(COLLECTION_ID);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.MetadataFrozen.selector, COLLECTION_ID));
        vm.prank(address(deployed.randomizer));
        deployed.core.setTokenHash(COLLECTION_ID, TOKEN_ID, keccak256("late live hash"));

        deployed.core.collectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "stored manifest changed");
        deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "preview manifest changed");
        deployed.core.retrieveTokenHash(TOKEN_ID).assertEq(expectedTokenHash, "token hash changed");
        deployed.core.retrieveDependencyScriptContentHash(TOKEN_ID)
            .assertEq(dependencyHash, "dependency hash changed");
        deployed.core.retrieveGenerativeScript(TOKEN_ID)
            .assertEq(frozenScript, "script changed after rejected callback");
        deployed.core.tokenMetadataState(TOKEN_ID).assertEq("final", "metadata state changed");
    }

    function testPostFreezeBurnedPendingCallbackCannotMoveFrozenLiveMetadata() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        NoopRandomizer noopRandomizer = new NoopRandomizer();
        deployed.core.addRandomizer(COLLECTION_ID, address(noopRandomizer));

        bytes32 dependencyKey = keccak256("burned-pending-library");
        string[] memory chunks = _singleChunk("burnedPendingV1");
        bytes32 dependencyHash = _contentHash(dependencyKey, chunks);
        deployed.dependencyRegistry.addDependency(dependencyKey, chunks);
        _pinCollectionDependency(deployed, dependencyKey);

        _mintToken(deployed, TOKEN_ID, 7);
        vm.prank(RECIPIENT);
        deployed.core.burn(TOKEN_ID);

        _warpPastFinalSupplyWindow();
        bytes32 expectedManifest = deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID);
        deployed.core.freezeCollection(COLLECTION_ID);

        bytes32 postBurnHash = keccak256("post-freeze burned token callback");
        vm.prank(address(noopRandomizer));
        deployed.core.setTokenHash(COLLECTION_ID, TOKEN_ID, postBurnHash);

        deployed.core.collectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "stored manifest changed");
        deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "preview manifest changed");
        deployed.core.totalSupplyOfCollection(COLLECTION_ID).assertEq(0, "live supply changed");
        deployed.core.retrieveTokenHash(TOKEN_ID)
            .assertEq(postBurnHash, "burned audit hash not stored");

        deployed.dependencyRegistry.addDependency(dependencyKey, _singleChunk("burnedPendingV2"));
        deployed.core.collectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "manifest changed after dependency v2");
        deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "preview changed after dependency v2");

        (bytes32 pinnedKey, uint256 pinnedVersion, bytes32 pinnedHash, address registry) =
            deployed.core.collectionDependencyVersionState(COLLECTION_ID);
        pinnedKey.assertEq(dependencyKey, "pinned key");
        pinnedVersion.assertEq(1, "pinned version");
        pinnedHash.assertEq(dependencyHash, "pinned hash");
        registry.assertEq(address(deployed.dependencyRegistry), "pinned registry");
    }

    function _mintToken(DeployedStream memory deployed, uint256 tokenId, uint256 salt) private {
        vm.prank(address(deployed.minter));
        deployed.core.mint(tokenId, RECIPIENT, "1,2,3", salt, COLLECTION_ID);
    }

    function _warpPastFinalSupplyWindow() private {
        vm.warp(block.timestamp + 31 days + 1);
    }

    function _singleChunk(string memory chunk) private pure returns (string[] memory chunks) {
        chunks = new string[](1);
        chunks[0] = chunk;
    }

    function _assertFrozenDependencyState(
        DeployedStream memory deployed,
        bytes32 dependencyKey,
        bytes32 dependencyHash
    ) private view {
        (bytes32 pinnedKey, uint256 pinnedVersion, bytes32 pinnedHash, address registry) =
            deployed.core.collectionDependencyVersionState(COLLECTION_ID);
        pinnedKey.assertEq(dependencyKey, "pinned key");
        pinnedVersion.assertEq(1, "pinned version");
        pinnedHash.assertEq(dependencyHash, "pinned hash");
        registry.assertEq(address(deployed.dependencyRegistry), "pinned registry");
        deployed.core.retrieveDependencyScriptContentHash(TOKEN_ID)
            .assertEq(dependencyHash, "token dependency hash");
    }
}
