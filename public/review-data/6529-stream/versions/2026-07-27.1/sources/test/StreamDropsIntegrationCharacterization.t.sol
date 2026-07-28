// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/AuctionContract.sol";
import "./helpers/Assertions.sol";
import "./helpers/DropAuthTestHelper.sol";
import "./helpers/StreamFixture.sol";
import "./mocks/MockRandomizer.sol";

contract StreamDropsIntegrationCharacterizationTest is DropAuthTestHelper, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for string;
    using Assertions for uint256;

    address private constant POSTER = address(0x1001);
    address private constant RECIPIENT = address(0x5005);
    address private constant PAYOUT = address(0x2002);
    address private constant CURATORS_POOL = address(0x3003);

    function testFixedPriceDropCreditsProceedsAndMintsToExplicitRecipient() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        vm.deal(address(this), 10 ether);
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            deployed.drops,
            POSTER,
            RECIPIENT,
            address(this),
            "data",
            1,
            4 ether,
            1,
            2,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(deployed.drops, authorization);
        uint256 posterBalanceBefore = POSTER.balance;
        uint256 payoutBalanceBefore = PAYOUT.balance;
        uint256 curatorsBalanceBefore = CURATORS_POOL.balance;

        deployed.drops.mintDrop{ value: 4 ether }(authorization, "data", signature);

        uint256 tokenId = 1;
        POSTER.balance.assertEq(posterBalanceBefore, "poster was push-paid");
        PAYOUT.balance.assertEq(payoutBalanceBefore, "protocol was push-paid");
        CURATORS_POOL.balance.assertEq(curatorsBalanceBefore, "curator was push-paid");
        deployed.drops.fixedPricePosterCredits(POSTER).assertEq(2 ether, "poster credit");
        deployed.drops.fixedPriceProtocolCredits(PAYOUT).assertEq(1 ether, "protocol credit");
        deployed.drops.fixedPriceCuratorReserveCredits(CURATORS_POOL)
            .assertEq(1 ether, "curator reserve credit");
        deployed.drops.totalFixedPriceOwed().assertEq(4 ether, "fixed-price owed");
        deployed.drops.totalOwed().assertEq(4 ether, "total owed");
        deployed.drops.emergencyWithdrawable().assertEq(0, "surplus");
        deployed.core.ownerOf(tokenId).assertEq(RECIPIENT, "recipient changed");
        deployed.core.retrieveTokenHash(tokenId)
            .assertEq(keccak256(abi.encode(uint256(1), tokenId, uint256(0))), "token hash changed");
        deployed.core.tokenURI(tokenId).assertEq("ipfs://base/1", "tokenURI changed");
        deployed.drops.retrieveDropID(tokenId).assertEq(authorization.dropId, "drop id changed");
    }

    function testFixedPriceDropSucceedsWhenPosterRejectsETH() public {
        RejectETH rejectPoster = new RejectETH();
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        vm.deal(address(this), 10 ether);
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            deployed.drops,
            address(rejectPoster),
            RECIPIENT,
            address(this),
            "data",
            1,
            4 ether,
            3,
            4,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(deployed.drops, authorization);

        (bool success,) = address(deployed.drops).call{ value: 4 ether }(
            abi.encodeWithSelector(
                deployed.drops.mintDrop.selector, authorization, "data", signature
            )
        );

        success.assertTrue("rejecting poster blocked mint");
        deployed.core.totalSupply().assertEq(1, "rejecting poster mint missing");
        deployed.drops.fixedPricePosterCredits(address(rejectPoster))
            .assertEq(2 ether, "rejecting poster credit");
    }

    function testFixedPriceDropSucceedsWhenPayoutAddressRejectsETH() public {
        RejectETH rejectPayout = new RejectETH();
        DeployedStream memory deployed =
            deployStreamWithSigner(address(rejectPayout), CURATORS_POOL, signerAddress());
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

        (bool success,) = address(deployed.drops).call{ value: 4 ether }(
            abi.encodeWithSelector(
                deployed.drops.mintDrop.selector, authorization, "data", signature
            )
        );

        success.assertTrue("rejecting payout address blocked mint");
        deployed.core.totalSupply().assertEq(1, "rejecting payout mint missing");
        deployed.drops.fixedPriceProtocolCredits(address(rejectPayout))
            .assertEq(1 ether, "rejecting payout credit");
    }

    function testFixedPriceDropSucceedsWhenCuratorsPoolRejectsETH() public {
        RejectETH rejectCuratorsPool = new RejectETH();
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, address(rejectCuratorsPool), signerAddress());
        vm.deal(address(this), 10 ether);
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            deployed.drops,
            POSTER,
            RECIPIENT,
            address(this),
            "data",
            1,
            4 ether,
            7,
            8,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(deployed.drops, authorization);

        (bool success,) = address(deployed.drops).call{ value: 4 ether }(
            abi.encodeWithSelector(
                deployed.drops.mintDrop.selector, authorization, "data", signature
            )
        );

        success.assertTrue("rejecting curators pool blocked mint");
        deployed.core.totalSupply().assertEq(1, "rejecting curator mint missing");
        deployed.drops.fixedPriceCuratorReserveCredits(address(rejectCuratorsPool))
            .assertEq(1 ether, "rejecting curator reserve credit");
    }

    function testAuctionDropMintsCustodyToAuctionContractAndRecordsAuctionState() public {
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
        uint256 auctionEndTime = block.timestamp + 1 days;
        StreamDrops.DropAuthorization memory authorization = buildAuctionAuthorization(
            deployed.drops,
            POSTER,
            address(0),
            "auction-data",
            1,
            5 ether,
            auctionEndTime,
            9,
            10,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(deployed.drops, authorization);

        deployed.drops.mintDrop(authorization, "auction-data", signature);

        uint256 tokenId = 1;
        deployed.core.ownerOf(tokenId).assertEq(address(auctions), "auction custody changed");
        deployed.minter.getAuctionStatus(tokenId).assertTrue("auction status changed");
        deployed.minter.getAuctionEndTime(tokenId)
            .assertEq(auctionEndTime, "auction end time changed");
        uint256(auctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.Active), "auction lifecycle changed");
        auctions.retrieveAuctionEndTime(tokenId).assertEq(auctionEndTime, "registered end changed");
        deployed.drops.retrieveAuctionPoster(tokenId).assertEq(POSTER, "auction poster changed");
        deployed.drops.retrieveAuctionPrice(tokenId)
            .assertEq(5 ether, "auction starting price changed");
        deployed.drops.retrieveDropID(tokenId)
            .assertEq(authorization.dropId, "auction drop id changed");
        deployed.drops.retrieveExecutionAddress(tokenId)
            .assertEq(POSTER, "auction execution changed");
    }

    function testAuctionDropRejectsNonZeroRecipient() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        uint256 auctionEndTime = block.timestamp + 1 days;
        StreamDrops.DropAuthorization memory authorization = buildAuctionAuthorization(
            deployed.drops,
            POSTER,
            RECIPIENT,
            "auction-data",
            1,
            5 ether,
            auctionEndTime,
            11,
            12,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(deployed.drops, authorization);

        (bool success,) = address(deployed.drops)
            .call(
                abi.encodeWithSelector(
                    deployed.drops.mintDrop.selector, authorization, "auction-data", signature
                )
            );

        success.assertFalse("non-zero auction recipient minted");
        deployed.core.totalSupply().assertEq(0, "non-zero auction recipient changed supply");
    }

    function testNoBidAuctionSettlementTransfersToPoster() public {
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
        uint256 auctionEndTime = block.timestamp + 1 days;
        StreamDrops.DropAuthorization memory authorization = buildAuctionAuthorization(
            deployed.drops,
            POSTER,
            address(0),
            "auction-data",
            1,
            5 ether,
            auctionEndTime,
            13,
            14,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(deployed.drops, authorization);

        deployed.drops.mintDrop(authorization, "auction-data", signature);

        uint256 tokenId = 1;
        deployed.drops.retrieveExecutionAddress(tokenId)
            .assertEq(POSTER, "no-bid execution address changed");
        vm.warp(auctionEndTime + 1);

        auctions.claimAuction(tokenId);

        deployed.core.ownerOf(tokenId).assertEq(POSTER, "no-bid settlement recipient changed");
        uint256(auctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.SettledNoBid), "status not settled");
    }

    function testContractExecutorCanMintFixedPriceDropToExplicitRecipient() public {
        AuthorizedDropExecutor executor = new AuthorizedDropExecutor();
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        vm.deal(address(executor), 10 ether);
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            deployed.drops,
            POSTER,
            RECIPIENT,
            address(executor),
            "data",
            1,
            4 ether,
            15,
            16,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(deployed.drops, authorization);

        executor.mintFixedPrice{ value: 4 ether }(deployed.drops, authorization, "data", signature);

        uint256 tokenId = 1;
        deployed.core.ownerOf(tokenId).assertEq(RECIPIENT, "contract execution recipient changed");
        deployed.drops.retrieveExecutionAddress(tokenId)
            .assertEq(RECIPIENT, "contract execution address changed");
    }

    function testPendingMetadataCurrentlyUsesPendingSuffixWhenRandomizerDoesNothing() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        NoopRandomizer noopRandomizer = new NoopRandomizer();
        deployed.core.addRandomizer(1, address(noopRandomizer));
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            deployed.drops,
            POSTER,
            RECIPIENT,
            address(0),
            "data",
            1,
            0,
            17,
            18,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(deployed.drops, authorization);

        deployed.drops.mintDrop(authorization, "data", signature);

        uint256 tokenId = 1;
        deployed.core.retrieveTokenHash(tokenId).assertEq(bytes32(0), "noop hash changed");
        deployed.core.tokenURI(tokenId).assertEq("ipfs://base/pending", "pending URI changed");
    }

    function testSetTokenHashCurrentlyAllowsConfiguredRandomizerOnlyAndOnlyOnce() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        NoopRandomizer noopRandomizer = new NoopRandomizer();
        deployed.core.addRandomizer(1, address(noopRandomizer));
        uint256 tokenId = 1;
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            deployed.drops,
            POSTER,
            RECIPIENT,
            address(0),
            "data",
            1,
            0,
            19,
            20,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(deployed.drops, authorization);

        deployed.drops.mintDrop(authorization, "data", signature);
        deployed.core.retrieveTokenHash(tokenId).assertEq(bytes32(0), "noop hash changed");

        (bool nonRandomizerSuccess,) = address(deployed.core)
            .call(
                abi.encodeWithSelector(
                    deployed.core.setTokenHash.selector, uint256(1), tokenId, bytes32(uint256(1))
                )
            );
        nonRandomizerSuccess.assertFalse("non-randomizer set token hash");
        deployed.core.retrieveTokenHash(tokenId).assertEq(bytes32(0), "non-randomizer changed hash");

        deployed.core.addRandomizer(1, address(deployed.randomizer));
        deployed.randomizer.calculateTokenHash(1, tokenId, 123);
        bytes32 firstHash = deployed.core.retrieveTokenHash(tokenId);
        (firstHash == bytes32(0)).assertFalse("randomizer did not set hash");

        (bool secondSetSuccess,) = address(deployed.randomizer)
            .call(
                abi.encodeWithSelector(
                    deployed.randomizer.calculateTokenHash.selector,
                    uint256(1),
                    tokenId,
                    uint256(123)
                )
            );
        secondSetSuccess.assertFalse("token hash was overwritten");
        deployed.core.retrieveTokenHash(tokenId)
            .assertEq(firstHash, "hash changed after second set");
    }
}

contract AuthorizedDropExecutor {
    function mintFixedPrice(
        StreamDrops drops,
        StreamDrops.DropAuthorization calldata authorization,
        string calldata tokenData,
        bytes calldata signature
    ) external payable {
        drops.mintDrop{ value: msg.value }(authorization, tokenData, signature);
    }
}
