// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../smart-contracts/DependencyRegistry.sol";
import "../../smart-contracts/StreamAdmins.sol";
import "../../smart-contracts/StreamCore.sol";
import "../../smart-contracts/StreamDrops.sol";
import "../../smart-contracts/StreamMinter.sol";
import "../mocks/MockRandomizer.sol";

abstract contract StreamFixture {
    uint256 internal constant FULL_COLLECTION_UPDATE_INDEX = 10 ** 6;

    struct DeployedStream {
        StreamAdmins admins;
        DependencyRegistry dependencyRegistry;
        StreamCore core;
        StreamMinter minter;
        StreamDrops drops;
        ImmediateRandomizer randomizer;
    }

    function deployStream(address payout, address curatorsPool)
        internal
        returns (DeployedStream memory deployed)
    {
        deployed = deployStreamWithSigner(payout, curatorsPool, address(this));
    }

    function deployStreamWithSigner(address payout, address curatorsPool, address signer)
        internal
        returns (DeployedStream memory deployed)
    {
        deployed.admins = new StreamAdmins(address(this));
        deployed.admins.registerAdmin(address(this), true);
        deployed.dependencyRegistry = new DependencyRegistry(address(deployed.admins));
        deployed.core = new StreamCore(
            "6529 Stream", "STREAM", address(deployed.admins), address(deployed.dependencyRegistry)
        );
        deployed.minter =
            new StreamMinter(address(deployed.core), address(deployed.admins), address(0));
        deployed.drops = new StreamDrops(
            signer, address(deployed.minter), address(deployed.admins), payout, curatorsPool
        );
        deployed.randomizer = new ImmediateRandomizer(address(deployed.core));

        deployed.core.updateContracts(2, address(deployed.minter));
        deployed.minter.updateContracts(3, address(deployed.drops));

        string[] memory scripts = new string[](1);
        scripts[0] = "function draw(){}";
        deployed.core
            .createCollection(
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
        deployed.core.setCollectionData(1, address(0xA11CE), 5, 10, 1 days);
        deployed.core.addRandomizer(1, address(deployed.randomizer));
        deployed.minter.setCollectionPhases(1, block.timestamp, block.timestamp + 30 days);
    }

    function _pinCollectionDependency(DeployedStream memory deployed, bytes32 dependencyKey)
        internal
    {
        string[] memory scripts = new string[](1);
        scripts[0] = "function draw(){}";
        deployed.core
            .updateCollectionInfo(
                1,
                "Genesis",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "ipfs://base/",
                "https://cdn.example/script.js",
                dependencyKey,
                FULL_COLLECTION_UPDATE_INDEX,
                scripts
            );
    }
}
