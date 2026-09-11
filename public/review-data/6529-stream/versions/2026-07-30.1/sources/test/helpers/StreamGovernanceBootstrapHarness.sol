// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../smart-contracts/IStreamGovernanceExecutor.sol";
import "../../smart-contracts/IStreamModuleRegistry.sol";
import "../../smart-contracts/SSTORE2.sol";
import "../../smart-contracts/StreamGovernanceBootstrap.sol";
import "../../smart-contracts/StreamGovernanceEvidence.sol";
import "../../smart-contracts/StreamGovernanceExecutor.sol";
import "../../smart-contracts/StreamRoleRegistry.sol";
import "./CharacterizationTestBase.sol";

contract StreamGovernanceBootstrapTriggerMock {
    uint256 public value;

    function bootstrapWrite(uint256 value_) external {
        value = value_;
    }
}

contract StreamGovernanceBootstrapModuleMock {
    bytes4 private immutable _interfaceId;

    constructor(bytes4 interfaceId_) {
        _interfaceId = interfaceId_;
    }

    function supportsInterface(bytes4 interfaceId) external view returns (bool) {
        return interfaceId == _interfaceId || interfaceId == 0x01ffc9a7;
    }
}

contract StreamGovernanceBootstrapRegistryMock {
    bytes32 private immutable _manifestHash;
    uint64 private immutable _manifestRevision;
    string private _manifestURI;
    address[] private _modules;
    mapping(address => StreamGovernanceEvidence.ModuleRecord) private _records;
    bytes32 private _registrationChainHash;
    bool private _forceIneligible;
    bool private _allInterfaces;
    bool private _oversizedModuleRecordReturn;
    bool private _varyRecordByWarmth;
    address private _warmthVariantModule;
    address private _warmthProbe;
    uint256 private _reportedModuleCountOffset;
    uint256 private _interfaceGasToBurn;
    uint256 private _moduleCountGasToBurn;

    constructor(bytes32 manifestHash_, string memory manifestURI_, uint64 manifestRevision_) {
        _manifestHash = manifestHash_;
        _manifestURI = manifestURI_;
        _manifestRevision = manifestRevision_;
    }

    function addModule(
        address module,
        bytes32 moduleType,
        bytes4 interfaceId,
        bytes32 deploymentManifestHash,
        bytes32 moduleManifestHash,
        string calldata moduleManifestURI
    ) external {
        require(module != address(0) && module.code.length > 0, "invalid module");
        require(_records[module].status == 0, "duplicate module");
        StreamGovernanceEvidence.ModuleRecord storage record = _records[module];
        record.status = 1;
        record.moduleType = moduleType;
        record.moduleVersion = keccak256(abi.encode("bootstrap-module-version", module));
        record.interfaceId = interfaceId;
        record.runtimeCodeHash = module.codehash;
        record.deploymentManifestHash = deploymentManifestHash;
        record.moduleManifestHash = moduleManifestHash;
        record.moduleManifestURI = moduleManifestURI;
        record.registeredAt = 1;
        record.statusUpdatedAt = 1;
        record.revision = 1;
        uint256 index = _modules.length;
        _modules.push(module);
        _registrationChainHash = keccak256(
            abi.encode("BOOTSTRAP_REGISTRATION_CHAIN", _registrationChainHash, module, index)
        );
    }

    function moduleCount() external view returns (uint256) {
        _burnGas(_moduleCountGasToBurn);
        return _modules.length + _reportedModuleCountOffset;
    }

    function setModuleStatus(address module, uint8 status) external {
        _records[module].status = status;
    }

    function setForceIneligible(bool forceIneligible_) external {
        _forceIneligible = forceIneligible_;
    }

    function setAllInterfaces(bool allInterfaces_) external {
        _allInterfaces = allInterfaces_;
    }

    function setOversizedModuleRecordReturn(bool oversized_) external {
        _oversizedModuleRecordReturn = oversized_;
    }

    function setWarmthVariant(address module, address probe) external {
        require(_records[module].status != 0, "unknown warmth module");
        _warmthVariantModule = module;
        _warmthProbe = probe;
        _varyRecordByWarmth = true;
    }

    function setReportedModuleCountOffset(uint256 offset) external {
        _reportedModuleCountOffset = offset;
    }

    function setInterfaceGasToBurn(uint256 gasToBurn) external {
        _interfaceGasToBurn = gasToBurn;
    }

    function setModuleCountGasToBurn(uint256 gasToBurn) external {
        _moduleCountGasToBurn = gasToBurn;
    }

    function hideModuleFromEnumeration(address module) external {
        for (uint256 i = 0; i < _modules.length; i++) {
            if (_modules[i] != module) continue;
            _modules[i] = _modules[_modules.length - 1];
            _modules.pop();
            return;
        }
        revert("module not enumerated");
    }

    function duplicateModuleInEnumeration(address module) external {
        require(_records[module].status != 0, "unknown module");
        _modules.push(module);
    }

    function moduleAt(uint256 index) external view returns (address) {
        return _modules[index];
    }

    function registrationChainHash() external view returns (bytes32 chainHash, uint64 count) {
        return (_registrationChainHash, uint64(_modules.length + _reportedModuleCountOffset));
    }

    function moduleRegistryManifest()
        external
        view
        returns (bytes32 manifestHash, string memory manifestURI, uint64 manifestRevision)
    {
        return (_manifestHash, _manifestURI, _manifestRevision);
    }

    function moduleRecord(address module)
        external
        view
        returns (StreamGovernanceEvidence.ModuleRecord memory record)
    {
        if (_oversizedModuleRecordReturn) {
            assembly ("memory-safe") {
                return(0, 3000)
            }
        }
        record = _records[module];
        if (_varyRecordByWarmth && module == _warmthVariantModule) {
            address probe = _warmthProbe;
            uint256 accessGas;
            bytes32 probeCodeHash;
            assembly ("memory-safe") {
                let gasBefore := gas()
                probeCodeHash := extcodehash(probe)
                accessGas := sub(gasBefore, gas())
            }
            require(probeCodeHash == bytes32(0), "warmth probe has code");
            // EXTCODEHASH costs at most a few thousand gas here, so it fits uint32.
            // forge-lint: disable-next-line(unsafe-typecast)
            record.moduleGasLimit = uint32(accessGas);
        }
    }

    function isModuleEligible(address module, bytes32 moduleType, bytes4 interfaceId)
        external
        view
        returns (bool)
    {
        StreamGovernanceEvidence.ModuleRecord storage record = _records[module];
        return !_forceIneligible && record.status == 1 && record.moduleType == moduleType
            && record.interfaceId == interfaceId && record.runtimeCodeHash == module.codehash;
    }

    function supportsInterface(bytes4 interfaceId) external view returns (bool) {
        _burnGas(_interfaceGasToBurn);
        return _allInterfaces || interfaceId == type(IStreamModuleRegistry).interfaceId
            || interfaceId == 0x01ffc9a7;
    }

    function _burnGas(uint256 gasToBurn) private view {
        uint256 initialGas = gasleft();
        while (initialGas - gasleft() < gasToBurn) { }
    }
}

