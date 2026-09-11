// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/DependencyRegistry.sol";
import "../smart-contracts/StreamAdmins.sol";
import "../smart-contracts/StreamCore.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";

contract StreamCoreAdminCharacterizationTest is CharacterizationTestBase {
    using Assertions for bool;

    function testSetCollectionDataUsesOwnSelector() public {
        address functionAdmin = address(0xA11CE);
        StreamAdmins admins = new StreamAdmins(address(this));
        DependencyRegistry registry = new DependencyRegistry(address(admins));
        StreamCore core =
            new StreamCore("6529 Stream", "STREAM", address(admins), address(registry));

        admins.registerFunctionAdmin(
            address(this), address(core), core.createCollection.selector, true
        );

        string[] memory scripts = new string[](1);
        scripts[0] = "function draw(){}";
        core.createCollection(
            "Genesis",
            "6529",
            "Description",
            "https://6529.io",
            "CC0",
            "ipfs://base/",
            "https://cdn.example/script.js",
            bytes32(0),
            scripts
        );

        admins.registerFunctionAdmin(
            functionAdmin, address(core), core.changeMetadataView.selector, true
        );
        vm.prank(functionAdmin);
        (bool changeMetadataSelectorSuccess,) = address(core)
            .call(
                abi.encodeWithSelector(
                    core.setCollectionData.selector,
                    uint256(1),
                    address(0xA11CE),
                    uint256(5),
                    uint256(10),
                    uint256(1 days)
                )
            );
        changeMetadataSelectorSuccess.assertFalse(
            "changeMetadataView selector authorized setCollectionData"
        );

        admins.registerFunctionAdmin(
            functionAdmin, address(core), core.setCollectionData.selector, true
        );
        vm.prank(functionAdmin);
        (bool setCollectionDataSelectorSuccess,) = address(core)
            .call(
                abi.encodeWithSelector(
                    core.setCollectionData.selector,
                    uint256(1),
                    address(0xA11CE),
                    uint256(5),
                    uint256(10),
                    uint256(1 days)
                )
            );
        setCollectionDataSelectorSuccess.assertTrue("setCollectionData selector did not authorize");
    }
}
