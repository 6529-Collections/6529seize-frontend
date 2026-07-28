// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IStreamAssetPolicyRegistry.sol";
import "../smart-contracts/IStreamSplitFactory.sol";
import "../smart-contracts/IStreamSplitWallet.sol";
import "../smart-contracts/StreamAssetPolicyRegistry.sol";
import "../smart-contracts/StreamSplitFactory.sol";
import "../smart-contracts/StreamSplitWallet.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";

contract StreamSplitWalletTest is CharacterizationTestBase {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    address private constant ACCOUNT_A = address(0x1001);
    address private constant ACCOUNT_B = address(0x2002);
    address private constant ACCOUNT_C = address(0x3003);
    address payable private constant WITHDRAW_RECIPIENT = payable(address(0x4004));
    bytes32 private constant LABEL_ARTIST = keccak256("artist");
    bytes32 private constant LABEL_ESTATE = keccak256("artist-estate");
    bytes32 private constant LABEL_PROTOCOL = keccak256("protocol");
    bytes32 private constant METADATA_HASH = keccak256("ipfs://split-profile");
    bytes32 private constant STANDARD_ERC20_POLICY_HASH = keccak256("standard-erc20-policy");
    bytes32 private constant SPLIT_PROFILE_CREATED_TOPIC =
        keccak256("SplitProfileCreated(bytes32,bytes32,bytes32,uint16,uint16,address)");
    bytes32 private constant SPLIT_WALLET_DEPLOYED_TOPIC =
        keccak256("SplitWalletDeployed(bytes32,address,uint16,bytes32,bytes32)");
    bytes32 private constant SPLIT_WALLET_DISCOVERED_TOPIC =
        keccak256("SplitWalletDiscovered(bytes32,address,uint16,bytes32,bytes32)");
    bytes32 private constant ASSET_OBSERVATION_INITIALIZED_TOPIC =
        keccak256("AssetObservationInitialized(bytes32,address,uint256)");
    bytes32 private constant ASSET_SYNCED_TOPIC =
        keccak256("AssetSynced(bytes32,address,uint256,uint256)");

    StreamAssetPolicyRegistry private assetPolicyRegistry;
    StreamSplitFactory private factory;

    event AssetObservationInitialized(
        bytes32 indexed profileId, address indexed asset, uint256 observedReceived
    );
    event AssetSynced(
        bytes32 indexed profileId,
        address indexed asset,
        uint256 previousObservedReceived,
        uint256 observedReceived
    );

    function setUp() public {
        assetPolicyRegistry = new StreamAssetPolicyRegistry();
        factory = new StreamSplitFactory(assetPolicyRegistry);
    }

    function testAssetPolicyRegistryLifecycleAndFactoryPin() public {
        StandardERC20Mock token = new StandardERC20Mock();

        uint256(assetPolicyRegistry.assetStatus(address(token)))
            .assertEq(assetPolicyRegistry.ASSET_STATUS_UNKNOWN(), "default status");
        assetPolicyRegistry.isAssetActive(address(token)).assertFalse("default inactive");
        address(factory.assetPolicyRegistry())
            .assertEq(address(assetPolicyRegistry), "factory registry");
        IStreamSplitWallet wallet = _createTwoAccountWallet();
        wallet.assetPolicyRegistry().assertEq(address(assetPolicyRegistry), "wallet registry");

        uint8 activeStatusForRevert = assetPolicyRegistry.ASSET_STATUS_ACTIVE();
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(ACCOUNT_A);
        assetPolicyRegistry.setAssetStatus(
            address(token), activeStatusForRevert, STANDARD_ERC20_POLICY_HASH
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamAssetPolicyRegistry.InvalidAsset.selector, address(0x123456)
            )
        );
        assetPolicyRegistry.setAssetStatus(
            address(0x123456), activeStatusForRevert, STANDARD_ERC20_POLICY_HASH
        );

        assetPolicyRegistry.setAssetStatus(
            address(token), assetPolicyRegistry.ASSET_STATUS_ACTIVE(), STANDARD_ERC20_POLICY_HASH
        );
        (uint8 activeStatus, bytes32 activePolicyHash, uint64 activeEffectiveAt) =
            assetPolicyRegistry.assetPolicy(address(token));
        uint256(activeStatus).assertEq(assetPolicyRegistry.ASSET_STATUS_ACTIVE(), "active status");
        activePolicyHash.assertEq(STANDARD_ERC20_POLICY_HASH, "policy hash");
        uint256(activeEffectiveAt).assertEq(block.timestamp, "effective timestamp");
        assetPolicyRegistry.isAssetActive(address(token)).assertTrue("active");

        assetPolicyRegistry.setAssetStatus(
            address(token), assetPolicyRegistry.ASSET_STATUS_DEPRECATED(), keccak256("deprecated")
        );
        uint256(assetPolicyRegistry.assetStatus(address(token)))
            .assertEq(assetPolicyRegistry.ASSET_STATUS_DEPRECATED(), "deprecated");
        assetPolicyRegistry.isAssetActive(address(token)).assertFalse("deprecated inactive");
    }

    function testAssetPolicyRegistryRejectsInvalidUpdatesAndCanClearPolicy() public {
        StandardERC20Mock token = new StandardERC20Mock();
        uint8 active = assetPolicyRegistry.ASSET_STATUS_ACTIVE();
        uint8 unknown = assetPolicyRegistry.ASSET_STATUS_UNKNOWN();
        uint8 invalid = assetPolicyRegistry.ASSET_STATUS_UNSUPPORTED() + 1;

        vm.expectRevert(
            abi.encodeWithSelector(IStreamAssetPolicyRegistry.InvalidAssetStatus.selector, invalid)
        );
        assetPolicyRegistry.setAssetStatus(address(token), invalid, STANDARD_ERC20_POLICY_HASH);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamAssetPolicyRegistry.InvalidAssetPolicyHash.selector,
                address(token),
                active,
                bytes32(0)
            )
        );
        assetPolicyRegistry.setAssetStatus(address(token), active, bytes32(0));

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamAssetPolicyRegistry.InvalidAssetPolicyHash.selector,
                address(token),
                unknown,
                STANDARD_ERC20_POLICY_HASH
            )
        );
        assetPolicyRegistry.setAssetStatus(address(token), unknown, STANDARD_ERC20_POLICY_HASH);

        assetPolicyRegistry.setAssetStatus(address(token), active, STANDARD_ERC20_POLICY_HASH);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamAssetPolicyRegistry.AssetPolicyUnchanged.selector,
                address(token),
                active,
                STANDARD_ERC20_POLICY_HASH
            )
        );
        assetPolicyRegistry.setAssetStatus(address(token), active, STANDARD_ERC20_POLICY_HASH);

        assetPolicyRegistry.setAssetStatus(address(token), unknown, bytes32(0));
        uint256(assetPolicyRegistry.assetStatus(address(token))).assertEq(unknown, "cleared status");
        assetPolicyRegistry.assetPolicyHash(address(token)).assertEq(bytes32(0), "cleared hash");
        assetPolicyRegistry.isAssetActive(address(token)).assertFalse("cleared inactive");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamAssetPolicyRegistry.AssetPolicyUnchanged.selector,
                address(token),
                unknown,
                bytes32(0)
            )
        );
        assetPolicyRegistry.setAssetStatus(address(token), unknown, bytes32(0));
    }

    function testSplitFactoryRejectsInvalidAssetPolicyRegistry() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitFactory.InvalidAssetPolicyRegistry.selector, address(0)
            )
        );
        new StreamSplitFactory(IStreamAssetPolicyRegistry(address(0)));

        address noCodeRegistry = address(0x123456);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitFactory.InvalidAssetPolicyRegistry.selector, noCodeRegistry
            )
        );
        new StreamSplitFactory(IStreamAssetPolicyRegistry(noCodeRegistry));

        NoMarkerRegistryMock noMarker = new NoMarkerRegistryMock();
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitFactory.InvalidAssetPolicyRegistry.selector, address(noMarker)
            )
        );
        new StreamSplitFactory(IStreamAssetPolicyRegistry(address(noMarker)));

        WrongActiveStatusRegistryMock wrongActive = new WrongActiveStatusRegistryMock();
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitFactory.InvalidAssetPolicyRegistry.selector, address(wrongActive)
            )
        );
        new StreamSplitFactory(IStreamAssetPolicyRegistry(address(wrongActive)));
    }

    function testCreateProfileRejectsZeroAccountZeroShareAndBadPpmSum() public {
        IStreamSplitWallet.SplitEntry[] memory emptyEntries = new IStreamSplitWallet.SplitEntry[](0);
        vm.expectRevert(abi.encodeWithSelector(IStreamSplitFactory.InvalidEntryCount.selector, 0));
        factory.createProfile(emptyEntries, METADATA_HASH);

        IStreamSplitWallet.SplitEntry[] memory zeroAccount = _singleEntry(address(0), 1_000_000);
        vm.expectRevert(abi.encodeWithSelector(IStreamSplitFactory.InvalidSplitAccount.selector, 0));
        factory.createProfile(zeroAccount, METADATA_HASH);

        IStreamSplitWallet.SplitEntry[] memory zeroShare = _singleEntry(ACCOUNT_A, 0);
        vm.expectRevert(abi.encodeWithSelector(IStreamSplitFactory.InvalidSplitShare.selector, 0));
        factory.createProfile(zeroShare, METADATA_HASH);

        IStreamSplitWallet.SplitEntry[] memory tooLargeShare = _singleEntry(ACCOUNT_A, 1_000_001);
        vm.expectRevert(abi.encodeWithSelector(IStreamSplitFactory.InvalidSplitShare.selector, 0));
        factory.createProfile(tooLargeShare, METADATA_HASH);

        IStreamSplitWallet.SplitEntry[] memory badTotal = _singleEntry(ACCOUNT_A, 999_999);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamSplitFactory.InvalidSplitTotal.selector, 999_999)
        );
        factory.createProfile(badTotal, METADATA_HASH);
    }

    function testCreateProfileCanonicalizesEntriesAndRejectsDuplicateAccountLabel() public {
        IStreamSplitWallet.SplitEntry[] memory entries = new IStreamSplitWallet.SplitEntry[](3);
        entries[0] = IStreamSplitWallet.SplitEntry(ACCOUNT_B, 400_000, LABEL_ESTATE);
        entries[1] = IStreamSplitWallet.SplitEntry(ACCOUNT_A, 300_000, LABEL_ARTIST);
        entries[2] = IStreamSplitWallet.SplitEntry(ACCOUNT_B, 300_000, LABEL_PROTOCOL);

        (bytes32 profileId, address walletAddress) = factory.createProfile(entries, METADATA_HASH);

        factory.profileEntryCount(profileId).assertEq(3, "entry count");
        walletAddress.assertEq(factory.walletFor(profileId), "wallet address");
        (address account0, uint32 share0, bytes32 label0) = factory.profileEntry(profileId, 0);
        account0.assertEq(ACCOUNT_A, "entry 0 account");
        uint256(share0).assertEq(300_000, "entry 0 share");
        label0.assertEq(LABEL_ARTIST, "entry 0 label");
        (address account1, uint32 share1, bytes32 label1) = factory.profileEntry(profileId, 1);
        account1.assertEq(ACCOUNT_B, "entry 1 account");
        uint256(share1).assertEq(400_000, "entry 1 share");
        label1.assertEq(LABEL_ESTATE, "entry 1 label");
        (address account2, uint32 share2, bytes32 label2) = factory.profileEntry(profileId, 2);
        account2.assertEq(ACCOUNT_B, "entry 2 account");
        uint256(share2).assertEq(300_000, "entry 2 share");
        label2.assertEq(LABEL_PROTOCOL, "entry 2 label");

        IStreamSplitWallet.SplitEntry[] memory duplicate = new IStreamSplitWallet.SplitEntry[](2);
        duplicate[0] = IStreamSplitWallet.SplitEntry(ACCOUNT_A, 500_000, LABEL_ARTIST);
        duplicate[1] = IStreamSplitWallet.SplitEntry(ACCOUNT_A, 500_000, LABEL_ARTIST);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitFactory.DuplicateSplitEntry.selector, ACCOUNT_A, LABEL_ARTIST
            )
        );
        factory.createProfile(duplicate, METADATA_HASH);

        IStreamSplitWallet.SplitEntry[] memory separatedDuplicate =
            new IStreamSplitWallet.SplitEntry[](4);
        separatedDuplicate[0] = IStreamSplitWallet.SplitEntry(ACCOUNT_A, 300_000, LABEL_ARTIST);
        separatedDuplicate[1] = IStreamSplitWallet.SplitEntry(ACCOUNT_B, 200_000, LABEL_PROTOCOL);
        separatedDuplicate[2] = IStreamSplitWallet.SplitEntry(ACCOUNT_A, 200_000, LABEL_ESTATE);
        separatedDuplicate[3] = IStreamSplitWallet.SplitEntry(ACCOUNT_A, 300_000, LABEL_ARTIST);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitFactory.DuplicateSplitEntry.selector, ACCOUNT_A, LABEL_ARTIST
            )
        );
        factory.createProfile(separatedDuplicate, METADATA_HASH);
    }

    function testCreateProfileAllowsSameAccountUnderDifferentLabelsAndAggregatesShares() public {
        IStreamSplitWallet.SplitEntry[] memory entries = new IStreamSplitWallet.SplitEntry[](3);
        entries[0] = IStreamSplitWallet.SplitEntry(ACCOUNT_A, 250_000, LABEL_ARTIST);
        entries[1] = IStreamSplitWallet.SplitEntry(ACCOUNT_A, 250_000, LABEL_ESTATE);
        entries[2] = IStreamSplitWallet.SplitEntry(ACCOUNT_B, 500_000, LABEL_PROTOCOL);

        (bytes32 profileId, address walletAddress) = factory.createProfile(entries, METADATA_HASH);
        IStreamSplitWallet wallet = IStreamSplitWallet(walletAddress);

        factory.profileUniqueAccountCount(profileId).assertEq(2, "factory account count");
        (address firstAccount, uint32 firstShare) = factory.profileUniqueAccount(profileId, 0);
        firstAccount.assertEq(ACCOUNT_A, "first account");
        uint256(firstShare).assertEq(500_000, "first aggregate");
        (address secondAccount, uint32 secondShare) = wallet.uniqueAccount(1);
        secondAccount.assertEq(ACCOUNT_B, "second account");
        uint256(secondShare).assertEq(500_000, "second aggregate");
        uint256(wallet.aggregateSharePpm(ACCOUNT_A)).assertEq(500_000, "wallet aggregate");
    }

    function testProfileIdBindsFactoryWalletVersionCodeHashesEntriesAndMetadata() public view {
        IStreamSplitWallet.SplitEntry[] memory entries = _twoEntryProfile();
        bytes32 profileId = factory.profileIdFor(entries, METADATA_HASH);

        IStreamSplitWallet.SplitEntry[] memory canonical = new IStreamSplitWallet.SplitEntry[](2);
        canonical[0] = IStreamSplitWallet.SplitEntry(ACCOUNT_A, 700_000, LABEL_ARTIST);
        canonical[1] = IStreamSplitWallet.SplitEntry(ACCOUNT_B, 300_000, LABEL_PROTOCOL);
        bytes32 entriesHash = keccak256(abi.encode(canonical));
        bytes32 expectedProfileId = keccak256(
            abi.encode(
                factory.PROFILE_DOMAIN(),
                uint256(block.chainid),
                address(factory),
                factory.SCHEMA_VERSION(),
                factory.WALLET_VERSION(),
                factory.splitWalletInitCodeHash(),
                factory.splitWalletRuntimeCodeHash(),
                address(assetPolicyRegistry),
                entriesHash,
                METADATA_HASH
            )
        );

        profileId.assertEq(expectedProfileId, "profile id");
        IStreamSplitWallet.SplitEntry[] memory reordered = new IStreamSplitWallet.SplitEntry[](2);
        reordered[0] = IStreamSplitWallet.SplitEntry(ACCOUNT_A, 700_000, LABEL_ARTIST);
        reordered[1] = IStreamSplitWallet.SplitEntry(ACCOUNT_B, 300_000, LABEL_PROTOCOL);
        factory.profileIdFor(reordered, METADATA_HASH).assertEq(profileId, "canonical profile id");
        address expectedWallet = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            address(factory),
                            profileId,
                            factory.splitWalletInitCodeHash()
                        )
                    )
                )
            )
        );
        factory.walletFor(profileId).assertEq(expectedWallet, "wallet address");
    }

    function testProfileIdChangesWhenOnlyMetadataHashChanges() public view {
        IStreamSplitWallet.SplitEntry[] memory entries = _twoEntryProfile();
        bytes32 profileId = factory.profileIdFor(entries, METADATA_HASH);
        bytes32 changedMetadataProfileId =
            factory.profileIdFor(entries, keccak256("ipfs://other-split-profile"));

        require(profileId != changedMetadataProfileId, "metadata changes profile id");
        factory.walletFor(profileId).assertEq(factory.walletFor(profileId), "stable wallet lookup");
        require(
            factory.walletFor(profileId) != factory.walletFor(changedMetadataProfileId),
            "metadata changes wallet"
        );
    }

    function testFactoryAndWalletViewsMatchCanonicalStorageAndEntriesHash() public {
        IStreamSplitWallet.SplitEntry[] memory entries = new IStreamSplitWallet.SplitEntry[](4);
        entries[0] = IStreamSplitWallet.SplitEntry(ACCOUNT_B, 200_000, LABEL_PROTOCOL);
        entries[1] = IStreamSplitWallet.SplitEntry(ACCOUNT_A, 250_000, LABEL_ESTATE);
        entries[2] = IStreamSplitWallet.SplitEntry(ACCOUNT_C, 300_000, LABEL_ARTIST);
        entries[3] = IStreamSplitWallet.SplitEntry(ACCOUNT_A, 250_000, LABEL_ARTIST);

        (bytes32 profileId, address walletAddress) = factory.createProfile(entries, METADATA_HASH);
        IStreamSplitWallet wallet = IStreamSplitWallet(walletAddress);

        uint256 entryCount = factory.profileEntryCount(profileId);
        entryCount.assertEq(wallet.entryCount(), "entry count");
        IStreamSplitWallet.SplitEntry[] memory canonicalEntries =
            new IStreamSplitWallet.SplitEntry[](entryCount);
        for (uint256 i = 0; i < entryCount; i++) {
            (address factoryAccount, uint32 factoryShare, bytes32 factoryLabel) =
                factory.profileEntry(profileId, i);
            (address walletAccount, uint32 walletShare, bytes32 walletLabel) = wallet.entry(i);

            factoryAccount.assertEq(walletAccount, "entry account");
            uint256(factoryShare).assertEq(walletShare, "entry share");
            factoryLabel.assertEq(walletLabel, "entry label");
            canonicalEntries[i] =
                IStreamSplitWallet.SplitEntry(factoryAccount, factoryShare, factoryLabel);
        }
        keccak256(abi.encode(canonicalEntries))
            .assertEq(factory.profileEntriesHash(profileId), "entries hash");
        wallet.entriesHash().assertEq(factory.profileEntriesHash(profileId), "wallet hash");

        uint256 accountCount = factory.profileUniqueAccountCount(profileId);
        accountCount.assertEq(wallet.uniqueAccountCount(), "unique account count");
        for (uint256 i = 0; i < accountCount; i++) {
            (address factoryAccount, uint32 factoryShare) =
                factory.profileUniqueAccount(profileId, i);
            (address walletAccount, uint32 walletShare) = wallet.uniqueAccount(i);

            factoryAccount.assertEq(walletAccount, "unique account");
            uint256(factoryShare).assertEq(walletShare, "unique share");
            uint256(wallet.aggregateSharePpm(factoryAccount))
                .assertEq(factoryShare, "aggregate getter");
        }
    }

    function testCreateProfileSecondCallDoesNotReemitCreationOrDeploymentEvents() public {
        IStreamSplitWallet.SplitEntry[] memory entries = _twoEntryProfile();
        (bytes32 profileId, address walletAddress) = factory.createProfile(entries, METADATA_HASH);

        vm.recordLogs();
        (bytes32 repeatedProfileId, address repeatedWallet) =
            factory.createProfile(entries, METADATA_HASH);
        Vm.Log[] memory repeatedLogs = vm.getRecordedLogs();

        repeatedProfileId.assertEq(profileId, "profile id");
        repeatedWallet.assertEq(walletAddress, "wallet");
        _countTopic(repeatedLogs, address(factory), SPLIT_PROFILE_CREATED_TOPIC)
            .assertEq(0, "no profile recreated");
        _countTopic(repeatedLogs, address(factory), SPLIT_WALLET_DEPLOYED_TOPIC)
            .assertEq(0, "no wallet redeployed");
        _countTopic(repeatedLogs, address(factory), SPLIT_WALLET_DISCOVERED_TOPIC)
            .assertEq(0, "no wallet rediscovered");
    }

    function testDeployWalletIsDeterministicIdempotentAndInitializesOnce() public {
        IStreamSplitWallet.SplitEntry[] memory entries = _twoEntryProfile();
        bytes32 profileId = factory.profileIdFor(entries, METADATA_HASH);
        address predictedWallet = factory.walletFor(profileId);

        (bytes32 createdProfileId, address walletAddress) =
            factory.createProfile(entries, METADATA_HASH);
        IStreamSplitWallet wallet = IStreamSplitWallet(walletAddress);

        createdProfileId.assertEq(profileId, "created profile");
        walletAddress.assertEq(predictedWallet, "deterministic wallet");
        wallet.initialized().assertTrue("wallet initialized");
        wallet.profileId().assertEq(profileId, "wallet profile");
        factory.deployWallet(profileId).assertEq(walletAddress, "idempotent deploy");
        bytes32 entriesHash = factory.profileEntriesHash(profileId);
        address[] memory accounts = _accounts(ACCOUNT_A, ACCOUNT_B);
        uint32[] memory shares = _shares(700_000, 300_000);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.UnauthorizedInitializer.selector, address(this)
            )
        );
        wallet.initialize(profileId, entriesHash, METADATA_HASH, entries, accounts, shares);

        vm.prank(address(factory));
        vm.expectRevert(abi.encodeWithSelector(IStreamSplitWallet.AlreadyInitialized.selector));
        wallet.initialize(profileId, entriesHash, METADATA_HASH, entries, accounts, shares);
    }

    function testWalletInitializationRejectsMismatchedEntriesHash() public {
        StreamSplitWallet wallet = new StreamSplitWallet();
        IStreamSplitWallet.SplitEntry[] memory entries = _twoEntryProfile();
        address[] memory accounts = _accounts(ACCOUNT_A, ACCOUNT_B);
        uint32[] memory shares = _shares(700_000, 300_000);

        vm.expectRevert(
            abi.encodeWithSelector(IStreamSplitWallet.InvalidInitializationInput.selector)
        );
        wallet.initialize(
            keccak256("profile"), keccak256("wrong"), METADATA_HASH, entries, accounts, shares
        );
    }

    function testWalletInitializationRejectsMismatchedAggregateShares() public {
        StreamSplitWallet wallet = new StreamSplitWallet();
        IStreamSplitWallet.SplitEntry[] memory entries = _twoEntryProfile();
        address[] memory accounts = _accounts(ACCOUNT_A, ACCOUNT_B);
        uint32[] memory badShares = _shares(600_000, 400_000);

        vm.expectRevert(
            abi.encodeWithSelector(IStreamSplitWallet.InvalidInitializationInput.selector)
        );
        wallet.initialize(
            keccak256("profile"),
            keccak256(abi.encode(entries)),
            METADATA_HASH,
            entries,
            accounts,
            badShares
        );
    }

    function testDeployWalletRejectsUnknownProfile() public {
        bytes32 unknownProfile = keccak256("unknown");
        vm.expectRevert(
            abi.encodeWithSelector(IStreamSplitFactory.UnknownProfile.selector, unknownProfile)
        );
        factory.deployWallet(unknownProfile);
    }

    function testDeployWalletRejectsWrongCodeAtPredictedAddress() public {
        IStreamSplitWallet.SplitEntry[] memory entries = _twoEntryProfile();
        bytes32 profileId = factory.profileIdFor(entries, METADATA_HASH);
        address predictedWallet = factory.walletFor(profileId);
        WrongRuntimeCode wrongRuntime = new WrongRuntimeCode();
        vm.etch(predictedWallet, address(wrongRuntime).code);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitFactory.SplitWalletAddressPoisoned.selector, profileId, predictedWallet
            )
        );
        factory.createProfile(entries, METADATA_HASH);
    }

    function testDeployWalletRejectsExpectedRuntimeCodeWithBadStorageAtPredictedAddress() public {
        IStreamSplitWallet.SplitEntry[] memory entries = _twoEntryProfile();
        bytes32 profileId = factory.profileIdFor(entries, METADATA_HASH);
        address predictedWallet = factory.walletFor(profileId);
        vm.etch(predictedWallet, type(StreamSplitWallet).runtimeCode);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitFactory.SplitWalletAddressPoisoned.selector, profileId, predictedWallet
            )
        );
        factory.createProfile(entries, METADATA_HASH);
    }

    function testMaximumEntriesAreEnforced() public {
        IStreamSplitWallet.SplitEntry[] memory tooMany = new IStreamSplitWallet.SplitEntry[](65);
        for (uint256 i = 0; i < tooMany.length; i++) {
            tooMany[i] = IStreamSplitWallet.SplitEntry(address(uint160(0x1000 + i)), 1, bytes32(i));
        }

        vm.expectRevert(abi.encodeWithSelector(IStreamSplitFactory.InvalidEntryCount.selector, 65));
        factory.createProfile(tooMany, METADATA_HASH);

        IStreamSplitWallet.SplitEntry[] memory maxEntries = new IStreamSplitWallet.SplitEntry[](64);
        for (uint256 i = 0; i < maxEntries.length; i++) {
            uint32 share = i == maxEntries.length - 1 ? 999_937 : 1;
            maxEntries[i] =
                IStreamSplitWallet.SplitEntry(address(uint160(0x2000 + i)), share, bytes32(i));
        }
        (bytes32 profileId,) = factory.createProfile(maxEntries, METADATA_HASH);
        factory.profileEntryCount(profileId).assertEq(64, "max entries");
    }

    function testNativeReceiveSyncAndReleaseUseCumulativeObservedReceipts() public {
        IStreamSplitWallet wallet = _createTwoAccountWallet();
        (bool sent,) = payable(address(wallet)).call{ value: 10 ether }("");
        sent.assertTrue("fund wallet");

        wallet.observedReceived(address(0)).assertEq(10 ether, "observed");
        wallet.releasable(address(0), ACCOUNT_A).assertEq(7 ether, "account a releasable");
        wallet.releasable(address(0), ACCOUNT_B).assertEq(3 ether, "account b releasable");
        wallet.syncAsset(address(0)).assertEq(10 ether, "sync");

        uint256 balanceBefore = ACCOUNT_A.balance;
        wallet.release(address(0), ACCOUNT_A, payable(ACCOUNT_A)).assertEq(7 ether, "released");
        ACCOUNT_A.balance.assertEq(balanceBefore + 7 ether, "account a balance");
        wallet.accountReleased(address(0), ACCOUNT_A).assertEq(7 ether, "account released");
        wallet.totalReleased(address(0)).assertEq(7 ether, "total released");
        wallet.observedReceived(address(0)).assertEq(10 ether, "observed unchanged");

        (sent,) = payable(address(wallet)).call{ value: 1 ether }("");
        sent.assertTrue("fund again");
        wallet.releasable(address(0), ACCOUNT_A).assertEq(0.7 ether, "cumulative account a");
    }

    function testNativeReleasesAcrossAccountsAndReceiptRounds() public {
        IStreamSplitWallet wallet = _createTwoAccountWallet();
        (bool sent,) = payable(address(wallet)).call{ value: 10 ether }("");
        sent.assertTrue("fund wallet");

        wallet.release(address(0), ACCOUNT_A, payable(ACCOUNT_A)).assertEq(7 ether, "a first");
        wallet.release(address(0), ACCOUNT_B, payable(ACCOUNT_B)).assertEq(3 ether, "b first");
        address(wallet).balance.assertEq(0, "first round drained");
        wallet.totalReleased(address(0)).assertEq(10 ether, "first released total");

        (sent,) = payable(address(wallet)).call{ value: 5 ether }("");
        sent.assertTrue("fund second round");

        wallet.releasable(address(0), ACCOUNT_A).assertEq(3.5 ether, "a second releasable");
        wallet.releasable(address(0), ACCOUNT_B).assertEq(1.5 ether, "b second releasable");
        wallet.release(address(0), ACCOUNT_B, payable(ACCOUNT_B)).assertEq(1.5 ether, "b second");
        wallet.release(address(0), ACCOUNT_A, payable(ACCOUNT_A)).assertEq(3.5 ether, "a second");

        address(wallet).balance.assertEq(0, "second round drained");
        wallet.totalReleased(address(0)).assertEq(15 ether, "released total");
        wallet.observedReceived(address(0)).assertEq(15 ether, "observed cumulative");
        wallet.lastObservedReceived(address(0)).assertEq(15 ether, "last observed");
    }

    function testCounterfactualWalletPrefundingIsAccountedAtDeployment() public {
        IStreamSplitWallet.SplitEntry[] memory entries = _twoEntryProfile();
        bytes32 profileId = factory.profileIdFor(entries, METADATA_HASH);
        address predictedWallet = factory.walletFor(profileId);
        vm.deal(predictedWallet, 10 ether);

        (bytes32 createdProfileId, address walletAddress) =
            factory.createProfile(entries, METADATA_HASH);
        IStreamSplitWallet wallet = IStreamSplitWallet(walletAddress);

        createdProfileId.assertEq(profileId, "profile id");
        walletAddress.assertEq(predictedWallet, "prefunded wallet");
        wallet.observedReceived(address(0)).assertEq(10 ether, "observed prefund");
        wallet.releasable(address(0), ACCOUNT_A).assertEq(7 ether, "account a prefund");
        wallet.releasable(address(0), ACCOUNT_B).assertEq(3 ether, "account b prefund");
    }

    function testReleasableUsesFullPrecisionMulDivForLargeObservedReceipts() public {
        IStreamSplitWallet wallet = _createSingleAccountWallet(ACCOUNT_A);
        vm.deal(address(wallet), type(uint256).max);

        wallet.observedReceived(address(0)).assertEq(type(uint256).max, "observed");
        wallet.releasable(address(0), ACCOUNT_A)
            .assertEq(type(uint256).max, "full precision entitlement");
    }

    function testSyncAssetRecordsInitializationIncreaseAndSkipsUnchangedObservations() public {
        IStreamSplitWallet wallet = _createTwoAccountWallet();
        bytes32 profileId = wallet.profileId();

        vm.expectEmit(true, true, false, true);
        emit AssetObservationInitialized(profileId, address(0), 0);
        wallet.syncAsset(address(0)).assertEq(0, "initial sync");
        wallet.assetObservationInitialized(address(0)).assertTrue("observation initialized");
        wallet.lastObservedReceived(address(0)).assertEq(0, "initial observed");

        vm.recordLogs();
        wallet.syncAsset(address(0)).assertEq(0, "unchanged sync");
        Vm.Log[] memory unchangedLogs = vm.getRecordedLogs();
        _countTopic(unchangedLogs, address(wallet), ASSET_OBSERVATION_INITIALIZED_TOPIC)
            .assertEq(0, "unchanged init events");
        _countTopic(unchangedLogs, address(wallet), ASSET_SYNCED_TOPIC)
            .assertEq(0, "unchanged sync events");

        (bool sent,) = payable(address(wallet)).call{ value: 10 ether }("");
        sent.assertTrue("fund wallet");
        vm.expectEmit(true, true, false, true);
        emit AssetSynced(profileId, address(0), 0, 10 ether);
        wallet.syncAsset(address(0)).assertEq(10 ether, "funded sync");
        wallet.lastObservedReceived(address(0)).assertEq(10 ether, "funded observed");

        vm.recordLogs();
        wallet.syncAsset(address(0)).assertEq(10 ether, "unchanged funded sync");
        Vm.Log[] memory secondUnchangedLogs = vm.getRecordedLogs();
        _countTopic(secondUnchangedLogs, address(wallet), ASSET_SYNCED_TOPIC)
            .assertEq(0, "second unchanged sync events");
    }

    function testSyncAssetRejectsDecreasingObservedReceipts() public {
        IStreamSplitWallet wallet = _createTwoAccountWallet();
        vm.deal(address(wallet), 10 ether);
        wallet.syncAsset(address(0)).assertEq(10 ether, "initial observed");
        vm.deal(address(wallet), 9 ether);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.ObservedReceiptsDecreased.selector, address(0), 10 ether, 9 ether
            )
        );
        wallet.syncAsset(address(0));
    }

    function testReleaseBeforeSyncInitializesObservationAndKeepsAccountKey() public {
        IStreamSplitWallet wallet = _createTwoAccountWallet();
        (bool sent,) = payable(address(wallet)).call{ value: 10 ether }("");
        sent.assertTrue("fund wallet");

        uint256 recipientBefore = WITHDRAW_RECIPIENT.balance;
        vm.prank(ACCOUNT_A);
        wallet.release(address(0), ACCOUNT_A, WITHDRAW_RECIPIENT).assertEq(7 ether, "released");

        wallet.assetObservationInitialized(address(0)).assertTrue("observation initialized");
        wallet.lastObservedReceived(address(0)).assertEq(10 ether, "release observed");
        wallet.accountReleased(address(0), ACCOUNT_A).assertEq(7 ether, "account key");
        wallet.accountReleased(address(0), WITHDRAW_RECIPIENT)
            .assertEq(0, "recipient not account key");
        WITHDRAW_RECIPIENT.balance.assertEq(recipientBefore + 7 ether, "recipient balance");
    }

    function testNativeReleaseFailurePreservesReleasableFunds() public {
        RejectingNativeRecipient rejecting = new RejectingNativeRecipient();
        IStreamSplitWallet wallet = _createSingleAccountWallet(address(rejecting));
        (bool sent,) = payable(address(wallet)).call{ value: 1 ether }("");
        sent.assertTrue("fund wallet");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.NativeTransferFailed.selector, address(rejecting), 1 ether
            )
        );
        wallet.release(address(0), address(rejecting), payable(address(rejecting)));

        wallet.releasable(address(0), address(rejecting)).assertEq(1 ether, "still releasable");
        wallet.accountReleased(address(0), address(rejecting)).assertEq(0, "released rolled back");
    }

    function testReentrantNativeReleaseCannotDrainAgain() public {
        ReentrantSplitRecipient reentrant = new ReentrantSplitRecipient();
        IStreamSplitWallet wallet = _createSingleAccountWallet(address(reentrant));
        reentrant.setWallet(wallet);
        (bool sent,) = payable(address(wallet)).call{ value: 1 ether }("");
        sent.assertTrue("fund wallet");

        wallet.release(address(0), address(reentrant), payable(address(reentrant)))
            .assertEq(1 ether, "released");

        reentrant.reentered().assertTrue("reentry attempted");
        reentrant.reenteredSucceeded().assertFalse("reentry succeeded");
        wallet.releasable(address(0), address(reentrant)).assertEq(0, "drained once");
        address(wallet).balance.assertEq(0, "wallet balance");
    }

    function testReentrantSyncDuringReleaseIsBlocked() public {
        ReentrantSyncRecipient reentrant = new ReentrantSyncRecipient();
        IStreamSplitWallet wallet = _createSingleAccountWallet(address(reentrant));
        reentrant.setWallet(wallet);
        (bool sent,) = payable(address(wallet)).call{ value: 1 ether }("");
        sent.assertTrue("fund wallet");

        wallet.release(address(0), address(reentrant), payable(address(reentrant)))
            .assertEq(1 ether, "released");

        reentrant.reentered().assertTrue("reentry attempted");
        reentrant.reenteredSucceeded().assertFalse("reentry succeeded");
        wallet.assetObservationInitialized(address(0)).assertTrue("observation initialized");
        wallet.lastObservedReceived(address(0)).assertEq(1 ether, "release observed");
    }

    function testReleaseRejectsNativeReturnedDuringRecipientCallback() public {
        ReturningNativeRecipient returning = new ReturningNativeRecipient();
        IStreamSplitWallet wallet = _createSingleAccountWallet(address(returning));
        returning.setWallet(wallet);
        (bool sent,) = payable(address(wallet)).call{ value: 1 ether }("");
        sent.assertTrue("fund wallet");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.NativeReceiptInvariantBroken.selector, 1 ether, 2 ether
            )
        );
        wallet.release(address(0), address(returning), payable(address(returning)));

        returning.returned().assertFalse("recipient return rolled back");
        address(wallet).balance.assertEq(1 ether, "wallet balance preserved");
        wallet.totalReleased(address(0)).assertEq(0, "released total rolled back");
        wallet.releasable(address(0), address(returning)).assertEq(1 ether, "still releasable");
    }

    function testReleaseRejectsPartialNativeReturnedDuringRecipientCallback() public {
        PartialReturningNativeRecipient returning = new PartialReturningNativeRecipient();
        IStreamSplitWallet wallet = _createSingleAccountWallet(address(returning));
        returning.setWallet(wallet);
        (bool sent,) = payable(address(wallet)).call{ value: 1 ether }("");
        sent.assertTrue("fund wallet");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.NativeReceiptInvariantBroken.selector, 1 ether, 1 ether + 1
            )
        );
        wallet.release(address(0), address(returning), payable(address(returning)));

        returning.returned().assertFalse("recipient return rolled back");
        address(wallet).balance.assertEq(1 ether, "wallet balance preserved");
        wallet.totalReleased(address(0)).assertEq(0, "released total rolled back");
        wallet.releasable(address(0), address(returning)).assertEq(1 ether, "still releasable");
    }

    function testReleaseRejectsWalletAsAlternateRecipient() public {
        IStreamSplitWallet wallet = _createTwoAccountWallet();
        (bool sent,) = payable(address(wallet)).call{ value: 10 ether }("");
        sent.assertTrue("fund wallet");

        vm.prank(ACCOUNT_A);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.NativeReceiptInvariantBroken.selector, 10 ether, 17 ether
            )
        );
        wallet.release(address(0), ACCOUNT_A, payable(address(wallet)));

        address(wallet).balance.assertEq(10 ether, "wallet balance preserved");
        wallet.totalReleased(address(0)).assertEq(0, "released total rolled back");
        wallet.releasable(address(0), ACCOUNT_A).assertEq(7 ether, "account a preserved");
        wallet.releasable(address(0), ACCOUNT_B).assertEq(3 ether, "account b preserved");
    }

    function testAnyoneCanReleaseToEntitledAccountAndAlternateRecipientRequiresAccount() public {
        IStreamSplitWallet wallet = _createTwoAccountWallet();
        (bool sent,) = payable(address(wallet)).call{ value: 10 ether }("");
        sent.assertTrue("fund wallet");

        wallet.release(address(0), ACCOUNT_A, payable(ACCOUNT_A)).assertEq(7 ether, "keeper");

        (sent,) = payable(address(wallet)).call{ value: 10 ether }("");
        sent.assertTrue("fund again");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.UnauthorizedReleaseRecipient.selector,
                address(this),
                ACCOUNT_A,
                WITHDRAW_RECIPIENT
            )
        );
        wallet.release(address(0), ACCOUNT_A, WITHDRAW_RECIPIENT);

        uint256 recipientBefore = WITHDRAW_RECIPIENT.balance;
        vm.prank(ACCOUNT_A);
        wallet.release(address(0), ACCOUNT_A, WITHDRAW_RECIPIENT).assertEq(7 ether, "alternate");
        WITHDRAW_RECIPIENT.balance.assertEq(recipientBefore + 7 ether, "recipient");
    }

    function testRoundingDustIsBoundedAndNotSweepable() public {
        IStreamSplitWallet.SplitEntry[] memory entries = new IStreamSplitWallet.SplitEntry[](3);
        entries[0] = IStreamSplitWallet.SplitEntry(ACCOUNT_A, 333_333, LABEL_ARTIST);
        entries[1] = IStreamSplitWallet.SplitEntry(ACCOUNT_B, 333_333, LABEL_PROTOCOL);
        entries[2] = IStreamSplitWallet.SplitEntry(ACCOUNT_C, 333_334, LABEL_ESTATE);
        (, address walletAddress) = factory.createProfile(entries, METADATA_HASH);
        IStreamSplitWallet wallet = IStreamSplitWallet(walletAddress);

        (bool sent,) = payable(walletAddress).call{ value: 1 wei }("");
        sent.assertTrue("fund 1");
        wallet.roundingDust(address(0)).assertEq(1, "dust after one wei");

        (sent,) = payable(walletAddress).call{ value: 2 wei }("");
        sent.assertTrue("fund 2");
        wallet.releasable(address(0), ACCOUNT_C).assertEq(1, "account c releasable");
        wallet.roundingDust(address(0)).assertEq(2, "dust under account count");
        wallet.release(address(0), ACCOUNT_C, payable(ACCOUNT_C)).assertEq(1, "release c");
        wallet.roundingDust(address(0)).assertEq(2, "dust remains");
    }

    function testNativeAccountingInvariantsAcrossReceiptReleaseAndSyncRounds() public {
        IStreamSplitWallet.SplitEntry[] memory entries = new IStreamSplitWallet.SplitEntry[](3);
        entries[0] = IStreamSplitWallet.SplitEntry(ACCOUNT_A, 333_333, LABEL_ARTIST);
        entries[1] = IStreamSplitWallet.SplitEntry(ACCOUNT_B, 333_333, LABEL_PROTOCOL);
        entries[2] = IStreamSplitWallet.SplitEntry(ACCOUNT_C, 333_334, LABEL_ESTATE);
        (, address walletAddress) = factory.createProfile(entries, METADATA_HASH);
        IStreamSplitWallet wallet = IStreamSplitWallet(walletAddress);
        address[] memory accounts = _accounts3(ACCOUNT_A, ACCOUNT_B, ACCOUNT_C);

        (bool sent,) = payable(walletAddress).call{ value: 11 wei }("");
        sent.assertTrue("fund first round");
        _assertNativeAccounting(wallet, accounts, "first receipt");

        wallet.release(address(0), ACCOUNT_C, payable(ACCOUNT_C)).assertEq(3, "release c");
        _assertNativeAccounting(wallet, accounts, "after c release");

        (sent,) = payable(walletAddress).call{ value: 100 wei }("");
        sent.assertTrue("fund second round");
        wallet.syncAsset(address(0)).assertEq(111, "sync observed");
        _assertNativeAccounting(wallet, accounts, "after second sync");

        wallet.release(address(0), ACCOUNT_A, payable(ACCOUNT_A)).assertEq(36, "release a");
        wallet.release(address(0), ACCOUNT_B, payable(ACCOUNT_B)).assertEq(36, "release b");
        wallet.release(address(0), ACCOUNT_C, payable(ACCOUNT_C)).assertEq(34, "release c again");
        _assertNativeAccounting(wallet, accounts, "after releases");
        wallet.roundingDust(address(0)).assertEq(2, "bounded final dust");
    }

    function testUnsupportedAssetsAreRejectedForThisNativeSkeleton() public {
        IStreamSplitWallet wallet = _createTwoAccountWallet();
        address unsupportedAsset = address(0xE20);

        vm.expectRevert(
            abi.encodeWithSelector(IStreamSplitWallet.UnsupportedAsset.selector, unsupportedAsset)
        );
        wallet.observedReceived(unsupportedAsset);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamSplitWallet.UnsupportedAsset.selector, unsupportedAsset)
        );
        wallet.releasable(unsupportedAsset, ACCOUNT_A);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamSplitWallet.UnsupportedAsset.selector, unsupportedAsset)
        );
        wallet.roundingDust(unsupportedAsset);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamSplitWallet.UnsupportedAsset.selector, unsupportedAsset)
        );
        wallet.syncAsset(unsupportedAsset);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamSplitWallet.UnsupportedAsset.selector, unsupportedAsset)
        );
        wallet.release(unsupportedAsset, ACCOUNT_A, payable(ACCOUNT_A));
        vm.expectRevert(
            abi.encodeWithSelector(IStreamSplitWallet.UnsupportedAsset.selector, unsupportedAsset)
        );
        wallet.release(unsupportedAsset, ACCOUNT_A, payable(address(0)));
        vm.expectRevert(
            abi.encodeWithSelector(IStreamSplitWallet.UnsupportedAsset.selector, unsupportedAsset)
        );
        wallet.release(unsupportedAsset, address(0xE21), payable(address(0xE21)));
    }

    function testApprovedErc20SyncReleaseAndDustUseCumulativeObservedReceipts() public {
        StandardERC20Mock token = new StandardERC20Mock();
        _activateAsset(address(token));
        IStreamSplitWallet wallet = _createTwoAccountWallet();

        token.mint(address(wallet), 10 ether);
        wallet.observedReceived(address(token)).assertEq(10 ether, "observed");
        wallet.releasable(address(token), ACCOUNT_A).assertEq(7 ether, "account a releasable");
        wallet.releasable(address(token), ACCOUNT_B).assertEq(3 ether, "account b releasable");
        wallet.syncAsset(address(token)).assertEq(10 ether, "sync");

        wallet.release(address(token), ACCOUNT_A, payable(ACCOUNT_A))
            .assertEq(7 ether, "release account a");
        token.balanceOf(ACCOUNT_A).assertEq(7 ether, "account a token balance");
        wallet.accountReleased(address(token), ACCOUNT_A).assertEq(7 ether, "account ledger");
        wallet.totalReleased(address(token)).assertEq(7 ether, "total released");
        wallet.observedReceived(address(token)).assertEq(10 ether, "observed after release");
        wallet.roundingDust(address(token)).assertEq(0, "dust");

        token.mint(address(wallet), 1 wei);
        wallet.roundingDust(address(token)).assertEq(1, "one wei dust");
        token.mint(address(wallet), 9 ether);
        wallet.syncAsset(address(token)).assertEq(19 ether + 1, "second sync");
        _assertTokenAccounting(wallet, token, _accounts(ACCOUNT_A, ACCOUNT_B), "erc20 round");
    }

    function testApprovedErc20ReleaseSupportsAuthorizedAlternateRecipient() public {
        StandardERC20Mock token = new StandardERC20Mock();
        _activateAsset(address(token));
        IStreamSplitWallet wallet = _createTwoAccountWallet();
        token.mint(address(wallet), 10 ether);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.UnauthorizedReleaseRecipient.selector,
                address(this),
                ACCOUNT_A,
                WITHDRAW_RECIPIENT
            )
        );
        wallet.release(address(token), ACCOUNT_A, WITHDRAW_RECIPIENT);

        vm.prank(ACCOUNT_A);
        wallet.release(address(token), ACCOUNT_A, WITHDRAW_RECIPIENT)
            .assertEq(7 ether, "released to alternate");
        token.balanceOf(WITHDRAW_RECIPIENT).assertEq(7 ether, "recipient token balance");
        token.balanceOf(ACCOUNT_A).assertEq(0, "account not recipient");
        wallet.accountReleased(address(token), ACCOUNT_A).assertEq(7 ether, "account ledger");
    }

    function testErc20AccountingInvariantsAcrossReceiptReleaseAndSyncRounds() public {
        StandardERC20Mock token = new StandardERC20Mock();
        _activateAsset(address(token));
        IStreamSplitWallet.SplitEntry[] memory entries = new IStreamSplitWallet.SplitEntry[](3);
        entries[0] = IStreamSplitWallet.SplitEntry(ACCOUNT_A, 333_333, LABEL_ARTIST);
        entries[1] = IStreamSplitWallet.SplitEntry(ACCOUNT_B, 333_333, LABEL_PROTOCOL);
        entries[2] = IStreamSplitWallet.SplitEntry(ACCOUNT_C, 333_334, LABEL_ESTATE);
        (, address walletAddress) = factory.createProfile(entries, METADATA_HASH);
        IStreamSplitWallet wallet = IStreamSplitWallet(walletAddress);
        address[] memory accounts = _accounts3(ACCOUNT_A, ACCOUNT_B, ACCOUNT_C);

        token.mint(address(wallet), 11 wei);
        _assertTokenAccounting(wallet, token, accounts, "first receipt");

        wallet.release(address(token), ACCOUNT_C, payable(ACCOUNT_C)).assertEq(3, "release c");
        _assertTokenAccounting(wallet, token, accounts, "after c release");

        token.mint(address(wallet), 100 wei);
        wallet.syncAsset(address(token)).assertEq(111, "sync observed");
        _assertTokenAccounting(wallet, token, accounts, "after second sync");

        wallet.release(address(token), ACCOUNT_A, payable(ACCOUNT_A)).assertEq(36, "release a");
        wallet.release(address(token), ACCOUNT_B, payable(ACCOUNT_B)).assertEq(36, "release b");
        wallet.release(address(token), ACCOUNT_C, payable(ACCOUNT_C))
            .assertEq(34, "release c again");
        _assertTokenAccounting(wallet, token, accounts, "after releases");
        wallet.roundingDust(address(token)).assertEq(2, "bounded final dust");
    }

    function testApprovedErc20DirectReceiptBeforeApprovalIsNotReleasableUntilActive() public {
        StandardERC20Mock token = new StandardERC20Mock();
        IStreamSplitWallet wallet = _createTwoAccountWallet();
        token.mint(address(wallet), 10 ether);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.AssetNotActive.selector,
                address(token),
                assetPolicyRegistry.ASSET_STATUS_UNKNOWN()
            )
        );
        wallet.releasable(address(token), ACCOUNT_A);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.AssetNotActive.selector,
                address(token),
                assetPolicyRegistry.ASSET_STATUS_UNKNOWN()
            )
        );
        wallet.release(address(token), ACCOUNT_A, payable(ACCOUNT_A));

        _activateAsset(address(token));
        wallet.syncAsset(address(token)).assertEq(10 ether, "active sync");
        wallet.release(address(token), ACCOUNT_A, payable(ACCOUNT_A))
            .assertEq(7 ether, "active release");
    }

    function testInactiveDeprecatedAndUnsupportedErc20RevertBeforeLedgerMutation() public {
        StandardERC20Mock token = new StandardERC20Mock();
        IStreamSplitWallet wallet = _createTwoAccountWallet();
        token.mint(address(wallet), 10 ether);

        _setAssetStatus(address(token), assetPolicyRegistry.ASSET_STATUS_INACTIVE(), "inactive");
        _expectPolicyRevert(address(token), assetPolicyRegistry.ASSET_STATUS_INACTIVE());
        wallet.syncAsset(address(token));

        _setAssetStatus(address(token), assetPolicyRegistry.ASSET_STATUS_DEPRECATED(), "deprecated");
        _expectPolicyRevert(address(token), assetPolicyRegistry.ASSET_STATUS_DEPRECATED());
        wallet.release(address(token), ACCOUNT_A, payable(ACCOUNT_A));

        _setAssetStatus(
            address(token), assetPolicyRegistry.ASSET_STATUS_UNSUPPORTED(), "unsupported"
        );
        _expectPolicyRevert(address(token), assetPolicyRegistry.ASSET_STATUS_UNSUPPORTED());
        wallet.releasable(address(token), ACCOUNT_A);

        wallet.accountReleased(address(token), ACCOUNT_A).assertEq(0, "account unchanged");
        wallet.totalReleased(address(token)).assertEq(0, "total unchanged");
        wallet.assetObservationInitialized(address(token)).assertFalse("observation unchanged");
        token.balanceOf(address(wallet)).assertEq(10 ether, "wallet balance");
    }

    function testErc20PolicyAndTokenReadsFailClosedWithoutBlockingNative() public {
        StandardERC20Mock token = new StandardERC20Mock();
        _activateAsset(address(token));
        IStreamSplitWallet wallet = _createTwoAccountWallet();
        token.mint(address(wallet), 10 ether);
        (bool sent,) = payable(address(wallet)).call{ value: 1 ether }("");
        sent.assertTrue("native funded");

        vm.etch(address(assetPolicyRegistry), "");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.AssetPolicyReadFailed.selector,
                address(assetPolicyRegistry),
                address(token)
            )
        );
        wallet.syncAsset(address(token));
        wallet.release(address(0), ACCOUNT_A, payable(ACCOUNT_A)).assertEq(0.7 ether, "native ok");
    }

    function testErc20BalanceReadFailuresPreserveLedger() public {
        IStreamSplitWallet revertWallet = _createSingleAccountWallet(ACCOUNT_A);
        RevertingBalanceERC20Mock revertingToken = new RevertingBalanceERC20Mock();
        _activateAsset(address(revertingToken));
        _expectBalanceReadRevert(address(revertingToken), address(revertWallet));
        revertWallet.syncAsset(address(revertingToken));
        _assertFailedTokenReadDidNotMutate(revertWallet, address(revertingToken));

        IStreamSplitWallet noReturnWallet = _createSingleAccountWallet(ACCOUNT_A);
        NoBalanceReturnERC20Mock noReturnToken = new NoBalanceReturnERC20Mock();
        _activateAsset(address(noReturnToken));
        _expectBalanceReadRevert(address(noReturnToken), address(noReturnWallet));
        noReturnWallet.syncAsset(address(noReturnToken));
        _assertFailedTokenReadDidNotMutate(noReturnWallet, address(noReturnToken));

        IStreamSplitWallet malformedWallet = _createSingleAccountWallet(ACCOUNT_A);
        MalformedBalanceERC20Mock malformedToken = new MalformedBalanceERC20Mock();
        _activateAsset(address(malformedToken));
        _expectBalanceReadRevert(address(malformedToken), address(malformedWallet));
        malformedWallet.syncAsset(address(malformedToken));
        _assertFailedTokenReadDidNotMutate(malformedWallet, address(malformedToken));

        IStreamSplitWallet oversizedWallet = _createSingleAccountWallet(ACCOUNT_A);
        OversizedBalanceERC20Mock oversizedToken = new OversizedBalanceERC20Mock();
        _activateAsset(address(oversizedToken));
        _expectBalanceReadRevert(address(oversizedToken), address(oversizedWallet));
        oversizedWallet.syncAsset(address(oversizedToken));
        _assertFailedTokenReadDidNotMutate(oversizedWallet, address(oversizedToken));
    }

    function testGasCappedOrMalformedRegistryReadsFailClosed() public {
        StandardERC20Mock gasToken = new StandardERC20Mock();
        GasGriefAssetPolicyRegistryMock gasRegistry = new GasGriefAssetPolicyRegistryMock();
        StreamSplitFactory gasFactory =
            new StreamSplitFactory(IStreamAssetPolicyRegistry(address(gasRegistry)));
        IStreamSplitWallet gasWallet = _createSingleAccountWallet(gasFactory, ACCOUNT_A);
        gasToken.mint(address(gasWallet), 1 ether);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.AssetPolicyReadFailed.selector,
                address(gasRegistry),
                address(gasToken)
            )
        );
        gasWallet.syncAsset(address(gasToken));
        _assertFailedTokenReadDidNotMutate(gasWallet, address(gasToken));

        StandardERC20Mock malformedToken = new StandardERC20Mock();
        MalformedAssetPolicyRegistryMock malformedRegistry = new MalformedAssetPolicyRegistryMock();
        StreamSplitFactory malformedFactory =
            new StreamSplitFactory(IStreamAssetPolicyRegistry(address(malformedRegistry)));
        IStreamSplitWallet malformedWallet = _createSingleAccountWallet(malformedFactory, ACCOUNT_A);
        malformedToken.mint(address(malformedWallet), 1 ether);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.AssetPolicyReadFailed.selector,
                address(malformedRegistry),
                address(malformedToken)
            )
        );
        malformedWallet.releasable(address(malformedToken), ACCOUNT_A);
        _assertFailedTokenReadDidNotMutate(malformedWallet, address(malformedToken));

        StandardERC20Mock oversizedToken = new StandardERC20Mock();
        OversizedAssetPolicyRegistryMock oversizedRegistry =
            new OversizedAssetPolicyRegistryMock();
        StreamSplitFactory oversizedFactory =
            new StreamSplitFactory(IStreamAssetPolicyRegistry(address(oversizedRegistry)));
        IStreamSplitWallet oversizedWallet =
            _createSingleAccountWallet(oversizedFactory, ACCOUNT_A);
        oversizedToken.mint(address(oversizedWallet), 1 ether);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.AssetPolicyReadFailed.selector,
                address(oversizedRegistry),
                address(oversizedToken)
            )
        );
        oversizedWallet.syncAsset(address(oversizedToken));
        _assertFailedTokenReadDidNotMutate(oversizedWallet, address(oversizedToken));

        StandardERC20Mock outOfRangeToken = new StandardERC20Mock();
        OutOfRangeAssetPolicyRegistryMock outOfRangeRegistry =
            new OutOfRangeAssetPolicyRegistryMock();
        StreamSplitFactory outOfRangeFactory =
            new StreamSplitFactory(IStreamAssetPolicyRegistry(address(outOfRangeRegistry)));
        IStreamSplitWallet outOfRangeWallet =
            _createSingleAccountWallet(outOfRangeFactory, ACCOUNT_A);
        outOfRangeToken.mint(address(outOfRangeWallet), 1 ether);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.AssetPolicyReadFailed.selector,
                address(outOfRangeRegistry),
                address(outOfRangeToken)
            )
        );
        outOfRangeWallet.releasable(address(outOfRangeToken), ACCOUNT_A);
        _assertFailedTokenReadDidNotMutate(outOfRangeWallet, address(outOfRangeToken));
    }

    function testApprovedErc20ReleaseFailurePreservesLedger() public {
        RevertingERC20Mock token = new RevertingERC20Mock();
        _activateAsset(address(token));
        IStreamSplitWallet wallet = _createSingleAccountWallet(ACCOUNT_A);
        token.mint(address(wallet), 1 ether);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.ERC20TransferFailed.selector, address(token), ACCOUNT_A, 1 ether
            )
        );
        wallet.release(address(token), ACCOUNT_A, payable(ACCOUNT_A));

        wallet.accountReleased(address(token), ACCOUNT_A).assertEq(0, "account released");
        wallet.totalReleased(address(token)).assertEq(0, "total released");
        token.balanceOf(address(wallet)).assertEq(1 ether, "wallet token balance");
    }

    function testNonStandardErc20TransfersRevertAndPreserveLedger() public {
        IStreamSplitWallet noReturnWallet = _createSingleAccountWallet(ACCOUNT_A);
        NoReturnERC20Mock noReturnToken = new NoReturnERC20Mock();
        _activateAsset(address(noReturnToken));
        noReturnToken.mint(address(noReturnWallet), 1 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.ERC20TransferFailed.selector,
                address(noReturnToken),
                ACCOUNT_A,
                1 ether
            )
        );
        noReturnWallet.release(address(noReturnToken), ACCOUNT_A, payable(ACCOUNT_A));

        IStreamSplitWallet falseReturnWallet = _createSingleAccountWallet(ACCOUNT_A);
        FalseReturnERC20Mock falseReturnToken = new FalseReturnERC20Mock();
        _activateAsset(address(falseReturnToken));
        falseReturnToken.mint(address(falseReturnWallet), 1 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.ERC20TransferFailed.selector,
                address(falseReturnToken),
                ACCOUNT_A,
                1 ether
            )
        );
        falseReturnWallet.release(address(falseReturnToken), ACCOUNT_A, payable(ACCOUNT_A));

        IStreamSplitWallet nonCanonicalReturnWallet = _createSingleAccountWallet(ACCOUNT_A);
        NonCanonicalReturnERC20Mock nonCanonicalReturnToken = new NonCanonicalReturnERC20Mock();
        _activateAsset(address(nonCanonicalReturnToken));
        nonCanonicalReturnToken.mint(address(nonCanonicalReturnWallet), 1 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.ERC20TransferFailed.selector,
                address(nonCanonicalReturnToken),
                ACCOUNT_A,
                1 ether
            )
        );
        nonCanonicalReturnWallet.release(
            address(nonCanonicalReturnToken), ACCOUNT_A, payable(ACCOUNT_A)
        );

        IStreamSplitWallet noOpWallet = _createSingleAccountWallet(ACCOUNT_A);
        NoOpERC20Mock noOpToken = new NoOpERC20Mock();
        _activateAsset(address(noOpToken));
        noOpToken.mint(address(noOpWallet), 1 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.ERC20TransferInvariantBroken.selector,
                address(noOpToken),
                ACCOUNT_A,
                0,
                1 ether,
                1 ether,
                0
            )
        );
        noOpWallet.release(address(noOpToken), ACCOUNT_A, payable(ACCOUNT_A));

        IStreamSplitWallet feeWallet = _createSingleAccountWallet(ACCOUNT_A);
        FeeOnTransferERC20Mock feeToken = new FeeOnTransferERC20Mock();
        _activateAsset(address(feeToken));
        feeToken.mint(address(feeWallet), 1 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.ERC20TransferInvariantBroken.selector,
                address(feeToken),
                ACCOUNT_A,
                0,
                0,
                1 ether,
                1 ether - 1
            )
        );
        feeWallet.release(address(feeToken), ACCOUNT_A, payable(ACCOUNT_A));
    }

    function testRebasingDownErc20SyncRevertsObservedReceiptsDecreased() public {
        RebasingDownERC20Mock token = new RebasingDownERC20Mock();
        _activateAsset(address(token));
        IStreamSplitWallet wallet = _createSingleAccountWallet(ACCOUNT_A);
        token.mint(address(wallet), 10 ether);
        wallet.syncAsset(address(token)).assertEq(10 ether, "initial observed");

        token.rebaseDown(address(wallet), 1 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.ObservedReceiptsDecreased.selector,
                address(token),
                10 ether,
                9 ether
            )
        );
        wallet.syncAsset(address(token));
    }

    function testRebasingDownErc20ReleaseAndSyncFreezeUntilObservationRecovers() public {
        RebasingDownERC20Mock token = new RebasingDownERC20Mock();
        _activateAsset(address(token));
        IStreamSplitWallet wallet = _createSingleAccountWallet(ACCOUNT_A);
        token.mint(address(wallet), 10 ether);
        wallet.syncAsset(address(token)).assertEq(10 ether, "initial observed");

        token.rebaseDown(address(wallet), 1 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.ObservedReceiptsDecreased.selector,
                address(token),
                10 ether,
                9 ether
            )
        );
        wallet.syncAsset(address(token));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.ObservedReceiptsDecreased.selector,
                address(token),
                10 ether,
                9 ether
            )
        );
        wallet.release(address(token), ACCOUNT_A, payable(ACCOUNT_A));
        wallet.accountReleased(address(token), ACCOUNT_A).assertEq(0, "ledger rolled back");
        wallet.totalReleased(address(token)).assertEq(0, "total rolled back");
        token.balanceOf(ACCOUNT_A).assertEq(0, "transfer rolled back");
        token.balanceOf(address(wallet)).assertEq(9 ether, "wallet still holds rebased balance");
        wallet.lastObservedReceived(address(token)).assertEq(10 ether, "high water retained");

        token.mint(address(wallet), 1 ether);
        wallet.syncAsset(address(token)).assertEq(10 ether, "recovered observation");
        wallet.release(address(token), ACCOUNT_A, payable(ACCOUNT_A))
            .assertEq(10 ether, "release after recovery");
    }

    function testCallbackErc20CannotReenterSyncDuringRelease() public {
        CallbackERC20Mock token = new CallbackERC20Mock();
        _activateAsset(address(token));
        IStreamSplitWallet wallet = _createSingleAccountWallet(address(token));
        token.setWallet(wallet);
        token.mint(address(wallet), 1 ether);

        wallet.release(address(token), address(token), payable(address(token)))
            .assertEq(1 ether, "released");

        token.callbackAttempted().assertTrue("callback attempted");
        token.callbackSucceeded().assertFalse("callback succeeded");
        wallet.releasable(address(token), address(token)).assertEq(0, "released once");
    }

    function testCallbackErc20CannotReenterReleaseDuringRelease() public {
        ReleaseCallbackERC20Mock token = new ReleaseCallbackERC20Mock();
        _activateAsset(address(token));
        IStreamSplitWallet wallet = _createSingleAccountWallet(address(token));
        token.setWallet(wallet);
        token.mint(address(wallet), 1 ether);

        wallet.release(address(token), address(token), payable(address(token)))
            .assertEq(1 ether, "released");

        token.callbackAttempted().assertTrue("callback attempted");
        token.callbackSucceeded().assertFalse("callback succeeded");
        wallet.accountReleased(address(token), address(token)).assertEq(1 ether, "account ledger");
        wallet.releasable(address(token), address(token)).assertEq(0, "released once");
    }

    function _createTwoAccountWallet() private returns (IStreamSplitWallet) {
        (, address walletAddress) = factory.createProfile(_twoEntryProfile(), METADATA_HASH);
        return IStreamSplitWallet(walletAddress);
    }

    function _createSingleAccountWallet(address account) private returns (IStreamSplitWallet) {
        IStreamSplitWallet.SplitEntry[] memory entries = _singleEntry(account, 1_000_000);
        (, address walletAddress) = factory.createProfile(entries, METADATA_HASH);
        return IStreamSplitWallet(walletAddress);
    }

    function _createSingleAccountWallet(StreamSplitFactory targetFactory, address account)
        private
        returns (IStreamSplitWallet)
    {
        IStreamSplitWallet.SplitEntry[] memory entries = _singleEntry(account, 1_000_000);
        (, address walletAddress) = targetFactory.createProfile(entries, METADATA_HASH);
        return IStreamSplitWallet(walletAddress);
    }

    function _activateAsset(address token) private {
        _setAssetStatus(token, assetPolicyRegistry.ASSET_STATUS_ACTIVE(), "active");
    }

    function _setAssetStatus(address token, uint8 status, string memory label) private {
        assetPolicyRegistry.setAssetStatus(token, status, keccak256(bytes(label)));
    }

    function _expectPolicyRevert(address token, uint8 status) private {
        vm.expectRevert(
            abi.encodeWithSelector(IStreamSplitWallet.AssetNotActive.selector, token, status)
        );
    }

    function _expectBalanceReadRevert(address token, address account) private {
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamSplitWallet.ERC20BalanceReadFailed.selector, token, account
            )
        );
    }

    function _assertFailedTokenReadDidNotMutate(IStreamSplitWallet wallet, address token)
        private
        view
    {
        wallet.accountReleased(token, ACCOUNT_A).assertEq(0, "account released unchanged");
        wallet.totalReleased(token).assertEq(0, "total released unchanged");
        wallet.assetObservationInitialized(token).assertFalse("observation unchanged");
    }

    function _twoEntryProfile()
        private
        pure
        returns (IStreamSplitWallet.SplitEntry[] memory entries)
    {
        entries = new IStreamSplitWallet.SplitEntry[](2);
        entries[0] = IStreamSplitWallet.SplitEntry(ACCOUNT_B, 300_000, LABEL_PROTOCOL);
        entries[1] = IStreamSplitWallet.SplitEntry(ACCOUNT_A, 700_000, LABEL_ARTIST);
    }

    function _singleEntry(address account, uint32 sharePpm)
        private
        pure
        returns (IStreamSplitWallet.SplitEntry[] memory entries)
    {
        entries = new IStreamSplitWallet.SplitEntry[](1);
        entries[0] = IStreamSplitWallet.SplitEntry(account, sharePpm, LABEL_ARTIST);
    }

    function _accounts(address first, address second)
        private
        pure
        returns (address[] memory accounts)
    {
        accounts = new address[](2);
        accounts[0] = first;
        accounts[1] = second;
    }

    function _accounts3(address first, address second, address third)
        private
        pure
        returns (address[] memory accounts)
    {
        accounts = new address[](3);
        accounts[0] = first;
        accounts[1] = second;
        accounts[2] = third;
    }

    function _shares(uint32 first, uint32 second) private pure returns (uint32[] memory shares) {
        shares = new uint32[](2);
        shares[0] = first;
        shares[1] = second;
    }

    function _countTopic(Vm.Log[] memory logs, address emitter, bytes32 topic)
        private
        pure
        returns (uint256 count)
    {
        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].emitter == emitter && logs[i].topics.length > 0
                    && logs[i].topics[0] == topic
            ) {
                count++;
            }
        }
    }

    function _assertNativeAccounting(
        IStreamSplitWallet wallet,
        address[] memory accounts,
        string memory phase
    ) private view {
        uint256 observed = wallet.observedReceived(address(0));
        uint256 releasedTotal = wallet.totalReleased(address(0));
        observed.assertEq(address(wallet).balance + releasedTotal, phase);

        uint256 releasedByAccount = 0;
        uint256 totalReleasable = 0;
        for (uint256 i = 0; i < accounts.length; i++) {
            address account = accounts[i];
            uint256 accountReleased = wallet.accountReleased(address(0), account);
            uint256 entitlement =
                (observed * wallet.aggregateSharePpm(account)) / wallet.SHARE_DENOMINATOR_PPM();
            require(accountReleased <= entitlement, phase);
            releasedByAccount += accountReleased;
            totalReleasable += wallet.releasable(address(0), account);
        }
        releasedByAccount.assertEq(releasedTotal, phase);
        (totalReleasable + wallet.roundingDust(address(0))).assertEq(address(wallet).balance, phase);
    }

    function _assertTokenAccounting(
        IStreamSplitWallet wallet,
        StandardERC20Mock token,
        address[] memory accounts,
        string memory phase
    ) private view {
        uint256 observed = wallet.observedReceived(address(token));
        uint256 releasedTotal = wallet.totalReleased(address(token));
        observed.assertEq(token.balanceOf(address(wallet)) + releasedTotal, phase);

        uint256 releasedByAccount = 0;
        uint256 totalReleasable = 0;
        for (uint256 i = 0; i < accounts.length; i++) {
            address account = accounts[i];
            uint256 accountReleased = wallet.accountReleased(address(token), account);
            uint256 entitlement =
                (observed * wallet.aggregateSharePpm(account)) / wallet.SHARE_DENOMINATOR_PPM();
            require(accountReleased <= entitlement, phase);
            releasedByAccount += accountReleased;
            totalReleasable += wallet.releasable(address(token), account);
        }
        releasedByAccount.assertEq(releasedTotal, phase);
        (totalReleasable + wallet.roundingDust(address(token)))
        .assertEq(token.balanceOf(address(wallet)), phase);
    }
}

