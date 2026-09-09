// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/interfaces/stream/IStreamGovernanceExecutor.sol";
import "../smart-contracts/domains/governance/StreamGovernanceActionPolicy.sol";
import "./helpers/CharacterizationTestBase.sol";

contract StreamGovernanceActionPolicyTarget {
    function selectedCall() external { }
}

contract StreamGovernanceActionPolicyHarness {
    StreamGovernanceActionPolicy.State private _state;
    bytes32 private _candidateProfileHash;
    bytes32 private _catalogHash;
    uint256 private _entryCount;

    function bind(bytes32 candidateProfileHash, GovernanceActionPolicyEntry[] calldata entries)
        external
    {
        bytes32 boundCatalogHash = StreamGovernanceActionPolicy.expectedCatalogHash(
            address(this), candidateProfileHash, entries
        );
        StreamGovernanceActionPolicy.bind(_state, candidateProfileHash, boundCatalogHash, entries);
        _candidateProfileHash = candidateProfileHash;
        _catalogHash = boundCatalogHash;
        _entryCount = entries.length;
    }

    function validate(uint8 actionClass, GovernanceCall calldata call_, bytes calldata callData)
        external
        view
    {
        GovernanceCall[] memory calls = new GovernanceCall[](1);
        calls[0] = call_;
        bytes[] memory callDatas = new bytes[](1);
        callDatas[0] = callData;
        StreamGovernanceActionPolicy.validateCalls(
            _state, _candidateProfileHash, _catalogHash, _entryCount, actionClass, calls, callDatas
        );
    }

    function corruptCatalogHash(bytes32 corruptedCatalogHash) external {
        _state.catalogHash = corruptedCatalogHash;
    }

    function corruptCandidateProfileHash(bytes32 candidateProfileHash) external {
        _state.candidateProfileHash = candidateProfileHash;
    }

    function corruptExpectedEntryCount(uint256 entryCount) external {
        _entryCount = entryCount;
    }

    function corruptEntryHash(
        uint8 actionClass,
        address target_,
        bytes4 selector,
        bytes32 entryHash
    ) external {
        _state.entryHashes[keccak256(abi.encode(actionClass, target_, selector))] = entryHash;
    }

    function corruptEntryIndex(
        uint8 actionClass,
        address target_,
        bytes4 selector,
        uint256 indexPlusOne
    ) external {
        _state.entryIndexPlusOne[
            keccak256(abi.encode(actionClass, target_, selector))
        ] = indexPlusOne;
    }

    function corruptValueLimit(uint256 index, uint256 valueLimit) external {
        _state.entries[index].valueLimit = valueLimit;
    }

    function catalogHash() external view returns (bytes32) {
        return _catalogHash;
    }
}

