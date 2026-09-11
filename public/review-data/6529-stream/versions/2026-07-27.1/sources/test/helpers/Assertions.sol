// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library Assertions {
    function assertTrue(bool condition, string memory message) internal pure {
        require(condition, message);
    }

    function assertFalse(bool condition, string memory message) internal pure {
        require(!condition, message);
    }

    function assertEq(address actual, address expected, string memory message) internal pure {
        require(actual == expected, message);
    }

    function assertEq(uint256 actual, uint256 expected, string memory message) internal pure {
        require(actual == expected, message);
    }

    function assertGte(uint256 actual, uint256 expected, string memory message) internal pure {
        require(actual >= expected, message);
    }

    function assertEq(bytes32 actual, bytes32 expected, string memory message) internal pure {
        require(actual == expected, message);
    }

    function assertEq(string memory actual, string memory expected, string memory message)
        internal
        pure
    {
        require(keccak256(bytes(actual)) == keccak256(bytes(expected)), message);
    }
}
