// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IStreamGovernanceExecutor.sol";
import "../smart-contracts/IStreamModuleRegistry.sol";
import "../smart-contracts/IStreamRoleRegistry.sol";
import "../smart-contracts/StreamGovernanceBootstrap.sol";
import "../smart-contracts/StreamGovernanceEvidence.sol";
import "../smart-contracts/StreamGovernanceExecutor.sol";
import "../smart-contracts/StreamGovernancePolicy.sol";
import "../smart-contracts/StreamRoleRegistry.sol";
import "../smart-contracts/StreamRoles.sol";
import "./helpers/StreamGovernanceBootstrapHarness.sol";

contract StreamGovernanceSSTORE2ReadHarness {
    function read(address pointer) external view returns (bytes memory) {
        return SSTORE2.read(pointer);
    }
}

interface VmBootstrapAccess {
    function cool(address account) external;
}

contract StreamGovernanceBootstrapBadInterfaceManifestMock {
    address public immutable core;
    IStreamGovernanceExecutor public immutable governanceExecutor;

    constructor(address core_, IStreamGovernanceExecutor governanceExecutor_) {
        core = core_;
        governanceExecutor = governanceExecutor_;
    }

    function supportsInterface(bytes4) external pure returns (bool) {
        return false;
    }
}

contract StreamGovernanceBootstrapBadRoleRegistryMock {
    function supportsInterface(bytes4) external pure returns (bool) {
        return false;
    }
}

contract StreamGovernanceBootstrapAllInterfacesRoleRegistryMock {
    function supportsInterface(bytes4) external pure returns (bool) {
        return true;
    }
}

contract StreamGovernanceBootstrapAllInterfacesManifestMock {
    address public immutable core;
    IStreamGovernanceExecutor public immutable governanceExecutor;

    constructor(address core_, IStreamGovernanceExecutor governanceExecutor_) {
        core = core_;
        governanceExecutor = governanceExecutor_;
    }

    function supportsInterface(bytes4) external pure returns (bool) {
        return true;
    }
}

contract StreamGovernanceBootstrapAllInterfacesModuleRegistryMock {
    function supportsInterface(bytes4) external pure returns (bool) {
        return true;
    }
}

contract StreamGovernanceModuleStatusRegistryMock {
    uint8 private _status = uint8(ModuleRegistryStatus.ACTIVE);
    uint8 private _returnMode;

    function setStatus(uint8 status) external {
        require(status <= uint8(ModuleRegistryStatus.INCIDENT_REVOKED), "status");
        _status = status;
    }

    function setReturnMode(uint8 returnMode) external {
        _returnMode = returnMode;
    }

    function moduleRecord(address) external view returns (StreamModuleRecord memory record) {
        if (_returnMode == 1) {
            bytes memory oversized = new bytes(2_500);
            assembly ("memory-safe") {
                return(add(oversized, 0x20), mload(oversized))
            }
        }
        if (_returnMode == 2) {
            assembly ("memory-safe") {
                for { } 1 { } { }
            }
        }
        if (_returnMode == 4) {
            uint256 initialGas = gasleft();
            while (initialGas - gasleft() < 250_000) { }
        }
        record = StreamModuleRecord({
            status: ModuleRegistryStatus(_status),
            moduleType: keccak256("STREAM_TEST_MODULE"),
            moduleVersion: bytes32(uint256(1)),
            interfaceId: bytes4(0x12345678),
            moduleGasLimit: 100_000,
            runtimeCodeHash: keccak256("runtime"),
            deploymentManifestHash: keccak256("deployment"),
            moduleManifestHash: keccak256("module"),
            moduleManifestURI: "ipfs://module",
            registeredAt: 1,
            statusUpdatedAt: 1,
            revision: 1
        });
        if (_returnMode == 3) {
            bytes memory nonCanonical = abi.encode(record);
            assembly ("memory-safe") {
                mstore(add(nonCanonical, 0xa0), or(mload(add(nonCanonical, 0xa0)), 1))
                return(add(nonCanonical, 0x20), mload(nonCanonical))
            }
        }
    }
}

contract StreamGovernanceRoleManagerRegistryMock {
    mapping(address => bool) public roleManagers;

    function registerRoleManager(address account, bool enabled) external {
        roleManagers[account] = enabled;
    }

    function unrelatedRoleRegistryCall() external pure { }
}

interface StreamGovernanceBootstrapGrantCallback {
    function onBootstrapGuardianGrant() external;
}

contract StreamGovernanceBootstrapReentrantRoleRegistryMock {
    address public immutable owner;
    address private immutable _callback;
    bool private immutable _failSecondGrant;
    address[] private _terminalGuardians;
    mapping(address => bool) private _isTerminalGuardian;
    bytes32 private _terminalChain;
    uint64 private _terminalRevision;
    bytes32 private _globalChain;
    uint64 private _globalRevision;

    constructor(address owner_, address callback_, bool failSecondGrant_) {
        owner = owner_;
        _callback = callback_;
        _failSecondGrant = failSecondGrant_;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IStreamRoleRegistry).interfaceId || interfaceId == 0x01ffc9a7;
    }

    function grantRole(bytes32 role, address holder) external {
        require(msg.sender == owner, "not owner");
        require(role == StreamRoles.ROLE_TERMINAL_FREEZE_VETO, "unexpected role");
        require(!_isTerminalGuardian[holder], "duplicate holder");
        if (_failSecondGrant && _terminalGuardians.length == 1) {
            revert("forced second grant failure");
        }
        _isTerminalGuardian[holder] = true;
        _terminalGuardians.push(holder);
        _terminalRevision += 1;
        _globalRevision += 1;
        _terminalChain = keccak256(
            abi.encode("REENTRANT_ROLE_CHAIN", _terminalChain, role, holder, _terminalRevision)
        );
        _globalChain = keccak256(
            abi.encode("REENTRANT_GLOBAL_CHAIN", _globalChain, role, holder, _globalRevision)
        );
        if (_terminalGuardians.length == 1) {
            StreamGovernanceBootstrapGrantCallback(_callback).onBootstrapGuardianGrant();
        }
    }

    function roleHolderCount(bytes32 role) external view returns (uint256) {
        return role == StreamRoles.ROLE_TERMINAL_FREEZE_VETO ? _terminalGuardians.length : 0;
    }

    function roleHolderAt(bytes32 role, uint256 index) external view returns (address) {
        require(role == StreamRoles.ROLE_TERMINAL_FREEZE_VETO, "unexpected role");
        return _terminalGuardians[index];
    }

    function roleMutationState(bytes32 role)
        external
        view
        returns (bytes32 chainHash, uint64 revision)
    {
        if (role == StreamRoles.ROLE_TERMINAL_FREEZE_VETO) {
            return (_terminalChain, _terminalRevision);
        }
    }

    function globalRoleMutationState() external view returns (bytes32 chainHash, uint64 revision) {
        return (_globalChain, _globalRevision);
    }

    function isRoleRedundant(bytes32 role) external view returns (bool) {
        if (role != StreamRoles.ROLE_TERMINAL_FREEZE_VETO || _terminalGuardians.length < 2) {
            return false;
        }
        for (uint256 i = 0; i < _terminalGuardians.length; i++) {
            if (_terminalGuardians[i].code.length == 0) return false;
        }
        return true;
    }

    function hasRole(bytes32 role, address holder) external view returns (bool) {
        return role == StreamRoles.ROLE_TERMINAL_FREEZE_VETO && _isTerminalGuardian[holder];
    }
}

contract StreamGovernanceBootstrapPrimedManifestMock {
    address public immutable core;
    IStreamGovernanceExecutor public immutable governanceExecutor;

    constructor(address core_, IStreamGovernanceExecutor governanceExecutor_) {
        core = core_;
        governanceExecutor = governanceExecutor_;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x37660ede || interfaceId == 0x01ffc9a7;
    }

    function streamSystemManifestPointerCount() external pure returns (uint256) {
        return 1;
    }
}

contract StreamGovernanceBootstrapPolicyHarness {
    bytes4 internal constant SEAL_SELECTOR = 0x11111111;
    bytes4 internal constant REGISTER_TAIL_SELECTOR = 0x22222222;

    StreamGovernanceBootstrap.PolicyState private _policy;
    address private _roleRegistry;
    address private immutable _core;
    bytes32 private immutable _coreCodeHash;
    address private immutable _tailTarget;
    bytes32 private immutable _tailCodeHash;

    constructor(address core_, address tailTarget_) {
        _core = core_;
        _coreCodeHash = core_.codehash;
        _tailTarget = tailTarget_;
        _tailCodeHash = tailTarget_.codehash;
    }

    function appendTail(address triggerTarget, bytes4 triggerSelector, uint8 actionClassMask)
        external
    {
        StreamGovernanceBootstrap.appendManifestTailTrigger(
            _policy,
            triggerTarget,
            triggerSelector,
            triggerTarget.codehash,
            actionClassMask,
            _tailTarget,
            _tailCodeHash,
            false,
            bytes32(0),
            bytes32(0),
            bytes32(0)
        );
    }

    function validateTail(uint8 actionClass, GovernanceCall[] calldata calls, bool bootstrapScoped)
        external
        view
    {
        GovernanceCall[] memory copied = calls;
        StreamGovernanceBootstrap.validateManifestTailComposition(
            _policy,
            actionClass,
            copied,
            bootstrapScoped,
            _core,
            _coreCodeHash,
            _tailTarget,
            _tailCodeHash,
            SEAL_SELECTOR,
            REGISTER_TAIL_SELECTOR
        );
    }

    function forceFreeze(address target, bytes4 selector, bool freezeEnabled) external {
        _policy.freezeSelectors[target][selector] = freezeEnabled;
    }

    function enableFreeze(address target, bytes4 selector) external {
        this._enableFreeze(target, selector);
    }

    function _enableFreeze(address target, bytes4 selector) external {
        require(msg.sender == address(this), "self only");
        bytes32 configKind = keccak256("6529STREAM_GOVERNANCE_CONFIG_FREEZE_SELECTOR");
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash,) = StreamGovernancePolicy.governanceSelectorConfigTransitionHashes(
            configKind, target, selector, false, bytes32(0), 0, true, target.codehash
        );
        StreamGovernancePolicy.ExecutionContext memory ctx = StreamGovernancePolicy.ExecutionContext({
            executing: true,
            actionId: keccak256("policy-freeze-overlap-test"),
            actionClass: StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            scopeHash: scopeHash,
            oldValueHash: oldValueHash,
            newValueHash: newValueHash,
            batchLength: 1,
            callIndex: 0
        });
        StreamGovernancePolicy.updateFreezeSelector(
            _policy,
            _adminForFreeze,
            target,
            selector,
            true,
            _tailTarget,
            MANIFEST_PUBLISH_SELECTOR_FOR_HARNESS,
            ctx
        );
    }

    StreamGovernancePolicy.AdminState private _adminForFreeze;
    bytes4 private constant MANIFEST_PUBLISH_SELECTOR_FOR_HARNESS = 0x09b1b5c6;

    function frozen(address target, bytes4 selector) external view returns (bool) {
        return _policy.freezeSelectors[target][selector];
    }

    function bindRoleRegistry(address roleRegistry_) external {
        _roleRegistry = roleRegistry_;
    }

    function validateCalls(
        uint8 actionClass,
        GovernanceCall[] calldata calls,
        bytes[] calldata callDatas
    ) external view returns (uint256) {
        GovernanceCall[] memory copiedCalls = calls;
        bytes[] memory copiedCallDatas = callDatas;
        return StreamGovernanceBootstrap.validateCalls(
            _policy,
            _roleRegistry,
            _tailTarget,
            actionClass,
            copiedCalls,
            copiedCallDatas,
            SEAL_SELECTOR
        );
    }

    function validateCallsAndTail(
        uint8 actionClass,
        GovernanceCall[] calldata calls,
        bytes[] calldata callDatas
    ) external view returns (uint256 totalValue) {
        GovernanceCall[] memory copiedCalls = calls;
        bytes[] memory copiedCallDatas = callDatas;
        totalValue = StreamGovernanceBootstrap.validateCalls(
            _policy,
            _roleRegistry,
            _tailTarget,
            actionClass,
            copiedCalls,
            copiedCallDatas,
            SEAL_SELECTOR
        );
        StreamGovernanceBootstrap.validateManifestTailComposition(
            _policy,
            actionClass,
            copiedCalls,
            false,
            _core,
            _coreCodeHash,
            _tailTarget,
            _tailCodeHash,
            SEAL_SELECTOR,
            REGISTER_TAIL_SELECTOR
        );
    }

    function tailTarget() external view returns (address) {
        return _tailTarget;
    }
}

contract StreamGovernancePersistentPolicyHarness {
    StreamGovernanceBootstrap.PolicyState private _policy;
    StreamGovernancePolicy.AdminState private _admin;

    function enableTightening(address target, bytes4 selector) external {
        this._enableTightening(target, selector);
    }

    function _enableTightening(address target, bytes4 selector) external {
        require(msg.sender == address(this), "self only");
        StreamGovernancePolicy.ExecutionContext memory ctx = StreamGovernancePolicy.ExecutionContext({
            executing: true,
            actionId: keccak256("policy-eip-7702-test"),
            actionClass: StreamGovernanceActionClasses.DELAYED_LOOSENING,
            scopeHash: bytes32(0),
            oldValueHash: bytes32(0),
            newValueHash: bytes32(0),
            batchLength: 1,
            callIndex: 0
        });
        StreamGovernancePolicy.updateTighteningCall(_policy, _admin, target, selector, true, ctx);
    }
}

