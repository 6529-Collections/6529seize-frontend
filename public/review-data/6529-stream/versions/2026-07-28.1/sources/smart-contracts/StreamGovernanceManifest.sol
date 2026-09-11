// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IStreamGovernanceExecutor.sol";
import "./IStreamModuleRegistry.sol";
import "./IStreamRoleRegistry.sol";
import "./StreamGovernanceBootstrap.sol";
import "./StreamGovernanceEvidence.sol";
import "./StreamGovernancePolicy.sol";
import "./StreamRoles.sol";

/// @notice Linked lifecycle and evidence library for the one-way system-manifest
///         bootstrap. Public functions execute by DELEGATECALL, preserving the
///         Executor as `address(this)` and keeping all lifecycle state in one
///         compiler-managed storage struct.
library StreamGovernanceManifest {
    bytes32 private constant SYSTEM_MANIFEST_BOOTSTRAP_SCOPE_V1 =
        0xace275f08856e822491961304b01cdc9423d7d16c05518327353df5cd02e33f8;
    bytes32 private constant SYSTEM_MANIFEST_BOOTSTRAP_STATE_V1 =
        0x96decef116f307400b4d1826658d33976ec923ce136ead67b736b8becbe781ef;
    bytes32 private constant SYSTEM_MANIFEST_BOOTSTRAP_TRIGGER_V1 =
        0x9927dc0a368efe3d99880bb180d83938664a29ad399291c4544e4cab70c84548;
    bytes4 private constant MANIFEST_PUBLISH_SELECTOR = 0x09b1b5c6;
    bytes4 private constant MANIFEST_PUBLICATION_COUNT_SELECTOR = 0x5b1e1cba;
    bytes4 private constant REGISTER_ROLE_MANAGER_SELECTOR =
        IStreamRoleRegistry.registerRoleManager.selector;

    struct LifecycleState {
        bool bound;
        bool isSealed;
        IStreamRoleRegistry roleRegistry;
        bytes32 roleRegistryCodeHash;
        address governanceRoot;
        bytes32 governanceRootCodeHash;
        uint64 governanceRootRevision;
        address[] initialTerminalFreezeVetoGuardians;
        bytes32 initialGuardianSetHash;
        bytes32 initialTerminalRoleMutationChain;
        uint64 initialTerminalRoleMutationRevision;
        address core;
        bytes32 coreCodeHash;
        address systemManifestSatellite;
        bytes32 systemManifestSatelliteCodeHash;
        bytes32 bootstrapTriggerSetHash;
        bytes32 expectedTriggerSetHash;
        uint256 expectedTriggerCount;
        bytes32 expectedManifestHash;
        bytes32 expectedInventoryStateRoot;
        uint256 expectedInventoryLeafCount;
        address sealedPayloadPointer;
        bytes32[] pointerTypes;
        address[] registries;
        bytes32[] registryCodeHashes;
        mapping(bytes32 => uint64) controlPlaneActionRootRevisions;
    }

    struct BootstrapStateView {
        bool bound;
        bool isSealed;
        address roleRegistry;
        bytes32 roleRegistryCodeHash;
        address governanceRoot;
        bytes32 governanceRootCodeHash;
        uint64 governanceRootRevision;
        bytes32 initialGuardianSetHash;
        uint256 initialGuardianCount;
        bytes32 terminalFreezeVetoMutationChain;
        uint64 terminalFreezeVetoMutationRevision;
        address core;
        bytes32 coreCodeHash;
        address systemManifestSatellite;
        bytes32 systemManifestSatelliteCodeHash;
        bytes32 triggerSetHash;
        uint256 triggerCount;
        bytes32 expectedTriggerSetHash;
        uint256 expectedTriggerCount;
        bytes32 expectedManifestHash;
        bytes32 expectedInventoryStateRoot;
        uint256 expectedInventoryLeafCount;
        bytes32 inventoryStateRoot;
        uint256 inventoryLeafCount;
        address bootstrapAuthority;
        address sealedPayloadPointer;
    }

    struct BindContext {
        address genesisBootstrapAuthority;
        uint256 governanceNonce;
        uint256 pendingScheduledActionCount;
    }

    struct SealContext {
        bool executing;
        bytes32 actionId;
        uint8 actionClass;
        uint256 batchLength;
        uint256 callIndex;
        uint256 pendingScheduledActionCount;
        address actionProposer;
        address callDataPointer;
        bytes32 scopeHash;
        bytes32 oldValueHash;
        bytes32 newValueHash;
        address genesisBootstrapAuthority;
    }

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

    function bind(
        LifecycleState storage state,
        StreamGovernanceBootstrap.PolicyState storage policy,
        SystemManifestBootstrapBinding calldata binding,
        BindContext memory ctx
    ) public {
        if (msg.sender != ctx.genesisBootstrapAuthority) {
            revert IStreamGovernanceExecutor.GenesisBootstrapActorRequired(msg.sender);
        }
        if (state.bound) {
            revert IStreamGovernanceExecutor.SystemManifestBootstrapAlreadyBound();
        }
        if (
            state.isSealed || ctx.governanceNonce != 0 || ctx.pendingScheduledActionCount != 0
                || policy.tailEntries.length != 0
        ) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        _validateBootstrapBinding(binding, ctx.genesisBootstrapAuthority);

        state.roleRegistry = IStreamRoleRegistry(binding.roleRegistry);
        state.roleRegistryCodeHash = binding.roleRegistry.codehash;
        state.governanceRoot = binding.governanceRoot;
        state.governanceRootCodeHash = binding.governanceRootCodeHash;
        state.governanceRootRevision = 1;
        for (uint256 i = 0; i < binding.initialTerminalFreezeVetoGuardians.length; i++) {
            address guardian = binding.initialTerminalFreezeVetoGuardians[i];
            state.initialTerminalFreezeVetoGuardians.push(guardian);
            state.roleRegistry.grantRole(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, guardian);
        }
        if (!state.roleRegistry.isRoleRedundant(StreamRoles.ROLE_TERMINAL_FREEZE_VETO)) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        (state.initialTerminalRoleMutationChain, state.initialTerminalRoleMutationRevision) =
            state.roleRegistry.roleMutationState(StreamRoles.ROLE_TERMINAL_FREEZE_VETO);
        if (
            state.roleRegistry.roleHolderCount(StreamRoles.ROLE_TERMINAL_FREEZE_VETO)
                    != binding.initialTerminalFreezeVetoGuardians.length
                || state.initialTerminalRoleMutationRevision
                    != binding.initialTerminalFreezeVetoGuardians.length
        ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        state.initialGuardianSetHash = StreamGovernancePolicy.initialTerminalGuardianSetHash(
            binding.roleRegistry,
            binding.initialTerminalFreezeVetoGuardians,
            state.initialTerminalRoleMutationChain,
            state.initialTerminalRoleMutationRevision
        );
        state.core = binding.core;
        state.coreCodeHash = binding.core.codehash;
        state.systemManifestSatellite = binding.systemManifestSatellite;
        state.systemManifestSatelliteCodeHash = binding.systemManifestSatellite.codehash;
        state.expectedManifestHash = binding.expectedManifestHash;
        state.expectedInventoryStateRoot = binding.expectedInventoryStateRoot;
        state.expectedInventoryLeafCount = binding.expectedInventoryLeafCount;

        bytes32 triggerSetHash = bytes32(0);
        for (uint256 i = 0; i < binding.expectedTriggers.length; i++) {
            SystemManifestBootstrapTriggerExpectation calldata expected =
                binding.expectedTriggers[i];
            StreamGovernanceBootstrap.appendManifestTailTrigger(
                policy,
                expected.triggerTarget,
                expected.triggerSelector,
                expected.triggerCodeHash,
                expected.allowedActionClassMask,
                binding.systemManifestSatellite,
                state.systemManifestSatelliteCodeHash,
                false,
                bytes32(0),
                bytes32(0),
                bytes32(0)
            );
            triggerSetHash = keccak256(
                abi.encode(
                    SYSTEM_MANIFEST_BOOTSTRAP_TRIGGER_V1,
                    triggerSetHash,
                    expected.triggerTarget,
                    expected.triggerSelector,
                    expected.triggerCodeHash,
                    expected.allowedActionClassMask
                )
            );
        }
        state.bootstrapTriggerSetHash = triggerSetHash;
        state.expectedTriggerSetHash = triggerSetHash;
        state.expectedTriggerCount = binding.expectedTriggers.length;
        for (uint256 i = 0; i < binding.pointerTypes.length; i++) {
            state.pointerTypes.push(binding.pointerTypes[i]);
        }
        for (uint256 i = 0; i < binding.registries.length; i++) {
            state.registries.push(binding.registries[i]);
            state.registryCodeHashes.push(binding.registries[i].codehash);
        }
        // The Executor's nonReentrant bind wrapper protects the external grant
        // phase; keep `bound` false until that phase is complete so callbacks
        // cannot publish or schedule against partial lifecycle state.
        state.bound = true;
        requireBootstrapCodeHashes(state);
        computeInventoryState(state);

        emit SystemManifestBootstrapBound(
            1,
            state.core,
            state.systemManifestSatellite,
            state.coreCodeHash,
            state.systemManifestSatelliteCodeHash,
            state.expectedManifestHash,
            state.expectedInventoryStateRoot,
            triggerSetHash,
            state.expectedTriggerCount,
            ctx.genesisBootstrapAuthority,
            address(state.roleRegistry),
            state.roleRegistryCodeHash,
            state.governanceRoot,
            state.governanceRootCodeHash,
            state.initialGuardianSetHash,
            state.initialTerminalFreezeVetoGuardians.length,
            state.initialTerminalRoleMutationChain,
            state.initialTerminalRoleMutationRevision
        );
    }

    function prepareSeal(
        LifecycleState storage state,
        StreamGovernanceBootstrap.PolicyState storage policy,
        SealContext memory ctx
    ) public returns (address governanceRoot) {
        if (
            msg.sender != address(this) || !ctx.executing || ctx.actionId == bytes32(0)
                || ctx.actionClass != StreamGovernanceActionClasses.POINTER_REPLACEMENT
        ) {
            revert IStreamGovernanceExecutor.GovernanceSelfCallContextRequired();
        }
        if (!state.bound) revert IStreamGovernanceExecutor.SystemManifestBootstrapNotBound();
        if (state.isSealed) {
            revert IStreamGovernanceExecutor.SystemManifestBootstrapAlreadySealed();
        }
        if (ctx.batchLength != 2 || ctx.callIndex != 0 || ctx.pendingScheduledActionCount != 1) {
            revert IStreamGovernanceExecutor.BootstrapActionNotPermitted();
        }
        if (ctx.actionProposer != ctx.genesisBootstrapAuthority) {
            revert IStreamGovernanceExecutor.GenesisBootstrapActorRequired(ctx.actionProposer);
        }
        _verifyBootstrapTriggerSet(state, policy);
        requireBootstrapCodeHashes(state);
        _requireBootstrapRoleState(state);
        bytes32[] memory pointerTypes = state.pointerTypes;
        address[] memory registries = state.registries;
        (bytes32 currentRoot, uint256 currentCount) = StreamGovernanceEvidence.computeAndValidateSealInventory(
            state.core,
            pointerTypes,
            registries,
            state.systemManifestSatellite,
            state.expectedInventoryLeafCount
        );
        if (
            currentRoot != state.expectedInventoryStateRoot
                || currentCount != state.expectedInventoryLeafCount
        ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();

        bytes[] memory callDatas =
            StreamGovernanceBootstrap.readCanonicalCallDatas(ctx.callDataPointer);
        (address payloadPointer, StreamGovernanceEvidence.ManifestUpdate memory update) =
            StreamGovernanceEvidence.decodeManifestPublication(callDatas[1]);
        if (payloadPointer == address(0) || update.manifestHash != state.expectedManifestHash) {
            revert IStreamGovernanceExecutor.InvalidManifestTail();
        }
        StreamGovernanceEvidence.verifyManifestPayload(payloadPointer, update.manifestHash);
        if (_readManifestPublicationCount(state.systemManifestSatellite) != 0) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        bytes32 scopeHash = _bootstrapScopeHash();
        bytes32 oldStateHash = _bootstrapStateHash(
            state, ctx.genesisBootstrapAuthority, false, address(0), currentRoot, currentCount
        );
        bytes32 newStateHash = _bootstrapStateHash(
            state, ctx.genesisBootstrapAuthority, true, payloadPointer, currentRoot, currentCount
        );
        if (
            ctx.scopeHash != scopeHash || ctx.oldValueHash != oldStateHash
                || ctx.newValueHash != newStateHash
        ) revert IStreamGovernanceExecutor.GovernanceTransitionContextMismatch();
        state.isSealed = true;
        state.sealedPayloadPointer = payloadPointer;
        return state.governanceRoot;
    }

    function encodeBootstrapState(LifecycleState storage state, address genesisBootstrapAuthority)
        public
        view
        returns (bytes memory encoded)
    {
        bytes32 inventoryStateRoot;
        uint256 inventoryLeafCount;
        if (state.isSealed) {
            inventoryStateRoot = state.expectedInventoryStateRoot;
            inventoryLeafCount = state.expectedInventoryLeafCount;
        } else if (state.bound) {
            (inventoryStateRoot, inventoryLeafCount) = computeInventoryState(state);
        }
        BootstrapStateView memory stateView = _stateView(
            state,
            genesisBootstrapAuthority,
            state.isSealed,
            state.sealedPayloadPointer,
            inventoryStateRoot,
            inventoryLeafCount
        );
        encoded = new bytes(0x340);
        assembly ("memory-safe") {
            let source := stateView
            let destination := add(encoded, 0x20)
            for { let offset := 0 } lt(offset, 0x340) { offset := add(offset, 0x20) } {
                mstore(add(destination, offset), mload(add(source, offset)))
            }
        }
    }

    function appendManifestTailTrigger(
        StreamGovernanceBootstrap.PolicyState storage policy,
        LifecycleState storage state,
        address triggerTarget,
        bytes4 triggerSelector,
        bytes32 triggerCodeHash,
        uint8 allowedActionClassMask,
        bool governed,
        bytes32 currentScopeHash,
        bytes32 currentOldValueHash,
        bytes32 currentNewValueHash
    ) public {
        StreamGovernanceBootstrap.appendManifestTailTrigger(
            policy,
            triggerTarget,
            triggerSelector,
            triggerCodeHash,
            allowedActionClassMask,
            state.systemManifestSatellite,
            state.systemManifestSatelliteCodeHash,
            governed,
            currentScopeHash,
            currentOldValueHash,
            currentNewValueHash
        );
    }

    function validateManifestTailComposition(
        StreamGovernanceBootstrap.PolicyState storage policy,
        StreamGovernancePolicy.AdminState storage admin,
        LifecycleState storage state,
        bytes32 actionId,
        address proposer,
        uint8 actionClass,
        GovernanceCall[] memory calls,
        bool bootstrapScoped,
        bool scheduling,
        bool privilegedProposer,
        bytes4 sealSelector,
        bytes4 registerTailSelector
    ) public {
        bool controlPlaneAction = _validateControlPlaneAuthority(
            state, proposer, actionClass, calls, sealSelector
        );
        StreamGovernanceBootstrap.validateManifestTailComposition(
            policy,
            actionClass,
            calls,
            bootstrapScoped,
            state.core,
            state.coreCodeHash,
            state.systemManifestSatellite,
            state.systemManifestSatelliteCodeHash,
            sealSelector,
            registerTailSelector
        );
        if (scheduling) {
            _snapshotControlPlaneRootRevision(state, actionId, controlPlaneAction);
            StreamGovernancePolicy.snapshotActionProposerRevision(
                admin, actionId, proposer, privilegedProposer
            );
        } else {
            if (controlPlaneAction) _requireControlPlaneRootRevision(state, actionId);
            StreamGovernancePolicy.requireActionProposerRevision(admin, actionId, proposer);
        }
    }

    /// @dev Scans the complete batch before the manifest-tail validator can
    ///      take any bootstrap-specific early return. Executor control calls
    ///      are root-only after the one-way seal exception expires, and every
    ///      RoleRegistry calls are root-only. Ordinary role mutations and
    ///      manager enablement are delayed; the calldata-classified manager
    ///      disable path is the sole immediate tightening exception.
    function _validateControlPlaneAuthority(
        LifecycleState storage state,
        address proposer,
        uint8 actionClass,
        GovernanceCall[] memory calls,
        bytes4 bootstrapSealSelector
    ) private view returns (bool controlPlaneAction) {
        for (uint256 i = 0; i < calls.length; i++) {
            GovernanceCall memory call_ = calls[i];
            bool executorControl = call_.target == address(this)
                && (state.isSealed || call_.selector != bootstrapSealSelector);
            bool roleRegistryControl = call_.target == address(state.roleRegistry);
            if (!executorControl && !roleRegistryControl) continue;
            controlPlaneAction = true;
            if (roleRegistryControl) {
                bytes32 actualRoleRegistryCodeHash = call_.target.codehash;
                if (actualRoleRegistryCodeHash != state.roleRegistryCodeHash) {
                    revert IStreamGovernanceExecutor.RoleRegistryCodeHashMismatch(
                        state.roleRegistryCodeHash, actualRoleRegistryCodeHash
                    );
                }
            }
            if (proposer != state.governanceRoot) {
                revert IStreamGovernanceExecutor.GovernanceRootProposerRequired(
                    proposer, state.governanceRoot, call_.target, call_.selector
                );
            }
            bool immediateManagerDisable = roleRegistryControl
                && call_.selector == REGISTER_ROLE_MANAGER_SELECTOR
                && actionClass == StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING;
            if (
                roleRegistryControl && !immediateManagerDisable
                    && actionClass != StreamGovernanceActionClasses.DELAYED_LOOSENING
            ) {
                revert IStreamGovernanceExecutor.RoleRegistryDelayedActionRequired(actionClass);
            }
        }
    }

    function _snapshotControlPlaneRootRevision(
        LifecycleState storage state,
        bytes32 actionId,
        bool controlPlaneAction
    ) private {
        if (controlPlaneAction) {
            state.controlPlaneActionRootRevisions[actionId] = state.governanceRootRevision;
        }
    }

    function _requireControlPlaneRootRevision(LifecycleState storage state, bytes32 actionId)
        private
        view
    {
        uint64 expected = state.controlPlaneActionRootRevisions[actionId];
        uint64 actual = state.governanceRootRevision;
        if (expected == 0 || expected != actual) {
            revert IStreamGovernanceExecutor.GovernanceRootRevisionMismatch(
                actionId, expected, actual
            );
        }
    }

    function requireCancellationAuthority(
        LifecycleState storage state,
        StreamGovernancePolicy.AdminState storage admin,
        GovernanceAction storage action,
        address genesisBootstrapAuthority,
        bytes4 registerCancellerSelector
    ) public view {
        if (!state.isSealed) {
            if (msg.sender != genesisBootstrapAuthority && msg.sender != action.proposer) {
                revert IStreamGovernanceExecutor.GovernanceActorNotAuthorized(msg.sender);
            }
            return;
        }
        bool rootAuthorized = msg.sender == state.governanceRoot;
        if (rootAuthorized) requireGovernanceRootCodeHash(state);
        bool proposerAuthorized = msg.sender == action.proposer;
        bool registeredCanceller = admin.cancellers[msg.sender];
        bool cancellerRemoval = action.target == address(this)
            && action.selector == registerCancellerSelector
            && action.actionClass == StreamGovernanceActionClasses.DELAYED_LOOSENING;
        if (!rootAuthorized && !proposerAuthorized && (!registeredCanceller || cancellerRemoval)) {
            revert IStreamGovernanceExecutor.GovernanceActorNotAuthorized(msg.sender);
        }
    }

    function computeInventoryState(LifecycleState storage state)
        public
        view
        returns (bytes32 inventoryStateRoot, uint256 inventoryLeafCount)
    {
        bytes32[] memory pointerTypes = state.pointerTypes;
        address[] memory registries = state.registries;
        (inventoryStateRoot, inventoryLeafCount) =
            StreamGovernanceEvidence.computeInventoryState(state.core, pointerTypes, registries);
    }

    function requireBootstrapCodeHashes(LifecycleState storage state) public view {
        if (
            !state.bound || address(state.roleRegistry).codehash != state.roleRegistryCodeHash
                || state.core.codehash != state.coreCodeHash
                || state.systemManifestSatellite.codehash != state.systemManifestSatelliteCodeHash
                || state.governanceRoot.codehash != state.governanceRootCodeHash
        ) {
            if (state.bound && address(state.roleRegistry).codehash != state.roleRegistryCodeHash) {
                revert IStreamGovernanceExecutor.RoleRegistryCodeHashMismatch(
                    state.roleRegistryCodeHash, address(state.roleRegistry).codehash
                );
            }
            if (state.bound && state.governanceRoot.codehash != state.governanceRootCodeHash) {
                revert IStreamGovernanceExecutor.GovernanceRootCodeHashMismatch(
                    state.governanceRootCodeHash, state.governanceRoot.codehash
                );
            }
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        if (state.registries.length != state.registryCodeHashes.length) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        for (uint256 i = 0; i < state.registries.length; i++) {
            if (state.registries[i].codehash != state.registryCodeHashes[i]) {
                revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
            }
        }
    }

    function requireGovernanceRootCodeHash(LifecycleState storage state) public view {
        bytes32 actual = state.governanceRoot.codehash;
        if (
            !state.bound || state.governanceRoot == address(0)
                || actual != state.governanceRootCodeHash
        ) {
            revert IStreamGovernanceExecutor.GovernanceRootCodeHashMismatch(
                state.governanceRootCodeHash, actual
            );
        }
    }

    function validateGovernanceRootRotation(
        LifecycleState storage state,
        address genesisBootstrapAuthority,
        address newRoot,
        bytes32 expectedCodeHash
    ) public view returns (address oldRoot) {
        requireBoundRoleRegistry(state);
        oldRoot = state.governanceRoot;
        if (
            newRoot == address(0) || newRoot == address(this) || newRoot.code.length == 0
                || _isEip7702DelegatedEOA(newRoot) || newRoot == genesisBootstrapAuthority
                || newRoot == address(state.roleRegistry) || newRoot == state.core
                || newRoot == state.systemManifestSatellite
                || state.roleRegistry.hasAnyTerminalFreezeVetoRole(newRoot)
        ) {
            revert IStreamGovernanceExecutor.InvalidGovernanceRoot(newRoot);
        }
        if (newRoot == oldRoot) {
            revert IStreamGovernanceExecutor.GovernanceRootNoOp(newRoot);
        }
        requireGovernanceRootCodeHash(state);
        bytes32 actualCodeHash = newRoot.codehash;
        if (expectedCodeHash == bytes32(0) || actualCodeHash != expectedCodeHash) {
            revert IStreamGovernanceExecutor.GovernanceRootCodeHashMismatch(
                expectedCodeHash, actualCodeHash
            );
        }
    }

    function _readManifestPublicationCount(address satellite)
        private
        view
        returns (uint256 publicationCount)
    {
        bytes memory callData = abi.encodeWithSelector(MANIFEST_PUBLICATION_COUNT_SELECTOR);
        bool success;
        assembly ("memory-safe") {
            success := staticcall(
                gas(),
                satellite,
                add(callData, 0x20),
                mload(callData),
                0x00,
                0x00
            )
            if eq(returndatasize(), 0x20) {
                returndatacopy(0x00, 0x00, 0x20)
                publicationCount := mload(0x00)
            }
            if iszero(eq(returndatasize(), 0x20)) { success := 0 }
        }
        if (!success) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
    }

    function requireBoundRoleRegistry(LifecycleState storage state) public view {
        if (!state.bound) revert IStreamGovernanceExecutor.SystemManifestBootstrapNotBound();
        bytes32 actual = address(state.roleRegistry).codehash;
        if (actual != state.roleRegistryCodeHash) {
            revert IStreamGovernanceExecutor.RoleRegistryCodeHashMismatch(
                state.roleRegistryCodeHash, actual
            );
        }
    }

    /// @dev EIP-7702 designations are exactly `0xef0100 || delegate`.
    function _isEip7702DelegatedEOA(address account) private view returns (bool delegated) {
        if (account.code.length != 23) return false;
        bytes3 prefix;
        assembly ("memory-safe") {
            extcodecopy(account, 0, 0, 3)
            prefix := mload(0)
        }
        return prefix == 0xef0100;
    }

    function _validateBootstrapBinding(
        SystemManifestBootstrapBinding calldata binding,
        address genesisBootstrapAuthority
    ) private view {
        if (binding.governanceRoot == genesisBootstrapAuthority) {
            revert IStreamGovernanceExecutor.InvalidGovernanceRoot(binding.governanceRoot);
        }
        if (
            binding.roleRegistry == genesisBootstrapAuthority
                || binding.core == genesisBootstrapAuthority
                || binding.systemManifestSatellite == genesisBootstrapAuthority
        ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        for (uint256 i = 0; i < binding.initialTerminalFreezeVetoGuardians.length; i++) {
            if (binding.initialTerminalFreezeVetoGuardians[i] == genesisBootstrapAuthority) {
                revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
            }
        }
        StreamGovernanceEvidence.validateBootstrapBinding(binding);
    }

    function _requireBootstrapRoleState(LifecycleState storage state) private view {
        StreamGovernanceEvidence.requireRoleRegistryOwner(
            address(state.roleRegistry), address(this)
        );
        (bytes32 chainHash, uint64 revision) =
            state.roleRegistry.roleMutationState(StreamRoles.ROLE_TERMINAL_FREEZE_VETO);
        uint256 guardianCount = state.initialTerminalFreezeVetoGuardians.length;
        if (
            chainHash != state.initialTerminalRoleMutationChain
                || revision != state.initialTerminalRoleMutationRevision
                || state.roleRegistry.roleHolderCount(StreamRoles.ROLE_TERMINAL_FREEZE_VETO)
                    != guardianCount
                || !state.roleRegistry.isRoleRedundant(StreamRoles.ROLE_TERMINAL_FREEZE_VETO)
        ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        address[] memory guardians = state.initialTerminalFreezeVetoGuardians;
        for (uint256 i = 0; i < guardianCount; i++) {
            if (
                state.roleRegistry.roleHolderAt(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, i)
                    != guardians[i]
            ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        if (
            StreamGovernancePolicy.initialTerminalGuardianSetHash(
                    address(state.roleRegistry), guardians, chainHash, revision
                ) != state.initialGuardianSetHash
        ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
    }

    function _verifyBootstrapTriggerSet(
        LifecycleState storage state,
        StreamGovernanceBootstrap.PolicyState storage policy
    ) private view {
        StreamGovernanceBootstrap.verifyBootstrapTriggerSet(
                policy,
                state.bootstrapTriggerSetHash,
                state.expectedTriggerSetHash,
                state.expectedTriggerCount
            );
    }

    function _bootstrapScopeHash() private view returns (bytes32) {
        return keccak256(
            abi.encode(SYSTEM_MANIFEST_BOOTSTRAP_SCOPE_V1, uint256(block.chainid), address(this))
        );
    }

    function _bootstrapStateHash(
        LifecycleState storage state,
        address genesisBootstrapAuthority,
        bool isSealed,
        address sealedPayloadPointer,
        bytes32 currentInventoryRoot,
        uint256 currentInventoryCount
    ) private view returns (bytes32) {
        BootstrapStateView memory stateView = _stateView(
            state,
            genesisBootstrapAuthority,
            isSealed,
            sealedPayloadPointer,
            currentInventoryRoot,
            currentInventoryCount
        );
        return keccak256(
            bytes.concat(
                abi.encode(SYSTEM_MANIFEST_BOOTSTRAP_STATE_V1, _bootstrapScopeHash()),
                abi.encode(stateView)
            )
        );
    }

    function _stateView(
        LifecycleState storage state,
        address genesisBootstrapAuthority,
        bool isSealed,
        address sealedPayloadPointer,
        bytes32 currentInventoryRoot,
        uint256 currentInventoryCount
    ) private view returns (BootstrapStateView memory) {
        if (
            state.expectedTriggerCount > type(uint64).max
                || state.expectedInventoryLeafCount > type(uint64).max
                || currentInventoryCount > type(uint64).max
        ) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        return BootstrapStateView({
            bound: state.bound,
            isSealed: isSealed,
            roleRegistry: address(state.roleRegistry),
            roleRegistryCodeHash: state.roleRegistryCodeHash,
            governanceRoot: state.governanceRoot,
            governanceRootCodeHash: state.governanceRootCodeHash,
            governanceRootRevision: state.governanceRootRevision,
            initialGuardianSetHash: state.initialGuardianSetHash,
            initialGuardianCount: state.initialTerminalFreezeVetoGuardians.length,
            terminalFreezeVetoMutationChain: state.initialTerminalRoleMutationChain,
            terminalFreezeVetoMutationRevision: state.initialTerminalRoleMutationRevision,
            core: state.core,
            coreCodeHash: state.coreCodeHash,
            systemManifestSatellite: state.systemManifestSatellite,
            systemManifestSatelliteCodeHash: state.systemManifestSatelliteCodeHash,
            triggerSetHash: state.bootstrapTriggerSetHash,
            triggerCount: state.expectedTriggerCount,
            expectedTriggerSetHash: state.expectedTriggerSetHash,
            expectedTriggerCount: state.expectedTriggerCount,
            expectedManifestHash: state.expectedManifestHash,
            expectedInventoryStateRoot: state.expectedInventoryStateRoot,
            expectedInventoryLeafCount: state.expectedInventoryLeafCount,
            inventoryStateRoot: currentInventoryRoot,
            inventoryLeafCount: currentInventoryCount,
            bootstrapAuthority: genesisBootstrapAuthority,
            sealedPayloadPointer: sealedPayloadPointer
        });
    }
}
