// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/ERC165.sol";
import "../smart-contracts/IERC165.sol";
import "../smart-contracts/IStreamGovernanceExecutor.sol";
import "../smart-contracts/IStreamModuleRegistry.sol";
import "../smart-contracts/StreamGovernanceExecutor.sol";
import "../smart-contracts/StreamModuleRegistry.sol";
import "../smart-contracts/StreamRoleRegistry.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamGovernanceBootstrapHarness.sol";

interface VmStorageCheats {
    function load(address target, bytes32 slot) external view returns (bytes32 value);
    function store(address target, bytes32 slot, bytes32 value) external;
}

/// @notice Minimal governance-executor stand-in exposing the executing-action
///         context the registry gates on, so registry unit tests can drive
///         lifecycle calls under an arbitrary action class.
contract GovernanceExecutorContextMock {
    bool private _executing;
    bytes32 private _actionId;
    uint8 private _actionClass;
    bytes32 private _scopeHash;
    bytes32 private _oldValueHash;
    bytes32 private _newValueHash;

    function currentAction()
        external
        view
        returns (bool, bytes32, uint8, bytes32, bytes32, bytes32)
    {
        return (_executing, _actionId, _actionClass, _scopeHash, _oldValueHash, _newValueHash);
    }

    function callAs(
        uint8 actionClass,
        bytes32 actionId,
        bytes32 scopeHash,
        bytes32 oldValueHash,
        bytes32 newValueHash,
        address target,
        bytes calldata data
    ) external returns (bytes memory) {
        _executing = true;
        _actionId = actionId;
        _actionClass = actionClass;
        _scopeHash = scopeHash;
        _oldValueHash = oldValueHash;
        _newValueHash = newValueHash;
        (bool success, bytes memory returnData) = target.call(data);
        _executing = false;
        _actionId = bytes32(0);
        _actionClass = 0;
        _scopeHash = bytes32(0);
        _oldValueHash = bytes32(0);
        _newValueHash = bytes32(0);
        if (!success) {
            assembly {
                revert(add(returnData, 0x20), mload(returnData))
            }
        }
        return returnData;
    }

    function callOutsideAction(address target, bytes calldata data)
        external
        returns (bytes memory)
    {
        (bool success, bytes memory returnData) = target.call(data);
        if (!success) {
            assembly {
                revert(add(returnData, 0x20), mload(returnData))
            }
        }
        return returnData;
    }
}

contract GovernanceExecutorMalformedCurrentActionMock {
    uint8 private immutable _returnMode;

    constructor(uint8 returnMode) {
        _returnMode = returnMode;
    }

    function currentAction()
        external
        view
        returns (bool, bytes32, uint8, bytes32, bytes32, bytes32)
    {
        if (_returnMode == 0) {
            revert("current action unavailable");
        }
        uint256 returnSize = _returnMode == 1 ? 5 * 32 : 32_768;
        assembly ("memory-safe") {
            return(0, returnSize)
        }
    }
}

contract RegistryModuleMock is ERC165 {
    bytes4 private immutable _extraInterfaceId;

    constructor(bytes4 extraInterfaceId) {
        _extraInterfaceId = extraInterfaceId;
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == _extraInterfaceId || super.supportsInterface(interfaceId);
    }
}

/// @notice Simulates an ERC-165 read whose cost rose beyond the historical
///         30,000-gas convention.
contract RepricedRegistryModuleMock is ERC165 {
    bytes4 private immutable _extraInterfaceId;
    uint256 private immutable _minimumProbeGas;

    constructor(bytes4 extraInterfaceId, uint256 minimumProbeGas) {
        _extraInterfaceId = extraInterfaceId;
        _minimumProbeGas = minimumProbeGas;
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        if (gasleft() < _minimumProbeGas) revert();
        return interfaceId == _extraInterfaceId || super.supportsInterface(interfaceId);
    }
}

contract RegistryGasHeavyModuleMock is ERC165 {
    bytes4 private immutable _extraInterfaceId;
    uint256 private immutable _gasToBurn;

    constructor(bytes4 extraInterfaceId, uint256 gasToBurn) {
        _extraInterfaceId = extraInterfaceId;
        _gasToBurn = gasToBurn;
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        uint256 initialGas = gasleft();
        while (initialGas - gasleft() < _gasToBurn) { }
        return interfaceId == _extraInterfaceId || super.supportsInterface(interfaceId);
    }
}

/// @notice Returns deliberately adversarial ERC-165 returndata without asking
///         Solidity's ABI encoder to canonicalize it.
contract MalformedRegistryModuleMock {
    uint8 private immutable _mode;

    constructor(uint8 mode) {
        _mode = mode;
    }

    fallback() external {
        uint256 mode = _mode;
        assembly ("memory-safe") {
            switch mode
            case 0 { revert(0, 0) }
            case 1 {
                mstore(0, 1)
                return(0x1f, 1)
            }
            case 2 {
                mstore(0, 1)
                mstore(0x20, 0)
                return(0, 0x40)
            }
            default {
                mstore(0, 2)
                return(0, 0x20)
            }
        }
    }
}

contract RegistryGasStarvingModuleMock is ERC165 {
    bytes4 private immutable _extraInterfaceId;
    bool private _starve;

    constructor(bytes4 extraInterfaceId) {
        _extraInterfaceId = extraInterfaceId;
    }

    function setStarve(bool starve) external {
        _starve = starve;
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        bool supported = interfaceId == _extraInterfaceId || super.supportsInterface(interfaceId);
        if (!_starve) return supported;
        assembly ("memory-safe") {
            if lt(gas(), 5000) { revert(0, 0) }
            for { } gt(gas(), 1000) { } { }
            mstore(0, supported)
            return(0, 0x20)
        }
    }
}

/// @notice Consumes every unit of gas forwarded to the ERC-165 probe.
contract GasExhaustingRegistryModuleMock {
    fallback() external {
        assembly ("memory-safe") {
            for { } 1 { } { }
        }
    }
}

contract RegistryMutableInterfaceModuleMock is ERC165 {
    bytes4 private immutable _extraInterfaceId;
    bool private _enabled = true;

    constructor(bytes4 extraInterfaceId) {
        _extraInterfaceId = extraInterfaceId;
    }

    function setInterfaceEnabled(bool enabled) external {
        _enabled = enabled;
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return
            (_enabled && interfaceId == _extraInterfaceId) || super.supportsInterface(interfaceId);
    }
}

contract RegistryInvalidERC165ModuleMock {
    function supportsInterface(bytes4) external pure returns (bool) {
        return true;
    }
}

contract RegistryOversizedERC165ModuleMock {
    function supportsInterface(bytes4) external pure returns (bool) {
        assembly ("memory-safe") {
            mstore(0, 1)
            mstore(0x20, 0)
            return(0, 0x40)
        }
    }
}

contract RegistryRevertingERC165ModuleMock {
    function supportsInterface(bytes4) external pure returns (bool) {
        revert("ERC-165 unavailable");
    }
}

