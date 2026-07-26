// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IERC165.sol";
import "../smart-contracts/IStreamCollectionMetadata.sol";
import "../smart-contracts/StreamCollectionMetadata.sol";
import "../smart-contracts/StreamAdmins.sol";
import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/StreamMetadataRenderer.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";

contract StreamCollectionMetadataTest is CharacterizationTestBase, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for string;
    using Assertions for uint256;

    event CollectionMetadataAdminContractUpdated(
        address indexed oldAdminContract, address indexed newAdminContract, address indexed admin
    );

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant TOKEN_ID = 1;
    address private constant FUNCTION_ADMIN = address(0xA11CE);
    address private constant RECIPIENT = address(0xDAD);
    bytes32 private constant RECORD_IDENTITY = keccak256("metadata.identity");
    bytes32 private constant RECORD_RIGHTS = keccak256("metadata.rights");
    bytes32 private constant RECORD_IIIF_VIEW = keccak256("metadata.iiif.view");
    bytes32 private constant RECORD_C2PA = keccak256("metadata.c2pa.reference");
    bytes32 private constant RECORD_CUSTOM_GATE = keccak256("metadata.custom.gate");
    bytes32 private constant LOCK_METADATA_ALL = keccak256("METADATA_ALL");
    bytes32 private constant LOCK_SNAPSHOTS = keccak256("SNAPSHOTS");
    bytes32 private constant SCHEMA_ID = keccak256("6529stream.collection.schema.v1");
    bytes32 private constant SNAPSHOT_ID = keccak256("snapshot.2026-06-25");
    bytes32 private constant SNAPSHOT_ID_2 = keccak256("snapshot.2026-06-26");

    function testModuleMarkersInterfacesAndAdminState() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamCollectionMetadata metadata = new StreamCollectionMetadata(
            address(deployed.core), address(deployed.admins), address(0)
        );

        metadata.streamCore().assertEq(address(deployed.core), "core not retained");
        metadata.adminsContract().assertEq(address(deployed.admins), "admins not retained");
        metadata.isStreamCollectionMetadata().assertTrue("metadata marker");
        (metadata.streamModuleFamily() != bytes32(0)).assertTrue("module family missing");
        (metadata.streamModuleVersion() != bytes32(0)).assertTrue("module version missing");
        (metadata.streamModuleSchemaHash() != bytes32(0)).assertTrue("module schema missing");
        metadata.streamModuleSupersedes().assertEq(address(0), "unexpected predecessor");
        metadata.supportsInterface(type(IStreamCollectionMetadata).interfaceId)
            .assertTrue("missing metadata interface");
        metadata.supportsInterface(type(IERC165).interfaceId).assertTrue("missing ERC165");
        metadata.supportsInterface(0xffffffff).assertFalse("invalid interface supported");
    }

    function testStoresTypedMuseumRecordsSnapshotsAndLatestHashes() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamCollectionMetadata metadata = new StreamCollectionMetadata(
            address(deployed.core), address(deployed.admins), address(0)
        );

        bytes32 identityHash = metadata.setCollectionRecord(
            COLLECTION_ID, _record(RECORD_IDENTITY, "ipfs://identity")
        );
        bytes32 rightsHash =
            metadata.setCollectionRecord(COLLECTION_ID, _record(RECORD_RIGHTS, "ipfs://rights"));
        metadata.setCollectionRecord(COLLECTION_ID, _record(RECORD_IIIF_VIEW, "ipfs://iiif"));
        metadata.setCollectionRecord(COLLECTION_ID, _record(RECORD_C2PA, "ipfs://c2pa"));
        metadata.setCollectionRecord(COLLECTION_ID, _record(RECORD_CUSTOM_GATE, "ipfs://gate"));

        IStreamCollectionMetadata.CollectionMetadataRecordView memory identity =
            metadata.collectionRecord(COLLECTION_ID, RECORD_IDENTITY);
        identity.recordHash.assertEq(identityHash, "identity hash");
        identity.uri.assertEq("ipfs://identity", "identity uri");
        uint256(identity.revision).assertEq(1, "identity revision");
        identity.writer.assertEq(address(this), "identity writer");
        metadata.latestCollectionRecordHash(COLLECTION_ID, RECORD_RIGHTS)
            .assertEq(rightsHash, "rights latest hash");
        metadata.deriveCollectionRecordHash(
                COLLECTION_ID, _record(RECORD_IDENTITY, "ipfs://identity"), 1
            ).assertEq(identityHash, "derived identity hash");
        metadata.collectionRecordTypeCount(COLLECTION_ID).assertEq(5, "record type count");
        metadata.collectionRecordTypeAt(COLLECTION_ID, 2).assertEq(RECORD_IIIF_VIEW, "iiif type");

        IStreamCollectionMetadata.CollectionMetadataRecord memory snapshot =
            _record(keccak256("metadata.snapshot"), "ar://snapshot");
        bytes32 snapshotHash =
            metadata.publishCollectionSnapshot(COLLECTION_ID, SNAPSHOT_ID, snapshot);
        bytes32 secondSnapshotHash =
            metadata.publishCollectionSnapshot(COLLECTION_ID, SNAPSHOT_ID_2, snapshot);
        (snapshotHash != secondSnapshotHash).assertTrue("snapshot id not hashed");
        metadata.snapshotHash(COLLECTION_ID, SNAPSHOT_ID).assertEq(snapshotHash, "snapshot hash");
        metadata.collectionSnapshot(COLLECTION_ID, SNAPSHOT_ID).locked.assertTrue("snapshot lock");
        metadata.latestCollectionSnapshotId(COLLECTION_ID)
            .assertEq(SNAPSHOT_ID_2, "latest snapshot id");
        metadata.latestCollectionSnapshotHash(COLLECTION_ID)
            .assertEq(secondSnapshotHash, "latest snapshot hash");
    }

    function testFunctionAdminPauseAndUnauthorizedPaths() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamCollectionMetadata metadata = new StreamCollectionMetadata(
            address(deployed.core), address(deployed.admins), address(0)
        );
        deployed.admins
            .registerFunctionAdmin(
                FUNCTION_ADMIN, address(metadata), metadata.setCollectionRecord.selector, true
            );

        vm.prank(FUNCTION_ADMIN);
        metadata.setCollectionRecord(COLLECTION_ID, _record(RECORD_IDENTITY, "ipfs://identity"));

        vm.prank(address(0xBAD));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.FunctionAdminUnauthorized.selector,
                address(0xBAD),
                metadata.setCollectionRecord.selector
            )
        );
        metadata.setCollectionRecord(COLLECTION_ID, _record(RECORD_RIGHTS, "ipfs://rights"));

        deployed.admins
            .setPaused(deployed.admins.PAUSE_DOMAIN_METADATA_MUTATION(), true, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(IStreamCollectionMetadata.MetadataMutationPaused.selector)
        );
        metadata.setCollectionRecord(COLLECTION_ID, _record(RECORD_RIGHTS, "ipfs://rights"));
    }

    function testLocksRevisionChecksMissingCollectionAndFreezeBlockRenderMetadata() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamCollectionMetadata metadata = new StreamCollectionMetadata(
            address(deployed.core), address(deployed.admins), address(0)
        );

        vm.expectRevert(
            abi.encodeWithSelector(IStreamCollectionMetadata.CollectionDoesNotExist.selector, 999)
        );
        metadata.setCollectionRecord(999, _record(RECORD_IDENTITY, "ipfs://identity"));

        metadata.setCollectionRecordWithRevision(
            COLLECTION_ID, _record(RECORD_IDENTITY, "ipfs://identity"), 0
        );
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.MetadataRevisionMismatch.selector, RECORD_IDENTITY, 0, 1
            )
        );
        metadata.setCollectionRecordWithRevision(
            COLLECTION_ID, _record(RECORD_IDENTITY, "ipfs://identity-v2"), 0
        );
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.MetadataRevisionMismatch.selector, RECORD_IDENTITY, 0, 1
            )
        );
        metadata.setCollectionRecord(COLLECTION_ID, _record(RECORD_IDENTITY, "ipfs://identity-v2"));
        metadata.setCollectionRecordWithRevision(
            COLLECTION_ID, _record(RECORD_IDENTITY, "ipfs://identity-v2"), 1
        );

        metadata.lockCollectionRecord(COLLECTION_ID, RECORD_IDENTITY);
        metadata.isLocked(COLLECTION_ID, RECORD_IDENTITY).assertTrue("not locked");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.CollectionMetadataLocked.selector,
                COLLECTION_ID,
                RECORD_IDENTITY
            )
        );
        metadata.setCollectionRecord(COLLECTION_ID, _record(RECORD_IDENTITY, "ipfs://identity-v3"));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.CollectionMetadataLocked.selector,
                COLLECTION_ID,
                RECORD_IDENTITY
            )
        );
        metadata.lockCollectionRecord(COLLECTION_ID, RECORD_IDENTITY);

        _freezeCollection(deployed);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.CollectionMetadataFrozen.selector, COLLECTION_ID
            )
        );
        metadata.setCollectionRecord(COLLECTION_ID, _record(RECORD_RIGHTS, "ipfs://rights"));
    }

    function testUpdateAdminContractRequiresCurrentAdminValidMarkerAndUnpaused() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamCollectionMetadata metadata = new StreamCollectionMetadata(
            address(deployed.core), address(deployed.admins), address(0)
        );
        StreamAdmins replacementAdmins = new StreamAdmins(address(this));
        CollectionMetadataEmptyMarker emptyMarker = new CollectionMetadataEmptyMarker();

        vm.prank(address(0xBAD));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.FunctionAdminUnauthorized.selector,
                address(0xBAD),
                metadata.updateAdminContract.selector
            )
        );
        metadata.updateAdminContract(address(replacementAdmins));

        vm.expectRevert(
            abi.encodeWithSelector(IStreamCollectionMetadata.InvalidAdminContract.selector)
        );
        metadata.updateAdminContract(address(emptyMarker));

        deployed.admins
            .setPaused(deployed.admins.PAUSE_DOMAIN_METADATA_MUTATION(), true, bytes32(0));
        vm.expectRevert(
            abi.encodeWithSelector(IStreamCollectionMetadata.MetadataMutationPaused.selector)
        );
        metadata.updateAdminContract(address(replacementAdmins));
        deployed.admins
            .setPaused(deployed.admins.PAUSE_DOMAIN_METADATA_MUTATION(), false, bytes32(0));

        vm.expectEmit(true, true, true, true);
        emit CollectionMetadataAdminContractUpdated(
            address(deployed.admins), address(replacementAdmins), address(this)
        );
        metadata.updateAdminContract(address(replacementAdmins));
        metadata.adminsContract().assertEq(address(replacementAdmins), "admins not updated");
    }

    function testLocksCoverGlobalAndSnapshotWritesAndRemainEnumerable() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamCollectionMetadata metadata = new StreamCollectionMetadata(
            address(deployed.core), address(deployed.admins), address(0)
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.InvalidMetadataRecord.selector,
                LOCK_METADATA_ALL,
                SCHEMA_ID,
                _record(LOCK_METADATA_ALL, "ipfs://reserved").dataHash
            )
        );
        metadata.setCollectionRecord(COLLECTION_ID, _record(LOCK_METADATA_ALL, "ipfs://reserved"));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.InvalidMetadataRecord.selector,
                LOCK_SNAPSHOTS,
                SCHEMA_ID,
                _record(LOCK_SNAPSHOTS, "ipfs://reserved-snapshots").dataHash
            )
        );
        metadata.setCollectionRecord(
            COLLECTION_ID, _record(LOCK_SNAPSHOTS, "ipfs://reserved-snapshots")
        );

        metadata.lockCollectionRecord(COLLECTION_ID, LOCK_SNAPSHOTS);
        metadata.isLocked(COLLECTION_ID, LOCK_SNAPSHOTS).assertTrue("snapshots not locked");
        metadata.collectionRecordTypeAt(COLLECTION_ID, 0)
            .assertEq(LOCK_SNAPSHOTS, "snapshot lock not enumerable");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.CollectionMetadataLocked.selector,
                COLLECTION_ID,
                LOCK_SNAPSHOTS
            )
        );
        metadata.lockCollectionRecord(COLLECTION_ID, LOCK_SNAPSHOTS);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.CollectionMetadataLocked.selector,
                COLLECTION_ID,
                LOCK_SNAPSHOTS
            )
        );
        metadata.publishCollectionSnapshot(
            COLLECTION_ID, SNAPSHOT_ID, _record(keccak256("metadata.snapshot"), "ipfs://snapshot")
        );

        metadata.lockCollectionRecord(COLLECTION_ID, LOCK_METADATA_ALL);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.CollectionMetadataLocked.selector,
                COLLECTION_ID,
                LOCK_METADATA_ALL
            )
        );
        metadata.setCollectionRecord(COLLECTION_ID, _record(RECORD_RIGHTS, "ipfs://rights"));

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.CollectionMetadataLocked.selector,
                COLLECTION_ID,
                LOCK_METADATA_ALL
            )
        );
        metadata.publishCollectionSnapshot(
            COLLECTION_ID, SNAPSHOT_ID, _record(keccak256("metadata.snapshot"), "ipfs://snapshot")
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.CollectionMetadataLocked.selector,
                COLLECTION_ID,
                LOCK_METADATA_ALL
            )
        );
        metadata.lockCollectionRecord(COLLECTION_ID, RECORD_RIGHTS);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.CollectionMetadataLocked.selector,
                COLLECTION_ID,
                LOCK_METADATA_ALL
            )
        );
        metadata.lockCollectionRecord(COLLECTION_ID, LOCK_METADATA_ALL);
    }

    function testRecordTypeCapReservesTerminalLockSlots() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamCollectionMetadata metadata = new StreamCollectionMetadata(
            address(deployed.core), address(deployed.admins), address(0)
        );

        uint256 ordinarySlots = metadata.MAX_RECORD_TYPES() - 2;
        for (uint256 i = 0; i < ordinarySlots; i++) {
            bytes32 recordType = keccak256(abi.encode("metadata.type", i));
            metadata.setCollectionRecord(COLLECTION_ID, _record(recordType, "ipfs://type"));
        }

        metadata.collectionRecordTypeCount(COLLECTION_ID)
            .assertEq(ordinarySlots, "ordinary record slots not filled");
        bytes32 overflowType = keccak256("metadata.overflow");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.MetadataRecordTypeLimitExceeded.selector,
                ordinarySlots + 1,
                ordinarySlots
            )
        );
        metadata.setCollectionRecord(COLLECTION_ID, _record(overflowType, "ipfs://record-overflow"));

        metadata.lockCollectionRecord(COLLECTION_ID, LOCK_SNAPSHOTS);
        metadata.collectionRecordTypeCount(COLLECTION_ID)
            .assertEq(metadata.MAX_RECORD_TYPES() - 1, "snapshot lock slot missing");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.MetadataRecordTypeLimitExceeded.selector,
                metadata.MAX_RECORD_TYPES(),
                metadata.MAX_RECORD_TYPES() - 1
            )
        );
        metadata.setCollectionRecord(
            COLLECTION_ID, _record(keccak256("metadata.second-overflow"), "ipfs://second-overflow")
        );
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.CollectionMetadataLocked.selector,
                COLLECTION_ID,
                LOCK_SNAPSHOTS
            )
        );
        metadata.publishCollectionSnapshot(
            COLLECTION_ID,
            SNAPSHOT_ID,
            _record(keccak256("metadata.snapshot.cap"), "ipfs://snapshot-cap")
        );

        metadata.lockCollectionRecord(COLLECTION_ID, LOCK_METADATA_ALL);
        metadata.collectionRecordTypeCount(COLLECTION_ID)
            .assertEq(metadata.MAX_RECORD_TYPES(), "global lock slot missing");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.CollectionMetadataLocked.selector,
                COLLECTION_ID,
                LOCK_METADATA_ALL
            )
        );
        metadata.setCollectionRecord(COLLECTION_ID, _record(RECORD_RIGHTS, "ipfs://rights"));
    }

    function testSnapshotsCanPublishAfterCoreFreezeWithoutMutatingRecords() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamCollectionMetadata metadata = new StreamCollectionMetadata(
            address(deployed.core), address(deployed.admins), address(0)
        );
        _freezeCollection(deployed);

        IStreamCollectionMetadata.CollectionMetadataRecord memory snapshot =
            _record(keccak256("metadata.snapshot"), "ipfs://post-freeze-snapshot");
        bytes32 snapshotHash =
            metadata.publishCollectionSnapshot(COLLECTION_ID, SNAPSHOT_ID, snapshot);

        metadata.latestCollectionSnapshotHash(COLLECTION_ID)
            .assertEq(snapshotHash, "post-freeze snapshot missing");

        metadata.lockCollectionRecord(COLLECTION_ID, RECORD_RIGHTS);
        metadata.isLocked(COLLECTION_ID, RECORD_RIGHTS)
            .assertTrue("post-freeze record lock missing");
        metadata.lockCollectionRecord(COLLECTION_ID, snapshot.recordType);
        metadata.isLocked(COLLECTION_ID, snapshot.recordType)
            .assertTrue("post-freeze snapshot type lock missing");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.CollectionMetadataLocked.selector,
                COLLECTION_ID,
                snapshot.recordType
            )
        );
        metadata.publishCollectionSnapshot(COLLECTION_ID, SNAPSHOT_ID_2, snapshot);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.CollectionMetadataFrozen.selector, COLLECTION_ID
            )
        );
        metadata.lockCollectionRecord(COLLECTION_ID, LOCK_SNAPSHOTS);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.CollectionMetadataFrozen.selector, COLLECTION_ID
            )
        );
        metadata.lockCollectionRecord(COLLECTION_ID, LOCK_METADATA_ALL);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.CollectionMetadataFrozen.selector, COLLECTION_ID
            )
        );
        metadata.setCollectionRecord(COLLECTION_ID, _record(RECORD_RIGHTS, "ipfs://rights"));
    }

    function testAcceptsCreatedCollectionBeforeCoreSupplyData() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamCollectionMetadata metadata = new StreamCollectionMetadata(
            address(deployed.core), address(deployed.admins), address(0)
        );
        uint256 metadataFirstCollectionId = _createCollectionWithoutData(deployed);

        bytes32 recordHash = metadata.setCollectionRecord(
            metadataFirstCollectionId, _record(RECORD_IDENTITY, "ipfs://pre-supply")
        );

        metadata.latestCollectionRecordHash(metadataFirstCollectionId, RECORD_IDENTITY)
            .assertEq(recordHash, "created collection metadata missing");
    }

    function testInvalidRecordsUnsafeUrisAndDuplicateSnapshotsRevert() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamCollectionMetadata metadata = new StreamCollectionMetadata(
            address(deployed.core), address(deployed.admins), address(0)
        );

        IStreamCollectionMetadata.CollectionMetadataRecord memory invalid =
            _record(RECORD_IDENTITY, "ipfs://identity");
        invalid.recordType = bytes32(0);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.InvalidMetadataRecord.selector,
                bytes32(0),
                SCHEMA_ID,
                invalid.dataHash
            )
        );
        metadata.setCollectionRecord(COLLECTION_ID, invalid);

        invalid = _record(RECORD_IDENTITY, "ipfs://identity");
        invalid.schemaId = bytes32(0);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.InvalidMetadataRecord.selector,
                RECORD_IDENTITY,
                bytes32(0),
                invalid.dataHash
            )
        );
        metadata.setCollectionRecord(COLLECTION_ID, invalid);

        invalid = _record(RECORD_IDENTITY, "ipfs://identity");
        invalid.dataHash = bytes32(0);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.InvalidMetadataRecord.selector,
                RECORD_IDENTITY,
                SCHEMA_ID,
                bytes32(0)
            )
        );
        metadata.setCollectionRecord(COLLECTION_ID, invalid);

        metadata.setCollectionRecord(
            COLLECTION_ID, _record(RECORD_RIGHTS, _contentUri(metadata.MAX_URI_BYTES()))
        );
        IStreamCollectionMetadata.CollectionMetadataRecord memory tooLarge =
            _record(RECORD_IIIF_VIEW, _contentUri(metadata.MAX_URI_BYTES() + 1));
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.MetadataURITooLarge.selector,
                metadata.MAX_URI_BYTES() + 1,
                metadata.MAX_URI_BYTES()
            )
        );
        metadata.setCollectionRecord(COLLECTION_ID, tooLarge);

        IStreamCollectionMetadata.CollectionMetadataRecord memory badUri =
            _record(RECORD_IDENTITY, "data:application/json;base64,e30=");
        vm.expectRevert(abi.encodeWithSelector(StreamMetadataRenderer.UnsafeMetadataURI.selector));
        metadata.setCollectionRecord(COLLECTION_ID, badUri);

        IStreamCollectionMetadata.CollectionMetadataRecord memory snapshot =
            _record(keccak256("metadata.snapshot"), "ipfs://snapshot");
        vm.expectRevert(
            abi.encodeWithSelector(IStreamCollectionMetadata.InvalidSnapshotId.selector, bytes32(0))
        );
        metadata.publishCollectionSnapshot(COLLECTION_ID, bytes32(0), snapshot);

        metadata.publishCollectionSnapshot(COLLECTION_ID, SNAPSHOT_ID, snapshot);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.CollectionSnapshotAlreadyPublished.selector,
                COLLECTION_ID,
                SNAPSHOT_ID
            )
        );
        metadata.publishCollectionSnapshot(COLLECTION_ID, SNAPSHOT_ID, snapshot);
    }

    function testEventsCanReconstructTypedMetadataRecord() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamCollectionMetadata metadata = new StreamCollectionMetadata(
            address(deployed.core), address(deployed.admins), address(0)
        );
        IStreamCollectionMetadata.CollectionMetadataRecord memory record =
            _record(RECORD_IIIF_VIEW, "ipfs://iiif");

        vm.recordLogs();
        bytes32 recordHash = metadata.setCollectionRecord(COLLECTION_ID, record);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        logs.length.assertEq(1, "record log count");
        logs[0].emitter.assertEq(address(metadata), "record log emitter");
        logs[0].topics.length.assertEq(4, "record log topic count");
        logs[0].topics[0].assertEq(
            keccak256(
                "CollectionMetadataRecordSet(uint256,bytes32,bytes32,(bytes32,bytes32,string,bytes32,bytes32,uint64),bytes32,uint64,address)"
            ),
            "record event signature"
        );
        logs[0].topics[1].assertEq(bytes32(COLLECTION_ID), "event collection topic");
        logs[0].topics[2].assertEq(RECORD_IIIF_VIEW, "event record type topic");
        logs[0].topics[3].assertEq(SCHEMA_ID, "event schema topic");
        (
            IStreamCollectionMetadata.CollectionMetadataRecord memory eventRecord,
            bytes32 eventHash,
            uint64 revision,
            address admin
        ) = abi.decode(
            logs[0].data,
            (IStreamCollectionMetadata.CollectionMetadataRecord, bytes32, uint64, address)
        );
        eventRecord.recordType.assertEq(record.recordType, "event record type");
        eventRecord.uri.assertEq(record.uri, "event uri");
        eventHash.assertEq(recordHash, "event hash");
        uint256(revision).assertEq(1, "event revision");
        admin.assertEq(address(this), "event admin");
    }

    function testConstructorRejectsInvalidCoreAndAdminContracts() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        CollectionMetadataEmptyMarker emptyMarker = new CollectionMetadataEmptyMarker();

        vm.expectRevert(
            abi.encodeWithSelector(IStreamCollectionMetadata.InvalidCoreContract.selector)
        );
        new StreamCollectionMetadata(address(0x1234), address(deployed.admins), address(0));

        vm.expectRevert(
            abi.encodeWithSelector(IStreamCollectionMetadata.InvalidAdminContract.selector)
        );
        new StreamCollectionMetadata(address(deployed.core), address(emptyMarker), address(0));
    }

    function _record(bytes32 recordType, string memory uri)
        private
        view
        returns (IStreamCollectionMetadata.CollectionMetadataRecord memory record)
    {
        record = IStreamCollectionMetadata.CollectionMetadataRecord({
            recordType: recordType,
            schemaId: SCHEMA_ID,
            uri: uri,
            dataHash: keccak256(abi.encode(recordType, uri, block.chainid)),
            auxiliaryHash: keccak256("auxiliary"),
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

contract CollectionMetadataEmptyMarker { }
