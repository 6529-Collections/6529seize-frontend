// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IStreamSplitWallet.sol";

/// @notice Interface for outside-Core primary revenue assignment resolution.
interface IStreamRevenueResolver {
    /// @notice Template entry before dynamic account sources are materialized.
    struct PrimaryTemplateEntry {
        address account;
        bytes32 accountSource;
        uint32 sharePpm;
        bytes32 labelId;
    }

    /// @notice Resolved assignment selected for a primary sale context.
    struct ResolvedPrimaryAssignment {
        bool exists;
        uint8 scope;
        uint256 scopeId;
        uint8 assignmentType;
        bytes32 profileId;
        bytes32 templateId;
        bytes32 policyHash;
        bytes32 assignmentHash;
        bool frozen;
    }

    /// @notice Reverts when a revenue class is zero.
    error InvalidRevenueClass(bytes32 revenueClass);
    /// @notice Reverts when an assignment scope is unsupported or has invalid identity.
    error InvalidAssignmentScope(uint8 scope, uint256 scopeId);
    /// @notice Reverts when an assignment type is unsupported.
    error InvalidAssignmentType(uint8 assignmentType);
    /// @notice Reverts when assignment evidence hash is zero.
    error InvalidPrimaryPolicyHash();
    /// @notice Reverts when a split profile is unknown or lacks a verified wallet.
    error UnverifiedSplitProfile(bytes32 profileId);
    /// @notice Reverts when a template entry is invalid.
    error InvalidPrimaryTemplateEntry(uint256 index);
    /// @notice Reverts when template shares do not sum to the share denominator.
    error InvalidPrimaryTemplateTotal(uint256 totalSharePpm);
    /// @notice Reverts when the template does not exist.
    error UnknownPrimaryTemplate(bytes32 templateId);
    /// @notice Reverts when a dynamic account source is unsupported.
    error UnsupportedAccountSource(bytes32 accountSource);
    /// @notice Reverts when a dynamic account source materializes to zero.
    error InvalidMaterializedAccount(bytes32 accountSource);
    /// @notice Reverts when a frozen assignment would be changed or cleared.
    error PrimaryAssignmentFrozen(bytes32 revenueClass, uint8 scope, uint256 scopeId);
    /// @notice Reverts when freezing a missing assignment.
    error PrimaryAssignmentMissing(bytes32 revenueClass, uint8 scope, uint256 scopeId);

    /// @notice Emitted once when a primary split template is created.
    event PrimaryTemplateCreated(
        bytes32 indexed templateId,
        bytes32 indexed entriesHash,
        bytes32 indexed metadataURIHash,
        uint16 schemaVersion,
        uint16 templateVersion
    );
    /// @notice Emitted for each canonical template entry.
    event PrimaryTemplateEntryRecorded(
        bytes32 indexed templateId,
        uint16 indexed index,
        address indexed account,
        bytes32 accountSource,
        uint32 sharePpm,
        bytes32 labelId
    );
    /// @notice Emitted when a primary assignment is set.
    event PrimaryAssignmentSet(
        bytes32 indexed revenueClass,
        uint8 indexed scope,
        uint256 indexed scopeId,
        uint8 assignmentType,
        bytes32 profileId,
        bytes32 templateId,
        bytes32 policyHash,
        bytes32 assignmentHash,
        address admin
    );
    /// @notice Emitted when a primary assignment is cleared.
    event PrimaryAssignmentCleared(
        bytes32 indexed revenueClass,
        uint8 indexed scope,
        uint256 indexed scopeId,
        bytes32 previousAssignmentHash,
        address admin
    );
    /// @notice Emitted when a primary assignment is frozen against later mutation.
    event PrimaryAssignmentFrozenEvent(
        bytes32 indexed revenueClass,
        uint8 indexed scope,
        uint256 indexed scopeId,
        bytes32 previousAssignmentHash,
        bytes32 frozenAssignmentHash,
        address admin
    );
    /// @notice Emitted when a dynamic template is materialized into a fixed split profile.
    event PrimaryTemplateMaterialized(
        bytes32 indexed templateId,
        bytes32 indexed profileId,
        address indexed wallet,
        bytes32 entriesHash,
        bytes32 metadataURIHash,
        address salePoster
    );

