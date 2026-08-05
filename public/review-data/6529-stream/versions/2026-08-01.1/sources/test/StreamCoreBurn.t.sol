// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/RandomizerRNG.sol";
import "../smart-contracts/RandomizerVRF.sol";
import "../smart-contracts/StreamRandomizerLifecycle.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";

contract StreamCoreBurnTest is CharacterizationTestBase, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant TOKEN_ID = 1;
    address private constant RECIPIENT = address(0xA11CE);
    address private constant PAYOUT = address(0xBEEF);
    address private constant CURATORS_POOL = address(0xCAFE);
    bytes32 private constant RANDOMNESS_SEED_TYPEHASH = keccak256(
        "6529StreamRandomnessSeed(address provider,uint256 requestId,uint256 collectionId,uint256 tokenId,uint256 randomizerEpoch,bytes32 rawOutputHash)"
    );
    bytes32 private constant TRANSFER_TOPIC = keccak256("Transfer(address,address,uint256)");
    bytes32 private constant TOKEN_BURNED_TOPIC =
        keccak256("TokenBurned(uint256,uint256,address,address)");
    bytes32 private constant STREAM_TOKEN_BURNED_TOPIC =
        keccak256("StreamTokenBurned(uint256,uint256,uint256,uint16)");
    bytes32 private constant METADATA_UPDATE_TOPIC = keccak256("MetadataUpdate(uint256)");
    bytes32 private constant BURNED_TOKEN_RANDOMNESS_RECORDED_TOPIC = keccak256(
        "BurnedTokenRandomnessRecorded(uint256,uint256,uint256,address,uint256,bytes32,bytes32)"
    );
    bytes32 private constant RANDOMNESS_FULFILLED_TOPIC =
        keccak256("RandomnessFulfilled(uint256,uint256,uint256,address,uint256,bytes32,bytes32)");

    function testBurnEmitsProtocolEventAndRetainsAuditState() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);
        _mintToken(deployed, TOKEN_ID, 7);
        bytes32 tokenHash = deployed.core.retrieveTokenHash(TOKEN_ID);

        deployed.core.totalSupply().assertEq(1, "global supply before burn");
        deployed.core.totalSupplyOfCollection(COLLECTION_ID).assertEq(1, "collection supply");

        uint256 expectedBlock = block.number;
        uint256 expectedTimestamp = block.timestamp;
        vm.recordLogs();
        vm.prank(RECIPIENT);
        deployed.core.burn(TOKEN_ID);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        _assertTransferToZero(logs, address(deployed.core), RECIPIENT, TOKEN_ID);
        _assertTokenBurned(
            logs, address(deployed.core), COLLECTION_ID, TOKEN_ID, RECIPIENT, RECIPIENT
        );
        _assertStreamTokenBurned(logs, address(deployed.core), TOKEN_ID, COLLECTION_ID, 1);
        _countTopic(logs, METADATA_UPDATE_TOPIC).assertEq(0, "burn emitted metadata update");

        deployed.core.totalSupply().assertEq(0, "global supply after burn");
        deployed.core.totalSupplyOfCollection(COLLECTION_ID).assertEq(0, "live supply after burn");
        deployed.core.burnAmount(COLLECTION_ID).assertEq(1, "burn count");
        deployed.core.isTokenBurned(TOKEN_ID).assertTrue("burn predicate");
        deployed.core.viewColIDforTokenID(TOKEN_ID).assertEq(COLLECTION_ID, "collection retained");
        deployed.core.retrieveTokenHash(TOKEN_ID).assertEq(tokenHash, "token hash retained");

        (
            bool burned,
            uint256 collectionId,
            address owner,
            address operator,
            uint256 burnedBlock,
            uint256 burnedTimestamp,
            bytes32 auditTokenHash,
            bytes32 postBurnRandomnessHash,
            uint256 postBurnRandomnessBlock,
            uint256 postBurnRandomnessTimestamp
        ) = deployed.core.burnedTokenAuditState(TOKEN_ID);

        burned.assertTrue("audit burned flag");
        collectionId.assertEq(COLLECTION_ID, "audit collection");
        owner.assertEq(RECIPIENT, "audit owner");
        operator.assertEq(RECIPIENT, "audit operator");
        burnedBlock.assertEq(expectedBlock, "burn block");
        burnedTimestamp.assertEq(expectedTimestamp, "burn timestamp");
        auditTokenHash.assertEq(tokenHash, "audit token hash");
        postBurnRandomnessHash.assertEq(bytes32(0), "unexpected post-burn hash");
        postBurnRandomnessBlock.assertEq(0, "unexpected post-burn block");
        postBurnRandomnessTimestamp.assertEq(0, "unexpected post-burn timestamp");

        _assertStaticCallReverts(
            address(deployed.core),
            abi.encodeWithSignature("ownerOf(uint256)", TOKEN_ID),
            "ownerOf available after burn"
        );
        _assertStaticCallReverts(
            address(deployed.core),
            abi.encodeWithSignature("tokenURI(uint256)", TOKEN_ID),
            "tokenURI available after burn"
        );
        _assertStaticCallReverts(
            address(deployed.core),
            abi.encodeWithSignature("tokenMetadataState(uint256)", TOKEN_ID),
            "metadata state available after burn"
        );
    }

    function testBurnedTokenIdCannotBeReminted() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);
        _mintToken(deployed, TOKEN_ID, 7);

        vm.prank(RECIPIENT);
        deployed.core.burn(TOKEN_ID);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.TokenIdentityUnknown.selector));
        vm.prank(address(deployed.minter));
        deployed.core.mint(TOKEN_ID, RECIPIENT, "data", 8, COLLECTION_ID);

        deployed.core.totalSupply().assertEq(0, "global supply after failed remint");
        deployed.core.totalSupplyOfCollection(COLLECTION_ID).assertEq(0, "collection supply");
        deployed.core.burnAmount(COLLECTION_ID).assertEq(1, "burn count after failed remint");
        deployed.core.isTokenBurned(TOKEN_ID).assertTrue("burn predicate after failed remint");
    }

    function testPostBurnVrfFulfillmentAfterFreezeRecordsAuditWithoutMetadata() public {
        (
            DeployedStream memory deployed,
            BurnMockVrfCoordinator coordinator,
            NextGenRandomizerVRF vrf
        ) = _deployVrfRandomizer();
        _mintToken(deployed, TOKEN_ID, 7);
        deployed.core.retrieveTokenHash(TOKEN_ID).assertEq(bytes32(0), "expected pending token");

        vm.prank(RECIPIENT);
        deployed.core.burn(TOKEN_ID);
        _warpPastFinalSupplyWindow();
        bytes32 expectedManifest = deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID);
        deployed.core.freezeCollection(COLLECTION_ID);

        uint256[] memory words = _words(777);
        bytes32 rawOutputHash = _rawOutputHash(words);
        bytes32 expectedSeed =
            _expectedSeed(address(vrf), uint256(1), COLLECTION_ID, TOKEN_ID, uint256(2), words);

        vm.recordLogs();
        coordinator.fulfill(vrf, 1, words);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        _assertBurnedTokenRandomnessRecorded(
            logs,
            address(vrf),
            1,
            COLLECTION_ID,
            TOKEN_ID,
            address(vrf),
            2,
            expectedSeed,
            rawOutputHash
        );
        _countTopic(logs, METADATA_UPDATE_TOPIC).assertEq(0, "post-burn metadata update");
        _countTopic(logs, RANDOMNESS_FULFILLED_TOPIC).assertEq(1, "fulfillment event");

        deployed.core.retrieveTokenHash(TOKEN_ID).assertEq(expectedSeed, "post-burn hash");
        deployed.core.totalSupplyOfCollection(COLLECTION_ID).assertEq(0, "live supply changed");
        deployed.core.collectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "stored manifest changed");
        deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "preview manifest changed");

        StreamRandomizerLifecycle.RandomnessRequest memory request =
            vrf.retrieveRandomnessRequest(1);
        uint256(request.state)
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.Fulfilled), "state");
        request.derivedSeed.assertEq(expectedSeed, "stored seed");
        request.rawOutputHash.assertEq(rawOutputHash, "raw output");
        vrf.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "pending collection");

        _assertPostBurnAudit(deployed, expectedSeed);
        _assertStaticCallReverts(
            address(deployed.core),
            abi.encodeWithSignature("tokenURI(uint256)", TOKEN_ID),
            "tokenURI available after post-burn fulfillment"
        );
    }

    function testPostBurnArrngFulfillmentRecordsAuditWithoutMetadata() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);
        BurnMockArrngController controller = new BurnMockArrngController();
        NextGenRandomizerRNG rng = new NextGenRandomizerRNG(
            address(deployed.core), address(deployed.admins), address(controller)
        );
        deployed.core.addRandomizer(COLLECTION_ID, address(rng));
        _mintToken(deployed, TOKEN_ID, 7);

        vm.prank(RECIPIENT);
        deployed.core.burn(TOKEN_ID);

        uint256[] memory words = _words(999);
        bytes32 rawOutputHash = _rawOutputHash(words);
        bytes32 expectedSeed =
            _expectedSeed(address(rng), uint256(1), COLLECTION_ID, TOKEN_ID, uint256(2), words);

        vm.recordLogs();
        controller.fulfill(rng, 1, words);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        _assertBurnedTokenRandomnessRecorded(
            logs,
            address(rng),
            1,
            COLLECTION_ID,
            TOKEN_ID,
            address(rng),
            2,
            expectedSeed,
            rawOutputHash
        );
        _countTopic(logs, METADATA_UPDATE_TOPIC).assertEq(0, "post-burn metadata update");
        _countTopic(logs, RANDOMNESS_FULFILLED_TOPIC).assertEq(1, "fulfillment event");
        deployed.core.retrieveTokenHash(TOKEN_ID).assertEq(expectedSeed, "post-burn hash");
        rng.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "pending collection");
        _assertPostBurnAudit(deployed, expectedSeed);
    }

    function _deployVrfRandomizer()
        private
        returns (
            DeployedStream memory deployed,
            BurnMockVrfCoordinator coordinator,
            NextGenRandomizerVRF vrf
        )
    {
        deployed = deployStream(PAYOUT, CURATORS_POOL);
        coordinator = new BurnMockVrfCoordinator();
        vrf = new NextGenRandomizerVRF(
            1, address(coordinator), address(deployed.core), address(deployed.admins)
        );
        deployed.core.addRandomizer(COLLECTION_ID, address(vrf));
    }

    function _mintToken(DeployedStream memory deployed, uint256 tokenId, uint256 salt) private {
        vm.prank(address(deployed.minter));
        deployed.core.mint(tokenId, RECIPIENT, "data", salt, COLLECTION_ID);
    }

    function _warpPastFinalSupplyWindow() private {
        vm.warp(block.timestamp + 31 days + 1);
    }

    function _words(uint256 word) private pure returns (uint256[] memory words) {
        words = new uint256[](1);
        words[0] = word;
    }

    function _rawOutputHash(uint256[] memory words) private pure returns (bytes32) {
        return keccak256(abi.encode(words));
    }

    function _expectedSeed(
        address provider,
        uint256 requestId,
        uint256 collectionId,
        uint256 tokenId,
        uint256 randomizerEpoch,
        uint256[] memory words
    ) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                RANDOMNESS_SEED_TYPEHASH,
                provider,
                requestId,
                collectionId,
                tokenId,
                randomizerEpoch,
                _rawOutputHash(words)
            )
        );
    }

    function _assertPostBurnAudit(DeployedStream memory deployed, bytes32 expectedSeed)
        private
        view
    {
        (
            bool burned,
            uint256 collectionId,
            address owner,
            address operator,
            uint256 burnedBlock,
            uint256 burnedTimestamp,
            bytes32 tokenHash,
            bytes32 postBurnRandomnessHash,
            uint256 postBurnRandomnessBlock,
            uint256 postBurnRandomnessTimestamp
        ) = deployed.core.burnedTokenAuditState(TOKEN_ID);

        burned.assertTrue("audit burned flag");
        collectionId.assertEq(COLLECTION_ID, "audit collection");
        owner.assertEq(RECIPIENT, "audit owner");
        operator.assertEq(RECIPIENT, "audit operator");
        (burnedBlock > 0).assertTrue("audit burn block");
        (burnedTimestamp > 0).assertTrue("audit burn timestamp");
        tokenHash.assertEq(expectedSeed, "audit token hash");
        postBurnRandomnessHash.assertEq(expectedSeed, "audit post-burn hash");
        (postBurnRandomnessBlock > 0).assertTrue("post-burn block");
        (postBurnRandomnessTimestamp > 0).assertTrue("post-burn timestamp");
    }

    function _assertStaticCallReverts(address target, bytes memory data, string memory message)
        private
        view
    {
        // slither-disable-next-line low-level-calls
        (bool success,) = target.staticcall(data);
        success.assertFalse(message);
    }

    function _assertTransferToZero(
        Vm.Log[] memory logs,
        address emitter,
        address from,
        uint256 tokenId
    ) private pure {
        bool found = false;
        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].emitter == emitter && logs[i].topics.length == 4
                    && logs[i].topics[0] == TRANSFER_TOPIC
                    && _topicAddress(logs[i].topics[1]) == from
                    && _topicAddress(logs[i].topics[2]) == address(0)
                    && uint256(logs[i].topics[3]) == tokenId
            ) {
                found = true;
            }
        }
        found.assertTrue("transfer-to-zero event");
    }

    function _assertTokenBurned(
        Vm.Log[] memory logs,
        address emitter,
        uint256 collectionId,
        uint256 tokenId,
        address operator,
        address owner
    ) private pure {
        bool found = false;
        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].emitter == emitter && logs[i].topics.length == 4
                    && logs[i].topics[0] == TOKEN_BURNED_TOPIC
                    && uint256(logs[i].topics[1]) == collectionId
                    && uint256(logs[i].topics[2]) == tokenId
                    && _topicAddress(logs[i].topics[3]) == operator
            ) {
                address actualOwner = abi.decode(logs[i].data, (address));
                found = actualOwner == owner;
            }
        }
        found.assertTrue("token burned event");
    }

    function _assertBurnedTokenRandomnessRecorded(
        Vm.Log[] memory logs,
        address emitter,
        uint256 requestId,
        uint256 collectionId,
        uint256 tokenId,
        address provider,
        uint256 randomizerEpoch,
        bytes32 derivedSeed,
        bytes32 rawOutputHash
    ) private pure {
        bool found = false;
        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].emitter == emitter && logs[i].topics.length == 4
                    && logs[i].topics[0] == BURNED_TOKEN_RANDOMNESS_RECORDED_TOPIC
                    && uint256(logs[i].topics[1]) == requestId
                    && uint256(logs[i].topics[2]) == collectionId
                    && uint256(logs[i].topics[3]) == tokenId
            ) {
                (
                    address actualProvider,
                    uint256 actualEpoch,
                    bytes32 actualSeed,
                    bytes32 actualRawOutputHash
                ) = abi.decode(logs[i].data, (address, uint256, bytes32, bytes32));
                found = actualProvider == provider && actualEpoch == randomizerEpoch
                    && actualSeed == derivedSeed && actualRawOutputHash == rawOutputHash;
            }
        }
        found.assertTrue("burned-token randomness event");
    }

    function _assertStreamTokenBurned(
        Vm.Log[] memory logs,
        address emitter,
        uint256 tokenId,
        uint256 collectionId,
        uint256 collectionSerial
    ) private pure {
        bool found = false;
        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].emitter == emitter && logs[i].topics.length == 3
                    && logs[i].topics[0] == STREAM_TOKEN_BURNED_TOPIC
                    && uint256(logs[i].topics[1]) == tokenId
                    && uint256(logs[i].topics[2]) == collectionId
            ) {
                (uint256 actualSerial, uint16 schemaVersion) =
                    abi.decode(logs[i].data, (uint256, uint16));
                found = actualSerial == collectionSerial && schemaVersion == 1;
            }
        }
        found.assertTrue("stream token burned event");
    }

    function _countTopic(Vm.Log[] memory logs, bytes32 topic) private pure returns (uint256 count) {
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length > 0 && logs[i].topics[0] == topic) {
                count++;
            }
        }
    }

    function _topicAddress(bytes32 topic) private pure returns (address) {
        return address(uint160(uint256(topic)));
    }
}

contract BurnMockVrfCoordinator {
    uint256 public nextRequestId = 1;

    function requestRandomWords(bytes32, uint64, uint16, uint32, uint32)
        external
        returns (uint256 requestId)
    {
        requestId = nextRequestId;
        nextRequestId++;
    }

    function fulfill(NextGenRandomizerVRF randomizer, uint256 requestId, uint256[] memory words)
        external
    {
        randomizer.rawFulfillRandomWords(requestId, words);
    }
}

contract BurnMockArrngController {
    uint256 public nextRequestId = 1;

    function requestRandomWords(uint256, address) external returns (uint256 requestId) {
        requestId = nextRequestId;
        nextRequestId++;
    }

    function fulfill(NextGenRandomizerRNG randomizer, uint256 requestId, uint256[] memory words)
        external
    {
        randomizer.receiveRandomness(requestId, words);
    }
}
