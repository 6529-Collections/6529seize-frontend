// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/StreamAdmins.sol";
import "../smart-contracts/StreamCuratorsPool.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";

contract StreamCuratorsPoolTest is CharacterizationTestBase {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for uint256;
    using Assertions for bytes32;

    event Reward(address indexed _add, uint256 indexed collectionID, uint256 indexed amount);
    event MerkleRootUpdated(
        uint256 indexed collectionID, uint256 indexed rootEpoch, bytes32 indexed merkleRoot
    );
    event CuratorCreditCreated(
        address indexed _add, uint256 indexed collectionID, uint256 indexed funds
    );
    event CuratorCreditWithdrawn(
        address indexed _add, address indexed _recipient, uint256 indexed funds
    );

    address private constant CURATOR = address(0x1001);
    address private constant DELEGATOR = address(0x2002);
    address private constant DELEGATE = address(0x3003);
    address private constant WITHDRAW_RECIPIENT = address(0x4004);
    address private constant EMERGENCY_RECIPIENT = address(0x5005);
    address private constant OTHER_CURATOR = address(0x6006);
    uint256 private constant COLLECTION_ID = 42;
    uint256 private constant OTHER_COLLECTION_ID = 43;
    uint256 private constant REWARD_AMOUNT = 3 ether;

    function testClaimRewardsCreatesCuratorCreditWithoutPushPayment() public {
        PoolSetup memory setup = _deployPool();
        bytes32[] memory proof = _setSingleLeafRoot(setup.pool, CURATOR, REWARD_AMOUNT);
        vm.deal(address(setup.pool), REWARD_AMOUNT);
        uint256 curatorBalanceBefore = CURATOR.balance;

        vm.expectEmit(true, true, true, true);
        emit CuratorCreditCreated(CURATOR, COLLECTION_ID, REWARD_AMOUNT);
        vm.expectEmit(true, true, true, true);
        emit Reward(CURATOR, COLLECTION_ID, REWARD_AMOUNT);
        vm.prank(CURATOR);
        setup.pool.claimRewards(COLLECTION_ID, REWARD_AMOUNT, proof, address(0));

        CURATOR.balance.assertEq(curatorBalanceBefore, "curator was push-paid");
        setup.pool.rewardsPerAddress(COLLECTION_ID, CURATOR)
            .assertEq(REWARD_AMOUNT, "reward amount");
        setup.pool.rewardsClaimPerAddress(COLLECTION_ID, CURATOR).assertTrue("reward not claimed");
        setup.pool.curatorCredits(CURATOR).assertEq(REWARD_AMOUNT, "curator credit");
        setup.pool.totalCuratorOwed().assertEq(REWARD_AMOUNT, "curator owed");
        setup.pool.totalOwed().assertEq(REWARD_AMOUNT, "total owed");
        setup.pool.emergencyWithdrawable().assertEq(0, "surplus");
    }

    function testClaimRewardsRejectsDuplicateClaimWithoutIncreasingCredit() public {
        PoolSetup memory setup = _deployPool();
        bytes32[] memory proof = _setSingleLeafRoot(setup.pool, CURATOR, REWARD_AMOUNT);
        vm.deal(address(setup.pool), REWARD_AMOUNT);

        vm.prank(CURATOR);
        setup.pool.claimRewards(COLLECTION_ID, REWARD_AMOUNT, proof, address(0));
        vm.prank(CURATOR);
        (bool success,) = address(setup.pool)
            .call(
                abi.encodeWithSelector(
                    setup.pool.claimRewards.selector,
                    COLLECTION_ID,
                    REWARD_AMOUNT,
                    proof,
                    address(0)
                )
            );

        success.assertFalse("duplicate claim succeeded");
        setup.pool.curatorCredits(CURATOR).assertEq(REWARD_AMOUNT, "credit changed");
        setup.pool.totalCuratorOwed().assertEq(REWARD_AMOUNT, "owed changed");
    }

    function testClaimRewardsRejectsInvalidProofWithoutConsumingClaim() public {
        PoolSetup memory setup = _deployPool();
        bytes32[] memory proof = new bytes32[](0);
        setup.pool.setMerkleRoot(COLLECTION_ID, bytes32(uint256(1)));

        vm.prank(CURATOR);
        (bool success,) = address(setup.pool)
            .call(
                abi.encodeWithSelector(
                    setup.pool.claimRewards.selector,
                    COLLECTION_ID,
                    REWARD_AMOUNT,
                    proof,
                    address(0)
                )
            );

        success.assertFalse("invalid proof succeeded");
        setup.pool.rewardsClaimPerAddress(COLLECTION_ID, CURATOR).assertFalse("claim consumed");
        setup.pool.curatorCredits(CURATOR).assertEq(0, "credit created");
        setup.pool.totalCuratorOwed().assertEq(0, "owed created");
    }

    function testClaimRewardsRejectsStaleRootEpochProofWithoutConsumingClaim() public {
        PoolSetup memory setup = _deployPool();
        uint256 staleEpoch = setup.pool.collectionMerkleRootEpoch(COLLECTION_ID) + 1;
        bytes32 staleLeaf =
            setup.pool.hashRewardLeaf(CURATOR, COLLECTION_ID, REWARD_AMOUNT, staleEpoch);
        setup.pool.setMerkleRoot(COLLECTION_ID, staleLeaf);
        setup.pool.setMerkleRoot(COLLECTION_ID, staleLeaf);
        bytes32[] memory proof = new bytes32[](0);
        vm.deal(address(setup.pool), REWARD_AMOUNT);

        vm.prank(CURATOR);
        (bool success,) = address(setup.pool)
            .call(
                abi.encodeWithSelector(
                    setup.pool.claimRewards.selector,
                    COLLECTION_ID,
                    REWARD_AMOUNT,
                    proof,
                    address(0)
                )
            );

        success.assertFalse("stale root epoch proof succeeded");
        setup.pool.rewardsClaimPerAddress(COLLECTION_ID, CURATOR).assertFalse("claim consumed");
        setup.pool.curatorCredits(CURATOR).assertEq(0, "credit created");
        setup.pool.totalCuratorOwed().assertEq(0, "owed created");
    }

    function testClaimRewardsRejectsWrongCollectionLeafWithoutConsumingClaim() public {
        PoolSetup memory setup = _deployPool();
        uint256 rootEpoch = setup.pool.collectionMerkleRootEpoch(COLLECTION_ID) + 1;
        bytes32 wrongCollectionLeaf =
            setup.pool.hashRewardLeaf(CURATOR, OTHER_COLLECTION_ID, REWARD_AMOUNT, rootEpoch);
        setup.pool.setMerkleRoot(COLLECTION_ID, wrongCollectionLeaf);
        bytes32[] memory proof = new bytes32[](0);
        vm.deal(address(setup.pool), REWARD_AMOUNT);

        vm.prank(CURATOR);
        (bool success,) = address(setup.pool)
            .call(
                abi.encodeWithSelector(
                    setup.pool.claimRewards.selector,
                    COLLECTION_ID,
                    REWARD_AMOUNT,
                    proof,
                    address(0)
                )
            );

        success.assertFalse("wrong collection proof succeeded");
        setup.pool.rewardsClaimPerAddress(COLLECTION_ID, CURATOR).assertFalse("claim consumed");
        setup.pool.curatorCredits(CURATOR).assertEq(0, "credit created");
    }

    function testClaimRewardsRejectsWrongClaimantLeafWithoutConsumingClaim() public {
        PoolSetup memory setup = _deployPool();
        uint256 rootEpoch = setup.pool.collectionMerkleRootEpoch(COLLECTION_ID) + 1;
        bytes32 wrongClaimantLeaf =
            setup.pool.hashRewardLeaf(OTHER_CURATOR, COLLECTION_ID, REWARD_AMOUNT, rootEpoch);
        setup.pool.setMerkleRoot(COLLECTION_ID, wrongClaimantLeaf);
        bytes32[] memory proof = new bytes32[](0);
        vm.deal(address(setup.pool), REWARD_AMOUNT);

        vm.prank(CURATOR);
        (bool success,) = address(setup.pool)
            .call(
                abi.encodeWithSelector(
                    setup.pool.claimRewards.selector,
                    COLLECTION_ID,
                    REWARD_AMOUNT,
                    proof,
                    address(0)
                )
            );

        success.assertFalse("wrong claimant proof succeeded");
        setup.pool.rewardsClaimPerAddress(COLLECTION_ID, CURATOR).assertFalse("claim consumed");
        setup.pool.curatorCredits(CURATOR).assertEq(0, "credit created");
    }

    function testClaimRewardsRejectsWrongAmountLeafWithoutConsumingClaim() public {
        PoolSetup memory setup = _deployPool();
        uint256 rootEpoch = setup.pool.collectionMerkleRootEpoch(COLLECTION_ID) + 1;
        bytes32 wrongAmountLeaf =
            setup.pool.hashRewardLeaf(CURATOR, COLLECTION_ID, REWARD_AMOUNT + 1 wei, rootEpoch);
        setup.pool.setMerkleRoot(COLLECTION_ID, wrongAmountLeaf);
        bytes32[] memory proof = new bytes32[](0);
        vm.deal(address(setup.pool), REWARD_AMOUNT);

        vm.prank(CURATOR);
        (bool success,) = address(setup.pool)
            .call(
                abi.encodeWithSelector(
                    setup.pool.claimRewards.selector,
                    COLLECTION_ID,
                    REWARD_AMOUNT,
                    proof,
                    address(0)
                )
            );

        success.assertFalse("wrong amount proof succeeded");
        setup.pool.rewardsClaimPerAddress(COLLECTION_ID, CURATOR).assertFalse("claim consumed");
        setup.pool.curatorCredits(CURATOR).assertEq(0, "credit created");
    }

    function testClaimRewardsRejectsUnfundedCreditWithoutConsumingClaim() public {
        PoolSetup memory setup = _deployPool();
        bytes32[] memory proof = _setSingleLeafRoot(setup.pool, CURATOR, REWARD_AMOUNT);
        vm.deal(address(setup.pool), REWARD_AMOUNT - 1 wei);

        vm.prank(CURATOR);
        (bool success,) = address(setup.pool)
            .call(
                abi.encodeWithSelector(
                    setup.pool.claimRewards.selector,
                    COLLECTION_ID,
                    REWARD_AMOUNT,
                    proof,
                    address(0)
                )
            );

        success.assertFalse("unfunded claim succeeded");
        setup.pool.rewardsClaimPerAddress(COLLECTION_ID, CURATOR).assertFalse("claim consumed");
        setup.pool.curatorCredits(CURATOR).assertEq(0, "credit created");
        setup.pool.totalCuratorOwed().assertEq(0, "owed created");
        setup.pool.emergencyWithdrawable().assertEq(REWARD_AMOUNT - 1 wei, "surplus changed");
    }

    function testDelegatedClaimCreditsDelegatorNotDelegate() public {
        PoolSetup memory setup = _deployPool();
        setup.delegation.setDelegation(DELEGATOR, DELEGATE, true);
        bytes32[] memory proof = _setSingleLeafRoot(setup.pool, DELEGATOR, REWARD_AMOUNT);
        vm.deal(address(setup.pool), REWARD_AMOUNT);

        vm.prank(DELEGATE);
        setup.pool.claimRewards(COLLECTION_ID, REWARD_AMOUNT, proof, DELEGATOR);

        setup.pool.rewardsClaimPerAddress(COLLECTION_ID, DELEGATOR)
            .assertTrue("delegator claim missing");
        setup.pool.curatorCredits(DELEGATOR).assertEq(REWARD_AMOUNT, "delegator credit");
        setup.pool.curatorCredits(DELEGATE).assertEq(0, "delegate credit");

        uint256 recipientBalanceBefore = WITHDRAW_RECIPIENT.balance;
        vm.prank(DELEGATOR);
        setup.pool.withdrawCuratorCreditTo(payable(WITHDRAW_RECIPIENT));
        WITHDRAW_RECIPIENT.balance
            .assertEq(recipientBalanceBefore + REWARD_AMOUNT, "withdraw recipient");
    }

    function testRejectingRewardAddressCannotBlockClaimAndFailedWithdrawalPreservesCredit() public {
        PoolSetup memory setup = _deployPool();
        RejectingCuratorReward rejectingCurator = new RejectingCuratorReward();
        bytes32[] memory proof =
            _setSingleLeafRoot(setup.pool, address(rejectingCurator), REWARD_AMOUNT);
        vm.deal(address(setup.pool), REWARD_AMOUNT);

        rejectingCurator.claim(setup.pool, COLLECTION_ID, REWARD_AMOUNT, proof);

        setup.pool.rewardsClaimPerAddress(COLLECTION_ID, address(rejectingCurator))
            .assertTrue("claim missing");
        setup.pool.curatorCredits(address(rejectingCurator))
            .assertEq(REWARD_AMOUNT, "credit missing");
        (bool success,) = address(rejectingCurator)
            .call(abi.encodeWithSelector(rejectingCurator.withdraw.selector, setup.pool));

        success.assertFalse("failed withdrawal succeeded");
        setup.pool.curatorCredits(address(rejectingCurator))
            .assertEq(REWARD_AMOUNT, "credit erased");
        setup.pool.totalCuratorOwed().assertEq(REWARD_AMOUNT, "owed changed");
    }

    function testCuratorWithdrawsCreditToChosenRecipient() public {
        PoolSetup memory setup = _deployPool();
        bytes32[] memory proof = _setSingleLeafRoot(setup.pool, CURATOR, REWARD_AMOUNT);
        vm.deal(address(setup.pool), REWARD_AMOUNT);

        vm.prank(CURATOR);
        setup.pool.claimRewards(COLLECTION_ID, REWARD_AMOUNT, proof, address(0));

        uint256 recipientBalanceBefore = WITHDRAW_RECIPIENT.balance;
        vm.expectEmit(true, true, true, true);
        emit CuratorCreditWithdrawn(CURATOR, WITHDRAW_RECIPIENT, REWARD_AMOUNT);
        vm.prank(CURATOR);
        setup.pool.withdrawCuratorCreditTo(payable(WITHDRAW_RECIPIENT));

        setup.pool.curatorCredits(CURATOR).assertEq(0, "credit not consumed");
        setup.pool.totalCuratorOwed().assertEq(0, "owed not reduced");
        WITHDRAW_RECIPIENT.balance
            .assertEq(recipientBalanceBefore + REWARD_AMOUNT, "recipient balance");
    }

    function testCuratorWithdrawalRejectsZeroRecipientAndKeepsCredit() public {
        PoolSetup memory setup = _deployPool();
        bytes32[] memory proof = _setSingleLeafRoot(setup.pool, CURATOR, REWARD_AMOUNT);
        vm.deal(address(setup.pool), REWARD_AMOUNT);
        vm.prank(CURATOR);
        setup.pool.claimRewards(COLLECTION_ID, REWARD_AMOUNT, proof, address(0));

        vm.prank(CURATOR);
        (bool success,) = address(setup.pool)
            .call(
                abi.encodeWithSelector(
                    setup.pool.withdrawCuratorCreditTo.selector, payable(address(0))
                )
            );

        success.assertFalse("zero recipient withdrawal succeeded");
        setup.pool.curatorCredits(CURATOR).assertEq(REWARD_AMOUNT, "credit changed");
        setup.pool.totalCuratorOwed().assertEq(REWARD_AMOUNT, "owed changed");
    }

    function testReentrantCuratorWithdrawalCannotDrainMoreThanCredit() public {
        PoolSetup memory setup = _deployPool();
        ReentrantCuratorReward reentrantCurator = new ReentrantCuratorReward();
        bytes32[] memory proof =
            _setSingleLeafRoot(setup.pool, address(reentrantCurator), REWARD_AMOUNT);
        vm.deal(address(setup.pool), REWARD_AMOUNT);
        reentrantCurator.claim(setup.pool, COLLECTION_ID, REWARD_AMOUNT, proof);

        uint256 balanceBefore = address(reentrantCurator).balance;
        reentrantCurator.withdrawToSelf(setup.pool);

        reentrantCurator.reentered().assertFalse("reentrant withdrawal succeeded");
        setup.pool.curatorCredits(address(reentrantCurator)).assertEq(0, "credit left");
        setup.pool.totalCuratorOwed().assertEq(0, "owed left");
        address(reentrantCurator).balance
            .assertEq(balanceBefore + REWARD_AMOUNT, "withdrawn balance");
    }

    function testEmergencyWithdrawOnlyWithdrawsSurplus() public {
        PoolSetup memory setup = _deployPool();
        bytes32[] memory proof = _setSingleLeafRoot(setup.pool, CURATOR, REWARD_AMOUNT);
        vm.deal(address(setup.pool), REWARD_AMOUNT + 1 ether);
        setup.admins.updateEmergencyRecipient(EMERGENCY_RECIPIENT);

        vm.prank(CURATOR);
        setup.pool.claimRewards(COLLECTION_ID, REWARD_AMOUNT, proof, address(0));

        uint256 recipientBalanceBefore = EMERGENCY_RECIPIENT.balance;
        setup.pool.emergencyWithdraw();

        EMERGENCY_RECIPIENT.balance
            .assertEq(recipientBalanceBefore + 1 ether, "surplus not withdrawn");
        address(setup.pool).balance.assertEq(REWARD_AMOUNT, "owed balance not preserved");
        setup.pool.curatorCredits(CURATOR).assertEq(REWARD_AMOUNT, "credit changed");
        setup.pool.totalOwed().assertEq(REWARD_AMOUNT, "owed changed");
        setup.pool.emergencyWithdrawable().assertEq(0, "surplus left");
    }

    function testForcedEthOnlyIncreasesCuratorPoolSurplus() public {
        PoolSetup memory setup = _deployPool();
        bytes32[] memory proof = _setSingleLeafRoot(setup.pool, CURATOR, REWARD_AMOUNT);
        vm.deal(address(setup.pool), REWARD_AMOUNT);
        vm.prank(CURATOR);
        setup.pool.claimRewards(COLLECTION_ID, REWARD_AMOUNT, proof, address(0));

        CuratorForceEth forceEth = new CuratorForceEth{ value: 1 ether }();
        forceEth.force(payable(address(setup.pool)));

        setup.pool.totalOwed().assertEq(REWARD_AMOUNT, "owed changed");
        setup.pool.emergencyWithdrawable().assertEq(1 ether, "surplus not exposed");
    }

    function testMerkleRootUpdateAdvancesEpochAndEmitsEvent() public {
        PoolSetup memory setup = _deployPool();
        uint256 rootEpoch = setup.pool.collectionMerkleRootEpoch(COLLECTION_ID) + 1;
        bytes32 leaf = setup.pool.hashRewardLeaf(CURATOR, COLLECTION_ID, REWARD_AMOUNT, rootEpoch);

        vm.expectEmit(true, true, true, true);
        emit MerkleRootUpdated(COLLECTION_ID, rootEpoch, leaf);
        setup.pool.setMerkleRoot(COLLECTION_ID, leaf);

        setup.pool.collectionMerkleRootEpoch(COLLECTION_ID).assertEq(rootEpoch, "root epoch");
        setup.pool.collectionMerkleRoot(COLLECTION_ID).assertEq(leaf, "root");
    }

    function testMultipleMerkleRootUpdateRejectsLengthMismatch() public {
        PoolSetup memory setup = _deployPool();
        setup.admins
            .registerFunctionAdmin(
                address(this), address(setup.pool), setup.pool.setMultipleMerkleRoots.selector, true
            );
        uint256[] memory collectionIds = new uint256[](2);
        bytes32[] memory roots = new bytes32[](1);
        collectionIds[0] = COLLECTION_ID;
        collectionIds[1] = OTHER_COLLECTION_ID;
        roots[0] = bytes32(uint256(1));

        vm.expectRevert(bytes("Bad root input"));
        setup.pool.setMultipleMerkleRoots(collectionIds, roots);
    }

    function testCurrentRewardLeafUsesCurrentRootEpoch() public {
        PoolSetup memory setup = _deployPool();
        bytes32[] memory proof = _setSingleLeafRoot(setup.pool, CURATOR, REWARD_AMOUNT);
        proof.length.assertEq(0, "proof");

        setup.pool.hashRewardLeaf(CURATOR, COLLECTION_ID, REWARD_AMOUNT)
            .assertEq(
                setup.pool.hashRewardLeaf(CURATOR, COLLECTION_ID, REWARD_AMOUNT, 1), "current leaf"
            );
    }

    function testRewardLeafUsesDomainSeparatedAbiEncodeCompatibleHash() public {
        PoolSetup memory setup = _deployPool();
        uint256 rootEpoch = 7;
        bytes32 expected = keccak256(
            bytes.concat(
                keccak256(
                    abi.encode(
                        setup.pool.CURATOR_REWARD_LEAF_DOMAIN(),
                        block.chainid,
                        address(setup.pool),
                        COLLECTION_ID,
                        CURATOR,
                        REWARD_AMOUNT,
                        rootEpoch
                    )
                )
            )
        );

        setup.pool.hashRewardLeaf(CURATOR, COLLECTION_ID, REWARD_AMOUNT, rootEpoch)
            .assertEq(expected, "leaf hash");
    }

    function _deployPool() private returns (PoolSetup memory setup) {
        setup.admins = new StreamAdmins(address(this));
        setup.delegation = new MockDelegationManagement();
        setup.pool = new StreamCuratorsPool(address(setup.admins), address(setup.delegation));
        setup.admins
            .registerFunctionAdmin(
                address(this), address(setup.pool), setup.pool.setMerkleRoot.selector, true
            );
        setup.admins
            .registerFunctionAdmin(
                address(this), address(setup.pool), setup.pool.emergencyWithdraw.selector, true
            );
    }

    function _setSingleLeafRoot(StreamCuratorsPool pool, address rewardAddress, uint256 amount)
        private
        returns (bytes32[] memory proof)
    {
        uint256 rootEpoch = pool.collectionMerkleRootEpoch(COLLECTION_ID) + 1;
        bytes32 leaf = pool.hashRewardLeaf(rewardAddress, COLLECTION_ID, amount, rootEpoch);
        pool.setMerkleRoot(COLLECTION_ID, leaf);
        proof = new bytes32[](0);
    }
}

