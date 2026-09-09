// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../vendor/openzeppelin/IERC165.sol";

/// @notice Permanent Core-facing metadata routing surface.
/// @dev Implementations may expose richer configuration and finality reads, but these three
///      selectors are the stable interface Core and collection clients bind through ERC-165.
interface IStreamMetadataRouter is IERC165 {
    /// @notice Returns the token metadata URI for one Core identity.
    function tokenURI(address core, uint256 tokenId) external view returns (string memory);

    /// @notice Returns ERC-7572 contract metadata for one Core.
    function contractURIForCore(address core) external view returns (string memory);

    /// @notice Returns collection-scoped contract metadata for one Core collection.
    function contractURIForCollection(address core, uint256 collectionId)
        external
        view
        returns (string memory);
}
