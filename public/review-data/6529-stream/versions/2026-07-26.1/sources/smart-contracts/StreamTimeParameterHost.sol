// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IStreamGovernedParameterAuthority.sol";
import "./IStreamTimeParameterHost.sol";

/// @notice Reusable launch-v1 Governed Time Parameter host.
/// @dev The parameter inventory is fixed during construction. Values may only
///      increase through an exact delayed Governance-V2 context and each step
///      is bounded to at most twice the current value.
abstract contract StreamTimeParameterHost is IStreamTimeParameterHost {
    uint16 public constant TIME_PARAMETER_SCHEMA_VERSION = 2;

    bytes32 private constant _TIME_PARAMETER_SCOPE_DOMAIN_V2 =
        0xd14cc3d71aa1ccb50b6f723d516042b10a7ef31958f86ccb049a09dbcfefff24;
    bytes32 private constant _TIME_PARAMETER_STATE_DOMAIN_V2 =
        0x26290762a61f3dda3fad05a62e5a95dcb1c59db2eaf506cb363c2aa2ab7b8384;

    uint8 private constant _ACTION_CLASS_DELAYED_LOOSENING = 1;

    struct TimeParameterData {
        uint256 value;
        uint256 floorBlocks;
        uint64 wallClockFloorSeconds;
        uint64 revision;
        // Auxiliary same-action consumption guard; intentionally outside _stateHash.
        bytes32 lastActionId;
    }

    address public immutable override governanceAuthority;

    mapping(bytes32 => TimeParameterData) internal _timeParameters;
    bytes32[] private _timeParameterIds;

    /// @param authority Canonical Governance-V2 executor, or zero to make every
    ///        parameter immutable after construction.
    constructor(address authority) {
        if (
            authority != address(0)
                && (_isEip7702DelegatedEOA(authority)
                    || !_hasCanonicalAuthorityMarker(authority)
                    || !_hasCanonicalAuthorityContext(authority))
        ) {
            revert TimeParameterInvalidAuthority(authority);
        }
        governanceAuthority = authority;
    }

    /// @dev Constructor-only registration hook for embedding hosts.
    function _registerTimeParameter(TimeParameterConfig memory config)
        internal
        returns (bytes32 parameterId)
    {
        if (bytes(config.name).length == 0) {
            revert TimeParameterInvalidConfig(bytes32(0));
        }
        parameterId = keccak256(abi.encodePacked("6529STREAM_GTP_", config.name));

        TimeParameterData storage parameter = _timeParameters[parameterId];
        if (parameter.revision != 0) {
            revert TimeParameterAlreadyRegistered(parameterId);
        }
        if (
            config.floorBlocks == 0 || config.genesisValue < config.floorBlocks
                || config.wallClockFloorSeconds == 0
        ) {
            revert TimeParameterInvalidConfig(parameterId);
        }

        parameter.value = config.genesisValue;
        parameter.floorBlocks = config.floorBlocks;
        parameter.wallClockFloorSeconds = config.wallClockFloorSeconds;
        parameter.revision = 1;
        _timeParameterIds.push(parameterId);

        emit TimeParameterRegistered(
            TIME_PARAMETER_SCHEMA_VERSION,
            parameterId,
            config.name,
            config.genesisValue,
            config.floorBlocks,
            config.wallClockFloorSeconds
        );
    }

    /// @inheritdoc IStreamTimeParameterHost
    function timeParameterInfo(bytes32 parameterId)
        external
        view
        override
        returns (uint256 value, uint256 floorBlocks, uint64 wallClockFloorSeconds, uint64 revision)
    {
        TimeParameterData storage parameter = _timeParameters[parameterId];
        return (
            parameter.value,
            parameter.floorBlocks,
            parameter.wallClockFloorSeconds,
            parameter.revision
        );
    }

    /// @inheritdoc IStreamTimeParameterHost
    function timeParameter(bytes32 parameterId) public view override returns (uint256 value) {
        TimeParameterData storage parameter = _requireRegistered(parameterId);
        return parameter.value;
    }

    /// @inheritdoc IStreamTimeParameterHost
    function timeParameterIds() external view override returns (bytes32[] memory) {
        return _timeParameterIds;
    }

    /// @inheritdoc IStreamTimeParameterHost
    function raiseTimeParameter(bytes32 parameterId, uint256 newValue) external override {
        _requireAuthorityCaller();
        TimeParameterData storage parameter = _requireRegistered(parameterId);
        uint256 oldValue = parameter.value;
        if (newValue <= oldValue) {
            revert TimeParameterNotARaise(parameterId, oldValue, newValue);
        }
        if (newValue - oldValue > oldValue) {
            revert TimeParameterRaiseBoundExceeded(parameterId, oldValue, newValue);
        }

        uint64 nextRevision = _nextRevision(parameterId, parameter.revision);
        bytes32 scopeHash = _scopeHash(parameterId);
        bytes32 oldStateHash = _stateHash(scopeHash, parameter, oldValue, parameter.revision);
        bytes32 newStateHash = _stateHash(scopeHash, parameter, newValue, nextRevision);
        bytes32 actionId = _requireGovernanceContext(scopeHash, oldStateHash, newStateHash);
        if (parameter.lastActionId == actionId) {
            revert TimeParameterActionAlreadyApplied(parameterId, actionId);
        }

        parameter.value = newValue;
        parameter.revision = nextRevision;
        parameter.lastActionId = actionId;
        emit TimeParameterUpdated(
            TIME_PARAMETER_SCHEMA_VERSION,
            parameterId,
            address(this),
            actionId,
            oldValue,
            newValue,
            parameter.floorBlocks
        );
    }

    /// @dev Live storage value for embedding hosts.
    function _timeParameterValue(bytes32 parameterId) internal view returns (uint256) {
        return timeParameter(parameterId);
    }

    function _requireAuthorityCaller() private view {
        if (governanceAuthority == address(0) || msg.sender != governanceAuthority) {
            revert TimeParameterNotAuthority(msg.sender);
        }
    }

    function _requireRegistered(bytes32 parameterId)
        private
        view
        returns (TimeParameterData storage parameter)
    {
        parameter = _timeParameters[parameterId];
        if (parameter.revision == 0) revert TimeParameterUnknown(parameterId);
    }

    function _scopeHash(bytes32 parameterId) private view returns (bytes32) {
        return keccak256(
            abi.encode(_TIME_PARAMETER_SCOPE_DOMAIN_V2, block.chainid, address(this), parameterId)
        );
    }

    function _stateHash(
        bytes32 scopeHash,
        TimeParameterData storage parameter,
        uint256 value,
        uint64 revision
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                _TIME_PARAMETER_STATE_DOMAIN_V2,
                scopeHash,
                value,
                parameter.floorBlocks,
                parameter.wallClockFloorSeconds,
                revision
            )
        );
    }

    function _nextRevision(bytes32 parameterId, uint64 revision) private pure returns (uint64) {
        if (revision == type(uint64).max) revert TimeParameterRevisionOverflow(parameterId);
        unchecked {
            return revision + 1;
        }
    }

    function _requireGovernanceContext(
        bytes32 expectedScopeHash,
        bytes32 expectedOldStateHash,
        bytes32 expectedNewStateHash
    ) private view returns (bytes32 actionId) {
        (
            bool executing,
            bytes32 currentActionId,
            uint8 actionClass,
            bytes32 scopeHash,
            bytes32 oldStateHash,
            bytes32 newStateHash
        ) = _readCurrentAction();
        if (!executing) revert TimeParameterActionNotExecuting();
        if (currentActionId == bytes32(0)) revert TimeParameterActionIdZero();
        if (actionClass != _ACTION_CLASS_DELAYED_LOOSENING) {
            revert TimeParameterActionClassMismatch(_ACTION_CLASS_DELAYED_LOOSENING, actionClass);
        }
        if (scopeHash != expectedScopeHash) {
            revert TimeParameterScopeHashMismatch(expectedScopeHash, scopeHash);
        }
        if (oldStateHash != expectedOldStateHash) {
            revert TimeParameterOldStateHashMismatch(expectedOldStateHash, oldStateHash);
        }
        if (newStateHash != expectedNewStateHash) {
            revert TimeParameterNewStateHashMismatch(expectedNewStateHash, newStateHash);
        }
        return currentActionId;
    }

    function _readCurrentAction()
        private
        view
        returns (
            bool executing,
            bytes32 actionId,
            uint8 actionClass,
            bytes32 scopeHash,
            bytes32 oldStateHash,
            bytes32 newStateHash
        )
    {
        address authority = governanceAuthority;
        uint256 selector = uint32(IStreamGovernedParameterAuthority.currentAction.selector);
        bool success;
        uint256 returnSize;
        uint256 executingWord;
        uint256 actionClassWord;
        assembly ("memory-safe") {
            let pointer := mload(0x40)
            mstore(pointer, shl(224, selector))
            success := staticcall(gas(), authority, pointer, 4, pointer, 192)
            returnSize := returndatasize()
            executingWord := mload(pointer)
            actionId := mload(add(pointer, 32))
            actionClassWord := mload(add(pointer, 64))
            scopeHash := mload(add(pointer, 96))
            oldStateHash := mload(add(pointer, 128))
            newStateHash := mload(add(pointer, 160))
        }
        if (!success || returnSize != 192 || executingWord > 1 || actionClassWord > 255) {
            revert TimeParameterActionContextInvalid();
        }
        executing = executingWord == 1;
        // Bounded above to the full uint8 range before the cast.
        // forge-lint: disable-next-line(unsafe-typecast)
        actionClass = uint8(actionClassWord);
    }

    function _hasCanonicalAuthorityMarker(address authority) private view returns (bool valid) {
        uint256 selector =
            uint32(IStreamGovernedParameterAuthority.isStreamGovernedParameterAuthority.selector);
        bool success;
        uint256 returnSize;
        uint256 marker;
        assembly ("memory-safe") {
            let pointer := mload(0x40)
            mstore(pointer, shl(224, selector))
            success := staticcall(gas(), authority, pointer, 4, pointer, 32)
            returnSize := returndatasize()
            marker := mload(pointer)
        }
        valid = success && returnSize == 32 && marker == 1;
    }

    function _hasCanonicalAuthorityContext(address authority) private view returns (bool valid) {
        uint256 selector = uint32(IStreamGovernedParameterAuthority.currentAction.selector);
        bool success;
        uint256 returnSize;
        uint256 executingWord;
        uint256 actionClassWord;
        assembly ("memory-safe") {
            let pointer := mload(0x40)
            mstore(pointer, shl(224, selector))
            success := staticcall(gas(), authority, pointer, 4, pointer, 192)
            returnSize := returndatasize()
            executingWord := mload(pointer)
            actionClassWord := mload(add(pointer, 64))
        }
        valid = success && returnSize == 192 && executingWord <= 1 && actionClassWord <= 255;
    }

    function _isEip7702DelegatedEOA(address account) private view returns (bool delegated) {
        if (account.code.length != 23) return false;
        bytes3 prefix;
        assembly ("memory-safe") {
            extcodecopy(account, 0, 0, 3)
            prefix := mload(0)
        }
        delegated = prefix == 0xef0100;
    }
}
