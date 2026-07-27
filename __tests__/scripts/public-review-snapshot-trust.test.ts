import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type Config = {
  reviewVersion: string;
  source: {
    commit: string;
    tree: string;
    roots: Array<{ path: string }>;
    [key: string]: unknown;
  };
  output: {
    directory: string;
    retainedVersions: string[];
    [key: string]: unknown;
  };
  releaseArtifacts: Array<{ path: string }>;
  [key: string]: unknown;
};

type GitEntry = {
  mode: string;
  type: string;
  oid: string;
  path: string;
};

type BlobRecord = GitEntry & { buffer: Buffer };

type Run = (
  command: string,
  args: string[],
  options?: Record<string, unknown>
) => Buffer;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  CONFIG_PATH,
  GIT_REGULAR_MODE,
  REVIEW_ROOT,
  SOLC_SHA256,
  compareCandidateToRegeneration,
  decodeUtf8,
  fetchAndBindCandidate,
  filesystemBlobMap,
  immutableConfigProjection,
  parseArgs,
  parseLsTree,
  parseNameStatus,
  readGitBlob,
  sha256,
  snapshotChangePolicy,
  validateIdentifiers,
  validateSolcDigest,
  validateTrustedConfigPolicy,
  verifyOfficialStreamInputs,
  verifySnapshotPr,
} = require("../../scripts/public-reviews/verify-snapshot-pr.cjs") as {
  CONFIG_PATH: string;
  GIT_REGULAR_MODE: string;
  REVIEW_ROOT: string;
  SOLC_SHA256: string;
  compareCandidateToRegeneration: (
    candidate: Map<string, BlobRecord>,
    regenerated: Map<string, Buffer>
  ) => void;
  decodeUtf8: (buffer: Buffer, label: string) => string;
  fetchAndBindCandidate: (
    context: {
      prNumber: string;
      headSha: string;
      baseSha: string;
      repositoryRoot: string;
    },
    dependencies: { run: Run }
  ) => {
    touchesSnapshot: boolean;
    mergeBase: string;
    changes: Array<{ status: string; paths: string[] }>;
  };
  filesystemBlobMap: (
    repositoryRoot: string,
    relativeRoot: string
  ) => Map<string, Buffer>;
  immutableConfigProjection: (config: Config) => Config;
  parseArgs: (argv: string[]) => {
    prNumber: string;
    headSha: string;
    baseSha: string;
  };
  parseLsTree: (buffer: Buffer) => Map<string, GitEntry>;
  parseNameStatus: (
    buffer: Buffer
  ) => Array<{ status: string; paths: string[] }>;
  readGitBlob: (
    repositoryRoot: string,
    entry: GitEntry,
    run?: Run
  ) => Buffer;
  sha256: (buffer: Buffer) => string;
  snapshotChangePolicy: (
    entries: Array<{ status: string; paths: string[] }>
  ) => { touchesSnapshot: boolean };
  validateIdentifiers: (identifiers: {
    prNumber: string;
    headSha: string;
    baseSha: string;
  }) => void;
  validateSolcDigest: (buffer: Buffer, expectedDigest?: string) => void;
  validateTrustedConfigPolicy: (
    base: Config,
    candidate: Config,
    versions: string[] | null
  ) => void;
  verifyOfficialStreamInputs: (
    repository: string,
    base: Config,
    candidate: Config,
    dependencies: {
      run: Run;
      status: (
        command: string,
        args: string[]
      ) => { status: number; stderr: string };
    }
  ) => void;
  verifySnapshotPr: (
    context: {
      prNumber: string;
      headSha: string;
      baseSha: string;
      repositoryRoot: string;
    },
    dependencies: {
      run: Run;
      status: (
        command: string,
        args: string[]
      ) => { status: number; stderr: string };
      initializeStreamRepository: (tempRoot: string) => string;
      installSolc: (tempRoot: string) => Promise<string>;
    }
  ) => Promise<{
    skipped: boolean;
    blobCount?: number;
    headSha: string;
    baseSha: string;
  }>;
};

