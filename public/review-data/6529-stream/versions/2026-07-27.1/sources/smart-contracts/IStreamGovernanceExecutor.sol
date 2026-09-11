// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Scheduled governance action lifecycle states pinned by ADR 0004
///         (`docs/adr/0004-admin-governance.md`, Scheduled Action State).
enum GovernanceActionStatus {
    NONE,
    SCHEDULED,
    CANCELLED,
    EXECUTED,
    EXPIRED,
    VETOED
}

/// @notice One call inside a governance action batch ([GOV-ACTION-ID]).
struct GovernanceCall {
    address target;
    uint256 value;
    bytes4 selector;
    bytes32 callDataHash; // keccak256(callData)
    bytes32 scopeHash; // target-specific transition scope
    bytes32 oldValueHash; // target-specific pre-state commitment
    bytes32 newValueHash; // target-specific post-state commitment
}

/// @notice Stored governance action record pinned by ADR 0004.
/// @dev For batches, `callHash` stores the [GOV-ACTION-ID] `callsHash` and
///     `target`/`selector` are those of the first call for indexing; `value`
///     is the batch value sum ([GOV-BATCH] rule 3).
struct GovernanceAction {
    GovernanceActionStatus status;
    uint8 actionClass;
    address target;
    uint256 value;
    bytes4 selector;
    bytes32 callHash;
    bytes32 scopeHash;
    bytes32 oldValueHash;
    bytes32 newValueHash;
    uint64 notBefore;
    uint64 expiresAfter;
    address proposer;
    address executor;
    address canceller;
    address vetoer;
    bytes32 reasonHash;
    string reasonURI;
    bytes32 manifestHash;
}

/// @notice Single-call scheduling request pinned by ADR 0004; the wrapper must
///         produce a byte-identical action ID to the equivalent one-call batch.
struct GovernanceActionRequest {
    uint8 actionClass;
    address target;
    uint256 value;
    bytes4 selector;
    bytes callData;
    bytes32 scopeHash;
    bytes32 oldValueHash;
    bytes32 newValueHash;
    uint64 notBefore;
    uint64 expiresAfter;
    bytes32 reasonHash;
    string reasonURI;
    bytes32 manifestHash;
}

/// @notice Launch-v1 governance action classes as rebaselined by ADR 0017.
/// @dev Numeric IDs are append-only. ID 6 is retired pre-genesis, forbidden,
///      and must never be reassigned.
library StreamGovernanceActionClasses {
    uint8 internal constant IMMEDIATE_TIGHTENING = 0;
    uint8 internal constant DELAYED_LOOSENING = 1;
    uint8 internal constant TERMINAL_FREEZE = 2;
    uint8 internal constant POINTER_REPLACEMENT = 3;
    uint8 internal constant FUNDS_RECOVERY = 4;
    uint8 internal constant SUCCESSOR_DECLARATION = 5;
}

/// @notice One immutable manifest-tail trigger rule.
struct ManifestTailTriggerRule {
    bytes32 triggerCodeHash;
    uint8 allowedActionClassMask;
}

/// @notice One append-only manifest-tail trigger key.
struct ManifestTailTriggerEntry {
    address triggerTarget;
    bytes4 triggerSelector;
}

/// @notice One expected genesis manifest-tail trigger.
struct SystemManifestBootstrapTriggerExpectation {
    address triggerTarget;
    bytes4 triggerSelector;
    bytes32 triggerCodeHash;
    uint8 allowedActionClassMask;
}

/// @notice Irreversible downstream binding supplied after executor-first deployment.
struct SystemManifestBootstrapBinding {
    address roleRegistry;
    address governanceRoot;
    bytes32 governanceRootCodeHash;
    address[] initialTerminalFreezeVetoGuardians;
    address core;
    address systemManifestSatellite;
    bytes32 expectedManifestHash;
    bytes32 expectedInventoryStateRoot;
    uint64 expectedInventoryLeafCount;
    SystemManifestBootstrapTriggerExpectation[] expectedTriggers;
    bytes32[] pointerTypes;
    address[] registries;
}

