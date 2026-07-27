// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/RandomizerRNG.sol";
import "../smart-contracts/StreamAdmins.sol";
import "../smart-contracts/StreamRandomizerLifecycle.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./mocks/MockRandomizerCore.sol";

contract StreamRandomizerStatefulInvariantTest is CharacterizationTestBase {
    uint256 private constant SEQUENCE_LENGTH = 32;

    RandomizerStatefulInvariantHandler private handler;

    function setUp() public {
        handler = new RandomizerStatefulInvariantHandler();
    }

    function testRandomizerAdminStatefulInvariantsHoldAcrossBoundedSequences(
        uint256[SEQUENCE_LENGTH] memory actionSeeds,
        uint256[SEQUENCE_LENGTH] memory firstArgs,
        uint256[SEQUENCE_LENGTH] memory secondArgs
    ) public {
        handler.assertRandomizerInvariants();
        for (uint256 i = 0; i < SEQUENCE_LENGTH; i++) {
            handler.runAction(actionSeeds[i], firstArgs[i], secondArgs[i]);
            handler.assertRandomizerInvariants();
        }

        handler.forceCoveragePaths();
        handler.assertRandomizerInvariants();
    }
}

contract RandomizerStatefulInvariantHandler is CharacterizationTestBase {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant BASE_TOKEN_ID = 10_000_000_000;
    uint256 private constant MAX_REQUESTS = 16;
    uint256 private constant MAX_AMOUNT = 3 ether;
    address private constant EMERGENCY_RECIPIENT = address(0xE001);
    address private constant REPLACEMENT_PROVIDER = address(0xCAFE);
    bytes32 private constant PAUSE_REASON = keccak256("stateful-randomizer-drill");

    StreamAdmins private admins;
    MockRandomizerCore private core;
    StatefulRandomizerArrngController private controller;
    NextGenRandomizerRNG private randomizer;

    uint256 private currentEpoch = 1;
    uint256 private currentCost = 0.01 ether;
    uint256 private requestCount;
    uint256[MAX_REQUESTS] private requestIds;
    uint256[MAX_REQUESTS] private tokenIds;
    mapping(uint256 => bool) private requestedToken;

    constructor() {
        admins = new StreamAdmins(address(this));
        admins.updateEmergencyRecipient(EMERGENCY_RECIPIENT);
        core = new MockRandomizerCore();
        controller = new StatefulRandomizerArrngController();
        randomizer = new NextGenRandomizerRNG(address(core), address(admins), address(controller));

        admins.registerFunctionAdmin(
            address(this), address(randomizer), randomizer.updateRNGCost.selector, true
        );
        admins.registerFunctionAdmin(
            address(this), address(randomizer), randomizer.markStaleRequest.selector, true
        );
        admins.registerFunctionAdmin(
            address(this),
            address(randomizer),
            randomizer.retryRandomnessPostProcessing.selector,
            true
        );
        admins.registerFunctionAdmin(
            address(this), address(randomizer), randomizer.emergencyWithdraw.selector, true
        );

        core.setRandomizer(COLLECTION_ID, address(randomizer), currentEpoch);
        randomizer.updateRNGCost(currentCost);
        _fundReserve(1 ether);
    }

    function runAction(uint256 actionSeed, uint256 firstArg, uint256 secondArg) external {
        uint256 action = actionSeed % 14;
        if (action == 0) {
            fundReserve(firstArg);
        } else if (action == 1) {
            forceReserve(firstArg);
        } else if (action == 2) {
            updateCost(firstArg);
        } else if (action == 3) {
            requestRandomness(firstArg);
        } else if (action == 4) {
            fulfill(firstArg, secondArg);
        } else if (action == 5) {
            fulfillWithRejectedCoreWrite(firstArg, secondArg);
        } else if (action == 6) {
            fulfillWithEmptyWords(firstArg);
        } else if (action == 7) {
            markStale(firstArg);
        } else if (action == 8) {
            retry(firstArg, secondArg);
        } else if (action == 9) {
            replaceProvider();
        } else if (action == 10) {
            restoreProvider();
        } else if (action == 11) {
            setRequestPaused(firstArg % 2 == 0);
        } else if (action == 12) {
            changeTokenCollection(firstArg);
        } else {
            emergencyWithdraw();
        }
    }

    function fundReserve(uint256 rawAmount) public {
        uint256 amount = _boundedAmount(rawAmount);
        if (amount == 0) {
            amount = 1 wei;
        }
        _fundReserve(amount);
    }

    function forceReserve(uint256 rawAmount) public {
        uint256 amount = _boundedAmount(rawAmount);
        if (amount == 0) {
            return;
        }
        vm.deal(address(randomizer), address(randomizer).balance + amount);
    }

    function updateCost(uint256 rawCost) public {
        currentCost = rawCost % (0.25 ether + 1);
        randomizer.updateRNGCost(currentCost);
    }

    function requestRandomness(uint256 tokenSeed) public {
        _requestNext(tokenSeed);
    }

    function fulfill(uint256 requestSeed, uint256 wordSeed) public {
        (bool found, uint256 requestId,) = _selectRequest(requestSeed);
        if (!found) {
            return;
        }
        _tryFulfill(requestId, _words(_word(wordSeed)));
    }

    function fulfillWithRejectedCoreWrite(uint256 requestSeed, uint256 wordSeed) public {
        (bool found, uint256 requestId,) = _selectRequest(requestSeed);
        if (!found) {
            return;
        }
        core.setRejectTokenHash(true);
        _tryFulfill(requestId, _words(_word(wordSeed)));
        core.setRejectTokenHash(false);
    }

    function fulfillWithEmptyWords(uint256 requestSeed) public {
        (bool found, uint256 requestId,) = _selectRequest(requestSeed);
        if (!found) {
            return;
        }
        uint256[] memory emptyWords = new uint256[](0);
        _tryFulfill(requestId, emptyWords);
    }

    function markStale(uint256 requestSeed) public {
        (bool found, uint256 requestId,) = _selectRequest(requestSeed);
        if (!found) {
            return;
        }
        try randomizer.markStaleRequest(requestId) { } catch { }
    }

    function retry(uint256 requestSeed, uint256 rejectSeed) public {
        (bool found, uint256 requestId,) = _selectRequest(requestSeed);
        if (!found) {
            return;
        }
        core.setRejectTokenHash(rejectSeed % 2 == 1);
        try randomizer.retryRandomnessPostProcessing(requestId) { } catch { }
        core.setRejectTokenHash(false);
    }

    function replaceProvider() public {
        currentEpoch++;
        core.setRandomizer(COLLECTION_ID, REPLACEMENT_PROVIDER, currentEpoch);
    }

    function restoreProvider() public {
        currentEpoch++;
        core.setRandomizer(COLLECTION_ID, address(randomizer), currentEpoch);
    }

    function setRequestPaused(bool paused) public {
        admins.setPaused(admins.PAUSE_DOMAIN_RANDOMNESS_REQUEST(), paused, PAUSE_REASON);
    }

    function changeTokenCollection(uint256 requestSeed) public {
        (bool found,, uint256 tokenId) = _selectRequest(requestSeed);
        if (!found) {
            return;
        }
        StreamRandomizerLifecycle.RandomnessRequest memory request =
            randomizer.retrieveRandomnessRequestForToken(tokenId);
        if (
            request.state == StreamRandomizerLifecycle.RandomnessRequestState.Pending
                || request.state
                    == StreamRandomizerLifecycle.RandomnessRequestState.FailedPostProcessing
        ) {
            uint256 collectionId = request.collectionId == COLLECTION_ID
                ? COLLECTION_ID + 1
                : COLLECTION_ID;
            core.setTokenCollection(tokenId, collectionId);
        }
    }

    function emergencyWithdraw() public {
        try randomizer.emergencyWithdraw() { } catch { }
    }

    function forceCoveragePaths() external {
        setRequestPaused(false);
        restoreProvider();
        updateCost(0.01 ether);
        _fundReserve(1 ether);
        if (requestCount == 0) {
            (bool initialCreated,) = _requestNext(1000);
            initialCreated.assertTrue("stateful request coverage");
        }

        (bool fulfilledCreated, uint256 fulfilledRequestId) = _requestNext(1001);
        if (fulfilledCreated) {
            _tryFulfill(fulfilledRequestId, _words(111));
        }

        (bool staleCreated, uint256 staleRequestId) = _requestNext(1002);
        if (staleCreated) {
            try randomizer.markStaleRequest(staleRequestId) { } catch { }
        }

        (bool retryCreated, uint256 retryRequestId) = _requestNext(1003);
        if (retryCreated) {
            core.setRejectTokenHash(true);
            _tryFulfill(retryRequestId, _words(333));
            core.setRejectTokenHash(false);
            try randomizer.retryRandomnessPostProcessing(retryRequestId) { } catch { }
        }

        (bool retryFailureCreated, uint256 retryFailureRequestId) = _requestNext(1004);
        if (retryFailureCreated) {
            core.setRejectTokenHash(true);
            _tryFulfill(retryFailureRequestId, _words(444));
            try randomizer.retryRandomnessPostProcessing(retryFailureRequestId) { } catch { }
            core.setRejectTokenHash(false);
        }

        (bool staleProviderCreated, uint256 staleProviderRequestId) = _requestNext(1005);
        if (staleProviderCreated) {
            replaceProvider();
            _tryFulfill(staleProviderRequestId, _words(555));
            try randomizer.markStaleRequest(staleProviderRequestId) { } catch { }
            restoreProvider();
        }

        setRequestPaused(true);
        _requestNext(1006);
        setRequestPaused(false);
    }

    function assertRandomizerInvariants() external view {
        _assertReserveViews();

        uint256 pending;
        for (uint256 i = 0; i < requestCount; i++) {
            uint256 requestId = requestIds[i];
            uint256 tokenId = tokenIds[i];
            StreamRandomizerLifecycle.RandomnessRequest memory request =
                randomizer.retrieveRandomnessRequest(requestId);

            request.collectionId.assertEq(COLLECTION_ID, "request collection");
            request.tokenId.assertEq(tokenId, "request token");
            request.provider.assertEq(address(randomizer), "request provider");
            request.providerRequestId.assertEq(requestId, "provider request");
            randomizer.requestToToken(requestId).assertEq(tokenId, "request token index");
            randomizer.tokenToRequest(tokenId).assertEq(requestId, "token request index");
            // The adapter snapshots token collection at request time; later core
            // drift must not rewrite the recorded request binding.
            randomizer.tokenIdToCollection(tokenId).assertEq(COLLECTION_ID, "token collection");

            if (request.state == StreamRandomizerLifecycle.RandomnessRequestState.Pending) {
                pending++;
                _assertPendingRequest(request);
            } else if (request.state == StreamRandomizerLifecycle.RandomnessRequestState.Fulfilled)
            {
                _assertFulfilledRequest(request);
            } else if (request.state == StreamRandomizerLifecycle.RandomnessRequestState.Stale) {
                _assertStaleRequest(request);
            } else if (
                request.state
                    == StreamRandomizerLifecycle.RandomnessRequestState.FailedPostProcessing
            ) {
                _assertFailedRequest(request);
            } else {
                revert("unexpected request state");
            }
        }

        randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(pending, "pending collection");
        randomizer.totalPendingRandomnessRequests().assertEq(pending, "pending total");
    }

    function _assertReserveViews() private view {
        address(randomizer).balance.assertEq(randomizer.totalRandomnessReserved(), "reserve");
        randomizer.totalOwed().assertEq(randomizer.totalRandomnessReserved(), "owed");
        randomizer.totalReserved().assertEq(randomizer.totalRandomnessReserved(), "reserved");
        randomizer.surplus().assertEq(0, "surplus");
        randomizer.emergencyWithdrawable().assertEq(0, "emergency withdrawable");
    }

    function _assertPendingRequest(StreamRandomizerLifecycle.RandomnessRequest memory request)
        private
        view
    {
        request.derivedSeed.assertEq(bytes32(0), "pending seed");
        request.rawOutputHash.assertEq(bytes32(0), "pending raw output");
        request.failureDataHash.assertEq(bytes32(0), "pending failure hash");
        request.fulfilledBlock.assertEq(0, "pending fulfilled block");
        request.fulfilledTimestamp.assertEq(0, "pending fulfilled timestamp");
        core.retrieveTokenHash(request.tokenId).assertEq(bytes32(0), "pending core hash");
    }

    function _assertFulfilledRequest(StreamRandomizerLifecycle.RandomnessRequest memory request)
        private
        view
    {
        (request.derivedSeed != bytes32(0)).assertTrue("fulfilled seed");
        (request.rawOutputHash != bytes32(0)).assertTrue("fulfilled raw output");
        request.failureDataHash.assertEq(bytes32(0), "fulfilled failure hash");
        (request.fulfilledBlock > 0).assertTrue("fulfilled block");
        (request.fulfilledTimestamp > 0).assertTrue("fulfilled timestamp");
        core.retrieveTokenHash(request.tokenId).assertEq(request.derivedSeed, "fulfilled core hash");
    }

    function _assertStaleRequest(StreamRandomizerLifecycle.RandomnessRequest memory request)
        private
        view
    {
        request.derivedSeed.assertEq(bytes32(0), "stale seed");
        request.rawOutputHash.assertEq(bytes32(0), "stale raw output");
        request.failureDataHash.assertEq(bytes32(0), "stale failure hash");
        request.fulfilledBlock.assertEq(0, "stale fulfilled block");
        request.fulfilledTimestamp.assertEq(0, "stale fulfilled timestamp");
        core.retrieveTokenHash(request.tokenId).assertEq(bytes32(0), "stale core hash");
    }

    function _assertFailedRequest(StreamRandomizerLifecycle.RandomnessRequest memory request)
        private
        view
    {
        (request.derivedSeed != bytes32(0)).assertTrue("failed seed");
        (request.rawOutputHash != bytes32(0)).assertTrue("failed raw output");
        (request.failureDataHash != bytes32(0)).assertTrue("failed failure hash");
        (request.fulfilledBlock > 0).assertTrue("failed block");
        (request.fulfilledTimestamp > 0).assertTrue("failed timestamp");
        (request.postProcessingRetryCount <= randomizer.MAX_RANDOMNESS_POST_PROCESSING_RETRIES())
        .assertTrue("retry count");
        core.retrieveTokenHash(request.tokenId).assertEq(bytes32(0), "failed core hash");
    }

    function _requestNext(uint256 tokenSeed) private returns (bool created, uint256 requestId) {
        if (requestCount >= MAX_REQUESTS || address(randomizer).balance < currentCost) {
            return (false, 0);
        }

        uint256 tokenId = BASE_TOKEN_ID + (tokenSeed % 1_000_000) + (requestCount * 1_000_000);
        if (requestedToken[tokenId]) {
            return (false, 0);
        }
        core.setTokenCollection(tokenId, COLLECTION_ID);

        vm.prank(address(core));
        try randomizer.calculateTokenHash(COLLECTION_ID, tokenId, 123) {
            requestId = randomizer.tokenToRequest(tokenId);
            requestIds[requestCount] = requestId;
            tokenIds[requestCount] = tokenId;
            requestedToken[tokenId] = true;
            requestCount++;
            created = true;
        } catch { }
    }

    function _tryFulfill(uint256 requestId, uint256[] memory words) private {
        try controller.fulfill(randomizer, requestId, words) { } catch { }
    }

    function _selectRequest(uint256 requestSeed)
        private
        view
        returns (bool found, uint256 requestId, uint256 tokenId)
    {
        if (requestCount == 0) {
            return (false, 0, 0);
        }
        uint256 index = requestSeed % requestCount;
        return (true, requestIds[index], tokenIds[index]);
    }

    function _fundReserve(uint256 amount) private {
        vm.deal(address(this), address(this).balance + amount);
        // The handler intentionally funds the adapter under test; reserve safety
        // is asserted after each generated action, not in the harness transfer.
        // slither-disable-next-line arbitrary-send-eth
        (bool success,) = address(randomizer).call{ value: amount }("");
        success.assertTrue("funding failed");
    }

    function _boundedAmount(uint256 rawAmount) private pure returns (uint256) {
        return rawAmount % (MAX_AMOUNT + 1);
    }

    function _word(uint256 wordSeed) private pure returns (uint256) {
        if (wordSeed == type(uint256).max) {
            return 1;
        }
        uint256 word = wordSeed + 1;
        if (word == 0) {
            return 1;
        }
        return word;
    }

    function _words(uint256 value) private pure returns (uint256[] memory words) {
        words = new uint256[](1);
        words[0] = value;
    }
}

contract StatefulRandomizerArrngController {
    uint256 public nextRequestId = 1;
    uint256 public totalValue;
    mapping(uint256 => uint256) public requestValue;

    function requestRandomWords(uint256, address) external payable returns (uint256 requestId) {
        requestId = nextRequestId;
        nextRequestId++;
        requestValue[requestId] = msg.value;
        totalValue += msg.value;
    }

    function fulfill(NextGenRandomizerRNG randomizer, uint256 requestId, uint256[] memory words)
        external
    {
        randomizer.receiveRandomness(requestId, words);
    }
}
