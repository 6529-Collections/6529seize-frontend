// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/StreamAdmins.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";

contract StreamAdminsTest is CharacterizationTestBase {
    using Assertions for address;
    using Assertions for bool;

    event GlobalAdminUpdated(address indexed account, bool enabled, address indexed admin);
    event FunctionAdminUpdated(
        address indexed account,
        address indexed target,
        bytes4 indexed selector,
        bool enabled,
        address admin
    );
    event SignerManagerUpdated(address indexed account, bool enabled, address indexed admin);
    event SignerLifecycleTargetUpdated(address indexed target, bool enabled, address indexed admin);

    function testConstructorRecordsSignerWithoutAdminGrant() public {
        StreamAdmins admins = new StreamAdmins(address(this));

        address(admins.tdhSigner()).assertEq(address(this), "tdh signer mismatch");
        admins.retrieveGlobalAdmin(address(this)).assertFalse("signer is global admin");
    }

    function testZeroTdhSignerConstructorFails() public {
        vm.expectRevert("Zero tdh signer");
        new StreamAdmins(address(0));
    }

    function testOnlyOwnerCanRegisterGlobalAdmin() public {
        StreamAdmins admins = new StreamAdmins(address(0xBEEF));

        vm.prank(address(0xBAD));
        (bool success,) = address(admins)
            .call(abi.encodeWithSelector(admins.registerAdmin.selector, address(0xCAFE), true));

        success.assertFalse("non-registrar registered global admin");
        admins.retrieveGlobalAdmin(address(0xCAFE)).assertFalse("admin was changed");
    }

    function testOwnerCanRegisterGlobalAdminAsRootRecoveryPath() public {
        StreamAdmins admins = new StreamAdmins(address(0xBEEF));

        vm.expectEmit(true, false, true, true);
        emit GlobalAdminUpdated(address(0xCAFE), true, address(this));
        admins.registerAdmin(address(0xCAFE), true);

        admins.retrieveGlobalAdmin(address(0xCAFE))
            .assertTrue("owner did not register global admin");
    }

    function testDropSignerCannotRegisterGlobalAdmin() public {
        address signer = address(0xBEEF);
        StreamAdmins admins = new StreamAdmins(signer);

        vm.prank(signer);
        (bool success,) = address(admins)
            .call(abi.encodeWithSelector(admins.registerAdmin.selector, address(0xCAFE), true));

        success.assertFalse("drop signer registered global admin");
        admins.retrieveGlobalAdmin(address(0xCAFE)).assertFalse("global admin was set");
    }

    function testOwnerCanRegisterFunctionAdmin() public {
        StreamAdmins admins = new StreamAdmins(address(this));
        address target = address(0xF00D);
        bytes4 selector = StreamAdmins.registerAdmin.selector;

        vm.expectEmit(true, true, true, true);
        emit FunctionAdminUpdated(address(0xCAFE), target, selector, true, address(this));
        admins.registerFunctionAdmin(address(0xCAFE), target, selector, true);

        admins.retrieveFunctionAdmin(address(0xCAFE), target, selector)
            .assertTrue("function admin not set");
    }

    function testOwnerCanRevokeFunctionAdmin() public {
        StreamAdmins admins = new StreamAdmins(address(this));
        address functionAdmin = address(0xCAFE);
        address target = address(0xF00D);
        bytes4 selector = StreamAdmins.registerAdmin.selector;

        admins.registerFunctionAdmin(functionAdmin, target, selector, true);

        vm.expectEmit(true, true, true, true);
        emit FunctionAdminUpdated(functionAdmin, target, selector, false, address(this));
        admins.registerFunctionAdmin(functionAdmin, target, selector, false);

        admins.retrieveFunctionAdmin(functionAdmin, target, selector)
            .assertFalse("function admin not revoked");
    }

    function testOwnerCanBatchRegisterFunctionAdmins() public {
        StreamAdmins admins = new StreamAdmins(address(this));
        address functionAdmin = address(0xCAFE);
        address target = address(0xF00D);
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = StreamAdmins.registerAdmin.selector;
        selectors[1] = StreamAdmins.registerFunctionAdmin.selector;

        admins.registerBatchFunctionAdmin(functionAdmin, target, selectors, true);

        admins.retrieveFunctionAdmin(functionAdmin, target, selectors[0])
            .assertTrue("first selector not set");
        admins.retrieveFunctionAdmin(functionAdmin, target, selectors[1])
            .assertTrue("second selector not set");
        admins.retrieveFunctionAdmin(functionAdmin, address(0xABCD), selectors[0])
            .assertFalse("batch grant leaked to another target");
    }

    function testOwnerCanRegisterAndRevokeSignerManager() public {
        StreamAdmins admins = new StreamAdmins(address(this));
        address signerManager = address(0x5151);

        vm.expectEmit(true, false, true, true);
        emit SignerManagerUpdated(signerManager, true, address(this));
        admins.registerSignerManager(signerManager, true);
        admins.signerManagers(signerManager).assertTrue("signer manager not set");

        vm.expectEmit(true, false, true, true);
        emit SignerManagerUpdated(signerManager, false, address(this));
        admins.registerSignerManager(signerManager, false);
        admins.signerManagers(signerManager).assertFalse("signer manager not revoked");
    }

    function testOwnerCanRegisterAndRevokeSignerLifecycleTarget() public {
        StreamAdmins admins = new StreamAdmins(address(this));
        address dropsTarget = address(0xD0D0);

        vm.expectEmit(true, false, true, true);
        emit SignerLifecycleTargetUpdated(dropsTarget, true, address(this));
        admins.registerSignerLifecycleTarget(dropsTarget, true);
        admins.signerLifecycleTargets(dropsTarget).assertTrue("signer target not set");

        vm.expectEmit(true, false, true, true);
        emit SignerLifecycleTargetUpdated(dropsTarget, false, address(this));
        admins.registerSignerLifecycleTarget(dropsTarget, false);
        admins.signerLifecycleTargets(dropsTarget).assertFalse("signer target not revoked");
    }

    function testSignerManagerCanGrantOnlySignerLifecycleSelectors() public {
        StreamAdmins admins = new StreamAdmins(address(this));
        address signerManager = address(0x5151);
        address operator = address(0x5152);
        address dropsTarget = address(0xD0D0);
        bytes4 signerUpdateSelector = admins.DROP_SIGNER_UPDATE_SELECTOR();

        admins.registerSignerManager(signerManager, true);
        admins.registerSignerLifecycleTarget(dropsTarget, true);

        vm.expectEmit(true, true, true, true);
        emit FunctionAdminUpdated(operator, dropsTarget, signerUpdateSelector, true, signerManager);
        vm.prank(signerManager);
        admins.registerSignerFunctionAdmin(operator, dropsTarget, signerUpdateSelector, true);
        admins.retrieveFunctionAdmin(operator, dropsTarget, signerUpdateSelector)
            .assertTrue("signer selector not granted");

        vm.prank(signerManager);
        (bool broadGrantSuccess,) = address(admins)
            .call(
                abi.encodeWithSelector(
                    admins.registerFunctionAdmin.selector,
                    operator,
                    dropsTarget,
                    StreamAdmins.registerAdmin.selector,
                    true
                )
            );
        broadGrantSuccess.assertFalse("signer manager used broad registrar");

        vm.prank(signerManager);
        (bool nonSignerSelectorSuccess,) = address(admins)
            .call(
                abi.encodeWithSelector(
                    admins.registerSignerFunctionAdmin.selector,
                    operator,
                    dropsTarget,
                    StreamAdmins.registerAdmin.selector,
                    true
                )
            );
        nonSignerSelectorSuccess.assertFalse("signer manager granted non-signer selector");
        admins.retrieveFunctionAdmin(operator, dropsTarget, StreamAdmins.registerAdmin.selector)
            .assertFalse("non-signer selector was granted");
    }

    function testSignerManagerCannotGrantUnregisteredLifecycleTarget() public {
        StreamAdmins admins = new StreamAdmins(address(this));
        address signerManager = address(0x5151);
        address operator = address(0x5152);
        address dropsTarget = address(0xD0D0);
        bytes4 signerUpdateSelector = admins.DROP_SIGNER_UPDATE_SELECTOR();

        admins.registerSignerManager(signerManager, true);

        vm.prank(signerManager);
        (bool success,) = address(admins)
            .call(
                abi.encodeWithSelector(
                    admins.registerSignerFunctionAdmin.selector,
                    operator,
                    dropsTarget,
                    signerUpdateSelector,
                    true
                )
            );

        success.assertFalse("signer manager granted unregistered target");
        admins.retrieveFunctionAdmin(operator, dropsTarget, signerUpdateSelector)
            .assertFalse("unregistered target grant was stored");
    }

    function testRevokedSignerManagerCannotGrantSignerLifecycleSelectors() public {
        StreamAdmins admins = new StreamAdmins(address(this));
        address signerManager = address(0x5151);
        address operator = address(0x5152);
        address dropsTarget = address(0xD0D0);
        bytes4 signerUpdateSelector = admins.DROP_SIGNER_UPDATE_SELECTOR();

        admins.registerSignerManager(signerManager, true);
        admins.registerSignerManager(signerManager, false);

        vm.prank(signerManager);
        (bool success,) = address(admins)
            .call(
                abi.encodeWithSelector(
                    admins.registerSignerFunctionAdmin.selector,
                    operator,
                    dropsTarget,
                    signerUpdateSelector,
                    true
                )
            );

        success.assertFalse("revoked signer manager granted selector");
        admins.retrieveFunctionAdmin(operator, dropsTarget, signerUpdateSelector)
            .assertFalse("revoked grant was stored");
    }

    function testZeroAddressRoleAssignmentsFail() public {
        StreamAdmins admins = new StreamAdmins(address(this));

        (bool zeroGlobalSuccess,) = address(admins)
            .call(abi.encodeWithSelector(admins.registerAdmin.selector, address(0), true));
        zeroGlobalSuccess.assertFalse("zero global admin was registered");

        (bool zeroFunctionAdminSuccess,) = address(admins)
            .call(
                abi.encodeWithSelector(
                    admins.registerFunctionAdmin.selector,
                    address(0),
                    address(0xF00D),
                    StreamAdmins.registerAdmin.selector,
                    true
                )
            );
        zeroFunctionAdminSuccess.assertFalse("zero function admin was registered");

        (bool zeroTargetSuccess,) = address(admins)
            .call(
                abi.encodeWithSelector(
                    admins.registerFunctionAdmin.selector,
                    address(0xCAFE),
                    address(0),
                    StreamAdmins.registerAdmin.selector,
                    true
                )
            );
        zeroTargetSuccess.assertFalse("zero target was registered");

        (bool zeroSelectorSuccess,) = address(admins)
            .call(
                abi.encodeWithSelector(
                    admins.registerFunctionAdmin.selector,
                    address(0xCAFE),
                    address(0xF00D),
                    bytes4(0),
                    true
                )
            );
        zeroSelectorSuccess.assertFalse("zero selector was registered");
    }

    function testCollectionAdminSupportIsExplicitlyDeferred() public {
        StreamAdmins admins = new StreamAdmins(address(this));

        admins.retrieveCollectionAdmin(address(0xCAFE), 1)
            .assertFalse("collection admin unexpectedly set");
    }
}
