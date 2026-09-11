// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IStreamGovernanceExecutor.sol";
import "../smart-contracts/IStreamRoleRegistry.sol";
import "../smart-contracts/StreamGovernanceEvidence.sol";
import "../smart-contracts/StreamGovernanceExecutor.sol";
import "../smart-contracts/StreamRoleRegistry.sol";
import "../smart-contracts/StreamRoles.sol";
import "./helpers/Assertions.sol";
import "./helpers/StreamGovernanceBootstrapHarness.sol";

contract GovernedTargetMock {
    uint256 public value;
    uint256 public lastPaidValue;
    address public lastSender;
    bool public shouldRevert;

    function setShouldRevert(bool shouldRevert_) external {
        shouldRevert = shouldRevert_;
    }

    function setValue(uint256 newValue) external payable {
        if (shouldRevert) {
            revert("target revert");
        }
        value = newValue;
        lastPaidValue = msg.value;
        lastSender = msg.sender;
    }
}

contract GovernedContextProbeMock {
    IStreamGovernanceExecutor public immutable executor;
    bool public sawExecuting;
    bytes32 public sawActionId;
    uint8 public sawActionClass;
    bytes32 public sawScopeHash;
    bytes32 public sawOldValueHash;
    bytes32 public sawNewValueHash;

    constructor(IStreamGovernanceExecutor executor_) {
        executor = executor_;
    }

    function probe() external {
        (
            sawExecuting,
            sawActionId,
            sawActionClass,
            sawScopeHash,
            sawOldValueHash,
            sawNewValueHash
        ) = executor.currentAction();
    }
}

contract GovernedRefundingMock {
    function refund() external payable {
        selfdestruct(payable(msg.sender));
    }
}

contract GovernedReturndataMock {
    bool public called;

    function succeedWithReturndata(uint256 returnDataBytes) external {
        called = true;
        assembly ("memory-safe") {
            return(0x00, returnDataBytes)
        }
    }

    function revertWithReturndata(uint256 returnDataBytes) external pure {
        assembly ("memory-safe") {
            revert(0x00, returnDataBytes)
        }
    }
}

contract GovernedReentrantTargetMock {
    IStreamGovernanceExecutor public immutable executor;
    bytes private nestedExecution;
    bool public armed;
    bool public reached;

    constructor(IStreamGovernanceExecutor executor_) {
        executor = executor_;
    }

    function arm(bytes calldata nestedExecution_) external {
        nestedExecution = nestedExecution_;
        armed = true;
    }

    function disarm() external {
        armed = false;
    }

    function attack() external {
        reached = true;
        if (!armed) return;
        (bool success, bytes memory returnData) = address(executor).call(nestedExecution);
        if (success) revert("nested execution unexpectedly succeeded");
        assembly ("memory-safe") {
            revert(add(returnData, 0x20), mload(returnData))
        }
    }
}

