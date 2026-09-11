// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/ERC165.sol";
import "../smart-contracts/IERC165.sol";
import "../smart-contracts/IERC721Receiver.sol";
import "../smart-contracts/IStreamCore.sol";
import "../smart-contracts/IStreamMintGate.sol";
import "../smart-contracts/IStreamMintLedger.sol";
import "../smart-contracts/IStreamMintManager.sol";
import "../smart-contracts/IStreamMintModuleRegistry.sol";
import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/StreamMetadataRenderer.sol";
import "../smart-contracts/StreamMintLedger.sol";
import "../smart-contracts/StreamMintManager.sol";
import "../smart-contracts/StreamMintModuleRegistry.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";

contract RevertingMintManagerReceiver is IERC721Receiver {
    error ReceiverRejected();

    function onERC721Received(address, address, uint256, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        revert ReceiverRejected();
    }
}

contract ReentrantMintManagerReceiver is IERC721Receiver {
    StreamMintManager private immutable manager;
    uint256 private immutable collectionId;
    bytes32 private immutable phaseId;

    bool public reentryRejected;
    bytes4 public reentrySelector;

    constructor(StreamMintManager manager_, uint256 collectionId_, bytes32 phaseId_) {
        manager = manager_;
        collectionId = collectionId_;
        phaseId = phaseId_;
    }

    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        IStreamMintManager.MintRequest memory request = _request();
        try manager.mintPrepared(request) { }
        catch (bytes memory revertData) {
            reentryRejected = true;
            if (revertData.length >= 4) {
                bytes4 selector;
                assembly {
                    selector := mload(add(revertData, 32))
                }
                reentrySelector = selector;
            }
        }
        return IERC721Receiver.onERC721Received.selector;
    }

    function _request() private view returns (IStreamMintManager.MintRequest memory request) {
        address[] memory initialRecipients = new address[](1);
        initialRecipients[0] = address(this);
        address[] memory beneficiaries = new address[](1);
        beneficiaries[0] = address(this);
        string[] memory tokenData = new string[](1);
        tokenData[0] = "reentrant-token";
        uint256[] memory salts = new uint256[](1);
        salts[0] = 99;
        request = IStreamMintManager.MintRequest({
            collectionId: collectionId,
            phaseId: phaseId,
            payer: address(this),
            authorizer: address(0),
            initialRecipients: initialRecipients,
            beneficiaries: beneficiaries,
            tokenData: tokenData,
            salts: salts,
            authorizationId: keccak256("reentrant-auth"),
            contextHash: bytes32(0),
            expectedPolicyHash: manager.phasePolicyHash(collectionId, phaseId),
            gateData: ""
        });
    }
}

contract MutatingMintManagerReceiver is IERC721Receiver {
    StreamMintManager private immutable manager;
    uint256 private immutable collectionId;
    bytes32 private immutable phaseId;

    bool public mutationRejected;
    bytes4 public mutationSelector;

    constructor(StreamMintManager manager_, uint256 collectionId_, bytes32 phaseId_) {
        manager = manager_;
        collectionId = collectionId_;
        phaseId = phaseId_;
    }

    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        try manager.setPhasePaused(collectionId, phaseId, true) { }
        catch (bytes memory revertData) {
            mutationRejected = true;
            if (revertData.length >= 4) {
                bytes4 selector;
                assembly {
                    selector := mload(add(revertData, 32))
                }
                mutationSelector = selector;
            }
        }
        return IERC721Receiver.onERC721Received.selector;
    }
}

contract MockMintGate is ERC165 {
    bytes32 public authorizationId;
    address public gateAuthorizer;
    uint64 public maxQuantity;
    bytes32 public gateHash;
    bool public shouldRevert;
    bool public advertisesInterface = true;
    bytes32 public expectedCallDataHash;

    bytes32 private _nullifier;

    function setResult(
        bytes32 authorizationId_,
        address authorizer_,
        uint64 maxQuantity_,
        bytes32 gateHash_
    ) external {
        authorizationId = authorizationId_;
        gateAuthorizer = authorizer_;
        maxQuantity = maxQuantity_;
        gateHash = gateHash_;
    }

    function setReverts(bool shouldRevert_) external {
        shouldRevert = shouldRevert_;
    }

    function setNullifier(bytes32 nullifier) external {
        _nullifier = nullifier;
    }

    function setAdvertisesInterface(bool advertisesInterface_) external {
        advertisesInterface = advertisesInterface_;
    }

    function setExpectedCallData(bytes calldata expectedCallData) external {
        expectedCallDataHash = keccak256(expectedCallData);
    }

    fallback(bytes calldata) external returns (bytes memory) {
        if (msg.sig != IStreamMintGate.validateMint.selector) {
            revert("unsupported selector");
        }
        if (shouldRevert) {
            revert("gate rejected");
        }
        if (expectedCallDataHash != bytes32(0) && keccak256(msg.data) != expectedCallDataHash) {
            revert("unexpected gate calldata");
        }
        bytes32[] memory nullifiers = new bytes32[](_nullifier == bytes32(0) ? 0 : 1);
        if (_nullifier != bytes32(0)) {
            nullifiers[0] = _nullifier;
        }
        IStreamMintGate.GateResult memory result = IStreamMintGate.GateResult({
            authorizationId: authorizationId,
            nullifiers: nullifiers,
            authorizer: gateAuthorizer,
            maxQuantity: maxQuantity,
            gateHash: gateHash
        });
        return abi.encode(result);
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return (advertisesInterface && interfaceId == type(IStreamMintGate).interfaceId)
            || super.supportsInterface(interfaceId);
    }
}

