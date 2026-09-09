// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../vendor/openzeppelin/IERC165.sol";

/// @notice Append-only, versioned evidence storage for the artist-authority successor.
/// @dev Archive evidence is never authorization, replay protection, current state, or latest
///      state. Consumers must request an exact evidence id and version and independently bind
///      that evidence to the authoritative owner state and composite manifest.
interface IStreamArtistArchiveV2 is IERC165 {
    /// @notice The immutable Registry or Coordinator binding is zero.
    error ArtistArchiveInvalidBinding(address artistRegistry, address operationCoordinator);

    /// @notice A caller other than the immutable Coordinator attempted to append evidence.
    /// @dev This is a transport-integrity gate only and is not semantic authorization.
    error ArtistArchiveUnauthorizedWriter(address caller);

    /// @notice The exact evidence key uses a zero id or zero version.
    error ArtistArchiveInvalidEvidenceKey(bytes32 evidenceId, uint64 evidenceVersion);

    /// @notice Evidence bytes must not be empty.
    error ArtistArchiveEmptyEvidence(bytes32 evidenceId, uint64 evidenceVersion);

    /// @notice Evidence bytes exceed the immutable archive payload bound.
    error ArtistArchiveEvidenceTooLarge(uint256 observedBytes, uint256 maximumBytes);

    /// @notice The append block cannot be represented by the frozen receipt schema.
    error ArtistArchiveBlockNumberOverflow(uint256 blockNumber);

    /// @notice Different evidence bytes already occupy the exact id/version key.
    error ArtistArchiveEvidenceConflict(
        bytes32 evidenceId,
        uint64 evidenceVersion,
        bytes32 storedContentHash,
        bytes32 suppliedContentHash
    );

    /// @notice No evidence has been appended at the exact id/version key.
    error ArtistArchiveEvidenceUnavailable(bytes32 evidenceId, uint64 evidenceVersion);

    /// @notice The immutable payload bytes no longer match their append receipt.
    error ArtistArchiveEvidenceCorrupted(
        bytes32 evidenceId, uint64 evidenceVersion, bytes32 expectedHash, bytes32 observedHash
    );

    /// @notice Evidence-only receipt for the first append at an exact id/version key.
    /// @dev This event is non-normative and cannot substitute for an owner-domain event.
    event ArtistArchiveEvidenceAppendedV2(
        bytes32 indexed evidenceId,
        uint64 indexed evidenceVersion,
        bytes32 indexed contentHash,
        address pointer,
        uint256 payloadSize
    );

    function artistArchiveMarkerV2() external pure returns (bytes32);

    function artistArchiveSchemaV2() external pure returns (uint16);

    function artistArchiveMaxEvidenceBytesV2() external pure returns (uint256);

    function artistRegistry() external view returns (address);

    function operationCoordinator() external view returns (address);

    function artistArchiveBindingHashV2() external view returns (bytes32);

    /// @notice Appends immutable bytes at one caller-selected exact version.
    /// @dev A same-content retry returns the original receipt with `appended == false`. This
    ///      idempotency is evidence-write behavior only; it is not semantic replay protection.
    function appendArtistEvidenceV2(
        bytes32 evidenceId,
        uint64 evidenceVersion,
        bytes calldata evidence
    ) external returns (bytes32 contentHash, address pointer, bool appended);

    /// @notice Reads metadata for one exact evidence id/version.
    /// @dev No enumeration, count, tip, current, or latest surface is exposed.
    function artistEvidenceMetadataV2(bytes32 evidenceId, uint64 evidenceVersion)
        external
        view
        returns (bytes32 contentHash, address pointer, uint32 payloadSize, uint64 appendedAtBlock);

    /// @notice Reads immutable bytes for one exact evidence id/version.
    function artistEvidenceBytesV2(bytes32 evidenceId, uint64 evidenceVersion)
        external
        view
        returns (bytes memory evidence);
}
