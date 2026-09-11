// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/RandomizerRNG.sol";
import "../smart-contracts/RandomizerVRF.sol";
import "../smart-contracts/StreamAdmins.sol";
import "../smart-contracts/StreamRandomizerLifecycle.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./mocks/MockRandomizerCore.sol";

contract StreamRandomizerAdversarialTest is CharacterizationTestBase {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant TOKEN_ID = 1;
    bytes32 private constant RANDOMNESS_SEED_TYPEHASH = keccak256(
        "6529StreamRandomnessSeed(address provider,uint256 requestId,uint256 collectionId,uint256 tokenId,uint256 randomizerEpoch,bytes32 rawOutputHash)"
    );

    function testVrfDuplicateCallbackReentryDuringCoreWriteFailsClosedAndOuterFulfillmentWins()
        public
    {
        (
            AdversarialRandomizerCore core,
            AdversarialVrfCoordinator coordinator,
            NextGenRandomizerVRF vrf,
        ) = _deployVrfAdversaryWithAdmins();
        uint256[] memory outerWords = _words(777);
        uint256[] memory reentrantWords = _words(999);

        vm.prank(address(core));
        vrf.calculateTokenHash(COLLECTION_ID, TOKEN_ID, 123);
        core.configureVrfReentry(coordinator, vrf, 1, reentrantWords);

        coordinator.fulfill(vrf, 1, outerWords);

        bytes32 expectedSeed = _expectedSeed(address(vrf), 1, 1, outerWords);
        core.retrieveTokenHash(TOKEN_ID).assertEq(expectedSeed, "outer seed not stored");
        core.reentrySucceeded().assertFalse("duplicate callback reentry succeeded");
        _assertSelector(
            core.lastReentrySelector(),
            StreamRandomizerLifecycle.RandomnessRequestNotPending.selector
        );

        StreamRandomizerLifecycle.RandomnessRequest memory request =
            vrf.retrieveRandomnessRequest(1);
        uint256(request.state)
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.Fulfilled), "state");
        request.derivedSeed.assertEq(expectedSeed, "stored seed");
        request.rawOutputHash.assertEq(_rawOutputHash(outerWords), "raw output");
        vrf.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "pending collection");
        vrf.totalPendingRandomnessRequests().assertEq(0, "pending total");
    }

    function testArrngDuplicateCallbackReentryDuringCoreWriteFailsClosedAndOuterFulfillmentWins()
        public
    {
        (
            AdversarialRandomizerCore core,
            AdversarialArrngController controller,
            NextGenRandomizerRNG rng,
        ) = _deployArrngAdversaryWithAdmins();
        uint256[] memory outerWords = _words(888);
        uint256[] memory reentrantWords = _words(444);

        vm.prank(address(core));
        rng.calculateTokenHash(COLLECTION_ID, TOKEN_ID, 123);
        core.configureArrngReentry(controller, rng, 1, reentrantWords);

        controller.fulfill(rng, 1, outerWords);

        bytes32 expectedSeed = _expectedSeed(address(rng), 1, 1, outerWords);
        core.retrieveTokenHash(TOKEN_ID).assertEq(expectedSeed, "outer seed not stored");
        core.reentrySucceeded().assertFalse("duplicate callback reentry succeeded");
        _assertSelector(
            core.lastReentrySelector(),
            StreamRandomizerLifecycle.RandomnessRequestNotPending.selector
        );

        StreamRandomizerLifecycle.RandomnessRequest memory request =
            rng.retrieveRandomnessRequest(1);
        uint256(request.state)
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.Fulfilled), "state");
        request.derivedSeed.assertEq(expectedSeed, "stored seed");
        request.rawOutputHash.assertEq(_rawOutputHash(outerWords), "raw output");
        rng.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "pending collection");
        rng.totalPendingRandomnessRequests().assertEq(0, "pending total");
    }

    function testVrfStaleMarkReentryDuringCoreWriteFailsClosedAndOuterFulfillmentWins() public {
        (
            AdversarialRandomizerCore core,
            AdversarialVrfCoordinator coordinator,
            NextGenRandomizerVRF vrf,
            StreamAdmins admins
        ) = _deployVrfAdversaryWithAdmins();
        uint256[] memory words = _words(31337);

        admins.registerFunctionAdmin(
            address(core), address(vrf), vrf.markStaleRequest.selector, true
        );
        vm.prank(address(core));
        vrf.calculateTokenHash(COLLECTION_ID, TOKEN_ID, 123);
        core.configureVrfStaleReentry(vrf, 1);

        coordinator.fulfill(vrf, 1, words);

        core.reentryAttempted().assertTrue("stale reentry not attempted");
        core.reentrySucceeded().assertFalse("stale reentry succeeded");
        _assertSelector(
            core.lastReentrySelector(),
            StreamRandomizerLifecycle.RandomnessRequestNotPending.selector
        );
        _assertAdversarialFulfilled(core, vrf, 1, 1, words);
    }

    function testArrngStaleMarkReentryDuringCoreWriteFailsClosedAndOuterFulfillmentWins() public {
        (
            AdversarialRandomizerCore core,
            AdversarialArrngController controller,
            NextGenRandomizerRNG rng,
            StreamAdmins admins
        ) = _deployArrngAdversaryWithAdmins();
        uint256[] memory words = _words(424242);

        admins.registerFunctionAdmin(
            address(core), address(rng), rng.markStaleRequest.selector, true
        );
        vm.prank(address(core));
        rng.calculateTokenHash(COLLECTION_ID, TOKEN_ID, 123);
        core.configureArrngStaleReentry(rng, 1);

        controller.fulfill(rng, 1, words);

        core.reentryAttempted().assertTrue("stale reentry not attempted");
        core.reentrySucceeded().assertFalse("stale reentry succeeded");
        _assertSelector(
            core.lastReentrySelector(),
            StreamRandomizerLifecycle.RandomnessRequestNotPending.selector
        );
        _assertAdversarialFulfilled(core, rng, 1, 1, words);
    }

    function testVrfRetryReentryDuringCoreWriteFailsClosedAndOuterRetryWins() public {
        (
            AdversarialRandomizerCore core,
            AdversarialVrfCoordinator coordinator,
            NextGenRandomizerVRF vrf,
            StreamAdmins admins
        ) = _deployVrfAdversaryWithAdmins();
        uint256[] memory words = _words(515151);

        admins.registerFunctionAdmin(
            address(this), address(vrf), vrf.retryRandomnessPostProcessing.selector, true
        );
        admins.registerFunctionAdmin(
            address(core), address(vrf), vrf.retryRandomnessPostProcessing.selector, true
        );
        vm.prank(address(core));
        vrf.calculateTokenHash(COLLECTION_ID, TOKEN_ID, 123);
        core.setRejectTokenHash(true);
        coordinator.fulfill(vrf, 1, words);
        _assertAdversarialFailedPostProcessing(core, vrf, 1, 1, words);

        core.setRejectTokenHash(false);
        core.configureVrfRetryReentry(vrf, 1);
        vrf.retryRandomnessPostProcessing(1);

        core.reentryAttempted().assertTrue("retry reentry not attempted");
        core.reentrySucceeded().assertFalse("retry reentry succeeded");
        _assertSelector(
            core.lastReentrySelector(),
            StreamRandomizerLifecycle.RandomnessRequestNotFailedPostProcessing.selector
        );
        _assertAdversarialFulfilled(core, vrf, 1, 1, words);
        StreamRandomizerLifecycle.RandomnessRequest memory request =
            vrf.retrieveRandomnessRequest(1);
        request.postProcessingRetryCount.assertEq(1, "retry count");
        coordinator.nextRequestId().assertEq(2, "new provider request");
    }

    function testArrngRetryReentryDuringCoreWriteFailsClosedAndOuterRetryWins() public {
        (
            AdversarialRandomizerCore core,
            AdversarialArrngController controller,
            NextGenRandomizerRNG rng,
            StreamAdmins admins
        ) = _deployArrngAdversaryWithAdmins();
        uint256[] memory words = _words(626262);

        admins.registerFunctionAdmin(
            address(this), address(rng), rng.retryRandomnessPostProcessing.selector, true
        );
        admins.registerFunctionAdmin(
            address(core), address(rng), rng.retryRandomnessPostProcessing.selector, true
        );
        vm.prank(address(core));
        rng.calculateTokenHash(COLLECTION_ID, TOKEN_ID, 123);
        core.setRejectTokenHash(true);
        controller.fulfill(rng, 1, words);
        _assertAdversarialFailedPostProcessing(core, rng, 1, 1, words);

        core.setRejectTokenHash(false);
        core.configureArrngRetryReentry(rng, 1);
        rng.retryRandomnessPostProcessing(1);

        core.reentryAttempted().assertTrue("retry reentry not attempted");
        core.reentrySucceeded().assertFalse("retry reentry succeeded");
        _assertSelector(
            core.lastReentrySelector(),
            StreamRandomizerLifecycle.RandomnessRequestNotFailedPostProcessing.selector
        );
        _assertAdversarialFulfilled(core, rng, 1, 1, words);
        StreamRandomizerLifecycle.RandomnessRequest memory request =
            rng.retrieveRandomnessRequest(1);
        request.postProcessingRetryCount.assertEq(1, "retry count");
        controller.nextRequestId().assertEq(2, "new provider request");
    }

    function testVrfStaleProviderFulfillmentPreservesPendingRequestUntilExplicitStaleMark() public {
        (
            MockRandomizerCore core,
            StreamAdmins admins,
            AdversarialVrfCoordinator coordinator,
            NextGenRandomizerVRF vrf
        ) = _deployVrfWithMockCore();
        address replacementProvider = address(0xCAFE);

        vm.prank(address(core));
        vrf.calculateTokenHash(COLLECTION_ID, TOKEN_ID, 123);
        core.setRandomizer(COLLECTION_ID, replacementProvider, 1);

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamRandomizerLifecycle.StaleRandomnessRequest.selector,
                uint256(1),
                uint256(1),
                uint256(1),
                address(vrf),
                replacementProvider
            )
        );
        coordinator.fulfill(vrf, 1, _words(777));

        _assertStillPending(vrf);
        core.retrieveTokenHash(TOKEN_ID).assertEq(bytes32(0), "stale provider wrote hash");

        admins.registerFunctionAdmin(
            address(this), address(vrf), vrf.markStaleRequest.selector, true
        );
        vrf.markStaleRequest(1);
        uint256(vrf.randomnessRequestState(1))
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.Stale), "stale");
        vrf.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "pending collection");
        vrf.totalPendingRandomnessRequests().assertEq(0, "pending total");
    }

    function testArrngStaleProviderFulfillmentPreservesPendingRequestUntilExplicitStaleMark()
        public
    {
        (
            MockRandomizerCore core,
            StreamAdmins admins,
            AdversarialArrngController controller,
            NextGenRandomizerRNG rng
        ) = _deployArrngWithMockCore();
        address replacementProvider = address(0xCAFE);

        vm.prank(address(core));
        rng.calculateTokenHash(COLLECTION_ID, TOKEN_ID, 123);
        core.setRandomizer(COLLECTION_ID, replacementProvider, 1);

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamRandomizerLifecycle.StaleRandomnessRequest.selector,
                uint256(1),
                uint256(1),
                uint256(1),
                address(rng),
                replacementProvider
            )
        );
        controller.fulfill(rng, 1, _words(888));

        _assertStillPending(rng);
        core.retrieveTokenHash(TOKEN_ID).assertEq(bytes32(0), "stale provider wrote hash");

        admins.registerFunctionAdmin(
            address(this), address(rng), rng.markStaleRequest.selector, true
        );
        rng.markStaleRequest(1);
        uint256(rng.randomnessRequestState(1))
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.Stale), "stale");
        rng.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "pending collection");
        rng.totalPendingRandomnessRequests().assertEq(0, "pending total");
    }

    function _deployVrfAdversaryWithAdmins()
        private
        returns (
            AdversarialRandomizerCore core,
            AdversarialVrfCoordinator coordinator,
            NextGenRandomizerVRF vrf,
            StreamAdmins admins
        )
    {
        admins = new StreamAdmins(address(this));
        core = new AdversarialRandomizerCore();
        coordinator = new AdversarialVrfCoordinator();
        vrf = new NextGenRandomizerVRF(1, address(coordinator), address(core), address(admins));
        core.setRandomizer(COLLECTION_ID, address(vrf), 1);
        core.setTokenCollection(TOKEN_ID, COLLECTION_ID);
    }

    function _deployArrngAdversaryWithAdmins()
        private
        returns (
            AdversarialRandomizerCore core,
            AdversarialArrngController controller,
            NextGenRandomizerRNG rng,
            StreamAdmins admins
        )
    {
        admins = new StreamAdmins(address(this));
        core = new AdversarialRandomizerCore();
        controller = new AdversarialArrngController();
        rng = new NextGenRandomizerRNG(address(core), address(admins), address(controller));
        core.setRandomizer(COLLECTION_ID, address(rng), 1);
        core.setTokenCollection(TOKEN_ID, COLLECTION_ID);
    }

    function _deployVrfWithMockCore()
        private
        returns (
            MockRandomizerCore core,
            StreamAdmins admins,
            AdversarialVrfCoordinator coordinator,
            NextGenRandomizerVRF vrf
        )
    {
        admins = new StreamAdmins(address(this));
        core = new MockRandomizerCore();
        coordinator = new AdversarialVrfCoordinator();
        vrf = new NextGenRandomizerVRF(1, address(coordinator), address(core), address(admins));
        core.setRandomizer(COLLECTION_ID, address(vrf), 1);
        core.setTokenCollection(TOKEN_ID, COLLECTION_ID);
    }

    function _deployArrngWithMockCore()
        private
        returns (
            MockRandomizerCore core,
            StreamAdmins admins,
            AdversarialArrngController controller,
            NextGenRandomizerRNG rng
        )
    {
        admins = new StreamAdmins(address(this));
        core = new MockRandomizerCore();
        controller = new AdversarialArrngController();
        rng = new NextGenRandomizerRNG(address(core), address(admins), address(controller));
        core.setRandomizer(COLLECTION_ID, address(rng), 1);
        core.setTokenCollection(TOKEN_ID, COLLECTION_ID);
    }

    function _assertStillPending(StreamRandomizerLifecycle randomizer) private view {
        StreamRandomizerLifecycle.RandomnessRequest memory request =
            randomizer.retrieveRandomnessRequest(1);
        uint256(request.state)
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.Pending), "state");
        request.derivedSeed.assertEq(bytes32(0), "seed");
        request.rawOutputHash.assertEq(bytes32(0), "raw output");
        randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(1, "pending collection");
        randomizer.totalPendingRandomnessRequests().assertEq(1, "pending total");
    }

    function _assertAdversarialFulfilled(
        AdversarialRandomizerCore core,
        StreamRandomizerLifecycle randomizer,
        uint256 requestId,
        uint256 randomizerEpoch,
        uint256[] memory words
    ) private view {
        bytes32 expectedSeed = _expectedSeed(address(randomizer), requestId, randomizerEpoch, words);
        StreamRandomizerLifecycle.RandomnessRequest memory request =
            randomizer.retrieveRandomnessRequest(requestId);
        uint256(request.state)
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.Fulfilled), "state");
        request.derivedSeed.assertEq(expectedSeed, "stored seed");
        request.rawOutputHash.assertEq(_rawOutputHash(words), "raw output");
        request.failureDataHash.assertEq(bytes32(0), "failure hash");
        (request.fulfilledBlock > 0).assertTrue("fulfilled block");
        (request.fulfilledTimestamp > 0).assertTrue("fulfilled timestamp");
        core.retrieveTokenHash(TOKEN_ID).assertEq(expectedSeed, "core hash");
        randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "pending collection");
        randomizer.totalPendingRandomnessRequests().assertEq(0, "pending total");
    }

    function _assertAdversarialFailedPostProcessing(
        AdversarialRandomizerCore core,
        StreamRandomizerLifecycle randomizer,
        uint256 requestId,
        uint256 randomizerEpoch,
        uint256[] memory words
    ) private view {
        bytes32 expectedSeed = _expectedSeed(address(randomizer), requestId, randomizerEpoch, words);
        StreamRandomizerLifecycle.RandomnessRequest memory request =
            randomizer.retrieveRandomnessRequest(requestId);
        uint256(request.state)
            .assertEq(
                uint256(StreamRandomizerLifecycle.RandomnessRequestState.FailedPostProcessing),
                "state"
            );
        request.derivedSeed.assertEq(expectedSeed, "failed seed");
        request.rawOutputHash.assertEq(_rawOutputHash(words), "raw output");
        (request.failureDataHash != bytes32(0)).assertTrue("failure hash");
        request.postProcessingRetryCount.assertEq(0, "retry count");
        core.retrieveTokenHash(TOKEN_ID).assertEq(bytes32(0), "core hash");
        randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "pending collection");
        randomizer.totalPendingRandomnessRequests().assertEq(0, "pending total");
    }

    function _assertSelector(bytes4 actual, bytes4 expected) private pure {
        require(actual == expected, "reentry selector");
    }

    function _expectedSeed(
        address provider,
        uint256 requestId,
        uint256 randomizerEpoch,
        uint256[] memory words
    ) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                RANDOMNESS_SEED_TYPEHASH,
                provider,
                requestId,
                COLLECTION_ID,
                TOKEN_ID,
                randomizerEpoch,
                _rawOutputHash(words)
            )
        );
    }

    function _rawOutputHash(uint256[] memory words) private pure returns (bytes32) {
        return keccak256(abi.encode(words));
    }

    function _words(uint256 word) private pure returns (uint256[] memory words) {
        words = new uint256[](1);
        words[0] = word;
    }
}