/// @notice Staged governance executor implementing the canonical action
///         identity, batch execution, window floors, and veto surface of
///         ADR 0004 [GOV-ACTION-ID], [GOV-BATCH], and [GOV-WINDOWS].
interface IStreamGovernanceExecutor {
    error ZeroProposer();
    error ZeroCanceller();
    error ZeroTighteningTarget();
    error ZeroTighteningSelector();
    error ZeroFreezeTarget();
    error ZeroFreezeSelector();
    error FreezeSelectorSelfTargetForbidden(bytes4 selector);
    error ZeroNativeReceiver();
    /// @notice Reverts when the caller may not schedule or cancel actions.
    error GovernanceActorNotAuthorized(address actor);
    /// @notice Reverts when a non-root proposer attempts to mutate the
    ///         Executor or its permanently owned RoleRegistry.
    error GovernanceRootProposerRequired(
        address proposer, address governanceRoot, address target, bytes4 selector
    );
    /// @notice Reverts when an Executor-mediated RoleRegistry call attempts
    ///         to use a fast, terminal, or otherwise non-ordinary action class.
    error RoleRegistryDelayedActionRequired(uint8 actionClass);
    /// @notice Reverts on scheduling with an action class outside the pinned set.
    error UnknownActionClass(uint8 actionClass);
    /// @notice Reverts on scheduling an empty batch.
    error EmptyGovernanceBatch();
    /// @notice Reverts when `callDatas` does not pair one-to-one with `calls`.
    error CallDataCountMismatch(uint256 callCount, uint256 callDataCount);
    /// @notice Reverts when scheduling a batch whose exact calldata preimages
    ///         have not been published onchain ([GOV-BATCH] rule 5).
    error CallDataNotPublished(bytes32 callDataKey);
    /// @notice Reverts when a supplied calldata blob does not hash to `callDataHash`.
    error CallDataHashMismatch(uint256 callIndex);
    /// @notice Reverts when calldata is 1-3 bytes and cannot carry a selector.
    error CallDataTooShort(uint256 callIndex);
    /// @notice Reverts when calldata's leading selector differs from the pinned selector.
    error CallSelectorMismatch(uint256 callIndex);
    /// @notice Reverts on zero-address call targets.
    error ZeroGovernanceTarget(uint256 callIndex);
    /// @notice Reverts when an IMMEDIATE_TIGHTENING call is not registered as
    ///         tightening by the classifier.
    error NotClassifiedTightening(address target, bytes4 selector);
    /// @notice Reverts when a registered ModuleRegistry status call cannot be
    ///         decoded into its exact module and requested lifecycle state.
    error InvalidModuleRegistryStatusCall(address target);
    /// @notice Reverts when the calldata-aware ModuleRegistry direction and
    ///         the scheduled action class disagree.
    error ModuleRegistryStatusActionClassMismatch(
        address target,
        address module,
        uint8 currentStatus,
        uint8 requestedStatus,
        uint8 expectedClass,
        uint8 actualClass
    );
    /// @notice Reverts when the bound RoleRegistry's RoleManager mutation is
    ///         not the exact canonical `registerRoleManager(address,bool)` ABI.
    error InvalidRoleManagerConfigCall(address target);
    /// @notice Reverts when RoleManager enablement/removal is scheduled under
    ///         the wrong direction-sensitive action class.
    error RoleManagerConfigActionClassMismatch(
        address target, address account, bool enabled, uint8 expectedClass, uint8 actualClass
    );
    /// @notice Reverts when an Executor self-configuration call is not the
    ///         exact canonical ABI shape required for schedule-time direction proof.
    error InvalidExecutorConfigCall(address target, bytes4 selector);
    /// @notice Reverts when a direction-sensitive Executor self-configuration
    ///         call is scheduled under the wrong action class.
    error ExecutorConfigActionClassMismatch(
        address target, bytes4 selector, bool enabled, uint8 expectedClass, uint8 actualClass
    );
    /// @notice Reverts when a fixed-class Executor control-plane call is
    ///         scheduled under a different action class.
    error ExecutorControlActionClassMismatch(
        address target, bytes4 selector, uint8 expectedClass, uint8 actualClass
    );
    /// @notice Reverts when a control-plane action was scheduled under an
    ///         earlier governance-root revision, including an address ABA.
    error GovernanceRootRevisionMismatch(bytes32 actionId, uint64 expected, uint64 actual);
    /// @notice Reverts when a registered proposer's queued action survives a
    ///         disable/re-enable or any other proposer-revision change.
    error GovernanceProposerAuthorizationDrift(
        bytes32 actionId, address proposer, uint64 expected, uint64 actual, bool enabled
    );
    /// @notice Reverts when the Executor's own hard-coded direction classifier
    ///         is targeted by the mutable tightening-call registry.
    error TighteningCallSelfTargetForbidden(bytes4 selector);
    /// @notice Reverts before narrowing or adding to a timestamp that cannot
    ///         fit the Governance V2 uint64 time domain.
    error GovernanceTimestampOverflow(uint256 timestamp);
    /// @notice Reverts when `notBefore` is earlier than the class minimum delay.
    error DelayBelowClassMinimum(uint8 actionClass, uint64 notBefore, uint64 earliest);
    /// @notice Reverts when a delayed class has less than seven days in its
    ///         open-to-execute window.
    error OpenWindowBelowFloor(uint64 notBefore, uint64 expiresAfter);
    /// @notice Reverts when `expiresAfter` is not after `notBefore` or exceeds
    ///         the launch-pinned maximum action lifetime.
    error InvalidActionWindow(uint64 notBefore, uint64 expiresAfter);
    /// @notice Reverts when acting on an action ID with no stored record.
    error GovernanceActionUnknown(bytes32 actionId);
    /// @notice Reverts when the action is not in the required lifecycle status.
    error GovernanceActionNotScheduled(bytes32 actionId);
    /// @notice Reverts on executing before `notBefore`.
    error GovernanceActionNotExecutable(bytes32 actionId, uint64 notBefore);
    /// @notice Reverts on executing or materializing against the expiry boundary.
    error GovernanceActionExpiredWindow(bytes32 actionId, uint64 expiresAfter);
    /// @notice Reverts when the recomputed calls hash differs from the stored action.
    error CallsHashMismatch(bytes32 actionId);
    /// @notice Reverts when the recomputed action ID differs from the stored action.
    error ActionIdMismatch(bytes32 actionId);
    /// @notice Reverts when `msg.value` does not equal the batch value sum.
    error BatchValueMismatch(uint256 expected, uint256 supplied);
    /// @notice Reverts when a non-native-transfer call targets an address without code.
    error TargetHasNoCode(uint256 callIndex, address target);
    /// @notice Reverts when an empty-calldata value transfer targets an
    ///         unapproved native receiver.
    error NativeReceiverNotApproved(address target);
    /// @notice Reverts when a batch call fails without revert data.
    error GovernanceCallFailed(bytes32 actionId, uint256 callIndex);
    /// @notice Reverts without copying a governed target's unbounded failure
    ///         payload when it exceeds the Executor's pinned bubbling cap.
    error GovernanceCallReturndataTooLarge(
        bytes32 actionId, uint256 callIndex, uint256 returnDataBytes, uint256 maxReturnDataBytes
    );
    /// @notice Reverts when execution leaves surplus value in the executor.
    error BatchValueSurplus(uint256 surplus);
    /// @notice Reverts when the veto caller does not hold the per-scope or
    ///         global ROLE_TERMINAL_FREEZE_VETO authority.
    error NotTerminalFreezeVetoGuardian(address actor);
    /// @notice Reverts when vetoing a non-terminal-freeze action.
    error NotTerminalFreezeAction(bytes32 actionId);
    /// @notice Reverts when vetoing after the veto deadline.
    error VetoDeadlinePassed(bytes32 actionId, uint64 vetoDeadline);
    /// @notice Reverts when materializing expiry before `expiresAfter`.
    error GovernanceActionNotExpired(bytes32 actionId, uint64 expiresAfter);
    /// @notice Reverts when a batch containing a registered freeze
    ///         `(target, selector)` is scheduled under any class other than
    ///         TERMINAL_FREEZE (executor-side veto-floor backstop).
    error TerminalFreezeClassRequired(address target, bytes4 selector);
    /// @notice Reverts when scheduling a TERMINAL_FREEZE action while no
    ///         ROLE_TERMINAL_FREEZE_VETO holder exists to exercise the veto.
    error NoTerminalFreezeVetoGuardianConfigured(bytes32 scopeHash);
    /// @notice Reverts on a live-terminal-freeze enumeration index out of bounds.
    error LiveTerminalFreezeIndexOutOfBounds(bytes32 scopeHash, uint256 index);
    /// @notice Reverts when one scope already has the maximum number of
    ///         simultaneously open terminal-freeze veto memberships.
    error TerminalFreezeLiveActionCapExceeded(bytes32 scopeHash, uint256 cap);
    /// @notice Reverts when non-root proposers have consumed the shared
    ///         per-scope capacity reserved below the total live-action cap.
    error TerminalFreezeNonRootLiveActionCapExceeded(bytes32 scopeHash, uint256 cap);
    /// @notice Reverts when one non-root proposer reaches its per-scope live
    ///         terminal-freeze membership cap.
    error TerminalFreezeProposerLiveActionCapExceeded(
        bytes32 scopeHash, address proposer, uint256 cap
    );
    /// @notice Reverts when a raw terminal-freeze page cursor exceeds the
    ///         current bounded membership length.
    error TerminalFreezePageCursorOutOfBounds(
        bytes32 scopeHash, uint256 cursor, uint256 membershipCount
    );
    /// @notice Reverts when a raw terminal-freeze page requests more than the
    ///         protocol-pinned bounded page size.
    error TerminalFreezePageLimitExceeded(uint256 limit, uint256 maxLimit);
    /// @notice Reverts when caller-supplied aggregate transition hashes are not derived from calls.
    error BatchScopeHashMismatch(bytes32 expected, bytes32 supplied);
    error BatchOldValueHashMismatch(bytes32 expected, bytes32 supplied);
    error BatchNewValueHashMismatch(bytes32 expected, bytes32 supplied);
    /// @notice Reverts when scheduled calldata bytes differ from the immutable publication.
    error ScheduledCallDataMismatch(uint256 callIndex);
    /// @notice Reverts when a published payload is not a canonical `abi.encode(bytes[])` value.
    error NonCanonicalCallDataPublication();
    /// @notice Reverts when an action is attempted before the one-way bootstrap is bound/sealed.
    error SystemManifestBootstrapNotBound();
    error SystemManifestBootstrapAlreadyBound();
    error SystemManifestBootstrapNotSealed();
    error SystemManifestBootstrapAlreadySealed();
    error InvalidGenesisBootstrapAuthority(address authority);
    error GenesisBootstrapActorRequired(address actor);
    error InvalidRoleRegistry(address registry);
    error RoleRegistryCodeHashMismatch(bytes32 expected, bytes32 actual);
    error InvalidSystemManifestBootstrap();
    error BootstrapActionNotPermitted();
    error PendingGovernanceActionExists(uint256 count);
    /// @notice Reverts on invalid immutable tail rules or composition.
    error InvalidManifestTailTrigger(address target, bytes4 selector);
    error ManifestTailTriggerAlreadyRegistered(address target, bytes4 selector);
    error ManifestTailTriggerRegistrationNotIsolated();
    error ManifestTailActionClassNotAllowed(address target, bytes4 selector, uint8 actionClass);
    error ManifestTailRequired();
    error InvalidManifestTail();
    error ManifestTailCodeHashMismatch(bytes32 expected, bytes32 actual);
    error ManifestTailTriggerIndexOutOfBounds(uint256 index);
    error GovernanceSelfCallContextRequired();
    error GovernanceTransitionContextMismatch();
    error TerminalFreezeGuardianConfigDrift(
        bytes32 actionId, bytes32 expectedCommitment, bytes32 actualCommitment
    );
    error InvalidGovernanceRoot(address governanceRoot);
    error GovernanceRootCodeHashMismatch(bytes32 expected, bytes32 actual);
    error GovernanceRootNoOp(address governanceRoot);
    error GovernanceRevisionOverflow(bytes32 configKind, address key);
    error GovernanceConfigNoOp(bytes32 configKind, address key, bool enabled);
    error DirectOwnershipMutationDisabled();
    error GovernancePolicyCodeHashMismatch(
        address target, bytes4 selector, bytes32 expected, bytes32 actual
    );
    error GovernanceSchedulingDuringExecution();
    error GovernanceIdentityRoleOverlap(address account, bytes32 role);

