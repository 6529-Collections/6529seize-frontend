// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Minimal host surface for launch-v1 Governed Gas Parameters.
/// @dev Parameters are fixed at deployment and may only increase through a
///      delayed Governance-V2 action. Probe-dependent emergency, lowering,
///      rebinding, and permissionless mutation paths do not exist.
interface IStreamGasParameterHost {
    /// @notice Per-parameter registration input, fixed at deployment.
    /// @dev `name` is the bare constant name. The host derives
    ///      `keccak256("6529STREAM_GGP_" || name)`.
    struct GasParameterConfig {
        string name;
        uint256 genesisValue;
        uint256 floor;
        uint8 failureClass;
    }

    /// @notice Canonical monotonic GGP change event.
    event GasParameterUpdated(
        uint16 schemaVersion,
        bytes32 indexed parameterId,
        address indexed host,
        bytes32 indexed actionId,
        uint256 oldValue,
        uint256 newValue,
        uint256 floor
    );

    /// @notice Immutable registration facts for one launch parameter.
    event GasParameterRegistered(
        uint16 schemaVersion,
        bytes32 indexed parameterId,
        string name,
        uint256 genesisValue,
        uint256 floor,
        uint8 failureClass
    );

    error GasParameterUnknown(bytes32 parameterId);
    error GasParameterAlreadyRegistered(bytes32 parameterId);
    error GasParameterInvalidConfig(bytes32 parameterId);
    error GasParameterNotAuthority(address caller);
    error GasParameterInvalidAuthority(address authority);
    error GasParameterActionContextInvalid();
    error GasParameterActionNotExecuting();
    error GasParameterActionIdZero();
    error GasParameterActionAlreadyApplied(bytes32 parameterId, bytes32 actionId);
    error GasParameterActionClassMismatch(uint8 expectedClass, uint8 actualClass);
    error GasParameterScopeHashMismatch(bytes32 expectedHash, bytes32 actualHash);
    error GasParameterOldStateHashMismatch(bytes32 expectedHash, bytes32 actualHash);
    error GasParameterNewStateHashMismatch(bytes32 expectedHash, bytes32 actualHash);
    error GasParameterRevisionOverflow(bytes32 parameterId);
    error GasParameterNotARaise(bytes32 parameterId, uint256 currentValue, uint256 newValue);
    error GasParameterRaiseBoundExceeded(
        bytes32 parameterId, uint256 currentValue, uint256 newValue
    );

    /// @notice Returns zeroes for an unregistered id.
    function gasParameterInfo(bytes32 parameterId)
        external
        view
        returns (uint256 value, uint256 floor, uint8 failureClass, uint64 revision);

    /// @notice Current storage-backed value. Reverts for an unregistered id.
    function gasParameter(bytes32 parameterId) external view returns (uint256 value);

    /// @notice Registered ids in constructor order.
    function gasParameterIds() external view returns (bytes32[] memory);

    /// @notice Immutable Governance-V2 executor; zero permanently disables raises.
    function governanceAuthority() external view returns (address);

    /// @notice Delayed, authority-only, at-most-2x monotonic raise.
    /// @dev One governance action may apply at most one raise to a parameter.
    function raiseGasParameter(bytes32 parameterId, uint256 newValue) external;
}