const shaA = "a".repeat(40);
const shaB = "b".repeat(40);
const shaC = "c".repeat(40);

function loadConfig(): Config {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), CONFIG_PATH), "utf8")
  ) as Config;
}

function loadInitialConfig(): Config {
  const config = loadConfig();
  config.output.retainedVersions = [config.reviewVersion];
  return config;
}

function cloneConfig(config: Config): Config {
  return JSON.parse(JSON.stringify(config)) as Config;
}

function treeRecord(
  candidatePath: string,
  mode = GIT_REGULAR_MODE,
  type = "blob",
  oid = shaA
): string {
  return `${mode} ${type} ${oid}\t${candidatePath}\0`;
}

describe("public-review snapshot trust argument and Git parsing", () => {
  it("accepts each required identifier exactly once", () => {
    expect(
      parseArgs([
        "--head-sha",
        shaA,
        "--pr-number",
        "3467",
        "--base-sha",
        shaB,
      ])
    ).toEqual({
      prNumber: "3467",
      headSha: shaA,
      baseSha: shaB,
    });
    expect(() =>
      parseArgs([
        "--head-sha",
        shaA,
        "--head-sha",
        shaB,
        "--base-sha",
        shaC,
      ])
    ).toThrow("Duplicate verifier argument");
  });

  it("rejects ambiguous event identifiers", () => {
    expect(() =>
      validateIdentifiers({
        prNumber: "01",
        headSha: shaA,
        baseSha: shaB,
      })
    ).toThrow("PR number must be decimal");
    expect(() =>
      validateIdentifiers({
        prNumber: "1",
        headSha: shaA.toUpperCase(),
        baseSha: shaB,
      })
    ).toThrow("lowercase full SHA");
    expect(() =>
      validateIdentifiers({
        prNumber: "1",
        headSha: shaA,
        baseSha: shaA,
      })
    ).toThrow("must differ");
  });

  it("parses NUL-delimited status records without path ambiguity", () => {
    expect(
      parseNameStatus(
        Buffer.from(
          [
            "M",
            CONFIG_PATH,
            "A",
            `${REVIEW_ROOT}/index.json`,
            "R100",
            `${REVIEW_ROOT}/old.json`,
            `${REVIEW_ROOT}/new.json`,
            "",
          ].join("\0")
        )
      )
    ).toEqual([
      { status: "M", paths: [CONFIG_PATH] },
      { status: "A", paths: [`${REVIEW_ROOT}/index.json`] },
      {
        status: "R100",
        paths: [
          `${REVIEW_ROOT}/old.json`,
          `${REVIEW_ROOT}/new.json`,
        ],
      },
    ]);
    expect(() =>
      parseNameStatus(Buffer.from(`A\0../escape.json\0`))
    ).toThrow("Unsafe candidate path");
    expect(() => parseNameStatus(Buffer.from(`A10\0${CONFIG_PATH}\0`))).toThrow(
      "Invalid Git status"
    );
    expect(() =>
      parseNameStatus(Buffer.from(`A\0${CONFIG_PATH}`))
    ).toThrow("not NUL-terminated");
    expect(() =>
      parseNameStatus(Buffer.from(`A\0${CONFIG_PATH}\0\0`))
    ).toThrow("empty record");
    expect(() =>
      parseNameStatus(Buffer.from(`A\0${REVIEW_ROOT}/bad\tname.json\0`))
    ).toThrow("Unsafe candidate path");
  });

  it("parses large Git trees while rejecting malformed object identities", () => {
    const records = Array.from({ length: 350 }, (_, index) =>
      treeRecord(`${REVIEW_ROOT}/definitions/${index}.json`)
    ).join("");
    expect(parseLsTree(Buffer.from(records)).size).toBe(350);
    expect(() =>
      parseLsTree(
        Buffer.from(
          treeRecord(
            `${REVIEW_ROOT}/index.json`,
            GIT_REGULAR_MODE,
            "blob",
            "d".repeat(41)
          )
        )
      )
    ).toThrow("Invalid Git object");
    expect(() =>
      parseLsTree(
        Buffer.from(
          [
            treeRecord(`${REVIEW_ROOT}/index.json`),
            treeRecord(`${REVIEW_ROOT}/index.json`),
          ].join("")
        )
      )
    ).toThrow("Duplicate Git path");
    expect(() =>
      parseLsTree(
        Buffer.from(treeRecord(`${REVIEW_ROOT}/index.json`).slice(0, -1))
      )
    ).toThrow("not NUL-terminated");
  });

  it("reads only regular non-executable, non-LFS blobs", () => {
    const regular: GitEntry = {
      mode: GIT_REGULAR_MODE,
      type: "blob",
      oid: shaA,
      path: `${REVIEW_ROOT}/index.json`,
    };
    expect(
      readGitBlob("", regular, () => Buffer.from('{"ok":true}\n'))
    ).toEqual(Buffer.from('{"ok":true}\n'));
    expect(() =>
      readGitBlob("", { ...regular, mode: "100755" }, () => Buffer.from("x"))
    ).toThrow("non-executable regular Git blob");
    expect(() =>
      readGitBlob("", { ...regular, mode: "120000" }, () => Buffer.from("x"))
    ).toThrow("non-executable regular Git blob");
    expect(() =>
      readGitBlob(
        "",
        { ...regular, mode: "160000", type: "commit" },
        () => Buffer.from("x")
      )
    ).toThrow("non-executable regular Git blob");
    expect(() =>
      readGitBlob("", regular, () =>
        Buffer.from("version https://git-lfs.github.com/spec/v1\n")
      )
    ).toThrow("Git LFS pointer");
  });

  it("rejects invalid UTF-8 instead of silently replacing bytes", () => {
    expect(() => decodeUtf8(Buffer.from([0xc3, 0x28]), "fixture")).toThrow(
      "not valid UTF-8"
    );
  });
});