    event GovernanceActionScheduled(
        uint16 schemaVersion,
        bytes32 indexed actionId,
        uint8 indexed actionClass,
        address indexed target,
        uint256 value,
        bytes4 selector,
        bytes32 callHash,
        bytes32 scopeHash,
        bytes32 oldValueHash,
        bytes32 newValueHash,
        uint64 notBefore,
        uint64 expiresAfter,
        uint256 nonce,
        address proposer,
        bytes32 reasonHash,
        string reasonURI,
        bytes32 manifestHash
    );

    event GovernanceActionExecuted(
        uint16 schemaVersion,
        bytes32 indexed actionId,
        uint8 indexed actionClass,
        address indexed target,
        uint256 value,
        bytes4 selector,
        bytes32 callHash,
        bytes32 scopeHash,
        bytes32 oldValueHash,
        bytes32 newValueHash,
        address executor,
        bytes32 manifestHash
    );

    event GovernanceActionCancelled(
        uint16 schemaVersion,
        bytes32 indexed actionId,
        uint8 indexed actionClass,
        address indexed target,
        bytes4 selector,
        bytes32 callHash,
        bytes32 scopeHash,
        address canceller,
        bytes32 reasonHash,
        string reasonURI
    );

    event GovernanceActionVetoed(
        uint16 schemaVersion,
        bytes32 indexed actionId,
        uint8 indexed actionClass,
        address indexed vetoer,
        bytes32 scopeHash,
        bytes32 reasonHash
    );
    /// @notice Emitted after every raw terminal-freeze membership append or removal.
    /// @dev `mutationCause` is 1 for append, 2 for elapsed compaction, and 3 for
    ///      action-terminal cleanup. `rawIndex` is zero-based and `remainingCount`
    ///      is the post-mutation raw membership count for `scopeHash`.
    event TerminalFreezeActionMembershipUpdated(
        uint16 schemaVersion,
        bytes32 indexed scopeHash,
        bytes32 indexed actionId,
        address indexed proposer,
        bool present,
        uint8 mutationCause,
        bool usesRootCapacity,
        uint64 vetoDeadline,
        uint256 rawIndex,
        uint256 remainingCount
    );

