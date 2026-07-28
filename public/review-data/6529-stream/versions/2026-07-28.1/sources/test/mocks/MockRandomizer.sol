// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../smart-contracts/IRandomizer.sol";
import "../../smart-contracts/IStreamCore.sol";

contract ImmediateRandomizer is IRandomizer {
    IStreamCore private immutable core;

    constructor(address core_) {
        core = IStreamCore(core_);
    }

    function calculateTokenHash(uint256 collectionId, uint256 mintIndex, uint256 saltfunO)
        external
    {
        bytes32 tokenHash = keccak256(abi.encode(collectionId, mintIndex, saltfunO));
        core.setTokenHash(collectionId, mintIndex, tokenHash);
    }

    function isRandomizerContract() external pure returns (bool) {
        return true;
    }
}

contract NoopRandomizer is IRandomizer {
    function calculateTokenHash(uint256, uint256, uint256) external { }

    function isRandomizerContract() external pure returns (bool) {
        return true;
    }
}

contract RejectETH {
    receive() external payable {
        revert("reject eth");
    }
}
