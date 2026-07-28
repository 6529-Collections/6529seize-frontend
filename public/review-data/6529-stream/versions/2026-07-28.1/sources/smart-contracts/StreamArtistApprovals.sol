// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

library StreamArtistApprovals {
    error ArtistSignatureInvalid();

    bytes32 private constant _ARTIST_APPROVAL_EIP712_NAME_HASH =
        keccak256("6529StreamArtistApproval");
    bytes32 private constant _ARTIST_APPROVAL_EIP712_VERSION_HASH = keccak256("1");
    bytes32 private constant _EIP712_DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 private constant _ARTIST_APPROVAL_TYPEHASH = keccak256(
        "6529StreamArtistApproval(address artist,bytes32 freezeManifestHash,uint256 maxCollectionPurchases,uint256 collectionTotalSupply,uint256 finalSupplyDelay)"
    );
    bytes32 private constant _EIP2098_S_MASK =
        0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    uint256 private constant _SECP256K1_N_DIV_2 =
        0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;
    bytes4 private constant _ERC1271_MAGIC_VALUE = 0x1626ba7e;

    function domainSeparator(address core, uint256 chainId) public pure returns (bytes32) {
        bytes32 domainTypehash = _EIP712_DOMAIN_TYPEHASH;
        bytes32 nameHash = _ARTIST_APPROVAL_EIP712_NAME_HASH;
        bytes32 versionHash = _ARTIST_APPROVAL_EIP712_VERSION_HASH;
        bytes32 separator;
        assembly ("memory-safe") {
            let ptr := mload(0x40)
            mstore(ptr, domainTypehash)
            mstore(add(ptr, 0x20), nameHash)
            mstore(add(ptr, 0x40), versionHash)
            mstore(add(ptr, 0x60), chainId)
            mstore(add(ptr, 0x80), core)
            separator := keccak256(ptr, 0xa0)
        }
        return separator;
    }

    function hashTypedApproval(bytes32 structHash, address core, uint256 chainId)
        public
        pure
        returns (bytes32)
    {
        bytes32 domainTypehash = _EIP712_DOMAIN_TYPEHASH;
        bytes32 nameHash = _ARTIST_APPROVAL_EIP712_NAME_HASH;
        bytes32 versionHash = _ARTIST_APPROVAL_EIP712_VERSION_HASH;
        bytes32 digest;
        assembly ("memory-safe") {
            let ptr := mload(0x40)
            mstore(ptr, domainTypehash)
            mstore(add(ptr, 0x20), nameHash)
            mstore(add(ptr, 0x40), versionHash)
            mstore(add(ptr, 0x60), chainId)
            mstore(add(ptr, 0x80), core)
            let separator := keccak256(ptr, 0xa0)
            mstore(ptr, shl(240, 0x1901))
            mstore(add(ptr, 0x02), separator)
            mstore(add(ptr, 0x22), structHash)
            digest := keccak256(ptr, 0x42)
        }
        return digest;
    }

    function hashApproval(address, bytes32, uint256, uint256, uint256)
        external
        pure
        returns (bytes32 approvalHash)
    {
        bytes32 typehash = _ARTIST_APPROVAL_TYPEHASH;
        assembly ("memory-safe") {
            let ptr := mload(0x40)
            mstore(ptr, typehash)
            mstore(add(ptr, 0x20), calldataload(0x04))
            mstore(add(ptr, 0x40), calldataload(0x24))
            mstore(add(ptr, 0x60), calldataload(0x44))
            mstore(add(ptr, 0x80), calldataload(0x64))
            mstore(add(ptr, 0xa0), calldataload(0x84))
            approvalHash := keccak256(ptr, 0xc0)
        }
    }

    function hashApprovalDigest(address, bytes32, uint256, uint256, uint256, address, uint256)
        external
        pure
        returns (bytes32 digest)
    {
        bytes32 domainTypehash = _EIP712_DOMAIN_TYPEHASH;
        bytes32 nameHash = _ARTIST_APPROVAL_EIP712_NAME_HASH;
        bytes32 versionHash = _ARTIST_APPROVAL_EIP712_VERSION_HASH;
        bytes32 typehash = _ARTIST_APPROVAL_TYPEHASH;
        assembly ("memory-safe") {
            let ptr := mload(0x40)
            mstore(ptr, typehash)
            mstore(add(ptr, 0x20), calldataload(0x04))
            mstore(add(ptr, 0x40), calldataload(0x24))
            mstore(add(ptr, 0x60), calldataload(0x44))
            mstore(add(ptr, 0x80), calldataload(0x64))
            mstore(add(ptr, 0xa0), calldataload(0x84))
            let structHash := keccak256(ptr, 0xc0)
            mstore(ptr, domainTypehash)
            mstore(add(ptr, 0x20), nameHash)
            mstore(add(ptr, 0x40), versionHash)
            mstore(add(ptr, 0x60), calldataload(0xc4))
            mstore(add(ptr, 0x80), calldataload(0xa4))
            let separator := keccak256(ptr, 0xa0)
            mstore(ptr, shl(240, 0x1901))
            mstore(add(ptr, 0x02), separator)
            mstore(add(ptr, 0x22), structHash)
            digest := keccak256(ptr, 0x42)
        }
    }

    function hashApprovalDigestForCurrentContract(address, bytes32, uint256, uint256, uint256)
        external
        view
        returns (bytes32 digest)
    {
        bytes32 domainTypehash = _EIP712_DOMAIN_TYPEHASH;
        bytes32 nameHash = _ARTIST_APPROVAL_EIP712_NAME_HASH;
        bytes32 versionHash = _ARTIST_APPROVAL_EIP712_VERSION_HASH;
        bytes32 typehash = _ARTIST_APPROVAL_TYPEHASH;
        assembly ("memory-safe") {
            let ptr := mload(0x40)
            mstore(ptr, typehash)
            mstore(add(ptr, 0x20), calldataload(0x04))
            mstore(add(ptr, 0x40), calldataload(0x24))
            mstore(add(ptr, 0x60), calldataload(0x44))
            mstore(add(ptr, 0x80), calldataload(0x64))
            mstore(add(ptr, 0xa0), calldataload(0x84))
            let structHash := keccak256(ptr, 0xc0)

            mstore(ptr, domainTypehash)
            mstore(add(ptr, 0x20), nameHash)
            mstore(add(ptr, 0x40), versionHash)
            mstore(add(ptr, 0x60), chainid())
            mstore(add(ptr, 0x80), address())
            let separator := keccak256(ptr, 0xa0)
            mstore(ptr, shl(240, 0x1901))
            mstore(add(ptr, 0x02), separator)
            mstore(add(ptr, 0x22), structHash)
            digest := keccak256(ptr, 0x42)
        }
    }

    function validateSignature(address artist, bytes32 digest, bytes calldata signature)
        external
        view
    {
        if (artist.code.length == 0) {
            if (_recoverEOASigner(digest, signature) != artist) {
                revert ArtistSignatureInvalid();
            }
            return;
        }

        (bool success, bytes memory returnData) =
            artist.staticcall(abi.encodeWithSelector(_ERC1271_MAGIC_VALUE, digest, signature));
        if (
            !success || returnData.length != 32
                || abi.decode(returnData, (bytes4)) != _ERC1271_MAGIC_VALUE
        ) {
            revert ArtistSignatureInvalid();
        }
    }

    function _recoverEOASigner(bytes32 digest, bytes calldata signature)
        private
        pure
        returns (address)
    {
        bytes32 r;
        bytes32 s;
        uint8 v;
        if (signature.length == 65) {
            assembly {
                r := calldataload(signature.offset)
                s := calldataload(add(signature.offset, 32))
                v := byte(0, calldataload(add(signature.offset, 64)))
            }
        } else if (signature.length == 64) {
            bytes32 vs;
            assembly {
                r := calldataload(signature.offset)
                vs := calldataload(add(signature.offset, 32))
            }
            s = vs & _EIP2098_S_MASK;
            v = uint8((uint256(vs) >> 255) + 27);
        } else {
            revert ArtistSignatureInvalid();
        }

        if (uint256(s) > _SECP256K1_N_DIV_2 || (v != 27 && v != 28)) {
            revert ArtistSignatureInvalid();
        }
        address signer = ecrecover(digest, v, r, s);
        if (signer == address(0)) {
            revert ArtistSignatureInvalid();
        }
        return signer;
    }
}
