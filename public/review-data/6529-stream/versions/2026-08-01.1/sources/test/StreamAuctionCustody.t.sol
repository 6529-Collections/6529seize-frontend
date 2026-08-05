// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/AuctionContract.sol";
import "../smart-contracts/StreamDrops.sol";
import "./helpers/Assertions.sol";
import "./helpers/DropAuthTestHelper.sol";
import "./helpers/StreamFixture.sol";

contract StreamAuctionCustodyTest is DropAuthTestHelper, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for uint256;

    address private constant POSTER = address(0x1001);
    address private constant PAYOUT = address(0x2002);
    address private constant CURATORS_POOL = address(0x3003);
    address private constant BIDDER = address(0x4004);
    address private constant SECOND_BIDDER = address(0x5005);
    address private constant RECIPIENT = address(0x6006);

    uint256 private constant RESERVE_PRICE = 5 ether;

    function testRegisteredAuctionStartsActiveWithEscrowCustody() public {
        AuctionSetup memory setup = _createAuction(POSTER, block.timestamp + 1 days, 1);

        setup.deployed.core.ownerOf(setup.tokenId)
            .assertEq(address(setup.auctions), "escrow custody");
        uint256(setup.auctions.retrieveAuctionStatus(setup.tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.Active), "status");
        setup.auctions.retrieveAuctionEndTime(setup.tokenId)
            .assertEq(setup.auctionEndTime, "end time");
    }

    function testUnregisteredAuctionCannotReceiveBid() public {
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
        vm.deal(BIDDER, 10 ether);

        vm.prank(BIDDER);
        (bool success,) = address(auctions).call{ value: RESERVE_PRICE }(
            abi.encodeWithSelector(auctions.participateToAuction.selector, 1)
        );

        success.assertFalse("unregistered bid accepted");
    }

    function testStatusDerivesEndedNoBidAndRejectsLateBid() public {
        AuctionSetup memory setup = _createAuction(POSTER, block.timestamp + 1 days, 2);
        vm.deal(BIDDER, 10 ether);
        vm.warp(setup.auctionEndTime + 1);

        uint256(setup.auctions.retrieveAuctionStatus(setup.tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.EndedNoBid), "status");
        vm.prank(BIDDER);
        (bool success,) = address(setup.auctions).call{ value: RESERVE_PRICE }(
            abi.encodeWithSelector(setup.auctions.participateToAuction.selector, setup.tokenId)
        );

        success.assertFalse("late bid accepted");
    }

    function testNoBidSettlementIsPermissionlessAndTerminal() public {
        AuctionSetup memory setup = _createAuction(POSTER, block.timestamp + 1 days, 3);
        vm.warp(setup.auctionEndTime + 1);

        vm.prank(BIDDER);
        setup.auctions.claimAuction(setup.tokenId);

        setup.deployed.core.ownerOf(setup.tokenId).assertEq(POSTER, "poster owner");
        uint256(setup.auctions.retrieveAuctionStatus(setup.tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.SettledNoBid), "status");

        (bool secondClaimSuccess,) = address(setup.auctions)
            .call(abi.encodeWithSelector(setup.auctions.claimAuction.selector, setup.tokenId));
        secondClaimSuccess.assertFalse("second no-bid settlement accepted");

        vm.deal(SECOND_BIDDER, 10 ether);
        vm.prank(SECOND_BIDDER);
        (bool bidSuccess,) = address(setup.auctions).call{ value: RESERVE_PRICE }(
            abi.encodeWithSelector(setup.auctions.participateToAuction.selector, setup.tokenId)
        );
        bidSuccess.assertFalse("post-settlement bid accepted");
    }

    function testNoBidContractPosterCreatesPendingClaimAndCanCompleteToReceiver() public {
        NonReceiverPoster poster = new NonReceiverPoster();
        AuctionSetup memory setup = _createAuction(address(poster), block.timestamp + 1 days, 4);
        vm.warp(setup.auctionEndTime + 1);

        setup.auctions.claimAuction(setup.tokenId);

        setup.deployed.core.ownerOf(setup.tokenId)
            .assertEq(address(setup.auctions), "token left escrow");
        setup.auctions.pendingNoBidNftClaimant(setup.tokenId)
            .assertEq(address(poster), "pending claimant");
        setup.auctions.retrieveNoBidAuctionClaimant(setup.tokenId)
            .assertEq(address(poster), "claimant alias");
        uint256(setup.auctions.retrieveAuctionStatus(setup.tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.EndedNoBid), "status");

        (bool unauthorizedClaimSuccess,) = address(setup.auctions)
            .call(
                abi.encodeWithSelector(
                    setup.auctions.claimNoBidAuctionToken.selector, setup.tokenId, RECIPIENT
                )
            );
        unauthorizedClaimSuccess.assertFalse("unauthorized claim completed");

        poster.claim(setup.auctions, setup.tokenId, RECIPIENT);

        setup.deployed.core.ownerOf(setup.tokenId).assertEq(RECIPIENT, "recipient owner");
        setup.auctions.pendingNoBidNftClaimant(setup.tokenId)
            .assertEq(address(0), "pending claimant cleared");
        setup.auctions.retrieveNoBidAuctionClaimant(setup.tokenId)
            .assertEq(address(0), "claimant alias cleared");
        uint256(setup.auctions.retrieveAuctionStatus(setup.tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.SettledNoBid), "settled status");
    }

    function testNoBidContractPosterClaimFailureRollsBack() public {
        NonReceiverPoster poster = new NonReceiverPoster();
        NonReceiverRecipient rejectingRecipient = new NonReceiverRecipient();
        AuctionSetup memory setup = _createAuction(address(poster), block.timestamp + 1 days, 5);
        vm.warp(setup.auctionEndTime + 1);
        setup.auctions.claimAuction(setup.tokenId);

        (bool success,) = address(poster)
            .call(
                abi.encodeWithSelector(
                    poster.claim.selector,
                    setup.auctions,
                    setup.tokenId,
                    address(rejectingRecipient)
                )
            );

        success.assertFalse("claim to rejecting recipient succeeded");
        setup.deployed.core.ownerOf(setup.tokenId)
            .assertEq(address(setup.auctions), "token left escrow");
        setup.auctions.pendingNoBidNftClaimant(setup.tokenId)
            .assertEq(address(poster), "pending claim cleared");
        setup.auctions.retrieveNoBidAuctionClaimant(setup.tokenId)
            .assertEq(address(poster), "claim alias preserved");
        uint256(setup.auctions.retrieveAuctionStatus(setup.tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.EndedNoBid), "status advanced");
    }

    function testWithBidSettlementFailureLeavesEscrowAndCreditsUnchanged() public {
        NonReceiverBidder bidder = new NonReceiverBidder();
        AuctionSetup memory setup = _createAuction(POSTER, block.timestamp + 1 days, 6);
        vm.deal(address(bidder), 10 ether);

        bidder.bid{ value: RESERVE_PRICE }(setup.auctions, setup.tokenId);
        vm.warp(setup.auctionEndTime + 1);

        (bool success,) = address(setup.auctions)
            .call(abi.encodeWithSelector(setup.auctions.claimAuction.selector, setup.tokenId));

        success.assertFalse("settlement to non-receiver succeeded");
        setup.deployed.core.ownerOf(setup.tokenId)
            .assertEq(address(setup.auctions), "token left escrow");
        uint256(setup.auctions.retrieveAuctionStatus(setup.tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.EndedWithBid), "status");
        setup.auctions.totalAuctionBidEscrow().assertEq(RESERVE_PRICE, "escrow released");
        setup.auctions.totalProceedsOwed().assertEq(0, "proceeds credited");
    }

    function testCancelBeforeBidReturnsCustodyAndBlocksBids() public {
        AuctionSetup memory setup = _createAuction(POSTER, block.timestamp + 1 days, 7);

        vm.prank(POSTER);
        setup.auctions.cancelAuction(setup.tokenId);

        setup.deployed.core.ownerOf(setup.tokenId).assertEq(POSTER, "poster owner");
        uint256(setup.auctions.retrieveAuctionStatus(setup.tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.Cancelled), "status");

        vm.deal(BIDDER, 10 ether);
        vm.prank(BIDDER);
        (bool success,) = address(setup.auctions).call{ value: RESERVE_PRICE }(
            abi.encodeWithSelector(setup.auctions.participateToAuction.selector, setup.tokenId)
        );
        success.assertFalse("bid accepted after cancellation");
    }

    function testCancelAfterFirstBidFailsAndPreservesEscrow() public {
        AuctionSetup memory setup = _createAuction(POSTER, block.timestamp + 1 days, 8);
        vm.deal(BIDDER, 10 ether);

        vm.prank(BIDDER);
        setup.auctions.participateToAuction{ value: RESERVE_PRICE }(setup.tokenId);

        vm.prank(POSTER);
        (bool success,) = address(setup.auctions)
            .call(abi.encodeWithSelector(setup.auctions.cancelAuction.selector, setup.tokenId));

        success.assertFalse("post-bid cancellation succeeded");
        setup.deployed.core.ownerOf(setup.tokenId)
            .assertEq(address(setup.auctions), "token left escrow");
        setup.auctions.totalAuctionBidEscrow().assertEq(RESERVE_PRICE, "escrow changed");
        uint256(setup.auctions.retrieveAuctionStatus(setup.tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.Active), "status changed");
    }

    function testBidNearEndExtendsAuctionRecord() public {
        AuctionSetup memory setup = _createAuction(POSTER, block.timestamp + 601, 9);
        vm.deal(BIDDER, 10 ether);
        vm.warp(setup.auctionEndTime - 299);

        vm.prank(BIDDER);
        setup.auctions.participateToAuction{ value: RESERVE_PRICE }(setup.tokenId);

        setup.auctions.retrieveAuctionEndTime(setup.tokenId)
            .assertEq(setup.auctionEndTime + 300, "auction end");
        deployedMinterEnd(setup).assertEq(setup.auctionEndTime, "legacy minter end");
    }

    struct AuctionSetup {
        DeployedStream deployed;
        StreamAuctions auctions;
        uint256 tokenId;
        uint256 auctionEndTime;
    }

    function _createAuction(address poster, uint256 auctionEndTime, uint256 saltSeed)
        private
        returns (AuctionSetup memory setup)
    {
        setup.deployed = deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        setup.auctions = new StreamAuctions(
            address(setup.deployed.minter),
            address(setup.deployed.core),
            address(setup.deployed.admins),
            address(setup.deployed.drops),
            PAYOUT,
            CURATORS_POOL
        );
        setup.deployed.drops.updateAuctionContract(address(setup.auctions));
        setup.auctionEndTime = auctionEndTime;
        StreamDrops.DropAuthorization memory authorization = buildAuctionAuthorization(
            setup.deployed.drops,
            poster,
            address(0),
            "auction-data",
            1,
            RESERVE_PRICE,
            auctionEndTime,
            saltSeed * 2,
            saltSeed * 2 + 1,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(setup.deployed.drops, authorization);

        setup.deployed.drops.mintDrop(authorization, "auction-data", signature);
        setup.tokenId = 1;
    }

    function deployedMinterEnd(AuctionSetup memory setup) private view returns (uint256) {
        return setup.deployed.minter.getAuctionEndTime(setup.tokenId);
    }
}

contract NonReceiverPoster {
    function claim(StreamAuctions auctions, uint256 tokenId, address recipient) external {
        auctions.claimNoBidAuctionToken(tokenId, recipient);
    }
}

contract NonReceiverBidder {
    function bid(StreamAuctions auctions, uint256 tokenId) external payable {
        auctions.participateToAuction{ value: msg.value }(tokenId);
    }
}

contract NonReceiverRecipient { }
