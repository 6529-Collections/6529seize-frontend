// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/RandomizerRNG.sol";
import "../smart-contracts/StreamAdmins.sol";
import "../smart-contracts/StreamMinter.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./mocks/MockRandomizerCore.sol";

contract StreamEmergencyWithdrawTest is CharacterizationTestBase {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for uint256;

    event Withdraw(address indexed _add, bool status, uint256 indexed funds);

    address private constant CORE = address(0xC0DE);
    address private constant STREAM_DROPS = address(0xD012);
    address private constant UNAUTHORIZED = address(0xBAD);
    address private constant EMERGENCY_RECIPIENT = address(0xE001);
    uint256 private constant TOKEN_ID = 1;

    function testStreamMinterRejectsNormalEthTransfers() public {
        MinterSetup memory setup = _deployMinter();
        vm.deal(address(this), 1 ether);

        (bool success,) = address(setup.minter).call{ value: 1 wei }("");

        success.assertFalse("minter accepted normal eth");
        address(setup.minter).balance.assertEq(0, "minter balance");
        setup.minter.totalOwed().assertEq(0, "minter owed");
        setup.minter.emergencyWithdrawable().assertEq(0, "minter surplus");
    }

    function testStreamMinterEmergencyWithdrawsForcedSurplusOnly() public {
        MinterSetup memory setup = _deployMinter();
        setup.admins.updateEmergencyRecipient(EMERGENCY_RECIPIENT);
        vm.deal(address(this), 10 ether);

        ForceEth forceEth = new ForceEth{ value: 1 ether }();
        forceEth.force(payable(address(setup.minter)));

        setup.minter.totalOwed().assertEq(0, "minter owed");
        setup.minter.emergencyWithdrawable().assertEq(1 ether, "minter surplus");
        uint256 recipientBalanceBefore = EMERGENCY_RECIPIENT.balance;

        vm.expectEmit(true, true, true, true);
        emit Withdraw(address(this), true, 1 ether);
        setup.minter.emergencyWithdraw();

        EMERGENCY_RECIPIENT.balance
            .assertEq(recipientBalanceBefore + 1 ether, "surplus not withdrawn");
        address(setup.minter).balance.assertEq(0, "minter balance");
        setup.minter.totalOwed().assertEq(0, "minter owed changed");
        setup.minter.emergencyWithdrawable().assertEq(0, "minter surplus left");
    }

    function testStreamMinterUnauthorizedEmergencyWithdrawRevertsWithoutTransfer() public {
        MinterSetup memory setup = _deployMinter();
        setup.admins.updateEmergencyRecipient(EMERGENCY_RECIPIENT);
        vm.deal(address(this), 10 ether);
        ForceEth forceEth = new ForceEth{ value: 1 ether }();
        forceEth.force(payable(address(setup.minter)));
        uint256 recipientBalanceBefore = EMERGENCY_RECIPIENT.balance;

        vm.prank(UNAUTHORIZED);
        (bool success,) = address(setup.minter)
            .call(abi.encodeWithSelector(setup.minter.emergencyWithdraw.selector));

        success.assertFalse("unauthorized minter withdraw succeeded");
        EMERGENCY_RECIPIENT.balance.assertEq(recipientBalanceBefore, "recipient balance changed");
        address(setup.minter).balance.assertEq(1 ether, "minter balance changed");
        setup.minter.emergencyWithdrawable().assertEq(1 ether, "minter surplus changed");
    }

    function testRandomizerEmergencyWithdrawCannotDrainAdapterReserve() public {
        RandomizerSetup memory setup = _deployRandomizer();
        setup.admins.updateEmergencyRecipient(EMERGENCY_RECIPIENT);
        vm.deal(address(this), 10 ether);

        (bool success,) = address(setup.randomizer).call{ value: 1 ether }("");

        success.assertTrue("randomizer rejected reserve");
        setup.randomizer.totalRandomnessReserved().assertEq(1 ether, "reserved");
        setup.randomizer.totalOwed().assertEq(1 ether, "owed");
        setup.randomizer.emergencyWithdrawable().assertEq(0, "withdrawable");
        uint256 recipientBalanceBefore = EMERGENCY_RECIPIENT.balance;

        vm.expectEmit(true, true, true, true);
        emit Withdraw(address(this), true, 0);
        setup.randomizer.emergencyWithdraw();

        EMERGENCY_RECIPIENT.balance.assertEq(recipientBalanceBefore, "reserve withdrawn");
        address(setup.randomizer).balance.assertEq(1 ether, "reserve balance changed");
        setup.randomizer.totalRandomnessReserved().assertEq(1 ether, "reserved changed");
        setup.randomizer.totalOwed().assertEq(1 ether, "owed changed");
        setup.randomizer.emergencyWithdrawable().assertEq(0, "withdrawable changed");
    }

    function testRandomizerUnauthorizedEmergencyWithdrawRevertsWithoutTransfer() public {
        RandomizerSetup memory setup = _deployRandomizer();
        setup.admins.updateEmergencyRecipient(EMERGENCY_RECIPIENT);
        vm.deal(address(this), 10 ether);
        (bool funded,) = address(setup.randomizer).call{ value: 1 ether }("");
        funded.assertTrue("randomizer rejected reserve");
        uint256 recipientBalanceBefore = EMERGENCY_RECIPIENT.balance;

        vm.prank(UNAUTHORIZED);
        (bool success,) = address(setup.randomizer)
            .call(abi.encodeWithSelector(setup.randomizer.emergencyWithdraw.selector));

        success.assertFalse("unauthorized randomizer withdraw succeeded");
        EMERGENCY_RECIPIENT.balance.assertEq(recipientBalanceBefore, "recipient balance changed");
        address(setup.randomizer).balance.assertEq(1 ether, "reserve balance changed");
        setup.randomizer.totalRandomnessReserved().assertEq(1 ether, "reserved changed");
        setup.randomizer.emergencyWithdrawable().assertEq(0, "withdrawable changed");
    }

    function testForcedEthIsRandomizerReserveNotEmergencySurplus() public {
        RandomizerSetup memory setup = _deployRandomizer();
        setup.admins.updateEmergencyRecipient(EMERGENCY_RECIPIENT);
        vm.deal(address(this), 10 ether);

        ForceEth forceEth = new ForceEth{ value: 1 ether }();
        forceEth.force(payable(address(setup.randomizer)));

        setup.randomizer.totalRandomnessReserved().assertEq(1 ether, "reserved");
        setup.randomizer.totalOwed().assertEq(1 ether, "owed");
        setup.randomizer.emergencyWithdrawable().assertEq(0, "withdrawable");
        uint256 recipientBalanceBefore = EMERGENCY_RECIPIENT.balance;

        setup.randomizer.emergencyWithdraw();

        EMERGENCY_RECIPIENT.balance.assertEq(recipientBalanceBefore, "reserve withdrawn");
        address(setup.randomizer).balance.assertEq(1 ether, "reserve balance changed");
        setup.randomizer.totalRandomnessReserved().assertEq(1 ether, "reserved changed");
    }

    function testRandomizerRequestSpendsReserveAndKeepsRemainderNonWithdrawable() public {
        RandomizerSetup memory setup = _deployRandomizer();
        setup.admins.updateEmergencyRecipient(EMERGENCY_RECIPIENT);
        setup.randomizer.updateRNGCost(0.25 ether);
        vm.deal(address(this), 10 ether);
        (bool success,) = address(setup.randomizer).call{ value: 1 ether }("");
        success.assertTrue("randomizer rejected reserve");

        vm.prank(address(setup.core));
        setup.randomizer.calculateTokenHash(1, TOKEN_ID, 123);

        setup.controller.lastValue().assertEq(0.25 ether, "controller payment");
        setup.controller.lastNumberOfNumbers().assertEq(1, "number of words");
        setup.controller.lastRefundAddress().assertEq(address(setup.randomizer), "refund address");
        setup.randomizer.tokenToRequest(TOKEN_ID).assertEq(1, "request id");
        setup.randomizer.requestToToken(1).assertEq(TOKEN_ID, "request token");
        address(setup.randomizer).balance.assertEq(0.75 ether, "remaining reserve");
        setup.randomizer.totalRandomnessReserved().assertEq(0.75 ether, "reserved");
        setup.randomizer.totalOwed().assertEq(0.75 ether, "owed");
        setup.randomizer.emergencyWithdrawable().assertEq(0, "withdrawable");

        uint256 recipientBalanceBefore = EMERGENCY_RECIPIENT.balance;
        setup.randomizer.emergencyWithdraw();

        EMERGENCY_RECIPIENT.balance.assertEq(recipientBalanceBefore, "reserve withdrawn");
        address(setup.randomizer).balance.assertEq(0.75 ether, "reserve balance changed");
    }

    function _deployMinter() private returns (MinterSetup memory setup) {
        setup.admins = new StreamAdmins(address(this));
        setup.minter = new StreamMinter(CORE, address(setup.admins), STREAM_DROPS);
        setup.admins
            .registerFunctionAdmin(
                address(this), address(setup.minter), setup.minter.emergencyWithdraw.selector, true
            );
    }

    function _deployRandomizer() private returns (RandomizerSetup memory setup) {
        setup.admins = new StreamAdmins(address(this));
        setup.core = new MockRandomizerCore();
        setup.controller = new MockArrngController();
        setup.randomizer = new NextGenRandomizerRNG(
            address(setup.core), address(setup.admins), address(setup.controller)
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
                setup.randomizer.updateRNGCost.selector,
                true
            );
        setup.core.setRandomizer(1, address(setup.randomizer), 1);
    }
}

struct MinterSetup {
    StreamAdmins admins;
    StreamMinter minter;
}

struct RandomizerSetup {
    StreamAdmins admins;
    MockRandomizerCore core;
    MockArrngController controller;
    NextGenRandomizerRNG randomizer;
}

contract MockArrngController {
    uint256 public nextRequestId = 1;
    uint256 public lastValue;
    uint256 public lastNumberOfNumbers;
    address public lastRefundAddress;

    function requestRandomWords(uint256 numberOfNumbers, address refundAddress)
        external
        payable
        returns (uint256 requestId)
    {
        lastValue = msg.value;
        lastNumberOfNumbers = numberOfNumbers;
        lastRefundAddress = refundAddress;
        requestId = nextRequestId;
        nextRequestId++;
    }
}

// Intentionally uses selfdestruct under Solidity 0.8.19 to test forced-ETH
// surplus accounting that cannot be exercised with a normal payable call.
contract ForceEth {
    constructor() payable { }

    function force(address payable target) external {
        selfdestruct(target);
    }
}