describe("public-review snapshot trust change policy", () => {
  it("quick-passes unrelated pull requests", () => {
    expect(
      snapshotChangePolicy([{ status: "M", paths: ["components/Card.tsx"] }])
    ).toEqual({ touchesSnapshot: false });
  });

  it("allows only config and review data, with no rename or config delete", () => {
    expect(
      snapshotChangePolicy([
        { status: "M", paths: [CONFIG_PATH] },
        { status: "A", paths: [`${REVIEW_ROOT}/index.json`] },
      ])
    ).toEqual({ touchesSnapshot: true });
    expect(() =>
      snapshotChangePolicy([
        { status: "M", paths: [CONFIG_PATH] },
        { status: "M", paths: ["scripts/forged-generator.cjs"] },
      ])
    ).toThrow("may change only");
    expect(() =>
      snapshotChangePolicy([
        {
          status: "R100",
          paths: [
            `${REVIEW_ROOT}/old.json`,
            `${REVIEW_ROOT}/new.json`,
          ],
        },
      ])
    ).toThrow("renamed or copied");
    expect(() =>
      snapshotChangePolicy([{ status: "D", paths: [CONFIG_PATH] }])
    ).toThrow("never deleted");
  });

  it.each([
    ".gitattributes",
    ".github/workflows/public-review-snapshot-trust.yml",
    "ops/scripts/testing-strategy.cjs",
    "scripts/public-reviews/solidity-reference-lib.cjs",
    "scripts/public-reviews/solidity-reference.cjs",
    "scripts/public-reviews/verify-snapshot-pr.cjs",
  ])("fails closed for protected trust-root path %s", (protectedPath) => {
    expect(() =>
      snapshotChangePolicy([{ status: "M", paths: [protectedPath] }])
    ).toThrow("require explicit maintainer bypass");
  });

  it("binds fetch output to the exact event head and exact event base", () => {
    const responses = new Map<string, Buffer>([
      ["rev-parse HEAD^{commit}", Buffer.from(shaB)],
      ["status --porcelain=v1 --untracked-files=no", Buffer.alloc(0)],
      [
        `rev-parse refs/codex-public-review/pr-7-${shaA}^{commit}`,
        Buffer.from(shaA),
      ],
      [
        `rev-parse refs/codex-public-review/base-7-${shaB}^{commit}`,
        Buffer.from(shaB),
      ],
      [`rev-parse ${shaB}^{commit}`, Buffer.from(shaB)],
      [`merge-base ${shaB} ${shaA}`, Buffer.from(shaB)],
      [
        `diff --name-status -z --find-renames ${shaB} ${shaA}`,
        Buffer.from(`M\0${CONFIG_PATH}\0A\0${REVIEW_ROOT}/index.json\0`),
      ],
    ]);
    const run: Run = (_command, args) => {
      if (args.includes("fetch")) {
        return Buffer.alloc(0);
      }
      const key = args.slice(2).join(" ");
      const response = responses.get(key);
      if (!response) {
        throw new Error(`Unexpected Git call: ${key}`);
      }
      return response;
    };

    expect(
      fetchAndBindCandidate(
        {
          prNumber: "7",
          headSha: shaA,
          baseSha: shaB,
          repositoryRoot: "/repo",
        },
        { run }
      )
    ).toMatchObject({
      touchesSnapshot: true,
      mergeBase: shaB,
    });

    responses.set(
      `rev-parse refs/codex-public-review/pr-7-${shaA}^{commit}`,
      Buffer.from(shaC)
    );
    expect(() =>
      fetchAndBindCandidate(
        {
          prNumber: "7",
          headSha: shaA,
          baseSha: shaB,
          repositoryRoot: "/repo",
        },
        { run }
      )
    ).toThrow("PR head advanced");
  });

  it("rejects a relevant head that is not rebased onto the event base", () => {
    const run: Run = (_command, args) => {
      if (args.includes("fetch")) {
        return Buffer.alloc(0);
      }
      const operation = args[2];
      if (operation === "status") {
        return Buffer.alloc(0);
      }
      if (operation === "rev-parse") {
        if (args[3] === "HEAD^{commit}") {
          return Buffer.from(shaB);
        }
        if (args[3]!.startsWith("refs/codex-public-review/base-")) {
          return Buffer.from(shaB);
        }
        return Buffer.from(
          args[3]!.startsWith("refs/codex-public-review/pr-") ? shaA : shaB
        );
      }
      if (operation === "merge-base") {
        return Buffer.from(shaC);
      }
      if (operation === "diff") {
        return Buffer.from(`M\0${CONFIG_PATH}\0`);
      }
      throw new Error(`Unexpected Git call: ${args.join(" ")}`);
    };
    expect(() =>
      fetchAndBindCandidate(
        {
          prNumber: "7",
          headSha: shaA,
          baseSha: shaB,
          repositoryRoot: "/repo",
        },
        { run }
      )
    ).toThrow("rebased onto the exact event base");
  });
});

