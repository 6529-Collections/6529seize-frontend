// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/StreamMetadataRenderer.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";

contract StreamMetadataUriPolicyTest is CharacterizationTestBase, StreamFixture {
    using Assertions for bool;
    using Assertions for string;

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant TOKEN_ID = 1;
    address private constant RECIPIENT = address(0xA11CE);

    function testRendererUriPolicyHelpers() public pure {
        StreamMetadataRenderer.isSafeContentUri("https://metadata.example/base/", false)
            .assertTrue("https content uri rejected");
        StreamMetadataRenderer.isSafeContentUri("ipfs://image/1.png", false)
            .assertTrue("ipfs content uri rejected");
        StreamMetadataRenderer.isSafeContentUri("ar://transaction-id", false)
            .assertTrue("ar content uri rejected");
        StreamMetadataRenderer.isSafeContentUri("", true).assertTrue("empty optional uri rejected");
        StreamMetadataRenderer.isSafeContentUri("", false)
            .assertFalse("empty required uri accepted");
        StreamMetadataRenderer.isSafeContentUri("javascript:alert(1)", false)
            .assertFalse("javascript uri accepted");
        StreamMetadataRenderer.isSafeContentUri("https:///missing-host", false)
            .assertFalse("hostless https uri accepted");
        StreamMetadataRenderer.isSafeContentUri("https://metadata.example/bad path", false)
            .assertFalse("whitespace uri accepted");
        StreamMetadataRenderer.isSafeScriptUri("https://cdn.example/script.js")
            .assertTrue("https script uri rejected");
        StreamMetadataRenderer.isSafeScriptUri("", true)
            .assertTrue("empty optional script rejected");
        StreamMetadataRenderer.isSafeScriptUri("", false).assertFalse("empty script accepted");
        StreamMetadataRenderer.isSafeScriptUri("ipfs://dependency/script.js")
            .assertFalse("ipfs script uri accepted");
    }

    function testProductionCollectionUriPolicyAcceptsAllowedOptionalUris() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        string[] memory scripts = new string[](1);
        scripts[0] = "function draw(){}";
        deployed.core
            .updateCollectionInfo(
                COLLECTION_ID,
                "Genesis",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "",
                "",
                bytes32(0),
                FULL_COLLECTION_UPDATE_INDEX,
                scripts
            );

        deployed.core
            .updateCollectionInfo(
                COLLECTION_ID,
                "Genesis",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "https://metadata.example/base/",
                "https://cdn.example/script.js",
                bytes32(0),
                FULL_COLLECTION_UPDATE_INDEX,
                scripts
            );
        (,,,,, string memory storedBaseURI) = deployed.core.retrieveCollectionInfo(COLLECTION_ID);
        storedBaseURI.assertEq(
            "https://metadata.example/base/", "full collection update did not store base URI"
        );

        deployed.core
            .updateCollectionInfo(
                COLLECTION_ID,
                "",
                "",
                "",
                "",
                "",
                "ar://metadata-base/",
                "",
                bytes32(0),
                FULL_COLLECTION_UPDATE_INDEX - 1,
                scripts
            );
        (,,,,, storedBaseURI) = deployed.core.retrieveCollectionInfo(COLLECTION_ID);
        storedBaseURI.assertEq("ar://metadata-base/", "base URI-only update not stored");
    }

    function testProductionTokenImagePolicyAcceptsAllowedUris() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        _mintToken(deployed);

        _updateTokenImage(deployed.core, "https://image.example/token.png");
        _updateTokenImage(deployed.core, "ipfs://image/1.png");
        _updateTokenImage(deployed.core, "ar://image-transaction-id");
    }

    function testTokenImageRejectsUnsafeProductionUris() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        _mintToken(deployed);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.UnsafeMetadataURI.selector));
        _updateTokenImage(deployed.core, "");

        vm.expectRevert(abi.encodeWithSelector(StreamCore.UnsafeMetadataURI.selector));
        _updateTokenImage(deployed.core, "javascript:alert(1)");

        vm.expectRevert(abi.encodeWithSelector(StreamCore.UnsafeMetadataURI.selector));
        _updateTokenImage(deployed.core, "https://image.example/bad path.png");
    }

    function testCollectionBaseUriRejectsUnsafeProductionUris() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        string[] memory scripts = new string[](1);
        scripts[0] = "function draw(){}";

        vm.expectRevert(abi.encodeWithSelector(StreamCore.UnsafeMetadataURI.selector));
        deployed.core
            .updateCollectionInfo(
                COLLECTION_ID,
                "",
                "",
                "",
                "",
                "",
                "javascript:alert(1)",
                "",
                bytes32(0),
                FULL_COLLECTION_UPDATE_INDEX - 1,
                scripts
            );

        vm.expectRevert(abi.encodeWithSelector(StreamCore.UnsafeMetadataURI.selector));
        deployed.core
            .updateCollectionInfo(
                COLLECTION_ID,
                "Genesis",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "https://metadata.example/bad path/",
                "https://cdn.example/script.js",
                bytes32(0),
                FULL_COLLECTION_UPDATE_INDEX,
                scripts
            );
    }

    function testCollectionLibraryRejectsUnsafeProductionUris() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        string[] memory scripts = new string[](1);
        scripts[0] = "function draw(){}";

        vm.expectRevert(abi.encodeWithSelector(StreamCore.UnsafeMetadataURI.selector));
        deployed.core
            .updateCollectionInfo(
                COLLECTION_ID,
                "Genesis",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "ipfs://base/",
                "ipfs://dependency/script.js",
                bytes32(0),
                FULL_COLLECTION_UPDATE_INDEX,
                scripts
            );
    }

    function testCreateCollectionRejectsUnsafeProductionUris() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        string[] memory scripts = new string[](1);
        scripts[0] = "function draw(){}";

        vm.expectRevert(abi.encodeWithSelector(StreamCore.UnsafeMetadataURI.selector));
        deployed.core
            .createCollection(
                "Unsafe",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "ipfs://base/",
                "javascript:alert(1)",
                bytes32(0),
                scripts
            );
    }

    function testContractMarkerProbesRejectInvalidTargetsWithTypedErrors() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        EmptyMarker emptyMarker = new EmptyMarker();
        address eoa = address(0x1234);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.InvalidRandomizerContract.selector));
        deployed.core.addRandomizer(COLLECTION_ID, eoa);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.InvalidRandomizerContract.selector));
        deployed.core.addRandomizer(COLLECTION_ID, address(emptyMarker));

        vm.expectRevert(abi.encodeWithSelector(StreamCore.InvalidAdminContract.selector));
        deployed.core.updateContracts(1, eoa);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.InvalidAdminContract.selector));
        deployed.core.updateContracts(1, address(emptyMarker));

        vm.expectRevert(abi.encodeWithSelector(StreamCore.InvalidMinterContract.selector));
        deployed.core.updateContracts(2, eoa);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.InvalidMinterContract.selector));
        deployed.core.updateContracts(2, address(emptyMarker));
    }

    function _mintToken(DeployedStream memory deployed) private {
        vm.prank(address(deployed.minter));
        deployed.core.mint(TOKEN_ID, RECIPIENT, "1,2,3", 7, COLLECTION_ID);
    }

    function _updateTokenImage(StreamCore core, string memory image) private {
        uint256[] memory tokenIds = new uint256[](1);
        string[] memory images = new string[](1);
        string[] memory attributes = new string[](1);
        tokenIds[0] = TOKEN_ID;
        images[0] = image;
        attributes[0] = "{\"trait_type\":\"Mood\",\"value\":\"Calm\"}";
        core.updateImagesAndAttributes(tokenIds, images, attributes);
    }
}

contract EmptyMarker {
    fallback() external { }
}
