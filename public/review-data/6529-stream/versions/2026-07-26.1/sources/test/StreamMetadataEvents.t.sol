// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";
// MockRandomizer.sol also defines NoopRandomizer, used here to hold pending state.
import "./mocks/MockRandomizer.sol";

contract StreamMetadataEventsTest is CharacterizationTestBase, StreamFixture {
    using Assertions for bool;
    using Assertions for uint256;

    bytes4 private constant ERC2981_INTERFACE_ID = 0x2a55205a;
    bytes4 private constant ERC4906_INTERFACE_ID = 0x49064906;
    bytes4 private constant ERC721_ENUMERABLE_INTERFACE_ID = 0x780e9d63;
    bytes32 private constant METADATA_UPDATE_TOPIC = keccak256("MetadataUpdate(uint256)");
    bytes32 private constant BATCH_METADATA_UPDATE_TOPIC =
        keccak256("BatchMetadataUpdate(uint256,uint256)");
    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant TOKEN_ID = 1;
    address private constant RECIPIENT = address(0xA11CE);

    function testSupportsErc4906Interface() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        deployed.core.supportsInterface(ERC2981_INTERFACE_ID).assertTrue("missing ERC-2981");
        deployed.core.supportsInterface(ERC4906_INTERFACE_ID).assertTrue("missing ERC-4906");
        deployed.core.supportsInterface(ERC721_ENUMERABLE_INTERFACE_ID)
            .assertFalse("unexpected ERC-721 Enumerable support");
        deployed.core.supportsInterface(0xffffffff).assertFalse("invalid interface supported");
    }

    function testRandomnessFulfillmentEmitsMetadataUpdate() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        vm.recordLogs();
        _mintToken(deployed, TOKEN_ID, 7);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        _countMetadataUpdates(logs, TOKEN_ID).assertEq(1, "fulfillment event count");
    }

    function testMintWithoutRandomnessFulfillmentDoesNotEmitMetadataUpdate() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        NoopRandomizer noopRandomizer = new NoopRandomizer();
        deployed.core.addRandomizer(COLLECTION_ID, address(noopRandomizer));

        vm.recordLogs();
        _mintToken(deployed, TOKEN_ID, 7);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        _countTopic(logs, METADATA_UPDATE_TOPIC).assertEq(0, "mint-only metadata update emitted");
        _countTopic(logs, BATCH_METADATA_UPDATE_TOPIC).assertEq(0, "mint-only batch update emitted");
    }

    function testPremintRandomnessFulfillmentStoresHashWithoutMetadataUpdate() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 tokenHash = keccak256("premint hash");

        vm.recordLogs();
        vm.prank(address(deployed.randomizer));
        deployed.core.setTokenHash(COLLECTION_ID, TOKEN_ID, tokenHash);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        _countTopic(logs, METADATA_UPDATE_TOPIC).assertEq(0, "premint metadata update emitted");
        _countTopic(logs, BATCH_METADATA_UPDATE_TOPIC).assertEq(0, "premint batch update emitted");
        require(deployed.core.retrieveTokenHash(TOKEN_ID) == tokenHash, "hash not stored");
    }

    function testTokenMetadataMutationsEmitMetadataUpdate() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        _mintToken(deployed, TOKEN_ID, 7);
        _mintToken(deployed, TOKEN_ID + 1, 8);

        vm.recordLogs();
        deployed.core.changeTokenData(TOKEN_ID, "4,5,6");
        Vm.Log[] memory tokenDataLogs = vm.getRecordedLogs();

        _countMetadataUpdates(tokenDataLogs, TOKEN_ID).assertEq(1, "token data event count");

        uint256[] memory tokenIds = new uint256[](2);
        string[] memory images = new string[](2);
        string[] memory attributes = new string[](2);
        tokenIds[0] = TOKEN_ID;
        images[0] = "ipfs://image/updated.png";
        attributes[0] = "{\"trait_type\":\"Mood\",\"value\":\"Loud\"}";
        tokenIds[1] = TOKEN_ID + 1;
        images[1] = "ipfs://image/updated-2.png";
        attributes[1] = "{\"trait_type\":\"Mood\",\"value\":\"Quiet\"}";

        vm.recordLogs();
        deployed.core.updateImagesAndAttributes(tokenIds, images, attributes);
        Vm.Log[] memory imageLogs = vm.getRecordedLogs();

        _countMetadataUpdates(imageLogs, TOKEN_ID).assertEq(1, "image event count");
        _countMetadataUpdates(imageLogs, TOKEN_ID + 1).assertEq(1, "second image event count");
    }

    function testCollectionMetadataMutationsEmitBatchMetadataUpdate() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        _mintToken(deployed, TOKEN_ID, 7);
        _mintToken(deployed, TOKEN_ID + 1, 8);

        vm.recordLogs();
        deployed.core.changeMetadataView(COLLECTION_ID, true);
        Vm.Log[] memory viewLogs = vm.getRecordedLogs();

        _countBatchMetadataUpdates(viewLogs, TOKEN_ID, TOKEN_ID + 1)
            .assertEq(1, "metadata view event count");

        string[] memory scripts = new string[](1);
        scripts[0] = "function draw(){return 1;}";

        vm.recordLogs();
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
        Vm.Log[] memory baseUriLogs = vm.getRecordedLogs();

        _countBatchMetadataUpdates(baseUriLogs, TOKEN_ID, TOKEN_ID + 1)
            .assertEq(1, "collection info event count");
    }

    function testCollectionMetadataMutationWithoutMintedTokensDoesNotEmitBatchUpdate() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        vm.recordLogs();
        deployed.core.changeMetadataView(COLLECTION_ID, true);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        _countTopic(logs, METADATA_UPDATE_TOPIC)
            .assertEq(0, "empty collection metadata update emitted");
        _countTopic(logs, BATCH_METADATA_UPDATE_TOPIC)
            .assertEq(0, "empty collection batch update emitted");
    }

    function testBurnDoesNotEmitMetadataUpdate() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        NoopRandomizer noopRandomizer = new NoopRandomizer();
        deployed.core.addRandomizer(COLLECTION_ID, address(noopRandomizer));
        _mintToken(deployed, TOKEN_ID, 7);

        vm.recordLogs();
        vm.prank(RECIPIENT);
        deployed.core.burn(TOKEN_ID);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        _countTopic(logs, METADATA_UPDATE_TOPIC).assertEq(0, "burn emitted metadata update");
        _countTopic(logs, BATCH_METADATA_UPDATE_TOPIC)
            .assertEq(0, "burn emitted batch metadata update");
    }

    function testPostBurnRandomnessFulfillmentStoresHashWithoutMetadataUpdate() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        NoopRandomizer noopRandomizer = new NoopRandomizer();
        deployed.core.addRandomizer(COLLECTION_ID, address(noopRandomizer));
        _mintToken(deployed, TOKEN_ID, 7);

        vm.prank(RECIPIENT);
        deployed.core.burn(TOKEN_ID);

        bytes32 tokenHash = keccak256("post-burn hash");

        vm.recordLogs();
        vm.prank(address(noopRandomizer));
        deployed.core.setTokenHash(COLLECTION_ID, TOKEN_ID, tokenHash);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        _countTopic(logs, METADATA_UPDATE_TOPIC).assertEq(0, "post-burn metadata update emitted");
        _countTopic(logs, BATCH_METADATA_UPDATE_TOPIC).assertEq(0, "post-burn batch update emitted");
        require(deployed.core.retrieveTokenHash(TOKEN_ID) == tokenHash, "post-burn hash not stored");
    }

    function _mintToken(DeployedStream memory deployed, uint256 tokenId, uint256 salt) private {
        vm.prank(address(deployed.minter));
        deployed.core.mint(tokenId, RECIPIENT, "1,2,3", salt, COLLECTION_ID);
    }

    function _countMetadataUpdates(Vm.Log[] memory logs, uint256 tokenId)
        private
        pure
        returns (uint256 count)
    {
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length == 1 && logs[i].topics[0] == METADATA_UPDATE_TOPIC) {
                uint256 actualTokenId = abi.decode(logs[i].data, (uint256));
                if (actualTokenId == tokenId) {
                    count++;
                }
            }
        }
    }

    function _countBatchMetadataUpdates(
        Vm.Log[] memory logs,
        uint256 fromTokenId,
        uint256 toTokenId
    ) private pure returns (uint256 count) {
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length == 1 && logs[i].topics[0] == BATCH_METADATA_UPDATE_TOPIC) {
                (uint256 actualFromTokenId, uint256 actualToTokenId) =
                    abi.decode(logs[i].data, (uint256, uint256));
                if (actualFromTokenId == fromTokenId && actualToTokenId == toTokenId) {
                    count++;
                }
            }
        }
    }

    function _countTopic(Vm.Log[] memory logs, bytes32 topic) private pure returns (uint256 count) {
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length > 0 && logs[i].topics[0] == topic) {
                count++;
            }
        }
    }
}
