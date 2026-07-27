// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IStreamSplitWallet.sol";
import "./Math.sol";
import "./ReentrancyGuard.sol";

interface IERC20SplitAsset {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

interface IStreamSplitFactoryAssetPolicy {
    function assetPolicyRegistry() external view returns (address);
}

/// @notice Pull-payment split wallet for one immutable split profile.
contract StreamSplitWallet is IStreamSplitWallet, ReentrancyGuard {
    uint8 private constant _ASSET_STATUS_ACTIVE = 1;
    uint256 private constant _ASSET_POLICY_GAS_LIMIT = 30_000;
    uint256 private constant _ASSET_POLICY_PARENT_GAS_MIN = 31_000;

    /// @notice Parts-per-million denominator for split shares.
    uint32 public constant override SHARE_DENOMINATOR_PPM = 1_000_000;
    /// @notice Factory that deployed this wallet and is allowed to initialize it once.
    address public override factory;
    /// @notice Whether the factory has initialized the immutable split profile.
    bool public override initialized;
    /// @notice Profile identifier that binds wallet code, entries, metadata, chain, and factory.
    bytes32 public override profileId;
    /// @notice Canonical hash of the split entries used to initialize this wallet.
    bytes32 public override entriesHash;
    /// @notice Hash of the off-chain profile metadata URI for catalogue and provenance material.
    bytes32 public override metadataURIHash;

    SplitEntry[] private _entries;
    address[] private _uniqueAccounts;
    /// @notice Aggregate parts-per-million share for a unique account across all labels.
    mapping(address => uint32) public override aggregateSharePpm;
    /// @notice Amount released for an account by asset address.
    mapping(address => mapping(address => uint256)) public override accountReleased;
    /// @notice Total amount released by asset address.
    mapping(address => uint256) public override totalReleased;
    /// @notice Whether an asset observation has emitted its initialization event.
    mapping(address => bool) public override assetObservationInitialized;
    /// @notice Last observed cumulative receipts value recorded through syncAsset or release.
    mapping(address => uint256) public override lastObservedReceived;

    constructor() {
        factory = msg.sender;
    }

    /// @notice Accepts native ETH receipts passively for later pull release.
    receive() external payable { }

    /// @notice Returns the deployment-wide asset policy registry pinned by the factory.
    function assetPolicyRegistry() public view override returns (address registry) {
        registry = _assetPolicyRegistryOrRevert(address(0));
    }

    /// @notice Initializes the wallet with immutable entries and aggregate account shares.
    function initialize(
        bytes32 profileId_,
        bytes32 entriesHash_,
        bytes32 metadataURIHash_,
        SplitEntry[] calldata entries_,
        address[] calldata accounts_,
        uint32[] calldata aggregateSharePpm_
    ) external override {
        if (msg.sender != factory) {
            revert UnauthorizedInitializer(msg.sender);
        }
        if (initialized) {
            revert AlreadyInitialized();
        }
        if (entries_.length == 0 || accounts_.length == 0) {
            revert InvalidInitializationInput();
        }
        if (accounts_.length != aggregateSharePpm_.length) {
            revert InvalidInitializationInput();
        }
        if (keccak256(abi.encode(entries_)) != entriesHash_) {
            revert InvalidInitializationInput();
        }

        initialized = true;
        profileId = profileId_;
        entriesHash = entriesHash_;
        metadataURIHash = metadataURIHash_;

        uint256 entryTotal = 0;
        uint256 aggregateTotal = 0;
        for (uint256 i = 0; i < entries_.length; i++) {
            if (entries_[i].account == address(0) || entries_[i].sharePpm == 0) {
                revert InvalidInitializationInput();
            }
            entryTotal += entries_[i].sharePpm;
            _entries.push(entries_[i]);
        }
        for (uint256 i = 0; i < accounts_.length; i++) {
            address account = accounts_[i];
            uint32 sharePpm = aggregateSharePpm_[i];
            if (account == address(0) || sharePpm == 0 || aggregateSharePpm[account] != 0) {
                revert InvalidInitializationInput();
            }
            uint256 expectedSharePpm = 0;
            for (uint256 j = 0; j < entries_.length; j++) {
                if (entries_[j].account == account) {
                    expectedSharePpm += entries_[j].sharePpm;
                }
            }
            if (expectedSharePpm != sharePpm) {
                revert InvalidInitializationInput();
            }
            _uniqueAccounts.push(account);
            aggregateSharePpm[account] = sharePpm;
            aggregateTotal += sharePpm;
        }
        if (entryTotal != SHARE_DENOMINATOR_PPM) {
            revert InvalidInitializationInput();
        }
        if (aggregateTotal != SHARE_DENOMINATOR_PPM) {
            revert InvalidInitializationInput();
        }
    }

    /// @notice Returns the number of canonical label-level split entries.
    function entryCount() external view override returns (uint256) {
        return _entries.length;
    }

    /// @notice Returns one canonical label-level split entry.
    function entry(uint256 index)
        external
        view
        override
        returns (address account, uint32 sharePpm, bytes32 labelId)
    {
        SplitEntry storage splitEntry = _entries[index];
        return (splitEntry.account, splitEntry.sharePpm, splitEntry.labelId);
    }

    /// @notice Returns the number of unique accounts after label shares are aggregated.
    function uniqueAccountCount() external view override returns (uint256) {
        return _uniqueAccounts.length;
    }

    /// @notice Returns one unique account and its aggregate share by sorted account index.
    function uniqueAccount(uint256 index)
        external
        view
        override
        returns (address account, uint32 sharePpm)
    {
        account = _uniqueAccounts[index];
        sharePpm = aggregateSharePpm[account];
    }

    /// @notice Returns cumulative native receipts observed as current balance plus released funds.
    function observedReceived(address asset) public view override returns (uint256) {
        return _currentBalance(asset) + totalReleased[asset];
    }

    /// @notice Returns the currently releasable native amount for an account.
    function releasable(address asset, address account) public view override returns (uint256) {
        uint32 sharePpm = aggregateSharePpm[account];
        if (sharePpm == 0) {
            _requireSupportedAsset(asset);
            return 0;
        }

        uint256 entitlement = Math.mulDiv(observedReceived(asset), sharePpm, SHARE_DENOMINATOR_PPM);
        uint256 released = accountReleased[asset][account];
        if (entitlement <= released) {
            return 0;
        }
        return entitlement - released;
    }

    /// @notice Returns unreleasable native dust caused by integer division rounding.
    function roundingDust(address asset) external view override returns (uint256) {
        uint256 totalReleasable = 0;
        for (uint256 i = 0; i < _uniqueAccounts.length; i++) {
            totalReleasable += releasable(asset, _uniqueAccounts[i]);
        }
        uint256 currentBalance = _currentBalance(asset);
        if (totalReleasable >= currentBalance) {
            return 0;
        }
        return currentBalance - totalReleasable;
    }

    /// @notice Emits the current cumulative receipt observation for the native asset.
    function syncAsset(address asset) external override nonReentrant returns (uint256 observed) {
        observed = observedReceived(asset);
        _recordObservation(asset, observed);
    }

    /// @notice Pulls releasable native funds for an account to that account or its chosen recipient.
    function release(address asset, address account, address payable recipient)
        external
        override
        nonReentrant
        returns (uint256 amount)
    {
        _requireSupportedAsset(asset);
        if (recipient == address(0)) {
            revert ZeroRecipient();
        }
        if (recipient != account && msg.sender != account) {
            revert UnauthorizedReleaseRecipient(msg.sender, account, recipient);
        }

        uint256 observed = observedReceived(asset);
        amount = releasable(asset, account);
        if (amount == 0) {
            revert NoReleasableFunds(asset, account);
        }

        accountReleased[asset][account] += amount;
        totalReleased[asset] += amount;

        if (asset == address(0)) {
            (bool success,) = recipient.call{ value: amount }("");
            if (!success) {
                revert NativeTransferFailed(recipient, amount);
            }

            uint256 postTransferObserved = observedReceived(asset);
            if (postTransferObserved != observed) {
                revert NativeReceiptInvariantBroken(observed, postTransferObserved);
            }
            _recordObservation(asset, observed);

            emit NativeReleased(
                profileId, account, recipient, amount, totalReleased[asset], observed
            );
            return amount;
        }

        _transferERC20(asset, recipient, amount);
        uint256 postERC20Observed = observedReceived(asset);
        if (postERC20Observed != observed) {
            revert ObservedReceiptsDecreased(asset, observed, postERC20Observed);
        }
        _recordObservation(asset, observed);

        emit ERC20Released(
            profileId, asset, account, recipient, amount, totalReleased[asset], observed
        );
    }

    function _recordObservation(address asset, uint256 observed) private {
        if (!assetObservationInitialized[asset]) {
            assetObservationInitialized[asset] = true;
            lastObservedReceived[asset] = observed;
            emit AssetObservationInitialized(profileId, asset, observed);
            return;
        }

        uint256 previous = lastObservedReceived[asset];
        if (observed < previous) {
            revert ObservedReceiptsDecreased(asset, previous, observed);
        }
        if (observed == previous) {
            return;
        }
        lastObservedReceived[asset] = observed;
        emit AssetSynced(profileId, asset, previous, observed);
    }

    function _requireSupportedAsset(address asset) private view {
        if (asset == address(0)) {
            return;
        }
        if (asset.code.length == 0) {
            revert UnsupportedAsset(asset);
        }
        address registry = _assetPolicyRegistryOrRevert(asset);
        (bool success, uint256 statusWord) = _readAssetStatusWord(registry, asset);
        if (!success) {
            revert AssetPolicyReadFailed(registry, asset);
        }
        if (statusWord > type(uint8).max) {
            revert AssetPolicyReadFailed(registry, asset);
        }
        // Safe because statusWord is bounded to uint8 above.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint8 status = uint8(statusWord);
        if (status != _ASSET_STATUS_ACTIVE) {
            revert AssetNotActive(asset, status);
        }
    }

    function _currentBalance(address asset) private view returns (uint256) {
        _requireSupportedAsset(asset);
        if (asset == address(0)) {
            return address(this).balance;
        }
        return _erc20BalanceOf(asset, address(this));
    }

    function _assetPolicyRegistryOrRevert(address asset) private view returns (address registry) {
        (bool success, bytes memory data) = factory.staticcall(
            abi.encodeWithSelector(IStreamSplitFactoryAssetPolicy.assetPolicyRegistry.selector)
        );
        if (!success || data.length != 32) {
            revert AssetPolicyReadFailed(factory, asset);
        }
        registry = abi.decode(data, (address));
        if (registry.code.length == 0) {
            revert AssetPolicyReadFailed(registry, asset);
        }
    }

    function _readAssetStatusWord(address registry, address asset)
        private
        view
        returns (bool success, uint256 statusWord)
    {
        if (gasleft() < _ASSET_POLICY_PARENT_GAS_MIN) {
            return (false, 0);
        }
        uint256 selector = uint32(bytes4(keccak256("assetStatus(address)")));
        uint256 gasLimit = _ASSET_POLICY_GAS_LIMIT;
        assembly ("memory-safe") {
            let ptr := mload(0x40)
            mstore(ptr, shl(224, selector))
            mstore(add(ptr, 0x04), asset)
            success := staticcall(gasLimit, registry, ptr, 0x24, 0, 0)
            if iszero(and(success, eq(returndatasize(), 0x20))) { success := 0 }
            if success {
                returndatacopy(ptr, 0, 0x20)
                statusWord := mload(ptr)
            }
        }
    }

    function _erc20BalanceOf(address asset, address account) private view returns (uint256 amount) {
        bool success;
        uint256 selector = uint32(IERC20SplitAsset.balanceOf.selector);
        assembly ("memory-safe") {
            let ptr := mload(0x40)
            mstore(ptr, shl(224, selector))
            mstore(add(ptr, 0x04), account)
            success := staticcall(gas(), asset, ptr, 0x24, 0, 0)
            if iszero(and(success, eq(returndatasize(), 0x20))) { success := 0 }
            if success {
                returndatacopy(ptr, 0, 0x20)
                amount := mload(ptr)
            }
        }
        if (!success) {
            revert ERC20BalanceReadFailed(asset, account);
        }
    }

    function _transferERC20(address asset, address payable recipient, uint256 amount) private {
        uint256 walletBefore = _erc20BalanceOf(asset, address(this));
        uint256 recipientBefore = _erc20BalanceOf(asset, recipient);
        uint256 expectedWalletBalance = walletBefore - amount;
        uint256 expectedRecipientBalance = recipientBefore + amount;

        bool success;
        uint256 transferResult;
        uint256 selector = uint32(IERC20SplitAsset.transfer.selector);
        assembly ("memory-safe") {
            let ptr := mload(0x40)
            mstore(ptr, shl(224, selector))
            mstore(add(ptr, 0x04), recipient)
            mstore(add(ptr, 0x24), amount)
            success := call(gas(), asset, 0, ptr, 0x44, 0, 0)
            if iszero(and(success, eq(returndatasize(), 0x20))) { success := 0 }
            if success {
                returndatacopy(ptr, 0, 0x20)
                transferResult := mload(ptr)
            }
        }
        if (!success || transferResult != 1) {
            revert ERC20TransferFailed(asset, recipient, amount);
        }

        uint256 walletAfter = _erc20BalanceOf(asset, address(this));
        uint256 recipientAfter = _erc20BalanceOf(asset, recipient);
        if (walletAfter != expectedWalletBalance || recipientAfter != expectedRecipientBalance) {
            revert ERC20TransferInvariantBroken(
                asset,
                recipient,
                expectedWalletBalance,
                walletAfter,
                expectedRecipientBalance,
                recipientAfter
            );
        }
    }
}