contract StreamGovernanceBootstrapRegistryRuntimeDriftMock is
    StreamGovernanceBootstrapRegistryMock
{
    constructor(bytes32 manifestHash_, string memory manifestURI_, uint64 manifestRevision_)
        StreamGovernanceBootstrapRegistryMock(manifestHash_, manifestURI_, manifestRevision_)
    { }

    function runtimeVersion() external pure returns (uint256) {
        return 2;
    }
}

contract StreamGovernanceBootstrapCoreMock {
    error UnauthorizedGovernanceExecutor(address actor);
    error NoExecutingGovernanceAction();

    address public immutable governanceExecutor;
    mapping(bytes32 => StreamGovernanceEvidence.PointerFacts) private _pointers;
    bool private _oversizedPointerReturn;

    constructor(address executor_) {
        governanceExecutor = executor_;
    }

    function setPointer(
        bytes32 pointerType,
        address target,
        bool frozen,
        bytes32 moduleType,
        bytes4 interfaceId,
        address registry,
        bytes32 moduleManifestHash,
        bytes32 deploymentManifestHash
    ) external {
        _pointers[pointerType] = StreamGovernanceEvidence.PointerFacts({
            target: target,
            codeHash: target.codehash,
            frozen: frozen,
            moduleType: moduleType,
            interfaceId: interfaceId,
            registry: registry,
            registryStatus: 1,
            moduleManifestHash: moduleManifestHash,
            deploymentManifestHash: deploymentManifestHash,
            revision: 1
        });
    }

    function setOversizedPointerReturn(bool oversized_) external {
        _oversizedPointerReturn = oversized_;
    }

    function updateSatellitePointer(bytes32, address) external view {
        if (msg.sender != governanceExecutor) {
            revert UnauthorizedGovernanceExecutor(msg.sender);
        }
        revert NoExecutingGovernanceAction();
    }

    function getSatellitePointer(bytes32 pointerType)
        external
        view
        returns (
            address target,
            bytes32 codeHash,
            bool frozen,
            bytes32 moduleType,
            bytes4 interfaceId,
            address registry,
            uint8 registryStatus,
            bytes32 moduleManifestHash,
            bytes32 deploymentManifestHash,
            uint64 revision
        )
    {
        if (_oversizedPointerReturn) {
            assembly ("memory-safe") {
                return(0, 1024)
            }
        }
        StreamGovernanceEvidence.PointerFacts storage facts = _pointers[pointerType];
        return (
            facts.target,
            facts.codeHash,
            facts.frozen,
            facts.moduleType,
            facts.interfaceId,
            facts.registry,
            facts.registryStatus,
            facts.moduleManifestHash,
            facts.deploymentManifestHash,
            facts.revision
        );
    }
}

contract StreamGovernanceBootstrapManifestMock {
    struct StreamSystemManifestUpdate {
        bytes32 manifestHash;
        string manifestURI;
        bytes32 eventCatalogHash;
        bytes32 compatibilityMatrixHash;
        bytes32 numericIdCatalogHash;
        bytes32 schemaCatalogHash;
        bytes32 canonicalizationCatalogHash;
        bytes32 specBundleHash;
        bytes32 reconstructionClientHash;
    }

    event StreamSystemManifestPublished(
        uint16 schemaVersion,
        bytes32 indexed manifestHash,
        address indexed payloadPointer,
        bytes32 indexed actionId
    );

    address public immutable core;
    IStreamGovernanceExecutor public immutable governanceExecutor;
    address private _payloadPointer;
    uint256 private _pointerCount;
    bool public failPublication;
    bool private _oversizedPointerCountReturn;
    uint256 private _publicationCountGasToBurn;

    constructor(address core_, IStreamGovernanceExecutor governanceExecutor_) {
        core = core_;
        governanceExecutor = governanceExecutor_;
    }

    function setFailPublication(bool failPublication_) external {
        failPublication = failPublication_;
    }

    function setOversizedPointerCountReturn(bool oversized_) external {
        _oversizedPointerCountReturn = oversized_;
    }

    function setPublicationCountGasToBurn(uint256 gasToBurn) external {
        _publicationCountGasToBurn = gasToBurn;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x37660ede || interfaceId == 0x01ffc9a7;
    }

    function streamSystemManifestPointer() external view returns (address) {
        return _payloadPointer;
    }

    function streamSystemManifestPointerCount() external view returns (uint256) {
        uint256 initialGas = gasleft();
        while (initialGas - gasleft() < _publicationCountGasToBurn) { }
        if (_oversizedPointerCountReturn) {
            assembly {
                return(0, 1024)
            }
        }
        return _pointerCount;
    }

    function publishStreamSystemManifest(
        address payloadPointer,
        StreamSystemManifestUpdate calldata update
    ) external {
        require(!failPublication, "publication failed");
        require(msg.sender == address(governanceExecutor), "not executor");
        (bool executing, bytes32 actionId, uint8 actionClass,,,) =
            governanceExecutor.currentAction();
        require(executing && actionId != bytes32(0) && actionClass <= 3, "bad governance context");
        _payloadPointer = payloadPointer;
        _pointerCount += 1;
        emit StreamSystemManifestPublished(1, update.manifestHash, payloadPointer, actionId);
    }
}

contract StreamGovernanceSSTORE2Writer {
    function write(bytes memory data) external returns (address) {
        return SSTORE2.write(data);
    }
}

contract StreamGovernanceRootMock {
    function callTarget(address target, bytes calldata data)
        external
        returns (bytes memory result)
    {
        (bool ok, bytes memory returnData) = target.call(data);
        if (!ok) {
            assembly ("memory-safe") {
                revert(add(returnData, 0x20), mload(returnData))
            }
        }
        return returnData;
    }
}

