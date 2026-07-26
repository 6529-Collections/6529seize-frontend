// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IStreamPreservationRecords.sol";
import "../smart-contracts/IERC165.sol";
import "../smart-contracts/StreamAdmins.sol";
import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/StreamMetadataRenderer.sol";
import "../smart-contracts/StreamPreservationRecords.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";

contract StreamPreservationRecordsTest is CharacterizationTestBase, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for string;
    using Assertions for uint256;

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant TOKEN_ID = 1;
    address private constant FUNCTION_ADMIN = address(0xA11CE);
    address private constant RECIPIENT = address(0xDAD);
    bytes32 private constant RECORD_TYPE = keccak256("PREMIS_EVENT");
    bytes32 private constant SUBJECT_ID = keccak256("collection:1");
    bytes32 private constant SCHEMA_ID = keccak256("premis.v3.json");
    bytes32 private constant CANONICALIZATION_ID = keccak256("RFC8785_JCS");

    function testModuleMarkersInterfacesAndAdminState() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamPreservationRecords records = new StreamPreservationRecords(
            address(deployed.core), address(deployed.admins), address(0)
        );

        records.streamCore().assertEq(address(deployed.core), "core not retained");
        records.adminsContract().assertEq(address(deployed.admins), "admins not retained");
        records.isStreamPreservationRecords().assertTrue("records marker");
        (records.streamModuleFamily() != bytes32(0)).assertTrue("module family missing");
        (records.streamModuleVersion() != bytes32(0)).assertTrue("module version missing");
        (records.streamModuleSchemaHash() != bytes32(0)).assertTrue("module schema missing");
        records.streamModuleSupersedes().assertEq(address(0), "unexpected predecessor");
        records.supportsInterface(type(IStreamPreservationRecords).interfaceId)
            .assertTrue("missing preservation interface");
        records.supportsInterface(type(IERC165).interfaceId).assertTrue("missing ERC165");
        records.supportsInterface(0xffffffff).assertFalse("invalid interface supported");
    }

    function testRecordsGenericPremisC2paAndFixityRecordWithLatestSummaryAndEvent() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamPreservationRecords records = new StreamPreservationRecords(
            address(deployed.core), address(deployed.admins), address(0)
        );
        IStreamPreservationRecords.CollectionRecord memory record = _record();
        bytes32 expectedHash = records.deriveCollectionRecordHash(COLLECTION_ID, record);

        vm.recordLogs();
        bytes32 recordHash = records.recordCollectionRecord(COLLECTION_ID, record);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        recordHash.assertEq(expectedHash, "record hash");
        records.latestCollectionRecordHash(COLLECTION_ID, RECORD_TYPE, SUBJECT_ID)
            .assertEq(recordHash, "latest hash");
        IStreamPreservationRecords.CollectionRecordSummary memory summary =
            records.collectionRecordSummary(recordHash);
        summary.recordType.assertEq(RECORD_TYPE, "summary type");
        summary.subjectId.assertEq(SUBJECT_ID, "summary subject");
        summary.uri.assertEq(record.uri, "summary uri");
        summary.contentHashDigestHash
            .assertEq(keccak256(record.contentHash.digest), "content digest hash");
        summary.recorder.assertEq(address(this), "recorder");
        IStreamPreservationRecords.CollectionRecord memory stored =
            records.collectionRecord(recordHash);
        uint256(stored.contentHash.algorithm)
            .assertEq(uint256(record.contentHash.algorithm), "stored content algorithm");
        keccak256(stored.contentHash.digest)
            .assertEq(keccak256(record.contentHash.digest), "stored content digest");
        stored.uri.assertEq(record.uri, "stored uri");

        logs.length.assertEq(1, "record log count");
        logs[0].emitter.assertEq(address(records), "record log emitter");
        logs[0].topics.length.assertEq(4, "record log topic count");
        logs[0].topics[0].assertEq(
            keccak256(
                "CollectionRecordRecorded(uint256,bytes32,bytes32,(bytes32,bytes32,(uint16,bytes,bytes32),string,bytes32,bytes32,(uint16,bytes,bytes32),uint64),bytes32,address)"
            ),
            "record event signature"
        );
        logs[0].topics[1].assertEq(bytes32(COLLECTION_ID), "event collection topic");
        logs[0].topics[2].assertEq(RECORD_TYPE, "event record type topic");
        logs[0].topics[3].assertEq(SUBJECT_ID, "event subject topic");
        (IStreamPreservationRecords.CollectionRecord memory eventRecord, bytes32 eventHash,) = abi.decode(
            logs[0].data, (IStreamPreservationRecords.CollectionRecord, bytes32, address)
        );
        eventHash.assertEq(recordHash, "event hash");
        eventRecord.uri.assertEq(record.uri, "event uri");
        eventRecord.schemaId.assertEq(record.schemaId, "event schema");
    }

    function testFunctionAdminPauseUnauthorizedAndMissingCollectionPaths() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamPreservationRecords records = new StreamPreservationRecords(
            address(deployed.core), address(deployed.admins), address(0)
        );
        deployed.admins
            .registerFunctionAdmin(
                FUNCTION_ADMIN, address(records), records.recordCollectionRecord.selector, true
            );

        vm.prank(FUNCTION_ADMIN);
        records.recordCollectionRecord(COLLECTION_ID, _record());

        vm.prank(address(0xBAD));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPreservationRecords.FunctionAdminUnauthorized.selector,
                address(0xBAD),
                records.recordCollectionRecord.selector
            )
        );
        records.recordCollectionRecord(COLLECTION_ID, _recordWithSubject(keccak256("other")));

        vm.expectRevert(
            abi.encodeWithSelector(IStreamPreservationRecords.CollectionDoesNotExist.selector, 999)
        );
        records.recordCollectionRecord(999, _recordWithSubject(keccak256("missing")));

        deployed.admins
            .setPaused(deployed.admins.PAUSE_DOMAIN_METADATA_MUTATION(), true, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(IStreamPreservationRecords.MetadataMutationPaused.selector)
        );
        records.recordCollectionRecord(COLLECTION_ID, _recordWithSubject(keccak256("paused")));
    }

    function testUpdateAdminContractRequiresCurrentAdminValidMarkerAndUnpaused() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamPreservationRecords records = new StreamPreservationRecords(
            address(deployed.core), address(deployed.admins), address(0)
        );
        StreamAdmins replacementAdmins = new StreamAdmins(address(this));
        PreservationEmptyMarker emptyMarker = new PreservationEmptyMarker();

        vm.prank(address(0xBAD));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPreservationRecords.FunctionAdminUnauthorized.selector,
                address(0xBAD),
                records.updateAdminContract.selector
            )
        );
        records.updateAdminContract(address(replacementAdmins));

        vm.expectRevert(
            abi.encodeWithSelector(IStreamPreservationRecords.InvalidAdminContract.selector)
        );
        records.updateAdminContract(address(emptyMarker));

        deployed.admins
            .setPaused(deployed.admins.PAUSE_DOMAIN_METADATA_MUTATION(), true, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(IStreamPreservationRecords.MetadataMutationPaused.selector)
        );
        records.updateAdminContract(address(replacementAdmins));
        deployed.admins
            .setPaused(deployed.admins.PAUSE_DOMAIN_METADATA_MUTATION(), false, bytes32(0));

        records.updateAdminContract(address(replacementAdmins));
        records.adminsContract().assertEq(address(replacementAdmins), "admins not updated");
    }

    function testHashUriDuplicateAndSignatureValidation() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamPreservationRecords records = new StreamPreservationRecords(
            address(deployed.core), address(deployed.admins), address(0)
        );

        IStreamPreservationRecords.CollectionRecord memory badDigest = _record();
        badDigest.contentHash.digest = hex"1234";
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPreservationRecords.InvalidHashRef.selector,
                records.HASH_SHA256(),
                uint256(2)
            )
        );
        records.recordCollectionRecord(COLLECTION_ID, badDigest);

        IStreamPreservationRecords.CollectionRecord memory badKeccak = _record();
        badKeccak.contentHash = _hashRef(records.HASH_KECCAK256(), hex"1234");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPreservationRecords.InvalidHashRef.selector,
                records.HASH_KECCAK256(),
                uint256(2)
            )
        );
        records.recordCollectionRecord(COLLECTION_ID, badKeccak);

        IStreamPreservationRecords.CollectionRecord memory badBlake3 = _record();
        badBlake3.contentHash = _hashRef(records.HASH_BLAKE3(), hex"1234");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPreservationRecords.InvalidHashRef.selector,
                records.HASH_BLAKE3(),
                uint256(2)
            )
        );
        records.recordCollectionRecord(COLLECTION_ID, badBlake3);

        IStreamPreservationRecords.CollectionRecord memory badArweave = _record();
        badArweave.contentHash = _hashRef(records.HASH_ARWEAVE_TX(), hex"1234");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPreservationRecords.InvalidHashRef.selector,
                records.HASH_ARWEAVE_TX(),
                uint256(2)
            )
        );
        records.recordCollectionRecord(COLLECTION_ID, badArweave);

        IStreamPreservationRecords.CollectionRecord memory badCanonicalization = _record();
        badCanonicalization.contentHash.canonicalizationId = bytes32(0);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPreservationRecords.InvalidHashRef.selector,
                records.HASH_SHA256(),
                uint256(32)
            )
        );
        records.recordCollectionRecord(COLLECTION_ID, badCanonicalization);

        IStreamPreservationRecords.CollectionRecord memory badSignature = _record();
        badSignature.signatureHash = _hashRef(records.HASH_SHA256(), _digest("signature"));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPreservationRecords.InvalidHashRef.selector,
                records.HASH_SHA256(),
                uint256(32)
            )
        );
        records.recordCollectionRecord(COLLECTION_ID, badSignature);

        IStreamPreservationRecords.CollectionRecord memory badUri = _record();
        badUri.uri = "data:application/json;base64,e30=";
        vm.expectRevert(abi.encodeWithSelector(StreamMetadataRenderer.UnsafeMetadataURI.selector));
        records.recordCollectionRecord(COLLECTION_ID, badUri);

        IStreamPreservationRecords.CollectionRecord memory badEffectiveAt = _record();
        badEffectiveAt.effectiveAt = 0;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPreservationRecords.InvalidCollectionRecord.selector,
                RECORD_TYPE,
                SUBJECT_ID,
                SCHEMA_ID
            )
        );
        records.recordCollectionRecord(COLLECTION_ID, badEffectiveAt);

        IStreamPreservationRecords.CollectionRecord memory exactUri =
            _recordWithSubject(keccak256("exact-uri"));
        exactUri.uri = _contentUri(records.MAX_URI_BYTES());
        records.recordCollectionRecord(COLLECTION_ID, exactUri);

        IStreamPreservationRecords.CollectionRecord memory tooLargeUri =
            _recordWithSubject(keccak256("too-large-uri"));
        tooLargeUri.uri = _contentUri(records.MAX_URI_BYTES() + 1);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPreservationRecords.PreservationURITooLarge.selector,
                records.MAX_URI_BYTES() + 1,
                records.MAX_URI_BYTES()
            )
        );
        records.recordCollectionRecord(COLLECTION_ID, tooLargeUri);

        IStreamPreservationRecords.CollectionRecord memory record = _record();
        bytes32 recordHash = records.recordCollectionRecord(COLLECTION_ID, record);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPreservationRecords.CollectionRecordAlreadyExists.selector, recordHash
            )
        );
        records.recordCollectionRecord(COLLECTION_ID, record);
    }

    function testSignatureCommitmentAndLatestRecordedSemantics() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamPreservationRecords records = new StreamPreservationRecords(
            address(deployed.core), address(deployed.admins), address(0)
        );
        IStreamPreservationRecords.CollectionRecord memory signedRecord = _record();
        signedRecord.signatureScheme = keccak256("C2PA_MANIFEST_SIGNATURE");
        signedRecord.signatureHash = _hashRef(records.HASH_SHA256(), _digest("signature"));

        bytes32 firstHash = records.recordCollectionRecord(COLLECTION_ID, signedRecord);
        IStreamPreservationRecords.CollectionRecord memory stored =
            records.collectionRecord(firstHash);
        stored.signatureScheme.assertEq(signedRecord.signatureScheme, "signature scheme");
        uint256(stored.signatureHash.algorithm)
            .assertEq(uint256(records.HASH_SHA256()), "signature hash algorithm");
        keccak256(stored.signatureHash.digest)
            .assertEq(keccak256(signedRecord.signatureHash.digest), "signature digest");

        IStreamPreservationRecords.CollectionRecord memory backfilled = _record();
        backfilled.uri = "ipfs://premis-backfill";
        backfilled.contentHash = _hashRef(records.HASH_SHA256(), _digest("backfill"));
        backfilled.effectiveAt = signedRecord.effectiveAt - 1;
        bytes32 secondHash = records.recordCollectionRecord(COLLECTION_ID, backfilled);

        records.latestCollectionRecordHash(COLLECTION_ID, RECORD_TYPE, SUBJECT_ID)
            .assertEq(secondHash, "latest should be latest recorded");
        uint256(records.collectionRecordSummary(secondHash).effectiveAt)
            .assertEq(uint256(backfilled.effectiveAt), "backfill effectiveAt");
    }

    function testVariableLengthHashRefsAreOpaqueButBounded() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamPreservationRecords records = new StreamPreservationRecords(
            address(deployed.core), address(deployed.admins), address(0)
        );

        IStreamPreservationRecords.CollectionRecord memory maxMultihash =
            _recordWithSubject(keccak256("max-multihash"));
        maxMultihash.contentHash = IStreamPreservationRecords.HashRef({
            algorithm: records.HASH_MULTIHASH(),
            digest: new bytes(records.MAX_DIGEST_BYTES()),
            canonicalizationId: CANONICALIZATION_ID
        });
        bytes32 recordHash = records.recordCollectionRecord(COLLECTION_ID, maxMultihash);
        (recordHash != bytes32(0)).assertTrue("max multihash rejected");

        IStreamPreservationRecords.CollectionRecord memory emptyMultihash =
            _recordWithSubject(keccak256("empty-multihash"));
        emptyMultihash.contentHash = IStreamPreservationRecords.HashRef({
            algorithm: records.HASH_MULTIHASH(),
            digest: new bytes(0),
            canonicalizationId: CANONICALIZATION_ID
        });
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPreservationRecords.InvalidHashRef.selector,
                records.HASH_MULTIHASH(),
                uint256(0)
            )
        );
        records.recordCollectionRecord(COLLECTION_ID, emptyMultihash);

        IStreamPreservationRecords.CollectionRecord memory tooLarge =
            _recordWithSubject(keccak256("large-multihash"));
        tooLarge.contentHash = IStreamPreservationRecords.HashRef({
            algorithm: records.HASH_IPFS_CID(),
            digest: new bytes(records.MAX_DIGEST_BYTES() + 1),
            canonicalizationId: CANONICALIZATION_ID
        });
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPreservationRecords.InvalidHashRef.selector,
                records.HASH_IPFS_CID(),
                records.MAX_DIGEST_BYTES() + 1
            )
        );
        records.recordCollectionRecord(COLLECTION_ID, tooLarge);

        IStreamPreservationRecords.CollectionRecord memory unknown =
            _recordWithSubject(keccak256("unknown-algorithm"));
        unknown.contentHash = IStreamPreservationRecords.HashRef({
            algorithm: 999, digest: _digest("unknown"), canonicalizationId: CANONICALIZATION_ID
        });
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPreservationRecords.InvalidHashRef.selector, uint16(999), uint256(32)
            )
        );
        records.recordCollectionRecord(COLLECTION_ID, unknown);
    }

    function testAcceptsCreatedCollectionBeforeCoreSupplyData() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamPreservationRecords records = new StreamPreservationRecords(
            address(deployed.core), address(deployed.admins), address(0)
        );
        uint256 preservationFirstCollectionId = _createCollectionWithoutData(deployed);

        bytes32 recordHash =
            records.recordCollectionRecord(preservationFirstCollectionId, _record());

        records.latestCollectionRecordHash(preservationFirstCollectionId, RECORD_TYPE, SUBJECT_ID)
            .assertEq(recordHash, "created collection record missing");
    }

    function testConstructorRejectsInvalidCoreAndAdminContracts() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        PreservationEmptyMarker emptyMarker = new PreservationEmptyMarker();

        vm.expectRevert(
            abi.encodeWithSelector(IStreamPreservationRecords.InvalidCoreContract.selector)
        );
        new StreamPreservationRecords(address(0x1234), address(deployed.admins), address(0));

        vm.expectRevert(
            abi.encodeWithSelector(IStreamPreservationRecords.InvalidAdminContract.selector)
        );
        new StreamPreservationRecords(address(deployed.core), address(emptyMarker), address(0));
    }

    function testPreservationRecordsRemainAppendOnlyAfterCoreFreeze() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamPreservationRecords records = new StreamPreservationRecords(
            address(deployed.core), address(deployed.admins), address(0)
        );
        _freezeCollection(deployed);

        bytes32 recordHash = records.recordCollectionRecord(COLLECTION_ID, _record());
        (recordHash != bytes32(0)).assertTrue("post-freeze preservation missing");
    }

    function _record()
        private
        pure
        returns (IStreamPreservationRecords.CollectionRecord memory record)
    {
        return _recordWithSubject(SUBJECT_ID);
    }

    function _recordWithSubject(bytes32 subjectId)
        private
        pure
        returns (IStreamPreservationRecords.CollectionRecord memory record)
    {
        record = IStreamPreservationRecords.CollectionRecord({
            recordType: RECORD_TYPE,
            subjectId: subjectId,
            contentHash: _hashRef(2, _digest("premis payload")),
            uri: "ipfs://premis-event",
            schemaId: SCHEMA_ID,
            signatureScheme: bytes32(0),
            signatureHash: IStreamPreservationRecords.HashRef({
                algorithm: 0, digest: new bytes(0), canonicalizationId: bytes32(0)
            }),
            effectiveAt: 1_782_345_600
        });
    }

    function _contentUri(uint256 length) private pure returns (string memory) {
        bytes memory prefix = bytes("ipfs://");
        bytes memory uri = new bytes(length);
        for (uint256 i = 0; i < prefix.length; i++) {
            uri[i] = prefix[i];
        }
        for (uint256 i = prefix.length; i < length; i++) {
            uri[i] = 0x61;
        }
        return string(uri);
    }

    function _hashRef(uint16 algorithm, bytes memory digest)
        private
        pure
        returns (IStreamPreservationRecords.HashRef memory ref)
    {
        ref = IStreamPreservationRecords.HashRef({
            algorithm: algorithm, digest: digest, canonicalizationId: CANONICALIZATION_ID
        });
    }

    function _digest(string memory value) private pure returns (bytes memory digest) {
        digest = abi.encodePacked(keccak256(bytes(value)));
    }

    function _freezeCollection(DeployedStream memory deployed) private {
        vm.prank(address(deployed.minter));
        deployed.core.mint(TOKEN_ID, RECIPIENT, "1,2,3", 7, COLLECTION_ID);
        vm.warp(block.timestamp + 31 days + 1);
        deployed.core.freezeCollection(COLLECTION_ID);
    }

    function _createCollectionWithoutData(DeployedStream memory deployed)
        private
        returns (uint256 collectionId)
    {
        collectionId = deployed.core.newCollectionIndex();
        string[] memory scripts = new string[](1);
        scripts[0] = "function draw(){return 'pre-supply';}";
        deployed.core
            .createCollection(
                "Pre Supply",
                "6529",
                "Metadata before supply data",
                "https://6529.io",
                "CC0",
                "ipfs://pre-supply/",
                "https://cdn.example/pre-supply.js",
                bytes32(0),
                scripts
            );
    }
}

contract PreservationEmptyMarker { }
