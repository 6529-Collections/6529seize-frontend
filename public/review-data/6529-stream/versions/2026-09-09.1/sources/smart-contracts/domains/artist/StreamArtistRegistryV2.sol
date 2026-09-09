// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../interfaces/stream/IStreamArtistRegistryV2.sol";

/// @notice Constructor-fixed typed directory for the proposed artist-authority successor.
/// @dev This contract performs no dependency calls and has no runtime storage-write path. Its
///      private storage is configuration only, not artist semantic state. It does not authorize,
///      route, coordinate, consume replay, own records, or answer current/latest artist state.
contract StreamArtistRegistryV2 is IStreamArtistRegistryV2 {
    bytes32 private constant _MARKER = keccak256("6529STREAM_ARTIST_REGISTRY_V2");
    bytes32 private constant _BINDING_DOMAIN = keccak256("6529STREAM_ARTIST_REGISTRY_BINDING_V2");
    bytes32 private constant _EXTERNAL_PROVIDER_BINDING_DOMAIN =
        keccak256("6529STREAM_ARTIST_EXTERNAL_PROVIDER_BINDING_V2");
    bytes32 private constant _SCHEMA_HASH = keccak256("6529stream.artist-registry-directory.v2");
    bytes32 private constant _EMPTY_CODE_HASH = keccak256("");
    uint16 private constant _SCHEMA_VERSION = 2;
    uint8 private constant _COORDINATOR_PIN_CLASS = 0;
    uint8 private constant _ARCHIVE_PIN_CLASS = 1;
    uint8 private constant _OWNER_PIN_CLASS = 2;
    uint8 private constant _PROVIDER_PIN_CLASS = 3;
    uint256 private constant _COMPONENT_COUNT = 14;

    ArtistDirectoryPinV2 private _operationCoordinator;
    ArtistDirectoryPinV2 private _archive;
    ArtistDirectoryPinV2[7] private _semanticOwners;
    ArtistDirectoryPinV2[5] private _externalProviders;
    // Constructor-only storage deliberately keeps the runtime codehash configuration-independent.
    // slither-disable-next-line immutable-states
    bytes32 private _recipeSetHash;
    // Constructor-only storage deliberately keeps the runtime codehash configuration-independent.
    // slither-disable-next-line immutable-states
    bytes32 private _registryBindingHash;

    constructor(ArtistRegistryConfigurationV2 memory configuration) {
        if (configuration.recipeSetHash == bytes32(0)) {
            revert ArtistRegistryInvalidRecipeSetHash(configuration.recipeSetHash);
        }

        address[] memory seenAddresses = new address[](_COMPONENT_COUNT);
        uint256 seenCount = 0;
        _validatePin(configuration.operationCoordinator, _COORDINATOR_PIN_CLASS, 0);
        seenCount = _requireUniqueAddress(
            seenAddresses, seenCount, configuration.operationCoordinator.expectedAddress
        );
        _validatePin(configuration.archive, _ARCHIVE_PIN_CLASS, 0);
        seenCount =
            _requireUniqueAddress(seenAddresses, seenCount, configuration.archive.expectedAddress);

        for (uint8 i = 0; i < configuration.semanticOwners.length; i++) {
            ArtistDirectoryPinV2 memory pin = configuration.semanticOwners[i];
            _validatePin(pin, _OWNER_PIN_CLASS, i);
            seenCount = _requireUniqueAddress(seenAddresses, seenCount, pin.expectedAddress);
        }
        for (uint8 i = 0; i < configuration.externalProviders.length; i++) {
            ArtistDirectoryPinV2 memory pin = configuration.externalProviders[i];
            _validatePin(pin, _PROVIDER_PIN_CLASS, i);
            bytes32 expectedBindingHash =
                _externalProviderBindingHash(ArtistExternalProviderV2(i), pin);
            if (pin.expectedBindingHash != expectedBindingHash) {
                revert ArtistRegistryExternalProviderBindingMismatch(
                    ArtistExternalProviderV2(i), expectedBindingHash, pin.expectedBindingHash
                );
            }
            seenCount = _requireUniqueAddress(seenAddresses, seenCount, pin.expectedAddress);
        }

        _storePin(_operationCoordinator, configuration.operationCoordinator);
        _storePin(_archive, configuration.archive);
        for (uint256 i = 0; i < configuration.semanticOwners.length; i++) {
            _storePin(_semanticOwners[i], configuration.semanticOwners[i]);
        }
        for (uint256 i = 0; i < configuration.externalProviders.length; i++) {
            _storePin(_externalProviders[i], configuration.externalProviders[i]);
        }
        _recipeSetHash = configuration.recipeSetHash;
        _registryBindingHash = keccak256(
            abi.encode(
                _BINDING_DOMAIN,
                block.chainid,
                address(this),
                type(IStreamArtistRegistryV2).interfaceId,
                _MARKER,
                _SCHEMA_VERSION,
                _SCHEMA_HASH,
                configuration.recipeSetHash,
                _pinHash(configuration.operationCoordinator),
                _pinHash(configuration.archive),
                keccak256(abi.encode(configuration.semanticOwners)),
                keccak256(abi.encode(configuration.externalProviders))
            )
        );
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IStreamArtistRegistryV2).interfaceId
            || interfaceId == type(IERC165).interfaceId;
    }

    function artistRegistryMarkerV2() external pure returns (bytes32) {
        return _MARKER;
    }

    function artistRegistrySchemaV2() external pure returns (uint16) {
        return _SCHEMA_VERSION;
    }

    function artistRegistrySchemaHashV2() external pure returns (bytes32) {
        return _SCHEMA_HASH;
    }

    function artistRecipeSetHashV2() external view returns (bytes32) {
        return _recipeSetHash;
    }

    function artistRegistryBindingHashV2() external view returns (bytes32) {
        return _registryBindingHash;
    }

    function artistCoordinatorPinV2() external view returns (ArtistDirectoryPinV2 memory) {
        return _operationCoordinator;
    }

    function artistArchivePinV2() external view returns (ArtistDirectoryPinV2 memory) {
        return _archive;
    }

    function artistSemanticOwnerPinV2(ArtistSemanticDomainV2 domain)
        external
        view
        returns (ArtistDirectoryPinV2 memory)
    {
        return _semanticOwners[uint8(domain)];
    }

    function artistExternalProviderPinV2(ArtistExternalProviderV2 provider)
        external
        view
        returns (ArtistDirectoryPinV2 memory)
    {
        return _externalProviders[uint8(provider)];
    }

    function _validatePin(ArtistDirectoryPinV2 memory pin, uint8 pinClass, uint8 pinIndex)
        private
        pure
    {
        if (
            pin.expectedAddress == address(0) || pin.expectedRuntimeCodeHash == bytes32(0)
                || pin.expectedRuntimeCodeHash == _EMPTY_CODE_HASH
                || pin.expectedInterfaceId == bytes4(0)
                || pin.expectedInterfaceId == bytes4(0xffffffff)
                || pin.expectedMarkerHash == bytes32(0) || pin.expectedSchemaHash == bytes32(0)
                || pin.expectedBindingHash == bytes32(0)
        ) {
            revert ArtistRegistryInvalidPin(pinClass, pinIndex);
        }
    }

    function _requireUniqueAddress(
        address[] memory seenAddresses,
        uint256 seenCount,
        address expectedAddress
    ) private view returns (uint256) {
        if (expectedAddress == address(this)) {
            revert ArtistRegistryPinAddressAlias(expectedAddress);
        }
        for (uint256 i = 0; i < seenCount; i++) {
            if (seenAddresses[i] == expectedAddress) {
                revert ArtistRegistryPinAddressAlias(expectedAddress);
            }
        }
        seenAddresses[seenCount] = expectedAddress;
        return seenCount + 1;
    }

    function _externalProviderBindingHash(
        ArtistExternalProviderV2 provider,
        ArtistDirectoryPinV2 memory pin
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                _EXTERNAL_PROVIDER_BINDING_DOMAIN,
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

    function _providerId(ArtistExternalProviderV2 provider) private pure returns (bytes32) {
        if (provider == ArtistExternalProviderV2.RoleRegistry) {
            return keccak256("provider:role_registry");
        }
        if (provider == ArtistExternalProviderV2.Core) {
            return keccak256("provider:core");
        }
        if (provider == ArtistExternalProviderV2.GovernanceV2) {
            return keccak256("provider:governance_v2");
        }
        if (provider == ArtistExternalProviderV2.FinalityRegistry) {
            return keccak256("provider:finality_registry");
        }
        return keccak256("provider:import_continuity");
    }

    function _pinHash(ArtistDirectoryPinV2 memory pin) private pure returns (bytes32) {
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

    function _storePin(ArtistDirectoryPinV2 storage target, ArtistDirectoryPinV2 memory source)
        private
    {
        target.expectedAddress = source.expectedAddress;
        target.expectedRuntimeCodeHash = source.expectedRuntimeCodeHash;
        target.expectedInterfaceId = source.expectedInterfaceId;
        target.expectedMarkerHash = source.expectedMarkerHash;
        target.expectedSchemaHash = source.expectedSchemaHash;
        target.expectedBindingHash = source.expectedBindingHash;
    }
}
