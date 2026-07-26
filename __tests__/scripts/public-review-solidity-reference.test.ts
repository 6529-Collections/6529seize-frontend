// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  BUNDLE_SCHEMA_VERSION,
  DEFINITION_SHARD_SCHEMA_VERSION,
  GENERATOR_NAME,
  GENERATOR_VERSION,
  assertCanonicalSurfaceEqual,
  assertCompilerSourceSet,
  assertEverySourceRootMatched,
  abiSurface,
  bundleOutputSha256,
  compareStrings,
  decodeUtf8,
  encodeSemanticKey,
  keccak256,
  reconcileDeclarationWithAbi,
  selectorForSignature,
  sha256Urn,
  stateVariableRecord,
  stableJson,
  topicForSignature,
  topLevelDeclarationRecord,
  validateDefinitionShards,
  validateBundle,
  validateConfig,
  validateCustomErrorCatalog,
  validateNatSpecBaseline,
  validateNatSpecEvidence,
  validateRetainedSourceRanges,
  validateReleaseArtifactManifest,
  validateReleaseManifest,
  validateRecordFamilyAuthorizationSourceCatalog,
} = require("../../scripts/public-reviews/solidity-reference-lib.cjs") as {
  BUNDLE_SCHEMA_VERSION: string;
  DEFINITION_SHARD_SCHEMA_VERSION: string;
  GENERATOR_NAME: string;
  GENERATOR_VERSION: string;
  assertCanonicalSurfaceEqual: (
    expected: Array<Record<string, unknown>>,
    actual: Array<Record<string, unknown>>,
    kind: "function" | "event" | "error",
    label: string
  ) => void;
  assertCompilerSourceSet: (
    sources: Map<string, Buffer>,
    compilerOutput: { sources?: Record<string, unknown> }
  ) => void;
  assertEverySourceRootMatched: (
    roots: string[],
    sourcePaths: string[]
  ) => void;
  abiSurface: (
    definitions: Map<number, RawDefinition>,
    definition: RawDefinition,
    output: CompilerOutput
  ) => AbiSurface;
  bundleOutputSha256: (bundle: Record<string, unknown>) => string;
  compareStrings: (left: string, right: string) => number;
  decodeUtf8: (value: Buffer) => string;
  encodeSemanticKey: (value: string) => string;
  keccak256: (value: string) => string;
  reconcileDeclarationWithAbi: (
    definition: RawDefinition,
    declaration: Declaration,
    kind: "event" | "error",
    abiRecord: AbiRecord
  ) => Declaration;
  selectorForSignature: (value: string) => string;
  sha256Urn: (value: Buffer) => string;
  stateVariableRecord: (
    node: Record<string, unknown>,
    definitionId: string,
    sourceRecord: Record<string, unknown>,
    source: Record<string, unknown>
  ) => Record<string, unknown>;
  stableJson: (value: unknown) => string;
  topicForSignature: (value: string) => string;
  topLevelDeclarationRecord: (
    node: Record<string, unknown>,
    sourceRecord: Record<string, unknown>,
    source: Record<string, unknown>
  ) => Record<string, unknown>;
  validateDefinitionShards: (
    bundle: unknown,
    shards: Map<string, unknown>
  ) => void;
  validateBundle: (bundle: Record<string, unknown>) => void;
  validateConfig: (config: Record<string, unknown>) => void;
  validateCustomErrorCatalog: (
    surface: Record<string, unknown>,
    catalog: Record<string, unknown>
  ) => void;
  validateNatSpecBaseline: (
    sources: Map<string, Record<string, unknown>>,
    artifacts: Record<
      string,
      { json: Record<string, unknown>; sha256: string }
    >
  ) => {
    baseline: Record<string, unknown>;
    gapCount: number;
    counts: {
      byGapType: Record<string, number>;
      byKind: Record<string, number>;
      byStatus: Record<string, number>;
    };
    gaps: Array<Record<string, unknown>>;
  };
  validateNatSpecEvidence: (evidence: Record<string, unknown>) => void;
  validateRetainedSourceRanges: (
    value: unknown,
    sourcePath: string,
    sourceRecord: Record<string, unknown>,
    sourceBuffer: Buffer,
    label?: string
  ) => void;
  validateReleaseArtifactManifest: (
    artifacts: Record<
      string,
      { json: Record<string, unknown>; sha256?: string }
    >
  ) => void;
  validateReleaseManifest: (
    artifacts: Record<
      string,
      {
        buffer: Buffer;
        json: Record<string, unknown>;
        sha256: string;
      }
    >
  ) => Record<string, unknown>;
  validateRecordFamilyAuthorizationSourceCatalog: (
    sources: Map<string, { sha256: string }>,
    artifacts: Record<
      string,
      {
        json: Record<string, unknown>;
        sha256: string;
      }
    >
  ) => Record<string, unknown>;
};

type Declaration = {
  id: string;
  key: string;
  kind: "function" | "event" | "error";
  name: string;
  canonicalSignature: string | null;
  selector?: string;
  topic0?: string;
  syntheticGetter?: boolean;
};

type AbiRecord = {
  name: string;
  signature: string;
  selector?: string;
  topic0?: string;
};

type RawDefinition = {
  semanticId: string;
  sourcePath: string;
  name: string;
  node: { id: number; linearizedBaseContracts: number[] };
  members: {
    functions: Declaration[];
    events: Declaration[];
    errors: Declaration[];
    stateVariables: Array<{
      name: string;
      selector: string;
      natspec: null;
      range: { lineStart: number };
    }>;
  };
};

type CompilerOutput = {
  contracts: Record<
    string,
    Record<
      string,
      {
        abi: Array<Record<string, unknown>>;
      }
    >
  >;
};

