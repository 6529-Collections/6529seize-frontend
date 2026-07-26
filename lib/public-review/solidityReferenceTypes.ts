export const SOLIDITY_REFERENCE_INDEX_SCHEMA =
  "public-review.solidity-reference-index.v1";
export const SOLIDITY_REFERENCE_BUNDLE_SCHEMA =
  "public-review.solidity-reference.v3";
export const SOLIDITY_REFERENCE_SHARD_SCHEMA =
  "public-review.solidity-definition-shard.v1";
export const SOLIDITY_REFERENCE_GENERATOR_NAME =
  "6529-public-review-solidity-reference";
export const SOLIDITY_REFERENCE_GENERATOR_VERSION = "2";

export type SolidityReferenceScope = "protocol" | "script" | "test";

export interface SoliditySourceRange {
  readonly byteLength: number;
  readonly byteStart: number;
  readonly githubUrl: string;
  readonly lineEnd: number;
  readonly lineStart: number;
  readonly snippetSha256: string;
  readonly sourceSha256: string;
}

export interface SolidityReferenceCounts {
  readonly errors: number;
  readonly events: number;
  readonly functions: number;
}

export interface SolidityDeclarationCounts extends SolidityReferenceCounts {
  readonly enums: number;
  readonly modifiers: number;
  readonly stateVariables: number;
  readonly structs: number;
  readonly userDefinedValueTypes: number;
}

export interface SolidityWarningSummary {
  readonly byCategory: Readonly<Record<string, number>>;
  readonly byCode: Readonly<Record<string, number>>;
  readonly totalCount: number;
}

export interface SolidityDefinitionIndexEntry {
  readonly abiSurfaceCounts: SolidityReferenceCounts;
  readonly abstract: boolean;
  readonly classification: string;
  readonly classificationReason: string;
  readonly declarationCounts: SolidityDeclarationCounts;
  readonly id: string;
  readonly interface: {
    readonly abiSha256?: string | undefined;
    readonly interfaceId?: string | undefined;
    readonly interfaceIdSource?: string | undefined;
    readonly published: boolean;
  };
  readonly key: string;
  readonly kind: string;
  readonly membership: {
    readonly deployment: {
      readonly address: string | null;
      readonly status: string;
    };
    readonly genesisTarget: boolean;
    readonly releaseCatalog: string | null;
  };
  readonly name: string;
  readonly range: SoliditySourceRange;
  readonly release: SolidityReleaseEvidence;
  readonly scope: SolidityReferenceScope;
  readonly shardPath: string;
  readonly shardSha256: string;
  readonly sourcePath: string;
  readonly warningSummary: SolidityWarningSummary;
}

export interface SolidityReleaseEvidence {
  readonly abiSha256?: string | undefined;
  readonly bytecodeSha256?: string | undefined;
  readonly deployedBytecodeSha256?: string | undefined;
  readonly deployedBytecodeSizeBytes?: number | undefined;
  readonly summary?: {
    readonly custom_error_count: number;
    readonly event_count: number;
    readonly function_count: number;
    readonly payable_function_count: number;
    readonly read_function_count: number;
    readonly write_function_count: number;
  };
  readonly tracked: boolean;
}

export interface SoliditySourceFileReference {
  readonly byteLength: number;
  readonly definitionIds: readonly string[];
  readonly githubUrl: string;
  readonly lineCount: number;
  readonly path: string;
  readonly publicPath: string;
  readonly scope: SolidityReferenceScope;
  readonly sha256: string;
  readonly topLevelDeclarations: readonly SolidityTopLevelDeclaration[];
}

export interface SolidityEvidenceArtifact {
  readonly path: string;
  readonly sha256: string;
}

export interface SolidityReadinessRequirement {
  readonly evidence: readonly SolidityEvidenceArtifact[];
  readonly id: string;
  readonly notes: string;
  readonly owner: string;
  readonly phase: "public_beta" | "production_release";
  readonly risk_acceptance: unknown;
  readonly status: string;
}

