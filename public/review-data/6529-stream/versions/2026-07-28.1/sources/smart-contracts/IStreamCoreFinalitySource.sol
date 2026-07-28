// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Granular target-Core reads consumed by the immutable finality adapter and registry.
/// @dev This seam deliberately excludes aggregate finality helpers so no aggregate bytecode is
///      spent in StreamCore. Every read is non-mutating and part of the locked pre-genesis target.
interface IStreamCoreFinalitySource {
    function collectionExists(uint256 collectionId) external view returns (bool);

    function collectionHasMaxSupply(uint256 collectionId) external view returns (bool);

    function collectionStatus(uint256 collectionId) external view returns (uint8);

    function collectionSupplyMode(uint256 collectionId) external view returns (uint8);

    function collectionMaxSupply(uint256 collectionId) external view returns (uint256);

    function collectionMintedEver(uint256 collectionId) external view returns (uint256);

    function collectionNextSerial(uint256 collectionId) external view returns (uint256);

    function totalSupplyOfCollection(uint256 collectionId) external view returns (uint256);

    function tokenCollectionIdentity(uint256 tokenId)
        external
        view
        returns (bool mappingExists, uint256 collectionId, uint256 collectionSerial, bool burned);

    function tokenLifecycle(uint256 tokenId) external view returns (uint8 lifecycle);

    function collectionBurnsBlocked(uint256 collectionId) external view returns (bool);

    function collectionFreezeStatus(uint256 collectionId) external view returns (bool);
}
