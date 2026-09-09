// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Storage-free bounded-read helpers for the launch-v1 StreamCore read paths.
/// @dev The embedding Core must pass live, authenticated GGP values. This library owns no
///      parameter storage or mutation surface and deliberately provides no probe.
library StreamCoreReadBuffer {
    uint8 internal constant READ_OK = 0;
    uint8 internal constant READ_CALL_FAILED = 6;
    uint8 internal constant READ_RETURNDATA_OVERSIZED = 7;
    uint8 internal constant READ_RETURNDATA_MALFORMED = 8;

    /// @notice Returns whether `availableGas` covers full EIP-150 forwarding plus completion.
    /// @dev The exact forwarding term is `gasLimit + ceil(gasLimit / 63)`. Subtraction-form
    ///      comparisons avoid multiplication and addition overflow at every uint256 tuple.
    function hasSufficientParentGas(
        uint256 availableGas,
        uint256 gasLimit,
        uint256 completionBuffer
    ) internal pure returns (bool) {
        if (availableGas < gasLimit) return false;
        uint256 afterLimit = availableGas - gasLimit;
        uint256 eip150Retention = gasLimit / 63 + (gasLimit % 63 == 0 ? 0 : 1);
        if (afterLimit < eip150Retention) return false;
        return afterLimit - eip150Retention >= completionBuffer;
    }

    /// @notice Validates and decodes a non-empty canonical ABI string.
    function decodeRequiredString(bytes memory returnData)
        internal
        pure
        returns (uint8 status, string memory value)
    {
        uint256 returnLength = returnData.length;
        if (returnLength < 96) return (READ_RETURNDATA_MALFORMED, "");

        uint256 offset;
        uint256 stringLength;
        assembly ("memory-safe") {
            offset := mload(add(returnData, 0x20))
            stringLength := mload(add(returnData, 0x40))
        }
        if (offset != 32 || stringLength == 0 || stringLength > returnLength - 64) {
            return (READ_RETURNDATA_MALFORMED, "");
        }

        uint256 paddedLength = (stringLength + 31) & ~uint256(31);
        if (returnLength - 64 != paddedLength) {
            return (READ_RETURNDATA_MALFORMED, "");
        }

        uint256 padding = paddedLength - stringLength;
        if (padding != 0) {
            uint256 finalWord;
            assembly ("memory-safe") {
                finalWord := mload(add(add(returnData, 0x60), sub(paddedLength, 0x20)))
            }
            uint256 paddingBits = padding * 8;
            if ((finalWord & ((uint256(1) << paddingBits) - 1)) != 0) {
                return (READ_RETURNDATA_MALFORMED, "");
            }
        }

        return (READ_OK, abi.decode(returnData, (string)));
    }
}