    /// @notice Emitted when a virtual expiry is materialized into storage.
    event GovernanceActionExpired(
        uint16 schemaVersion,
        bytes32 indexed actionId,
        uint8 indexed actionClass,
        address materializer
    );

    /// @notice Emitted when a calldata preimage set is published onchain.
    event GovernanceCallDataPublished(
        uint16 schemaVersion, bytes32 indexed callDataKey, address pointer, address publisher
    );

    event SystemManifestTailTriggerRegistered(
        uint16 schemaVersion,
        address indexed triggerTarget,
        bytes4 indexed triggerSelector,
        bytes32 triggerCodeHash,
        uint8 allowedActionClassMask,
        address tailTarget,
        bytes4 tailSelector,
        bytes32 indexed actionId
    );

    event SystemManifestBootstrapBound(
        uint16 schemaVersion,
        address indexed core,
        address indexed systemManifestSatellite,
        bytes32 coreCodeHash,
        bytes32 systemManifestSatelliteCodeHash,
        bytes32 indexed expectedManifestHash,
        bytes32 expectedInventoryStateRoot,
        bytes32 expectedTriggerSetHash,
        uint256 triggerCount,
        address genesisBootstrapAuthority,
        address roleRegistry,
        bytes32 roleRegistryCodeHash,
        address governanceRoot,
        bytes32 governanceRootCodeHash,
        bytes32 initialGuardianSetHash,
        uint256 initialGuardianCount,
        bytes32 terminalFreezeVetoMutationChain,
        uint64 terminalFreezeVetoMutationRevision
    );