export interface SolidityRiskRegisterEntry {
  readonly area: string;
  readonly checks: readonly string[];
  readonly evidence: readonly SolidityEvidenceArtifact[];
  readonly id: string;
  readonly mitigation: string;
  readonly owner: string;
  readonly residual_risk: string;
  readonly risk_acceptance: unknown;
  readonly severity: string;
  readonly source: string;
  readonly status: string;
  readonly target_gate: string;
  readonly title: string;
  readonly tracking: readonly string[];
}

export interface SolidityGovernedParameter {
  readonly constant_name: string;
  readonly expected_hosts: {
    readonly count: number;
    readonly profiles: readonly {
      readonly id: number;
      readonly key: string;
    }[];
    readonly status: string;
  };
  readonly family: "GGP" | "GTP";
  readonly guarded_consumers: {
    readonly consumers: readonly string[];
    readonly status: string;
  };
  readonly identifier_schema_version: number;
  readonly gas: {
    readonly failure_class: {
      readonly id: number;
      readonly name: string;
      readonly status: string;
    };
    readonly genesis_value: {
      readonly status: string;
      readonly value: number | null;
    };
    readonly immutable_floor: {
      readonly status: string;
      readonly value: number | null;
    };
  } | null;
  readonly measurement_evidence: {
    readonly path: string | null;
    readonly sha256: string | null;
    readonly status: string;
  };
  readonly name: string;
  readonly normative_source: {
    readonly anchor: string;
    readonly path: string;
    readonly status: string;
  };
  readonly order: number;
  readonly parameter_id: string;
  readonly preimage: string;
  readonly fixed_stipend_compatibility: {
    readonly consumers: readonly string[];
    readonly disposition: string;
    readonly evidence_path: string | null;
    readonly evidence_sha256: string | null;
    readonly status: string;
  };
  readonly time: {
    readonly genesis_value_blocks: {
      readonly status: string;
      readonly value: number | null;
    };
    readonly immutable_floor_blocks: {
      readonly status: string;
      readonly value: number | null;
    };
    readonly wall_clock_floor_seconds: {
      readonly status: string;
      readonly value: number | null;
    };
  } | null;
}

export interface SolidityNatSpecGap {
  readonly contract: string;
  readonly follow_up: string;
  readonly gapType:
    | "custom_error"
    | "declaration"
    | "event"
    | "function"
    | "public_variable_getter";
  readonly id: string;
  readonly kind: "custom_error" | "event" | "function";
  readonly line: number | null;
  readonly reason: string;
  readonly signature: string;
  readonly source: string;
  readonly status:
    | "declaration_not_in_source"
    | "missing_natspec"
    | "public_variable_getter_missing_natspec";
}

export interface SolidityAuditorEvidence {
  readonly blockerReports: {
    readonly productionRelease: {
      readonly path: string;
      readonly sha256: string;
      readonly size_bytes: number;
    };
    readonly publicBeta: {
      readonly path: string;
      readonly sha256: string;
      readonly size_bytes: number;
    };
  };
  readonly boundArtifactDigests: Readonly<
    Record<
      string,
      {
        readonly schemaVersion: string | null;
        readonly sha256: string;
        readonly sizeBytes: number;
      }
    >
  >;
  readonly checksumBundle: Readonly<Record<string, unknown>>;
  readonly governedParameterInventory: {
    readonly candidate_binding: {
      readonly blocked_by_issue: string;
      readonly candidate_artifact_path: string | null;
      readonly candidate_artifact_sha256: string | null;
      readonly candidate_commit: string | null;
      readonly candidate_id: string | null;
      readonly host_bindings: readonly unknown[];
      readonly status: string;
    };
    readonly governance_policy: {
      readonly action_class: {
        readonly id: number;
        readonly name: string;
      };
      readonly domains: Readonly<
        Record<
          string,
          {
            readonly keccak256: string;
            readonly preimage: string;
          }
        >
      >;
      readonly forbidden_surfaces: readonly string[];
      readonly genesis_revision: number;
      readonly maximum_raise_multiplier: {
        readonly denominator: number;
        readonly numerator: number;
      };
      readonly minimum_delay_seconds: number;
      readonly mutation_model: string;
      readonly one_write_per_action_per_parameter: boolean;
      readonly status: string;
    };
    readonly inventory_summary: {
      readonly expected_host_binding_count: number;
      readonly ggp_count: number;
      readonly gtp_count: number;
      readonly logical_parameter_count: number;
    };
    readonly parameters: readonly SolidityGovernedParameter[];
    readonly schema_version: string;
  };
  readonly natSpecGaps: {
    readonly baseline: {
      readonly path: string;
      readonly policy: string;
      readonly schemaVersion: string;
      readonly scope: string;
      readonly sha256: string;
    };
    readonly counts: {
      readonly byGapType: Readonly<Record<string, number>>;
      readonly byKind: Readonly<Record<string, number>>;
      readonly byStatus: Readonly<Record<string, number>>;
    };
    readonly gapCount: number;
    readonly gaps: readonly SolidityNatSpecGap[];
  };
  readonly readiness: {
    readonly release_version: string;
    readonly requirements: readonly SolidityReadinessRequirement[];
    readonly schema_version: string;
    readonly status: {
      readonly production_release: string;
      readonly public_beta: string;
    };
  };
  readonly release: {
    readonly deployment_versions: readonly string[];
    readonly project: string;
    readonly protocol_versions: readonly string[];
    readonly status: string;
  };
  readonly riskRegister: {
    readonly maturity: string;
    readonly readiness_boundary: string;
    readonly risk_acceptance_policy: string;
    readonly risks: readonly SolidityRiskRegisterEntry[];
    readonly schema_version: string;
    readonly status_taxonomy: Readonly<Record<string, string>>;
  };
  readonly schemaVersion: string;
  readonly sha256: string;
  readonly unavailableReleaseCeremony: Readonly<Record<string, string>>;
}

