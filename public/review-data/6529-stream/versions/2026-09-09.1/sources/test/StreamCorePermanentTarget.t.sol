// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/interfaces/stream/IStreamEntropyCoordinator.sol";
import "../smart-contracts/interfaces/stream/IStreamMetadataRouter.sol";
import "../smart-contracts/interfaces/stream/IStreamMintManager.sol";
import "../smart-contracts/interfaces/stream/IStreamModuleRegistry.sol";
import "../smart-contracts/core/StreamCore.sol";
import "../smart-contracts/core/StreamCoreExternalReads.sol";
import "./helpers/CharacterizationTestBase.sol";

contract PermanentTargetGovernanceExecutor {
    bool private _executing;
    bytes32 private _actionId;
    uint8 private _actionClass;
    bytes32 private _scopeHash;
    bytes32 private _oldValueHash;
    bytes32 private _newValueHash;

    function currentAction()
        external
        view
        returns (
            bool executing,
            bytes32 actionId,
            uint8 actionClass,
            bytes32 scopeHash,
            bytes32 oldValueHash,
            bytes32 newValueHash
        )
    {
        return (_executing, _actionId, _actionClass, _scopeHash, _oldValueHash, _newValueHash);
    }

    function setAction(
        uint8 actionClass,
        bytes32 scopeHash,
        bytes32 oldValueHash,
        bytes32 newValueHash
    ) external {
        _executing = true;
        _actionId = keccak256(
            abi.encode(
                "StreamCorePermanentTargetTest.action",
                actionClass,
                scopeHash,
                oldValueHash,
                newValueHash
            )
        );
        _actionClass = actionClass;
        _scopeHash = scopeHash;
        _oldValueHash = oldValueHash;
        _newValueHash = newValueHash;
    }

    function execute(address target, bytes calldata callData)
        external
        returns (bytes memory result)
    {
        (bool ok, bytes memory data) = target.call(callData);
        if (!ok) {
            assembly ("memory-safe") {
                revert(add(data, 0x20), mload(data))
            }
        }
        return data;
    }
}

contract PermanentTargetModuleRegistry {
    mapping(address => StreamModuleRecord) private _records;

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IStreamModuleRegistry).interfaceId || interfaceId == 0x01ffc9a7;
    }

    function setRecord(
        address module,
        bytes32 moduleType,
        bytes4 interfaceId,
        bytes32 moduleManifestHash,
        bytes32 deploymentManifestHash
    ) external {
        _records[module] = StreamModuleRecord({
            status: ModuleRegistryStatus.ACTIVE,
            moduleType: moduleType,
            moduleVersion: keccak256("permanent-target-v1"),
            interfaceId: interfaceId,
            moduleGasLimit: 0,
            runtimeCodeHash: module.codehash,
            deploymentManifestHash: deploymentManifestHash,
            moduleManifestHash: moduleManifestHash,
            moduleManifestURI: "ipfs://permanent-target-module",
            registeredAt: 1,
            statusUpdatedAt: 1,
            revision: 1
        });
    }

    function setStatus(address module, ModuleRegistryStatus status) external {
        _records[module].status = status;
    }

    function setRuntimeCodeHash(address module, bytes32 runtimeCodeHash) external {
        _records[module].runtimeCodeHash = runtimeCodeHash;
    }

    function moduleRecord(address module) external view returns (StreamModuleRecord memory) {
        return _records[module];
    }

    function isModuleEligible(address module, bytes32 moduleType, bytes4 interfaceId)
        external
        view
        returns (bool)
    {
        StreamModuleRecord storage record = _records[module];
        return record.status == ModuleRegistryStatus.ACTIVE && record.moduleType == moduleType
            && record.interfaceId == interfaceId && record.runtimeCodeHash == module.codehash;
    }

    function moduleRegistryManifest()
        external
        pure
        returns (bytes32 manifestHash, string memory manifestURI, uint64 revision)
    {
        return (keccak256("permanent-target-registry"), "ipfs://permanent-target-registry", 1);
    }

    function moduleCount() external pure returns (uint256) {
        return 0;
    }

    function moduleAt(uint256) external pure returns (address) {
        return address(0);
    }

    function registrationChainHash() external pure returns (bytes32 chainHash, uint64 recordCount) {
        return (bytes32(0), 0);
    }
}

