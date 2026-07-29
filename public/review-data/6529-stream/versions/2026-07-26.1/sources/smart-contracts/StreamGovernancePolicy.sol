// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IStreamGovernanceExecutor.sol";
import "./IStreamRoleRegistry.sol";
import "./StreamGovernanceBootstrap.sol";
import "./StreamRoles.sol";

/// @notice Linked policy/state-transition library for Executor-resident
///         governance configuration. Public functions execute by DELEGATECALL,
///         so `address(this)`, `msg.sender`, emitted events, and storage remain
///         those of the Executor while the validation bytecode stays outside
///         its EIP-170 envelope.
library StreamGovernancePolicy {
    uint16 private constant SCHEMA_VERSION = 1;
    bytes32 private constant TERMINAL_GUARDIAN_CONFIG_V1 =
        keccak256("6529STREAM_TERMINAL_GUARDIAN_CONFIG_V1");
    bytes32 private constant TERMINAL_GUARDIAN_SCOPE_V1 =
        keccak256("6529STREAM_TERMINAL_GUARDIAN_SCOPE_V1");
    bytes32 private constant INITIAL_TERMINAL_GUARDIAN_SET_V1 =
        keccak256("6529STREAM_INITIAL_TERMINAL_GUARDIAN_SET_V1");
    bytes32 private constant TERMINAL_GUARDIAN_HOLDER_V1 =
        keccak256("6529STREAM_TERMINAL_GUARDIAN_HOLDER_V1");
    bytes32 private constant GOVERNANCE_CONFIG_SCOPE_V1 =
        keccak256("6529STREAM_GOVERNANCE_CONFIG_SCOPE_V1");
    bytes32 private constant GOVERNANCE_CONFIG_STATE_V1 =
        keccak256("6529STREAM_GOVERNANCE_CONFIG_STATE_V1");
    bytes32 private constant GOVERNANCE_ROOT_SCOPE_V1 =
        keccak256("6529STREAM_GOVERNANCE_ROOT_SCOPE_V1");
    bytes32 private constant GOVERNANCE_ROOT_STATE_V1 =
        keccak256("6529STREAM_GOVERNANCE_ROOT_STATE_V1");
    bytes32 private constant GOVERNANCE_CONFIG_PROPOSER =
        keccak256("6529STREAM_GOVERNANCE_CONFIG_PROPOSER");
    bytes32 private constant GOVERNANCE_CONFIG_CANCELLER =
        keccak256("6529STREAM_GOVERNANCE_CONFIG_CANCELLER");
    bytes32 private constant GOVERNANCE_CONFIG_NATIVE_RECEIVER =
        keccak256("6529STREAM_GOVERNANCE_CONFIG_NATIVE_RECEIVER");
    bytes32 private constant GOVERNANCE_CONFIG_TIGHTENING_CALL =
        keccak256("6529STREAM_GOVERNANCE_CONFIG_TIGHTENING_CALL");
    bytes32 private constant GOVERNANCE_CONFIG_FREEZE_SELECTOR =
        keccak256("6529STREAM_GOVERNANCE_CONFIG_FREEZE_SELECTOR");

    struct AdminState {
        mapping(address => bool) proposers;
        mapping(address => bool) cancellers;
        mapping(address => uint64) proposerRevisions;
        mapping(address => uint64) cancellerRevisions;
        mapping(address => uint64) nativeReceiverRevisions;
        mapping(bytes32 => uint64) tighteningCallRevisions;
        mapping(bytes32 => uint64) freezeSelectorRevisions;
        mapping(bytes32 => uint64) actionProposerRevisions;
    }

    struct ExecutionContext {
        bool executing;
        bytes32 actionId;
        uint8 actionClass;
        bytes32 scopeHash;
        bytes32 oldValueHash;
        bytes32 newValueHash;
        uint256 batchLength;
        uint256 callIndex;
    }

    event GovernanceProposerUpdated(
        uint16 schemaVersion,
        address indexed account,
        bool enabled,
        uint64 revision,
        bytes32 indexed actionId
    );
    event GovernanceCancellerUpdated(
        uint16 schemaVersion,
        address indexed account,
        bool enabled,
        uint64 revision,
        bytes32 indexed actionId
    );
    event ApprovedNativeReceiverUpdated(
        uint16 schemaVersion,
        address indexed receiver,
        bool approved,
        uint64 revision,
        bytes32 indexed actionId
    );
    event TighteningCallUpdated(
        uint16 schemaVersion,
        address indexed target,
        bytes4 indexed selector,
        bool tightening,
        bytes32 targetCodeHash,
        uint64 revision,
        bytes32 indexed actionId
    );
    event FreezeSelectorUpdated(
        uint16 schemaVersion,
        address indexed target,
        bytes4 indexed selector,
        bool freeze,
        bytes32 targetCodeHash,
        uint64 revision,
        bytes32 indexed actionId
    );

    function snapshotActionProposerRevision(
        AdminState storage admin,
        bytes32 actionId,
        address proposer,
        bool privilegedProposer
    ) internal {
        if (!privilegedProposer) {
            admin.actionProposerRevisions[actionId] = admin.proposerRevisions[proposer];
        }
    }

    function requireActionProposerRevision(
        AdminState storage admin,
        bytes32 actionId,
        address proposer
    ) internal view {
        uint64 expected = admin.actionProposerRevisions[actionId];
        if (expected == 0) return;
        uint64 actual = admin.proposerRevisions[proposer];
        bool enabled = admin.proposers[proposer];
        if (!enabled || expected != actual) {
            revert IStreamGovernanceExecutor.GovernanceProposerAuthorizationDrift(
                actionId, proposer, expected, actual, enabled
            );
        }
    }

    function updateProposer(
        AdminState storage admin,
        IStreamRoleRegistry roleRegistry,
        address account,
        bool enabled,
        ExecutionContext memory ctx
    ) public {
        _requireIsolated(
            ctx,
            enabled
                ? StreamGovernanceActionClasses.DELAYED_LOOSENING
                : StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING
        );
        if (account == address(0)) revert IStreamGovernanceExecutor.ZeroProposer();
        if (enabled && roleRegistry.hasAnyTerminalFreezeVetoRole(account)) {
            revert IStreamGovernanceExecutor.GovernanceIdentityRoleOverlap(
                account, StreamRoles.ROLE_TERMINAL_FREEZE_VETO
            );
        }
        bool oldEnabled = admin.proposers[account];
        if (oldEnabled == enabled) {
            revert IStreamGovernanceExecutor.GovernanceConfigNoOp(
                GOVERNANCE_CONFIG_PROPOSER, account, enabled
            );
        }
        (bytes32 scopeHash, bytes32 oldHash, bytes32 newHash, uint64 revision) = governanceConfigTransitionHashes(
            GOVERNANCE_CONFIG_PROPOSER,
            account,
            oldEnabled,
            admin.proposerRevisions[account],
            enabled
        );
        _requireTransition(ctx, scopeHash, oldHash, newHash);
        admin.proposers[account] = enabled;
        admin.proposerRevisions[account] = revision;
        emit GovernanceProposerUpdated(SCHEMA_VERSION, account, enabled, revision, ctx.actionId);
    }

    function updateCanceller(
        AdminState storage admin,
        address account,
        bool enabled,
        ExecutionContext memory ctx
    ) public {
        _requireIsolated(
            ctx,
            enabled
                ? StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING
                : StreamGovernanceActionClasses.DELAYED_LOOSENING
        );
        if (account == address(0)) revert IStreamGovernanceExecutor.ZeroCanceller();
        bool oldEnabled = admin.cancellers[account];
        if (oldEnabled == enabled) {
            revert IStreamGovernanceExecutor.GovernanceConfigNoOp(
                GOVERNANCE_CONFIG_CANCELLER, account, enabled
            );
        }
        (bytes32 scopeHash, bytes32 oldHash, bytes32 newHash, uint64 revision) = governanceConfigTransitionHashes(
            GOVERNANCE_CONFIG_CANCELLER,
            account,
            oldEnabled,
            admin.cancellerRevisions[account],
            enabled
        );
        _requireTransition(ctx, scopeHash, oldHash, newHash);
        admin.cancellers[account] = enabled;
        admin.cancellerRevisions[account] = revision;
        emit GovernanceCancellerUpdated(SCHEMA_VERSION, account, enabled, revision, ctx.actionId);
    }

    function updateNativeReceiver(
        StreamGovernanceBootstrap.PolicyState storage policy,
        AdminState storage admin,
        address receiver,
        bool approved,
        ExecutionContext memory ctx
    ) public {
        _requireIsolated(
            ctx,
            approved
                ? StreamGovernanceActionClasses.DELAYED_LOOSENING
                : StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING
        );
        if (receiver == address(0)) revert IStreamGovernanceExecutor.ZeroNativeReceiver();
        bool oldApproved = policy.approvedNativeReceivers[receiver];
        if (oldApproved == approved) {
            revert IStreamGovernanceExecutor.GovernanceConfigNoOp(
                GOVERNANCE_CONFIG_NATIVE_RECEIVER, receiver, approved
            );
        }
        (bytes32 scopeHash, bytes32 oldHash, bytes32 newHash, uint64 revision) = governanceConfigTransitionHashes(
            GOVERNANCE_CONFIG_NATIVE_RECEIVER,
            receiver,
            oldApproved,
            admin.nativeReceiverRevisions[receiver],
            approved
        );
        _requireTransition(ctx, scopeHash, oldHash, newHash);
        policy.approvedNativeReceivers[receiver] = approved;
        admin.nativeReceiverRevisions[receiver] = revision;
        emit ApprovedNativeReceiverUpdated(
            SCHEMA_VERSION, receiver, approved, revision, ctx.actionId
        );
    }

    function updateTighteningCall(
        StreamGovernanceBootstrap.PolicyState storage policy,
        AdminState storage admin,
        address target,
        bytes4 selector,
        bool tightening,
        ExecutionContext memory ctx
    ) public {
        _requireIsolated(
            ctx,
            tightening
                ? StreamGovernanceActionClasses.DELAYED_LOOSENING
                : StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING
        );
        if (target == address(0)) revert IStreamGovernanceExecutor.ZeroTighteningTarget();
        if (selector == bytes4(0)) {
            revert IStreamGovernanceExecutor.ZeroTighteningSelector();
        }
        if (target == address(this)) {
            revert IStreamGovernanceExecutor.TighteningCallSelfTargetForbidden(selector);
        }
        bool oldEnabled = policy.tighteningCalls[target][selector];
        bytes32 oldCodeHash = policy.tighteningCallCodeHashes[target][selector];
        if (oldEnabled == tightening) {
            revert IStreamGovernanceExecutor.GovernanceConfigNoOp(
                GOVERNANCE_CONFIG_TIGHTENING_CALL, target, tightening
            );
        }
        if (oldEnabled) _requirePolicyCodeHash(target, selector, oldCodeHash);
        bytes32 newCodeHash = _enabledCodeHash(target, tightening);
        bytes32 key = keccak256(abi.encode(target, selector));
        (bytes32 scopeHash, bytes32 oldHash, bytes32 newHash, uint64 revision) = governanceSelectorConfigTransitionHashes(
            GOVERNANCE_CONFIG_TIGHTENING_CALL,
            target,
            selector,
            oldEnabled,
            oldCodeHash,
            admin.tighteningCallRevisions[key],
            tightening,
            newCodeHash
        );
        _requireTransition(ctx, scopeHash, oldHash, newHash);
        policy.tighteningCalls[target][selector] = tightening;
        policy.tighteningCallCodeHashes[target][selector] = newCodeHash;
        admin.tighteningCallRevisions[key] = revision;
        emit TighteningCallUpdated(
            SCHEMA_VERSION, target, selector, tightening, newCodeHash, revision, ctx.actionId
        );
    }

    function updateFreezeSelector(
        StreamGovernanceBootstrap.PolicyState storage policy,
        AdminState storage admin,
        address target,
        bytes4 selector,
        bool freeze,
        address manifestTailTarget,
        bytes4 manifestTailSelector,
        ExecutionContext memory ctx
    ) public {
        _requireIsolated(
            ctx,
            freeze
                ? StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING
                : StreamGovernanceActionClasses.DELAYED_LOOSENING
        );
        if (target == address(0)) revert IStreamGovernanceExecutor.ZeroFreezeTarget();
        if (selector == bytes4(0)) revert IStreamGovernanceExecutor.ZeroFreezeSelector();
        if (target == address(this)) {
            revert IStreamGovernanceExecutor.FreezeSelectorSelfTargetForbidden(selector);
        }
        if (freeze && target == manifestTailTarget && selector == manifestTailSelector) {
            revert IStreamGovernanceExecutor.InvalidManifestTailTrigger(target, selector);
        }
        if (
            freeze && policy.tailRules[target][selector].triggerCodeHash != bytes32(0)
                && (policy.tailRules[target][selector].allowedActionClassMask & 0x04) == 0
        ) {
            revert IStreamGovernanceExecutor.InvalidManifestTailTrigger(target, selector);
        }
        bool oldEnabled = policy.freezeSelectors[target][selector];
        bytes32 oldCodeHash = policy.freezeSelectorCodeHashes[target][selector];
        if (oldEnabled == freeze) {
            revert IStreamGovernanceExecutor.GovernanceConfigNoOp(
                GOVERNANCE_CONFIG_FREEZE_SELECTOR, target, freeze
            );
        }
        if (oldEnabled) _requirePolicyCodeHash(target, selector, oldCodeHash);
        bytes32 newCodeHash = _enabledCodeHash(target, freeze);
        bytes32 key = keccak256(abi.encode(target, selector));
        (bytes32 scopeHash, bytes32 oldHash, bytes32 newHash, uint64 revision) = governanceSelectorConfigTransitionHashes(
            GOVERNANCE_CONFIG_FREEZE_SELECTOR,
            target,
            selector,
            oldEnabled,
            oldCodeHash,
            admin.freezeSelectorRevisions[key],
            freeze,
            newCodeHash
        );
        _requireTransition(ctx, scopeHash, oldHash, newHash);
        policy.freezeSelectors[target][selector] = freeze;
        policy.freezeSelectorCodeHashes[target][selector] = newCodeHash;
        admin.freezeSelectorRevisions[key] = revision;
        emit FreezeSelectorUpdated(
            SCHEMA_VERSION, target, selector, freeze, newCodeHash, revision, ctx.actionId
        );
    }

    function _enabledCodeHash(address target, bool enabled) private view returns (bytes32) {
        if (!enabled) return bytes32(0);
        bytes32 codeHash = target.codehash;
        if (target.code.length == 0 || codeHash == bytes32(0) || _isEip7702DelegatedEOA(target)) {
            revert IStreamGovernanceExecutor.TargetHasNoCode(0, target);
        }
        return codeHash;
    }

    function _isEip7702DelegatedEOA(address account) private view returns (bool delegated) {
        if (account.code.length != 23) return false;
        bytes3 prefix;
        assembly ("memory-safe") {
            extcodecopy(account, 0, 0, 3)
            prefix := mload(0)
        }
        return prefix == 0xef0100;
    }

    function _requireIsolated(ExecutionContext memory ctx, uint8 requiredClass) private view {
        if (
            msg.sender != address(this) || !ctx.executing || ctx.actionId == bytes32(0)
                || ctx.actionClass != requiredClass || ctx.batchLength != 1 || ctx.callIndex != 0
        ) revert IStreamGovernanceExecutor.GovernanceSelfCallContextRequired();
    }

    function _requireTransition(
        ExecutionContext memory ctx,
        bytes32 scopeHash,
        bytes32 oldValueHash,
        bytes32 newValueHash
    ) private pure {
        if (
            ctx.scopeHash != scopeHash || ctx.oldValueHash != oldValueHash
                || ctx.newValueHash != newValueHash
        ) revert IStreamGovernanceExecutor.GovernanceTransitionContextMismatch();
    }

    function requirePolicyCodeHash(address target, bytes4 selector, bytes32 expectedCodeHash)
        public
        view
    {
        _requirePolicyCodeHash(target, selector, expectedCodeHash);
    }

    function _requirePolicyCodeHash(address target, bytes4 selector, bytes32 expectedCodeHash)
        private
        view
    {
        bytes32 actualCodeHash = target.codehash;
        if (expectedCodeHash == bytes32(0) || actualCodeHash != expectedCodeHash) {
            revert IStreamGovernanceExecutor.GovernancePolicyCodeHashMismatch(
                target, selector, expectedCodeHash, actualCodeHash
            );
        }
    }

    function terminalFreezeGuardianConfigCommitment(
        IStreamRoleRegistry registry,
        GovernanceCall[] memory calls
    ) public view returns (bytes32 commitment) {
        (bytes32 baseChain, uint64 baseRevision) = registry.roleMutationState(
            StreamRoles.ROLE_TERMINAL_FREEZE_VETO
        );
        commitment = keccak256(
            abi.encode(
                TERMINAL_GUARDIAN_CONFIG_V1,
                uint256(block.chainid),
                address(this),
                address(registry),
                address(registry).codehash,
                baseChain,
                baseRevision
            )
        );
        commitment = _appendGuardianHolderCodeHashes(
            registry, StreamRoles.ROLE_TERMINAL_FREEZE_VETO, commitment
        );
        uint256 distinctScopeCount = 0;
        for (uint256 i = 0; i < calls.length; i++) {
            if (_scopeSeenBefore(calls, i, calls[i].scopeHash)) continue;
            bytes32 derivedRole =
                keccak256(abi.encode(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, calls[i].scopeHash));
            (bytes32 scopedChain, uint64 scopedRevision) = registry.roleMutationState(derivedRole);
            commitment = keccak256(
                abi.encode(
                    TERMINAL_GUARDIAN_SCOPE_V1,
                    commitment,
                    calls[i].scopeHash,
                    derivedRole,
                    scopedChain,
                    scopedRevision
                )
            );
            commitment = _appendGuardianHolderCodeHashes(registry, derivedRole, commitment);
            distinctScopeCount++;
        }
        return keccak256(abi.encode(TERMINAL_GUARDIAN_CONFIG_V1, commitment, distinctScopeCount));
    }

    function initialTerminalGuardianSetHash(
        address registry,
        address[] memory guardians,
        bytes32 terminalRoleMutationChain,
        uint64 terminalRoleMutationRevision
    ) public view returns (bytes32 setHash) {
        setHash = keccak256(
            abi.encode(
                INITIAL_TERMINAL_GUARDIAN_SET_V1,
                uint256(block.chainid),
                address(this),
                registry,
                guardians.length,
                terminalRoleMutationChain,
                terminalRoleMutationRevision
            )
        );
        for (uint256 i = 0; i < guardians.length; i++) {
            setHash = keccak256(
                abi.encode(
                    TERMINAL_GUARDIAN_HOLDER_V1, setHash, i, guardians[i], guardians[i].codehash
                )
            );
        }
    }

    function _appendGuardianHolderCodeHashes(
        IStreamRoleRegistry registry,
        bytes32 role,
        bytes32 chainHash
    ) private view returns (bytes32) {
        uint256 holderCount = registry.roleHolderCount(role);
        chainHash = keccak256(abi.encode(TERMINAL_GUARDIAN_HOLDER_V1, chainHash, role, holderCount));
        for (uint256 i = 0; i < holderCount; i++) {
            address holder = registry.roleHolderAt(role, i);
            chainHash = keccak256(
                abi.encode(TERMINAL_GUARDIAN_HOLDER_V1, chainHash, role, i, holder, holder.codehash)
            );
        }
        return chainHash;
    }

    function governanceConfigTransitionHashes(
        bytes32 configKind,
        address key,
        bool oldEnabled,
        uint64 oldRevision,
        bool newEnabled
    )
        public
        view
        returns (bytes32 scopeHash, bytes32 oldStateHash, bytes32 newStateHash, uint64 newRevision)
    {
        if (oldRevision == type(uint64).max) {
            revert IStreamGovernanceExecutor.GovernanceRevisionOverflow(configKind, key);
        }
        unchecked {
            newRevision = oldRevision + 1;
        }
        scopeHash = keccak256(
            abi.encode(
                GOVERNANCE_CONFIG_SCOPE_V1, uint256(block.chainid), address(this), configKind, key
            )
        );
        oldStateHash = governanceConfigStateHash(configKind, key, oldEnabled, oldRevision);
        newStateHash = governanceConfigStateHash(configKind, key, newEnabled, newRevision);
    }

    function governanceConfigStateHash(
        bytes32 configKind,
        address key,
        bool enabled,
        uint64 revision
    ) public view returns (bytes32) {
        return keccak256(
            abi.encode(
                GOVERNANCE_CONFIG_STATE_V1,
                uint256(block.chainid),
                address(this),
                configKind,
                key,
                enabled,
                revision
            )
        );
    }

    function governanceSelectorConfigTransitionHashes(
        bytes32 configKind,
        address target,
        bytes4 selector,
        bool oldEnabled,
        bytes32 oldCodeHash,
        uint64 oldRevision,
        bool newEnabled,
        bytes32 newCodeHash
    )
        public
        view
        returns (bytes32 scopeHash, bytes32 oldStateHash, bytes32 newStateHash, uint64 newRevision)
    {
        if (oldRevision == type(uint64).max) {
            revert IStreamGovernanceExecutor.GovernanceRevisionOverflow(configKind, target);
        }
        unchecked {
            newRevision = oldRevision + 1;
        }
        scopeHash = keccak256(
            abi.encode(
                GOVERNANCE_CONFIG_SCOPE_V1,
                uint256(block.chainid),
                address(this),
                configKind,
                target,
                selector
            )
        );
        oldStateHash = governanceSelectorConfigStateHash(
            configKind, target, selector, oldEnabled, oldCodeHash, oldRevision
        );
        newStateHash = governanceSelectorConfigStateHash(
            configKind, target, selector, newEnabled, newCodeHash, newRevision
        );
    }

    function governanceSelectorConfigStateHash(
        bytes32 configKind,
        address target,
        bytes4 selector,
        bool enabled,
        bytes32 targetCodeHash,
        uint64 revision
    ) public view returns (bytes32) {
        return keccak256(
            abi.encode(
                GOVERNANCE_CONFIG_STATE_V1,
                uint256(block.chainid),
                address(this),
                configKind,
                target,
                selector,
                enabled,
                targetCodeHash,
                revision
            )
        );
    }

    function governanceRootTransitionHashes(
        address oldRoot,
        bytes32 oldCodeHash,
        uint64 oldRevision,
        address newRoot,
        bytes32 newCodeHash
    )
        public
        view
        returns (bytes32 scopeHash, bytes32 oldStateHash, bytes32 newStateHash, uint64 newRevision)
    {
        if (oldRevision == type(uint64).max) {
            revert IStreamGovernanceExecutor.GovernanceRevisionOverflow(
                GOVERNANCE_ROOT_STATE_V1, oldRoot
            );
        }
        unchecked {
            newRevision = oldRevision + 1;
        }
        scopeHash = keccak256(
            abi.encode(GOVERNANCE_ROOT_SCOPE_V1, uint256(block.chainid), address(this))
        );
        oldStateHash = governanceRootStateHash(oldRoot, oldCodeHash, oldRevision);
        newStateHash = governanceRootStateHash(newRoot, newCodeHash, newRevision);
    }

    function governanceRootStateHash(address root, bytes32 codeHash, uint64 revision)
        public
        view
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                GOVERNANCE_ROOT_STATE_V1,
                uint256(block.chainid),
                address(this),
                root,
                codeHash,
                revision
            )
        );
    }

    function _scopeSeenBefore(
        GovernanceCall[] memory calls,
        uint256 endExclusive,
        bytes32 scopeHash
    ) private pure returns (bool) {
        for (uint256 i = 0; i < endExclusive; i++) {
            if (calls[i].scopeHash == scopeHash) return true;
        }
        return false;
    }

    function proposerConfig(AdminState storage admin, address account)
        public
        view
        returns (bool enabled, uint64 revision, bytes32 stateHash)
    {
        enabled = admin.proposers[account];
        revision = admin.proposerRevisions[account];
        stateHash =
            governanceConfigStateHash(GOVERNANCE_CONFIG_PROPOSER, account, enabled, revision);
    }

    function cancellerConfig(AdminState storage admin, address account)
        public
        view
        returns (bool enabled, uint64 revision, bytes32 stateHash)
    {
        enabled = admin.cancellers[account];
        revision = admin.cancellerRevisions[account];
        stateHash =
            governanceConfigStateHash(GOVERNANCE_CONFIG_CANCELLER, account, enabled, revision);
    }

    function nativeReceiverConfig(
        StreamGovernanceBootstrap.PolicyState storage policy,
        AdminState storage admin,
        address receiver
    ) public view returns (bool approved, uint64 revision, bytes32 stateHash) {
        approved = policy.approvedNativeReceivers[receiver];
        revision = admin.nativeReceiverRevisions[receiver];
        stateHash = governanceConfigStateHash(
            GOVERNANCE_CONFIG_NATIVE_RECEIVER, receiver, approved, revision
        );
    }

    function tighteningConfig(
        StreamGovernanceBootstrap.PolicyState storage policy,
        AdminState storage admin,
        address target,
        bytes4 selector
    )
        public
        view
        returns (bool tightening, bytes32 targetCodeHash, uint64 revision, bytes32 stateHash)
    {
        tightening = policy.tighteningCalls[target][selector];
        targetCodeHash = policy.tighteningCallCodeHashes[target][selector];
        revision = admin.tighteningCallRevisions[keccak256(abi.encode(target, selector))];
        stateHash = governanceSelectorConfigStateHash(
            GOVERNANCE_CONFIG_TIGHTENING_CALL,
            target,
            selector,
            tightening,
            targetCodeHash,
            revision
        );
    }

    function freezeConfig(
        StreamGovernanceBootstrap.PolicyState storage policy,
        AdminState storage admin,
        address target,
        bytes4 selector
    )
        public
        view
        returns (bool freeze, bytes32 targetCodeHash, uint64 revision, bytes32 stateHash)
    {
        freeze = policy.freezeSelectors[target][selector];
        targetCodeHash = policy.freezeSelectorCodeHashes[target][selector];
        revision = admin.freezeSelectorRevisions[keccak256(abi.encode(target, selector))];
        stateHash = governanceSelectorConfigStateHash(
            GOVERNANCE_CONFIG_FREEZE_SELECTOR, target, selector, freeze, targetCodeHash, revision
        );
    }

    function isTighteningCall(
        StreamGovernanceBootstrap.PolicyState storage policy,
        address target,
        bytes4 selector
    ) public view returns (bool tightening) {
        tightening = policy.tighteningCalls[target][selector];
        if (tightening) {
            _requirePolicyCodeHash(
                target, selector, policy.tighteningCallCodeHashes[target][selector]
            );
        }
    }

    function isFreezeSelector(
        StreamGovernanceBootstrap.PolicyState storage policy,
        address target,
        bytes4 selector
    ) public view returns (bool freeze) {
        freeze = policy.freezeSelectors[target][selector];
        if (freeze) {
            _requirePolicyCodeHash(
                target, selector, policy.freezeSelectorCodeHashes[target][selector]
            );
        }
    }
}
