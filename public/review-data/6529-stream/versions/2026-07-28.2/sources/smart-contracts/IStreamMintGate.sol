// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IERC165.sol";

/// @notice View-only eligibility module for StreamMintManager phases.
interface IStreamMintGate is IERC165 {
    struct GateResult {
        bytes32 authorizationId;
        bytes32[] nullifiers;
        address authorizer;
        uint64 maxQuantity;
        bytes32 gateHash;
    }

    /// @notice Validates one mint request against gate-specific evidence.
    function validateMint(
        address manager,
        address executor,
        uint256 collectionId,
        bytes32 phaseId,
        address payer,
        address authorizer,
        address[] calldata initialRecipients,
        address[] calldata beneficiaries,
        bytes32 contextHash,
        bytes32 policyHash,
        bytes calldata gateData
    ) external view returns (GateResult memory);
}