contract PermanentTargetCoreHarness is StreamCore {
    constructor(
        string memory name_,
        string memory symbol_,
        address governanceExecutor_,
        GenesisModuleRegistryConfig memory genesisRegistry,
        GasParameterGenesisConfig[] memory gasParameters
    ) StreamCore(name_, symbol_, governanceExecutor_, genesisRegistry, gasParameters) { }

    function pointerTransitionHashes(
        bytes32 pointerType,
        StreamCorePointerState memory previous,
        StreamCorePointerState memory candidate
    ) external view returns (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) {
        return StreamCoreExternalReads.pointerTransitionHashes(pointerType, previous, candidate);
    }

    function gasParameterTransitionHashes(
        bytes32 parameterId,
        StreamCoreGasParameterState memory previous,
        StreamCoreGasParameterState memory candidate
    ) external view returns (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) {
        return
            StreamCoreExternalReads.gasParameterTransitionHashes(parameterId, previous, candidate);
    }

    function pointerState(bytes32 pointerType)
        external
        view
        returns (StreamCorePointerState memory pointer)
    {
        (bool ok, bytes memory data) =
            address(this).staticcall(abi.encodeCall(this.getSatellitePointer, (pointerType)));
        require(ok, "pointer read");
        pointer = abi.decode(data, (StreamCorePointerState));
    }
}

contract PermanentTargetMintManager {
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IStreamMintManager).interfaceId || interfaceId == 0x01ffc9a7;
    }

    function mint(
        IStreamCore core,
        uint256 collectionId,
        address recipient,
        bytes calldata tokenData_,
        bytes32 mintCommitment
    ) external returns (uint256 tokenId, uint256 collectionSerial) {
        return core.mintFromManager(
            collectionId, recipient, tokenData_, keccak256(tokenData_), mintCommitment
        );
    }

    function prepare(
        IStreamCore core,
        uint256 collectionId,
        bytes calldata tokenData_,
        bytes32 operationId
    ) external returns (uint256 tokenId, uint256 collectionSerial) {
        return core.prepareMintFromManager(
            collectionId, tokenData_, keccak256(tokenData_), operationId
        );
    }

    function complete(
        IStreamCore core,
        uint256 tokenId,
        address recipient,
        bytes32 operationId,
        bytes32 mintCommitment
    ) external {
        core.completePreparedMintFromManager(tokenId, recipient, operationId, mintCommitment);
    }

    function abort(IStreamCore core, uint256 tokenId, bytes32 operationId) external {
        core.abortPreparedMintFromManager(tokenId, operationId);
    }

    function tryMintWithCoreGas(
        IStreamCore core,
        uint256 coreGas,
        uint256 collectionId,
        address recipient,
        bytes calldata tokenData_,
        bytes32 mintCommitment
    ) external returns (bool success) {
        (success,) = address(core).call{ gas: coreGas }(
            abi.encodeCall(
                core.mintFromManager,
                (collectionId, recipient, tokenData_, keccak256(tokenData_), mintCommitment)
            )
        );
    }
}

contract PermanentTargetEntropyCoordinator is IStreamEntropyCoordinator {
    bool public shouldRevert;
    bool public returnData;
    uint256 public callCount;
    uint256 public entryGas;
    bytes32 public lastCallHash;

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == type(IStreamEntropyCoordinator).interfaceId || interfaceId == 0x01ffc9a7;
    }

    function setBehavior(bool shouldRevert_, bool returnData_) external {
        shouldRevert = shouldRevert_;
        returnData = returnData_;
    }

    function onTokenMinted(
        uint256 collectionId,
        uint256 tokenId,
        address recipient,
        bytes32 mintCommitment
    ) external {
        entryGas = gasleft();
        if (shouldRevert) revert("entropy registration failed");
        ++callCount;
        lastCallHash = keccak256(abi.encode(collectionId, tokenId, recipient, mintCommitment));
        if (returnData) {
            assembly ("memory-safe") {
                mstore(0, 1)
                return(0, 0x20)
            }
        }
    }

    function requestEntropy(uint256)
        external
        payable
        returns (bytes32 requestKey, uint256 providerRequestId)
    {
        return (bytes32(0), 0);
    }

    function registerEntropyScope(uint256, uint8, bytes32) external pure returns (bytes32 scopeId) {
        return bytes32(0);
    }

    function requestScopeEntropy(bytes32, bytes32)
        external
        payable
        returns (bytes32 requestKey, uint256 providerRequestId)
    {
        return (bytes32(0), 0);
    }

    function fulfillEntropy(bytes32, bytes32) external pure returns (uint8 outcome) {
        return 0;
    }
}

