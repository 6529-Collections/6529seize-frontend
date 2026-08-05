// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/StreamArtistApprovals.sol";
import "../smart-contracts/StreamCore.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";

contract StreamArtistSignatureTest is CharacterizationTestBase, StreamFixture {
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for string;

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant TOKEN_ID = 1;
    address private constant ARTIST = address(0xA11CE);
    uint256 private constant ARTIST_PRIVATE_KEY = 0xA11CE;

    function testArtistSignatureStoresStateBoundApprovalHash() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 expectedApprovalHash = _artistApprovalDigest(deployed.core, COLLECTION_ID);

        vm.prank(ARTIST);
        deployed.core.artistSignature(COLLECTION_ID, "artist-approved-genesis");

        deployed.core.artistSigned(COLLECTION_ID).assertTrue("artist signature flag not stored");
        deployed.core.artistsSignatures(COLLECTION_ID)
            .assertEq("artist-approved-genesis", "artist signature text not stored");
        deployed.core.artistApprovalHashes(COLLECTION_ID)
            .assertEq(expectedApprovalHash, "artist approval hash not stored");
        _artistApprovalDigest(deployed.core, COLLECTION_ID)
            .assertEq(expectedApprovalHash, "current approval hash changed unexpectedly");
    }

    function testArtistApprovalHashTracksCollectionStateChanges() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 beforeUpdate = _artistApprovalDigest(deployed.core, COLLECTION_ID);

        deployed.core.setCollectionData(COLLECTION_ID, ARTIST, 9, 10, 2 days);
        bytes32 afterSupplyPolicyUpdate = _artistApprovalDigest(deployed.core, COLLECTION_ID);
        (afterSupplyPolicyUpdate != beforeUpdate).assertTrue("approval hash ignored supply policy");

        string[] memory scripts = new string[](1);
        scripts[0] = "function draw(){return 1;}";
        deployed.core
            .updateCollectionInfo(
                COLLECTION_ID,
                "Genesis",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "ipfs://new-base/",
                "https://cdn.example/script.js",
                bytes32(0),
                FULL_COLLECTION_UPDATE_INDEX,
                scripts
            );

        bytes32 afterMetadataUpdate = _artistApprovalDigest(deployed.core, COLLECTION_ID);
        (afterMetadataUpdate != afterSupplyPolicyUpdate)
        .assertTrue("approval hash ignored collection metadata");
    }

    function testArtistSignatureStillRequiresConfiguredArtistAndSingleUse() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        vm.expectRevert(abi.encodeWithSelector(StreamCore.ArtistSignatureUnauthorized.selector));
        deployed.core.artistSignature(COLLECTION_ID, "not-the-artist");

        vm.prank(ARTIST);
        deployed.core.artistSignature(COLLECTION_ID, "artist-approved-genesis");

        vm.expectRevert(abi.encodeWithSelector(StreamCore.ArtistSignatureUnauthorized.selector));
        vm.prank(ARTIST);
        deployed.core.artistSignature(COLLECTION_ID, "second-signature");
    }

    function testEIP712ArtistSignatureStoresApprovalFromRelayer() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        address signingArtist = vm.addr(ARTIST_PRIVATE_KEY);
        deployed.core.setCollectionData(COLLECTION_ID, signingArtist, 5, 10, 1 days);
        bytes32 expectedApprovalHash = _artistApprovalDigest(deployed.core, COLLECTION_ID);
        bytes memory artistProof = _signArtistApproval(deployed.core, ARTIST_PRIVATE_KEY);

        deployed.core.artistSignature(COLLECTION_ID, "typed-artist-approval", artistProof);

        deployed.core.artistSigned(COLLECTION_ID).assertTrue("artist signature flag not stored");
        deployed.core.artistApprovalHashes(COLLECTION_ID)
            .assertEq(expectedApprovalHash, "typed approval hash not stored");
    }

    function testEIP712ArtistSignatureAcceptsCompactSignature() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        address signingArtist = vm.addr(ARTIST_PRIVATE_KEY);
        deployed.core.setCollectionData(COLLECTION_ID, signingArtist, 5, 10, 1 days);
        bytes32 expectedApprovalHash = _artistApprovalDigest(deployed.core, COLLECTION_ID);
        bytes memory compactProof = _signCompactArtistApproval(deployed.core, ARTIST_PRIVATE_KEY);

        deployed.core.artistSignature(COLLECTION_ID, "compact-typed-approval", compactProof);

        deployed.core.artistApprovalHashes(COLLECTION_ID)
            .assertEq(expectedApprovalHash, "compact approval hash not stored");
    }

    function testEIP712ArtistSignatureRejectsWrongSigner() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        address signingArtist = vm.addr(ARTIST_PRIVATE_KEY);
        deployed.core.setCollectionData(COLLECTION_ID, signingArtist, 5, 10, 1 days);
        bytes memory wrongProof = _signArtistApproval(deployed.core, 0xB0B);

        vm.expectRevert(
            abi.encodeWithSelector(StreamArtistApprovals.ArtistSignatureInvalid.selector)
        );
        deployed.core.artistSignature(COLLECTION_ID, "typed-artist-approval", wrongProof);
    }

    function testEIP712ArtistSignatureRejectsStaleCollectionState() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        address signingArtist = vm.addr(ARTIST_PRIVATE_KEY);
        deployed.core.setCollectionData(COLLECTION_ID, signingArtist, 5, 10, 1 days);
        bytes memory staleProof = _signArtistApproval(deployed.core, ARTIST_PRIVATE_KEY);

        deployed.core.setCollectionData(COLLECTION_ID, signingArtist, 8, 10, 1 days);

        vm.expectRevert(
            abi.encodeWithSelector(StreamArtistApprovals.ArtistSignatureInvalid.selector)
        );
        deployed.core.artistSignature(COLLECTION_ID, "typed-artist-approval", staleProof);
    }

    function testERC1271ArtistSignatureStoresContractWalletApproval() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        ArtistERC1271Mock artistWallet = new ArtistERC1271Mock();
        deployed.core.setCollectionData(COLLECTION_ID, address(artistWallet), 5, 10, 1 days);
        bytes memory artistProof = hex"12716529";
        bytes32 expectedApprovalHash = _artistApprovalDigest(deployed.core, COLLECTION_ID);
        artistWallet.setValidSignature(
            _artistApprovalDigest(deployed.core, COLLECTION_ID), artistProof
        );

        deployed.core.artistSignature(COLLECTION_ID, "contract-wallet-approval", artistProof);

        deployed.core.artistSigned(COLLECTION_ID).assertTrue("contract approval flag not stored");
        deployed.core.artistApprovalHashes(COLLECTION_ID)
            .assertEq(expectedApprovalHash, "contract approval hash not stored");
    }

    function testERC1271ArtistSignatureRejectsBadContractWalletApproval() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        ArtistERC1271Mock artistWallet = new ArtistERC1271Mock();
        deployed.core.setCollectionData(COLLECTION_ID, address(artistWallet), 5, 10, 1 days);

        artistWallet.setInvalidMagicValue();

        vm.expectRevert(
            abi.encodeWithSelector(StreamArtistApprovals.ArtistSignatureInvalid.selector)
        );
        deployed.core.artistSignature(COLLECTION_ID, "contract-wallet-approval", hex"12716529");
    }

    function testERC1271ArtistSignatureRejectsRevertingContractWalletApproval() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        ArtistERC1271Mock artistWallet = new ArtistERC1271Mock();
        deployed.core.setCollectionData(COLLECTION_ID, address(artistWallet), 5, 10, 1 days);

        artistWallet.setRevertingSignature();

        vm.expectRevert(
            abi.encodeWithSelector(StreamArtistApprovals.ArtistSignatureInvalid.selector)
        );
        deployed.core.artistSignature(COLLECTION_ID, "contract-wallet-approval", hex"12716529");
    }

    function testERC1271ArtistSignatureRejectsEmptyContractWalletApprovalReturn() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        ArtistERC1271Mock artistWallet = new ArtistERC1271Mock();
        deployed.core.setCollectionData(COLLECTION_ID, address(artistWallet), 5, 10, 1 days);

        artistWallet.setEmptyReturn();

        vm.expectRevert(
            abi.encodeWithSelector(StreamArtistApprovals.ArtistSignatureInvalid.selector)
        );
        deployed.core.artistSignature(COLLECTION_ID, "contract-wallet-approval", hex"12716529");
    }

    function testERC1271ArtistSignatureRejectsShortContractWalletApprovalReturn() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        ArtistERC1271Mock artistWallet = new ArtistERC1271Mock();
        deployed.core.setCollectionData(COLLECTION_ID, address(artistWallet), 5, 10, 1 days);

        artistWallet.setShortReturn();

        vm.expectRevert(
            abi.encodeWithSelector(StreamArtistApprovals.ArtistSignatureInvalid.selector)
        );
        deployed.core.artistSignature(COLLECTION_ID, "contract-wallet-approval", hex"12716529");
    }

    function testERC1271ArtistSignatureRejectsExtraContractWalletApprovalReturn() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        ArtistERC1271Mock artistWallet = new ArtistERC1271Mock();
        deployed.core.setCollectionData(COLLECTION_ID, address(artistWallet), 5, 10, 1 days);

        artistWallet.setExtraReturn();

        vm.expectRevert(
            abi.encodeWithSelector(StreamArtistApprovals.ArtistSignatureInvalid.selector)
        );
        deployed.core.artistSignature(COLLECTION_ID, "contract-wallet-approval", hex"12716529");
    }

    function testERC1271ArtistSignatureRejectsWrongContractWalletProof() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        ArtistERC1271Mock artistWallet = new ArtistERC1271Mock();
        deployed.core.setCollectionData(COLLECTION_ID, address(artistWallet), 5, 10, 1 days);
        bytes memory artistProof = hex"12716529";
        artistWallet.setValidSignature(
            _artistApprovalDigest(deployed.core, COLLECTION_ID), artistProof
        );

        vm.expectRevert(
            abi.encodeWithSelector(StreamArtistApprovals.ArtistSignatureInvalid.selector)
        );
        deployed.core.artistSignature(COLLECTION_ID, "contract-wallet-approval", hex"bad1dead");
    }

    function testERC1271ArtistSignatureRejectsStaleContractWalletApproval() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        ArtistERC1271Mock artistWallet = new ArtistERC1271Mock();
        deployed.core.setCollectionData(COLLECTION_ID, address(artistWallet), 5, 10, 1 days);
        bytes memory artistProof = hex"12716529";
        artistWallet.setValidSignature(
            _artistApprovalDigest(deployed.core, COLLECTION_ID), artistProof
        );

        deployed.core.setCollectionData(COLLECTION_ID, address(artistWallet), 8, 10, 1 days);

        vm.expectRevert(
            abi.encodeWithSelector(StreamArtistApprovals.ArtistSignatureInvalid.selector)
        );
        deployed.core.artistSignature(COLLECTION_ID, "contract-wallet-approval", artistProof);
    }

    function testApprovedCollectionMutationStalesArtistSignature() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        vm.prank(ARTIST);
        deployed.core.artistSignature(COLLECTION_ID, "artist-approved-genesis");
        bytes32 previousApprovalHash = deployed.core.artistApprovalHashes(COLLECTION_ID);

        deployed.core.setCollectionData(COLLECTION_ID, ARTIST, 9, 10, 2 days);

        deployed.core.artistSigned(COLLECTION_ID).assertFalse("artist approval not invalidated");
        deployed.core.artistsSignatures(COLLECTION_ID)
            .assertEq("artist-approved-genesis", "artist signature text not retained");
        deployed.core.artistApprovalHashes(COLLECTION_ID)
            .assertEq(previousApprovalHash, "stale approval hash not retained");
        (_artistApprovalDigest(deployed.core, COLLECTION_ID) != previousApprovalHash)
        .assertTrue("approval hash did not change");

        vm.prank(ARTIST);
        deployed.core.artistSignature(COLLECTION_ID, "artist-reapproved-genesis");
        deployed.core.artistSigned(COLLECTION_ID).assertTrue("artist could not reapprove");
        deployed.core.artistApprovalHashes(COLLECTION_ID)
            .assertEq(
                _artistApprovalDigest(deployed.core, COLLECTION_ID),
                "reapproval did not store current hash"
            );
    }

    function testFrozenCollectionRejectsFinalArtistReapproval() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        _mintToken(deployed);

        vm.prank(ARTIST);
        deployed.core.artistSignature(COLLECTION_ID, "pre-freeze-approval");
        bytes32 preFreezeApprovalHash = deployed.core.artistApprovalHashes(COLLECTION_ID);
        deployed.core.artistSigned(COLLECTION_ID).assertTrue("artist approval not stored");

        _warpPastFinalSupplyWindow();
        deployed.core.freezeCollection(COLLECTION_ID);
        deployed.core.artistSigned(COLLECTION_ID)
            .assertFalse("supply finalization did not invalidate approval");

        vm.expectRevert(abi.encodeWithSelector(StreamCore.MetadataFrozen.selector, COLLECTION_ID));
        vm.prank(ARTIST);
        deployed.core.artistSignature(COLLECTION_ID, "final-frozen-approval");

        deployed.core.collectionFreezeStatus(COLLECTION_ID).assertTrue("collection not frozen");
        deployed.core.artistApprovalHashes(COLLECTION_ID)
            .assertEq(preFreezeApprovalHash, "frozen stale approval hash changed");
    }

    function _signArtistApproval(StreamCore core, uint256 privateKey)
        private
        returns (bytes memory)
    {
        (uint8 v, bytes32 r, bytes32 s) =
            vm.sign(privateKey, _artistApprovalDigest(core, COLLECTION_ID));
        return abi.encodePacked(r, s, v);
    }

    function _signCompactArtistApproval(StreamCore core, uint256 privateKey)
        private
        returns (bytes memory)
    {
        (uint8 v, bytes32 r, bytes32 s) =
            vm.sign(privateKey, _artistApprovalDigest(core, COLLECTION_ID));
        uint256 yParity = uint256(v) - 27;
        bytes32 vs = bytes32(uint256(s) | (yParity << 255));
        return abi.encodePacked(r, vs);
    }

    function _mintToken(DeployedStream memory deployed) private {
        vm.prank(address(deployed.minter));
        deployed.core.mint(TOKEN_ID, ARTIST, "1,2,3", 7, COLLECTION_ID);
    }

    function _warpPastFinalSupplyWindow() private {
        vm.warp(block.timestamp + 31 days + 2);
    }

    function _artistApprovalDigest(StreamCore core, uint256 collectionId)
        private
        view
        returns (bytes32)
    {
        (
            address artist,
            uint256 maxCollectionPurchases,,
            uint256 collectionTotalSupply,
            uint256 finalSupplyDelay,
        ) = core.retrieveCollectionAdditionalData(collectionId);
        return StreamArtistApprovals.hashApprovalDigest(
            artist,
            core.previewCollectionFreezeManifestHash(collectionId),
            maxCollectionPurchases,
            collectionTotalSupply,
            finalSupplyDelay,
            address(core),
            block.chainid
        );
    }

}

