// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../interfaces/stream/IStreamMintLedger.sol";
import "../../vendor/openzeppelin/Ownable.sol";

/// @notice Durable outside-Core accounting ledger for launch mint counters.
contract StreamMintLedger is IStreamMintLedger, Ownable {
    uint16 public constant SCHEMA_VERSION = 1;
    uint64 public constant MAX_POLICY_GRACE_SECONDS = 2_592_000;
    bytes32 public constant VALUE_KEY_DOMAIN = keccak256("6529STREAM_MINT_COUNTER_VALUE_KEY_V1");

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
    mapping(address => mapping(uint256 => mapping(bytes32 => uint256))) private
        _counterPolicyVersion;
    mapping(address => mapping(uint256 => mapping(bytes32 => uint64))) private _phasePolicyRevision;
    mapping(address => mapping(uint256 => mapping(bytes32 => LedgerPolicyGrace))) private
        _policyGrace;
    /// @notice Returns the durable uint64 value for one ledger counter key.
    /// @dev Counter values are not reset by phase policy re-registration.
    mapping(bytes32 => uint64) public override counterValue;
    mapping(address => mapping(bytes32 => bool)) private _authorizationUsed;
    mapping(address => mapping(bytes32 => bool)) private _nullifierUsed;
    mapping(address => mapping(bytes32 => bool)) private _operationRootUsed;

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
        LedgerCounterPolicy[] calldata counterPolicies,
        uint64 graceUntil
    ) external override {
        _requireLedgerWriter();
        _requirePhasePolicy(manager, collectionId, phaseId, policyHash);
        if (manager != msg.sender) {
            revert InvalidPhasePolicy(manager, collectionId, phaseId);
        }
        if (counterIds.length != counterPolicies.length) {
            revert CounterPolicyLengthMismatch(counterIds.length, counterPolicies.length);
        }

        bytes32 previousPolicyHash = registeredPhasePolicyHash[manager][collectionId][phaseId];
        uint64 previousRevision = _phasePolicyRevision[manager][collectionId][phaseId];
        uint64 activeRevision = previousRevision;
        uint256 activeCounterVersion = _counterPolicyVersion[manager][collectionId][phaseId] + 1;
        _counterPolicyVersion[manager][collectionId][phaseId] = activeCounterVersion;
        if (previousPolicyHash != policyHash) {
            if (activeRevision == type(uint64).max) {
                revert InvalidPhasePolicy(manager, collectionId, phaseId);
            }
            activeRevision++;
            if (previousPolicyHash == bytes32(0)) {
                if (graceUntil != 0) {
                    revert InvalidPolicyGrace(graceUntil);
                }
            } else {
                _setPolicyGrace(
                    manager,
                    collectionId,
                    phaseId,
                    previousPolicyHash,
                    previousRevision,
                    policyHash,
                    graceUntil
                );
            }
        } else if (graceUntil != 0) {
            revert InvalidPolicyGrace(graceUntil);
        }
        _phasePolicyRevision[manager][collectionId][phaseId] = activeRevision;
        registeredPhasePolicyHash[manager][collectionId][phaseId] = policyHash;
        emit MintLedgerPhasePolicyRegistered(manager, collectionId, phaseId, policyHash);

        for (uint256 i = 0; i < counterIds.length; i++) {
            _registerCounterPolicy(
                manager,
                collectionId,
                phaseId,
                policyHash,
                activeCounterVersion,
                counterIds,
                counterPolicies,
                i
            );
        }
    }

    /// @notice Consumes one manager-scoped operation root and its accounting facts.
    function consume(
        uint256 collectionId,
        bytes32 phaseId,
        CounterConsumption[] calldata consumptions,
        bytes32 authorizationId,
        bytes32[] calldata nullifiers,
        bytes32 boundPolicyHash,
        bytes32 operationRoot
    ) external override {
        _requireLedgerWriter();
        bytes32 currentPolicyHash = registeredPhasePolicyHash[msg.sender][collectionId][phaseId];
        _requireBoundPolicy(msg.sender, collectionId, phaseId, currentPolicyHash, boundPolicyHash);
        _requireOperationRoot(operationRoot);

        bool hasAuthorization = authorizationId != bytes32(0);
        if (hasAuthorization && _authorizationUsed[msg.sender][authorizationId]) {
            revert AuthorizationAlreadyConsumed(authorizationId);
        }
        _requireUnusedNullifiers(nullifiers);

        for (uint256 i = 0; i < consumptions.length; i++) {
            CounterConsumption calldata consumption = consumptions[i];
            if (consumption.collectionId != collectionId || consumption.phaseId != phaseId) {
                revert InvalidPhasePolicy(msg.sender, collectionId, phaseId);
            }
            _consumeCounter(consumption, boundPolicyHash, operationRoot);
        }

        _operationRootUsed[msg.sender][operationRoot] = true;
        if (hasAuthorization) {
            _authorizationUsed[msg.sender][authorizationId] = true;
            emit MintLedgerAuthorizationConsumed(
                SCHEMA_VERSION, authorizationId, operationRoot, msg.sender, boundPolicyHash
            );
        }
        for (uint256 i = 0; i < nullifiers.length; i++) {
            bytes32 nullifier = nullifiers[i];
            _nullifierUsed[msg.sender][nullifier] = true;
            emit MintLedgerNullifierConsumed(
                SCHEMA_VERSION, nullifier, operationRoot, msg.sender, boundPolicyHash
            );
        }
        emit MintLedgerOperationRootConsumed(
            SCHEMA_VERSION,
            operationRoot,
            msg.sender,
            currentPolicyHash,
            boundPolicyHash,
            authorizationId
        );
    }

    /// @notice Returns the registered static policy for one counter.
    function registeredCounterPolicy(
        address manager,
        uint256 collectionId,
        bytes32 phaseId,
        bytes32 counterId
    ) external view override returns (LedgerCounterPolicy memory) {
        uint256 activeVersion = _counterPolicyVersion[manager][collectionId][phaseId];
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

    /// @notice Returns whether a manager has already consumed an authorization ID.
    function isManagerAuthorizationUsed(address manager, bytes32 authorizationId)
        external
        view
        override
        returns (bool)
    {
        return _authorizationUsed[manager][authorizationId];
    }

    /// @notice Returns whether a manager has already consumed a nullifier.
    function isManagerNullifierUsed(address manager, bytes32 nullifier)
        external
        view
        override
        returns (bool)
    {
        return _nullifierUsed[manager][nullifier];
    }

    /// @notice Returns whether a manager has already consumed an operation root.
    function isManagerOperationRootUsed(address manager, bytes32 operationRoot)
        external
        view
        override
        returns (bool)
    {
        return _operationRootUsed[manager][operationRoot];
    }

    /// @notice Returns the immediate predecessor grace tuple for a manager phase.
    function policyGrace(address manager, uint256 collectionId, bytes32 phaseId)
        external
        view
        override
        returns (
            bytes32 previousPolicyHash,
            uint64 previousPolicyRevision,
            uint64 previousPolicyGraceUntil
        )
    {
        LedgerPolicyGrace memory grace = _policyGrace[manager][collectionId][phaseId];
        return
            (grace.previousPolicyHash, grace.previousPolicyRevision, grace.previousPolicyGraceUntil);
    }

    /// @notice Derives the canonical value key for a manager counter subject.
    function deriveCounterValueKey(
        address manager,
        uint256 collectionId,
        bytes32 phaseId,
        bytes32 counterId,
        bytes32 subjectKey
    ) public pure override returns (bytes32) {
        return keccak256(
            abi.encode(VALUE_KEY_DOMAIN, manager, collectionId, phaseId, counterId, subjectKey)
        );
    }

    function _setPolicyGrace(
        address manager,
        uint256 collectionId,
        bytes32 phaseId,
        bytes32 previousPolicyHash,
        uint64 previousRevision,
        bytes32 newPolicyHash,
        uint64 graceUntil
    ) private {
        if (previousPolicyHash == bytes32(0)) {
            if (graceUntil != 0) {
                revert InvalidPolicyGrace(graceUntil);
            }
            delete _policyGrace[manager][collectionId][phaseId];
        } else if (graceUntil == 0) {
            delete _policyGrace[manager][collectionId][phaseId];
        } else {
            if (graceUntil > block.timestamp + MAX_POLICY_GRACE_SECONDS) {
                revert InvalidPolicyGrace(graceUntil);
            }
            _policyGrace[manager][collectionId][phaseId] = LedgerPolicyGrace({
                previousPolicyHash: previousPolicyHash,
                previousPolicyRevision: previousRevision,
                previousPolicyGraceUntil: graceUntil
            });
        }
        emit MintLedgerPolicyGraceSet(
            SCHEMA_VERSION,
            collectionId,
            phaseId,
            manager,
            previousPolicyHash,
            newPolicyHash,
            graceUntil
        );
    }

    function _requireBoundPolicy(
        address manager,
        uint256 collectionId,
        bytes32 phaseId,
        bytes32 currentPolicyHash,
        bytes32 boundPolicyHash
    ) private view {
        if (currentPolicyHash == bytes32(0) || boundPolicyHash == bytes32(0)) {
            revert InvalidPhasePolicy(manager, collectionId, phaseId);
        }
        if (boundPolicyHash == currentPolicyHash) {
            return;
        }
        LedgerPolicyGrace memory grace = _policyGrace[manager][collectionId][phaseId];
        uint64 currentRevision = _phasePolicyRevision[manager][collectionId][phaseId];
        if (
            grace.previousPolicyHash != boundPolicyHash
                || grace.previousPolicyRevision + 1 != currentRevision
                || block.timestamp > grace.previousPolicyGraceUntil
        ) {
            revert InvalidPhasePolicy(manager, collectionId, phaseId);
        }
    }

    function _requireOperationRoot(bytes32 operationRoot) private view {
        if (operationRoot == bytes32(0)) {
            revert OperationRootRequired();
        }
        if (_operationRootUsed[msg.sender][operationRoot]) {
            revert OperationRootAlreadyConsumed(msg.sender, operationRoot);
        }
    }

    function _requireUnusedNullifiers(bytes32[] calldata nullifiers) private view {
        for (uint256 i = 0; i < nullifiers.length; i++) {
            bytes32 nullifier = nullifiers[i];
            if (nullifier == bytes32(0) || _nullifierUsed[msg.sender][nullifier]) {
                revert NullifierAlreadyConsumed(nullifier);
            }
            for (uint256 j = 0; j < i; j++) {
                if (nullifiers[j] == nullifier) {
                    revert NullifierAlreadyConsumed(nullifier);
                }
            }
        }
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
    ) private view {
        if (
            manager == address(0) || manager != msg.sender || collectionId == 0
                || phaseId == bytes32(0) || policyHash == bytes32(0)
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

    function _consumeCounter(
        CounterConsumption calldata consumption,
        bytes32 boundPolicyHash,
        bytes32 operationRoot
    ) private {
        LedgerCounterPolicy memory policy = _registeredCounterPolicies[
            msg.sender
        ][consumption.collectionId][consumption.phaseId][consumption.counterId];
        if (
            !policy.enabled
                || _registeredCounterPolicyVersions[
                        msg.sender
                    ][consumption.collectionId][consumption.phaseId][consumption.counterId]
                    != _counterPolicyVersion[
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
        _emitCounterConsumed(consumption, newValue, boundPolicyHash, operationRoot);
    }

    function _emitCounterConsumed(
        CounterConsumption calldata consumption,
        uint64 newValue,
        bytes32 boundPolicyHash,
        bytes32 operationRoot
    ) private {
        emit MintLedgerCounterConsumed(
            SCHEMA_VERSION,
            consumption.valueKey,
            consumption.collectionId,
            consumption.phaseId,
            msg.sender,
            consumption.counterId,
            consumption.subjectKey,
            consumption.increment,
            newValue,
            consumption.cap,
            boundPolicyHash,
            operationRoot
        );
        emit MintLedgerCounterConsumptionContext(
            SCHEMA_VERSION,
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
