// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/AuctionContract.sol";
import "../smart-contracts/IRandomizer.sol";
import "../smart-contracts/IStreamCore.sol";
import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/StreamDrops.sol";
import "./RehearseDeployment.s.sol";

interface AuctionCeremonyVm {
    function addr(uint256 privateKey) external returns (address);
    function deal(address account, uint256 balance) external;
    function sign(uint256 privateKey, bytes32 digest)
        external
        returns (uint8 v, bytes32 r, bytes32 s);
    function startBroadcast(address broadcaster) external;
    function stopBroadcast() external;
    function warp(uint256 timestamp) external;
}

contract AuctionCeremonyRandomizer is IRandomizer {
    IStreamCore private immutable core;

    constructor(address core_) {
        core = IStreamCore(core_);
    }

    function calculateTokenHash(uint256 collectionId, uint256 mintIndex, uint256 saltfunO)
        external
    {
        core.setTokenHash(
            collectionId, mintIndex, deterministicHash(collectionId, mintIndex, saltfunO)
        );
    }

    function deterministicHash(uint256 collectionId, uint256 mintIndex, uint256 saltfunO)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode("local-auction-ceremony", collectionId, mintIndex, saltfunO));
    }

    function isRandomizerContract() external pure returns (bool) {
        return true;
    }
}

