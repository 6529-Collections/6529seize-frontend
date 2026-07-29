// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IERC165.sol";
import "./IStreamCore.sol";
import "./IStreamMintGate.sol";
import "./IStreamMintLedger.sol";
import "./IStreamMintManager.sol";
import "./IStreamMintModuleRegistry.sol";
import "./Ownable.sol";
import "./ReentrancyGuard.sol";

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
    /// @notice Gas ceiling for ERC-165 probes of gate modules per EIP-165 guidance.
    uint256 private constant GATE_ERC165_PROBE_GAS = 30_000;
    /// @notice Domain separator for sorted executor set hashes.
    bytes32 public constant EXECUTOR_SET_DOMAIN =
        keccak256("6529STREAM_MINT_MANAGER_EXECUTOR_SET_V1");
    /// @notice Domain separator for manager-derived counter subjects.
    bytes32 public constant SUBJECT_DOMAIN = keccak256("6529STREAM_MINT_COUNTER_SUBJECT_V1");
    /// @notice Domain separator for counter resolution hashes.
    bytes32 public constant RESOLUTION_DOMAIN = keccak256("6529STREAM_MINT_COUNTER_RESOLUTION_V1");
    /// @notice Domain separator for prepared mint operation IDs.
    bytes32 public constant OPERATION_DOMAIN = keccak256("6529STREAM_PREPARED_MINT_OPERATION_V1");

    /// @notice Manager policy schema version encoded into policy hashes.
    uint16 public constant SCHEMA_VERSION = 1;
    /// @notice Launch hard cap for one prepared mint batch.
    uint32 public constant MAX_PHASE_BATCH_QUANTITY = 10;
    /// @notice Launch hard cap for enabled counters evaluated by one phase.
    uint16 public constant MAX_PHASE_COUNTERS = 16;
    /// @notice Launch hard cap for enabled executors included in one policy hash.
    uint16 public constant MAX_PHASE_EXECUTORS = 64;
    /// @notice Sentinel token index used for batch-scoped counter resolution hashes.
    uint256 private constant BATCH_COUNTER_TOKEN_INDEX = type(uint256).max;

    /// @notice StreamCore dependency that owns prepared mint hooks.
    IStreamCore public immutable core;
    /// @notice StreamMintLedger dependency that enforces phase counter consumption.
    IStreamMintLedger public immutable mintLedger;
    /// @notice Registry dependency that approves optional mint gate modules.
    IStreamMintModuleRegistry public immutable moduleRegistry;
    /// @notice Next nonce reserved for prepared mint operation IDs.
    uint256 public nextOperationNonce;

    struct PhaseState {
        bool exists;
        MintPhaseConfig config;
    }

    struct GateCall {
        address gate;
        uint32 gasLimit;
        address executor;
        uint256 collectionId;
        bytes32 phaseId;
        address payer;
        address authorizer;
        address[] initialRecipients;
        address[] beneficiaries;
        bytes32 contextHash;
        bytes32 policyHash;
        bytes gateData;
    }

    struct MintAuthorization {
        bytes32 authorizationId;
        address authorizer;
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
        try core_.isCoreContract() returns (bool ok) {
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
        MintGateConfig memory validatedGateConfig = _validatedGateConfig(gateConfig);

        _replacePhaseCounters(collectionId, phaseId, ids, counterConfigs);
        _phaseGateConfigs[collectionId][phaseId] = validatedGateConfig;
        _phases[collectionId][phaseId] = PhaseState({ exists: true, config: config });

        policyHash = _computePolicyHash(collectionId, phaseId);
        phasePolicyHash[collectionId][phaseId] = policyHash;
        mintLedger.registerPhasePolicy(
            address(this), collectionId, phaseId, policyHash, ids, ledgerPolicies
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

    /// @notice Consumes ledger counters, prepares, and completes a mint batch atomically.
    function mintPrepared(MintRequest calldata request)
        external
        override
        nonReentrant
        returns (uint256 firstTokenId, uint256 lastTokenId)
    {
        PhaseState storage phaseState = _requireExecutablePhase(request);
        uint256 quantity = _validateMintRequest(request, phaseState.config);
        bytes32 policyHash = phasePolicyHash[request.collectionId][request.phaseId];
        if (request.expectedPolicyHash == bytes32(0)) {
            revert MintPolicyHashRequired(request.collectionId, request.phaseId);
        }
        if (request.expectedPolicyHash != policyHash) {
            revert MintPolicyHashMismatch(request.expectedPolicyHash, policyHash);
        }

        MintAuthorization memory mintAuthorization =
            _validateGateAndAuthorization(request, quantity, policyHash);
        _consumeCounters(request, quantity, policyHash, mintAuthorization);
        uint256 operationNonce = nextOperationNonce;
        nextOperationNonce = operationNonce + quantity;
        bytes32 operationRoot = _operationRoot(
            request, policyHash, mintAuthorization.authorizationId, operationNonce, quantity
        );

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId =
                _executePreparedToken(request, i, operationRoot, operationNonce + i, policyHash);
            if (i == 0) {
                firstTokenId = tokenId;
            }
            lastTokenId = tokenId;
        }

        _emitBatchExecuted(
            request, operationRoot, policyHash, mintAuthorization.authorizationId, quantity
        );
    }

    function _executePreparedToken(
        MintRequest calldata request,
        uint256 tokenIndex,
        bytes32 operationRoot,
        uint256 operationNonce,
        bytes32 policyHash
    ) private returns (uint256 tokenId) {
        bytes32 tokenDataHash = keccak256(bytes(request.tokenData[tokenIndex]));
        bytes32 operationId = _operationId(
            operationRoot, operationNonce, tokenIndex, tokenDataHash, request.salts[tokenIndex]
        );
        uint256 collectionSerial;
        (tokenId, collectionSerial) = core.prepareMintFromManager(
            request.collectionId, request.tokenData[tokenIndex], tokenDataHash, operationId
        );
        core.completePreparedMintFromManager(
            tokenId, request.initialRecipients[tokenIndex], operationId, request.salts[tokenIndex]
        );
        _emitTokenExecuted(
            request, tokenIndex, operationId, tokenId, collectionSerial, tokenDataHash, policyHash
        );
    }

    function _emitTokenExecuted(
        MintRequest calldata request,
        uint256 tokenIndex,
        bytes32 operationId,
        uint256 tokenId,
        uint256 collectionSerial,
        bytes32 tokenDataHash,
        bytes32 policyHash
    ) private {
        emit MintPreparedTokenExecuted(
            operationId,
            tokenId,
            request.collectionId,
            request.phaseId,
            collectionSerial,
            request.initialRecipients[tokenIndex],
            request.beneficiaries[tokenIndex],
            tokenDataHash,
            policyHash
        );
    }

    function _emitBatchExecuted(
        MintRequest calldata request,
        bytes32 operationRoot,
        bytes32 policyHash,
        bytes32 authorizationId,
        uint256 quantity
    ) private {
        emit MintPreparedBatchExecuted(
            operationRoot,
            request.collectionId,
            request.phaseId,
            policyHash,
            authorizationId,
            msg.sender,
            quantity,
            request.contextHash
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
        return _subjectKey(
            keyMode,
            collectionId,
            phaseId,
            counterId,
            payer,
            recipient,
            executor,
            authorizer,
            contextHash
        );
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

    function _requireExecutablePhase(MintRequest calldata request)
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

    function _validateMintRequest(MintRequest calldata request, MintPhaseConfig memory config)
        private
        pure
        returns (uint256 quantity)
    {
        quantity = request.initialRecipients.length;
        if (
            quantity == 0 || quantity != request.beneficiaries.length
                || quantity != request.tokenData.length || quantity != request.salts.length
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

    function _consumeCounters(
        MintRequest calldata request,
        uint256 quantity,
        bytes32 policyHash,
        MintAuthorization memory mintAuthorization
    ) private {
        IStreamMintLedger.CounterConsumption[] memory consumptions =
            _counterConsumptions(request, quantity, mintAuthorization.authorizer);
        bytes32[] memory nullifiers = new bytes32[](0);
        mintLedger.consume(consumptions, mintAuthorization.authorizationId, nullifiers, policyHash);
    }

    function _counterConsumptions(
        MintRequest calldata request,
        uint256 quantity,
        address authorizer
    ) private view returns (IStreamMintLedger.CounterConsumption[] memory consumptions) {
        bytes32[] storage counterIds = _phaseCounterIds[request.collectionId][request.phaseId];
        consumptions = new IStreamMintLedger
            .CounterConsumption[](_counterConsumptionCount(request, quantity, counterIds));
        uint256 cursor;
        uint256 counterCount = counterIds.length;
        for (uint256 counterIndex = 0; counterIndex < counterCount; counterIndex++) {
            bytes32 counterId = counterIds[counterIndex];
            MintCounterConfig memory config =
                _counterConfigs[request.collectionId][request.phaseId][counterId];
            cursor = _appendCounterConsumptions(
                consumptions, cursor, request, quantity, counterId, config, authorizer
            );
        }
    }

    function _counterConsumptionCount(
        MintRequest calldata request,
        uint256 quantity,
        bytes32[] storage counterIds
    ) private view returns (uint256 consumptionCount) {
        uint256 counterCount = counterIds.length;
        for (uint256 counterIndex = 0; counterIndex < counterCount; counterIndex++) {
            bytes32 counterId = counterIds[counterIndex];
            MintCounterConfig memory config =
                _counterConfigs[request.collectionId][request.phaseId][counterId];
            consumptionCount += config.keyMode == CounterKeyMode.CONTEXT ? 1 : quantity;
        }
    }

    function _appendCounterConsumptions(
        IStreamMintLedger.CounterConsumption[] memory consumptions,
        uint256 cursor,
        MintRequest calldata request,
        uint256 quantity,
        bytes32 counterId,
        MintCounterConfig memory config,
        address authorizer
    ) private view returns (uint256) {
        if (config.keyMode == CounterKeyMode.CONTEXT) {
            consumptions[cursor] = _contextCounterConsumption(
                request, counterId, config, authorizer
            );
            return cursor + 1;
        }

        for (uint256 tokenIndex = 0; tokenIndex < quantity; tokenIndex++) {
            consumptions[cursor] =
                _tokenCounterConsumption(request, tokenIndex, counterId, config, authorizer);
            cursor++;
        }
        return cursor;
    }

    function _validateGateAndAuthorization(
        MintRequest calldata request,
        uint256 quantity,
        bytes32 policyHash
    ) private returns (MintAuthorization memory mintAuthorization) {
        MintGateConfig memory gateConfig = _phaseGateConfigs[request.collectionId][request.phaseId];
        if (gateConfig.gate == address(0)) {
            if (request.authorizationId == bytes32(0)) {
                revert MintAuthorizationRequired(request.collectionId, request.phaseId);
            }
            return MintAuthorization({
                authorizationId: request.authorizationId, authorizer: request.authorizer
            });
        }

        _requireGateStillActive(gateConfig);
        IStreamMintGate.GateResult memory result = _callGate(request, policyHash, gateConfig);
        if (result.nullifiers.length != 0) {
            revert MintGateNullifiersUnsupported(result.nullifiers[0]);
        }
        if (result.maxQuantity != 0 && quantity > result.maxQuantity) {
            revert MintGateQuantityExceeded(quantity, result.maxQuantity);
        }
        if (result.gateHash == bytes32(0)) {
            revert MintGateHashRequired(gateConfig.gate);
        }
        address effectiveAuthorizer = request.authorizer;
        if (result.authorizer != address(0)) {
            if (effectiveAuthorizer != address(0) && effectiveAuthorizer != result.authorizer) {
                revert MintGateAuthorizerMismatch(request.authorizer, result.authorizer);
            }
            effectiveAuthorizer = result.authorizer;
        }

        if (result.authorizationId == bytes32(0)) {
            revert MintAuthorizationRequired(request.collectionId, request.phaseId);
        }
        if (
            request.authorizationId != bytes32(0)
                && request.authorizationId != result.authorizationId
        ) {
            revert MintGateAuthorizationMismatch(request.authorizationId, result.authorizationId);
        }
        bytes32 authorizationId = result.authorizationId;

        emit MintGateValidated(
            request.collectionId,
            request.phaseId,
            gateConfig.gate,
            authorizationId,
            effectiveAuthorizer,
            quantity,
            request.contextHash,
            result.gateHash,
            policyHash
        );

        return
            MintAuthorization({ authorizationId: authorizationId, authorizer: effectiveAuthorizer });
    }

    function _callGate(
        MintRequest calldata request,
        bytes32 policyHash,
        MintGateConfig memory gateConfig
    ) private view returns (IStreamMintGate.GateResult memory result) {
        GateCall memory gateCall;
        gateCall.gate = gateConfig.gate;
        gateCall.gasLimit = gateConfig.gateGasLimit;
        gateCall.executor = msg.sender;
        gateCall.collectionId = request.collectionId;
        gateCall.phaseId = request.phaseId;
        gateCall.payer = request.payer;
        gateCall.authorizer = request.authorizer;
        gateCall.initialRecipients = request.initialRecipients;
        gateCall.beneficiaries = request.beneficiaries;
        gateCall.contextHash = request.contextHash;
        gateCall.policyHash = policyHash;
        gateCall.gateData = request.gateData;

        return _executeGateCall(gateCall);
    }

    function _executeGateCall(GateCall memory gateCall)
        private
        view
        returns (IStreamMintGate.GateResult memory)
    {
        bytes memory payload = _gateCallPayload(gateCall);
        (bool ok, bytes memory returndata) =
            gateCall.gate.staticcall{ gas: gateCall.gasLimit }(payload);
        if (!ok) {
            revert MintGateValidationFailed(gateCall.gate);
        }
        return abi.decode(returndata, (IStreamMintGate.GateResult));
    }

    function _gateCallPayload(GateCall memory gateCall) private view returns (bytes memory) {
        return abi.encodeWithSelector(
            IStreamMintGate.validateMint.selector,
            address(this),
            gateCall.executor,
            gateCall.collectionId,
            gateCall.phaseId,
            gateCall.payer,
            gateCall.authorizer,
            gateCall.initialRecipients,
            gateCall.beneficiaries,
            gateCall.contextHash,
            gateCall.policyHash,
            gateCall.gateData
        );
    }

    function _validatedGateConfig(MintGateConfig calldata gateConfig)
        private
        view
        returns (MintGateConfig memory)
    {
        if (gateConfig.gate == address(0)) {
            if (
                gateConfig.gateConfigHash != bytes32(0) || gateConfig.gateCodehash != bytes32(0)
                    || gateConfig.gateMetadataHash != bytes32(0)
                    || gateConfig.gateSemanticVersion != 0 || gateConfig.gateGasLimit != 0
            ) {
                revert InvalidMintGate(gateConfig.gate);
            }
            return gateConfig;
        }
        if (gateConfig.gateConfigHash == bytes32(0)) {
            revert InvalidMintGate(gateConfig.gate);
        }

        IStreamMintModuleRegistry.MintModuleInfo memory info =
            _requireActiveGateInfo(gateConfig.gate);
        bytes32 actualCodehash = gateConfig.gate.codehash;
        if (gateConfig.gateCodehash != bytes32(0) && gateConfig.gateCodehash != actualCodehash) {
            revert MintGateCodehashChanged(gateConfig.gate, gateConfig.gateCodehash, actualCodehash);
        }
        if (
            gateConfig.gateMetadataHash != bytes32(0)
                && gateConfig.gateMetadataHash != info.metadataHash
        ) {
            revert InvalidMintGate(gateConfig.gate);
        }
        if (
            gateConfig.gateSemanticVersion != 0
                && gateConfig.gateSemanticVersion != info.semanticVersion
        ) {
            revert InvalidMintGate(gateConfig.gate);
        }
        if (gateConfig.gateGasLimit != 0 && gateConfig.gateGasLimit != info.gasLimit) {
            revert InvalidMintGate(gateConfig.gate);
        }

        return MintGateConfig({
            gate: gateConfig.gate,
            gateConfigHash: gateConfig.gateConfigHash,
            gateCodehash: actualCodehash,
            gateMetadataHash: info.metadataHash,
            gateSemanticVersion: info.semanticVersion,
            gateGasLimit: info.gasLimit
        });
    }

    function _requireGateStillActive(MintGateConfig memory gateConfig) private view {
        IStreamMintModuleRegistry.MintModuleInfo memory info =
            _requireActiveGateInfo(gateConfig.gate);
        bytes32 actualCodehash = gateConfig.gate.codehash;
        if (actualCodehash != gateConfig.gateCodehash || actualCodehash != info.codehash) {
            revert MintGateCodehashChanged(gateConfig.gate, gateConfig.gateCodehash, actualCodehash);
        }
        if (
            info.metadataHash != gateConfig.gateMetadataHash
                || info.semanticVersion != gateConfig.gateSemanticVersion
                || info.gasLimit != gateConfig.gateGasLimit
        ) {
            revert MintGateNotActive(gateConfig.gate);
        }
    }

    function _requireActiveGateInfo(address gate)
        private
        view
        returns (IStreamMintModuleRegistry.MintModuleInfo memory info)
    {
        try moduleRegistry.moduleInfo(gate) returns (
            IStreamMintModuleRegistry.MintModuleInfo memory moduleInfo
        ) {
            info = moduleInfo;
        } catch {
            revert MintGateNotActive(gate);
        }
        if (
            info.status != IStreamMintModuleRegistry.ModuleStatus.ACTIVE
                || info.interfaceId != type(IStreamMintGate).interfaceId || info.gasLimit == 0
                || gate.code.length == 0 || info.codehash != gate.codehash
                || !_gateAdvertisesInterface(gate)
        ) {
            revert MintGateNotActive(gate);
        }
    }

    function _gateAdvertisesInterface(address gate) private view returns (bool) {
        try IERC165(gate).supportsInterface{ gas: GATE_ERC165_PROBE_GAS }(
            type(IStreamMintGate).interfaceId
        ) returns (
            bool supported
        ) {
            return supported;
        } catch {
            return false;
        }
    }

    function _counterConsumption(
        MintRequest calldata request,
        uint256 tokenIndex,
        bytes32 counterId,
        MintCounterConfig memory config,
        address recipient,
        address authorizer
    ) private view returns (IStreamMintLedger.CounterConsumption memory consumption) {
        bytes32 subjectKey =
            _counterSubjectKey(request, counterId, config.keyMode, recipient, authorizer);
        consumption.valueKey = mintLedger.deriveCounterValueKey(
            address(this), request.collectionId, request.phaseId, counterId, subjectKey
        );
        consumption.collectionId = request.collectionId;
        consumption.phaseId = request.phaseId;
        consumption.counterId = counterId;
        consumption.subjectKey = subjectKey;
        consumption.payer = request.payer;
        consumption.recipient = recipient;
        consumption.authorizer = authorizer;
        consumption.executor = msg.sender;
        consumption.increment = config.staticIncrement;
        consumption.cap =
            config.capMode == IStreamMintLedger.CounterCapMode.STATIC ? config.staticCap : 0;
        consumption.contextHash = request.contextHash;
        consumption.resolutionHash =
            _resolutionHash(request, tokenIndex, counterId, subjectKey, config);
    }

    function _contextCounterConsumption(
        MintRequest calldata request,
        bytes32 counterId,
        MintCounterConfig memory config,
        address authorizer
    ) private view returns (IStreamMintLedger.CounterConsumption memory) {
        return _counterConsumption(
            request, BATCH_COUNTER_TOKEN_INDEX, counterId, config, address(0), authorizer
        );
    }

    function _tokenCounterConsumption(
        MintRequest calldata request,
        uint256 tokenIndex,
        bytes32 counterId,
        MintCounterConfig memory config,
        address authorizer
    ) private view returns (IStreamMintLedger.CounterConsumption memory) {
        return _counterConsumption(
            request, tokenIndex, counterId, config, request.beneficiaries[tokenIndex], authorizer
        );
    }

    function _counterSubjectKey(
        MintRequest calldata request,
        bytes32 counterId,
        CounterKeyMode keyMode,
        address recipient,
        address authorizer
    ) private view returns (bytes32) {
        return _subjectKey(
            keyMode,
            request.collectionId,
            request.phaseId,
            counterId,
            request.payer,
            recipient,
            msg.sender,
            authorizer,
            request.contextHash
        );
    }

    function _subjectKey(
        CounterKeyMode keyMode,
        uint256 collectionId,
        bytes32 phaseId,
        bytes32 counterId,
        address payer,
        address recipient,
        address executor,
        address authorizer,
        bytes32 contextHash
    ) private view returns (bytes32) {
        if (keyMode == CounterKeyMode.CONSTANT) {
            return keccak256(
                abi.encode(
                    SUBJECT_DOMAIN,
                    uint256(block.chainid),
                    address(mintLedger),
                    keyMode,
                    collectionId,
                    phaseId,
                    counterId
                )
            );
        }
        if (keyMode == CounterKeyMode.PAYER) {
            _requireSubjectAddress(counterId, keyMode, payer);
            return _addressSubjectKey(keyMode, payer);
        }
        if (keyMode == CounterKeyMode.RECIPIENT) {
            _requireSubjectAddress(counterId, keyMode, recipient);
            return _addressSubjectKey(keyMode, recipient);
        }
        if (keyMode == CounterKeyMode.EXECUTOR) {
            _requireSubjectAddress(counterId, keyMode, executor);
            return _addressSubjectKey(keyMode, executor);
        }
        if (keyMode == CounterKeyMode.AUTHORIZER) {
            _requireSubjectAddress(counterId, keyMode, authorizer);
            return _addressSubjectKey(keyMode, authorizer);
        }
        if (keyMode == CounterKeyMode.CONTEXT) {
            if (contextHash == bytes32(0)) {
                revert MintCounterSubjectMissing(counterId, keyMode);
            }
            return keccak256(
                abi.encode(
                    SUBJECT_DOMAIN,
                    uint256(block.chainid),
                    address(mintLedger),
                    keyMode,
                    contextHash
                )
            );
        }
        revert MintCounterSubjectMissing(counterId, keyMode);
    }

    function _addressSubjectKey(CounterKeyMode keyMode, address account)
        private
        view
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                SUBJECT_DOMAIN, uint256(block.chainid), address(mintLedger), keyMode, account
            )
        );
    }

    function _requireSubjectAddress(bytes32 counterId, CounterKeyMode keyMode, address account)
        private
        pure
    {
        if (account == address(0)) {
            revert MintCounterSubjectMissing(counterId, keyMode);
        }
    }

    function _resolutionHash(
        MintRequest calldata request,
        uint256 tokenIndex,
        bytes32 counterId,
        bytes32 subjectKey,
        MintCounterConfig memory config
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                RESOLUTION_DOMAIN,
                uint256(block.chainid),
                address(this),
                address(mintLedger),
                request.collectionId,
                request.phaseId,
                counterId,
                subjectKey,
                tokenIndex,
                config.counterConfigHash
            )
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
            address(this), collectionId, phaseId, policyHash, ids, ledgerPolicies
        );
    }

    function _computePolicyHash(uint256 collectionId, bytes32 phaseId)
        private
        view
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                POLICY_DOMAIN,
                uint256(block.chainid),
                address(this),
                address(mintLedger),
                address(moduleRegistry),
                SCHEMA_VERSION,
                collectionId,
                phaseId,
                _phaseConfigHash(_phases[collectionId][phaseId].config),
                _gateConfigHash(_phaseGateConfigs[collectionId][phaseId]),
                _orderedCounterConfigHash(collectionId, phaseId),
                _executorSetHash(collectionId, phaseId)
            )
        );
    }

    function _phaseConfigHash(MintPhaseConfig memory config) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                PHASE_CONFIG_DOMAIN,
                config.paused,
                config.startTime,
                config.endTime,
                config.maxBatchQuantity,
                config.configHash,
                config.metadataHash
            )
        );
    }

    function _gateConfigHash(MintGateConfig memory gateConfig) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                GATE_CONFIG_DOMAIN,
                gateConfig.gate,
                gateConfig.gateConfigHash,
                gateConfig.gateCodehash,
                gateConfig.gateMetadataHash,
                gateConfig.gateSemanticVersion,
                gateConfig.gateGasLimit
            )
        );
    }

    function _orderedCounterConfigHash(uint256 collectionId, bytes32 phaseId)
        private
        view
        returns (bytes32)
    {
        bytes32[] storage counterIds = _phaseCounterIds[collectionId][phaseId];
        bytes32[] memory hashes = new bytes32[](counterIds.length);
        for (uint256 i = 0; i < counterIds.length; i++) {
            bytes32 counterId = counterIds[i];
            hashes[i] =
                _counterConfigHash(counterId, _counterConfigs[collectionId][phaseId][counterId]);
        }
        return keccak256(abi.encode(hashes));
    }

    function _counterConfigHash(bytes32 counterId, MintCounterConfig memory config)
        private
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                COUNTER_CONFIG_DOMAIN,
                counterId,
                config.enabled,
                config.keyMode,
                config.capMode,
                config.deltaMode,
                config.staticCap,
                config.staticIncrement,
                config.counterConfigHash
            )
        );
    }

    function _executorSetHash(uint256 collectionId, bytes32 phaseId)
        private
        view
        returns (bytes32)
    {
        address[] memory executors = _phaseExecutors[collectionId][phaseId];
        _sortAddresses(executors);
        return keccak256(abi.encode(EXECUTOR_SET_DOMAIN, executors));
    }

    function _operationRoot(
        MintRequest calldata request,
        bytes32 policyHash,
        bytes32 authorizationId,
        uint256 operationNonce,
        uint256 quantity
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                OPERATION_DOMAIN,
                uint256(block.chainid),
                address(this),
                address(core),
                address(mintLedger),
                request.collectionId,
                request.phaseId,
                policyHash,
                authorizationId,
                _requestCommitment(request),
                request.contextHash,
                msg.sender,
                operationNonce,
                quantity
            )
        );
    }

    function _requestCommitment(MintRequest calldata request) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                request.payer,
                request.authorizer,
                keccak256(abi.encode(request.initialRecipients)),
                keccak256(abi.encode(request.beneficiaries)),
                keccak256(abi.encode(request.tokenData)),
                keccak256(abi.encode(request.salts))
            )
        );
    }

    function _operationId(
        bytes32 operationRoot,
        uint256 operationNonce,
        uint256 tokenIndex,
        bytes32 tokenDataHash,
        uint256 salt
    ) private pure returns (bytes32) {
        return keccak256(abi.encode(operationRoot, operationNonce, tokenIndex, tokenDataHash, salt));
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

    function _sortAddresses(address[] memory values) private pure {
        for (uint256 i = 1; i < values.length; i++) {
            address current = values[i];
            uint256 j = i;
            while (j > 0 && uint160(current) < uint160(values[j - 1])) {
                values[j] = values[j - 1];
                j--;
            }
            values[j] = current;
        }
    }
}
