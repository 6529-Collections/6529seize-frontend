// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/StreamMetadataRenderer.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";
// MockRandomizer.sol also defines NoopRandomizer, used here to hold pending state.
import "./mocks/MockRandomizer.sol";

contract StreamMetadataEscapingTest is CharacterizationTestBase, StreamFixture {
    using Assertions for bool;
    using Assertions for string;
    using Assertions for uint256;

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant TOKEN_ID = 1;
    address private constant RECIPIENT = address(0xA11CE);
    string private constant TOKEN_DATA = "1,2,3";
    uint256 private constant TOKEN_SALT = 7;
    string private constant JSON_DATA_URI_PREFIX = "data:application/json;base64,";
    string private constant HTML_DATA_URI_PREFIX = "data:text/html;base64,";

    function testRendererEscapesSchemaAndStateFields() public pure {
        string memory decodedJson = StreamMetadataRenderer.onchainMetadataJson(
            string(abi.encodePacked("schema", bytes1(0x22), bytes1(0x5c), "v")),
            string(abi.encodePacked("pending", bytes1(0x22), bytes1(0x5c), "state")),
            "Name",
            "Description",
            string(
                abi.encodePacked("ipfs://image/quote\"", bytes1(0x5c), "line", bytes1(0x0a), ".png")
            ),
            "",
            "",
            "",
            false
        );

        _assertJsonParses(decodedJson);
        decodedJson.assertEq(
            string.concat(
                "{\"metadata_schema_version\":\"schema\\\"\\\\v\",",
                "\"metadata_state\":\"pending\\\"\\\\state\",",
                "\"name\":\"Name\",\"description\":\"Description\",",
                "\"image\":\"ipfs://image/quote\\\"\\\\line\\n.png\",\"attributes\":[]}"
            ),
            "schema and state fields were not escaped"
        );
    }

    function testOnchainJsonEscapesCollectionAndImageStrings() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        NoopRandomizer noopRandomizer = new NoopRandomizer();
        deployed.core.addRandomizer(COLLECTION_ID, address(noopRandomizer));
        _setCollectionStringsWithJsonMetacharacters(deployed.core);
        _mintToken(deployed);
        _setImageAndAttributes(
            deployed.core,
            "ipfs://image/escaped-safe.png",
            "{\"trait_type\":\"Mood\",\"value\":\"Calm\"}"
        );
        deployed.core.changeMetadataView(COLLECTION_ID, true);

        string memory decodedJson = _decodeJsonDataUri(deployed.core.tokenURI(TOKEN_ID));
        _assertJsonParses(decodedJson);

        decodedJson.assertEq(
            string.concat(
                "{\"metadata_schema_version\":\"6529stream-v1\",\"metadata_state\":\"pending\",",
                "\"name\":\"Genesis \\\"Alpha\\\"\\\\Beta #0\",",
                "\"description\":\"Line 1\\nTabbed\\tUnit\\u0001\\\"\\\\\",",
                "\"image\":\"ipfs://image/escaped-safe.png\",",
                "\"attributes\":[{\"trait_type\":\"Mood\",\"value\":\"Calm\"}]}"
            ),
            "escaped metadata JSON changed"
        );
    }

    function testRawAttributesAllowBracketsInsideJsonStrings() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        NoopRandomizer noopRandomizer = new NoopRandomizer();
        deployed.core.addRandomizer(COLLECTION_ID, address(noopRandomizer));
        _mintToken(deployed);
        _setImageAndAttributes(
            deployed.core, "ipfs://image.png", "{\"trait_type\":\"Frame\",\"value\":\"[kept]\"}"
        );
        deployed.core.changeMetadataView(COLLECTION_ID, true);

        string memory decodedJson = _decodeJsonDataUri(deployed.core.tokenURI(TOKEN_ID));
        _assertJsonParses(decodedJson);
        decodedJson.assertEq(
            string.concat(
                "{\"metadata_schema_version\":\"6529stream-v1\",\"metadata_state\":\"pending\",",
                "\"name\":\"Genesis #0\",\"description\":\"Description\",",
                "\"image\":\"ipfs://image.png\",",
                "\"attributes\":[{\"trait_type\":\"Frame\",\"value\":\"[kept]\"}]}"
            ),
            "quoted attribute brackets changed"
        );
    }

    function testRawAttributesAcceptEmptyFragment() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        NoopRandomizer noopRandomizer = new NoopRandomizer();
        deployed.core.addRandomizer(COLLECTION_ID, address(noopRandomizer));
        _mintToken(deployed);
        _setImageAndAttributes(deployed.core, "ipfs://image.png", "");
        deployed.core.changeMetadataView(COLLECTION_ID, true);

        string memory decodedJson = _decodeJsonDataUri(deployed.core.tokenURI(TOKEN_ID));
        _assertJsonParses(decodedJson);
        decodedJson.assertEq(
            string.concat(
                "{\"metadata_schema_version\":\"6529stream-v1\",\"metadata_state\":\"pending\",",
                "\"name\":\"Genesis #0\",\"description\":\"Description\",",
                "\"image\":\"ipfs://image.png\",",
                "\"attributes\":[]}"
            ),
            "empty attribute fragment changed"
        );
    }

    function testRawAttributesAcceptMultipleTopLevelObjects() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        NoopRandomizer noopRandomizer = new NoopRandomizer();
        deployed.core.addRandomizer(COLLECTION_ID, address(noopRandomizer));
        _mintToken(deployed);
        _setImageAndAttributes(
            deployed.core,
            "ipfs://image.png",
            string.concat(
                "{\"trait_type\":\"Mood\",\"value\":\"Calm\"},",
                "{\"trait_type\":\"Rarity\",\"value\":\"Rare\"}"
            )
        );
        deployed.core.changeMetadataView(COLLECTION_ID, true);

        string memory decodedJson = _decodeJsonDataUri(deployed.core.tokenURI(TOKEN_ID));
        _assertJsonParses(decodedJson);
        decodedJson.assertEq(
            string.concat(
                "{\"metadata_schema_version\":\"6529stream-v1\",\"metadata_state\":\"pending\",",
                "\"name\":\"Genesis #0\",\"description\":\"Description\",",
                "\"image\":\"ipfs://image.png\",",
                "\"attributes\":[",
                "{\"trait_type\":\"Mood\",\"value\":\"Calm\"},",
                "{\"trait_type\":\"Rarity\",\"value\":\"Rare\"}",
                "]}"
            ),
            "multi-object attribute fragment changed"
        );
    }

    function testRawAttributesAcceptSemanticPairsWithEitherOrderAndEscapes() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        NoopRandomizer noopRandomizer = new NoopRandomizer();
        deployed.core.addRandomizer(COLLECTION_ID, address(noopRandomizer));
        _mintToken(deployed);
        string memory rawAttributes = string.concat(
            "{\"value\":\"Calm\",\"trait_type\":\"Mood\"},",
            "{\"trait_type\":\"Quote\",\"value\":\"Line\\n\\\"kept\\\" slash\\/ unicode\\u003c\"}"
        );
        _setImageAndAttributes(deployed.core, "ipfs://image.png", rawAttributes);
        deployed.core.changeMetadataView(COLLECTION_ID, true);

        string memory decodedJson = _decodeJsonDataUri(deployed.core.tokenURI(TOKEN_ID));
        _assertJsonParses(decodedJson);
        _contains(bytes(decodedJson), bytes(rawAttributes))
            .assertTrue("semantic attribute pairs were not preserved");
    }

    function testRawAttributesRejectBreakoutFragment() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        _mintToken(deployed);

        uint256[] memory tokenIds = new uint256[](1);
        string[] memory images = new string[](1);
        string[] memory attributes = new string[](1);
        tokenIds[0] = TOKEN_ID;
        images[0] = "ipfs://image.png";
        attributes[0] = "{\"trait_type\":\"Mood\",\"value\":\"Calm\"}],\"evil\":true";

        vm.expectRevert(abi.encodeWithSelector(StreamCore.UnsafeRawAttributes.selector, TOKEN_ID));
        deployed.core.updateImagesAndAttributes(tokenIds, images, attributes);
    }

    function testRawAttributesRejectControlCharacters() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        _mintToken(deployed);

        uint256[] memory tokenIds = new uint256[](1);
        string[] memory images = new string[](1);
        string[] memory attributes = new string[](1);
        tokenIds[0] = TOKEN_ID;
        images[0] = "ipfs://image.png";
        attributes[0] = string(
            abi.encodePacked("{\"trait_type\":\"Mood\",\"value\":\"Calm", bytes1(0x0a), "\"}")
        );

        vm.expectRevert(abi.encodeWithSelector(StreamCore.UnsafeRawAttributes.selector, TOKEN_ID));
        deployed.core.updateImagesAndAttributes(tokenIds, images, attributes);
    }

    function testRawAttributesRejectUnterminatedStrings() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        _mintToken(deployed);

        uint256[] memory tokenIds = new uint256[](1);
        string[] memory images = new string[](1);
        string[] memory attributes = new string[](1);
        tokenIds[0] = TOKEN_ID;
        images[0] = "ipfs://image.png";
        attributes[0] = "{\"trait_type\":\"Mood\",\"value\":\"Calm}";

        vm.expectRevert(abi.encodeWithSelector(StreamCore.UnsafeRawAttributes.selector, TOKEN_ID));
        deployed.core.updateImagesAndAttributes(tokenIds, images, attributes);
    }

    function testRawAttributesRejectMismatchedDelimiters() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        _mintToken(deployed);

        uint256[] memory tokenIds = new uint256[](1);
        string[] memory images = new string[](1);
        string[] memory attributes = new string[](1);
        tokenIds[0] = TOKEN_ID;
        images[0] = "ipfs://image.png";

        attributes[0] = "{\"trait_type\":\"Mood\",\"value\":\"Calm\"]";
        vm.expectRevert(abi.encodeWithSelector(StreamCore.UnsafeRawAttributes.selector, TOKEN_ID));
        deployed.core.updateImagesAndAttributes(tokenIds, images, attributes);

        attributes[0] = "[{\"trait_type\":\"Mood\",\"value\":\"Calm\"}}";
        vm.expectRevert(abi.encodeWithSelector(StreamCore.UnsafeRawAttributes.selector, TOKEN_ID));
        deployed.core.updateImagesAndAttributes(tokenIds, images, attributes);
    }

    function testRawAttributesRejectTopLevelLiteralAndTrailingComma() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        _mintToken(deployed);

        uint256[] memory tokenIds = new uint256[](1);
        string[] memory images = new string[](1);
        string[] memory attributes = new string[](1);
        tokenIds[0] = TOKEN_ID;
        images[0] = "ipfs://image.png";

        attributes[0] = "not-json";
        vm.expectRevert(abi.encodeWithSelector(StreamCore.UnsafeRawAttributes.selector, TOKEN_ID));
        deployed.core.updateImagesAndAttributes(tokenIds, images, attributes);

        attributes[0] = "{\"trait_type\":\"Mood\",\"value\":\"Calm\"},";
        vm.expectRevert(abi.encodeWithSelector(StreamCore.UnsafeRawAttributes.selector, TOKEN_ID));
        deployed.core.updateImagesAndAttributes(tokenIds, images, attributes);
    }

    function testRawAttributesRejectMissingUnexpectedOrDuplicateKeys() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        _mintToken(deployed);

        _expectUnsafeRawAttributes(deployed.core, " ");
        _expectUnsafeRawAttributes(deployed.core, "   ");
        _expectUnsafeRawAttributes(deployed.core, "{\"trait_type\":\"Mood\"}");
        _expectUnsafeRawAttributes(deployed.core, "{\"value\":\"Calm\"}");
        _expectUnsafeRawAttributes(
            deployed.core, "{\"trait_type\":\"Level\",\"value\":\"1\",\"display_type\":\"number\"}"
        );
        _expectUnsafeRawAttributes(
            deployed.core, "{\"trait_type\":\"Mood\",\"trait_type\":\"Other\"}"
        );
    }

    function testRawAttributesRejectNonStringSemanticValues() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        _mintToken(deployed);

        _expectUnsafeRawAttributes(deployed.core, "{\"trait_type\":\"Level\",\"value\":1}");
        _expectUnsafeRawAttributes(deployed.core, "{\"trait_type\":\"Level\",\"value\":true}");
        _expectUnsafeRawAttributes(deployed.core, "{\"trait_type\":\"Level\",\"value\":null}");
        _expectUnsafeRawAttributes(deployed.core, "{\"trait_type\":\"Level\",\"value\":[]}");
        _expectUnsafeRawAttributes(deployed.core, "{\"trait_type\":\"Level\",\"value\":{}}");
    }

    function testRawAttributesRejectInvalidJsonStringEscapes() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        _mintToken(deployed);

        _expectUnsafeRawAttributes(
            deployed.core, "{\"trait_type\":\"Mood\",\"value\":\"bad\\xescape\"}"
        );
        _expectUnsafeRawAttributes(
            deployed.core, "{\"trait_type\":\"Mood\",\"value\":\"bad\\u12x4\"}"
        );
        _expectUnsafeRawAttributes(
            deployed.core, "{\"trait_type\":\"Mood\",\"value\":\"short\\u123\"}"
        );
    }

    function testAnimationHtmlEscapesWrapperBoundaries() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 dependencyKey = keccak256("hostile-dependency");
        string[] memory dependencyChunks = new string[](1);
        dependencyChunks[0] = "const dependency='</script>';window.dep=\"quoted\";\\";
        deployed.dependencyRegistry.addDependency(dependencyKey, dependencyChunks);

        string[] memory scripts = new string[](1);
        scripts[0] = "function draw(){const closing=\"</ScRiPt><img src=x>\";}";
        string memory hostileLibrary = string.concat(
            "https://cdn.example/lib.js\" async=\"bad\"</script><img src=x>&",
            string(abi.encodePacked(bytes1(0), bytes1(0x0a)))
        );
        string memory hostileLibraryHtml =
            _decodeHtmlDataUri(StreamMetadataRenderer.onchainAnimationURI(hostileLibrary, ""));
        bytes memory hostileLibraryBytes = bytes(hostileLibraryHtml);
        _contains(
                hostileLibraryBytes,
                bytes("src=\"https://cdn.example/lib.js&quot; async=&quot;bad&quot;")
            ).assertTrue("library attribute quote was not escaped");
        _contains(hostileLibraryBytes, bytes("&lt;/script&gt;&lt;img src=x&gt;&amp;"))
            .assertTrue("library attribute markup was not escaped");
        _contains(hostileLibraryBytes, bytes("&#x00;&#x0a;"))
            .assertTrue("library attribute controls were not escaped");

        deployed.core
            .updateCollectionInfo(
                COLLECTION_ID,
                "Genesis",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "ipfs://base/",
                "https://cdn.example/lib.js",
                dependencyKey,
                FULL_COLLECTION_UPDATE_INDEX,
                scripts
            );

        vm.prank(address(deployed.minter));
        deployed.core
            .mint(
                TOKEN_ID,
                RECIPIENT,
                "1];window.injected=true;//</script>",
                TOKEN_SALT,
                COLLECTION_ID
            );
        _setImageAndAttributes(
            deployed.core, "ipfs://image.png", "{\"trait_type\":\"Mood\",\"value\":\"Calm\"}"
        );
        deployed.core.changeMetadataView(COLLECTION_ID, true);

        string memory decodedJson = _decodeJsonDataUri(deployed.core.tokenURI(TOKEN_ID));
        _assertJsonParses(decodedJson);
        string memory html = _decodeHtmlDataUri(_extractAnimationDataUri(decodedJson));
        bytes memory htmlBytes = bytes(html);

        _countOccurrences(htmlBytes, bytes("</script>"))
            .assertEq(2, "unexpected raw script close count");
        _contains(
                htmlBytes, bytes("let tokenDataRaw='1];window.injected=true;//\\x3c/script\\x3e';")
            ).assertTrue("tokenData raw string was not escaped");
        _contains(htmlBytes, bytes("let tokenData=JSON.parse('['+tokenDataRaw+']')"))
            .assertTrue("tokenData parse wrapper missing");
        _contains(htmlBytes, bytes("const dependency=\\'\\x3c/script\\x3e\\'"))
            .assertTrue("dependency closing tag was not escaped");
        _contains(htmlBytes, bytes("<\\/ScRiPt><img src=x>"))
            .assertTrue("collection script closing tag was not neutralized");
    }

    function _setCollectionStringsWithJsonMetacharacters(StreamCore core) private {
        string[] memory scripts = new string[](1);
        scripts[0] = "function draw(){}";
        core.updateCollectionInfo(
            COLLECTION_ID,
            "Genesis \"Alpha\"\\Beta",
            "6529",
            string(
                abi.encodePacked(
                    "Line 1", bytes1(0x0a), "Tabbed", bytes1(0x09), "Unit", bytes1(0x01), "\"\\"
                )
            ),
            "https://6529.io",
            "CC0",
            "ipfs://base/",
            "https://cdn.example/script.js",
            bytes32(0),
            FULL_COLLECTION_UPDATE_INDEX,
            scripts
        );
    }

    function _mintToken(DeployedStream memory deployed) private {
        vm.prank(address(deployed.minter));
        deployed.core.mint(TOKEN_ID, RECIPIENT, TOKEN_DATA, TOKEN_SALT, COLLECTION_ID);
    }

    function _setImageAndAttributes(StreamCore core, string memory image, string memory attributes)
        private
    {
        uint256[] memory tokenIds = new uint256[](1);
        string[] memory images = new string[](1);
        string[] memory attributeValues = new string[](1);
        tokenIds[0] = TOKEN_ID;
        images[0] = image;
        attributeValues[0] = attributes;
        core.updateImagesAndAttributes(tokenIds, images, attributeValues);
    }

    function _expectUnsafeRawAttributes(StreamCore core, string memory attributes) private {
        uint256[] memory tokenIds = new uint256[](1);
        string[] memory images = new string[](1);
        string[] memory attributeValues = new string[](1);
        tokenIds[0] = TOKEN_ID;
        images[0] = "ipfs://image.png";
        attributeValues[0] = attributes;
        vm.expectRevert(abi.encodeWithSelector(StreamCore.UnsafeRawAttributes.selector, TOKEN_ID));
        core.updateImagesAndAttributes(tokenIds, images, attributeValues);
    }

    function _decodeJsonDataUri(string memory tokenUri) private pure returns (string memory) {
        return _decodeDataUri(tokenUri, JSON_DATA_URI_PREFIX);
    }

    function _decodeHtmlDataUri(string memory htmlUri) private pure returns (string memory) {
        return _decodeDataUri(htmlUri, HTML_DATA_URI_PREFIX);
    }

    function _decodeDataUri(string memory dataUri, string memory expectedPrefix)
        private
        pure
        returns (string memory)
    {
        bytes memory uri = bytes(dataUri);
        bytes memory prefix = bytes(expectedPrefix);
        require(uri.length >= prefix.length, "short data uri");

        for (uint256 i = 0; i < prefix.length; i++) {
            require(uri[i] == prefix[i], "wrong data uri");
        }

        bytes memory encoded = new bytes(uri.length - prefix.length);
        for (uint256 i = 0; i < encoded.length; i++) {
            encoded[i] = uri[prefix.length + i];
        }

        return string(_decodeBase64(encoded));
    }

    function _extractAnimationDataUri(string memory json) private pure returns (string memory) {
        bytes memory input = bytes(json);
        bytes memory prefix = bytes("\"animation_url\":\"");
        uint256 start = _findBytes(input, prefix) + prefix.length;
        uint256 end = start;
        while (end < input.length && input[end] != 0x22) {
            end++;
        }
        require(end < input.length, "animation url missing close");
        return string(_sliceBytes(input, start, end));
    }

    function _findBytes(bytes memory input, bytes memory needle) private pure returns (uint256) {
        require(needle.length != 0 && input.length >= needle.length, "needle missing");
        for (uint256 i = 0; i <= input.length - needle.length; i++) {
            bool matchesNeedle = true;
            for (uint256 j = 0; j < needle.length; j++) {
                if (input[i + j] != needle[j]) {
                    matchesNeedle = false;
                    break;
                }
            }
            if (matchesNeedle) {
                return i;
            }
        }
        revert("needle not found");
    }

    function _sliceBytes(bytes memory input, uint256 start, uint256 end)
        private
        pure
        returns (bytes memory)
    {
        require(end >= start && end <= input.length, "bad slice");
        bytes memory output = new bytes(end - start);
        for (uint256 i = 0; i < output.length; i++) {
            output[i] = input[start + i];
        }
        return output;
    }

    function _contains(bytes memory input, bytes memory needle) private pure returns (bool) {
        if (needle.length == 0) {
            return true;
        }
        if (input.length < needle.length) {
            return false;
        }
        for (uint256 i = 0; i <= input.length - needle.length; i++) {
            bool matchesNeedle = true;
            for (uint256 j = 0; j < needle.length; j++) {
                if (input[i + j] != needle[j]) {
                    matchesNeedle = false;
                    break;
                }
            }
            if (matchesNeedle) {
                return true;
            }
        }
        return false;
    }

    function _countOccurrences(bytes memory input, bytes memory needle)
        private
        pure
        returns (uint256)
    {
        if (needle.length == 0 || input.length < needle.length) {
            return 0;
        }

        uint256 count = 0;
        for (uint256 i = 0; i <= input.length - needle.length; i++) {
            bool matchesNeedle = true;
            for (uint256 j = 0; j < needle.length; j++) {
                if (input[i + j] != needle[j]) {
                    matchesNeedle = false;
                    break;
                }
            }
            if (matchesNeedle) {
                count++;
                i += needle.length - 1;
            }
        }
        return count;
    }

    function _assertJsonParses(string memory json) private pure {
        bytes memory parsed = vm.parseJson(json);
        (parsed.length != 0).assertTrue("decoded JSON did not parse");
    }

    function _decodeBase64(bytes memory input) private pure returns (bytes memory) {
        require(input.length % 4 == 0, "invalid base64 length");
        if (input.length == 0) {
            return "";
        }

        uint256 padding = 0;
        if (input[input.length - 1] == 0x3d) {
            padding++;
        }
        if (input[input.length - 2] == 0x3d) {
            padding++;
        }

        bytes memory output = new bytes((input.length * 3) / 4 - padding);
        uint256 outputIndex = 0;

        for (uint256 i = 0; i < input.length; i += 4) {
            uint256 combined = (uint256(_base64Value(input[i])) << 18)
                | (uint256(_base64Value(input[i + 1])) << 12)
                | (input[i + 2] == 0x3d ? 0 : uint256(_base64Value(input[i + 2])) << 6)
                | (input[i + 3] == 0x3d ? 0 : uint256(_base64Value(input[i + 3])));
            bytes32 decoded = bytes32(combined << 232);

            output[outputIndex] = decoded[0];
            outputIndex++;
            if (outputIndex < output.length) {
                output[outputIndex] = decoded[1];
                outputIndex++;
            }
            if (outputIndex < output.length) {
                output[outputIndex] = decoded[2];
                outputIndex++;
            }
        }

        return output;
    }

    function _base64Value(bytes1 character) private pure returns (uint8) {
        uint8 value = uint8(character);
        if (value >= 0x41 && value <= 0x5a) {
            return value - 0x41;
        }
        if (value >= 0x61 && value <= 0x7a) {
            return value - 0x61 + 26;
        }
        if (value >= 0x30 && value <= 0x39) {
            return value - 0x30 + 52;
        }
        if (value == 0x2b) {
            return 62;
        }
        if (value == 0x2f) {
            return 63;
        }
        revert("invalid base64");
    }
}
