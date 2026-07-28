// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "./IStreamMintLedger.sol";
import "./IStreamMintModuleRegistry.sol";

/// @notice Interface for outside-Core phase policy and mint execution.
interface IStreamMintManager {
    /// @notice Launch-supported subject source for a static counter.
    enum CounterKeyMode {
        UNKNOWN,
        CONSTANT,
        PAYER,
        RECIPIENT,
        EXECUTOR,
        AUTHORIZER,
        CONTEXT
    }

    /// @notice Phase policy fields owned by the manager, not Core.
    struct MintPhaseConfig {
        bool paused;
        uint64 startTime;
        uint64 endTime;
        uint32 maxBatchQuantity;
        bytes32 configHash;
        bytes32 metadataHash;
    }

    /// @notice Manager-side counter policy that is projected into StreamMintLedger.
    struct MintCounterConfig {
        bool enabled;
        CounterKeyMode keyMode;
        IStreamMintLedger.CounterCapMode capMode;
        IStreamMintLedger.CounterDeltaMode deltaMode;
        uint64 staticCap;
        uint64 staticIncrement;
        bytes32 counterConfigHash;
    }

    /// @notice Optional gate module pinned into one phase policy hash.
    struct MintGateConfig {
        address gate;
        bytes32 gateConfigHash;
        bytes32 gateCodehash;
        bytes32 gateMetadataHash;
        uint32 gateSemanticVersion;
        uint32 gateGasLimit;
    }

    /// @notice Prepared mint request executed atomically after ledger consumption.
    struct MintRequest {
        uint256 collectionId;
        bytes32 phaseId;
        address payer;
        address authorizer;
        address[] initialRecipients;
        address[] beneficiaries;
        string[] tokenData;
        uint256[] salts;
        bytes32 authorizationId;
        bytes32 contextHash;
        bytes32 expectedPolicyHash;
        bytes gateData;
    }

