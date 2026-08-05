// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "./Base64.sol";
import "./IDependencyRegistry.sol";
import "./IStreamAdmins.sol";
import "./IRandomizerLifecycle.sol";
import "./Strings.sol";

library StreamMetadataRenderer {
    using Strings for uint256;

    uint256 private constant _MAX_COLLECTION_TEXT_BYTES = 2_048;
    uint256 private constant _MAX_TOKEN_DATA_BYTES = 4_096;
    uint256 private constant _MAX_TOKEN_IMAGE_BYTES = 2_048;
    uint256 private constant _MAX_TOKEN_ATTRIBUTES_BYTES = 8_192;
    uint256 private constant _MAX_COLLECTION_SCRIPT_CHUNK_BYTES = 8_192;
    uint256 private constant _MAX_COLLECTION_SCRIPT_CHUNKS = 32;
    uint256 private constant _MAX_GENERATED_TOKEN_URI_BYTES = 65_536;
    bytes32 private constant _FIELD_COLLECTION_NAME = "collection.name";
    bytes32 private constant _FIELD_COLLECTION_ARTIST = "collection.artist";
    bytes32 private constant _FIELD_COLLECTION_DESCRIPTION = "collection.description";
    bytes32 private constant _FIELD_COLLECTION_WEBSITE = "collection.website";
    bytes32 private constant _FIELD_COLLECTION_LICENSE = "collection.license";
    bytes32 private constant _FIELD_COLLECTION_BASE_URI = "collection.baseURI";
    bytes32 private constant _FIELD_COLLECTION_LIBRARY = "collection.library";
    bytes32 private constant _FIELD_COLLECTION_SCRIPT = "collection.script";
    bytes32 private constant _FIELD_COLLECTION_SCRIPT_COUNT = "collection.scriptCount";
    bytes32 private constant _FIELD_TOKEN_DATA = "token.data";
    bytes32 private constant _FIELD_TOKEN_IMAGE = "token.image";
    bytes32 private constant _FIELD_TOKEN_ATTRIBUTES = "token.attributes";
    bytes32 private constant _FIELD_TOKEN_URI = "tokenURI";

    bytes32 private constant _COLLECTION_SCRIPT_TYPEHASH =
        keccak256("6529StreamCollectionScript(uint256 chunkCount,bytes32 chunksHash)");
    bytes32 private constant _COLLECTION_SCRIPT_CHUNK_TYPEHASH = keccak256(
        "6529StreamCollectionScriptChunk(uint256 index,bytes32 chunkHash,uint256 byteLength)"
    );
    bytes32 private constant _TOKEN_METADATA_RECORD_TYPEHASH = keccak256(
        "6529StreamTokenMetadataRecord(uint256 tokenId,bytes32 tokenDataHash,bytes32 tokenImageHash,bytes32 tokenAttributesHash,bytes32 tokenHash)"
    );
    error MetadataFieldTooLarge(bytes32 field, uint256 actual, uint256 maximum);
    error MetadataFieldInvalidUTF8(bytes32 field);
    error UnsafeMetadataURI();
    error UnsafeRawAttributes(uint256 tokenId);

    uint8 private constant _RAW_ATTRIBUTE_TRAIT_TYPE_KEY = 1;
    uint8 private constant _RAW_ATTRIBUTE_VALUE_KEY = 2;

    function onchainTokenURI(
        string memory schemaVersion,
        string memory metadataState,
        string memory name,
        string memory description,
        string memory image,
        string memory attributes,
        string memory collectionLibrary,
        string memory animationScript,
        bool includeAnimation
    ) public pure returns (string memory) {
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(
                    bytes(
                        onchainMetadataJson(
                            schemaVersion,
                            metadataState,
                            name,
                            description,
                            image,
                            attributes,
                            collectionLibrary,
                            animationScript,
                            includeAnimation
                        )
                    )
                )
            )
        );
    }

    function onchainTokenURIWithLimit(
        string memory schemaVersion,
        string memory metadataState,
        string memory name,
        string memory description,
        string memory image,
        string memory attributes,
        string memory collectionLibrary,
        string memory animationScript,
        bool includeAnimation,
        bytes32 field,
        uint256 maximum
    ) public pure returns (string memory tokenUri) {
        tokenUri = onchainTokenURI(
            schemaVersion,
            metadataState,
            name,
            description,
            image,
            attributes,
            collectionLibrary,
            animationScript,
            includeAnimation
        );
        uint256 actual = bytes(tokenUri).length;
        if (actual > maximum) revert MetadataFieldTooLarge(field, actual, maximum);
    }

    function onchainTokenURIWithDefaultLimit(
        string memory schemaVersion,
        string memory metadataState,
        string memory name,
        string memory description,
        string memory image,
        string memory attributes,
        string memory collectionLibrary,
        string memory animationScript,
        bool includeAnimation
    ) public pure returns (string memory) {
        return onchainTokenURIWithLimit(
            schemaVersion,
            metadataState,
            name,
            description,
            image,
            attributes,
            collectionLibrary,
            animationScript,
            includeAnimation,
            _FIELD_TOKEN_URI,
            _MAX_GENERATED_TOKEN_URI_BYTES
        );
    }

    function onchainMetadataJson(
        string memory schemaVersion,
        string memory metadataState,
        string memory name,
        string memory description,
        string memory image,
        string memory attributes,
        string memory collectionLibrary,
        string memory animationScript,
        bool includeAnimation
    ) public pure returns (string memory) {
        string memory animationField = "";
        if (includeAnimation) {
            animationField = string(
                abi.encodePacked(
                    ",\"animation_url\":\"",
                    escapeJsonString(onchainAnimationURI(collectionLibrary, animationScript)),
                    "\""
                )
            );
        }

        return string(
            abi.encodePacked(
                "{\"metadata_schema_version\":\"",
                escapeJsonString(schemaVersion),
                "\",\"metadata_state\":\"",
                escapeJsonString(metadataState),
                "\",\"name\":\"",
                escapeJsonString(name),
                "\",\"description\":\"",
                escapeJsonString(description),
                "\",\"image\":\"",
                escapeJsonString(image),
                "\",\"attributes\":[",
                attributes,
                "]",
                animationField,
                "}"
            )
        );
    }

    function onchainAnimationURI(string memory collectionLibrary, string memory animationScript)
        public
        pure
        returns (string memory)
    {
        return string(
            abi.encodePacked(
                "data:text/html;base64,",
                Base64.encode(
                    abi.encodePacked(
                        "<html><head></head><body><script src=\"",
                        escapeHtmlAttribute(collectionLibrary),
                        "\"></script><script>",
                        escapeScriptElementEndTags(animationScript),
                        "</script></body></html>"
                    )
                )
            )
        );
    }

    function generativeScript(
        bytes32 tokenHash,
        uint256 tokenId,
        string memory tokenData,
        string memory dependencyScript,
        string memory collectionScript
    ) public pure returns (string memory) {
        return string(
            abi.encodePacked(
                "let hash='",
                Strings.toHexString(uint256(tokenHash), 32),
                "';let tokenId=",
                tokenId.toString(),
                ";let tokenDataRaw='",
                escapeJavaScriptSingleQuotedString(tokenData),
                "';let tokenData=JSON.parse('['+tokenDataRaw+']')",
                ";let dependencyScript='",
                escapeJavaScriptSingleQuotedString(dependencyScript),
                "';",
                collectionScript
            )
        );
    }

    function generativeScriptFromSources(
        bytes32 tokenHash,
        uint256 tokenId,
        string memory tokenData,
        IDependencyRegistry dependencyRegistry,
        bytes32 dependencyNameAndVersion,
        uint256 dependencyVersion,
        string[] memory collectionScript
    ) public view returns (string memory) {
        return generativeScript(
            tokenHash,
            tokenId,
            tokenData,
            dependencyScriptText(dependencyRegistry, dependencyNameAndVersion, dependencyVersion),
            collectionScriptText(collectionScript)
        );
    }

    function collectionScriptText(string[] memory script) public pure returns (string memory) {
        string memory scriptText = "";
        for (uint256 i = 0; i < script.length; i++) {
            scriptText = string.concat(scriptText, script[i]);
        }
        return scriptText;
    }

    function dependencyScriptText(
        IDependencyRegistry registry,
        bytes32 dependencyNameAndVersion,
        uint256 dependencyVersion
    ) public view returns (string memory) {
        string memory scriptText = "";
        for (
            uint256 i = 0;
            i
                < registry.getDependencyScriptCountAtVersion(
                    dependencyNameAndVersion, dependencyVersion
                );
            i++
        ) {
            scriptText = string.concat(
                scriptText,
                registry.getDependencyScriptAtVersion(
                    dependencyNameAndVersion, dependencyVersion, i
                )
            );
        }
        return scriptText;
    }

    function collectionScriptHash(string[] memory script) public pure returns (bytes32) {
        bytes32 chunksHash = bytes32(0);

        for (uint256 i = 0; i < script.length; i++) {
            bytes memory chunk = bytes(script[i]);
            bytes32 chunkHash = keccak256(
                abi.encode(_COLLECTION_SCRIPT_CHUNK_TYPEHASH, i, keccak256(chunk), chunk.length)
            );
            chunksHash = keccak256(abi.encode(chunksHash, chunkHash));
        }

        return keccak256(abi.encode(_COLLECTION_SCRIPT_TYPEHASH, script.length, chunksHash));
    }

    function tokenMetadataRecordHash(
        uint256 tokenId,
        string memory tokenData,
        string memory image,
        string memory attributes,
        bytes32 tokenHash
    ) public pure returns (bytes32) {
        return keccak256(
            abi.encode(
                _TOKEN_METADATA_RECORD_TYPEHASH,
                tokenId,
                keccak256(bytes(tokenData)),
                keccak256(bytes(image)),
                keccak256(bytes(attributes)),
                tokenHash
            )
        );
    }

    function offchainTokenURI(
        string memory baseURI,
        uint256 tokenId,
        string memory metadataState,
        bool finalMetadata
    ) public pure returns (string memory) {
        return finalMetadata
            ? string.concat(baseURI, tokenId.toString())
            : string.concat(baseURI, metadataState);
    }

    function offchainTokenURIForToken(
        string memory baseURI,
        uint256 tokenId,
        address randomizer,
        bytes32 tokenHash
    ) public view returns (string memory) {
        if (bytes(baseURI).length == 0) {
            return "";
        }

        bool finalMetadata = tokenHash != bytes32(0);
        return offchainTokenURI(
            baseURI, tokenId, tokenMetadataState(randomizer, tokenId, tokenHash), finalMetadata
        );
    }

    function tokenName(string memory collectionName, uint256 collectionSerial)
        public
        pure
        returns (string memory)
    {
        // Display indexes stay zero-based; the serial answers from the stored identity
        // record, never from token ID arithmetic.
        return string(abi.encodePacked(collectionName, " #", (collectionSerial - 1).toString()));
    }

    function tokenMetadataState(address randomizer, uint256 tokenId, bytes32 tokenHash)
        public
        view
        returns (string memory)
    {
        if (tokenHash != bytes32(0)) {
            return "final";
        }

        return pendingTokenMetadataState(randomizer, tokenId);
    }

    function onchainTokenURIForToken(
        string memory schemaVersion,
        string memory collectionName,
        uint256 tokenId,
        uint256 collectionSerial,
        string memory description,
        string memory image,
        string memory attributes,
        string memory collectionLibrary,
        string memory animationScript,
        address randomizer,
        bytes32 tokenHash
    ) public view returns (string memory) {
        bool finalMetadata = tokenHash != bytes32(0);
        return onchainTokenURIWithDefaultLimit(
            schemaVersion,
            tokenMetadataState(randomizer, tokenId, tokenHash),
            tokenName(collectionName, collectionSerial),
            description,
            image,
            attributes,
            collectionLibrary,
            finalMetadata ? animationScript : "",
            finalMetadata
        );
    }

    function pendingTokenMetadataState(address randomizer, uint256 tokenId)
        public
        view
        returns (string memory)
    {
        bytes4 supportSelector = IRandomizerLifecycle.supportsRandomizerLifecycle.selector;
        bytes4 stateSelector = IRandomizerLifecycle.randomnessRequestStateForToken.selector;
        bool supported;
        uint256 state;
        bool hasState;
        assembly ("memory-safe") {
            let ptr := mload(0x40)
            mstore(ptr, supportSelector)
            supported := staticcall(gas(), randomizer, ptr, 0x04, ptr, 0x20)
            supported := and(supported, and(eq(returndatasize(), 0x20), eq(mload(ptr), 1)))

            mstore(ptr, stateSelector)
            mstore(add(ptr, 0x04), tokenId)
            hasState := staticcall(gas(), randomizer, ptr, 0x24, ptr, 0x20)
            hasState := and(supported, and(hasState, eq(returndatasize(), 0x20)))
            state := mload(ptr)
        }

        if (hasState) {
            if (state == uint256(IRandomizerLifecycle.RandomnessRequestState.Stale)) {
                return "stale";
            }
            if (state == uint256(IRandomizerLifecycle.RandomnessRequestState.FailedPostProcessing))
            {
                return "failed";
            }
        }

        return "pending";
    }

    function pendingRandomnessRequests(address randomizer, uint256 collectionId)
        public
        view
        returns (uint256 pendingRequests)
    {
        bytes4 supportSelector = IRandomizerLifecycle.supportsRandomizerLifecycle.selector;
        bytes4 pendingSelector = IRandomizerLifecycle.pendingRandomnessRequests.selector;
        bool supported;
        bool pendingSucceeded;
        assembly ("memory-safe") {
            let ptr := mload(0x40)
            mstore(ptr, supportSelector)
            supported := staticcall(gas(), randomizer, ptr, 0x04, ptr, 0x20)
            supported := and(supported, and(eq(returndatasize(), 0x20), eq(mload(ptr), 1)))
            if supported {
                mstore(ptr, pendingSelector)
                mstore(add(ptr, 0x04), collectionId)
                pendingSucceeded := staticcall(gas(), randomizer, ptr, 0x24, ptr, 0x20)
                if and(pendingSucceeded, eq(returndatasize(), 0x20)) {
                    pendingRequests := mload(ptr)
                }
                if iszero(and(pendingSucceeded, eq(returndatasize(), 0x20))) {
                    returndatacopy(0, 0, returndatasize())
                    if returndatasize() {
                        revert(0, returndatasize())
                    }
                    revert(0, 0)
                }
            }
        }
    }

    function escapeHtmlAttribute(string memory raw) public pure returns (string memory) {
        bytes memory input = bytes(raw);
        bytes memory output = new bytes(input.length * 6);
        uint256 outputLength = 0;

        for (uint256 i = 0; i < input.length; i++) {
            bytes1 character = input[i];
            if (character == 0x26) {
                outputLength = _appendBytes(output, outputLength, "&amp;");
            } else if (character == 0x22) {
                outputLength = _appendBytes(output, outputLength, "&quot;");
            } else if (character == 0x27) {
                outputLength = _appendBytes(output, outputLength, "&#39;");
            } else if (character == 0x3c) {
                outputLength = _appendBytes(output, outputLength, "&lt;");
            } else if (character == 0x3e) {
                outputLength = _appendBytes(output, outputLength, "&gt;");
            } else if (uint8(character) < 0x20 || character == 0x7f) {
                output[outputLength] = 0x26;
                outputLength++;
                output[outputLength] = 0x23;
                outputLength++;
                output[outputLength] = 0x78;
                outputLength++;
                output[outputLength] = _hexNibble(uint8(character) >> 4);
                outputLength++;
                output[outputLength] = _hexNibble(uint8(character) & 0x0f);
                outputLength++;
                output[outputLength] = 0x3b;
                outputLength++;
            } else {
                output[outputLength] = character;
                outputLength++;
            }
        }

        return string(_truncateBytes(output, outputLength));
    }

    function escapeJavaScriptSingleQuotedString(string memory raw)
        public
        pure
        returns (string memory)
    {
        bytes memory input = bytes(raw);
        bytes memory output = new bytes(input.length * 6);
        uint256 outputLength = 0;

        for (uint256 i = 0; i < input.length; i++) {
            bytes1 character = input[i];
            if (character == 0x27 || character == 0x5c) {
                output[outputLength] = 0x5c;
                outputLength++;
                output[outputLength] = character;
                outputLength++;
            } else if (character == 0x0a) {
                outputLength = _appendBytes(output, outputLength, "\\n");
            } else if (character == 0x0d) {
                outputLength = _appendBytes(output, outputLength, "\\r");
            } else if (character == 0x09) {
                outputLength = _appendBytes(output, outputLength, "\\t");
            } else if (
                uint8(character) < 0x20 || character == 0x3c || character == 0x3e
                    || character == 0x26
            ) {
                output[outputLength] = 0x5c;
                outputLength++;
                output[outputLength] = 0x78;
                outputLength++;
                output[outputLength] = _hexNibble(uint8(character) >> 4);
                outputLength++;
                output[outputLength] = _hexNibble(uint8(character) & 0x0f);
                outputLength++;
            } else {
                output[outputLength] = character;
                outputLength++;
            }
        }

        return string(_truncateBytes(output, outputLength));
    }

    function escapeScriptElementEndTags(string memory raw) public pure returns (string memory) {
        bytes memory input = bytes(raw);
        bytes memory output = new bytes(input.length * 2);
        uint256 outputLength = 0;

        for (uint256 i = 0; i < input.length; i++) {
            if (_isScriptEndTagStart(input, i)) {
                output[outputLength] = 0x3c;
                outputLength++;
                output[outputLength] = 0x5c;
                outputLength++;
                output[outputLength] = 0x2f;
                outputLength++;
                i++;
            } else {
                output[outputLength] = input[i];
                outputLength++;
            }
        }

        return string(_truncateBytes(output, outputLength));
    }

    function escapeJsonString(string memory raw) public pure returns (string memory) {
        bytes memory input = bytes(raw);
        bytes memory output = new bytes(input.length * 6);
        uint256 outputLength = 0;

        for (uint256 i = 0; i < input.length; i++) {
            bytes1 character = input[i];
            if (character == 0x22) {
                output[outputLength] = 0x5c;
                outputLength++;
                output[outputLength] = 0x22;
                outputLength++;
            } else if (character == 0x5c) {
                output[outputLength] = 0x5c;
                outputLength++;
                output[outputLength] = 0x5c;
                outputLength++;
            } else if (character == 0x08) {
                output[outputLength] = 0x5c;
                outputLength++;
                output[outputLength] = 0x62;
                outputLength++;
            } else if (character == 0x0c) {
                output[outputLength] = 0x5c;
                outputLength++;
                output[outputLength] = 0x66;
                outputLength++;
            } else if (character == 0x0a) {
                output[outputLength] = 0x5c;
                outputLength++;
                output[outputLength] = 0x6e;
                outputLength++;
            } else if (character == 0x0d) {
                output[outputLength] = 0x5c;
                outputLength++;
                output[outputLength] = 0x72;
                outputLength++;
            } else if (character == 0x09) {
                output[outputLength] = 0x5c;
                outputLength++;
                output[outputLength] = 0x74;
                outputLength++;
            } else if (uint8(character) < 0x20) {
                output[outputLength] = 0x5c;
                outputLength++;
                output[outputLength] = 0x75;
                outputLength++;
                output[outputLength] = 0x30;
                outputLength++;
                output[outputLength] = 0x30;
                outputLength++;
                output[outputLength] = _hexNibble(uint8(character) >> 4);
                outputLength++;
                output[outputLength] = _hexNibble(uint8(character) & 0x0f);
                outputLength++;
            } else {
                output[outputLength] = character;
                outputLength++;
            }
        }

        return string(_truncateBytes(output, outputLength));
    }

    function isValidUtf8(string memory raw) public pure returns (bool valid) {
        assembly {
            let cursor := add(raw, 0x20)
            let end := add(cursor, mload(raw))
            valid := 1

            for { } lt(cursor, end) { cursor := add(cursor, 1) } {
                let lead := byte(0, mload(cursor))

                if iszero(lt(lead, 0x80)) {
                    if or(lt(lead, 0xc2), gt(lead, 0xf4)) {
                        valid := 0
                        break
                    }

                    cursor := add(cursor, 1)
                    if iszero(lt(cursor, end)) {
                        valid := 0
                        break
                    }

                    let second := byte(0, mload(cursor))
                    if iszero(eq(and(second, 0xc0), 0x80)) {
                        valid := 0
                        break
                    }

                    if lt(lead, 0xe0) {
                        continue
                    }

                    if or(
                        and(eq(lead, 0xe0), lt(second, 0xa0)),
                        and(eq(lead, 0xed), gt(second, 0x9f))
                    ) {
                        valid := 0
                        break
                    }

                    cursor := add(cursor, 1)
                    if iszero(lt(cursor, end)) {
                        valid := 0
                        break
                    }
                    if iszero(eq(and(byte(0, mload(cursor)), 0xc0), 0x80)) {
                        valid := 0
                        break
                    }

                    if lt(lead, 0xf0) {
                        continue
                    }

                    if or(
                        and(eq(lead, 0xf0), lt(second, 0x90)),
                        and(eq(lead, 0xf4), gt(second, 0x8f))
                    ) {
                        valid := 0
                        break
                    }

                    cursor := add(cursor, 1)
                    if iszero(lt(cursor, end)) {
                        valid := 0
                        break
                    }
                    if iszero(eq(and(byte(0, mload(cursor)), 0xc0), 0x80)) {
                        valid := 0
                        break
                    }
                }
            }
        }
    }

    function requireValidUtf8Bytes(bytes32 field, string memory value, uint256 maximum)
        public
        pure
    {
        uint256 actual = bytes(value).length;
        if (actual > maximum) revert MetadataFieldTooLarge(field, actual, maximum);
        if (!isValidUtf8(value)) revert MetadataFieldInvalidUTF8(field);
    }

    function requireValidUtf8ContentUri(
        bytes32 field,
        string memory uri,
        uint256 maximum,
        bool allowEmpty
    ) public pure {
        requireValidUtf8Bytes(field, uri, maximum);
        if (!isSafeContentUri(uri, allowEmpty)) revert UnsafeMetadataURI();
    }

    function requireValidUtf8ScriptUri(
        bytes32 field,
        string memory uri,
        uint256 maximum,
        bool allowEmpty
    ) public pure {
        requireValidUtf8Bytes(field, uri, maximum);
        if (!isSafeScriptUri(uri, allowEmpty)) revert UnsafeMetadataURI();
    }

    function requireValidCollectionUris(
        bytes32 baseField,
        string memory baseURI,
        bytes32 libraryField,
        string memory libraryUrl,
        uint256 maximum
    ) public pure {
        requireValidUtf8ContentUri(baseField, baseURI, maximum, true);
        requireValidUtf8ScriptUri(libraryField, libraryUrl, maximum, true);
    }

    function requireValidUtf8RawAttributes(
        uint256 tokenId,
        bytes32 field,
        string memory raw,
        uint256 maximum
    ) public pure {
        requireValidUtf8Bytes(field, raw, maximum);
        if (!isSafeRawAttributes(raw)) revert UnsafeRawAttributes(tokenId);
    }

    function requireValidUtf8ByteChunks(
        bytes32 countField,
        bytes32 chunkField,
        string[] memory chunks,
        uint256 maxChunks,
        uint256 maxChunkBytes
    ) public pure {
        if (chunks.length > maxChunks) {
            revert MetadataFieldTooLarge(countField, chunks.length, maxChunks);
        }
        for (uint256 i = 0; i < chunks.length; i++) {
            requireValidUtf8Bytes(chunkField, chunks[i], maxChunkBytes);
        }
    }

    function requireCollectionInfoLimits(
        string memory name,
        string memory artist,
        string memory description,
        string memory website,
        string memory license,
        string memory baseURI,
        string memory libraryUrl,
        string[] memory script
    ) public pure {
        requireValidUtf8Bytes(_FIELD_COLLECTION_NAME, name, _MAX_COLLECTION_TEXT_BYTES);
        requireValidUtf8Bytes(_FIELD_COLLECTION_ARTIST, artist, _MAX_COLLECTION_TEXT_BYTES);
        requireValidUtf8Bytes(
            _FIELD_COLLECTION_DESCRIPTION, description, _MAX_COLLECTION_TEXT_BYTES
        );
        requireValidUtf8Bytes(_FIELD_COLLECTION_WEBSITE, website, _MAX_COLLECTION_TEXT_BYTES);
        requireValidUtf8Bytes(_FIELD_COLLECTION_LICENSE, license, _MAX_COLLECTION_TEXT_BYTES);
        requireValidCollectionUris(
            _FIELD_COLLECTION_BASE_URI,
            baseURI,
            _FIELD_COLLECTION_LIBRARY,
            libraryUrl,
            _MAX_COLLECTION_TEXT_BYTES
        );
        requireValidUtf8ByteChunks(
            _FIELD_COLLECTION_SCRIPT_COUNT,
            _FIELD_COLLECTION_SCRIPT,
            script,
            _MAX_COLLECTION_SCRIPT_CHUNKS,
            _MAX_COLLECTION_SCRIPT_CHUNK_BYTES
        );
    }

    function requireCollectionBaseURI(string memory baseURI) public pure {
        requireValidUtf8ContentUri(
            _FIELD_COLLECTION_BASE_URI, baseURI, _MAX_COLLECTION_TEXT_BYTES, true
        );
    }

    function requireCollectionScriptChunk(string memory scriptChunk) public pure {
        requireValidUtf8Bytes(
            _FIELD_COLLECTION_SCRIPT, scriptChunk, _MAX_COLLECTION_SCRIPT_CHUNK_BYTES
        );
    }

    function requireTokenData(string memory data) public pure {
        requireValidUtf8Bytes(_FIELD_TOKEN_DATA, data, _MAX_TOKEN_DATA_BYTES);
    }

    function requireTokenImage(string memory image) public pure {
        requireValidUtf8ContentUri(_FIELD_TOKEN_IMAGE, image, _MAX_TOKEN_IMAGE_BYTES, false);
    }

    function requireTokenAttributes(uint256 tokenId, string memory attributes) public pure {
        requireValidUtf8RawAttributes(
            tokenId, _FIELD_TOKEN_ATTRIBUTES, attributes, _MAX_TOKEN_ATTRIBUTES_BYTES
        );
    }

    function isSafeRawAttributes(string memory raw) public pure returns (bool) {
        bytes memory input = bytes(raw);
        if (input.length == 0) {
            return true;
        }
        uint256 index = _skipRawAttributeSpaces(input, 0);
        if (index == input.length) {
            return false;
        }

        while (index < input.length) {
            bool ok;
            (ok, index) = _parseRawAttributeObject(input, index);
            if (!ok) {
                return false;
            }

            index = _skipRawAttributeSpaces(input, index);
            if (index == input.length) {
                return true;
            }
            if (input[index] != 0x2c) {
                return false;
            }
            index = _skipRawAttributeSpaces(input, index + 1);
            if (index == input.length) {
                return false;
            }
        }

        return true;
    }

    function isSafeContentUri(string memory uri, bool allowEmpty) public pure returns (bool) {
        bytes memory input = bytes(uri);
        if (input.length == 0) {
            return allowEmpty;
        }
        if (!_hasNoUriWhitespaceOrControls(input)) {
            return false;
        }
        return (_startsWith(input, "https://") && _hasHttpsHost(input))
            || (_startsWith(input, "ipfs://") && input.length > 7)
            || (_startsWith(input, "ar://") && input.length > 5);
    }

    function isSafeScriptUri(string memory uri) public pure returns (bool) {
        return isSafeScriptUri(uri, false);
    }

    function isSafeScriptUri(string memory uri, bool allowEmpty) public pure returns (bool) {
        bytes memory input = bytes(uri);
        if (input.length == 0) {
            return allowEmpty;
        }
        return _hasNoUriWhitespaceOrControls(input) && _startsWith(input, "https://")
            && _hasHttpsHost(input);
    }

    function areSafeCollectionUris(string memory baseURI, string memory libraryUrl)
        public
        pure
        returns (bool)
    {
        return isSafeContentUri(baseURI, true) && isSafeScriptUri(libraryUrl, true);
    }

    function supportsContractMarker(address target, bytes4 selector)
        public
        view
        returns (bool supported)
    {
        if (target.code.length == 0) {
            return false;
        }
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, selector)
            let success := staticcall(gas(), target, ptr, 4, ptr, 32)
            supported := and(and(success, gt(returndatasize(), 31)), eq(mload(ptr), 1))
        }
    }

    function requireContractMarker(address target, bytes4 markerSelector, bytes4 errorSelector)
        public
        view
    {
        if (!supportsContractMarker(target, markerSelector)) {
            assembly {
                mstore(0x00, errorSelector)
                revert(0x00, 0x04)
            }
        }
    }

    function requireNotPaused(address admins, bytes32 domain, bytes4 errorSelector) public view {
        if (IStreamAdmins(admins).isPaused(domain)) {
            assembly {
                mstore(0x00, errorSelector)
                revert(0x00, 0x04)
            }
        }
    }

    function _parseRawAttributeObject(bytes memory input, uint256 index)
        private
        pure
        returns (bool, uint256)
    {
        if (index >= input.length || input[index] != 0x7b) {
            return (false, index);
        }

        index = _skipRawAttributeSpaces(input, index + 1);
        uint8 seenKeys = 0;
        bool ok;
        uint8 key;
        (ok, index, key) = _parseRawAttributePair(input, index, seenKeys);
        if (!ok) {
            return (false, index);
        }
        seenKeys |= key;

        index = _skipRawAttributeSpaces(input, index);
        if (index >= input.length || input[index] != 0x2c) {
            return (false, index);
        }

        index = _skipRawAttributeSpaces(input, index + 1);
        (ok, index, key) = _parseRawAttributePair(input, index, seenKeys);
        if (!ok) {
            return (false, index);
        }
        seenKeys |= key;

        index = _skipRawAttributeSpaces(input, index);
        if (seenKeys != (_RAW_ATTRIBUTE_TRAIT_TYPE_KEY | _RAW_ATTRIBUTE_VALUE_KEY)) {
            return (false, index);
        }
        if (index >= input.length || input[index] != 0x7d) {
            return (false, index);
        }
        return (true, index + 1);
    }

    function _parseRawAttributePair(bytes memory input, uint256 index, uint8 seenKeys)
        private
        pure
        returns (bool, uint256, uint8)
    {
        bool ok;
        uint8 key;
        (ok, index, key) = _parseRawAttributeKey(input, index);
        if (!ok || (seenKeys & key) != 0) {
            return (false, index, 0);
        }

        index = _skipRawAttributeSpaces(input, index);
        if (index >= input.length || input[index] != 0x3a) {
            return (false, index, 0);
        }

        index = _skipRawAttributeSpaces(input, index + 1);
        (ok, index) = _parseJsonStringValue(input, index);
        if (!ok) {
            return (false, index, 0);
        }
        return (true, index, key);
    }

    function _parseRawAttributeKey(bytes memory input, uint256 index)
        private
        pure
        returns (bool, uint256, uint8)
    {
        if (_matches(input, index, "\"trait_type\"")) {
            return (true, index + 12, _RAW_ATTRIBUTE_TRAIT_TYPE_KEY);
        }
        if (_matches(input, index, "\"value\"")) {
            return (true, index + 7, _RAW_ATTRIBUTE_VALUE_KEY);
        }
        return (false, index, 0);
    }

    function _parseJsonStringValue(bytes memory input, uint256 index)
        private
        pure
        returns (bool, uint256)
    {
        if (index >= input.length || input[index] != 0x22) {
            return (false, index);
        }

        index++;
        while (index < input.length) {
            uint8 value = uint8(input[index]);
            if (value < 0x20) {
                return (false, index);
            }
            if (value == 0x22) {
                return (true, index + 1);
            }
            if (value == 0x5c) {
                index++;
                if (index >= input.length) {
                    return (false, index);
                }
                if (input[index] == 0x75) {
                    if (index + 4 >= input.length) {
                        return (false, index);
                    }
                    for (uint256 offset = 1; offset <= 4; offset++) {
                        if (!_isHexDigit(input[index + offset])) {
                            return (false, index);
                        }
                    }
                    index += 5;
                } else if (_isSimpleJsonEscape(input[index])) {
                    index++;
                } else {
                    return (false, index);
                }
            } else {
                index++;
            }
        }

        return (false, index);
    }

    function _skipRawAttributeSpaces(bytes memory input, uint256 index)
        private
        pure
        returns (uint256)
    {
        while (index < input.length && input[index] == 0x20) {
            index++;
        }
        return index;
    }

    function _matches(bytes memory input, uint256 index, string memory raw)
        private
        pure
        returns (bool)
    {
        bytes memory expected = bytes(raw);
        if (index + expected.length > input.length) {
            return false;
        }
        for (uint256 i = 0; i < expected.length; i++) {
            if (input[index + i] != expected[i]) {
                return false;
            }
        }
        return true;
    }

    function _isSimpleJsonEscape(bytes1 character) private pure returns (bool) {
        return character == 0x22 || character == 0x5c || character == 0x2f || character == 0x62
            || character == 0x66 || character == 0x6e || character == 0x72 || character == 0x74;
    }

    function _isHexDigit(bytes1 character) private pure returns (bool) {
        return (character >= 0x30 && character <= 0x39) || (character >= 0x41 && character <= 0x46)
            || (character >= 0x61 && character <= 0x66);
    }

    function _isScriptEndTagStart(bytes memory input, uint256 index) private pure returns (bool) {
        if (index + 7 >= input.length || input[index] != 0x3c || input[index + 1] != 0x2f) {
            return false;
        }

        return _lowerAscii(input[index + 2]) == 0x73 && _lowerAscii(input[index + 3]) == 0x63
            && _lowerAscii(input[index + 4]) == 0x72 && _lowerAscii(input[index + 5]) == 0x69
            && _lowerAscii(input[index + 6]) == 0x70 && _lowerAscii(input[index + 7]) == 0x74;
    }

    function _hasNoUriWhitespaceOrControls(bytes memory input) private pure returns (bool) {
        for (uint256 i = 0; i < input.length; i++) {
            uint8 value = uint8(input[i]);
            if (value <= 0x20 || value == 0x7f) {
                return false;
            }
        }
        return true;
    }

    function _hasHttpsHost(bytes memory input) private pure returns (bool) {
        if (input.length <= 8) {
            return false;
        }
        bytes1 firstHostByte = input[8];
        return firstHostByte != 0x2f && firstHostByte != 0x3f && firstHostByte != 0x23;
    }

    function _startsWith(bytes memory input, string memory rawPrefix) private pure returns (bool) {
        bytes memory prefix = bytes(rawPrefix);
        if (input.length < prefix.length) {
            return false;
        }
        for (uint256 i = 0; i < prefix.length; i++) {
            if (input[i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }

    function _lowerAscii(bytes1 character) private pure returns (bytes1) {
        if (character >= 0x41 && character <= 0x5a) {
            return bytes1(uint8(character) + 32);
        }
        return character;
    }

    function _truncateBytes(bytes memory input, uint256 length)
        private
        pure
        returns (bytes memory)
    {
        bytes memory output = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            output[i] = input[i];
        }
        return output;
    }

    function _appendBytes(bytes memory output, uint256 outputLength, string memory raw)
        private
        pure
        returns (uint256)
    {
        bytes memory input = bytes(raw);
        for (uint256 i = 0; i < input.length; i++) {
            output[outputLength] = input[i];
            outputLength++;
        }
        return outputLength;
    }

    function _hexNibble(uint8 value) private pure returns (bytes1) {
        return bytes1(value < 10 ? value + 0x30 : value + 0x57);
    }
}
