// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IStreamSplitFactory.sol";
import "./StreamSplitWallet.sol";

/// @notice Creates immutable split profiles and their deterministic native split wallets.
contract StreamSplitFactory is IStreamSplitFactory {
    uint8 private constant _ASSET_STATUS_ACTIVE = 1;

    /// @notice Domain separator label for v1 split profile identifiers.
    bytes32 public constant override PROFILE_DOMAIN = keccak256("6529STREAM_SPLIT_PROFILE_V1");
    /// @notice Split profile schema version used in profile identifiers and events.
    uint16 public constant override SCHEMA_VERSION = 1;
    /// @notice Split wallet implementation version used in profile identifiers and events.
    uint16 public constant override WALLET_VERSION = 2;
    /// @notice Maximum canonical split entries accepted by one profile.
    uint16 public constant override MAX_ENTRIES = 64;
    /// @notice Maximum unique recipient accounts accepted by one profile.
    uint16 public constant override MAX_UNIQUE_ACCOUNTS = 64;
    /// @notice Parts-per-million denominator for split shares.
    uint32 public constant override SHARE_DENOMINATOR_PPM = 1_000_000;
    /// @notice Deployment-wide registry for approved standard ERC-20 split assets.
    IStreamAssetPolicyRegistry public immutable override assetPolicyRegistry;

    struct Profile {
        bool exists;
        bytes32 entriesHash;
        bytes32 metadataURIHash;
        address wallet;
        IStreamSplitWallet.SplitEntry[] entries;
        address[] accounts;
        uint32[] aggregateSharePpm;
    }

    mapping(bytes32 => Profile) private _profiles;

    constructor(IStreamAssetPolicyRegistry assetPolicyRegistry_) {
        if (address(assetPolicyRegistry_).code.length == 0) {
            revert InvalidAssetPolicyRegistry(address(assetPolicyRegistry_));
        }
        try assetPolicyRegistry_.isStreamAssetPolicyRegistry() returns (bool ok) {
            if (!ok) {
                revert InvalidAssetPolicyRegistry(address(assetPolicyRegistry_));
            }
        } catch {
            revert InvalidAssetPolicyRegistry(address(assetPolicyRegistry_));
        }
        try assetPolicyRegistry_.ASSET_STATUS_ACTIVE() returns (uint8 activeStatus) {
            if (activeStatus != _ASSET_STATUS_ACTIVE) {
                revert InvalidAssetPolicyRegistry(address(assetPolicyRegistry_));
            }
        } catch {
            revert InvalidAssetPolicyRegistry(address(assetPolicyRegistry_));
        }

        assetPolicyRegistry = assetPolicyRegistry_;
        emit AssetPolicyRegistryPinned(address(assetPolicyRegistry_));
    }

    /// @notice Returns the creation-code hash used for deterministic wallet addresses.
    function splitWalletInitCodeHash() public pure override returns (bytes32) {
        return keccak256(type(StreamSplitWallet).creationCode);
    }

    /// @notice Returns the runtime-code hash accepted for deployed split wallets.
    function splitWalletRuntimeCodeHash() public pure override returns (bytes32) {
        return keccak256(type(StreamSplitWallet).runtimeCode);
    }

    /// @notice Creates or reuses a canonical split profile and deploys its deterministic wallet.
    function createProfile(
        IStreamSplitWallet.SplitEntry[] calldata entries,
        bytes32 metadataURIHash
    ) external override returns (bytes32 profileId, address wallet) {
        (
            IStreamSplitWallet.SplitEntry[] memory canonicalEntries,
            address[] memory accounts,
            uint32[] memory aggregateShares,
            bytes32 entriesHash
        ) = _canonicalize(entries);
        profileId = _profileId(entriesHash, metadataURIHash);

        Profile storage profile = _profiles[profileId];
        bool created = !profile.exists;
        if (created) {
            profile.exists = true;
            profile.entriesHash = entriesHash;
            profile.metadataURIHash = metadataURIHash;
            for (uint256 i = 0; i < canonicalEntries.length; i++) {
                profile.entries.push(canonicalEntries[i]);
            }
            for (uint256 i = 0; i < accounts.length; i++) {
                profile.accounts.push(accounts[i]);
                profile.aggregateSharePpm.push(aggregateShares[i]);
            }
            emit SplitProfileCreated(
                profileId,
                entriesHash,
                metadataURIHash,
                SCHEMA_VERSION,
                WALLET_VERSION,
                walletFor(profileId)
            );
            for (uint256 i = 0; i < canonicalEntries.length; i++) {
                IStreamSplitWallet.SplitEntry memory splitEntry = canonicalEntries[i];
                emit SplitProfileEntry(
                    profileId,
                    // Safe because MAX_ENTRIES is 64, well below the uint16 limit.
                    // forge-lint: disable-next-line(unsafe-typecast)
                    uint16(i),
                    splitEntry.account,
                    splitEntry.sharePpm,
                    splitEntry.labelId
                );
            }
        }

        wallet = _deployWallet(profileId);
    }

    /// @notice Deploys the deterministic wallet for an existing profile if it is not deployed.
    function deployWallet(bytes32 profileId) external override returns (address wallet) {
        if (!_profiles[profileId].exists) {
            revert UnknownProfile(profileId);
        }
        wallet = _deployWallet(profileId);
    }

    /// @notice Returns whether a split profile has been created by this factory.
    function profileExists(bytes32 profileId) external view override returns (bool) {
        return _profiles[profileId].exists;
    }

    /// @notice Returns true when the profile wallet is deployed with expected code and metadata.
    function splitWalletExists(bytes32 profileId) external view override returns (bool) {
        Profile storage profile = _profiles[profileId];
        if (!profile.exists) {
            return false;
        }
        return _walletMatchesProfile(profileId, walletFor(profileId), profile);
    }

    /// @notice Returns the immutable metadata URI hash committed by a split profile.
    function profileMetadataURIHash(bytes32 profileId) external view override returns (bytes32) {
        return _profiles[profileId].metadataURIHash;
    }

    /// @notice Returns the canonical entry hash committed by a split profile.
    function profileEntriesHash(bytes32 profileId) external view override returns (bytes32) {
        return _profiles[profileId].entriesHash;
    }

    /// @notice Returns the CREATE2 wallet address for a profile whether or not it is deployed.
    function walletFor(bytes32 profileId) public view override returns (address) {
        return address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff), address(this), profileId, splitWalletInitCodeHash()
                        )
                    )
                )
            )
        );
    }

    /// @notice Computes the profile identifier for entries after canonical sorting.
    function profileIdFor(IStreamSplitWallet.SplitEntry[] calldata entries, bytes32 metadataURIHash)
        external
        view
        override
        returns (bytes32)
    {
        (,,, bytes32 entriesHash) = _canonicalize(entries);
        return _profileId(entriesHash, metadataURIHash);
    }

    /// @notice Returns the number of canonical entries stored for a profile.
    function profileEntryCount(bytes32 profileId) external view override returns (uint256) {
        return _profiles[profileId].entries.length;
    }

    /// @notice Returns one canonical profile entry by sorted index.
    function profileEntry(bytes32 profileId, uint256 index)
        external
        view
        override
        returns (address account, uint32 sharePpm, bytes32 labelId)
    {
        IStreamSplitWallet.SplitEntry storage splitEntry = _profiles[profileId].entries[index];
        return (splitEntry.account, splitEntry.sharePpm, splitEntry.labelId);
    }

    /// @notice Returns the number of unique accounts after label-level shares are aggregated.
    function profileUniqueAccountCount(bytes32 profileId) external view override returns (uint256) {
        return _profiles[profileId].accounts.length;
    }

    /// @notice Returns one unique account and its aggregate share by sorted account index.
    function profileUniqueAccount(bytes32 profileId, uint256 index)
        external
        view
        override
        returns (address account, uint32 sharePpm)
    {
        Profile storage profile = _profiles[profileId];
        account = profile.accounts[index];
        sharePpm = profile.aggregateSharePpm[index];
    }

    function _deployWallet(bytes32 profileId) private returns (address wallet) {
        Profile storage profile = _profiles[profileId];
        wallet = walletFor(profileId);
        if (wallet.code.length != 0) {
            if (wallet.codehash != splitWalletRuntimeCodeHash()) {
                revert SplitWalletAddressPoisoned(profileId, wallet);
            }
            _validateExistingWallet(profileId, wallet, profile);
            if (profile.wallet == address(0)) {
                profile.wallet = wallet;
                emit SplitWalletDiscovered(
                    profileId,
                    wallet,
                    WALLET_VERSION,
                    splitWalletInitCodeHash(),
                    splitWalletRuntimeCodeHash()
                );
            }
            return wallet;
        }

        StreamSplitWallet splitWallet = new StreamSplitWallet{ salt: profileId }();
        wallet = address(splitWallet);
        splitWallet.initialize(
            profileId,
            profile.entriesHash,
            profile.metadataURIHash,
            _copyEntries(profile),
            _copyAccounts(profile),
            _copyAggregateShares(profile)
        );
        profile.wallet = wallet;
        emit SplitWalletDeployed(
            profileId,
            wallet,
            WALLET_VERSION,
            splitWalletInitCodeHash(),
            splitWalletRuntimeCodeHash()
        );
    }

    function _validateExistingWallet(bytes32 profileId, address wallet, Profile storage profile)
        private
        view
    {
        if (!_walletMatchesProfile(profileId, wallet, profile)) {
            revert SplitWalletAddressPoisoned(profileId, wallet);
        }
    }

    function _walletMatchesProfile(bytes32 profileId, address wallet, Profile storage profile)
        private
        view
        returns (bool)
    {
        if (wallet.code.length == 0 || wallet.codehash != splitWalletRuntimeCodeHash()) {
            return false;
        }
        IStreamSplitWallet splitWallet = IStreamSplitWallet(wallet);
        try splitWallet.factory() returns (address walletFactory) {
            if (walletFactory != address(this)) {
                return false;
            }
        } catch {
            return false;
        }
        try splitWallet.initialized() returns (bool walletInitialized) {
            if (!walletInitialized) {
                return false;
            }
        } catch {
            return false;
        }
        try splitWallet.profileId() returns (bytes32 walletProfileId) {
            if (walletProfileId != profileId) {
                return false;
            }
        } catch {
            return false;
        }
        try splitWallet.entriesHash() returns (bytes32 walletEntriesHash) {
            if (walletEntriesHash != profile.entriesHash) {
                return false;
            }
        } catch {
            return false;
        }
        try splitWallet.metadataURIHash() returns (bytes32 walletMetadataURIHash) {
            return walletMetadataURIHash == profile.metadataURIHash;
        } catch {
            return false;
        }
    }

    function _profileId(bytes32 entriesHash, bytes32 metadataURIHash)
        private
        view
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                PROFILE_DOMAIN,
                uint256(block.chainid),
                address(this),
                SCHEMA_VERSION,
                WALLET_VERSION,
                splitWalletInitCodeHash(),
                splitWalletRuntimeCodeHash(),
                address(assetPolicyRegistry),
                entriesHash,
                metadataURIHash
            )
        );
    }

    function _canonicalize(IStreamSplitWallet.SplitEntry[] calldata entries)
        private
        pure
        returns (
            IStreamSplitWallet.SplitEntry[] memory canonicalEntries,
            address[] memory accounts,
            uint32[] memory aggregateShares,
            bytes32 entriesHash
        )
    {
        uint256 length = entries.length;
        if (length == 0 || length > MAX_ENTRIES) {
            revert InvalidEntryCount(length);
        }

        canonicalEntries = new IStreamSplitWallet.SplitEntry[](length);
        for (uint256 i = 0; i < length; i++) {
            canonicalEntries[i] = entries[i];
        }
        _sortEntries(canonicalEntries);

        address[] memory accountBuffer = new address[](length);
        uint32[] memory shareBuffer = new uint32[](length);
        uint256 uniqueCount = 0;
        uint256 totalShare = 0;
        for (uint256 i = 0; i < length; i++) {
            IStreamSplitWallet.SplitEntry memory splitEntry = canonicalEntries[i];
            if (splitEntry.account == address(0)) {
                revert InvalidSplitAccount(i);
            }
            if (splitEntry.sharePpm == 0) {
                revert InvalidSplitShare(i);
            }
            if (splitEntry.sharePpm > SHARE_DENOMINATOR_PPM) {
                revert InvalidSplitShare(i);
            }
            if (
                i != 0 && canonicalEntries[i - 1].account == splitEntry.account
                    && canonicalEntries[i - 1].labelId == splitEntry.labelId
            ) {
                revert DuplicateSplitEntry(splitEntry.account, splitEntry.labelId);
            }

            totalShare += splitEntry.sharePpm;
            if (i == 0 || canonicalEntries[i - 1].account != splitEntry.account) {
                uniqueCount++;
                if (uniqueCount > MAX_UNIQUE_ACCOUNTS) {
                    revert InvalidEntryCount(length);
                }
                accountBuffer[uniqueCount - 1] = splitEntry.account;
            }
            shareBuffer[uniqueCount - 1] += splitEntry.sharePpm;
        }
        if (totalShare != SHARE_DENOMINATOR_PPM) {
            revert InvalidSplitTotal(totalShare);
        }

        accounts = new address[](uniqueCount);
        aggregateShares = new uint32[](uniqueCount);
        for (uint256 i = 0; i < uniqueCount; i++) {
            accounts[i] = accountBuffer[i];
            aggregateShares[i] = shareBuffer[i];
        }
        entriesHash = keccak256(abi.encode(canonicalEntries));
    }

    function _sortEntries(IStreamSplitWallet.SplitEntry[] memory entries) private pure {
        for (uint256 i = 1; i < entries.length; i++) {
            IStreamSplitWallet.SplitEntry memory current = entries[i];
            uint256 j = i;
            while (j > 0 && _entryLess(current, entries[j - 1])) {
                entries[j] = entries[j - 1];
                j--;
            }
            entries[j] = current;
        }
    }

    function _entryLess(
        IStreamSplitWallet.SplitEntry memory left,
        IStreamSplitWallet.SplitEntry memory right
    ) private pure returns (bool) {
        if (left.account != right.account) {
            return uint160(left.account) < uint160(right.account);
        }
        if (left.labelId != right.labelId) {
            return uint256(left.labelId) < uint256(right.labelId);
        }
        return left.sharePpm < right.sharePpm;
    }

    function _copyEntries(Profile storage profile)
        private
        view
        returns (IStreamSplitWallet.SplitEntry[] memory entries)
    {
        entries = new IStreamSplitWallet.SplitEntry[](profile.entries.length);
        for (uint256 i = 0; i < profile.entries.length; i++) {
            entries[i] = profile.entries[i];
        }
    }

    function _copyAccounts(Profile storage profile)
        private
        view
        returns (address[] memory accounts)
    {
        accounts = new address[](profile.accounts.length);
        for (uint256 i = 0; i < profile.accounts.length; i++) {
            accounts[i] = profile.accounts[i];
        }
    }

    function _copyAggregateShares(Profile storage profile)
        private
        view
        returns (uint32[] memory aggregateShares)
    {
        aggregateShares = new uint32[](profile.aggregateSharePpm.length);
        for (uint256 i = 0; i < profile.aggregateSharePpm.length; i++) {
            aggregateShares[i] = profile.aggregateSharePpm[i];
        }
    }
}
