// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IStreamGasParameterHost.sol";
import "../smart-contracts/StreamGasParameterStore.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/GovernedParameterTestMocks.sol";

contract StreamGasParameterStoreHarness is StreamGasParameterStore {
    constructor(address authority, GasParameterConfig[] memory configs)
        StreamGasParameterStore(authority, configs)
    { }

    function forceRevision(bytes32 parameterId, uint64 revision) external {
        _gasParameters[parameterId].revision = revision;
    }
}

/// @notice Launch-v1 raise-only GGP acceptance and adversarial regressions.
contract StreamGasParameterStoreTest is CharacterizationTestBase {
    bytes32 private constant SCOPE_DOMAIN_V2 =
        0x9533611d402c2b44cf950a4a8900d25f6829bfac541dc4d5353094f966bb1a71;
    bytes32 private constant STATE_DOMAIN_V2 =
        0x5059a253d3f7dd63b5d9fd1f0568caf72967f501a3db678b31cefe911334159c;
    bytes32 private constant PARAMETER_ID = keccak256("6529STREAM_GGP_ROYALTY_RESOLVER_GAS_LIMIT");
    bytes32 private constant ACTION_ID = keccak256("raise-only-gas-action");

    event GasParameterRegistered(
        uint16 schemaVersion,
        bytes32 indexed parameterId,
        string name,
        uint256 genesisValue,
        uint256 floor,
        uint8 failureClass
    );

    event GasParameterUpdated(
        uint16 schemaVersion,
        bytes32 indexed parameterId,
        address indexed host,
        bytes32 indexed actionId,
        uint256 oldValue,
        uint256 newValue,
        uint256 floor
    );

    MockGovernedParameterAuthority private _authority;
    StreamGasParameterStoreHarness private _store;

    function setUp() public {
        _authority = new MockGovernedParameterAuthority(true);
        _store = new StreamGasParameterStoreHarness(address(_authority), _singleConfig());
    }

    function testRegistrationAndIntrospectionAreExact() public view {
        bytes32[] memory ids = _store.gasParameterIds();
        Assertions.assertEq(ids.length, 1, "one id");
        Assertions.assertEq(ids[0], PARAMETER_ID, "derived id");
        Assertions.assertEq(_store.gasParameter(PARAMETER_ID), 60_000, "genesis storage value");
        (uint256 value, uint256 floor, uint8 failureClass, uint64 revision) =
            _store.gasParameterInfo(PARAMETER_ID);
        Assertions.assertEq(value, 60_000, "info value");
        Assertions.assertEq(floor, 20_000, "info floor");
        Assertions.assertEq(uint256(failureClass), 1, "info class");
        Assertions.assertEq(uint256(revision), 1, "info revision");
        Assertions.assertEq(uint256(_store.GAS_PARAMETER_SCHEMA_VERSION()), 2, "schema version");

        (value, floor, failureClass, revision) = _store.gasParameterInfo(keccak256("unknown"));
        Assertions.assertEq(value, 0, "unknown value");
        Assertions.assertEq(floor, 0, "unknown floor");
        Assertions.assertEq(uint256(failureClass), 0, "unknown class");
        Assertions.assertEq(uint256(revision), 0, "unknown revision");
    }

    function testRegistrationEventUsesRaiseOnlySchema() public {
        vm.expectEmit(true, false, false, true);
        emit GasParameterRegistered(
            2, PARAMETER_ID, "ROYALTY_RESOLVER_GAS_LIMIT", 60_000, 20_000, 1
        );
        new StreamGasParameterStore(address(_authority), _singleConfig());
    }

    function testDelayedRaiseConsumesExactContextAndEmits() public {
        _setContext(_store, PARAMETER_ID, 120_000, ACTION_ID, 1);

        vm.expectEmit(true, true, true, true);
        emit GasParameterUpdated(
            2, PARAMETER_ID, address(_store), ACTION_ID, 60_000, 120_000, 20_000
        );
        vm.prank(address(_authority));
        _store.raiseGasParameter(PARAMETER_ID, 120_000);

        (uint256 value,,, uint64 revision) = _store.gasParameterInfo(PARAMETER_ID);
        Assertions.assertEq(value, 120_000, "raised value");
        Assertions.assertEq(uint256(revision), 2, "raised revision");
    }

    function testRepeatedBoundedRaisesRemainAvailable() public {
        _setContext(_store, PARAMETER_ID, 120_000, ACTION_ID, 1);
        vm.prank(address(_authority));
        _store.raiseGasParameter(PARAMETER_ID, 120_000);

        bytes32 secondActionId = keccak256("second raise");
        _setContext(_store, PARAMETER_ID, 180_000, secondActionId, 1);
        vm.prank(address(_authority));
        _store.raiseGasParameter(PARAMETER_ID, 180_000);

        (uint256 value,,, uint64 revision) = _store.gasParameterInfo(PARAMETER_ID);
        Assertions.assertEq(value, 180_000, "second value");
        Assertions.assertEq(uint256(revision), 3, "second revision");
    }

    function testOneActionCannotCompoundMultipleRaisesForSameParameter() public {
        _setContext(_store, PARAMETER_ID, 120_000, ACTION_ID, 1);
        vm.prank(address(_authority));
        _store.raiseGasParameter(PARAMETER_ID, 120_000);

        _setContext(_store, PARAMETER_ID, 240_000, ACTION_ID, 1);
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterActionAlreadyApplied.selector,
                PARAMETER_ID,
                ACTION_ID
            )
        );
        _store.raiseGasParameter(PARAMETER_ID, 240_000);

        (uint256 value,,, uint64 revision) = _store.gasParameterInfo(PARAMETER_ID);
        Assertions.assertEq(value, 120_000, "same action cannot compound value");
        Assertions.assertEq(uint256(revision), 2, "same action cannot compound revision");
    }

    function testOnlyAuthorityCanRaiseAndZeroAuthorityIsImmutable() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterNotAuthority.selector, address(this)
            )
        );
        _store.raiseGasParameter(PARAMETER_ID, 120_000);

        StreamGasParameterStore immutableStore =
            new StreamGasParameterStore(address(0), _singleConfig());
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterNotAuthority.selector, address(this)
            )
        );
        immutableStore.raiseGasParameter(PARAMETER_ID, 120_000);
    }

    function testRaiseMustBeStrictAndAtMostDouble() public {
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterNotARaise.selector,
                PARAMETER_ID,
                uint256(60_000),
                uint256(60_000)
            )
        );
        _store.raiseGasParameter(PARAMETER_ID, 60_000);

        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterNotARaise.selector,
                PARAMETER_ID,
                uint256(60_000),
                uint256(59_999)
            )
        );
        _store.raiseGasParameter(PARAMETER_ID, 59_999);

        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterRaiseBoundExceeded.selector,
                PARAMETER_ID,
                uint256(60_000),
                uint256(120_001)
            )
        );
        _store.raiseGasParameter(PARAMETER_ID, 120_001);
    }

    function testRevisionOverflowFailsClosed() public {
        _store.forceRevision(PARAMETER_ID, type(uint64).max);
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterRevisionOverflow.selector, PARAMETER_ID
            )
        );
        _store.raiseGasParameter(PARAMETER_ID, 120_000);
    }

    function testExactContextRejectsInactiveZeroIdWrongClassAndHashDrift() public {
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGasParameterHost.GasParameterActionNotExecuting.selector)
        );
        _store.raiseGasParameter(PARAMETER_ID, 120_000);

        _setContext(_store, PARAMETER_ID, 120_000, bytes32(0), 1);
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGasParameterHost.GasParameterActionIdZero.selector)
        );
        _store.raiseGasParameter(PARAMETER_ID, 120_000);

        _setContext(_store, PARAMETER_ID, 120_000, ACTION_ID, 0);
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterActionClassMismatch.selector, uint8(1), uint8(0)
            )
        );
        _store.raiseGasParameter(PARAMETER_ID, 120_000);

        _setContext(_store, PARAMETER_ID, 120_000, ACTION_ID, 1);
        (bytes32 expectedScopeHash,,) = _transitionHashes(_store, PARAMETER_ID, 120_000);
        bytes32 wrongScopeHash = keccak256("wrong scope");
        _authority.setCurrentAction(true, ACTION_ID, 1, wrongScopeHash, bytes32(0), bytes32(0));
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterScopeHashMismatch.selector,
                expectedScopeHash,
                wrongScopeHash
            )
        );
        _store.raiseGasParameter(PARAMETER_ID, 120_000);

        (bytes32 scopeHash, bytes32 oldStateHash, bytes32 newStateHash) =
            _transitionHashes(_store, PARAMETER_ID, 120_000);
        bytes32 wrongOldStateHash = keccak256("wrong old");
        _authority.setCurrentAction(true, ACTION_ID, 1, scopeHash, wrongOldStateHash, newStateHash);
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterOldStateHashMismatch.selector,
                oldStateHash,
                wrongOldStateHash
            )
        );
        _store.raiseGasParameter(PARAMETER_ID, 120_000);

        bytes32 wrongNewStateHash = keccak256("wrong new");
        _authority.setCurrentAction(true, ACTION_ID, 1, scopeHash, oldStateHash, wrongNewStateHash);
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterNewStateHashMismatch.selector,
                newStateHash,
                wrongNewStateHash
            )
        );
        _store.raiseGasParameter(PARAMETER_ID, 120_000);
    }

    function testRevisionCommitmentRejectsAbaAndStaleContext() public {
        (bytes32 scopeHash, bytes32 oldStateHash, bytes32 newStateHash) =
            _transitionHashes(_store, PARAMETER_ID, 120_000);
        _authority.setCurrentAction(true, ACTION_ID, 1, scopeHash, oldStateHash, newStateHash);
        vm.prank(address(_authority));
        _store.raiseGasParameter(PARAMETER_ID, 120_000);

        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterNotARaise.selector,
                PARAMETER_ID,
                uint256(120_000),
                uint256(120_000)
            )
        );
        _store.raiseGasParameter(PARAMETER_ID, 120_000);

        _authority.setCurrentAction(true, ACTION_ID, 1, scopeHash, oldStateHash, newStateHash);
        (, bytes32 currentOldStateHash,) = _transitionHashes(_store, PARAMETER_ID, 180_000);
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterOldStateHashMismatch.selector,
                currentOldStateHash,
                oldStateHash
            )
        );
        _store.raiseGasParameter(PARAMETER_ID, 180_000);
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
                    IStreamGasParameterHost.GasParameterActionContextInvalid.selector
                )
            );
            _store.raiseGasParameter(PARAMETER_ID, 120_000);
        }

        _authority.setResponseMode(MockGovernedParameterAuthority.ResponseMode.GasHeavy);
        vm.prank(address(_authority));
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGasParameterHost.GasParameterActionNotExecuting.selector)
        );
        _store.raiseGasParameter(PARAMETER_ID, 120_000);
    }

    function testRemovedMutationSelectorsAreUnreachable() public {
        bytes[] memory calls = new bytes[](5);
        calls[0] = abi.encodeWithSignature(
            "emergencyRaiseGasParameter(bytes32,uint256)", PARAMETER_ID, uint256(120_000)
        );
        calls[1] =
            abi.encodeWithSignature("lowerGasParameter(bytes32,uint256)", PARAMETER_ID, 20_000);
        calls[2] = abi.encodeWithSignature(
            "rebindGasParameterProbe(bytes32,address)", PARAMETER_ID, address(this)
        );
        calls[3] = abi.encodeWithSignature(
            "conditionalRaiseGasParameter(bytes32,uint256)", PARAMETER_ID, uint256(120_000)
        );
        calls[4] = abi.encodeWithSignature(
            "conditionalRelowerGasParameter(bytes32,uint256)", PARAMETER_ID, uint256(20_000)
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
            abi.encodeWithSelector(IStreamGasParameterHost.GasParameterUnknown.selector, unknown)
        );
        _store.gasParameter(unknown);

        IStreamGasParameterHost.GasParameterConfig[] memory configs =
            new IStreamGasParameterHost.GasParameterConfig[](1);
        configs[0] = _config("", 60_000, 20_000, 1);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterInvalidConfig.selector, bytes32(0)
            )
        );
        new StreamGasParameterStore(address(_authority), configs);

        configs[0] = _config("ROYALTY_RESOLVER_GAS_LIMIT", 19_999, 20_000, 1);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterInvalidConfig.selector, PARAMETER_ID
            )
        );
        new StreamGasParameterStore(address(_authority), configs);

        configs[0] = _config("ROYALTY_RESOLVER_GAS_LIMIT", 60_000, 0, 1);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterInvalidConfig.selector, PARAMETER_ID
            )
        );
        new StreamGasParameterStore(address(_authority), configs);

        configs[0] = _config("ROYALTY_RESOLVER_GAS_LIMIT", 60_000, 20_000, 0);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterInvalidConfig.selector, PARAMETER_ID
            )
        );
        new StreamGasParameterStore(address(_authority), configs);

        configs[0] = _config("ROYALTY_RESOLVER_GAS_LIMIT", 60_000, 20_000, 4);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterInvalidConfig.selector, PARAMETER_ID
            )
        );
        new StreamGasParameterStore(address(_authority), configs);

        IStreamGasParameterHost.GasParameterConfig[] memory duplicates =
            new IStreamGasParameterHost.GasParameterConfig[](2);
        duplicates[0] = _config("ROYALTY_RESOLVER_GAS_LIMIT", 60_000, 20_000, 1);
        duplicates[1] = duplicates[0];
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterAlreadyRegistered.selector, PARAMETER_ID
            )
        );
        new StreamGasParameterStore(address(_authority), duplicates);
    }

    function testAuthorityMarkerIsExactAndForwardsAvailableGas() public {
        MockGovernedParameterAuthority invalid = new MockGovernedParameterAuthority(false);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterInvalidAuthority.selector, address(invalid)
            )
        );
        new StreamGasParameterStore(address(invalid), _singleConfig());

        address eoa = vm.addr(0xA11CE);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterInvalidAuthority.selector, eoa
            )
        );
        new StreamGasParameterStore(eoa, _singleConfig());

        GasHeavyGovernedParameterAuthority gasHeavy = new GasHeavyGovernedParameterAuthority();
        StreamGasParameterStore gasHeavyStore =
            new StreamGasParameterStore(address(gasHeavy), _singleConfig());
        Assertions.assertEq(
            gasHeavyStore.governanceAuthority(), address(gasHeavy), "gas-heavy marker accepted"
        );

        address delegated = vm.addr(0x7702);
        vm.etch(delegated, abi.encodePacked(hex"ef0100", bytes20(address(_authority))));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGasParameterHost.GasParameterInvalidAuthority.selector, delegated
            )
        );
        new StreamGasParameterStore(delegated, _singleConfig());
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
                    IStreamGasParameterHost.GasParameterInvalidAuthority.selector,
                    address(malformedMarker)
                )
            );
            new StreamGasParameterStore(address(malformedMarker), _singleConfig());
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
                    IStreamGasParameterHost.GasParameterInvalidAuthority.selector,
                    address(malformedContext)
                )
            );
            new StreamGasParameterStore(address(malformedContext), _singleConfig());
        }
    }

    function _setContext(
        StreamGasParameterStore store,
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

    function _transitionHashes(StreamGasParameterStore store, bytes32 parameterId, uint256 newValue)
        private
        view
        returns (bytes32 scopeHash, bytes32 oldStateHash, bytes32 newStateHash)
    {
        (uint256 value, uint256 floor, uint8 failureClass, uint64 revision) =
            store.gasParameterInfo(parameterId);
        scopeHash =
            keccak256(abi.encode(SCOPE_DOMAIN_V2, block.chainid, address(store), parameterId));
        oldStateHash = keccak256(
            abi.encode(STATE_DOMAIN_V2, scopeHash, value, floor, failureClass, revision)
        );
        newStateHash = keccak256(
            abi.encode(STATE_DOMAIN_V2, scopeHash, newValue, floor, failureClass, revision + 1)
        );
    }

    function _singleConfig()
        private
        pure
        returns (IStreamGasParameterHost.GasParameterConfig[] memory configs)
    {
        configs = new IStreamGasParameterHost.GasParameterConfig[](1);
        configs[0] = _config("ROYALTY_RESOLVER_GAS_LIMIT", 60_000, 20_000, 1);
    }

    function _config(string memory name, uint256 genesisValue, uint256 floor, uint8 failureClass)
        private
        pure
        returns (IStreamGasParameterHost.GasParameterConfig memory)
    {
        return IStreamGasParameterHost.GasParameterConfig({
            name: name, genesisValue: genesisValue, floor: floor, failureClass: failureClass
        });
    }
}