contract StandardERC20Mock {
    mapping(address => uint256) internal balances;

    function mint(address account, uint256 amount) external {
        balances[account] += amount;
    }

    function balanceOf(address account) external view virtual returns (uint256) {
        return balances[account];
    }

    function transfer(address recipient, uint256 amount) external virtual returns (bool) {
        _move(msg.sender, recipient, amount);
        return true;
    }

    function _move(address from, address to, uint256 amount) internal {
        require(balances[from] >= amount, "insufficient");
        balances[from] -= amount;
        balances[to] += amount;
    }
}

contract FalseReturnERC20Mock is StandardERC20Mock {
    function transfer(address, uint256) external pure override returns (bool) {
        return false;
    }
}

contract NonCanonicalReturnERC20Mock is StandardERC20Mock {
    function transfer(address recipient, uint256 amount) external override returns (bool) {
        _move(msg.sender, recipient, amount);
        assembly {
            mstore(0, 2)
            return(0, 32)
        }
    }
}

contract RevertingERC20Mock is StandardERC20Mock {
    function transfer(address, uint256) external pure override returns (bool) {
        revert("transfer failed");
    }
}

contract NoOpERC20Mock is StandardERC20Mock {
    function transfer(address, uint256) external pure override returns (bool) {
        return true;
    }
}

