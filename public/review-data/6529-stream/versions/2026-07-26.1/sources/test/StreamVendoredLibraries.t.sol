// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/Base64.sol";
import "../smart-contracts/Math.sol";
import "./helpers/Assertions.sol";

contract VendoredLibraryHarness {
    function encode(bytes memory data) external pure returns (string memory) {
        return Base64.encode(data);
    }

    function mulDiv(uint256 x, uint256 y, uint256 denominator) external pure returns (uint256) {
        return Math.mulDiv(x, y, denominator);
    }

    function mulDivUp(uint256 x, uint256 y, uint256 denominator) external pure returns (uint256) {
        return Math.mulDiv(x, y, denominator, Math.Rounding.Up);
    }
}

contract StreamVendoredLibrariesTest {
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for string;
    using Assertions for uint256;

    VendoredLibraryHarness private harness = new VendoredLibraryHarness();

    function testBase64EncodingMatchesOpenZeppelinGoldenVectors() public view {
        harness.encode("").assertEq("", "empty base64");
        harness.encode(bytes("f")).assertEq("Zg==", "one-byte base64");
        harness.encode(bytes("fo")).assertEq("Zm8=", "two-byte base64");
        harness.encode(bytes("foo")).assertEq("Zm9v", "three-byte base64");
        harness.encode(bytes("foob")).assertEq("Zm9vYg==", "four-byte base64");
        harness.encode(bytes("fooba")).assertEq("Zm9vYmE=", "five-byte base64");
        harness.encode(bytes("foobar")).assertEq("Zm9vYmFy", "six-byte base64");
    }

    function testBase64EncodingPreservesBinaryInputsAndPadding() public view {
        bytes memory zeroOneTwo = hex"000102";
        bytes memory allOnes = hex"ffffff";
        bytes memory withPadding = hex"0001";

        harness.encode(zeroOneTwo).assertEq("AAEC", "binary base64");
        harness.encode(allOnes).assertEq("////", "all ones base64");
        harness.encode(withPadding).assertEq("AAE=", "binary padding base64");
    }

    function testMathMulDivHandlesFullPrecisionBoundaries() public view {
        harness.mulDiv(type(uint256).max, type(uint256).max, type(uint256).max)
            .assertEq(type(uint256).max, "max exact mulDiv");
        harness.mulDiv(type(uint256).max, 2, type(uint256).max)
            .assertEq(2, "full precision quotient");
        harness.mulDiv(5, 5, 2).assertEq(12, "floor rounding");
    }

    function testMathMulDivRoundingUpOnlyIncrementsOnRemainder() public view {
        harness.mulDivUp(5, 5, 2).assertEq(13, "rounding remainder");
        harness.mulDivUp(10, 10, 5).assertEq(20, "rounding exact");
    }

    function testMathMulDivRevertsForOverflowAndZeroDenominator() public view {
        (bool overflowSuccess, bytes memory overflowRevertData) = address(harness)
            .staticcall(
                abi.encodeWithSelector(
                    harness.mulDiv.selector, type(uint256).max, type(uint256).max, 1
                )
            );
        overflowSuccess.assertFalse("overflow mulDiv succeeded");
        keccak256(overflowRevertData)
            .assertEq(
                keccak256(abi.encodeWithSignature("Error(string)", "Math: mulDiv overflow")),
                "overflow revert data"
            );

        (bool zeroDenominatorSuccess, bytes memory zeroDenominatorRevertData) =
            address(harness).staticcall(abi.encodeWithSelector(harness.mulDiv.selector, 1, 1, 0));
        zeroDenominatorSuccess.assertFalse("zero denominator mulDiv succeeded");
        keccak256(zeroDenominatorRevertData)
            .assertEq(
                keccak256(abi.encodeWithSignature("Panic(uint256)", 0x12)),
                "zero denominator revert data"
            );
    }
}