abstract contract StreamGovernanceBootstrapTestBase is StreamGovernanceBootstrapHarness {
    bytes4 internal constant MANIFEST_PUBLISH_SELECTOR = 0x09b1b5c6;
    bytes4 internal constant ROOT_MAGIC = 0x6c9d2530;
    uint256 internal constant MAX_CHUNK_BYTES = 24_575;
    VmBootstrapAccess internal constant vmAccess =
        VmBootstrapAccess(address(uint160(uint256(keccak256("hevm cheat code")))));

    struct PayloadFixture {
        address root;
        address chunk;
        bytes descriptor;
        address[] chunks;
        bytes32 manifestHash;
        uint32 totalBytes;
        uint16 chunkCount;
    }

    StreamGovernanceSSTORE2Writer internal writer;

    function setUp() public virtual {
        writer = new StreamGovernanceSSTORE2Writer();
    }

    function invokeSeal(BootstrapArtifacts memory artifacts, address authority)
        external
        returns (bytes32)
    {
        require(msg.sender == address(this), "self only");
        return _sealBootstrap(artifacts, authority);
    }

    function _eip7702Designation(address delegate) internal pure returns (bytes memory) {
        bytes memory designation = abi.encodePacked(bytes3(0xef0100), bytes20(delegate));
        require(designation.length == 23, "eip-7702 designation length");
        return designation;
    }

    function _bootstrapState(StreamGovernanceExecutor executor)
        internal
        view
        returns (BootstrapStateCommitment memory state)
    {
        (bool ok, bytes memory data) = address(executor)
            .staticcall(abi.encodeCall(executor.systemManifestBootstrapState, ()));
        require(ok, "bootstrap state read failed");
        state = abi.decode(data, (BootstrapStateCommitment));
    }

    function _uniformPayload(uint16 chunkCount, uint32 chunkLength)
        internal
        returns (PayloadFixture memory fixture)
    {
        bytes memory payload = new bytes(chunkLength);
        if (chunkLength != 0) payload[0] = bytes1(uint8(0x7b));
        fixture.chunkCount = chunkCount;
        fixture.totalBytes = uint32(uint256(chunkCount) * uint256(chunkLength));
        StreamGovernanceEvidence.ManifestChunk[] memory chunks =
            new StreamGovernanceEvidence.ManifestChunk[](chunkCount);
        fixture.chunks = new address[](chunkCount);
        bytes32 payloadHash = keccak256(payload);
        for (uint256 i = 0; i < chunkCount; i++) {
            address chunkPointer = writer.write(payload);
            if (i == 0) fixture.chunk = chunkPointer;
            fixture.chunks[i] = chunkPointer;
            chunks[i] = StreamGovernanceEvidence.ManifestChunk({
                pointer: chunkPointer, payloadLength: chunkLength, payloadHash: payloadHash
            });
        }
        (fixture.descriptor, fixture.manifestHash) = _encodePayload(chunks, fixture.totalBytes);
        fixture.root = writer.write(fixture.descriptor);
    }

    function _encodePayload(
        StreamGovernanceEvidence.ManifestChunk[] memory chunks,
        uint32 totalBytes
    ) internal pure returns (bytes memory descriptor, bytes32 manifestHash) {
        uint16 chunkCount = uint16(chunks.length);
        descriptor =
            abi.encode(ROOT_MAGIC, uint16(1), PAYLOAD_V1, JCS, totalBytes, chunkCount, chunks);
        bytes32[] memory leafHashes = new bytes32[](chunks.length);
        for (uint256 i = 0; i < chunks.length; i++) {
            leafHashes[i] = keccak256(
                abi.encode(PAYLOAD_LEAF_V1, i, chunks[i].payloadLength, chunks[i].payloadHash)
            );
        }
        bytes32 listHash = keccak256(abi.encode(PAYLOAD_LIST_V1, totalBytes, leafHashes));
        manifestHash = keccak256(
            abi.encode(
                PAYLOAD_ROOT_V1, uint16(1), PAYLOAD_V1, JCS, totalBytes, chunkCount, listHash
            )
        );
    }

    function _clone(bytes memory source) internal pure returns (bytes memory copy) {
        copy = new bytes(source.length);
        for (uint256 i = 0; i < source.length; i++) {
            copy[i] = source[i];
        }
    }

    function _writeWord(bytes memory data, uint256 byteOffset, uint256 value) internal pure {
        assembly ("memory-safe") {
            mstore(add(add(data, 0x20), byteOffset), value)
        }
    }

    function _expectInvalidPayload(bytes memory descriptor, bytes32 expectedManifestHash) internal {
        address root = writer.write(descriptor);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.InvalidManifestTail.selector)
        );
        StreamGovernanceEvidence.verifyManifestPayload(root, expectedManifestHash);
    }

    function _call(address target, uint256 value, bytes4 selector)
        internal
        pure
        returns (GovernanceCall memory)
    {
        return GovernanceCall({
            target: target,
            value: value,
            selector: selector,
            callDataHash: bytes32(0),
            scopeHash: bytes32(0),
            oldValueHash: bytes32(0),
            newValueHash: bytes32(0)
        });
    }

    function _derivedHashes(StreamGovernanceExecutor, GovernanceCall[] memory calls)
        internal
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
}

contract StreamGovernanceBootstrapPayloadTest is StreamGovernanceBootstrapTestBase {
    event MaximumManifestVerificationGas(uint256 gasUsed);

    function testCanonicalSSTORE2CallDataDecodeRejectsTrailingBytes() public {
        bytes[] memory callDatas = new bytes[](3);
        callDatas[0] = abi.encodeWithSelector(bytes4(0x12345678), uint256(11));
        callDatas[1] = hex"";
        callDatas[2] = abi.encodeWithSelector(bytes4(0x87654321), address(0xBEEF));
        bytes memory canonical = abi.encode(callDatas);
        address pointer = writer.write(canonical);

        bytes[] memory decoded = StreamGovernanceBootstrap.readCanonicalCallDatas(pointer);
        require(decoded.length == callDatas.length, "decoded calldata count");
        for (uint256 i = 0; i < callDatas.length; i++) {
            require(keccak256(decoded[i]) == keccak256(callDatas[i]), "decoded calldata bytes");
        }

        pointer = writer.write(bytes.concat(canonical, bytes32(0)));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.NonCanonicalCallDataPublication.selector
            )
        );
        StreamGovernanceBootstrap.readCanonicalCallDatas(pointer);
    }

    function testSSTORE2ExactBoundaryAndInvalidPointers() public {
        StreamGovernanceSSTORE2ReadHarness reader = new StreamGovernanceSSTORE2ReadHarness();
        bytes memory maximum = new bytes(MAX_CHUNK_BYTES);
        maximum[0] = bytes1(uint8(0x01));
        maximum[maximum.length - 1] = bytes1(uint8(0xff));
        address pointer = writer.write(maximum);
        require(pointer.code.length == MAX_CHUNK_BYTES + 1, "maximum runtime length");
        require(keccak256(reader.read(pointer)) == keccak256(maximum), "maximum payload read");

        vm.expectRevert(
            abi.encodeWithSelector(SSTORE2.SSTORE2DataTooLarge.selector, MAX_CHUNK_BYTES + 1)
        );
        writer.write(new bytes(MAX_CHUNK_BYTES + 1));

        vm.expectRevert(abi.encodeWithSelector(SSTORE2.SSTORE2InvalidPointer.selector, address(0)));
        reader.read(address(0));

        address codeless = address(0xC0DE);
        vm.expectRevert(abi.encodeWithSelector(SSTORE2.SSTORE2InvalidPointer.selector, codeless));
        reader.read(codeless);

        address badPrefix = address(0xBAD0);
        vm.etch(badPrefix, hex"010203");
        vm.expectRevert(abi.encodeWithSelector(SSTORE2.SSTORE2InvalidPointer.selector, badPrefix));
        reader.read(badPrefix);
    }

    function testManifestPayloadOneChunkCanonicalVerification() public {
        PayloadFixture memory fixture = _uniformPayload(1, 2);
        require(fixture.root.code.length == 353, "one chunk root runtime");
        StreamGovernanceEvidence.verifyManifestPayload(fixture.root, fixture.manifestHash);
    }

    function testManifestPayloadThirtyTwoChunkMaximumStaysBelowGasCeiling() public {
        vm.pauseGasMetering();
        // MAX_CHUNK_BYTES is the fixed 24,575-byte EIP-170 payload bound.
        // forge-lint: disable-next-line(unsafe-typecast)
        PayloadFixture memory fixture = _uniformPayload(32, uint32(MAX_CHUNK_BYTES));
        for (uint256 i = 0; i < fixture.chunks.length; i++) {
            vmAccess.cool(fixture.chunks[i]);
        }
        vm.resumeGasMetering();

        require(fixture.totalBytes == 786_400, "maximum total bytes");
        require(fixture.root.code.length == 3_329, "maximum root runtime");
        uint256 gasBefore = gasleft();
        StreamGovernanceEvidence.verifyManifestPayload(fixture.root, fixture.manifestHash);
        uint256 gasUsed = gasBefore - gasleft();
        emit MaximumManifestVerificationGas(gasUsed);
        require(gasUsed <= 12_000_000, "maximum manifest verification gas");
    }

    function testManifestDescriptorRejectsMalformedHeadsAndOffset() public {
        PayloadFixture memory fixture = _uniformPayload(1, 2);
        bytes memory malformed = _clone(fixture.descriptor);
        _writeWord(malformed, 0, 0);
        _expectInvalidPayload(malformed, fixture.manifestHash);

        malformed = _clone(fixture.descriptor);
        _writeWord(malformed, 32, 2);
        _expectInvalidPayload(malformed, fixture.manifestHash);

        malformed = _clone(fixture.descriptor);
        _writeWord(malformed, 64, uint256(keccak256("wrong-payload-schema")));
        _expectInvalidPayload(malformed, fixture.manifestHash);

        malformed = _clone(fixture.descriptor);
        _writeWord(malformed, 96, uint256(keccak256("wrong-canonicalization")));
        _expectInvalidPayload(malformed, fixture.manifestHash);

        malformed = _clone(fixture.descriptor);
        _writeWord(malformed, 192, 256);
        _expectInvalidPayload(malformed, fixture.manifestHash);
    }

    function testManifestDescriptorRejectsMalformedCountsAndTrailingBytes() public {
        PayloadFixture memory fixture = _uniformPayload(1, 2);
        bytes memory malformed = _clone(fixture.descriptor);
        _writeWord(malformed, 160, 2);
        _expectInvalidPayload(malformed, fixture.manifestHash);

        malformed = _clone(fixture.descriptor);
        _writeWord(malformed, 224, 0);
        _expectInvalidPayload(malformed, fixture.manifestHash);

        malformed = _clone(fixture.descriptor);
        _writeWord(malformed, 160, 33);
        _writeWord(malformed, 224, 33);
        _expectInvalidPayload(malformed, fixture.manifestHash);

        malformed = bytes.concat(fixture.descriptor, bytes32(0));
        _expectInvalidPayload(malformed, fixture.manifestHash);
    }

    function testManifestDescriptorRejectsNonCanonicalPointerAndLengthWords() public {
        PayloadFixture memory fixture = _uniformPayload(1, 2);
        bytes memory malformed = _clone(fixture.descriptor);
        uint256 highPointer = uint256(uint160(fixture.chunk)) | (uint256(1) << 200);
        _writeWord(malformed, 256, highPointer);
        _expectInvalidPayload(malformed, fixture.manifestHash);

        malformed = _clone(fixture.descriptor);
        _writeWord(malformed, 288, uint256(type(uint32).max) + 1);
        _expectInvalidPayload(malformed, fixture.manifestHash);
    }

    function testManifestChunksRejectBadStopLengthHashAndTotal() public {
        PayloadFixture memory fixture = _uniformPayload(1, 2);
        bytes memory badRuntime = fixture.chunk.code;
        badRuntime[0] = bytes1(uint8(1));
        vm.etch(fixture.chunk, badRuntime);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.InvalidManifestTail.selector)
        );
        StreamGovernanceEvidence.verifyManifestPayload(fixture.root, fixture.manifestHash);

        fixture = _uniformPayload(1, 2);
        bytes memory malformed = _clone(fixture.descriptor);
        _writeWord(malformed, 288, 1);
        _expectInvalidPayload(malformed, fixture.manifestHash);

        malformed = _clone(fixture.descriptor);
        _writeWord(malformed, 320, uint256(keccak256("wrong-chunk-hash")));
        _expectInvalidPayload(malformed, fixture.manifestHash);

        malformed = _clone(fixture.descriptor);
        _writeWord(malformed, 128, 3);
        _expectInvalidPayload(malformed, fixture.manifestHash);
    }

    function testManifestChunksRejectZeroPointerAndNonFinalShortChunk() public {
        bytes memory firstPayload = hex"0102";
        bytes memory secondPayload = hex"03";
        StreamGovernanceEvidence.ManifestChunk[] memory chunks =
            new StreamGovernanceEvidence.ManifestChunk[](2);
        chunks[0] = StreamGovernanceEvidence.ManifestChunk({
            pointer: writer.write(firstPayload),
            payloadLength: uint32(firstPayload.length),
            payloadHash: keccak256(firstPayload)
        });
        chunks[1] = StreamGovernanceEvidence.ManifestChunk({
            pointer: writer.write(secondPayload),
            payloadLength: uint32(secondPayload.length),
            payloadHash: keccak256(secondPayload)
        });
        (bytes memory descriptor, bytes32 manifestHash) = _encodePayload(chunks, 3);
        _expectInvalidPayload(descriptor, manifestHash);

        chunks = new StreamGovernanceEvidence.ManifestChunk[](1);
        chunks[0] = StreamGovernanceEvidence.ManifestChunk({
            pointer: address(0), payloadLength: 2, payloadHash: keccak256(firstPayload)
        });
        (descriptor, manifestHash) = _encodePayload(chunks, 2);
        _expectInvalidPayload(descriptor, manifestHash);
    }
}

