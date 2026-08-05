// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/DependencyRegistry.sol";
import "../smart-contracts/StreamCore.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";
import "./mocks/MockRandomizer.sol";

contract StreamMetadataFreezeTest is CharacterizationTestBase, StreamFixture {
    using Assertions for bool;
    using Assertions for address;
    using Assertions for uint256;
    using Assertions for bytes32;

    event CollectionFrozen(
        uint256 indexed _collectionID,
        bytes32 indexed manifestHash,
        string schemaVersion,
        address indexed admin
    );

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant TOKEN_ID = 1;
    address private constant RECIPIENT = address(0xA11CE);

    function testFreezeStoresManifestEventAndFinalizesSupply() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        _mintToken(deployed, TOKEN_ID, 7);
        _mintToken(deployed, TOKEN_ID + 1, 8);
        _warpPastFinalSupplyWindow();

        bytes32 beforeMetadataUpdate =
            deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID);
        deployed.core.changeTokenData(TOKEN_ID, "4,5,6");

        uint256[] memory tokenIds = new uint256[](1);
        string[] memory images = new string[](1);
        string[] memory attributes = new string[](1);
        tokenIds[0] = TOKEN_ID;
        images[0] = "ipfs://image/updated.png";
        attributes[0] = "{\"trait_type\":\"Mood\",\"value\":\"Ready\"}";
        deployed.core.updateImagesAndAttributes(tokenIds, images, attributes);

        bytes32 expectedManifest = deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID);
        (expectedManifest != beforeMetadataUpdate)
        .assertTrue("manifest did not track metadata update");

        vm.expectEmit(true, true, true, true);
        emit CollectionFrozen(
            COLLECTION_ID, expectedManifest, deployed.core.metadataSchemaVersion(), address(this)
        );
        deployed.core.freezeCollection(COLLECTION_ID);

        deployed.core.collectionFreezeStatus(COLLECTION_ID).assertTrue("collection not frozen");
        deployed.core.collectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "manifest not stored");
        deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "manifest not stable");

        (
            address artistAddress,
            uint256 maxCollectionPurchases,
            uint256 circulationSupply,
            uint256 collectionTotalSupply,
            uint256 finalSupplyDelay,
            address randomizerContract
        ) = deployed.core.retrieveCollectionAdditionalData(COLLECTION_ID);
        artistAddress.assertEq(address(0xA11CE), "artist changed");
        maxCollectionPurchases.assertEq(5, "max purchases changed");
        circulationSupply.assertEq(2, "unexpected circulation supply");
        collectionTotalSupply.assertEq(2, "freeze did not finalize supply");
        finalSupplyDelay.assertEq(1 days, "final supply delay changed");
        randomizerContract.assertEq(address(deployed.randomizer), "randomizer changed");
        deployed.core.lastAllocatedTokenId()
            .assertEq(TOKEN_ID + 1, "allocator high-water mark drifted");
    }

    function testFreezeRejectsBeforeMintAndFinalSupplyWindowsEnd() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + 30 days;

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.CollectionMintWindowActive.selector, COLLECTION_ID, startTime, endTime
            )
        );
        deployed.core.freezeCollection(COLLECTION_ID);

        uint256 afterEndTime = endTime + 1;
        uint256 finalSupplyTimestamp = endTime + 1 days;
        vm.warp(afterEndTime);

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.CollectionFinalSupplyWindowActive.selector,
                COLLECTION_ID,
                afterEndTime,
                finalSupplyTimestamp
            )
        );
        deployed.core.freezeCollection(COLLECTION_ID);
    }

    function testFreezeRejectsPendingLiveTokenMetadata() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        NoopRandomizer noopRandomizer = new NoopRandomizer();
        deployed.core.addRandomizer(COLLECTION_ID, address(noopRandomizer));
        _mintToken(deployed, TOKEN_ID, 7);
        _warpPastFinalSupplyWindow();

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.CollectionHasPendingTokenMetadata.selector, COLLECTION_ID, 1
            )
        );
        deployed.core.freezeCollection(COLLECTION_ID);
    }

    function testFreezeIgnoresBurnedPendingTokenMetadata() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        NoopRandomizer noopRandomizer = new NoopRandomizer();
        deployed.core.addRandomizer(COLLECTION_ID, address(noopRandomizer));
        _mintToken(deployed, TOKEN_ID, 7);

        vm.prank(RECIPIENT);
        deployed.core.burn(TOKEN_ID);

        _warpPastFinalSupplyWindow();
        deployed.core.freezeCollection(COLLECTION_ID);

        deployed.core.collectionFreezeStatus(COLLECTION_ID).assertTrue("collection not frozen");
        deployed.core.totalSupplyOfCollection(COLLECTION_ID)
            .assertEq(0, "burned token counted live");
    }

    function testFrozenCollectionRejectsMetadataSignificantWrites() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        _mintToken(deployed, TOKEN_ID, 7);
        _warpPastFinalSupplyWindow();
        deployed.core.freezeCollection(COLLECTION_ID);

        NoopRandomizer noopRandomizer = new NoopRandomizer();
        vm.expectRevert(abi.encodeWithSelector(StreamCore.MetadataFrozen.selector, COLLECTION_ID));
        deployed.core.addRandomizer(COLLECTION_ID, address(noopRandomizer));

        vm.expectRevert(abi.encodeWithSelector(StreamCore.MetadataFrozen.selector, COLLECTION_ID));
        deployed.core.setFinalSupply(COLLECTION_ID);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.MetadataFrozen.selector, COLLECTION_ID));
        vm.prank(address(deployed.minter));
        deployed.core.mint(TOKEN_ID + 1, RECIPIENT, "1,2,3", 9, COLLECTION_ID);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.MetadataFrozen.selector, COLLECTION_ID));
        vm.prank(address(deployed.randomizer));
        deployed.core.setTokenHash(COLLECTION_ID, TOKEN_ID + 1, keccak256("late hash"));

        vm.expectRevert(abi.encodeWithSelector(StreamCore.MetadataFrozen.selector, COLLECTION_ID));
        vm.prank(RECIPIENT);
        deployed.core.burn(TOKEN_ID);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.MetadataFrozen.selector, COLLECTION_ID));
        vm.prank(address(0xA11CE));
        deployed.core.artistSignature(COLLECTION_ID, "artist-signature");

        vm.expectRevert(abi.encodeWithSelector(StreamCore.MetadataFrozen.selector, COLLECTION_ID));
        deployed.core.setCollectionData(COLLECTION_ID, address(0xA11CE), 5, 10, 1 days);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.MetadataFrozen.selector, COLLECTION_ID));
        deployed.core.changeMetadataView(COLLECTION_ID, true);

        string[] memory scripts = new string[](1);
        scripts[0] = "function draw(){return 1;}";
        vm.expectRevert(abi.encodeWithSelector(StreamCore.MetadataFrozen.selector, COLLECTION_ID));
        deployed.core
            .updateCollectionInfo(
                COLLECTION_ID,
                "Genesis",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "ipfs://new-base/",
                "https://cdn.example/script.js",
                bytes32(0),
                999999,
                scripts
            );

        vm.expectRevert(abi.encodeWithSelector(StreamCore.MetadataFrozen.selector, COLLECTION_ID));
        deployed.core.changeTokenData(TOKEN_ID, "4,5,6");

        uint256[] memory tokenIds = new uint256[](1);
        string[] memory images = new string[](1);
        string[] memory attributes = new string[](1);
        tokenIds[0] = TOKEN_ID;
        images[0] = "ipfs://image/updated.png";
        attributes[0] = "{\"trait_type\":\"Mood\",\"value\":\"Locked\"}";

        vm.expectRevert(abi.encodeWithSelector(StreamCore.MetadataFrozen.selector, COLLECTION_ID));
        deployed.core.updateImagesAndAttributes(tokenIds, images, attributes);
    }

    function testSetTokenHashRejectsTokenMappedToAnotherCollection() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        NoopRandomizer noopRandomizer = new NoopRandomizer();
        string[] memory scripts = new string[](1);
        scripts[0] = "function draw(){}";
        deployed.core
            .createCollection(
                "Second",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "ipfs://second/",
                "https://cdn.example/script.js",
                bytes32(0),
                scripts
            );
        deployed.core.setCollectionData(2, address(0xA11CE), 5, 10, 1 days);
        deployed.core.addRandomizer(2, address(noopRandomizer));
        deployed.minter.setCollectionPhases(2, block.timestamp, block.timestamp + 30 days);
        vm.prank(address(deployed.minter));
        deployed.core.mint(TOKEN_ID, RECIPIENT, "1,2,3", 7, 2);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.TokenIdentityUnknown.selector));
        vm.prank(address(deployed.randomizer));
        deployed.core.setTokenHash(COLLECTION_ID, TOKEN_ID, keccak256("wrong collection hash"));
    }

    function testFrozenCollectionBlocksDependencyRegistrySwap() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        _mintToken(deployed, TOKEN_ID, 7);
        _warpPastFinalSupplyWindow();
        deployed.core.freezeCollection(COLLECTION_ID);

        DependencyRegistry replacement = new DependencyRegistry(address(deployed.admins));
        vm.expectRevert(
            abi.encodeWithSelector(StreamCore.FrozenCollectionDependencyRegistry.selector)
        );
        deployed.core.updateContracts(3, address(replacement));
    }

    function _mintToken(DeployedStream memory deployed, uint256 tokenId, uint256 salt) private {
        vm.prank(address(deployed.minter));
        deployed.core.mint(tokenId, RECIPIENT, "1,2,3", salt, COLLECTION_ID);
    }

    function _warpPastFinalSupplyWindow() private {
        vm.warp(block.timestamp + 31 days + 1);
    }
}
