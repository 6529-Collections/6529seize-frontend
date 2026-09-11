// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/StreamPauseDomains.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";

contract IdentityMintManager {
    StreamCore private immutable core;

    constructor(StreamCore core_) {
        core = core_;
    }

    function mint(uint256 collectionId, address initialRecipient, string calldata tokenData)
        external
        returns (uint256 tokenId, uint256 collectionSerial)
    {
        return core.mintFromManager(
            collectionId, initialRecipient, tokenData, 0, keccak256(bytes(tokenData))
        );
    }

    function prepare(uint256 collectionId, string calldata tokenData, bytes32 operationId)
        external
        returns (uint256 tokenId, uint256 collectionSerial)
    {
        return core.prepareMintFromManager(
            collectionId, tokenData, keccak256(bytes(tokenData)), operationId
        );
    }

    function complete(uint256 tokenId, address initialRecipient, bytes32 operationId) external {
        core.completePreparedMintFromManager(tokenId, initialRecipient, operationId, 0);
    }

    function abort(uint256 tokenId, bytes32 operationId) external {
        core.abortPreparedMintFromManager(tokenId, operationId);
    }

    function isStreamMintManager() external pure returns (bool) {
        return true;
    }
}

/// Golden vectors for the sequential Core-owned token identity model:
/// one global allocator from 1, stored per-token (collectionId, collectionSerial),
/// lifecycle vocabulary, identity events, enumeration reads, and transfer openness.
contract StreamCoreIdentityTest is CharacterizationTestBase, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for string;
    using Assertions for uint256;

    bytes32 private constant TRANSFER_TOPIC = keccak256("Transfer(address,address,uint256)");
    bytes32 private constant TOKEN_COLLECTION_REGISTERED_TOPIC =
        keccak256("TokenCollectionRegistered(uint16,uint256,uint256,uint256)");
    bytes32 private constant STREAM_TOKEN_BURNED_TOPIC =
        keccak256("StreamTokenBurned(uint256,uint256,uint256,uint16)");
    bytes32 private constant TOKEN_COLLECTION_REGISTRATION_REVERTED_TOPIC =
        keccak256("TokenCollectionRegistrationReverted(uint16,uint256,uint256)");

    uint256 private constant COLLECTION_A = 1;
    uint256 private constant COLLECTION_B = 2;
    address private constant RECIPIENT = address(0xA11CE);
    address private constant OTHER = address(0xB0B);
    bytes32 private constant PAUSE_REASON = bytes32("identity-suite");

    uint256 private constant LIFECYCLE_UNKNOWN = 0;
    uint256 private constant LIFECYCLE_PREPARED_INCOMPLETE = 1;
    uint256 private constant LIFECYCLE_MINTED = 2;
    uint256 private constant LIFECYCLE_BURNED = 3;

    function testFirstMintEverAllocatesTokenIdOne() public {
        (DeployedStream memory deployed, IdentityMintManager manager) = _deployWithManager();

        deployed.core.lastAllocatedTokenId().assertEq(0, "allocator before first mint");
        (uint256 tokenId, uint256 serial) = manager.mint(COLLECTION_A, RECIPIENT, "vector-1");

        tokenId.assertEq(1, "first token id ever");
        serial.assertEq(1, "first collection serial");
        deployed.core.lastAllocatedTokenId().assertEq(1, "allocator after first mint");
    }

    function testInterleavedMintsKeepGlobalIdsSequentialAndSerialsCollectionLocal() public {
        (DeployedStream memory deployed, IdentityMintManager manager) = _deployWithManager();
        _createCollectionB(deployed);

        (uint256 firstA,) = manager.mint(COLLECTION_A, RECIPIENT, "vector-a1");
        (uint256 firstB,) = manager.mint(COLLECTION_B, RECIPIENT, "vector-b1");
        (uint256 secondA,) = manager.mint(COLLECTION_A, RECIPIENT, "vector-a2");

        firstA.assertEq(1, "A first global id");
        firstB.assertEq(2, "B first global id");
        secondA.assertEq(3, "A second global id");

        _assertIdentity(deployed.core, 1, COLLECTION_A, 1, false);
        _assertIdentity(deployed.core, 2, COLLECTION_B, 1, false);
        _assertIdentity(deployed.core, 3, COLLECTION_A, 2, false);

        deployed.core.lastAllocatedTokenId().assertEq(3, "global high-water mark");
        deployed.core.lastAllocatedCollectionId().assertEq(2, "collection high-water mark");
        deployed.core.viewColIDforTokenID(2).assertEq(COLLECTION_B, "legacy lookup");
    }

    function testTokenLifecycleTransitionsAcrossPreparedMintedAndBurned() public {
        (DeployedStream memory deployed, IdentityMintManager manager) = _deployWithManager();
        bytes32 operationId = bytes32(uint256(0x1D));

        uint256(deployed.core.tokenLifecycle(1)).assertEq(LIFECYCLE_UNKNOWN, "premint lifecycle");

        (uint256 tokenId,) = manager.prepare(COLLECTION_A, "vector-lifecycle", operationId);
        uint256(deployed.core.tokenLifecycle(tokenId))
            .assertEq(LIFECYCLE_PREPARED_INCOMPLETE, "prepared lifecycle");
        _assertIdentity(deployed.core, tokenId, COLLECTION_A, 1, false);

        manager.complete(tokenId, RECIPIENT, operationId);
        uint256(deployed.core.tokenLifecycle(tokenId))
            .assertEq(LIFECYCLE_MINTED, "minted lifecycle");

        vm.prank(RECIPIENT);
        deployed.core.burn(tokenId);
        uint256(deployed.core.tokenLifecycle(tokenId))
            .assertEq(LIFECYCLE_BURNED, "burned lifecycle");
        _assertIdentity(deployed.core, tokenId, COLLECTION_A, 1, true);
    }

    function testAbortedPrepareRewindsAllocatorAndClearsIdentity() public {
        (DeployedStream memory deployed, IdentityMintManager manager) = _deployWithManager();
        bytes32 operationId = bytes32(uint256(0xAB));

        (uint256 tokenId,) = manager.prepare(COLLECTION_A, "vector-abort", operationId);
        tokenId.assertEq(1, "prepared token id");
        manager.abort(tokenId, operationId);

        deployed.core.lastAllocatedTokenId().assertEq(0, "allocator rewound");
        uint256(deployed.core.tokenLifecycle(tokenId))
            .assertEq(LIFECYCLE_UNKNOWN, "aborted lifecycle");
        (bool mappingExists,,,) = deployed.core.tokenCollectionIdentity(tokenId);
        mappingExists.assertFalse("aborted identity retained");

        (uint256 reusedTokenId, uint256 reusedSerial) =
            manager.mint(COLLECTION_A, RECIPIENT, "vector-abort-retry");
        reusedTokenId.assertEq(1, "aborted id not reused");
        reusedSerial.assertEq(1, "aborted serial not reused");
    }

    /// A prepared-mint abort emits TokenCollectionRegistrationReverted so an event-only
    /// reconstructor reverses the earlier registration for the reused ID; re-allocating the same
    /// ID to a different collection emits a fresh TokenCollectionRegistered, and replaying the
    /// Registered/Reverted/Registered stream in order yields the correct final mapping and supply.
    function testAbortRevertEventCompensatesRegistrationAcrossReuse() public {
        (DeployedStream memory deployed, IdentityMintManager manager) = _deployWithManager();
        _createCollectionB(deployed);
        bytes32 operationId = bytes32(uint256(0xAB0A7));
        address core = address(deployed.core);

        // Record the whole prepare -> abort -> reuse sequence so the reconstruction below can
        // replay the complete Registered/Reverted/Registered event stream for the reused id.
        vm.recordLogs();

        // 1. Prepare on collection A: TokenCollectionRegistered(tokenId=1, collection=A, serial=1).
        (uint256 tokenId,) = manager.prepare(COLLECTION_A, "revert-prepare", operationId);
        tokenId.assertEq(1, "prepared token id");
        uint256(deployed.core.tokenLifecycle(tokenId))
            .assertEq(LIFECYCLE_PREPARED_INCOMPLETE, "prepared lifecycle");
        // Prepare reserves circulation supply for the pending token; abort must rewind it.
        deployed.core.totalSupplyOfCollection(COLLECTION_A)
            .assertEq(1, "A supply reserved on prepare");

        // 2. Abort: TokenCollectionRegistrationReverted(tokenId=1, collection=A), schema 1.
        manager.abort(tokenId, operationId);
        uint256(deployed.core.tokenLifecycle(tokenId))
            .assertEq(LIFECYCLE_UNKNOWN, "aborted lifecycle");
        (bool mappingExists,,,) = deployed.core.tokenCollectionIdentity(tokenId);
        mappingExists.assertFalse("aborted identity retained");
        deployed.core.totalSupplyOfCollection(COLLECTION_A).assertEq(0, "A supply after abort");

        // 3. Re-mint the SAME reused id to a DIFFERENT collection: fresh TokenCollectionRegistered.
        (uint256 reusedTokenId, uint256 reusedSerial) =
            manager.mint(COLLECTION_B, RECIPIENT, "revert-reuse-b");
        reusedTokenId.assertEq(tokenId, "aborted id reused for new mint");
        reusedSerial.assertEq(1, "reused serial is collection B first");

        Vm.Log[] memory logs = vm.getRecordedLogs();

        // The event stream carries: Registered(A) then Reverted(A) then Registered(B), in order.
        uint256 registeredA = _findRegisteredEventIndex(logs, core, tokenId, COLLECTION_A, 1);
        uint256 reverted = _assertRegistrationRevertedEvent(logs, core, tokenId, COLLECTION_A);
        uint256 registeredB =
            _findRegisteredEventIndex(logs, core, reusedTokenId, COLLECTION_B, reusedSerial);
        (registeredA < reverted).assertTrue("revert must follow the registration it compensates");
        (reverted < registeredB).assertTrue("re-registration must follow the revert");

        // 4/5. Final on-chain state and supply reflect collection B only; A never accrues supply.
        _assertIdentity(deployed.core, reusedTokenId, COLLECTION_B, reusedSerial, false);
        uint256(deployed.core.tokenLifecycle(reusedTokenId))
            .assertEq(LIFECYCLE_MINTED, "reused lifecycle minted");
        deployed.core.totalSupplyOfCollection(COLLECTION_A).assertEq(0, "A never supplied");
        deployed.core.totalSupplyOfCollection(COLLECTION_B).assertEq(1, "B supplied once");
        deployed.core.totalSupply().assertEq(1, "global supply not double-counted");

        // Replay reconstruction: an event-only indexer applying the stream in order resolves the
        // reused id to collection B with exactly one live registration (no stale A, no double-count).
        (uint256 reconstructedCollection, uint256 liveRegistrations) =
            _reconstructTokenCollection(logs, core, tokenId);
        reconstructedCollection.assertEq(COLLECTION_B, "reconstructed final collection");
        liveRegistrations.assertEq(1, "reconstructed live registration count");
    }

    function testEveryAllocatedTokenIdAnswersIdentityAndLifecycleDensely() public {
        (DeployedStream memory deployed, IdentityMintManager manager) = _deployWithManager();
        _createCollectionB(deployed);

        manager.mint(COLLECTION_A, RECIPIENT, "dense-1");
        manager.mint(COLLECTION_B, RECIPIENT, "dense-2");
        manager.mint(COLLECTION_A, RECIPIENT, "dense-3");
        vm.prank(RECIPIENT);
        deployed.core.burn(2);

        uint256 lastAllocated = deployed.core.lastAllocatedTokenId();
        lastAllocated.assertEq(3, "dense allocation mark");
        for (uint256 tokenId = 1; tokenId <= lastAllocated; tokenId++) {
            (bool mappingExists,, uint256 serial,) = deployed.core.tokenCollectionIdentity(tokenId);
            mappingExists.assertTrue("dense identity missing");
            (serial != 0).assertTrue("dense serial missing");
            (uint256(deployed.core.tokenLifecycle(tokenId)) != LIFECYCLE_UNKNOWN)
            .assertTrue("dense lifecycle unknown");
        }
        uint256(deployed.core.tokenLifecycle(lastAllocated + 1))
            .assertEq(LIFECYCLE_UNKNOWN, "beyond-mark lifecycle");
    }

    function testTokenCollectionRegisteredEmitsBeforeDependentEffectsOnBothPaths() public {
        (DeployedStream memory deployed, IdentityMintManager manager) = _deployWithManager();

        vm.recordLogs();
        (uint256 tokenId,) = manager.mint(COLLECTION_A, RECIPIENT, "vector-order");
        _assertIdentityEventBeforeTransfer(
            vm.getRecordedLogs(), address(deployed.core), tokenId, COLLECTION_A, 1
        );

        bytes32 operationId = bytes32(uint256(0x0E));
        vm.recordLogs();
        (uint256 preparedTokenId,) = manager.prepare(COLLECTION_A, "vector-order-2", operationId);
        Vm.Log[] memory prepareLogs = vm.getRecordedLogs();
        _findIdentityEventIndex(
            prepareLogs, address(deployed.core), preparedTokenId, COLLECTION_A, 2
        );
        manager.complete(preparedTokenId, RECIPIENT, operationId);
    }

    function testStreamTokenBurnedCarriesRetainedIdentityAndSchemaVersion() public {
        (DeployedStream memory deployed, IdentityMintManager manager) = _deployWithManager();
        _createCollectionB(deployed);
        manager.mint(COLLECTION_A, RECIPIENT, "burn-a1");
        (uint256 tokenId, uint256 serial) = manager.mint(COLLECTION_B, RECIPIENT, "burn-b1");

        vm.recordLogs();
        vm.prank(RECIPIENT);
        deployed.core.burn(tokenId);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        bool found;
        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].emitter == address(deployed.core) && logs[i].topics.length == 3
                    && logs[i].topics[0] == STREAM_TOKEN_BURNED_TOPIC
            ) {
                uint256(logs[i].topics[1]).assertEq(tokenId, "burn event token id");
                uint256(logs[i].topics[2]).assertEq(COLLECTION_B, "burn event collection");
                (uint256 eventSerial, uint16 schemaVersion) =
                    abi.decode(logs[i].data, (uint256, uint16));
                eventSerial.assertEq(serial, "burn event serial");
                uint256(schemaVersion).assertEq(1, "burn event schema version");
                found = true;
            }
        }
        found.assertTrue("StreamTokenBurned missing");

        _assertIdentity(deployed.core, tokenId, COLLECTION_B, serial, true);
        deployed.core.tokenData(tokenId).assertEq("burn-b1", "token data retained after burn");
    }

    function testCollectionSupplyReadsTrackMintAndBurn() public {
        (DeployedStream memory deployed, IdentityMintManager manager) = _deployWithManager();
        _createCollectionB(deployed);

        deployed.core.totalSupplyOfCollection(COLLECTION_A).assertEq(0, "A empty");
        deployed.core.totalSupplyOfCollection(999).assertEq(0, "unknown collection non-reverting");

        manager.mint(COLLECTION_A, RECIPIENT, "supply-a1");
        manager.mint(COLLECTION_B, RECIPIENT, "supply-b1");
        (uint256 secondA,) = manager.mint(COLLECTION_A, RECIPIENT, "supply-a2");

        deployed.core.totalSupplyOfCollection(COLLECTION_A).assertEq(2, "A live supply");
        deployed.core.totalSupplyOfCollection(COLLECTION_B).assertEq(1, "B live supply");
        deployed.core.totalSupply().assertEq(3, "global live supply");

        vm.prank(RECIPIENT);
        deployed.core.burn(secondA);

        deployed.core.totalSupplyOfCollection(COLLECTION_A).assertEq(1, "A after burn");
        deployed.core.totalSupplyOfCollection(COLLECTION_B).assertEq(1, "B after burn");
        deployed.core.totalSupply().assertEq(2, "global after burn");
        deployed.core.burnAmount(COLLECTION_A).assertEq(1, "A burn count");
        deployed.core.lastAllocatedTokenId().assertEq(3, "burn keeps allocator mark");
    }

    function testCollectionBurnsBlockedAtBlockIsZeroUntilActivation() public {
        (DeployedStream memory deployed,) = _deployWithManager();
        uint256(deployed.core.collectionBurnsBlockedAtBlock(COLLECTION_A))
            .assertEq(0, "burn block height before activation");
        uint256(deployed.core.collectionBurnsBlockedAtBlock(999))
            .assertEq(0, "unknown collection burn block height");
    }

    function testTransfersAndApprovalsStayOpenUnderFreezeAndPauses() public {
        (DeployedStream memory deployed, IdentityMintManager manager) = _deployWithManager();
        (uint256 tokenId,) = manager.mint(COLLECTION_A, RECIPIENT, "open-transfer");

        _warpPastFinalSupplyWindow();
        deployed.core.freezeCollection(COLLECTION_A);
        deployed.core.collectionFreezeStatus(COLLECTION_A).assertTrue("collection not frozen");
        deployed.admins.setPaused(StreamPauseDomains.METADATA_MUTATION, true, PAUSE_REASON);
        deployed.admins.setPaused(StreamPauseDomains.MINT, true, PAUSE_REASON);
        deployed.admins.setPaused(StreamPauseDomains.RANDOMNESS_REQUEST, true, PAUSE_REASON);

        vm.prank(RECIPIENT);
        deployed.core.approve(OTHER, tokenId);
        deployed.core.getApproved(tokenId).assertEq(OTHER, "approval under freeze and pause");

        vm.prank(RECIPIENT);
        deployed.core.setApprovalForAll(OTHER, true);
        deployed.core.isApprovedForAll(RECIPIENT, OTHER).assertTrue("operator under pause");

        vm.prank(OTHER);
        deployed.core.transferFrom(RECIPIENT, OTHER, tokenId);
        deployed.core.ownerOf(tokenId).assertEq(OTHER, "transfer under freeze and pause");

        vm.prank(OTHER);
        deployed.core.safeTransferFrom(OTHER, RECIPIENT, tokenId);
        deployed.core.ownerOf(tokenId).assertEq(RECIPIENT, "safe transfer under freeze and pause");
    }

    function testPresetHashOnNextSequentialIdDoesNotBlockItsMint() public {
        (DeployedStream memory deployed, IdentityMintManager manager) = _deployWithManager();

        // The next sequential ID is fully predictable under the global allocator.
        uint256 nextTokenId = deployed.core.lastAllocatedTokenId() + 1;
        nextTokenId.assertEq(1, "next sequential id");

        // A collection randomizer pre-sets a hash on that not-yet-allocated ID (legacy premint
        // path). Under sequential IDs this is a griefing surface: without the mint-path clear it
        // would trip the randomizer's require(tokenToHash == 0) and revert the mint.
        vm.prank(address(deployed.randomizer));
        deployed.core.setTokenHash(COLLECTION_A, nextTokenId, keccak256("grief-preset"));
        deployed.core.retrieveTokenHash(nextTokenId)
            .assertEq(keccak256("grief-preset"), "preset hash not stored");

        // Minting that ID succeeds and the authoritative mint-path randomizer hash overwrites the
        // stale preset, so no liveness is lost.
        (uint256 tokenId,) = manager.mint(COLLECTION_A, RECIPIENT, "grief-resist");
        tokenId.assertEq(nextTokenId, "griefed id not minted");
        deployed.core.ownerOf(tokenId).assertEq(RECIPIENT, "griefed mint owner");
        (deployed.core.retrieveTokenHash(tokenId) != keccak256("grief-preset"))
        .assertTrue("stale preset hash survived mint");
        (deployed.core.retrieveTokenHash(tokenId) != bytes32(0))
        .assertTrue("authoritative hash not written");
        _assertIdentity(deployed.core, tokenId, COLLECTION_A, 1, false);
    }

    function testSupportsInterfaceMatrixExcludesEnumerable() public {
        (DeployedStream memory deployed,) = _deployWithManager();

        deployed.core.supportsInterface(0x01ffc9a7).assertTrue("ERC-165");
        deployed.core.supportsInterface(0x80ac58cd).assertTrue("ERC-721");
        deployed.core.supportsInterface(0x5b5e139f).assertTrue("ERC-721 Metadata");
        deployed.core.supportsInterface(0x2a55205a).assertTrue("ERC-2981");
        deployed.core.supportsInterface(0x49064906).assertTrue("ERC-4906");
        deployed.core.supportsInterface(0x780e9d63).assertFalse("ERC-721 Enumerable advertised");
        deployed.core.supportsInterface(0xffffffff).assertFalse("invalid interface");
    }

    function _deployWithManager()
        private
        returns (DeployedStream memory deployed, IdentityMintManager manager)
    {
        deployed = deployStream(address(0xBEEF), address(0xCAFE));
        manager = new IdentityMintManager(deployed.core);
        deployed.core.updateContracts(4, address(manager));
    }

    function _createCollectionB(DeployedStream memory deployed) private {
        string[] memory scripts = new string[](1);
        scripts[0] = "function draw(){}";
        deployed.core
            .createCollection(
                "Second",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "ipfs://second/",
                "https://cdn.example/script.js",
                bytes32(0),
                scripts
            );
        deployed.core.setCollectionData(COLLECTION_B, address(0xA11CE), 5, 10, 1 days);
        deployed.core.addRandomizer(COLLECTION_B, address(deployed.randomizer));
        deployed.minter
            .setCollectionPhases(COLLECTION_B, block.timestamp, block.timestamp + 30 days);
    }

    function _assertIdentity(
        StreamCore core,
        uint256 tokenId,
        uint256 expectedCollectionId,
        uint256 expectedSerial,
        bool expectedBurned
    ) private view {
        (bool mappingExists, uint256 collectionId, uint256 serial, bool burned) =
            core.tokenCollectionIdentity(tokenId);
        mappingExists.assertTrue("identity mapping missing");
        collectionId.assertEq(expectedCollectionId, "identity collection");
        serial.assertEq(expectedSerial, "identity serial");
        (burned == expectedBurned).assertTrue("identity burned flag");
    }

    function _assertIdentityEventBeforeTransfer(
        Vm.Log[] memory logs,
        address core,
        uint256 tokenId,
        uint256 collectionId,
        uint256 serial
    ) private pure {
        uint256 identityIndex = _findIdentityEventIndex(logs, core, tokenId, collectionId, serial);
        bool transferSeen;
        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].emitter == core && logs[i].topics.length == 4
                    && logs[i].topics[0] == TRANSFER_TOPIC && uint256(logs[i].topics[3]) == tokenId
            ) {
                (identityIndex < i).assertTrue("identity event after ERC-721 transfer");
                transferSeen = true;
            }
        }
        transferSeen.assertTrue("mint transfer missing");
    }

    function _findIdentityEventIndex(
        Vm.Log[] memory logs,
        address core,
        uint256 tokenId,
        uint256 collectionId,
        uint256 serial
    ) private pure returns (uint256 identityIndex) {
        bool found;
        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].emitter == core && logs[i].topics.length == 3
                    && logs[i].topics[0] == TOKEN_COLLECTION_REGISTERED_TOPIC
            ) {
                uint256(logs[i].topics[1]).assertEq(tokenId, "identity event token id");
                uint256(logs[i].topics[2]).assertEq(collectionId, "identity event collection");
                (uint16 schemaVersion, uint256 eventSerial) =
                    abi.decode(logs[i].data, (uint16, uint256));
                uint256(schemaVersion).assertEq(1, "identity event schema version");
                eventSerial.assertEq(serial, "identity event serial");
                (!found).assertTrue("duplicate identity event");
                identityIndex = i;
                found = true;
            }
        }
        found.assertTrue("TokenCollectionRegistered missing");
    }

    /// Locate a TokenCollectionRegistered log for a specific (tokenId, collectionId) pair.
    /// Unlike _findIdentityEventIndex this tolerates multiple registrations in one stream
    /// (e.g. an aborted id later re-registered to a different collection).
    function _findRegisteredEventIndex(
        Vm.Log[] memory logs,
        address core,
        uint256 tokenId,
        uint256 collectionId,
        uint256 serial
    ) private pure returns (uint256 index) {
        bool found;
        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].emitter == core && logs[i].topics.length == 3
                    && logs[i].topics[0] == TOKEN_COLLECTION_REGISTERED_TOPIC
                    && uint256(logs[i].topics[1]) == tokenId
                    && uint256(logs[i].topics[2]) == collectionId
            ) {
                (uint16 schemaVersion, uint256 eventSerial) =
                    abi.decode(logs[i].data, (uint16, uint256));
                uint256(schemaVersion).assertEq(1, "registered event schema version");
                eventSerial.assertEq(serial, "registered event serial");
                (!found).assertTrue("duplicate registered event for pair");
                index = i;
                found = true;
            }
        }
        found.assertTrue("TokenCollectionRegistered for pair missing");
    }

    /// Assert exactly one TokenCollectionRegistrationReverted for (tokenId, collectionId).
    function _assertRegistrationRevertedEvent(
        Vm.Log[] memory logs,
        address core,
        uint256 tokenId,
        uint256 collectionId
    ) private pure returns (uint256 index) {
        bool found;
        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].emitter == core && logs[i].topics.length == 3
                    && logs[i].topics[0] == TOKEN_COLLECTION_REGISTRATION_REVERTED_TOPIC
            ) {
                uint256(logs[i].topics[1]).assertEq(tokenId, "reverted event token id");
                uint256(logs[i].topics[2]).assertEq(collectionId, "reverted event collection");
                uint16 schemaVersion = abi.decode(logs[i].data, (uint16));
                uint256(schemaVersion).assertEq(1, "reverted event schema version");
                (!found).assertTrue("duplicate reverted event");
                index = i;
                found = true;
            }
        }
        found.assertTrue("TokenCollectionRegistrationReverted missing");
    }

    /// Event-only reconstruction: apply TokenCollectionRegistered (set mapping, +1 live) and
    /// TokenCollectionRegistrationReverted (clear mapping, -1 live) in log order for one tokenId,
    /// returning the final collection and the number of live registrations that remain.
    function _reconstructTokenCollection(Vm.Log[] memory logs, address core, uint256 tokenId)
        private
        pure
        returns (uint256 collection, uint256 liveRegistrations)
    {
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].emitter != core || logs[i].topics.length != 3) {
                continue;
            }
            if (uint256(logs[i].topics[1]) != tokenId) {
                continue;
            }
            if (logs[i].topics[0] == TOKEN_COLLECTION_REGISTERED_TOPIC) {
                collection = uint256(logs[i].topics[2]);
                liveRegistrations += 1;
            } else if (logs[i].topics[0] == TOKEN_COLLECTION_REGISTRATION_REVERTED_TOPIC) {
                collection = 0;
                liveRegistrations -= 1;
            }
        }
    }

    function _warpPastFinalSupplyWindow() private {
        vm.warp(block.timestamp + 31 days + 1);
    }
}