    /// @notice Reverts when the Core dependency is not a valid StreamCore.
    error InvalidCoreContract(address core);
    /// @notice Reverts when the ledger dependency is not a valid StreamMintLedger.
    error InvalidMintLedgerContract(address mintLedger);
    /// @notice Reverts when a phase identity is invalid.
    error InvalidMintPhase(uint256 collectionId, bytes32 phaseId);
    /// @notice Reverts when a phase has not been configured.
    error MintPhaseDoesNotExist(uint256 collectionId, bytes32 phaseId);
    /// @notice Reverts when initial configuration is attempted for an existing phase.
    error MintPhaseAlreadyConfigured(uint256 collectionId, bytes32 phaseId);
    /// @notice Reverts when a configured phase is paused.
    error MintPhasePaused(uint256 collectionId, bytes32 phaseId);
    /// @notice Reverts when a phase has not started.
    error MintPhaseNotStarted(uint256 collectionId, bytes32 phaseId, uint256 timestamp);
    /// @notice Reverts when a phase has ended.
    error MintPhaseEnded(uint256 collectionId, bytes32 phaseId, uint256 timestamp);
    /// @notice Reverts when the caller may not execute a phase.
    error UnauthorizedMintExecutor(uint256 collectionId, bytes32 phaseId, address executor);
    /// @notice Reverts when an executor address is invalid.
    error InvalidMintExecutor(address executor);
    /// @notice Reverts when a phase would exceed the launch executor hard cap.
    error MintExecutorCountLimitExceeded(uint256 executorCount, uint256 maxExecutorCount);
    /// @notice Reverts when request array lengths do not match.
    error MintArrayLengthMismatch();
    /// @notice Reverts when a request has no token or exceeds the phase cap.
    error MintBatchQuantityLimitExceeded(uint256 quantity, uint256 maxBatchQuantity);
    /// @notice Reverts when a phase batch limit is zero or above the launch hard cap.
    error InvalidMintBatchLimit(uint256 maxBatchQuantity, uint256 maxBatchHardLimit);
    /// @notice Reverts when a phase configures more counters than launch allows.
    error MintCounterCountLimitExceeded(uint256 counterCount, uint256 maxCounterCount);
    /// @notice Deprecated compatibility error; counter cap enforcement now reverts from the ledger.
    error MintCounterCapExceeded(bytes32 valueKey, uint256 projectedValue, uint256 cap);
    /// @notice Reverts when a token recipient or beneficiary is zero.
    error InvalidMintRecipient(uint256 index, address initialRecipient, address beneficiary);
    /// @notice Reverts when a configured counter is invalid for the launch-static manager.
    error InvalidMintCounter(bytes32 counterId);
    /// @notice Reverts when a counter ID appears more than once in a phase.
    error DuplicateMintCounter(bytes32 counterId);
    /// @notice Reverts when a counter mode is reserved for a future manager.
    error UnsupportedMintCounterMode(bytes32 counterId);
    /// @notice Reverts when a counter subject cannot be derived.
    error MintCounterSubjectMissing(bytes32 counterId, CounterKeyMode keyMode);
    /// @notice Reverts when a caller does not bind execution to the active policy hash.
    error MintPolicyHashRequired(uint256 collectionId, bytes32 phaseId);
    /// @notice Reverts when a caller supplies a stale or unexpected phase policy hash.
    error MintPolicyHashMismatch(bytes32 expectedPolicyHash, bytes32 activePolicyHash);
    /// @notice Reverts when a caller does not provide a replay-protected authorization ID.
    error MintAuthorizationRequired(uint256 collectionId, bytes32 phaseId);
    /// @notice Reverts when the module registry dependency is invalid.
    error InvalidMintModuleRegistry(address registry);
    /// @notice Reverts when a configured gate is invalid for launch policy.
    error InvalidMintGate(address gate);
    /// @notice Reverts when a gate is not active for the required interface.
    error MintGateNotActive(address gate);
    /// @notice Reverts when a gate's codehash no longer matches the phase pin.
    error MintGateCodehashChanged(address gate, bytes32 expected, bytes32 actual);
    /// @notice Reverts when gate validation fails.
    error MintGateValidationFailed(address gate);
    /// @notice Reverts when a gate returns unsupported nullifiers.
    error MintGateNullifiersUnsupported(bytes32 nullifier);
    /// @notice Reverts when a gate returns too small a quantity limit.
    error MintGateQuantityExceeded(uint256 quantity, uint256 maxQuantity);
    /// @notice Reverts when request and gate authorization IDs conflict.
    error MintGateAuthorizationMismatch(
        bytes32 requestAuthorizationId, bytes32 gateAuthorizationId
    );
    /// @notice Reverts when request and gate authorizers conflict.
    error MintGateAuthorizerMismatch(address requestAuthorizer, address gateAuthorizer);
    /// @notice Reverts when a gate returns no durable evidence hash.
    error MintGateHashRequired(address gate);

