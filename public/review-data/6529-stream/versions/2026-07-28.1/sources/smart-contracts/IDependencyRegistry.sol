// SPDX-License-Identifier: LGPL-3.0-only

pragma solidity ^0.8.19;

interface IDependencyRegistry {
    function latestDependencyVersion(bytes32 dependencyNameAndVersion)
        external
        view
        returns (uint256);

    function getDependencyVersionRecord(bytes32 dependencyNameAndVersion, uint256 version)
        external
        view
        returns (bytes32, uint256, uint256, bytes32, string memory, address, uint256, uint256, bool);

    function getDependencyVersionProvenance(bytes32 dependencyNameAndVersion, uint256 version)
        external
        view
        returns (string memory);

    function getDependencyVersionCreator(bytes32 dependencyNameAndVersion, uint256 version)
        external
        view
        returns (address);

    function getDependencyVersionCreatedBlock(bytes32 dependencyNameAndVersion, uint256 version)
        external
        view
        returns (uint256);

    function getDependencyVersionCreatedTimestamp(bytes32 dependencyNameAndVersion, uint256 version)
        external
        view
        returns (uint256);

    function isDependencyVersionDeprecated(bytes32 dependencyNameAndVersion, uint256 version)
        external
        view
        returns (bool);

    function getDependencyScriptCount(bytes32 dependencyNameAndVersion)
        external
        view
        returns (uint256);

    function getDependencyScriptCountAtVersion(bytes32 dependencyNameAndVersion, uint256 version)
        external
        view
        returns (uint256);

    function getDependencyScript(bytes32 dependencyNameAndVersion, uint256 index)
        external
        view
        returns (string memory);

    function getDependencyScriptAtVersion(
        bytes32 dependencyNameAndVersion,
        uint256 version,
        uint256 index
    ) external view returns (string memory);

    function getDependencyScriptChunkHash(bytes32 dependencyNameAndVersion, uint256 index)
        external
        view
        returns (bytes32);

    function getDependencyScriptChunkHashAtVersion(
        bytes32 dependencyNameAndVersion,
        uint256 version,
        uint256 index
    ) external view returns (bytes32);

    function getDependencyScriptContentHash(bytes32 dependencyNameAndVersion)
        external
        view
        returns (bytes32);

    function getDependencyScriptContentHashAtVersion(
        bytes32 dependencyNameAndVersion,
        uint256 version
    ) external view returns (bytes32);
}
