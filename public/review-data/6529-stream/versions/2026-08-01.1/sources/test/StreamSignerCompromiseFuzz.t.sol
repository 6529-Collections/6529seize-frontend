// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/AuctionContract.sol";
import "../smart-contracts/StreamDrops.sol";
import "../smart-contracts/StreamPauseDomains.sol";
import "./helpers/Assertions.sol";
import "./helpers/ProtocolStateMachine.sol";

contract StreamSignerCompromiseFuzzTest is ProtocolStateMachine {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

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
    event DropSignerChanged(
        address indexed oldSigner, address indexed newSigner, uint256 indexed signerEpoch
    );

    struct MutationSnapshot {
        uint256 totalSupply;
        uint256 dropCount;
        uint256 dropsOwed;
        uint256 dropsBalance;
        uint256 auctionOwed;
        uint256 auctionBalance;
    }

    function setUp() public {
        _deployProtocolStateMachine();
    }

    function testSignerCompromisePauseRotateCancelAndRecoverySequence() public {
        uint256 startingSupply = protocolDeployed.core.totalSupply();

        StreamDrops.DropAuthorization memory compromised = _buildFreeFixedPriceAuthorization(
            "compromised-fixed-before-rotation", block.timestamp + 2 days, 101
        );
        bytes memory compromisedSignature = signAuthorization(protocolDeployed.drops, compromised);

        _setProtocolPaused(StreamPauseDomains.DROP_EXECUTION, true);
        _assertMintFailsWithoutMutation(
            compromised,
            "compromised-fixed-before-rotation",
            compromisedSignature,
            "Drop paused",
            false
        );
        _setProtocolPaused(StreamPauseDomains.DROP_EXECUTION, false);

        vm.expectEmit(true, true, false, true);
        emit SignerEpochChanged(1, 2);
        vm.expectEmit(true, true, true, true);
        emit DropSignerChanged(signerAddress(), otherSignerAddress(), 2);
        protocolDeployed.drops.updateTDHsigner(otherSignerAddress());
        protocolModel.signerRotated = true;

        _assertMintFailsWithoutMutation(
            compromised,
            "compromised-fixed-before-rotation",
            compromisedSignature,
            "Wrong signer",
            false
        );

        StreamDrops.DropAuthorization memory staleEpoch = _buildFreeFixedPriceAuthorization(
            "current-signer-before-epoch-invalidation", block.timestamp + 2 days, 202
        );
        bytes memory staleEpochSignature =
            signAuthorizationWithKey(protocolDeployed.drops, staleEpoch, OTHER_SIGNER_KEY);
        vm.expectEmit(true, true, false, true);
        emit SignerEpochChanged(2, 3);
        protocolDeployed.drops.incrementSignerEpoch();
        _assertMintFailsWithoutMutation(
            staleEpoch,
            "current-signer-before-epoch-invalidation",
            staleEpochSignature,
            "Bad epoch",
            false
        );

        StreamDrops.DropAuthorization memory cancellable = _buildFreeFixedPriceAuthorization(
            "cancelled-current-signer-before-execution", block.timestamp + 2 days, 303
        );
        bytes memory cancellableSignature =
            signAuthorizationWithKey(protocolDeployed.drops, cancellable, OTHER_SIGNER_KEY);
        vm.expectEmit(true, true, false, true);
        emit DropAuthorizationCancelled(cancellable.dropId, address(this));
        protocolDeployed.drops.cancelDrop(cancellable.dropId);
        _assertMintFailsWithoutMutation(
            cancellable,
            "cancelled-current-signer-before-execution",
            cancellableSignature,
            "Drop cancelled",
            true
        );

        StreamDrops.DropAuthorization memory recovered = _buildFreeFixedPriceAuthorization(
            "recovered-fixed-after-compromise", block.timestamp + 2 days, 404
        );
        bytes memory recoveredSignature =
            signAuthorizationWithKey(protocolDeployed.drops, recovered, OTHER_SIGNER_KEY);
        vm.expectEmit(true, true, true, true);
        emit DropAuthorizationConsumed(
            recovered.dropId,
            otherSignerAddress(),
            PROTOCOL_POSTER,
            PROTOCOL_RECIPIENT,
            address(0),
            PROTOCOL_COLLECTION_ID,
            protocolDeployed.drops.SALE_MODE_FIXED_PRICE(),
            recovered.tokenDataHash,
            recovered.deadline,
            recovered.signerEpoch
        );
        protocolDeployed.drops
            .mintDrop(recovered, "recovered-fixed-after-compromise", recoveredSignature);
        uint256 recoveredTokenId = protocolDeployed.drops.retrieveTokenID(recovered.dropId);
        protocolDeployed.core.ownerOf(recoveredTokenId)
            .assertEq(PROTOCOL_RECIPIENT, "recovered fixed owner");
        protocolDeployed.drops.isDropConsumed(recovered.dropId)
            .assertTrue("recovered fixed not consumed");
        protocolDeployed.core.totalSupply().assertEq(startingSupply + 1, "fixed supply");

        _assertReplayAndConsumedCancelFail(
            recovered, "recovered-fixed-after-compromise", recoveredSignature
        );

        StreamDrops.DropAuthorization memory recoveredAuction = _buildAuctionAuthorization(
            "recovered-auction-after-compromise",
            5 ether,
            block.timestamp + PROTOCOL_AUCTION_DURATION,
            block.timestamp + 2 days,
            505
        );
        bytes memory recoveredAuctionSignature =
            signAuthorizationWithKey(protocolDeployed.drops, recoveredAuction, OTHER_SIGNER_KEY);
        protocolDeployed.drops
            .mintDrop(
                recoveredAuction, "recovered-auction-after-compromise", recoveredAuctionSignature
            );
        uint256 auctionTokenId = protocolDeployed.drops.retrieveTokenID(recoveredAuction.dropId);
        protocolDeployed.core.ownerOf(auctionTokenId)
            .assertEq(address(protocolAuctions), "recovered auction custody");
        uint256(protocolAuctions.retrieveAuctionStatus(auctionTokenId))
            .assertEq(uint256(StreamAuctions.AuctionStatus.Active), "recovered auction active");
        protocolDeployed.core.totalSupply().assertEq(startingSupply + 2, "auction supply");
        protocolDeployed.drops.isDropConsumed(recoveredAuction.dropId)
            .assertTrue("recovered auction not consumed");
        _assertProtocolAccountingCoversOwed();
    }

    function testFuzzSignerCompromiseInvalidActionsDoNotMutateState(
        uint8 rawScenario,
        uint64 rawDeadlineOffset,
        uint256 rawSalt
    ) public {
        uint8 scenario = rawScenario % 64;
        bool auctionMode = scenario & 1 != 0;
        string memory tokenData = auctionMode ? "fuzz-compromise-auction" : "fuzz-compromise-fixed";
        uint256 deadline = scenario & 32 != 0
            ? block.timestamp
            : block.timestamp + 1 + (rawDeadlineOffset % 2 days);
        uint256 salt = uint256(keccak256(abi.encode(rawSalt, scenario, rawDeadlineOffset)));

        StreamDrops.DropAuthorization memory authorization;
        if (auctionMode) {
            authorization = _buildAuctionAuthorization(
                tokenData, 5 ether, block.timestamp + PROTOCOL_AUCTION_DURATION, deadline, salt
            );
        } else {
            authorization = _buildFreeFixedPriceAuthorization(tokenData, deadline, salt);
        }
        bytes memory signature = signAuthorization(protocolDeployed.drops, authorization);

        _exerciseFuzzScenario(authorization, tokenData, signature, scenario, deadline);
    }

    function _exerciseFuzzScenario(
        StreamDrops.DropAuthorization memory authorization,
        string memory tokenData,
        bytes memory signature,
        uint8 scenario,
        uint256 deadline
    ) private {
        _applyCompromisePreconditions(authorization.dropId, scenario, deadline);

        MutationSnapshot memory beforeAttempt = _snapshotMutationState();
        (bool success, bytes memory returnData) = _callMintDrop(authorization, tokenData, signature);

        if (_scenarioShouldSucceed(scenario)) {
            success.assertTrue("valid compromise scenario failed");
            _assertSuccessfulMintState(
                authorization, scenario & 1 != 0, beforeAttempt.totalSupply + 1
            );
            _assertReplayAndConsumedCancelFail(authorization, tokenData, signature);
        } else {
            _assertRevertedWithMessage(success, returnData, _expectedInvalidMessage(scenario));
            _assertNoInvalidExecutionMutation(authorization, beforeAttempt, scenario & 2 != 0);
        }
    }

    function _applyCompromisePreconditions(bytes32 dropId, uint8 scenario, uint256 deadline)
        private
    {
        if (scenario & 2 != 0) {
            protocolDeployed.drops.cancelDrop(dropId);
        }
        if (scenario & 4 != 0) {
            _setProtocolPaused(StreamPauseDomains.DROP_EXECUTION, true);
        }
        if (scenario & 8 != 0) {
            protocolDeployed.drops.updateTDHsigner(otherSignerAddress());
            protocolModel.signerRotated = true;
        }
        if (scenario & 16 != 0) {
            protocolDeployed.drops.incrementSignerEpoch();
        }
        if (scenario & 32 != 0) {
            vm.warp(deadline + 1);
        }
    }

    function _scenarioShouldSucceed(uint8 scenario) private pure returns (bool) {
        return (scenario & 62) == 0;
    }

    function _buildFreeFixedPriceAuthorization(
        string memory tokenData,
        uint256 deadline,
        uint256 salt
    ) private returns (StreamDrops.DropAuthorization memory authorization) {
        uint256 nonce = _nextProtocolNonce();
        authorization = buildFixedPriceAuthorization(
            protocolDeployed.drops,
            PROTOCOL_POSTER,
            PROTOCOL_RECIPIENT,
            address(0),
            tokenData,
            PROTOCOL_COLLECTION_ID,
            0,
            nonce,
            salt,
            deadline
        );
    }

    function _buildAuctionAuthorization(
        string memory tokenData,
        uint256 reservePrice,
        uint256 auctionEndTime,
        uint256 deadline,
        uint256 salt
    ) private returns (StreamDrops.DropAuthorization memory authorization) {
        uint256 nonce = _nextProtocolNonce();
        authorization = buildAuctionAuthorization(
            protocolDeployed.drops,
            PROTOCOL_POSTER,
            address(0),
            tokenData,
            PROTOCOL_COLLECTION_ID,
            reservePrice,
            auctionEndTime,
            nonce,
            salt,
            deadline
        );
    }

    function _nextProtocolNonce() private returns (uint256 nonce) {
        nonce = protocolModel.nextNonce;
        protocolModel.nextNonce++;
    }

    function _snapshotMutationState() private view returns (MutationSnapshot memory snapshot) {
        snapshot = MutationSnapshot({
            totalSupply: protocolDeployed.core.totalSupply(),
            dropCount: protocolDeployed.drops.retrieveDrops().length,
            dropsOwed: protocolDeployed.drops.totalOwed(),
            dropsBalance: address(protocolDeployed.drops).balance,
            auctionOwed: protocolAuctions.totalOwed(),
            auctionBalance: address(protocolAuctions).balance
        });
    }

    function _assertMintFailsWithoutMutation(
        StreamDrops.DropAuthorization memory authorization,
        string memory tokenData,
        bytes memory signature,
        string memory expectedRevert,
        bool expectedCancelled
    ) private {
        MutationSnapshot memory beforeAttempt = _snapshotMutationState();
        (bool success, bytes memory returnData) = _callMintDrop(authorization, tokenData, signature);
        _assertRevertedWithMessage(success, returnData, expectedRevert);
        _assertNoInvalidExecutionMutation(authorization, beforeAttempt, expectedCancelled);
    }

    function _assertNoInvalidExecutionMutation(
        StreamDrops.DropAuthorization memory authorization,
        MutationSnapshot memory beforeAttempt,
        bool expectedCancelled
    ) private view {
        protocolDeployed.core.totalSupply().assertEq(beforeAttempt.totalSupply, "supply mutated");
        protocolDeployed.drops.retrieveDrops().length
            .assertEq(beforeAttempt.dropCount, "drop count");
        protocolDeployed.drops.isDropConsumed(authorization.dropId)
            .assertFalse("invalid drop consumed");
        if (expectedCancelled) {
            protocolDeployed.drops.isDropCancelled(authorization.dropId)
                .assertTrue("cancelled flag missing");
        } else {
            protocolDeployed.drops.isDropCancelled(authorization.dropId)
                .assertFalse("unexpected cancellation");
        }
        protocolDeployed.drops.retrieveTokenID(authorization.dropId).assertEq(0, "invalid token id");
        protocolDeployed.drops.totalOwed().assertEq(beforeAttempt.dropsOwed, "drops owed");
        address(protocolDeployed.drops).balance
            .assertEq(beforeAttempt.dropsBalance, "drops balance");
        protocolAuctions.totalOwed().assertEq(beforeAttempt.auctionOwed, "auction owed");
        address(protocolAuctions).balance.assertEq(beforeAttempt.auctionBalance, "auction balance");
        uint256(protocolAuctions.retrieveAuctionStatus(0))
            .assertEq(uint256(StreamAuctions.AuctionStatus.None), "auction created");
        _assertProtocolAccountingCoversOwed();
    }

    function _assertSuccessfulMintState(
        StreamDrops.DropAuthorization memory authorization,
        bool auctionMode,
        uint256 expectedSupply
    ) private view {
        protocolDeployed.drops.isDropConsumed(authorization.dropId)
            .assertTrue("successful drop not consumed");
        protocolDeployed.drops.isDropCancelled(authorization.dropId)
            .assertFalse("successful drop cancelled");
        protocolDeployed.core.totalSupply().assertEq(expectedSupply, "successful supply");
        uint256 tokenId = protocolDeployed.drops.retrieveTokenID(authorization.dropId);
        if (auctionMode) {
            protocolDeployed.core.ownerOf(tokenId)
                .assertEq(address(protocolAuctions), "auction owner");
            uint256(protocolAuctions.retrieveAuctionStatus(tokenId))
                .assertEq(uint256(StreamAuctions.AuctionStatus.Active), "auction status");
        } else {
            protocolDeployed.core.ownerOf(tokenId).assertEq(PROTOCOL_RECIPIENT, "fixed owner");
        }
        _assertProtocolAccountingCoversOwed();
    }

    function _assertReplayAndConsumedCancelFail(
        StreamDrops.DropAuthorization memory authorization,
        string memory tokenData,
        bytes memory signature
    ) private {
        uint256 supplyAfterMint = protocolDeployed.core.totalSupply();
        (bool replaySuccess, bytes memory replayReturnData) =
            _callMintDrop(authorization, tokenData, signature);
        _assertRevertedWithMessage(replaySuccess, replayReturnData, "Drop Executed");
        protocolDeployed.core.totalSupply().assertEq(supplyAfterMint, "replay minted");

        (bool cancelSuccess, bytes memory cancelReturnData) = address(protocolDeployed.drops)
            .call(
                abi.encodeWithSelector(
                    protocolDeployed.drops.cancelDrop.selector, authorization.dropId
                )
            );
        _assertRevertedWithMessage(cancelSuccess, cancelReturnData, "Drop consumed");
        protocolDeployed.drops.isDropConsumed(authorization.dropId)
            .assertTrue("consumed flag changed");
        protocolDeployed.drops.isDropCancelled(authorization.dropId)
            .assertFalse("consumed drop cancelled");
    }

    function _expectedInvalidMessage(uint8 scenario) private pure returns (string memory) {
        if (scenario & 4 != 0) {
            return "Drop paused";
        }
        if (scenario & 8 != 0) {
            return "Wrong signer";
        }
        if (scenario & 16 != 0) {
            return "Bad epoch";
        }
        if (scenario & 32 != 0) {
            return "Expired";
        }
        if (scenario & 2 != 0) {
            return "Drop cancelled";
        }
        return "";
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
