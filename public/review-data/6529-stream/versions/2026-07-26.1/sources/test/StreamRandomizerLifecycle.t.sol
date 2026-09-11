// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IXRandoms.sol";
import "../smart-contracts/IRandomizerLifecycle.sol";
import "../smart-contracts/RandomizerNXT.sol";
import "../smart-contracts/RandomizerRNG.sol";
import "../smart-contracts/RandomizerVRF.sol";
import "../smart-contracts/StreamRandomizerLifecycle.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";
import "./mocks/MockRandomizer.sol";
import "./mocks/MockRandomizerCore.sol";

contract UnsupportedLifecycleRandomizer is IRandomizer {
    function calculateTokenHash(uint256, uint256, uint256) external { }

    function isRandomizerContract() external pure returns (bool) {
        return true;
    }

    function supportsRandomizerLifecycle() external pure returns (bool) {
        return false;
    }

    // Intentionally reverts because lifecycle support is false; a caller that
    // still probes pending requests has a bug, not unfinished test scaffolding.
    function pendingRandomnessRequests(uint256) external pure returns (uint256) {
        revert("unsupported lifecycle pending probe");
    }
}

contract RevertingPendingLifecycleRandomizer is IRandomizer {
    function calculateTokenHash(uint256, uint256, uint256) external { }

    function isRandomizerContract() external pure returns (bool) {
        return true;
    }

    function supportsRandomizerLifecycle() external pure returns (bool) {
        return true;
    }

    function pendingRandomnessRequests(uint256) external pure returns (uint256) {
        revert("pending probe failed");
    }
}

