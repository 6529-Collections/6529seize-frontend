// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IStreamRoleRegistry.sol";
import "../smart-contracts/StreamRoleRegistry.sol";
import "../smart-contracts/StreamRoles.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";

contract RoleHolderContractMock {
    // Deployed-code holder used by the [GOV-WINDOWS] rule 2 redundancy views.
    function ping() external pure returns (bool) {
        return true;
    }
}

contract StreamRoleRegistryTest is CharacterizationTestBase {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    event StreamRoleGranted(
        uint16 schemaVersion,
        bytes32 indexed role,
        address indexed holder,
        uint8 grantClass,
        address actor,
        bytes32 indexed actionId
    );

    event StreamRoleRevoked(
        uint16 schemaVersion,
        bytes32 indexed role,
        address indexed holder,
        uint8 grantClass,
        address actor,
        bytes32 indexed actionId
    );

    event RoleManagerUpdated(
        uint16 schemaVersion,
        address indexed account,
        bool enabled,
        address indexed admin,
        bytes32 configChainHash,
        uint64 configRevision,
        bytes32 indexed actionId
    );

    event RoleMutationCommitted(
        uint16 schemaVersion,
        bytes32 indexed role,
        address indexed holder,
        bool granted,
        bytes32 roleChainHash,
        uint64 roleRevision,
        bytes32 globalChainHash,
        uint64 globalRevision,
        bytes32 indexed actionId
    );

    StreamRoleRegistry private registry;

    address private roleManager = address(0x40A6);
    address private holder = address(0x101D);
    address private secondHolder = address(0x201D);
    address private stranger = address(0x5719);
    mapping(address => bool) private mockProposers;
    address private mockGovernanceRoot;
    bool private mockExecuting;
    bytes32 private mockActionId;
    uint8 private mockActionClass;
    bytes32 private mockScopeHash;
    bytes32 private mockOldStateHash;
    bytes32 private mockNewStateHash;

    bytes4 private constant ROLE_REGISTRY_INTERFACE_ID = 0xd77ee305;
    bytes32 private constant ROLE_MUTATION_SCOPE_V1 =
        keccak256("6529STREAM_ROLE_MUTATION_SCOPE_V1");
    bytes32 private constant ROLE_MUTATION_STATE_V1 =
        keccak256("6529STREAM_ROLE_MUTATION_STATE_V1");
    bytes32 private constant ROLE_MUTATION_RECORD_V1 = keccak256("6529STREAM_ROLE_MUTATION_V1");
    bytes32 private constant GLOBAL_ROLE_MUTATION_RECORD_V1 =
        keccak256("6529STREAM_GLOBAL_ROLE_MUTATION_V1");
    bytes32 private constant ROLE_MANAGER_CONFIG_V1 =
        keccak256("6529STREAM_ROLE_MANAGER_CONFIG_V1");
    bytes32 private constant ROLE_MANAGER_CONFIG_STATE_V1 =
        keccak256("6529STREAM_ROLE_MANAGER_CONFIG_STATE_V1");
    bytes32 private constant ROLE_MANAGER_CONFIG_MUTATION_V1 =
        keccak256("6529STREAM_ROLE_MANAGER_CONFIG_MUTATION_V1");
    bytes32 private constant STREAM_ROLE_GRANTED_TOPIC =
        keccak256("StreamRoleGranted(uint16,bytes32,address,uint8,address,bytes32)");
    bytes32 private constant STREAM_ROLE_REVOKED_TOPIC =
        keccak256("StreamRoleRevoked(uint16,bytes32,address,uint8,address,bytes32)");
    bytes32 private constant ROLE_MANAGER_UPDATED_TOPIC =
        keccak256("RoleManagerUpdated(uint16,address,bool,address,bytes32,uint64,bytes32)");
    bytes32 private constant ROLE_MUTATION_COMMITTED_TOPIC = keccak256(
        "RoleMutationCommitted(uint16,bytes32,address,bool,bytes32,uint64,bytes32,uint64,bytes32)"
    );

    function currentAction()
        external
        view
        returns (
            bool executing,
            bytes32 actionId,
            uint8 actionClass,
            bytes32 scopeHash,
            bytes32 oldValueHash,
            bytes32 newValueHash
        )
    {
        return (
            mockExecuting,
            mockActionId,
            mockActionClass,
            mockScopeHash,
            mockOldStateHash,
            mockNewStateHash
        );
    }

    function isProposer(address account) external view returns (bool) {
        return mockProposers[account];
    }

    function governanceRootState()
        external
        view
        returns (address governanceRoot, bytes32 codeHash, uint64 revision)
    {
        governanceRoot = mockGovernanceRoot;
        codeHash = governanceRoot.codehash;
        revision = governanceRoot == address(0) ? 0 : 1;
    }

    function setUp() public {
        registry = new StreamRoleRegistry(address(this));
        _rootRegisterRoleManager(roleManager, true);
    }

    function testERC165PinsExactRoleRegistryInterface() public view {
        require(
            type(IStreamRoleRegistry).interfaceId == ROLE_REGISTRY_INTERFACE_ID,
            "role registry interface id"
        );
        require(
            IStreamRoleRegistry.registerRoleManager.selector == bytes4(0x148fed8e),
            "role manager writer selector"
        );
        require(registry.supportsInterface(ROLE_REGISTRY_INTERFACE_ID), "role registry interface");
        require(registry.supportsInterface(0x01ffc9a7), "erc165 interface");
        require(!registry.supportsInterface(0xffffffff), "invalid interface must be false");
    }

    function testGrantClassVocabulary() public {
        // Root-class rows of the [GOV-ROLES] table.
        _assertRoot(StreamRoles.ROLE_PAUSE_GUARDIAN, "ROLE_PAUSE_GUARDIAN");
        _assertRoot(StreamRoles.ROLE_UNPAUSE, "ROLE_UNPAUSE");
        _assertRoot(StreamRoles.ROLE_COLLECTION_FINALITY_ADMIN, "ROLE_COLLECTION_FINALITY_ADMIN");
        _assertRoot(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, "ROLE_TERMINAL_FREEZE_VETO");
        _assertRoot(StreamRoles.ROLE_ATTRIBUTION_ARBITER, "ROLE_ATTRIBUTION_ARBITER");
        _assertRoot(StreamRoles.ROLE_ARTIST_DORMANCY_ADMIN, "ROLE_ARTIST_DORMANCY_ADMIN");
        _assertRoot(StreamRoles.ROLE_ATTRIBUTION_APPEAL, "ROLE_ATTRIBUTION_APPEAL");
        _assertRoot(StreamRoles.ROLE_EMERGENCY_RECIPIENT, "ROLE_EMERGENCY_RECIPIENT");
        _assertRoot(StreamRoles.ROLE_TREASURY, "ROLE_TREASURY");
        // Operational-class rows.
        _assertOperational(
            StreamRoles.ROLE_ENTROPY_INCIDENT_DECLARER, "ROLE_ENTROPY_INCIDENT_DECLARER"
        );
        _assertOperational(StreamRoles.ROLE_ENTROPY_REVEAL_OWNER, "ROLE_ENTROPY_REVEAL_OWNER");
        _assertOperational(StreamRoles.ROLE_ARTIST_REGISTRY_ADMIN, "ROLE_ARTIST_REGISTRY_ADMIN");
        _assertOperational(StreamRoles.ROLE_FIXITY_OPERATOR, "ROLE_FIXITY_OPERATOR");
        _assertOperational(StreamRoles.ROLE_EXPORT_PUBLISHER, "ROLE_EXPORT_PUBLISHER");
        _assertOperational(StreamRoles.ROLE_CLAIM_ROUTER_OPERATOR, "ROLE_CLAIM_ROUTER_OPERATOR");
        _assertOperational(StreamRoles.ROLE_ENTROPY_ADMIN, "ROLE_ENTROPY_ADMIN");
    }

    function _assertRoot(bytes32 role, string memory label) private {
        registry.isKnownRole(role).assertTrue(label);
        uint256(registry.roleGrantClass(role))
            .assertEq(uint256(StreamRoles.GRANT_CLASS_ROOT), label);
    }

    function _assertOperational(bytes32 role, string memory label) private {
        registry.isKnownRole(role).assertTrue(label);
        uint256(registry.roleGrantClass(role))
            .assertEq(uint256(StreamRoles.GRANT_CLASS_OPERATIONAL), label);
    }

    function testUnknownRoleIsClosedWorld() public {
        bytes32 madeUp = keccak256("ROLE_MADE_UP");
        registry.isKnownRole(madeUp).assertFalse("made-up role unknown");
        vm.expectRevert(abi.encodeWithSelector(IStreamRoleRegistry.UnknownRole.selector, madeUp));
        registry.grantRole(madeUp, holder);
        vm.expectRevert(abi.encodeWithSelector(IStreamRoleRegistry.UnknownRole.selector, madeUp));
        registry.roleGrantClass(madeUp);
    }

    function testRootRoleGrantAuthority() public {
        // Owner grants and the event carries the grant class.
        _setRoleGovernanceContext(StreamRoles.ROLE_TREASURY, holder, false, true);
        vm.expectEmit(true, true, true, true);
        emit StreamRoleGranted(
            1,
            StreamRoles.ROLE_TREASURY,
            holder,
            StreamRoles.GRANT_CLASS_ROOT,
            address(this),
            mockActionId
        );
        registry.grantRole(StreamRoles.ROLE_TREASURY, holder);
        _clearRoleGovernanceContext();
        registry.hasRole(StreamRoles.ROLE_TREASURY, holder).assertTrue("root role granted");

        // Role managers cannot grant root-class roles.
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.RoleActorNotAuthorized.selector,
                StreamRoles.ROLE_TREASURY,
                roleManager
            )
        );
        vm.prank(roleManager);
        registry.grantRole(StreamRoles.ROLE_TREASURY, secondHolder);

        // Nor can they revoke them.
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.RoleActorNotAuthorized.selector,
                StreamRoles.ROLE_TREASURY,
                roleManager
            )
        );
        vm.prank(roleManager);
        registry.revokeRole(StreamRoles.ROLE_TREASURY, holder);
    }

    function testOperationalRoleGrantAuthority() public {
        // Role manager grants operational-class roles.
        vm.prank(roleManager);
        registry.grantRole(StreamRoles.ROLE_EXPORT_PUBLISHER, holder);
        registry.hasRole(StreamRoles.ROLE_EXPORT_PUBLISHER, holder)
            .assertTrue("operational role granted by manager");

        // Strangers cannot.
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.RoleActorNotAuthorized.selector,
                StreamRoles.ROLE_EXPORT_PUBLISHER,
                stranger
            )
        );
        vm.prank(stranger);
        registry.grantRole(StreamRoles.ROLE_EXPORT_PUBLISHER, secondHolder);

        // Manager revoke works and events.
        vm.expectEmit(true, true, true, true);
        emit StreamRoleRevoked(
            1,
            StreamRoles.ROLE_EXPORT_PUBLISHER,
            holder,
            StreamRoles.GRANT_CLASS_OPERATIONAL,
            roleManager,
            bytes32(0)
        );
        vm.prank(roleManager);
        registry.revokeRole(StreamRoles.ROLE_EXPORT_PUBLISHER, holder);
        registry.hasRole(StreamRoles.ROLE_EXPORT_PUBLISHER, holder).assertFalse("revoked");
    }

    function testGovernedBaseAndScopedRoleEventsCarryExactActionId() public {
        bytes32 baseRole = StreamRoles.ROLE_TREASURY;

        _setRoleGovernanceContext(baseRole, holder, false, true);
        bytes32 grantActionId = mockActionId;
        require(grantActionId != bytes32(0), "governed base grant action");
        vm.recordLogs();
        registry.grantRole(baseRole, holder);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        _assertRoleMutationLogs(
            logs,
            baseRole,
            holder,
            true,
            StreamRoles.GRANT_CLASS_ROOT,
            address(this),
            grantActionId,
            STREAM_ROLE_GRANTED_TOPIC
        );
        _clearRoleGovernanceContext();

        _setRoleGovernanceContext(baseRole, holder, true, false);
        bytes32 revokeActionId = mockActionId;
        require(revokeActionId != bytes32(0), "governed base revoke action");
        vm.recordLogs();
        registry.revokeRole(baseRole, holder);
        logs = vm.getRecordedLogs();
        _assertRoleMutationLogs(
            logs,
            baseRole,
            holder,
            false,
            StreamRoles.GRANT_CLASS_ROOT,
            address(this),
            revokeActionId,
            STREAM_ROLE_REVOKED_TOPIC
        );
        _clearRoleGovernanceContext();

        RoleHolderContractMock scopedGuardian = new RoleHolderContractMock();
        address scopedHolder = address(scopedGuardian);
        bytes32 scopeHash = keccak256("event-attribution-scope");
        bytes32 scopedRole = registry.scopedRole(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scopeHash);

        _setRoleGovernanceContext(scopedRole, scopedHolder, false, true);
        grantActionId = mockActionId;
        require(grantActionId != bytes32(0), "governed scoped grant action");
        vm.recordLogs();
        registry.grantScopedRole(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scopeHash, scopedHolder);
        logs = vm.getRecordedLogs();
        _assertRoleMutationLogs(
            logs,
            scopedRole,
            scopedHolder,
            true,
            StreamRoles.GRANT_CLASS_ROOT,
            address(this),
            grantActionId,
            STREAM_ROLE_GRANTED_TOPIC
        );
        _clearRoleGovernanceContext();

        _setRoleGovernanceContext(scopedRole, scopedHolder, true, false);
        revokeActionId = mockActionId;
        require(revokeActionId != bytes32(0), "governed scoped revoke action");
        vm.recordLogs();
        registry.revokeScopedRole(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scopeHash, scopedHolder);
        logs = vm.getRecordedLogs();
        _assertRoleMutationLogs(
            logs,
            scopedRole,
            scopedHolder,
            false,
            StreamRoles.GRANT_CLASS_ROOT,
            address(this),
            revokeActionId,
            STREAM_ROLE_REVOKED_TOPIC
        );
        _clearRoleGovernanceContext();
    }

    function testOperationalManagerRoleEventsUseZeroActionIdSentinel() public {
        bytes32 role = StreamRoles.ROLE_EXPORT_PUBLISHER;

        vm.recordLogs();
        vm.prank(roleManager);
        registry.grantRole(role, holder);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        _assertRoleMutationLogs(
            logs,
            role,
            holder,
            true,
            StreamRoles.GRANT_CLASS_OPERATIONAL,
            roleManager,
            bytes32(0),
            STREAM_ROLE_GRANTED_TOPIC
        );

        vm.recordLogs();
        vm.prank(roleManager);
        registry.revokeRole(role, holder);
        logs = vm.getRecordedLogs();
        _assertRoleMutationLogs(
            logs,
            role,
            holder,
            false,
            StreamRoles.GRANT_CLASS_OPERATIONAL,
            roleManager,
            bytes32(0),
            STREAM_ROLE_REVOKED_TOPIC
        );
    }

    function testRoleManagerEventsCarryExactGovernanceActionId() public {
        _setRoleManagerGovernanceContext(roleManager, true, false);
        bytes32 actionId = mockActionId;
        require(actionId != bytes32(0), "manager update action");

        vm.recordLogs();
        registry.registerRoleManager(roleManager, false);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        logs.length.assertEq(2, "manager update event count");
        _assertRoleMutationLog(logs[0], ROLE_MANAGER_CONFIG_V1, roleManager, false, actionId);
        _assertRoleManagerUpdatedLog(logs[1], roleManager, false, actionId);
        _clearRoleGovernanceContext();
    }

    function testGrantValidation() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.ZeroRoleHolder.selector, StreamRoles.ROLE_TREASURY
            )
        );
        registry.grantRole(StreamRoles.ROLE_TREASURY, address(0));

        _rootGrant(StreamRoles.ROLE_TREASURY, holder);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.RoleAlreadyGranted.selector, StreamRoles.ROLE_TREASURY, holder
            )
        );
        registry.grantRole(StreamRoles.ROLE_TREASURY, holder);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.RoleNotGranted.selector, StreamRoles.ROLE_TREASURY, secondHolder
            )
        );
        registry.revokeRole(StreamRoles.ROLE_TREASURY, secondHolder);
    }

    function testHolderEnumerationSwapRemove() public {
        address third = address(0x301D);
        _rootGrant(StreamRoles.ROLE_TREASURY, holder);
        _rootGrant(StreamRoles.ROLE_TREASURY, secondHolder);
        _rootGrant(StreamRoles.ROLE_TREASURY, third);
        registry.roleHolderCount(StreamRoles.ROLE_TREASURY).assertEq(3, "three holders");
        registry.roleHolderAt(StreamRoles.ROLE_TREASURY, 0).assertEq(holder, "index 0");
        registry.roleHolderAt(StreamRoles.ROLE_TREASURY, 1).assertEq(secondHolder, "index 1");
        registry.roleHolderAt(StreamRoles.ROLE_TREASURY, 2).assertEq(third, "index 2");

        // Swap-remove keeps the enumeration dense and index-consistent.
        _rootRevoke(StreamRoles.ROLE_TREASURY, holder);
        registry.roleHolderCount(StreamRoles.ROLE_TREASURY).assertEq(2, "two holders");
        registry.roleHolderAt(StreamRoles.ROLE_TREASURY, 0).assertEq(third, "moved holder");
        registry.roleHolderAt(StreamRoles.ROLE_TREASURY, 1).assertEq(secondHolder, "stable");
        registry.hasRole(StreamRoles.ROLE_TREASURY, holder).assertFalse("revoked gone");
        registry.hasRole(StreamRoles.ROLE_TREASURY, third).assertTrue("moved still holds");

        // Re-grant and re-revoke through the moved index stays consistent.
        _rootRevoke(StreamRoles.ROLE_TREASURY, third);
        registry.roleHolderAt(StreamRoles.ROLE_TREASURY, 0).assertEq(secondHolder, "compacted");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.RoleHolderIndexOutOfBounds.selector,
                StreamRoles.ROLE_TREASURY,
                1
            )
        );
        registry.roleHolderAt(StreamRoles.ROLE_TREASURY, 1);
    }

    function testResolveRoleRequiresExactlyOneHolder() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.RoleUnresolved.selector, StreamRoles.ROLE_TREASURY
            )
        );
        registry.resolveRole(StreamRoles.ROLE_TREASURY);

        _rootGrant(StreamRoles.ROLE_TREASURY, holder);
        registry.resolveRole(StreamRoles.ROLE_TREASURY).assertEq(holder, "single holder");

        _rootGrant(StreamRoles.ROLE_TREASURY, secondHolder);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.AmbiguousRoleResolution.selector, StreamRoles.ROLE_TREASURY, 2
            )
        );
        registry.resolveRole(StreamRoles.ROLE_TREASURY);
    }

    function testEmergencyRecipientResolvesThroughRegistry() public {
        // ADR 0004 [GOV-ROLES]: never a stored raw address; unset resolution
        // reverts instead of defaulting to a deployer or owner.
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.RoleUnresolved.selector, StreamRoles.ROLE_EMERGENCY_RECIPIENT
            )
        );
        registry.emergencyRecipient();

        _rootGrant(StreamRoles.ROLE_EMERGENCY_RECIPIENT, holder);
        registry.emergencyRecipient().assertEq(holder, "resolved through role registry");

        // Rotation is a role mutation, not an address write.
        _rootRevoke(StreamRoles.ROLE_EMERGENCY_RECIPIENT, holder);
        _rootGrant(StreamRoles.ROLE_EMERGENCY_RECIPIENT, secondHolder);
        registry.emergencyRecipient().assertEq(secondHolder, "rotated holder");
    }

    function testPauseUnpauseDisjointness() public {
        // [GOV-WINDOWS] rule 3: pause guardians cannot unpause and unpause
        // holders cannot pause.
        _rootGrant(StreamRoles.ROLE_PAUSE_GUARDIAN, holder);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.DisjointRoleConflict.selector,
                StreamRoles.ROLE_UNPAUSE,
                StreamRoles.ROLE_PAUSE_GUARDIAN,
                holder
            )
        );
        registry.grantRole(StreamRoles.ROLE_UNPAUSE, holder);

        _rootGrant(StreamRoles.ROLE_UNPAUSE, secondHolder);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.DisjointRoleConflict.selector,
                StreamRoles.ROLE_PAUSE_GUARDIAN,
                StreamRoles.ROLE_UNPAUSE,
                secondHolder
            )
        );
        registry.grantRole(StreamRoles.ROLE_PAUSE_GUARDIAN, secondHolder);
    }

    function testRoleRedundancyViews() public {
        bytes32 role = StreamRoles.ROLE_PAUSE_GUARDIAN;
        (uint256 count, uint256 contractCount) = registry.roleRedundancy(role);
        count.assertEq(0, "no holders yet");
        contractCount.assertEq(0, "no contract holders yet");
        registry.isRoleRedundant(role).assertFalse("empty role not redundant");

        // Two EOA-class holders fail the no-single-signer-EOA requirement.
        _rootGrant(role, holder);
        _rootGrant(role, secondHolder);
        (count, contractCount) = registry.roleRedundancy(role);
        count.assertEq(2, "two holders");
        contractCount.assertEq(0, "no code observed");
        registry.isRoleRedundant(role).assertFalse("EOA holders not redundant");

        // Two independently controlled contract holders satisfy the floor.
        _rootRevoke(role, holder);
        _rootRevoke(role, secondHolder);
        RoleHolderContractMock safeA = new RoleHolderContractMock();
        RoleHolderContractMock safeB = new RoleHolderContractMock();
        _rootGrant(role, address(safeA));
        (uint256 oneCount, uint256 oneContract) = registry.roleRedundancy(role);
        oneCount.assertEq(1, "one holder");
        oneContract.assertEq(1, "one contract holder");
        registry.isRoleRedundant(role).assertFalse("single holder not redundant");

        _rootGrant(role, address(safeB));
        registry.isRoleRedundant(role).assertTrue("two contract holders redundant");

        // A mixed set with any code-less holder fails.
        _rootGrant(role, holder);
        registry.isRoleRedundant(role).assertFalse("mixed set with EOA fails");
    }

    function testDelegatedEOADoesNotSatisfyContractHolderClassification() public {
        RoleHolderContractMock delegate = new RoleHolderContractMock();
        RoleHolderContractMock contractHolder = new RoleHolderContractMock();
        address delegatedEOA = address(0x7702);
        vm.etch(delegatedEOA, abi.encodePacked(hex"ef0100", address(delegate)));
        delegatedEOA.code.length.assertEq(23, "exact EIP-7702 designation length");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.InvalidGovernanceExecutor.selector, delegatedEOA
            )
        );
        new StreamRoleRegistry(delegatedEOA);

        // Non-terminal roles may still be held by an EOA, but the emergency
        // redundancy view must not misclassify its designation as contract
        // custody.
        _rootGrant(StreamRoles.ROLE_PAUSE_GUARDIAN, delegatedEOA);
        _rootGrant(StreamRoles.ROLE_PAUSE_GUARDIAN, address(contractHolder));
        (uint256 holderCount, uint256 contractHolderCount) =
            registry.roleRedundancy(StreamRoles.ROLE_PAUSE_GUARDIAN);
        holderCount.assertEq(2, "both nominal holders enumerated");
        contractHolderCount.assertEq(1, "delegated EOA excluded from contract holders");
        registry.isRoleRedundant(StreamRoles.ROLE_PAUSE_GUARDIAN)
            .assertFalse("delegated EOA cannot satisfy redundancy");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.TerminalFreezeVetoGuardianDelegatedEOA.selector, delegatedEOA
            )
        );
        registry.grantRole(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, delegatedEOA);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.TerminalFreezeVetoGuardianDelegatedEOA.selector, delegatedEOA
            )
        );
        registry.grantScopedRole(
            StreamRoles.ROLE_TERMINAL_FREEZE_VETO, keccak256("delegated-eoa-scope"), delegatedEOA
        );
    }

    function testRoleManagerRegistration() public {
        registry.isRoleManager(roleManager).assertTrue("manager registered");
        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        vm.prank(stranger);
        registry.registerRoleManager(stranger, true);

        _rootRegisterRoleManager(roleManager, false);
        registry.isRoleManager(roleManager).assertFalse("manager removed");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.RoleActorNotAuthorized.selector,
                StreamRoles.ROLE_EXPORT_PUBLISHER,
                roleManager
            )
        );
        vm.prank(roleManager);
        registry.grantRole(StreamRoles.ROLE_EXPORT_PUBLISHER, holder);
    }

    function testExecutorOwnedRoleMutationRequiresExactGovernanceContext() public {
        bytes32 role = StreamRoles.ROLE_TREASURY;

        vm.expectRevert(
            abi.encodeWithSelector(IStreamRoleRegistry.RoleGovernanceActionNotExecuting.selector)
        );
        registry.grantRole(role, holder);

        _setRoleGovernanceContext(role, holder, false, true);
        mockActionId = bytes32(0);
        vm.expectRevert(
            abi.encodeWithSelector(IStreamRoleRegistry.RoleGovernanceActionIdZero.selector)
        );
        registry.grantRole(role, holder);

        _setRoleGovernanceContext(role, holder, false, true);
        mockActionClass = 0;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.RoleGovernanceActionClassMismatch.selector, 1, 0
            )
        );
        registry.grantRole(role, holder);

        _setRoleGovernanceContext(role, holder, false, true);
        bytes32 expectedScopeHash = mockScopeHash;
        mockScopeHash = keccak256("wrong-role-scope");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.RoleGovernanceScopeHashMismatch.selector,
                expectedScopeHash,
                mockScopeHash
            )
        );
        registry.grantRole(role, holder);

        _setRoleGovernanceContext(role, holder, false, true);
        bytes32 expectedOldStateHash = mockOldStateHash;
        mockOldStateHash = keccak256("wrong-role-old-state");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.RoleGovernanceOldStateHashMismatch.selector,
                expectedOldStateHash,
                mockOldStateHash
            )
        );
        registry.grantRole(role, holder);

        _setRoleGovernanceContext(role, holder, false, true);
        bytes32 expectedNewStateHash = mockNewStateHash;
        mockNewStateHash = keccak256("wrong-role-new-state");
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.RoleGovernanceNewStateHashMismatch.selector,
                expectedNewStateHash,
                mockNewStateHash
            )
        );
        registry.grantRole(role, holder);

        _rootGrant(role, holder);
        registry.hasRole(role, holder).assertTrue("exact context grant");
    }

    function testDirectOperationalMutationInvalidatesStaleRootContext() public {
        bytes32 rootRole = StreamRoles.ROLE_TREASURY;
        _rootGrant(rootRole, holder);
        _setRoleGovernanceContext(rootRole, holder, true, false);
        bytes32 staleOldStateHash = mockOldStateHash;

        vm.prank(roleManager);
        registry.grantRole(StreamRoles.ROLE_EXPORT_PUBLISHER, secondHolder);

        _setRoleGovernanceContext(rootRole, holder, true, false);
        bytes32 currentOldStateHash = mockOldStateHash;
        mockOldStateHash = staleOldStateHash;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.RoleGovernanceOldStateHashMismatch.selector,
                currentOldStateHash,
                staleOldStateHash
            )
        );
        registry.revokeRole(rootRole, holder);
        _clearRoleGovernanceContext();
        _rootRevoke(rootRole, holder);
    }

    function testRoleManagerConfigIsVersionedAndRejectsNoOp() public {
        (bytes32 initialChain, uint64 initialRevision) =
            registry.roleMutationState(ROLE_MANAGER_CONFIG_V1);
        (bytes32 initialAccountChain, uint64 initialAccountRevision) =
            registry.roleManagerConfigMutationState(roleManager);
        require(initialChain != bytes32(0), "initial manager chain");
        require(initialAccountChain != bytes32(0), "initial account manager chain");
        uint256(initialRevision).assertEq(1, "initial manager revision");
        uint256(initialAccountRevision).assertEq(1, "initial account manager revision");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.RoleManagerConfigNoOp.selector, roleManager, true
            )
        );
        registry.registerRoleManager(roleManager, true);

        _rootRegisterRoleManager(roleManager, false);
        (bytes32 disabledChain, uint64 disabledRevision) =
            registry.roleMutationState(ROLE_MANAGER_CONFIG_V1);
        (bytes32 disabledAccountChain, uint64 disabledAccountRevision) =
            registry.roleManagerConfigMutationState(roleManager);
        require(disabledChain != initialChain, "manager chain advanced");
        require(disabledAccountChain != initialAccountChain, "account manager chain advanced");
        uint256(disabledRevision).assertEq(2, "disabled manager revision");
        uint256(disabledAccountRevision).assertEq(2, "disabled account manager revision");
    }

    function testCompromisedManagerCannotCensorImmediateRemovalByAdvancingGlobalChain() public {
        _setRoleManagerGovernanceContext(roleManager, true, false);
        (bytes32 priorGlobalChain, uint64 priorGlobalRevision) = registry.globalRoleMutationState();

        vm.prank(roleManager);
        registry.grantRole(StreamRoles.ROLE_EXPORT_PUBLISHER, holder);
        (bytes32 advancedGlobalChain, uint64 advancedGlobalRevision) =
            registry.globalRoleMutationState();
        require(advancedGlobalChain != priorGlobalChain, "manager must advance global chain");
        uint256(advancedGlobalRevision)
            .assertEq(uint256(priorGlobalRevision) + 1, "manager must advance global revision");

        // The already-committed removal remains executable because its exact
        // state is scoped to the manager-config pseudo-role chain, which the
        // compromised manager cannot mutate.
        registry.registerRoleManager(roleManager, false);
        registry.isRoleManager(roleManager).assertFalse("manager removed despite front-run");

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.RoleActorNotAuthorized.selector,
                StreamRoles.ROLE_EXPORT_PUBLISHER,
                roleManager
            )
        );
        vm.prank(roleManager);
        registry.revokeRole(StreamRoles.ROLE_EXPORT_PUBLISHER, holder);
    }

    function testRoleManagerEnableIsDelayedAndDisableIsImmediate() public {
        _setRoleManagerGovernanceContext(roleManager, true, false);
        mockActionClass = 1;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.RoleGovernanceActionClassMismatch.selector, uint8(0), uint8(1)
            )
        );
        registry.registerRoleManager(roleManager, false);

        _setRoleManagerGovernanceContext(roleManager, true, false);
        registry.registerRoleManager(roleManager, false);

        _setRoleManagerGovernanceContext(roleManager, false, true);
        mockActionClass = 0;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.RoleGovernanceActionClassMismatch.selector, uint8(1), uint8(0)
            )
        );
        registry.registerRoleManager(roleManager, true);
    }

    function testManagerRemovalCommitmentsAreIndependentAcrossAccounts() public {
        address secondManager = address(0x40A7);
        _rootRegisterRoleManager(secondManager, true);

        _setRoleManagerGovernanceContext(roleManager, true, false);
        bytes32 firstActionId = mockActionId;
        bytes32 firstScopeHash = mockScopeHash;
        bytes32 firstOldStateHash = mockOldStateHash;
        bytes32 firstNewStateHash = mockNewStateHash;

        _setRoleManagerGovernanceContext(secondManager, true, false);
        registry.registerRoleManager(secondManager, false);
        registry.isRoleManager(secondManager).assertFalse("second manager removed first");

        // Removing another manager advances the shared audit chains but cannot
        // invalidate this account-scoped removal commitment.
        mockExecuting = true;
        mockActionId = firstActionId;
        mockActionClass = 0;
        mockScopeHash = firstScopeHash;
        mockOldStateHash = firstOldStateHash;
        mockNewStateHash = firstNewStateHash;
        registry.registerRoleManager(roleManager, false);
        registry.isRoleManager(roleManager).assertFalse("first manager removal remains live");
    }

    // ------------------------------------------- FIX B: per-scope veto roles

    function testScopableRoleVocabularyIsClosed() public {
        // Only ROLE_TERMINAL_FREEZE_VETO is scopable today.
        registry.isScopableRole(StreamRoles.ROLE_TERMINAL_FREEZE_VETO)
            .assertTrue("terminal-freeze veto scopable");
        registry.isScopableRole(StreamRoles.ROLE_TREASURY).assertFalse("treasury not scopable");
        registry.isScopableRole(StreamRoles.ROLE_PAUSE_GUARDIAN)
            .assertFalse("pause guardian not scopable");
    }

    function testScopedRoleDerivationAndGrant() public {
        RoleHolderContractMock scopedGuardian = new RoleHolderContractMock();
        address scopedHolder = address(scopedGuardian);
        bytes32 scope = keccak256("freeze-scope");
        bytes32 derived = registry.scopedRole(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scope);
        derived.assertEq(
            keccak256(abi.encode(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scope)),
            "scoped role derivation"
        );

        // A closed-world direct grant of the derived key reverts (it is not a
        // base vocabulary member); the scoped API is the only path.
        vm.expectRevert(abi.encodeWithSelector(IStreamRoleRegistry.UnknownRole.selector, derived));
        registry.grantRole(derived, holder);

        // Root-class scoped grant is owner-only.
        _rootGrantScoped(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scope, scopedHolder);
        registry.hasRole(derived, scopedHolder).assertTrue("scoped role granted");
        registry.roleHolderCount(derived).assertEq(1, "scoped holder count");
        registry.roleHolderAt(derived, 0).assertEq(scopedHolder, "scoped holder enumerated");

        // A different scope is a distinct role.
        registry.hasRole(
                registry.scopedRole(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, keccak256("other")),
                scopedHolder
            ).assertFalse("other scope not granted");

        // Revoke through the scoped API.
        _rootRevokeScoped(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scope, scopedHolder);
        registry.hasRole(derived, scopedHolder).assertFalse("scoped role revoked");
    }

    function testTerminalVetoMembershipTracksBaseAndScopedAtoBtoA() public {
        RoleHolderContractMock guardian = new RoleHolderContractMock();
        address account = address(guardian);
        bytes32 scopeA = keccak256("scope-a");
        bytes32 scopeB = keccak256("scope-b");

        _rootGrantScoped(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scopeA, account);
        registry.terminalFreezeVetoMembershipCount(account).assertEq(1, "A count");
        registry.hasAnyTerminalFreezeVetoRole(account).assertTrue("A aggregate");

        _rootGrantScoped(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scopeB, account);
        registry.terminalFreezeVetoMembershipCount(account).assertEq(2, "A+B count");
        _rootRevokeScoped(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scopeA, account);
        registry.terminalFreezeVetoMembershipCount(account).assertEq(1, "B count");
        _rootGrantScoped(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scopeA, account);
        registry.terminalFreezeVetoMembershipCount(account).assertEq(2, "B+A count");

        _rootRevokeScoped(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scopeB, account);
        _rootRevokeScoped(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scopeA, account);
        registry.terminalFreezeVetoMembershipCount(account).assertEq(0, "empty count");
        registry.hasAnyTerminalFreezeVetoRole(account).assertFalse("empty aggregate");
    }

    function testTerminalVetoGrantRejectsProposerAndGovernanceRootBaseAndScoped() public {
        RoleHolderContractMock proposerGuardian = new RoleHolderContractMock();
        address proposer = address(proposerGuardian);
        mockProposers[proposer] = true;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.GovernanceIdentityRoleOverlap.selector,
                proposer,
                StreamRoles.ROLE_TERMINAL_FREEZE_VETO
            )
        );
        registry.grantRole(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, proposer);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.GovernanceIdentityRoleOverlap.selector,
                proposer,
                StreamRoles.ROLE_TERMINAL_FREEZE_VETO
            )
        );
        registry.grantScopedRole(
            StreamRoles.ROLE_TERMINAL_FREEZE_VETO, keccak256("proposer-scope"), proposer
        );

        RoleHolderContractMock rootGuardian = new RoleHolderContractMock();
        address root = address(rootGuardian);
        mockGovernanceRoot = root;
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.GovernanceIdentityRoleOverlap.selector,
                root,
                StreamRoles.ROLE_TERMINAL_FREEZE_VETO
            )
        );
        registry.grantRole(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, root);
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.GovernanceIdentityRoleOverlap.selector,
                root,
                StreamRoles.ROLE_TERMINAL_FREEZE_VETO
            )
        );
        registry.grantScopedRole(
            StreamRoles.ROLE_TERMINAL_FREEZE_VETO, keccak256("root-scope"), root
        );
    }

    function testScopedGrantRejectsNonScopableBaseAndUnauthorized() public {
        bytes32 scope = keccak256("scope");
        // Non-scopable base reverts UnknownRole.
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.UnknownRole.selector, StreamRoles.ROLE_TREASURY
            )
        );
        registry.grantScopedRole(StreamRoles.ROLE_TREASURY, scope, holder);

        // Root-class scoped grants are owner-only: a role manager cannot.
        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamRoleRegistry.RoleActorNotAuthorized.selector,
                StreamRoles.ROLE_TERMINAL_FREEZE_VETO,
                roleManager
            )
        );
        vm.prank(roleManager);
        registry.grantScopedRole(StreamRoles.ROLE_TERMINAL_FREEZE_VETO, scope, holder);
    }

    function _assertRoleMutationLogs(
        Vm.Log[] memory logs,
        bytes32 role,
        address account,
        bool granted,
        uint8 grantClass,
        address actor,
        bytes32 actionId,
        bytes32 lifecycleTopic
    ) private view {
        logs.length.assertEq(2, "role mutation event count");
        _assertRoleMutationLog(logs[0], role, account, granted, actionId);
        _assertRoleLifecycleLog(logs[1], lifecycleTopic, role, account, grantClass, actor, actionId);
    }

    function _assertRoleMutationLog(
        Vm.Log memory log,
        bytes32 role,
        address account,
        bool granted,
        bytes32 actionId
    ) private view {
        log.emitter.assertEq(address(registry), "role mutation emitter");
        log.topics.length.assertEq(4, "role mutation topic count");
        log.topics[0].assertEq(ROLE_MUTATION_COMMITTED_TOPIC, "role mutation topic0");
        log.topics[1].assertEq(role, "role mutation role");
        log.topics[2].assertEq(bytes32(uint256(uint160(account))), "role mutation holder");
        log.topics[3].assertEq(actionId, "role mutation action");

        (
            uint16 schemaVersion,
            bool eventGranted,
            bytes32 roleChainHash,
            uint64 roleRevision,
            bytes32 globalChainHash,
            uint64 globalRevision
        ) = abi.decode(log.data, (uint16, bool, bytes32, uint64, bytes32, uint64));
        uint256(schemaVersion).assertEq(1, "role mutation schema");
        require(eventGranted == granted, "role mutation membership");
        (bytes32 storedRoleChainHash, uint64 storedRoleRevision) = registry.roleMutationState(role);
        (bytes32 storedGlobalChainHash, uint64 storedGlobalRevision) =
            registry.globalRoleMutationState();
        roleChainHash.assertEq(storedRoleChainHash, "role mutation role chain");
        uint256(roleRevision).assertEq(uint256(storedRoleRevision), "role mutation role revision");
        globalChainHash.assertEq(storedGlobalChainHash, "role mutation global chain");
        uint256(globalRevision)
            .assertEq(uint256(storedGlobalRevision), "role mutation global revision");
    }

    function _assertRoleLifecycleLog(
        Vm.Log memory log,
        bytes32 lifecycleTopic,
        bytes32 role,
        address account,
        uint8 grantClass,
        address actor,
        bytes32 actionId
    ) private view {
        log.emitter.assertEq(address(registry), "role lifecycle emitter");
        log.topics.length.assertEq(4, "role lifecycle topic count");
        log.topics[0].assertEq(lifecycleTopic, "role lifecycle topic0");
        log.topics[1].assertEq(role, "role lifecycle role");
        log.topics[2].assertEq(bytes32(uint256(uint160(account))), "role lifecycle holder");
        log.topics[3].assertEq(actionId, "role lifecycle action");
        (uint16 schemaVersion, uint8 eventGrantClass, address eventActor) =
            abi.decode(log.data, (uint16, uint8, address));
        uint256(schemaVersion).assertEq(1, "role lifecycle schema");
        uint256(eventGrantClass).assertEq(uint256(grantClass), "role lifecycle grant class");
        eventActor.assertEq(actor, "role lifecycle actor");
    }

    function _assertRoleManagerUpdatedLog(
        Vm.Log memory log,
        address account,
        bool enabled,
        bytes32 actionId
    ) private view {
        log.emitter.assertEq(address(registry), "role manager emitter");
        log.topics.length.assertEq(4, "role manager topic count");
        log.topics[0].assertEq(ROLE_MANAGER_UPDATED_TOPIC, "role manager topic0");
        log.topics[1].assertEq(bytes32(uint256(uint160(account))), "role manager account");
        log.topics[2].assertEq(bytes32(uint256(uint160(address(this)))), "role manager admin");
        log.topics[3].assertEq(actionId, "role manager action");
        (uint16 schemaVersion, bool eventEnabled, bytes32 chainHash, uint64 revision) =
            abi.decode(log.data, (uint16, bool, bytes32, uint64));
        uint256(schemaVersion).assertEq(1, "role manager schema");
        require(eventEnabled == enabled, "role manager enabled");
        (bytes32 storedChainHash, uint64 storedRevision) =
            registry.roleManagerConfigMutationState(account);
        chainHash.assertEq(storedChainHash, "role manager config chain");
        uint256(revision).assertEq(uint256(storedRevision), "role manager config revision");
    }

    function _rootGrant(bytes32 role, address account) private {
        _setRoleGovernanceContext(role, account, false, true);
        registry.grantRole(role, account);
        _clearRoleGovernanceContext();
    }

    function _rootRevoke(bytes32 role, address account) private {
        _setRoleGovernanceContext(role, account, true, false);
        registry.revokeRole(role, account);
        _clearRoleGovernanceContext();
    }

    function _rootGrantScoped(bytes32 baseRole, bytes32 scopeHash, address account) private {
        bytes32 role = registry.scopedRole(baseRole, scopeHash);
        _setRoleGovernanceContext(role, account, false, true);
        registry.grantScopedRole(baseRole, scopeHash, account);
        _clearRoleGovernanceContext();
    }

    function _rootRevokeScoped(bytes32 baseRole, bytes32 scopeHash, address account) private {
        bytes32 role = registry.scopedRole(baseRole, scopeHash);
        _setRoleGovernanceContext(role, account, true, false);
        registry.revokeScopedRole(baseRole, scopeHash, account);
        _clearRoleGovernanceContext();
    }

    function _rootRegisterRoleManager(address account, bool enabled) private {
        _setRoleManagerGovernanceContext(account, registry.isRoleManager(account), enabled);
        registry.registerRoleManager(account, enabled);
        _clearRoleGovernanceContext();
    }

    function _setRoleManagerGovernanceContext(address account, bool oldEnabled, bool newEnabled)
        private
    {
        (bytes32 chainHash, uint64 revision) = registry.roleManagerConfigMutationState(account);
        bytes32 scopeHash = keccak256(
            abi.encode(
                ROLE_MUTATION_SCOPE_V1,
                block.chainid,
                address(registry),
                ROLE_MANAGER_CONFIG_V1,
                account
            )
        );
        uint64 nextRevision = revision + 1;
        bytes32 nextChainHash = keccak256(
            abi.encode(
                ROLE_MANAGER_CONFIG_MUTATION_V1,
                chainHash,
                block.chainid,
                address(registry),
                account,
                newEnabled,
                nextRevision
            )
        );
        mockExecuting = true;
        mockActionId =
            keccak256(abi.encode("role-manager-config-test-action", account, nextRevision));
        mockActionClass = newEnabled ? 1 : 0;
        mockScopeHash = scopeHash;
        mockOldStateHash = _roleManagerConfigStateHash(scopeHash, oldEnabled, chainHash, revision);
        mockNewStateHash =
            _roleManagerConfigStateHash(scopeHash, newEnabled, nextChainHash, nextRevision);
    }

    function _roleManagerConfigStateHash(
        bytes32 scopeHash,
        bool enabled,
        bytes32 chainHash,
        uint64 revision
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                ROLE_MANAGER_CONFIG_STATE_V1,
                block.chainid,
                address(registry),
                scopeHash,
                enabled,
                chainHash,
                revision
            )
        );
    }

    function _setRoleGovernanceContext(
        bytes32 role,
        address account,
        bool oldGranted,
        bool newGranted
    ) private {
        (bytes32 roleChainHash, uint64 roleRevision) = registry.roleMutationState(role);
        (bytes32 globalChainHash, uint64 globalRevision) = registry.globalRoleMutationState();
        bytes32 scopeHash = keccak256(
            abi.encode(ROLE_MUTATION_SCOPE_V1, block.chainid, address(registry), role, account)
        );
        bytes32 oldStateHash = _roleMutationStateHash(
            scopeHash, oldGranted, roleChainHash, roleRevision, globalChainHash, globalRevision
        );
        uint64 nextRoleRevision = roleRevision + 1;
        uint64 nextGlobalRevision = globalRevision + 1;
        bytes32 nextRoleChainHash = keccak256(
            abi.encode(
                ROLE_MUTATION_RECORD_V1,
                roleChainHash,
                block.chainid,
                address(registry),
                role,
                account,
                newGranted,
                nextRoleRevision
            )
        );
        bytes32 nextGlobalChainHash = keccak256(
            abi.encode(
                GLOBAL_ROLE_MUTATION_RECORD_V1,
                globalChainHash,
                block.chainid,
                address(registry),
                role,
                account,
                newGranted,
                nextGlobalRevision
            )
        );
        mockExecuting = true;
        mockActionId =
            keccak256(abi.encode("role-registry-test-action", role, account, nextGlobalRevision));
        mockActionClass = 1;
        mockScopeHash = scopeHash;
        mockOldStateHash = oldStateHash;
        mockNewStateHash = _roleMutationStateHash(
            scopeHash,
            newGranted,
            nextRoleChainHash,
            nextRoleRevision,
            nextGlobalChainHash,
            nextGlobalRevision
        );
    }

    function _roleMutationStateHash(
        bytes32 scopeHash,
        bool granted,
        bytes32 roleChainHash,
        uint64 roleRevision,
        bytes32 globalChainHash,
        uint64 globalRevision
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                ROLE_MUTATION_STATE_V1,
                block.chainid,
                address(registry),
                scopeHash,
                granted,
                roleChainHash,
                roleRevision,
                globalChainHash,
                globalRevision
            )
        );
    }

    function _clearRoleGovernanceContext() private {
        mockExecuting = false;
        mockActionId = bytes32(0);
        mockActionClass = 0;
        mockScopeHash = bytes32(0);
        mockOldStateHash = bytes32(0);
        mockNewStateHash = bytes32(0);
    }
}
