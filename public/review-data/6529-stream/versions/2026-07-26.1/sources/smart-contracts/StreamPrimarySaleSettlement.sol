// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IStreamAssetPolicyRegistry.sol";
import "./IStreamPrimarySaleSettlement.sol";
import "./IStreamSplitFactory.sol";
import "./Ownable.sol";
import "./ReentrancyGuard.sol";

interface IERC20PrimarySettlementAsset {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

/// @notice Outside-Core adapter for recording official primary-sale settlement evidence.
contract StreamPrimarySaleSettlement is IStreamPrimarySaleSettlement, Ownable, ReentrancyGuard {
    bytes32 private constant _SETTLEMENT_KEY_DOMAIN =
        keccak256("6529STREAM_PRIMARY_SETTLEMENT_KEY_V1");
    bytes32 private constant _OFFICIAL_SETTLED_DOMAIN =
        keccak256("6529STREAM_OFFICIAL_PRIMARY_SETTLED_V1");
    bytes32 private constant _SALE_CONTEXT_DOMAIN = keccak256("6529STREAM_PRIMARY_SALE_CONTEXT_V1");
    uint8 private constant _ASSET_STATUS_ACTIVE = 1;
    uint256 private constant _ASSET_POLICY_GAS_LIMIT = 30_000;
    uint256 private constant _ASSET_POLICY_PARENT_GAS_MIN = 31_000;

    bytes32 public constant override PRIMARY_POLICY_DOMAIN = keccak256("STREAM_PRIMARY_POLICY_V1");
    uint8 public constant override POLICY_MODE_STRICT_MATCH = 0;
    uint8 public constant override POLICY_MODE_ALLOW_CURRENT = 1;

    IStreamRevenueResolver public immutable override revenueResolver;
    IStreamSplitFactory public immutable splitFactory;
    IStreamAssetPolicyRegistry public immutable assetPolicyRegistry;

    mapping(address => bool) public override settlementCaller;
    mapping(bytes32 => bool) public override settlementConsumed;
    mapping(bytes32 => uint256) private _officialSettled;
    mapping(address => uint256) public override totalOfficialSettled;

    struct SaleResolution {
        bytes32 profileId;
        address wallet;
        uint8 assignmentType;
        bytes32 templateId;
        bytes32 assignmentHash;
        bytes32 resolvedPolicyHash;
    }

    constructor(IStreamRevenueResolver revenueResolver_) {
        if (address(revenueResolver_).code.length == 0) {
            revert PrimaryAssignmentMissing(bytes32(0), 0, 0);
        }
        try revenueResolver_.isStreamRevenueResolver() returns (bool ok) {
            if (!ok) {
                revert PrimaryAssignmentMissing(bytes32(0), 0, 0);
            }
        } catch {
            revert PrimaryAssignmentMissing(bytes32(0), 0, 0);
        }

        IStreamSplitFactory splitFactory_ = IStreamSplitFactory(revenueResolver_.splitFactory());
        if (address(splitFactory_).code.length == 0) {
            revert UnverifiedSplitWallet(bytes32(0), address(0));
        }
        IStreamAssetPolicyRegistry assetPolicyRegistry_ = splitFactory_.assetPolicyRegistry();
        if (address(assetPolicyRegistry_).code.length == 0) {
            revert AssetPolicyReadFailed(address(assetPolicyRegistry_), address(0));
        }
        try assetPolicyRegistry_.ASSET_STATUS_ACTIVE() returns (uint8 activeStatus) {
            if (activeStatus != _ASSET_STATUS_ACTIVE) {
                revert AssetPolicyReadFailed(address(assetPolicyRegistry_), address(0));
            }
        } catch {
            revert AssetPolicyReadFailed(address(assetPolicyRegistry_), address(0));
        }

        revenueResolver = revenueResolver_;
        splitFactory = splitFactory_;
        assetPolicyRegistry = assetPolicyRegistry_;
    }

    /// @notice Returns true for deployment validation.
    function isStreamPrimarySaleSettlement() external pure override returns (bool) {
        return true;
    }

    /// @notice Enables or disables a settlement caller.
    function setSettlementCaller(address caller, bool enabled) external override onlyOwner {
        if (caller == address(0)) {
            revert InvalidSettlementCaller(caller);
        }
        settlementCaller[caller] = enabled;
        emit SettlementCallerUpdated(caller, enabled, msg.sender);
    }

    /// @notice Settles a native ETH primary sale into the resolved split wallet.
    function settleNativePrimarySale(PrimarySale calldata sale)
        external
        payable
        override
        nonReentrant
        returns (bytes32 key, bytes32 profileId, address wallet)
    {
        _requireSettlementCaller();
        _validateSale(sale);
        if (msg.value != sale.amount) {
            revert IncorrectNativeValue(sale.amount, msg.value);
        }
        key = _settlementKey(sale);
        _requireSettlementUnconsumed(key);
        SaleResolution memory resolution = _resolveSale(sale);
        _consumeSettlementKey(key);
        profileId = resolution.profileId;
        wallet = resolution.wallet;

        (bool success,) = payable(wallet).call{ value: sale.amount }("");
        if (!success) {
            revert NativeTransferFailed(wallet, sale.amount);
        }

        _recordOfficialSettlement(key, sale, address(0), resolution);
    }

    /// @notice Settles an approved standard ERC-20 primary sale into the resolved split wallet.
    function settleERC20PrimarySale(PrimarySale calldata sale, address asset)
        external
        override
        nonReentrant
        returns (bytes32 key, bytes32 profileId, address wallet)
    {
        _requireSettlementCaller();
        _validateSale(sale);
        _requireActiveAsset(asset);
        key = _settlementKey(sale);
        _requireSettlementUnconsumed(key);
        SaleResolution memory resolution = _resolveSale(sale);
        _consumeSettlementKey(key);
        profileId = resolution.profileId;
        wallet = resolution.wallet;

        _transferFromERC20(asset, sale.payer, address(this), sale.amount);
        _transferERC20(asset, address(this), wallet, sale.amount);

        _recordOfficialSettlement(key, sale, asset, resolution);
    }

    /// @notice Computes the consumed settlement key for a sale context.
    function settlementKey(PrimarySale calldata sale) external view override returns (bytes32) {
        return _settlementKey(sale);
    }

    /// @notice Computes the resolved primary policy hash for explicit settlement inputs.
    function resolvedPrimaryPolicyHash(
        bytes32 revenueClass,
        uint256 collectionId,
        uint256 tokenId,
        bytes32 templateId,
        bytes32 profileId,
        address wallet,
        bytes32 assignmentHash
    ) external view override returns (bytes32) {
        return _resolvedPrimaryPolicyHash(
            revenueClass, collectionId, tokenId, templateId, profileId, wallet, assignmentHash
        );
    }

    /// @notice Returns official primary revenue settled for a wallet/profile/revenue class/asset.
    function officialSettled(bytes32 revenueClass, bytes32 profileId, address wallet, address asset)
        external
        view
        override
        returns (uint256)
    {
        return _officialSettled[_officialSettledKey(revenueClass, profileId, wallet, asset)];
    }

    function _requireSettlementCaller() private view {
        if (!settlementCaller[msg.sender]) {
            revert UnauthorizedSettlementCaller(msg.sender);
        }
    }

    function _validateSale(PrimarySale calldata sale) private pure {
        if (
            sale.settlementId == bytes32(0) || sale.revenueClass == bytes32(0)
                || sale.expectedPolicyHash == bytes32(0) || sale.payer == address(0)
                || sale.amount == 0
        ) {
            revert InvalidPrimarySale(sale.settlementId);
        }
        if (
            sale.policyMode != POLICY_MODE_STRICT_MATCH
                && sale.policyMode != POLICY_MODE_ALLOW_CURRENT
        ) {
            revert InvalidPolicyMode(sale.policyMode);
        }
    }

    function _requireSettlementUnconsumed(bytes32 key) private view {
        if (settlementConsumed[key]) {
            revert SettlementAlreadyConsumed(key);
        }
    }

    function _consumeSettlementKey(bytes32 key) private {
        settlementConsumed[key] = true;
    }

    function _resolveSale(PrimarySale calldata sale)
        private
        returns (SaleResolution memory resolution)
    {
        IStreamRevenueResolver.ResolvedPrimaryAssignment memory assignment =
            revenueResolver.resolvePrimaryAssignment(
                sale.collectionId, sale.tokenId, sale.revenueClass
            );
        if (!assignment.exists) {
            revert PrimaryAssignmentMissing(sale.revenueClass, sale.collectionId, sale.tokenId);
        }

        if (assignment.assignmentType == revenueResolver.ASSIGNMENT_TYPE_PROFILE()) {
            resolution.profileId = assignment.profileId;
            resolution.wallet = splitFactory.walletFor(resolution.profileId);
            if (!splitFactory.splitWalletExists(resolution.profileId)) {
                revert UnverifiedSplitWallet(resolution.profileId, resolution.wallet);
            }
        } else if (assignment.assignmentType == revenueResolver.ASSIGNMENT_TYPE_TEMPLATE()) {
            (resolution.profileId, resolution.wallet,) =
                revenueResolver.materializePrimaryProfile(assignment.templateId, sale.poster);
            resolution.templateId = assignment.templateId;
            address expectedWallet = splitFactory.walletFor(resolution.profileId);
            if (
                resolution.wallet != expectedWallet
                    || !splitFactory.splitWalletExists(resolution.profileId)
            ) {
                revert UnverifiedSplitWallet(resolution.profileId, resolution.wallet);
            }
        } else {
            revert PrimaryAssignmentMissing(sale.revenueClass, sale.collectionId, sale.tokenId);
        }

        resolution.assignmentType = assignment.assignmentType;
        resolution.assignmentHash = assignment.assignmentHash;
        resolution.resolvedPolicyHash = _resolvedPrimaryPolicyHash(
            sale.revenueClass,
            sale.collectionId,
            sale.tokenId,
            resolution.templateId,
            resolution.profileId,
            resolution.wallet,
            assignment.assignmentHash
        );
        if (
            sale.policyMode == POLICY_MODE_STRICT_MATCH
                && resolution.resolvedPolicyHash != sale.expectedPolicyHash
        ) {
            revert PrimaryPolicyHashMismatch(sale.expectedPolicyHash, resolution.resolvedPolicyHash);
        }
    }

    function _recordOfficialSettlement(
        bytes32 key,
        PrimarySale calldata sale,
        address asset,
        SaleResolution memory resolution
    ) private {
        bytes32 totalsKey = _officialSettledKey(
            sale.revenueClass, resolution.profileId, resolution.wallet, asset
        );
        _officialSettled[totalsKey] += sale.amount;
        totalOfficialSettled[asset] += sale.amount;
        bool policyDrift = sale.expectedPolicyHash != resolution.resolvedPolicyHash;
        bytes32 contextHash = _saleContextHash(sale, asset, resolution);

        _emitPrimaryRevenueSettled(key, sale, asset, resolution, contextHash, policyDrift);
        _emitPrimaryRevenueSettlementContext(key, sale, resolution.profileId, resolution.templateId);
        _emitPrimaryRevenueSettlementPolicy(key, sale, resolution);
    }

    function _emitPrimaryRevenueSettled(
        bytes32 key,
        PrimarySale calldata sale,
        address asset,
        SaleResolution memory resolution,
        bytes32 contextHash,
        bool policyDrift
    ) private {
        emit PrimaryRevenueSettled(
            key,
            sale.revenueClass,
            resolution.profileId,
            resolution.wallet,
            asset,
            sale.payer,
            sale.amount,
            contextHash,
            policyDrift,
            resolution.assignmentType
        );
    }

    function _emitPrimaryRevenueSettlementContext(
        bytes32 key,
        PrimarySale calldata sale,
        bytes32 profileId,
        bytes32 templateId
    ) private {
        emit PrimaryRevenueSettlementContext(
            key,
            sale.revenueClass,
            profileId,
            msg.sender,
            sale.settlementId,
            sale.policyMode,
            sale.collectionId,
            sale.tokenId,
            sale.saleId,
            sale.poster,
            sale.beneficiary,
            templateId
        );
    }

    function _emitPrimaryRevenueSettlementPolicy(
        bytes32 key,
        PrimarySale calldata sale,
        SaleResolution memory resolution
    ) private {
        emit PrimaryRevenueSettlementPolicy(
            key,
            sale.revenueClass,
            resolution.profileId,
            sale.expectedPolicyHash,
            resolution.resolvedPolicyHash,
            resolution.assignmentHash,
            resolution.templateId
        );
    }

    function _requireActiveAsset(address asset) private view {
        if (asset == address(0) || asset.code.length == 0) {
            revert UnsupportedAsset(asset);
        }
        address registry = address(assetPolicyRegistry);
        (bool success, uint256 statusWord) = _readAssetStatusWord(registry, asset);
        if (!success || statusWord > type(uint8).max) {
            revert AssetPolicyReadFailed(registry, asset);
        }
        // Safe because statusWord is bounded to uint8 above.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint8 status = uint8(statusWord);
        if (status != _ASSET_STATUS_ACTIVE) {
            revert AssetNotActive(asset, status);
        }
    }

    function _settlementKey(PrimarySale calldata sale) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                _SETTLEMENT_KEY_DOMAIN,
                uint256(block.chainid),
                address(this),
                sale.settlementId,
                sale.revenueClass,
                sale.collectionId,
                sale.tokenId,
                sale.saleId,
                sale.payer,
                sale.poster,
                sale.beneficiary,
                sale.amount
            )
        );
    }

    function _officialSettledKey(
        bytes32 revenueClass,
        bytes32 profileId,
        address wallet,
        address asset
    ) private pure returns (bytes32) {
        return keccak256(
            abi.encode(_OFFICIAL_SETTLED_DOMAIN, revenueClass, profileId, wallet, asset)
        );
    }

    function _saleContextHash(
        PrimarySale calldata sale,
        address asset,
        SaleResolution memory resolution
    ) private view returns (bytes32) {
        bytes32 saleIdentityHash = keccak256(
            abi.encode(sale.settlementId, sale.collectionId, sale.tokenId, sale.saleId)
        );
        bytes32 participantHash =
            keccak256(abi.encode(msg.sender, sale.payer, sale.poster, sale.beneficiary));
        bytes32 policyHash = keccak256(
            abi.encode(
                sale.policyMode,
                sale.expectedPolicyHash,
                resolution.resolvedPolicyHash,
                resolution.assignmentHash
            )
        );
        return keccak256(
            abi.encode(
                _SALE_CONTEXT_DOMAIN,
                uint256(block.chainid),
                address(this),
                sale.revenueClass,
                saleIdentityHash,
                participantHash,
                asset,
                sale.amount,
                policyHash,
                resolution.templateId,
                resolution.profileId,
                resolution.wallet
            )
        );
    }

    function _resolvedPrimaryPolicyHash(
        bytes32 revenueClass,
        uint256 collectionId,
        uint256 tokenId,
        bytes32 templateId,
        bytes32 profileId,
        address wallet,
        bytes32 assignmentHash
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                PRIMARY_POLICY_DOMAIN,
                uint256(block.chainid),
                address(revenueResolver),
                revenueClass,
                collectionId,
                tokenId,
                templateId,
                profileId,
                wallet,
                assignmentHash
            )
        );
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
        uint256 selector = uint32(IERC20PrimarySettlementAsset.balanceOf.selector);
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

    function _transferFromERC20(address asset, address from, address to, uint256 amount) private {
        uint256 fromBefore = _erc20BalanceOf(asset, from);
        uint256 toBefore = _erc20BalanceOf(asset, to);
        _callTransferFrom(asset, from, to, amount);
        _assertERC20TransferDelta(asset, from, to, amount, fromBefore, toBefore);
    }

    function _transferERC20(address asset, address from, address to, uint256 amount) private {
        uint256 fromBefore = _erc20BalanceOf(asset, from);
        uint256 toBefore = _erc20BalanceOf(asset, to);
        _callTransfer(asset, to, amount);
        _assertERC20TransferDelta(asset, from, to, amount, fromBefore, toBefore);
    }

    function _assertERC20TransferDelta(
        address asset,
        address from,
        address to,
        uint256 amount,
        uint256 fromBefore,
        uint256 toBefore
    ) private view {
        uint256 fromAfter = _erc20BalanceOf(asset, from);
        uint256 toAfter = _erc20BalanceOf(asset, to);
        if (fromBefore < amount || type(uint256).max - toBefore < amount) {
            revert ERC20TransferInvariantBroken(
                asset, from, to, fromBefore, fromAfter, toBefore, toAfter
            );
        }
        uint256 expectedFrom = fromBefore - amount;
        uint256 expectedTo = toBefore + amount;
        if (fromAfter != expectedFrom || toAfter != expectedTo) {
            revert ERC20TransferInvariantBroken(
                asset, from, to, expectedFrom, fromAfter, expectedTo, toAfter
            );
        }
    }

    function _callTransferFrom(address asset, address from, address to, uint256 amount) private {
        bool success;
        uint256 transferResult;
        uint256 selector = uint32(IERC20PrimarySettlementAsset.transferFrom.selector);
        assembly ("memory-safe") {
            let ptr := mload(0x40)
            mstore(ptr, shl(224, selector))
            mstore(add(ptr, 0x04), from)
            mstore(add(ptr, 0x24), to)
            mstore(add(ptr, 0x44), amount)
            success := call(gas(), asset, 0, ptr, 0x64, 0, 0)
            if iszero(and(success, eq(returndatasize(), 0x20))) { success := 0 }
            if success {
                returndatacopy(ptr, 0, 0x20)
                transferResult := mload(ptr)
            }
        }
        if (!success || transferResult != 1) {
            revert ERC20TransferFailed(asset, from, to, amount);
        }
    }

    function _callTransfer(address asset, address to, uint256 amount) private {
        bool success;
        uint256 transferResult;
        uint256 selector = uint32(IERC20PrimarySettlementAsset.transfer.selector);
        assembly ("memory-safe") {
            let ptr := mload(0x40)
            mstore(ptr, shl(224, selector))
            mstore(add(ptr, 0x04), to)
            mstore(add(ptr, 0x24), amount)
            success := call(gas(), asset, 0, ptr, 0x44, 0, 0)
            if iszero(and(success, eq(returndatasize(), 0x20))) { success := 0 }
            if success {
                returndatacopy(ptr, 0, 0x20)
                transferResult := mload(ptr)
            }
        }
        if (!success || transferResult != 1) {
            revert ERC20TransferFailed(asset, address(this), to, amount);
        }
    }
}
