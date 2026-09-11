// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../smart-contracts/IStreamMinter.sol";

contract MockStreamMinter is IStreamMinter {
    uint256 public nextTokenId = 1_000_000_000;

    address public lastRecipient;
    string public lastTokenData;
    uint256 public lastSalt;
    uint256 public lastCollectionId;
    uint256 public lastNumberOfTokens;
    address[] public lastRecipients;
    string[] public lastTokenDatas;
    uint256[] public lastSalts;
    uint256[] public lastNumberOfTokensByRecipient;
    uint256 public lastMintBatchLength;
    uint256 public lastTotalNumberOfTokens;

    address public lastAuctionRecipient;
    string public lastAuctionTokenData;
    uint256 public lastAuctionSalt;
    uint256 public lastAuctionCollectionId;
    uint256 public lastAuctionEndTime;

    mapping(uint256 => uint256) private auctionEndTimes;
    mapping(uint256 => bool) private auctionStatuses;

    function isMinterContract() external pure returns (bool) {
        return true;
    }

    function getEndTime(uint256) external pure returns (uint256) {
        return type(uint256).max;
    }

    function getAuctionEndTime(uint256 tokenId) external view returns (uint256) {
        return auctionEndTimes[tokenId];
    }

    function getAuctionStatus(uint256 tokenId) external view returns (bool) {
        return auctionStatuses[tokenId];
    }

    function mint(
        address[] memory recipients,
        string[] memory tokenData,
        uint256[] memory saltfunO,
        uint256 collectionId,
        uint256[] memory numberOfTokens
    ) external returns (uint256) {
        require(
            recipients.length == tokenData.length && recipients.length == saltfunO.length
                && recipients.length == numberOfTokens.length,
            "length"
        );
        require(recipients.length > 0, "no tokens");

        delete lastRecipients;
        delete lastTokenDatas;
        delete lastSalts;
        delete lastNumberOfTokensByRecipient;

        lastRecipient = recipients[0];
        lastTokenData = tokenData[0];
        lastSalt = saltfunO[0];
        lastCollectionId = collectionId;
        lastNumberOfTokens = numberOfTokens[0];

        uint256 mintedCount;
        for (uint256 i = 0; i < recipients.length; i++) {
            lastRecipients.push(recipients[i]);
            lastTokenDatas.push(tokenData[i]);
            lastSalts.push(saltfunO[i]);
            lastNumberOfTokensByRecipient.push(numberOfTokens[i]);
            mintedCount += numberOfTokens[i];
        }
        require(mintedCount > 0, "no tokens");
        lastMintBatchLength = recipients.length;
        lastTotalNumberOfTokens = mintedCount;

        uint256 tokenId = nextTokenId + mintedCount - 1;
        nextTokenId += mintedCount;
        return tokenId;
    }

    function mintAndAuction(
        address recipient,
        string memory tokenData,
        uint256 saltfunO,
        uint256 collectionId,
        uint256 auctionEndTime
    ) external returns (uint256) {
        lastAuctionRecipient = recipient;
        lastAuctionTokenData = tokenData;
        lastAuctionSalt = saltfunO;
        lastAuctionCollectionId = collectionId;
        lastAuctionEndTime = auctionEndTime;

        uint256 tokenId = nextTokenId;
        nextTokenId++;
        auctionEndTimes[tokenId] = auctionEndTime;
        auctionStatuses[tokenId] = true;
        return tokenId;
    }

    function updateAuctionEndTime(uint256 tokenId, uint256 auctionEndTime) external {
        auctionEndTimes[tokenId] = auctionEndTime;
    }
}
