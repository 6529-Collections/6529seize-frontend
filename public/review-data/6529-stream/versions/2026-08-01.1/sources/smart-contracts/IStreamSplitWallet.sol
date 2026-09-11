// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Interface for immutable split-wallet receipt and release accounting.
interface IStreamSplitWallet {
    /// @notice Label-level recipient share entry before account aggregation.
    struct SplitEntry {
        address account;
        uint32 sharePpm;
        bytes32 labelId;
    }

    /// @notice Reverts when initialization is attempted more than once.
    error AlreadyInitialized();
    /// @notice Reverts when factory-provided initialization data is inconsistent.
    error InvalidInitializationInput();
    /// @notice Reverts when the factory-pinned asset policy registry cannot be read.
    error AssetPolicyReadFailed(address registry, address asset);
    /// @notice Reverts when an ERC-20 asset is not currently active.
    error AssetNotActive(address asset, uint8 status);
    /// @notice Reverts when an ERC-20 balance cannot be read.
    error ERC20BalanceReadFailed(address asset, address account);
    /// @notice Reverts when an ERC-20 transfer fails or returns false.
    error ERC20TransferFailed(address asset, address recipient, uint256 amount);
    /// @notice Reverts when an ERC-20 release does not debit and credit the exact amount.
    error ERC20TransferInvariantBroken(
        address asset,
        address recipient,
        uint256 expectedWalletBalance,
        uint256 actualWalletBalance,
        uint256 expectedRecipientBalance,
        uint256 actualRecipientBalance
    );
    /// @notice Reverts when cumulative receipts fall below the last observed high-water mark.
    error ObservedReceiptsDecreased(
        address asset, uint256 previousObservedReceived, uint256 observedReceived
    );
    /// @notice Reverts when a native transfer succeeds but cumulative receipt accounting changes.
    error NativeReceiptInvariantBroken(
        uint256 expectedObservedReceived, uint256 actualObservedReceived
    );
    /// @notice Reverts when a native transfer fails.
    error NativeTransferFailed(address recipient, uint256 amount);
    /// @notice Reverts when an account has no currently releasable funds.
    error NoReleasableFunds(address asset, address account);
    /// @notice Reverts when a non-factory caller attempts initialization.
    error UnauthorizedInitializer(address caller);
    /// @notice Reverts when a non-account caller tries to release to an alternate recipient.
    error UnauthorizedReleaseRecipient(address caller, address account, address recipient);
    /// @notice Reverts when an asset is not supported by this wallet version.
    error UnsupportedAsset(address asset);
    /// @notice Reverts when a release recipient is the zero address.
    error ZeroRecipient();

    /// @notice Emitted on the first explicit observation for an asset.
    event AssetObservationInitialized(
        bytes32 indexed profileId, address indexed asset, uint256 observedReceived
    );
    /// @notice Emitted on later explicit observations for an asset.
    event AssetSynced(
        bytes32 indexed profileId,
        address indexed asset,
        uint256 previousObservedReceived,
        uint256 observedReceived
    );
    /// @notice Emitted after native ETH is released through the pull-payment flow.
    event NativeReleased(
        bytes32 indexed profileId,
        address indexed account,
        address indexed recipient,
        uint256 amount,
        uint256 totalReleased,
        uint256 observedReceived
    );
    /// @notice Emitted after an approved ERC-20 is released through the pull-payment flow.
    event ERC20Released(
        bytes32 indexed profileId,
        address indexed asset,
        address indexed account,
        address recipient,
        uint256 amount,
        uint256 totalReleased,
        uint256 observedReceived
    );

    /// @notice Parts-per-million share denominator.
    function SHARE_DENOMINATOR_PPM() external pure returns (uint32);
    /// @notice Factory that deployed and initialized this wallet.
    function factory() external view returns (address);
    /// @notice Deployment-wide asset policy registry pinned by the factory.
    function assetPolicyRegistry() external view returns (address);
    /// @notice Whether the wallet has been initialized.
    function initialized() external view returns (bool);
    /// @notice Split profile identifier bound to this wallet.
    function profileId() external view returns (bytes32);
    /// @notice Canonical split entry hash.
    function entriesHash() external view returns (bytes32);
    /// @notice Off-chain metadata URI hash for the profile.
    function metadataURIHash() external view returns (bytes32);
    /// @notice Number of canonical label-level entries.
    function entryCount() external view returns (uint256);
    /// @notice Returns one canonical label-level entry by index.
    function entry(uint256 index)
        external
        view
        returns (address account, uint32 sharePpm, bytes32 labelId);
    /// @notice Number of unique accounts after share aggregation.
    function uniqueAccountCount() external view returns (uint256);
    /// @notice Returns one unique account and aggregate share by index.
    function uniqueAccount(uint256 index) external view returns (address account, uint32 sharePpm);
    /// @notice Aggregate parts-per-million share for an account.
    function aggregateSharePpm(address account) external view returns (uint32);
    /// @notice Amount already released for an account and asset.
    function accountReleased(address asset, address account) external view returns (uint256);
    /// @notice Total amount already released for an asset.
    function totalReleased(address asset) external view returns (uint256);
    /// @notice Whether an explicit observation has been initialized for an asset.
    function assetObservationInitialized(address asset) external view returns (bool);
    /// @notice Last cumulative receipts value recorded by sync or release.
    /// @dev For ERC-20s, a decrease means the asset is unsupported until the balance recovers
    ///      to the high-water mark or a later adapter/recovery path handles that asset.
    function lastObservedReceived(address asset) external view returns (uint256);
    /// @notice Cumulative observed receipts for an asset.
    function observedReceived(address asset) external view returns (uint256);
    /// @notice Currently releasable amount for an account and asset.
    function releasable(address asset, address account) external view returns (uint256);
    /// @notice Native dust not currently releasable because of integer division.
    function roundingDust(address asset) external view returns (uint256);
    /// @notice Emits or updates the explicit observation for an asset.
    function syncAsset(address asset) external returns (uint256);
    /// @notice Releases funds for an account to an authorized recipient.
    function release(address asset, address account, address payable recipient)
        external
        returns (uint256);
    /// @notice Initializes the wallet profile and aggregate shares.
    function initialize(
        bytes32 profileId_,
        bytes32 entriesHash_,
        bytes32 metadataURIHash_,
        SplitEntry[] calldata entries_,
        address[] calldata accounts_,
        uint32[] calldata aggregateSharePpm_
    ) external;
}