export interface SolidityReferenceManifest {
  readonly auditorEvidence: SolidityAuditorEvidence;
  readonly bundleSchemaVersion: string;
  readonly declarationIndex: readonly SolidityDeclarationIndexEntry[];
  readonly definitionIndex: readonly SolidityDefinitionIndexEntry[];
  readonly files: readonly SoliditySourceFileReference[];
  readonly generator: {
    readonly configSha256: string;
    readonly name: string;
    readonly outputSha256: string;
    readonly sourceSha256: string;
    readonly version: string;
  };
  readonly reviewId: string;
  readonly reviewVersion: string;
  readonly source: {
    readonly artifactChecksums: Readonly<Record<string, string>>;
    readonly commit: string;
    readonly commitTimestamp: string;
    readonly compiler: {
      readonly evmVersion: string;
      readonly optimizer: {
        readonly enabled: boolean;
        readonly runs: number;
      };
      readonly viaIR?: boolean | undefined;
      readonly version: string;
    };
    readonly repository: string;
    readonly roots: readonly {
      readonly path: string;
      readonly scope: SolidityReferenceScope;
    }[];
    readonly sourceChecksums: Readonly<Record<string, string>>;
    readonly tree: string;
  };
  readonly summary: {
    readonly classifications: Readonly<Record<string, number>>;
    readonly contractCount: number;
    readonly declarationCount: number;
    readonly definitionCount: number;
    readonly fileCount: number;
    readonly interfaceCount: number;
    readonly libraryCount: number;
    readonly releaseSurface: Readonly<Record<string, number>>;
    readonly topLevelDeclarationCount: number;
    readonly warningCount: number;
  };
  readonly warningSummary: SolidityWarningSummary;
}

export interface SolidityDeclarationIndexEntry {
  readonly canonicalSignature: string | null;
  readonly definitionId: string | null;
  readonly definitionKey: string | null;
  readonly definitionShardPath: string | null;
  readonly displaySignature: string;
  readonly id: string;
  readonly key: string;
  readonly kind: "function" | "event" | "error";
  readonly name: string;
  readonly range: SoliditySourceRange;
  readonly scope: SolidityReferenceScope;
  readonly selector: string | null;
  readonly sourcePath: string;
  readonly sourcePublicPath: string;
  readonly syntheticGetter: boolean;
  readonly topLevel: boolean;
  readonly topic0: string | null;
}

export interface SolidityReferenceVersionIndexEntry {
  readonly bundlePath: string;
  readonly bundleSha256: string;
  readonly commit: string;
  readonly tree: string;
  readonly version: string;
}

