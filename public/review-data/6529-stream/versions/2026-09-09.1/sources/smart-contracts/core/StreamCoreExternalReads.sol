// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../vendor/openzeppelin/IERC165.sol";
import "../interfaces/stream/IStreamArtworkFinalityRegistry.sol";
import "../interfaces/stream/IStreamCollectionMetadata.sol";
import "../interfaces/stream/IStreamEntropyCoordinator.sol";
import "../interfaces/stream/IStreamMetadataRouter.sol";
import "../interfaces/stream/IStreamMintLedger.sol";
import "../interfaces/stream/IStreamMintManager.sol";
import "../interfaces/stream/IStreamModuleRegistry.sol";
import "../interfaces/stream/IStreamSystemManifest.sol";
import "./StreamCoreReadBuffer.sol";

enum StreamCoreValidationStatus {
    VALID,
    INVALID_REGISTRY,
    INVALID_TARGET,
    UNKNOWN_POINTER,
    UNRESOLVED_INTERFACE,
    INVALID_RECORD
}

struct StreamCorePointerState {
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

struct StreamCoreGasParameterState {
    uint256 value;
    uint256 floor;
    uint8 failureClass;
    uint64 revision;
}

struct StreamCorePointerTransitionPlan {
    StreamCorePointerState candidate;
    bytes32 scopeHash;
    bytes32 oldValueHash;
    bytes32 preRevisionCandidateHash;
    bytes32 newValueHash;
}

/// @notice Bounded, fail-closed external reads used by StreamCore.
/// @dev The linked library owns no storage and makes no authorization or state-transition
///      decisions. It validates exact returndata shapes before returning compact facts to Core.
library StreamCoreExternalReads {
    uint8 private constant _MODULE_STATUS_ACTIVE = 1;
    bytes32 private constant _STREAM_CORE_SATELLITE_POINTER_SCOPE_V1 =
        0xf4a381d3d4c51db07c19830799ea01c544326118ea1db1fb59d54af5f637bdbb;
    bytes32 private constant _STREAM_CORE_SATELLITE_POINTER_STATE_V1 =
        0x1fdde0a7122d0fc7c237e721e372e43082581dcc6bd2babca4e09bb1e6b3d043;
    bytes32 private constant _STREAM_GAS_PARAMETER_SCOPE_V2 =
        0x9533611d402c2b44cf950a4a8900d25f6829bfac541dc4d5353094f966bb1a71;
    bytes32 private constant _STREAM_GAS_PARAMETER_STATE_V2 =
        0x5059a253d3f7dd63b5d9fd1f0568caf72967f501a3db678b31cefe911334159c;

    bytes32 private constant _POINTER_SYSTEM_MANIFEST =
        0x03f4d9e115b9c4c43ab58684ef44935e7cf92d54b8db1d97a707c8526faa3c1b;
    bytes32 private constant _POINTER_STATE_EXPORT_PUBLISHER =
        0x03f5dfc0687afbbc9c86bda58667bf3bb235a2d1cbe7273bbbe4d5301fb0b6d2;
    bytes32 private constant _POINTER_MINT_MANAGER =
        0x136326f089f522351128a5fb79275bd12b2d84fe5bb50d5e46c9f5508d6df7e2;
    bytes32 private constant _POINTER_METADATA_ROUTER =
        0x7024d3e2544fc48a261933c43d901dca0ee3fc26ea2b857748ab0c295a16f20a;
    bytes32 private constant _POINTER_ARTIST_REGISTRY =
        0xaef5244b535c06d7f8e259ec85024ebdfc2d95b38d64f6570dc627a2684749f4;
    bytes32 private constant _POINTER_ARTWORK_FINALITY_RECOVERY =
        0xead6d91d79d13e47343aa9d24c2198c5e4fcd612fdd9531d8b2549bab7651474;
    bytes32 private constant _POINTER_ROYALTY_RESOLVER =
        0xafcd60ac064e6f5b3428ca05e721b02c16a658af3989d079e29e38df5fab9c91;
    bytes32 private constant _POINTER_ENTROPY_COORDINATOR =
        0xb3b3ef20764c647bdeda70b21ab009ff2783106d6995be14389ec6f42ea6dfbb;
    bytes32 private constant _POINTER_ARTWORK_FINALITY_REGISTRY =
        0xd43cf73a122b502fe5e16c9100883f4371b93df4467921d97b4e220819fb8ebe;
    bytes32 private constant _POINTER_COLLECTION_METADATA =
        0xd90b9e0160ba8e56a77078d6022d52bf0cd862ba5a5adfb6f792287e31399f90;
    bytes32 private constant _POINTER_MODULE_REGISTRY =
        0xde86dd5f33a5b2bd22cfbe7752609f5086a946f705768f7e2e6cb501157a41c4;
    bytes32 private constant _POINTER_MINT_LEDGER =
        0xe5dd56591e517e4085238d3b93e69c570fcfba756eed59ca2c4e234606e661cd;

    bytes32 private constant _MODULE_STREAM_SYSTEM_MANIFEST =
        0x47fd79d5a6e9b1d75dcedf141a46e2e8f6d95d5a5be2b88f197fa98a1436fec6;
    bytes32 private constant _MODULE_GOVERNANCE_LAYER =
        0xa79066eedc862e1122885d62af037de32376da824a17eceb77f7332aef89ce4e;
    bytes32 private constant _MODULE_REVENUE_RESOLVER =
        0x217d16181cfb7c9bb7e1687d0b13ef4b864e9154dc37b60f75a88bec454b5467;
    bytes32 private constant _MODULE_ARTWORK_FINALITY_RECOVERY =
        0x50e132608386d4b0bf237635eb7bfd9473f667085fa7d7b18f81c5045c289050;
    bytes4 private constant _INTERFACE_STATE_EXPORT_PUBLISHER = 0x77faad4f;
    bytes4 private constant _INTERFACE_ARTWORK_FINALITY_RECOVERY = 0x83685f5c;

    uint256 private constant _MAX_MODULE_RECORD_RETURNDATA = 2_496;
    uint256 private constant _MAX_MODULE_MANIFEST_URI_BYTES = 2_048;
    uint256 private constant _MAX_ROUTER_RETURNDATA = 65_536;
    uint256 private constant _MAX_ROYALTY_BPS = 1_000;
    uint256 private constant _ROYALTY_DENOMINATOR = 10_000;

    bytes4 private constant _CURRENT_ACTION_SELECTOR = bytes4(keccak256("currentAction()"));

    struct CurrentAction {
        bool executing;
        bytes32 actionId;
        uint8 actionClass;
        bytes32 scopeHash;
        bytes32 oldValueHash;
        bytes32 newValueHash;
    }

    struct ModuleRecordFacts {
        uint8 status;
        bytes32 moduleType;
        bytes32 moduleVersion;
        bytes4 interfaceId;
        bytes32 runtimeCodeHash;
        bytes32 deploymentManifestHash;
        bytes32 moduleManifestHash;
        uint64 revision;
    }

    function pointerConfiguration(bytes32 pointerType, address target, address governanceExecutor)
        public
        pure
        returns (bool known, bytes32 moduleType, bytes4 interfaceId)
    {
        if (pointerType == _POINTER_SYSTEM_MANIFEST) {
            return (true, _MODULE_STREAM_SYSTEM_MANIFEST, type(IStreamSystemManifest).interfaceId);
        }
        if (pointerType == _POINTER_STATE_EXPORT_PUBLISHER) {
            moduleType = target == governanceExecutor ? _MODULE_GOVERNANCE_LAYER : pointerType;
            return (true, moduleType, _INTERFACE_STATE_EXPORT_PUBLISHER);
        }
        if (pointerType == _POINTER_MINT_MANAGER) {
            return (true, pointerType, type(IStreamMintManager).interfaceId);
        }
        if (pointerType == _POINTER_METADATA_ROUTER) {
            return (true, pointerType, type(IStreamMetadataRouter).interfaceId);
        }
        if (pointerType == _POINTER_ARTIST_REGISTRY) {
            return (true, pointerType, bytes4(0));
        }
        if (pointerType == _POINTER_ARTWORK_FINALITY_RECOVERY) {
            return (true, _MODULE_ARTWORK_FINALITY_RECOVERY, _INTERFACE_ARTWORK_FINALITY_RECOVERY);
        }
        if (pointerType == _POINTER_ROYALTY_RESOLVER) {
            return (true, _MODULE_REVENUE_RESOLVER, bytes4(0));
        }
        if (pointerType == _POINTER_ENTROPY_COORDINATOR) {
            return (true, pointerType, type(IStreamEntropyCoordinator).interfaceId);
        }
        if (pointerType == _POINTER_ARTWORK_FINALITY_REGISTRY) {
            return (true, pointerType, type(IStreamArtworkFinalityRegistry).interfaceId);
        }
        if (pointerType == _POINTER_COLLECTION_METADATA) {
            return (true, pointerType, type(IStreamCollectionMetadata).interfaceId);
        }
        if (pointerType == _POINTER_MODULE_REGISTRY) {
            return (true, pointerType, type(IStreamModuleRegistry).interfaceId);
        }
        if (pointerType == _POINTER_MINT_LEDGER) {
            return (true, pointerType, type(IStreamMintLedger).interfaceId);
        }
    }

    function genesisModuleRegistry(
        address registry,
        bytes32 runtimeCodeHash,
        bytes32 moduleManifestHash,
        bytes32 deploymentManifestHash
    ) public view returns (bool valid, StreamCorePointerState memory pointer) {
        if (
            !_isValidContract(registry) || runtimeCodeHash == bytes32(0)
                || registry.codehash != runtimeCodeHash || moduleManifestHash == bytes32(0)
                || deploymentManifestHash == bytes32(0)
                || !supportsInterfaceStrict(registry, type(IStreamModuleRegistry).interfaceId)
        ) {
            return (false, pointer);
        }
        pointer = StreamCorePointerState({
            target: registry,
            codeHash: runtimeCodeHash,
            frozen: false,
            moduleType: _POINTER_MODULE_REGISTRY,
            interfaceId: type(IStreamModuleRegistry).interfaceId,
            registry: registry,
            registryStatus: _MODULE_STATUS_ACTIVE,
            moduleManifestHash: moduleManifestHash,
            deploymentManifestHash: deploymentManifestHash,
            revision: 1
        });
        return (true, pointer);
    }

    function eligiblePointer(
        StreamCorePointerState memory registryPointer,
        address target,
        bytes32 expectedModuleType,
        bytes4 expectedInterfaceId
    )
        public
        view
        returns (StreamCoreValidationStatus status, StreamCorePointerState memory candidate)
    {
        if (!_isValidContract(target)) {
            return (StreamCoreValidationStatus.INVALID_TARGET, candidate);
        }
        if (!_isLiveModuleRegistry(registryPointer)) {
            return (StreamCoreValidationStatus.INVALID_REGISTRY, candidate);
        }
        (bool recordValid, ModuleRecordFacts memory record) =
            readModuleRecord(registryPointer.target, target);
        if (!recordValid) {
            return (StreamCoreValidationStatus.INVALID_REGISTRY, candidate);
        }
        bytes32 runtimeCodeHash = target.codehash;
        if (!_isEligibleModule(
                record, target, runtimeCodeHash, expectedModuleType, expectedInterfaceId
            )) {
            return (StreamCoreValidationStatus.INVALID_TARGET, candidate);
        }
        candidate = StreamCorePointerState({
            target: target,
            codeHash: runtimeCodeHash,
            frozen: false,
            moduleType: record.moduleType,
            interfaceId: record.interfaceId,
            registry: registryPointer.target,
            registryStatus: record.status,
            moduleManifestHash: record.moduleManifestHash,
            deploymentManifestHash: record.deploymentManifestHash,
            revision: 0
        });
        return (StreamCoreValidationStatus.VALID, candidate);
    }

    function preparePointerUpdate(
        StreamCorePointerState memory registryPointer,
        StreamCorePointerState memory current,
        bytes32 pointerType,
        address target,
        address governanceExecutor,
        uint64 nextRevision
    )
        public
        view
        returns (StreamCoreValidationStatus status, StreamCorePointerTransitionPlan memory plan)
    {
        bool known;
        bytes32 expectedModuleType;
        bytes4 expectedInterfaceId;
        (known, expectedModuleType, expectedInterfaceId) =
            pointerConfiguration(pointerType, target, governanceExecutor);
        if (!known) return (StreamCoreValidationStatus.UNKNOWN_POINTER, plan);
        if (expectedInterfaceId == bytes4(0)) {
            return (StreamCoreValidationStatus.UNRESOLVED_INTERFACE, plan);
        }
        (status, plan.candidate) =
            eligiblePointer(registryPointer, target, expectedModuleType, expectedInterfaceId);
        if (status != StreamCoreValidationStatus.VALID) return (status, plan);

        plan.candidate.revision = nextRevision;
        (plan.scopeHash, plan.oldValueHash, plan.newValueHash) =
            pointerTransitionHashes(pointerType, current, plan.candidate);
        plan.preRevisionCandidateHash =
            pointerStateHash(plan.scopeHash, plan.candidate, current.revision);
    }

    function isLiveModuleRegistry(StreamCorePointerState memory pointer)
        public
        view
        returns (bool)
    {
        return _isLiveModuleRegistry(pointer);
    }

    function pointerScopeHash(bytes32 pointerType) public view returns (bytes32) {
        return keccak256(
            abi.encode(
                _STREAM_CORE_SATELLITE_POINTER_SCOPE_V1,
                uint256(block.chainid),
                address(this),
                pointerType
            )
        );
    }

    function pointerStateHash(
        bytes32 scopeHash,
        StreamCorePointerState memory pointer,
        uint64 revision
    ) public pure returns (bytes32) {
        return keccak256(
            abi.encode(
                _STREAM_CORE_SATELLITE_POINTER_STATE_V1,
                scopeHash,
                pointer.target,
                pointer.codeHash,
                pointer.frozen,
                pointer.moduleType,
                pointer.interfaceId,
                pointer.registry,
                pointer.registryStatus,
                pointer.moduleManifestHash,
                pointer.deploymentManifestHash,
                revision
            )
        );
    }

    function pointerTransitionHashes(
        bytes32 pointerType,
        StreamCorePointerState memory previous,
        StreamCorePointerState memory candidate
    ) public view returns (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) {
        scopeHash = pointerScopeHash(pointerType);
        oldValueHash = pointerStateHash(scopeHash, previous, previous.revision);
        newValueHash = pointerStateHash(scopeHash, candidate, candidate.revision);
    }

    function gasParameterScopeHash(bytes32 parameterId) public view returns (bytes32) {
        return keccak256(
            abi.encode(
                _STREAM_GAS_PARAMETER_SCOPE_V2, uint256(block.chainid), address(this), parameterId
            )
        );
    }

    function gasParameterStateHash(bytes32 scopeHash, StreamCoreGasParameterState memory parameter)
        public
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                _STREAM_GAS_PARAMETER_STATE_V2,
                scopeHash,
                parameter.value,
                parameter.floor,
                parameter.failureClass,
                parameter.revision
            )
        );
    }

    function gasParameterTransitionHashes(
        bytes32 parameterId,
        StreamCoreGasParameterState memory previous,
        StreamCoreGasParameterState memory candidate
    ) public view returns (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) {
        scopeHash = gasParameterScopeHash(parameterId);
        oldValueHash = gasParameterStateHash(scopeHash, previous);
        newValueHash = gasParameterStateHash(scopeHash, candidate);
    }

    function isGovernanceExecutor(address executor) public view returns (bool) {
        if (!_isValidContract(executor)) return false;
        (bool valid,) = readCurrentAction(executor);
        return valid;
    }

    function codeIsLive(address target, bytes32 codeHash) public view returns (bool) {
        return _codeIsLive(target, codeHash);
    }

    function readCurrentAction(address executor)
        public
        view
        returns (bool valid, CurrentAction memory action)
    {
        (bool ok, bytes memory data) =
            _boundedStaticRead(executor, abi.encodeWithSelector(_CURRENT_ACTION_SELECTOR), 192);
        if (!ok || data.length != 192 || !_isCanonicalCurrentAction(data)) {
            return (false, action);
        }
        (
            action.executing,
            action.actionId,
            action.actionClass,
            action.scopeHash,
            action.oldValueHash,
            action.newValueHash
        ) = abi.decode(data, (bool, bytes32, uint8, bytes32, bytes32, bytes32));
        return (true, action);
    }

    function readModuleRecord(address registry, address module)
        public
        view
        returns (bool valid, ModuleRecordFacts memory facts)
    {
        (bool ok, bytes memory data) = _boundedStaticRead(
            registry,
            abi.encodeWithSelector(IStreamModuleRegistry.moduleRecord.selector, module),
            _MAX_MODULE_RECORD_RETURNDATA
        );
        if (!ok || !_isCanonicalModuleRecordEncoding(data)) return (false, facts);

        StreamModuleRecord memory record = abi.decode(data, (StreamModuleRecord));
        uint256 uriLength = bytes(record.moduleManifestURI).length;
        if (
            keccak256(data) != keccak256(abi.encode(record)) || uriLength == 0
                || uriLength > _MAX_MODULE_MANIFEST_URI_BYTES
        ) {
            return (false, facts);
        }
        facts = ModuleRecordFacts({
            status: uint8(record.status),
            moduleType: record.moduleType,
            moduleVersion: record.moduleVersion,
            interfaceId: record.interfaceId,
            runtimeCodeHash: record.runtimeCodeHash,
            deploymentManifestHash: record.deploymentManifestHash,
            moduleManifestHash: record.moduleManifestHash,
            revision: record.revision
        });
        return (true, facts);
    }

    /// @notice Calls a metadata router with governed gas and bounded returndata.
    /// @dev The embedding Core supplies authenticated live GGP values. Malformed,
    ///      failed, and oversized responses return a status instead of reverting.
    function boundedRouterString(
        address target,
        bytes memory callData,
        uint256 gasLimit,
        uint256 completionBuffer
    ) public view returns (uint8 status, string memory value) {
        if (!StreamCoreReadBuffer.hasSufficientParentGas(gasleft(), gasLimit, completionBuffer)) {
            return (StreamCoreReadBuffer.READ_CALL_FAILED, "");
        }
        (bool ok, bool oversized, bytes memory data) =
            _boundedStaticReadDetailed(target, callData, _MAX_ROUTER_RETURNDATA, gasLimit);
        if (oversized) return (StreamCoreReadBuffer.READ_RETURNDATA_OVERSIZED, "");
        if (!ok) return (StreamCoreReadBuffer.READ_CALL_FAILED, "");
        return StreamCoreReadBuffer.decodeRequiredString(data);
    }

    /// @notice Resolves a royalty through a governed, buffered, exact-shape static read.
    /// @dev Invalid responses fail soft to the ERC-2981 zero-royalty tuple.
    function resolveRoyalty(
        address target,
        uint256 gasLimit,
        uint256 completionBuffer,
        bytes memory callData,
        uint256 salePrice
    ) public view returns (address receiver, uint256 royaltyAmount) {
        if (!StreamCoreReadBuffer.hasSufficientParentGas(gasleft(), gasLimit, completionBuffer)) {
            return (address(0), 0);
        }
        bool ok;
        bytes32 receiverWord;
        bytes32 bpsWord;
        uint256 returnSize;
        assembly ("memory-safe") {
            ok := staticcall(gasLimit, target, add(callData, 0x20), mload(callData), 0, 0)
            returnSize := returndatasize()
            if eq(returnSize, 0x40) {
                returndatacopy(0, 0, 0x40)
                receiverWord := mload(0)
                bpsWord := mload(0x20)
            }
        }
        if (
            !ok || returnSize != 64 || uint256(receiverWord) >> 160 != 0
                || uint256(bpsWord) > type(uint16).max
        ) {
            return (address(0), 0);
        }
        receiver = address(uint160(uint256(receiverWord)));
        uint256 bps = uint256(bpsWord);
        if (receiver == address(0) || bps == 0 || bps > _MAX_ROYALTY_BPS) {
            return (address(0), 0);
        }
        unchecked {
            royaltyAmount = (salePrice / _ROYALTY_DENOMINATOR) * bps
                + ((salePrice % _ROYALTY_DENOMINATOR) * bps) / _ROYALTY_DENOMINATOR;
        }
    }

    function supportsInterfaceStrict(address target, bytes4 interfaceId)
        public
        view
        returns (bool)
    {
        (bool requiredOk, bytes memory requiredData) = _boundedStaticRead(
            target, abi.encodeWithSelector(IERC165.supportsInterface.selector, interfaceId), 32
        );
        if (!requiredOk || requiredData.length != 32 || abi.decode(requiredData, (uint256)) != 1) {
            return false;
        }
        (bool invalidOk, bytes memory invalidData) = _boundedStaticRead(
            target,
            abi.encodeWithSelector(IERC165.supportsInterface.selector, bytes4(0xffffffff)),
            32
        );
        return invalidOk && invalidData.length == 32 && abi.decode(invalidData, (uint256)) == 0;
    }

    function _isEligibleModule(
        ModuleRecordFacts memory record,
        address module,
        bytes32 runtimeCodeHash,
        bytes32 expectedModuleType,
        bytes4 expectedInterfaceId
    ) private view returns (bool) {
        return record.status == _MODULE_STATUS_ACTIVE && record.moduleType == expectedModuleType
            && record.interfaceId == expectedInterfaceId && record.moduleVersion != bytes32(0)
            && record.runtimeCodeHash == runtimeCodeHash && record.moduleManifestHash != bytes32(0)
            && record.deploymentManifestHash != bytes32(0) && record.revision != 0
            && supportsInterfaceStrict(module, expectedInterfaceId);
    }

    function _isLiveModuleRegistry(StreamCorePointerState memory pointer)
        private
        view
        returns (bool)
    {
        return _codeIsLive(pointer.target, pointer.codeHash)
            && pointer.moduleType == _POINTER_MODULE_REGISTRY
            && pointer.interfaceId == type(IStreamModuleRegistry).interfaceId
            && pointer.registry != address(0) && pointer.registryStatus == _MODULE_STATUS_ACTIVE
            && pointer.moduleManifestHash != bytes32(0)
            && pointer.deploymentManifestHash != bytes32(0) && pointer.revision != 0
            && supportsInterfaceStrict(pointer.target, type(IStreamModuleRegistry).interfaceId);
    }

    function _isValidContract(address target) private view returns (bool) {
        return target != address(0) && target.code.length != 0 && !_isDelegatedEOA(target);
    }

    function _codeIsLive(address target, bytes32 codeHash) private view returns (bool) {
        return _isValidContract(target) && target.codehash == codeHash;
    }

    function _isDelegatedEOA(address account) private view returns (bool delegated) {
        if (account.code.length != 23) return false;
        bytes3 prefix;
        assembly ("memory-safe") {
            extcodecopy(account, 0, 0, 3)
            prefix := mload(0)
        }
        return prefix == 0xef0100;
    }

    function _boundedStaticRead(address target, bytes memory callData, uint256 maxReturnBytes)
        private
        view
        returns (bool success, bytes memory returnData)
    {
        bool oversized;
        assembly ("memory-safe") {
            success := staticcall(gas(), target, add(callData, 0x20), mload(callData), 0x00, 0x00)
            let returnSize := returndatasize()
            oversized := gt(returnSize, maxReturnBytes)
            switch or(iszero(success), oversized)
            case 1 {
                returnData := mload(0x40)
                mstore(returnData, 0)
                mstore(0x40, add(returnData, 0x20))
            }
            default {
                returnData := mload(0x40)
                mstore(returnData, returnSize)
                returndatacopy(add(returnData, 0x20), 0x00, returnSize)
                mstore(0x40, and(add(add(returnData, 0x20), add(returnSize, 0x1f)), not(0x1f)))
            }
        }
        if (oversized) success = false;
    }

    function _boundedStaticReadDetailed(
        address target,
        bytes memory callData,
        uint256 maxReturnBytes,
        uint256 gasLimit
    ) private view returns (bool success, bool oversized, bytes memory returnData) {
        assembly ("memory-safe") {
            success := staticcall(
                gasLimit,
                target,
                add(callData, 0x20),
                mload(callData),
                0x00,
                0x00
            )
            let returnSize := returndatasize()
            oversized := gt(returnSize, maxReturnBytes)
            switch or(iszero(success), oversized)
            case 1 {
                returnData := mload(0x40)
                mstore(returnData, 0)
                mstore(0x40, add(returnData, 0x20))
            }
            default {
                returnData := mload(0x40)
                mstore(returnData, returnSize)
                returndatacopy(add(returnData, 0x20), 0x00, returnSize)
                mstore(0x40, and(add(add(returnData, 0x20), add(returnSize, 0x1f)), not(0x1f)))
            }
        }
    }

    function _isCanonicalCurrentAction(bytes memory data) private pure returns (bool valid) {
        assembly ("memory-safe") {
            valid := and(
                iszero(gt(mload(add(data, 0x20)), 1)),
                iszero(shr(8, mload(add(data, 0x60))))
            )
        }
    }

    function _isCanonicalModuleRecordEncoding(bytes memory data) private pure returns (bool valid) {
        uint256 dataLength = data.length;
        if (dataLength < 448 || dataLength > _MAX_MODULE_RECORD_RETURNDATA) return false;
        assembly ("memory-safe") {
            valid := 1
            if iszero(eq(mload(add(data, 0x20)), 0x20)) { valid := 0 }
            if gt(mload(add(data, 0x40)), 3) { valid := 0 }
            if and(mload(add(data, 0xa0)), sub(shl(224, 1), 1)) { valid := 0 }
            if shr(32, mload(add(data, 0xc0))) { valid := 0 }
            if iszero(eq(mload(add(data, 0x140)), 0x180)) { valid := 0 }
            if shr(64, mload(add(data, 0x160))) { valid := 0 }
            if shr(64, mload(add(data, 0x180))) { valid := 0 }
            if shr(64, mload(add(data, 0x1a0))) { valid := 0 }
            let stringLength := mload(add(data, 0x1c0))
            if or(iszero(stringLength), gt(stringLength, 0x800)) { valid := 0 }
            if iszero(eq(dataLength, add(0x1c0, and(add(stringLength, 0x1f), not(0x1f))))) {
                valid := 0
            }
        }
    }
}
