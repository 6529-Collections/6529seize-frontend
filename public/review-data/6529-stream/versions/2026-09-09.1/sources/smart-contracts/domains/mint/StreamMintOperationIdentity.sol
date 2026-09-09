// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../interfaces/stream/IStreamMintLedger.sol";
import "../../interfaces/stream/IStreamMintManager.sol";

/// @notice Canonical batch-operation identity derivation for StreamMintManager.
/// @dev Kept in a linked library so the manager remains below the EIP-170 runtime limit.
library StreamMintOperationIdentity {
    bytes32 private constant MINT_REQUEST_COMMITMENT_DOMAIN =
        keccak256("6529STREAM_MINT_REQUEST_COMMITMENT_V1");
    bytes32 private constant MINT_VALIDATED_RESULT_DOMAIN =
        keccak256("6529STREAM_MINT_VALIDATED_RESULT_V1");
    bytes32 private constant MINT_COUNTER_CONSUMPTIONS_DOMAIN =
        keccak256("6529STREAM_MINT_COUNTER_CONSUMPTIONS_V1");
    bytes32 private constant MINT_NULLIFIERS_DOMAIN = keccak256("6529STREAM_MINT_NULLIFIERS_V1");
    bytes32 private constant MINT_OPERATION_ROOT_DOMAIN =
        keccak256("6529STREAM_MINT_OPERATION_ROOT_V1");
    bytes32 private constant MINT_TOKEN_OPERATION_ID_DOMAIN =
        keccak256("6529STREAM_MINT_TOKEN_OPERATION_ID_V1");
    bytes32 private constant BATCH_RECIPIENTS_DOMAIN =
        keccak256("6529STREAM_MINT_BATCH_RECIPIENTS_V1");
    bytes32 private constant BATCH_BENEFICIARIES_DOMAIN =
        keccak256("6529STREAM_MINT_BATCH_BENEFICIARIES_V1");
    bytes32 private constant BATCH_TOKEN_DATA_DOMAIN =
        keccak256("6529STREAM_MINT_BATCH_TOKEN_DATA_V1");
    bytes32 private constant BATCH_COMMITMENTS_DOMAIN =
        keccak256("6529STREAM_MINT_BATCH_COMMITMENTS_V1");
    bytes32 private constant SUBJECT_DOMAIN = keccak256("6529STREAM_MINT_COUNTER_SUBJECT_V1");
    bytes32 private constant RESOLUTION_DOMAIN = keccak256("6529STREAM_MINT_COUNTER_RESOLUTION_V1");
    bytes32 private constant VALUE_KEY_DOMAIN = keccak256("6529STREAM_MINT_COUNTER_VALUE_KEY_V1");
    bytes32 private constant POLICY_DOMAIN = keccak256("6529STREAM_MINT_MANAGER_POLICY_V1");
    bytes32 private constant PHASE_CONFIG_DOMAIN =
        keccak256("6529STREAM_MINT_MANAGER_PHASE_CONFIG_V1");
    bytes32 private constant COUNTER_CONFIG_DOMAIN =
        keccak256("6529STREAM_MINT_MANAGER_COUNTER_CONFIG_V1");
    bytes32 private constant GATE_CONFIG_DOMAIN =
        keccak256("6529STREAM_MINT_MANAGER_GATE_CONFIG_V1");
    bytes32 private constant EXECUTOR_SET_DOMAIN =
        keccak256("6529STREAM_MINT_MANAGER_EXECUTOR_SET_V1");
    uint256 private constant BATCH_COUNTER_TOKEN_INDEX = type(uint256).max;

    struct MintAuthorization {
        bytes32 authorizationId;
        bytes32[] nullifiers;
        address authorizer;
        IStreamMintManager.AuthorizerKind authorizerKind;
        uint64 maxQuantity;
        bytes32 gateHash;
    }

    struct TranscriptContext {
        uint256 chainId;
        address manager;
        address coreAddress;
        address ledgerAddress;
        address gate;
        address executor;
        bytes32 executionPath;
        bytes32 currentPolicyHash;
        bytes32 boundPolicyHash;
        uint256 firstOperationNonce;
        uint256 quantity;
    }

    struct OperationRootPreimage {
        uint256 chainId;
        address manager;
        address coreAddress;
        address ledgerAddress;
        bytes32 executionPath;
        uint256 collectionId;
        bytes32 phaseId;
        bytes32 currentPolicyHash;
        bytes32 boundPolicyHash;
        bytes32 authorizationId;
        bytes32 requestCommitmentHash;
        bytes32 contextHash;
        address executor;
        uint256 firstOperationNonce;
        uint256 quantity;
    }

    struct CounterContext {
        uint256 chainId;
        address manager;
        address ledger;
        address executor;
        address authorizer;
    }

    struct SubjectContext {
        uint256 chainId;
        address ledger;
        uint256 collectionId;
        bytes32 phaseId;
        bytes32 counterId;
        address payer;
        address recipient;
        address executor;
        address authorizer;
        bytes32 contextHash;
    }

    struct PolicyContext {
        uint256 chainId;
        address manager;
        address ledger;
        address moduleRegistry;
        uint16 schemaVersion;
        uint256 collectionId;
        bytes32 phaseId;
    }

    struct PolicyPreimage {
        uint256 chainId;
        address manager;
        address ledger;
        address moduleRegistry;
        uint16 schemaVersion;
        uint256 collectionId;
        bytes32 phaseId;
        bytes32 phaseConfigHash;
        bytes32 gateConfigHash;
        bytes32 orderedCounterConfigHash;
        bytes32 executorSetHash;
    }

    function derive(
        IStreamMintManager.MintBatch calldata batch,
        MintAuthorization memory authorization,
        IStreamMintLedger.CounterConsumption[] memory consumptions,
        TranscriptContext memory context
    ) external pure returns (bytes32 operationRoot, bytes32[] memory operationIds) {
        bytes32 validatedResultHash = _validatedResultHash(
            context.gate, batch.authorizationId, authorization, consumptions
        );
        bytes32 requestCommitmentHash = _requestCommitment(batch, validatedResultHash);
        operationRoot = _operationRoot(batch, context, requestCommitmentHash);
        if (operationRoot == bytes32(0)) {
            revert IStreamMintManager.MintOperationRootRequired();
        }
        operationIds =
            _operationIds(batch, operationRoot, context.firstOperationNonce, context.quantity);
    }

    function deriveCounterConsumptions(
        IStreamMintManager.MintBatch calldata batch,
        uint256 quantity,
        bytes32[] memory counterIds,
        IStreamMintManager.MintCounterConfig[] memory counterConfigs,
        CounterContext memory context
    ) external pure returns (IStreamMintLedger.CounterConsumption[] memory consumptions) {
        uint256 consumptionCount = 0;
        for (uint256 i = 0; i < counterConfigs.length; i++) {
            consumptionCount += counterConfigs[i].keyMode
                == IStreamMintManager.CounterKeyMode.CONTEXT
                ? 1
                : quantity;
        }
        consumptions = new IStreamMintLedger.CounterConsumption[](consumptionCount);
        uint256 cursor = 0;
        for (uint256 i = 0; i < counterIds.length; i++) {
            cursor = _appendCounterConsumptions(
                batch, consumptions, cursor, quantity, counterIds[i], counterConfigs[i], context
            );
        }
    }

    function subjectKey(IStreamMintManager.CounterKeyMode keyMode, SubjectContext memory context)
        external
        pure
        returns (bytes32)
    {
        return _subjectKey(keyMode, context);
    }

    function computePolicyHash(
        IStreamMintManager.MintPhaseConfig memory phaseConfig,
        IStreamMintManager.MintGateConfig memory gateConfig,
        bytes32[] memory counterIds,
        IStreamMintManager.MintCounterConfig[] memory counterConfigs,
        address[] memory executors,
        PolicyContext memory context
    ) external pure returns (bytes32) {
        bytes32[] memory counterHashes = new bytes32[](counterIds.length);
        for (uint256 i = 0; i < counterIds.length; i++) {
            IStreamMintManager.MintCounterConfig memory config = counterConfigs[i];
            counterHashes[i] = keccak256(
                abi.encode(
                    COUNTER_CONFIG_DOMAIN,
                    counterIds[i],
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
        _sortAddresses(executors);
        // Every canonical field is assigned below before the struct is encoded.
        // slither-disable-next-line uninitialized-local
        PolicyPreimage memory preimage;
        preimage.chainId = context.chainId;
        preimage.manager = context.manager;
        preimage.ledger = context.ledger;
        preimage.moduleRegistry = context.moduleRegistry;
        preimage.schemaVersion = context.schemaVersion;
        preimage.collectionId = context.collectionId;
        preimage.phaseId = context.phaseId;
        preimage.phaseConfigHash = keccak256(
            abi.encode(
                PHASE_CONFIG_DOMAIN,
                phaseConfig.paused,
                phaseConfig.startTime,
                phaseConfig.endTime,
                phaseConfig.maxBatchQuantity,
                phaseConfig.configHash,
                phaseConfig.metadataHash
            )
        );
        preimage.gateConfigHash = keccak256(
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
        preimage.orderedCounterConfigHash = keccak256(abi.encode(counterHashes));
        preimage.executorSetHash = keccak256(abi.encode(EXECUTOR_SET_DOMAIN, executors));
        return keccak256(abi.encode(POLICY_DOMAIN, preimage));
    }

    function _validatedResultHash(
        address gate,
        bytes32 authorizationId,
        MintAuthorization memory authorization,
        IStreamMintLedger.CounterConsumption[] memory consumptions
    ) private pure returns (bytes32) {
        bytes32 nullifiersHash =
            keccak256(abi.encode(MINT_NULLIFIERS_DOMAIN, authorization.nullifiers));
        bytes32 counterConsumptionsHash =
            keccak256(abi.encode(MINT_COUNTER_CONSUMPTIONS_DOMAIN, consumptions));
        return keccak256(
            abi.encode(
                MINT_VALIDATED_RESULT_DOMAIN,
                gate,
                authorizationId,
                nullifiersHash,
                authorization.authorizer,
                uint8(authorization.authorizerKind),
                authorization.maxQuantity,
                authorization.gateHash,
                counterConsumptionsHash
            )
        );
    }

    function _requestCommitment(
        IStreamMintManager.MintBatch calldata batch,
        bytes32 validatedResultHash
    ) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                MINT_REQUEST_COMMITMENT_DOMAIN,
                batch.payer,
                batch.authorizer,
                batch.expectedPolicyHash,
                keccak256(abi.encode(BATCH_RECIPIENTS_DOMAIN, batch.initialRecipients)),
                keccak256(abi.encode(BATCH_BENEFICIARIES_DOMAIN, batch.beneficiaries)),
                keccak256(abi.encode(BATCH_TOKEN_DATA_DOMAIN, batch.tokenData)),
                keccak256(abi.encode(BATCH_COMMITMENTS_DOMAIN, batch.mintCommitments)),
                validatedResultHash
            )
        );
    }

    function _operationRoot(
        IStreamMintManager.MintBatch calldata batch,
        TranscriptContext memory context,
        bytes32 requestCommitmentHash
    ) private pure returns (bytes32) {
        // Every canonical field is assigned below before the struct is encoded.
        // slither-disable-next-line uninitialized-local
        OperationRootPreimage memory preimage;
        preimage.chainId = context.chainId;
        preimage.manager = context.manager;
        preimage.coreAddress = context.coreAddress;
        preimage.ledgerAddress = context.ledgerAddress;
        preimage.executionPath = context.executionPath;
        preimage.collectionId = batch.collectionId;
        preimage.phaseId = batch.phaseId;
        preimage.currentPolicyHash = context.currentPolicyHash;
        preimage.boundPolicyHash = context.boundPolicyHash;
        preimage.authorizationId = batch.authorizationId;
        preimage.requestCommitmentHash = requestCommitmentHash;
        preimage.contextHash = batch.contextHash;
        preimage.executor = context.executor;
        preimage.firstOperationNonce = context.firstOperationNonce;
        preimage.quantity = context.quantity;
        return keccak256(abi.encode(MINT_OPERATION_ROOT_DOMAIN, preimage));
    }

    function _operationIds(
        IStreamMintManager.MintBatch calldata batch,
        bytes32 operationRoot,
        uint256 firstOperationNonce,
        uint256 quantity
    ) private pure returns (bytes32[] memory operationIds) {
        operationIds = new bytes32[](quantity);
        for (uint256 i = 0; i < quantity; i++) {
            bytes32 operationId = keccak256(
                abi.encode(
                    MINT_TOKEN_OPERATION_ID_DOMAIN,
                    operationRoot,
                    firstOperationNonce + i,
                    i,
                    keccak256(batch.tokenData[i]),
                    batch.mintCommitments[i]
                )
            );
            if (operationId == bytes32(0)) {
                revert IStreamMintManager.MintOperationIdRequired(i);
            }
            for (uint256 j = 0; j < i; j++) {
                if (operationIds[j] == operationId) {
                    revert IStreamMintManager.MintOperationIdDuplicate(j, i);
                }
            }
            operationIds[i] = operationId;
        }
    }

    function _counterConsumption(
        IStreamMintManager.MintBatch calldata batch,
        uint256 tokenIndex,
        bytes32 counterId,
        IStreamMintManager.MintCounterConfig memory config,
        address recipient,
        CounterContext memory context
    ) private pure returns (IStreamMintLedger.CounterConsumption memory consumption) {
        SubjectContext memory subjectContext = SubjectContext({
            chainId: context.chainId,
            ledger: context.ledger,
            collectionId: batch.collectionId,
            phaseId: batch.phaseId,
            counterId: counterId,
            payer: batch.payer,
            recipient: recipient,
            executor: context.executor,
            authorizer: context.authorizer,
            contextHash: batch.contextHash
        });
        bytes32 subject = _subjectKey(config.keyMode, subjectContext);
        consumption.valueKey = keccak256(
            abi.encode(
                VALUE_KEY_DOMAIN,
                context.manager,
                batch.collectionId,
                batch.phaseId,
                counterId,
                subject
            )
        );
        consumption.collectionId = batch.collectionId;
        consumption.phaseId = batch.phaseId;
        consumption.counterId = counterId;
        consumption.subjectKey = subject;
        consumption.payer = batch.payer;
        consumption.recipient = recipient;
        consumption.authorizer = context.authorizer;
        consumption.executor = context.executor;
        consumption.increment = config.staticIncrement;
        consumption.cap =
            config.capMode == IStreamMintLedger.CounterCapMode.STATIC ? config.staticCap : 0;
        consumption.contextHash = batch.contextHash;
        consumption.resolutionHash = keccak256(
            abi.encode(
                RESOLUTION_DOMAIN,
                context.chainId,
                context.manager,
                context.ledger,
                batch.collectionId,
                batch.phaseId,
                counterId,
                subject,
                tokenIndex,
                config.counterConfigHash
            )
        );
    }

    function _appendCounterConsumptions(
        IStreamMintManager.MintBatch calldata batch,
        IStreamMintLedger.CounterConsumption[] memory consumptions,
        uint256 cursor,
        uint256 quantity,
        bytes32 counterId,
        IStreamMintManager.MintCounterConfig memory config,
        CounterContext memory context
    ) private pure returns (uint256) {
        if (config.keyMode == IStreamMintManager.CounterKeyMode.CONTEXT) {
            consumptions[cursor] = _counterConsumption(
                batch, BATCH_COUNTER_TOKEN_INDEX, counterId, config, address(0), context
            );
            return cursor + 1;
        }
        for (uint256 tokenIndex = 0; tokenIndex < quantity; tokenIndex++) {
            consumptions[cursor] = _counterConsumption(
                batch, tokenIndex, counterId, config, batch.beneficiaries[tokenIndex], context
            );
            cursor++;
        }
        return cursor;
    }

    function _subjectKey(IStreamMintManager.CounterKeyMode keyMode, SubjectContext memory context)
        private
        pure
        returns (bytes32)
    {
        if (keyMode == IStreamMintManager.CounterKeyMode.CONSTANT) {
            return keccak256(
                abi.encode(
                    SUBJECT_DOMAIN,
                    context.chainId,
                    context.ledger,
                    keyMode,
                    context.collectionId,
                    context.phaseId,
                    context.counterId
                )
            );
        }
        if (keyMode == IStreamMintManager.CounterKeyMode.PAYER) {
            return _addressSubjectKey(keyMode, context.payer, context);
        }
        if (keyMode == IStreamMintManager.CounterKeyMode.RECIPIENT) {
            return _addressSubjectKey(keyMode, context.recipient, context);
        }
        if (keyMode == IStreamMintManager.CounterKeyMode.EXECUTOR) {
            return _addressSubjectKey(keyMode, context.executor, context);
        }
        if (keyMode == IStreamMintManager.CounterKeyMode.AUTHORIZER) {
            return _addressSubjectKey(keyMode, context.authorizer, context);
        }
        if (keyMode == IStreamMintManager.CounterKeyMode.CONTEXT) {
            if (context.contextHash == bytes32(0)) {
                revert IStreamMintManager.MintCounterSubjectMissing(context.counterId, keyMode);
            }
            return keccak256(
                abi.encode(
                    SUBJECT_DOMAIN, context.chainId, context.ledger, keyMode, context.contextHash
                )
            );
        }
        revert IStreamMintManager.MintCounterSubjectMissing(context.counterId, keyMode);
    }

    function _addressSubjectKey(
        IStreamMintManager.CounterKeyMode keyMode,
        address account,
        SubjectContext memory context
    ) private pure returns (bytes32) {
        if (account == address(0)) {
            revert IStreamMintManager.MintCounterSubjectMissing(context.counterId, keyMode);
        }
        return
            keccak256(abi.encode(SUBJECT_DOMAIN, context.chainId, context.ledger, keyMode, account));
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
