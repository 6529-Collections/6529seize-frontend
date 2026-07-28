// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../smart-contracts/IStreamAuctions.sol";

contract MockStreamAuctions is IStreamAuctions {
    bytes32 public lastDropId;
    uint256 public lastTokenId;
    uint256 public lastCollectionId;
    address public lastPoster;
    uint256 public lastReservePrice;
    uint256 public lastAuctionEndTime;

    function isStreamAuctionsContract() external pure returns (bool) {
        return true;
    }

    function registerAuction(
        bytes32 _dropId,
        uint256 _tokenid,
        uint256 _collectionId,
        address _poster,
        uint256 _reservePrice,
        uint256 _auctionEndTime
    ) external {
        lastDropId = _dropId;
        lastTokenId = _tokenid;
        lastCollectionId = _collectionId;
        lastPoster = _poster;
        lastReservePrice = _reservePrice;
        lastAuctionEndTime = _auctionEndTime;
    }
}
