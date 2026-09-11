// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IERC165.sol";
import "../smart-contracts/IStreamModule.sol";
import "../smart-contracts/StreamModuleBase.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";

contract IdentityTestModule is StreamModuleBase {
    constructor(
        bytes32 schemaHash_,
        address supersedes_,
        bytes32 deploymentManifestHash_,
        string memory manifestURI_,
        bytes32 manifestHash_
    )
        StreamModuleBase(
            schemaHash_, supersedes_, deploymentManifestHash_, manifestURI_, manifestHash_
        )
    { }

    function streamModuleType() public pure override returns (bytes32) {
        return keccak256("STREAM_TEST_MODULE");
    }

    function streamModuleVersion() public pure override returns (bytes32) {
        return bytes32(uint256(1));
    }

    function streamModuleInterfaceId() public pure override returns (bytes4) {
        return type(IStreamModule).interfaceId;
    }
}

contract StreamModuleIdentityTest is CharacterizationTestBase {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for string;
    using Assertions for uint256;

    bytes32 private constant SCHEMA_HASH = keccak256("test-module-schema");
    bytes32 private constant DEPLOYMENT_MANIFEST_HASH = keccak256("test-deployment-manifest");
    bytes32 private constant MANIFEST_HASH = keccak256("test-module-manifest");
    string private constant MANIFEST_URI = "ipfs://test-module-manifest";

    IdentityTestModule private predecessor;
    IdentityTestModule private moduleContract;

    function setUp() public {
        predecessor = new IdentityTestModule(
            SCHEMA_HASH, address(0), DEPLOYMENT_MANIFEST_HASH, MANIFEST_URI, MANIFEST_HASH
        );
        moduleContract = new IdentityTestModule(
            SCHEMA_HASH, address(predecessor), DEPLOYMENT_MANIFEST_HASH, MANIFEST_URI, MANIFEST_HASH
        );
    }

    function testEightFunctionIdentitySurface() public {
        // [LTA-MODULE-ID]: the full eight-function streamModule* surface.
        moduleContract.streamModuleType()
            .assertEq(keccak256("STREAM_TEST_MODULE"), "streamModuleType");
        moduleContract.streamModuleVersion().assertEq(bytes32(uint256(1)), "streamModuleVersion");
        bytes32(moduleContract.streamModuleInterfaceId())
            .assertEq(bytes32(type(IStreamModule).interfaceId), "streamModuleInterfaceId");
        moduleContract.streamModuleSchemaHash().assertEq(SCHEMA_HASH, "streamModuleSchemaHash");
        moduleContract.streamModuleSupersedes()
            .assertEq(address(predecessor), "streamModuleSupersedes");
        moduleContract.streamModuleCodeHash()
            .assertEq(address(moduleContract).codehash, "streamModuleCodeHash");
        moduleContract.streamModuleDeploymentManifestHash()
            .assertEq(DEPLOYMENT_MANIFEST_HASH, "streamModuleDeploymentManifestHash");
        (string memory uri, bytes32 hash) = moduleContract.streamModuleManifest();
        uri.assertEq(MANIFEST_URI, "streamModuleManifest uri");
        hash.assertEq(MANIFEST_HASH, "streamModuleManifest hash");
    }

    function testFirstGenerationModuleSupersedesZero() public {
        predecessor.streamModuleSupersedes()
            .assertEq(address(0), "first-generation module supersedes zero");
    }

    function testModuleCodeHashIsLiveExtcodehash() public {
        // Identical constructor arguments produce identical runtime code, and
        // differing immutables (supersedes) produce distinct code hashes.
        IdentityTestModule twin = new IdentityTestModule(
            SCHEMA_HASH, address(0), DEPLOYMENT_MANIFEST_HASH, MANIFEST_URI, MANIFEST_HASH
        );
        twin.streamModuleCodeHash()
            .assertEq(predecessor.streamModuleCodeHash(), "same construction same code hash");
        (moduleContract.streamModuleCodeHash() != predecessor.streamModuleCodeHash())
        .assertTrue("differing immutables change the code hash");
        (moduleContract.streamModuleCodeHash() != bytes32(0)).assertTrue("nonzero code hash");
    }

    function testSupportsIStreamModuleInterface() public {
        moduleContract.supportsInterface(type(IStreamModule).interfaceId)
            .assertTrue("IStreamModule via ERC-165");
        moduleContract.supportsInterface(type(IERC165).interfaceId).assertTrue("ERC-165");
        moduleContract.supportsInterface(0xffffffff).assertFalse("invalid interface");
    }

    function testInterfaceIdIsXorOfEightSelectors() public {
        bytes4 expected = IStreamModule.streamModuleType.selector
            ^ IStreamModule.streamModuleVersion.selector
            ^ IStreamModule.streamModuleInterfaceId.selector
            ^ IStreamModule.streamModuleSchemaHash.selector
            ^ IStreamModule.streamModuleSupersedes.selector
            ^ IStreamModule.streamModuleCodeHash.selector
            ^ IStreamModule.streamModuleDeploymentManifestHash.selector
            ^ IStreamModule.streamModuleManifest.selector;
        bytes32(type(IStreamModule).interfaceId)
            .assertEq(bytes32(expected), "interface id composition");
    }
}
