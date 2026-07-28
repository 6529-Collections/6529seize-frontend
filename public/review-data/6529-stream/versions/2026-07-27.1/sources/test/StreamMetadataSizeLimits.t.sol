// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/DependencyRegistry.sol";
import "../smart-contracts/StreamCore.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";

contract StreamMetadataSizeLimitsTest is CharacterizationTestBase, StreamFixture {
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant TOKEN_ID = 1;
    address private constant RECIPIENT = address(0xA11CE);

    function testMetadataSizeLimitsAcceptBoundaryStorageInputs() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        uint256 maxTokenData = deployed.core.MAX_TOKEN_DATA_BYTES();
        uint256 maxImage = deployed.core.MAX_TOKEN_IMAGE_BYTES();
        uint256 maxAttributes = deployed.core.MAX_TOKEN_ATTRIBUTES_BYTES();
        uint256 maxChunk = deployed.core.MAX_COLLECTION_SCRIPT_CHUNK_BYTES();

        string[] memory script = new string[](1);
        script[0] = _repeat("s", maxChunk);
        deployed.core
            .updateCollectionInfo(
                COLLECTION_ID,
                "Genesis",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "ipfs://base/",
                "https://cdn.example/script.js",
                bytes32(0),
                FULL_COLLECTION_UPDATE_INDEX,
                script
            );

        vm.prank(address(deployed.minter));
        deployed.core.mint(TOKEN_ID, RECIPIENT, _repeat("d", maxTokenData), 7, COLLECTION_ID);

        uint256[] memory tokenIds = new uint256[](1);
        string[] memory images = new string[](1);
        string[] memory attributes = new string[](1);
        tokenIds[0] = TOKEN_ID;
        images[0] = _ipfsUriWithSize(maxImage);
        bytes(images[0]).length.assertEq(maxImage, "image fixture length");
        attributes[0] = _attributeWithValueSize(maxAttributes);
        bytes(attributes[0]).length.assertEq(maxAttributes, "attribute fixture length");

        deployed.core.updateImagesAndAttributes(tokenIds, images, attributes);
    }

    function testCollectionMetadataLimitsRejectOversizedInputs() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        uint256 maxText = deployed.core.MAX_COLLECTION_TEXT_BYTES();
        uint256 maxChunk = deployed.core.MAX_COLLECTION_SCRIPT_CHUNK_BYTES();
        uint256 maxChunks = deployed.core.MAX_COLLECTION_SCRIPT_CHUNKS();

        string[] memory script = _singleChunk("function draw(){}");
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.MetadataFieldTooLarge.selector,
                bytes32("collection.name"),
                maxText + 1,
                maxText
            )
        );
        deployed.core
            .createCollection(
                _repeat("n", maxText + 1),
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "ipfs://base/",
                "https://cdn.example/script.js",
                bytes32(0),
                script
            );

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.MetadataFieldTooLarge.selector,
                bytes32("collection.description"),
                maxText + 1,
                maxText
            )
        );
        deployed.core
            .updateCollectionInfo(
                COLLECTION_ID,
                "Genesis",
                "6529",
                _repeat("d", maxText + 1),
                "https://6529.io",
                "CC0",
                "ipfs://base/",
                "https://cdn.example/script.js",
                bytes32(0),
                FULL_COLLECTION_UPDATE_INDEX,
                script
            );

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.MetadataFieldTooLarge.selector,
                bytes32("collection.script"),
                maxChunk + 1,
                maxChunk
            )
        );
        deployed.core
            .updateCollectionInfo(
                COLLECTION_ID,
                "Genesis",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "ipfs://base/",
                "https://cdn.example/script.js",
                bytes32(0),
                FULL_COLLECTION_UPDATE_INDEX,
                _singleChunk(_repeat("s", maxChunk + 1))
            );

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.MetadataFieldTooLarge.selector,
                bytes32("collection.scriptCount"),
                maxChunks + 1,
                maxChunks
            )
        );
        deployed.core
            .updateCollectionInfo(
                COLLECTION_ID,
                "Genesis",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "ipfs://base/",
                "https://cdn.example/script.js",
                bytes32(0),
                FULL_COLLECTION_UPDATE_INDEX,
                _chunkArray(maxChunks + 1, "")
            );
    }

    function testTokenMetadataLimitsRejectOversizedInputs() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        uint256 maxTokenData = deployed.core.MAX_TOKEN_DATA_BYTES();
        uint256 maxImage = deployed.core.MAX_TOKEN_IMAGE_BYTES();
        uint256 maxAttributes = deployed.core.MAX_TOKEN_ATTRIBUTES_BYTES();

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.MetadataFieldTooLarge.selector,
                bytes32("token.data"),
                maxTokenData + 1,
                maxTokenData
            )
        );
        vm.prank(address(deployed.minter));
        deployed.core.mint(TOKEN_ID, RECIPIENT, _repeat("d", maxTokenData + 1), 7, COLLECTION_ID);

        vm.prank(address(deployed.minter));
        deployed.core.mint(TOKEN_ID, RECIPIENT, "1,2,3", 7, COLLECTION_ID);

        uint256[] memory tokenIds = new uint256[](1);
        string[] memory images = new string[](1);
        string[] memory attributes = new string[](1);
        tokenIds[0] = TOKEN_ID;
        images[0] = _repeat("i", maxImage + 1);
        attributes[0] = "";

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.MetadataFieldTooLarge.selector,
                bytes32("token.image"),
                maxImage + 1,
                maxImage
            )
        );
        deployed.core.updateImagesAndAttributes(tokenIds, images, attributes);

        images[0] = "ipfs://image.png";
        attributes[0] = _attributeWithValueSize(maxAttributes + 1);
        bytes(attributes[0]).length.assertEq(maxAttributes + 1, "oversized attributes fixture");

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.MetadataFieldTooLarge.selector,
                bytes32("token.attributes"),
                maxAttributes + 1,
                maxAttributes
            )
        );
        deployed.core.updateImagesAndAttributes(tokenIds, images, attributes);
    }

    function testGeneratedMetadataLimitsRejectOversizedOutput() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        uint256 maxTokenUri = deployed.core.MAX_GENERATED_TOKEN_URI_BYTES();
        uint256 chunkSize = deployed.core.MAX_COLLECTION_SCRIPT_CHUNK_BYTES();

        deployed.core
            .updateCollectionInfo(
                COLLECTION_ID,
                "Genesis",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "ipfs://base/",
                "https://cdn.example/script.js",
                bytes32(0),
                FULL_COLLECTION_UPDATE_INDEX,
                _chunkArray(5, _repeat("t", chunkSize))
            );
        vm.prank(address(deployed.minter));
        deployed.core.mint(TOKEN_ID, RECIPIENT, "1,2,3", 7, COLLECTION_ID);
        deployed.core.changeMetadataView(COLLECTION_ID, true);

        try deployed.core.tokenURI(TOKEN_ID) returns (string memory) {
            revert("expected oversized tokenURI");
        } catch (bytes memory reason) {
            _assertMetadataLimitRevert(reason, bytes32("tokenURI"), maxTokenUri);
        }
    }

    function testDependencyMetadataLimitsRejectOversizedInputs() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 dependencyKey = keccak256("oversized-dependency");
        uint256 maxChunk = deployed.dependencyRegistry.MAX_DEPENDENCY_SCRIPT_CHUNK_BYTES();
        uint256 maxChunks = deployed.dependencyRegistry.MAX_DEPENDENCY_SCRIPT_CHUNKS();
        uint256 maxProvenance = deployed.dependencyRegistry.MAX_DEPENDENCY_PROVENANCE_BYTES();

        vm.expectRevert(
            abi.encodeWithSelector(
                DependencyRegistry.DependencyFieldTooLarge.selector,
                bytes32("dependency.script"),
                maxChunk + 1,
                maxChunk
            )
        );
        deployed.dependencyRegistry
            .addDependency(dependencyKey, _singleChunk(_repeat("d", maxChunk + 1)));

        vm.expectRevert(
            abi.encodeWithSelector(
                DependencyRegistry.DependencyFieldTooLarge.selector,
                bytes32("dependency.scriptCount"),
                maxChunks + 1,
                maxChunks
            )
        );
        deployed.dependencyRegistry.addDependency(dependencyKey, _chunkArray(maxChunks + 1, ""));

        vm.expectRevert(
            abi.encodeWithSelector(
                DependencyRegistry.DependencyFieldTooLarge.selector,
                bytes32("dependency.provenance"),
                maxProvenance + 1,
                maxProvenance
            )
        );
        deployed.dependencyRegistry
            .addDependencyWithProvenance(
                dependencyKey,
                _singleChunk("const dependency = true;"),
                _repeat("p", maxProvenance + 1)
            );
    }

    function _assertMetadataLimitRevert(bytes memory reason, bytes32 field, uint256 maximum)
        private
        pure
    {
        bytes4 selector;
        bytes32 actualField;
        uint256 actual;
        uint256 actualMaximum;
        assembly {
            selector := mload(add(reason, 32))
            actualField := mload(add(reason, 36))
            actual := mload(add(reason, 68))
            actualMaximum := mload(add(reason, 100))
        }
        require(selector == StreamCore.MetadataFieldTooLarge.selector, "limit selector");
        actualField.assertEq(field, "limit field");
        (actual > maximum).assertTrue("actual did not exceed maximum");
        actualMaximum.assertEq(maximum, "limit maximum");
    }

    function _attributeWithValueSize(uint256 size) private pure returns (string memory) {
        string memory prefix = "{\"trait_type\":\"Long\",\"value\":\"";
        string memory suffix = "\"}";
        require(size >= bytes(prefix).length + bytes(suffix).length, "size too small");
        return string.concat(
            prefix, _repeat("a", size - bytes(prefix).length - bytes(suffix).length), suffix
        );
    }

    function _ipfsUriWithSize(uint256 size) private pure returns (string memory) {
        string memory prefix = "ipfs://";
        require(size > bytes(prefix).length, "size too small");
        return string.concat(prefix, _repeat("i", size - bytes(prefix).length));
    }

    function _chunkArray(uint256 count, string memory value)
        private
        pure
        returns (string[] memory)
    {
        string[] memory chunks = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            chunks[i] = value;
        }
        return chunks;
    }

    function _singleChunk(string memory value) private pure returns (string[] memory) {
        string[] memory chunks = new string[](1);
        chunks[0] = value;
        return chunks;
    }

    function _repeat(string memory character, uint256 count) private pure returns (string memory) {
        bytes memory input = bytes(character);
        require(input.length == 1, "single byte only");
        bytes memory output = new bytes(count);
        for (uint256 i = 0; i < count; i++) {
            output[i] = input[0];
        }
        return string(output);
    }
}
