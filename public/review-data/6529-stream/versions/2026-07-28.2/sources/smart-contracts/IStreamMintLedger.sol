// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Durable outside-Core accounting ledger for launch mint counters.
interface IStreamMintLedger {
    /// @notice Counter cap source for launch mint accounting.
    enum CounterCapMode {
        NONE,
        STATIC,
        RESOLVER
    }

    /// @notice Counter increment source for launch mint accounting.
    enum CounterDeltaMode {
        STATIC,
        RESOLVER
    }

    /// @notice Registered accounting policy for one counter ID.
    struct LedgerCounterPolicy {
        bool enabled;
        CounterCapMode capMode;
        CounterDeltaMode deltaMode;
        uint64 staticCap;
        uint64 staticIncrement;
        bytes32 counterConfigHash;
    }

    /// @notice One resolved static counter increment prepared by the mint manager.
    struct CounterConsumption {
        bytes32 valueKey;
        uint256 collectionId;
        bytes32 phaseId;
        bytes32 counterId;
        bytes32 subjectKey;
        address payer;
        address recipient;
        address authorizer;
        address executor;
        uint64 increment;
        uint64 cap;
        bytes32 contextHash;
        bytes32 resolutionHash;
    }

    /// @notice Reverts when a caller is not authorized to write ledger state.
    error UnauthorizedLedgerWriter(address writer);
    /// @notice Reverts when the owner tries to configure an invalid writer.
    error InvalidLedgerWriter(address writer);
    /// @notice Reverts when a phase policy registration or lookup is invalid.
    error InvalidPhasePolicy(address manager, uint256 collectionId, bytes32 phaseId);
    /// @notice Reverts when a counter policy is invalid or unsupported for launch.
    error InvalidCounterPolicy(bytes32 counterId);
    /// @notice Reverts when a phase policy repeats a counter ID.
    error DuplicateCounterPolicy(bytes32 counterId);
    /// @notice Reverts when counter ID and counter policy arrays differ in length.
    error CounterPolicyLengthMismatch(uint256 counterIds, uint256 counterPolicies);
    /// @notice Reverts when callers try to consume no counters.
    error EmptyCounterConsumption();
    /// @notice Reverts when a consumed counter has no registered policy.
    error CounterPolicyNotRegistered(
        address manager, uint256 collectionId, bytes32 phaseId, bytes32 counterId
    );
    /// @notice Reverts when a consumed counter does not match its registered policy.
    error CounterPolicyMismatch(bytes32 counterId);
    /// @notice Reverts when a supplied value key does not match the ledger key derivation.
    error CounterValueKeyMismatch(bytes32 suppliedValueKey, bytes32 expectedValueKey);
    /// @notice Reverts when a static counter increment would exceed its cap.
    error CounterCapExceeded(bytes32 valueKey, uint256 projectedValue, uint256 cap);
    /// @notice Reverts when a counter increment would overflow uint64 storage.
    error CounterValueOverflow(bytes32 valueKey);
    /// @notice Reverts when an authorization ID has already been consumed.
    error AuthorizationAlreadyConsumed(bytes32 authorizationId);
    /// @notice Reverts when callers attempt to use unsupported nullifier writes.
    error NullifiersUnsupported(bytes32 nullifier);

    /// @notice Emitted when the owner enables or disables a ledger writer.
    event MintLedgerWriterUpdated(address indexed writer, bool allowed);
    /// @notice Emitted when a manager registers a phase policy hash.
    event MintLedgerPhasePolicyRegistered(
        address indexed manager,
        uint256 indexed collectionId,
        bytes32 indexed phaseId,
        bytes32 policyHash
    );
    /// @notice Emitted for each counter policy registered under a phase policy.
    event MintLedgerCounterPolicyRegistered(
        address indexed manager,
        uint256 indexed collectionId,
        bytes32 indexed phaseId,
        bytes32 counterId,
        CounterCapMode capMode,
        CounterDeltaMode deltaMode,
        uint64 staticCap,
        uint64 staticIncrement,
        bytes32 counterConfigHash,
        bytes32 policyHash
    );
    /// @notice Emitted when a registered counter value is incremented.
    event MintLedgerCounterConsumed(
        bytes32 indexed valueKey,
        uint256 indexed collectionId,
        bytes32 indexed phaseId,
        address manager,
        bytes32 counterId,
        bytes32 subjectKey,
        uint64 increment,
        uint64 newValue,
        uint64 cap,
        bytes32 policyHash
    );
    /// @notice Emitted with non-indexed context for reconstructing a counter increment.
    event MintLedgerCounterConsumptionContext(
        bytes32 indexed valueKey,
        bytes32 indexed counterId,
        bytes32 indexed subjectKey,
        address manager,
        address payer,
        address recipient,
        address authorizer,
        address executor,
        bytes32 contextHash,
        bytes32 resolutionHash
    );
    /// @notice Emitted when an authorization ID is consumed.
    event MintLedgerAuthorizationConsumed(
        bytes32 indexed authorizationId, bytes32 indexed policyHash, address indexed manager
    );
    /// @notice Reserved for future nullifier-supporting ledger implementations.
    event MintLedgerNullifierConsumed(bytes32 indexed nullifier, bytes32 indexed policyHash);

    /// @notice Returns true for deployment validation.
    function isStreamMintLedger() external pure returns (bool);

    /// @notice Enables or disables a deployed manager contract as an authorized ledger writer.
    function setLedgerWriter(address writer, bool allowed) external;

    /// @notice Returns whether an address may register and consume ledger state.
    function ledgerWriter(address writer) external view returns (bool);

    /// @notice Registers one launch-static phase policy for the calling manager.
    function registerPhasePolicy(
        address manager,
        uint256 collectionId,
        bytes32 phaseId,
        bytes32 policyHash,
        bytes32[] calldata counterIds,
        LedgerCounterPolicy[] calldata counterPolicies
    ) external;

    /// @notice Consumes static counter increments and an optional authorization ID.
    function consume(
        CounterConsumption[] calldata consumptions,
        bytes32 authorizationId,
        bytes32[] calldata nullifiers,
        bytes32 policyHash
    ) external;

    /// @notice Returns the registered policy hash for a manager phase.
    function registeredPhasePolicyHash(address manager, uint256 collectionId, bytes32 phaseId)
        external
        view
        returns (bytes32);

    /// @notice Returns the registered static policy for one manager phase counter.
    function registeredCounterPolicy(
        address manager,
        uint256 collectionId,
        bytes32 phaseId,
        bytes32 counterId
    ) external view returns (LedgerCounterPolicy memory);

    /// @notice Returns the durable uint64 value for one ledger counter key.
    /// @dev Counter values are not reset by phase policy re-registration.
    function counterValue(bytes32 valueKey) external view returns (uint64);

    /// @notice Derives the canonical value key for a manager counter subject.
    function deriveCounterValueKey(
        address manager,
        uint256 collectionId,
        bytes32 phaseId,
        bytes32 counterId,
        bytes32 subjectKey
    ) external pure returns (bytes32);

    /// @notice Returns whether the caller has already consumed an authorization ID.
    function isAuthorizationUsed(bytes32 authorizationId) external view returns (bool);

    /// @notice Returns whether a manager has already consumed an authorization ID.
    function isManagerAuthorizationUsed(address manager, bytes32 authorizationId)
        external
        view
        returns (bool);

    /// @notice Returns false until a future nullifier-supporting implementation is accepted.
    function isNullifierUsed(bytes32 nullifier) external view returns (bool);
}
