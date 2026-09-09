// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

interface IStreamAdmins {
    // retrieve global admin
    function retrieveGlobalAdmin(address _address) external view returns (bool);

    // retrieve function admin
    function retrieveFunctionAdmin(address _address, address _target, bytes4 _selector)
        external
        view
        returns (bool);

    // retrieve collection admin
    function retrieveCollectionAdmin(address _address, uint256 _collectionID)
        external
        view
        returns (bool);

    // retrieve pause state by domain
    function isPaused(bytes32 _domain) external view returns (bool);

    // retrieve explicit emergency recipient
    function emergencyRecipient() external view returns (address);

    // retrieve if the contract is admin contract
    function isAdminContract() external view returns (bool);

    // retrieve owner
    function owner() external view returns (address);
}
