// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/AuctionContract.sol";
import "../smart-contracts/StreamDrops.sol";
import "./helpers/Assertions.sol";
import "./helpers/DropAuthTestHelper.sol";
import "./helpers/StreamFixture.sol";

contract StreamAuctionInvariantTest is DropAuthTestHelper {
    uint256 private constant SEQUENCE_LENGTH = 24;

    AuctionConsistencyInvariantHandler private handler;

    function setUp() public {
        handler = new AuctionConsistencyInvariantHandler(signerAddress());
    }

    function testAuctionConsistencyInvariantsHoldAcrossBoundedSequences(
        uint256[SEQUENCE_LENGTH] memory actionSeeds,
        uint256[SEQUENCE_LENGTH] memory firstArgs,
        uint256[SEQUENCE_LENGTH] memory secondArgs
    ) public {
        handler.assertAuctionInvariants();
        for (uint256 i = 0; i < SEQUENCE_LENGTH; i++) {
            handler.runAction(actionSeeds[i], firstArgs[i], secondArgs[i]);
            handler.assertAuctionInvariants();
        }

        handler.ensureAuction();
        handler.assertAuctionInvariants();
        handler.forceTerminalCoverage();
        handler.assertAuctionInvariants();
    }
}

contract AuctionConsistencyInvariantHandler is DropAuthTestHelper, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for uint256;

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant MAX_AUCTIONS = 6;
    uint256 private constant MAX_PAYMENT = 16 ether;
    uint256 private constant RESERVE_PRICE = 5 ether;

    address private constant POSTER = address(0x1001);
    address private constant SECOND_POSTER = address(0x1002);
    address private constant PAYOUT = address(0x2001);
    address private constant CURATORS_POOL = address(0x3001);
    address private constant FIRST_BIDDER = address(0x4001);
    address private constant SECOND_BIDDER = address(0x4002);
    address private constant THIRD_BIDDER = address(0x4003);
    address private constant WITHDRAW_RECIPIENT = address(0x5001);

    struct AuctionModel {
        bool exists;
        bool cancelled;
        bool settledNoBid;
        bool settledWithBid;
        uint256 tokenId;
        uint256 reservePrice;
        uint256 endTime;
        uint256 highestBid;
        address poster;
        address highestBidder;
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
    }

    DeployedStream private deployed;
    StreamAuctions private auctions;

    AuctionModel[MAX_AUCTIONS] private auctionModels;
    uint256 private auctionCount;
    uint256 private nextNonce = 1;

    mapping(address => uint256) private expectedBidderCredits;
    mapping(address => uint256) private expectedPosterCredits;
    mapping(address => uint256) private expectedProtocolCredits;
    mapping(address => uint256) private expectedCuratorCredits;

    constructor(address signer) {
        deployed = deployStreamWithSigner(PAYOUT, CURATORS_POOL, signer);
        deployed.admins.updateEmergencyRecipient(WITHDRAW_RECIPIENT);
        auctions = new StreamAuctions(
            address(deployed.minter),
            address(deployed.core),
            address(deployed.admins),
            address(deployed.drops),
            PAYOUT,
            CURATORS_POOL
        );
        deployed.drops.updateAuctionContract(address(auctions));
    }

    function runAction(uint256 actionSeed, uint256 firstArg, uint256 secondArg) external {
        uint256 action = actionSeed % 12;
        if (action == 0) {
            mintAuction(firstArg);
        } else if (action == 1) {
            cancelAuction(firstArg);
        } else if (action == 2) {
            bidAuction(firstArg, secondArg);
        } else if (action == 3) {
            outbidAuction(firstArg, secondArg);
        } else if (action == 4) {
            attemptUnderbid(firstArg, secondArg);
        } else if (action == 5) {
            settleAuction(firstArg);
        } else if (action == 6) {
            attemptRepeatSettlement(firstArg);
        } else if (action == 7) {
            attemptLateBid(firstArg, secondArg);
        } else if (action == 8) {
            withdrawBidderCredit(firstArg);
        } else if (action == 9) {
            withdrawProceedsCredit(firstArg);
        } else if (action == 10) {
            forceAuctionSurplus(firstArg);
        } else {
            emergencyWithdrawSurplus();
        }
    }

    function ensureAuction() public {
        if (auctionCount == 0) {
            mintAuction(0);
        }
    }

    function forceTerminalCoverage() public {
        if (auctionCount == 0) {
            mintAuction(0);
        }

        for (uint256 i = 0; i < auctionCount; i++) {
            if (_isTerminal(auctionModels[i])) {
                continue;
            }
            if (auctionModels[i].highestBid == 0 && i % 2 == 0) {
                cancelAuction(i);
                continue;
            }
            if (auctionModels[i].highestBid == 0) {
                bidAuction(i, i);
            }
            settleAuction(i);
            attemptRepeatSettlement(i);
            attemptLateBid(i, i);
        }
    }

    function mintAuction(uint256 posterSeed) public {
        if (auctionCount >= MAX_AUCTIONS) {
            return;
        }
        uint256 currentNonce = nextNonce;
        nextNonce++;
        uint256 auctionIndex = auctionCount;
        auctionCount++;

        address poster = _poster(posterSeed);
        uint256 reserve = RESERVE_PRICE + (currentNonce * 1 wei);
        uint256 auctionEndTime = block.timestamp + 1 days;
        string memory tokenData = _tokenData(currentNonce);

        StreamDrops.DropAuthorization memory authorization = buildAuctionAuthorization(
            deployed.drops,
            poster,
            address(0),
            tokenData,
            COLLECTION_ID,
            reserve,
            auctionEndTime,
            currentNonce,
            currentNonce,
            block.timestamp + 2 days
        );
        bytes memory signature = signAuthorization(deployed.drops, authorization);

        deployed.drops.mintDrop(authorization, tokenData, signature);
        uint256 tokenId = deployed.drops.retrieveTokenID(authorization.dropId);

        auctionModels[auctionIndex] = AuctionModel({
            exists: true,
            cancelled: false,
            settledNoBid: false,
            settledWithBid: false,
            tokenId: tokenId,
            reservePrice: reserve,
            endTime: auctionEndTime,
            highestBid: 0,
            poster: poster,
            highestBidder: address(0)
        });

        deployed.core.ownerOf(tokenId).assertEq(address(auctions), "mint custody");
        uint256(auctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.Active), "mint status");
    }

    function cancelAuction(uint256 auctionSeed) public {
        (bool found, uint256 index) = _selectAuction(auctionSeed);
        if (!found) {
            return;
        }
        AuctionModel storage model = auctionModels[index];
        bool cancellable = !_isTerminal(model) && model.highestBid == 0
            && auctions.retrieveAuctionStatus(model.tokenId) == StreamAuctions.AuctionStatus.Active;

        if (!cancellable) {
            _attemptInvalidCancel(index);
            return;
        }

        vm.prank(model.poster);
        auctions.cancelAuction(model.tokenId);
        model.cancelled = true;
    }

    function bidAuction(uint256 auctionSeed, uint256 bidderSeed) public {
        (bool found, uint256 index) = _selectAuction(auctionSeed);
        if (!found) {
            return;
        }
        AuctionModel storage model = auctionModels[index];
        if (auctions.retrieveAuctionStatus(model.tokenId) != StreamAuctions.AuctionStatus.Active) {
            return;
        }

        uint256 bid = _minimumBid(model);
        address bidder = _nextBidder(model.highestBidder, bidderSeed);

        vm.deal(bidder, bidder.balance + bid);
        vm.prank(bidder);
        // The handler intentionally pays the contract under test; auction
        // accounting safety is asserted after each generated action.
        // slither-disable-next-line arbitrary-send-eth
        auctions.participateToAuction{ value: bid }(model.tokenId);

        _recordSuccessfulBid(model, bidder, bid);
    }

    function outbidAuction(uint256 auctionSeed, uint256 bidderSeed) public {
        (bool found, uint256 index) = _selectAuction(auctionSeed);
        if (!found) {
            return;
        }
        AuctionModel storage model = auctionModels[index];
        if (model.highestBid == 0) {
            bidAuction(index, bidderSeed);
            return;
        }
        bidAuction(index, bidderSeed);
    }

    function attemptUnderbid(uint256 auctionSeed, uint256 bidderSeed) public {
        (bool found, uint256 index) = _selectAuction(auctionSeed);
        if (!found) {
            return;
        }
        AuctionModel storage model = auctionModels[index];
        if (auctions.retrieveAuctionStatus(model.tokenId) != StreamAuctions.AuctionStatus.Active) {
            return;
        }

        uint256 minimumBid = _minimumBid(model);
        if (minimumBid == 0) {
            return;
        }
        uint256 underbid = minimumBid - 1;
        address bidder = _nextBidder(model.highestBidder, bidderSeed);
        AuctionSnapshot memory beforeSnapshot = _snapshot(model.tokenId);

        vm.deal(bidder, bidder.balance + underbid);
        vm.prank(bidder);
        // slither-disable-next-line arbitrary-send-eth
        (bool success,) = address(auctions).call{ value: underbid }(
            abi.encodeWithSelector(auctions.participateToAuction.selector, model.tokenId)
        );

        success.assertFalse("underbid accepted");
        _assertSnapshotUnchanged(model.tokenId, beforeSnapshot, "underbid");
    }

    function settleAuction(uint256 auctionSeed) public {
        (bool found, uint256 index) = _selectAuction(auctionSeed);
        if (!found) {
            return;
        }
        AuctionModel storage model = auctionModels[index];
        if (_isTerminal(model)) {
            return;
        }

        if (block.timestamp <= model.endTime) {
            vm.warp(model.endTime + 1);
        }
        StreamAuctions.AuctionStatus status = auctions.retrieveAuctionStatus(model.tokenId);
        if (
            status != StreamAuctions.AuctionStatus.EndedNoBid
                && status != StreamAuctions.AuctionStatus.EndedWithBid
        ) {
            return;
        }

        auctions.claimAuction(model.tokenId);
        if (model.highestBid == 0) {
            model.settledNoBid = true;
        } else {
            model.settledWithBid = true;
            _recordSuccessfulSettlement(model);
        }
    }

    function attemptRepeatSettlement(uint256 auctionSeed) public {
        (bool found, uint256 index) = _selectAuction(auctionSeed);
        if (!found || !_isTerminal(auctionModels[index])) {
            return;
        }
        AuctionModel storage model = auctionModels[index];
        AuctionSnapshot memory beforeSnapshot = _snapshot(model.tokenId);

        (bool success,) = address(auctions)
            .call(abi.encodeWithSelector(auctions.claimAuction.selector, model.tokenId));

        success.assertFalse("repeat settlement accepted");
        _assertSnapshotUnchanged(model.tokenId, beforeSnapshot, "repeat settlement");
    }

    function attemptLateBid(uint256 auctionSeed, uint256 bidderSeed) public {
        (bool found, uint256 index) = _selectAuction(auctionSeed);
        if (!found) {
            return;
        }
        AuctionModel storage model = auctionModels[index];
        if (auctions.retrieveAuctionStatus(model.tokenId) == StreamAuctions.AuctionStatus.Active) {
            vm.warp(model.endTime + 1);
        }
        if (auctions.retrieveAuctionStatus(model.tokenId) == StreamAuctions.AuctionStatus.Active) {
            return;
        }

        uint256 bid = _minimumBid(model);
        if (bid == 0) {
            bid = 1 wei;
        }
        address bidder = _nextBidder(model.highestBidder, bidderSeed);
        AuctionSnapshot memory beforeSnapshot = _snapshot(model.tokenId);

        vm.deal(bidder, bidder.balance + bid);
        vm.prank(bidder);
        // slither-disable-next-line arbitrary-send-eth
        (bool success,) = address(auctions).call{ value: bid }(
            abi.encodeWithSelector(auctions.participateToAuction.selector, model.tokenId)
        );

        success.assertFalse("late bid accepted");
        _assertSnapshotUnchanged(model.tokenId, beforeSnapshot, "late bid");
    }

    function withdrawBidderCredit(uint256 accountSeed) public {
        address account = _bidderWithdrawalAccount(accountSeed);
        uint256 credit = expectedBidderCredits[account];
        if (credit == 0) {
            return;
        }

        vm.prank(account);
        auctions.withdrawBidderCreditTo(payable(WITHDRAW_RECIPIENT));
        expectedBidderCredits[account] = 0;
    }

    function withdrawProceedsCredit(uint256 accountSeed) public {
        address account = _proceedsWithdrawalAccount(accountSeed);
        uint256 credit = expectedPosterCredits[account] + expectedProtocolCredits[account]
            + expectedCuratorCredits[account];
        if (credit == 0) {
            return;
        }

        vm.prank(account);
        auctions.withdrawAuctionProceedsCreditTo(payable(WITHDRAW_RECIPIENT));
        expectedPosterCredits[account] = 0;
        expectedProtocolCredits[account] = 0;
        expectedCuratorCredits[account] = 0;
    }

    function forceAuctionSurplus(uint256 rawAmount) public {
        uint256 amount = rawAmount % (MAX_PAYMENT + 1);
        if (amount == 0) {
            return;
        }
        vm.deal(address(auctions), address(auctions).balance + amount);
    }

    function emergencyWithdrawSurplus() public {
        auctions.emergencyWithdraw();
    }

    function assertAuctionInvariants() public view {
        uint256 expectedEscrow;
        for (uint256 i = 0; i < auctionCount; i++) {
            AuctionModel storage model = auctionModels[i];
            _assertAuctionState(model);
            if (model.highestBid != 0 && !model.settledWithBid) {
                expectedEscrow += model.highestBid;
            }
        }

        expectedEscrow.assertEq(auctions.totalAuctionBidEscrow(), "active bid escrow");
        expectedEscrow.assertEq(auctions.totalReserved(), "reserved alias");

        uint256 expectedBidderOwed = _expectedBidderOwed();
        uint256 expectedPosterOwed = _expectedPosterOwed();
        uint256 expectedProtocolOwed = expectedProtocolCredits[PAYOUT];
        uint256 expectedCuratorOwed = expectedCuratorCredits[CURATORS_POOL];
        uint256 expectedProceedsOwed =
            expectedPosterOwed + expectedProtocolOwed + expectedCuratorOwed;
        uint256 expectedTotalOwed = expectedBidderOwed + expectedEscrow + expectedProceedsOwed;

        expectedBidderOwed.assertEq(auctions.totalBidderOwed(), "bidder owed");
        expectedPosterOwed.assertEq(auctions.totalPosterOwed(), "poster owed");
        expectedProtocolOwed.assertEq(auctions.totalProtocolOwed(), "protocol owed");
        expectedCuratorOwed.assertEq(auctions.totalCuratorOwed(), "curator owed");
        expectedProceedsOwed.assertEq(auctions.totalProceedsOwed(), "proceeds owed");
        expectedTotalOwed.assertEq(auctions.totalOwed(), "total owed");
        auctions.totalCuratorReserved().assertEq(0, "curator reserve");
        auctions.totalRandomnessReserved().assertEq(0, "randomness reserve");
        address(auctions).balance.assertGte(auctions.totalOwed(), "auction balance coverage");
        auctions.emergencyWithdrawable()
            .assertEq(_surplus(address(auctions), auctions.totalOwed()), "surplus");
        auctions.surplus().assertEq(auctions.emergencyWithdrawable(), "surplus alias");
    }

    function _attemptInvalidCancel(uint256 index) private {
        AuctionModel storage model = auctionModels[index];
        AuctionSnapshot memory beforeSnapshot = _snapshot(model.tokenId);

        vm.prank(model.poster);
        (bool success,) = address(auctions)
            .call(abi.encodeWithSelector(auctions.cancelAuction.selector, model.tokenId));

        success.assertFalse("invalid cancel accepted");
        _assertSnapshotUnchanged(model.tokenId, beforeSnapshot, "invalid cancel");
    }

    function _recordSuccessfulBid(AuctionModel storage model, address bidder, uint256 bid) private {
        uint256 previousBid = model.highestBid;
        address previousBidder = model.highestBidder;
        if (previousBid != 0) {
            expectedBidderCredits[previousBidder] += previousBid;
        }
        model.highestBid = bid;
        model.highestBidder = bidder;
        model.endTime = auctions.retrieveAuctionEndTime(model.tokenId);
    }

    function _recordSuccessfulSettlement(AuctionModel storage model) private {
        uint256 posterCredit = model.highestBid / 2;
        uint256 curatorCredit = model.highestBid / 4;
        uint256 protocolCredit = model.highestBid - posterCredit - curatorCredit;

        expectedPosterCredits[model.poster] += posterCredit;
        expectedProtocolCredits[PAYOUT] += protocolCredit;
        expectedCuratorCredits[CURATORS_POOL] += curatorCredit;
    }

    function _assertAuctionState(AuctionModel storage model) private view {
        uint256 tokenId = model.tokenId;
        uint256 status = uint256(auctions.retrieveAuctionStatus(tokenId));
        auctions.auctionHighestBid(tokenId).assertEq(model.highestBid, "highest bid");
        auctions.auctionHighestBidder(tokenId).assertEq(model.highestBidder, "highest bidder");
        auctions.retrieveAuctionEndTime(tokenId).assertEq(model.endTime, "end time");
        auctions.auctionBidderCredits(FIRST_BIDDER)
            .assertEq(expectedBidderCredits[FIRST_BIDDER], "first bidder credit");
        auctions.auctionBidderCredits(SECOND_BIDDER)
            .assertEq(expectedBidderCredits[SECOND_BIDDER], "second bidder credit");
        auctions.auctionBidderCredits(THIRD_BIDDER)
            .assertEq(expectedBidderCredits[THIRD_BIDDER], "third bidder credit");
        auctions.auctionPosterCredits(POSTER)
            .assertEq(expectedPosterCredits[POSTER], "poster credit");
        auctions.auctionPosterCredits(SECOND_POSTER)
            .assertEq(expectedPosterCredits[SECOND_POSTER], "second poster credit");
        auctions.auctionProtocolCredits(PAYOUT)
            .assertEq(expectedProtocolCredits[PAYOUT], "protocol credit");
        auctions.auctionCuratorCredits(CURATORS_POOL)
            .assertEq(expectedCuratorCredits[CURATORS_POOL], "curator credit");

        if (model.cancelled) {
            status.assertEq(uint256(StreamAuctions.AuctionStatus.Cancelled), "cancelled status");
            deployed.core.ownerOf(tokenId).assertEq(model.poster, "cancelled custody");
            return;
        }
        if (model.settledNoBid) {
            status.assertEq(
                uint256(StreamAuctions.AuctionStatus.SettledNoBid), "settled no-bid status"
            );
            deployed.core.ownerOf(tokenId).assertEq(model.poster, "settled no-bid custody");
            return;
        }
        if (model.settledWithBid) {
            status.assertEq(
                uint256(StreamAuctions.AuctionStatus.SettledWithBid), "settled with-bid status"
            );
            deployed.core.ownerOf(tokenId).assertEq(model.highestBidder, "winner custody");
            return;
        }

        deployed.core.ownerOf(tokenId).assertEq(address(auctions), "escrow custody");
        if (block.timestamp > model.endTime && model.highestBid == 0) {
            status.assertEq(uint256(StreamAuctions.AuctionStatus.EndedNoBid), "ended no-bid");
        } else if (block.timestamp > model.endTime) {
            status.assertEq(uint256(StreamAuctions.AuctionStatus.EndedWithBid), "ended with-bid");
        } else {
            status.assertEq(uint256(StreamAuctions.AuctionStatus.Active), "active status");
            _minimumBid(model);
        }
    }

    function _snapshot(uint256 tokenId) private view returns (AuctionSnapshot memory snapshot) {
        snapshot = AuctionSnapshot({
            status: uint256(auctions.retrieveAuctionStatus(tokenId)),
            owner: deployed.core.ownerOf(tokenId),
            highestBid: auctions.auctionHighestBid(tokenId),
            highestBidder: auctions.auctionHighestBidder(tokenId),
            totalBidderOwed: auctions.totalBidderOwed(),
            totalAuctionBidEscrow: auctions.totalAuctionBidEscrow(),
            totalProceedsOwed: auctions.totalProceedsOwed(),
            totalOwed: auctions.totalOwed(),
            balance: address(auctions).balance
        });
    }

    function _assertSnapshotUnchanged(
        uint256 tokenId,
        AuctionSnapshot memory beforeSnapshot,
        string memory label
    ) private view {
        uint256(auctions.retrieveAuctionStatus(tokenId)).assertEq(beforeSnapshot.status, label);
        deployed.core.ownerOf(tokenId).assertEq(beforeSnapshot.owner, label);
        auctions.auctionHighestBid(tokenId).assertEq(beforeSnapshot.highestBid, label);
        auctions.auctionHighestBidder(tokenId).assertEq(beforeSnapshot.highestBidder, label);
        auctions.totalBidderOwed().assertEq(beforeSnapshot.totalBidderOwed, label);
        auctions.totalAuctionBidEscrow().assertEq(beforeSnapshot.totalAuctionBidEscrow, label);
        auctions.totalProceedsOwed().assertEq(beforeSnapshot.totalProceedsOwed, label);
        auctions.totalOwed().assertEq(beforeSnapshot.totalOwed, label);
        address(auctions).balance.assertEq(beforeSnapshot.balance, label);
    }

    function _selectAuction(uint256 seed) private view returns (bool found, uint256 index) {
        if (auctionCount == 0) {
            return (false, 0);
        }
        return (true, seed % auctionCount);
    }

    function _minimumBid(AuctionModel storage model) private view returns (uint256) {
        uint256 modeledMinimum = _modeledMinimumBid(model);
        if (auctions.retrieveAuctionStatus(model.tokenId) == StreamAuctions.AuctionStatus.Active) {
            auctions.minimumNextBid(model.tokenId).assertEq(modeledMinimum, "minimum next bid");
        }
        return modeledMinimum;
    }

    function _modeledMinimumBid(AuctionModel storage model) private view returns (uint256) {
        if (model.highestBid == 0) {
            return model.reservePrice;
        }
        return model.highestBid + (model.highestBid * auctions.incPercent() / 100);
    }

    function _isTerminal(AuctionModel storage model) private view returns (bool) {
        return model.cancelled || model.settledNoBid || model.settledWithBid;
    }

    function _expectedBidderOwed() private view returns (uint256) {
        return expectedBidderCredits[FIRST_BIDDER] + expectedBidderCredits[SECOND_BIDDER]
            + expectedBidderCredits[THIRD_BIDDER];
    }

    function _expectedPosterOwed() private view returns (uint256) {
        return expectedPosterCredits[POSTER] + expectedPosterCredits[SECOND_POSTER];
    }

    function _poster(uint256 seed) private pure returns (address) {
        return seed % 2 == 0 ? POSTER : SECOND_POSTER;
    }

    function _nextBidder(address currentBidder, uint256 seed) private pure returns (address) {
        address bidder = _bidder(seed);
        if (bidder != currentBidder) {
            return bidder;
        }
        if (bidder == FIRST_BIDDER) {
            return SECOND_BIDDER;
        }
        if (bidder == SECOND_BIDDER) {
            return THIRD_BIDDER;
        }
        return FIRST_BIDDER;
    }

    function _bidder(uint256 seed) private pure returns (address) {
        uint256 account = seed % 3;
        if (account == 0) {
            return FIRST_BIDDER;
        }
        if (account == 1) {
            return SECOND_BIDDER;
        }
        return THIRD_BIDDER;
    }

    function _bidderWithdrawalAccount(uint256 seed) private pure returns (address) {
        return _bidder(seed);
    }

    function _proceedsWithdrawalAccount(uint256 seed) private pure returns (address) {
        uint256 account = seed % 4;
        if (account == 0) {
            return POSTER;
        }
        if (account == 1) {
            return SECOND_POSTER;
        }
        if (account == 2) {
            return PAYOUT;
        }
        return CURATORS_POOL;
    }

    function _surplus(address target, uint256 owed) private view returns (uint256) {
        if (target.balance <= owed) {
            return 0;
        }
        return target.balance - owed;
    }

    function _tokenData(uint256 id) private pure returns (string memory) {
        if (id % 3 == 0) {
            return "auction-alpha";
        }
        if (id % 3 == 1) {
            return "auction-beta";
        }
        return "auction-gamma";
    }
}