abstract contract StreamGovernanceBootstrapHarness is CharacterizationTestBase {
    bytes32 internal constant BOOTSTRAP_POINTER_TYPE = bytes32(uint256(1));
    bytes32 internal constant SYSTEM_MANIFEST_POINTER_TYPE =
        0x03f4d9e115b9c4c43ab58684ef44935e7cf92d54b8db1d97a707c8526faa3c1b;
    bytes32 internal constant SYSTEM_MANIFEST_MODULE_TYPE =
        0x47fd79d5a6e9b1d75dcedf141a46e2e8f6d95d5a5be2b88f197fa98a1436fec6;
    bytes32 internal constant BOOTSTRAP_MUTABLE_MODULE_TYPE = keccak256("BOOTSTRAP_MUTABLE_MODULE");
    bytes32 internal constant BOOTSTRAP_REGISTRY_ONLY_MODULE_TYPE =
        keccak256("BOOTSTRAP_REGISTRY_ONLY_MODULE");
    bytes4 internal constant BOOTSTRAP_MODULE_INTERFACE_ID = 0x12345678;
    bytes4 internal constant SYSTEM_MANIFEST_INTERFACE_ID = 0x37660ede;
    uint8 internal constant BOOTSTRAP_FAULT_NONE = 0;
    uint8 internal constant BOOTSTRAP_FAULT_MISSING_SYSTEM_POINTER = 1;
    uint8 internal constant BOOTSTRAP_FAULT_WRONG_SYSTEM_TARGET = 2;
    uint8 internal constant BOOTSTRAP_FAULT_UNFROZEN_SYSTEM_POINTER = 3;
    uint8 internal constant BOOTSTRAP_FAULT_INACTIVE_MODULE = 4;
    uint8 internal constant BOOTSTRAP_FAULT_EMPTY_REGISTRY_MANIFEST = 5;
    uint8 internal constant BOOTSTRAP_FAULT_POINTER_RECORD_MISMATCH = 6;
    uint8 internal constant BOOTSTRAP_FAULT_MODULE_INTERFACE_MISMATCH = 7;
    uint8 internal constant BOOTSTRAP_FAULT_POINTER_NOT_ENUMERATED = 8;
    uint8 internal constant BOOTSTRAP_FAULT_DUPLICATE_MODULE_ENUMERATION = 9;
    uint8 internal constant BOOTSTRAP_FAULT_DELEGATED_POINTER_TARGET = 10;
    uint8 internal constant BOOTSTRAP_FAULT_DELEGATED_REGISTRY_ONLY_MODULE = 11;
    bytes32 internal constant BOOTSTRAP_SCOPE_V1 =
        0xace275f08856e822491961304b01cdc9423d7d16c05518327353df5cd02e33f8;
    bytes32 internal constant BOOTSTRAP_STATE_V1 =
        0x96decef116f307400b4d1826658d33976ec923ce136ead67b736b8becbe781ef;
    bytes32 internal constant BOOTSTRAP_TRIGGER_V1 =
        0x9927dc0a368efe3d99880bb180d83938664a29ad399291c4544e4cab70c84548;
    bytes32 internal constant INVENTORY_LEAF_V1 =
        0x389d432187327bb28628b23403c9b3c549d0cf950e480ad6d69b7d9fa7b48b9d;
    bytes32 internal constant INVENTORY_CHAIN_V1 =
        0x9efe6891a30e5198982f60b2d916e3275b866addbee37b7d4b875e52d5251e89;
    bytes32 internal constant INVENTORY_ROOT_V1 =
        0xb524bfb9f69adc6c2d0e07003dd39a76b1d6a728dd95dbd495f709428d21b4ec;
    bytes32 internal constant PAYLOAD_V1 =
        0x8844b744a67cdcdb84ea3c6e3d686883da175820b9ff07a19cffa14bf62e6e81;
    bytes32 internal constant JCS =
        0x886c7c89c308c459ca8a626e0ef36a5ea9f4c7a7b56aaf86c71a2ddf3b4f9044;
    bytes32 internal constant PAYLOAD_ROOT_V1 =
        0xd6ab89b077c61a288c7168cf8f1c9a7a19464b10475735dae37cb46a0c94c40b;
    bytes32 internal constant PAYLOAD_LEAF_V1 =
        0x852f4811a2eb32694863d94ba41b545a65ef4c76086a32c35881f0c4e250a7b5;
    bytes32 internal constant PAYLOAD_LIST_V1 =
        0xa93750a5551ac5668c8f24cca85acaf1d5f8334fac9406f845fce1ce35548839;
    bytes32 internal constant GOVERNANCE_CALLS_V2 =
        0x10f09566fb70f7947b61639c2a53b3aec872069a8b46edd08ba14eb2b5942b70;
    bytes32 internal constant BATCH_SCOPE_V2 =
        0x6cfd5dfd67f064adac45602c05057edddda810734779c0ebe11b447e6985e31c;
    bytes32 internal constant BATCH_OLD_STATE_V2 =
        0xc5029f937b44065c2ad92d9253e07f06117567480206189fcc1409d5509222b7;
    bytes32 internal constant BATCH_NEW_STATE_V2 =
        0xce958009248d20d9574439fa374bc00c142940af2b496896b5bdbc00b882e98b;

    struct BootstrapArtifacts {
        StreamGovernanceExecutor executor;
        StreamRoleRegistry roleRegistry;
        address bootstrapAuthority;
        address governanceRoot;
        address[] initialGuardians;
        bytes32 initialGuardianSetHash;
        bytes32 terminalFreezeVetoMutationChain;
        uint64 terminalFreezeVetoMutationRevision;
        StreamGovernanceBootstrapTriggerMock trigger;
        StreamGovernanceBootstrapRegistryMock registry;
        StreamGovernanceBootstrapCoreMock core;
        StreamGovernanceBootstrapManifestMock manifest;
        StreamGovernanceBootstrapModuleMock mutablePointerModule;
        StreamGovernanceBootstrapModuleMock registryOnlyModule;
        address payloadRoot;
        bytes32 manifestHash;
        bytes32 inventoryRoot;
        uint64 inventoryCount;
        bytes32 triggerSetHash;
        uint256 triggerCount;
    }

    struct ScheduledBootstrapSeal {
        bytes32 actionId;
        GovernanceCall[] calls;
        bytes[] callDatas;
        uint64 notBefore;
    }

    struct BootstrapStateCommitment {
        bool bound;
        bool isSealed;
        address roleRegistry;
        bytes32 roleRegistryCodeHash;
        address governanceRoot;
        bytes32 governanceRootCodeHash;
        uint64 governanceRootRevision;
        bytes32 initialGuardianSetHash;
        uint256 initialGuardianCount;
        bytes32 terminalFreezeVetoMutationChain;
        uint64 terminalFreezeVetoMutationRevision;
        address core;
        bytes32 coreCodeHash;
        address systemManifestSatellite;
        bytes32 systemManifestSatelliteCodeHash;
        bytes32 triggerSetHash;
        uint256 triggerCount;
        bytes32 expectedTriggerSetHash;
        uint256 expectedTriggerCount;
        bytes32 expectedManifestHash;
        bytes32 expectedInventoryStateRoot;
        uint256 expectedInventoryLeafCount;
        bytes32 inventoryStateRoot;
        uint256 inventoryLeafCount;
        address bootstrapAuthority;
        address sealedPayloadPointer;
    }

    function _deployBoundBootstrap(address authority)
        internal
        returns (BootstrapArtifacts memory artifacts)
    {
        return _deployBoundBootstrapWithFault(authority, BOOTSTRAP_FAULT_NONE);
    }

    function _deployBoundBootstrapWithFault(address authority, uint8 fault)
        internal
        returns (BootstrapArtifacts memory artifacts)
    {
        address bootstrapAuthority = address(0xB00757A9);
        if (bootstrapAuthority == authority) bootstrapAuthority = address(0xB00757AA);
        artifacts.executor = new StreamGovernanceExecutor(bootstrapAuthority);
        artifacts.roleRegistry = new StreamRoleRegistry(address(artifacts.executor));
        artifacts.bootstrapAuthority = bootstrapAuthority;
        artifacts.governanceRoot = authority;
        artifacts.initialGuardians = new address[](2);
        artifacts.initialGuardians[0] = address(new StreamGovernanceRootMock());
        artifacts.initialGuardians[1] = address(new StreamGovernanceRootMock());
        if (uint160(artifacts.initialGuardians[0]) > uint160(artifacts.initialGuardians[1])) {
            (artifacts.initialGuardians[0], artifacts.initialGuardians[1]) =
            (artifacts.initialGuardians[1], artifacts.initialGuardians[0]);
        }
        artifacts.trigger = new StreamGovernanceBootstrapTriggerMock();
        bytes32 registryManifestHash = fault == BOOTSTRAP_FAULT_EMPTY_REGISTRY_MANIFEST
            ? bytes32(0)
            : keccak256("bootstrap-registry-manifest");
        string memory registryManifestURI = "ipfs://bootstrap-registry";
        artifacts.registry = new StreamGovernanceBootstrapRegistryMock(
            registryManifestHash, registryManifestURI, 1
        );
        artifacts.core = new StreamGovernanceBootstrapCoreMock(address(artifacts.executor));
        artifacts.manifest = new StreamGovernanceBootstrapManifestMock(
            address(artifacts.core), artifacts.executor
        );
        if (fault == BOOTSTRAP_FAULT_DELEGATED_POINTER_TARGET) {
            StreamGovernanceBootstrapModuleMock delegateModule =
                new StreamGovernanceBootstrapModuleMock(BOOTSTRAP_MODULE_INTERFACE_ID);
            address delegatedPointerTarget = address(0x770211);
            vm.etch(
                delegatedPointerTarget,
                abi.encodePacked(bytes3(0xef0100), bytes20(address(delegateModule)))
            );
            artifacts.mutablePointerModule =
                StreamGovernanceBootstrapModuleMock(delegatedPointerTarget);
        } else {
            artifacts.mutablePointerModule =
                new StreamGovernanceBootstrapModuleMock(BOOTSTRAP_MODULE_INTERFACE_ID);
        }
        if (fault == BOOTSTRAP_FAULT_DELEGATED_REGISTRY_ONLY_MODULE) {
            StreamGovernanceBootstrapModuleMock delegateModule =
                new StreamGovernanceBootstrapModuleMock(BOOTSTRAP_MODULE_INTERFACE_ID);
            address delegatedRegistryModule = address(0x770212);
            vm.etch(
                delegatedRegistryModule,
                abi.encodePacked(bytes3(0xef0100), bytes20(address(delegateModule)))
            );
            artifacts.registryOnlyModule =
                StreamGovernanceBootstrapModuleMock(delegatedRegistryModule);
        } else {
            artifacts.registryOnlyModule =
                new StreamGovernanceBootstrapModuleMock(BOOTSTRAP_MODULE_INTERFACE_ID);
        }
        StreamGovernanceBootstrapManifestMock alternateManifest;
        address systemPointerTarget = address(artifacts.manifest);
        if (fault == BOOTSTRAP_FAULT_WRONG_SYSTEM_TARGET) {
            alternateManifest = new StreamGovernanceBootstrapManifestMock(
                address(artifacts.core), artifacts.executor
            );
            systemPointerTarget = address(alternateManifest);
        }

        bytes32 systemModuleManifestHash = keccak256("bootstrap-system-module-manifest");
        bytes32 systemDeploymentManifestHash = keccak256("bootstrap-system-deployment-manifest");
        bytes32 mutableModuleManifestHash = keccak256("bootstrap-mutable-module-manifest");
        bytes32 mutableDeploymentManifestHash = keccak256("bootstrap-mutable-deployment-manifest");
        bytes32 registryOnlyModuleManifestHash =
            keccak256("bootstrap-registry-only-module-manifest");
        bytes32 registryOnlyDeploymentManifestHash =
            keccak256("bootstrap-registry-only-deployment-manifest");
        artifacts.registry
            .addModule(
                address(artifacts.manifest),
                SYSTEM_MANIFEST_MODULE_TYPE,
                SYSTEM_MANIFEST_INTERFACE_ID,
                systemDeploymentManifestHash,
                systemModuleManifestHash,
                "ipfs://bootstrap-system-module"
            );
        if (address(alternateManifest) != address(0)) {
            artifacts.registry
                .addModule(
                    address(alternateManifest),
                    SYSTEM_MANIFEST_MODULE_TYPE,
                    SYSTEM_MANIFEST_INTERFACE_ID,
                    keccak256("bootstrap-alternate-system-deployment-manifest"),
                    keccak256("bootstrap-alternate-system-module-manifest"),
                    "ipfs://bootstrap-alternate-system-module"
                );
        }
        artifacts.registry
            .addModule(
                address(artifacts.mutablePointerModule),
                BOOTSTRAP_MUTABLE_MODULE_TYPE,
                BOOTSTRAP_MODULE_INTERFACE_ID,
                mutableDeploymentManifestHash,
                mutableModuleManifestHash,
                "ipfs://bootstrap-mutable-module"
            );
        artifacts.registry
            .addModule(
                address(artifacts.registryOnlyModule),
                BOOTSTRAP_REGISTRY_ONLY_MODULE_TYPE,
                fault == BOOTSTRAP_FAULT_MODULE_INTERFACE_MISMATCH
                    ? bytes4(0x87654321)
                    : BOOTSTRAP_MODULE_INTERFACE_ID,
                registryOnlyDeploymentManifestHash,
                registryOnlyModuleManifestHash,
                "ipfs://bootstrap-registry-only-module"
            );
        if (fault == BOOTSTRAP_FAULT_POINTER_NOT_ENUMERATED) {
            artifacts.registry.hideModuleFromEnumeration(address(artifacts.mutablePointerModule));
        }
        if (fault == BOOTSTRAP_FAULT_DUPLICATE_MODULE_ENUMERATION) {
            artifacts.registry.duplicateModuleInEnumeration(address(artifacts.registryOnlyModule));
        }
        if (fault != BOOTSTRAP_FAULT_MISSING_SYSTEM_POINTER) {
            bytes32 pointerModuleManifestHash = address(alternateManifest) == address(0)
                ? systemModuleManifestHash
                : keccak256("bootstrap-alternate-system-module-manifest");
            bytes32 pointerDeploymentManifestHash = address(alternateManifest) == address(0)
                ? systemDeploymentManifestHash
                : keccak256("bootstrap-alternate-system-deployment-manifest");
            artifacts.core
                .setPointer(
                    SYSTEM_MANIFEST_POINTER_TYPE,
                    systemPointerTarget,
                    fault != BOOTSTRAP_FAULT_UNFROZEN_SYSTEM_POINTER,
                    SYSTEM_MANIFEST_MODULE_TYPE,
                    SYSTEM_MANIFEST_INTERFACE_ID,
                    address(artifacts.registry),
                    pointerModuleManifestHash,
                    pointerDeploymentManifestHash
                );
        }
        artifacts.core
            .setPointer(
                BOOTSTRAP_POINTER_TYPE,
                address(artifacts.mutablePointerModule),
                false,
                BOOTSTRAP_MUTABLE_MODULE_TYPE,
                BOOTSTRAP_MODULE_INTERFACE_ID,
                address(artifacts.registry),
                fault == BOOTSTRAP_FAULT_POINTER_RECORD_MISMATCH
                    ? keccak256("bootstrap-mismatched-pointer-module-manifest")
                    : mutableModuleManifestHash,
                mutableDeploymentManifestHash
            );
        if (fault == BOOTSTRAP_FAULT_INACTIVE_MODULE) {
            artifacts.registry.setModuleStatus(address(artifacts.mutablePointerModule), 2);
        }

        (artifacts.payloadRoot, artifacts.manifestHash) = _writeManifestPayload();
        bytes32[] memory pointerTypes = new bytes32[](2);
        pointerTypes[0] = BOOTSTRAP_POINTER_TYPE;
        pointerTypes[1] = SYSTEM_MANIFEST_POINTER_TYPE;
        address[] memory registries = new address[](1);
        registries[0] = address(artifacts.registry);
        _bindArtifacts(artifacts, authority, pointerTypes, registries, 1);
    }

    function _deployScaledBoundBootstrap(
        address authority,
        uint256 pointerCount,
        uint256[] memory registryModuleCounts,
        uint256 manifestURIBytes,
        address payloadRoot,
        bytes32 manifestHash,
        uint256 triggerCount
    ) internal returns (BootstrapArtifacts memory artifacts) {
        require(pointerCount != 0 && pointerCount <= 32, "scaled pointer count");
        require(
            registryModuleCounts.length != 0 && registryModuleCounts.length <= 8,
            "scaled registry count"
        );
        require(
            registryModuleCounts[0] >= pointerCount && registryModuleCounts[0] <= 128,
            "scaled first registry capacity"
        );
        uint256 totalLeaves = pointerCount + registryModuleCounts.length;
        for (uint256 i = 0; i < registryModuleCounts.length; i++) {
            require(registryModuleCounts[i] <= 128, "scaled module cap");
            totalLeaves += registryModuleCounts[i];
        }
        require(totalLeaves <= 80, "scaled leaf cap");
        require(manifestURIBytes != 0 && manifestURIBytes <= 2_048, "scaled URI length");
        require(triggerCount != 0 && triggerCount <= 128, "scaled trigger count");

        address bootstrapAuthority = address(0xB00757A9);
        if (bootstrapAuthority == authority) bootstrapAuthority = address(0xB00757AA);
        artifacts.executor = new StreamGovernanceExecutor(bootstrapAuthority);
        artifacts.roleRegistry = new StreamRoleRegistry(address(artifacts.executor));
        artifacts.bootstrapAuthority = bootstrapAuthority;
        artifacts.governanceRoot = authority;
        artifacts.initialGuardians = new address[](2);
        artifacts.initialGuardians[0] = address(new StreamGovernanceRootMock());
        artifacts.initialGuardians[1] = address(new StreamGovernanceRootMock());
        if (uint160(artifacts.initialGuardians[0]) > uint160(artifacts.initialGuardians[1])) {
            (artifacts.initialGuardians[0], artifacts.initialGuardians[1]) =
            (artifacts.initialGuardians[1], artifacts.initialGuardians[0]);
        }
        artifacts.trigger = new StreamGovernanceBootstrapTriggerMock();
        artifacts.core = new StreamGovernanceBootstrapCoreMock(address(artifacts.executor));
        artifacts.manifest = new StreamGovernanceBootstrapManifestMock(
            address(artifacts.core), artifacts.executor
        );
        artifacts.payloadRoot = payloadRoot;
        artifacts.manifestHash = manifestHash;

        string memory manifestURI = _filledString(manifestURIBytes);
        address[] memory registries = new address[](registryModuleCounts.length);
        for (uint256 i = 0; i < registries.length; i++) {
            registries[i] = address(
                new StreamGovernanceBootstrapRegistryMock(
                    keccak256(abi.encode("scaled-registry-manifest", i)), manifestURI, 1
                )
            );
        }
        _sortScaledAddresses(registries);
        artifacts.registry = StreamGovernanceBootstrapRegistryMock(registries[0]);

        bytes32 systemModuleManifestHash = keccak256("scaled-system-module-manifest");
        bytes32 systemDeploymentManifestHash = keccak256("scaled-system-deployment-manifest");
        artifacts.registry
            .addModule(
                address(artifacts.manifest),
                SYSTEM_MANIFEST_MODULE_TYPE,
                SYSTEM_MANIFEST_INTERFACE_ID,
                systemDeploymentManifestHash,
                systemModuleManifestHash,
                manifestURI
            );
        artifacts.core
            .setPointer(
                SYSTEM_MANIFEST_POINTER_TYPE,
                address(artifacts.manifest),
                true,
                SYSTEM_MANIFEST_MODULE_TYPE,
                SYSTEM_MANIFEST_INTERFACE_ID,
                address(artifacts.registry),
                systemModuleManifestHash,
                systemDeploymentManifestHash
            );

        uint256 pointerIndex;
        for (uint256 registryIndex = 0; registryIndex < registries.length; registryIndex++) {
            StreamGovernanceBootstrapRegistryMock registry =
                StreamGovernanceBootstrapRegistryMock(registries[registryIndex]);
            uint256 firstModuleIndex = registryIndex == 0 ? 1 : 0;
            for (
                uint256 moduleIndex = firstModuleIndex;
                moduleIndex < registryModuleCounts[registryIndex];
                moduleIndex++
            ) {
                StreamGovernanceBootstrapModuleMock module =
                    new StreamGovernanceBootstrapModuleMock(BOOTSTRAP_MODULE_INTERFACE_ID);
                bytes32 moduleType =
                    keccak256(abi.encode("scaled-module-type", registryIndex, moduleIndex));
                bytes32 deploymentManifestHash = keccak256(
                    abi.encode("scaled-deployment-manifest", registryIndex, moduleIndex)
                );
                bytes32 moduleManifestHash =
                    keccak256(abi.encode("scaled-module-manifest", registryIndex, moduleIndex));
                registry.addModule(
                    address(module),
                    moduleType,
                    BOOTSTRAP_MODULE_INTERFACE_ID,
                    deploymentManifestHash,
                    moduleManifestHash,
                    manifestURI
                );
                if (registryIndex == 0 && pointerIndex + 1 < pointerCount) {
                    pointerIndex += 1;
                    artifacts.core
                        .setPointer(
                            bytes32(pointerIndex),
                            address(module),
                            false,
                            moduleType,
                            BOOTSTRAP_MODULE_INTERFACE_ID,
                            address(registry),
                            moduleManifestHash,
                            deploymentManifestHash
                        );
                    if (pointerIndex == 1) artifacts.mutablePointerModule = module;
                } else if (address(artifacts.registryOnlyModule) == address(0)) {
                    artifacts.registryOnlyModule = module;
                }
            }
        }
        require(pointerIndex + 1 == pointerCount, "scaled pointers materialized");

        bytes32[] memory pointerTypes = new bytes32[](pointerCount);
        for (uint256 i = 0; i + 1 < pointerCount; i++) {
            pointerTypes[i] = bytes32(i + 1);
        }
        pointerTypes[pointerCount - 1] = SYSTEM_MANIFEST_POINTER_TYPE;
        _bindArtifacts(artifacts, authority, pointerTypes, registries, triggerCount);
    }

    function _bindArtifacts(
        BootstrapArtifacts memory artifacts,
        address authority,
        bytes32[] memory pointerTypes,
        address[] memory registries,
        uint256 triggerCount
    ) private {
        (artifacts.inventoryRoot, artifacts.inventoryCount) =
            _inventoryCommitment(artifacts.executor, artifacts.core, pointerTypes, registries);
        SystemManifestBootstrapTriggerExpectation[] memory triggers =
            new SystemManifestBootstrapTriggerExpectation[](triggerCount);
        for (uint256 i = 0; i < triggerCount; i++) {
            // i < triggerCount <= 128, so i + 1 fits uint32.
            // forge-lint: disable-next-line(unsafe-typecast)
            bytes4 triggerSelector = triggerCount == 1
                ? StreamGovernanceBootstrapTriggerMock.bootstrapWrite.selector
                : bytes4(uint32(i + 1));
            triggers[i] = SystemManifestBootstrapTriggerExpectation({
                triggerTarget: address(artifacts.trigger),
                triggerSelector: triggerSelector,
                triggerCodeHash: address(artifacts.trigger).codehash,
                allowedActionClassMask: 0x06
            });
            artifacts.triggerSetHash = keccak256(
                abi.encode(
                    BOOTSTRAP_TRIGGER_V1,
                    artifacts.triggerSetHash,
                    address(artifacts.trigger),
                    triggerSelector,
                    address(artifacts.trigger).codehash,
                    uint8(0x06)
                )
            );
        }
        artifacts.triggerCount = triggerCount;
        SystemManifestBootstrapBinding memory binding = SystemManifestBootstrapBinding({
            roleRegistry: address(artifacts.roleRegistry),
            governanceRoot: authority,
            governanceRootCodeHash: authority.codehash,
            initialTerminalFreezeVetoGuardians: artifacts.initialGuardians,
            core: address(artifacts.core),
            systemManifestSatellite: address(artifacts.manifest),
            expectedManifestHash: artifacts.manifestHash,
            expectedInventoryStateRoot: artifacts.inventoryRoot,
            expectedInventoryLeafCount: artifacts.inventoryCount,
            expectedTriggers: triggers,
            pointerTypes: pointerTypes,
            registries: registries
        });
        vm.prank(artifacts.bootstrapAuthority);
        artifacts.executor.bindSystemManifestBootstrap(binding);
        (bool stateOk, bytes memory stateData) = address(artifacts.executor)
            .staticcall(abi.encodeCall(artifacts.executor.systemManifestBootstrapState, ()));
        require(stateOk, "bound bootstrap state");
        BootstrapStateCommitment memory state = abi.decode(stateData, (BootstrapStateCommitment));
        artifacts.initialGuardianSetHash = state.initialGuardianSetHash;
        artifacts.terminalFreezeVetoMutationChain = state.terminalFreezeVetoMutationChain;
        artifacts.terminalFreezeVetoMutationRevision = state.terminalFreezeVetoMutationRevision;
    }

    function _filledString(uint256 length) private pure returns (string memory value) {
        bytes memory raw = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            raw[i] = bytes1(uint8(0x61));
        }
        value = string(raw);
    }

    function _sortScaledAddresses(address[] memory values) private pure {
        for (uint256 i = 1; i < values.length; i++) {
            address value = values[i];
            uint256 j = i;
            while (j != 0 && uint160(values[j - 1]) > uint160(value)) {
                values[j] = values[j - 1];
                j -= 1;
            }
            values[j] = value;
        }
    }

    function _deploySealedExecutor(address authority)
        internal
        returns (BootstrapArtifacts memory artifacts)
    {
        artifacts = _deployBoundBootstrap(authority);
        _sealBootstrap(artifacts, authority);
    }

    function _sealBootstrap(BootstrapArtifacts memory artifacts, address authority)
        internal
        returns (bytes32 actionId)
    {
        ScheduledBootstrapSeal memory scheduled = _scheduleBootstrapSeal(artifacts, authority);
        vm.warp(scheduled.notBefore);
        vm.prank(artifacts.bootstrapAuthority);
        artifacts.executor
            .executeGovernanceBatch(scheduled.actionId, scheduled.calls, scheduled.callDatas);
        return scheduled.actionId;
    }

    function _scheduleBootstrapSeal(BootstrapArtifacts memory artifacts, address)
        internal
        returns (ScheduledBootstrapSeal memory scheduled)
    {
        (scheduled.calls, scheduled.callDatas) = _bootstrapSealCalls(artifacts);
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _batchTransitionHashes(scheduled.calls);
        scheduled.notBefore = uint64(block.timestamp) + 48 hours;
        uint64 expiresAfter = scheduled.notBefore + 7 days;
        vm.prank(artifacts.bootstrapAuthority);
        artifacts.executor.publishGovernanceCallData(scheduled.callDatas);
        vm.prank(artifacts.bootstrapAuthority);
        scheduled.actionId = artifacts.executor
            .scheduleGovernanceBatch(
                StreamGovernanceActionClasses.POINTER_REPLACEMENT,
                scheduled.calls,
                scopeHash,
                oldValueHash,
                newValueHash,
                scheduled.notBefore,
                expiresAfter,
                keccak256("bootstrap-seal"),
                "ipfs://bootstrap-seal",
                artifacts.manifestHash
            );
    }

    function _bootstrapSealCalls(BootstrapArtifacts memory artifacts)
        private
        view
        returns (GovernanceCall[] memory calls, bytes[] memory callDatas)
    {
        StreamGovernanceEvidence.ManifestUpdate memory update =
            StreamGovernanceEvidence.ManifestUpdate({
                manifestHash: artifacts.manifestHash,
                manifestURI: "ipfs://bootstrap-system-manifest",
                eventCatalogHash: keccak256("event-catalog"),
                compatibilityMatrixHash: keccak256("compatibility-matrix"),
                numericIdCatalogHash: keccak256("numeric-id-catalog"),
                schemaCatalogHash: keccak256("schema-catalog"),
                canonicalizationCatalogHash: keccak256("canonicalization-catalog"),
                specBundleHash: keccak256("spec-bundle"),
                reconstructionClientHash: keccak256("reconstruction-client")
            });
        callDatas = new bytes[](2);
        callDatas[0] = abi.encodeCall(artifacts.executor.sealSystemManifestBootstrap, ());
        callDatas[1] = abi.encodeWithSelector(bytes4(0x09b1b5c6), artifacts.payloadRoot, update);

        bytes32 bootstrapScope =
            keccak256(abi.encode(BOOTSTRAP_SCOPE_V1, block.chainid, address(artifacts.executor)));
        bytes32 oldBootstrapState =
            _bootstrapStateHash(artifacts, bootstrapScope, false, address(0));
        bytes32 newBootstrapState =
            _bootstrapStateHash(artifacts, bootstrapScope, true, artifacts.payloadRoot);
        calls = new GovernanceCall[](2);
        calls[0] = GovernanceCall({
            target: address(artifacts.executor),
            value: 0,
            selector: artifacts.executor.sealSystemManifestBootstrap.selector,
            callDataHash: keccak256(callDatas[0]),
            scopeHash: bootstrapScope,
            oldValueHash: oldBootstrapState,
            newValueHash: newBootstrapState
        });
        calls[1] = GovernanceCall({
            target: address(artifacts.manifest),
            value: 0,
            selector: bytes4(0x09b1b5c6),
            callDataHash: keccak256(callDatas[1]),
            scopeHash: keccak256("bootstrap-manifest-scope"),
            oldValueHash: keccak256("bootstrap-manifest-old"),
            newValueHash: keccak256("bootstrap-manifest-new")
        });
    }

    function _batchTransitionHashes(GovernanceCall[] memory calls)
        private
        pure
        returns (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash)
    {
        bytes32 callsHash = keccak256(abi.encode(GOVERNANCE_CALLS_V2, calls));
        bytes32[] memory scopes = new bytes32[](2);
        bytes32[] memory oldValues = new bytes32[](2);
        bytes32[] memory newValues = new bytes32[](2);
        for (uint256 i = 0; i < 2; i++) {
            scopes[i] = calls[i].scopeHash;
            oldValues[i] = calls[i].oldValueHash;
            newValues[i] = calls[i].newValueHash;
        }
        scopeHash = keccak256(abi.encode(BATCH_SCOPE_V2, callsHash, scopes));
        oldValueHash = keccak256(abi.encode(BATCH_OLD_STATE_V2, callsHash, oldValues));
        newValueHash = keccak256(abi.encode(BATCH_NEW_STATE_V2, callsHash, newValues));
    }

    function _bootstrapStateHash(
        BootstrapArtifacts memory artifacts,
        bytes32 bootstrapScope,
        bool isSealed,
        address sealedPayloadPointer
    ) private view returns (bytes32) {
        BootstrapStateCommitment memory state;
        state.bound = true;
        state.isSealed = isSealed;
        state.roleRegistry = address(artifacts.roleRegistry);
        state.roleRegistryCodeHash = address(artifacts.roleRegistry).codehash;
        state.governanceRoot = artifacts.governanceRoot;
        state.governanceRootCodeHash = artifacts.governanceRoot.codehash;
        state.governanceRootRevision = 1;
        state.initialGuardianSetHash = artifacts.initialGuardianSetHash;
        state.initialGuardianCount = artifacts.initialGuardians.length;
        state.terminalFreezeVetoMutationChain = artifacts.terminalFreezeVetoMutationChain;
        state.terminalFreezeVetoMutationRevision = artifacts.terminalFreezeVetoMutationRevision;
        state.core = address(artifacts.core);
        state.coreCodeHash = address(artifacts.core).codehash;
        state.systemManifestSatellite = address(artifacts.manifest);
        state.systemManifestSatelliteCodeHash = address(artifacts.manifest).codehash;
        state.triggerSetHash = artifacts.triggerSetHash;
        state.triggerCount = artifacts.triggerCount;
        state.expectedTriggerSetHash = artifacts.triggerSetHash;
        state.expectedTriggerCount = artifacts.triggerCount;
        state.expectedManifestHash = artifacts.manifestHash;
        state.expectedInventoryStateRoot = artifacts.inventoryRoot;
        state.expectedInventoryLeafCount = artifacts.inventoryCount;
        state.inventoryStateRoot = artifacts.inventoryRoot;
        state.inventoryLeafCount = artifacts.inventoryCount;
        state.bootstrapAuthority = artifacts.bootstrapAuthority;
        state.sealedPayloadPointer = sealedPayloadPointer;
        return keccak256(
            bytes.concat(abi.encode(BOOTSTRAP_STATE_V1, bootstrapScope), abi.encode(state))
        );
    }

    function _writeManifestPayload() private returns (address root, bytes32 manifestHash) {
        StreamGovernanceSSTORE2Writer writer = new StreamGovernanceSSTORE2Writer();
        bytes memory payload = bytes("{}");
        address chunkPointer = writer.write(payload);
        bytes32 payloadHash = keccak256(payload);
        StreamGovernanceEvidence.ManifestChunk[] memory chunks =
            new StreamGovernanceEvidence.ManifestChunk[](1);
        chunks[0] = StreamGovernanceEvidence.ManifestChunk({
            pointer: chunkPointer, payloadLength: uint32(payload.length), payloadHash: payloadHash
        });
        bytes memory descriptor = abi.encode(
            bytes4(0x6c9d2530),
            uint16(1),
            PAYLOAD_V1,
            JCS,
            uint32(payload.length),
            uint16(1),
            chunks
        );
        root = writer.write(descriptor);
        bytes32[] memory leafHashes = new bytes32[](1);
        leafHashes[0] = keccak256(
            abi.encode(PAYLOAD_LEAF_V1, uint256(0), uint32(payload.length), payloadHash)
        );
        bytes32 listHash =
            keccak256(abi.encode(PAYLOAD_LIST_V1, uint32(payload.length), leafHashes));
        manifestHash = keccak256(
            abi.encode(
                PAYLOAD_ROOT_V1,
                uint16(1),
                PAYLOAD_V1,
                JCS,
                uint32(payload.length),
                uint16(1),
                listHash
            )
        );
    }

    function _inventoryCommitment(
        StreamGovernanceExecutor executor,
        StreamGovernanceBootstrapCoreMock core,
        bytes32[] memory pointerTypes,
        address[] memory registries
    ) private view returns (bytes32 inventoryRoot, uint64 inventoryCount) {
        bytes32 chainHash;
        uint64 leafIndex;
        for (uint256 i = 0; i < pointerTypes.length; i++) {
            (bool ok, bytes memory pointerData) = address(core)
                .staticcall(abi.encodeWithSelector(bytes4(0x3528d53c), pointerTypes[i]));
            require(ok && pointerData.length == 320, "bootstrap pointer facts");
            chainHash = _appendInventoryLeaf(
                chainHash, leafIndex, 0, address(core), pointerTypes[i], keccak256(pointerData)
            );
            leafIndex += 1;
        }
        for (uint256 i = 0; i < registries.length; i++) {
            (chainHash, leafIndex) = _appendRegistryInventory(chainHash, leafIndex, registries[i]);
        }
        inventoryCount = leafIndex;
        inventoryRoot = keccak256(
            abi.encode(
                INVENTORY_ROOT_V1,
                block.chainid,
                address(executor),
                address(core),
                inventoryCount,
                chainHash
            )
        );
    }

    function _appendRegistryInventory(bytes32 chainHash, uint64 leafIndex, address registryAddress)
        private
        view
        returns (bytes32, uint64)
    {
        StreamGovernanceBootstrapRegistryMock registry =
            StreamGovernanceBootstrapRegistryMock(registryAddress);
        uint256 moduleCount = registry.moduleCount();
        chainHash = _appendInventoryLeaf(
            chainHash,
            leafIndex,
            1,
            registryAddress,
            bytes32(0),
            _registryHeaderFactsHash(registry, moduleCount)
        );
        leafIndex += 1;
        for (uint256 moduleIndex = 0; moduleIndex < moduleCount; moduleIndex++) {
            chainHash = _appendInventoryLeaf(
                chainHash,
                leafIndex,
                2,
                registryAddress,
                bytes32(moduleIndex),
                _registryModuleFactsHash(registry, moduleIndex)
            );
            leafIndex += 1;
        }
        return (chainHash, leafIndex);
    }

    function _registryHeaderFactsHash(
        StreamGovernanceBootstrapRegistryMock registry,
        uint256 moduleCount
    ) private view returns (bytes32) {
        (bytes32 recordChain, uint64 recordCount) = registry.registrationChainHash();
        (bytes32 manifestHash, string memory manifestURI, uint64 revision) =
            registry.moduleRegistryManifest();
        return keccak256(
            abi.encode(
                address(registry).codehash,
                moduleCount,
                recordChain,
                recordCount,
                manifestHash,
                keccak256(bytes(manifestURI)),
                revision
            )
        );
    }

    function _registryModuleFactsHash(
        StreamGovernanceBootstrapRegistryMock registry,
        uint256 moduleIndex
    ) private view returns (bytes32) {
        address module = registry.moduleAt(moduleIndex);
        StreamGovernanceEvidence.ModuleRecord memory record = registry.moduleRecord(module);
        return keccak256(
            bytes.concat(
                abi.encode(
                    module,
                    record.status,
                    record.moduleType,
                    record.moduleVersion,
                    record.interfaceId,
                    record.moduleGasLimit
                ),
                abi.encode(
                    record.runtimeCodeHash,
                    record.deploymentManifestHash,
                    record.moduleManifestHash,
                    keccak256(bytes(record.moduleManifestURI)),
                    record.revision
                )
            )
        );
    }

    function _appendInventoryLeaf(
        bytes32 priorChainHash,
        uint64 leafIndex,
        uint8 leafKind,
        address leafHost,
        bytes32 leafKey,
        bytes32 leafFactsHash
    ) private pure returns (bytes32) {
        bytes32 leafHash = keccak256(
            abi.encode(INVENTORY_LEAF_V1, leafKind, leafHost, leafKey, leafFactsHash)
        );
        return keccak256(abi.encode(INVENTORY_CHAIN_V1, priorChainHash, leafIndex, leafHash));
    }
}
