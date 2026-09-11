// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IStreamRecordFamilyAuthorityProvider.sol";
import "../smart-contracts/IStreamRecordFamilyRegistry.sol";
import "../smart-contracts/StreamCollectionMetadata.sol";
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
    bytes32 private constant RIGHTS_TYPE = keccak256("RIGHTS_STATEMENT");
    bytes32 private constant SNAPSHOT_TYPE = keccak256("SNAPSHOT_MANIFEST");
    bytes32 private constant UNKNOWN_TYPE = keccak256("UNDECLARED_FAMILY");
    bytes32 private constant SCHEMA_ID = keccak256("record-family-test-schema");
    uint8 private constant ARTIST_CLASS = 1;
    uint8 private constant METADATA_CLASS = 7;
    uint8 private constant GLOBAL_CLASS = 8;

    struct Setup {
        DeployedStream deployed;
        StreamCollectionMetadata registry;
        StreamCollectionMetadata metadata;
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
        setup.registry
            .admitRecordType(ARTIST_TYPE, setup.registry.FAMILY_ARTIST(), uint16(1) << ARTIST_CLASS);
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
