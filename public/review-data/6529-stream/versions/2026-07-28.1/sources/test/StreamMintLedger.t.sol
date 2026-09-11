// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IStreamMintLedger.sol";
import "../smart-contracts/StreamMintLedger.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";

contract StreamMintLedgerTest is CharacterizationTestBase {
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    address private constant MANAGER = address(0xA11CE);
    address private constant OTHER_MANAGER = address(0xB0B);
    address private constant UNAUTHORIZED = address(0xBAD);
    address private constant EOA_WRITER = address(0xE0A);
    address private constant PAYER = address(0xCAFE);
    address private constant RECIPIENT = address(0xDAD);
    address private constant AUTHORIZER = address(0xE11A);
    address private constant EXECUTOR = address(0xF00D);
    uint256 private constant COLLECTION_ID = 42;
    bytes32 private constant PHASE_ID = keccak256("public-phase");
    bytes32 private constant POLICY_HASH = keccak256("policy");
    bytes32 private constant OTHER_POLICY_HASH = keccak256("other-policy");
    bytes32 private constant COUNTER_ID = keccak256("phase-supply");
    bytes32 private constant OTHER_COUNTER_ID = keccak256("phase-per-recipient");
    bytes32 private constant SUBJECT_KEY = keccak256("subject");
    bytes32 private constant OTHER_SUBJECT_KEY = keccak256("other-subject");
    bytes32 private constant CONTEXT_HASH = keccak256("drop-context");
    bytes32 private constant RESOLUTION_HASH = keccak256("static-resolution");
    bytes32 private constant COUNTER_CONFIG_HASH = keccak256("counter-config");
    bytes32 private constant AUTHORIZATION_ID = keccak256("authorization");
    bytes32 private constant NULLIFIER = keccak256("nullifier");

    bytes32 private constant WRITER_UPDATED_TOPIC =
        keccak256("MintLedgerWriterUpdated(address,bool)");
    bytes32 private constant PHASE_POLICY_REGISTERED_TOPIC =
        keccak256("MintLedgerPhasePolicyRegistered(address,uint256,bytes32,bytes32)");
    bytes32 private constant COUNTER_POLICY_REGISTERED_TOPIC = keccak256(
        "MintLedgerCounterPolicyRegistered(address,uint256,bytes32,bytes32,uint8,uint8,uint64,uint64,bytes32,bytes32)"
    );
    bytes32 private constant COUNTER_CONSUMED_TOPIC = keccak256(
        "MintLedgerCounterConsumed(bytes32,uint256,bytes32,address,bytes32,bytes32,uint64,uint64,uint64,bytes32)"
    );
    bytes32 private constant COUNTER_CONTEXT_TOPIC = keccak256(
        "MintLedgerCounterConsumptionContext(bytes32,bytes32,bytes32,address,address,address,address,address,bytes32,bytes32)"
    );
    bytes32 private constant AUTHORIZATION_CONSUMED_TOPIC =
        keccak256("MintLedgerAuthorizationConsumed(bytes32,bytes32,address)");

    StreamMintLedger private ledger;

    function setUp() public {
        _markAsContract(MANAGER);
        _markAsContract(OTHER_MANAGER);
        ledger = new StreamMintLedger();
        ledger.setLedgerWriter(MANAGER, true);
    }

    function testSetLedgerWriterEmitsAndRejectsInvalidWriters() public {
        vm.recordLogs();
        ledger.setLedgerWriter(OTHER_MANAGER, true);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        logs.length.assertEq(1, "writer update log count");
        logs[0].topics[0].assertEq(WRITER_UPDATED_TOPIC, "writer topic");
        bool allowed = abi.decode(logs[0].data, (bool));
        allowed.assertTrue("writer enabled event");
        ledger.ledgerWriter(OTHER_MANAGER).assertTrue("writer enabled");

        vm.recordLogs();
        ledger.setLedgerWriter(OTHER_MANAGER, false);
        logs = vm.getRecordedLogs();
        logs.length.assertEq(1, "writer disable log count");
        logs[0].topics[0].assertEq(WRITER_UPDATED_TOPIC, "writer disable topic");
        allowed = abi.decode(logs[0].data, (bool));
        allowed.assertFalse("writer disabled event");
        ledger.ledgerWriter(OTHER_MANAGER).assertFalse("writer disabled");

        vm.prank(UNAUTHORIZED);
        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        ledger.setLedgerWriter(UNAUTHORIZED, true);

        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintLedger.InvalidLedgerWriter.selector, address(0))
        );
        ledger.setLedgerWriter(address(0), true);

        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintLedger.InvalidLedgerWriter.selector, EOA_WRITER)
        );
        ledger.setLedgerWriter(EOA_WRITER, true);
    }

    function testOnlyLedgerWriterCanRegisterAndConsume() public {
        (bytes32[] memory counterIds, IStreamMintLedger.LedgerCounterPolicy[] memory policies) =
            _singleCounterPolicy(2, 1);

        vm.prank(UNAUTHORIZED);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.UnauthorizedLedgerWriter.selector, UNAUTHORIZED
            )
        );
        ledger.registerPhasePolicy(
            MANAGER, COLLECTION_ID, PHASE_ID, POLICY_HASH, counterIds, policies
        );

        _registerDefaultPolicy(2, 1);
        IStreamMintLedger.CounterConsumption[] memory consumptions = _singleConsumption(1, 2);
        vm.prank(UNAUTHORIZED);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.UnauthorizedLedgerWriter.selector, UNAUTHORIZED
            )
        );
        ledger.consume(consumptions, bytes32(0), _emptyNullifiers(), POLICY_HASH);
        uint256(ledger.counterValue(_defaultValueKey()))
            .assertEq(0, "unauthorized consume no write");
    }

    function testRevokedLedgerWriterCannotRegisterOrConsume() public {
        ledger.setLedgerWriter(OTHER_MANAGER, true);
        _registerPolicyForManager(OTHER_MANAGER, POLICY_HASH, 2, 1);
        ledger.setLedgerWriter(OTHER_MANAGER, false);

        (bytes32[] memory counterIds, IStreamMintLedger.LedgerCounterPolicy[] memory policies) =
            _singleCounterPolicy(2, 1);
        vm.prank(OTHER_MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.UnauthorizedLedgerWriter.selector, OTHER_MANAGER
            )
        );
        ledger.registerPhasePolicy(
            OTHER_MANAGER, COLLECTION_ID, PHASE_ID, OTHER_POLICY_HASH, counterIds, policies
        );

        IStreamMintLedger.CounterConsumption[] memory consumptions =
            new IStreamMintLedger.CounterConsumption[](1);
        consumptions[0] = _consumptionForManager(OTHER_MANAGER, COUNTER_ID, SUBJECT_KEY, 1, 2);
        vm.prank(OTHER_MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.UnauthorizedLedgerWriter.selector, OTHER_MANAGER
            )
        );
        ledger.consume(consumptions, bytes32(0), _emptyNullifiers(), POLICY_HASH);
    }

    function testRegisterPhasePolicyStoresStaticCounterPolicy() public {
        vm.recordLogs();
        _registerDefaultPolicy(5, 1);

        ledger.registeredPhasePolicyHash(MANAGER, COLLECTION_ID, PHASE_ID)
            .assertEq(POLICY_HASH, "policy registered");
        IStreamMintLedger.LedgerCounterPolicy memory policy =
            ledger.registeredCounterPolicy(MANAGER, COLLECTION_ID, PHASE_ID, COUNTER_ID);
        policy.enabled.assertTrue("counter enabled");
        uint256(policy.staticCap).assertEq(5, "cap");
        uint256(policy.staticIncrement).assertEq(1, "increment");
        uint256(uint8(policy.capMode))
            .assertEq(uint256(uint8(IStreamMintLedger.CounterCapMode.STATIC)), "cap mode");
        uint256(uint8(policy.deltaMode))
            .assertEq(uint256(uint8(IStreamMintLedger.CounterDeltaMode.STATIC)), "delta mode");
        policy.counterConfigHash.assertEq(COUNTER_CONFIG_HASH, "config hash");

        Vm.Log[] memory logs = vm.getRecordedLogs();
        logs.length.assertEq(2, "registration log count");
        logs[0].topics[0].assertEq(PHASE_POLICY_REGISTERED_TOPIC, "phase topic");
        logs[0].topics[1].assertEq(bytes32(uint256(uint160(MANAGER))), "phase manager");
        logs[0].topics[2].assertEq(bytes32(COLLECTION_ID), "phase collection");
        logs[0].topics[3].assertEq(PHASE_ID, "phase id");
        bytes32 registeredPolicyHash = abi.decode(logs[0].data, (bytes32));
        registeredPolicyHash.assertEq(POLICY_HASH, "phase policy hash");

        logs[1].topics[0].assertEq(COUNTER_POLICY_REGISTERED_TOPIC, "counter policy topic");
        logs[1].topics[1].assertEq(bytes32(uint256(uint160(MANAGER))), "counter manager");
        logs[1].topics[2].assertEq(bytes32(COLLECTION_ID), "counter collection");
        logs[1].topics[3].assertEq(PHASE_ID, "counter phase");
        (
            bytes32 counterId,
            IStreamMintLedger.CounterCapMode capMode,
            IStreamMintLedger.CounterDeltaMode deltaMode,
            uint64 staticCap,
            uint64 staticIncrement,
            bytes32 counterConfigHash,
            bytes32 counterPolicyHash
        ) = abi.decode(
            logs[1].data,
            (
                bytes32,
                IStreamMintLedger.CounterCapMode,
                IStreamMintLedger.CounterDeltaMode,
                uint64,
                uint64,
                bytes32,
                bytes32
            )
        );
        counterId.assertEq(COUNTER_ID, "counter id");
        uint256(uint8(capMode))
            .assertEq(uint256(uint8(IStreamMintLedger.CounterCapMode.STATIC)), "event cap mode");
        uint256(uint8(deltaMode))
            .assertEq(uint256(uint8(IStreamMintLedger.CounterDeltaMode.STATIC)), "event delta mode");
        uint256(staticCap).assertEq(5, "event cap");
        uint256(staticIncrement).assertEq(1, "event increment");
        counterConfigHash.assertEq(COUNTER_CONFIG_HASH, "event config hash");
        counterPolicyHash.assertEq(POLICY_HASH, "event policy hash");
    }

    function testDeriveCounterValueKeySeparatesManagerCounterAndSubject() public view {
        bytes32 managerKey =
            ledger.deriveCounterValueKey(MANAGER, COLLECTION_ID, PHASE_ID, COUNTER_ID, SUBJECT_KEY);
        managerKey.assertEq(_defaultValueKey(), "local derivation");
        (managerKey
                != ledger.deriveCounterValueKey(
                    OTHER_MANAGER, COLLECTION_ID, PHASE_ID, COUNTER_ID, SUBJECT_KEY
                ))
        .assertTrue("manager separated");
        (managerKey
                != ledger.deriveCounterValueKey(
                    MANAGER, COLLECTION_ID, PHASE_ID, OTHER_COUNTER_ID, SUBJECT_KEY
                ))
        .assertTrue("counter separated");
        (managerKey
                != ledger.deriveCounterValueKey(
                    MANAGER, COLLECTION_ID, PHASE_ID, COUNTER_ID, OTHER_SUBJECT_KEY
                ))
        .assertTrue("subject separated");
    }

    function testRegisterPhasePolicyRejectsBadInputs() public {
        (bytes32[] memory counterIds, IStreamMintLedger.LedgerCounterPolicy[] memory policies) =
            _singleCounterPolicy(2, 1);

        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.InvalidPhasePolicy.selector, address(0), COLLECTION_ID, PHASE_ID
            )
        );
        ledger.registerPhasePolicy(
            address(0), COLLECTION_ID, PHASE_ID, POLICY_HASH, counterIds, policies
        );

        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.InvalidPhasePolicy.selector, MANAGER, 0, PHASE_ID
            )
        );
        ledger.registerPhasePolicy(MANAGER, 0, PHASE_ID, POLICY_HASH, counterIds, policies);

        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.InvalidPhasePolicy.selector, MANAGER, COLLECTION_ID, bytes32(0)
            )
        );
        ledger.registerPhasePolicy(
            MANAGER, COLLECTION_ID, bytes32(0), POLICY_HASH, counterIds, policies
        );

        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.InvalidPhasePolicy.selector, MANAGER, COLLECTION_ID, PHASE_ID
            )
        );
        ledger.registerPhasePolicy(
            MANAGER, COLLECTION_ID, PHASE_ID, bytes32(0), counterIds, policies
        );

        bytes32[] memory emptyCounterIds = new bytes32[](0);
        IStreamMintLedger.LedgerCounterPolicy[] memory emptyPolicies =
            new IStreamMintLedger.LedgerCounterPolicy[](0);
        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.InvalidPhasePolicy.selector, MANAGER, COLLECTION_ID, PHASE_ID
            )
        );
        ledger.registerPhasePolicy(
            MANAGER, COLLECTION_ID, PHASE_ID, POLICY_HASH, emptyCounterIds, emptyPolicies
        );

        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.InvalidPhasePolicy.selector,
                OTHER_MANAGER,
                COLLECTION_ID,
                PHASE_ID
            )
        );
        ledger.registerPhasePolicy(
            OTHER_MANAGER, COLLECTION_ID, PHASE_ID, POLICY_HASH, counterIds, policies
        );

        emptyCounterIds = new bytes32[](0);
        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintLedger.CounterPolicyLengthMismatch.selector, 0, 1)
        );
        ledger.registerPhasePolicy(
            MANAGER, COLLECTION_ID, PHASE_ID, POLICY_HASH, emptyCounterIds, policies
        );

        bytes32[] memory duplicateIds = new bytes32[](2);
        duplicateIds[0] = COUNTER_ID;
        duplicateIds[1] = COUNTER_ID;
        IStreamMintLedger.LedgerCounterPolicy[] memory duplicatePolicies =
            new IStreamMintLedger.LedgerCounterPolicy[](2);
        duplicatePolicies[0] = _policy(2, 1);
        duplicatePolicies[1] = _policy(2, 1);
        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintLedger.DuplicateCounterPolicy.selector, COUNTER_ID)
        );
        ledger.registerPhasePolicy(
            MANAGER, COLLECTION_ID, PHASE_ID, POLICY_HASH, duplicateIds, duplicatePolicies
        );
        ledger.registeredPhasePolicyHash(MANAGER, COLLECTION_ID, PHASE_ID)
            .assertEq(bytes32(0), "duplicate registration rolled back");
    }

    function testRegisterPhasePolicyRejectsInvalidSecondCounterAndRollsBackPolicy() public {
        bytes32[] memory counterIds = new bytes32[](2);
        counterIds[0] = COUNTER_ID;
        counterIds[1] = OTHER_COUNTER_ID;
        IStreamMintLedger.LedgerCounterPolicy[] memory policies =
            new IStreamMintLedger.LedgerCounterPolicy[](2);
        policies[0] = _policy(2, 1);
        policies[1] = _policy(0, 1);

        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.InvalidCounterPolicy.selector, OTHER_COUNTER_ID
            )
        );
        ledger.registerPhasePolicy(
            MANAGER, COLLECTION_ID, PHASE_ID, POLICY_HASH, counterIds, policies
        );

        ledger.registeredPhasePolicyHash(MANAGER, COLLECTION_ID, PHASE_ID)
            .assertEq(bytes32(0), "phase hash rolled back");
        IStreamMintLedger.LedgerCounterPolicy memory firstPolicy =
            ledger.registeredCounterPolicy(MANAGER, COLLECTION_ID, PHASE_ID, COUNTER_ID);
        firstPolicy.enabled.assertFalse("first counter policy rolled back");
    }

    function testRegisterPhasePolicyRejectsUnsupportedFutureModes() public {
        bytes32[] memory counterIds = new bytes32[](1);
        counterIds[0] = COUNTER_ID;
        IStreamMintLedger.LedgerCounterPolicy[] memory policies =
            new IStreamMintLedger.LedgerCounterPolicy[](1);
        policies[0] = IStreamMintLedger.LedgerCounterPolicy({
            enabled: true,
            capMode: IStreamMintLedger.CounterCapMode.RESOLVER,
            deltaMode: IStreamMintLedger.CounterDeltaMode.STATIC,
            staticCap: 2,
            staticIncrement: 1,
            counterConfigHash: COUNTER_CONFIG_HASH
        });

        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintLedger.InvalidCounterPolicy.selector, COUNTER_ID)
        );
        ledger.registerPhasePolicy(
            MANAGER, COLLECTION_ID, PHASE_ID, POLICY_HASH, counterIds, policies
        );

        policies[0] = IStreamMintLedger.LedgerCounterPolicy({
            enabled: true,
            capMode: IStreamMintLedger.CounterCapMode.STATIC,
            deltaMode: IStreamMintLedger.CounterDeltaMode.RESOLVER,
            staticCap: 2,
            staticIncrement: 1,
            counterConfigHash: COUNTER_CONFIG_HASH
        });
        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintLedger.InvalidCounterPolicy.selector, COUNTER_ID)
        );
        ledger.registerPhasePolicy(
            MANAGER, COLLECTION_ID, PHASE_ID, POLICY_HASH, counterIds, policies
        );
    }

    function testRegisterPhasePolicyRejectsInvalidCounterPolicyInputs() public {
        _expectInvalidSinglePolicy(bytes32(0), _policy(2, 1), bytes32(0));

        IStreamMintLedger.LedgerCounterPolicy memory disabled = _policy(2, 1);
        disabled.enabled = false;
        _expectInvalidSinglePolicy(COUNTER_ID, disabled, COUNTER_ID);

        IStreamMintLedger.LedgerCounterPolicy memory zeroIncrement = _policy(2, 1);
        zeroIncrement.staticIncrement = 0;
        _expectInvalidSinglePolicy(COUNTER_ID, zeroIncrement, COUNTER_ID);

        IStreamMintLedger.LedgerCounterPolicy memory zeroConfig = _policy(2, 1);
        zeroConfig.counterConfigHash = bytes32(0);
        _expectInvalidSinglePolicy(COUNTER_ID, zeroConfig, COUNTER_ID);

        IStreamMintLedger.LedgerCounterPolicy memory zeroStaticCap = _policy(2, 1);
        zeroStaticCap.staticCap = 0;
        _expectInvalidSinglePolicy(COUNTER_ID, zeroStaticCap, COUNTER_ID);

        IStreamMintLedger.LedgerCounterPolicy memory uncappedWithStaticCap = _uncappedPolicy(1);
        uncappedWithStaticCap.staticCap = 1;
        _expectInvalidSinglePolicy(COUNTER_ID, uncappedWithStaticCap, COUNTER_ID);
    }

    function testConsumeCountersAndAuthorizationEmitsReconstructableLogs() public {
        _registerDefaultPolicy(3, 1);
        IStreamMintLedger.CounterConsumption[] memory consumptions = _singleConsumption(1, 3);

        vm.recordLogs();
        vm.prank(MANAGER);
        ledger.consume(consumptions, AUTHORIZATION_ID, _emptyNullifiers(), POLICY_HASH);

        uint256(ledger.counterValue(_defaultValueKey())).assertEq(1, "counter consumed");
        vm.prank(MANAGER);
        ledger.isAuthorizationUsed(AUTHORIZATION_ID).assertTrue("authorization consumed");
        ledger.isManagerAuthorizationUsed(MANAGER, AUTHORIZATION_ID)
            .assertTrue("manager authorization consumed");
        ledger.isManagerAuthorizationUsed(MANAGER, bytes32(0))
            .assertFalse("zero auth remains unused");

        Vm.Log[] memory logs = vm.getRecordedLogs();
        logs.length.assertEq(3, "consume log count");
        logs[0].topics[0].assertEq(COUNTER_CONSUMED_TOPIC, "counter event");
        logs[0].topics[1].assertEq(_defaultValueKey(), "counter value topic");
        logs[0].topics[2].assertEq(bytes32(COLLECTION_ID), "counter collection topic");
        logs[0].topics[3].assertEq(PHASE_ID, "counter phase topic");
        {
            (
                address manager,
                bytes32 counterId,
                bytes32 subjectKey,
                uint64 increment,
                uint64 newValue,
                uint64 cap,
                bytes32 policyHash
            ) = abi.decode(
                logs[0].data, (address, bytes32, bytes32, uint64, uint64, uint64, bytes32)
            );
            uint256(uint160(manager)).assertEq(uint256(uint160(MANAGER)), "counter manager");
            counterId.assertEq(COUNTER_ID, "counter id");
            subjectKey.assertEq(SUBJECT_KEY, "subject key");
            uint256(increment).assertEq(1, "increment");
            uint256(newValue).assertEq(1, "new value");
            uint256(cap).assertEq(3, "cap");
            policyHash.assertEq(POLICY_HASH, "policy hash");
        }
        logs[1].topics[0].assertEq(COUNTER_CONTEXT_TOPIC, "counter context event");
        logs[1].topics[1].assertEq(_defaultValueKey(), "context value topic");
        logs[1].topics[2].assertEq(COUNTER_ID, "context counter topic");
        logs[1].topics[3].assertEq(SUBJECT_KEY, "context subject topic");
        {
            (
                address manager,
                address payer,
                address recipient,
                address authorizer,
                address executor,
                bytes32 contextHash,
                bytes32 resolutionHash
            ) = abi.decode(
                logs[1].data, (address, address, address, address, address, bytes32, bytes32)
            );
            uint256(uint160(manager)).assertEq(uint256(uint160(MANAGER)), "context manager");
            uint256(uint160(payer)).assertEq(uint256(uint160(PAYER)), "payer");
            uint256(uint160(recipient)).assertEq(uint256(uint160(RECIPIENT)), "recipient");
            uint256(uint160(authorizer)).assertEq(uint256(uint160(AUTHORIZER)), "authorizer");
            uint256(uint160(executor)).assertEq(uint256(uint160(EXECUTOR)), "executor");
            contextHash.assertEq(CONTEXT_HASH, "context hash");
            resolutionHash.assertEq(RESOLUTION_HASH, "resolution hash");
        }
        logs[2].topics[0].assertEq(AUTHORIZATION_CONSUMED_TOPIC, "authorization event");
        logs[2].topics[1].assertEq(AUTHORIZATION_ID, "authorization topic");
        logs[2].topics[2].assertEq(POLICY_HASH, "authorization policy topic");
        logs[2].topics[3].assertEq(bytes32(uint256(uint160(MANAGER))), "authorization manager");
    }

    function testReRegisterInvalidatesStaleCounterPolicies() public {
        _registerDefaultPolicy(5, 1);
        (bytes32[] memory counterIds, IStreamMintLedger.LedgerCounterPolicy[] memory policies) =
            _singleCounterPolicyWithId(OTHER_COUNTER_ID, 5, 1);
        vm.prank(MANAGER);
        ledger.registerPhasePolicy(
            MANAGER, COLLECTION_ID, PHASE_ID, OTHER_POLICY_HASH, counterIds, policies
        );

        IStreamMintLedger.LedgerCounterPolicy memory stale =
            ledger.registeredCounterPolicy(MANAGER, COLLECTION_ID, PHASE_ID, COUNTER_ID);
        stale.enabled.assertFalse("old counter no longer active");

        IStreamMintLedger.CounterConsumption[] memory staleConsumption = _singleConsumption(1, 5);
        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.CounterPolicyNotRegistered.selector,
                MANAGER,
                COLLECTION_ID,
                PHASE_ID,
                COUNTER_ID
            )
        );
        ledger.consume(staleConsumption, bytes32(0), _emptyNullifiers(), OTHER_POLICY_HASH);

        IStreamMintLedger.CounterConsumption[] memory activeConsumption =
            new IStreamMintLedger.CounterConsumption[](1);
        activeConsumption[0] = _consumption(OTHER_COUNTER_ID, SUBJECT_KEY, 1, 5);
        vm.prank(MANAGER);
        ledger.consume(activeConsumption, bytes32(0), _emptyNullifiers(), OTHER_POLICY_HASH);
        uint256(ledger.counterValue(_valueKey(MANAGER, OTHER_COUNTER_ID, SUBJECT_KEY)))
            .assertEq(1, "new counter consumed");
    }

    function testReRegisterSamePolicyHashInvalidatesStaleCounterPolicies() public {
        _registerDefaultPolicy(5, 1);
        (bytes32[] memory counterIds, IStreamMintLedger.LedgerCounterPolicy[] memory policies) =
            _singleCounterPolicyWithId(OTHER_COUNTER_ID, 5, 1);
        vm.prank(MANAGER);
        ledger.registerPhasePolicy(
            MANAGER, COLLECTION_ID, PHASE_ID, POLICY_HASH, counterIds, policies
        );

        IStreamMintLedger.CounterConsumption[] memory staleConsumption = _singleConsumption(1, 5);
        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.CounterPolicyNotRegistered.selector,
                MANAGER,
                COLLECTION_ID,
                PHASE_ID,
                COUNTER_ID
            )
        );
        ledger.consume(staleConsumption, bytes32(0), _emptyNullifiers(), POLICY_HASH);

        IStreamMintLedger.CounterConsumption[] memory activeConsumption =
            new IStreamMintLedger.CounterConsumption[](1);
        activeConsumption[0] = _consumption(OTHER_COUNTER_ID, SUBJECT_KEY, 1, 5);
        vm.prank(MANAGER);
        ledger.consume(activeConsumption, bytes32(0), _emptyNullifiers(), POLICY_HASH);
        uint256(ledger.counterValue(_valueKey(MANAGER, OTHER_COUNTER_ID, SUBJECT_KEY)))
            .assertEq(1, "new same-hash counter consumed");
    }

    function testAuthorizedOtherManagerCannotConsumeManagerPolicyState() public {
        ledger.setLedgerWriter(OTHER_MANAGER, true);
        _registerDefaultPolicy(3, 1);
        IStreamMintLedger.CounterConsumption[] memory consumptions = _singleConsumption(1, 3);

        vm.prank(OTHER_MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.InvalidPhasePolicy.selector,
                OTHER_MANAGER,
                COLLECTION_ID,
                PHASE_ID
            )
        );
        ledger.consume(consumptions, bytes32(0), _emptyNullifiers(), POLICY_HASH);
    }

    function testCounterValueKeysAreManagerScoped() public {
        ledger.setLedgerWriter(OTHER_MANAGER, true);
        _registerDefaultPolicy(2, 1);
        _registerPolicyForManager(OTHER_MANAGER, POLICY_HASH, 2, 1);

        IStreamMintLedger.CounterConsumption[] memory managerConsumption = _singleConsumption(1, 2);
        vm.prank(MANAGER);
        ledger.consume(managerConsumption, bytes32(0), _emptyNullifiers(), POLICY_HASH);

        IStreamMintLedger.CounterConsumption[] memory otherConsumption =
            new IStreamMintLedger.CounterConsumption[](1);
        otherConsumption[0] = _consumptionForManager(OTHER_MANAGER, COUNTER_ID, SUBJECT_KEY, 1, 2);
        vm.prank(OTHER_MANAGER);
        ledger.consume(otherConsumption, bytes32(0), _emptyNullifiers(), POLICY_HASH);

        bytes32 managerKey = _valueKey(MANAGER, COUNTER_ID, SUBJECT_KEY);
        bytes32 otherManagerKey = _valueKey(OTHER_MANAGER, COUNTER_ID, SUBJECT_KEY);
        (managerKey != otherManagerKey).assertTrue("keys differ");
        uint256(ledger.counterValue(managerKey)).assertEq(1, "manager counter");
        uint256(ledger.counterValue(otherManagerKey)).assertEq(1, "other manager counter");
    }

    function testAuthorizationIdsAreManagerScoped() public {
        ledger.setLedgerWriter(OTHER_MANAGER, true);
        _registerDefaultPolicy(2, 1);
        _registerPolicyForManager(OTHER_MANAGER, POLICY_HASH, 2, 1);

        IStreamMintLedger.CounterConsumption[] memory managerConsumption = _singleConsumption(1, 2);
        vm.prank(MANAGER);
        ledger.consume(managerConsumption, AUTHORIZATION_ID, _emptyNullifiers(), POLICY_HASH);

        IStreamMintLedger.CounterConsumption[] memory otherConsumption =
            new IStreamMintLedger.CounterConsumption[](1);
        otherConsumption[0] = _consumptionForManager(OTHER_MANAGER, COUNTER_ID, SUBJECT_KEY, 1, 2);
        vm.prank(OTHER_MANAGER);
        ledger.consume(otherConsumption, AUTHORIZATION_ID, _emptyNullifiers(), POLICY_HASH);

        ledger.isManagerAuthorizationUsed(MANAGER, AUTHORIZATION_ID).assertTrue("manager auth used");
        ledger.isManagerAuthorizationUsed(OTHER_MANAGER, AUTHORIZATION_ID)
            .assertTrue("other manager auth used");
    }

    function testConsumeRejectsNonCanonicalValueKey() public {
        _registerDefaultPolicy(3, 1);
        IStreamMintLedger.CounterConsumption[] memory consumptions = _singleConsumption(1, 3);
        bytes32 suppliedValueKey = keccak256("wrong-value-key");
        consumptions[0].valueKey = suppliedValueKey;

        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.CounterValueKeyMismatch.selector,
                suppliedValueKey,
                _defaultValueKey()
            )
        );
        ledger.consume(consumptions, bytes32(0), _emptyNullifiers(), POLICY_HASH);
        uint256(ledger.counterValue(_defaultValueKey())).assertEq(0, "mismatch no write");
    }

    function testMultiCounterBatchConsumesIndependentValueKeys() public {
        bytes32[] memory counterIds = new bytes32[](2);
        counterIds[0] = COUNTER_ID;
        counterIds[1] = OTHER_COUNTER_ID;
        IStreamMintLedger.LedgerCounterPolicy[] memory policies =
            new IStreamMintLedger.LedgerCounterPolicy[](2);
        policies[0] = _policy(3, 1);
        policies[1] = _policy(5, 2);
        vm.prank(MANAGER);
        ledger.registerPhasePolicy(
            MANAGER, COLLECTION_ID, PHASE_ID, POLICY_HASH, counterIds, policies
        );

        IStreamMintLedger.CounterConsumption[] memory consumptions =
            new IStreamMintLedger.CounterConsumption[](2);
        consumptions[0] = _consumption(COUNTER_ID, SUBJECT_KEY, 1, 3);
        consumptions[1] = _consumption(OTHER_COUNTER_ID, SUBJECT_KEY, 2, 5);

        vm.prank(MANAGER);
        ledger.consume(consumptions, AUTHORIZATION_ID, _emptyNullifiers(), POLICY_HASH);

        uint256(ledger.counterValue(_defaultValueKey())).assertEq(1, "first counter");
        uint256(ledger.counterValue(_valueKey(MANAGER, OTHER_COUNTER_ID, SUBJECT_KEY)))
            .assertEq(2, "second counter");
        ledger.isManagerAuthorizationUsed(MANAGER, AUTHORIZATION_ID)
            .assertTrue("batch authorization consumed");
    }

    function testAuthorizationNotConsumedAndCountersRollBackOnMidBatchFailure() public {
        bytes32[] memory counterIds = new bytes32[](2);
        counterIds[0] = COUNTER_ID;
        counterIds[1] = OTHER_COUNTER_ID;
        IStreamMintLedger.LedgerCounterPolicy[] memory policies =
            new IStreamMintLedger.LedgerCounterPolicy[](2);
        policies[0] = _policy(2, 1);
        policies[1] = _policy(1, 1);
        vm.prank(MANAGER);
        ledger.registerPhasePolicy(
            MANAGER, COLLECTION_ID, PHASE_ID, POLICY_HASH, counterIds, policies
        );

        IStreamMintLedger.CounterConsumption[] memory otherConsumption =
            new IStreamMintLedger.CounterConsumption[](1);
        otherConsumption[0] = _consumption(OTHER_COUNTER_ID, SUBJECT_KEY, 1, 1);
        vm.prank(MANAGER);
        ledger.consume(otherConsumption, bytes32(0), _emptyNullifiers(), POLICY_HASH);

        IStreamMintLedger.CounterConsumption[] memory failingBatch =
            new IStreamMintLedger.CounterConsumption[](2);
        failingBatch[0] = _consumption(COUNTER_ID, SUBJECT_KEY, 1, 2);
        failingBatch[1] = _consumption(OTHER_COUNTER_ID, SUBJECT_KEY, 1, 1);

        bytes32 otherCounterKey = _valueKey(MANAGER, OTHER_COUNTER_ID, SUBJECT_KEY);
        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.CounterCapExceeded.selector, otherCounterKey, 2, 1
            )
        );
        ledger.consume(failingBatch, AUTHORIZATION_ID, _emptyNullifiers(), POLICY_HASH);

        uint256(ledger.counterValue(_defaultValueKey())).assertEq(0, "first write rolled back");
        uint256(ledger.counterValue(otherCounterKey)).assertEq(1, "preexisting value preserved");
        ledger.isManagerAuthorizationUsed(MANAGER, AUTHORIZATION_ID)
            .assertFalse("auth not consumed");
    }

    function testCounterCapModeNoneSupportsUncappedStaticIncrements() public {
        bytes32[] memory counterIds = new bytes32[](1);
        counterIds[0] = COUNTER_ID;
        IStreamMintLedger.LedgerCounterPolicy[] memory policies =
            new IStreamMintLedger.LedgerCounterPolicy[](1);
        policies[0] = _uncappedPolicy(2);
        vm.prank(MANAGER);
        ledger.registerPhasePolicy(
            MANAGER, COLLECTION_ID, PHASE_ID, POLICY_HASH, counterIds, policies
        );

        IStreamMintLedger.CounterConsumption[] memory consumptions = _singleConsumption(2, 0);
        vm.prank(MANAGER);
        ledger.consume(consumptions, bytes32(0), _emptyNullifiers(), POLICY_HASH);
        vm.prank(MANAGER);
        ledger.consume(consumptions, bytes32(0), _emptyNullifiers(), POLICY_HASH);
        uint256(ledger.counterValue(_defaultValueKey())).assertEq(4, "uncapped value");

        IStreamMintLedger.CounterConsumption[] memory badCap = _singleConsumption(2, 1);
        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintLedger.CounterPolicyMismatch.selector, COUNTER_ID)
        );
        ledger.consume(badCap, bytes32(0), _emptyNullifiers(), POLICY_HASH);
    }

    function testConsumeRejectsPolicyMismatchAndUnknownCounter() public {
        _registerDefaultPolicy(3, 1);
        IStreamMintLedger.CounterConsumption[] memory consumptions = _singleConsumption(1, 3);

        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.InvalidPhasePolicy.selector, MANAGER, COLLECTION_ID, PHASE_ID
            )
        );
        ledger.consume(consumptions, bytes32(0), _emptyNullifiers(), OTHER_POLICY_HASH);

        consumptions[0].counterId = OTHER_COUNTER_ID;
        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.CounterPolicyNotRegistered.selector,
                MANAGER,
                COLLECTION_ID,
                PHASE_ID,
                OTHER_COUNTER_ID
            )
        );
        ledger.consume(consumptions, bytes32(0), _emptyNullifiers(), POLICY_HASH);
    }

    function testDuplicateValueKeysCannotBypassCaps() public {
        _registerDefaultPolicy(1, 1);
        IStreamMintLedger.CounterConsumption[] memory consumptions =
            new IStreamMintLedger.CounterConsumption[](2);
        consumptions[0] = _consumption(COUNTER_ID, SUBJECT_KEY, 1, 1);
        consumptions[1] = _consumption(COUNTER_ID, SUBJECT_KEY, 1, 1);

        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.CounterCapExceeded.selector, _defaultValueKey(), 2, 1
            )
        );
        ledger.consume(consumptions, bytes32(0), _emptyNullifiers(), POLICY_HASH);

        uint256(ledger.counterValue(_defaultValueKey()))
            .assertEq(0, "duplicate-key batch rolled back");
    }

    function testConsumeAllowsExactCapAndRejectsNextIncrement() public {
        _registerDefaultPolicy(2, 1);
        IStreamMintLedger.CounterConsumption[] memory consumptions = _singleConsumption(1, 2);

        vm.prank(MANAGER);
        ledger.consume(consumptions, bytes32(0), _emptyNullifiers(), POLICY_HASH);
        vm.prank(MANAGER);
        ledger.consume(consumptions, bytes32(0), _emptyNullifiers(), POLICY_HASH);
        uint256(ledger.counterValue(_defaultValueKey())).assertEq(2, "cap reached exactly");

        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.CounterCapExceeded.selector, _defaultValueKey(), 3, 2
            )
        );
        ledger.consume(consumptions, bytes32(0), _emptyNullifiers(), POLICY_HASH);
    }

    function testConsumeRejectsZeroValueKeyAndSubjectKey() public {
        _registerDefaultPolicy(3, 1);

        IStreamMintLedger.CounterConsumption[] memory zeroValueKey = _singleConsumption(1, 3);
        zeroValueKey[0].valueKey = bytes32(0);
        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintLedger.CounterPolicyMismatch.selector, COUNTER_ID)
        );
        ledger.consume(zeroValueKey, bytes32(0), _emptyNullifiers(), POLICY_HASH);

        IStreamMintLedger.CounterConsumption[] memory zeroSubjectKey = _singleConsumption(1, 3);
        zeroSubjectKey[0].subjectKey = bytes32(0);
        zeroSubjectKey[0].valueKey =
            ledger.deriveCounterValueKey(MANAGER, COLLECTION_ID, PHASE_ID, COUNTER_ID, bytes32(0));
        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintLedger.CounterPolicyMismatch.selector, COUNTER_ID)
        );
        ledger.consume(zeroSubjectKey, bytes32(0), _emptyNullifiers(), POLICY_HASH);
    }

    function testConsumeRejectsMismatchedIncrementCapAndOverflow() public {
        _registerDefaultPolicy(type(uint64).max, type(uint64).max);
        IStreamMintLedger.CounterConsumption[] memory consumptions =
            _singleConsumption(type(uint64).max, type(uint64).max);
        vm.prank(MANAGER);
        ledger.consume(consumptions, bytes32(0), _emptyNullifiers(), POLICY_HASH);

        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.CounterValueOverflow.selector, _defaultValueKey()
            )
        );
        ledger.consume(consumptions, bytes32(0), _emptyNullifiers(), POLICY_HASH);

        (bytes32[] memory counterIds, IStreamMintLedger.LedgerCounterPolicy[] memory policies) =
            _singleCounterPolicy(5, 2);
        vm.prank(MANAGER);
        ledger.registerPhasePolicy(
            MANAGER, COLLECTION_ID, PHASE_ID, OTHER_POLICY_HASH, counterIds, policies
        );
        IStreamMintLedger.CounterConsumption[] memory badIncrement = _singleConsumption(1, 5);
        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintLedger.CounterPolicyMismatch.selector, COUNTER_ID)
        );
        ledger.consume(badIncrement, bytes32(0), _emptyNullifiers(), OTHER_POLICY_HASH);
    }

    function testReRegisterWithLowerCapPreservesCounterValue() public {
        _registerDefaultPolicy(5, 2);
        IStreamMintLedger.CounterConsumption[] memory consumptions = _singleConsumption(2, 5);
        vm.prank(MANAGER);
        ledger.consume(consumptions, bytes32(0), _emptyNullifiers(), POLICY_HASH);

        (bytes32[] memory counterIds, IStreamMintLedger.LedgerCounterPolicy[] memory policies) =
            _singleCounterPolicy(1, 1);
        vm.prank(MANAGER);
        ledger.registerPhasePolicy(
            MANAGER, COLLECTION_ID, PHASE_ID, OTHER_POLICY_HASH, counterIds, policies
        );

        IStreamMintLedger.CounterConsumption[] memory lowerCapConsumption = _singleConsumption(1, 1);
        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.CounterCapExceeded.selector, _defaultValueKey(), 3, 1
            )
        );
        ledger.consume(lowerCapConsumption, bytes32(0), _emptyNullifiers(), OTHER_POLICY_HASH);
        uint256(ledger.counterValue(_defaultValueKey())).assertEq(2, "durable counter value");
    }

    function testCounterDropAndReAddPreservesDurableValue() public {
        _registerDefaultPolicy(5, 1);
        IStreamMintLedger.CounterConsumption[] memory consumptions = _singleConsumption(1, 5);
        vm.prank(MANAGER);
        ledger.consume(consumptions, bytes32(0), _emptyNullifiers(), POLICY_HASH);

        (
            bytes32[] memory otherCounterIds,
            IStreamMintLedger.LedgerCounterPolicy[] memory otherPolicies
        ) = _singleCounterPolicyWithId(OTHER_COUNTER_ID, 5, 1);
        vm.prank(MANAGER);
        ledger.registerPhasePolicy(
            MANAGER, COLLECTION_ID, PHASE_ID, OTHER_POLICY_HASH, otherCounterIds, otherPolicies
        );

        (bytes32[] memory counterIds, IStreamMintLedger.LedgerCounterPolicy[] memory policies) =
            _singleCounterPolicy(5, 1);
        vm.prank(MANAGER);
        ledger.registerPhasePolicy(
            MANAGER, COLLECTION_ID, PHASE_ID, POLICY_HASH, counterIds, policies
        );

        vm.prank(MANAGER);
        ledger.consume(consumptions, bytes32(0), _emptyNullifiers(), POLICY_HASH);
        uint256(ledger.counterValue(_defaultValueKey())).assertEq(2, "re-added counter value");
    }

    function testAuthorizationReplayAndNullifierRevertDoNotMutateCounters() public {
        _registerDefaultPolicy(3, 1);
        IStreamMintLedger.CounterConsumption[] memory consumptions = _singleConsumption(1, 3);
        vm.prank(MANAGER);
        ledger.consume(consumptions, AUTHORIZATION_ID, _emptyNullifiers(), POLICY_HASH);

        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.AuthorizationAlreadyConsumed.selector, AUTHORIZATION_ID
            )
        );
        ledger.consume(consumptions, AUTHORIZATION_ID, _emptyNullifiers(), POLICY_HASH);
        uint256(ledger.counterValue(_defaultValueKey())).assertEq(1, "replay did not mutate");

        bytes32[] memory nullifiers = new bytes32[](1);
        nullifiers[0] = NULLIFIER;
        IStreamMintLedger.CounterConsumption[] memory otherConsumption =
            new IStreamMintLedger.CounterConsumption[](1);
        otherConsumption[0] = _consumption(COUNTER_ID, OTHER_SUBJECT_KEY, 1, 3);
        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintLedger.NullifiersUnsupported.selector, NULLIFIER)
        );
        ledger.consume(otherConsumption, keccak256("fresh-auth"), nullifiers, POLICY_HASH);
        uint256(ledger.counterValue(_valueKey(MANAGER, COUNTER_ID, OTHER_SUBJECT_KEY)))
            .assertEq(0, "nullifier reverted before write");
        ledger.isManagerAuthorizationUsed(MANAGER, keccak256("fresh-auth"))
            .assertFalse("auth not consumed");
        ledger.isNullifierUsed(NULLIFIER).assertFalse("nullifier unsupported");
    }

    function testConsumeRejectsEmptyCounterBatch() public {
        IStreamMintLedger.CounterConsumption[] memory consumptions =
            new IStreamMintLedger.CounterConsumption[](0);
        vm.prank(MANAGER);
        vm.expectRevert(abi.encodeWithSelector(IStreamMintLedger.EmptyCounterConsumption.selector));
        ledger.consume(consumptions, AUTHORIZATION_ID, _emptyNullifiers(), POLICY_HASH);
        ledger.isManagerAuthorizationUsed(MANAGER, AUTHORIZATION_ID)
            .assertFalse("empty batch did not consume auth");
    }

    function _registerDefaultPolicy(uint64 cap, uint64 increment) private {
        _registerPolicyForManager(MANAGER, POLICY_HASH, cap, increment);
    }

    function _registerPolicyForManager(
        address manager,
        bytes32 policyHash,
        uint64 cap,
        uint64 increment
    ) private {
        (bytes32[] memory counterIds, IStreamMintLedger.LedgerCounterPolicy[] memory policies) =
            _singleCounterPolicy(cap, increment);
        vm.prank(manager);
        ledger.registerPhasePolicy(
            manager, COLLECTION_ID, PHASE_ID, policyHash, counterIds, policies
        );
    }

    function _singleCounterPolicy(uint64 cap, uint64 increment)
        private
        pure
        returns (
            bytes32[] memory counterIds,
            IStreamMintLedger.LedgerCounterPolicy[] memory policies
        )
    {
        return _singleCounterPolicyWithId(COUNTER_ID, cap, increment);
    }

    function _singleCounterPolicyWithId(bytes32 counterId, uint64 cap, uint64 increment)
        private
        pure
        returns (
            bytes32[] memory counterIds,
            IStreamMintLedger.LedgerCounterPolicy[] memory policies
        )
    {
        counterIds = new bytes32[](1);
        counterIds[0] = counterId;
        policies = new IStreamMintLedger.LedgerCounterPolicy[](1);
        policies[0] = _policy(cap, increment);
    }

    function _policy(uint64 cap, uint64 increment)
        private
        pure
        returns (IStreamMintLedger.LedgerCounterPolicy memory)
    {
        return IStreamMintLedger.LedgerCounterPolicy({
            enabled: true,
            capMode: IStreamMintLedger.CounterCapMode.STATIC,
            deltaMode: IStreamMintLedger.CounterDeltaMode.STATIC,
            staticCap: cap,
            staticIncrement: increment,
            counterConfigHash: COUNTER_CONFIG_HASH
        });
    }

    function _uncappedPolicy(uint64 increment)
        private
        pure
        returns (IStreamMintLedger.LedgerCounterPolicy memory)
    {
        return IStreamMintLedger.LedgerCounterPolicy({
            enabled: true,
            capMode: IStreamMintLedger.CounterCapMode.NONE,
            deltaMode: IStreamMintLedger.CounterDeltaMode.STATIC,
            staticCap: 0,
            staticIncrement: increment,
            counterConfigHash: COUNTER_CONFIG_HASH
        });
    }

    function _expectInvalidSinglePolicy(
        bytes32 counterId,
        IStreamMintLedger.LedgerCounterPolicy memory policy,
        bytes32 expectedCounterId
    ) private {
        bytes32[] memory counterIds = new bytes32[](1);
        counterIds[0] = counterId;
        IStreamMintLedger.LedgerCounterPolicy[] memory policies =
            new IStreamMintLedger.LedgerCounterPolicy[](1);
        policies[0] = policy;
        vm.prank(MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.InvalidCounterPolicy.selector, expectedCounterId
            )
        );
        ledger.registerPhasePolicy(
            MANAGER, COLLECTION_ID, PHASE_ID, POLICY_HASH, counterIds, policies
        );
    }

    function _singleConsumption(uint64 increment, uint64 cap)
        private
        pure
        returns (IStreamMintLedger.CounterConsumption[] memory consumptions)
    {
        consumptions = new IStreamMintLedger.CounterConsumption[](1);
        consumptions[0] = _consumption(COUNTER_ID, SUBJECT_KEY, increment, cap);
    }

    function _consumption(bytes32 counterId, bytes32 subjectKey, uint64 increment, uint64 cap)
        private
        pure
        returns (IStreamMintLedger.CounterConsumption memory)
    {
        return _consumptionForManager(MANAGER, counterId, subjectKey, increment, cap);
    }

    function _consumptionForManager(
        address manager,
        bytes32 counterId,
        bytes32 subjectKey,
        uint64 increment,
        uint64 cap
    ) private pure returns (IStreamMintLedger.CounterConsumption memory) {
        return IStreamMintLedger.CounterConsumption({
            valueKey: _valueKey(manager, counterId, subjectKey),
            collectionId: COLLECTION_ID,
            phaseId: PHASE_ID,
            counterId: counterId,
            subjectKey: subjectKey,
            payer: PAYER,
            recipient: RECIPIENT,
            authorizer: AUTHORIZER,
            executor: EXECUTOR,
            increment: increment,
            cap: cap,
            contextHash: CONTEXT_HASH,
            resolutionHash: RESOLUTION_HASH
        });
    }

    function _emptyNullifiers() private pure returns (bytes32[] memory nullifiers) {
        nullifiers = new bytes32[](0);
    }

    function _markAsContract(address account) private {
        vm.etch(account, hex"fe");
    }

    function _defaultValueKey() private pure returns (bytes32) {
        return _valueKey(MANAGER, COUNTER_ID, SUBJECT_KEY);
    }

    function _valueKey(address manager, bytes32 counterId, bytes32 subjectKey)
        private
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(manager, COLLECTION_ID, PHASE_ID, counterId, subjectKey));
    }
}
