// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/StreamAdmins.sol";
import "../smart-contracts/StreamDrops.sol";
import "./helpers/Assertions.sol";
import "./helpers/DropAuthTestHelper.sol";
import "./helpers/StreamFixture.sol";
import "./mocks/MockStreamMinter.sol";

contract StreamFixedPricePaymentsTest is DropAuthTestHelper, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for uint256;

    event FixedPriceCreditCreated(
        address indexed _add, bytes32 indexed dropId, uint8 indexed creditType, uint256 funds
    );
    event FixedPriceCreditWithdrawn(
        address indexed _add, address indexed _recipient, uint8 indexed creditType, uint256 funds
    );

    address private constant POSTER = address(0x1001);
    address private constant RECIPIENT = address(0x5005);
    address private constant PAYOUT = address(0x2002);
    address private constant CURATORS_POOL = address(0x3003);
    address private constant WITHDRAW_RECIPIENT = address(0x6006);

    function testFixedPriceMintCreditsProceedsWithoutPushPayouts() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        StreamDrops.DropAuthorization memory authorization =
            _buildAuthorization(deployed.drops, POSTER, RECIPIENT, 4 ether, 1);
        bytes memory signature = signAuthorization(deployed.drops, authorization);
        vm.deal(address(this), 10 ether);
        uint256 posterBalanceBefore = POSTER.balance;
        uint256 payoutBalanceBefore = PAYOUT.balance;
        uint256 curatorsBalanceBefore = CURATORS_POOL.balance;

        vm.expectEmit(true, true, true, true);
        emit FixedPriceCreditCreated(POSTER, authorization.dropId, 0, 2 ether);
        vm.expectEmit(true, true, true, true);
        emit FixedPriceCreditCreated(PAYOUT, authorization.dropId, 1, 1 ether);
        vm.expectEmit(true, true, true, true);
        emit FixedPriceCreditCreated(CURATORS_POOL, authorization.dropId, 2, 1 ether);
        deployed.drops.mintDrop{ value: 4 ether }(authorization, "data", signature);

        POSTER.balance.assertEq(posterBalanceBefore, "poster was push-paid");
        PAYOUT.balance.assertEq(payoutBalanceBefore, "protocol was push-paid");
        CURATORS_POOL.balance.assertEq(curatorsBalanceBefore, "curator reserve was push-paid");
        deployed.core.ownerOf(1).assertEq(RECIPIENT, "recipient");
        deployed.drops.fixedPricePosterCredits(POSTER).assertEq(2 ether, "poster credit");
        deployed.drops.fixedPriceProtocolCredits(PAYOUT).assertEq(1 ether, "protocol credit");
        deployed.drops.fixedPriceCuratorReserveCredits(CURATORS_POOL)
            .assertEq(1 ether, "curator reserve credit");
        deployed.drops.totalFixedPricePosterOwed().assertEq(2 ether, "poster owed");
        deployed.drops.totalFixedPriceProtocolOwed().assertEq(1 ether, "protocol owed");
        deployed.drops.totalFixedPriceCuratorReserveOwed().assertEq(1 ether, "curator reserve owed");
        deployed.drops.totalFixedPriceOwed().assertEq(4 ether, "fixed-price owed");
        deployed.drops.totalOwed().assertEq(4 ether, "total owed");
        address(deployed.drops).balance.assertEq(4 ether, "contract balance");
        deployed.drops.emergencyWithdrawable().assertEq(0, "surplus");
    }

    function testRejectingFixedPriceRecipientsCannotBlockMintingAndWithdrawableCreditsCanWithdraw()
        public
    {
        RejectingFixedPriceRecipient rejectingPoster = new RejectingFixedPriceRecipient();
        RejectingFixedPriceRecipient rejectingPayout = new RejectingFixedPriceRecipient();
        RejectingFixedPriceRecipient rejectingCuratorsPool = new RejectingFixedPriceRecipient();
        DeployedStream memory deployed = deployStreamWithSigner(
            address(rejectingPayout), address(rejectingCuratorsPool), signerAddress()
        );
        _mintFixedPrice(deployed, address(rejectingPoster), RECIPIENT, 4 ether, 2);

        deployed.core.ownerOf(1).assertEq(RECIPIENT, "recipient");
        deployed.drops.fixedPricePosterCredits(address(rejectingPoster))
            .assertEq(2 ether, "poster credit");
        deployed.drops.fixedPriceProtocolCredits(address(rejectingPayout))
            .assertEq(1 ether, "protocol credit");
        deployed.drops.fixedPriceCuratorReserveCredits(address(rejectingCuratorsPool))
            .assertEq(1 ether, "curator reserve credit");

        uint256 recipientBalanceBefore = WITHDRAW_RECIPIENT.balance;
        rejectingPoster.withdrawFixedPriceCreditTo(deployed.drops, payable(WITHDRAW_RECIPIENT));
        rejectingPayout.withdrawFixedPriceCreditTo(deployed.drops, payable(WITHDRAW_RECIPIENT));
        (bool curatorReserveWithdrawSuccess,) = address(rejectingCuratorsPool)
            .call(
                abi.encodeWithSelector(
                    rejectingCuratorsPool.withdrawFixedPriceCreditTo.selector,
                    deployed.drops,
                    payable(WITHDRAW_RECIPIENT)
                )
            );

        WITHDRAW_RECIPIENT.balance
            .assertEq(recipientBalanceBefore + 3 ether, "withdraw recipient balance");
        curatorReserveWithdrawSuccess.assertFalse("curator reserve was withdrawable");
        deployed.drops.fixedPriceCuratorReserveCredits(address(rejectingCuratorsPool))
            .assertEq(1 ether, "curator reserve credit");
        deployed.drops.totalOwed().assertEq(1 ether, "owed after withdrawals");
        address(deployed.drops).balance.assertEq(1 ether, "contract balance after withdrawals");
    }

    function testFixedPricePosterWithdrawsCreditToChosenRecipient() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        _mintFixedPrice(deployed, POSTER, RECIPIENT, 4 ether, 3);

        uint256 recipientBalanceBefore = WITHDRAW_RECIPIENT.balance;
        vm.expectEmit(true, true, true, true);
        emit FixedPriceCreditWithdrawn(POSTER, WITHDRAW_RECIPIENT, 0, 2 ether);
        vm.prank(POSTER);
        deployed.drops.withdrawFixedPriceCreditTo(payable(WITHDRAW_RECIPIENT));

        deployed.drops.fixedPricePosterCredits(POSTER).assertEq(0, "poster credit");
        deployed.drops.totalFixedPricePosterOwed().assertEq(0, "poster owed");
        deployed.drops.totalOwed().assertEq(2 ether, "remaining owed");
        WITHDRAW_RECIPIENT.balance
            .assertEq(recipientBalanceBefore + 2 ether, "withdraw recipient balance");
    }

    function testFixedPriceWithdrawalFailurePreservesCredit() public {
        RejectingFixedPriceRecipient rejectingPoster = new RejectingFixedPriceRecipient();
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        _mintFixedPrice(deployed, address(rejectingPoster), RECIPIENT, 4 ether, 4);

        (bool success,) = address(rejectingPoster)
            .call(
                abi.encodeWithSelector(
                    rejectingPoster.withdrawFixedPriceCredit.selector, deployed.drops
                )
            );

        success.assertFalse("failed withdrawal succeeded");
        deployed.drops.fixedPricePosterCredits(address(rejectingPoster))
            .assertEq(2 ether, "poster credit erased");
        deployed.drops.totalFixedPricePosterOwed().assertEq(2 ether, "poster owed changed");
        deployed.drops.totalOwed().assertEq(4 ether, "total owed changed");
    }

    function testReentrantFixedPriceWithdrawalCannotDrainMoreThanCredit() public {
        ReentrantFixedPriceRecipient reentrantPoster = new ReentrantFixedPriceRecipient();
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        _mintFixedPrice(deployed, address(reentrantPoster), RECIPIENT, 4 ether, 5);

        uint256 reentrantBalanceBefore = address(reentrantPoster).balance;
        reentrantPoster.withdrawToSelf(deployed.drops);

        reentrantPoster.reentered().assertFalse("reentrant withdrawal succeeded");
        deployed.drops.fixedPricePosterCredits(address(reentrantPoster))
            .assertEq(0, "poster credit not consumed");
        deployed.drops.totalFixedPricePosterOwed().assertEq(0, "poster owed not reduced");
        address(reentrantPoster).balance
            .assertEq(reentrantBalanceBefore + 2 ether, "withdrawn balance");
        deployed.drops.totalOwed().assertEq(2 ether, "remaining owed");
    }

    function testFixedPriceOddWeiRemainderAccruesToProtocolCredit() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        _mintFixedPrice(deployed, POSTER, RECIPIENT, 7 wei, 6);

        deployed.drops.fixedPricePosterCredits(POSTER).assertEq(3 wei, "poster credit");
        deployed.drops.fixedPriceProtocolCredits(PAYOUT).assertEq(3 wei, "protocol credit");
        deployed.drops.fixedPriceCuratorReserveCredits(CURATORS_POOL)
            .assertEq(1 wei, "curator reserve credit");
        deployed.drops.totalFixedPriceOwed().assertEq(7 wei, "fixed-price owed");
        deployed.drops.totalOwed().assertEq(7 wei, "total owed");
    }

    function testFixedPriceContractSplitCanDisableCuratorReserve() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        deployed.drops.updateContractProceedsSplit(5000, 5000, 0);
        _mintFixedPrice(deployed, POSTER, RECIPIENT, 7 wei, 12);

        deployed.drops.fixedPricePosterCredits(POSTER).assertEq(3 wei, "poster credit");
        deployed.drops.fixedPriceProtocolCredits(PAYOUT).assertEq(4 wei, "protocol credit");
        deployed.drops.fixedPriceCuratorReserveCredits(CURATORS_POOL)
            .assertEq(0, "curator reserve credit");
        deployed.drops.totalFixedPriceOwed().assertEq(7 wei, "fixed-price owed");
        deployed.drops.totalCuratorReserved().assertEq(0, "curator reserve total");
    }

    function testFixedPriceCollectionAndTokenSplitsOverrideContractDefault() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        deployed.drops.updateContractProceedsSplit(5000, 5000, 0);
        deployed.drops.updateCollectionProceedsSplit(1, 4000, 3000, 3000);
        deployed.drops.updateTokenProceedsSplit(1, 6000, 4000, 0);

        _mintFixedPrice(deployed, POSTER, RECIPIENT, 10_000, 13);
        deployed.drops.fixedPricePosterCredits(POSTER).assertEq(6000, "token poster credit");
        deployed.drops.fixedPriceProtocolCredits(PAYOUT).assertEq(4000, "token protocol credit");
        deployed.drops.fixedPriceCuratorReserveCredits(CURATORS_POOL)
            .assertEq(0, "token curator reserve");

        deployed.drops.clearTokenProceedsSplit(1);
        _mintFixedPrice(deployed, POSTER, RECIPIENT, 10_000, 14);
        deployed.drops.fixedPricePosterCredits(POSTER).assertEq(10_000, "poster credit");
        deployed.drops.fixedPriceProtocolCredits(PAYOUT).assertEq(7000, "protocol credit");
        deployed.drops.fixedPriceCuratorReserveCredits(CURATORS_POOL)
            .assertEq(3000, "collection curator reserve");

        deployed.drops.clearCollectionProceedsSplit(1);
        (uint16 posterBps, uint16 protocolBps, uint16 curatorBps) =
            deployed.drops.proceedsSplitFor(1, 2);
        uint256(posterBps).assertEq(5000, "contract poster bps");
        uint256(protocolBps).assertEq(5000, "contract protocol bps");
        uint256(curatorBps).assertEq(0, "contract curator bps");
    }

    function testFixedPriceRejectsInvalidProceedsSplit() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());

        (bool success,) = address(deployed.drops)
            .call(
                abi.encodeWithSelector(
                    deployed.drops.updateContractProceedsSplit.selector, 5000, 5000, 1
                )
            );

        success.assertFalse("invalid split accepted");
    }

    function testOneWeiFixedPriceRemainderCreditsOnlyProtocol() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        _mintFixedPrice(deployed, POSTER, RECIPIENT, 1 wei, 7);

        deployed.drops.fixedPricePosterCredits(POSTER).assertEq(0, "poster credit");
        deployed.drops.fixedPriceProtocolCredits(PAYOUT).assertEq(1 wei, "protocol credit");
        deployed.drops.fixedPriceCuratorReserveCredits(CURATORS_POOL)
            .assertEq(0, "curator reserve credit");
        deployed.drops.totalFixedPriceOwed().assertEq(1 wei, "fixed-price owed");
        deployed.drops.totalOwed().assertEq(1 wei, "total owed");
    }

    function testFreeFixedPriceMintCreatesNoPaymentCredits() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        _mintFixedPrice(deployed, POSTER, RECIPIENT, 0, 8);

        deployed.core.ownerOf(1).assertEq(RECIPIENT, "recipient");
        deployed.drops.fixedPricePosterCredits(POSTER).assertEq(0, "poster credit");
        deployed.drops.fixedPriceProtocolCredits(PAYOUT).assertEq(0, "protocol credit");
        deployed.drops.fixedPriceCuratorReserveCredits(CURATORS_POOL)
            .assertEq(0, "curator reserve credit");
        deployed.drops.totalFixedPriceOwed().assertEq(0, "fixed-price owed");
        deployed.drops.totalOwed().assertEq(0, "total owed");
        address(deployed.drops).balance.assertEq(0, "contract balance");
    }

    function testFixedPriceWithdrawalRejectsZeroRecipientAndKeepsCredit() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        _mintFixedPrice(deployed, POSTER, RECIPIENT, 4 ether, 9);

        vm.prank(POSTER);
        (bool success,) = address(deployed.drops)
            .call(
                abi.encodeWithSelector(
                    deployed.drops.withdrawFixedPriceCreditTo.selector, payable(address(0))
                )
            );

        success.assertFalse("zero recipient withdrawal succeeded");
        deployed.drops.fixedPricePosterCredits(POSTER).assertEq(2 ether, "poster credit");
        deployed.drops.totalFixedPricePosterOwed().assertEq(2 ether, "poster owed");
    }

    function testFixedPriceProceedsRecipientConfigurationRejectsZeroAddresses() public {
        _tryDeployDrops(address(0), CURATORS_POOL).assertFalse("zero payout constructor accepted");
        _tryDeployDrops(PAYOUT, address(0)).assertFalse("zero curator constructor accepted");

        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        (bool payoutSuccess,) = address(deployed.drops)
            .call(abi.encodeWithSelector(deployed.drops.updatePayOutAddress.selector, address(0)));
        (bool curatorSuccess,) = address(deployed.drops)
            .call(
                abi.encodeWithSelector(
                    deployed.drops.updateCuratorsPoolAddress.selector, address(0)
                )
            );

        payoutSuccess.assertFalse("zero payout setter accepted");
        curatorSuccess.assertFalse("zero curator setter accepted");
        deployed.drops.payOutAddress().assertEq(PAYOUT, "payout changed");
        deployed.drops.curatorsPoolAddress().assertEq(CURATORS_POOL, "curator changed");
    }

    function testForcedEthOnlyIncreasesFixedPriceSurplus() public {
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, CURATORS_POOL, signerAddress());
        _mintFixedPrice(deployed, POSTER, RECIPIENT, 4 ether, 10);

        uint256 owedBefore = deployed.drops.totalOwed();
        uint256 balanceBefore = address(deployed.drops).balance;
        FixedPriceForceEth forceEth = new FixedPriceForceEth{ value: 1 ether }();
        forceEth.force(payable(address(deployed.drops)));

        address(deployed.drops).balance.assertEq(balanceBefore + 1 ether, "forced balance");
        deployed.drops.totalOwed().assertEq(owedBefore, "owed changed");
        deployed.drops.emergencyWithdrawable().assertEq(1 ether, "surplus not exposed");
    }

    function testFixedPriceMintFailureDoesNotLeaveCreditsOrConsumeDrop() public {
        RevertingStreamMinter revertingMinter = new RevertingStreamMinter();
        StreamAdmins admins = new StreamAdmins(address(this));
        StreamDrops drops = new StreamDrops(
            signerAddress(), address(revertingMinter), address(admins), PAYOUT, CURATORS_POOL
        );
        StreamDrops.DropAuthorization memory authorization =
            _buildAuthorization(drops, POSTER, RECIPIENT, 4 ether, 11);
        bytes memory signature = signAuthorization(drops, authorization);
        vm.deal(address(this), 10 ether);

        (bool success,) = address(drops).call{ value: 4 ether }(
            abi.encodeWithSelector(drops.mintDrop.selector, authorization, "data", signature)
        );

        success.assertFalse("mint failure succeeded");
        drops.isDropConsumed(authorization.dropId).assertFalse("drop consumed");
        drops.retrieveDrops().length.assertEq(0, "drop recorded");
        drops.fixedPricePosterCredits(POSTER).assertEq(0, "poster credit");
        drops.fixedPriceProtocolCredits(PAYOUT).assertEq(0, "protocol credit");
        drops.fixedPriceCuratorReserveCredits(CURATORS_POOL).assertEq(0, "curator reserve credit");
        drops.totalOwed().assertEq(0, "total owed");
        address(drops).balance.assertEq(0, "contract balance");
    }

    function testFixedPriceCuratorReserveCanBeReleasedToContractPool() public {
        PassiveFixedPriceCuratorsPool curatorsPool = new PassiveFixedPriceCuratorsPool();
        DeployedStream memory deployed =
            deployStreamWithSigner(PAYOUT, address(curatorsPool), signerAddress());
        _mintFixedPrice(deployed, POSTER, RECIPIENT, 4 ether, 12_001);

        uint256 poolBalanceBefore = address(curatorsPool).balance;
        vm.expectEmit(true, true, true, true);
        emit FixedPriceCreditWithdrawn(address(curatorsPool), address(curatorsPool), 2, 1 ether);
        deployed.drops.releaseFixedPriceCuratorReserveCredit();

        address(curatorsPool).balance.assertEq(poolBalanceBefore + 1 ether, "pool balance");
        deployed.drops.fixedPriceCuratorReserveCredits(address(curatorsPool))
            .assertEq(0, "curator reserve credit");
        deployed.drops.totalFixedPriceCuratorReserveOwed().assertEq(0, "curator reserve owed");
        deployed.drops.totalOwed().assertEq(3 ether, "poster and protocol remain owed");
    }

    function _mintFixedPrice(
        DeployedStream memory deployed,
        address poster,
        address recipient,
        uint256 price,
        uint256 nonce
    ) private returns (StreamDrops.DropAuthorization memory authorization) {
        authorization = _buildAuthorization(deployed.drops, poster, recipient, price, nonce);
        bytes memory signature = signAuthorization(deployed.drops, authorization);
        vm.deal(address(this), 10 ether);
        deployed.drops.mintDrop{ value: price }(authorization, "data", signature);
    }

    function _buildAuthorization(
        StreamDrops drops,
        address poster,
        address recipient,
        uint256 price,
        uint256 nonce
    ) private view returns (StreamDrops.DropAuthorization memory authorization) {
        address payer = price == 0 ? address(0) : address(this);
        return buildFixedPriceAuthorization(
            drops,
            poster,
            recipient,
            payer,
            "data",
            1,
            price,
            nonce,
            nonce + 1_000,
            block.timestamp + 1 days
        );
    }

    function _tryDeployDrops(address payout, address curatorsPool) private returns (bool) {
        MockStreamMinter minter = new MockStreamMinter();
        StreamAdmins admins = new StreamAdmins(address(this));
        try new StreamDrops(
            signerAddress(), address(minter), address(admins), payout, curatorsPool
        ) returns (
            StreamDrops
        ) {
            return true;
        } catch {
            return false;
        }
    }
}

