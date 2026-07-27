// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../smart-contracts/AuctionContract.sol";
import "../../smart-contracts/StreamDrops.sol";
import "../../smart-contracts/StreamPauseDomains.sol";
import "./Assertions.sol";
import "./DropAuthTestHelper.sol";
import "./StreamFixture.sol";

abstract contract ProtocolStateMachine is DropAuthTestHelper, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for string;
    using Assertions for uint256;

    uint256 internal constant PROTOCOL_COLLECTION_ID = 1;
    uint256 internal constant PROTOCOL_AUCTION_DURATION = 1 days;
    address internal constant PROTOCOL_POSTER = address(0x1001);
    address internal constant PROTOCOL_RECIPIENT = address(0x2001);
    address internal constant PROTOCOL_PAYOUT = address(0x3001);
    address internal constant PROTOCOL_CURATORS_POOL = address(0x4001);
    address internal constant PROTOCOL_FIRST_BIDDER = address(0x5001);
    address internal constant PROTOCOL_SECOND_BIDDER = address(0x5002);
    address internal constant PROTOCOL_WITHDRAW_RECIPIENT = address(0x6001);
    bytes32 internal constant PROTOCOL_PAUSE_REASON = keccak256("protocol-state-machine");

    struct FixedPriceMintResult {
        bytes32 dropId;
        uint256 tokenId;
        uint256 price;
    }

    struct AuctionMintResult {
        bytes32 dropId;
        uint256 tokenId;
        uint256 reservePrice;
        uint256 endTime;
    }

    struct ProtocolModel {
        uint256 nextNonce;
        uint256 fixedPriceMints;
        uint256 auctionMints;
        uint256 finalizedTokens;
        bool signerRotated;
        bool collectionFrozen;
    }

    DeployedStream internal protocolDeployed;
    StreamAuctions internal protocolAuctions;
    ProtocolModel internal protocolModel;

    function _deployProtocolStateMachine() internal {
        protocolDeployed =
            deployStreamWithSigner(PROTOCOL_PAYOUT, PROTOCOL_CURATORS_POOL, signerAddress());
        protocolDeployed.admins.updateEmergencyRecipient(PROTOCOL_WITHDRAW_RECIPIENT);
        protocolAuctions = new StreamAuctions(
            address(protocolDeployed.minter),
            address(protocolDeployed.core),
            address(protocolDeployed.admins),
            address(protocolDeployed.drops),
            PROTOCOL_PAYOUT,
            PROTOCOL_CURATORS_POOL
        );
        protocolDeployed.drops.updateAuctionContract(address(protocolAuctions));
        protocolModel = ProtocolModel({
            nextNonce: 1,
            fixedPriceMints: 0,
            auctionMints: 0,
            finalizedTokens: 0,
            signerRotated: false,
            collectionFrozen: false
        });
    }

    function _mintProtocolFixedPriceDrop(uint256 price, string memory tokenData)
        internal
        returns (FixedPriceMintResult memory result)
    {
        uint256 nonce = _consumeProtocolNonce();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            protocolDeployed.drops,
            PROTOCOL_POSTER,
            PROTOCOL_RECIPIENT,
            price == 0 ? address(0) : address(this),
            tokenData,
            PROTOCOL_COLLECTION_ID,
            price,
            nonce,
            nonce,
            block.timestamp + 2 days
        );
        bytes memory signature = signAuthorization(protocolDeployed.drops, authorization);

        vm.deal(address(this), address(this).balance + price);
        protocolDeployed.drops.mintDrop{ value: price }(authorization, tokenData, signature);
        uint256 tokenId = protocolDeployed.drops.retrieveTokenID(authorization.dropId);

        protocolModel.fixedPriceMints++;
        protocolDeployed.core.ownerOf(tokenId).assertEq(PROTOCOL_RECIPIENT, "fixed owner");
        protocolDeployed.core.viewColIDforTokenID(tokenId)
            .assertEq(PROTOCOL_COLLECTION_ID, "fixed collection");
        protocolDeployed.drops.isDropConsumed(authorization.dropId)
            .assertTrue("fixed drop not consumed");
        protocolDeployed.drops.retrieveExecutionAddress(tokenId)
            .assertEq(PROTOCOL_RECIPIENT, "fixed execution address");

        result =
            FixedPriceMintResult({ dropId: authorization.dropId, tokenId: tokenId, price: price });
    }

    function _mintProtocolAuctionDrop(uint256 reservePrice, string memory tokenData)
        internal
        returns (AuctionMintResult memory result)
    {
        uint256 nonce = _consumeProtocolNonce();
        uint256 endTime = block.timestamp + PROTOCOL_AUCTION_DURATION;
        StreamDrops.DropAuthorization memory authorization = buildAuctionAuthorization(
            protocolDeployed.drops,
            PROTOCOL_POSTER,
            address(0),
            tokenData,
            PROTOCOL_COLLECTION_ID,
            reservePrice,
            endTime,
            nonce,
            nonce,
            block.timestamp + 2 days
        );
        bytes memory signature = signAuthorization(protocolDeployed.drops, authorization);

        protocolDeployed.drops.mintDrop(authorization, tokenData, signature);
        uint256 tokenId = protocolDeployed.drops.retrieveTokenID(authorization.dropId);

        protocolModel.auctionMints++;
        protocolDeployed.core.ownerOf(tokenId).assertEq(address(protocolAuctions), "auction owner");
        uint256(protocolAuctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.Active), "auction active");
        protocolDeployed.drops.retrieveAuctionPoster(tokenId)
            .assertEq(PROTOCOL_POSTER, "auction poster");
        protocolDeployed.drops.retrieveAuctionPrice(tokenId)
            .assertEq(reservePrice, "auction reserve");

        result = AuctionMintResult({
            dropId: authorization.dropId,
            tokenId: tokenId,
            reservePrice: reservePrice,
            endTime: endTime
        });
    }

    function _bidProtocolAuction(uint256 tokenId, address bidder, uint256 bid) internal {
        vm.deal(bidder, bid);
        vm.prank(bidder);
        // The state-machine harness pays the contract under test; payment
        // safety is asserted immediately after generated actions.
        // slither-disable-next-line arbitrary-send-eth
        protocolAuctions.participateToAuction{ value: bid }(tokenId);

        protocolAuctions.auctionHighestBidder(tokenId).assertEq(bidder, "highest bidder");
        protocolAuctions.auctionHighestBid(tokenId).assertEq(bid, "highest bid");
        protocolDeployed.core.ownerOf(tokenId).assertEq(address(protocolAuctions), "bid custody");
        _assertProtocolAccountingCoversOwed();
    }

    function _settleProtocolAuctionWithBid(uint256 tokenId, address expectedWinner) internal {
        uint256 endTime = protocolAuctions.retrieveAuctionEndTime(tokenId);
        if (block.timestamp <= endTime) {
            vm.warp(endTime + 1);
        }

        protocolAuctions.claimAuction(tokenId);
        uint256(protocolAuctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.SettledWithBid), "settled status");
        protocolDeployed.core.ownerOf(tokenId).assertEq(expectedWinner, "auction winner");
        protocolAuctions.totalAuctionBidEscrow().assertEq(0, "auction escrow");
        _assertProtocolAccountingCoversOwed();
    }

    function _finalizeProtocolTokenMetadata(uint256 tokenId, uint256 salt) internal {
        if (protocolDeployed.core.retrieveTokenHash(tokenId) == bytes32(0)) {
            protocolDeployed.randomizer.calculateTokenHash(PROTOCOL_COLLECTION_ID, tokenId, salt);
        }
        (protocolDeployed.core.retrieveTokenHash(tokenId) == bytes32(0)).assertFalse("hash missing");
        protocolDeployed.core.tokenMetadataState(tokenId).assertEq("final", "metadata state");
        protocolModel.finalizedTokens++;
    }

    function _mutateProtocolTokenMetadata(uint256 tokenId, string memory tokenData) internal {
        protocolDeployed.core.changeTokenData(tokenId, tokenData);

        uint256[] memory tokenIds = new uint256[](1);
        string[] memory images = new string[](1);
        string[] memory attributes = new string[](1);
        tokenIds[0] = tokenId;
        images[0] = "ipfs://state-machine/image.png";
        attributes[0] = "{\"trait_type\":\"Harness\",\"value\":\"ADV-001\"}";
        protocolDeployed.core.updateImagesAndAttributes(tokenIds, images, attributes);

        protocolDeployed.core.tokenData(tokenId).assertEq(tokenData, "token data");
        (string memory image, string memory rawAttributes) =
            protocolDeployed.core.retrievetokenImageAndAttributes(tokenId);
        image.assertEq(images[0], "token image");
        rawAttributes.assertEq(attributes[0], "token attributes");
    }

    function _exerciseProtocolPauseSignerAndCancellation()
        internal
        returns (bytes32 cancelledDropId)
    {
        string memory tokenData = "cancelled-after-signer-rotation";
        uint256 nonce = _consumeProtocolNonce();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            protocolDeployed.drops,
            PROTOCOL_POSTER,
            PROTOCOL_RECIPIENT,
            address(0),
            tokenData,
            PROTOCOL_COLLECTION_ID,
            0,
            nonce,
            nonce,
            block.timestamp + 2 days
        );
        bytes memory signature = signAuthorization(protocolDeployed.drops, authorization);

        _setProtocolPaused(StreamPauseDomains.DROP_EXECUTION, true);
        (bool pausedSuccess,) = address(protocolDeployed.drops)
            .call(
                abi.encodeWithSelector(
                    protocolDeployed.drops.mintDrop.selector, authorization, tokenData, signature
                )
            );
        pausedSuccess.assertFalse("paused drop minted");
        protocolDeployed.drops.isDropConsumed(authorization.dropId)
            .assertFalse("paused drop consumed");
        _setProtocolPaused(StreamPauseDomains.DROP_EXECUTION, false);

        protocolDeployed.drops.updateTDHsigner(otherSignerAddress());
        protocolModel.signerRotated = true;
        (bool staleSuccess,) = address(protocolDeployed.drops)
            .call(
                abi.encodeWithSelector(
                    protocolDeployed.drops.mintDrop.selector, authorization, tokenData, signature
                )
            );
        staleSuccess.assertFalse("stale signer minted");
        protocolDeployed.drops.isDropConsumed(authorization.dropId)
            .assertFalse("stale drop consumed");

        uint256 cancelNonce = _consumeProtocolNonce();
        StreamDrops.DropAuthorization memory cancellableAuthorization = buildFixedPriceAuthorization(
            protocolDeployed.drops,
            PROTOCOL_POSTER,
            PROTOCOL_RECIPIENT,
            address(0),
            tokenData,
            PROTOCOL_COLLECTION_ID,
            0,
            cancelNonce,
            cancelNonce,
            block.timestamp + 2 days
        );
        bytes memory cancelSignature = signAuthorizationWithKey(
            protocolDeployed.drops, cancellableAuthorization, OTHER_SIGNER_KEY
        );

        protocolDeployed.drops.cancelDrop(cancellableAuthorization.dropId);
        protocolDeployed.drops.isDropCancelled(cancellableAuthorization.dropId)
            .assertTrue("drop not cancelled");
        (bool cancelledSuccess,) = address(protocolDeployed.drops)
            .call(
                abi.encodeWithSelector(
                    protocolDeployed.drops.mintDrop.selector,
                    cancellableAuthorization,
                    tokenData,
                    cancelSignature
                )
            );
        cancelledSuccess.assertFalse("cancelled drop minted");
        protocolDeployed.drops.isDropConsumed(cancellableAuthorization.dropId)
            .assertFalse("cancelled drop consumed");

        cancelledDropId = cancellableAuthorization.dropId;
    }

    function _assertProtocolMetadataPauseBlocksMutation(uint256 tokenId) internal {
        _setProtocolPaused(StreamPauseDomains.METADATA_MUTATION, true);
        (bool success,) = address(protocolDeployed.core)
            .call(
                abi.encodeWithSelector(
                    protocolDeployed.core.changeTokenData.selector, tokenId, "paused"
                )
            );
        success.assertFalse("paused metadata changed");
        _setProtocolPaused(StreamPauseDomains.METADATA_MUTATION, false);
    }

    function _withdrawProtocolFixedPriceCredit(address account) internal {
        uint256 credit = protocolDeployed.drops.fixedPricePosterCredits(account)
            + protocolDeployed.drops.fixedPriceProtocolCredits(account);
        if (credit == 0) {
            return;
        }
        vm.prank(account);
        protocolDeployed.drops.withdrawFixedPriceCreditTo(payable(PROTOCOL_WITHDRAW_RECIPIENT));
        (protocolDeployed.drops.fixedPricePosterCredits(account)
                + protocolDeployed.drops.fixedPriceProtocolCredits(account))
        .assertEq(0, "fixed credit not withdrawn");
    }

    function _withdrawProtocolBidderCredit(address account) internal {
        if (protocolAuctions.auctionBidderCredits(account) == 0) {
            return;
        }
        vm.prank(account);
        protocolAuctions.withdrawBidderCreditTo(payable(PROTOCOL_WITHDRAW_RECIPIENT));
        protocolAuctions.auctionBidderCredits(account).assertEq(0, "bidder credit");
    }

    function _withdrawProtocolAuctionProceedsCredit(address account) internal {
        uint256 credit = protocolAuctions.auctionPosterCredits(account)
            + protocolAuctions.auctionProtocolCredits(account)
            + protocolAuctions.auctionCuratorCredits(account);
        if (credit == 0) {
            return;
        }
        vm.prank(account);
        protocolAuctions.withdrawAuctionProceedsCreditTo(payable(PROTOCOL_WITHDRAW_RECIPIENT));
        (protocolAuctions.auctionPosterCredits(account)
                + protocolAuctions.auctionProtocolCredits(account)
                + protocolAuctions.auctionCuratorCredits(account))
        .assertEq(0, "auction proceeds credit");
    }

    function _freezeProtocolCollection() internal returns (bytes32 manifestHash) {
        _warpPastProtocolFinalSupplyWindow();
        manifestHash =
            protocolDeployed.core.previewCollectionFreezeManifestHash(PROTOCOL_COLLECTION_ID);
        protocolDeployed.core.freezeCollection(PROTOCOL_COLLECTION_ID);
        protocolModel.collectionFrozen = true;

        protocolDeployed.core.collectionFreezeStatus(PROTOCOL_COLLECTION_ID)
            .assertTrue("collection not frozen");
        protocolDeployed.core.collectionFreezeManifestHash(PROTOCOL_COLLECTION_ID)
            .assertEq(manifestHash, "freeze manifest");
        protocolDeployed.core.totalSupplyOfCollection(PROTOCOL_COLLECTION_ID)
            .assertEq(
                protocolModel.fixedPriceMints + protocolModel.auctionMints, "frozen live supply"
            );
    }

    function _assertProtocolFixedPriceCredits(uint256 price) internal view {
        uint256 expectedPoster = price / 2;
        uint256 expectedCuratorReserve = price / 4;
        uint256 expectedProtocol = price - expectedPoster - expectedCuratorReserve;

        protocolDeployed.drops.fixedPricePosterCredits(PROTOCOL_POSTER)
            .assertEq(expectedPoster, "fixed poster credit");
        protocolDeployed.drops.fixedPriceProtocolCredits(PROTOCOL_PAYOUT)
            .assertEq(expectedProtocol, "fixed protocol credit");
        protocolDeployed.drops.fixedPriceCuratorReserveCredits(PROTOCOL_CURATORS_POOL)
            .assertEq(expectedCuratorReserve, "fixed curator reserve");
        protocolDeployed.drops.totalFixedPriceOwed().assertEq(price, "fixed total");
        _assertProtocolAccountingCoversOwed();
    }

    function _assertProtocolAuctionCredits(uint256 highestBid) internal view {
        uint256 expectedPoster = highestBid / 2;
        uint256 expectedCurator = highestBid / 4;
        uint256 expectedProtocol = highestBid - expectedPoster - expectedCurator;

        protocolAuctions.auctionPosterCredits(PROTOCOL_POSTER)
            .assertEq(expectedPoster, "auction poster credit");
        protocolAuctions.auctionProtocolCredits(PROTOCOL_PAYOUT)
            .assertEq(expectedProtocol, "auction protocol credit");
        protocolAuctions.auctionCuratorCredits(PROTOCOL_CURATORS_POOL)
            .assertEq(expectedCurator, "auction curator credit");
        protocolAuctions.totalProceedsOwed().assertEq(highestBid, "auction proceeds");
        _assertProtocolAccountingCoversOwed();
    }

    function _assertProtocolAccountingCoversOwed() internal view {
        address(protocolDeployed.drops).balance
            .assertGte(protocolDeployed.drops.totalOwed(), "drops balance");
        address(protocolAuctions).balance.assertGte(protocolAuctions.totalOwed(), "auction balance");
        protocolDeployed.drops.surplus()
            .assertEq(
                _protocolSurplus(
                    address(protocolDeployed.drops), protocolDeployed.drops.totalOwed()
                ),
                "drops surplus"
            );
        protocolAuctions.surplus()
            .assertEq(
                _protocolSurplus(address(protocolAuctions), protocolAuctions.totalOwed()),
                "auction surplus"
            );
    }

    function _setProtocolPaused(bytes32 domain, bool paused) internal {
        protocolDeployed.admins.setPaused(domain, paused, PROTOCOL_PAUSE_REASON);
        if (paused) {
            protocolDeployed.admins.isPaused(domain).assertTrue("pause state");
        } else {
            protocolDeployed.admins.isPaused(domain).assertFalse("pause state");
        }
    }

    function _warpPastProtocolFinalSupplyWindow() private {
        (, uint256 endTime) =
            protocolDeployed.minter.retrieveCollectionPhases(PROTOCOL_COLLECTION_ID);
        uint256 targetTime = endTime + 1 days + 1;
        if (block.timestamp < targetTime) {
            vm.warp(targetTime);
        }
    }

    function _consumeProtocolNonce() private returns (uint256 nonce) {
        nonce = protocolModel.nextNonce;
        protocolModel.nextNonce++;
    }

    function _protocolSurplus(address target, uint256 owed) private view returns (uint256) {
        if (target.balance <= owed) {
            return 0;
        }
        return target.balance - owed;
    }
}
