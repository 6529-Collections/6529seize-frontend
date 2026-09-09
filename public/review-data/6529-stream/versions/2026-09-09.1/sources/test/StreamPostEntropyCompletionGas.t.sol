// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./helpers/StreamPostEntropyCompletionGasHarness.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";

contract StreamPostEntropyCompletionGasTest is CharacterizationTestBase {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for uint256;

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant TOKEN_ID = 1;
    uint256 private constant REGISTRATION_GAS_LIMIT = 120_000;
    bytes32 private constant MINT_COMMITMENT = keccak256("issue-672-mint-commitment");
    address private constant EOA_RECIPIENT = address(0x672);

    StreamPostEntropyCompletionGasHarness private harness;
    StreamNoopEntropyCoordinator private noopCoordinator;

    function setUp() public {
        harness = new StreamPostEntropyCompletionGasHarness();
        noopCoordinator = new StreamNoopEntropyCoordinator();
    }

    function testPlanningPredicateRejectsJustBelowFormulaResult() public view {
        uint256 lowerBound = harness.planningParentGasLowerBound(REGISTRATION_GAS_LIMIT);
        harness.satisfiesPlanningParentGasLowerBound(lowerBound - 1, REGISTRATION_GAS_LIMIT)
            .assertFalse("just-below planning lower bound admitted");
    }

    function testPlanningPredicateAcceptsAtFormulaResult() public view {
        uint256 lowerBound = harness.planningParentGasLowerBound(REGISTRATION_GAS_LIMIT);
        harness.satisfiesPlanningParentGasLowerBound(lowerBound, REGISTRATION_GAS_LIMIT)
            .assertTrue("planning lower bound rejected");
    }

    function testPlanningPredicateAcceptsJustAboveFormulaResult() public view {
        uint256 lowerBound = harness.planningParentGasLowerBound(REGISTRATION_GAS_LIMIT);
        harness.satisfiesPlanningParentGasLowerBound(lowerBound + 1, REGISTRATION_GAS_LIMIT)
            .assertTrue("just-above planning lower bound rejected");
    }

    function testPlanningFormulaUsesCeilingEip150Retention() public view {
        uint256 expectedForwardingRequirement =
            REGISTRATION_GAS_LIMIT + (REGISTRATION_GAS_LIMIT + 62) / 63;
        harness.planningParentGasLowerBound(REGISTRATION_GAS_LIMIT)
            .assertEq(
                expectedForwardingRequirement + harness.POST_ENTROPY_PARENT_RESERVE(),
                "EIP-150 ceiling formula"
            );
    }

    function testPlanningFormulaRejectsZeroAndOverflowingModels() public {
        vm.expectRevert(
            abi.encodeWithSelector(StreamPostEntropyCompletionGasHarness.InvalidGasModel.selector)
        );
        harness.planningParentGasLowerBound(0);

        vm.expectRevert(
            abi.encodeWithSelector(StreamPostEntropyCompletionGasHarness.InvalidGasModel.selector)
        );
        harness.planningParentGasLowerBound(type(uint256).max);
    }

    function testHighParentGasFullStipendCoordinatorStillCompletesFirstEoaMint() public {
        StreamFullStipendEntropyCoordinator coordinator = new StreamFullStipendEntropyCoordinator();

        (
            uint256 postCoordinatorTailGas,
            uint256 coordinatorEntryGas,
            uint256 coordinatorRemainingGas
        ) = harness.completeMint(
            COLLECTION_ID,
            TOKEN_ID,
            EOA_RECIPIENT,
            address(coordinator),
            MINT_COMMITMENT,
            REGISTRATION_GAS_LIMIT
        );

        coordinatorEntryGas.assertGte(
            REGISTRATION_GAS_LIMIT - 500,
            "high-parent-gas coordinator did not receive full stipend"
        );
        (coordinatorEntryGas <= REGISTRATION_GAS_LIMIT)
        .assertTrue("coordinator received excess gas");
        (coordinatorRemainingGas < 5_100).assertTrue("coordinator did not consume stipend");
        (postCoordinatorTailGas <= harness.POST_ENTROPY_PARENT_RESERVE())
        .assertTrue("EOA tail exceeds reserve");
        harness.ownerOf(TOKEN_ID).assertEq(EOA_RECIPIENT, "token owner");
        harness.balanceOf(EOA_RECIPIENT).assertEq(1, "recipient balance");
        harness.collectionLiveSupply(COLLECTION_ID).assertEq(1, "collection live supply");
        harness.liveTokenSupply().assertEq(1, "global live supply");
    }

    function testCoordinatorFailureRollsBackIdentitySupplyOwnershipAndEvents() public {
        StreamRevertingEntropyCoordinator coordinator = new StreamRevertingEntropyCoordinator();
        vm.recordLogs();

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamPostEntropyCompletionGasHarness.EntropyRegistrationFailed.selector
            )
        );
        harness.completeMint(
            COLLECTION_ID,
            TOKEN_ID,
            EOA_RECIPIENT,
            address(coordinator),
            MINT_COMMITMENT,
            REGISTRATION_GAS_LIMIT
        );

        Vm.Log[] memory logs = vm.getRecordedLogs();
        logs.length.assertEq(0, "reverted registration emitted events");
        harness.tokenIdentityCollection(TOKEN_ID).assertEq(0, "identity did not roll back");
        harness.coordinatorAtMint(TOKEN_ID)
            .assertEq(address(0), "coordinator pin did not roll back");
        harness.collectionLiveSupply(COLLECTION_ID)
            .assertEq(0, "collection supply did not roll back");
        harness.liveTokenSupply().assertEq(0, "global supply did not roll back");
        harness.exists(TOKEN_ID).assertFalse("ownership did not roll back");
    }

    function testContractReceiverGasIsOutsideTheFixedEoaTailGuarantee() public {
        StreamGasBurningERC721Receiver receiver =
            new StreamGasBurningERC721Receiver(harness.POST_ENTROPY_PARENT_RESERVE() + 25_000);

        (uint256 postCoordinatorTailGas,,) = harness.completeMint(
            COLLECTION_ID,
            TOKEN_ID,
            address(receiver),
            address(noopCoordinator),
            MINT_COMMITMENT,
            REGISTRATION_GAS_LIMIT
        );

        (postCoordinatorTailGas > harness.POST_ENTROPY_PARENT_RESERVE())
        .assertTrue("receiver callback stayed inside EOA tail reserve");
        harness.ownerOf(TOKEN_ID).assertEq(address(receiver), "receiver owner");
    }

    function testReceiverFailureRollsBackIdentityMetadataSupplyAndOwnership() public {
        StreamRevertingERC721Receiver receiver = new StreamRevertingERC721Receiver();

        vm.expectRevert();
        harness.completeMint(
            COLLECTION_ID,
            TOKEN_ID,
            address(receiver),
            address(noopCoordinator),
            MINT_COMMITMENT,
            REGISTRATION_GAS_LIMIT
        );

        harness.tokenIdentityCollection(TOKEN_ID).assertEq(0, "identity did not roll back");
        harness.coordinatorAtMint(TOKEN_ID)
            .assertEq(address(0), "coordinator pin did not roll back");
        (harness.tokenFreezeMetadataRecordHashes(TOKEN_ID) == bytes32(0))
        .assertTrue("metadata record did not roll back");
        harness.collectionLiveTokenMetadataAccumulators(COLLECTION_ID)
            .assertEq(0, "metadata accumulator did not roll back");
        harness.collectionPendingMetadataCounts(COLLECTION_ID)
            .assertEq(0, "pending metadata count did not roll back");
        harness.collectionLiveSupply(COLLECTION_ID)
            .assertEq(0, "collection supply did not roll back");
        harness.liveTokenSupply().assertEq(0, "global supply did not roll back");
        harness.exists(TOKEN_ID).assertFalse("ownership did not roll back");
    }

    function testMeasureWorstCaseEoaPostCoordinatorTail() public {
        vm.pauseGasMetering();
        harness.preparePostCoordinatorMeasurement(
            COLLECTION_ID,
            TOKEN_ID,
            address(noopCoordinator),
            MINT_COMMITMENT,
            REGISTRATION_GAS_LIMIT
        );

        vm.resumeGasMetering();
        harness.completePostCoordinatorMeasurement(COLLECTION_ID, TOKEN_ID, EOA_RECIPIENT);
    }
}
