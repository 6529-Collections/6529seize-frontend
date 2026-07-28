// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/AuctionContract.sol";
import "../smart-contracts/RandomizerRNG.sol";
import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/StreamDrops.sol";
import "../smart-contracts/StreamPauseDomains.sol";
import "../smart-contracts/StreamRandomizerLifecycle.sol";
import "./helpers/Assertions.sol";
import "./helpers/DropAuthTestHelper.sol";
import "./helpers/StreamFixture.sol";
import "./mocks/MockRandomizer.sol";

contract StreamAuctionRandomizerCompositionTest is DropAuthTestHelper, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for string;
    using Assertions for uint256;

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant RESERVE_PRICE = 5 ether;
    uint256 private constant SECOND_BID = 6 ether;
    address private constant POSTER = address(0x1001);
    address private constant PAYOUT = address(0x2001);
    address private constant CURATORS_POOL = address(0x3001);
    address private constant FIRST_BIDDER = address(0x4001);
    address private constant SECOND_BIDDER = address(0x4002);
    address private constant EMERGENCY_RECIPIENT = address(0x5001);
    address private constant NO_BID_RECIPIENT = address(0x6001);
    bytes32 private constant PAUSE_REASON = keccak256("auction-randomizer-composition");
    bytes32 private constant RANDOMNESS_SEED_TYPEHASH = keccak256(
        "6529StreamRandomnessSeed(address provider,uint256 requestId,uint256 collectionId,uint256 tokenId,uint256 randomizerEpoch,bytes32 rawOutputHash)"
    );
    bytes32 private constant METADATA_UPDATE_TOPIC = keccak256("MetadataUpdate(uint256)");
    bytes32 private constant BURNED_TOKEN_RANDOMNESS_RECORDED_TOPIC = keccak256(
        "BurnedTokenRandomnessRecorded(uint256,uint256,uint256,address,uint256,bytes32,bytes32)"
    );
    bytes32 private constant RANDOMNESS_FULFILLED_TOPIC =
        keccak256("RandomnessFulfilled(uint256,uint256,uint256,address,uint256,bytes32,bytes32)");
    bytes4 private constant ERROR_STRING_SELECTOR = bytes4(keccak256("Error(string)"));

    struct CompositionSetup {
        DeployedStream deployed;
        StreamAuctions auctions;
        NextGenRandomizerRNG randomizer;
        CompositionArrngController controller;
    }

    struct AuctionSnapshot {
        uint256 status;
        address owner;
        uint256 highestBid;
        address highestBidder;
        uint256 totalBidderOwed;
        uint256 totalAuctionBidEscrow;
        uint256 totalProceedsOwed;
        uint256 totalOwed;
        uint256 balance;
        address pendingNoBidClaimant;
        address noBidClaimantAlias;
        bool auctionClaim;
        uint256 pendingRequests;
        uint256 randomizerEpoch;
        address collectionRandomizer;
        uint256 tokenRequest;
        bytes32 tokenHash;
    }

    struct AuctionAccountingSnapshot {
        uint256 bidderCredit;
        uint256 posterCredit;
        uint256 protocolCredit;
        uint256 curatorCredit;
        uint256 totalOwed;
        uint256 balance;
    }

    function testPausedRandomnessRequestRejectsAuctionDropWithoutConsumingAuthorization() public {
        CompositionSetup memory setup = _deployComposition();
        uint256 nextTokenId = setup.deployed.core.lastAllocatedTokenId() + 1;
        uint256 supplyBefore = setup.deployed.core.totalSupply();
        uint256 circulationBefore = setup.deployed.core.viewCirSupply(COLLECTION_ID);
        uint256 dropCountBefore = setup.deployed.drops.retrieveDrops().length;

        (StreamDrops.DropAuthorization memory authorization, bytes memory signature) = _buildSignedAuctionAuthorization(
            setup, "paused-randomness-auction-drop", 1, block.timestamp + 1 days
        );

        _setPaused(setup, StreamPauseDomains.RANDOMNESS_REQUEST, true);
        (bool success, bytes memory returnData) =
            _callMintDrop(setup, authorization, "paused-randomness-auction-drop", signature);
        _assertRevertedWithMessage(success, returnData, "Randomness paused");

        setup.deployed.drops.isDropConsumed(authorization.dropId)
            .assertFalse("paused request consumed drop");
        setup.deployed.drops.retrieveTokenID(authorization.dropId).assertEq(0, "paused token id");
        setup.deployed.core.totalSupply().assertEq(supplyBefore, "paused supply");
        setup.deployed.core.viewCirSupply(COLLECTION_ID)
            .assertEq(circulationBefore, "paused circulation");
        setup.deployed.drops.retrieveDrops().length.assertEq(dropCountBefore, "paused drop count");
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "paused pending");
        uint256(setup.auctions.retrieveAuctionStatus(nextTokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.None), "paused auction status");

        _setPaused(setup, StreamPauseDomains.RANDOMNESS_REQUEST, false);
        setup.deployed.drops.mintDrop(authorization, "paused-randomness-auction-drop", signature);
        uint256 tokenId = setup.deployed.drops.retrieveTokenID(authorization.dropId);
        tokenId.assertEq(nextTokenId, "token id after retry");
        setup.deployed.drops.isDropConsumed(authorization.dropId)
            .assertTrue("retried drop not consumed");
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(1, "retried pending");
        setup.randomizer.tokenToRequest(tokenId).assertEq(1, "retried request id");
        setup.deployed.core.ownerOf(tokenId).assertEq(address(setup.auctions), "retried custody");
        uint256(setup.auctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.Active), "retried auction");
    }

    function testAuctionDropPendingArrngRequestBlocksRandomizerMigrationWithoutAuctionDrift()
        public
    {
        CompositionSetup memory setup = _deployComposition();
        (, uint256 tokenId,) = _mintAuctionDrop(setup, "pending-request-migration-auction", 11);
        _bid(setup.auctions, tokenId, FIRST_BIDDER, RESERVE_PRICE);
        AuctionSnapshot memory beforeMigration = _snapshot(setup, tokenId);
        NoopRandomizer replacement = new NoopRandomizer();

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.PendingRandomnessRequests.selector,
                COLLECTION_ID,
                address(setup.randomizer),
                uint256(1)
            )
        );
        setup.deployed.core.addRandomizer(COLLECTION_ID, address(replacement));

        _assertSnapshot(setup, tokenId, beforeMigration, "migration");
        setup.deployed.core.viewCollectionRandomizerContract(COLLECTION_ID)
            .assertEq(address(setup.randomizer), "provider changed");
        setup.deployed.core.viewRandomizerEpoch(COLLECTION_ID)
            .assertEq(beforeMigration.randomizerEpoch, "epoch changed");
    }

    function testAuctionSettlementBeforeArrngFulfillmentPreservesWinnerCreditsAndRequestBinding()
        public
    {
        CompositionSetup memory setup = _deployComposition();
        (, uint256 tokenId, uint256 auctionEndTime) =
            _mintAuctionDrop(setup, "settle-before-arrng-fulfillment", 21);
        uint256 requestId = setup.randomizer.tokenToRequest(tokenId);

        _bid(setup.auctions, tokenId, FIRST_BIDDER, RESERVE_PRICE);
        _bid(setup.auctions, tokenId, SECOND_BIDDER, SECOND_BID);
        vm.warp(auctionEndTime + 1);
        setup.auctions.claimAuction(tokenId);

        setup.deployed.core.ownerOf(tokenId).assertEq(SECOND_BIDDER, "winner custody");
        uint256(setup.auctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.SettledWithBid), "settled");
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID)
            .assertEq(1, "pending after settlement");
        setup.deployed.core.retrieveTokenHash(tokenId).assertEq(bytes32(0), "pre-fulfillment hash");

        AuctionAccountingSnapshot memory beforeFulfillment = _snapshotAuctionAccounting(setup);
        _fulfillRandomnessAndAssertBinding(setup, tokenId, requestId, 999);

        setup.deployed.core.ownerOf(tokenId).assertEq(SECOND_BIDDER, "post-fulfillment owner");
        uint256(setup.auctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.SettledWithBid), "status drift");
        _assertAuctionAccountingSnapshot(setup, beforeFulfillment, "fulfillment");
    }

    function testAuctionNoBidSettlementBeforeArrngFulfillmentPreservesPosterAndRequestBinding()
        public
    {
        CompositionSetup memory setup = _deployComposition();
        (
            StreamDrops.DropAuthorization memory authorization,
            uint256 tokenId,
            uint256 auctionEndTime
        ) = _mintAuctionDrop(setup, "no-bid-before-arrng-fulfillment", 51);
        uint256 requestId = setup.randomizer.tokenToRequest(tokenId);

        vm.warp(auctionEndTime + 1);
        setup.auctions.claimAuction(tokenId);

        setup.deployed.core.ownerOf(tokenId).assertEq(POSTER, "poster owner");
        uint256(setup.auctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.SettledNoBid), "settled no bid");
        setup.auctions.auctionClaim(tokenId).assertTrue("auction claim");
        setup.auctions.pendingNoBidNftClaimant(tokenId).assertEq(address(0), "pending claimant");
        setup.auctions.retrieveNoBidAuctionClaimant(tokenId).assertEq(address(0), "claimant alias");
        _assertZeroAuctionAccounting(setup, tokenId, POSTER, "no-bid settlement");
        _assertPendingRequest(setup, tokenId, requestId, "no-bid pending");
        setup.deployed.drops.isDropConsumed(authorization.dropId).assertTrue("consumed drop");

        AuctionSnapshot memory beforeTerminalReverts = _snapshot(setup, tokenId);
        (bool repeatClaimSuccess,) = _callClaimAuction(setup, tokenId);
        repeatClaimSuccess.assertFalse("repeat no-bid claim accepted");
        _callBid(setup, tokenId, FIRST_BIDDER, RESERVE_PRICE)
            .assertFalse("post-settlement bid accepted");
        (bool cancelSuccess,) = _callCancelAuctionAs(setup, tokenId, POSTER);
        cancelSuccess.assertFalse("post-settlement cancel accepted");
        _assertSnapshot(setup, tokenId, beforeTerminalReverts, "terminal reverts");

        _fulfillRandomnessAndAssertBinding(setup, tokenId, requestId, 1357);

        setup.deployed.core.ownerOf(tokenId).assertEq(POSTER, "post-fulfillment owner");
        uint256(setup.auctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.SettledNoBid), "status drift");
        setup.auctions.auctionClaim(tokenId).assertTrue("claim drift");
        _assertZeroAuctionAccounting(setup, tokenId, POSTER, "no-bid fulfillment");
    }

    function testContractPosterNoBidPendingClaimSurvivesArrngFulfillmentAndCompletes() public {
        CompositionSetup memory setup = _deployComposition();
        NoBidContractPoster contractPoster = new NoBidContractPoster();
        (, uint256 tokenId, uint256 auctionEndTime) = _mintAuctionDropForPoster(
            setup, address(contractPoster), "contract-poster-no-bid-arrng", 61
        );
        uint256 requestId = setup.randomizer.tokenToRequest(tokenId);

        vm.warp(auctionEndTime + 1);
        setup.auctions.claimAuction(tokenId);

        setup.deployed.core.ownerOf(tokenId).assertEq(address(setup.auctions), "escrow owner");
        uint256(setup.auctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.EndedNoBid), "pending status");
        setup.auctions.pendingNoBidNftClaimant(tokenId)
            .assertEq(address(contractPoster), "pending claimant");
        setup.auctions.retrieveNoBidAuctionClaimant(tokenId)
            .assertEq(address(contractPoster), "claimant alias");
        setup.auctions.auctionClaim(tokenId).assertFalse("claim prematurely set");
        _assertZeroAuctionAccounting(setup, tokenId, address(contractPoster), "pending no bid");
        _assertPendingRequest(setup, tokenId, requestId, "contract pending");

        _fulfillRandomnessAndAssertBinding(setup, tokenId, requestId, 2468);
        bytes32 fulfilledHash = setup.deployed.core.retrieveTokenHash(tokenId);

        setup.deployed.core.ownerOf(tokenId).assertEq(address(setup.auctions), "held after rng");
        uint256(setup.auctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.EndedNoBid), "pending status drift");
        setup.auctions.pendingNoBidNftClaimant(tokenId)
            .assertEq(address(contractPoster), "claimant drift");
        setup.auctions.auctionClaim(tokenId).assertFalse("claim drift");
        _assertZeroAuctionAccounting(setup, tokenId, address(contractPoster), "after rng");

        contractPoster.claimNoBid(setup.auctions, tokenId, NO_BID_RECIPIENT);

        setup.deployed.core.ownerOf(tokenId).assertEq(NO_BID_RECIPIENT, "recipient owner");
        uint256(setup.auctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.SettledNoBid), "settled");
        setup.auctions.pendingNoBidNftClaimant(tokenId).assertEq(address(0), "pending cleared");
        setup.auctions.retrieveNoBidAuctionClaimant(tokenId).assertEq(address(0), "alias cleared");
        setup.auctions.auctionClaim(tokenId).assertTrue("claim set");
        setup.deployed.core.retrieveTokenHash(tokenId).assertEq(fulfilledHash, "hash drift");
        _assertZeroAuctionAccounting(setup, tokenId, address(contractPoster), "claim complete");
    }

    function testAuctionCancellationBeforeArrngFulfillmentPreservesPosterAndRequestBinding()
        public
    {
        CompositionSetup memory setup = _deployComposition();
        (
            StreamDrops.DropAuthorization memory authorization,
            uint256 tokenId,
            uint256 auctionEndTime
        ) = _mintAuctionDrop(setup, "cancel-before-arrng-fulfillment", 71);
        uint256 requestId = setup.randomizer.tokenToRequest(tokenId);

        vm.prank(POSTER);
        setup.auctions.cancelAuction(tokenId);

        setup.deployed.core.ownerOf(tokenId).assertEq(POSTER, "poster owner");
        uint256(setup.auctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.Cancelled), "cancelled");
        setup.auctions.auctionClaim(tokenId).assertTrue("auction claim");
        setup.auctions.retrieveAuctionEndTime(tokenId).assertEq(auctionEndTime, "end time drift");
        setup.deployed.drops.isDropConsumed(authorization.dropId).assertTrue("consumed drop");
        setup.deployed.drops.isDropCancelled(authorization.dropId).assertFalse("drop cancelled");
        _assertZeroAuctionAccounting(setup, tokenId, POSTER, "cancelled");
        _assertPendingRequest(setup, tokenId, requestId, "cancel pending");

        AuctionSnapshot memory beforeTerminalReverts = _snapshot(setup, tokenId);
        (bool claimSuccess,) = _callClaimAuction(setup, tokenId);
        claimSuccess.assertFalse("claim after cancel accepted");
        (bool repeatCancelSuccess,) = _callCancelAuctionAs(setup, tokenId, POSTER);
        repeatCancelSuccess.assertFalse("repeat cancel accepted");
        _callBid(setup, tokenId, FIRST_BIDDER, RESERVE_PRICE)
            .assertFalse("post-cancel bid accepted");
        _assertSnapshot(setup, tokenId, beforeTerminalReverts, "cancel terminal reverts");

        NoopRandomizer replacement = new NoopRandomizer();
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.PendingRandomnessRequests.selector,
                COLLECTION_ID,
                address(setup.randomizer),
                uint256(1)
            )
        );
        setup.deployed.core.addRandomizer(COLLECTION_ID, address(replacement));

        _fulfillRandomnessAndAssertBinding(setup, tokenId, requestId, 9753);

        setup.deployed.core.ownerOf(tokenId).assertEq(POSTER, "post-fulfillment owner");
        uint256(setup.auctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.Cancelled), "status drift");
        setup.auctions.auctionClaim(tokenId).assertTrue("claim drift");
        _assertZeroAuctionAccounting(setup, tokenId, POSTER, "cancel fulfillment");
    }

    function testCancelledAuctionAuthorizationDoesNotMintRegisterAuctionOrRequestRandomness()
        public
    {
        CompositionSetup memory setup = _deployComposition();
        uint256 nextTokenId = setup.deployed.core.lastAllocatedTokenId() + 1;
        uint256 supplyBefore = setup.deployed.core.totalSupply();
        uint256 circulationBefore = setup.deployed.core.viewCirSupply(COLLECTION_ID);
        uint256 dropCountBefore = setup.deployed.drops.retrieveDrops().length;
        uint256 nextRequestIdBefore = setup.controller.nextRequestId();
        (StreamDrops.DropAuthorization memory authorization, bytes memory signature) = _buildSignedAuctionAuthorization(
            setup, "cancelled-auction-authorization", 81, block.timestamp + 1 days
        );

        setup.deployed.drops.cancelDrop(authorization.dropId);
        (bool success, bytes memory returnData) =
            _callMintDrop(setup, authorization, "cancelled-auction-authorization", signature);
        _assertRevertedWithMessage(success, returnData, "Drop cancelled");

        setup.deployed.drops.isDropCancelled(authorization.dropId).assertTrue("cancelled drop");
        setup.deployed.drops.isDropConsumed(authorization.dropId).assertFalse("consumed drop");
        setup.deployed.drops.retrieveTokenID(authorization.dropId).assertEq(0, "token id");
        setup.deployed.core.totalSupply().assertEq(supplyBefore, "supply");
        setup.deployed.core.viewCirSupply(COLLECTION_ID).assertEq(circulationBefore, "circulation");
        setup.deployed.drops.retrieveDrops().length.assertEq(dropCountBefore, "drop count");
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "pending");
        setup.randomizer.tokenToRequest(nextTokenId).assertEq(0, "request id");
        setup.controller.nextRequestId().assertEq(nextRequestIdBefore, "controller request");
        uint256(setup.auctions.retrieveAuctionStatus(nextTokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.None), "auction status");
        _assertZeroAuctionAccounting(setup, nextTokenId, POSTER, "cancelled auth");
    }

    function testDuplicateArrngRequestIdRejectsAuctionDropWithoutConsumingOrRegistering() public {
        CompositionSetup memory setup = _deployComposition();
        (, uint256 firstTokenId,) =
            _mintAuctionDrop(setup, "request-id-collision-auction-first", 91);
        uint256 requestId = setup.randomizer.tokenToRequest(firstTokenId);
        AuctionSnapshot memory beforeCollision = _snapshot(setup, firstTokenId);
        uint256 nextTokenId = setup.deployed.core.lastAllocatedTokenId() + 1;
        uint256 supplyBefore = setup.deployed.core.totalSupply();
        uint256 circulationBefore = setup.deployed.core.viewCirSupply(COLLECTION_ID);
        uint256 dropCountBefore = setup.deployed.drops.retrieveDrops().length;
        uint256 nextRequestIdBefore = setup.controller.nextRequestId();
        (StreamDrops.DropAuthorization memory authorization, bytes memory signature) = _buildSignedAuctionAuthorization(
            setup, "request-id-collision-auction-second", 92, block.timestamp + 1 days
        );

        setup.controller.forceNextRequestId(requestId);
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamRandomizerLifecycle.RandomnessRequestAlreadyExists.selector, requestId
            )
        );
        setup.deployed.drops
            .mintDrop(authorization, "request-id-collision-auction-second", signature);

        setup.deployed.drops.isDropConsumed(authorization.dropId)
            .assertFalse("collision consumed drop");
        setup.deployed.drops.retrieveTokenID(authorization.dropId).assertEq(0, "collision token id");
        setup.deployed.core.totalSupply().assertEq(supplyBefore, "collision supply");
        setup.deployed.core.viewCirSupply(COLLECTION_ID)
            .assertEq(circulationBefore, "collision circulation");
        setup.deployed.drops.retrieveDrops().length.assertEq(dropCountBefore, "collision drop");
        setup.randomizer.tokenToRequest(nextTokenId).assertEq(0, "collision token request");
        setup.deployed.core.retrieveTokenHash(nextTokenId).assertEq(bytes32(0), "collision hash");
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID)
            .assertEq(beforeCollision.pendingRequests, "collision pending");
        setup.controller.lastRequestId().assertEq(requestId, "collision last request");
        setup.controller.nextRequestId().assertEq(nextRequestIdBefore, "collision next request");
        uint256(setup.auctions.retrieveAuctionStatus(nextTokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.None), "collision auction status");
        setup.auctions.pendingNoBidNftClaimant(nextTokenId)
            .assertEq(address(0), "collision pending claimant");
        setup.auctions.retrieveNoBidAuctionClaimant(nextTokenId)
            .assertEq(address(0), "collision claimant alias");
        setup.auctions.auctionClaim(nextTokenId).assertFalse("collision auction claim");
        _assertZeroAuctionAccounting(setup, nextTokenId, POSTER, "collision accounting");
        _assertSnapshot(setup, firstTokenId, beforeCollision, "collision first token");

        _fulfillRandomnessAndAssertBinding(setup, firstTokenId, requestId, 3456);
        uint256(setup.auctions.retrieveAuctionStatus(firstTokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.Active), "first auction status");
    }

    function testBurnedSettledAuctionPendingArrngFulfillmentPreservesProceedsAndFreeze() public {
        CompositionSetup memory setup = _deployComposition();
        (, uint256 tokenId, uint256 auctionEndTime) =
            _mintAuctionDrop(setup, "burned-settled-auction-pending-arrng", 101);
        uint256 requestId = setup.randomizer.tokenToRequest(tokenId);

        _bid(setup.auctions, tokenId, FIRST_BIDDER, RESERVE_PRICE);
        _bid(setup.auctions, tokenId, SECOND_BIDDER, SECOND_BID);
        vm.warp(auctionEndTime + 1);
        setup.auctions.claimAuction(tokenId);

        setup.deployed.core.ownerOf(tokenId).assertEq(SECOND_BIDDER, "winner before burn");
        uint256(setup.auctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.SettledWithBid), "settled before burn");
        AuctionAccountingSnapshot memory beforeBurn = _snapshotAuctionAccounting(setup);

        vm.prank(SECOND_BIDDER);
        setup.deployed.core.burn(tokenId);

        setup.deployed.core.isTokenBurned(tokenId).assertTrue("burned token");
        uint256(setup.auctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.SettledWithBid), "status after burn");
        setup.auctions.auctionClaim(tokenId).assertTrue("claim after burn");
        setup.randomizer.tokenToRequest(tokenId).assertEq(requestId, "burn request binding");
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(1, "burn pending");
        _assertAuctionAccountingSnapshot(setup, beforeBurn, "burn proceeds");
        _assertBurnedAudit(setup, tokenId, SECOND_BIDDER, bytes32(0), bytes32(0), false);

        _warpPastFinalSupplyWindow();
        bytes32 expectedManifest =
            setup.deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID);
        setup.deployed.core.freezeCollection(COLLECTION_ID);
        setup.deployed.core.collectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "stored manifest");

        vm.recordLogs();
        bytes32 fulfilledSeed = _fulfillRandomnessAndAssertBinding(setup, tokenId, requestId, 7788);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        _countTopic(logs, METADATA_UPDATE_TOPIC).assertEq(0, "burn fulfillment metadata update");
        _countTopic(logs, BURNED_TOKEN_RANDOMNESS_RECORDED_TOPIC)
            .assertEq(1, "burn fulfillment audit event");
        _countTopic(logs, RANDOMNESS_FULFILLED_TOPIC).assertEq(1, "fulfillment event");
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "pending cleared");
        _assertBurnedAudit(setup, tokenId, SECOND_BIDDER, fulfilledSeed, fulfilledSeed, true);
        _assertAuctionAccountingSnapshot(setup, beforeBurn, "post-burn fulfillment proceeds");
        setup.deployed.core.collectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "stored manifest changed");
        setup.deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "preview manifest changed");
    }

    function testPostExecutionSignerEpochCannotReplayCancelOrBreakAuctionLifecycle() public {
        CompositionSetup memory setup = _deployComposition();
        (
            StreamDrops.DropAuthorization memory authorization,
            bytes memory signature,
            uint256 tokenId,
            uint256 auctionEndTime
        ) = _mintAuctionDropWithSignature(setup, "post-execution-epoch-auction", 31);
        _bid(setup.auctions, tokenId, FIRST_BIDDER, RESERVE_PRICE);
        AuctionSnapshot memory beforeControls = _snapshot(setup, tokenId);
        uint256 signerEpochBefore = setup.deployed.drops.signerEpoch();

        setup.deployed.drops.incrementSignerEpoch();
        setup.deployed.drops.signerEpoch().assertEq(signerEpochBefore + 1, "signer epoch");

        (bool replaySuccess, bytes memory replayReturnData) =
            _callMintDrop(setup, authorization, "post-execution-epoch-auction", signature);
        _assertRevertedWithMessage(replaySuccess, replayReturnData, "Bad epoch");
        _assertSnapshot(setup, tokenId, beforeControls, "epoch replay");

        (bool cancelSuccess, bytes memory cancelReturnData) =
            _callCancelDrop(setup, authorization.dropId);
        _assertRevertedWithMessage(cancelSuccess, cancelReturnData, "Drop consumed");
        _assertSnapshot(setup, tokenId, beforeControls, "epoch cancel");
        setup.deployed.drops.isDropConsumed(authorization.dropId).assertTrue("consumed drop");
        setup.deployed.drops.isDropCancelled(authorization.dropId)
            .assertFalse("cancelled consumed drop");

        _bid(setup.auctions, tokenId, SECOND_BIDDER, SECOND_BID);
        vm.warp(auctionEndTime + 1);
        setup.auctions.claimAuction(tokenId);
        setup.deployed.core.ownerOf(tokenId).assertEq(SECOND_BIDDER, "winner after epoch");
        uint256(setup.auctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.SettledWithBid), "settled");

        AuctionAccountingSnapshot memory beforeFulfillment = _snapshotAuctionAccounting(setup);
        _fulfillRandomnessAndAssertBinding(
            setup, tokenId, setup.randomizer.tokenToRequest(tokenId), 1234
        );
        _assertAuctionAccountingSnapshot(setup, beforeFulfillment, "epoch fulfillment");
    }

    function testSignerRotationAndDropPauseAfterAuctionDropDoNotBlockExistingLifecycle() public {
        CompositionSetup memory setup = _deployComposition();
        (
            StreamDrops.DropAuthorization memory authorization,
            bytes memory signature,
            uint256 tokenId,
            uint256 auctionEndTime
        ) = _mintAuctionDropWithSignature(setup, "post-execution-rotation-auction", 41);
        AuctionSnapshot memory beforeRotation = _snapshot(setup, tokenId);

        setup.deployed.drops.updateTDHsigner(otherSignerAddress());
        (bool replaySuccess, bytes memory replayReturnData) =
            _callMintDrop(setup, authorization, "post-execution-rotation-auction", signature);
        _assertRevertedWithMessage(replaySuccess, replayReturnData, "Wrong signer");
        _assertSnapshot(setup, tokenId, beforeRotation, "rotation replay");

        _setPaused(setup, StreamPauseDomains.DROP_EXECUTION, true);
        (bool pausedReplaySuccess, bytes memory pausedReplayReturnData) =
            _callMintDrop(setup, authorization, "post-execution-rotation-auction", signature);
        _assertRevertedWithMessage(pausedReplaySuccess, pausedReplayReturnData, "Drop paused");
        _assertSnapshot(setup, tokenId, beforeRotation, "drop pause replay");

        _bid(setup.auctions, tokenId, FIRST_BIDDER, RESERVE_PRICE);
        _bid(setup.auctions, tokenId, SECOND_BIDDER, SECOND_BID);
        vm.warp(auctionEndTime + 1);
        setup.auctions.claimAuction(tokenId);

        setup.deployed.core.ownerOf(tokenId).assertEq(SECOND_BIDDER, "winner after rotation");
        uint256(setup.auctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.SettledWithBid), "settled");

        AuctionAccountingSnapshot memory beforeFulfillment = _snapshotAuctionAccounting(setup);
        _fulfillRandomnessAndAssertBinding(
            setup, tokenId, setup.randomizer.tokenToRequest(tokenId), 5678
        );
        setup.deployed.admins.isPaused(StreamPauseDomains.DROP_EXECUTION)
            .assertTrue("drop pause still set");
        _assertAuctionAccountingSnapshot(setup, beforeFulfillment, "rotation fulfillment");
    }

    function _deployComposition() private returns (CompositionSetup memory setup) {
        setup.deployed = deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        setup.deployed.admins.updateEmergencyRecipient(EMERGENCY_RECIPIENT);
        setup.controller = new CompositionArrngController();
        setup.randomizer = new NextGenRandomizerRNG(
            address(setup.deployed.core), address(setup.deployed.admins), address(setup.controller)
        );
        setup.deployed.core.addRandomizer(COLLECTION_ID, address(setup.randomizer));
        setup.auctions = new StreamAuctions(
            address(setup.deployed.minter),
            address(setup.deployed.core),
            address(setup.deployed.admins),
            address(setup.deployed.drops),
            PAYOUT,
            CURATORS_POOL
        );
        setup.deployed.drops.updateAuctionContract(address(setup.auctions));
    }

    function _mintAuctionDrop(CompositionSetup memory setup, string memory tokenData, uint256 nonce)
        private
        returns (
            StreamDrops.DropAuthorization memory authorization,
            uint256 tokenId,
            uint256 auctionEndTime
        )
    {
        (authorization,, tokenId, auctionEndTime) =
            _mintAuctionDropWithSignature(setup, tokenData, nonce);
    }

    function _mintAuctionDropForPoster(
        CompositionSetup memory setup,
        address poster,
        string memory tokenData,
        uint256 nonce
    )
        private
        returns (
            StreamDrops.DropAuthorization memory authorization,
            uint256 tokenId,
            uint256 auctionEndTime
        )
    {
        (authorization,, tokenId, auctionEndTime) =
            _mintAuctionDropWithSignatureForPoster(setup, poster, tokenData, nonce);
    }

    function _mintAuctionDropWithSignature(
        CompositionSetup memory setup,
        string memory tokenData,
        uint256 nonce
    )
        private
        returns (
            StreamDrops.DropAuthorization memory authorization,
            bytes memory signature,
            uint256 tokenId,
            uint256 auctionEndTime
        )
    {
        return _mintAuctionDropWithSignatureForPoster(setup, POSTER, tokenData, nonce);
    }

    function _mintAuctionDropWithSignatureForPoster(
        CompositionSetup memory setup,
        address poster,
        string memory tokenData,
        uint256 nonce
    )
        private
        returns (
            StreamDrops.DropAuthorization memory authorization,
            bytes memory signature,
            uint256 tokenId,
            uint256 auctionEndTime
        )
    {
        (authorization, signature) =
            _buildSignedAuctionAuthorizationForPoster(
                setup, poster, tokenData, nonce, block.timestamp + 1 days
            );
        setup.deployed.drops.mintDrop(authorization, tokenData, signature);
        tokenId = setup.deployed.drops.retrieveTokenID(authorization.dropId);
        auctionEndTime = authorization.auctionEndTime;

        setup.deployed.core.ownerOf(tokenId).assertEq(address(setup.auctions), "auction custody");
        uint256(setup.auctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.Active), "auction active");
        setup.randomizer.tokenToRequest(tokenId)
            .assertEq(setup.controller.lastRequestId(), "request id");
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(1, "pending request");
    }

    function _buildSignedAuctionAuthorization(
        CompositionSetup memory setup,
        string memory tokenData,
        uint256 nonce,
        uint256 auctionEndTime
    ) private returns (StreamDrops.DropAuthorization memory authorization, bytes memory signature) {
        return _buildSignedAuctionAuthorizationForPoster(
            setup, POSTER, tokenData, nonce, auctionEndTime
        );
    }

    function _buildSignedAuctionAuthorizationForPoster(
        CompositionSetup memory setup,
        address poster,
        string memory tokenData,
        uint256 nonce,
        uint256 auctionEndTime
    ) private returns (StreamDrops.DropAuthorization memory authorization, bytes memory signature) {
        authorization = buildAuctionAuthorization(
            setup.deployed.drops,
            poster,
            address(0),
            tokenData,
            COLLECTION_ID,
            RESERVE_PRICE,
            auctionEndTime,
            nonce,
            nonce,
            block.timestamp + 2 days
        );
        signature = signAuthorization(setup.deployed.drops, authorization);
    }

    function _bid(StreamAuctions auctions, uint256 tokenId, address bidder, uint256 amount)
        private
    {
        vm.deal(bidder, amount);
        vm.prank(bidder);
        // This test intentionally funds the auction contract through the public
        // bid path while asserting payment invariants after the call.
        // slither-disable-next-line arbitrary-send-eth
        auctions.participateToAuction{ value: amount }(tokenId);
    }

    function _setPaused(CompositionSetup memory setup, bytes32 domain, bool paused) private {
        setup.deployed.admins.setPaused(domain, paused, PAUSE_REASON);
        if (paused) {
            setup.deployed.admins.isPaused(domain).assertTrue("paused domain");
        } else {
            setup.deployed.admins.isPaused(domain).assertFalse("unpaused domain");
        }
    }

    function _snapshot(CompositionSetup memory setup, uint256 tokenId)
        private
        view
        returns (AuctionSnapshot memory snapshot)
    {
        snapshot = AuctionSnapshot({
            status: uint256(setup.auctions.retrieveAuctionStatus(tokenId)),
            owner: setup.deployed.core.ownerOf(tokenId),
            highestBid: setup.auctions.auctionHighestBid(tokenId),
            highestBidder: setup.auctions.auctionHighestBidder(tokenId),
            totalBidderOwed: setup.auctions.totalBidderOwed(),
            totalAuctionBidEscrow: setup.auctions.totalAuctionBidEscrow(),
            totalProceedsOwed: setup.auctions.totalProceedsOwed(),
            totalOwed: setup.auctions.totalOwed(),
            balance: address(setup.auctions).balance,
            pendingNoBidClaimant: setup.auctions.pendingNoBidNftClaimant(tokenId),
            noBidClaimantAlias: setup.auctions.retrieveNoBidAuctionClaimant(tokenId),
            auctionClaim: setup.auctions.auctionClaim(tokenId),
            pendingRequests: setup.randomizer.pendingRandomnessRequests(COLLECTION_ID),
            randomizerEpoch: setup.deployed.core.viewRandomizerEpoch(COLLECTION_ID),
            collectionRandomizer: setup.deployed.core
            .viewCollectionRandomizerContract(COLLECTION_ID),
            tokenRequest: setup.randomizer.tokenToRequest(tokenId),
            tokenHash: setup.deployed.core.retrieveTokenHash(tokenId)
        });
    }

    function _snapshotAuctionAccounting(CompositionSetup memory setup)
        private
        view
        returns (AuctionAccountingSnapshot memory snapshot)
    {
        snapshot = AuctionAccountingSnapshot({
            bidderCredit: setup.auctions.auctionBidderCredits(FIRST_BIDDER),
            posterCredit: setup.auctions.auctionPosterCredits(POSTER),
            protocolCredit: setup.auctions.auctionProtocolCredits(PAYOUT),
            curatorCredit: setup.auctions.auctionCuratorCredits(CURATORS_POOL),
            totalOwed: setup.auctions.totalOwed(),
            balance: address(setup.auctions).balance
        });
    }

    function _fulfillRandomnessAndAssertBinding(
        CompositionSetup memory setup,
        uint256 tokenId,
        uint256 requestId,
        uint256 word
    ) private returns (bytes32 expectedSeed) {
        uint256[] memory words = _words(word);
        uint256 randomizerEpoch = setup.deployed.core.viewRandomizerEpoch(COLLECTION_ID);
        expectedSeed =
            _expectedSeed(address(setup.randomizer), requestId, tokenId, randomizerEpoch, words);
        bytes32 rawOutputHash = keccak256(abi.encode(words));
        setup.controller.fulfill(setup.randomizer, requestId, words);

        setup.deployed.core.retrieveTokenHash(tokenId).assertEq(expectedSeed, "fulfilled hash");
        uint256(setup.randomizer.randomnessRequestState(requestId))
            .assertEq(
                uint256(StreamRandomizerLifecycle.RandomnessRequestState.Fulfilled), "fulfilled"
            );
        StreamRandomizerLifecycle.RandomnessRequest memory request =
            setup.randomizer.retrieveRandomnessRequest(requestId);
        request.collectionId.assertEq(COLLECTION_ID, "request collection");
        request.tokenId.assertEq(tokenId, "request token");
        request.provider.assertEq(address(setup.randomizer), "request provider");
        request.randomizerEpoch.assertEq(randomizerEpoch, "request epoch");
        request.derivedSeed.assertEq(expectedSeed, "request seed");
        request.rawOutputHash.assertEq(rawOutputHash, "request raw hash");
    }

    function _assertBurnedAudit(
        CompositionSetup memory setup,
        uint256 tokenId,
        address owner,
        bytes32 tokenHash,
        bytes32 postBurnRandomnessHash,
        bool postBurnRecorded
    ) private view {
        {
            (
                bool burned,
                uint256 collectionId,
                address auditOwner,
                address operator,
                uint256 burnedBlock,
                uint256 burnedTimestamp,,,,
            ) = setup.deployed.core.burnedTokenAuditState(tokenId);

            burned.assertTrue("audit burned");
            collectionId.assertEq(COLLECTION_ID, "audit collection");
            auditOwner.assertEq(owner, "audit owner");
            operator.assertEq(owner, "audit operator");
            (burnedBlock > 0).assertTrue("audit burn block");
            (burnedTimestamp > 0).assertTrue("audit burn timestamp");
        }
        {
            (
                ,,,,,,
                bytes32 auditTokenHash,
                bytes32 auditPostBurnRandomnessHash,
                uint256 postBurnRandomnessBlock,
                uint256 postBurnRandomnessTimestamp
            ) = setup.deployed.core.burnedTokenAuditState(tokenId);

            auditTokenHash.assertEq(tokenHash, "audit token hash");
            auditPostBurnRandomnessHash.assertEq(postBurnRandomnessHash, "audit post-burn hash");
            if (postBurnRecorded) {
                (postBurnRandomnessBlock > 0).assertTrue("post-burn block");
                (postBurnRandomnessTimestamp > 0).assertTrue("post-burn timestamp");
            } else {
                postBurnRandomnessBlock.assertEq(0, "unexpected post-burn block");
                postBurnRandomnessTimestamp.assertEq(0, "unexpected post-burn timestamp");
            }
        }
    }

    function _warpPastFinalSupplyWindow() private {
        vm.warp(block.timestamp + 31 days + 1);
    }

    function _countTopic(Vm.Log[] memory logs, bytes32 topic) private pure returns (uint256 count) {
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length > 0 && logs[i].topics[0] == topic) {
                count++;
            }
        }
    }

    function _assertAuctionAccountingSnapshot(
        CompositionSetup memory setup,
        AuctionAccountingSnapshot memory snapshot,
        string memory label
    ) private view {
        setup.auctions.auctionBidderCredits(FIRST_BIDDER).assertEq(snapshot.bidderCredit, label);
        setup.auctions.auctionPosterCredits(POSTER).assertEq(snapshot.posterCredit, label);
        setup.auctions.auctionProtocolCredits(PAYOUT).assertEq(snapshot.protocolCredit, label);
        setup.auctions.auctionCuratorCredits(CURATORS_POOL).assertEq(snapshot.curatorCredit, label);
        setup.auctions.totalOwed().assertEq(snapshot.totalOwed, label);
        address(setup.auctions).balance.assertEq(snapshot.balance, label);
    }

    function _assertZeroAuctionAccounting(
        CompositionSetup memory setup,
        uint256 tokenId,
        address poster,
        string memory label
    ) private view {
        setup.auctions.auctionHighestBid(tokenId).assertEq(0, label);
        setup.auctions.auctionHighestBidder(tokenId).assertEq(address(0), label);
        setup.auctions.auctionBidderCredits(FIRST_BIDDER).assertEq(0, label);
        setup.auctions.auctionBidderCredits(SECOND_BIDDER).assertEq(0, label);
        setup.auctions.auctionPosterCredits(poster).assertEq(0, label);
        setup.auctions.auctionProtocolCredits(PAYOUT).assertEq(0, label);
        setup.auctions.auctionCuratorCredits(CURATORS_POOL).assertEq(0, label);
        setup.auctions.totalBidderOwed().assertEq(0, label);
        setup.auctions.totalAuctionBidEscrow().assertEq(0, label);
        setup.auctions.totalProceedsOwed().assertEq(0, label);
        setup.auctions.totalOwed().assertEq(0, label);
        address(setup.auctions).balance.assertEq(0, label);
    }

    function _assertPendingRequest(
        CompositionSetup memory setup,
        uint256 tokenId,
        uint256 requestId,
        string memory label
    ) private view {
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(1, label);
        setup.randomizer.tokenToRequest(tokenId).assertEq(requestId, label);
        uint256(setup.randomizer.randomnessRequestState(requestId))
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.Pending), label);
        setup.deployed.core.retrieveTokenHash(tokenId).assertEq(bytes32(0), label);
    }

    function _assertSnapshot(
        CompositionSetup memory setup,
        uint256 tokenId,
        AuctionSnapshot memory beforeSnapshot,
        string memory label
    ) private view {
        uint256(setup.auctions.retrieveAuctionStatus(tokenId))
            .assertEq(beforeSnapshot.status, label);
        setup.deployed.core.ownerOf(tokenId).assertEq(beforeSnapshot.owner, label);
        setup.auctions.auctionHighestBid(tokenId).assertEq(beforeSnapshot.highestBid, label);
        setup.auctions.auctionHighestBidder(tokenId).assertEq(beforeSnapshot.highestBidder, label);
        setup.auctions.totalBidderOwed().assertEq(beforeSnapshot.totalBidderOwed, label);
        setup.auctions.totalAuctionBidEscrow().assertEq(beforeSnapshot.totalAuctionBidEscrow, label);
        setup.auctions.totalProceedsOwed().assertEq(beforeSnapshot.totalProceedsOwed, label);
        setup.auctions.totalOwed().assertEq(beforeSnapshot.totalOwed, label);
        address(setup.auctions).balance.assertEq(beforeSnapshot.balance, label);
        setup.auctions.pendingNoBidNftClaimant(tokenId)
            .assertEq(beforeSnapshot.pendingNoBidClaimant, label);
        setup.auctions.retrieveNoBidAuctionClaimant(tokenId)
            .assertEq(beforeSnapshot.noBidClaimantAlias, label);
        if (beforeSnapshot.auctionClaim) {
            setup.auctions.auctionClaim(tokenId).assertTrue(label);
        } else {
            setup.auctions.auctionClaim(tokenId).assertFalse(label);
        }
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID)
            .assertEq(beforeSnapshot.pendingRequests, label);
        setup.deployed.core.viewRandomizerEpoch(COLLECTION_ID)
            .assertEq(beforeSnapshot.randomizerEpoch, label);
        setup.deployed.core.viewCollectionRandomizerContract(COLLECTION_ID)
            .assertEq(beforeSnapshot.collectionRandomizer, label);
        setup.randomizer.tokenToRequest(tokenId).assertEq(beforeSnapshot.tokenRequest, label);
        setup.deployed.core.retrieveTokenHash(tokenId).assertEq(beforeSnapshot.tokenHash, label);
    }

    function _callClaimAuction(CompositionSetup memory setup, uint256 tokenId)
        private
        returns (bool success, bytes memory returnData)
    {
        (success, returnData) = address(setup.auctions)
            .call(abi.encodeWithSelector(setup.auctions.claimAuction.selector, tokenId));
    }

    function _callCancelAuctionAs(CompositionSetup memory setup, uint256 tokenId, address caller)
        private
        returns (bool success, bytes memory returnData)
    {
        vm.prank(caller);
        (success, returnData) = address(setup.auctions)
            .call(abi.encodeWithSelector(setup.auctions.cancelAuction.selector, tokenId));
    }

    function _callBid(
        CompositionSetup memory setup,
        uint256 tokenId,
        address bidder,
        uint256 amount
    ) private returns (bool success) {
        vm.deal(bidder, amount);
        vm.prank(bidder);
        (success,) = address(setup.auctions).call{ value: amount }(
            abi.encodeWithSelector(setup.auctions.participateToAuction.selector, tokenId)
        );
    }

    function _callMintDrop(
        CompositionSetup memory setup,
        StreamDrops.DropAuthorization memory authorization,
        string memory tokenData,
        bytes memory signature
    ) private returns (bool success, bytes memory returnData) {
        (success, returnData) = address(setup.deployed.drops)
            .call(
                abi.encodeWithSelector(
                    setup.deployed.drops.mintDrop.selector, authorization, tokenData, signature
                )
            );
    }

    function _callCancelDrop(CompositionSetup memory setup, bytes32 dropId)
        private
        returns (bool success, bytes memory returnData)
    {
        (success, returnData) = address(setup.deployed.drops)
            .call(abi.encodeWithSelector(setup.deployed.drops.cancelDrop.selector, dropId));
    }

    function _assertRevertedWithMessage(
        bool success,
        bytes memory returnData,
        string memory expectedMessage
    ) private pure {
        success.assertFalse("call unexpectedly succeeded");
        // Pin the current nested Error(string) revert surface. If the production
        // path moves to custom errors, update these low-level assertions.
        require(returnData.length >= 4, "short revert");
        // Casting to bytes4 is safe: an Error(string) payload starts with the selector.
        // forge-lint: disable-next-line(unsafe-typecast)
        bytes4 selector = bytes4(returnData);
        require(selector == ERROR_STRING_SELECTOR, "unexpected revert selector");
        _decodeErrorString(returnData).assertEq(expectedMessage, "unexpected revert");
    }

    function _decodeErrorString(bytes memory returnData) private pure returns (string memory) {
        require(returnData.length >= 4, "short revert");
        bytes memory encodedReason = new bytes(returnData.length - 4);
        for (uint256 i = 0; i < encodedReason.length; i++) {
            encodedReason[i] = returnData[i + 4];
        }
        return abi.decode(encodedReason, (string));
    }

    function _words(uint256 word) private pure returns (uint256[] memory words) {
        words = new uint256[](1);
        words[0] = word;
    }

    function _expectedSeed(
        address provider,
        uint256 requestId,
        uint256 tokenId,
        uint256 randomizerEpoch,
        uint256[] memory words
    ) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                RANDOMNESS_SEED_TYPEHASH,
                provider,
                requestId,
                COLLECTION_ID,
                tokenId,
                randomizerEpoch,
                keccak256(abi.encode(words))
            )
        );
    }
}

contract CompositionArrngController {
    uint256 public nextRequestId = 1;
    uint256 public lastRequestId;
    uint256 public forcedRequestId;

    function forceNextRequestId(uint256 requestId) external {
        forcedRequestId = requestId;
    }

    function requestRandomWords(uint256, address) external payable returns (uint256 requestId) {
        requestId = forcedRequestId;
        if (requestId == 0) {
            requestId = nextRequestId;
            nextRequestId++;
        } else {
            forcedRequestId = 0;
        }
        lastRequestId = requestId;
    }

    // Permissionless on purpose: this test double models a cooperative arRNG
    // controller, not production access control.
    function fulfill(NextGenRandomizerRNG randomizer, uint256 requestId, uint256[] memory words)
        external
    {
        randomizer.receiveRandomness(requestId, words);
    }
}

contract NoBidContractPoster {
    function claimNoBid(StreamAuctions auctions, uint256 tokenId, address recipient) external {
        auctions.claimNoBidAuctionToken(tokenId, recipient);
    }
}
