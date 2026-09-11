// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/RandomizerRNG.sol";
import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/StreamDrops.sol";
import "../smart-contracts/StreamPauseDomains.sol";
import "../smart-contracts/StreamRandomizerLifecycle.sol";
import "./helpers/Assertions.sol";
import "./helpers/DropAuthTestHelper.sol";
import "./helpers/StreamFixture.sol";

contract StreamFixedPriceRandomizerCompositionTest is DropAuthTestHelper, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for string;
    using Assertions for uint256;

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant PRICE = 4 ether;
    address private constant POSTER = address(0x1001);
    address private constant RECIPIENT = address(0x5005);
    address private constant PAYOUT = address(0x2001);
    address private constant CURATORS_POOL = address(0x3001);
    address private constant WITHDRAW_RECIPIENT = address(0x6001);
    bytes32 private constant PAUSE_REASON = keccak256("fixed-price-randomizer-composition");
    bytes32 private constant RANDOMNESS_SEED_TYPEHASH = keccak256(
        "6529StreamRandomnessSeed(address provider,uint256 requestId,uint256 collectionId,uint256 tokenId,uint256 randomizerEpoch,bytes32 rawOutputHash)"
    );
    bytes32 private constant METADATA_UPDATE_TOPIC = keccak256("MetadataUpdate(uint256)");
    bytes32 private constant BURNED_TOKEN_RANDOMNESS_RECORDED_TOPIC = keccak256(
        "BurnedTokenRandomnessRecorded(uint256,uint256,uint256,address,uint256,bytes32,bytes32)"
    );
    bytes32 private constant RANDOMNESS_FULFILLED_TOPIC =
        keccak256("RandomnessFulfilled(uint256,uint256,uint256,address,uint256,bytes32,bytes32)");
    bytes4 private constant ERROR_STRING_SELECTOR = bytes4(keccak256("Error(string)"));

    struct CompositionSetup {
        DeployedStream deployed;
        NextGenRandomizerRNG randomizer;
        FixedPriceArrngController controller;
    }

    struct FixedPriceSnapshot {
        address owner;
        uint256 posterCredit;
        uint256 protocolCredit;
        uint256 curatorCredit;
        uint256 totalPosterOwed;
        uint256 totalProtocolOwed;
        uint256 totalCuratorOwed;
        uint256 totalOwed;
        uint256 balance;
        uint256 pendingRequests;
        uint256 randomizerEpoch;
        address collectionRandomizer;
        uint256 tokenRequest;
        bytes32 tokenHash;
    }

    function testPausedRandomnessRequestRejectsPaidFixedPriceDropWithoutConsumingOrCrediting()
        public
    {
        CompositionSetup memory setup = _deployComposition();
        uint256 nextTokenId = setup.deployed.core.lastAllocatedTokenId() + 1;
        uint256 supplyBefore = setup.deployed.core.totalSupply();
        uint256 circulationBefore = setup.deployed.core.viewCirSupply(COLLECTION_ID);
        uint256 dropCountBefore = setup.deployed.drops.retrieveDrops().length;
        (StreamDrops.DropAuthorization memory authorization, bytes memory signature) =
            _buildSignedFixedPriceAuthorization(setup, "paused-fixed-price-arrng", 1);
        vm.deal(address(this), 20 ether);

        _setPaused(setup, StreamPauseDomains.RANDOMNESS_REQUEST, true);
        (bool success, bytes memory returnData) =
            _callMintDropWithValue(setup, authorization, "paused-fixed-price-arrng", signature);
        _assertRevertedWithMessage(success, returnData, "Randomness paused");

        setup.deployed.drops.isDropConsumed(authorization.dropId)
            .assertFalse("paused request consumed drop");
        setup.deployed.drops.retrieveTokenID(authorization.dropId).assertEq(0, "paused token id");
        setup.deployed.core.totalSupply().assertEq(supplyBefore, "paused supply");
        setup.deployed.core.viewCirSupply(COLLECTION_ID)
            .assertEq(circulationBefore, "paused circulation");
        setup.deployed.drops.retrieveDrops().length.assertEq(dropCountBefore, "paused drop count");
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "paused pending");
        _assertNoFixedPriceAccounting(setup, "paused rollback");

        _setPaused(setup, StreamPauseDomains.RANDOMNESS_REQUEST, false);
        setup.deployed.drops.mintDrop{ value: PRICE }(
            authorization, "paused-fixed-price-arrng", signature
        );
        _assertSuccessfulFixedPriceMint(setup, authorization, nextTokenId, "retried");
    }

    function testPostExecutionSignerLifecycleDoesNotDisturbCreditsOrPendingRequest() public {
        CompositionSetup memory setup = _deployComposition();
        (
            StreamDrops.DropAuthorization memory authorization,
            bytes memory signature,
            uint256 tokenId
        ) = _mintFixedPriceDropWithSignature(setup, "post-execution-fixed-price", 11);
        FixedPriceSnapshot memory beforeControls = _snapshot(setup, tokenId);
        uint256 signerEpochBefore = setup.deployed.drops.signerEpoch();
        vm.deal(address(this), 20 ether);

        setup.deployed.drops.incrementSignerEpoch();
        setup.deployed.drops.signerEpoch().assertEq(signerEpochBefore + 1, "signer epoch");
        (bool replaySuccess, bytes memory replayReturnData) =
            _callMintDropWithValue(setup, authorization, "post-execution-fixed-price", signature);
        _assertRevertedWithMessage(replaySuccess, replayReturnData, "Bad epoch");
        _assertSnapshot(setup, tokenId, beforeControls, "epoch replay");

        setup.deployed.drops.updateTDHsigner(otherSignerAddress());
        (bool rotationReplaySuccess, bytes memory rotationReplayReturnData) =
            _callMintDropWithValue(setup, authorization, "post-execution-fixed-price", signature);
        _assertRevertedWithMessage(rotationReplaySuccess, rotationReplayReturnData, "Wrong signer");
        _assertSnapshot(setup, tokenId, beforeControls, "rotation replay");

        (bool cancelSuccess, bytes memory cancelReturnData) =
            _callCancelDrop(setup, authorization.dropId);
        _assertRevertedWithMessage(cancelSuccess, cancelReturnData, "Drop consumed");
        _assertSnapshot(setup, tokenId, beforeControls, "consumed cancel");
        setup.deployed.drops.isDropConsumed(authorization.dropId).assertTrue("consumed drop");
        setup.deployed.drops.isDropCancelled(authorization.dropId)
            .assertFalse("cancelled consumed drop");

        _fulfillRandomnessAndAssertBinding(
            setup, tokenId, setup.randomizer.tokenToRequest(tokenId), 1234
        );
        _assertFixedPriceAccountingSnapshot(setup, beforeControls, "post-fulfillment credits");
    }

    function testFixedPriceCreditWithdrawalsBeforeFulfillmentPreserveRequestBinding() public {
        CompositionSetup memory setup = _deployComposition();
        (,, uint256 tokenId) =
            _mintFixedPriceDropWithSignature(setup, "withdraw-before-fulfillment", 21);
        uint256 requestId = setup.randomizer.tokenToRequest(tokenId);
        uint256 recipientBalanceBefore = WITHDRAW_RECIPIENT.balance;

        vm.prank(POSTER);
        setup.deployed.drops.withdrawFixedPriceCreditTo(payable(WITHDRAW_RECIPIENT));
        vm.prank(PAYOUT);
        setup.deployed.drops.withdrawFixedPriceCreditTo(payable(WITHDRAW_RECIPIENT));

        WITHDRAW_RECIPIENT.balance.assertEq(recipientBalanceBefore + 3 ether, "withdraw recipient");
        setup.deployed.drops.fixedPricePosterCredits(POSTER).assertEq(0, "poster credit");
        setup.deployed.drops.fixedPriceProtocolCredits(PAYOUT).assertEq(0, "protocol credit");
        setup.deployed.drops.fixedPriceCuratorReserveCredits(CURATORS_POOL)
            .assertEq(1 ether, "curator reserve credit");
        setup.deployed.drops.totalFixedPricePosterOwed().assertEq(0, "poster owed");
        setup.deployed.drops.totalFixedPriceProtocolOwed().assertEq(0, "protocol owed");
        setup.deployed.drops.totalFixedPriceCuratorReserveOwed().assertEq(1 ether, "curator owed");
        setup.deployed.drops.totalOwed().assertEq(1 ether, "remaining owed");
        address(setup.deployed.drops).balance.assertEq(1 ether, "remaining balance");
        setup.randomizer.tokenToRequest(tokenId).assertEq(requestId, "request binding");
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID)
            .assertEq(1, "pending before fulfillment");

        FixedPriceSnapshot memory beforeFulfillment = _snapshot(setup, tokenId);
        _fulfillRandomnessAndAssertBinding(setup, tokenId, requestId, 5678);
        _assertFixedPriceAccountingSnapshot(setup, beforeFulfillment, "withdraw fulfillment");
    }

    function testDuplicateArrngRequestIdRejectsPaidFixedPriceDropWithoutConsumingOrCrediting()
        public
    {
        CompositionSetup memory setup = _deployComposition();
        (,, uint256 firstTokenId) =
            _mintFixedPriceDropWithSignature(setup, "request-id-collision-first", 31);
        uint256 requestId = setup.randomizer.tokenToRequest(firstTokenId);
        FixedPriceSnapshot memory beforeCollision = _snapshot(setup, firstTokenId);
        uint256 nextTokenId = setup.deployed.core.lastAllocatedTokenId() + 1;
        uint256 supplyBefore = setup.deployed.core.totalSupply();
        uint256 circulationBefore = setup.deployed.core.viewCirSupply(COLLECTION_ID);
        uint256 dropCountBefore = setup.deployed.drops.retrieveDrops().length;
        uint256 nextRequestIdBefore = setup.controller.nextRequestId();
        (StreamDrops.DropAuthorization memory authorization, bytes memory signature) =
            _buildSignedFixedPriceAuthorization(setup, "request-id-collision-second", 32);

        setup.controller.forceNextRequestId(requestId);
        vm.deal(address(this), 20 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamRandomizerLifecycle.RandomnessRequestAlreadyExists.selector, requestId
            )
        );
        setup.deployed.drops.mintDrop{ value: PRICE }(
            authorization, "request-id-collision-second", signature
        );

        setup.deployed.drops.isDropConsumed(authorization.dropId)
            .assertFalse("collision consumed drop");
        setup.deployed.drops.retrieveTokenID(authorization.dropId).assertEq(0, "collision token id");
        setup.deployed.core.totalSupply().assertEq(supplyBefore, "collision supply");
        setup.deployed.core.viewCirSupply(COLLECTION_ID)
            .assertEq(circulationBefore, "collision circulation");
        setup.deployed.drops.retrieveDrops().length.assertEq(dropCountBefore, "collision drop");
        setup.randomizer.tokenToRequest(nextTokenId).assertEq(0, "collision token request");
        setup.deployed.core.retrieveTokenHash(nextTokenId).assertEq(bytes32(0), "collision hash");
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID)
            .assertEq(beforeCollision.pendingRequests, "collision pending");
        setup.controller.lastRequestId().assertEq(requestId, "collision last request");
        setup.controller.nextRequestId().assertEq(nextRequestIdBefore, "collision next request");
        _assertSnapshot(setup, firstTokenId, beforeCollision, "collision first token");

        _fulfillRandomnessAndAssertBinding(setup, firstTokenId, requestId, 9012);
        _assertFixedPriceAccountingSnapshot(setup, beforeCollision, "collision fulfillment");
    }

    function testBurnedPaidFixedPricePendingArrngFulfillmentPreservesCreditsAndFreeze() public {
        CompositionSetup memory setup = _deployComposition();
        (,, uint256 tokenId) =
            _mintFixedPriceDropWithSignature(setup, "burned-fixed-price-pending-arrng", 41);
        uint256 requestId = setup.randomizer.tokenToRequest(tokenId);
        FixedPriceSnapshot memory beforeBurn = _snapshot(setup, tokenId);

        vm.prank(RECIPIENT);
        setup.deployed.core.burn(tokenId);

        setup.deployed.core.isTokenBurned(tokenId).assertTrue("burned token");
        setup.randomizer.tokenToRequest(tokenId).assertEq(requestId, "burn request binding");
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(1, "burn pending");
        _assertFixedPriceAccountingSnapshot(setup, beforeBurn, "burn credits");
        _assertBurnedAudit(setup, tokenId, RECIPIENT, beforeBurn.tokenHash, bytes32(0), false);

        _warpPastFinalSupplyWindow();
        bytes32 expectedManifest =
            setup.deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID);
        setup.deployed.core.freezeCollection(COLLECTION_ID);
        setup.deployed.core.collectionFreezeStatus(COLLECTION_ID).assertTrue("frozen");
        setup.deployed.core.collectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "stored manifest");

        vm.recordLogs();
        bytes32 fulfilledSeed = _fulfillRandomnessAndAssertBinding(setup, tokenId, requestId, 1122);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        _countTopic(logs, METADATA_UPDATE_TOPIC).assertEq(0, "burn fulfillment metadata update");
        _countTopic(logs, BURNED_TOKEN_RANDOMNESS_RECORDED_TOPIC)
            .assertEq(1, "burn fulfillment audit event");
        _countTopic(logs, RANDOMNESS_FULFILLED_TOPIC).assertEq(1, "fulfillment event");
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "pending cleared");
        _assertBurnedAudit(setup, tokenId, RECIPIENT, fulfilledSeed, fulfilledSeed, true);
        _assertFixedPriceAccountingSnapshot(setup, beforeBurn, "post-burn fulfillment credits");
        setup.deployed.core.collectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "stored manifest changed");
        setup.deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "preview manifest changed");
    }

    function testFreezeRejectsLivePendingFixedPriceButAllowsBurnedPendingArrngTokens() public {
        CompositionSetup memory setup = _deployComposition();
        (,, uint256 burnedTokenId) =
            _mintFixedPriceDropWithSignature(setup, "burned-pending-freeze-fixed-price", 51);
        (StreamDrops.DropAuthorization memory liveAuthorization, bytes memory liveSignature) =
            _buildSignedFixedPriceAuthorization(setup, "live-pending-freeze-fixed-price", 52);
        vm.deal(address(this), 20 ether);
        setup.deployed.drops.mintDrop{ value: PRICE }(
            liveAuthorization, "live-pending-freeze-fixed-price", liveSignature
        );
        uint256 liveTokenId = setup.deployed.drops.retrieveTokenID(liveAuthorization.dropId);
        setup.deployed.core.ownerOf(liveTokenId).assertEq(RECIPIENT, "live owner");
        setup.deployed.drops.isDropConsumed(liveAuthorization.dropId).assertTrue("live consumed");
        setup.randomizer.tokenToRequest(liveTokenId)
            .assertEq(setup.controller.lastRequestId(), "live request");
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(2, "two pending");

        vm.prank(RECIPIENT);
        setup.deployed.core.burn(burnedTokenId);
        _warpPastFinalSupplyWindow();

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.CollectionHasPendingTokenMetadata.selector, COLLECTION_ID, 1
            )
        );
        setup.deployed.core.freezeCollection(COLLECTION_ID);

        vm.prank(RECIPIENT);
        setup.deployed.core.burn(liveTokenId);
        // Freeze eligibility is based on live-token metadata state; the
        // randomizer lifecycle counter still tracks fulfillable burned requests.
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID)
            .assertEq(2, "lifecycle pending survives burn");

        bytes32 expectedManifest =
            setup.deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID);
        setup.deployed.core.freezeCollection(COLLECTION_ID);
        setup.deployed.core.collectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "frozen burned manifest");

        _fulfillRandomnessAndAssertBinding(
            setup, burnedTokenId, setup.randomizer.tokenToRequest(burnedTokenId), 3344
        );
        _fulfillRandomnessAndAssertBinding(
            setup, liveTokenId, setup.randomizer.tokenToRequest(liveTokenId), 5566
        );

        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID)
            .assertEq(0, "burned fulfill pending cleared");
        setup.deployed.core.collectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "manifest changed after burned fulfillments");
        setup.deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID)
            .assertEq(expectedManifest, "preview changed after burned fulfillments");
    }

    function _deployComposition() private returns (CompositionSetup memory setup) {
        setup.deployed = deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        setup.controller = new FixedPriceArrngController();
        setup.randomizer = new NextGenRandomizerRNG(
            address(setup.deployed.core), address(setup.deployed.admins), address(setup.controller)
        );
        setup.deployed.core.addRandomizer(COLLECTION_ID, address(setup.randomizer));
    }

    function _mintFixedPriceDropWithSignature(
        CompositionSetup memory setup,
        string memory tokenData,
        uint256 nonce
    )
        private
        returns (
            StreamDrops.DropAuthorization memory authorization,
            bytes memory signature,
            uint256 tokenId
        )
    {
        (authorization, signature) = _buildSignedFixedPriceAuthorization(setup, tokenData, nonce);
        vm.deal(address(this), 20 ether);
        setup.deployed.drops.mintDrop{ value: PRICE }(authorization, tokenData, signature);
        tokenId = setup.deployed.drops.retrieveTokenID(authorization.dropId);
        _assertSuccessfulFixedPriceMint(setup, authorization, tokenId, "minted");
    }

    function _buildSignedFixedPriceAuthorization(
        CompositionSetup memory setup,
        string memory tokenData,
        uint256 nonce
    ) private returns (StreamDrops.DropAuthorization memory authorization, bytes memory) {
        authorization = buildFixedPriceAuthorization(
            setup.deployed.drops,
            POSTER,
            RECIPIENT,
            address(this),
            tokenData,
            COLLECTION_ID,
            PRICE,
            nonce,
            nonce + 1_000,
            block.timestamp + 2 days
        );
        return (authorization, signAuthorization(setup.deployed.drops, authorization));
    }

    function _assertSuccessfulFixedPriceMint(
        CompositionSetup memory setup,
        StreamDrops.DropAuthorization memory authorization,
        uint256 tokenId,
        string memory label
    ) private view {
        setup.deployed.core.ownerOf(tokenId).assertEq(RECIPIENT, label);
        setup.deployed.drops.retrieveTokenID(authorization.dropId).assertEq(tokenId, label);
        setup.deployed.drops.isDropConsumed(authorization.dropId).assertTrue(label);
        setup.deployed.drops.fixedPricePosterCredits(POSTER).assertEq(2 ether, label);
        setup.deployed.drops.fixedPriceProtocolCredits(PAYOUT).assertEq(1 ether, label);
        setup.deployed.drops.fixedPriceCuratorReserveCredits(CURATORS_POOL).assertEq(1 ether, label);
        setup.deployed.drops.totalFixedPricePosterOwed().assertEq(2 ether, label);
        setup.deployed.drops.totalFixedPriceProtocolOwed().assertEq(1 ether, label);
        setup.deployed.drops.totalFixedPriceCuratorReserveOwed().assertEq(1 ether, label);
        setup.deployed.drops.totalOwed().assertEq(PRICE, label);
        address(setup.deployed.drops).balance.assertEq(PRICE, label);
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(1, label);
        setup.randomizer.tokenToRequest(tokenId).assertEq(setup.controller.lastRequestId(), label);
        setup.deployed.core.retrieveTokenHash(tokenId).assertEq(bytes32(0), label);
    }

    function _assertNoFixedPriceAccounting(CompositionSetup memory setup, string memory label)
        private
        view
    {
        setup.deployed.drops.fixedPricePosterCredits(POSTER).assertEq(0, label);
        setup.deployed.drops.fixedPriceProtocolCredits(PAYOUT).assertEq(0, label);
        setup.deployed.drops.fixedPriceCuratorReserveCredits(CURATORS_POOL).assertEq(0, label);
        setup.deployed.drops.totalFixedPricePosterOwed().assertEq(0, label);
        setup.deployed.drops.totalFixedPriceProtocolOwed().assertEq(0, label);
        setup.deployed.drops.totalFixedPriceCuratorReserveOwed().assertEq(0, label);
        setup.deployed.drops.totalOwed().assertEq(0, label);
        address(setup.deployed.drops).balance.assertEq(0, label);
    }

    function _setPaused(CompositionSetup memory setup, bytes32 domain, bool paused) private {
        setup.deployed.admins.setPaused(domain, paused, PAUSE_REASON);
        if (paused) {
            setup.deployed.admins.isPaused(domain).assertTrue("paused domain");
        } else {
            setup.deployed.admins.isPaused(domain).assertFalse("unpaused domain");
        }
    }

    function _snapshot(CompositionSetup memory setup, uint256 tokenId)
        private
        view
        returns (FixedPriceSnapshot memory snapshot)
    {
        snapshot = FixedPriceSnapshot({
            owner: setup.deployed.core.ownerOf(tokenId),
            posterCredit: setup.deployed.drops.fixedPricePosterCredits(POSTER),
            protocolCredit: setup.deployed.drops.fixedPriceProtocolCredits(PAYOUT),
            curatorCredit: setup.deployed.drops.fixedPriceCuratorReserveCredits(CURATORS_POOL),
            totalPosterOwed: setup.deployed.drops.totalFixedPricePosterOwed(),
            totalProtocolOwed: setup.deployed.drops.totalFixedPriceProtocolOwed(),
            totalCuratorOwed: setup.deployed.drops.totalFixedPriceCuratorReserveOwed(),
            totalOwed: setup.deployed.drops.totalOwed(),
            balance: address(setup.deployed.drops).balance,
            pendingRequests: setup.randomizer.pendingRandomnessRequests(COLLECTION_ID),
            randomizerEpoch: setup.deployed.core.viewRandomizerEpoch(COLLECTION_ID),
            collectionRandomizer: setup.deployed.core
            .viewCollectionRandomizerContract(COLLECTION_ID),
            tokenRequest: setup.randomizer.tokenToRequest(tokenId),
            tokenHash: setup.deployed.core.retrieveTokenHash(tokenId)
        });
    }

    function _assertSnapshot(
        CompositionSetup memory setup,
        uint256 tokenId,
        FixedPriceSnapshot memory beforeSnapshot,
        string memory label
    ) private view {
        setup.deployed.core.ownerOf(tokenId).assertEq(beforeSnapshot.owner, label);
        _assertFixedPriceAccountingSnapshot(setup, beforeSnapshot, label);
        setup.randomizer.pendingRandomnessRequests(COLLECTION_ID)
            .assertEq(beforeSnapshot.pendingRequests, label);
        setup.deployed.core.viewRandomizerEpoch(COLLECTION_ID)
            .assertEq(beforeSnapshot.randomizerEpoch, label);
        setup.deployed.core.viewCollectionRandomizerContract(COLLECTION_ID)
            .assertEq(beforeSnapshot.collectionRandomizer, label);
        setup.randomizer.tokenToRequest(tokenId).assertEq(beforeSnapshot.tokenRequest, label);
        setup.deployed.core.retrieveTokenHash(tokenId).assertEq(beforeSnapshot.tokenHash, label);
    }

    function _assertFixedPriceAccountingSnapshot(
        CompositionSetup memory setup,
        FixedPriceSnapshot memory snapshot,
        string memory label
    ) private view {
        setup.deployed.drops.fixedPricePosterCredits(POSTER).assertEq(snapshot.posterCredit, label);
        setup.deployed.drops.fixedPriceProtocolCredits(PAYOUT)
            .assertEq(snapshot.protocolCredit, label);
        setup.deployed.drops.fixedPriceCuratorReserveCredits(CURATORS_POOL)
            .assertEq(snapshot.curatorCredit, label);
        setup.deployed.drops.totalFixedPricePosterOwed().assertEq(snapshot.totalPosterOwed, label);
        setup.deployed.drops.totalFixedPriceProtocolOwed()
            .assertEq(snapshot.totalProtocolOwed, label);
        setup.deployed.drops.totalFixedPriceCuratorReserveOwed()
            .assertEq(snapshot.totalCuratorOwed, label);
        setup.deployed.drops.totalOwed().assertEq(snapshot.totalOwed, label);
        address(setup.deployed.drops).balance.assertEq(snapshot.balance, label);
    }

    function _callMintDropWithValue(
        CompositionSetup memory setup,
        StreamDrops.DropAuthorization memory authorization,
        string memory tokenData,
        bytes memory signature
    ) private returns (bool success, bytes memory returnData) {
        (success, returnData) = address(setup.deployed.drops).call{ value: PRICE }(
            abi.encodeWithSelector(
                setup.deployed.drops.mintDrop.selector, authorization, tokenData, signature
            )
        );
    }

    function _callCancelDrop(CompositionSetup memory setup, bytes32 dropId)
        private
        returns (bool success, bytes memory returnData)
    {
        (success, returnData) = address(setup.deployed.drops)
            .call(abi.encodeWithSelector(setup.deployed.drops.cancelDrop.selector, dropId));
    }

    function _fulfillRandomnessAndAssertBinding(
        CompositionSetup memory setup,
        uint256 tokenId,
        uint256 requestId,
        uint256 word
    ) private returns (bytes32 expectedSeed) {
        uint256[] memory words = _words(word);
        uint256 randomizerEpoch = setup.deployed.core.viewRandomizerEpoch(COLLECTION_ID);
        expectedSeed =
            _expectedSeed(address(setup.randomizer), requestId, tokenId, randomizerEpoch, words);
        bytes32 rawOutputHash = keccak256(abi.encode(words));
        setup.controller.fulfill(setup.randomizer, requestId, words);

        setup.deployed.core.retrieveTokenHash(tokenId).assertEq(expectedSeed, "fulfilled hash");
        uint256(setup.randomizer.randomnessRequestState(requestId))
            .assertEq(
                uint256(StreamRandomizerLifecycle.RandomnessRequestState.Fulfilled), "fulfilled"
            );
        StreamRandomizerLifecycle.RandomnessRequest memory request =
            setup.randomizer.retrieveRandomnessRequest(requestId);
        request.collectionId.assertEq(COLLECTION_ID, "request collection");
        request.tokenId.assertEq(tokenId, "request token");
        request.provider.assertEq(address(setup.randomizer), "request provider");
        request.randomizerEpoch.assertEq(randomizerEpoch, "request epoch");
        request.derivedSeed.assertEq(expectedSeed, "request seed");
        request.rawOutputHash.assertEq(rawOutputHash, "request raw hash");
    }

    function _assertBurnedAudit(
        CompositionSetup memory setup,
        uint256 tokenId,
        address owner,
        bytes32 tokenHash,
        bytes32 postBurnRandomnessHash,
        bool postBurnRecorded
    ) private view {
        {
            (
                bool burned,
                uint256 collectionId,
                address auditOwner,
                address operator,
                uint256 burnedBlock,
                uint256 burnedTimestamp,,,,
            ) = setup.deployed.core.burnedTokenAuditState(tokenId);

            burned.assertTrue("audit burned");
            collectionId.assertEq(COLLECTION_ID, "audit collection");
            auditOwner.assertEq(owner, "audit owner");
            operator.assertEq(owner, "audit operator");
            (burnedBlock > 0).assertTrue("audit burn block");
            (burnedTimestamp > 0).assertTrue("audit burn timestamp");
        }
        {
            (
                ,,,,,,
                bytes32 auditTokenHash,
                bytes32 auditPostBurnRandomnessHash,
                uint256 postBurnRandomnessBlock,
                uint256 postBurnRandomnessTimestamp
            ) = setup.deployed.core.burnedTokenAuditState(tokenId);

            auditTokenHash.assertEq(tokenHash, "audit token hash");
            auditPostBurnRandomnessHash.assertEq(postBurnRandomnessHash, "audit post-burn hash");
            if (postBurnRecorded) {
                (postBurnRandomnessBlock > 0).assertTrue("post-burn block");
                (postBurnRandomnessTimestamp > 0).assertTrue("post-burn timestamp");
            } else {
                postBurnRandomnessBlock.assertEq(0, "unexpected post-burn block");
                postBurnRandomnessTimestamp.assertEq(0, "unexpected post-burn timestamp");
            }
        }
    }

    function _warpPastFinalSupplyWindow() private {
        vm.warp(block.timestamp + 31 days + 1);
    }

    function _countTopic(Vm.Log[] memory logs, bytes32 topic) private pure returns (uint256 count) {
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length > 0 && logs[i].topics[0] == topic) {
                count++;
            }
        }
    }

    function _assertRevertedWithMessage(
        bool success,
        bytes memory returnData,
        string memory expectedMessage
    ) private pure {
        success.assertFalse("call unexpectedly succeeded");
        // Pin the current nested Error(string) revert surface. If the production
        // path moves to custom errors, update these low-level assertions.
        require(returnData.length >= 4, "short revert");
        // Casting to bytes4 is safe: an Error(string) payload starts with the selector.
        // forge-lint: disable-next-line(unsafe-typecast)
        bytes4 selector = bytes4(returnData);
        require(selector == ERROR_STRING_SELECTOR, "unexpected revert selector");
        _decodeErrorString(returnData).assertEq(expectedMessage, "unexpected revert");
    }

    function _decodeErrorString(bytes memory returnData) private pure returns (string memory) {
        require(returnData.length >= 4, "short revert");
        bytes memory encodedReason = new bytes(returnData.length - 4);
        for (uint256 i = 0; i < encodedReason.length; i++) {
            encodedReason[i] = returnData[i + 4];
        }
        return abi.decode(encodedReason, (string));
    }

    function _words(uint256 word) private pure returns (uint256[] memory words) {
        words = new uint256[](1);
        words[0] = word;
    }

    function _expectedSeed(
        address provider,
        uint256 requestId,
        uint256 tokenId,
        uint256 randomizerEpoch,
        uint256[] memory words
    ) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                RANDOMNESS_SEED_TYPEHASH,
                provider,
                requestId,
                COLLECTION_ID,
                tokenId,
                randomizerEpoch,
                keccak256(abi.encode(words))
            )
        );
    }
}

contract FixedPriceArrngController {
    uint256 public nextRequestId = 1;
    uint256 public lastRequestId;
    uint256 public forcedRequestId;

    function forceNextRequestId(uint256 requestId) external {
        forcedRequestId = requestId;
    }

    function requestRandomWords(uint256, address) external payable returns (uint256 requestId) {
        requestId = forcedRequestId;
        if (requestId == 0) {
            requestId = nextRequestId;
            nextRequestId++;
        } else {
            forcedRequestId = 0;
        }
        lastRequestId = requestId;
    }

    // Permissionless on purpose: this test double models a cooperative arRNG
    // controller, not production access control.
    function fulfill(NextGenRandomizerRNG randomizer, uint256 requestId, uint256[] memory words)
        external
    {
        randomizer.receiveRandomness(requestId, words);
    }
}
