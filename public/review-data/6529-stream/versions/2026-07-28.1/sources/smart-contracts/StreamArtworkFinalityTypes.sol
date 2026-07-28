// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Shared vocabulary for the artwork finality registry ([LTA-FINALITY], [LTA-FREEZE]).
/// @dev Type names carry the `Stream` prefix so this wave's declarations never collide with
///      sibling worktrees; ABI shapes follow the spec code blocks in
///      docs/stream-long-term-architecture.md exactly (struct names never enter selectors).

/// @notice Finality scope vocabulary (Artwork Finality Freeze, Scoped Finality For Open Series).
/// @dev Numeric IDs are pinned by declaration order: COLLECTION = 0, TOKEN = 1, RELEASE = 2,
///      SEASON = 3, VIEW = 4. `COLLECTION = 0` is additionally load-bearing in the sanction
///      subject preimage ([AA-SANCTION]: "COLLECTION=0 for collection finality").
enum StreamFinalityScopeType {
    COLLECTION,
    TOKEN,
    RELEASE,
    SEASON,
    VIEW
}

/// @notice Freeze-mode vocabulary pinned by [LTA-FREEZE] (Freeze Model).
/// @dev NONE = mutable subject to governance; EXACT freezes only the exact scope key;
///      INHERITED freezes the exact key and blocks lower-scope changes; GLOBAL freezes every
///      key in a policy family. The finality registry reports NONE/EXACT/INHERITED; GLOBAL is
///      part of the shared vocabulary for policy-family hosts and is never emitted here.
enum StreamArtworkFreezeMode {
    NONE,
    EXACT,
    INHERITED,
    GLOBAL
}

/// @notice Status machine for the registry's staged TERMINAL_FREEZE path
///         ([LTA-FREEZE] rule 4; ADR 0004 [GOV-WINDOWS] transition table).
enum StreamTerminalFreezeStatus {
    NONE,
    SCHEDULED,
    VETOED,
    CANCELLED,
    EXECUTED,
    EXPIRED
}

/// @notice Scope identity tuple (Scoped Finality For Open Series).
struct StreamFinalityScope {
    StreamFinalityScopeType scopeType;
    uint256 collectionId;
    uint256 tokenId;
    bytes32 scopeId;
}

/// @notice Live component read shape returned by every participating satellite.
struct StreamFinalityComponentState {
    bool frozen;
    bytes32 componentType;
    address component;
    bytes4 interfaceId;
    bytes32 codeHash;
    bytes32 moduleVersion;
    bytes32 manifestHash;
    bytes32 dataHash;
}

/// @notice Submitted component expectation verified against live reads at execution.
struct StreamFinalityComponentExpectation {
    bytes32 componentType;
    address component;
    bytes4 interfaceId;
    bytes32 codeHash;
    bytes32 moduleVersion;
    bytes32 manifestHash;
    bytes32 dataHash;
}

/// @notice Finality manifest reference; `contentHash` commits the canonical manifest bytes.
struct StreamFinalityManifestRef {
    string uri;
    bytes32 uriHash;
    bytes32 contentHash;
    bytes32 schemaId;
    bytes32 canonicalizationHash;
}

/// @notice Stored collection-scope finality record ([LTA-FINALITY] storage block).
struct StreamCollectionFinalityRecord {
    bool finalized;
    bytes32 finalityRecordHash;
    bytes32 manifestContentHash;
    bytes32 manifestURIHash;
    string finalityManifestURI;
    bytes32 componentsHash;
    address manifestPointer;
    uint64 finalizedAt;
}

/// @notice Stored scoped finality record (Scoped Finality For Open Series).
struct StreamScopedFinalityRecord {
    bool finalized;
    StreamFinalityScope scope;
    bytes32 finalityRecordHash;
    bytes32 manifestContentHash;
    bytes32 manifestURIHash;
    bytes32 componentsHash;
    string finalityManifestURI;
    address manifestPointer;
    uint64 finalizedAt;
}

/// @notice Typed collection facts derived by the immutable Core finality adapter.
struct StreamCoreCollectionFinalityFacts {
    bool exists;
    bool hasMaxSupply;
    uint8 status;
    uint8 supplyMode;
    uint256 maxSupply;
    uint256 mintedSupply;
    uint256 burnedSupply;
    uint256 nextCollectionSerial;
    bytes32 collectionConfigHash;
}

