// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./helpers/Assertions.sol";
import "./helpers/DropAuthTestHelper.sol";
import "./helpers/StreamFixture.sol";

contract StreamMinterValidationTest is DropAuthTestHelper, StreamFixture {
    using Assertions for bool;
    using Assertions for bytes32;

    function testMintRejectsMismatchedBatchLengths() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        address[] memory recipients = new address[](1);
        string[] memory tokenData = new string[](0);
        uint256[] memory salts = new uint256[](1);
        uint256[] memory quantities = new uint256[](1);
        recipients[0] = address(0xA11CE);
        salts[0] = 1;
        quantities[0] = 1;

        _assertMintReverts(
            deployed, recipients, tokenData, salts, quantities, "Array length mismatch"
        );
    }

    function testMintRejectsEmptyBatch() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        address[] memory recipients = new address[](0);
        string[] memory tokenData = new string[](0);
        uint256[] memory salts = new uint256[](0);
        uint256[] memory quantities = new uint256[](0);

        _assertMintReverts(deployed, recipients, tokenData, salts, quantities, "No recipients");
    }

    function testMintRejectsZeroQuantity() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        address[] memory recipients = new address[](1);
        string[] memory tokenData = new string[](1);
        uint256[] memory salts = new uint256[](1);
        uint256[] memory quantities = new uint256[](1);
        recipients[0] = address(0xA11CE);
        tokenData[0] = "token";
        salts[0] = 1;
        quantities[0] = 0;

        _assertMintReverts(deployed, recipients, tokenData, salts, quantities, "Zero quantity");
    }

    function _assertMintReverts(
        DeployedStream memory deployed,
        address[] memory recipients,
        string[] memory tokenData,
        uint256[] memory salts,
        uint256[] memory quantities,
        string memory expectedReason
    ) private {
        vm.prank(address(deployed.drops));
        (bool success, bytes memory revertData) = address(deployed.minter)
            .call(
                abi.encodeWithSelector(
                    deployed.minter.mint.selector, recipients, tokenData, salts, 1, quantities
                )
            );
        success.assertFalse("mint succeeded");
        keccak256(revertData)
            .assertEq(
                keccak256(abi.encodeWithSignature("Error(string)", expectedReason)),
                "unexpected revert data"
            );
    }
}