export interface SolidityReferenceIndex {
  readonly activeVersion: string;
  readonly reviewId: string;
  readonly schemaVersion: string;
  readonly versions: readonly SolidityReferenceVersionIndexEntry[];
}

export interface SolidityParameter {
  readonly index: number;
  readonly indexed?: boolean | undefined;
  readonly internalType?: string | undefined;
  readonly name: string;
  readonly storageLocation?: string | undefined;
  readonly type: string;
}

interface SolidityDeclarationBase {
  readonly id: string;
  readonly key: string;
  readonly kind: "function" | "event" | "error";
  readonly name: string;
  readonly natspec: string;
  readonly range: SoliditySourceRange;
}

export interface SolidityFunctionDeclaration extends SolidityDeclarationBase {
  readonly canonicalSignature: string | null;
  readonly displaySignature: string;
  readonly functionKind: string;
  readonly inputs: readonly SolidityParameter[];
  readonly kind: "function";
  readonly modifiers: readonly string[];
  readonly outputs: readonly SolidityParameter[];
  readonly selector: string | null;
  readonly stateMutability: string;
  readonly syntheticGetter: boolean;
  readonly virtual: boolean;
  readonly visibility: string;
}

export interface SolidityEventDeclaration extends SolidityDeclarationBase {
  readonly anonymous: boolean;
  readonly canonicalSignature: string | null;
  readonly displaySignature: string;
  readonly inputs: readonly SolidityParameter[];
  readonly kind: "event";
  readonly topic0: string | null;
}

export interface SolidityErrorDeclaration extends SolidityDeclarationBase {
  readonly canonicalSignature: string | null;
  readonly displaySignature: string;
  readonly inputs: readonly SolidityParameter[];
  readonly kind: "error";
  readonly selector: string;
}

export type SolidityRoutedDeclaration =
  | SolidityFunctionDeclaration
  | SolidityEventDeclaration
  | SolidityErrorDeclaration;

interface SolidityTopLevelDeclarationBase {
  readonly id: string;
  readonly key: string;
  readonly kind:
    | "struct"
    | "enum"
    | "userDefinedValueType"
    | "function"
    | "event"
    | "error"
    | "variable";
  readonly name: string;
  readonly natspec: string;
  readonly nodeType: string;
  readonly range: SoliditySourceRange;
}

export interface SolidityTopLevelStruct
  extends SolidityTopLevelDeclarationBase {
  readonly canonicalName: string;
  readonly kind: "struct";
  readonly members: readonly SolidityParameter[];
  readonly visibility: string | null;
}

export interface SolidityTopLevelEnum
  extends SolidityTopLevelDeclarationBase {
  readonly canonicalName: string;
  readonly kind: "enum";
  readonly members: readonly string[];
}

export interface SolidityTopLevelUserDefinedValueType
  extends SolidityTopLevelDeclarationBase {
  readonly canonicalName: string;
  readonly kind: "userDefinedValueType";
  readonly underlyingType: string;
}

export interface SolidityTopLevelFunction
  extends SolidityTopLevelDeclarationBase {
  readonly canonicalSignature: string | null;
  readonly displaySignature: string;
  readonly functionKind: string;
  readonly inputs: readonly SolidityParameter[];
  readonly kind: "function";
  readonly modifiers: readonly string[];
  readonly outputs: readonly SolidityParameter[];
  readonly selector: string | null;
  readonly stateMutability: string;
  readonly virtual: boolean;
  readonly visibility: string;
}

export interface SolidityTopLevelEvent
  extends SolidityTopLevelDeclarationBase {
  readonly anonymous: boolean;
  readonly canonicalSignature: string | null;
  readonly displaySignature: string;
  readonly inputs: readonly SolidityParameter[];
  readonly kind: "event";
  readonly topic0: string | null;
}

export interface SolidityTopLevelError
  extends SolidityTopLevelDeclarationBase {
  readonly canonicalSignature: string | null;
  readonly displaySignature: string;
  readonly inputs: readonly SolidityParameter[];
  readonly kind: "error";
  readonly selector: string;
}