/// @notice Raw scoped query accepted by the adapter.
/// @dev `scopeType` intentionally is not an enum: unknown numeric values return a negative
///      semantic result instead of reverting during ABI decoding.
struct StreamCoreFinalityScopeQuery {
    uint8 scopeType;
    uint256 collectionId;
    uint256 tokenId;
    bytes32 scopeId;
}

/// @notice Typed scoped facts derived by the immutable Core finality adapter.
struct StreamScopedCoreFinalityFacts {
    bool scopeExists;
    uint8 scopeType;
    uint256 collectionId;
    uint256 tokenId;
    bytes32 scopeId;
    bool tokenMappingExists;
    uint256 collectionSerial;
    uint8 tokenLifecycle;
    bool burned;
    uint8 collectionStatus;
    uint8 collectionSupplyMode;
    bytes32 collectionConfigHash;
    bytes32 scopeManifestHash;
}

/// @notice Staged terminal-freeze action record hosted by the finality registry.
/// @dev The veto window is `[scheduledAt, notBefore)` and `notBefore - scheduledAt` is
///      floored at 72 hours ([GOV-WINDOWS] rule 2; ADR 0011 decision R10); the
///      open-to-execute window `[notBefore, expiresAfter]` is floored at 7 days
///      ([GOV-WINDOWS] rule 1).
struct StreamTerminalFreezeAction {
    StreamTerminalFreezeStatus status;
    StreamFinalityScope scope;
    bytes32 expectedFinalityRecordHash;
    uint64 scheduledAt;
    uint64 notBefore;
    uint64 expiresAfter;
    address scheduler;
    address vetoGuardianAtScheduling;
}

/// @notice previewFinality result: the same comparisons finalization performs, plus the
///         computed sanction subject hash the artist signs ([AA-SANCTION] requirement 2).
struct StreamFinalityPreview {
    bool wouldExecute;
    bool notAlreadyFinalized;
    bool stagedFreezeReady;
    bool coreGatesSatisfied;
    bool contentRootSatisfied;
    bool manifestSatisfied;
    bool componentsWellFormed;
    bool componentsMatchLive;
    bool sanctionSatisfied;
    bool discoveryMatches;
    bytes32 computedCoreFactsHash;
    bytes32 computedComponentsHash;
    bytes32 computedNonSanctionComponentsHash;
    bytes32 computedSanctionSubjectHash;
    bytes32 computedFinalityRecordHash;
}