contract PermanentTargetMetadataRouter is IStreamMetadataRouter {
    uint8 private _mode;
    string private _tokenValue = "ipfs://permanent-target/token";
    string private _contractValue = "ipfs://permanent-target/contract";

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IStreamMetadataRouter).interfaceId || interfaceId == 0x01ffc9a7;
    }

    function setMode(uint8 mode) external {
        _mode = mode;
    }

    function tokenURI(address, uint256) external view returns (string memory) {
        return _result(_tokenValue);
    }

    function contractURIForCore(address) external view returns (string memory) {
        return _result(_contractValue);
    }

    function contractURIForCollection(address, uint256) external pure returns (string memory) {
        return "";
    }

    function _result(string memory value) private view returns (string memory) {
        if (_mode == 1) revert("router failed");
        if (_mode == 2) {
            assembly ("memory-safe") {
                mstore(0, 0x20)
                return(0, 0x20)
            }
        }
        if (_mode == 3) {
            return string(new bytes(65_500));
        }
        if (_mode == 4) {
            // ABI string head (64 bytes) plus this already word-aligned payload
            // is exactly the 65,536-byte bounded returndata ceiling.
            return string(new bytes(65_472));
        }
        return value;
    }
}

contract StreamCorePermanentTargetTest is CharacterizationTestBase {
    bytes32 private constant _POINTER_MINT_MANAGER =
        0x136326f089f522351128a5fb79275bd12b2d84fe5bb50d5e46c9f5508d6df7e2;
    bytes32 private constant _POINTER_METADATA_ROUTER =
        0x7024d3e2544fc48a261933c43d901dca0ee3fc26ea2b857748ab0c295a16f20a;
    bytes32 private constant _POINTER_ENTROPY_COORDINATOR =
        0xb3b3ef20764c647bdeda70b21ab009ff2783106d6995be14389ec6f42ea6dfbb;
    bytes32 private constant _POINTER_ARTIST_REGISTRY =
        0xaef5244b535c06d7f8e259ec85024ebdfc2d95b38d64f6570dc627a2684749f4;
    bytes32 private constant _POINTER_MODULE_REGISTRY =
        0xde86dd5f33a5b2bd22cfbe7752609f5086a946f705768f7e2e6cb501157a41c4;
    bytes32 private constant _POINTER_ROYALTY_RESOLVER =
        0xafcd60ac064e6f5b3428ca05e721b02c16a658af3989d079e29e38df5fab9c91;

    bytes32 private constant _GGP_ROYALTY_RESOLVER_GAS_LIMIT =
        0x9bae92ab1dd0c5535c65125ea4ee7cff3d55fc31fc2555096c2b5eabceb5bcda;
    bytes32 private constant _GGP_ROYALTY_RETURN_GAS_BUFFER =
        0x0af6f5a1a5059e398191fa0af185be12fee6d609933826603244c7f247793be7;
    bytes32 private constant _GGP_METADATA_ROUTER_GAS_LIMIT =
        0x02ad62929eaa837b9d1704745193125454925fd11a6bf273d7bb1faa23272e93;
    bytes32 private constant _GGP_ENTROPY_REGISTRATION_GAS_LIMIT =
        0x51125071e3dfb233a2711689d4cc377bbda429f1356ebc09a58d763548541e17;

    bytes32 private constant _COLLECTION_SCOPE_DOMAIN =
        0x3a882a22dad9915c9193738f63216234155080ed4c4fc9bfae446e90f1df6e16;
    bytes32 private constant _COLLECTION_STATE_DOMAIN =
        0x854c83f82b7677e58c61a2482a7a430a8318d765d99a95d3fbce5c84be6cc2b5;

    bytes32 private constant _REGISTRY_MANIFEST = keccak256("target.registry.manifest");
    bytes32 private constant _DEPLOYMENT_MANIFEST = keccak256("target.deployment.manifest");
    bytes32 private constant _MODULE_MANIFEST = keccak256("target.module.manifest");
    bytes32 private constant _TOKEN_ROUTE_HASH = keccak256("ipfs://permanent-target/token");
    bytes32 private constant _CONTRACT_ROUTE_HASH = keccak256("ipfs://permanent-target/contract");

    PermanentTargetGovernanceExecutor private _executor;
    PermanentTargetModuleRegistry private _registry;
    PermanentTargetCoreHarness private _core;
    PermanentTargetMintManager private _manager;
    PermanentTargetEntropyCoordinator private _entropy;
    PermanentTargetMetadataRouter private _router;

    function setUp() public {
        _executor = new PermanentTargetGovernanceExecutor();
        _registry = new PermanentTargetModuleRegistry();

        StreamCore.GenesisModuleRegistryConfig memory registryConfig =
            StreamCore.GenesisModuleRegistryConfig({
                registry: address(_registry),
                runtimeCodeHash: address(_registry).codehash,
                moduleManifestHash: _REGISTRY_MANIFEST,
                deploymentManifestHash: _DEPLOYMENT_MANIFEST
            });
        StreamCore.GasParameterGenesisConfig[] memory gasConfigs =
            new StreamCore.GasParameterGenesisConfig[](4);
        gasConfigs[0] = StreamCore.GasParameterGenesisConfig({
            parameterId: _GGP_ROYALTY_RESOLVER_GAS_LIMIT,
            genesisValue: 50_000,
            floor: 25_000,
            failureClass: 1
        });
        gasConfigs[1] = StreamCore.GasParameterGenesisConfig({
            parameterId: _GGP_ROYALTY_RETURN_GAS_BUFFER,
            genesisValue: 2_910_000,
            floor: 1_460_000,
            failureClass: 1
        });
        gasConfigs[2] = StreamCore.GasParameterGenesisConfig({
            parameterId: _GGP_METADATA_ROUTER_GAS_LIMIT,
            genesisValue: 500_000,
            floor: 250_000,
            failureClass: 1
        });
        gasConfigs[3] = StreamCore.GasParameterGenesisConfig({
            parameterId: _GGP_ENTROPY_REGISTRATION_GAS_LIMIT,
            genesisValue: 120_000,
            floor: 120_000,
            failureClass: 2
        });
        _core = new PermanentTargetCoreHarness(
            "6529 Stream", "STREAM", address(_executor), registryConfig, gasConfigs
        );
        _registry.setRecord(
            address(_registry),
            _POINTER_MODULE_REGISTRY,
            type(IStreamModuleRegistry).interfaceId,
            _REGISTRY_MANIFEST,
            _DEPLOYMENT_MANIFEST
        );

        _manager = new PermanentTargetMintManager();
        _entropy = new PermanentTargetEntropyCoordinator();
        _router = new PermanentTargetMetadataRouter();
        _installPointer(
            _POINTER_MINT_MANAGER,
            address(_manager),
            _POINTER_MINT_MANAGER,
            type(IStreamMintManager).interfaceId
        );
        _installPointer(
            _POINTER_ENTROPY_COORDINATOR,
            address(_entropy),
            _POINTER_ENTROPY_COORDINATOR,
            type(IStreamEntropyCoordinator).interfaceId
        );
        _createCollection(2, false, 0, 0);
    }

    function testGenesisPinsAllFourGasRowsAndTargetAbi() public view {
        _assertGasRow(_GGP_ROYALTY_RESOLVER_GAS_LIMIT, 50_000, 25_000, 1);
        _assertGasRow(_GGP_ROYALTY_RETURN_GAS_BUFFER, 2_910_000, 1_460_000, 1);
        _assertGasRow(_GGP_METADATA_ROUTER_GAS_LIMIT, 500_000, 250_000, 1);
        _assertGasRow(_GGP_ENTROPY_REGISTRATION_GAS_LIMIT, 120_000, 120_000, 2);
        require(_core.supportsInterface(0x01ffc9a7), "ERC-165 missing");
        require(_core.supportsInterface(type(IERC2981).interfaceId), "ERC-2981 missing");
        require(_core.supportsInterface(0xe8a3d485), "ERC-7572 missing");
        require(_core.supportsInterface(0xb5c73a01), "recovery interface missing");
    }

    function testMintRegistersEntropyBeforePublishingToken() public {
        bytes memory tokenData_ = abi.encode("permanent target");
        bytes32 mintCommitment = keccak256("mint commitment");
        address recipient = address(0xBEEF);
        (uint256 tokenId, uint256 serial) =
            _manager.mint(_core, 1, recipient, tokenData_, mintCommitment);

        require(tokenId == 1 && serial == 1, "identity allocation");
        require(_core.ownerOf(1) == recipient, "recipient");
        require(_core.totalSupply() == 1, "live supply");
        require(_core.collectionMintedEver(1) == 1, "minted ever");
        require(_core.coordinatorAtMint(1) == address(_entropy), "coordinator pin");
        require(_entropy.callCount() == 1, "entropy call");
        require(
            _entropy.lastCallHash()
                == keccak256(abi.encode(uint256(1), uint256(1), recipient, mintCommitment)),
            "entropy transcript"
        );
        require(_entropy.entryGas() <= 120_000 && _entropy.entryGas() > 118_000, "full stipend");
    }

    function testEntropyFailureRollsBackAllCoreState() public {
        _entropy.setBehavior(true, false);
        vm.expectRevert(abi.encodeWithSelector(StreamCore.EntropyRegistrationFailed.selector));
        _manager.mint(_core, 1, address(this), bytes("rollback"), keccak256("rollback"));

        require(_core.lastAllocatedTokenId() == 0, "token id changed");
        require(_core.collectionNextSerial(1) == 1, "serial changed");
        require(_core.collectionMintedEver(1) == 0, "minted count changed");
        require(_core.totalSupply() == 0, "supply changed");
        require(_entropy.callCount() == 0, "entropy state changed");
    }

    function testEntropyReturnDataFailsClosedAndRollsBack() public {
        _entropy.setBehavior(false, true);
        vm.expectRevert(abi.encodeWithSelector(StreamCore.EntropyRegistrationFailed.selector));
        _manager.mint(_core, 1, address(this), bytes("return-data"), keccak256("return-data"));
        require(_core.lastAllocatedTokenId() == 0, "token id changed");
        require(_core.collectionNextSerial(1) == 1, "serial changed");
        require(_core.totalSupply() == 0, "supply changed");
    }

    function testActualCoreCallBoundaryCoversBelowAtAndAboveWithFullStipend() public {
        bytes memory tokenData_ = bytes("exact admission");
        bytes32 mintCommitment = keccak256("exact admission");
        uint256 low = 250_000;
        uint256 high = 750_000;
        while (low < high) {
            uint256 midpoint = low + (high - low) / 2;
            uint256 snapshotId = vm.snapshotState();
            bool success = _manager.tryMintWithCoreGas(
                _core, midpoint, 1, address(0xBEEF), tokenData_, mintCommitment
            );
            require(vm.revertToState(snapshotId), "snapshot restore");
            if (success) {
                high = midpoint;
            } else {
                low = midpoint + 1;
            }
        }
        uint256 exactThreshold = low;
        bool belowSuccess = _manager.tryMintWithCoreGas(
            _core, exactThreshold - 1, 1, address(0xBEEF), tokenData_, mintCommitment
        );
        require(!belowSuccess, "below exact boundary admitted");

        uint256 aboveSnapshotId = vm.snapshotState();
        bool aboveSuccess = _manager.tryMintWithCoreGas(
            _core, exactThreshold + 1, 1, address(0xBEEF), tokenData_, mintCommitment
        );
        require(aboveSuccess, "just-above exact boundary rejected");
        require(_core.ownerOf(1) == address(0xBEEF), "just-above mint incomplete");
        require(
            _entropy.entryGas() <= 120_000 && _entropy.entryGas() > 118_000,
            "just-above boundary capped stipend"
        );
        require(vm.revertToState(aboveSnapshotId), "above snapshot restore");

        bool atSuccess = _manager.tryMintWithCoreGas(
            _core, exactThreshold, 1, address(0xBEEF), tokenData_, mintCommitment
        );
        require(atSuccess, "exact boundary rejected");
        require(_core.ownerOf(1) == address(0xBEEF), "exact-boundary mint incomplete");
        require(
            _entropy.entryGas() <= 120_000 && _entropy.entryGas() > 118_000,
            "exact boundary capped stipend"
        );
    }

    function testPreparedMintAbortByReplacementManagerRestoresDenseAllocation() public {
        bytes32 operationId = keccak256("prepared operation");
        (uint256 tokenId, uint256 serial) =
            _manager.prepare(_core, 1, bytes("prepared"), operationId);
        require(tokenId == 1 && serial == 1, "prepared identity");

        PermanentTargetMintManager replacement = new PermanentTargetMintManager();
        _installPointer(
            _POINTER_MINT_MANAGER,
            address(replacement),
            _POINTER_MINT_MANAGER,
            type(IStreamMintManager).interfaceId
        );
        vm.expectRevert(
            abi.encodeWithSelector(StreamCore.NotMintManager.selector, address(_manager))
        );
        _manager.abort(_core, tokenId, operationId);

        replacement.abort(_core, tokenId, operationId);
        require(_core.pendingPreparedMintTokenId() == 0, "pending identity");
        require(_core.lastAllocatedTokenId() == 0, "dense token allocation");
        require(_core.collectionNextSerial(1) == 1, "dense collection serial");
        require(_core.tokenLifecycle(tokenId) == uint8(StreamTokenLifecycle.UNKNOWN), "lifecycle");
    }

    function testMetadataRouterSuccessAndEveryFailureFallsBack() public {
        _installPointer(
            _POINTER_METADATA_ROUTER,
            address(_router),
            _POINTER_METADATA_ROUTER,
            type(IStreamMetadataRouter).interfaceId
        );
        _manager.mint(_core, 1, address(0xBEEF), bytes("metadata"), keccak256("metadata"));

        require(
            keccak256(bytes(_core.tokenURI(1)))
                == keccak256(bytes("ipfs://permanent-target/token")),
            "token route"
        );
        require(
            keccak256(bytes(_core.contractURI()))
                == keccak256(bytes("ipfs://permanent-target/contract")),
            "contract route"
        );
        _router.setMode(1);
        bytes32 revertingHash = keccak256(bytes(_core.tokenURI(1)));
        _router.setMode(2);
        bytes32 malformedHash = keccak256(bytes(_core.tokenURI(1)));
        _router.setMode(3);
        bytes32 oversizedHash = keccak256(bytes(_core.tokenURI(1)));
        require(revertingHash != bytes32(0), "empty reverting fallback");
        require(malformedHash != bytes32(0), "empty malformed fallback");
        require(oversizedHash != bytes32(0), "empty oversized fallback");
        require(revertingHash != malformedHash, "failure classes collapsed");
        require(malformedHash != oversizedHash, "failure classes collapsed");
    }

    function testMetadataRouterMaximumBoundedReturnCompletes() public {
        _installPointer(
            _POINTER_METADATA_ROUTER,
            address(_router),
            _POINTER_METADATA_ROUTER,
            type(IStreamMetadataRouter).interfaceId
        );
        _manager.mint(
            _core, 1, address(0xBEEF), bytes("maximum metadata"), keccak256("maximum metadata")
        );
        _router.setMode(4);

        require(bytes(_core.tokenURI(1)).length == 65_472, "maximum token return");
        require(bytes(_core.contractURI()).length == 65_472, "maximum contract return");
    }

    function testActualCoreTokenUriBoundaryRejectsBelowAndRoutesAtAndAbove() public {
        _installPointer(
            _POINTER_METADATA_ROUTER,
            address(_router),
            _POINTER_METADATA_ROUTER,
            type(IStreamMetadataRouter).interfaceId
        );
        _manager.mint(
            _core, 1, address(0xBEEF), bytes("token boundary"), keccak256("token boundary")
        );

        uint256 exactThreshold = _minimumMetadataReadGas(false);
        require(!_metadataRouteAtGas(false, exactThreshold - 1), "token below boundary routed");
        require(_metadataRouteAtGas(false, exactThreshold), "token exact boundary failed");
        require(_metadataRouteAtGas(false, exactThreshold + 1), "token above boundary failed");
    }

    function testActualCoreContractUriBoundaryRejectsBelowAndRoutesAtAndAbove() public {
        _installPointer(
            _POINTER_METADATA_ROUTER,
            address(_router),
            _POINTER_METADATA_ROUTER,
            type(IStreamMetadataRouter).interfaceId
        );

        uint256 exactThreshold = _minimumMetadataReadGas(true);
        require(!_metadataRouteAtGas(true, exactThreshold - 1), "contract below boundary routed");
        require(_metadataRouteAtGas(true, exactThreshold), "contract exact boundary failed");
        require(_metadataRouteAtGas(true, exactThreshold + 1), "contract above boundary failed");
    }

    function testPointerAuthenticationRejectsRegistryStatusAndCodehashDrift() public {
        PermanentTargetMetadataRouter candidate = new PermanentTargetMetadataRouter();
        _registry.setRecord(
            address(candidate),
            _POINTER_METADATA_ROUTER,
            type(IStreamMetadataRouter).interfaceId,
            _MODULE_MANIFEST,
            _DEPLOYMENT_MANIFEST
        );
        _registry.setStatus(address(candidate), ModuleRegistryStatus.DEPRECATED);
        _expectInvalidPointerUpdate(_POINTER_METADATA_ROUTER, address(candidate));

        _registry.setStatus(address(candidate), ModuleRegistryStatus.ACTIVE);
        _registry.setRuntimeCodeHash(address(candidate), keccak256("wrong codehash"));
        _expectInvalidPointerUpdate(_POINTER_METADATA_ROUTER, address(candidate));
    }

    function testUnresolvedArtistAndRoyaltyInterfacesCannotBeInstalled() public {
        PermanentTargetMetadataRouter candidate = new PermanentTargetMetadataRouter();
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.SatellitePointerInterfaceUnresolved.selector, _POINTER_ARTIST_REGISTRY
            )
        );
        _executor.execute(
            address(_core),
            abi.encodeCall(
                _core.updateSatellitePointer, (_POINTER_ARTIST_REGISTRY, address(candidate))
            )
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.SatellitePointerInterfaceUnresolved.selector, _POINTER_ROYALTY_RESOLVER
            )
        );
        _executor.execute(
            address(_core),
            abi.encodeCall(
                _core.updateSatellitePointer, (_POINTER_ROYALTY_RESOLVER, address(candidate))
            )
        );
    }

    function testGasRaiseRequiresExactBoundActionAndAtMostDouble() public {
        (uint256 oldValue, uint256 floor, uint8 failureClass, uint64 revision) =
            _core.gasParameterInfo(_GGP_ENTROPY_REGISTRATION_GAS_LIMIT);
        StreamCoreGasParameterState memory oldState =
            StreamCoreGasParameterState(oldValue, floor, failureClass, revision);
        StreamCoreGasParameterState memory nextState =
            StreamCoreGasParameterState(200_000, floor, failureClass, revision + 1);
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) = _core.gasParameterTransitionHashes(
            _GGP_ENTROPY_REGISTRATION_GAS_LIMIT, oldState, nextState
        );
        _executor.setAction(1, scopeHash, oldValueHash, newValueHash);
        _executor.execute(
            address(_core),
            abi.encodeCall(_core.raiseGasParameter, (_GGP_ENTROPY_REGISTRATION_GAS_LIMIT, 200_000))
        );
        (uint256 value,,, uint64 nextRevision) =
            _core.gasParameterInfo(_GGP_ENTROPY_REGISTRATION_GAS_LIMIT);
        require(value == 200_000 && nextRevision == 2, "raise not stored");

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.GasParameterTransitionInvalid.selector,
                _GGP_ENTROPY_REGISTRATION_GAS_LIMIT
            )
        );
        _executor.execute(
            address(_core),
            abi.encodeCall(_core.raiseGasParameter, (_GGP_ENTROPY_REGISTRATION_GAS_LIMIT, 400_001))
        );
    }

    function _installPointer(
        bytes32 pointerType,
        address target,
        bytes32 moduleType,
        bytes4 interfaceId
    ) private {
        _registry.setRecord(target, moduleType, interfaceId, _MODULE_MANIFEST, _DEPLOYMENT_MANIFEST);
        _updatePointerWithCandidate(pointerType, target);
    }

    function _updatePointerWithCandidate(bytes32 pointerType, address target) private {
        StreamCorePointerState memory previous = _pointerState(pointerType);
        StreamModuleRecord memory record = _registry.moduleRecord(target);
        StreamCorePointerState memory candidate = StreamCorePointerState({
            target: target,
            codeHash: target.codehash,
            frozen: false,
            moduleType: record.moduleType,
            interfaceId: record.interfaceId,
            registry: address(_registry),
            registryStatus: uint8(record.status),
            moduleManifestHash: record.moduleManifestHash,
            deploymentManifestHash: record.deploymentManifestHash,
            revision: previous.revision + 1
        });
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _core.pointerTransitionHashes(pointerType, previous, candidate);
        _executor.setAction(3, scopeHash, oldValueHash, newValueHash);
        _executor.execute(
            address(_core), abi.encodeCall(_core.updateSatellitePointer, (pointerType, target))
        );
    }

    function _expectInvalidPointerUpdate(bytes32 pointerType, address target) private {
        StreamCorePointerState memory previous = _pointerState(pointerType);
        StreamModuleRecord memory record = _registry.moduleRecord(target);
        StreamCorePointerState memory candidate = StreamCorePointerState({
            target: target,
            codeHash: target.codehash,
            frozen: false,
            moduleType: record.moduleType,
            interfaceId: record.interfaceId,
            registry: address(_registry),
            registryStatus: uint8(record.status),
            moduleManifestHash: record.moduleManifestHash,
            deploymentManifestHash: record.deploymentManifestHash,
            revision: previous.revision + 1
        });
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _core.pointerTransitionHashes(pointerType, previous, candidate);
        _executor.setAction(3, scopeHash, oldValueHash, newValueHash);
        vm.expectRevert(
            abi.encodeWithSelector(StreamCore.InvalidSatellitePointer.selector, pointerType, target)
        );
        _executor.execute(
            address(_core), abi.encodeCall(_core.updateSatellitePointer, (pointerType, target))
        );
    }

    function _pointerState(bytes32 pointerType)
        private
        view
        returns (StreamCorePointerState memory pointer)
    {
        return _core.pointerState(pointerType);
    }

    function _minimumMetadataReadGas(bool contractRead) private view returns (uint256 threshold) {
        uint256 low = 3_000_000;
        uint256 high = 4_500_000;
        require(_metadataRouteAtGas(contractRead, high), "metadata search ceiling");
        while (low < high) {
            uint256 midpoint = low + (high - low) / 2;
            if (_metadataRouteAtGas(contractRead, midpoint)) {
                high = midpoint;
            } else {
                low = midpoint + 1;
            }
        }
        threshold = low;
    }

    function _metadataRouteAtGas(bool contractRead, uint256 coreGas)
        private
        view
        returns (bool routed)
    {
        bytes memory callData = contractRead
            ? abi.encodeCall(_core.contractURI, ())
            : abi.encodeCall(_core.tokenURI, (uint256(1)));
        (bool ok, bytes memory result) = address(_core).staticcall{ gas: coreGas }(callData);
        if (!ok || result.length < 96) return false;
        string memory value = abi.decode(result, (string));
        bytes32 expected = contractRead ? _CONTRACT_ROUTE_HASH : _TOKEN_ROUTE_HASH;
        return keccak256(bytes(value)) == expected;
    }

    function _createCollection(
        uint8 supplyMode,
        bool hasMaxSupply,
        uint256 maxSupply,
        uint8 initialStatus
    ) private {
        uint256 collectionId = _core.lastAllocatedCollectionId() + 1;
        bytes32 scopeHash = keccak256(
            abi.encode(
                _COLLECTION_SCOPE_DOMAIN, uint256(block.chainid), address(_core), collectionId
            )
        );
        bytes32 oldValueHash = keccak256(
            abi.encode(
                _COLLECTION_STATE_DOMAIN, scopeHash, false, uint8(0), uint8(0), false, uint256(0)
            )
        );
        bytes32 newValueHash = keccak256(
            abi.encode(
                _COLLECTION_STATE_DOMAIN,
                scopeHash,
                true,
                supplyMode,
                initialStatus,
                hasMaxSupply,
                maxSupply
            )
        );
        _executor.setAction(1, scopeHash, oldValueHash, newValueHash);
        _executor.execute(
            address(_core),
            abi.encodeCall(
                _core.createCollection, (supplyMode, hasMaxSupply, maxSupply, initialStatus)
            )
        );
    }

    function _assertGasRow(
        bytes32 parameterId,
        uint256 expectedValue,
        uint256 expectedFloor,
        uint8 expectedFailureClass
    ) private view {
        (uint256 value, uint256 floor, uint8 failureClass, uint64 revision) =
            _core.gasParameterInfo(parameterId);
        require(value == expectedValue, "gas value");
        require(floor == expectedFloor, "gas floor");
        require(failureClass == expectedFailureClass, "failure class");
        require(revision == 1, "gas revision");
    }
}