describe("public-review snapshot trust immutable history", () => {
  it("permits only the initial pin fields on an initial snapshot", () => {
    const base = loadInitialConfig();
    const candidate = cloneConfig(base);
    candidate.source.commit = shaA;
    candidate.source.tree = shaB;

    expect(() =>
      validateTrustedConfigPolicy(base, candidate, null)
    ).not.toThrow();
    expect(immutableConfigProjection(candidate)).toEqual(
      immutableConfigProjection(base)
    );

    candidate.source["evmVersion"] = "cancun";
    expect(() => validateTrustedConfigPolicy(base, candidate, null)).toThrow(
      "immutable trusted policy"
    );
  });

  it("requires a future version to append exact immutable history", () => {
    const base = loadConfig();
    const candidate = cloneConfig(base);
    candidate.reviewVersion = "2026-07-27.2";
    candidate.source.commit = shaA;
    candidate.source.tree = shaB;
    candidate.output.directory =
      "public/review-data/6529-stream/versions/2026-07-27.2";
    candidate.output.retainedVersions = [
      "2026-07-26.1",
      "2026-07-27.1",
      "2026-07-27.2",
    ];

    expect(() =>
      validateTrustedConfigPolicy(base, candidate, [
        "2026-07-26.1",
        "2026-07-27.1",
      ])
    ).not.toThrow();
    candidate.output.retainedVersions = ["2026-07-27.2"];
    expect(() =>
      validateTrustedConfigPolicy(base, candidate, [
        "2026-07-26.1",
        "2026-07-27.1",
      ])
    ).toThrow("append to exact base history");
    candidate.reviewVersion = "2026-07-27.1";
    candidate.output.directory =
      "public/review-data/6529-stream/versions/2026-07-27.1";
    candidate.output.retainedVersions = ["2026-07-26.1", "2026-07-27.1"];
    expect(() =>
      validateTrustedConfigPolicy(base, candidate, [
        "2026-07-26.1",
        "2026-07-27.1",
      ])
    ).toThrow("strictly greater");
  });
});

