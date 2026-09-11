// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/StreamDrops.sol";
import "../smart-contracts/StreamAdmins.sol";
import "./helpers/Assertions.sol";
import "./helpers/DropAuthTestHelper.sol";
import "./mocks/MockStreamAuctions.sol";
import "./mocks/MockStreamMinter.sol";

contract StreamDropsERC1271Test is DropAuthTestHelper {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for uint256;

    address private constant POSTER = address(0x1001);
    address private constant RECIPIENT = address(0x5005);
    address private constant PAYOUT = address(0x2002);
    address private constant CURATORS_POOL = address(0x3003);
    bytes private constant CONTRACT_SIGNATURE = hex"127165291271";

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

    function testValidContractSignatureMintsAndConsumesDropId() public {
        (StreamDrops drops, MockERC1271Signer contractSigner) = deployContractSignerDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 1, 2, block.timestamp + 1 days
        );
        authorize(contractSigner, drops, authorization, CONTRACT_SIGNATURE);

        vm.expectEmit(true, true, true, true);
        emit DropAuthorizationConsumed(
            authorization.dropId,
            address(contractSigner),
            POSTER,
            RECIPIENT,
            address(0),
            1,
            drops.SALE_MODE_FIXED_PRICE(),
            keccak256(bytes("data")),
            authorization.deadline,
            authorization.signerEpoch
        );
        drops.mintDrop(authorization, "data", CONTRACT_SIGNATURE);

        drops.isDropConsumed(authorization.dropId).assertTrue("contract drop was not consumed");
        drops.retrieveDrops().length.assertEq(1, "contract drop was not recorded");
        (, address signer,,) = drops.retrieveDropInfo(authorization.dropId);
        signer.assertEq(address(contractSigner), "contract signer not stored");
    }

    function testZkNullifierContractSignerMintsWhenNullifierMatchesSalt() public {
        (StreamDrops drops,) = deployNullifierSignerDrops();
        bytes32 nullifierHash = keccak256(bytes("zk-nullifier"));
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops,
            POSTER,
            RECIPIENT,
            address(0),
            "data",
            1,
            0,
            25,
            uint256(nullifierHash),
            block.timestamp + 1 days
        );

        drops.mintDrop(authorization, "data", proofSignature(drops, authorization, nullifierHash));

        drops.isDropConsumed(authorization.dropId)
            .assertTrue("nullifier-backed contract drop was not consumed");
    }

    function testZkNullifierContractSignerRejectsMismatchedNullifier() public {
        (StreamDrops drops,) = deployNullifierSignerDrops();
        bytes32 nullifierHash = keccak256(bytes("zk-nullifier"));
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops,
            POSTER,
            RECIPIENT,
            address(0),
            "data",
            1,
            0,
            27,
            uint256(nullifierHash),
            block.timestamp + 1 days
        );
        bytes memory mismatchedProof =
            proofSignature(drops, authorization, keccak256(bytes("wrong-nullifier")));

        bool success = callMint(drops, authorization, "data", mismatchedProof);

        success.assertFalse("mismatched nullifier proof minted");
        drops.isDropConsumed(authorization.dropId).assertFalse("mismatched nullifier consumed drop");
    }

    function testValidContractSignatureCreatesAuction() public {
        (StreamDrops drops, MockERC1271Signer contractSigner) = deployContractSignerDrops();
        StreamDrops.DropAuthorization memory authorization = buildAuctionAuthorization(
            drops,
            POSTER,
            address(0),
            "auction-data",
            7,
            5 ether,
            block.timestamp + 1 days,
            3,
            4,
            block.timestamp + 1 days
        );
        authorize(contractSigner, drops, authorization, CONTRACT_SIGNATURE);

        drops.mintDrop(authorization, "auction-data", CONTRACT_SIGNATURE);

        drops.isDropConsumed(authorization.dropId).assertTrue("contract auction was not consumed");
        uint256 tokenId = drops.retrieveTokenID(authorization.dropId);
        drops.retrieveAuctionPoster(tokenId).assertEq(POSTER, "auction poster mismatch");
        drops.retrieveAuctionPrice(tokenId).assertEq(5 ether, "auction reserve mismatch");
    }

    function testInvalidMagicValueFails() public {
        (StreamDrops drops, MockERC1271Signer contractSigner) = deployContractSignerDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 5, 6, block.timestamp + 1 days
        );
        contractSigner.configure(
            MockERC1271Signer.Mode.InvalidMagic,
            drops.hashDropAuthorization(authorization),
            CONTRACT_SIGNATURE
        );

        bool success = callMint(drops, authorization, "data", CONTRACT_SIGNATURE);

        success.assertFalse("invalid ERC1271 magic minted");
        drops.isDropConsumed(authorization.dropId).assertFalse("invalid magic consumed drop");
    }

    function testRevertedContractSignatureCheckFails() public {
        (StreamDrops drops, MockERC1271Signer contractSigner) = deployContractSignerDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 7, 8, block.timestamp + 1 days
        );
        contractSigner.configure(
            MockERC1271Signer.Mode.Revert,
            drops.hashDropAuthorization(authorization),
            CONTRACT_SIGNATURE
        );

        bool success = callMint(drops, authorization, "data", CONTRACT_SIGNATURE);

        success.assertFalse("reverted ERC1271 check minted");
        drops.isDropConsumed(authorization.dropId).assertFalse("reverted check consumed drop");
    }

    function testEmptyContractSignatureReturnFails() public {
        (StreamDrops drops, MockERC1271Signer contractSigner) = deployContractSignerDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 9, 10, block.timestamp + 1 days
        );
        contractSigner.configure(
            MockERC1271Signer.Mode.EmptyReturn,
            drops.hashDropAuthorization(authorization),
            CONTRACT_SIGNATURE
        );

        bool success = callMint(drops, authorization, "data", CONTRACT_SIGNATURE);

        success.assertFalse("empty ERC1271 return minted");
        drops.isDropConsumed(authorization.dropId).assertFalse("empty return consumed drop");
    }

    function testShortContractSignatureReturnFails() public {
        (StreamDrops drops, MockERC1271Signer contractSigner) = deployContractSignerDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 11, 12, block.timestamp + 1 days
        );
        contractSigner.configure(
            MockERC1271Signer.Mode.ShortReturn,
            drops.hashDropAuthorization(authorization),
            CONTRACT_SIGNATURE
        );

        bool success = callMint(drops, authorization, "data", CONTRACT_SIGNATURE);

        success.assertFalse("short ERC1271 return minted");
        drops.isDropConsumed(authorization.dropId).assertFalse("short return consumed drop");
    }

    function testExtraContractSignatureReturnFails() public {
        (StreamDrops drops, MockERC1271Signer contractSigner) = deployContractSignerDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 23, 24, block.timestamp + 1 days
        );
        contractSigner.configure(
            MockERC1271Signer.Mode.ExtraReturn,
            drops.hashDropAuthorization(authorization),
            CONTRACT_SIGNATURE
        );

        bool success = callMint(drops, authorization, "data", CONTRACT_SIGNATURE);

        success.assertFalse("extra ERC1271 return minted");
        drops.isDropConsumed(authorization.dropId).assertFalse("extra return consumed drop");
    }

    function testWrongContractDigestFails() public {
        (StreamDrops drops, MockERC1271Signer contractSigner) = deployContractSignerDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 13, 14, block.timestamp + 1 days
        );
        contractSigner.configure(
            MockERC1271Signer.Mode.Valid, bytes32(uint256(0xBAD)), CONTRACT_SIGNATURE
        );

        bool success = callMint(drops, authorization, "data", CONTRACT_SIGNATURE);

        success.assertFalse("wrong ERC1271 digest minted");
        drops.isDropConsumed(authorization.dropId).assertFalse("wrong digest consumed drop");
    }

    function testWrongContractSignatureBytesFail() public {
        (StreamDrops drops, MockERC1271Signer contractSigner) = deployContractSignerDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 15, 16, block.timestamp + 1 days
        );
        authorize(contractSigner, drops, authorization, CONTRACT_SIGNATURE);

        bool success = callMint(drops, authorization, "data", hex"BAD5");

        success.assertFalse("wrong ERC1271 signature bytes minted");
        drops.isDropConsumed(authorization.dropId).assertFalse("wrong signature consumed drop");
    }

    function testReplayedContractSignatureFails() public {
        (StreamDrops drops, MockERC1271Signer contractSigner) = deployContractSignerDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 17, 18, block.timestamp + 1 days
        );
        authorize(contractSigner, drops, authorization, CONTRACT_SIGNATURE);

        drops.mintDrop(authorization, "data", CONTRACT_SIGNATURE);
        bool success = callMint(drops, authorization, "data", CONTRACT_SIGNATURE);

        success.assertFalse("replayed ERC1271 signature minted");
        drops.isDropConsumed(authorization.dropId).assertTrue("replay cleared consumed state");
        drops.retrieveDrops().length.assertEq(1, "replay recorded another drop");
    }

    function testExpiredContractAuthorizationFails() public {
        (StreamDrops drops, MockERC1271Signer contractSigner) = deployContractSignerDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 19, 20, block.timestamp
        );
        authorize(contractSigner, drops, authorization, CONTRACT_SIGNATURE);
        vm.warp(block.timestamp + 1);

        bool success = callMint(drops, authorization, "data", CONTRACT_SIGNATURE);

        success.assertFalse("expired ERC1271 authorization minted");
        drops.isDropConsumed(authorization.dropId).assertFalse("expired contract auth consumed");
    }

    function testEoaSignaturePathStillMints() public {
        StreamDrops drops = deployEoaSignerDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 21, 22, block.timestamp + 1 days
        );

        drops.mintDrop(authorization, "data", signAuthorization(drops, authorization));

        drops.isDropConsumed(authorization.dropId).assertTrue("EOA drop was not consumed");
    }

    function deployContractSignerDrops()
        private
        returns (StreamDrops drops, MockERC1271Signer contractSigner)
    {
        MockStreamMinter minter = new MockStreamMinter();
        StreamAdmins admins = new StreamAdmins(address(this));
        contractSigner = new MockERC1271Signer();
        drops = new StreamDrops(
            address(contractSigner), address(minter), address(admins), PAYOUT, CURATORS_POOL
        );
        MockStreamAuctions auctions = new MockStreamAuctions();
        admins.registerFunctionAdmin(
            address(this), address(drops), drops.updateAuctionContract.selector, true
        );
        drops.updateAuctionContract(address(auctions));
    }

    function deployEoaSignerDrops() private returns (StreamDrops drops) {
        MockStreamMinter minter = new MockStreamMinter();
        StreamAdmins admins = new StreamAdmins(address(this));
        drops = new StreamDrops(
            signerAddress(), address(minter), address(admins), PAYOUT, CURATORS_POOL
        );
        MockStreamAuctions auctions = new MockStreamAuctions();
        admins.registerFunctionAdmin(
            address(this), address(drops), drops.updateAuctionContract.selector, true
        );
        drops.updateAuctionContract(address(auctions));
    }

    function deployNullifierSignerDrops()
        private
        returns (StreamDrops drops, MockNullifierERC1271Signer contractSigner)
    {
        MockStreamMinter minter = new MockStreamMinter();
        StreamAdmins admins = new StreamAdmins(address(this));
        contractSigner = new MockNullifierERC1271Signer();
        drops = new StreamDrops(
            address(contractSigner), address(minter), address(admins), PAYOUT, CURATORS_POOL
        );
    }

    function authorize(
        MockERC1271Signer contractSigner,
        StreamDrops drops,
        StreamDrops.DropAuthorization memory authorization,
        bytes memory signature
    ) private {
        contractSigner.configure(
            MockERC1271Signer.Mode.Valid, drops.hashDropAuthorization(authorization), signature
        );
    }

    function callMint(
        StreamDrops drops,
        StreamDrops.DropAuthorization memory authorization,
        string memory tokenData,
        bytes memory signature
    ) private returns (bool) {
        (bool success,) = address(drops)
            .call(
                abi.encodeWithSelector(drops.mintDrop.selector, authorization, tokenData, signature)
            );
        return success;
    }

    function proofSignature(
        StreamDrops drops,
        StreamDrops.DropAuthorization memory authorization,
        bytes32 nullifierHash
    ) private view returns (bytes memory) {
        return abi.encode(
            drops.hashDropAuthorization(authorization),
            nullifierHash,
            authorization.signerEpoch,
            authorization.nonce,
            authorization.dropId
        );
    }
}

