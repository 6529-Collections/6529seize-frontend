// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IStreamRevenueResolver.sol";

/// @notice Interface for outside-Core primary-sale settlement evidence.
interface IStreamPrimarySaleSettlement {
    /// @notice Sale context accepted by the settlement adapter.
    /// @dev `expectedPolicyHash` is the resolved primary policy hash expected by
    ///      the sale authorization; strict mode requires an exact match, while
    ///      allow-current mode records drift if the resolver has changed.
    struct PrimarySale {
        bytes32 settlementId;
        bytes32 revenueClass;
        uint8 policyMode;
        uint256 collectionId;
        uint256 tokenId;
        uint256 saleId;
        address payer;
        address poster;
        address beneficiary;
        uint256 amount;
        bytes32 expectedPolicyHash;
    }

    /// @notice Reverts when a caller is not authorized to settle primary revenue.
    error UnauthorizedSettlementCaller(address caller);
    /// @notice Reverts when a settlement caller is invalid.
    error InvalidSettlementCaller(address caller);
    /// @notice Reverts when the sale context is invalid.
    error InvalidPrimarySale(bytes32 settlementId);
    /// @notice Reverts when the native value does not equal the sale amount.
    error IncorrectNativeValue(uint256 expectedAmount, uint256 actualAmount);
    /// @notice Reverts when a settlement ID has already been consumed.
    error SettlementAlreadyConsumed(bytes32 settlementKey);
    /// @notice Reverts when no resolver assignment exists for the sale context.
    error PrimaryAssignmentMissing(bytes32 revenueClass, uint256 collectionId, uint256 tokenId);
    /// @notice Reverts when strict expected policy hash matching fails.
    error PrimaryPolicyHashMismatch(bytes32 expectedPolicyHash, bytes32 actualPolicyHash);
    /// @notice Reverts when a policy mode is unsupported.
    error InvalidPolicyMode(uint8 policyMode);
    /// @notice Reverts when a split wallet cannot be verified.
    error UnverifiedSplitWallet(bytes32 profileId, address wallet);
    /// @notice Reverts when a native transfer fails.
    error NativeTransferFailed(address recipient, uint256 amount);
    /// @notice Reverts when the asset policy registry cannot be read.
    error AssetPolicyReadFailed(address registry, address asset);
    /// @notice Reverts when an ERC-20 asset is not active.
    error AssetNotActive(address asset, uint8 status);
    /// @notice Reverts when an ERC-20 asset is not supported.
    error UnsupportedAsset(address asset);
    /// @notice Reverts when an ERC-20 balance cannot be read.
    error ERC20BalanceReadFailed(address asset, address account);
    /// @notice Reverts when an ERC-20 transfer or transferFrom fails.
    error ERC20TransferFailed(address asset, address from, address to, uint256 amount);
    /// @notice Reverts when ERC-20 transfer deltas are not exact.
    error ERC20TransferInvariantBroken(
        address asset,
        address from,
        address to,
        uint256 expectedFromBalance,
        uint256 actualFromBalance,
        uint256 expectedToBalance,
        uint256 actualToBalance
    );

    /// @notice Emitted when a caller is enabled or disabled for primary settlement.
    event SettlementCallerUpdated(address indexed caller, bool enabled, address indexed admin);
    /// @notice Emitted after official primary revenue reaches a verified split wallet.
    event PrimaryRevenueSettled(
        bytes32 indexed settlementKey,
        bytes32 indexed revenueClass,
        bytes32 indexed profileId,
        address wallet,
        address asset,
        address payer,
        uint256 amount,
        bytes32 saleContextHash,
        bool policyDrift,
        uint8 assignmentType
    );
    /// @notice Emitted with raw sale fields for settlement reconstruction.
    event PrimaryRevenueSettlementContext(
        bytes32 indexed settlementKey,
        bytes32 indexed revenueClass,
        bytes32 indexed profileId,
        address settlementCaller,
        bytes32 settlementId,
        uint8 policyMode,
        uint256 collectionId,
        uint256 tokenId,
        uint256 saleId,
        address poster,
        address beneficiary,
        bytes32 templateId
    );
    /// @notice Emitted with policy hashes used for settlement reconstruction.
    event PrimaryRevenueSettlementPolicy(
        bytes32 indexed settlementKey,
        bytes32 indexed revenueClass,
        bytes32 indexed profileId,
        bytes32 expectedPolicyHash,
        bytes32 resolvedPolicyHash,
        bytes32 resolvedAssignmentHash,
        bytes32 templateId
    );

    /// @notice Domain separator label for resolved primary policy hashes.
    function PRIMARY_POLICY_DOMAIN() external pure returns (bytes32);
    /// @notice Strict expected policy hash mode.
    function POLICY_MODE_STRICT_MATCH() external pure returns (uint8);
    /// @notice Explicitly allow settlement-time current policy mode.
    function POLICY_MODE_ALLOW_CURRENT() external pure returns (uint8);
    /// @notice The resolver used for primary revenue assignments.
    function revenueResolver() external view returns (IStreamRevenueResolver);
    /// @notice Returns true for deployment validation.
    function isStreamPrimarySaleSettlement() external pure returns (bool);
    /// @notice Enables or disables a settlement caller.
    function setSettlementCaller(address caller, bool enabled) external;
    /// @notice Returns whether a caller may settle primary revenue.
    function settlementCaller(address caller) external view returns (bool);
    /// @notice Settles a native ETH primary sale into the resolved split wallet.
    function settleNativePrimarySale(PrimarySale calldata sale)
        external
        payable
        returns (bytes32 settlementKey, bytes32 profileId, address wallet);
    /// @notice Settles an approved standard ERC-20 primary sale into the resolved split wallet.
    function settleERC20PrimarySale(PrimarySale calldata sale, address asset)
        external
        returns (bytes32 settlementKey, bytes32 profileId, address wallet);
    /// @notice Computes the consumed settlement key for a sale context.
    function settlementKey(PrimarySale calldata sale) external view returns (bytes32);
    /// @notice Computes the resolved primary policy hash for explicit settlement inputs.
    function resolvedPrimaryPolicyHash(
        bytes32 revenueClass,
        uint256 collectionId,
        uint256 tokenId,
        bytes32 templateId,
        bytes32 profileId,
        address wallet,
        bytes32 assignmentHash
    ) external view returns (bytes32);
    /// @notice Returns whether a settlement key has been consumed.
    function settlementConsumed(bytes32 settlementKey) external view returns (bool);
    /// @notice Returns official primary revenue settled for a wallet/profile/revenue class/asset.
    function officialSettled(bytes32 revenueClass, bytes32 profileId, address wallet, address asset)
        external
        view
        returns (uint256);
    /// @notice Returns total official primary revenue settled by asset.
    function totalOfficialSettled(address asset) external view returns (uint256);
}
