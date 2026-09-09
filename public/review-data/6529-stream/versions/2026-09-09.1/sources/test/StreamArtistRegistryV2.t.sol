// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/domains/artist/StreamArtistRegistryV2.sol";
import "../smart-contracts/interfaces/stream/IStreamArtistRegistryV2.sol";
import "../smart-contracts/vendor/openzeppelin/IERC165.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";

contract StreamArtistRegistryV2Test is CharacterizationTestBase {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    bytes32 private constant RECIPE_SET_HASH = keccak256("57 ordered artist recipes");
    bytes32 private constant EXTERNAL_BINDING_DOMAIN =
        keccak256("6529STREAM_ARTIST_EXTERNAL_PROVIDER_BINDING_V2");

    StreamArtistRegistryV2 private registry;

    function setUp() public {
        registry = new StreamArtistRegistryV2(_configuration());
    }

    function testTypedPinsAndCompositeBindingAreExact() public view {
        IStreamArtistRegistryV2.ArtistRegistryConfigurationV2 memory configuration =
            _configuration();
        registry.artistRegistryMarkerV2()
            .assertEq(keccak256("6529STREAM_ARTIST_REGISTRY_V2"), "marker");
        uint256(registry.artistRegistrySchemaV2()).assertEq(2, "schema version");
        registry.artistRegistrySchemaHashV2()
            .assertEq(keccak256("6529stream.artist-registry-directory.v2"), "schema hash");
        registry.artistRecipeSetHashV2().assertEq(RECIPE_SET_HASH, "recipe set");
        registry.supportsInterface(type(IStreamArtistRegistryV2).interfaceId)
            .assertTrue("registry interface");
        registry.supportsInterface(type(IERC165).interfaceId).assertTrue("ERC165 interface");
        registry.supportsInterface(0xffffffff).assertFalse("invalid ERC165 interface");

        _assertPin(registry.artistCoordinatorPinV2(), configuration.operationCoordinator);
        _assertPin(registry.artistArchivePinV2(), configuration.archive);
        for (uint8 i = 0; i < configuration.semanticOwners.length; i++) {
            _assertPin(
                registry.artistSemanticOwnerPinV2(
                    IStreamArtistRegistryV2.ArtistSemanticDomainV2(i)
                ),
                configuration.semanticOwners[i]
            );
        }
        for (uint8 i = 0; i < configuration.externalProviders.length; i++) {
            _assertPin(
                registry.artistExternalProviderPinV2(
                    IStreamArtistRegistryV2.ArtistExternalProviderV2(i)
                ),
                configuration.externalProviders[i]
            );
        }

        bytes32 expectedBindingHash = keccak256(
            abi.encode(
                keccak256("6529STREAM_ARTIST_REGISTRY_BINDING_V2"),
                block.chainid,
                address(registry),
                type(IStreamArtistRegistryV2).interfaceId,
                keccak256("6529STREAM_ARTIST_REGISTRY_V2"),
                uint16(2),
                keccak256("6529stream.artist-registry-directory.v2"),
                RECIPE_SET_HASH,
                _pinHash(configuration.operationCoordinator),
                _pinHash(configuration.archive),
                keccak256(abi.encode(configuration.semanticOwners)),
                keccak256(abi.encode(configuration.externalProviders))
            )
        );
        registry.artistRegistryBindingHashV2().assertEq(expectedBindingHash, "registry binding");
    }

    function testConstructorDoesNotRequireDeployedDependencies() public view {
        IStreamArtistRegistryV2.ArtistRegistryConfigurationV2 memory configuration =
            _configuration();
        (configuration.operationCoordinator.expectedAddress.code.length == 0)
        .assertTrue("coordinator intentionally absent");
        (configuration.archive.expectedAddress.code.length == 0)
        .assertTrue("archive fixture intentionally absent");
        for (uint256 i = 0; i < configuration.semanticOwners.length; i++) {
            (configuration.semanticOwners[i].expectedAddress.code.length == 0)
            .assertTrue("owner fixture intentionally absent");
        }
        for (uint256 i = 0; i < configuration.externalProviders.length; i++) {
            (configuration.externalProviders[i].expectedAddress.code.length == 0)
            .assertTrue("provider fixture intentionally absent");
        }
    }

    function testDeploymentEmitsNoEvent() public {
        vm.recordLogs();
        new StreamArtistRegistryV2(_configuration());
        vm.getRecordedLogs().length.assertEq(0, "no Registry event");
    }

    function testRuntimeCodeHashDoesNotDependOnConstructorPins() public {
        IStreamArtistRegistryV2.ArtistRegistryConfigurationV2 memory second = _configuration();
        second.recipeSetHash = keccak256("different future recipe set");
        StreamArtistRegistryV2 secondRegistry = new StreamArtistRegistryV2(second);

        address(registry).codehash
            .assertEq(address(secondRegistry).codehash, "configuration-independent runtime");
        (registry.artistRegistryBindingHashV2() != secondRegistry.artistRegistryBindingHashV2())
        .assertTrue("configuration-specific binding");
    }

    function testInterfaceSelectorsAndIdAreFrozen() public pure {
        uint256(uint32(IStreamArtistRegistryV2.artistRegistryMarkerV2.selector))
            .assertEq(0xef830742, "marker selector");
        uint256(uint32(IStreamArtistRegistryV2.artistRegistrySchemaV2.selector))
            .assertEq(0xbc02750a, "schema selector");
        uint256(uint32(IStreamArtistRegistryV2.artistRegistrySchemaHashV2.selector))
            .assertEq(0x7f86b1a4, "schema hash selector");
        uint256(uint32(IStreamArtistRegistryV2.artistRecipeSetHashV2.selector))
            .assertEq(0x624085e5, "recipe-set selector");
        uint256(uint32(IStreamArtistRegistryV2.artistRegistryBindingHashV2.selector))
            .assertEq(0x0b9a2e95, "binding selector");
        uint256(uint32(IStreamArtistRegistryV2.artistCoordinatorPinV2.selector))
            .assertEq(0xa8e9a0c4, "coordinator pin selector");
        uint256(uint32(IStreamArtistRegistryV2.artistArchivePinV2.selector))
            .assertEq(0x7309443f, "archive pin selector");
        uint256(uint32(IStreamArtistRegistryV2.artistSemanticOwnerPinV2.selector))
            .assertEq(0x7b12b1da, "owner pin selector");
        uint256(uint32(IStreamArtistRegistryV2.artistExternalProviderPinV2.selector))
            .assertEq(0xb3ee9a4f, "provider pin selector");
        uint256(uint32(type(IStreamArtistRegistryV2).interfaceId))
            .assertEq(0x56c1a7f2, "interface id");
    }

    function testZeroRecipeSetHashFailsClosed() public {
        IStreamArtistRegistryV2.ArtistRegistryConfigurationV2 memory invalid = _configuration();
        invalid.recipeSetHash = bytes32(0);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtistRegistryV2.ArtistRegistryInvalidRecipeSetHash.selector, bytes32(0)
            )
        );
        new StreamArtistRegistryV2(invalid);
    }

    function testMalformedCoordinatorPinsFailClosed() public {
        IStreamArtistRegistryV2.ArtistRegistryConfigurationV2 memory invalid = _configuration();
        invalid.operationCoordinator.expectedAddress = address(0);
        _expectInvalidPin(invalid, 0, 0);

        invalid = _configuration();
        invalid.operationCoordinator.expectedRuntimeCodeHash = bytes32(0);
        _expectInvalidPin(invalid, 0, 0);

        invalid = _configuration();
        invalid.operationCoordinator.expectedRuntimeCodeHash = keccak256("");
        _expectInvalidPin(invalid, 0, 0);

        invalid = _configuration();
        invalid.operationCoordinator.expectedInterfaceId = bytes4(0xffffffff);
        _expectInvalidPin(invalid, 0, 0);

        invalid = _configuration();
        invalid.operationCoordinator.expectedMarkerHash = bytes32(0);
        _expectInvalidPin(invalid, 0, 0);

        invalid = _configuration();
        invalid.operationCoordinator.expectedSchemaHash = bytes32(0);
        _expectInvalidPin(invalid, 0, 0);

        invalid = _configuration();
        invalid.operationCoordinator.expectedBindingHash = bytes32(0);
        _expectInvalidPin(invalid, 0, 0);
    }

    function testEveryTypedPinClassIsValidated() public {
        IStreamArtistRegistryV2.ArtistRegistryConfigurationV2 memory invalid = _configuration();
        invalid.archive.expectedInterfaceId = bytes4(0);
        _expectInvalidPin(invalid, 1, 0);

        invalid = _configuration();
        invalid.semanticOwners[4].expectedSchemaHash = bytes32(0);
        _expectInvalidPin(invalid, 2, 4);

        invalid = _configuration();
        invalid.externalProviders[3].expectedMarkerHash = bytes32(0);
        _expectInvalidPin(invalid, 3, 3);
    }

    function testExternalProviderBindingFormulaIsEnforced() public {
        IStreamArtistRegistryV2.ArtistRegistryConfigurationV2 memory invalid = _configuration();
        bytes32 supplied = keccak256("wrong provider binding");
        invalid.externalProviders[2].expectedBindingHash = supplied;
        bytes32 expected = _providerBindingHash(
            IStreamArtistRegistryV2.ArtistExternalProviderV2.GovernanceV2,
            invalid.externalProviders[2]
        );
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtistRegistryV2.ArtistRegistryExternalProviderBindingMismatch.selector,
                IStreamArtistRegistryV2.ArtistExternalProviderV2.GovernanceV2,
                expected,
                supplied
            )
        );
        new StreamArtistRegistryV2(invalid);
    }

    function testComponentAddressAliasingFailsClosed() public {
        IStreamArtistRegistryV2.ArtistRegistryConfigurationV2 memory invalid = _configuration();
        invalid.semanticOwners[6].expectedAddress = invalid.semanticOwners[1].expectedAddress;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtistRegistryV2.ArtistRegistryPinAddressAlias.selector,
                invalid.semanticOwners[1].expectedAddress
            )
        );
        new StreamArtistRegistryV2(invalid);

        invalid = _configuration();
        invalid.externalProviders[4].expectedAddress = invalid.archive.expectedAddress;
        invalid.externalProviders[4].expectedBindingHash = _providerBindingHash(
            IStreamArtistRegistryV2.ArtistExternalProviderV2.ImportContinuity,
            invalid.externalProviders[4]
        );
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtistRegistryV2.ArtistRegistryPinAddressAlias.selector,
                invalid.archive.expectedAddress
            )
        );
        new StreamArtistRegistryV2(invalid);
    }

    function testUnknownTypedIndicesFailClosed() public view {
        (bool ownerOk,) = address(registry)
            .staticcall(
                abi.encodeWithSelector(
                    IStreamArtistRegistryV2.artistSemanticOwnerPinV2.selector, uint8(7)
                )
            );
        ownerOk.assertFalse("unknown owner domain");

        (bool providerOk,) = address(registry)
            .staticcall(
                abi.encodeWithSelector(
                    IStreamArtistRegistryV2.artistExternalProviderPinV2.selector, uint8(5)
                )
            );
        providerOk.assertFalse("unknown provider");
    }

    function testSemanticDecisionRoutingAndUpgradeSurfacesAreAbsent() public {
        bytes32 artistId = keccak256("artist id");
        bytes[8] memory forbiddenPayloads = [
            abi.encodeWithSelector(bytes4(keccak256("currentArtist(bytes32)")), artistId),
            abi.encodeWithSelector(bytes4(keccak256("latestArtist(bytes32)")), artistId),
            abi.encodeWithSelector(bytes4(keccak256("authorize(bytes32)")), artistId),
            abi.encodeWithSelector(bytes4(keccak256("consumeReplay(bytes32)")), artistId),
            abi.encodeWithSelector(
                bytes4(keccak256("route(bytes4,bytes)")), bytes4(0x12345678), bytes("payload")
            ),
            abi.encodeWithSelector(
                bytes4(keccak256("setPin(uint8,address)")), uint8(0), address(this)
            ),
            abi.encodeWithSelector(bytes4(keccak256("rebind(address)")), address(this)),
            abi.encodeWithSelector(bytes4(keccak256("upgradeTo(address)")), address(this))
        ];
        for (uint256 i = 0; i < forbiddenPayloads.length; i++) {
            (bool ok,) = address(registry).call(forbiddenPayloads[i]);
            ok.assertFalse("forbidden selector absent");
        }

        (bool receiveOk,) = address(registry).call{ value: 1 }("");
        receiveOk.assertFalse("receive and fallback absent");
    }

    function _configuration()
        private
        view
        returns (IStreamArtistRegistryV2.ArtistRegistryConfigurationV2 memory result)
    {
        result.operationCoordinator = _internalPin(0x1001, 1);
        result.archive = _internalPin(0x1002, 2);
        for (uint8 i = 0; i < result.semanticOwners.length; i++) {
            result.semanticOwners[i] = _internalPin(uint160(0x1100 + i), uint256(10 + i));
        }
        for (uint8 i = 0; i < result.externalProviders.length; i++) {
            IStreamArtistRegistryV2.ArtistExternalProviderV2 provider =
                IStreamArtistRegistryV2.ArtistExternalProviderV2(i);
            IStreamArtistRegistryV2.ArtistDirectoryPinV2 memory pin =
                _internalPin(uint160(0x1200 + i), uint256(20 + i));
            pin.expectedBindingHash = _providerBindingHash(provider, pin);
            result.externalProviders[i] = pin;
        }
        result.recipeSetHash = RECIPE_SET_HASH;
    }

    function _internalPin(uint160 expectedAddress, uint256 salt)
        private
        pure
        returns (IStreamArtistRegistryV2.ArtistDirectoryPinV2 memory pin)
    {
        pin.expectedAddress = address(expectedAddress);
        pin.expectedRuntimeCodeHash = keccak256(abi.encode("runtime", salt));
        pin.expectedInterfaceId = bytes4(keccak256(abi.encode("interface", salt)));
        pin.expectedMarkerHash = keccak256(abi.encode("marker", salt));
        pin.expectedSchemaHash = keccak256(abi.encode("schema", salt));
        pin.expectedBindingHash = keccak256(abi.encode("binding", salt));
    }

    function _providerBindingHash(
        IStreamArtistRegistryV2.ArtistExternalProviderV2 provider,
        IStreamArtistRegistryV2.ArtistDirectoryPinV2 memory pin
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                EXTERNAL_BINDING_DOMAIN,
                block.chainid,
                _providerId(provider),
                pin.expectedAddress,
                pin.expectedRuntimeCodeHash,
                pin.expectedInterfaceId,
                pin.expectedMarkerHash,
                pin.expectedSchemaHash
            )
        );
    }

    function _providerId(IStreamArtistRegistryV2.ArtistExternalProviderV2 provider)
        private
        pure
        returns (bytes32)
    {
        if (provider == IStreamArtistRegistryV2.ArtistExternalProviderV2.RoleRegistry) {
            return keccak256("provider:role_registry");
        }
        if (provider == IStreamArtistRegistryV2.ArtistExternalProviderV2.Core) {
            return keccak256("provider:core");
        }
        if (provider == IStreamArtistRegistryV2.ArtistExternalProviderV2.GovernanceV2) {
            return keccak256("provider:governance_v2");
        }
        if (provider == IStreamArtistRegistryV2.ArtistExternalProviderV2.FinalityRegistry) {
            return keccak256("provider:finality_registry");
        }
        return keccak256("provider:import_continuity");
    }

    function _expectInvalidPin(
        IStreamArtistRegistryV2.ArtistRegistryConfigurationV2 memory invalid,
        uint8 pinClass,
        uint8 pinIndex
    ) private {
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtistRegistryV2.ArtistRegistryInvalidPin.selector, pinClass, pinIndex
            )
        );
        new StreamArtistRegistryV2(invalid);
    }

    function _assertPin(
        IStreamArtistRegistryV2.ArtistDirectoryPinV2 memory actual,
        IStreamArtistRegistryV2.ArtistDirectoryPinV2 memory expected
    ) private pure {
        actual.expectedAddress.assertEq(expected.expectedAddress, "pin address");
        actual.expectedRuntimeCodeHash
            .assertEq(expected.expectedRuntimeCodeHash, "pin runtime codehash");
        uint256(uint32(actual.expectedInterfaceId))
            .assertEq(uint256(uint32(expected.expectedInterfaceId)), "pin interface");
        actual.expectedMarkerHash.assertEq(expected.expectedMarkerHash, "pin marker");
        actual.expectedSchemaHash.assertEq(expected.expectedSchemaHash, "pin schema");
        actual.expectedBindingHash.assertEq(expected.expectedBindingHash, "pin binding");
    }

    function _pinHash(IStreamArtistRegistryV2.ArtistDirectoryPinV2 memory pin)
        private
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                pin.expectedAddress,
                pin.expectedRuntimeCodeHash,
                pin.expectedInterfaceId,
                pin.expectedMarkerHash,
                pin.expectedSchemaHash,
                pin.expectedBindingHash
            )
        );
    }
}
