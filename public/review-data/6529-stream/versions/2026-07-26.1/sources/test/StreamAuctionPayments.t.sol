// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/AuctionContract.sol";
import "../smart-contracts/StreamDrops.sol";
import "./helpers/Assertions.sol";
import "./helpers/DropAuthTestHelper.sol";
import "./helpers/StreamFixture.sol";

contract StreamAuctionPaymentsTest is DropAuthTestHelper, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for uint256;

    event OutbidCreditCreated(
        address indexed _add, uint256 indexed tokenid, uint256 indexed credit
    );
    event BidderCreditWithdrawn(
        address indexed _add, address indexed _recipient, uint256 indexed funds
    );

    address private constant POSTER = address(0x1001);
    address private constant PAYOUT = address(0x2002);
    address private constant CURATORS_POOL = address(0x3003);
    address private constant FIRST_BIDDER = address(0x4004);
    address private constant SECOND_BIDDER = address(0x5005);
    address private constant WITHDRAW_RECIPIENT = address(0x6006);

    uint256 private constant RESERVE_PRICE = 5 ether;
    uint256 private constant MIN_OUTBID = 21 ether / 4;

    function testMinimumNextBidTracksReserveAndOutbidThreshold() public {
        AuctionSetup memory setup = _createAuction();
        vm.deal(FIRST_BIDDER, 10 ether);
        vm.deal(SECOND_BIDDER, 10 ether);

        setup.auctions.minimumNextBid(setup.tokenId).assertEq(RESERVE_PRICE, "reserve minimum");

        vm.prank(FIRST_BIDDER);
        setup.auctions.participateToAuction{ value: setup.auctions.minimumNextBid(setup.tokenId) }(
            setup.tokenId
        );

        uint256 nextBid = setup.auctions.minimumNextBid(setup.tokenId);
        nextBid.assertEq(MIN_OUTBID, "outbid minimum");

        vm.prank(SECOND_BIDDER);
        (bool underbidSuccess,) = address(setup.auctions).call{ value: nextBid - 1 }(
            abi.encodeWithSelector(setup.auctions.participateToAuction.selector, setup.tokenId)
        );
        underbidSuccess.assertFalse("below helper minimum succeeded");

        vm.prank(SECOND_BIDDER);
        setup.auctions.participateToAuction{ value: nextBid }(setup.tokenId);

        setup.auctions.auctionHighestBid(setup.tokenId).assertEq(nextBid, "highest bid");
        setup.auctions.auctionHighestBidder(setup.tokenId).assertEq(SECOND_BIDDER, "bidder");
    }

    function testMinimumNextBidPreservesZeroAndHighIncrementRules() public {
        AuctionSetup memory zeroSetup = _createAuction();
        vm.deal(FIRST_BIDDER, 10 ether);
        vm.deal(SECOND_BIDDER, 10 ether);

        zeroSetup.auctions.updatePercentAndExtensionTime(1, 0);
        vm.prank(FIRST_BIDDER);
        zeroSetup.auctions
        .participateToAuction{ value: zeroSetup.auctions.minimumNextBid(zeroSetup.tokenId) }(
            zeroSetup.tokenId
        );
        zeroSetup.auctions.minimumNextBid(zeroSetup.tokenId)
            .assertEq(RESERVE_PRICE, "zero increment minimum");
        vm.prank(SECOND_BIDDER);
        zeroSetup.auctions
        .participateToAuction{ value: zeroSetup.auctions.minimumNextBid(zeroSetup.tokenId) }(
            zeroSetup.tokenId
        );
        zeroSetup.auctions.auctionHighestBid(zeroSetup.tokenId)
            .assertEq(RESERVE_PRICE, "zero increment bid");

        AuctionSetup memory highSetup = _createAuction();
        highSetup.auctions.updatePercentAndExtensionTime(1, 200);
        vm.deal(FIRST_BIDDER, 10 ether);
        vm.deal(SECOND_BIDDER, 20 ether);
        vm.prank(FIRST_BIDDER);
        highSetup.auctions
        .participateToAuction{ value: highSetup.auctions.minimumNextBid(highSetup.tokenId) }(
            highSetup.tokenId
        );

        uint256 highMinimum = highSetup.auctions.minimumNextBid(highSetup.tokenId);
        highMinimum.assertEq(15 ether, "high increment minimum");
        vm.prank(SECOND_BIDDER);
        highSetup.auctions.participateToAuction{ value: highMinimum }(highSetup.tokenId);
        highSetup.auctions.auctionHighestBid(highSetup.tokenId)
            .assertEq(highMinimum, "high increment bid");
    }

    function testMinimumNextBidPreservesIntegerFloorOutbidRule() public {
        AuctionSetup memory setup = _createAuctionForPosterAndReserve(POSTER, 1 wei);
        vm.deal(FIRST_BIDDER, 1 ether);
        vm.deal(SECOND_BIDDER, 1 ether);

        setup.auctions.minimumNextBid(setup.tokenId).assertEq(1 wei, "reserve minimum");

        vm.prank(FIRST_BIDDER);
        setup.auctions.participateToAuction{ value: 1 wei }(setup.tokenId);

        setup.auctions.minimumNextBid(setup.tokenId).assertEq(1 wei, "floored outbid minimum");

        vm.prank(SECOND_BIDDER);
        (bool underbidSuccess,) = address(setup.auctions).call{ value: 0 }(
            abi.encodeWithSelector(setup.auctions.participateToAuction.selector, setup.tokenId)
        );
        underbidSuccess.assertFalse("zero underbid succeeded");

        uint256 flooredMinimum = setup.auctions.minimumNextBid(setup.tokenId);
        vm.prank(SECOND_BIDDER);
        setup.auctions.participateToAuction{ value: flooredMinimum }(setup.tokenId);

        setup.auctions.auctionHighestBid(setup.tokenId).assertEq(1 wei, "floored outbid");
        setup.auctions.auctionHighestBidder(setup.tokenId).assertEq(SECOND_BIDDER, "bidder");
        setup.auctions.auctionBidderCredits(FIRST_BIDDER).assertEq(1 wei, "previous bidder credit");
    }

    function testMinimumNextBidFailsClosedWhenAuctionIsNotActive() public {
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

        vm.expectRevert(bytes("No auction"));
        auctions.minimumNextBid(1);

        AuctionSetup memory endedNoBidSetup = _createAuction();
        vm.warp(endedNoBidSetup.auctionEndTime + 1);
        vm.expectRevert(bytes("Not active"));
        endedNoBidSetup.auctions.minimumNextBid(endedNoBidSetup.tokenId);

        AuctionSetup memory endedWithBidSetup = _createAuction();
        vm.deal(FIRST_BIDDER, 10 ether);
        vm.prank(FIRST_BIDDER);
        endedWithBidSetup.auctions.participateToAuction{ value: RESERVE_PRICE }(
            endedWithBidSetup.tokenId
        );
        vm.warp(endedWithBidSetup.auctionEndTime + 1);
        vm.expectRevert(bytes("Not active"));
        endedWithBidSetup.auctions.minimumNextBid(endedWithBidSetup.tokenId);

        AuctionSetup memory settledNoBidSetup = _createAuction();
        vm.warp(settledNoBidSetup.auctionEndTime + 1);
        settledNoBidSetup.auctions.claimAuction(settledNoBidSetup.tokenId);
        vm.expectRevert(bytes("Not active"));
        settledNoBidSetup.auctions.minimumNextBid(settledNoBidSetup.tokenId);

        AuctionSetup memory settledWithBidSetup = _createAuction();
        vm.deal(FIRST_BIDDER, 10 ether);
        vm.prank(FIRST_BIDDER);
        settledWithBidSetup.auctions.participateToAuction{ value: RESERVE_PRICE }(
            settledWithBidSetup.tokenId
        );
        vm.warp(settledWithBidSetup.auctionEndTime + 1);
        settledWithBidSetup.auctions.claimAuction(settledWithBidSetup.tokenId);
        vm.expectRevert(bytes("Not active"));
        settledWithBidSetup.auctions.minimumNextBid(settledWithBidSetup.tokenId);

        AuctionSetup memory cancelledSetup = _createAuction();
        vm.prank(POSTER);
        cancelledSetup.auctions.cancelAuction(cancelledSetup.tokenId);
        vm.expectRevert(bytes("Not active"));
        cancelledSetup.auctions.minimumNextBid(cancelledSetup.tokenId);
    }

    function testRejectingPreviousBidderCannotBlockHigherBid() public {
        AuctionSetup memory setup = _createAuction();
        RejectingBidder rejectingBidder = new RejectingBidder();
        vm.deal(address(rejectingBidder), 10 ether);
        vm.deal(SECOND_BIDDER, 10 ether);

        rejectingBidder.bid{ value: RESERVE_PRICE }(setup.auctions, setup.tokenId);

        vm.expectEmit(true, true, true, false);
        emit OutbidCreditCreated(address(rejectingBidder), setup.tokenId, RESERVE_PRICE);
        vm.prank(SECOND_BIDDER);
        setup.auctions.participateToAuction{ value: MIN_OUTBID }(setup.tokenId);

        setup.auctions.auctionHighestBid(setup.tokenId).assertEq(MIN_OUTBID, "highest bid");
        setup.auctions.auctionHighestBidder(setup.tokenId).assertEq(SECOND_BIDDER, "highest bidder");
        setup.auctions.auctionBidderCredits(address(rejectingBidder))
            .assertEq(RESERVE_PRICE, "previous bidder credit");
        setup.auctions.totalBidderOwed().assertEq(RESERVE_PRICE, "total bidder owed");
        setup.auctions.totalAuctionBidEscrow().assertEq(MIN_OUTBID, "active bid escrow");
        setup.auctions.totalOwed().assertEq(RESERVE_PRICE + MIN_OUTBID, "total owed");
        setup.auctions.emergencyWithdrawable().assertEq(0, "surplus");
    }

    function testPreviousBidderWithdrawsCreditToChosenRecipient() public {
        AuctionSetup memory setup = _createAuction();
        RejectingBidder rejectingBidder = new RejectingBidder();
        vm.deal(address(rejectingBidder), 10 ether);
        vm.deal(SECOND_BIDDER, 10 ether);

        rejectingBidder.bid{ value: RESERVE_PRICE }(setup.auctions, setup.tokenId);
        vm.prank(SECOND_BIDDER);
        setup.auctions.participateToAuction{ value: MIN_OUTBID }(setup.tokenId);

        uint256 recipientBalanceBefore = WITHDRAW_RECIPIENT.balance;
        vm.expectEmit(true, true, true, false);
        emit BidderCreditWithdrawn(address(rejectingBidder), WITHDRAW_RECIPIENT, RESERVE_PRICE);
        rejectingBidder.withdrawCredit(setup.auctions, payable(WITHDRAW_RECIPIENT));

        setup.auctions.auctionBidderCredits(address(rejectingBidder))
            .assertEq(0, "credit not consumed");
        setup.auctions.totalBidderOwed().assertEq(0, "total bidder owed not reduced");
        setup.auctions.totalAuctionBidEscrow().assertEq(MIN_OUTBID, "active bid escrow changed");
        WITHDRAW_RECIPIENT.balance
            .assertEq(recipientBalanceBefore + RESERVE_PRICE, "recipient balance");
    }

    function testCreditWithdrawalFailurePreservesCredit() public {
        AuctionSetup memory setup = _createAuction();
        RejectingBidder rejectingRecipient = new RejectingBidder();
        vm.deal(FIRST_BIDDER, 10 ether);
        vm.deal(SECOND_BIDDER, 10 ether);

        vm.prank(FIRST_BIDDER);
        setup.auctions.participateToAuction{ value: RESERVE_PRICE }(setup.tokenId);
        vm.prank(SECOND_BIDDER);
        setup.auctions.participateToAuction{ value: MIN_OUTBID }(setup.tokenId);

        vm.prank(FIRST_BIDDER);
        (bool success,) = address(setup.auctions)
            .call(
                abi.encodeWithSelector(
                    setup.auctions.withdrawBidderCreditTo.selector,
                    payable(address(rejectingRecipient))
                )
            );

        success.assertFalse("failed withdrawal succeeded");
        setup.auctions.auctionBidderCredits(FIRST_BIDDER)
            .assertEq(RESERVE_PRICE, "credit was erased");
        setup.auctions.totalBidderOwed().assertEq(RESERVE_PRICE, "total owed changed");
    }

    function testReentrantCreditWithdrawalCannotDrainMoreThanCredit() public {
        AuctionSetup memory setup = _createAuction();
        ReentrantBidder reentrantBidder = new ReentrantBidder();
        vm.deal(address(reentrantBidder), 10 ether);
        vm.deal(SECOND_BIDDER, 10 ether);

        reentrantBidder.bid{ value: RESERVE_PRICE }(setup.auctions, setup.tokenId);
        vm.prank(SECOND_BIDDER);
        setup.auctions.participateToAuction{ value: MIN_OUTBID }(setup.tokenId);

        uint256 reentrantBalanceBefore = address(reentrantBidder).balance;
        reentrantBidder.withdrawToSelf(setup.auctions);

        reentrantBidder.reentered().assertFalse("reentrant withdrawal succeeded");
        setup.auctions.auctionBidderCredits(address(reentrantBidder))
            .assertEq(0, "credit not consumed");
        setup.auctions.totalBidderOwed().assertEq(0, "total bidder owed not reduced");
        address(reentrantBidder).balance
            .assertEq(reentrantBalanceBefore + RESERVE_PRICE, "withdrawn balance");
        setup.auctions.totalAuctionBidEscrow().assertEq(MIN_OUTBID, "active bid escrow changed");
    }

    function testBidOneWeiBelowMinimumFailsWithoutCreditingPreviousBidder() public {
        AuctionSetup memory setup = _createAuction();
        vm.deal(FIRST_BIDDER, 10 ether);
        vm.deal(SECOND_BIDDER, 10 ether);

        vm.prank(FIRST_BIDDER);
        setup.auctions.participateToAuction{ value: RESERVE_PRICE }(setup.tokenId);

        vm.prank(SECOND_BIDDER);
        (bool success,) = address(setup.auctions).call{ value: MIN_OUTBID - 1 }(
            abi.encodeWithSelector(setup.auctions.participateToAuction.selector, setup.tokenId)
        );

        success.assertFalse("underbid succeeded");
        setup.auctions.auctionHighestBid(setup.tokenId).assertEq(RESERVE_PRICE, "highest bid");
        setup.auctions.auctionHighestBidder(setup.tokenId).assertEq(FIRST_BIDDER, "highest bidder");
        setup.auctions.auctionBidderCredits(FIRST_BIDDER).assertEq(0, "underbid created credit");
        setup.auctions.totalBidderOwed().assertEq(0, "total bidder owed");
        setup.auctions.totalAuctionBidEscrow().assertEq(RESERVE_PRICE, "active bid escrow");
    }

    function testBidExactlyAtMinimumPassesAndCreditsPreviousBidder() public {
        AuctionSetup memory setup = _createAuction();
        vm.deal(FIRST_BIDDER, 10 ether);
        vm.deal(SECOND_BIDDER, 10 ether);

        vm.prank(FIRST_BIDDER);
        setup.auctions.participateToAuction{ value: RESERVE_PRICE }(setup.tokenId);
        vm.prank(SECOND_BIDDER);
        setup.auctions.participateToAuction{ value: MIN_OUTBID }(setup.tokenId);

        setup.auctions.auctionHighestBid(setup.tokenId).assertEq(MIN_OUTBID, "highest bid");
        setup.auctions.auctionHighestBidder(setup.tokenId).assertEq(SECOND_BIDDER, "highest bidder");
        setup.auctions.auctionBidderCredits(FIRST_BIDDER)
            .assertEq(RESERVE_PRICE, "previous bidder credit");
    }

    function testZeroAndHighIncrementRulesAreApplied() public {
        AuctionSetup memory zeroSetup = _createAuction();
        vm.deal(FIRST_BIDDER, 10 ether);
        vm.deal(SECOND_BIDDER, 10 ether);

        zeroSetup.auctions.updatePercentAndExtensionTime(1, 0);
        vm.prank(FIRST_BIDDER);
        zeroSetup.auctions.participateToAuction{ value: RESERVE_PRICE }(zeroSetup.tokenId);
        vm.prank(SECOND_BIDDER);
        zeroSetup.auctions.participateToAuction{ value: RESERVE_PRICE }(zeroSetup.tokenId);
        zeroSetup.auctions.auctionHighestBid(zeroSetup.tokenId)
            .assertEq(RESERVE_PRICE, "zero increment bid");

        AuctionSetup memory highSetup = _createAuction();
        highSetup.auctions.updatePercentAndExtensionTime(1, 200);
        vm.deal(FIRST_BIDDER, 10 ether);
        vm.deal(SECOND_BIDDER, 20 ether);
        vm.prank(FIRST_BIDDER);
        highSetup.auctions.participateToAuction{ value: RESERVE_PRICE }(highSetup.tokenId);

        vm.prank(SECOND_BIDDER);
        (bool underbidSuccess,) = address(highSetup.auctions).call{ value: 15 ether - 1 }(
            abi.encodeWithSelector(
                highSetup.auctions.participateToAuction.selector, highSetup.tokenId
            )
        );
        underbidSuccess.assertFalse("high increment underbid succeeded");

        vm.prank(SECOND_BIDDER);
        highSetup.auctions.participateToAuction{ value: 15 ether }(highSetup.tokenId);
        highSetup.auctions.auctionHighestBid(highSetup.tokenId)
            .assertEq(15 ether, "high increment bid");
    }

    function testEmergencyWithdrawCannotDrainBidCreditsOrActiveBidEscrow() public {
        AuctionSetup memory setup = _createAuction();
        vm.deal(FIRST_BIDDER, 10 ether);
        vm.deal(SECOND_BIDDER, 10 ether);

        vm.prank(FIRST_BIDDER);
        setup.auctions.participateToAuction{ value: RESERVE_PRICE }(setup.tokenId);
        vm.prank(SECOND_BIDDER);
        setup.auctions.participateToAuction{ value: MIN_OUTBID }(setup.tokenId);

        uint256 balanceBefore = address(setup.auctions).balance;
        setup.auctions.emergencyWithdraw();

        address(setup.auctions).balance.assertEq(balanceBefore, "emergency drained owed funds");
        setup.auctions.totalBidderOwed().assertEq(RESERVE_PRICE, "bidder owed changed");
        setup.auctions.totalAuctionBidEscrow().assertEq(MIN_OUTBID, "escrow changed");
    }

    function testEmergencyWithdrawOnlyWithdrawsAuctionLocalSurplus() public {
        AuctionSetup memory setup = _createAuction();
        vm.deal(FIRST_BIDDER, 10 ether);
        vm.deal(SECOND_BIDDER, 10 ether);

        vm.prank(FIRST_BIDDER);
        setup.auctions.participateToAuction{ value: RESERVE_PRICE }(setup.tokenId);
        vm.prank(SECOND_BIDDER);
        setup.auctions.participateToAuction{ value: MIN_OUTBID }(setup.tokenId);

        uint256 surplus = 1 ether;
        uint256 owed = setup.auctions.totalOwed();
        uint256 balanceBefore = address(setup.auctions).balance;
        vm.deal(address(setup.auctions), balanceBefore + surplus);
        setup.deployed.admins.updateEmergencyRecipient(PAYOUT);

        uint256 payoutBefore = PAYOUT.balance;
        setup.auctions.emergencyWithdraw();

        address(setup.auctions).balance.assertEq(owed, "owed balance not preserved");
        PAYOUT.balance.assertEq(payoutBefore + surplus, "surplus not withdrawn");
        setup.auctions.totalBidderOwed().assertEq(RESERVE_PRICE, "bidder owed changed");
        setup.auctions.totalAuctionBidEscrow().assertEq(MIN_OUTBID, "escrow changed");
        setup.auctions.emergencyWithdrawable().assertEq(0, "surplus remained");
    }

    function testForcedEthOnlyIncreasesAuctionLocalSurplus() public {
        AuctionSetup memory setup = _createAuction();
        vm.deal(FIRST_BIDDER, 10 ether);

        vm.prank(FIRST_BIDDER);
        setup.auctions.participateToAuction{ value: RESERVE_PRICE }(setup.tokenId);

        uint256 owedBefore = setup.auctions.totalOwed();
        uint256 balanceBefore = address(setup.auctions).balance;
        ForceEth forceEth = new ForceEth{ value: 1 ether }();
        forceEth.force(payable(address(setup.auctions)));

        address(setup.auctions).balance.assertEq(balanceBefore + 1 ether, "forced balance");
        setup.auctions.totalOwed().assertEq(owedBefore, "owed changed");
        setup.auctions.emergencyWithdrawable().assertEq(1 ether, "surplus not exposed");
    }

    function testProceedsRecipientConfigurationRejectsZeroAddresses() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());

        _tryDeployAuctions(deployed, address(0), CURATORS_POOL)
            .assertFalse("zero payout constructor accepted");
        _tryDeployAuctions(deployed, PAYOUT, address(0))
            .assertFalse("zero curator constructor accepted");

        StreamAuctions auctions = new StreamAuctions(
            address(deployed.minter),
            address(deployed.core),
            address(deployed.admins),
            address(deployed.drops),
            PAYOUT,
            CURATORS_POOL
        );

        (bool payoutSuccess,) = address(auctions)
            .call(abi.encodeWithSelector(auctions.updatePayOutAddress.selector, address(0)));
        (bool curatorSuccess,) = address(auctions)
            .call(abi.encodeWithSelector(auctions.updateCuratorsPoolAddress.selector, address(0)));

        payoutSuccess.assertFalse("zero payout setter accepted");
        curatorSuccess.assertFalse("zero curator setter accepted");
        auctions.payOutAddress().assertEq(PAYOUT, "payout changed");
        auctions.curatorsPoolAddress().assertEq(CURATORS_POOL, "curator changed");
    }

    function testWithBidSettlementIsIdempotentAndReleasesActiveEscrow() public {
        AuctionSetup memory setup = _createAuction();
        vm.deal(FIRST_BIDDER, 10 ether);

        vm.prank(FIRST_BIDDER);
        setup.auctions.participateToAuction{ value: RESERVE_PRICE }(setup.tokenId);
        vm.warp(setup.auctionEndTime + 1);

        uint256 posterBalanceBefore = POSTER.balance;
        uint256 payoutBalanceBefore = PAYOUT.balance;
        uint256 curatorsBalanceBefore = CURATORS_POOL.balance;

        setup.auctions.claimAuction(setup.tokenId);

        setup.deployed.core.ownerOf(setup.tokenId).assertEq(FIRST_BIDDER, "winner owner");
        setup.auctions.totalAuctionBidEscrow().assertEq(0, "escrow not released");
        POSTER.balance.assertEq(posterBalanceBefore, "poster was push-paid");
        PAYOUT.balance.assertEq(payoutBalanceBefore, "protocol was push-paid");
        CURATORS_POOL.balance.assertEq(curatorsBalanceBefore, "curator was push-paid");
        setup.auctions.auctionPosterCredits(POSTER).assertEq(RESERVE_PRICE / 2, "poster credit");
        setup.auctions.auctionProtocolCredits(PAYOUT).assertEq(RESERVE_PRICE / 4, "protocol credit");
        setup.auctions.auctionCuratorCredits(CURATORS_POOL)
            .assertEq(RESERVE_PRICE / 4, "curator credit");
        setup.auctions.totalProceedsOwed().assertEq(RESERVE_PRICE, "proceeds owed");
        setup.auctions.totalOwed().assertEq(RESERVE_PRICE, "total owed");

        uint256 contractBalanceBefore = address(setup.auctions).balance;
        (bool secondClaimSuccess,) = address(setup.auctions)
            .call(abi.encodeWithSelector(setup.auctions.claimAuction.selector, setup.tokenId));

        secondClaimSuccess.assertFalse("second settlement succeeded");
        address(setup.auctions).balance.assertEq(contractBalanceBefore, "balance changed");
        setup.deployed.core.ownerOf(setup.tokenId).assertEq(FIRST_BIDDER, "owner changed");

        vm.prank(POSTER);
        setup.auctions.withdrawAuctionProceedsCredit();
        vm.prank(PAYOUT);
        setup.auctions.withdrawAuctionProceedsCredit();
        vm.prank(CURATORS_POOL);
        setup.auctions.withdrawAuctionProceedsCredit();

        POSTER.balance.assertEq(posterBalanceBefore + (RESERVE_PRICE / 2), "poster payout");
        PAYOUT.balance.assertEq(payoutBalanceBefore + (RESERVE_PRICE / 4), "protocol payout");
        CURATORS_POOL.balance
            .assertEq(curatorsBalanceBefore + (RESERVE_PRICE / 4), "curators payout");
        setup.auctions.totalOwed().assertEq(0, "owed balance after withdrawals");
    }

    function testProceedsRemainderAccruesToProtocolCredit() public {
        AuctionSetup memory setup = _createAuctionForPosterAndReserve(POSTER, 7 wei);
        vm.deal(FIRST_BIDDER, 1 ether);

        vm.prank(FIRST_BIDDER);
        setup.auctions.participateToAuction{ value: 7 wei }(setup.tokenId);
        vm.warp(setup.auctionEndTime + 1);
        setup.auctions.claimAuction(setup.tokenId);

        setup.auctions.auctionPosterCredits(POSTER).assertEq(3 wei, "poster credit");
        setup.auctions.auctionProtocolCredits(PAYOUT).assertEq(3 wei, "protocol credit");
        setup.auctions.auctionCuratorCredits(CURATORS_POOL).assertEq(1 wei, "curator credit");
        setup.auctions.totalProceedsOwed().assertEq(7 wei, "proceeds owed");
        setup.auctions.totalOwed().assertEq(7 wei, "total owed");
    }

    function testAuctionContractSplitCanDisableCuratorCredit() public {
        AuctionSetup memory setup = _createAuctionForPosterAndReserve(POSTER, 7 wei);
        setup.auctions.updateContractProceedsSplit(5000, 5000, 0);
        vm.deal(FIRST_BIDDER, 1 ether);

        vm.prank(FIRST_BIDDER);
        setup.auctions.participateToAuction{ value: 7 wei }(setup.tokenId);
        vm.warp(setup.auctionEndTime + 1);
        setup.auctions.claimAuction(setup.tokenId);

        setup.auctions.auctionPosterCredits(POSTER).assertEq(3 wei, "poster credit");
        setup.auctions.auctionProtocolCredits(PAYOUT).assertEq(4 wei, "protocol credit");
        setup.auctions.auctionCuratorCredits(CURATORS_POOL).assertEq(0, "curator credit");
        setup.auctions.totalCuratorOwed().assertEq(0, "curator owed");
        setup.auctions.totalProceedsOwed().assertEq(7 wei, "proceeds owed");
    }

    function testAuctionCollectionAndTokenSplitsOverrideContractDefault() public {
        AuctionSetup memory setup = _createAuctionForPosterAndReserve(POSTER, 10_000);
        setup.auctions.updateContractProceedsSplit(5000, 5000, 0);
        setup.auctions.updateCollectionProceedsSplit(1, 4000, 3000, 3000);
        setup.auctions.updateTokenProceedsSplit(setup.tokenId, 6000, 4000, 0);
        vm.deal(FIRST_BIDDER, 1 ether);

        vm.prank(FIRST_BIDDER);
        setup.auctions.participateToAuction{ value: 10_000 }(setup.tokenId);
        vm.warp(setup.auctionEndTime + 1);
        setup.auctions.claimAuction(setup.tokenId);

        setup.auctions.auctionPosterCredits(POSTER).assertEq(6000, "token poster credit");
        setup.auctions.auctionProtocolCredits(PAYOUT).assertEq(4000, "token protocol credit");
        setup.auctions.auctionCuratorCredits(CURATORS_POOL).assertEq(0, "token curator credit");

        setup.auctions.clearTokenProceedsSplit(setup.tokenId);
        (uint16 posterBps, uint16 protocolBps, uint16 curatorBps) =
            setup.auctions.proceedsSplitFor(1, setup.tokenId);
        uint256(posterBps).assertEq(4000, "collection poster bps");
        uint256(protocolBps).assertEq(3000, "collection protocol bps");
        uint256(curatorBps).assertEq(3000, "collection curator bps");
    }

    function testAuctionCuratorCreditCanBeReleasedToContractPool() public {
        PassiveAuctionCuratorsPool curatorsPool = new PassiveAuctionCuratorsPool();
        AuctionSetup memory setup =
            _createAuctionForPosterReserveAndCurators(POSTER, RESERVE_PRICE, address(curatorsPool));
        vm.deal(FIRST_BIDDER, 10 ether);

        vm.prank(FIRST_BIDDER);
        setup.auctions.participateToAuction{ value: RESERVE_PRICE }(setup.tokenId);
        vm.warp(setup.auctionEndTime + 1);
        setup.auctions.claimAuction(setup.tokenId);

        uint256 poolBalanceBefore = address(curatorsPool).balance;
        setup.auctions.releaseAuctionCuratorCredit();

        address(curatorsPool).balance
            .assertEq(poolBalanceBefore + (RESERVE_PRICE / 4), "pool balance");
        setup.auctions.auctionCuratorCredits(address(curatorsPool)).assertEq(0, "curator credit");
        setup.auctions.totalCuratorOwed().assertEq(0, "curator owed");
        setup.auctions.totalOwed().assertEq(3 * (RESERVE_PRICE / 4), "poster/protocol owed");
    }

    function testProceedsWithdrawalFailurePreservesCredit() public {
        RejectingProceedsRecipient rejectingPoster = new RejectingProceedsRecipient();
        AuctionSetup memory setup = _createAuctionForPoster(address(rejectingPoster));
        vm.deal(FIRST_BIDDER, 10 ether);

        vm.prank(FIRST_BIDDER);
        setup.auctions.participateToAuction{ value: RESERVE_PRICE }(setup.tokenId);
        vm.warp(setup.auctionEndTime + 1);
        setup.auctions.claimAuction(setup.tokenId);

        (bool success,) = address(rejectingPoster)
            .call(
                abi.encodeWithSelector(
                    rejectingPoster.withdrawProceedsToSelf.selector, setup.auctions
                )
            );

        success.assertFalse("failed proceeds withdrawal succeeded");
        setup.auctions.auctionPosterCredits(address(rejectingPoster))
            .assertEq(RESERVE_PRICE / 2, "poster credit was erased");
        setup.auctions.totalPosterOwed().assertEq(RESERVE_PRICE / 2, "poster owed changed");
        setup.auctions.totalOwed().assertEq(RESERVE_PRICE, "total owed changed");
    }

    struct AuctionSetup {
        DeployedStream deployed;
        StreamAuctions auctions;
        uint256 tokenId;
        uint256 auctionEndTime;
    }

    function _createAuction() private returns (AuctionSetup memory setup) {
        return _createAuctionForPoster(POSTER);
    }

    function _createAuctionForPoster(address poster) private returns (AuctionSetup memory setup) {
        return _createAuctionForPosterAndReserve(poster, RESERVE_PRICE);
    }

    function _createAuctionForPosterAndReserve(address poster, uint256 reservePrice)
        private
        returns (AuctionSetup memory setup)
    {
        return _createAuctionForPosterReserveAndCurators(poster, reservePrice, CURATORS_POOL);
    }

    function _createAuctionForPosterReserveAndCurators(
        address poster,
        uint256 reservePrice,
        address curatorsPool
    ) private returns (AuctionSetup memory setup) {
        setup.deployed = deployStreamWithSigner(PAYOUT, curatorsPool, signerAddress());
        setup.auctions = new StreamAuctions(
            address(setup.deployed.minter),
            address(setup.deployed.core),
            address(setup.deployed.admins),
            address(setup.deployed.drops),
            PAYOUT,
            curatorsPool
        );
        setup.deployed.drops.updateAuctionContract(address(setup.auctions));
        setup.auctionEndTime = block.timestamp + 1 days;
        StreamDrops.DropAuthorization memory authorization = buildAuctionAuthorization(
            setup.deployed.drops,
            poster,
            address(0),
            "auction-data",
            1,
            reservePrice,
            setup.auctionEndTime,
            uint256(uint160(address(setup.auctions))),
            uint256(uint160(address(setup.auctions))) + 1,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(setup.deployed.drops, authorization);

        setup.deployed.drops.mintDrop(authorization, "auction-data", signature);
        setup.tokenId = 1;
    }

    function _tryDeployAuctions(
        DeployedStream memory deployed,
        address payout,
        address curatorsPool
    ) private returns (bool) {
        try new StreamAuctions(
            address(deployed.minter),
            address(deployed.core),
            address(deployed.admins),
            address(deployed.drops),
            payout,
            curatorsPool
        ) returns (
            StreamAuctions
        ) {
            return true;
        } catch {
            return false;
        }
    }
}

