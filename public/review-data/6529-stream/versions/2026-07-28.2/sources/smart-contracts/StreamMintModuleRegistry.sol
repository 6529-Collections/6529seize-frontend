// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ERC165.sol";
import "./IERC165.sol";
import "./IStreamMintModuleRegistry.sol";
import "./Ownable.sol";

/// @notice Boring allowlist registry for StreamMintManager gates and future modules.
contract StreamMintModuleRegistry is ERC165, Ownable, IStreamMintModuleRegistry {
    /// @notice Gas ceiling for ERC-165 probes of candidate modules per EIP-165 guidance.
    uint256 private constant MODULE_ERC165_PROBE_GAS = 30_000;

    mapping(address => MintModuleInfo) private _moduleInfo;

    /// @notice Returns true for deployment validation.
    function isStreamMintModuleRegistry() external pure override returns (bool) {
        return true;
    }

    /// @notice Sets or clears module metadata and lifecycle status.
    function setModule(address module, MintModuleInfo calldata info, string calldata metadataURI)
        external
        override
        onlyOwner
    {
        if (module == address(0)) {
            revert InvalidMintModule(module);
        }

        if (info.status == ModuleStatus.UNKNOWN) {
            delete _moduleInfo[module];
            emit MintModuleUpdated(
                module, info.status, bytes4(0), 0, bytes32(0), bytes32(0), 0, msg.sender
            );
            return;
        }

        if (info.interfaceId == bytes4(0) || info.interfaceId == 0xffffffff) {
            revert InvalidMintModuleInfo(module);
        }
        if (
            (info.status == ModuleStatus.ACTIVE || info.status == ModuleStatus.DEPRECATED)
                && (module.code.length == 0
                    || info.metadataHash == bytes32(0)
                    || info.gasLimit == 0)
        ) {
            revert InvalidMintModuleInfo(module);
        }
        if (
            (info.status == ModuleStatus.ACTIVE || info.status == ModuleStatus.DEPRECATED)
                && !_supportsInterface(module, info.interfaceId)
        ) {
            revert MintModuleInterfaceUnsupported(module, info.interfaceId);
        }

        bytes32 actualCodehash = module.code.length == 0 ? bytes32(0) : module.codehash;
        if (info.codehash != bytes32(0) && info.codehash != actualCodehash) {
            revert MintModuleCodehashMismatch(module, info.codehash, actualCodehash);
        }

        MintModuleInfo memory stored = MintModuleInfo({
            status: info.status,
            interfaceId: info.interfaceId,
            semanticVersion: info.semanticVersion,
            codehash: info.codehash == bytes32(0) ? actualCodehash : info.codehash,
            metadataHash: info.metadataHash,
            gasLimit: info.gasLimit
        });
        _moduleInfo[module] = stored;

        emit MintModuleUpdated(
            module,
            stored.status,
            stored.interfaceId,
            stored.semanticVersion,
            stored.codehash,
            stored.metadataHash,
            stored.gasLimit,
            msg.sender
        );
        emit MintModuleMetadata(module, stored.metadataHash, metadataURI);
    }

    /// @notice Returns the registered module record.
    function moduleInfo(address module) external view override returns (MintModuleInfo memory) {
        return _moduleInfo[module];
    }

    /// @notice Returns true when a module is active, supports the interface, and passes codehash pins.
    function isModuleActive(address module, bytes4 interfaceId)
        external
        view
        override
        returns (bool)
    {
        MintModuleInfo memory info = _moduleInfo[module];
        return info.status == ModuleStatus.ACTIVE && info.interfaceId == interfaceId
            && module.codehash == info.codehash && _supportsInterface(module, interfaceId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC165, IERC165)
        returns (bool)
    {
        return interfaceId == type(IStreamMintModuleRegistry).interfaceId
            || super.supportsInterface(interfaceId);
    }

    function _supportsInterface(address module, bytes4 interfaceId) private view returns (bool) {
        try IERC165(module).supportsInterface{ gas: MODULE_ERC165_PROBE_GAS }(interfaceId) returns (
            bool supported
        ) {
            return supported;
        } catch {
            return false;
        }
    }
}
