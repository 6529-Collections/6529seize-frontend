// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/StreamDrops.sol";
import "./helpers/Assertions.sol";
import "./helpers/DropAuthTestHelper.sol";
import "./helpers/StreamFixture.sol";

contract StreamSupplyReplayFreezeInvariantTest is DropAuthTestHelper {
    uint256 private constant SEQUENCE_LENGTH = 20;

    SupplyReplayFreezeInvariantHandler private handler;

    function setUp() public {
        handler = new SupplyReplayFreezeInvariantHandler(signerAddress());
    }

    function testSupplyReplayAndFreezeInvariantsHoldAcrossBoundedSequences(
        uint256[SEQUENCE_LENGTH] memory actionSeeds,
        uint256[SEQUENCE_LENGTH] memory valueSeeds
    ) public {
        handler.assertCoreInvariants();
        for (uint256 i = 0; i < SEQUENCE_LENGTH; i++) {
            handler.runAction(actionSeeds[i], valueSeeds[i]);
            handler.assertCoreInvariants();
        }

        handler.ensureMinted();
        handler.freezeCollection();
        handler.assertCoreInvariants();
        handler.assertPostFreezeGuards();
        handler.assertCoreInvariants();
    }
}

contract SupplyReplayFreezeInvariantHandler is DropAuthTestHelper, StreamFixture {
    using Assertions for bool;
    using Assertions for address;
    using Assertions for bytes32;
    using Assertions for uint256;

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant COLLECTION_SUPPLY = 10;
    uint256 private constant MAX_TRACKED_DROPS = 64;
    address private constant POSTER = address(0x1001);
    address private constant RECIPIENT = address(0x2001);
    address private constant PAYOUT = address(0x3001);
    address private constant CURATORS_POOL = address(0x4001);

    DeployedStream private deployed;
    uint256 private nextNonce = 1;
    uint256 private mintedEver;
    uint256 private liveTokens;
    uint256 private burnedTokens;
    bool private frozen;
    bytes32 private frozenManifestHash;
    uint256[COLLECTION_SUPPLY] private tokenIds;
    mapping(uint256 => bool) private tokenBurned;
    bytes32[MAX_TRACKED_DROPS] private trackedDropIds;
    mapping(bytes32 => bool) private expectedConsumed;
    mapping(bytes32 => bool) private expectedCancelled;
    uint256 private trackedDropCount;

    bool private hasConsumedDrop;
    StreamDrops.DropAuthorization private lastConsumedAuthorization;
    string private lastConsumedTokenData;
    bytes private lastConsumedSignature;

    bool private hasCancelledDrop;
    StreamDrops.DropAuthorization private lastCancelledAuthorization;
    string private lastCancelledTokenData;
    bytes private lastCancelledSignature;

    constructor(address signer) {
        deployed = deployStreamWithSigner(PAYOUT, CURATORS_POOL, signer);
    }

    function runAction(uint256 actionSeed, uint256 valueSeed) external {
        uint256 action = actionSeed % 10;
        if (action == 0) {
            mintValidDrop(valueSeed);
        } else if (action == 1) {
            cancelFreshDrop(valueSeed);
        } else if (action == 2) {
            replayConsumedDrop();
        } else if (action == 3) {
            mintCancelledDrop();
        } else if (action == 4) {
            burnLiveToken(valueSeed);
        } else if (action == 5) {
            changeLiveTokenData(valueSeed);
        } else if (action == 6) {
            updateLiveTokenImageAndAttributes(valueSeed);
        } else if (action == 7) {
            freezeCollection();
        } else if (action == 8) {
            attemptPostFreezeMint(valueSeed);
        } else {
            attemptPostFreezeBurn(valueSeed);
        }
    }

    function ensureMinted() public {
        if (!frozen && mintedEver == 0) {
            mintValidDrop(0);
        }
    }

    function mintValidDrop(uint256 seed) public {
        if (frozen || mintedEver >= COLLECTION_SUPPLY) {
            return;
        }

        (
            StreamDrops.DropAuthorization memory authorization,
            string memory tokenData,
            bytes memory signature
        ) = _buildFixedPriceDrop(seed);

        deployed.drops.mintDrop(authorization, tokenData, signature);

        uint256 tokenId = deployed.drops.retrieveTokenID(authorization.dropId);
        tokenIds[mintedEver] = tokenId;
        mintedEver++;
        liveTokens++;
        _trackDrop(authorization.dropId);
        expectedConsumed[authorization.dropId] = true;
        hasConsumedDrop = true;
        lastConsumedAuthorization = authorization;
        lastConsumedTokenData = tokenData;
        lastConsumedSignature = signature;
    }

    function cancelFreshDrop(uint256 seed) public {
        if (frozen) {
            return;
        }

        (
            StreamDrops.DropAuthorization memory authorization,
            string memory tokenData,
            bytes memory signature
        ) = _buildFixedPriceDrop(seed);

        deployed.drops.cancelDrop(authorization.dropId);
        _trackDrop(authorization.dropId);
        expectedCancelled[authorization.dropId] = true;
        hasCancelledDrop = true;
        lastCancelledAuthorization = authorization;
        lastCancelledTokenData = tokenData;
        lastCancelledSignature = signature;
    }

    function replayConsumedDrop() public {
        if (!hasConsumedDrop) {
            return;
        }
        uint256 mintedBefore = mintedEver;
        uint256 liveBefore = liveTokens;

        (bool success,) = address(deployed.drops)
            .call(
                abi.encodeWithSelector(
                    deployed.drops.mintDrop.selector,
                    lastConsumedAuthorization,
                    lastConsumedTokenData,
                    lastConsumedSignature
                )
            );

        success.assertFalse("consumed drop replay minted");
        mintedEver.assertEq(mintedBefore, "replay changed minted-ever model");
        liveTokens.assertEq(liveBefore, "replay changed live model");
    }

    function mintCancelledDrop() public {
        if (!hasCancelledDrop) {
            return;
        }
        uint256 mintedBefore = mintedEver;
        uint256 liveBefore = liveTokens;

        (bool success,) = address(deployed.drops)
            .call(
                abi.encodeWithSelector(
                    deployed.drops.mintDrop.selector,
                    lastCancelledAuthorization,
                    lastCancelledTokenData,
                    lastCancelledSignature
                )
            );

        success.assertFalse("cancelled drop minted");
        mintedEver.assertEq(mintedBefore, "cancelled mint changed minted-ever model");
        liveTokens.assertEq(liveBefore, "cancelled mint changed live model");
    }

    function burnLiveToken(uint256 seed) public {
        if (frozen || liveTokens == 0) {
            return;
        }
        (bool found, uint256 tokenId) = _selectLiveToken(seed);
        if (!found) {
            return;
        }

        vm.prank(RECIPIENT);
        deployed.core.burn(tokenId);
        tokenBurned[tokenId] = true;
        liveTokens--;
        burnedTokens++;
    }

    function changeLiveTokenData(uint256 seed) public {
        if (frozen || liveTokens == 0) {
            return;
        }
        (bool found, uint256 tokenId) = _selectLiveToken(seed);
        if (!found) {
            return;
        }

        deployed.core.changeTokenData(tokenId, _tokenData(seed ^ 10_000));
    }

    function updateLiveTokenImageAndAttributes(uint256 seed) public {
        if (frozen || liveTokens == 0) {
            return;
        }
        (bool found, uint256 tokenId) = _selectLiveToken(seed);
        if (!found) {
            return;
        }

        uint256[] memory ids = new uint256[](1);
        string[] memory images = new string[](1);
        string[] memory attributes = new string[](1);
        ids[0] = tokenId;
        images[0] = string(abi.encodePacked("ipfs://image/", _smallNumber(seed), ".png"));
        attributes[0] = "{\"trait_type\":\"Mood\",\"value\":\"Invariant\"}";
        deployed.core.updateImagesAndAttributes(ids, images, attributes);
    }

    function freezeCollection() public {
        if (frozen || mintedEver == 0) {
            return;
        }

        _warpPastFinalSupplyWindow();
        bytes32 expectedManifest = deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID);
        deployed.core.freezeCollection(COLLECTION_ID);
        frozen = true;
        frozenManifestHash = expectedManifest;
    }

    function attemptPostFreezeMint(uint256 seed) public {
        if (!frozen) {
            return;
        }
        (
            StreamDrops.DropAuthorization memory authorization,
            string memory tokenData,
            bytes memory signature
        ) = _buildFixedPriceDrop(seed);

        (bool success,) = address(deployed.drops)
            .call(
                abi.encodeWithSelector(
                    deployed.drops.mintDrop.selector, authorization, tokenData, signature
                )
            );

        success.assertFalse("post-freeze mint succeeded");
        deployed.drops.isDropConsumed(authorization.dropId)
            .assertFalse("post-freeze failed mint consumed drop");
    }

    function attemptPostFreezeBurn(uint256 seed) public {
        if (!frozen || liveTokens == 0) {
            return;
        }
        (bool found, uint256 tokenId) = _selectLiveToken(seed);
        if (!found) {
            return;
        }

        vm.prank(RECIPIENT);
        (bool success,) = address(deployed.core)
            .call(abi.encodeWithSelector(deployed.core.burn.selector, tokenId));
        success.assertFalse("post-freeze burn succeeded");
    }

    function assertPostFreezeGuards() public {
        if (!frozen) {
            return;
        }
        attemptPostFreezeMint(9001);
        attemptPostFreezeBurn(9002);
        if (liveTokens != 0) {
            (bool found, uint256 tokenId) = _selectLiveToken(9003);
            if (found) {
                (bool success,) = address(deployed.core)
                    .call(
                        abi.encodeWithSelector(
                            deployed.core.changeTokenData.selector, tokenId, "post-freeze"
                        )
                    );
                success.assertFalse("post-freeze token data update succeeded");
            }
        }
    }

    function assertCoreInvariants() public view {
        deployed.core.totalSupply().assertEq(liveTokens, "global live supply mismatch");
        deployed.core.totalSupplyOfCollection(COLLECTION_ID)
            .assertEq(liveTokens, "collection live supply mismatch");
        deployed.core.viewCirSupply(COLLECTION_ID)
            .assertEq(mintedEver, "minted-ever counter mismatch");
        deployed.core.burnAmount(COLLECTION_ID).assertEq(burnedTokens, "burn counter mismatch");

        (
            address artistAddress,
            uint256 maxCollectionPurchases,
            uint256 circulationSupply,
            uint256 collectionTotalSupply,
            uint256 finalSupplyDelay,
            address randomizerContract
        ) = deployed.core.retrieveCollectionAdditionalData(COLLECTION_ID);
        artistAddress.assertEq(address(0xA11CE), "artist changed");
        maxCollectionPurchases.assertEq(5, "max purchases changed");
        circulationSupply.assertEq(mintedEver, "additional-data circulation mismatch");
        finalSupplyDelay.assertEq(1 days, "final-supply delay changed");
        randomizerContract.assertEq(address(deployed.randomizer), "randomizer changed");

        if (frozen) {
            collectionTotalSupply.assertEq(mintedEver, "freeze final supply mismatch");
            deployed.core.collectionFreezeStatus(COLLECTION_ID).assertTrue("collection not frozen");
            deployed.core.collectionFreezeManifestHash(COLLECTION_ID)
                .assertEq(frozenManifestHash, "stored freeze manifest mismatch");
            deployed.core.previewCollectionFreezeManifestHash(COLLECTION_ID)
                .assertEq(frozenManifestHash, "freeze manifest drifted");
        } else {
            collectionTotalSupply.assertEq(COLLECTION_SUPPLY, "mutable total supply changed");
            deployed.core.collectionFreezeStatus(COLLECTION_ID)
                .assertFalse("collection unexpectedly frozen");
        }

        deployed.core.lastAllocatedTokenId()
            .assertEq(mintedEver, "sequential allocator mark mismatch");

        uint256 observedLiveTokens;
        uint256 observedBurnedTokens;
        for (uint256 i = 0; i < mintedEver; i++) {
            uint256 tokenId = tokenIds[i];
            deployed.core.viewColIDforTokenID(tokenId)
                .assertEq(COLLECTION_ID, "token collection mismatch");
            (bool mappingExists,, uint256 collectionSerial, bool identityBurned) =
                deployed.core.tokenCollectionIdentity(tokenId);
            mappingExists.assertTrue("identity mapping missing");
            collectionSerial.assertEq(i + 1, "stored serial mismatch");
            (identityBurned == tokenBurned[tokenId]).assertTrue("identity burn flag mismatch");
            uint256(deployed.core.tokenLifecycle(tokenId))
                .assertEq(tokenBurned[tokenId] ? 3 : 2, "lifecycle mismatch");
            if (tokenBurned[tokenId]) {
                observedBurnedTokens++;
                deployed.core.isTokenBurned(tokenId).assertTrue("burn flag missing");
                (
                    bool burned,
                    uint256 burnedCollectionId,
                    address tokenOwner,,,,
                    bytes32 tokenHash,,,
                ) = deployed.core.burnedTokenAuditState(tokenId);
                burned.assertTrue("burn audit flag missing");
                burnedCollectionId.assertEq(COLLECTION_ID, "burn audit collection mismatch");
                tokenOwner.assertEq(RECIPIENT, "burn audit owner mismatch");
                (tokenHash != bytes32(0)).assertTrue("burn audit missing token hash");
            } else {
                observedLiveTokens++;
                deployed.core.isTokenBurned(tokenId).assertFalse("live token marked burned");
                deployed.core.ownerOf(tokenId).assertEq(RECIPIENT, "live owner mismatch");
            }
        }
        observedLiveTokens.assertEq(liveTokens, "observed live-token mismatch");
        observedBurnedTokens.assertEq(burnedTokens, "observed burn mismatch");

        for (uint256 i = 0; i < trackedDropCount; i++) {
            bytes32 dropId = trackedDropIds[i];
            (deployed.drops.isDropConsumed(dropId) == expectedConsumed[dropId])
            .assertTrue("drop consumed state mismatch");
            (deployed.drops.isDropCancelled(dropId) == expectedCancelled[dropId])
            .assertTrue("drop cancelled state mismatch");
        }
    }

    function _buildFixedPriceDrop(uint256 seed)
        private
        returns (
            StreamDrops.DropAuthorization memory authorization,
            string memory tokenData,
            bytes memory signature
        )
    {
        uint256 currentNonce = nextNonce;
        nextNonce++;
        tokenData = _tokenData(currentNonce ^ seed);
        authorization = buildFixedPriceAuthorization(
            deployed.drops,
            POSTER,
            RECIPIENT,
            address(0),
            tokenData,
            COLLECTION_ID,
            0,
            currentNonce,
            currentNonce,
            block.timestamp + 1 days
        );
        signature = signAuthorization(deployed.drops, authorization);
    }

    function _selectLiveToken(uint256 seed) private view returns (bool, uint256) {
        if (mintedEver == 0) {
            return (false, 0);
        }
        uint256 start = seed % mintedEver;
        for (uint256 i = 0; i < mintedEver; i++) {
            uint256 tokenId = tokenIds[(start + i) % mintedEver];
            if (!tokenBurned[tokenId]) {
                return (true, tokenId);
            }
        }
        return (false, 0);
    }

    function _trackDrop(bytes32 dropId) private {
        require(trackedDropCount < MAX_TRACKED_DROPS, "drop tracking overflow");
        trackedDropIds[trackedDropCount] = dropId;
        trackedDropCount++;
    }

    function _warpPastFinalSupplyWindow() private {
        vm.warp(block.timestamp + 31 days + 1);
    }

    function _tokenData(uint256 seed) private pure returns (string memory) {
        return string(abi.encodePacked("invariant-", _smallNumber(seed)));
    }

    function _smallNumber(uint256 seed) private pure returns (string memory) {
        uint256 value = seed % 10_000;
        if (value == 0) {
            return "0";
        }
        bytes memory reversed = new bytes(4);
        uint256 length;
        while (value != 0) {
            reversed[length] = bytes1(uint8(48 + (value % 10)));
            length++;
            value /= 10;
        }
        bytes memory output = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            output[i] = reversed[length - i - 1];
        }
        return string(output);
    }
}
