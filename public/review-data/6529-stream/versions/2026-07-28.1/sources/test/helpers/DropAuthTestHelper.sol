// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../smart-contracts/StreamDrops.sol";
import "./CharacterizationTestBase.sol";

abstract contract DropAuthTestHelper is CharacterizationTestBase {
    uint256 internal constant SIGNER_KEY = 0xA11CE;
    uint256 internal constant OTHER_SIGNER_KEY = 0xB0B;
    uint256 internal constant SECP256K1_N =
        0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141;

    function signerAddress() internal returns (address) {
        return vm.addr(SIGNER_KEY);
    }

    function otherSignerAddress() internal returns (address) {
        return vm.addr(OTHER_SIGNER_KEY);
    }

    function buildFixedPriceAuthorization(
        StreamDrops drops,
        address poster,
        address recipient,
        address payer,
        string memory tokenData,
        uint256 collectionId,
        uint256 price,
        uint256 nonce,
        uint256 salt,
        uint256 deadline
    ) internal view returns (StreamDrops.DropAuthorization memory authorization) {
        uint256 epoch = drops.signerEpoch();
        authorization = StreamDrops.DropAuthorization({
            dropId: drops.deriveDropId(drops.tdhSigner(), epoch, nonce, salt),
            poster: poster,
            recipient: recipient,
            payer: payer,
            collectionId: collectionId,
            saleMode: drops.SALE_MODE_FIXED_PRICE(),
            tokenDataHash: keccak256(bytes(tokenData)),
            price: price,
            quantity: 1,
            auctionReservePrice: 0,
            auctionEndTime: 0,
            salt: salt,
            nonce: nonce,
            deadline: deadline,
            signerEpoch: epoch
        });
    }

    function buildAuctionAuthorization(
        StreamDrops drops,
        address poster,
        address recipient,
        string memory tokenData,
        uint256 collectionId,
        uint256 reservePrice,
        uint256 auctionEndTime,
        uint256 nonce,
        uint256 salt,
        uint256 deadline
    ) internal view returns (StreamDrops.DropAuthorization memory authorization) {
        uint256 epoch = drops.signerEpoch();
        authorization = StreamDrops.DropAuthorization({
            dropId: drops.deriveDropId(drops.tdhSigner(), epoch, nonce, salt),
            poster: poster,
            recipient: recipient,
            payer: address(0),
            collectionId: collectionId,
            saleMode: drops.SALE_MODE_AUCTION(),
            tokenDataHash: keccak256(bytes(tokenData)),
            price: 0,
            quantity: 1,
            auctionReservePrice: reservePrice,
            auctionEndTime: auctionEndTime,
            salt: salt,
            nonce: nonce,
            deadline: deadline,
            signerEpoch: epoch
        });
    }

    function signAuthorization(
        StreamDrops drops,
        StreamDrops.DropAuthorization memory authorization
    ) internal returns (bytes memory) {
        return signAuthorizationWithKey(drops, authorization, SIGNER_KEY);
    }

    function signAuthorizationWithKey(
        StreamDrops drops,
        StreamDrops.DropAuthorization memory authorization,
        uint256 signerKey
    ) internal returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) =
            vm.sign(signerKey, drops.hashDropAuthorization(authorization));
        return abi.encodePacked(r, s, v);
    }

    function signCompactAuthorization(
        StreamDrops drops,
        StreamDrops.DropAuthorization memory authorization
    ) internal returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            SIGNER_KEY, drops.hashDropAuthorization(authorization)
        );
        bytes32 vs = bytes32(uint256(s) | (uint256(v - 27) << 255));
        return abi.encodePacked(r, vs);
    }

    function signMalleableAuthorization(
        StreamDrops drops,
        StreamDrops.DropAuthorization memory authorization
    ) internal returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            SIGNER_KEY, drops.hashDropAuthorization(authorization)
        );
        uint8 malleableV = v == 27 ? 28 : 27;
        bytes32 malleableS = bytes32(SECP256K1_N - uint256(s));
        return abi.encodePacked(r, malleableS, malleableV);
    }
}