type AbiSurface = {
  functions: Array<{
    signature: string;
    selector: string;
    declarationId: string;
  }>;
};

function declaration(
  kind: "event" | "error",
  name: string,
  hash: string
): Declaration {
  return {
    id: `contracts/T.sol:T#${kind}:display`,
    key: encodeSemanticKey(`contracts/T.sol:T#${kind}:display`),
    kind,
    name,
    canonicalSignature: null,
    ...(kind === "event" ? { topic0: hash } : { selector: hash }),
  };
}

describe("Solidity public-review reference generator", () => {
  it("requires canonical immutable public review output paths", () => {
    const config = {
      schemaVersion: "public-review.solidity-source.v1",
      reviewId: "stream",
      reviewVersion: "v1",
      source: {
        repository: "6529-Collections/6529Stream",
        commit: "e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8",
        tree: "3a8e3cb8102e891a73972282026d2811e7591852",
        compilerVersion: "0.8.19+commit.7dd6d404",
        evmVersion: "paris",
        viaIR: true,
        optimizer: { enabled: true, runs: 200 },
        roots: [{ path: "smart-contracts", scope: "protocol" }],
      },
      releaseArtifacts: [
        {
          path: "release-artifacts/contracts.json",
          schemaVersion: "contracts.v1",
        },
      ],
      classification: {
        vendoredSourcePaths: [],
        legacySourcePaths: [],
        excludedDefinitions: [],
      },
      output: {
        directory: "public/review-data/stream/versions/v1",
        retainedVersions: ["v1"],
        bundleFile: "reference-manifest.json",
        definitionsDirectory: "definitions",
        sourcesDirectory: "sources",
        indexFile: "public/review-data/stream/index.json",
      },
    };
    expect(() => validateConfig(config)).not.toThrow();

    const drifted = JSON.parse(JSON.stringify(config));
    drifted.output.directory = "public/custom/stream/v1";
    expect(() => validateConfig(drifted)).toThrow(
      "canonical public review version path"
    );
  });

  it("uses code-unit sorting and rejects a source root with no Solidity files", () => {
    expect(["ä", "z", "A"].sort(compareStrings)).toEqual(["A", "z", "ä"]);
    expect(() =>
      assertEverySourceRootMatched(
        ["smart-contracts", "test"],
        ["smart-contracts/StreamCore.sol"]
      )
    ).toThrow("Source root matched no Solidity files: test");
  });

  it("rejects a compiler output that omits any pinned Solidity source", () => {
    const pinned = new Map([
      ["smart-contracts/A.sol", Buffer.from("contract A {}")],
      ["smart-contracts/B.sol", Buffer.from("contract B {}")],
    ]);

    expect(() =>
      assertCompilerSourceSet(pinned, {
        sources: { "smart-contracts/A.sol": {} },
      })
    ).toThrow("missing: smart-contracts/B.sol");
  });

  it("recomputes retained source lines and snippet digests for nested ranges", () => {
    const sourcePath = "smart-contracts/T.sol";
    const sourceBuffer = Buffer.from("first\nsecond\nthird\n");
    const sourceSha256 = sha256Urn(sourceBuffer);
    const sourceRecord = {
      path: sourcePath,
      byteLength: sourceBuffer.length,
      sha256: sourceSha256,
      githubUrl:
        "https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/T.sol",
    };
    const value = {
      definition: {
        declarations: {
          modifiers: [
            {
              range: {
                byteStart: 6,
                byteLength: 6,
                lineStart: 2,
                lineEnd: 2,
                sourceSha256,
                snippetSha256: sha256Urn(Buffer.from("second")),
                githubUrl:
                  "https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/T.sol#L2",
              },
            },
          ],
        },
      },
    };
    expect(() =>
      validateRetainedSourceRanges(
        value,
        sourcePath,
        sourceRecord,
        sourceBuffer
      )
    ).not.toThrow();

    const lineTamper = JSON.parse(JSON.stringify(value));
    lineTamper.definition.declarations.modifiers[0].range.lineStart = 1;
    expect(() =>
      validateRetainedSourceRanges(
        lineTamper,
        sourcePath,
        sourceRecord,
        sourceBuffer
      )
    ).toThrow("line, snippet digest, or GitHub URL drifted");

    const digestTamper = JSON.parse(JSON.stringify(value));
    digestTamper.definition.declarations.modifiers[0].range.snippetSha256 = `sha256:${"0".repeat(64)}`;
    expect(() =>
      validateRetainedSourceRanges(
        digestTamper,
        sourcePath,
        sourceRecord,
        sourceBuffer
      )
    ).toThrow("line, snippet digest, or GitHub URL drifted");

    const urlTamper = JSON.parse(JSON.stringify(value));
    urlTamper.definition.declarations.modifiers[0].range.githubUrl =
      "https://github.com/6529-Collections/6529Stream/blob/wrong/T.sol#L2";
    expect(() =>
      validateRetainedSourceRanges(
        urlTamper,
        sourcePath,
        sourceRecord,
        sourceBuffer
      )
    ).toThrow("line, snippet digest, or GitHub URL drifted");
  });

  it("preserves full pinned governance/finality-style file-scope type details", () => {
    const text = [
      "struct GovernanceCall { address target; uint256 value; }",
      "enum StreamTerminalFreezeStatus { NONE, SCHEDULED }",
      "uint256 constant MODULE_VERSION = 42;",
    ].join("\n");
    const buffer = Buffer.from(text);
    const lineStarts = [0];
    for (let index = 0; index < buffer.length; index += 1) {
      if (buffer[index] === 10) {
        lineStarts.push(index + 1);
      }
    }
    const sourceRecord = {
      path: "smart-contracts/IStreamGovernanceExecutor.sol",
      buffer,
      lineStarts,
      lineCount: 3,
      sha256: sha256Urn(buffer),
    };
    const source = {
      repository: "6529-Collections/6529Stream",
      commit: "e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8",
    };
    const structStart = text.indexOf("struct GovernanceCall");
    const structText = text.slice(structStart, text.indexOf("\n", structStart));
    const governanceCall = topLevelDeclarationRecord(
      {
        nodeType: "StructDefinition",
        name: "GovernanceCall",
        canonicalName: "GovernanceCall",
        visibility: "public",
        documentation: { text: "A governance call." },
        src: `${structStart}:${Buffer.byteLength(structText)}:0`,
        members: [
          {
            name: "target",
            typeName: { nodeType: "ElementaryTypeName", name: "address" },
          },
          {
            name: "value",
            typeName: { nodeType: "ElementaryTypeName", name: "uint256" },
          },
        ],
      },
      sourceRecord,
      source
    );

    expect(governanceCall).toMatchObject({
      kind: "struct",
      name: "GovernanceCall",
      canonicalName: "GovernanceCall",
      natspec: "A governance call.",
      members: [
        { index: 0, name: "target", type: "address" },
        { index: 1, name: "value", type: "uint256" },
      ],
    });

    const enumStart = text.indexOf("enum StreamTerminalFreezeStatus");
    const enumText = text.slice(enumStart, text.indexOf("\n", enumStart));
    const finalityStatus = topLevelDeclarationRecord(
      {
        nodeType: "EnumDefinition",
        name: "StreamTerminalFreezeStatus",
        canonicalName: "StreamTerminalFreezeStatus",
        src: `${enumStart}:${Buffer.byteLength(enumText)}:0`,
        members: [{ name: "NONE" }, { name: "SCHEDULED" }],
      },
      sourceRecord,
      source
    );
    expect(finalityStatus).toMatchObject({
      kind: "enum",
      name: "StreamTerminalFreezeStatus",
      members: ["NONE", "SCHEDULED"],
    });

    const variableStart = text.indexOf("uint256 constant MODULE_VERSION");
    const variableText = text.slice(variableStart);
    const valueStart = text.lastIndexOf("42");
    const moduleVersion = topLevelDeclarationRecord(
      {
        nodeType: "VariableDeclaration",
        name: "MODULE_VERSION",
        constant: true,
        visibility: "internal",
        typeName: { nodeType: "ElementaryTypeName", name: "uint256" },
        typeDescriptions: { typeString: "uint256" },
        src: `${variableStart}:${Buffer.byteLength(variableText)}:0`,
        value: { src: `${valueStart}:2:0` },
      },
      sourceRecord,
      source
    );
    expect(moduleVersion).toMatchObject({
      kind: "variable",
      name: "MODULE_VERSION",
      type: "uint256",
      constant: true,
      valueSource: "42",
      valueRange: { byteStart: valueStart, byteLength: 2 },
    });
  });

  it("retains contract constant and immutable initializer values losslessly", () => {
    const text = "uint256 constant LIMIT = 42;\nuint256 immutable FLOOR = 7;\n";
    const buffer = Buffer.from(text);
    const sourceRecord = {
      path: "smart-contracts/Config.sol",
      buffer,
      lineStarts: [0, text.indexOf("\n") + 1],
      lineCount: 2,
      sha256: sha256Urn(buffer),
    };
    const source = {
      repository: "6529-Collections/6529Stream",
      commit: "e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8",
    };
    const record = (
      name: string,
      initializer: string,
      declaration: string,
      constant: boolean,
      mutability: string
    ) => {
      const declarationStart = text.indexOf(declaration);
      const valueStart = text.indexOf(initializer, declarationStart);
      return stateVariableRecord(
        {
          nodeType: "VariableDeclaration",
          name,
          typeName: { nodeType: "ElementaryTypeName", name: "uint256" },
          typeDescriptions: { typeString: "uint256" },
          visibility: "internal",
          constant,
          mutability,
          src: `${declarationStart}:${Buffer.byteLength(declaration)}:0`,
          value: {
            nodeType: "Literal",
            src: `${valueStart}:${Buffer.byteLength(initializer)}:0`,
          },
        },
        "smart-contracts/Config.sol:Config",
        sourceRecord,
        source
      );
    };

    expect(
      record("LIMIT", "42", "uint256 constant LIMIT = 42;", true, "constant")
    ).toMatchObject({
      constant: true,
      immutable: false,
      valueSource: "42",
      valueRange: {
        byteStart: text.indexOf("42"),
        byteLength: 2,
      },
    });
    expect(
      record("FLOOR", "7", "uint256 immutable FLOOR = 7;", false, "immutable")
    ).toMatchObject({
      constant: false,
      immutable: true,
      valueSource: "7",
      valueRange: {
        byteStart: text.lastIndexOf("7"),
        byteLength: 1,
      },
    });
  });

  it("compares full ABI outputs, mutability, and event indexing", () => {
    const expectedFunction = {
      name: "read",
      signature: "read(uint256)",
      selector: "0x01020304",
      state_mutability: "view",
      payable: false,
      posture: "read",
      inputs: [
        {
          index: 0,
          name: "id",
          type: "uint256",
          internal_type: "uint256",
        },
      ],
      outputs: [{ index: 0, name: "", type: "bool", internal_type: "bool" }],
    };
    const actualFunction = {
      ...expectedFunction,
      stateMutability: "view",
      inputs: [
        { index: 0, name: "id", type: "uint256", internalType: "uint256" },
      ],
      outputs: [{ index: 0, name: "", type: "bool", internalType: "bool" }],
    };
    delete (actualFunction as Record<string, unknown>)["state_mutability"];
    expect(() =>
      assertCanonicalSurfaceEqual(
        [expectedFunction],
        [actualFunction],
        "function",
        "read"
      )
    ).not.toThrow();
    expect(() =>
      assertCanonicalSurfaceEqual(
        [expectedFunction],
        [
          {
            ...actualFunction,
            outputs: [
              {
                index: 0,
                name: "",
                type: "uint256",
                internalType: "uint256",
              },
            ],
          },
        ],
        "function",
        "read"
      )
    ).toThrow("semantic ABI surface");
    expect(() =>
      assertCanonicalSurfaceEqual(
        [expectedFunction],
        [{ ...actualFunction, stateMutability: "payable", payable: true }],
        "function",
        "read"
      )
    ).toThrow("semantic ABI surface");

    const event = {
      name: "Changed",
      signature: "Changed(address)",
      topic0: topicForSignature("Changed(address)"),
      anonymous: false,
      inputs: [
        {
          index: 0,
          name: "account",
          type: "address",
          internal_type: "address",
          indexed: true,
        },
      ],
    };
    expect(() =>
      assertCanonicalSurfaceEqual(
        [event],
        [
          {
            ...event,
            inputs: [
              {
                index: 0,
                name: "account",
                type: "address",
                internalType: "address",
                indexed: false,
              },
            ],
          },
        ],
        "event",
        "Changed"
      )
    ).toThrow("semantic ABI surface");
  });

  it("rejects a release-manifest digest mutation", () => {
    const artifacts = {
      "release-artifacts/latest/release-artifact-manifest.json": {
        json: {
          artifacts: Object.fromEntries(
            [
              "abi-checksums.json",
              "event-topic-catalog.json",
              "interface-ids.json",
            ].map((name) => [
              name,
              { path: name, sha256: `sha256:${name.padEnd(64, "0")}` },
            ])
          ),
        },
      },
      "release-artifacts/latest/abi-checksums.json": {
        json: {},
        sha256: `sha256:${"abi-checksums.json".padEnd(64, "0")}`,
      },
      "release-artifacts/latest/event-topic-catalog.json": {
        json: {},
        sha256: `sha256:${"event-topic-catalog.json".padEnd(64, "0")}`,
      },
      "release-artifacts/latest/interface-ids.json": {
        json: {},
        sha256: `sha256:${"interface-ids.json".padEnd(64, "0")}`,
      },
    };
    expect(() => validateReleaseArtifactManifest(artifacts)).not.toThrow();
    artifacts["release-artifacts/latest/abi-checksums.json"].sha256 =
      `sha256:${"drift".padEnd(64, "0")}`;
    expect(() => validateReleaseArtifactManifest(artifacts)).toThrow(
      "manifest digest drifted"
    );
  });

  it("reconciles release readiness, risks, and governed-parameter digests", () => {
    type Artifact = {
      buffer: Buffer;
      json: Record<string, unknown>;
      sha256: string;
    };
    const artifact = (
      schemaVersion: string,
      fields: Record<string, unknown> = {}
    ): Artifact => {
      const json = { schema_version: schemaVersion, ...fields };
      const buffer = Buffer.from(stableJson(json));
      return { buffer, json, sha256: sha256Urn(buffer) };
    };
    const artifacts: Record<string, Artifact> = {};
    const schemasByPath: Record<string, string> = {
      "release-artifacts/contracts.json": "contracts.v1",
      "release-artifacts/genesis-deployment-profile.json": "genesis.v1",
      "release-artifacts/latest/abi-checksums.json": "abi.v1",
      "release-artifacts/latest/event-topic-catalog.json": "events.v1",
      "release-artifacts/latest/interface-ids.json": "interfaces.v1",
      "release-artifacts/latest/protocol-surface-report.json": "surface.v1",
      "release-artifacts/latest/custom-error-catalog.json": "errors.v1",
      "release-artifacts/latest/release-artifact-manifest.json":
        "artifact-manifest.v1",
      "release-artifacts/latest/source-verification-inputs.json":
        "verification.v1",
      "release-artifacts/baselines/v0.1.0/natspec-coverage.json": "natspec.v1",
    };
    for (const [artifactPath, schemaVersion] of Object.entries(schemasByPath)) {
      artifacts[artifactPath] = artifact(schemaVersion);
    }
    const genesisSha = artifacts[
      "release-artifacts/genesis-deployment-profile.json"
    ]!.sha256.replace(/^sha256:/, "");
    const parameterPreimage = "6529STREAM_GGP_TEST";
    const domainPreimage = "6529STREAM_GAS_PARAMETER_SCOPE_V2";
    artifacts["release-artifacts/governed-parameter-inventory.json"] = artifact(
      "6529stream.governed-parameter-inventory.v1",
      {
        status: "planning",
        genesis_profile: { sha256: genesisSha },
        inventory_summary: {
          ggp_count: 1,
          gtp_count: 0,
          logical_parameter_count: 1,
          expected_host_binding_count: 1,
        },
        candidate_binding: {
          status: "not_available",
          candidate_id: null,
          candidate_commit: null,
          candidate_artifact_path: null,
          candidate_artifact_sha256: null,
          host_bindings: [],
        },
        governance_policy: {
          domains: {
            gas_scope: {
              preimage: domainPreimage,
              keccak256: keccak256(domainPreimage),
            },
          },
        },
        parameters: [
          {
            family: "GGP",
            name: "TEST",
            preimage: parameterPreimage,
            parameter_id: keccak256(parameterPreimage),
            expected_hosts: { count: 1 },
          },
        ],
      }
    );
    artifacts["release-artifacts/latest/public-beta-evidence.json"] = artifact(
      "6529stream.public-beta-evidence.v1",
      {
        release_version: "v0.1.0-local",
        status: {
          public_beta: "blocked",
          production_release: "blocked",
        },
        requirements: [
          { id: "audit", phase: "public_beta", status: "missing" },
          { id: "signatures", phase: "production_release", status: "missing" },
        ],
      }
    );
    artifacts["release-artifacts/latest/risk-register.json"] = artifact(
      "6529stream.risk-register.v1",
      {
        maturity: "pre_audit_local_baseline",
        risks: [
          {
            id: "RISK-AUD-001",
            area: "audit",
            status: "open_blocker",
          },
        ],
      }
    );
    artifacts[
      "release-artifacts/record-family-authorization-source-catalog.json"
    ] = artifact(
      "6529stream.record-family-authorization-source-catalog.v1",
      {}
    );

    const manifestKeysByPath: Record<string, string> = {
      "release-artifacts/contracts.json": "contract_config",
      "release-artifacts/genesis-deployment-profile.json":
        "genesis_deployment_profile",
      "release-artifacts/governed-parameter-inventory.json":
        "governed_parameter_inventory",
      "release-artifacts/latest/abi-checksums.json": "abi_checksums",
      "release-artifacts/latest/event-topic-catalog.json":
        "event_topic_catalog",
      "release-artifacts/latest/interface-ids.json": "interface_ids",
      "release-artifacts/latest/protocol-surface-report.json":
        "protocol_surface_report",
      "release-artifacts/latest/custom-error-catalog.json":
        "custom_error_catalog",
      "release-artifacts/latest/release-artifact-manifest.json":
        "artifact_manifest",
      "release-artifacts/latest/source-verification-inputs.json":
        "source_verification_inputs",
      "release-artifacts/latest/public-beta-evidence.json":
        "public_beta_evidence",
      "release-artifacts/latest/risk-register.json": "risk_register",
      "release-artifacts/baselines/v0.1.0/natspec-coverage.json":
        "natspec_coverage_baseline",
    };
    const releaseArtifacts: Record<string, Record<string, unknown>> = {};
    for (const [artifactPath, manifestKey] of Object.entries(
      manifestKeysByPath
    )) {
      const bound = artifacts[artifactPath]!;
      releaseArtifacts[manifestKey] = {
        path: artifactPath,
        sha256: bound.sha256,
        size_bytes: bound.buffer.length,
        schema_version: bound.json["schema_version"],
      };
    }
    const recordFamilyCatalog =
      artifacts[
        "release-artifacts/record-family-authorization-source-catalog.json"
      ]!;
    releaseArtifacts["record_family_authorization"] = {
      source_catalog: {
        path: "release-artifacts/record-family-authorization-source-catalog.json",
        sha256: recordFamilyCatalog.sha256,
        size_bytes: recordFamilyCatalog.buffer.length,
        schema_version: recordFamilyCatalog.json["schema_version"],
      },
    };
    Object.assign(releaseArtifacts["public_beta_evidence"]!, {
      status: {
        public_beta: "blocked",
        production_release: "blocked",
      },
      blocking_counts: { public_beta: 1, production_release: 1 },
    });
    Object.assign(releaseArtifacts["risk_register"]!, {
      maturity: "pre_audit_local_baseline",
      risk_count: 1,
      open_blocker_count: 1,
      planned_mitigation_count: 0,
      accepted_local_baseline_count: 0,
      areas: ["audit"],
    });
    releaseArtifacts["public_beta_blocker_report"] = {
      path: "release-artifacts/latest/public-beta-blockers.md",
      sha256: `sha256:${"1".repeat(64)}`,
      size_bytes: 1,
    };
    releaseArtifacts["production_release_blocker_report"] = {
      path: "release-artifacts/latest/production-release-blockers.md",
      sha256: `sha256:${"2".repeat(64)}`,
      size_bytes: 1,
    };
    const releaseManifestJson = {
      schema_version: "6529stream.release-manifest.v1",
      release: {
        project: "6529Stream",
        status: "pre_audit_local_baseline",
      },
      release_artifacts: releaseArtifacts,
      checksum_bundle: {
        coverage_expectation: {
          release_manifest_path:
            "release-artifacts/latest/release-manifest.json",
          covered_by_checksum_bundle: true,
        },
      },
      unavailable_release_ceremony: {},
    };
    artifacts["release-artifacts/latest/release-manifest.json"] = artifact(
      "6529stream.release-manifest.v1",
      releaseManifestJson
    );

    expect(() => validateReleaseManifest(artifacts)).not.toThrow();
    (
      releaseArtifacts["public_beta_evidence"]!["blocking_counts"] as Record<
        string,
        number
      >
    )["public_beta"] = 2;
    expect(() => validateReleaseManifest(artifacts)).toThrow(
      "readiness blocker counts drifted"
    );
  });

  it("validates record-family authorization source bindings against pinned blobs", () => {
    const sourcePath = "smart-contracts/StreamRecordFamilyRegistry.sol";
    const sourceSha256 = "a".repeat(64);
    const catalogArtifact = {
      sha256: `sha256:${"b".repeat(64)}`,
      json: {
        schema_version:
          "6529stream.record-family-authorization-source-catalog.v1",
        status: "source_implemented_candidate_unbound",
        source_bindings: [{ path: sourcePath, sha256: sourceSha256 }],
        classifier: { candidate_binding_status: "not_available" },
        authorization_classes: [{ id: 1, name: "ARTIST_SIGNER" }],
        family_groups: [
          {
            name: "ARTIST",
            id: `0x${"c".repeat(64)}`,
            allowed_authorization_class_ids: [1],
          },
        ],
        host_bindings: [{ contract: "StreamCollectionMetadata" }],
        source_tests: ["test/StreamRecordFamilyAuthorization.t.sol"],
        remaining_blockers: ["exact_candidate_binding_not_available"],
      },
    };
    const artifacts = {
      "release-artifacts/record-family-authorization-source-catalog.json":
        catalogArtifact,
    };
    const sources = new Map([
      [sourcePath, { sha256: `sha256:${sourceSha256}` }],
    ]);

    expect(() =>
      validateRecordFamilyAuthorizationSourceCatalog(sources, artifacts)
    ).not.toThrow();

    sources.set(sourcePath, { sha256: `sha256:${"d".repeat(64)}` });
    expect(() =>
      validateRecordFamilyAuthorizationSourceCatalog(sources, artifacts)
    ).toThrow("source binding checksum drifted");

    sources.set(sourcePath, { sha256: `sha256:${sourceSha256}` });
    expect(() =>
      validateRecordFamilyAuthorizationSourceCatalog(sources, {
        "release-artifacts/record-family-authorization-source-catalog.json": {
          ...catalogArtifact,
          json: {
            ...catalogArtifact.json,
            family_groups: [
              {
                name: "ARTIST",
                id: `0x${"c".repeat(64)}`,
                allowed_authorization_class_ids: [2],
              },
            ],
          },
        },
      })
    ).toThrow("family evidence is malformed");

    expect(() =>
      validateRecordFamilyAuthorizationSourceCatalog(sources, {
        "release-artifacts/record-family-authorization-source-catalog.json": {
          ...catalogArtifact,
          json: {
            ...catalogArtifact.json,
            source_bindings: [
              ...catalogArtifact.json.source_bindings,
              ...catalogArtifact.json.source_bindings,
            ],
          },
        },
      })
    ).toThrow("duplicate record-family authorization source binding");
  });

  it("rejects a same-count custom-error catalog mutation", () => {
    const error = {
      name: "BadInput",
      signature: "BadInput(uint256)",
      selector: selectorForSignature("BadInput(uint256)"),
      inputs: [
        {
          index: 0,
          name: "value",
          type: "uint256",
          internal_type: "uint256",
        },
      ],
    };
    const surface = {
      contracts: {
        T: {
          source: "smart-contracts/T.sol",
          custom_errors: [error],
        },
      },
    };
    const catalog = {
      entries: [
        {
          contract: "T",
          source: "smart-contracts/T.sol",
          category: "configuration",
          severity: "high",
          ...error,
        },
      ],
      summary: {
        custom_error_count: 1,
        contract_count: 1,
        category_counts: { configuration: 1 },
        severity_counts: { high: 1 },
        duplicate_selectors: {},
      },
    };
    expect(() => validateCustomErrorCatalog(surface, catalog)).not.toThrow();
    catalog.entries[0]!.selector = "0x00000000";
    expect(() => validateCustomErrorCatalog(surface, catalog)).toThrow(
      "semantic entries disagree"
    );
  });

  it("reconciles the NatSpec baseline IDs, statuses, and lines", () => {
    const source = "smart-contracts/T.sol";
    const sources = new Map([
      [
        source,
        {
          text: "contract T {\n    function read(uint256 id) external view returns (bool);\n}\n",
        },
      ],
    ]);
    const artifacts = {
      "release-artifacts/latest/protocol-surface-report.json": {
        sha256: `sha256:${"a".repeat(64)}`,
        json: {
          contracts: {
            T: {
              source,
              functions: [
                {
                  name: "read",
                  signature: "read(uint256)",
                },
              ],
              events: [],
              custom_errors: [],
            },
          },
        },
      },
      "release-artifacts/baselines/v0.1.0/natspec-coverage.json": {
        sha256: `sha256:${"b".repeat(64)}`,
        json: {
          schema_version: "1",
          policy: "Every public surface gap must be explicitly tracked.",
          scope: "Pinned public protocol surface.",
          exclusions: [
            {
              id: "T:function:read(uint256)",
              contract: "T",
              source,
              kind: "function",
              signature: "read(uint256)",
              status: "missing_natspec",
              line: 2,
              reason: "Document this function.",
              follow_up: "Documentation review.",
            },
          ],
        },
      },
    };
    const evidence = validateNatSpecBaseline(sources, artifacts);
    expect(() => validateNatSpecEvidence(evidence)).not.toThrow();
    expect(evidence).toEqual({
      baseline: {
        path: "release-artifacts/baselines/v0.1.0/natspec-coverage.json",
        schemaVersion: "1",
        sha256: `sha256:${"b".repeat(64)}`,
        policy: "Every public surface gap must be explicitly tracked.",
        scope: "Pinned public protocol surface.",
      },
      gapCount: 1,
      counts: {
        byGapType: { function: 1 },
        byKind: { function: 1 },
        byStatus: { missing_natspec: 1 },
      },
      gaps: [
        {
          id: "T:function:read(uint256)",
          contract: "T",
          source,
          kind: "function",
          signature: "read(uint256)",
          status: "missing_natspec",
          line: 2,
          gapType: "function",
          reason: "Document this function.",
          follow_up: "Documentation review.",
        },
      ],
    });
    const invalidEvidence = JSON.parse(JSON.stringify(evidence));
    invalidEvidence.gaps[0]!.follow_up = "";
    expect(() => validateNatSpecEvidence(invalidEvidence)).toThrow(
      "generated NatSpec auditor evidence gap is invalid"
    );
    artifacts[
      "release-artifacts/baselines/v0.1.0/natspec-coverage.json"
    ].json.exclusions[0]!.status = "declaration_not_in_source";
    expect(() => validateNatSpecBaseline(sources, artifacts)).toThrow(
      "NatSpec baseline status drifted"
    );
  });

  it("recomputes bundle kind/classification summaries and source checksums", () => {
    const sourceSha256 = `sha256:${"a".repeat(64)}`;
    const sourcePath = "smart-contracts/T.sol";
    const sourcePublicPath =
      "/review-data/stream/versions/v1/sources/smart-contracts/T.sol";
    const repository = "6529-Collections/6529Stream";
    const commit = "e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8";
    const sourceGithubUrl = `https://github.com/${repository}/blob/${commit}/${sourcePath}`;
    const declarationId = `${sourcePath}#top-level:function:helper()`;
    const declarationRange = {
      byteStart: 0,
      byteLength: 0,
      lineStart: 1,
      lineEnd: 1,
      sourceSha256,
      githubUrl: `${sourceGithubUrl}#L1`,
    };
    const topLevelDeclaration = {
      id: declarationId,
      key: encodeSemanticKey(declarationId),
      kind: "function",
      name: "helper",
      displaySignature: "helper()",
      canonicalSignature: null,
      selector: null,
      syntheticGetter: false,
      range: declarationRange,
    };
    const bundle = {
      bundleSchemaVersion: BUNDLE_SCHEMA_VERSION,
      reviewId: "stream",
      reviewVersion: "v1",
      source: {
        repository,
        commit,
        sourceChecksums: {
          [sourcePath]: sourceSha256,
        },
      },
      generator: {
        name: GENERATOR_NAME,
        version: GENERATOR_VERSION,
        outputSha256: null as string | null,
      },
      summary: {
        fileCount: 1,
        topLevelDeclarationCount: 1,
        declarationCount: 1,
        definitionCount: 0,
        contractCount: 0,
        interfaceCount: 0,
        libraryCount: 0,
        classifications: {},
        warningCount: 0,
      },
      declarationIndex: [
        {
          id: declarationId,
          key: encodeSemanticKey(declarationId),
          kind: "function",
          name: "helper",
          displaySignature: "helper()",
          canonicalSignature: null,
          selector: null,
          topic0: null,
          syntheticGetter: false,
          definitionId: null,
          definitionKey: null,
          definitionShardPath: null,
          sourcePath,
          sourcePublicPath,
          scope: "protocol",
          range: declarationRange,
          topLevel: true,
        },
      ],
      definitionIndex: [],
      files: [
        {
          path: sourcePath,
          publicPath: sourcePublicPath,
          githubUrl: sourceGithubUrl,
          scope: "protocol",
          sha256: sourceSha256,
          byteLength: 0,
          definitionIds: [],
          topLevelDeclarations: [topLevelDeclaration],
        },
      ],
      warningSummary: {
        totalCount: 0,
        byCategory: {},
        byCode: {},
      },
      auditorEvidence: {
        natSpecGaps: {
          baseline: {
            path: "release-artifacts/baselines/v0.1.0/natspec-coverage.json",
            schemaVersion: "1",
            sha256: `sha256:${"b".repeat(64)}`,
            policy: "Every public surface gap must be explicitly tracked.",
            scope: "Pinned public protocol surface.",
          },
          gapCount: 0,
          counts: {
            byGapType: {},
            byKind: {},
            byStatus: {},
          },
          gaps: [],
        },
      },
    };
    bundle.generator.outputSha256 = bundleOutputSha256(bundle);
    expect(() => validateBundle(bundle)).not.toThrow();

    const summaryDrift = JSON.parse(JSON.stringify(bundle));
    summaryDrift.summary.contractCount = 1;
    summaryDrift.generator.outputSha256 = bundleOutputSha256(summaryDrift);
    expect(() => validateBundle(summaryDrift)).toThrow(
      "contractCount summary is invalid"
    );

    const checksumDrift = JSON.parse(JSON.stringify(bundle));
    checksumDrift.source.sourceChecksums["smart-contracts/T.sol"] =
      `sha256:${"b".repeat(64)}`;
    checksumDrift.generator.outputSha256 = bundleOutputSha256(checksumDrift);
    expect(() => validateBundle(checksumDrift)).toThrow(
      "source checksum map is invalid"
    );

    const declarationProjectionDrift = JSON.parse(JSON.stringify(bundle));
    declarationProjectionDrift.declarationIndex[0].sourcePublicPath =
      "/review-data/stream/versions/v1/sources/wrong.sol";
    declarationProjectionDrift.generator.outputSha256 = bundleOutputSha256(
      declarationProjectionDrift
    );
    expect(() => validateBundle(declarationProjectionDrift)).toThrow(
      "source route or range drifted"
    );
  });

  it("uses Ethereum Keccak-256 and stable selectors", () => {
    expect(keccak256("")).toBe(
      "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
    );
    expect(keccak256("abc")).toBe(
      "0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45"
    );
    expect(keccak256("a".repeat(135))).toBe(
      "0x34367dc248bbd832f4e3e69dfaac2f92638bd0bbd18f2912ba4ef454919cf446"
    );
    expect(keccak256("a".repeat(137))).toBe(
      "0xd869f639c7046b4929fc92a4d988a8b22c55fbadb802c0c66ebcd484f1915f39"
    );
    expect(selectorForSignature("transfer(address,uint256)")).toBe(
      "0xa9059cbb"
    );
  });

  it("encodes semantic keys losslessly as unpadded base64url", () => {
    const semanticId =
      "contracts/Ünicode.sol:流#event:Changed((uint256,address))";
    const key = encodeSemanticKey(semanticId);

    expect(key).not.toContain("=");
    expect(decodeUtf8(Buffer.from(key, "base64url"))).toBe(semanticId);
  });

  it("materializes a public state-variable getter as a declaration", () => {
    const selector = selectorForSignature("value()");
    const definition: RawDefinition = {
      semanticId: "contracts/T.sol:T",
      sourcePath: "contracts/T.sol",
      name: "T",
      node: { id: 1, linearizedBaseContracts: [1] },
      members: {
        functions: [],
        events: [],
        errors: [],
        stateVariables: [
          {
            name: "value",
            selector,
            natspec: null,
            range: { lineStart: 4 },
          },
        ],
      },
    };
    const output: CompilerOutput = {
      contracts: {
        "contracts/T.sol": {
          T: {
            abi: [
              {
                inputs: [],
                name: "value",
                outputs: [
                  {
                    internalType: "uint256",
                    name: "",
                    type: "uint256",
                  },
                ],
                stateMutability: "view",
                type: "function",
              },
            ],
          },
        },
      },
    };

    const surface = abiSurface(new Map([[1, definition]]), definition, output);
    const generatedGetter = definition.members.functions[0];
    if (!generatedGetter) {
      throw new Error("Expected the public state variable getter.");
    }

    expect(definition.members.functions).toHaveLength(1);
    expect(generatedGetter).toMatchObject({
      id: `contracts/T.sol:T#function:${selector}`,
      canonicalSignature: "value()",
      selector,
      syntheticGetter: true,
    });
    expect(surface.functions[0]).toMatchObject({
      declarationId: generatedGetter.id,
      selector,
      signature: "value()",
    });
  });

  it("reconciles user-defined event and tuple error types to compiler ABI signatures", () => {
    const definition = {
      semanticId: "contracts/T.sol:T",
    } as unknown as RawDefinition;
    const eventSignature = "ModeChanged(uint8)";
    const event = declaration(
      "event",
      "ModeChanged",
      topicForSignature(eventSignature)
    );
    const reconciledEvent = reconcileDeclarationWithAbi(
      definition,
      event,
      "event",
      {
        name: "ModeChanged",
        signature: eventSignature,
        topic0: topicForSignature(eventSignature),
      }
    );

    expect(reconciledEvent).toMatchObject({
      id: `contracts/T.sol:T#event:${eventSignature}`,
      canonicalSignature: eventSignature,
      topic0: topicForSignature(eventSignature),
    });

    const errorSignature = "BadConfig((uint256,address))";
    const errorSelector = selectorForSignature(errorSignature);
    const error = declaration("error", "BadConfig", errorSelector);
    error.id = `contracts/T.sol:T#error:${errorSelector}`;
    error.key = encodeSemanticKey(error.id);
    const reconciledError = reconcileDeclarationWithAbi(
      definition,
      error,
      "error",
      {
        name: "BadConfig",
        signature: errorSignature,
        selector: errorSelector,
      }
    );

    expect(reconciledError).toMatchObject({
      id: `contracts/T.sol:T#error:${errorSelector}`,
      canonicalSignature: errorSignature,
      selector: errorSelector,
    });
  });

  it("rejects missing, extra, or checksum-drifted definition shards", () => {
    const id = "contracts/T.sol:T";
    const key = encodeSemanticKey(id);
    const definition = {
      id,
      key,
      sourcePath: "contracts/T.sol",
      scope: "protocol",
      declarations: {
        functions: [],
        events: [],
        errors: [],
      },
      abiSurface: {
        functions: [],
        events: [],
        errors: [],
      },
    };
    const shard = {
      shardSchemaVersion: DEFINITION_SHARD_SCHEMA_VERSION,
      reviewId: "stream",
      reviewVersion: "v1",
      definition,
      warnings: [],
      warningSummary: {
        totalCount: 0,
        byCategory: {},
        byCode: {},
      },
    };
    const buffer = Buffer.from(stableJson(shard));
    const bundle = {
      bundleSchemaVersion: BUNDLE_SCHEMA_VERSION,
      reviewId: "stream",
      reviewVersion: "v1",
      summary: { warningCount: 0 },
      declarationIndex: [],
      files: [
        {
          path: definition.sourcePath,
          publicPath: "/review-data/stream/versions/v1/sources/contracts/T.sol",
          scope: definition.scope,
          topLevelDeclarations: [],
        },
      ],
      warningSummary: {
        totalCount: 0,
        byCategory: {},
        byCode: {},
      },
      definitionIndex: [
        {
          id,
          key,
          name: undefined,
          sourcePath: definition.sourcePath,
          scope: definition.scope,
          kind: undefined,
          classification: undefined,
          declarationCounts: {
            functions: 0,
            events: 0,
            errors: 0,
            modifiers: 0,
            structs: 0,
            enums: 0,
            stateVariables: 0,
            userDefinedValueTypes: 0,
          },
          abiSurfaceCounts: {
            functions: 0,
            events: 0,
            errors: 0,
          },
          shardSha256: sha256Urn(buffer),
          warningSummary: shard.warningSummary,
        },
      ],
    };
    const validShards = new Map([[key, { buffer, shard }]]);

    expect(() => validateDefinitionShards(bundle, validShards)).not.toThrow();
    const projectionDrift = {
      ...bundle,
      definitionIndex: [
        {
          ...bundle.definitionIndex[0],
          declarationCounts: {
            ...bundle.definitionIndex[0]!.declarationCounts,
            functions: 1,
          },
        },
      ],
    };
    expect(() =>
      validateDefinitionShards(projectionDrift, validShards)
    ).toThrow("index projection drifted");
    expect(() => validateDefinitionShards(bundle, new Map())).toThrow(
      "incomplete"
    );

    const drifted = Buffer.from(buffer);
    drifted[drifted.length - 2] = drifted[drifted.length - 2]! ^ 1;
    expect(() =>
      validateDefinitionShards(
        bundle,
        new Map([[key, { buffer: drifted, shard }]])
      )
    ).toThrow("checksum drifted");

    const extraId = "contracts/Extra.sol:Extra";
    const extraShard = {
      ...shard,
      definition: {
        ...definition,
        id: extraId,
        key: encodeSemanticKey(extraId),
      },
    };
    expect(() =>
      validateDefinitionShards(
        bundle,
        new Map([
          ...validShards,
          [
            "extra",
            {
              buffer: Buffer.from(stableJson(extraShard)),
              shard: extraShard,
            },
          ],
        ])
      )
    ).toThrow("not indexed");
  });
});