contract StreamRandomizerLifecycleTest is CharacterizationTestBase, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    address private constant PAYOUT = address(0x2002);
    address private constant CURATORS_POOL = address(0x3003);
    uint256 private constant TOKEN_ID = 1;
    uint256 private constant SECOND_TOKEN_ID = TOKEN_ID + 1;
    uint256 private constant COLLECTION_ID = 1;
    bytes32 private constant PAUSE_REASON = keccak256("randomness-incident");
    bytes32 private constant RANDOMNESS_SEED_TYPEHASH = keccak256(
        "6529StreamRandomnessSeed(address provider,uint256 requestId,uint256 collectionId,uint256 tokenId,uint256 randomizerEpoch,bytes32 rawOutputHash)"
    );
    bytes32 private constant COLLECTION_RANDOMIZER_UPDATED_TOPIC =
        keccak256("CollectionRandomizerUpdated(uint256,address,address,uint256)");
    bytes32 private constant RANDOMNESS_FULFILLED_TOPIC =
        keccak256("RandomnessFulfilled(uint256,uint256,uint256,address,uint256,bytes32,bytes32)");
    bytes32 private constant PROVIDER_REQUEST_FULFILLED_TOPIC =
        keccak256("RequestFulfilled(uint256,uint256[])");
    bytes32 private constant RANDOMNESS_POST_PROCESSING_FAILED_TOPIC = keccak256(
        "RandomnessPostProcessingFailed(uint256,uint256,uint256,address,uint256,bytes32,bytes32,bytes32)"
    );

    function testVrfRequestRecordsLifecycleAndFulfillmentSetsHashOnce() public {
        (DeployedStream memory deployed, MockVrfCoordinator coordinator, NextGenRandomizerVRF vrf) =
            _deployVrfRandomizer();

        _mintToken(deployed);

        StreamRandomizerLifecycle.RandomnessRequest memory request =
            vrf.retrieveRandomnessRequest(1);
        request.collectionId.assertEq(COLLECTION_ID, "collection");
        request.tokenId.assertEq(TOKEN_ID, "token");
        request.provider.assertEq(address(vrf), "provider");
        request.providerRequestId.assertEq(1, "provider request");
        request.randomizerEpoch.assertEq(2, "epoch");
        uint256(request.state)
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.Pending), "state");
        vrf.tokenToRequest(TOKEN_ID).assertEq(1, "token request");
        vrf.requestToToken(1).assertEq(TOKEN_ID, "request token");
        vrf.pendingRandomnessRequests(COLLECTION_ID).assertEq(1, "pending collection");
        vrf.totalPendingRandomnessRequests().assertEq(1, "pending total");

        uint256[] memory words = _words(777);
        bytes32 rawOutputHash = _rawOutputHash(words);
        bytes32 expectedSeed =
            _expectedSeed(address(vrf), uint256(1), COLLECTION_ID, TOKEN_ID, uint256(2), words);
        vm.recordLogs();
        coordinator.fulfill(vrf, 1, words);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        _assertRandomnessFulfilled(
            logs, address(vrf), 1, TOKEN_ID, address(vrf), uint256(2), expectedSeed, rawOutputHash
        );
        _assertProviderRequestFulfilled(logs, address(vrf), 1, words);

        deployed.core.retrieveTokenHash(TOKEN_ID).assertEq(expectedSeed, "token hash");
        request = vrf.retrieveRandomnessRequest(1);
        uint256(request.state)
            .assertEq(
                uint256(StreamRandomizerLifecycle.RandomnessRequestState.Fulfilled), "fulfilled"
            );
        request.derivedSeed.assertEq(expectedSeed, "stored seed");
        request.rawOutputHash.assertEq(rawOutputHash, "raw output hash");
        IRandomizerLifecycle lifecycle = IRandomizerLifecycle(address(vrf));
        IRandomizerLifecycle.RandomnessRequest memory interfaceRequest =
            lifecycle.retrieveRandomnessRequest(1);
        uint256(interfaceRequest.state)
            .assertEq(uint256(IRandomizerLifecycle.RandomnessRequestState.Fulfilled), "iface");
        interfaceRequest.rawOutputHash.assertEq(rawOutputHash, "iface raw hash");
        lifecycle.requestToToken(1).assertEq(TOKEN_ID, "iface request token");
        lifecycle.tokenToRequest(TOKEN_ID).assertEq(1, "iface token request");
        lifecycle.tokenIdToCollection(TOKEN_ID).assertEq(COLLECTION_ID, "iface token collection");
        vrf.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "collection cleared");
        vrf.totalPendingRandomnessRequests().assertEq(0, "total cleared");

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamRandomizerLifecycle.RandomnessRequestNotPending.selector,
                uint256(1),
                StreamRandomizerLifecycle.RandomnessRequestState.Fulfilled
            )
        );
        coordinator.fulfill(vrf, 1, words);
    }

    function testTokenLevelViewsExposeEmptyPendingAndFulfilledState() public {
        (DeployedStream memory deployed, MockVrfCoordinator coordinator, NextGenRandomizerVRF vrf) =
            _deployVrfRandomizer();

        StreamRandomizerLifecycle.RandomnessRequest memory request =
            vrf.retrieveRandomnessRequestForToken(TOKEN_ID);
        uint256(request.state)
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.None), "empty state");
        request.provider.assertEq(address(0), "empty provider");
        uint256(vrf.randomnessRequestStateForToken(TOKEN_ID))
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.None), "empty token");

        _mintToken(deployed);

        request = vrf.retrieveRandomnessRequestForToken(TOKEN_ID);
        request.providerRequestId.assertEq(1, "request id");
        request.collectionId.assertEq(COLLECTION_ID, "pending collection");
        request.tokenId.assertEq(TOKEN_ID, "pending token");
        uint256(request.state)
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.Pending), "pending");
        uint256(vrf.randomnessRequestStateForToken(TOKEN_ID))
            .assertEq(
                uint256(StreamRandomizerLifecycle.RandomnessRequestState.Pending), "token pending"
            );

        uint256[] memory words = _words(111);
        bytes32 expectedSeed =
            _expectedSeed(address(vrf), uint256(1), COLLECTION_ID, TOKEN_ID, uint256(2), words);
        bytes32 rawOutputHash = _rawOutputHash(words);
        coordinator.fulfill(vrf, 1, words);

        request = vrf.retrieveRandomnessRequestForToken(TOKEN_ID);
        uint256(request.state)
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.Fulfilled), "done");
        request.derivedSeed.assertEq(expectedSeed, "token seed");
        request.rawOutputHash.assertEq(rawOutputHash, "token raw hash");
        (request.fulfilledBlock > 0).assertTrue("fulfilled block");
        (request.fulfilledTimestamp > 0).assertTrue("fulfilled timestamp");
        uint256(vrf.randomnessRequestStateForToken(TOKEN_ID))
            .assertEq(
                uint256(StreamRandomizerLifecycle.RandomnessRequestState.Fulfilled), "token done"
            );
    }

    function testVrfSeedIgnoresMutableTokenDataChangedAfterRequest() public {
        (DeployedStream memory deployed, MockVrfCoordinator coordinator, NextGenRandomizerVRF vrf) =
            _deployVrfRandomizer();

        _mintToken(deployed);
        deployed.core.changeTokenData(TOKEN_ID, "changed-after-randomness-request");

        uint256[] memory words = _words(222);
        bytes32 rawOutputHash = _rawOutputHash(words);
        bytes32 expectedSeed =
            _expectedSeed(address(vrf), uint256(1), COLLECTION_ID, TOKEN_ID, uint256(2), words);
        coordinator.fulfill(vrf, 1, words);

        StreamRandomizerLifecycle.RandomnessRequest memory request =
            vrf.retrieveRandomnessRequest(1);
        request.derivedSeed.assertEq(expectedSeed, "seed");
        request.rawOutputHash.assertEq(rawOutputHash, "raw output hash");
        deployed.core.retrieveTokenHash(TOKEN_ID).assertEq(expectedSeed, "token hash");
    }

    function testVrfUnknownAndEmptyFulfillmentsFailClosed() public {
        (DeployedStream memory deployed, MockVrfCoordinator coordinator, NextGenRandomizerVRF vrf) =
            _deployVrfRandomizer();

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamRandomizerLifecycle.UnknownRandomnessRequest.selector, uint256(999)
            )
        );
        coordinator.fulfill(vrf, 999, _words(1));

        _mintToken(deployed);

        vm.expectRevert(
            abi.encodeWithSelector(StreamRandomizerLifecycle.EmptyRandomWords.selector, uint256(1))
        );
        coordinator.fulfill(vrf, 1, new uint256[](0));
    }

    function testVrfPostProcessingFailureRecordsFailedState() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);
        MockRandomizerCore core = new MockRandomizerCore();
        MockVrfCoordinator coordinator = new MockVrfCoordinator();
        NextGenRandomizerVRF vrf = new NextGenRandomizerVRF(
            1, address(coordinator), address(core), address(deployed.admins)
        );

        core.setRandomizer(COLLECTION_ID, address(vrf), 1);
        core.setTokenCollection(TOKEN_ID, COLLECTION_ID);
        core.setRejectTokenHash(true);

        vm.prank(address(core));
        vrf.calculateTokenHash(COLLECTION_ID, TOKEN_ID, 123);

        uint256[] memory words = _words(777);
        bytes32 rawOutputHash = _rawOutputHash(words);
        bytes32 expectedSeed =
            _expectedSeed(address(vrf), uint256(1), COLLECTION_ID, TOKEN_ID, uint256(1), words);
        bytes32 failureDataHash =
            keccak256(abi.encodeWithSelector(MockRandomizerCore.MockTokenHashRejected.selector));

        vm.recordLogs();
        coordinator.fulfill(vrf, 1, words);
        _assertRandomnessPostProcessingFailed(
            vm.getRecordedLogs(),
            address(vrf),
            1,
            TOKEN_ID,
            uint256(1),
            expectedSeed,
            rawOutputHash,
            failureDataHash
        );

        StreamRandomizerLifecycle.RandomnessRequest memory request =
            vrf.retrieveRandomnessRequest(1);
        uint256(request.state)
            .assertEq(
                uint256(StreamRandomizerLifecycle.RandomnessRequestState.FailedPostProcessing),
                "failed state"
            );
        request.derivedSeed.assertEq(expectedSeed, "failed seed");
        request.rawOutputHash.assertEq(rawOutputHash, "failed raw hash");
        request.failureDataHash.assertEq(failureDataHash, "failure hash");
        (request.fulfilledBlock > 0).assertTrue("failed block");
        (request.fulfilledTimestamp > 0).assertTrue("failed timestamp");
        vrf.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "pending collection");
        vrf.totalPendingRandomnessRequests().assertEq(0, "pending total");
        core.retrieveTokenHash(TOKEN_ID).assertEq(bytes32(0), "core hash");

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamRandomizerLifecycle.RandomnessRequestNotPending.selector,
                uint256(1),
                StreamRandomizerLifecycle.RandomnessRequestState.FailedPostProcessing
            )
        );
        coordinator.fulfill(vrf, 1, words);

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamRandomizerLifecycle.RandomnessRequestNotPending.selector,
                uint256(1),
                StreamRandomizerLifecycle.RandomnessRequestState.FailedPostProcessing
            )
        );
        vrf.markStaleRequest(1);
    }

    function testVrfStaleEpochOrProviderFulfillmentFails() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);
        MockRandomizerCore core = new MockRandomizerCore();
        MockVrfCoordinator coordinator = new MockVrfCoordinator();
        NextGenRandomizerVRF vrf = new NextGenRandomizerVRF(
            1, address(coordinator), address(core), address(deployed.admins)
        );
        NoopRandomizer replacement = new NoopRandomizer();

        core.setRandomizer(COLLECTION_ID, address(vrf), 1);
        core.setTokenCollection(TOKEN_ID, COLLECTION_ID);

        vm.prank(address(core));
        vrf.calculateTokenHash(COLLECTION_ID, TOKEN_ID, 123);
        core.setRandomizer(COLLECTION_ID, address(replacement), 2);

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamRandomizerLifecycle.StaleRandomnessRequest.selector,
                uint256(1),
                uint256(1),
                uint256(2),
                address(vrf),
                address(replacement)
            )
        );
        coordinator.fulfill(vrf, 1, _words(777));
    }

    function testMarkedStaleRequestIsObservableAndCannotFulfill() public {
        (DeployedStream memory deployed, MockVrfCoordinator coordinator, NextGenRandomizerVRF vrf) =
            _deployVrfRandomizer();

        _mintToken(deployed);
        vrf.pendingRandomnessRequests(COLLECTION_ID).assertEq(1, "pending before stale");

        vrf.markStaleRequest(1);
        uint256(vrf.randomnessRequestState(1))
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.Stale), "not stale");
        vrf.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "pending after stale");
        vrf.totalPendingRandomnessRequests().assertEq(0, "total after stale");
        StreamRandomizerLifecycle.RandomnessRequest memory request =
            vrf.retrieveRandomnessRequestForToken(TOKEN_ID);
        uint256(request.state)
            .assertEq(
                uint256(StreamRandomizerLifecycle.RandomnessRequestState.Stale), "token stale"
            );
        request.rawOutputHash.assertEq(bytes32(0), "stale raw hash");
        uint256(vrf.randomnessRequestStateForToken(TOKEN_ID))
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.Stale), "view stale");
        IRandomizerLifecycle lifecycle = IRandomizerLifecycle(address(vrf));
        IRandomizerLifecycle.RandomnessRequest memory interfaceRequest =
            lifecycle.retrieveRandomnessRequestForToken(TOKEN_ID);
        uint256(interfaceRequest.state)
            .assertEq(uint256(IRandomizerLifecycle.RandomnessRequestState.Stale), "iface stale");
        interfaceRequest.rawOutputHash.assertEq(bytes32(0), "iface stale raw hash");

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamRandomizerLifecycle.RandomnessRequestNotPending.selector,
                uint256(1),
                StreamRandomizerLifecycle.RandomnessRequestState.Stale
            )
        );
        coordinator.fulfill(vrf, 1, _words(777));
    }

    function testRandomizerMigrationWithNoPendingRequestsSucceedsAndEmitsEpoch() public {
        (DeployedStream memory deployed,, NextGenRandomizerVRF vrf) = _deployVrfRandomizer();
        NoopRandomizer replacement = new NoopRandomizer();

        vrf.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "unexpected pending");
        vm.recordLogs();
        deployed.core.addRandomizer(COLLECTION_ID, address(replacement));
        _assertCollectionRandomizerUpdated(
            vm.getRecordedLogs(), address(deployed.core), address(vrf), address(replacement), 3
        );

        deployed.core.viewCollectionRandomizerContract(COLLECTION_ID)
            .assertEq(address(replacement), "replacement");
        deployed.core.viewRandomizerEpoch(COLLECTION_ID).assertEq(3, "epoch");
    }

    function testUnsupportedLifecycleRandomizerDoesNotBlockMigration() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);
        UnsupportedLifecycleRandomizer unsupported = new UnsupportedLifecycleRandomizer();
        NoopRandomizer replacement = new NoopRandomizer();

        vm.recordLogs();
        deployed.core.addRandomizer(COLLECTION_ID, address(unsupported));
        _assertCollectionRandomizerUpdated(
            vm.getRecordedLogs(),
            address(deployed.core),
            address(deployed.randomizer),
            address(unsupported),
            2
        );

        vm.recordLogs();
        deployed.core.addRandomizer(COLLECTION_ID, address(replacement));
        _assertCollectionRandomizerUpdated(
            vm.getRecordedLogs(),
            address(deployed.core),
            address(unsupported),
            address(replacement),
            3
        );

        deployed.core.viewCollectionRandomizerContract(COLLECTION_ID)
            .assertEq(address(replacement), "replacement");
        deployed.core.viewRandomizerEpoch(COLLECTION_ID).assertEq(3, "epoch");
    }

    function testSupportedLifecyclePendingProbeFailureBlocksMigration() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);
        RevertingPendingLifecycleRandomizer oldRandomizer =
            new RevertingPendingLifecycleRandomizer();
        NoopRandomizer replacement = new NoopRandomizer();

        deployed.core.addRandomizer(COLLECTION_ID, address(oldRandomizer));

        vm.expectRevert(abi.encodeWithSignature("Error(string)", "pending probe failed"));
        deployed.core.addRandomizer(COLLECTION_ID, address(replacement));

        deployed.core.viewCollectionRandomizerContract(COLLECTION_ID)
            .assertEq(address(oldRandomizer), "provider changed");
        deployed.core.viewRandomizerEpoch(COLLECTION_ID).assertEq(2, "epoch changed");
    }

    function testRandomizerMigrationWithPendingRequestIsBlocked() public {
        (DeployedStream memory deployed,, NextGenRandomizerVRF vrf) = _deployVrfRandomizer();
        NoopRandomizer replacement = new NoopRandomizer();

        _mintToken(deployed);

        vrf.pendingRandomnessRequests(COLLECTION_ID).assertEq(1, "pending before migration");
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.PendingRandomnessRequests.selector,
                COLLECTION_ID,
                address(vrf),
                uint256(1)
            )
        );
        deployed.core.addRandomizer(COLLECTION_ID, address(replacement));

        deployed.core.viewCollectionRandomizerContract(COLLECTION_ID)
            .assertEq(address(vrf), "provider changed");
        deployed.core.viewRandomizerEpoch(COLLECTION_ID).assertEq(2, "epoch changed");
        vrf.pendingRandomnessRequests(COLLECTION_ID).assertEq(1, "pending changed");
    }

    function testFulfilledRequestUnblocksMigrationAndOldDuplicateCannotOverwrite() public {
        (
            DeployedStream memory deployed,
            MockVrfCoordinator oldCoordinator,
            NextGenRandomizerVRF oldVrf
        ) = _deployVrfRandomizer();
        NoopRandomizer replacement = new NoopRandomizer();

        _mintToken(deployed);
        oldCoordinator.fulfill(oldVrf, 1, _words(777));

        oldVrf.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "pending after fulfill");
        deployed.core.addRandomizer(COLLECTION_ID, address(replacement));

        deployed.core.viewCollectionRandomizerContract(COLLECTION_ID)
            .assertEq(address(replacement), "replacement");
        deployed.core.viewRandomizerEpoch(COLLECTION_ID).assertEq(3, "epoch");

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamRandomizerLifecycle.RandomnessRequestNotPending.selector,
                uint256(1),
                StreamRandomizerLifecycle.RandomnessRequestState.Fulfilled
            )
        );
        oldCoordinator.fulfill(oldVrf, 1, _words(999));
    }

    function testMarkedStaleRequestUnblocksMigrationAndNewProviderFulfillment() public {
        (
            DeployedStream memory deployed,
            MockVrfCoordinator oldCoordinator,
            NextGenRandomizerVRF oldVrf
        ) = _deployVrfRandomizer();
        MockVrfCoordinator newCoordinator = new MockVrfCoordinator();
        NextGenRandomizerVRF newVrf = new NextGenRandomizerVRF(
            1, address(newCoordinator), address(deployed.core), address(deployed.admins)
        );

        _mintToken(deployed);
        oldVrf.markStaleRequest(1);

        deployed.core.addRandomizer(COLLECTION_ID, address(newVrf));

        deployed.core.viewCollectionRandomizerContract(COLLECTION_ID)
            .assertEq(address(newVrf), "new provider");
        deployed.core.viewRandomizerEpoch(COLLECTION_ID).assertEq(3, "new epoch");

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamRandomizerLifecycle.RandomnessRequestNotPending.selector,
                uint256(1),
                StreamRandomizerLifecycle.RandomnessRequestState.Stale
            )
        );
        oldCoordinator.fulfill(oldVrf, 1, _words(777));

        _mintToken(deployed, SECOND_TOKEN_ID);
        StreamRandomizerLifecycle.RandomnessRequest memory request =
            newVrf.retrieveRandomnessRequestForToken(SECOND_TOKEN_ID);
        request.randomizerEpoch.assertEq(3, "request epoch");
        uint256(request.state)
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.Pending), "state");
        newVrf.pendingRandomnessRequests(COLLECTION_ID).assertEq(1, "new pending");

        uint256[] memory words = _words(888);
        bytes32 expectedSeed = _expectedSeed(
            address(newVrf), uint256(1), COLLECTION_ID, SECOND_TOKEN_ID, uint256(3), words
        );
        newCoordinator.fulfill(newVrf, 1, words);

        deployed.core.retrieveTokenHash(SECOND_TOKEN_ID).assertEq(expectedSeed, "new hash");
        newVrf.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "new pending cleared");
    }

    function testArrngPendingRequestBlocksMigration() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);
        MockArrngLifecycleController controller = new MockArrngLifecycleController();
        NextGenRandomizerRNG rng = new NextGenRandomizerRNG(
            address(deployed.core), address(deployed.admins), address(controller)
        );
        NoopRandomizer replacement = new NoopRandomizer();

        deployed.core.addRandomizer(COLLECTION_ID, address(rng));
        _mintToken(deployed);

        rng.pendingRandomnessRequests(COLLECTION_ID).assertEq(1, "rng pending");
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.PendingRandomnessRequests.selector,
                COLLECTION_ID,
                address(rng),
                uint256(1)
            )
        );
        deployed.core.addRandomizer(COLLECTION_ID, address(replacement));

        deployed.core.viewCollectionRandomizerContract(COLLECTION_ID)
            .assertEq(address(rng), "provider changed");
        deployed.core.viewRandomizerEpoch(COLLECTION_ID).assertEq(2, "epoch changed");
    }

    function testRandomnessRequestPauseDoesNotBlockVrfFulfillment() public {
        (DeployedStream memory deployed, MockVrfCoordinator coordinator, NextGenRandomizerVRF vrf) =
            _deployVrfRandomizer();

        _mintToken(deployed);

        deployed.admins
            .setPaused(deployed.admins.PAUSE_DOMAIN_RANDOMNESS_REQUEST(), true, PAUSE_REASON);
        coordinator.fulfill(vrf, 1, _words(777));

        (deployed.core.retrieveTokenHash(TOKEN_ID) == bytes32(0)).assertFalse("fulfillment paused");
    }

    function testArrngRequestAndFulfillmentUseSameLifecycle() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);
        MockArrngLifecycleController controller = new MockArrngLifecycleController();
        NextGenRandomizerRNG rng = new NextGenRandomizerRNG(
            address(deployed.core), address(deployed.admins), address(controller)
        );
        deployed.core.addRandomizer(COLLECTION_ID, address(rng));

        _mintToken(deployed);

        StreamRandomizerLifecycle.RandomnessRequest memory request =
            rng.retrieveRandomnessRequest(1);
        request.collectionId.assertEq(COLLECTION_ID, "collection");
        request.tokenId.assertEq(TOKEN_ID, "token");
        request.provider.assertEq(address(rng), "provider");
        request.randomizerEpoch.assertEq(2, "epoch");
        rng.pendingRandomnessRequests(COLLECTION_ID).assertEq(1, "pending");

        uint256[] memory words = _words(999);
        bytes32 rawOutputHash = _rawOutputHash(words);
        bytes32 expectedSeed =
            _expectedSeed(address(rng), uint256(1), COLLECTION_ID, TOKEN_ID, uint256(2), words);
        vm.recordLogs();
        controller.fulfill(rng, 1, words);
        _assertProviderRequestFulfilled(vm.getRecordedLogs(), address(rng), 1, words);

        deployed.core.retrieveTokenHash(TOKEN_ID).assertEq(expectedSeed, "token hash");
        uint256(rng.randomnessRequestState(1))
            .assertEq(
                uint256(StreamRandomizerLifecycle.RandomnessRequestState.Fulfilled), "fulfilled"
            );
        request = rng.retrieveRandomnessRequest(1);
        request.rawOutputHash.assertEq(rawOutputHash, "raw output hash");
        rng.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "pending cleared");
    }

    function testArrngPostProcessingFailureRecordsFailedState() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);
        MockRandomizerCore core = new MockRandomizerCore();
        MockArrngLifecycleController controller = new MockArrngLifecycleController();
        NextGenRandomizerRNG rng = new NextGenRandomizerRNG(
            address(core), address(deployed.admins), address(controller)
        );

        core.setRandomizer(COLLECTION_ID, address(rng), 1);
        core.setTokenCollection(TOKEN_ID, COLLECTION_ID);
        core.setRejectTokenHash(true);

        vm.prank(address(core));
        rng.calculateTokenHash(COLLECTION_ID, TOKEN_ID, 123);

        uint256[] memory words = _words(999);
        bytes32 rawOutputHash = _rawOutputHash(words);
        bytes32 expectedSeed =
            _expectedSeed(address(rng), uint256(1), COLLECTION_ID, TOKEN_ID, uint256(1), words);
        bytes32 failureDataHash =
            keccak256(abi.encodeWithSelector(MockRandomizerCore.MockTokenHashRejected.selector));

        vm.recordLogs();
        controller.fulfill(rng, 1, words);
        _assertRandomnessPostProcessingFailed(
            vm.getRecordedLogs(),
            address(rng),
            1,
            TOKEN_ID,
            uint256(1),
            expectedSeed,
            rawOutputHash,
            failureDataHash
        );

        StreamRandomizerLifecycle.RandomnessRequest memory request =
            rng.retrieveRandomnessRequestForToken(TOKEN_ID);
        uint256(request.state)
            .assertEq(
                uint256(StreamRandomizerLifecycle.RandomnessRequestState.FailedPostProcessing),
                "failed state"
            );
        request.derivedSeed.assertEq(expectedSeed, "failed seed");
        request.rawOutputHash.assertEq(rawOutputHash, "failed raw hash");
        request.failureDataHash.assertEq(failureDataHash, "failure hash");
        rng.pendingRandomnessRequests(COLLECTION_ID).assertEq(0, "pending collection");
        rng.totalPendingRandomnessRequests().assertEq(0, "pending total");
        core.retrieveTokenHash(TOKEN_ID).assertEq(bytes32(0), "core hash");

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamRandomizerLifecycle.RandomnessRequestNotPending.selector,
                uint256(1),
                StreamRandomizerLifecycle.RandomnessRequestState.FailedPostProcessing
            )
        );
        controller.fulfill(rng, 1, words);
    }

    function testArrngControllerCannotReenterFulfillmentDuringRequest() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);
        ReentrantArrngLifecycleController controller = new ReentrantArrngLifecycleController();
        NextGenRandomizerRNG rng = new NextGenRandomizerRNG(
            address(deployed.core), address(deployed.admins), address(controller)
        );
        deployed.core.addRandomizer(COLLECTION_ID, address(rng));

        vm.expectRevert(
            abi.encodeWithSelector(NextGenRandomizerRNG.RandomizerRequestReentrancy.selector)
        );
        _mintToken(deployed);

        deployed.core.retrieveTokenHash(TOKEN_ID).assertEq(bytes32(0), "reentrant hash written");
    }

    function testArrngZeroRequestIdFailsBeforeRecordingLifecycle() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);
        ZeroRequestIdArrngLifecycleController controller =
            new ZeroRequestIdArrngLifecycleController();
        NextGenRandomizerRNG rng = new NextGenRandomizerRNG(
            address(deployed.core), address(deployed.admins), address(controller)
        );
        deployed.core.addRandomizer(COLLECTION_ID, address(rng));

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamRandomizerLifecycle.UnknownRandomnessRequest.selector, uint256(0)
            )
        );
        _mintToken(deployed);

        uint256(rng.randomnessRequestState(0))
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.None), "zero state");
        rng.tokenToRequest(TOKEN_ID).assertEq(0, "token request recorded");
        deployed.core.retrieveTokenHash(TOKEN_ID).assertEq(bytes32(0), "hash written");
    }

    function testNxtRandomizerCannotBeConfiguredForProductionCollections() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);
        NextGenRandomizerNXT nxt = new NextGenRandomizerNXT(
            address(new MockXRandoms()), address(deployed.admins), address(deployed.core)
        );

        nxt.isRandomizerContract().assertFalse("nxt advertises production randomizer");

        (bool success,) = address(deployed.core)
            .call(
                abi.encodeWithSelector(
                    deployed.core.addRandomizer.selector, COLLECTION_ID, address(nxt)
                )
            );

        success.assertFalse("nxt configured as production randomizer");
    }

    function testVrfWrongCollectionBindingFailsClosed() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);
        MockRandomizerCore core = new MockRandomizerCore();
        MockVrfCoordinator coordinator = new MockVrfCoordinator();
        NextGenRandomizerVRF vrf = new NextGenRandomizerVRF(
            1, address(coordinator), address(core), address(deployed.admins)
        );

        core.setRandomizer(COLLECTION_ID, address(vrf), 1);
        core.setTokenCollection(TOKEN_ID, COLLECTION_ID + 1);

        vm.prank(address(core));
        vrf.calculateTokenHash(COLLECTION_ID, TOKEN_ID, 123);

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamRandomizerLifecycle.WrongRandomnessTokenCollection.selector,
                uint256(1),
                TOKEN_ID,
                COLLECTION_ID,
                COLLECTION_ID + 1
            )
        );
        coordinator.fulfill(vrf, 1, _words(777));

        _assertWrongCollectionFulfillmentPreservedPending(core, vrf);
    }

    function testArrngWrongCollectionBindingFailsClosed() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);
        MockRandomizerCore core = new MockRandomizerCore();
        MockArrngLifecycleController controller = new MockArrngLifecycleController();
        NextGenRandomizerRNG rng =
            new NextGenRandomizerRNG(address(core), address(deployed.admins), address(controller));

        core.setRandomizer(COLLECTION_ID, address(rng), 1);
        core.setTokenCollection(TOKEN_ID, COLLECTION_ID + 1);

        vm.prank(address(core));
        rng.calculateTokenHash(COLLECTION_ID, TOKEN_ID, 123);

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamRandomizerLifecycle.WrongRandomnessTokenCollection.selector,
                uint256(1),
                TOKEN_ID,
                COLLECTION_ID,
                COLLECTION_ID + 1
            )
        );
        controller.fulfill(rng, 1, _words(888));

        _assertWrongCollectionFulfillmentPreservedPending(core, rng);
    }

    function _deployVrfRandomizer()
        private
        returns (
            DeployedStream memory deployed,
            MockVrfCoordinator coordinator,
            NextGenRandomizerVRF vrf
        )
    {
        deployed = deployStream(PAYOUT, CURATORS_POOL);
        coordinator = new MockVrfCoordinator();
        vrf = new NextGenRandomizerVRF(
            1, address(coordinator), address(deployed.core), address(deployed.admins)
        );
        deployed.core.addRandomizer(COLLECTION_ID, address(vrf));
    }

    function _mintToken(DeployedStream memory deployed) private {
        _mintToken(deployed, TOKEN_ID);
    }

    function _mintToken(DeployedStream memory deployed, uint256 tokenId) private {
        vm.prank(address(deployed.minter));
        deployed.core.mint(tokenId, address(0xBEEF), "data", 123, COLLECTION_ID);
    }

    function _words(uint256 word) private pure returns (uint256[] memory words) {
        words = new uint256[](1);
        words[0] = word;
    }

    function _rawOutputHash(uint256[] memory words) private pure returns (bytes32) {
        return keccak256(abi.encode(words));
    }

    function _expectedSeed(
        address provider,
        uint256 requestId,
        uint256 collectionId,
        uint256 tokenId,
        uint256 randomizerEpoch,
        uint256[] memory words
    ) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                RANDOMNESS_SEED_TYPEHASH,
                provider,
                requestId,
                collectionId,
                tokenId,
                randomizerEpoch,
                _rawOutputHash(words)
            )
        );
    }

    function _assertRandomnessFulfilled(
        Vm.Log[] memory logs,
        address emitter,
        uint256 requestId,
        uint256 tokenId,
        address expectedProvider,
        uint256 expectedRandomizerEpoch,
        bytes32 expectedSeed,
        bytes32 expectedRawOutputHash
    ) private pure {
        bool found = false;
        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].emitter == emitter && logs[i].topics.length == 4
                    && logs[i].topics[0] == RANDOMNESS_FULFILLED_TOPIC
                    && uint256(logs[i].topics[1]) == requestId
                    && uint256(logs[i].topics[2]) == COLLECTION_ID
                    && uint256(logs[i].topics[3]) == tokenId
            ) {
                (
                    address actualProvider,
                    uint256 actualRandomizerEpoch,
                    bytes32 actualSeed,
                    bytes32 actualRawOutputHash
                ) = abi.decode(logs[i].data, (address, uint256, bytes32, bytes32));
                bool matches = actualProvider == expectedProvider
                    && actualRandomizerEpoch == expectedRandomizerEpoch
                    && actualSeed == expectedSeed && actualRawOutputHash == expectedRawOutputHash;
                found = found || matches;
            }
        }
        found.assertTrue("fulfilled event");
    }

    function _assertProviderRequestFulfilled(
        Vm.Log[] memory logs,
        address emitter,
        uint256 requestId,
        uint256[] memory expectedWords
    ) private pure {
        bool found = false;
        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].emitter == emitter && logs[i].topics.length == 1
                    && logs[i].topics[0] == PROVIDER_REQUEST_FULFILLED_TOPIC
            ) {
                (uint256 actualRequestId, uint256[] memory actualWords) =
                    abi.decode(logs[i].data, (uint256, uint256[]));
                bool matches =
                    actualRequestId == requestId && _wordsMatch(actualWords, expectedWords);
                found = found || matches;
            }
        }
        found.assertTrue("provider fulfilled event");
    }

    function _wordsMatch(uint256[] memory actualWords, uint256[] memory expectedWords)
        private
        pure
        returns (bool)
    {
        if (actualWords.length != expectedWords.length) {
            return false;
        }
        for (uint256 i = 0; i < actualWords.length; i++) {
            if (actualWords[i] != expectedWords[i]) {
                return false;
            }
        }
        return true;
    }

    function _assertCollectionRandomizerUpdated(
        Vm.Log[] memory logs,
        address emitter,
        address oldRandomizer,
        address newRandomizer,
        uint256 epoch
    ) private pure {
        bool found = false;
        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].emitter == emitter && logs[i].topics.length == 4
                    && logs[i].topics[0] == COLLECTION_RANDOMIZER_UPDATED_TOPIC
                    && uint256(logs[i].topics[1]) == COLLECTION_ID
                    && address(uint160(uint256(logs[i].topics[2]))) == oldRandomizer
                    && address(uint160(uint256(logs[i].topics[3]))) == newRandomizer
                    && abi.decode(logs[i].data, (uint256)) == epoch
            ) {
                found = true;
            }
        }
        found.assertTrue("randomizer event");
    }

    function _assertRandomnessPostProcessingFailed(
        Vm.Log[] memory logs,
        address emitter,
        uint256 requestId,
        uint256 tokenId,
        uint256 expectedEpoch,
        bytes32 expectedSeed,
        bytes32 expectedRawOutputHash,
        bytes32 expectedFailureDataHash
    ) private pure {
        bool found = false;
        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].emitter == emitter && logs[i].topics.length == 4
                    && logs[i].topics[0] == RANDOMNESS_POST_PROCESSING_FAILED_TOPIC
                    && uint256(logs[i].topics[1]) == requestId
                    && uint256(logs[i].topics[2]) == COLLECTION_ID
                    && uint256(logs[i].topics[3]) == tokenId
            ) {
                (
                    address actualProvider,
                    uint256 actualEpoch,
                    bytes32 actualSeed,
                    bytes32 actualRawOutputHash,
                    bytes32 actualFailureDataHash
                ) = abi.decode(logs[i].data, (address, uint256, bytes32, bytes32, bytes32));
                bool matches = actualProvider == emitter && actualEpoch == expectedEpoch
                    && actualSeed == expectedSeed && actualRawOutputHash == expectedRawOutputHash
                    && actualFailureDataHash == expectedFailureDataHash;
                found = found || matches;
            }
        }
        found.assertTrue("failed event");
    }

    function _assertWrongCollectionFulfillmentPreservedPending(
        MockRandomizerCore core,
        StreamRandomizerLifecycle randomizer
    ) private view {
        StreamRandomizerLifecycle.RandomnessRequest memory request =
            randomizer.retrieveRandomnessRequest(1);
        request.collectionId.assertEq(COLLECTION_ID, "request collection");
        request.tokenId.assertEq(TOKEN_ID, "request token");
        request.provider.assertEq(address(randomizer), "request provider");
        request.providerRequestId.assertEq(1, "provider request");
        request.randomizerEpoch.assertEq(1, "request epoch");
        uint256(request.state)
            .assertEq(uint256(StreamRandomizerLifecycle.RandomnessRequestState.Pending), "state");
        request.derivedSeed.assertEq(bytes32(0), "seed");
        request.rawOutputHash.assertEq(bytes32(0), "raw output");
        request.failureDataHash.assertEq(bytes32(0), "failure hash");
        request.fulfilledBlock.assertEq(0, "fulfilled block");
        request.fulfilledTimestamp.assertEq(0, "fulfilled timestamp");
        randomizer.pendingRandomnessRequests(COLLECTION_ID).assertEq(1, "pending collection");
        randomizer.totalPendingRandomnessRequests().assertEq(1, "pending total");
        core.retrieveTokenHash(TOKEN_ID).assertEq(bytes32(0), "token hash");
    }
}

contract MockVrfCoordinator {
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

contract MockArrngLifecycleController {
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

contract ReentrantArrngLifecycleController {
    function requestRandomWords(uint256, address) external returns (uint256 requestId) {
        uint256[] memory words = new uint256[](1);
        words[0] = 123;
        NextGenRandomizerRNG(payable(msg.sender)).receiveRandomness(1, words);
        return 1;
    }
}

contract ZeroRequestIdArrngLifecycleController {
    function requestRandomWords(uint256, address) external pure returns (uint256 requestId) {
        return 0;
    }
}

contract MockXRandoms is IXRandoms {
    function randomNumber() external pure returns (uint256) {
        return 4;
    }

    function randomWord() external pure returns (string memory) {
        return "word";
    }
}
