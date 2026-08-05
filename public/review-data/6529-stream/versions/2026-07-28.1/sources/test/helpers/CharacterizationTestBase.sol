// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface Vm {
    struct Log {
        bytes32[] topics;
        bytes data;
        address emitter;
    }

    function addr(uint256 privateKey) external returns (address);
    function chainId(uint256 newChainId) external;
    function deal(address account, uint256 newBalance) external;
    function etch(address account, bytes calldata code) external;
    function expectEmit(bool checkTopic1, bool checkTopic2, bool checkTopic3, bool checkData)
        external;
    function prank(address msgSender) external;
    function roll(uint256 newHeight) external;
    function sign(uint256 privateKey, bytes32 digest)
        external
        returns (uint8 v, bytes32 r, bytes32 s);
    function warp(uint256 newTimestamp) external;
    function expectRevert(bytes calldata revertData) external;
    function expectRevert() external;
    function recordLogs() external;
    function getRecordedLogs() external returns (Log[] memory);
    function load(address target, bytes32 slot) external view returns (bytes32 value);
    function parseJson(string calldata json) external pure returns (bytes memory);
    function parseJson(string calldata json, string calldata key)
        external
        pure
        returns (bytes memory);
    function pauseGasMetering() external;
    function readFile(string calldata path) external view returns (string memory);
    function revertToState(uint256 snapshotId) external returns (bool);
    function resumeGasMetering() external;
    function snapshotState() external returns (uint256);
    function store(address target, bytes32 slot, bytes32 value) external;
}

abstract contract CharacterizationTestBase {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
}