contract RejectingBidder {
    receive() external payable {
        revert("reject eth");
    }

    function bid(StreamAuctions auctions, uint256 tokenId) external payable {
        auctions.participateToAuction{ value: msg.value }(tokenId);
    }

    function withdrawCredit(StreamAuctions auctions, address payable recipient) external {
        auctions.withdrawBidderCreditTo(recipient);
    }
}

contract RejectingProceedsRecipient {
    receive() external payable {
        revert("reject eth");
    }

    function withdrawProceedsToSelf(StreamAuctions auctions) external {
        auctions.withdrawAuctionProceedsCredit();
    }
}

contract PassiveAuctionCuratorsPool {
    receive() external payable { }
}

contract ForceEth {
    constructor() payable { }

    function force(address payable target) external {
        selfdestruct(target);
    }
}

contract ReentrantBidder {
    StreamAuctions private auctions;
    bool public reentered;
    bool private attacking;

    receive() external payable {
        if (attacking) {
            attacking = false;
            (bool success,) = address(auctions)
                .call(abi.encodeWithSelector(auctions.withdrawBidderCredit.selector));
            reentered = success;
        }
    }

    function bid(StreamAuctions auctions_, uint256 tokenId) external payable {
        auctions_.participateToAuction{ value: msg.value }(tokenId);
    }

    function withdrawToSelf(StreamAuctions auctions_) external {
        auctions = auctions_;
        attacking = true;
        auctions_.withdrawBidderCredit();
    }
}