contract StreamGovernanceBootstrapCompositionTest is StreamGovernanceBootstrapTestBase {
    bytes4 private constant TRIGGER_SELECTOR =
        StreamGovernanceBootstrapTriggerMock.bootstrapWrite.selector;
    bytes4 private constant REGISTER_TAIL_SELECTOR = 0x22222222;
    bytes4 private constant SEAL_SELECTOR = 0x11111111;

    StreamGovernanceBootstrapTriggerMock private coreCode;
    StreamGovernanceBootstrapTriggerMock private tailCode;
    StreamGovernanceBootstrapTriggerMock private trigger;
    StreamGovernanceBootstrapPolicyHarness private policy;

    function setUp() public override {
        super.setUp();
        coreCode = new StreamGovernanceBootstrapTriggerMock();
        tailCode = new StreamGovernanceBootstrapTriggerMock();
        trigger = new StreamGovernanceBootstrapTriggerMock();
        policy = new StreamGovernanceBootstrapPolicyHarness(address(coreCode), address(tailCode));
        policy.appendTail(address(trigger), TRIGGER_SELECTOR, 0x0f);
    }

    function testPresealCompositionAllowsOnlyBoundZeroValueTriggersOrExactSealTail() public {
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = _call(address(trigger), 0, TRIGGER_SELECTOR);
        policy.validateTail(1, calls, true);

        calls[0].value = 1;
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.BootstrapActionNotPermitted.selector)
        );
        policy.validateTail(1, calls, true);

        calls[0] = _call(address(coreCode), 0, TRIGGER_SELECTOR);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.BootstrapActionNotPermitted.selector)
        );
        policy.validateTail(1, calls, true);

        calls = new GovernanceCall[](2);
        calls[0] = _call(address(policy), 0, SEAL_SELECTOR);
        calls[1] = _call(address(tailCode), 0, MANIFEST_PUBLISH_SELECTOR);
        policy.validateTail(3, calls, true);

        calls[1].value = 1;
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.InvalidManifestTail.selector)
        );
        policy.validateTail(3, calls, true);
    }

    function testPostsealTriggerRequiresOneFinalZeroValueTail() public {
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = _call(address(trigger), 0, TRIGGER_SELECTOR);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.ManifestTailRequired.selector)
        );
        policy.validateTail(1, calls, false);

        calls = new GovernanceCall[](2);
        calls[0] = _call(address(trigger), 0, TRIGGER_SELECTOR);
        calls[1] = _call(address(tailCode), 0, MANIFEST_PUBLISH_SELECTOR);
        policy.validateTail(1, calls, false);

        calls[1].value = 1;
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.InvalidManifestTail.selector)
        );
        policy.validateTail(1, calls, false);

        calls[1] = _call(address(coreCode), 0, MANIFEST_PUBLISH_SELECTOR);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.ManifestTailRequired.selector)
        );
        policy.validateTail(1, calls, false);

        calls = new GovernanceCall[](3);
        calls[0] = _call(address(trigger), 0, TRIGGER_SELECTOR);
        calls[1] = _call(address(tailCode), 0, MANIFEST_PUBLISH_SELECTOR);
        calls[2] = _call(address(tailCode), 0, MANIFEST_PUBLISH_SELECTOR);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.InvalidManifestTail.selector)
        );
        policy.validateTail(1, calls, false);

        calls = new GovernanceCall[](3);
        calls[0] = _call(address(trigger), 0, TRIGGER_SELECTOR);
        calls[1] = _call(address(tailCode), 0, MANIFEST_PUBLISH_SELECTOR);
        calls[2] = _call(address(coreCode), 0, TRIGGER_SELECTOR);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.InvalidManifestTail.selector)
        );
        policy.validateTail(1, calls, false);
    }

    function testStandaloneManifestTailRequiresClassThreeAndIsolation() public {
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = _call(address(tailCode), 0, MANIFEST_PUBLISH_SELECTOR);
        policy.validateTail(3, calls, false);

        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.InvalidManifestTail.selector)
        );
        policy.validateTail(1, calls, false);

        calls = new GovernanceCall[](2);
        calls[0] = _call(address(coreCode), 0, TRIGGER_SELECTOR);
        calls[1] = _call(address(tailCode), 0, MANIFEST_PUBLISH_SELECTOR);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.InvalidManifestTail.selector)
        );
        policy.validateTail(3, calls, false);
    }

    function testTailRegistrationIsIsolatedClassTwoSelfCall() public {
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = _call(address(policy), 0, REGISTER_TAIL_SELECTOR);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.ManifestTailTriggerRegistrationNotIsolated.selector
            )
        );
        policy.validateTail(1, calls, false);
        policy.validateTail(2, calls, false);
    }

    function testPersistentManifestTailTriggerRejectsEIP7702DelegatedEOA() public {
        address delegatedEOA = address(0x770201);
        vm.etch(delegatedEOA, _eip7702Designation(address(trigger)));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidManifestTailTrigger.selector,
                delegatedEOA,
                TRIGGER_SELECTOR
            )
        );
        policy.appendTail(delegatedEOA, TRIGGER_SELECTOR, 0x0f);
    }

    function testManifestTailTriggerRejectsExecutorSelfTargets() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidManifestTailTrigger.selector,
                address(policy),
                REGISTER_TAIL_SELECTOR
            )
        );
        policy.appendTail(address(policy), REGISTER_TAIL_SELECTOR, 0x0f);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidManifestTailTrigger.selector,
                address(policy),
                SEAL_SELECTOR
            )
        );
        policy.appendTail(address(policy), SEAL_SELECTOR, 0x0f);
    }

    function testFreezeTailOverlapRequiresTerminalFreezeClassMask() public {
        StreamGovernanceBootstrapTriggerMock frozenFirst =
            new StreamGovernanceBootstrapTriggerMock();
        policy.forceFreeze(address(frozenFirst), TRIGGER_SELECTOR, true);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidManifestTailTrigger.selector,
                address(frozenFirst),
                TRIGGER_SELECTOR
            )
        );
        policy.appendTail(address(frozenFirst), TRIGGER_SELECTOR, 0x02);
        policy.appendTail(address(frozenFirst), TRIGGER_SELECTOR, 0x04);

        StreamGovernanceBootstrapTriggerMock tailFirst = new StreamGovernanceBootstrapTriggerMock();
        policy.appendTail(address(tailFirst), TRIGGER_SELECTOR, 0x02);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidManifestTailTrigger.selector,
                address(tailFirst),
                TRIGGER_SELECTOR
            )
        );
        policy.enableFreeze(address(tailFirst), TRIGGER_SELECTOR);

        StreamGovernanceBootstrapTriggerMock compatible = new StreamGovernanceBootstrapTriggerMock();
        policy.appendTail(address(compatible), TRIGGER_SELECTOR, 0x04);
        policy.enableFreeze(address(compatible), TRIGGER_SELECTOR);
        require(policy.frozen(address(compatible), TRIGGER_SELECTOR), "compatible overlap frozen");
    }

    function testFreezeRejectsImmutableManifestPublicationPair() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidManifestTailTrigger.selector,
                address(tailCode),
                MANIFEST_PUBLISH_SELECTOR
            )
        );
        policy.enableFreeze(address(tailCode), MANIFEST_PUBLISH_SELECTOR);
    }

    function testPersistentPolicyClassifierRejectsEIP7702DelegatedEOA() public {
        address delegatedEOA = address(0x770203);
        vm.etch(delegatedEOA, _eip7702Designation(address(trigger)));
        StreamGovernancePersistentPolicyHarness policyHarness =
            new StreamGovernancePersistentPolicyHarness();
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.TargetHasNoCode.selector, 0, delegatedEOA
            )
        );
        policyHarness.enableTightening(delegatedEOA, TRIGGER_SELECTOR);
    }

    function testGovernanceActionWindowRejectsUint64TimestampBoundaryAndOverflow() public {
        uint256 maxTimestamp = type(uint64).max;
        vm.warp(maxTimestamp);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceTimestampOverflow.selector, maxTimestamp
            )
        );
        StreamGovernanceBootstrap.validateActionWindow(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            type(uint64).max - 1,
            type(uint64).max
        );

        uint256 overflowTimestamp = maxTimestamp + 1;
        vm.warp(overflowTimestamp);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceTimestampOverflow.selector, overflowTimestamp
            )
        );
        StreamGovernanceBootstrap.validateActionWindow(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            type(uint64).max - 1,
            type(uint64).max
        );
    }

    function testGovernanceActionWindowPinsFullLifetimeHeadroomBeforeDelayedAddition() public {
        uint256 safeBoundary = uint256(type(uint64).max) - 365 days;
        vm.warp(safeBoundary);
        // The retained 365-day headroom proves this test narrowing is lossless.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 notBefore = uint64(safeBoundary + 48 hours);
        StreamGovernanceBootstrap.validateActionWindow(
            StreamGovernanceActionClasses.DELAYED_LOOSENING, notBefore, notBefore + 7 days
        );

        uint256 unsafeTimestamp = safeBoundary + 1;
        vm.warp(unsafeTimestamp);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceTimestampOverflow.selector, unsafeTimestamp
            )
        );
        StreamGovernanceBootstrap.validateActionWindow(
            StreamGovernanceActionClasses.DELAYED_LOOSENING, notBefore, notBefore + 7 days
        );
    }
}

contract StreamGovernanceModuleStatusClassifierTest is StreamGovernanceBootstrapTestBase {
    bytes4 private constant MODULE_STATUS_SELECTOR = 0x96a6e18b;
    address private constant MODULE = address(0xBEEF);

    StreamGovernanceBootstrapPolicyHarness private policy;
    StreamGovernanceModuleStatusRegistryMock private registry;
    StreamGovernanceBootstrapTriggerMock private tail;

    function setUp() public override {
        super.setUp();
        StreamGovernanceBootstrapTriggerMock core = new StreamGovernanceBootstrapTriggerMock();
        tail = new StreamGovernanceBootstrapTriggerMock();
        policy = new StreamGovernanceBootstrapPolicyHarness(address(core), address(tail));
        registry = new StreamGovernanceModuleStatusRegistryMock();
        policy.appendTail(address(registry), MODULE_STATUS_SELECTOR, 0x03);
    }

    function testCanonicalStatusDirectionClassifiesTighteningAndLoosening() public {
        policy.validateCalls(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            _calls(_statusData(ModuleRegistryStatus.DEPRECATED)),
            _callDatas(_statusData(ModuleRegistryStatus.DEPRECATED))
        );

        registry.setStatus(uint8(ModuleRegistryStatus.INCIDENT_REVOKED));
        policy.validateCalls(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            _calls(_statusData(ModuleRegistryStatus.DEPRECATED)),
            _callDatas(_statusData(ModuleRegistryStatus.DEPRECATED))
        );
    }

    function testImmediateStatusTriggerAdmitsExactFinalManifestTail() public view {
        bytes memory statusData = _statusData(ModuleRegistryStatus.DEPRECATED);
        bytes memory tailData = abi.encodeWithSelector(MANIFEST_PUBLISH_SELECTOR);
        GovernanceCall[] memory statusCalls = _calls(statusData);
        GovernanceCall[] memory calls = new GovernanceCall[](2);
        calls[0] = statusCalls[0];
        calls[1] = GovernanceCall({
            target: address(tail),
            value: 0,
            selector: MANIFEST_PUBLISH_SELECTOR,
            callDataHash: keccak256(tailData),
            scopeHash: bytes32(0),
            oldValueHash: bytes32(0),
            newValueHash: bytes32(0)
        });
        bytes[] memory callDatas = new bytes[](2);
        callDatas[0] = statusData;
        callDatas[1] = tailData;

        policy.validateCallsAndTail(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING, calls, callDatas
        );
    }

    function testWrongDirectionClassReverts() public {
        bytes memory data = _statusData(ModuleRegistryStatus.DEPRECATED);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.ModuleRegistryStatusActionClassMismatch.selector,
                address(registry),
                MODULE,
                uint8(ModuleRegistryStatus.ACTIVE),
                uint8(ModuleRegistryStatus.DEPRECATED),
                StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
                StreamGovernanceActionClasses.DELAYED_LOOSENING
            )
        );
        policy.validateCalls(
            StreamGovernanceActionClasses.DELAYED_LOOSENING, _calls(data), _callDatas(data)
        );
    }

    function testScheduleToExecuteStatusDriftFailsClosed() public {
        bytes memory data = _statusData(ModuleRegistryStatus.DEPRECATED);
        GovernanceCall[] memory calls = _calls(data);
        bytes[] memory callDatas = _callDatas(data);
        policy.validateCalls(StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING, calls, callDatas);

        registry.setStatus(uint8(ModuleRegistryStatus.DEPRECATED));
        _expectInvalidStatusCall(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING, calls, callDatas
        );

        registry.setStatus(uint8(ModuleRegistryStatus.INCIDENT_REVOKED));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.ModuleRegistryStatusActionClassMismatch.selector,
                address(registry),
                MODULE,
                uint8(ModuleRegistryStatus.INCIDENT_REVOKED),
                uint8(ModuleRegistryStatus.DEPRECATED),
                StreamGovernanceActionClasses.DELAYED_LOOSENING,
                StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING
            )
        );
        policy.validateCalls(StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING, calls, callDatas);
    }

    function testMalformedStatusCalldataFailsClosed() public {
        bytes memory wrongOffset = _statusData(ModuleRegistryStatus.DEPRECATED);
        assembly ("memory-safe") {
            mstore(add(wrongOffset, 0x84), 0x60)
        }
        _expectInvalidStatusData(wrongOffset);

        bytes memory missingTail = _statusData(ModuleRegistryStatus.DEPRECATED);
        assembly ("memory-safe") {
            mstore(missingTail, 164)
        }
        _expectInvalidStatusData(missingTail);

        bytes memory trailingByte =
            bytes.concat(_statusData(ModuleRegistryStatus.DEPRECATED), hex"00");
        _expectInvalidStatusData(trailingByte);

        bytes memory highAddress = _statusData(ModuleRegistryStatus.DEPRECATED);
        assembly ("memory-safe") {
            mstore(add(highAddress, 0x24), or(mload(add(highAddress, 0x24)), shl(160, 1)))
        }
        _expectInvalidStatusData(highAddress);

        bytes memory highStatus = _statusData(ModuleRegistryStatus.DEPRECATED);
        assembly ("memory-safe") {
            mstore(add(highStatus, 0x44), 4)
        }
        _expectInvalidStatusData(highStatus);

        bytes memory nonzeroPadding = _statusData(ModuleRegistryStatus.DEPRECATED);
        nonzeroPadding[nonzeroPadding.length - 1] = bytes1(0x01);
        _expectInvalidStatusData(nonzeroPadding);
    }

    function testModuleRecordGasReturndataAndCanonicalEncodingGriefFailsClosed() public {
        bytes memory data = _statusData(ModuleRegistryStatus.DEPRECATED);
        GovernanceCall[] memory calls = _calls(data);
        bytes[] memory callDatas = _callDatas(data);

        registry.setReturnMode(1);
        _expectInvalidStatusCall(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING, calls, callDatas
        );
        registry.setReturnMode(2);
        _expectGasExhaustedStatusCall(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING, calls, callDatas
        );
        registry.setReturnMode(3);
        _expectInvalidStatusCall(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING, calls, callDatas
        );
    }

    function testModuleRecordReadForwardsAvailableGas() public {
        registry.setReturnMode(4);
        bytes memory data = _statusData(ModuleRegistryStatus.DEPRECATED);

        policy.validateCalls(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING, _calls(data), _callDatas(data)
        );
    }

    function testRegisteredClassifierCodehashDriftFailsClosed() public {
        bytes32 expectedCodeHash = address(registry).codehash;
        vm.etch(address(registry), hex"60006000f3");
        bytes32 actualCodeHash = address(registry).codehash;
        bytes memory data = _statusData(ModuleRegistryStatus.DEPRECATED);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernancePolicyCodeHashMismatch.selector,
                address(registry),
                MODULE_STATUS_SELECTOR,
                expectedCodeHash,
                actualCodeHash
            )
        );
        policy.validateCalls(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING, _calls(data), _callDatas(data)
        );
    }

    function _statusData(ModuleRegistryStatus requestedStatus) private pure returns (bytes memory) {
        return abi.encodeWithSelector(
            MODULE_STATUS_SELECTOR, MODULE, requestedStatus, keccak256("reason"), "ipfs://reason"
        );
    }

    function _calls(bytes memory data) private view returns (GovernanceCall[] memory calls) {
        calls = new GovernanceCall[](1);
        calls[0] = GovernanceCall({
            target: address(registry),
            value: 0,
            selector: MODULE_STATUS_SELECTOR,
            callDataHash: keccak256(data),
            scopeHash: bytes32(0),
            oldValueHash: bytes32(0),
            newValueHash: bytes32(0)
        });
    }

    function _callDatas(bytes memory data) private pure returns (bytes[] memory callDatas) {
        callDatas = new bytes[](1);
        callDatas[0] = data;
    }

    function _expectInvalidStatusData(bytes memory data) private {
        _expectInvalidStatusCall(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING, _calls(data), _callDatas(data)
        );
    }

    function _expectInvalidStatusCall(
        uint8 actionClass,
        GovernanceCall[] memory calls,
        bytes[] memory callDatas
    ) private {
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidModuleRegistryStatusCall.selector,
                address(registry)
            )
        );
        policy.validateCalls(actionClass, calls, callDatas);
    }

    function _expectGasExhaustedStatusCall(
        uint8 actionClass,
        GovernanceCall[] memory calls,
        bytes[] memory callDatas
    ) private {
        (bool ok, bytes memory reason) = address(policy).call{ gas: 2_000_000 }(
            abi.encodeCall(
                StreamGovernanceBootstrapPolicyHarness.validateCalls,
                (actionClass, calls, callDatas)
            )
        );
        require(!ok, "gas-exhausting module record accepted");
        require(
            keccak256(reason)
                == keccak256(
                    abi.encodeWithSelector(
                        IStreamGovernanceExecutor.InvalidModuleRegistryStatusCall.selector,
                        address(registry)
                    )
                ),
            "unexpected gas-exhaustion failure"
        );
    }
}

