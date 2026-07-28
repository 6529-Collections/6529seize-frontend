// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/AuctionContract.sol";
import "../smart-contracts/StreamDrops.sol";
import "../smart-contracts/StreamPauseDomains.sol";
import "./helpers/Assertions.sol";
import "./helpers/ProtocolStateMachine.sol";

contract StreamProtocolStateMachineTest is ProtocolStateMachine {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    function setUp() public {
        _deployProtocolStateMachine();
    }

    function testProtocolStateMachineExecutesDeterministicSmokeSequence() public {
        FixedPriceMintResult memory fixedMint =
            _mintProtocolFixedPriceDrop(4 ether, "fixed-price-state-machine");
        _assertProtocolFixedPriceCredits(fixedMint.price);

        AuctionMintResult memory auctionMint =
            _mintProtocolAuctionDrop(5 ether, "auction-state-machine");
        _bidProtocolAuction(auctionMint.tokenId, PROTOCOL_FIRST_BIDDER, 5 ether);
        _bidProtocolAuction(auctionMint.tokenId, PROTOCOL_SECOND_BIDDER, 6 ether);
        protocolAuctions.auctionBidderCredits(PROTOCOL_FIRST_BIDDER)
            .assertEq(5 ether, "outbid credit");

        _settleProtocolAuctionWithBid(auctionMint.tokenId, PROTOCOL_SECOND_BIDDER);
        _assertProtocolAuctionCredits(6 ether);

        _finalizeProtocolTokenMetadata(fixedMint.tokenId, 101);
        _finalizeProtocolTokenMetadata(auctionMint.tokenId, 202);
        _assertProtocolMetadataPauseBlocksMutation(fixedMint.tokenId);
        _mutateProtocolTokenMetadata(fixedMint.tokenId, "fixed-price-state-machine-updated");

        bytes32 cancelledDropId = _exerciseProtocolPauseSignerAndCancellation();
        protocolDeployed.drops.isDropCancelled(cancelledDropId).assertTrue("cancelled drop");
        protocolModel.signerRotated.assertTrue("signer not rotated");

        _withdrawProtocolFixedPriceCredit(PROTOCOL_POSTER);
        _withdrawProtocolFixedPriceCredit(PROTOCOL_PAYOUT);
        _withdrawProtocolBidderCredit(PROTOCOL_FIRST_BIDDER);
        _withdrawProtocolAuctionProceedsCredit(PROTOCOL_POSTER);
        _withdrawProtocolAuctionProceedsCredit(PROTOCOL_PAYOUT);
        _withdrawProtocolAuctionProceedsCredit(PROTOCOL_CURATORS_POOL);
        _assertProtocolAccountingCoversOwed();

        bytes32 freezeManifest = _freezeProtocolCollection();
        (freezeManifest == bytes32(0)).assertFalse("empty freeze manifest");
        protocolModel.collectionFrozen.assertTrue("collection not frozen");
        protocolModel.finalizedTokens.assertEq(2, "finalized token count");
        protocolDeployed.core.totalSupply().assertEq(2, "live supply");
    }

    function testAdversarialDropAuthorizationOrderingDoesNotMutateInvalidDrops() public {
        uint256 startingSupply = protocolDeployed.core.totalSupply();

        StreamDrops.DropAuthorization memory cancelled = _buildProtocolFreeFixedPriceAuthorization(
            "cancelled-before-execution", block.timestamp + 2 days
        );
        bytes memory cancelledSignature = signAuthorization(protocolDeployed.drops, cancelled);
        protocolDeployed.drops.cancelDrop(cancelled.dropId);
        _assertDropMintFailsWithoutConsumption(
            cancelled, "cancelled-before-execution", cancelledSignature, "Drop cancelled"
        );
        protocolDeployed.drops.isDropCancelled(cancelled.dropId).assertTrue("drop not cancelled");

        StreamDrops.DropAuthorization memory expired =
            _buildProtocolFreeFixedPriceAuthorization("expired-before-execution", block.timestamp);
        bytes memory expiredSignature = signAuthorization(protocolDeployed.drops, expired);
        vm.warp(block.timestamp + 1);
        _assertDropMintFailsWithoutConsumption(
            expired, "expired-before-execution", expiredSignature, "Expired"
        );

        StreamDrops.DropAuthorization memory stale = _buildProtocolFreeFixedPriceAuthorization(
            "stale-after-signer-rotation", block.timestamp + 2 days
        );
        bytes memory staleSignature = signAuthorization(protocolDeployed.drops, stale);
        protocolDeployed.drops.updateTDHsigner(otherSignerAddress());
        protocolModel.signerRotated = true;
        _assertDropMintFailsWithoutConsumption(
            stale, "stale-after-signer-rotation", staleSignature, "Wrong signer"
        );

        StreamDrops.DropAuthorization memory replayed = _buildProtocolFreeFixedPriceAuthorization(
            "replayed-current-signer", block.timestamp + 2 days
        );
        bytes memory replayedSignature =
            signAuthorizationWithKey(protocolDeployed.drops, replayed, OTHER_SIGNER_KEY);
        protocolDeployed.drops.mintDrop(replayed, "replayed-current-signer", replayedSignature);
        protocolDeployed.drops.isDropConsumed(replayed.dropId).assertTrue("drop not consumed");
        protocolDeployed.core.totalSupply().assertEq(startingSupply + 1, "first mint supply");

        (bool replaySuccess, bytes memory replayReturnData) =
            _callMintDrop(replayed, "replayed-current-signer", replayedSignature);
        _assertRevertedWithMessage(replaySuccess, replayReturnData, "Drop Executed");
        protocolDeployed.core.totalSupply().assertEq(startingSupply + 1, "replay mutated supply");
        uint256 mintedTokenId = protocolDeployed.drops.retrieveTokenID(replayed.dropId);
        protocolDeployed.core.ownerOf(mintedTokenId).assertEq(PROTOCOL_RECIPIENT, "replayed owner");
    }

    function testAdversarialFixedPriceWithdrawalFailurePreservesCredits() public {
        FixedPriceMintResult memory fixedMint =
            _mintProtocolFixedPriceDrop(4 ether, "fixed-price-withdrawal-adversarial");
        _assertProtocolFixedPriceCredits(fixedMint.price);
        RejectEthReceiver reject = new RejectEthReceiver();

        uint256 posterCredit = protocolDeployed.drops.fixedPricePosterCredits(PROTOCOL_POSTER);
        uint256 totalOwed = protocolDeployed.drops.totalOwed();
        vm.prank(PROTOCOL_POSTER);
        (bool posterWithdrawal, bytes memory posterReturnData) = _callDrops(
            abi.encodeWithSelector(
                protocolDeployed.drops.withdrawFixedPriceCreditTo.selector, payable(address(reject))
            )
        );
        _assertRevertedWithMessage(posterWithdrawal, posterReturnData, "ETH failed");
        protocolDeployed.drops.fixedPricePosterCredits(PROTOCOL_POSTER)
            .assertEq(posterCredit, "poster credit erased");
        protocolDeployed.drops.totalOwed().assertEq(totalOwed, "poster owed changed");

        uint256 protocolCredit = protocolDeployed.drops.fixedPriceProtocolCredits(PROTOCOL_PAYOUT);
        vm.prank(PROTOCOL_PAYOUT);
        (bool protocolWithdrawal, bytes memory protocolReturnData) = _callDrops(
            abi.encodeWithSelector(
                protocolDeployed.drops.withdrawFixedPriceCreditTo.selector, payable(address(reject))
            )
        );
        _assertRevertedWithMessage(protocolWithdrawal, protocolReturnData, "ETH failed");
        protocolDeployed.drops.fixedPriceProtocolCredits(PROTOCOL_PAYOUT)
            .assertEq(protocolCredit, "protocol credit erased");
        protocolDeployed.drops.totalOwed().assertEq(totalOwed, "protocol owed changed");
        _assertProtocolAccountingCoversOwed();
    }

    function testAdversarialAuctionPreSettlementOrderingPreservesCustodyAndAccounting() public {
        AuctionMintResult memory auctionMint =
            _mintProtocolAuctionDrop(5 ether, "auction-pre-settlement-adversarial");
        _assertAuctionActive(auctionMint.tokenId, 0, address(0));

        (bool earlySettlement, bytes memory earlySettlementReturnData) = _callAuction(
            abi.encodeWithSelector(protocolAuctions.claimAuction.selector, auctionMint.tokenId)
        );
        _assertRevertedWithMessage(earlySettlement, earlySettlementReturnData, "Not ended");
        _assertAuctionActive(auctionMint.tokenId, 0, address(0));

        _bidProtocolAuction(auctionMint.tokenId, PROTOCOL_FIRST_BIDDER, 5 ether);
        uint256 owedAfterFirstBid = protocolAuctions.totalOwed();

        _setProtocolPaused(StreamPauseDomains.AUCTION_BID, true);
        (bool pausedBid, bytes memory pausedBidReturnData) =
            _callBid(auctionMint.tokenId, PROTOCOL_SECOND_BIDDER, 6 ether);
        _assertRevertedWithMessage(pausedBid, pausedBidReturnData, "Bid paused");
        _setProtocolPaused(StreamPauseDomains.AUCTION_BID, false);
        _assertAuctionActive(auctionMint.tokenId, 5 ether, PROTOCOL_FIRST_BIDDER);
        protocolAuctions.totalOwed().assertEq(owedAfterFirstBid, "paused bid owed");

        (bool underbid, bytes memory underbidReturnData) =
            _callBid(auctionMint.tokenId, PROTOCOL_SECOND_BIDDER, 5 ether);
        _assertRevertedWithMessage(underbid, underbidReturnData, "% more than highest bid");
        _assertAuctionActive(auctionMint.tokenId, 5 ether, PROTOCOL_FIRST_BIDDER);
        protocolAuctions.totalOwed().assertEq(owedAfterFirstBid, "underbid owed");
        protocolAuctions.auctionBidderCredits(PROTOCOL_FIRST_BIDDER).assertEq(0, "early credit");

        _bidProtocolAuction(auctionMint.tokenId, PROTOCOL_SECOND_BIDDER, 6 ether);
        protocolAuctions.auctionBidderCredits(PROTOCOL_FIRST_BIDDER)
            .assertEq(5 ether, "outbid credit");

        vm.prank(PROTOCOL_POSTER);
        (bool cancelAfterBid, bytes memory cancelAfterBidReturnData) = _callAuction(
            abi.encodeWithSelector(protocolAuctions.cancelAuction.selector, auctionMint.tokenId)
        );
        _assertRevertedWithMessage(cancelAfterBid, cancelAfterBidReturnData, "Bid exists");
        _assertAuctionActive(auctionMint.tokenId, 6 ether, PROTOCOL_SECOND_BIDDER);
    }

    function testAdversarialAuctionSettlementAndWithdrawalFailuresPreserveAccounting() public {
        AuctionMintResult memory auctionMint =
            _mintProtocolAuctionDrop(5 ether, "auction-settlement-withdrawal-adversarial");
        _bidProtocolAuction(auctionMint.tokenId, PROTOCOL_FIRST_BIDDER, 5 ether);
        _bidProtocolAuction(auctionMint.tokenId, PROTOCOL_SECOND_BIDDER, 6 ether);
        protocolAuctions.auctionBidderCredits(PROTOCOL_FIRST_BIDDER)
            .assertEq(5 ether, "outbid credit");

        _settleProtocolAuctionWithBid(auctionMint.tokenId, PROTOCOL_SECOND_BIDDER);
        uint256 owedAfterSettlement = protocolAuctions.totalOwed();
        uint256 proceedsAfterSettlement = protocolAuctions.totalProceedsOwed();

        (bool repeatSettlement, bytes memory repeatSettlementReturnData) = _callAuction(
            abi.encodeWithSelector(protocolAuctions.claimAuction.selector, auctionMint.tokenId)
        );
        _assertRevertedWithMessage(repeatSettlement, repeatSettlementReturnData, "Not ended");
        protocolAuctions.totalOwed().assertEq(owedAfterSettlement, "repeat owed");
        protocolAuctions.totalProceedsOwed().assertEq(proceedsAfterSettlement, "repeat proceeds");

        (bool lateBid, bytes memory lateBidReturnData) =
            _callBid(auctionMint.tokenId, PROTOCOL_FIRST_BIDDER, 7 ether);
        _assertRevertedWithMessage(lateBid, lateBidReturnData, "Ended");
        protocolAuctions.auctionHighestBid(auctionMint.tokenId).assertEq(6 ether, "late highest");
        protocolDeployed.core.ownerOf(auctionMint.tokenId)
            .assertEq(PROTOCOL_SECOND_BIDDER, "late custody");

        RejectEthReceiver reject = new RejectEthReceiver();
        uint256 bidderCredit = protocolAuctions.auctionBidderCredits(PROTOCOL_FIRST_BIDDER);
        vm.prank(PROTOCOL_FIRST_BIDDER);
        (bool bidderWithdrawal, bytes memory bidderWithdrawalReturnData) = _callAuction(
            abi.encodeWithSelector(
                protocolAuctions.withdrawBidderCreditTo.selector, payable(address(reject))
            )
        );
        _assertRevertedWithMessage(bidderWithdrawal, bidderWithdrawalReturnData, "ETH failed");
        protocolAuctions.auctionBidderCredits(PROTOCOL_FIRST_BIDDER)
            .assertEq(bidderCredit, "bidder credit erased");

        uint256 posterCredit = protocolAuctions.auctionPosterCredits(PROTOCOL_POSTER);
        vm.prank(PROTOCOL_POSTER);
        (bool proceedsWithdrawal, bytes memory proceedsWithdrawalReturnData) = _callAuction(
            abi.encodeWithSelector(
                protocolAuctions.withdrawAuctionProceedsCreditTo.selector, payable(address(reject))
            )
        );
        _assertRevertedWithMessage(proceedsWithdrawal, proceedsWithdrawalReturnData, "ETH failed");
        protocolAuctions.auctionPosterCredits(PROTOCOL_POSTER)
            .assertEq(posterCredit, "poster credit erased");
        protocolAuctions.totalOwed().assertEq(owedAfterSettlement, "failed withdrawal owed");
        _assertProtocolAccountingCoversOwed();
    }

    function _buildProtocolFreeFixedPriceAuthorization(string memory tokenData, uint256 deadline)
        private
        returns (StreamDrops.DropAuthorization memory authorization)
    {
        uint256 nonce = protocolModel.nextNonce;
        protocolModel.nextNonce++;
        authorization = buildFixedPriceAuthorization(
            protocolDeployed.drops,
            PROTOCOL_POSTER,
            PROTOCOL_RECIPIENT,
            address(0),
            tokenData,
            PROTOCOL_COLLECTION_ID,
            0,
            nonce,
            nonce,
            deadline
        );
    }

    function _assertDropMintFailsWithoutConsumption(
        StreamDrops.DropAuthorization memory authorization,
        string memory tokenData,
        bytes memory signature,
        string memory expectedRevert
    ) private {
        (bool success, bytes memory returnData) = _callMintDrop(authorization, tokenData, signature);
        _assertRevertedWithMessage(success, returnData, expectedRevert);
        protocolDeployed.drops.isDropConsumed(authorization.dropId)
            .assertFalse("failed drop consumed");
    }

    function _callMintDrop(
        StreamDrops.DropAuthorization memory authorization,
        string memory tokenData,
        bytes memory signature
    ) private returns (bool success, bytes memory returnData) {
        (success, returnData) = address(protocolDeployed.drops)
            .call(
                abi.encodeWithSelector(
                    protocolDeployed.drops.mintDrop.selector, authorization, tokenData, signature
                )
            );
    }

    function _assertAuctionActive(uint256 tokenId, uint256 expectedBid, address expectedBidder)
        private
        view
    {
        uint256(protocolAuctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.Active), "auction status");
        protocolDeployed.core.ownerOf(tokenId)
            .assertEq(address(protocolAuctions), "auction custody");
        protocolAuctions.auctionHighestBid(tokenId).assertEq(expectedBid, "auction bid");
        protocolAuctions.auctionHighestBidder(tokenId).assertEq(expectedBidder, "auction bidder");
        _assertProtocolAccountingCoversOwed();
    }

    function _callBid(uint256 tokenId, address bidder, uint256 bid)
        private
        returns (bool success, bytes memory returnData)
    {
        vm.deal(bidder, bid);
        vm.prank(bidder);
        // The adversarial harness intentionally sends ETH to the contract under
        // test while asserting that reverted bids preserve custody/accounting.
        // slither-disable-next-line arbitrary-send-eth
        (success, returnData) = address(protocolAuctions).call{ value: bid }(
            abi.encodeWithSelector(protocolAuctions.participateToAuction.selector, tokenId)
        );
    }

    function _callAuction(bytes memory data)
        private
        returns (bool success, bytes memory returnData)
    {
        (success, returnData) = address(protocolAuctions).call(data);
    }

    function _callDrops(bytes memory data) private returns (bool success, bytes memory returnData) {
        (success, returnData) = address(protocolDeployed.drops).call(data);
    }

    function _assertRevertedWithMessage(
        bool success,
        bytes memory returnData,
        string memory expectedMessage
    ) private pure {
        success.assertFalse("call unexpectedly succeeded");
        keccak256(returnData)
            .assertEq(
                keccak256(abi.encodeWithSignature("Error(string)", expectedMessage)),
                "unexpected revert"
            );
    }
}

contract RejectEthReceiver {
    receive() external payable {
        revert("reject");
    }
}
