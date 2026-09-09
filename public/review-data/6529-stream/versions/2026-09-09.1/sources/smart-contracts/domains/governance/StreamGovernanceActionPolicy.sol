// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../interfaces/stream/IStreamGovernanceExecutor.sol";

/// @notice Closed-world Governance V2 action and native-value policy.
/// @dev The catalog is materialized once during bootstrap, has no mutation
///      entrypoint, and stores a commitment for every selected-entry proof.
///      Scheduling and execution both verify the bound catalog commitment plus
///      every selected entry's immutable hash, exact live target, and value
///      policy. Public functions execute by DELEGATECALL from
///      `StreamGovernanceExecutor`, so the catalog commitment is
///      domain-separated by the exact Executor.
library StreamGovernanceActionPolicy {
    uint16 private constant SCHEMA_VERSION = 1;
    // The bootstrap trigger table can contain 128 selectors, each admitted for
    // all four pre-seal classes, in addition to the fixed governance surfaces.
    uint256 private constant MAX_ACTION_POLICY_ENTRIES = 1_024;

    uint8 internal constant CALL_TYPE_DIRECT = 1;
    uint8 internal constant CALL_TYPE_NATIVE_TRANSFER = 2;
    uint8 internal constant VALUE_POLICY_ZERO = 0;
    uint8 internal constant VALUE_POLICY_EXACT = 1;
    uint8 internal constant VALUE_POLICY_BOUNDED = 2;

    bytes32 internal constant VALUE_SEMANTICS_CALLER_EXACT_TARGET_ATOMIC_V1 =
        keccak256("6529STREAM_NATIVE_VALUE_CALLER_EXACT_TARGET_ATOMIC_REVERT_SURPLUS_V1");

    bytes32 private constant ACTION_POLICY_ENTRY_V1 =
        keccak256("6529STREAM_GOVERNANCE_ACTION_POLICY_ENTRY_V1");
    bytes32 private constant ACTION_POLICY_CHAIN_V1 =
        keccak256("6529STREAM_GOVERNANCE_ACTION_POLICY_CHAIN_V1");
    bytes32 private constant ACTION_POLICY_CATALOG_V1 =
        keccak256("6529STREAM_GOVERNANCE_ACTION_POLICY_CATALOG_V1");

    struct State {
        bool bound;
        bytes32 candidateProfileHash;
        bytes32 catalogHash;
        GovernanceActionPolicyEntry[] entries;
        mapping(bytes32 => uint256) entryIndexPlusOne;
        mapping(bytes32 => bytes32) entryHashes;
    }

    event GovernanceActionPolicyBound(
        uint16 schemaVersion,
        bytes32 indexed candidateProfileHash,
        bytes32 indexed catalogHash,
        uint256 entryCount
    );

    function bind(
        State storage state,
        bytes32 candidateProfileHash,
        bytes32 expectedHash,
        GovernanceActionPolicyEntry[] calldata entries
    ) public {
        if (state.bound) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        if (candidateProfileHash == bytes32(0)) {
            revert IStreamGovernanceExecutor.InvalidGovernanceActionPolicyCandidate(candidateProfileHash);
        }
        if (entries.length == 0 || entries.length > MAX_ACTION_POLICY_ENTRIES) {
            revert IStreamGovernanceExecutor.InvalidGovernanceActionPolicyEntry(entries.length);
        }

        bytes32 chainHash = bytes32(0);
        bytes32 priorKey = bytes32(0);
        for (uint256 i = 0; i < entries.length; i++) {
            GovernanceActionPolicyEntry calldata entry = entries[i];
            _validateEntry(entry, i, true);
            bytes32 key = policyKey(entry.actionClass, entry.target, entry.selector);
            if (i != 0 && uint256(priorKey) >= uint256(key)) {
                revert IStreamGovernanceExecutor.GovernanceActionPolicyEntriesNotSorted(i);
            }
            priorKey = key;
            state.entries.push(entry);
            state.entryIndexPlusOne[key] = i + 1;
            bytes32 entryHash = _entryHash(entry, i);
            state.entryHashes[key] = entryHash;
            chainHash = _appendEntryHash(chainHash, entryHash, i);
        }

        bytes32 catalogHash =
            _catalogHash(address(this), candidateProfileHash, entries.length, chainHash);
        if (expectedHash == bytes32(0) || catalogHash != expectedHash) {
            revert IStreamGovernanceExecutor.GovernanceActionPolicyCatalogHashMismatch(
                expectedHash, catalogHash
            );
        }
        state.bound = true;
        state.candidateProfileHash = candidateProfileHash;
        state.catalogHash = catalogHash;
        emit GovernanceActionPolicyBound(
            SCHEMA_VERSION, candidateProfileHash, catalogHash, entries.length
        );
    }

    function validateCalls(
        State storage state,
        bytes32 expectedCandidateProfileHash,
        bytes32 manifestCatalogHash,
        uint256 expectedEntryCount,
        uint8 actionClass,
        GovernanceCall[] memory calls,
        bytes[] memory callDatas
    ) public view {
        _requireBoundCatalog(
            state, expectedCandidateProfileHash, manifestCatalogHash, expectedEntryCount
        );
        for (uint256 i = 0; i < calls.length; i++) {
            _validateCall(state, actionClass, calls[i], callDatas[i], i);
        }
    }

    function expectedCatalogHash(
        address executor,
        bytes32 candidateProfileHash,
        GovernanceActionPolicyEntry[] memory entries
    ) public view returns (bytes32 catalogHash) {
        if (executor == address(0) || candidateProfileHash == bytes32(0)) {
            revert IStreamGovernanceExecutor.InvalidGovernanceActionPolicyCandidate(candidateProfileHash);
        }
        if (entries.length == 0 || entries.length > MAX_ACTION_POLICY_ENTRIES) {
            revert IStreamGovernanceExecutor.InvalidGovernanceActionPolicyEntry(entries.length);
        }
        bytes32 chainHash = bytes32(0);
        bytes32 priorKey = bytes32(0);
        for (uint256 i = 0; i < entries.length; i++) {
            GovernanceActionPolicyEntry memory entry = entries[i];
            _validateEntry(entry, i, false);
            bytes32 key = policyKey(entry.actionClass, entry.target, entry.selector);
            if (i != 0 && uint256(priorKey) >= uint256(key)) {
                revert IStreamGovernanceExecutor.GovernanceActionPolicyEntriesNotSorted(i);
            }
            priorKey = key;
            chainHash = _appendEntryHash(chainHash, _entryHash(entry, i), i);
        }
        return _catalogHash(executor, candidateProfileHash, entries.length, chainHash);
    }

    function _requireBoundCatalog(
        State storage state,
        bytes32 expectedCandidateProfileHash,
        bytes32 manifestCatalogHash,
        uint256 expectedEntryCount
    ) private view {
        uint256 count = state.entries.length;
        if (
            !state.bound || state.candidateProfileHash == bytes32(0)
                || state.catalogHash == bytes32(0) || count == 0
                || count > MAX_ACTION_POLICY_ENTRIES
        ) revert IStreamGovernanceExecutor.GovernanceActionPolicyNotBound();
        if (state.candidateProfileHash != expectedCandidateProfileHash) {
            revert IStreamGovernanceExecutor.InvalidGovernanceActionPolicyCandidate(state.candidateProfileHash);
        }
        if (state.catalogHash != manifestCatalogHash) {
            revert IStreamGovernanceExecutor.GovernanceActionPolicyCatalogHashMismatch(
                manifestCatalogHash, state.catalogHash
            );
        }
        if (count != expectedEntryCount) {
            revert IStreamGovernanceExecutor.InvalidGovernanceActionPolicyEntry(count);
        }
    }

    function _validateCall(
        State storage state,
        uint8 actionClass,
        GovernanceCall memory call_,
        bytes memory callData,
        uint256 callIndex
    ) private view {
        bytes32 key = policyKey(actionClass, call_.target, call_.selector);
        uint256 indexPlusOne = state.entryIndexPlusOne[key];
        if (indexPlusOne == 0 || indexPlusOne > state.entries.length) {
            revert IStreamGovernanceExecutor.GovernanceActionPolicyUnknown(
                callIndex, actionClass, call_.target, call_.selector
            );
        }
        GovernanceActionPolicyEntry storage entry = state.entries[indexPlusOne - 1];
        if (
            entry.actionClass != actionClass || entry.target != call_.target
                || entry.selector != call_.selector
        ) {
            revert IStreamGovernanceExecutor.GovernanceActionPolicyUnknown(
                callIndex, actionClass, call_.target, call_.selector
            );
        }
        GovernanceActionPolicyEntry memory entryCopy = entry;
        bytes32 expectedEntryHash = state.entryHashes[key];
        bytes32 actualEntryHash = _entryHash(entryCopy, indexPlusOne - 1);
        if (expectedEntryHash == bytes32(0) || actualEntryHash != expectedEntryHash) {
            revert IStreamGovernanceExecutor.GovernanceActionPolicyEntryHashMismatch(
                callIndex, expectedEntryHash, actualEntryHash
            );
        }

        uint8 actualCallType = callData.length == 0 ? CALL_TYPE_NATIVE_TRANSFER : CALL_TYPE_DIRECT;
        if (entry.callType != actualCallType) {
            revert IStreamGovernanceExecutor.GovernanceActionPolicyCallTypeMismatch(
                callIndex, entry.callType, actualCallType
            );
        }
        if (actualCallType == CALL_TYPE_DIRECT) {
            bytes32 actualCodeHash = call_.target.codehash;
            if (
                actualCodeHash == bytes32(0) || actualCodeHash != entry.targetCodeHash
                    || _isEip7702DelegatedEOA(call_.target)
            ) {
                revert IStreamGovernanceExecutor.GovernanceActionPolicyTargetCodeHashMismatch(
                    callIndex, call_.target, entry.targetCodeHash, actualCodeHash
                );
            }
        } else if (entry.targetCodeHash == bytes32(0)) {
            if (call_.target.code.length != 0) {
                revert IStreamGovernanceExecutor.GovernanceActionPolicyCallTypeMismatch(
                    callIndex, entry.callType, CALL_TYPE_DIRECT
                );
            }
        } else {
            bytes32 actualCodeHash = call_.target.codehash;
            if (actualCodeHash != entry.targetCodeHash || _isEip7702DelegatedEOA(call_.target)) {
                revert IStreamGovernanceExecutor.GovernanceActionPolicyTargetCodeHashMismatch(
                    callIndex, call_.target, entry.targetCodeHash, actualCodeHash
                );
            }
        }
        _validateValue(entry.valuePolicy, call_.value, entry.valueLimit, callIndex);
    }

    function policyKey(uint8 actionClass, address target, bytes4 selector)
        private
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(actionClass, target, selector));
    }

    function _validateEntry(
        GovernanceActionPolicyEntry memory entry,
        uint256 index,
        bool requireLiveTarget
    ) private view {
        if (
            entry.actionClass > StreamGovernanceActionClasses.SUCCESSOR_DECLARATION
                || entry.target == address(0) || entry.targetProfileHash == bytes32(0)
        ) revert IStreamGovernanceExecutor.InvalidGovernanceActionPolicyEntry(index);
        if (entry.callType == CALL_TYPE_DIRECT) {
            if (
                entry.selector == bytes4(0) || entry.targetCodeHash == bytes32(0)
                    || (requireLiveTarget
                        && (entry.target.code.length == 0
                            || entry.target.codehash != entry.targetCodeHash
                            || _isEip7702DelegatedEOA(entry.target)))
            ) revert IStreamGovernanceExecutor.InvalidGovernanceActionPolicyEntry(index);
        } else {
            if (
                entry.callType != CALL_TYPE_NATIVE_TRANSFER || entry.selector != bytes4(0)
                    || entry.valuePolicy == VALUE_POLICY_ZERO
            ) revert IStreamGovernanceExecutor.InvalidGovernanceActionPolicyEntry(index);
            if (requireLiveTarget) {
                if (entry.targetCodeHash == bytes32(0)
                        ? entry.target.code.length != 0
                        : (entry.target.code.length == 0
                                || entry.target.codehash != entry.targetCodeHash
                                || _isEip7702DelegatedEOA(entry.target))) revert IStreamGovernanceExecutor.InvalidGovernanceActionPolicyEntry(index);
            }
        }
        _validateValueShape(entry, index);
    }

    function _validateValueShape(GovernanceActionPolicyEntry memory entry, uint256 index)
        private
        pure
    {
        if (entry.valuePolicy == VALUE_POLICY_ZERO) {
            if (entry.valueLimit != 0 || entry.valueSemanticsHash != bytes32(0)) {
                revert IStreamGovernanceExecutor.InvalidGovernanceActionPolicyEntry(index);
            }
            return;
        }
        if (
            (entry.valuePolicy != VALUE_POLICY_EXACT && entry.valuePolicy != VALUE_POLICY_BOUNDED)
                || entry.valueLimit == 0
                || entry.valueSemanticsHash != VALUE_SEMANTICS_CALLER_EXACT_TARGET_ATOMIC_V1
        ) revert IStreamGovernanceExecutor.InvalidGovernanceActionPolicyEntry(index);
    }

    function _validateValue(uint8 valuePolicy, uint256 value, uint256 valueLimit, uint256 callIndex)
        private
        pure
    {
        bool accepted = valuePolicy == VALUE_POLICY_ZERO
            ? value == 0
            : valuePolicy == VALUE_POLICY_EXACT
                ? value == valueLimit
                : valuePolicy == VALUE_POLICY_BOUNDED && value != 0 && value <= valueLimit;
        if (!accepted) {
            revert IStreamGovernanceExecutor.GovernanceActionPolicyValueRejected(
                callIndex, valuePolicy, value, valueLimit
            );
        }
    }

    function _entryHash(GovernanceActionPolicyEntry memory entry, uint256 index)
        private
        pure
        returns (bytes32)
    {
        // The catalog is bounded to 1,024 entries, so its index fits uint64.
        // forge-lint: disable-next-line(unsafe-typecast)
        return keccak256(abi.encode(ACTION_POLICY_ENTRY_V1, uint64(index), entry));
    }

    function _appendEntryHash(bytes32 chainHash, bytes32 entryHash, uint256 index)
        private
        pure
        returns (bytes32)
    {
        // forge-lint: disable-next-line(unsafe-typecast)
        return keccak256(abi.encode(ACTION_POLICY_CHAIN_V1, chainHash, entryHash, uint64(index)));
    }

    function _catalogHash(
        address executor,
        bytes32 candidateProfileHash,
        uint256 entryCount,
        bytes32 chainHash
    ) private view returns (bytes32) {
        // The catalog is bounded to 1,024 entries, so its count fits uint64.
        // forge-lint: disable-next-line(unsafe-typecast)
        return keccak256(
            abi.encode(
                ACTION_POLICY_CATALOG_V1,
                uint256(block.chainid),
                executor,
                candidateProfileHash,
                uint64(entryCount),
                chainHash
            )
        );
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
}
