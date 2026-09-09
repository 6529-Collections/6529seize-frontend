// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/interfaces/stream/IStreamRecordFamilyAuthorityProvider.sol";
import "../smart-contracts/interfaces/stream/IStreamRecordFamilyRegistry.sol";
import "../smart-contracts/domains/metadata/StreamCollectionMetadata.sol";
import "../smart-contracts/domains/preservation/StreamPreservationRecords.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";

contract RecordFamilyAuthorityProviderMock is IStreamRecordFamilyAuthorityProvider {
    mapping(address => bool) private _authorized;
    bool private _malformed;

    function isStreamRecordFamilyAuthorityProvider() external pure returns (bool) {
        return true;
    }

    function setAuthorized(address actor, bool authorized) external {
        _authorized[actor] = authorized;
    }

    function setMalformed(bool malformed) external {
        _malformed = malformed;
    }

    function isAuthorizedRecordWriter(uint256, bytes32, bytes32, address actor, bytes calldata)
        external
        view
        returns (bool)
    {
        if (_malformed) {
            assembly ("memory-safe") {
                mstore(0, 2)
                return(0, 32)
            }
        }
        return _authorized[actor];
    }
}

contract StreamRecordFamilyAuthorizationTest is CharacterizationTestBase, StreamFixture {
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    uint256 private constant COLLECTION_ID = 1;
    address private constant ARTIST = address(0xA47157);
    address private constant OTHER = address(0xB0B);
    bytes32 private constant ARTIST_TYPE = keccak256("ARTIST_INTENT");
    bytes32 private constant OWNER_TYPE = keccak256("OWNER_ACCESSION");
    bytes32 private constant INDEPENDENT_TYPE = keccak256("INDEPENDENT_ATTESTATION");
    bytes32 private constant LOCK_METADATA_ALL = keccak256("METADATA_ALL");
    bytes32 private constant RIGHTS_TYPE = keccak256("RIGHTS_STATEMENT");
    bytes32 private constant SNAPSHOT_TYPE = keccak256("SNAPSHOT_MANIFEST");
    bytes32 private constant UNKNOWN_TYPE = keccak256("UNDECLARED_FAMILY");
    bytes32 private constant SCHEMA_ID = keccak256("record-family-test-schema");
    uint8 private constant ARTIST_CLASS = 1;
    uint8 private constant OWNER_CLASS = 2;
    uint8 private constant METADATA_CLASS = 7;
    uint8 private constant GLOBAL_CLASS = 8;

    struct Setup {
        DeployedStream deployed;
        StreamCollectionMetadata registry;
        StreamCollectionMetadata metadata;
        StreamPreservationRecords preservation;
        RecordFamilyAuthorityProviderMock provider;
    }

    function testExactCatalogRejectsUnknownFamiliesClassesAndRecordTypes() public {
        Setup memory setup = _setup();
        bytes32 artistFamily = setup.registry.FAMILY_ARTIST();
        (setup.registry.familyAllowedAuthorizationClassMask(artistFamily)
                == uint16(1) << ARTIST_CLASS)
        .assertTrue("artist mask");
        setup.registry.familyRejectsAdminAuthority(artistFamily)
            .assertTrue("artist must reject admins");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.UnknownRecordFamily.selector, keccak256("WILDCARD_*")
            )
        );
        setup.registry
            .admitRecordType(
                keccak256("UNKNOWN_EXACT"), keccak256("WILDCARD_*"), uint16(1) << METADATA_CLASS
            );

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.InvalidAuthorizationClassMask.selector,
                artistFamily,
                uint16(1) << GLOBAL_CLASS,
                uint16(1) << ARTIST_CLASS
            )
        );
        setup.registry
            .admitRecordType(
                keccak256("ARTIST_WRONG_CLASS"), artistFamily, uint16(1) << GLOBAL_CLASS
            );

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.RecordTypeNotAdmitted.selector, UNKNOWN_TYPE
            )
        );
        setup.metadata.setCollectionRecord(COLLECTION_ID, _record(UNKNOWN_TYPE, "ipfs://unknown"));
    }

    function testConfigurationCommitmentTracksEveryAuthorityMutation() public {
        Setup memory setup = _setup();
        uint64 revision = setup.registry.configurationRevision();
        bytes32 commitment = setup.registry.configurationHash();
        uint256(setup.registry.recordTypeCount()).assertEq(5, "initial admission count");
        (revision > 0).assertTrue("initial configuration revision missing");
        (commitment != bytes32(0)).assertTrue("initial configuration hash missing");

        setup.registry
            .admitRecordType(
                keccak256("CURATOR_NOTE"),
                setup.registry.FAMILY_CURATOR(),
                uint16(1) << setup.registry.AUTHORIZATION_CLASS_CURATOR_SIGNER()
            );
        uint256(setup.registry.recordTypeCount()).assertEq(6, "admission count not committed");
        uint256(setup.registry.configurationRevision())
            .assertEq(uint256(revision) + 1, "admission revision");
        bytes32 nextCommitment = setup.registry.configurationHash();
        (nextCommitment != commitment).assertTrue("admission hash unchanged");

        revision = setup.registry.configurationRevision();
        commitment = nextCommitment;
        setup.registry
            .setRecordFamilyGrant(
                setup.registry.FAMILY_CURATOR(),
                setup.registry.AUTHORIZATION_CLASS_CURATOR_SIGNER(),
                OTHER,
                true
            );
        uint256(setup.registry.configurationRevision())
            .assertEq(uint256(revision) + 1, "grant revision");
        nextCommitment = setup.registry.configurationHash();
        (nextCommitment != commitment).assertTrue("grant hash unchanged");

        revision = setup.registry.configurationRevision();
        setup.registry
            .setAuthorityProvider(
                setup.registry.AUTHORIZATION_CLASS_INSTITUTION_SIGNER(), address(setup.provider)
            );
        uint256(setup.registry.configurationRevision())
            .assertEq(uint256(revision) + 1, "provider revision");
        commitment = setup.registry.configurationHash();
        (commitment != nextCommitment).assertTrue("provider hash unchanged");

        revision = setup.registry.configurationRevision();
        setup.registry
            .setAuthorityProvider(
                setup.registry.AUTHORIZATION_CLASS_INSTITUTION_SIGNER(), address(0)
            );
        uint256(setup.registry.configurationRevision())
            .assertEq(uint256(revision) + 1, "provider removal revision");
        nextCommitment = setup.registry.configurationHash();
        (nextCommitment != commitment).assertTrue("provider removal hash unchanged");

        revision = setup.registry.configurationRevision();
        setup.registry
            .setRecordFamilyGrant(
                setup.registry.FAMILY_CURATOR(),
                setup.registry.AUTHORIZATION_CLASS_CURATOR_SIGNER(),
                OTHER,
                false
            );
        uint256(setup.registry.configurationRevision())
            .assertEq(uint256(revision) + 1, "grant revocation revision");
        (setup.registry.configurationHash() != nextCommitment)
        .assertTrue("grant revocation hash unchanged");
        uint256(setup.registry.recordTypeCount()).assertEq(6, "non-admission changed count");
    }

    function testConfigurationAuthorityReplacementIsExplicitAndAuthoritative() public {
        vm.recordLogs();
        Setup memory setup = _setup();
        _assertAuthorityInitializationEvidence(
            vm.getRecordedLogs(), address(this), address(setup.registry)
        );
        bytes32 curatorFamily = setup.registry.FAMILY_CURATOR();
        uint8 curatorClass = setup.registry.AUTHORIZATION_CLASS_CURATOR_SIGNER();
        (setup.registry.configurationAuthority() == address(this))
        .assertTrue("initial configuration authority");
        (setup.registry.pendingConfigurationAuthority() == address(0))
        .assertTrue("unexpected initial pending authority");

        uint64 revision = setup.registry.configurationRevision();
        bytes32 commitment = setup.registry.configurationHash();
        vm.recordLogs();
        setup.registry.proposeConfigurationAuthority(OTHER);
        uint64 proposedRevision = setup.registry.configurationRevision();
        bytes32 proposedCommitment = setup.registry.configurationHash();
        uint256(proposedRevision).assertEq(uint256(revision) + 1, "proposal revision");
        (proposedCommitment != commitment).assertTrue("proposal hash unchanged");
        (setup.registry.configurationAuthority() == address(this))
        .assertTrue("proposal changed current authority");
        (setup.registry.pendingConfigurationAuthority() == OTHER)
        .assertTrue("pending authority missing");
        _assertAuthorityEvidence(
            vm.getRecordedLogs(),
            keccak256(
                "RecordFamilyConfigurationAuthorityProposed(uint16,address,address,uint64,bytes32)"
            ),
            address(this),
            OTHER,
            proposedRevision,
            proposedCommitment,
            address(setup.registry)
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.RecordFamilyConfigurationAuthorityRequired.selector,
                OTHER,
                address(this)
            )
        );
        vm.prank(OTHER);
        setup.registry
            .admitRecordType(
                keccak256("PENDING_CANNOT_CONFIGURE"), curatorFamily, uint16(1) << curatorClass
            );

        vm.recordLogs();
        vm.prank(OTHER);
        setup.registry.acceptConfigurationAuthority();
        uint64 acceptedRevision = setup.registry.configurationRevision();
        bytes32 acceptedCommitment = setup.registry.configurationHash();
        uint256(acceptedRevision).assertEq(uint256(proposedRevision) + 1, "acceptance revision");
        (acceptedCommitment != proposedCommitment).assertTrue("acceptance hash unchanged");
        (setup.registry.configurationAuthority() == OTHER)
        .assertTrue("replacement authority missing");
        (setup.registry.pendingConfigurationAuthority() == address(0))
        .assertTrue("pending authority not cleared");
        _assertAuthorityEvidence(
            vm.getRecordedLogs(),
            keccak256(
                "RecordFamilyConfigurationAuthorityAccepted(uint16,address,address,uint64,bytes32)"
            ),
            address(this),
            OTHER,
            acceptedRevision,
            acceptedCommitment,
            address(setup.registry)
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.RecordFamilyConfigurationAuthorityRequired.selector,
                address(this),
                OTHER
            )
        );
        setup.registry
            .admitRecordType(
                keccak256("OLD_AUTHORITY_REJECTED"), curatorFamily, uint16(1) << curatorClass
            );

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.RecordFamilyConfigurationAuthorityRequired.selector,
                address(this),
                OTHER
            )
        );
        setup.registry.setRecordFamilyGrant(curatorFamily, curatorClass, ARTIST, true);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.RecordFamilyConfigurationAuthorityRequired.selector,
                address(this),
                OTHER
            )
        );
        setup.registry.setAuthorityProvider(ARTIST_CLASS, address(0));

        vm.prank(OTHER);
        setup.registry
            .admitRecordType(
                keccak256("REPLACEMENT_AUTHORITY_ADMITTED"),
                curatorFamily,
                uint16(1) << curatorClass
            );
        vm.prank(OTHER);
        setup.registry.setRecordFamilyGrant(curatorFamily, curatorClass, ARTIST, true);
        vm.prank(OTHER);
        setup.registry.setAuthorityProvider(ARTIST_CLASS, address(0));
    }

    function testOperationalAdminChangesDoNotRotateConfigurationAuthority() public {
        Setup memory setup = _setup();
        bytes32 curatorFamily = setup.registry.FAMILY_CURATOR();
        uint8 curatorClass = setup.registry.AUTHORIZATION_CLASS_CURATOR_SIGNER();
        uint64 revision = setup.registry.configurationRevision();
        bytes32 commitment = setup.registry.configurationHash();
        setup.deployed.admins
            .registerFunctionAdmin(
                address(this),
                address(setup.metadata),
                setup.metadata.updateAdminContract.selector,
                true
            );

        setup.deployed.admins.transferOwnership(OTHER);
        (setup.deployed.admins.owner() == OTHER).assertTrue("admins ownership not transferred");
        (setup.registry.configurationAuthority() == address(this))
        .assertTrue("admins ownership rotated configuration authority");
        uint256(setup.registry.configurationRevision())
            .assertEq(revision, "admins ownership changed configuration revision");
        setup.registry.configurationHash()
            .assertEq(commitment, "admins ownership changed configuration hash");

        StreamAdmins replacementAdmins = new StreamAdmins(address(this));
        setup.metadata.updateAdminContract(address(replacementAdmins));
        (setup.metadata.adminsContract() == address(replacementAdmins))
        .assertTrue("operational admins dependency not updated");
        (setup.registry.configurationAuthority() == address(this))
        .assertTrue("admin dependency update rotated configuration authority");
        uint256(setup.registry.configurationRevision())
            .assertEq(revision, "admin dependency update changed configuration revision");
        setup.registry.configurationHash()
            .assertEq(commitment, "admin dependency update changed configuration hash");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.RecordFamilyConfigurationAuthorityRequired.selector,
                OTHER,
                address(this)
            )
        );
        vm.prank(OTHER);
        setup.registry
            .admitRecordType(
                keccak256("ADMINS_OWNER_REJECTED"), curatorFamily, uint16(1) << curatorClass
            );

        setup.registry
            .admitRecordType(
                keccak256("CONFIGURATION_AUTHORITY_PERSISTS"),
                curatorFamily,
                uint16(1) << curatorClass
            );
    }

    function testConfigurationAuthorityFailuresRollBackAndCancelIsCommitted() public {
        Setup memory setup = _setup();
        address authority = address(this);
        uint64 revision = setup.registry.configurationRevision();
        bytes32 commitment = setup.registry.configurationHash();

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.InvalidRecordFamilyConfigurationAuthority.selector,
                address(0)
            )
        );
        setup.registry.proposeConfigurationAuthority(address(0));
        _assertConfigurationState(setup.registry, authority, address(0), revision, commitment);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.RecordFamilyConfigurationAuthorityRequired.selector,
                OTHER,
                authority
            )
        );
        vm.prank(OTHER);
        setup.registry.proposeConfigurationAuthority(OTHER);
        _assertConfigurationState(setup.registry, authority, address(0), revision, commitment);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.RecordFamilyConfigurationAuthorityProposalMissing
                .selector
            )
        );
        setup.registry.cancelConfigurationAuthorityProposal();
        _assertConfigurationState(setup.registry, authority, address(0), revision, commitment);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.RecordFamilyConfigurationAuthorityProposalNoOp.selector,
                authority
            )
        );
        setup.registry.proposeConfigurationAuthority(authority);
        _assertConfigurationState(setup.registry, authority, address(0), revision, commitment);

        setup.registry.proposeConfigurationAuthority(OTHER);
        revision = setup.registry.configurationRevision();
        commitment = setup.registry.configurationHash();
        _assertConfigurationState(setup.registry, authority, OTHER, revision, commitment);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.RecordFamilyConfigurationAuthorityProposalNoOp.selector,
                OTHER
            )
        );
        setup.registry.proposeConfigurationAuthority(OTHER);
        _assertConfigurationState(setup.registry, authority, OTHER, revision, commitment);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.RecordFamilyConfigurationAuthorityProposalPending
                .selector,
                OTHER
            )
        );
        setup.registry.proposeConfigurationAuthority(ARTIST);
        _assertConfigurationState(setup.registry, authority, OTHER, revision, commitment);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.RecordFamilyConfigurationAuthorityAcceptanceRequired
                .selector,
                ARTIST,
                OTHER
            )
        );
        vm.prank(ARTIST);
        setup.registry.acceptConfigurationAuthority();
        _assertConfigurationState(setup.registry, authority, OTHER, revision, commitment);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.RecordFamilyConfigurationAuthorityRequired.selector,
                ARTIST,
                authority
            )
        );
        vm.prank(ARTIST);
        setup.registry.cancelConfigurationAuthorityProposal();
        _assertConfigurationState(setup.registry, authority, OTHER, revision, commitment);

        vm.recordLogs();
        setup.registry.cancelConfigurationAuthorityProposal();
        uint64 canceledRevision = setup.registry.configurationRevision();
        bytes32 canceledCommitment = setup.registry.configurationHash();
        uint256(canceledRevision).assertEq(uint256(revision) + 1, "cancel revision");
        (canceledCommitment != commitment).assertTrue("cancel hash unchanged");
        _assertConfigurationState(
            setup.registry, authority, address(0), canceledRevision, canceledCommitment
        );
        _assertAuthorityEvidence(
            vm.getRecordedLogs(),
            keccak256(
                "RecordFamilyConfigurationAuthorityProposalCanceled(uint16,address,address,uint64,bytes32)"
            ),
            authority,
            OTHER,
            canceledRevision,
            canceledCommitment,
            address(setup.registry)
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.RecordFamilyConfigurationAuthorityAcceptanceRequired
                .selector,
                OTHER,
                address(0)
            )
        );
        vm.prank(OTHER);
        setup.registry.acceptConfigurationAuthority();
        _assertConfigurationState(
            setup.registry, authority, address(0), canceledRevision, canceledCommitment
        );
    }

    function testGlobalAndFunctionAdminsCannotCrossIntoArtistLane() public {
        Setup memory setup = _setup();
        bytes32 artistFamily = setup.registry.FAMILY_ARTIST();
        setup.deployed.admins
            .registerFunctionAdmin(
                OTHER, address(setup.metadata), setup.metadata.setCollectionRecord.selector, true
            );
        setup.deployed.admins.registerAdmin(OTHER, true);

        vm.expectRevert(_unauthorized(OTHER, ARTIST_TYPE, artistFamily, uint16(1) << ARTIST_CLASS));
        vm.prank(OTHER);
        setup.metadata
            .setCollectionRecord(COLLECTION_ID, _record(ARTIST_TYPE, "ipfs://forged-artist"));

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.RecordFamilyGrantNotAllowed.selector,
                artistFamily,
                GLOBAL_CLASS,
                address(this)
            )
        );
        setup.registry.setRecordFamilyGrant(artistFamily, GLOBAL_CLASS, address(this), true);
    }

    function testLockCollectionRecordUsesFamilyAuthorityAndRejectsAdminSubstitution() public {
        Setup memory setup = _setup();
        setup.deployed.admins
            .registerFunctionAdmin(
                OTHER, address(setup.metadata), setup.metadata.lockCollectionRecord.selector, true
            );
        setup.deployed.admins.registerAdmin(OTHER, true);

        vm.expectRevert(
            _unauthorized(
                OTHER, ARTIST_TYPE, setup.registry.FAMILY_ARTIST(), uint16(1) << ARTIST_CLASS
            )
        );
        vm.prank(OTHER);
        setup.metadata.lockCollectionRecord(COLLECTION_ID, ARTIST_TYPE);

        vm.expectRevert(
            _unauthorized(
                OTHER, OWNER_TYPE, setup.registry.FAMILY_OWNER(), uint16(1) << OWNER_CLASS
            )
        );
        vm.prank(OTHER);
        setup.metadata.lockCollectionRecord(COLLECTION_ID, OWNER_TYPE);

        setup.provider.setAuthorized(ARTIST, true);
        vm.prank(ARTIST);
        setup.metadata.lockCollectionRecord(COLLECTION_ID, ARTIST_TYPE);
        setup.metadata.isLocked(COLLECTION_ID, ARTIST_TYPE).assertTrue("artist lock missing");
        uint256(setup.metadata.collectionRecord(COLLECTION_ID, ARTIST_TYPE).authorizationClass)
            .assertEq(ARTIST_CLASS, "artist lock class not persisted");
    }

    function testIndependentFamilyRoutesToUnblockableAppendOnlyPreservation() public {
        Setup memory setup = _setup();

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.RecordFamilyLockNotAllowed.selector,
                INDEPENDENT_TYPE,
                setup.registry.FAMILY_INDEPENDENT()
            )
        );
        vm.prank(OTHER);
        setup.metadata.lockCollectionRecord(COLLECTION_ID, INDEPENDENT_TYPE);

        setup.metadata.isLocked(COLLECTION_ID, INDEPENDENT_TYPE)
            .assertFalse("independent lane locked");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.RecordFamilyHostNotAllowed.selector,
                INDEPENDENT_TYPE,
                setup.registry.FAMILY_INDEPENDENT()
            )
        );
        vm.prank(OTHER);
        setup.metadata
            .setCollectionRecord(
                COLLECTION_ID, _record(INDEPENDENT_TYPE, "ipfs://wrong-independent-host")
            );

        setup.metadata.lockCollectionRecord(COLLECTION_ID, LOCK_METADATA_ALL);
        vm.prank(address(setup.deployed.minter));
        setup.deployed.core.mint(1, address(0xDAD), "1,2,3", 7, COLLECTION_ID);
        vm.warp(block.timestamp + 31 days + 1);
        setup.deployed.core.freezeCollection(COLLECTION_ID);
        setup.deployed.admins
            .setPaused(setup.deployed.admins.PAUSE_DOMAIN_METADATA_MUTATION(), true, bytes32(0));

        vm.prank(OTHER);
        bytes32 recordHash = setup.preservation
            .recordCollectionRecord(COLLECTION_ID, _preservationRecord(keccak256("collection:1")));
        IStreamPreservationRecords.CollectionRecordSummary memory summary =
            setup.preservation.collectionRecordSummary(recordHash);
        (summary.recorder == OTHER).assertTrue("independent recorder mismatch");
        uint256(summary.authorizationClass)
            .assertEq(
                setup.registry.AUTHORIZATION_CLASS_INDEPENDENT_ATTESTOR(),
                "independent class not persisted"
            );
    }

    function testIndependentRecordersCannotCopyDenyOrOverwriteLatestPointers() public {
        Setup memory setup = _setup();
        bytes32 subjectId = keccak256("collection:1:independent-attestation");
        IStreamPreservationRecords.CollectionRecord memory record = _preservationRecord(subjectId);
        bytes32 otherHash =
            setup.preservation.deriveCollectionRecordHashFor(OTHER, COLLECTION_ID, record);
        bytes32 artistHash =
            setup.preservation.deriveCollectionRecordHashFor(ARTIST, COLLECTION_ID, record);
        (otherHash != artistHash).assertTrue("recorder missing from hash domain");

        vm.prank(OTHER);
        bytes32 copiedFirst = setup.preservation.recordCollectionRecord(COLLECTION_ID, record);
        copiedFirst.assertEq(otherHash, "copy hash mismatch");

        vm.prank(ARTIST);
        bytes32 intended = setup.preservation.recordCollectionRecord(COLLECTION_ID, record);
        intended.assertEq(artistHash, "intended attestor duplicate-denied");
        setup.preservation
            .latestCollectionRecordHashFor(COLLECTION_ID, INDEPENDENT_TYPE, subjectId, OTHER)
            .assertEq(otherHash, "copy recorder latest pointer");
        setup.preservation
            .latestCollectionRecordHashFor(COLLECTION_ID, INDEPENDENT_TYPE, subjectId, ARTIST)
            .assertEq(artistHash, "intended recorder latest pointer");

        vm.prank(OTHER);
        setup.preservation.latestCollectionRecordHash(COLLECTION_ID, INDEPENDENT_TYPE, subjectId)
            .assertEq(otherHash, "caller-scoped copy pointer");
        vm.prank(ARTIST);
        setup.preservation.latestCollectionRecordHash(COLLECTION_ID, INDEPENDENT_TYPE, subjectId)
            .assertEq(artistHash, "caller-scoped intended pointer");

        record.uri = "ipfs://independent-preservation-v2";
        record.contentHash.digest = abi.encodePacked(keccak256("independent-preservation-v2"));
        bytes32 artistSecond =
            setup.preservation.deriveCollectionRecordHashFor(ARTIST, COLLECTION_ID, record);
        vm.prank(ARTIST);
        setup.preservation.recordCollectionRecord(COLLECTION_ID, record)
            .assertEq(artistSecond, "second intended record hash");
        setup.preservation
            .latestCollectionRecordHashFor(COLLECTION_ID, INDEPENDENT_TYPE, subjectId, ARTIST)
            .assertEq(artistSecond, "intended pointer not advanced");
        setup.preservation
            .latestCollectionRecordHashFor(COLLECTION_ID, INDEPENDENT_TYPE, subjectId, OTHER)
            .assertEq(otherHash, "cross-attestor pointer overwritten");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPreservationRecords.InvalidCollectionRecordRecorder.selector, address(0)
            )
        );
        setup.preservation.deriveCollectionRecordHashFor(address(0), COLLECTION_ID, record);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamPreservationRecords.InvalidCollectionRecordRecorder.selector, address(0)
            )
        );
        setup.preservation
            .latestCollectionRecordHashFor(COLLECTION_ID, INDEPENDENT_TYPE, subjectId, address(0));
    }

    function testUndeclaredTypesCannotConsumeMetadataRecordCapacity() public {
        Setup memory setup = _setup();
        uint256 countBefore = setup.metadata.collectionRecordTypeCount(COLLECTION_ID);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.RecordTypeNotAdmitted.selector, UNKNOWN_TYPE
            )
        );
        setup.metadata.setCollectionRecord(COLLECTION_ID, _record(UNKNOWN_TYPE, "ipfs://unknown"));

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.RecordTypeNotAdmitted.selector, UNKNOWN_TYPE
            )
        );
        setup.metadata.lockCollectionRecord(COLLECTION_ID, UNKNOWN_TYPE);

        setup.metadata.collectionRecordTypeCount(COLLECTION_ID)
            .assertEq(countBefore, "undeclared type consumed capacity");
    }

    function testCrossFamilyGrantProviderRotationAndRevocationFailClosed() public {
        Setup memory setup = _setup();
        bytes32 artistFamily = setup.registry.FAMILY_ARTIST();
        bytes32 rightsFamily = setup.registry.FAMILY_RIGHTS();
        setup.registry.setRecordFamilyGrant(rightsFamily, METADATA_CLASS, OTHER, true);

        vm.expectRevert(_unauthorized(OTHER, ARTIST_TYPE, artistFamily, uint16(1) << ARTIST_CLASS));
        vm.prank(OTHER);
        setup.metadata
            .setCollectionRecord(COLLECTION_ID, _record(ARTIST_TYPE, "ipfs://cross-family"));

        setup.provider.setAuthorized(ARTIST, true);
        vm.prank(ARTIST);
        setup.metadata.setCollectionRecord(COLLECTION_ID, _record(ARTIST_TYPE, "ipfs://artist-v1"));

        RecordFamilyAuthorityProviderMock replacement = new RecordFamilyAuthorityProviderMock();
        replacement.setAuthorized(OTHER, true);
        setup.registry.setAuthorityProvider(ARTIST_CLASS, address(replacement));

        vm.expectRevert(_unauthorized(ARTIST, ARTIST_TYPE, artistFamily, uint16(1) << ARTIST_CLASS));
        vm.prank(ARTIST);
        setup.metadata
            .setCollectionRecordWithRevision(
                COLLECTION_ID, _record(ARTIST_TYPE, "ipfs://stale-provider"), 1
            );

        vm.prank(OTHER);
        setup.metadata
            .setCollectionRecordWithRevision(
                COLLECTION_ID, _record(ARTIST_TYPE, "ipfs://artist-v2"), 1
            );
        uint256(setup.metadata.collectionRecord(COLLECTION_ID, ARTIST_TYPE).authorizationClass)
            .assertEq(ARTIST_CLASS, "artist class not persisted");

        setup.registry.setAuthorityProvider(ARTIST_CLASS, address(0));
        vm.expectRevert(_unauthorized(OTHER, ARTIST_TYPE, artistFamily, uint16(1) << ARTIST_CLASS));
        vm.prank(OTHER);
        setup.metadata
            .setCollectionRecordWithRevision(
                COLLECTION_ID, _record(ARTIST_TYPE, "ipfs://revoked"), 2
            );
    }

    function testSnapshotRequiresStrictDeclaredAllFamilyIntersection() public {
        Setup memory setup = _setup();
        bytes32[] memory covered = _sortedPair(ARTIST_TYPE, RIGHTS_TYPE);
        IStreamCollectionMetadata.CollectionMetadataRecord memory snapshot =
            _record(SNAPSHOT_TYPE, "ipfs://snapshot");

        vm.expectRevert(
            _unauthorized(
                address(this),
                ARTIST_TYPE,
                setup.registry.FAMILY_ARTIST(),
                uint16(1) << ARTIST_CLASS
            )
        );
        setup.metadata
            .publishCollectionSnapshot(
                COLLECTION_ID, keccak256("snapshot-missing-authority"), covered, snapshot
            );

        setup.provider.setAuthorized(address(this), true);
        bytes32 snapshotId = keccak256("snapshot-authorized");
        bytes32 snapshotHash =
            setup.metadata.publishCollectionSnapshot(COLLECTION_ID, snapshotId, covered, snapshot);
        (snapshotHash != bytes32(0)).assertTrue("snapshot missing");
        setup.metadata.snapshotCoveredRecordTypesHash(COLLECTION_ID, snapshotId)
            .assertEq(keccak256(abi.encode(covered)), "family-set commitment");

        bytes32[] memory duplicate = new bytes32[](2);
        duplicate[0] = RIGHTS_TYPE;
        duplicate[1] = RIGHTS_TYPE;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.InvalidSnapshotFamilySet.selector, uint256(1), RIGHTS_TYPE
            )
        );
        setup.metadata
            .publishCollectionSnapshot(
                COLLECTION_ID, keccak256("snapshot-duplicate"), duplicate, snapshot
            );

        bytes32[] memory unknown = new bytes32[](1);
        unknown[0] = UNKNOWN_TYPE;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.RecordTypeNotAdmitted.selector, UNKNOWN_TYPE
            )
        );
        setup.metadata
            .publishCollectionSnapshot(
                COLLECTION_ID, keccak256("snapshot-unknown"), unknown, snapshot
            );
    }

    function testSnapshotPayloadMustUseSnapshotFamily() public {
        Setup memory setup = _setup();
        bytes32[] memory covered = new bytes32[](1);
        covered[0] = RIGHTS_TYPE;
        IStreamCollectionMetadata.CollectionMetadataRecord memory nonSnapshot =
            _record(RIGHTS_TYPE, "ipfs://not-a-snapshot");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamCollectionMetadata.InvalidSnapshotRecordType.selector, RIGHTS_TYPE
            )
        );
        setup.metadata
            .publishCollectionSnapshot(
                COLLECTION_ID, keccak256("wrong-family"), covered, nonSnapshot
            );
    }

    function testMalformedProviderReturnFailsClosed() public {
        Setup memory setup = _setup();
        setup.provider.setMalformed(true);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRecordFamilyRegistry.AuthorityProviderCallFailed.selector,
                ARTIST_CLASS,
                address(setup.provider)
            )
        );
        vm.prank(ARTIST);
        setup.metadata
            .setCollectionRecord(COLLECTION_ID, _record(ARTIST_TYPE, "ipfs://malformed-provider"));
    }

    function _setup() private returns (Setup memory setup) {
        setup.deployed = deployStream(address(0xBEEF), address(0xCAFE));
        setup.metadata = new StreamCollectionMetadata(
            address(setup.deployed.core), address(setup.deployed.admins), address(0)
        );
        setup.registry = setup.metadata;
        setup.provider = new RecordFamilyAuthorityProviderMock();
        setup.registry.setAuthorityProvider(ARTIST_CLASS, address(setup.provider));
        setup.registry.setAuthorityProvider(OWNER_CLASS, address(setup.provider));
        setup.registry
            .admitRecordType(ARTIST_TYPE, setup.registry.FAMILY_ARTIST(), uint16(1) << ARTIST_CLASS);
        setup.registry
            .admitRecordType(OWNER_TYPE, setup.registry.FAMILY_OWNER(), uint16(1) << OWNER_CLASS);
        setup.registry
            .admitRecordType(
                INDEPENDENT_TYPE,
                setup.registry.FAMILY_INDEPENDENT(),
                uint16(1) << setup.registry.AUTHORIZATION_CLASS_INDEPENDENT_ATTESTOR()
            );
        setup.registry
            .admitRecordType(
                RIGHTS_TYPE, setup.registry.FAMILY_RIGHTS(), uint16(1) << METADATA_CLASS
            );
        setup.registry
            .admitRecordType(
                SNAPSHOT_TYPE, setup.registry.FAMILY_SNAPSHOT(), uint16(1) << METADATA_CLASS
            );
        setup.registry
            .setRecordFamilyGrant(
                setup.registry.FAMILY_RIGHTS(), METADATA_CLASS, address(this), true
            );
        setup.registry
            .setRecordFamilyGrant(
                setup.registry.FAMILY_SNAPSHOT(), METADATA_CLASS, address(this), true
            );
        setup.preservation = new StreamPreservationRecords(
            address(setup.deployed.core),
            address(setup.deployed.admins),
            address(setup.registry),
            address(0)
        );
    }

    function _record(bytes32 recordType, string memory uri)
        private
        view
        returns (IStreamCollectionMetadata.CollectionMetadataRecord memory)
    {
        return IStreamCollectionMetadata.CollectionMetadataRecord({
            recordType: recordType,
            schemaId: SCHEMA_ID,
            uri: uri,
            dataHash: keccak256(abi.encode(recordType, uri)),
            auxiliaryHash: keccak256("auxiliary"),
            effectiveAt: uint64(block.timestamp + 1)
        });
    }

    function _unauthorized(address actor, bytes32 recordType, bytes32 familyId, uint16 mask)
        private
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            IStreamRecordFamilyRegistry.RecordFamilyUnauthorized.selector,
            actor,
            recordType,
            familyId,
            mask
        );
    }

    function _preservationRecord(bytes32 subjectId)
        private
        pure
        returns (IStreamPreservationRecords.CollectionRecord memory)
    {
        return IStreamPreservationRecords.CollectionRecord({
            recordType: INDEPENDENT_TYPE,
            subjectId: subjectId,
            contentHash: IStreamPreservationRecords.HashRef({
                algorithm: 2,
                digest: abi.encodePacked(keccak256("independent-preservation")),
                canonicalizationId: keccak256("RFC8785_JCS")
            }),
            uri: "ipfs://independent-preservation",
            schemaId: SCHEMA_ID,
            signatureScheme: bytes32(0),
            signatureHash: IStreamPreservationRecords.HashRef({
                algorithm: 0, digest: new bytes(0), canonicalizationId: bytes32(0)
            }),
            effectiveAt: 1_782_345_600
        });
    }

    function _assertConfigurationState(
        StreamCollectionMetadata registry,
        address authority,
        address pendingAuthority,
        uint64 revision,
        bytes32 commitment
    ) private view {
        (registry.configurationAuthority() == authority).assertTrue("configuration authority");
        (registry.pendingConfigurationAuthority() == pendingAuthority)
        .assertTrue("pending configuration authority");
        uint256(registry.configurationRevision()).assertEq(revision, "configuration revision");
        registry.configurationHash().assertEq(commitment, "configuration hash");
    }

    function _assertAuthorityEvidence(
        Vm.Log[] memory logs,
        bytes32 eventSignature,
        address firstAuthority,
        address secondAuthority,
        uint64 revision,
        bytes32 commitment,
        address expectedEmitter
    ) private pure {
        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].emitter == expectedEmitter && logs[i].topics.length == 3
                    && logs[i].topics[0] == eventSignature
            ) {
                logs[i].topics[1].assertEq(
                    bytes32(uint256(uint160(firstAuthority))), "first authority event topic"
                );
                logs[i].topics[2].assertEq(
                    bytes32(uint256(uint160(secondAuthority))), "second authority event topic"
                );
                keccak256(logs[i].data)
                    .assertEq(
                        keccak256(abi.encode(uint16(1), revision, commitment)),
                        "authority event data"
                    );
                return;
            }
        }
        revert("typed authority evidence missing");
    }

    function _assertAuthorityInitializationEvidence(
        Vm.Log[] memory logs,
        address authority,
        address expectedEmitter
    ) private pure {
        bytes32 eventSignature = keccak256(
            "RecordFamilyConfigurationAuthorityInitialized(uint16,address,uint64,bytes32)"
        );
        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].emitter == expectedEmitter && logs[i].topics.length == 2
                    && logs[i].topics[0] == eventSignature
            ) {
                logs[i].topics[1].assertEq(
                    bytes32(uint256(uint160(authority))), "initialized authority event topic"
                );
                (uint16 schemaVersion, uint64 revision, bytes32 commitment) =
                    abi.decode(logs[i].data, (uint16, uint64, bytes32));
                uint256(schemaVersion).assertEq(1, "initialized authority schema");
                uint256(revision).assertEq(1, "initialized authority revision");
                (commitment != bytes32(0)).assertTrue("initialized authority hash");
                return;
            }
        }
        revert("typed authority initialization evidence missing");
    }

    function _sortedPair(bytes32 left, bytes32 right)
        private
        pure
        returns (bytes32[] memory values)
    {
        values = new bytes32[](2);
        if (left < right) {
            values[0] = left;
            values[1] = right;
        } else {
            values[0] = right;
            values[1] = left;
        }
    }
}