contract FeeOnTransferERC20Mock is StandardERC20Mock {
    function transfer(address recipient, uint256 amount) external override returns (bool) {
        require(amount > 1, "amount too small");
        balances[msg.sender] -= amount;
        balances[recipient] += amount - 1;
        return true;
    }
}

contract RebasingDownERC20Mock is StandardERC20Mock {
    function rebaseDown(address account, uint256 amount) external {
        balances[account] -= amount;
    }
}

contract CallbackERC20Mock is StandardERC20Mock {
    IStreamSplitWallet private wallet;
    bool public callbackAttempted;
    bool public callbackSucceeded;

    function setWallet(IStreamSplitWallet wallet_) external {
        wallet = wallet_;
    }

    function transfer(address recipient, uint256 amount) external override returns (bool) {
        _move(msg.sender, recipient, amount);
        if (!callbackAttempted) {
            callbackAttempted = true;
            try wallet.syncAsset(address(this)) returns (uint256) {
                callbackSucceeded = true;
            } catch { }
        }
        return true;
    }
}

contract ReleaseCallbackERC20Mock is StandardERC20Mock {
    IStreamSplitWallet private wallet;
    bool public callbackAttempted;
    bool public callbackSucceeded;

    function setWallet(IStreamSplitWallet wallet_) external {
        wallet = wallet_;
    }

    function transfer(address recipient, uint256 amount) external override returns (bool) {
        _move(msg.sender, recipient, amount);
        if (!callbackAttempted) {
            callbackAttempted = true;
            try wallet.release(address(this), address(this), payable(address(this))) {
                callbackSucceeded = true;
            } catch { }
        }
        return true;
    }
}

