// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";
import "../smart-contracts/IERC721Receiver.sol";
import "../smart-contracts/IRandomizer.sol";
import "../smart-contracts/IStreamCore.sol";

contract TrackingRandomizer is IRandomizer {
    IStreamCore private immutable core;
    bytes32 private immutable marker;

    uint256 public callCount;
    uint256 public lastCollectionId;
    uint256 public lastMintIndex;
    uint256 public lastSaltfunO;

    constructor(address core_, bytes32 marker_) {
        core = IStreamCore(core_);
        marker = marker_;
    }

    function calculateTokenHash(uint256 collectionId, uint256 mintIndex, uint256 saltfunO)
        external
    {
        callCount++;
        lastCollectionId = collectionId;
        lastMintIndex = mintIndex;
        lastSaltfunO = saltfunO;
        core.setTokenHash(collectionId, mintIndex, hashFor(collectionId, mintIndex, saltfunO));
    }

    function hashFor(uint256 collectionId, uint256 mintIndex, uint256 saltfunO)
        public
        view
        returns (bytes32)
    {
        return keccak256(abi.encode(marker, collectionId, mintIndex, saltfunO));
    }

    function isRandomizerContract() external pure returns (bool) {
        return true;
    }
}

contract RandomizerRotatingReceiver is IERC721Receiver {
    StreamCore private immutable core;
    uint256 private immutable collectionId;
    address private immutable replacementRandomizer;

    uint256 public receivedTokenId;

    constructor(StreamCore core_, uint256 collectionId_, address replacementRandomizer_) {
        core = core_;
        collectionId = collectionId_;
        replacementRandomizer = replacementRandomizer_;
    }

    function onERC721Received(address, address, uint256 tokenId, bytes calldata)
        external
        returns (bytes4)
    {
        receivedTokenId = tokenId;
        core.addRandomizer(collectionId, replacementRandomizer);
        return IERC721Receiver.onERC721Received.selector;
    }
}

