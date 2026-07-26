import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  DEFINITION_SHARD_SCHEMA_VERSION,
  compareReviewVersions,
  encodeSemanticKey,
  sha256Urn,
  stableJson,
  validateDefinitionShards,
} = require("../../scripts/public-reviews/solidity-reference-lib.cjs") as {
  DEFINITION_SHARD_SCHEMA_VERSION: string;
  compareReviewVersions: (left: string, right: string) => number;
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
  loadPinnedInputs,
  resolveContainedPath,
  validateRetainedVersionRegistry,
} = require("../../scripts/public-reviews/solidity-reference.cjs") as {
  acquireGenerationLock: (lockPath: string) => () => void;
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
    expect(() => acquireGenerationLock(lockPath)).toThrow();

    release();
    expect(fs.existsSync(lockPath)).toBe(false);

    const releaseAgain = acquireGenerationLock(lockPath);
    expect(fs.existsSync(lockPath)).toBe(true);
    releaseAgain();
    expect(fs.existsSync(lockPath)).toBe(false);
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
    expect(loaded.commitTimestamp).not.toBe("");

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
