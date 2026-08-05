// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/DependencyRegistry.sol";
import "../smart-contracts/StreamAdmins.sol";
import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/StreamCuratorsPool.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";

contract StreamAdminSelectorsTest is CharacterizationTestBase {
    using Assertions for bool;
    using Assertions for bytes32;

    address private constant FUNCTION_ADMIN = address(0xA11CE);

    function testSetCollectionDataRequiresItsOwnSelector() public {
        (StreamAdmins admins, StreamCore core) = _deployCore();
        _createCollection(core);

        admins.registerFunctionAdmin(
            FUNCTION_ADMIN, address(core), core.changeMetadataView.selector, true
        );

        vm.prank(FUNCTION_ADMIN);
        (bool wrongSelectorSuccess,) = address(core).call(_setCollectionDataCall());
        wrongSelectorSuccess.assertFalse("changeMetadataView selector authorized setCollectionData");

        admins.registerFunctionAdmin(
            FUNCTION_ADMIN, address(core), core.setCollectionData.selector, true
        );

        vm.prank(FUNCTION_ADMIN);
        (bool ownSelectorSuccess,) = address(core).call(_setCollectionDataCall());
        ownSelectorSuccess.assertTrue("setCollectionData selector did not authorize");
    }

    function testUpdateCollectionInfoRequiresItsOwnSelector() public {
        (StreamAdmins admins, StreamCore core) = _deployCore();
        _createCollection(core);

        admins.registerFunctionAdmin(
            FUNCTION_ADMIN, address(core), core.changeMetadataView.selector, true
        );

        vm.prank(FUNCTION_ADMIN);
        (bool wrongSelectorSuccess,) = address(core).call(_updateCollectionInfoCall());
        wrongSelectorSuccess.assertFalse(
            "changeMetadataView selector authorized updateCollectionInfo"
        );

        admins.registerFunctionAdmin(
            FUNCTION_ADMIN, address(core), core.updateCollectionInfo.selector, true
        );

        vm.prank(FUNCTION_ADMIN);
        (bool ownSelectorSuccess,) = address(core).call(_updateCollectionInfoCall());
        ownSelectorSuccess.assertTrue("updateCollectionInfo selector did not authorize");
    }

    function testSetMultipleMerkleRootsRequiresItsOwnSelector() public {
        StreamAdmins admins = new StreamAdmins(address(this));
        StreamCuratorsPool pool = new StreamCuratorsPool(address(admins), address(0xD3A1));
        bytes32 root = keccak256("root");

        admins.registerFunctionAdmin(
            FUNCTION_ADMIN, address(pool), pool.setMerkleRoot.selector, true
        );

        vm.prank(FUNCTION_ADMIN);
        (bool wrongSelectorSuccess,) = address(pool).call(_setMultipleMerkleRootsCall(root));
        wrongSelectorSuccess.assertFalse("setMerkleRoot selector authorized setMultipleMerkleRoots");

        admins.registerFunctionAdmin(
            FUNCTION_ADMIN, address(pool), pool.setMultipleMerkleRoots.selector, true
        );

        vm.prank(FUNCTION_ADMIN);
        (bool ownSelectorSuccess,) = address(pool).call(_setMultipleMerkleRootsCall(root));
        ownSelectorSuccess.assertTrue("setMultipleMerkleRoots selector did not authorize");
        pool.collectionMerkleRoot(1).assertEq(root, "root not set");
    }

    function testFunctionAdminGrantIsTargetScoped() public {
        StreamAdmins admins = new StreamAdmins(address(this));
        DependencyRegistry first = new DependencyRegistry(address(admins));
        DependencyRegistry second = new DependencyRegistry(address(admins));

        admins.registerFunctionAdmin(
            FUNCTION_ADMIN, address(first), first.updateAdminContract.selector, true
        );

        vm.prank(FUNCTION_ADMIN);
        (bool firstTargetSuccess,) = address(first)
            .call(abi.encodeWithSelector(first.updateAdminContract.selector, address(admins)));
        firstTargetSuccess.assertTrue("target grant did not authorize target");

        vm.prank(FUNCTION_ADMIN);
        (bool secondTargetSuccess,) = address(second)
            .call(abi.encodeWithSelector(second.updateAdminContract.selector, address(admins)));
        secondTargetSuccess.assertFalse("target grant authorized another contract");
    }

    function testRevokedFunctionAdminCannotCallProtectedFunction() public {
        StreamAdmins admins = new StreamAdmins(address(this));
        DependencyRegistry registry = new DependencyRegistry(address(admins));

        admins.registerFunctionAdmin(
            FUNCTION_ADMIN, address(registry), registry.updateAdminContract.selector, true
        );
        admins.registerFunctionAdmin(
            FUNCTION_ADMIN, address(registry), registry.updateAdminContract.selector, false
        );

        vm.prank(FUNCTION_ADMIN);
        (bool revokedSuccess,) = address(registry)
            .call(abi.encodeWithSelector(registry.updateAdminContract.selector, address(admins)));
        revokedSuccess.assertFalse("revoked function admin still authorized");
    }

    function testGlobalAdminBypassIsExplicit() public {
        StreamAdmins admins = new StreamAdmins(address(this));
        DependencyRegistry registry = new DependencyRegistry(address(admins));
        address globalAdmin = address(0xB055);

        admins.registerAdmin(globalAdmin, true);

        vm.prank(globalAdmin);
        (bool globalAdminSuccess,) = address(registry)
            .call(abi.encodeWithSelector(registry.updateAdminContract.selector, address(admins)));
        globalAdminSuccess.assertTrue("global admin bypass did not authorize");
    }

    function testOwnerCanManageRolesButIsNotImplicitOperationalAdmin() public {
        StreamAdmins admins = new StreamAdmins(address(0xBEEF));
        DependencyRegistry registry = new DependencyRegistry(address(admins));

        (bool ownerOperationalSuccess,) = address(registry)
            .call(abi.encodeWithSelector(registry.updateAdminContract.selector, address(admins)));
        ownerOperationalSuccess.assertFalse("owner was implicit operational admin");

        admins.registerFunctionAdmin(
            FUNCTION_ADMIN, address(registry), registry.updateAdminContract.selector, true
        );

        vm.prank(FUNCTION_ADMIN);
        (bool functionAdminSuccess,) = address(registry)
            .call(abi.encodeWithSelector(registry.updateAdminContract.selector, address(admins)));
        functionAdminSuccess.assertTrue("owner could not grant function admin");
    }

    function testDropSignerCannotManageRolesByDefault() public {
        address signer = address(0xBEEF);
        StreamAdmins admins = new StreamAdmins(signer);
        DependencyRegistry registry = new DependencyRegistry(address(admins));

        admins.retrieveGlobalAdmin(signer).assertFalse("signer global admin enabled");

        vm.prank(signer);
        (bool signerGlobalGrantSuccess,) = address(admins)
            .call(abi.encodeWithSelector(admins.registerAdmin.selector, signer, true));
        signerGlobalGrantSuccess.assertFalse("drop signer registered global admin");

        vm.prank(signer);
        (bool signerFunctionGrantSuccess,) = address(admins)
            .call(
                abi.encodeWithSelector(
                    admins.registerFunctionAdmin.selector,
                    signer,
                    address(registry),
                    registry.addDependency.selector,
                    true
                )
            );
        signerFunctionGrantSuccess.assertFalse("drop signer registered function admin");

        vm.prank(signer);
        (bool signerOperationalSuccess,) =
            address(registry).call(_addDependencyCall(bytes32("no-bypass")));
        signerOperationalSuccess.assertFalse("drop signer was operational admin");
    }

    function _deployCore() private returns (StreamAdmins admins, StreamCore core) {
        admins = new StreamAdmins(address(this));
        admins.registerAdmin(address(this), true);
        DependencyRegistry registry = new DependencyRegistry(address(admins));
        core = new StreamCore("6529 Stream", "STREAM", address(admins), address(registry));
    }

    function _createCollection(StreamCore core) private {
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
    }

    function _setCollectionDataCall() private pure returns (bytes memory) {
        return abi.encodeWithSelector(
            StreamCore.setCollectionData.selector,
            uint256(1),
            address(0xA11CE),
            uint256(5),
            uint256(10),
            uint256(1 days)
        );
    }

    function _updateCollectionInfoCall() private pure returns (bytes memory) {
        string[] memory scripts = new string[](1);
        scripts[0] = "function draw2(){}";
        return abi.encodeWithSelector(
            StreamCore.updateCollectionInfo.selector,
            uint256(1),
            "Genesis Updated",
            "6529",
            "Description",
            "https://6529.io",
            "CC0",
            "ipfs://updated/",
            "https://cdn.example/script.js",
            bytes32(0),
            uint256(999999),
            scripts
        );
    }

    function _setMultipleMerkleRootsCall(bytes32 root) private pure returns (bytes memory) {
        uint256[] memory collectionIds = new uint256[](1);
        bytes32[] memory roots = new bytes32[](1);
        collectionIds[0] = 1;
        roots[0] = root;
        return abi.encodeWithSelector(
            StreamCuratorsPool.setMultipleMerkleRoots.selector, collectionIds, roots
        );
    }

    function _addDependencyCall(bytes32 name) private pure returns (bytes memory) {
        string[] memory scripts = new string[](1);
        scripts[0] = "library";
        return abi.encodeWithSelector(DependencyRegistry.addDependency.selector, name, scripts);
    }
}
