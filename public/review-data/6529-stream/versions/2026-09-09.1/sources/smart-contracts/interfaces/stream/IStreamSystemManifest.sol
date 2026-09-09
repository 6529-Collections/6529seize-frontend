// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../vendor/openzeppelin/IERC165.sol";

/// @notice Update committed by the Permanent system-manifest publication
///         writer ([LTA-MANIFEST-PUBLISH]).
struct StreamSystemManifestUpdate {
    bytes32 manifestHash;
    string manifestURI;
    bytes32 eventCatalogHash;
    bytes32 compatibilityMatrixHash;
    bytes32 numericIdCatalogHash;
    bytes32 schemaCatalogHash;
    bytes32 canonicalizationCatalogHash;
    bytes32 specBundleHash;
    bytes32 reconstructionClientHash;
}

/// @notice State-only aggregate and append-only payload-history surface for
///         discovering the active Stream deployment.
/// @dev The two immutable binding reads (`core()` and
///      `governanceExecutor()`) are deliberately outside this five-function
///      interface. The five selectors below XOR to `0x37660ede`.
interface IStreamSystemManifest is IERC165 {
    event StreamSystemManifestPublished(
        uint16 schemaVersion,
        bytes32 indexed manifestHash,
        address indexed payloadPointer,
        bytes32 indexed actionId
    );

    function streamSystemManifest()
        external
        view
        returns (
            bytes32 manifestHash,
            string memory manifestURI,
            address revenueResolver,
            address metadataRouter,
            address collectionMetadata,
            address entropyCoordinator,
            address mintManager,
            address mintLedger,
            address artistRegistry,
            address streamAdminsOrGovernance,
            address artworkFinalityRegistry,
            address moduleRegistry,
            address stateExportPublisher,
            bytes32 eventCatalogHash,
            bytes32 compatibilityMatrixHash,
            bytes32 numericIdCatalogHash,
            bytes32 schemaCatalogHash,
            bytes32 canonicalizationCatalogHash,
            bytes32 specBundleHash,
            bytes32 reconstructionClientHash,
            uint64 revision
        );

    function streamSystemManifestPointer() external view returns (address payloadPointer);

    function streamSystemManifestPointerCount() external view returns (uint256);

    function streamSystemManifestPointerAt(uint256 index)
        external
        view
        returns (address payloadPointer, bytes32 manifestHash, uint64 updatedAt);

    function publishStreamSystemManifest(
        address payloadPointer,
        StreamSystemManifestUpdate calldata update
    ) external;
}