    event SystemManifestBootstrapSealed(
        uint16 schemaVersion,
        bytes32 indexed triggerSetHash,
        uint256 triggerCount,
        address indexed payloadPointer,
        bytes32 manifestHash,
        bytes32 indexed actionId
    );

    event GovernanceRootRotated(
        uint16 schemaVersion,
        address indexed oldRoot,
        address indexed newRoot,
        bytes32 newRootCodeHash,
        uint64 revision,
        bytes32 indexed actionId
    );
    event TerminalFreezeGuardianConfigCommitted(
        uint16 schemaVersion, bytes32 indexed actionId, bytes32 indexed commitment
    );
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
    event TighteningCallUpdated(
        uint16 schemaVersion,
        address indexed target,
        bytes4 indexed selector,
        bool tightening,
        bytes32 targetCodeHash,
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
    /// @notice Emitted when a known-irreversible freeze `(target, selector)` is
    ///         registered or cleared for the executor-side veto-floor backstop.
    event FreezeSelectorUpdated(
        uint16 schemaVersion,
        address indexed target,
        bytes4 indexed selector,
        bool freeze,
        bytes32 targetCodeHash,
        uint64 revision,
        bytes32 indexed actionId
    );

    /// @notice Returns the stored action; while `SCHEDULED` and past
    ///         `expiresAfter`, the returned status is virtually `EXPIRED`.
    function governanceAction(bytes32 actionId) external view returns (GovernanceAction memory);

    /// @notice Returns the next nonce consumed by scheduling.
    function governanceNonce() external view returns (uint256);

    function registerProposer(address account, bool enabled) external;

    function registerCanceller(address account, bool enabled) external;

    function setApprovedNativeReceiver(address receiver, bool approved) external;

    function setTighteningCall(address target, bytes4 selector, bool tightening) external;

    function registerFreezeSelector(address target, bytes4 selector, bool freeze) external;

    function isProposer(address account) external view returns (bool);

    function isCanceller(address account) external view returns (bool);

    function isApprovedNativeReceiver(address receiver) external view returns (bool);

    function isTighteningCall(address target, bytes4 selector) external view returns (bool);

    function isFreezeSelector(address target, bytes4 selector) external view returns (bool);

    function proposerConfig(address account)
        external
        view
        returns (bool enabled, uint64 revision, bytes32 stateHash);

    function cancellerConfig(address account)
        external
        view
        returns (bool enabled, uint64 revision, bytes32 stateHash);

    function approvedNativeReceiverConfig(address receiver)
        external
        view
        returns (bool approved, uint64 revision, bytes32 stateHash);

    function tighteningCallConfig(address target, bytes4 selector)
        external
        view
        returns (bool tightening, bytes32 targetCodeHash, uint64 revision, bytes32 stateHash);

    function freezeSelectorConfig(address target, bytes4 selector)
        external
        view
        returns (bool freeze, bytes32 targetCodeHash, uint64 revision, bytes32 stateHash);

    function governanceRootState()
        external
        view
        returns (address governanceRoot, bytes32 codeHash, uint64 revision);

    function rotateGovernanceRoot(address newRoot, bytes32 expectedCodeHash) external;

    function terminalFreezeGuardianConfigCommitment(bytes32 actionId)
        external
        view
        returns (bytes32 commitment);

    /// @notice Returns the launch-pinned minimum delay for `actionClass`.
    function minimumDelay(uint8 actionClass) external pure returns (uint64);

    /// @notice Publishes the exact ordered calldata preimages for a batch as an
    ///         SSTORE2 blob ([GOV-BATCH] rule 5; ADR 0013 decision U5).
    /// @dev Permissionless and content-addressed: the key is
    ///     `keccak256(abi.encodePacked(keccak256(callDatas[0]), ...))`, so a
    ///     published blob can never disagree with the `callDataHash` entries of
    ///     a batch that resolves to it. Republishing an existing set is
    ///     idempotent. Scheduling requires the batch's preimages to be
    ///     published so the stored action record carries the pointer for the
    ///     full open-to-execute window.
    function publishGovernanceCallData(bytes[] calldata callDatas)
        external
        returns (address pointer);

    /// @notice Returns the published SSTORE2 pointer for a calldata key, or
    ///         the zero address when unpublished.
    function publishedCallData(bytes32 callDataKey) external view returns (address pointer);

    /// @notice Schedules a batch of calls as one atomic governance action
    ///         ([GOV-ACTION-ID] explicit batch ABI; ADR 0011 decision R10).
    /// @dev Reverts with `CallDataNotPublished` unless the exact calldata
    ///     preimages for `calls` were published via `publishGovernanceCallData`
    ///     (same transaction is fine); the stored action record then carries
    ///     the SSTORE2 pointer ([GOV-BATCH] rule 5).
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
    ) external returns (bytes32 actionId);

