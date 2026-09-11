// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ERC165.sol";
import "./IERC165.sol";
import "./IStreamGovernanceExecutor.sol";
import "./IStreamModuleRegistry.sol";

/// @notice Canonical protocol-v1 module registry implementing
///         `docs/stream-long-term-architecture.md` [LTA-REGISTRY].
/// @dev Every writer verifies the executor's V2 per-call transition context.
///      There is no direct-authority or selector-only authorization fallback.
contract StreamModuleRegistry is ERC165, IStreamModuleRegistry {
    bytes32 public constant STREAM_MODULE_REGISTRATION_RECORD_V1 =
        keccak256("6529STREAM_MODULE_REGISTRATION_RECORD_V1");
    bytes32 public constant STREAM_RECORD_CHAIN_V1 = keccak256("6529STREAM_RECORD_CHAIN_V1");
    bytes32 public constant MODULE_REGISTRATION_RECORD_TYPE = keccak256("MODULE_REGISTRATION");
    uint256 public constant MODULE_REGISTRATION_SCOPE_KEY = 0;

    bytes32 public constant STREAM_MODULE_REGISTRATION_SCOPE_V1 =
        keccak256("6529STREAM_MODULE_REGISTRATION_SCOPE_V1");
    bytes32 public constant STREAM_MODULE_REGISTRATION_STATE_V1 =
        keccak256("6529STREAM_MODULE_REGISTRATION_STATE_V1");
    bytes32 public constant STREAM_MODULE_STATUS_SCOPE_V1 =
        keccak256("6529STREAM_MODULE_STATUS_SCOPE_V1");
    bytes32 public constant STREAM_MODULE_STATUS_STATE_V1 =
        keccak256("6529STREAM_MODULE_STATUS_STATE_V1");
    bytes32 public constant STREAM_MODULE_REGISTRY_MANIFEST_SCOPE_V1 =
        keccak256("6529STREAM_MODULE_REGISTRY_MANIFEST_SCOPE_V1");
    bytes32 public constant STREAM_MODULE_REGISTRY_MANIFEST_STATE_V1 =
        keccak256("6529STREAM_MODULE_REGISTRY_MANIFEST_STATE_V1");

    uint256 public constant MAX_MODULE_MANIFEST_URI_BYTES = 2_048;
    uint256 public constant MAX_MODULE_REGISTRY_MANIFEST_URI_BYTES = 2_048;
    uint16 public constant SCHEMA_VERSION = 1;

    bytes32 private constant _MODULE_MANIFEST_URI_FIELD = keccak256("moduleManifestURI");
    bytes32 private constant _REGISTRY_MANIFEST_URI_FIELD = keccak256("registryManifestURI");
    bytes32 private constant _STATUS_REASON_URI_FIELD = keccak256("statusReasonURI");
    error InvalidModule(address module);
    error EIP7702DelegatedModule(address module);
    error InvalidModuleRecord(address module);
    error ModuleAlreadyRegistered(address module);
    error ModuleNotRegistered(address module);
    error ModuleInterfaceUnsupported(address module, bytes4 interfaceId);
    error ModuleCodehashMismatch(address module, bytes32 expected, bytes32 actual);
    error InvalidStatusTransition(
        address module, ModuleRegistryStatus current, ModuleRegistryStatus requested
    );
    error InvalidRegistryManifestHash();
    error RegistryManifestNoOp();
    error EmptyURI(bytes32 field);
    error URITooLong(bytes32 field, uint256 actual, uint256 maximum);
    error InvalidUTF8(bytes32 field);
    error NotGovernanceExecutor(address caller);
    error NoExecutingGovernanceAction();
    error ZeroGovernanceActionId();
    error WrongGovernanceActionClass(uint8 actionClass);
    error UnexpectedGovernanceSelector(bytes4 actual, bytes4 expected);
    error GovernanceTransitionContextMismatch();
    error ModuleIndexOutOfBounds(uint256 index);
    error ZeroGovernanceExecutor();
    error InvalidGovernanceExecutor(address governanceExecutor);
    error RegistryInvariantViolation(uint256 moduleCount, uint64 recordCount);
    error RegistryRevisionOverflow();
    error RegistryTimestampOverflow(uint256 timestamp);

    event StreamModuleRegistryManifestUpdated(
        uint16 schemaVersion, bytes32 manifestHash, string manifestURI
    );

    struct ExecutorActionContext {
        uint8 actionClass;
        bytes32 scopeHash;
        bytes32 oldValueHash;
        bytes32 newValueHash;
    }

    IStreamGovernanceExecutor public immutable governanceExecutor;

    mapping(address => StreamModuleRecord) private _records;
    address[] private _modules;
    bytes32 private _registrationChainHash;
    uint64 private _registrationRecordCount;
    bytes32 private _manifestHash;
    string private _manifestURI;
    uint64 private _manifestRevision;

    constructor(
        IStreamGovernanceExecutor governanceExecutor_,
        bytes32 manifestHash_,
        string memory manifestURI_
    ) {
        address executor = address(governanceExecutor_);
        if (executor == address(0)) revert ZeroGovernanceExecutor();
        if (
            executor.code.length == 0 || _isEip7702DelegatedEOA(executor)
                || !_hasCurrentActionSurface(executor)
        ) {
            revert InvalidGovernanceExecutor(executor);
        }
        if (manifestHash_ == bytes32(0)) revert InvalidRegistryManifestHash();
        _requireValidURI(
            manifestURI_, _REGISTRY_MANIFEST_URI_FIELD, MAX_MODULE_REGISTRY_MANIFEST_URI_BYTES, true
        );

        governanceExecutor = governanceExecutor_;
        _manifestHash = manifestHash_;
        _manifestURI = manifestURI_;
        _manifestRevision = 1;
    }

    /// @notice Registers a new module through an exact class-1 V2 transition.
    function registerModule(StreamModuleRegistration calldata registration) external {
        ExecutorActionContext memory context =
            _currentAction(StreamModuleRegistry.registerModule.selector);
        if (context.actionClass != StreamGovernanceActionClasses.DELAYED_LOOSENING) {
            revert WrongGovernanceActionClass(context.actionClass);
        }

        address module = registration.module;
        if (module == address(0) || module.code.length == 0) revert InvalidModule(module);
        if (_isEip7702DelegatedEOA(module)) revert EIP7702DelegatedModule(module);
        if (_records[module].status != ModuleRegistryStatus.UNKNOWN) {
            revert ModuleAlreadyRegistered(module);
        }
        if (
            registration.moduleType == bytes32(0) || registration.moduleVersion == bytes32(0)
                || registration.expectedRuntimeCodeHash == bytes32(0)
                || registration.deploymentManifestHash == bytes32(0)
                || registration.moduleManifestHash == bytes32(0)
                || registration.interfaceId == bytes4(0)
                || registration.interfaceId == bytes4(0xffffffff)
        ) {
            revert InvalidModuleRecord(module);
        }
        _requireValidURI(
            registration.moduleManifestURI,
            _MODULE_MANIFEST_URI_FIELD,
            MAX_MODULE_MANIFEST_URI_BYTES,
            true
        );

        bytes32 runtimeCodeHash = module.codehash;
        if (runtimeCodeHash != registration.expectedRuntimeCodeHash) {
            revert ModuleCodehashMismatch(
                module, registration.expectedRuntimeCodeHash, runtimeCodeHash
            );
        }
        if (!_supportsERC165Interface(module, registration.interfaceId)) {
            revert ModuleInterfaceUnsupported(module, registration.interfaceId);
        }

        (uint256 oldCount, uint64 recordIndex) = _checkedRegistrationIndex();
        bytes32 oldChainHash = _registrationChainHash;
        bytes32 newChainHash =
            _nextRegistrationChainHash(registration, runtimeCodeHash, oldChainHash, recordIndex);
        bytes32 scopeHash = _registrationScopeHash(module);
        bytes32 oldStateHash = _registrationStateHash(
            scopeHash,
            false,
            _emptyRecordFactsHash(),
            oldCount,
            oldChainHash,
            recordIndex,
            address(0)
        );
        bytes32 newStateHash = _registrationStateHash(
            scopeHash,
            true,
            _registrationRecordFactsHash(registration, runtimeCodeHash),
            oldCount + 1,
            newChainHash,
            recordIndex + 1,
            module
        );
        _requireTransitionContext(context, scopeHash, oldStateHash, newStateHash);

        _storeRegistration(registration, runtimeCodeHash, newChainHash, recordIndex);
    }

    function _storeRegistration(
        StreamModuleRegistration calldata registration,
        bytes32 runtimeCodeHash,
        bytes32 newChainHash,
        uint64 recordIndex
    ) private {
        address module = registration.module;
        uint64 currentTimestamp = _currentTimestamp64();
        StreamModuleRecord storage record = _records[module];
        record.status = ModuleRegistryStatus.ACTIVE;
        record.moduleType = registration.moduleType;
        record.moduleVersion = registration.moduleVersion;
        record.interfaceId = registration.interfaceId;
        record.moduleGasLimit = registration.moduleGasLimit;
        record.runtimeCodeHash = runtimeCodeHash;
        record.deploymentManifestHash = registration.deploymentManifestHash;
        record.moduleManifestHash = registration.moduleManifestHash;
        record.moduleManifestURI = registration.moduleManifestURI;
        record.registeredAt = currentTimestamp;
        record.statusUpdatedAt = currentTimestamp;
        record.revision = 1;

        _modules.push(module);
        _registrationChainHash = newChainHash;
        _registrationRecordCount = recordIndex + 1;

        emit StreamModuleRegistered(
            SCHEMA_VERSION,
            module,
            registration.moduleType,
            registration.interfaceId,
            registration.moduleVersion,
            registration.moduleGasLimit,
            runtimeCodeHash,
            registration.deploymentManifestHash,
            registration.moduleManifestHash,
            registration.moduleManifestURI,
            newChainHash
        );
    }

    /// @notice Changes status through an exact class-0 tightening or class-1
    ///         loosening V2 transition.
    function setModuleStatus(
        address module,
        ModuleRegistryStatus newStatus,
        bytes32 reasonHash,
        string calldata reasonURI
    ) external {
        ExecutorActionContext memory context =
            _currentAction(StreamModuleRegistry.setModuleStatus.selector);
        StreamModuleRecord storage record = _records[module];
        ModuleRegistryStatus oldStatus = record.status;
        if (oldStatus == ModuleRegistryStatus.UNKNOWN) revert ModuleNotRegistered(module);
        if (newStatus == ModuleRegistryStatus.UNKNOWN || newStatus == oldStatus) {
            revert InvalidStatusTransition(module, oldStatus, newStatus);
        }
        if (!_isValidUtf8(reasonURI)) revert InvalidUTF8(_STATUS_REASON_URI_FIELD);

        uint8 expectedClass = _statusRank(newStatus) > _statusRank(oldStatus)
            ? StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING
            : StreamGovernanceActionClasses.DELAYED_LOOSENING;
        if (context.actionClass != expectedClass) {
            revert WrongGovernanceActionClass(context.actionClass);
        }
        if (record.revision == type(uint64).max) revert RegistryRevisionOverflow();
        uint64 newRevision = record.revision + 1;
        _requireRegistryCountInvariant();

        bytes32 scopeHash = _statusScopeHash(module);
        bytes32 oldStateHash = _statusStateHash(
            scopeHash,
            _storedRecordFactsHash(record, oldStatus, record.revision),
            _modules.length,
            _registrationChainHash,
            _registrationRecordCount
        );
        bytes32 newStateHash = _statusStateHash(
            scopeHash,
            _storedRecordFactsHash(record, newStatus, newRevision),
            _modules.length,
            _registrationChainHash,
            _registrationRecordCount
        );
        _requireTransitionContext(context, scopeHash, oldStateHash, newStateHash);

        uint64 currentTimestamp = _currentTimestamp64();
        record.status = newStatus;
        record.statusUpdatedAt = currentTimestamp;
        record.revision = newRevision;
        emit StreamModuleStatusChanged(
            SCHEMA_VERSION, module, record.moduleType, newStatus, reasonHash, reasonURI
        );
    }

    /// @notice Updates the registry manifest through an exact class-1 V2
    ///         transition.
    function setModuleRegistryManifest(bytes32 manifestHash, string calldata manifestURI) external {
        ExecutorActionContext memory context =
            _currentAction(StreamModuleRegistry.setModuleRegistryManifest.selector);
        if (context.actionClass != StreamGovernanceActionClasses.DELAYED_LOOSENING) {
            revert WrongGovernanceActionClass(context.actionClass);
        }
        if (manifestHash == bytes32(0)) revert InvalidRegistryManifestHash();
        _requireValidURI(
            manifestURI, _REGISTRY_MANIFEST_URI_FIELD, MAX_MODULE_REGISTRY_MANIFEST_URI_BYTES, true
        );
        bytes32 manifestURIHash = keccak256(bytes(manifestURI));
        if (manifestHash == _manifestHash && manifestURIHash == keccak256(bytes(_manifestURI))) {
            revert RegistryManifestNoOp();
        }
        if (_manifestRevision == type(uint64).max) revert RegistryRevisionOverflow();
        uint64 newRevision = _manifestRevision + 1;

        bytes32 scopeHash = _registryManifestScopeHash();
        bytes32 oldStateHash =
            _registryManifestStateHash(scopeHash, _manifestHash, _manifestURI, _manifestRevision);
        bytes32 newStateHash =
            _registryManifestStateHash(scopeHash, manifestHash, manifestURI, newRevision);
        _requireTransitionContext(context, scopeHash, oldStateHash, newStateHash);

        _manifestHash = manifestHash;
        _manifestURI = manifestURI;
        _manifestRevision = newRevision;
        emit StreamModuleRegistryManifestUpdated(SCHEMA_VERSION, manifestHash, manifestURI);
    }

    function moduleRecord(address module)
        external
        view
        override
        returns (StreamModuleRecord memory)
    {
        return _records[module];
    }

    function isModuleEligible(
        address module,
        bytes32 expectedModuleType,
        bytes4 expectedInterfaceId
    ) external view override returns (bool) {
        StreamModuleRecord storage record = _records[module];
        return record.status == ModuleRegistryStatus.ACTIVE
            && record.moduleType == expectedModuleType && record.interfaceId == expectedInterfaceId
            && module.code.length > 0 && !_isEip7702DelegatedEOA(module)
            && module.codehash == record.runtimeCodeHash
            && _supportsERC165Interface(module, expectedInterfaceId);
    }

    function moduleRegistryManifest()
        external
        view
        override
        returns (bytes32 manifestHash, string memory manifestURI, uint64 revision)
    {
        return (_manifestHash, _manifestURI, _manifestRevision);
    }

    function moduleCount() external view override returns (uint256) {
        return _modules.length;
    }

    function moduleAt(uint256 index) external view override returns (address module) {
        if (index >= _modules.length) revert ModuleIndexOutOfBounds(index);
        return _modules[index];
    }

    function registrationChainHash()
        external
        view
        override
        returns (bytes32 chainHash, uint64 recordCount)
    {
        return (_registrationChainHash, _registrationRecordCount);
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == type(IStreamModuleRegistry).interfaceId
            || super.supportsInterface(interfaceId);
    }

    function _currentAction(bytes4 expectedSelector)
        private
        view
        returns (ExecutorActionContext memory context)
    {
        if (msg.sender != address(governanceExecutor)) {
            revert NotGovernanceExecutor(msg.sender);
        }
        if (msg.sig != expectedSelector) {
            revert UnexpectedGovernanceSelector(msg.sig, expectedSelector);
        }
        (
            bool executing,
            bytes32 actionId,
            uint8 actionClass,
            bytes32 scopeHash,
            bytes32 oldValueHash,
            bytes32 newValueHash
        ) = governanceExecutor.currentAction();
        if (!executing) revert NoExecutingGovernanceAction();
        if (actionId == bytes32(0)) revert ZeroGovernanceActionId();
        context = ExecutorActionContext({
            actionClass: actionClass,
            scopeHash: scopeHash,
            oldValueHash: oldValueHash,
            newValueHash: newValueHash
        });
    }

    function _requireTransitionContext(
        ExecutorActionContext memory context,
        bytes32 scopeHash,
        bytes32 oldValueHash,
        bytes32 newValueHash
    ) private pure {
        if (
            context.scopeHash != scopeHash || context.oldValueHash != oldValueHash
                || context.newValueHash != newValueHash
        ) {
            revert GovernanceTransitionContextMismatch();
        }
    }

    function _checkedRegistrationIndex() private view returns (uint256 count, uint64 index) {
        count = _modules.length;
        if (count > type(uint64).max || _registrationRecordCount != count) {
            revert RegistryInvariantViolation(count, _registrationRecordCount);
        }
        // The uint64 bound above proves this narrowing is lossless.
        // forge-lint: disable-next-line(unsafe-typecast)
        index = uint64(count);
        if (index == type(uint64).max) revert RegistryRevisionOverflow();
    }

    function _requireRegistryCountInvariant() private view {
        uint256 count = _modules.length;
        if (count > type(uint64).max || _registrationRecordCount != count) {
            revert RegistryInvariantViolation(count, _registrationRecordCount);
        }
    }

    function _registrationScopeHash(address module) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                STREAM_MODULE_REGISTRATION_SCOPE_V1, uint256(block.chainid), address(this), module
            )
        );
    }

    function _statusScopeHash(address module) private view returns (bytes32) {
        return keccak256(
            abi.encode(STREAM_MODULE_STATUS_SCOPE_V1, uint256(block.chainid), address(this), module)
        );
    }

    function _registryManifestScopeHash() private view returns (bytes32) {
        return keccak256(
            abi.encode(
                STREAM_MODULE_REGISTRY_MANIFEST_SCOPE_V1, uint256(block.chainid), address(this)
            )
        );
    }

    function _registrationStateHash(
        bytes32 scopeHash,
        bool exists,
        bytes32 recordFactsHash,
        uint256 count,
        bytes32 chainHash,
        uint64 recordCount,
        address indexedModuleAtNewIndex
    ) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                STREAM_MODULE_REGISTRATION_STATE_V1,
                scopeHash,
                exists,
                recordFactsHash,
                count,
                chainHash,
                recordCount,
                indexedModuleAtNewIndex
            )
        );
    }

    function _statusStateHash(
        bytes32 scopeHash,
        bytes32 recordFactsHash,
        uint256 count,
        bytes32 chainHash,
        uint64 recordCount
    ) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                STREAM_MODULE_STATUS_STATE_V1,
                scopeHash,
                recordFactsHash,
                count,
                chainHash,
                recordCount
            )
        );
    }

    function _registryManifestStateHash(
        bytes32 scopeHash,
        bytes32 manifestHash,
        string memory manifestURI,
        uint64 revision
    ) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                STREAM_MODULE_REGISTRY_MANIFEST_STATE_V1,
                scopeHash,
                manifestHash,
                keccak256(bytes(manifestURI)),
                revision
            )
        );
    }

    function _emptyRecordFactsHash() private pure returns (bytes32) {
        return keccak256(
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
    }

    function _registrationRecordFactsHash(
        StreamModuleRegistration calldata registration,
        bytes32 runtimeCodeHash
    ) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                uint8(ModuleRegistryStatus.ACTIVE),
                registration.moduleType,
                registration.moduleVersion,
                registration.interfaceId,
                registration.moduleGasLimit,
                runtimeCodeHash,
                registration.deploymentManifestHash,
                registration.moduleManifestHash,
                keccak256(bytes(registration.moduleManifestURI)),
                uint64(1)
            )
        );
    }

    function _storedRecordFactsHash(
        StreamModuleRecord storage record,
        ModuleRegistryStatus status,
        uint64 revision
    ) private view returns (bytes32) {
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

    function _nextRegistrationChainHash(
        StreamModuleRegistration calldata registration,
        bytes32 runtimeCodeHash,
        bytes32 oldChainHash,
        uint64 recordIndex
    ) private view returns (bytes32) {
        bytes32 recordHash = keccak256(
            abi.encode(
                STREAM_MODULE_REGISTRATION_RECORD_V1,
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
                STREAM_RECORD_CHAIN_V1,
                uint256(block.chainid),
                address(this),
                MODULE_REGISTRATION_SCOPE_KEY,
                MODULE_REGISTRATION_RECORD_TYPE,
                oldChainHash,
                recordHash,
                recordIndex
            )
        );
    }

    function _statusRank(ModuleRegistryStatus status) private pure returns (uint8) {
        if (status == ModuleRegistryStatus.ACTIVE) return 0;
        if (status == ModuleRegistryStatus.DEPRECATED) return 1;
        return 2;
    }

    function _currentTimestamp64() private view returns (uint64 currentTimestamp) {
        uint256 timestamp = block.timestamp;
        if (timestamp > type(uint64).max) revert RegistryTimestampOverflow(timestamp);
        // The explicit bound above proves the narrowing is lossless.
        // forge-lint: disable-next-line(unsafe-typecast)
        currentTimestamp = uint64(timestamp);
    }

    function _supportsERC165Interface(address module, bytes4 interfaceId)
        private
        view
        returns (bool)
    {
        // These probes deliberately forward the EIP-150-clamped available gas.
        // A codehash-pinned, governance-admitted module can still consume nearly
        // all of the first probe's forwarded gas and starve a later probe. In that
        // case this read may return false or revert before producing the nominal
        // result: registration rolls back and live eligibility never succeeds.
        // This is fail-closed, not a guarantee that arbitrary modules cannot make
        // the caller revert.
        return _supportsInterfaceCall(module, type(IERC165).interfaceId)
            && !_supportsInterfaceCall(module, bytes4(0xffffffff))
            && _supportsInterfaceCall(module, interfaceId);
    }

    function _supportsInterfaceCall(address module, bytes4 interfaceId)
        private
        view
        returns (bool supported)
    {
        bytes memory payload = abi.encodeCall(IERC165.supportsInterface, (interfaceId));
        bool success;
        uint256 returnSize;
        uint256 raw;
        assembly ("memory-safe") {
            success := staticcall(gas(), module, add(payload, 0x20), mload(payload), 0, 0)
            returnSize := returndatasize()
            if and(success, eq(returnSize, 0x20)) {
                let output := mload(0x40)
                returndatacopy(output, 0, 0x20)
                raw := mload(output)
            }
        }
        return success && returnSize == 32 && raw == 1;
    }

    function _hasCurrentActionSurface(address executor) private view returns (bool) {
        bytes memory payload = abi.encodeCall(IStreamGovernanceExecutor.currentAction, ());
        bool success;
        uint256 returnSize;
        assembly ("memory-safe") {
            success := staticcall(gas(), executor, add(payload, 0x20), mload(payload), 0, 0)
            returnSize := returndatasize()
        }
        return success && returnSize == 6 * 32;
    }

    function _requireValidURI(
        string memory uri,
        bytes32 field,
        uint256 maximum,
        bool requireNonempty
    ) private pure {
        uint256 length = bytes(uri).length;
        if (requireNonempty && length == 0) revert EmptyURI(field);
        if (length > maximum) revert URITooLong(field, length, maximum);
        if (!_isValidUtf8(uri)) revert InvalidUTF8(field);
    }

    function _isValidUtf8(string memory raw) private pure returns (bool valid) {
        assembly ("memory-safe") {
            let cursor := add(raw, 0x20)
            let end := add(cursor, mload(raw))
            valid := 1

            for { } lt(cursor, end) { cursor := add(cursor, 1) } {
                let lead := byte(0, mload(cursor))
                if iszero(lt(lead, 0x80)) {
                    if or(lt(lead, 0xc2), gt(lead, 0xf4)) {
                        valid := 0
                        break
                    }
                    cursor := add(cursor, 1)
                    if iszero(lt(cursor, end)) {
                        valid := 0
                        break
                    }
                    let second := byte(0, mload(cursor))
                    if iszero(eq(and(second, 0xc0), 0x80)) {
                        valid := 0
                        break
                    }
                    if lt(lead, 0xe0) { continue }
                    if or(
                        and(eq(lead, 0xe0), lt(second, 0xa0)),
                        and(eq(lead, 0xed), gt(second, 0x9f))
                    ) {
                        valid := 0
                        break
                    }
                    cursor := add(cursor, 1)
                    if iszero(lt(cursor, end)) {
                        valid := 0
                        break
                    }
                    if iszero(eq(and(byte(0, mload(cursor)), 0xc0), 0x80)) {
                        valid := 0
                        break
                    }
                    if lt(lead, 0xf0) { continue }
                    if or(
                        and(eq(lead, 0xf0), lt(second, 0x90)),
                        and(eq(lead, 0xf4), gt(second, 0x8f))
                    ) {
                        valid := 0
                        break
                    }
                    cursor := add(cursor, 1)
                    if iszero(lt(cursor, end)) {
                        valid := 0
                        break
                    }
                    if iszero(eq(and(byte(0, mload(cursor)), 0xc0), 0x80)) {
                        valid := 0
                        break
                    }
                }
            }
        }
    }

    function _isEip7702DelegatedEOA(address account) private view returns (bool delegated) {
        if (account.code.length != 23) return false;
        bytes3 prefix;
        assembly ("memory-safe") {
            extcodecopy(account, 0, 0, 3)
            prefix := mload(0)
        }
        return prefix == 0xef0100;
    }
}
