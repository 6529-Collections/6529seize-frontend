// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/ERC165.sol";
import "../smart-contracts/IERC165.sol";
import "../smart-contracts/IStreamMintGate.sol";
import "../smart-contracts/IStreamMintModuleRegistry.sol";
import "../smart-contracts/StreamMintModuleRegistry.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";

contract RegistryMintGateMock is ERC165 {
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return
            interfaceId == type(IStreamMintGate).interfaceId || super.supportsInterface(interfaceId);
    }
}

contract RegistryWrongInterfaceMock is ERC165 {
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

contract StreamMintModuleRegistryTest is CharacterizationTestBase {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    event MintModuleUpdated(
        address indexed module,
        IStreamMintModuleRegistry.ModuleStatus status,
        bytes4 indexed interfaceId,
        uint32 semanticVersion,
        bytes32 codehash,
        bytes32 metadataHash,
        uint32 gasLimit,
        address indexed admin
    );
    event MintModuleMetadata(address indexed module, bytes32 metadataHash, string metadataURI);

    bytes32 private constant METADATA_HASH = keccak256("registry-module-metadata");
    string private constant METADATA_URI = "ipfs://registry-module";

    StreamMintModuleRegistry private registry;
    RegistryMintGateMock private gate;

    function setUp() public {
        registry = new StreamMintModuleRegistry();
        gate = new RegistryMintGateMock();
    }

    function testSupportsInterfaceAndMarker() public {
        registry.isStreamMintModuleRegistry().assertTrue("marker");
        registry.supportsInterface(type(IStreamMintModuleRegistry).interfaceId)
            .assertTrue("registry interface");
        registry.supportsInterface(type(IERC165).interfaceId).assertTrue("erc165");
        registry.supportsInterface(0xffffffff).assertFalse("invalid interface");
    }

    function testSetModuleRequiresOwnerAndPinsActualCodehash() public {
        IStreamMintModuleRegistry.MintModuleInfo memory info =
            _moduleInfo(IStreamMintModuleRegistry.ModuleStatus.ACTIVE);
        info.codehash = bytes32(0);

        vm.prank(address(0xB0B));
        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        registry.setModule(address(gate), info, METADATA_URI);

        vm.expectEmit(true, true, true, true);
        emit MintModuleUpdated(
            address(gate),
            IStreamMintModuleRegistry.ModuleStatus.ACTIVE,
            type(IStreamMintGate).interfaceId,
            1,
            address(gate).codehash,
            METADATA_HASH,
            50_000,
            address(this)
        );
        vm.expectEmit(true, true, true, true);
        emit MintModuleMetadata(address(gate), METADATA_HASH, METADATA_URI);
        registry.setModule(address(gate), info, METADATA_URI);

        IStreamMintModuleRegistry.MintModuleInfo memory stored = registry.moduleInfo(address(gate));
        uint256(stored.status)
            .assertEq(uint256(IStreamMintModuleRegistry.ModuleStatus.ACTIVE), "active status");
        uint256(uint32(stored.interfaceId))
            .assertEq(uint256(uint32(type(IStreamMintGate).interfaceId)), "interface id");
        uint256(stored.semanticVersion).assertEq(1, "semantic version");
        stored.codehash.assertEq(address(gate).codehash, "actual codehash pinned");
        stored.metadataHash.assertEq(METADATA_HASH, "metadata hash");
        uint256(stored.gasLimit).assertEq(50_000, "gas limit");
        registry.isModuleActive(address(gate), type(IStreamMintGate).interfaceId)
            .assertTrue("module active");
    }

    function testSetModuleRejectsInvalidRecords() public {
        IStreamMintModuleRegistry.MintModuleInfo memory info =
            _moduleInfo(IStreamMintModuleRegistry.ModuleStatus.ACTIVE);

        vm.expectRevert(
            abi.encodeWithSelector(IStreamMintModuleRegistry.InvalidMintModule.selector, address(0))
        );
        registry.setModule(address(0), info, METADATA_URI);

        info.metadataHash = bytes32(0);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintModuleRegistry.InvalidMintModuleInfo.selector, address(gate)
            )
        );
        registry.setModule(address(gate), info, METADATA_URI);

        info = _moduleInfo(IStreamMintModuleRegistry.ModuleStatus.ACTIVE);
        info.interfaceId = 0xffffffff;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintModuleRegistry.InvalidMintModuleInfo.selector, address(gate)
            )
        );
        registry.setModule(address(gate), info, METADATA_URI);

        RegistryWrongInterfaceMock wrongInterface = new RegistryWrongInterfaceMock();
        info = _moduleInfoFor(
            address(wrongInterface), IStreamMintModuleRegistry.ModuleStatus.ACTIVE
        );
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintModuleRegistry.MintModuleInterfaceUnsupported.selector,
                address(wrongInterface),
                type(IStreamMintGate).interfaceId
            )
        );
        registry.setModule(address(wrongInterface), info, METADATA_URI);

        info = _moduleInfo(IStreamMintModuleRegistry.ModuleStatus.ACTIVE);
        info.codehash = keccak256("wrong-codehash");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintModuleRegistry.MintModuleCodehashMismatch.selector,
                address(gate),
                info.codehash,
                address(gate).codehash
            )
        );
        registry.setModule(address(gate), info, METADATA_URI);

        info = _moduleInfo(IStreamMintModuleRegistry.ModuleStatus.ACTIVE);
        info.gasLimit = 0;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintModuleRegistry.InvalidMintModuleInfo.selector, address(gate)
            )
        );
        registry.setModule(address(gate), info, METADATA_URI);

        info = _moduleInfo(IStreamMintModuleRegistry.ModuleStatus.DEPRECATED);
        info.gasLimit = 0;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamMintModuleRegistry.InvalidMintModuleInfo.selector, address(gate)
            )
        );
        registry.setModule(address(gate), info, METADATA_URI);
    }

    function testStatusTransitionsDriveActiveCheckAndClear() public {
        registry.setModule(
            address(gate), _moduleInfo(IStreamMintModuleRegistry.ModuleStatus.ACTIVE), METADATA_URI
        );
        registry.isModuleActive(address(gate), type(IStreamMintGate).interfaceId)
            .assertTrue("active");

        vm.expectEmit(true, true, true, true);
        emit MintModuleUpdated(
            address(gate),
            IStreamMintModuleRegistry.ModuleStatus.DEPRECATED,
            type(IStreamMintGate).interfaceId,
            1,
            address(gate).codehash,
            METADATA_HASH,
            50_000,
            address(this)
        );
        registry.setModule(
            address(gate),
            _moduleInfo(IStreamMintModuleRegistry.ModuleStatus.DEPRECATED),
            METADATA_URI
        );
        registry.isModuleActive(address(gate), type(IStreamMintGate).interfaceId)
            .assertFalse("deprecated inactive");

        registry.setModule(
            address(gate), _moduleInfo(IStreamMintModuleRegistry.ModuleStatus.BLOCKED), METADATA_URI
        );
        registry.isModuleActive(address(gate), type(IStreamMintGate).interfaceId)
            .assertFalse("blocked inactive");

        IStreamMintModuleRegistry.MintModuleInfo memory clearInfo =
            _moduleInfo(IStreamMintModuleRegistry.ModuleStatus.UNKNOWN);
        vm.expectEmit(true, true, true, true);
        emit MintModuleUpdated(
            address(gate),
            IStreamMintModuleRegistry.ModuleStatus.UNKNOWN,
            bytes4(0),
            0,
            bytes32(0),
            bytes32(0),
            0,
            address(this)
        );
        registry.setModule(address(gate), clearInfo, "");

        IStreamMintModuleRegistry.MintModuleInfo memory stored = registry.moduleInfo(address(gate));
        uint256(stored.status)
            .assertEq(uint256(IStreamMintModuleRegistry.ModuleStatus.UNKNOWN), "cleared status");
        stored.codehash.assertEq(bytes32(0), "cleared codehash");
        stored.metadataHash.assertEq(bytes32(0), "cleared metadata");
    }

    function _moduleInfo(IStreamMintModuleRegistry.ModuleStatus status)
        private
        view
        returns (IStreamMintModuleRegistry.MintModuleInfo memory)
    {
        return _moduleInfoFor(address(gate), status);
    }

    function _moduleInfoFor(address module, IStreamMintModuleRegistry.ModuleStatus status)
        private
        view
        returns (IStreamMintModuleRegistry.MintModuleInfo memory)
    {
        return IStreamMintModuleRegistry.MintModuleInfo({
            status: status,
            interfaceId: type(IStreamMintGate).interfaceId,
            semanticVersion: 1,
            codehash: module.codehash,
            metadataHash: METADATA_HASH,
            gasLimit: 50_000
        });
    }
}
