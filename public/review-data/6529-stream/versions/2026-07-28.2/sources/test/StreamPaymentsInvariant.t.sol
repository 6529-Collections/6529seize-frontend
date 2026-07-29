// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/AuctionContract.sol";
import "../smart-contracts/RandomizerRNG.sol";
import "../smart-contracts/StreamCuratorsPool.sol";
import "../smart-contracts/StreamMinter.sol";
import "./helpers/Assertions.sol";
import "./helpers/DropAuthTestHelper.sol";
import "./helpers/StreamFixture.sol";
import "./mocks/MockRandomizerCore.sol";

contract StreamPaymentsInvariantTest is DropAuthTestHelper, StreamFixture {
    uint256 private constant SEQUENCE_LENGTH = 24;

    PaymentsInvariantHandler private handler;

    function setUp() public {
        handler = new PaymentsInvariantHandler(signerAddress());
    }

    function testPaymentInvariantsHoldAcrossBoundedOperationSequences(
        uint256[SEQUENCE_LENGTH] memory actionSeeds,
        uint256[SEQUENCE_LENGTH] memory firstArgs,
        uint256[SEQUENCE_LENGTH] memory secondArgs
    ) public {
        _assertPaymentInvariants();
        for (uint256 i = 0; i < SEQUENCE_LENGTH; i++) {
            _runAction(actionSeeds[i], firstArgs[i], secondArgs[i]);
            _assertPaymentInvariants();
        }
    }

    function _runAction(uint256 actionSeed, uint256 firstArg, uint256 secondArg) private {
        uint256 action = actionSeed % 19;
        if (action == 0) {
            handler.mintFixedPrice(firstArg, secondArg);
        } else if (action == 1) {
            handler.withdrawFixedPriceCredit(firstArg);
        } else if (action == 2) {
            handler.failFixedPriceWithdrawal(firstArg);
        } else if (action == 3) {
            handler.forceDropsSurplus(firstArg);
        } else if (action == 4) {
            handler.mintAuction(firstArg, secondArg);
        } else if (action == 5) {
            uint256 bidSeed = uint256(keccak256(abi.encode(actionSeed, "bid")));
            handler.bidAuction(firstArg, secondArg, bidSeed);
        } else if (action == 6) {
            handler.settleAuction(firstArg);
        } else if (action == 7) {
            handler.withdrawAuctionCredit(firstArg);
        } else if (action == 8) {
            handler.failAuctionCreditWithdrawal(firstArg);
        } else if (action == 9) {
            handler.forceAuctionSurplus(firstArg);
        } else if (action == 10) {
            handler.claimCuratorReward(firstArg, secondArg);
        } else if (action == 11) {
            handler.withdrawCuratorCredit(firstArg);
        } else if (action == 12) {
            handler.failCuratorWithdrawal(firstArg);
        } else if (action == 13) {
            handler.forceCuratorPoolSurplus(firstArg);
        } else if (action == 14) {
            handler.forceMinterSurplus(firstArg);
        } else if (action == 15) {
            handler.fundRandomizerReserve(firstArg);
        } else if (action == 16) {
            handler.forceRandomizerReserve(firstArg);
        } else if (action == 17) {
            handler.requestRandomizerWords(firstArg, secondArg);
        } else if (action == 18) {
            handler.emergencyWithdrawSurplus(firstArg);
        }
    }

    function _assertPaymentInvariants() private view {
        handler.assertPaymentCategoryTotalsMatchAccountCredits();
        handler.assertContractBalancesCoverOwedAndReservedFunds();
        handler.assertEmergencyWithdrawableIsOnlySurplus();
    }
}

