// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IStreamGovernanceExecutor.sol";
import "./IStreamModuleRegistry.sol";
import "./IStreamRoleRegistry.sol";
import "./SSTORE2.sol";
import "./StreamRoles.sol";

/// @notice Linked, stateless validation library for the governance executor's
///         one-way manifest bootstrap. Public functions execute by DELEGATECALL,
///         so `address(this)` remains the executor for Core authority probes and
///         inventory-domain hashing while the large bounded readers stay out of
///         the executor's EIP-170 budget.
library StreamGovernanceBootstrap {
    bytes4 private constant MANIFEST_PUBLISH_SELECTOR = 0x09b1b5c6;
    bytes4 private constant MODULE_STATUS_SELECTOR = 0x96a6e18b;
    bytes4 private constant REGISTER_ROLE_MANAGER_SELECTOR =
        IStreamRoleRegistry.registerRoleManager.selector;
    uint256 private constant MODULE_STATUS_CALL_FIXED_BYTES = 164;
    uint256 private constant ROLE_MANAGER_CALL_BYTES = 68;
    uint256 private constant MODULE_RECORD_MIN_RETURN_BYTES = 448;
    uint256 private constant MODULE_RECORD_MAX_RETURN_BYTES = 2_496;
    uint256 private constant MAX_MODULE_MANIFEST_URI_BYTES = 2_048;
    uint256 private constant MAX_LIVE_TERMINAL_FREEZE_ACTIONS_PER_SCOPE = 64;
    uint256 private constant MAX_NON_ROOT_TERMINAL_FREEZE_ACTIONS_PER_SCOPE = 48;
    uint256 private constant MAX_TERMINAL_FREEZE_ACTIONS_PER_NON_ROOT_PROPOSER = 8;
    uint16 private constant SCHEMA_VERSION = 1;

    error InvalidSystemManifestBootstrap();
    error InvalidManifestTail();

    event GovernanceCallDataPublished(
        uint16 schemaVersion, bytes32 indexed callDataKey, address pointer, address publisher
    );
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

    uint8 private constant TERMINAL_MEMBERSHIP_APPEND = 1;
    uint8 private constant TERMINAL_MEMBERSHIP_ELAPSED_COMPACTION = 2;
    uint8 private constant TERMINAL_MEMBERSHIP_ACTION_TERMINAL_CLEANUP = 3;

    struct PolicyState {
        mapping(bytes32 => address) publishedCallData;
        mapping(address => mapping(bytes4 => bool)) tighteningCalls;
        mapping(address => mapping(bytes4 => bytes32)) tighteningCallCodeHashes;
        mapping(address => bool) approvedNativeReceivers;
        mapping(address => mapping(bytes4 => bool)) freezeSelectors;
        mapping(address => mapping(bytes4 => bytes32)) freezeSelectorCodeHashes;
        mapping(address => mapping(bytes4 => ManifestTailTriggerRule)) tailRules;
        ManifestTailTriggerEntry[] tailEntries;
        bytes32 tailChainHash;
        mapping(bytes32 => bytes32[]) terminalLiveActions;
        mapping(bytes32 => mapping(bytes32 => uint256)) terminalLiveIndex;
        mapping(bytes32 => bytes32[]) terminalActionScopes;
        mapping(bytes32 => uint64) terminalActionDeadline;
        mapping(bytes32 => address) terminalActionProposer;
        mapping(bytes32 => bool) terminalActionUsesRootCapacity;
        mapping(bytes32 => uint256) terminalNonRootLiveCount;
        mapping(bytes32 => mapping(address => uint256)) terminalProposerLiveCount;
    }

    struct ActionIdentity {
        uint8 actionClass;
        bytes32 callsHash;
        bytes32 scopeHash;
        bytes32 oldValueHash;
        bytes32 newValueHash;
        uint256 nonce;
        uint64 notBefore;
        uint64 expiresAfter;
        bytes32 reasonHash;
        bytes32 manifestHash;
    }

    struct ScheduleContext {
        uint8 actionClass;
        bytes32 scopeHash;
        bytes32 oldValueHash;
        bytes32 newValueHash;
        uint64 notBefore;
        uint64 expiresAfter;
        bytes32 reasonHash;
        string reasonURI;
        bytes32 manifestHash;
    }

    function governanceActionId(ActionIdentity memory identity) public view returns (bytes32) {
        return keccak256(
            bytes.concat(
                abi.encode(
                    bytes32(0x214cd728538bb3775a7106caff5c761bace11866a984d4a4d97a98f51971ac4b),
                    uint256(block.chainid),
                    address(this)
                ),
                abi.encode(identity)
            )
        );
    }

    function governanceActionIdFromStored(
        GovernanceAction storage action,
        bytes32 callsHash,
        uint256 nonceUsed
    ) public view returns (bytes32) {
        ActionIdentity memory identity = ActionIdentity({
            actionClass: action.actionClass,
            callsHash: callsHash,
            scopeHash: action.scopeHash,
            oldValueHash: action.oldValueHash,
            newValueHash: action.newValueHash,
            nonce: nonceUsed,
            notBefore: action.notBefore,
            expiresAfter: action.expiresAfter,
            reasonHash: action.reasonHash,
            manifestHash: action.manifestHash
        });
        return governanceActionId(identity);
    }

    function emitActionScheduled(
        bytes32 actionId,
        ScheduleContext memory ctx,
        address target,
        bytes4 selector,
        uint256 totalValue,
        bytes32 callsHash,
        uint256 nonceUsed
    ) public {
        bytes memory raw = bytes(ctx.reasonURI);
        bytes memory data = bytes.concat(
            abi.encode(
                uint256(1),
                totalValue,
                bytes32(selector),
                callsHash,
                ctx.scopeHash,
                ctx.oldValueHash,
                ctx.newValueHash
            ),
            abi.encode(
                uint256(ctx.notBefore),
                uint256(ctx.expiresAfter),
                nonceUsed,
                uint256(uint160(msg.sender)),
                ctx.reasonHash,
                uint256(0x1C0),
                ctx.manifestHash
            ),
            abi.encode(raw.length),
            raw,
            new bytes((32 - (raw.length % 32)) % 32)
        );
        bytes32 topic0 = 0x31024a726b55cea4cbdba5c85421828889c7015fdc195fafed46fed8020f760c;
        uint256 topic2 = uint256(ctx.actionClass);
        uint256 topic3 = uint256(uint160(target));
        assembly ("memory-safe") {
            log4(add(data, 0x20), mload(data), topic0, actionId, topic2, topic3)
        }
    }

    function readCanonicalCallDatas(address pointer)
        public
        view
        returns (bytes[] memory callDatas)
    {
        bytes memory payload = SSTORE2.read(pointer);
        callDatas = abi.decode(payload, (bytes[]));
        if (keccak256(payload) != keccak256(abi.encode(callDatas))) {
            revert IStreamGovernanceExecutor.NonCanonicalCallDataPublication();
        }
    }

    function publishCallData(PolicyState storage state, bytes[] memory callDatas)
        public
        returns (address pointer)
    {
        if (callDatas.length == 0) revert IStreamGovernanceExecutor.EmptyGovernanceBatch();
        bytes32[] memory hashes = new bytes32[](callDatas.length);
        for (uint256 i = 0; i < callDatas.length; i++) {
            hashes[i] = keccak256(callDatas[i]);
        }
        bytes32 callDataKey = keccak256(abi.encodePacked(hashes));
        pointer = state.publishedCallData[callDataKey];
        if (pointer != address(0)) return pointer;
        pointer = SSTORE2.write(abi.encode(callDatas));
        bytes[] memory decoded = readCanonicalCallDatas(pointer);
        if (decoded.length != callDatas.length) {
            revert IStreamGovernanceExecutor.NonCanonicalCallDataPublication();
        }
        state.publishedCallData[callDataKey] = pointer;
        emit GovernanceCallDataPublished(SCHEMA_VERSION, callDataKey, pointer, msg.sender);
    }

    function requirePublishedCallData(PolicyState storage state, GovernanceCall[] memory calls)
        public
        view
        returns (address pointer)
    {
        if (calls.length == 0) revert IStreamGovernanceExecutor.EmptyGovernanceBatch();
        bytes32[] memory hashes = new bytes32[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            hashes[i] = calls[i].callDataHash;
        }
        bytes32 callDataKey = keccak256(abi.encodePacked(hashes));
        pointer = state.publishedCallData[callDataKey];
        if (pointer == address(0)) {
            revert IStreamGovernanceExecutor.CallDataNotPublished(callDataKey);
        }
    }

    function deriveBatchTransitionHashes(GovernanceCall[] memory calls, bytes32 callsHash)
        public
        pure
        returns (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash)
    {
        bytes32[] memory scopes = new bytes32[](calls.length);
        bytes32[] memory oldValues = new bytes32[](calls.length);
        bytes32[] memory newValues = new bytes32[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            scopes[i] = calls[i].scopeHash;
            oldValues[i] = calls[i].oldValueHash;
            newValues[i] = calls[i].newValueHash;
        }
        scopeHash = keccak256(
            abi.encode(
                bytes32(0x6cfd5dfd67f064adac45602c05057edddda810734779c0ebe11b447e6985e31c),
                callsHash,
                scopes
            )
        );
        oldValueHash = keccak256(
            abi.encode(
                bytes32(0xc5029f937b44065c2ad92d9253e07f06117567480206189fcc1409d5509222b7),
                callsHash,
                oldValues
            )
        );
        newValueHash = keccak256(
            abi.encode(
                bytes32(0xce958009248d20d9574439fa374bc00c142940af2b496896b5bdbc00b882e98b),
                callsHash,
                newValues
            )
        );
    }

    function governanceCallsHash(GovernanceCall[] memory calls) public pure returns (bytes32) {
        return keccak256(
            abi.encode(
                bytes32(0x10f09566fb70f7947b61639c2a53b3aec872069a8b46edd08ba14eb2b5942b70), calls
            )
        );
    }

    function validateActionWindow(uint8 actionClass, uint64 notBefore, uint64 expiresAfter)
        public
        view
    {
        uint64 delayFloor = minimumDelay(actionClass);
        uint256 currentTimestamp = block.timestamp;
        if (currentTimestamp > uint256(type(uint64).max) - 365 days) {
            revert IStreamGovernanceExecutor.GovernanceTimestampOverflow(currentTimestamp);
        }
        // The explicit 365-day headroom proves this narrowing and every
        // subsequent launch-pinned delay/lifetime addition fit uint64.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 currentTimestamp64 = uint64(currentTimestamp);
        uint64 earliest = currentTimestamp64 + delayFloor;
        if (notBefore < earliest) {
            revert IStreamGovernanceExecutor.DelayBelowClassMinimum(
                actionClass, notBefore, earliest
            );
        }
        if (expiresAfter <= notBefore) {
            revert IStreamGovernanceExecutor.InvalidActionWindow(notBefore, expiresAfter);
        }
        uint64 openWindow = expiresAfter - notBefore;
        if (delayFloor > 0 && openWindow < 7 days) {
            revert IStreamGovernanceExecutor.OpenWindowBelowFloor(notBefore, expiresAfter);
        }
        // Governance action lifetimes are intentionally defined in wall-clock seconds.
        // forge-lint: disable-next-line(block-timestamp)
        if (expiresAfter > currentTimestamp64 + 365 days) {
            revert IStreamGovernanceExecutor.InvalidActionWindow(notBefore, expiresAfter);
        }
    }

    function minimumDelay(uint8 actionClass) public pure returns (uint64) {
        validateActionClass(actionClass);
        if (actionClass == 0) return 0;
        if (actionClass == 1 || actionClass == 3) return 48 hours;
        if (actionClass == 2) return 72 hours;
        if (actionClass == 4) return 14 days;
        return 30 days;
    }

    function validateActionClass(uint8 actionClass) public pure {
        if (actionClass > StreamGovernanceActionClasses.SUCCESSOR_DECLARATION) {
            revert IStreamGovernanceExecutor.UnknownActionClass(actionClass);
        }
    }

    function validateCalls(
        PolicyState storage state,
        address roleRegistry,
        address manifestTailTarget,
        uint8 actionClass,
        GovernanceCall[] memory calls,
        bytes[] memory callDatas,
        bytes4 sealSelector
    ) public view returns (uint256 totalValue) {
        totalValue = 0;
        if (calls.length == 0) revert IStreamGovernanceExecutor.EmptyGovernanceBatch();
        if (callDatas.length != calls.length) {
            revert IStreamGovernanceExecutor.CallDataCountMismatch(calls.length, callDatas.length);
        }
        bool immediate = actionClass == 0;
        bool terminalFreeze = actionClass == 2;
        for (uint256 i = 0; i < calls.length; i++) {
            GovernanceCall memory call_ = calls[i];
            bytes memory callData = callDatas[i];
            if (call_.target == address(0)) {
                revert IStreamGovernanceExecutor.ZeroGovernanceTarget(i);
            }
            if (keccak256(callData) != call_.callDataHash) {
                revert IStreamGovernanceExecutor.CallDataHashMismatch(i);
            }
            if (callData.length == 0) {
                if (immediate) {
                    revert IStreamGovernanceExecutor.NotClassifiedTightening(
                        call_.target, call_.selector
                    );
                }
                if (call_.selector != bytes4(0)) {
                    revert IStreamGovernanceExecutor.CallSelectorMismatch(i);
                }
                if (call_.value == 0 || !state.approvedNativeReceivers[call_.target]) {
                    revert IStreamGovernanceExecutor.NativeReceiverNotApproved(call_.target);
                }
            } else if (callData.length < 4) {
                revert IStreamGovernanceExecutor.CallDataTooShort(i);
            } else if (_leadingSelector(callData) != call_.selector) {
                revert IStreamGovernanceExecutor.CallSelectorMismatch(i);
            } else if (call_.target.code.length == 0) {
                revert IStreamGovernanceExecutor.TargetHasNoCode(i, call_.target);
            }
            if (
                call_.target == address(this) && call_.selector == sealSelector
                    && callData.length != 4
            ) revert InvalidManifestTail();
            bool moduleStatusClassified =
                _validateModuleStatusDirection(state, actionClass, call_, callData);
            bool roleManagerClassified =
                _validateRoleManagerDirection(roleRegistry, actionClass, call_, callData);
            bool executorConfigClassified =
                _validateExecutorConfigDirection(actionClass, call_, callData, calls.length, i);
            bool directionClassified =
                moduleStatusClassified || roleManagerClassified || executorConfigClassified;
            bool deferredManifestTail =
                call_.target == manifestTailTarget && call_.selector == MANIFEST_PUBLISH_SELECTOR;
            if (immediate) {
                if (
                    !directionClassified && !deferredManifestTail
                        && !state.tighteningCalls[call_.target][call_.selector]
                ) {
                    revert IStreamGovernanceExecutor.NotClassifiedTightening(
                        call_.target, call_.selector
                    );
                }
                if (!directionClassified && !deferredManifestTail) {
                    bytes32 expectedTighteningCodeHash =
                        state.tighteningCallCodeHashes[call_.target][call_.selector];
                    bytes32 actualTighteningCodeHash = call_.target.codehash;
                    if (
                        expectedTighteningCodeHash == bytes32(0)
                            || actualTighteningCodeHash != expectedTighteningCodeHash
                    ) {
                        revert IStreamGovernanceExecutor.GovernancePolicyCodeHashMismatch(
                            call_.target,
                            call_.selector,
                            expectedTighteningCodeHash,
                            actualTighteningCodeHash
                        );
                    }
                }
            }
            if (state.freezeSelectors[call_.target][call_.selector]) {
                bytes32 expectedFreezeCodeHash =
                    state.freezeSelectorCodeHashes[call_.target][call_.selector];
                bytes32 actualFreezeCodeHash = call_.target.codehash;
                if (
                    expectedFreezeCodeHash == bytes32(0)
                        || actualFreezeCodeHash != expectedFreezeCodeHash
                ) {
                    revert IStreamGovernanceExecutor.GovernancePolicyCodeHashMismatch(
                        call_.target, call_.selector, expectedFreezeCodeHash, actualFreezeCodeHash
                    );
                }
                if (!terminalFreeze) {
                    revert IStreamGovernanceExecutor.TerminalFreezeClassRequired(
                        call_.target, call_.selector
                    );
                }
            }
            totalValue += call_.value;
        }
    }

    function _validateRoleManagerDirection(
        address roleRegistry,
        uint8 actionClass,
        GovernanceCall memory call_,
        bytes memory callData
    ) private pure returns (bool classified) {
        if (call_.target != roleRegistry || call_.selector != REGISTER_ROLE_MANAGER_SELECTOR) return false;
        if (call_.value != 0 || callData.length != ROLE_MANAGER_CALL_BYTES) {
            revert IStreamGovernanceExecutor.InvalidRoleManagerConfigCall(call_.target);
        }
        uint256 accountWord;
        uint256 enabledWord;
        assembly ("memory-safe") {
            accountWord := mload(add(callData, 0x24))
            enabledWord := mload(add(callData, 0x44))
        }
        if (accountWord > type(uint160).max || enabledWord > 1) {
            revert IStreamGovernanceExecutor.InvalidRoleManagerConfigCall(call_.target);
        }
        // Canonical-word validation above proves both narrowings are lossless.
        // forge-lint: disable-next-line(unsafe-typecast)
        address account = address(uint160(accountWord));
        bool enabled = enabledWord == 1;
        uint8 expectedClass = enabled
            ? StreamGovernanceActionClasses.DELAYED_LOOSENING
            : StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING;
        if (actionClass != expectedClass) {
            revert IStreamGovernanceExecutor.RoleManagerConfigActionClassMismatch(
                call_.target, account, enabled, expectedClass, actionClass
            );
        }
        return true;
    }

    function _validateExecutorConfigDirection(
        uint8 actionClass,
        GovernanceCall memory call_,
        bytes memory callData,
        uint256 batchLength,
        uint256 callIndex
    ) private view returns (bool classified) {
        if (call_.target != address(this)) return false;

        bytes4 selector = call_.selector;
        if (selector == IStreamGovernanceExecutor.rotateGovernanceRoot.selector) {
            uint256 newRootWord;
            bytes32 expectedCodeHash;
            if (call_.value != 0 || callData.length != 68) {
                revert IStreamGovernanceExecutor.InvalidExecutorConfigCall(call_.target, selector);
            }
            assembly ("memory-safe") {
                newRootWord := mload(add(callData, 0x24))
                expectedCodeHash := mload(add(callData, 0x44))
            }
            if (
                newRootWord == 0 || newRootWord > type(uint160).max
                    || expectedCodeHash == bytes32(0)
            ) {
                revert IStreamGovernanceExecutor.InvalidExecutorConfigCall(call_.target, selector);
            }
            if (actionClass != StreamGovernanceActionClasses.POINTER_REPLACEMENT) {
                revert IStreamGovernanceExecutor.ExecutorControlActionClassMismatch(
                    call_.target,
                    selector,
                    StreamGovernanceActionClasses.POINTER_REPLACEMENT,
                    actionClass
                );
            }
            _requireIsolatedExecutorControl(batchLength, callIndex);
            return true;
        }

        bool enabledMeansLoosening;
        uint256 expectedLength;
        uint256 enabledWord;
        uint256 keyWord;
        if (
            selector == IStreamGovernanceExecutor.registerProposer.selector
                || selector == IStreamGovernanceExecutor.setApprovedNativeReceiver.selector
        ) {
            enabledMeansLoosening = true;
            expectedLength = 68;
        } else if (selector == IStreamGovernanceExecutor.registerCanceller.selector) {
            enabledMeansLoosening = false;
            expectedLength = 68;
        } else if (selector == IStreamGovernanceExecutor.setTighteningCall.selector) {
            enabledMeansLoosening = true;
            expectedLength = 100;
        } else if (selector == IStreamGovernanceExecutor.registerFreezeSelector.selector) {
            enabledMeansLoosening = false;
            expectedLength = 100;
        } else {
            return false;
        }

        if (call_.value != 0 || callData.length != expectedLength) {
            revert IStreamGovernanceExecutor.InvalidExecutorConfigCall(call_.target, selector);
        }
        assembly ("memory-safe") {
            keyWord := mload(add(callData, 0x24))
            enabledWord := mload(add(callData, expectedLength))
        }
        if (keyWord == 0 || keyWord > type(uint160).max || enabledWord > 1) {
            revert IStreamGovernanceExecutor.InvalidExecutorConfigCall(call_.target, selector);
        }
        if (expectedLength == 100) {
            uint256 selectorWord;
            assembly ("memory-safe") {
                selectorWord := mload(add(callData, 0x44))
            }
            if (selectorWord == 0 || selectorWord & type(uint224).max != 0) {
                revert IStreamGovernanceExecutor.InvalidExecutorConfigCall(call_.target, selector);
            }
            if (
                (selector == IStreamGovernanceExecutor.setTighteningCall.selector
                        || selector == IStreamGovernanceExecutor.registerFreezeSelector.selector)
                    && address(uint160(keyWord)) == address(this)
            ) {
                revert IStreamGovernanceExecutor.InvalidExecutorConfigCall(call_.target, selector);
            }
        }

        bool enabled = enabledWord == 1;
        bool loosening = enabled == enabledMeansLoosening;
        uint8 expectedClass = loosening
            ? StreamGovernanceActionClasses.DELAYED_LOOSENING
            : StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING;
        if (actionClass != expectedClass) {
            revert IStreamGovernanceExecutor.ExecutorConfigActionClassMismatch(
                call_.target, selector, enabled, expectedClass, actionClass
            );
        }
        _requireIsolatedExecutorControl(batchLength, callIndex);
        return true;
    }

    function _requireIsolatedExecutorControl(uint256 batchLength, uint256 callIndex) private pure {
        if (batchLength != 1 || callIndex != 0) {
            revert IStreamGovernanceExecutor.GovernanceSelfCallContextRequired();
        }
    }

    function _validateModuleStatusDirection(
        PolicyState storage state,
        uint8 actionClass,
        GovernanceCall memory call_,
        bytes memory callData
    ) private view returns (bool classified) {
        if (call_.selector != MODULE_STATUS_SELECTOR) return false;
        ManifestTailTriggerRule storage rule = state.tailRules[call_.target][call_.selector];
        if (rule.triggerCodeHash == bytes32(0)) return false;
        bytes32 liveCodeHash = call_.target.codehash;
        if (liveCodeHash != rule.triggerCodeHash) {
            revert IStreamGovernanceExecutor.GovernancePolicyCodeHashMismatch(
                call_.target, call_.selector, rule.triggerCodeHash, liveCodeHash
            );
        }
        (address module, uint8 requestedStatus) =
            _decodeCanonicalModuleStatusCall(call_.target, callData);
        StreamModuleRecord memory record = _readCanonicalModuleRecord(call_.target, module);
        // The registry enum is ABI-bounded to the four pinned status values.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint8 currentStatus = uint8(record.status);
        if (
            currentStatus == 0 || requestedStatus == 0 || currentStatus == requestedStatus
                || record.revision == 0 || bytes(record.moduleManifestURI).length == 0
                || bytes(record.moduleManifestURI).length > MAX_MODULE_MANIFEST_URI_BYTES
        ) {
            revert IStreamGovernanceExecutor.InvalidModuleRegistryStatusCall(call_.target);
        }
        uint8 expectedClass = _moduleStatusRank(requestedStatus) > _moduleStatusRank(currentStatus)
            ? StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING
            : StreamGovernanceActionClasses.DELAYED_LOOSENING;
        if (actionClass != expectedClass) {
            revert IStreamGovernanceExecutor.ModuleRegistryStatusActionClassMismatch(
                call_.target, module, currentStatus, requestedStatus, expectedClass, actionClass
            );
        }
        return true;
    }

    function _decodeCanonicalModuleStatusCall(address target, bytes memory callData)
        private
        pure
        returns (address module, uint8 requestedStatus)
    {
        if (callData.length < MODULE_STATUS_CALL_FIXED_BYTES) {
            revert IStreamGovernanceExecutor.InvalidModuleRegistryStatusCall(target);
        }
        uint256 moduleWord;
        uint256 requestedStatusWord;
        uint256 reasonURIOffset;
        uint256 reasonURILength;
        assembly ("memory-safe") {
            moduleWord := mload(add(callData, 0x24))
            requestedStatusWord := mload(add(callData, 0x44))
            reasonURIOffset := mload(add(callData, 0x84))
            reasonURILength := mload(add(callData, 0xa4))
        }
        if (
            moduleWord > type(uint160).max || requestedStatusWord > 3 || reasonURIOffset != 128
                || reasonURILength > callData.length - MODULE_STATUS_CALL_FIXED_BYTES
        ) {
            revert IStreamGovernanceExecutor.InvalidModuleRegistryStatusCall(target);
        }
        uint256 paddedReasonLength = (reasonURILength + 31) & ~uint256(31);
        if (callData.length != MODULE_STATUS_CALL_FIXED_BYTES + paddedReasonLength) {
            revert IStreamGovernanceExecutor.InvalidModuleRegistryStatusCall(target);
        }
        for (
            uint256 i = MODULE_STATUS_CALL_FIXED_BYTES + reasonURILength; i < callData.length; i++) {
            if (callData[i] != bytes1(0)) {
                revert IStreamGovernanceExecutor.InvalidModuleRegistryStatusCall(target);
            }
        }
        // The canonical-word bounds above prove both narrowings are lossless.
        // forge-lint: disable-next-line(unsafe-typecast)
        module = address(uint160(moduleWord));
        // forge-lint: disable-next-line(unsafe-typecast)
        requestedStatus = uint8(requestedStatusWord);
    }

    function _readCanonicalModuleRecord(address target, address module)
        private
        view
        returns (StreamModuleRecord memory record)
    {
        bytes memory payload =
            abi.encodeWithSelector(IStreamModuleRegistry.moduleRecord.selector, module);
        bool success;
        uint256 returnSize;
        assembly ("memory-safe") {
            success := staticcall(gas(), target, add(payload, 0x20), mload(payload), 0, 0)
            returnSize := returndatasize()
        }
        if (
            !success || returnSize < MODULE_RECORD_MIN_RETURN_BYTES
                || returnSize > MODULE_RECORD_MAX_RETURN_BYTES
        ) {
            revert IStreamGovernanceExecutor.InvalidModuleRegistryStatusCall(target);
        }
        bytes memory encoded = new bytes(returnSize);
        assembly ("memory-safe") {
            returndatacopy(add(encoded, 0x20), 0, returnSize)
        }
        _validateCanonicalModuleRecordEncoding(target, encoded);
        record = abi.decode(encoded, (StreamModuleRecord));
        if (keccak256(encoded) != keccak256(abi.encode(record))) {
            revert IStreamGovernanceExecutor.InvalidModuleRegistryStatusCall(target);
        }
    }

    function _validateCanonicalModuleRecordEncoding(address target, bytes memory encoded)
        private
        pure
    {
        uint256 outerOffset;
        uint256 statusWord;
        uint256 interfaceWord;
        uint256 gasLimitWord;
        uint256 uriOffset;
        uint256 registeredAtWord;
        uint256 statusUpdatedAtWord;
        uint256 revisionWord;
        uint256 uriLength;
        assembly ("memory-safe") {
            outerOffset := mload(add(encoded, 0x20))
            statusWord := mload(add(encoded, 0x40))
            interfaceWord := mload(add(encoded, 0xa0))
            gasLimitWord := mload(add(encoded, 0xc0))
            uriOffset := mload(add(encoded, 0x140))
            registeredAtWord := mload(add(encoded, 0x160))
            statusUpdatedAtWord := mload(add(encoded, 0x180))
            revisionWord := mload(add(encoded, 0x1a0))
            uriLength := mload(add(encoded, 0x1c0))
        }
        if (
            outerOffset != 32 || statusWord > 3 || uriOffset != 384
                || (interfaceWord & type(uint224).max) != 0 || gasLimitWord > type(uint32).max
                || registeredAtWord > type(uint64).max || statusUpdatedAtWord > type(uint64).max
                || revisionWord > type(uint64).max || uriLength > MAX_MODULE_MANIFEST_URI_BYTES
        ) {
            revert IStreamGovernanceExecutor.InvalidModuleRegistryStatusCall(target);
        }
        uint256 paddedURILength = (uriLength + 31) & ~uint256(31);
        if (encoded.length != MODULE_RECORD_MIN_RETURN_BYTES + paddedURILength) {
            revert IStreamGovernanceExecutor.InvalidModuleRegistryStatusCall(target);
        }
        for (uint256 i = MODULE_RECORD_MIN_RETURN_BYTES + uriLength; i < encoded.length; i++) {
            if (encoded[i] != bytes1(0)) {
                revert IStreamGovernanceExecutor.InvalidModuleRegistryStatusCall(target);
            }
        }
    }

    function _moduleStatusRank(uint8 status) private pure returns (uint8) {
        if (status == uint8(ModuleRegistryStatus.ACTIVE)) return 0;
        if (status == uint8(ModuleRegistryStatus.DEPRECATED)) return 1;
        return 2;
    }

    function validateTerminalFreezeGuardians(
        IStreamRoleRegistry registry,
        GovernanceCall[] memory calls
    ) public view {
        if (!registry.isRoleRedundant(StreamRoles.ROLE_TERMINAL_FREEZE_VETO)) {
            bytes32 scopeHash = calls.length == 0 ? bytes32(0) : calls[0].scopeHash;
            revert IStreamGovernanceExecutor.NoTerminalFreezeVetoGuardianConfigured(scopeHash);
        }
    }

    function appendTerminalFreeze(
        PolicyState storage state,
        bytes32 actionId,
        uint64 vetoDeadline,
        GovernanceCall[] memory calls,
        address proposer,
        bool usesRootCapacity
    ) public {
        state.terminalActionDeadline[actionId] = vetoDeadline;
        state.terminalActionProposer[actionId] = proposer;
        state.terminalActionUsesRootCapacity[actionId] = usesRootCapacity;
        for (uint256 i = 0; i < calls.length; i++) {
            bytes32 scopeHash = calls[i].scopeHash;
            if (_scopeSeenBefore(calls, i, scopeHash)) continue;
            state.terminalActionScopes[actionId].push(scopeHash);
            bytes32[] storage live = state.terminalLiveActions[scopeHash];
            pruneElapsedTerminalFreezeActions(state, scopeHash);
            if (live.length >= MAX_LIVE_TERMINAL_FREEZE_ACTIONS_PER_SCOPE) {
                revert IStreamGovernanceExecutor.TerminalFreezeLiveActionCapExceeded(
                    scopeHash, MAX_LIVE_TERMINAL_FREEZE_ACTIONS_PER_SCOPE
                );
            }
            if (!usesRootCapacity) {
                if (
                    state.terminalNonRootLiveCount[scopeHash]
                        >= MAX_NON_ROOT_TERMINAL_FREEZE_ACTIONS_PER_SCOPE
                ) {
                    revert IStreamGovernanceExecutor.TerminalFreezeNonRootLiveActionCapExceeded(
                        scopeHash, MAX_NON_ROOT_TERMINAL_FREEZE_ACTIONS_PER_SCOPE
                    );
                }
                if (
                    state.terminalProposerLiveCount[scopeHash][proposer]
                        >= MAX_TERMINAL_FREEZE_ACTIONS_PER_NON_ROOT_PROPOSER
                ) {
                    revert IStreamGovernanceExecutor.TerminalFreezeProposerLiveActionCapExceeded(
                        scopeHash, proposer, MAX_TERMINAL_FREEZE_ACTIONS_PER_NON_ROOT_PROPOSER
                    );
                }
            }
            live.push(actionId);
            state.terminalLiveIndex[scopeHash][actionId] = live.length;
            if (!usesRootCapacity) {
                state.terminalNonRootLiveCount[scopeHash] += 1;
                state.terminalProposerLiveCount[scopeHash][proposer] += 1;
            }
            emit TerminalFreezeActionMembershipUpdated(
                SCHEMA_VERSION,
                scopeHash,
                actionId,
                proposer,
                true,
                TERMINAL_MEMBERSHIP_APPEND,
                usesRootCapacity,
                vetoDeadline,
                live.length - 1,
                live.length
            );
        }
    }

    function isTerminalFreezeVetoGuardian(
        PolicyState storage state,
        IStreamRoleRegistry registry,
        bytes32 actionId,
        address actor
    ) public view returns (bool) {
        if (registry.hasRole(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, actor)) return true;
        bytes32[] storage scopes = state.terminalActionScopes[actionId];
        for (uint256 i = 0; i < scopes.length; i++) {
            bytes32 scopedRole =
                keccak256(abi.encode(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scopes[i]));
            if (registry.hasRole(scopedRole, actor)) return true;
        }
        return false;
    }

    function pruneTerminalFreeze(PolicyState storage state, bytes32 actionId) public {
        bytes32[] storage scopes = state.terminalActionScopes[actionId];
        for (uint256 i = 0; i < scopes.length; i++) {
            bytes32 scopeHash = scopes[i];
            uint256 indexPlusOne = state.terminalLiveIndex[scopeHash][actionId];
            if (indexPlusOne == 0) continue;
            _removeTerminalFreezeMembership(
                state,
                scopeHash,
                actionId,
                indexPlusOne,
                TERMINAL_MEMBERSHIP_ACTION_TERMINAL_CLEANUP
            );
        }
        delete state.terminalActionScopes[actionId];
        delete state.terminalActionDeadline[actionId];
        delete state.terminalActionProposer[actionId];
        delete state.terminalActionUsesRootCapacity[actionId];
    }

    function pruneElapsedTerminalFreezeActions(PolicyState storage state, bytes32 scopeHash)
        public
        returns (uint256 prunedCount)
    {
        prunedCount = _pruneElapsedTerminalFreezeActions(state, scopeHash);
    }

    function terminalFreezeActionPage(
        PolicyState storage state,
        bytes32 scopeHash,
        uint256 cursor,
        uint256 limit
    )
        public
        view
        returns (bytes32[] memory actionIds, uint64[] memory vetoDeadlines, uint256 nextCursor)
    {
        if (limit > MAX_LIVE_TERMINAL_FREEZE_ACTIONS_PER_SCOPE) {
            revert IStreamGovernanceExecutor.TerminalFreezePageLimitExceeded(
                limit, MAX_LIVE_TERMINAL_FREEZE_ACTIONS_PER_SCOPE
            );
        }
        bytes32[] storage live = state.terminalLiveActions[scopeHash];
        uint256 membershipCount = live.length;
        if (cursor > membershipCount) {
            revert IStreamGovernanceExecutor.TerminalFreezePageCursorOutOfBounds(
                scopeHash, cursor, membershipCount
            );
        }
        uint256 pageLength = membershipCount - cursor;
        if (pageLength > limit) pageLength = limit;
        actionIds = new bytes32[](pageLength);
        vetoDeadlines = new uint64[](pageLength);
        for (uint256 i = 0; i < pageLength; i++) {
            bytes32 actionId = live[cursor + i];
            actionIds[i] = actionId;
            vetoDeadlines[i] = state.terminalActionDeadline[actionId];
        }
        nextCursor = cursor + pageLength;
    }

    function earliestTerminalFreezeDeadline(PolicyState storage state, bytes32 scopeHash)
        public
        view
        returns (uint64 deadline)
    {
        bytes32[] storage live = state.terminalLiveActions[scopeHash];
        for (uint256 i = 0; i < live.length; i++) {
            uint64 notBefore = state.terminalActionDeadline[live[i]];
            // The veto surface intentionally reports only still-open timestamp deadlines.
            // forge-lint: disable-next-line(block-timestamp)
            if (block.timestamp < notBefore && (deadline == 0 || notBefore < deadline)) {
                deadline = notBefore;
            }
        }
    }

    function liveTerminalFreezeActionCount(PolicyState storage state, bytes32 scopeHash)
        public
        view
        returns (uint256 count)
    {
        bytes32[] storage live = state.terminalLiveActions[scopeHash];
        // The veto surface intentionally reports only still-open timestamp deadlines.
        // forge-lint: disable-next-line(block-timestamp)
        uint256 currentTimestamp = block.timestamp;
        for (uint256 i = 0; i < live.length; i++) {
            if (currentTimestamp < state.terminalActionDeadline[live[i]]) {
                count++;
            }
        }
    }

    function liveTerminalFreezeActionAt(PolicyState storage state, bytes32 scopeHash, uint256 index)
        public
        view
        returns (bytes32 actionId, uint64 vetoDeadline)
    {
        bytes32[] storage live = state.terminalLiveActions[scopeHash];
        // Preserve the backing set's deterministic order while densely skipping
        // actions whose veto deadline has elapsed. No view call mutates the O(1)
        // swap-and-pop index used by terminal transitions.
        // forge-lint: disable-next-line(block-timestamp)
        uint256 currentTimestamp = block.timestamp;
        uint256 liveIndex = 0;
        for (uint256 i = 0; i < live.length; i++) {
            bytes32 candidate = live[i];
            uint64 candidateDeadline = state.terminalActionDeadline[candidate];
            if (currentTimestamp >= candidateDeadline) continue;
            if (liveIndex == index) return (candidate, candidateDeadline);
            liveIndex++;
        }
        revert IStreamGovernanceExecutor.LiveTerminalFreezeIndexOutOfBounds(scopeHash, index);
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

    function _pruneElapsedTerminalFreezeActions(PolicyState storage state, bytes32 scopeHash)
        private
        returns (uint256 prunedCount)
    {
        bytes32[] storage live = state.terminalLiveActions[scopeHash];
        // The set is capped at 64, making this full compaction bounded. Inspect
        // the swap-in element at the same index after every removal.
        uint256 i = 0;
        while (i < live.length) {
            bytes32 actionId = live[i];
            // The veto window is closed at the exact deadline.
            // forge-lint: disable-next-line(block-timestamp)
            if (block.timestamp < state.terminalActionDeadline[actionId]) {
                i++;
                continue;
            }
            _removeTerminalFreezeMembership(
                state, scopeHash, actionId, i + 1, TERMINAL_MEMBERSHIP_ELAPSED_COMPACTION
            );
            prunedCount++;
        }
    }

    function _removeTerminalFreezeMembership(
        PolicyState storage state,
        bytes32 scopeHash,
        bytes32 actionId,
        uint256 indexPlusOne,
        uint8 mutationCause
    ) private {
        bytes32[] storage live = state.terminalLiveActions[scopeHash];
        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = live.length - 1;
        address proposer = state.terminalActionProposer[actionId];
        bool usesRootCapacity = state.terminalActionUsesRootCapacity[actionId];
        uint64 vetoDeadline = state.terminalActionDeadline[actionId];
        if (index != lastIndex) {
            bytes32 moved = live[lastIndex];
            live[index] = moved;
            state.terminalLiveIndex[scopeHash][moved] = indexPlusOne;
        }
        live.pop();
        delete state.terminalLiveIndex[scopeHash][actionId];
        if (!usesRootCapacity) {
            state.terminalNonRootLiveCount[scopeHash] -= 1;
            state.terminalProposerLiveCount[scopeHash][proposer] -= 1;
        }
        emit TerminalFreezeActionMembershipUpdated(
            SCHEMA_VERSION,
            scopeHash,
            actionId,
            proposer,
            false,
            mutationCause,
            usesRootCapacity,
            vetoDeadline,
            index,
            live.length
        );
    }

    function appendManifestTailTrigger(
        PolicyState storage state,
        address triggerTarget,
        bytes4 triggerSelector,
        bytes32 triggerCodeHash,
        uint8 allowedActionClassMask,
        address tailTarget,
        bytes32 tailCodeHash,
        bool governed,
        bytes32 currentScopeHash,
        bytes32 currentOldValueHash,
        bytes32 currentNewValueHash
    ) public {
        if (
            triggerTarget == address(this) || _isEip7702DelegatedEOA(triggerTarget)
                || (state.freezeSelectors[triggerTarget][triggerSelector]
                    && (allowedActionClassMask & 0x04) == 0)
        ) {
            revert IStreamGovernanceExecutor.InvalidManifestTailTrigger(
                triggerTarget, triggerSelector
            );
        }
        uint256 index = state.tailEntries.length;
        if (index >= type(uint64).max) {
            revert IStreamGovernanceExecutor.InvalidManifestTailTrigger(
                triggerTarget, triggerSelector
            );
        }
        // The strict bound makes both `index` and `index + 1` fit uint64.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 index64 = uint64(index);
        bytes32 scopeHash = keccak256(
            abi.encode(
                bytes32(0x2c9b0dbea692b77bd1679258ca569c13c24eb261671f5a6b78b9fa59cd29c7f1),
                uint256(block.chainid),
                address(this),
                triggerTarget,
                triggerSelector
            )
        );
        bytes32 oldStateHash = keccak256(
            abi.encode(
                bytes32(0xd41313fe7ee9b51221beebf9c314d67aebec3677907eb1365fff4caa4248f493),
                scopeHash,
                false,
                bytes32(0),
                uint8(0),
                index64,
                state.tailChainHash,
                tailTarget,
                MANIFEST_PUBLISH_SELECTOR,
                tailCodeHash
            )
        );
        bytes32 recordHash = keccak256(
            abi.encode(
                bytes32(0xe52b2b6e65acb1eae2c217c4b26e893c7d0e7f32afc148867b79c133b3a134fa),
                index64,
                triggerTarget,
                triggerSelector,
                triggerCodeHash,
                allowedActionClassMask
            )
        );
        bytes32 nextChainHash = keccak256(
            abi.encode(
                bytes32(0xdf8c3b0d7ebdd491123b988924db55f8fd11251d7e88e5d76722331928dd4951),
                uint256(block.chainid),
                address(this),
                state.tailChainHash,
                recordHash,
                index64
            )
        );
        if (governed) {
            bytes32 newStateHash = keccak256(
                abi.encode(
                    bytes32(0xd41313fe7ee9b51221beebf9c314d67aebec3677907eb1365fff4caa4248f493),
                    scopeHash,
                    true,
                    triggerCodeHash,
                    allowedActionClassMask,
                    index64 + 1,
                    nextChainHash,
                    tailTarget,
                    MANIFEST_PUBLISH_SELECTOR,
                    tailCodeHash
                )
            );
            if (
                currentScopeHash != scopeHash || currentOldValueHash != oldStateHash
                    || currentNewValueHash != newStateHash
            ) revert IStreamGovernanceExecutor.GovernanceTransitionContextMismatch();
        }
        state.tailRules[triggerTarget][triggerSelector] = ManifestTailTriggerRule({
            triggerCodeHash: triggerCodeHash, allowedActionClassMask: allowedActionClassMask
        });
        state.tailEntries
            .push(
                ManifestTailTriggerEntry({
                    triggerTarget: triggerTarget, triggerSelector: triggerSelector
                })
            );
        state.tailChainHash = nextChainHash;
    }

    function verifyBootstrapTriggerSet(
        PolicyState storage state,
        bytes32 actualTriggerSetHash,
        bytes32 expectedTriggerSetHash,
        uint256 expectedTriggerCount
    ) public view {
        if (state.tailEntries.length != expectedTriggerCount) {
            revert InvalidSystemManifestBootstrap();
        }
        bytes32 triggerSetHash = bytes32(0);
        for (uint256 i = 0; i < state.tailEntries.length; i++) {
            ManifestTailTriggerEntry storage entry = state.tailEntries[i];
            ManifestTailTriggerRule storage rule =
                state.tailRules[entry.triggerTarget][entry.triggerSelector];
            if (
                rule.triggerCodeHash == bytes32(0) || rule.allowedActionClassMask == 0
                    || entry.triggerTarget.codehash != rule.triggerCodeHash
            ) revert InvalidSystemManifestBootstrap();
            triggerSetHash = keccak256(
                abi.encode(
                    bytes32(0x9927dc0a368efe3d99880bb180d83938664a29ad399291c4544e4cab70c84548),
                    triggerSetHash,
                    entry.triggerTarget,
                    entry.triggerSelector,
                    rule.triggerCodeHash,
                    rule.allowedActionClassMask
                )
            );
        }
        if (triggerSetHash != actualTriggerSetHash || triggerSetHash != expectedTriggerSetHash) {
            revert InvalidSystemManifestBootstrap();
        }
    }

    function validateManifestTailComposition(
        PolicyState storage state,
        uint8 actionClass,
        GovernanceCall[] memory calls,
        bool bootstrapScoped,
        address core,
        bytes32 coreCodeHash,
        address tailTarget,
        bytes32 tailCodeHash,
        bytes4 sealSelector,
        bytes4 registerTailSelector
    ) public view {
        bool hasTrigger = false;
        uint256 triggerCount = 0;
        uint256 tailCount = 0;
        bool sealBatch = calls.length == 2 && calls[0].target == address(this)
            && calls[0].selector == sealSelector && calls[0].value == 0
            && calls[1].target == tailTarget && calls[1].selector == MANIFEST_PUBLISH_SELECTOR
            && calls[1].value == 0 && actionClass == 3;

        for (uint256 i = 0; i < calls.length; i++) {
            GovernanceCall memory call_ = calls[i];
            if (
                call_.target == address(this) && call_.selector == registerTailSelector
                    && (calls.length != 1 || actionClass != 2)
            ) revert IStreamGovernanceExecutor.ManifestTailTriggerRegistrationNotIsolated();
            if (call_.target == tailTarget && call_.selector == MANIFEST_PUBLISH_SELECTOR) {
                tailCount += 1;
                if (
                    call_.value != 0 || i + 1 != calls.length || tailTarget.codehash != tailCodeHash
                ) revert InvalidManifestTail();
                continue;
            }
            ManifestTailTriggerRule storage rule = state.tailRules[call_.target][call_.selector];
            if (rule.triggerCodeHash != bytes32(0)) {
                hasTrigger = true;
                triggerCount += 1;
                bytes32 liveCodeHash = call_.target.codehash;
                if (liveCodeHash != rule.triggerCodeHash) {
                    revert IStreamGovernanceExecutor.ManifestTailCodeHashMismatch(
                        rule.triggerCodeHash, liveCodeHash
                    );
                }
                // Class N intentionally maps to bit N, so one is the left operand.
                // forge-lint: disable-next-line(incorrect-shift)
                uint256 actionClassBit = uint256(1) << actionClass;
                if (actionClass > 3 || (uint256(rule.allowedActionClassMask) & actionClassBit) == 0)
                {
                    revert IStreamGovernanceExecutor.ManifestTailActionClassNotAllowed(
                        call_.target, call_.selector, actionClass
                    );
                }
            }
        }
        if (tailCount > 1) revert InvalidManifestTail();
        if (bootstrapScoped) {
            if (
                core == address(0) || core.codehash != coreCodeHash
                    || tailTarget.codehash != tailCodeHash
            ) revert InvalidSystemManifestBootstrap();
            if (sealBatch) {
                if (tailCount != 1) revert InvalidManifestTail();
                return;
            }
            if (
                tailCount != 0 || !hasTrigger || triggerCount != calls.length
                    || _hasNonzeroValue(calls)
            ) {
                revert IStreamGovernanceExecutor.BootstrapActionNotPermitted();
            }
            return;
        }
        if (hasTrigger && tailCount != 1) {
            revert IStreamGovernanceExecutor.ManifestTailRequired();
        }
        if (!hasTrigger && tailCount == 1 && (actionClass != 3 || calls.length != 1)) {
            revert InvalidManifestTail();
        }
    }

    function _hasNonzeroValue(GovernanceCall[] memory calls) private pure returns (bool) {
        for (uint256 i = 0; i < calls.length; i++) {
            if (calls[i].value != 0) return true;
        }
        return false;
    }

    function _leadingSelector(bytes memory data) private pure returns (bytes4 selector) {
        if (data.length < 4) return bytes4(0);
        assembly ("memory-safe") {
            selector := mload(add(data, 0x20))
        }
    }

    function bytesEqual(bytes memory left, bytes memory right) public pure returns (bool) {
        if (left.length != right.length) return false;
        for (uint256 i = 0; i < left.length; i++) {
            if (left[i] != right[i]) return false;
        }
        return true;
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
}
