// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IStreamRoleRegistry.sol";
import "./IStreamGovernanceExecutor.sol";
import "./Ownable.sol";
import "./StreamRoles.sol";

/// @notice Admin registry resolving the ADR 0004 [GOV-ROLES] `ROLE_*`
///         vocabulary to current holders.
/// @dev The permanent owner is the staged governance Executor supplied at
///     construction. Root-class roles are granted and revoked only by the
///     Executor; operational-class roles are also grantable
///     by registered role managers. The vocabulary is closed-world: grants
///     against constants outside the pinned [GOV-ROLES] table revert. Holder
///     sets are enumerable so redundancy gates and deployment checks can prove
///     the active authority graph from state reads alone.
contract StreamRoleRegistry is Ownable, IStreamRoleRegistry {
    /// @notice Schema version carried by role lifecycle events.
    uint16 public constant SCHEMA_VERSION = 1;

    bytes32 private constant STREAM_ROLE_MUTATION_V1 = keccak256("6529STREAM_ROLE_MUTATION_V1");
    bytes32 private constant STREAM_GLOBAL_ROLE_MUTATION_V1 =
        keccak256("6529STREAM_GLOBAL_ROLE_MUTATION_V1");
    bytes32 private constant STREAM_ROLE_MUTATION_SCOPE_V1 =
        keccak256("6529STREAM_ROLE_MUTATION_SCOPE_V1");
    bytes32 private constant STREAM_ROLE_MUTATION_STATE_V1 =
        keccak256("6529STREAM_ROLE_MUTATION_STATE_V1");
    bytes32 private constant STREAM_ROLE_MANAGER_CONFIG_V1 =
        keccak256("6529STREAM_ROLE_MANAGER_CONFIG_V1");
    bytes32 private constant STREAM_ROLE_MANAGER_CONFIG_STATE_V1 =
        keccak256("6529STREAM_ROLE_MANAGER_CONFIG_STATE_V1");
    bytes32 private constant STREAM_ROLE_MANAGER_CONFIG_MUTATION_V1 =
        keccak256("6529STREAM_ROLE_MANAGER_CONFIG_MUTATION_V1");
    uint8 private constant IMMEDIATE_TIGHTENING = 0;
    bytes4 private constant SYSTEM_MANIFEST_BOOTSTRAP_STATE_SELECTOR = 0x8a2d979b;
    uint8 private constant DELAYED_LOOSENING = 1;

    mapping(address => bool) private _roleManagers;
    mapping(address => bytes32) private _roleManagerConfigChain;
    mapping(address => uint64) private _roleManagerConfigRevision;
    mapping(bytes32 => address[]) private _roleHolders;
    // holder => (index + 1) into _roleHolders[role]; zero means not a holder.
    mapping(bytes32 => mapping(address => uint256)) private _roleHolderIndex;
    mapping(bytes32 => bytes32) private _roleMutationChain;
    mapping(bytes32 => uint64) private _roleMutationRevision;
    bytes32 private _globalRoleMutationChain;
    uint64 private _globalRoleMutationRevision;
    bool private _terminalGuardianFloorActivated;
    mapping(address => uint256) private _terminalVetoMembershipCount;

    constructor(address governanceExecutor) {
        if (
            governanceExecutor == address(0) || governanceExecutor.code.length == 0
                || _isEip7702DelegatedEOA(governanceExecutor)
        ) {
            revert InvalidGovernanceExecutor(governanceExecutor);
        }
        _transferOwnership(governanceExecutor);
    }

    function transferOwnership(address) public pure override {
        revert DirectRoleRegistryOwnershipMutationDisabled();
    }

    function renounceOwnership() public pure override {
        revert DirectRoleRegistryOwnershipMutationDisabled();
    }

    /// @inheritdoc IStreamRoleRegistry
    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IStreamRoleRegistry).interfaceId || interfaceId == 0x01ffc9a7;
    }

    /// @inheritdoc IStreamRoleRegistry
    function grantRole(bytes32 role, address holder) external override {
        uint8 grantClass = roleGrantClass(role);
        _checkRoleActor(role, grantClass);
        _grant(role, holder, grantClass, role == StreamRoles.ROLE_TERMINAL_FREEZE_VETO);
    }

    /// @inheritdoc IStreamRoleRegistry
    function revokeRole(bytes32 role, address holder) external override {
        uint8 grantClass = roleGrantClass(role);
        _checkRoleActor(role, grantClass);
        _revoke(role, holder, grantClass, role == StreamRoles.ROLE_TERMINAL_FREEZE_VETO);
    }

    /// @inheritdoc IStreamRoleRegistry
    function grantScopedRole(bytes32 baseRole, bytes32 scopeHash, address holder)
        external
        override
    {
        uint8 grantClass = _scopableGrantClass(baseRole);
        _checkRoleActor(baseRole, grantClass);
        _grant(
            scopedRole(baseRole, scopeHash),
            holder,
            grantClass,
            baseRole == StreamRoles.ROLE_TERMINAL_FREEZE_VETO
        );
    }

    /// @inheritdoc IStreamRoleRegistry
    function revokeScopedRole(bytes32 baseRole, bytes32 scopeHash, address holder)
        external
        override
    {
        uint8 grantClass = _scopableGrantClass(baseRole);
        _checkRoleActor(baseRole, grantClass);
        _revoke(
            scopedRole(baseRole, scopeHash),
            holder,
            grantClass,
            baseRole == StreamRoles.ROLE_TERMINAL_FREEZE_VETO
        );
    }

    function _grant(bytes32 role, address holder, uint8 grantClass, bool terminalVetoRole) private {
        if (holder == address(0)) {
            revert ZeroRoleHolder(role);
        }
        if (_roleHolderIndex[role][holder] != 0) {
            revert RoleAlreadyGranted(role, holder);
        }
        if (terminalVetoRole) {
            if (holder.code.length == 0) {
                revert TerminalFreezeVetoGuardianMustHaveCode(holder);
            }
            if (_isEip7702DelegatedEOA(holder)) {
                revert TerminalFreezeVetoGuardianDelegatedEOA(holder);
            }
            if (_roleHolders[role].length >= 16) {
                revert TerminalFreezeVetoGuardianCap(_roleHolders[role].length);
            }
            IStreamGovernanceExecutor executor = IStreamGovernanceExecutor(owner());
            // Identity disjointness needs only the root address; the executor
            // validates the code hash and revision at its control boundary.
            // slither-disable-next-line unused-return
            (address governanceRoot,,) = executor.governanceRootState();
            if (executor.isProposer(holder) || holder == governanceRoot) {
                revert GovernanceIdentityRoleOverlap(holder, StreamRoles.ROLE_TERMINAL_FREEZE_VETO);
            }
        }
        _checkDisjointness(role, holder);
        bytes32 governanceActionId = bytes32(0);
        if (msg.sender == owner()) {
            governanceActionId = _requireGovernanceRoleTransition(role, holder, false, true);
        }
        _roleHolders[role].push(holder);
        _roleHolderIndex[role][holder] = _roleHolders[role].length;
        if (terminalVetoRole) _terminalVetoMembershipCount[holder] += 1;
        if (role == StreamRoles.ROLE_TERMINAL_FREEZE_VETO && _roleHolders[role].length >= 2) {
            _terminalGuardianFloorActivated = true;
        }
        _appendRoleMutation(role, holder, true, governanceActionId);
        emit StreamRoleGranted(
            SCHEMA_VERSION, role, holder, grantClass, msg.sender, governanceActionId
        );
    }

    function _revoke(bytes32 role, address holder, uint8 grantClass, bool terminalVetoRole)
        private
    {
        uint256 indexPlusOne = _roleHolderIndex[role][holder];
        if (indexPlusOne == 0) {
            revert RoleNotGranted(role, holder);
        }
        if (
            role == StreamRoles.ROLE_TERMINAL_FREEZE_VETO && _terminalGuardianFloorActivated
                && _roleHolders[role].length <= 2
        ) {
            revert TerminalFreezeVetoGuardianFloor(_roleHolders[role].length);
        }
        bytes32 governanceActionId = bytes32(0);
        if (msg.sender == owner()) {
            governanceActionId = _requireGovernanceRoleTransition(role, holder, true, false);
        }
        address[] storage holders = _roleHolders[role];
        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = holders.length - 1;
        if (index != lastIndex) {
            address moved = holders[lastIndex];
            holders[index] = moved;
            _roleHolderIndex[role][moved] = indexPlusOne;
        }
        holders.pop();
        delete _roleHolderIndex[role][holder];
        if (terminalVetoRole) _terminalVetoMembershipCount[holder] -= 1;
        _appendRoleMutation(role, holder, false, governanceActionId);
        emit StreamRoleRevoked(
            SCHEMA_VERSION, role, holder, grantClass, msg.sender, governanceActionId
        );
    }

    /// @inheritdoc IStreamRoleRegistry
    function registerRoleManager(address account, bool enabled) external override onlyOwner {
        if (account == address(0)) {
            revert ZeroRoleHolder(bytes32(0));
        }
        bool currentEnabled = _roleManagers[account];
        if (currentEnabled == enabled) revert RoleManagerConfigNoOp(account, enabled);
        bytes32 governanceActionId = _requireGovernanceRoleTransition(
            STREAM_ROLE_MANAGER_CONFIG_V1, account, currentEnabled, enabled
        );
        _roleManagers[account] = enabled;
        (bytes32 configChainHash, uint64 configRevision) =
            _appendRoleManagerConfigMutation(account, enabled);
        _appendRoleMutation(STREAM_ROLE_MANAGER_CONFIG_V1, account, enabled, governanceActionId);
        emit RoleManagerUpdated(
            SCHEMA_VERSION,
            account,
            enabled,
            msg.sender,
            configChainHash,
            configRevision,
            governanceActionId
        );
    }

    /// @inheritdoc IStreamRoleRegistry
    function hasRole(bytes32 role, address account) public view override returns (bool) {
        return _roleHolderIndex[role][account] != 0;
    }

    /// @inheritdoc IStreamRoleRegistry
    function hasAnyTerminalFreezeVetoRole(address account) external view override returns (bool) {
        return _terminalVetoMembershipCount[account] != 0;
    }

    /// @inheritdoc IStreamRoleRegistry
    function terminalFreezeVetoMembershipCount(address account)
        external
        view
        override
        returns (uint256)
    {
        return _terminalVetoMembershipCount[account];
    }

    /// @inheritdoc IStreamRoleRegistry
    function roleHolderCount(bytes32 role) public view override returns (uint256) {
        return _roleHolders[role].length;
    }

    /// @inheritdoc IStreamRoleRegistry
    function roleHolderAt(bytes32 role, uint256 index) public view override returns (address) {
        if (index >= _roleHolders[role].length) {
            revert RoleHolderIndexOutOfBounds(role, index);
        }
        return _roleHolders[role][index];
    }

    /// @inheritdoc IStreamRoleRegistry
    function roleMutationState(bytes32 role)
        external
        view
        override
        returns (bytes32 chainHash, uint64 revision)
    {
        return (_roleMutationChain[role], _roleMutationRevision[role]);
    }

    /// @inheritdoc IStreamRoleRegistry
    function scopedRoleMutationState(bytes32 baseRole, bytes32 scopeHash)
        external
        view
        override
        returns (bytes32 role, bytes32 chainHash, uint64 revision)
    {
        role = scopedRole(baseRole, scopeHash);
        if (!isScopableRole(baseRole)) revert UnknownRole(baseRole);
        chainHash = _roleMutationChain[role];
        revision = _roleMutationRevision[role];
    }

    /// @inheritdoc IStreamRoleRegistry
    function globalRoleMutationState()
        external
        view
        override
        returns (bytes32 chainHash, uint64 revision)
    {
        return (_globalRoleMutationChain, _globalRoleMutationRevision);
    }

    /// @inheritdoc IStreamRoleRegistry
    function resolveRole(bytes32 role) public view override returns (address holder) {
        uint256 count = _roleHolders[role].length;
        if (count == 0) {
            revert RoleUnresolved(role);
        }
        if (count > 1) {
            revert AmbiguousRoleResolution(role, count);
        }
        return _roleHolders[role][0];
    }

    /// @inheritdoc IStreamRoleRegistry
    function emergencyRecipient() external view override returns (address) {
        return resolveRole(StreamRoles.ROLE_EMERGENCY_RECIPIENT);
    }

    /// @inheritdoc IStreamRoleRegistry
    function roleGrantClass(bytes32 role) public pure override returns (uint8) {
        uint8 grantClass = _grantClassOrZero(role);
        if (grantClass == 0) {
            revert UnknownRole(role);
        }
        return grantClass;
    }

    /// @inheritdoc IStreamRoleRegistry
    function isKnownRole(bytes32 role) public pure override returns (bool) {
        return _grantClassOrZero(role) != 0;
    }

    /// @inheritdoc IStreamRoleRegistry
    function roleRedundancy(bytes32 role)
        public
        view
        override
        returns (uint256 holderCount, uint256 contractHolderCount)
    {
        address[] storage holders = _roleHolders[role];
        holderCount = holders.length;
        for (uint256 i = 0; i < holderCount; i++) {
            if (holders[i].code.length > 0 && !_isEip7702DelegatedEOA(holders[i])) {
                contractHolderCount++;
            }
        }
    }

    /// @inheritdoc IStreamRoleRegistry
    function isRoleRedundant(bytes32 role) external view override returns (bool) {
        (uint256 holderCount, uint256 contractHolderCount) = roleRedundancy(role);
        return holderCount >= 2 && contractHolderCount == holderCount;
    }

    /// @inheritdoc IStreamRoleRegistry
    function isRoleManager(address account) external view override returns (bool) {
        return _roleManagers[account];
    }

    /// @notice Returns the manager-address-scoped exact governance chain.
    /// @dev This chain is deliberately independent from operational-role and
    ///      global audit mutations so a compromised manager cannot stale its
    ///      own root-initiated removal.
    function roleManagerConfigMutationState(address account)
        external
        view
        override
        returns (bytes32 chainHash, uint64 revision)
    {
        return (_roleManagerConfigChain[account], _roleManagerConfigRevision[account]);
    }

    /// @inheritdoc IStreamRoleRegistry
    function scopedRole(bytes32 baseRole, bytes32 scopeHash)
        public
        pure
        override
        returns (bytes32)
    {
        return keccak256(abi.encode(baseRole, scopeHash));
    }

    /// @inheritdoc IStreamRoleRegistry
    function isScopableRole(bytes32 baseRole) public pure override returns (bool) {
        // Only per-scope terminal-freeze veto guardians are scopable today
        // (ADR 0004 [GOV-WINDOWS] veto surface). Extending the set amends this.
        return baseRole == StreamRoles.ROLE_TERMINAL_FREEZE_VETO;
    }

    function _scopableGrantClass(bytes32 baseRole) private pure returns (uint8) {
        if (!isScopableRole(baseRole)) {
            revert UnknownRole(baseRole);
        }
        return roleGrantClass(baseRole);
    }

    function _checkRoleActor(bytes32 role, uint8 grantClass) private view {
        if (msg.sender == owner()) {
            return;
        }
        if (grantClass == StreamRoles.GRANT_CLASS_OPERATIONAL && _roleManagers[msg.sender]) {
            return;
        }
        revert RoleActorNotAuthorized(role, msg.sender);
    }

    function _appendRoleMutation(
        bytes32 role,
        address holder,
        bool granted,
        bytes32 governanceActionId
    ) private {
        uint64 roleRevision = _roleMutationRevision[role];
        uint64 globalRevision = _globalRoleMutationRevision;
        if (roleRevision == type(uint64).max || globalRevision == type(uint64).max) {
            revert RoleMutationRevisionOverflow(role);
        }
        unchecked {
            roleRevision += 1;
            globalRevision += 1;
        }
        bytes32 roleChainHash = keccak256(
            abi.encode(
                STREAM_ROLE_MUTATION_V1,
                _roleMutationChain[role],
                uint256(block.chainid),
                address(this),
                role,
                holder,
                granted,
                roleRevision
            )
        );
        bytes32 globalChainHash = keccak256(
            abi.encode(
                STREAM_GLOBAL_ROLE_MUTATION_V1,
                _globalRoleMutationChain,
                uint256(block.chainid),
                address(this),
                role,
                holder,
                granted,
                globalRevision
            )
        );
        _roleMutationChain[role] = roleChainHash;
        _roleMutationRevision[role] = roleRevision;
        _globalRoleMutationChain = globalChainHash;
        _globalRoleMutationRevision = globalRevision;
        emit RoleMutationCommitted(
            SCHEMA_VERSION,
            role,
            holder,
            granted,
            roleChainHash,
            roleRevision,
            globalChainHash,
            globalRevision,
            governanceActionId
        );
    }

    function _appendRoleManagerConfigMutation(address account, bool enabled)
        private
        returns (bytes32 chainHash, uint64 revision)
    {
        revision = _roleManagerConfigRevision[account];
        if (revision == type(uint64).max) {
            revert RoleMutationRevisionOverflow(STREAM_ROLE_MANAGER_CONFIG_V1);
        }
        unchecked {
            revision += 1;
        }
        chainHash = keccak256(
            abi.encode(
                STREAM_ROLE_MANAGER_CONFIG_MUTATION_V1,
                _roleManagerConfigChain[account],
                uint256(block.chainid),
                address(this),
                account,
                enabled,
                revision
            )
        );
        _roleManagerConfigChain[account] = chainHash;
        _roleManagerConfigRevision[account] = revision;
    }

    function _requireGovernanceRoleTransition(
        bytes32 role,
        address holder,
        bool oldGranted,
        bool newGranted
    ) private view returns (bytes32 governanceActionId) {
        (
            bool executing,
            bytes32 actionId,
            uint8 actionClass,
            bytes32 actualScopeHash,
            bytes32 actualOldStateHash,
            bytes32 actualNewStateHash
        ) = IStreamGovernanceExecutor(owner()).currentAction();
        if (!executing) {
            if (
                role == StreamRoles.ROLE_TERMINAL_FREEZE_VETO && !oldGranted && newGranted
                    && _isBootstrapGuardianGrant()
            ) return bytes32(0);
            revert RoleGovernanceActionNotExecuting();
        }
        if (actionId == bytes32(0)) revert RoleGovernanceActionIdZero();
        uint8 expectedClass = role == STREAM_ROLE_MANAGER_CONFIG_V1 && !newGranted
            ? IMMEDIATE_TIGHTENING
            : DELAYED_LOOSENING;
        if (actionClass != expectedClass) {
            revert RoleGovernanceActionClassMismatch(expectedClass, actionClass);
        }

        bytes32 expectedScopeHash = keccak256(
            abi.encode(
                STREAM_ROLE_MUTATION_SCOPE_V1, uint256(block.chainid), address(this), role, holder
            )
        );
        bytes32 expectedOldStateHash;
        bytes32 expectedNewStateHash;
        if (role == STREAM_ROLE_MANAGER_CONFIG_V1) {
            (expectedOldStateHash, expectedNewStateHash) = _roleManagerTransitionStateHashes(
                expectedScopeHash, holder, oldGranted, newGranted
            );
        } else {
            (expectedOldStateHash, expectedNewStateHash) =
                _roleTransitionStateHashes(expectedScopeHash, role, holder, oldGranted, newGranted);
        }
        if (actualScopeHash != expectedScopeHash) {
            revert RoleGovernanceScopeHashMismatch(expectedScopeHash, actualScopeHash);
        }
        if (actualOldStateHash != expectedOldStateHash) {
            revert RoleGovernanceOldStateHashMismatch(expectedOldStateHash, actualOldStateHash);
        }
        if (actualNewStateHash != expectedNewStateHash) {
            revert RoleGovernanceNewStateHashMismatch(expectedNewStateHash, actualNewStateHash);
        }
        return actionId;
    }

    function _roleTransitionStateHashes(
        bytes32 scopeHash,
        bytes32 role,
        address holder,
        bool oldGranted,
        bool newGranted
    ) private view returns (bytes32 oldStateHash, bytes32 newStateHash) {
        uint64 roleRevision = _roleMutationRevision[role];
        uint64 globalRevision = _globalRoleMutationRevision;
        if (roleRevision == type(uint64).max || globalRevision == type(uint64).max) {
            revert RoleMutationRevisionOverflow(role);
        }
        uint64 nextRoleRevision;
        uint64 nextGlobalRevision;
        unchecked {
            nextRoleRevision = roleRevision + 1;
            nextGlobalRevision = globalRevision + 1;
        }
        bytes32 roleChainHash = _roleMutationChain[role];
        bytes32 globalChainHash = _globalRoleMutationChain;
        bytes32 nextRoleChainHash = keccak256(
            abi.encode(
                STREAM_ROLE_MUTATION_V1,
                roleChainHash,
                uint256(block.chainid),
                address(this),
                role,
                holder,
                newGranted,
                nextRoleRevision
            )
        );
        bytes32 nextGlobalChainHash = keccak256(
            abi.encode(
                STREAM_GLOBAL_ROLE_MUTATION_V1,
                globalChainHash,
                uint256(block.chainid),
                address(this),
                role,
                holder,
                newGranted,
                nextGlobalRevision
            )
        );
        oldStateHash = _roleMutationStateHash(
            scopeHash, oldGranted, roleChainHash, roleRevision, globalChainHash, globalRevision
        );
        newStateHash = _roleMutationStateHash(
            scopeHash,
            newGranted,
            nextRoleChainHash,
            nextRoleRevision,
            nextGlobalChainHash,
            nextGlobalRevision
        );
    }

    /// @dev Manager enablement is delayed, while removal is an immediate
    ///      tightening. Its exact transition deliberately excludes the global
    ///      role chain: a compromised manager may advance that chain through
    ///      direct operational writes and must not be able to censor its own
    ///      root-initiated removal. The manager-address-scoped config chain
    ///      remains monotonic and cannot be touched by a RoleManager.
    function _roleManagerTransitionStateHashes(
        bytes32 scopeHash,
        address account,
        bool oldEnabled,
        bool newEnabled
    ) private view returns (bytes32 oldStateHash, bytes32 newStateHash) {
        uint64 revision = _roleManagerConfigRevision[account];
        if (revision == type(uint64).max) {
            revert RoleMutationRevisionOverflow(STREAM_ROLE_MANAGER_CONFIG_V1);
        }
        uint64 nextRevision;
        unchecked {
            nextRevision = revision + 1;
        }
        bytes32 chainHash = _roleManagerConfigChain[account];
        bytes32 nextChainHash = keccak256(
            abi.encode(
                STREAM_ROLE_MANAGER_CONFIG_MUTATION_V1,
                chainHash,
                uint256(block.chainid),
                address(this),
                account,
                newEnabled,
                nextRevision
            )
        );
        oldStateHash = _roleManagerConfigStateHash(scopeHash, oldEnabled, chainHash, revision);
        newStateHash =
            _roleManagerConfigStateHash(scopeHash, newEnabled, nextChainHash, nextRevision);
    }

    function _roleManagerConfigStateHash(
        bytes32 scopeHash,
        bool enabled,
        bytes32 chainHash,
        uint64 revision
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                STREAM_ROLE_MANAGER_CONFIG_STATE_V1,
                uint256(block.chainid),
                address(this),
                scopeHash,
                enabled,
                chainHash,
                revision
            )
        );
    }

    function _roleMutationStateHash(
        bytes32 scopeHash,
        bool granted,
        bytes32 roleChainHash,
        uint64 roleRevision,
        bytes32 globalChainHash,
        uint64 globalRevision
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                STREAM_ROLE_MUTATION_STATE_V1,
                uint256(block.chainid),
                address(this),
                scopeHash,
                granted,
                roleChainHash,
                roleRevision,
                globalChainHash,
                globalRevision
            )
        );
    }

    /// @dev The only owner-originated mutation outside an executing action is
    ///      the initial terminal-veto population performed from the Executor's
    ///      one-way bootstrap bind. The Executor has already bound this exact
    ///      registry in memory/storage, while `bound` and `sealed` are still
    ///      false. Once bind completes this exception can never be re-entered.
    function _isBootstrapGuardianGrant() private view returns (bool) {
        (bool success, bytes memory result) =
            owner().staticcall(abi.encodeWithSelector(SYSTEM_MANIFEST_BOOTSTRAP_STATE_SELECTOR));
        if (!success || result.length < 96) return false;
        (bool bound, bool isSealed, address roleRegistry) =
            abi.decode(result, (bool, bool, address));
        return !bound && !isSealed && roleRegistry == address(this);
    }

    /// @dev [GOV-WINDOWS] rule 3: pause guardians cannot unpause and unpause
    ///     holders cannot pause; one account may never hold both authorities.
    function _checkDisjointness(bytes32 role, address holder) private view {
        if (role == StreamRoles.ROLE_PAUSE_GUARDIAN && hasRole(StreamRoles.ROLE_UNPAUSE, holder)) {
            revert DisjointRoleConflict(role, StreamRoles.ROLE_UNPAUSE, holder);
        }
        if (role == StreamRoles.ROLE_UNPAUSE && hasRole(StreamRoles.ROLE_PAUSE_GUARDIAN, holder)) {
            revert DisjointRoleConflict(role, StreamRoles.ROLE_PAUSE_GUARDIAN, holder);
        }
    }

    /// @dev EIP-7702 designations are exactly `0xef0100 || delegate` (23
    ///      bytes). They expose code but remain EOAs for the emergency-holder
    ///      classification pinned by [GOV-WINDOWS].
    function _isEip7702DelegatedEOA(address account) private view returns (bool delegated) {
        if (account.code.length != 23) return false;
        bytes3 prefix;
        assembly ("memory-safe") {
            extcodecopy(account, 0, 0, 3)
            prefix := mload(0)
        }
        return prefix == 0xef0100;
    }

    function _grantClassOrZero(bytes32 role) private pure returns (uint8) {
        if (
            role == StreamRoles.ROLE_PAUSE_GUARDIAN || role == StreamRoles.ROLE_UNPAUSE
                || role == StreamRoles.ROLE_COLLECTION_FINALITY_ADMIN
                || role == StreamRoles.ROLE_TERMINAL_FREEZE_VETO
                || role == StreamRoles.ROLE_ATTRIBUTION_ARBITER
                || role == StreamRoles.ROLE_ARTIST_DORMANCY_ADMIN
                || role == StreamRoles.ROLE_ATTRIBUTION_APPEAL
                || role == StreamRoles.ROLE_EMERGENCY_RECIPIENT || role == StreamRoles.ROLE_TREASURY
        ) {
            return StreamRoles.GRANT_CLASS_ROOT;
        }
        if (
            role == StreamRoles.ROLE_ENTROPY_INCIDENT_DECLARER
                || role == StreamRoles.ROLE_ENTROPY_REVEAL_OWNER
                || role == StreamRoles.ROLE_ARTIST_REGISTRY_ADMIN
                || role == StreamRoles.ROLE_FIXITY_OPERATOR
                || role == StreamRoles.ROLE_EXPORT_PUBLISHER
                || role == StreamRoles.ROLE_CLAIM_ROUTER_OPERATOR
                || role == StreamRoles.ROLE_ENTROPY_ADMIN
        ) {
            return StreamRoles.GRANT_CLASS_OPERATIONAL;
        }
        return 0;
    }
}
