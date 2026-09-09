// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Live authority seam used by the record-family registry for signer-owned lanes.
/// @dev Providers are class-specific and candidate-bound. They must derive authority from
///      live protocol state; a provider return is never cached by a metadata host.
interface IStreamRecordFamilyAuthorityProvider {
    /// @notice Returns true for deployment and configuration validation.
    function isStreamRecordFamilyAuthorityProvider() external view returns (bool);

    /// @notice Returns whether `actor` currently controls the named record write.
    /// @dev Direct calls need no detached signature: `actor == msg.sender` at the host.
    ///      Relayed typed-write surfaces can pass a nonempty `authorizationData` payload.
    function isAuthorizedRecordWriter(
        uint256 collectionId,
        bytes32 subjectId,
        bytes32 recordType,
        address actor,
        bytes calldata authorizationData
    ) external view returns (bool);
}