contract StreamGovernanceExecutorTest is StreamGovernanceBootstrapHarness {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for string;
    using Assertions for uint256;

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

    event GovernanceActionExpired(
        uint16 schemaVersion,
        bytes32 indexed actionId,
        uint8 indexed actionClass,
        address materializer
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

    bytes32 private constant SCOPE = keccak256("test-scope");
    bytes32 private constant OLD_VALUE = keccak256("old-value");
    bytes32 private constant NEW_VALUE = keccak256("new-value");
    bytes32 private constant REASON = keccak256("reason");
    bytes32 private constant MANIFEST = keccak256("manifest");
    bytes32 private constant GOVERNANCE_ACTION_SCHEDULED_TOPIC = keccak256(
        "GovernanceActionScheduled(uint16,bytes32,uint8,address,uint256,bytes4,bytes32,bytes32,bytes32,bytes32,uint64,uint64,uint256,address,bytes32,string,bytes32)"
    );
    bytes32 private constant GOVERNANCE_CALL_DATA_PUBLISHED_TOPIC =
        keccak256("GovernanceCallDataPublished(uint16,bytes32,address,address)");
    bytes32 private constant GOVERNANCE_ROOT_ROTATED_TOPIC =
        keccak256("GovernanceRootRotated(uint16,address,address,bytes32,uint64,bytes32)");
    bytes32 private constant GOVERNANCE_PROPOSER_UPDATED_TOPIC =
        keccak256("GovernanceProposerUpdated(uint16,address,bool,uint64,bytes32)");
    bytes32 private constant GOVERNANCE_CANCELLER_UPDATED_TOPIC =
        keccak256("GovernanceCancellerUpdated(uint16,address,bool,uint64,bytes32)");
    bytes32 private constant TIGHTENING_CALL_UPDATED_TOPIC =
        keccak256("TighteningCallUpdated(uint16,address,bytes4,bool,bytes32,uint64,bytes32)");
    bytes32 private constant APPROVED_NATIVE_RECEIVER_UPDATED_TOPIC =
        keccak256("ApprovedNativeReceiverUpdated(uint16,address,bool,uint64,bytes32)");
    bytes32 private constant FREEZE_SELECTOR_UPDATED_TOPIC =
        keccak256("FreezeSelectorUpdated(uint16,address,bytes4,bool,bytes32,uint64,bytes32)");
    bytes32 private constant GOVERNANCE_ACTION_CANCELLED_TOPIC = keccak256(
        "GovernanceActionCancelled(uint16,bytes32,uint8,address,bytes4,bytes32,bytes32,address,bytes32,string)"
    );
    bytes32 private constant TERMINAL_FREEZE_ACTION_MEMBERSHIP_UPDATED_TOPIC = keccak256(
        "TerminalFreezeActionMembershipUpdated(uint16,bytes32,bytes32,address,bool,uint8,bool,uint64,uint256,uint256)"
    );
    bytes32 private constant TERMINAL_FREEZE_GUARDIAN_CONFIG_COMMITTED_TOPIC =
        keccak256("TerminalFreezeGuardianConfigCommitted(uint16,bytes32,bytes32)");
    bytes32 private constant GOVERNANCE_ACTION_V2 =
        0x214cd728538bb3775a7106caff5c761bace11866a984d4a4d97a98f51971ac4b;
    bytes32 private constant GOVERNANCE_CONFIG_SCOPE_V1 =
        keccak256("6529STREAM_GOVERNANCE_CONFIG_SCOPE_V1");
    bytes32 private constant GOVERNANCE_CONFIG_STATE_V1 =
        keccak256("6529STREAM_GOVERNANCE_CONFIG_STATE_V1");
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
    bytes32 private constant GOVERNANCE_ROOT_SCOPE_V1 =
        keccak256("6529STREAM_GOVERNANCE_ROOT_SCOPE_V1");
    bytes32 private constant GOVERNANCE_ROOT_STATE_V1 =
        keccak256("6529STREAM_GOVERNANCE_ROOT_STATE_V1");
    bytes32 private constant TERMINAL_GUARDIAN_CONFIG_V1 =
        keccak256("6529STREAM_TERMINAL_GUARDIAN_CONFIG_V1");
    bytes32 private constant TERMINAL_GUARDIAN_SCOPE_V1 =
        keccak256("6529STREAM_TERMINAL_GUARDIAN_SCOPE_V1");
    bytes32 private constant TERMINAL_GUARDIAN_HOLDER_V1 =
        keccak256("6529STREAM_TERMINAL_GUARDIAN_HOLDER_V1");
    bytes32 private constant ROLE_MUTATION_SCOPE_V1 =
        keccak256("6529STREAM_ROLE_MUTATION_SCOPE_V1");
    bytes32 private constant ROLE_MUTATION_STATE_V1 =
        keccak256("6529STREAM_ROLE_MUTATION_STATE_V1");
    bytes32 private constant ROLE_MUTATION_RECORD_V1 = keccak256("6529STREAM_ROLE_MUTATION_V1");
    bytes32 private constant GLOBAL_ROLE_MUTATION_RECORD_V1 =
        keccak256("6529STREAM_GLOBAL_ROLE_MUTATION_V1");
    bytes32 private constant ROLE_MANAGER_CONFIG_V1 =
        keccak256("6529STREAM_ROLE_MANAGER_CONFIG_V1");
    bytes32 private constant ROLE_MANAGER_CONFIG_STATE_V1 =
        keccak256("6529STREAM_ROLE_MANAGER_CONFIG_STATE_V1");
    bytes32 private constant ROLE_MANAGER_CONFIG_MUTATION_V1 =
        keccak256("6529STREAM_ROLE_MANAGER_CONFIG_MUTATION_V1");
    string private constant REASON_URI = "ipfs://governance-reason";
    uint64 private constant BASE_TIME = 1_000_000;

    StreamRoleRegistry private roleRegistry;
    StreamGovernanceExecutor private executor;
    GovernedTargetMock private target;
    BootstrapArtifacts private bootstrap;

    address private proposer = address(0xA11CE);
    address private canceller = address(0xCA4C);
    address private guardian;
    address private stranger = address(0x5719);

    function setUp() public {
        vm.warp(BASE_TIME);
        bootstrap = _deploySealedExecutor(address(this));
        executor = bootstrap.executor;
        roleRegistry = bootstrap.roleRegistry;
        target = new GovernedTargetMock();
        guardian = bootstrap.initialGuardians[0];
        vm.deal(address(this), 1_000 ether);
    }

    // ---------------------------------------------------------------- helpers

    function _singleCall(uint256 callValue, bytes memory callData)
        private
        view
        returns (GovernanceCall[] memory calls, bytes[] memory callDatas)
    {
        calls = new GovernanceCall[](1);
        calls[0] = GovernanceCall({
            target: address(target),
            value: callValue,
            selector: _selectorOf(callData),
            callDataHash: keccak256(callData),
            scopeHash: SCOPE,
            oldValueHash: OLD_VALUE,
            newValueHash: NEW_VALUE
        });
        callDatas = new bytes[](1);
        callDatas[0] = callData;
    }

    function _selectorOf(bytes memory callData) private pure returns (bytes4 selector) {
        if (callData.length < 4) {
            return bytes4(0);
        }
        assembly ("memory-safe") {
            selector := mload(add(callData, 0x20))
        }
    }

    function _cloneCalls(GovernanceCall[] memory source)
        private
        pure
        returns (GovernanceCall[] memory copy)
    {
        copy = new GovernanceCall[](source.length);
        for (uint256 i = 0; i < source.length; i++) {
            GovernanceCall memory call_ = source[i];
            copy[i] = GovernanceCall({
                target: call_.target,
                value: call_.value,
                selector: call_.selector,
                callDataHash: call_.callDataHash,
                scopeHash: call_.scopeHash,
                oldValueHash: call_.oldValueHash,
                newValueHash: call_.newValueHash
            });
        }
    }

    function _cloneCallDatas(bytes[] memory source) private pure returns (bytes[] memory copy) {
        copy = new bytes[](source.length);
        for (uint256 i = 0; i < source.length; i++) {
            copy[i] = source[i];
        }
    }

    function _defaultWindow() private view returns (uint64 notBefore, uint64 expiresAfter) {
        notBefore = uint64(block.timestamp) + 48 hours;
        expiresAfter = notBefore + 7 days;
    }

    function _schedule(
        uint8 actionClass,
        GovernanceCall[] memory calls,
        bytes[] memory callDatas,
        uint64 notBefore,
        uint64 expiresAfter
    ) private returns (bytes32 actionId) {
        executor.publishGovernanceCallData(callDatas);
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) = _derivedBatchHashes(calls);
        return executor.scheduleGovernanceBatch(
            actionClass,
            calls,
            scopeHash,
            oldValueHash,
            newValueHash,
            notBefore,
            expiresAfter,
            REASON,
            REASON_URI,
            MANIFEST
        );
    }

    function _scheduleAs(
        address actor,
        uint8 actionClass,
        GovernanceCall[] memory calls,
        bytes[] memory callDatas,
        uint64 notBefore,
        uint64 expiresAfter
    ) private returns (bytes32 actionId) {
        executor.publishGovernanceCallData(callDatas);
        return _schedulePublishedAs(actor, actionClass, calls, notBefore, expiresAfter);
    }

    function _schedulePublishedAs(
        address actor,
        uint8 actionClass,
        GovernanceCall[] memory calls,
        uint64 notBefore,
        uint64 expiresAfter
    ) private returns (bytes32 actionId) {
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) = _derivedBatchHashes(calls);
        vm.prank(actor);
        actionId = executor.scheduleGovernanceBatch(
            actionClass,
            calls,
            scopeHash,
            oldValueHash,
            newValueHash,
            notBefore,
            expiresAfter,
            REASON,
            REASON_URI,
            MANIFEST
        );
    }

    function _governanceCall(address callTarget, bytes memory callData, bytes32 scopeSalt)
        private
        pure
        returns (GovernanceCall memory call_)
    {
        call_ = GovernanceCall({
            target: callTarget,
            value: 0,
            selector: _selectorOf(callData),
            callDataHash: keccak256(callData),
            scopeHash: keccak256(abi.encode("control-plane-scope", scopeSalt)),
            oldValueHash: keccak256(abi.encode("control-plane-old", scopeSalt)),
            newValueHash: keccak256(abi.encode("control-plane-new", scopeSalt))
        });
    }

    function _roleGrantGovernanceCall(bytes32 role, address account, bytes memory callData)
        private
        view
        returns (GovernanceCall memory call_)
    {
        (bytes32 roleChainHash, uint64 roleRevision) = roleRegistry.roleMutationState(role);
        (bytes32 globalChainHash, uint64 globalRevision) = roleRegistry.globalRoleMutationState();
        bytes32 scopeHash = keccak256(
            abi.encode(
                ROLE_MUTATION_SCOPE_V1, uint256(block.chainid), address(roleRegistry), role, account
            )
        );
        bytes32 oldStateHash = _roleMutationStateHash(
            scopeHash, false, roleChainHash, roleRevision, globalChainHash, globalRevision
        );
        uint64 nextRoleRevision = roleRevision + 1;
        uint64 nextGlobalRevision = globalRevision + 1;
        bytes32 nextRoleChainHash = keccak256(
            abi.encode(
                ROLE_MUTATION_RECORD_V1,
                roleChainHash,
                uint256(block.chainid),
                address(roleRegistry),
                role,
                account,
                true,
                nextRoleRevision
            )
        );
        bytes32 nextGlobalChainHash = keccak256(
            abi.encode(
                GLOBAL_ROLE_MUTATION_RECORD_V1,
                globalChainHash,
                uint256(block.chainid),
                address(roleRegistry),
                role,
                account,
                true,
                nextGlobalRevision
            )
        );
        call_ = GovernanceCall({
            target: address(roleRegistry),
            value: 0,
            selector: _selectorOf(callData),
            callDataHash: keccak256(callData),
            scopeHash: scopeHash,
            oldValueHash: oldStateHash,
            newValueHash: _roleMutationStateHash(
                scopeHash,
                true,
                nextRoleChainHash,
                nextRoleRevision,
                nextGlobalChainHash,
                nextGlobalRevision
            )
        });
    }

    function _roleRevokeGovernanceCall(bytes32 role, address account, bytes memory callData)
        private
        view
        returns (GovernanceCall memory call_)
    {
        (bytes32 roleChainHash, uint64 roleRevision) = roleRegistry.roleMutationState(role);
        (bytes32 globalChainHash, uint64 globalRevision) = roleRegistry.globalRoleMutationState();
        bytes32 scopeHash = keccak256(
            abi.encode(
                ROLE_MUTATION_SCOPE_V1, uint256(block.chainid), address(roleRegistry), role, account
            )
        );
        bytes32 oldStateHash = _roleMutationStateHash(
            scopeHash, true, roleChainHash, roleRevision, globalChainHash, globalRevision
        );
        uint64 nextRoleRevision = roleRevision + 1;
        uint64 nextGlobalRevision = globalRevision + 1;
        bytes32 nextRoleChainHash = keccak256(
            abi.encode(
                ROLE_MUTATION_RECORD_V1,
                roleChainHash,
                uint256(block.chainid),
                address(roleRegistry),
                role,
                account,
                false,
                nextRoleRevision
            )
        );
        bytes32 nextGlobalChainHash = keccak256(
            abi.encode(
                GLOBAL_ROLE_MUTATION_RECORD_V1,
                globalChainHash,
                uint256(block.chainid),
                address(roleRegistry),
                role,
                account,
                false,
                nextGlobalRevision
            )
        );
        call_ = GovernanceCall({
            target: address(roleRegistry),
            value: 0,
            selector: _selectorOf(callData),
            callDataHash: keccak256(callData),
            scopeHash: scopeHash,
            oldValueHash: oldStateHash,
            newValueHash: _roleMutationStateHash(
                scopeHash,
                false,
                nextRoleChainHash,
                nextRoleRevision,
                nextGlobalChainHash,
                nextGlobalRevision
            )
        });
    }

    function _grantRoleViaGovernance(bytes32 role, address account) private {
        bytes memory callData =
            abi.encodeWithSelector(IStreamRoleRegistry.grantRole.selector, role, account);
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = _roleGrantGovernanceCall(role, account, callData);
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );
        vm.warp(notBefore);
        executor.executeGovernanceBatch(actionId, calls, callDatas);
    }

    function _grantScopedRoleViaGovernance(bytes32 baseRole, bytes32 scopeHash, address account)
        private
    {
        bytes memory callData =
            abi.encodeCall(IStreamRoleRegistry.grantScopedRole, (baseRole, scopeHash, account));
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = _roleGrantGovernanceCall(
            roleRegistry.scopedRole(baseRole, scopeHash), account, callData
        );
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );
        vm.warp(notBefore);
        executor.executeGovernanceBatch(actionId, calls, callDatas);
    }

    function _revokeScopedRoleViaGovernance(bytes32 baseRole, bytes32 scopeHash, address account)
        private
    {
        bytes memory callData =
            abi.encodeCall(IStreamRoleRegistry.revokeScopedRole, (baseRole, scopeHash, account));
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = _roleRevokeGovernanceCall(
            roleRegistry.scopedRole(baseRole, scopeHash), account, callData
        );
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );
        vm.warp(notBefore);
        executor.executeGovernanceBatch(actionId, calls, callDatas);
    }

    function _roleManagerGovernanceCall(address account, bool enabled, bytes memory callData)
        private
        view
        returns (GovernanceCall memory call_)
    {
        bool oldEnabled = roleRegistry.isRoleManager(account);
        (bytes32 chainHash, uint64 revision) = roleRegistry.roleManagerConfigMutationState(account);
        require(revision < type(uint64).max, "manager revision");
        uint64 nextRevision = revision + 1;
        bytes32 scopeHash = keccak256(
            abi.encode(
                ROLE_MUTATION_SCOPE_V1,
                uint256(block.chainid),
                address(roleRegistry),
                ROLE_MANAGER_CONFIG_V1,
                account
            )
        );
        bytes32 nextChainHash = keccak256(
            abi.encode(
                ROLE_MANAGER_CONFIG_MUTATION_V1,
                chainHash,
                uint256(block.chainid),
                address(roleRegistry),
                account,
                enabled,
                nextRevision
            )
        );
        call_ = GovernanceCall({
            target: address(roleRegistry),
            value: 0,
            selector: IStreamRoleRegistry.registerRoleManager.selector,
            callDataHash: keccak256(callData),
            scopeHash: scopeHash,
            oldValueHash: _roleManagerConfigStateHash(scopeHash, oldEnabled, chainHash, revision),
            newValueHash: _roleManagerConfigStateHash(
                scopeHash, enabled, nextChainHash, nextRevision
            )
        });
    }

    function _roleManagerConfigStateHash(
        bytes32 scopeHash,
        bool enabled,
        bytes32 chainHash,
        uint64 revision
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                ROLE_MANAGER_CONFIG_STATE_V1,
                uint256(block.chainid),
                address(roleRegistry),
                scopeHash,
                enabled,
                chainHash,
                revision
            )
        );
    }

    function _terminalGuardianCommitment(GovernanceCall[] memory calls)
        private
        view
        returns (bytes32 commitment)
    {
        (bytes32 baseChain, uint64 baseRevision) =
            roleRegistry.roleMutationState(StreamRoles.ROLE_TERMINAL_FREEZE_VETO);
        commitment = keccak256(
            abi.encode(
                TERMINAL_GUARDIAN_CONFIG_V1,
                uint256(block.chainid),
                address(executor),
                address(roleRegistry),
                address(roleRegistry).codehash,
                baseChain,
                baseRevision
            )
        );
        commitment =
            _appendGuardianHolderCommitment(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, commitment);
        uint256 distinctScopeCount = 0;
        for (uint256 i = 0; i < calls.length; i++) {
            bytes32 scopeHash = calls[i].scopeHash;
            if (_scopeSeenBeforeForCommitment(calls, i, scopeHash)) continue;
            bytes32 scopedRole =
                roleRegistry.scopedRole(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scopeHash);
            (bytes32 scopedChain, uint64 scopedRevision) =
                roleRegistry.roleMutationState(scopedRole);
            commitment = keccak256(
                abi.encode(
                    TERMINAL_GUARDIAN_SCOPE_V1,
                    commitment,
                    scopeHash,
                    scopedRole,
                    scopedChain,
                    scopedRevision
                )
            );
            commitment = _appendGuardianHolderCommitment(scopedRole, commitment);
            distinctScopeCount++;
        }
        return keccak256(abi.encode(TERMINAL_GUARDIAN_CONFIG_V1, commitment, distinctScopeCount));
    }

    function _appendGuardianHolderCommitment(bytes32 role, bytes32 chainHash)
        private
        view
        returns (bytes32)
    {
        uint256 holderCount = roleRegistry.roleHolderCount(role);
        chainHash = keccak256(abi.encode(TERMINAL_GUARDIAN_HOLDER_V1, chainHash, role, holderCount));
        for (uint256 i = 0; i < holderCount; i++) {
            address holder = roleRegistry.roleHolderAt(role, i);
            chainHash = keccak256(
                abi.encode(TERMINAL_GUARDIAN_HOLDER_V1, chainHash, role, i, holder, holder.codehash)
            );
        }
        return chainHash;
    }

    function _scopeSeenBeforeForCommitment(
        GovernanceCall[] memory calls,
        uint256 endExclusive,
        bytes32 scopeHash
    ) private pure returns (bool) {
        for (uint256 i = 0; i < endExclusive; i++) {
            if (calls[i].scopeHash == scopeHash) return true;
        }
        return false;
    }

    function _assertTerminalGuardianCommitmentDrift(
        bytes32 actionId,
        GovernanceCall[] memory calls,
        bytes[] memory callDatas
    ) private {
        bytes32 expectedCommitment = executor.terminalFreezeGuardianConfigCommitment(actionId);
        bytes32 actualCommitment = _terminalGuardianCommitment(calls);
        (expectedCommitment != actualCommitment).assertTrue("guardian commitment must drift");
        GovernanceAction memory action = executor.governanceAction(actionId);
        if (block.timestamp < action.notBefore) vm.warp(action.notBefore);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.TerminalFreezeGuardianConfigDrift.selector,
                actionId,
                expectedCommitment,
                actualCommitment
            )
        );
        executor.executeGovernanceBatch(actionId, calls, callDatas);
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
                ROLE_MUTATION_STATE_V1,
                uint256(block.chainid),
                address(roleRegistry),
                scopeHash,
                granted,
                roleChainHash,
                roleRevision,
                globalChainHash,
                globalRevision
            )
        );
    }

    function _scheduleDefault(bytes memory callData) private returns (bytes32 actionId) {
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        return _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );
    }

    function _scheduleConfigCall(
        uint8 actionClass,
        bytes memory callData,
        bytes32 scopeHash,
        bytes32 oldValueHash,
        bytes32 newValueHash
    )
        private
        returns (
            bytes32 actionId,
            GovernanceCall[] memory calls,
            bytes[] memory callDatas,
            uint64 notBefore
        )
    {
        calls = new GovernanceCall[](1);
        calls[0] = GovernanceCall({
            target: address(executor),
            value: 0,
            selector: _selectorOf(callData),
            callDataHash: keccak256(callData),
            scopeHash: scopeHash,
            oldValueHash: oldValueHash,
            newValueHash: newValueHash
        });
        callDatas = new bytes[](1);
        callDatas[0] = callData;
        notBefore = uint64(block.timestamp) + executor.minimumDelay(actionClass);
        uint64 expiresAfter = notBefore + 7 days;
        actionId = _schedule(actionClass, calls, callDatas, notBefore, expiresAfter);
    }

    function _scheduleRootRotationAs(address actor, address newRoot)
        private
        returns (
            bytes32 actionId,
            GovernanceCall[] memory calls,
            bytes[] memory callDatas,
            uint64 notBefore,
            uint64 priorRevision
        )
    {
        (address oldRoot, bytes32 oldCodeHash, uint64 oldRevision) = executor.governanceRootState();
        bytes32 scopeHash = keccak256(
            abi.encode(GOVERNANCE_ROOT_SCOPE_V1, uint256(block.chainid), address(executor))
        );
        bytes32 oldStateHash = keccak256(
            abi.encode(
                GOVERNANCE_ROOT_STATE_V1,
                uint256(block.chainid),
                address(executor),
                oldRoot,
                oldCodeHash,
                oldRevision
            )
        );
        bytes32 newStateHash = keccak256(
            abi.encode(
                GOVERNANCE_ROOT_STATE_V1,
                uint256(block.chainid),
                address(executor),
                newRoot,
                newRoot.codehash,
                oldRevision + 1
            )
        );
        bytes memory callData = abi.encodeCall(
            StreamGovernanceExecutor.rotateGovernanceRoot, (newRoot, newRoot.codehash)
        );
        calls = new GovernanceCall[](1);
        calls[0] = GovernanceCall({
            target: address(executor),
            value: 0,
            selector: StreamGovernanceExecutor.rotateGovernanceRoot.selector,
            callDataHash: keccak256(callData),
            scopeHash: scopeHash,
            oldValueHash: oldStateHash,
            newValueHash: newStateHash
        });
        callDatas = new bytes[](1);
        callDatas[0] = callData;
        executor.publishGovernanceCallData(callDatas);
        notBefore = uint64(block.timestamp)
            + executor.minimumDelay(StreamGovernanceActionClasses.POINTER_REPLACEMENT);
        actionId = _schedulePublishedAs(
            actor,
            StreamGovernanceActionClasses.POINTER_REPLACEMENT,
            calls,
            notBefore,
            notBefore + 7 days
        );
        priorRevision = oldRevision;
    }

    function _executeConfigCall(
        uint8 actionClass,
        bytes memory callData,
        bytes32 scopeHash,
        bytes32 oldValueHash,
        bytes32 newValueHash
    ) private returns (bytes32 actionId) {
        GovernanceCall[] memory calls;
        bytes[] memory callDatas;
        uint64 notBefore;
        (actionId, calls, callDatas, notBefore) =
            _scheduleConfigCall(actionClass, callData, scopeHash, oldValueHash, newValueHash);
        vm.warp(notBefore);
        executor.executeGovernanceBatch(actionId, calls, callDatas);
    }

    function _assertExecutorConfigDirectionRejected(
        bytes memory callData,
        bool enabled,
        uint8 expectedClass,
        uint8 actualClass
    ) private {
        bytes4 selector = _selectorOf(callData);
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = GovernanceCall({
            target: address(executor),
            value: 0,
            selector: selector,
            callDataHash: keccak256(callData),
            scopeHash: SCOPE,
            oldValueHash: OLD_VALUE,
            newValueHash: NEW_VALUE
        });
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        uint64 notBefore = uint64(block.timestamp) + executor.minimumDelay(actualClass);
        uint64 expiresAfter = notBefore + 7 days;
        executor.publishGovernanceCallData(callDatas);
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) = _derivedBatchHashes(calls);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.ExecutorConfigActionClassMismatch.selector,
                address(executor),
                selector,
                enabled,
                expectedClass,
                actualClass
            )
        );
        executor.scheduleGovernanceBatch(
            actualClass,
            calls,
            scopeHash,
            oldValueHash,
            newValueHash,
            notBefore,
            expiresAfter,
            REASON,
            REASON_URI,
            MANIFEST
        );
    }

    function _assertIsolatedExecutorControlRejected(bytes memory callData, uint8 actionClass)
        private
    {
        GovernedTargetMock second = new GovernedTargetMock();
        bytes[] memory callDatas = new bytes[](2);
        callDatas[0] = callData;
        callDatas[1] = abi.encodeCall(GovernedTargetMock.setValue, (777));
        GovernanceCall[] memory calls = new GovernanceCall[](2);
        calls[0] = _governanceCall(address(executor), callDatas[0], keccak256("isolated-control"));
        calls[1] = _governanceCall(address(second), callDatas[1], keccak256("second-control"));
        executor.publishGovernanceCallData(callDatas);
        uint64 notBefore = uint64(block.timestamp) + executor.minimumDelay(actionClass);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceSelfCallContextRequired.selector
            )
        );
        _schedulePublishedAs(address(this), actionClass, calls, notBefore, notBefore + 7 days);
    }

    function _assertSingleExecutorControlScheduleRevert(
        bytes memory callData,
        uint8 actionClass,
        bytes memory expectedRevert
    ) private {
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = _governanceCall(address(executor), callData, keccak256("executor-control"));
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        executor.publishGovernanceCallData(callDatas);
        uint64 notBefore = uint64(block.timestamp) + executor.minimumDelay(actionClass);

        vm.expectRevert(expectedRevert);
        _schedulePublishedAs(address(this), actionClass, calls, notBefore, notBefore + 7 days);
    }

    function _assertExecutorTighteningClassifierUnseeded(bytes4 selector) private view {
        (bool tightening, bytes32 targetCodeHash, uint64 revision,) =
            executor.tighteningCallConfig(address(executor), selector);
        tightening.assertFalse("executor selector is not selector-wide tightening state");
        targetCodeHash.assertEq(bytes32(0), "executor selector has no pinned policy code hash");
        uint256(revision).assertEq(0, "executor selector has no mutable-policy revision");
        executor.isTighteningCall(address(executor), selector)
            .assertFalse("executor selector classifier is calldata-aware only");
    }

    function _executeBooleanConfigCall(
        bytes32 configKind,
        address key,
        bool newEnabled,
        uint64 oldRevision,
        bytes32 oldStateHash,
        uint8 actionClass,
        bytes memory callData
    ) private returns (bytes32 actionId) {
        bytes32 scopeHash = keccak256(
            abi.encode(
                GOVERNANCE_CONFIG_SCOPE_V1,
                uint256(block.chainid),
                address(executor),
                configKind,
                key
            )
        );
        bytes32 newStateHash = keccak256(
            abi.encode(
                GOVERNANCE_CONFIG_STATE_V1,
                uint256(block.chainid),
                address(executor),
                configKind,
                key,
                newEnabled,
                oldRevision + 1
            )
        );
        return _executeConfigCall(actionClass, callData, scopeHash, oldStateHash, newStateHash);
    }

    function _executeSelectorConfigCall(
        bytes32 configKind,
        address configTarget,
        bytes4 selector,
        bool newEnabled,
        bytes32 newCodeHash,
        uint64 oldRevision,
        bytes32 oldStateHash,
        uint8 actionClass,
        bytes memory callData
    ) private returns (bytes32 actionId) {
        bytes32 scopeHash = keccak256(
            abi.encode(
                GOVERNANCE_CONFIG_SCOPE_V1,
                uint256(block.chainid),
                address(executor),
                configKind,
                configTarget,
                selector
            )
        );
        bytes32 newStateHash = keccak256(
            abi.encode(
                GOVERNANCE_CONFIG_STATE_V1,
                uint256(block.chainid),
                address(executor),
                configKind,
                configTarget,
                selector,
                newEnabled,
                newCodeHash,
                oldRevision + 1
            )
        );
        return _executeConfigCall(actionClass, callData, scopeHash, oldStateHash, newStateHash);
    }

    function _setProposer(address account, bool enabled) private returns (bytes32 actionId) {
        (, uint64 revision, bytes32 stateHash) = executor.proposerConfig(account);
        return _executeBooleanConfigCall(
            GOVERNANCE_CONFIG_PROPOSER,
            account,
            enabled,
            revision,
            stateHash,
            enabled
                ? StreamGovernanceActionClasses.DELAYED_LOOSENING
                : StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            abi.encodeCall(StreamGovernanceExecutor.registerProposer, (account, enabled))
        );
    }

    function _setCanceller(address account, bool enabled) private returns (bytes32 actionId) {
        (, uint64 revision, bytes32 stateHash) = executor.cancellerConfig(account);
        return _executeBooleanConfigCall(
            GOVERNANCE_CONFIG_CANCELLER,
            account,
            enabled,
            revision,
            stateHash,
            enabled
                ? StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING
                : StreamGovernanceActionClasses.DELAYED_LOOSENING,
            abi.encodeCall(StreamGovernanceExecutor.registerCanceller, (account, enabled))
        );
    }

    function _setNativeReceiver(address receiver, bool approved)
        private
        returns (bytes32 actionId)
    {
        (, uint64 revision, bytes32 stateHash) = executor.approvedNativeReceiverConfig(receiver);
        return _executeBooleanConfigCall(
            GOVERNANCE_CONFIG_NATIVE_RECEIVER,
            receiver,
            approved,
            revision,
            stateHash,
            approved
                ? StreamGovernanceActionClasses.DELAYED_LOOSENING
                : StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            abi.encodeCall(StreamGovernanceExecutor.setApprovedNativeReceiver, (receiver, approved))
        );
    }

    function _setTighteningCall(address configTarget, bytes4 selector, bool tightening)
        private
        returns (bytes32 actionId)
    {
        (,, uint64 revision, bytes32 stateHash) =
            executor.tighteningCallConfig(configTarget, selector);
        return _executeSelectorConfigCall(
            GOVERNANCE_CONFIG_TIGHTENING_CALL,
            configTarget,
            selector,
            tightening,
            tightening ? configTarget.codehash : bytes32(0),
            revision,
            stateHash,
            tightening
                ? StreamGovernanceActionClasses.DELAYED_LOOSENING
                : StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            abi.encodeCall(
                StreamGovernanceExecutor.setTighteningCall, (configTarget, selector, tightening)
            )
        );
    }

    function _setFreezeSelector(address configTarget, bytes4 selector, bool freeze)
        private
        returns (bytes32 actionId)
    {
        (,, uint64 revision, bytes32 stateHash) =
            executor.freezeSelectorConfig(configTarget, selector);
        return _executeSelectorConfigCall(
            GOVERNANCE_CONFIG_FREEZE_SELECTOR,
            configTarget,
            selector,
            freeze,
            freeze ? configTarget.codehash : bytes32(0),
            revision,
            stateHash,
            freeze
                ? StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING
                : StreamGovernanceActionClasses.DELAYED_LOOSENING,
            abi.encodeCall(
                StreamGovernanceExecutor.registerFreezeSelector, (configTarget, selector, freeze)
            )
        );
    }

    function _assertGuardianCannotBecomeProposer(address candidate) private {
        (, uint64 revision, bytes32 oldStateHash) = executor.proposerConfig(candidate);
        bytes32 scopeHash = keccak256(
            abi.encode(
                GOVERNANCE_CONFIG_SCOPE_V1,
                uint256(block.chainid),
                address(executor),
                GOVERNANCE_CONFIG_PROPOSER,
                candidate
            )
        );
        bytes32 newStateHash = keccak256(
            abi.encode(
                GOVERNANCE_CONFIG_STATE_V1,
                uint256(block.chainid),
                address(executor),
                GOVERNANCE_CONFIG_PROPOSER,
                candidate,
                true,
                revision + 1
            )
        );
        bytes32 actionId;
        GovernanceCall[] memory calls;
        bytes[] memory callDatas;
        uint64 notBefore;
        (actionId, calls, callDatas, notBefore) = _scheduleConfigCall(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            abi.encodeCall(StreamGovernanceExecutor.registerProposer, (candidate, true)),
            scopeHash,
            oldStateHash,
            newStateHash
        );
        vm.warp(notBefore);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceIdentityRoleOverlap.selector,
                candidate,
                StreamRoles.ROLE_TERMINAL_FREEZE_VETO
            )
        );
        executor.executeGovernanceBatch(actionId, calls, callDatas);
        executor.isProposer(candidate).assertFalse("guardian not registered as proposer");
        executor.cancelGovernanceAction(actionId, keccak256("overlap regression cleanup"));
    }

    function _assertGuardianCannotBecomeGovernanceRoot(address candidate) private {
        (address oldRoot, bytes32 oldCodeHash, uint64 oldRevision) = executor.governanceRootState();
        bytes32 scopeHash = keccak256(
            abi.encode(GOVERNANCE_ROOT_SCOPE_V1, uint256(block.chainid), address(executor))
        );
        bytes32 oldStateHash = keccak256(
            abi.encode(
                GOVERNANCE_ROOT_STATE_V1,
                uint256(block.chainid),
                address(executor),
                oldRoot,
                oldCodeHash,
                oldRevision
            )
        );
        bytes32 newStateHash = keccak256(
            abi.encode(
                GOVERNANCE_ROOT_STATE_V1,
                uint256(block.chainid),
                address(executor),
                candidate,
                candidate.codehash,
                oldRevision + 1
            )
        );
        bytes32 actionId;
        GovernanceCall[] memory calls;
        bytes[] memory callDatas;
        uint64 notBefore;
        (actionId, calls, callDatas, notBefore) = _scheduleConfigCall(
            StreamGovernanceActionClasses.POINTER_REPLACEMENT,
            abi.encodeCall(
                StreamGovernanceExecutor.rotateGovernanceRoot, (candidate, candidate.codehash)
            ),
            scopeHash,
            oldStateHash,
            newStateHash
        );
        vm.warp(notBefore);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidGovernanceRoot.selector, candidate
            )
        );
        executor.executeGovernanceBatch(actionId, calls, callDatas);
        executor.owner().assertEq(oldRoot, "guardian not installed as governance root");
        executor.cancelGovernanceAction(actionId, keccak256("overlap regression cleanup"));
    }

    function _assertMismatchedGovernedSelfCallBlocked(
        bytes memory callData,
        bytes4 selector,
        uint8 actionClass
    ) private {
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = GovernanceCall({
            target: address(executor),
            value: 0,
            selector: selector,
            callDataHash: keccak256(callData),
            scopeHash: SCOPE,
            oldValueHash: OLD_VALUE,
            newValueHash: NEW_VALUE
        });
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 actionId = _schedule(actionClass, calls, callDatas, notBefore, expiresAfter);
        vm.warp(notBefore);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceTransitionContextMismatch.selector
            )
        );
        executor.executeGovernanceBatch(actionId, calls, callDatas);
    }

    function _expectedActionId(
        uint8 actionClass,
        GovernanceCall[] memory calls,
        uint256 nonce,
        uint64 notBefore,
        uint64 expiresAfter
    ) private view returns (bytes32) {
        bytes32 callsHash = keccak256(abi.encode(GOVERNANCE_CALLS_V2, calls));
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) = _derivedBatchHashes(calls);
        return keccak256(
            abi.encode(
                GOVERNANCE_ACTION_V2,
                uint256(block.chainid),
                address(executor),
                actionClass,
                callsHash,
                scopeHash,
                oldValueHash,
                newValueHash,
                nonce,
                notBefore,
                expiresAfter,
                REASON,
                MANIFEST
            )
        );
    }

    function _derivedBatchHashes(GovernanceCall[] memory calls)
        private
        pure
        returns (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash)
    {
        bytes32 callsHash = keccak256(abi.encode(GOVERNANCE_CALLS_V2, calls));
        bytes32[] memory scopes = new bytes32[](calls.length);
        bytes32[] memory oldValues = new bytes32[](calls.length);
        bytes32[] memory newValues = new bytes32[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            scopes[i] = calls[i].scopeHash;
            oldValues[i] = calls[i].oldValueHash;
            newValues[i] = calls[i].newValueHash;
        }
        scopeHash = keccak256(abi.encode(BATCH_SCOPE_V2, callsHash, scopes));
        oldValueHash = keccak256(abi.encode(BATCH_OLD_STATE_V2, callsHash, oldValues));
        newValueHash = keccak256(abi.encode(BATCH_NEW_STATE_V2, callsHash, newValues));
    }

    function _onlyExecutorEventLog(Vm.Log[] memory logs, bytes32 topic0)
        private
        view
        returns (Vm.Log memory matched)
    {
        uint256 matchCount;
        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].emitter == address(executor) && logs[i].topics.length != 0
                    && logs[i].topics[0] == topic0
            ) {
                matched = logs[i];
                matchCount++;
            }
        }
        matchCount.assertEq(1, "exactly one matching executor event");
    }

    function _assertBooleanConfigEventLog(
        Vm.Log[] memory logs,
        bytes32 topic0,
        address account,
        bool enabled,
        uint64 revision,
        bytes32 actionId
    ) private view {
        Vm.Log memory log = _onlyExecutorEventLog(logs, topic0);
        log.topics.length.assertEq(3, "boolean config topic count");
        log.topics[1].assertEq(bytes32(uint256(uint160(account))), "boolean config account topic");
        log.topics[2].assertEq(actionId, "boolean config action topic");
        bytes memory expectedData = abi.encode(uint16(1), enabled, revision);
        log.data.length.assertEq(expectedData.length, "boolean config data length");
        keccak256(log.data).assertEq(keccak256(expectedData), "boolean config raw data");
        (uint16 schemaVersion, bool eventEnabled, uint64 eventRevision) =
            abi.decode(log.data, (uint16, bool, uint64));
        uint256(schemaVersion).assertEq(1, "boolean config schema");
        require(eventEnabled == enabled, "boolean config enabled");
        uint256(eventRevision).assertEq(uint256(revision), "boolean config revision");
    }

    function _assertSelectorConfigEventLog(
        Vm.Log[] memory logs,
        bytes32 topic0,
        address configTarget,
        bytes4 selector,
        bool enabled,
        bytes32 targetCodeHash,
        uint64 revision,
        bytes32 actionId
    ) private view {
        Vm.Log memory log = _onlyExecutorEventLog(logs, topic0);
        log.topics.length.assertEq(4, "selector config topic count");
        log.topics[1].assertEq(
            bytes32(uint256(uint160(configTarget))), "selector config target topic"
        );
        log.topics[2].assertEq(bytes32(selector), "selector config selector topic");
        log.topics[3].assertEq(actionId, "selector config action topic");
        bytes memory expectedData = abi.encode(uint16(1), enabled, targetCodeHash, revision);
        log.data.length.assertEq(expectedData.length, "selector config data length");
        keccak256(log.data).assertEq(keccak256(expectedData), "selector config raw data");
        (
            uint16 schemaVersion,
            bool eventEnabled,
            bytes32 eventTargetCodeHash,
            uint64 eventRevision
        ) = abi.decode(log.data, (uint16, bool, bytes32, uint64));
        uint256(schemaVersion).assertEq(1, "selector config schema");
        require(eventEnabled == enabled, "selector config enabled");
        eventTargetCodeHash.assertEq(targetCodeHash, "selector config code hash");
        uint256(eventRevision).assertEq(uint256(revision), "selector config revision");
    }

    // ------------------------------------------------------------- scheduling

    function testGovernanceCallDataPublishedEventHasExactLogLayout() public {
        bytes[] memory callDatas = new bytes[](2);
        callDatas[0] = abi.encodeCall(GovernedTargetMock.setValue, (uint256(0xCA11DA7A)));
        callDatas[1] = abi.encodePacked(bytes4(0x12345678), bytes32(uint256(0xBEEF)));
        bytes32 callDataKey =
            keccak256(abi.encodePacked(keccak256(callDatas[0]), keccak256(callDatas[1])));

        vm.recordLogs();
        vm.prank(stranger);
        address pointer = executor.publishGovernanceCallData(callDatas);
        Vm.Log memory log =
            _onlyExecutorEventLog(vm.getRecordedLogs(), GOVERNANCE_CALL_DATA_PUBLISHED_TOPIC);

        log.topics.length.assertEq(2, "calldata publication topic count");
        log.topics[1].assertEq(callDataKey, "calldata publication key topic");
        bytes memory expectedData = abi.encode(uint16(1), pointer, stranger);
        log.data.length.assertEq(expectedData.length, "calldata publication data length");
        keccak256(log.data).assertEq(keccak256(expectedData), "calldata publication raw data");
        (uint16 schemaVersion, address eventPointer, address eventPublisher) =
            abi.decode(log.data, (uint16, address, address));
        uint256(schemaVersion).assertEq(1, "calldata publication schema");
        eventPointer.assertEq(pointer, "calldata publication pointer");
        eventPublisher.assertEq(stranger, "calldata publication publisher");
        executor.publishedCallData(callDataKey)
            .assertEq(pointer, "calldata publication state pointer");
    }

    function testGovernanceRootRotatedEventHasExactLogLayout() public {
        StreamGovernanceRootMock newRoot = new StreamGovernanceRootMock();
        (address oldRoot,,) = executor.governanceRootState();
        bytes32 actionId;
        GovernanceCall[] memory calls;
        bytes[] memory callDatas;
        uint64 notBefore;
        uint64 priorRevision;
        (actionId, calls, callDatas, notBefore, priorRevision) =
            _scheduleRootRotationAs(address(this), address(newRoot));
        uint64 expectedRevision = priorRevision + 1;

        vm.warp(notBefore);
        vm.recordLogs();
        executor.executeGovernanceBatch(actionId, calls, callDatas);
        Vm.Log memory log =
            _onlyExecutorEventLog(vm.getRecordedLogs(), GOVERNANCE_ROOT_ROTATED_TOPIC);

        log.topics.length.assertEq(4, "root rotation topic count");
        log.topics[1].assertEq(bytes32(uint256(uint160(oldRoot))), "root rotation old root topic");
        log.topics[2].assertEq(
            bytes32(uint256(uint160(address(newRoot)))), "root rotation new root topic"
        );
        log.topics[3].assertEq(actionId, "root rotation action topic");
        bytes memory expectedData =
            abi.encode(uint16(1), address(newRoot).codehash, expectedRevision);
        log.data.length.assertEq(expectedData.length, "root rotation data length");
        keccak256(log.data).assertEq(keccak256(expectedData), "root rotation raw data");
        (uint16 schemaVersion, bytes32 eventCodeHash, uint64 eventRevision) =
            abi.decode(log.data, (uint16, bytes32, uint64));
        uint256(schemaVersion).assertEq(1, "root rotation schema");
        eventCodeHash.assertEq(address(newRoot).codehash, "root rotation code hash");
        uint256(eventRevision).assertEq(uint256(expectedRevision), "root rotation revision");
        (address storedRoot, bytes32 storedCodeHash, uint64 storedRevision) =
            executor.governanceRootState();
        storedRoot.assertEq(address(newRoot), "stored governance root");
        storedCodeHash.assertEq(address(newRoot).codehash, "stored governance root code hash");
        uint256(storedRevision)
            .assertEq(uint256(expectedRevision), "stored governance root revision");
    }

    function testBooleanGovernanceConfigEventsHaveExactLogLayouts() public {
        vm.recordLogs();
        bytes32 proposerActionId = _setProposer(proposer, true);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        (bool proposerEnabled, uint64 proposerRevision,) = executor.proposerConfig(proposer);
        proposerEnabled.assertTrue("proposer state enabled");
        _assertBooleanConfigEventLog(
            logs,
            GOVERNANCE_PROPOSER_UPDATED_TOPIC,
            proposer,
            true,
            proposerRevision,
            proposerActionId
        );

        vm.recordLogs();
        bytes32 cancellerActionId = _setCanceller(canceller, true);
        logs = vm.getRecordedLogs();
        (bool cancellerEnabled, uint64 cancellerRevision,) = executor.cancellerConfig(canceller);
        cancellerEnabled.assertTrue("canceller state enabled");
        _assertBooleanConfigEventLog(
            logs,
            GOVERNANCE_CANCELLER_UPDATED_TOPIC,
            canceller,
            true,
            cancellerRevision,
            cancellerActionId
        );

        vm.recordLogs();
        bytes32 receiverActionId = _setNativeReceiver(stranger, true);
        logs = vm.getRecordedLogs();
        (bool receiverApproved, uint64 receiverRevision,) =
            executor.approvedNativeReceiverConfig(stranger);
        receiverApproved.assertTrue("native receiver state approved");
        _assertBooleanConfigEventLog(
            logs,
            APPROVED_NATIVE_RECEIVER_UPDATED_TOPIC,
            stranger,
            true,
            receiverRevision,
            receiverActionId
        );
    }

    function testSelectorGovernanceConfigEventsHaveExactLogLayouts() public {
        bytes4 selector = GovernedTargetMock.setValue.selector;

        vm.recordLogs();
        bytes32 tighteningActionId = _setTighteningCall(address(target), selector, true);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        (bool tightening, bytes32 tighteningCodeHash, uint64 tighteningRevision,) =
            executor.tighteningCallConfig(address(target), selector);
        tightening.assertTrue("tightening state enabled");
        _assertSelectorConfigEventLog(
            logs,
            TIGHTENING_CALL_UPDATED_TOPIC,
            address(target),
            selector,
            true,
            tighteningCodeHash,
            tighteningRevision,
            tighteningActionId
        );

        GovernedTargetMock freezeTarget = new GovernedTargetMock();
        vm.recordLogs();
        bytes32 freezeActionId = _setFreezeSelector(address(freezeTarget), selector, true);
        logs = vm.getRecordedLogs();
        (bool freeze, bytes32 freezeCodeHash, uint64 freezeRevision,) =
            executor.freezeSelectorConfig(address(freezeTarget), selector);
        freeze.assertTrue("freeze selector state enabled");
        _assertSelectorConfigEventLog(
            logs,
            FREEZE_SELECTOR_UPDATED_TOPIC,
            address(freezeTarget),
            selector,
            true,
            freezeCodeHash,
            freezeRevision,
            freezeActionId
        );
    }

    function testExecutorConfigDirectionIsProvenBeforeScheduling() public {
        uint8 immediate = StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING;
        uint8 delayed = StreamGovernanceActionClasses.DELAYED_LOOSENING;

        _assertExecutorConfigDirectionRejected(
            abi.encodeCall(StreamGovernanceExecutor.registerProposer, (stranger, true)),
            true,
            delayed,
            immediate
        );
        _assertExecutorConfigDirectionRejected(
            abi.encodeCall(StreamGovernanceExecutor.registerProposer, (stranger, false)),
            false,
            immediate,
            delayed
        );
        _assertExecutorConfigDirectionRejected(
            abi.encodeCall(StreamGovernanceExecutor.registerCanceller, (stranger, false)),
            false,
            delayed,
            immediate
        );
        _assertExecutorConfigDirectionRejected(
            abi.encodeCall(StreamGovernanceExecutor.registerCanceller, (stranger, true)),
            true,
            immediate,
            delayed
        );
        _assertExecutorConfigDirectionRejected(
            abi.encodeCall(StreamGovernanceExecutor.setApprovedNativeReceiver, (stranger, true)),
            true,
            delayed,
            immediate
        );
        _assertExecutorConfigDirectionRejected(
            abi.encodeCall(StreamGovernanceExecutor.setApprovedNativeReceiver, (stranger, false)),
            false,
            immediate,
            delayed
        );
        _assertExecutorConfigDirectionRejected(
            abi.encodeCall(
                StreamGovernanceExecutor.setTighteningCall,
                (address(target), GovernedTargetMock.setValue.selector, true)
            ),
            true,
            delayed,
            immediate
        );
        _assertExecutorConfigDirectionRejected(
            abi.encodeCall(
                StreamGovernanceExecutor.setTighteningCall,
                (address(target), GovernedTargetMock.setValue.selector, false)
            ),
            false,
            immediate,
            delayed
        );
        _assertExecutorConfigDirectionRejected(
            abi.encodeCall(
                StreamGovernanceExecutor.registerFreezeSelector,
                (address(target), GovernedTargetMock.setValue.selector, false)
            ),
            false,
            delayed,
            immediate
        );
        _assertExecutorConfigDirectionRejected(
            abi.encodeCall(
                StreamGovernanceExecutor.registerFreezeSelector,
                (address(target), GovernedTargetMock.setValue.selector, true)
            ),
            true,
            immediate,
            delayed
        );
    }

    function testExecutorConfigIsolationIsProvenBeforeScheduling() public {
        _assertIsolatedExecutorControlRejected(
            abi.encodeCall(StreamGovernanceExecutor.registerProposer, (stranger, true)),
            StreamGovernanceActionClasses.DELAYED_LOOSENING
        );
        _assertIsolatedExecutorControlRejected(
            abi.encodeCall(StreamGovernanceExecutor.registerCanceller, (stranger, true)),
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING
        );
        _assertIsolatedExecutorControlRejected(
            abi.encodeCall(StreamGovernanceExecutor.setApprovedNativeReceiver, (stranger, true)),
            StreamGovernanceActionClasses.DELAYED_LOOSENING
        );
        _assertIsolatedExecutorControlRejected(
            abi.encodeCall(
                StreamGovernanceExecutor.setTighteningCall,
                (address(target), GovernedTargetMock.setValue.selector, true)
            ),
            StreamGovernanceActionClasses.DELAYED_LOOSENING
        );
        _assertIsolatedExecutorControlRejected(
            abi.encodeCall(
                StreamGovernanceExecutor.registerFreezeSelector,
                (address(target), GovernedTargetMock.setValue.selector, true)
            ),
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING
        );
    }

    function testGovernanceRootRotationClassCalldataAndIsolationAreProvenBeforeScheduling() public {
        StreamGovernanceRootMock newRoot = new StreamGovernanceRootMock();
        bytes memory validCallData = abi.encodeCall(
            StreamGovernanceExecutor.rotateGovernanceRoot,
            (address(newRoot), address(newRoot).codehash)
        );
        bytes4 selector = StreamGovernanceExecutor.rotateGovernanceRoot.selector;

        _assertSingleExecutorControlScheduleRevert(
            validCallData,
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.ExecutorControlActionClassMismatch.selector,
                address(executor),
                selector,
                StreamGovernanceActionClasses.POINTER_REPLACEMENT,
                StreamGovernanceActionClasses.DELAYED_LOOSENING
            )
        );
        _assertSingleExecutorControlScheduleRevert(
            bytes.concat(validCallData, bytes32(uint256(1))),
            StreamGovernanceActionClasses.POINTER_REPLACEMENT,
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidExecutorConfigCall.selector,
                address(executor),
                selector
            )
        );
        _assertSingleExecutorControlScheduleRevert(
            abi.encodePacked(selector, bytes32(type(uint256).max), address(newRoot).codehash),
            StreamGovernanceActionClasses.POINTER_REPLACEMENT,
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidExecutorConfigCall.selector,
                address(executor),
                selector
            )
        );
        _assertSingleExecutorControlScheduleRevert(
            abi.encodeCall(
                StreamGovernanceExecutor.rotateGovernanceRoot,
                (address(0), address(newRoot).codehash)
            ),
            StreamGovernanceActionClasses.POINTER_REPLACEMENT,
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidExecutorConfigCall.selector,
                address(executor),
                selector
            )
        );
        _assertSingleExecutorControlScheduleRevert(
            abi.encodeCall(
                StreamGovernanceExecutor.rotateGovernanceRoot, (address(newRoot), bytes32(0))
            ),
            StreamGovernanceActionClasses.POINTER_REPLACEMENT,
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidExecutorConfigCall.selector,
                address(executor),
                selector
            )
        );
        _assertIsolatedExecutorControlRejected(
            validCallData, StreamGovernanceActionClasses.POINTER_REPLACEMENT
        );
    }

    function testExecutorConfigSelectorsAreNotSeededAsSelectorWideTighteningCalls() public view {
        _assertExecutorTighteningClassifierUnseeded(
            StreamGovernanceExecutor.registerProposer.selector
        );
        _assertExecutorTighteningClassifierUnseeded(
            StreamGovernanceExecutor.registerCanceller.selector
        );
        _assertExecutorTighteningClassifierUnseeded(
            StreamGovernanceExecutor.setApprovedNativeReceiver.selector
        );
        _assertExecutorTighteningClassifierUnseeded(
            StreamGovernanceExecutor.setTighteningCall.selector
        );
        _assertExecutorTighteningClassifierUnseeded(
            StreamGovernanceExecutor.registerFreezeSelector.selector
        );
    }

    function testMutableTighteningClassifierCannotTargetExecutorSelfConfig() public {
        bytes memory callData = abi.encodeCall(
            StreamGovernanceExecutor.setTighteningCall,
            (address(executor), StreamGovernanceExecutor.registerProposer.selector, true)
        );
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = GovernanceCall({
            target: address(executor),
            value: 0,
            selector: StreamGovernanceExecutor.setTighteningCall.selector,
            callDataHash: keccak256(callData),
            scopeHash: SCOPE,
            oldValueHash: OLD_VALUE,
            newValueHash: NEW_VALUE
        });
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        executor.publishGovernanceCallData(callDatas);
        uint8 actionClass = StreamGovernanceActionClasses.DELAYED_LOOSENING;
        uint64 notBefore = uint64(block.timestamp) + executor.minimumDelay(actionClass);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidExecutorConfigCall.selector,
                address(executor),
                StreamGovernanceExecutor.setTighteningCall.selector
            )
        );
        _schedulePublishedAs(address(this), actionClass, calls, notBefore, notBefore + 7 days);
    }

    function testFreezeSelectorClassifierCannotTargetExecutorSelfConfig() public {
        _assertExecutorSelfTargetConfigRejected(
            abi.encodeCall(
                StreamGovernanceExecutor.registerFreezeSelector,
                (address(executor), StreamGovernanceExecutor.registerProposer.selector, true)
            ),
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING
        );
        _assertExecutorSelfTargetConfigRejected(
            abi.encodeCall(
                StreamGovernanceExecutor.registerFreezeSelector,
                (address(executor), StreamGovernanceExecutor.registerProposer.selector, false)
            ),
            StreamGovernanceActionClasses.DELAYED_LOOSENING
        );
    }

    function _assertExecutorSelfTargetConfigRejected(bytes memory callData, uint8 actionClass)
        private
    {
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = GovernanceCall({
            target: address(executor),
            value: 0,
            selector: StreamGovernanceExecutor.registerFreezeSelector.selector,
            callDataHash: keccak256(callData),
            scopeHash: SCOPE,
            oldValueHash: OLD_VALUE,
            newValueHash: NEW_VALUE
        });
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        executor.publishGovernanceCallData(callDatas);
        uint64 notBefore = uint64(block.timestamp) + executor.minimumDelay(actionClass);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidExecutorConfigCall.selector,
                address(executor),
                StreamGovernanceExecutor.registerFreezeSelector.selector
            )
        );
        _schedulePublishedAs(address(this), actionClass, calls, notBefore, notBefore + 7 days);
    }

    function testRegisteredProposerCannotScheduleExecutorControlPlaneMutation() public {
        _setProposer(proposer, true);
        uint8 actionClass = StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING;
        bytes memory callData =
            abi.encodeCall(StreamGovernanceExecutor.registerCanceller, (stranger, true));
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = _governanceCall(address(executor), callData, keccak256("executor-control"));
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        uint64 notBefore = uint64(block.timestamp) + executor.minimumDelay(actionClass);
        uint64 expiresAfter = notBefore + 7 days;

        executor.publishGovernanceCallData(callDatas);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceRootProposerRequired.selector,
                proposer,
                address(this),
                address(executor),
                StreamGovernanceExecutor.registerCanceller.selector
            )
        );
        _schedulePublishedAs(proposer, actionClass, calls, notBefore, expiresAfter);
    }

    function testProposerDisableAndAddressABAPermanentlyInvalidateQueuedActions() public {
        _setProposer(proposer, true);
        (, uint64 scheduledRevision,) = executor.proposerConfig(proposer);
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (9191));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        executor.publishGovernanceCallData(callDatas);
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        vm.prank(proposer);
        bytes32 actionId = _scheduleClass(
            StreamGovernanceActionClasses.DELAYED_LOOSENING, calls, notBefore, expiresAfter
        );

        _setProposer(proposer, false);
        vm.warp(notBefore);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceProposerAuthorizationDrift.selector,
                actionId,
                proposer,
                scheduledRevision,
                scheduledRevision + 1,
                false
            )
        );
        executor.executeGovernanceBatch(actionId, calls, callDatas);

        _setProposer(proposer, true);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceProposerAuthorizationDrift.selector,
                actionId,
                proposer,
                scheduledRevision,
                scheduledRevision + 2,
                true
            )
        );
        executor.executeGovernanceBatch(actionId, calls, callDatas);
        target.value().assertEq(0, "stale proposer action never executed");
        executor.cancelGovernanceAction(actionId, keccak256("proposer ABA regression cleanup"));
    }

    function testBootstrapSealExemptionExpiresAfterSeal() public {
        _setProposer(proposer, true);
        bytes memory callData =
            abi.encodeCall(StreamGovernanceExecutor.sealSystemManifestBootstrap, ());
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = _governanceCall(address(executor), callData, keccak256("postseal-seal-spam"));
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();

        executor.publishGovernanceCallData(callDatas);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceRootProposerRequired.selector,
                proposer,
                address(this),
                address(executor),
                StreamGovernanceExecutor.sealSystemManifestBootstrap.selector
            )
        );
        _schedulePublishedAs(
            proposer,
            StreamGovernanceActionClasses.POINTER_REPLACEMENT,
            calls,
            notBefore,
            expiresAfter
        );
    }

    function testProtectedSecondBatchCallCannotHideBehindOrdinaryFirstCall() public {
        _setProposer(proposer, true);
        bytes memory ordinaryCallData = abi.encodeCall(GovernedTargetMock.setValue, (17));
        bytes memory protectedCallData = abi.encodeWithSelector(
            IStreamRoleRegistry.grantRole.selector, StreamRoles.ROLE_TREASURY, stranger
        );
        GovernanceCall[] memory calls = new GovernanceCall[](2);
        calls[0] = _governanceCall(address(target), ordinaryCallData, keccak256("ordinary-first"));
        calls[1] = _governanceCall(
            address(roleRegistry), protectedCallData, keccak256("protected-second")
        );
        bytes[] memory callDatas = new bytes[](2);
        callDatas[0] = ordinaryCallData;
        callDatas[1] = protectedCallData;
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();

        executor.publishGovernanceCallData(callDatas);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceRootProposerRequired.selector,
                proposer,
                address(this),
                address(roleRegistry),
                IStreamRoleRegistry.grantRole.selector
            )
        );
        _schedulePublishedAs(
            proposer,
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            notBefore,
            expiresAfter
        );
    }

    function testGovernanceRootCanExecuteDelayedRoleRegistryMutation() public {
        bytes memory callData = abi.encodeWithSelector(
            IStreamRoleRegistry.grantRole.selector, StreamRoles.ROLE_TREASURY, stranger
        );
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = _roleGrantGovernanceCall(StreamRoles.ROLE_TREASURY, stranger, callData);
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );

        vm.warp(notBefore);
        executor.executeGovernanceBatch(actionId, calls, callDatas);
        roleRegistry.hasRole(StreamRoles.ROLE_TREASURY, stranger)
            .assertTrue("root delayed role mutation executed");
    }

    function testGovernanceRootCanEnableThenImmediatelyDisableRoleManager() public {
        bytes memory enableData =
            abi.encodeCall(IStreamRoleRegistry.registerRoleManager, (stranger, true));
        GovernanceCall[] memory enableCalls = new GovernanceCall[](1);
        enableCalls[0] = _roleManagerGovernanceCall(stranger, true, enableData);
        bytes[] memory enableCallDatas = new bytes[](1);
        enableCallDatas[0] = enableData;
        (uint64 enableNotBefore, uint64 enableExpiresAfter) = _defaultWindow();
        bytes32 enableActionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            enableCalls,
            enableCallDatas,
            enableNotBefore,
            enableExpiresAfter
        );
        vm.warp(enableNotBefore);
        executor.executeGovernanceBatch(enableActionId, enableCalls, enableCallDatas);
        roleRegistry.isRoleManager(stranger).assertTrue("manager enabled");

        bytes memory disableData =
            abi.encodeCall(IStreamRoleRegistry.registerRoleManager, (stranger, false));
        GovernanceCall[] memory disableCalls = new GovernanceCall[](1);
        disableCalls[0] = _roleManagerGovernanceCall(stranger, false, disableData);
        bytes[] memory disableCallDatas = new bytes[](1);
        disableCallDatas[0] = disableData;
        uint64 disableNotBefore = uint64(block.timestamp);
        bytes32 disableActionId = _schedule(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            disableCalls,
            disableCallDatas,
            disableNotBefore,
            disableNotBefore + 7 days
        );
        executor.executeGovernanceBatch(disableActionId, disableCalls, disableCallDatas);
        roleRegistry.isRoleManager(stranger).assertFalse("manager immediately disabled");
    }

    function testRoleManagerDisableRejectsRoleRegistryCodehashDriftAtSchedule() public {
        bytes memory callData =
            abi.encodeCall(IStreamRoleRegistry.registerRoleManager, (stranger, false));
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = _governanceCall(
            address(roleRegistry), callData, keccak256("manager-disable-schedule-drift")
        );
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        bytes32 expectedCodeHash = address(roleRegistry).codehash;
        vm.etch(address(roleRegistry), hex"60006000f3");
        bytes32 actualCodeHash = address(roleRegistry).codehash;
        executor.publishGovernanceCallData(callDatas);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.RoleRegistryCodeHashMismatch.selector,
                expectedCodeHash,
                actualCodeHash
            )
        );
        _schedulePublishedAs(
            address(this),
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            calls,
            uint64(block.timestamp),
            uint64(block.timestamp + 7 days)
        );
    }

    function testRoleManagerDisableRejectsRoleRegistryCodehashDriftAtExecute() public {
        bytes memory callData =
            abi.encodeCall(IStreamRoleRegistry.registerRoleManager, (stranger, false));
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = _governanceCall(
            address(roleRegistry), callData, keccak256("manager-disable-execute-drift")
        );
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            calls,
            callDatas,
            uint64(block.timestamp),
            uint64(block.timestamp + 7 days)
        );
        bytes32 expectedCodeHash = address(roleRegistry).codehash;
        vm.etch(address(roleRegistry), hex"60006000f3");
        bytes32 actualCodeHash = address(roleRegistry).codehash;

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.RoleRegistryCodeHashMismatch.selector,
                expectedCodeHash,
                actualCodeHash
            )
        );
        executor.executeGovernanceBatch(actionId, calls, callDatas);
    }

    function testOrdinaryRoleMutationRejectsRoleRegistryCodehashDriftAtSchedule() public {
        bytes memory callData = abi.encodeWithSelector(
            IStreamRoleRegistry.grantRole.selector, StreamRoles.ROLE_TREASURY, stranger
        );
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = _governanceCall(
            address(roleRegistry), callData, keccak256("role-mutation-schedule-drift")
        );
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 expectedCodeHash = address(roleRegistry).codehash;
        vm.etch(address(roleRegistry), hex"60006000f3");
        bytes32 actualCodeHash = address(roleRegistry).codehash;
        executor.publishGovernanceCallData(callDatas);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.RoleRegistryCodeHashMismatch.selector,
                expectedCodeHash,
                actualCodeHash
            )
        );
        _schedulePublishedAs(
            address(this),
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            notBefore,
            expiresAfter
        );
    }

    function testOrdinaryRoleMutationRejectsRoleRegistryCodehashDriftAtExecute() public {
        bytes memory callData = abi.encodeWithSelector(
            IStreamRoleRegistry.grantRole.selector, StreamRoles.ROLE_TREASURY, stranger
        );
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = _governanceCall(
            address(roleRegistry), callData, keccak256("role-mutation-execute-drift")
        );
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );
        bytes32 expectedCodeHash = address(roleRegistry).codehash;
        vm.etch(address(roleRegistry), hex"60006000f3");
        bytes32 actualCodeHash = address(roleRegistry).codehash;
        vm.warp(notBefore);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.RoleRegistryCodeHashMismatch.selector,
                expectedCodeHash,
                actualCodeHash
            )
        );
        executor.executeGovernanceBatch(actionId, calls, callDatas);
    }

    function testRoleRegistryRejectsEveryNonDelayedExecutorActionClass() public {
        bytes[] memory registryMutations = new bytes[](5);
        registryMutations[0] = abi.encodeWithSelector(
            IStreamRoleRegistry.grantRole.selector, StreamRoles.ROLE_TREASURY, stranger
        );
        registryMutations[1] = abi.encodeWithSelector(
            IStreamRoleRegistry.revokeRole.selector, StreamRoles.ROLE_TREASURY, stranger
        );
        registryMutations[2] = abi.encodeWithSelector(
            IStreamRoleRegistry.grantScopedRole.selector,
            StreamRoles.ROLE_TERMINAL_FREEZE_VETO,
            SCOPE,
            stranger
        );
        registryMutations[3] = abi.encodeWithSelector(
            IStreamRoleRegistry.revokeScopedRole.selector,
            StreamRoles.ROLE_TERMINAL_FREEZE_VETO,
            SCOPE,
            stranger
        );
        registryMutations[4] =
            abi.encodeCall(IStreamRoleRegistry.registerRoleManager, (stranger, true));
        uint8[2] memory rejectedClasses = [
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            StreamGovernanceActionClasses.TERMINAL_FREEZE
        ];
        for (uint256 mutationIndex = 0; mutationIndex < registryMutations.length; mutationIndex++) {
            GovernanceCall[] memory calls = new GovernanceCall[](1);
            calls[0] = _governanceCall(
                address(roleRegistry), registryMutations[mutationIndex], bytes32(mutationIndex + 1)
            );
            bytes[] memory callDatas = new bytes[](1);
            callDatas[0] = registryMutations[mutationIndex];
            for (uint256 classIndex = 0; classIndex < rejectedClasses.length; classIndex++) {
                uint8 actionClass = rejectedClasses[classIndex];
                uint64 notBefore = uint64(block.timestamp) + executor.minimumDelay(actionClass);
                executor.publishGovernanceCallData(callDatas);
                if (mutationIndex == 4) {
                    vm.expectRevert(
                        abi.encodeWithSelector(
                            IStreamGovernanceExecutor.RoleManagerConfigActionClassMismatch.selector,
                            address(roleRegistry),
                            stranger,
                            true,
                            StreamGovernanceActionClasses.DELAYED_LOOSENING,
                            actionClass
                        )
                    );
                } else if (actionClass == StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING) {
                    vm.expectRevert(
                        abi.encodeWithSelector(
                            IStreamGovernanceExecutor.NotClassifiedTightening.selector,
                            address(roleRegistry),
                            calls[0].selector
                        )
                    );
                } else {
                    vm.expectRevert(
                        abi.encodeWithSelector(
                            IStreamGovernanceExecutor.RoleRegistryDelayedActionRequired.selector,
                            actionClass
                        )
                    );
                }
                _schedulePublishedAs(
                    address(this), actionClass, calls, notBefore, notBefore + 7 days
                );
            }
        }
    }

    function testRootRotationInvalidatesAlreadyScheduledControlPlaneAction() public {
        bytes memory roleCallData = abi.encodeWithSelector(
            IStreamRoleRegistry.grantRole.selector, StreamRoles.ROLE_TREASURY, stranger
        );
        GovernanceCall[] memory roleCalls = new GovernanceCall[](1);
        roleCalls[0] = _governanceCall(
            address(roleRegistry), roleCallData, keccak256("stale-root-role-action")
        );
        bytes[] memory roleCallDatas = new bytes[](1);
        roleCallDatas[0] = roleCallData;
        (uint64 roleNotBefore, uint64 roleExpiresAfter) = _defaultWindow();
        bytes32 staleActionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            roleCalls,
            roleCallDatas,
            roleNotBefore,
            roleExpiresAfter
        );

        StreamGovernanceRootMock newRoot = new StreamGovernanceRootMock();
        (address oldRoot, bytes32 oldCodeHash, uint64 oldRevision) = executor.governanceRootState();
        bytes32 rootScopeHash = keccak256(
            abi.encode(GOVERNANCE_ROOT_SCOPE_V1, uint256(block.chainid), address(executor))
        );
        bytes32 oldRootStateHash = keccak256(
            abi.encode(
                GOVERNANCE_ROOT_STATE_V1,
                uint256(block.chainid),
                address(executor),
                oldRoot,
                oldCodeHash,
                oldRevision
            )
        );
        bytes32 newRootStateHash = keccak256(
            abi.encode(
                GOVERNANCE_ROOT_STATE_V1,
                uint256(block.chainid),
                address(executor),
                address(newRoot),
                address(newRoot).codehash,
                oldRevision + 1
            )
        );
        _executeConfigCall(
            StreamGovernanceActionClasses.POINTER_REPLACEMENT,
            abi.encodeCall(
                StreamGovernanceExecutor.rotateGovernanceRoot,
                (address(newRoot), address(newRoot).codehash)
            ),
            rootScopeHash,
            oldRootStateHash,
            newRootStateHash
        );

        vm.warp(roleNotBefore);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceRootProposerRequired.selector,
                address(this),
                address(newRoot),
                address(roleRegistry),
                IStreamRoleRegistry.grantRole.selector
            )
        );
        executor.executeGovernanceBatch(staleActionId, roleCalls, roleCallDatas);
        roleRegistry.hasRole(StreamRoles.ROLE_TREASURY, stranger)
            .assertFalse("stale root action did not mutate roles");
    }

    function testRootAddressABACannotReviveStaleControlPlaneAction() public {
        (,, uint64 initialRootRevision) = executor.governanceRootState();
        bytes memory roleCallData = abi.encodeWithSelector(
            IStreamRoleRegistry.grantRole.selector, StreamRoles.ROLE_TREASURY, stranger
        );
        GovernanceCall[] memory staleCalls = new GovernanceCall[](1);
        staleCalls[0] = _governanceCall(
            address(roleRegistry), roleCallData, keccak256("root-aba-stale-action")
        );
        bytes[] memory staleCallDatas = new bytes[](1);
        staleCallDatas[0] = roleCallData;
        (uint64 staleNotBefore, uint64 staleExpiresAfter) = _defaultWindow();
        bytes32 staleActionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            staleCalls,
            staleCallDatas,
            staleNotBefore,
            staleExpiresAfter
        );

        StreamGovernanceRootMock intermediateRoot = new StreamGovernanceRootMock();
        (
            bytes32 toIntermediate,
            GovernanceCall[] memory firstRotationCalls,
            bytes[] memory firstRotationCallDatas,
            uint64 firstRotationNotBefore,
            uint64 firstRotationPriorRevision
        ) = _scheduleRootRotationAs(address(this), address(intermediateRoot));
        uint256(firstRotationPriorRevision)
            .assertEq(uint256(initialRootRevision), "first rotation root revision");
        vm.warp(firstRotationNotBefore);
        executor.executeGovernanceBatch(toIntermediate, firstRotationCalls, firstRotationCallDatas);

        (
            bytes32 backToOriginal,
            GovernanceCall[] memory secondRotationCalls,
            bytes[] memory secondRotationCallDatas,
            uint64 secondRotationNotBefore,
            uint64 intermediateRevision
        ) = _scheduleRootRotationAs(address(intermediateRoot), address(this));
        uint256(intermediateRevision)
            .assertEq(uint256(initialRootRevision) + 1, "intermediate root revision");
        vm.warp(secondRotationNotBefore);
        executor.executeGovernanceBatch(
            backToOriginal, secondRotationCalls, secondRotationCallDatas
        );

        executor.owner().assertEq(address(this), "root address returned after ABA");
        (,, uint64 actualRootRevision) = executor.governanceRootState();
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceRootRevisionMismatch.selector,
                staleActionId,
                initialRootRevision,
                actualRootRevision
            )
        );
        executor.executeGovernanceBatch(staleActionId, staleCalls, staleCallDatas);
        roleRegistry.hasRole(StreamRoles.ROLE_TREASURY, stranger)
            .assertFalse("ABA did not revive stale root action");
        executor.cancelGovernanceAction(staleActionId, keccak256("ABA regression cleanup"));
    }

    function testRoleRegistryCannotEnterFastFreezeOrTailPolicyLanes() public {
        bytes4 roleSelector = IStreamRoleRegistry.grantRole.selector;
        uint256 initialTailCount = executor.systemManifestTailTriggerCount();

        bytes memory tighteningCallData = abi.encodeCall(
            StreamGovernanceExecutor.setTighteningCall, (address(roleRegistry), roleSelector, true)
        );
        (
            bytes32 tighteningActionId,
            GovernanceCall[] memory tighteningCalls,
            bytes[] memory tighteningCallDatas,
            uint64 tighteningNotBefore
        ) = _scheduleConfigCall(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            tighteningCallData,
            SCOPE,
            OLD_VALUE,
            NEW_VALUE
        );
        vm.warp(tighteningNotBefore);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.NotClassifiedTightening.selector,
                address(roleRegistry),
                roleSelector
            )
        );
        executor.executeGovernanceBatch(tighteningActionId, tighteningCalls, tighteningCallDatas);
        executor.cancelGovernanceAction(tighteningActionId, keccak256("tightening cleanup"));

        bytes memory freezeCallData = abi.encodeCall(
            StreamGovernanceExecutor.registerFreezeSelector,
            (address(roleRegistry), roleSelector, true)
        );
        (
            bytes32 freezeActionId,
            GovernanceCall[] memory freezeCalls,
            bytes[] memory freezeCallDatas,
            uint64 freezeNotBefore
        ) = _scheduleConfigCall(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            freezeCallData,
            SCOPE,
            OLD_VALUE,
            NEW_VALUE
        );
        vm.warp(freezeNotBefore);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidManifestTailTrigger.selector,
                address(roleRegistry),
                roleSelector
            )
        );
        executor.executeGovernanceBatch(freezeActionId, freezeCalls, freezeCallDatas);
        executor.cancelGovernanceAction(freezeActionId, keccak256("freeze cleanup"));

        bytes memory tailCallData = abi.encodeCall(
            StreamGovernanceExecutor.registerSystemManifestTailTrigger,
            (address(roleRegistry), roleSelector, uint8(0x02))
        );
        (
            bytes32 tailActionId,
            GovernanceCall[] memory tailCalls,
            bytes[] memory tailCallDatas,
            uint64 tailNotBefore
        ) = _scheduleConfigCall(
            StreamGovernanceActionClasses.TERMINAL_FREEZE, tailCallData, SCOPE, OLD_VALUE, NEW_VALUE
        );
        vm.warp(tailNotBefore);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidManifestTailTrigger.selector,
                address(roleRegistry),
                roleSelector
            )
        );
        executor.executeGovernanceBatch(tailActionId, tailCalls, tailCallDatas);
        executor.cancelGovernanceAction(tailActionId, keccak256("tail cleanup"));

        executor.isTighteningCall(address(roleRegistry), roleSelector)
            .assertFalse("no tightening admission");
        executor.isFreezeSelector(address(roleRegistry), roleSelector)
            .assertFalse("no freeze admission");
        executor.systemManifestTailTriggerCount().assertEq(initialTailCount, "no tail admission");
    }

    function testScheduleStoresActionAndPublishesCallData() public {
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (42));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        uint256 nonceBefore = executor.governanceNonce();

        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );

        actionId.assertEq(
            _expectedActionId(
                StreamGovernanceActionClasses.DELAYED_LOOSENING,
                calls,
                nonceBefore,
                notBefore,
                expiresAfter
            ),
            "canonical action id preimage"
        );
        executor.governanceNonce().assertEq(nonceBefore + 1, "nonce consumed");

        GovernanceAction memory action = executor.governanceAction(actionId);
        (uint256(uint8(action.status)))
        .assertEq(uint256(uint8(GovernanceActionStatus.SCHEDULED)), "status scheduled");
        action.target.assertEq(address(target), "stored first-call target");
        action.value.assertEq(0, "stored batch value");
        bytes32(action.selector)
            .assertEq(bytes32(GovernedTargetMock.setValue.selector), "stored first-call selector");
        action.callHash
            .assertEq(keccak256(abi.encode(GOVERNANCE_CALLS_V2, calls)), "stored callsHash");
        (bytes32 derivedScope, bytes32 derivedOld, bytes32 derivedNew) = _derivedBatchHashes(calls);
        action.scopeHash.assertEq(derivedScope, "stored scope");
        action.oldValueHash.assertEq(derivedOld, "stored old value hash");
        action.newValueHash.assertEq(derivedNew, "stored new value hash");
        uint256(action.notBefore).assertEq(uint256(notBefore), "stored notBefore");
        uint256(action.expiresAfter).assertEq(uint256(expiresAfter), "stored expiresAfter");
        action.proposer.assertEq(address(this), "stored proposer");
        action.reasonHash.assertEq(REASON, "stored reason hash");
        action.reasonURI.assertEq(REASON_URI, "stored reason URI");
        action.manifestHash.assertEq(MANIFEST, "stored manifest hash");

        // [GOV-BATCH] rule 5: the exact preimages are readable from state.
        address pointer = executor.scheduledCallDataPointer(actionId);
        (pointer != address(0)).assertTrue("calldata pointer stored");
        bytes[] memory readBack = executor.scheduledCallData(actionId);
        readBack.length.assertEq(1, "one preimage");
        keccak256(readBack[0]).assertEq(keccak256(callData), "preimage bytes readable");
    }

    function testScheduleEmitsCanonicalEventBytes() public {
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (7));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        uint256 nonceBefore = executor.governanceNonce();

        vm.recordLogs();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );
        Vm.Log[] memory logs = vm.getRecordedLogs();

        Vm.Log memory scheduled = logs[logs.length - 1];
        scheduled.emitter.assertEq(address(executor), "scheduled event emitter");
        scheduled.topics.length.assertEq(4, "scheduled topic count");
        scheduled.topics[0].assertEq(GOVERNANCE_ACTION_SCHEDULED_TOPIC, "scheduled topic0");
        scheduled.topics[1].assertEq(actionId, "scheduled topic1 actionId");
        scheduled.topics[2].assertEq(
            bytes32(uint256(StreamGovernanceActionClasses.DELAYED_LOOSENING)),
            "scheduled topic2 class"
        );
        scheduled.topics[3].assertEq(
            bytes32(uint256(uint160(address(target)))), "scheduled topic3 target"
        );
        _assertScheduledEventData(scheduled.data, calls, nonceBefore, notBefore, expiresAfter);
    }

    function _assertScheduledEventData(
        bytes memory data,
        GovernanceCall[] memory calls,
        uint256 nonce,
        uint64 notBefore,
        uint64 expiresAfter
    ) private view {
        _word(data, 0).assertEq(bytes32(uint256(1)), "data schemaVersion");
        _word(data, 1).assertEq(bytes32(uint256(0)), "data value");
        _word(data, 2).assertEq(bytes32(calls[0].selector), "data selector");
        _word(data, 3).assertEq(keccak256(abi.encode(GOVERNANCE_CALLS_V2, calls)), "data callHash");
        (bytes32 derivedScope, bytes32 derivedOld, bytes32 derivedNew) = _derivedBatchHashes(calls);
        _word(data, 4).assertEq(derivedScope, "data scopeHash");
        _word(data, 5).assertEq(derivedOld, "data oldValueHash");
        _word(data, 6).assertEq(derivedNew, "data newValueHash");
        _word(data, 7).assertEq(bytes32(uint256(notBefore)), "data notBefore");
        _word(data, 8).assertEq(bytes32(uint256(expiresAfter)), "data expiresAfter");
        _word(data, 9).assertEq(bytes32(nonce), "data nonce");
        _word(data, 10).assertEq(bytes32(uint256(uint160(address(this)))), "data proposer");
        _word(data, 11).assertEq(REASON, "data reasonHash");
        _word(data, 12).assertEq(bytes32(uint256(0x1C0)), "data string offset");
        _word(data, 13).assertEq(MANIFEST, "data manifestHash");
        _word(data, 14).assertEq(bytes32(bytes(REASON_URI).length), "data string length");
        uint256 padded = (bytes(REASON_URI).length + 31) & ~uint256(31);
        data.length.assertEq(15 * 32 + padded, "data total length");
        bytes memory uriBytes = new bytes(bytes(REASON_URI).length);
        for (uint256 i = 0; i < uriBytes.length; i++) {
            uriBytes[i] = data[15 * 32 + i];
        }
        keccak256(uriBytes).assertEq(keccak256(bytes(REASON_URI)), "data string bytes");
    }

    function _word(bytes memory data, uint256 index) private pure returns (bytes32 word) {
        assembly ("memory-safe") {
            word := mload(add(add(data, 0x20), mul(index, 0x20)))
        }
    }

    function _assertTerminalMembershipLog(
        Vm.Log memory log,
        bytes32 scopeHash,
        bytes32 actionId,
        address actionProposer,
        bool present,
        uint8 mutationCause,
        bool usesRootCapacity,
        uint64 vetoDeadline,
        uint256 rawIndex,
        uint256 remainingCount
    ) private view {
        log.emitter.assertEq(address(executor), "membership event emitter");
        log.topics.length.assertEq(4, "membership event topic count");
        log.topics[0].assertEq(
            TERMINAL_FREEZE_ACTION_MEMBERSHIP_UPDATED_TOPIC, "membership event topic0"
        );
        log.topics[1].assertEq(scopeHash, "membership event scope");
        log.topics[2].assertEq(actionId, "membership event action");
        log.topics[3].assertEq(
            bytes32(uint256(uint160(actionProposer))), "membership event proposer"
        );
        log.data.length.assertEq(7 * 32, "membership event data length");
        _word(log.data, 0).assertEq(bytes32(uint256(1)), "membership event schema");
        _word(log.data, 1).assertEq(bytes32(uint256(present ? 1 : 0)), "membership event presence");
        _word(log.data, 2).assertEq(bytes32(uint256(mutationCause)), "membership event cause");
        _word(log.data, 3)
            .assertEq(bytes32(uint256(usesRootCapacity ? 1 : 0)), "membership event root capacity");
        _word(log.data, 4).assertEq(bytes32(uint256(vetoDeadline)), "membership event deadline");
        _word(log.data, 5).assertEq(bytes32(rawIndex), "membership event raw index");
        _word(log.data, 6).assertEq(bytes32(remainingCount), "membership event post-count");
    }

    function testScheduleRequiresPublishedCallData() public {
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (1));
        (GovernanceCall[] memory calls,) = _singleCall(0, callData);
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 expectedKey = keccak256(abi.encodePacked(keccak256(callData)));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.CallDataNotPublished.selector, expectedKey
            )
        );
        executor.scheduleGovernanceBatch(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            SCOPE,
            OLD_VALUE,
            NEW_VALUE,
            notBefore,
            expiresAfter,
            REASON,
            REASON_URI,
            MANIFEST
        );
    }

    function testPublishCallDataIsIdempotentAndContentAddressed() public {
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = abi.encodeCall(GovernedTargetMock.setValue, (9));
        address pointer = executor.publishGovernanceCallData(callDatas);
        (pointer != address(0)).assertTrue("pointer minted");
        executor.publishGovernanceCallData(callDatas).assertEq(pointer, "idempotent republish");
        bytes32 key = keccak256(abi.encodePacked(keccak256(callDatas[0])));
        executor.publishedCallData(key).assertEq(pointer, "content-addressed lookup");

        bytes[] memory empty = new bytes[](0);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.EmptyGovernanceBatch.selector)
        );
        executor.publishGovernanceCallData(empty);
    }

    function testScheduleUnauthorizedReverts() public {
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (1));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        executor.publishGovernanceCallData(callDatas);
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceActorNotAuthorized.selector, stranger
            )
        );
        vm.prank(stranger);
        executor.scheduleGovernanceBatch(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            SCOPE,
            OLD_VALUE,
            NEW_VALUE,
            notBefore,
            expiresAfter,
            REASON,
            REASON_URI,
            MANIFEST
        );
    }

    function testRegisteredProposerCanSchedule() public {
        _setProposer(proposer, true);
        executor.isProposer(proposer).assertTrue("proposer registered");
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (1));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        executor.publishGovernanceCallData(callDatas);
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) = _derivedBatchHashes(calls);
        vm.prank(proposer);
        bytes32 actionId = executor.scheduleGovernanceBatch(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            scopeHash,
            oldValueHash,
            newValueHash,
            notBefore,
            expiresAfter,
            REASON,
            REASON_URI,
            MANIFEST
        );
        executor.governanceAction(actionId).proposer.assertEq(proposer, "proposer recorded");
    }

    function testScheduleWindowFloors() public {
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (1));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        executor.publishGovernanceCallData(callDatas);

        // Delay below the 48h DELAYED floor.
        _expectDelayRevert(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            uint64(block.timestamp) + 48 hours - 1,
            uint64(block.timestamp) + 48 hours - 1 + 7 days
        );
        // Terminal freeze below the 72h veto floor ([GOV-WINDOWS] rule 2).
        _expectDelayRevert(
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            uint64(block.timestamp) + 72 hours - 1,
            uint64(block.timestamp) + 72 hours - 1 + 7 days
        );
        // Funds recovery below its 14-day launch floor.
        _expectDelayRevert(
            StreamGovernanceActionClasses.FUNDS_RECOVERY,
            calls,
            uint64(block.timestamp) + 14 days - 1,
            uint64(block.timestamp) + 14 days - 1 + 7 days
        );
        // Successor declaration below its 30-day launch floor.
        _expectDelayRevert(
            StreamGovernanceActionClasses.SUCCESSOR_DECLARATION,
            calls,
            uint64(block.timestamp) + 30 days - 1,
            uint64(block.timestamp) + 30 days - 1 + 7 days
        );

        // Open-to-execute window below the 7-day floor ([GOV-WINDOWS] rule 1).
        uint64 notBefore = uint64(block.timestamp) + 48 hours;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.OpenWindowBelowFloor.selector,
                notBefore,
                notBefore + 7 days - 1
            )
        );
        _scheduleWindow(calls, notBefore, notBefore + 7 days - 1);

        // expiresAfter must exceed notBefore.
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidActionWindow.selector, notBefore, notBefore
            )
        );
        _scheduleWindow(calls, notBefore, notBefore);

        // Maximum action lifetime bound.
        uint64 tooLate = uint64(block.timestamp) + 365 days + 1;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidActionWindow.selector, notBefore, tooLate
            )
        );
        _scheduleWindow(calls, notBefore, tooLate);

        // Retired class 6 and every unknown successor are forbidden.
        for (uint8 actionClass = 6; actionClass <= 7; actionClass++) {
            vm.expectRevert(
                abi.encodeWithSelector(
                    IStreamGovernanceExecutor.UnknownActionClass.selector, actionClass
                )
            );
            _scheduleClass(actionClass, calls, notBefore, notBefore + 7 days);
        }
    }

    function testExecutionBoundaryRejectsCorruptedRetiredClassSixRecord() public {
        bytes memory callData = abi.encodeCall(target.setValue, (77));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );

        // `_actions` is the first derived-contract mapping after Ownable and
        // ReentrancyGuard (slot 2); status/class share the first value word.
        bytes32 actionSlot = keccak256(abi.encode(actionId, uint256(2)));
        uint256 actionHeader = uint256(vm.load(address(executor), actionSlot));
        actionHeader = (actionHeader & ~(uint256(0xff) << 8)) | (uint256(6) << 8);
        vm.store(address(executor), actionSlot, bytes32(actionHeader));

        vm.warp(notBefore);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.UnknownActionClass.selector, uint8(6))
        );
        executor.executeGovernanceBatch(actionId, calls, callDatas);
        target.value().assertEq(0, "retired class reached target");
    }

    function _expectDelayRevert(
        uint8 actionClass,
        GovernanceCall[] memory calls,
        uint64 notBefore,
        uint64 expiresAfter
    ) private {
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.DelayBelowClassMinimum.selector,
                actionClass,
                notBefore,
                uint64(block.timestamp) + executor.minimumDelay(actionClass)
            )
        );
        _scheduleClass(actionClass, calls, notBefore, expiresAfter);
    }

    function _scheduleWindow(GovernanceCall[] memory calls, uint64 notBefore, uint64 expiresAfter)
        private
        returns (bytes32)
    {
        return _scheduleClass(
            StreamGovernanceActionClasses.DELAYED_LOOSENING, calls, notBefore, expiresAfter
        );
    }

    function _scheduleClass(
        uint8 actionClass,
        GovernanceCall[] memory calls,
        uint64 notBefore,
        uint64 expiresAfter
    ) private returns (bytes32) {
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) = _derivedBatchHashes(calls);
        return executor.scheduleGovernanceBatch(
            actionClass,
            calls,
            scopeHash,
            oldValueHash,
            newValueHash,
            notBefore,
            expiresAfter,
            REASON,
            REASON_URI,
            MANIFEST
        );
    }

    function testScheduleValidatesCallShape() public {
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();

        // Zero target.
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (1));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        calls[0].target = address(0);
        executor.publishGovernanceCallData(callDatas);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.ZeroGovernanceTarget.selector, 0)
        );
        _scheduleWindow(calls, notBefore, expiresAfter);

        // 1-3 byte calldata cannot carry a selector.
        bytes memory shortData = hex"beef";
        (calls, callDatas) = _singleCall(0, shortData);
        executor.publishGovernanceCallData(callDatas);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.CallDataTooShort.selector, 0)
        );
        _scheduleWindow(calls, notBefore, expiresAfter);

        // Leading selector mismatch.
        (calls, callDatas) = _singleCall(0, callData);
        calls[0].selector = GovernedTargetMock.setShouldRevert.selector;
        executor.publishGovernanceCallData(callDatas);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.CallSelectorMismatch.selector, 0)
        );
        _scheduleWindow(calls, notBefore, expiresAfter);

        // Empty calldata with a nonzero selector.
        (calls, callDatas) = _singleCall(0, "");
        calls[0].selector = GovernedTargetMock.setValue.selector;
        executor.publishGovernanceCallData(callDatas);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.CallSelectorMismatch.selector, 0)
        );
        _scheduleWindow(calls, notBefore, expiresAfter);
    }

    function testImmediateTighteningRequiresClassifier() public {
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (5));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        executor.publishGovernanceCallData(callDatas);
        uint64 notBefore = uint64(block.timestamp);
        uint64 expiresAfter = notBefore + 1 days;

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.NotClassifiedTightening.selector,
                address(target),
                GovernedTargetMock.setValue.selector
            )
        );
        _scheduleClass(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING, calls, notBefore, expiresAfter
        );

        // Register the tightening classifier entry and execute with no delay.
        bytes32 classifierActionId =
            _setTighteningCall(address(target), GovernedTargetMock.setValue.selector, true);
        executor.isTighteningCall(address(target), GovernedTargetMock.setValue.selector)
            .assertTrue("classifier entry");
        notBefore = executor.governanceAction(classifierActionId).notBefore;
        expiresAfter = notBefore + 7 days;
        bytes32 actionId = _scheduleClass(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING, calls, notBefore, expiresAfter
        );
        executor.executeGovernanceBatch(actionId, calls, callDatas);
        target.value().assertEq(5, "immediate tightening executed with zero delay");
    }

    // -------------------------------------------------------------- execution

    function testExecuteLifecycle() public {
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (42));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );

        // Negative gate: early execution reverts.
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceActionNotExecutable.selector,
                actionId,
                notBefore
            )
        );
        executor.executeGovernanceBatch(actionId, calls, callDatas);

        vm.warp(notBefore);
        (bytes32 aggregateScope, bytes32 aggregateOld, bytes32 aggregateNew) =
            _derivedBatchHashes(calls);
        vm.expectEmit(true, true, true, true);
        emit GovernanceActionExecuted(
            1,
            actionId,
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            address(target),
            0,
            GovernedTargetMock.setValue.selector,
            keccak256(abi.encode(GOVERNANCE_CALLS_V2, calls)),
            aggregateScope,
            aggregateOld,
            aggregateNew,
            address(this),
            MANIFEST
        );
        executor.executeGovernanceBatch(actionId, calls, callDatas);

        target.value().assertEq(42, "target mutated");
        target.lastSender().assertEq(address(executor), "call arrived from executor");
        GovernanceAction memory action = executor.governanceAction(actionId);
        uint256(uint8(action.status))
            .assertEq(uint256(uint8(GovernanceActionStatus.EXECUTED)), "status executed");
        action.executor.assertEq(address(this), "executor recorded");

        // Executed actions cannot replay.
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceActionNotScheduled.selector, actionId
            )
        );
        executor.executeGovernanceBatch(actionId, calls, callDatas);
    }

    function testExecuteUnknownActionReverts() public {
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, "");
        calls[0].selector = bytes4(0);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceActionUnknown.selector, keccak256("nope")
            )
        );
        executor.executeGovernanceBatch(keccak256("nope"), calls, callDatas);
    }

    function testExecuteVerifiesCallIntegrity() public {
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (42));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );
        vm.warp(notBefore);

        // Tampered call target changes the calls hash.
        GovernanceCall[] memory tamperedCalls = new GovernanceCall[](1);
        tamperedCalls[0] = GovernanceCall({
            target: address(0xBAD),
            value: calls[0].value,
            selector: calls[0].selector,
            callDataHash: calls[0].callDataHash,
            scopeHash: calls[0].scopeHash,
            oldValueHash: calls[0].oldValueHash,
            newValueHash: calls[0].newValueHash
        });
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.CallsHashMismatch.selector, actionId)
        );
        executor.executeGovernanceBatch(actionId, tamperedCalls, callDatas);

        // Supplied calldata must be byte-identical to the scheduled publication.
        bytes[] memory tamperedDatas = new bytes[](1);
        tamperedDatas[0] = abi.encodeCall(GovernedTargetMock.setValue, (43));
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.ScheduledCallDataMismatch.selector, 0)
        );
        executor.executeGovernanceBatch(actionId, calls, tamperedDatas);

        // Wrong calldata count.
        bytes[] memory wrongCount = new bytes[](2);
        wrongCount[0] = callData;
        wrongCount[1] = callData;
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.CallDataCountMismatch.selector, 1, 2)
        );
        executor.executeGovernanceBatch(actionId, calls, wrongCount);
    }

    function testExecuteRejectsReorderedAndMutatedDescriptorsBeforeAnyTargetCall() public {
        GovernedTargetMock second = new GovernedTargetMock();
        bytes[] memory callDatas = new bytes[](2);
        callDatas[0] = abi.encodeCall(GovernedTargetMock.setValue, (11));
        callDatas[1] = abi.encodeCall(GovernedTargetMock.setValue, (22));
        GovernanceCall[] memory calls = new GovernanceCall[](2);
        calls[0] = GovernanceCall({
            target: address(target),
            value: 0,
            selector: GovernedTargetMock.setValue.selector,
            callDataHash: keccak256(callDatas[0]),
            scopeHash: keccak256("integrity-scope-0"),
            oldValueHash: keccak256("integrity-old-0"),
            newValueHash: keccak256("integrity-new-0")
        });
        calls[1] = GovernanceCall({
            target: address(second),
            value: 0,
            selector: GovernedTargetMock.setValue.selector,
            callDataHash: keccak256(callDatas[1]),
            scopeHash: keccak256("integrity-scope-1"),
            oldValueHash: keccak256("integrity-old-1"),
            newValueHash: keccak256("integrity-new-1")
        });

        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );
        vm.warp(notBefore);

        // If validation moved behind the external-call loop, these armed
        // targets would revert with Error(string), not the exact executor
        // integrity error asserted for every malformed execution below.
        target.setShouldRevert(true);
        second.setShouldRevert(true);

        GovernanceCall[] memory mutatedCalls = new GovernanceCall[](2);
        mutatedCalls[0] = calls[1];
        mutatedCalls[1] = calls[0];
        bytes[] memory mutatedCallDatas = new bytes[](2);
        mutatedCallDatas[0] = callDatas[1];
        mutatedCallDatas[1] = callDatas[0];
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.CallsHashMismatch.selector, actionId)
        );
        executor.executeGovernanceBatch(actionId, mutatedCalls, mutatedCallDatas);

        GovernedTargetMock third = new GovernedTargetMock();
        mutatedCalls = _cloneCalls(calls);
        mutatedCalls[1].target = address(third);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.CallsHashMismatch.selector, actionId)
        );
        executor.executeGovernanceBatch(actionId, mutatedCalls, callDatas);

        mutatedCalls = _cloneCalls(calls);
        mutatedCalls[1].value = 1;
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.CallsHashMismatch.selector, actionId)
        );
        executor.executeGovernanceBatch(actionId, mutatedCalls, callDatas);

        mutatedCalls = _cloneCalls(calls);
        mutatedCalls[1].selector = GovernedTargetMock.setShouldRevert.selector;
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.CallsHashMismatch.selector, actionId)
        );
        executor.executeGovernanceBatch(actionId, mutatedCalls, callDatas);

        mutatedCalls = _cloneCalls(calls);
        mutatedCalls[1].callDataHash = keccak256("forged-call-data-hash");
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.CallsHashMismatch.selector, actionId)
        );
        executor.executeGovernanceBatch(actionId, mutatedCalls, callDatas);

        mutatedCallDatas = _cloneCallDatas(callDatas);
        mutatedCallDatas[1] = abi.encodeCall(GovernedTargetMock.setValue, (23));
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.ScheduledCallDataMismatch.selector, 1)
        );
        executor.executeGovernanceBatch(actionId, calls, mutatedCallDatas);

        target.value().assertEq(0, "first target untouched by rejected executions");
        second.value().assertEq(0, "second target untouched by rejected executions");

        target.setShouldRevert(false);
        second.setShouldRevert(false);
        executor.executeGovernanceBatch(actionId, calls, callDatas);
        target.value().assertEq(11, "canonical first call executed");
        second.value().assertEq(22, "canonical second call executed");
    }

    function testBatchValueSemantics() public {
        GovernedTargetMock second = new GovernedTargetMock();
        GovernanceCall[] memory calls = new GovernanceCall[](2);
        bytes[] memory callDatas = new bytes[](2);
        callDatas[0] = abi.encodeCall(GovernedTargetMock.setValue, (1));
        callDatas[1] = abi.encodeCall(GovernedTargetMock.setValue, (2));
        calls[0] = GovernanceCall({
            target: address(target),
            value: 1 ether,
            selector: GovernedTargetMock.setValue.selector,
            callDataHash: keccak256(callDatas[0]),
            scopeHash: SCOPE,
            oldValueHash: OLD_VALUE,
            newValueHash: NEW_VALUE
        });
        calls[1] = GovernanceCall({
            target: address(second),
            value: 2 ether,
            selector: GovernedTargetMock.setValue.selector,
            callDataHash: keccak256(callDatas[1]),
            scopeHash: SCOPE,
            oldValueHash: OLD_VALUE,
            newValueHash: NEW_VALUE
        });
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );
        executor.governanceAction(actionId).value.assertEq(3 ether, "stored value sum");
        vm.warp(notBefore);

        // [GOV-BATCH] rule 2: msg.value must equal the exact batch value sum.
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.BatchValueMismatch.selector, 3 ether, 1 ether
            )
        );
        executor.executeGovernanceBatch{ value: 1 ether }(actionId, calls, callDatas);

        executor.executeGovernanceBatch{ value: 3 ether }(actionId, calls, callDatas);
        target.lastPaidValue().assertEq(1 ether, "first call exact wei");
        second.lastPaidValue().assertEq(2 ether, "second call exact wei");
        address(target).balance.assertEq(1 ether, "first target balance");
        address(second).balance.assertEq(2 ether, "second target balance");
        address(executor).balance.assertEq(0, "no value stranded in executor");
    }

    function testBatchRefundSurplusReverts() public {
        GovernedRefundingMock refunder = new GovernedRefundingMock();
        bytes memory callData = abi.encodeCall(GovernedRefundingMock.refund, ());
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = GovernanceCall({
            target: address(refunder),
            value: 1 ether,
            selector: GovernedRefundingMock.refund.selector,
            callDataHash: keccak256(callData),
            scopeHash: SCOPE,
            oldValueHash: OLD_VALUE,
            newValueHash: NEW_VALUE
        });
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );
        vm.warp(notBefore);
        // The target force-refunds its value to the executor; the surplus must
        // revert the batch rather than strand in the governance contract.
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.BatchValueSurplus.selector, 1 ether)
        );
        executor.executeGovernanceBatch{ value: 1 ether }(actionId, calls, callDatas);
    }

    function testBatchExecutionIsAtomic() public {
        GovernedTargetMock second = new GovernedTargetMock();
        second.setShouldRevert(true);
        GovernanceCall[] memory calls = new GovernanceCall[](2);
        bytes[] memory callDatas = new bytes[](2);
        callDatas[0] = abi.encodeCall(GovernedTargetMock.setValue, (11));
        callDatas[1] = abi.encodeCall(GovernedTargetMock.setValue, (22));
        calls[0] = GovernanceCall({
            target: address(target),
            value: 0,
            selector: GovernedTargetMock.setValue.selector,
            callDataHash: keccak256(callDatas[0]),
            scopeHash: SCOPE,
            oldValueHash: OLD_VALUE,
            newValueHash: NEW_VALUE
        });
        calls[1] = GovernanceCall({
            target: address(second),
            value: 0,
            selector: GovernedTargetMock.setValue.selector,
            callDataHash: keccak256(callDatas[1]),
            scopeHash: SCOPE,
            oldValueHash: OLD_VALUE,
            newValueHash: NEW_VALUE
        });
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );
        vm.warp(notBefore);

        // The second call reverts, and the inner revert reason bubbles.
        vm.expectRevert(bytes("target revert"));
        executor.executeGovernanceBatch(actionId, calls, callDatas);

        // Partial application is never observable.
        target.value().assertEq(0, "first call rolled back");
        uint256(uint8(executor.governanceAction(actionId).status))
            .assertEq(uint256(uint8(GovernanceActionStatus.SCHEDULED)), "action still scheduled");

        // The batch stays executable once the failure cause clears.
        second.setShouldRevert(false);
        executor.executeGovernanceBatch(actionId, calls, callDatas);
        target.value().assertEq(11, "first call applied");
        second.value().assertEq(22, "second call applied");
    }

    function testGovernedCallIgnoresOversizedSuccessReturndata() public {
        GovernedReturndataMock returner = new GovernedReturndataMock();
        bytes memory callData =
            abi.encodeCall(GovernedReturndataMock.succeedWithReturndata, (uint256(128 * 1024)));
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = _governanceCall(address(returner), callData, keccak256("large-success"));
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );
        vm.warp(notBefore);

        executor.executeGovernanceBatch(actionId, calls, callDatas);
        returner.called().assertTrue("large success payload call executed");
        uint256(uint8(executor.governanceAction(actionId).status))
            .assertEq(uint256(uint8(GovernanceActionStatus.EXECUTED)), "action executed");
    }

    function testOversizedGovernedRevertIsBoundedAndBatchRemainsAtomic() public {
        GovernedReturndataMock returner = new GovernedReturndataMock();
        bytes[] memory callDatas = new bytes[](2);
        callDatas[0] = abi.encodeCall(GovernedTargetMock.setValue, (77));
        callDatas[1] =
            abi.encodeCall(GovernedReturndataMock.revertWithReturndata, (uint256(128 * 1024)));
        GovernanceCall[] memory calls = new GovernanceCall[](2);
        calls[0] = _governanceCall(address(target), callDatas[0], keccak256("before-large-revert"));
        calls[1] = _governanceCall(address(returner), callDatas[1], keccak256("large-revert"));
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );
        vm.warp(notBefore);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceCallReturndataTooLarge.selector,
                actionId,
                uint256(1),
                uint256(128 * 1024),
                uint256(4_096)
            )
        );
        executor.executeGovernanceBatch(actionId, calls, callDatas);

        target.value().assertEq(0, "earlier call rolled back after oversized revert");
        uint256(uint8(executor.governanceAction(actionId).status))
            .assertEq(uint256(uint8(GovernanceActionStatus.SCHEDULED)), "action remains scheduled");
    }

    function testBatchExecutionRejectsTargetReentrancyAndRollsBack() public {
        bytes memory nestedTargetData = abi.encodeCall(GovernedTargetMock.setValue, (91));
        (GovernanceCall[] memory nestedCalls, bytes[] memory nestedCallDatas) =
            _singleCall(0, nestedTargetData);
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 nestedActionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            nestedCalls,
            nestedCallDatas,
            notBefore,
            expiresAfter
        );

        GovernedReentrantTargetMock reentrant =
            new GovernedReentrantTargetMock(IStreamGovernanceExecutor(address(executor)));
        reentrant.arm(
            abi.encodeCall(
                executor.executeGovernanceBatch, (nestedActionId, nestedCalls, nestedCallDatas)
            )
        );
        bytes memory outerCallData = abi.encodeCall(GovernedReentrantTargetMock.attack, ());
        GovernanceCall[] memory outerCalls = new GovernanceCall[](1);
        outerCalls[0] = GovernanceCall({
            target: address(reentrant),
            value: 0,
            selector: GovernedReentrantTargetMock.attack.selector,
            callDataHash: keccak256(outerCallData),
            scopeHash: keccak256("reentrancy-scope"),
            oldValueHash: keccak256("reentrancy-old"),
            newValueHash: keccak256("reentrancy-new")
        });
        bytes[] memory outerCallDatas = new bytes[](1);
        outerCallDatas[0] = outerCallData;
        bytes32 outerActionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            outerCalls,
            outerCallDatas,
            notBefore,
            expiresAfter
        );
        vm.warp(notBefore);

        vm.expectRevert(abi.encodeWithSelector(bytes4(keccak256("ReentrancyGuardReentrantCall()"))));
        executor.executeGovernanceBatch(outerActionId, outerCalls, outerCallDatas);

        reentrant.reached().assertFalse("target mutation rolled back");
        uint256(uint8(executor.governanceAction(outerActionId).status))
            .assertEq(
                uint256(uint8(GovernanceActionStatus.SCHEDULED)), "outer action remains scheduled"
            );
        uint256(uint8(executor.governanceAction(nestedActionId).status))
            .assertEq(
                uint256(uint8(GovernanceActionStatus.SCHEDULED)), "nested action remains scheduled"
            );
        target.value().assertEq(0, "nested target untouched");

        reentrant.disarm();
        executor.executeGovernanceBatch(outerActionId, outerCalls, outerCallDatas);
        reentrant.reached().assertTrue("outer action remains executable");
        executor.executeGovernanceBatch(nestedActionId, nestedCalls, nestedCallDatas);
        target.value().assertEq(91, "nested action can execute independently");
    }

    function testNativeTransferRequiresApprovedReceiver() public {
        address payable receiver = payable(address(0xE0A));
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = GovernanceCall({
            target: receiver,
            value: 1 ether,
            selector: bytes4(0),
            callDataHash: keccak256(""),
            scopeHash: SCOPE,
            oldValueHash: OLD_VALUE,
            newValueHash: NEW_VALUE
        });
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = "";
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        executor.publishGovernanceCallData(callDatas);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.NativeReceiverNotApproved.selector, receiver
            )
        );
        _scheduleClass(
            StreamGovernanceActionClasses.DELAYED_LOOSENING, calls, notBefore, expiresAfter
        );

        bytes32 receiverConfigActionId = _setNativeReceiver(receiver, true);
        executor.isApprovedNativeReceiver(receiver).assertTrue("receiver approved");
        notBefore = executor.governanceAction(receiverConfigActionId).notBefore + 48 hours;
        expiresAfter = notBefore + 7 days;
        bytes32 actionId = _scheduleClass(
            StreamGovernanceActionClasses.DELAYED_LOOSENING, calls, notBefore, expiresAfter
        );
        vm.warp(notBefore);
        executor.executeGovernanceBatch{ value: 1 ether }(actionId, calls, callDatas);
        receiver.balance.assertEq(1 ether, "native transfer delivered");
    }

    function testExecuteCodelessTargetWithCalldataReverts() public {
        address codeless = address(0xDEAD01);
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (1));
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = GovernanceCall({
            target: codeless,
            value: 0,
            selector: GovernedTargetMock.setValue.selector,
            callDataHash: keccak256(callData),
            scopeHash: SCOPE,
            oldValueHash: OLD_VALUE,
            newValueHash: NEW_VALUE
        });
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        executor.publishGovernanceCallData(callDatas);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.TargetHasNoCode.selector, 0, codeless)
        );
        _scheduleClass(
            StreamGovernanceActionClasses.DELAYED_LOOSENING, calls, notBefore, expiresAfter
        );
    }

    // ---------------------------------------------------------- cancellation

    function testCancelLifecycle() public {
        bytes32 actionId = _scheduleDefault(abi.encodeCall(GovernedTargetMock.setValue, (1)));

        // Unauthorized cancellation reverts.
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceActorNotAuthorized.selector, stranger
            )
        );
        vm.prank(stranger);
        executor.cancelGovernanceAction(actionId, keccak256("cancel-reason"));

        GovernanceAction memory before = executor.governanceAction(actionId);
        vm.expectEmit(true, true, true, true);
        emit GovernanceActionCancelled(
            1,
            actionId,
            before.actionClass,
            before.target,
            before.selector,
            before.callHash,
            before.scopeHash,
            address(this),
            keccak256("cancel-reason"),
            ""
        );
        executor.cancelGovernanceAction(actionId, keccak256("cancel-reason"));

        GovernanceAction memory action = executor.governanceAction(actionId);
        uint256(uint8(action.status))
            .assertEq(uint256(uint8(GovernanceActionStatus.CANCELLED)), "status cancelled");
        action.canceller.assertEq(address(this), "canceller recorded");

        // Cancelled actions cannot execute or re-cancel.
        (GovernanceCall[] memory calls, bytes[] memory callDatas) =
            _singleCall(0, abi.encodeCall(GovernedTargetMock.setValue, (1)));
        vm.warp(action.notBefore);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceActionNotScheduled.selector, actionId
            )
        );
        executor.executeGovernanceBatch(actionId, calls, callDatas);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceActionNotScheduled.selector, actionId
            )
        );
        executor.cancelGovernanceAction(actionId, keccak256("again"));
    }

    function testProposerAndRegisteredCancellerCanCancel() public {
        _setProposer(proposer, true);
        _setCanceller(canceller, true);
        executor.isCanceller(canceller).assertTrue("canceller registered");

        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (1));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        executor.publishGovernanceCallData(callDatas);
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();

        vm.prank(proposer);
        bytes32 first = _scheduleClass(
            StreamGovernanceActionClasses.DELAYED_LOOSENING, calls, notBefore, expiresAfter
        );
        vm.prank(proposer);
        executor.cancelGovernanceAction(first, keccak256("own action"));
        executor.governanceAction(first).canceller.assertEq(proposer, "proposer cancelled own");

        vm.prank(proposer);
        bytes32 second = _scheduleClass(
            StreamGovernanceActionClasses.DELAYED_LOOSENING, calls, notBefore, expiresAfter
        );
        vm.prank(canceller);
        executor.cancelGovernanceAction(second, keccak256("guardian cancel"));
        executor.governanceAction(second).canceller
            .assertEq(canceller, "registered canceller cancelled");
    }

    function testRegisteredCancellerCannotEntrenchItselfByCancellingRemoval() public {
        _setCanceller(canceller, true);
        (bool enabled, uint64 revision, bytes32 oldStateHash) = executor.cancellerConfig(canceller);
        enabled.assertTrue("canceller enabled before removal");
        bytes32 scopeHash = keccak256(
            abi.encode(
                GOVERNANCE_CONFIG_SCOPE_V1,
                uint256(block.chainid),
                address(executor),
                GOVERNANCE_CONFIG_CANCELLER,
                canceller
            )
        );
        bytes32 newStateHash = keccak256(
            abi.encode(
                GOVERNANCE_CONFIG_STATE_V1,
                uint256(block.chainid),
                address(executor),
                GOVERNANCE_CONFIG_CANCELLER,
                canceller,
                false,
                revision + 1
            )
        );
        (
            bytes32 removalAction,
            GovernanceCall[] memory calls,
            bytes[] memory callDatas,
            uint64 notBefore
        ) = _scheduleConfigCall(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            abi.encodeCall(StreamGovernanceExecutor.registerCanceller, (canceller, false)),
            scopeHash,
            oldStateHash,
            newStateHash
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceActorNotAuthorized.selector, canceller
            )
        );
        vm.prank(canceller);
        executor.cancelGovernanceAction(removalAction, keccak256("self-entrenchment"));

        vm.warp(notBefore);
        executor.executeGovernanceBatch(removalAction, calls, callDatas);
        executor.isCanceller(canceller).assertFalse("compromised canceller removed");
    }

    // ------------------------------------------------------------------ veto

    function testTerminalFreezeVeto() public {
        _grantGlobalVetoGuardian();
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (99));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        uint64 notBefore = uint64(block.timestamp) + 72 hours;
        uint64 expiresAfter = notBefore + 7 days;
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.TERMINAL_FREEZE, calls, callDatas, notBefore, expiresAfter
        );
        (bytes32 actionScope,,) = _derivedBatchHashes(calls);

        (address resolvedGuardian, uint64 vetoDeadline) = executor.terminalFreezeVetoGuardian(SCOPE);
        resolvedGuardian.assertEq(address(0), "redundant global set uses sentinel resolution");
        uint256(vetoDeadline).assertEq(uint256(notBefore), "veto deadline is notBefore");

        // Only the role holder may veto.
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.NotTerminalFreezeVetoGuardian.selector, stranger
            )
        );
        vm.prank(stranger);
        executor.vetoTerminalFreeze(actionId, keccak256("veto"));

        // Veto lands inside the window.
        vm.expectEmit(true, true, true, true);
        emit GovernanceActionVetoed(
            1,
            actionId,
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            guardian,
            actionScope,
            keccak256("veto")
        );
        vm.prank(guardian);
        executor.vetoTerminalFreeze(actionId, keccak256("veto"));

        GovernanceAction memory action = executor.governanceAction(actionId);
        uint256(uint8(action.status))
            .assertEq(uint256(uint8(GovernanceActionStatus.VETOED)), "status vetoed");
        action.vetoer.assertEq(guardian, "vetoer recorded");

        // Vetoed terminal freezes never execute.
        vm.warp(notBefore);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceActionNotScheduled.selector, actionId
            )
        );
        executor.executeGovernanceBatch(actionId, calls, callDatas);

        (, uint64 clearedDeadline) = executor.terminalFreezeVetoGuardian(SCOPE);
        uint256(clearedDeadline).assertEq(0, "veto deadline cleared after veto");
    }

    function testVetoAfterDeadlineReverts() public {
        _grantGlobalVetoGuardian();
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (99));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        uint64 notBefore = uint64(block.timestamp) + 72 hours;
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            callDatas,
            notBefore,
            notBefore + 7 days
        );
        vm.warp(notBefore);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.VetoDeadlinePassed.selector, actionId, notBefore
            )
        );
        vm.prank(guardian);
        executor.vetoTerminalFreeze(actionId, keccak256("late"));
    }

    function testVetoNonTerminalFreezeReverts() public {
        _grantGlobalVetoGuardian();
        bytes32 actionId = _scheduleDefault(abi.encodeCall(GovernedTargetMock.setValue, (1)));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.NotTerminalFreezeAction.selector, actionId
            )
        );
        vm.prank(guardian);
        executor.vetoTerminalFreeze(actionId, keccak256("wrong class"));
    }

    // ---------------------------------------------------------------- expiry

    function testExpiryLifecycle() public {
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (1));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );

        // Materializing before expiry reverts.
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceActionNotExpired.selector,
                actionId,
                expiresAfter
            )
        );
        executor.materializeExpiredAction(actionId);

        vm.warp(uint256(expiresAfter) + 1);

        // Virtual expiry through the read before materialization.
        uint256(uint8(executor.governanceAction(actionId).status))
            .assertEq(uint256(uint8(GovernanceActionStatus.EXPIRED)), "virtual expired status");

        // Expired actions cannot execute.
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceActionExpiredWindow.selector,
                actionId,
                expiresAfter
            )
        );
        executor.executeGovernanceBatch(actionId, calls, callDatas);

        // Anyone may materialize the expiry.
        vm.expectEmit(true, true, true, true);
        emit GovernanceActionExpired(
            1, actionId, StreamGovernanceActionClasses.DELAYED_LOOSENING, stranger
        );
        vm.prank(stranger);
        executor.materializeExpiredAction(actionId);
        uint256(uint8(executor.governanceAction(actionId).status))
            .assertEq(uint256(uint8(GovernanceActionStatus.EXPIRED)), "materialized expired status");

        // Terminal state: no re-materialize, no cancel.
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceActionNotScheduled.selector, actionId
            )
        );
        executor.materializeExpiredAction(actionId);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceActionNotScheduled.selector, actionId
            )
        );
        executor.cancelGovernanceAction(actionId, keccak256("too late"));
    }

    function testExpiredButUnmaterializedActionCannotBeCancelled() public {
        bytes32 actionId = _scheduleDefault(abi.encodeCall(GovernedTargetMock.setValue, (1)));
        GovernanceAction memory action = executor.governanceAction(actionId);
        vm.warp(uint256(action.expiresAfter) + 1);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceActionExpiredWindow.selector,
                actionId,
                action.expiresAfter
            )
        );
        executor.cancelGovernanceAction(actionId, keccak256("cancel expired"));

        uint256(uint8(executor.governanceAction(actionId).status))
            .assertEq(
                uint256(uint8(GovernanceActionStatus.EXPIRED)), "expired action stays expired"
            );
        executor.pendingScheduledActionCount().assertEq(1, "virtual expiry remains pending");

        executor.materializeExpiredAction(actionId);
        executor.pendingScheduledActionCount().assertEq(0, "materialized expiry leaves pending set");
    }

    // ------------------------------------------------- single-call wrappers

    function testSingleCallWrapperProducesByteIdenticalActionId() public {
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (77));
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        uint256 nonceBefore = executor.governanceNonce();

        GovernanceActionRequest memory request;
        request.actionClass = StreamGovernanceActionClasses.DELAYED_LOOSENING;
        request.target = address(target);
        request.value = 0;
        request.selector = GovernedTargetMock.setValue.selector;
        request.callData = callData;
        request.scopeHash = SCOPE;
        request.oldValueHash = OLD_VALUE;
        request.newValueHash = NEW_VALUE;
        request.notBefore = notBefore;
        request.expiresAfter = expiresAfter;
        request.reasonHash = REASON;
        request.reasonURI = REASON_URI;
        request.manifestHash = MANIFEST;

        bytes32 actionId = executor.scheduleGovernanceAction(request);

        // Byte-identical to the equivalent batch of one ([GOV-ACTION-ID]).
        (GovernanceCall[] memory calls,) = _singleCall(0, callData);
        actionId.assertEq(
            _expectedActionId(
                StreamGovernanceActionClasses.DELAYED_LOOSENING,
                calls,
                nonceBefore,
                notBefore,
                expiresAfter
            ),
            "wrapper action id equals batch-of-one preimage"
        );

        // The wrapper also published the preimage blob.
        bytes[] memory readBack = executor.scheduledCallData(actionId);
        keccak256(readBack[0]).assertEq(keccak256(callData), "wrapper published preimage");

        // Single-call execution wrapper completes the lifecycle.
        vm.warp(notBefore);
        executor.executeGovernanceAction(actionId, callData);
        target.value().assertEq(77, "wrapper executed");
    }

    function testSingleCallExecuteWrapperRejectsMultiCallBatch() public {
        GovernedTargetMock second = new GovernedTargetMock();
        GovernanceCall[] memory calls = new GovernanceCall[](2);
        bytes[] memory callDatas = new bytes[](2);
        callDatas[0] = abi.encodeCall(GovernedTargetMock.setValue, (1));
        callDatas[1] = abi.encodeCall(GovernedTargetMock.setValue, (2));
        calls[0] = GovernanceCall({
            target: address(target),
            value: 0,
            selector: GovernedTargetMock.setValue.selector,
            callDataHash: keccak256(callDatas[0]),
            scopeHash: SCOPE,
            oldValueHash: OLD_VALUE,
            newValueHash: NEW_VALUE
        });
        calls[1] = GovernanceCall({
            target: address(second),
            value: 0,
            selector: GovernedTargetMock.setValue.selector,
            callDataHash: keccak256(callDatas[1]),
            scopeHash: SCOPE,
            oldValueHash: OLD_VALUE,
            newValueHash: NEW_VALUE
        });
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );
        vm.warp(notBefore);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.CallsHashMismatch.selector, actionId)
        );
        executor.executeGovernanceAction(actionId, callDatas[0]);
    }

    // ------------------------------------------------------- governed config

    function testGovernedSelfCallManagesExecutorConfig() public {
        // Executor configuration is itself governable through a staged,
        // transition-committed batch of exactly one self-call.
        _setProposer(proposer, true);
        executor.isProposer(proposer).assertTrue("governed self-call registered proposer");
    }

    function testBaseAndScopedTerminalVetoGuardiansCannotBecomeProposers() public {
        _assertGuardianCannotBecomeProposer(guardian);

        address scopedGuardian = address(new StreamGovernanceRootMock());
        _grantScopedRoleViaGovernance(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, SCOPE, scopedGuardian);
        _assertGuardianCannotBecomeProposer(scopedGuardian);
    }

    function testBaseAndScopedTerminalVetoGuardiansCannotBecomeGovernanceRoot() public {
        _assertGuardianCannotBecomeGovernanceRoot(guardian);

        address scopedGuardian = address(new StreamGovernanceRootMock());
        _grantScopedRoleViaGovernance(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, SCOPE, scopedGuardian);
        _assertGuardianCannotBecomeGovernanceRoot(scopedGuardian);
    }

    function testDelegatedEOACannotBecomeGovernanceRoot() public {
        StreamGovernanceRootMock delegate = new StreamGovernanceRootMock();
        address delegatedEOA = address(0x7702);
        vm.etch(delegatedEOA, abi.encodePacked(hex"ef0100", address(delegate)));
        delegatedEOA.code.length.assertEq(23, "exact EIP-7702 designation length");
        _assertGuardianCannotBecomeGovernanceRoot(delegatedEOA);
    }

    function testConfigFunctionsRejectStrangers() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceSelfCallContextRequired.selector
            )
        );
        vm.prank(stranger);
        executor.registerProposer(stranger, true);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceSelfCallContextRequired.selector
            )
        );
        vm.prank(stranger);
        executor.registerCanceller(stranger, true);

        // FIX C: setTighteningCall requires an exact isolated governance self-call.
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceSelfCallContextRequired.selector
            )
        );
        vm.prank(stranger);
        executor.setTighteningCall(address(target), GovernedTargetMock.setValue.selector, true);

        // FIX A: registerFreezeSelector requires the same isolated self-call context.
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceSelfCallContextRequired.selector
            )
        );
        vm.prank(stranger);
        executor.registerFreezeSelector(address(target), GovernedTargetMock.setValue.selector, true);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceSelfCallContextRequired.selector
            )
        );
        vm.prank(stranger);
        executor.setApprovedNativeReceiver(stranger, true);
    }

    function testClassifierAdministrationRejectsMismatchedGovernanceTransitions() public {
        _assertMismatchedGovernedSelfCallBlocked(
            abi.encodeCall(
                StreamGovernanceExecutor.setTighteningCall,
                (address(target), GovernedTargetMock.setValue.selector, true)
            ),
            StreamGovernanceExecutor.setTighteningCall.selector,
            StreamGovernanceActionClasses.DELAYED_LOOSENING
        );
        _assertMismatchedGovernedSelfCallBlocked(
            abi.encodeCall(
                StreamGovernanceExecutor.registerFreezeSelector,
                (address(target), GovernedTargetMock.setValue.selector, true)
            ),
            StreamGovernanceExecutor.registerFreezeSelector.selector,
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING
        );
    }

    function testCurrentActionContextDuringExecution() public {
        GovernedContextProbeMock probe = new GovernedContextProbeMock(executor);
        bytes memory callData = abi.encodeCall(GovernedContextProbeMock.probe, ());
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = GovernanceCall({
            target: address(probe),
            value: 0,
            selector: GovernedContextProbeMock.probe.selector,
            callDataHash: keccak256(callData),
            scopeHash: SCOPE,
            oldValueHash: OLD_VALUE,
            newValueHash: NEW_VALUE
        });
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );
        vm.warp(notBefore);
        executor.executeGovernanceBatch(actionId, calls, callDatas);

        probe.sawExecuting().assertTrue("executing context visible to target");
        probe.sawActionId().assertEq(actionId, "action id visible to target");
        uint256(probe.sawActionClass())
            .assertEq(
                uint256(StreamGovernanceActionClasses.DELAYED_LOOSENING),
                "action class visible to target"
            );

        (
            bool executing,
            bytes32 idAfter,
            uint8 classAfter,
            bytes32 scopeAfter,
            bytes32 oldAfter,
            bytes32 newAfter
        ) = executor.currentAction();
        executing.assertFalse("context cleared after execution");
        idAfter.assertEq(bytes32(0), "action id cleared");
        uint256(classAfter).assertEq(0, "action class cleared");
        scopeAfter.assertEq(bytes32(0), "scope cleared");
        oldAfter.assertEq(bytes32(0), "old state cleared");
        newAfter.assertEq(bytes32(0), "new state cleared");
    }

    function testCurrentActionRotatesPerCallAndClearsAfterBatch() public {
        GovernedContextProbeMock first = new GovernedContextProbeMock(executor);
        GovernedContextProbeMock second = new GovernedContextProbeMock(executor);
        bytes[] memory callDatas = new bytes[](2);
        callDatas[0] = abi.encodeCall(GovernedContextProbeMock.probe, ());
        callDatas[1] = abi.encodeCall(GovernedContextProbeMock.probe, ());
        GovernanceCall[] memory calls = new GovernanceCall[](2);
        calls[0] = GovernanceCall({
            target: address(first),
            value: 0,
            selector: GovernedContextProbeMock.probe.selector,
            callDataHash: keccak256(callDatas[0]),
            scopeHash: keccak256("first-scope"),
            oldValueHash: keccak256("first-old"),
            newValueHash: keccak256("first-new")
        });
        calls[1] = GovernanceCall({
            target: address(second),
            value: 0,
            selector: GovernedContextProbeMock.probe.selector,
            callDataHash: keccak256(callDatas[1]),
            scopeHash: keccak256("second-scope"),
            oldValueHash: keccak256("second-old"),
            newValueHash: keccak256("second-new")
        });
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            callDatas,
            notBefore,
            expiresAfter
        );
        vm.warp(notBefore);
        executor.executeGovernanceBatch(actionId, calls, callDatas);

        first.sawScopeHash().assertEq(calls[0].scopeHash, "first per-call scope");
        first.sawOldValueHash().assertEq(calls[0].oldValueHash, "first per-call old");
        first.sawNewValueHash().assertEq(calls[0].newValueHash, "first per-call new");
        second.sawScopeHash().assertEq(calls[1].scopeHash, "second per-call scope");
        second.sawOldValueHash().assertEq(calls[1].oldValueHash, "second per-call old");
        second.sawNewValueHash().assertEq(calls[1].newValueHash, "second per-call new");
        (
            bool executing,
            bytes32 currentId,
            uint8 currentClass,
            bytes32 scope,
            bytes32 oldHash,
            bytes32 newHash
        ) = executor.currentAction();
        executing.assertFalse("execution flag cleared");
        currentId.assertEq(bytes32(0), "action id cleared");
        uint256(currentClass).assertEq(0, "class cleared");
        scope.assertEq(bytes32(0), "scope cleared");
        oldHash.assertEq(bytes32(0), "old cleared");
        newHash.assertEq(bytes32(0), "new cleared");
    }

    // -------------------------------------------------- FIX A: freeze backstop

    function _grantGlobalVetoGuardian() private view {
        roleRegistry.hasRole(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, guardian)
            .assertTrue("bootstrap guardian retained");
    }

    function testFreezeSelectorForcesTerminalFreezeClass() public {
        _grantGlobalVetoGuardian();
        // Register setValue as a known-irreversible freeze on target.
        _setFreezeSelector(address(target), GovernedTargetMock.setValue.selector, true);
        executor.isFreezeSelector(address(target), GovernedTargetMock.setValue.selector)
            .assertTrue("freeze selector registered");

        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (1));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        executor.publishGovernanceCallData(callDatas);

        // A freeze scheduled under DELAYED_LOOSENING (48h, no veto) is rejected.
        uint64 delayedNotBefore = uint64(block.timestamp) + 48 hours;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.TerminalFreezeClassRequired.selector,
                address(target),
                GovernedTargetMock.setValue.selector
            )
        );
        _scheduleClass(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            calls,
            delayedNotBefore,
            delayedNotBefore + 7 days
        );

        // A classifier-approved IMMEDIATE_TIGHTENING (0 delay) is also rejected,
        // even though the tightening classifier would otherwise allow it.
        bytes32 classifierActionId =
            _setTighteningCall(address(target), GovernedTargetMock.setValue.selector, true);
        uint64 classifierExecutionTime = executor.governanceAction(classifierActionId).notBefore;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.TerminalFreezeClassRequired.selector,
                address(target),
                GovernedTargetMock.setValue.selector
            )
        );
        _scheduleClass(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            calls,
            classifierExecutionTime,
            classifierExecutionTime + 7 days
        );

        // Under TERMINAL_FREEZE the 72h floor applies and scheduling succeeds.
        uint64 freezeNotBefore = classifierExecutionTime + 72 hours;
        bytes32 actionId = _scheduleClass(
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            freezeNotBefore,
            freezeNotBefore + 7 days
        );
        uint256(uint8(executor.governanceAction(actionId).status))
            .assertEq(
                uint256(uint8(GovernanceActionStatus.SCHEDULED)),
                "freeze scheduled under terminal class"
            );
    }

    function testFreezeSelectorInAnyBatchPositionForcesTerminalFreeze() public {
        _grantGlobalVetoGuardian();
        GovernedTargetMock freezeTarget = new GovernedTargetMock();
        _setFreezeSelector(address(freezeTarget), GovernedTargetMock.setValue.selector, true);

        // A two-call batch where only the SECOND call is a freeze still forces
        // the terminal-freeze class.
        GovernanceCall[] memory calls = new GovernanceCall[](2);
        bytes[] memory callDatas = new bytes[](2);
        callDatas[0] = abi.encodeCall(GovernedTargetMock.setValue, (1));
        callDatas[1] = abi.encodeCall(GovernedTargetMock.setValue, (2));
        calls[0] = GovernanceCall({
            target: address(target),
            value: 0,
            selector: GovernedTargetMock.setValue.selector,
            callDataHash: keccak256(callDatas[0]),
            scopeHash: SCOPE,
            oldValueHash: OLD_VALUE,
            newValueHash: NEW_VALUE
        });
        calls[1] = GovernanceCall({
            target: address(freezeTarget),
            value: 0,
            selector: GovernedTargetMock.setValue.selector,
            callDataHash: keccak256(callDatas[1]),
            scopeHash: SCOPE,
            oldValueHash: OLD_VALUE,
            newValueHash: NEW_VALUE
        });
        executor.publishGovernanceCallData(callDatas);
        uint64 notBefore = uint64(block.timestamp) + 48 hours;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.TerminalFreezeClassRequired.selector,
                address(freezeTarget),
                GovernedTargetMock.setValue.selector
            )
        );
        _scheduleClass(
            StreamGovernanceActionClasses.DELAYED_LOOSENING, calls, notBefore, notBefore + 7 days
        );
    }

    function testClearingFreezeSelectorRestoresNormalClassing() public {
        _setFreezeSelector(address(target), GovernedTargetMock.setValue.selector, true);
        _setFreezeSelector(address(target), GovernedTargetMock.setValue.selector, false);
        executor.isFreezeSelector(address(target), GovernedTargetMock.setValue.selector)
            .assertFalse("freeze selector cleared");

        // With the flag cleared, a DELAYED_LOOSENING freeze-free call schedules.
        bytes32 actionId = _scheduleDefault(abi.encodeCall(GovernedTargetMock.setValue, (1)));
        uint256(uint8(executor.governanceAction(actionId).status))
            .assertEq(
                uint256(uint8(GovernanceActionStatus.SCHEDULED)), "scheduled after clearing freeze"
            );
    }

    // ---------------------------------- FIX B: per-scope multi-action veto set

    function _scheduleFreeze(bytes32 scope, uint64 notBefore) private returns (bytes32 actionId) {
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (uint256(0xFEE1)));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        calls[0].scopeHash = scope;
        executor.publishGovernanceCallData(callDatas);
        (bytes32 actionScope, bytes32 actionOld, bytes32 actionNew) = _derivedBatchHashes(calls);
        return executor.scheduleGovernanceBatch(
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            actionScope,
            actionOld,
            actionNew,
            notBefore,
            notBefore + 7 days,
            REASON,
            REASON_URI,
            MANIFEST
        );
    }

    function _scheduleFreezeAs(address actor, bytes32 scope, uint64 notBefore)
        private
        returns (bytes32 actionId)
    {
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (uint256(0xFEE1)));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        calls[0].scopeHash = scope;
        executor.publishGovernanceCallData(callDatas);
        return _schedulePublishedAs(
            actor,
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            notBefore,
            notBefore + 7 days
        );
    }

    function _twoScopeFreezeBatch(bytes32 scopeA, bytes32 scopeB)
        private
        returns (GovernanceCall[] memory calls, bytes[] memory callDatas)
    {
        GovernedTargetMock second = new GovernedTargetMock();
        callDatas = new bytes[](2);
        callDatas[0] = abi.encodeCall(GovernedTargetMock.setValue, (101));
        callDatas[1] = abi.encodeCall(GovernedTargetMock.setValue, (202));
        calls = new GovernanceCall[](2);
        calls[0] = _governanceCall(address(target), callDatas[0], keccak256("guardian-scope-a"));
        calls[0].scopeHash = scopeA;
        calls[1] = _governanceCall(address(second), callDatas[1], keccak256("guardian-scope-b"));
        calls[1].scopeHash = scopeB;
    }

    function testTerminalGuardianCommitmentFormulaEventGetterAndDistinctScopes() public {
        _grantGlobalVetoGuardian();
        bytes32 scopeA = keccak256("guardian-formula-a");
        bytes32 scopeB = keccak256("guardian-formula-b");
        GovernedTargetMock second = new GovernedTargetMock();
        bytes[] memory callDatas = new bytes[](3);
        callDatas[0] = abi.encodeCall(GovernedTargetMock.setValue, (11));
        callDatas[1] = abi.encodeCall(GovernedTargetMock.setValue, (12));
        callDatas[2] = abi.encodeCall(GovernedTargetMock.setValue, (13));
        GovernanceCall[] memory calls = new GovernanceCall[](3);
        calls[0] = _governanceCall(address(target), callDatas[0], keccak256("formula-a-1"));
        calls[0].scopeHash = scopeA;
        calls[1] = _governanceCall(address(second), callDatas[1], keccak256("formula-a-2"));
        calls[1].scopeHash = scopeA;
        calls[2] = _governanceCall(address(second), callDatas[2], keccak256("formula-b"));
        calls[2].scopeHash = scopeB;
        bytes32 expectedCommitment = _terminalGuardianCommitment(calls);

        GovernanceCall[] memory deduplicated = new GovernanceCall[](2);
        deduplicated[0] = calls[0];
        deduplicated[1] = calls[2];
        _terminalGuardianCommitment(deduplicated)
            .assertEq(expectedCommitment, "duplicate scope included exactly once");

        uint64 notBefore = uint64(block.timestamp) + 72 hours;
        uint64 expiresAfter = notBefore + 7 days;
        vm.recordLogs();
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.TERMINAL_FREEZE, calls, callDatas, notBefore, expiresAfter
        );
        Vm.Log[] memory logs = vm.getRecordedLogs();
        bool foundCommitment;
        bool foundScheduled;
        uint256 membershipCount;
        uint256 lastMembershipIndex;
        uint256 commitmentIndex;
        uint256 scheduledIndex;
        for (uint256 i = 0; i < logs.length; i++) {
            bytes32 topic0 = logs[i].topics[0];
            if (topic0 == TERMINAL_FREEZE_ACTION_MEMBERSHIP_UPDATED_TOPIC) {
                bytes32 expectedScope = membershipCount == 0 ? scopeA : scopeB;
                _assertTerminalMembershipLog(
                    logs[i], expectedScope, actionId, address(this), true, 1, true, notBefore, 0, 1
                );
                membershipCount++;
                lastMembershipIndex = i;
                continue;
            }
            if (topic0 == TERMINAL_FREEZE_GUARDIAN_CONFIG_COMMITTED_TOPIC) {
                logs[i].emitter.assertEq(address(executor), "commitment event emitter");
                logs[i].topics.length.assertEq(3, "commitment event topics");
                logs[i].topics[1].assertEq(actionId, "commitment event action");
                logs[i].topics[2].assertEq(expectedCommitment, "commitment event value");
                _word(logs[i].data, 0).assertEq(bytes32(uint256(1)), "commitment event schema");
                foundCommitment = true;
                commitmentIndex = i;
                continue;
            }
            if (topic0 == GOVERNANCE_ACTION_SCHEDULED_TOPIC) {
                foundScheduled = true;
                scheduledIndex = i;
            }
        }
        membershipCount.assertEq(2, "one append event per distinct scope");
        foundCommitment.assertTrue("guardian commitment event found");
        foundScheduled.assertTrue("scheduled event found");
        (lastMembershipIndex < commitmentIndex).assertTrue("membership precedes commitment");
        (commitmentIndex < scheduledIndex).assertTrue("commitment precedes lifecycle event");
        executor.terminalFreezeGuardianConfigCommitment(actionId)
            .assertEq(expectedCommitment, "stored guardian commitment exact formula");
    }

    function testTerminalGuardianCommitmentRejectsGlobalMutationDrift() public {
        _grantGlobalVetoGuardian();
        bytes32 scope = keccak256("guardian-global-drift");
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (301));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        calls[0].scopeHash = scope;
        uint64 notBefore = uint64(block.timestamp) + 300 days;
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            callDatas,
            notBefore,
            notBefore + 7 days
        );
        _grantRoleViaGovernance(
            StreamRoles.ROLE_TERMINAL_FREEZE_VETO, address(new StreamGovernanceRootMock())
        );
        _assertTerminalGuardianCommitmentDrift(actionId, calls, callDatas);
    }

    function testTerminalGuardianCommitmentRejectsEachDistinctScopedMutation() public {
        _grantGlobalVetoGuardian();
        bytes32 scopeA = keccak256("guardian-distinct-a");
        bytes32 scopeB = keccak256("guardian-distinct-b");
        (GovernanceCall[] memory calls, bytes[] memory callDatas) =
            _twoScopeFreezeBatch(scopeA, scopeB);
        uint64 notBefore = uint64(block.timestamp) + 300 days;
        bytes32 actionA = _schedule(
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            callDatas,
            notBefore,
            notBefore + 7 days
        );
        _grantScopedRoleViaGovernance(
            StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scopeA, address(new StreamGovernanceRootMock())
        );
        _assertTerminalGuardianCommitmentDrift(actionA, calls, callDatas);
        executor.cancelGovernanceAction(actionA, keccak256("scope A drift complete"));

        (calls, callDatas) = _twoScopeFreezeBatch(scopeA, scopeB);
        notBefore = uint64(block.timestamp) + 300 days;
        bytes32 actionB = _schedule(
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            callDatas,
            notBefore,
            notBefore + 7 days
        );
        _grantScopedRoleViaGovernance(
            StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scopeB, address(new StreamGovernanceRootMock())
        );
        _assertTerminalGuardianCommitmentDrift(actionB, calls, callDatas);
    }

    function testTerminalGuardianCommitmentRejectsScopedGuardianABA() public {
        _grantGlobalVetoGuardian();
        bytes32 scope = keccak256("guardian-aba");
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (401));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        calls[0].scopeHash = scope;
        uint64 notBefore = uint64(block.timestamp) + 300 days;
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            callDatas,
            notBefore,
            notBefore + 7 days
        );
        address scopedGuardian = address(new StreamGovernanceRootMock());
        _grantScopedRoleViaGovernance(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scope, scopedGuardian);
        _revokeScopedRoleViaGovernance(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scope, scopedGuardian);
        roleRegistry.roleHolderCount(executor.terminalFreezeVetoRole(scope))
            .assertEq(0, "scoped holder set returned to original");
        _assertTerminalGuardianCommitmentDrift(actionId, calls, callDatas);
    }

    function testTerminalGuardianCommitmentRejectsGuardianCodehashDrift() public {
        _grantGlobalVetoGuardian();
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (501));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        uint64 notBefore = uint64(block.timestamp) + 72 hours;
        bytes32 guardianAction = _schedule(
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            callDatas,
            notBefore,
            notBefore + 7 days
        );
        vm.etch(guardian, hex"60006000f3");
        _assertTerminalGuardianCommitmentDrift(guardianAction, calls, callDatas);
    }

    function testTerminalGuardianCommitmentRejectsRegistryCodehashDrift() public {
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (502));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        uint64 notBefore = uint64(block.timestamp) + 72 hours;
        bytes32 registryAction = _schedule(
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            callDatas,
            notBefore,
            notBefore + 7 days
        );
        bytes32 expectedCodeHash = address(roleRegistry).codehash;
        vm.etch(address(roleRegistry), hex"60006000f3");
        bytes32 actualCodeHash = address(roleRegistry).codehash;
        vm.warp(notBefore);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.RoleRegistryCodeHashMismatch.selector,
                expectedCodeHash,
                actualCodeHash
            )
        );
        executor.executeGovernanceBatch(registryAction, calls, callDatas);
    }

    function testUnrelatedRoleMutationDoesNotDriftTerminalGuardianCommitment() public {
        _grantGlobalVetoGuardian();
        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (601));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        uint64 notBefore = uint64(block.timestamp) + 300 days;
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            callDatas,
            notBefore,
            notBefore + 7 days
        );
        bytes32 expectedCommitment = executor.terminalFreezeGuardianConfigCommitment(actionId);
        _grantRoleViaGovernance(StreamRoles.ROLE_TREASURY, address(new StreamGovernanceRootMock()));
        _terminalGuardianCommitment(calls)
            .assertEq(expectedCommitment, "unrelated role excluded from guardian commitment");
        vm.warp(notBefore);
        executor.executeGovernanceBatch(actionId, calls, callDatas);
        target.value().assertEq(601, "terminal action executes after unrelated role mutation");
    }

    function testDecoyFreezeDoesNotShadowEarlierLiveAction() public {
        _grantGlobalVetoGuardian();
        // First: a live freeze at the 72h floor.
        uint64 earlyDeadline = uint64(block.timestamp) + 72 hours;
        bytes32 earlyAction = _scheduleFreeze(SCOPE, earlyDeadline);

        // Then: a far-future decoy freeze on the SAME scope.
        uint64 lateDeadline = uint64(block.timestamp) + 300 days;
        bytes32 lateAction = _scheduleFreeze(SCOPE, lateDeadline);

        // The guardian view reports the EARLIEST live deadline, never the decoy.
        (address resolvedGuardian, uint64 vetoDeadline) = executor.terminalFreezeVetoGuardian(SCOPE);
        resolvedGuardian.assertEq(address(0), "redundant global set uses sentinel resolution");
        uint256(vetoDeadline)
            .assertEq(uint256(earlyDeadline), "earliest live deadline, decoy does not shadow");

        // Enumeration exposes BOTH live actions so none is hidden.
        executor.liveTerminalFreezeActionCount(SCOPE).assertEq(2, "two live freezes");
        (bytes32 id0, uint64 d0) = executor.liveTerminalFreezeActionAt(SCOPE, 0);
        (bytes32 id1, uint64 d1) = executor.liveTerminalFreezeActionAt(SCOPE, 1);
        id0.assertEq(earlyAction, "index 0 is early action");
        uint256(d0).assertEq(uint256(earlyDeadline), "index 0 deadline");
        id1.assertEq(lateAction, "index 1 is late action");
        uint256(d1).assertEq(uint256(lateDeadline), "index 1 deadline");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.LiveTerminalFreezeIndexOutOfBounds.selector, SCOPE, 2
            )
        );
        executor.liveTerminalFreezeActionAt(SCOPE, 2);
    }

    function testLiveFreezeEnumerationSkipsElapsedVetoWindowsWithoutMutation() public {
        _grantGlobalVetoGuardian();
        uint64 firstDeadline = uint64(block.timestamp) + 72 hours;
        uint64 secondDeadline = uint64(block.timestamp) + 80 hours;
        uint64 thirdDeadline = uint64(block.timestamp) + 90 hours;
        bytes32 firstAction = _scheduleFreeze(SCOPE, firstDeadline);
        bytes32 secondAction = _scheduleFreeze(SCOPE, secondDeadline);
        bytes32 thirdAction = _scheduleFreeze(SCOPE, thirdDeadline);

        vm.warp(firstDeadline);
        executor.liveTerminalFreezeActionCount(SCOPE).assertEq(2, "elapsed first action skipped");
        (bytes32 id0, uint64 deadline0) = executor.liveTerminalFreezeActionAt(SCOPE, 0);
        (bytes32 id1, uint64 deadline1) = executor.liveTerminalFreezeActionAt(SCOPE, 1);
        id0.assertEq(secondAction, "first dense index is second action");
        uint256(deadline0).assertEq(uint256(secondDeadline), "second action deadline");
        id1.assertEq(thirdAction, "second dense index is third action");
        uint256(deadline1).assertEq(uint256(thirdDeadline), "third action deadline");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.LiveTerminalFreezeIndexOutOfBounds.selector, SCOPE, 2
            )
        );
        executor.liveTerminalFreezeActionAt(SCOPE, 2);

        // Timestamp filtering is a view concern: the elapsed action remains
        // scheduled and in the O(1) mutation index until a terminal transition.
        uint256(uint8(executor.governanceAction(firstAction).status))
            .assertEq(uint256(uint8(GovernanceActionStatus.SCHEDULED)), "status stays scheduled");

        vm.warp(secondDeadline);
        executor.liveTerminalFreezeActionCount(SCOPE).assertEq(1, "two elapsed actions skipped");
        (id0, deadline0) = executor.liveTerminalFreezeActionAt(SCOPE, 0);
        id0.assertEq(thirdAction, "remaining action shifts to dense index zero");
        uint256(deadline0).assertEq(uint256(thirdDeadline), "remaining deadline");

        vm.warp(thirdDeadline);
        executor.liveTerminalFreezeActionCount(SCOPE).assertEq(0, "all veto windows elapsed");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.LiveTerminalFreezeIndexOutOfBounds.selector, SCOPE, 0
            )
        );
        executor.liveTerminalFreezeActionAt(SCOPE, 0);
        (, uint64 vetoDeadline) = executor.terminalFreezeVetoGuardian(SCOPE);
        uint256(vetoDeadline).assertEq(0, "no currently vetoable deadline");
    }

    function testTerminalFreezeRawPaginationAndPermissionlessElapsedPruning() public {
        _grantGlobalVetoGuardian();
        uint64 firstDeadline = uint64(block.timestamp) + 72 hours;
        uint64 secondDeadline = uint64(block.timestamp) + 80 hours;
        uint64 thirdDeadline = uint64(block.timestamp) + 90 hours;
        bytes32 firstAction = _scheduleFreeze(SCOPE, firstDeadline);
        bytes32 secondAction = _scheduleFreeze(SCOPE, secondDeadline);
        bytes32 thirdAction = _scheduleFreeze(SCOPE, thirdDeadline);

        (bytes32[] memory ids, uint64[] memory deadlines, uint256 nextCursor) =
            executor.terminalFreezeActionPage(SCOPE, 0, 2);
        ids.length.assertEq(2, "first raw page length");
        ids[0].assertEq(firstAction, "first raw membership");
        ids[1].assertEq(secondAction, "second raw membership");
        uint256(deadlines[0]).assertEq(uint256(firstDeadline), "first raw deadline");
        uint256(deadlines[1]).assertEq(uint256(secondDeadline), "second raw deadline");
        nextCursor.assertEq(2, "first raw next cursor");

        (ids, deadlines, nextCursor) = executor.terminalFreezeActionPage(SCOPE, 2, 2);
        ids.length.assertEq(1, "second raw page length");
        ids[0].assertEq(thirdAction, "third raw membership");
        uint256(deadlines[0]).assertEq(uint256(thirdDeadline), "third raw deadline");
        nextCursor.assertEq(3, "second raw next cursor");

        (ids, deadlines, nextCursor) = executor.terminalFreezeActionPage(SCOPE, 3, 0);
        ids.length.assertEq(0, "zero-limit page ids");
        deadlines.length.assertEq(0, "zero-limit page deadlines");
        nextCursor.assertEq(3, "zero-limit cursor stable");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.TerminalFreezePageCursorOutOfBounds.selector,
                SCOPE,
                uint256(4),
                uint256(3)
            )
        );
        executor.terminalFreezeActionPage(SCOPE, 4, 1);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.TerminalFreezePageLimitExceeded.selector,
                uint256(65),
                uint256(64)
            )
        );
        executor.terminalFreezeActionPage(SCOPE, 0, 65);

        vm.warp(firstDeadline);
        uint256 pendingBefore = executor.pendingScheduledActionCount();
        vm.expectEmit(true, true, true, true);
        emit TerminalFreezeActionMembershipUpdated(
            1, SCOPE, firstAction, address(this), false, 2, true, firstDeadline, 0, 2
        );
        executor.pruneElapsedTerminalFreezeActions(SCOPE).assertEq(1, "one elapsed pruned");
        executor.pendingScheduledActionCount()
            .assertEq(pendingBefore, "index pruning does not change pending actions");
        uint256(uint8(executor.governanceAction(firstAction).status))
            .assertEq(uint256(uint8(GovernanceActionStatus.SCHEDULED)), "action state unchanged");

        // Swap-and-pop moves the former last membership into slot zero and
        // keeps both moved and untouched indices usable.
        (ids, deadlines, nextCursor) = executor.terminalFreezeActionPage(SCOPE, 0, 64);
        ids.length.assertEq(2, "two raw memberships remain");
        ids[0].assertEq(thirdAction, "swap-in membership indexed");
        ids[1].assertEq(secondAction, "untouched membership indexed");
        nextCursor.assertEq(2, "compacted raw cursor");

        executor.cancelGovernanceAction(firstAction, keccak256("already deindexed"));
        executor.cancelGovernanceAction(thirdAction, keccak256("moved index cleanup"));
        executor.liveTerminalFreezeActionCount(SCOPE).assertEq(1, "moved index pruned correctly");
        (bytes32 remaining,) = executor.liveTerminalFreezeActionAt(SCOPE, 0);
        remaining.assertEq(secondAction, "untouched action remains discoverable");
    }

    function testTerminalFreezeTerminalCleanupEmitsReplayableSwapPopBeforeLifecycle() public {
        _grantGlobalVetoGuardian();
        uint64 deadline = uint64(block.timestamp) + 72 hours;
        bytes32 firstAction = _scheduleFreeze(SCOPE, deadline);
        bytes32 removedAction = _scheduleFreeze(SCOPE, deadline);
        bytes32 movedAction = _scheduleFreeze(SCOPE, deadline);

        vm.recordLogs();
        executor.cancelGovernanceAction(removedAction, keccak256("membership replay cleanup"));
        Vm.Log[] memory logs = vm.getRecordedLogs();

        uint256 membershipCount;
        uint256 lifecycleCount;
        uint256 membershipIndex;
        uint256 lifecycleIndex;
        for (uint256 i = 0; i < logs.length; i++) {
            bytes32 topic0 = logs[i].topics[0];
            if (topic0 == TERMINAL_FREEZE_ACTION_MEMBERSHIP_UPDATED_TOPIC) {
                _assertTerminalMembershipLog(
                    logs[i], SCOPE, removedAction, address(this), false, 3, true, deadline, 1, 2
                );
                membershipCount++;
                membershipIndex = i;
            } else if (topic0 == GOVERNANCE_ACTION_CANCELLED_TOPIC) {
                logs[i].topics[1].assertEq(removedAction, "cancelled lifecycle action");
                lifecycleCount++;
                lifecycleIndex = i;
            }
        }
        membershipCount.assertEq(1, "one terminal cleanup membership event");
        lifecycleCount.assertEq(1, "one cancellation lifecycle event");
        (membershipIndex + 1 == lifecycleIndex)
        .assertTrue("membership post-state event immediately precedes lifecycle event");

        (bytes32[] memory ids,,) = executor.terminalFreezeActionPage(SCOPE, 0, 64);
        ids.length.assertEq(2, "two memberships remain after middle removal");
        ids[0].assertEq(firstAction, "first membership remains in place");
        ids[1].assertEq(movedAction, "prior last membership swap-pops into removed index");
    }

    function testTerminalFreezePerScopeCapAndScheduleTimeElapsedCompaction() public {
        _grantGlobalVetoGuardian();
        (uint256 cap, uint256 nonRootCap, uint256 proposerCap) =
            executor.terminalFreezeLiveActionCaps();
        cap.assertEq(64, "pinned terminal live-set cap");
        nonRootCap.assertEq(48, "pinned non-root reserve boundary");
        proposerCap.assertEq(8, "pinned per-proposer cap");
        uint64 deadline = uint64(block.timestamp) + 72 hours;
        bytes32 firstAction;
        for (uint256 i = 0; i < cap; i++) {
            bytes32 actionId = _scheduleFreeze(SCOPE, deadline);
            if (i == 0) firstAction = actionId;
        }
        executor.liveTerminalFreezeActionCount(SCOPE).assertEq(cap, "scope filled to cap");

        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (uint256(0xFEE1)));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        calls[0].scopeHash = SCOPE;
        executor.publishGovernanceCallData(callDatas);
        (bytes32 actionScope, bytes32 actionOld, bytes32 actionNew) = _derivedBatchHashes(calls);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.TerminalFreezeLiveActionCapExceeded.selector, SCOPE, cap
            )
        );
        executor.scheduleGovernanceBatch(
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            actionScope,
            actionOld,
            actionNew,
            deadline,
            deadline + 7 days,
            REASON,
            REASON_URI,
            MANIFEST
        );

        vm.warp(deadline);
        uint256 pendingBefore = executor.pendingScheduledActionCount();
        executor.liveTerminalFreezeActionCount(SCOPE).assertEq(0, "cap entries elapsed");
        vm.expectEmit(true, true, true, true);
        emit TerminalFreezeActionMembershipUpdated(
            1, SCOPE, firstAction, address(this), false, 2, true, deadline, 0, cap - 1
        );
        bytes32 replacement = _schedulePublishedAs(
            address(this),
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            deadline + 72 hours,
            deadline + 72 hours + 7 days
        );
        executor.liveTerminalFreezeActionCount(SCOPE).assertEq(1, "schedule compacts then appends");
        executor.pendingScheduledActionCount()
            .assertEq(pendingBefore + 1, "elapsed actions remain pending after compaction");
        uint256(uint8(executor.governanceAction(firstAction).status))
            .assertEq(uint256(uint8(GovernanceActionStatus.SCHEDULED)), "elapsed index only pruned");
        (bytes32 onlyAction,) = executor.liveTerminalFreezeActionAt(SCOPE, 0);
        onlyAction.assertEq(replacement, "replacement is sole open membership");
    }

    function testScheduleTimeCompactionEmitsForEachAffectedScopeOnly() public {
        _grantGlobalVetoGuardian();
        bytes32 scopeA = keccak256("compaction-scope-a");
        bytes32 scopeB = keccak256("compaction-scope-b");
        uint64 earlyDeadline = uint64(block.timestamp) + 72 hours;
        uint64 lateDeadline = uint64(block.timestamp) + 80 hours;
        bytes32 earlyA = _scheduleFreeze(scopeA, earlyDeadline);
        bytes32 lateB = _scheduleFreeze(scopeB, lateDeadline);
        vm.warp(earlyDeadline);

        GovernedTargetMock second = new GovernedTargetMock();
        bytes[] memory callDatas = new bytes[](2);
        callDatas[0] = abi.encodeCall(GovernedTargetMock.setValue, (111));
        callDatas[1] = abi.encodeCall(GovernedTargetMock.setValue, (222));
        GovernanceCall[] memory calls = new GovernanceCall[](2);
        calls[0] = _governanceCall(address(target), callDatas[0], keccak256("compact-a"));
        calls[0].scopeHash = scopeA;
        calls[1] = _governanceCall(address(second), callDatas[1], keccak256("compact-b"));
        calls[1].scopeHash = scopeB;
        executor.publishGovernanceCallData(callDatas);
        uint64 newDeadline = uint64(block.timestamp) + 72 hours;

        vm.expectEmit(true, true, true, true);
        emit TerminalFreezeActionMembershipUpdated(
            1, scopeA, earlyA, address(this), false, 2, true, earlyDeadline, 0, 0
        );
        bytes32 replacement = _schedulePublishedAs(
            address(this),
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            newDeadline,
            newDeadline + 7 days
        );

        (bytes32[] memory ids,,) = executor.terminalFreezeActionPage(scopeA, 0, 64);
        ids.length.assertEq(1, "scope A compacted then appended");
        ids[0].assertEq(replacement, "scope A replacement membership");
        (ids,,) = executor.terminalFreezeActionPage(scopeB, 0, 64);
        ids.length.assertEq(2, "scope B retained then appended");
        ids[0].assertEq(lateB, "scope B unelapsed membership retained");
        ids[1].assertEq(replacement, "scope B replacement appended");
        uint256(uint8(executor.governanceAction(earlyA).status))
            .assertEq(
                uint256(uint8(GovernanceActionStatus.SCHEDULED)), "compacted action unchanged"
            );
    }

    function testNonRootTerminalFreezeProposerCannotConsumeRootReserve() public {
        _grantGlobalVetoGuardian();
        _setProposer(proposer, true);
        (,, uint256 proposerCap) = executor.terminalFreezeLiveActionCaps();
        uint64 deadline = uint64(block.timestamp) + 300 days;
        for (uint256 i = 0; i < proposerCap; i++) {
            _scheduleFreezeAs(proposer, SCOPE, deadline);
        }

        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (uint256(0xFEE1)));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        calls[0].scopeHash = SCOPE;
        executor.publishGovernanceCallData(callDatas);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.TerminalFreezeProposerLiveActionCapExceeded.selector,
                SCOPE,
                proposer,
                proposerCap
            )
        );
        _schedulePublishedAs(
            proposer,
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            deadline,
            deadline + 7 days
        );

        bytes32 rootAction = _scheduleFreeze(SCOPE, deadline);
        executor.liveTerminalFreezeActionCount(SCOPE)
            .assertEq(proposerCap + 1, "root reserve remains schedulable");
        vm.prank(guardian);
        executor.vetoTerminalFreeze(rootAction, keccak256("root action veto"));
        executor.liveTerminalFreezeActionCount(SCOPE)
            .assertEq(proposerCap, "root membership prunes independently");
    }

    function testSharedNonRootCapPreservesExactlySixteenRootSlots() public {
        _grantGlobalVetoGuardian();
        (uint256 totalCap, uint256 nonRootCap, uint256 proposerCap) =
            executor.terminalFreezeLiveActionCaps();
        address[] memory proposers = new address[](7);
        for (uint256 i = 0; i < proposers.length; i++) {
            proposers[i] = address(uint160(0x9000 + i));
            _setProposer(proposers[i], true);
        }
        uint64 deadline = uint64(block.timestamp) + 300 days;
        for (uint256 i = 0; i < 6; i++) {
            for (uint256 j = 0; j < proposerCap; j++) {
                _scheduleFreezeAs(proposers[i], SCOPE, deadline);
            }
        }
        (uint256 totalUsage, uint256 nonRootUsage,) =
            executor.terminalFreezeLiveActionUsage(SCOPE, proposers[6]);
        totalUsage.assertEq(nonRootCap, "shared non-root capacity filled");
        nonRootUsage.assertEq(nonRootCap, "non-root counter filled");

        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (uint256(0xFEE1)));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        calls[0].scopeHash = SCOPE;
        executor.publishGovernanceCallData(callDatas);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.TerminalFreezeNonRootLiveActionCapExceeded.selector,
                SCOPE,
                nonRootCap
            )
        );
        _schedulePublishedAs(
            proposers[6],
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            deadline,
            deadline + 7 days
        );

        uint256 rootReserve = totalCap - nonRootCap;
        for (uint256 i = 0; i < rootReserve; i++) {
            _scheduleFreeze(SCOPE, deadline);
        }
        (totalUsage, nonRootUsage,) = executor.terminalFreezeLiveActionUsage(SCOPE, proposers[6]);
        totalUsage.assertEq(totalCap, "root consumes exactly reserved capacity");
        nonRootUsage.assertEq(nonRootCap, "root does not consume non-root counter");

        executor.publishGovernanceCallData(callDatas);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.TerminalFreezeLiveActionCapExceeded.selector,
                SCOPE,
                totalCap
            )
        );
        _schedulePublishedAs(
            address(this),
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            deadline,
            deadline + 7 days
        );
    }

    function testNonRootTerminalFreezeQuotaCountersReopenOnEveryRemovalPath() public {
        _grantGlobalVetoGuardian();
        _setProposer(proposer, true);
        (,, uint256 proposerCap) = executor.terminalFreezeLiveActionCaps();
        uint64 deadline = uint64(block.timestamp) + 300 days;
        bytes32[] memory actions = new bytes32[](proposerCap);
        for (uint256 i = 0; i < proposerCap; i++) {
            actions[i] = _scheduleFreezeAs(proposer, SCOPE, deadline);
        }
        (uint256 totalUsage, uint256 nonRootUsage, uint256 proposerUsage) =
            executor.terminalFreezeLiveActionUsage(SCOPE, proposer);
        totalUsage.assertEq(proposerCap, "initial total quota usage");
        nonRootUsage.assertEq(proposerCap, "initial non-root quota usage");
        proposerUsage.assertEq(proposerCap, "initial proposer quota usage");

        vm.prank(guardian);
        executor.vetoTerminalFreeze(actions[0], keccak256("quota veto"));
        (totalUsage, nonRootUsage, proposerUsage) =
            executor.terminalFreezeLiveActionUsage(SCOPE, proposer);
        totalUsage.assertEq(proposerCap - 1, "veto reopens total slot");
        nonRootUsage.assertEq(proposerCap - 1, "veto reopens shared slot");
        proposerUsage.assertEq(proposerCap - 1, "veto reopens proposer slot");
        _scheduleFreezeAs(proposer, SCOPE, deadline);

        executor.cancelGovernanceAction(actions[1], keccak256("quota cancel"));
        (totalUsage, nonRootUsage, proposerUsage) =
            executor.terminalFreezeLiveActionUsage(SCOPE, proposer);
        totalUsage.assertEq(proposerCap - 1, "cancel reopens total slot");
        nonRootUsage.assertEq(proposerCap - 1, "cancel reopens shared slot");
        proposerUsage.assertEq(proposerCap - 1, "cancel reopens proposer slot");
        _scheduleFreezeAs(proposer, SCOPE, deadline);

        (GovernanceCall[] memory calls, bytes[] memory callDatas) =
            _singleCall(0, abi.encodeCall(GovernedTargetMock.setValue, (uint256(0xFEE1))));
        calls[0].scopeHash = SCOPE;
        vm.warp(deadline);
        executor.executeGovernanceBatch(actions[2], calls, callDatas);
        (totalUsage, nonRootUsage, proposerUsage) =
            executor.terminalFreezeLiveActionUsage(SCOPE, proposer);
        totalUsage.assertEq(proposerCap - 1, "execute removes one raw membership");
        nonRootUsage.assertEq(proposerCap - 1, "execute decrements shared quota");
        proposerUsage.assertEq(proposerCap - 1, "execute decrements proposer quota");

        executor.pruneElapsedTerminalFreezeActions(SCOPE)
            .assertEq(proposerCap - 1, "permissionless prune removes remaining elapsed memberships");
        (totalUsage, nonRootUsage, proposerUsage) =
            executor.terminalFreezeLiveActionUsage(SCOPE, proposer);
        totalUsage.assertEq(0, "elapsed prune clears total usage");
        nonRootUsage.assertEq(0, "elapsed prune clears shared usage");
        proposerUsage.assertEq(0, "elapsed prune clears proposer usage");

        uint64 expiryDeadline = uint64(block.timestamp) + 72 hours;
        bytes32 expiringAction = _scheduleFreezeAs(proposer, SCOPE, expiryDeadline);
        GovernanceAction memory expiring = executor.governanceAction(expiringAction);
        vm.warp(uint256(expiring.expiresAfter) + 1);
        executor.materializeExpiredAction(expiringAction);
        (totalUsage, nonRootUsage, proposerUsage) =
            executor.terminalFreezeLiveActionUsage(SCOPE, proposer);
        totalUsage.assertEq(0, "expiry clears total usage");
        nonRootUsage.assertEq(0, "expiry clears shared usage");
        proposerUsage.assertEq(0, "expiry clears proposer usage");
    }

    function testTerminalFreezeBatchDeduplicatesRepeatedScopesAndCleansCounters() public {
        _grantGlobalVetoGuardian();
        _setProposer(proposer, true);
        bytes32 scopeA = keccak256("terminal-dedup-a");
        bytes32 scopeB = keccak256("terminal-dedup-b");
        GovernedTargetMock second = new GovernedTargetMock();
        bytes[] memory callDatas = new bytes[](3);
        callDatas[0] = abi.encodeCall(GovernedTargetMock.setValue, (701));
        callDatas[1] = abi.encodeCall(GovernedTargetMock.setValue, (702));
        callDatas[2] = abi.encodeCall(GovernedTargetMock.setValue, (703));
        GovernanceCall[] memory calls = new GovernanceCall[](3);
        calls[0] = _governanceCall(address(target), callDatas[0], keccak256("terminal-dedup-a-1"));
        calls[0].scopeHash = scopeA;
        calls[1] = _governanceCall(address(second), callDatas[1], keccak256("terminal-dedup-a-2"));
        calls[1].scopeHash = scopeA;
        calls[2] = _governanceCall(address(second), callDatas[2], keccak256("terminal-dedup-b"));
        calls[2].scopeHash = scopeB;
        executor.publishGovernanceCallData(callDatas);
        uint64 deadline = uint64(block.timestamp) + 300 days;
        bytes32 actionId = _schedulePublishedAs(
            proposer,
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            deadline,
            deadline + 7 days
        );

        _assertTerminalUsage(scopeA, proposer, 1, 1, 1);
        _assertTerminalUsage(scopeB, proposer, 1, 1, 1);
        (bytes32[] memory ids,,) = executor.terminalFreezeActionPage(scopeA, 0, 64);
        ids.length.assertEq(1, "duplicate scope indexed once");
        ids[0].assertEq(actionId, "scope A action id");
        (ids,,) = executor.terminalFreezeActionPage(scopeB, 0, 64);
        ids.length.assertEq(1, "distinct scope indexed once");
        ids[0].assertEq(actionId, "scope B action id");

        executor.cancelGovernanceAction(actionId, keccak256("dedup cleanup"));
        _assertTerminalUsage(scopeA, proposer, 0, 0, 0);
        _assertTerminalUsage(scopeB, proposer, 0, 0, 0);
    }

    function testTerminalFreezeMixedRootAndProposerSwapPopPreservesCounters() public {
        _grantGlobalVetoGuardian();
        _setProposer(proposer, true);
        bytes32 scope = keccak256("terminal-mixed-swap-pop");
        uint64 deadline = uint64(block.timestamp) + 300 days;
        bytes32 firstProposerAction = _scheduleFreezeAs(proposer, scope, deadline);
        bytes32 rootAction = _scheduleFreeze(scope, deadline);
        bytes32 secondProposerAction = _scheduleFreezeAs(proposer, scope, deadline);
        _assertTerminalUsage(scope, proposer, 3, 2, 2);

        executor.cancelGovernanceAction(rootAction, keccak256("remove middle root"));
        _assertTerminalUsage(scope, proposer, 2, 2, 2);
        (bytes32[] memory ids,,) = executor.terminalFreezeActionPage(scope, 0, 64);
        ids.length.assertEq(2, "middle removal leaves two memberships");
        ids[0].assertEq(firstProposerAction, "first proposer stays at zero");
        ids[1].assertEq(secondProposerAction, "last proposer swaps into middle");

        executor.cancelGovernanceAction(firstProposerAction, keccak256("remove first proposer"));
        _assertTerminalUsage(scope, proposer, 1, 1, 1);
        (ids,,) = executor.terminalFreezeActionPage(scope, 0, 64);
        ids[0].assertEq(secondProposerAction, "moved proposer remains indexed");
        executor.cancelGovernanceAction(secondProposerAction, keccak256("remove last proposer"));
        _assertTerminalUsage(scope, proposer, 0, 0, 0);
    }

    function testLaterScopeQuotaFailureRollsBackEarlierScopeCompaction() public {
        _grantGlobalVetoGuardian();
        _setProposer(proposer, true);
        bytes32 scopeA = keccak256("terminal-rollback-a");
        bytes32 scopeB = keccak256("terminal-rollback-b");
        uint64 elapsedDeadline = uint64(block.timestamp) + 72 hours;
        bytes32 elapsedAction = _scheduleFreezeAs(proposer, scopeA, elapsedDeadline);
        (,, uint256 proposerCap) = executor.terminalFreezeLiveActionCaps();
        uint64 longDeadline = uint64(block.timestamp) + 300 days;
        for (uint256 i = 0; i < proposerCap; i++) {
            _scheduleFreezeAs(proposer, scopeB, longDeadline);
        }
        vm.warp(elapsedDeadline);
        _assertTerminalUsage(scopeA, proposer, 1, 1, 1);
        _assertTerminalUsage(scopeB, proposer, proposerCap, proposerCap, proposerCap);
        uint256 pendingBefore = executor.pendingScheduledActionCount();
        uint256 nonceBefore = executor.governanceNonce();

        (GovernanceCall[] memory calls, bytes[] memory callDatas) =
            _twoScopeFreezeBatch(scopeA, scopeB);
        executor.publishGovernanceCallData(callDatas);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.TerminalFreezeProposerLiveActionCapExceeded.selector,
                scopeB,
                proposer,
                proposerCap
            )
        );
        _schedulePublishedAs(
            proposer,
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            longDeadline,
            longDeadline + 7 days
        );

        executor.pendingScheduledActionCount()
            .assertEq(pendingBefore, "failed multi-scope schedule rolls back pending count");
        executor.governanceNonce()
            .assertEq(nonceBefore, "failed multi-scope schedule rolls back nonce");
        _assertTerminalUsage(scopeA, proposer, 1, 1, 1);
        _assertTerminalUsage(scopeB, proposer, proposerCap, proposerCap, proposerCap);
        (bytes32[] memory ids,,) = executor.terminalFreezeActionPage(scopeA, 0, 64);
        ids.length.assertEq(1, "earlier scope compaction rolled back");
        ids[0].assertEq(elapsedAction, "elapsed membership remains raw-indexed after rollback");
    }

    function testTerminalFreezeRootCapacitySnapshotSurvivesRootRotation() public {
        _grantGlobalVetoGuardian();
        _setProposer(proposer, true);
        bytes32 scope = keccak256("terminal-root-rotation-capacity");
        uint64 deadline = uint64(block.timestamp) + 300 days;
        bytes32 oldRootAction = _scheduleFreeze(scope, deadline);
        bytes32 proposerAction = _scheduleFreezeAs(proposer, scope, deadline);
        _assertTerminalUsage(scope, proposer, 2, 1, 1);

        StreamGovernanceRootMock newRoot = new StreamGovernanceRootMock();
        _rotateGovernanceRootForTest(newRoot);
        bytes32 newRootAction = _scheduleFreezeAs(address(newRoot), scope, deadline);
        _assertTerminalUsage(scope, proposer, 3, 1, 1);

        vm.prank(address(newRoot));
        executor.cancelGovernanceAction(oldRootAction, keccak256("old root queued action"));
        _assertTerminalUsage(scope, proposer, 2, 1, 1);
        vm.prank(address(newRoot));
        executor.cancelGovernanceAction(newRootAction, keccak256("new root action"));
        _assertTerminalUsage(scope, proposer, 1, 1, 1);
        vm.prank(address(newRoot));
        executor.cancelGovernanceAction(proposerAction, keccak256("proposer action"));
        _assertTerminalUsage(scope, proposer, 0, 0, 0);
    }

    function _assertTerminalUsage(
        bytes32 scope,
        address actor,
        uint256 expectedTotal,
        uint256 expectedNonRoot,
        uint256 expectedProposer
    ) private view {
        (uint256 total, uint256 nonRoot, uint256 proposerCount) =
            executor.terminalFreezeLiveActionUsage(scope, actor);
        total.assertEq(expectedTotal, "terminal total usage");
        nonRoot.assertEq(expectedNonRoot, "terminal non-root usage");
        proposerCount.assertEq(expectedProposer, "terminal proposer usage");
    }

    function _rotateGovernanceRootForTest(StreamGovernanceRootMock newRoot) private {
        (address oldRoot, bytes32 oldCodeHash, uint64 oldRevision) = executor.governanceRootState();
        bytes32 scopeHash = keccak256(
            abi.encode(GOVERNANCE_ROOT_SCOPE_V1, uint256(block.chainid), address(executor))
        );
        bytes32 oldStateHash = keccak256(
            abi.encode(
                GOVERNANCE_ROOT_STATE_V1,
                uint256(block.chainid),
                address(executor),
                oldRoot,
                oldCodeHash,
                oldRevision
            )
        );
        bytes32 newStateHash = keccak256(
            abi.encode(
                GOVERNANCE_ROOT_STATE_V1,
                uint256(block.chainid),
                address(executor),
                address(newRoot),
                address(newRoot).codehash,
                oldRevision + 1
            )
        );
        _executeConfigCall(
            StreamGovernanceActionClasses.POINTER_REPLACEMENT,
            abi.encodeCall(
                StreamGovernanceExecutor.rotateGovernanceRoot,
                (address(newRoot), address(newRoot).codehash)
            ),
            scopeHash,
            oldStateHash,
            newStateHash
        );
    }

    function testLiveSetPrunedOnEveryTerminalTransition() public {
        _grantGlobalVetoGuardian();
        uint64 d1 = uint64(block.timestamp) + 72 hours;
        uint64 d2 = uint64(block.timestamp) + 80 hours;
        uint64 d3 = uint64(block.timestamp) + 90 hours;
        uint64 d4 = uint64(block.timestamp) + 100 hours;
        bytes32 a1 = _scheduleFreeze(SCOPE, d1);
        bytes32 a2 = _scheduleFreeze(SCOPE, d2);
        bytes32 a3 = _scheduleFreeze(SCOPE, d3);
        bytes32 a4 = _scheduleFreeze(SCOPE, d4);
        executor.liveTerminalFreezeActionCount(SCOPE).assertEq(4, "four live");

        // Veto prunes a1.
        vm.prank(guardian);
        executor.vetoTerminalFreeze(a1, keccak256("veto"));
        executor.liveTerminalFreezeActionCount(SCOPE).assertEq(3, "after veto");

        // Cancel prunes a2.
        executor.cancelGovernanceAction(a2, keccak256("cancel"));
        executor.liveTerminalFreezeActionCount(SCOPE).assertEq(2, "after cancel");

        // Execute prunes a3.
        (GovernanceCall[] memory calls, bytes[] memory callDatas) =
            _singleCall(0, abi.encodeCall(GovernedTargetMock.setValue, (uint256(0xFEE1))));
        vm.warp(d3);
        executor.executeGovernanceBatch(a3, calls, callDatas);
        executor.liveTerminalFreezeActionCount(SCOPE).assertEq(1, "after execute");

        // Materialized expiry prunes a4.
        (GovernanceAction memory a4Action) = executor.governanceAction(a4);
        vm.warp(uint256(a4Action.expiresAfter) + 1);
        executor.materializeExpiredAction(a4);
        executor.liveTerminalFreezeActionCount(SCOPE).assertEq(0, "after expiry");

        // With no live actions the deadline is zero.
        (, uint64 vetoDeadline) = executor.terminalFreezeVetoGuardian(SCOPE);
        uint256(vetoDeadline).assertEq(0, "no live freezes -> zero deadline");
    }

    function testSealedBootstrapStartsWithRedundantVetoGuardians() public {
        (uint256 holderCount, uint256 contractHolderCount) =
            roleRegistry.roleRedundancy(StreamRoles.ROLE_TERMINAL_FREEZE_VETO);
        holderCount.assertEq(2, "two bootstrap veto guardians retained");
        contractHolderCount.assertEq(2, "bootstrap veto guardians are contracts");

        bytes memory callData = abi.encodeCall(GovernedTargetMock.setValue, (1));
        (GovernanceCall[] memory calls, bytes[] memory callDatas) = _singleCall(0, callData);
        executor.publishGovernanceCallData(callDatas);
        uint64 notBefore = uint64(block.timestamp) + 72 hours;
        bytes32 actionId = _scheduleClass(
            StreamGovernanceActionClasses.TERMINAL_FREEZE, calls, notBefore, notBefore + 7 days
        );
        uint256(uint8(executor.governanceAction(actionId).status))
            .assertEq(
                uint256(uint8(GovernanceActionStatus.SCHEDULED)),
                "scheduled with redundant global guardians"
            );
    }

    function testTerminalFreezeGuardianFloorCannotBeDrainedDuringLiveAction() public {
        _grantGlobalVetoGuardian();
        bytes32 freezeScope = keccak256("freeze-scope");
        uint64 notBefore = uint64(block.timestamp) + 72 hours;
        _scheduleFreeze(freezeScope, notBefore);

        vm.expectRevert(
            abi.encodeWithSelector(IStreamRoleRegistry.TerminalFreezeVetoGuardianFloor.selector, 2)
        );
        vm.prank(address(executor));
        roleRegistry.revokeRole(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, guardian);
        roleRegistry.roleHolderCount(StreamRoles.ROLE_TERMINAL_FREEZE_VETO)
            .assertEq(2, "guardian floor remains intact");

        (address resolvedGuardian, uint64 vetoDeadline) =
            executor.terminalFreezeVetoGuardian(freezeScope);
        resolvedGuardian.assertEq(address(0), "redundant guardian set uses sentinel resolution");
        uint256(vetoDeadline).assertEq(uint256(notBefore), "live deadline still visible");
    }

    function testPerScopeVetoAuthorityAndGlobalFallback() public {
        address scopeGuardian = address(new StreamGovernanceRootMock());
        // The scoped holder is additive to the redundant global set.
        _grantScopedRoleViaGovernance(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, SCOPE, scopeGuardian);

        uint64 notBefore = uint64(block.timestamp) + 72 hours;
        bytes32 actionId = _scheduleFreeze(SCOPE, notBefore);

        (address resolvedGuardian,) = executor.terminalFreezeVetoGuardian(SCOPE);
        resolvedGuardian.assertEq(
            address(0), "additive scoped and global guardian set uses sentinel"
        );
        (
            address guardianRegistry,
            bytes32 scopedRole,
            uint256 scopedHolderCount,
            bytes32 globalRole,
            uint256 globalHolderCount,
            uint64 discoveredDeadline
        ) = executor.terminalFreezeVetoGuardianSet(SCOPE);
        guardianRegistry.assertEq(address(roleRegistry), "guardian registry discoverable");
        scopedRole.assertEq(executor.terminalFreezeVetoRole(SCOPE), "scoped role discoverable");
        scopedHolderCount.assertEq(1, "one scoped holder discoverable");
        globalRole.assertEq(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, "global role discoverable");
        globalHolderCount.assertEq(2, "redundant global holders discoverable");
        uint256(discoveredDeadline).assertEq(uint256(notBefore), "set view includes deadline");

        // A stranger cannot veto.
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.NotTerminalFreezeVetoGuardian.selector, stranger
            )
        );
        vm.prank(stranger);
        executor.vetoTerminalFreeze(actionId, keccak256("no"));

        // The per-scope holder can veto.
        vm.prank(scopeGuardian);
        executor.vetoTerminalFreeze(actionId, keccak256("scope veto"));
        executor.governanceAction(actionId).vetoer.assertEq(scopeGuardian, "scope holder vetoed");

        // Now a second scope with only a GLOBAL holder: the global holder may
        // veto any scope (fallback), proving global authority is additive.
        _grantGlobalVetoGuardian();
        bytes32 otherScope = keccak256("other-scope");
        uint64 nb2 = uint64(block.timestamp) + 72 hours;
        bytes32 action2 = _scheduleFreeze(otherScope, nb2);
        (address resolved2,) = executor.terminalFreezeVetoGuardian(otherScope);
        resolved2.assertEq(address(0), "redundant global fallback uses sentinel resolution");
        vm.prank(guardian);
        executor.vetoTerminalFreeze(action2, keccak256("global veto"));
        executor.governanceAction(action2).vetoer.assertEq(guardian, "global holder vetoed");
    }

    function testTerminalFreezeIndexesDistinctPerCallScopesAndAnyScopedGuardianCanVeto() public {
        bytes32 scopeA = keccak256("terminal-scope-a");
        bytes32 scopeB = keccak256("terminal-scope-b");
        address guardianB = address(new StreamGovernanceRootMock());
        GovernedTargetMock second = new GovernedTargetMock();
        bytes[] memory callDatas = new bytes[](3);
        callDatas[0] = abi.encodeCall(GovernedTargetMock.setValue, (1));
        callDatas[1] = abi.encodeCall(GovernedTargetMock.setValue, (2));
        callDatas[2] = abi.encodeCall(GovernedTargetMock.setValue, (3));
        GovernanceCall[] memory calls = new GovernanceCall[](3);
        calls[0] = GovernanceCall({
            target: address(target),
            value: 0,
            selector: GovernedTargetMock.setValue.selector,
            callDataHash: keccak256(callDatas[0]),
            scopeHash: scopeA,
            oldValueHash: keccak256("a-old-1"),
            newValueHash: keccak256("a-new-1")
        });
        calls[1] = GovernanceCall({
            target: address(second),
            value: 0,
            selector: GovernedTargetMock.setValue.selector,
            callDataHash: keccak256(callDatas[1]),
            scopeHash: scopeA,
            oldValueHash: keccak256("a-old-2"),
            newValueHash: keccak256("a-new-2")
        });
        calls[2] = GovernanceCall({
            target: address(second),
            value: 0,
            selector: GovernedTargetMock.setValue.selector,
            callDataHash: keccak256(callDatas[2]),
            scopeHash: scopeB,
            oldValueHash: keccak256("b-old"),
            newValueHash: keccak256("b-new")
        });
        executor.publishGovernanceCallData(callDatas);
        _grantScopedRoleViaGovernance(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scopeA, guardian);
        uint64 notBefore = uint64(block.timestamp) + 72 hours;
        bytes32 fallbackActionId = _scheduleClass(
            StreamGovernanceActionClasses.TERMINAL_FREEZE, calls, notBefore, notBefore + 7 days
        );
        executor.liveTerminalFreezeActionCount(scopeA).assertEq(1, "scope a indexed");
        executor.liveTerminalFreezeActionCount(scopeB).assertEq(1, "global fallback covers scope b");
        vm.prank(guardian);
        executor.vetoTerminalFreeze(fallbackActionId, keccak256("global fallback veto"));
        executor.liveTerminalFreezeActionCount(scopeA).assertEq(0, "fallback action pruned a");
        executor.liveTerminalFreezeActionCount(scopeB).assertEq(0, "fallback action pruned b");

        _grantScopedRoleViaGovernance(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scopeB, guardianB);
        notBefore = uint64(block.timestamp) + 72 hours;
        bytes32 actionId = _scheduleClass(
            StreamGovernanceActionClasses.TERMINAL_FREEZE, calls, notBefore, notBefore + 7 days
        );
        executor.liveTerminalFreezeActionCount(scopeA).assertEq(1, "duplicate scope indexed once");
        executor.liveTerminalFreezeActionCount(scopeB).assertEq(1, "second scope indexed");
        vm.prank(guardianB);
        executor.vetoTerminalFreeze(actionId, keccak256("scope-b veto"));
        executor.liveTerminalFreezeActionCount(scopeA).assertEq(0, "scope a pruned");
        executor.liveTerminalFreezeActionCount(scopeB).assertEq(0, "scope b pruned");
    }

    function testTerminalFreezeManifestTailBatchIndexesTriggerAndTailScopes() public {
        bytes32 triggerScope = keccak256("terminal-trigger-scope");
        bytes32 tailScope = keccak256("terminal-tail-scope");
        address tailGuardian = address(new StreamGovernanceRootMock());
        _grantScopedRoleViaGovernance(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, triggerScope, guardian);
        _grantScopedRoleViaGovernance(
            StreamRoles.ROLE_TERMINAL_FREEZE_VETO, tailScope, tailGuardian
        );
        StreamGovernanceEvidence.ManifestUpdate memory update =
            StreamGovernanceEvidence.ManifestUpdate({
                manifestHash: bootstrap.manifestHash,
                manifestURI: "ipfs://terminal-tail",
                eventCatalogHash: keccak256("tail-events"),
                compatibilityMatrixHash: keccak256("tail-compatibility"),
                numericIdCatalogHash: keccak256("tail-numeric"),
                schemaCatalogHash: keccak256("tail-schema"),
                canonicalizationCatalogHash: keccak256("tail-canonicalization"),
                specBundleHash: keccak256("tail-spec"),
                reconstructionClientHash: keccak256("tail-client")
            });
        bytes[] memory callDatas = new bytes[](2);
        callDatas[0] =
            abi.encodeCall(StreamGovernanceBootstrapTriggerMock.bootstrapWrite, (uint256(77)));
        callDatas[1] = abi.encodeWithSelector(bytes4(0x09b1b5c6), bootstrap.payloadRoot, update);
        GovernanceCall[] memory calls = new GovernanceCall[](2);
        calls[0] = GovernanceCall({
            target: address(bootstrap.trigger),
            value: 0,
            selector: StreamGovernanceBootstrapTriggerMock.bootstrapWrite.selector,
            callDataHash: keccak256(callDatas[0]),
            scopeHash: triggerScope,
            oldValueHash: keccak256("trigger-old"),
            newValueHash: keccak256("trigger-new")
        });
        calls[1] = GovernanceCall({
            target: address(bootstrap.manifest),
            value: 0,
            selector: bytes4(0x09b1b5c6),
            callDataHash: keccak256(callDatas[1]),
            scopeHash: tailScope,
            oldValueHash: keccak256("tail-old"),
            newValueHash: keccak256("tail-new")
        });
        uint64 notBefore = uint64(block.timestamp) + 72 hours;
        bytes32 actionId = _schedule(
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            calls,
            callDatas,
            notBefore,
            notBefore + 7 days
        );
        executor.liveTerminalFreezeActionCount(triggerScope).assertEq(1, "trigger scope indexed");
        executor.liveTerminalFreezeActionCount(tailScope).assertEq(1, "tail scope indexed");
        vm.prank(tailGuardian);
        executor.vetoTerminalFreeze(actionId, keccak256("tail scope veto"));
        executor.liveTerminalFreezeActionCount(triggerScope).assertEq(0, "trigger scope pruned");
        executor.liveTerminalFreezeActionCount(tailScope).assertEq(0, "tail scope pruned");
    }

    function testTerminalFreezeVetoRoleDerivation() public view {
        // Per-scope role is keccak256(ROLE_TERMINAL_FREEZE_VETO, scopeHash).
        executor.terminalFreezeVetoRole(SCOPE)
            .assertEq(
                keccak256(abi.encode(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, SCOPE)),
                "per-scope veto role derivation"
            );
        (executor.terminalFreezeVetoRole(SCOPE)
                != executor.terminalFreezeVetoRole(keccak256("other")))
        .assertTrue("distinct scopes yield distinct roles");
    }

    function testMultipleGlobalHoldersReturnSentinel() public {
        // Two global holders: single-address resolution is ambiguous, so the
        // view returns the zero-address sentinel (enumeration remains the
        // authoritative path).
        roleRegistry.roleHolderCount(StreamRoles.ROLE_TERMINAL_FREEZE_VETO)
            .assertEq(2, "bootstrap guardian set is redundant");
        uint64 notBefore = uint64(block.timestamp) + 72 hours;
        _scheduleFreeze(SCOPE, notBefore);
        (address resolvedGuardian, uint64 vetoDeadline) = executor.terminalFreezeVetoGuardian(SCOPE);
        resolvedGuardian.assertEq(address(0), "ambiguous global holders -> sentinel");
        uint256(vetoDeadline).assertEq(uint256(notBefore), "deadline still surfaced");
    }
}
