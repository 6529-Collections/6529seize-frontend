// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IStreamGovernanceExecutor.sol";
import "../smart-contracts/IStreamModule.sol";
import "../smart-contracts/IStreamModuleRegistry.sol";
import "../smart-contracts/IStreamRoleRegistry.sol";
import "../smart-contracts/StreamGovernanceExecutor.sol";
import "../smart-contracts/StreamModuleRegistry.sol";
import "../smart-contracts/StreamRoles.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";

struct LegacyGovernanceCallV1 {
    address target;
    uint256 value;
    bytes4 selector;
    bytes32 callDataHash;
}

/// @notice Golden equality tests for every doc-pinned governance and registry
///         hash domain, the [GOV-ROLES] keccak-of-own-name rule, the pinned
///         enum numeric IDs, and the [LTA-MODULE-ID] selector surface.
/// @dev Pinned 0x literals are copied from `docs/adr/0004-admin-governance.md`
///     [GOV-ACTION-ID], `docs/stream-long-term-architecture.md` [LTA-DOMAINS],
///     and `docs/collection-metadata-contract.md` [CMC-RECORD-CHAIN]; each is
///     asserted against a live keccak recomputation of the exact string
///     preimage. These domains are catalog-pinned rather than contract ABI.
contract StreamGovernanceTypehashGoldenTest is CharacterizationTestBase {
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    bytes32 private constant PINNED_GOVERNANCE_ACTION_V2 =
        0x214cd728538bb3775a7106caff5c761bace11866a984d4a4d97a98f51971ac4b;
    bytes32 private constant PINNED_GOVERNANCE_CALLS_V2 =
        0x10f09566fb70f7947b61639c2a53b3aec872069a8b46edd08ba14eb2b5942b70;
    bytes32 private constant PINNED_MODULE_REGISTRATION_RECORD_V1 =
        0x4b5b157069f454a5c1b78a95a28e2016af2d428d4eb4037917b271a668490869;
    bytes32 private constant PINNED_RECORD_CHAIN_V1 =
        0x0e7a0feb85d4a4a3e90074703c19de35786e11afaae8f9868aa2a911bcfa1609;
    bytes32 private constant PINNED_ROLE_MUTATION_V1 =
        0xa8dba5d6fcfd6e5b3cd0487118fc42e1d598c9ba0fb59aefad69b419212bc91e;
    bytes32 private constant PINNED_GLOBAL_ROLE_MUTATION_V1 =
        0x2da8f94be4b1e85c976aae097d48589ff562492679ebc2842c866ba5b986d39c;
    bytes32 private constant PINNED_ROLE_MUTATION_SCOPE_V1 =
        0x51943e9f337cf7f50fc89b1f37701a670f4477d8d6e3efbd34d986b27f35d271;
    bytes32 private constant PINNED_ROLE_MUTATION_STATE_V1 =
        0xf80e0ae6730f5e4e48b5a6c1b46bfb06af297aefb0eaa569f87f095a7f99153d;
    bytes32 private constant PINNED_ROLE_MANAGER_CONFIG_V1 =
        0x6b7160b8472382fb5a6b7cad94720fd10007c4124b0b0d405aa6523763ad0fe7;
    bytes32 private constant PINNED_ROLE_MANAGER_CONFIG_STATE_V1 =
        0x00ef486fa9550ecdc9851c2df1073c1c991e7d56e6a0d388357ba5f5a89c4263;
    bytes32 private constant PINNED_ROLE_MANAGER_CONFIG_MUTATION_V1 =
        0xbd1ca24b4e56b656dee2d7ca30433716550c54ab67aab3e6b9eba46ac0ff79d6;
    bytes32 private constant PINNED_TERMINAL_GUARDIAN_CONFIG_V1 =
        0x08d0b0fbace471ddf2e5f522c3621b3fdd92b1a17fce4c1effb39e5ad1d9243e;
    bytes32 private constant PINNED_TERMINAL_GUARDIAN_SCOPE_V1 =
        0x077788610e4d141120fd85c2372b9673a8a4ac7633f4d79522bf19565809252a;
    bytes32 private constant PINNED_INITIAL_TERMINAL_GUARDIAN_SET_V1 =
        0x9ee586231c2f5d832b7ab74ebdf30550f7b6ac36ff7f5d4ceedebd713c364b99;
    bytes32 private constant PINNED_TERMINAL_GUARDIAN_HOLDER_V1 =
        0x6043687fb0254773308ed2f9a8d9a86c356d45779c952f0ffd71d8beaa5a57d8;
    bytes4 private constant LEGACY_SCHEDULE_BATCH_SELECTOR = 0xd983ef8e;
    bytes4 private constant LEGACY_EXECUTE_BATCH_SELECTOR = 0x5e9014e4;

    StreamGovernanceExecutor private executor;
    StreamModuleRegistry private registry;

    function setUp() public {
        executor = new StreamGovernanceExecutor(address(this));
        registry =
            new StreamModuleRegistry(executor, keccak256("registry-manifest"), "ipfs://registry");
    }

    function testGovernanceActionTypehashGolden() public {
        keccak256("6529STREAM_GOVERNANCE_ACTION_V2")
            .assertEq(PINNED_GOVERNANCE_ACTION_V2, "action preimage recompute");
    }

    function testGovernanceCallsTypehashGolden() public {
        keccak256("6529STREAM_GOVERNANCE_CALLS_V2")
            .assertEq(PINNED_GOVERNANCE_CALLS_V2, "calls preimage recompute");
    }

    function testGovernanceV2DomainsAreNotContractGetters() public {
        bytes4[5] memory retiredGetters = [
            bytes4(0x5a7922a5),
            bytes4(0xe27ffa02),
            bytes4(0x4f87c81c),
            bytes4(0xe5427dd5),
            bytes4(0x0b1a9825)
        ];
        for (uint256 i = 0; i < retiredGetters.length; i++) {
            (bool success,) = address(executor).staticcall(abi.encodePacked(retiredGetters[i]));
            success.assertFalse("catalog domain must not spend executor ABI");
        }
    }

    function testGovernanceV2SelectorGoldens() public {
        bytes32(IStreamGovernanceExecutor.scheduleGovernanceBatch.selector)
            .assertEq(bytes32(bytes4(0x9c954144)), "schedule batch selector");
        bytes32(IStreamGovernanceExecutor.executeGovernanceBatch.selector)
            .assertEq(bytes32(bytes4(0x2eccc33e)), "execute batch selector");
        bytes32(IStreamGovernanceExecutor.currentAction.selector)
            .assertEq(bytes32(bytes4(0x546ea281)), "current action selector");
        bytes32(IStreamGovernanceExecutor.publishGovernanceCallData.selector)
            .assertEq(bytes32(bytes4(0x5447021f)), "publish calldata selector");
        bytes32(IStreamGovernanceExecutor.publishedCallData.selector)
            .assertEq(bytes32(bytes4(0x95a2b189)), "published calldata selector");
        bytes32(IStreamGovernanceExecutor.scheduledCallDataPointer.selector)
            .assertEq(bytes32(bytes4(0x38f8ce24)), "scheduled pointer selector");
        bytes32(IStreamGovernanceExecutor.scheduledCallData.selector)
            .assertEq(bytes32(bytes4(0x72a3c7b8)), "scheduled data selector");
        bytes32(IStreamGovernanceExecutor.registerProposer.selector)
            .assertEq(bytes32(bytes4(0x0794ec84)), "register proposer selector");
        bytes32(IStreamGovernanceExecutor.registerCanceller.selector)
            .assertEq(bytes32(bytes4(0xcb585072)), "register canceller selector");
        bytes32(IStreamGovernanceExecutor.setApprovedNativeReceiver.selector)
            .assertEq(bytes32(bytes4(0x31ac9e82)), "native receiver selector");
        bytes32(IStreamGovernanceExecutor.setTighteningCall.selector)
            .assertEq(bytes32(bytes4(0x250885fb)), "tightening config selector");
        bytes32(IStreamGovernanceExecutor.registerFreezeSelector.selector)
            .assertEq(bytes32(bytes4(0xb1b73b69)), "freeze config selector");
        bytes32(IStreamGovernanceExecutor.terminalFreezeGuardianConfigCommitment.selector)
            .assertEq(bytes32(bytes4(0xd0477f1f)), "guardian commitment selector");
        bytes32(IStreamGovernanceExecutor.terminalFreezeVetoGuardianSet.selector)
            .assertEq(bytes32(bytes4(0x2b33c302)), "guardian set selector");
        bytes32(IStreamGovernanceExecutor.terminalFreezeLiveActionCaps.selector)
            .assertEq(bytes32(bytes4(0x1b630d16)), "terminal cap selector");
        bytes32(IStreamGovernanceExecutor.terminalFreezeLiveActionUsage.selector)
            .assertEq(bytes32(bytes4(0x481eae00)), "terminal usage selector");
        bytes32(IStreamGovernanceExecutor.pruneElapsedTerminalFreezeActions.selector)
            .assertEq(bytes32(bytes4(0xace3628e)), "terminal prune selector");
        bytes32(IStreamGovernanceExecutor.terminalFreezeActionPage.selector)
            .assertEq(bytes32(bytes4(0xc8b276ba)), "terminal page selector");
    }

    function testGovernanceV2ErrorSelectorGoldens() public pure {
        bytes32(IStreamGovernanceExecutor.GovernanceRootProposerRequired.selector)
            .assertEq(bytes32(bytes4(0x572c5e0b)), "governance root proposer error");
        bytes32(IStreamGovernanceExecutor.RoleRegistryDelayedActionRequired.selector)
            .assertEq(bytes32(bytes4(0x5e6cae4c)), "role registry delayed action error");
        bytes32(IStreamGovernanceExecutor.InvalidExecutorConfigCall.selector)
            .assertEq(bytes32(bytes4(0x988f5a6d)), "invalid executor config error");
        bytes32(IStreamGovernanceExecutor.ExecutorConfigActionClassMismatch.selector)
            .assertEq(bytes32(bytes4(0x53eb2651)), "executor config class error");
        bytes32(IStreamGovernanceExecutor.ExecutorControlActionClassMismatch.selector)
            .assertEq(bytes32(bytes4(0x25f6871f)), "executor control class error");
        bytes32(IStreamGovernanceExecutor.GovernanceSelfCallContextRequired.selector)
            .assertEq(bytes32(bytes4(0xd13ef67d)), "isolated self-call context error");
        bytes32(IStreamGovernanceExecutor.GovernanceRootRevisionMismatch.selector)
            .assertEq(bytes32(bytes4(0xfdd2ef9e)), "governance root revision error");
        bytes32(IStreamGovernanceExecutor.GovernanceProposerAuthorizationDrift.selector)
            .assertEq(bytes32(bytes4(0x18cd5aee)), "governance proposer revision error");
        bytes32(IStreamGovernanceExecutor.TighteningCallSelfTargetForbidden.selector)
            .assertEq(bytes32(bytes4(0x67bbddf4)), "self tightening error");
        bytes32(IStreamGovernanceExecutor.FreezeSelectorSelfTargetForbidden.selector)
            .assertEq(bytes32(bytes4(0x500fc8d8)), "self freeze-selector error");
        bytes32(IStreamGovernanceExecutor.GovernanceCallReturndataTooLarge.selector)
            .assertEq(bytes32(bytes4(0x29111b54)), "governance returndata error");
        bytes32(IStreamGovernanceExecutor.GovernanceActionExpiredWindow.selector)
            .assertEq(bytes32(bytes4(0xc797754c)), "expired action window error");
        bytes32(IStreamGovernanceExecutor.TerminalFreezeGuardianConfigDrift.selector)
            .assertEq(bytes32(bytes4(0x3ef646fd)), "terminal guardian drift error");
        bytes32(IStreamGovernanceExecutor.TerminalFreezeLiveActionCapExceeded.selector)
            .assertEq(bytes32(bytes4(0xed1b395d)), "terminal total cap error");
        bytes32(IStreamGovernanceExecutor.TerminalFreezeNonRootLiveActionCapExceeded.selector)
            .assertEq(bytes32(bytes4(0x441113a4)), "terminal non-root cap error");
        bytes32(IStreamGovernanceExecutor.TerminalFreezeProposerLiveActionCapExceeded.selector)
            .assertEq(bytes32(bytes4(0xea2c035f)), "terminal proposer cap error");
        bytes32(IStreamGovernanceExecutor.TerminalFreezePageCursorOutOfBounds.selector)
            .assertEq(bytes32(bytes4(0x204cb92b)), "terminal cursor error");
        bytes32(IStreamGovernanceExecutor.TerminalFreezePageLimitExceeded.selector)
            .assertEq(bytes32(bytes4(0x83beaacb)), "terminal page-limit error");
    }

    function testManifestSelectorGoldens() public {
        bytes32(IStreamGovernanceExecutor.systemManifestBatchTailRule.selector)
            .assertEq(bytes32(bytes4(0xffd6babe)), "tail rule selector");
        bytes32(IStreamGovernanceExecutor.registerSystemManifestTailTrigger.selector)
            .assertEq(bytes32(bytes4(0xc64f0807)), "register tail selector");
        bytes32(IStreamGovernanceExecutor.systemManifestTailTriggerCount.selector)
            .assertEq(bytes32(bytes4(0xeee99df8)), "tail count selector");
        bytes32(IStreamGovernanceExecutor.systemManifestTailTriggerAt.selector)
            .assertEq(bytes32(bytes4(0xd83d70b6)), "tail at selector");
        bytes32(IStreamGovernanceExecutor.systemManifestTailTriggerChainHash.selector)
            .assertEq(bytes32(bytes4(0xa05cac72)), "tail chain selector");
        bytes32(IStreamGovernanceExecutor.bindSystemManifestBootstrap.selector)
            .assertEq(bytes32(bytes4(0x32212927)), "bootstrap bind selector");
        bytes32(IStreamGovernanceExecutor.pendingScheduledActionCount.selector)
            .assertEq(bytes32(bytes4(0x20662991)), "pending count selector");
        bytes32(IStreamGovernanceExecutor.systemManifestBootstrapState.selector)
            .assertEq(bytes32(bytes4(0x8a2d979b)), "bootstrap state selector");
        bytes32(IStreamGovernanceExecutor.sealSystemManifestBootstrap.selector)
            .assertEq(bytes32(bytes4(0xbd1f39cd)), "bootstrap seal selector");
    }

    function testRetiredEmergencyEligibilitySelectorsAreAbsent() public {
        bytes[] memory calls = new bytes[](5);
        calls[0] = abi.encodeWithSignature(
            "emergencyRestorationEligibility(address,bytes4)", address(this), bytes4(0x12345678)
        );
        calls[1] = abi.encodeWithSignature(
            "registerEmergencyRestorationEligibility(address,bytes4)",
            address(this),
            bytes4(0x12345678)
        );
        calls[2] = abi.encodeWithSignature("emergencyRestorationEligibilityCount()");
        calls[3] = abi.encodeWithSignature("emergencyRestorationEligibilityAt(uint256)", uint256(0));
        calls[4] = abi.encodeWithSignature("emergencyRestorationEligibilityChainHash()");
        for (uint256 i = 0; i < calls.length; i++) {
            (bool ok, bytes memory returnData) = address(executor).call(calls[i]);
            ok.assertFalse("retired emergency selector accepted");
            returnData.length.assertEq(0, "retired emergency selector returned custom error");
        }
    }

    function testV1DomainGettersAreRetired() public {
        (bool callsV1,) = address(executor).staticcall(hex"48634e0d");
        (bool actionV1,) = address(executor).staticcall(hex"5cf9f49e");
        callsV1.assertFalse("calls V1 getter retired");
        actionV1.assertFalse("action V1 getter retired");
    }

    function testV1BatchEntryPointSelectorsAreRetired() public {
        bytes32(
                bytes4(
                    keccak256(
                        "scheduleGovernanceBatch(uint8,(address,uint256,bytes4,bytes32)[],bytes32,bytes32,bytes32,uint64,uint64,bytes32,string,bytes32)"
                    )
                )
            ).assertEq(bytes32(LEGACY_SCHEDULE_BATCH_SELECTOR), "legacy schedule selector pin");
        bytes32(
                bytes4(
                    keccak256(
                        "executeGovernanceBatch(bytes32,(address,uint256,bytes4,bytes32)[],bytes[])"
                    )
                )
            ).assertEq(bytes32(LEGACY_EXECUTE_BATCH_SELECTOR), "legacy execute selector pin");

        bytes memory targetCall = abi.encodeCall(StreamModuleRegistry.moduleCount, ());
        LegacyGovernanceCallV1[] memory legacyCalls = new LegacyGovernanceCallV1[](1);
        legacyCalls[0] = LegacyGovernanceCallV1({
            target: address(registry),
            value: 0,
            selector: StreamModuleRegistry.moduleCount.selector,
            callDataHash: keccak256(targetCall)
        });
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = targetCall;

        bytes memory legacyScheduleCall = abi.encodeWithSelector(
            LEGACY_SCHEDULE_BATCH_SELECTOR,
            uint8(StreamGovernanceActionClasses.DELAYED_LOOSENING),
            legacyCalls,
            keccak256("legacy-scope"),
            keccak256("legacy-old"),
            keccak256("legacy-new"),
            uint64(block.timestamp + 48 hours),
            uint64(block.timestamp + 48 hours + 7 days),
            keccak256("legacy-reason"),
            "ipfs://legacy-governance-v1",
            keccak256("legacy-manifest")
        );
        (bool scheduleSuccess, bytes memory scheduleReturnData) =
            address(executor).call(legacyScheduleCall);
        scheduleSuccess.assertFalse("legacy schedule ABI retired");
        uint256(scheduleReturnData.length).assertEq(0, "legacy schedule has no dispatcher");

        bytes memory legacyExecuteCall = abi.encodeWithSelector(
            LEGACY_EXECUTE_BATCH_SELECTOR, keccak256("legacy-action"), legacyCalls, callDatas
        );
        (bool executeSuccess, bytes memory executeReturnData) =
            address(executor).call(legacyExecuteCall);
        executeSuccess.assertFalse("legacy execute ABI retired");
        uint256(executeReturnData.length).assertEq(0, "legacy execute has no dispatcher");
    }

    function testModuleRegistrationRecordTypehashGolden() public {
        registry.STREAM_MODULE_REGISTRATION_RECORD_V1()
            .assertEq(
                PINNED_MODULE_REGISTRATION_RECORD_V1, "registration record typehash vs doc pin"
            );
        keccak256("6529STREAM_MODULE_REGISTRATION_RECORD_V1")
            .assertEq(
                PINNED_MODULE_REGISTRATION_RECORD_V1, "registration record preimage recompute"
            );
    }

    function testRecordChainTypehashGolden() public {
        registry.STREAM_RECORD_CHAIN_V1()
            .assertEq(PINNED_RECORD_CHAIN_V1, "record chain typehash vs doc pin");
        keccak256("6529STREAM_RECORD_CHAIN_V1")
            .assertEq(PINNED_RECORD_CHAIN_V1, "record chain preimage recompute");
    }

    function testRoleRegistryDomainGoldens() public {
        keccak256("6529STREAM_ROLE_MUTATION_V1")
            .assertEq(PINNED_ROLE_MUTATION_V1, "role mutation preimage recompute");
        keccak256("6529STREAM_GLOBAL_ROLE_MUTATION_V1")
            .assertEq(PINNED_GLOBAL_ROLE_MUTATION_V1, "global role mutation preimage recompute");
        keccak256("6529STREAM_ROLE_MUTATION_SCOPE_V1")
            .assertEq(PINNED_ROLE_MUTATION_SCOPE_V1, "role scope preimage recompute");
        keccak256("6529STREAM_ROLE_MUTATION_STATE_V1")
            .assertEq(PINNED_ROLE_MUTATION_STATE_V1, "role state preimage recompute");
        keccak256("6529STREAM_ROLE_MANAGER_CONFIG_V1")
            .assertEq(PINNED_ROLE_MANAGER_CONFIG_V1, "role manager key preimage recompute");
        keccak256("6529STREAM_ROLE_MANAGER_CONFIG_STATE_V1")
            .assertEq(PINNED_ROLE_MANAGER_CONFIG_STATE_V1, "role manager state preimage recompute");
        keccak256("6529STREAM_ROLE_MANAGER_CONFIG_MUTATION_V1")
            .assertEq(
                PINNED_ROLE_MANAGER_CONFIG_MUTATION_V1, "role manager mutation preimage recompute"
            );
    }

    function testGovernanceConfigAndTerminalGuardianDomainGoldens() public {
        keccak256("6529STREAM_TERMINAL_GUARDIAN_CONFIG_V1")
            .assertEq(PINNED_TERMINAL_GUARDIAN_CONFIG_V1, "terminal guardian config domain");
        keccak256("6529STREAM_TERMINAL_GUARDIAN_SCOPE_V1")
            .assertEq(PINNED_TERMINAL_GUARDIAN_SCOPE_V1, "terminal guardian scope domain");
        keccak256("6529STREAM_INITIAL_TERMINAL_GUARDIAN_SET_V1")
            .assertEq(
                PINNED_INITIAL_TERMINAL_GUARDIAN_SET_V1, "initial terminal guardian set domain"
            );
        keccak256("6529STREAM_TERMINAL_GUARDIAN_HOLDER_V1")
            .assertEq(PINNED_TERMINAL_GUARDIAN_HOLDER_V1, "terminal guardian holder domain");
        keccak256("6529STREAM_GOVERNANCE_CONFIG_SCOPE_V1")
            .assertEq(
                0x3c84722ce639aca105835269de227cc0ffea495f13383068c46ec2e7aae88016,
                "governance config scope domain"
            );
        keccak256("6529STREAM_GOVERNANCE_CONFIG_STATE_V1")
            .assertEq(
                0x05000ed56f03029aee74f99fd9d1a7319ad482fa3148ae863053ea955d1e9a4b,
                "governance config state domain"
            );
        keccak256("6529STREAM_GOVERNANCE_ROOT_SCOPE_V1")
            .assertEq(
                0x6aadc831e79f225350483abeae2839b877650539b2bbb4a19c70ade78ea2e42c,
                "governance root scope domain"
            );
        keccak256("6529STREAM_GOVERNANCE_ROOT_STATE_V1")
            .assertEq(
                0xd9975385cd3dcefe66cfc6e447a2c92f84d20f043e1198e1b6f5c65be5805d90,
                "governance root state domain"
            );
        keccak256("6529STREAM_GOVERNANCE_CONFIG_PROPOSER")
            .assertEq(
                0x3159801de288c136cc45c5fbc40879c4e5a4c7bba9806400495d2120cd681905,
                "proposer config domain"
            );
        keccak256("6529STREAM_GOVERNANCE_CONFIG_CANCELLER")
            .assertEq(
                0x334c6d45b3bad249a3f870b97f4a79b845676c102c028972e94f21b49628217b,
                "canceller config domain"
            );
        keccak256("6529STREAM_GOVERNANCE_CONFIG_NATIVE_RECEIVER")
            .assertEq(
                0x19222bb517f28c7f9a05615c9b0fac13b5258c5b61fcaec4605f5b56aa239cf4,
                "native receiver config domain"
            );
        keccak256("6529STREAM_GOVERNANCE_CONFIG_TIGHTENING_CALL")
            .assertEq(
                0xc3f9be103fb546fd998001a0d6447e98378926dd86bc995bb06019fd4eac50cf,
                "tightening config domain"
            );
        keccak256("6529STREAM_GOVERNANCE_CONFIG_FREEZE_SELECTOR")
            .assertEq(
                0x034b6f0b02fadd47ce4775cbf1d72a3b570a62a973efcec85059bf135bf5da91,
                "freeze config domain"
            );
    }

    function testGovernanceV2EventTopicGoldens() public pure {
        keccak256("GovernanceCallDataPublished(uint16,bytes32,address,address)")
            .assertEq(
                0x5922e6285b4b955740f916aa25accf8dcd9f75131e4bde259347d27adfaf1cce,
                "calldata publication topic"
            );
        keccak256("GovernanceRootRotated(uint16,address,address,bytes32,uint64,bytes32)")
            .assertEq(
                0x08d370ac1a1f9fb20901f4973ecd503905441935a5b50d55949383fb2e577022,
                "governance root topic"
            );
        keccak256("TerminalFreezeGuardianConfigCommitted(uint16,bytes32,bytes32)")
            .assertEq(
                0x53acfef70a58072f772f652e17d1aae14ab4389a12ad30c9423ed0a887f8ba65,
                "guardian commitment topic"
            );
        keccak256("GovernanceProposerUpdated(uint16,address,bool,uint64,bytes32)")
            .assertEq(
                0x220035fc1066049066bc625ffc68a6dd5d26c64d3bcf552113a2b83726f5ccc3,
                "proposer update topic"
            );
        keccak256("GovernanceCancellerUpdated(uint16,address,bool,uint64,bytes32)")
            .assertEq(
                0x25f1eb9ffcadbf70fdce20cb2089d1d75b4acc808a30caf8730a8cac77191a47,
                "canceller update topic"
            );
        keccak256("TighteningCallUpdated(uint16,address,bytes4,bool,bytes32,uint64,bytes32)")
            .assertEq(
                0x036c8ff514a46d08a6d064b8303207c224554087f3a378bf88ca1d8f8d4ece58,
                "tightening update topic"
            );
        keccak256("ApprovedNativeReceiverUpdated(uint16,address,bool,uint64,bytes32)")
            .assertEq(
                0xd02c58454df06c3acae4d99fd37a3031799db442605179362d1ee19588f9f3b4,
                "native receiver update topic"
            );
        keccak256("FreezeSelectorUpdated(uint16,address,bytes4,bool,bytes32,uint64,bytes32)")
            .assertEq(
                0x99b0305b9daf0dfcf7c496155ec00fbc7f4c03a7d91f6436f7edc0a3cef91ac3,
                "freeze selector update topic"
            );
        keccak256(
                "TerminalFreezeActionMembershipUpdated(uint16,bytes32,bytes32,address,bool,uint8,bool,uint64,uint256,uint256)"
            )
            .assertEq(
                0xfca432e480c87cddba2b629d363f2ad28733127441639c4f7a1d84edca17d676,
                "terminal membership topic"
            );
        keccak256("StreamRoleGranted(uint16,bytes32,address,uint8,address,bytes32)")
            .assertEq(
                0x9b9b410e01df674848a6af9c4677f982bcd5957194cd51eb34ed04532bc7a2aa,
                "role grant topic"
            );
        keccak256("StreamRoleRevoked(uint16,bytes32,address,uint8,address,bytes32)")
            .assertEq(
                0x674124c7fd9b40a7e8da58914611e15b27e8f0645cae8abf147adb7eb68d841f,
                "role revoke topic"
            );
        keccak256("RoleManagerUpdated(uint16,address,bool,address,bytes32,uint64,bytes32)")
            .assertEq(
                0xb08dd46dd5caf79cdfd7060f42cebba12dc707c2d25f0646753c6c240ea5b627,
                "role manager topic"
            );
        keccak256(
                "RoleMutationCommitted(uint16,bytes32,address,bool,bytes32,uint64,bytes32,uint64,bytes32)"
            )
            .assertEq(
                0xe7db8fc830e4a9ad4e109992e6cf9d48e383ea6b7b37cf64be502d2ad4143666,
                "role mutation topic"
            );
    }

    function testTerminalFreezeCapacityPins() public view {
        (uint256 totalCap, uint256 nonRootCap, uint256 proposerCap) =
            executor.terminalFreezeLiveActionCaps();
        totalCap.assertEq(64, "terminal total cap");
        nonRootCap.assertEq(48, "terminal non-root cap");
        proposerCap.assertEq(8, "terminal proposer cap");
    }

    function testModuleRegistrationLaneConstants() public {
        registry.MODULE_REGISTRATION_RECORD_TYPE()
            .assertEq(keccak256("MODULE_REGISTRATION"), "registration lane record type");
        registry.MODULE_REGISTRATION_SCOPE_KEY().assertEq(0, "registration lane scope key");
    }

    function testGovernanceActionScheduledTopicGolden() public {
        keccak256(
                bytes(
                    string.concat(
                        "GovernanceActionScheduled(uint16,bytes32,uint8,address,uint256,",
                        "bytes4,bytes32,bytes32,bytes32,bytes32,uint64,uint64,uint256,",
                        "address,bytes32,string,bytes32)"
                    )
                )
            )
            .assertEq(
                0x31024a726b55cea4cbdba5c85421828889c7015fdc195fafed46fed8020f760c,
                "scheduled event topic"
            );
    }

    function testRoleConstantsAreKeccakOfOwnName() public {
        StreamRoles.ROLE_PAUSE_GUARDIAN
            .assertEq(keccak256("ROLE_PAUSE_GUARDIAN"), "ROLE_PAUSE_GUARDIAN");
        StreamRoles.ROLE_UNPAUSE.assertEq(keccak256("ROLE_UNPAUSE"), "ROLE_UNPAUSE");
        StreamRoles.ROLE_COLLECTION_FINALITY_ADMIN
            .assertEq(keccak256("ROLE_COLLECTION_FINALITY_ADMIN"), "ROLE_COLLECTION_FINALITY_ADMIN");
        StreamRoles.ROLE_TERMINAL_FREEZE_VETO
            .assertEq(keccak256("ROLE_TERMINAL_FREEZE_VETO"), "ROLE_TERMINAL_FREEZE_VETO");
        StreamRoles.ROLE_ENTROPY_INCIDENT_DECLARER
            .assertEq(keccak256("ROLE_ENTROPY_INCIDENT_DECLARER"), "ROLE_ENTROPY_INCIDENT_DECLARER");
        StreamRoles.ROLE_ENTROPY_REVEAL_OWNER
            .assertEq(keccak256("ROLE_ENTROPY_REVEAL_OWNER"), "ROLE_ENTROPY_REVEAL_OWNER");
        StreamRoles.ROLE_ARTIST_REGISTRY_ADMIN
            .assertEq(keccak256("ROLE_ARTIST_REGISTRY_ADMIN"), "ROLE_ARTIST_REGISTRY_ADMIN");
        StreamRoles.ROLE_ATTRIBUTION_ARBITER
            .assertEq(keccak256("ROLE_ATTRIBUTION_ARBITER"), "ROLE_ATTRIBUTION_ARBITER");
        StreamRoles.ROLE_ARTIST_DORMANCY_ADMIN
            .assertEq(keccak256("ROLE_ARTIST_DORMANCY_ADMIN"), "ROLE_ARTIST_DORMANCY_ADMIN");
        StreamRoles.ROLE_ATTRIBUTION_APPEAL
            .assertEq(keccak256("ROLE_ATTRIBUTION_APPEAL"), "ROLE_ATTRIBUTION_APPEAL");
        StreamRoles.ROLE_FIXITY_OPERATOR
            .assertEq(keccak256("ROLE_FIXITY_OPERATOR"), "ROLE_FIXITY_OPERATOR");
        StreamRoles.ROLE_EXPORT_PUBLISHER
            .assertEq(keccak256("ROLE_EXPORT_PUBLISHER"), "ROLE_EXPORT_PUBLISHER");
        StreamRoles.ROLE_CLAIM_ROUTER_OPERATOR
            .assertEq(keccak256("ROLE_CLAIM_ROUTER_OPERATOR"), "ROLE_CLAIM_ROUTER_OPERATOR");
        StreamRoles.ROLE_EMERGENCY_RECIPIENT
            .assertEq(keccak256("ROLE_EMERGENCY_RECIPIENT"), "ROLE_EMERGENCY_RECIPIENT");
        StreamRoles.ROLE_ENTROPY_ADMIN
            .assertEq(keccak256("ROLE_ENTROPY_ADMIN"), "ROLE_ENTROPY_ADMIN");
        StreamRoles.ROLE_TREASURY.assertEq(keccak256("ROLE_TREASURY"), "ROLE_TREASURY");
    }

    function testModuleRegistryStatusNumericPins() public {
        // Pinned in the Numeric ID Catalog ([LTA-REGISTRY] requirement 2).
        uint256(uint8(ModuleRegistryStatus.UNKNOWN)).assertEq(0, "UNKNOWN = 0");
        uint256(uint8(ModuleRegistryStatus.ACTIVE)).assertEq(1, "ACTIVE = 1");
        uint256(uint8(ModuleRegistryStatus.DEPRECATED)).assertEq(2, "DEPRECATED = 2");
        uint256(uint8(ModuleRegistryStatus.INCIDENT_REVOKED)).assertEq(3, "INCIDENT_REVOKED = 3");
    }

    function testGovernanceActionStatusOrderPins() public {
        uint256(uint8(GovernanceActionStatus.NONE)).assertEq(0, "NONE = 0");
        uint256(uint8(GovernanceActionStatus.SCHEDULED)).assertEq(1, "SCHEDULED = 1");
        uint256(uint8(GovernanceActionStatus.CANCELLED)).assertEq(2, "CANCELLED = 2");
        uint256(uint8(GovernanceActionStatus.EXECUTED)).assertEq(3, "EXECUTED = 3");
        uint256(uint8(GovernanceActionStatus.EXPIRED)).assertEq(4, "EXPIRED = 4");
        uint256(uint8(GovernanceActionStatus.VETOED)).assertEq(5, "VETOED = 5");
    }

    function testActionClassNumericPins() public {
        uint256(StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING)
            .assertEq(0, "IMMEDIATE_TIGHTENING = 0");
        uint256(StreamGovernanceActionClasses.DELAYED_LOOSENING)
            .assertEq(1, "DELAYED_LOOSENING = 1");
        uint256(StreamGovernanceActionClasses.TERMINAL_FREEZE).assertEq(2, "TERMINAL_FREEZE = 2");
        uint256(StreamGovernanceActionClasses.POINTER_REPLACEMENT)
            .assertEq(3, "POINTER_REPLACEMENT = 3");
        uint256(StreamGovernanceActionClasses.FUNDS_RECOVERY).assertEq(4, "FUNDS_RECOVERY = 4");
        uint256(StreamGovernanceActionClasses.SUCCESSOR_DECLARATION)
            .assertEq(5, "SUCCESSOR_DECLARATION = 5");
        // ID 6 was retired before genesis. It remains reserved and must never
        // be reassigned even though it is not an executable action class.
        uint8 retiredEmergencyRestoration = 6;
        uint256(retiredEmergencyRestoration).assertEq(6, "retired class 6 remains reserved");
    }

    function testGovernanceWindowFloorConstants() public {
        uint256(executor.minimumDelay(StreamGovernanceActionClasses.IMMEDIATE_TIGHTENING))
            .assertEq(0, "immediate tightening delay");
        uint256(executor.minimumDelay(StreamGovernanceActionClasses.DELAYED_LOOSENING))
            .assertEq(48 hours, "delayed loosening floor");
        uint256(executor.minimumDelay(StreamGovernanceActionClasses.POINTER_REPLACEMENT))
            .assertEq(48 hours, "pointer replacement floor");
        uint256(executor.minimumDelay(StreamGovernanceActionClasses.TERMINAL_FREEZE))
            .assertEq(72 hours, "terminal freeze veto floor");
        uint256(executor.minimumDelay(StreamGovernanceActionClasses.FUNDS_RECOVERY))
            .assertEq(14 days, "funds recovery floor");
        uint256(executor.minimumDelay(StreamGovernanceActionClasses.SUCCESSOR_DECLARATION))
            .assertEq(30 days, "successor declaration floor");
        uint256(7 days).assertEq(604_800, "open-to-execute floor catalog pin");
        vm.expectRevert(
            abi.encodeWithSelector(IStreamGovernanceExecutor.UnknownActionClass.selector, 6)
        );
        executor.minimumDelay(6);
    }

    function testStreamModuleSelectorGolden() public {
        // [LTA-MODULE-ID]: the eight canonical selectors are golden-tested.
        bytes32(IStreamModule.streamModuleType.selector)
            .assertEq(bytes32(bytes4(keccak256("streamModuleType()"))), "streamModuleType selector");
        bytes32(IStreamModule.streamModuleVersion.selector)
            .assertEq(
                bytes32(bytes4(keccak256("streamModuleVersion()"))), "streamModuleVersion selector"
            );
        bytes32(IStreamModule.streamModuleInterfaceId.selector)
            .assertEq(
                bytes32(bytes4(keccak256("streamModuleInterfaceId()"))),
                "streamModuleInterfaceId selector"
            );
        bytes32(IStreamModule.streamModuleSchemaHash.selector)
            .assertEq(
                bytes32(bytes4(keccak256("streamModuleSchemaHash()"))),
                "streamModuleSchemaHash selector"
            );
        bytes32(IStreamModule.streamModuleSupersedes.selector)
            .assertEq(
                bytes32(bytes4(keccak256("streamModuleSupersedes()"))),
                "streamModuleSupersedes selector"
            );
        bytes32(IStreamModule.streamModuleCodeHash.selector)
            .assertEq(
                bytes32(bytes4(keccak256("streamModuleCodeHash()"))),
                "streamModuleCodeHash selector"
            );
        bytes32(IStreamModule.streamModuleDeploymentManifestHash.selector)
            .assertEq(
                bytes32(bytes4(keccak256("streamModuleDeploymentManifestHash()"))),
                "streamModuleDeploymentManifestHash selector"
            );
        bytes32(IStreamModule.streamModuleManifest.selector)
            .assertEq(
                bytes32(bytes4(keccak256("streamModuleManifest()"))),
                "streamModuleManifest selector"
            );
    }
}
