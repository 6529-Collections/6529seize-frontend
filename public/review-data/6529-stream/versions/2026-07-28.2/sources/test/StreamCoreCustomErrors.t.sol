// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/DependencyRegistry.sol";
import "../smart-contracts/StreamAdmins.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";

contract StreamCoreCustomErrorsTest is CharacterizationTestBase, StreamFixture {
    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant TOKEN_ID = 1;
    address private constant ARTIST = address(0xA11CE);
    address private constant UNAUTHORIZED = address(0xBAD);

    function testFunctionAdminRequiredUsesCustomError() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        vm.expectRevert(abi.encodeWithSelector(StreamCore.FunctionAdminUnauthorized.selector));
        vm.prank(UNAUTHORIZED);
        deployed.core.changeMetadataView(COLLECTION_ID, true);
    }

    function testArtistSignatureUsesCustomErrorForWrongSignerAndDuplicateSignature() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        vm.expectRevert(abi.encodeWithSelector(StreamCore.ArtistSignatureUnauthorized.selector));
        deployed.core.artistSignature(COLLECTION_ID, "not-artist");

        vm.prank(ARTIST);
        deployed.core.artistSignature(COLLECTION_ID, "artist-signature");

        vm.expectRevert(abi.encodeWithSelector(StreamCore.ArtistSignatureUnauthorized.selector));
        vm.prank(ARTIST);
        deployed.core.artistSignature(COLLECTION_ID, "second-signature");
    }

    function testUpdateImagesAndAttributesUsesCustomErrorForMismatchedArrayLengths() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        uint256[] memory tokenIds = new uint256[](1);
        string[] memory images = new string[](0);
        string[] memory attributes = new string[](1);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.InvalidTokenMetadataInput.selector));
        deployed.core.updateImagesAndAttributes(tokenIds, images, attributes);
    }

    function testSetFinalSupplyUsesCustomErrorBeforeFinalSupplyWindowEnds() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        vm.expectRevert(abi.encodeWithSelector(StreamCore.FinalSupplyTimeNotPassed.selector));
        deployed.core.setFinalSupply(COLLECTION_ID);
    }

    function testSetFinalSupplyUsesCustomErrorWhenCollectionDataIsMissing() public {
        StreamCore core = _deployCoreWithCollectionInfoOnly();

        vm.expectRevert(
            abi.encodeWithSelector(StreamCore.CollectionDataMissing.selector, COLLECTION_ID)
        );
        core.setFinalSupply(COLLECTION_ID);
    }

    function testTokenMetadataStateUsesCustomErrorForUnmintedToken() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        vm.expectRevert(abi.encodeWithSelector(StreamCore.TokenNotMinted.selector));
        deployed.core.tokenMetadataState(TOKEN_ID);
    }

    function _deployCoreWithCollectionInfoOnly() private returns (StreamCore core) {
        StreamAdmins admins = new StreamAdmins(address(this));
        admins.registerAdmin(address(this), true);
        DependencyRegistry dependencyRegistry = new DependencyRegistry(address(admins));
        core = new StreamCore("6529 Stream", "STREAM", address(admins), address(dependencyRegistry));

        string[] memory scripts = new string[](1);
        scripts[0] = "function draw(){}";
        core.createCollection(
            "Genesis",
            "6529",
            "Description",
            "https://6529.io",
            "CC0",
            "ipfs://base/",
            "https://cdn.example/script.js",
            bytes32(0),
            scripts
        );
    }
}