describe("public-review snapshot trust independent inputs and output", () => {
  function streamTree(config: Config, extra = ""): Buffer {
    return Buffer.from(
      [
        ...config.source.roots.map((root) =>
          treeRecord(`${root.path}/Fixture.sol`)
        ),
        ...config.releaseArtifacts.map((artifact) =>
          treeRecord(artifact.path)
        ),
        extra,
      ].join("")
    );
  }

  function streamRun(config: Config, extra = ""): Run {
    return (_command, args) => {
      const operation = args[2];
      if (operation === "rev-parse") {
        return Buffer.from(
          args[3]!.endsWith("^{tree}")
            ? config.source.tree
            : config.source.commit
        );
      }
      if (operation === "ls-tree") {
        return streamTree(config, extra);
      }
      if (operation === "cat-file") {
        return Buffer.from("trusted content\n");
      }
      throw new Error(`Unexpected Git call: ${args.join(" ")}`);
    };
  }

  const successfulStatus = () => ({ status: 0, stderr: "" });

  it("accepts an exact accepted-main Stream tree and release artifacts", () => {
    const base = loadConfig();
    const candidate = cloneConfig(base);
    expect(() =>
      verifyOfficialStreamInputs("/stream.git", base, candidate, {
        run: streamRun(candidate),
        status: successfulStatus,
      })
    ).not.toThrow();
  });

  it("rejects Solidity outside the configured authoritative roots", () => {
    const base = loadConfig();
    const candidate = cloneConfig(base);
    expect(() =>
      verifyOfficialStreamInputs("/stream.git", base, candidate, {
        run: streamRun(candidate, treeRecord("hidden/Backdoor.sol")),
        status: successfulStatus,
      })
    ).toThrow("outside the authoritative roots");
  });

  it("rejects a missing or non-regular release artifact", () => {
    const base = loadConfig();
    const candidate = cloneConfig(base);
    const firstArtifact = candidate.releaseArtifacts[0]!.path;
    const run = streamRun(candidate);
    const tamperedRun: Run = (command, args, options) => {
      const output = run(command, args, options);
      if (args[2] !== "ls-tree") {
        return output;
      }
      return Buffer.from(
        output
          .toString("utf8")
          .replace(
            treeRecord(firstArtifact),
            treeRecord(firstArtifact, "100755")
          )
      );
    };
    expect(() =>
      verifyOfficialStreamInputs("/stream.git", base, candidate, {
        run: tamperedRun,
        status: successfulStatus,
      })
    ).toThrow("regular release-artifact blob");
  });

  it("rejects a Stream pin that is not on accepted main or rolls back", () => {
    const base = loadConfig();
    const candidate = cloneConfig(base);
    let call = 0;
    const failingStatus = () => ({
      status: call++ === 0 ? 1 : 0,
      stderr: "not an ancestor",
    });
    expect(() =>
      verifyOfficialStreamInputs("/stream.git", base, candidate, {
        run: streamRun(candidate),
        status: failingStatus,
      })
    ).toThrow("main-ancestry check");
  });

  it("compares the complete file set and every byte", () => {
    const candidate = new Map<string, BlobRecord>([
      [
        `${REVIEW_ROOT}/index.json`,
        {
          mode: GIT_REGULAR_MODE,
          type: "blob",
          oid: shaA,
          path: `${REVIEW_ROOT}/index.json`,
          buffer: Buffer.from('{"trusted":true}\n'),
        },
      ],
    ]);
    const regenerated = new Map<string, Buffer>([
      [`${REVIEW_ROOT}/index.json`, Buffer.from('{"trusted":true}\n')],
    ]);
    expect(() =>
      compareCandidateToRegeneration(candidate, regenerated)
    ).not.toThrow();

    regenerated.set(
      `${REVIEW_ROOT}/index.json`,
      Buffer.from('{"trusted":false}\n')
    );
    expect(() =>
      compareCandidateToRegeneration(candidate, regenerated)
    ).toThrow("differs from trusted regeneration");

    regenerated.set(
      `${REVIEW_ROOT}/index.json`,
      Buffer.from('{"trusted":true}\n')
    );
    regenerated.set(`${REVIEW_ROOT}/forged.json`, Buffer.from("{}\n"));
    expect(() =>
      compareCandidateToRegeneration(candidate, regenerated)
    ).toThrow("file sets differ");
  });

  it("reads regenerated files through no-follow descriptors", () => {
    const repositoryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "snapshot-trust-files-")
    );
    try {
      const reviewRoot = path.join(
        repositoryRoot,
        ...REVIEW_ROOT.split("/")
      );
      fs.mkdirSync(reviewRoot, { recursive: true });
      fs.writeFileSync(
        path.join(reviewRoot, "index.json"),
        '{"trusted":true}\n'
      );
      expect(filesystemBlobMap(repositoryRoot, REVIEW_ROOT)).toEqual(
        new Map([
          [
            `${REVIEW_ROOT}/index.json`,
            Buffer.from('{"trusted":true}\n'),
          ],
        ])
      );

      fs.symlinkSync(
        path.join(reviewRoot, "index.json"),
        path.join(reviewRoot, "linked.json"),
        "file"
      );
      expect(() =>
        filesystemBlobMap(repositoryRoot, REVIEW_ROOT)
      ).toThrow("must not be a regenerated symlink");
    } finally {
      fs.rmSync(repositoryRoot, { recursive: true, force: true });
    }
  });

  it("validates compiler bytes against an explicit SHA-256 digest", () => {
    const compiler = Buffer.from("solc fixture");
    expect(sha256(compiler)).not.toBe(SOLC_SHA256);
    expect(() => validateSolcDigest(compiler, sha256(compiler))).not.toThrow();
    expect(() => validateSolcDigest(compiler)).toThrow(
      "compiler digest is invalid"
    );
  });
});

