import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type Pack = {
  scriptKey: string;
  alias?: string;
  environments: string[];
  triggers: string[];
  timeoutMinutes: number;
};

type SpawnResult = {
  status: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  error?: Error & { code?: string };
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const runner = require("../../scripts/e2e-packs.cjs") as {
  buildSpawnOptions: (pack: Pack) => {
    killSignal: string;
    maxBuffer: number;
    timeout: number;
  };
  classifyResult: (result: SpawnResult) => {
    failed: boolean;
    infrastructure: boolean;
    label: string;
  };
  parseArgs: (args: string[]) => {
    env: string | null;
    trigger: string | null;
    pack: string | null;
    artifactRoot: string | null;
    list: boolean;
    forward: string[];
  };
  resolveArtifactRoot: (artifactRoot: string | null) => string | null;
  resolvePacks: (
    packs: Pack[],
    filters: { env: string | null; trigger: string | null; pack: string | null }
  ) => Pack[];
  runPacks: (
    packs: Pack[],
    options: {
      artifactRoot: string;
      forward: string[];
      spawn: (pack: Pack, forward: string[]) => SpawnResult;
      cleanup: () => void;
      preserve: (artifactRoot: string, pack: Pack, output: string) => string;
      prepare: (artifactRoot: string) => void;
    }
  ) => { failedCount: number; infrastructureFailureCount: number };
};

const ROOT = process.cwd();
const SCRIPT_PATH = path.join(ROOT, "scripts", "e2e-packs.cjs");

const samplePacks: Pack[] = [
  {
    scriptKey: "test:e2e:staging:smoke",
    alias: "smoke",
    environments: ["staging"],
    triggers: ["post-deploy", "manual"],
    timeoutMinutes: 10,
  },
  {
    scriptKey: "test:e2e:production:social-readonly",
    alias: "social-readonly",
    environments: ["production"],
    triggers: ["cron", "manual"],
    timeoutMinutes: 15,
  },
];

describe("manifest-driven E2E runner", () => {
  it("parses filters, runner options, shard forwarding, and a bare separator", () => {
    expect(
      runner.parseArgs([
        "--",
        "--env",
        "staging",
        "--trigger",
        "post-deploy",
        "--pack",
        "smoke",
        "--artifact-root",
        "artifacts/e2e",
        "--shard",
        "1/2",
        "--list",
      ])
    ).toEqual({
      env: "staging",
      trigger: "post-deploy",
      pack: "smoke",
      artifactRoot: "artifacts/e2e",
      list: true,
      forward: ["--shard=1/2"],
    });
    expect(() => runner.parseArgs(["--shard", "0/2"])).toThrow(
      "--shard requires a value like 1/2"
    );
    expect(() => runner.parseArgs(["--shard", "3/2"])).toThrow(
      "--shard requires a value like 1/2"
    );
    expect(() => runner.parseArgs(["--unknown"])).toThrow(
      'unknown argument "--unknown"'
    );
  });

  it("limits destructive artifact cleanup to dedicated top-level directories", () => {
    expect(runner.resolveArtifactRoot("staging-e2e-artifacts")).toBe(
      path.join(ROOT, "staging-e2e-artifacts")
    );
    expect(runner.resolveArtifactRoot("production-e2e-artifacts/retry-1")).toBe(
      path.join(ROOT, "production-e2e-artifacts", "retry-1")
    );
    expect(() => runner.resolveArtifactRoot("tests/artifacts")).toThrow(
      "dedicated top-level *-artifacts directory"
    );
    expect(() =>
      runner.resolveArtifactRoot("staging-e2e-artifacts/../tests")
    ).toThrow("must not contain empty, . or .. segments");
    expect(() => runner.resolveArtifactRoot("../outside-artifacts")).toThrow();
    expect(() => runner.resolveArtifactRoot("test-results")).toThrow();
  });

  it("resolves exact keys and aliases without changing manifest order", () => {
    expect(
      runner.resolvePacks(samplePacks, {
        env: "staging",
        trigger: "post-deploy",
        pack: "smoke",
      })
    ).toEqual([samplePacks[0]]);
    expect(
      runner.resolvePacks(samplePacks, {
        env: "production",
        trigger: "cron",
        pack: "all",
      })
    ).toEqual([samplePacks[1]]);
  });

  it("applies a bounded timeout and distinguishes failure classes", () => {
    expect(runner.buildSpawnOptions(samplePacks[0]!)).toMatchObject({
      killSignal: "SIGTERM",
      maxBuffer: 64 * 1024 * 1024,
      timeout: 10 * 60 * 1000,
    });

    const timeoutError = Object.assign(new Error("timed out"), {
      code: "ETIMEDOUT",
    });
    expect(
      runner.classifyResult({
        status: null,
        signal: null,
        stdout: "",
        stderr: "",
        error: timeoutError,
      })
    ).toMatchObject({ failed: true, infrastructure: true });
    expect(
      runner.classifyResult({
        status: 1,
        signal: null,
        stdout: "",
        stderr: "",
      })
    ).toMatchObject({ failed: true, infrastructure: false });
    expect(
      runner.classifyResult({
        status: null,
        signal: "SIGTERM",
        stdout: "",
        stderr: "",
      })
    ).toMatchObject({ failed: true, infrastructure: true });

    const cleanTeardownTimeout = spawnSync(
      process.execPath,
      [
        "-e",
        'process.on("SIGTERM", () => process.exit(0)); setInterval(() => {}, 1000);',
      ],
      {
        encoding: "utf8",
        killSignal: "SIGTERM",
        timeout: 100,
      }
    ) as unknown as SpawnResult;
    expect(cleanTeardownTimeout.error?.code).toBe("ETIMEDOUT");
    expect(runner.classifyResult(cleanTeardownTimeout)).toMatchObject({
      failed: true,
      infrastructure: true,
    });
  });

  it("continues after failures and records preserved artifacts", () => {
    const summaryDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-packs-"));
    const summaryPath = path.join(summaryDir, "summary.md");
    const previousSummary = process.env["GITHUB_STEP_SUMMARY"];
    process.env["GITHUB_STEP_SUMMARY"] = summaryPath;
    const timeoutError = Object.assign(new Error("timed out"), {
      code: "ETIMEDOUT",
    });
    let call = 0;

    try {
      const result = runner.runPacks(samplePacks, {
        artifactRoot: path.join(summaryDir, "artifacts"),
        forward: ["--shard=1/2"],
        spawn: (_pack, forward) => {
          expect(forward).toEqual(["--shard=1/2"]);
          call += 1;
          return call === 1
            ? {
                status: null,
                signal: null,
                stdout: "",
                stderr: "",
                error: timeoutError,
              }
            : {
                status: 1,
                signal: null,
                stdout: "",
                stderr: "",
              };
        },
        cleanup: () => undefined,
        preserve: (_artifactRoot, pack) => `artifacts/${pack.alias}`,
        prepare: () => undefined,
      });

      expect(result).toEqual({
        failedCount: 2,
        infrastructureFailureCount: 1,
      });
      expect(call).toBe(2);
      expect(fs.readFileSync(summaryPath, "utf8")).toContain(
        "artifacts/social-readonly"
      );
    } finally {
      if (previousSummary === undefined) {
        delete process.env["GITHUB_STEP_SUMMARY"];
      } else {
        process.env["GITHUB_STEP_SUMMARY"] = previousSummary;
      }
      fs.rmSync(summaryDir, { recursive: true, force: true });
    }
  });

  it("keeps running when the optional GitHub summary cannot be written", () => {
    const summaryDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-summary-"));
    const previousSummary = process.env["GITHUB_STEP_SUMMARY"];
    process.env["GITHUB_STEP_SUMMARY"] = summaryDir;
    const warning = jest.spyOn(console, "warn").mockImplementation();
    let call = 0;

    try {
      const result = runner.runPacks([samplePacks[0]!], {
        artifactRoot: path.join(summaryDir, "staging-e2e-artifacts"),
        forward: [],
        spawn: () => {
          call += 1;
          return {
            status: 0,
            signal: null,
            stdout: "",
            stderr: "",
          };
        },
        cleanup: () => undefined,
        preserve: () => "staging-e2e-artifacts/smoke",
        prepare: () => undefined,
      });

      expect(result).toEqual({
        failedCount: 0,
        infrastructureFailureCount: 0,
      });
      expect(call).toBe(1);
      expect(warning).toHaveBeenCalledWith(
        expect.stringContaining("unable to update GITHUB_STEP_SUMMARY")
      );
    } finally {
      warning.mockRestore();
      if (previousSummary === undefined) {
        delete process.env["GITHUB_STEP_SUMMARY"];
      } else {
        process.env["GITHUB_STEP_SUMMARY"] = previousSummary;
      }
      fs.rmSync(summaryDir, { recursive: true, force: true });
    }
  });
});

describe("E2E runner CLI resolution", () => {
  const run = (args: string[]) =>
    spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
      cwd: ROOT,
      encoding: "utf8",
    });

  it("hard-fails an empty deployed-environment selection", () => {
    const result = run(["--env", "staging", "--trigger", "cron", "--list"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("An empty deployed-environment selection");
  });

  it.each([
    ["staging", "post-deploy", 13],
    ["production", "cron", 10],
    ["production", "post-deploy", 1],
  ])(
    "lists %s/%s as a non-empty deterministic pack set",
    (env, trigger, count) => {
      const result = run(["--env", env, "--trigger", trigger, "--list"]);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(`resolved ${count} pack(s)`);
    }
  );
});