contract StreamGovernanceActionPolicyTest is CharacterizationTestBase {
    bytes32 private constant CANDIDATE_PROFILE_HASH = keccak256("candidate-profile");
    bytes32 private constant TARGET_PROFILE_HASH = keccak256("target-profile");
    bytes32 private constant ENTRY_DOMAIN =
        keccak256("6529STREAM_GOVERNANCE_ACTION_POLICY_ENTRY_V1");

    StreamGovernanceActionPolicyTarget private target;

    event SelectedValidationGas(uint256 singleEntryCatalog, uint256 cappedCatalog);

    function setUp() public {
        target = new StreamGovernanceActionPolicyTarget();
    }

    function testCatalogMirrorDetectsGlobalCommitmentDrift() public {
        StreamGovernanceActionPolicyHarness harness = new StreamGovernanceActionPolicyHarness();
        GovernanceActionPolicyEntry[] memory entries = _entries(1);
        harness.bind(CANDIDATE_PROFILE_HASH, entries);
        bytes32 expected = harness.catalogHash();
        bytes32 corrupted = keccak256("corrupted-catalog");
        harness.corruptCatalogHash(corrupted);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceActionPolicyCatalogHashMismatch.selector,
                expected,
                corrupted
            )
        );
        harness.validate(0, _call(entries[0]), abi.encodePacked(entries[0].selector));
    }

    function testSelectedEntryCommitmentDetectsStoredEntryDrift() public {
        StreamGovernanceActionPolicyHarness harness = new StreamGovernanceActionPolicyHarness();
        GovernanceActionPolicyEntry[] memory entries = _entries(1);
        harness.bind(CANDIDATE_PROFILE_HASH, entries);
        bytes32 expectedEntryHash = _entryHash(entries[0], 0);
        entries[0].valueLimit = 1;
        bytes32 actualEntryHash = _entryHash(entries[0], 0);
        harness.corruptValueLimit(0, 1);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceActionPolicyEntryHashMismatch.selector,
                0,
                expectedEntryHash,
                actualEntryHash
            )
        );
        harness.validate(0, _call(entries[0]), abi.encodePacked(entries[0].selector));
    }

    function testSelectedEntryCommitmentRejectsZeroAndWrongStoredHash() public {
        GovernanceActionPolicyEntry[] memory entries = _entries(1);
        bytes32 actualEntryHash = _entryHash(entries[0], 0);
        for (uint256 i = 0; i < 2; i++) {
            StreamGovernanceActionPolicyHarness harness = new StreamGovernanceActionPolicyHarness();
            harness.bind(CANDIDATE_PROFILE_HASH, entries);
            bytes32 corruptedEntryHash = i == 0 ? bytes32(0) : keccak256("wrong-entry-hash");
            harness.corruptEntryHash(0, entries[0].target, entries[0].selector, corruptedEntryHash);

            vm.expectRevert(
                abi.encodeWithSelector(
                    IStreamGovernanceExecutor.GovernanceActionPolicyEntryHashMismatch.selector,
                    0,
                    corruptedEntryHash,
                    actualEntryHash
                )
            );
            harness.validate(0, _call(entries[0]), abi.encodePacked(entries[0].selector));
        }
    }

    function testSelectedEntryRejectsWrongIndexMapping() public {
        StreamGovernanceActionPolicyHarness harness = new StreamGovernanceActionPolicyHarness();
        GovernanceActionPolicyEntry[] memory entries = _entries(1);
        harness.bind(CANDIDATE_PROFILE_HASH, entries);
        harness.corruptEntryIndex(0, entries[0].target, entries[0].selector, 2);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.GovernanceActionPolicyUnknown.selector,
                0,
                0,
                entries[0].target,
                entries[0].selector
            )
        );
        harness.validate(0, _call(entries[0]), abi.encodePacked(entries[0].selector));
    }

    function testCandidateMirrorDetectsGlobalCommitmentDrift() public {
        StreamGovernanceActionPolicyHarness harness = new StreamGovernanceActionPolicyHarness();
        GovernanceActionPolicyEntry[] memory entries = _entries(1);
        harness.bind(CANDIDATE_PROFILE_HASH, entries);
        bytes32 corrupted = keccak256("corrupted-candidate-profile");
        harness.corruptCandidateProfileHash(corrupted);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidGovernanceActionPolicyCandidate.selector, corrupted
            )
        );
        harness.validate(0, _call(entries[0]), abi.encodePacked(entries[0].selector));
    }

    function testEntryCountMirrorDetectsGlobalCommitmentDrift() public {
        StreamGovernanceActionPolicyHarness harness = new StreamGovernanceActionPolicyHarness();
        GovernanceActionPolicyEntry[] memory entries = _entries(1);
        harness.bind(CANDIDATE_PROFILE_HASH, entries);
        harness.corruptExpectedEntryCount(2);

        vm.expectRevert(
            abi.encodeWithSelector(
                IStreamGovernanceExecutor.InvalidGovernanceActionPolicyEntry.selector, 1
            )
        );
        harness.validate(0, _call(entries[0]), abi.encodePacked(entries[0].selector));
    }

    function testSelectedEntryValidationIsBoundedAtCatalogCap() public {
        StreamGovernanceActionPolicyHarness singleEntryHarness =
            new StreamGovernanceActionPolicyHarness();
        GovernanceActionPolicyEntry[] memory singleEntry = _entries(1);
        singleEntryHarness.bind(CANDIDATE_PROFILE_HASH, singleEntry);
        uint256 singleGasBefore = gasleft();
        singleEntryHarness.validate(
            0, _call(singleEntry[0]), abi.encodePacked(singleEntry[0].selector)
        );
        uint256 singleEntryGas = singleGasBefore - gasleft();

        StreamGovernanceActionPolicyHarness cappedHarness =
            new StreamGovernanceActionPolicyHarness();
        GovernanceActionPolicyEntry[] memory entries = _entries(1_024);
        _sort(entries, 0, entries.length - 1);
        cappedHarness.bind(CANDIDATE_PROFILE_HASH, entries);

        GovernanceActionPolicyEntry memory selected = entries[entries.length / 2];
        uint256 cappedGasBefore = gasleft();
        cappedHarness.validate(0, _call(selected), abi.encodePacked(selected.selector));
        uint256 cappedCatalogGas = cappedGasBefore - gasleft();

        emit SelectedValidationGas(singleEntryGas, cappedCatalogGas);
        require(
            cappedCatalogGas <= singleEntryGas + 20_000,
            "validation gas must scale with calls, not catalog entries"
        );
        require(
            cappedCatalogGas < 300_000, "selected validation must remain bounded at catalog cap"
        );
    }

    function _entries(uint256 count)
        private
        view
        returns (GovernanceActionPolicyEntry[] memory entries)
    {
        entries = new GovernanceActionPolicyEntry[](count);
        for (uint256 i = 0; i < count; i++) {
            entries[i] = GovernanceActionPolicyEntry({
                actionClass: 0,
                target: address(target),
                // The helper bounds `count` to 1,024.
                // forge-lint: disable-next-line(unsafe-typecast)
                selector: bytes4(uint32(i + 1)),
                targetCodeHash: address(target).codehash,
                targetProfileHash: TARGET_PROFILE_HASH,
                callType: 1,
                valuePolicy: 0,
                valueLimit: 0,
                valueSemanticsHash: bytes32(0)
            });
        }
    }

    function _call(GovernanceActionPolicyEntry memory entry)
        private
        pure
        returns (GovernanceCall memory)
    {
        return GovernanceCall({
            target: entry.target,
            value: 0,
            selector: entry.selector,
            callDataHash: keccak256("unused-by-policy-harness"),
            scopeHash: bytes32(0),
            oldValueHash: bytes32(0),
            newValueHash: bytes32(0)
        });
    }

    function _entryHash(GovernanceActionPolicyEntry memory entry, uint256 index)
        private
        pure
        returns (bytes32)
    {
        // The runtime catalog bound guarantees the index fits uint64.
        // forge-lint: disable-next-line(unsafe-typecast)
        return keccak256(abi.encode(ENTRY_DOMAIN, uint64(index), entry));
    }

    function _sort(GovernanceActionPolicyEntry[] memory entries, uint256 low, uint256 high)
        private
        pure
    {
        if (low >= high) return;
        uint256 left = low;
        uint256 right = high;
        uint256 pivot = uint256(_key(entries[low + (high - low) / 2]));
        while (left <= right) {
            while (uint256(_key(entries[left])) < pivot) left++;
            while (uint256(_key(entries[right])) > pivot) {
                if (right == 0) break;
                right--;
            }
            if (left <= right) {
                GovernanceActionPolicyEntry memory swap = entries[left];
                entries[left] = entries[right];
                entries[right] = swap;
                left++;
                if (right == 0) break;
                right--;
            }
        }
        if (low < right) _sort(entries, low, right);
        if (left < high) _sort(entries, left, high);
    }

    function _key(GovernanceActionPolicyEntry memory entry) private pure returns (bytes32) {
        return keccak256(abi.encode(entry.actionClass, entry.target, entry.selector));
    }
}