contract StreamGovernanceRoleManagerClassifierTest is StreamGovernanceBootstrapTestBase {
    bytes4 private constant REGISTER_ROLE_MANAGER_SELECTOR =
        IStreamRoleRegistry.registerRoleManager.selector;
    address private constant ACCOUNT = address(0xBEEF);

    StreamGovernanceBootstrapPolicyHarness private policy;
    StreamGovernanceRoleManagerRegistryMock private registry;
    StreamGovernanceBootstrapTriggerMock private tail;

    function setUp() public override {
        super.setUp();
        StreamGovernanceBootstrapTriggerMock core = new StreamGovernanceBootstrapTriggerMock();
        tail = new StreamGovernanceBootstrapTriggerMock();
        policy = new StreamGovernanceBootstrapPolicyHarness(address(core), address(tail));
        registry = new StreamGovernanceRoleManagerRegistryMock();
        policy.bindRoleRegistry(address(registry));
    }

    function testCanonicalRoleManagerDirectionClassifiesDisableAndEnable() public view {
        bytes memory disableData = _managerData(false);
        policy.validateCalls(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            _calls(address(registry), 0, REGISTER_ROLE_MANAGER_SELECTOR, disableData),
            _callDatas(disableData)
        );

        bytes memory enableData = _managerData(true);
        policy.validateCalls(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            _calls(address(registry), 0, REGISTER_ROLE_MANAGER_SELECTOR, enableData),
            _callDatas(enableData)
        );
    }

    function testWrongRoleManagerDirectionClassReverts() public {
        bytes memory disableData = _managerData(false);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.RoleManagerConfigActionClassMismatch.selector,
                address(registry),
                ACCOUNT,
                false,
                StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
                StreamGovernanceActionClasses.DELAYED_LOOSENING
            )
        );
        policy.validateCalls(
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            _calls(address(registry), 0, REGISTER_ROLE_MANAGER_SELECTOR, disableData),
            _callDatas(disableData)
        );

        bytes memory enableData = _managerData(true);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.RoleManagerConfigActionClassMismatch.selector,
                address(registry),
                ACCOUNT,
                true,
                StreamGovernanceActionClasses.DELAYED_LOOSENING,
                StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING
            )
        );
        policy.validateCalls(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            _calls(address(registry), 0, REGISTER_ROLE_MANAGER_SELECTOR, enableData),
            _callDatas(enableData)
        );
    }

    function testMalformedRoleManagerCalldataAndValueFailClosed() public {
        bytes memory shortData = _managerData(false);
        assembly ("memory-safe") {
            mstore(shortData, 67)
        }
        _expectInvalidRoleManagerCall(0, shortData);

        bytes memory trailingData = bytes.concat(_managerData(false), hex"00");
        _expectInvalidRoleManagerCall(0, trailingData);

        bytes memory highAddress = _managerData(false);
        assembly ("memory-safe") {
            mstore(add(highAddress, 0x24), or(mload(add(highAddress, 0x24)), shl(160, 1)))
        }
        _expectInvalidRoleManagerCall(0, highAddress);

        bytes memory invalidBool = _managerData(false);
        assembly ("memory-safe") {
            mstore(add(invalidBool, 0x44), 2)
        }
        _expectInvalidRoleManagerCall(0, invalidBool);

        _expectInvalidRoleManagerCall(1, _managerData(false));
    }

    function testClassifierOnlyAppliesToBoundRegistryAndExactSelector() public {
        StreamGovernanceRoleManagerRegistryMock other =
            new StreamGovernanceRoleManagerRegistryMock();
        bytes memory data = _managerData(false);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.NotClassifiedTightening.selector,
                address(other),
                REGISTER_ROLE_MANAGER_SELECTOR
            )
        );
        policy.validateCalls(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            _calls(address(other), 0, REGISTER_ROLE_MANAGER_SELECTOR, data),
            _callDatas(data)
        );

        bytes memory unrelatedData =
            abi.encodeCall(StreamGovernanceRoleManagerRegistryMock.unrelatedRoleRegistryCall, ());
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.NotClassifiedTightening.selector,
                address(registry),
                StreamGovernanceRoleManagerRegistryMock.unrelatedRoleRegistryCall.selector
            )
        );
        policy.validateCalls(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            _calls(
                address(registry),
                0,
                StreamGovernanceRoleManagerRegistryMock.unrelatedRoleRegistryCall.selector,
                unrelatedData
            ),
            _callDatas(unrelatedData)
        );
    }

    function testRoleManagerDisableCannotAuthorizeUnsolicitedManifestTail() public {
        bytes memory managerData = _managerData(false);
        bytes memory tailData = abi.encodeWithSelector(MANIFEST_PUBLISH_SELECTOR);
        GovernanceCall[] memory managerCalls =
            _calls(address(registry), 0, REGISTER_ROLE_MANAGER_SELECTOR, managerData);
        GovernanceCall[] memory calls = new GovernanceCall[](2);
        calls[0] = managerCalls[0];
        calls[1] = GovernanceCall({
            target: address(tail),
            value: 0,
            selector: MANIFEST_PUBLISH_SELECTOR,
            callDataHash: keccak256(tailData),
            scopeHash: bytes32(0),
            oldValueHash: bytes32(0),
            newValueHash: bytes32(0)
        });
        bytes[] memory callDatas = new bytes[](2);
        callDatas[0] = managerData;
        callDatas[1] = tailData;

        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.InvalidManifestTail.selector)
        );
        policy.validateCallsAndTail(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING, calls, callDatas
        );
    }

    function _managerData(bool enabled) private pure returns (bytes memory) {
        return abi.encodeWithSelector(REGISTER_ROLE_MANAGER_SELECTOR, ACCOUNT, enabled);
    }

    function _calls(address target, uint256 value, bytes4 selector, bytes memory data)
        private
        pure
        returns (GovernanceCall[] memory calls)
    {
        calls = new GovernanceCall[](1);
        calls[0] = GovernanceCall({
            target: target,
            value: value,
            selector: selector,
            callDataHash: keccak256(data),
            scopeHash: bytes32(0),
            oldValueHash: bytes32(0),
            newValueHash: bytes32(0)
        });
    }

    function _callDatas(bytes memory data) private pure returns (bytes[] memory callDatas) {
        callDatas = new bytes[](1);
        callDatas[0] = data;
    }

    function _expectInvalidRoleManagerCall(uint256 value, bytes memory data) private {
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidRoleManagerConfigCall.selector, address(registry)
            )
        );
        policy.validateCalls(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            _calls(address(registry), value, REGISTER_ROLE_MANAGER_SELECTOR, data),
            _callDatas(data)
        );
    }
}

