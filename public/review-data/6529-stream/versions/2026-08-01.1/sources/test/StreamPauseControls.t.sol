// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/AuctionContract.sol";
import "../smart-contracts/RandomizerRNG.sol";
import "../smart-contracts/StreamAdmins.sol";
import "../smart-contracts/StreamDrops.sol";
import "./helpers/Assertions.sol";
import "./helpers/DropAuthTestHelper.sol";
import "./helpers/StreamFixture.sol";
import "./mocks/MockRandomizerCore.sol";

contract StreamPauseControlsTest is DropAuthTestHelper, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for uint256;

    event PauseUpdated(
        bytes32 indexed domain, bool paused, address indexed admin, bytes32 indexed reason
    );

    address private constant POSTER = address(0x1001);
    address private constant RECIPIENT = address(0x5005);
    address private constant PAYOUT = address(0x2002);
    address private constant CURATORS_POOL = address(0x3003);
    address private constant WITHDRAW_RECIPIENT = address(0x4004);
    address private constant PAUSE_GUARDIAN = address(0x6006);
    address private constant UNPAUSE_ADMIN = address(0x7007);
    address private constant FIRST_BIDDER = address(0x8008);
    address private constant SECOND_BIDDER = address(0x9009);
    address private constant THIRD_BIDDER = address(0xA00A);
    uint256 private constant TOKEN_ID = 1;
    uint256 private constant RESERVE_PRICE = 5 ether;
    uint256 private constant SECOND_BID = 6 ether;
    uint256 private constant THIRD_BID = 7 ether;
    bytes32 private constant REASON = keccak256("pause-regression");

    struct AuctionPauseSnapshot {
        uint256 highestBid;
        address highestBidder;
        uint256 watchedBidderCredit;
        uint256 posterCredit;
        uint256 protocolCredit;
        uint256 curatorCredit;
        uint256 totalBidderOwed;
        uint256 totalAuctionBidEscrow;
        uint256 totalPosterOwed;
        uint256 totalProtocolOwed;
        uint256 totalCuratorOwed;
        uint256 totalOwed;
        uint256 balance;
        uint256 emergencyWithdrawable;
        uint256 status;
        address owner;
    }

    function testPauseGuardianCanPauseButCannotUnpause() public {
        StreamAdmins admins = new StreamAdmins(address(this));
        bytes32 domain = admins.PAUSE_DOMAIN_MINT();

        admins.registerPauseGuardian(PAUSE_GUARDIAN, true);
        admins.registerUnpauseAdmin(UNPAUSE_ADMIN, true);

        vm.expectEmit(true, true, true, true);
        emit PauseUpdated(domain, true, PAUSE_GUARDIAN, REASON);
        vm.prank(PAUSE_GUARDIAN);
        admins.setPaused(domain, true, REASON);

        admins.isPaused(domain).assertTrue("domain not paused");

        vm.prank(PAUSE_GUARDIAN);
        (bool guardianUnpaused,) = address(admins)
            .call(abi.encodeWithSelector(admins.setPaused.selector, domain, false, REASON));
        guardianUnpaused.assertFalse("guardian unpaused domain");
        admins.isPaused(domain).assertTrue("guardian changed pause state");

        vm.prank(UNPAUSE_ADMIN);
        (bool unpauseAdminPaused,) = address(admins)
            .call(abi.encodeWithSelector(admins.setPaused.selector, domain, true, REASON));
        unpauseAdminPaused.assertFalse("unpause admin paused domain");

        vm.prank(UNPAUSE_ADMIN);
        admins.setPaused(domain, false, REASON);

        admins.isPaused(domain).assertFalse("domain still paused");
    }

    function testDropExecutionPauseBlocksSignedDropsUntilUnpaused() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            deployed.drops,
            POSTER,
            RECIPIENT,
            address(0),
            "data",
            1,
            0,
            1,
            2,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(deployed.drops, authorization);

        _setPaused(deployed.admins, deployed.admins.PAUSE_DOMAIN_DROP_EXECUTION(), true);

        (bool pausedMint,) = address(deployed.drops)
            .call(
                abi.encodeWithSelector(
                    deployed.drops.mintDrop.selector, authorization, "data", signature
                )
            );

        pausedMint.assertFalse("drop execution succeeded while paused");
        deployed.drops.isDropConsumed(authorization.dropId).assertFalse("paused drop consumed");
        deployed.core.totalSupply().assertEq(0, "paused drop minted");

        _setPaused(deployed.admins, deployed.admins.PAUSE_DOMAIN_DROP_EXECUTION(), false);
        deployed.drops.mintDrop(authorization, "data", signature);

        deployed.drops.isDropConsumed(authorization.dropId).assertTrue("drop not consumed");
        deployed.core.ownerOf(TOKEN_ID).assertEq(RECIPIENT, "recipient changed");
    }

    function testDropExecutionPauseSupportsSignerCompromiseResponse() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            deployed.drops,
            POSTER,
            RECIPIENT,
            address(0),
            "data",
            1,
            0,
            9,
            10,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(deployed.drops, authorization);

        _setPaused(deployed.admins, deployed.admins.PAUSE_DOMAIN_DROP_EXECUTION(), true);
        deployed.drops.incrementSignerEpoch();
        deployed.drops.cancelDrop(authorization.dropId);
        _setPaused(deployed.admins, deployed.admins.PAUSE_DOMAIN_DROP_EXECUTION(), false);

        (bool staleOrCancelledMint,) = address(deployed.drops)
            .call(
                abi.encodeWithSelector(
                    deployed.drops.mintDrop.selector, authorization, "data", signature
                )
            );

        staleOrCancelledMint.assertFalse("stale cancelled drop executed");
        deployed.drops.isDropCancelled(authorization.dropId).assertTrue("drop not cancelled");
        deployed.drops.isDropConsumed(authorization.dropId).assertFalse("drop consumed");
        deployed.core.totalSupply().assertEq(0, "compromised drop minted");
    }

    function testMintPauseBlocksMinterPathWithoutConsumingDrop() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            deployed.drops,
            POSTER,
            RECIPIENT,
            address(0),
            "data",
            1,
            0,
            3,
            4,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(deployed.drops, authorization);

        _setPaused(deployed.admins, deployed.admins.PAUSE_DOMAIN_MINT(), true);

        (bool pausedMint,) = address(deployed.drops)
            .call(
                abi.encodeWithSelector(
                    deployed.drops.mintDrop.selector, authorization, "data", signature
                )
            );

        pausedMint.assertFalse("mint succeeded while paused");
        deployed.drops.isDropConsumed(authorization.dropId).assertFalse("failed mint consumed drop");
        deployed.core.totalSupply().assertEq(0, "paused mint changed supply");

        _setPaused(deployed.admins, deployed.admins.PAUSE_DOMAIN_MINT(), false);
        deployed.drops.mintDrop(authorization, "data", signature);

        deployed.core.ownerOf(TOKEN_ID).assertEq(RECIPIENT, "recipient changed");
    }

    function testAuctionBidPauseBlocksOnlyNewBids() public {
        AuctionSetup memory setup = _createAuctionDrop(1 days, 1 ether);

        _setPaused(setup.deployed.admins, setup.deployed.admins.PAUSE_DOMAIN_AUCTION_BID(), true);

        vm.expectRevert("Bid paused");
        setup.auctions.participateToAuction{ value: 1 ether }(setup.tokenId);
        setup.auctions.auctionHighestBid(setup.tokenId).assertEq(0, "paused bid recorded");

        _setPaused(setup.deployed.admins, setup.deployed.admins.PAUSE_DOMAIN_AUCTION_BID(), false);
        setup.auctions.participateToAuction{ value: 1 ether }(setup.tokenId);

        setup.auctions.auctionHighestBid(setup.tokenId).assertEq(1 ether, "bid not recorded");
    }

    function testAuctionSettlementPauseBlocksEndedAuctionSettlementUntilUnpaused() public {
        AuctionSetup memory setup = _createAuctionDrop(1 days, 1 ether);
        vm.warp(setup.auctionEndTime + 1);

        _setPaused(
            setup.deployed.admins, setup.deployed.admins.PAUSE_DOMAIN_AUCTION_SETTLEMENT(), true
        );

        vm.expectRevert("Settlement paused");
        setup.auctions.claimAuction(setup.tokenId);
        uint256(StreamAuctions.AuctionStatus.EndedNoBid)
            .assertEq(
                uint256(setup.auctions.retrieveAuctionStatus(setup.tokenId)), "status changed"
            );

        _setPaused(
            setup.deployed.admins, setup.deployed.admins.PAUSE_DOMAIN_AUCTION_SETTLEMENT(), false
        );
        setup.auctions.claimAuction(setup.tokenId);

        uint256(StreamAuctions.AuctionStatus.SettledNoBid)
            .assertEq(uint256(setup.auctions.retrieveAuctionStatus(setup.tokenId)), "not settled");
        setup.deployed.core.ownerOf(setup.tokenId).assertEq(POSTER, "poster did not receive token");
    }

    function testMetadataMutationPauseBlocksMutableMetadataOnly() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);

        _setPaused(deployed.admins, deployed.admins.PAUSE_DOMAIN_METADATA_MUTATION(), true);

        (bool pausedMetadata,) = address(deployed.core)
            .call(abi.encodeWithSelector(deployed.core.changeMetadataView.selector, 1, true));

        pausedMetadata.assertFalse("metadata changed while paused");
        deployed.core.onchainMetadata(1).assertFalse("metadata flag changed");

        _setPaused(deployed.admins, deployed.admins.PAUSE_DOMAIN_METADATA_MUTATION(), false);
        deployed.core.changeMetadataView(1, true);

        deployed.core.onchainMetadata(1).assertTrue("metadata flag not changed");
    }

    function testRandomnessRequestPauseBlocksNewRequestsUntilUnpaused() public {
        StreamAdmins admins = new StreamAdmins(address(this));
        PauseMockArrngController controller = new PauseMockArrngController();
        MockRandomizerCore core = new MockRandomizerCore();
        NextGenRandomizerRNG randomizer =
            new NextGenRandomizerRNG(address(core), address(admins), address(controller));
        core.setRandomizer(1, address(randomizer), 1);

        _setPaused(admins, admins.PAUSE_DOMAIN_RANDOMNESS_REQUEST(), true);

        vm.prank(address(core));
        (bool pausedRequest,) = address(randomizer)
            .call(abi.encodeWithSelector(randomizer.calculateTokenHash.selector, 1, TOKEN_ID, 123));

        pausedRequest.assertFalse("randomness request succeeded while paused");
        randomizer.tokenToRequest(TOKEN_ID).assertEq(0, "paused request recorded");

        _setPaused(admins, admins.PAUSE_DOMAIN_RANDOMNESS_REQUEST(), false);
        vm.prank(address(core));
        randomizer.calculateTokenHash(1, TOKEN_ID, 123);

        randomizer.tokenToRequest(TOKEN_ID).assertEq(1, "request not recorded");
        controller.lastRefundAddress().assertEq(address(randomizer), "refund address changed");
    }

    function testUserWithdrawalsRemainAvailableDuringOperationalPauses() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        RejectingPauseRecipient rejectingRecipient = new RejectingPauseRecipient();
        vm.deal(address(this), 10 ether);
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            deployed.drops,
            POSTER,
            RECIPIENT,
            address(this),
            "data",
            1,
            4 ether,
            5,
            6,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(deployed.drops, authorization);
        deployed.drops.mintDrop{ value: 4 ether }(authorization, "data", signature);

        _pauseAllOperationalDomains(deployed.admins);
        uint256 recipientBalanceBefore = WITHDRAW_RECIPIENT.balance;

        vm.expectRevert("ETH failed");
        vm.prank(POSTER);
        deployed.drops.withdrawFixedPriceCreditTo(payable(address(rejectingRecipient)));
        deployed.drops.fixedPricePosterCredits(POSTER).assertEq(2 ether, "poster credit erased");
        deployed.drops.totalFixedPricePosterOwed().assertEq(2 ether, "poster owed changed");
        deployed.drops.totalOwed().assertEq(4 ether, "total owed changed");
        address(deployed.drops).balance.assertEq(4 ether, "drops balance changed");
        deployed.drops.emergencyWithdrawable().assertEq(0, "owed funds exposed as surplus");

        vm.prank(POSTER);
        deployed.drops.withdrawFixedPriceCreditTo(payable(WITHDRAW_RECIPIENT));

        WITHDRAW_RECIPIENT.balance
            .assertEq(recipientBalanceBefore + 2 ether, "withdrawal was paused");
        deployed.drops.fixedPricePosterCredits(POSTER).assertEq(0, "poster credit not cleared");
    }

    function testAuctionBidPauseMatrixPreservesCreditsEscrowAndWithdrawals() public {
        AuctionSetup memory setup = _createAuctionDrop(1 days, RESERVE_PRICE);
        RejectingPauseRecipient rejectingRecipient = new RejectingPauseRecipient();
        vm.deal(FIRST_BIDDER, 10 ether);
        vm.deal(SECOND_BIDDER, 10 ether);
        vm.deal(THIRD_BIDDER, 10 ether);

        vm.prank(FIRST_BIDDER);
        setup.auctions.participateToAuction{ value: RESERVE_PRICE }(setup.tokenId);
        vm.prank(SECOND_BIDDER);
        setup.auctions.participateToAuction{ value: SECOND_BID }(setup.tokenId);

        AuctionPauseSnapshot memory beforePausedBid =
            _snapshotAuctionPauseState(setup, FIRST_BIDDER);
        _setPaused(setup.deployed.admins, setup.deployed.admins.PAUSE_DOMAIN_AUCTION_BID(), true);

        vm.expectRevert("Bid paused");
        vm.prank(THIRD_BIDDER);
        setup.auctions.participateToAuction{ value: THIRD_BID }(setup.tokenId);
        _assertAuctionPauseState(setup, FIRST_BIDDER, beforePausedBid);

        setup.deployed.admins.updateEmergencyRecipient(PAYOUT);
        uint256 payoutBalanceBefore = PAYOUT.balance;
        vm.deal(address(setup.auctions), beforePausedBid.balance + 1 ether);
        setup.auctions.emergencyWithdrawable().assertEq(1 ether, "forced surplus");
        setup.auctions.emergencyWithdraw();
        PAYOUT.balance.assertEq(payoutBalanceBefore + 1 ether, "surplus payout");
        _assertAuctionPauseState(setup, FIRST_BIDDER, beforePausedBid);

        vm.expectRevert("ETH failed");
        vm.prank(FIRST_BIDDER);
        setup.auctions.withdrawBidderCreditTo(payable(address(rejectingRecipient)));
        _assertAuctionPauseState(setup, FIRST_BIDDER, beforePausedBid);

        uint256 recipientBalanceBefore = WITHDRAW_RECIPIENT.balance;
        vm.prank(FIRST_BIDDER);
        setup.auctions.withdrawBidderCreditTo(payable(WITHDRAW_RECIPIENT));

        WITHDRAW_RECIPIENT.balance
            .assertEq(recipientBalanceBefore + RESERVE_PRICE, "bidder withdrawal paused");
        setup.auctions.auctionBidderCredits(FIRST_BIDDER).assertEq(0, "bidder credit");
        setup.auctions.totalBidderOwed().assertEq(0, "total bidder owed");
        setup.auctions.totalAuctionBidEscrow().assertEq(SECOND_BID, "active escrow");
        setup.auctions.totalOwed().assertEq(SECOND_BID, "total owed");
        address(setup.auctions).balance.assertEq(SECOND_BID, "auction balance");
        setup.auctions.emergencyWithdrawable().assertEq(0, "owed surplus");
    }

    function testAuctionSettlementPauseMatrixPreservesCustodyAndProceeds() public {
        AuctionSetup memory setup = _createAuctionDrop(1 days, RESERVE_PRICE);
        RejectingPauseRecipient rejectingRecipient = new RejectingPauseRecipient();
        vm.deal(FIRST_BIDDER, 10 ether);

        vm.prank(FIRST_BIDDER);
        setup.auctions.participateToAuction{ value: RESERVE_PRICE }(setup.tokenId);
        vm.warp(setup.auctionEndTime + 1);

        AuctionPauseSnapshot memory beforePausedSettlement =
            _snapshotAuctionPauseState(setup, FIRST_BIDDER);
        uint256(StreamAuctions.AuctionStatus.EndedWithBid)
            .assertEq(beforePausedSettlement.status, "precondition status");
        _setPaused(
            setup.deployed.admins, setup.deployed.admins.PAUSE_DOMAIN_AUCTION_SETTLEMENT(), true
        );

        vm.expectRevert("Settlement paused");
        setup.auctions.claimAuction(setup.tokenId);
        _assertAuctionPauseState(setup, FIRST_BIDDER, beforePausedSettlement);

        setup.deployed.admins.updateEmergencyRecipient(PAYOUT);
        uint256 payoutBalanceBefore = PAYOUT.balance;
        vm.deal(address(setup.auctions), beforePausedSettlement.balance + 1 ether);
        setup.auctions.emergencyWithdrawable().assertEq(1 ether, "settlement surplus");
        setup.auctions.emergencyWithdraw();
        PAYOUT.balance.assertEq(payoutBalanceBefore + 1 ether, "settlement surplus payout");
        _assertAuctionPauseState(setup, FIRST_BIDDER, beforePausedSettlement);

        _setPaused(
            setup.deployed.admins, setup.deployed.admins.PAUSE_DOMAIN_AUCTION_SETTLEMENT(), false
        );
        setup.auctions.claimAuction(setup.tokenId);

        setup.deployed.core.ownerOf(setup.tokenId).assertEq(FIRST_BIDDER, "winner owner");
        uint256(StreamAuctions.AuctionStatus.SettledWithBid)
            .assertEq(uint256(setup.auctions.retrieveAuctionStatus(setup.tokenId)), "settled");
        setup.auctions.totalAuctionBidEscrow().assertEq(0, "escrow after settlement");
        setup.auctions.totalProceedsOwed().assertEq(RESERVE_PRICE, "proceeds owed");
        setup.auctions.totalOwed().assertEq(RESERVE_PRICE, "total owed after settlement");
        setup.auctions.emergencyWithdrawable().assertEq(0, "settlement surplus");

        AuctionPauseSnapshot memory afterSettlement =
            _snapshotAuctionPauseState(setup, FIRST_BIDDER);
        vm.expectRevert("Not ended");
        setup.auctions.claimAuction(setup.tokenId);
        _assertAuctionPauseState(setup, FIRST_BIDDER, afterSettlement);

        _pauseAllOperationalDomains(setup.deployed.admins);
        vm.expectRevert("ETH failed");
        vm.prank(POSTER);
        setup.auctions.withdrawAuctionProceedsCreditTo(payable(address(rejectingRecipient)));
        _assertAuctionPauseState(setup, FIRST_BIDDER, afterSettlement);
        setup.auctions.emergencyWithdraw();
        _assertAuctionPauseState(setup, FIRST_BIDDER, afterSettlement);

        uint256 recipientBalanceBefore = WITHDRAW_RECIPIENT.balance;
        vm.prank(POSTER);
        setup.auctions.withdrawAuctionProceedsCreditTo(payable(WITHDRAW_RECIPIENT));
        vm.prank(PAYOUT);
        setup.auctions.withdrawAuctionProceedsCreditTo(payable(WITHDRAW_RECIPIENT));
        vm.prank(CURATORS_POOL);
        setup.auctions.withdrawAuctionProceedsCreditTo(payable(WITHDRAW_RECIPIENT));

        WITHDRAW_RECIPIENT.balance
            .assertEq(recipientBalanceBefore + RESERVE_PRICE, "proceeds withdrawal paused");
        setup.auctions.totalProceedsOwed().assertEq(0, "proceeds still owed");
        setup.auctions.totalOwed().assertEq(0, "owed after proceeds withdrawals");
        address(setup.auctions).balance.assertEq(0, "auction balance after withdrawals");
    }

    function testNoBidSettlementPauseMatrixPreservesContractPosterCustody() public {
        NoBidContractPoster contractPoster = new NoBidContractPoster();
        AuctionSetup memory setup =
            _createAuctionDropForPoster(address(contractPoster), 1 days, RESERVE_PRICE);
        vm.warp(setup.auctionEndTime + 1);

        uint256(StreamAuctions.AuctionStatus.EndedNoBid)
            .assertEq(uint256(setup.auctions.retrieveAuctionStatus(setup.tokenId)), "ended");
        setup.deployed.core.ownerOf(setup.tokenId).assertEq(address(setup.auctions), "custody");
        setup.auctions.pendingNoBidNftClaimant(setup.tokenId)
            .assertEq(address(0), "pending claimant");
        setup.auctions.totalOwed().assertEq(0, "owed before no-bid settlement");

        _setPaused(
            setup.deployed.admins, setup.deployed.admins.PAUSE_DOMAIN_AUCTION_SETTLEMENT(), true
        );
        vm.expectRevert("Settlement paused");
        setup.auctions.claimAuction(setup.tokenId);
        uint256(StreamAuctions.AuctionStatus.EndedNoBid)
            .assertEq(uint256(setup.auctions.retrieveAuctionStatus(setup.tokenId)), "status");
        setup.deployed.core.ownerOf(setup.tokenId).assertEq(address(setup.auctions), "owner");
        setup.auctions.pendingNoBidNftClaimant(setup.tokenId)
            .assertEq(address(0), "pending while paused");
        setup.auctions.totalOwed().assertEq(0, "owed changed while paused");

        _setPaused(
            setup.deployed.admins, setup.deployed.admins.PAUSE_DOMAIN_AUCTION_SETTLEMENT(), false
        );
        setup.auctions.claimAuction(setup.tokenId);

        setup.deployed.core.ownerOf(setup.tokenId).assertEq(address(setup.auctions), "held");
        setup.auctions.pendingNoBidNftClaimant(setup.tokenId)
            .assertEq(address(contractPoster), "pending claimant");

        _setPaused(
            setup.deployed.admins, setup.deployed.admins.PAUSE_DOMAIN_AUCTION_SETTLEMENT(), true
        );
        vm.expectRevert("Settlement paused");
        contractPoster.claimNoBid(setup.auctions, setup.tokenId, WITHDRAW_RECIPIENT);
        setup.deployed.core.ownerOf(setup.tokenId).assertEq(address(setup.auctions), "claim owner");
        setup.auctions.pendingNoBidNftClaimant(setup.tokenId)
            .assertEq(address(contractPoster), "claimant changed");

        _setPaused(
            setup.deployed.admins, setup.deployed.admins.PAUSE_DOMAIN_AUCTION_SETTLEMENT(), false
        );
        contractPoster.claimNoBid(setup.auctions, setup.tokenId, WITHDRAW_RECIPIENT);

        setup.deployed.core.ownerOf(setup.tokenId).assertEq(WITHDRAW_RECIPIENT, "recipient");
        uint256(StreamAuctions.AuctionStatus.SettledNoBid)
            .assertEq(uint256(setup.auctions.retrieveAuctionStatus(setup.tokenId)), "settled");
        setup.auctions.pendingNoBidNftClaimant(setup.tokenId)
            .assertEq(address(0), "pending cleared");
        setup.auctions.totalOwed().assertEq(0, "owed after no-bid claim");
        setup.auctions.emergencyWithdrawable().assertEq(0, "no-bid surplus");
    }

    function _createAuctionDrop(uint256 duration, uint256 reservePrice)
        private
        returns (AuctionSetup memory setup)
    {
        return _createAuctionDropForPoster(POSTER, duration, reservePrice);
    }

    function _createAuctionDropForPoster(address poster, uint256 duration, uint256 reservePrice)
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
        setup.auctionEndTime = block.timestamp + duration;

        StreamDrops.DropAuthorization memory authorization = buildAuctionAuthorization(
            setup.deployed.drops,
            poster,
            address(0),
            "auction-data",
            1,
            reservePrice,
            setup.auctionEndTime,
            7,
            8,
            block.timestamp + 1 days
        );
        setup.deployed.drops
            .mintDrop(
                authorization,
                "auction-data",
                signAuthorization(setup.deployed.drops, authorization)
            );
        setup.tokenId = TOKEN_ID;
    }

    function _snapshotAuctionPauseState(AuctionSetup memory setup, address watchedBidder)
        private
        view
        returns (AuctionPauseSnapshot memory snapshot)
    {
        snapshot = AuctionPauseSnapshot({
            highestBid: setup.auctions.auctionHighestBid(setup.tokenId),
            highestBidder: setup.auctions.auctionHighestBidder(setup.tokenId),
            watchedBidderCredit: setup.auctions.auctionBidderCredits(watchedBidder),
            posterCredit: setup.auctions.auctionPosterCredits(POSTER),
            protocolCredit: setup.auctions.auctionProtocolCredits(PAYOUT),
            curatorCredit: setup.auctions.auctionCuratorCredits(CURATORS_POOL),
            totalBidderOwed: setup.auctions.totalBidderOwed(),
            totalAuctionBidEscrow: setup.auctions.totalAuctionBidEscrow(),
            totalPosterOwed: setup.auctions.totalPosterOwed(),
            totalProtocolOwed: setup.auctions.totalProtocolOwed(),
            totalCuratorOwed: setup.auctions.totalCuratorOwed(),
            totalOwed: setup.auctions.totalOwed(),
            balance: address(setup.auctions).balance,
            emergencyWithdrawable: setup.auctions.emergencyWithdrawable(),
            status: uint256(setup.auctions.retrieveAuctionStatus(setup.tokenId)),
            owner: setup.deployed.core.ownerOf(setup.tokenId)
        });
    }

    function _assertAuctionPauseState(
        AuctionSetup memory setup,
        address watchedBidder,
        AuctionPauseSnapshot memory expected
    ) private view {
        setup.auctions.auctionHighestBid(setup.tokenId).assertEq(expected.highestBid, "bid");
        setup.auctions.auctionHighestBidder(setup.tokenId)
            .assertEq(expected.highestBidder, "bidder");
        setup.auctions.auctionBidderCredits(watchedBidder)
            .assertEq(expected.watchedBidderCredit, "bidder credit");
        setup.auctions.auctionPosterCredits(POSTER).assertEq(expected.posterCredit, "poster");
        setup.auctions.auctionProtocolCredits(PAYOUT).assertEq(expected.protocolCredit, "protocol");
        setup.auctions.auctionCuratorCredits(CURATORS_POOL)
            .assertEq(expected.curatorCredit, "curator");
        setup.auctions.totalBidderOwed().assertEq(expected.totalBidderOwed, "bidder owed");
        setup.auctions.totalAuctionBidEscrow().assertEq(expected.totalAuctionBidEscrow, "escrow");
        setup.auctions.totalPosterOwed().assertEq(expected.totalPosterOwed, "poster owed");
        setup.auctions.totalProtocolOwed().assertEq(expected.totalProtocolOwed, "protocol owed");
        setup.auctions.totalCuratorOwed().assertEq(expected.totalCuratorOwed, "curator owed");
        setup.auctions.totalOwed().assertEq(expected.totalOwed, "owed");
        address(setup.auctions).balance.assertEq(expected.balance, "balance");
        setup.auctions.emergencyWithdrawable().assertEq(expected.emergencyWithdrawable, "surplus");
        uint256(setup.auctions.retrieveAuctionStatus(setup.tokenId))
            .assertEq(expected.status, "status");
        setup.deployed.core.ownerOf(setup.tokenId).assertEq(expected.owner, "owner");
    }

    function _pauseAllOperationalDomains(StreamAdmins admins) private {
        _setPaused(admins, admins.PAUSE_DOMAIN_DROP_EXECUTION(), true);
        _setPaused(admins, admins.PAUSE_DOMAIN_MINT(), true);
        _setPaused(admins, admins.PAUSE_DOMAIN_AUCTION_BID(), true);
        _setPaused(admins, admins.PAUSE_DOMAIN_AUCTION_SETTLEMENT(), true);
        _setPaused(admins, admins.PAUSE_DOMAIN_METADATA_MUTATION(), true);
        _setPaused(admins, admins.PAUSE_DOMAIN_RANDOMNESS_REQUEST(), true);
    }

    function _setPaused(StreamAdmins admins, bytes32 domain, bool paused) private {
        admins.setPaused(domain, paused, REASON);
    }
}

struct AuctionSetup {
    StreamFixture.DeployedStream deployed;
    StreamAuctions auctions;
    uint256 tokenId;
    uint256 auctionEndTime;
}

contract PauseMockArrngController {
    uint256 public nextRequestId = 1;
    address public lastRefundAddress;

    function requestRandomWords(uint256, address refundAddress)
        external
        returns (uint256 requestId)
    {
        require(refundAddress != address(0), "Zero refund");
        lastRefundAddress = refundAddress;
        requestId = nextRequestId;
        nextRequestId++;
    }
}

contract RejectingPauseRecipient {
    receive() external payable {
        revert("reject eth");
    }
}

contract NoBidContractPoster {
    function claimNoBid(StreamAuctions auctions, uint256 tokenId, address recipient) external {
        auctions.claimNoBidAuctionToken(tokenId, recipient);
    }
}
