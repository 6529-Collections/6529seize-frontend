// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Narrow target-side seam between Governed Gas/Time Parameter hosts
///         and the canonical Governance-V2 executor of ADR 0004
///         [GOV-ACTION-ID], as rebaselined by ADR 0017.
/// @dev Hosts accept no caller-supplied action id. Every governed mutation is
///      callable only by the immutable authority and independently verifies
///      the six-return in-flight action context before writing. The executor
///      owns action-id derivation; hosts own the exact action class and per-call
///      scope/old/new state commitments.
interface IStreamGovernedParameterAuthority {
    /// @notice Returns true for deployment-time wiring validation.
    function isStreamGovernedParameterAuthority() external view returns (bool);

    /// @notice Governance-V2 per-call execution context. Outside an executing
    ///         target call all six returns are zero.
    /// @dev Selector: `0x546ea281`. Parameter hosts derive the event action id
    ///      and verify transition commitments exclusively from this context.
    function currentAction()
        external
        view
        returns (
            bool executing,
            bytes32 actionId,
            uint8 actionClass,
            bytes32 scopeHash,
            bytes32 oldValueHash,
            bytes32 newValueHash
        );
}
