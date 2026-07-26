// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

library StreamPauseDomains {
    bytes32 internal constant DROP_EXECUTION = keccak256("6529stream.pause.DropExecution");
    bytes32 internal constant MINT = keccak256("6529stream.pause.Mint");
    bytes32 internal constant AUCTION_BID = keccak256("6529stream.pause.AuctionBid");
    bytes32 internal constant AUCTION_SETTLEMENT = keccak256("6529stream.pause.AuctionSettlement");
    bytes32 internal constant METADATA_MUTATION = keccak256("6529stream.pause.MetadataMutation");
    bytes32 internal constant RANDOMNESS_REQUEST = keccak256("6529stream.pause.RandomnessRequest");
    bytes32 internal constant EMERGENCY = keccak256("6529stream.emergency");
}
