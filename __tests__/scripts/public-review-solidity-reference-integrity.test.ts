import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  BUNDLE_SCHEMA_VERSION,
  DEFINITION_SHARD_SCHEMA_VERSION,
  GENERATOR_NAME,
  GENERATOR_VERSION,
  INDEX_SCHEMA_VERSION,
  bundleOutputSha256,
  compareReviewVersions,
  createIndexEntry,
  encodeSemanticKey,
  sha256Urn,
  stableJson,
  validateDefinitionShards,
} = require("../../scripts/public-reviews/solidity-reference-lib.cjs") as {
  BUNDLE_SCHEMA_VERSION: string;
  DEFINITION_SHARD_SCHEMA_VERSION: string;
  GENERATOR_NAME: string;
  GENERATOR_VERSION: string;
  INDEX_SCHEMA_VERSION: string;
  bundleOutputSha256: (bundle: Record<string, unknown>) => string;
  compareReviewVersions: (left: string, right: string) => number;
  createIndexEntry: (
    bundle: {
      reviewVersion: string;
      source: { commit: string; tree: string };
      generator: { outputSha256: string };
    },
    bundlePublicPath: string
  ) => Record<string, unknown>;
  encodeSemanticKey: (value: string) => string;
  sha256Urn: (value: Buffer) => string;
  stableJson: (value: unknown) => string;
  validateDefinitionShards: (
    bundle: unknown,
    shards: Map<string, { buffer: Buffer; shard: unknown }>
  ) => void;
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  acquireGenerationLock,
  check,
  commitTimestampFromUnixSeconds,
  configSha256,
  discoveredSnapshotVersions,
  generatorSourceSha256,
  loadPinnedInputs,
  resolveContainedPath,
  validateRetainedVersionRegistry,
} = require("../../scripts/public-reviews/solidity-reference.cjs") as {
  acquireGenerationLock: (lockPath: string) => () => void;
  check: (
    configRecord: { json: Record<string, unknown>; text: string },
    dependencies?: Record<string, unknown>
  ) => void;
  commitTimestampFromUnixSeconds: (value: string) => string;
  configSha256: (configText: string) => string;
  discoveredSnapshotVersions: (
    config: { output: { directory: string } },
    dependencies?: { repositoryPath: (relativePath: string) => string }
  ) => string[];
  generatorSourceSha256: () => string;
  loadPinnedInputs: (
    sourceRepo: string,
    config: {
      source: {
        commit: string;
        tree: string;
        roots: Array<{ path: string }>;
      };
      releaseArtifacts: Array<{ path: string }>;
    }
  ) => {
    sourceBuffers: Map<string, Buffer>;
    artifacts: Record<
      string,
      { buffer: Buffer; json: unknown; sha256: string }
    >;
    commitTimestamp: string;
  };
  resolveContainedPath: (root: string, relativePath: string) => string;
  validateRetainedVersionRegistry: (
    retainedVersions: string[],
    indexVersions: string[],
    discoveredVersions: string[]
  ) => void;
};

