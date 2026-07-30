// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IStreamGasParameterHost.sol";
import "./IStreamGovernedParameterAuthority.sol";

/// @notice Reusable launch-v1 Governed Gas Parameter host.
/// @dev The parameter inventory is fixed during construction. Values may only
///      increase through an exact delayed Governance-V2 context and each step
///      is bounded to at most twice the current value. The launch profile has no
///      probes, emergency raises, lowers, rebinds, or permissionless writers.
abstract contract StreamGasParameterHost is IStreamGasParameterHost {
    uint16 public constant GAS_PARAMETER_SCHEMA_VERSION = 2;

    uint8 public constant FAILURE_CLASS_NONE = 0;
    uint8 public constant FAILURE_CLASS_FORWARDING_CAP = 1;
    uint8 public constant FAILURE_CLASS_FAIL_CLOSED_PRECHECK = 2;
    uint8 public constant FAILURE_CLASS_MIN_GAS_GATE = 3;

    bytes32 private constant _GAS_PARAMETER_SCOPE_DOMAIN_V2 =
        0x9533611d402c2b44cf950a4a8900d25f6829bfac541dc4d5353094f966bb1a71;
    bytes32 private constant _GAS_PARAMETER_STATE_DOMAIN_V2 =
        0x5059a253d3f7dd63b5d9fd1f0568caf72967f501a3db678b31cefe911334159c;

    uint8 private constant _ACTION_CLASS_DELAYED_LOOSENING = 1;

    struct GasParameterData {
        uint256 value;
        uint256 floor;
        uint8 failureClass;
        uint64 revision;
        // Auxiliary same-action consumption guard; intentionally outside _stateHash.
        bytes32 lastActionId;
    }

    address public immutable override governanceAuthority;

    mapping(bytes32 => GasParameterData) internal _gasParameters;
    bytes32[] private _gasParameterIds;

    /// @param authority Canonical Governance-V2 executor, or zero to make every
    ///        parameter immutable after construction.
    constructor(address authority) {
        if (
            authority != address(0)
                && (_isEip7702DelegatedEOA(authority)
                    || !_hasCanonicalAuthorityMarker(authority)
                    || !_hasCanonicalAuthorityContext(authority))
        ) {
            revert GasParameterInvalidAuthority(authority);
        }
        governanceAuthority = authority;
    }

    /// @dev Constructor-only registration hook for embedding hosts.
    function _registerGasParameter(GasParameterConfig memory config)
        internal
        returns (bytes32 parameterId)
    {
        if (bytes(config.name).length == 0) {
            revert GasParameterInvalidConfig(bytes32(0));
        }
        parameterId = keccak256(abi.encodePacked("6529STREAM_GGP_", config.name));

        GasParameterData storage parameter = _gasParameters[parameterId];
        if (parameter.revision != 0) {
            revert GasParameterAlreadyRegistered(parameterId);
        }
        if (
            config.floor == 0 || config.genesisValue < config.floor
                || config.failureClass < FAILURE_CLASS_FORWARDING_CAP
                || config.failureClass > FAILURE_CLASS_MIN_GAS_GATE
        ) {
            revert GasParameterInvalidConfig(parameterId);
        }

        parameter.value = config.genesisValue;
        parameter.floor = config.floor;
        parameter.failureClass = config.failureClass;
        parameter.revision = 1;
        _gasParameterIds.push(parameterId);

        emit GasParameterRegistered(
            GAS_PARAMETER_SCHEMA_VERSION,
            parameterId,
            config.name,
            config.genesisValue,
            config.floor,
            config.failureClass
        );
    }

    /// @inheritdoc IStreamGasParameterHost
    function gasParameterInfo(bytes32 parameterId)
        external
        view
        override
        returns (uint256 value, uint256 floor, uint8 failureClass, uint64 revision)
    {
        GasParameterData storage parameter = _gasParameters[parameterId];
        return (parameter.value, parameter.floor, parameter.failureClass, parameter.revision);
    }

    /// @inheritdoc IStreamGasParameterHost
    function gasParameter(bytes32 parameterId) public view override returns (uint256 value) {
        GasParameterData storage parameter = _requireRegistered(parameterId);
        return parameter.value;
    }

    /// @inheritdoc IStreamGasParameterHost
    function gasParameterIds() external view override returns (bytes32[] memory) {
        return _gasParameterIds;
    }

    /// @inheritdoc IStreamGasParameterHost
    function raiseGasParameter(bytes32 parameterId, uint256 newValue) external override {
        _requireAuthorityCaller();
        GasParameterData storage parameter = _requireRegistered(parameterId);
        uint256 oldValue = parameter.value;
        if (newValue <= oldValue) {
            revert GasParameterNotARaise(parameterId, oldValue, newValue);
        }
        if (newValue - oldValue > oldValue) {
            revert GasParameterRaiseBoundExceeded(parameterId, oldValue, newValue);
        }

        uint64 nextRevision = _nextRevision(parameterId, parameter.revision);
        bytes32 scopeHash = _scopeHash(parameterId);
        bytes32 oldStateHash = _stateHash(scopeHash, parameter, oldValue, parameter.revision);
        bytes32 newStateHash = _stateHash(scopeHash, parameter, newValue, nextRevision);
        bytes32 actionId = _requireGovernanceContext(scopeHash, oldStateHash, newStateHash);
        if (parameter.lastActionId == actionId) {
            revert GasParameterActionAlreadyApplied(parameterId, actionId);
        }

        parameter.value = newValue;
        parameter.revision = nextRevision;
        parameter.lastActionId = actionId;
        emit GasParameterUpdated(
            GAS_PARAMETER_SCHEMA_VERSION,
            parameterId,
            address(this),
            actionId,
            oldValue,
            newValue,
            parameter.floor
        );
    }

    /// @dev Live storage value for embedding hosts' bounded external calls.
    function _gasParameterValue(bytes32 parameterId) internal view returns (uint256) {
        return gasParameter(parameterId);
    }

    function _requireAuthorityCaller() private view {
        if (governanceAuthority == address(0) || msg.sender != governanceAuthority) {
            revert GasParameterNotAuthority(msg.sender);
        }
    }

    function _requireRegistered(bytes32 parameterId)
        private
        view
        returns (GasParameterData storage parameter)
    {
        parameter = _gasParameters[parameterId];
        if (parameter.revision == 0) revert GasParameterUnknown(parameterId);
    }

    function _scopeHash(bytes32 parameterId) private view returns (bytes32) {
        return keccak256(
            abi.encode(_GAS_PARAMETER_SCOPE_DOMAIN_V2, block.chainid, address(this), parameterId)
        );
    }

    function _stateHash(
        bytes32 scopeHash,
        GasParameterData storage parameter,
        uint256 value,
        uint64 revision
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                _GAS_PARAMETER_STATE_DOMAIN_V2,
                scopeHash,
                value,
                parameter.floor,
                parameter.failureClass,
                revision
            )
        );
    }

    function _nextRevision(bytes32 parameterId, uint64 revision) private pure returns (uint64) {
        if (revision == type(uint64).max) revert GasParameterRevisionOverflow(parameterId);
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
        if (!executing) revert GasParameterActionNotExecuting();
        if (currentActionId == bytes32(0)) revert GasParameterActionIdZero();
        if (actionClass != _ACTION_CLASS_DELAYED_LOOSENING) {
            revert GasParameterActionClassMismatch(_ACTION_CLASS_DELAYED_LOOSENING, actionClass);
        }
        if (scopeHash != expectedScopeHash) {
            revert GasParameterScopeHashMismatch(expectedScopeHash, scopeHash);
        }
        if (oldStateHash != expectedOldStateHash) {
            revert GasParameterOldStateHashMismatch(expectedOldStateHash, oldStateHash);
        }
        if (newStateHash != expectedNewStateHash) {
            revert GasParameterNewStateHashMismatch(expectedNewStateHash, newStateHash);
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
            revert GasParameterActionContextInvalid();
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
