// SPDX-License-Identifier: MIT

/**
 *
 *  @title NextGen 6529 - Dependency Registry Contract
 *  @custom:date 29-January-2023
 *  @custom:version 1.1
 *  @author 6529 team
 */

pragma solidity ^0.8.19;

import "./IStreamAdmins.sol";
import "./StreamMetadataRenderer.sol";

contract DependencyRegistry {
    bytes32 public constant DEPENDENCY_SCRIPT_CONTENT_TYPEHASH = keccak256(
        "6529StreamDependencyScript(bytes32 dependencyNameAndVersion,uint256 chunkCount,bytes32 chunksHash)"
    );
    bytes32 public constant DEPENDENCY_SCRIPT_CHUNK_TYPEHASH = keccak256(
        "6529StreamDependencyScriptChunk(uint256 index,bytes32 chunkHash,uint256 byteLength)"
    );
    uint256 public constant MAX_DEPENDENCY_SCRIPT_CHUNK_BYTES = 8_192;
    uint256 public constant MAX_DEPENDENCY_SCRIPT_CHUNKS = 32;
    uint256 public constant MAX_DEPENDENCY_PROVENANCE_BYTES = 2_048;
    bytes32 private constant _FIELD_DEPENDENCY_SCRIPT = "dependency.script";
    bytes32 private constant _FIELD_DEPENDENCY_SCRIPT_COUNT = "dependency.scriptCount";
    bytes32 private constant _FIELD_DEPENDENCY_PROVENANCE = "dependency.provenance";

    error DependencyChunkIndexOutOfBounds(
        bytes32 dependencyNameAndVersion, uint256 version, uint256 index
    );
    error DependencyVersionMissing(bytes32 dependencyNameAndVersion, uint256 version);
    error DependencyKeyReserved(bytes32 dependencyNameAndVersion);
    error DependencyFieldTooLarge(bytes32 field, uint256 actual, uint256 maximum);
    error DependencyFieldInvalidUTF8(bytes32 field);

    event DependencyVersionCreated(
        bytes32 indexed dependencyNameAndVersion,
        uint256 indexed version,
        bytes32 indexed contentHash,
        address admin
    );
    event DependencyVersionDeprecated(
        bytes32 indexed dependencyNameAndVersion, uint256 indexed version, address indexed admin
    );

    struct dependencyInfoStructure {
        bytes32 _collectionDependencyName;
        string[] libraryScript;
        bytes32 contentHash;
        string provenance;
        address creator;
        uint256 createdBlock;
        uint256 createdTimestamp;
        bool deprecated;
        bool exists;
    }

    mapping(bytes32 => mapping(uint256 => dependencyInfoStructure)) private dependencyInfo;
    mapping(bytes32 => uint256) private latestDependencyVersions;

    IStreamAdmins private adminsContract;

    // certain functions can only be called by a global or function admin

    modifier FunctionAdminRequired(bytes4 _selector) {
        require(
            adminsContract.retrieveFunctionAdmin(msg.sender, address(this), _selector) == true
                || adminsContract.retrieveGlobalAdmin(msg.sender) == true,
            "Not allowed"
        );
        _;
    }

    // constructor
    constructor(address _adminsContract) {
        adminsContract = IStreamAdmins(_adminsContract);
    }

    function addDependency(bytes32 _collectionDependencyName, string[] memory _libraryScript)
        public
        FunctionAdminRequired(this.addDependency.selector)
    {
        _createDependencyVersion(_collectionDependencyName, _libraryScript, "");
    }

    function addDependencyWithProvenance(
        bytes32 _collectionDependencyName,
        string[] memory _libraryScript,
        string memory _provenance
    ) public FunctionAdminRequired(this.addDependencyWithProvenance.selector) {
        _createDependencyVersion(_collectionDependencyName, _libraryScript, _provenance);
    }

    function addDependencyScriptIndex(
        bytes32 _collectionDependencyName,
        uint256 index,
        string memory _libraryScript
    ) public FunctionAdminRequired(this.addDependencyScriptIndex.selector) {
        _requireDependencyKeyNotReserved(_collectionDependencyName);
        uint256 latestVersion = latestDependencyVersions[_collectionDependencyName];
        dependencyInfoStructure storage current =
            _dependencyVersionRecord(_collectionDependencyName, latestVersion);
        if (index >= current.libraryScript.length) {
            revert DependencyChunkIndexOutOfBounds(_collectionDependencyName, latestVersion, index);
        }

        string[] memory nextScript = new string[](current.libraryScript.length);
        for (uint256 i = 0; i < current.libraryScript.length; i++) {
            nextScript[i] = current.libraryScript[i];
        }
        nextScript[index] = _libraryScript;
        _createDependencyVersion(_collectionDependencyName, nextScript, current.provenance);
    }

    function deprecateDependencyVersion(bytes32 _collectionDependencyName, uint256 version)
        public
        FunctionAdminRequired(this.deprecateDependencyVersion.selector)
    {
        _requireDependencyKeyNotReserved(_collectionDependencyName);
        dependencyInfoStructure storage record =
            _dependencyVersionRecord(_collectionDependencyName, version);
        record.deprecated = true;
        emit DependencyVersionDeprecated(_collectionDependencyName, version, msg.sender);
    }

    // function to update admin contract

    function updateAdminContract(address _newadminsContract)
        public
        FunctionAdminRequired(this.updateAdminContract.selector)
    {
        require(
            IStreamAdmins(_newadminsContract).isAdminContract() == true, "Contract is not Admin"
        );
        adminsContract = IStreamAdmins(_newadminsContract);
    }

    function latestDependencyVersion(bytes32 dependencyNameAndVersion)
        external
        view
        returns (uint256)
    {
        return latestDependencyVersions[dependencyNameAndVersion];
    }

    function getDependencyVersionRecord(bytes32 dependencyNameAndVersion, uint256 version)
        external
        view
        returns (bytes32, uint256, uint256, bytes32, string memory, address, uint256, uint256, bool)
    {
        dependencyInfoStructure storage record =
            _dependencyVersionRecord(dependencyNameAndVersion, version);
        return (
            record._collectionDependencyName,
            version,
            record.libraryScript.length,
            record.contentHash,
            record.provenance,
            record.creator,
            record.createdBlock,
            record.createdTimestamp,
            record.deprecated
        );
    }

    function getDependencyVersionProvenance(bytes32 dependencyNameAndVersion, uint256 version)
        external
        view
        returns (string memory)
    {
        return _dependencyVersionRecord(dependencyNameAndVersion, version).provenance;
    }

    function getDependencyVersionCreator(bytes32 dependencyNameAndVersion, uint256 version)
        external
        view
        returns (address)
    {
        return _dependencyVersionRecord(dependencyNameAndVersion, version).creator;
    }

    function getDependencyVersionCreatedBlock(bytes32 dependencyNameAndVersion, uint256 version)
        external
        view
        returns (uint256)
    {
        return _dependencyVersionRecord(dependencyNameAndVersion, version).createdBlock;
    }

    function getDependencyVersionCreatedTimestamp(bytes32 dependencyNameAndVersion, uint256 version)
        external
        view
        returns (uint256)
    {
        return _dependencyVersionRecord(dependencyNameAndVersion, version).createdTimestamp;
    }

    function isDependencyVersionDeprecated(bytes32 dependencyNameAndVersion, uint256 version)
        external
        view
        returns (bool)
    {
        return _dependencyVersionRecord(dependencyNameAndVersion, version).deprecated;
    }

    function getDependencyScriptCount(bytes32 dependencyNameAndVersion)
        external
        view
        returns (uint256)
    {
        return getDependencyScriptCountAtVersion(
            dependencyNameAndVersion, latestDependencyVersions[dependencyNameAndVersion]
        );
    }

    function getDependencyScriptCountAtVersion(bytes32 dependencyNameAndVersion, uint256 version)
        public
        view
        returns (uint256)
    {
        if (version == 0) {
            return 0;
        }
        return _dependencyVersionRecord(dependencyNameAndVersion, version).libraryScript.length;
    }

    function getDependencyScript(bytes32 dependencyNameAndVersion, uint256 index)
        external
        view
        returns (string memory)
    {
        return getDependencyScriptAtVersion(
            dependencyNameAndVersion, latestDependencyVersions[dependencyNameAndVersion], index
        );
    }

    function getDependencyScriptAtVersion(
        bytes32 dependencyNameAndVersion,
        uint256 version,
        uint256 index
    ) public view returns (string memory) {
        dependencyInfoStructure storage record =
            _dependencyVersionRecord(dependencyNameAndVersion, version);
        if (index >= record.libraryScript.length) {
            revert DependencyChunkIndexOutOfBounds(dependencyNameAndVersion, version, index);
        }
        return record.libraryScript[index];
    }

    /// @notice Returns the typed hash of one dependency script chunk.
    /// @param dependencyNameAndVersion Dependency key currently stored in the registry.
    /// @param index Chunk index inside the latest dependency script version.
    /// @return The chunk hash, bound to chunk index, chunk byte length, and chunk contents.
    function getDependencyScriptChunkHash(bytes32 dependencyNameAndVersion, uint256 index)
        public
        view
        returns (bytes32)
    {
        return getDependencyScriptChunkHashAtVersion(
            dependencyNameAndVersion, latestDependencyVersions[dependencyNameAndVersion], index
        );
    }

    function getDependencyScriptChunkHashAtVersion(
        bytes32 dependencyNameAndVersion,
        uint256 version,
        uint256 index
    ) public view returns (bytes32) {
        return _hashDependencyScriptChunk(
            index, getDependencyScriptAtVersion(dependencyNameAndVersion, version, index)
        );
    }

    /// @notice Returns the typed content hash for the latest dependency script version.
    /// @param dependencyNameAndVersion Dependency key currently stored in the registry.
    /// @return The content hash for the latest chunk sequence under the dependency key.
    function getDependencyScriptContentHash(bytes32 dependencyNameAndVersion)
        external
        view
        returns (bytes32)
    {
        return getDependencyScriptContentHashAtVersion(
            dependencyNameAndVersion, latestDependencyVersions[dependencyNameAndVersion]
        );
    }

    function getDependencyScriptContentHashAtVersion(
        bytes32 dependencyNameAndVersion,
        uint256 version
    ) public view returns (bytes32) {
        if (version == 0) {
            string[] memory emptyScript = new string[](0);
            return _hashDependencyScriptContent(dependencyNameAndVersion, emptyScript);
        }
        return _dependencyVersionRecord(dependencyNameAndVersion, version).contentHash;
    }

    function _createDependencyVersion(
        bytes32 _collectionDependencyName,
        string[] memory _libraryScript,
        string memory _provenance
    ) private {
        _requireDependencyKeyNotReserved(_collectionDependencyName);
        _requireDependencyLimits(_libraryScript, _provenance);
        uint256 version = latestDependencyVersions[_collectionDependencyName] + 1;
        bytes32 contentHash =
            _hashDependencyScriptContent(_collectionDependencyName, _libraryScript);

        dependencyInfoStructure storage record = dependencyInfo[_collectionDependencyName][version];
        record._collectionDependencyName = _collectionDependencyName;
        record.contentHash = contentHash;
        record.provenance = _provenance;
        record.creator = msg.sender;
        record.createdBlock = block.number;
        // Provenance metadata only; not used for authorization, randomness, or ordering.
        record.createdTimestamp = block.timestamp;
        record.exists = true;
        for (uint256 i = 0; i < _libraryScript.length; i++) {
            record.libraryScript.push(_libraryScript[i]);
        }

        latestDependencyVersions[_collectionDependencyName] = version;
        emit DependencyVersionCreated(_collectionDependencyName, version, contentHash, msg.sender);
    }

    function _requireDependencyKeyNotReserved(bytes32 dependencyNameAndVersion) private pure {
        if (dependencyNameAndVersion == bytes32(0)) {
            revert DependencyKeyReserved(dependencyNameAndVersion);
        }
    }

    function _requireDependencyLimits(string[] memory chunks, string memory provenance)
        private
        pure
    {
        if (chunks.length > MAX_DEPENDENCY_SCRIPT_CHUNKS) {
            revert DependencyFieldTooLarge(
                _FIELD_DEPENDENCY_SCRIPT_COUNT, chunks.length, MAX_DEPENDENCY_SCRIPT_CHUNKS
            );
        }
        for (uint256 i = 0; i < chunks.length; i++) {
            _requireMaxBytes(_FIELD_DEPENDENCY_SCRIPT, chunks[i], MAX_DEPENDENCY_SCRIPT_CHUNK_BYTES);
        }
        _requireMaxBytes(_FIELD_DEPENDENCY_PROVENANCE, provenance, MAX_DEPENDENCY_PROVENANCE_BYTES);
    }

    function _requireMaxBytes(bytes32 field, string memory value, uint256 maximum) private pure {
        uint256 actual = bytes(value).length;
        if (actual > maximum) revert DependencyFieldTooLarge(field, actual, maximum);
        if (!StreamMetadataRenderer.isValidUtf8(value)) revert DependencyFieldInvalidUTF8(field);
    }

    // Slither maps the provenance timestamp field to this version-existence check.
    // slither-disable-start timestamp
    function _dependencyVersionRecord(bytes32 dependencyNameAndVersion, uint256 version)
        private
        view
        returns (dependencyInfoStructure storage)
    {
        if (version == 0 || !dependencyInfo[dependencyNameAndVersion][version].exists) {
            revert DependencyVersionMissing(dependencyNameAndVersion, version);
        }
        return dependencyInfo[dependencyNameAndVersion][version];
    }
    // slither-disable-end timestamp

    function _hashDependencyScriptContent(bytes32 dependencyNameAndVersion, string[] memory chunks)
        private
        pure
        returns (bytes32)
    {
        bytes32 chunksHash = bytes32(0);

        for (uint256 i = 0; i < chunks.length; i++) {
            chunksHash = keccak256(abi.encode(chunksHash, _hashDependencyScriptChunk(i, chunks[i])));
        }

        return keccak256(
            abi.encode(
                DEPENDENCY_SCRIPT_CONTENT_TYPEHASH,
                dependencyNameAndVersion,
                chunks.length,
                chunksHash
            )
        );
    }

    function _hashDependencyScriptChunk(uint256 index, string memory chunk)
        private
        pure
        returns (bytes32)
    {
        bytes memory chunkBytes = bytes(chunk);
        return keccak256(
            abi.encode(
                DEPENDENCY_SCRIPT_CHUNK_TYPEHASH, index, keccak256(chunkBytes), chunkBytes.length
            )
        );
    }
}