/// @notice Pinned domain constants for the artwork finality registry.
/// @dev Every value is `keccak256` of the string preimage in the trailing comment and is
///      mirrored in docs/launch-v1-target-architecture.md (Umbrella Architecture Mirror Rows,
///      artist rows, subject rows). test/StreamFinalityDomainsGolden.t.sol recomputes each one.
library StreamFinalityDomains {
    // ---- Finality record domains (home: [LTA-FINALITY] / [LTA-DOMAINS]) ----

    /// @dev keccak256("6529STREAM_FINALITY_V1")
    bytes32 internal constant STREAM_FINALITY_V1 =
        0x569714204c899f0d33a0f98879ce85708169a5f1e11f763f2897f64e5d6c8493;

    /// @dev keccak256("6529STREAM_FINALITY_COMPONENTS_V1")
    bytes32 internal constant STREAM_FINALITY_COMPONENTS_V1 =
        0xf57efb77611ea13bd3a60968beee86ec330159736aa5d42707a9c0676dbc8898;

    /// @dev keccak256("6529STREAM_CORE_COLLECTION_FACTS_V1")
    bytes32 internal constant STREAM_CORE_COLLECTION_FACTS_V1 =
        0x387b66c3b8fdca5febff2a13faa7057fef7f711c4155493c8c8087e48b28c764;

    /// @dev keccak256("6529STREAM_CORE_COLLECTION_CONFIG_EMPTY_V1"); Core owns the preimage,
    ///      the registry pins it for golden coverage and integration mocks.
    bytes32 internal constant STREAM_CORE_COLLECTION_CONFIG_EMPTY_V1 =
        0x6adebabfe6f92286e8678fc5f206cacb6b1a3b912afc80b6039e9240567e7f26;

    /// @dev keccak256("6529STREAM_FINALITY_RECOVERY_V1"); recovery machinery ships in a later
    ///      slice, the domain is pinned now so preimage discipline never drifts.
    bytes32 internal constant STREAM_FINALITY_RECOVERY_V1 =
        0x521e8df5a00a793a5b47409e1e7711b4b8857ba9e6c833fe59a48dfa865b19ac;

    /// @dev keccak256("6529STREAM_SCOPED_FINALITY_V1")
    bytes32 internal constant STREAM_SCOPED_FINALITY_V1 =
        0x5b56313142e6381659f9d10163ccfa5ea22cb437617c8e69b37c31ecda6f3a50;

    /// @dev keccak256("6529STREAM_SCOPED_CORE_FINALITY_FACTS_V1")
    bytes32 internal constant STREAM_SCOPED_CORE_FINALITY_FACTS_V1 =
        0x5c6390c543248a4d63630061d67c3d2245df223d9ac586deccabf40620b43f6e;

    /// @dev keccak256("6529STREAM_SCOPED_FINALITY_RECOVERY_V1"); pinned ahead of the recovery
    ///      slice, same as STREAM_FINALITY_RECOVERY_V1.
    bytes32 internal constant STREAM_SCOPED_FINALITY_RECOVERY_V1 =
        0x7111cd2afae740dbddcd349ab0b8b9269b6a81c331cef7ca8d542e87308bc54a;

    // ---- Subject derivation domains (home: [CMC-SUBJECT-ID]) ----

    /// @dev keccak256("6529STREAM_SUBJECT_TOKEN_V1")
    bytes32 internal constant STREAM_SUBJECT_TOKEN_V1 =
        0x1e576f27850d12bc1ec9255ca277dbecfbc84fb3a9a34c474640dfca89811d7e;

    /// @dev keccak256("6529STREAM_SUBJECT_SCOPE_V1")
    bytes32 internal constant STREAM_SUBJECT_SCOPE_V1 =
        0x748002ff892f4748f1544a8191da460ca6d167aa2e13eeced354e4f66f636394;

    /// @dev keccak256("6529STREAM_SUBJECT_COLLECTION_V1")
    bytes32 internal constant STREAM_SUBJECT_COLLECTION_V1 =
        0x3a882a22dad9915c9193738f63216234155080ed4c4fc9bfae446e90f1df6e16;

    // ---- Artist sanction domain (home: [AA-DOMAINS] / [AA-SANCTION]) ----

    /// @dev keccak256("6529STREAM_ARTIST_SANCTION_SUBJECT_V1")
    bytes32 internal constant SANCTION_SUBJECT_DOMAIN =
        0x47c9894872096248b3971f1551b555619aea8b63903f526c2da354a7286bb473;

    // ---- Component type vocabulary (home: [LTA-FINALITY] required component types) ----

    /// @dev keccak256("COLLECTION_METADATA")
    bytes32 internal constant COMPONENT_COLLECTION_METADATA =
        0xd90b9e0160ba8e56a77078d6022d52bf0cd862ba5a5adfb6f792287e31399f90;

    /// @dev keccak256("METADATA_ROUTER")
    bytes32 internal constant COMPONENT_METADATA_ROUTER =
        0x7024d3e2544fc48a261933c43d901dca0ee3fc26ea2b857748ab0c295a16f20a;

    /// @dev keccak256("RENDERER")
    bytes32 internal constant COMPONENT_RENDERER =
        0x7df206a0c907b7474a3b59ec39322d07f5cc76c424145fa560ae864e2c8334b1;

    /// @dev keccak256("RENDER_CONTEXT")
    bytes32 internal constant COMPONENT_RENDER_CONTEXT =
        0x9ec0296f9ec64a61db0ff3a5efd1294b47d2978c32c1aecb076f216525c6d1c5;

    /// @dev keccak256("SCRIPT_SOURCE")
    bytes32 internal constant COMPONENT_SCRIPT_SOURCE =
        0x01bcbf3ae47218f940ddca3bf4e7d92baf29ddecea1c38e63350d55b4aa53d73;

    /// @dev keccak256("DEPENDENCY_SOURCE")
    bytes32 internal constant COMPONENT_DEPENDENCY_SOURCE =
        0xa1e40ff39c7b676a717e91c20b2ab7b7f502965d6cc6bd8b37d7ce772f8c8586;

    /// @dev keccak256("MEDIA_MANIFEST")
    bytes32 internal constant COMPONENT_MEDIA_MANIFEST =
        0xa094a8a85bb1f5c4c5c7fa7dad9d83cdba21c78ccef9ae708217cd64dbea7c9a;

    /// @dev keccak256("ENTROPY_COORDINATOR")
    bytes32 internal constant COMPONENT_ENTROPY_COORDINATOR =
        0xb3b3ef20764c647bdeda70b21ab009ff2783106d6995be14389ec6f42ea6dfbb;

    /// @dev keccak256("ARTIST_SANCTION"); pinned in the protocol v1 artist mirror rows.
    bytes32 internal constant COMPONENT_ARTIST_SANCTION =
        0x1e14b418e60392f62e7baf2e6edfcfb6dfeab92fb4428eff216b492ed5cef047;

    /// @dev keccak256("PLATFORM_WORKS_DECLARATION"); pinned in the protocol v1 artist mirror rows.
    bytes32 internal constant COMPONENT_PLATFORM_WORKS_DECLARATION =
        0x9b732a2be945a9747de080e93cd0a83076acad44dca7585847960ffebdb0d29d;

    /// @dev keccak256("REFERENCE_RENDER")
    bytes32 internal constant COMPONENT_REFERENCE_RENDER =
        0xa814b1b6f6e0b07c5330893efc29545d7b6c242616f50f8aaf7942305569a8ca;

    /// @dev keccak256("OPTIONAL_SNAPSHOT_ROUTE")
    bytes32 internal constant COMPONENT_OPTIONAL_SNAPSHOT_ROUTE =
        0x31768727f16bb21bf296353a211441c524fc19d478fe73d886555c8a2150ae40;

    // ---- Role vocabulary references (home: ADR 0004 [GOV-ROLES]) ----

    /// @dev keccak256("ROLE_COLLECTION_FINALITY_ADMIN")
    bytes32 internal constant ROLE_COLLECTION_FINALITY_ADMIN =
        0x3ba602f38b556566e93e274f3c25565b5efa75d4084fb99bdf6ddc5adb423226;

    /// @dev keccak256("ROLE_TERMINAL_FREEZE_VETO")
    bytes32 internal constant ROLE_TERMINAL_FREEZE_VETO =
        0x7c0cf05bbab982f1ecb8f528f1921326b0f24dfd9baf5beabba3ebbf59a6e61c;

    // ---- Governed gas parameter key (home: [LTA-GGP] mirror rows) ----

    /// @dev keccak256("6529STREAM_GGP_FINALITY_COMPONENT_READ_GAS")
    bytes32 internal constant GGP_FINALITY_COMPONENT_READ_GAS =
        0xbf54fb4ba4a0942771e26fe4b1f829f8324f6f98ef66e080fd6885b75bdf3221;

    // ---- Cross-contract numeric IDs (home: Numeric ID Catalog rows in the umbrella spec) ----

    /// @dev CollectionStatus CLOSED per the ACTIVE/PAUSED/CLOSED vocabulary
    ///      (docs/collection-metadata-contract.md, Open-Ended Collections).
    uint8 internal constant CORE_COLLECTION_STATUS_CLOSED = 2;

    /// @dev CollectionSupplyMode UNCAPPED_OPEN is the highest valid value in the closed
    ///      FIXED/CAPPED_OPEN/UNCAPPED_OPEN vocabulary.
    uint8 internal constant CORE_COLLECTION_SUPPLY_MODE_UNCAPPED_OPEN = 2;

    /// @dev tokenLifecycle numeric IDs ([LTA-IDENTITY]: UNKNOWN=0, PREPARED_INCOMPLETE=1,
    ///      MINTED=2, BURNED=3).
    uint8 internal constant TOKEN_LIFECYCLE_MINTED = 2;
    uint8 internal constant TOKEN_LIFECYCLE_BURNED = 3;

    /// @dev MetadataMode numeric IDs (the `MetadataMode` enum owned by the metadata router,
    ///      docs/metadata-router-and-renderer.md; Numeric ID Catalog): OFFCHAIN=0, ONCHAIN=1,
    ///      HYBRID=2. ONCHAIN and HYBRID are the script-work modes that carry the extra
    ///      SCRIPT_SOURCE/DEPENDENCY_SOURCE/REFERENCE_RENDER floor and the snapshot-manifest gate.
    uint8 internal constant METADATA_MODE_OFFCHAIN = 0;
    uint8 internal constant METADATA_MODE_ONCHAIN = 1;
    uint8 internal constant METADATA_MODE_HYBRID = 2;
}

