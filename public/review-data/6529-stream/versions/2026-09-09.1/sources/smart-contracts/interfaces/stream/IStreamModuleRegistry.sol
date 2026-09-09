// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Canonical module lifecycle states pinned by
///         `docs/stream-long-term-architecture.md` [LTA-REGISTRY].
/// @dev Numeric IDs are pinned in the Numeric ID Catalog: `UNKNOWN = 0`,
///     `ACTIVE = 1`, `DEPRECATED = 2`, `INCIDENT_REVOKED = 3`. The mint-layer
///     draft name `BLOCKED` denotes `INCIDENT_REVOKED`; there is no fifth state.
enum ModuleRegistryStatus {
    UNKNOWN,
    ACTIVE,
    DEPRECATED,
    INCIDENT_REVOKED
}

/// @notice Canonical module registry record pinned by [LTA-REGISTRY].
struct StreamModuleRecord {
    ModuleRegistryStatus status;
    bytes32 moduleType;
    bytes32 moduleVersion;
    bytes4 interfaceId;
    uint32 moduleGasLimit;
    bytes32 runtimeCodeHash;
    bytes32 deploymentManifestHash;
    bytes32 moduleManifestHash;
    string moduleManifestURI;
    uint64 registeredAt;
    uint64 statusUpdatedAt;
    uint64 revision;
}

/// @notice Registration request consumed by the governed
///         `StreamModuleRegistry.registerModule` lifecycle call.
/// @dev Not part of the pinned [LTA-REGISTRY] read surface; the registry
///     records the module's live codehash and stamps the timestamps itself.
///     `expectedRuntimeCodeHash` must be nonzero: governance reads the live
///     codehash and pins it into the action at review time, and the registry
///     rejects a zero pin so the bound is verified at review time rather than
///     merely accepted at execution time.
struct StreamModuleRegistration {
    address module;
    bytes32 moduleType;
    bytes32 moduleVersion;
    bytes4 interfaceId;
    uint32 moduleGasLimit;
    bytes32 expectedRuntimeCodeHash;
    bytes32 deploymentManifestHash;
    bytes32 moduleManifestHash;
    string moduleManifestURI;
}

/// @notice The single canonical module-registry surface of protocol v1
///         ([LTA-REGISTRY] requirement 1). Draft mint-layer names
///         (`IStreamMintModuleRegistry`, `MintModuleInfo`, `ModuleStatus`,
///         `isModuleActive`) are superseded aliases.
interface IStreamModuleRegistry {
    event StreamModuleRegistered(
        uint16 schemaVersion,
        address indexed module,
        bytes32 indexed moduleType,
        bytes4 indexed interfaceId,
        bytes32 moduleVersion,
        uint32 moduleGasLimit,
        bytes32 runtimeCodeHash,
        bytes32 deploymentManifestHash,
        bytes32 moduleManifestHash,
        string moduleManifestURI,
        bytes32 recordChainHash
    );

    event StreamModuleStatusChanged(
        uint16 schemaVersion,
        address indexed module,
        bytes32 indexed moduleType,
        ModuleRegistryStatus status,
        bytes32 reasonHash,
        string reasonURI
    );

    /// @notice Returns the stored record for `module` (zero record when unknown).
    function moduleRecord(address module) external view returns (StreamModuleRecord memory);

    /// @notice Returns true when `module` is `ACTIVE`, matches the expected
    ///         module type and interface ID, and its live codehash still
    ///         matches the registered runtime code hash.
    function isModuleEligible(
        address module,
        bytes32 expectedModuleType,
        bytes4 expectedInterfaceId
    ) external view returns (bool);

    /// @notice Returns the registry's own manifest commitment.
    function moduleRegistryManifest()
        external
        view
        returns (bytes32 manifestHash, string memory manifestURI, uint64 revision);

    // Append-only module enumeration index (requirement 6;
    // ADR 0013 decision U2).
    function moduleCount() external view returns (uint256);

    function moduleAt(uint256 index) external view returns (address module);

    // Registration record-chain accumulator (requirement 7;
    // ADR 0013 decision U2).
    function registrationChainHash() external view returns (bytes32 chainHash, uint64 recordCount);
}
