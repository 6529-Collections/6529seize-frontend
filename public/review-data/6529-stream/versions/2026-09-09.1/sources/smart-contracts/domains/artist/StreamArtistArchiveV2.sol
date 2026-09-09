// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../interfaces/stream/IStreamArtistArchiveV2.sol";
import "../../libraries/SSTORE2.sol";

/// @notice Append-only evidence archive for the proposed artist-authority successor.
/// @dev This contract owns no semantic record or decision. It never authenticates an artist,
///      consumes replay, answers current/latest state, calls a semantic owner, or exposes a
///      mutable binding. Exact evidence must be joined to authoritative owner state elsewhere.
contract StreamArtistArchiveV2 is IStreamArtistArchiveV2 {
    bytes32 private constant _MARKER = keccak256("6529STREAM_ARTIST_ARCHIVE_V2");
    bytes32 private constant _BINDING_DOMAIN = keccak256("6529STREAM_ARTIST_ARCHIVE_BINDING_V2");
    uint16 private constant _SCHEMA_VERSION = 2;

    struct EvidenceRecord {
        address pointer;
        uint32 payloadSize;
        uint64 appendedAtBlock;
        bytes32 contentHash;
    }

    address public immutable override artistRegistry;
    address public immutable override operationCoordinator;
    bytes32 public immutable override artistArchiveBindingHashV2;

    mapping(bytes32 evidenceId => mapping(uint64 evidenceVersion => EvidenceRecord)) private
        _evidence;

    constructor(address artistRegistry_, address operationCoordinator_) {
        if (artistRegistry_ == address(0) || operationCoordinator_ == address(0)) {
            revert ArtistArchiveInvalidBinding(artistRegistry_, operationCoordinator_);
        }
        artistRegistry = artistRegistry_;
        operationCoordinator = operationCoordinator_;
        artistArchiveBindingHashV2 = keccak256(
            abi.encode(
                _BINDING_DOMAIN,
                block.chainid,
                artistRegistry_,
                operationCoordinator_,
                type(IStreamArtistArchiveV2).interfaceId,
                _MARKER,
                _SCHEMA_VERSION,
                SSTORE2.MAX_DATA_LENGTH
            )
        );
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IStreamArtistArchiveV2).interfaceId
            || interfaceId == type(IERC165).interfaceId;
    }

    function artistArchiveMarkerV2() external pure returns (bytes32) {
        return _MARKER;
    }

    function artistArchiveSchemaV2() external pure returns (uint16) {
        return _SCHEMA_VERSION;
    }

    function artistArchiveMaxEvidenceBytesV2() external pure returns (uint256) {
        return SSTORE2.MAX_DATA_LENGTH;
    }

    function appendArtistEvidenceV2(
        bytes32 evidenceId,
        uint64 evidenceVersion,
        bytes calldata evidence
    ) external returns (bytes32 contentHash, address pointer, bool appended) {
        if (msg.sender != operationCoordinator) {
            revert ArtistArchiveUnauthorizedWriter(msg.sender);
        }
        _requireValidKey(evidenceId, evidenceVersion);
        uint256 payloadSize = evidence.length;
        if (payloadSize == 0) {
            revert ArtistArchiveEmptyEvidence(evidenceId, evidenceVersion);
        }
        if (payloadSize > SSTORE2.MAX_DATA_LENGTH) {
            revert ArtistArchiveEvidenceTooLarge(payloadSize, SSTORE2.MAX_DATA_LENGTH);
        }
        if (block.number > type(uint64).max) {
            revert ArtistArchiveBlockNumberOverflow(block.number);
        }

        contentHash = keccak256(evidence);
        EvidenceRecord storage record = _evidence[evidenceId][evidenceVersion];
        if (record.pointer != address(0)) {
            if (record.contentHash != contentHash || record.payloadSize != payloadSize) {
                revert ArtistArchiveEvidenceConflict(
                    evidenceId, evidenceVersion, record.contentHash, contentHash
                );
            }
            return (record.contentHash, record.pointer, false);
        }

        pointer = SSTORE2.write(evidence);
        record.pointer = pointer;
        // `payloadSize <= SSTORE2.MAX_DATA_LENGTH`, so this narrowing is exact.
        // forge-lint: disable-next-line(unsafe-typecast)
        record.payloadSize = uint32(payloadSize);
        // The explicit bound above makes the frozen uint64 receipt field exact.
        // forge-lint: disable-next-line(unsafe-typecast)
        record.appendedAtBlock = uint64(block.number);
        record.contentHash = contentHash;
        emit ArtistArchiveEvidenceAppendedV2(
            evidenceId, evidenceVersion, contentHash, pointer, payloadSize
        );
        return (contentHash, pointer, true);
    }

    function artistEvidenceMetadataV2(bytes32 evidenceId, uint64 evidenceVersion)
        external
        view
        returns (bytes32 contentHash, address pointer, uint32 payloadSize, uint64 appendedAtBlock)
    {
        _requireValidKey(evidenceId, evidenceVersion);
        EvidenceRecord storage record = _evidence[evidenceId][evidenceVersion];
        if (record.pointer == address(0)) {
            revert ArtistArchiveEvidenceUnavailable(evidenceId, evidenceVersion);
        }
        return (record.contentHash, record.pointer, record.payloadSize, record.appendedAtBlock);
    }

    function artistEvidenceBytesV2(bytes32 evidenceId, uint64 evidenceVersion)
        external
        view
        returns (bytes memory evidence)
    {
        _requireValidKey(evidenceId, evidenceVersion);
        EvidenceRecord storage record = _evidence[evidenceId][evidenceVersion];
        if (record.pointer == address(0)) {
            revert ArtistArchiveEvidenceUnavailable(evidenceId, evidenceVersion);
        }
        evidence = SSTORE2.read(record.pointer);
        bytes32 observedHash = keccak256(evidence);
        if (evidence.length != record.payloadSize || observedHash != record.contentHash) {
            revert ArtistArchiveEvidenceCorrupted(
                evidenceId, evidenceVersion, record.contentHash, observedHash
            );
        }
    }

    function _requireValidKey(bytes32 evidenceId, uint64 evidenceVersion) private pure {
        if (evidenceId == bytes32(0) || evidenceVersion == 0) {
            revert ArtistArchiveInvalidEvidenceKey(evidenceId, evidenceVersion);
        }
    }
}
