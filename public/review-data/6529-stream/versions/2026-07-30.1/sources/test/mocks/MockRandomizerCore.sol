// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockRandomizerCore {
    error MockTokenHashRejected();

    mapping(uint256 => uint256) private randomizerEpochs;
    mapping(uint256 => address) private randomizerContracts;
    mapping(uint256 => uint256) private tokenCollections;
    mapping(uint256 => bytes32) private tokenHashes;
    mapping(uint256 => bool) private burnedTokens;
    bool private rejectTokenHash;

    function setRandomizer(uint256 collectionId, address randomizer, uint256 epoch) external {
        randomizerContracts[collectionId] = randomizer;
        randomizerEpochs[collectionId] = epoch;
    }

    function setTokenCollection(uint256 tokenId, uint256 collectionId) external {
        tokenCollections[tokenId] = collectionId;
    }

    function setRejectTokenHash(bool status) external {
        rejectTokenHash = status;
    }

    function setTokenBurned(uint256 tokenId, bool status) external {
        burnedTokens[tokenId] = status;
    }

    function setTokenHash(uint256 collectionId, uint256 tokenId, bytes32 tokenHash) external {
        if (rejectTokenHash) {
            revert MockTokenHashRejected();
        }
        require(msg.sender == randomizerContracts[collectionId]);
        require(tokenHashes[tokenId] == bytes32(0));
        tokenHashes[tokenId] = tokenHash;
    }

    function retrieveTokenHash(uint256 tokenId) external view returns (bytes32) {
        return tokenHashes[tokenId];
    }

    function isTokenBurned(uint256 tokenId) external view returns (bool) {
        return burnedTokens[tokenId];
    }

    function viewColIDforTokenID(uint256 tokenId) external view returns (uint256) {
        return tokenCollections[tokenId];
    }

    function viewCollectionRandomizerContract(uint256 collectionId)
        external
        view
        returns (address)
    {
        return randomizerContracts[collectionId];
    }

    function viewRandomizerEpoch(uint256 collectionId) external view returns (uint256) {
        return randomizerEpochs[collectionId];
    }
}