contract PaymentsInvariantHandler is DropAuthTestHelper, StreamFixture {
    using Assertions for uint256;

    address private constant POSTER = address(0x1001);
    address private constant SECOND_POSTER = address(0x1002);
    address private constant RECIPIENT = address(0x2001);
    address private constant PAYOUT = address(0x3001);
    address private constant CURATORS_POOL = address(0x4001);
    address private constant FIRST_BIDDER = address(0x5001);
    address private constant SECOND_BIDDER = address(0x5002);
    address private constant CURATOR = address(0x6001);
    address private constant SECOND_CURATOR = address(0x6002);
    address private constant WITHDRAW_RECIPIENT = address(0x7001);
    uint256 private constant MAX_PROTOCOL_MINTS = 8;
    uint256 private constant MAX_AUCTIONS = 3;
    uint256 private constant MAX_CURATOR_CLAIMS = 8;
    uint256 private constant MAX_PAYMENT = 8 ether;

    struct AuctionProceedsFailureSnapshot {
        uint256 posterCredit;
        uint256 protocolCredit;
        uint256 curatorCredit;
        uint256 posterTotal;
        uint256 protocolTotal;
        uint256 curatorTotal;
        uint256 proceedsTotal;
        uint256 totalOwed;
        uint256 balance;
    }

    DeployedStream private deployed;
    StreamAuctions private auctions;
    StreamCuratorsPool private curatorsPool;
    StreamMinter private surplusMinter;
    NextGenRandomizerRNG private randomizer;
    RejectingInvariantRecipient private rejectingRecipient;

    uint256 private nonce = 1;
    uint256 private mintedDrops;
    uint256 private mintedAuctions;
    uint256 private curatorClaims;
    uint256 private randomizerRequests;
    uint256[MAX_AUCTIONS] private auctionTokenIds;
    mapping(uint256 => uint256) private auctionReserveByTokenId;
    mapping(uint256 => bool) private randomizerTokenRequested;

    constructor(address signer) {
        deployed = deployStreamWithSigner(PAYOUT, CURATORS_POOL, signer);
        deployed.admins.updateEmergencyRecipient(WITHDRAW_RECIPIENT);
        rejectingRecipient = new RejectingInvariantRecipient();
        auctions = new StreamAuctions(
            address(deployed.minter),
            address(deployed.core),
            address(deployed.admins),
            address(deployed.drops),
            PAYOUT,
            CURATORS_POOL
        );
        deployed.drops.updateAuctionContract(address(auctions));

        InvariantDelegation delegation = new InvariantDelegation();
        curatorsPool = new StreamCuratorsPool(address(deployed.admins), address(delegation));
        surplusMinter =
            new StreamMinter(address(deployed.core), address(deployed.admins), address(this));

        MockRandomizerCore randomizerCore = new MockRandomizerCore();
        InvariantArrngController controller = new InvariantArrngController();
        randomizer = new NextGenRandomizerRNG(
            address(randomizerCore), address(deployed.admins), address(controller)
        );
        randomizerCore.setRandomizer(1, address(randomizer), 1);
    }

    function mintFixedPrice(uint256 rawPrice, uint256 posterSeed) external {
        if (mintedDrops >= MAX_PROTOCOL_MINTS) {
            return;
        }
        uint256 currentNonce = nonce;
        nonce++;
        mintedDrops++;

        uint256 price = _boundedAmount(rawPrice);
        address poster = _poster(posterSeed);
        string memory tokenData = _tokenData(currentNonce);

        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            deployed.drops,
            poster,
            RECIPIENT,
            price == 0 ? address(0) : address(this),
            tokenData,
            1,
            price,
            currentNonce,
            currentNonce,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(deployed.drops, authorization);

        vm.deal(address(this), address(this).balance + price);
        // The handler intentionally pays the contract under test; payment safety
        // is asserted after each generated action, not in the harness transfer.
        // slither-disable-next-line arbitrary-send-eth
        deployed.drops.mintDrop{ value: price }(authorization, tokenData, signature);
    }

    function withdrawFixedPriceCredit(uint256 accountSeed) external {
        address account = _fixedPriceWithdrawAccount(accountSeed);
        if (
            deployed.drops.fixedPricePosterCredits(account)
                    + deployed.drops.fixedPriceProtocolCredits(account) == 0
        ) {
            return;
        }
        vm.prank(account);
        deployed.drops.withdrawFixedPriceCreditTo(payable(WITHDRAW_RECIPIENT));
    }

    function failFixedPriceWithdrawal(uint256 accountSeed) external {
        address account = _fixedPriceWithdrawAccount(accountSeed);
        uint256 posterCreditBefore = deployed.drops.fixedPricePosterCredits(account);
        uint256 protocolCreditBefore = deployed.drops.fixedPriceProtocolCredits(account);
        if (posterCreditBefore + protocolCreditBefore == 0) {
            return;
        }

        uint256 posterTotalBefore = deployed.drops.totalFixedPricePosterOwed();
        uint256 protocolTotalBefore = deployed.drops.totalFixedPriceProtocolOwed();
        uint256 totalBefore = deployed.drops.totalOwed();
        uint256 balanceBefore = address(deployed.drops).balance;

        vm.prank(account);
        (bool success, bytes memory revertData) = address(deployed.drops)
            .call(
                abi.encodeWithSelector(
                    deployed.drops.withdrawFixedPriceCreditTo.selector,
                    payable(address(rejectingRecipient))
                )
            );

        _assertEthFailed(success, revertData, "fixed failed withdrawal");
        deployed.drops.fixedPricePosterCredits(account)
            .assertEq(posterCreditBefore, "fixed poster rollback");
        deployed.drops.fixedPriceProtocolCredits(account)
            .assertEq(protocolCreditBefore, "fixed protocol rollback");
        deployed.drops.totalFixedPricePosterOwed()
            .assertEq(posterTotalBefore, "fixed poster total rollback");
        deployed.drops.totalFixedPriceProtocolOwed()
            .assertEq(protocolTotalBefore, "fixed protocol total rollback");
        deployed.drops.totalOwed().assertEq(totalBefore, "fixed total rollback");
        address(deployed.drops).balance.assertEq(balanceBefore, "fixed balance rollback");
    }

    function forceDropsSurplus(uint256 rawAmount) external {
        _forceBalance(address(deployed.drops), rawAmount);
    }

    function mintAuction(uint256 rawReserve, uint256 posterSeed) external {
        if (mintedDrops >= MAX_PROTOCOL_MINTS || mintedAuctions >= MAX_AUCTIONS) {
            return;
        }
        uint256 currentNonce = nonce;
        nonce++;
        mintedDrops++;
        uint256 auctionIndex = mintedAuctions;
        mintedAuctions++;

        uint256 reserve = _boundedAmount(rawReserve);
        if (reserve == 0) {
            reserve = 1 wei;
        }
        address poster = _poster(posterSeed);
        string memory tokenData = _tokenData(currentNonce);

        StreamDrops.DropAuthorization memory authorization = buildAuctionAuthorization(
            deployed.drops,
            poster,
            address(0),
            tokenData,
            1,
            reserve,
            block.timestamp + 1 days,
            currentNonce,
            currentNonce,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(deployed.drops, authorization);

        // The handler records generated-sequence state around calls into
        // contracts under test; any revert rolls all harness bookkeeping back.
        // slither-disable-start reentrancy-no-eth
        deployed.drops.mintDrop(authorization, tokenData, signature);
        uint256 tokenId = deployed.drops.retrieveTokenID(authorization.dropId);
        auctionTokenIds[auctionIndex] = tokenId;
        auctionReserveByTokenId[tokenId] = reserve;
        // slither-disable-end reentrancy-no-eth
    }

    function bidAuction(uint256 auctionSeed, uint256 bidderSeed, uint256 rawBid) external {
        if (mintedAuctions == 0) {
            return;
        }
        uint256 tokenId = auctionTokenIds[auctionSeed % mintedAuctions];
        if (auctions.retrieveAuctionStatus(tokenId) != StreamAuctions.AuctionStatus.Active) {
            return;
        }

        uint256 minimumBid = _minimumBid(tokenId);
        uint256 bid = _boundedAmount(rawBid);
        if (bid < minimumBid) {
            bid = minimumBid;
        }
        if (bid > MAX_PAYMENT) {
            return;
        }

        address bidder = _bidder(bidderSeed);
        vm.deal(bidder, bid);
        vm.prank(bidder);
        // The handler intentionally pays the contract under test; payment safety
        // is asserted after each generated action, not in the harness transfer.
        // slither-disable-next-line arbitrary-send-eth
        auctions.participateToAuction{ value: bid }(tokenId);
    }

    function settleAuction(uint256 auctionSeed) external {
        if (mintedAuctions == 0) {
            return;
        }
        uint256 tokenId = auctionTokenIds[auctionSeed % mintedAuctions];
        uint256 endTime = auctions.retrieveAuctionEndTime(tokenId);
        if (block.timestamp <= endTime) {
            vm.warp(endTime + 1);
        }

        try auctions.claimAuction(tokenId) { } catch { }
    }

    function withdrawAuctionCredit(uint256 accountSeed) external {
        address account = _auctionWithdrawAccount(accountSeed);
        uint256 bidderCredit = auctions.auctionBidderCredits(account);
        uint256 proceedsCredit = auctions.auctionPosterCredits(account)
            + auctions.auctionProtocolCredits(account) + auctions.auctionCuratorCredits(account);

        if (bidderCredit != 0) {
            vm.prank(account);
            auctions.withdrawBidderCreditTo(payable(WITHDRAW_RECIPIENT));
        }
        if (proceedsCredit != 0) {
            vm.prank(account);
            auctions.withdrawAuctionProceedsCreditTo(payable(WITHDRAW_RECIPIENT));
        }
    }

    function failAuctionCreditWithdrawal(uint256 accountSeed) external {
        address account = _auctionWithdrawAccount(accountSeed);
        uint256 bidderCredit = auctions.auctionBidderCredits(account);
        uint256 proceedsCredit = auctions.auctionPosterCredits(account)
            + auctions.auctionProtocolCredits(account) + auctions.auctionCuratorCredits(account);

        if (bidderCredit != 0) {
            _failAuctionBidderWithdrawal(account, bidderCredit);
        }

        if (proceedsCredit != 0) {
            _failAuctionProceedsWithdrawal(account);
        }
    }

    function _failAuctionBidderWithdrawal(address account, uint256 bidderCredit) private {
        uint256 bidderTotalBefore = auctions.totalBidderOwed();
        uint256 totalBefore = auctions.totalOwed();
        uint256 balanceBefore = address(auctions).balance;

        vm.prank(account);
        (bool success, bytes memory revertData) = address(auctions)
            .call(
                abi.encodeWithSelector(
                    auctions.withdrawBidderCreditTo.selector, payable(address(rejectingRecipient))
                )
            );

        _assertEthFailed(success, revertData, "auction bidder failed withdrawal");
        auctions.auctionBidderCredits(account).assertEq(bidderCredit, "auction bidder rollback");
        auctions.totalBidderOwed().assertEq(bidderTotalBefore, "auction bidder total");
        auctions.totalOwed().assertEq(totalBefore, "auction total after bidder failure");
        address(auctions).balance.assertEq(balanceBefore, "auction bidder balance rollback");
    }

    function _failAuctionProceedsWithdrawal(address account) private {
        AuctionProceedsFailureSnapshot memory beforeFailure = AuctionProceedsFailureSnapshot({
            posterCredit: auctions.auctionPosterCredits(account),
            protocolCredit: auctions.auctionProtocolCredits(account),
            curatorCredit: auctions.auctionCuratorCredits(account),
            posterTotal: auctions.totalPosterOwed(),
            protocolTotal: auctions.totalProtocolOwed(),
            curatorTotal: auctions.totalCuratorOwed(),
            proceedsTotal: auctions.totalProceedsOwed(),
            totalOwed: auctions.totalOwed(),
            balance: address(auctions).balance
        });

        vm.prank(account);
        (bool success, bytes memory revertData) = address(auctions)
            .call(
                abi.encodeWithSelector(
                    auctions.withdrawAuctionProceedsCreditTo.selector,
                    payable(address(rejectingRecipient))
                )
            );

        _assertEthFailed(success, revertData, "auction proceeds failed withdrawal");
        auctions.auctionPosterCredits(account)
            .assertEq(beforeFailure.posterCredit, "auction poster rollback");
        auctions.auctionProtocolCredits(account)
            .assertEq(beforeFailure.protocolCredit, "auction protocol rollback");
        auctions.auctionCuratorCredits(account)
            .assertEq(beforeFailure.curatorCredit, "auction curator rollback");
        auctions.totalPosterOwed().assertEq(beforeFailure.posterTotal, "auction poster total");
        auctions.totalProtocolOwed().assertEq(beforeFailure.protocolTotal, "auction protocol total");
        auctions.totalCuratorOwed().assertEq(beforeFailure.curatorTotal, "auction curator total");
        auctions.totalProceedsOwed().assertEq(beforeFailure.proceedsTotal, "auction proceeds total");
        auctions.totalOwed()
            .assertEq(beforeFailure.totalOwed, "auction total after proceeds failure");
        address(auctions).balance
            .assertEq(beforeFailure.balance, "auction proceeds balance rollback");
    }

    function forceAuctionSurplus(uint256 rawAmount) external {
        _forceBalance(address(auctions), rawAmount);
    }

    function claimCuratorReward(uint256 rawAmount, uint256 curatorSeed) external {
        if (curatorClaims >= MAX_CURATOR_CLAIMS) {
            return;
        }
        uint256 collectionId = 1_000 + curatorClaims;
        curatorClaims++;

        uint256 amount = _boundedAmount(rawAmount);
        if (amount == 0) {
            amount = 1 wei;
        }
        address curator = _curator(curatorSeed);
        uint256 rootEpoch = curatorsPool.collectionMerkleRootEpoch(collectionId) + 1;
        bytes32 leaf = curatorsPool.hashRewardLeaf(curator, collectionId, amount, rootEpoch);
        bytes32[] memory proof = new bytes32[](0);

        curatorsPool.setMerkleRoot(collectionId, leaf);
        vm.deal(address(curatorsPool), address(curatorsPool).balance + amount);
        vm.prank(curator);
        curatorsPool.claimRewards(collectionId, amount, proof, address(0));
    }

    function withdrawCuratorCredit(uint256 curatorSeed) external {
        address curator = _curator(curatorSeed);
        if (curatorsPool.curatorCredits(curator) == 0) {
            return;
        }
        vm.prank(curator);
        curatorsPool.withdrawCuratorCreditTo(payable(WITHDRAW_RECIPIENT));
    }

    function failCuratorWithdrawal(uint256 curatorSeed) external {
        address curator = _curator(curatorSeed);
        uint256 creditBefore = curatorsPool.curatorCredits(curator);
        if (creditBefore == 0) {
            return;
        }

        uint256 totalBefore = curatorsPool.totalOwed();
        uint256 balanceBefore = address(curatorsPool).balance;

        vm.prank(curator);
        (bool success, bytes memory revertData) = address(curatorsPool)
            .call(
                abi.encodeWithSelector(
                    curatorsPool.withdrawCuratorCreditTo.selector,
                    payable(address(rejectingRecipient))
                )
            );

        _assertEthFailed(success, revertData, "curator failed withdrawal");
        curatorsPool.curatorCredits(curator).assertEq(creditBefore, "curator credit rollback");
        curatorsPool.totalOwed().assertEq(totalBefore, "curator owed rollback");
        address(curatorsPool).balance.assertEq(balanceBefore, "curator balance rollback");
    }

    function forceCuratorPoolSurplus(uint256 rawAmount) external {
        _forceBalance(address(curatorsPool), rawAmount);
    }

    function forceMinterSurplus(uint256 rawAmount) external {
        _forceBalance(address(surplusMinter), rawAmount);
    }

    function fundRandomizerReserve(uint256 rawAmount) external {
        uint256 amount = _boundedAmount(rawAmount);
        if (amount == 0) {
            amount = 1 wei;
        }
        vm.deal(address(this), address(this).balance + amount);
        // The handler intentionally funds the adapter under test; reserve safety
        // is asserted after each generated action, not in the harness transfer.
        // slither-disable-next-line arbitrary-send-eth
        (bool success,) = address(randomizer).call{ value: amount }("");
        require(success, "randomizer funding failed");
    }

    function forceRandomizerReserve(uint256 rawAmount) external {
        _forceBalance(address(randomizer), rawAmount);
    }

    function requestRandomizerWords(uint256 rawCost, uint256 tokenSeed) external {
        if (randomizerRequests >= MAX_PROTOCOL_MINTS) {
            return;
        }
        uint256 cost = _boundedAmount(rawCost);
        if (cost == 0 || randomizer.totalRandomnessReserved() < cost) {
            return;
        }
        uint256 tokenId = 900_000 + (tokenSeed % 10_000);
        if (randomizerTokenRequested[tokenId]) {
            return;
        }
        randomizerRequests++;
        randomizerTokenRequested[tokenId] = true;
        randomizer.updateRNGCost(cost);
        vm.prank(address(randomizer.gencoreContract()));
        randomizer.calculateTokenHash(1, tokenId, 0);
    }

    function emergencyWithdrawSurplus(uint256 targetSeed) external {
        uint256 target = targetSeed % 4;
        if (target == 0) {
            auctions.emergencyWithdraw();
        } else if (target == 1) {
            curatorsPool.emergencyWithdraw();
        } else if (target == 2) {
            surplusMinter.emergencyWithdraw();
        } else {
            randomizer.emergencyWithdraw();
        }
    }

    function assertPaymentCategoryTotalsMatchAccountCredits() external view {
        _assertDropsTotals();
        _assertAuctionTotals();
        _assertCuratorTotals();
        surplusMinter.totalOwed().assertEq(0, "minter owed");
        surplusMinter.totalReserved().assertEq(0, "minter reserved");
        // Current RNG adapter policy treats the full adapter balance as reserved provider funds.
        address(randomizer).balance
            .assertEq(randomizer.totalRandomnessReserved(), "randomizer balance reserved");
        randomizer.totalOwed().assertEq(randomizer.totalRandomnessReserved(), "randomizer owed");
        randomizer.totalReserved()
            .assertEq(randomizer.totalRandomnessReserved(), "randomizer reserved");
    }

    function assertContractBalancesCoverOwedAndReservedFunds() external view {
        _assertBalanceCoversOwed(address(deployed.drops), deployed.drops.totalOwed(), "drops");
        _assertBalanceCoversOwed(address(auctions), auctions.totalOwed(), "auction");
        _assertBalanceCoversOwed(address(curatorsPool), curatorsPool.totalOwed(), "curator");
        _assertBalanceCoversOwed(address(surplusMinter), surplusMinter.totalOwed(), "minter");
        _assertBalanceCoversOwed(address(randomizer), randomizer.totalOwed(), "randomizer");
    }

    function assertEmergencyWithdrawableIsOnlySurplus() external view {
        deployed.drops.emergencyWithdrawable()
            .assertEq(
                _surplus(address(deployed.drops), deployed.drops.totalOwed()), "drops surplus"
            );
        deployed.drops.surplus().assertEq(deployed.drops.emergencyWithdrawable(), "drops alias");
        auctions.emergencyWithdrawable()
            .assertEq(_surplus(address(auctions), auctions.totalOwed()), "auction surplus");
        auctions.surplus().assertEq(auctions.emergencyWithdrawable(), "auction alias");
        curatorsPool.emergencyWithdrawable()
            .assertEq(_surplus(address(curatorsPool), curatorsPool.totalOwed()), "curator surplus");
        curatorsPool.surplus().assertEq(curatorsPool.emergencyWithdrawable(), "curator alias");
        surplusMinter.emergencyWithdrawable()
            .assertEq(_surplus(address(surplusMinter), surplusMinter.totalOwed()), "minter surplus");
        surplusMinter.surplus().assertEq(surplusMinter.emergencyWithdrawable(), "minter alias");
        randomizer.emergencyWithdrawable().assertEq(0, "randomizer surplus");
        randomizer.surplus().assertEq(randomizer.emergencyWithdrawable(), "randomizer alias");
    }

    function _assertDropsTotals() private view {
        uint256 posterCredits = deployed.drops.fixedPricePosterCredits(POSTER)
            + deployed.drops.fixedPricePosterCredits(SECOND_POSTER);
        uint256 protocolCredits = deployed.drops.fixedPriceProtocolCredits(PAYOUT);
        uint256 curatorReserveCredits =
            deployed.drops.fixedPriceCuratorReserveCredits(CURATORS_POOL);

        posterCredits.assertEq(deployed.drops.totalFixedPricePosterOwed(), "fixed poster total");
        posterCredits.assertEq(deployed.drops.totalPosterOwed(), "drops poster alias");
        protocolCredits.assertEq(
            deployed.drops.totalFixedPriceProtocolOwed(), "fixed protocol total"
        );
        protocolCredits.assertEq(deployed.drops.totalProtocolOwed(), "drops protocol alias");
        curatorReserveCredits.assertEq(
            deployed.drops.totalFixedPriceCuratorReserveOwed(), "fixed curator reserve total"
        );
        curatorReserveCredits.assertEq(
            deployed.drops.totalCuratorReserved(), "drops curator reserve alias"
        );
        curatorReserveCredits.assertEq(deployed.drops.totalReserved(), "drops reserved");
        (posterCredits + protocolCredits + curatorReserveCredits)
        .assertEq(deployed.drops.totalFixedPriceOwed(), "fixed price total");
        deployed.drops.totalFixedPriceOwed().assertEq(deployed.drops.totalOwed(), "drops total");
    }

    function _assertAuctionTotals() private view {
        uint256 bidderCredits = auctions.auctionBidderCredits(FIRST_BIDDER)
            + auctions.auctionBidderCredits(SECOND_BIDDER);
        uint256 posterCredits =
            auctions.auctionPosterCredits(POSTER) + auctions.auctionPosterCredits(SECOND_POSTER);
        uint256 protocolCredits = auctions.auctionProtocolCredits(PAYOUT);
        uint256 curatorCredits = auctions.auctionCuratorCredits(CURATORS_POOL);

        bidderCredits.assertEq(auctions.totalBidderOwed(), "auction bidder total");
        posterCredits.assertEq(auctions.totalPosterOwed(), "auction poster total");
        protocolCredits.assertEq(auctions.totalProtocolOwed(), "auction protocol total");
        curatorCredits.assertEq(auctions.totalCuratorOwed(), "auction curator total");
        (posterCredits + protocolCredits + curatorCredits)
        .assertEq(auctions.totalProceedsOwed(), "auction proceeds total");
        auctions.totalAuctionBidEscrow().assertEq(auctions.totalReserved(), "auction reserved");
        auctions.totalCuratorReserved().assertEq(0, "auction curator reserve");
        auctions.totalRandomnessReserved().assertEq(0, "auction randomness reserve");
        (bidderCredits + auctions.totalAuctionBidEscrow() + auctions.totalProceedsOwed())
        .assertEq(auctions.totalOwed(), "auction total");
    }

    function _assertCuratorTotals() private view {
        uint256 curatorCredits =
            curatorsPool.curatorCredits(CURATOR) + curatorsPool.curatorCredits(SECOND_CURATOR);
        curatorCredits.assertEq(curatorsPool.totalCuratorOwed(), "curator total");
        curatorsPool.totalReserved().assertEq(0, "curator reserved");
        curatorsPool.totalCuratorOwed().assertEq(curatorsPool.totalOwed(), "pool total");
    }

    function _assertBalanceCoversOwed(address target, uint256 owed, string memory message)
        private
        view
    {
        require(target.balance >= owed, message);
    }

    function _surplus(address target, uint256 owed) private view returns (uint256) {
        if (target.balance <= owed) {
            return 0;
        }
        return target.balance - owed;
    }

    function _boundedAmount(uint256 rawAmount) private pure returns (uint256) {
        return rawAmount % (MAX_PAYMENT + 1);
    }

    function _minimumBid(uint256 tokenId) private view returns (uint256) {
        uint256 modeledMinimum = _modeledMinimumBid(tokenId);
        auctions.minimumNextBid(tokenId).assertEq(modeledMinimum, "auction min bid");
        return modeledMinimum;
    }

    function _modeledMinimumBid(uint256 tokenId) private view returns (uint256) {
        uint256 previousBid = auctions.auctionHighestBid(tokenId);
        if (previousBid > 0) {
            return previousBid + (previousBid * auctions.incPercent() / 100);
        }
        return auctionReserveByTokenId[tokenId];
    }

    function _poster(uint256 seed) private pure returns (address) {
        return seed % 2 == 0 ? POSTER : SECOND_POSTER;
    }

    function _bidder(uint256 seed) private pure returns (address) {
        return seed % 2 == 0 ? FIRST_BIDDER : SECOND_BIDDER;
    }

    function _curator(uint256 seed) private pure returns (address) {
        return seed % 2 == 0 ? CURATOR : SECOND_CURATOR;
    }

    function _fixedPriceWithdrawAccount(uint256 seed) private pure returns (address) {
        uint256 account = seed % 3;
        if (account == 0) {
            return POSTER;
        }
        if (account == 1) {
            return SECOND_POSTER;
        }
        return PAYOUT;
    }

    function _auctionWithdrawAccount(uint256 seed) private pure returns (address) {
        uint256 account = seed % 6;
        if (account == 0) {
            return FIRST_BIDDER;
        }
        if (account == 1) {
            return SECOND_BIDDER;
        }
        if (account == 2) {
            return POSTER;
        }
        if (account == 3) {
            return SECOND_POSTER;
        }
        if (account == 4) {
            return PAYOUT;
        }
        return CURATORS_POOL;
    }

    function _forceBalance(address target, uint256 rawAmount) private {
        uint256 amount = _boundedAmount(rawAmount);
        if (amount == 0) {
            return;
        }
        // Scenario tests cover selfdestructed ETH; the sequence handler uses
        // vm.deal to deterministically model the same surplus accounting state.
        vm.deal(target, target.balance + amount);
    }

    function _assertEthFailed(bool success, bytes memory revertData, string memory message)
        private
        pure
    {
        require(!success, message);
        // Keep failed-withdrawal handlers pinned to the current withdrawal error surface.
        require(
            keccak256(revertData)
                == keccak256(abi.encodeWithSignature("Error(string)", "ETH failed")),
            message
        );
    }

    function _tokenData(uint256 id) private pure returns (string memory) {
        if (id % 3 == 0) {
            return "alpha";
        }
        if (id % 3 == 1) {
            return "beta";
        }
        return "gamma";
    }
}

contract RejectingInvariantRecipient {
    receive() external payable {
        revert("reject invariant withdrawal");
    }
}

contract InvariantDelegation {
    function retrieveGlobalStatusOfDelegation(address, address, address, uint256)
        external
        pure
        returns (bool)
    {
        return false;
    }
}

// The invariant controller is a test-only payable provider mock. Retained ETH is
// part of the reserve simulation; production reserve withdrawal is asserted on
// the randomizer adapter under test.
// slither-disable-start locked-ether
contract InvariantArrngController {
    uint256 public nextRequestId = 1;

    function requestRandomWords(uint256, address) external payable returns (uint256 requestId) {
        requestId = nextRequestId;
        nextRequestId++;
    }
}
// slither-disable-end locked-ether
