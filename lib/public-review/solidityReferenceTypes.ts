export const SOLIDITY_REFERENCE_INDEX_SCHEMA =
  "public-review.solidity-reference-index.v1";
export const SOLIDITY_REFERENCE_BUNDLE_SCHEMA =
  "public-review.solidity-reference.v2";
export const SOLIDITY_REFERENCE_SHARD_SCHEMA =
  "public-review.solidity-definition-shard.v1";
export const SOLIDITY_REFERENCE_GENERATOR_NAME =
  "6529-public-review-solidity-reference";
export const SOLIDITY_REFERENCE_GENERATOR_VERSION = "1";

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
  readonly topLevelDeclarations: readonly string[];
}

export interface SolidityReferenceManifest {
  readonly bundleSchemaVersion: string;
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
    readonly definitionCount: number;
    readonly fileCount: number;
    readonly interfaceCount: number;
    readonly libraryCount: number;
    readonly releaseSurface: Readonly<Record<string, number>>;
    readonly warningCount: number;
  };
  readonly warningSummary: SolidityWarningSummary;
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
  readonly type: string;
}

export interface SolidityDeclarationBase {
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
  readonly canonicalSignature: string;
  readonly displaySignature: string;
  readonly inputs: readonly SolidityParameter[];
  readonly kind: "event";
  readonly topic0: string;
}

export interface SolidityErrorDeclaration extends SolidityDeclarationBase {
  readonly canonicalSignature: string;
  readonly displaySignature: string;
  readonly inputs: readonly SolidityParameter[];
  readonly kind: "error";
  readonly selector: string;
}

export type SolidityRoutedDeclaration =
  | SolidityFunctionDeclaration
  | SolidityEventDeclaration
  | SolidityErrorDeclaration;

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
  readonly activeVersion: string;
  readonly availableVersions: readonly string[];
  readonly reviewId: string;
  readonly sourceCommit: string;
  readonly sourceRepository: string;
}