function git(repo: string, ...args: string[]): string {
  return execFileSync("git", ["-C", repo, ...args], {
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

function historicalShardFixture(reviewVersion: string) {
  const id = "smart-contracts/Stream.sol:Stream";
  const key = encodeSemanticKey(id);
  const definition = {
    id,
    key,
    sourcePath: "smart-contracts/Stream.sol",
    scope: "protocol",
    declarations: {
      functions: [],
      events: [],
      errors: [],
      modifiers: [],
      structs: [],
      enums: [],
      stateVariables: [],
      userDefinedValueTypes: [],
    },
    abiSurface: {
      functions: [],
      events: [],
      errors: [],
    },
  };
  const shard = {
    shardSchemaVersion: DEFINITION_SHARD_SCHEMA_VERSION,
    reviewId: "6529-stream",
    reviewVersion,
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
    reviewId: "6529-stream",
    reviewVersion,
    summary: { warningCount: 0 },
    declarationIndex: [],
    files: [
      {
        path: definition.sourcePath,
        publicPath: `/review-data/6529-stream/versions/${reviewVersion}/sources/smart-contracts/Stream.sol`,
        scope: definition.scope,
        topLevelDeclarations: [],
      },
    ],
    definitionIndex: [
      {
        id,
        key,
        sourcePath: definition.sourcePath,
        scope: definition.scope,
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
    warningSummary: shard.warningSummary,
  };
  return { bundle, buffer, key, shard };
}

describe("Solidity public-review generator trust boundaries", () => {
  it("normalizes Git commit seconds to one cross-platform UTC spelling", () => {
    expect(commitTimestampFromUnixSeconds("0")).toBe("1970-01-01T00:00:00Z");
    expect(commitTimestampFromUnixSeconds("1785081895")).toBe(
      "2026-07-26T16:04:55Z"
    );
    expect(commitTimestampFromUnixSeconds("8640000000000")).toBe(
      "+275760-09-13T00:00:00Z"
    );
    for (const invalid of ["", "01", "-1", "+1", "1.5", "1e3"]) {
      expect(() => commitTimestampFromUnixSeconds(invalid)).toThrow(
        "Git commit timestamp must be Unix seconds"
      );
    }
    expect(() => commitTimestampFromUnixSeconds("9007199254741")).toThrow(
      "Git commit timestamp is outside the supported range"
    );
    expect(() => commitTimestampFromUnixSeconds("8640000000001")).toThrow(
      "Git commit timestamp is outside the supported date range"
    );
  });

  let fixtureRoot: string;

  beforeEach(() => {
    fixtureRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "public-review-integrity-")
    );
  });

  afterEach(() => {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  });

  it("orders review versions by numeric segments rather than lexical text", () => {
    expect(
      ["2026-07-26.10", "2026-07-26.2", "2026-07-25.12", "2026-07-26.1"].sort(
        compareReviewVersions
      )
    ).toEqual([
      "2026-07-25.12",
      "2026-07-26.1",
      "2026-07-26.2",
      "2026-07-26.10",
    ]);
    expect(["v10", "v2", "v1"].sort(compareReviewVersions)).toEqual([
      "v1",
      "v2",
      "v10",
    ]);
  });

  it("requires the retained registry, index, and discovered version roots to agree", () => {
    const retained = ["2026-07-26.1", "2026-07-26.2"];

    expect(() =>
      validateRetainedVersionRegistry(
        retained,
        ["2026-07-26.2", "2026-07-26.1"],
        ["2026-07-26.1", "2026-07-26.2"]
      )
    ).not.toThrow();

    expect(() =>
      validateRetainedVersionRegistry(retained, ["2026-07-26.2"], retained)
    ).toThrow();
    expect(() =>
      validateRetainedVersionRegistry(retained, retained, ["2026-07-26.2"])
    ).toThrow();
    expect(() =>
      validateRetainedVersionRegistry(retained, retained, [
        ...retained,
        "2026-07-26.3",
      ])
    ).toThrow();
    expect(() =>
      validateRetainedVersionRegistry(
        [...retained, "2026-07-26.2"],
        retained,
        retained
      )
    ).toThrow();
  });

  it("checks historical v2/gen1 shards alongside an active v3/gen2 bundle", () => {
    const reviewId = "stream-history";
    const historicalVersion = "2026-07-25.1";
    const activeVersion = "2026-07-26.1";
    const commit = "e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8";
    const tree = "3a8e3cb8102e891a73972282026d2811e7591852";
    const config = {
      schemaVersion: "public-review.solidity-source.v1",
      reviewId,
      reviewVersion: activeVersion,
      source: {
        repository: "6529-Collections/6529Stream",
        commit,
        tree,
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
        directory: `public/review-data/${reviewId}/versions/${activeVersion}`,
        retainedVersions: [historicalVersion, activeVersion],
        bundleFile: "reference-manifest.json",
        definitionsDirectory: "definitions",
        sourcesDirectory: "sources",
        indexFile: `public/review-data/${reviewId}/index.json`,
      },
    };
    const configText = `${JSON.stringify(config, null, 2)}\n`;

    const definitionId = "smart-contracts/Legacy.sol:Legacy";
    const definitionKey = encodeSemanticKey(definitionId);
    const definition = {
      id: definitionId,
      key: definitionKey,
      name: "Legacy",
      sourcePath: "smart-contracts/Legacy.sol",
      scope: "protocol",
      kind: "contract",
      classification: "production_release_contract",
      declarations: { functions: [], events: [], errors: [] },
      abiSurface: { functions: [], events: [], errors: [] },
    };
    const warningSummary = { totalCount: 0, byCategory: {}, byCode: {} };
    const historicalShard = {
      shardSchemaVersion: "public-review.solidity-definition-shard.v1",
      reviewId,
      reviewVersion: historicalVersion,
      definition,
      warnings: [],
      warningSummary,
    };
    const historicalShardBuffer = Buffer.from(stableJson(historicalShard));
    const historicalBundle = {
      bundleSchemaVersion: "public-review.solidity-reference.v2",
      reviewId,
      reviewVersion: historicalVersion,
      source: { commit, tree },
      generator: {
        name: GENERATOR_NAME,
        version: "1",
        outputSha256: "",
      },
      summary: {
        fileCount: 0,
        definitionCount: 1,
        warningCount: 0,
      },
      definitionIndex: [
        {
          id: definitionId,
          key: definitionKey,
          name: definition.name,
          sourcePath: definition.sourcePath,
          scope: definition.scope,
          kind: definition.kind,
          classification: definition.classification,
          shardPath: `/review-data/${reviewId}/versions/${historicalVersion}/definitions/${definitionKey}.json`,
          shardSha256: sha256Urn(historicalShardBuffer),
          warningSummary,
        },
      ],
      files: [],
      warningSummary,
    };
    historicalBundle.generator.outputSha256 =
      bundleOutputSha256(historicalBundle);

    const activeBundle = {
      bundleSchemaVersion: BUNDLE_SCHEMA_VERSION,
      reviewId,
      reviewVersion: activeVersion,
      source: {
        repository: config.source.repository,
        commit,
        tree,
        sourceChecksums: {},
      },
      generator: {
        name: GENERATOR_NAME,
        version: GENERATOR_VERSION,
        configSha256: configSha256(configText),
        sourceSha256: generatorSourceSha256(),
        outputSha256: "",
      },
      summary: {
        fileCount: 0,
        topLevelDeclarationCount: 0,
        declarationCount: 0,
        definitionCount: 0,
        contractCount: 0,
        interfaceCount: 0,
        libraryCount: 0,
        classifications: {},
        warningCount: 0,
      },
      declarationIndex: [],
      definitionIndex: [],
      files: [],
      warningSummary,
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
    activeBundle.generator.outputSha256 = bundleOutputSha256(activeBundle);

    const bundles = new Map([
      [historicalVersion, historicalBundle],
      [activeVersion, activeBundle],
    ]);
    const index = {
      schemaVersion: INDEX_SCHEMA_VERSION,
      reviewId,
      activeVersion,
      versions: [
        createIndexEntry(
          historicalBundle,
          `/review-data/${reviewId}/versions/${historicalVersion}/reference-manifest.json`
        ),
        createIndexEntry(
          activeBundle,
          `/review-data/${reviewId}/versions/${activeVersion}/reference-manifest.json`
        ),
      ],
    };

    expect(() =>
      check(
        { json: config, text: configText },
        {
          readIndex: () => index,
          readBundle: (_versionConfig: unknown, entry: { version: string }) =>
            bundles.get(entry.version),
          validateDefinitionShards: (
            _versionConfig: unknown,
            bundle: { reviewVersion: string }
          ) =>
            validateDefinitionShards(
              bundle,
              bundle.reviewVersion === historicalVersion
                ? new Map([
                    [
                      definitionKey,
                      {
                        buffer: historicalShardBuffer,
                        shard: historicalShard,
                      },
                    ],
                  ])
                : new Map()
            ),
          validateSources: () => undefined,
          validateSnapshotFileSet: () => undefined,
          writeOutput: () => undefined,
        }
      )
    ).not.toThrow();
  });

  it("rejects checksum tampering in a retained historical definition shard", () => {
    const historical = historicalShardFixture("2026-07-26.1");
    const current = historicalShardFixture("2026-07-26.2");

    validateRetainedVersionRegistry(
      ["2026-07-26.1", "2026-07-26.2"],
      ["2026-07-26.1", "2026-07-26.2"],
      ["2026-07-26.1", "2026-07-26.2"]
    );
    expect(() =>
      validateDefinitionShards(
        historical.bundle,
        new Map([
          [
            historical.key,
            { buffer: historical.buffer, shard: historical.shard },
          ],
        ])
      )
    ).not.toThrow();
    expect(() =>
      validateDefinitionShards(
        current.bundle,
        new Map([
          [current.key, { buffer: current.buffer, shard: current.shard }],
        ])
      )
    ).not.toThrow();

    const tampered = Buffer.from(historical.buffer);
    tampered[tampered.length - 2] = tampered[tampered.length - 2]! ^ 1;
    expect(() =>
      validateDefinitionShards(
        historical.bundle,
        new Map([
          [historical.key, { buffer: tampered, shard: historical.shard }],
        ])
      )
    ).toThrow("checksum drifted");
  });

  it("rejects lexical and symlink escapes from a trusted output root", () => {
    const outputRoot = path.join(fixtureRoot, "output");
    const outsideRoot = path.join(fixtureRoot, "outside");
    const versionRoot = path.join(outputRoot, "versions", "v1");
    fs.mkdirSync(versionRoot, { recursive: true });
    fs.mkdirSync(outsideRoot);

    expect(
      resolveContainedPath(outputRoot, "versions/v1/reference-manifest.json")
    ).toBe(path.join(versionRoot, "reference-manifest.json"));
    expect(() =>
      resolveContainedPath(outputRoot, "../outside/secret.json")
    ).toThrow();

    const linkedDirectory = path.join(outputRoot, "versions", "linked");
    fs.symlinkSync(
      outsideRoot,
      linkedDirectory,
      process.platform === "win32" ? "junction" : "dir"
    );
    expect(() =>
      resolveContainedPath(outputRoot, "versions/linked/secret.json")
    ).toThrow();
  });

  it("uses an exclusive generation lock and releases it for the next process", () => {
    const lockPath = path.join(fixtureRoot, "reference-generator.lock");
    const release = acquireGenerationLock(lockPath);
    expect(fs.existsSync(lockPath)).toBe(true);
    expect(() => acquireGenerationLock(lockPath)).toThrow(
      "Another public-review generation owns the lock"
    );

    release();
    expect(fs.existsSync(lockPath)).toBe(false);

    const releaseAgain = acquireGenerationLock(lockPath);
    expect(fs.existsSync(lockPath)).toBe(true);
    releaseAgain();
    expect(fs.existsSync(lockPath)).toBe(false);
  });

  it("removes a newly created lock when lock initialization fails", () => {
    const lockPath = path.join(fixtureRoot, "failed-generator.lock");
    const writeFailure = Object.assign(new Error("disk full"), {
      code: "ENOSPC",
    });
    const writeSpy = jest
      .spyOn(fs, "writeFileSync")
      .mockImplementationOnce(() => {
        throw writeFailure;
      });

    try {
      expect(() => acquireGenerationLock(lockPath)).toThrow(
        "Unable to acquire the public-review generation lock"
      );
      expect(fs.existsSync(lockPath)).toBe(false);
    } finally {
      writeSpy.mockRestore();
    }
  });

  it("ignores orphaned staging directories when discovering review history", () => {
    const versionsRoot = path.join(fixtureRoot, "versions");
    fs.mkdirSync(path.join(versionsRoot, "2026-07-26.1"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(versionsRoot, ".stage-2026-07-26.2-orphan"), {
      recursive: true,
    });
    fs.writeFileSync(path.join(versionsRoot, "README.txt"), "not a snapshot");

    expect(
      discoveredSnapshotVersions(
        {
          output: {
            directory:
              "public/review-data/6529-stream/versions/2026-07-26.2",
          },
        },
        { repositoryPath: () => versionsRoot }
      )
    ).toEqual(["2026-07-26.1"]);
  });

  it("reads exact pinned commit objects and ignores dirty worktree state", () => {
    git(fixtureRoot, "init", "--quiet");
    git(fixtureRoot, "config", "user.name", "Public Review Test");
    git(
      fixtureRoot,
      "config",
      "user.email",
      "public-review-test@example.invalid"
    );
    git(fixtureRoot, "config", "core.autocrlf", "false");

    const sourceDirectory = path.join(fixtureRoot, "smart-contracts");
    fs.mkdirSync(sourceDirectory);
    const sourcePath = path.join(sourceDirectory, "Stream.sol");
    const committedSource =
      "// SPDX-License-Identifier: MIT\npragma solidity 0.8.19;\ncontract Stream {}\n";
    fs.writeFileSync(sourcePath, committedSource);
    const artifactDirectory = path.join(fixtureRoot, "release-artifacts");
    fs.mkdirSync(artifactDirectory);
    const artifactPath = path.join(artifactDirectory, "catalog.json");
    const committedArtifact = '{"contracts":["Stream"]}\n';
    fs.writeFileSync(artifactPath, committedArtifact);
    git(
      fixtureRoot,
      "add",
      "smart-contracts/Stream.sol",
      "release-artifacts/catalog.json"
    );
    git(fixtureRoot, "commit", "--quiet", "-m", "pinned source");

    const commit = git(fixtureRoot, "rev-parse", "HEAD");
    const tree = git(fixtureRoot, "rev-parse", "HEAD^{tree}");

    fs.writeFileSync(
      sourcePath,
      "// dirty worktree content must never be reviewed\n"
    );
    fs.writeFileSync(
      path.join(sourceDirectory, "Untracked.sol"),
      "contract Untracked {}\n"
    );
    fs.writeFileSync(artifactPath, '{"contracts":["Dirty"]}\n');

    const loaded = loadPinnedInputs(fixtureRoot, {
      source: {
        commit,
        tree,
        roots: [{ path: "smart-contracts" }],
      },
      releaseArtifacts: [{ path: "release-artifacts/catalog.json" }],
    });

    expect([...loaded.sourceBuffers.keys()]).toEqual([
      "smart-contracts/Stream.sol",
    ]);
    expect(
      loaded.sourceBuffers.get("smart-contracts/Stream.sol")?.toString("utf8")
    ).toBe(committedSource);
    expect(
      loaded.artifacts["release-artifacts/catalog.json"]?.buffer.toString(
        "utf8"
      )
    ).toBe(committedArtifact);
    expect(loaded.artifacts["release-artifacts/catalog.json"]?.json).toEqual({
      contracts: ["Stream"],
    });
    expect(loaded.commitTimestamp).toBe(
      commitTimestampFromUnixSeconds(
        git(fixtureRoot, "show", "-s", "--format=%ct", commit)
      )
    );

    expect(() =>
      loadPinnedInputs(fixtureRoot, {
        source: {
          commit,
          tree: "0".repeat(40),
          roots: [{ path: "smart-contracts" }],
        },
        releaseArtifacts: [{ path: "release-artifacts/catalog.json" }],
      })
    ).toThrow(`Pinned tree resolved to ${tree}`);
  });
});
