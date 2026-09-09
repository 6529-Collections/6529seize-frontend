// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../vendor/openzeppelin/IERC165.sol";

/// @notice Permanent write surface for the Core-bound entropy coordinator.
interface IStreamEntropyCoordinator is IERC165 {
    /// @notice Registers a newly allocated token before Core invokes the ERC-721 receiver hook.
    function onTokenMinted(
        uint256 collectionId,
        uint256 tokenId,
        address recipient,
        bytes32 mintCommitment
    ) external;

    /// @notice Requests token entropy under the collection's active provider policy.
    function requestEntropy(uint256 tokenId)
        external
        payable
        returns (bytes32 requestKey, uint256 providerRequestId);

    /// @notice Registers a collection- or sale-scoped entropy subject.
    function registerEntropyScope(uint256 collectionId, uint8 scopeKind, bytes32 scopeRef)
        external
        returns (bytes32 scopeId);

    /// @notice Requests entropy for a registered scope.
    function requestScopeEntropy(bytes32 scopeId, bytes32 scopeInputsHash)
        external
        payable
        returns (bytes32 requestKey, uint256 providerRequestId);

    /// @notice Records a provider callback and returns the pinned fulfillment outcome code.
    function fulfillEntropy(bytes32 requestKey, bytes32 rawRandomness)
        external
        returns (uint8 outcome);
}