contract StreamModuleRegistryTest is CharacterizationTestBase {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for string;
    using Assertions for uint256;

    event StreamModuleRegistered(
        uint16 schemaVersion,
        address indexed module,
        bytes32 indexed moduleType,
        bytes4 indexed interfaceId,
        bytes32 moduleVersion,
        uint32 moduleGasLimit,
        bytes32 runtimeCodeHash,
        bytes32 deploymentManifestHash,
        bytes32 moduleManifestHash,
        string moduleManifestURI,
        bytes32 recordChainHash
    );

    event StreamModuleStatusChanged(
        uint16 schemaVersion,
        address indexed module,
        bytes32 indexed moduleType,
        ModuleRegistryStatus status,
        bytes32 reasonHash,
        string reasonURI
    );

    bytes4 private constant MODULE_INTERFACE_ID = bytes4(keccak256("stream.test.module"));
    bytes32 private constant MODULE_TYPE = keccak256("STREAM_RENDERER");
    bytes32 private constant MODULE_VERSION = bytes32(uint256(1));
    bytes32 private constant DEPLOYMENT_MANIFEST_HASH = keccak256("deployment-manifest");
    bytes32 private constant MODULE_MANIFEST_HASH = keccak256("module-manifest");
    string private constant MODULE_MANIFEST_URI = "ipfs://module-manifest";
    bytes32 private constant REGISTRY_MANIFEST_HASH = keccak256("registry-manifest");
    string private constant REGISTRY_MANIFEST_URI = "ipfs://registry-manifest";
    uint64 private constant BASE_TIME = 1_000_000;

    uint8 private constant IMMEDIATE = StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING;
    uint8 private constant LOOSENING = StreamGovernanceActionClasses.DELAYED_LOOSENING;
    uint8 private constant TERMINAL = StreamGovernanceActionClasses.TERMINAL_FREEZE;
    VmStorageCheats private constant STORAGE_VM =
        VmStorageCheats(address(uint160(uint256(keccak256("hevm cheat code")))));

    GovernanceExecutorContextMock private executorMock;
    StreamModuleRegistry private registry;
    RegistryModuleMock private module;

    function setUp() public {
        vm.warp(BASE_TIME);
        executorMock = new GovernanceExecutorContextMock();
        registry = new StreamModuleRegistry(
            IStreamGovernanceExecutor(address(executorMock)),
            REGISTRY_MANIFEST_HASH,
            REGISTRY_MANIFEST_URI
        );
        module = new RegistryModuleMock(MODULE_INTERFACE_ID);
    }

    // ---------------------------------------------------------------- helpers

    function _registration(address moduleAddress)
        private
        view
        returns (StreamModuleRegistration memory registration)
    {
        registration.module = moduleAddress;
        registration.moduleType = MODULE_TYPE;
        registration.moduleVersion = MODULE_VERSION;
        registration.interfaceId = MODULE_INTERFACE_ID;
        registration.moduleGasLimit = 400_000;
        // FIX D: governance pins the live codehash at review time; the default
        // registration mirrors that. Tests exercising zero/mismatch pins
        // override this field explicitly.
        registration.expectedRuntimeCodeHash = moduleAddress.codehash;
        registration.deploymentManifestHash = DEPLOYMENT_MANIFEST_HASH;
        registration.moduleManifestHash = MODULE_MANIFEST_HASH;
        registration.moduleManifestURI = MODULE_MANIFEST_URI;
    }

    function _register(StreamModuleRegistration memory registration) private {
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _registrationTransition(registration);
        _callRegistryWithContext(
            LOOSENING,
            scopeHash,
            oldValueHash,
            newValueHash,
            abi.encodeCall(StreamModuleRegistry.registerModule, (registration))
        );
    }

    function _setStatus(
        uint8 actionClass,
        address moduleAddress,
        ModuleRegistryStatus newStatus,
        bytes32 reasonHash
    ) private {
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _statusTransition(moduleAddress, newStatus);
        _callRegistryWithContext(
            actionClass,
            scopeHash,
            oldValueHash,
            newValueHash,
            abi.encodeCall(
                StreamModuleRegistry.setModuleStatus,
                (moduleAddress, newStatus, reasonHash, "ipfs://reason")
            )
        );
    }

    function _callRegistry(uint8 actionClass, bytes memory data) private {
        _callRegistryWithContext(actionClass, bytes32(0), bytes32(0), bytes32(0), data);
    }

    function _callRegistryWithContext(
        uint8 actionClass,
        bytes32 scopeHash,
        bytes32 oldValueHash,
        bytes32 newValueHash,
        bytes memory data
    ) private {
        executorMock.callAs(
            actionClass,
            keccak256("mock-action"),
            scopeHash,
            oldValueHash,
            newValueHash,
            address(registry),
            data
        );
    }

    function _forceModuleRevision(address moduleAddress, uint64 revision) private {
        // StreamModuleRegistry has no inherited mutable storage. `_records` is
        // slot 0 and the record's three uint64 timestamp/revision fields share
        // struct slot 8, with revision at bit offset 128.
        bytes32 recordBase = keccak256(abi.encode(moduleAddress, uint256(0)));
        bytes32 packedRevisionSlot = bytes32(uint256(recordBase) + 8);
        uint256 packed = uint256(STORAGE_VM.load(address(registry), packedRevisionSlot));
        uint256 revisionMask = uint256(type(uint64).max) << 128;
        packed = (packed & ~revisionMask) | (uint256(revision) << 128);
        STORAGE_VM.store(address(registry), packedRevisionSlot, bytes32(packed));
        uint256(registry.moduleRecord(moduleAddress).revision)
            .assertEq(revision, "record storage-layout revision setup");
    }

    function _forceRegistryManifestRevision(uint64 revision) private {
        // `_manifestRevision` is slot 6. The public getter assertion keeps this
        // ceiling regression fail-closed if the storage layout ever changes.
        bytes32 revisionSlot = bytes32(uint256(6));
        uint256 packed = uint256(STORAGE_VM.load(address(registry), revisionSlot));
        packed = (packed & ~uint256(type(uint64).max)) | uint256(revision);
        STORAGE_VM.store(address(registry), revisionSlot, bytes32(packed));
        (,, uint64 storedRevision) = registry.moduleRegistryManifest();
        uint256(storedRevision).assertEq(revision, "manifest storage-layout revision setup");
    }

    function _expectedChainHash(
        bytes32 previousChainHash,
        StreamModuleRegistration memory registration,
        bytes32 runtimeCodeHash,
        uint64 recordIndex
    ) private view returns (bytes32) {
        bytes32 recordHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_REGISTRATION_RECORD_V1(),
                registration.module,
                registration.moduleType,
                registration.interfaceId,
                registration.moduleVersion,
                runtimeCodeHash,
                registration.deploymentManifestHash,
                registration.moduleManifestHash
            )
        );
        return keccak256(
            abi.encode(
                registry.STREAM_RECORD_CHAIN_V1(),
                uint256(block.chainid),
                address(registry),
                uint256(0),
                keccak256("MODULE_REGISTRATION"),
                previousChainHash,
                recordHash,
                recordIndex
            )
        );
    }

    function _recordFactsHash(
        ModuleRegistryStatus status,
        StreamModuleRegistration memory registration,
        bytes32 runtimeCodeHash,
        uint64 revision
    ) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                uint8(status),
                registration.moduleType,
                registration.moduleVersion,
                registration.interfaceId,
                registration.moduleGasLimit,
                runtimeCodeHash,
                registration.deploymentManifestHash,
                registration.moduleManifestHash,
                keccak256(bytes(registration.moduleManifestURI)),
                revision
            )
        );
    }

    function _storedRecordFactsHash(
        StreamModuleRecord memory record,
        ModuleRegistryStatus status,
        uint64 revision
    ) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                uint8(status),
                record.moduleType,
                record.moduleVersion,
                record.interfaceId,
                record.moduleGasLimit,
                record.runtimeCodeHash,
                record.deploymentManifestHash,
                record.moduleManifestHash,
                keccak256(bytes(record.moduleManifestURI)),
                revision
            )
        );
    }

    function _emptyRecordFactsHash() private pure returns (bytes32) {
        StreamModuleRegistration memory empty;
        return _recordFactsHash(ModuleRegistryStatus.UNKNOWN, empty, bytes32(0), 0);
    }

    function _registrationTransition(StreamModuleRegistration memory registration)
        private
        view
        returns (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash)
    {
        uint256 count = registry.moduleCount();
        (bytes32 chainHash, uint64 recordCount) = registry.registrationChainHash();
        uint64 index = uint64(count);
        bytes32 newChainHash =
            _expectedChainHash(chainHash, registration, registration.module.codehash, index);
        scopeHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_REGISTRATION_SCOPE_V1(),
                uint256(block.chainid),
                address(registry),
                registration.module
            )
        );
        oldValueHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_REGISTRATION_STATE_V1(),
                scopeHash,
                false,
                _emptyRecordFactsHash(),
                count,
                chainHash,
                recordCount,
                address(0)
            )
        );
        newValueHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_REGISTRATION_STATE_V1(),
                scopeHash,
                true,
                _recordFactsHash(
                    ModuleRegistryStatus.ACTIVE, registration, registration.module.codehash, 1
                ),
                count + 1,
                newChainHash,
                recordCount + 1,
                registration.module
            )
        );
    }

    function _statusTransition(address moduleAddress, ModuleRegistryStatus newStatus)
        private
        view
        returns (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash)
    {
        StreamModuleRecord memory record = registry.moduleRecord(moduleAddress);
        (bytes32 chainHash, uint64 recordCount) = registry.registrationChainHash();
        scopeHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_STATUS_SCOPE_V1(),
                uint256(block.chainid),
                address(registry),
                moduleAddress
            )
        );
        oldValueHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_STATUS_STATE_V1(),
                scopeHash,
                _storedRecordFactsHash(record, record.status, record.revision),
                registry.moduleCount(),
                chainHash,
                recordCount
            )
        );
        newValueHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_STATUS_STATE_V1(),
                scopeHash,
                _storedRecordFactsHash(record, newStatus, record.revision + 1),
                registry.moduleCount(),
                chainHash,
                recordCount
            )
        );
    }

    function _manifestTransition(bytes32 newManifestHash, string memory newManifestURI)
        private
        view
        returns (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash)
    {
        (bytes32 oldManifestHash, string memory oldManifestURI, uint64 oldRevision) =
            registry.moduleRegistryManifest();
        scopeHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_REGISTRY_MANIFEST_SCOPE_V1(),
                uint256(block.chainid),
                address(registry)
            )
        );
        oldValueHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_REGISTRY_MANIFEST_STATE_V1(),
                scopeHash,
                oldManifestHash,
                keccak256(bytes(oldManifestURI)),
                oldRevision
            )
        );
        newValueHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_REGISTRY_MANIFEST_STATE_V1(),
                scopeHash,
                newManifestHash,
                keccak256(bytes(newManifestURI)),
                oldRevision + 1
            )
        );
    }

    function _setManifest(bytes32 manifestHash, string memory manifestURI) private {
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _manifestTransition(manifestHash, manifestURI);
        _callRegistryWithContext(
            LOOSENING,
            scopeHash,
            oldValueHash,
            newValueHash,
            abi.encodeCall(
                StreamModuleRegistry.setModuleRegistryManifest, (manifestHash, manifestURI)
            )
        );
    }

    function _expectRegisterRevert(
        bytes memory revertData,
        StreamModuleRegistration memory registration
    ) private {
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _registrationTransition(registration);
        vm.expectRevert(revertData);
        _callRegistryWithContext(
            LOOSENING,
            scopeHash,
            oldValueHash,
            newValueHash,
            abi.encodeCall(StreamModuleRegistry.registerModule, (registration))
        );
    }

    function _expectStatusRevert(
        bytes memory revertData,
        uint8 actionClass,
        address moduleAddress,
        ModuleRegistryStatus newStatus,
        bytes32 reasonHash,
        string memory reasonURI
    ) private {
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _statusTransition(moduleAddress, newStatus);
        vm.expectRevert(revertData);
        _callRegistryWithContext(
            actionClass,
            scopeHash,
            oldValueHash,
            newValueHash,
            abi.encodeCall(
                StreamModuleRegistry.setModuleStatus,
                (moduleAddress, newStatus, reasonHash, reasonURI)
            )
        );
    }

    function _expectManifestRevert(
        bytes memory revertData,
        bytes32 manifestHash,
        string memory manifestURI
    ) private {
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _manifestTransition(manifestHash, manifestURI);
        vm.expectRevert(revertData);
        _callRegistryWithContext(
            LOOSENING,
            scopeHash,
            oldValueHash,
            newValueHash,
            abi.encodeCall(
                StreamModuleRegistry.setModuleRegistryManifest, (manifestHash, manifestURI)
            )
        );
    }

    // ------------------------------------------------------------ registration

    function testRegisterModuleStoresRecordAndChainsRegistration() public {
        StreamModuleRegistration memory registration = _registration(address(module));
        bytes32 expectedChain =
            _expectedChainHash(bytes32(0), registration, address(module).codehash, 0);

        vm.expectEmit(true, true, true, true);
        emit StreamModuleRegistered(
            1,
            address(module),
            MODULE_TYPE,
            MODULE_INTERFACE_ID,
            MODULE_VERSION,
            400_000,
            address(module).codehash,
            DEPLOYMENT_MANIFEST_HASH,
            MODULE_MANIFEST_HASH,
            MODULE_MANIFEST_URI,
            expectedChain
        );
        _register(registration);

        StreamModuleRecord memory record = registry.moduleRecord(address(module));
        uint256(uint8(record.status))
            .assertEq(uint256(uint8(ModuleRegistryStatus.ACTIVE)), "status active");
        record.moduleType.assertEq(MODULE_TYPE, "module type");
        record.moduleVersion.assertEq(MODULE_VERSION, "module version");
        bytes32(record.interfaceId).assertEq(bytes32(MODULE_INTERFACE_ID), "interface id");
        uint256(record.moduleGasLimit).assertEq(400_000, "gas limit");
        record.runtimeCodeHash.assertEq(address(module).codehash, "runtime code hash");
        record.deploymentManifestHash.assertEq(DEPLOYMENT_MANIFEST_HASH, "deployment manifest hash");
        record.moduleManifestHash.assertEq(MODULE_MANIFEST_HASH, "module manifest hash");
        record.moduleManifestURI.assertEq(MODULE_MANIFEST_URI, "module manifest URI");
        uint256(record.registeredAt).assertEq(BASE_TIME, "registeredAt");
        uint256(record.statusUpdatedAt).assertEq(BASE_TIME, "statusUpdatedAt");
        uint256(record.revision).assertEq(1, "registration revision");

        // Requirement 6 enumeration index.
        registry.moduleCount().assertEq(1, "module count");
        registry.moduleAt(0).assertEq(address(module), "module at 0");

        // Requirement 7 accumulator: recordCount equals moduleCount.
        (bytes32 chainHash, uint64 recordCount) = registry.registrationChainHash();
        chainHash.assertEq(expectedChain, "registration chain hash");
        uint256(recordCount).assertEq(registry.moduleCount(), "recordCount == moduleCount");
    }

    function testRegistrationChainAccumulatesAcrossModules() public {
        RegistryModuleMock second = new RegistryModuleMock(MODULE_INTERFACE_ID);
        RegistryModuleMock third = new RegistryModuleMock(MODULE_INTERFACE_ID);
        _register(_registration(address(module)));
        _register(_registration(address(second)));
        _register(_registration(address(third)));

        // Replaying the three registration facts reproduces the stored head.
        bytes32 replayed = _expectedChainHash(
            bytes32(0), _registration(address(module)), address(module).codehash, 0
        );
        replayed = _expectedChainHash(
            replayed, _registration(address(second)), address(second).codehash, 1
        );
        replayed = _expectedChainHash(
            replayed, _registration(address(third)), address(third).codehash, 2
        );

        (bytes32 chainHash, uint64 recordCount) = registry.registrationChainHash();
        chainHash.assertEq(replayed, "replayed chain head matches");
        uint256(recordCount).assertEq(3, "record count");
        registry.moduleCount().assertEq(3, "module count");
        registry.moduleAt(0).assertEq(address(module), "enumeration order 0");
        registry.moduleAt(1).assertEq(address(second), "enumeration order 1");
        registry.moduleAt(2).assertEq(address(third), "enumeration order 2");
    }

    function testReRegisteringKnownModuleReverts() public {
        _register(_registration(address(module)));
        // [LTA-REGISTRY] requirement 6: the index is append-only.
        _expectRegisterRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.ModuleAlreadyRegistered.selector, address(module)
            ),
            _registration(address(module))
        );

        // Status changes never reopen registration.
        _setStatus(IMMEDIATE, address(module), ModuleRegistryStatus.DEPRECATED, keccak256("d"));
        _expectRegisterRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.ModuleAlreadyRegistered.selector, address(module)
            ),
            _registration(address(module))
        );
    }

    function testRegistrationRequiresGovernedLoosening() public {
        StreamModuleRegistration memory registration = _registration(address(module));
        bytes memory data = abi.encodeCall(StreamModuleRegistry.registerModule, (registration));

        // Direct calls are not the governance executor.
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.NotGovernanceExecutor.selector, address(this)
            )
        );
        registry.registerModule(registration);

        // Executor calls outside an executing action revert.
        vm.expectRevert(
            abi.encodeWithSelector(StreamModuleRegistry.NoExecutingGovernanceAction.selector)
        );
        executorMock.callOutsideAction(address(registry), data);

        // Registration is loosening: IMMEDIATE_TIGHTENING cannot register.
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.WrongGovernanceActionClass.selector, IMMEDIATE
            )
        );
        _callRegistry(IMMEDIATE, data);

        // Nor can any non-loosening class.
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.WrongGovernanceActionClass.selector, TERMINAL
            )
        );
        _callRegistry(TERMINAL, data);
    }

    function testRegistrationRequiresNonzeroActionIdAndExactTransitionContext() public {
        StreamModuleRegistration memory registration = _registration(address(module));
        bytes memory data = abi.encodeCall(StreamModuleRegistry.registerModule, (registration));
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _registrationTransition(registration);

        vm.expectRevert(
            abi.encodeWithSelector(StreamModuleRegistry.ZeroGovernanceActionId.selector)
        );
        executorMock.callAs(
            LOOSENING, bytes32(0), scopeHash, oldValueHash, newValueHash, address(registry), data
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.GovernanceTransitionContextMismatch.selector
            )
        );
        _callRegistryWithContext(
            LOOSENING, keccak256("forged-scope"), oldValueHash, newValueHash, data
        );
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.GovernanceTransitionContextMismatch.selector
            )
        );
        _callRegistryWithContext(LOOSENING, scopeHash, keccak256("forged-old"), newValueHash, data);
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.GovernanceTransitionContextMismatch.selector
            )
        );
        _callRegistryWithContext(LOOSENING, scopeHash, oldValueHash, keccak256("forged-new"), data);

        registry.moduleCount().assertEq(0, "forged contexts changed no state");
        _callRegistryWithContext(LOOSENING, scopeHash, oldValueHash, newValueHash, data);
        registry.moduleCount().assertEq(1, "exact context registers");
    }

    function testRegistrationValidation() public {
        // Zero module address.
        StreamModuleRegistration memory registration = _registration(address(0));
        _expectRegisterRevert(
            abi.encodeWithSelector(StreamModuleRegistry.InvalidModule.selector, address(0)),
            registration
        );

        // Codeless module address.
        registration = _registration(address(0xDEAD02));
        _expectRegisterRevert(
            abi.encodeWithSelector(StreamModuleRegistry.InvalidModule.selector, address(0xDEAD02)),
            registration
        );

        // Zero module type.
        registration = _registration(address(module));
        registration.moduleType = bytes32(0);
        _expectRegisterRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.InvalidModuleRecord.selector, address(module)
            ),
            registration
        );

        // Zero module version.
        registration = _registration(address(module));
        registration.moduleVersion = bytes32(0);
        _expectRegisterRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.InvalidModuleRecord.selector, address(module)
            ),
            registration
        );

        // Zero module manifest hash.
        registration = _registration(address(module));
        registration.moduleManifestHash = bytes32(0);
        _expectRegisterRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.InvalidModuleRecord.selector, address(module)
            ),
            registration
        );

        // Zero deployment manifest hash.
        registration = _registration(address(module));
        registration.deploymentManifestHash = bytes32(0);
        _expectRegisterRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.InvalidModuleRecord.selector, address(module)
            ),
            registration
        );

        // Invalid interface IDs.
        registration = _registration(address(module));
        registration.interfaceId = bytes4(0);
        _expectRegisterRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.InvalidModuleRecord.selector, address(module)
            ),
            registration
        );
        registration = _registration(address(module));
        registration.interfaceId = 0xffffffff;
        _expectRegisterRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.InvalidModuleRecord.selector, address(module)
            ),
            registration
        );

        // FIX D: a zero codehash pin is rejected (execution-time pinning is
        // mandatory; governance must pin the live codehash at review time).
        registration = _registration(address(module));
        registration.expectedRuntimeCodeHash = bytes32(0);
        _expectRegisterRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.InvalidModuleRecord.selector, address(module)
            ),
            registration
        );

        // Module that does not advertise the declared interface.
        RegistryModuleMock wrongInterface = new RegistryModuleMock(bytes4(keccak256("other")));
        registration = _registration(address(wrongInterface));
        _expectRegisterRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.ModuleInterfaceUnsupported.selector,
                address(wrongInterface),
                MODULE_INTERFACE_ID
            ),
            registration
        );

        // Codehash pin mismatch.
        registration = _registration(address(module));
        registration.expectedRuntimeCodeHash = keccak256("wrong-codehash");
        _expectRegisterRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.ModuleCodehashMismatch.selector,
                address(module),
                keccak256("wrong-codehash"),
                address(module).codehash
            ),
            registration
        );

        // Strict ERC-165 rejects a target that claims the invalid interface.
        RegistryInvalidERC165ModuleMock invalidERC165 = new RegistryInvalidERC165ModuleMock();
        registration = _registration(address(invalidERC165));
        _expectRegisterRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.ModuleInterfaceUnsupported.selector,
                address(invalidERC165),
                MODULE_INTERFACE_ID
            ),
            registration
        );

        // Strict ERC-165 requires the canonical one-word boolean return and
        // rejects an otherwise-true response with trailing returndata.
        RegistryOversizedERC165ModuleMock oversizedERC165 = new RegistryOversizedERC165ModuleMock();
        registration = _registration(address(oversizedERC165));
        _expectRegisterRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.ModuleInterfaceUnsupported.selector,
                address(oversizedERC165),
                MODULE_INTERFACE_ID
            ),
            registration
        );

        RegistryRevertingERC165ModuleMock revertingERC165 = new RegistryRevertingERC165ModuleMock();
        registration = _registration(address(revertingERC165));
        _expectRegisterRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.ModuleInterfaceUnsupported.selector,
                address(revertingERC165),
                MODULE_INTERFACE_ID
            ),
            registration
        );

        // An EIP-7702 designation is mutable delegated-EOA code, not a module.
        address delegatedEOA = address(0x7702);
        vm.etch(delegatedEOA, abi.encodePacked(hex"ef0100", address(module)));
        registration = _registration(delegatedEOA);
        _expectRegisterRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.EIP7702DelegatedModule.selector, delegatedEOA
            ),
            registration
        );

        // Matching codehash pin registers.
        registration = _registration(address(module));
        registration.expectedRuntimeCodeHash = address(module).codehash;
        _register(registration);
        registry.moduleCount().assertEq(1, "pinned registration landed");
    }

    function testRegistrationForwardsAvailableGasForRepricedERC165Read() public {
        RepricedRegistryModuleMock repriced =
            new RepricedRegistryModuleMock(MODULE_INTERFACE_ID, 60_000);
        (bool legacyCapSucceeded,) = address(repriced).staticcall{ gas: 30_000 }(
            abi.encodeWithSelector(
                bytes4(keccak256("supportsInterface(bytes4)")), MODULE_INTERFACE_ID
            )
        );
        legacyCapSucceeded.assertFalse("historical 30k probe cannot complete");

        _register(_registration(address(repriced)));

        registry.moduleCount().assertEq(1, "repriced module registered");
        registry.isModuleEligible(address(repriced), MODULE_TYPE, MODULE_INTERFACE_ID)
            .assertTrue("repriced module eligible");
    }

    function testRegistrationRejectsRevertingERC165Read() public {
        _expectMalformedERC165Rejected(0);
    }

    function testRegistrationRejectsShortERC165Returndata() public {
        _expectMalformedERC165Rejected(1);
    }

    function testRegistrationRejectsOversizedERC165Returndata() public {
        _expectMalformedERC165Rejected(2);
    }

    function testRegistrationRejectsNoncanonicalERC165Bool() public {
        _expectMalformedERC165Rejected(3);
    }

    function testRegistrationFailsClosedWhenERC165ProbeExhaustsGas() public {
        GasExhaustingRegistryModuleMock exhausting = new GasExhaustingRegistryModuleMock();
        StreamModuleRegistration memory registration = _registration(address(exhausting));
        bytes memory registryCall =
            abi.encodeCall(StreamModuleRegistry.registerModule, (registration));
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _registrationTransition(registration);
        bytes memory executorCall = abi.encodeCall(
            GovernanceExecutorContextMock.callAs,
            (
                LOOSENING,
                keccak256("gas-exhaustion"),
                scopeHash,
                oldValueHash,
                newValueHash,
                address(registry),
                registryCall
            )
        );

        (bool success,) = address(executorMock).call{ gas: 500_000 }(executorCall);

        success.assertFalse("gas-exhausting probe fails registration");
        registry.moduleCount().assertEq(0, "gas-exhausting module not registered");
    }

    function _expectMalformedERC165Rejected(uint8 mode) private {
        MalformedRegistryModuleMock malformed = new MalformedRegistryModuleMock(mode);
        StreamModuleRegistration memory registration = _registration(address(malformed));
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _registrationTransition(registration);
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.ModuleInterfaceUnsupported.selector,
                address(malformed),
                MODULE_INTERFACE_ID
            )
        );
        _callRegistryWithContext(
            LOOSENING,
            scopeHash,
            oldValueHash,
            newValueHash,
            abi.encodeCall(StreamModuleRegistry.registerModule, (registration))
        );
        registry.moduleCount().assertEq(0, "malformed module not registered");
    }

    function testERC165ChecksForwardAvailableGasAtRegistrationAndEligibility() public {
        RegistryGasHeavyModuleMock gasHeavyModule =
            new RegistryGasHeavyModuleMock(MODULE_INTERFACE_ID, 45_000);

        _register(_registration(address(gasHeavyModule)));

        registry.isModuleEligible(address(gasHeavyModule), MODULE_TYPE, MODULE_INTERFACE_ID)
            .assertTrue("high-gas live ERC-165 module rejected");
    }

    function testSequentialUncappedERC165ProbesStayFailClosedWhenModuleStarvesParent() public {
        RegistryGasStarvingModuleMock starvingModule =
            new RegistryGasStarvingModuleMock(MODULE_INTERFACE_ID);
        _register(_registration(address(starvingModule)));
        starvingModule.setStarve(true);

        (bool firstOk, bytes memory firstData) = address(starvingModule).staticcall{ gas: 60_000 }(
            abi.encodeCall(
                RegistryGasStarvingModuleMock.supportsInterface, (type(IERC165).interfaceId)
            )
        );
        require(
            firstOk && firstData.length == 32 && abi.decode(firstData, (bool)),
            "first isolated probe is not canonical"
        );

        (bool eligibilityOk, bytes memory eligibilityData) = address(registry)
        .staticcall{ gas: 180_000 }(
            abi.encodeCall(
                StreamModuleRegistry.isModuleEligible,
                (address(starvingModule), MODULE_TYPE, MODULE_INTERFACE_ID)
            )
        );
        bool eligible =
            eligibilityOk && eligibilityData.length == 32 && abi.decode(eligibilityData, (bool));
        eligible.assertFalse("gas-starving module became eligible");
    }

    function testZeroGasLimitMeansUnbounded() public {
        // [LTA-REGISTRY] requirement 3: zero is a legal no-bound value.
        StreamModuleRegistration memory registration = _registration(address(module));
        registration.moduleGasLimit = 0;
        _register(registration);
        uint256(registry.moduleRecord(address(module)).moduleGasLimit)
            .assertEq(0, "zero gas limit stored");
        registry.isModuleEligible(address(module), MODULE_TYPE, MODULE_INTERFACE_ID)
            .assertTrue("zero gas limit module eligible");
    }

    function testRegistryTimestampsAcceptUint64MaxAndRejectOverflow() public {
        RegistryModuleMock maxTimestampModule = new RegistryModuleMock(MODULE_INTERFACE_ID);
        vm.warp(type(uint64).max);
        _register(_registration(address(maxTimestampModule)));
        _setStatus(
            IMMEDIATE,
            address(maxTimestampModule),
            ModuleRegistryStatus.DEPRECATED,
            keccak256("max-timestamp")
        );
        StreamModuleRecord memory maxTimestampRecord =
            registry.moduleRecord(address(maxTimestampModule));
        uint256(maxTimestampRecord.registeredAt)
            .assertEq(type(uint64).max, "max registered timestamp");
        uint256(maxTimestampRecord.statusUpdatedAt)
            .assertEq(type(uint64).max, "max status timestamp");

        uint256 overflowTimestamp = uint256(type(uint64).max) + 1;
        vm.warp(overflowTimestamp);
        RegistryModuleMock overflowModule = new RegistryModuleMock(MODULE_INTERFACE_ID);
        _expectRegisterRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.RegistryTimestampOverflow.selector, overflowTimestamp
            ),
            _registration(address(overflowModule))
        );
        _expectStatusRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.RegistryTimestampOverflow.selector, overflowTimestamp
            ),
            IMMEDIATE,
            address(maxTimestampModule),
            ModuleRegistryStatus.INCIDENT_REVOKED,
            keccak256("overflow-timestamp"),
            "ipfs://overflow-timestamp"
        );
    }

    function testRegistrationManifestURIRequiresNonemptyBoundedStrictUTF8() public {
        StreamModuleRegistration memory registration = _registration(address(module));
        registration.moduleManifestURI = "";
        _expectRegisterRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.EmptyURI.selector, keccak256("moduleManifestURI")
            ),
            registration
        );

        registration = _registration(address(module));
        registration.moduleManifestURI = string(new bytes(2_049));
        _expectRegisterRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.URITooLong.selector,
                keccak256("moduleManifestURI"),
                2_049,
                2_048
            ),
            registration
        );

        registration = _registration(address(module));
        registration.moduleManifestURI = string(bytes.concat(bytes1(0xc0), bytes1(0xaf)));
        _expectRegisterRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.InvalidUTF8.selector, keccak256("moduleManifestURI")
            ),
            registration
        );

        registration = _registration(address(module));
        registration.moduleManifestURI = string(new bytes(2_048));
        _register(registration);
        bytes(registry.moduleRecord(address(module)).moduleManifestURI).length
            .assertEq(2_048, "2,048-byte URI accepted");
    }

    // ---------------------------------------------------------- status machine

    function testStatusMachineTighteningAndLoosening() public {
        _register(_registration(address(module)));
        vm.warp(BASE_TIME + 1 days);

        // Tightening under IMMEDIATE_TIGHTENING with a reasoned event.
        vm.expectEmit(true, true, true, true);
        emit StreamModuleStatusChanged(
            1,
            address(module),
            MODULE_TYPE,
            ModuleRegistryStatus.DEPRECATED,
            keccak256("sunset"),
            "ipfs://reason"
        );
        _setStatus(IMMEDIATE, address(module), ModuleRegistryStatus.DEPRECATED, keccak256("sunset"));

        StreamModuleRecord memory record = registry.moduleRecord(address(module));
        uint256(uint8(record.status))
            .assertEq(uint256(uint8(ModuleRegistryStatus.DEPRECATED)), "deprecated");
        uint256(record.statusUpdatedAt).assertEq(BASE_TIME + 1 days, "statusUpdatedAt moved");
        uint256(record.registeredAt).assertEq(BASE_TIME, "registeredAt immutable");
        uint256(record.revision).assertEq(2, "tightening increments revision");

        // Loosening back to ACTIVE requires DELAYED_LOOSENING.
        _expectStatusRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.WrongGovernanceActionClass.selector, IMMEDIATE
            ),
            IMMEDIATE,
            address(module),
            ModuleRegistryStatus.ACTIVE,
            keccak256("revive"),
            "ipfs://reason"
        );
        _setStatus(LOOSENING, address(module), ModuleRegistryStatus.ACTIVE, keccak256("revive"));
        uint256(uint8(registry.moduleRecord(address(module)).status))
            .assertEq(uint256(uint8(ModuleRegistryStatus.ACTIVE)), "reactivated");
        uint256(registry.moduleRecord(address(module)).revision)
            .assertEq(3, "loosening increments revision");

        // Incident revocation is IMMEDIATE_TIGHTENING.
        _setStatus(
            IMMEDIATE, address(module), ModuleRegistryStatus.INCIDENT_REVOKED, keccak256("inc")
        );
        uint256(uint8(registry.moduleRecord(address(module)).status))
            .assertEq(uint256(uint8(ModuleRegistryStatus.INCIDENT_REVOKED)), "incident revoked");

        // Recovery from incident revocation is loosening.
        _expectStatusRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.WrongGovernanceActionClass.selector, IMMEDIATE
            ),
            IMMEDIATE,
            address(module),
            ModuleRegistryStatus.DEPRECATED,
            keccak256("r"),
            "ipfs://reason"
        );
        _setStatus(LOOSENING, address(module), ModuleRegistryStatus.DEPRECATED, keccak256("r"));

        // Direction is exact: tightening cannot be mislabeled as delayed.
        _expectStatusRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.WrongGovernanceActionClass.selector, LOOSENING
            ),
            LOOSENING,
            address(module),
            ModuleRegistryStatus.INCIDENT_REVOKED,
            keccak256("i2"),
            "ipfs://reason"
        );
        _setStatus(
            IMMEDIATE, address(module), ModuleRegistryStatus.INCIDENT_REVOKED, keccak256("i2")
        );
        uint256(uint8(registry.moduleRecord(address(module)).status))
            .assertEq(
                uint256(uint8(ModuleRegistryStatus.INCIDENT_REVOKED)), "re-revoked immediately"
            );
        uint256(registry.moduleRecord(address(module)).revision)
            .assertEq(6, "every successful transition increments once");
    }

    function testStatusRevisionPreventsABAContextReplay() public {
        _register(_registration(address(module)));
        (bytes32 staleScope, bytes32 staleOld, bytes32 staleNew) =
            _statusTransition(address(module), ModuleRegistryStatus.DEPRECATED);

        _setStatus(IMMEDIATE, address(module), ModuleRegistryStatus.DEPRECATED, keccak256("d"));
        _setStatus(LOOSENING, address(module), ModuleRegistryStatus.ACTIVE, keccak256("a"));

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.GovernanceTransitionContextMismatch.selector
            )
        );
        _callRegistryWithContext(
            IMMEDIATE,
            staleScope,
            staleOld,
            staleNew,
            abi.encodeCall(
                StreamModuleRegistry.setModuleStatus,
                (
                    address(module),
                    ModuleRegistryStatus.DEPRECATED,
                    keccak256("d-again"),
                    "ipfs://reason"
                )
            )
        );
        uint256(registry.moduleRecord(address(module)).revision)
            .assertEq(3, "stale action changed no state");
    }

    function testStatusRevisionOverflowRevertsBeforeMutation() public {
        _register(_registration(address(module)));
        _forceModuleRevision(address(module), type(uint64).max);

        vm.expectRevert(
            abi.encodeWithSelector(StreamModuleRegistry.RegistryRevisionOverflow.selector)
        );
        _callRegistry(
            IMMEDIATE,
            abi.encodeCall(
                StreamModuleRegistry.setModuleStatus,
                (
                    address(module),
                    ModuleRegistryStatus.DEPRECATED,
                    keccak256("revision-overflow"),
                    "ipfs://revision-overflow"
                )
            )
        );

        StreamModuleRecord memory record = registry.moduleRecord(address(module));
        uint256(uint8(record.status))
            .assertEq(uint256(uint8(ModuleRegistryStatus.ACTIVE)), "overflow changed status");
        uint256(record.revision).assertEq(type(uint64).max, "overflow changed revision");
    }

    function testStatusMachineRejectsInvalidTransitions() public {
        // Unregistered module.
        _expectStatusRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.ModuleNotRegistered.selector, address(module)
            ),
            IMMEDIATE,
            address(module),
            ModuleRegistryStatus.DEPRECATED,
            keccak256("x"),
            "ipfs://reason"
        );

        _register(_registration(address(module)));

        // No transition back to UNKNOWN: entries are never deleted.
        _expectStatusRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.InvalidStatusTransition.selector,
                address(module),
                ModuleRegistryStatus.ACTIVE,
                ModuleRegistryStatus.UNKNOWN
            ),
            IMMEDIATE,
            address(module),
            ModuleRegistryStatus.UNKNOWN,
            keccak256("x"),
            "ipfs://reason"
        );

        // No same-status no-op writes.
        _expectStatusRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.InvalidStatusTransition.selector,
                address(module),
                ModuleRegistryStatus.ACTIVE,
                ModuleRegistryStatus.ACTIVE
            ),
            LOOSENING,
            address(module),
            ModuleRegistryStatus.ACTIVE,
            keccak256("x"),
            "ipfs://reason"
        );
    }

    function testStatusReasonURIRequiresStrictUTF8() public {
        _register(_registration(address(module)));
        bytes memory invalidReason =
            bytes.concat(bytes1(0xf4), bytes1(0x90), bytes1(0x80), bytes1(0x80));
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _statusTransition(address(module), ModuleRegistryStatus.DEPRECATED);
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.InvalidUTF8.selector, keccak256("statusReasonURI")
            )
        );
        _callRegistryWithContext(
            IMMEDIATE,
            scopeHash,
            oldValueHash,
            newValueHash,
            abi.encodeCall(
                StreamModuleRegistry.setModuleStatus,
                (
                    address(module),
                    ModuleRegistryStatus.DEPRECATED,
                    keccak256("reason"),
                    string(invalidReason)
                )
            )
        );
    }

    function testStatusChangesNeverRemoveRecordsOrEnumeration() public {
        _register(_registration(address(module)));
        _setStatus(
            IMMEDIATE, address(module), ModuleRegistryStatus.INCIDENT_REVOKED, keccak256("inc")
        );

        // Record facts and the enumeration entry survive incident revocation.
        StreamModuleRecord memory record = registry.moduleRecord(address(module));
        record.moduleType.assertEq(MODULE_TYPE, "type survives");
        record.moduleVersion.assertEq(MODULE_VERSION, "version survives");
        record.runtimeCodeHash.assertEq(address(module).codehash, "code hash survives");
        record.moduleManifestURI.assertEq(MODULE_MANIFEST_URI, "manifest URI survives");
        registry.moduleCount().assertEq(1, "enumeration survives");
        registry.moduleAt(0).assertEq(address(module), "entry survives");
        (, uint64 recordCount) = registry.registrationChainHash();
        uint256(recordCount).assertEq(1, "chain lane untouched by status change");
    }

    // ------------------------------------------------------------- eligibility

    function testIsModuleEligible() public {
        registry.isModuleEligible(address(module), MODULE_TYPE, MODULE_INTERFACE_ID)
            .assertFalse("unknown module not eligible");
        _register(_registration(address(module)));
        registry.isModuleEligible(address(module), MODULE_TYPE, MODULE_INTERFACE_ID)
            .assertTrue("active module eligible");
        registry.isModuleEligible(address(module), keccak256("OTHER_TYPE"), MODULE_INTERFACE_ID)
            .assertFalse("wrong module type");
        registry.isModuleEligible(address(module), MODULE_TYPE, bytes4(keccak256("other")))
            .assertFalse("wrong interface id");

        _setStatus(IMMEDIATE, address(module), ModuleRegistryStatus.DEPRECATED, keccak256("d"));
        registry.isModuleEligible(address(module), MODULE_TYPE, MODULE_INTERFACE_ID)
            .assertFalse("deprecated not eligible for new assignments");
        _setStatus(LOOSENING, address(module), ModuleRegistryStatus.ACTIVE, keccak256("a"));
        _setStatus(
            IMMEDIATE, address(module), ModuleRegistryStatus.INCIDENT_REVOKED, keccak256("i")
        );
        registry.isModuleEligible(address(module), MODULE_TYPE, MODULE_INTERFACE_ID)
            .assertFalse("incident-revoked not eligible");
    }

    function testEligibilityRechecksLiveERC165Surface() public {
        RegistryMutableInterfaceModuleMock mutableModule =
            new RegistryMutableInterfaceModuleMock(MODULE_INTERFACE_ID);
        _register(_registration(address(mutableModule)));
        registry.isModuleEligible(address(mutableModule), MODULE_TYPE, MODULE_INTERFACE_ID)
            .assertTrue("live interface initially eligible");

        mutableModule.setInterfaceEnabled(false);
        registry.isModuleEligible(address(mutableModule), MODULE_TYPE, MODULE_INTERFACE_ID)
            .assertFalse("withdrawn live interface rejected");
    }

    // ------------------------------------------------------- manifest and misc

    function testRegistryManifestGovernedUpdate() public {
        (bytes32 manifestHash, string memory manifestURI, uint64 revision) =
            registry.moduleRegistryManifest();
        manifestHash.assertEq(REGISTRY_MANIFEST_HASH, "constructor manifest hash");
        manifestURI.assertEq(REGISTRY_MANIFEST_URI, "constructor manifest URI");
        uint256(revision).assertEq(1, "constructor manifest revision");

        bytes memory data = abi.encodeCall(
            StreamModuleRegistry.setModuleRegistryManifest,
            (keccak256("registry-manifest-v2"), "ipfs://registry-manifest-v2")
        );
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.NotGovernanceExecutor.selector, address(this)
            )
        );
        registry.setModuleRegistryManifest(keccak256("registry-manifest-v2"), "x");

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.WrongGovernanceActionClass.selector, IMMEDIATE
            )
        );
        _callRegistry(IMMEDIATE, data);

        _setManifest(keccak256("registry-manifest-v2"), "ipfs://registry-manifest-v2");
        (manifestHash, manifestURI, revision) = registry.moduleRegistryManifest();
        manifestHash.assertEq(keccak256("registry-manifest-v2"), "updated manifest hash");
        manifestURI.assertEq("ipfs://registry-manifest-v2", "updated manifest URI");
        uint256(revision).assertEq(2, "updated manifest revision");
    }

    function testRegistryManifestValidationAndExactContext() public {
        _expectManifestRevert(
            abi.encodeWithSelector(StreamModuleRegistry.InvalidRegistryManifestHash.selector),
            bytes32(0),
            "ipfs://registry-v2"
        );

        _expectManifestRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.EmptyURI.selector, keccak256("registryManifestURI")
            ),
            keccak256("registry-v2"),
            ""
        );

        _expectManifestRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.URITooLong.selector,
                keccak256("registryManifestURI"),
                2_049,
                2_048
            ),
            keccak256("registry-v2"),
            string(new bytes(2_049))
        );

        _expectManifestRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.InvalidUTF8.selector, keccak256("registryManifestURI")
            ),
            keccak256("registry-v2"),
            string(bytes.concat(bytes1(0xed), bytes1(0xa0), bytes1(0x80)))
        );

        _expectManifestRevert(
            abi.encodeWithSelector(StreamModuleRegistry.RegistryManifestNoOp.selector),
            REGISTRY_MANIFEST_HASH,
            REGISTRY_MANIFEST_URI
        );

        bytes32 newHash = keccak256("registry-v2");
        string memory newURI = "ipfs://registry-v2";
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _manifestTransition(newHash, newURI);
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.GovernanceTransitionContextMismatch.selector
            )
        );
        _callRegistryWithContext(
            LOOSENING,
            scopeHash,
            oldValueHash,
            keccak256("forged-new"),
            abi.encodeCall(StreamModuleRegistry.setModuleRegistryManifest, (newHash, newURI))
        );
        _callRegistryWithContext(
            LOOSENING,
            scopeHash,
            oldValueHash,
            newValueHash,
            abi.encodeCall(StreamModuleRegistry.setModuleRegistryManifest, (newHash, newURI))
        );
    }

    function testManifestRevisionPreventsABAContextReplay() public {
        bytes32 staleHash = keccak256("registry-b");
        string memory staleURI = "ipfs://registry-b";
        (bytes32 staleScope, bytes32 staleOld, bytes32 staleNew) =
            _manifestTransition(staleHash, staleURI);

        _setManifest(staleHash, staleURI);
        _setManifest(REGISTRY_MANIFEST_HASH, REGISTRY_MANIFEST_URI);

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.GovernanceTransitionContextMismatch.selector
            )
        );
        _callRegistryWithContext(
            LOOSENING,
            staleScope,
            staleOld,
            staleNew,
            abi.encodeCall(StreamModuleRegistry.setModuleRegistryManifest, (staleHash, staleURI))
        );
        (,, uint64 revision) = registry.moduleRegistryManifest();
        uint256(revision).assertEq(3, "stale manifest action changed no state");
    }

    function testRegistryManifestRevisionOverflowRevertsBeforeMutation() public {
        _forceRegistryManifestRevision(type(uint64).max);
        bytes32 newHash = keccak256("registry-overflow");
        string memory newURI = "ipfs://registry-overflow";

        vm.expectRevert(
            abi.encodeWithSelector(StreamModuleRegistry.RegistryRevisionOverflow.selector)
        );
        _callRegistry(
            LOOSENING,
            abi.encodeCall(StreamModuleRegistry.setModuleRegistryManifest, (newHash, newURI))
        );

        (bytes32 manifestHash, string memory manifestURI, uint64 revision) =
            registry.moduleRegistryManifest();
        manifestHash.assertEq(REGISTRY_MANIFEST_HASH, "overflow changed manifest hash");
        manifestURI.assertEq(REGISTRY_MANIFEST_URI, "overflow changed manifest URI");
        uint256(revision).assertEq(type(uint64).max, "overflow changed manifest revision");
    }

    function testConstructorRejectsInvalidExecutorAndManifest() public {
        vm.expectRevert(
            abi.encodeWithSelector(StreamModuleRegistry.ZeroGovernanceExecutor.selector)
        );
        new StreamModuleRegistry(
            IStreamGovernanceExecutor(address(0)), REGISTRY_MANIFEST_HASH, REGISTRY_MANIFEST_URI
        );

        address codeless = address(0xC0DE);
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.InvalidGovernanceExecutor.selector, codeless
            )
        );
        new StreamModuleRegistry(
            IStreamGovernanceExecutor(codeless), REGISTRY_MANIFEST_HASH, REGISTRY_MANIFEST_URI
        );

        address delegatedEOA = address(0x7703);
        vm.etch(delegatedEOA, abi.encodePacked(hex"ef0100", address(executorMock)));
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.InvalidGovernanceExecutor.selector, delegatedEOA
            )
        );
        new StreamModuleRegistry(
            IStreamGovernanceExecutor(delegatedEOA), REGISTRY_MANIFEST_HASH, REGISTRY_MANIFEST_URI
        );

        vm.expectRevert(
            abi.encodeWithSelector(StreamModuleRegistry.InvalidRegistryManifestHash.selector)
        );
        new StreamModuleRegistry(
            IStreamGovernanceExecutor(address(executorMock)), bytes32(0), REGISTRY_MANIFEST_URI
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.EmptyURI.selector, keccak256("registryManifestURI")
            )
        );
        new StreamModuleRegistry(
            IStreamGovernanceExecutor(address(executorMock)), REGISTRY_MANIFEST_HASH, ""
        );
    }

    function testConstructorCurrentActionProbeFailsClosedOnRevertMalformedAndOversizedReturn()
        public
    {
        for (uint8 returnMode = 0; returnMode < 3; returnMode++) {
            GovernanceExecutorMalformedCurrentActionMock malformed =
                new GovernanceExecutorMalformedCurrentActionMock(returnMode);
            vm.expectRevert(
                abi.encodeWithSelector(
                    StreamModuleRegistry.InvalidGovernanceExecutor.selector, address(malformed)
                )
            );
            new StreamModuleRegistry(
                IStreamGovernanceExecutor(address(malformed)),
                REGISTRY_MANIFEST_HASH,
                REGISTRY_MANIFEST_URI
            );
        }
    }

    function testModuleEnumerationBounds() public {
        vm.expectRevert(
            abi.encodeWithSelector(StreamModuleRegistry.ModuleIndexOutOfBounds.selector, 0)
        );
        registry.moduleAt(0);
    }

    function testSupportsCanonicalRegistryInterface() public {
        bytes32(StreamModuleRegistry.registerModule.selector)
            .assertEq(bytes32(bytes4(0x77bfa48d)), "registration selector pin");
        bytes32(StreamModuleRegistry.setModuleStatus.selector)
            .assertEq(bytes32(bytes4(0x96a6e18b)), "status selector pin");
        bytes32(StreamModuleRegistry.setModuleRegistryManifest.selector)
            .assertEq(bytes32(bytes4(0x7ba46615)), "manifest selector pin");
        bytes32(type(IStreamModuleRegistry).interfaceId)
            .assertEq(bytes32(bytes4(0xefc33fae)), "read interface id remains compatible");
        registry.supportsInterface(type(IStreamModuleRegistry).interfaceId)
            .assertTrue("canonical registry interface");
        registry.supportsInterface(0xffffffff).assertFalse("invalid interface");
    }
}