export interface SolidityTopLevelVariable
  extends SolidityTopLevelDeclarationBase {
  readonly constant: boolean;
  readonly immutable: boolean;
  readonly kind: "variable";
  readonly storageLocation: string | null;
  readonly type: string;
  readonly typeString: string | null;
  readonly valueRange: SoliditySourceRange | null;
  readonly valueSource: string | null;
  readonly visibility: string | null;
}

export type SolidityTopLevelDeclaration =
  | SolidityTopLevelStruct
  | SolidityTopLevelEnum
  | SolidityTopLevelUserDefinedValueType
  | SolidityTopLevelFunction
  | SolidityTopLevelEvent
  | SolidityTopLevelError
  | SolidityTopLevelVariable;

export interface SolidityOtherDeclaration {
  readonly constant?: boolean | undefined;
  readonly immutable?: boolean | undefined;
  readonly members?:
    | readonly SolidityParameter[]
    | readonly string[]
    | undefined;
  readonly name: string;
  readonly natspec: string;
  readonly range: SoliditySourceRange;
  readonly selector?: string | null | undefined;
  readonly type?: string | undefined;
  readonly underlyingType?: string | undefined;
  readonly visibility?: string | null | undefined;
  readonly [key: string]: unknown;
}

export interface SolidityAbiSurfaceEntry {
  readonly declarationId: string;
  readonly declaringDefinitionId: string;
  readonly inherited: boolean;
  readonly inputs: readonly SolidityParameter[];
  readonly name: string;
  readonly signature: string;
  readonly outputs?: readonly SolidityParameter[] | undefined;
  readonly selector?: string | undefined;
  readonly stateMutability?: string | undefined;
  readonly topic0?: string | undefined;
}

export interface SolidityDefinition {
  readonly abiSurface: {
    readonly errors: readonly SolidityAbiSurfaceEntry[];
    readonly events: readonly SolidityAbiSurfaceEntry[];
    readonly functions: readonly SolidityAbiSurfaceEntry[];
  };
  readonly abstract: boolean;
  readonly classification: string;
  readonly classificationReason: string;
  readonly declarations: {
    readonly enums: readonly SolidityOtherDeclaration[];
    readonly errors: readonly SolidityErrorDeclaration[];
    readonly events: readonly SolidityEventDeclaration[];
    readonly functions: readonly SolidityFunctionDeclaration[];
    readonly modifiers: readonly SolidityOtherDeclaration[];
    readonly stateVariables: readonly SolidityOtherDeclaration[];
    readonly structs: readonly SolidityOtherDeclaration[];
    readonly userDefinedValueTypes: readonly SolidityOtherDeclaration[];
  };
  readonly id: string;
  readonly inheritance: readonly {
    readonly definitionId: string;
    readonly name: string;
  }[];
  readonly interface: SolidityDefinitionIndexEntry["interface"];
  readonly key: string;
  readonly kind: string;
  readonly linearizedDefinitionIds: readonly string[];
  readonly membership: SolidityDefinitionIndexEntry["membership"];
  readonly name: string;
  readonly natspec: string;
  readonly range: SoliditySourceRange;
  readonly release: SolidityReleaseEvidence;
  readonly scope: SolidityReferenceScope;
  readonly sourcePath: string;
}

export interface SolidityGenerationWarning {
  readonly category: string;
  readonly code: string;
  readonly declarationId?: string | undefined;
  readonly definitionId: string;
  readonly severity: string;
}

export interface SolidityDefinitionShard {
  readonly definition: SolidityDefinition;
  readonly reviewId: string;
  readonly reviewVersion: string;
  readonly shardSchemaVersion: string;
  readonly warningSummary: SolidityWarningSummary;
  readonly warnings: readonly SolidityGenerationWarning[];
}

export interface SoliditySourceDocument {
  readonly file: SoliditySourceFileReference;
  readonly lines: readonly string[];
  readonly source: string;
}

export type SolidityDeclarationKind = "functions" | "events" | "errors";

export interface SolidityReferenceReviewIdentity {
  readonly activeSourceCommit: string;
  readonly activeVersion: string;
  readonly availableVersions: readonly string[];
  readonly reviewId: string;
  readonly sourceCommits: Readonly<Record<string, string>>;
  readonly sourceRepository: string;
}
