// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Narrow consumer seam over the artist registry's sanction surfaces ([AA-SANCTION]).
/// @dev The artist registry is built in a parallel worktree; this file pins only what finality
///      execution consumes. The registry also serves the ARTIST_SANCTION /
///      PLATFORM_WORKS_DECLARATION component reads (`finalityState`/`finalityStateForScope`,
///      [AA-SANCTION] requirements 3 and 7) through the generic component interface in
///      IStreamArtworkFinalityComponents.sol.
interface IStreamFinalitySanctionReads {
    /// @notice Which of the two mutually exclusive finality component types applies:
    ///         keccak256("ARTIST_SANCTION") for artist-bound collections,
    ///         keccak256("PLATFORM_WORKS_DECLARATION") for artist-less collections
    ///         ([AA-SANCTION] requirement 7: exactly one applies to every collection).
    function collectionSanctionComponentType(uint256 collectionId) external view returns (bytes32);

    /// @notice Permanent finality-facing sanction verification read ([AA-SANCTION]).
    /// @dev `sanctionSubjectHash` is the SANCTION_SUBJECT_DOMAIN preimage the finality
    ///      registry computes from the Core facts, the non-sanction component hash, and the
    ///      manifest reference; `sanctionRecordHash` doubles as the component `dataHash`.
    function verifySanctionForSubject(
        uint8 scopeType,
        uint256 collectionId,
        uint256 tokenId,
        bytes32 scopeId,
        bytes32 sanctionSubjectHash
    )
        external
        view
        returns (bool valid, bytes32 sanctionRecordHash, address signer, uint8 authorityClass);
}
