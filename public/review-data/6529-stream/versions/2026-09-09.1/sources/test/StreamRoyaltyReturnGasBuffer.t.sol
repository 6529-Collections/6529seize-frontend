// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/GovernedParameterTestMocks.sol";
import "./helpers/StreamRoyaltyReturnGasBufferHarness.sol";

contract StreamRoyaltyReturnGasBufferTest is CharacterizationTestBase {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for string;
    using Assertions for uint256;

    bytes32 private constant _GAS_SCOPE_DOMAIN =
        0x9533611d402c2b44cf950a4a8900d25f6829bfac541dc4d5353094f966bb1a71;
    bytes32 private constant _GAS_STATE_DOMAIN =
        0x5059a253d3f7dd63b5d9fd1f0568caf72967f501a3db678b31cefe911334159c;

    StreamRoyaltyReturnGasBufferHarness private harness;

    function setUp() public {
        harness = new StreamRoyaltyReturnGasBufferHarness(address(0));
    }

    function testExactlyThreeRowsAndOneSharedBufferConsumerInput() public view {
        bytes32[] memory ids = harness.gasParameterIds();
        ids.length.assertEq(3, "fixture added a 23rd launch GGP");
        (ids[0] == harness.ROYALTY_RESOLVER_GAS_LIMIT()).assertTrue("resolver row order");
        (ids[1] == harness.ROYALTY_RETURN_GAS_BUFFER()).assertTrue("shared row order");
        (ids[2] == harness.METADATA_ROUTER_GAS_LIMIT()).assertTrue("metadata row order");

        (, uint256 floor, uint8 failureClass, uint64 revision) = harness.gasParameterInfo(ids[1]);
        floor.assertEq(harness.SHARED_BUFFER_FLOOR(), "shared floor");
        uint256(failureClass).assertEq(1, "shared failure class");
        uint256(revision).assertEq(1, "shared genesis revision");
    }

    function testBelowAtAndAboveThresholdForAllThreeConsumers() public view {
        uint256 buffer = harness.SHARED_BUFFER_GENESIS();
        _assertThreshold(harness.ROYALTY_LIMIT_GENESIS(), buffer);
        _assertThreshold(harness.METADATA_LIMIT_GENESIS(), buffer);
        _assertThreshold(harness.METADATA_LIMIT_GENESIS(), buffer);
    }

    function testThresholdHandlesResiduesZeroOneAndSixtyTwo() public view {
        uint256 buffer = harness.SHARED_BUFFER_GENESIS();
        _assertThreshold(63, buffer);
        _assertThreshold(64, buffer);
        _assertThreshold(62, buffer);
    }

    function testThresholdNearUint256MaxFailsClosedWithoutRevert() public view {
        harness.parentGasSufficient(type(uint256).max, type(uint256).max, 1)
            .assertFalse("max limit unexpectedly admitted");
        harness.parentGasSufficient(type(uint256).max, type(uint256).max - 1, 1)
            .assertFalse("near-max limit unexpectedly admitted");
        harness.parentGasSufficient(type(uint256).max, 1, type(uint256).max)
            .assertFalse("max buffer unexpectedly admitted");
        harness.parentGasSufficient(type(uint256).max, 0, type(uint256).max)
            .assertTrue("exact max buffer rejected");
    }

    function testFullRoyaltyStipendBurnCompletesAndReturnsTotalMulDiv() public {
        StreamRoyaltyReturnGasTarget target = new StreamRoyaltyReturnGasTarget();
        (address receiver, uint256 amount) = harness.royaltyInfo(address(target), type(uint256).max);
        uint256 entryGas = uint256(uint160(receiver));
        entryGas.assertGte(
            harness.ROYALTY_LIMIT_GENESIS() - 500, "resolver did not receive full stipend"
        );
        (entryGas <= harness.ROYALTY_LIMIT_GENESIS()).assertTrue("resolver received excess gas");
        amount.assertEq(type(uint256).max / 10_000, "full-precision royalty amount");
    }

    function testMaximumMetadataReturndataCompletesForTokenAndContract() public {
        StreamMaximumMetadataReturnTarget target = new StreamMaximumMetadataReturnTarget();
        string memory tokenValue = harness.tokenURI(address(target), 671);
        string memory contractValue = harness.contractURI(address(target));
        bytes memory tokenBytes = bytes(tokenValue);
        bytes memory contractBytes = bytes(contractValue);
        tokenBytes.length
            .assertEq(harness.MAX_METADATA_RETURNDATA() - 64, "maximum token string length");
        contractBytes.length
            .assertEq(harness.MAX_METADATA_RETURNDATA() - 64, "maximum contract string length");
        _lastWord(tokenBytes)
            .assertGte(
                harness.METADATA_LIMIT_GENESIS() - 500, "token router did not receive full stipend"
            );
        _lastWord(contractBytes)
            .assertGte(
                harness.METADATA_LIMIT_GENESIS() - 500,
                "contract router did not receive full stipend"
            );
    }

    function testOversizedMalformedAndRevertingMetadataFailSafe() public {
        StreamOversizedMetadataReturnTarget oversized = new StreamOversizedMetadataReturnTarget();
        StreamMalformedMetadataReturnTarget malformed = new StreamMalformedMetadataReturnTarget();
        StreamRevertingReadTarget revertingTarget = new StreamRevertingReadTarget();

        string memory oversizedToken = harness.tokenURI(address(oversized), 671);
        string memory malformedToken = harness.tokenURI(address(malformed), 671);
        string memory revertingToken = harness.tokenURI(address(revertingTarget), 671);
        string memory oversizedContract = harness.contractURI(address(oversized));
        string memory malformedContract = harness.contractURI(address(malformed));
        string memory revertingContract = harness.contractURI(address(revertingTarget));

        (bytes(oversizedToken).length != 0).assertTrue("empty oversized token fallback");
        (bytes(oversizedContract).length != 0).assertTrue("empty oversized contract fallback");
        (keccak256(bytes(oversizedToken)) != keccak256(bytes(malformedToken)))
        .assertTrue("oversized and malformed token status collapsed");
        (keccak256(bytes(malformedToken)) != keccak256(bytes(revertingToken)))
        .assertTrue("malformed and reverting token status collapsed");
        (keccak256(bytes(oversizedContract)) != keccak256(bytes(malformedContract)))
        .assertTrue("oversized and malformed contract status collapsed");
        (keccak256(bytes(malformedContract)) != keccak256(bytes(revertingContract)))
        .assertTrue("malformed and reverting contract status collapsed");
    }

    function testMalformedAndOversizedRoyaltyFailSafe() public {
        StreamOversizedMetadataReturnTarget oversized = new StreamOversizedMetadataReturnTarget();
        StreamMalformedMetadataReturnTarget malformed = new StreamMalformedMetadataReturnTarget();
        (address oversizedReceiver, uint256 oversizedAmount) =
            harness.royaltyInfo(address(oversized), type(uint256).max);
        (address malformedReceiver, uint256 malformedAmount) =
            harness.royaltyInfo(address(malformed), type(uint256).max);
        oversizedReceiver.assertEq(address(0), "oversized royalty receiver");
        oversizedAmount.assertEq(0, "oversized royalty amount");
        malformedReceiver.assertEq(address(0), "malformed royalty receiver");
        malformedAmount.assertEq(0, "malformed royalty amount");
    }

    function testIndependentRepeatedTwoXRaiseOrderingsAndMaxChain() public {
        MockGovernedParameterAuthority authority = new MockGovernedParameterAuthority(true);
        StreamRoyaltyReturnGasBufferHarness mutableHarness =
            new StreamRoyaltyReturnGasBufferHarness(address(authority));
        bytes32 resolverId = mutableHarness.ROYALTY_RESOLVER_GAS_LIMIT();
        bytes32 bufferId = mutableHarness.ROYALTY_RETURN_GAS_BUFFER();
        bytes32 metadataId = mutableHarness.METADATA_ROUTER_GAS_LIMIT();

        _raise(authority, mutableHarness, resolverId, 100_000, 1);
        _raise(authority, mutableHarness, resolverId, 200_000, 2);
        _raise(authority, mutableHarness, bufferId, mutableHarness.SHARED_BUFFER_GENESIS() * 2, 3);
        _raise(authority, mutableHarness, metadataId, 1_000_000, 4);
        _raise(authority, mutableHarness, metadataId, 2_000_000, 5);

        uint256 resolver = mutableHarness.gasParameter(resolverId);
        uint256 buffer = mutableHarness.gasParameter(bufferId);
        uint256 metadata = mutableHarness.gasParameter(metadataId);
        _assertThresholdOn(mutableHarness, resolver, buffer);
        _assertThresholdOn(mutableHarness, metadata, buffer);

        MockGovernedParameterAuthority reverseAuthority = new MockGovernedParameterAuthority(true);
        StreamRoyaltyReturnGasBufferHarness reverseHarness =
            new StreamRoyaltyReturnGasBufferHarness(address(reverseAuthority));
        _raise(
            reverseAuthority,
            reverseHarness,
            reverseHarness.ROYALTY_RETURN_GAS_BUFFER(),
            reverseHarness.SHARED_BUFFER_GENESIS() * 2,
            1
        );
        _raise(
            reverseAuthority,
            reverseHarness,
            reverseHarness.METADATA_ROUTER_GAS_LIMIT(),
            1_000_000,
            2
        );
        _raise(
            reverseAuthority,
            reverseHarness,
            reverseHarness.ROYALTY_RESOLVER_GAS_LIMIT(),
            100_000,
            3
        );
        _assertThresholdOn(
            reverseHarness,
            reverseHarness.gasParameter(reverseHarness.ROYALTY_RESOLVER_GAS_LIMIT()),
            reverseHarness.gasParameter(reverseHarness.ROYALTY_RETURN_GAS_BUFFER())
        );
        _assertThresholdOn(
            reverseHarness,
            reverseHarness.gasParameter(reverseHarness.METADATA_ROUTER_GAS_LIMIT()),
            reverseHarness.gasParameter(reverseHarness.ROYALTY_RETURN_GAS_BUFFER())
        );

        buffer = _raiseToMax(authority, mutableHarness, bufferId, 6);
        mutableHarness.parentGasSufficient(type(uint256).max, 1, buffer)
            .assertFalse("maximum raised buffer did not fail closed");
    }

    function testResolverLimitRepeatedTwoXMaxChainFailsClosed() public {
        MockGovernedParameterAuthority authority = new MockGovernedParameterAuthority(true);
        StreamRoyaltyReturnGasBufferHarness mutableHarness =
            new StreamRoyaltyReturnGasBufferHarness(address(authority));
        uint256 resolver = _raiseToMax(
            authority, mutableHarness, mutableHarness.ROYALTY_RESOLVER_GAS_LIMIT(), 1
        );
        mutableHarness.parentGasSufficient(
                type(uint256).max, resolver, mutableHarness.SHARED_BUFFER_GENESIS()
            ).assertFalse("maximum resolver limit did not fail closed");
    }

    function testMetadataLimitRepeatedTwoXMaxChainFailsClosed() public {
        MockGovernedParameterAuthority authority = new MockGovernedParameterAuthority(true);
        StreamRoyaltyReturnGasBufferHarness mutableHarness =
            new StreamRoyaltyReturnGasBufferHarness(address(authority));
        uint256 metadata =
            _raiseToMax(authority, mutableHarness, mutableHarness.METADATA_ROUTER_GAS_LIMIT(), 1);
        mutableHarness.parentGasSufficient(
                type(uint256).max, metadata, mutableHarness.SHARED_BUFFER_GENESIS()
            ).assertFalse("maximum metadata limit did not fail closed");
    }

    function testMeasureRoyaltySuccessCompletion() public {
        vm.pauseGasMetering();
        bytes memory returnData = abi.encode(address(0x671), uint256(10_000));
        vm.resumeGasMetering();
        harness.completeRoyalty(returnData, type(uint256).max);
    }

    function testMeasureRoyaltyFallbackCompletion() public {
        vm.pauseGasMetering();
        bytes memory returnData = new bytes(65);
        vm.resumeGasMetering();
        harness.completeRoyalty(returnData, type(uint256).max);
    }

    function testMeasureTokenUriMaximumCompletion() public {
        vm.pauseGasMetering();
        bytes memory returnData = _maximumCanonicalStringReturn();
        vm.resumeGasMetering();
        harness.completeTokenURI(returnData, 671);
    }

    function testMeasureTokenUriFallbackCompletion() public {
        vm.pauseGasMetering();
        bytes memory returnData = _malformedStringReturn();
        vm.resumeGasMetering();
        harness.completeTokenURI(returnData, 671);
    }

    function testMeasureContractUriMaximumCompletion() public {
        vm.pauseGasMetering();
        bytes memory returnData = _maximumCanonicalStringReturn();
        vm.resumeGasMetering();
        harness.completeContractURI(returnData);
    }

    function testMeasureContractUriFallbackCompletion() public {
        vm.pauseGasMetering();
        bytes memory returnData = _malformedStringReturn();
        vm.resumeGasMetering();
        harness.completeContractURI(returnData);
    }

    function _assertThreshold(uint256 gasLimit, uint256 buffer) private view {
        _assertThresholdOn(harness, gasLimit, buffer);
    }

    function _assertThresholdOn(
        StreamRoyaltyReturnGasBufferHarness target,
        uint256 gasLimit,
        uint256 buffer
    ) private pure {
        uint256 threshold = gasLimit + gasLimit / 63 + (gasLimit % 63 == 0 ? 0 : 1) + buffer;
        target.parentGasSufficient(threshold - 1, gasLimit, buffer)
            .assertFalse("below threshold admitted");
        target.parentGasSufficient(threshold, gasLimit, buffer).assertTrue("at threshold rejected");
        target.parentGasSufficient(threshold + 1, gasLimit, buffer)
            .assertTrue("above threshold rejected");
    }

    function _raise(
        MockGovernedParameterAuthority authority,
        StreamRoyaltyReturnGasBufferHarness target,
        bytes32 parameterId,
        uint256 newValue,
        uint256 actionNonce
    ) private {
        (bytes32 scopeHash, bytes32 oldStateHash, bytes32 newStateHash) =
            _transitionHashes(target, parameterId, newValue);
        authority.setCurrentAction(
            true, bytes32(actionNonce), 1, scopeHash, oldStateHash, newStateHash
        );
        vm.prank(address(authority));
        target.raiseGasParameter(parameterId, newValue);
    }

    function _raiseToMax(
        MockGovernedParameterAuthority authority,
        StreamRoyaltyReturnGasBufferHarness target,
        bytes32 parameterId,
        uint256 actionNonce
    ) private returns (uint256 value) {
        value = target.gasParameter(parameterId);
        while (value <= type(uint256).max / 2) {
            value *= 2;
            _raise(authority, target, parameterId, value, actionNonce++);
        }
        if (value != type(uint256).max) {
            value = type(uint256).max;
            _raise(authority, target, parameterId, value, actionNonce);
        }
    }

    function _transitionHashes(
        StreamRoyaltyReturnGasBufferHarness target,
        bytes32 parameterId,
        uint256 newValue
    ) private view returns (bytes32 scopeHash, bytes32 oldStateHash, bytes32 newStateHash) {
        (uint256 oldValue, uint256 floor, uint8 failureClass, uint64 revision) =
            target.gasParameterInfo(parameterId);
        scopeHash =
            keccak256(abi.encode(_GAS_SCOPE_DOMAIN, block.chainid, address(target), parameterId));
        oldStateHash = keccak256(
            abi.encode(_GAS_STATE_DOMAIN, scopeHash, oldValue, floor, failureClass, revision)
        );
        newStateHash = keccak256(
            abi.encode(_GAS_STATE_DOMAIN, scopeHash, newValue, floor, failureClass, revision + 1)
        );
    }

    function _maximumCanonicalStringReturn() private pure returns (bytes memory returnData) {
        uint256 stringLength = 65_536 - 64;
        returnData = new bytes(65_536);
        assembly ("memory-safe") {
            mstore(add(returnData, 0x20), 0x20)
            mstore(add(returnData, 0x40), stringLength)
        }
    }

    function _malformedStringReturn() private pure returns (bytes memory returnData) {
        returnData = new bytes(96);
        assembly ("memory-safe") {
            mstore(add(returnData, 0x20), 0x40)
            mstore(add(returnData, 0x40), 1)
            mstore(add(returnData, 0x60), 1)
        }
    }

    function _lastWord(bytes memory value) private pure returns (uint256 word) {
        assembly ("memory-safe") {
            word := mload(add(add(value, 0x20), sub(mload(value), 0x20)))
        }
    }
}
