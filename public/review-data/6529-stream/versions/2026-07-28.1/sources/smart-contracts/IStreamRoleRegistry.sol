// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Role-resolution registry for the ADR 0004 [GOV-ROLES] vocabulary.
/// @dev Long-lived authorities are `bytes32` role references resolved through
///     this registry at call time, never raw stored addresses (ADR 0013
///     decision U5). Root-class roles are granted and revoked only by the
///     permanently owning governance Executor; operational-class roles are also
///     grantable by registered role managers. Role-redundancy semantics for
///     the [GOV-WINDOWS] rule 2 emergency assumption are exposed as views so
///     conformance-matrix gates can verify them onchain.
interface IStreamRoleRegistry {
    /// @notice Reverts when a role constant is outside the pinned [GOV-ROLES] vocabulary.
    error UnknownRole(bytes32 role);
    /// @notice Reverts when the caller may not grant or revoke the role class.
    error RoleActorNotAuthorized(bytes32 role, address actor);
    /// @notice Reverts when granting a role the holder already has.
    error RoleAlreadyGranted(bytes32 role, address holder);
    /// @notice Reverts when revoking a role the holder does not have.
    error RoleNotGranted(bytes32 role, address holder);
    /// @notice Reverts on zero-address holders and role managers.
    error ZeroRoleHolder(bytes32 role);
    /// @notice Reverts when resolving a role with no current holder.
    error RoleUnresolved(bytes32 role);
    /// @notice Reverts when single-address resolution meets multiple holders.
    error AmbiguousRoleResolution(bytes32 role, uint256 holderCount);
    /// @notice Reverts when a grant would violate a pinned role-disjointness rule
    ///         ([GOV-WINDOWS] rule 3: pause guardians cannot unpause and
    ///         unpause holders cannot pause).
    error DisjointRoleConflict(bytes32 role, bytes32 conflictingRole, address holder);
    /// @notice Reverts when a holder enumeration index is out of bounds.
    error RoleHolderIndexOutOfBounds(bytes32 role, uint256 index);
    /// @notice Reverts if a role's append-only mutation counter can no longer advance.
    error RoleMutationRevisionOverflow(bytes32 role);
    error InvalidGovernanceExecutor(address governanceExecutor);
    error DirectRoleRegistryOwnershipMutationDisabled();
    error TerminalFreezeVetoGuardianFloor(uint256 holderCount);
    error TerminalFreezeVetoGuardianMustHaveCode(address holder);
    error TerminalFreezeVetoGuardianDelegatedEOA(address holder);
    error TerminalFreezeVetoGuardianCap(uint256 holderCount);
    error GovernanceIdentityRoleOverlap(address account, bytes32 role);
    /// @notice Reverts when an Executor-owned mutation is not the active
    ///         target call of a Governance V2 batch.
    error RoleGovernanceActionNotExecuting();
    /// @notice Reverts when the active Executor context exposes no action id.
    error RoleGovernanceActionIdZero();
    /// @notice Reverts when an Executor-owned mutation is not delayed class 1.
    error RoleGovernanceActionClassMismatch(uint8 expectedClass, uint8 actualClass);
    /// @notice Reverts when the per-call role/config scope is not exact.
    error RoleGovernanceScopeHashMismatch(bytes32 expectedHash, bytes32 actualHash);
    /// @notice Reverts when the live pre-mutation role state is not committed.
    error RoleGovernanceOldStateHashMismatch(bytes32 expectedHash, bytes32 actualHash);
    /// @notice Reverts when the complete post-mutation role state is not committed.
    error RoleGovernanceNewStateHashMismatch(bytes32 expectedHash, bytes32 actualHash);
    /// @notice Reverts when a RoleManager configuration write changes nothing.
    error RoleManagerConfigNoOp(address account, bool enabled);

    event StreamRoleGranted(
        uint16 schemaVersion,
        bytes32 indexed role,
        address indexed holder,
        uint8 grantClass,
        address actor,
        bytes32 indexed actionId
    );

    event StreamRoleRevoked(
        uint16 schemaVersion,
        bytes32 indexed role,
        address indexed holder,
        uint8 grantClass,
        address actor,
        bytes32 indexed actionId
    );

    event RoleManagerUpdated(
        uint16 schemaVersion,
        address indexed account,
        bool enabled,
        address indexed admin,
        bytes32 configChainHash,
        uint64 configRevision,
        bytes32 indexed actionId
    );

    /// @notice Emitted for every successful role-holder mutation.
    /// @dev `roleChainHash` is scoped to `role`; `globalChainHash` commits to
    ///      every grant/revoke across the registry. Both counters are
    ///      monotonic, so a holder set that returns A -> B -> A remains
    ///      distinguishable from the original A state.
    event RoleMutationCommitted(
        uint16 schemaVersion,
        bytes32 indexed role,
        address indexed holder,
        bool granted,
        bytes32 roleChainHash,
        uint64 roleRevision,
        bytes32 globalChainHash,
        uint64 globalRevision,
        bytes32 indexed actionId
    );

    /// @notice ERC-165 identity used by executor-first bootstrap binding.
    function supportsInterface(bytes4 interfaceId) external pure returns (bool);

    /// @notice Grants `role` to `holder` under the role's grant class rules.
    function grantRole(bytes32 role, address holder) external;

    /// @notice Revokes `role` from `holder` under the role's grant class rules.
    function revokeRole(bytes32 role, address holder) external;

