// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/AuctionContract.sol";
import "../smart-contracts/StreamAdmins.sol";
import "../smart-contracts/StreamDrops.sol";
import "./helpers/Assertions.sol";
import "./helpers/DropAuthTestHelper.sol";
import "./helpers/StreamFixture.sol";
import "./mocks/MockStreamAuctions.sol";
import "./mocks/MockStreamMinter.sol";

contract StreamSafeERC1271ForkSmokeTest is DropAuthTestHelper, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    uint256 private constant FORK_CHAIN_ID = 1;
    uint256 private constant LOCAL_CHAIN_ID = 31_337;
    address private constant SAFE_OWNER_ONE = address(0xA001);
    address private constant SAFE_OWNER_TWO = address(0xA002);
    address private constant POSTER = address(0x1001);
    address private constant RECIPIENT = address(0x5005);
    address private constant PAYER = address(0x6006);
    address private constant PAYOUT = address(0x2002);
    address private constant CURATORS_POOL = address(0x3003);
    uint256 private constant FIXED_PRICE = 4 ether;
    bytes32 private constant SAFE_APPROVED_HASH_TAG = keccak256("6529Stream.SafeApprovedHash.v1");

    function testSafeApprovedHashFixedPriceSmokeOnForkChainId() public {
        vm.chainId(FORK_CHAIN_ID);
        (DeployedStream memory deployed, MockSafeERC1271Signer safeSigner) = deploySafeSignerStack();
        string memory tokenData = "safe-fixed-price";
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            deployed.drops,
            POSTER,
            RECIPIENT,
            PAYER,
            tokenData,
            1,
            FIXED_PRICE,
            10,
            20,
            block.timestamp + 1 days
        );
        bytes32 digest = deployed.drops.hashDropAuthorization(authorization);
        approveSafeDigest(safeSigner, digest);
        bytes memory signature = safeApprovedHashSignature(deployed.drops, authorization);

        vm.deal(PAYER, FIXED_PRICE);
        vm.prank(PAYER);
        deployed.drops.mintDrop{ value: FIXED_PRICE }(authorization, tokenData, signature);

        deployed.drops.isDropConsumed(authorization.dropId)
            .assertTrue("safe fixed drop not consumed");
        safeSigner.approvalCount(digest).assertEq(2, "safe threshold approvals");
        deployed.drops.retrieveDrops().length.assertEq(1, "safe drop not recorded");
        (, address signer, address poster, address executionAddress) =
            deployed.drops.retrieveDropInfo(authorization.dropId);
        signer.assertEq(address(safeSigner), "safe signer not stored");
        poster.assertEq(POSTER, "poster not stored");
        executionAddress.assertEq(RECIPIENT, "recipient not stored");
        uint256 tokenId = deployed.drops.retrieveTokenID(authorization.dropId);
        deployed.core.ownerOf(tokenId).assertEq(RECIPIENT, "safe fixed owner");
        deployed.core.retrieveTokenHash(tokenId)
            .assertEq(
                keccak256(abi.encode(uint256(1), tokenId, uint256(0))), "safe fixed token hash"
            );
    }

    function testSafeApprovedHashAuctionSmokeOnForkChainId() public {
        vm.chainId(FORK_CHAIN_ID);
        (DeployedStream memory deployed, MockSafeERC1271Signer safeSigner) = deploySafeSignerStack();
        StreamAuctions auctions = new StreamAuctions(
            address(deployed.minter),
            address(deployed.core),
            address(deployed.admins),
            address(deployed.drops),
            PAYOUT,
            CURATORS_POOL
        );
        deployed.drops.updateAuctionContract(address(auctions));
        string memory tokenData = "safe-auction";
        StreamDrops.DropAuthorization memory authorization = buildAuctionAuthorization(
            deployed.drops,
            POSTER,
            address(0),
            tokenData,
            1,
            5 ether,
            block.timestamp + 1 days,
            30,
            40,
            block.timestamp + 1 days
        );
        approveSafeDigest(safeSigner, deployed.drops.hashDropAuthorization(authorization));

        deployed.drops
            .mintDrop(
                authorization, tokenData, safeApprovedHashSignature(deployed.drops, authorization)
            );

        deployed.drops.isDropConsumed(authorization.dropId).assertTrue("safe auction not consumed");
        uint256 tokenId = deployed.drops.retrieveTokenID(authorization.dropId);
        deployed.core.ownerOf(tokenId).assertEq(address(auctions), "safe auction custody");
        deployed.drops.retrieveAuctionPoster(tokenId).assertEq(POSTER, "auction poster");
        deployed.drops.retrieveAuctionPrice(tokenId).assertEq(5 ether, "auction reserve");
        uint256(auctions.retrieveAuctionStatus(tokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.Active), "auction status");
    }

    function testSafeApprovedHashRequiresThreshold() public {
        vm.chainId(FORK_CHAIN_ID);
        (StreamDrops drops, MockSafeERC1271Signer safeSigner) = deployLightweightSafeSignerDrops();
        string memory tokenData = "safe-threshold";
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), tokenData, 1, 0, 50, 60, block.timestamp + 1 days
        );
        bytes32 digest = drops.hashDropAuthorization(authorization);
        vm.prank(SAFE_OWNER_ONE);
        safeSigner.approveHash(digest);

        expectBadContractSignature(
            drops, authorization, tokenData, safeApprovedHashSignature(drops, authorization)
        );

        drops.isDropConsumed(authorization.dropId).assertFalse("threshold failure consumed drop");
    }

    function testSafeApprovedHashFailsAfterChainSwitch() public {
        vm.chainId(FORK_CHAIN_ID);
        (StreamDrops drops, MockSafeERC1271Signer safeSigner) = deployLightweightSafeSignerDrops();
        string memory tokenData = "safe-chain";
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), tokenData, 1, 0, 70, 80, block.timestamp + 1 days
        );
        approveSafeDigest(safeSigner, drops.hashDropAuthorization(authorization));
        bytes memory forkSignature = safeApprovedHashSignature(drops, authorization);

        vm.chainId(LOCAL_CHAIN_ID);
        expectBadContractSignature(drops, authorization, tokenData, forkSignature);

        drops.isDropConsumed(authorization.dropId).assertFalse("wrong chain consumed drop");
    }

    function testSafeApprovedHashFailsForWrongVerifyingContract() public {
        vm.chainId(FORK_CHAIN_ID);
        (StreamDrops expectedDrops, MockSafeERC1271Signer safeSigner) =
            deployLightweightSafeSignerDrops();
        (StreamDrops otherDrops,) = deployLightweightSafeSignerDrops(safeSigner);
        string memory tokenData = "safe-contract";
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            expectedDrops,
            POSTER,
            RECIPIENT,
            address(0),
            tokenData,
            1,
            0,
            90,
            100,
            block.timestamp + 1 days
        );
        bytes32 expectedDigest = expectedDrops.hashDropAuthorization(authorization);
        bytes32 otherDigest = otherDrops.hashDropAuthorization(authorization);
        require(expectedDigest != otherDigest, "verifying contract did not affect digest");
        approveSafeDigest(safeSigner, expectedDigest);

        expectBadContractSignature(
            otherDrops,
            authorization,
            tokenData,
            safeApprovedHashSignature(expectedDrops, authorization)
        );

        otherDrops.isDropConsumed(authorization.dropId).assertFalse("wrong contract consumed drop");
    }

    function deploySafeSignerStack()
        private
        returns (DeployedStream memory deployed, MockSafeERC1271Signer safeSigner)
    {
        safeSigner = new MockSafeERC1271Signer(SAFE_OWNER_ONE, SAFE_OWNER_TWO, 2);
        deployed = deployStreamWithSigner(PAYOUT, CURATORS_POOL, address(safeSigner));
    }

    function deployLightweightSafeSignerDrops()
        private
        returns (StreamDrops drops, MockSafeERC1271Signer safeSigner)
    {
        safeSigner = new MockSafeERC1271Signer(SAFE_OWNER_ONE, SAFE_OWNER_TWO, 2);
        (drops,) = deployLightweightSafeSignerDrops(safeSigner);
    }

    function deployLightweightSafeSignerDrops(MockSafeERC1271Signer safeSigner)
        private
        returns (StreamDrops drops, MockStreamAuctions auctions)
    {
        MockStreamMinter minter = new MockStreamMinter();
        StreamAdmins admins = new StreamAdmins(address(this));
        drops = new StreamDrops(
            address(safeSigner), address(minter), address(admins), PAYOUT, CURATORS_POOL
        );
        auctions = new MockStreamAuctions();
        admins.registerFunctionAdmin(
            address(this), address(drops), drops.updateAuctionContract.selector, true
        );
        drops.updateAuctionContract(address(auctions));
    }

    function approveSafeDigest(MockSafeERC1271Signer safeSigner, bytes32 digest) private {
        vm.prank(SAFE_OWNER_ONE);
        safeSigner.approveHash(digest);
        vm.prank(SAFE_OWNER_TWO);
        safeSigner.approveHash(digest);
    }

    function safeApprovedHashSignature(
        StreamDrops drops,
        StreamDrops.DropAuthorization memory authorization
    ) private view returns (bytes memory) {
        return abi.encode(
            SAFE_APPROVED_HASH_TAG, block.chainid, address(drops), authorization.dropId
        );
    }

    function expectBadContractSignature(
        StreamDrops drops,
        StreamDrops.DropAuthorization memory authorization,
        string memory tokenData,
        bytes memory signature
    ) private {
        vm.expectRevert(bytes("Bad contract sig"));
        drops.mintDrop(authorization, tokenData, signature);
    }
}