struct PoolSetup {
    StreamAdmins admins;
    MockDelegationManagement delegation;
    StreamCuratorsPool pool;
}

contract MockDelegationManagement {
    mapping(bytes32 => bool) public allowedDelegations;

    function setDelegation(address delegator, address delegate, bool allowed) external {
        allowedDelegations[_delegationKey(delegator, delegate)] = allowed;
    }

    function retrieveGlobalStatusOfDelegation(address delegator, address, address delegate, uint256)
        external
        view
        returns (bool)
    {
        return allowedDelegations[_delegationKey(delegator, delegate)];
    }

    function _delegationKey(address delegator, address delegate) private pure returns (bytes32) {
        return keccak256(abi.encode(delegator, delegate));
    }
}

contract RejectingCuratorReward {
    receive() external payable {
        revert("reject eth");
    }

    function claim(
        StreamCuratorsPool pool,
        uint256 collectionId,
        uint256 amount,
        bytes32[] calldata proof
    ) external {
        pool.claimRewards(collectionId, amount, proof, address(0));
    }

    function withdraw(StreamCuratorsPool pool) external {
        pool.withdrawCuratorCredit();
    }
}

contract ReentrantCuratorReward {
    StreamCuratorsPool private pool;
    bool public reentered;
    bool private attacking;

    receive() external payable {
        if (attacking) {
            attacking = false;
            (bool success,) =
                address(pool).call(abi.encodeWithSelector(pool.withdrawCuratorCredit.selector));
            reentered = success;
        }
    }

    function claim(
        StreamCuratorsPool pool_,
        uint256 collectionId,
        uint256 amount,
        bytes32[] calldata proof
    ) external {
        pool_.claimRewards(collectionId, amount, proof, address(0));
    }

    function withdrawToSelf(StreamCuratorsPool pool_) external {
        pool = pool_;
        attacking = true;
        pool_.withdrawCuratorCredit();
        attacking = false;
    }
}

// Intentionally uses selfdestruct under Solidity 0.8.19 to test forced-ETH
// surplus accounting that cannot be exercised with a normal payable call.
contract CuratorForceEth {
    constructor() payable { }

    function force(address payable target) external {
        selfdestruct(target);
    }
}