contract StreamMintAccountingTest is CharacterizationTestBase, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant TOKEN_ID = 1;
    address private constant RECIPIENT = address(0xA11CE);

    function testRetainedAirdropMintCounterStartsAtZeroAndIncrements() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        deployed.core.retrieveTokensAirdroppedPerAddress(COLLECTION_ID, RECIPIENT)
            .assertEq(0, "unexpected initial airdrop count");

        vm.prank(address(deployed.minter));
        deployed.core.mint(TOKEN_ID, RECIPIENT, "token-a", 111, COLLECTION_ID);

        deployed.core.retrieveTokensAirdroppedPerAddress(COLLECTION_ID, RECIPIENT)
            .assertEq(1, "first mint not counted");

        vm.prank(address(deployed.minter));
        deployed.core.mint(TOKEN_ID + 1, RECIPIENT, "token-b", 222, COLLECTION_ID);

        deployed.core.retrieveTokensAirdroppedPerAddress(COLLECTION_ID, RECIPIENT)
            .assertEq(2, "second mint not counted");
    }

    function testUnauthorizedMintDoesNotIncrementRetainedAirdropCounter() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        vm.prank(address(0xB0B));
        (bool success,) = address(deployed.core)
            .call(
                abi.encodeWithSelector(
                    deployed.core.mint.selector, TOKEN_ID, RECIPIENT, "token-a", 111, COLLECTION_ID
                )
            );
        success.assertFalse("unauthorized mint succeeded");

        deployed.core.retrieveTokensAirdroppedPerAddress(COLLECTION_ID, RECIPIENT)
            .assertEq(0, "failed mint changed airdrop count");
    }

    function testSupplyExhaustedMintAfterBurnDoesNotAdvanceUncheckedCounters() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        for (uint256 i = 0; i < 10; i++) {
            _mintToken(deployed, TOKEN_ID + i, i + 1);
        }

        vm.prank(RECIPIENT);
        deployed.core.burn(TOKEN_ID);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.CollectionSupplyReached.selector));
        _mintToken(deployed, TOKEN_ID + 10, 11);

        deployed.core.viewCirSupply(COLLECTION_ID).assertEq(10, "failed mint advanced circulation");
        deployed.core.totalSupplyOfCollection(COLLECTION_ID)
            .assertEq(9, "failed mint changed live supply");
        deployed.core.burnAmount(COLLECTION_ID).assertEq(1, "burn count drifted");
        deployed.core.retrieveTokensAirdroppedPerAddress(COLLECTION_ID, RECIPIENT)
            .assertEq(10, "failed mint advanced airdrop count");
    }

    function testFinalSupplyUsesMintedEverNotLiveSupplyAfterBurn() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        _mintToken(deployed, TOKEN_ID, 1);
        _mintToken(deployed, TOKEN_ID + 1, 2);

        vm.prank(RECIPIENT);
        deployed.core.burn(TOKEN_ID);
        _warpPastFinalSupplyWindow();

        deployed.core.setFinalSupply(COLLECTION_ID);

        (,, uint256 circulationSupply, uint256 collectionTotalSupply,,) =
            deployed.core.retrieveCollectionAdditionalData(COLLECTION_ID);
        circulationSupply.assertEq(2, "circulation should remain minted-ever");
        collectionTotalSupply.assertEq(2, "final supply should use minted-ever");
        deployed.core.lastAllocatedTokenId()
            .assertEq(TOKEN_ID + 1, "allocator mark should remain minted-ever boundary");
        deployed.core.totalSupplyOfCollection(COLLECTION_ID)
            .assertEq(1, "live supply should exclude burned token");
    }

    function testRepeatedFinalSupplyDoesNotDriftUncheckedBounds() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        _mintToken(deployed, TOKEN_ID, 1);
        _mintToken(deployed, TOKEN_ID + 1, 2);

        vm.prank(RECIPIENT);
        deployed.core.burn(TOKEN_ID);
        _warpPastFinalSupplyWindow();

        deployed.core.setFinalSupply(COLLECTION_ID);
        deployed.core.setFinalSupply(COLLECTION_ID);

        (,, uint256 circulationSupply, uint256 collectionTotalSupply,,) =
            deployed.core.retrieveCollectionAdditionalData(COLLECTION_ID);
        circulationSupply.assertEq(2, "circulation drifted");
        collectionTotalSupply.assertEq(2, "final supply drifted");
        deployed.core.lastAllocatedTokenId().assertEq(TOKEN_ID + 1, "allocator mark drifted");
        deployed.core.totalSupplyOfCollection(COLLECTION_ID).assertEq(1, "live supply drifted");
        deployed.core.burnAmount(COLLECTION_ID).assertEq(1, "burn count drifted");
    }

    function testMintUsesRandomizerRotatedDuringSafeMintCallback() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        TrackingRandomizer staleRandomizer =
            new TrackingRandomizer(address(deployed.core), bytes32(uint256(1)));
        TrackingRandomizer replacementRandomizer =
            new TrackingRandomizer(address(deployed.core), bytes32(uint256(2)));
        deployed.core.addRandomizer(COLLECTION_ID, address(staleRandomizer));

        RandomizerRotatingReceiver receiver = new RandomizerRotatingReceiver(
            deployed.core, COLLECTION_ID, address(replacementRandomizer)
        );
        deployed.admins
            .registerFunctionAdmin(
                address(receiver),
                address(deployed.core),
                deployed.core.addRandomizer.selector,
                true
            );

        uint256 salt = 333;
        vm.prank(address(deployed.minter));
        deployed.core.mint(TOKEN_ID, address(receiver), "token-callback", salt, COLLECTION_ID);

        receiver.receivedTokenId().assertEq(TOKEN_ID, "receiver did not observe mint");
        staleRandomizer.callCount().assertEq(0, "stale randomizer was called");
        replacementRandomizer.callCount().assertEq(1, "replacement randomizer not called");
        replacementRandomizer.lastCollectionId().assertEq(COLLECTION_ID, "collection mismatch");
        replacementRandomizer.lastMintIndex().assertEq(TOKEN_ID, "token mismatch");
        replacementRandomizer.lastSaltfunO().assertEq(salt, "salt mismatch");
        deployed.core.viewCollectionRandomizerContract(COLLECTION_ID)
            .assertEq(address(replacementRandomizer), "randomizer not rotated");
        deployed.core.retrieveTokenHash(TOKEN_ID)
            .assertEq(
                replacementRandomizer.hashFor(COLLECTION_ID, TOKEN_ID, salt), "wrong token hash"
            );
    }

    function _mintToken(DeployedStream memory deployed, uint256 tokenId, uint256 salt) private {
        vm.prank(address(deployed.minter));
        deployed.core.mint(tokenId, RECIPIENT, "token", salt, COLLECTION_ID);
    }

    function _warpPastFinalSupplyWindow() private {
        vm.warp(block.timestamp + 31 days + 1);
    }
}
