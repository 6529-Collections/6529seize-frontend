// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

interface INextGenCore {
    function changeTokenData(uint256 _tokenId, string memory newData) external;
}
