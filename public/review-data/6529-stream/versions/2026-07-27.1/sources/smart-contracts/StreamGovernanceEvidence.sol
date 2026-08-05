// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IStreamGovernanceExecutor.sol";
import "./IStreamModuleRegistry.sol";
import "./IStreamRoleRegistry.sol";
import "./SSTORE2.sol";
import "./StreamRoles.sol";

/// @notice Linked, read-only verifier for bootstrap topology, canonical
///         inventory state, and chunked system-manifest payload evidence.
/// @dev Public functions execute by DELEGATECALL so all chain/executor domains
///      continue to bind to the governance Executor.
library StreamGovernanceEvidence {
    bytes32 private constant INVENTORY_LEAF_V1 =
        0x389d432187327bb28628b23403c9b3c549d0cf950e480ad6d69b7d9fa7b48b9d;
    bytes32 private constant INVENTORY_CHAIN_V1 =
        0x9efe6891a30e5198982f60b2d916e3275b866addbee37b7d4b875e52d5251e89;
    bytes32 private constant INVENTORY_ROOT_V1 =
        0xb524bfb9f69adc6c2d0e07003dd39a76b1d6a728dd95dbd495f709428d21b4ec;
    bytes4 private constant MANIFEST_PUBLISH_SELECTOR = 0x09b1b5c6;
    bytes4 private constant MANIFEST_INTERFACE_ID = 0x37660ede;
    bytes32 private constant SYSTEM_MANIFEST_POINTER_TYPE =
        0x03f4d9e115b9c4c43ab58684ef44935e7cf92d54b8db1d97a707c8526faa3c1b;
    bytes32 private constant SYSTEM_MANIFEST_MODULE_TYPE =
        0x47fd79d5a6e9b1d75dcedf141a46e2e8f6d95d5a5be2b88f197fa98a1436fec6;
    uint8 private constant MODULE_STATUS_ACTIVE = 1;
    uint256 private constant MAX_MANIFEST_URI_BYTES = 2_048;
    uint256 private constant MAX_STRICT_REGISTRY_MODULES = 128;
    uint256 private constant MAX_STRICT_INVENTORY_LEAVES = 80;
    uint256 private constant MAX_STRICT_POINTERS = 32;
    uint256 private constant MAX_STRICT_REGISTRIES = 8;
    uint256 private constant MAX_REGISTRY_MANIFEST_RETURN_BYTES = 2_176;
    uint256 private constant MAX_MODULE_RECORD_RETURN_BYTES = 2_496;
    bytes4 private constant NO_EXECUTING_ACTION = 0xb8456c92;
    bytes4 private constant ROOT_MAGIC = 0x6c9d2530;
    bytes32 private constant PAYLOAD_V1 =
        0x8844b744a67cdcdb84ea3c6e3d686883da175820b9ff07a19cffa14bf62e6e81;
    bytes32 private constant JCS =
        0x886c7c89c308c459ca8a626e0ef36a5ea9f4c7a7b56aaf86c71a2ddf3b4f9044;
    bytes32 private constant PAYLOAD_ROOT_V1 =
        0xd6ab89b077c61a288c7168cf8f1c9a7a19464b10475735dae37cb46a0c94c40b;
    bytes32 private constant PAYLOAD_LEAF_V1 =
        0x852f4811a2eb32694863d94ba41b545a65ef4c76086a32c35881f0c4e250a7b5;
    bytes32 private constant PAYLOAD_LIST_V1 =
        0xa93750a5551ac5668c8f24cca85acaf1d5f8334fac9406f845fce1ce35548839;

    struct PointerFacts {
        address target;
        bytes32 codeHash;
        bool frozen;
        bytes32 moduleType;
        bytes4 interfaceId;
        address registry;
        uint8 registryStatus;
        bytes32 moduleManifestHash;
        bytes32 deploymentManifestHash;
        uint64 revision;
    }

    struct ModuleRecord {
        uint8 status;
        bytes32 moduleType;
        bytes32 moduleVersion;
        bytes4 interfaceId;
        uint32 moduleGasLimit;
        bytes32 runtimeCodeHash;
        bytes32 deploymentManifestHash;
        bytes32 moduleManifestHash;
        string moduleManifestURI;
        uint64 registeredAt;
        uint64 statusUpdatedAt;
        uint64 revision;
    }

    struct ManifestChunk {
        address pointer;
        uint32 payloadLength;
        bytes32 payloadHash;
    }

    struct ManifestUpdate {
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

    struct StrictInventoryContext {
        address[] pointerTargets;
        address[] pointerRegistries;
        bytes32[] pointerRecordHashes;
        bool[] pointerEnumerated;
        uint256[] registryModuleCounts;
    }

    function decodeManifestPublication(bytes memory callData)
        public
        pure
        returns (address payloadPointer, ManifestUpdate memory update)
    {
        if (callData.length < 4 || _leadingSelector(callData) != MANIFEST_PUBLISH_SELECTOR) {
            revert IStreamGovernanceExecutor.InvalidManifestTail();
        }
        bytes memory arguments = new bytes(callData.length - 4);
        for (uint256 i = 0; i < arguments.length; i++) {
            arguments[i] = callData[i + 4];
        }
        (payloadPointer, update) = abi.decode(arguments, (address, ManifestUpdate));
        if (!_bytesEqual(
                callData,
                abi.encodePacked(MANIFEST_PUBLISH_SELECTOR, abi.encode(payloadPointer, update))
            )) revert IStreamGovernanceExecutor.InvalidManifestTail();
    }

    function validateBootstrapBinding(SystemManifestBootstrapBinding calldata binding) public view {
        if (
            binding.roleRegistry == address(0) || binding.roleRegistry.code.length == 0
                || _isEIP7702DelegatedEOA(binding.roleRegistry)
                || !_supportsInterface(binding.roleRegistry, type(IStreamRoleRegistry).interfaceId)
                || _supportsInterface(binding.roleRegistry, 0xffffffff)
        ) revert IStreamGovernanceExecutor.InvalidRoleRegistry(binding.roleRegistry);
        if (
            binding.governanceRoot == address(0) || binding.governanceRoot == address(this)
                || binding.governanceRoot.code.length == 0
                || _isEIP7702DelegatedEOA(binding.governanceRoot)
                || binding.governanceRoot == binding.roleRegistry
                || binding.governanceRoot == binding.core
                || binding.governanceRoot == binding.systemManifestSatellite
        ) revert IStreamGovernanceExecutor.InvalidGovernanceRoot(binding.governanceRoot);
        bytes32 actualGovernanceRootCodeHash = binding.governanceRoot.codehash;
        if (
            binding.governanceRootCodeHash == bytes32(0)
                || binding.governanceRootCodeHash != actualGovernanceRootCodeHash
        ) {
            revert IStreamGovernanceExecutor.GovernanceRootCodeHashMismatch(
                binding.governanceRootCodeHash, actualGovernanceRootCodeHash
            );
        }
        requireRoleRegistryOwner(binding.roleRegistry, address(this));
        (bytes32 terminalRoleChain, uint64 terminalRoleRevision) = _readBytes32Uint64(
            binding.roleRegistry,
            abi.encodeWithSelector(
                IStreamRoleRegistry.roleMutationState.selector,
                StreamRoles.ROLE_TERMINAL_FREEZE_VETO
            )
        );
        (bytes32 globalRoleChain, uint64 globalRoleRevision) = _readBytes32Uint64(
            binding.roleRegistry,
            abi.encodeWithSelector(IStreamRoleRegistry.globalRoleMutationState.selector)
        );
        if (
            binding.initialTerminalFreezeVetoGuardians.length < 2
                || binding.initialTerminalFreezeVetoGuardians.length > 16
                || _readUint256(
                        binding.roleRegistry,
                        abi.encodeWithSelector(
                            IStreamRoleRegistry.roleHolderCount.selector,
                            StreamRoles.ROLE_TERMINAL_FREEZE_VETO
                        )
                    ) != 0 || terminalRoleChain != bytes32(0) || terminalRoleRevision != 0
                || globalRoleChain != bytes32(0) || globalRoleRevision != 0
        ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        address priorGuardian = address(0);
        for (uint256 i = 0; i < binding.initialTerminalFreezeVetoGuardians.length; i++) {
            address guardian = binding.initialTerminalFreezeVetoGuardians[i];
            if (
                guardian.code.length == 0 || _isEIP7702DelegatedEOA(guardian)
                    || guardian == address(this) || guardian == binding.governanceRoot
                    || guardian == binding.roleRegistry || guardian == binding.core
                    || guardian == binding.systemManifestSatellite
                    || (i != 0 && uint160(priorGuardian) >= uint160(guardian))
            ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
            priorGuardian = guardian;
        }
        if (
            binding.core == address(0) || binding.systemManifestSatellite == address(0)
                || binding.core == binding.systemManifestSatellite || binding.core.code.length == 0
                || binding.systemManifestSatellite.code.length == 0
                || _isEIP7702DelegatedEOA(binding.core)
                || _isEIP7702DelegatedEOA(binding.systemManifestSatellite)
                || binding.roleRegistry == binding.core
                || binding.roleRegistry == binding.systemManifestSatellite
                || binding.expectedManifestHash == bytes32(0)
                || binding.expectedInventoryStateRoot == bytes32(0)
                || binding.expectedInventoryLeafCount == 0 || binding.expectedTriggers.length == 0
                || binding.expectedTriggers.length > 128 || binding.pointerTypes.length == 0
                || binding.registries.length == 0
        ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        if (
            binding.expectedInventoryLeafCount > MAX_STRICT_INVENTORY_LEAVES
                || binding.pointerTypes.length > MAX_STRICT_POINTERS
                || binding.registries.length > MAX_STRICT_REGISTRIES
                || binding.pointerTypes.length > binding.expectedInventoryLeafCount
                || binding.registries.length
                    > binding.expectedInventoryLeafCount - binding.pointerTypes.length
        ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        uint256 maximumReachableInventoryLeafCount = binding.pointerTypes.length
            + binding.registries.length + binding.registries.length * MAX_STRICT_REGISTRY_MODULES;
        if (binding.expectedInventoryLeafCount > maximumReachableInventoryLeafCount) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        (bool coreProbeOk, bytes memory coreProbeData) = _boundedStaticCall(
            binding.core, abi.encodeWithSelector(bytes4(0xac1e5708), bytes32(0), address(0)), 4
        );
        if (
            coreProbeOk || coreProbeData.length != 4
                || _leadingSelector(coreProbeData) != NO_EXECUTING_ACTION
        ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        if (
            _readAddress(binding.systemManifestSatellite, bytes4(0xf2f4eb26)) != binding.core
                || _readAddress(binding.systemManifestSatellite, bytes4(0x8fc98386))
                    != address(this)
                || !_supportsInterface(binding.systemManifestSatellite, MANIFEST_INTERFACE_ID)
                || _supportsInterface(binding.systemManifestSatellite, 0xffffffff)
        ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        address priorTarget = address(0);
        bytes4 priorSelector = bytes4(0);
        for (uint256 i = 0; i < binding.expectedTriggers.length; i++) {
            SystemManifestBootstrapTriggerExpectation calldata expected =
                binding.expectedTriggers[i];
            if (
                expected.triggerTarget == address(0) || expected.triggerSelector == bytes4(0)
                    || expected.triggerTarget == address(this)
                    || expected.triggerTarget == binding.roleRegistry
                    || expected.triggerTarget.code.length == 0
                    || _isEIP7702DelegatedEOA(expected.triggerTarget)
                    || expected.triggerTarget.codehash != expected.triggerCodeHash
                    || expected.allowedActionClassMask == 0
                    || (expected.allowedActionClassMask & 0xf0) != 0
                    || (expected.triggerTarget == binding.systemManifestSatellite
                        && expected.triggerSelector == MANIFEST_PUBLISH_SELECTOR)
                    || (i != 0
                        && !_keyLess(
                            priorTarget,
                            priorSelector,
                            expected.triggerTarget,
                            expected.triggerSelector
                        ))
            ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
            priorTarget = expected.triggerTarget;
            priorSelector = expected.triggerSelector;
        }
        bool sawSystemManifestPointerType = false;
        for (uint256 i = 0; i < binding.pointerTypes.length; i++) {
            if (
                binding.pointerTypes[i] == bytes32(0)
                    || (i != 0
                        && uint256(binding.pointerTypes[i - 1]) >= uint256(binding.pointerTypes[i]))
            ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
            if (binding.pointerTypes[i] == SYSTEM_MANIFEST_POINTER_TYPE) {
                sawSystemManifestPointerType = true;
            }
        }
        if (!sawSystemManifestPointerType) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        uint256 currentInventoryLeafCount = binding.pointerTypes.length + binding.registries.length;
        for (uint256 i = 0; i < binding.registries.length; i++) {
            address registry = binding.registries[i];
            if (
                registry.code.length == 0 || _isEIP7702DelegatedEOA(registry)
                    || (i != 0 && uint160(binding.registries[i - 1]) >= uint160(registry))
                    || !_supportsInterface(registry, type(IStreamModuleRegistry).interfaceId)
                    || _supportsInterface(registry, 0xffffffff)
            ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
            uint256 moduleCount = _readModuleCount(registry);
            if (
                moduleCount > MAX_STRICT_REGISTRY_MODULES
                    || moduleCount > binding.expectedInventoryLeafCount - currentInventoryLeafCount
            ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
            currentInventoryLeafCount += moduleCount;
        }
    }

    function requireRoleRegistryOwner(address registry, address expectedOwner) public view {
        if (_readAddress(registry, bytes4(0x8da5cb5b)) != expectedOwner) {
            revert IStreamGovernanceExecutor.InvalidRoleRegistry(registry);
        }
    }

    function computeInventoryState(
        address core,
        bytes32[] memory pointerTypes,
        address[] memory registries
    ) public view returns (bytes32 inventoryStateRoot, uint256 inventoryLeafCount) {
        return _computeInventoryState(core, pointerTypes, registries, address(0), 0, false);
    }

    /// @notice Recomputes the canonical bootstrap inventory while also proving
    ///         that every committed pointer and registry row still describes
    ///         live, ACTIVE code at the irreversible seal boundary.
    /// @dev The ordinary inventory read intentionally remains commitment-only:
    ///      bind and post-seal status reporting must be able to reproduce the
    ///      recorded state even if live code later drifts. Only `prepareSeal`
    ///      calls this strict path.
    function computeAndValidateSealInventory(
        address core,
        bytes32[] memory pointerTypes,
        address[] memory registries,
        address systemManifestSatellite,
        uint256 expectedInventoryLeafCount
    ) public view returns (bytes32 inventoryStateRoot, uint256 inventoryLeafCount) {
        return _computeInventoryState(
            core,
            pointerTypes,
            registries,
            systemManifestSatellite,
            expectedInventoryLeafCount,
            true
        );
    }

    function _computeInventoryState(
        address core,
        bytes32[] memory pointerTypes,
        address[] memory registries,
        address systemManifestSatellite,
        uint256 expectedInventoryLeafCount,
        bool requireLive
    ) private view returns (bytes32 inventoryStateRoot, uint256 inventoryLeafCount) {
        bytes32 inventoryChainHash = bytes32(0);
        uint256 leafIndex = 0;
        bool sawSystemManifestPointer = false;
        // The non-live path never dereferences this context. The live path
        // initializes every array below before the first use.
        // slither-disable-next-line uninitialized-local
        StrictInventoryContext memory strict;
        if (requireLive) {
            strict.pointerTargets = new address[](pointerTypes.length);
            strict.pointerRegistries = new address[](pointerTypes.length);
            strict.pointerRecordHashes = new bytes32[](pointerTypes.length);
            strict.pointerEnumerated = new bool[](pointerTypes.length);
            strict.registryModuleCounts = new uint256[](registries.length);
            _preflightStrictInventory(
                strict, registries, pointerTypes.length, expectedInventoryLeafCount
            );
        }
        for (uint256 i = 0; i < pointerTypes.length; i++) {
            bytes32 pointerType = pointerTypes[i];
            bytes memory data =
                _staticRead(core, abi.encodeWithSelector(bytes4(0x3528d53c), pointerType), 320);
            if (data.length != 320 || !_isCanonicalPointerFactsEncoding(data)) {
                revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
            }
            PointerFacts memory facts = abi.decode(data, (PointerFacts));
            if (keccak256(data) != keccak256(abi.encode(facts))) {
                revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
            }
            if (requireLive) {
                (bool isSystemManifestPointer, bytes32 pointerRecordHash) =
                    _validateLivePointer(pointerType, facts, registries, systemManifestSatellite);
                if (isSystemManifestPointer) {
                    if (sawSystemManifestPointer) {
                        revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
                    }
                    sawSystemManifestPointer = true;
                }
                strict.pointerTargets[i] = facts.target;
                strict.pointerRegistries[i] = facts.registry;
                strict.pointerRecordHashes[i] = pointerRecordHash;
            }
            bytes32 factsHash = _pointerFactsHash(facts);
            inventoryChainHash =
                _appendLeaf(inventoryChainHash, leafIndex, 0, core, pointerType, factsHash);
            leafIndex += 1;
        }
        if (requireLive && !sawSystemManifestPointer) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        for (uint256 i = 0; i < registries.length; i++) {
            (inventoryChainHash, leafIndex) = _appendRegistryInventory(
                registries[i], inventoryChainHash, leafIndex, requireLive, strict, i
            );
        }
        if (requireLive) {
            for (uint256 i = 0; i < strict.pointerEnumerated.length; i++) {
                if (!strict.pointerEnumerated[i]) {
                    revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
                }
            }
        }
        if (leafIndex > type(uint64).max) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 inventoryCount64 = uint64(leafIndex);
        inventoryLeafCount = leafIndex;
        inventoryStateRoot = keccak256(
            abi.encode(
                INVENTORY_ROOT_V1,
                uint256(block.chainid),
                address(this),
                core,
                inventoryCount64,
                inventoryChainHash
            )
        );
    }

    function _appendRegistryInventory(
        address registry,
        bytes32 inventoryChainHash,
        uint256 leafIndex,
        bool requireLive,
        StrictInventoryContext memory strict,
        uint256 registryIndex
    ) private view returns (bytes32, uint256) {
        uint256 moduleCount = requireLive
            ? strict.registryModuleCounts[registryIndex]
            : _readModuleCount(registry);
        bytes32 headerFactsHash = _registryHeaderFactsHash(registry, moduleCount, requireLive);
        inventoryChainHash =
            _appendLeaf(inventoryChainHash, leafIndex, 1, registry, bytes32(0), headerFactsHash);
        leafIndex += 1;
        address[] memory seenModules = new address[](requireLive ? moduleCount : 0);
        for (uint256 moduleIndex = 0; moduleIndex < moduleCount; moduleIndex++) {
            (address module, bytes32 moduleFactsHash, bytes32 moduleRecordHash) =
                _registryModuleFactsHash(registry, moduleIndex, requireLive);
            if (requireLive) {
                for (uint256 priorIndex = 0; priorIndex < moduleIndex; priorIndex++) {
                    if (seenModules[priorIndex] == module) {
                        revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
                    }
                }
                seenModules[moduleIndex] = module;
                for (
                    uint256 pointerIndex = 0;
                    pointerIndex < strict.pointerTargets.length;
                    pointerIndex++
                ) {
                    if (
                        strict.pointerRegistries[pointerIndex] == registry
                            && strict.pointerTargets[pointerIndex] == module
                    ) {
                        if (strict.pointerRecordHashes[pointerIndex] != moduleRecordHash) {
                            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
                        }
                        strict.pointerEnumerated[pointerIndex] = true;
                    }
                }
            }
            inventoryChainHash = _appendLeaf(
                inventoryChainHash, leafIndex, 2, registry, bytes32(moduleIndex), moduleFactsHash
            );
            leafIndex += 1;
        }
        return (inventoryChainHash, leafIndex);
    }

    function _registryHeaderFactsHash(address registry, uint256 moduleCount, bool requireLive)
        private
        view
        returns (bytes32)
    {
        bytes memory chainData = _staticRead(
            registry,
            abi.encodeWithSelector(IStreamModuleRegistry.registrationChainHash.selector),
            64
        );
        if (chainData.length != 64 || !_isCanonicalBytes32Uint64Encoding(chainData)) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        (bytes32 recordChain, uint64 recordCount) = abi.decode(chainData, (bytes32, uint64));
        if (
            keccak256(chainData) != keccak256(abi.encode(recordChain, recordCount))
                || recordCount != moduleCount
        ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        bytes memory manifestData = _staticRead(
            registry,
            abi.encodeWithSelector(IStreamModuleRegistry.moduleRegistryManifest.selector),
            MAX_REGISTRY_MANIFEST_RETURN_BYTES
        );
        if (!_isCanonicalRegistryManifestEncoding(manifestData)) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        (bytes32 manifestHash, string memory manifestURI, uint64 manifestRevision) =
            abi.decode(manifestData, (bytes32, string, uint64));
        if (
            keccak256(manifestData)
                != keccak256(abi.encode(manifestHash, manifestURI, manifestRevision))
        ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        if (
            requireLive
                && (manifestHash == bytes32(0)
                    || bytes(manifestURI).length == 0
                    || bytes(manifestURI).length > MAX_MANIFEST_URI_BYTES
                    || manifestRevision == 0)
        ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        return keccak256(
            abi.encode(
                registry.codehash,
                moduleCount,
                recordChain,
                recordCount,
                manifestHash,
                keccak256(bytes(manifestURI)),
                manifestRevision
            )
        );
    }

    function _registryModuleFactsHash(address registry, uint256 moduleIndex, bool requireLive)
        private
        view
        returns (address module, bytes32 factsHash, bytes32 recordHash)
    {
        bytes memory moduleData = _staticRead(
            registry,
            abi.encodeWithSelector(IStreamModuleRegistry.moduleAt.selector, moduleIndex),
            32
        );
        if (moduleData.length != 32) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        uint256 encodedModule = abi.decode(moduleData, (uint256));
        if (encodedModule > type(uint160).max) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        module = address(uint160(encodedModule));
        ModuleRecord memory record = _readModuleRecord(registry, module);
        if (requireLive) _validateLiveModule(registry, module, record);
        recordHash = keccak256(abi.encode(record));
        factsHash = keccak256(
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

    function _preflightStrictInventory(
        StrictInventoryContext memory strict,
        address[] memory registries,
        uint256 pointerCount,
        uint256 expectedInventoryLeafCount
    ) private view {
        if (pointerCount > MAX_STRICT_POINTERS || registries.length > MAX_STRICT_REGISTRIES) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        uint256 totalLeafCount = pointerCount + registries.length;
        if (totalLeafCount > MAX_STRICT_INVENTORY_LEAVES) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        for (uint256 i = 0; i < registries.length; i++) {
            _validateStrictRegistry(registries[i]);
            uint256 moduleCount = _readModuleCount(registries[i]);
            if (moduleCount > MAX_STRICT_REGISTRY_MODULES) {
                revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
            }
            strict.registryModuleCounts[i] = moduleCount;
            totalLeafCount += moduleCount;
            if (totalLeafCount > MAX_STRICT_INVENTORY_LEAVES) {
                revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
            }
        }
        if (totalLeafCount != expectedInventoryLeafCount) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
    }

    function _validateStrictRegistry(address registry) private view {
        if (
            registry.code.length == 0 || _isEIP7702DelegatedEOA(registry)
                || !_supportsInterface(registry, type(IStreamModuleRegistry).interfaceId)
                || _supportsInterface(registry, 0xffffffff)
        ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
    }

    function _readModuleCount(address registry) private view returns (uint256 moduleCount) {
        bytes memory countData = _staticRead(
            registry, abi.encodeWithSelector(IStreamModuleRegistry.moduleCount.selector), 32
        );
        if (countData.length != 32) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        moduleCount = abi.decode(countData, (uint256));
        if (moduleCount > type(uint64).max) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
    }

    function _pointerFactsHash(PointerFacts memory facts) private pure returns (bytes32) {
        return keccak256(
            bytes.concat(
                abi.encode(
                    facts.target, facts.codeHash, facts.frozen, facts.moduleType, facts.interfaceId
                ),
                abi.encode(
                    facts.registry,
                    facts.registryStatus,
                    facts.moduleManifestHash,
                    facts.deploymentManifestHash,
                    facts.revision
                )
            )
        );
    }

    function _validateLivePointer(
        bytes32 pointerType,
        PointerFacts memory facts,
        address[] memory registries,
        address systemManifestSatellite
    ) private view returns (bool isSystemManifestPointer, bytes32 recordHash) {
        if (
            facts.target == address(0) || facts.target.code.length == 0
                || _isEIP7702DelegatedEOA(facts.target) || facts.codeHash == bytes32(0)
                || facts.target.codehash != facts.codeHash || facts.moduleType == bytes32(0)
                || facts.interfaceId == bytes4(0) || facts.interfaceId == 0xffffffff
                || facts.registry == address(0) || facts.registryStatus != MODULE_STATUS_ACTIVE
                || facts.moduleManifestHash == bytes32(0)
                || facts.deploymentManifestHash == bytes32(0) || facts.revision == 0
                || !_containsRegistry(registries, facts.registry)
                || !_supportsInterface(facts.target, facts.interfaceId)
                || _supportsInterface(facts.target, 0xffffffff)
        ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();

        ModuleRecord memory record = _readModuleRecord(facts.registry, facts.target);
        _validateLiveModule(facts.registry, facts.target, record);
        recordHash = keccak256(abi.encode(record));
        if (
            record.moduleType != facts.moduleType || record.interfaceId != facts.interfaceId
                || record.runtimeCodeHash != facts.codeHash
                || record.moduleManifestHash != facts.moduleManifestHash
                || record.deploymentManifestHash != facts.deploymentManifestHash
        ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();

        isSystemManifestPointer = pointerType == SYSTEM_MANIFEST_POINTER_TYPE;
        if (
            isSystemManifestPointer
                && (facts.target != systemManifestSatellite
                    || !facts.frozen
                    || facts.moduleType != SYSTEM_MANIFEST_MODULE_TYPE
                    || facts.interfaceId != MANIFEST_INTERFACE_ID)
        ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
    }

    function _validateLiveModule(address registry, address module, ModuleRecord memory record)
        private
        view
    {
        if (
            module == address(0) || module.code.length == 0 || _isEIP7702DelegatedEOA(module)
                || record.status != MODULE_STATUS_ACTIVE || record.moduleType == bytes32(0)
                || record.moduleVersion == bytes32(0) || record.interfaceId == bytes4(0)
                || record.interfaceId == 0xffffffff || record.runtimeCodeHash == bytes32(0)
                || module.codehash != record.runtimeCodeHash
                || record.deploymentManifestHash == bytes32(0)
                || record.moduleManifestHash == bytes32(0)
                || bytes(record.moduleManifestURI).length == 0
                || bytes(record.moduleManifestURI).length > MAX_MANIFEST_URI_BYTES
                || record.registeredAt == 0 || record.statusUpdatedAt == 0
                || record.statusUpdatedAt < record.registeredAt || record.revision == 0
                || !_supportsInterface(module, record.interfaceId)
                || _supportsInterface(module, 0xffffffff)
                || !_isModuleEligible(registry, module, record.moduleType, record.interfaceId)
        ) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
    }

    function _readModuleRecord(address registry, address module)
        private
        view
        returns (ModuleRecord memory record)
    {
        bytes memory recordData = _staticRead(
            registry,
            abi.encodeWithSelector(IStreamModuleRegistry.moduleRecord.selector, module),
            MAX_MODULE_RECORD_RETURN_BYTES
        );
        if (!_isCanonicalModuleRecordEncoding(recordData)) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        record = abi.decode(recordData, (ModuleRecord));
        if (keccak256(recordData) != keccak256(abi.encode(record))) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
    }

    function _isModuleEligible(
        address registry,
        address module,
        bytes32 moduleType,
        bytes4 interfaceId
    ) private view returns (bool) {
        bytes memory data = _staticRead(
            registry,
            abi.encodeWithSelector(
                IStreamModuleRegistry.isModuleEligible.selector, module, moduleType, interfaceId
            ),
            32
        );
        if (data.length != 32) return false;
        return abi.decode(data, (uint256)) == 1;
    }

    function _containsRegistry(address[] memory registries, address registry)
        private
        pure
        returns (bool)
    {
        for (uint256 i = 0; i < registries.length; i++) {
            if (registries[i] == registry) return true;
        }
        return false;
    }

    function verifyManifestPayload(address payloadPointer, bytes32 expectedManifestHash)
        public
        view
    {
        uint256 descriptorCodeSize = payloadPointer.code.length;
        if (descriptorCodeSize < 353 || descriptorCodeSize > 3_329) {
            revert IStreamGovernanceExecutor.InvalidManifestTail();
        }
        bytes memory descriptor = SSTORE2.read(payloadPointer);
        uint256 magicWord;
        uint256 schemaVersionWord;
        bytes32 payloadSchemaWord;
        bytes32 canonicalizationWord;
        uint256 totalBytesWord;
        uint256 chunkCountWord;
        uint256 dynamicOffset;
        uint256 encodedChunkCount;
        assembly ("memory-safe") {
            magicWord := mload(add(descriptor, 0x20))
            schemaVersionWord := mload(add(descriptor, 0x40))
            payloadSchemaWord := mload(add(descriptor, 0x60))
            canonicalizationWord := mload(add(descriptor, 0x80))
            totalBytesWord := mload(add(descriptor, 0xa0))
            chunkCountWord := mload(add(descriptor, 0xc0))
            dynamicOffset := mload(add(descriptor, 0xe0))
            encodedChunkCount := mload(add(descriptor, 0x100))
        }
        if (
            bytes32(magicWord) != bytes32(ROOT_MAGIC) || schemaVersionWord != 1
                || payloadSchemaWord != PAYLOAD_V1 || canonicalizationWord != JCS
                || totalBytesWord == 0 || totalBytesWord > 786_400
                || chunkCountWord != encodedChunkCount || dynamicOffset != 224
                || encodedChunkCount == 0 || encodedChunkCount > 32
                || descriptor.length != 256 + 96 * encodedChunkCount
        ) revert IStreamGovernanceExecutor.InvalidManifestTail();
        for (uint256 i = 0; i < encodedChunkCount; i++) {
            uint256 pointerWord;
            uint256 payloadLengthWord;
            assembly ("memory-safe") {
                let entry := add(add(descriptor, 0x120), mul(i, 0x60))
                pointerWord := mload(entry)
                payloadLengthWord := mload(add(entry, 0x20))
            }
            if (
                pointerWord > type(uint160).max || payloadLengthWord == 0
                    || payloadLengthWord > type(uint32).max
            ) revert IStreamGovernanceExecutor.InvalidManifestTail();
        }
        (
            bytes4 magic,
            uint16 schemaVersion,
            bytes32 payloadSchema,
            bytes32 canonicalization,
            uint32 totalBytes,
            uint16 chunkCount,
            ManifestChunk[] memory chunks
        ) = abi.decode(
            descriptor, (bytes4, uint16, bytes32, bytes32, uint32, uint16, ManifestChunk[])
        );
        if (
            magic != ROOT_MAGIC || schemaVersion != 1 || payloadSchema != PAYLOAD_V1
                || canonicalization != JCS || chunkCount == 0 || chunkCount > 32
                || chunks.length != chunkCount || totalBytes == 0 || totalBytes > 786_400
                || descriptor.length != 256 + 96 * uint256(chunkCount)
                || keccak256(descriptor)
                    != keccak256(
                        abi.encode(
                            magic,
                            schemaVersion,
                            payloadSchema,
                            canonicalization,
                            totalBytes,
                            chunkCount,
                            chunks
                        )
                    )
        ) revert IStreamGovernanceExecutor.InvalidManifestTail();
        bytes32[] memory leafHashes = new bytes32[](chunks.length);
        bytes memory scratch = new bytes(SSTORE2.MAX_DATA_LENGTH);
        uint256 observedTotal;
        for (uint256 i = 0; i < chunks.length; i++) {
            ManifestChunk memory chunk = chunks[i];
            if (
                chunk.pointer == address(0) || chunk.payloadLength == 0
                    || chunk.payloadLength > SSTORE2.MAX_DATA_LENGTH
                    || (i + 1 != chunks.length && chunk.payloadLength != SSTORE2.MAX_DATA_LENGTH)
            ) revert IStreamGovernanceExecutor.InvalidManifestTail();
            uint256 codeSize = chunk.pointer.code.length;
            bytes1 prefix;
            bytes32 segmentHash;
            uint256 segmentLength = chunk.payloadLength;
            assembly ("memory-safe") {
                extcodecopy(mload(chunk), add(scratch, 0x20), 0, 1)
                prefix := mload(add(scratch, 0x20))
            }
            if (codeSize != segmentLength + 1 || prefix != bytes1(0)) {
                revert IStreamGovernanceExecutor.InvalidManifestTail();
            }
            assembly ("memory-safe") {
                extcodecopy(mload(chunk), add(scratch, 0x20), 1, segmentLength)
                segmentHash := keccak256(add(scratch, 0x20), segmentLength)
            }
            if (segmentHash != chunk.payloadHash) {
                revert IStreamGovernanceExecutor.InvalidManifestTail();
            }
            observedTotal += segmentLength;
            leafHashes[i] =
                keccak256(abi.encode(PAYLOAD_LEAF_V1, i, chunk.payloadLength, chunk.payloadHash));
        }
        if (
            observedTotal != totalBytes
                || chunkCount
                    != uint16(
                        (uint256(totalBytes) + SSTORE2.MAX_DATA_LENGTH - 1)
                            / SSTORE2.MAX_DATA_LENGTH
                    )
        ) revert IStreamGovernanceExecutor.InvalidManifestTail();
        bytes32 listHash = keccak256(abi.encode(PAYLOAD_LIST_V1, totalBytes, leafHashes));
        if (
            keccak256(
                    abi.encode(
                        PAYLOAD_ROOT_V1,
                        uint16(1),
                        PAYLOAD_V1,
                        JCS,
                        totalBytes,
                        chunkCount,
                        listHash
                    )
                ) != expectedManifestHash
        ) revert IStreamGovernanceExecutor.InvalidManifestTail();
    }

    function _appendLeaf(
        bytes32 priorChainHash,
        uint256 leafIndex,
        uint8 leafKind,
        address leafHost,
        bytes32 leafKey,
        bytes32 leafFactsHash
    ) private pure returns (bytes32) {
        if (leafIndex > type(uint64).max) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 leafIndex64 = uint64(leafIndex);
        bytes32 leafHash =
            keccak256(abi.encode(INVENTORY_LEAF_V1, leafKind, leafHost, leafKey, leafFactsHash));
        return keccak256(abi.encode(INVENTORY_CHAIN_V1, priorChainHash, leafIndex64, leafHash));
    }

    function _readBytes32Uint64(address target, bytes memory callData)
        private
        view
        returns (bytes32 value, uint64 revision)
    {
        bytes memory data = _staticRead(target, callData, 64);
        if (data.length != 64 || !_isCanonicalBytes32Uint64Encoding(data)) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        (value, revision) = abi.decode(data, (bytes32, uint64));
    }

    function _readUint256(address target, bytes memory callData)
        private
        view
        returns (uint256 value)
    {
        bytes memory data = _staticRead(target, callData, 32);
        if (data.length != 32) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        value = abi.decode(data, (uint256));
    }

    function _isCanonicalBytes32Uint64Encoding(bytes memory data)
        private
        pure
        returns (bool valid)
    {
        assembly ("memory-safe") {
            valid := iszero(shr(64, mload(add(data, 0x40))))
        }
    }

    function _isCanonicalPointerFactsEncoding(bytes memory data) private pure returns (bool valid) {
        assembly ("memory-safe") {
            valid := 1
            if shr(160, mload(add(data, 0x20))) { valid := 0 }
            if gt(mload(add(data, 0x60)), 1) { valid := 0 }
            if and(mload(add(data, 0xa0)), sub(shl(224, 1), 1)) { valid := 0 }
            if shr(160, mload(add(data, 0xc0))) { valid := 0 }
            if shr(8, mload(add(data, 0xe0))) { valid := 0 }
            if shr(64, mload(add(data, 0x140))) { valid := 0 }
        }
    }

    function _isCanonicalRegistryManifestEncoding(bytes memory data)
        private
        pure
        returns (bool valid)
    {
        uint256 dataLength = data.length;
        if (dataLength < 128 || dataLength > MAX_REGISTRY_MANIFEST_RETURN_BYTES) return false;
        assembly ("memory-safe") {
            valid := 1
            if iszero(eq(mload(add(data, 0x40)), 0x60)) { valid := 0 }
            if shr(64, mload(add(data, 0x60))) { valid := 0 }
            let stringLength := mload(add(data, 0x80))
            if gt(stringLength, MAX_MANIFEST_URI_BYTES) { valid := 0 }
            if iszero(eq(dataLength, add(0x80, and(add(stringLength, 0x1f), not(0x1f))))) {
                valid := 0
            }
        }
    }

    function _isCanonicalModuleRecordEncoding(bytes memory data) private pure returns (bool valid) {
        uint256 dataLength = data.length;
        if (dataLength < 448 || dataLength > MAX_MODULE_RECORD_RETURN_BYTES) return false;
        assembly ("memory-safe") {
            valid := 1
            if iszero(eq(mload(add(data, 0x20)), 0x20)) { valid := 0 }
            if shr(8, mload(add(data, 0x40))) { valid := 0 }
            if and(mload(add(data, 0xa0)), sub(shl(224, 1), 1)) { valid := 0 }
            if shr(32, mload(add(data, 0xc0))) { valid := 0 }
            if iszero(eq(mload(add(data, 0x140)), 0x180)) { valid := 0 }
            if shr(64, mload(add(data, 0x160))) { valid := 0 }
            if shr(64, mload(add(data, 0x180))) { valid := 0 }
            if shr(64, mload(add(data, 0x1a0))) { valid := 0 }
            let stringLength := mload(add(data, 0x1c0))
            if gt(stringLength, MAX_MANIFEST_URI_BYTES) { valid := 0 }
            if iszero(eq(dataLength, add(0x1c0, and(add(stringLength, 0x1f), not(0x1f))))) {
                valid := 0
            }
        }
    }

    function _staticRead(address target, bytes memory callData, uint256 maxReturnBytes)
        private
        view
        returns (bytes memory data)
    {
        (bool ok, bytes memory returnData) = _boundedStaticCall(target, callData, maxReturnBytes);
        if (!ok) revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        return returnData;
    }

    function _boundedStaticCall(address target, bytes memory callData, uint256 maxReturnBytes)
        private
        view
        returns (bool success, bytes memory returnData)
    {
        assembly ("memory-safe") {
            success := staticcall(gas(), target, add(callData, 0x20), mload(callData), 0x00, 0x00)
            let returnSize := returndatasize()
            if gt(returnSize, maxReturnBytes) {
                success := 0
                returnSize := 0
            }
            returnData := mload(0x40)
            mstore(returnData, returnSize)
            returndatacopy(add(returnData, 0x20), 0x00, returnSize)
            mstore(0x40, and(add(add(returnData, 0x20), add(returnSize, 0x1f)), not(0x1f)))
        }
    }

    function _readAddress(address target, bytes4 selector) private view returns (address value) {
        bytes memory data = _staticRead(target, abi.encodeWithSelector(selector), 32);
        if (data.length != 32) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        uint256 encoded = abi.decode(data, (uint256));
        if (encoded > type(uint160).max) {
            revert IStreamGovernanceExecutor.InvalidSystemManifestBootstrap();
        }
        value = address(uint160(encoded));
    }

    function _supportsInterface(address target, bytes4 interfaceId) private view returns (bool) {
        (bool ok, bytes memory data) = _boundedStaticCall(
            target, abi.encodeWithSelector(bytes4(0x01ffc9a7), interfaceId), 32
        );
        if (!ok || data.length != 32) return false;
        return abi.decode(data, (uint256)) == 1;
    }

    function _isEIP7702DelegatedEOA(address account) private view returns (bool) {
        if (account.code.length != 23) return false;
        bytes3 prefix;
        assembly ("memory-safe") {
            extcodecopy(account, 0, 0, 3)
            prefix := mload(0)
        }
        return prefix == 0xef0100;
    }

    function _keyLess(address lt, bytes4 ls, address rt, bytes4 rs) private pure returns (bool) {
        return uint160(lt) < uint160(rt) || (lt == rt && uint32(ls) < uint32(rs));
    }

    function _leadingSelector(bytes memory data) private pure returns (bytes4 selector) {
        if (data.length < 4) return bytes4(0);
        assembly ("memory-safe") {
            selector := mload(add(data, 0x20))
        }
    }

    function _bytesEqual(bytes memory left, bytes memory right) private pure returns (bool) {
        if (left.length != right.length) return false;
        for (uint256 i = 0; i < left.length; i++) {
            if (left[i] != right[i]) return false;
        }
        return true;
    }
}
