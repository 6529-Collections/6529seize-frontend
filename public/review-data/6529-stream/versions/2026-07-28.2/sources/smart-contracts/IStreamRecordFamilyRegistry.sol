// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IERC165.sol";

/// @notice Closed-world record-type classifier and family-scoped writer authority.
interface IStreamRecordFamilyRegistry is IERC165 {
    struct RecordTypePolicy {
        bytes32 familyId;
        uint16 authorizationClassMask;
        bool admitted;
    }

    error RecordFamilyRegistryOwnerRequired(address caller);
    error UnknownRecordFamily(bytes32 familyId);
    error UnknownAuthorizationClass(uint8 authorizationClass);
    error InvalidAuthorizationClassMask(bytes32 familyId, uint16 supplied, uint16 allowed);
    error InvalidRecordType(bytes32 recordType);
    error RecordTypeAlreadyAdmitted(bytes32 recordType);
    error RecordTypeNotAdmitted(bytes32 recordType);
    error RecordFamilyGrantNotAllowed(bytes32 familyId, uint8 authorizationClass, address account);
    error RecordFamilyGrantNoOp(
        bytes32 familyId, uint8 authorizationClass, address account, bool enabled
    );
    error InvalidAuthorityProvider(uint8 authorizationClass, address provider);
    error AuthorityProviderNoOp(uint8 authorizationClass, address provider);
    error RecordFamilyUnauthorized(
        address actor, bytes32 recordType, bytes32 familyId, uint16 authorizationClassMask
    );
    error AuthorityProviderCallFailed(uint8 authorizationClass, address provider);

    event RecordTypeAdmitted(
        uint16 schemaVersion,
        bytes32 indexed recordType,
        bytes32 indexed familyId,
        uint16 authorizationClassMask,
        uint64 revision,
        address indexed authority
    );
    event RecordFamilyGrantUpdated(
        uint16 schemaVersion,
        bytes32 indexed familyId,
        uint8 indexed authorizationClass,
        address indexed account,
        bool enabled,
        uint64 revision,
        address authority
    );
    event RecordFamilyAuthorityProviderUpdated(
        uint16 schemaVersion,
        uint8 indexed authorizationClass,
        address indexed oldProvider,
        address indexed newProvider,
        bytes32 newProviderCodeHash,
        uint64 revision,
        address authority
    );

    function isStreamRecordFamilyRegistry() external pure returns (bool);
    function adminsContract() external view returns (address);
    function recordTypePolicy(bytes32 recordType) external view returns (RecordTypePolicy memory);
    function recordTypeRevision(bytes32 recordType) external view returns (uint64);
    function familyAllowedAuthorizationClassMask(bytes32 familyId) external pure returns (uint16);
    function familyRejectsAdminAuthority(bytes32 familyId) external pure returns (bool);
    function recordTypeRejectsAdminAuthority(bytes32 recordType) external view returns (bool);
    function recordFamilyGrant(bytes32 familyId, uint8 authorizationClass, address account)
        external
        view
        returns (bool enabled, uint64 revision);
    function authorityProvider(uint8 authorizationClass)
        external
        view
        returns (address provider, bytes32 providerCodeHash, uint64 revision);
    function admitRecordType(bytes32 recordType, bytes32 familyId, uint16 authorizationClassMask)
        external;
    function setRecordFamilyGrant(
        bytes32 familyId,
        uint8 authorizationClass,
        address account,
        bool enabled
    ) external;
    function setAuthorityProvider(uint8 authorizationClass, address provider) external;
    function requireRecordWriter(
        uint256 collectionId,
        bytes32 subjectId,
        bytes32 recordType,
        address actor,
        bytes calldata authorizationData
    ) external view returns (uint8 authorizationClass);
}
