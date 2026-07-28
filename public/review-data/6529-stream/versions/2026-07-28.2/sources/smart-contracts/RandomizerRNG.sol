// SPDX-License-Identifier: MIT

/**
 *
 *  @title NextGen 6529 - RNG Randomizer Contract
 *  @custom:date 20-December-2023
 *  @custom:version 1.8
 *  @author 6529 team
 */

pragma solidity ^0.8.19;

import "./ArrngConsumer.sol";
import "./IStreamCore.sol";
import "./IStreamAdmins.sol";
import "./StreamPauseDomains.sol";
import "./StreamRandomizerLifecycle.sol";

contract NextGenRandomizerRNG is ArrngConsumer, StreamRandomizerLifecycle {
    event RequestFulfilled(uint256 requestId, uint256[] randomWords);

    address gencore;
    IStreamCore public gencoreContract;
    IStreamAdmins private adminsContract;
    event Withdraw(address indexed _add, bool status, uint256 indexed funds);
    uint256 ethRequired;
    bool private randomnessRequestInProgress;

    error RandomizerRequestReentrancy();

    constructor(address _gencore, address _adminsContract, address _arRNG) ArrngConsumer(_arRNG) {
        gencore = _gencore;
        gencoreContract = IStreamCore(_gencore);
        adminsContract = IStreamAdmins(_adminsContract);
    }

    modifier FunctionAdminRequired(bytes4 _selector) {
        require(
            adminsContract.retrieveFunctionAdmin(msg.sender, address(this), _selector) == true
                || adminsContract.retrieveGlobalAdmin(msg.sender) == true,
            "Not allowed"
        );
        _;
    }

    // arRNG returns the provider request ID from the external payable call, so
    // recording request state must happen after the call. The local guard blocks
    // reentrant fulfillment during that window and has a regression test.
    // slither-disable-start reentrancy-eth,write-after-write
    function requestRandomWords(uint256 tokenid, uint256 _ethRequired) public payable {
        require(msg.sender == gencore);
        require(
            adminsContract.isPaused(StreamPauseDomains.RANDOMNESS_REQUEST) == false,
            "Randomness paused"
        );
        if (randomnessRequestInProgress) {
            revert RandomizerRequestReentrancy();
        }
        randomnessRequestInProgress = true;
        // calculateTokenHash is the canonical entry point and initializes this
        // binding before gencore calls requestRandomWords directly.
        uint256 collectionId = tokenIdToCollection[tokenid];
        uint256 requestId =
            arrngController.requestRandomWords{ value: _ethRequired }(1, (address(this)));
        randomnessRequestInProgress = false;
        _recordRandomnessRequest(
            requestId, collectionId, tokenid, gencoreContract.viewRandomizerEpoch(collectionId)
        );
    }
    // slither-disable-end reentrancy-eth,write-after-write

    function fulfillRandomWords(uint256 id, uint256[] memory numbers) internal override {
        if (randomnessRequestInProgress) {
            revert RandomizerRequestReentrancy();
        }
        (uint256 collectionId, uint256 tokenId, bytes32 derivedSeed) =
            _fulfillRandomnessRequest(gencoreContract, id, numbers);
        // The lifecycle marks this request non-pending before the external core
        // write, so duplicate callbacks and stale marking fail during any
        // reentrant read/write attempt. The catch records only the deterministic
        // local post-processing failure outcome.
        // slither-disable-start reentrancy-no-eth,reentrancy-events
        try gencoreContract.setTokenHash(collectionId, tokenId, derivedSeed) {
            if (gencoreContract.isTokenBurned(tokenId)) {
                _confirmBurnedTokenRandomnessRecorded(id);
            }
            _confirmRandomnessFulfillment(id);
            emit RequestFulfilled(id, numbers);
        } catch (bytes memory failureData) {
            _markRandomnessPostProcessingFailed(id, failureData);
        }
        // slither-disable-end reentrancy-no-eth,reentrancy-events
    }

    // function that calculates the random hash and returns it to the gencore contract
    function calculateTokenHash(uint256 _collectionID, uint256 _mintIndex, uint256 _saltfun_o)
        public
    {
        require(msg.sender == gencore);
        require(
            adminsContract.isPaused(StreamPauseDomains.RANDOMNESS_REQUEST) == false,
            "Randomness paused"
        );
        tokenIdToCollection[_mintIndex] = _collectionID;
        requestRandomWords(_mintIndex, ethRequired);
    }

    function markStaleRequest(uint256 _requestId)
        public
        FunctionAdminRequired(this.markStaleRequest.selector)
    {
        _markRandomnessRequestStale(_requestId);
    }

    function retryRandomnessPostProcessing(uint256 _requestId)
        public
        FunctionAdminRequired(this.retryRandomnessPostProcessing.selector)
    {
        (uint256 collectionId, uint256 tokenId, bytes32 derivedSeed, uint256 retryCount) =
            _prepareRandomnessPostProcessingRetry(gencoreContract, _requestId);
        // Retry reuses the already accepted seed and performs only the
        // deterministic core write. The lifecycle state is Fulfilled during the
        // external call, so duplicate callbacks and nested retry/stale attempts
        // fail closed.
        // slither-disable-start reentrancy-no-eth,reentrancy-events
        try gencoreContract.setTokenHash(collectionId, tokenId, derivedSeed) {
            if (gencoreContract.isTokenBurned(tokenId)) {
                _confirmBurnedTokenRandomnessRecorded(_requestId);
            }
            _confirmRandomnessPostProcessingRetry(_requestId, retryCount);
        } catch (bytes memory failureData) {
            _markRandomnessPostProcessingRetryFailed(_requestId, failureData, retryCount);
        }
        // slither-disable-end reentrancy-no-eth,reentrancy-events
    }

    // function to update contracts

    function updateAdminContract(address _newadminsContract)
        public
        FunctionAdminRequired(this.updateAdminContract.selector)
    {
        require(
            IStreamAdmins(_newadminsContract).isAdminContract() == true, "Contract is not Admin"
        );
        adminsContract = IStreamAdmins(_newadminsContract);
    }

    function updateCoreContract(address _gencore)
        public
        FunctionAdminRequired(this.updateCoreContract.selector)
    {
        gencore = _gencore;
        gencoreContract = IStreamCore(_gencore);
    }

    // function to update cost

    function updateRNGCost(uint256 _ethRequired)
        public
        FunctionAdminRequired(this.updateRNGCost.selector)
    {
        ethRequired = _ethRequired;
    }

    function totalRandomnessReserved() public view returns (uint256) {
        return address(this).balance;
    }

    function totalOwed() public view returns (uint256) {
        return totalRandomnessReserved();
    }

    function totalReserved() public view returns (uint256) {
        return totalRandomnessReserved();
    }

    function emergencyWithdrawable() public pure returns (uint256) {
        return surplus();
    }

    function surplus() public pure returns (uint256) {
        return 0;
    }

    // function to report the emergency-withdrawal boundary for reserved funds

    function emergencyWithdraw() public FunctionAdminRequired(this.emergencyWithdraw.selector) {
        emit Withdraw(msg.sender, true, emergencyWithdrawable());
    }

    receive() external payable { }

    // get randomizer contract status
    function isRandomizerContract() external view returns (bool) {
        return true;
    }
}