contract StreamGovernanceBootstrapCeremonyTest is StreamGovernanceBootstrapTestBase {
    bytes32 private constant MANIFEST_PUBLISHED_TOPIC =
        keccak256("StreamSystemManifestPublished(uint16,bytes32,address,bytes32)");
    bytes32 private constant BOOTSTRAP_SEALED_TOPIC = keccak256(
        "SystemManifestBootstrapSealed(uint16,bytes32,uint256,address,bytes32,bytes32)"
    );
    bytes32 private constant ACTION_EXECUTED_TOPIC = keccak256(
        "GovernanceActionExecuted(uint16,bytes32,uint8,address,uint256,bytes4,bytes32,bytes32,bytes32,bytes32,address,bytes32)"
    );

    function invokeScheduleBootstrap(
        BootstrapArtifacts memory artifacts,
        uint8 actionClass,
        bytes32 salt
    ) external returns (bytes32) {
        require(msg.sender == address(this), "self only");
        return _scheduleBootstrap(artifacts, actionClass, salt);
    }

    function testBindPopulatesThenSealPublishesTailBeforeSealAndExecutionEvents() public {
        StreamRoleRegistry roleRegistry = new StreamRoleRegistry(address(this));
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        BootstrapStateCommitment memory beforeState = _bootstrapState(artifacts.executor);
        require(beforeState.bound && !beforeState.isSealed, "bound before seal");
        require(beforeState.triggerCount == 1, "bound trigger count");
        require(beforeState.triggerSetHash == artifacts.triggerSetHash, "bound trigger hash");
        require(beforeState.inventoryStateRoot == artifacts.inventoryRoot, "bound inventory root");
        require(beforeState.inventoryLeafCount == artifacts.inventoryCount, "bound inventory count");

        vm.recordLogs();
        bytes32 actionId = this.invokeSeal(artifacts, address(this));
        Vm.Log[] memory logs = vm.getRecordedLogs();
        uint256 publishIndex = type(uint256).max;
        uint256 sealIndex = type(uint256).max;
        uint256 executeIndex = type(uint256).max;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length == 0) continue;
            if (logs[i].topics[0] == MANIFEST_PUBLISHED_TOPIC) publishIndex = i;
            if (logs[i].topics[0] == BOOTSTRAP_SEALED_TOPIC) sealIndex = i;
            if (logs[i].topics[0] == ACTION_EXECUTED_TOPIC) executeIndex = i;
        }
        require(publishIndex < sealIndex, "manifest publication must precede seal event");
        require(sealIndex < executeIndex, "seal event must precede execution event");

        BootstrapStateCommitment memory afterState = _bootstrapState(artifacts.executor);
        require(afterState.bound && afterState.isSealed, "sealed state");
        require(afterState.sealedPayloadPointer == artifacts.payloadRoot, "sealed payload pointer");
        require(
            artifacts.manifest.streamSystemManifestPointer() == artifacts.payloadRoot,
            "published payload pointer"
        );
        require(artifacts.manifest.streamSystemManifestPointerCount() == 1, "publication count");
        GovernanceAction memory action = artifacts.executor.governanceAction(actionId);
        require(action.status == GovernanceActionStatus.EXECUTED, "seal action executed");
    }

    function testSealedStateReadUsesValidatedInventorySnapshotWithoutExternalReads() public {
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        this.invokeSeal(artifacts, address(this));
        artifacts.core.setOversizedPointerReturn(true);
        artifacts.registry.setOversizedModuleRecordReturn(true);

        BootstrapStateCommitment memory state = _bootstrapState(artifacts.executor);
        require(state.bound && state.isSealed, "sealed snapshot state");
        require(state.inventoryStateRoot == artifacts.inventoryRoot, "sealed snapshot root");
        require(state.inventoryLeafCount == artifacts.inventoryCount, "sealed snapshot count");
    }

    function testSealForwardsAvailableGasForCanonicalInventoryAndPublicationReads() public {
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        artifacts.registry.setInterfaceGasToBurn(45_000);
        artifacts.registry.setModuleCountGasToBurn(250_000);
        artifacts.manifest.setPublicationCountGasToBurn(45_000);

        this.invokeSeal(artifacts, address(this));

        BootstrapStateCommitment memory state = _bootstrapState(artifacts.executor);
        require(state.isSealed, "high-gas canonical seal rejected");
        require(
            artifacts.manifest.streamSystemManifestPointerCount() == 1,
            "high-gas publication missing"
        );
    }

    function testSealRejectsOversizedManifestPublicationCountReturndata() public {
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        artifacts.manifest.setOversizedPointerCountReturn(true);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        this.invokeSeal(artifacts, address(this));
    }

    function testSealAcceptsLiveMutableNonSystemPointer() public {
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        (
            address target,
            bytes32 codeHash,
            bool frozen,
            bytes32 moduleType,
            bytes4 interfaceId,
            address registry,
            uint8 status,
            bytes32 moduleManifestHash,
            bytes32 deploymentManifestHash,
            uint64 revision
        ) = artifacts.core.getSatellitePointer(BOOTSTRAP_POINTER_TYPE);
        require(target == address(artifacts.mutablePointerModule), "mutable pointer target");
        require(codeHash == target.codehash, "mutable pointer code hash");
        require(!frozen, "non-system pointer remains mutable");
        require(moduleType == BOOTSTRAP_MUTABLE_MODULE_TYPE, "mutable pointer module type");
        require(interfaceId == BOOTSTRAP_MODULE_INTERFACE_ID, "mutable pointer interface");
        require(registry == address(artifacts.registry), "mutable pointer registry");
        require(status == 1, "mutable pointer active");
        require(moduleManifestHash != bytes32(0), "mutable pointer module manifest");
        require(deploymentManifestHash != bytes32(0), "mutable pointer deployment manifest");
        require(revision == 1, "mutable pointer revision");
        this.invokeSeal(artifacts, address(this));
    }

    function testSealRejectsMissingSystemManifestPointerEvenWhenCommitted() public {
        _expectFaultedInventorySeal(BOOTSTRAP_FAULT_MISSING_SYSTEM_POINTER);
    }

    function testSealRejectsWrongSystemManifestTargetEvenWhenCommitted() public {
        _expectFaultedInventorySeal(BOOTSTRAP_FAULT_WRONG_SYSTEM_TARGET);
    }

    function testSealRejectsUnfrozenSystemManifestPointerEvenWhenCommitted() public {
        _expectFaultedInventorySeal(BOOTSTRAP_FAULT_UNFROZEN_SYSTEM_POINTER);
    }

    function testSealRejectsIndependentPointerTargetCodeDriftWithoutCommitmentDrift() public {
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        vm.etch(address(artifacts.mutablePointerModule), hex"60006000f3");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        this.invokeSeal(artifacts, address(this));
    }

    function testSealRejectsRegistryOnlyModuleCodeDriftWithoutCommitmentDrift() public {
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        vm.etch(address(artifacts.registryOnlyModule), hex"60006000f3");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        this.invokeSeal(artifacts, address(this));
    }

    function testSealRejectsCompatibleRegistryRuntimeDriftBeforeInventoryReads() public {
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        StreamGovernanceBootstrapRegistryRuntimeDriftMock replacement = new StreamGovernanceBootstrapRegistryRuntimeDriftMock(
            keccak256("bootstrap-registry-manifest"), "ipfs://bootstrap-registry", 1
        );
        bytes32 expectedCodeHash = address(artifacts.registry).codehash;
        vm.etch(address(artifacts.registry), address(replacement).code);
        require(
            address(artifacts.registry).codehash != expectedCodeHash, "registry runtime drifted"
        );
        require(
            artifacts.registry.supportsInterface(type(IStreamModuleRegistry).interfaceId),
            "replacement remains registry-compatible"
        );
        require(artifacts.registry.moduleCount() == 3, "replacement preserves storage layout");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        this.invokeSeal(artifacts, address(this));
    }

    function testSealRejectsEIP7702DelegatedPointerTarget() public {
        _expectFaultedInventorySeal(BOOTSTRAP_FAULT_DELEGATED_POINTER_TARGET);
    }

    function testSealRejectsEIP7702DelegatedRegistryOnlyModule() public {
        _expectFaultedInventorySeal(BOOTSTRAP_FAULT_DELEGATED_REGISTRY_ONLY_MODULE);
    }

    function testSealRejectsInactiveModuleEvenWhenCommitted() public {
        _expectFaultedInventorySeal(BOOTSTRAP_FAULT_INACTIVE_MODULE);
    }

    function testSealRejectsFalseRegistryEligibilityWithoutCommitmentDrift() public {
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        artifacts.registry.setForceIneligible(true);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        this.invokeSeal(artifacts, address(this));
    }

    function testSealRejectsEmptyRegistryManifestEvenWhenCommitted() public {
        _expectFaultedInventorySeal(BOOTSTRAP_FAULT_EMPTY_REGISTRY_MANIFEST);
    }

    function testSealRejectsPointerRegistryRecordMismatchEvenWhenCommitted() public {
        _expectFaultedInventorySeal(BOOTSTRAP_FAULT_POINTER_RECORD_MISMATCH);
    }

    function testSealRejectsModuleLiveInterfaceMismatchEvenWhenCommitted() public {
        _expectFaultedInventorySeal(BOOTSTRAP_FAULT_MODULE_INTERFACE_MISMATCH);
    }

    function testSealRejectsPointerTargetMissingFromRegistryEnumerationEvenWhenCommitted() public {
        _expectFaultedInventorySeal(BOOTSTRAP_FAULT_POINTER_NOT_ENUMERATED);
    }

    function testSealRejectsDuplicateRegistryModuleEnumerationEvenWhenCommitted() public {
        _expectFaultedInventorySeal(BOOTSTRAP_FAULT_DUPLICATE_MODULE_ENUMERATION);
    }

    function testSealPreflightRejectsInflatedModuleCountBeforeEnumerationWalk() public {
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        artifacts.registry.setReportedModuleCountOffset(1);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        this.invokeSeal(artifacts, address(this));
    }

    function testSealPreflightRejectsRegistryModuleCountAboveAbsoluteCap() public {
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        artifacts.registry.setReportedModuleCountOffset(126);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        this.invokeSeal(artifacts, address(this));
    }

    function testSealPreflightRejectsAllTrueRegistryBeforeEnumerationWalk() public {
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        artifacts.registry.setAllInterfaces(true);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        this.invokeSeal(artifacts, address(this));
    }

    function testSealRejectsOversizedCorePointerReturndataWithinBoundedRead() public {
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        artifacts.core.setOversizedPointerReturn(true);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        this.invokeSeal(artifacts, address(this));
    }

    function testSealRejectsOversizedModuleRecordReturndataWithinBoundedRead() public {
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        artifacts.registry.setOversizedModuleRecordReturn(true);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        this.invokeSeal(artifacts, address(this));
    }

    function testSealRejectsContextVaryingRepeatedModuleRecordReads() public {
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        // The first access to this unrelated address is cold; the pointer-side
        // record therefore reports the cold EXTCODEHASH cost while the enumerated
        // record sees the warmed address and reports the lower warm cost. Both records
        // are independently live-valid, so only exact repeated-read equality
        // closes this context-varying registry attack.
        artifacts.registry
            .setWarmthVariant(address(artifacts.mutablePointerModule), address(0xC01DC0DE));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        this.invokeSeal(artifacts, address(this));
    }

    function _expectFaultedInventorySeal(uint8 fault) private {
        BootstrapArtifacts memory artifacts = _deployBoundBootstrapWithFault(address(this), fault);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        this.invokeSeal(artifacts, address(this));
    }

    function testRevertWhenManifestTailFailsRollsBackSealWithoutSealOrExecutionEvents() public {
        StreamRoleRegistry roleRegistry = new StreamRoleRegistry(address(this));
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        artifacts.manifest.setFailPublication(true);

        vm.recordLogs();
        vm.expectRevert(bytes("publication failed"));
        this.invokeSeal(artifacts, address(this));
        Vm.Log[] memory logs = vm.getRecordedLogs();
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length == 0) continue;
            require(logs[i].topics[0] != BOOTSTRAP_SEALED_TOPIC, "seal event on failed tail");
            require(logs[i].topics[0] != ACTION_EXECUTED_TOPIC, "execution event on failed tail");
        }

        BootstrapStateCommitment memory state = _bootstrapState(artifacts.executor);
        require(state.bound && !state.isSealed, "seal rolled back");
        require(state.sealedPayloadPointer == address(0), "payload pointer rolled back");
        require(artifacts.executor.pendingScheduledActionCount() == 0, "schedule rolled back");
        require(artifacts.manifest.streamSystemManifestPointerCount() == 0, "tail rolled back");
    }

    function testPrebindAndPresealForbiddenPaths() public {
        StreamRoleRegistry roleRegistry = new StreamRoleRegistry(address(this));
        StreamGovernanceExecutor executor = new StreamGovernanceExecutor(address(this));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.SystemManifestBootstrapNotBound.selector
            )
        );
        executor.terminalFreezeVetoGuardian(bytes32(0));
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = abi.encodeWithSelector(bytes4(0x12345678));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.SystemManifestBootstrapNotBound.selector
            )
        );
        executor.publishGovernanceCallData(callDatas);

        GovernanceCall[] memory emptyCalls = new GovernanceCall[](0);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.SystemManifestBootstrapNotBound.selector
            )
        );
        executor.scheduleGovernanceBatch(
            1,
            emptyCalls,
            bytes32(0),
            bytes32(0),
            bytes32(0),
            uint64(block.timestamp + 48 hours),
            uint64(block.timestamp + 9 days),
            bytes32(0),
            "",
            bytes32(0)
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceSelfCallContextRequired.selector
            )
        );
        executor.registerProposer(address(0xA11CE), true);

        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceSelfCallContextRequired.selector
            )
        );
        artifacts.executor.registerProposer(address(0xA11CE), true);

        bytes memory callData =
            abi.encodeWithSelector(StreamGovernanceBootstrapRegistryMock.moduleCount.selector);
        callDatas[0] = callData;
        artifacts.executor.publishGovernanceCallData(callDatas);
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = GovernanceCall({
            target: address(artifacts.registry),
            value: 0,
            selector: StreamGovernanceBootstrapRegistryMock.moduleCount.selector,
            callDataHash: keccak256(callData),
            scopeHash: keccak256("unrelated-scope"),
            oldValueHash: keccak256("unrelated-old"),
            newValueHash: keccak256("unrelated-new")
        });
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _derivedHashes(artifacts.executor, calls);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.BootstrapActionNotPermitted.selector)
        );
        vm.prank(artifacts.bootstrapAuthority);
        artifacts.executor
            .scheduleGovernanceBatch(
                1,
                calls,
                scopeHash,
                oldValueHash,
                newValueHash,
                uint64(block.timestamp + 48 hours),
                uint64(block.timestamp + 9 days),
                keccak256("unrelated"),
                "ipfs://unrelated",
                artifacts.manifestHash
            );
    }

    function testPresealPendingActionCancellationReturnsCountToZeroAndAllowsReschedule() public {
        StreamRoleRegistry roleRegistry = new StreamRoleRegistry(address(this));
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        bytes32 actionId = this.invokeScheduleBootstrap(
            artifacts, StreamGovernanceActionClasses.DELAYED_LOOSENING, keccak256("cancel-one")
        );
        require(artifacts.executor.pendingScheduledActionCount() == 1, "pending after schedule");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.PendingGovernanceActionExists.selector, 1
            )
        );
        this.invokeScheduleBootstrap(
            artifacts, StreamGovernanceActionClasses.DELAYED_LOOSENING, keccak256("cancel-two")
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceActorNotAuthorized.selector, address(this)
            )
        );
        artifacts.executor.cancelGovernanceAction(actionId, keccak256("deployer-rejected"));
        vm.prank(artifacts.bootstrapAuthority);
        artifacts.executor.cancelGovernanceAction(actionId, keccak256("cancelled"));
        require(artifacts.executor.pendingScheduledActionCount() == 0, "pending after cancel");
        GovernanceAction memory cancelled = artifacts.executor.governanceAction(actionId);
        require(cancelled.status == GovernanceActionStatus.CANCELLED, "cancelled status");

        bytes32 replacement = this.invokeScheduleBootstrap(
            artifacts,
            StreamGovernanceActionClasses.DELAYED_LOOSENING,
            keccak256("cancel-replacement")
        );
        require(artifacts.executor.pendingScheduledActionCount() == 1, "replacement pending");
        vm.prank(artifacts.bootstrapAuthority);
        artifacts.executor.cancelGovernanceAction(replacement, keccak256("cleanup"));
        require(artifacts.executor.pendingScheduledActionCount() == 0, "replacement cleanup");
    }

    function testPresealTerminalVetoReturnsPendingCountToZero() public {
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        address guardian = artifacts.initialGuardians[0];
        bytes32 actionId = this.invokeScheduleBootstrap(
            artifacts, StreamGovernanceActionClasses.TERMINAL_FREEZE, keccak256("veto")
        );
        GovernanceAction memory scheduled = artifacts.executor.governanceAction(actionId);
        bytes32 targetScope = keccak256(abi.encode("bootstrap-trigger-scope", keccak256("veto")));
        (address resolvedGuardian, uint64 vetoDeadline) =
            artifacts.executor.terminalFreezeVetoGuardian(targetScope);
        require(resolvedGuardian == address(0), "plural guardian sentinel");
        require(vetoDeadline > block.timestamp, "bound preseal veto deadline");
        require(artifacts.executor.pendingScheduledActionCount() == 1, "pending before veto");

        vm.prank(guardian);
        artifacts.executor.vetoTerminalFreeze(actionId, keccak256("guardian-veto"));
        require(artifacts.executor.pendingScheduledActionCount() == 0, "pending after veto");
        GovernanceAction memory vetoed = artifacts.executor.governanceAction(actionId);
        require(vetoed.status == GovernanceActionStatus.VETOED, "vetoed status");
    }

    function testBoundRoleRegistryCodeHashDriftFailsStatusAndPresealSchedule() public {
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        bytes32 expectedCodeHash = address(artifacts.roleRegistry).codehash;
        vm.etch(address(artifacts.roleRegistry), hex"60006000fd");
        bytes32 actualCodeHash = address(artifacts.roleRegistry).codehash;

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.RoleRegistryCodeHashMismatch.selector,
                expectedCodeHash,
                actualCodeHash
            )
        );
        artifacts.executor.terminalFreezeVetoGuardian(bytes32(0));

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.RoleRegistryCodeHashMismatch.selector,
                expectedCodeHash,
                actualCodeHash
            )
        );
        this.invokeScheduleBootstrap(
            artifacts, StreamGovernanceActionClasses.DELAYED_LOOSENING, keccak256("drift")
        );
    }

    function testPresealVirtualExpiryBlocksSecondActionUntilMaterialized() public {
        StreamRoleRegistry roleRegistry = new StreamRoleRegistry(address(this));
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        bytes32 actionId = this.invokeScheduleBootstrap(
            artifacts, StreamGovernanceActionClasses.DELAYED_LOOSENING, keccak256("expiry")
        );
        GovernanceAction memory scheduled = artifacts.executor.governanceAction(actionId);
        vm.warp(uint256(scheduled.expiresAfter) + 1);

        GovernanceAction memory virtuallyExpired = artifacts.executor.governanceAction(actionId);
        require(virtuallyExpired.status == GovernanceActionStatus.EXPIRED, "virtual expiry status");
        require(
            artifacts.executor.pendingScheduledActionCount() == 1, "virtual expiry remains pending"
        );
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.PendingGovernanceActionExists.selector, 1
            )
        );
        this.invokeScheduleBootstrap(
            artifacts, StreamGovernanceActionClasses.DELAYED_LOOSENING, keccak256("expiry-two")
        );

        artifacts.executor.materializeExpiredAction(actionId);
        require(artifacts.executor.pendingScheduledActionCount() == 0, "pending after expiry");
        GovernanceAction memory materialized = artifacts.executor.governanceAction(actionId);
        require(materialized.status == GovernanceActionStatus.EXPIRED, "materialized expiry status");
    }

    function testWrongActorCannotScheduleButStrangerCanExecuteAuthorityProposedAction() public {
        StreamRoleRegistry roleRegistry = new StreamRoleRegistry(address(this));
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        bytes32 salt = keccak256("permissionless-preseal-execution");
        (GovernanceCall[] memory calls, bytes[] memory callDatas) =
            _bootstrapTriggerBatch(artifacts, salt);
        vm.prank(artifacts.bootstrapAuthority);
        artifacts.executor.publishGovernanceCallData(callDatas);
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _derivedHashes(artifacts.executor, calls);
        uint64 notBefore = uint64(block.timestamp) + 48 hours;
        uint64 expiresAfter = notBefore + 7 days;
        address stranger = address(0xBAD1);
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceActorNotAuthorized.selector, stranger
            )
        );
        artifacts.executor
            .scheduleGovernanceBatch(
                StreamGovernanceActionClasses.DELAYED_LOOSENING,
                calls,
                scopeHash,
                oldValueHash,
                newValueHash,
                notBefore,
                expiresAfter,
                keccak256("wrong-actor"),
                "ipfs://wrong-actor",
                artifacts.manifestHash
            );

        bytes32 actionId = this.invokeScheduleBootstrap(
            artifacts, StreamGovernanceActionClasses.DELAYED_LOOSENING, salt
        );
        GovernanceAction memory action = artifacts.executor.governanceAction(actionId);
        vm.warp(action.notBefore);
        vm.prank(stranger);
        artifacts.executor.executeGovernanceBatch(actionId, calls, callDatas);
        require(artifacts.trigger.value() == uint256(salt), "stranger execution result");
        require(artifacts.executor.pendingScheduledActionCount() == 0, "stranger execution pending");
    }

    function testSecondSealRevertsInsideGovernanceSelfCall() public {
        StreamRoleRegistry roleRegistry = new StreamRoleRegistry(address(this));
        BootstrapArtifacts memory artifacts = _deploySealedExecutor(address(this));
        bytes memory callData = abi.encodeCall(artifacts.executor.sealSystemManifestBootstrap, ());
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = GovernanceCall({
            target: address(artifacts.executor),
            value: 0,
            selector: artifacts.executor.sealSystemManifestBootstrap.selector,
            callDataHash: keccak256(callData),
            scopeHash: keccak256("second-seal-scope"),
            oldValueHash: keccak256("second-seal-old"),
            newValueHash: keccak256("second-seal-new")
        });
        artifacts.executor.publishGovernanceCallData(callDatas);
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _derivedHashes(artifacts.executor, calls);
        uint64 notBefore = uint64(block.timestamp) + 48 hours;
        uint64 expiresAfter = notBefore + 7 days;
        bytes32 actionId = artifacts.executor
            .scheduleGovernanceBatch(
                StreamGovernanceActionClasses.POINTER_REPLACEMENT,
                calls,
                scopeHash,
                oldValueHash,
                newValueHash,
                notBefore,
                expiresAfter,
                keccak256("second-seal"),
                "ipfs://second-seal",
                artifacts.manifestHash
            );
        vm.warp(notBefore);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.SystemManifestBootstrapAlreadySealed.selector
            )
        );
        artifacts.executor.executeGovernanceBatch(actionId, calls, callDatas);
    }

    function testSealBatchRejectsAnyThirdCall() public {
        StreamRoleRegistry roleRegistry = new StreamRoleRegistry(address(this));
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        bytes[] memory callDatas = new bytes[](3);
        callDatas[0] = abi.encodeCall(artifacts.executor.sealSystemManifestBootstrap, ());
        callDatas[1] = abi.encodeCall(artifacts.trigger.bootstrapWrite, (uint256(1)));
        callDatas[2] = abi.encodeWithSelector(MANIFEST_PUBLISH_SELECTOR, artifacts.payloadRoot);
        GovernanceCall[] memory calls = new GovernanceCall[](3);
        calls[0] = _governanceCall(
            address(artifacts.executor),
            artifacts.executor.sealSystemManifestBootstrap.selector,
            callDatas[0],
            keccak256("third-call-seal")
        );
        calls[1] = _governanceCall(
            address(artifacts.trigger),
            StreamGovernanceBootstrapTriggerMock.bootstrapWrite.selector,
            callDatas[1],
            keccak256("third-call-trigger")
        );
        calls[2] = _governanceCall(
            address(artifacts.manifest),
            MANIFEST_PUBLISH_SELECTOR,
            callDatas[2],
            keccak256("third-call-tail")
        );
        artifacts.executor.publishGovernanceCallData(callDatas);
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _derivedHashes(artifacts.executor, calls);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.BootstrapActionNotPermitted.selector)
        );
        vm.prank(artifacts.bootstrapAuthority);
        artifacts.executor
            .scheduleGovernanceBatch(
                StreamGovernanceActionClasses.DELAYED_LOOSENING,
                calls,
                scopeHash,
                oldValueHash,
                newValueHash,
                uint64(block.timestamp) + 48 hours,
                uint64(block.timestamp) + 9 days,
                keccak256("third-call"),
                "ipfs://third-call",
                artifacts.manifestHash
            );
    }

    function testPresealSchedulingRejectsCoreSatelliteAndTriggerCodehashDrift() public {
        StreamRoleRegistry roleRegistry = new StreamRoleRegistry(address(this));
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        vm.etch(address(artifacts.core), hex"00");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        this.invokeScheduleBootstrap(
            artifacts, StreamGovernanceActionClasses.DELAYED_LOOSENING, keccak256("core-drift")
        );

        artifacts = _deployBoundBootstrap(address(this));
        vm.etch(address(artifacts.manifest), hex"00");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        this.invokeScheduleBootstrap(
            artifacts, StreamGovernanceActionClasses.DELAYED_LOOSENING, keccak256("satellite-drift")
        );

        artifacts = _deployBoundBootstrap(address(this));
        bytes32 expectedCodeHash = address(artifacts.trigger).codehash;
        vm.etch(address(artifacts.trigger), hex"00");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.ManifestTailCodeHashMismatch.selector,
                expectedCodeHash,
                address(artifacts.trigger).codehash
            )
        );
        this.invokeScheduleBootstrap(
            artifacts, StreamGovernanceActionClasses.DELAYED_LOOSENING, keccak256("trigger-drift")
        );
    }

    function testPresealExecutionRejectsCoreSatelliteAndTriggerCodehashDrift() public {
        _assertExecutionCodehashDrift(0, keccak256("execute-core-drift"));
        _assertExecutionCodehashDrift(1, keccak256("execute-satellite-drift"));
        _assertExecutionCodehashDrift(2, keccak256("execute-trigger-drift"));
    }

    function _assertExecutionCodehashDrift(uint8 driftKind, bytes32 salt) private {
        BootstrapArtifacts memory artifacts = _deployBoundBootstrap(address(this));
        bytes32 actionId = this.invokeScheduleBootstrap(
            artifacts, StreamGovernanceActionClasses.DELAYED_LOOSENING, salt
        );
        (GovernanceCall[] memory calls, bytes[] memory callDatas) =
            _bootstrapTriggerBatch(artifacts, salt);
        GovernanceAction memory action = artifacts.executor.governanceAction(actionId);
        vm.warp(action.notBefore);
        if (driftKind == 0) {
            vm.etch(address(artifacts.core), hex"00");
            vm.expectRevert(
                abi.encodeWithSelector(
                    IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
                )
            );
        } else if (driftKind == 1) {
            vm.etch(address(artifacts.manifest), hex"00");
            vm.expectRevert(
                abi.encodeWithSelector(
                    IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
                )
            );
        } else {
            bytes32 expectedCodeHash = address(artifacts.trigger).codehash;
            vm.etch(address(artifacts.trigger), hex"00");
            vm.expectRevert(
                abi.encodeWithSelector(
                    IStreamGovernanceExecutor.ManifestTailCodeHashMismatch.selector,
                    expectedCodeHash,
                    address(artifacts.trigger).codehash
                )
            );
        }
        artifacts.executor.executeGovernanceBatch(actionId, calls, callDatas);
    }

    function _governanceCall(address target, bytes4 selector, bytes memory callData, bytes32 salt)
        private
        pure
        returns (GovernanceCall memory)
    {
        return GovernanceCall({
            target: target,
            value: 0,
            selector: selector,
            callDataHash: keccak256(callData),
            scopeHash: keccak256(abi.encode("call-scope", salt)),
            oldValueHash: keccak256(abi.encode("call-old", salt)),
            newValueHash: keccak256(abi.encode("call-new", salt))
        });
    }

    function _bootstrapTriggerBatch(BootstrapArtifacts memory artifacts, bytes32 salt)
        private
        pure
        returns (GovernanceCall[] memory calls, bytes[] memory callDatas)
    {
        bytes memory callData = abi.encodeCall(artifacts.trigger.bootstrapWrite, (uint256(salt)));
        callDatas = new bytes[](1);
        callDatas[0] = callData;
        calls = new GovernanceCall[](1);
        calls[0] = GovernanceCall({
            target: address(artifacts.trigger),
            value: 0,
            selector: StreamGovernanceBootstrapTriggerMock.bootstrapWrite.selector,
            callDataHash: keccak256(callData),
            scopeHash: keccak256(abi.encode("bootstrap-trigger-scope", salt)),
            oldValueHash: keccak256(abi.encode("bootstrap-trigger-old", salt)),
            newValueHash: keccak256(abi.encode("bootstrap-trigger-new", salt))
        });
    }

    function _scheduleBootstrap(
        BootstrapArtifacts memory artifacts,
        uint8 actionClass,
        bytes32 salt
    ) private returns (bytes32 actionId) {
        (GovernanceCall[] memory calls, bytes[] memory callDatas) =
            _bootstrapTriggerBatch(artifacts, salt);
        artifacts.executor.publishGovernanceCallData(callDatas);
        (bytes32 scopeHash, bytes32 oldValueHash, bytes32 newValueHash) =
            _derivedHashes(artifacts.executor, calls);
        uint64 notBefore = uint64(block.timestamp) + artifacts.executor.minimumDelay(actionClass);
        uint64 expiresAfter = notBefore + 7 days;
        vm.prank(artifacts.bootstrapAuthority);
        actionId = artifacts.executor
            .scheduleGovernanceBatch(
                actionClass,
                calls,
                scopeHash,
                oldValueHash,
                newValueHash,
                notBefore,
                expiresAfter,
                keccak256(abi.encode("bootstrap-trigger-reason", salt)),
                "ipfs://bootstrap-trigger",
                artifacts.manifestHash
            );
    }
}

