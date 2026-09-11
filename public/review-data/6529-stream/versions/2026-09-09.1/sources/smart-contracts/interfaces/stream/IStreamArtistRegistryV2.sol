// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../vendor/openzeppelin/IERC165.sol";

/// @notice Typed immutable directory commitments for the proposed artist-authority successor.
/// @dev This interface exposes expected identities only. It owns no artist semantic state,
///      authorization, replay decision, record, current/latest answer, or operation recipe.
interface IStreamArtistRegistryV2 is IERC165 {
    /// @notice Canonical order of the seven isolated semantic-owner domains.
    /// @dev Values map in order to `domain:binding_lifecycle`,
    ///      `domain:collaborator_lifecycle`, `domain:identity_authority`,
    ///      `domain:acceptance_lifecycle`, `domain:attribution_lifecycle`,
    ///      `domain:payout_lifecycle`, and `domain:consent_finality`.
    enum ArtistSemanticDomainV2 {
        BindingLifecycle,
        CollaboratorLifecycle,
        IdentityAuthority,
        AcceptanceLifecycle,
        AttributionLifecycle,
        PayoutLifecycle,
        ConsentFinality
    }

    /// @notice Canonical order of the five immutable external providers.
    /// @dev Values map in order to `provider:role_registry`, `provider:core`,
    ///      `provider:governance_v2`, `provider:finality_registry`, and
    ///      `provider:import_continuity`.
    enum ArtistExternalProviderV2 {
        RoleRegistry,
        Core,
        GovernanceV2,
        FinalityRegistry,
        ImportContinuity
    }

    /// @notice One expected component identity in the immutable artist-suite directory.
    /// @dev The Registry does not infer successful calls or live deployment from these fields.
    struct ArtistDirectoryPinV2 {
        address expectedAddress;
        bytes32 expectedRuntimeCodeHash;
        bytes4 expectedInterfaceId;
        bytes32 expectedMarkerHash;
        bytes32 expectedSchemaHash;
        bytes32 expectedBindingHash;
    }

    /// @notice Complete constructor-fixed configuration for the directory.
    struct ArtistRegistryConfigurationV2 {
        ArtistDirectoryPinV2 operationCoordinator;
        ArtistDirectoryPinV2 archive;
        ArtistDirectoryPinV2[7] semanticOwners;
        ArtistDirectoryPinV2[5] externalProviders;
        bytes32 recipeSetHash;
    }

    /// @notice The frozen recipe-set commitment is zero.
    error ArtistRegistryInvalidRecipeSetHash(bytes32 recipeSetHash);

    /// @notice One pin is zero, empty-code, or uses an invalid ERC-165 interface identifier.
    /// @param pinClass 0=Coordinator, 1=Archive, 2=semantic owner, 3=external provider.
    error ArtistRegistryInvalidPin(uint8 pinClass, uint8 pinIndex);

    /// @notice Two typed directory positions use the same expected component address.
    error ArtistRegistryPinAddressAlias(address expectedAddress);

    /// @notice An external provider does not use the exact ADR 0023 binding formula.
    error ArtistRegistryExternalProviderBindingMismatch(
        ArtistExternalProviderV2 provider, bytes32 expectedBindingHash, bytes32 suppliedBindingHash
    );

    function artistRegistryMarkerV2() external pure returns (bytes32);

    function artistRegistrySchemaV2() external pure returns (uint16);

    function artistRegistrySchemaHashV2() external pure returns (bytes32);

    /// @notice Commitment to the 57 ordered coordinator recipes; not an operation selector map.
    function artistRecipeSetHashV2() external view returns (bytes32);

    /// @notice Ordered commitment to this Registry and every exact typed directory pin.
    /// @dev Bound components must not include this composite in their own binding preimage;
    ///      using the aggregate in both directions would create a constructor hash cycle.
    ///      The preimage is `abi.encode(domain, chainId, registry, interfaceId, markerHash,
    ///      schemaVersion, schemaHash, recipeSetHash, coordinatorPinHash, archivePinHash,
    ///      orderedOwnerPinsHash, orderedProviderPinsHash)`.
    function artistRegistryBindingHashV2() external view returns (bytes32);

    function artistCoordinatorPinV2() external view returns (ArtistDirectoryPinV2 memory);

    function artistArchivePinV2() external view returns (ArtistDirectoryPinV2 memory);

    function artistSemanticOwnerPinV2(ArtistSemanticDomainV2 domain)
        external
        view
        returns (ArtistDirectoryPinV2 memory);

    /// @dev `expectedBindingHash` is exactly `keccak256(abi.encode(domain, chainId,
    ///      providerIdHash, address, runtimeCodeHash, interfaceId, markerHash, schemaHash))`,
    ///      where `providerIdHash` is the keccak of the enum's canonical `provider:*` id.
    function artistExternalProviderPinV2(ArtistExternalProviderV2 provider)
        external
        view
        returns (ArtistDirectoryPinV2 memory);
}
