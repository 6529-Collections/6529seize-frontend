// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IStreamMintLedger.sol";
import "./Ownable.sol";

/// @notice Durable outside-Core accounting ledger for launch mint counters.
contract StreamMintLedger is IStreamMintLedger, Ownable {
    /// @notice Returns whether an address may register and consume ledger state.
    mapping(address => bool) public override ledgerWriter;
    /// @notice Returns the registered policy hash for a manager phase.
    mapping(address => mapping(uint256 => mapping(bytes32 => bytes32)))
        public
        override registeredPhasePolicyHash;
    mapping(
        address => mapping(uint256 => mapping(bytes32 => mapping(bytes32 => LedgerCounterPolicy)))
    ) private _registeredCounterPolicies;
    mapping(address => mapping(uint256 => mapping(bytes32 => mapping(bytes32 => uint256)))) private
        _registeredCounterPolicyVersions;
    mapping(address => mapping(uint256 => mapping(bytes32 => uint256))) private _phasePolicyVersion;
    /// @notice Returns the durable uint64 value for one ledger counter key.
    /// @dev Counter values are not reset by phase policy re-registration.
    mapping(bytes32 => uint64) public override counterValue;
    mapping(address => mapping(bytes32 => bool)) private _authorizationUsed;

    /// @notice Returns true for deployment validation.
    function isStreamMintLedger() external pure override returns (bool) {
        return true;
    }

    /// @notice Enables or disables an authorized ledger writer.
    function setLedgerWriter(address writer, bool allowed) external override onlyOwner {
        if (writer == address(0)) {
            revert InvalidLedgerWriter(writer);
        }
        if (allowed && writer.code.length == 0) {
            revert InvalidLedgerWriter(writer);
        }
        ledgerWriter[writer] = allowed;
        emit MintLedgerWriterUpdated(writer, allowed);
    }

    /// @notice Registers the active static launch policy for a manager phase.
    function registerPhasePolicy(
        address manager,
        uint256 collectionId,
        bytes32 phaseId,
        bytes32 policyHash,
        bytes32[] calldata counterIds,
        LedgerCounterPolicy[] calldata counterPolicies
    ) external override {
        _requireLedgerWriter();
        _requirePhasePolicy(manager, collectionId, phaseId, policyHash);
        if (manager != msg.sender) {
            revert InvalidPhasePolicy(manager, collectionId, phaseId);
        }
        if (counterIds.length != counterPolicies.length) {
            revert CounterPolicyLengthMismatch(counterIds.length, counterPolicies.length);
        }
        if (counterIds.length == 0) {
            revert InvalidPhasePolicy(manager, collectionId, phaseId);
        }

        uint256 activeVersion = _phasePolicyVersion[manager][collectionId][phaseId] + 1;
        _phasePolicyVersion[manager][collectionId][phaseId] = activeVersion;
        registeredPhasePolicyHash[manager][collectionId][phaseId] = policyHash;
        emit MintLedgerPhasePolicyRegistered(manager, collectionId, phaseId, policyHash);

        for (uint256 i = 0; i < counterIds.length; i++) {
            _registerCounterPolicy(
                manager,
                collectionId,
                phaseId,
                policyHash,
                activeVersion,
                counterIds,
                counterPolicies,
                i
            );
        }
    }

    /// @notice Consumes registered static counter increments and replay IDs.
    function consume(
        CounterConsumption[] calldata consumptions,
        bytes32 authorizationId,
        bytes32[] calldata nullifiers,
        bytes32 policyHash
    ) external override {
        _requireLedgerWriter();
        _requireNoNullifiers(nullifiers);
        if (consumptions.length == 0) {
            revert EmptyCounterConsumption();
        }
        bool hasAuthorization = authorizationId != bytes32(0);
        if (hasAuthorization && _authorizationUsed[msg.sender][authorizationId]) {
            revert AuthorizationAlreadyConsumed(authorizationId);
        }

        for (uint256 i = 0; i < consumptions.length; i++) {
            _consumeCounter(consumptions[i], policyHash);
        }

        if (hasAuthorization) {
            _authorizationUsed[msg.sender][authorizationId] = true;
            emit MintLedgerAuthorizationConsumed(authorizationId, policyHash, msg.sender);
        }
    }

    /// @notice Returns the registered static policy for one counter.
    function registeredCounterPolicy(
        address manager,
        uint256 collectionId,
        bytes32 phaseId,
        bytes32 counterId
    ) external view override returns (LedgerCounterPolicy memory) {
        uint256 activeVersion = _phasePolicyVersion[manager][collectionId][phaseId];
        if (
            activeVersion == 0
                || _registeredCounterPolicyVersions[manager][collectionId][phaseId][counterId]
                    != activeVersion
        ) {
            return LedgerCounterPolicy({
                enabled: false,
                capMode: CounterCapMode.NONE,
                deltaMode: CounterDeltaMode.STATIC,
                staticCap: 0,
                staticIncrement: 0,
                counterConfigHash: bytes32(0)
            });
        }
        return _registeredCounterPolicies[manager][collectionId][phaseId][counterId];
    }

    /// @notice Returns whether an authorization ID has been consumed.
    function isAuthorizationUsed(bytes32 authorizationId) external view override returns (bool) {
        return _authorizationUsed[msg.sender][authorizationId];
    }

    /// @notice Returns whether a manager has already consumed an authorization ID.
    function isManagerAuthorizationUsed(address manager, bytes32 authorizationId)
        external
        view
        override
        returns (bool)
    {
        return _authorizationUsed[manager][authorizationId];
    }

    /// @notice Returns whether a nullifier has been consumed.
    function isNullifierUsed(bytes32) external pure override returns (bool) {
        return false;
    }

    /// @notice Derives the canonical value key for a manager counter subject.
    function deriveCounterValueKey(
        address manager,
        uint256 collectionId,
        bytes32 phaseId,
        bytes32 counterId,
        bytes32 subjectKey
    ) public pure override returns (bytes32) {
        return keccak256(abi.encode(manager, collectionId, phaseId, counterId, subjectKey));
    }

    function _requireLedgerWriter() private view {
        if (!ledgerWriter[msg.sender]) {
            revert UnauthorizedLedgerWriter(msg.sender);
        }
    }

    function _requirePhasePolicy(
        address manager,
        uint256 collectionId,
        bytes32 phaseId,
        bytes32 policyHash
    ) private pure {
        if (
            manager == address(0) || collectionId == 0 || phaseId == bytes32(0)
                || policyHash == bytes32(0)
        ) {
            revert InvalidPhasePolicy(manager, collectionId, phaseId);
        }
    }

    function _registerCounterPolicy(
        address manager,
        uint256 collectionId,
        bytes32 phaseId,
        bytes32 policyHash,
        uint256 activeVersion,
        bytes32[] calldata counterIds,
        LedgerCounterPolicy[] calldata counterPolicies,
        uint256 index
    ) private {
        bytes32 counterId = counterIds[index];
        _requireNoDuplicateCounterId(counterIds, index, counterId);
        LedgerCounterPolicy calldata policy = counterPolicies[index];
        _requireStaticCounterPolicy(counterId, policy);
        _registeredCounterPolicies[manager][collectionId][phaseId][counterId] = policy;
        _registeredCounterPolicyVersions[manager][collectionId][phaseId][counterId] = activeVersion;
        _emitCounterPolicyRegistered(manager, collectionId, phaseId, counterId, policy, policyHash);
    }

    function _emitCounterPolicyRegistered(
        address manager,
        uint256 collectionId,
        bytes32 phaseId,
        bytes32 counterId,
        LedgerCounterPolicy calldata policy,
        bytes32 policyHash
    ) private {
        emit MintLedgerCounterPolicyRegistered(
            manager,
            collectionId,
            phaseId,
            counterId,
            policy.capMode,
            policy.deltaMode,
            policy.staticCap,
            policy.staticIncrement,
            policy.counterConfigHash,
            policyHash
        );
    }

    function _requireNoDuplicateCounterId(
        bytes32[] calldata counterIds,
        uint256 index,
        bytes32 counterId
    ) private pure {
        if (counterId == bytes32(0)) {
            revert InvalidCounterPolicy(counterId);
        }
        for (uint256 j = 0; j < index; j++) {
            if (counterIds[j] == counterId) {
                revert DuplicateCounterPolicy(counterId);
            }
        }
    }

    function _requireStaticCounterPolicy(bytes32 counterId, LedgerCounterPolicy calldata policy)
        private
        pure
    {
        if (
            !policy.enabled || policy.deltaMode != CounterDeltaMode.STATIC
                || policy.capMode == CounterCapMode.RESOLVER || policy.staticIncrement == 0
                || policy.counterConfigHash == bytes32(0)
        ) {
            revert InvalidCounterPolicy(counterId);
        }
        if (policy.capMode == CounterCapMode.STATIC && policy.staticCap == 0) {
            revert InvalidCounterPolicy(counterId);
        }
        if (policy.capMode == CounterCapMode.NONE && policy.staticCap != 0) {
            revert InvalidCounterPolicy(counterId);
        }
    }

    function _requireNoNullifiers(bytes32[] calldata nullifiers) private pure {
        if (nullifiers.length != 0) {
            revert NullifiersUnsupported(nullifiers[0]);
        }
    }

    function _consumeCounter(CounterConsumption calldata consumption, bytes32 policyHash) private {
        bytes32 registeredHash =
            registeredPhasePolicyHash[msg.sender][consumption.collectionId][consumption.phaseId];
        if (registeredHash == bytes32(0) || registeredHash != policyHash) {
            revert InvalidPhasePolicy(msg.sender, consumption.collectionId, consumption.phaseId);
        }
        LedgerCounterPolicy memory policy = _registeredCounterPolicies[
            msg.sender
        ][consumption.collectionId][consumption.phaseId][consumption.counterId];
        if (
            !policy.enabled
                || _registeredCounterPolicyVersions[
                        msg.sender
                    ][consumption.collectionId][consumption.phaseId][consumption.counterId]
                    != _phasePolicyVersion[
                        msg.sender
                    ][consumption.collectionId][consumption.phaseId]
        ) {
            revert CounterPolicyNotRegistered(
                msg.sender, consumption.collectionId, consumption.phaseId, consumption.counterId
            );
        }
        if (
            consumption.valueKey == bytes32(0) || consumption.counterId == bytes32(0)
                || consumption.subjectKey == bytes32(0)
                || consumption.increment != policy.staticIncrement
                || policy.deltaMode != CounterDeltaMode.STATIC
                || policy.capMode == CounterCapMode.RESOLVER
        ) {
            revert CounterPolicyMismatch(consumption.counterId);
        }
        bytes32 expectedValueKey = deriveCounterValueKey(
            msg.sender,
            consumption.collectionId,
            consumption.phaseId,
            consumption.counterId,
            consumption.subjectKey
        );
        if (consumption.valueKey != expectedValueKey) {
            revert CounterValueKeyMismatch(consumption.valueKey, expectedValueKey);
        }
        if (policy.capMode == CounterCapMode.STATIC && consumption.cap != policy.staticCap) {
            revert CounterPolicyMismatch(consumption.counterId);
        }
        if (policy.capMode == CounterCapMode.NONE && consumption.cap != 0) {
            revert CounterPolicyMismatch(consumption.counterId);
        }

        uint64 currentValue = counterValue[consumption.valueKey];
        if (type(uint64).max - currentValue < consumption.increment) {
            revert CounterValueOverflow(consumption.valueKey);
        }
        uint64 newValue = currentValue + consumption.increment;
        if (policy.capMode == CounterCapMode.STATIC && newValue > policy.staticCap) {
            revert CounterCapExceeded(consumption.valueKey, newValue, policy.staticCap);
        }
        counterValue[consumption.valueKey] = newValue;
        _emitCounterConsumed(consumption, newValue, policyHash);
    }

    function _emitCounterConsumed(
        CounterConsumption calldata consumption,
        uint64 newValue,
        bytes32 policyHash
    ) private {
        emit MintLedgerCounterConsumed(
            consumption.valueKey,
            consumption.collectionId,
            consumption.phaseId,
            msg.sender,
            consumption.counterId,
            consumption.subjectKey,
            consumption.increment,
            newValue,
            consumption.cap,
            policyHash
        );
        emit MintLedgerCounterConsumptionContext(
            consumption.valueKey,
            consumption.counterId,
            consumption.subjectKey,
            msg.sender,
            consumption.payer,
            consumption.recipient,
            consumption.authorizer,
            consumption.executor,
            consumption.contextHash,
            consumption.resolutionHash
        );
    }
}