    /// @notice Default resolver scope.
    function SCOPE_DEFAULT() external pure returns (uint8);
    /// @notice Collection resolver scope.
    function SCOPE_COLLECTION() external pure returns (uint8);
    /// @notice Token resolver scope.
    function SCOPE_TOKEN() external pure returns (uint8);
    /// @notice Fixed split profile assignment type.
    function ASSIGNMENT_TYPE_PROFILE() external pure returns (uint8);
    /// @notice Dynamic primary template assignment type.
    function ASSIGNMENT_TYPE_TEMPLATE() external pure returns (uint8);
    /// @notice Dynamic account source for the poster attached to a sale.
    function ACCOUNT_SOURCE_SALE_POSTER() external pure returns (bytes32);
    /// @notice The split factory used to verify and materialize profiles.
    function splitFactory() external view returns (address);
    /// @notice Returns true for deployment validation.
    function isStreamRevenueResolver() external pure returns (bool);
    /// @notice Creates or reuses a primary split template.
    function createPrimaryTemplate(PrimaryTemplateEntry[] calldata entries, bytes32 metadataURIHash)
        external
        returns (bytes32 templateId);
    /// @notice Sets a fixed-profile primary assignment.
    function setPrimaryProfileAssignment(
        bytes32 revenueClass,
        uint8 scope,
        uint256 scopeId,
        bytes32 profileId,
        bytes32 policyHash
    ) external returns (bytes32 assignmentHash);
    /// @notice Sets a dynamic-template primary assignment.
    function setPrimaryTemplateAssignment(
        bytes32 revenueClass,
        uint8 scope,
        uint256 scopeId,
        bytes32 templateId,
        bytes32 policyHash
    ) external returns (bytes32 assignmentHash);
    /// @notice Clears a mutable primary assignment.
    function clearPrimaryAssignment(bytes32 revenueClass, uint8 scope, uint256 scopeId) external;
    /// @notice Freezes an existing primary assignment.
    function freezePrimaryAssignment(bytes32 revenueClass, uint8 scope, uint256 scopeId)
        external
        returns (bytes32 frozenAssignmentHash);
    /// @notice Resolves token, collection, then default primary assignment for a sale context.
    function resolvePrimaryAssignment(uint256 collectionId, uint256 tokenId, bytes32 revenueClass)
        external
        view
        returns (ResolvedPrimaryAssignment memory assignment);
    /// @notice Materializes a dynamic template into a deterministic split profile.
    function materializePrimaryProfile(bytes32 templateId, address salePoster)
        external
        returns (bytes32 profileId, address wallet, bytes32 entriesHash);
    /// @notice Returns deterministic template metadata.
    function primaryTemplate(bytes32 templateId)
        external
        view
        returns (bool exists, bytes32 entriesHash, bytes32 metadataURIHash);
    /// @notice Returns the number of canonical entries in a template.
    function primaryTemplateEntryCount(bytes32 templateId) external view returns (uint256);
    /// @notice Returns one canonical template entry.
    function primaryTemplateEntry(bytes32 templateId, uint256 index)
        external
        view
        returns (address account, bytes32 accountSource, uint32 sharePpm, bytes32 labelId);
    /// @notice Computes the current assignment hash for explicit inputs.
    function primaryAssignmentHash(
        bytes32 revenueClass,
        uint8 scope,
        uint256 scopeId,
        uint8 assignmentType,
        bytes32 profileId,
        bytes32 templateId,
        bytes32 policyHash,
        bool frozen
    ) external view returns (bytes32);
}
