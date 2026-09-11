// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Canonical module identity surface every satellite family must
///         expose, pinned by `docs/stream-long-term-architecture.md`
///         [LTA-MODULE-ID] (ADR 0009 decision 3).
/// @dev The `stream` prefix keeps these selectors unambiguous in ABIs and
///     explorers over decades; the eight selectors are golden-tested. The
///     draft four-function `streamModuleFamily()` variant is superseded.
interface IStreamModule {
    /// @notice Canonical module type constant (for example
    ///         `keccak256("STREAM_RENDERER")`).
    function streamModuleType() external pure returns (bytes32);

    /// @notice Module version identifier within its family.
    function streamModuleVersion() external pure returns (bytes32);

    /// @notice Primary ERC-165 interface ID the module serves.
    function streamModuleInterfaceId() external pure returns (bytes4);

    /// @notice Schema commitment for the module's stored/served data shapes.
    function streamModuleSchemaHash() external view returns (bytes32);

    /// @notice Immediate predecessor in the same module family, or the zero
    ///         address for a first-generation module.
    function streamModuleSupersedes() external view returns (address);

    /// @notice The module's own runtime code hash.
    function streamModuleCodeHash() external view returns (bytes32);

    /// @notice Deployment manifest commitment recorded for this deployment.
    function streamModuleDeploymentManifestHash() external view returns (bytes32);

    /// @notice Module manifest URI and content commitment.
    function streamModuleManifest() external view returns (string memory uri, bytes32 hash);
}