describe("public-review snapshot trust orchestration", () => {
  type HarnessOptions = {
    unrelated?: boolean;
    advanceDuringVerification?: boolean;
    advanceBaseDuringVerification?: boolean;
    generatorFailure?: boolean;
    cleanupFailure?: boolean;
    candidateBytes?: Buffer;
    regeneratedBytes?: Buffer;
  };

  function createHarness(options: HarnessOptions = {}) {
    const repositoryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "snapshot-trust-orchestration-")
    );
    const baseConfig = loadInitialConfig();
    const configPath = path.join(repositoryRoot, ...CONFIG_PATH.split("/"));
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, `${JSON.stringify(baseConfig, null, 2)}\n`);

    const candidateConfig = Buffer.from(
      `${JSON.stringify(baseConfig, null, 2)}\n`
    );
    const candidateBytes =
      options.candidateBytes ?? Buffer.from('{"trusted":true}\n');
    const regeneratedBytes =
      options.regeneratedBytes ?? Buffer.from('{"trusted":true}\n');
    const configOid = "1".repeat(40);
    const reviewOid = "2".repeat(40);
    const streamOid = "3".repeat(40);
    const reviewPath = `${REVIEW_ROOT}/index.json`;
    const cleanupOperations: string[] = [];
    let fetchCount = 0;

    const run: Run = (command, args, runOptions = {}) => {
      if (command === process.execPath) {
        if (options.generatorFailure) {
          throw new Error("generator failed");
        }
        const cwd = String(runOptions["cwd"]);
        const outputPath = path.join(cwd, ...reviewPath.split("/"));
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, regeneratedBytes);
        return Buffer.alloc(0);
      }
      if (command !== "git") {
        throw new Error(`Unexpected command: ${command}`);
      }
      const repository = args[1];
      const operation = args[2];
      if (operation === "fetch") {
        fetchCount += 1;
        return Buffer.alloc(0);
      }
      if (operation === "rev-parse") {
        const revision = args[3];
        if (revision === "HEAD^{commit}") {
          return Buffer.from(shaB);
        }
        if (revision === `${shaB}^{commit}`) {
          return Buffer.from(shaB);
        }
        if (revision!.startsWith("refs/codex-public-review/pr-")) {
          return Buffer.from(
            options.advanceDuringVerification && fetchCount > 1 ? shaC : shaA
          );
        }
        if (revision!.startsWith("refs/codex-public-review/base-")) {
          return Buffer.from(
            options.advanceBaseDuringVerification && fetchCount > 1
              ? shaC
              : shaB
          );
        }
        if (revision === `${baseConfig.source.commit}^{commit}`) {
          return Buffer.from(baseConfig.source.commit);
        }
        if (revision === `${baseConfig.source.commit}^{tree}`) {
          return Buffer.from(baseConfig.source.tree);
        }
      }
      if (operation === "status") {
        return Buffer.alloc(0);
      }
      if (operation === "merge-base") {
        return Buffer.from(shaB);
      }
      if (operation === "diff") {
        return options.unrelated
          ? Buffer.from("M\0components/Card.tsx\0")
          : Buffer.from(`M\0${CONFIG_PATH}\0A\0${reviewPath}\0`);
      }
      if (operation === "ls-tree") {
        if (repository === "/stream.git") {
          return Buffer.from(
            [
              ...baseConfig.source.roots.map((root) =>
                treeRecord(`${root.path}/Fixture.sol`, GIT_REGULAR_MODE, "blob", streamOid)
              ),
              ...baseConfig.releaseArtifacts.map((artifact) =>
                treeRecord(artifact.path, GIT_REGULAR_MODE, "blob", streamOid)
              ),
            ].join("")
          );
        }
        const requestedPath = args.at(-1);
        if (requestedPath === CONFIG_PATH) {
          return Buffer.from(
            treeRecord(CONFIG_PATH, GIT_REGULAR_MODE, "blob", configOid)
          );
        }
        if (requestedPath === REVIEW_ROOT) {
          return Buffer.from(
            treeRecord(reviewPath, GIT_REGULAR_MODE, "blob", reviewOid)
          );
        }
      }
      if (operation === "cat-file") {
        const oid = args.at(-1);
        if (oid === configOid) {
          return candidateConfig;
        }
        if (oid === reviewOid) {
          return candidateBytes;
        }
        if (oid === streamOid) {
          return Buffer.from("trusted Stream input\n");
        }
      }
      if (operation === "worktree" && args[3] === "add") {
        const worktree = args[5]!;
        const trustedConfigPath = path.join(
          worktree,
          ...CONFIG_PATH.split("/")
        );
        fs.mkdirSync(path.dirname(trustedConfigPath), { recursive: true });
        fs.writeFileSync(
          trustedConfigPath,
          `${JSON.stringify(baseConfig, null, 2)}\n`
        );
        return Buffer.alloc(0);
      }
      throw new Error(`Unexpected Git call: ${args.join(" ")}`);
    };

    const status = (_command: string, args: string[]) => {
      const operation = args.slice(2, 4).join(" ");
      cleanupOperations.push(operation);
      if (
        options.cleanupFailure &&
        operation === "worktree remove"
      ) {
        return { status: 1, stderr: "cleanup failed" };
      }
      return { status: 0, stderr: "" };
    };

    return {
      repositoryRoot,
      cleanupOperations,
      dependencies: {
        run,
        status,
        initializeStreamRepository: () => "/stream.git",
        installSolc: async (tempRoot: string) =>
          path.join(tempRoot, "trusted-solc"),
      },
    };
  }

  async function runHarness(options: HarnessOptions = {}) {
    const harness = createHarness(options);
    try {
      const verification = verifySnapshotPr(
        {
          prNumber: "7",
          headSha: shaA,
          baseSha: shaB,
          repositoryRoot: harness.repositoryRoot,
        },
        harness.dependencies
      );
      return {
        harness,
        result: await verification,
      };
    } catch (error) {
      Object.assign(error as object, { harness });
      throw error;
    } finally {
      fs.rmSync(harness.repositoryRoot, { recursive: true, force: true });
    }
  }

  it("runs the complete trusted regeneration and cleans transient Git state", async () => {
    const { harness, result } = await runHarness();
    expect(result).toEqual({
      skipped: false,
      blobCount: 1,
      headSha: shaA,
      baseSha: shaB,
    });
    expect(harness.cleanupOperations).toEqual(
      expect.arrayContaining(["worktree remove", "worktree prune", "update-ref -d"])
    );
    expect(
      harness.cleanupOperations.filter(
        (operation) => operation === "update-ref -d"
      )
    ).toHaveLength(2);
  });

  it("quick-passes unrelated PRs but still rechecks freshness and removes its ref", async () => {
    const { harness, result } = await runHarness({ unrelated: true });
    expect(result.skipped).toBe(true);
    expect(harness.cleanupOperations).toContain("update-ref -d");
    expect(harness.cleanupOperations).not.toContain("worktree remove");
  });

  it("fails when the PR advances during trusted regeneration", async () => {
    await expect(
      runHarness({ advanceDuringVerification: true })
    ).rejects.toThrow("PR head advanced");
  });

  it("fails when frontend main advances beyond the event base", async () => {
    await expect(
      runHarness({ advanceBaseDuringVerification: true })
    ).rejects.toThrow("Frontend main advanced");
  });

  it("rejects self-consistent-looking candidate bytes not reproduced by the base generator", async () => {
    await expect(
      runHarness({
        candidateBytes: Buffer.from('{"forged":"internally-consistent"}\n'),
      })
    ).rejects.toThrow("differs from trusted regeneration");
  });

  it("cleans worktree and candidate ref after a generator failure", async () => {
    try {
      await runHarness({ generatorFailure: true });
      throw new Error("Expected generator failure.");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("generator failed");
      const harness = (
        error as Error & { harness: ReturnType<typeof createHarness> }
      ).harness;
      expect(harness.cleanupOperations).toEqual(
        expect.arrayContaining(["worktree remove", "update-ref -d"])
      );
    }
  });

  it("fails closed when trusted cleanup fails", async () => {
    await expect(runHarness({ cleanupFailure: true })).rejects.toThrow(
      "Snapshot verification cleanup failed"
    );
  });
});
