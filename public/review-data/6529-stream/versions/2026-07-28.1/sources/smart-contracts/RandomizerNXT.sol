// SPDX-License-Identifier: MIT

/**
 *
 *  @title NextGen 6529 - NXT Randomizer Contract
 *  @custom:date 20-December-2023
 *  @custom:version 1.5
 *  @author 6529 team
 */

pragma solidity ^0.8.19;

import "./IXRandoms.sol";
import "./IStreamAdmins.sol";
import "./IStreamCore.sol";
import "./StreamPauseDomains.sol";

contract NextGenRandomizerNXT {
    IXRandoms public randoms;
    IStreamAdmins private adminsContract;
    IStreamCore public gencoreContract;
    address gencore;

    constructor(address _randoms, address _admin, address _gencore) {
        randoms = IXRandoms(_randoms);
        adminsContract = IStreamAdmins(_admin);
        gencore = _gencore;
        gencoreContract = IStreamCore(_gencore);
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

    // update contracts if needed

    function updateRandomsContract(address _randoms)
        public
        FunctionAdminRequired(this.updateRandomsContract.selector)
    {
        randoms = IXRandoms(_randoms);
    }

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

    // function that calculates the random hash and returns it to the gencore contract
    function calculateTokenHash(uint256 _collectionID, uint256 _mintIndex, uint256 _saltfun_o)
        public
    {
        require(msg.sender == gencore);
        require(
            adminsContract.isPaused(StreamPauseDomains.RANDOMNESS_REQUEST) == false,
            "Randomness paused"
        );
        bytes32 hash = keccak256(
            abi.encodePacked(
                _mintIndex,
                blockhash(block.number - 1),
                randoms.randomNumber(),
                randoms.randomWord()
            )
        );
        gencoreContract.setTokenHash(_collectionID, _mintIndex, hash);
    }

    // block-derived helper randomness is not production-eligible under ADR 0005
    function isRandomizerContract() external view returns (bool) {
        return false;
    }
}
