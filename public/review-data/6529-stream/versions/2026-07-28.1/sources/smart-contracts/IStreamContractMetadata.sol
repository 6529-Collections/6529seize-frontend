// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "./IERC7572.sol";

interface IStreamContractMetadata is IERC7572 {
    function adminsContract() external view returns (address);

    function contractURIHash() external view returns (bytes32);

    function isStreamContractMetadata() external pure returns (bool);

    function streamCore() external view returns (address);

    function updateAdminContract(address newAdminsContract) external;

    function updateContractURI(string memory newContractURI) external;
}
