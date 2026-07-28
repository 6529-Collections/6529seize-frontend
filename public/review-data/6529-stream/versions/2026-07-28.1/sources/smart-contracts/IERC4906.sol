// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @dev ERC-4906 metadata update event interface.
interface IERC4906 {
    event MetadataUpdate(uint256 _tokenId);
    event BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId);
}
