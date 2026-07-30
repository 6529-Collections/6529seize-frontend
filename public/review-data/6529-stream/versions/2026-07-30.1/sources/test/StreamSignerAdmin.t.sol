// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/StreamAdmins.sol";
import "../smart-contracts/StreamDrops.sol";
import "./helpers/Assertions.sol";
import "./helpers/DropAuthTestHelper.sol";
import "./mocks/MockStreamMinter.sol";

contract StreamSignerAdminTest is DropAuthTestHelper {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for uint256;

    address private constant POSTER = address(0x1001);
    address private constant RECIPIENT = address(0x5005);
    address private constant PAYOUT = address(0x2002);
    address private constant CURATORS_POOL = address(0x3003);
    address private constant SIGNER_MANAGER = address(0x5151);
    address private constant SIGNER_OPERATOR = address(0x5152);
    address private constant STRANGER = address(0xBAD);

    event FunctionAdminUpdated(
        address indexed account,
        address indexed target,
        bytes4 indexed selector,
        bool enabled,
        address admin
    );
    event SignerEpochChanged(uint256 indexed oldEpoch, uint256 indexed newEpoch);
    event DropSignerChanged(
        address indexed oldSigner, address indexed newSigner, uint256 indexed signerEpoch
    );
    event DropAuthorizationCancelled(bytes32 indexed dropId, address indexed admin);

    function testSignerManagerGrantsExactLifecycleSelectors() public {
        (StreamAdmins admins, StreamDrops drops) = _deployDrops();
        admins.registerSignerManager(SIGNER_MANAGER, true);
        admins.registerSignerLifecycleTarget(address(drops), true);

        bytes4[] memory selectors = _signerSelectors(drops);
        vm.expectEmit(true, true, true, true);
        emit FunctionAdminUpdated(
            SIGNER_OPERATOR, address(drops), drops.updateTDHsigner.selector, true, SIGNER_MANAGER
        );
        vm.expectEmit(true, true, true, true);
        emit FunctionAdminUpdated(
            SIGNER_OPERATOR,
            address(drops),
            drops.incrementSignerEpoch.selector,
            true,
            SIGNER_MANAGER
        );
        vm.expectEmit(true, true, true, true);
        emit FunctionAdminUpdated(
            SIGNER_OPERATOR, address(drops), drops.cancelDrop.selector, true, SIGNER_MANAGER
        );
        vm.prank(SIGNER_MANAGER);
        admins.registerBatchSignerFunctionAdmin(SIGNER_OPERATOR, address(drops), selectors, true);

        admins.retrieveFunctionAdmin(
                SIGNER_OPERATOR, address(drops), drops.updateTDHsigner.selector
            ).assertTrue("update signer grant missing");
        admins.retrieveFunctionAdmin(
                SIGNER_OPERATOR, address(drops), drops.incrementSignerEpoch.selector
            ).assertTrue("epoch grant missing");
        admins.retrieveFunctionAdmin(SIGNER_OPERATOR, address(drops), drops.cancelDrop.selector)
            .assertTrue("cancel grant missing");
    }

    function testSignerRotationInvalidatesOldPayloadAndAcceptsNewSigner() public {
        (StreamAdmins admins, StreamDrops drops) = _deployDrops();
        _grantSignerLifecycle(admins, drops, SIGNER_OPERATOR);
        StreamDrops.DropAuthorization memory oldAuthorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "old", 1, 0, 1, 2, block.timestamp + 1 days
        );
        bytes memory oldSignature = signAuthorization(drops, oldAuthorization);

        vm.expectEmit(true, true, false, true);
        emit SignerEpochChanged(1, 2);
        vm.expectEmit(true, true, true, true);
        emit DropSignerChanged(signerAddress(), otherSignerAddress(), 2);
        vm.prank(SIGNER_OPERATOR);
        drops.updateTDHsigner(otherSignerAddress());

        drops.tdhSigner().assertEq(otherSignerAddress(), "signer not rotated");
        drops.signerEpoch().assertEq(2, "epoch not incremented");
        (bool staleSuccess,) = address(drops)
            .call(
                abi.encodeWithSelector(
                    drops.mintDrop.selector, oldAuthorization, "old", oldSignature
                )
            );
        staleSuccess.assertFalse("old signer payload minted after rotation");
        drops.isDropConsumed(oldAuthorization.dropId).assertFalse("old payload consumed");

        StreamDrops.DropAuthorization memory newAuthorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "new", 1, 0, 3, 4, block.timestamp + 1 days
        );
        drops.mintDrop(
            newAuthorization,
            "new",
            signAuthorizationWithKey(drops, newAuthorization, OTHER_SIGNER_KEY)
        );
        drops.isDropConsumed(newAuthorization.dropId).assertTrue("new signer payload failed");
    }

    function testSignerManagerCanCancelBeforeExecutionButNotAfterConsumption() public {
        (StreamAdmins admins, StreamDrops drops) = _deployDrops();
        _grantSignerLifecycle(admins, drops, SIGNER_OPERATOR);
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "cancelled", 1, 0, 5, 6, block.timestamp + 1 days
        );

        vm.expectEmit(true, true, false, true);
        emit DropAuthorizationCancelled(authorization.dropId, SIGNER_OPERATOR);
        vm.prank(SIGNER_OPERATOR);
        drops.cancelDrop(authorization.dropId);

        drops.isDropCancelled(authorization.dropId).assertTrue("drop was not cancelled");
        (bool cancelledMint,) = address(drops)
            .call(
                abi.encodeWithSelector(
                    drops.mintDrop.selector,
                    authorization,
                    "cancelled",
                    signAuthorization(drops, authorization)
                )
            );
        cancelledMint.assertFalse("cancelled drop minted");

        StreamDrops.DropAuthorization memory consumedAuthorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "consumed", 1, 0, 7, 8, block.timestamp + 1 days
        );
        drops.mintDrop(
            consumedAuthorization, "consumed", signAuthorization(drops, consumedAuthorization)
        );
        vm.prank(SIGNER_OPERATOR);
        (bool cancelConsumedSuccess,) = address(drops)
            .call(abi.encodeWithSelector(drops.cancelDrop.selector, consumedAuthorization.dropId));
        cancelConsumedSuccess.assertFalse("consumed drop was cancelled");
        drops.isDropConsumed(consumedAuthorization.dropId).assertTrue("consumed state changed");
        drops.isDropCancelled(consumedAuthorization.dropId)
            .assertFalse("consumed drop cancellation stored");
    }

    function testUnauthorizedCallerCannotOperateSignerLifecycle() public {
        (, StreamDrops drops) = _deployDrops();
        StreamDrops.DropAuthorization memory authorization = buildFixedPriceAuthorization(
            drops, POSTER, RECIPIENT, address(0), "data", 1, 0, 9, 10, block.timestamp + 1 days
        );

        vm.prank(STRANGER);
        (bool rotateSuccess,) = address(drops)
            .call(abi.encodeWithSelector(drops.updateTDHsigner.selector, otherSignerAddress()));
        rotateSuccess.assertFalse("unauthorized signer rotation succeeded");

        vm.prank(STRANGER);
        (bool epochSuccess,) =
            address(drops).call(abi.encodeWithSelector(drops.incrementSignerEpoch.selector));
        epochSuccess.assertFalse("unauthorized epoch increment succeeded");

        vm.prank(STRANGER);
        (bool cancelSuccess,) = address(drops)
            .call(abi.encodeWithSelector(drops.cancelDrop.selector, authorization.dropId));
        cancelSuccess.assertFalse("unauthorized cancellation succeeded");

        drops.tdhSigner().assertEq(signerAddress(), "signer changed");
        drops.signerEpoch().assertEq(1, "epoch changed");
        drops.isDropCancelled(authorization.dropId).assertFalse("drop cancelled");
    }

    function _deployDrops() private returns (StreamAdmins admins, StreamDrops drops) {
        MockStreamMinter minter = new MockStreamMinter();
        admins = new StreamAdmins(signerAddress());
        drops = new StreamDrops(
            signerAddress(), address(minter), address(admins), PAYOUT, CURATORS_POOL
        );
    }

    function _grantSignerLifecycle(StreamAdmins admins, StreamDrops drops, address operator)
        private
    {
        admins.registerSignerManager(SIGNER_MANAGER, true);
        admins.registerSignerLifecycleTarget(address(drops), true);
        vm.prank(SIGNER_MANAGER);
        admins.registerBatchSignerFunctionAdmin(
            operator, address(drops), _signerSelectors(drops), true
        );
    }

    function _signerSelectors(StreamDrops drops) private pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](3);
        selectors[0] = drops.updateTDHsigner.selector;
        selectors[1] = drops.incrementSignerEpoch.selector;
        selectors[2] = drops.cancelDrop.selector;
    }
}
