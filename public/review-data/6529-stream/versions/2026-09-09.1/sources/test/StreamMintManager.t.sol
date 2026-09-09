// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/vendor/openzeppelin/ERC165.sol";
import "../smart-contracts/vendor/openzeppelin/IERC165.sol";
import "../smart-contracts/vendor/openzeppelin/IERC721Receiver.sol";
import "../smart-contracts/interfaces/stream/IStreamCore.sol";
import "../smart-contracts/interfaces/stream/IStreamMintGate.sol";
import "../smart-contracts/interfaces/stream/IStreamMintLedger.sol";
import "../smart-contracts/interfaces/stream/IStreamMintManager.sol";
import "../smart-contracts/interfaces/stream/IStreamMintModuleRegistry.sol";
import {LegacyStreamCore as StreamCore} from "./helpers/LegacyStreamCore.sol";
import "../smart-contracts/domains/metadata/StreamMetadataRenderer.sol";
import "../smart-contracts/domains/mint/StreamMintLedger.sol";
import "../smart-contracts/domains/mint/StreamMintManager.sol";
import "../smart-contracts/domains/mint/StreamMintModuleRegistry.sol";
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
        IStreamMintManager.MintBatch memory request = _request();
        try manager.executePreparedMint(request, request.resolverData) { }
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

    function _request() private view returns (IStreamMintManager.MintBatch memory request) {
        address[] memory initialRecipients = new address[](1);
        initialRecipients[0] = address(this);
        address[] memory beneficiaries = new address[](1);
        beneficiaries[0] = address(this);
        bytes[] memory tokenData = new bytes[](1);
        tokenData[0] = "reentrant-token";
        bytes32[] memory mintCommitments = new bytes32[](1);
        mintCommitments[0] = bytes32(uint256(99));
        request = IStreamMintManager.MintBatch({
            collectionId: collectionId,
            phaseId: phaseId,
            payer: address(this),
            authorizer: address(0),
            initialRecipients: initialRecipients,
            beneficiaries: beneficiaries,
            tokenData: tokenData,
            mintCommitments: mintCommitments,
            authorizationId: keccak256("reentrant-auth"),
            contextHash: bytes32(0),
            expectedPolicyHash: manager.phasePolicyHash(collectionId, phaseId),
            resolverData: ""
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

contract MintOperationAdapter {
    IStreamMintManager private immutable manager;

    constructor(IStreamMintManager manager_) {
        manager = manager_;
    }

    function preview(IStreamMintManager.MintBatch calldata batch, bytes calldata gateData)
        external
        view
        returns (bytes32 operationRoot, bytes32[] memory operationIds)
    {
        return manager.previewSingleStepMintOperation(batch, gateData);
    }

    function execute(IStreamMintManager.MintBatch calldata batch, bytes calldata gateData)
        external
        returns (uint256[] memory tokenIds, bytes32 operationRoot, bytes32[] memory operationIds)
    {
        return manager.executeSingleStepMint(batch, gateData);
    }
}

contract MintOperationRelayer {
    function preview(
        MintOperationAdapter adapter,
        IStreamMintManager.MintBatch calldata batch,
        bytes calldata gateData
    ) external view returns (bytes32 operationRoot, bytes32[] memory operationIds) {
        return adapter.preview(batch, gateData);
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
    uint256 private _nullifierCount;

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
        _nullifierCount = nullifier == bytes32(0) ? 0 : 1;
    }

    function setNullifierCount(uint256 count) external {
        _nullifier = bytes32(0);
        _nullifierCount = count;
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
        bytes32[] memory nullifiers = new bytes32[](_nullifierCount);
        for (uint256 i = 0; i < _nullifierCount; i++) {
            nullifiers[i] = _nullifier == bytes32(0) ? bytes32(i + 1) : _nullifier;
        }
        IStreamMintGate.GateResult memory result = IStreamMintGate.GateResult({
            authorizationId: authorizationId,
            nullifiers: nullifiers,
            authorizer: gateAuthorizer,
            authorizerKind: gateAuthorizer == address(0)
                ? uint8(IStreamMintManager.AuthorizerKind.NONE)
                : uint8(IStreamMintManager.AuthorizerKind.EOA_712),
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
    event MintBatchExecuted(
        uint16 schemaVersion,
        bytes32 indexed operationRoot,
        uint256 indexed collectionId,
        bytes32 indexed phaseId,
        address executor,
        address payer,
        address authorizer,
        uint256 firstTokenId,
        uint256 quantity,
        bytes32 contextHash,
        bytes32 gateHash,
        bytes32 currentPolicyHash,
        bytes32 boundPolicyHash
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
        bytes32 ledgerOperationRoot;
        bytes32 preparedStartedRoot;
        bytes32 preparedCompletedRoot;
        bool foundBatch;
        bool foundToken;
        bool foundRecipientResolution;
        bool foundLedgerRoot;
        bool foundPreparedStart;
    }

    struct ExpectedRootPreimage {
        uint256 chainId;
        address managerAddress;
        address coreAddress;
        address ledgerAddress;
        bytes32 executionPath;
        uint256 collectionId;
        bytes32 phaseId;
        bytes32 currentPolicyHash;
        bytes32 boundPolicyHash;
        bytes32 authorizationId;
        bytes32 requestCommitmentHash;
        bytes32 contextHash;
        address executor;
        uint256 firstOperationNonce;
        uint256 quantity;
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

    function testOperationIdentitySelectorsMatchAcceptedAbi() public pure {
        uint256(uint32(IStreamMintManager.executeSingleStepMint.selector))
            .assertEq(uint256(uint32(bytes4(0x286cd1d1))), "single-step selector");
        uint256(uint32(IStreamMintManager.executePreparedMint.selector))
            .assertEq(uint256(uint32(bytes4(0xc9281e5b))), "prepared selector");
        uint256(uint32(IStreamMintManager.previewSingleStepMintOperation.selector))
            .assertEq(uint256(uint32(bytes4(0xa5651f13))), "preview selector");
        uint256(uint32(IStreamMintManager.nextOperationNonce.selector))
            .assertEq(uint256(uint32(bytes4(0x37f8eaa5))), "nonce selector");
        uint256(uint32(IStreamMintLedger.consume.selector))
            .assertEq(uint256(uint32(bytes4(0x82e8f383))), "ledger consume selector");
        uint256(uint32(IStreamMintLedger.isManagerOperationRootUsed.selector))
            .assertEq(uint256(uint32(bytes4(0xe67d8006))), "ledger root-read selector");
        uint256(uint32(IStreamMintManager.isOperationRootUsed.selector))
            .assertEq(uint256(uint32(bytes4(0x12837042))), "manager root-read selector");
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

        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, GATE_AUTHORIZATION_ID, CONTEXT_HASH);
        request.authorizer = AUTHORIZER;
        bytes32 activePolicy = manager.phasePolicyHash(COLLECTION_ID, PHASE_ID);
        request.expectedPolicyHash = activePolicy;
        request.resolverData = bytes("gate-proof");
        gate.setExpectedCallData(
            abi.encodeWithSelector(
                IStreamMintGate.validateMint.selector,
                address(manager),
                EXECUTOR,
                COLLECTION_ID,
                PHASE_ID,
                PAYER,
                AUTHORIZER,
                request.initialRecipients,
                request.beneficiaries,
                CONTEXT_HASH,
                activePolicy,
                request.resolverData
            )
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
        vm.expectEmit(false, true, true, true);
        emit MintBatchExecuted(
            1,
            bytes32(0),
            COLLECTION_ID,
            PHASE_ID,
            EXECUTOR,
            PAYER,
            AUTHORIZER,
            FIRST_TOKEN_ID,
            1,
            CONTEXT_HASH,
            GATE_HASH,
            activePolicy,
            activePolicy
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

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

    function testGatedMintRequiresExplicitAuthorizationAndExactGateMatch() public {
        MockMintGate gate = new MockMintGate();
        _configureGatedPhase(gate, 5, 3, 1);
        gate.setResult(bytes32(0), address(0), 1, GATE_HASH);

        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, bytes32(0), bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintAuthorizationRequired.selector, COLLECTION_ID, PHASE_ID
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        IStreamMintManager.MintBatch memory requestWithCallerId =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintGateAuthorizationMismatch.selector,
                AUTHORIZATION_ID,
                bytes32(0)
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(requestWithCallerId, requestWithCallerId.resolverData);

        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core not touched");
    }

    function testGatedMintRejectsConflictingRequestAuthorizationId() public {
        MockMintGate gate = new MockMintGate();
        _configureGatedPhase(gate, 5, 3, 1);
        gate.setResult(GATE_AUTHORIZATION_ID, address(0), 1, GATE_HASH);

        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintGateAuthorizationMismatch.selector,
                AUTHORIZATION_ID,
                GATE_AUTHORIZATION_ID
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        ledger.isManagerAuthorizationUsed(address(manager), GATE_AUTHORIZATION_ID)
            .assertFalse("authorization not consumed");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core not touched");
    }

    function testGatedMintRejectsGateThatStopsAdvertisingInterface() public {
        MockMintGate gate = new MockMintGate();
        _configureGatedPhase(gate, 5, 3, 1);
        gate.setResult(GATE_AUTHORIZATION_ID, address(0), 1, GATE_HASH);
        gate.setAdvertisesInterface(false);

        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, GATE_AUTHORIZATION_ID, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintManager.MintGateNotActive.selector, address(gate))
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        ledger.isManagerAuthorizationUsed(address(manager), GATE_AUTHORIZATION_ID)
            .assertFalse("authorization not consumed");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core not touched");
    }

    function testGatedMintRejectsReplayAndRollsBack() public {
        MockMintGate gate = new MockMintGate();
        _configureGatedPhase(gate, 5, 3, 1);
        gate.setResult(GATE_AUTHORIZATION_ID, address(0), 1, GATE_HASH);

        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, GATE_AUTHORIZATION_ID, bytes32(0));
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        IStreamMintManager.MintBatch memory replay =
            _singleRequest(OTHER_RECIPIENT, GATE_AUTHORIZATION_ID, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.AuthorizationAlreadyConsumed.selector, GATE_AUTHORIZATION_ID
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(replay, replay.resolverData);

        uint256(ledger.counterValue(_recipientValueKey(OTHER_RECIPIENT)))
            .assertEq(0, "replay recipient not consumed");
        core.viewCirSupply(COLLECTION_ID).assertEq(1, "no replay mint");
    }

    function testGatedMintConsumesNullifierAndRejectsReplayAtomically() public {
        MockMintGate gate = new MockMintGate();
        _configureGatedPhase(gate, 5, 2, 1);
        gate.setResult(GATE_AUTHORIZATION_ID, address(0), 1, GATE_HASH);
        bytes32 nullifier = keccak256("gate-nullifier");
        gate.setNullifier(nullifier);

        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, GATE_AUTHORIZATION_ID, bytes32(0));
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        ledger.isManagerAuthorizationUsed(address(manager), GATE_AUTHORIZATION_ID)
            .assertTrue("authorization consumed");
        ledger.isManagerNullifierUsed(address(manager), nullifier).assertTrue("nullifier consumed");
        vm.prank(OTHER_EXECUTOR);
        manager.isNullifierUsed(nullifier).assertTrue("nullifier read caller-independent");
        manager.nextOperationNonce().assertEq(1, "nonce advanced once");

        gate.setResult(SECOND_AUTHORIZATION_ID, address(0), 1, GATE_HASH);
        IStreamMintManager.MintBatch memory replay =
            _singleRequest(OTHER_RECIPIENT, SECOND_AUTHORIZATION_ID, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintLedger.NullifierAlreadyConsumed.selector, nullifier)
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(replay, replay.resolverData);

        ledger.isManagerAuthorizationUsed(address(manager), SECOND_AUTHORIZATION_ID)
            .assertFalse("replay authorization rolled back");
        uint256(ledger.counterValue(_recipientValueKey(OTHER_RECIPIENT)))
            .assertEq(0, "replay recipient not consumed");
        core.viewCirSupply(COLLECTION_ID).assertEq(1, "no replay mint");
        manager.nextOperationNonce().assertEq(1, "replay nonce rolled back");
    }

    function testGatedMintRejectsNullifierCountAboveLaunchCapBeforeMutation() public {
        MockMintGate gate = new MockMintGate();
        _configureGatedPhase(gate, 5, 2, 1);
        gate.setResult(GATE_AUTHORIZATION_ID, address(0), 1, GATE_HASH);
        gate.setNullifierCount(17);

        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, GATE_AUTHORIZATION_ID, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintGateNullifierCountExceeded.selector,
                uint256(17),
                uint256(16)
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        ledger.isManagerAuthorizationUsed(address(manager), GATE_AUTHORIZATION_ID)
            .assertFalse("authorization not consumed");
        manager.nextOperationNonce().assertEq(0, "nonce not reserved");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core not touched");
    }

    function testGatedMintRejectsMaxQuantityBeforeMutation() public {
        MockMintGate gate = new MockMintGate();
        _configureGatedPhase(gate, 5, 3, 2);
        gate.setResult(GATE_AUTHORIZATION_ID, address(0), 1, GATE_HASH);

        IStreamMintManager.MintBatch memory request =
            _batchRequest(RECIPIENT, 2, GATE_AUTHORIZATION_ID);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintGateQuantityExceeded.selector, uint256(2), uint256(1)
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

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

        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, GATE_AUTHORIZATION_ID, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintManager.MintGateNotActive.selector, address(gate))
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        IStreamMintModuleRegistry.MintModuleInfo memory deprecatedInfo =
            _gateModuleInfo(gate, IStreamMintModuleRegistry.ModuleStatus.DEPRECATED);
        moduleRegistry.setModule(address(gate), deprecatedInfo, "ipfs://deprecated-gate");
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintManager.MintGateNotActive.selector, address(gate))
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        IStreamMintModuleRegistry.MintModuleInfo memory driftedInfo =
            _gateModuleInfo(gate, IStreamMintModuleRegistry.ModuleStatus.ACTIVE);
        driftedInfo.metadataHash = keccak256("drifted-gate-metadata");
        moduleRegistry.setModule(address(gate), driftedInfo, "ipfs://drifted-gate");
        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintManager.MintGateNotActive.selector, address(gate))
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        ledger.isManagerAuthorizationUsed(address(manager), GATE_AUTHORIZATION_ID)
            .assertFalse("authorization not consumed");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core not touched");
    }

    function testPreparedMintConsumesLedgerAndCompletesCoreMint() public {
        _configurePhase(5, 2, 2);
        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        bytes32 activePolicy = manager.phasePolicyHash(COLLECTION_ID, PHASE_ID);
        request.expectedPolicyHash = activePolicy;

        vm.prank(EXECUTOR);
        (uint256[] memory tokenIds,,) = manager.executePreparedMint(request, request.resolverData);
        uint256 firstTokenId = tokenIds[0];
        uint256 lastTokenId = tokenIds[tokenIds.length - 1];

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

    function testSingleStepPreviewIsReadOnlyAndExecutionMatchesTranscript() public {
        _configurePhase(5, 2, 2);
        IStreamMintManager.MintBatch memory request = _batchRequest(RECIPIENT, 2, AUTHORIZATION_ID);
        request.contextHash = CONTEXT_HASH;

        vm.recordLogs();
        vm.prank(EXECUTOR);
        (bytes32 previewRoot, bytes32[] memory previewIds) =
            manager.previewSingleStepMintOperation(request, request.resolverData);
        Vm.Log[] memory previewLogs = vm.getRecordedLogs();

        (previewRoot != bytes32(0)).assertTrue("preview root");
        previewIds.length.assertEq(2, "preview id count");
        (previewIds[0] != previewIds[1]).assertTrue("preview ids unique");
        previewLogs.length.assertEq(0, "preview emits nothing");
        manager.nextOperationNonce().assertEq(0, "preview nonce unchanged");
        manager.isAuthorizationUsed(AUTHORIZATION_ID).assertFalse("preview auth unused");
        manager.isOperationRootUsed(previewRoot).assertFalse("preview root unused");
        core.totalSupply().assertEq(0, "preview core unchanged");

        vm.recordLogs();
        vm.prank(EXECUTOR);
        (uint256[] memory tokenIds, bytes32 executedRoot, bytes32[] memory executedIds) =
            manager.executeSingleStepMint(request, request.resolverData);
        Vm.Log[] memory executionLogs = vm.getRecordedLogs();

        executedRoot.assertEq(previewRoot, "preview root matches execution");
        executedIds.length.assertEq(previewIds.length, "execution id count");
        tokenIds.length.assertEq(2, "token count");
        for (uint256 i = 0; i < executedIds.length; i++) {
            executedIds[i].assertEq(previewIds[i], "preview id matches execution");
            tokenIds[i].assertEq(FIRST_TOKEN_ID + i, "sequential token");
        }
        _assertSingleStepOperationEvents(
            executionLogs, executedRoot, executedIds, tokenIds, request
        );
        manager.nextOperationNonce().assertEq(2, "execution reserved both nonces");
        manager.isAuthorizationUsed(AUTHORIZATION_ID).assertTrue("execution auth used");
        manager.isOperationRootUsed(executedRoot).assertTrue("execution root used");
        vm.prank(OTHER_EXECUTOR);
        manager.isOperationRootUsed(executedRoot).assertTrue("root read caller-independent");
        core.totalSupply().assertEq(2, "single-step tokens minted");
    }

    function testSingleStepPreviewIsCallerSensitiveAndNonceRaceChangesRoot() public {
        _configurePhase(5, 3, 1);
        manager.setPhaseExecutor(COLLECTION_ID, PHASE_ID, OTHER_EXECUTOR, true);
        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, CONTEXT_HASH);

        vm.prank(EXECUTOR);
        (bytes32 executorRoot,) =
            manager.previewSingleStepMintOperation(request, request.resolverData);
        vm.prank(OTHER_EXECUTOR);
        (bytes32 otherExecutorRoot,) =
            manager.previewSingleStepMintOperation(request, request.resolverData);
        (executorRoot != otherExecutorRoot).assertTrue("executor is root-bound");

        IStreamMintManager.MintBatch memory intervening =
            _singleRequest(RECIPIENT, SECOND_AUTHORIZATION_ID, CONTEXT_HASH);
        vm.prank(EXECUTOR);
        manager.executeSingleStepMint(intervening, intervening.resolverData);

        vm.prank(EXECUTOR);
        (, bytes32 racedRoot,) = manager.executeSingleStepMint(request, request.resolverData);
        (racedRoot != executorRoot).assertTrue("nonce race changes root");
        manager.isOperationRootUsed(executorRoot).assertFalse("stale preview root unused");
        manager.isOperationRootUsed(racedRoot).assertTrue("executed root used");
    }

    function testSingleStepAdapterPreviewIsRelayerIndependentAndMatchesExecution() public {
        _configurePhase(5, 2, 2);
        MintOperationAdapter adapter = new MintOperationAdapter(manager);
        MintOperationRelayer relayer = new MintOperationRelayer();
        manager.setPhaseExecutor(COLLECTION_ID, PHASE_ID, address(adapter), true);
        IStreamMintManager.MintBatch memory request = _batchRequest(RECIPIENT, 2, AUTHORIZATION_ID);
        request.contextHash = CONTEXT_HASH;

        vm.prank(PAYER);
        (bytes32 directRoot, bytes32[] memory directIds) =
            adapter.preview(request, request.resolverData);
        vm.prank(OTHER_EXECUTOR);
        (bytes32 relayedRoot, bytes32[] memory relayedIds) =
            relayer.preview(adapter, request, request.resolverData);

        relayedRoot.assertEq(directRoot, "relayer cannot change adapter-bound root");
        relayedIds.length.assertEq(directIds.length, "relayed id count");
        for (uint256 i = 0; i < directIds.length; i++) {
            relayedIds[i].assertEq(directIds[i], "relayer cannot change adapter-bound id");
        }
        manager.nextOperationNonce().assertEq(0, "adapter previews do not reserve nonce");
        manager.isOperationRootUsed(directRoot).assertFalse("adapter preview root unused");

        IStreamMintManager.MintBatch memory substitutedPayer =
            _batchRequest(RECIPIENT, 2, AUTHORIZATION_ID);
        substitutedPayer.contextHash = CONTEXT_HASH;
        substitutedPayer.payer = OTHER_RECIPIENT;
        vm.prank(OTHER_EXECUTOR);
        (bytes32 substitutedPayerRoot,) =
            relayer.preview(adapter, substitutedPayer, substitutedPayer.resolverData);
        (substitutedPayerRoot != directRoot).assertTrue("payer remains root-bound");

        vm.prank(OTHER_EXECUTOR);
        (uint256[] memory tokenIds, bytes32 executedRoot, bytes32[] memory executedIds) =
            adapter.execute(request, request.resolverData);
        executedRoot.assertEq(directRoot, "adapter execution root");
        executedIds.length.assertEq(directIds.length, "adapter execution id count");
        tokenIds.length.assertEq(directIds.length, "adapter token count");
        for (uint256 i = 0; i < directIds.length; i++) {
            executedIds[i].assertEq(directIds[i], "adapter execution id");
        }
        manager.nextOperationNonce().assertEq(2, "adapter execution reserves nonce range");
        manager.isOperationRootUsed(executedRoot).assertTrue("adapter execution consumes root");
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
                ledger.VALUE_KEY_DOMAIN(),
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

        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, CONTEXT_HASH);
        uint256 operationNonce = manager.nextOperationNonce();
        CapturedHashEvents memory captured = _captureMintHashEvents(request);

        bytes32 expectedOperationRoot =
            _expectedOperationRoot(request, policyHash, operationNonce, 1, EXECUTOR, 7, 3);
        captured.operationRoot.assertEq(expectedOperationRoot, "operation root vector");
        bytes32 expectedTokenDataHash = keccak256(request.tokenData[0]);
        captured.operationId
            .assertEq(
                keccak256(
                    abi.encode(
                        manager.MINT_TOKEN_OPERATION_ID_DOMAIN(),
                        expectedOperationRoot,
                        operationNonce,
                        uint256(0),
                        expectedTokenDataHash,
                        request.mintCommitments[0]
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

        IStreamMintManager.MintBatch memory firstRequest =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, CONTEXT_HASH);
        CapturedHashEvents memory first = _captureMintHashEvents(firstRequest);

        IStreamMintManager.MintBatch memory secondRequest =
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
        MockMintGate gate = new MockMintGate();
        IStreamMintManager.MintGateConfig memory gateConfig = _registerGate(gate);
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
            COLLECTION_ID, PHASE_ID, _phaseConfig(1), gateConfig, counterIds, counterConfigs
        );
        manager.setPhaseExecutor(COLLECTION_ID, PHASE_ID, EXECUTOR, true);
        gate.setResult(GATE_AUTHORIZATION_ID, AUTHORIZER, 1, GATE_HASH);

        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, GATE_AUTHORIZATION_ID, bytes32(0));
        request.authorizer = AUTHORIZER;

        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

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

        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        IStreamMintManager.MintBatch memory otherPhaseRequest =
            _singleRequestForPhase(OTHER_PHASE_ID, RECIPIENT, SECOND_AUTHORIZATION_ID, bytes32(0));
        vm.prank(EXECUTOR);
        manager.executePreparedMint(otherPhaseRequest, otherPhaseRequest.resolverData);

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

        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        IStreamMintManager.MintBatch memory secondCollectionRequest =
            _singleRequestForCollectionAndPhase(
                secondCollectionId, PHASE_ID, RECIPIENT, SECOND_AUTHORIZATION_ID, bytes32(0)
            );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(secondCollectionRequest, secondCollectionRequest.resolverData);

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
        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        manager.setPhaseExecutor(COLLECTION_ID, PHASE_ID, OTHER_EXECUTOR, true);
        bytes32 refreshedPolicyHash = manager.phasePolicyHash(COLLECTION_ID, PHASE_ID);
        (refreshedPolicyHash != originalPolicyHash).assertTrue("policy refreshed");
        ledger.registeredPhasePolicyHash(address(manager), COLLECTION_ID, PHASE_ID)
            .assertEq(refreshedPolicyHash, "ledger policy refreshed");

        IStreamMintManager.MintBatch memory secondRequest =
            _singleRequest(RECIPIENT, SECOND_AUTHORIZATION_ID, bytes32(0));
        vm.prank(EXECUTOR);
        manager.executePreparedMint(secondRequest, secondRequest.resolverData);

        uint256(ledger.counterValue(_recipientValueKey(RECIPIENT)))
            .assertEq(2, "counter persisted across refresh");
    }

    function testRevokedLedgerWriterBlocksMintWithoutCoreMutation() public {
        _configurePhase(5, 2, 1);
        ledger.setLedgerWriter(address(manager), false);
        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.UnauthorizedLedgerWriter.selector, address(manager)
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        uint256(ledger.counterValue(_supplyValueKey())).assertEq(0, "supply not consumed");
        ledger.isManagerAuthorizationUsed(address(manager), AUTHORIZATION_ID)
            .assertFalse("auth not consumed");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core not touched");
    }

    function testAuthorizationReplayAndStalePolicyDoNotMutate() public {
        _configurePhase(5, 2, 1);
        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.AuthorizationAlreadyConsumed.selector, AUTHORIZATION_ID
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);
        uint256(ledger.counterValue(_supplyValueKey())).assertEq(1, "replay no supply drift");

        IStreamMintManager.MintBatch memory stale =
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
        manager.executePreparedMint(stale, stale.resolverData);
        ledger.isManagerAuthorizationUsed(address(manager), SECOND_AUTHORIZATION_ID)
            .assertFalse("stale auth unused");
    }

    function testMissingPolicyHashAndAuthorizationDoNotMutate() public {
        _configurePhase(5, 2, 1);
        IStreamMintManager.MintBatch memory missingPolicy =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        missingPolicy.expectedPolicyHash = bytes32(0);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintPolicyHashRequired.selector, COLLECTION_ID, PHASE_ID
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(missingPolicy, missingPolicy.resolverData);

        IStreamMintManager.MintBatch memory missingAuthorization =
            _singleRequest(RECIPIENT, bytes32(0), bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintAuthorizationRequired.selector, COLLECTION_ID, PHASE_ID
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(missingAuthorization, missingAuthorization.resolverData);

        uint256(ledger.counterValue(_supplyValueKey())).assertEq(0, "supply unchanged");
        ledger.isManagerAuthorizationUsed(address(manager), AUTHORIZATION_ID)
            .assertFalse("auth unchanged");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core unchanged");
    }

    function testDuplicateRecipientBatchCapRevertsThroughLedgerAndRollsBack() public {
        _configurePhase(5, 1, 2);
        IStreamMintManager.MintBatch memory request =
            _twoTokenRequest(RECIPIENT, RECIPIENT, AUTHORIZATION_ID);

        bytes32 recipientValueKey = _recipientValueKey(RECIPIENT);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.CounterCapExceeded.selector, recipientValueKey, 2, 1
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        uint256(ledger.counterValue(_supplyValueKey())).assertEq(0, "supply rollback");
        uint256(ledger.counterValue(_recipientValueKey(RECIPIENT)))
            .assertEq(0, "recipient rollback");
        ledger.isManagerAuthorizationUsed(address(manager), AUTHORIZATION_ID)
            .assertFalse("auth rollback");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core not touched");
    }

    function testDuplicateRecipientBatchCanReachExactCap() public {
        _configurePhase(5, 2, 2);
        IStreamMintManager.MintBatch memory request =
            _twoTokenRequest(RECIPIENT, RECIPIENT, AUTHORIZATION_ID);

        vm.prank(EXECUTOR);
        (uint256[] memory tokenIds,,) = manager.executePreparedMint(request, request.resolverData);
        uint256 firstTokenId = tokenIds[0];
        uint256 lastTokenId = tokenIds[tokenIds.length - 1];

        firstTokenId.assertEq(FIRST_TOKEN_ID, "first token");
        lastTokenId.assertEq(FIRST_TOKEN_ID + 1, "last token");
        uint256(ledger.counterValue(_supplyValueKey())).assertEq(2, "supply exact");
        uint256(ledger.counterValue(_recipientValueKey(RECIPIENT))).assertEq(2, "recipient exact");
        core.ownerOf(FIRST_TOKEN_ID).assertEq(RECIPIENT, "first owner");
        core.ownerOf(FIRST_TOKEN_ID + 1).assertEq(RECIPIENT, "second owner");
    }

    function testMaxLaunchBatchCanReachExactCapWithRepeatedRecipient() public {
        _configurePhase(10, 10, uint32(manager.MAX_PHASE_BATCH_QUANTITY()));
        IStreamMintManager.MintBatch memory request =
            _batchRequest(RECIPIENT, uint256(manager.MAX_PHASE_BATCH_QUANTITY()), AUTHORIZATION_ID);

        vm.prank(EXECUTOR);
        (uint256[] memory tokenIds,,) = manager.executePreparedMint(request, request.resolverData);
        uint256 firstTokenId = tokenIds[0];
        uint256 lastTokenId = tokenIds[tokenIds.length - 1];

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
        IStreamMintManager.MintBatch memory request =
            _threeTokenRequest(RECIPIENT, AUTHORIZATION_ID);

        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintManager.MintBatchQuantityLimitExceeded.selector, 3, 2)
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        uint256(ledger.counterValue(_supplyValueKey())).assertEq(0, "supply unchanged");
        uint256(ledger.counterValue(_recipientValueKey(RECIPIENT)))
            .assertEq(0, "recipient unchanged");
        ledger.isManagerAuthorizationUsed(address(manager), AUTHORIZATION_ID)
            .assertFalse("auth unused");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "core unchanged");
    }

    function testPhaseGuardsRejectUnknownPausedWindowAndUnauthorizedExecutor() public {
        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintPhaseDoesNotExist.selector, COLLECTION_ID, PHASE_ID
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

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
        manager.executePreparedMint(request, request.resolverData);

        manager.setPhasePaused(COLLECTION_ID, PHASE_ID, true);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintPhasePaused.selector, COLLECTION_ID, PHASE_ID
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        _configureWindowedPhase(uint64(block.timestamp + 10), uint64(block.timestamp + 20));
        IStreamMintManager.MintBatch memory otherRequest =
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
        manager.executePreparedMint(otherRequest, otherRequest.resolverData);

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
        manager.executePreparedMint(otherRequest, otherRequest.resolverData);
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

        IStreamMintManager.MintBatch memory pausedRequest =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintPhasePaused.selector, COLLECTION_ID, PHASE_ID
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(pausedRequest, pausedRequest.resolverData);

        vm.expectEmit(true, true, false, true);
        emit MintPhasePausedEvent(COLLECTION_ID, PHASE_ID, false, activePolicyHash, address(this));
        manager.setPhasePaused(COLLECTION_ID, PHASE_ID, false);
        bytes32 unpausedPolicyHash = manager.phasePolicyHash(COLLECTION_ID, PHASE_ID);
        unpausedPolicyHash.assertEq(activePolicyHash, "unpause restores active policy");
        ledger.registeredPhasePolicyHash(address(manager), COLLECTION_ID, PHASE_ID)
            .assertEq(unpausedPolicyHash, "unpaused policy registered");

        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

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

        IStreamMintManager.MintBatch memory removedExecutorRequest =
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
        manager.executePreparedMint(removedExecutorRequest, removedExecutorRequest.resolverData);

        IStreamMintManager.MintBatch memory retainedExecutorRequest =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        vm.prank(OTHER_EXECUTOR);
        manager.executePreparedMint(retainedExecutorRequest, retainedExecutorRequest.resolverData);
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

        IStreamMintManager.MintBatch memory request =
            _twoTokenRequest(RECIPIENT, RECIPIENT, AUTHORIZATION_ID);
        vm.prank(EXECUTOR);
        (uint256[] memory tokenIds,,) = manager.executePreparedMint(request, request.resolverData);
        uint256 firstTokenId = tokenIds[0];
        uint256 lastTokenId = tokenIds[tokenIds.length - 1];

        firstTokenId.assertEq(FIRST_TOKEN_ID, "first token");
        lastTokenId.assertEq(FIRST_TOKEN_ID + 1, "last token");
        uint256(ledger.counterValue(_supplyValueKey())).assertEq(2, "uncapped counter consumed");
    }

    function testMintRejectsBadRequestArraysAndRecipients() public {
        _configurePhase(5, 2, 1);
        IStreamMintManager.MintBatch memory mismatched =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        mismatched.beneficiaries = new address[](0);

        vm.expectRevert(abi.encodeWithSelector(IStreamMintManager.MintArrayLengthMismatch.selector));
        vm.prank(EXECUTOR);
        manager.executePreparedMint(mismatched, mismatched.resolverData);

        IStreamMintManager.MintBatch memory zeroInitial =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        zeroInitial.initialRecipients[0] = address(0);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.InvalidMintRecipient.selector, 0, address(0), RECIPIENT
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(zeroInitial, zeroInitial.resolverData);

        IStreamMintManager.MintBatch memory zeroBeneficiary =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        zeroBeneficiary.beneficiaries[0] = address(0);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.InvalidMintRecipient.selector, 0, RECIPIENT, address(0)
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(zeroBeneficiary, zeroBeneficiary.resolverData);

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
        IStreamMintManager.MintBatch memory missingPayer =
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
        manager.executePreparedMint(missingPayer, missingPayer.resolverData);

        _configureSingleCounterPhase(
            OTHER_PHASE_ID,
            AUTHORIZER_COUNTER_ID,
            IStreamMintManager.CounterKeyMode.AUTHORIZER,
            1,
            1,
            AUTHORIZER_CONFIG_HASH
        );
        IStreamMintManager.MintBatch memory missingAuthorizer =
            _singleRequestForPhase(OTHER_PHASE_ID, RECIPIENT, SECOND_AUTHORIZATION_ID, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintCounterSubjectMissing.selector,
                AUTHORIZER_COUNTER_ID,
                IStreamMintManager.CounterKeyMode.AUTHORIZER
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(missingAuthorizer, missingAuthorizer.resolverData);
    }

    function testRecipientCounterKeysBeneficiaryNotInitialRecipient() public {
        _configurePhase(5, 2, 1);
        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        request.beneficiaries[0] = OTHER_RECIPIENT;

        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        core.ownerOf(FIRST_TOKEN_ID).assertEq(RECIPIENT, "token recipient owns token");
        uint256(ledger.counterValue(_recipientValueKey(RECIPIENT)))
            .assertEq(0, "initial recipient not counted");
        uint256(ledger.counterValue(_recipientValueKey(OTHER_RECIPIENT)))
            .assertEq(1, "beneficiary counted");
    }

    function testContextCounterRequiresNonzeroContextHash() public {
        _configureContextPhase();
        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintManager.MintCounterSubjectMissing.selector,
                CONTEXT_COUNTER_ID,
                IStreamMintManager.CounterKeyMode.CONTEXT
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        request.contextHash = CONTEXT_HASH;
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);
        uint256(ledger.counterValue(_contextValueKey(CONTEXT_HASH))).assertEq(1, "context counter");
    }

    function testContextCounterConsumesOncePerBatch() public {
        _configureContextPhase(2);
        IStreamMintManager.MintBatch memory request = _batchRequest(RECIPIENT, 2, AUTHORIZATION_ID);
        request.contextHash = CONTEXT_HASH;

        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        bytes32 contextValueKey = _contextValueKey(CONTEXT_HASH);
        uint256(ledger.counterValue(contextValueKey)).assertEq(1, "single batch increment");
        core.ownerOf(FIRST_TOKEN_ID).assertEq(RECIPIENT, "first token owner");
        core.ownerOf(FIRST_TOKEN_ID + 1).assertEq(RECIPIENT, "second token owner");
        core.totalSupply().assertEq(2, "two tokens minted");

        IStreamMintManager.MintBatch memory replayContext =
            _singleRequest(RECIPIENT, SECOND_AUTHORIZATION_ID, CONTEXT_HASH);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintLedger.CounterCapExceeded.selector, contextValueKey, 2, 1
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(replayContext, replayContext.resolverData);

        uint256(ledger.counterValue(contextValueKey)).assertEq(1, "context unchanged");
        ledger.isManagerAuthorizationUsed(address(manager), SECOND_AUTHORIZATION_ID)
            .assertFalse("second auth not consumed");
    }

    function testCoreReceiverRevertRollsBackLedgerAuthAndPreparedState() public {
        _configurePhase(5, 2, 1);
        RevertingMintManagerReceiver receiver = new RevertingMintManagerReceiver();
        IStreamMintManager.MintBatch memory request =
            _singleRequest(address(receiver), AUTHORIZATION_ID, bytes32(0));
        bytes32 expectedRoot = _expectedOperationRoot(
            request,
            manager.phasePolicyHash(COLLECTION_ID, PHASE_ID),
            manager.nextOperationNonce(),
            1,
            EXECUTOR,
            5,
            2
        );

        vm.expectRevert(
            abi.encodeWithSelector(RevertingMintManagerReceiver.ReceiverRejected.selector)
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

        uint256(ledger.counterValue(_supplyValueKey())).assertEq(0, "supply rolled back");
        uint256(ledger.counterValue(_recipientValueKey(address(receiver))))
            .assertEq(0, "recipient rolled back");
        ledger.isManagerAuthorizationUsed(address(manager), AUTHORIZATION_ID)
            .assertFalse("auth rolled back");
        ledger.isManagerOperationRootUsed(address(manager), expectedRoot)
            .assertFalse("root rolled back");
        manager.isOperationRootUsed(expectedRoot).assertFalse("manager root read rolled back");
        manager.nextOperationNonce().assertEq(0, "manager nonce rolled back");
        core.viewCirSupply(COLLECTION_ID).assertEq(0, "circulation rolled back");
        core.pendingPreparedMintTokenId().assertEq(0, "pending cleared");
        core.preparedMint(FIRST_TOKEN_ID).exists.assertFalse("prepared rolled back");
    }

    function testSecondTokenReceiverRevertRollsBackWholeBatch() public {
        _configurePhase(5, 2, 2);
        RevertingMintManagerReceiver receiver = new RevertingMintManagerReceiver();
        IStreamMintManager.MintBatch memory request =
            _twoTokenRequest(RECIPIENT, address(receiver), AUTHORIZATION_ID);

        vm.expectRevert(
            abi.encodeWithSelector(RevertingMintManagerReceiver.ReceiverRejected.selector)
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

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
        IStreamMintManager.MintBatch memory request =
            _singleRequest(RECIPIENT, AUTHORIZATION_ID, bytes32(0));
        uint256 maximum = core.MAX_TOKEN_DATA_BYTES();
        request.tokenData[0] = bytes(_asciiString(maximum + 1));

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamMetadataRenderer.MetadataFieldTooLarge.selector,
                bytes32("token.data"),
                maximum + 1,
                maximum
            )
        );
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

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
        IStreamMintManager.MintBatch memory request =
            _singleRequest(address(receiver), AUTHORIZATION_ID, bytes32(0));

        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

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
        IStreamMintManager.MintBatch memory request =
            _singleRequest(address(receiver), AUTHORIZATION_ID, bytes32(0));

        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

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
        IStreamMintManager.MintBatch memory request = _batchRequestForCollectionAndPhase(
            collectionId, PHASE_ID, RECIPIENT, 2, AUTHORIZATION_ID
        );

        vm.expectRevert(abi.encodeWithSelector(StreamCore.CollectionSupplyReached.selector));
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);

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
        returns (IStreamMintManager.MintBatch memory)
    {
        return _singleRequestForPhase(PHASE_ID, recipient, authorizationId, contextHash);
    }

    function _singleRequestForPhase(
        bytes32 phaseId,
        address recipient,
        bytes32 authorizationId,
        bytes32 contextHash
    ) private view returns (IStreamMintManager.MintBatch memory request) {
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
    ) private view returns (IStreamMintManager.MintBatch memory request) {
        address[] memory initialRecipients = new address[](1);
        initialRecipients[0] = recipient;
        address[] memory beneficiaries = new address[](1);
        beneficiaries[0] = recipient;
        bytes[] memory tokenData = new bytes[](1);
        tokenData[0] = "manager-token";
        bytes32[] memory mintCommitments = new bytes32[](1);
        mintCommitments[0] = bytes32(uint256(777));
        request = IStreamMintManager.MintBatch({
            collectionId: collectionId,
            phaseId: phaseId,
            payer: PAYER,
            authorizer: address(0),
            initialRecipients: initialRecipients,
            beneficiaries: beneficiaries,
            tokenData: tokenData,
            mintCommitments: mintCommitments,
            authorizationId: authorizationId,
            contextHash: contextHash,
            expectedPolicyHash: manager.phasePolicyHash(collectionId, phaseId),
            resolverData: ""
        });
    }

    function _twoTokenRequest(
        address firstRecipient,
        address secondRecipient,
        bytes32 authorizationId
    ) private view returns (IStreamMintManager.MintBatch memory request) {
        address[] memory initialRecipients = new address[](2);
        initialRecipients[0] = firstRecipient;
        initialRecipients[1] = secondRecipient;
        address[] memory beneficiaries = new address[](2);
        beneficiaries[0] = firstRecipient;
        beneficiaries[1] = secondRecipient;
        bytes[] memory tokenData = new bytes[](2);
        tokenData[0] = "manager-token-one";
        tokenData[1] = "manager-token-two";
        bytes32[] memory mintCommitments = new bytes32[](2);
        mintCommitments[0] = bytes32(uint256(777));
        mintCommitments[1] = bytes32(uint256(778));
        request = IStreamMintManager.MintBatch({
            collectionId: COLLECTION_ID,
            phaseId: PHASE_ID,
            payer: PAYER,
            authorizer: address(0),
            initialRecipients: initialRecipients,
            beneficiaries: beneficiaries,
            tokenData: tokenData,
            mintCommitments: mintCommitments,
            authorizationId: authorizationId,
            contextHash: bytes32(0),
            expectedPolicyHash: manager.phasePolicyHash(COLLECTION_ID, PHASE_ID),
            resolverData: ""
        });
    }

    function _threeTokenRequest(address recipient, bytes32 authorizationId)
        private
        view
        returns (IStreamMintManager.MintBatch memory request)
    {
        address[] memory initialRecipients = new address[](3);
        initialRecipients[0] = recipient;
        initialRecipients[1] = recipient;
        initialRecipients[2] = recipient;
        address[] memory beneficiaries = new address[](3);
        beneficiaries[0] = recipient;
        beneficiaries[1] = recipient;
        beneficiaries[2] = recipient;
        bytes[] memory tokenData = new bytes[](3);
        tokenData[0] = "manager-token-one";
        tokenData[1] = "manager-token-two";
        tokenData[2] = "manager-token-three";
        bytes32[] memory mintCommitments = new bytes32[](3);
        mintCommitments[0] = bytes32(uint256(777));
        mintCommitments[1] = bytes32(uint256(778));
        mintCommitments[2] = bytes32(uint256(779));
        request = IStreamMintManager.MintBatch({
            collectionId: COLLECTION_ID,
            phaseId: PHASE_ID,
            payer: PAYER,
            authorizer: address(0),
            initialRecipients: initialRecipients,
            beneficiaries: beneficiaries,
            tokenData: tokenData,
            mintCommitments: mintCommitments,
            authorizationId: authorizationId,
            contextHash: bytes32(0),
            expectedPolicyHash: manager.phasePolicyHash(COLLECTION_ID, PHASE_ID),
            resolverData: ""
        });
    }

    function _batchRequest(address recipient, uint256 quantity, bytes32 authorizationId)
        private
        view
        returns (IStreamMintManager.MintBatch memory request)
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
    ) private view returns (IStreamMintManager.MintBatch memory request) {
        address[] memory initialRecipients = new address[](quantity);
        address[] memory beneficiaries = new address[](quantity);
        bytes[] memory tokenData = new bytes[](quantity);
        bytes32[] memory mintCommitments = new bytes32[](quantity);
        for (uint256 i = 0; i < quantity; i++) {
            initialRecipients[i] = recipient;
            beneficiaries[i] = recipient;
            tokenData[i] = "manager-token";
            mintCommitments[i] = bytes32(uint256(777 + i));
        }
        request = IStreamMintManager.MintBatch({
            collectionId: collectionId,
            phaseId: phaseId,
            payer: PAYER,
            authorizer: address(0),
            initialRecipients: initialRecipients,
            beneficiaries: beneficiaries,
            tokenData: tokenData,
            mintCommitments: mintCommitments,
            authorizationId: authorizationId,
            contextHash: bytes32(0),
            expectedPolicyHash: manager.phasePolicyHash(collectionId, phaseId),
            resolverData: ""
        });
    }

    function _captureMintHashEvents(IStreamMintManager.MintBatch memory request)
        private
        returns (CapturedHashEvents memory captured)
    {
        bytes32 batchTopic = keccak256(
            "MintBatchExecuted(uint16,bytes32,uint256,bytes32,address,address,address,uint256,uint256,bytes32,bytes32,bytes32,bytes32)"
        );
        bytes32 tokenTopic =
            keccak256("PreparedMintCompleted(uint16,bytes32,uint256,uint256,bytes32,address)");
        bytes32 preparedStartTopic = keccak256(
            "PreparedMintStarted(uint16,bytes32,uint256,uint256,bytes32,uint256,address,bytes32,bytes32)"
        );
        bytes32 ledgerRootTopic = keccak256(
            "MintLedgerOperationRootConsumed(uint16,bytes32,address,bytes32,bytes32,bytes32)"
        );
        bytes32 counterContextTopic = keccak256(
            "MintLedgerCounterConsumptionContext(uint16,bytes32,bytes32,bytes32,address,address,address,address,address,bytes32,bytes32)"
        );

        vm.recordLogs();
        vm.prank(EXECUTOR);
        manager.executePreparedMint(request, request.resolverData);
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
                (uint16 schemaVersion, bytes32 preparedRoot,) =
                    abi.decode(logs[i].data, (uint16, bytes32, address));
                uint256(schemaVersion).assertEq(1, "prepared completion schema");
                captured.preparedCompletedRoot = preparedRoot;
                captured.foundToken = true;
            }
            if (logs[i].emitter == address(manager) && logs[i].topics[0] == preparedStartTopic) {
                (uint16 schemaVersion, bytes32 preparedRoot,,,,) =
                    abi.decode(logs[i].data, (uint16, bytes32, uint256, address, bytes32, bytes32));
                uint256(schemaVersion).assertEq(1, "prepared start schema");
                captured.preparedStartedRoot = preparedRoot;
                captured.foundPreparedStart = true;
            }
            if (logs[i].emitter == address(ledger) && logs[i].topics[0] == ledgerRootTopic) {
                captured.ledgerOperationRoot = logs[i].topics[1];
                captured.foundLedgerRoot = true;
            }
            if (
                logs[i].emitter == address(ledger) && logs[i].topics[0] == counterContextTopic
                    && logs[i].topics[2] == RECIPIENT_COUNTER_ID
            ) {
                captured.recipientResolutionHash = _assertRecipientCounterContext(logs[i]);
                captured.foundRecipientResolution = true;
            }
        }

        captured.foundBatch.assertTrue("batch event found");
        captured.foundToken.assertTrue("token event found");
        captured.foundPreparedStart.assertTrue("prepared start event found");
        captured.foundLedgerRoot.assertTrue("ledger root event found");
        captured.foundRecipientResolution.assertTrue("recipient resolution event found");
        captured.ledgerOperationRoot.assertEq(captured.operationRoot, "ledger joins batch root");
        captured.preparedStartedRoot.assertEq(captured.operationRoot, "prepared start joins batch");
        captured.preparedCompletedRoot
            .assertEq(captured.operationRoot, "prepared completion joins batch");
    }

    function _assertRecipientCounterContext(Vm.Log memory log)
        private
        view
        returns (bytes32 observedResolutionHash)
    {
        (
            uint16 observedSchemaVersion,
            address observedManager,
            address observedPayer,
            address observedRecipient,
            address observedAuthorizer,
            address observedExecutor,
            bytes32 observedContextHash,
            bytes32 resolutionHash
        ) = abi.decode(
            log.data, (uint16, address, address, address, address, address, bytes32, bytes32)
        );
        uint256(observedSchemaVersion).assertEq(1, "context schema");
        observedManager.assertEq(address(manager), "context manager");
        observedPayer.assertEq(PAYER, "context payer");
        observedRecipient.assertEq(RECIPIENT, "context recipient");
        observedAuthorizer.assertEq(address(0), "context authorizer");
        observedExecutor.assertEq(EXECUTOR, "context executor");
        observedContextHash.assertEq(CONTEXT_HASH, "context hash");
        return resolutionHash;
    }

    function _assertSingleStepOperationEvents(
        Vm.Log[] memory logs,
        bytes32 operationRoot,
        bytes32[] memory operationIds,
        uint256[] memory tokenIds,
        IStreamMintManager.MintBatch memory request
    ) private view {
        bytes32 batchTopic = keccak256(
            "MintBatchExecuted(uint16,bytes32,uint256,bytes32,address,address,address,uint256,uint256,bytes32,bytes32,bytes32,bytes32)"
        );
        bytes32 tokenTopic = keccak256(
            "MintTokenExecuted(uint16,bytes32,uint256,bytes32,uint256,bytes32,uint256,address,address,bytes32,bytes32)"
        );
        uint256 batchEvents;
        uint256 tokenEvents;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].emitter != address(manager) || logs[i].topics.length == 0) {
                continue;
            }
            if (logs[i].topics[0] == batchTopic) {
                logs[i].topics.length.assertEq(4, "batch indexed fields");
                logs[i].topics[1].assertEq(operationRoot, "batch root");
                uint256(logs[i].topics[2]).assertEq(request.collectionId, "batch collection");
                logs[i].topics[3].assertEq(request.phaseId, "batch phase");
                batchEvents++;
            } else if (logs[i].topics[0] == tokenTopic) {
                logs[i].topics.length.assertEq(4, "token indexed fields");
                uint256 index = tokenEvents;
                logs[i].topics[1].assertEq(operationIds[index], "token operation id");
                uint256(logs[i].topics[2]).assertEq(tokenIds[index], "token id");
                logs[i].topics[3].assertEq(operationRoot, "token root");
                tokenEvents++;
            }
        }
        batchEvents.assertEq(1, "one batch event");
        tokenEvents.assertEq(operationIds.length, "one token event per id");
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
        IStreamMintManager.MintBatch memory request,
        bytes32 policyHash,
        uint256 operationNonce,
        uint256 quantity,
        address executor,
        uint64 supplyCap,
        uint64 recipientCap
    ) private view returns (bytes32) {
        ExpectedRootPreimage memory preimage;
        preimage.chainId = block.chainid;
        preimage.managerAddress = address(manager);
        preimage.coreAddress = address(core);
        preimage.ledgerAddress = address(ledger);
        preimage.executionPath = manager.MINT_EXECUTION_PATH_PREPARED();
        preimage.collectionId = request.collectionId;
        preimage.phaseId = request.phaseId;
        preimage.currentPolicyHash = policyHash;
        preimage.boundPolicyHash = policyHash;
        preimage.authorizationId = request.authorizationId;
        preimage.requestCommitmentHash =
            _expectedRequestCommitment(request, supplyCap, recipientCap);
        preimage.contextHash = request.contextHash;
        preimage.executor = executor;
        preimage.firstOperationNonce = operationNonce;
        preimage.quantity = quantity;
        return keccak256(abi.encode(manager.MINT_OPERATION_ROOT_DOMAIN(), preimage));
    }

    function _expectedRequestCommitment(
        IStreamMintManager.MintBatch memory request,
        uint64 supplyCap,
        uint64 recipientCap
    ) private view returns (bytes32) {
        bytes32 validatedResultHash = _expectedUngatedValidatedResultHash(
            request, supplyCap, recipientCap
        );
        return keccak256(
            abi.encode(
                manager.MINT_REQUEST_COMMITMENT_DOMAIN(),
                request.payer,
                request.authorizer,
                request.expectedPolicyHash,
                keccak256(abi.encode(manager.BATCH_RECIPIENTS_DOMAIN(), request.initialRecipients)),
                keccak256(abi.encode(manager.BATCH_BENEFICIARIES_DOMAIN(), request.beneficiaries)),
                keccak256(abi.encode(manager.BATCH_TOKEN_DATA_DOMAIN(), request.tokenData)),
                keccak256(abi.encode(manager.BATCH_COMMITMENTS_DOMAIN(), request.mintCommitments)),
                validatedResultHash
            )
        );
    }

    function _expectedUngatedValidatedResultHash(
        IStreamMintManager.MintBatch memory request,
        uint64 supplyCap,
        uint64 recipientCap
    ) private view returns (bytes32) {
        IStreamMintLedger.CounterConsumption[] memory consumptions =
            new IStreamMintLedger.CounterConsumption[](2);
        consumptions[0] = _expectedConsumption(
            request,
            SUPPLY_COUNTER_ID,
            IStreamMintManager.CounterKeyMode.CONSTANT,
            supplyCap,
            SUPPLY_CONFIG_HASH
        );
        consumptions[1] = _expectedConsumption(
            request,
            RECIPIENT_COUNTER_ID,
            IStreamMintManager.CounterKeyMode.RECIPIENT,
            recipientCap,
            RECIPIENT_CONFIG_HASH
        );
        bytes32[] memory nullifiers = new bytes32[](0);
        return keccak256(
            abi.encode(
                manager.MINT_VALIDATED_RESULT_DOMAIN(),
                address(0),
                request.authorizationId,
                keccak256(abi.encode(manager.MINT_NULLIFIERS_DOMAIN(), nullifiers)),
                address(0),
                uint8(IStreamMintManager.AuthorizerKind.NONE),
                uint64(0),
                bytes32(0),
                keccak256(abi.encode(manager.MINT_COUNTER_CONSUMPTIONS_DOMAIN(), consumptions))
            )
        );
    }

    function _expectedConsumption(
        IStreamMintManager.MintBatch memory request,
        bytes32 counterId,
        IStreamMintManager.CounterKeyMode keyMode,
        uint64 cap,
        bytes32 configHash
    ) private view returns (IStreamMintLedger.CounterConsumption memory consumption) {
        bytes32 subjectKey;
        if (keyMode == IStreamMintManager.CounterKeyMode.CONSTANT) {
            subjectKey = keccak256(
                abi.encode(
                    manager.SUBJECT_DOMAIN(),
                    uint256(block.chainid),
                    address(ledger),
                    keyMode,
                    request.collectionId,
                    request.phaseId,
                    counterId
                )
            );
        } else {
            subjectKey = keccak256(
                abi.encode(
                    manager.SUBJECT_DOMAIN(),
                    uint256(block.chainid),
                    address(ledger),
                    keyMode,
                    request.beneficiaries[0]
                )
            );
        }
        consumption.valueKey = keccak256(
            abi.encode(
                ledger.VALUE_KEY_DOMAIN(),
                address(manager),
                request.collectionId,
                request.phaseId,
                counterId,
                subjectKey
            )
        );
        consumption.collectionId = request.collectionId;
        consumption.phaseId = request.phaseId;
        consumption.counterId = counterId;
        consumption.subjectKey = subjectKey;
        consumption.payer = request.payer;
        consumption.recipient = request.beneficiaries[0];
        consumption.authorizer = address(0);
        consumption.executor = EXECUTOR;
        consumption.increment = 1;
        consumption.cap = cap;
        consumption.contextHash = request.contextHash;
        consumption.resolutionHash = keccak256(
            abi.encode(
                manager.RESOLUTION_DOMAIN(),
                uint256(block.chainid),
                address(manager),
                address(ledger),
                request.collectionId,
                request.phaseId,
                counterId,
                subjectKey,
                uint256(0),
                configHash
            )
        );
    }
}