    /// @notice Grants a per-scope instance of a scopable base role
    ///         (`scopedRole(baseRole, scopeHash)`) to `holder`.
    /// @dev Keeps the vocabulary closed at the base level while supporting the
    ///     additive per-scope designation of ADR 0004 [GOV-WINDOWS] (for
    ///     example per-scope terminal-freeze veto guardians). Authority follows
    ///     the base role's grant class. Reverts `UnknownRole` when `baseRole`
    ///     is not scopable.
    function grantScopedRole(bytes32 baseRole, bytes32 scopeHash, address holder) external;

    /// @notice Revokes a per-scope instance of a scopable base role from `holder`.
    function revokeScopedRole(bytes32 baseRole, bytes32 scopeHash, address holder) external;

    /// @notice Returns the derived per-scope role key
    ///         `keccak256(abi.encode(baseRole, scopeHash))`.
    function scopedRole(bytes32 baseRole, bytes32 scopeHash) external pure returns (bytes32);

    /// @notice Returns true when `baseRole` may be granted per-scope.
    function isScopableRole(bytes32 baseRole) external pure returns (bool);

    /// @notice Returns true when `account` currently holds `role`.
    function hasRole(bytes32 role, address account) external view returns (bool);

    /// @notice Returns true when `account` holds the global terminal-veto role
    ///         or any derived per-scope instance of it.
    function hasAnyTerminalFreezeVetoRole(address account) external view returns (bool);

    /// @notice Returns the exact number of global plus scoped terminal-veto
    ///         memberships currently held by `account`.
    function terminalFreezeVetoMembershipCount(address account) external view returns (uint256);

    /// @notice Returns the number of current holders of `role`.
    function roleHolderCount(bytes32 role) external view returns (uint256);

    /// @notice Returns the holder of `role` at `index` (unordered enumeration).
    function roleHolderAt(bytes32 role, uint256 index) external view returns (address);

    /// @notice Returns the append-only mutation chain and revision for an
    ///         exact role key. The role key may be either a base role or a
    ///         derived scoped role returned by `scopedRole`.
    function roleMutationState(bytes32 role)
        external
        view
        returns (bytes32 chainHash, uint64 revision);

    /// @notice Returns the append-only mutation state for a derived scoped role.
    function scopedRoleMutationState(bytes32 baseRole, bytes32 scopeHash)
        external
        view
        returns (bytes32 role, bytes32 chainHash, uint64 revision);

    /// @notice Returns the append-only aggregate of every role grant/revoke.
    function globalRoleMutationState() external view returns (bytes32 chainHash, uint64 revision);

    /// @notice Resolves `role` to its single current holder; reverts when the
    ///         role has zero or multiple holders.
    function resolveRole(bytes32 role) external view returns (address holder);

    /// @notice Resolves `ROLE_EMERGENCY_RECIPIENT` through the registry.
    /// @dev Never a stored raw address (ADR 0004 [GOV-ROLES]; ADR 0013 decision U5).
    function emergencyRecipient() external view returns (address);

    /// @notice Returns the pinned grant class for `role`
    ///         (1 = root, 2 = operational); reverts for unknown roles.
    function roleGrantClass(bytes32 role) external pure returns (uint8);

    /// @notice Returns true when `role` is in the pinned [GOV-ROLES] vocabulary.
    function isKnownRole(bytes32 role) external pure returns (bool);

    /// @notice Returns the holder count and the count of non-EIP-7702 holders
    ///         with deployed code observed at call time, for [GOV-WINDOWS]
    ///         rule 2 redundancy gates.
    /// @dev The contract-holder count is a necessary-but-insufficient onchain
    ///     proxy for redundancy: it cannot prove the holders are independently
    ///     controlled. The exact EIP-7702 designation is rejected on grant and
    ///     excluded if observed later, while true independent control remains a
    ///     ceremony/off-chain governance obligation ([GOV-MATERIAL];
    ///     [LTA-GUARDIAN] rule 8).
    function roleRedundancy(bytes32 role)
        external
        view
        returns (uint256 holderCount, uint256 contractHolderCount);

    /// @notice Returns true when `role` satisfies the onchain proxy for the
    ///         [GOV-WINDOWS] rule 2 emergency-holder floor: at least two
    ///         holders, all of which expose deployed code at observation time
    ///         and none of which carries the exact EIP-7702 delegation
    ///         designation.
    /// @dev Necessary but not sufficient. This gate cannot establish that the
    ///     holders are independently controlled; that remains a ceremony/
    ///     off-chain obligation ([GOV-MATERIAL]; [LTA-GUARDIAN] rule 8). A
    ///     `true` result is a floor, not a proof of redundancy.
    function isRoleRedundant(bytes32 role) external view returns (bool);

    /// @notice Returns true when `account` is a registered role manager.
    function isRoleManager(address account) external view returns (bool);

    /// @notice Enables or disables an operational-role manager through the
    ///         exact Governance V2 transition committed for `account`.
    /// @dev Enablement is delayed class 1. Disabling an existing manager is
    ///      immediate tightening class 0 and uses the account-scoped config
    ///      chain so the manager cannot censor its own removal.
    function registerRoleManager(address account, bool enabled) external;

    /// @notice Returns the manager-address-scoped exact governance mutation
    ///         chain and revision used to schedule manager enable/disable.
    /// @dev This state is intentionally independent from manager-controlled
    ///      operational-role and global audit mutations, so a compromised
    ///      manager cannot stale its own root-initiated removal.
    function roleManagerConfigMutationState(address account)
        external
        view
        returns (bytes32 chainHash, uint64 revision);
}
