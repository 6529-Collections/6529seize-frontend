// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

interface IStreamCompatibility {
    /// @notice Returns true for deployed 6529Stream compatibility adapters.
    function isStreamCompatibility() external pure returns (bool);

    /// @notice Returns the canonical protocol family name for integration checks.
    function streamProtocolName() external pure returns (string memory);

    /// @notice Returns the protocol version used by release artifacts and docs.
    function streamProtocolVersion() external pure returns (string memory);

    /// @notice Returns the JSON metadata schema version emitted by tokenURI.
    function streamMetadataSchemaVersion() external pure returns (string memory);

    /// @notice Returns the release artifact tag expected for ABI and event decoding.
    function streamReleaseTag() external pure returns (string memory);

    /// @notice Returns keccak256(bytes(streamReleaseTag())) for compact comparisons.
    function streamReleaseHash() external pure returns (bytes32);

    /// @notice Returns whether this adapter or its core contract supports an interface.
    function supportsStreamInterface(bytes4 interfaceId) external view returns (bool);
}