abstract contract StreamGovernanceBootstrapColdSealGasTestBase is
    StreamGovernanceBootstrapTestBase
{
    uint256 private constant MAX_TRIGGER_ROWS = 128;
    uint256 private constant COLD_SEAL_GAS_CEILING = 24_000_000;

    event ColdBootstrapSealExecutionGas(
        bytes32 indexed profile, uint256 gasUsed, uint256 inventoryLeaves
    );

    BootstrapArtifacts private _coldArtifacts;
    ScheduledBootstrapSeal private _coldScheduled;
    bytes32 private _coldProfile;

    function _stageColdSeal(bytes32 profile, uint256 pointerCount, uint256[] memory moduleCounts)
        internal
    {
        PayloadFixture memory payload = _uniformPayload(32, uint32(MAX_CHUNK_BYTES));
        BootstrapArtifacts memory artifacts = _deployScaledBoundBootstrap(
            address(this),
            pointerCount,
            moduleCounts,
            2_048,
            payload.root,
            payload.manifestHash,
            MAX_TRIGGER_ROWS
        );
        ScheduledBootstrapSeal memory scheduled = _scheduleBootstrapSeal(artifacts, address(this));
        _coldArtifacts = artifacts;
        _coldScheduled = scheduled;
        _coldProfile = profile;
    }

    function _measureColdSealExecution() internal {
        vm.warp(_coldScheduled.notBefore);
        GovernanceCall[] memory calls = _coldScheduled.calls;
        bytes[] memory callDatas = _coldScheduled.callDatas;
        bytes32 actionId = _coldScheduled.actionId;
        StreamGovernanceExecutor executor = _coldArtifacts.executor;
        address bootstrapAuthority = _coldArtifacts.bootstrapAuthority;
        uint256 inventoryCount = _coldArtifacts.inventoryCount;

        uint256 gasBefore = gasleft();
        vm.prank(bootstrapAuthority);
        executor.executeGovernanceBatch(actionId, calls, callDatas);
        uint256 gasUsed = gasBefore - gasleft();
        emit ColdBootstrapSealExecutionGas(_coldProfile, gasUsed, inventoryCount);
        require(
            inventoryCount <= 80 && gasUsed <= COLD_SEAL_GAS_CEILING,
            "cold bootstrap seal execution gas envelope"
        );
    }
}

contract StreamGovernanceBootstrapActual72ColdSealGasTest is
    StreamGovernanceBootstrapColdSealGasTestBase
{
    function setUp() public override {
        super.setUp();
        uint256[] memory moduleCounts = new uint256[](1);
        moduleCounts[0] = 60;
        _stageColdSeal(keccak256("ACTUAL_72_LEAF_MAX_TRIGGER_PROFILE"), 11, moduleCounts);
    }

    function testActual72LeafProfileMaximumTriggersPayloadAndURIsFitsColdSealEnvelope() public {
        _measureColdSealExecution();
    }
}

contract StreamGovernanceBootstrapP32M47ColdSealGasTest is
    StreamGovernanceBootstrapColdSealGasTestBase
{
    function setUp() public override {
        super.setUp();
        uint256[] memory moduleCounts = new uint256[](1);
        moduleCounts[0] = 47;
        _stageColdSeal(keccak256("P32_R1_M47_MAX_TRIGGER_PROFILE"), 32, moduleCounts);
    }

    function testP32R1M47MaximumTriggerProfileFitsColdSealEnvelope() public {
        _measureColdSealExecution();
    }
}

contract StreamGovernanceBootstrapP1M78ColdSealGasTest is
    StreamGovernanceBootstrapColdSealGasTestBase
{
    function setUp() public override {
        super.setUp();
        uint256[] memory moduleCounts = new uint256[](1);
        moduleCounts[0] = 78;
        _stageColdSeal(keccak256("P1_R1_M78_MAX_TRIGGER_PROFILE"), 1, moduleCounts);
    }

    function testP1R1M78MaximumTriggerProfileFitsColdSealEnvelope() public {
        _measureColdSealExecution();
    }
}

contract StreamGovernanceBootstrapP32R8M40ColdSealGasTest is
    StreamGovernanceBootstrapColdSealGasTestBase
{
    function setUp() public override {
        super.setUp();
        uint256[] memory moduleCounts = new uint256[](8);
        moduleCounts[0] = 40;
        _stageColdSeal(keccak256("P32_R8_M40_MAX_TRIGGER_PROFILE"), 32, moduleCounts);
    }

    function testP32R8M40MaximumTriggerProfileFitsColdSealEnvelope() public {
        _measureColdSealExecution();
    }
}