contract ArtistERC1271Mock {
    enum ResponseMode {
        Strict,
        InvalidMagic,
        Revert,
        EmptyReturn,
        ShortReturn,
        ExtraReturn
    }

    bytes4 private constant MAGIC_VALUE = 0x1626ba7e;
    bytes4 private constant INVALID_MAGIC_VALUE = 0xffffffff;
    bytes32 private validDigest;
    bytes private validSignature;
    ResponseMode private responseMode;

    function setValidSignature(bytes32 digest, bytes memory signature) external {
        validDigest = digest;
        validSignature = signature;
        responseMode = ResponseMode.Strict;
    }

    function setInvalidMagicValue() external {
        responseMode = ResponseMode.InvalidMagic;
    }

    function setRevertingSignature() external {
        responseMode = ResponseMode.Revert;
    }

    function setEmptyReturn() external {
        responseMode = ResponseMode.EmptyReturn;
    }

    function setShortReturn() external {
        responseMode = ResponseMode.ShortReturn;
    }

    function setExtraReturn() external {
        responseMode = ResponseMode.ExtraReturn;
    }

    function isValidSignature(bytes32 digest, bytes memory signature)
        external
        view
        returns (bytes4)
    {
        if (responseMode == ResponseMode.Revert) {
            revert("ERC1271_REVERT");
        }
        if (responseMode == ResponseMode.EmptyReturn) {
            assembly ("memory-safe") {
                return(0, 0)
            }
        }
        if (responseMode == ResponseMode.ShortReturn) {
            bytes4 value = MAGIC_VALUE;
            assembly ("memory-safe") {
                let ptr := mload(0x40)
                mstore(ptr, shl(224, value))
                return(ptr, 0x04)
            }
        }
        if (responseMode == ResponseMode.ExtraReturn) {
            bytes4 value = MAGIC_VALUE;
            assembly ("memory-safe") {
                let ptr := mload(0x40)
                mstore(ptr, shl(224, value))
                mstore(add(ptr, 0x20), 1)
                return(ptr, 0x40)
            }
        }
        if (
            digest == validDigest && keccak256(signature) == keccak256(validSignature)
                && responseMode == ResponseMode.Strict
        ) {
            return MAGIC_VALUE;
        }
        return INVALID_MAGIC_VALUE;
    }
}