contract WrongMintModuleInterface is ERC165 {
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

contract NoMarkerMintModuleRegistry { }

contract MutableMintModuleRegistry is ERC165, IStreamMintModuleRegistry {
    mapping(address => MintModuleInfo) private _moduleInfo;

    function isStreamMintModuleRegistry() external pure override returns (bool) {
        return true;
    }

    function setInfo(address module, MintModuleInfo memory info) external {
        _moduleInfo[module] = info;
    }

    function setModule(address module, MintModuleInfo calldata info, string calldata)
        external
        override
    {
        _moduleInfo[module] = info;
    }

    function moduleInfo(address module) external view override returns (MintModuleInfo memory) {
        return _moduleInfo[module];
    }

    function isModuleActive(address module, bytes4 interfaceId)
        external
        view
        override
        returns (bool)
    {
        MintModuleInfo memory info = _moduleInfo[module];
        return info.status == ModuleStatus.ACTIVE && info.interfaceId == interfaceId
            && info.codehash == module.codehash;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC165, IERC165)
        returns (bool)
    {
        return interfaceId == type(IStreamMintModuleRegistry).interfaceId
            || super.supportsInterface(interfaceId);
    }
}

contract StreamMintManagerTest is CharacterizationTestBase, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    event MintPhasePausedEvent(
        uint256 indexed collectionId,
        bytes32 indexed phaseId,
        bool paused,
        bytes32 policyHash,
        address admin
    );
    event MintPhaseExecutorUpdated(
        uint256 indexed collectionId,
        bytes32 indexed phaseId,
        address indexed executor,
        bool allowed,
        bytes32 policyHash,
        address admin
    );
    event MintGateValidated(
        uint256 indexed collectionId,
        bytes32 indexed phaseId,
        address indexed gate,
        bytes32 authorizationId,
        address authorizer,
        uint256 quantity,
        bytes32 contextHash,
        bytes32 gateHash,
        bytes32 policyHash
    );
    event MintPreparedBatchExecuted(
        bytes32 indexed operationRoot,
        uint256 indexed collectionId,
        bytes32 indexed phaseId,
        bytes32 policyHash,
        bytes32 authorizationId,
        address executor,
        uint256 quantity,
        bytes32 contextHash
    );

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant SECOND_COLLECTION_ID = 2;
    uint256 private constant FIRST_TOKEN_ID = 1;
    uint256 private constant SECOND_FIRST_TOKEN_ID = FIRST_TOKEN_ID + 1;
    address private constant PAYER = address(0xCAFE);
    address private constant RECIPIENT = address(0xA11CE);
    address private constant OTHER_RECIPIENT = address(0xB0B);
    address private constant EXECUTOR = address(0xF00D);
    address private constant OTHER_EXECUTOR = address(0xF11D);
    address private constant AUTHORIZER = address(0xA770);
    bytes32 private constant PHASE_ID = keccak256("public-phase");
    bytes32 private constant OTHER_PHASE_ID = keccak256("allowlist-phase");
    bytes32 private constant SUPPLY_COUNTER_ID = keccak256("phase-supply");
    bytes32 private constant RECIPIENT_COUNTER_ID = keccak256("phase-recipient");
    bytes32 private constant PAYER_COUNTER_ID = keccak256("phase-payer");
    bytes32 private constant EXECUTOR_COUNTER_ID = keccak256("phase-executor");
    bytes32 private constant AUTHORIZER_COUNTER_ID = keccak256("phase-authorizer");
    bytes32 private constant CONTEXT_COUNTER_ID = keccak256("phase-context");
    bytes32 private constant CONFIG_HASH = keccak256("phase-config");
    bytes32 private constant METADATA_HASH = keccak256("phase-metadata");
    bytes32 private constant SUPPLY_CONFIG_HASH = keccak256("supply-counter-config");
    bytes32 private constant RECIPIENT_CONFIG_HASH = keccak256("recipient-counter-config");
    bytes32 private constant OTHER_RECIPIENT_CONFIG_HASH =
        keccak256("other-recipient-counter-config");
    bytes32 private constant PAYER_CONFIG_HASH = keccak256("payer-counter-config");
    bytes32 private constant EXECUTOR_CONFIG_HASH = keccak256("executor-counter-config");
    bytes32 private constant AUTHORIZER_CONFIG_HASH = keccak256("authorizer-counter-config");
    bytes32 private constant CONTEXT_CONFIG_HASH = keccak256("context-counter-config");
    bytes32 private constant AUTHORIZATION_ID = keccak256("authorization-one");
    bytes32 private constant SECOND_AUTHORIZATION_ID = keccak256("authorization-two");
    bytes32 private constant CONTEXT_HASH = keccak256("drop-context");
    bytes32 private constant GATE_CONFIG_HASH = keccak256("gate-config");
    bytes32 private constant GATE_METADATA_HASH = keccak256("gate-metadata");
    bytes32 private constant GATE_AUTHORIZATION_ID = keccak256("gate-authorization");
    bytes32 private constant GATE_HASH = keccak256("gate-evidence");
    uint32 private constant GATE_GAS_LIMIT = 400_000;

    StreamCore private core;
    StreamMintLedger private ledger;
    StreamMintManager private manager;
    StreamMintModuleRegistry private moduleRegistry;
    address private randomizer;

    struct CapturedHashEvents {
        bytes32 operationRoot;
        bytes32 operationId;
        bytes32 recipientResolutionHash;
        bool foundBatch;
        bool foundToken;
        bool foundRecipientResolution;
    }

    function setUp() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        core = deployed.core;
        randomizer = address(deployed.randomizer);
        ledger = new StreamMintLedger();
        moduleRegistry = new StreamMintModuleRegistry();
        manager = new StreamMintManager(IStreamCore(address(deployed.core)), ledger, moduleRegistry);
        ledger.setLedgerWriter(address(manager), true);
        core.updateContracts(4, address(manager));
    }

    function testConstructorRejectsInvalidCoreAndLedger() public {
        address invalidCore = address(0x1234);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintManager.InvalidCoreContract.selector, invalidCore)
        );
        new StreamMintManager(IStreamCore(invalidCore), ledger, moduleRegistry);

        address invalidLedger = address(0x5678);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.InvalidMintLedgerContract.selector, invalidLedger
            )
        );
        new StreamMintManager(
            IStreamCore(address(core)), IStreamMintLedger(invalidLedger), moduleRegistry
        );

        NoMarkerMintModuleRegistry invalidRegistry = new NoMarkerMintModuleRegistry();
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.InvalidMintModuleRegistry.selector, address(invalidRegistry)
            )
        );
        new StreamMintManager(
            IStreamCore(address(core)), ledger, IStreamMintModuleRegistry(address(invalidRegistry))
        );
    }

    function testConfigurePhaseRegistersLedgerPolicyAndCounters() public {
        _configurePhase(5, 2, 2);

        (bool exists, IStreamMintManager.MintPhaseConfig memory config) =
            manager.phase(COLLECTION_ID, PHASE_ID);
        exists.assertTrue("phase exists");
        config.configHash.assertEq(CONFIG_HASH, "config hash");
        config.metadataHash.assertEq(METADATA_HASH, "metadata hash");
        uint256(config.maxBatchQuantity).assertEq(2, "batch limit");

        bytes32 policyHash = manager.phasePolicyHash(COLLECTION_ID, PHASE_ID);
        policyHash.assertEq(
            ledger.registeredPhasePolicyHash(address(manager), COLLECTION_ID, PHASE_ID),
            "ledger policy hash"
        );
        IStreamMintLedger.LedgerCounterPolicy memory policy = ledger.registeredCounterPolicy(
            address(manager), COLLECTION_ID, PHASE_ID, SUPPLY_COUNTER_ID
        );
        policy.enabled.assertTrue("supply policy enabled");
        uint256(policy.staticCap).assertEq(5, "supply cap");
        uint256(policy.staticIncrement).assertEq(1, "supply increment");

        manager.phaseExecutor(COLLECTION_ID, PHASE_ID, EXECUTOR).assertTrue("executor enabled");
        manager.phaseCounterIds(COLLECTION_ID, PHASE_ID).length.assertEq(2, "counter count");
    }

    function testConfigureFailsWithoutLedgerWriterAndRollsBackManagerState() public {
        StreamMintManager unwrittenManager =
            new StreamMintManager(IStreamCore(address(core)), ledger, moduleRegistry);
        (
            bytes32[] memory counterIds,
            IStreamMintManager.MintCounterConfig[] memory counterConfigs
        ) = _twoCounterConfig(5, 2);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.UnauthorizedLedgerWriter.selector, address(unwrittenManager)
            )
        );
        unwrittenManager.configurePhase(
            COLLECTION_ID, PHASE_ID, _phaseConfig(2), _emptyGateConfig(), counterIds, counterConfigs
        );

        (bool exists,) = unwrittenManager.phase(COLLECTION_ID, PHASE_ID);
        exists.assertFalse("phase rolled back");
        unwrittenManager.phasePolicyHash(COLLECTION_ID, PHASE_ID)
            .assertEq(bytes32(0), "hash rolled back");
    }

    function testConfigureRejectsExistingPhaseWithoutMutatingPolicy() public {
        _configurePhase(5, 2, 1);
        bytes32 originalPolicyHash = manager.phasePolicyHash(COLLECTION_ID, PHASE_ID);

        (
            bytes32[] memory counterIds,
            IStreamMintManager.MintCounterConfig[] memory counterConfigs
        ) = _twoCounterConfig(10, 4);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintPhaseAlreadyConfigured.selector, COLLECTION_ID, PHASE_ID
            )
        );
        manager.configurePhase(
            COLLECTION_ID, PHASE_ID, _phaseConfig(2), _emptyGateConfig(), counterIds, counterConfigs
        );

        manager.phasePolicyHash(COLLECTION_ID, PHASE_ID)
            .assertEq(originalPolicyHash, "manager policy unchanged");
        ledger.registeredPhasePolicyHash(address(manager), COLLECTION_ID, PHASE_ID)
            .assertEq(originalPolicyHash, "ledger policy unchanged");
        manager.phaseCounterIds(COLLECTION_ID, PHASE_ID).length.assertEq(2, "counters unchanged");
        IStreamMintLedger.LedgerCounterPolicy memory policy = ledger.registeredCounterPolicy(
            address(manager), COLLECTION_ID, PHASE_ID, SUPPLY_COUNTER_ID
        );
        uint256(policy.staticCap).assertEq(5, "supply cap unchanged");
    }

    function testConfigureRejectsInvalidAndUnsupportedCounters() public {
        (
            bytes32[] memory duplicateIds,
            IStreamMintManager.MintCounterConfig[] memory counterConfigs
        ) = _twoCounterConfig(5, 2);
        duplicateIds[1] = duplicateIds[0];

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.DuplicateMintCounter.selector, SUPPLY_COUNTER_ID
            )
        );
        manager.configurePhase(
            COLLECTION_ID,
            PHASE_ID,
            _phaseConfig(2),
            _emptyGateConfig(),
            duplicateIds,
            counterConfigs
        );

        (bytes32[] memory counterIds,) = _twoCounterConfig(5, 2);
        IStreamMintManager.MintCounterConfig[] memory unsupportedConfigs =
            new IStreamMintManager.MintCounterConfig[](2);
        unsupportedConfigs[0] = _counter(
            IStreamMintManager.CounterKeyMode.CONSTANT,
            IStreamMintLedger.CounterCapMode.RESOLVER,
            5,
            SUPPLY_CONFIG_HASH
        );
        unsupportedConfigs[1] = _counter(
            IStreamMintManager.CounterKeyMode.RECIPIENT,
            IStreamMintLedger.CounterCapMode.STATIC,
            2,
            RECIPIENT_CONFIG_HASH
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.UnsupportedMintCounterMode.selector, SUPPLY_COUNTER_ID
            )
        );
        manager.configurePhase(
            COLLECTION_ID,
            PHASE_ID,
            _phaseConfig(2),
            _emptyGateConfig(),
            counterIds,
            unsupportedConfigs
        );

        (bool exists,) = manager.phase(COLLECTION_ID, PHASE_ID);
        exists.assertFalse("invalid config did not store phase");
        manager.phasePolicyHash(COLLECTION_ID, PHASE_ID)
            .assertEq(bytes32(0), "invalid config did not store hash");
    }

    function testConfigureRejectsInvalidLaunchCaps() public {
        (
            bytes32[] memory counterIds,
            IStreamMintManager.MintCounterConfig[] memory counterConfigs
        ) = _twoCounterConfig(5, 2);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.InvalidMintBatchLimit.selector,
                uint256(0),
                uint256(manager.MAX_PHASE_BATCH_QUANTITY())
            )
        );
        manager.configurePhase(
            COLLECTION_ID, PHASE_ID, _phaseConfig(0), _emptyGateConfig(), counterIds, counterConfigs
        );

        uint32 oversizedBatchLimit = manager.MAX_PHASE_BATCH_QUANTITY() + 1;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.InvalidMintBatchLimit.selector,
                uint256(oversizedBatchLimit),
                uint256(manager.MAX_PHASE_BATCH_QUANTITY())
            )
        );
        manager.configurePhase(
            COLLECTION_ID,
            PHASE_ID,
            _phaseConfig(oversizedBatchLimit),
            _emptyGateConfig(),
            counterIds,
            counterConfigs
        );

        uint256 tooManyCounters = uint256(manager.MAX_PHASE_COUNTERS()) + 1;
        bytes32[] memory manyCounterIds = new bytes32[](tooManyCounters);
        IStreamMintManager.MintCounterConfig[] memory manyCounterConfigs =
            new IStreamMintManager.MintCounterConfig[](tooManyCounters);
        for (uint256 i = 0; i < tooManyCounters; i++) {
            bytes32 counterId = keccak256(abi.encode("counter", i));
            manyCounterIds[i] = counterId;
            manyCounterConfigs[i] = _counter(
                IStreamMintManager.CounterKeyMode.CONSTANT,
                IStreamMintLedger.CounterCapMode.NONE,
                0,
                keccak256(abi.encode("counter-config", i))
            );
        }
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintCounterCountLimitExceeded.selector,
                tooManyCounters,
                uint256(manager.MAX_PHASE_COUNTERS())
            )
        );
        manager.configurePhase(
            COLLECTION_ID,
            PHASE_ID,
            _phaseConfig(1),
            _emptyGateConfig(),
            manyCounterIds,
            manyCounterConfigs
        );
    }

    function testConfigurePhasePinsActiveGateAndIncludesItInPolicyHash() public {
        MockMintGate gate = new MockMintGate();
        IStreamMintManager.MintGateConfig memory gateConfig = _registerGate(gate);
        (
            bytes32[] memory counterIds,
            IStreamMintManager.MintCounterConfig[] memory counterConfigs
        ) = _twoCounterConfig(5, 2);

        manager.configurePhase(
            COLLECTION_ID, PHASE_ID, _phaseConfig(2), gateConfig, counterIds, counterConfigs
        );

        IStreamMintManager.MintGateConfig memory storedGate =
            manager.phaseGate(COLLECTION_ID, PHASE_ID);
        storedGate.gate.assertEq(address(gate), "gate stored");
        storedGate.gateConfigHash.assertEq(GATE_CONFIG_HASH, "gate config hash");
        storedGate.gateCodehash.assertEq(address(gate).codehash, "gate codehash");
        storedGate.gateMetadataHash.assertEq(GATE_METADATA_HASH, "gate metadata");
        uint256(storedGate.gateSemanticVersion).assertEq(1, "gate version");
        uint256(storedGate.gateGasLimit).assertEq(GATE_GAS_LIMIT, "gate gas limit");

        address[] memory noExecutors = new address[](0);
        manager.phasePolicyHash(COLLECTION_ID, PHASE_ID)
            .assertEq(
                _expectedPolicyHash(
                    _phaseConfig(2),
                    _expectedGateConfigHash(storedGate),
                    _expectedOrderedCounterConfigHash(5, 2),
                    noExecutors
                ),
                "gate policy hash"
            );
    }

    function testConfigurePhaseRejectsUnapprovedGateAndWrongPins() public {
        MockMintGate gate = new MockMintGate();
        (
            bytes32[] memory counterIds,
            IStreamMintManager.MintCounterConfig[] memory counterConfigs
        ) = _twoCounterConfig(5, 2);
        IStreamMintManager.MintGateConfig memory gateConfig = IStreamMintManager.MintGateConfig({
            gate: address(gate),
            gateConfigHash: GATE_CONFIG_HASH,
            gateCodehash: bytes32(0),
            gateMetadataHash: bytes32(0),
            gateSemanticVersion: 0,
            gateGasLimit: 0
        });

        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintManager.MintGateNotActive.selector, address(gate))
        );
        manager.configurePhase(
            COLLECTION_ID, PHASE_ID, _phaseConfig(2), gateConfig, counterIds, counterConfigs
        );

        _registerGate(gate);
        gateConfig.gateCodehash = keccak256("wrong-codehash");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintGateCodehashChanged.selector,
                address(gate),
                gateConfig.gateCodehash,
                address(gate).codehash
            )
        );
        manager.configurePhase(
            COLLECTION_ID, PHASE_ID, _phaseConfig(2), gateConfig, counterIds, counterConfigs
        );

        gateConfig.gateCodehash = bytes32(0);
        gateConfig.gateMetadataHash = keccak256("wrong-metadata");
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintManager.InvalidMintGate.selector, address(gate))
        );
        manager.configurePhase(
            COLLECTION_ID, PHASE_ID, _phaseConfig(2), gateConfig, counterIds, counterConfigs
        );
    }

    function testGatedMintUsesGateAuthorizationAndAuthorizer() public {
        MockMintGate gate = new MockMintGate();
        _configureGatedAuthorizerPhase(gate);
        gate.setResult(GATE_AUTHORIZATION_ID, AUTHORIZER, 1, GATE_HASH);

        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, bytes32(0), CONTEXT_HASH);
        bytes32 activePolicy = manager.phasePolicyHash(COLLECTION_ID, PHASE_ID);
        request.expectedPolicyHash = activePolicy;
        request.gateData = bytes("gate-proof");
        gate.setExpectedCallData(
            abi.encodeWithSelector(
                IStreamMintGate.validateMint.selector,
                address(manager),
                EXECUTOR,
                COLLECTION_ID,
                PHASE_ID,
                PAYER,
                address(0),
                request.initialRecipients,
                request.beneficiaries,
                CONTEXT_HASH,
                activePolicy,
                request.gateData
            )
        );

        IStreamMintManager.MintRequest memory rootRequest = request;
        rootRequest.authorizationId = GATE_AUTHORIZATION_ID;
        bytes32 expectedRoot = _expectedOperationRoot(
            rootRequest, activePolicy, manager.nextOperationNonce(), 1, EXECUTOR
        );

        vm.expectEmit(true, true, true, true);
        emit MintGateValidated(
            COLLECTION_ID,
            PHASE_ID,
            address(gate),
            GATE_AUTHORIZATION_ID,
            AUTHORIZER,
            1,
            CONTEXT_HASH,
            GATE_HASH,
            activePolicy
        );
        vm.expectEmit(true, true, true, true);
        emit MintPreparedBatchExecuted(
            expectedRoot,
            COLLECTION_ID,
            PHASE_ID,
            activePolicy,
            GATE_AUTHORIZATION_ID,
            EXECUTOR,
            1,
            CONTEXT_HASH
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        ledger.isManagerAuthorizationUsed(address(manager), GATE_AUTHORIZATION_ID)
            .assertTrue("gate authorization consumed");
        uint256(
                ledger.counterValue(
                    _valueKeyForPhase(
                        PHASE_ID,
                        AUTHORIZER_COUNTER_ID,
                        IStreamMintManager.CounterKeyMode.AUTHORIZER,
                        PAYER,
                        RECIPIENT,
                        EXECUTOR,
                        AUTHORIZER,
                        CONTEXT_HASH
                    )
                )
            ).assertEq(1, "gate authorizer counter");
        core.ownerOf(FIRST_TOKEN_ID).assertEq(RECIPIENT, "owner");
    }

    function testGatedMintRequiresGateSuppliedAuthorizationId() public {
        MockMintGate gate = new MockMintGate();
        _configureGatedPhase(gate, 5, 3, 1);
        gate.setResult(bytes32(0), address(0), 1, GATE_HASH);

        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, bytes32(0), bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintAuthorizationRequired.selector, COLLECTION_ID, PHASE_ID
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        IStreamMintManager.MintRequest memory requestWithCallerId =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintAuthorizationRequired.selector, COLLECTION_ID, PHASE_ID
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(requestWithCallerId);

        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core not touched");
    }

    function testGatedMintRejectsConflictingRequestAuthorizationId() public {
        MockMintGate gate = new MockMintGate();
        _configureGatedPhase(gate, 5, 3, 1);
        gate.setResult(GATE_AUTHORIZATION_ID, address(0), 1, GATE_HASH);

        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintGateAuthorizationMismatch.selector,
                AUTHORIZATION_ID,
                GATE_AUTHORIZATION_ID
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        ledger.isManagerAuthorizationUsed(address(manager), GATE_AUTHORIZATION_ID)
            .assertFalse("authorization not consumed");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core not touched");
    }

    function testGatedMintRejectsGateThatStopsAdvertisingInterface() public {
        MockMintGate gate = new MockMintGate();
        _configureGatedPhase(gate, 5, 3, 1);
        gate.setResult(GATE_AUTHORIZATION_ID, address(0), 1, GATE_HASH);
        gate.setAdvertisesInterface(false);

        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, bytes32(0), bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintManager.MintGateNotActive.selector, address(gate))
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        ledger.isManagerAuthorizationUsed(address(manager), GATE_AUTHORIZATION_ID)
            .assertFalse("authorization not consumed");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core not touched");
    }

    function testGatedMintRejectsReplayAndRollsBack() public {
        MockMintGate gate = new MockMintGate();
        _configureGatedPhase(gate, 5, 3, 1);
        gate.setResult(GATE_AUTHORIZATION_ID, address(0), 1, GATE_HASH);

        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, bytes32(0), bytes32(0));
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        IStreamMintManager.MintRequest memory replay =
            _singleRequest(OTHER_RECIPIENT, bytes32(0), bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.AuthorizationAlreadyConsumed.selector, GATE_AUTHORIZATION_ID
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(replay);

        uint256(ledger.counterValue(_recipientValueKey(OTHER_RECIPIENT)))
            .assertEq(0, "replay recipient not consumed");
        core.viewCirSupply(COLLECTION_ID).assertEq(1, "no replay mint");
    }

    function testGatedMintRejectsNullifiersUntilSupportedBeforeMutation() public {
        MockMintGate gate = new MockMintGate();
        _configureGatedPhase(gate, 5, 2, 1);
        gate.setResult(GATE_AUTHORIZATION_ID, address(0), 1, GATE_HASH);
        bytes32 nullifier = keccak256("unsupported-nullifier");
        gate.setNullifier(nullifier);

        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, bytes32(0), bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintGateNullifiersUnsupported.selector, nullifier
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        ledger.isManagerAuthorizationUsed(address(manager), GATE_AUTHORIZATION_ID)
            .assertFalse("authorization not consumed");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core not touched");
    }

    function testGatedMintRejectsMaxQuantityBeforeMutation() public {
        MockMintGate gate = new MockMintGate();
        _configureGatedPhase(gate, 5, 3, 2);
        gate.setResult(GATE_AUTHORIZATION_ID, address(0), 1, GATE_HASH);

        IStreamMintManager.MintRequest memory request = _batchRequest(RECIPIENT, 2, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintGateQuantityExceeded.selector, uint256(2), uint256(1)
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        ledger.isManagerAuthorizationUsed(address(manager), GATE_AUTHORIZATION_ID)
            .assertFalse("authorization not consumed");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core not touched");
    }

    function testGatedMintRejectsBlockedDeprecatedAndDriftedRegistryState() public {
        MockMintGate gate = new MockMintGate();
        _configureGatedPhase(gate, 5, 2, 1);
        gate.setResult(GATE_AUTHORIZATION_ID, address(0), 1, GATE_HASH);

        IStreamMintModuleRegistry.MintModuleInfo memory blockedInfo =
            _gateModuleInfo(gate, IStreamMintModuleRegistry.ModuleStatus.BLOCKED);
        moduleRegistry.setModule(address(gate), blockedInfo, "ipfs://blocked-gate");

        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, bytes32(0), bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintManager.MintGateNotActive.selector, address(gate))
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        IStreamMintModuleRegistry.MintModuleInfo memory deprecatedInfo =
            _gateModuleInfo(gate, IStreamMintModuleRegistry.ModuleStatus.DEPRECATED);
        moduleRegistry.setModule(address(gate), deprecatedInfo, "ipfs://deprecated-gate");
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintManager.MintGateNotActive.selector, address(gate))
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        IStreamMintModuleRegistry.MintModuleInfo memory driftedInfo =
            _gateModuleInfo(gate, IStreamMintModuleRegistry.ModuleStatus.ACTIVE);
        driftedInfo.metadataHash = keccak256("drifted-gate-metadata");
        moduleRegistry.setModule(address(gate), driftedInfo, "ipfs://drifted-gate");
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintManager.MintGateNotActive.selector, address(gate))
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        ledger.isManagerAuthorizationUsed(address(manager), GATE_AUTHORIZATION_ID)
            .assertFalse("authorization not consumed");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core not touched");
    }

    function testPreparedMintConsumesLedgerAndCompletesCoreMint() public {
        _configurePhase(5, 2, 2);
        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        bytes32 activePolicy = manager.phasePolicyHash(COLLECTION_ID, PHASE_ID);
        request.expectedPolicyHash = activePolicy;

        vm.prank(EXECUTOR);
        (uint256 firstTokenId, uint256 lastTokenId) = manager.mintPrepared(request);

        firstTokenId.assertEq(FIRST_TOKEN_ID, "first token");
        lastTokenId.assertEq(FIRST_TOKEN_ID, "last token");
        core.ownerOf(FIRST_TOKEN_ID).assertEq(RECIPIENT, "owner");
        core.viewCirSupply(COLLECTION_ID).assertEq(1, "circulation");
        core.totalSupply().assertEq(1, "live supply");
        uint256(ledger.counterValue(_supplyValueKey())).assertEq(1, "supply counter");
        uint256(ledger.counterValue(_recipientValueKey(RECIPIENT))).assertEq(1, "recipient counter");
        ledger.isManagerAuthorizationUsed(address(manager), AUTHORIZATION_ID)
            .assertTrue("authorization consumed");
    }

    function testCompositeHashVectorsUseDocumentedFieldOrder() public {
        _configurePhase(7, 3, 2);
        bytes32 policyHash = manager.phasePolicyHash(COLLECTION_ID, PHASE_ID);
        policyHash.assertEq(_expectedPolicyHash(7, 3, 2), "policy hash vector");

        bytes32 expectedSupplySubject = keccak256(
            abi.encode(
                manager.SUBJECT_DOMAIN(),
                uint256(block.chainid),
                address(ledger),
                IStreamMintManager.CounterKeyMode.CONSTANT,
                COLLECTION_ID,
                PHASE_ID,
                SUPPLY_COUNTER_ID
            )
        );
        manager.previewSubjectKey(
                IStreamMintManager.CounterKeyMode.CONSTANT,
                COLLECTION_ID,
                PHASE_ID,
                SUPPLY_COUNTER_ID,
                PAYER,
                RECIPIENT,
                EXECUTOR,
                address(0),
                CONTEXT_HASH
            ).assertEq(expectedSupplySubject, "constant subject vector");

        bytes32 expectedRecipientSubject = keccak256(
            abi.encode(
                manager.SUBJECT_DOMAIN(),
                uint256(block.chainid),
                address(ledger),
                IStreamMintManager.CounterKeyMode.RECIPIENT,
                RECIPIENT
            )
        );
        manager.previewSubjectKey(
                IStreamMintManager.CounterKeyMode.RECIPIENT,
                COLLECTION_ID,
                PHASE_ID,
                RECIPIENT_COUNTER_ID,
                PAYER,
                RECIPIENT,
                EXECUTOR,
                address(0),
                CONTEXT_HASH
            ).assertEq(expectedRecipientSubject, "recipient subject vector");

        bytes32 expectedRecipientValueKey = keccak256(
            abi.encode(
                address(manager),
                COLLECTION_ID,
                PHASE_ID,
                RECIPIENT_COUNTER_ID,
                expectedRecipientSubject
            )
        );
        manager.previewCounterValueKey(
                COLLECTION_ID, PHASE_ID, RECIPIENT_COUNTER_ID, expectedRecipientSubject
            ).assertEq(expectedRecipientValueKey, "value key vector");

        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, CONTEXT_HASH);
        uint256 operationNonce = manager.nextOperationNonce();
        CapturedHashEvents memory captured = _captureMintHashEvents(request);

        bytes32 expectedOperationRoot =
            _expectedOperationRoot(request, policyHash, operationNonce, 1, EXECUTOR);
        captured.operationRoot.assertEq(expectedOperationRoot, "operation root vector");
        bytes32 expectedTokenDataHash = keccak256(bytes(request.tokenData[0]));
        captured.operationId
            .assertEq(
                keccak256(
                    abi.encode(
                        expectedOperationRoot,
                        operationNonce,
                        uint256(0),
                        expectedTokenDataHash,
                        777
                    )
                ),
                "operation id vector"
            );
        captured.recipientResolutionHash
            .assertEq(
                keccak256(
                    abi.encode(
                        manager.RESOLUTION_DOMAIN(),
                        uint256(block.chainid),
                        address(manager),
                        address(ledger),
                        COLLECTION_ID,
                        PHASE_ID,
                        RECIPIENT_COUNTER_ID,
                        expectedRecipientSubject,
                        uint256(0),
                        RECIPIENT_CONFIG_HASH
                    )
                ),
                "resolution hash vector"
            );
    }

    function testSequentialMintsUseDistinctOperationIdsAndAdvanceNonce() public {
        _configurePhase(5, 2, 1);

        IStreamMintManager.MintRequest memory firstRequest =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, CONTEXT_HASH);
        CapturedHashEvents memory first = _captureMintHashEvents(firstRequest);

        IStreamMintManager.MintRequest memory secondRequest =
            _singleRequest(RECIPIENT, SECOND_AUTHORIZATION_ID, CONTEXT_HASH);
        CapturedHashEvents memory second = _captureMintHashEvents(secondRequest);

        (first.operationId != second.operationId).assertTrue("operation ids differ");
        (first.operationRoot != second.operationRoot).assertTrue("operation roots differ");
        manager.nextOperationNonce().assertEq(2, "nonce advanced twice");
        core.ownerOf(FIRST_TOKEN_ID).assertEq(RECIPIENT, "first owner");
        core.ownerOf(FIRST_TOKEN_ID + 1).assertEq(RECIPIENT, "second owner");
        ledger.isManagerAuthorizationUsed(address(manager), AUTHORIZATION_ID)
            .assertTrue("first authorization consumed");
        ledger.isManagerAuthorizationUsed(address(manager), SECOND_AUTHORIZATION_ID)
            .assertTrue("second authorization consumed");
    }

    function testPayerExecutorAndAuthorizerCounterKeysConsumeExpectedSubjects() public {
        bytes32[] memory counterIds = new bytes32[](3);
        counterIds[0] = PAYER_COUNTER_ID;
        counterIds[1] = EXECUTOR_COUNTER_ID;
        counterIds[2] = AUTHORIZER_COUNTER_ID;
        IStreamMintManager.MintCounterConfig[] memory counterConfigs =
            new IStreamMintManager.MintCounterConfig[](3);
        counterConfigs[0] = _counter(
            IStreamMintManager.CounterKeyMode.PAYER,
            IStreamMintLedger.CounterCapMode.STATIC,
            1,
            PAYER_CONFIG_HASH
        );
        counterConfigs[1] = _counter(
            IStreamMintManager.CounterKeyMode.EXECUTOR,
            IStreamMintLedger.CounterCapMode.STATIC,
            1,
            EXECUTOR_CONFIG_HASH
        );
        counterConfigs[2] = _counter(
            IStreamMintManager.CounterKeyMode.AUTHORIZER,
            IStreamMintLedger.CounterCapMode.STATIC,
            1,
            AUTHORIZER_CONFIG_HASH
        );
        manager.configurePhase(
            COLLECTION_ID, PHASE_ID, _phaseConfig(1), _emptyGateConfig(), counterIds, counterConfigs
        );
        manager.setPhaseExecutor(COLLECTION_ID, PHASE_ID, EXECUTOR, true);

        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        request.authorizer = AUTHORIZER;

        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        uint256(
                ledger.counterValue(
                    _valueKeyForPhase(
                        PHASE_ID,
                        PAYER_COUNTER_ID,
                        IStreamMintManager.CounterKeyMode.PAYER,
                        PAYER,
                        RECIPIENT,
                        EXECUTOR,
                        AUTHORIZER,
                        bytes32(0)
                    )
                )
            ).assertEq(1, "payer counter");
        uint256(
                ledger.counterValue(
                    _valueKeyForPhase(
                        PHASE_ID,
                        EXECUTOR_COUNTER_ID,
                        IStreamMintManager.CounterKeyMode.EXECUTOR,
                        PAYER,
                        RECIPIENT,
                        EXECUTOR,
                        AUTHORIZER,
                        bytes32(0)
                    )
                )
            ).assertEq(1, "executor counter");
        uint256(
                ledger.counterValue(
                    _valueKeyForPhase(
                        PHASE_ID,
                        AUTHORIZER_COUNTER_ID,
                        IStreamMintManager.CounterKeyMode.AUTHORIZER,
                        PAYER,
                        RECIPIENT,
                        EXECUTOR,
                        AUTHORIZER,
                        bytes32(0)
                    )
                )
            ).assertEq(1, "authorizer counter");
    }

    function testCountersAreScopedByPhaseForSameCollection() public {
        _configureSingleCounterPhase(
            PHASE_ID,
            RECIPIENT_COUNTER_ID,
            IStreamMintManager.CounterKeyMode.RECIPIENT,
            1,
            1,
            RECIPIENT_CONFIG_HASH
        );
        _configureSingleCounterPhase(
            OTHER_PHASE_ID,
            RECIPIENT_COUNTER_ID,
            IStreamMintManager.CounterKeyMode.RECIPIENT,
            1,
            1,
            OTHER_RECIPIENT_CONFIG_HASH
        );

        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        IStreamMintManager.MintRequest memory otherPhaseRequest =
            _singleRequestForPhase(OTHER_PHASE_ID, RECIPIENT, SECOND_AUTHORIZATION_ID, bytes32(0));
        vm.prank(EXECUTOR);
        manager.mintPrepared(otherPhaseRequest);

        uint256(ledger.counterValue(_recipientValueKeyForPhase(PHASE_ID, RECIPIENT)))
            .assertEq(1, "primary phase recipient counter");
        uint256(ledger.counterValue(_recipientValueKeyForPhase(OTHER_PHASE_ID, RECIPIENT)))
            .assertEq(1, "other phase recipient counter");
        core.ownerOf(FIRST_TOKEN_ID).assertEq(RECIPIENT, "first phase owner");
        core.ownerOf(FIRST_TOKEN_ID + 1).assertEq(RECIPIENT, "other phase owner");
    }

    function testCountersAreScopedByCollectionForSamePhase() public {
        uint256 secondCollectionId = _createSecondCollection();
        _configureSingleCounterPhase(
            PHASE_ID,
            RECIPIENT_COUNTER_ID,
            IStreamMintManager.CounterKeyMode.RECIPIENT,
            1,
            1,
            RECIPIENT_CONFIG_HASH
        );
        _configureSingleCounterPhaseForCollection(
            secondCollectionId,
            PHASE_ID,
            RECIPIENT_COUNTER_ID,
            IStreamMintManager.CounterKeyMode.RECIPIENT,
            1,
            1,
            OTHER_RECIPIENT_CONFIG_HASH
        );

        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        IStreamMintManager.MintRequest memory secondCollectionRequest =
            _singleRequestForCollectionAndPhase(
                secondCollectionId, PHASE_ID, RECIPIENT, SECOND_AUTHORIZATION_ID, bytes32(0)
            );
        vm.prank(EXECUTOR);
        manager.mintPrepared(secondCollectionRequest);

        uint256(ledger.counterValue(_recipientValueKeyForPhase(PHASE_ID, RECIPIENT)))
            .assertEq(1, "first collection recipient counter");
        uint256(
                ledger.counterValue(
                    _recipientValueKeyForCollectionAndPhase(secondCollectionId, PHASE_ID, RECIPIENT)
                )
            ).assertEq(1, "second collection recipient counter");
        core.ownerOf(FIRST_TOKEN_ID).assertEq(RECIPIENT, "first collection owner");
        (secondCollectionId == SECOND_COLLECTION_ID).assertTrue("second collection id");
        core.ownerOf(SECOND_FIRST_TOKEN_ID).assertEq(RECIPIENT, "second collection owner");
    }

    function testCounterValuesPersistAcrossPolicyRefresh() public {
        _configurePhase(5, 2, 1);
        bytes32 originalPolicyHash = manager.phasePolicyHash(COLLECTION_ID, PHASE_ID);
        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        manager.setPhaseExecutor(COLLECTION_ID, PHASE_ID, OTHER_EXECUTOR, true);
        bytes32 refreshedPolicyHash = manager.phasePolicyHash(COLLECTION_ID, PHASE_ID);
        (refreshedPolicyHash != originalPolicyHash).assertTrue("policy refreshed");
        ledger.registeredPhasePolicyHash(address(manager), COLLECTION_ID, PHASE_ID)
            .assertEq(refreshedPolicyHash, "ledger policy refreshed");

        IStreamMintManager.MintRequest memory secondRequest =
            _singleRequest(RECIPIENT, SECOND_AUTHORIZATION_ID, bytes32(0));
        vm.prank(EXECUTOR);
        manager.mintPrepared(secondRequest);

        uint256(ledger.counterValue(_recipientValueKey(RECIPIENT)))
            .assertEq(2, "counter persisted across refresh");
    }

    function testRevokedLedgerWriterBlocksMintWithoutCoreMutation() public {
        _configurePhase(5, 2, 1);
        ledger.setLedgerWriter(address(manager), false);
        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.UnauthorizedLedgerWriter.selector, address(manager)
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        uint256(ledger.counterValue(_supplyValueKey())).assertEq(0, "supply not consumed");
        ledger.isManagerAuthorizationUsed(address(manager), AUTHORIZATION_ID)
            .assertFalse("auth not consumed");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core not touched");
    }

    function testAuthorizationReplayAndStalePolicyDoNotMutate() public {
        _configurePhase(5, 2, 1);
        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.AuthorizationAlreadyConsumed.selector, AUTHORIZATION_ID
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);
        uint256(ledger.counterValue(_supplyValueKey())).assertEq(1, "replay no supply drift");

        IStreamMintManager.MintRequest memory stale =
            _singleRequest(OTHER_RECIPIENT, SECOND_AUTHORIZATION_ID, bytes32(0));
        stale.expectedPolicyHash = keccak256("stale-policy");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintPolicyHashMismatch.selector,
                stale.expectedPolicyHash,
                manager.phasePolicyHash(COLLECTION_ID, PHASE_ID)
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(stale);
        ledger.isManagerAuthorizationUsed(address(manager), SECOND_AUTHORIZATION_ID)
            .assertFalse("stale auth unused");
    }

    function testMissingPolicyHashAndAuthorizationDoNotMutate() public {
        _configurePhase(5, 2, 1);
        IStreamMintManager.MintRequest memory missingPolicy =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        missingPolicy.expectedPolicyHash = bytes32(0);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintPolicyHashRequired.selector, COLLECTION_ID, PHASE_ID
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(missingPolicy);

        IStreamMintManager.MintRequest memory missingAuthorization =
            _singleRequest(RECIPIENT, bytes32(0), bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintAuthorizationRequired.selector, COLLECTION_ID, PHASE_ID
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(missingAuthorization);

        uint256(ledger.counterValue(_supplyValueKey())).assertEq(0, "supply unchanged");
        ledger.isManagerAuthorizationUsed(address(manager), AUTHORIZATION_ID)
            .assertFalse("auth unchanged");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core unchanged");
    }

    function testDuplicateRecipientBatchCapRevertsThroughLedgerAndRollsBack() public {
        _configurePhase(5, 1, 2);
        IStreamMintManager.MintRequest memory request =
            _twoTokenRequest(RECIPIENT, RECIPIENT, AUTHORIZATION_ID);

        bytes32 recipientValueKey = _recipientValueKey(RECIPIENT);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.CounterCapExceeded.selector, recipientValueKey, 2, 1
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        uint256(ledger.counterValue(_supplyValueKey())).assertEq(0, "supply rollback");
        uint256(ledger.counterValue(_recipientValueKey(RECIPIENT)))
            .assertEq(0, "recipient rollback");
        ledger.isManagerAuthorizationUsed(address(manager), AUTHORIZATION_ID)
            .assertFalse("auth rollback");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core not touched");
    }

    function testDuplicateRecipientBatchCanReachExactCap() public {
        _configurePhase(5, 2, 2);
        IStreamMintManager.MintRequest memory request =
            _twoTokenRequest(RECIPIENT, RECIPIENT, AUTHORIZATION_ID);

        vm.prank(EXECUTOR);
        (uint256 firstTokenId, uint256 lastTokenId) = manager.mintPrepared(request);

        firstTokenId.assertEq(FIRST_TOKEN_ID, "first token");
        lastTokenId.assertEq(FIRST_TOKEN_ID + 1, "last token");
        uint256(ledger.counterValue(_supplyValueKey())).assertEq(2, "supply exact");
        uint256(ledger.counterValue(_recipientValueKey(RECIPIENT))).assertEq(2, "recipient exact");
        core.ownerOf(FIRST_TOKEN_ID).assertEq(RECIPIENT, "first owner");
        core.ownerOf(FIRST_TOKEN_ID + 1).assertEq(RECIPIENT, "second owner");
    }

    function testMaxLaunchBatchCanReachExactCapWithRepeatedRecipient() public {
        _configurePhase(10, 10, uint32(manager.MAX_PHASE_BATCH_QUANTITY()));
        IStreamMintManager.MintRequest memory request =
            _batchRequest(RECIPIENT, uint256(manager.MAX_PHASE_BATCH_QUANTITY()), AUTHORIZATION_ID);

        vm.prank(EXECUTOR);
        (uint256 firstTokenId, uint256 lastTokenId) = manager.mintPrepared(request);

        firstTokenId.assertEq(FIRST_TOKEN_ID, "first token");
        lastTokenId.assertEq(FIRST_TOKEN_ID + 9, "last token");
        uint256(ledger.counterValue(_supplyValueKey())).assertEq(10, "supply exact");
        uint256(ledger.counterValue(_recipientValueKey(RECIPIENT))).assertEq(10, "recipient exact");
        core.viewCirSupply(COLLECTION_ID).assertEq(10, "core supply exact");
        core.ownerOf(FIRST_TOKEN_ID).assertEq(RECIPIENT, "first owner");
        core.ownerOf(FIRST_TOKEN_ID + 9).assertEq(RECIPIENT, "last owner");
    }

    function testBatchQuantityLimitRejectsOverLimitBeforeLedgerConsumption() public {
        _configurePhase(5, 5, 2);
        IStreamMintManager.MintRequest memory request =
            _threeTokenRequest(RECIPIENT, AUTHORIZATION_ID);

        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintManager.MintBatchQuantityLimitExceeded.selector, 3, 2)
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        uint256(ledger.counterValue(_supplyValueKey())).assertEq(0, "supply unchanged");
        uint256(ledger.counterValue(_recipientValueKey(RECIPIENT)))
            .assertEq(0, "recipient unchanged");
        ledger.isManagerAuthorizationUsed(address(manager), AUTHORIZATION_ID)
            .assertFalse("auth unused");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core unchanged");
    }

    function testPhaseGuardsRejectUnknownPausedWindowAndUnauthorizedExecutor() public {
        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintPhaseDoesNotExist.selector, COLLECTION_ID, PHASE_ID
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        _configurePhase(5, 2, 1);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.UnauthorizedMintExecutor.selector,
                COLLECTION_ID,
                PHASE_ID,
                address(0xBAD)
            )
        );
        vm.prank(address(0xBAD));
        manager.mintPrepared(request);

        manager.setPhasePaused(COLLECTION_ID, PHASE_ID, true);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintPhasePaused.selector, COLLECTION_ID, PHASE_ID
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        _configureWindowedPhase(uint64(block.timestamp + 10), uint64(block.timestamp + 20));
        IStreamMintManager.MintRequest memory otherRequest =
            _singleRequestForPhase(OTHER_PHASE_ID, RECIPIENT, SECOND_AUTHORIZATION_ID, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintPhaseNotStarted.selector,
                COLLECTION_ID,
                OTHER_PHASE_ID,
                block.timestamp
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(otherRequest);

        vm.warp(block.timestamp + 21);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintPhaseEnded.selector,
                COLLECTION_ID,
                OTHER_PHASE_ID,
                block.timestamp
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(otherRequest);
    }

    function testUnpauseRefreshesPolicyAndRestoresMinting() public {
        _configurePhase(5, 2, 1);
        bytes32 activePolicyHash = manager.phasePolicyHash(COLLECTION_ID, PHASE_ID);
        IStreamMintManager.MintPhaseConfig memory pausedConfig = IStreamMintManager.MintPhaseConfig({
            paused: true,
            startTime: 0,
            endTime: 0,
            maxBatchQuantity: 1,
            configHash: CONFIG_HASH,
            metadataHash: METADATA_HASH
        });
        address[] memory defaultExecutors = new address[](1);
        defaultExecutors[0] = EXECUTOR;
        bytes32 expectedPausedPolicyHash = _expectedPolicyHash(
            pausedConfig, _expectedOrderedCounterConfigHash(5, 2), defaultExecutors
        );

        vm.expectEmit(true, true, false, true);
        emit MintPhasePausedEvent(
            COLLECTION_ID, PHASE_ID, true, expectedPausedPolicyHash, address(this)
        );
        manager.setPhasePaused(COLLECTION_ID, PHASE_ID, true);
        bytes32 pausedPolicyHash = manager.phasePolicyHash(COLLECTION_ID, PHASE_ID);
        (pausedPolicyHash != activePolicyHash).assertTrue("pause refreshed policy");
        pausedPolicyHash.assertEq(expectedPausedPolicyHash, "pause event policy");
        ledger.registeredPhasePolicyHash(address(manager), COLLECTION_ID, PHASE_ID)
            .assertEq(pausedPolicyHash, "paused policy registered");

        IStreamMintManager.MintRequest memory pausedRequest =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintPhasePaused.selector, COLLECTION_ID, PHASE_ID
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(pausedRequest);

        vm.expectEmit(true, true, false, true);
        emit MintPhasePausedEvent(COLLECTION_ID, PHASE_ID, false, activePolicyHash, address(this));
        manager.setPhasePaused(COLLECTION_ID, PHASE_ID, false);
        bytes32 unpausedPolicyHash = manager.phasePolicyHash(COLLECTION_ID, PHASE_ID);
        unpausedPolicyHash.assertEq(activePolicyHash, "unpause restores active policy");
        ledger.registeredPhasePolicyHash(address(manager), COLLECTION_ID, PHASE_ID)
            .assertEq(unpausedPolicyHash, "unpaused policy registered");

        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        core.ownerOf(FIRST_TOKEN_ID).assertEq(RECIPIENT, "mint restored");
        uint256(ledger.counterValue(_recipientValueKey(RECIPIENT))).assertEq(1, "counter");
    }

    function testExecutorRemovalRefreshesPolicyAndBlocksRemovedExecutor() public {
        _configurePhase(5, 2, 1);
        manager.setPhaseExecutor(COLLECTION_ID, PHASE_ID, OTHER_EXECUTOR, true);
        bytes32 policyWithBothExecutors = manager.phasePolicyHash(COLLECTION_ID, PHASE_ID);
        address[] memory remainingExecutors = new address[](1);
        remainingExecutors[0] = OTHER_EXECUTOR;
        bytes32 expectedPolicyAfterRemoval = _expectedPolicyHash(
            _phaseConfig(1), _expectedOrderedCounterConfigHash(5, 2), remainingExecutors
        );

        vm.expectEmit(true, true, true, true);
        emit MintPhaseExecutorUpdated(
            COLLECTION_ID, PHASE_ID, EXECUTOR, false, expectedPolicyAfterRemoval, address(this)
        );
        manager.setPhaseExecutor(COLLECTION_ID, PHASE_ID, EXECUTOR, false);
        bytes32 policyAfterRemoval = manager.phasePolicyHash(COLLECTION_ID, PHASE_ID);

        manager.phaseExecutor(COLLECTION_ID, PHASE_ID, EXECUTOR).assertFalse("executor removed");
        manager.phaseExecutor(COLLECTION_ID, PHASE_ID, OTHER_EXECUTOR)
            .assertTrue("other executor retained");
        (policyAfterRemoval != policyWithBothExecutors).assertTrue("policy changed on removal");
        policyAfterRemoval.assertEq(expectedPolicyAfterRemoval, "executor event policy");
        ledger.registeredPhasePolicyHash(address(manager), COLLECTION_ID, PHASE_ID)
            .assertEq(policyAfterRemoval, "ledger policy refreshed");

        IStreamMintManager.MintRequest memory removedExecutorRequest =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.UnauthorizedMintExecutor.selector,
                COLLECTION_ID,
                PHASE_ID,
                EXECUTOR
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(removedExecutorRequest);

        IStreamMintManager.MintRequest memory retainedExecutorRequest =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        vm.prank(OTHER_EXECUTOR);
        manager.mintPrepared(retainedExecutorRequest);
        core.ownerOf(FIRST_TOKEN_ID).assertEq(RECIPIENT, "retained executor minted");
    }

    function testExecutorCountLimitIsEnforcedAndAllowsReuseAfterRemoval() public {
        _configurePhase(5, 2, 1);

        for (uint256 i = 1; i < manager.MAX_PHASE_EXECUTORS(); i++) {
            manager.setPhaseExecutor(COLLECTION_ID, PHASE_ID, address(uint160(0x1000 + i)), true);
        }

        bytes32 fullExecutorPolicyHash = manager.phasePolicyHash(COLLECTION_ID, PHASE_ID);

        address overflowExecutor = address(0xBEEF00);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintExecutorCountLimitExceeded.selector,
                uint256(manager.MAX_PHASE_EXECUTORS()) + 1,
                uint256(manager.MAX_PHASE_EXECUTORS())
            )
        );
        manager.setPhaseExecutor(COLLECTION_ID, PHASE_ID, overflowExecutor, true);
        manager.phaseExecutor(COLLECTION_ID, PHASE_ID, overflowExecutor)
            .assertFalse("overflow executor not enabled");
        manager.phasePolicyHash(COLLECTION_ID, PHASE_ID)
            .assertEq(fullExecutorPolicyHash, "overflow policy rollback");
        ledger.registeredPhasePolicyHash(address(manager), COLLECTION_ID, PHASE_ID)
            .assertEq(fullExecutorPolicyHash, "ledger policy rollback");

        address removableExecutor = address(uint160(0x1001));
        manager.setPhaseExecutor(COLLECTION_ID, PHASE_ID, removableExecutor, false);
        manager.setPhaseExecutor(COLLECTION_ID, PHASE_ID, overflowExecutor, true);

        manager.phaseExecutor(COLLECTION_ID, PHASE_ID, overflowExecutor)
            .assertTrue("executor slot reused");
        manager.phaseExecutor(COLLECTION_ID, PHASE_ID, removableExecutor)
            .assertFalse("removed executor disabled");
    }

    function testUncappedCounterRequiresExplicitBatchLimit() public {
        bytes32[] memory counterIds = new bytes32[](1);
        counterIds[0] = SUPPLY_COUNTER_ID;
        IStreamMintManager.MintCounterConfig[] memory counterConfigs =
            new IStreamMintManager.MintCounterConfig[](1);
        counterConfigs[0] = _counter(
            IStreamMintManager.CounterKeyMode.CONSTANT,
            IStreamMintLedger.CounterCapMode.NONE,
            0,
            SUPPLY_CONFIG_HASH
        );

        manager.configurePhase(
            COLLECTION_ID, PHASE_ID, _phaseConfig(2), _emptyGateConfig(), counterIds, counterConfigs
        );
        manager.setPhaseExecutor(COLLECTION_ID, PHASE_ID, EXECUTOR, true);

        IStreamMintManager.MintRequest memory request =
            _twoTokenRequest(RECIPIENT, RECIPIENT, AUTHORIZATION_ID);
        vm.prank(EXECUTOR);
        (uint256 firstTokenId, uint256 lastTokenId) = manager.mintPrepared(request);

        firstTokenId.assertEq(FIRST_TOKEN_ID, "first token");
        lastTokenId.assertEq(FIRST_TOKEN_ID + 1, "last token");
        uint256(ledger.counterValue(_supplyValueKey())).assertEq(2, "uncapped counter consumed");
    }

    function testMintRejectsBadRequestArraysAndRecipients() public {
        _configurePhase(5, 2, 1);
        IStreamMintManager.MintRequest memory mismatched =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        mismatched.beneficiaries = new address[](0);

        vm.expectRevert(abi.encodeWithSelector(IStreamMintManager.MintArrayLengthMismatch.selector));
        vm.prank(EXECUTOR);
        manager.mintPrepared(mismatched);

        IStreamMintManager.MintRequest memory zeroInitial =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        zeroInitial.initialRecipients[0] = address(0);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.InvalidMintRecipient.selector, 0, address(0), RECIPIENT
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(zeroInitial);

        IStreamMintManager.MintRequest memory zeroBeneficiary =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        zeroBeneficiary.beneficiaries[0] = address(0);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.InvalidMintRecipient.selector, 0, RECIPIENT, address(0)
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(zeroBeneficiary);

        uint256(ledger.counterValue(_supplyValueKey())).assertEq(0, "supply unchanged");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core unchanged");
    }

    function testAddressScopedCountersRejectMissingSubjects() public {
        _configureSingleCounterPhase(
            PHASE_ID,
            PAYER_COUNTER_ID,
            IStreamMintManager.CounterKeyMode.PAYER,
            1,
            1,
            PAYER_CONFIG_HASH
        );
        IStreamMintManager.MintRequest memory missingPayer =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        missingPayer.payer = address(0);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintCounterSubjectMissing.selector,
                PAYER_COUNTER_ID,
                IStreamMintManager.CounterKeyMode.PAYER
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(missingPayer);

        _configureSingleCounterPhase(
            OTHER_PHASE_ID,
            AUTHORIZER_COUNTER_ID,
            IStreamMintManager.CounterKeyMode.AUTHORIZER,
            1,
            1,
            AUTHORIZER_CONFIG_HASH
        );
        IStreamMintManager.MintRequest memory missingAuthorizer =
            _singleRequestForPhase(OTHER_PHASE_ID, RECIPIENT, SECOND_AUTHORIZATION_ID, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintCounterSubjectMissing.selector,
                AUTHORIZER_COUNTER_ID,
                IStreamMintManager.CounterKeyMode.AUTHORIZER
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(missingAuthorizer);
    }

    function testRecipientCounterKeysBeneficiaryNotInitialRecipient() public {
        _configurePhase(5, 2, 1);
        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        request.beneficiaries[0] = OTHER_RECIPIENT;

        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        core.ownerOf(FIRST_TOKEN_ID).assertEq(RECIPIENT, "token recipient owns token");
        uint256(ledger.counterValue(_recipientValueKey(RECIPIENT)))
            .assertEq(0, "initial recipient not counted");
        uint256(ledger.counterValue(_recipientValueKey(OTHER_RECIPIENT)))
            .assertEq(1, "beneficiary counted");
    }

    function testContextCounterRequiresNonzeroContextHash() public {
        _configureContextPhase();
        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintCounterSubjectMissing.selector,
                CONTEXT_COUNTER_ID,
                IStreamMintManager.CounterKeyMode.CONTEXT
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        request.contextHash = CONTEXT_HASH;
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);
        uint256(ledger.counterValue(_contextValueKey(CONTEXT_HASH))).assertEq(1, "context counter");
    }

    function testContextCounterConsumesOncePerBatch() public {
        _configureContextPhase(2);
        IStreamMintManager.MintRequest memory request =
            _batchRequest(RECIPIENT, 2, AUTHORIZATION_ID);
        request.contextHash = CONTEXT_HASH;

        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        bytes32 contextValueKey = _contextValueKey(CONTEXT_HASH);
        uint256(ledger.counterValue(contextValueKey)).assertEq(1, "single batch increment");
        core.ownerOf(FIRST_TOKEN_ID).assertEq(RECIPIENT, "first token owner");
        core.ownerOf(FIRST_TOKEN_ID + 1).assertEq(RECIPIENT, "second token owner");
        core.totalSupply().assertEq(2, "two tokens minted");

        IStreamMintManager.MintRequest memory replayContext =
            _singleRequest(RECIPIENT, SECOND_AUTHORIZATION_ID, CONTEXT_HASH);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.CounterCapExceeded.selector, contextValueKey, 2, 1
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(replayContext);

        uint256(ledger.counterValue(contextValueKey)).assertEq(1, "context unchanged");
        ledger.isManagerAuthorizationUsed(address(manager), SECOND_AUTHORIZATION_ID)
            .assertFalse("second auth not consumed");
    }

    function testCoreReceiverRevertRollsBackLedgerAuthAndPreparedState() public {
        _configurePhase(5, 2, 1);
        RevertingMintManagerReceiver receiver = new RevertingMintManagerReceiver();
        IStreamMintManager.MintRequest memory request =
            _singleRequest(address(receiver), AUTHORIZATION_ID, bytes32(0));

        vm.expectRevert(
            abi.encodeWithSelector(RevertingMintManagerReceiver.ReceiverRejected.selector)
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        uint256(ledger.counterValue(_supplyValueKey())).assertEq(0, "supply rolled back");
        uint256(ledger.counterValue(_recipientValueKey(address(receiver))))
            .assertEq(0, "recipient rolled back");
        ledger.isManagerAuthorizationUsed(address(manager), AUTHORIZATION_ID)
            .assertFalse("auth rolled back");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "circulation rolled back");
        core.pendingPreparedMintTokenId().assertEq(0, "pending cleared");
        core.preparedMint(FIRST_TOKEN_ID).exists.assertFalse("prepared rolled back");
    }

    function testSecondTokenReceiverRevertRollsBackWholeBatch() public {
        _configurePhase(5, 2, 2);
        RevertingMintManagerReceiver receiver = new RevertingMintManagerReceiver();
        IStreamMintManager.MintRequest memory request =
            _twoTokenRequest(RECIPIENT, address(receiver), AUTHORIZATION_ID);

        vm.expectRevert(
            abi.encodeWithSelector(RevertingMintManagerReceiver.ReceiverRejected.selector)
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        uint256(ledger.counterValue(_supplyValueKey())).assertEq(0, "supply rolled back");
        uint256(ledger.counterValue(_recipientValueKey(RECIPIENT)))
            .assertEq(0, "first recipient rolled back");
        uint256(ledger.counterValue(_recipientValueKey(address(receiver))))
            .assertEq(0, "second recipient rolled back");
        ledger.isManagerAuthorizationUsed(address(manager), AUTHORIZATION_ID)
            .assertFalse("auth rolled back");
        core.totalSupply().assertEq(0, "total supply rolled back");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "circulation rolled back");
        core.pendingPreparedMintTokenId().assertEq(0, "pending cleared");
        core.preparedMint(FIRST_TOKEN_ID).exists.assertFalse("first prepared rolled back");
        core.preparedMint(FIRST_TOKEN_ID + 1).exists.assertFalse("second prepared rolled back");
    }

    function testOversizedTokenDataRollsBackLedgerAuthAndPreparedState() public {
        _configurePhase(5, 2, 1);
        IStreamMintManager.MintRequest memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        uint256 maximum = core.MAX_TOKEN_DATA_BYTES();
        request.tokenData[0] = _asciiString(maximum + 1);

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamMetadataRenderer.MetadataFieldTooLarge.selector,
                bytes32("token.data"),
                maximum + 1,
                maximum
            )
        );
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        uint256(ledger.counterValue(_supplyValueKey())).assertEq(0, "supply rolled back");
        uint256(ledger.counterValue(_recipientValueKey(RECIPIENT)))
            .assertEq(0, "recipient rolled back");
        ledger.isManagerAuthorizationUsed(address(manager), AUTHORIZATION_ID)
            .assertFalse("auth rolled back");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "circulation rolled back");
        core.pendingPreparedMintTokenId().assertEq(0, "pending cleared");
        core.preparedMint(FIRST_TOKEN_ID).exists.assertFalse("prepared not written");
    }

    function testReceiverCannotReenterManagerMint() public {
        _configurePhase(5, 2, 1);
        ReentrantMintManagerReceiver receiver =
            new ReentrantMintManagerReceiver(manager, COLLECTION_ID, PHASE_ID);
        IStreamMintManager.MintRequest memory request =
            _singleRequest(address(receiver), AUTHORIZATION_ID, bytes32(0));

        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        receiver.reentryRejected().assertTrue("reentry not rejected");
        uint256(uint32(receiver.reentrySelector()))
            .assertEq(
                uint256(uint32(bytes4(keccak256("ReentrancyGuardReentrantCall()")))), "selector"
            );
        uint256(ledger.counterValue(_supplyValueKey())).assertEq(1, "single supply increment");
        core.totalSupply().assertEq(1, "single live token");
        core.ownerOf(FIRST_TOKEN_ID).assertEq(address(receiver), "receiver owner");
    }

    function testOwnerReceiverCannotMutatePhaseDuringPreparedMint() public {
        _configurePhase(5, 2, 1);
        bytes32 policyHash = manager.phasePolicyHash(COLLECTION_ID, PHASE_ID);
        MutatingMintManagerReceiver receiver =
            new MutatingMintManagerReceiver(manager, COLLECTION_ID, PHASE_ID);
        manager.transferOwnership(address(receiver));
        IStreamMintManager.MintRequest memory request =
            _singleRequest(address(receiver), AUTHORIZATION_ID, bytes32(0));

        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        receiver.mutationRejected().assertTrue("mutation not rejected");
        uint256(uint32(receiver.mutationSelector()))
            .assertEq(
                uint256(uint32(bytes4(keccak256("ReentrancyGuardReentrantCall()")))), "selector"
            );
        (, IStreamMintManager.MintPhaseConfig memory config) =
            manager.phase(COLLECTION_ID, PHASE_ID);
        config.paused.assertFalse("phase not paused");
        manager.phasePolicyHash(COLLECTION_ID, PHASE_ID).assertEq(policyHash, "policy unchanged");
        uint256(ledger.counterValue(_supplyValueKey())).assertEq(1, "supply incremented");
        core.ownerOf(FIRST_TOKEN_ID).assertEq(address(receiver), "receiver owner");
    }

    function testCollectionSupplyExhaustionRollsBackLedgerAuthAndPreparedState() public {
        uint256 collectionId = _createSecondCollectionWithSupply(1);
        _configureSingleCounterPhaseForCollection(
            collectionId,
            PHASE_ID,
            SUPPLY_COUNTER_ID,
            IStreamMintManager.CounterKeyMode.CONSTANT,
            5,
            2,
            SUPPLY_CONFIG_HASH
        );
        IStreamMintManager.MintRequest memory request = _batchRequestForCollectionAndPhase(
            collectionId, PHASE_ID, RECIPIENT, 2, AUTHORIZATION_ID
        );

        vm.expectRevert(abi.encodeWithSelector(StreamCore.CollectionSupplyReached.selector));
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);

        uint256(ledger.counterValue(_supplyValueKeyForCollectionAndPhase(collectionId, PHASE_ID)))
            .assertEq(0, "supply rolled back");
        ledger.isManagerAuthorizationUsed(address(manager), AUTHORIZATION_ID)
            .assertFalse("auth rolled back");
        core.viewCirSupply(collectionId).assertEq(0, "circulation rolled back");
        core.pendingPreparedMintTokenId().assertEq(0, "pending cleared");
        core.preparedMint(FIRST_TOKEN_ID).exists.assertFalse("first prepared rolled back");
        core.preparedMint(FIRST_TOKEN_ID + 1).exists.assertFalse("second prepared rolled back");
        core.lastAllocatedTokenId().assertEq(0, "allocator rolled back");
    }

    function _configurePhase(uint64 supplyCap, uint64 recipientCap, uint32 maxBatchQuantity)
        private
    {
        (
            bytes32[] memory counterIds,
            IStreamMintManager.MintCounterConfig[] memory counterConfigs
        ) = _twoCounterConfig(supplyCap, recipientCap);
        manager.configurePhase(
            COLLECTION_ID,
            PHASE_ID,
            _phaseConfig(maxBatchQuantity),
            _emptyGateConfig(),
            counterIds,
            counterConfigs
        );
        manager.setPhaseExecutor(COLLECTION_ID, PHASE_ID, EXECUTOR, true);
    }

    function _configureGatedPhase(
        MockMintGate gate,
        uint64 supplyCap,
        uint64 recipientCap,
        uint32 maxBatchQuantity
    ) private {
        IStreamMintManager.MintGateConfig memory gateConfig = _registerGate(gate);
        (
            bytes32[] memory counterIds,
            IStreamMintManager.MintCounterConfig[] memory counterConfigs
        ) = _twoCounterConfig(supplyCap, recipientCap);
        manager.configurePhase(
            COLLECTION_ID,
            PHASE_ID,
            _phaseConfig(maxBatchQuantity),
            gateConfig,
            counterIds,
            counterConfigs
        );
        manager.setPhaseExecutor(COLLECTION_ID, PHASE_ID, EXECUTOR, true);
    }

    function _configureGatedAuthorizerPhase(MockMintGate gate) private {
        IStreamMintManager.MintGateConfig memory gateConfig = _registerGate(gate);
        bytes32[] memory counterIds = new bytes32[](3);
        counterIds[0] = SUPPLY_COUNTER_ID;
        counterIds[1] = RECIPIENT_COUNTER_ID;
        counterIds[2] = AUTHORIZER_COUNTER_ID;
        IStreamMintManager.MintCounterConfig[] memory counterConfigs =
            new IStreamMintManager.MintCounterConfig[](3);
        counterConfigs[0] = _counter(
            IStreamMintManager.CounterKeyMode.CONSTANT,
            IStreamMintLedger.CounterCapMode.STATIC,
            5,
            SUPPLY_CONFIG_HASH
        );
        counterConfigs[1] = _counter(
            IStreamMintManager.CounterKeyMode.RECIPIENT,
            IStreamMintLedger.CounterCapMode.STATIC,
            2,
            RECIPIENT_CONFIG_HASH
        );
        counterConfigs[2] = _counter(
            IStreamMintManager.CounterKeyMode.AUTHORIZER,
            IStreamMintLedger.CounterCapMode.STATIC,
            1,
            AUTHORIZER_CONFIG_HASH
        );
        manager.configurePhase(
            COLLECTION_ID, PHASE_ID, _phaseConfig(1), gateConfig, counterIds, counterConfigs
        );
        manager.setPhaseExecutor(COLLECTION_ID, PHASE_ID, EXECUTOR, true);
    }

    function _registerGate(MockMintGate gate)
        private
        returns (IStreamMintManager.MintGateConfig memory)
    {
        moduleRegistry.setModule(
            address(gate),
            _gateModuleInfo(gate, IStreamMintModuleRegistry.ModuleStatus.ACTIVE),
            "ipfs://gate-metadata"
        );
        return IStreamMintManager.MintGateConfig({
            gate: address(gate),
            gateConfigHash: GATE_CONFIG_HASH,
            gateCodehash: bytes32(0),
            gateMetadataHash: bytes32(0),
            gateSemanticVersion: 0,
            gateGasLimit: 0
        });
    }

    function _gateModuleInfo(MockMintGate gate, IStreamMintModuleRegistry.ModuleStatus status)
        private
        view
        returns (IStreamMintModuleRegistry.MintModuleInfo memory)
    {
        return IStreamMintModuleRegistry.MintModuleInfo({
            status: status,
            interfaceId: type(IStreamMintGate).interfaceId,
            semanticVersion: 1,
            codehash: address(gate).codehash,
            metadataHash: GATE_METADATA_HASH,
            gasLimit: GATE_GAS_LIMIT
        });
    }

    function _createSecondCollection() private returns (uint256 collectionId) {
        return _createSecondCollectionWithSupply(10);
    }

    function _createSecondCollectionWithSupply(uint256 totalSupply)
        private
        returns (uint256 collectionId)
    {
        string[] memory scripts = new string[](1);
        scripts[0] = "function drawTwo(){}";
        core.createCollection(
            "Second",
            "6529",
            "Description",
            "https://6529.io",
            "CC0",
            "ipfs://base-two/",
            "https://cdn.example/script-two.js",
            bytes32(0),
            scripts
        );
        collectionId = SECOND_COLLECTION_ID;
        core.setCollectionData(collectionId, OTHER_RECIPIENT, 5, totalSupply, 1 days);
        core.addRandomizer(collectionId, randomizer);
    }

    function _configureSingleCounterPhase(
        bytes32 phaseId,
        bytes32 counterId,
        IStreamMintManager.CounterKeyMode keyMode,
        uint64 cap,
        uint32 maxBatchQuantity,
        bytes32 configHash
    ) private {
        _configureSingleCounterPhaseForCollection(
            COLLECTION_ID, phaseId, counterId, keyMode, cap, maxBatchQuantity, configHash
        );
    }

    function _configureSingleCounterPhaseForCollection(
        uint256 collectionId,
        bytes32 phaseId,
        bytes32 counterId,
        IStreamMintManager.CounterKeyMode keyMode,
        uint64 cap,
        uint32 maxBatchQuantity,
        bytes32 configHash
    ) private {
        bytes32[] memory counterIds = new bytes32[](1);
        counterIds[0] = counterId;
        IStreamMintManager.MintCounterConfig[] memory counterConfigs =
            new IStreamMintManager.MintCounterConfig[](1);
        counterConfigs[0] =
            _counter(keyMode, IStreamMintLedger.CounterCapMode.STATIC, cap, configHash);

        manager.configurePhase(
            collectionId,
            phaseId,
            _phaseConfig(maxBatchQuantity),
            _emptyGateConfig(),
            counterIds,
            counterConfigs
        );
        manager.setPhaseExecutor(collectionId, phaseId, EXECUTOR, true);
    }

    function _expectedPolicyHash(uint64 supplyCap, uint64 recipientCap, uint32 maxBatchQuantity)
        private
        view
        returns (bytes32)
    {
        address[] memory executors = new address[](1);
        executors[0] = EXECUTOR;
        return _expectedPolicyHash(
            _phaseConfig(maxBatchQuantity),
            _expectedOrderedCounterConfigHash(supplyCap, recipientCap),
            executors
        );
    }

    function _expectedPolicyHash(
        IStreamMintManager.MintPhaseConfig memory config,
        bytes32 orderedCounterConfigHash,
        address[] memory executors
    ) private view returns (bytes32) {
        return _expectedPolicyHash(
            config, _expectedGateConfigHash(_emptyGateConfig()), orderedCounterConfigHash, executors
        );
    }

    function _expectedPolicyHash(
        IStreamMintManager.MintPhaseConfig memory config,
        bytes32 gateConfigHash,
        bytes32 orderedCounterConfigHash,
        address[] memory executors
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                manager.POLICY_DOMAIN(),
                uint256(block.chainid),
                address(manager),
                address(ledger),
                address(moduleRegistry),
                manager.SCHEMA_VERSION(),
                COLLECTION_ID,
                PHASE_ID,
                _expectedPhaseConfigHash(config),
                gateConfigHash,
                orderedCounterConfigHash,
                _expectedExecutorSetHash(executors)
            )
        );
    }

    function _expectedPhaseConfigHash(IStreamMintManager.MintPhaseConfig memory config)
        private
        view
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                manager.PHASE_CONFIG_DOMAIN(),
                config.paused,
                config.startTime,
                config.endTime,
                config.maxBatchQuantity,
                config.configHash,
                config.metadataHash
            )
        );
    }

    function _expectedGateConfigHash(IStreamMintManager.MintGateConfig memory gateConfig)
        private
        view
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                manager.GATE_CONFIG_DOMAIN(),
                gateConfig.gate,
                gateConfig.gateConfigHash,
                gateConfig.gateCodehash,
                gateConfig.gateMetadataHash,
                gateConfig.gateSemanticVersion,
                gateConfig.gateGasLimit
            )
        );
    }

    function _expectedOrderedCounterConfigHash(uint64 supplyCap, uint64 recipientCap)
        private
        view
        returns (bytes32)
    {
        bytes32[] memory counterHashes = new bytes32[](2);
        counterHashes[0] = _expectedCounterConfigHash(
            SUPPLY_COUNTER_ID,
            IStreamMintManager.CounterKeyMode.CONSTANT,
            supplyCap,
            SUPPLY_CONFIG_HASH
        );
        counterHashes[1] = _expectedCounterConfigHash(
            RECIPIENT_COUNTER_ID,
            IStreamMintManager.CounterKeyMode.RECIPIENT,
            recipientCap,
            RECIPIENT_CONFIG_HASH
        );
        return keccak256(abi.encode(counterHashes));
    }

    function _expectedCounterConfigHash(
        bytes32 counterId,
        IStreamMintManager.CounterKeyMode keyMode,
        uint64 cap,
        bytes32 configHash
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                manager.COUNTER_CONFIG_DOMAIN(),
                counterId,
                true,
                keyMode,
                IStreamMintLedger.CounterCapMode.STATIC,
                IStreamMintLedger.CounterDeltaMode.STATIC,
                cap,
                uint64(1),
                configHash
            )
        );
    }

    function _expectedExecutorSetHash(address[] memory executors) private view returns (bytes32) {
        return keccak256(abi.encode(manager.EXECUTOR_SET_DOMAIN(), executors));
    }

    function _configureWindowedPhase(uint64 startTime, uint64 endTime) private {
        (
            bytes32[] memory counterIds,
            IStreamMintManager.MintCounterConfig[] memory counterConfigs
        ) = _twoCounterConfig(5, 2);
        IStreamMintManager.MintPhaseConfig memory config = _phaseConfig(1);
        config.startTime = startTime;
        config.endTime = endTime;
        manager.configurePhase(
            COLLECTION_ID, OTHER_PHASE_ID, config, _emptyGateConfig(), counterIds, counterConfigs
        );
        manager.setPhaseExecutor(COLLECTION_ID, OTHER_PHASE_ID, EXECUTOR, true);
    }

    function _configureContextPhase() private {
        _configureContextPhase(1);
    }

    function _configureContextPhase(uint32 maxBatchQuantity) private {
        bytes32[] memory counterIds = new bytes32[](1);
        counterIds[0] = CONTEXT_COUNTER_ID;
        IStreamMintManager.MintCounterConfig[] memory counterConfigs =
            new IStreamMintManager.MintCounterConfig[](1);
        counterConfigs[0] = _counter(
            IStreamMintManager.CounterKeyMode.CONTEXT,
            IStreamMintLedger.CounterCapMode.STATIC,
            1,
            CONTEXT_CONFIG_HASH
        );
        manager.configurePhase(
            COLLECTION_ID,
            PHASE_ID,
            _phaseConfig(maxBatchQuantity),
            _emptyGateConfig(),
            counterIds,
            counterConfigs
        );
        manager.setPhaseExecutor(COLLECTION_ID, PHASE_ID, EXECUTOR, true);
    }

    function _twoCounterConfig(uint64 supplyCap, uint64 recipientCap)
        private
        pure
        returns (
            bytes32[] memory counterIds,
            IStreamMintManager.MintCounterConfig[] memory counterConfigs
        )
    {
        counterIds = new bytes32[](2);
        counterIds[0] = SUPPLY_COUNTER_ID;
        counterIds[1] = RECIPIENT_COUNTER_ID;
        counterConfigs = new IStreamMintManager.MintCounterConfig[](2);
        counterConfigs[0] = _counter(
            IStreamMintManager.CounterKeyMode.CONSTANT,
            IStreamMintLedger.CounterCapMode.STATIC,
            supplyCap,
            SUPPLY_CONFIG_HASH
        );
        counterConfigs[1] = _counter(
            IStreamMintManager.CounterKeyMode.RECIPIENT,
            IStreamMintLedger.CounterCapMode.STATIC,
            recipientCap,
            RECIPIENT_CONFIG_HASH
        );
    }

    function _counter(
        IStreamMintManager.CounterKeyMode keyMode,
        IStreamMintLedger.CounterCapMode capMode,
        uint64 cap,
        bytes32 configHash
    ) private pure returns (IStreamMintManager.MintCounterConfig memory) {
        return IStreamMintManager.MintCounterConfig({
                enabled: true,
                keyMode: keyMode,
                capMode: capMode,
                deltaMode: IStreamMintLedger.CounterDeltaMode.STATIC,
                staticCap: cap,
                staticIncrement: 1,
                counterConfigHash: configHash
            });
    }

    function _emptyGateConfig() private pure returns (IStreamMintManager.MintGateConfig memory) {
        return IStreamMintManager.MintGateConfig({
            gate: address(0),
            gateConfigHash: bytes32(0),
            gateCodehash: bytes32(0),
            gateMetadataHash: bytes32(0),
            gateSemanticVersion: 0,
            gateGasLimit: 0
        });
    }

    function _phaseConfig(uint32 maxBatchQuantity)
        private
        pure
        returns (IStreamMintManager.MintPhaseConfig memory)
    {
        return IStreamMintManager.MintPhaseConfig({
            paused: false,
            startTime: 0,
            endTime: 0,
            maxBatchQuantity: maxBatchQuantity,
            configHash: CONFIG_HASH,
            metadataHash: METADATA_HASH
        });
    }

    function _singleRequest(address recipient, bytes32 authorizationId, bytes32 contextHash)
        private
        view
        returns (IStreamMintManager.MintRequest memory)
    {
        return _singleRequestForPhase(PHASE_ID, recipient, authorizationId, contextHash);
    }

    function _singleRequestForPhase(
        bytes32 phaseId,
        address recipient,
        bytes32 authorizationId,
        bytes32 contextHash
    ) private view returns (IStreamMintManager.MintRequest memory request) {
        return _singleRequestForCollectionAndPhase(
                COLLECTION_ID, phaseId, recipient, authorizationId, contextHash
            );
    }

    function _singleRequestForCollectionAndPhase(
        uint256 collectionId,
        bytes32 phaseId,
        address recipient,
        bytes32 authorizationId,
        bytes32 contextHash
    ) private view returns (IStreamMintManager.MintRequest memory request) {
        address[] memory initialRecipients = new address[](1);
        initialRecipients[0] = recipient;
        address[] memory beneficiaries = new address[](1);
        beneficiaries[0] = recipient;
        string[] memory tokenData = new string[](1);
        tokenData[0] = "manager-token";
        uint256[] memory salts = new uint256[](1);
        salts[0] = 777;
        request = IStreamMintManager.MintRequest({
            collectionId: collectionId,
            phaseId: phaseId,
            payer: PAYER,
            authorizer: address(0),
            initialRecipients: initialRecipients,
            beneficiaries: beneficiaries,
            tokenData: tokenData,
            salts: salts,
            authorizationId: authorizationId,
            contextHash: contextHash,
            expectedPolicyHash: manager.phasePolicyHash(collectionId, phaseId),
            gateData: ""
        });
    }

    function _twoTokenRequest(
        address firstRecipient,
        address secondRecipient,
        bytes32 authorizationId
    ) private view returns (IStreamMintManager.MintRequest memory request) {
        address[] memory initialRecipients = new address[](2);
        initialRecipients[0] = firstRecipient;
        initialRecipients[1] = secondRecipient;
        address[] memory beneficiaries = new address[](2);
        beneficiaries[0] = firstRecipient;
        beneficiaries[1] = secondRecipient;
        string[] memory tokenData = new string[](2);
        tokenData[0] = "manager-token-one";
        tokenData[1] = "manager-token-two";
        uint256[] memory salts = new uint256[](2);
        salts[0] = 777;
        salts[1] = 778;
        request = IStreamMintManager.MintRequest({
            collectionId: COLLECTION_ID,
            phaseId: PHASE_ID,
            payer: PAYER,
            authorizer: address(0),
            initialRecipients: initialRecipients,
            beneficiaries: beneficiaries,
            tokenData: tokenData,
            salts: salts,
            authorizationId: authorizationId,
            contextHash: bytes32(0),
            expectedPolicyHash: manager.phasePolicyHash(COLLECTION_ID, PHASE_ID),
            gateData: ""
        });
    }

    function _threeTokenRequest(address recipient, bytes32 authorizationId)
        private
        view
        returns (IStreamMintManager.MintRequest memory request)
    {
        address[] memory initialRecipients = new address[](3);
        initialRecipients[0] = recipient;
        initialRecipients[1] = recipient;
        initialRecipients[2] = recipient;
        address[] memory beneficiaries = new address[](3);
        beneficiaries[0] = recipient;
        beneficiaries[1] = recipient;
        beneficiaries[2] = recipient;
        string[] memory tokenData = new string[](3);
        tokenData[0] = "manager-token-one";
        tokenData[1] = "manager-token-two";
        tokenData[2] = "manager-token-three";
        uint256[] memory salts = new uint256[](3);
        salts[0] = 777;
        salts[1] = 778;
        salts[2] = 779;
        request = IStreamMintManager.MintRequest({
            collectionId: COLLECTION_ID,
            phaseId: PHASE_ID,
            payer: PAYER,
            authorizer: address(0),
            initialRecipients: initialRecipients,
            beneficiaries: beneficiaries,
            tokenData: tokenData,
            salts: salts,
            authorizationId: authorizationId,
            contextHash: bytes32(0),
            expectedPolicyHash: manager.phasePolicyHash(COLLECTION_ID, PHASE_ID),
            gateData: ""
        });
    }

    function _batchRequest(address recipient, uint256 quantity, bytes32 authorizationId)
        private
        view
        returns (IStreamMintManager.MintRequest memory request)
    {
        return _batchRequestForCollectionAndPhase(
            COLLECTION_ID, PHASE_ID, recipient, quantity, authorizationId
        );
    }

    function _batchRequestForCollectionAndPhase(
        uint256 collectionId,
        bytes32 phaseId,
        address recipient,
        uint256 quantity,
        bytes32 authorizationId
    ) private view returns (IStreamMintManager.MintRequest memory request) {
        address[] memory initialRecipients = new address[](quantity);
        address[] memory beneficiaries = new address[](quantity);
        string[] memory tokenData = new string[](quantity);
        uint256[] memory salts = new uint256[](quantity);
        for (uint256 i = 0; i < quantity; i++) {
            initialRecipients[i] = recipient;
            beneficiaries[i] = recipient;
            tokenData[i] = "manager-token";
            salts[i] = 777 + i;
        }
        request = IStreamMintManager.MintRequest({
            collectionId: collectionId,
            phaseId: phaseId,
            payer: PAYER,
            authorizer: address(0),
            initialRecipients: initialRecipients,
            beneficiaries: beneficiaries,
            tokenData: tokenData,
            salts: salts,
            authorizationId: authorizationId,
            contextHash: bytes32(0),
            expectedPolicyHash: manager.phasePolicyHash(collectionId, phaseId),
            gateData: ""
        });
    }

    function _captureMintHashEvents(IStreamMintManager.MintRequest memory request)
        private
        returns (CapturedHashEvents memory captured)
    {
        bytes32 batchTopic = keccak256(
            "MintPreparedBatchExecuted(bytes32,uint256,bytes32,bytes32,bytes32,address,uint256,bytes32)"
        );
        bytes32 tokenTopic = keccak256(
            "MintPreparedTokenExecuted(bytes32,uint256,uint256,bytes32,uint256,address,address,bytes32,bytes32)"
        );
        bytes32 counterContextTopic = keccak256(
            "MintLedgerCounterConsumptionContext(bytes32,bytes32,bytes32,address,address,address,address,address,bytes32,bytes32)"
        );

        vm.recordLogs();
        vm.prank(EXECUTOR);
        manager.mintPrepared(request);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length == 0) {
                continue;
            }
            if (logs[i].emitter == address(manager) && logs[i].topics[0] == batchTopic) {
                captured.operationRoot = logs[i].topics[1];
                captured.foundBatch = true;
            }
            if (logs[i].emitter == address(manager) && logs[i].topics[0] == tokenTopic) {
                captured.operationId = logs[i].topics[1];
                captured.foundToken = true;
            }
            if (
                logs[i].emitter == address(ledger) && logs[i].topics[0] == counterContextTopic
                    && logs[i].topics[2] == RECIPIENT_COUNTER_ID
            ) {
                (
                    address observedManager,
                    address observedPayer,
                    address observedRecipient,
                    address observedAuthorizer,
                    address observedExecutor,
                    bytes32 observedContextHash,
                    bytes32 observedResolutionHash
                ) = abi.decode(
                    logs[i].data, (address, address, address, address, address, bytes32, bytes32)
                );
                observedManager.assertEq(address(manager), "context manager");
                observedPayer.assertEq(PAYER, "context payer");
                observedRecipient.assertEq(RECIPIENT, "context recipient");
                observedAuthorizer.assertEq(address(0), "context authorizer");
                observedExecutor.assertEq(EXECUTOR, "context executor");
                observedContextHash.assertEq(CONTEXT_HASH, "context hash");
                captured.recipientResolutionHash = observedResolutionHash;
                captured.foundRecipientResolution = true;
            }
        }

        captured.foundBatch.assertTrue("batch event found");
        captured.foundToken.assertTrue("token event found");
        captured.foundRecipientResolution.assertTrue("recipient resolution event found");
    }

    function _supplyValueKey() private view returns (bytes32) {
        return _supplyValueKeyForCollectionAndPhase(COLLECTION_ID, PHASE_ID);
    }

    function _supplyValueKeyForCollectionAndPhase(uint256 collectionId, bytes32 phaseId)
        private
        view
        returns (bytes32)
    {
        bytes32 subjectKey = manager.previewSubjectKey(
            IStreamMintManager.CounterKeyMode.CONSTANT,
            collectionId,
            phaseId,
            SUPPLY_COUNTER_ID,
            PAYER,
            RECIPIENT,
            EXECUTOR,
            address(0),
            bytes32(0)
        );
        return manager.previewCounterValueKey(collectionId, phaseId, SUPPLY_COUNTER_ID, subjectKey);
    }

    function _recipientValueKey(address recipient) private view returns (bytes32) {
        return _recipientValueKeyForPhase(PHASE_ID, recipient);
    }

    function _recipientValueKeyForPhase(bytes32 phaseId, address recipient)
        private
        view
        returns (bytes32)
    {
        return _recipientValueKeyForCollectionAndPhase(COLLECTION_ID, phaseId, recipient);
    }

    function _recipientValueKeyForCollectionAndPhase(
        uint256 collectionId,
        bytes32 phaseId,
        address recipient
    ) private view returns (bytes32) {
        bytes32 subjectKey = manager.previewSubjectKey(
            IStreamMintManager.CounterKeyMode.RECIPIENT,
            collectionId,
            phaseId,
            RECIPIENT_COUNTER_ID,
            PAYER,
            recipient,
            EXECUTOR,
            address(0),
            bytes32(0)
        );
        return
            manager.previewCounterValueKey(collectionId, phaseId, RECIPIENT_COUNTER_ID, subjectKey);
    }

    function _contextValueKey(bytes32 contextHash) private view returns (bytes32) {
        bytes32 subjectKey = manager.previewSubjectKey(
            IStreamMintManager.CounterKeyMode.CONTEXT,
            COLLECTION_ID,
            PHASE_ID,
            CONTEXT_COUNTER_ID,
            PAYER,
            RECIPIENT,
            EXECUTOR,
            address(0),
            contextHash
        );
        return
            manager.previewCounterValueKey(COLLECTION_ID, PHASE_ID, CONTEXT_COUNTER_ID, subjectKey);
    }

    function _valueKeyForPhase(
        bytes32 phaseId,
        bytes32 counterId,
        IStreamMintManager.CounterKeyMode keyMode,
        address payer,
        address recipient,
        address executor,
        address authorizer,
        bytes32 contextHash
    ) private view returns (bytes32) {
        bytes32 subjectKey = manager.previewSubjectKey(
            keyMode,
            COLLECTION_ID,
            phaseId,
            counterId,
            payer,
            recipient,
            executor,
            authorizer,
            contextHash
        );
        return manager.previewCounterValueKey(COLLECTION_ID, phaseId, counterId, subjectKey);
    }

    function _asciiString(uint256 length) private pure returns (string memory) {
        bytes memory data = new bytes(length);
        for (uint256 i = 0; i < length; ++i) {
            data[i] = "x";
        }
        return string(data);
    }

    function _expectedOperationRoot(
        IStreamMintManager.MintRequest memory request,
        bytes32 policyHash,
        uint256 operationNonce,
        uint256 quantity,
        address executor
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                manager.OPERATION_DOMAIN(),
                uint256(block.chainid),
                address(manager),
                address(core),
                address(ledger),
                request.collectionId,
                request.phaseId,
                policyHash,
                request.authorizationId,
                _expectedRequestCommitment(request),
                request.contextHash,
                executor,
                operationNonce,
                quantity
            )
        );
    }

    function _expectedRequestCommitment(IStreamMintManager.MintRequest memory request)
        private
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                request.payer,
                request.authorizer,
                keccak256(abi.encode(request.initialRecipients)),
                keccak256(abi.encode(request.beneficiaries)),
                keccak256(abi.encode(request.tokenData)),
                keccak256(abi.encode(request.salts))
            )
        );
    }
}