contract StreamGovernanceBootstrapBindGasTest is StreamGovernanceBootstrapTestBase {
    uint256 private constant TRIGGER_ROWS = 128;
    uint256 private constant POINTER_ROWS = 32;
    uint256 private constant REGISTRY_ROWS = 8;
    uint256 private constant BIND_GAS_CEILING = 24_000_000;
    bytes32 private constant STREAM_ROLE_GRANTED_TOPIC =
        keccak256("StreamRoleGranted(uint16,bytes32,address,uint8,address,bytes32)");
    bytes32 private constant ROLE_MUTATION_COMMITTED_TOPIC = keccak256(
        "RoleMutationCommitted(uint16,bytes32,address,bool,bytes32,uint64,bytes32,uint64,bytes32)"
    );

    event MaximumBootstrapBindGas(uint256 gasUsed);

    struct BindSetup {
        StreamGovernanceExecutor executor;
        SystemManifestBootstrapBinding binding;
    }

    StreamGovernanceExecutor private _callbackExecutor;
    address private _callbackRegistry;
    bytes private _callbackBindCalldata;
    bool private _callbackReached;
    bool private _callbackBindSucceeded;
    bool private _callbackExecuteSucceeded;
    bool private _callbackScheduleSucceeded;
    bool private _callbackPublishSucceeded;
    bytes4 private _callbackBindRevertSelector;
    bytes4 private _callbackExecuteRevertSelector;
    bytes4 private _callbackScheduleRevertSelector;
    bytes4 private _callbackPublishRevertSelector;

    function onBootstrapGuardianGrant() external {
        require(msg.sender == _callbackRegistry, "unexpected grant callback");
        _callbackReached = true;

        bytes memory reason;
        (_callbackBindSucceeded, reason) = address(_callbackExecutor).call(_callbackBindCalldata);
        _callbackBindRevertSelector = _leadingRevertSelector(reason);

        GovernanceCall[] memory calls = new GovernanceCall[](0);
        bytes[] memory callDatas = new bytes[](0);
        try _callbackExecutor.executeGovernanceBatch(bytes32(0), calls, callDatas) {
            _callbackExecuteSucceeded = true;
        } catch (bytes memory executeReason) {
            _callbackExecuteRevertSelector = _leadingRevertSelector(executeReason);
        }

        try _callbackExecutor.scheduleGovernanceBatch(
            StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING,
            calls,
            bytes32(0),
            bytes32(0),
            bytes32(0),
            0,
            0,
            bytes32(0),
            "",
            bytes32(0)
        ) returns (
            bytes32
        ) {
            _callbackScheduleSucceeded = true;
        } catch (bytes memory scheduleReason) {
            _callbackScheduleRevertSelector = _leadingRevertSelector(scheduleReason);
        }

        bytes[] memory publishCallDatas = new bytes[](1);
        publishCallDatas[0] = hex"12345678";
        try _callbackExecutor.publishGovernanceCallData(publishCallDatas) returns (address) {
            _callbackPublishSucceeded = true;
        } catch (bytes memory publishReason) {
            _callbackPublishRevertSelector = _leadingRevertSelector(publishReason);
        }
    }

    function _leadingRevertSelector(bytes memory reason) private pure returns (bytes4 selector) {
        if (reason.length < 4) return bytes4(0);
        assembly ("memory-safe") {
            selector := mload(add(reason, 0x20))
        }
    }

    function _configureGrantCallback(
        StreamGovernanceExecutor executor,
        StreamGovernanceBootstrapReentrantRoleRegistryMock registry,
        SystemManifestBootstrapBinding memory binding
    ) private {
        _callbackExecutor = executor;
        _callbackRegistry = address(registry);
        _callbackBindCalldata =
            abi.encodeCall(StreamGovernanceExecutor.bindSystemManifestBootstrap, (binding));
    }

    function testFirstGuardianGrantCannotUsePartialBootstrapState() public {
        BindSetup memory setup = _buildBindSetup(false);
        StreamGovernanceBootstrapReentrantRoleRegistryMock registry = new StreamGovernanceBootstrapReentrantRoleRegistryMock(
            address(setup.executor), address(this), false
        );
        setup.binding.roleRegistry = address(registry);
        _configureGrantCallback(setup.executor, registry, setup.binding);

        setup.executor.bindSystemManifestBootstrap(setup.binding);

        require(_callbackReached, "first grant callback reached");
        require(!_callbackBindSucceeded, "callback bind blocked");
        require(!_callbackExecuteSucceeded, "callback execute blocked");
        require(!_callbackScheduleSucceeded, "callback schedule blocked");
        require(!_callbackPublishSucceeded, "callback publish blocked");
        bytes4 reentrancySelector = bytes4(keccak256("ReentrancyGuardReentrantCall()"));
        require(_callbackBindRevertSelector == reentrancySelector, "bind reentrancy selector");
        require(_callbackExecuteRevertSelector == reentrancySelector, "execute reentrancy selector");
        require(
            _callbackScheduleRevertSelector
                == IStreamGovernanceExecutor.SystemManifestBootstrapNotBound.selector,
            "schedule sees unbound state"
        );
        require(
            _callbackPublishRevertSelector
                == IStreamGovernanceExecutor.SystemManifestBootstrapNotBound.selector,
            "publish sees unbound state"
        );
        require(_bootstrapState(setup.executor).bound, "outer bind completes atomically");
        require(
            registry.roleHolderCount(StreamRoles.ROLE_TERMINAL_FREEZE_VETO) == 2,
            "both guardian grants committed"
        );
    }

    function testBootstrapGuardianGrantEventsUseZeroActionIdSentinel() public {
        BindSetup memory setup = _buildBindSetup(false);
        address roleRegistry = setup.binding.roleRegistry;
        address[] memory guardians = setup.binding.initialTerminalFreezeVetoGuardians;

        vm.recordLogs();
        setup.executor.bindSystemManifestBootstrap(setup.binding);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        uint256 grantedMask;
        uint256 mutationMask;
        for (uint256 i = 0; i < logs.length; i++) {
            Vm.Log memory log = logs[i];
            if (log.emitter != roleRegistry || log.topics.length != 4) continue;
            if (log.topics[0] == STREAM_ROLE_GRANTED_TOPIC) {
                require(
                    log.topics[1] == StreamRoles.ROLE_TERMINAL_FREEZE_VETO, "bootstrap grant role"
                );
                require(log.topics[3] == bytes32(0), "bootstrap grant action sentinel");
                uint256 guardianBit = _bootstrapGuardianBit(log.topics[2], guardians);
                require((grantedMask & guardianBit) == 0, "duplicate bootstrap grant event");
                grantedMask |= guardianBit;
                (uint16 schemaVersion, uint8 grantClass, address actor) =
                    abi.decode(log.data, (uint16, uint8, address));
                require(schemaVersion == 1, "bootstrap grant schema");
                require(grantClass == StreamRoles.GRANT_CLASS_ROOT, "bootstrap grant class");
                require(actor == address(setup.executor), "bootstrap grant actor");
            } else if (log.topics[0] == ROLE_MUTATION_COMMITTED_TOPIC) {
                require(
                    log.topics[1] == StreamRoles.ROLE_TERMINAL_FREEZE_VETO,
                    "bootstrap mutation role"
                );
                require(log.topics[3] == bytes32(0), "bootstrap mutation action sentinel");
                uint256 guardianBit = _bootstrapGuardianBit(log.topics[2], guardians);
                require((mutationMask & guardianBit) == 0, "duplicate bootstrap mutation event");
                mutationMask |= guardianBit;
                (
                    uint16 schemaVersion,
                    bool granted,
                    bytes32 roleChainHash,
                    uint64 roleRevision,
                    bytes32 globalChainHash,
                    uint64 globalRevision
                ) = abi.decode(log.data, (uint16, bool, bytes32, uint64, bytes32, uint64));
                require(schemaVersion == 1, "bootstrap mutation schema");
                require(granted, "bootstrap mutation membership");
                require(
                    roleChainHash != bytes32(0) && globalChainHash != bytes32(0),
                    "bootstrap mutation chains"
                );
                require(roleRevision != 0 && globalRevision != 0, "bootstrap mutation revisions");
            }
        }
        require(grantedMask == 3, "both bootstrap grant events");
        require(mutationMask == 3, "both bootstrap mutation events");
    }

    function _bootstrapGuardianBit(bytes32 holderTopic, address[] memory guardians)
        private
        pure
        returns (uint256)
    {
        require(guardians.length == 2, "bootstrap guardian fixture");
        if (holderTopic == bytes32(uint256(uint160(guardians[0])))) return 1;
        if (holderTopic == bytes32(uint256(uint160(guardians[1])))) return 2;
        revert("unexpected bootstrap guardian event");
    }

    function testLaterGuardianGrantFailureRollsBackEntireBind() public {
        BindSetup memory setup = _buildBindSetup(false);
        StreamGovernanceBootstrapReentrantRoleRegistryMock registry = new StreamGovernanceBootstrapReentrantRoleRegistryMock(
            address(setup.executor), address(this), true
        );
        setup.binding.roleRegistry = address(registry);
        _configureGrantCallback(setup.executor, registry, setup.binding);
        address ownerBefore = setup.executor.owner();

        (bool ok,) = address(setup.executor)
            .call(
                abi.encodeCall(
                    StreamGovernanceExecutor.bindSystemManifestBootstrap, (setup.binding)
                )
            );
        require(!ok, "second guardian grant forced failure");

        BootstrapStateCommitment memory state = _bootstrapState(setup.executor);
        require(!state.bound && !state.isSealed, "lifecycle flags rolled back");
        require(state.roleRegistry == address(0), "registry scalar rolled back");
        require(state.roleRegistryCodeHash == bytes32(0), "registry hash rolled back");
        require(state.governanceRoot == address(0), "root scalar rolled back");
        require(state.governanceRootRevision == 0, "root revision rolled back");
        require(state.initialGuardianCount == 0, "guardian array rolled back");
        require(
            state.triggerCount == 0 && state.expectedTriggerCount == 0, "trigger array rolled back"
        );
        require(
            state.expectedInventoryLeafCount == 0 && state.inventoryLeafCount == 0,
            "inventory arrays rolled back"
        );
        require(setup.executor.systemManifestTailTriggerCount() == 0, "policy rows rolled back");
        require(
            !setup.executor
                .isTighteningCall(
                    address(setup.executor), StreamGovernanceExecutor.registerProposer.selector
                ),
            "classifier mapping rolled back"
        );
        require(setup.executor.owner() == ownerBefore, "owner unchanged");
        require(setup.executor.governanceNonce() == 0, "nonce unchanged");
        require(setup.executor.pendingScheduledActionCount() == 0, "pending count unchanged");

        require(
            registry.roleHolderCount(StreamRoles.ROLE_TERMINAL_FREEZE_VETO) == 0,
            "registry holders rolled back"
        );
        (bytes32 roleChain, uint64 roleRevision) =
            registry.roleMutationState(StreamRoles.ROLE_TERMINAL_FREEZE_VETO);
        (bytes32 globalChain, uint64 globalRevision) = registry.globalRoleMutationState();
        require(roleChain == bytes32(0) && roleRevision == 0, "role mutation rolled back");
        require(globalChain == bytes32(0) && globalRevision == 0, "global mutation rolled back");
        require(
            !registry.hasRole(
                    StreamRoles.ROLE_TERMINAL_FREEZE_VETO,
                    setup.binding.initialTerminalFreezeVetoGuardians[0]
                )
                && !registry.hasRole(
                    StreamRoles.ROLE_TERMINAL_FREEZE_VETO,
                    setup.binding.initialTerminalFreezeVetoGuardians[1]
                ),
            "guardian membership rolled back"
        );
    }

    function testMaximumTriggerBindMaterializesAtomicallyBelowDeploymentEnvelope() public {
        BindSetup memory setup = _buildBindSetup(false);
        uint256 gasBefore = gasleft();
        setup.executor.bindSystemManifestBootstrap(setup.binding);
        uint256 gasUsed = gasBefore - gasleft();
        emit MaximumBootstrapBindGas(gasUsed);
        require(gasUsed <= BIND_GAS_CEILING, "maximum bind gas envelope");

        BootstrapStateCommitment memory state = _bootstrapState(setup.executor);
        require(state.bound && !state.isSealed, "maximum bind state");
        require(state.triggerCount == TRIGGER_ROWS, "maximum trigger count");
        require(
            state.inventoryLeafCount == POINTER_ROWS + REGISTRY_ROWS, "realistic inventory count"
        );
        require(
            state.inventoryStateRoot == setup.binding.expectedInventoryStateRoot, "inventory root"
        );
        require(
            setup.executor.systemManifestTailTriggerCount() == TRIGGER_ROWS, "materialized rows"
        );
        (address firstTarget, bytes4 firstSelector,, uint8 firstMask) =
            setup.executor.systemManifestTailTriggerAt(0);
        (address lastTarget, bytes4 lastSelector,, uint8 lastMask) =
            setup.executor.systemManifestTailTriggerAt(TRIGGER_ROWS - 1);
        require(firstTarget == lastTarget, "single trigger code target");
        require(firstSelector == bytes4(uint32(1)), "first selector");
        // TRIGGER_ROWS is the fixed fixture bound 128, well inside uint32.
        // forge-lint: disable-next-line(unsafe-typecast)
        require(lastSelector == bytes4(uint32(TRIGGER_ROWS)), "last selector");
        require(firstMask == 0x0f && lastMask == 0x0f, "trigger masks");
        (, uint64 chainCount) = setup.executor.systemManifestTailTriggerChainHash();
        require(chainCount == TRIGGER_ROWS, "trigger chain count");
    }

    function testBindForwardsAvailableGasForCanonicalRegistryReads() public {
        BindSetup memory setup = _buildBindSetup(false);
        StreamGovernanceBootstrapRegistryMock registry =
            StreamGovernanceBootstrapRegistryMock(setup.binding.registries[0]);
        registry.setInterfaceGasToBurn(45_000);
        registry.setModuleCountGasToBurn(250_000);

        setup.executor.bindSystemManifestBootstrap(setup.binding);

        BootstrapStateCommitment memory state = _bootstrapState(setup.executor);
        require(state.bound && !state.isSealed, "high-gas canonical bind rejected");
    }

    function testMalformedMaximumBindLeavesNoPartialRows() public {
        BindSetup memory setup = _buildBindSetup(true);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        setup.executor.bindSystemManifestBootstrap(setup.binding);
        require(setup.executor.systemManifestTailTriggerCount() == 0, "no partial trigger rows");
        BootstrapStateCommitment memory state = _bootstrapState(setup.executor);
        require(!state.bound && !state.isSealed, "failed bind remains unbound");
    }

    function testBindRejectsZeroAuthorityAndIsStrictlyOneWay() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidGenesisBootstrapAuthority.selector, address(0)
            )
        );
        new StreamGovernanceExecutor(address(0));

        BindSetup memory setup = _buildBindSetup(false);
        address stranger = address(0xBAD1);
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GenesisBootstrapActorRequired.selector, stranger
            )
        );
        setup.executor.bindSystemManifestBootstrap(setup.binding);
        setup.executor.bindSystemManifestBootstrap(setup.binding);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.SystemManifestBootstrapAlreadyBound.selector
            )
        );
        setup.executor.bindSystemManifestBootstrap(setup.binding);
    }

    function testBindRejectsZeroCodelessWrongAndAllTrueRoleRegistries() public {
        BindSetup memory setup = _buildBindSetup(false);
        address original = setup.binding.roleRegistry;

        setup.binding.roleRegistry = address(0);
        _expectInvalidRoleRegistry(setup, address(0));

        setup.binding.roleRegistry = address(0xBEEF);
        _expectInvalidRoleRegistry(setup, address(0xBEEF));

        setup.binding.roleRegistry = address(new StreamGovernanceBootstrapBadRoleRegistryMock());
        _expectInvalidRoleRegistry(setup, setup.binding.roleRegistry);

        setup.binding.roleRegistry =
            address(new StreamGovernanceBootstrapAllInterfacesRoleRegistryMock());
        _expectInvalidRoleRegistry(setup, setup.binding.roleRegistry);

        setup.binding.roleRegistry = original;
        setup.executor.bindSystemManifestBootstrap(setup.binding);
        BootstrapStateCommitment memory state = _bootstrapState(setup.executor);
        require(state.roleRegistry == original, "bound role registry");
        require(state.roleRegistryCodeHash == original.codehash, "bound role registry codehash");
    }

    function testBindRejectsEIP7702DelegatedGovernanceRoot() public {
        BindSetup memory setup = _buildBindSetup(false);
        address governanceRoot = setup.binding.governanceRoot;
        vm.etch(governanceRoot, _eip7702Designation(address(0xD311)));
        setup.binding.governanceRootCodeHash = governanceRoot.codehash;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidGovernanceRoot.selector, governanceRoot
            )
        );
        setup.executor.bindSystemManifestBootstrap(setup.binding);
    }

    function testBindRejectsEIP7702DelegatedInitialGuardian() public {
        BindSetup memory setup = _buildBindSetup(false);
        address guardian = setup.binding.initialTerminalFreezeVetoGuardians[0];
        vm.etch(guardian, _eip7702Designation(address(0xD312)));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        setup.executor.bindSystemManifestBootstrap(setup.binding);
    }

    function testBindRejectsEIP7702DelegatedStoredExternalSurfaces() public {
        BindSetup memory roleSetup = _buildBindSetup(false);
        address roleRegistry = roleSetup.binding.roleRegistry;
        vm.etch(roleRegistry, _eip7702Designation(address(0xD313)));
        _expectInvalidRoleRegistry(roleSetup, roleRegistry);

        BindSetup memory coreSetup = _buildBindSetup(false);
        vm.etch(coreSetup.binding.core, _eip7702Designation(address(0xD314)));
        _expectInvalidBind(coreSetup);

        BindSetup memory satelliteSetup = _buildBindSetup(false);
        vm.etch(
            satelliteSetup.binding.systemManifestSatellite, _eip7702Designation(address(0xD315))
        );
        _expectInvalidBind(satelliteSetup);

        BindSetup memory triggerSetup = _buildBindSetup(false);
        address triggerTarget = triggerSetup.binding.expectedTriggers[0].triggerTarget;
        vm.etch(triggerTarget, _eip7702Designation(address(0xD316)));
        bytes32 delegatedTriggerHash = triggerTarget.codehash;
        for (uint256 i = 0; i < triggerSetup.binding.expectedTriggers.length; i++) {
            triggerSetup.binding.expectedTriggers[i].triggerCodeHash = delegatedTriggerHash;
        }
        _expectInvalidBind(triggerSetup);

        BindSetup memory registrySetup = _buildBindSetup(false);
        vm.etch(registrySetup.binding.registries[0], _eip7702Designation(address(0xD317)));
        _expectInvalidBind(registrySetup);
    }

    function testBindRejectsAllTrueManifestAndModuleRegistry() public {
        BindSetup memory manifestSetup = _buildBindSetup(false);
        manifestSetup.binding.systemManifestSatellite = address(
            new StreamGovernanceBootstrapAllInterfacesManifestMock(
                manifestSetup.binding.core, manifestSetup.executor
            )
        );
        _expectInvalidBind(manifestSetup);

        BindSetup memory registrySetup = _buildBindSetup(false);
        address[] memory registries = new address[](1);
        registries[0] = address(new StreamGovernanceBootstrapAllInterfacesModuleRegistryMock());
        registrySetup.binding.registries = registries;
        _expectInvalidBind(registrySetup);
    }

    function testBindExpectedInventoryLeafCapAccepts80AndRejects81AndLegacyEnvelopes() public {
        BindSetup memory boundarySetup = _buildBindSetup(false);
        boundarySetup.binding.expectedInventoryLeafCount = 80;
        boundarySetup.executor.bindSystemManifestBootstrap(boundarySetup.binding);
        require(_bootstrapState(boundarySetup.executor).bound, "80-leaf boundary accepted");

        BindSetup memory overflowSetup = _buildBindSetup(false);
        overflowSetup.binding.expectedInventoryLeafCount = 81;
        _expectInvalidBind(overflowSetup);
        _assertBindRolledBack(overflowSetup);

        BindSetup memory priorEnvelopeSetup = _buildBindSetup(false);
        priorEnvelopeSetup.binding.expectedInventoryLeafCount = 96;
        _expectInvalidBind(priorEnvelopeSetup);
        _assertBindRolledBack(priorEnvelopeSetup);

        BindSetup memory legacyEnvelopeSetup = _buildBindSetup(false);
        legacyEnvelopeSetup.binding.expectedInventoryLeafCount = 256;
        _expectInvalidBind(legacyEnvelopeSetup);
        _assertBindRolledBack(legacyEnvelopeSetup);
    }

    function testBindRejectsInventoryCountBelowPointerAndRegistryBaseline() public {
        BindSetup memory setup = _buildBindSetup(false);
        setup.binding.expectedInventoryLeafCount = uint64(POINTER_ROWS + REGISTRY_ROWS - 1);
        _expectInvalidBind(setup);
        _assertBindRolledBack(setup);
    }

    function testBindRejectsMissingSystemManifestPointerTypeWithoutWrites() public {
        BindSetup memory setup = _buildBindSetup(false);
        bytes32[] memory pointerTypes = new bytes32[](1);
        pointerTypes[0] = bytes32(uint256(1));
        setup.binding.pointerTypes = pointerTypes;
        _expectInvalidBind(setup);
        _assertBindRolledBack(setup);
    }

    function testBindExpectedCountAboveListedRegistryCapacityIsRejectedWithoutWrites() public {
        BindSetup memory reachableSetup = _buildBindSetup(false);
        bytes32[] memory pointerTypes = new bytes32[](1);
        pointerTypes[0] = SYSTEM_MANIFEST_POINTER_TYPE;
        address[] memory registries = new address[](1);
        registries[0] = reachableSetup.binding.registries[0];
        reachableSetup.binding.pointerTypes = pointerTypes;
        reachableSetup.binding.registries = registries;
        reachableSetup.binding.expectedInventoryLeafCount = 80;
        reachableSetup.executor.bindSystemManifestBootstrap(reachableSetup.binding);
        require(_bootstrapState(reachableSetup.executor).bound, "reachable launch cap accepted");

        BindSetup memory unreachableSetup = _buildBindSetup(false);
        registries = new address[](1);
        registries[0] = unreachableSetup.binding.registries[0];
        pointerTypes = new bytes32[](1);
        pointerTypes[0] = SYSTEM_MANIFEST_POINTER_TYPE;
        unreachableSetup.binding.pointerTypes = pointerTypes;
        unreachableSetup.binding.registries = registries;
        unreachableSetup.binding.expectedInventoryLeafCount = 131;
        _expectInvalidBind(unreachableSetup);
        _assertBindRolledBack(unreachableSetup);
    }

    function testBindRejectsPointerAndRegistryDimensionsAboveLaunchCaps() public {
        BindSetup memory pointerSetup = _buildBindSetup(false);
        bytes32[] memory tooManyPointers = new bytes32[](33);
        for (uint256 i = 0; i < 32; i++) {
            tooManyPointers[i] = bytes32(i + 1);
        }
        tooManyPointers[32] = SYSTEM_MANIFEST_POINTER_TYPE;
        pointerSetup.binding.pointerTypes = tooManyPointers;
        pointerSetup.binding.expectedInventoryLeafCount = 37;
        _expectInvalidBind(pointerSetup);
        _assertBindRolledBack(pointerSetup);

        BindSetup memory registrySetup = _buildBindSetup(false);
        address[] memory tooManyRegistries = new address[](9);
        for (uint256 i = 0; i < 4; i++) {
            tooManyRegistries[i] = registrySetup.binding.registries[i];
        }
        for (uint256 i = 4; i < 9; i++) {
            tooManyRegistries[i] = address(
                new StreamGovernanceBootstrapRegistryMock(
                    keccak256(abi.encode("cap-registry", i)), "ipfs://cap-registry", 1
                )
            );
        }
        _sortAddresses(tooManyRegistries);
        registrySetup.binding.registries = tooManyRegistries;
        registrySetup.binding.expectedInventoryLeafCount = 25;
        _expectInvalidBind(registrySetup);
        _assertBindRolledBack(registrySetup);
    }

    function testBindRejectsCurrentModuleCountAbovePerRegistryCapWithoutWrites() public {
        BindSetup memory setup = _buildBindSetup(false);
        StreamGovernanceBootstrapRegistryMock(setup.binding.registries[0])
            .setReportedModuleCountOffset(129);
        _expectInvalidBind(setup);
        _assertBindRolledBack(setup);
    }

    function testBindRejectsCurrentInventoryAboveExpectedCountWithoutWrites() public {
        BindSetup memory setup = _buildBindSetup(false);
        StreamGovernanceBootstrapRegistryMock(setup.binding.registries[0])
            .setReportedModuleCountOffset(1);
        _expectInvalidBind(setup);
        _assertBindRolledBack(setup);
    }

    function testSealRejectsExpectedInventoryAndManifestContentDrift() public {
        PayloadFixture memory fixture = _uniformPayload(1, 2);

        BindSetup memory rootSetup = _buildBindSetup(false);
        rootSetup.binding.expectedManifestHash = fixture.manifestHash;
        rootSetup.binding.expectedInventoryStateRoot = keccak256("wrong-inventory-root");
        rootSetup.executor.bindSystemManifestBootstrap(rootSetup.binding);
        BootstrapArtifacts memory artifacts = _boundArtifacts(rootSetup, fixture);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        this.invokeSeal(artifacts, address(this));

        BindSetup memory countSetup = _buildBindSetup(false);
        countSetup.binding.expectedManifestHash = fixture.manifestHash;
        countSetup.binding.expectedInventoryLeafCount += 1;
        countSetup.executor.bindSystemManifestBootstrap(countSetup.binding);
        artifacts = _boundArtifacts(countSetup, fixture);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        this.invokeSeal(artifacts, address(this));

        artifacts = _deployBoundBootstrap(address(this));
        artifacts.payloadRoot = fixture.root;
        artifacts.manifestHash = fixture.manifestHash;
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.InvalidManifestTail.selector)
        );
        this.invokeSeal(artifacts, address(this));
    }

    function testSealRejectsPriorManifestPublicationCount() public {
        PayloadFixture memory fixture = _uniformPayload(1, 2);
        BindSetup memory setup = _buildBindSetup(false);
        setup.binding.expectedManifestHash = fixture.manifestHash;
        setup.binding.systemManifestSatellite = address(
            new StreamGovernanceBootstrapPrimedManifestMock(setup.binding.core, setup.executor)
        );
        setup.executor.bindSystemManifestBootstrap(setup.binding);
        BootstrapArtifacts memory artifacts = _boundArtifacts(setup, fixture);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        this.invokeSeal(artifacts, address(this));
    }

    function testBindNegativeMatrixRejectsHashesMasksOrderingAndBoundIdentities() public {
        BindSetup memory setup = _buildBindSetup(false);
        _rejectTriggerCountOverflow(setup);
        _rejectTriggerAndOrderingDrift(setup);
        _rejectBoundIdentityDrift(setup);

        require(setup.executor.systemManifestTailTriggerCount() == 0, "negative matrix rows");
        require(!_bootstrapState(setup.executor).bound, "negative matrix remains unbound");
        setup.executor.bindSystemManifestBootstrap(setup.binding);
        require(_bootstrapState(setup.executor).bound, "restored binding succeeds");
    }

    function _rejectTriggerAndOrderingDrift(BindSetup memory setup) private {
        bytes32 originalCodeHash = setup.binding.expectedTriggers[0].triggerCodeHash;
        setup.binding.expectedTriggers[0].triggerCodeHash = keccak256("wrong-trigger-codehash");
        _expectInvalidBind(setup);
        setup.binding.expectedTriggers[0].triggerCodeHash = originalCodeHash;

        uint8 originalMask = setup.binding.expectedTriggers[0].allowedActionClassMask;
        setup.binding.expectedTriggers[0].allowedActionClassMask = 0;
        _expectInvalidBind(setup);
        setup.binding.expectedTriggers[0].allowedActionClassMask = 0x10;
        _expectInvalidBind(setup);
        setup.binding.expectedTriggers[0].allowedActionClassMask = originalMask;

        SystemManifestBootstrapTriggerExpectation memory triggerZero =
            setup.binding.expectedTriggers[0];
        SystemManifestBootstrapTriggerExpectation memory triggerOne =
            setup.binding.expectedTriggers[1];
        setup.binding.expectedTriggers[0] = triggerOne;
        setup.binding.expectedTriggers[1] = triggerZero;
        _expectInvalidBind(setup);
        setup.binding.expectedTriggers[0] = triggerZero;
        setup.binding.expectedTriggers[1] = triggerOne;
        setup.binding.expectedTriggers[1] = triggerZero;
        _expectInvalidBind(setup);
        setup.binding.expectedTriggers[1] = triggerOne;

        bytes32 pointerZero = setup.binding.pointerTypes[0];
        bytes32 pointerOne = setup.binding.pointerTypes[1];
        setup.binding.pointerTypes[0] = pointerOne;
        setup.binding.pointerTypes[1] = pointerZero;
        _expectInvalidBind(setup);
        setup.binding.pointerTypes[0] = pointerZero;
        setup.binding.pointerTypes[1] = pointerOne;
        setup.binding.pointerTypes[1] = pointerZero;
        _expectInvalidBind(setup);
        setup.binding.pointerTypes[1] = pointerOne;

        address registryZero = setup.binding.registries[0];
        address registryOne = setup.binding.registries[1];
        setup.binding.registries[0] = registryOne;
        setup.binding.registries[1] = registryZero;
        _expectInvalidBind(setup);
        setup.binding.registries[0] = registryZero;
        setup.binding.registries[1] = registryOne;
        setup.binding.registries[1] = registryZero;
        _expectInvalidBind(setup);
        setup.binding.registries[1] = registryOne;
    }

    function _rejectTriggerCountOverflow(BindSetup memory setup) private {
        SystemManifestBootstrapTriggerExpectation[] memory originalTriggers =
        setup.binding.expectedTriggers;
        SystemManifestBootstrapTriggerExpectation[] memory tooManyTriggers =
            new SystemManifestBootstrapTriggerExpectation[](TRIGGER_ROWS + 1);
        for (uint256 i = 0; i < TRIGGER_ROWS; i++) {
            tooManyTriggers[i] = originalTriggers[i];
        }
        tooManyTriggers[TRIGGER_ROWS] = SystemManifestBootstrapTriggerExpectation({
            triggerTarget: originalTriggers[0].triggerTarget,
            // The overflow fixture uses 129, well inside uint32.
            // forge-lint: disable-next-line(unsafe-typecast)
            triggerSelector: bytes4(uint32(TRIGGER_ROWS + 1)),
            triggerCodeHash: originalTriggers[0].triggerCodeHash,
            allowedActionClassMask: originalTriggers[0].allowedActionClassMask
        });
        setup.binding.expectedTriggers = tooManyTriggers;
        _expectInvalidBind(setup);
        setup.binding.expectedTriggers = originalTriggers;
    }

    function _rejectBoundIdentityDrift(BindSetup memory setup) private {
        SystemManifestBootstrapTriggerExpectation memory triggerZero =
            setup.binding.expectedTriggers[0];
        address registryZero = setup.binding.registries[0];
        address originalCore = setup.binding.core;
        StreamGovernanceBootstrapCoreMock wrongCore =
            new StreamGovernanceBootstrapCoreMock(address(0xCAFE));
        setup.binding.core = address(wrongCore);
        _expectInvalidBind(setup);
        setup.binding.core = originalCore;

        address originalSatellite = setup.binding.systemManifestSatellite;
        setup.binding.systemManifestSatellite =
            address(new StreamGovernanceBootstrapManifestMock(address(0xBEEF), setup.executor));
        _expectInvalidBind(setup);
        setup.binding.systemManifestSatellite = address(
            new StreamGovernanceBootstrapManifestMock(
                originalCore, IStreamGovernanceExecutor(address(0xBEEF))
            )
        );
        _expectInvalidBind(setup);
        setup.binding.systemManifestSatellite = address(
            new StreamGovernanceBootstrapBadInterfaceManifestMock(originalCore, setup.executor)
        );
        _expectInvalidBind(setup);
        setup.binding.systemManifestSatellite = originalSatellite;

        address[] memory originalRegistries = setup.binding.registries;
        address[] memory unsupportedRegistry = new address[](1);
        unsupportedRegistry[0] = triggerZero.triggerTarget;
        setup.binding.registries = unsupportedRegistry;
        _expectInvalidBind(setup);
        setup.binding.registries = originalRegistries;
    }

    function _expectInvalidBind(BindSetup memory setup) private {
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidSystemManifestBootstrap.selector
            )
        );
        setup.executor.bindSystemManifestBootstrap(setup.binding);
    }

    function _expectInvalidRoleRegistry(BindSetup memory setup, address registry) private {
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.InvalidRoleRegistry.selector, registry)
        );
        setup.executor.bindSystemManifestBootstrap(setup.binding);
    }

    function _assertBindRolledBack(BindSetup memory setup) private view {
        BootstrapStateCommitment memory state = _bootstrapState(setup.executor);
        require(!state.bound && !state.isSealed, "failed bind lifecycle rollback");
        require(state.roleRegistry == address(0), "failed bind registry rollback");
        require(
            IStreamRoleRegistry(setup.binding.roleRegistry)
                .roleHolderCount(StreamRoles.ROLE_TERMINAL_FREEZE_VETO) == 0,
            "failed bind guardian rollback"
        );
    }

    function _boundArtifacts(BindSetup memory setup, PayloadFixture memory fixture)
        private
        view
        returns (BootstrapArtifacts memory artifacts)
    {
        BootstrapStateCommitment memory state = _bootstrapState(setup.executor);
        artifacts.executor = setup.executor;
        artifacts.bootstrapAuthority = state.bootstrapAuthority;
        (artifacts.governanceRoot,,) = setup.executor.governanceRootState();
        artifacts.initialGuardians = setup.binding.initialTerminalFreezeVetoGuardians;
        artifacts.initialGuardianSetHash = state.initialGuardianSetHash;
        artifacts.terminalFreezeVetoMutationChain = state.terminalFreezeVetoMutationChain;
        artifacts.terminalFreezeVetoMutationRevision = state.terminalFreezeVetoMutationRevision;
        artifacts.trigger =
            StreamGovernanceBootstrapTriggerMock(setup.binding.expectedTriggers[0].triggerTarget);
        artifacts.registry = StreamGovernanceBootstrapRegistryMock(setup.binding.registries[0]);
        artifacts.core = StreamGovernanceBootstrapCoreMock(setup.binding.core);
        artifacts.manifest =
            StreamGovernanceBootstrapManifestMock(setup.binding.systemManifestSatellite);
        artifacts.payloadRoot = fixture.root;
        artifacts.manifestHash = setup.binding.expectedManifestHash;
        artifacts.inventoryRoot = setup.binding.expectedInventoryStateRoot;
        artifacts.inventoryCount = setup.binding.expectedInventoryLeafCount;
        artifacts.triggerSetHash = state.triggerSetHash;
        artifacts.triggerCount = state.triggerCount;
    }

    function _buildBindSetup(bool duplicateFinalTrigger) private returns (BindSetup memory setup) {
        setup.executor = new StreamGovernanceExecutor(address(this));
        StreamRoleRegistry roleRegistry = new StreamRoleRegistry(address(setup.executor));
        StreamGovernanceRootMock governanceRoot = new StreamGovernanceRootMock();
        address[] memory initialGuardians = new address[](2);
        initialGuardians[0] = address(new StreamGovernanceRootMock());
        initialGuardians[1] = address(new StreamGovernanceRootMock());
        if (uint160(initialGuardians[0]) > uint160(initialGuardians[1])) {
            (initialGuardians[0], initialGuardians[1]) = (initialGuardians[1], initialGuardians[0]);
        }
        StreamGovernanceBootstrapTriggerMock trigger = new StreamGovernanceBootstrapTriggerMock();

        address[] memory registries = new address[](REGISTRY_ROWS);
        for (uint256 i = 0; i < REGISTRY_ROWS; i++) {
            registries[i] = address(
                new StreamGovernanceBootstrapRegistryMock(
                    keccak256(abi.encode("registry-manifest", i)),
                    // i < REGISTRY_ROWS == 8, so 0x30 + i fits uint8.
                    // forge-lint: disable-next-line(unsafe-typecast)
                    string(abi.encodePacked("ipfs://bootstrap-registry-", bytes1(uint8(0x30 + i)))),
                    // i < REGISTRY_ROWS == 8, so i + 1 fits uint64.
                    // forge-lint: disable-next-line(unsafe-typecast)
                    uint64(i + 1)
                )
            );
        }
        _sortAddresses(registries);

        StreamGovernanceBootstrapCoreMock core =
            new StreamGovernanceBootstrapCoreMock(address(setup.executor));
        StreamGovernanceBootstrapManifestMock manifest =
            new StreamGovernanceBootstrapManifestMock(address(core), setup.executor);
        bytes32[] memory pointerTypes = new bytes32[](POINTER_ROWS);
        for (uint256 i = 0; i + 1 < POINTER_ROWS; i++) {
            pointerTypes[i] = bytes32(i + 1);
        }
        pointerTypes[POINTER_ROWS - 1] = SYSTEM_MANIFEST_POINTER_TYPE;

        SystemManifestBootstrapTriggerExpectation[] memory triggers =
            new SystemManifestBootstrapTriggerExpectation[](TRIGGER_ROWS);
        for (uint256 i = 0; i < TRIGGER_ROWS; i++) {
            // i < TRIGGER_ROWS == 128, so i + 1 fits uint32.
            // forge-lint: disable-next-line(unsafe-typecast)
            uint32 selectorValue = uint32(i + 1);
            if (duplicateFinalTrigger && i + 1 == TRIGGER_ROWS) selectorValue -= 1;
            triggers[i] = SystemManifestBootstrapTriggerExpectation({
                triggerTarget: address(trigger),
                triggerSelector: bytes4(selectorValue),
                triggerCodeHash: address(trigger).codehash,
                allowedActionClassMask: 0x0f
            });
        }

        (bytes32 inventoryRoot, uint64 inventoryCount) =
            _expectedInventory(setup.executor, address(core), pointerTypes, registries);
        setup.binding = SystemManifestBootstrapBinding({
            roleRegistry: address(roleRegistry),
            governanceRoot: address(governanceRoot),
            governanceRootCodeHash: address(governanceRoot).codehash,
            initialTerminalFreezeVetoGuardians: initialGuardians,
            core: address(core),
            systemManifestSatellite: address(manifest),
            expectedManifestHash: keccak256("maximum-bind-manifest"),
            expectedInventoryStateRoot: inventoryRoot,
            expectedInventoryLeafCount: inventoryCount,
            expectedTriggers: triggers,
            pointerTypes: pointerTypes,
            registries: registries
        });
    }

    function _expectedInventory(
        StreamGovernanceExecutor executor,
        address core,
        bytes32[] memory pointerTypes,
        address[] memory registries
    ) private view returns (bytes32 inventoryRoot, uint64 inventoryCount) {
        bytes32 chainHash;
        uint64 leafIndex;
        for (uint256 i = 0; i < pointerTypes.length; i++) {
            (bool ok, bytes memory facts) =
                core.staticcall(abi.encodeWithSelector(bytes4(0x3528d53c), pointerTypes[i]));
            require(ok && facts.length == 320, "pointer facts");
            chainHash = _inventoryAppend(
                chainHash, leafIndex, 0, core, pointerTypes[i], keccak256(facts)
            );
            leafIndex += 1;
        }
        for (uint256 i = 0; i < registries.length; i++) {
            StreamGovernanceBootstrapRegistryMock registry =
                StreamGovernanceBootstrapRegistryMock(registries[i]);
            (bytes32 recordChain, uint64 recordCount) = registry.registrationChainHash();
            (bytes32 manifestHash, string memory manifestURI, uint64 manifestRevision) =
                registry.moduleRegistryManifest();
            bytes32 headerFactsHash = keccak256(
                abi.encode(
                    registries[i].codehash,
                    uint256(0),
                    recordChain,
                    recordCount,
                    manifestHash,
                    keccak256(bytes(manifestURI)),
                    manifestRevision
                )
            );
            chainHash = _inventoryAppend(
                chainHash, leafIndex, 1, registries[i], bytes32(0), headerFactsHash
            );
            leafIndex += 1;
        }
        inventoryCount = leafIndex;
        inventoryRoot = keccak256(
            abi.encode(
                INVENTORY_ROOT_V1, block.chainid, address(executor), core, inventoryCount, chainHash
            )
        );
    }

    function _inventoryAppend(
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

    function _sortAddresses(address[] memory values) private pure {
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
}