contract RejectingFixedPriceRecipient {
    receive() external payable {
        revert("reject eth");
    }

    function withdrawFixedPriceCredit(StreamDrops drops) external {
        drops.withdrawFixedPriceCredit();
    }

    function withdrawFixedPriceCreditTo(StreamDrops drops, address payable recipient) external {
        drops.withdrawFixedPriceCreditTo(recipient);
    }
}

contract PassiveFixedPriceCuratorsPool {
    receive() external payable { }
}

contract ReentrantFixedPriceRecipient {
    StreamDrops private drops;
    bool public reentered;
    bool private attacking;

    receive() external payable {
        if (attacking) {
            attacking = false;
            (bool success,) =
                address(drops).call(abi.encodeWithSelector(drops.withdrawFixedPriceCredit.selector));
            reentered = success;
        }
    }

    function withdrawToSelf(StreamDrops drops_) external {
        drops = drops_;
        attacking = true;
        drops_.withdrawFixedPriceCredit();
    }
}

contract RevertingStreamMinter {
    function isMinterContract() external pure returns (bool) {
        return true;
    }

    function getEndTime(uint256) external pure returns (uint256) {
        return type(uint256).max;
    }

    function getAuctionEndTime(uint256) external pure returns (uint256) {
        return 0;
    }

    function getAuctionStatus(uint256) external pure returns (bool) {
        return false;
    }

    function mint(address[] memory, string[] memory, uint256[] memory, uint256, uint256[] memory)
        external
        pure
        returns (uint256)
    {
        revert("mint failed");
    }

    function mintAndAuction(address, string memory, uint256, uint256, uint256)
        external
        pure
        returns (uint256)
    {
        revert("mint failed");
    }

    function updateAuctionEndTime(uint256, uint256) external pure { }
}

// Intentionally uses selfdestruct under Solidity 0.8.19 to test forced-ETH
// surplus accounting that cannot be exercised with a normal payable call.
contract FixedPriceForceEth {
    constructor() payable { }

    function force(address payable target) external {
        selfdestruct(target);
    }
}
