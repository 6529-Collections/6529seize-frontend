// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/domains/artist/StreamArtistArchiveV2.sol";
import "../smart-contracts/interfaces/stream/IStreamArtistArchiveV2.sol";
import "../smart-contracts/vendor/openzeppelin/IERC165.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";

contract StreamArtistArchiveV2Writer {
    StreamArtistArchiveV2 public immutable archive;

    constructor(address artistRegistry) {
        archive = new StreamArtistArchiveV2(artistRegistry, address(this));
    }

    function append(bytes32 evidenceId, uint64 evidenceVersion, bytes calldata evidence)
        external
        returns (bytes32 contentHash, address pointer, bool appended)
    {
        return archive.appendArtistEvidenceV2(evidenceId, evidenceVersion, evidence);
    }
}

contract StreamArtistArchiveV2Test is CharacterizationTestBase {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    bytes32 private constant EVIDENCE_ID = keccak256("artist-evidence-stream");
    address private constant ARTIST_REGISTRY = address(0xA11CE);

    StreamArtistArchiveV2Writer private writer;
    StreamArtistArchiveV2 private archive;

    function setUp() public {
        writer = new StreamArtistArchiveV2Writer(ARTIST_REGISTRY);
        archive = writer.archive();
    }

    function testInterfaceAndImmutableBindingAreExact() public view {
        archive.artistRegistry().assertEq(ARTIST_REGISTRY, "registry binding");
        archive.operationCoordinator().assertEq(address(writer), "coordinator binding");
        uint256(archive.artistArchiveSchemaV2()).assertEq(2, "schema version");
        archive.artistArchiveMaxEvidenceBytesV2().assertEq(24_575, "payload bound");
        archive.artistArchiveMarkerV2()
            .assertEq(keccak256("6529STREAM_ARTIST_ARCHIVE_V2"), "marker");
        archive.supportsInterface(type(IStreamArtistArchiveV2).interfaceId)
            .assertTrue("archive interface");
        archive.supportsInterface(type(IERC165).interfaceId).assertTrue("ERC165 interface");
        archive.supportsInterface(0xffffffff).assertFalse("invalid ERC165 interface");

        bytes32 expectedBinding = keccak256(
            abi.encode(
                keccak256("6529STREAM_ARTIST_ARCHIVE_BINDING_V2"),
                block.chainid,
                ARTIST_REGISTRY,
                address(writer),
                type(IStreamArtistArchiveV2).interfaceId,
                keccak256("6529STREAM_ARTIST_ARCHIVE_V2"),
                uint16(2),
                uint256(24_575)
            )
        );
        archive.artistArchiveBindingHashV2().assertEq(expectedBinding, "binding hash");
    }

    function testInterfaceSelectorsAndIdAreFrozen() public pure {
        uint256(uint32(IStreamArtistArchiveV2.artistArchiveMarkerV2.selector))
            .assertEq(0x2cc37be8, "marker selector");
        uint256(uint32(IStreamArtistArchiveV2.artistArchiveSchemaV2.selector))
            .assertEq(0x31c8c693, "schema selector");
        uint256(uint32(IStreamArtistArchiveV2.artistArchiveMaxEvidenceBytesV2.selector))
            .assertEq(0x70da16df, "maximum selector");
        uint256(uint32(IStreamArtistArchiveV2.artistRegistry.selector))
            .assertEq(0x81703be7, "registry selector");
        uint256(uint32(IStreamArtistArchiveV2.operationCoordinator.selector))
            .assertEq(0x4c683143, "coordinator selector");
        uint256(uint32(IStreamArtistArchiveV2.artistArchiveBindingHashV2.selector))
            .assertEq(0x493df1f9, "binding selector");
        uint256(uint32(IStreamArtistArchiveV2.appendArtistEvidenceV2.selector))
            .assertEq(0xcb65ceb0, "append selector");
        uint256(uint32(IStreamArtistArchiveV2.artistEvidenceMetadataV2.selector))
            .assertEq(0xaa62d348, "metadata selector");
        uint256(uint32(IStreamArtistArchiveV2.artistEvidenceBytesV2.selector))
            .assertEq(0xa535232f, "bytes selector");
        uint256(uint32(type(IStreamArtistArchiveV2).interfaceId))
            .assertEq(0x2dc66e2e, "interface id");
    }

    function testConstructorRejectsZeroBindings() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtistArchiveV2.ArtistArchiveInvalidBinding.selector,
                address(0),
                address(this)
            )
        );
        new StreamArtistArchiveV2(address(0), address(this));

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtistArchiveV2.ArtistArchiveInvalidBinding.selector,
                ARTIST_REGISTRY,
                address(0)
            )
        );
        new StreamArtistArchiveV2(ARTIST_REGISTRY, address(0));
    }

    function testAppendStoresOnlyExactVersionedEvidenceAndEmitsEvidenceReceipt() public {
        bytes memory evidence = abi.encode("non-authoritative evidence", uint256(7));
        vm.roll(12_345);
        vm.recordLogs();
        (bytes32 contentHash, address pointer, bool appended) =
            writer.append(EVIDENCE_ID, 9, evidence);
        appended.assertTrue("first append");
        contentHash.assertEq(keccak256(evidence), "content hash");
        (pointer != address(0)).assertTrue("immutable pointer");

        Vm.Log[] memory logs = vm.getRecordedLogs();
        logs.length.assertEq(1, "one evidence event");
        logs[0].emitter.assertEq(address(archive), "event emitter");
        logs[0].topics.length.assertEq(4, "event topics");
        logs[0].topics[0].assertEq(
            keccak256("ArtistArchiveEvidenceAppendedV2(bytes32,uint64,bytes32,address,uint256)"),
            "event signature"
        );
        logs[0].topics[1].assertEq(EVIDENCE_ID, "event evidence id");
        logs[0].topics[2].assertEq(bytes32(uint256(9)), "event version");
        logs[0].topics[3].assertEq(contentHash, "event content hash");
        (address eventPointer, uint256 eventSize) = abi.decode(logs[0].data, (address, uint256));
        eventPointer.assertEq(pointer, "event pointer");
        eventSize.assertEq(evidence.length, "event size");

        (bytes32 storedHash, address storedPointer, uint32 storedSize, uint64 appendedAtBlock) =
            archive.artistEvidenceMetadataV2(EVIDENCE_ID, 9);
        storedHash.assertEq(contentHash, "metadata hash");
        storedPointer.assertEq(pointer, "metadata pointer");
        uint256(storedSize).assertEq(evidence.length, "metadata size");
        uint256(appendedAtBlock).assertEq(12_345, "append block");
        keccak256(archive.artistEvidenceBytesV2(EVIDENCE_ID, 9))
            .assertEq(contentHash, "exact evidence bytes");
    }

    function testExternallySelectedVersionsAllowGapsWithoutLatestState() public {
        bytes memory ninth = bytes("version nine");
        bytes memory first = bytes("version one");
        writer.append(EVIDENCE_ID, 9, ninth);
        writer.append(EVIDENCE_ID, 1, first);

        keccak256(archive.artistEvidenceBytesV2(EVIDENCE_ID, 9))
            .assertEq(keccak256(ninth), "version nine exact");
        keccak256(archive.artistEvidenceBytesV2(EVIDENCE_ID, 1))
            .assertEq(keccak256(first), "version one exact");
    }

    function testSameContentRetryIsIdempotentAndEmitsNoSecondReceipt() public {
        bytes memory evidence = bytes("retry-safe evidence");
        (bytes32 firstHash, address firstPointer, bool firstAppend) =
            writer.append(EVIDENCE_ID, 3, evidence);
        firstAppend.assertTrue("first append");

        vm.recordLogs();
        (bytes32 retryHash, address retryPointer, bool retryAppend) =
            writer.append(EVIDENCE_ID, 3, evidence);
        vm.getRecordedLogs().length.assertEq(0, "retry emits no event");
        retryAppend.assertFalse("retry is not append");
        retryHash.assertEq(firstHash, "retry hash");
        retryPointer.assertEq(firstPointer, "retry pointer");
    }

    function testConflictingExactVersionFailsWithoutReplacingEvidence() public {
        bytes memory original = bytes("original evidence");
        bytes memory conflict = bytes("conflicting evidence");
        (bytes32 storedHash, address pointer,) = writer.append(EVIDENCE_ID, 4, original);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtistArchiveV2.ArtistArchiveEvidenceConflict.selector,
                EVIDENCE_ID,
                uint64(4),
                storedHash,
                keccak256(conflict)
            )
        );
        writer.append(EVIDENCE_ID, 4, conflict);

        (bytes32 afterHash, address afterPointer,,) =
            archive.artistEvidenceMetadataV2(EVIDENCE_ID, 4);
        afterHash.assertEq(storedHash, "stored hash unchanged");
        afterPointer.assertEq(pointer, "stored pointer unchanged");
        keccak256(archive.artistEvidenceBytesV2(EVIDENCE_ID, 4))
            .assertEq(storedHash, "stored bytes unchanged");
    }

    function testOnlyImmutableCoordinatorCanAppend() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtistArchiveV2.ArtistArchiveUnauthorizedWriter.selector, address(this)
            )
        );
        archive.appendArtistEvidenceV2(EVIDENCE_ID, 1, bytes("unauthorized"));
    }

    function testInvalidKeysAndEmptyEvidenceFailClosed() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtistArchiveV2.ArtistArchiveInvalidEvidenceKey.selector,
                bytes32(0),
                uint64(1)
            )
        );
        writer.append(bytes32(0), 1, bytes("evidence"));

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtistArchiveV2.ArtistArchiveInvalidEvidenceKey.selector,
                EVIDENCE_ID,
                uint64(0)
            )
        );
        writer.append(EVIDENCE_ID, 0, bytes("evidence"));

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtistArchiveV2.ArtistArchiveEmptyEvidence.selector, EVIDENCE_ID, uint64(1)
            )
        );
        writer.append(EVIDENCE_ID, 1, bytes(""));
    }

    function testPayloadBoundAcceptsMaximumAndRejectsOneByteOver() public {
        bytes memory maximum = new bytes(24_575);
        maximum[0] = 0x01;
        maximum[24_574] = 0xff;
        writer.append(EVIDENCE_ID, 1, maximum);
        archive.artistEvidenceBytesV2(EVIDENCE_ID, 1).length
            .assertEq(maximum.length, "maximum payload");

        bytes memory oversized = new bytes(24_576);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtistArchiveV2.ArtistArchiveEvidenceTooLarge.selector,
                uint256(24_576),
                uint256(24_575)
            )
        );
        writer.append(EVIDENCE_ID, 2, oversized);
    }

    function testReceiptBlockNumberOverflowFailsClosed() public {
        vm.roll(uint256(type(uint64).max) + 1);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtistArchiveV2.ArtistArchiveBlockNumberOverflow.selector,
                uint256(type(uint64).max) + 1
            )
        );
        writer.append(EVIDENCE_ID, 1, bytes("evidence"));
    }

    function testUnknownExactEvidenceFailsClosed() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtistArchiveV2.ArtistArchiveEvidenceUnavailable.selector,
                EVIDENCE_ID,
                uint64(77)
            )
        );
        archive.artistEvidenceMetadataV2(EVIDENCE_ID, 77);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtistArchiveV2.ArtistArchiveEvidenceUnavailable.selector,
                EVIDENCE_ID,
                uint64(77)
            )
        );
        archive.artistEvidenceBytesV2(EVIDENCE_ID, 77);
    }

    function testCorruptedImmutablePayloadFailsClosed() public {
        bytes memory evidence = hex"01020304";
        (bytes32 contentHash, address pointer,) = writer.append(EVIDENCE_ID, 1, evidence);
        vm.etch(pointer, hex"0001020305");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamArtistArchiveV2.ArtistArchiveEvidenceCorrupted.selector,
                EVIDENCE_ID,
                uint64(1),
                contentHash,
                keccak256(hex"01020305")
            )
        );
        archive.artistEvidenceBytesV2(EVIDENCE_ID, 1);
    }

    function testDecisionAndUpgradeShapedSelectorsAreAbsent() public {
        bytes[6] memory forbiddenPayloads = [
            abi.encodeWithSelector(bytes4(keccak256("latestEvidence(bytes32)")), EVIDENCE_ID),
            abi.encodeWithSelector(bytes4(keccak256("currentState(bytes32)")), EVIDENCE_ID),
            abi.encodeWithSelector(bytes4(keccak256("authorize(bytes32)")), EVIDENCE_ID),
            abi.encodeWithSelector(bytes4(keccak256("consumeReplay(bytes32)")), EVIDENCE_ID),
            abi.encodeWithSelector(bytes4(keccak256("upgradeTo(address)")), address(this)),
            abi.encodeWithSelector(
                bytes4(keccak256("route(bytes4,bytes)")), bytes4(0x12345678), bytes("route payload")
            )
        ];
        for (uint256 i = 0; i < forbiddenPayloads.length; i++) {
            (bool ok,) = address(archive).call(forbiddenPayloads[i]);
            ok.assertFalse("forbidden selector absent");
        }
    }
}
