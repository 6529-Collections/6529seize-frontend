// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../interfaces/stream/IStreamCore.sol";
import "../../interfaces/stream/IStreamMintLedger.sol";
import "../../interfaces/stream/IStreamMintManager.sol";
import "../../interfaces/stream/IStreamMintModuleRegistry.sol";
import "../../vendor/openzeppelin/Ownable.sol";
import "../../vendor/openzeppelin/ReentrancyGuard.sol";
import "./StreamMintCoreExecutor.sol";
import "./StreamMintGateValidator.sol";
import "./StreamMintOperationIdentity.sol";

/// @notice Outside-Core phase policy and prepared mint execution manager.
contract StreamMintManager is IStreamMintManager, Ownable, ReentrancyGuard {
    /// @notice Domain separator for active phase policy hashes.
    bytes32 public constant POLICY_DOMAIN = keccak256("6529STREAM_MINT_MANAGER_POLICY_V1");
    /// @notice Domain separator for phase configuration hashes.
    bytes32 public constant PHASE_CONFIG_DOMAIN =
        keccak256("6529STREAM_MINT_MANAGER_PHASE_CONFIG_V1");
    /// @notice Domain separator for ordered counter configuration hashes.
    bytes32 public constant COUNTER_CONFIG_DOMAIN =
        keccak256("6529STREAM_MINT_MANAGER_COUNTER_CONFIG_V1");
    /// @notice Domain separator for optional gate configuration hashes.
    bytes32 public constant GATE_CONFIG_DOMAIN =
        keccak256("6529STREAM_MINT_MANAGER_GATE_CONFIG_V1");
    /// @notice Domain separator for sorted executor set hashes.
    bytes32 public constant EXECUTOR_SET_DOMAIN =
        keccak256("6529STREAM_MINT_MANAGER_EXECUTOR_SET_V1");
    /// @notice Domain separator for manager-derived counter subjects.
    bytes32 public constant SUBJECT_DOMAIN = keccak256("6529STREAM_MINT_COUNTER_SUBJECT_V1");
    /// @notice Domain separator for counter resolution hashes.
    bytes32 public constant RESOLUTION_DOMAIN = keccak256("6529STREAM_MINT_COUNTER_RESOLUTION_V1");
    /// @notice Domain separators for the canonical batch-operation transcript.
    bytes32 public constant MINT_REQUEST_COMMITMENT_DOMAIN =
        keccak256("6529STREAM_MINT_REQUEST_COMMITMENT_V1");
    bytes32 public constant MINT_VALIDATED_RESULT_DOMAIN =
        keccak256("6529STREAM_MINT_VALIDATED_RESULT_V1");
    bytes32 public constant MINT_COUNTER_CONSUMPTIONS_DOMAIN =
        keccak256("6529STREAM_MINT_COUNTER_CONSUMPTIONS_V1");
    bytes32 public constant MINT_NULLIFIERS_DOMAIN = keccak256("6529STREAM_MINT_NULLIFIERS_V1");
    bytes32 public constant MINT_OPERATION_ROOT_DOMAIN =
        keccak256("6529STREAM_MINT_OPERATION_ROOT_V1");
    bytes32 public constant MINT_TOKEN_OPERATION_ID_DOMAIN =
        keccak256("6529STREAM_MINT_TOKEN_OPERATION_ID_V1");
    bytes32 public constant MINT_EXECUTION_PATH_SINGLE_STEP =
        keccak256("6529STREAM_MINT_EXECUTION_PATH_SINGLE_STEP_V1");
    bytes32 public constant MINT_EXECUTION_PATH_PREPARED =
        keccak256("6529STREAM_MINT_EXECUTION_PATH_PREPARED_V1");
    bytes32 public constant BATCH_RECIPIENTS_DOMAIN =
        keccak256("6529STREAM_MINT_BATCH_RECIPIENTS_V1");
    bytes32 public constant BATCH_BENEFICIARIES_DOMAIN =
        keccak256("6529STREAM_MINT_BATCH_BENEFICIARIES_V1");
    bytes32 public constant BATCH_TOKEN_DATA_DOMAIN =
        keccak256("6529STREAM_MINT_BATCH_TOKEN_DATA_V1");
    bytes32 public constant BATCH_COMMITMENTS_DOMAIN =
        keccak256("6529STREAM_MINT_BATCH_COMMITMENTS_V1");

    /// @notice Manager policy schema version encoded into policy hashes.
    uint16 public constant SCHEMA_VERSION = 1;
    /// @notice Launch hard cap for one prepared mint batch.
    uint32 public constant MAX_PHASE_BATCH_QUANTITY = 10;
    /// @notice Launch hard cap for enabled counters evaluated by one phase.
    uint16 public constant MAX_PHASE_COUNTERS = 16;
    /// @notice Launch hard cap for enabled executors included in one policy hash.
    uint16 public constant MAX_PHASE_EXECUTORS = 64;
    /// @notice StreamCore dependency that owns prepared mint hooks.
    IStreamCore public immutable core;
    /// @notice StreamMintLedger dependency that enforces phase counter consumption.
    IStreamMintLedger public immutable mintLedger;
    /// @notice Registry dependency that approves optional mint gate modules.
    IStreamMintModuleRegistry public immutable moduleRegistry;
    /// @notice Next nonce reserved for prepared mint operation IDs.
    uint256 public override nextOperationNonce;

    struct PhaseState {
        bool exists;
        MintPhaseConfig config;
    }

    struct OperationTranscript {
        uint256 quantity;
        uint256 firstOperationNonce;
        bytes32 currentPolicyHash;
        bytes32 boundPolicyHash;
        bytes32 operationRoot;
        bytes32[] operationIds;
        IStreamMintLedger.CounterConsumption[] consumptions;
        StreamMintOperationIdentity.MintAuthorization authorization;
    }

    mapping(uint256 => mapping(bytes32 => PhaseState)) private _phases;
    mapping(uint256 => mapping(bytes32 => MintGateConfig)) private _phaseGateConfigs;
    /// @notice Active manager policy hash for each configured phase.
    mapping(uint256 => mapping(bytes32 => bytes32)) public override phasePolicyHash;
    /// @notice Whether an executor may mint for a configured phase.
    mapping(uint256 => mapping(bytes32 => mapping(address => bool))) public override phaseExecutor;
    mapping(uint256 => mapping(bytes32 => bytes32[])) private _phaseCounterIds;
    mapping(uint256 => mapping(bytes32 => mapping(bytes32 => MintCounterConfig))) private
        _counterConfigs;
    mapping(uint256 => mapping(bytes32 => address[])) private _phaseExecutors;
    mapping(uint256 => mapping(bytes32 => mapping(address => uint256))) private _phaseExecutorIndex;

    constructor(
        IStreamCore core_,
        IStreamMintLedger mintLedger_,
        IStreamMintModuleRegistry moduleRegistry_
    ) {
        if (address(core_).code.length == 0) {
            revert InvalidCoreContract(address(core_));
        }
        try core_.supportsInterface(0x80ac58cd) returns (bool ok) {
            if (!ok) {
                revert InvalidCoreContract(address(core_));
            }
        } catch {
            revert InvalidCoreContract(address(core_));
        }

        if (address(mintLedger_).code.length == 0) {
            revert InvalidMintLedgerContract(address(mintLedger_));
        }
        try mintLedger_.isStreamMintLedger() returns (bool ok) {
            if (!ok) {
                revert InvalidMintLedgerContract(address(mintLedger_));
            }
        } catch {
            revert InvalidMintLedgerContract(address(mintLedger_));
        }

        if (address(moduleRegistry_).code.length == 0) {
            revert InvalidMintModuleRegistry(address(moduleRegistry_));
        }
        try moduleRegistry_.isStreamMintModuleRegistry() returns (bool ok) {
            if (!ok) {
                revert InvalidMintModuleRegistry(address(moduleRegistry_));
            }
        } catch {
            revert InvalidMintModuleRegistry(address(moduleRegistry_));
        }

        core = core_;
        mintLedger = mintLedger_;
        moduleRegistry = moduleRegistry_;
    }

    /// @notice Returns true for deployment validation.
    function isStreamMintManager() external pure override returns (bool) {
        return true;
    }

    /// @notice Configures and registers a launch-static phase policy.
    function configurePhase(
        uint256 collectionId,
        bytes32 phaseId,
        MintPhaseConfig calldata config,
        MintGateConfig calldata gateConfig,
        bytes32[] calldata counterIds,
        MintCounterConfig[] calldata counterConfigs
    ) external override onlyOwner nonReentrant returns (bytes32 policyHash) {
        _requirePhaseIdentity(collectionId, phaseId);
        if (_phases[collectionId][phaseId].exists) {
            revert MintPhaseAlreadyConfigured(collectionId, phaseId);
        }
        _requirePhaseConfig(collectionId, phaseId, config);
        if (counterIds.length == 0 || counterIds.length != counterConfigs.length) {
            revert MintArrayLengthMismatch();
        }
        if (counterIds.length > MAX_PHASE_COUNTERS) {
            revert MintCounterCountLimitExceeded(counterIds.length, MAX_PHASE_COUNTERS);
        }

        bytes32[] memory ids = _copyCounterIds(counterIds);
        IStreamMintLedger.LedgerCounterPolicy[] memory ledgerPolicies =
            new IStreamMintLedger.LedgerCounterPolicy[](counterIds.length);
        for (uint256 i = 0; i < counterIds.length; i++) {
            _requireNoDuplicateCounterId(counterIds, i);
            _requireStaticCounterConfig(counterIds[i], counterConfigs[i]);
            ledgerPolicies[i] = _ledgerPolicy(counterConfigs[i]);
        }
        MintGateConfig memory validatedGateConfig =
            StreamMintGateValidator.validateConfiguration(gateConfig, moduleRegistry);

        _replacePhaseCounters(collectionId, phaseId, ids, counterConfigs);
        _phaseGateConfigs[collectionId][phaseId] = validatedGateConfig;
        _phases[collectionId][phaseId] = PhaseState({ exists: true, config: config });

        policyHash = _computePolicyHash(collectionId, phaseId);
        phasePolicyHash[collectionId][phaseId] = policyHash;
        mintLedger.registerPhasePolicy(
            address(this), collectionId, phaseId, policyHash, ids, ledgerPolicies, 0
        );

        _emitPhaseConfigured(collectionId, phaseId, config, policyHash);
        for (uint256 i = 0; i < counterIds.length; i++) {
            _emitCounterConfigured(
                collectionId, phaseId, counterIds[i], counterConfigs[i], policyHash
            );
        }
        _emitGateConfigured(collectionId, phaseId, validatedGateConfig, policyHash);
    }

    /// @notice Enables or disables a caller for a configured phase.
    function setPhaseExecutor(uint256 collectionId, bytes32 phaseId, address executor, bool allowed)
        external
        override
        onlyOwner
        nonReentrant
    {
        _requireConfiguredPhase(collectionId, phaseId);
        if (executor == address(0)) {
            revert InvalidMintExecutor(executor);
        }
        if (phaseExecutor[collectionId][phaseId][executor] == allowed) {
            return;
        }
        phaseExecutor[collectionId][phaseId][executor] = allowed;
        if (allowed) {
            uint256 executorCount = _phaseExecutors[collectionId][phaseId].length;
            if (executorCount >= MAX_PHASE_EXECUTORS) {
                revert MintExecutorCountLimitExceeded(executorCount + 1, MAX_PHASE_EXECUTORS);
            }
            _phaseExecutorIndex[collectionId][phaseId][executor] = executorCount + 1;
            _phaseExecutors[collectionId][phaseId].push(executor);
        } else {
            _removePhaseExecutor(collectionId, phaseId, executor);
        }

        bytes32 policyHash = _refreshLedgerPolicy(collectionId, phaseId);
        emit MintPhaseExecutorUpdated(
            collectionId, phaseId, executor, allowed, policyHash, msg.sender
        );
    }

    /// @notice Pauses or unpauses a configured phase.
    function setPhasePaused(uint256 collectionId, bytes32 phaseId, bool paused)
        external
        override
        onlyOwner
        nonReentrant
    {
        PhaseState storage phaseState = _requireConfiguredPhase(collectionId, phaseId);
        if (phaseState.config.paused == paused) {
            return;
        }
        phaseState.config.paused = paused;
        bytes32 policyHash = _refreshLedgerPolicy(collectionId, phaseId);
        emit MintPhasePausedEvent(collectionId, phaseId, paused, policyHash, msg.sender);
    }

    /// @notice Executes the immediate Core manager path atomically.
    function executeSingleStepMint(MintBatch calldata batch, bytes calldata gateData)
        external
        override
        nonReentrant
        returns (uint256[] memory tokenIds, bytes32 operationRoot, bytes32[] memory operationIds)
    {
        OperationTranscript memory transcript =
            _operationTranscript(batch, gateData, MINT_EXECUTION_PATH_SINGLE_STEP);
        _reserveOperationNonces(transcript.firstOperationNonce, transcript.quantity);
        _consumeOperation(batch, transcript);
        _emitGateValidation(batch, transcript);

        tokenIds = new uint256[](transcript.quantity);
        for (uint256 i = 0; i < transcript.quantity; i++) {
            tokenIds[i] = StreamMintCoreExecutor.executeSingleStep(
                core, batch, i, transcript.operationRoot, transcript.operationIds[i], SCHEMA_VERSION
            );
        }

        _emitOperationCompletion(batch, transcript, tokenIds[0]);
        return (tokenIds, transcript.operationRoot, transcript.operationIds);
    }

    /// @notice Executes the prepared Core manager path atomically.
    function executePreparedMint(MintBatch calldata batch, bytes calldata gateData)
        external
        override
        nonReentrant
        returns (uint256[] memory tokenIds, bytes32 operationRoot, bytes32[] memory operationIds)
    {
        OperationTranscript memory transcript =
            _operationTranscript(batch, gateData, MINT_EXECUTION_PATH_PREPARED);
        _reserveOperationNonces(transcript.firstOperationNonce, transcript.quantity);
        _consumeOperation(batch, transcript);
        _emitGateValidation(batch, transcript);

        tokenIds = new uint256[](transcript.quantity);
        for (uint256 i = 0; i < transcript.quantity; i++) {
            tokenIds[i] = StreamMintCoreExecutor.executePrepared(
                core, batch, i, transcript.operationRoot, transcript.operationIds[i], SCHEMA_VERSION
            );
        }

        _emitOperationCompletion(batch, transcript, tokenIds[0]);
        return (tokenIds, transcript.operationRoot, transcript.operationIds);
    }

    /// @notice Previews the single-step identity transcript for the current manager state.
    /// @dev Matches execution only while the nonce, phase policy/grace, and gate result stay unchanged.
    function previewSingleStepMintOperation(MintBatch calldata batch, bytes calldata gateData)
        external
        view
        override
        returns (bytes32 operationRoot, bytes32[] memory operationIds)
    {
        OperationTranscript memory transcript =
            _operationTranscript(batch, gateData, MINT_EXECUTION_PATH_SINGLE_STEP);
        return (transcript.operationRoot, transcript.operationIds);
    }

    function _emitOperationCompletion(
        MintBatch calldata batch,
        OperationTranscript memory transcript,
        uint256 firstTokenId
    ) private {
        emit MintAuthorizationConsumed(
            SCHEMA_VERSION,
            batch.collectionId,
            batch.phaseId,
            batch.authorizationId,
            transcript.boundPolicyHash,
            transcript.operationRoot
        );
        emit MintBatchExecuted(
            SCHEMA_VERSION,
            transcript.operationRoot,
            batch.collectionId,
            batch.phaseId,
            msg.sender,
            batch.payer,
            transcript.authorization.authorizer,
            firstTokenId,
            transcript.quantity,
            batch.contextHash,
            transcript.authorization.gateHash,
            transcript.currentPolicyHash,
            transcript.boundPolicyHash
        );
    }

    /// @notice Returns immutable phase config plus existence.
    function phase(uint256 collectionId, bytes32 phaseId)
        external
        view
        override
        returns (bool exists, MintPhaseConfig memory config)
    {
        PhaseState storage phaseState = _phases[collectionId][phaseId];
        return (phaseState.exists, phaseState.config);
    }

    /// @notice Returns manager-scoped authorization replay state independent of the caller.
    function isAuthorizationUsed(bytes32 authorizationId) external view override returns (bool) {
        return mintLedger.isManagerAuthorizationUsed(address(this), authorizationId);
    }

    /// @notice Returns manager-scoped nullifier replay state independent of the caller.
    function isNullifierUsed(bytes32 nullifier) external view override returns (bool) {
        return mintLedger.isManagerNullifierUsed(address(this), nullifier);
    }

    /// @notice Returns manager-scoped operation-root replay state independent of the caller.
    function isOperationRootUsed(bytes32 operationRoot) external view override returns (bool) {
        return mintLedger.isManagerOperationRootUsed(address(this), operationRoot);
    }

    /// @notice Returns the immediate predecessor policy and its grace expiry.
    function phasePolicyGrace(uint256 collectionId, bytes32 phaseId)
        external
        view
        override
        returns (bytes32 previousPolicyHash, uint64 graceUntil)
    {
        // Revision adjacency is enforced by the ledger; this view exposes only hash and expiry.
        // slither-disable-next-line unused-return
        (previousPolicyHash,, graceUntil) =
            mintLedger.policyGrace(address(this), collectionId, phaseId);
    }

    /// @notice Returns the ordered counter IDs for a phase.
    function phaseCounterIds(uint256 collectionId, bytes32 phaseId)
        external
        view
        override
        returns (bytes32[] memory)
    {
        return _phaseCounterIds[collectionId][phaseId];
    }

    /// @notice Returns one manager-side counter config.
    function counterConfig(uint256 collectionId, bytes32 phaseId, bytes32 counterId)
        external
        view
        override
        returns (MintCounterConfig memory)
    {
        return _counterConfigs[collectionId][phaseId][counterId];
    }

    /// @notice Returns one phase's optional gate config.
    function phaseGate(uint256 collectionId, bytes32 phaseId)
        external
        view
        override
        returns (MintGateConfig memory)
    {
        return _phaseGateConfigs[collectionId][phaseId];
    }

    /// @notice Previews the manager-derived subject key for one token/counter context.
    function previewSubjectKey(
        CounterKeyMode keyMode,
        uint256 collectionId,
        bytes32 phaseId,
        bytes32 counterId,
        address payer,
        address recipient,
        address executor,
        address authorizer,
        bytes32 contextHash
    ) external view override returns (bytes32) {
        StreamMintOperationIdentity.SubjectContext memory context =
            StreamMintOperationIdentity.SubjectContext({
                chainId: block.chainid,
                ledger: address(mintLedger),
                collectionId: collectionId,
                phaseId: phaseId,
                counterId: counterId,
                payer: payer,
                recipient: recipient,
                executor: executor,
                authorizer: authorizer,
                contextHash: contextHash
            });
        return StreamMintOperationIdentity.subjectKey(keyMode, context);
    }

    /// @notice Previews the canonical ledger value key for a derived subject.
    function previewCounterValueKey(
        uint256 collectionId,
        bytes32 phaseId,
        bytes32 counterId,
        bytes32 subjectKey
    ) external view override returns (bytes32) {
        return mintLedger.deriveCounterValueKey(
            address(this), collectionId, phaseId, counterId, subjectKey
        );
    }

    function _requireConfiguredPhase(uint256 collectionId, bytes32 phaseId)
        private
        view
        returns (PhaseState storage phaseState)
    {
        phaseState = _phases[collectionId][phaseId];
        if (!phaseState.exists) {
            revert MintPhaseDoesNotExist(collectionId, phaseId);
        }
    }

    function _requireExecutablePhase(MintBatch calldata request)
        private
        view
        returns (PhaseState storage phaseState)
    {
        _requirePhaseIdentity(request.collectionId, request.phaseId);
        phaseState = _requireConfiguredPhase(request.collectionId, request.phaseId);
        if (phaseState.config.paused) {
            revert MintPhasePaused(request.collectionId, request.phaseId);
        }
        if (phaseState.config.startTime != 0 && block.timestamp < phaseState.config.startTime) {
            revert MintPhaseNotStarted(request.collectionId, request.phaseId, block.timestamp);
        }
        if (phaseState.config.endTime != 0 && block.timestamp > phaseState.config.endTime) {
            revert MintPhaseEnded(request.collectionId, request.phaseId, block.timestamp);
        }
        if (!phaseExecutor[request.collectionId][request.phaseId][msg.sender]) {
            revert UnauthorizedMintExecutor(request.collectionId, request.phaseId, msg.sender);
        }
    }

    function _validateMintBatch(MintBatch calldata request, MintPhaseConfig memory config)
        private
        pure
        returns (uint256 quantity)
    {
        quantity = request.initialRecipients.length;
        if (
            quantity == 0 || quantity != request.beneficiaries.length
                || quantity != request.tokenData.length
                || quantity != request.mintCommitments.length
        ) {
            revert MintArrayLengthMismatch();
        }
        if (quantity > config.maxBatchQuantity) {
            revert MintBatchQuantityLimitExceeded(quantity, config.maxBatchQuantity);
        }
        for (uint256 i = 0; i < quantity; i++) {
            if (
                request.initialRecipients[i] == address(0) || request.beneficiaries[i] == address(0)
            ) {
                revert InvalidMintRecipient(
                    i, request.initialRecipients[i], request.beneficiaries[i]
                );
            }
        }
    }

    function _operationTranscript(
        MintBatch calldata batch,
        bytes calldata gateData,
        bytes32 executionPath
    ) private view returns (OperationTranscript memory transcript) {
        PhaseState storage phaseState = _requireExecutablePhase(batch);
        transcript.quantity = _validateMintBatch(batch, phaseState.config);
        transcript.currentPolicyHash = _computePolicyHash(batch.collectionId, batch.phaseId);
        bytes32 registeredPolicyHash = phasePolicyHash[batch.collectionId][batch.phaseId];
        if (transcript.currentPolicyHash != registeredPolicyHash) {
            revert MintPolicyHashMismatch(registeredPolicyHash, transcript.currentPolicyHash);
        }
        transcript.boundPolicyHash = _requireBoundPolicyHash(batch, transcript.currentPolicyHash);
        transcript.authorization = StreamMintGateValidator.validateAuthorization(
            batch,
            gateData,
            transcript.quantity,
            transcript.boundPolicyHash,
            _phaseGateConfigs[batch.collectionId][batch.phaseId],
            moduleRegistry,
            msg.sender
        );
        transcript.consumptions =
            _counterConsumptions(batch, transcript.quantity, transcript.authorization.authorizer);
        transcript.firstOperationNonce = nextOperationNonce;
        if (type(uint256).max - transcript.firstOperationNonce < transcript.quantity) {
            revert MintOperationNonceOverflow(transcript.firstOperationNonce, transcript.quantity);
        }
        StreamMintOperationIdentity.TranscriptContext memory context =
            StreamMintOperationIdentity.TranscriptContext({
                chainId: block.chainid,
                manager: address(this),
                coreAddress: address(core),
                ledgerAddress: address(mintLedger),
                gate: _phaseGateConfigs[batch.collectionId][batch.phaseId].gate,
                executor: msg.sender,
                executionPath: executionPath,
                currentPolicyHash: transcript.currentPolicyHash,
                boundPolicyHash: transcript.boundPolicyHash,
                firstOperationNonce: transcript.firstOperationNonce,
                quantity: transcript.quantity
            });
        (transcript.operationRoot, transcript.operationIds) = StreamMintOperationIdentity.derive(
            batch, transcript.authorization, transcript.consumptions, context
        );
    }

    function _requireBoundPolicyHash(MintBatch calldata batch, bytes32 currentPolicyHash)
        private
        view
        returns (bytes32 boundPolicyHash)
    {
        boundPolicyHash = batch.expectedPolicyHash;
        if (boundPolicyHash == bytes32(0)) {
            revert MintPolicyHashRequired(batch.collectionId, batch.phaseId);
        }
        if (boundPolicyHash == currentPolicyHash) {
            return boundPolicyHash;
        }
        // The ledger independently enforces predecessor revision adjacency during consume.
        // slither-disable-next-line unused-return
        (bytes32 previousPolicyHash,, uint64 graceUntil) =
            mintLedger.policyGrace(address(this), batch.collectionId, batch.phaseId);
        if (boundPolicyHash != previousPolicyHash || block.timestamp > graceUntil) {
            revert MintPolicyHashMismatch(boundPolicyHash, currentPolicyHash);
        }
    }

    function _reserveOperationNonces(uint256 firstOperationNonce, uint256 quantity) private {
        nextOperationNonce = firstOperationNonce + quantity;
    }

    function _consumeOperation(MintBatch calldata batch, OperationTranscript memory transcript)
        private
    {
        mintLedger.consume(
            batch.collectionId,
            batch.phaseId,
            transcript.consumptions,
            batch.authorizationId,
            transcript.authorization.nullifiers,
            transcript.boundPolicyHash,
            transcript.operationRoot
        );
    }

    function _counterConsumptions(MintBatch calldata request, uint256 quantity, address authorizer)
        private
        view
        returns (IStreamMintLedger.CounterConsumption[] memory consumptions)
    {
        bytes32[] storage storedCounterIds = _phaseCounterIds[request.collectionId][request.phaseId];
        bytes32[] memory counterIds = new bytes32[](storedCounterIds.length);
        MintCounterConfig[] memory counterConfigs = new MintCounterConfig[](storedCounterIds.length);
        for (uint256 i = 0; i < storedCounterIds.length; i++) {
            bytes32 counterId = storedCounterIds[i];
            counterIds[i] = counterId;
            counterConfigs[i] = _counterConfigs[request.collectionId][request.phaseId][counterId];
        }
        StreamMintOperationIdentity.CounterContext memory context =
            StreamMintOperationIdentity.CounterContext({
                chainId: block.chainid,
                manager: address(this),
                ledger: address(mintLedger),
                executor: msg.sender,
                authorizer: authorizer
            });
        return StreamMintOperationIdentity.deriveCounterConsumptions(
            request, quantity, counterIds, counterConfigs, context
        );
    }

    function _emitGateValidation(MintBatch calldata batch, OperationTranscript memory transcript)
        private
    {
        address gate = _phaseGateConfigs[batch.collectionId][batch.phaseId].gate;
        if (gate == address(0)) {
            return;
        }
        emit MintGateValidated(
            batch.collectionId,
            batch.phaseId,
            gate,
            batch.authorizationId,
            transcript.authorization.authorizer,
            transcript.quantity,
            batch.contextHash,
            transcript.authorization.gateHash,
            transcript.boundPolicyHash
        );
    }

    function _refreshLedgerPolicy(uint256 collectionId, bytes32 phaseId)
        private
        returns (bytes32 policyHash)
    {
        bytes32[] storage counterIds = _phaseCounterIds[collectionId][phaseId];
        bytes32[] memory ids = new bytes32[](counterIds.length);
        IStreamMintLedger.LedgerCounterPolicy[] memory ledgerPolicies =
            new IStreamMintLedger.LedgerCounterPolicy[](counterIds.length);
        for (uint256 i = 0; i < counterIds.length; i++) {
            bytes32 counterId = counterIds[i];
            ids[i] = counterId;
            ledgerPolicies[i] = _ledgerPolicy(_counterConfigs[collectionId][phaseId][counterId]);
        }
        policyHash = _computePolicyHash(collectionId, phaseId);
        phasePolicyHash[collectionId][phaseId] = policyHash;
        mintLedger.registerPhasePolicy(
            address(this), collectionId, phaseId, policyHash, ids, ledgerPolicies, 0
        );
    }

    function _computePolicyHash(uint256 collectionId, bytes32 phaseId)
        private
        view
        returns (bytes32)
    {
        bytes32[] storage storedCounterIds = _phaseCounterIds[collectionId][phaseId];
        bytes32[] memory counterIds = new bytes32[](storedCounterIds.length);
        MintCounterConfig[] memory counterConfigs = new MintCounterConfig[](storedCounterIds.length);
        for (uint256 i = 0; i < storedCounterIds.length; i++) {
            bytes32 counterId = storedCounterIds[i];
            counterIds[i] = counterId;
            counterConfigs[i] = _counterConfigs[collectionId][phaseId][counterId];
        }
        StreamMintOperationIdentity.PolicyContext memory context =
            StreamMintOperationIdentity.PolicyContext({
                chainId: block.chainid,
                manager: address(this),
                ledger: address(mintLedger),
                moduleRegistry: address(moduleRegistry),
                schemaVersion: SCHEMA_VERSION,
                collectionId: collectionId,
                phaseId: phaseId
            });
        return StreamMintOperationIdentity.computePolicyHash(
            _phases[collectionId][phaseId].config,
            _phaseGateConfigs[collectionId][phaseId],
            counterIds,
            counterConfigs,
            _phaseExecutors[collectionId][phaseId],
            context
        );
    }

    function _replacePhaseCounters(
        uint256 collectionId,
        bytes32 phaseId,
        bytes32[] memory counterIds,
        MintCounterConfig[] calldata counterConfigs
    ) private {
        bytes32[] storage existing = _phaseCounterIds[collectionId][phaseId];
        for (uint256 i = 0; i < existing.length; i++) {
            delete _counterConfigs[collectionId][phaseId][existing[i]];
        }
        delete _phaseCounterIds[collectionId][phaseId];
        for (uint256 i = 0; i < counterIds.length; i++) {
            _phaseCounterIds[collectionId][phaseId].push(counterIds[i]);
            _counterConfigs[collectionId][phaseId][counterIds[i]] = counterConfigs[i];
        }
    }

    function _removePhaseExecutor(uint256 collectionId, bytes32 phaseId, address executor) private {
        uint256 indexPlusOne = _phaseExecutorIndex[collectionId][phaseId][executor];
        if (indexPlusOne == 0) {
            return;
        }
        uint256 index = indexPlusOne - 1;
        address[] storage executors = _phaseExecutors[collectionId][phaseId];
        address last = executors[executors.length - 1];
        if (index != executors.length - 1) {
            executors[index] = last;
            _phaseExecutorIndex[collectionId][phaseId][last] = indexPlusOne;
        }
        executors.pop();
        delete _phaseExecutorIndex[collectionId][phaseId][executor];
    }

    function _copyCounterIds(bytes32[] calldata counterIds)
        private
        pure
        returns (bytes32[] memory ids)
    {
        ids = new bytes32[](counterIds.length);
        for (uint256 i = 0; i < counterIds.length; i++) {
            ids[i] = counterIds[i];
        }
    }

    function _ledgerPolicy(MintCounterConfig memory config)
        private
        pure
        returns (IStreamMintLedger.LedgerCounterPolicy memory)
    {
        return IStreamMintLedger.LedgerCounterPolicy({
            enabled: config.enabled,
            capMode: config.capMode,
            deltaMode: config.deltaMode,
            staticCap: config.staticCap,
            staticIncrement: config.staticIncrement,
            counterConfigHash: config.counterConfigHash
        });
    }

    function _requirePhaseIdentity(uint256 collectionId, bytes32 phaseId) private pure {
        if (collectionId == 0 || phaseId == bytes32(0)) {
            revert InvalidMintPhase(collectionId, phaseId);
        }
    }

    function _requirePhaseConfig(
        uint256 collectionId,
        bytes32 phaseId,
        MintPhaseConfig calldata config
    ) private pure {
        if (config.endTime != 0 && config.startTime != 0 && config.endTime < config.startTime) {
            revert InvalidMintPhase(collectionId, phaseId);
        }
        if (config.maxBatchQuantity == 0 || config.maxBatchQuantity > MAX_PHASE_BATCH_QUANTITY) {
            revert InvalidMintBatchLimit(config.maxBatchQuantity, MAX_PHASE_BATCH_QUANTITY);
        }
    }

    function _requireNoDuplicateCounterId(bytes32[] calldata counterIds, uint256 index)
        private
        pure
    {
        bytes32 counterId = counterIds[index];
        if (counterId == bytes32(0)) {
            revert InvalidMintCounter(counterId);
        }
        for (uint256 i = 0; i < index; i++) {
            if (counterIds[i] == counterId) {
                revert DuplicateMintCounter(counterId);
            }
        }
    }

    function _requireStaticCounterConfig(bytes32 counterId, MintCounterConfig calldata config)
        private
        pure
    {
        if (
            !config.enabled || config.keyMode == CounterKeyMode.UNKNOWN
                || config.staticIncrement == 0 || config.counterConfigHash == bytes32(0)
        ) {
            revert InvalidMintCounter(counterId);
        }
        if (
            config.deltaMode != IStreamMintLedger.CounterDeltaMode.STATIC
                || config.capMode == IStreamMintLedger.CounterCapMode.RESOLVER
        ) {
            revert UnsupportedMintCounterMode(counterId);
        }
        if (config.capMode == IStreamMintLedger.CounterCapMode.STATIC && config.staticCap == 0) {
            revert InvalidMintCounter(counterId);
        }
        if (config.capMode == IStreamMintLedger.CounterCapMode.NONE && config.staticCap != 0) {
            revert InvalidMintCounter(counterId);
        }
    }

    function _emitCounterConfigured(
        uint256 collectionId,
        bytes32 phaseId,
        bytes32 counterId,
        MintCounterConfig calldata config,
        bytes32 policyHash
    ) private {
        emit MintCounterConfigured(
            collectionId,
            phaseId,
            counterId,
            config.keyMode,
            config.capMode,
            config.deltaMode,
            config.staticCap,
            config.staticIncrement,
            config.counterConfigHash,
            policyHash
        );
    }

    function _emitPhaseConfigured(
        uint256 collectionId,
        bytes32 phaseId,
        MintPhaseConfig calldata config,
        bytes32 policyHash
    ) private {
        emit MintPhaseConfigured(
            collectionId,
            phaseId,
            policyHash,
            config.startTime,
            config.endTime,
            config.maxBatchQuantity,
            config.configHash,
            config.metadataHash,
            msg.sender
        );
    }

    function _emitGateConfigured(
        uint256 collectionId,
        bytes32 phaseId,
        MintGateConfig memory gateConfig,
        bytes32 policyHash
    ) private {
        emit MintPhaseGateConfigured(
            collectionId,
            phaseId,
            gateConfig.gate,
            gateConfig.gateConfigHash,
            gateConfig.gateCodehash,
            gateConfig.gateMetadataHash,
            gateConfig.gateSemanticVersion,
            gateConfig.gateGasLimit,
            policyHash
        );
    }
}