    /// @notice Executes a scheduled batch; atomic, payable-value pinned
    ///         (`msg.value == sum(calls[].value)`), permissionless after
    ///         `notBefore` ([GOV-BATCH] rules 1-2).
    function executeGovernanceBatch(
        bytes32 actionId,
        GovernanceCall[] calldata calls,
        bytes[] calldata callDatas
    ) external payable;

    /// @notice Single-call wrapper producing a byte-identical action ID to the
    ///         equivalent one-call batch.
    function scheduleGovernanceAction(GovernanceActionRequest calldata request)
        external
        returns (bytes32 actionId);

    /// @notice Single-call execution wrapper over the stored first-call fields.
    function executeGovernanceAction(bytes32 actionId, bytes calldata callData) external payable;

    /// @notice Cancels a scheduled action before execution.
    function cancelGovernanceAction(bytes32 actionId, bytes32 reasonHash) external;

    /// @notice Materializes `EXPIRED` for a scheduled action past `expiresAfter`.
    function materializeExpiredAction(bytes32 actionId) external;

    /// @notice Returns a target-transition scope's sole effective veto guardian
    ///         and the deadline of its EARLIEST live terminal-freeze action.
    /// @dev Terminal-freeze batches are indexed once under every distinct
    ///     `GovernanceCall.scopeHash`, never under the V2 action aggregate.
    ///     Per-scope and global holders are additive veto authorities. The
    ///     address is nonzero only when their deduplicated union has exactly one
    ///     member; otherwise `guardian` is the zero-address sentinel. Use
    ///     `terminalFreezeVetoGuardianSet` plus RoleRegistry enumeration for the
    ///     complete set. `vetoDeadline` is zero when the scope has no
    ///     live (scheduled, pre-`notBefore`) terminal-freeze action. Because a
    ///     scope may have several live actions, use
    ///     `liveTerminalFreezeActionCount`/`liveTerminalFreezeActionAt` to
    ///     enumerate them all; this read never hides a live action behind a
    ///     later-scheduled decoy.
    function terminalFreezeVetoGuardian(bytes32 scopeHash)
        external
        view
        returns (address guardian, uint64 vetoDeadline);

