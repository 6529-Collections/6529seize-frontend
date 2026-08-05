// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IStreamTimeParameterHost.sol";
import "../smart-contracts/StreamTimeParameterStore.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/GovernedParameterTestMocks.sol";

contract StreamTimeParameterStoreHarness is StreamTimeParameterStore {
    constructor(address authority, TimeParameterConfig[] memory configs)
        StreamTimeParameterStore(authority, configs)
    { }

    function forceRevision(bytes32 parameterId, uint64 revision) external {
        _timeParameters[parameterId].revision = revision;
    }
}

/// @notice Launch-v1 raise-only GTP acceptance and adversarial regressions.
contract StreamTimeParameterStoreTest is CharacterizationTestBase {
    bytes32 private constant SCOPE_DOMAIN_V2 =
        0xd14cc3d71aa1ccb50b6f723d516042b10a7ef31958f86ccb049a09dbcfefff24;
    bytes32 private constant STATE_DOMAIN_V2 =
        0x26290762a61f3dda3fad05a62e5a95dcb1c59db2eaf506cb363c2aa2ab7b8384;
    bytes32 private constant PARAMETER_ID =
        keccak256("6529STREAM_GTP_ENTROPY_REQUEST_TIMEOUT_BLOCKS");
    bytes32 private constant ACTION_ID = keccak256("raise-only-time-action");

    event TimeParameterRegistered(
        uint16 schemaVersion,
        bytes32 indexed parameterId,
        string name,
        uint256 genesisValue,
        uint256 floorBlocks,
        uint64 wallClockFloorSeconds
    );

    event TimeParameterUpdated(
        uint16 schemaVersion,
        bytes32 indexed parameterId,
        address indexed host,
        bytes32 indexed actionId,
        uint256 oldValue,
        uint256 newValue,
        uint256 floorBlocks
    );

    MockGovernedParameterAuthority private _authority;
    StreamTimeParameterStoreHarness private _store;

    function setUp() public {
        _authority = new MockGovernedParameterAuthority(true);
        _store = new StreamTimeParameterStoreHarness(address(_authority), _singleConfig());
    }

    function testRegistrationAndIntrospectionAreExact() public view {
        bytes32[] memory ids = _store.timeParameterIds();
        Assertions.assertEq(ids.length, 1, "one id");
        Assertions.assertEq(ids[0], PARAMETER_ID, "derived id");
        Assertions.assertEq(_store.timeParameter(PARAMETER_ID), 600, "genesis value");
        (uint256 value, uint256 floorBlocks, uint64 wallClockFloor, uint64 revision) =
            _store.timeParameterInfo(PARAMETER_ID);
        Assertions.assertEq(value, 600, "info value");
        Assertions.assertEq(floorBlocks, 300, "info block floor");
        Assertions.assertEq(uint256(wallClockFloor), 3_600, "info wall floor");
        Assertions.assertEq(uint256(revision), 1, "info revision");
        Assertions.assertEq(uint256(_store.TIME_PARAMETER_SCHEMA_VERSION()), 2, "schema version");

        (value, floorBlocks, wallClockFloor, revision) =
            _store.timeParameterInfo(keccak256("unknown"));
        Assertions.assertEq(value, 0, "unknown value");
        Assertions.assertEq(floorBlocks, 0, "unknown block floor");
        Assertions.assertEq(uint256(wallClockFloor), 0, "unknown wall floor");
        Assertions.assertEq(uint256(revision), 0, "unknown revision");
    }

    function testRegistrationEventUsesRaiseOnlySchema() public {
        vm.expectEmit(true, false, false, true);
        emit TimeParameterRegistered(
            2, PARAMETER_ID, "ENTROPY_REQUEST_TIMEOUT_BLOCKS", 600, 300, 3_600
        );
        new StreamTimeParameterStore(address(_authority), _singleConfig());
    }

    function testDelayedRaiseConsumesExactContextAndEmits() public {
        _setContext(_store, PARAMETER_ID, 1_200, ACTION_ID, 1);

        vm.expectEmit(true, true, true, true);
        emit TimeParameterUpdated(2, PARAMETER_ID, address(_store), ACTION_ID, 600, 1_200, 300);
        vm.prank(address(_authority));
        _store.raiseTimeParameter(PARAMETER_ID, 1_200);

        (uint256 value,,, uint64 revision) = _store.timeParameterInfo(PARAMETER_ID);
        Assertions.assertEq(value, 1_200, "raised value");
        Assertions.assertEq(uint256(revision), 2, "raised revision");
    }

    function testOneActionCannotCompoundMultipleRaisesForSameParameter() public {
        _setContext(_store, PARAMETER_ID, 1_200, ACTION_ID, 1);
        vm.prank(address(_authority));
        _store.raiseTimeParameter(PARAMETER_ID, 1_200);

        _setContext(_store, PARAMETER_ID, 2_400, ACTION_ID, 1);
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterActionAlreadyApplied.selector,
                PARAMETER_ID,
                ACTION_ID
            )
        );
        _store.raiseTimeParameter(PARAMETER_ID, 2_400);

        (uint256 value,,, uint64 revision) = _store.timeParameterInfo(PARAMETER_ID);
        Assertions.assertEq(value, 1_200, "same action cannot compound value");
        Assertions.assertEq(uint256(revision), 2, "same action cannot compound revision");
    }

    function testOnlyAuthorityCanRaiseAndZeroAuthorityIsImmutable() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterNotAuthority.selector, address(this)
            )
        );
        _store.raiseTimeParameter(PARAMETER_ID, 1_200);

        StreamTimeParameterStore immutableStore =
            new StreamTimeParameterStore(address(0), _singleConfig());
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterNotAuthority.selector, address(this)
            )
        );
        immutableStore.raiseTimeParameter(PARAMETER_ID, 1_200);
    }

    function testRaiseMustBeStrictAndAtMostDouble() public {
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterNotARaise.selector,
                PARAMETER_ID,
                uint256(600),
                uint256(600)
            )
        );
        _store.raiseTimeParameter(PARAMETER_ID, 600);

        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterNotARaise.selector,
                PARAMETER_ID,
                uint256(600),
                uint256(599)
            )
        );
        _store.raiseTimeParameter(PARAMETER_ID, 599);

        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterRaiseBoundExceeded.selector,
                PARAMETER_ID,
                uint256(600),
                uint256(1_201)
            )
        );
        _store.raiseTimeParameter(PARAMETER_ID, 1_201);
    }

    function testRevisionOverflowFailsClosed() public {
        _store.forceRevision(PARAMETER_ID, type(uint64).max);
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterRevisionOverflow.selector, PARAMETER_ID
            )
        );
        _store.raiseTimeParameter(PARAMETER_ID, 1_200);
    }

    function testExactContextRejectsInactiveZeroIdWrongClassAndHashDrift() public {
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterActionNotExecuting.selector
            )
        );
        _store.raiseTimeParameter(PARAMETER_ID, 1_200);

        _setContext(_store, PARAMETER_ID, 1_200, bytes32(0), 1);
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(IStreamTimeParameterHost.TimeParameterActionIdZero.selector)
        );
        _store.raiseTimeParameter(PARAMETER_ID, 1_200);

        _setContext(_store, PARAMETER_ID, 1_200, ACTION_ID, 2);
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterActionClassMismatch.selector,
                uint8(1),
                uint8(2)
            )
        );
        _store.raiseTimeParameter(PARAMETER_ID, 1_200);

        (bytes32 scopeHash, bytes32 oldStateHash, bytes32 newStateHash) =
            _transitionHashes(_store, PARAMETER_ID, 1_200);
        bytes32 wrongScopeHash = keccak256("wrong scope");
        _authority.setCurrentAction(true, ACTION_ID, 1, wrongScopeHash, oldStateHash, newStateHash);
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterScopeHashMismatch.selector,
                scopeHash,
                wrongScopeHash
            )
        );
        _store.raiseTimeParameter(PARAMETER_ID, 1_200);

        bytes32 wrongOldStateHash = keccak256("wrong old");
        _authority.setCurrentAction(true, ACTION_ID, 1, scopeHash, wrongOldStateHash, newStateHash);
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterOldStateHashMismatch.selector,
                oldStateHash,
                wrongOldStateHash
            )
        );
        _store.raiseTimeParameter(PARAMETER_ID, 1_200);

        bytes32 wrongNewStateHash = keccak256("wrong new");
        _authority.setCurrentAction(true, ACTION_ID, 1, scopeHash, oldStateHash, wrongNewStateHash);
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterNewStateHashMismatch.selector,
                newStateHash,
                wrongNewStateHash
            )
        );
        _store.raiseTimeParameter(PARAMETER_ID, 1_200);
    }

    function testRevisionCommitmentRejectsStaleContext() public {
        (bytes32 scopeHash, bytes32 oldStateHash, bytes32 newStateHash) =
            _transitionHashes(_store, PARAMETER_ID, 1_200);
        _authority.setCurrentAction(true, ACTION_ID, 1, scopeHash, oldStateHash, newStateHash);
        vm.prank(address(_authority));
        _store.raiseTimeParameter(PARAMETER_ID, 1_200);

        _authority.setCurrentAction(true, ACTION_ID, 1, scopeHash, oldStateHash, newStateHash);
        (, bytes32 currentOldStateHash,) = _transitionHashes(_store, PARAMETER_ID, 1_800);
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterOldStateHashMismatch.selector,
                currentOldStateHash,
                oldStateHash
            )
        );
        _store.raiseTimeParameter(PARAMETER_ID, 1_800);
    }

    function testCurrentActionReadRejectsMalformedResponsesAndForwardsAvailableGas() public {
        MockGovernedParameterAuthority.ResponseMode[5] memory modes = [
            MockGovernedParameterAuthority.ResponseMode.Reverting,
            MockGovernedParameterAuthority.ResponseMode.Short,
            MockGovernedParameterAuthority.ResponseMode.Oversized,
            MockGovernedParameterAuthority.ResponseMode.NonCanonicalExecuting,
            MockGovernedParameterAuthority.ResponseMode.NonCanonicalActionClass
        ];
        for (uint256 i = 0; i < modes.length; i++) {
            _authority.setResponseMode(modes[i]);
            vm.prank(address(_authority));
            vm.expectRevert(
                abi.encodeWithSelector(
                    IStreamTimeParameterHost.TimeParameterActionContextInvalid.selector
                )
            );
            _store.raiseTimeParameter(PARAMETER_ID, 1_200);
        }

        _authority.setResponseMode(MockGovernedParameterAuthority.ResponseMode.GasHeavy);
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterActionNotExecuting.selector
            )
        );
        _store.raiseTimeParameter(PARAMETER_ID, 1_200);
    }

    function testRemovedMutationSelectorsAreUnreachable() public {
        bytes[] memory calls = new bytes[](2);
        calls[0] = abi.encodeWithSignature("lowerTimeParameter(bytes32,uint256)", PARAMETER_ID, 300);
        calls[1] = abi.encodeWithSignature(
            "rebindTimeParameterProbe(bytes32,address)", PARAMETER_ID, address(this)
        );
        for (uint256 i = 0; i < calls.length; i++) {
            (bool ok, bytes memory returnData) = address(_store).call(calls[i]);
            Assertions.assertFalse(ok, "removed selector accepted");
            Assertions.assertEq(returnData.length, 0, "removed selector returned custom error");
        }
    }

    function testUnknownIdAndInvalidConfigurationsFailClosed() public {
        bytes32 unknown = keccak256("unknown");
        vm.expectRevert(
            abi.encodeWithSelector(IStreamTimeParameterHost.TimeParameterUnknown.selector, unknown)
        );
        _store.timeParameter(unknown);

        IStreamTimeParameterHost.TimeParameterConfig[] memory configs =
            new IStreamTimeParameterHost.TimeParameterConfig[](1);
        configs[0] = _config("", 600, 300, 3_600);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterInvalidConfig.selector, bytes32(0)
            )
        );
        new StreamTimeParameterStore(address(_authority), configs);

        configs[0] = _config("ENTROPY_REQUEST_TIMEOUT_BLOCKS", 299, 300, 3_600);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterInvalidConfig.selector, PARAMETER_ID
            )
        );
        new StreamTimeParameterStore(address(_authority), configs);

        configs[0] = _config("ENTROPY_REQUEST_TIMEOUT_BLOCKS", 600, 0, 3_600);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterInvalidConfig.selector, PARAMETER_ID
            )
        );
        new StreamTimeParameterStore(address(_authority), configs);

        configs[0] = _config("ENTROPY_REQUEST_TIMEOUT_BLOCKS", 600, 300, 0);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterInvalidConfig.selector, PARAMETER_ID
            )
        );
        new StreamTimeParameterStore(address(_authority), configs);

        IStreamTimeParameterHost.TimeParameterConfig[] memory duplicates =
            new IStreamTimeParameterHost.TimeParameterConfig[](2);
        duplicates[0] = _config("ENTROPY_REQUEST_TIMEOUT_BLOCKS", 600, 300, 3_600);
        duplicates[1] = duplicates[0];
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterAlreadyRegistered.selector, PARAMETER_ID
            )
        );
        new StreamTimeParameterStore(address(_authority), duplicates);
    }

    function testAuthorityMarkerIsExactAndForwardsAvailableGas() public {
        MockGovernedParameterAuthority invalid = new MockGovernedParameterAuthority(false);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterInvalidAuthority.selector, address(invalid)
            )
        );
        new StreamTimeParameterStore(address(invalid), _singleConfig());

        address eoa = vm.addr(0xA11CE);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterInvalidAuthority.selector, eoa
            )
        );
        new StreamTimeParameterStore(eoa, _singleConfig());

        GasHeavyGovernedParameterAuthority gasHeavy = new GasHeavyGovernedParameterAuthority();
        StreamTimeParameterStore gasHeavyStore =
            new StreamTimeParameterStore(address(gasHeavy), _singleConfig());
        Assertions.assertEq(
            gasHeavyStore.governanceAuthority(), address(gasHeavy), "gas-heavy marker accepted"
        );

        address delegated = vm.addr(0x7702);
        vm.etch(delegated, abi.encodePacked(hex"ef0100", bytes20(address(_authority))));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamTimeParameterHost.TimeParameterInvalidAuthority.selector, delegated
            )
        );
        new StreamTimeParameterStore(delegated, _singleConfig());
    }

    function testAuthorityMarkerAndContextRejectMalformedAbi() public {
        MockGovernedParameterAuthority.MarkerResponseMode[4] memory markerModes = [
            MockGovernedParameterAuthority.MarkerResponseMode.Reverting,
            MockGovernedParameterAuthority.MarkerResponseMode.Short,
            MockGovernedParameterAuthority.MarkerResponseMode.Oversized,
            MockGovernedParameterAuthority.MarkerResponseMode.NonCanonical
        ];
        for (uint256 i = 0; i < markerModes.length; i++) {
            MockGovernedParameterAuthority malformedMarker =
                new MockGovernedParameterAuthority(true);
            malformedMarker.setMarkerResponseMode(markerModes[i]);
            vm.expectRevert(
                abi.encodeWithSelector(
                    IStreamTimeParameterHost.TimeParameterInvalidAuthority.selector,
                    address(malformedMarker)
                )
            );
            new StreamTimeParameterStore(address(malformedMarker), _singleConfig());
        }

        MockGovernedParameterAuthority.ResponseMode[5] memory contextModes = [
            MockGovernedParameterAuthority.ResponseMode.Reverting,
            MockGovernedParameterAuthority.ResponseMode.Short,
            MockGovernedParameterAuthority.ResponseMode.Oversized,
            MockGovernedParameterAuthority.ResponseMode.NonCanonicalExecuting,
            MockGovernedParameterAuthority.ResponseMode.NonCanonicalActionClass
        ];
        for (uint256 i = 0; i < contextModes.length; i++) {
            MockGovernedParameterAuthority malformedContext =
                new MockGovernedParameterAuthority(true);
            malformedContext.setResponseMode(contextModes[i]);
            vm.expectRevert(
                abi.encodeWithSelector(
                    IStreamTimeParameterHost.TimeParameterInvalidAuthority.selector,
                    address(malformedContext)
                )
            );
            new StreamTimeParameterStore(address(malformedContext), _singleConfig());
        }
    }

    function _setContext(
        StreamTimeParameterStore store,
        bytes32 parameterId,
        uint256 newValue,
        bytes32 actionId,
        uint8 actionClass
    ) private {
        (bytes32 scopeHash, bytes32 oldStateHash, bytes32 newStateHash) =
            _transitionHashes(store, parameterId, newValue);
        _authority.setCurrentAction(
            true, actionId, actionClass, scopeHash, oldStateHash, newStateHash
        );
    }

    function _transitionHashes(
        StreamTimeParameterStore store,
        bytes32 parameterId,
        uint256 newValue
    ) private view returns (bytes32 scopeHash, bytes32 oldStateHash, bytes32 newStateHash) {
        (uint256 value, uint256 floorBlocks, uint64 wallClockFloor, uint64 revision) =
            store.timeParameterInfo(parameterId);
        scopeHash =
            keccak256(abi.encode(SCOPE_DOMAIN_V2, block.chainid, address(store), parameterId));
        oldStateHash = keccak256(
            abi.encode(STATE_DOMAIN_V2, scopeHash, value, floorBlocks, wallClockFloor, revision)
        );
        newStateHash = keccak256(
            abi.encode(
                STATE_DOMAIN_V2, scopeHash, newValue, floorBlocks, wallClockFloor, revision + 1
            )
        );
    }

    function _singleConfig()
        private
        pure
        returns (IStreamTimeParameterHost.TimeParameterConfig[] memory configs)
    {
        configs = new IStreamTimeParameterHost.TimeParameterConfig[](1);
        configs[0] = _config("ENTROPY_REQUEST_TIMEOUT_BLOCKS", 600, 300, 3_600);
    }

    function _config(
        string memory name,
        uint256 genesisValue,
        uint256 floorBlocks,
        uint64 wallClockFloorSeconds
    ) private pure returns (IStreamTimeParameterHost.TimeParameterConfig memory) {
        return IStreamTimeParameterHost.TimeParameterConfig({
            name: name,
            genesisValue: genesisValue,
            floorBlocks: floorBlocks,
            wallClockFloorSeconds: wallClockFloorSeconds
        });
    }
}