contract AdversarialRandomizerCore {
    error AdversarialTokenHashRejected();
    error AdversarialUnexpectedReentryMode();

    enum ReentryMode {
        None,
        VrfCallback,
        ArrngCallback,
        VrfMarkStale,
        ArrngMarkStale,
        VrfRetry,
        ArrngRetry
    }

    mapping(uint256 => uint256) private randomizerEpochs;
    mapping(uint256 => address) private randomizerContracts;
    mapping(uint256 => uint256) private tokenCollections;
    mapping(uint256 => bytes32) private tokenHashes;

    ReentryMode private reentryMode;
    AdversarialVrfCoordinator private vrfCoordinator;
    AdversarialArrngController private arrngController;
    NextGenRandomizerVRF private reentrantVrf;
    NextGenRandomizerRNG private reentrantRng;
    uint256 private reentrantRequestId;
    uint256[] private reentrantWords;
    bool private rejectTokenHash;

    bool public reentryAttempted;
    bool public reentrySucceeded;
    bytes4 public lastReentrySelector;

    function setRandomizer(uint256 collectionId, address randomizer, uint256 epoch) external {
        randomizerContracts[collectionId] = randomizer;
        randomizerEpochs[collectionId] = epoch;
    }

    function setTokenCollection(uint256 tokenId, uint256 collectionId) external {
        tokenCollections[tokenId] = collectionId;
    }

    function setRejectTokenHash(bool status) external {
        rejectTokenHash = status;
    }

    function configureVrfReentry(
        AdversarialVrfCoordinator coordinator,
        NextGenRandomizerVRF randomizer,
        uint256 requestId,
        uint256[] memory words
    ) external {
        reentryMode = ReentryMode.VrfCallback;
        vrfCoordinator = coordinator;
        reentrantVrf = randomizer;
        reentrantRequestId = requestId;
        _setReentrantWords(words);
    }

    function configureArrngReentry(
        AdversarialArrngController controller,
        NextGenRandomizerRNG randomizer,
        uint256 requestId,
        uint256[] memory words
    ) external {
        reentryMode = ReentryMode.ArrngCallback;
        arrngController = controller;
        reentrantRng = randomizer;
        reentrantRequestId = requestId;
        _setReentrantWords(words);
    }

    function configureVrfStaleReentry(NextGenRandomizerVRF randomizer, uint256 requestId) external {
        reentryMode = ReentryMode.VrfMarkStale;
        reentrantVrf = randomizer;
        reentrantRequestId = requestId;
    }

    function configureArrngStaleReentry(NextGenRandomizerRNG randomizer, uint256 requestId)
        external
    {
        reentryMode = ReentryMode.ArrngMarkStale;
        reentrantRng = randomizer;
        reentrantRequestId = requestId;
    }

    function configureVrfRetryReentry(NextGenRandomizerVRF randomizer, uint256 requestId) external {
        reentryMode = ReentryMode.VrfRetry;
        reentrantVrf = randomizer;
        reentrantRequestId = requestId;
    }

    function configureArrngRetryReentry(NextGenRandomizerRNG randomizer, uint256 requestId)
        external
    {
        reentryMode = ReentryMode.ArrngRetry;
        reentrantRng = randomizer;
        reentrantRequestId = requestId;
    }

    function setTokenHash(uint256 collectionId, uint256 tokenId, bytes32 tokenHash) external {
        require(msg.sender == randomizerContracts[collectionId], "wrong randomizer");
        if (rejectTokenHash) {
            revert AdversarialTokenHashRejected();
        }
        require(tokenHashes[tokenId] == bytes32(0), "hash already set");
        _attemptReentry();
        tokenHashes[tokenId] = tokenHash;
    }

    function retrieveTokenHash(uint256 tokenId) external view returns (bytes32) {
        return tokenHashes[tokenId];
    }

    function viewColIDforTokenID(uint256 tokenId) external view returns (uint256) {
        return tokenCollections[tokenId];
    }

    function viewCollectionRandomizerContract(uint256 collectionId)
        external
        view
        returns (address)
    {
        return randomizerContracts[collectionId];
    }

    function viewRandomizerEpoch(uint256 collectionId) external view returns (uint256) {
        return randomizerEpochs[collectionId];
    }

    function isTokenBurned(uint256) external pure returns (bool) {
        return false;
    }

    function _attemptReentry() private {
        if (reentryMode == ReentryMode.None || reentryAttempted) {
            return;
        }
        // Intentionally one nested duplicate callback per fulfillment: the
        // adversary isolates fail-closed lifecycle behavior at the core write.
        reentryAttempted = true;
        if (reentryMode == ReentryMode.VrfCallback) {
            try vrfCoordinator.fulfill(reentrantVrf, reentrantRequestId, reentrantWords) {
                reentrySucceeded = true;
            } catch (bytes memory failureData) {
                lastReentrySelector = _selectorOf(failureData);
            }
        } else if (reentryMode == ReentryMode.ArrngCallback) {
            try arrngController.fulfill(reentrantRng, reentrantRequestId, reentrantWords) {
                reentrySucceeded = true;
            } catch (bytes memory failureData) {
                lastReentrySelector = _selectorOf(failureData);
            }
        } else if (reentryMode == ReentryMode.VrfMarkStale) {
            try reentrantVrf.markStaleRequest(reentrantRequestId) {
                reentrySucceeded = true;
            } catch (bytes memory failureData) {
                lastReentrySelector = _selectorOf(failureData);
            }
        } else if (reentryMode == ReentryMode.ArrngMarkStale) {
            try reentrantRng.markStaleRequest(reentrantRequestId) {
                reentrySucceeded = true;
            } catch (bytes memory failureData) {
                lastReentrySelector = _selectorOf(failureData);
            }
        } else if (reentryMode == ReentryMode.VrfRetry) {
            try reentrantVrf.retryRandomnessPostProcessing(reentrantRequestId) {
                reentrySucceeded = true;
            } catch (bytes memory failureData) {
                lastReentrySelector = _selectorOf(failureData);
            }
        } else if (reentryMode == ReentryMode.ArrngRetry) {
            try reentrantRng.retryRandomnessPostProcessing(reentrantRequestId) {
                reentrySucceeded = true;
            } catch (bytes memory failureData) {
                lastReentrySelector = _selectorOf(failureData);
            }
        } else {
            revert AdversarialUnexpectedReentryMode();
        }
    }

    function _setReentrantWords(uint256[] memory words) private {
        delete reentrantWords;
        for (uint256 i = 0; i < words.length; i++) {
            reentrantWords.push(words[i]);
        }
    }

    function _selectorOf(bytes memory failureData) private pure returns (bytes4 selector) {
        require(failureData.length >= 4, "missing selector");
        assembly {
            selector := mload(add(failureData, 32))
        }
    }
}

contract AdversarialVrfCoordinator {
    uint256 public nextRequestId = 1;

    function requestRandomWords(bytes32, uint64, uint16, uint32, uint32)
        external
        returns (uint256 requestId)
    {
        requestId = nextRequestId;
        nextRequestId++;
    }

    function fulfill(NextGenRandomizerVRF randomizer, uint256 requestId, uint256[] memory words)
        external
    {
        randomizer.rawFulfillRandomWords(requestId, words);
    }
}

contract AdversarialArrngController {
    uint256 public nextRequestId = 1;

    function requestRandomWords(uint256, address) external returns (uint256 requestId) {
        requestId = nextRequestId;
        nextRequestId++;
    }

    function fulfill(NextGenRandomizerRNG randomizer, uint256 requestId, uint256[] memory words)
        external
    {
        randomizer.receiveRandomness(requestId, words);
    }
}
