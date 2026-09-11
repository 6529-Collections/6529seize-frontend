// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ERC165.sol";
import "./IStreamAdmins.sol";
import "./IStreamRecordFamilyAuthorityProvider.sol";
import "./IStreamRecordFamilyRegistry.sol";
import "./StreamMetadataRenderer.sol";

/// @notice Closed-world record-type classifier and live family-authority resolver.
/// @dev Exact record types are append-only. Authority providers and grants are mutable only by
///      the StreamAdmins root, allowing Governance V2 ownership to rotate/revoke authority without
///      making a function admin or global admin a record writer.
abstract contract StreamRecordFamilyRegistry is ERC165, IStreamRecordFamilyRegistry {
    uint16 public constant SCHEMA_VERSION = 1;

    uint8 public constant AUTHORIZATION_CLASS_ARTIST_SIGNER = 1;
    uint8 public constant AUTHORIZATION_CLASS_OWNER_SIGNER = 2;
    uint8 public constant AUTHORIZATION_CLASS_CURATOR_SIGNER = 3;
    uint8 public constant AUTHORIZATION_CLASS_INSTITUTION_SIGNER = 4;
    uint8 public constant AUTHORIZATION_CLASS_INDEPENDENT_ATTESTOR = 5;
    uint8 public constant AUTHORIZATION_CLASS_PRESERVATION_ADMIN = 6;
    uint8 public constant AUTHORIZATION_CLASS_METADATA_ADMIN = 7;
    uint8 public constant AUTHORIZATION_CLASS_GLOBAL_ADMIN = 8;

    bytes32 public constant FAMILY_ARTIST = keccak256("6529STREAM_RECORD_FAMILY_ARTIST_V1");
    bytes32 public constant FAMILY_OWNER = keccak256("6529STREAM_RECORD_FAMILY_OWNER_V1");
    bytes32 public constant FAMILY_INDEPENDENT =
        keccak256("6529STREAM_RECORD_FAMILY_INDEPENDENT_V1");
    bytes32 public constant FAMILY_CURATOR = keccak256("6529STREAM_RECORD_FAMILY_CURATOR_V1");
    bytes32 public constant FAMILY_INSTITUTION =
        keccak256("6529STREAM_RECORD_FAMILY_INSTITUTION_V1");
    bytes32 public constant FAMILY_RIGHTS = keccak256("6529STREAM_RECORD_FAMILY_RIGHTS_V1");
    bytes32 public constant FAMILY_ARCHIVE = keccak256("6529STREAM_RECORD_FAMILY_ARCHIVE_V1");
    bytes32 public constant FAMILY_FIXITY = keccak256("6529STREAM_RECORD_FAMILY_FIXITY_V1");
    bytes32 public constant FAMILY_C2PA = keccak256("6529STREAM_RECORD_FAMILY_C2PA_V1");
    bytes32 public constant FAMILY_IIIF = keccak256("6529STREAM_RECORD_FAMILY_IIIF_V1");
    bytes32 public constant FAMILY_MEDIA_RELATIONSHIP =
        keccak256("6529STREAM_RECORD_FAMILY_MEDIA_RELATIONSHIP_V1");
    bytes32 public constant FAMILY_IDENTITY_DISPLAY =
        keccak256("6529STREAM_RECORD_FAMILY_IDENTITY_DISPLAY_V1");
    bytes32 public constant FAMILY_SNAPSHOT = keccak256("6529STREAM_RECORD_FAMILY_SNAPSHOT_V1");
    bytes32 public constant FAMILY_AGENT = keccak256("6529STREAM_RECORD_FAMILY_AGENT_V1");

    IStreamAdmins private _admins;

    mapping(bytes32 => RecordTypePolicy) private _recordTypePolicies;
    mapping(bytes32 => uint64) private _recordTypeRevisions;
    mapping(bytes32 => mapping(uint8 => mapping(address => bool))) private _familyGrants;
    mapping(bytes32 => mapping(uint8 => mapping(address => uint64))) private _familyGrantRevisions;
    mapping(uint8 => address) private _authorityProviders;
    mapping(uint8 => bytes32) private _authorityProviderCodeHashes;
    mapping(uint8 => uint64) private _authorityProviderRevisions;

    constructor(address admins) {
        _admins = IStreamAdmins(admins);
    }

    modifier onlyRoot() {
        if (msg.sender != _admins.owner()) revert RecordFamilyRegistryOwnerRequired(msg.sender);
        _;
    }

    function isStreamRecordFamilyRegistry() external pure override returns (bool) {
        return true;
    }

    function adminsContract() public view virtual override returns (address) {
        return address(_admins);
    }

    function recordTypePolicy(bytes32 recordType)
        external
        view
        override
        returns (RecordTypePolicy memory)
    {
        return _recordTypePolicies[recordType];
    }

    function recordTypeRevision(bytes32 recordType) external view override returns (uint64) {
        return _recordTypeRevisions[recordType];
    }

    function familyAllowedAuthorizationClassMask(bytes32 familyId)
        public
        pure
        override
        returns (uint16)
    {
        if (familyId == FAMILY_ARTIST) return _classBit(AUTHORIZATION_CLASS_ARTIST_SIGNER);
        if (familyId == FAMILY_OWNER) return _classBit(AUTHORIZATION_CLASS_OWNER_SIGNER);
        if (familyId == FAMILY_INDEPENDENT) {
            return _classBit(AUTHORIZATION_CLASS_INDEPENDENT_ATTESTOR);
        }
        if (familyId == FAMILY_CURATOR) {
            return _classBit(AUTHORIZATION_CLASS_CURATOR_SIGNER)
                | _classBit(AUTHORIZATION_CLASS_GLOBAL_ADMIN);
        }
        if (familyId == FAMILY_INSTITUTION) {
            return _classBit(AUTHORIZATION_CLASS_INSTITUTION_SIGNER);
        }
        if (familyId == FAMILY_RIGHTS) {
            return _classBit(AUTHORIZATION_CLASS_METADATA_ADMIN)
                | _classBit(AUTHORIZATION_CLASS_GLOBAL_ADMIN);
        }
        if (familyId == FAMILY_ARCHIVE) {
            return _classBit(AUTHORIZATION_CLASS_PRESERVATION_ADMIN)
                | _classBit(AUTHORIZATION_CLASS_GLOBAL_ADMIN);
        }
        if (familyId == FAMILY_FIXITY) {
            return _classBit(AUTHORIZATION_CLASS_INSTITUTION_SIGNER)
                | _classBit(AUTHORIZATION_CLASS_PRESERVATION_ADMIN)
                | _classBit(AUTHORIZATION_CLASS_GLOBAL_ADMIN);
        }
        if (familyId == FAMILY_C2PA) {
            return _classBit(AUTHORIZATION_CLASS_INSTITUTION_SIGNER)
                | _classBit(AUTHORIZATION_CLASS_PRESERVATION_ADMIN)
                | _classBit(AUTHORIZATION_CLASS_GLOBAL_ADMIN);
        }
        if (familyId == FAMILY_IIIF) {
            return _classBit(AUTHORIZATION_CLASS_PRESERVATION_ADMIN)
                | _classBit(AUTHORIZATION_CLASS_METADATA_ADMIN)
                | _classBit(AUTHORIZATION_CLASS_GLOBAL_ADMIN);
        }
        if (familyId == FAMILY_MEDIA_RELATIONSHIP) {
            return _classBit(AUTHORIZATION_CLASS_PRESERVATION_ADMIN)
                | _classBit(AUTHORIZATION_CLASS_METADATA_ADMIN);
        }
        if (
            familyId == FAMILY_IDENTITY_DISPLAY || familyId == FAMILY_SNAPSHOT
                || familyId == FAMILY_AGENT
        ) {
            return _classBit(AUTHORIZATION_CLASS_METADATA_ADMIN)
                | _classBit(AUTHORIZATION_CLASS_GLOBAL_ADMIN);
        }
        return 0;
    }

    function familyRejectsAdminAuthority(bytes32 familyId) public pure override returns (bool) {
        return familyId == FAMILY_ARTIST || familyId == FAMILY_OWNER
            || familyId == FAMILY_INDEPENDENT || familyId == FAMILY_INSTITUTION;
    }

    function recordTypeRejectsAdminAuthority(bytes32 recordType)
        external
        view
        override
        returns (bool)
    {
        RecordTypePolicy storage policy = _recordTypePolicies[recordType];
        if (!policy.admitted) revert RecordTypeNotAdmitted(recordType);
        return familyRejectsAdminAuthority(policy.familyId);
    }

    function recordFamilyGrant(bytes32 familyId, uint8 authorizationClass, address account)
        external
        view
        override
        returns (bool enabled, uint64 revision)
    {
        return (
            _familyGrants[familyId][authorizationClass][account],
            _familyGrantRevisions[familyId][authorizationClass][account]
        );
    }

    function authorityProvider(uint8 authorizationClass)
        external
        view
        override
        returns (address provider, bytes32 providerCodeHash, uint64 revision)
    {
        return (
            _authorityProviders[authorizationClass],
            _authorityProviderCodeHashes[authorizationClass],
            _authorityProviderRevisions[authorizationClass]
        );
    }

    function admitRecordType(bytes32 recordType, bytes32 familyId, uint16 authorizationClassMask)
        external
        override
        onlyRoot
    {
        if (recordType == bytes32(0)) revert InvalidRecordType(recordType);
        if (_recordTypePolicies[recordType].admitted) revert RecordTypeAlreadyAdmitted(recordType);
        uint16 allowed = familyAllowedAuthorizationClassMask(familyId);
        if (allowed == 0) revert UnknownRecordFamily(familyId);
        if (authorizationClassMask == 0 || (authorizationClassMask & ~allowed) != 0) {
            revert InvalidAuthorizationClassMask(familyId, authorizationClassMask, allowed);
        }
        _recordTypePolicies[recordType] = RecordTypePolicy({
            familyId: familyId, authorizationClassMask: authorizationClassMask, admitted: true
        });
        _recordTypeRevisions[recordType] = 1;
        emit RecordTypeAdmitted(
            SCHEMA_VERSION, recordType, familyId, authorizationClassMask, 1, msg.sender
        );
    }

    function setRecordFamilyGrant(
        bytes32 familyId,
        uint8 authorizationClass,
        address account,
        bool enabled
    ) external override onlyRoot {
        uint16 allowed = familyAllowedAuthorizationClassMask(familyId);
        if (allowed == 0) revert UnknownRecordFamily(familyId);
        _requireClass(authorizationClass);
        if (
            account == address(0) || familyRejectsAdminAuthority(familyId)
                || (allowed & _classBit(authorizationClass)) == 0
        ) {
            revert RecordFamilyGrantNotAllowed(familyId, authorizationClass, account);
        }
        bool oldEnabled = _familyGrants[familyId][authorizationClass][account];
        if (oldEnabled == enabled) {
            revert RecordFamilyGrantNoOp(familyId, authorizationClass, account, enabled);
        }
        uint64 revision =
            _nextRevision(_familyGrantRevisions[familyId][authorizationClass][account]);
        _familyGrants[familyId][authorizationClass][account] = enabled;
        _familyGrantRevisions[familyId][authorizationClass][account] = revision;
        emit RecordFamilyGrantUpdated(
            SCHEMA_VERSION, familyId, authorizationClass, account, enabled, revision, msg.sender
        );
    }

    function setAuthorityProvider(uint8 authorizationClass, address provider)
        external
        override
        onlyRoot
    {
        _requireProviderClass(authorizationClass);
        if (
            provider != address(0)
                && !StreamMetadataRenderer.supportsContractMarker(
                    provider,
                    IStreamRecordFamilyAuthorityProvider.isStreamRecordFamilyAuthorityProvider
                    .selector
                )
        ) {
            revert InvalidAuthorityProvider(authorizationClass, provider);
        }
        address oldProvider = _authorityProviders[authorizationClass];
        if (oldProvider == provider) revert AuthorityProviderNoOp(authorizationClass, provider);
        bytes32 providerCodeHash = provider.codehash;
        uint64 revision = _nextRevision(_authorityProviderRevisions[authorizationClass]);
        _authorityProviders[authorizationClass] = provider;
        _authorityProviderCodeHashes[authorizationClass] = providerCodeHash;
        _authorityProviderRevisions[authorizationClass] = revision;
        emit RecordFamilyAuthorityProviderUpdated(
            SCHEMA_VERSION,
            authorizationClass,
            oldProvider,
            provider,
            providerCodeHash,
            revision,
            msg.sender
        );
    }

    function requireRecordWriter(
        uint256 collectionId,
        bytes32 subjectId,
        bytes32 recordType,
        address actor,
        bytes calldata authorizationData
    ) external view override returns (uint8 authorizationClass) {
        RecordTypePolicy storage policy = _recordTypePolicies[recordType];
        if (!policy.admitted) revert RecordTypeNotAdmitted(recordType);
        uint16 mask = policy.authorizationClassMask;
        for (uint8 candidate = 1; candidate <= AUTHORIZATION_CLASS_GLOBAL_ADMIN; candidate++) {
            if ((mask & _classBit(candidate)) == 0) continue;
            if (
                candidate == AUTHORIZATION_CLASS_INDEPENDENT_ATTESTOR
                    || _familyGrants[policy.familyId][candidate][actor]
                    || _providerAuthorizes(
                        candidate, collectionId, subjectId, recordType, actor, authorizationData
                    )
            ) return candidate;
        }
        revert RecordFamilyUnauthorized(actor, recordType, policy.familyId, mask);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC165, IERC165)
        returns (bool)
    {
        return interfaceId == type(IStreamRecordFamilyRegistry).interfaceId
            || super.supportsInterface(interfaceId);
    }

    function _providerAuthorizes(
        uint8 authorizationClass,
        uint256 collectionId,
        bytes32 subjectId,
        bytes32 recordType,
        address actor,
        bytes calldata authorizationData
    ) private view returns (bool authorized) {
        address provider = _authorityProviders[authorizationClass];
        if (provider == address(0)) return false;
        bytes32 expectedCodeHash = _authorityProviderCodeHashes[authorizationClass];
        if (provider.codehash != expectedCodeHash) {
            revert AuthorityProviderCallFailed(authorizationClass, provider);
        }
        (bool ok, bytes memory result) = provider.staticcall(
            abi.encodeCall(
                IStreamRecordFamilyAuthorityProvider.isAuthorizedRecordWriter,
                (collectionId, subjectId, recordType, actor, authorizationData)
            )
        );
        if (!ok || result.length != 32) {
            revert AuthorityProviderCallFailed(authorizationClass, provider);
        }
        uint256 word = abi.decode(result, (uint256));
        if (word > 1) revert AuthorityProviderCallFailed(authorizationClass, provider);
        return word == 1;
    }

    function _requireClass(uint8 authorizationClass) private pure {
        if (authorizationClass == 0 || authorizationClass > AUTHORIZATION_CLASS_GLOBAL_ADMIN) {
            revert UnknownAuthorizationClass(authorizationClass);
        }
    }

    function _requireProviderClass(uint8 authorizationClass) private pure {
        if (
            authorizationClass != AUTHORIZATION_CLASS_ARTIST_SIGNER
                && authorizationClass != AUTHORIZATION_CLASS_OWNER_SIGNER
                && authorizationClass != AUTHORIZATION_CLASS_INSTITUTION_SIGNER
        ) revert UnknownAuthorizationClass(authorizationClass);
    }

    function _classBit(uint8 authorizationClass) private pure returns (uint16) {
        return uint16(1) << authorizationClass;
    }

    function _nextRevision(uint64 revision) private pure returns (uint64) {
        require(revision != type(uint64).max, "record family revision overflow");
        unchecked {
            return revision + 1;
        }
    }

    function _setRecordFamilyAdminContract(address admins) internal {
        _admins = IStreamAdmins(admins);
    }
}