    /// @notice Emitted when a phase is configured and registered in the ledger.
    event MintPhaseConfigured(
        uint256 indexed collectionId,
        bytes32 indexed phaseId,
        bytes32 indexed policyHash,
        uint64 startTime,
        uint64 endTime,
        uint32 maxBatchQuantity,
        bytes32 configHash,
        bytes32 metadataHash,
        address admin
    );
    /// @notice Emitted when a phase pause flag changes.
    event MintPhasePausedEvent(
        uint256 indexed collectionId,
        bytes32 indexed phaseId,
        bool paused,
        bytes32 policyHash,
        address admin
    );
    /// @notice Emitted when an executor is enabled or disabled for a phase.
    event MintPhaseExecutorUpdated(
        uint256 indexed collectionId,
        bytes32 indexed phaseId,
        address indexed executor,
        bool allowed,
        bytes32 policyHash,
        address admin
    );
    /// @notice Emitted for each counter configured under a phase policy.
    event MintCounterConfigured(
        uint256 indexed collectionId,
        bytes32 indexed phaseId,
        bytes32 indexed counterId,
        CounterKeyMode keyMode,
        IStreamMintLedger.CounterCapMode capMode,
        IStreamMintLedger.CounterDeltaMode deltaMode,
        uint64 staticCap,
        uint64 staticIncrement,
        bytes32 counterConfigHash,
        bytes32 policyHash
    );
    /// @notice Emitted when a phase binds an optional gate module.
    event MintPhaseGateConfigured(
        uint256 indexed collectionId,
        bytes32 indexed phaseId,
        address indexed gate,
        bytes32 gateConfigHash,
        bytes32 gateCodehash,
        bytes32 gateMetadataHash,
        uint32 gateSemanticVersion,
        uint32 gateGasLimit,
        bytes32 policyHash
    );
    /// @notice Emitted after a gate validates one prepared mint batch.
    event MintGateValidated(
        uint256 indexed collectionId,
        bytes32 indexed phaseId,
        address indexed gate,
        bytes32 authorizationId,
        address authorizer,
        uint256 quantity,
        bytes32 contextHash,
        bytes32 gateHash,
        bytes32 policyHash
    );
    /// @notice Emitted once per prepared batch after all tokens complete.
    event MintPreparedBatchExecuted(
        bytes32 indexed operationRoot,
        uint256 indexed collectionId,
        bytes32 indexed phaseId,
        bytes32 policyHash,
        bytes32 authorizationId,
        address executor,
        uint256 quantity,
        bytes32 contextHash
    );
    /// @notice Emitted once per prepared token completed by the manager.
    event MintPreparedTokenExecuted(
        bytes32 indexed operationId,
        uint256 indexed tokenId,
        uint256 indexed collectionId,
        bytes32 phaseId,
        uint256 collectionSerial,
        address initialRecipient,
        address beneficiary,
        bytes32 tokenDataHash,
        bytes32 policyHash
    );

    /// @notice Returns true for deployment validation.
    function isStreamMintManager() external view returns (bool);
    /// @notice Configures and registers a launch-static phase policy.
    function configurePhase(
        uint256 collectionId,
        bytes32 phaseId,
        MintPhaseConfig calldata config,
        MintGateConfig calldata gateConfig,
        bytes32[] calldata counterIds,
        MintCounterConfig[] calldata counterConfigs
    ) external returns (bytes32 policyHash);
    /// @notice Enables or disables a caller for a configured phase.
    function setPhaseExecutor(uint256 collectionId, bytes32 phaseId, address executor, bool allowed)
        external;
    /// @notice Pauses or unpauses a configured phase.
    function setPhasePaused(uint256 collectionId, bytes32 phaseId, bool paused) external;
    /// @notice Consumes ledger counters, prepares, and completes a mint batch atomically.
    function mintPrepared(MintRequest calldata request)
        external
        returns (uint256 firstTokenId, uint256 lastTokenId);
    /// @notice Returns immutable phase config plus existence.
    function phase(uint256 collectionId, bytes32 phaseId)
        external
        view
        returns (bool exists, MintPhaseConfig memory config);
    /// @notice Returns the active manager policy hash for a phase.
    function phasePolicyHash(uint256 collectionId, bytes32 phaseId) external view returns (bytes32);
    /// @notice Returns whether an executor may call a phase.
    function phaseExecutor(uint256 collectionId, bytes32 phaseId, address executor)
        external
        view
        returns (bool);
    /// @notice Returns the ordered counter IDs for a phase.
    function phaseCounterIds(uint256 collectionId, bytes32 phaseId)
        external
        view
        returns (bytes32[] memory);
    /// @notice Returns one manager-side counter config.
    function counterConfig(uint256 collectionId, bytes32 phaseId, bytes32 counterId)
        external
        view
        returns (MintCounterConfig memory);
    /// @notice Returns one phase's optional gate config.
    function phaseGate(uint256 collectionId, bytes32 phaseId)
        external
        view
        returns (MintGateConfig memory);
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
    ) external view returns (bytes32);
    /// @notice Previews the canonical ledger value key for a derived subject.
    function previewCounterValueKey(
        uint256 collectionId,
        bytes32 phaseId,
        bytes32 counterId,
        bytes32 subjectKey
    ) external view returns (bytes32);
}
