// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../smart-contracts/Strings.sol";

abstract contract TestHashingUtils {
    using Strings for uint256;

    bytes32 internal constant DEPENDENCY_SCRIPT_CONTENT_TYPEHASH = keccak256(
        "6529StreamDependencyScript(bytes32 dependencyNameAndVersion,uint256 chunkCount,bytes32 chunksHash)"
    );
    bytes32 internal constant DEPENDENCY_SCRIPT_CHUNK_TYPEHASH = keccak256(
        "6529StreamDependencyScriptChunk(uint256 index,bytes32 chunkHash,uint256 byteLength)"
    );

    function _contentHash(bytes32 dependencyKey, string[] memory chunks)
        internal
        pure
        returns (bytes32)
    {
        bytes32 chunksHash = bytes32(0);

        for (uint256 i = 0; i < chunks.length; i++) {
            chunksHash = keccak256(abi.encode(chunksHash, _chunkHash(i, chunks[i])));
        }

        return keccak256(
            abi.encode(DEPENDENCY_SCRIPT_CONTENT_TYPEHASH, dependencyKey, chunks.length, chunksHash)
        );
    }

    function _chunkHash(uint256 index, string memory chunk) internal pure returns (bytes32) {
        bytes memory chunkBytes = bytes(chunk);
        return keccak256(
            abi.encode(
                DEPENDENCY_SCRIPT_CHUNK_TYPEHASH, index, keccak256(chunkBytes), chunkBytes.length
            )
        );
    }

    function _expectedGenerativeScript(uint256 tokenId, bytes32 tokenHash, string memory dependency)
        internal
        pure
        returns (string memory)
    {
        return string.concat(
            "let hash='",
            Strings.toHexString(uint256(tokenHash), 32),
            "';let tokenId=",
            tokenId.toString(),
            ";let tokenDataRaw='1,2,3';let tokenData=JSON.parse('['+tokenDataRaw+']')",
            ";let dependencyScript='",
            dependency,
            "';",
            "function draw(){}"
        );
    }
}
