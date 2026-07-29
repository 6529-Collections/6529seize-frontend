// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/StreamDrops.sol";
import "../smart-contracts/StreamAdmins.sol";
import "./helpers/Assertions.sol";
import "./helpers/DropAuthTestHelper.sol";
import "./mocks/MockStreamMinter.sol";

contract StreamDropsEIP712Test is DropAuthTestHelper {
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    address private constant POSTER = address(0x1001);
    address private constant RECIPIENT = address(0x5005);
    address private constant PAYOUT = address(0x2002);
    address private constant CURATORS_POOL = address(0x3003);

    event DropAuthorizationConsumed(
        bytes32 indexed dropId,
        address indexed signer,
        address indexed poster,
        address recipient,
        address payer,
        uint256 collectionId,
        uint8 saleMode,
        bytes32 tokenDataHash,
        uint256 deadline,
        uint256 signerEpoch
    );
    event DropAuthorizationCancelled(bytes32 indexed dropId, address indexed admin);
    event SignerEpochChanged(uint256 indexed oldEpoch, uint256 indexed newEpoch);

    function deployDrops() private returns (StreamDrops drops) {
        MockStreamMinter minter = new MockStreamMinter();
        StreamAdmins admins = new StreamAdmins(address(this));
        drops = new StreamDrops(
            signerAddress(), address(minter), address(admins), PAYOUT, CURATORS_POOL
        );
        _grantSignerLifecycle(admins, drops, address(this));
    }

    function _grantSignerLifecycle(StreamAdmins admins, StreamDrops drops, address account)
        private
    {
        bytes4[] memory selectors = new bytes4[](3);
        selectors[0] = drops.updateTDHsigner.selector;
        selectors[1] = drops.incrementSignerEpoch.selector;
        selectors[2] = drops.cancelDrop.selector;
        admins.registerBatchSignerFunctionAdmin(account, address(drops), selectors, true);
    }

    function testHashDropAuthorizationMatchesExplicitEip712Encoding() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 1, 2, block.timestamp + 1 days
        );

        drops.hashDropAuthorization(authorization)
            .assertEq(explicitEip712Digest(drops, authorization), "digest mismatch");
    }

    function testValidEoaSignatureMintsAndConsumesDropId() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 1, 2, block.timestamp + 1 days
        );

        vm.expectEmit(true, true, true, true);
        emit DropAuthorizationConsumed(
            authorization.dropId,
            signerAddress(),
            POSTER,
            RECIPIENT,
            address(0),
            1,
            drops.SALE_MODE_FIXED_PRICE(),
            keccak256(bytes("data")),
            authorization.deadline,
            authorization.signerEpoch
        );
        drops.mintDrop(authorization, "data", signAuthorization(drops, authorization));

        drops.isDropConsumed(authorization.dropId).assertTrue("valid drop was not consumed");
        drops.retrieveDrops().length.assertEq(1, "valid drop was not recorded");
    }

    function testEip2098CompactSignatureMints() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 3, 4, block.timestamp + 1 days
        );

        drops.mintDrop(authorization, "data", signCompactAuthorization(drops, authorization));

        drops.isDropConsumed(authorization.dropId).assertTrue("compact signature was not consumed");
    }

    function testNullifierHashHelperBindsToAuthorizationSalt() public {
        StreamDrops drops = deployDrops();
        uint256 nonce = 45;
        bytes32 nullifierHash = keccak256(bytes("zk-nullifier"));
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops,
            POSTER,
            RECIPIENT,
            address(0),
            "data",
            1,
            0,
            nonce,
            uint256(nullifierHash),
            block.timestamp + 1 days
        );

        bytes32 expectedDropId = drops.deriveDropId(
            drops.tdhSigner(), authorization.signerEpoch, nonce, uint256(nullifierHash)
        );
        drops.deriveDropIdFromNullifierHash(
                drops.tdhSigner(), authorization.signerEpoch, nonce, nullifierHash
            ).assertEq(expectedDropId, "nullifier helper mismatch");
        drops.authorizationNullifierHash(authorization)
            .assertEq(nullifierHash, "authorization salt did not round-trip");
        authorization.dropId.assertEq(expectedDropId, "drop ID did not bind nullifier salt");
    }

    function testChangedNullifierSaltFailsDropIdValidation() public {
        StreamDrops drops = deployDrops();
        bytes32 nullifierHash = keccak256(bytes("zk-nullifier"));
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops,
            POSTER,
            RECIPIENT,
            address(0),
            "data",
            1,
            0,
            47,
            uint256(nullifierHash),
            block.timestamp + 1 days
        );
        authorization.salt = uint256(keccak256(bytes("other-nullifier")));
        bytes memory signature = signAuthorization(drops, authorization);

        (bool success,) = address(drops)
            .call(abi.encodeWithSelector(drops.mintDrop.selector, authorization, "data", signature));

        success.assertFalse("changed nullifier salt minted");
        drops.isDropConsumed(authorization.dropId)
            .assertFalse("changed nullifier salt consumed drop");
    }

    function testWrongSignerFails() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 5, 6, block.timestamp + 1 days
        );

        (bool success,) = address(drops)
            .call(
                abi.encodeWithSelector(
                    drops.mintDrop.selector,
                    authorization,
                    "data",
                    signAuthorizationWithKey(drops, authorization, OTHER_SIGNER_KEY)
                )
            );

        success.assertFalse("wrong signer minted");
        drops.isDropConsumed(authorization.dropId).assertFalse("wrong signer consumed drop");
    }

    function testWrongDomainVerifyingContractFails() public {
        StreamDrops drops = deployDrops();
        StreamDrops otherDrops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 7, 8, block.timestamp + 1 days
        );
        bytes memory wrongDomainSignature = signAuthorization(otherDrops, authorization);

        (bool success,) = address(drops)
            .call(
                abi.encodeWithSelector(
                    drops.mintDrop.selector, authorization, "data", wrongDomainSignature
                )
            );

        success.assertFalse("wrong verifying contract minted");
        drops.isDropConsumed(authorization.dropId).assertFalse("wrong domain consumed drop");
    }

    function testWrongChainIdFails() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 9, 10, block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(drops, authorization);
        vm.chainId(block.chainid + 1);

        (bool success,) = address(drops)
            .call(abi.encodeWithSelector(drops.mintDrop.selector, authorization, "data", signature));

        success.assertFalse("wrong chain id minted");
        drops.isDropConsumed(authorization.dropId).assertFalse("wrong chain consumed drop");
    }

    function testExpiredSignatureFails() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 11, 12, block.timestamp
        );
        bytes memory signature = signAuthorization(drops, authorization);
        vm.warp(block.timestamp + 1);

        (bool success,) = address(drops)
            .call(abi.encodeWithSelector(drops.mintDrop.selector, authorization, "data", signature));

        success.assertFalse("expired authorization minted");
        drops.isDropConsumed(authorization.dropId)
            .assertFalse("expired authorization consumed drop");
    }

    function testCancelledDropFails() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 13, 14, block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(drops, authorization);

        vm.expectEmit(true, true, false, true);
        emit DropAuthorizationCancelled(authorization.dropId, address(this));
        drops.cancelDrop(authorization.dropId);
        (bool success,) = address(drops)
            .call(abi.encodeWithSelector(drops.mintDrop.selector, authorization, "data", signature));

        success.assertFalse("cancelled drop minted");
        drops.isDropCancelled(authorization.dropId).assertTrue("drop not cancelled");
        drops.isDropConsumed(authorization.dropId).assertFalse("cancelled drop consumed");
    }

    function testDuplicateCancelDropFailsWithoutSecondEvent() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 33, 34, block.timestamp + 1 days
        );

        drops.cancelDrop(authorization.dropId);
        (bool success,) = address(drops)
            .call(abi.encodeWithSelector(drops.cancelDrop.selector, authorization.dropId));

        success.assertFalse("duplicate cancellation succeeded");
        drops.isDropCancelled(authorization.dropId).assertTrue("drop cancellation was removed");
    }

    function testStaleSignerEpochFailsAfterIncrement() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 15, 16, block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(drops, authorization);

        vm.expectEmit(true, true, false, true);
        emit SignerEpochChanged(1, 2);
        drops.incrementSignerEpoch();
        (bool success,) = address(drops)
            .call(abi.encodeWithSelector(drops.mintDrop.selector, authorization, "data", signature));

        success.assertFalse("stale epoch minted");
        drops.isDropConsumed(authorization.dropId).assertFalse("stale epoch consumed drop");
    }

    function testWrongDropIdFails() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 17, 18, block.timestamp + 1 days
        );
        authorization.dropId = bytes32(uint256(0xBADD1D));
        bytes memory signature = signAuthorization(drops, authorization);

        (bool success,) = address(drops)
            .call(abi.encodeWithSelector(drops.mintDrop.selector, authorization, "data", signature));

        success.assertFalse("wrong drop id minted");
        drops.isDropConsumed(authorization.dropId).assertFalse("wrong drop id consumed");
    }

    function testQuantityOtherThanOneFails() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 19, 20, block.timestamp + 1 days
        );
        authorization.quantity = 2;
        bytes memory signature = signAuthorization(drops, authorization);

        (bool success,) = address(drops)
            .call(abi.encodeWithSelector(drops.mintDrop.selector, authorization, "data", signature));

        success.assertFalse("quantity greater than one minted");
        drops.isDropConsumed(authorization.dropId).assertFalse("bad quantity consumed drop");
    }

    function testTokenDataSubstitutionFails() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops,
            POSTER,
            RECIPIENT,
            address(0),
            "signed-data",
            1,
            0,
            21,
            22,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(drops, authorization);

        (bool success,) = address(drops)
            .call(
                abi.encodeWithSelector(
                    drops.mintDrop.selector, authorization, "other-data", signature
                )
            );

        success.assertFalse("token data substitution minted");
        drops.isDropConsumed(authorization.dropId).assertFalse("token substitution consumed drop");
    }

    function testMalleableSignatureFails() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 23, 24, block.timestamp + 1 days
        );

        (bool success,) = address(drops)
            .call(
                abi.encodeWithSelector(
                    drops.mintDrop.selector,
                    authorization,
                    "data",
                    signMalleableAuthorization(drops, authorization)
                )
            );

        success.assertFalse("malleable signature minted");
        drops.isDropConsumed(authorization.dropId).assertFalse("malleable signature consumed drop");
    }

    function testInvalidZeroRecoveredSignerFails() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 25, 26, block.timestamp + 1 days
        );
        bytes memory invalidSignature = abi.encodePacked(bytes32(0), bytes32(0), uint8(27));

        (bool success,) = address(drops)
            .call(
                abi.encodeWithSelector(
                    drops.mintDrop.selector, authorization, "data", invalidSignature
                )
            );

        success.assertFalse("zero recovered signer minted");
        drops.isDropConsumed(authorization.dropId)
            .assertFalse("zero recovered signer consumed drop");
    }

    function testInvalidSignatureLengthFails() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 27, 28, block.timestamp + 1 days
        );

        (bool success,) = address(drops)
            .call(abi.encodeWithSelector(drops.mintDrop.selector, authorization, "data", hex"1234"));

        success.assertFalse("short signature minted");
        drops.isDropConsumed(authorization.dropId).assertFalse("short signature consumed drop");
    }

    function testPaidFixedPriceRequiresSignedPayerToBeSender() public {
        StreamDrops drops = deployDrops();
        vm.deal(address(this), 10 ether);
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops,
            POSTER,
            RECIPIENT,
            address(0xCAFE),
            "data",
            1,
            1 ether,
            29,
            30,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(drops, authorization);

        (bool success,) = address(drops).call{ value: 1 ether }(
            abi.encodeWithSelector(drops.mintDrop.selector, authorization, "data", signature)
        );

        success.assertFalse("wrong payer minted");
        drops.isDropConsumed(authorization.dropId).assertFalse("wrong payer consumed drop");
    }

    function testFreeFixedPriceRequiresZeroPayer() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops,
            POSTER,
            RECIPIENT,
            address(0xCAFE),
            "data",
            1,
            0,
            35,
            36,
            block.timestamp + 1 days
        );
        bytes memory signature = signAuthorization(drops, authorization);

        (bool success,) = address(drops)
            .call(abi.encodeWithSelector(drops.mintDrop.selector, authorization, "data", signature));

        success.assertFalse("free fixed-price drop accepted non-zero payer");
        drops.isDropConsumed(authorization.dropId).assertFalse("bad free payer consumed drop");
    }

    function testAuctionRequiresZeroPayer() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildAuctionAuthorization(
            drops,
            POSTER,
            address(0),
            "auction-data",
            7,
            5 ether,
            block.timestamp + 1 days,
            37,
            38,
            block.timestamp + 1 days
        );
        authorization.payer = address(0xCAFE);
        bytes memory signature = signAuthorization(drops, authorization);

        (bool success,) = address(drops)
            .call(
                abi.encodeWithSelector(
                    drops.mintDrop.selector, authorization, "auction-data", signature
                )
            );

        success.assertFalse("auction accepted non-zero payer");
        drops.isDropConsumed(authorization.dropId).assertFalse("bad auction payer consumed drop");
    }

    function testFixedPriceRejectsAuctionReservePrice() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 39, 40, block.timestamp + 1 days
        );
        authorization.auctionReservePrice = 1 ether;
        bytes memory signature = signAuthorization(drops, authorization);

        (bool success,) = address(drops)
            .call(abi.encodeWithSelector(drops.mintDrop.selector, authorization, "data", signature));

        success.assertFalse("fixed-price drop accepted auction reserve");
        drops.isDropConsumed(authorization.dropId)
            .assertFalse("fixed-price auction reserve consumed drop");
    }

    function testFixedPriceRejectsAuctionEndTime() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 41, 42, block.timestamp + 1 days
        );
        authorization.auctionEndTime = block.timestamp + 2 days;
        bytes memory signature = signAuthorization(drops, authorization);

        (bool success,) = address(drops)
            .call(abi.encodeWithSelector(drops.mintDrop.selector, authorization, "data", signature));

        success.assertFalse("fixed-price drop accepted auction end time");
        drops.isDropConsumed(authorization.dropId)
            .assertFalse("fixed-price auction end time consumed drop");
    }

    function testAuctionRejectsFixedPriceValue() public {
        StreamDrops drops = deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildAuctionAuthorization(
            drops,
            POSTER,
            address(0),
            "auction-data",
            7,
            5 ether,
            block.timestamp + 1 days,
            43,
            44,
            block.timestamp + 1 days
        );
        authorization.price = 1 ether;
        bytes memory signature = signAuthorization(drops, authorization);

        (bool success,) = address(drops)
            .call(
                abi.encodeWithSelector(
                    drops.mintDrop.selector, authorization, "auction-data", signature
                )
            );

        success.assertFalse("auction accepted fixed-price value");
        drops.isDropConsumed(authorization.dropId).assertFalse("bad auction price consumed drop");
    }

    function testContractWithoutErc1271ImplementationFailsClosed() public {
        MockStreamMinter minter = new MockStreamMinter();
        StreamAdmins admins = new StreamAdmins(address(this));
        ContractSignerStub contractSigner = new ContractSignerStub();
        StreamDrops drops = new StreamDrops(
            address(contractSigner), address(minter), address(admins), PAYOUT, CURATORS_POOL
        );
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 31, 32, block.timestamp + 1 days
        );
        bytes memory anySignature = signAuthorization(drops, authorization);

        (bool success,) = address(drops)
            .call(
                abi.encodeWithSelector(drops.mintDrop.selector, authorization, "data", anySignature)
            );

        success.assertFalse("contract without ERC1271 implementation minted");
        drops.isDropConsumed(authorization.dropId)
            .assertFalse("non-ERC1271 contract signer consumed drop");
    }

    function explicitEip712Digest(
        StreamDrops drops,
        StreamDrops.DropAuthorization memory authorization
    ) private view returns (bytes32) {
        bytes32 structHash;
        bytes32 typeHash = drops.DROP_AUTHORIZATION_TYPEHASH();
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, typeHash)
            mstore(add(ptr, 0x20), mload(authorization))
            mstore(add(ptr, 0x40), mload(add(authorization, 0x20)))
            mstore(add(ptr, 0x60), mload(add(authorization, 0x40)))
            mstore(add(ptr, 0x80), mload(add(authorization, 0x60)))
            mstore(add(ptr, 0xa0), mload(add(authorization, 0x80)))
            mstore(add(ptr, 0xc0), mload(add(authorization, 0xa0)))
            mstore(add(ptr, 0xe0), mload(add(authorization, 0xc0)))
            mstore(add(ptr, 0x100), mload(add(authorization, 0xe0)))
            mstore(add(ptr, 0x120), mload(add(authorization, 0x100)))
            mstore(add(ptr, 0x140), mload(add(authorization, 0x120)))
            mstore(add(ptr, 0x160), mload(add(authorization, 0x140)))
            mstore(add(ptr, 0x180), mload(add(authorization, 0x160)))
            mstore(add(ptr, 0x1a0), mload(add(authorization, 0x180)))
            mstore(add(ptr, 0x1c0), mload(add(authorization, 0x1a0)))
            mstore(add(ptr, 0x1e0), mload(add(authorization, 0x1c0)))
            structHash := keccak256(ptr, 0x200)
        }
        return keccak256(abi.encodePacked("\x19\x01", drops.domainSeparator(), structHash));
    }
}

contract ContractSignerStub { }
