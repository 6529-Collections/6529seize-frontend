// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/StreamAdmins.sol";
import "../smart-contracts/AuctionContract.sol";
import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/StreamDrops.sol";
import "../smart-contracts/StreamMinter.sol";
import "./helpers/Assertions.sol";
import "./helpers/DropAuthTestHelper.sol";
import "./helpers/StreamFixture.sol";

contract StreamMinterEventsTest is DropAuthTestHelper, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    bytes32 private constant MINTER_TOKENS_MINTED_TOPIC =
        keccak256("MinterTokensMinted(uint256,uint256,address,uint256,uint256)");
    bytes32 private constant MINTER_AUCTION_MINTED_TOPIC =
        keccak256("MinterAuctionMinted(uint256,uint256,address,uint256)");
    bytes32 private constant MINTER_CONTRACT_REFERENCE_UPDATED_TOPIC =
        keccak256("MinterContractReferenceUpdated(uint8,address,address,address)");

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant FIRST_TOKEN_ID = 1;
    address private constant FIRST_RECIPIENT = address(0xA11CE);
    address private constant SECOND_RECIPIENT = address(0xB0B);
    address private constant PAYOUT = address(0x2002);
    address private constant CURATORS_POOL = address(0x3003);
    address private constant BIDDER = address(0x4004);
    uint256 private constant RESERVE_PRICE = 5 ether;

    event CollectionPhasesUpdated(
        uint256 indexed collectionId,
        uint256 oldPublicStartTime,
        uint256 oldPublicEndTime,
        uint256 publicStartTime,
        uint256 publicEndTime,
        address indexed admin
    );
    event MinterAuctionEndTimeUpdated(
        uint256 indexed tokenId,
        uint256 oldAuctionEndTime,
        uint256 newAuctionEndTime,
        address indexed admin
    );
    event MinterContractReferenceUpdated(
        uint8 indexed option,
        address oldContract,
        address indexed newContract,
        address indexed admin
    );

    function testSetCollectionPhasesEmitsOldAndNewWindow() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        (uint256 oldStart, uint256 oldEnd) = deployed.minter.retrieveCollectionPhases(COLLECTION_ID);
        uint256 newStart = block.timestamp + 1 hours;
        uint256 newEnd = block.timestamp + 14 days;

        vm.expectEmit(true, true, false, true);
        emit CollectionPhasesUpdated(
            COLLECTION_ID, oldStart, oldEnd, newStart, newEnd, address(this)
        );
        deployed.minter.setCollectionPhases(COLLECTION_ID, newStart, newEnd);

        (uint256 actualStart, uint256 actualEnd) =
            deployed.minter.retrieveCollectionPhases(COLLECTION_ID);
        actualStart.assertEq(newStart, "phase start");
        actualEnd.assertEq(newEnd, "phase end");
    }

    function testBatchMintEmitsOneEventPerRecipientRange() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        address[] memory recipients = new address[](2);
        string[] memory tokenData = new string[](2);
        uint256[] memory salts = new uint256[](2);
        uint256[] memory quantities = new uint256[](2);
        recipients[0] = FIRST_RECIPIENT;
        recipients[1] = SECOND_RECIPIENT;
        tokenData[0] = "1,2,3";
        tokenData[1] = "4,5,6";
        salts[0] = 7;
        salts[1] = 8;
        quantities[0] = 1;
        quantities[1] = 2;

        vm.recordLogs();
        vm.prank(address(deployed.drops));
        uint256 lastMinted =
            deployed.minter.mint(recipients, tokenData, salts, COLLECTION_ID, quantities);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        lastMinted.assertEq(FIRST_TOKEN_ID + 2, "last minted token");
        _assertMinterTokensMintedLog(
            logs,
            address(deployed.minter),
            COLLECTION_ID,
            FIRST_TOKEN_ID,
            FIRST_RECIPIENT,
            FIRST_TOKEN_ID,
            1
        );
        _assertMinterTokensMintedLog(
            logs,
            address(deployed.minter),
            COLLECTION_ID,
            FIRST_TOKEN_ID + 1,
            SECOND_RECIPIENT,
            FIRST_TOKEN_ID + 2,
            2
        );
        _countTopic(logs, address(deployed.minter), MINTER_TOKENS_MINTED_TOPIC)
            .assertEq(2, "minted event count");
    }

    function testMintAndAuctionEmitsCustodyAndEndTime() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        address custody = address(0xA7C710);
        uint256 auctionEndTime = block.timestamp + 1 days;

        vm.recordLogs();
        vm.prank(address(deployed.drops));
        uint256 tokenId =
            deployed.minter.mintAndAuction(custody, "1,2,3", 7, COLLECTION_ID, auctionEndTime);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        tokenId.assertEq(FIRST_TOKEN_ID, "auction token");
        deployed.minter.getAuctionStatus(tokenId).assertTrue("auction status");
        deployed.minter.getAuctionEndTime(tokenId).assertEq(auctionEndTime, "auction end time");
        _assertMinterAuctionMintedLog(
            logs, address(deployed.minter), COLLECTION_ID, tokenId, custody, auctionEndTime
        );
    }

    function testUpdateAuctionEndTimeEmitsOldAndNewEndTime() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        uint256 oldAuctionEndTime = block.timestamp + 1 days;
        uint256 newAuctionEndTime = block.timestamp + 2 days;

        vm.prank(address(deployed.drops));
        uint256 tokenId = deployed.minter
            .mintAndAuction(address(0xA7C710), "1,2,3", 7, COLLECTION_ID, oldAuctionEndTime);

        vm.expectEmit(true, false, false, true);
        emit MinterAuctionEndTimeUpdated(
            tokenId, oldAuctionEndTime, newAuctionEndTime, address(this)
        );
        deployed.minter.updateAuctionEndTime(tokenId, newAuctionEndTime);

        deployed.minter.getAuctionEndTime(tokenId).assertEq(newAuctionEndTime, "new end time");
    }

    function testUpdateContractsEmitsReferenceEventsForValidOptions() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamCore newCore = new StreamCore(
            "6529 Stream Replacement",
            "STREAM2",
            address(deployed.admins),
            address(deployed.dependencyRegistry)
        );
        StreamAdmins newAdmins = new StreamAdmins(address(this));
        newAdmins.registerAdmin(address(this), true);
        StreamDrops newDrops = new StreamDrops(
            signerAddress(), address(deployed.minter), address(newAdmins), PAYOUT, CURATORS_POOL
        );

        vm.expectEmit(true, true, true, true);
        emit MinterContractReferenceUpdated(
            1, address(deployed.core), address(newCore), address(this)
        );
        deployed.minter.updateContracts(1, address(newCore));
        address(deployed.minter.gencore()).assertEq(address(newCore), "core reference");

        vm.expectEmit(true, true, true, true);
        emit MinterContractReferenceUpdated(
            2, address(deployed.admins), address(newAdmins), address(this)
        );
        deployed.minter.updateContracts(2, address(newAdmins));

        vm.expectEmit(true, true, true, true);
        emit MinterContractReferenceUpdated(
            3, address(deployed.drops), address(newDrops), address(this)
        );
        deployed.minter.updateContracts(3, address(newDrops));
        deployed.minter.streamDrops().assertEq(address(newDrops), "drops reference");
    }

    function testUpdateContractsRevertsForInvalidOption() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        vm.expectRevert(bytes("Bad option"));
        deployed.minter.updateContracts(99, address(0xBAD));
        address(deployed.minter.gencore()).assertEq(address(deployed.core), "core after invalid");
        deployed.minter.streamDrops().assertEq(address(deployed.drops), "drops after invalid");
    }

    function testUpdateContractsRejectsInvalidReferences() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        vm.expectRevert(bytes("Contract required"));
        deployed.minter.updateContracts(1, address(0xC0DE));
        vm.expectRevert(bytes("Contract required"));
        deployed.minter.updateContracts(3, address(0xD20A5));
        vm.expectRevert(bytes("Contract is not Core"));
        deployed.minter.updateContracts(1, address(deployed.drops));
        vm.expectRevert(bytes("Contract is not Drops"));
        deployed.minter.updateContracts(3, address(deployed.core));
    }

    function testUpdateContractsSkipsEventsForUnchangedOptions() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        vm.recordLogs();
        deployed.minter.updateContracts(1, address(deployed.core));
        deployed.minter.updateContracts(2, address(deployed.admins));
        deployed.minter.updateContracts(3, address(deployed.drops));
        _countTopic(
                vm.getRecordedLogs(),
                address(deployed.minter),
                MINTER_CONTRACT_REFERENCE_UPDATED_TOPIC
            ).assertEq(0, "unchanged reference event count");
    }

    function testMinterEndTimeUpdateDoesNotChangeAuthoritativeAuctionEndTime() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        StreamAuctions auctions = new StreamAuctions(
            address(deployed.minter),
            address(deployed.core),
            address(deployed.admins),
            address(deployed.drops),
            PAYOUT,
            CURATORS_POOL
        );
        deployed.drops.updateAuctionContract(address(auctions));
        uint256 auctionEndTime = block.timestamp + 601;
        StreamDrops.DropAuthorization memory authorization = buildAuctionAuthorization(
            deployed.drops,
            address(0xA7C710),
            address(0),
            "auction-data",
            COLLECTION_ID,
            RESERVE_PRICE,
            auctionEndTime,
            17,
            18,
            block.timestamp + 1 days
        );

        deployed.drops
            .mintDrop(
                authorization, "auction-data", signAuthorization(deployed.drops, authorization)
            );
        uint256 tokenId = FIRST_TOKEN_ID;
        uint256 minterEditedEndTime = auctionEndTime + 777;
        deployed.minter.updateAuctionEndTime(tokenId, minterEditedEndTime);

        deployed.minter.getAuctionEndTime(tokenId)
            .assertEq(minterEditedEndTime, "minter edited end");
        auctions.retrieveAuctionEndTime(tokenId).assertEq(auctionEndTime, "registered auction end");

        vm.deal(BIDDER, RESERVE_PRICE);
        vm.warp(auctionEndTime - 299);
        vm.prank(BIDDER);
        auctions.participateToAuction{ value: RESERVE_PRICE }(tokenId);

        auctions.retrieveAuctionEndTime(tokenId)
            .assertEq(auctionEndTime + 300, "authoritative extended end");
        deployed.minter.getAuctionEndTime(tokenId)
            .assertEq(minterEditedEndTime, "minter bridge remains stale");
    }

    function _assertMinterTokensMintedLog(
        Vm.Log[] memory logs,
        address emitter,
        uint256 collectionId,
        uint256 firstTokenId,
        address recipient,
        uint256 lastTokenId,
        uint256 quantity
    ) private pure {
        bool found = false;
        for (uint256 i; i < logs.length; i++) {
            if (logs[i].emitter != emitter || logs[i].topics[0] != MINTER_TOKENS_MINTED_TOPIC) {
                continue;
            }
            if (
                logs[i].topics[1] != bytes32(collectionId)
                    || logs[i].topics[2] != bytes32(firstTokenId)
                    || logs[i].topics[3] != bytes32(uint256(uint160(recipient)))
            ) {
                continue;
            }
            (uint256 actualLastTokenId, uint256 actualQuantity) =
                abi.decode(logs[i].data, (uint256, uint256));
            actualLastTokenId.assertEq(lastTokenId, "last token id");
            actualQuantity.assertEq(quantity, "quantity");
            found = true;
            break;
        }
        found.assertTrue("missing minter minted event");
    }

    function _assertMinterAuctionMintedLog(
        Vm.Log[] memory logs,
        address emitter,
        uint256 collectionId,
        uint256 tokenId,
        address custody,
        uint256 auctionEndTime
    ) private pure {
        bool found = false;
        for (uint256 i; i < logs.length; i++) {
            if (logs[i].emitter != emitter || logs[i].topics[0] != MINTER_AUCTION_MINTED_TOPIC) {
                continue;
            }
            logs[i].topics[1].assertEq(bytes32(collectionId), "auction collection");
            logs[i].topics[2].assertEq(bytes32(tokenId), "auction token");
            logs[i].topics[3].assertEq(bytes32(uint256(uint160(custody))), "auction custody");
            uint256 actualEndTime = abi.decode(logs[i].data, (uint256));
            actualEndTime.assertEq(auctionEndTime, "auction event end time");
            found = true;
            break;
        }
        found.assertTrue("missing minter auction event");
    }

    function _countTopic(Vm.Log[] memory logs, address emitter, bytes32 topic)
        private
        pure
        returns (uint256 count)
    {
        for (uint256 i; i < logs.length; i++) {
            if (logs[i].emitter == emitter && logs[i].topics[0] == topic) {
                count++;
            }
        }
    }
}
