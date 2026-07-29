// SPDX-License-Identifier: MIT

/**
 *
 *  @title Modified version of NextGen 6529 - Minter Contract to support 6529 Stream
 *  @custom:date 27-June-2024
 *  @custom:version 1.12
 *  @author 6529 team
 */

pragma solidity ^0.8.19;

import "./IStreamCore.sol";
import "./IStreamAdmins.sol";
import "./IStreamDrops.sol";
import "./StreamPauseDomains.sol";

contract StreamMinter {
    // checks if minting costs for a collectionwere set
    mapping(uint256 => bool) private setMintingCosts;

    // struct that holds minting costs and phases
    struct collectionPhasesDataStructure {
        uint256 publicStartTime;
        uint256 publicEndTime;
    }

    // mapping of collectionPhasesData struct
    mapping(uint256 => collectionPhasesDataStructure) private collectionPhases;

    // mapping that holds the auction end time when a token is sent to auction
    mapping(uint256 => uint256) private mintToAuctionData;

    // mapping that holds the auction status when a token is sent to auction
    mapping(uint256 => bool) private mintToAuctionStatus;

    //external contracts declaration
    IStreamCore public gencore;
    IStreamAdmins private adminsContract;

    // events
    event Withdraw(address indexed _add, bool status, uint256 indexed funds);
    event EmergencyWithdrawal(
        address indexed _admin,
        address indexed _recipient,
        bytes32 indexed _domain,
        uint256 funds,
        uint256 resultingSurplus
    );
    event CollectionPhasesUpdated(
        uint256 indexed collectionId,
        uint256 oldPublicStartTime,
        uint256 oldPublicEndTime,
        uint256 publicStartTime,
        uint256 publicEndTime,
        address indexed admin
    );
    event MinterTokensMinted(
        uint256 indexed collectionId,
        uint256 indexed firstTokenId,
        address indexed recipient,
        uint256 lastTokenId,
        uint256 quantity
    );
    event MinterAuctionMinted(
        uint256 indexed collectionId,
        uint256 indexed tokenId,
        address indexed custody,
        uint256 auctionEndTime
    );
    event MinterAuctionEndTimeUpdated(
        uint256 indexed tokenId,
        uint256 oldAuctionEndTime,
        uint256 newAuctionEndTime,
        address indexed admin
    );
    event MinterContractReferenceUpdated(
        uint8 indexed option,
        address oldContract,
        address indexed newContract,
        address indexed admin
    );

    // other variables
    address public streamDrops;

    // constructor
    constructor(address _gencore, address _adminsContract, address _streamDrops) {
        gencore = IStreamCore(_gencore);
        adminsContract = IStreamAdmins(_adminsContract);
        streamDrops = _streamDrops;
    }

    // certain functions can only be called by a global or function admin
    modifier FunctionAdminRequired(bytes4 _selector) {
        require(
            adminsContract.retrieveFunctionAdmin(msg.sender, address(this), _selector) == true
                || adminsContract.retrieveGlobalAdmin(msg.sender) == true,
            "Not allowed"
        );
        _;
    }
    // certain functions can only be called by the stream drops contract
    modifier streamDropRequired() {
        require(msg.sender == streamDrops, "Not allowed");
        _;
    }

    // function to add a collection's minting phases
    function setCollectionPhases(
        uint256 _collectionID,
        uint256 _publicStartTime,
        uint256 _publicEndTime
    ) public FunctionAdminRequired(this.setCollectionPhases.selector) {
        require(gencore.retrievewereDataAdded(_collectionID) == true, "Add data");
        uint256 oldPublicStartTime = collectionPhases[_collectionID].publicStartTime;
        uint256 oldPublicEndTime = collectionPhases[_collectionID].publicEndTime;
        collectionPhases[_collectionID].publicStartTime = _publicStartTime;
        collectionPhases[_collectionID].publicEndTime = _publicEndTime;
        emit CollectionPhasesUpdated(
            _collectionID,
            oldPublicStartTime,
            oldPublicEndTime,
            _publicStartTime,
            _publicEndTime,
            msg.sender
        );
    }

    // mint token function - NextGenMinter airdrop function
    function mint(
        address[] memory _recipients,
        string[] memory _tokenData,
        uint256[] memory _saltfun_o,
        uint256 _collectionID,
        uint256[] memory _numberOfTokens
    ) public streamDropRequired returns (uint256) {
        require(adminsContract.isPaused(StreamPauseDomains.MINT) == false, "Mint paused");
        require(
            _recipients.length == _tokenData.length && _recipients.length == _saltfun_o.length
                && _recipients.length == _numberOfTokens.length,
            "Array length mismatch"
        );
        require(_recipients.length > 0, "No recipients");
        require(
            collectionPhases[_collectionID].publicStartTime > 0
                && block.timestamp >= collectionPhases[_collectionID].publicStartTime,
            "Not started"
        );
        require(
            collectionPhases[_collectionID].publicEndTime > 0
                && block.timestamp <= collectionPhases[_collectionID].publicEndTime,
            "Ended"
        );
        uint256 mintIndex = 0;
        for (uint256 y = 0; y < _recipients.length; y++) {
            require(_numberOfTokens[y] > 0, "Zero quantity");
            require(
                gencore.viewCirSupply(_collectionID) + _numberOfTokens[y]
                    <= _collectionTotalSupply(_collectionID),
                "No supply"
            );
            // Core allocates sequential global token IDs; the next ID is the high-water mark
            // plus one, read from Core state rather than derived from any range arithmetic.
            uint256 firstTokenId = gencore.lastAllocatedTokenId() + 1;
            for (uint256 i = 0; i < _numberOfTokens[y]; i++) {
                mintIndex = gencore.lastAllocatedTokenId() + 1;
                gencore.mint(mintIndex, _recipients[y], _tokenData[y], _saltfun_o[y], _collectionID);
            }
            emit MinterTokensMinted(
                _collectionID, firstTokenId, _recipients[y], mintIndex, _numberOfTokens[y]
            );
        }
        return mintIndex;
    }

    function _collectionTotalSupply(uint256 _collectionID) private view returns (uint256) {
        (,,, uint256 totalSupply,,) = gencore.retrieveCollectionAdditionalData(_collectionID);
        return totalSupply;
    }

    // mint and auction
    function mintAndAuction(
        address _recipient,
        string memory _tokenData,
        uint256 _saltfun_o,
        uint256 _collectionID,
        uint256 _auctionEndTime
    ) public streamDropRequired returns (uint256) {
        require(adminsContract.isPaused(StreamPauseDomains.MINT) == false, "Mint paused");
        require(
            collectionPhases[_collectionID].publicStartTime > 0
                && block.timestamp >= collectionPhases[_collectionID].publicStartTime,
            "Not started"
        );
        require(
            collectionPhases[_collectionID].publicEndTime > 0
                && block.timestamp <= collectionPhases[_collectionID].publicEndTime,
            "Ended"
        );
        require(
            gencore.viewCirSupply(_collectionID) < _collectionTotalSupply(_collectionID),
            "No supply"
        );
        uint256 mintIndex = gencore.lastAllocatedTokenId() + 1;
        require(_auctionEndTime >= block.timestamp + 600); // 10mins min auction
        mintToAuctionData[mintIndex] = _auctionEndTime;
        mintToAuctionStatus[mintIndex] = true;
        // token is airdropped to the _recipient address and auction starts
        gencore.mint(mintIndex, _recipient, _tokenData, _saltfun_o, _collectionID);
        emit MinterAuctionMinted(_collectionID, mintIndex, _recipient, _auctionEndTime);
        return mintIndex;
    }

    // function to update AuctionEndTime
    function updateAuctionEndTime(uint256 _tokenId, uint256 _auctionEndTime)
        public
        FunctionAdminRequired(this.updateAuctionEndTime.selector)
    {
        require(mintToAuctionStatus[_tokenId] == true);
        uint256 oldAuctionEndTime = mintToAuctionData[_tokenId];
        mintToAuctionData[_tokenId] = _auctionEndTime;
        emit MinterAuctionEndTimeUpdated(_tokenId, oldAuctionEndTime, _auctionEndTime, msg.sender);
    }

    // function to update contracts
    function updateContracts(uint256 _opt, address _newContract)
        public
        FunctionAdminRequired(this.updateContracts.selector)
    {
        if (_opt == 1) {
            _requireContractMarker(
                _newContract, IStreamCore.isCoreContract.selector, "Contract is not Core"
            );
            address oldContract = address(gencore);
            if (oldContract == _newContract) {
                return;
            }
            gencore = IStreamCore(_newContract);
            emit MinterContractReferenceUpdated(1, oldContract, _newContract, msg.sender);
        } else if (_opt == 2) {
            _requireContractMarker(
                _newContract, IStreamAdmins.isAdminContract.selector, "Contract is not Admin"
            );
            address oldContract = address(adminsContract);
            if (oldContract == _newContract) {
                return;
            }
            adminsContract = IStreamAdmins(_newContract);
            emit MinterContractReferenceUpdated(2, oldContract, _newContract, msg.sender);
        } else if (_opt == 3) {
            _requireContractMarker(
                _newContract, IStreamDrops.isStreamDropsContract.selector, "Contract is not Drops"
            );
            address oldContract = streamDrops;
            if (oldContract == _newContract) {
                return;
            }
            streamDrops = _newContract;
            emit MinterContractReferenceUpdated(3, oldContract, _newContract, msg.sender);
        } else {
            revert("Bad option");
        }
    }

    function _requireContractMarker(
        address _target,
        bytes4 _markerSelector,
        string memory _errorMessage
    ) private view {
        require(_target.code.length != 0, "Contract required");
        (bool success, bytes memory returnData) =
            _target.staticcall(abi.encodeWithSelector(_markerSelector));
        require(success && returnData.length == 32 && abi.decode(returnData, (bool)), _errorMessage);
    }

    function totalOwed() public pure returns (uint256) {
        return 0;
    }

    function totalReserved() public pure returns (uint256) {
        return 0;
    }

    function emergencyWithdrawable() public view returns (uint256) {
        return surplus();
    }

    function surplus() public view returns (uint256) {
        uint256 balance = address(this).balance;
        uint256 owed = totalOwed();
        if (balance <= owed) {
            return 0;
        }
        return balance - owed;
    }

    // function to withdraw only surplus balance from the smart contract
    function emergencyWithdraw() public FunctionAdminRequired(this.emergencyWithdraw.selector) {
        uint256 balance = emergencyWithdrawable();
        address recipient = adminsContract.emergencyRecipient();
        emit Withdraw(msg.sender, true, balance);
        emit EmergencyWithdrawal(msg.sender, recipient, StreamPauseDomains.EMERGENCY, balance, 0);
        if (balance > 0) {
            (bool success,) = payable(recipient).call{ value: balance }("");
            require(success, "ETH failed");
        }
    }

    // function to retrieve the phases and merkle root of a collection
    function retrieveCollectionPhases(uint256 _collectionID)
        public
        view
        returns (uint256, uint256)
    {
        return (
            collectionPhases[_collectionID].publicStartTime,
            collectionPhases[_collectionID].publicEndTime
        );
    }

    // retrieve minter contract status
    function isMinterContract() external view returns (bool) {
        return true;
    }

    // retrieve minting end time
    function getEndTime(uint256 _collectionID) external view returns (uint256) {
        return collectionPhases[_collectionID].publicEndTime;
    }

    // retrieve auction end time
    function getAuctionEndTime(uint256 _tokenId) external view returns (uint256) {
        return mintToAuctionData[_tokenId];
    }

    // retrieve auction status
    function getAuctionStatus(uint256 _tokenId) external view returns (bool) {
        return mintToAuctionStatus[_tokenId];
    }
}