    /// @notice Returns the exact RoleRegistry enumeration recipe for every
    ///         additive veto guardian effective for a scope.
    function terminalFreezeVetoGuardianSet(bytes32 scopeHash)
        external
        view
        returns (
            address roleRegistryAddress,
            bytes32 scopedRole,
            uint256 scopedHolderCount,
            bytes32 globalRole,
            uint256 globalHolderCount,
            uint64 vetoDeadline
        );

    /// @notice Returns the total, shared non-root, and per-non-root-proposer
    ///         caps for open terminal-freeze memberships in one scope.
    function terminalFreezeLiveActionCaps()
        external
        pure
        returns (uint256 totalCap, uint256 nonRootCap, uint256 perNonRootProposerCap);

    /// @notice Returns raw capacity usage for one scope and non-root proposer.
    /// @dev Usage includes elapsed memberships until bounded pruning runs.
    function terminalFreezeLiveActionUsage(bytes32 scopeHash, address proposer)
        external
        view
        returns (uint256 totalMemberships, uint256 nonRootMemberships, uint256 proposerMemberships);

    /// @notice Permissionlessly removes memberships whose veto deadline has
    ///         elapsed. This does not mutate action status or pending counts.
    function pruneElapsedTerminalFreezeActions(bytes32 scopeHash)
        external
        returns (uint256 prunedCount);

    /// @notice Returns one bounded page of raw veto-discovery memberships.
    /// @dev Entries may be elapsed until permissionless pruning runs; compare
    ///      each deadline with the current block timestamp.
    function terminalFreezeActionPage(bytes32 scopeHash, uint256 cursor, uint256 limit)
        external
        view
        returns (bytes32[] memory actionIds, uint64[] memory vetoDeadlines, uint256 nextCursor);

