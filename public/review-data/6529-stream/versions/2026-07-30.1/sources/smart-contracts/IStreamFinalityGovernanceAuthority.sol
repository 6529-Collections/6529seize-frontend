// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Narrow authority seam the finality registry resolves roles and the terminal-freeze
///         veto guardian through (ADR 0004 [GOV-ROLES], [GOV-WINDOWS]).
/// @dev The ADR 0004 governed admin registry is built in a parallel worktree; this file pins
///      only the two reads this registry needs so the executor (or an interim multisig-backed
///      shim) can be bound at integration. Both are role references resolved at call time,
///      never raw frozen addresses (ADR 0004 execution rules).
interface IStreamFinalityGovernanceAuthority {
    /// @notice True when `account` currently holds the [GOV-ROLES] role `roleId`.
    function hasStreamRole(bytes32 roleId, address account) external view returns (bool);

    /// @notice Terminal-freeze veto guardian for a staged-freeze scope key
    ///         ([GOV-WINDOWS] veto surface shape).
    /// @dev The registry requires a nonzero guardian to schedule any terminal freeze and
    ///      re-resolves the guardian at veto time; it enforces its own veto window
    ///      (`notBefore`, floored at 72 hours), so `vetoDeadline` is informational here.
    function terminalFreezeVetoGuardian(bytes32 scopeHash)
        external
        view
        returns (address guardian, uint64 vetoDeadline);
}
