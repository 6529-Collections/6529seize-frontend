// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IERC165.sol";

/// @notice Registry for mint gates and future mint-policy modules.
interface IStreamMintModuleRegistry is IERC165 {
    enum ModuleStatus {
        UNKNOWN,
        ACTIVE,
        DEPRECATED,
        BLOCKED
    }

    struct MintModuleInfo {
        ModuleStatus status;
        bytes4 interfaceId;
        uint32 semanticVersion;
        bytes32 codehash;
        bytes32 metadataHash;
        uint32 gasLimit;
    }

    /// @notice Reverts when a module address is invalid for registry policy.
    error InvalidMintModule(address module);
    /// @notice Reverts when module metadata is incomplete or unsupported.
    error InvalidMintModuleInfo(address module);
    /// @notice Reverts when a module does not advertise the required ERC-165 interface.
    error MintModuleInterfaceUnsupported(address module, bytes4 interfaceId);
    /// @notice Reverts when a module's codehash differs from a supplied pin.
    error MintModuleCodehashMismatch(address module, bytes32 expected, bytes32 actual);

    event MintModuleUpdated(
        address indexed module,
        ModuleStatus status,
        bytes4 indexed interfaceId,
        uint32 semanticVersion,
        bytes32 codehash,
        bytes32 metadataHash,
        uint32 gasLimit,
        address indexed admin
    );
    event MintModuleMetadata(address indexed module, bytes32 metadataHash, string metadataURI);

    /// @notice Returns true for deployment validation.
    function isStreamMintModuleRegistry() external view returns (bool);

    /// @notice Sets or clears module metadata and lifecycle status.
    function setModule(address module, MintModuleInfo calldata info, string calldata metadataURI)
        external;

    /// @notice Returns the registered module record.
    function moduleInfo(address module) external view returns (MintModuleInfo memory);

    /// @notice Returns true when a module is active, supports the interface, and passes codehash pins.
    function isModuleActive(address module, bytes4 interfaceId) external view returns (bool);
}
