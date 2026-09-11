// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/DependencyRegistry.sol";
import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/StreamMetadataRenderer.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";

contract StreamMetadataUtf8Test is CharacterizationTestBase, StreamFixture {
    using Assertions for bool;
    using Assertions for string;

    bytes32 private constant DEPENDENCY_SCRIPT_FIELD = "dependency.script";
    bytes32 private constant DEPENDENCY_PROVENANCE_FIELD = "dependency.provenance";
    bytes32 private constant COLLECTION_NAME_FIELD = "collection.name";
    bytes32 private constant COLLECTION_ARTIST_FIELD = "collection.artist";
    bytes32 private constant COLLECTION_DESCRIPTION_FIELD = "collection.description";
    bytes32 private constant COLLECTION_WEBSITE_FIELD = "collection.website";
    bytes32 private constant COLLECTION_LICENSE_FIELD = "collection.license";
    bytes32 private constant COLLECTION_BASE_URI_FIELD = "collection.baseURI";
    bytes32 private constant COLLECTION_LIBRARY_FIELD = "collection.library";
    bytes32 private constant COLLECTION_SCRIPT_FIELD = "collection.script";
    bytes32 private constant TOKEN_DATA_FIELD = "token.data";
    bytes32 private constant TOKEN_IMAGE_FIELD = "token.image";
    bytes32 private constant TOKEN_ATTRIBUTES_FIELD = "token.attributes";
    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant TOKEN_ID = 1;
    address private constant RECIPIENT = address(0xA11CE);
    uint256 private constant BASE_URI_UPDATE_INDEX = FULL_COLLECTION_UPDATE_INDEX - 1;

    function testRendererAcceptsValidAsciiAndMultibyteUtf8() public pure {
        StreamMetadataRenderer.isValidUtf8("").assertTrue("empty rejected");
        StreamMetadataRenderer.isValidUtf8("plain ascii").assertTrue("ascii rejected");
        StreamMetadataRenderer.isValidUtf8(_raw(bytes.concat(bytes1(0xc2), bytes1(0xa9))))
            .assertTrue("two-byte utf8 rejected");
        StreamMetadataRenderer.isValidUtf8(
                _raw(bytes.concat(bytes1(0xe2), bytes1(0x98), bytes1(0x83)))
            ).assertTrue("three-byte utf8 rejected");
        StreamMetadataRenderer.isValidUtf8(
                _raw(bytes.concat(bytes1(0xf0), bytes1(0x9f), bytes1(0x8c), bytes1(0x80)))
            ).assertTrue("four-byte utf8 rejected");
    }

    function testRendererRejectsInvalidUtf8Sequences() public pure {
        _assertInvalid(bytes.concat(bytes1(0x80)), "lone continuation accepted");
        _assertInvalid(bytes.concat(bytes1(0xc0), bytes1(0xaf)), "overlong two-byte accepted");
        _assertInvalid(
            bytes.concat(bytes1(0xe2), bytes1(0x28), bytes1(0xa1)), "bad continuation accepted"
        );
        _assertInvalid(bytes.concat(bytes1(0xed), bytes1(0xa0), bytes1(0x80)), "surrogate accepted");
        _assertInvalid(
            bytes.concat(bytes1(0xf4), bytes1(0x90), bytes1(0x80), bytes1(0x80)),
            "out-of-range code point accepted"
        );
        _assertInvalid(
            bytes.concat(bytes1(0xf0), bytes1(0x90), bytes1(0x80)), "truncated sequence accepted"
        );
    }

    function testDependencyRegistryAcceptsValidMultibyteUtf8Metadata() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 dependencyKey = keccak256("utf8-valid-library");
        string[] memory chunks = new string[](1);
        chunks[0] = string.concat(
            "const label = '", _raw(bytes.concat(bytes1(0xe2), bytes1(0x98), bytes1(0x83))), "';"
        );
        string memory provenance =
            string.concat("created by ", _raw(bytes.concat(bytes1(0xc2), bytes1(0xa9))));

        deployed.dependencyRegistry.addDependencyWithProvenance(dependencyKey, chunks, provenance);

        deployed.dependencyRegistry.getDependencyScript(dependencyKey, 0)
            .assertEq(chunks[0], "valid utf8 script not stored");
        deployed.dependencyRegistry.getDependencyVersionProvenance(dependencyKey, 1)
            .assertEq(provenance, "valid utf8 provenance not stored");
    }

    function testDependencyRegistryRejectsInvalidUtf8ScriptChunk() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        string[] memory chunks = new string[](1);
        chunks[0] = _raw(bytes.concat(bytes1(0xc0), bytes1(0xaf)));

        vm.expectRevert(
            abi.encodeWithSelector(
                DependencyRegistry.DependencyFieldInvalidUTF8.selector, DEPENDENCY_SCRIPT_FIELD
            )
        );
        deployed.dependencyRegistry.addDependency(keccak256("utf8-invalid-script"), chunks);
    }

    function testDependencyRegistryRejectsInvalidUtf8Provenance() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        string[] memory chunks = new string[](1);
        chunks[0] = "function draw(){}";

        vm.expectRevert(
            abi.encodeWithSelector(
                DependencyRegistry.DependencyFieldInvalidUTF8.selector, DEPENDENCY_PROVENANCE_FIELD
            )
        );
        deployed.dependencyRegistry
            .addDependencyWithProvenance(
                keccak256("utf8-invalid-provenance"), chunks, _raw(bytes.concat(bytes1(0x80)))
            );
    }

    function testDependencyRegistryReportsSizeBeforeUtf8Validity() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        uint256 maximum = deployed.dependencyRegistry.MAX_DEPENDENCY_SCRIPT_CHUNK_BYTES();
        string[] memory chunks = new string[](1);
        chunks[0] = _oversizedInvalidUtf8(maximum + 1);

        vm.expectRevert(
            abi.encodeWithSelector(
                DependencyRegistry.DependencyFieldTooLarge.selector,
                DEPENDENCY_SCRIPT_FIELD,
                maximum + 1,
                maximum
            )
        );
        deployed.dependencyRegistry.addDependency(keccak256("utf8-oversized-script"), chunks);
    }

    function testStreamCoreAcceptsValidMultibyteUtf8MetadataInputs() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        string memory snowman = _raw(bytes.concat(bytes1(0xe2), bytes1(0x98), bytes1(0x83)));
        string[] memory script = _singleChunk(string.concat("const label = '", snowman, "';"));

        deployed.core
            .createCollection(
                string.concat("Genesis ", snowman),
                string.concat("Artist ", snowman),
                string.concat("Description ", snowman),
                "https://6529.io",
                string.concat("CC0 ", snowman),
                "ipfs://base/",
                "https://cdn.example/script.js",
                bytes32(0),
                script
            );

        vm.prank(address(deployed.minter));
        deployed.core
            .mint(TOKEN_ID, RECIPIENT, string.concat("token data ", snowman), 7, COLLECTION_ID);

        uint256[] memory tokenIds = new uint256[](1);
        string[] memory images = new string[](1);
        string[] memory attributes = new string[](1);
        tokenIds[0] = TOKEN_ID;
        images[0] = "ipfs://image.png";
        attributes[0] = string.concat("{\"trait_type\":\"Mood\",\"value\":\"", snowman, "\"}");

        deployed.core.updateImagesAndAttributes(tokenIds, images, attributes);
        deployed.core.changeTokenData(TOKEN_ID, string.concat("updated ", snowman));
    }

    function testStreamCoreRejectsInvalidUtf8CollectionFields() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        string memory invalid = _raw(bytes.concat(bytes1(0xf5)));
        string[] memory validScript = _singleChunk("function draw(){}");

        _expectInvalidCollectionCreate(
            deployed,
            COLLECTION_NAME_FIELD,
            invalid,
            "6529",
            "Description",
            "https://6529.io",
            "CC0",
            "ipfs://base/",
            "https://cdn.example/script.js",
            validScript
        );
        _expectInvalidCollectionCreate(
            deployed,
            COLLECTION_ARTIST_FIELD,
            "Genesis",
            invalid,
            "Description",
            "https://6529.io",
            "CC0",
            "ipfs://base/",
            "https://cdn.example/script.js",
            validScript
        );
        _expectInvalidCollectionCreate(
            deployed,
            COLLECTION_DESCRIPTION_FIELD,
            "Genesis",
            "6529",
            invalid,
            "https://6529.io",
            "CC0",
            "ipfs://base/",
            "https://cdn.example/script.js",
            validScript
        );
        _expectInvalidCollectionCreate(
            deployed,
            COLLECTION_WEBSITE_FIELD,
            "Genesis",
            "6529",
            "Description",
            invalid,
            "CC0",
            "ipfs://base/",
            "https://cdn.example/script.js",
            validScript
        );
        _expectInvalidCollectionCreate(
            deployed,
            COLLECTION_LICENSE_FIELD,
            "Genesis",
            "6529",
            "Description",
            "https://6529.io",
            invalid,
            "ipfs://base/",
            "https://cdn.example/script.js",
            validScript
        );
        _expectInvalidCollectionCreate(
            deployed,
            COLLECTION_BASE_URI_FIELD,
            "Genesis",
            "6529",
            "Description",
            "https://6529.io",
            "CC0",
            invalid,
            "https://cdn.example/script.js",
            validScript
        );
        _expectInvalidCollectionCreate(
            deployed,
            COLLECTION_LIBRARY_FIELD,
            "Genesis",
            "6529",
            "Description",
            "https://6529.io",
            "CC0",
            "ipfs://base/",
            invalid,
            validScript
        );
        _expectInvalidCollectionCreate(
            deployed,
            COLLECTION_SCRIPT_FIELD,
            "Genesis",
            "6529",
            "Description",
            "https://6529.io",
            "CC0",
            "ipfs://base/",
            "https://cdn.example/script.js",
            _singleChunk(invalid)
        );
    }

    function testStreamCoreRejectsInvalidUtf8IncrementalCollectionUpdates() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        string memory invalid = _raw(bytes.concat(bytes1(0x80)));

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.MetadataFieldInvalidUTF8.selector, COLLECTION_BASE_URI_FIELD
            )
        );
        deployed.core
            .updateCollectionInfo(
                COLLECTION_ID,
                "Genesis",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                invalid,
                "https://cdn.example/script.js",
                bytes32(0),
                BASE_URI_UPDATE_INDEX,
                _singleChunk("function draw(){}")
            );

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.MetadataFieldInvalidUTF8.selector, COLLECTION_SCRIPT_FIELD
            )
        );
        deployed.core
            .updateCollectionInfo(
                COLLECTION_ID, "", "", "", "", "", "", "", bytes32(0), 0, _singleChunk(invalid)
            );
    }

    function testStreamCoreRejectsInvalidUtf8TokenDataVariants() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        _expectInvalidTokenDataMint(deployed, _raw(bytes.concat(bytes1(0xf5))));
        _expectInvalidTokenDataMint(deployed, _raw(bytes.concat(bytes1(0x80))));
        _expectInvalidTokenDataMint(deployed, _raw(bytes.concat(bytes1(0xc0), bytes1(0xaf))));
        _expectInvalidTokenDataMint(
            deployed, _raw(bytes.concat(bytes1(0xed), bytes1(0xa0), bytes1(0x80)))
        );
        _expectInvalidTokenDataMint(
            deployed, _raw(bytes.concat(bytes1(0xf4), bytes1(0x90), bytes1(0x80), bytes1(0x80)))
        );
        _expectInvalidTokenDataMint(
            deployed, _raw(bytes.concat(bytes1(0xf0), bytes1(0x90), bytes1(0x80)))
        );
    }

    function testStreamCoreRejectsInvalidUtf8TokenImageAttributesAndUpdates() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        vm.prank(address(deployed.minter));
        deployed.core.mint(TOKEN_ID, RECIPIENT, "valid", 7, COLLECTION_ID);

        uint256[] memory tokenIds = new uint256[](1);
        string[] memory images = new string[](1);
        string[] memory attributes = new string[](1);
        tokenIds[0] = TOKEN_ID;
        images[0] = _raw(bytes.concat(bytes1(0xe0), bytes1(0x80), bytes1(0x80)));
        attributes[0] = "";

        vm.expectRevert(
            abi.encodeWithSelector(StreamCore.MetadataFieldInvalidUTF8.selector, TOKEN_IMAGE_FIELD)
        );
        deployed.core.updateImagesAndAttributes(tokenIds, images, attributes);

        images[0] = "ipfs://image.png";
        attributes[0] = _raw(bytes.concat(bytes1(0xe2), bytes1(0x28), bytes1(0xa1)));

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.MetadataFieldInvalidUTF8.selector, TOKEN_ATTRIBUTES_FIELD
            )
        );
        deployed.core.updateImagesAndAttributes(tokenIds, images, attributes);

        vm.expectRevert(
            abi.encodeWithSelector(StreamCore.MetadataFieldInvalidUTF8.selector, TOKEN_DATA_FIELD)
        );
        deployed.core.changeTokenData(TOKEN_ID, _raw(bytes.concat(bytes1(0xc1), bytes1(0xbf))));
    }

    function testStreamCoreReportsSizeBeforeUtf8Validity() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        uint256 maximum = deployed.core.MAX_TOKEN_DATA_BYTES();

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.MetadataFieldTooLarge.selector, TOKEN_DATA_FIELD, maximum + 1, maximum
            )
        );
        vm.prank(address(deployed.minter));
        deployed.core
            .mint(TOKEN_ID, RECIPIENT, _oversizedInvalidUtf8(maximum + 1), 7, COLLECTION_ID);
    }

    function _assertInvalid(bytes memory raw, string memory message) private pure {
        StreamMetadataRenderer.isValidUtf8(_raw(raw)).assertFalse(message);
    }

    function _expectInvalidCollectionCreate(
        DeployedStream memory deployed,
        bytes32 field,
        string memory name,
        string memory artist,
        string memory description,
        string memory website,
        string memory license,
        string memory baseURI,
        string memory libraryUrl,
        string[] memory script
    ) private {
        vm.expectRevert(abi.encodeWithSelector(StreamCore.MetadataFieldInvalidUTF8.selector, field));
        deployed.core
            .createCollection(
                name, artist, description, website, license, baseURI, libraryUrl, bytes32(0), script
            );
    }

    function _expectInvalidTokenDataMint(DeployedStream memory deployed, string memory tokenData)
        private
    {
        vm.expectRevert(
            abi.encodeWithSelector(StreamCore.MetadataFieldInvalidUTF8.selector, TOKEN_DATA_FIELD)
        );
        vm.prank(address(deployed.minter));
        deployed.core.mint(TOKEN_ID, RECIPIENT, tokenData, 7, COLLECTION_ID);
    }

    function _raw(bytes memory rawBytes) private pure returns (string memory) {
        return string(rawBytes);
    }

    function _oversizedInvalidUtf8(uint256 size) private pure returns (string memory) {
        bytes memory rawBytes = new bytes(size);
        for (uint256 i = 0; i < size; i++) {
            rawBytes[i] = 0x61;
        }
        rawBytes[size - 1] = 0x80;
        return string(rawBytes);
    }

    function _singleChunk(string memory value) private pure returns (string[] memory) {
        string[] memory chunks = new string[](1);
        chunks[0] = value;
        return chunks;
    }
}