/// @notice End-to-end: registry lifecycle driven through the real staged
///         governance executor ([LTA-REGISTRY] requirement 5).
contract StreamModuleRegistryGovernanceIntegrationTest is StreamGovernanceBootstrapHarness {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    bytes4 private constant MODULE_INTERFACE_ID = bytes4(keccak256("stream.test.module"));
    uint64 private constant BASE_TIME = 1_000_000;

    StreamGovernanceExecutor private executor;
    StreamModuleRegistry private registry;
    RegistryModuleMock private module;
    StreamGovernanceBootstrapManifestMock private systemManifest;
    address private systemManifestPayload;

    function setUp() public {
        vm.warp(BASE_TIME);
        BootstrapArtifacts memory bootstrap = _deploySealedExecutor(address(this));
        executor = bootstrap.executor;
        systemManifest = bootstrap.manifest;
        systemManifestPayload = bootstrap.payloadRoot;
        registry = new StreamModuleRegistry(
            executor, keccak256("registry-manifest"), "ipfs://registry-manifest"
        );
        module = new RegistryModuleMock(MODULE_INTERFACE_ID);
        _registerRegistryTailRules();
    }

    function _scheduleExecutorCall(
        uint8 actionClass,
        bytes memory data,
        bytes32 callScopeHash,
        bytes32 callOldValueHash,
        bytes32 callNewValueHash,
        uint64 notBefore
    ) private returns (bytes32 actionId, GovernanceCall[] memory calls, bytes[] memory callDatas) {
        calls = new GovernanceCall[](1);
        bytes4 selector;
        assembly ("memory-safe") {
            selector := mload(add(data, 0x20))
        }
        calls[0] = GovernanceCall({
            target: address(executor),
            value: 0,
            selector: selector,
            callDataHash: keccak256(data),
            scopeHash: callScopeHash,
            oldValueHash: callOldValueHash,
            newValueHash: callNewValueHash
        });
        bytes32 callsHash = keccak256(abi.encode(GOVERNANCE_CALLS_V2, calls));
        callDatas = new bytes[](1);
        callDatas[0] = data;
        executor.publishGovernanceCallData(callDatas);
        actionId = executor.scheduleGovernanceBatch(
            actionClass,
            calls,
            _aggregateHash(BATCH_SCOPE_V2, callsHash, callScopeHash),
            _aggregateHash(BATCH_OLD_STATE_V2, callsHash, callOldValueHash),
            _aggregateHash(BATCH_NEW_STATE_V2, callsHash, callNewValueHash),
            notBefore,
            notBefore + 7 days,
            keccak256("register-registry-tail-rule"),
            "ipfs://register-registry-tail-rule",
            keccak256("registry-tail-rule-manifest")
        );
    }

    function _registerRegistryTailRules() private {
        _registerRegistryTailRule(StreamModuleRegistry.registerModule.selector, 0x02);
        _registerRegistryTailRule(StreamModuleRegistry.setModuleStatus.selector, 0x03);
        _registerRegistryTailRule(StreamModuleRegistry.setModuleRegistryManifest.selector, 0x02);
    }

    function _registerRegistryTailRule(bytes4 selector, uint8 expectedMask) private {
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _tailTriggerTransition(address(registry), selector, expectedMask);
        bytes memory data = abi.encodeCall(
            StreamGovernanceExecutor.registerSystemManifestTailTrigger,
            (address(registry), selector, expectedMask)
        );
        uint64 notBefore = uint64(block.timestamp)
            + executor.minimumDelay(StreamGovernanceActionClasses.TERMINAL_FREEZE);
        (bytes32 actionId, GovernanceCall[] memory calls, bytes[] memory callDatas) = _scheduleExecutorCall(
            StreamGovernanceActionClasses.TERMINAL_FREEZE,
            data,
            scopeHash,
            oldValueHash,
            newValueHash,
            notBefore
        );
        vm.warp(notBefore);
        executor.executeGovernanceBatch(actionId, calls, callDatas);

        (bool registered,, uint8 mask, address tailTarget, bytes4 tailSelector,) =
            executor.systemManifestBatchTailRule(address(registry), selector);
        registered.assertTrue("registry tail rule registered");
        uint256(mask).assertEq(expectedMask, "registry tail rule mask");
        tailTarget.assertEq(address(systemManifest), "registry tail target");
        bytes32(tailSelector).assertEq(bytes32(bytes4(0x09b1b5c6)), "registry tail selector");
    }

    function _tailTriggerTransition(address target, bytes4 selector, uint8 mask)
        private
        view
        returns (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash)
    {
        uint256 count = executor.systemManifestTailTriggerCount();
        require(count < type(uint64).max, "tail count");
        uint64 index = uint64(count);
        (bytes32 chainHash, uint64 recordCount) = executor.systemManifestTailTriggerChainHash();
        require(recordCount == index, "tail count/chain");
        (,,, address tailTarget, bytes4 tailSelector, bytes32 tailCodeHash) =
            executor.systemManifestBatchTailRule(target, selector);
        bytes32 targetCodeHash = target.codehash;
        scopeHash = keccak256(
            abi.encode(
                bytes32(0x2c9b0dbea692b77bd1679258ca569c13c24eb261671f5a6b78b9fa59cd29c7f1),
                uint256(block.chainid),
                address(executor),
                target,
                selector
            )
        );
        oldValueHash = keccak256(
            abi.encode(
                bytes32(0xd41313fe7ee9b51221beebf9c314d67aebec3677907eb1365fff4caa4248f493),
                scopeHash,
                false,
                bytes32(0),
                uint8(0),
                index,
                chainHash,
                tailTarget,
                tailSelector,
                tailCodeHash
            )
        );
        bytes32 recordHash = keccak256(
            abi.encode(
                bytes32(0xe52b2b6e65acb1eae2c217c4b26e893c7d0e7f32afc148867b79c133b3a134fa),
                index,
                target,
                selector,
                targetCodeHash,
                mask
            )
        );
        bytes32 nextChainHash = keccak256(
            abi.encode(
                bytes32(0xdf8c3b0d7ebdd491123b988924db55f8fd11251d7e88e5d76722331928dd4951),
                uint256(block.chainid),
                address(executor),
                chainHash,
                recordHash,
                index
            )
        );
        newValueHash = keccak256(
            abi.encode(
                bytes32(0xd41313fe7ee9b51221beebf9c314d67aebec3677907eb1365fff4caa4248f493),
                scopeHash,
                true,
                targetCodeHash,
                mask,
                index + 1,
                nextChainHash,
                tailTarget,
                tailSelector,
                tailCodeHash
            )
        );
    }

    function _aggregateHash(bytes32 domain, bytes32 callsHash, bytes32 value)
        private
        pure
        returns (bytes32)
    {
        bytes32[] memory values = new bytes32[](1);
        values[0] = value;
        return keccak256(abi.encode(domain, callsHash, values));
    }

    function _buildRegistryBatchWithTail(
        bytes memory registryData,
        bytes32 registryScopeHash,
        bytes32 registryOldValueHash,
        bytes32 registryNewValueHash
    )
        private
        view
        returns (GovernanceCall[] memory calls, bytes[] memory callDatas, bytes32 manifestHash)
    {
        bytes4 registrySelector;
        assembly ("memory-safe") {
            registrySelector := mload(add(registryData, 0x20))
        }
        manifestHash = keccak256(
            abi.encode(
                "registry-writer-manifest",
                registrySelector,
                registryNewValueHash,
                systemManifest.streamSystemManifestPointerCount()
            )
        );
        StreamGovernanceBootstrapManifestMock.StreamSystemManifestUpdate memory update =
            StreamGovernanceBootstrapManifestMock.StreamSystemManifestUpdate({
                manifestHash: manifestHash,
                manifestURI: "ipfs://registry-writer-manifest",
                eventCatalogHash: keccak256("event-catalog"),
                compatibilityMatrixHash: keccak256("compatibility-matrix"),
                numericIdCatalogHash: keccak256("numeric-id-catalog"),
                schemaCatalogHash: keccak256("schema-catalog"),
                canonicalizationCatalogHash: keccak256("canonicalization-catalog"),
                specBundleHash: keccak256("spec-bundle"),
                reconstructionClientHash: keccak256("reconstruction-client")
            });
        callDatas = new bytes[](2);
        callDatas[0] = registryData;
        callDatas[1] = abi.encodeWithSelector(bytes4(0x09b1b5c6), systemManifestPayload, update);

        calls = new GovernanceCall[](2);
        calls[0] = GovernanceCall({
            target: address(registry),
            value: 0,
            selector: registrySelector,
            callDataHash: keccak256(callDatas[0]),
            scopeHash: registryScopeHash,
            oldValueHash: registryOldValueHash,
            newValueHash: registryNewValueHash
        });
        calls[1] = GovernanceCall({
            target: address(systemManifest),
            value: 0,
            selector: bytes4(0x09b1b5c6),
            callDataHash: keccak256(callDatas[1]),
            scopeHash: keccak256(
                abi.encode("registry-writer-tail-scope", registrySelector, registryNewValueHash)
            ),
            oldValueHash: keccak256(
                abi.encode("registry-writer-tail-old", registrySelector, registryOldValueHash)
            ),
            newValueHash: keccak256(
                abi.encode("registry-writer-tail-new", registrySelector, registryNewValueHash)
            )
        });
    }

    function _scheduleRegistryBatch(
        uint8 actionClass,
        GovernanceCall[] memory calls,
        bytes[] memory callDatas,
        uint64 notBefore,
        bytes32 manifestHash
    ) private returns (bytes32 actionId) {
        executor.publishGovernanceCallData(callDatas);
        return _schedulePublishedRegistryBatch(actionClass, calls, notBefore, manifestHash);
    }

    function _schedulePublishedRegistryBatch(
        uint8 actionClass,
        GovernanceCall[] memory calls,
        uint64 notBefore,
        bytes32 manifestHash
    ) private returns (bytes32 actionId) {
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _registryBatchTransitionHashes(calls);
        actionId = executor.scheduleGovernanceBatch(
            actionClass,
            calls,
            scopeHash,
            oldValueHash,
            newValueHash,
            notBefore,
            notBefore + 7 days,
            keccak256(abi.encode("registry-writer", calls[0].callDataHash)),
            "ipfs://registry-writer",
            manifestHash
        );
    }

    function _scheduleRegistryCallWithTail(
        uint8 actionClass,
        bytes memory registryData,
        bytes32 registryScopeHash,
        bytes32 registryOldValueHash,
        bytes32 registryNewValueHash,
        uint64 notBefore
    ) private returns (bytes32 actionId, GovernanceCall[] memory calls, bytes[] memory callDatas) {
        bytes32 manifestHash;
        (calls, callDatas, manifestHash) = _buildRegistryBatchWithTail(
            registryData, registryScopeHash, registryOldValueHash, registryNewValueHash
        );
        actionId = _scheduleRegistryBatch(actionClass, calls, callDatas, notBefore, manifestHash);
    }

    function _registryBatchTransitionHashes(GovernanceCall[] memory calls)
        private
        pure
        returns (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash)
    {
        bytes32 callsHash = keccak256(abi.encode(GOVERNANCE_CALLS_V2, calls));
        bytes32[] memory scopes = new bytes32[](calls.length);
        bytes32[] memory oldValues = new bytes32[](calls.length);
        bytes32[] memory newValues = new bytes32[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            scopes[i] = calls[i].scopeHash;
            oldValues[i] = calls[i].oldValueHash;
            newValues[i] = calls[i].newValueHash;
        }
        scopeHash = keccak256(abi.encode(BATCH_SCOPE_V2, callsHash, scopes));
        oldValueHash = keccak256(abi.encode(BATCH_OLD_STATE_V2, callsHash, oldValues));
        newValueHash = keccak256(abi.encode(BATCH_NEW_STATE_V2, callsHash, newValues));
    }

    function _registrationFor(address moduleAddress)
        private
        view
        returns (StreamModuleRegistration memory registration)
    {
        registration.module = moduleAddress;
        registration.moduleType = keccak256("STREAM_RENDERER");
        registration.moduleVersion = bytes32(uint256(1));
        registration.interfaceId = MODULE_INTERFACE_ID;
        registration.moduleGasLimit = 0;
        registration.expectedRuntimeCodeHash = moduleAddress.codehash;
        registration.deploymentManifestHash = keccak256("deployment-manifest");
        registration.moduleManifestHash = keccak256("module-manifest");
        registration.moduleManifestURI = "ipfs://module-manifest";
    }

    function _registrationTransition(StreamModuleRegistration memory registration)
        private
        view
        returns (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash)
    {
        (bytes32 chainHash, uint64 recordCount) = registry.registrationChainHash();
        uint256 count = registry.moduleCount();
        bytes32 recordHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_REGISTRATION_RECORD_V1(),
                registration.module,
                registration.moduleType,
                registration.interfaceId,
                registration.moduleVersion,
                registration.module.codehash,
                registration.deploymentManifestHash,
                registration.moduleManifestHash
            )
        );
        bytes32 newChainHash = keccak256(
            abi.encode(
                registry.STREAM_RECORD_CHAIN_V1(),
                uint256(block.chainid),
                address(registry),
                uint256(0),
                keccak256("MODULE_REGISTRATION"),
                chainHash,
                recordHash,
                uint64(count)
            )
        );
        scopeHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_REGISTRATION_SCOPE_V1(),
                uint256(block.chainid),
                address(registry),
                registration.module
            )
        );
        bytes32 emptyFactsHash = keccak256(
            abi.encode(
                uint8(ModuleRegistryStatus.UNKNOWN),
                bytes32(0),
                bytes32(0),
                bytes4(0),
                uint32(0),
                bytes32(0),
                bytes32(0),
                bytes32(0),
                keccak256(bytes("")),
                uint64(0)
            )
        );
        bytes32 activeFactsHash = keccak256(
            abi.encode(
                uint8(ModuleRegistryStatus.ACTIVE),
                registration.moduleType,
                registration.moduleVersion,
                registration.interfaceId,
                registration.moduleGasLimit,
                registration.module.codehash,
                registration.deploymentManifestHash,
                registration.moduleManifestHash,
                keccak256(bytes(registration.moduleManifestURI)),
                uint64(1)
            )
        );
        oldValueHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_REGISTRATION_STATE_V1(),
                scopeHash,
                false,
                emptyFactsHash,
                count,
                chainHash,
                recordCount,
                address(0)
            )
        );
        newValueHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_REGISTRATION_STATE_V1(),
                scopeHash,
                true,
                activeFactsHash,
                count + 1,
                newChainHash,
                recordCount + 1,
                registration.module
            )
        );
    }

    function _statusTransition(address moduleAddress, ModuleRegistryStatus newStatus)
        private
        view
        returns (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash)
    {
        StreamModuleRecord memory record = registry.moduleRecord(moduleAddress);
        (bytes32 chainHash, uint64 recordCount) = registry.registrationChainHash();
        scopeHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_STATUS_SCOPE_V1(),
                uint256(block.chainid),
                address(registry),
                moduleAddress
            )
        );
        bytes32 oldFactsHash = _recordFactsHash(record, record.status, record.revision);
        bytes32 newFactsHash = _recordFactsHash(record, newStatus, record.revision + 1);
        oldValueHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_STATUS_STATE_V1(),
                scopeHash,
                oldFactsHash,
                registry.moduleCount(),
                chainHash,
                recordCount
            )
        );
        newValueHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_STATUS_STATE_V1(),
                scopeHash,
                newFactsHash,
                registry.moduleCount(),
                chainHash,
                recordCount
            )
        );
    }

    function _manifestTransition(bytes32 newManifestHash, string memory newManifestURI)
        private
        view
        returns (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash)
    {
        (bytes32 oldManifestHash, string memory oldManifestURI, uint64 oldRevision) =
            registry.moduleRegistryManifest();
        scopeHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_REGISTRY_MANIFEST_SCOPE_V1(),
                uint256(block.chainid),
                address(registry)
            )
        );
        oldValueHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_REGISTRY_MANIFEST_STATE_V1(),
                scopeHash,
                oldManifestHash,
                keccak256(bytes(oldManifestURI)),
                oldRevision
            )
        );
        newValueHash = keccak256(
            abi.encode(
                registry.STREAM_MODULE_REGISTRY_MANIFEST_STATE_V1(),
                scopeHash,
                newManifestHash,
                keccak256(bytes(newManifestURI)),
                oldRevision + 1
            )
        );
    }

    function _recordFactsHash(
        StreamModuleRecord memory record,
        ModuleRegistryStatus status,
        uint64 revision
    ) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                uint8(status),
                record.moduleType,
                record.moduleVersion,
                record.interfaceId,
                record.moduleGasLimit,
                record.runtimeCodeHash,
                record.deploymentManifestHash,
                record.moduleManifestHash,
                keccak256(bytes(record.moduleManifestURI)),
                revision
            )
        );
    }

    function _assertRegistryTailRule(bytes4 selector, uint8 expectedMask) private view {
        (
            bool registered,
            bytes32 triggerCodeHash,
            uint8 mask,
            address tailTarget,
            bytes4 tailSelector,
            bytes32 tailCodeHash
        ) = executor.systemManifestBatchTailRule(address(registry), selector);
        registered.assertTrue("registry writer tail rule registered");
        triggerCodeHash.assertEq(address(registry).codehash, "registry writer codehash pin");
        uint256(mask).assertEq(expectedMask, "registry writer class mask");
        tailTarget.assertEq(address(systemManifest), "registry writer tail target");
        bytes32(tailSelector).assertEq(bytes32(bytes4(0x09b1b5c6)), "registry writer tail selector");
        tailCodeHash.assertEq(address(systemManifest).codehash, "registry writer tail codehash");
    }

    function _expectMissingManifestTail(
        uint8 actionClass,
        bytes memory registryData,
        bytes32 registryScopeHash,
        bytes32 registryOldValueHash,
        bytes32 registryNewValueHash,
        uint64 notBefore
    ) private {
        (
            GovernanceCall[] memory canonicalCalls,
            bytes[] memory canonicalCallDatas,
            bytes32 manifestHash
        ) = _buildRegistryBatchWithTail(
            registryData, registryScopeHash, registryOldValueHash, registryNewValueHash
        );
        GovernanceCall[] memory triggerOnly = new GovernanceCall[](1);
        triggerOnly[0] = canonicalCalls[0];
        bytes[] memory triggerOnlyData = new bytes[](1);
        triggerOnlyData[0] = canonicalCallDatas[0];
        executor.publishGovernanceCallData(triggerOnlyData);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.ManifestTailRequired.selector)
        );
        _schedulePublishedRegistryBatch(actionClass, triggerOnly, notBefore, manifestHash);
    }

    function testRegistryTailRulesPinAllWriterPairsAndMasks() public view {
        _assertRegistryTailRule(StreamModuleRegistry.registerModule.selector, 0x02);
        _assertRegistryTailRule(StreamModuleRegistry.setModuleStatus.selector, 0x03);
        _assertRegistryTailRule(StreamModuleRegistry.setModuleRegistryManifest.selector, 0x02);
    }

    function testAllRegistryWritersRejectMissingManifestTail() public {
        StreamModuleRegistration memory registration = _registrationFor(address(module));
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _registrationTransition(registration);
        bytes memory registrationData =
            abi.encodeCall(StreamModuleRegistry.registerModule, (registration));
        uint64 registrationNotBefore = uint64(block.timestamp) + 48 hours;
        _expectMissingManifestTail(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            registrationData,
            scopeHash,
            oldValueHash,
            newValueHash,
            registrationNotBefore
        );
        (
            bytes32 registrationActionId,
            GovernanceCall[] memory registrationCalls,
            bytes[] memory registrationCallDatas
        ) = _scheduleRegistryCallWithTail(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            registrationData,
            scopeHash,
            oldValueHash,
            newValueHash,
            registrationNotBefore
        );
        vm.warp(registrationNotBefore);
        executor.executeGovernanceBatch(
            registrationActionId, registrationCalls, registrationCallDatas
        );

        bytes memory statusData = abi.encodeCall(
            StreamModuleRegistry.setModuleStatus,
            (
                address(module),
                ModuleRegistryStatus.INCIDENT_REVOKED,
                keccak256("missing-tail-status"),
                "ipfs://missing-tail-status"
            )
        );
        _expectMissingManifestTail(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            statusData,
            keccak256("missing-tail-status-scope"),
            keccak256("missing-tail-status-old"),
            keccak256("missing-tail-status-new"),
            uint64(block.timestamp)
        );

        bytes memory manifestData = abi.encodeCall(
            StreamModuleRegistry.setModuleRegistryManifest,
            (keccak256("missing-tail-manifest"), "ipfs://missing-tail-manifest")
        );
        _expectMissingManifestTail(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            manifestData,
            keccak256("missing-tail-manifest-scope"),
            keccak256("missing-tail-manifest-old"),
            keccak256("missing-tail-manifest-new"),
            uint64(block.timestamp) + 48 hours
        );
    }

    function testRegistryWriterRejectsDuplicateAndNonFinalManifestTails() public {
        StreamModuleRegistration memory registration = _registrationFor(address(module));
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _registrationTransition(registration);
        (
            GovernanceCall[] memory canonicalCalls,
            bytes[] memory canonicalCallDatas,
            bytes32 manifestHash
        ) = _buildRegistryBatchWithTail(
            abi.encodeCall(StreamModuleRegistry.registerModule, (registration)),
            scopeHash,
            oldValueHash,
            newValueHash
        );
        uint64 notBefore = uint64(block.timestamp) + 48 hours;

        GovernanceCall[] memory duplicateTailCalls = new GovernanceCall[](3);
        duplicateTailCalls[0] = canonicalCalls[0];
        duplicateTailCalls[1] = canonicalCalls[1];
        duplicateTailCalls[2] = canonicalCalls[1];
        bytes[] memory duplicateTailDatas = new bytes[](3);
        duplicateTailDatas[0] = canonicalCallDatas[0];
        duplicateTailDatas[1] = canonicalCallDatas[1];
        duplicateTailDatas[2] = canonicalCallDatas[1];
        executor.publishGovernanceCallData(duplicateTailDatas);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.InvalidManifestTail.selector)
        );
        _schedulePublishedRegistryBatch(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            duplicateTailCalls,
            notBefore,
            manifestHash
        );

        GovernanceCall[] memory nonFinalTailCalls = new GovernanceCall[](2);
        nonFinalTailCalls[0] = canonicalCalls[1];
        nonFinalTailCalls[1] = canonicalCalls[0];
        bytes[] memory nonFinalTailDatas = new bytes[](2);
        nonFinalTailDatas[0] = canonicalCallDatas[1];
        nonFinalTailDatas[1] = canonicalCallDatas[0];
        executor.publishGovernanceCallData(nonFinalTailDatas);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.InvalidManifestTail.selector)
        );
        _schedulePublishedRegistryBatch(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            nonFinalTailCalls,
            notBefore,
            manifestHash
        );

        registry.moduleCount().assertEq(0, "invalid tails mutated registry");
        systemManifest.streamSystemManifestPointerCount()
            .assertEq(1, "invalid tails published manifest");
    }

    function testRegistrationThroughDelayedLooseningAction() public {
        StreamModuleRegistration memory registration = _registrationFor(address(module));

        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _registrationTransition(registration);
        uint64 notBefore = uint64(block.timestamp) + 48 hours;
        (bytes32 actionId, GovernanceCall[] memory calls, bytes[] memory callDatas) = _scheduleRegistryCallWithTail(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            abi.encodeCall(StreamModuleRegistry.registerModule, (registration)),
            scopeHash,
            oldValueHash,
            newValueHash,
            notBefore
        );

        vm.warp(notBefore);
        executor.executeGovernanceBatch(actionId, calls, callDatas);

        registry.moduleCount().assertEq(1, "registered through staged action");
        registry.moduleAt(0).assertEq(address(module), "enumerated");
        registry.isModuleEligible(
                address(module), keccak256("STREAM_RENDERER"), MODULE_INTERFACE_ID
            ).assertTrue("eligible after governed registration");
        systemManifest.streamSystemManifestPointerCount()
            .assertEq(2, "registration batch published final manifest");
    }

    function testScheduledRegistrationRejectsInterveningCountAndChainDrift() public {
        RegistryModuleMock interveningModule = new RegistryModuleMock(MODULE_INTERFACE_ID);
        StreamModuleRegistration memory staleRegistration = _registrationFor(address(module));
        StreamModuleRegistration memory interveningRegistration =
            _registrationFor(address(interveningModule));
        uint64 notBefore = uint64(block.timestamp) + 48 hours;

        (bytes32 staleScope, bytes32 staleOld, bytes32 staleNew) =
            _registrationTransition(staleRegistration);
        (
            bytes32 staleActionId,
            GovernanceCall[] memory staleCalls,
            bytes[] memory staleCallDatas
        ) = _scheduleRegistryCallWithTail(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            abi.encodeCall(StreamModuleRegistry.registerModule, (staleRegistration)),
            staleScope,
            staleOld,
            staleNew,
            notBefore
        );

        (bytes32 currentScope, bytes32 currentOld, bytes32 currentNew) =
            _registrationTransition(interveningRegistration);
        (
            bytes32 currentActionId,
            GovernanceCall[] memory currentCalls,
            bytes[] memory currentCallDatas
        ) = _scheduleRegistryCallWithTail(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            abi.encodeCall(StreamModuleRegistry.registerModule, (interveningRegistration)),
            currentScope,
            currentOld,
            currentNew,
            notBefore
        );

        vm.warp(notBefore);
        executor.executeGovernanceBatch(currentActionId, currentCalls, currentCallDatas);
        (bytes32 chainAfterIntervening, uint64 countAfterIntervening) =
            registry.registrationChainHash();
        registry.moduleCount().assertEq(1, "intervening registration count");
        uint256(countAfterIntervening).assertEq(1, "intervening record count");

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamModuleRegistry.GovernanceTransitionContextMismatch.selector
            )
        );
        executor.executeGovernanceBatch(staleActionId, staleCalls, staleCallDatas);

        registry.moduleCount().assertEq(1, "stale registration changed module count");
        (bytes32 finalChain, uint64 finalRecordCount) = registry.registrationChainHash();
        finalChain.assertEq(chainAfterIntervening, "stale registration changed chain");
        uint256(finalRecordCount).assertEq(1, "stale registration changed record count");
        uint256(uint8(registry.moduleRecord(address(module)).status))
            .assertEq(uint256(uint8(ModuleRegistryStatus.UNKNOWN)), "stale module registered");
        uint256(uint8(registry.moduleRecord(address(interveningModule)).status))
            .assertEq(uint256(uint8(ModuleRegistryStatus.ACTIVE)), "intervening module not active");
        systemManifest.streamSystemManifestPointerCount()
            .assertEq(2, "stale registration published its tail");
    }

    function testRegistryManifestUpdateThroughDelayedLooseningWithTail() public {
        bytes32 newManifestHash = keccak256("registry-manifest-v2");
        string memory newManifestURI = "ipfs://registry-manifest-v2";
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _manifestTransition(newManifestHash, newManifestURI);
        uint64 notBefore = uint64(block.timestamp) + 48 hours;
        (bytes32 actionId, GovernanceCall[] memory calls, bytes[] memory callDatas) = _scheduleRegistryCallWithTail(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            abi.encodeCall(
                StreamModuleRegistry.setModuleRegistryManifest, (newManifestHash, newManifestURI)
            ),
            scopeHash,
            oldValueHash,
            newValueHash,
            notBefore
        );

        vm.warp(notBefore);
        executor.executeGovernanceBatch(actionId, calls, callDatas);

        (bytes32 manifestHash, string memory manifestURI, uint64 revision) =
            registry.moduleRegistryManifest();
        manifestHash.assertEq(newManifestHash, "governed manifest hash");
        require(
            keccak256(bytes(manifestURI)) == keccak256(bytes(newManifestURI)),
            "governed manifest URI"
        );
        uint256(revision).assertEq(2, "governed manifest revision");
        systemManifest.streamSystemManifestPointerCount()
            .assertEq(2, "manifest writer published final system manifest");
    }

    function testIncidentRevocationThroughImmediateTightening() public {
        // Register first through the delayed path.
        testRegistrationThroughDelayedLooseningAction();

        bytes memory data = abi.encodeCall(
            StreamModuleRegistry.setModuleStatus,
            (
                address(module),
                ModuleRegistryStatus.INCIDENT_REVOKED,
                keccak256("incident"),
                "ipfs://incident"
            )
        );
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _statusTransition(address(module), ModuleRegistryStatus.INCIDENT_REVOKED);
        uint64 notBefore = uint64(block.timestamp);
        (bytes32 actionId, GovernanceCall[] memory calls, bytes[] memory callDatas) = _scheduleRegistryCallWithTail(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            data,
            scopeHash,
            oldValueHash,
            newValueHash,
            notBefore
        );
        systemManifest.streamSystemManifestPointerCount()
            .assertEq(2, "registration publication retained");
        executor.executeGovernanceBatch(actionId, calls, callDatas);

        uint256(uint8(registry.moduleRecord(address(module)).status))
            .assertEq(
                uint256(uint8(ModuleRegistryStatus.INCIDENT_REVOKED)),
                "incident revoked with zero delay"
            );
        registry.isModuleEligible(
                address(module), keccak256("STREAM_RENDERER"), MODULE_INTERFACE_ID
            ).assertFalse("revoked module ineligible");
        registry.moduleCount().assertEq(1, "record retained after revocation");
        systemManifest.streamSystemManifestPointerCount()
            .assertEq(3, "status batch published final manifest");

        bytes memory reactivateData = abi.encodeCall(
            StreamModuleRegistry.setModuleStatus,
            (
                address(module),
                ModuleRegistryStatus.ACTIVE,
                keccak256("reactivate"),
                "ipfs://reactivate"
            )
        );
        (scopeHash, oldValueHash, newValueHash) =
            _statusTransition(address(module), ModuleRegistryStatus.ACTIVE);
        notBefore = uint64(block.timestamp) + 48 hours;
        (actionId, calls, callDatas) = _scheduleRegistryCallWithTail(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            reactivateData,
            scopeHash,
            oldValueHash,
            newValueHash,
            notBefore
        );
        vm.warp(notBefore);
        executor.executeGovernanceBatch(actionId, calls, callDatas);

        uint256(uint8(registry.moduleRecord(address(module)).status))
            .assertEq(
                uint256(uint8(ModuleRegistryStatus.ACTIVE)),
                "delayed status loosening reactivated module"
            );
        systemManifest.streamSystemManifestPointerCount()
            .assertEq(4, "status loosening published final manifest");
    }
}
