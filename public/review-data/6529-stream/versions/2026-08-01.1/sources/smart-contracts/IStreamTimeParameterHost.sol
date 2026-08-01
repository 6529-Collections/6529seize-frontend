// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Minimal host surface for launch-v1 Governed Time Parameters.
/// @dev Block-count windows are fixed at deployment and may only increase
///      through a delayed Governance-V2 action. Cadence-probe lowering and
///      probe-rebinding paths do not exist.
interface IStreamTimeParameterHost {
    /// @notice Per-parameter registration input, fixed at deployment.
    struct TimeParameterConfig {
        string name;
        uint256 genesisValue;
        uint256 floorBlocks;
        uint64 wallClockFloorSeconds;
    }

    /// @notice Canonical monotonic GTP change event.
    event TimeParameterUpdated(
        uint16 schemaVersion,
        bytes32 indexed parameterId,
        address indexed host,
        bytes32 indexed actionId,
        uint256 oldValue,
        uint256 newValue,
        uint256 floorBlocks
    );

    /// @notice Immutable registration facts for one launch parameter.
    event TimeParameterRegistered(
        uint16 schemaVersion,
        bytes32 indexed parameterId,
        string name,
        uint256 genesisValue,
        uint256 floorBlocks,
        uint64 wallClockFloorSeconds
    );

    error TimeParameterUnknown(bytes32 parameterId);
    error TimeParameterAlreadyRegistered(bytes32 parameterId);
    error TimeParameterInvalidConfig(bytes32 parameterId);
    error TimeParameterNotAuthority(address caller);
    error TimeParameterInvalidAuthority(address authority);
    error TimeParameterActionContextInvalid();
    error TimeParameterActionNotExecuting();
    error TimeParameterActionIdZero();
    error TimeParameterActionAlreadyApplied(bytes32 parameterId, bytes32 actionId);
    error TimeParameterActionClassMismatch(uint8 expectedClass, uint8 actualClass);
    error TimeParameterScopeHashMismatch(bytes32 expectedHash, bytes32 actualHash);
    error TimeParameterOldStateHashMismatch(bytes32 expectedHash, bytes32 actualHash);
    error TimeParameterNewStateHashMismatch(bytes32 expectedHash, bytes32 actualHash);
    error TimeParameterRevisionOverflow(bytes32 parameterId);
    error TimeParameterNotARaise(bytes32 parameterId, uint256 currentValue, uint256 newValue);
    error TimeParameterRaiseBoundExceeded(
        bytes32 parameterId, uint256 currentValue, uint256 newValue
    );

    /// @notice Returns zeroes for an unregistered id.
    function timeParameterInfo(bytes32 parameterId)
        external
        view
        returns (uint256 value, uint256 floorBlocks, uint64 wallClockFloorSeconds, uint64 revision);

    /// @notice Current storage-backed value. Reverts for an unregistered id.
    function timeParameter(bytes32 parameterId) external view returns (uint256 value);

    /// @notice Registered ids in constructor order.
    function timeParameterIds() external view returns (bytes32[] memory);

    /// @notice Immutable Governance-V2 executor; zero permanently disables raises.
    function governanceAuthority() external view returns (address);

    /// @notice Delayed, authority-only, at-most-2x monotonic raise.
    /// @dev One governance action may apply at most one raise to a parameter.
    function raiseTimeParameter(bytes32 parameterId, uint256 newValue) external;
}
