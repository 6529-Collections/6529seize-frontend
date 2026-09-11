// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IStreamGovernanceExecutor.sol";
import "./IStreamGovernedParameterAuthority.sol";
import "./IStreamRoleRegistry.sol";
import "./Ownable.sol";
import "./ReentrancyGuard.sol";
import "./StreamRoles.sol";
import "./StreamGovernanceBootstrap.sol";
import "./StreamGovernanceManifest.sol";
import "./StreamGovernancePolicy.sol";

/// @notice Staged governance executor for 6529Stream implementing ADR 0004
///         [GOV-ACTION-ID] canonical action identity, [GOV-BATCH] atomic
///         payable batches, [GOV-WINDOWS] delay/window floors and the
///         terminal-freeze veto surface, with scheduled calldata preimages
///         published onchain via SSTORE2 (ADR 0013 decision U5).
/// @dev The owner is `GovernanceRoot`. Scheduling and cancellation are
///     role-gated (owner, registered proposers/cancellers, and the action's
///     proposer for cancellation); execution is permissionless inside the
///     open-to-execute window. Executor configuration changes require an exact,
///     isolated governed self-call with a direction-sensitive action class.
contract StreamGovernanceExecutor is
    IStreamGovernanceExecutor,
    IStreamGovernedParameterAuthority,
    Ownable,
    ReentrancyGuard
{
    uint256 private constant MAX_GOVERNANCE_REVERT_DATA_BYTES = 4_096;
    uint256 private constant MAX_LIVE_TERMINAL_FREEZE_ACTIONS_PER_SCOPE = 64;
    uint256 private constant MAX_NON_ROOT_TERMINAL_FREEZE_ACTIONS_PER_SCOPE = 48;
    uint256 private constant MAX_TERMINAL_FREEZE_ACTIONS_PER_NON_ROOT_PROPOSER = 8;
    /// @notice Batch calls-hash domain pinned by ADR 0004 [GOV-ACTION-ID].
    bytes32 private constant STREAM_GOVERNANCE_CALLS_V2 =
        0x10f09566fb70f7947b61639c2a53b3aec872069a8b46edd08ba14eb2b5942b70;
    /// @notice Action identity domain pinned by ADR 0004 [GOV-ACTION-ID].
    bytes32 private constant STREAM_GOVERNANCE_ACTION_V2 =
        0x214cd728538bb3775a7106caff5c761bace11866a984d4a4d97a98f51971ac4b;
    bytes32 private constant STREAM_GOVERNANCE_BATCH_SCOPE_V2 =
        0x6cfd5dfd67f064adac45602c05057edddda810734779c0ebe11b447e6985e31c;
    bytes32 private constant STREAM_GOVERNANCE_BATCH_OLD_STATE_V2 =
        0xc5029f937b44065c2ad92d9253e07f06117567480206189fcc1409d5509222b7;
    bytes32 private constant STREAM_GOVERNANCE_BATCH_NEW_STATE_V2 =
        0xce958009248d20d9574439fa374bc00c142940af2b496896b5bdbc00b882e98b;

    bytes4 private constant SYSTEM_MANIFEST_PUBLISH_SELECTOR = 0x09b1b5c6;
    bytes4 private constant SYSTEM_MANIFEST_INTERFACE_ID = 0x37660ede;
    bytes4 private constant NO_EXECUTING_GOVERNANCE_ACTION = 0xb8456c92;
    uint8 private constant SUPPORTED_MANIFEST_TAIL_ACTION_CLASS_MASK = 0x0f;

    /// @notice Schema version carried by governance events.
    uint16 private constant SCHEMA_VERSION = 1;
    /// @notice `keccak256` of the `GovernanceActionScheduled` signature.
    /// @dev The scheduling event carries 17 pinned fields, beyond what legacy
    ///     codegen can stack for a Solidity `emit`, so `_emitActionScheduled`
    ///     emits it via `log4` with hand-laid ABI data; golden tests assert
    ///     topic and data byte layout against this constant.
    bytes32 private constant GOVERNANCE_ACTION_SCHEDULED_TOPIC = keccak256(
        "GovernanceActionScheduled(uint16,bytes32,uint8,address,uint256,bytes4,bytes32,bytes32,bytes32,bytes32,uint64,uint64,uint256,address,bytes32,string,bytes32)"
    );

    mapping(bytes32 => GovernanceAction) private _actions;
    mapping(bytes32 => uint256) private _actionNonces;
    mapping(bytes32 => address) private _callDataPointers;
    StreamGovernancePolicy.AdminState private _admin;
    mapping(bytes32 => bytes32[3]) private _firstCallTransitionHashes;
    mapping(bytes32 => bytes32) private _terminalFreezeGuardianConfigCommitments;

    StreamGovernanceBootstrap.PolicyState private _policy;
    StreamGovernanceManifest.LifecycleState private _manifest;
    address private immutable genesisBootstrapAuthority;
    uint256 private _pendingScheduledActionCount;

    uint256 private _nonce;
    bool private _executing;
    bytes32 private _currentActionId;
    uint8 private _currentActionClass;
    bytes32 private _currentScopeHash;
    bytes32 private _currentOldValueHash;
    bytes32 private _currentNewValueHash;
    uint256 private _currentBatchLength;
    uint256 private _currentCallIndex;

    function _checkOwner() internal view override {
        if (!_manifest.isSealed) revert SystemManifestBootstrapNotSealed();
        super._checkOwner();
        _requireGovernanceRootCodeHash();
    }

    constructor(address genesisBootstrapAuthority_) {
        if (genesisBootstrapAuthority_ == address(0)) {
            revert InvalidGenesisBootstrapAuthority(genesisBootstrapAuthority_);
        }
        genesisBootstrapAuthority = genesisBootstrapAuthority_;
    }

    /// @dev Ownership is part of the versioned governance state machine. The
    ///      inherited unversioned escape hatches are permanently disabled.
    function transferOwnership(address) public pure override {
        revert DirectOwnershipMutationDisabled();
    }

    function renounceOwnership() public pure override {
        revert DirectOwnershipMutationDisabled();
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function governanceRootState()
        external
        view
        override
        returns (address governanceRoot_, bytes32 codeHash, uint64 revision)
    {
        return (
            _manifest.governanceRoot,
            _manifest.governanceRootCodeHash,
            _manifest.governanceRootRevision
        );
    }

    /// @notice Role registry resolving [GOV-ROLES], including the terminal veto role.
    function roleRegistry() external view returns (IStreamRoleRegistry) {
        return _manifest.roleRegistry;
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function rotateGovernanceRoot(address newRoot, bytes32 expectedCodeHash) external override {
        _requireIsolatedSelfCall(StreamGovernanceActionClasses.POINTER_REPLACEMENT);
        address oldRoot = StreamGovernanceManifest.validateGovernanceRootRotation(
            _manifest, genesisBootstrapAuthority, newRoot, expectedCodeHash
        );
        (bytes32 scopeHash, bytes32 oldStateHash, bytes32 newStateHash, uint64 newRevision) = StreamGovernancePolicy.governanceRootTransitionHashes(
            oldRoot,
            _manifest.governanceRootCodeHash,
            _manifest.governanceRootRevision,
            newRoot,
            expectedCodeHash
        );
        _requireCurrentTransition(scopeHash, oldStateHash, newStateHash);
        _manifest.governanceRoot = newRoot;
        _manifest.governanceRootCodeHash = expectedCodeHash;
        _manifest.governanceRootRevision = newRevision;
        _transferOwnership(newRoot);
        emit GovernanceRootRotated(
            SCHEMA_VERSION, oldRoot, newRoot, expectedCodeHash, newRevision, _currentActionId
        );
    }

    /// @notice Registers or removes a scheduling proposer through an isolated
    ///         versioned governance self-call.
    function registerProposer(address account, bool enabled) external override {
        _requireIsolatedSelfCall(
            enabled
                ? StreamGovernanceActionClasses.DELAYED_LOOSENING
                : StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING
        );
        _requireBoundRoleRegistry();
        StreamGovernancePolicy.updateProposer(
            _admin, _manifest.roleRegistry, account, enabled, _policyExecutionContext()
        );
    }

    /// @notice Registers or removes a canceller (for example a guardian module).
    function registerCanceller(address account, bool enabled) external override {
        StreamGovernancePolicy.updateCanceller(_admin, account, enabled, _policyExecutionContext());
    }

    function isProposer(address account) external view override returns (bool) {
        return _admin.proposers[account];
    }

    function isCanceller(address account) external view override returns (bool) {
        return _admin.cancellers[account];
    }

    /// @notice Tightening classifier: registers `(target, selector)` pairs
    ///         proven unable to loosen policy, eligible for zero-delay
    ///         IMMEDIATE_TIGHTENING scheduling (ADR 0004 execution rule 2).
    /// @dev An exact isolated self-call is required. Enabling the fast path
    ///      requires DELAYED_LOOSENING; disabling it is IMMEDIATE_TIGHTENING.
    ///      The classifier is advisory; target-side class enforcement remains primary.
    function setTighteningCall(address target, bytes4 selector, bool tightening) external override {
        if (tightening && target == address(_manifest.roleRegistry)) {
            revert NotClassifiedTightening(target, selector);
        }
        StreamGovernancePolicy.updateTighteningCall(
            _policy, _admin, target, selector, tightening, _policyExecutionContext()
        );
    }

    function isTighteningCall(address target, bytes4 selector)
        external
        view
        override
        returns (bool)
    {
        return StreamGovernancePolicy.isTighteningCall(_policy, target, selector);
    }

    /// @notice Registers or clears a known-irreversible freeze
    ///         `(target, selector)` for the executor-side veto-floor backstop
    ///         (FIX A). While registered, any batch containing a call to that
    ///         `(target, selector)` must be scheduled as `TERMINAL_FREEZE`,
    ///         forcing the [GOV-WINDOWS] rule 2 72h veto floor regardless of
    ///         the proposer-declared class.
    /// @dev An exact isolated self-call is required. Registering this protective
    ///      backstop is IMMEDIATE_TIGHTENING; clearing it requires
    ///      DELAYED_LOOSENING. Target-side class enforcement remains primary.
    function registerFreezeSelector(address target, bytes4 selector, bool freeze)
        external
        override
    {
        if (freeze && target == address(_manifest.roleRegistry)) {
            revert InvalidManifestTailTrigger(target, selector);
        }
        StreamGovernancePolicy.updateFreezeSelector(
            _policy,
            _admin,
            target,
            selector,
            freeze,
            _manifest.systemManifestSatellite,
            SYSTEM_MANIFEST_PUBLISH_SELECTOR,
            _policyExecutionContext()
        );
    }

    /// @notice Approves a receiver for empty-calldata native ETH transfer calls
    ///         (ADR 0004 execution rule 4).
    function setApprovedNativeReceiver(address receiver, bool approved) external override {
        StreamGovernancePolicy.updateNativeReceiver(
            _policy, _admin, receiver, approved, _policyExecutionContext()
        );
    }

    function isApprovedNativeReceiver(address receiver) external view override returns (bool) {
        return _policy.approvedNativeReceivers[receiver];
    }

    function proposerConfig(address account)
        external
        view
        override
        returns (bool enabled, uint64 revision, bytes32 stateHash)
    {
        (enabled, revision, stateHash) = StreamGovernancePolicy.proposerConfig(_admin, account);
    }

    function cancellerConfig(address account)
        external
        view
        override
        returns (bool enabled, uint64 revision, bytes32 stateHash)
    {
        (enabled, revision, stateHash) = StreamGovernancePolicy.cancellerConfig(_admin, account);
    }

    function approvedNativeReceiverConfig(address receiver)
        external
        view
        override
        returns (bool approved, uint64 revision, bytes32 stateHash)
    {
        (approved, revision, stateHash) =
            StreamGovernancePolicy.nativeReceiverConfig(_policy, _admin, receiver);
    }

    function tighteningCallConfig(address target, bytes4 selector)
        external
        view
        override
        returns (bool tightening, bytes32 targetCodeHash, uint64 revision, bytes32 stateHash)
    {
        (tightening, targetCodeHash, revision, stateHash) =
            StreamGovernancePolicy.tighteningConfig(_policy, _admin, target, selector);
    }

    function freezeSelectorConfig(address target, bytes4 selector)
        external
        view
        override
        returns (bool freeze, bytes32 targetCodeHash, uint64 revision, bytes32 stateHash)
    {
        (freeze, targetCodeHash, revision, stateHash) =
            StreamGovernancePolicy.freezeConfig(_policy, _admin, target, selector);
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function publishGovernanceCallData(bytes[] calldata callDatas)
        external
        override
        returns (address pointer)
    {
        if (!_manifest.bound) revert SystemManifestBootstrapNotBound();
        return _publishCallData(callDatas);
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function publishedCallData(bytes32 callDataKey) external view override returns (address) {
        return _policy.publishedCallData[callDataKey];
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function scheduleGovernanceBatch(
        uint8 actionClass,
        GovernanceCall[] calldata calls,
        bytes32 scopeHash,
        bytes32 oldValueHash,
        bytes32 newValueHash,
        uint64 notBefore,
        uint64 expiresAfter,
        bytes32 reasonHash,
        string calldata reasonURI,
        bytes32 manifestHash
    ) external override returns (bytes32 actionId) {
        StreamGovernanceBootstrap.ScheduleContext memory ctx =
            StreamGovernanceBootstrap.ScheduleContext({
                actionClass: actionClass,
                scopeHash: scopeHash,
                oldValueHash: oldValueHash,
                newValueHash: newValueHash,
                notBefore: notBefore,
                expiresAfter: expiresAfter,
                reasonHash: reasonHash,
                reasonURI: reasonURI,
                manifestHash: manifestHash
            });
        return _schedule(ctx, calls);
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function scheduleGovernanceAction(GovernanceActionRequest calldata request)
        external
        override
        returns (bytes32 actionId)
    {
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = GovernanceCall({
            target: request.target,
            value: request.value,
            selector: request.selector,
            callDataHash: keccak256(request.callData),
            scopeHash: request.scopeHash,
            oldValueHash: request.oldValueHash,
            newValueHash: request.newValueHash
        });
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = request.callData;
        // The single-call wrapper carries the preimage, so it publishes
        // directly before scheduling the equivalent batch of one.
        _publishCallData(callDatas);
        bytes32 callsHash = _callsHash(calls);
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _deriveBatchTransitionHashes(calls, callsHash);
        StreamGovernanceBootstrap.ScheduleContext memory ctx =
            StreamGovernanceBootstrap.ScheduleContext({
                actionClass: request.actionClass,
                scopeHash: scopeHash,
                oldValueHash: oldValueHash,
                newValueHash: newValueHash,
                notBefore: request.notBefore,
                expiresAfter: request.expiresAfter,
                reasonHash: request.reasonHash,
                reasonURI: request.reasonURI,
                manifestHash: request.manifestHash
            });
        return _schedule(ctx, calls);
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function executeGovernanceBatch(
        bytes32 actionId,
        GovernanceCall[] calldata calls,
        bytes[] calldata callDatas
    ) external payable override nonReentrant {
        _execute(actionId, calls, callDatas);
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function executeGovernanceAction(bytes32 actionId, bytes calldata callData)
        external
        payable
        override
        nonReentrant
    {
        GovernanceAction storage action = _actions[actionId];
        if (action.status == GovernanceActionStatus.NONE) {
            revert GovernanceActionUnknown(actionId);
        }
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = GovernanceCall({
            target: action.target,
            value: action.value,
            selector: action.selector,
            callDataHash: keccak256(callData),
            scopeHash: _firstCallTransitionHashes[actionId][0],
            oldValueHash: _firstCallTransitionHashes[actionId][1],
            newValueHash: _firstCallTransitionHashes[actionId][2]
        });
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        _execute(actionId, calls, callDatas);
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function cancelGovernanceAction(bytes32 actionId, bytes32 reasonHash) external override {
        GovernanceAction storage action = _actions[actionId];
        if (action.status == GovernanceActionStatus.NONE) {
            revert GovernanceActionUnknown(actionId);
        }
        if (action.status != GovernanceActionStatus.SCHEDULED) {
            revert GovernanceActionNotScheduled(actionId);
        }
        if (block.timestamp > action.expiresAfter) {
            revert GovernanceActionExpiredWindow(actionId, action.expiresAfter);
        }
        StreamGovernanceManifest.requireCancellationAuthority(
            _manifest, _admin, action, genesisBootstrapAuthority, this.registerCanceller.selector
        );
        action.status = GovernanceActionStatus.CANCELLED;
        action.canceller = msg.sender;
        _pendingScheduledActionCount -= 1;
        _pruneLiveTerminalFreeze(actionId, action.actionClass);
        emit GovernanceActionCancelled(
            SCHEMA_VERSION,
            actionId,
            action.actionClass,
            action.target,
            action.selector,
            action.callHash,
            action.scopeHash,
            msg.sender,
            reasonHash,
            ""
        );
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function vetoTerminalFreeze(bytes32 actionId, bytes32 reasonHash) external override {
        GovernanceAction storage action = _actions[actionId];
        if (action.status == GovernanceActionStatus.NONE) {
            revert GovernanceActionUnknown(actionId);
        }
        if (action.actionClass != StreamGovernanceActionClasses.TERMINAL_FREEZE) {
            revert NotTerminalFreezeAction(actionId);
        }
        if (action.status != GovernanceActionStatus.SCHEDULED) {
            revert GovernanceActionNotScheduled(actionId);
        }
        if (block.timestamp >= action.notBefore) {
            revert VetoDeadlinePassed(actionId, action.notBefore);
        }
        _requireBoundRoleRegistry();
        // FIX B: per-scope veto authority with fallback to the global holders;
        // global holders may veto any scope (vetoing is protective), per-scope
        // designation is additive.
        if (!StreamGovernanceBootstrap.isTerminalFreezeVetoGuardian(
                _policy, _manifest.roleRegistry, actionId, msg.sender
            )) {
            revert NotTerminalFreezeVetoGuardian(msg.sender);
        }
        action.status = GovernanceActionStatus.VETOED;
        action.vetoer = msg.sender;
        _pendingScheduledActionCount -= 1;
        _pruneLiveTerminalFreeze(actionId, action.actionClass);
        emit GovernanceActionVetoed(
            SCHEMA_VERSION, actionId, action.actionClass, msg.sender, action.scopeHash, reasonHash
        );
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function materializeExpiredAction(bytes32 actionId) external override {
        GovernanceAction storage action = _actions[actionId];
        if (action.status == GovernanceActionStatus.NONE) {
            revert GovernanceActionUnknown(actionId);
        }
        if (action.status != GovernanceActionStatus.SCHEDULED) {
            revert GovernanceActionNotScheduled(actionId);
        }
        if (block.timestamp <= action.expiresAfter) {
            revert GovernanceActionNotExpired(actionId, action.expiresAfter);
        }
        action.status = GovernanceActionStatus.EXPIRED;
        _pendingScheduledActionCount -= 1;
        _pruneLiveTerminalFreeze(actionId, action.actionClass);
        emit GovernanceActionExpired(SCHEMA_VERSION, actionId, action.actionClass, msg.sender);
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function governanceAction(bytes32 actionId)
        external
        view
        override
        returns (GovernanceAction memory)
    {
        GovernanceAction memory action = _actions[actionId];
        if (
            action.status == GovernanceActionStatus.SCHEDULED
                && block.timestamp > action.expiresAfter
        ) {
            action.status = GovernanceActionStatus.EXPIRED;
        }
        return action;
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function governanceNonce() external view override returns (uint256) {
        return _nonce;
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function minimumDelay(uint8 actionClass) public pure override returns (uint64) {
        return StreamGovernanceBootstrap.minimumDelay(actionClass);
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function terminalFreezeVetoRole(bytes32 scopeHash) public pure override returns (bytes32) {
        return keccak256(abi.encode(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scopeHash));
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function terminalFreezeGuardianConfigCommitment(bytes32 actionId)
        external
        view
        override
        returns (bytes32 commitment)
    {
        return _terminalFreezeGuardianConfigCommitments[actionId];
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function terminalFreezeVetoGuardian(bytes32 scopeHash)
        external
        view
        override
        returns (address guardian, uint64 vetoDeadline)
    {
        _requireBoundRoleRegistry();
        // Per-scope and global holders are additive. Resolve an address only
        // when their deduplicated union contains exactly one holder; otherwise
        // return the sentinel and let callers enumerate the two role sets.
        bytes32 scopeRole = terminalFreezeVetoRole(scopeHash);
        uint256 scopeHolders = _manifest.roleRegistry.roleHolderCount(scopeRole);
        uint256 globalHolders =
            _manifest.roleRegistry.roleHolderCount(StreamRoles.ROLE_TERMINAL_FREEZE_VETO);
        if (scopeHolders <= 1 && globalHolders <= 1) {
            address scopedGuardian =
                scopeHolders == 1 ? _manifest.roleRegistry.roleHolderAt(scopeRole, 0) : address(0);
            address globalGuardian = globalHolders == 1
                ? _manifest.roleRegistry.roleHolderAt(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, 0)
                : address(0);
            if (scopedGuardian == address(0) || globalGuardian == address(0)) {
                guardian = scopedGuardian == address(0) ? globalGuardian : scopedGuardian;
            } else if (scopedGuardian == globalGuardian) {
                guardian = scopedGuardian;
            }
        }
        // Earliest-deadline live action so a later decoy never shadows it.
        vetoDeadline = StreamGovernanceBootstrap.earliestTerminalFreezeDeadline(_policy, scopeHash);
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function terminalFreezeVetoGuardianSet(bytes32 scopeHash)
        external
        view
        override
        returns (
            address roleRegistryAddress,
            bytes32 scopedRole,
            uint256 scopedHolderCount,
            bytes32 globalRole,
            uint256 globalHolderCount,
            uint64 vetoDeadline
        )
    {
        _requireBoundRoleRegistry();
        roleRegistryAddress = address(_manifest.roleRegistry);
        scopedRole = terminalFreezeVetoRole(scopeHash);
        globalRole = StreamRoles.ROLE_TERMINAL_FREEZE_VETO;
        scopedHolderCount = _manifest.roleRegistry.roleHolderCount(scopedRole);
        globalHolderCount = _manifest.roleRegistry.roleHolderCount(globalRole);
        vetoDeadline = StreamGovernanceBootstrap.earliestTerminalFreezeDeadline(_policy, scopeHash);
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function terminalFreezeLiveActionCaps()
        external
        pure
        override
        returns (uint256 totalCap, uint256 nonRootCap, uint256 perNonRootProposerCap)
    {
        return (
            MAX_LIVE_TERMINAL_FREEZE_ACTIONS_PER_SCOPE,
            MAX_NON_ROOT_TERMINAL_FREEZE_ACTIONS_PER_SCOPE,
            MAX_TERMINAL_FREEZE_ACTIONS_PER_NON_ROOT_PROPOSER
        );
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function terminalFreezeLiveActionUsage(bytes32 scopeHash, address proposer)
        external
        view
        override
        returns (uint256 totalMemberships, uint256 nonRootMemberships, uint256 proposerMemberships)
    {
        return (
            _policy.terminalLiveActions[scopeHash].length,
            _policy.terminalNonRootLiveCount[scopeHash],
            _policy.terminalProposerLiveCount[scopeHash][proposer]
        );
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function pruneElapsedTerminalFreezeActions(bytes32 scopeHash)
        external
        override
        returns (uint256 prunedCount)
    {
        prunedCount =
            StreamGovernanceBootstrap.pruneElapsedTerminalFreezeActions(_policy, scopeHash);
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function terminalFreezeActionPage(bytes32 scopeHash, uint256 cursor, uint256 limit)
        external
        view
        override
        returns (bytes32[] memory actionIds, uint64[] memory vetoDeadlines, uint256 nextCursor)
    {
        (actionIds, vetoDeadlines, nextCursor) =
            StreamGovernanceBootstrap.terminalFreezeActionPage(_policy, scopeHash, cursor, limit);
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function liveTerminalFreezeActionCount(bytes32 scopeHash)
        external
        view
        override
        returns (uint256)
    {
        return StreamGovernanceBootstrap.liveTerminalFreezeActionCount(_policy, scopeHash);
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function liveTerminalFreezeActionAt(bytes32 scopeHash, uint256 index)
        external
        view
        override
        returns (bytes32 actionId, uint64 vetoDeadline)
    {
        (actionId, vetoDeadline) =
            StreamGovernanceBootstrap.liveTerminalFreezeActionAt(_policy, scopeHash, index);
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function isFreezeSelector(address target, bytes4 selector)
        external
        view
        override
        returns (bool)
    {
        return StreamGovernancePolicy.isFreezeSelector(_policy, target, selector);
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function currentAction()
        external
        view
        override(IStreamGovernanceExecutor, IStreamGovernedParameterAuthority)
        returns (
            bool executing,
            bytes32 actionId,
            uint8 actionClass,
            bytes32 scopeHash,
            bytes32 oldValueHash,
            bytes32 newValueHash
        )
    {
        return (
            _executing,
            _currentActionId,
            _currentActionClass,
            _currentScopeHash,
            _currentOldValueHash,
            _currentNewValueHash
        );
    }

    /// @inheritdoc IStreamGovernedParameterAuthority
    function isStreamGovernedParameterAuthority() external pure override returns (bool) {
        return true;
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function scheduledCallDataPointer(bytes32 actionId) external view override returns (address) {
        return _callDataPointers[actionId];
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function scheduledCallData(bytes32 actionId) external view override returns (bytes[] memory) {
        address pointer = _callDataPointers[actionId];
        if (pointer == address(0)) {
            revert GovernanceActionUnknown(actionId);
        }
        return _readCanonicalCallDatas(pointer);
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function systemManifestBatchTailRule(address triggerTarget, bytes4 triggerSelector)
        external
        view
        override
        returns (
            bool registered,
            bytes32 triggerCodeHash,
            uint8 allowedActionClassMask,
            address tailTarget,
            bytes4 tailSelector,
            bytes32 tailCodeHash
        )
    {
        ManifestTailTriggerRule storage rule = _policy.tailRules[triggerTarget][triggerSelector];
        triggerCodeHash = rule.triggerCodeHash;
        registered = triggerCodeHash != bytes32(0);
        allowedActionClassMask = rule.allowedActionClassMask;
        tailTarget = _manifest.systemManifestSatellite;
        tailSelector = SYSTEM_MANIFEST_PUBLISH_SELECTOR;
        tailCodeHash = _manifest.systemManifestSatelliteCodeHash;
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function registerSystemManifestTailTrigger(
        address triggerTarget,
        bytes4 triggerSelector,
        uint8 allowedActionClassMask
    ) external override {
        _requireIsolatedSelfCall(StreamGovernanceActionClasses.TERMINAL_FREEZE);
        if (!_manifest.isSealed) {
            revert SystemManifestBootstrapNotSealed();
        }
        if (_manifest.systemManifestSatellite.codehash != _manifest.systemManifestSatelliteCodeHash)
        {
            revert ManifestTailCodeHashMismatch(
                _manifest.systemManifestSatelliteCodeHash,
                _manifest.systemManifestSatellite.codehash
            );
        }
        if (
            triggerTarget == address(0) || triggerSelector == bytes4(0)
                || triggerTarget.code.length == 0 || allowedActionClassMask == 0
                || (allowedActionClassMask & ~SUPPORTED_MANIFEST_TAIL_ACTION_CLASS_MASK) != 0
                || triggerTarget == address(_manifest.roleRegistry)
                || (triggerTarget == _manifest.systemManifestSatellite
                    && triggerSelector == SYSTEM_MANIFEST_PUBLISH_SELECTOR)
        ) {
            revert InvalidManifestTailTrigger(triggerTarget, triggerSelector);
        }
        if (_policy.tailRules[triggerTarget][triggerSelector].triggerCodeHash != bytes32(0)) {
            revert ManifestTailTriggerAlreadyRegistered(triggerTarget, triggerSelector);
        }
        _appendManifestTailTrigger(
            triggerTarget, triggerSelector, triggerTarget.codehash, allowedActionClassMask, true
        );
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function systemManifestTailTriggerCount() external view override returns (uint256) {
        return _policy.tailEntries.length;
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function systemManifestTailTriggerAt(uint256 index)
        external
        view
        override
        returns (
            address triggerTarget,
            bytes4 triggerSelector,
            bytes32 triggerCodeHash,
            uint8 allowedActionClassMask
        )
    {
        if (index >= _policy.tailEntries.length) {
            revert ManifestTailTriggerIndexOutOfBounds(index);
        }
        ManifestTailTriggerEntry storage entry = _policy.tailEntries[index];
        triggerTarget = entry.triggerTarget;
        triggerSelector = entry.triggerSelector;
        ManifestTailTriggerRule storage rule = _policy.tailRules[triggerTarget][triggerSelector];
        triggerCodeHash = rule.triggerCodeHash;
        allowedActionClassMask = rule.allowedActionClassMask;
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function systemManifestTailTriggerChainHash()
        external
        view
        override
        returns (bytes32 chainHash, uint64 recordCount)
    {
        chainHash = _policy.tailChainHash;
        recordCount = uint64(_policy.tailEntries.length);
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function bindSystemManifestBootstrap(SystemManifestBootstrapBinding calldata binding)
        external
        override
        nonReentrant
    {
        StreamGovernanceManifest.bind(
            _manifest,
            _policy,
            binding,
            StreamGovernanceManifest.BindContext({
                genesisBootstrapAuthority: genesisBootstrapAuthority,
                governanceNonce: _nonce,
                pendingScheduledActionCount: _pendingScheduledActionCount
            })
        );
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function pendingScheduledActionCount() external view override returns (uint256) {
        return _pendingScheduledActionCount;
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function systemManifestBootstrapState()
        external
        view
        override
        returns (
            bool,
            bool,
            address,
            bytes32,
            address,
            bytes32,
            uint64,
            bytes32,
            uint256,
            bytes32,
            uint64,
            address,
            bytes32,
            address,
            bytes32,
            bytes32,
            uint256,
            bytes32,
            uint256,
            bytes32,
            bytes32,
            uint256,
            bytes32,
            uint256,
            address,
            address
        )
    {
        bytes memory encoded = StreamGovernanceManifest.encodeBootstrapState(
            _manifest, genesisBootstrapAuthority
        );
        assembly ("memory-safe") {
            return(add(encoded, 0x20), mload(encoded))
        }
    }

    /// @inheritdoc IStreamGovernanceExecutor
    function sealSystemManifestBootstrap() external override {
        GovernanceAction storage action = _actions[_currentActionId];
        address governanceRoot = StreamGovernanceManifest.prepareSeal(
            _manifest,
            _policy,
            StreamGovernanceManifest.SealContext({
                executing: _executing,
                actionId: _currentActionId,
                actionClass: _currentActionClass,
                batchLength: _currentBatchLength,
                callIndex: _currentCallIndex,
                pendingScheduledActionCount: _pendingScheduledActionCount,
                actionProposer: action.proposer,
                callDataPointer: _callDataPointers[_currentActionId],
                scopeHash: _currentScopeHash,
                oldValueHash: _currentOldValueHash,
                newValueHash: _currentNewValueHash,
                genesisBootstrapAuthority: genesisBootstrapAuthority
            })
        );
        _transferOwnership(governanceRoot);
    }

    function _schedule(
        StreamGovernanceBootstrap.ScheduleContext memory ctx,
        GovernanceCall[] memory calls
    ) private returns (bytes32 actionId) {
        if (_executing) revert GovernanceSchedulingDuringExecution();
        bool bootstrapAuthority =
            _manifest.bound && !_manifest.isSealed && msg.sender == genesisBootstrapAuthority;
        bool privilegedProposer = bootstrapAuthority || msg.sender == owner();
        if (_manifest.isSealed) _requireGovernanceRootCodeHash();
        if (!privilegedProposer && !_admin.proposers[msg.sender]) {
            revert GovernanceActorNotAuthorized(msg.sender);
        }
        if (!_manifest.bound) {
            revert SystemManifestBootstrapNotBound();
        }
        if (!_manifest.isSealed) {
            if (msg.sender != genesisBootstrapAuthority) {
                revert GenesisBootstrapActorRequired(msg.sender);
            }
            if (_pendingScheduledActionCount != 0) {
                revert PendingGovernanceActionExists(_pendingScheduledActionCount);
            }
            _requireBootstrapCodeHashes();
        }
        // [GOV-BATCH] rule 5: the exact calldata preimages must already be
        // published onchain; the action record stores the pointer for the
        // full open-to-execute window.
        address callDataPointer = _requirePublishedCallData(calls);
        uint256 totalValue =
            _validateCalls(ctx.actionClass, calls, _readCanonicalCallDatas(callDataPointer));
        bytes32 callsHash = _callsHash(calls);
        (bytes32 derivedScopeHash, bytes32 derivedOldValueHash, bytes32 derivedNewValueHash) =
            _deriveBatchTransitionHashes(calls, callsHash);
        if (ctx.scopeHash != derivedScopeHash) {
            revert BatchScopeHashMismatch(derivedScopeHash, ctx.scopeHash);
        }
        if (ctx.oldValueHash != derivedOldValueHash) {
            revert BatchOldValueHashMismatch(derivedOldValueHash, ctx.oldValueHash);
        }
        if (ctx.newValueHash != derivedNewValueHash) {
            revert BatchNewValueHashMismatch(derivedNewValueHash, ctx.newValueHash);
        }
        _validateWindow(ctx.actionClass, ctx.notBefore, ctx.expiresAfter);
        uint256 nonceUsed = _nonce;
        actionId = _computeActionId(ctx, callsHash, nonceUsed);
        _validateManifestTailComposition(
            actionId,
            msg.sender,
            ctx.actionClass,
            calls,
            !_manifest.isSealed,
            true,
            privilegedProposer
        );

        if (ctx.actionClass == StreamGovernanceActionClasses.TERMINAL_FREEZE) {
            _requireBoundRoleRegistry();
            StreamGovernanceBootstrap.validateTerminalFreezeGuardians(_manifest.roleRegistry, calls);
        }

        _nonce = nonceUsed + 1;

        GovernanceAction storage action = _actions[actionId];
        if (action.status != GovernanceActionStatus.NONE) {
            revert GovernanceActionNotScheduled(actionId);
        }
        action.status = GovernanceActionStatus.SCHEDULED;
        action.actionClass = ctx.actionClass;
        action.target = calls[0].target;
        action.value = totalValue;
        action.selector = calls[0].selector;
        action.callHash = callsHash;
        action.scopeHash = ctx.scopeHash;
        action.oldValueHash = ctx.oldValueHash;
        action.newValueHash = ctx.newValueHash;
        action.notBefore = ctx.notBefore;
        action.expiresAfter = ctx.expiresAfter;
        action.proposer = msg.sender;
        action.reasonHash = ctx.reasonHash;
        action.reasonURI = ctx.reasonURI;
        action.manifestHash = ctx.manifestHash;

        _actionNonces[actionId] = nonceUsed;
        _callDataPointers[actionId] = callDataPointer;
        _firstCallTransitionHashes[actionId] =
            [calls[0].scopeHash, calls[0].oldValueHash, calls[0].newValueHash];
        _pendingScheduledActionCount += 1;

        if (ctx.actionClass == StreamGovernanceActionClasses.TERMINAL_FREEZE) {
            StreamGovernanceBootstrap.appendTerminalFreeze(
                _policy, actionId, ctx.notBefore, calls, msg.sender, privilegedProposer
            );
            bytes32 guardianConfigCommitment =
                StreamGovernancePolicy.terminalFreezeGuardianConfigCommitment(
                    _manifest.roleRegistry, calls
                );
            _terminalFreezeGuardianConfigCommitments[actionId] = guardianConfigCommitment;
            emit TerminalFreezeGuardianConfigCommitted(
                SCHEMA_VERSION, actionId, guardianConfigCommitment
            );
        }

        StreamGovernanceBootstrap.emitActionScheduled(
            actionId, ctx, calls[0].target, calls[0].selector, totalValue, callsHash, nonceUsed
        );
    }

    function _publishCallData(bytes[] memory callDatas) private returns (address pointer) {
        return StreamGovernanceBootstrap.publishCallData(_policy, callDatas);
    }

    function _requirePublishedCallData(GovernanceCall[] memory calls)
        private
        view
        returns (address pointer)
    {
        return StreamGovernanceBootstrap.requirePublishedCallData(_policy, calls);
    }

    function _readCanonicalCallDatas(address pointer)
        private
        view
        returns (bytes[] memory callDatas)
    {
        return StreamGovernanceBootstrap.readCanonicalCallDatas(pointer);
    }

    function _requireSelfCall(uint8 requiredClass) private view {
        if (
            msg.sender != address(this) || !_executing || _currentActionId == bytes32(0)
                || _currentActionClass != requiredClass
        ) {
            revert GovernanceSelfCallContextRequired();
        }
    }

    function _requireIsolatedSelfCall(uint8 requiredClass) private view {
        _requireSelfCall(requiredClass);
        if (_currentBatchLength != 1 || _currentCallIndex != 0) {
            revert GovernanceSelfCallContextRequired();
        }
    }

    function _requireCurrentTransition(
        bytes32 scopeHash,
        bytes32 oldValueHash,
        bytes32 newValueHash
    ) private view {
        if (
            _currentScopeHash != scopeHash || _currentOldValueHash != oldValueHash
                || _currentNewValueHash != newValueHash
        ) {
            revert GovernanceTransitionContextMismatch();
        }
    }

    function _policyExecutionContext()
        private
        view
        returns (StreamGovernancePolicy.ExecutionContext memory)
    {
        return StreamGovernancePolicy.ExecutionContext({
            executing: _executing,
            actionId: _currentActionId,
            actionClass: _currentActionClass,
            scopeHash: _currentScopeHash,
            oldValueHash: _currentOldValueHash,
            newValueHash: _currentNewValueHash,
            batchLength: _currentBatchLength,
            callIndex: _currentCallIndex
        });
    }

    function _appendManifestTailTrigger(
        address triggerTarget,
        bytes4 triggerSelector,
        bytes32 triggerCodeHash,
        uint8 allowedActionClassMask,
        bool governed
    ) private {
        StreamGovernanceManifest.appendManifestTailTrigger(
            _policy,
            _manifest,
            triggerTarget,
            triggerSelector,
            triggerCodeHash,
            allowedActionClassMask,
            governed,
            _currentScopeHash,
            _currentOldValueHash,
            _currentNewValueHash
        );
        if (governed) {
            emit SystemManifestTailTriggerRegistered(
                SCHEMA_VERSION,
                triggerTarget,
                triggerSelector,
                triggerCodeHash,
                allowedActionClassMask,
                _manifest.systemManifestSatellite,
                SYSTEM_MANIFEST_PUBLISH_SELECTOR,
                _currentActionId
            );
        }
    }

    function _validateManifestTailComposition(
        bytes32 actionId,
        address proposer,
        uint8 actionClass,
        GovernanceCall[] memory calls,
        bool bootstrapScoped,
        bool scheduling,
        bool privilegedProposer
    ) private {
        StreamGovernanceManifest.validateManifestTailComposition(
            _policy,
            _admin,
            _manifest,
            actionId,
            proposer,
            actionClass,
            calls,
            bootstrapScoped,
            scheduling,
            privilegedProposer,
            this.sealSystemManifestBootstrap.selector,
            this.registerSystemManifestTailTrigger.selector
        );
    }

    function _requireBootstrapCodeHashes() private view {
        StreamGovernanceManifest.requireBootstrapCodeHashes(_manifest);
    }

    function _requireGovernanceRootCodeHash() private view {
        StreamGovernanceManifest.requireGovernanceRootCodeHash(_manifest);
    }

    function _requireBoundRoleRegistry() private view {
        StreamGovernanceManifest.requireBoundRoleRegistry(_manifest);
    }

    function _pruneLiveTerminalFreeze(bytes32 actionId, uint8 actionClass) private {
        if (actionClass == StreamGovernanceActionClasses.TERMINAL_FREEZE) {
            StreamGovernanceBootstrap.pruneTerminalFreeze(_policy, actionId);
        }
    }

    /// @dev Emits `GovernanceActionScheduled` via `log4`. Non-indexed data is
    ///     ABI-encoded in word chunks: 14 head words (the string head slot at
    ///     index 13 points to offset 0x1C0), then the string length, raw
    ///     bytes, and canonical zero padding.
    function _execute(bytes32 actionId, GovernanceCall[] memory calls, bytes[] memory callDatas)
        private
    {
        uint256 startBalance = address(this).balance;
        GovernanceAction storage action = _actions[actionId];
        if (action.status == GovernanceActionStatus.NONE) {
            revert GovernanceActionUnknown(actionId);
        }
        if (action.status != GovernanceActionStatus.SCHEDULED) {
            revert GovernanceActionNotScheduled(actionId);
        }
        if (block.timestamp < action.notBefore) {
            revert GovernanceActionNotExecutable(actionId, action.notBefore);
        }
        if (block.timestamp > action.expiresAfter) {
            revert GovernanceActionExpiredWindow(actionId, action.expiresAfter);
        }
        // Defense in depth: records with a retired or unknown class can never
        // cross the execution boundary, even if storage or imported state is
        // corrupted outside the ordinary scheduling path.
        StreamGovernanceBootstrap.validateActionClass(action.actionClass);

        // [GOV-BATCH] rule 1: recompute callsHash and actionId from the
        // supplied batch and require both to match the stored action.
        bytes32 callsHash = _callsHash(calls);
        if (callsHash != action.callHash) {
            revert CallsHashMismatch(actionId);
        }
        (bytes32 derivedScopeHash, bytes32 derivedOldValueHash, bytes32 derivedNewValueHash) =
            _deriveBatchTransitionHashes(calls, callsHash);
        if (
            derivedScopeHash != action.scopeHash || derivedOldValueHash != action.oldValueHash
                || derivedNewValueHash != action.newValueHash
        ) {
            revert ActionIdMismatch(actionId);
        }
        if (
            StreamGovernanceBootstrap.governanceActionIdFromStored(
                    action, callsHash, _actionNonces[actionId]
                ) != actionId
        ) {
            revert ActionIdMismatch(actionId);
        }
        bytes[] memory scheduledCallDatas = _readCanonicalCallDatas(_callDataPointers[actionId]);
        if (callDatas.length != calls.length || scheduledCallDatas.length != calls.length) {
            revert CallDataCountMismatch(calls.length, callDatas.length);
        }
        uint256 totalValue = _validateCalls(action.actionClass, calls, scheduledCallDatas);
        for (uint256 i = 0; i < calls.length; i++) {
            if (!_bytesEqual(callDatas[i], scheduledCallDatas[i])) {
                revert ScheduledCallDataMismatch(i);
            }
        }
        bool bootstrapSeal = !_manifest.isSealed && calls.length == 2
            && calls[0].target == address(this)
            && calls[0].selector == this.sealSystemManifestBootstrap.selector;
        _validateManifestTailComposition(
            actionId, action.proposer, action.actionClass, calls, !_manifest.isSealed, false, false
        );
        if (!_manifest.isSealed && action.proposer != genesisBootstrapAuthority) {
            revert GenesisBootstrapActorRequired(action.proposer);
        }
        if (!_manifest.isSealed) {
            _requireBootstrapCodeHashes();
        } else {
            _requireGovernanceRootCodeHash();
        }
        if (action.actionClass == StreamGovernanceActionClasses.TERMINAL_FREEZE) {
            _requireBoundRoleRegistry();
            StreamGovernanceBootstrap.validateTerminalFreezeGuardians(_manifest.roleRegistry, calls);
            bytes32 expectedCommitment = _terminalFreezeGuardianConfigCommitments[actionId];
            bytes32 actualCommitment = StreamGovernancePolicy.terminalFreezeGuardianConfigCommitment(
                _manifest.roleRegistry, calls
            );
            if (actualCommitment != expectedCommitment) {
                revert TerminalFreezeGuardianConfigDrift(
                    actionId, expectedCommitment, actualCommitment
                );
            }
        }
        // [GOV-BATCH] rule 2: msg.value equals the exact batch value sum.
        if (msg.value != totalValue) {
            revert BatchValueMismatch(totalValue, msg.value);
        }

        action.status = GovernanceActionStatus.EXECUTED;
        action.executor = msg.sender;
        _pruneLiveTerminalFreeze(actionId, action.actionClass);
        _executing = true;
        _currentActionId = actionId;
        _currentActionClass = action.actionClass;
        _currentBatchLength = calls.length;

        // Governed targets observe these values through currentAction() during
        // each call. Clearing them immediately afterward is the security
        // boundary, not a redundant write.
        // slither-disable-start write-after-write
        for (uint256 i = 0; i < calls.length; i++) {
            _currentCallIndex = i;
            _currentScopeHash = calls[i].scopeHash;
            _currentOldValueHash = calls[i].oldValueHash;
            _currentNewValueHash = calls[i].newValueHash;
            _executeCall(actionId, i, calls[i], callDatas[i]);
            _currentScopeHash = bytes32(0);
            _currentOldValueHash = bytes32(0);
            _currentNewValueHash = bytes32(0);
        }
        // slither-disable-end write-after-write

        if (bootstrapSeal) {
            emit SystemManifestBootstrapSealed(
                SCHEMA_VERSION,
                _manifest.bootstrapTriggerSetHash,
                _manifest.expectedTriggerCount,
                _manifest.sealedPayloadPointer,
                _manifest.expectedManifestHash,
                actionId
            );
        }

        _executing = false;
        _currentActionId = bytes32(0);
        _currentActionClass = 0;
        _currentBatchLength = 0;
        _currentCallIndex = 0;
        _pendingScheduledActionCount -= 1;

        // [GOV-BATCH] rule 2: refunded surplus reverts the batch rather than
        // stranding value in the governance contract.
        uint256 expectedBalance = startBalance - totalValue;
        if (address(this).balance != expectedBalance) {
            revert BatchValueSurplus(address(this).balance - expectedBalance);
        }

        emit GovernanceActionExecuted(
            SCHEMA_VERSION,
            actionId,
            action.actionClass,
            action.target,
            action.value,
            action.selector,
            action.callHash,
            action.scopeHash,
            action.oldValueHash,
            action.newValueHash,
            msg.sender,
            action.manifestHash
        );
    }

    function _executeCall(
        bytes32 actionId,
        uint256 callIndex,
        GovernanceCall memory call_,
        bytes memory callData
    ) private {
        if (callData.length == 0) {
            if (call_.target.code.length == 0 && !_policy.approvedNativeReceivers[call_.target]) {
                revert NativeReceiverNotApproved(call_.target);
            }
        } else if (call_.target.code.length == 0) {
            revert TargetHasNoCode(callIndex, call_.target);
        }
        address target = call_.target;
        uint256 value = call_.value;
        bool success;
        uint256 returnDataBytes;
        assembly ("memory-safe") {
            // Successful governed calls have no return-value contract. Use a
            // zero-sized output buffer so a target cannot force the Executor
            // to allocate or copy an unbounded success payload.
            success := call(gas(), target, value, add(callData, 0x20), mload(callData), 0x00, 0x00)
            returnDataBytes := returndatasize()
        }
        if (success) return;
        if (returnDataBytes == 0) revert GovernanceCallFailed(actionId, callIndex);
        if (returnDataBytes > MAX_GOVERNANCE_REVERT_DATA_BYTES) {
            revert GovernanceCallReturndataTooLarge(
                actionId, callIndex, returnDataBytes, MAX_GOVERNANCE_REVERT_DATA_BYTES
            );
        }
        assembly ("memory-safe") {
            let returnData := mload(0x40)
            returndatacopy(returnData, 0x00, returnDataBytes)
            revert(returnData, returnDataBytes)
        }
    }

    function _validateCalls(
        uint8 actionClass,
        GovernanceCall[] memory calls,
        bytes[] memory callDatas
    ) private view returns (uint256) {
        return StreamGovernanceBootstrap.validateCalls(
            _policy,
            address(_manifest.roleRegistry),
            _manifest.systemManifestSatellite,
            actionClass,
            calls,
            callDatas,
            this.sealSystemManifestBootstrap.selector
        );
    }

    function _validateWindow(uint8 actionClass, uint64 notBefore, uint64 expiresAfter)
        private
        view
    {
        StreamGovernanceBootstrap.validateActionWindow(actionClass, notBefore, expiresAfter);
    }

    function _computeActionId(
        StreamGovernanceBootstrap.ScheduleContext memory ctx,
        bytes32 callsHash,
        uint256 nonceUsed
    ) private view returns (bytes32) {
        StreamGovernanceBootstrap.ActionIdentity memory identity =
            StreamGovernanceBootstrap.ActionIdentity({
                actionClass: ctx.actionClass,
                callsHash: callsHash,
                scopeHash: ctx.scopeHash,
                oldValueHash: ctx.oldValueHash,
                newValueHash: ctx.newValueHash,
                nonce: nonceUsed,
                notBefore: ctx.notBefore,
                expiresAfter: ctx.expiresAfter,
                reasonHash: ctx.reasonHash,
                manifestHash: ctx.manifestHash
            });
        return StreamGovernanceBootstrap.governanceActionId(identity);
    }

    function _firstSelector(bytes memory callData) private pure returns (bytes4 selector) {
        assembly ("memory-safe") {
            selector := mload(add(callData, 0x20))
        }
    }

    function _callsHash(GovernanceCall[] memory calls) private pure returns (bytes32) {
        return StreamGovernanceBootstrap.governanceCallsHash(calls);
    }

    function _deriveBatchTransitionHashes(GovernanceCall[] memory calls, bytes32 callsHash)
        private
        pure
        returns (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash)
    {
        (scopeHash, oldValueHash, newValueHash) =
            StreamGovernanceBootstrap.deriveBatchTransitionHashes(calls, callsHash);
    }

    function _bytesEqual(bytes memory left, bytes memory right) private pure returns (bool equal) {
        return StreamGovernanceBootstrap.bytesEqual(left, right);
    }
}
