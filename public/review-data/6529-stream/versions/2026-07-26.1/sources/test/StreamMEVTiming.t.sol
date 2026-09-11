// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/AuctionContract.sol";
import "../smart-contracts/StreamDrops.sol";
import "./helpers/Assertions.sol";
import "./helpers/DropAuthTestHelper.sol";
import "./helpers/StreamFixture.sol";

contract StreamMEVTimingTest is DropAuthTestHelper, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for string;
    using Assertions for uint256;

    address private constant POSTER = address(0x1001);
    address private constant PAYOUT = address(0x2002);
    address private constant CURATORS_POOL = address(0x3003);
    address private constant RECIPIENT = address(0x4004);
    address private constant SEARCHER = address(0x5005);
    address private constant PAYER = address(0x6006);
    address private constant BIDDER = address(0x7007);
    address private constant SECOND_BIDDER = address(0x8008);

    uint256 private constant RESERVE_PRICE = 5 ether;
    uint256 private constant SECOND_BID = 6 ether;
    uint256 private constant FIRST_TOKEN_ID = 1;
    bytes4 private constant ERROR_STRING_SELECTOR = bytes4(keccak256("Error(string)"));

    function testThirdPartyCanSubmitFreeDropButCannotStealRecipient() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        string memory tokenData = "free-drop-timing";
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            deployed.drops,
            POSTER,
            RECIPIENT,
            address(0),
            tokenData,
            1,
            0,
            101,
            102,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(deployed.drops, authorization);

        vm.prank(SEARCHER);
        deployed.drops.mintDrop(authorization, tokenData, signature);

        uint256 tokenId = deployed.drops.retrieveTokenID(authorization.dropId);
        tokenId.assertEq(FIRST_TOKEN_ID, "fixture token id");
        deployed.core.ownerOf(tokenId).assertEq(RECIPIENT, "recipient stolen");
        deployed.drops.retrieveExecutionAddress(tokenId)
            .assertEq(RECIPIENT, "execution address changed");
        deployed.drops.isDropConsumed(authorization.dropId).assertTrue("drop not consumed");

        vm.prank(RECIPIENT);
        (bool replaySuccess, bytes memory replayData) = address(deployed.drops)
            .call(
                abi.encodeWithSelector(
                    deployed.drops.mintDrop.selector, authorization, tokenData, signature
                )
            );
        _assertRevertedWithReason(replaySuccess, replayData, "Drop Executed");
        deployed.core.totalSupply().assertEq(1, "replay minted another token");
    }

    function testPaidDropBindsPayerAndFailedSearcherAttemptDoesNotConsume() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        string memory tokenData = "paid-drop-payer-bound";
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            deployed.drops,
            POSTER,
            RECIPIENT,
            PAYER,
            tokenData,
            1,
            1 ether,
            201,
            202,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(deployed.drops, authorization);
        vm.deal(SEARCHER, 2 ether);
        vm.deal(PAYER, 2 ether);

        vm.prank(SEARCHER);
        (bool searcherSuccess, bytes memory searcherData) = address(deployed.drops)
        .call{ value: 1 ether }(
            abi.encodeWithSelector(
                deployed.drops.mintDrop.selector, authorization, tokenData, signature
            )
        );
        _assertRevertedWithReason(searcherSuccess, searcherData, "payer");
        deployed.drops.isDropConsumed(authorization.dropId)
            .assertFalse("failed payer consumed drop");
        deployed.core.totalSupply().assertEq(0, "failed payer minted token");

        vm.prank(PAYER);
        deployed.drops.mintDrop{ value: 1 ether }(authorization, tokenData, signature);

        uint256 tokenId = deployed.drops.retrieveTokenID(authorization.dropId);
        tokenId.assertEq(FIRST_TOKEN_ID, "fixture token id");
        deployed.core.ownerOf(tokenId).assertEq(RECIPIENT, "paid recipient");
        deployed.drops.isDropConsumed(authorization.dropId).assertTrue("paid drop not consumed");
    }

    function testDeadlineBoundaryIsInclusiveAndExpiredAttemptDoesNotConsume() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());

        StreamDrops.DropAuthorization memory exactDeadline = buildFixedPriceAuthorization(
            deployed.drops,
            POSTER,
            RECIPIENT,
            address(0),
            "deadline-inclusive",
            1,
            0,
            301,
            302,
            block.timestamp
        );
        bytes memory exactSignature = signAuthorization(deployed.drops, exactDeadline);

        deployed.drops.mintDrop(exactDeadline, "deadline-inclusive", exactSignature);

        deployed.drops.isDropConsumed(exactDeadline.dropId)
            .assertTrue("exact deadline not consumed");

        StreamDrops.DropAuthorization memory expired = buildFixedPriceAuthorization(
            deployed.drops,
            POSTER,
            RECIPIENT,
            address(0),
            "deadline-expired",
            1,
            0,
            303,
            304,
            block.timestamp
        );
        bytes memory expiredSignature = signAuthorization(deployed.drops, expired);

        vm.warp(block.timestamp + 1);
        (bool expiredSuccess, bytes memory expiredData) = address(deployed.drops)
            .call(
                abi.encodeWithSelector(
                    deployed.drops.mintDrop.selector, expired, "deadline-expired", expiredSignature
                )
            );

        _assertRevertedWithReason(expiredSuccess, expiredData, "Expired");
        deployed.drops.isDropConsumed(expired.dropId).assertFalse("expired drop consumed");
        deployed.core.totalSupply().assertEq(1, "expired drop minted token");
    }

    function testExactEndBidIsAcceptedAndExtendsAuction() public {
        AuctionSetup memory setup = _createAuction(block.timestamp + 601, 401);
        vm.deal(BIDDER, 10 ether);
        vm.warp(setup.auctionEndTime);
        uint256 extensionTime = setup.auctions.extensionTime();

        vm.prank(BIDDER);
        setup.auctions.participateToAuction{ value: RESERVE_PRICE }(setup.tokenId);

        setup.auctions.auctionHighestBid(setup.tokenId).assertEq(RESERVE_PRICE, "bid");
        setup.auctions.auctionHighestBidder(setup.tokenId).assertEq(BIDDER, "bidder");
        setup.deployed.core.ownerOf(setup.tokenId).assertEq(address(setup.auctions), "custody");
        setup.auctions.retrieveAuctionEndTime(setup.tokenId)
            .assertEq(setup.auctionEndTime + extensionTime, "extended end");
        uint256(setup.auctions.retrieveAuctionStatus(setup.tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.Active), "status");
    }

    function testLateBidAfterStrictEndFailsWithoutStateMutation() public {
        AuctionSetup memory setup = _createAuction(block.timestamp + 601, 501);
        vm.deal(BIDDER, 10 ether);

        vm.prank(BIDDER);
        setup.auctions.participateToAuction{ value: RESERVE_PRICE }(setup.tokenId);

        uint256 endTime = setup.auctions.retrieveAuctionEndTime(setup.tokenId);
        address ownerBefore = setup.deployed.core.ownerOf(setup.tokenId);
        uint256 escrowBefore = setup.auctions.totalAuctionBidEscrow();
        uint256 balanceBefore = address(setup.auctions).balance;
        vm.deal(SECOND_BIDDER, 10 ether);
        vm.warp(endTime + 1);

        vm.prank(SECOND_BIDDER);
        (bool lateSuccess, bytes memory lateData) = address(setup.auctions)
        .call{ value: SECOND_BID }(
            abi.encodeWithSelector(setup.auctions.participateToAuction.selector, setup.tokenId)
        );

        _assertRevertedWithReason(lateSuccess, lateData, "Ended");
        setup.auctions.auctionHighestBid(setup.tokenId).assertEq(RESERVE_PRICE, "bid changed");
        setup.auctions.auctionHighestBidder(setup.tokenId).assertEq(BIDDER, "bidder changed");
        setup.auctions.totalAuctionBidEscrow().assertEq(escrowBefore, "escrow changed");
        address(setup.auctions).balance.assertEq(balanceBefore, "balance changed");
        setup.deployed.core.ownerOf(setup.tokenId).assertEq(ownerBefore, "custody changed");
        uint256(setup.auctions.retrieveAuctionStatus(setup.tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.EndedWithBid), "status");
    }

    function testNearEndOutbidCreditsPreviousBidderAndExtendsOnce() public {
        AuctionSetup memory setup = _createAuction(block.timestamp + 1 days, 601);
        vm.deal(BIDDER, 10 ether);
        vm.deal(SECOND_BIDDER, 10 ether);
        uint256 extensionTime = setup.auctions.extensionTime();

        vm.prank(BIDDER);
        setup.auctions.participateToAuction{ value: RESERVE_PRICE }(setup.tokenId);
        vm.warp(setup.auctionEndTime - extensionTime + 1);

        vm.prank(SECOND_BIDDER);
        setup.auctions.participateToAuction{ value: SECOND_BID }(setup.tokenId);

        setup.auctions.auctionHighestBid(setup.tokenId).assertEq(SECOND_BID, "highest bid");
        setup.auctions.auctionHighestBidder(setup.tokenId).assertEq(SECOND_BIDDER, "highest bidder");
        setup.auctions.auctionBidderCredits(BIDDER).assertEq(RESERVE_PRICE, "bidder credit");
        setup.auctions.totalBidderOwed().assertEq(RESERVE_PRICE, "total bidder owed");
        setup.auctions.totalAuctionBidEscrow().assertEq(SECOND_BID, "active escrow");
        setup.auctions.retrieveAuctionEndTime(setup.tokenId)
            .assertEq(setup.auctionEndTime + extensionTime, "extended end");
        setup.deployed.core.ownerOf(setup.tokenId).assertEq(address(setup.auctions), "custody");
    }

    struct AuctionSetup {
        DeployedStream deployed;
        StreamAuctions auctions;
        uint256 tokenId;
        uint256 auctionEndTime;
    }

    function _createAuction(uint256 auctionEndTime, uint256 saltSeed)
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
            POSTER,
            address(0),
            "timing-auction",
            1,
            RESERVE_PRICE,
            auctionEndTime,
            saltSeed * 2,
            saltSeed * 2 + 1,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(setup.deployed.drops, authorization);

        setup.deployed.drops.mintDrop(authorization, "timing-auction", signature);
        setup.tokenId = setup.deployed.drops.retrieveTokenID(authorization.dropId);
        setup.tokenId.assertEq(FIRST_TOKEN_ID, "fixture token id");
        setup.deployed.core.ownerOf(setup.tokenId).assertEq(address(setup.auctions), "custody");
    }

    function _assertRevertedWithReason(bool success, bytes memory revertData, string memory message)
        private
        pure
    {
        success.assertFalse("call unexpectedly succeeded");
        (revertData.length >= 4).assertTrue("missing revert selector");

        bytes4 selector;
        assembly {
            selector := mload(add(revertData, 32))
        }
        (selector == ERROR_STRING_SELECTOR).assertTrue("unexpected revert selector");

        bytes memory encodedReason = new bytes(revertData.length - 4);
        for (uint256 i = 0; i < encodedReason.length; i++) {
            encodedReason[i] = revertData[i + 4];
        }
        string memory reason = abi.decode(encodedReason, (string));
        reason.assertEq(message, "revert reason");
    }
}
