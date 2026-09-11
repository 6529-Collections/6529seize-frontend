// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IStreamArtworkFinalityRegistry.sol";
import "../smart-contracts/StreamArtworkFinalityTypes.sol";
import "./helpers/Assertions.sol";
import "./helpers/FinalityTestBase.sol";

/// @notice Freeze-machine coverage: the single governed TERMINAL_FREEZE path with its delay
///         classes ([LTA-FREEZE] rule 4, [GOV-WINDOWS]) and the freeze-mode vocabulary report.
contract StreamArtworkFinalityFreezeTest is FinalityTestBase {
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;
    using Assertions for address;

    bytes32 private constant EXPECTED_HASH = keccak256("expected-finality-record");

    event ArtworkTerminalFreezeScheduled(
        uint16 schemaVersion,
        uint8 indexed scopeType,
        uint256 indexed collectionId,
        bytes32 indexed scopeKey,
        uint256 tokenId,
        bytes32 scopeId,
        bytes32 expectedFinalityRecordHash,
        uint64 notBefore,
        uint64 expiresAfter,
        address vetoGuardian,
        address scheduler
    );

    event ArtworkTerminalFreezeVetoed(
        uint16 schemaVersion,
        bytes32 indexed scopeKey,
        bytes32 expectedFinalityRecordHash,
        bytes32 reasonHash,
        address indexed guardian
    );

    event ArtworkTerminalFreezeCancelled(
        uint16 schemaVersion,
        bytes32 indexed scopeKey,
        bytes32 expectedFinalityRecordHash,
        bytes32 reasonHash,
        address indexed canceller
    );

    event ArtworkTerminalFreezeExpired(
        uint16 schemaVersion, bytes32 indexed scopeKey, bytes32 expectedFinalityRecordHash
    );

    function _defaultWindow() private view returns (uint64 notBefore, uint64 expiresAfter) {
        notBefore = uint64(block.timestamp) + registry.TERMINAL_FREEZE_VETO_FLOOR();
        expiresAfter = notBefore + registry.TERMINAL_FREEZE_EXECUTION_WINDOW_FLOOR();
    }

    function _schedule(StreamFinalityScope memory scope)
        private
        returns (uint64 notBefore, uint64 expiresAfter)
    {
        (notBefore, expiresAfter) = _defaultWindow();
        vm.prank(finalityAdmin);
        registry.scheduleArtworkTerminalFreeze(scope, EXPECTED_HASH, notBefore, expiresAfter);
    }

    // ------------------------------------------------------------------
    // Scheduling
    // ------------------------------------------------------------------

    function testScheduleRequiresFinalityAdminRole() public {
        StreamFinalityScope memory scope = _collectionScope(COLLECTION_ID);
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        vm.prank(outsider);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityCallerNotFinalityAdmin.selector, outsider
            )
        );
        registry.scheduleArtworkTerminalFreeze(scope, EXPECTED_HASH, notBefore, expiresAfter);
    }

    function testScheduleEnforcesVetoFloorAndWindowFloor() public {
        StreamFinalityScope memory scope = _collectionScope(COLLECTION_ID);
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();

        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityFreezeDelayTooShort.selector,
                notBefore - 1,
                notBefore
            )
        );
        registry.scheduleArtworkTerminalFreeze(scope, EXPECTED_HASH, notBefore - 1, expiresAfter);

        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityFreezeWindowTooShort.selector,
                expiresAfter - 1,
                expiresAfter
            )
        );
        registry.scheduleArtworkTerminalFreeze(scope, EXPECTED_HASH, notBefore, expiresAfter - 1);

        // Exactly at both floors is accepted and evented with schemaVersion 1.
        vm.expectEmit(true, true, true, true);
        emit ArtworkTerminalFreezeScheduled(
            1,
            uint8(StreamFinalityScopeType.COLLECTION),
            COLLECTION_ID,
            _scopeKeyOf(scope),
            0,
            bytes32(0),
            EXPECTED_HASH,
            notBefore,
            expiresAfter,
            guardian,
            finalityAdmin
        );
        vm.prank(finalityAdmin);
        registry.scheduleArtworkTerminalFreeze(scope, EXPECTED_HASH, notBefore, expiresAfter);

        StreamTerminalFreezeAction memory action = registry.artworkTerminalFreezeAction(scope);
        uint256(uint8(action.status))
            .assertEq(uint256(uint8(StreamTerminalFreezeStatus.SCHEDULED)), "scheduled");
        action.expectedFinalityRecordHash.assertEq(EXPECTED_HASH, "staged hash");
        uint256(action.notBefore).assertEq(notBefore, "notBefore");
        uint256(action.expiresAfter).assertEq(expiresAfter, "expiresAfter");
        action.scheduler.assertEq(finalityAdmin, "scheduler");
        action.vetoGuardianAtScheduling.assertEq(guardian, "guardian snapshot");
    }

    function testScheduleRejectsZeroHashBadShapeAndMissingGuardian() public {
        StreamFinalityScope memory scope = _collectionScope(COLLECTION_ID);
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();

        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityExpectedRecordHashZero.selector
            )
        );
        registry.scheduleArtworkTerminalFreeze(scope, bytes32(0), notBefore, expiresAfter);

        StreamFinalityScope memory malformed = _collectionScope(COLLECTION_ID);
        malformed.tokenId = 5; // COLLECTION scope requires tokenId == 0 (scope rule 1)
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityScopeShapeInvalid.selector
            )
        );
        registry.scheduleArtworkTerminalFreeze(malformed, EXPECTED_HASH, notBefore, expiresAfter);

        // A terminal freeze with no independent veto authority must not be schedulable.
        authority.setDefaultGuardian(address(0));
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityFreezeGuardianUnset.selector,
                _scopeKeyOf(scope)
            )
        );
        registry.scheduleArtworkTerminalFreeze(scope, EXPECTED_HASH, notBefore, expiresAfter);
    }

    function testScheduleRejectsDoubleSchedulingWhileLive() public {
        StreamFinalityScope memory scope = _collectionScope(COLLECTION_ID);
        _schedule(scope);
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityFreezeAlreadyScheduled.selector,
                _scopeKeyOf(scope)
            )
        );
        registry.scheduleArtworkTerminalFreeze(scope, EXPECTED_HASH, notBefore, expiresAfter);
    }

    // ------------------------------------------------------------------
    // Veto
    // ------------------------------------------------------------------

    function testVetoOnlyGuardianOnlyDuringWindow() public {
        StreamFinalityScope memory scope = _collectionScope(COLLECTION_ID);
        (uint64 notBefore,) = _schedule(scope);

        // The finality admin cannot veto: independence of the two authorities.
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityCallerNotVetoGuardian.selector,
                finalityAdmin,
                guardian
            )
        );
        registry.vetoArtworkTerminalFreeze(scope, keccak256("reason"));

        // Guardian veto succeeds inside the window and is evented.
        vm.expectEmit(true, true, true, true);
        emit ArtworkTerminalFreezeVetoed(
            1, _scopeKeyOf(scope), EXPECTED_HASH, keccak256("compromised key"), guardian
        );
        vm.prank(guardian);
        registry.vetoArtworkTerminalFreeze(scope, keccak256("compromised key"));

        StreamTerminalFreezeAction memory action = registry.artworkTerminalFreezeAction(scope);
        uint256(uint8(action.status))
            .assertEq(uint256(uint8(StreamTerminalFreezeStatus.VETOED)), "vetoed");

        // A vetoed action is terminal: no second veto, no cancel, no execution.
        vm.prank(guardian);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityFreezeNotScheduled.selector,
                _scopeKeyOf(scope)
            )
        );
        registry.vetoArtworkTerminalFreeze(scope, keccak256("again"));

        // Re-staging after a veto is allowed (fresh action, fresh windows).
        (uint64 notBefore2, uint64 expiresAfter2) = _defaultWindow();
        vm.prank(finalityAdmin);
        registry.scheduleArtworkTerminalFreeze(scope, EXPECTED_HASH, notBefore2, expiresAfter2);
        notBefore; // silence unused warning
    }

    function testVetoWindowClosesAtNotBefore() public {
        StreamFinalityScope memory scope = _collectionScope(COLLECTION_ID);
        (uint64 notBefore,) = _schedule(scope);
        vm.warp(notBefore);
        vm.prank(guardian);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityFreezeVetoWindowClosed.selector, notBefore
            )
        );
        registry.vetoArtworkTerminalFreeze(scope, keccak256("late"));
    }

    function testVetoGuardianIsReResolvedAtVetoTime() public {
        StreamFinalityScope memory scope = _collectionScope(COLLECTION_ID);
        _schedule(scope);
        address rotatedGuardian = address(0x60A2D2);
        authority.setDefaultGuardian(rotatedGuardian);

        // The old guardian address captured at scheduling no longer authorizes.
        vm.prank(guardian);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityCallerNotVetoGuardian.selector,
                guardian,
                rotatedGuardian
            )
        );
        registry.vetoArtworkTerminalFreeze(scope, keccak256("stale guardian"));

        vm.prank(rotatedGuardian);
        registry.vetoArtworkTerminalFreeze(scope, keccak256("rotated guardian"));
    }

    // ------------------------------------------------------------------
    // Cancellation and expiry
    // ------------------------------------------------------------------

    function testCancelRequiresRoleAndLiveAction() public {
        StreamFinalityScope memory scope = _collectionScope(COLLECTION_ID);
        _schedule(scope);

        vm.prank(outsider);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityCallerNotFinalityAdmin.selector, outsider
            )
        );
        registry.cancelArtworkTerminalFreeze(scope, keccak256("reason"));

        vm.expectEmit(true, true, true, true);
        emit ArtworkTerminalFreezeCancelled(
            1, _scopeKeyOf(scope), EXPECTED_HASH, keccak256("changed plans"), finalityAdmin
        );
        vm.prank(finalityAdmin);
        registry.cancelArtworkTerminalFreeze(scope, keccak256("changed plans"));

        uint256(uint8(registry.artworkTerminalFreezeAction(scope).status))
            .assertEq(uint256(uint8(StreamTerminalFreezeStatus.CANCELLED)), "cancelled");

        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityFreezeNotScheduled.selector,
                _scopeKeyOf(scope)
            )
        );
        registry.cancelArtworkTerminalFreeze(scope, keccak256("twice"));
    }

    function testExpiryMaterializationAndRestaging() public {
        StreamFinalityScope memory scope = _collectionScope(COLLECTION_ID);
        (, uint64 expiresAfter) = _schedule(scope);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityFreezeNotExpired.selector, _scopeKeyOf(scope)
            )
        );
        registry.materializeExpiredArtworkTerminalFreeze(scope);

        vm.warp(uint256(expiresAfter) + 1);

        // A virtually expired action can no longer be cancelled; it is materialized EXPIRED.
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityFreezeNotScheduled.selector,
                _scopeKeyOf(scope)
            )
        );
        registry.cancelArtworkTerminalFreeze(scope, keccak256("too late"));

        vm.expectEmit(true, true, true, true);
        emit ArtworkTerminalFreezeExpired(1, _scopeKeyOf(scope), EXPECTED_HASH);
        vm.prank(outsider); // permissionless materialization
        registry.materializeExpiredArtworkTerminalFreeze(scope);
        uint256(uint8(registry.artworkTerminalFreezeAction(scope).status))
            .assertEq(uint256(uint8(StreamTerminalFreezeStatus.EXPIRED)), "expired");

        // Re-staging after expiry works.
        _schedule(scope);
        uint256(uint8(registry.artworkTerminalFreezeAction(scope).status))
            .assertEq(uint256(uint8(StreamTerminalFreezeStatus.SCHEDULED)), "re-staged");
    }

    function testScheduleAutoMaterializesOverdueAction() public {
        StreamFinalityScope memory scope = _collectionScope(COLLECTION_ID);
        (, uint64 expiresAfter) = _schedule(scope);
        vm.warp(uint256(expiresAfter) + 1);

        // Scheduling over a virtually expired action first materializes EXPIRED, then stages.
        (uint64 notBefore2, uint64 expiresAfter2) = _defaultWindow();
        vm.expectEmit(true, true, true, true);
        emit ArtworkTerminalFreezeExpired(1, _scopeKeyOf(scope), EXPECTED_HASH);
        vm.prank(finalityAdmin);
        registry.scheduleArtworkTerminalFreeze(scope, EXPECTED_HASH, notBefore2, expiresAfter2);
        uint256(uint8(registry.artworkTerminalFreezeAction(scope).status))
            .assertEq(
                uint256(uint8(StreamTerminalFreezeStatus.SCHEDULED)), "restaged after auto-expiry"
            );
    }

    // ------------------------------------------------------------------
    // Execution windows (through real finalization fixtures)
    // ------------------------------------------------------------------

    function testFinalizeRevertsWithoutStagedActionAndOutsideWindow() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);

        // No staged action at all.
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityFreezeNotScheduled.selector, fixture.scopeKey
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // Staged but before notBefore: the veto window is still open.
        uint64 notBefore = uint64(block.timestamp) + registry.TERMINAL_FREEZE_VETO_FLOOR();
        uint64 expiresAfter = notBefore + registry.TERMINAL_FREEZE_EXECUTION_WINDOW_FLOOR();
        vm.prank(finalityAdmin);
        registry.scheduleArtworkTerminalFreeze(
            fixture.scope, fixture.expectedFinalityRecordHash, notBefore, expiresAfter
        );
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityFreezeNotOpen.selector,
                notBefore,
                expiresAfter
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // After expiresAfter: the open-to-execute window has closed.
        vm.warp(uint256(expiresAfter) + 1);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityFreezeNotOpen.selector,
                notBefore,
                expiresAfter
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );
    }

    function testFinalizeRejectsStagedHashMismatch() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        uint64 notBefore = uint64(block.timestamp) + registry.TERMINAL_FREEZE_VETO_FLOOR();
        uint64 expiresAfter = notBefore + registry.TERMINAL_FREEZE_EXECUTION_WINDOW_FLOOR();
        vm.prank(finalityAdmin);
        registry.scheduleArtworkTerminalFreeze(
            fixture.scope, keccak256("some other record"), notBefore, expiresAfter
        );
        vm.warp(notBefore);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityStagedHashMismatch.selector,
                keccak256("some other record"),
                fixture.expectedFinalityRecordHash
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );
    }

    function testExecutionBlockedIfGuardianClearedAfterScheduling() public {
        // Defense in depth ([LTA-FREEZE] rule 4): an irreversible terminal freeze must retain an
        // exercisable veto through its whole window. Clearing the guardian after scheduling must
        // block execution, not let it finalize with no live veto authority.
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        uint64 nb = uint64(block.timestamp) + registry.TERMINAL_FREEZE_VETO_FLOOR();
        uint64 ea = nb + registry.TERMINAL_FREEZE_EXECUTION_WINDOW_FLOOR();
        vm.prank(finalityAdmin);
        registry.scheduleArtworkTerminalFreeze(
            fixture.scope, fixture.expectedFinalityRecordHash, nb, ea
        );
        authority.setDefaultGuardian(address(0));
        vm.warp(nb);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityFreezeGuardianUnset.selector,
                fixture.scopeKey
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );

        // Restoring a guardian lets execution proceed.
        authority.setDefaultGuardian(guardian);
        vm.prank(finalityAdmin);
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );
        registry.collectionFinalityRecord(COLLECTION_ID).finalized
            .assertTrue("finalized once guardian restored");
    }

    function testVetoedActionBlocksExecutionForever() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        uint64 notBefore = uint64(block.timestamp) + registry.TERMINAL_FREEZE_VETO_FLOOR();
        uint64 expiresAfter = notBefore + registry.TERMINAL_FREEZE_EXECUTION_WINDOW_FLOOR();
        vm.prank(finalityAdmin);
        registry.scheduleArtworkTerminalFreeze(
            fixture.scope, fixture.expectedFinalityRecordHash, notBefore, expiresAfter
        );
        vm.prank(guardian);
        registry.vetoArtworkTerminalFreeze(fixture.scope, keccak256("veto"));
        vm.warp(notBefore);
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityFreezeNotScheduled.selector, fixture.scopeKey
            )
        );
        registry.finalizeCollectionArtwork(
            COLLECTION_ID, fixture.components, fixture.expectedFinalityRecordHash, fixture.manifest
        );
    }

    // ------------------------------------------------------------------
    // Freeze-mode vocabulary report ([LTA-FREEZE])
    // ------------------------------------------------------------------

    function testFreezeModeLifecyclePerScope() public {
        StreamFinalityScope memory collectionScope = _collectionScope(COLLECTION_ID);
        StreamFinalityScope memory tokenScope = _tokenScope(COLLECTION_ID, 3);
        StreamFinalityScope memory releaseScope =
            _idScope(StreamFinalityScopeType.RELEASE, COLLECTION_ID, keccak256("release-1"));

        // NONE before any record exists.
        uint256(uint8(registry.artworkFreezeMode(collectionScope)))
            .assertEq(uint256(uint8(StreamArtworkFreezeMode.NONE)), "collection NONE");
        uint256(uint8(registry.artworkFreezeMode(tokenScope)))
            .assertEq(uint256(uint8(StreamArtworkFreezeMode.NONE)), "token NONE");

        // TOKEN-scope finality freezes exactly that key.
        Fixture memory tokenFixture = _buildFixture(tokenScope, true);
        _executeFixture(tokenFixture);
        uint256(uint8(registry.artworkFreezeMode(tokenScope)))
            .assertEq(uint256(uint8(StreamArtworkFreezeMode.EXACT)), "token EXACT");
        uint256(uint8(registry.artworkFreezeMode(releaseScope)))
            .assertEq(uint256(uint8(StreamArtworkFreezeMode.NONE)), "release still NONE");
        uint256(uint8(registry.artworkFreezeMode(collectionScope)))
            .assertEq(uint256(uint8(StreamArtworkFreezeMode.NONE)), "collection still NONE");

        // Collection finality freezes the exact key and blocks every lower scope: INHERITED.
        Fixture memory collectionFixture = _buildFixture(collectionScope, true);
        _executeFixture(collectionFixture);
        uint256(uint8(registry.artworkFreezeMode(collectionScope)))
            .assertEq(uint256(uint8(StreamArtworkFreezeMode.INHERITED)), "collection INHERITED");
        uint256(uint8(registry.artworkFreezeMode(releaseScope)))
            .assertEq(uint256(uint8(StreamArtworkFreezeMode.INHERITED)), "release INHERITED");
        // A scope with its own executed record reports EXACT over the inherited freeze.
        uint256(uint8(registry.artworkFreezeMode(tokenScope)))
            .assertEq(uint256(uint8(StreamArtworkFreezeMode.EXACT)), "token EXACT precedence");

        // Unrelated collections stay NONE.
        uint256(uint8(registry.artworkFreezeMode(_collectionScope(COLLECTION_ID + 1))))
            .assertEq(uint256(uint8(StreamArtworkFreezeMode.NONE)), "other collection NONE");
    }

    function testScheduleBlockedOnceScopeFinalized() public {
        Fixture memory fixture = _buildFixture(_collectionScope(COLLECTION_ID), true);
        _executeFixture(fixture);
        (uint64 notBefore, uint64 expiresAfter) = _defaultWindow();
        vm.prank(finalityAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtworkFinalityRegistry.FinalityAlreadyFinalized.selector, fixture.scopeKey
            )
        );
        registry.scheduleArtworkTerminalFreeze(
            fixture.scope, keccak256("new attempt"), notBefore, expiresAfter
        );
    }
}
