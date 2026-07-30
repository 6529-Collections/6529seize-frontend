// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./StreamArtworkFinalityTypes.sol";

/// @notice Finality read surface every participating satellite exposes ([LTA-FINALITY]).
/// @dev Interface names carry the `Artwork` infix so this wave never collides with sibling
///      worktrees; function selectors follow the spec code blocks exactly.
interface IStreamArtworkFinalityComponent {
    /// @notice Reports the component's collection-scope finality state.
    function finalityState(uint256 collectionId)
        external
        view
        returns (StreamFinalityComponentState memory);
}

/// @notice Scoped finality read surface (Scoped Finality For Open Series).
interface IStreamArtworkScopedFinalityComponent {
    /// @notice Reports the component's finality state for one scope.
    function finalityStateForScope(StreamFinalityScope calldata scope)
        external
        view
        returns (StreamFinalityComponentState memory);
}

/// @notice Collection-scope component discovery, implemented by the metadata router
///         ([LTA-FINALITY] component discovery path).
interface IStreamArtworkFinalityDiscovery {
    function finalityComponentCount(uint256 collectionId) external view returns (uint256);

    function finalityComponentAt(uint256 collectionId, uint256 index)
        external
        view
        returns (StreamFinalityComponentExpectation memory);

    function finalityDiscoveryHash(uint256 collectionId) external view returns (bytes32);
}

/// @notice Scoped component discovery (Scoped Finality For Open Series).
interface IStreamArtworkScopedFinalityDiscovery {
    function finalityComponentCountForScope(StreamFinalityScope calldata scope)
        external
        view
        returns (uint256);

    function finalityComponentAtForScope(StreamFinalityScope calldata scope, uint256 index)
        external
        view
        returns (StreamFinalityComponentExpectation memory);

    function finalityDiscoveryHashForScope(StreamFinalityScope calldata scope)
        external
        view
        returns (bytes32);
}

/// @notice Frozen-route compatibility read keyed by full scope identity
///         (Scoped Finality For Open Series, scope rule 5).
interface IStreamArtworkScopedFrozenRouteRegistry {
    /// @notice Returns the module pinned for `routeType` by the scope's executed finality.
    /// @dev `routeHash` is `keccak256(abi.encode(expectation))` over the stored
    ///      `StreamFinalityComponentExpectation` — a registry-local convention until the
    ///      event catalog pins a route preimage.
    function frozenRouteForScope(bytes32 routeType, StreamFinalityScope calldata scope)
        external
        view
        returns (bool pinned, address module, bytes32 routeHash, bytes32 finalityRecordHash);
}
