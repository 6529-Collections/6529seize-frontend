// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IStreamAssetPolicyRegistry.sol";
import "../smart-contracts/IStreamPrimarySaleSettlement.sol";
import "../smart-contracts/IStreamRevenueResolver.sol";
import "../smart-contracts/IStreamSplitFactory.sol";
import "../smart-contracts/IStreamSplitWallet.sol";
import "../smart-contracts/StreamAssetPolicyRegistry.sol";
import "../smart-contracts/StreamPrimarySaleSettlement.sol";
import "../smart-contracts/StreamRevenueResolver.sol";
import "../smart-contracts/StreamSplitFactory.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";

contract StreamPrimarySaleSettlementTest is CharacterizationTestBase {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    address private constant ARTIST = address(0xA001);
    address private constant PROTOCOL = address(0xB002);
    address private constant ESTATE = address(0xC003);
    address private constant PAYER = address(0xD004);
    address private constant SALE_POSTER = address(0xE005);
    address private constant OTHER_SALE_POSTER = address(0xE099);
    address private constant BENEFICIARY = address(0xF006);
    address private constant SETTLEMENT_CALLER = address(0x5151);
    address private constant ALT_SETTLEMENT_CALLER = address(0x5252);
    bytes32 private constant LABEL_ARTIST = keccak256("artist");
    bytes32 private constant LABEL_PROTOCOL = keccak256("protocol");
    bytes32 private constant LABEL_ESTATE = keccak256("estate");
    bytes32 private constant REVENUE_PRIMARY = keccak256("primary");
    bytes32 private constant REVENUE_SPECIAL = keccak256("primary-special");
    bytes32 private constant PROFILE_METADATA = keccak256("ipfs://primary-split");
    bytes32 private constant TEMPLATE_METADATA = keccak256("ipfs://primary-template");
    bytes32 private constant MATERIALIZED_PROFILE_METADATA_DOMAIN =
        keccak256("6529STREAM_MATERIALIZED_PRIMARY_PROFILE_METADATA_V1");
    bytes32 private constant POLICY_EVIDENCE = keccak256("policy-evidence");
    bytes32 private constant ERC20_POLICY_EVIDENCE = keccak256("standard-erc20-policy");
    bytes32 private constant MISSING_PROFILE = keccak256("missing-profile");
    bytes32 private constant SETTLEMENT_POSTER_1 = keccak256("poster-sale-1");
    bytes32 private constant SETTLEMENT_POSTER_2 = keccak256("poster-sale-2");
    bytes32 private constant SETTLEMENT_POSTER_3 = keccak256("poster-sale-3");
    bytes32 private constant SETTLEMENT_UNAUTHORIZED_NATIVE = keccak256("unauthorized-native");
    bytes32 private constant SETTLEMENT_UNAUTHORIZED_ERC20 = keccak256("unauthorized-erc20");
    bytes32 private constant SETTLEMENT_TOKEN_SCOPE = keccak256("token-scope-sale");
    bytes32 private constant SETTLEMENT_NATIVE = keccak256("native-sale");
    bytes32 private constant SETTLEMENT_REPOINT_DRIFT = keccak256("repoint-drift");
    bytes32 private constant SETTLEMENT_STRICT_DRIFT = keccak256("strict-drift");
    bytes32 private constant SETTLEMENT_CURRENT_DRIFT = keccak256("current-drift");
    bytes32 private constant SETTLEMENT_ERC20 = keccak256("erc20-sale");
    bytes32 private constant SETTLEMENT_ERC20_TEMPLATE = keccak256("erc20-template-sale");
    bytes32 private constant SETTLEMENT_ERC20_REPLAY = keccak256("erc20-replay");
    bytes32 private constant SETTLEMENT_TEMPLATE_REPLAY_PRECHECK =
        keccak256("template-replay-precheck");
    bytes32 private constant SETTLEMENT_ERC20_SECOND_LEG = keccak256("erc20-second-leg");
    bytes32 private constant SETTLEMENT_ZERO_POSTER = keccak256("zero-poster-template");
    bytes32 private constant SETTLEMENT_ERC20_BAD = keccak256("erc20-bad");
    bytes32 private constant SETTLEMENT_NATIVE_VALUE_BAD = keccak256("native-value-bad");
    bytes32 private constant SETTLEMENT_OUTER_CALLBACK = keccak256("outer-callback");
    bytes32 private constant SETTLEMENT_INNER_CALLBACK = keccak256("inner-callback");
    bytes32 private constant PRIMARY_REVENUE_SETTLED_TOPIC = keccak256(
        "PrimaryRevenueSettled(bytes32,bytes32,bytes32,address,address,address,uint256,bytes32,bool,uint8)"
    );
    bytes32 private constant PRIMARY_REVENUE_SETTLEMENT_CONTEXT_TOPIC = keccak256(
        "PrimaryRevenueSettlementContext(bytes32,bytes32,bytes32,address,bytes32,uint8,uint256,uint256,uint256,address,address,bytes32)"
    );
    bytes32 private constant PRIMARY_REVENUE_SETTLEMENT_POLICY_TOPIC = keccak256(
        "PrimaryRevenueSettlementPolicy(bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32)"
    );

    StreamAssetPolicyRegistry private assetPolicyRegistry;
    StreamSplitFactory private factory;
    StreamRevenueResolver private resolver;
    StreamPrimarySaleSettlement private settlement;

    function setUp() public {
        assetPolicyRegistry = new StreamAssetPolicyRegistry();
        factory = new StreamSplitFactory(assetPolicyRegistry);
        resolver = new StreamRevenueResolver(factory);
        settlement = new StreamPrimarySaleSettlement(resolver);
        settlement.setSettlementCaller(SETTLEMENT_CALLER, true);
    }

    function testResolverPrecedenceFreezeAndVerifiedProfileRequirement() public {
        (bytes32 defaultProfile,,) = _createProfile(ARTIST, 1_000_000, LABEL_ARTIST);
        (bytes32 collectionProfile,,) = _createProfile(PROTOCOL, 1_000_000, LABEL_PROTOCOL);
        (bytes32 tokenProfile,,) = _createProfile(ESTATE, 1_000_000, LABEL_ESTATE);

        bytes32 defaultHash = resolver.setPrimaryProfileAssignment(
            REVENUE_PRIMARY, resolver.SCOPE_DEFAULT(), 0, defaultProfile, POLICY_EVIDENCE
        );
        defaultHash.assertEq(
            resolver.primaryAssignmentHash(
                REVENUE_PRIMARY,
                resolver.SCOPE_DEFAULT(),
                0,
                resolver.ASSIGNMENT_TYPE_PROFILE(),
                defaultProfile,
                bytes32(0),
                POLICY_EVIDENCE,
                false
            ),
            "profile assignment hash binds resolver context"
        );
        bytes32 collectionHash = resolver.setPrimaryProfileAssignment(
            REVENUE_PRIMARY, resolver.SCOPE_COLLECTION(), 42, collectionProfile, POLICY_EVIDENCE
        );
        bytes32 tokenHash = resolver.setPrimaryProfileAssignment(
            REVENUE_PRIMARY, resolver.SCOPE_TOKEN(), 9001, tokenProfile, POLICY_EVIDENCE
        );

        IStreamRevenueResolver.ResolvedPrimaryAssignment memory tokenResolved =
            resolver.resolvePrimaryAssignment(42, 9001, REVENUE_PRIMARY);
        tokenResolved.profileId.assertEq(tokenProfile, "token profile wins");
        tokenResolved.assignmentHash.assertEq(tokenHash, "token hash wins");
        uint256(tokenResolved.scope).assertEq(resolver.SCOPE_TOKEN(), "token scope");

        IStreamRevenueResolver.ResolvedPrimaryAssignment memory collectionResolved =
            resolver.resolvePrimaryAssignment(42, 0, REVENUE_PRIMARY);
        collectionResolved.profileId.assertEq(collectionProfile, "collection profile wins");
        collectionResolved.assignmentHash.assertEq(collectionHash, "collection hash wins");
        uint256(collectionResolved.scope).assertEq(resolver.SCOPE_COLLECTION(), "collection scope");

        IStreamRevenueResolver.ResolvedPrimaryAssignment memory defaultResolved =
            resolver.resolvePrimaryAssignment(777, 0, REVENUE_PRIMARY);
        defaultResolved.profileId.assertEq(defaultProfile, "default fallback");
        defaultResolved.assignmentHash.assertEq(defaultHash, "default hash");
        uint256(defaultResolved.scope).assertEq(resolver.SCOPE_DEFAULT(), "default scope");

        IStreamRevenueResolver.ResolvedPrimaryAssignment memory zeroContextResolved =
            resolver.resolvePrimaryAssignment(0, 0, REVENUE_PRIMARY);
        zeroContextResolved.profileId.assertEq(defaultProfile, "zero context uses default");
        uint256(zeroContextResolved.scope).assertEq(resolver.SCOPE_DEFAULT(), "zero context scope");

        bytes32 frozenHash =
            resolver.freezePrimaryAssignment(REVENUE_PRIMARY, resolver.SCOPE_COLLECTION(), 42);
        require(frozenHash != collectionHash, "freeze must change assignment hash");
        IStreamRevenueResolver.ResolvedPrimaryAssignment memory frozenResolved =
            resolver.resolvePrimaryAssignment(42, 0, REVENUE_PRIMARY);
        frozenResolved.frozen.assertTrue("assignment frozen");
        frozenResolved.assignmentHash.assertEq(frozenHash, "frozen hash resolved");

        uint8 collectionScope = resolver.SCOPE_COLLECTION();
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRevenueResolver.PrimaryAssignmentFrozen.selector,
                REVENUE_PRIMARY,
                collectionScope,
                42
            )
        );
        resolver.clearPrimaryAssignment(REVENUE_PRIMARY, collectionScope, 42);

        _expectZeroScopeProfileRevert(collectionScope, defaultProfile);

        uint8 tokenScope = resolver.SCOPE_TOKEN();
        _expectZeroScopeProfileRevert(tokenScope, tokenProfile);

        uint8 defaultScope = resolver.SCOPE_DEFAULT();
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRevenueResolver.UnverifiedSplitProfile.selector, MISSING_PROFILE
            )
        );
        resolver.setPrimaryProfileAssignment(
            REVENUE_PRIMARY, defaultScope, 0, MISSING_PROFILE, POLICY_EVIDENCE
        );
    }

    function testFrozenAssignmentRejectsProfileAndTemplateOverwrite() public {
        (bytes32 profileId,,) = _createProfile(ARTIST, 1_000_000, LABEL_ARTIST);
        bytes32 profileAssignmentHash = resolver.setPrimaryProfileAssignment(
            REVENUE_PRIMARY, resolver.SCOPE_COLLECTION(), 64, profileId, POLICY_EVIDENCE
        );
        bytes32 frozenHash =
            resolver.freezePrimaryAssignment(REVENUE_PRIMARY, resolver.SCOPE_COLLECTION(), 64);
        require(frozenHash != profileAssignmentHash, "frozen hash changed");

        (bytes32 replacementProfile,,) = _createProfile(PROTOCOL, 1_000_000, LABEL_PROTOCOL);
        uint8 collectionScope = resolver.SCOPE_COLLECTION();
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRevenueResolver.PrimaryAssignmentFrozen.selector,
                REVENUE_PRIMARY,
                collectionScope,
                64
            )
        );
        resolver.setPrimaryProfileAssignment(
            REVENUE_PRIMARY, collectionScope, 64, replacementProfile, POLICY_EVIDENCE
        );

        IStreamRevenueResolver.PrimaryTemplateEntry[] memory entries =
            new IStreamRevenueResolver.PrimaryTemplateEntry[](1);
        entries[0] = IStreamRevenueResolver.PrimaryTemplateEntry({
            account: PROTOCOL,
            accountSource: bytes32(0),
            sharePpm: 1_000_000,
            labelId: LABEL_PROTOCOL
        });
        bytes32 templateId = resolver.createPrimaryTemplate(entries, TEMPLATE_METADATA);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRevenueResolver.PrimaryAssignmentFrozen.selector,
                REVENUE_PRIMARY,
                collectionScope,
                64
            )
        );
        resolver.setPrimaryTemplateAssignment(
            REVENUE_PRIMARY, collectionScope, 64, templateId, POLICY_EVIDENCE
        );
    }

    function testClearPrimaryAssignmentFallsThroughAndRejectsMissing() public {
        (bytes32 defaultProfile,,) = _createProfile(ARTIST, 1_000_000, LABEL_ARTIST);
        (bytes32 collectionProfile,,) = _createProfile(PROTOCOL, 1_000_000, LABEL_PROTOCOL);
        (bytes32 tokenProfile,,) = _createProfile(ESTATE, 1_000_000, LABEL_ESTATE);
        resolver.setPrimaryProfileAssignment(
            REVENUE_PRIMARY, resolver.SCOPE_DEFAULT(), 0, defaultProfile, POLICY_EVIDENCE
        );
        bytes32 collectionHash = resolver.setPrimaryProfileAssignment(
            REVENUE_PRIMARY, resolver.SCOPE_COLLECTION(), 42, collectionProfile, POLICY_EVIDENCE
        );
        resolver.setPrimaryProfileAssignment(
            REVENUE_PRIMARY, resolver.SCOPE_TOKEN(), 9001, tokenProfile, POLICY_EVIDENCE
        );

        uint8 tokenScope = resolver.SCOPE_TOKEN();
        resolver.clearPrimaryAssignment(REVENUE_PRIMARY, tokenScope, 9001);
        IStreamRevenueResolver.ResolvedPrimaryAssignment memory clearedTokenResolved =
            resolver.resolvePrimaryAssignment(42, 9001, REVENUE_PRIMARY);
        clearedTokenResolved.profileId.assertEq(collectionProfile, "cleared token falls through");
        clearedTokenResolved.assignmentHash
            .assertEq(collectionHash, "cleared token collection hash");
        uint256(clearedTokenResolved.scope)
            .assertEq(resolver.SCOPE_COLLECTION(), "cleared token collection scope");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRevenueResolver.PrimaryAssignmentMissing.selector,
                REVENUE_PRIMARY,
                tokenScope,
                9001
            )
        );
        resolver.clearPrimaryAssignment(REVENUE_PRIMARY, tokenScope, 9001);
    }

    function testSplitWalletExistsRejectsMissingWrongCodeAndMismatchedWallet() public {
        factory.splitWalletExists(MISSING_PROFILE).assertFalse("missing profile");

        (bytes32 profileId, address wallet,) = _createProfile(ARTIST, 1_000_000, LABEL_ARTIST);
        vm.etch(wallet, hex"");
        factory.splitWalletExists(profileId).assertFalse("undeployed wallet rejected");

        (bytes32 wrongCodeProfile, address wrongCodeWallet,) =
            _createProfile(PROTOCOL, 1_000_000, LABEL_PROTOCOL);
        vm.etch(wrongCodeWallet, hex"60006000");
        factory.splitWalletExists(wrongCodeProfile).assertFalse("wrong runtime rejected");
    }

    function _expectZeroScopeProfileRevert(uint8 scope, bytes32 profileId) private {
        vm.expectRevert(
            abi.encodeWithSelector(IStreamRevenueResolver.InvalidAssignmentScope.selector, scope, 0)
        );
        resolver.setPrimaryProfileAssignment(REVENUE_PRIMARY, scope, 0, profileId, POLICY_EVIDENCE);
    }

    function testTemplateMaterializationUsesSalePosterAggregatesAndIgnoresSaleContext() public {
        bytes32 unsupportedSource = keccak256("UNSUPPORTED_SOURCE");
        IStreamRevenueResolver.PrimaryTemplateEntry[] memory unsupportedEntries =
            new IStreamRevenueResolver.PrimaryTemplateEntry[](1);
        unsupportedEntries[0] = IStreamRevenueResolver.PrimaryTemplateEntry({
            account: address(0),
            accountSource: unsupportedSource,
            sharePpm: 1_000_000,
            labelId: LABEL_ARTIST
        });
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRevenueResolver.UnsupportedAccountSource.selector, unsupportedSource
            )
        );
        resolver.createPrimaryTemplate(unsupportedEntries, TEMPLATE_METADATA);

        IStreamRevenueResolver.PrimaryTemplateEntry[] memory entries =
            new IStreamRevenueResolver.PrimaryTemplateEntry[](3);
        entries[0] = IStreamRevenueResolver.PrimaryTemplateEntry({
            account: address(0),
            accountSource: resolver.ACCOUNT_SOURCE_SALE_POSTER(),
            sharePpm: 600_000,
            labelId: LABEL_ARTIST
        });
        entries[1] = IStreamRevenueResolver.PrimaryTemplateEntry({
            account: SALE_POSTER,
            accountSource: bytes32(0),
            sharePpm: 100_000,
            labelId: LABEL_ARTIST
        });
        entries[2] = IStreamRevenueResolver.PrimaryTemplateEntry({
            account: PROTOCOL, accountSource: bytes32(0), sharePpm: 300_000, labelId: LABEL_PROTOCOL
        });

        bytes32 templateId = resolver.createPrimaryTemplate(entries, TEMPLATE_METADATA);
        bytes32 assignmentHash = resolver.setPrimaryTemplateAssignment(
            REVENUE_PRIMARY, resolver.SCOPE_COLLECTION(), 7, templateId, POLICY_EVIDENCE
        );
        assignmentHash.assertEq(
            resolver.primaryAssignmentHash(
                REVENUE_PRIMARY,
                resolver.SCOPE_COLLECTION(),
                7,
                resolver.ASSIGNMENT_TYPE_TEMPLATE(),
                bytes32(0),
                templateId,
                POLICY_EVIDENCE,
                false
            ),
            "template assignment hash binds template context"
        );
        vm.prank(address(0xABCD));
        (bytes32 publicProfile, address publicWallet,) =
            resolver.materializePrimaryProfile(templateId, address(0xBEEF));
        factory.splitWalletExists(publicProfile).assertTrue("public materialization verified");
        publicWallet.assertEq(factory.walletFor(publicProfile), "public materialization wallet");

        (bytes32 expectedProfile, address expectedWallet,) =
            resolver.materializePrimaryProfile(templateId, SALE_POSTER);
        bytes32 expectedPolicyHash = _expectedPolicyHash(
            REVENUE_PRIMARY, 7, 0, templateId, expectedProfile, expectedWallet, assignmentHash
        );

        IStreamPrimarySaleSettlement.PrimarySale memory sale =
            _sale(SETTLEMENT_POSTER_1, REVENUE_PRIMARY, 7, 0, 1, 2 ether, expectedPolicyHash);
        vm.deal(SETTLEMENT_CALLER, 4 ether);
        vm.prank(SETTLEMENT_CALLER);
        (, bytes32 firstProfile, address firstWallet) =
            settlement.settleNativePrimarySale{ value: 2 ether }(sale);

        IStreamSplitWallet wallet = IStreamSplitWallet(firstWallet);
        uint256(wallet.aggregateSharePpm(SALE_POSTER)).assertEq(700_000, "poster aggregate");
        uint256(wallet.aggregateSharePpm(PROTOCOL)).assertEq(300_000, "protocol aggregate");
        factory.profileEntryCount(firstProfile).assertEq(2, "materialized entry count");

        IStreamPrimarySaleSettlement.PrimarySale memory secondSale =
            _sale(SETTLEMENT_POSTER_2, REVENUE_PRIMARY, 7, 0, 2, 2 ether, expectedPolicyHash);
        vm.prank(SETTLEMENT_CALLER);
        (, bytes32 secondProfile, address secondWallet) =
            settlement.settleNativePrimarySale{ value: 2 ether }(secondSale);

        secondProfile.assertEq(firstProfile, "sale context excluded from profile id");
        secondWallet.assertEq(firstWallet, "same poster reuses deterministic wallet");
        settlement.officialSettled(REVENUE_PRIMARY, firstProfile, firstWallet, address(0))
            .assertEq(4 ether, "official native total");
    }

    function testTemplateSettlementUsesDifferentPosterWallets() public {
        IStreamRevenueResolver.PrimaryTemplateEntry[] memory entries =
            new IStreamRevenueResolver.PrimaryTemplateEntry[](2);
        entries[0] = IStreamRevenueResolver.PrimaryTemplateEntry({
            account: address(0),
            accountSource: resolver.ACCOUNT_SOURCE_SALE_POSTER(),
            sharePpm: 900_000,
            labelId: LABEL_ARTIST
        });
        entries[1] = IStreamRevenueResolver.PrimaryTemplateEntry({
            account: PROTOCOL, accountSource: bytes32(0), sharePpm: 100_000, labelId: LABEL_PROTOCOL
        });
        bytes32 templateId = resolver.createPrimaryTemplate(entries, TEMPLATE_METADATA);
        bytes32 assignmentHash = resolver.setPrimaryTemplateAssignment(
            REVENUE_PRIMARY, resolver.SCOPE_COLLECTION(), 8, templateId, POLICY_EVIDENCE
        );

        (bytes32 firstProfile, address firstWallet,) =
            resolver.materializePrimaryProfile(templateId, SALE_POSTER);
        bytes32 firstPolicyHash = _expectedPolicyHash(
            REVENUE_PRIMARY, 8, 0, templateId, firstProfile, firstWallet, assignmentHash
        );
        IStreamPrimarySaleSettlement.PrimarySale memory firstSale =
            _sale(SETTLEMENT_POSTER_1, REVENUE_PRIMARY, 8, 0, 1, 1 ether, firstPolicyHash);

        (bytes32 secondProfile, address secondWallet,) =
            resolver.materializePrimaryProfile(templateId, OTHER_SALE_POSTER);
        bytes32 secondPolicyHash = _expectedPolicyHash(
            REVENUE_PRIMARY, 8, 0, templateId, secondProfile, secondWallet, assignmentHash
        );
        IStreamPrimarySaleSettlement.PrimarySale memory secondSale =
            _sale(SETTLEMENT_POSTER_3, REVENUE_PRIMARY, 8, 0, 2, 1 ether, secondPolicyHash);
        secondSale.poster = OTHER_SALE_POSTER;

        require(firstProfile != secondProfile, "different poster profile");
        require(firstWallet != secondWallet, "different poster wallet");
        vm.deal(SETTLEMENT_CALLER, 2 ether);
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleNativePrimarySale{ value: 1 ether }(firstSale);
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleNativePrimarySale{ value: 1 ether }(secondSale);

        firstWallet.balance.assertEq(1 ether, "first poster wallet funded");
        secondWallet.balance.assertEq(1 ether, "second poster wallet funded");
        uint256(IStreamSplitWallet(firstWallet).aggregateSharePpm(SALE_POSTER))
            .assertEq(900_000, "first poster share");
        uint256(IStreamSplitWallet(secondWallet).aggregateSharePpm(OTHER_SALE_POSTER))
            .assertEq(900_000, "second poster share");
    }

    function testERC20TemplateSettlementMaterializesProfileOnSettlement() public {
        IStreamRevenueResolver.PrimaryTemplateEntry[] memory entries =
            new IStreamRevenueResolver.PrimaryTemplateEntry[](1);
        entries[0] = IStreamRevenueResolver.PrimaryTemplateEntry({
            account: address(0),
            accountSource: resolver.ACCOUNT_SOURCE_SALE_POSTER(),
            sharePpm: 1_000_000,
            labelId: LABEL_ARTIST
        });
        bytes32 templateId = resolver.createPrimaryTemplate(entries, TEMPLATE_METADATA);
        bytes32 assignmentHash = resolver.setPrimaryTemplateAssignment(
            REVENUE_SPECIAL, resolver.SCOPE_COLLECTION(), 12, templateId, POLICY_EVIDENCE
        );

        PrimarySettlementERC20Mock token = new PrimarySettlementERC20Mock();
        _activateAsset(address(token));
        token.mint(PAYER, 6 ether);
        vm.prank(PAYER);
        token.approve(address(settlement), 6 ether);

        IStreamPrimarySaleSettlement.PrimarySale memory sale =
            _sale(SETTLEMENT_ERC20_TEMPLATE, REVENUE_SPECIAL, 12, 0, 1, 5 ether, POLICY_EVIDENCE);
        sale.policyMode = settlement.POLICY_MODE_ALLOW_CURRENT();

        vm.recordLogs();
        vm.prank(SETTLEMENT_CALLER);
        (bytes32 key, bytes32 profileId, address wallet) =
            settlement.settleERC20PrimarySale(sale, address(token));

        settlement.settlementConsumed(key).assertTrue("template erc20 consumed");
        factory.splitWalletExists(profileId).assertTrue("template profile materialized");
        wallet.assertEq(factory.walletFor(profileId), "template wallet");
        token.balanceOf(wallet).assertEq(5 ether, "template wallet erc20");
        settlement.officialSettled(REVENUE_SPECIAL, profileId, wallet, address(token))
            .assertEq(5 ether, "template erc20 official");
        _assertTemplateERC20SettlementLogs(
            key, profileId, wallet, address(token), sale, assignmentHash, templateId
        );
    }

    function testTemplateSettlementRejectsZeroPosterBeforeFundsMoveOrKeyConsumption() public {
        IStreamRevenueResolver.PrimaryTemplateEntry[] memory entries =
            new IStreamRevenueResolver.PrimaryTemplateEntry[](1);
        entries[0] = IStreamRevenueResolver.PrimaryTemplateEntry({
            account: address(0),
            accountSource: resolver.ACCOUNT_SOURCE_SALE_POSTER(),
            sharePpm: 1_000_000,
            labelId: LABEL_ARTIST
        });
        bytes32 templateId = resolver.createPrimaryTemplate(entries, TEMPLATE_METADATA);
        resolver.setPrimaryTemplateAssignment(
            REVENUE_SPECIAL, resolver.SCOPE_COLLECTION(), 13, templateId, POLICY_EVIDENCE
        );

        PrimarySettlementERC20Mock token = new PrimarySettlementERC20Mock();
        _activateAsset(address(token));
        token.mint(PAYER, 4 ether);
        vm.prank(PAYER);
        token.approve(address(settlement), 4 ether);

        IStreamPrimarySaleSettlement.PrimarySale memory sale =
            _sale(SETTLEMENT_ZERO_POSTER, REVENUE_SPECIAL, 13, 0, 1, 3 ether, POLICY_EVIDENCE);
        sale.policyMode = settlement.POLICY_MODE_ALLOW_CURRENT();
        sale.poster = address(0);
        bytes32 key = settlement.settlementKey(sale);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRevenueResolver.InvalidMaterializedAccount.selector,
                resolver.ACCOUNT_SOURCE_SALE_POSTER()
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleERC20PrimarySale(sale, address(token));

        settlement.settlementConsumed(key).assertFalse("zero poster key not consumed");
        token.balanceOf(PAYER).assertEq(4 ether, "payer untouched");
        token.balanceOf(address(settlement)).assertEq(0, "adapter untouched");
        settlement.totalOfficialSettled(address(token)).assertEq(0, "no official token total");
    }

    function testSettlementRejectsUnauthorizedCallersAndRevokedCallers() public {
        (bytes32 profileId, address wallet, bytes32 assignmentHash) =
            _assignedSingleAccountProfile(REVENUE_PRIMARY, ARTIST);
        bytes32 expectedPolicyHash = _expectedPolicyHash(
            REVENUE_PRIMARY, 1, 0, bytes32(0), profileId, wallet, assignmentHash
        );
        IStreamPrimarySaleSettlement.PrimarySale memory nativeSale = _sale(
            SETTLEMENT_UNAUTHORIZED_NATIVE, REVENUE_PRIMARY, 1, 0, 1, 1 ether, expectedPolicyHash
        );

        vm.deal(ALT_SETTLEMENT_CALLER, 1 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.UnauthorizedSettlementCaller.selector,
                ALT_SETTLEMENT_CALLER
            )
        );
        vm.prank(ALT_SETTLEMENT_CALLER);
        settlement.settleNativePrimarySale{ value: 1 ether }(nativeSale);

        PrimarySettlementERC20Mock token = new PrimarySettlementERC20Mock();
        _activateAsset(address(token));
        token.mint(PAYER, 1 ether);
        vm.prank(PAYER);
        token.approve(address(settlement), 1 ether);
        IStreamPrimarySaleSettlement.PrimarySale memory erc20Sale = _sale(
            SETTLEMENT_UNAUTHORIZED_ERC20, REVENUE_PRIMARY, 1, 0, 2, 1 ether, expectedPolicyHash
        );
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.UnauthorizedSettlementCaller.selector,
                ALT_SETTLEMENT_CALLER
            )
        );
        vm.prank(ALT_SETTLEMENT_CALLER);
        settlement.settleERC20PrimarySale(erc20Sale, address(token));

        settlement.setSettlementCaller(SETTLEMENT_CALLER, false);
        vm.deal(SETTLEMENT_CALLER, 1 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.UnauthorizedSettlementCaller.selector,
                SETTLEMENT_CALLER
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleNativePrimarySale{ value: 1 ether }(nativeSale);

        wallet.balance.assertEq(0, "unauthorized native not credited");
        token.balanceOf(PAYER).assertEq(1 ether, "unauthorized erc20 not pulled");
    }

    function testTokenScopedAssignmentSettlesToTokenWallet() public {
        (bytes32 defaultProfile,,) = _createProfile(PROTOCOL, 1_000_000, LABEL_PROTOCOL);
        (bytes32 tokenProfile, address tokenWallet,) =
            _createProfile(ESTATE, 1_000_000, LABEL_ESTATE);
        resolver.setPrimaryProfileAssignment(
            REVENUE_PRIMARY, resolver.SCOPE_DEFAULT(), 0, defaultProfile, POLICY_EVIDENCE
        );
        bytes32 tokenAssignmentHash = resolver.setPrimaryProfileAssignment(
            REVENUE_PRIMARY, resolver.SCOPE_TOKEN(), 77, tokenProfile, POLICY_EVIDENCE
        );
        bytes32 expectedPolicyHash = _expectedPolicyHash(
            REVENUE_PRIMARY, 9, 77, bytes32(0), tokenProfile, tokenWallet, tokenAssignmentHash
        );
        IStreamPrimarySaleSettlement.PrimarySale memory sale =
            _sale(SETTLEMENT_TOKEN_SCOPE, REVENUE_PRIMARY, 9, 77, 1, 2 ether, expectedPolicyHash);

        vm.deal(SETTLEMENT_CALLER, 2 ether);
        vm.prank(SETTLEMENT_CALLER);
        (, bytes32 settledProfile, address settledWallet) =
            settlement.settleNativePrimarySale{ value: 2 ether }(sale);

        settledProfile.assertEq(tokenProfile, "token profile settled");
        settledWallet.assertEq(tokenWallet, "token wallet settled");
        tokenWallet.balance.assertEq(2 ether, "token wallet funded");
        settlement.officialSettled(REVENUE_PRIMARY, tokenProfile, tokenWallet, address(0))
            .assertEq(2 ether, "token scoped official total");
    }

    function testNativeSettlementRecordsOfficialRevenueAndRejectsReplay() public {
        (bytes32 profileId, address wallet, bytes32 assignmentHash) =
            _assignedSingleAccountProfile(REVENUE_PRIMARY, ARTIST);
        bytes32 expectedPolicyHash = _expectedPolicyHash(
            REVENUE_PRIMARY, 1, 0, bytes32(0), profileId, wallet, assignmentHash
        );
        IStreamPrimarySaleSettlement.PrimarySale memory sale =
            _sale(SETTLEMENT_NATIVE, REVENUE_PRIMARY, 1, 0, 1, 3 ether, expectedPolicyHash);

        vm.prank(SETTLEMENT_CALLER);
        bytes32 expectedKey = settlement.settlementKey(sale);

        vm.deal(SETTLEMENT_CALLER, 6 ether);
        vm.prank(SETTLEMENT_CALLER);
        (bytes32 key, bytes32 settledProfileId, address settledWallet) =
            settlement.settleNativePrimarySale{ value: 3 ether }(sale);

        key.assertEq(expectedKey, "settlement key");
        settledProfileId.assertEq(profileId, "profile id");
        settledWallet.assertEq(wallet, "wallet");
        wallet.balance.assertEq(3 ether, "wallet balance");
        settlement.settlementConsumed(key).assertTrue("consumed");
        settlement.officialSettled(REVENUE_PRIMARY, profileId, wallet, address(0))
            .assertEq(3 ether, "official native revenue");
        settlement.totalOfficialSettled(address(0)).assertEq(3 ether, "official native asset total");

        (bool sent,) = payable(wallet).call{ value: 1 ether }("");
        sent.assertTrue("passive receipt");
        wallet.balance.assertEq(4 ether, "passive wallet balance");
        settlement.officialSettled(REVENUE_PRIMARY, profileId, wallet, address(0))
            .assertEq(3 ether, "passive receipt not official");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.SettlementAlreadyConsumed.selector, key
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleNativePrimarySale{ value: 3 ether }(sale);

        IStreamPrimarySaleSettlement.PrimarySale memory policyVariant = sale;
        policyVariant.policyMode = settlement.POLICY_MODE_ALLOW_CURRENT();
        policyVariant.expectedPolicyHash = keccak256("changed-policy-evidence");
        settlement.settlementKey(policyVariant).assertEq(key, "policy evidence not replay domain");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.SettlementAlreadyConsumed.selector, key
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleNativePrimarySale{ value: 3 ether }(policyVariant);

        settlement.setSettlementCaller(ALT_SETTLEMENT_CALLER, true);
        vm.deal(ALT_SETTLEMENT_CALLER, 3 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.SettlementAlreadyConsumed.selector, key
            )
        );
        vm.prank(ALT_SETTLEMENT_CALLER);
        settlement.settleNativePrimarySale{ value: 3 ether }(sale);

        PrimarySettlementERC20Mock token = new PrimarySettlementERC20Mock();
        _activateAsset(address(token));
        token.mint(PAYER, 3 ether);
        vm.prank(PAYER);
        token.approve(address(settlement), 3 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.SettlementAlreadyConsumed.selector, key
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleERC20PrimarySale(sale, address(token));
    }

    function testNativeSettlementRejectsIncorrectValueBeforeConsumptionOrFunds() public {
        (bytes32 profileId, address wallet, bytes32 assignmentHash) =
            _assignedSingleAccountProfile(REVENUE_PRIMARY, ARTIST);
        bytes32 expectedPolicyHash = _expectedPolicyHash(
            REVENUE_PRIMARY, 1, 0, bytes32(0), profileId, wallet, assignmentHash
        );
        IStreamPrimarySaleSettlement.PrimarySale memory sale = _sale(
            SETTLEMENT_NATIVE_VALUE_BAD, REVENUE_PRIMARY, 1, 0, 1, 3 ether, expectedPolicyHash
        );
        bytes32 key = settlement.settlementKey(sale);

        vm.deal(SETTLEMENT_CALLER, 10 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.IncorrectNativeValue.selector, 3 ether, 2 ether
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleNativePrimarySale{ value: 2 ether }(sale);

        settlement.settlementConsumed(key).assertFalse("underpay key not consumed");
        wallet.balance.assertEq(0, "underpay wallet untouched");
        settlement.officialSettled(REVENUE_PRIMARY, profileId, wallet, address(0))
            .assertEq(0, "underpay not official");
        settlement.totalOfficialSettled(address(0)).assertEq(0, "underpay total untouched");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.IncorrectNativeValue.selector, 3 ether, 4 ether
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleNativePrimarySale{ value: 4 ether }(sale);

        settlement.settlementConsumed(key).assertFalse("overpay key not consumed");
        wallet.balance.assertEq(0, "overpay wallet untouched");
        settlement.officialSettled(REVENUE_PRIMARY, profileId, wallet, address(0))
            .assertEq(0, "overpay not official");
        settlement.totalOfficialSettled(address(0)).assertEq(0, "overpay total untouched");
    }

    function testAllowCurrentSettlementRecordsRepointDriftToCurrentWallet() public {
        (bytes32 initialProfile, address initialWallet, bytes32 initialAssignmentHash) =
            _assignedSingleAccountProfile(REVENUE_SPECIAL, ARTIST);
        bytes32 expectedPolicyHash = _expectedPolicyHash(
            REVENUE_SPECIAL, 1, 0, bytes32(0), initialProfile, initialWallet, initialAssignmentHash
        );
        (bytes32 currentProfile, address currentWallet,) =
            _createProfile(PROTOCOL, 1_000_000, LABEL_PROTOCOL);
        bytes32 currentAssignmentHash = resolver.setPrimaryProfileAssignment(
            REVENUE_SPECIAL,
            resolver.SCOPE_DEFAULT(),
            0,
            currentProfile,
            keccak256("operator-repoint")
        );
        bytes32 currentPolicyHash = _expectedPolicyHash(
            REVENUE_SPECIAL, 1, 0, bytes32(0), currentProfile, currentWallet, currentAssignmentHash
        );
        require(currentPolicyHash != expectedPolicyHash, "policy drift expected");

        IStreamPrimarySaleSettlement.PrimarySale memory sale =
            _sale(SETTLEMENT_REPOINT_DRIFT, REVENUE_SPECIAL, 1, 0, 1, 1 ether, expectedPolicyHash);
        sale.policyMode = settlement.POLICY_MODE_ALLOW_CURRENT();

        vm.deal(SETTLEMENT_CALLER, 1 ether);
        vm.recordLogs();
        vm.prank(SETTLEMENT_CALLER);
        (, bytes32 settledProfile, address settledWallet) =
            settlement.settleNativePrimarySale{ value: 1 ether }(sale);

        settledProfile.assertEq(currentProfile, "current profile settled");
        settledWallet.assertEq(currentWallet, "current wallet settled");
        currentWallet.balance.assertEq(1 ether, "current wallet funded");
        initialWallet.balance.assertEq(0, "initial wallet not funded");
        settlement.officialSettled(REVENUE_SPECIAL, currentProfile, currentWallet, address(0))
            .assertEq(1 ether, "current wallet official revenue");
        _assertSettlementEventDrift(
            true,
            resolver.ASSIGNMENT_TYPE_PROFILE(),
            sale.settlementId,
            sale.policyMode,
            sale.saleId
        );
    }

    function testStrictPolicyDriftRevertsAndAllowCurrentRecordsDrift() public {
        (bytes32 profileId, address wallet, bytes32 assignmentHash) =
            _assignedSingleAccountProfile(REVENUE_SPECIAL, ARTIST);
        bytes32 expectedPolicyHash = _expectedPolicyHash(
            REVENUE_SPECIAL, 1, 0, bytes32(0), profileId, wallet, assignmentHash
        );
        bytes32 frozenHash =
            resolver.freezePrimaryAssignment(REVENUE_SPECIAL, resolver.SCOPE_DEFAULT(), 0);
        require(frozenHash != assignmentHash, "frozen hash changed");
        bytes32 frozenPolicyHash =
            _expectedPolicyHash(REVENUE_SPECIAL, 1, 0, bytes32(0), profileId, wallet, frozenHash);

        IStreamPrimarySaleSettlement.PrimarySale memory strictSale =
            _sale(SETTLEMENT_STRICT_DRIFT, REVENUE_SPECIAL, 1, 0, 1, 1 ether, expectedPolicyHash);
        vm.deal(SETTLEMENT_CALLER, 2 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.PrimaryPolicyHashMismatch.selector,
                expectedPolicyHash,
                frozenPolicyHash
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleNativePrimarySale{ value: 1 ether }(strictSale);

        IStreamPrimarySaleSettlement.PrimarySale memory currentSale =
            _sale(SETTLEMENT_CURRENT_DRIFT, REVENUE_SPECIAL, 1, 0, 2, 1 ether, expectedPolicyHash);
        currentSale.policyMode = settlement.POLICY_MODE_ALLOW_CURRENT();

        vm.recordLogs();
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleNativePrimarySale{ value: 1 ether }(currentSale);

        settlement.officialSettled(REVENUE_SPECIAL, profileId, wallet, address(0))
            .assertEq(1 ether, "allow-current official revenue");
        _assertSettlementEventDrift(
            true,
            resolver.ASSIGNMENT_TYPE_PROFILE(),
            currentSale.settlementId,
            currentSale.policyMode,
            currentSale.saleId
        );
    }

    function testERC20SettlementRequiresActiveStandardTokenAndRecordsExactOfficialRevenue() public {
        (bytes32 profileId, address wallet, bytes32 assignmentHash) =
            _assignedSingleAccountProfile(REVENUE_PRIMARY, ARTIST);
        bytes32 expectedPolicyHash = _expectedPolicyHash(
            REVENUE_PRIMARY, 1, 0, bytes32(0), profileId, wallet, assignmentHash
        );
        PrimarySettlementERC20Mock token = new PrimarySettlementERC20Mock();
        _activateAsset(address(token));
        token.mint(PAYER, 10 ether);
        vm.prank(PAYER);
        token.approve(address(settlement), 10 ether);

        IStreamPrimarySaleSettlement.PrimarySale memory sale =
            _sale(SETTLEMENT_ERC20, REVENUE_PRIMARY, 1, 0, 1, 4 ether, expectedPolicyHash);
        vm.prank(SETTLEMENT_CALLER);
        (bytes32 key, bytes32 settledProfileId, address settledWallet) =
            settlement.settleERC20PrimarySale(sale, address(token));

        settlement.settlementConsumed(key).assertTrue("erc20 consumed");
        settledProfileId.assertEq(profileId, "profile id");
        settledWallet.assertEq(wallet, "wallet");
        token.balanceOf(PAYER).assertEq(6 ether, "payer debited");
        token.balanceOf(address(settlement)).assertEq(0, "adapter swept");
        token.balanceOf(wallet).assertEq(4 ether, "wallet credited");
        settlement.officialSettled(REVENUE_PRIMARY, profileId, wallet, address(token))
            .assertEq(4 ether, "official erc20 revenue");
        settlement.totalOfficialSettled(address(token)).assertEq(4 ether, "official erc20 total");

        token.mint(wallet, 1 ether);
        token.balanceOf(wallet).assertEq(5 ether, "passive token receipt");
        settlement.officialSettled(REVENUE_PRIMARY, profileId, wallet, address(token))
            .assertEq(4 ether, "passive token receipt not official");
    }

    function testERC20SettlementConsumesKeyAcrossERC20Assets() public {
        (bytes32 profileId, address wallet, bytes32 assignmentHash) =
            _assignedSingleAccountProfile(REVENUE_PRIMARY, ARTIST);
        bytes32 expectedPolicyHash = _expectedPolicyHash(
            REVENUE_PRIMARY, 1, 0, bytes32(0), profileId, wallet, assignmentHash
        );
        IStreamPrimarySaleSettlement.PrimarySale memory sale =
            _sale(SETTLEMENT_ERC20_REPLAY, REVENUE_PRIMARY, 1, 0, 1, 2 ether, expectedPolicyHash);
        bytes32 key = settlement.settlementKey(sale);

        PrimarySettlementERC20Mock firstToken = new PrimarySettlementERC20Mock();
        _fundApprovedAsset(firstToken, 2 ether);
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleERC20PrimarySale(sale, address(firstToken));

        PrimarySettlementERC20Mock secondToken = new PrimarySettlementERC20Mock();
        _fundApprovedAsset(secondToken, 2 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.SettlementAlreadyConsumed.selector, key
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleERC20PrimarySale(sale, address(secondToken));

        firstToken.balanceOf(wallet).assertEq(2 ether, "first asset settled");
        secondToken.balanceOf(PAYER).assertEq(2 ether, "second payer untouched");
        secondToken.balanceOf(wallet).assertEq(0, "second wallet untouched");
        settlement.officialSettled(REVENUE_PRIMARY, profileId, wallet, address(secondToken))
            .assertEq(0, "second asset not official");
        settlement.totalOfficialSettled(address(secondToken)).assertEq(0, "second total untouched");
    }

    function testConsumedSaleRejectsBeforeTemplateMaterializationAcrossAssets() public {
        (bytes32 initialProfile, address initialWallet, bytes32 initialAssignmentHash) =
            _createProfile(ARTIST, 1_000_000, LABEL_ARTIST);
        initialAssignmentHash = resolver.setPrimaryProfileAssignment(
            REVENUE_SPECIAL, resolver.SCOPE_COLLECTION(), 77, initialProfile, POLICY_EVIDENCE
        );
        bytes32 initialPolicyHash = _expectedPolicyHash(
            REVENUE_SPECIAL, 77, 0, bytes32(0), initialProfile, initialWallet, initialAssignmentHash
        );
        IStreamPrimarySaleSettlement.PrimarySale memory initialSale = _sale(
            SETTLEMENT_TEMPLATE_REPLAY_PRECHECK,
            REVENUE_SPECIAL,
            77,
            0,
            1,
            2 ether,
            initialPolicyHash
        );
        bytes32 key = settlement.settlementKey(initialSale);

        vm.deal(SETTLEMENT_CALLER, 6 ether);
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleNativePrimarySale{ value: 2 ether }(initialSale);
        settlement.settlementConsumed(key).assertTrue("setup key consumed");

        IStreamRevenueResolver.PrimaryTemplateEntry[] memory templateEntries =
            new IStreamRevenueResolver.PrimaryTemplateEntry[](2);
        templateEntries[0] = IStreamRevenueResolver.PrimaryTemplateEntry({
            account: address(0),
            accountSource: resolver.ACCOUNT_SOURCE_SALE_POSTER(),
            sharePpm: 700_000,
            labelId: LABEL_ARTIST
        });
        templateEntries[1] = IStreamRevenueResolver.PrimaryTemplateEntry({
            account: PROTOCOL, accountSource: bytes32(0), sharePpm: 300_000, labelId: LABEL_PROTOCOL
        });
        bytes32 templateId = resolver.createPrimaryTemplate(templateEntries, TEMPLATE_METADATA);
        resolver.setPrimaryTemplateAssignment(
            REVENUE_SPECIAL, resolver.SCOPE_COLLECTION(), 77, templateId, POLICY_EVIDENCE
        );
        (bytes32 templateProfile, address templateWallet) =
            _predictedSalePosterTemplateProfile(templateId);
        factory.profileExists(templateProfile).assertFalse("template profile starts missing");
        factory.splitWalletExists(templateProfile).assertFalse("template wallet starts missing");

        IStreamPrimarySaleSettlement.PrimarySale memory staleSale = initialSale;
        staleSale.expectedPolicyHash = initialPolicyHash;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.SettlementAlreadyConsumed.selector, key
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleNativePrimarySale{ value: 2 ether }(staleSale);
        factory.profileExists(templateProfile).assertFalse("native replay did not materialize");
        templateWallet.balance.assertEq(0, "native replay wallet untouched");
        settlement.officialSettled(REVENUE_SPECIAL, templateProfile, templateWallet, address(0))
            .assertEq(0, "native replay not official");

        PrimarySettlementERC20Mock token = new PrimarySettlementERC20Mock();
        _fundApprovedAsset(token, 2 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.SettlementAlreadyConsumed.selector, key
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleERC20PrimarySale(staleSale, address(token));
        factory.profileExists(templateProfile).assertFalse("erc20 replay did not materialize");
        token.balanceOf(PAYER).assertEq(2 ether, "erc20 replay payer untouched");
        token.balanceOf(templateWallet).assertEq(0, "erc20 replay wallet untouched");
        settlement.officialSettled(REVENUE_SPECIAL, templateProfile, templateWallet, address(token))
            .assertEq(0, "erc20 replay not official");
    }

    function testERC20SettlementRejectsUnsupportedAndNonStandardTokens() public {
        (, address wallet, bytes32 assignmentHash) =
            _assignedSingleAccountProfile(REVENUE_PRIMARY, ARTIST);
        bytes32 profileId = _profileIdFor(ARTIST);
        bytes32 expectedPolicyHash = _expectedPolicyHash(
            REVENUE_PRIMARY, 1, 0, bytes32(0), profileId, wallet, assignmentHash
        );
        IStreamPrimarySaleSettlement.PrimarySale memory sale =
            _sale(SETTLEMENT_ERC20_BAD, REVENUE_PRIMARY, 1, 0, 1, 2 ether, expectedPolicyHash);

        PrimarySettlementERC20Mock inactiveToken = new PrimarySettlementERC20Mock();
        inactiveToken.mint(PAYER, 2 ether);
        vm.prank(PAYER);
        inactiveToken.approve(address(settlement), 2 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.AssetNotActive.selector, address(inactiveToken), 0
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleERC20PrimarySale(sale, address(inactiveToken));

        PrimarySettlementERC20Mock deprecatedToken = new PrimarySettlementERC20Mock();
        assetPolicyRegistry.setAssetStatus(
            address(deprecatedToken),
            assetPolicyRegistry.ASSET_STATUS_DEPRECATED(),
            ERC20_POLICY_EVIDENCE
        );
        deprecatedToken.mint(PAYER, 2 ether);
        vm.prank(PAYER);
        deprecatedToken.approve(address(settlement), 2 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.AssetNotActive.selector,
                address(deprecatedToken),
                assetPolicyRegistry.ASSET_STATUS_DEPRECATED()
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleERC20PrimarySale(sale, address(deprecatedToken));

        PrimaryNoReturnERC20Mock noReturn = new PrimaryNoReturnERC20Mock();
        _activateAsset(address(noReturn));
        noReturn.mint(PAYER, 2 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.ERC20TransferFailed.selector,
                address(noReturn),
                PAYER,
                address(settlement),
                2 ether
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleERC20PrimarySale(sale, address(noReturn));

        PrimaryFalseReturnERC20Mock falseReturn = new PrimaryFalseReturnERC20Mock();
        _activateAsset(address(falseReturn));
        falseReturn.mint(PAYER, 2 ether);
        vm.prank(PAYER);
        falseReturn.approve(address(settlement), 2 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.ERC20TransferFailed.selector,
                address(falseReturn),
                PAYER,
                address(settlement),
                2 ether
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleERC20PrimarySale(sale, address(falseReturn));

        PrimaryBalanceRevertingERC20Mock balanceReverting = new PrimaryBalanceRevertingERC20Mock();
        _activateAsset(address(balanceReverting));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.ERC20BalanceReadFailed.selector,
                address(balanceReverting),
                PAYER
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleERC20PrimarySale(sale, address(balanceReverting));

        PrimaryNoOpERC20Mock noOp = new PrimaryNoOpERC20Mock();
        _activateAsset(address(noOp));
        noOp.mint(PAYER, 2 ether);
        vm.prank(PAYER);
        noOp.approve(address(settlement), 2 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.ERC20TransferInvariantBroken.selector,
                address(noOp),
                PAYER,
                address(settlement),
                0,
                2 ether,
                2 ether,
                0
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleERC20PrimarySale(sale, address(noOp));

        PrimaryFeeOnTransferERC20Mock feeToken = new PrimaryFeeOnTransferERC20Mock();
        _activateAsset(address(feeToken));
        feeToken.mint(PAYER, 2 ether);
        vm.prank(PAYER);
        feeToken.approve(address(settlement), 2 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.ERC20TransferInvariantBroken.selector,
                address(feeToken),
                PAYER,
                address(settlement),
                0,
                0,
                2 ether,
                2 ether - 1
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleERC20PrimarySale(sale, address(feeToken));

        wallet.assertEq(factory.walletFor(_profileIdFor(ARTIST)), "sanity wallet");
    }

    function testERC20SecondLegFailuresRollbackPullAndOfficialState() public {
        (bytes32 profileId, address wallet, bytes32 assignmentHash) =
            _assignedSingleAccountProfile(REVENUE_PRIMARY, ARTIST);
        bytes32 expectedPolicyHash = _expectedPolicyHash(
            REVENUE_PRIMARY, 1, 0, bytes32(0), profileId, wallet, assignmentHash
        );
        IStreamPrimarySaleSettlement.PrimarySale memory sale = _sale(
            SETTLEMENT_ERC20_SECOND_LEG, REVENUE_PRIMARY, 1, 0, 1, 2 ether, expectedPolicyHash
        );
        bytes32 key = settlement.settlementKey(sale);

        PrimarySecondTransferFalseERC20Mock falseSecondLeg =
            new PrimarySecondTransferFalseERC20Mock();
        _fundApprovedAsset(falseSecondLeg, 2 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.ERC20TransferFailed.selector,
                address(falseSecondLeg),
                address(settlement),
                wallet,
                2 ether
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleERC20PrimarySale(sale, address(falseSecondLeg));
        _assertERC20Rollback(falseSecondLeg, key, REVENUE_PRIMARY, profileId, wallet, 2 ether);

        PrimarySecondTransferNoOpERC20Mock noOpSecondLeg = new PrimarySecondTransferNoOpERC20Mock();
        _fundApprovedAsset(noOpSecondLeg, 2 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.ERC20TransferInvariantBroken.selector,
                address(noOpSecondLeg),
                address(settlement),
                wallet,
                0,
                2 ether,
                2 ether,
                0
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleERC20PrimarySale(sale, address(noOpSecondLeg));
        _assertERC20Rollback(noOpSecondLeg, key, REVENUE_PRIMARY, profileId, wallet, 2 ether);

        PrimarySecondTransferFeeERC20Mock feeSecondLeg = new PrimarySecondTransferFeeERC20Mock();
        _fundApprovedAsset(feeSecondLeg, 2 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPrimarySaleSettlement.ERC20TransferInvariantBroken.selector,
                address(feeSecondLeg),
                address(settlement),
                wallet,
                0,
                0,
                2 ether,
                2 ether - 1
            )
        );
        vm.prank(SETTLEMENT_CALLER);
        settlement.settleERC20PrimarySale(sale, address(feeSecondLeg));
        _assertERC20Rollback(feeSecondLeg, key, REVENUE_PRIMARY, profileId, wallet, 2 ether);
    }

    function testERC20CallbackCannotReenterOfficialSettlement() public {
        (bytes32 profileId, address wallet, bytes32 assignmentHash) =
            _assignedSingleAccountProfile(REVENUE_PRIMARY, ARTIST);
        bytes32 expectedPolicyHash = _expectedPolicyHash(
            REVENUE_PRIMARY, 1, 0, bytes32(0), profileId, wallet, assignmentHash
        );
        ReentrantPrimaryERC20Mock token = new ReentrantPrimaryERC20Mock();
        _activateAsset(address(token));
        settlement.setSettlementCaller(address(token), true);
        token.mint(PAYER, 4 ether);
        vm.prank(PAYER);
        token.approve(address(settlement), 4 ether);

        IStreamPrimarySaleSettlement.PrimarySale memory outerSale =
            _sale(SETTLEMENT_OUTER_CALLBACK, REVENUE_PRIMARY, 1, 0, 1, 2 ether, expectedPolicyHash);
        IStreamPrimarySaleSettlement.PrimarySale memory innerSale =
            _sale(SETTLEMENT_INNER_CALLBACK, REVENUE_PRIMARY, 1, 0, 2, 2 ether, expectedPolicyHash);
        token.setCallback(settlement, innerSale);

        vm.prank(SETTLEMENT_CALLER);
        settlement.settleERC20PrimarySale(outerSale, address(token));

        token.callbackAttempted().assertTrue("callback attempted");
        token.callbackSucceeded().assertFalse("callback rejected");
        token.balanceOf(wallet).assertEq(2 ether, "only outer sale credited");
        settlement.officialSettled(REVENUE_PRIMARY, profileId, wallet, address(token))
            .assertEq(2 ether, "only outer sale official");
    }

    function _assignedSingleAccountProfile(bytes32 revenueClass, address account)
        private
        returns (bytes32 profileId, address wallet, bytes32 assignmentHash)
    {
        (profileId, wallet,) = _createProfile(account, 1_000_000, LABEL_ARTIST);
        assignmentHash = resolver.setPrimaryProfileAssignment(
            revenueClass, resolver.SCOPE_DEFAULT(), 0, profileId, POLICY_EVIDENCE
        );
    }

    function _createProfile(address account, uint32 sharePpm, bytes32 labelId)
        private
        returns (bytes32 profileId, address wallet, bytes32 entriesHash)
    {
        IStreamSplitWallet.SplitEntry[] memory entries = new IStreamSplitWallet.SplitEntry[](1);
        entries[0] = IStreamSplitWallet.SplitEntry(account, sharePpm, labelId);
        entriesHash = keccak256(abi.encode(entries));
        (profileId, wallet) = factory.createProfile(entries, PROFILE_METADATA);
        factory.splitWalletExists(profileId).assertTrue("verified split wallet");
    }

    function _profileIdFor(address account) private view returns (bytes32) {
        IStreamSplitWallet.SplitEntry[] memory entries = new IStreamSplitWallet.SplitEntry[](1);
        entries[0] = IStreamSplitWallet.SplitEntry(account, 1_000_000, LABEL_ARTIST);
        return factory.profileIdFor(entries, PROFILE_METADATA);
    }

    function _expectedPolicyHash(
        bytes32 revenueClass,
        uint256 collectionId,
        uint256 tokenId,
        bytes32 templateId,
        bytes32 profileId,
        address wallet,
        bytes32 assignmentHash
    ) private view returns (bytes32) {
        return settlement.resolvedPrimaryPolicyHash(
            revenueClass, collectionId, tokenId, templateId, profileId, wallet, assignmentHash
        );
    }

    function _predictedSalePosterTemplateProfile(bytes32 templateId)
        private
        view
        returns (bytes32 profileId, address wallet)
    {
        IStreamSplitWallet.SplitEntry[] memory concreteEntries =
            new IStreamSplitWallet.SplitEntry[](2);
        concreteEntries[0] = IStreamSplitWallet.SplitEntry(PROTOCOL, 300_000, LABEL_PROTOCOL);
        concreteEntries[1] = IStreamSplitWallet.SplitEntry(SALE_POSTER, 700_000, LABEL_ARTIST);
        bytes32 entriesHash = keccak256(abi.encode(concreteEntries));
        bytes32 metadataURIHash = keccak256(
            abi.encode(
                MATERIALIZED_PROFILE_METADATA_DOMAIN,
                uint256(block.chainid),
                address(resolver),
                templateId,
                entriesHash
            )
        );
        profileId = factory.profileIdFor(concreteEntries, metadataURIHash);
        wallet = factory.walletFor(profileId);
    }

    function _sale(
        bytes32 settlementId,
        bytes32 revenueClass,
        uint256 collectionId,
        uint256 tokenId,
        uint256 saleId,
        uint256 amount,
        bytes32 expectedPolicyHash
    ) private view returns (IStreamPrimarySaleSettlement.PrimarySale memory) {
        return IStreamPrimarySaleSettlement.PrimarySale({
            settlementId: settlementId,
            revenueClass: revenueClass,
            policyMode: settlement.POLICY_MODE_STRICT_MATCH(),
            collectionId: collectionId,
            tokenId: tokenId,
            saleId: saleId,
            payer: PAYER,
            poster: SALE_POSTER,
            beneficiary: BENEFICIARY,
            amount: amount,
            expectedPolicyHash: expectedPolicyHash
        });
    }

    function _activateAsset(address token) private {
        assetPolicyRegistry.setAssetStatus(
            token, assetPolicyRegistry.ASSET_STATUS_ACTIVE(), ERC20_POLICY_EVIDENCE
        );
    }

    function _fundApprovedAsset(PrimarySettlementERC20Mock token, uint256 amount) private {
        _activateAsset(address(token));
        token.mint(PAYER, amount);
        vm.prank(PAYER);
        token.approve(address(settlement), amount);
    }

    function _assertERC20Rollback(
        PrimarySettlementERC20Mock token,
        bytes32 key,
        bytes32 revenueClass,
        bytes32 profileId,
        address wallet,
        uint256 amount
    ) private view {
        settlement.settlementConsumed(key).assertFalse("rollback key not consumed");
        token.balanceOf(PAYER).assertEq(amount, "rollback payer restored");
        token.balanceOf(address(settlement)).assertEq(0, "rollback adapter empty");
        token.balanceOf(wallet).assertEq(0, "rollback wallet untouched");
        settlement.officialSettled(revenueClass, profileId, wallet, address(token))
            .assertEq(0, "rollback not official");
        settlement.totalOfficialSettled(address(token)).assertEq(0, "rollback total untouched");
    }

    function _assertSettlementEventDrift(
        bool expectedDrift,
        uint8 expectedAssignmentType,
        bytes32 expectedSettlementId,
        uint8 expectedPolicyMode,
        uint256 expectedSaleId
    ) private {
        Vm.Log[] memory logs = vm.getRecordedLogs();
        bool sawSettlement;
        bool sawContext;
        bool sawPolicy;
        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].emitter == address(settlement) && logs[i].topics.length > 0
                    && logs[i].topics[0] == PRIMARY_REVENUE_SETTLED_TOPIC
            ) {
                _assertSettledLog(logs[i].data, expectedDrift, expectedAssignmentType);
                sawSettlement = true;
            }
            if (
                logs[i].emitter == address(settlement) && logs[i].topics.length > 0
                    && logs[i].topics[0] == PRIMARY_REVENUE_SETTLEMENT_CONTEXT_TOPIC
            ) {
                _assertContextLog(
                    logs[i].data, expectedSettlementId, expectedPolicyMode, expectedSaleId
                );
                sawContext = true;
            }
            if (
                logs[i].emitter == address(settlement) && logs[i].topics.length > 0
                    && logs[i].topics[0] == PRIMARY_REVENUE_SETTLEMENT_POLICY_TOPIC
            ) {
                _assertPolicyLog(logs[i].data);
                sawPolicy = true;
            }
        }
        require(sawSettlement, "settlement event missing");
        require(sawContext, "settlement context event missing");
        require(sawPolicy, "settlement policy event missing");
    }

    function _assertSettledLog(
        bytes memory logData,
        bool expectedDrift,
        uint8 expectedAssignmentType
    ) private pure {
        (
            address wallet,
            address asset,
            address payer,
            uint256 amount,
            bytes32 saleContextHash,
            bool policyDrift,
            uint8 assignmentType
        ) = abi.decode(logData, (address, address, address, uint256, bytes32, bool, uint8));
        require(wallet != address(0), "settlement event wallet");
        asset.assertEq(address(0), "settlement event asset");
        payer.assertEq(PAYER, "settlement event payer");
        amount.assertEq(1 ether, "settlement event amount");
        require(saleContextHash != bytes32(0), "settlement context hash");
        require(policyDrift == expectedDrift, "settlement drift");
        uint256(assignmentType).assertEq(expectedAssignmentType, "assignment type");
    }

    function _assertContextLog(
        bytes memory logData,
        bytes32 expectedSettlementId,
        uint8 expectedPolicyMode,
        uint256 expectedSaleId
    ) private pure {
        (
            address settlementCaller,
            bytes32 settlementId,
            uint8 policyMode,
            uint256 collectionId,
            uint256 tokenId,
            uint256 saleId,
            address poster,
            address beneficiary,
            bytes32 templateId
        ) = abi.decode(
            logData, (address, bytes32, uint8, uint256, uint256, uint256, address, address, bytes32)
        );
        settlementCaller.assertEq(SETTLEMENT_CALLER, "context caller");
        settlementId.assertEq(expectedSettlementId, "context settlement id");
        uint256(policyMode).assertEq(expectedPolicyMode, "context policy mode");
        collectionId.assertEq(1, "context collection");
        tokenId.assertEq(0, "context token");
        saleId.assertEq(expectedSaleId, "context sale id");
        poster.assertEq(SALE_POSTER, "context poster");
        beneficiary.assertEq(BENEFICIARY, "context beneficiary");
        templateId.assertEq(bytes32(0), "context template");
    }

    function _assertPolicyLog(bytes memory logData) private pure {
        (
            bytes32 expectedPolicyHash,
            bytes32 resolvedPolicyHash,
            bytes32 resolvedAssignmentHash,
            bytes32 templateId
        ) = abi.decode(logData, (bytes32, bytes32, bytes32, bytes32));
        require(expectedPolicyHash != bytes32(0), "expected policy hash");
        require(resolvedPolicyHash != bytes32(0), "resolved policy hash");
        require(resolvedAssignmentHash != bytes32(0), "resolved assignment hash");
        templateId.assertEq(bytes32(0), "policy template");
    }

    function _assertTemplateERC20SettlementLogs(
        bytes32 expectedKey,
        bytes32 expectedProfileId,
        address expectedWallet,
        address expectedAsset,
        IStreamPrimarySaleSettlement.PrimarySale memory sale,
        bytes32 expectedAssignmentHash,
        bytes32 expectedTemplateId
    ) private {
        bytes32 expectedResolvedPolicyHash =
            settlement.resolvedPrimaryPolicyHash(
                sale.revenueClass,
                sale.collectionId,
                sale.tokenId,
                expectedTemplateId,
                expectedProfileId,
                expectedWallet,
                expectedAssignmentHash
            );
        require(expectedResolvedPolicyHash != bytes32(0), "resolved policy hash");
        Vm.Log[] memory logs = vm.getRecordedLogs();
        bool sawSettlement;
        bool sawContext;
        bool sawPolicy;
        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].emitter != address(settlement) || logs[i].topics.length == 0
                    || logs[i].topics[0] != PRIMARY_REVENUE_SETTLED_TOPIC
                    && logs[i].topics[0] != PRIMARY_REVENUE_SETTLEMENT_CONTEXT_TOPIC
                    && logs[i].topics[0] != PRIMARY_REVENUE_SETTLEMENT_POLICY_TOPIC
            ) {
                continue;
            }
            _assertIndexedSettlementTopics(
                logs[i], expectedKey, sale.revenueClass, expectedProfileId
            );
            if (logs[i].topics[0] == PRIMARY_REVENUE_SETTLED_TOPIC) {
                _assertTemplateERC20SettledLog(
                    logs[i].data,
                    expectedWallet,
                    expectedAsset,
                    sale,
                    expectedResolvedPolicyHash,
                    true
                );
                sawSettlement = true;
            } else if (logs[i].topics[0] == PRIMARY_REVENUE_SETTLEMENT_CONTEXT_TOPIC) {
                _assertTemplateERC20ContextLog(logs[i].data, sale, expectedTemplateId);
                sawContext = true;
            } else {
                _assertTemplateERC20PolicyLog(
                    logs[i].data,
                    sale.expectedPolicyHash,
                    expectedResolvedPolicyHash,
                    expectedAssignmentHash,
                    expectedTemplateId
                );
                sawPolicy = true;
            }
        }
        require(sawSettlement, "template erc20 settlement event missing");
        require(sawContext, "template erc20 context event missing");
        require(sawPolicy, "template erc20 policy event missing");
    }

    function _assertIndexedSettlementTopics(
        Vm.Log memory log,
        bytes32 expectedKey,
        bytes32 expectedRevenueClass,
        bytes32 expectedProfileId
    ) private pure {
        log.topics.length.assertEq(4, "indexed topic count");
        log.topics[1].assertEq(expectedKey, "indexed key");
        log.topics[2].assertEq(expectedRevenueClass, "indexed revenue class");
        log.topics[3].assertEq(expectedProfileId, "indexed profile");
    }

    function _assertTemplateERC20SettledLog(
        bytes memory logData,
        address expectedWallet,
        address expectedAsset,
        IStreamPrimarySaleSettlement.PrimarySale memory sale,
        bytes32 expectedResolvedPolicyHash,
        bool expectedDrift
    ) private view {
        (
            address wallet,
            address asset,
            address payer,
            uint256 amount,
            bytes32 saleContextHash,
            bool policyDrift,
            uint8 assignmentType
        ) = abi.decode(logData, (address, address, address, uint256, bytes32, bool, uint8));
        wallet.assertEq(expectedWallet, "template settled wallet");
        asset.assertEq(expectedAsset, "template settled asset");
        payer.assertEq(sale.payer, "template settled payer");
        amount.assertEq(sale.amount, "template settled amount");
        require(saleContextHash != bytes32(0), "template sale context hash");
        require(policyDrift == expectedDrift, "template policy drift");
        require(sale.expectedPolicyHash != expectedResolvedPolicyHash, "template drift expected");
        uint256(assignmentType)
            .assertEq(resolver.ASSIGNMENT_TYPE_TEMPLATE(), "template assignment type");
    }

    function _assertTemplateERC20ContextLog(
        bytes memory logData,
        IStreamPrimarySaleSettlement.PrimarySale memory sale,
        bytes32 expectedTemplateId
    ) private pure {
        (
            address settlementCaller,
            bytes32 settlementId,
            uint8 policyMode,
            uint256 collectionId,
            uint256 tokenId,
            uint256 saleId,
            address poster,
            address beneficiary,
            bytes32 templateId
        ) = abi.decode(
            logData, (address, bytes32, uint8, uint256, uint256, uint256, address, address, bytes32)
        );
        settlementCaller.assertEq(SETTLEMENT_CALLER, "template context caller");
        settlementId.assertEq(sale.settlementId, "template context settlement id");
        uint256(policyMode).assertEq(sale.policyMode, "template context policy mode");
        collectionId.assertEq(sale.collectionId, "template context collection");
        tokenId.assertEq(sale.tokenId, "template context token");
        saleId.assertEq(sale.saleId, "template context sale");
        poster.assertEq(sale.poster, "template context poster");
        beneficiary.assertEq(sale.beneficiary, "template context beneficiary");
        templateId.assertEq(expectedTemplateId, "template context template");
    }

    function _assertTemplateERC20PolicyLog(
        bytes memory logData,
        bytes32 expectedPolicyHash,
        bytes32 expectedResolvedPolicyHash,
        bytes32 expectedAssignmentHash,
        bytes32 expectedTemplateId
    ) private pure {
        (
            bytes32 recordedExpectedPolicyHash,
            bytes32 recordedResolvedPolicyHash,
            bytes32 resolvedAssignmentHash,
            bytes32 templateId
        ) = abi.decode(logData, (bytes32, bytes32, bytes32, bytes32));
        recordedExpectedPolicyHash.assertEq(expectedPolicyHash, "template expected policy");
        recordedResolvedPolicyHash.assertEq(expectedResolvedPolicyHash, "template resolved policy");
        resolvedAssignmentHash.assertEq(expectedAssignmentHash, "template assignment hash");
        templateId.assertEq(expectedTemplateId, "template policy template");
    }
}

contract PrimarySettlementERC20Mock {
    mapping(address => uint256) internal balances;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address account, uint256 amount) external {
        balances[account] += amount;
    }

    function balanceOf(address account) external view virtual returns (uint256) {
        return balances[account];
    }

    function approve(address spender, uint256 amount) external virtual returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address recipient, uint256 amount) external virtual returns (bool) {
        _move(msg.sender, recipient, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount)
        external
        virtual
        returns (bool)
    {
        _spendAllowance(sender, msg.sender, amount);
        _move(sender, recipient, amount);
        return true;
    }

    function _spendAllowance(address owner, address spender, uint256 amount) internal virtual {
        uint256 currentAllowance = allowance[owner][spender];
        require(currentAllowance >= amount, "allowance");
        allowance[owner][spender] = currentAllowance - amount;
    }

    function _move(address sender, address recipient, uint256 amount) internal virtual {
        require(balances[sender] >= amount, "balance");
        balances[sender] -= amount;
        balances[recipient] += amount;
    }
}

contract PrimaryFalseReturnERC20Mock is PrimarySettlementERC20Mock {
    function transferFrom(address, address, uint256) external pure override returns (bool) {
        return false;
    }
}

contract PrimaryBalanceRevertingERC20Mock is PrimarySettlementERC20Mock {
    function balanceOf(address) external pure override returns (uint256) {
        revert("balance unavailable");
    }
}

contract PrimaryNoOpERC20Mock is PrimarySettlementERC20Mock {
    function transferFrom(address sender, address, uint256 amount)
        external
        override
        returns (bool)
    {
        _spendAllowance(sender, msg.sender, amount);
        return true;
    }
}

contract PrimaryFeeOnTransferERC20Mock is PrimarySettlementERC20Mock {
    function _move(address sender, address recipient, uint256 amount) internal override {
        require(amount > 1, "fee amount");
        require(balances[sender] >= amount, "balance");
        balances[sender] -= amount;
        balances[recipient] += amount - 1;
    }
}

contract PrimarySecondTransferFalseERC20Mock is PrimarySettlementERC20Mock {
    function transfer(address, uint256) external pure override returns (bool) {
        return false;
    }
}

contract PrimarySecondTransferNoOpERC20Mock is PrimarySettlementERC20Mock {
    function transfer(address, uint256) external pure override returns (bool) {
        return true;
    }
}

contract PrimarySecondTransferFeeERC20Mock is PrimarySettlementERC20Mock {
    function transfer(address recipient, uint256 amount) external override returns (bool) {
        require(amount > 1, "fee amount");
        require(balances[msg.sender] >= amount, "balance");
        balances[msg.sender] -= amount;
        balances[recipient] += amount - 1;
        return true;
    }
}

contract PrimaryNoReturnERC20Mock {
    mapping(address => uint256) internal balances;

    function mint(address account, uint256 amount) external {
        balances[account] += amount;
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    function transfer(address recipient, uint256 amount) external {
        _move(msg.sender, recipient, amount);
    }

    function transferFrom(address sender, address recipient, uint256 amount) external {
        _move(sender, recipient, amount);
    }

    function _move(address sender, address recipient, uint256 amount) private {
        require(balances[sender] >= amount, "balance");
        balances[sender] -= amount;
        balances[recipient] += amount;
    }
}

contract ReentrantPrimaryERC20Mock is PrimarySettlementERC20Mock {
    StreamPrimarySaleSettlement private settlement;
    IStreamPrimarySaleSettlement.PrimarySale private callbackSale;
    bool public callbackAttempted;
    bool public callbackSucceeded;

    function setCallback(
        StreamPrimarySaleSettlement settlement_,
        IStreamPrimarySaleSettlement.PrimarySale calldata sale_
    ) external {
        settlement = settlement_;
        callbackSale = sale_;
    }

    function transferFrom(address sender, address recipient, uint256 amount)
        external
        override
        returns (bool)
    {
        _spendAllowance(sender, msg.sender, amount);
        _move(sender, recipient, amount);
        if (!callbackAttempted) {
            callbackAttempted = true;
            try settlement.settleERC20PrimarySale(callbackSale, address(this)) {
                callbackSucceeded = true;
            } catch { }
        }
        return true;
    }
}
