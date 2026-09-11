// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Protocol-wide `ROLE_*` constant vocabulary pinned by ADR 0004
///         [GOV-ROLES] (`docs/adr/0004-admin-governance.md`).
/// @dev Each constant is `keccak256` of its own name. The vocabulary is
///     closed-world: a subsystem may reference only roles enumerated here, and
///     introducing a new constant amends the [GOV-ROLES] table first. Grant
///     classes (`root` vs `operational`) are resolved by
///     `StreamRoleRegistry.roleGrantClass`.
library StreamRoles {
    /// @notice Grant class for roles granted and revoked only by `GovernanceRoot`.
    uint8 internal constant GRANT_CLASS_ROOT = 1;
    /// @notice Grant class for roles grantable by `RoleManager`.
    uint8 internal constant GRANT_CLASS_OPERATIONAL = 2;

    /// @notice Immediately pauses approved domains (tightening only); disjoint from unpause.
    bytes32 internal constant ROLE_PAUSE_GUARDIAN = keccak256("ROLE_PAUSE_GUARDIAN");
    /// @notice Executes unpause with no timelock and an evented reason; disjoint from pause.
    bytes32 internal constant ROLE_UNPAUSE = keccak256("ROLE_UNPAUSE");
    /// @notice Executes collection artwork finality subject to component verification.
    bytes32 internal constant ROLE_COLLECTION_FINALITY_ADMIN =
        keccak256("ROLE_COLLECTION_FINALITY_ADMIN");
    /// @notice Per-scope terminal-freeze veto guardian resolved through
    ///         `terminalFreezeVetoGuardian`; independent of scheduling roles.
    bytes32 internal constant ROLE_TERMINAL_FREEZE_VETO = keccak256("ROLE_TERMINAL_FREEZE_VETO");
    /// @notice Declares entropy requests unrecoverable under the fresh-recovery policy.
    bytes32 internal constant ROLE_ENTROPY_INCIDENT_DECLARER =
        keccak256("ROLE_ENTROPY_INCIDENT_DECLARER");
    /// @notice Holds the declared reveal-request obligation for `ASYNC` collections.
    bytes32 internal constant ROLE_ENTROPY_REVEAL_OWNER = keccak256("ROLE_ENTROPY_REVEAL_OWNER");
    /// @notice Proposes artist bindings, declares platform works, withdraws proposals.
    bytes32 internal constant ROLE_ARTIST_REGISTRY_ADMIN = keccak256("ROLE_ARTIST_REGISTRY_ADMIN");
    /// @notice Governed arbiter for attribution disputes and rebinding approval.
    bytes32 internal constant ROLE_ATTRIBUTION_ARBITER = keccak256("ROLE_ATTRIBUTION_ARBITER");
    /// @notice Initiates and completes the governed artist-dormancy procedure.
    bytes32 internal constant ROLE_ARTIST_DORMANCY_ADMIN = keccak256("ROLE_ARTIST_DORMANCY_ADMIN");
    /// @notice Second-tier review of arbiter actions.
    bytes32 internal constant ROLE_ATTRIBUTION_APPEAL = keccak256("ROLE_ATTRIBUTION_APPEAL");
    /// @notice Executes the mandated fixity program cadence and records attestations.
    bytes32 internal constant ROLE_FIXITY_OPERATOR = keccak256("ROLE_FIXITY_OPERATOR");
    /// @notice Publishes state exports and event-history snapshots on cadence.
    bytes32 internal constant ROLE_EXPORT_PUBLISHER = keccak256("ROLE_EXPORT_PUBLISHER");
    /// @notice Operates recipient claim-aggregation rehearsals and UX gate evidence.
    bytes32 internal constant ROLE_CLAIM_ROUTER_OPERATOR = keccak256("ROLE_CLAIM_ROUTER_OPERATOR");
    /// @notice Receives emergency-withdrawal surplus; resolved through the admin
    ///         registry, never a stored raw address (ADR 0013 decision U5).
    bytes32 internal constant ROLE_EMERGENCY_RECIPIENT = keccak256("ROLE_EMERGENCY_RECIPIENT");
    /// @notice Configures collection entropy policy and provider assignments.
    bytes32 internal constant ROLE_ENTROPY_ADMIN = keccak256("ROLE_ENTROPY_ADMIN");
    /// @notice Receives protocol-fee and residual value flows; resolved through
    ///         the admin registry (ADR 0014 decision V4).
    bytes32 internal constant ROLE_TREASURY = keccak256("ROLE_TREASURY");
}