contract NoReturnERC20Mock {
    mapping(address => uint256) private balances;

    function mint(address account, uint256 amount) external {
        balances[account] += amount;
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    fallback() external {
        if (msg.sig == bytes4(keccak256("transfer(address,uint256)"))) {
            (address recipient, uint256 amount) = abi.decode(msg.data[4:], (address, uint256));
            require(balances[msg.sender] >= amount, "insufficient");
            balances[msg.sender] -= amount;
            balances[recipient] += amount;
        }
    }
}

contract RevertingBalanceERC20Mock is StandardERC20Mock {
    function balanceOf(address) external pure override returns (uint256) {
        revert("balance failed");
    }
}

contract NoBalanceReturnERC20Mock {
    fallback() external { }
}

contract MalformedBalanceERC20Mock {
    fallback() external {
        if (msg.sig == bytes4(keccak256("balanceOf(address)"))) {
            bytes32 encodedBalance = bytes32(uint256(1 ether));
            assembly {
                mstore(0, encodedBalance)
                return(0, 31)
            }
        }
    }
}

contract OversizedBalanceERC20Mock {
    fallback() external {
        if (msg.sig == bytes4(keccak256("balanceOf(address)"))) {
            assembly {
                mstore(0, 1)
                mstore(32, 2)
                return(0, 64)
            }
        }
    }
}

contract NoMarkerRegistryMock {
    function isStreamAssetPolicyRegistry() external pure returns (bool) {
        return false;
    }
}

contract WrongActiveStatusRegistryMock {
    function isStreamAssetPolicyRegistry() external pure returns (bool) {
        return true;
    }

    function ASSET_STATUS_ACTIVE() external pure returns (uint8) {
        return 2;
    }
}

contract GasGriefAssetPolicyRegistryMock {
    function isStreamAssetPolicyRegistry() external pure returns (bool) {
        return true;
    }

    function ASSET_STATUS_ACTIVE() external pure returns (uint8) {
        return 1;
    }

    function assetStatus(address) external pure returns (uint8) {
        assembly {
            for { } 1 { } { }
        }
        return 1;
    }
}

contract MalformedAssetPolicyRegistryMock {
    function isStreamAssetPolicyRegistry() external pure returns (bool) {
        return true;
    }

    function ASSET_STATUS_ACTIVE() external pure returns (uint8) {
        return 1;
    }

    fallback() external {
        if (msg.sig == bytes4(keccak256("assetStatus(address)"))) {
            bytes32 active = bytes32(uint256(1));
            assembly {
                mstore(0, active)
                return(0, 31)
            }
        }
    }
}

contract OversizedAssetPolicyRegistryMock {
    function isStreamAssetPolicyRegistry() external pure returns (bool) {
        return true;
    }

    function ASSET_STATUS_ACTIVE() external pure returns (uint8) {
        return 1;
    }

    fallback() external {
        if (msg.sig == bytes4(keccak256("assetStatus(address)"))) {
            assembly {
                mstore(0, 1)
                mstore(32, 2)
                return(0, 64)
            }
        }
    }
}

contract OutOfRangeAssetPolicyRegistryMock {
    function isStreamAssetPolicyRegistry() external pure returns (bool) {
        return true;
    }

    function ASSET_STATUS_ACTIVE() external pure returns (uint8) {
        return 1;
    }

    fallback() external {
        if (msg.sig == bytes4(keccak256("assetStatus(address)"))) {
            bytes32 outOfRange = bytes32(uint256(type(uint8).max) + 1);
            assembly {
                mstore(0, outOfRange)
                return(0, 32)
            }
        }
    }
}

contract RejectingNativeRecipient {
    receive() external payable {
        revert("reject");
    }
}

contract ReentrantSplitRecipient {
    IStreamSplitWallet private wallet;
    bool public reentered;
    bool public reenteredSucceeded;

    function setWallet(IStreamSplitWallet wallet_) external {
        wallet = wallet_;
    }

    receive() external payable {
        if (!reentered) {
            reentered = true;
            try wallet.release(address(0), address(this), payable(address(this))) {
                reenteredSucceeded = true;
            } catch { }
        }
    }
}

contract ReentrantSyncRecipient {
    IStreamSplitWallet private wallet;
    bool public reentered;
    bool public reenteredSucceeded;

    function setWallet(IStreamSplitWallet wallet_) external {
        wallet = wallet_;
    }

    receive() external payable {
        if (!reentered) {
            reentered = true;
            try wallet.syncAsset(address(0)) returns (uint256) {
                reenteredSucceeded = true;
            } catch { }
        }
    }
}

contract ReturningNativeRecipient {
    IStreamSplitWallet private wallet;
    bool public returned;

    function setWallet(IStreamSplitWallet wallet_) external {
        wallet = wallet_;
    }

    receive() external payable {
        if (!returned) {
            returned = true;
            (bool sent,) = payable(address(wallet)).call{ value: msg.value }("");
            require(sent, "return failed");
        }
    }
}

contract PartialReturningNativeRecipient {
    IStreamSplitWallet private wallet;
    bool public returned;

    function setWallet(IStreamSplitWallet wallet_) external {
        wallet = wallet_;
    }

    receive() external payable {
        if (!returned) {
            returned = true;
            (bool sent,) = payable(address(wallet)).call{ value: 1 }("");
            require(sent, "return failed");
        }
    }
}

contract WrongRuntimeCode {
    function marker() external pure returns (uint256) {
        return 1;
    }
}
