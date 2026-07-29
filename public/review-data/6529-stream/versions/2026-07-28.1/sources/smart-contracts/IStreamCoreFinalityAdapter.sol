// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IERC165.sol";
import "./StreamArtworkFinalityTypes.sol";

/// @notice Permanent read-only aggregate boundary for artwork finality.
/// @dev The four declared selectors XOR to the canonical interface ID `0xebf35615`.
interface IStreamCoreFinalityAdapter is IERC165 {
    function core() external view returns (address);

    function collectionMetadata() external view returns (address);

    function coreCollectionFinalityFacts(uint256 collectionId)
        external
        view
        returns (StreamCoreCollectionFinalityFacts memory);

    function scopedCoreFinalityFacts(StreamCoreFinalityScopeQuery calldata scope)
        external
        view
        returns (StreamScopedCoreFinalityFacts memory);
}
