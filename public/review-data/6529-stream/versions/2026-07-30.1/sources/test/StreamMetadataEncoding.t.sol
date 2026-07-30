// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";
import "./helpers/TestHashingUtils.sol";

contract StreamMetadataEncodingTest is CharacterizationTestBase, StreamFixture, TestHashingUtils {
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for string;

    function testDependencyScriptHashSeparatesAmbiguousChunkBoundaries() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 dependencyKey = keccak256("ambiguous-boundary-library");
        uint256 tokenId = 1;
        string[] memory firstChunks = new string[](2);
        firstChunks[0] = "ab";
        firstChunks[1] = "c";
        string[] memory secondChunks = new string[](2);
        secondChunks[0] = "a";
        secondChunks[1] = "bc";

        deployed.dependencyRegistry.addDependency(dependencyKey, firstChunks);
        _pinCollectionDependency(deployed, dependencyKey);

        vm.prank(address(deployed.minter));
        deployed.core.mint(tokenId, address(0xA11CE), "1,2,3", 7, 1);

        string memory firstRenderedScript = deployed.core.retrieveGenerativeScript(tokenId);
        bytes32 firstContentHash = deployed.core.retrieveDependencyScriptContentHash(tokenId);
        firstRenderedScript.assertEq(
            _expectedGenerativeScript(
                tokenId, keccak256(abi.encode(uint256(1), tokenId, uint256(7))), "abc"
            ),
            "first rendered script"
        );
        firstContentHash.assertEq(_contentHash(dependencyKey, firstChunks), "first content hash");

        deployed.dependencyRegistry.addDependency(dependencyKey, secondChunks);

        deployed.core.retrieveGenerativeScript(tokenId)
            .assertEq(firstRenderedScript, "rendered script compatibility changed");
        deployed.core.retrieveDependencyScriptContentHash(tokenId)
            .assertEq(firstContentHash, "pinned content hash changed");
        bytes32 secondContentHash =
            deployed.dependencyRegistry.getDependencyScriptContentHash(dependencyKey);
        secondContentHash.assertEq(_contentHash(dependencyKey, secondChunks), "second content hash");
        (firstContentHash == secondContentHash)
        .assertFalse("ambiguous dependency chunks shared hash");

        _pinCollectionDependency(deployed, dependencyKey);
        deployed.core.retrieveDependencyScriptContentHash(tokenId)
            .assertEq(secondContentHash, "repinned content hash");
    }

    function testDependencyChunkHashIncludesIndexAndLength() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 dependencyKey = keccak256("empty-chunks");
        string[] memory chunks = new string[](2);
        chunks[0] = "";
        chunks[1] = "";

        deployed.dependencyRegistry.addDependency(dependencyKey, chunks);

        bytes32 firstChunkHash =
            deployed.dependencyRegistry.getDependencyScriptChunkHash(dependencyKey, 0);
        bytes32 secondChunkHash =
            deployed.dependencyRegistry.getDependencyScriptChunkHash(dependencyKey, 1);
        firstChunkHash.assertEq(_chunkHash(0, chunks[0]), "first empty chunk hash");
        secondChunkHash.assertEq(_chunkHash(1, chunks[1]), "second empty chunk hash");
        (firstChunkHash == secondChunkHash).assertFalse("empty chunks shared hash");
    }

    function testEmptyDependencyContentHashIsDeterministic() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 dependencyKey = keccak256("zero-chunk-dependency");
        string[] memory chunks = new string[](0);

        deployed.dependencyRegistry.addDependency(dependencyKey, chunks);

        deployed.dependencyRegistry.getDependencyScriptContentHash(dependencyKey)
            .assertEq(_contentHash(dependencyKey, chunks), "zero chunk content hash");
    }
}