contract RehearseAuctionCeremony {
    AuctionCeremonyVm private constant vm =
        AuctionCeremonyVm(address(uint160(uint256(keccak256("hevm cheat code")))));

    uint256 private constant SIGNER_KEY = 0xA11CE;
    string private constant EVIDENCE_KIND = "local-anvil-auction-ceremony";
    string private constant TOKEN_DATA = "auction-ceremony";
    uint256 private constant BID_AMOUNT = 4 ether;
    address private constant POSTER = address(0x00000000000000000000000000000000000065A1);
    address private constant BIDDER = address(0x00000000000000000000000000000000000065A2);
    address private constant CURATOR_PROCEEDS_RECIPIENT =
        address(0x00000000000000000000000000000000000065A3);

    struct AuctionCeremonyResult {
        string evidenceKind;
        uint256 chainId;
        bytes32 deploymentManifestHash;
        uint256 collectionId;
        bytes32 dropId;
        uint256 tokenId;
        uint256 auctionEndTime;
        address finalOwner;
        address highestBidder;
        uint256 highestBid;
        uint8 finalStatus;
        uint256 posterProceedsWithdrawn;
        uint256 protocolProceedsWithdrawn;
        uint256 curatorProceedsWithdrawn;
        uint256 totalOwedAfterWithdrawals;
    }

    function run() external returns (AuctionCeremonyResult memory result) {
        RehearseDeployment deployment = new RehearseDeployment();
        RehearseDeployment.DeploymentConfig memory config = deployment.defaultLocalConfig();
        config.tdhSigner = vm.addr(SIGNER_KEY);

        RehearseDeployment.DeploymentResult memory deployed = deployment.deployLocal(config);
        StreamCore core = StreamCore(deployed.core);
        StreamDrops drops = StreamDrops(deployed.drops);
        StreamAuctions auctions = StreamAuctions(deployed.auctions);

        vm.startBroadcast(config.adminSafe);
        AuctionCeremonyRandomizer randomizer = new AuctionCeremonyRandomizer(address(core));
        core.addRandomizer(deployed.sampleCollectionId, address(randomizer));
        auctions.updateCuratorsPoolAddress(CURATOR_PROCEEDS_RECIPIENT);
        vm.stopBroadcast();

        uint256 auctionEndTime = block.timestamp + 1 days;
        StreamDrops.DropAuthorization memory authorization =
            _buildAuthorization(drops, deployed.sampleCollectionId, auctionEndTime);
        bytes memory signature = _signAuthorization(drops, authorization);

        vm.startBroadcast(POSTER);
        drops.mintDrop(authorization, TOKEN_DATA, signature);
        vm.stopBroadcast();

        uint256 tokenId = drops.retrieveTokenID(authorization.dropId);
        _assertTokenHash(core, randomizer, deployed.sampleCollectionId, tokenId);
        _assert(core.ownerOf(tokenId) == address(auctions), "auction custody missing");
        _assert(
            uint8(auctions.retrieveAuctionStatus(tokenId))
                == uint8(StreamAuctions.AuctionStatus.Active),
            "auction not active"
        );

        vm.deal(BIDDER, BID_AMOUNT + 1 ether);
        vm.startBroadcast(BIDDER);
        auctions.participateToAuction{ value: BID_AMOUNT }(tokenId);
        vm.stopBroadcast();

        _assert(auctions.auctionHighestBidder(tokenId) == BIDDER, "highest bidder mismatch");
        _assert(auctions.auctionHighestBid(tokenId) == BID_AMOUNT, "highest bid mismatch");
        _assert(auctions.totalAuctionBidEscrow() == BID_AMOUNT, "bid escrow mismatch");

        vm.warp(auctionEndTime + 1);
        _assert(
            uint8(auctions.retrieveAuctionStatus(tokenId))
                == uint8(StreamAuctions.AuctionStatus.EndedWithBid),
            "auction not ended with bid"
        );

        vm.startBroadcast(BIDDER);
        auctions.claimAuction(tokenId);
        vm.stopBroadcast();

        _assert(core.ownerOf(tokenId) == BIDDER, "bidder did not receive token");
        _assert(
            uint8(auctions.retrieveAuctionStatus(tokenId))
                == uint8(StreamAuctions.AuctionStatus.SettledWithBid),
            "auction not settled with bid"
        );
        _assert(auctions.totalAuctionBidEscrow() == 0, "bid escrow not released");
        _assert(auctions.totalProceedsOwed() == BID_AMOUNT, "proceeds owed mismatch");

        (uint256 posterWithdrawn, uint256 protocolWithdrawn, uint256 curatorWithdrawn) =
            _withdrawProceeds(auctions, config);

        _assert(auctions.totalOwed() == 0, "owed balance remains");
        _assert(address(auctions).balance == 0, "auction balance remains");

        result = AuctionCeremonyResult({
            evidenceKind: EVIDENCE_KIND,
            chainId: deployed.chainId,
            deploymentManifestHash: deployed.manifestHash,
            collectionId: deployed.sampleCollectionId,
            dropId: authorization.dropId,
            tokenId: tokenId,
            auctionEndTime: auctionEndTime,
            finalOwner: core.ownerOf(tokenId),
            highestBidder: auctions.auctionHighestBidder(tokenId),
            highestBid: auctions.auctionHighestBid(tokenId),
            finalStatus: uint8(auctions.retrieveAuctionStatus(tokenId)),
            posterProceedsWithdrawn: posterWithdrawn,
            protocolProceedsWithdrawn: protocolWithdrawn,
            curatorProceedsWithdrawn: curatorWithdrawn,
            totalOwedAfterWithdrawals: auctions.totalOwed()
        });
    }

    function _buildAuthorization(StreamDrops drops, uint256 collectionId, uint256 auctionEndTime)
        private
        view
        returns (StreamDrops.DropAuthorization memory authorization)
    {
        uint256 nonce = 10;
        uint256 salt = 11;
        uint256 signerEpoch = drops.signerEpoch();
        authorization = StreamDrops.DropAuthorization({
            dropId: drops.deriveDropId(drops.tdhSigner(), signerEpoch, nonce, salt),
            poster: POSTER,
            recipient: address(0),
            payer: address(0),
            collectionId: collectionId,
            saleMode: drops.SALE_MODE_AUCTION(),
            tokenDataHash: keccak256(bytes(TOKEN_DATA)),
            price: 0,
            quantity: 1,
            auctionReservePrice: BID_AMOUNT,
            auctionEndTime: auctionEndTime,
            salt: salt,
            nonce: nonce,
            deadline: block.timestamp + 1 days,
            signerEpoch: signerEpoch
        });
    }

    function _signAuthorization(
        StreamDrops drops,
        StreamDrops.DropAuthorization memory authorization
    ) private returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            SIGNER_KEY, drops.hashDropAuthorization(authorization)
        );
        return abi.encodePacked(r, s, v);
    }

    function _assertTokenHash(
        StreamCore core,
        AuctionCeremonyRandomizer randomizer,
        uint256 collectionId,
        uint256 tokenId
    ) private view {
        bytes32 tokenHash = core.retrieveTokenHash(tokenId);
        bytes32 expectedTokenHash = randomizer.deterministicHash(collectionId, tokenId, 0);
        _assert(tokenHash != bytes32(0), "token hash missing");
        _assert(tokenHash == expectedTokenHash, "token hash mismatch");
    }

    function _withdrawProceeds(
        StreamAuctions auctions,
        RehearseDeployment.DeploymentConfig memory config
    )
        private
        returns (uint256 posterWithdrawn, uint256 protocolWithdrawn, uint256 curatorWithdrawn)
    {
        uint256 posterCredit = auctions.auctionPosterCredits(POSTER);
        uint256 protocolCredit = auctions.auctionProtocolCredits(config.payout);
        uint256 curatorCredit = auctions.auctionCuratorCredits(CURATOR_PROCEEDS_RECIPIENT);
        _assert(
            posterCredit + protocolCredit + curatorCredit == BID_AMOUNT, "proceeds credit mismatch"
        );

        _withdrawFor(auctions, POSTER);
        _withdrawFor(auctions, config.payout);
        _withdrawFor(auctions, CURATOR_PROCEEDS_RECIPIENT);

        _assert(auctions.auctionPosterCredits(POSTER) == 0, "poster credit remains");
        _assert(auctions.auctionProtocolCredits(config.payout) == 0, "protocol credit remains");
        _assert(
            auctions.auctionCuratorCredits(CURATOR_PROCEEDS_RECIPIENT) == 0,
            "curator credit remains"
        );

        posterWithdrawn = posterCredit;
        protocolWithdrawn = protocolCredit;
        curatorWithdrawn = curatorCredit;
    }

    function _withdrawFor(StreamAuctions auctions, address account) private {
        vm.startBroadcast(account);
        auctions.withdrawAuctionProceedsCreditTo(payable(account));
        vm.stopBroadcast();
    }

    function _assert(bool condition, string memory message) private pure {
        require(condition, message);
    }
}
