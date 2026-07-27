// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ERC165.sol";
import "./IStreamModule.sol";

/// @notice Abstract adoption base for the canonical [LTA-MODULE-ID] module
///         identity surface (`docs/stream-long-term-architecture.md`).
/// @dev Satellites adopt this base and override the three pure identity
///     functions (`streamModuleType`, `streamModuleVersion`,
///     `streamModuleInterfaceId`) with their pinned constants; the remaining
///     five reads are served from construction-time facts. `supportsInterface`
///     advertises `IStreamModule` alongside inherited interfaces.
abstract contract StreamModuleBase is ERC165, IStreamModule {
    bytes32 private immutable _schemaHash;
    address private immutable _supersedes;
    bytes32 private immutable _deploymentManifestHash;
    bytes32 private immutable _manifestHash;
    string private _manifestURI;

    /// @param schemaHash_ Schema commitment for the module's data shapes.
    /// @param supersedes_ Immediate predecessor in the same family, or zero.
    /// @param deploymentManifestHash_ Deployment manifest commitment.
    /// @param manifestURI_ Module manifest display URI.
    /// @param manifestHash_ Module manifest content commitment.
    constructor(
        bytes32 schemaHash_,
        address supersedes_,
        bytes32 deploymentManifestHash_,
        string memory manifestURI_,
        bytes32 manifestHash_
    ) {
        _schemaHash = schemaHash_;
        _supersedes = supersedes_;
        _deploymentManifestHash = deploymentManifestHash_;
        _manifestURI = manifestURI_;
        _manifestHash = manifestHash_;
    }

    /// @inheritdoc IStreamModule
    function streamModuleType() public pure virtual override returns (bytes32);

    /// @inheritdoc IStreamModule
    function streamModuleVersion() public pure virtual override returns (bytes32);

    /// @inheritdoc IStreamModule
    function streamModuleInterfaceId() public pure virtual override returns (bytes4);

    /// @inheritdoc IStreamModule
    function streamModuleSchemaHash() public view virtual override returns (bytes32) {
        return _schemaHash;
    }

    /// @inheritdoc IStreamModule
    function streamModuleSupersedes() public view virtual override returns (address) {
        return _supersedes;
    }

    /// @inheritdoc IStreamModule
    function streamModuleCodeHash() public view virtual override returns (bytes32) {
        return address(this).codehash;
    }

    /// @inheritdoc IStreamModule
    function streamModuleDeploymentManifestHash() public view virtual override returns (bytes32) {
        return _deploymentManifestHash;
    }

    /// @inheritdoc IStreamModule
    function streamModuleManifest()
        public
        view
        virtual
        override
        returns (string memory uri, bytes32 hash)
    {
        return (_manifestURI, _manifestHash);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IStreamModule).interfaceId || super.supportsInterface(interfaceId);
    }
}
