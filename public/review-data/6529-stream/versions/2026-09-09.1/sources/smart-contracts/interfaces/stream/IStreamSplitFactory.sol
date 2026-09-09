// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IStreamSplitWallet.sol";
import "./IStreamAssetPolicyRegistry.sol";

/// @notice Interface for creating deterministic split profiles and wallets.
interface IStreamSplitFactory {
    /// @notice Reverts when two canonical entries use the same account and label.
    error DuplicateSplitEntry(address account, bytes32 labelId);
    /// @notice Reverts when a split profile has zero entries or exceeds the entry limit.
    error InvalidEntryCount(uint256 count);
    /// @notice Reverts when a split entry account is the zero address.
    error InvalidSplitAccount(uint256 index);
    /// @notice Reverts when a split entry share is zero or above the denominator.
    error InvalidSplitShare(uint256 index);
    /// @notice Reverts when split entry shares do not sum to the denominator.
    error InvalidSplitTotal(uint256 totalSharePpm);
    /// @notice Reverts when the factory is initialized with an invalid asset policy registry.
    error InvalidAssetPolicyRegistry(address registry);
    /// @notice Reverts when the deterministic wallet address already has unexpected code.
    error SplitWalletAddressPoisoned(bytes32 profileId, address wallet);
    /// @notice Reverts when a caller asks to deploy a profile that does not exist.
    error UnknownProfile(bytes32 profileId);

    /// @notice Emitted once when a canonical split profile is first created.
    event SplitProfileCreated(
        bytes32 indexed profileId,
        bytes32 indexed entriesHash,
        bytes32 indexed metadataURIHash,
        uint16 schemaVersion,
        uint16 walletVersion,
        address wallet
    );
    /// @notice Emitted for each canonical label-level split entry in a created profile.
    event SplitProfileEntry(
        bytes32 indexed profileId,
        uint16 indexed index,
        address indexed account,
        uint32 sharePpm,
        bytes32 labelId
    );
    /// @notice Emitted when the factory deploys a split wallet for a profile.
    event SplitWalletDeployed(
        bytes32 indexed profileId,
        address indexed wallet,
        uint16 indexed walletVersion,
        bytes32 initCodeHash,
        bytes32 runtimeCodeHash
    );
    /// @notice Emitted when the factory records a pre-existing wallet with expected code.
    event SplitWalletDiscovered(
        bytes32 indexed profileId,
        address indexed wallet,
        uint16 indexed walletVersion,
        bytes32 initCodeHash,
        bytes32 runtimeCodeHash
    );
    /// @notice Emitted once when the factory pins its deployment-wide asset policy registry.
    event AssetPolicyRegistryPinned(address indexed registry);

    /// @notice Domain separator label for profile identifiers.
    function PROFILE_DOMAIN() external pure returns (bytes32);
    /// @notice Split profile schema version.
    function SCHEMA_VERSION() external pure returns (uint16);
    /// @notice Split wallet implementation version.
    function WALLET_VERSION() external pure returns (uint16);
    /// @notice Maximum label-level entries in one profile.
    function MAX_ENTRIES() external pure returns (uint16);
    /// @notice Maximum unique account aggregates in one profile.
    function MAX_UNIQUE_ACCOUNTS() external pure returns (uint16);
    /// @notice Parts-per-million share denominator.
    function SHARE_DENOMINATOR_PPM() external pure returns (uint32);
    /// @notice Deployment-wide asset policy registry pinned for split-wallet ERC-20 support.
    function assetPolicyRegistry() external view returns (IStreamAssetPolicyRegistry);
    /// @notice Returns the wallet creation-code hash used by CREATE2.
    function splitWalletInitCodeHash() external pure returns (bytes32);
    /// @notice Returns the wallet runtime-code hash accepted after deployment.
    function splitWalletRuntimeCodeHash() external pure returns (bytes32);
    /// @notice Creates or reuses a split profile and deploys its wallet.
    function createProfile(
        IStreamSplitWallet.SplitEntry[] calldata entries,
        bytes32 metadataURIHash
    ) external returns (bytes32 profileId, address wallet);
    /// @notice Deploys the wallet for an existing profile.
    function deployWallet(bytes32 profileId) external returns (address wallet);
    /// @notice Returns true when a profile exists.
    function profileExists(bytes32 profileId) external view returns (bool);
    /// @notice Returns true when the profile wallet is deployed with expected code and metadata.
    function splitWalletExists(bytes32 profileId) external view returns (bool);
    /// @notice Returns the metadata URI hash committed by a profile.
    function profileMetadataURIHash(bytes32 profileId) external view returns (bytes32);
    /// @notice Returns the canonical entries hash committed by a profile.
    function profileEntriesHash(bytes32 profileId) external view returns (bytes32);
    /// @notice Returns the deterministic wallet address for a profile.
    function walletFor(bytes32 profileId) external view returns (address);
    /// @notice Computes a profile identifier for entries and metadata.
    function profileIdFor(IStreamSplitWallet.SplitEntry[] calldata entries, bytes32 metadataURIHash)
        external
        view
        returns (bytes32);
    /// @notice Returns the canonical entry count for a profile.
    function profileEntryCount(bytes32 profileId) external view returns (uint256);
    /// @notice Returns one canonical profile entry by index.
    function profileEntry(bytes32 profileId, uint256 index)
        external
        view
        returns (address account, uint32 sharePpm, bytes32 labelId);
    /// @notice Returns the unique account count for a profile.
    function profileUniqueAccountCount(bytes32 profileId) external view returns (uint256);
    /// @notice Returns one unique account and aggregate share by index.
    function profileUniqueAccount(bytes32 profileId, uint256 index)
        external
        view
        returns (address account, uint32 sharePpm);
}
