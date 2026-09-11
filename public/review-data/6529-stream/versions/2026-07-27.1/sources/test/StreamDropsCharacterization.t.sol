// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/StreamDrops.sol";
import "../smart-contracts/StreamAdmins.sol";
import "./helpers/Assertions.sol";
import "./helpers/DropAuthTestHelper.sol";
import "./mocks/MockStreamAuctions.sol";
import "./mocks/MockStreamMinter.sol";

contract StreamDropsCharacterizationTest is DropAuthTestHelper {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for string;
    using Assertions for uint256;

    address private constant POSTER = address(0x1001);
    address private constant RECIPIENT = address(0x5005);
    address private constant PAYOUT = address(0x2002);
    address private constant CURATORS_POOL = address(0x3003);

    function deployDrops() private returns (StreamDrops drops, MockStreamMinter minter) {
        minter = new MockStreamMinter();
        StreamAdmins admins = new StreamAdmins(address(this));
        drops = new StreamDrops(
            signerAddress(), address(minter), address(admins), PAYOUT, CURATORS_POOL
        );
    }

    function deployDropsWithAuction()
        private
        returns (StreamDrops drops, MockStreamMinter minter, MockStreamAuctions auctions)
    {
        minter = new MockStreamMinter();
        StreamAdmins admins = new StreamAdmins(address(this));
        drops = new StreamDrops(
            signerAddress(), address(minter), address(admins), PAYOUT, CURATORS_POOL
        );
        auctions = new MockStreamAuctions();
        admins.registerFunctionAdmin(
            address(this), address(drops), drops.updateAuctionContract.selector, true
        );
        drops.updateAuctionContract(address(auctions));
    }

    function testDomainSeparatorUsesEip712Fields() public {
        (StreamDrops drops,) = deployDrops();

        bytes32 expectedDomainSeparator = keccak256(
            abi.encode(
                drops.EIP712_DOMAIN_TYPEHASH(),
                keccak256(bytes(drops.EIP712_NAME())),
                keccak256(bytes(drops.EIP712_VERSION())),
                block.chainid,
                address(drops)
            )
        );

        drops.domainSeparator().assertEq(expectedDomainSeparator, "domain separator changed");
    }

    function testDerivedDropIdUsesSignerEpochNonceAndSalt() public {
        (StreamDrops drops,) = deployDrops();

        bytes32 expectedDropId =
            keccak256(abi.encode(drops.DROP_ID_TYPEHASH(), signerAddress(), uint256(1), 42, 99));

        drops.deriveDropId(signerAddress(), 1, 42, 99).assertEq(expectedDropId, "drop id changed");
    }

    function testFixedPriceDropRecordsExplicitRecipientAndExecutionAddress() public {
        (StreamDrops drops, MockStreamMinter minter) = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 1, 2, block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(drops, authorization);

        drops.mintDrop(authorization, "data", signature);

        uint256 tokenId = 1_000_000_000;
        bytes32[] memory allDrops = drops.retrieveDrops();
        allDrops.length.assertEq(1, "drop count changed");
        allDrops[0].assertEq(authorization.dropId, "stored drop id changed");
        drops.retrieveDropID(tokenId).assertEq(authorization.dropId, "token drop id changed");
        drops.retrieveTokenID(authorization.dropId).assertEq(tokenId, "drop token id changed");
        drops.retrieveExecutionAddress(tokenId).assertEq(RECIPIENT, "execution address changed");
        drops.isDropConsumed(authorization.dropId).assertTrue("drop not consumed");
        minter.lastRecipient().assertEq(RECIPIENT, "fixed-price recipient changed");
        minter.lastTokenData().assertEq("data", "token data changed");
        minter.lastMintBatchLength().assertEq(1, "mint batch length changed");
        minter.lastTotalNumberOfTokens().assertEq(1, "mint token count changed");

        (uint256 storedTokenId, address signer, address poster, address execution) =
            drops.retrieveDropInfo(authorization.dropId);
        storedTokenId.assertEq(tokenId, "drop info token id changed");
        signer.assertEq(signerAddress(), "drop signer changed");
        poster.assertEq(POSTER, "drop poster changed");
        execution.assertEq(RECIPIENT, "drop execution changed");
    }

    function testFixedPriceDropRejectsZeroRecipient() public {
        (StreamDrops drops,) = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, address(0), address(0), "data", 1, 0, 3, 4, block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(drops, authorization);

        (bool success,) = address(drops)
            .call(abi.encodeWithSelector(drops.mintDrop.selector, authorization, "data", signature));

        success.assertFalse("zero recipient minted fixed-price drop");
        drops.retrieveDrops().length.assertEq(0, "zero recipient recorded drop");
        drops.isDropConsumed(authorization.dropId).assertFalse("zero recipient consumed drop");
    }

    function testFixedPriceDropRejectsZeroPoster() public {
        (StreamDrops drops,) = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, address(0), RECIPIENT, address(0), "data", 1, 0, 5, 6, block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(drops, authorization);

        (bool success,) = address(drops)
            .call(abi.encodeWithSelector(drops.mintDrop.selector, authorization, "data", signature));

        success.assertFalse("zero poster minted fixed-price drop");
        drops.retrieveDrops().length.assertEq(0, "zero poster recorded fixed-price drop");
        drops.isDropConsumed(authorization.dropId).assertFalse("zero poster consumed drop");
    }

    function testDropIdReplayIsRejectedAfterFirstExecution() public {
        (StreamDrops drops,) = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 7, 8, block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(drops, authorization);

        drops.mintDrop(authorization, "data", signature);
        (bool success,) = address(drops)
            .call(abi.encodeWithSelector(drops.mintDrop.selector, authorization, "data", signature));

        success.assertFalse("drop replay succeeded");
        drops.retrieveDrops().length.assertEq(1, "replay changed drop count");
    }

    function testAuctionDropRequiresConfiguredAuctionContract() public {
        (StreamDrops drops, MockStreamMinter minter) = deployDrops();
        uint256 auctionEndTime = block.timestamp + 1 days;
        StreamDrops.DropAuthorization memory authorization = buildAuctionAuthorization(
            drops,
            POSTER,
            address(0),
            "auction-data",
            7,
            5 ether,
            auctionEndTime,
            9,
            10,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(drops, authorization);

        (bool success,) = address(drops)
            .call(
                abi.encodeWithSelector(
                    drops.mintDrop.selector, authorization, "auction-data", signature
                )
            );

        success.assertFalse("auction minted without configured escrow");
        minter.lastAuctionRecipient().assertEq(address(0), "auction mint was attempted");
    }

    function testUpdateAuctionContractRejectsNonAuctionContract() public {
        MockStreamMinter minter = new MockStreamMinter();
        StreamAdmins admins = new StreamAdmins(address(this));
        StreamDrops drops = new StreamDrops(
            signerAddress(), address(minter), address(admins), PAYOUT, CURATORS_POOL
        );
        admins.registerFunctionAdmin(
            address(this), address(drops), drops.updateAuctionContract.selector, true
        );

        (bool success,) = address(drops)
            .call(abi.encodeWithSelector(drops.updateAuctionContract.selector, address(minter)));

        success.assertFalse("non-auction contract accepted");
        drops.auctionContract().assertEq(address(0), "auction contract changed");
    }

    function testAuctionDropMintsCustodyToAuctionContractAndRegistersState() public {
        (StreamDrops drops, MockStreamMinter minter, MockStreamAuctions auctions) =
            deployDropsWithAuction();
        uint256 auctionEndTime = block.timestamp + 1 days;
        StreamDrops.DropAuthorization memory authorization = buildAuctionAuthorization(
            drops,
            POSTER,
            address(0),
            "auction-data",
            7,
            5 ether,
            auctionEndTime,
            9,
            10,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(drops, authorization);

        drops.mintDrop(authorization, "auction-data", signature);

        uint256 tokenId = 1_000_000_000;
        minter.lastAuctionRecipient().assertEq(address(auctions), "auction custody changed");
        minter.lastAuctionTokenData().assertEq("auction-data", "auction token data changed");
        minter.lastAuctionCollectionId().assertEq(7, "auction collection changed");
        minter.lastAuctionEndTime().assertEq(auctionEndTime, "auction end time changed");
        auctions.lastDropId().assertEq(authorization.dropId, "registered drop id changed");
        auctions.lastTokenId().assertEq(tokenId, "registered token id changed");
        auctions.lastCollectionId().assertEq(7, "registered collection changed");
        auctions.lastPoster().assertEq(POSTER, "registered poster changed");
        auctions.lastReservePrice().assertEq(5 ether, "registered reserve changed");
        auctions.lastAuctionEndTime().assertEq(auctionEndTime, "registered end changed");
        drops.retrieveAuctionPoster(tokenId).assertEq(POSTER, "auction poster changed");
        drops.retrieveAuctionPrice(tokenId).assertEq(5 ether, "auction starting price changed");
        drops.retrieveDropID(tokenId).assertEq(authorization.dropId, "auction drop id changed");
        drops.retrieveExecutionAddress(tokenId).assertEq(POSTER, "auction execution changed");
    }

    function testAuctionDropRejectsNonZeroRecipient() public {
        (StreamDrops drops,) = deployDrops();
        uint256 auctionEndTime = block.timestamp + 1 days;
        StreamDrops.DropAuthorization memory authorization = buildAuctionAuthorization(
            drops,
            POSTER,
            RECIPIENT,
            "auction-data",
            7,
            5 ether,
            auctionEndTime,
            11,
            12,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(drops, authorization);

        (bool success,) = address(drops)
            .call(
                abi.encodeWithSelector(
                    drops.mintDrop.selector, authorization, "auction-data", signature
                )
            );

        success.assertFalse("non-zero auction recipient minted");
        drops.retrieveDrops().length.assertEq(0, "non-zero auction recipient recorded drop");
    }

    function testAuctionDropRejectsZeroPoster() public {
        (StreamDrops drops,) = deployDrops();
        uint256 auctionEndTime = block.timestamp + 1 days;
        StreamDrops.DropAuthorization memory authorization = buildAuctionAuthorization(
            drops,
            address(0),
            address(0),
            "auction-data",
            7,
            5 ether,
            auctionEndTime,
            13,
            14,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(drops, authorization);

        (bool success,) = address(drops)
            .call(
                abi.encodeWithSelector(
                    drops.mintDrop.selector, authorization, "auction-data", signature
                )
            );

        success.assertFalse("zero poster minted auction drop");
        drops.retrieveDrops().length.assertEq(0, "zero poster recorded auction drop");
    }
}