    /// @notice Returns the number of live (scheduled, pre-`notBefore`)
    ///         terminal-freeze actions affecting target scope `scopeHash`.
    /// @dev Actions remain in the O(1) mutation index until a terminal state
    ///      transition, but this view excludes them as soon as their veto deadline
    ///      is reached.
    function liveTerminalFreezeActionCount(bytes32 scopeHash) external view returns (uint256);

    /// @notice Returns the `index`-th live terminal-freeze action for
    ///         `scopeHash` and its veto deadline (`notBefore`).
    /// @dev Indices densely enumerate only pre-deadline actions in the backing
    ///      set's deterministic order; elapsed entries are skipped without a
    ///      state mutation.
    function liveTerminalFreezeActionAt(bytes32 scopeHash, uint256 index)
        external
        view
        returns (bytes32 actionId, uint64 vetoDeadline);

    /// @notice Per-scope veto role constant:
    ///         `keccak256(abi.encode(ROLE_TERMINAL_FREEZE_VETO, scopeHash))`.
    function terminalFreezeVetoRole(bytes32 scopeHash) external pure returns (bytes32);

    /// @notice Vetoes a scheduled terminal-freeze action before its veto
    ///         deadline. A global holder or a holder for any distinct affected
    ///         per-call scope may veto the whole atomic batch.
    function vetoTerminalFreeze(bytes32 actionId, bytes32 reasonHash) external;

    /// @notice Returns the in-flight action context during batch execution so
    ///         governed targets can verify the executing action class.
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

    /// @notice Returns the SSTORE2 pointer holding the scheduled calldata
    ///         preimages for `actionId` ([LTA-PAYLOAD-DISCOVERY] typed pointer).
    function scheduledCallDataPointer(bytes32 actionId) external view returns (address);

    /// @notice Reads back the exact scheduled calldata preimages for `actionId`.
    function scheduledCallData(bytes32 actionId) external view returns (bytes[] memory);

    function systemManifestBatchTailRule(address triggerTarget, bytes4 triggerSelector)
        external
        view
        returns (
            bool registered,
            bytes32 triggerCodeHash,
            uint8 allowedActionClassMask,
            address tailTarget,
            bytes4 tailSelector,
            bytes32 tailCodeHash
        );

    function registerSystemManifestTailTrigger(
        address triggerTarget,
        bytes4 triggerSelector,
        uint8 allowedActionClassMask
    ) external;

    function systemManifestTailTriggerCount() external view returns (uint256);

    function systemManifestTailTriggerAt(uint256 index)
        external
        view
        returns (
            address triggerTarget,
            bytes4 triggerSelector,
            bytes32 triggerCodeHash,
            uint8 allowedActionClassMask
        );

    function systemManifestTailTriggerChainHash()
        external
        view
        returns (bytes32 chainHash, uint64 recordCount);

    function bindSystemManifestBootstrap(SystemManifestBootstrapBinding calldata binding) external;

    function pendingScheduledActionCount() external view returns (uint256);

    function systemManifestBootstrapState()
        external
        view
        returns (
            bool bound,
            bool isSealed,
            address roleRegistry,
            bytes32 roleRegistryCodeHash,
            address governanceRoot,
            bytes32 governanceRootCodeHash,
            uint64 governanceRootRevision,
            bytes32 initialGuardianSetHash,
            uint256 initialGuardianCount,
            bytes32 terminalFreezeVetoMutationChain,
            uint64 terminalFreezeVetoMutationRevision,
            address core,
            bytes32 coreCodeHash,
            address systemManifestSatellite,
            bytes32 systemManifestSatelliteCodeHash,
            bytes32 triggerSetHash,
            uint256 triggerCount,
            bytes32 expectedTriggerSetHash,
            uint256 expectedTriggerCount,
            bytes32 expectedManifestHash,
            bytes32 expectedInventoryStateRoot,
            uint256 expectedInventoryLeafCount,
            bytes32 inventoryStateRoot,
            uint256 inventoryLeafCount,
            address genesisBootstrapAuthority,
            address sealedPayloadPointer
        );

    function sealSystemManifestBootstrap() external;
}
