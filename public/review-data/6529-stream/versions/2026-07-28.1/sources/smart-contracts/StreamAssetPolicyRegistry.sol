// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IStreamAssetPolicyRegistry.sol";
import "./Ownable.sol";

/// @notice Deployment-wide allowlist for approved standard ERC-20 split assets.
contract StreamAssetPolicyRegistry is IStreamAssetPolicyRegistry, Ownable {
    /// @notice Default-deny status for unknown or cleared assets.
    uint8 public constant override ASSET_STATUS_UNKNOWN = 0;
    /// @notice Status for approved standard ERC-20 assets that may be synced and released.
    uint8 public constant override ASSET_STATUS_ACTIVE = 1;
    /// @notice Status for reviewed assets that are not currently accepted by split wallets.
    uint8 public constant override ASSET_STATUS_INACTIVE = 2;
    /// @notice Status for previously approved assets that are disabled for sync and release.
    uint8 public constant override ASSET_STATUS_DEPRECATED = 3;
    /// @notice Status for explicitly unsupported assets.
    uint8 public constant override ASSET_STATUS_UNSUPPORTED = 4;

    /// @notice Current policy status by asset address.
    mapping(address => uint8) public override assetStatus;
    /// @notice Evidence hash for the current policy status by asset address.
    mapping(address => bytes32) public override assetPolicyHash;
    /// @notice Timestamp when the current policy status became effective.
    mapping(address => uint64) public override assetPolicyEffectiveAt;

    /// @notice Returns true for the canonical 6529Stream asset policy registry.
    function isStreamAssetPolicyRegistry() external pure override returns (bool) {
        return true;
    }

    /// @notice Returns true when an asset is currently active for split-wallet sync and release.
    function isAssetActive(address asset) external view override returns (bool) {
        return assetStatus[asset] == ASSET_STATUS_ACTIVE;
    }

    /// @notice Returns the current status, evidence hash, and effective timestamp for an asset.
    function assetPolicy(address asset)
        external
        view
        override
        returns (uint8 status, bytes32 policyHash, uint64 effectiveAt)
    {
        return (assetStatus[asset], assetPolicyHash[asset], assetPolicyEffectiveAt[asset]);
    }

    /// @notice Sets an asset policy status and evidence hash.
    function setAssetStatus(address asset, uint8 status, bytes32 policyHash)
        external
        override
        onlyOwner
    {
        if (asset == address(0)) {
            revert InvalidAsset(asset);
        }
        if (status > ASSET_STATUS_UNSUPPORTED) {
            revert InvalidAssetStatus(status);
        }
        if (status == ASSET_STATUS_UNKNOWN && policyHash != bytes32(0)) {
            revert InvalidAssetPolicyHash(asset, status, policyHash);
        }
        if (status != ASSET_STATUS_UNKNOWN && asset.code.length == 0) {
            revert InvalidAsset(asset);
        }
        if (status != ASSET_STATUS_UNKNOWN && policyHash == bytes32(0)) {
            revert InvalidAssetPolicyHash(asset, status, policyHash);
        }

        uint8 previousStatus = assetStatus[asset];
        bytes32 previousPolicyHash = assetPolicyHash[asset];
        if (previousStatus == status && previousPolicyHash == policyHash) {
            revert AssetPolicyUnchanged(asset, status, policyHash);
        }

        assetStatus[asset] = status;
        assetPolicyHash[asset] = policyHash;
        // forge-lint: disable-next-line(unsafe-typecast)
        assetPolicyEffectiveAt[asset] = uint64(block.timestamp);
        emit AssetPolicyUpdated(
            asset, previousStatus, status, previousPolicyHash, policyHash, msg.sender
        );
    }
}