/// @notice Mandatory finality component-set logic ([LTA-FINALITY] requirement 1, MRR-FINALITY
///         rules 6-9, [CMC-FINALITY-INPUTS]).
/// @dev Hosted as a library so the mandatory-floor check is shared byte-for-byte between the
///      registry (execution) and the preview periphery, and does not inflate either contract's
///      own bytecode. The floor is enforced onchain independently from the mandatory
///      discovery module's exact-route check.
library StreamFinalityComponentSet {
    /// @dev Strict/preview reads need enough gas to decode or emit a typed failure after a target
    ///      exhausts its forwarded gas. Capped diagnostics need only their compact false path.
    uint256 private constant STRICT_READ_PARENT_GAS_RESERVE = 100_000;
    uint256 private constant DIAGNOSTIC_READ_PARENT_GAS_RESERVE = 10_000;
    bytes32 private constant INVALID_METADATA_MODE_SENTINEL = bytes32(type(uint256).max);

    /// @notice Returns the first mandatory componentType missing from `components` for the
    ///         collection's `metadataMode`, or `bytes32(0)` when all are present.
    /// @dev Base floor (every mode): COLLECTION_METADATA, METADATA_ROUTER, RENDERER,
    ///      RENDER_CONTEXT, MEDIA_MANIFEST, ENTROPY_COORDINATOR ([LTA-FINALITY] "Required
    ///      component types include at least"). Script-work modes (ONCHAIN/HYBRID) additionally
    ///      require SCRIPT_SOURCE, DEPENDENCY_SOURCE, and REFERENCE_RENDER (MRR-FINALITY rule 9,
    ///      [CMC-FINALITY-INPUTS] rule 5). The sorted-unique list guarantee makes each present
    ///      type a distinct entry; live frozen state is verified separately by the caller.
    ///      Invalid future/unrecognized mode IDs fail closed with a nonzero sentinel rather than
    ///      inheriting the less restrictive OFFCHAIN floor.
    function firstMissingMandatory(
        StreamFinalityComponentExpectation[] memory components,
        uint8 metadataMode
    ) public pure returns (bytes32) {
        if (metadataMode > StreamFinalityDomains.METADATA_MODE_HYBRID) {
            return INVALID_METADATA_MODE_SENTINEL;
        }
        uint256 seen = _presenceMask(components);
        // Bit layout matches _requiredMask ordering below.
        uint256 required = _requiredMask(metadataMode);
        uint256 missing = required & ~seen;
        if (missing == 0) {
            return bytes32(0);
        }
        // Return the lowest-set missing bit's componentType, matching declaration order.
        if (missing & 0x001 != 0) return StreamFinalityDomains.COMPONENT_COLLECTION_METADATA;
        if (missing & 0x002 != 0) return StreamFinalityDomains.COMPONENT_METADATA_ROUTER;
        if (missing & 0x004 != 0) return StreamFinalityDomains.COMPONENT_RENDERER;
        if (missing & 0x008 != 0) return StreamFinalityDomains.COMPONENT_RENDER_CONTEXT;
        if (missing & 0x010 != 0) return StreamFinalityDomains.COMPONENT_MEDIA_MANIFEST;
        if (missing & 0x020 != 0) return StreamFinalityDomains.COMPONENT_ENTROPY_COORDINATOR;
        if (missing & 0x040 != 0) return StreamFinalityDomains.COMPONENT_SCRIPT_SOURCE;
        if (missing & 0x080 != 0) return StreamFinalityDomains.COMPONENT_DEPENDENCY_SOURCE;
        return StreamFinalityDomains.COMPONENT_REFERENCE_RENDER;
    }

    /// @notice True when every mandatory componentType for `metadataMode` is present.
    function hasAllMandatory(
        StreamFinalityComponentExpectation[] memory components,
        uint8 metadataMode
    ) public pure returns (bool) {
        return firstMissingMandatory(components, metadataMode) == bytes32(0);
    }

    /// @notice Locates the single artist-sanction / platform-works declaration slot
    ///         ([LTA-FINALITY] requirement 9, [AA-SANCTION] requirement 3: exactly one applies).
    function locateSanctionSlot(StreamFinalityComponentExpectation[] memory components)
        public
        pure
        returns (uint256 index, uint256 occurrences)
    {
        for (uint256 i = 0; i < components.length; i++) {
            bytes32 t = components[i].componentType;
            if (
                t == StreamFinalityDomains.COMPONENT_ARTIST_SANCTION
                    || t == StreamFinalityDomains.COMPONENT_PLATFORM_WORKS_DECLARATION
            ) {
                index = i;
                occurrences++;
            }
        }
    }

    /// @notice Bounded staticcall to a component's finality read plus a fixed-size returndata
    ///         decode; never reverts on component misbehavior ([LTA-FINALITY] diagnostic-read
    ///         semantics). `gasCap == 0` forwards available gas less a fixed reserve (execution
    ///         and preview); nonzero caps forwarded gas (diagnostic, FINALITY_COMPONENT_READ_GAS).
    function observeComponent(address component, bytes memory componentCallData, uint256 gasCap)
        public
        view
        returns (bool readable, StreamFinalityComponentState memory state)
    {
        uint256 availableGas = gasleft();
        uint256 parentReserve =
            gasCap == 0 ? STRICT_READ_PARENT_GAS_RESERVE : DIAGNOSTIC_READ_PARENT_GAS_RESERVE;
        if (component.code.length == 0 || availableGas <= parentReserve) {
            return (false, state);
        }
        uint256 forwardedGas = availableGas - parentReserve;
        if (gasCap != 0 && gasCap < forwardedGas) {
            forwardedGas = gasCap;
        }
        bytes memory returndata = new bytes(8 * 32);
        assembly ("memory-safe") {
            readable := staticcall(
                forwardedGas,
                component,
                add(componentCallData, 0x20),
                mload(componentCallData),
                add(returndata, 0x20),
                0x100
            )
            if iszero(eq(returndatasize(), 0x100)) { readable := 0 }
        }
        if (!readable) {
            return (false, state);
        }
        uint256 rawFrozen;
        bytes32 componentType;
        uint256 rawComponent;
        uint256 rawInterfaceId;
        bytes32 codeHash;
        bytes32 moduleVersion;
        bytes32 manifestHash;
        bytes32 dataHash;
        assembly ("memory-safe") {
            rawFrozen := mload(add(returndata, 0x20))
            componentType := mload(add(returndata, 0x40))
            rawComponent := mload(add(returndata, 0x60))
            rawInterfaceId := mload(add(returndata, 0x80))
            codeHash := mload(add(returndata, 0xa0))
            moduleVersion := mload(add(returndata, 0xc0))
            manifestHash := mload(add(returndata, 0xe0))
            dataHash := mload(add(returndata, 0x100))
        }
        if (rawFrozen > 1 || rawComponent > type(uint160).max) {
            return (false, state);
        }
        if (rawInterfaceId & ((uint256(1) << 224) - 1) != 0) {
            return (false, state);
        }
        state = StreamFinalityComponentState({
            frozen: rawFrozen == 1,
            componentType: componentType,
            component: address(uint160(rawComponent)),
            interfaceId: bytes4(bytes32(rawInterfaceId)),
            codeHash: codeHash,
            moduleVersion: moduleVersion,
            manifestHash: manifestHash,
            dataHash: dataHash
        });
        return (true, state);
    }

    /// @notice Bounded exact-word discovery read. Rejects codeless targets, failed calls, and
    ///         short or oversized returndata without copying attacker-controlled returndata.
    /// @dev `gasCap == 0` forwards the available gas less a fixed parent-frame reserve for strict
    ///      execution/preview. A nonzero cap is the governed post-finality diagnostic budget.
    function observeDiscoveryWord(address discovery, bytes memory callData, uint256 gasCap)
        public
        view
        returns (bool readable, bytes32 value)
    {
        uint256 availableGas = gasleft();
        uint256 parentReserve =
            gasCap == 0 ? STRICT_READ_PARENT_GAS_RESERVE : DIAGNOSTIC_READ_PARENT_GAS_RESERVE;
        if (discovery.code.length == 0 || availableGas <= parentReserve) {
            return (false, bytes32(0));
        }
        uint256 forwardedGas = availableGas - parentReserve;
        if (gasCap != 0 && gasCap < forwardedGas) {
            forwardedGas = gasCap;
        }
        assembly ("memory-safe") {
            let output := mload(0x40)
            readable := staticcall(
                forwardedGas,
                discovery,
                add(callData, 0x20),
                mload(callData),
                output,
                0x20
            )
            if iszero(eq(returndatasize(), 0x20)) { readable := 0 }
            if readable { value := mload(output) }
        }
    }

    /// @notice Bounded exact-seven-word discovery enumeration read. Noncanonical addresses or
    ///         bytes4 words and any non-224-byte response fail closed without an ABI-decode revert.
    /// @dev Gas semantics match `observeDiscoveryWord`.
    function observeDiscoveryComponent(address discovery, bytes memory callData, uint256 gasCap)
        public
        view
        returns (bool readable, StreamFinalityComponentExpectation memory component)
    {
        uint256 availableGas = gasleft();
        uint256 parentReserve =
            gasCap == 0 ? STRICT_READ_PARENT_GAS_RESERVE : DIAGNOSTIC_READ_PARENT_GAS_RESERVE;
        if (discovery.code.length == 0 || availableGas <= parentReserve) {
            return (false, component);
        }
        uint256 forwardedGas = availableGas - parentReserve;
        if (gasCap != 0 && gasCap < forwardedGas) {
            forwardedGas = gasCap;
        }
        bytes memory result = new bytes(7 * 32);
        assembly ("memory-safe") {
            readable := staticcall(
                forwardedGas,
                discovery,
                add(callData, 0x20),
                mload(callData),
                add(result, 0x20),
                0xe0
            )
            if iszero(eq(returndatasize(), 0xe0)) { readable := 0 }
        }
        if (!readable) {
            return (false, component);
        }
        uint256 rawComponent;
        uint256 rawInterfaceId;
        assembly ("memory-safe") {
            rawComponent := mload(add(result, 0x40))
            rawInterfaceId := mload(add(result, 0x60))
        }
        if (rawComponent > type(uint160).max || rawInterfaceId & ((1 << 224) - 1) != 0) {
            return (false, component);
        }
        component = abi.decode(result, (StreamFinalityComponentExpectation));
        return (true, component);
    }

    /// @notice True when a live component `state` exactly matches the submitted `expectation`
    ///         and reports `frozen = true`.
    function stateMatchesExpectation(
        StreamFinalityComponentState memory state,
        StreamFinalityComponentExpectation memory expectation
    ) public pure returns (bool) {
        return state.frozen && state.componentType == expectation.componentType
            && state.component == expectation.component
            && state.interfaceId == expectation.interfaceId
            && state.codeHash == expectation.codeHash
            && state.moduleVersion == expectation.moduleVersion
            && state.manifestHash == expectation.manifestHash
            && state.dataHash == expectation.dataHash;
    }

    /// @notice Live-match check for a stored expectation under an optional gas cap: false when
    ///         the component has no code, its codehash drifted, the read failed, or state
    ///         diverged. Used by the diagnostic reads.
    function componentStillMatches(
        StreamFinalityComponentExpectation memory expectation,
        bytes memory componentCallData,
        uint256 gasCap
    ) public view returns (bool) {
        address component = expectation.component;
        if (component.code.length == 0 || component.codehash != expectation.codeHash) {
            return false;
        }
        (bool readable, StreamFinalityComponentState memory state) =
            observeComponent(component, componentCallData, gasCap);
        return readable && stateMatchesExpectation(state, expectation);
    }

    /// @notice Failure codes returned by verifyComponentsStrict.
    uint8 internal constant STRICT_OK = 0;
    uint8 internal constant STRICT_UNREADABLE = 1;
    uint8 internal constant STRICT_CODEHASH_MISMATCH = 2;
    uint8 internal constant STRICT_STATE_MISMATCH = 3;

    /// @notice Batch diagnostic over a stored expectation slice under a per-read gas cap:
    ///         returns whether every entry still matches live state, plus the components hash of
    ///         the expected slice and of the observed slice. Never reverts on component
    ///         misbehavior ([LTA-FINALITY] diagnostic-read semantics); one library call covers
    ///         the whole slice.
    /// @dev `expectedSlice` is the pre-sliced stored expectations; `componentsDomain` is
    ///      STREAM_FINALITY_COMPONENTS_V1 so the observed hash uses the identical domain/order
    ///      as the expected hash. An unreadable, code-drifted, or diverged entry sets
    ///      matches=false and leaves its observed entry zeroed.
    function diagnoseRange(
        StreamFinalityComponentExpectation[] memory expectedSlice,
        bytes memory componentCallData,
        uint256 gasCap,
        bytes32 componentsDomain
    ) public view returns (bool matches, bytes32 expectedHash, bytes32 observedHash) {
        matches = true;
        StreamFinalityComponentExpectation[] memory observed =
            new StreamFinalityComponentExpectation[](expectedSlice.length);
        for (uint256 i = 0; i < expectedSlice.length; i++) {
            StreamFinalityComponentExpectation memory expectation = expectedSlice[i];
            (bool readable, StreamFinalityComponentState memory state) =
                observeComponent(expectation.component, componentCallData, gasCap);
            if (readable) {
                observed[i] = StreamFinalityComponentExpectation({
                    componentType: state.componentType,
                    component: state.component,
                    interfaceId: state.interfaceId,
                    codeHash: state.codeHash,
                    moduleVersion: state.moduleVersion,
                    manifestHash: state.manifestHash,
                    dataHash: state.dataHash
                });
            }
            bool ok = readable && expectation.component.code.length != 0
                && expectation.component.codehash == expectation.codeHash
                && stateMatchesExpectation(state, expectation);
            if (!ok) {
                matches = false;
            }
        }
        expectedHash = keccak256(abi.encode(componentsDomain, expectedSlice));
        observedHash = keccak256(abi.encode(componentsDomain, observed));
    }

    /// @notice Strict all-gas verification of the full submitted component list against live
    ///         reads ([LTA-FINALITY] recording semantics: revert if any component read fails,
    ///         returns malformed data, reports frozen=false, or differs from the expectation).
    /// @dev One library call verifies every component so the registry incurs a single
    ///      delegatecall for the whole list. `componentCallData` is the ABI-encoded
    ///      finalityState/finalityStateForScope call. Returns STRICT_OK with failIndex 0 on
    ///      success, else the first failing index and its failure code.
    function verifyComponentsStrict(
        StreamFinalityComponentExpectation[] memory components,
        bytes memory componentCallData
    ) public view returns (uint8 failCode, uint256 failIndex) {
        for (uint256 i = 0; i < components.length; i++) {
            address component = components[i].component;
            if (component.code.length == 0) {
                return (STRICT_UNREADABLE, i);
            }
            if (component.codehash != components[i].codeHash) {
                return (STRICT_CODEHASH_MISMATCH, i);
            }
            (bool readable, StreamFinalityComponentState memory state) =
                observeComponent(component, componentCallData, 0);
            if (!readable) {
                return (STRICT_UNREADABLE, i);
            }
            if (!stateMatchesExpectation(state, components[i])) {
                return (STRICT_STATE_MISMATCH, i);
            }
        }
        return (STRICT_OK, 0);
    }

    function _requiredMask(uint8 metadataMode) private pure returns (uint256) {
        uint256 base = 0x03F; // bits 0-5: the six base-floor types
        if (
            metadataMode == StreamFinalityDomains.METADATA_MODE_ONCHAIN
                || metadataMode == StreamFinalityDomains.METADATA_MODE_HYBRID
        ) {
            return base | 0x1C0; // add bits 6-8: script/dependency/reference-render
        }
        return base;
    }

    function _presenceMask(StreamFinalityComponentExpectation[] memory components)
        private
        pure
        returns (uint256 seen)
    {
        for (uint256 i = 0; i < components.length; i++) {
            bytes32 t = components[i].componentType;
            if (t == StreamFinalityDomains.COMPONENT_COLLECTION_METADATA) seen |= 0x001;
            else if (t == StreamFinalityDomains.COMPONENT_METADATA_ROUTER) seen |= 0x002;
            else if (t == StreamFinalityDomains.COMPONENT_RENDERER) seen |= 0x004;
            else if (t == StreamFinalityDomains.COMPONENT_RENDER_CONTEXT) seen |= 0x008;
            else if (t == StreamFinalityDomains.COMPONENT_MEDIA_MANIFEST) seen |= 0x010;
            else if (t == StreamFinalityDomains.COMPONENT_ENTROPY_COORDINATOR) seen |= 0x020;
            else if (t == StreamFinalityDomains.COMPONENT_SCRIPT_SOURCE) seen |= 0x040;
            else if (t == StreamFinalityDomains.COMPONENT_DEPENDENCY_SOURCE) seen |= 0x080;
            else if (t == StreamFinalityDomains.COMPONENT_REFERENCE_RENDER) seen |= 0x100;
        }
    }
}