contract MockERC1271Signer {
    bytes4 private constant MAGIC_VALUE = 0x1626ba7e;
    bytes4 private constant INVALID_VALUE = 0xffffffff;

    enum Mode {
        Valid,
        InvalidMagic,
        Revert,
        EmptyReturn,
        ShortReturn,
        ExtraReturn
    }

    bytes32 private expectedHash;
    bytes private expectedSignature;
    Mode private mode;

    function configure(Mode _mode, bytes32 _expectedHash, bytes calldata _expectedSignature)
        external
    {
        mode = _mode;
        expectedHash = _expectedHash;
        expectedSignature = _expectedSignature;
    }

    function isValidSignature(bytes32 _hash, bytes calldata _signature)
        external
        view
        returns (bytes4)
    {
        if (mode == Mode.Revert) {
            revert("mock revert");
        }
        if (mode == Mode.EmptyReturn) {
            assembly {
                return(0, 0)
            }
        }
        if (mode == Mode.ShortReturn) {
            assembly {
                mstore(0, shl(224, 0x1626ba7e))
                return(0, 4)
            }
        }
        if (mode == Mode.ExtraReturn) {
            assembly {
                mstore(0, shl(224, 0x1626ba7e))
                mstore(32, 0)
                return(0, 64)
            }
        }
        if (mode == Mode.InvalidMagic) {
            return INVALID_VALUE;
        }
        if (_hash == expectedHash && keccak256(_signature) == keccak256(expectedSignature)) {
            return MAGIC_VALUE;
        }
        return INVALID_VALUE;
    }
}

contract MockNullifierERC1271Signer {
    bytes4 private constant MAGIC_VALUE = 0x1626ba7e;
    bytes4 private constant INVALID_VALUE = 0xffffffff;
    bytes32 private constant DROP_ID_TYPEHASH =
        keccak256("DropId(address signer,uint256 signerEpoch,uint256 nonce,uint256 salt)");

    function isValidSignature(bytes32 _hash, bytes calldata _signature)
        external
        view
        returns (bytes4)
    {
        (
            bytes32 authorizedDigest,
            bytes32 nullifierHash,
            uint256 signerEpoch,
            uint256 nonce,
            bytes32 dropId
        ) = abi.decode(_signature, (bytes32, bytes32, uint256, uint256, bytes32));

        bytes32 expectedDropId = keccak256(
            abi.encode(DROP_ID_TYPEHASH, address(this), signerEpoch, nonce, uint256(nullifierHash))
        );
        if (_hash != authorizedDigest || dropId != expectedDropId) {
            return INVALID_VALUE;
        }

        return MAGIC_VALUE;
    }
}
