// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/RandomizerRNG.sol";
import "../smart-contracts/StreamAdmins.sol";
import "../smart-contracts/StreamRandomizerLifecycle.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./mocks/MockRandomizerCore.sol";

contract StreamRandomizerPaymentsTest is CharacterizationTestBase {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    event Withdraw(address indexed _add, bool status, uint256 indexed funds);

    address private constant UNAUTHORIZED = address(0xBAD);
    address private constant EMERGENCY_RECIPIENT = address(0xE001);
    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant TOKEN_ID = 1;
    uint256 private constant SECOND_TOKEN_ID = TOKEN_ID + 1;
    uint256 private constant THIRD_TOKEN_ID = TOKEN_ID + 2;

    function testMultipleRequestsSpendReserveAndKeepRemainingBalanceReserved() public {
        RandomizerPaymentSetup memory setup = _deployRandomizer(0.25 ether);
        _fundRandomizer(setup, 1 ether);

        _requestRandomness(setup, TOKEN_ID).assertEq(1, "first request");
        _requestRandomness(setup, SECOND_TOKEN_ID).assertEq(2, "second request");

        setup.controller.totalValue().assertEq(0.5 ether, "provider payments");
        setup.controller.requestValue(1).assertEq(0.25 ether, "first provider payment");
        setup.controller.requestValue(2).assertEq(0.25 ether, "second provider payment");
        setup.controller.requestNumberOfNumbers(1).assertEq(1, "first word count");
        setup.controller.requestNumberOfNumbers(2).assertEq(1, "second word count");
        setup.controller.requestRefundAddress(1).assertEq(address(setup.randomizer), "first refund");
        setup.controller.requestRefundAddress(2)
            .assertEq(address(setup.randomizer), "second refund");
        address(setup.controller).balance.assertEq(0.5 ether, "controller balance");

        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(2, "pending collection");
        setup.randomizer.totalPendingRandomnessRequests().assertEq(2, "pending total");
        _assertReserve(setup, 0.5 ether);
    }

    function testFulfilledRequestClearsPendingWithoutMakingReserveWithdrawable() public {
        RandomizerPaymentSetup memory setup = _deployRandomizer(0.1 ether);
        _fundRandomizer(setup, 1 ether);

        _requestRandomness(setup, TOKEN_ID);
        _assertReserve(setup, 0.9 ether);

        setup.controller.fulfill(setup.randomizer, 1, _words(777));

        StreamRandomizerLifecycle.RandomnessRequest memory request =
            setup.randomizer.retrieveRandomnessRequest(1);
        uint256(request.state)
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.Fulfilled), "state");
        (request.derivedSeed != bytes32(0)).assertTrue("seed missing");
        setup.core.retrieveTokenHash(TOKEN_ID).assertEq(request.derivedSeed, "core hash");
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "pending collection");
        setup.randomizer.totalPendingRandomnessRequests().assertEq(0, "pending total");
        _assertReserve(setup, 0.9 ether);
        _assertEmergencyWithdrawDoesNotDrainReserve(setup, 0.9 ether);
    }

    function testStaleRequestClearsPendingWithoutMakingReserveWithdrawable() public {
        RandomizerPaymentSetup memory setup = _deployRandomizer(0.1 ether);
        _fundRandomizer(setup, 1 ether);

        _requestRandomness(setup, TOKEN_ID);
        _requestRandomness(setup, SECOND_TOKEN_ID);
        _assertReserve(setup, 0.8 ether);

        setup.randomizer.markStaleRequest(1);

        uint256(setup.randomizer.randomnessRequestState(1))
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.Stale), "state");
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(1, "pending collection");
        setup.randomizer.totalPendingRandomnessRequests().assertEq(1, "pending total");
        _assertReserve(setup, 0.8 ether);
        _assertEmergencyWithdrawDoesNotDrainReserve(setup, 0.8 ether);
    }

    function testPostProcessingFailureAndRetryPreserveReserveBoundary() public {
        RandomizerPaymentSetup memory setup = _deployRandomizer(0.2 ether);
        _fundRandomizer(setup, 1 ether);
        setup.core.setRejectTokenHash(true);

        _requestRandomness(setup, TOKEN_ID);
        setup.controller.fulfill(setup.randomizer, 1, _words(999));

        StreamRandomizerLifecycle.RandomnessRequest memory request =
            setup.randomizer.retrieveRandomnessRequest(1);
        uint256(request.state)
            .assertEq(
                uint256(StreamRandomizerLifecycle.RandomnessRequestState.FailedPostProcessing),
                "failed state"
            );
        (request.derivedSeed != bytes32(0)).assertTrue("failed seed missing");
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "pending collection");
        setup.randomizer.totalPendingRandomnessRequests().assertEq(0, "pending total");
        _assertReserve(setup, 0.8 ether);

        setup.core.setRejectTokenHash(false);
        setup.randomizer.retryRandomnessPostProcessing(1);

        request = setup.randomizer.retrieveRandomnessRequest(1);
        uint256(request.state)
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.Fulfilled), "state");
        request.postProcessingRetryCount.assertEq(1, "retry count");
        request.failureDataHash.assertEq(bytes32(0), "failure hash");
        setup.core.retrieveTokenHash(TOKEN_ID).assertEq(request.derivedSeed, "core hash");
        _assertReserve(setup, 0.8 ether);
        _assertEmergencyWithdrawDoesNotDrainReserve(setup, 0.8 ether);
    }

    function testForcedEthDuringPendingRequestRemainsReserved() public {
        RandomizerPaymentSetup memory setup = _deployRandomizer(0.25 ether);
        _fundRandomizer(setup, 1 ether);
        _requestRandomness(setup, TOKEN_ID);

        vm.deal(address(this), 0.33 ether);
        RandomizerPaymentsForceEth forceEth = new RandomizerPaymentsForceEth{ value: 0.33 ether }();
        forceEth.force(payable(address(setup.randomizer)));

        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(1, "pending collection");
        _assertReserve(setup, 1.08 ether);
        _assertEmergencyWithdrawDoesNotDrainReserve(setup, 1.08 ether);
    }

    function testUnauthorizedEmergencyWithdrawPreservesRequestReserve() public {
        RandomizerPaymentSetup memory setup = _deployRandomizer(0.15 ether);
        _fundRandomizer(setup, 1 ether);
        _requestRandomness(setup, TOKEN_ID);
        _requestRandomness(setup, SECOND_TOKEN_ID);
        _requestRandomness(setup, THIRD_TOKEN_ID);

        uint256 recipientBalanceBefore = EMERGENCY_RECIPIENT.balance;
        vm.prank(UNAUTHORIZED);
        (bool success,) = address(setup.randomizer)
            .call(abi.encodeWithSelector(setup.randomizer.emergencyWithdraw.selector));

        success.assertFalse("unauthorized withdraw succeeded");
        EMERGENCY_RECIPIENT.balance.assertEq(recipientBalanceBefore, "recipient balance changed");
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(3, "pending collection");
        setup.randomizer.totalPendingRandomnessRequests().assertEq(3, "pending total");
        _assertReserve(setup, 0.55 ether);
    }

    function _deployRandomizer(uint256 cost) private returns (RandomizerPaymentSetup memory setup) {
        setup.admins = new StreamAdmins(address(this));
        setup.admins.updateEmergencyRecipient(EMERGENCY_RECIPIENT);
        setup.core = new MockRandomizerCore();
        setup.controller = new RandomizerPaymentController();
        setup.randomizer = new NextGenRandomizerRNG(
            address(setup.core), address(setup.admins), address(setup.controller)
        );
        setup.admins
            .registerFunctionAdmin(
                address(this),
                address(setup.randomizer),
                setup.randomizer.updateRNGCost.selector,
                true
            );
        setup.admins
            .registerFunctionAdmin(
                address(this),
                address(setup.randomizer),
                setup.randomizer.emergencyWithdraw.selector,
                true
            );
        setup.admins
            .registerFunctionAdmin(
                address(this),
                address(setup.randomizer),
                setup.randomizer.markStaleRequest.selector,
                true
            );
        setup.admins
            .registerFunctionAdmin(
                address(this),
                address(setup.randomizer),
                setup.randomizer.retryRandomnessPostProcessing.selector,
                true
            );
        setup.core.setRandomizer(COLLECTION_ID, address(setup.randomizer), 1);
        setup.randomizer.updateRNGCost(cost);
    }

    function _fundRandomizer(RandomizerPaymentSetup memory setup, uint256 amount) private {
        vm.deal(address(this), amount);
        (bool success,) = address(setup.randomizer).call{ value: amount }("");
        success.assertTrue("funding failed");
        _assertReserve(setup, amount);
    }

    function _requestRandomness(RandomizerPaymentSetup memory setup, uint256 tokenId)
        private
        returns (uint256 requestId)
    {
        setup.core.setTokenCollection(tokenId, COLLECTION_ID);
        vm.prank(address(setup.core));
        setup.randomizer.calculateTokenHash(COLLECTION_ID, tokenId, 123);
        requestId = setup.randomizer.tokenToRequest(tokenId);
        setup.randomizer.requestToToken(requestId).assertEq(tokenId, "request token");
    }

    function _assertEmergencyWithdrawDoesNotDrainReserve(
        RandomizerPaymentSetup memory setup,
        uint256 expectedReserve
    ) private {
        uint256 recipientBalanceBefore = EMERGENCY_RECIPIENT.balance;
        vm.expectEmit(true, true, true, true);
        emit Withdraw(address(this), true, 0);
        setup.randomizer.emergencyWithdraw();
        EMERGENCY_RECIPIENT.balance.assertEq(recipientBalanceBefore, "recipient balance changed");
        _assertReserve(setup, expectedReserve);
    }

    function _assertReserve(RandomizerPaymentSetup memory setup, uint256 expected) private view {
        address(setup.randomizer).balance.assertEq(expected, "randomizer balance");
        setup.randomizer.totalRandomnessReserved().assertEq(expected, "randomness reserved");
        setup.randomizer.totalOwed().assertEq(expected, "total owed");
        setup.randomizer.totalReserved().assertEq(expected, "total reserved");
        setup.randomizer.surplus().assertEq(0, "surplus");
        setup.randomizer.emergencyWithdrawable().assertEq(0, "emergency withdrawable");
    }

    function _words(uint256 value) private pure returns (uint256[] memory words) {
        words = new uint256[](1);
        words[0] = value;
    }
}