contract MockSafeERC1271Signer {
    bytes4 private constant MAGIC_VALUE = 0x1626ba7e;
    bytes4 private constant INVALID_VALUE = 0xffffffff;
    bytes32 private constant SAFE_APPROVED_HASH_TAG = keccak256("6529Stream.SafeApprovedHash.v1");

    address private immutable ownerOne;
    address private immutable ownerTwo;
    uint256 public immutable threshold;
    mapping(bytes32 => mapping(address => bool)) private approvedHashes;

    constructor(address _ownerOne, address _ownerTwo, uint256 _threshold) {
        require(_ownerOne != address(0) && _ownerTwo != address(0), "zero owner");
        require(_ownerOne != _ownerTwo, "duplicate owner");
        require(_threshold == 1 || _threshold == 2, "bad threshold");
        ownerOne = _ownerOne;
        ownerTwo = _ownerTwo;
        threshold = _threshold;
    }

    function approveHash(bytes32 digest) external {
        require(msg.sender == ownerOne || msg.sender == ownerTwo, "not owner");
        approvedHashes[digest][msg.sender] = true;
    }

    function approvalCount(bytes32 digest) public view returns (uint256 count) {
        if (approvedHashes[digest][ownerOne]) {
            count++;
        }
        if (approvedHashes[digest][ownerTwo]) {
            count++;
        }
    }

    function isValidSignature(bytes32 digest, bytes calldata signature)
        external
        view
        returns (bytes4)
    {
        // Safe approved-hash validation keys off the digest approved in storage.
        // These extra fields are local smoke-test guardrails, not Safe signature encoding.
        (bytes32 tag, uint256 chainId, address verifyingContract, bytes32 dropId) =
            abi.decode(signature, (bytes32, uint256, address, bytes32));
        if (tag != SAFE_APPROVED_HASH_TAG) {
            return INVALID_VALUE;
        }
        if (chainId != block.chainid || verifyingContract != msg.sender || dropId == bytes32(0)) {
            return INVALID_VALUE;
        }
        if (approvalCount(digest) < threshold) {
            return INVALID_VALUE;
        }
        return MAGIC_VALUE;
    }
}