struct RandomizerPaymentSetup {
    StreamAdmins admins;
    MockRandomizerCore core;
    RandomizerPaymentController controller;
    NextGenRandomizerRNG randomizer;
}

contract RandomizerPaymentController {
    uint256 public nextRequestId = 1;
    uint256 public totalValue;
    mapping(uint256 => uint256) public requestValue;
    mapping(uint256 => uint256) public requestNumberOfNumbers;
    mapping(uint256 => address) public requestRefundAddress;

    function requestRandomWords(uint256 numberOfNumbers, address refundAddress)
        external
        payable
        returns (uint256 requestId)
    {
        requestId = nextRequestId;
        nextRequestId++;
        requestValue[requestId] = msg.value;
        requestNumberOfNumbers[requestId] = numberOfNumbers;
        requestRefundAddress[requestId] = refundAddress;
        totalValue += msg.value;
    }

    function fulfill(NextGenRandomizerRNG randomizer, uint256 requestId, uint256[] memory words)
        external
    {
        randomizer.receiveRandomness(requestId, words);
    }
}

// Intentionally uses selfdestruct under Solidity 0.8.19 to test forced-ETH
// reserve accounting that cannot be exercised with a normal payable call.
contract RandomizerPaymentsForceEth {
    constructor() payable { }

    function force(address payable target) external {
        selfdestruct(target);
    }
}
