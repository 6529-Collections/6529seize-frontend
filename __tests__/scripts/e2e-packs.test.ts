import { spawnSync, type ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import { PassThrough } from "node:stream";
import os from "node:os";
import path from "node:path";

type Pack = {
  scriptKey: string;
  alias?: string;
  safety: string;
  environments: string[];
  triggers: string[];
  specs?: string[];
  projects?: string[];
  workers?: number;
  timeoutMinutes: number;
  changeScope?: "museum";
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
  RUNNER_CAPABILITIES: {
    contract: string;
    features: {
      readonly_pack_parallelism: {
        version: number;
        max_parallel: number;
      };
      pack_exclusion: {
        version: number;
      };
      serial_failed_pack_retry: {
        version: number;
        max_retries: number;
        policy: string;
      };
    };
  };
  assertParallelSafe: (packs: Pack[], parallel: number) => void;
  buildSpawnOptions: (pack: Pack) => {
    killSignal: string;
    maxBuffer: number;
    timeout: number;
  };
  classifyResult: (result: SpawnResult) => {
    failed: boolean;
    infrastructure: boolean;
    retryable: boolean;
    label: string;
  };
  parseArgs: (args: string[]) => {
    env: string | null;
    trigger: string | null;
    pack: string | null;
    excludePacks: string[];
    artifactRoot: string | null;
    parallel: number;
    retryFailedPacks: number;
    capabilities: boolean;
    list: boolean;
    forward: string[];
  };
  resolveArtifactRoot: (artifactRoot: string | null) => string | null;
  resolvePacks: (
    packs: Pack[],
    filters: {
      env: string | null;
      trigger: string | null;
      pack: string | null;
      excludePacks?: string[];
    }
  ) => Pack[];
  outputPathsForPack: (pack: Pack) => {
    root: string;
    testResults: string;
    report: string;
  };
  runPacks: (
    packs: Pack[],
    options: {
      artifactRoot: string | null;
      environment?: string;
      trigger?: string;
      parallel?: number;
      retryFailedPacks?: number;
      forward: string[];
      spawn: (
        pack: Pack,
        forward: string[],
        outputPaths: { root: string; testResults: string; report: string }
      ) => SpawnResult | Promise<SpawnResult>;
      cleanup: (pack: Pack) => void;
      preserve: (
        artifactRoot: string,
        pack: Pack,
        output: string,
        outputPaths: { root: string; testResults: string; report: string },
        attempt: number
      ) => string;
      prepare: (artifactRoot: string) => void;
    }
  ) => Promise<{
    failedCount: number;
    infrastructureFailureCount: number;
    evidence: {
      parallelism_requested: number;
      worker_count: number;
      results: Array<{
        script_key: string;
        status: string;
        failure_class: string | null;
        attempt_count: number;
        attempts: Array<{
          attempt: number;
          status: string;
          failure_class: string | null;
        }>;
      }>;
    };
  }>;
  runProcessGroup: (
    command: string,
    args: string[],
    options: {
      cwd: string;
      env: NodeJS.ProcessEnv;
      maxBuffer: number;
      spawnProcess?: () => ChildProcess;
      timeout: number;
    }
  ) => Promise<SpawnResult>;
};

const ROOT = process.cwd();
const SCRIPT_PATH = path.join(ROOT, "scripts", "e2e-packs.cjs");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PACKS } = require("../../tests/packs.manifest.cjs") as {
  PACKS: Pack[];
};

const samplePacks: Pack[] = [
  {
    scriptKey: "test:e2e:staging:smoke",
    alias: "smoke",
    safety: "readonly",
    environments: ["staging"],
    triggers: ["post-deploy", "manual"],
    timeoutMinutes: 10,
  },
  {
    scriptKey: "test:e2e:production:social-readonly",
    alias: "social-readonly",
    safety: "readonly",
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
        "--exclude-pack",
        "museum-institutional-practice",
        "--artifact-root",
        "artifacts/e2e",
        "--parallel",
        "3",
        "--retry-failed-packs",
        "1",
        "--shard",
        "1/2",
        "--list",
      ])
    ).toEqual({
      env: "staging",
      trigger: "post-deploy",
      pack: "smoke",
      excludePacks: ["museum-institutional-practice"],
      artifactRoot: "artifacts/e2e",
      parallel: 3,
      retryFailedPacks: 1,
      capabilities: false,
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
    expect(() => runner.parseArgs(["--parallel", "5"])).toThrow(
      "--parallel must be between 1 and 4"
    );
    expect(() => runner.parseArgs(["--retry-failed-packs", "2"])).toThrow(
      "--retry-failed-packs must be 0 or 1"
    );
  });

  it("reports an explicit versioned parallel-runner capability without requiring an environment", () => {
    expect(runner.RUNNER_CAPABILITIES).toEqual({
      contract: "deployment-e2e-runner-capabilities.v1",
      features: {
        readonly_pack_parallelism: {
          version: 1,
          max_parallel: 4,
        },
        pack_exclusion: {
          version: 1,
        },
        serial_failed_pack_retry: {
          version: 2,
          max_retries: 1,
          policy: "transient-infrastructure-only",
        },
      },
    });
    expect(runner.parseArgs(["--capabilities"])).toMatchObject({
      env: null,
      parallel: 1,
      retryFailedPacks: 0,
      capabilities: true,
    });
    const result = spawnSync(
      process.execPath,
      [SCRIPT_PATH, "--capabilities"],
      {
        cwd: ROOT,
        encoding: "utf8",
      }
    );
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual(runner.RUNNER_CAPABILITIES);
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
        excludePacks: [],
      })
    ).toEqual([samplePacks[0]]);
    expect(
      runner.resolvePacks(samplePacks, {
        env: "production",
        trigger: "cron",
        pack: "all",
        excludePacks: [],
      })
    ).toEqual([samplePacks[1]]);
  });

  it("excludes a changed-scoped pack by alias without disturbing order", () => {
    expect(
      runner.resolvePacks(samplePacks, {
        env: null,
        trigger: null,
        pack: "all",
        excludePacks: ["smoke"],
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
    ).toMatchObject({
      failed: true,
      infrastructure: true,
      retryable: false,
    });
    expect(
      runner.classifyResult({
        status: 1,
        signal: null,
        stdout: "",
        stderr: "",
      })
    ).toMatchObject({
      failed: true,
      infrastructure: false,
      retryable: false,
    });
    expect(
      runner.classifyResult({
        status: null,
        signal: "SIGTERM",
        stdout: "",
        stderr: "",
      })
    ).toMatchObject({
      failed: true,
      infrastructure: true,
      retryable: true,
    });

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
      retryable: false,
    });
  });

  it("continues after failures and records preserved artifacts", async () => {
    const summaryDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-packs-"));
    const summaryPath = path.join(summaryDir, "summary.md");
    const previousSummary = process.env["GITHUB_STEP_SUMMARY"];
    process.env["GITHUB_STEP_SUMMARY"] = summaryPath;
    const timeoutError = Object.assign(new Error("timed out"), {
      code: "ETIMEDOUT",
    });
    let call = 0;

    try {
      const result = await runner.runPacks(samplePacks, {
        artifactRoot: path.join(summaryDir, "artifacts"),
        environment: "staging",
        trigger: "post-deploy",
        parallel: 2,
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
        prepare: (artifactRoot) =>
          fs.mkdirSync(artifactRoot, { recursive: true }),
      });

      expect(result).toMatchObject({
        failedCount: 2,
        infrastructureFailureCount: 1,
        evidence: {
          parallelism_requested: 2,
          worker_count: 2,
          results: [
            {
              script_key: "test:e2e:staging:smoke",
              failure_class: "infrastructure",
            },
            {
              script_key: "test:e2e:production:social-readonly",
              failure_class: "e2e",
            },
          ],
        },
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

  it("retries only transient infrastructure failures once in serial", async () => {
    const summaryDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-retry-"));
    const packs = [
      samplePacks[0]!,
      {
        ...samplePacks[0]!,
        scriptKey: "test:e2e:staging:second-readonly",
      },
      {
        ...samplePacks[0]!,
        scriptKey: "test:e2e:staging:third-readonly",
      },
      {
        ...samplePacks[0]!,
        scriptKey: "test:e2e:staging:fourth-readonly",
      },
    ];
    const calls = new Map<string, number>();
    let active = 0;
    let peak = 0;
    const retryOrder: string[] = [];

    try {
      const result = await runner.runPacks(packs, {
        artifactRoot: path.join(summaryDir, "staging-e2e-artifacts"),
        environment: "staging",
        trigger: "post-deploy",
        parallel: 3,
        retryFailedPacks: 1,
        forward: [],
        spawn: async (pack, _forward, outputPaths) => {
          const call = (calls.get(pack.scriptKey) ?? 0) + 1;
          calls.set(pack.scriptKey, call);
          active += 1;
          peak = Math.max(peak, active);
          if (call === 2) {
            retryOrder.push(pack.scriptKey);
            expect(active).toBe(1);
            expect(outputPaths.root).toContain("attempt-2");
          }
          await new Promise((resolve) => setTimeout(resolve, 5));
          active -= 1;
          const deterministicFailure = pack.scriptKey.includes("second");
          const timeoutFailure = pack.scriptKey.includes("third");
          const transientInfrastructureFailure =
            pack.scriptKey.includes("smoke") && call === 1;
          if (transientInfrastructureFailure) {
            return {
              status: null,
              signal: null,
              stdout: `attempt ${call}`,
              stderr: "",
              error: Object.assign(new Error("runner unavailable"), {
                code: "EAGAIN",
              }),
            };
          }
          if (timeoutFailure) {
            return {
              status: null,
              signal: null,
              stdout: `attempt ${call}`,
              stderr: "",
              error: Object.assign(new Error("timed out"), {
                code: "ETIMEDOUT",
              }),
            };
          }
          return {
            status: deterministicFailure ? 1 : 0,
            signal: null,
            stdout: `attempt ${call}`,
            stderr: "",
          };
        },
        cleanup: () => undefined,
        preserve: (_artifactRoot, pack, _output, _paths, attempt) =>
          `staging-e2e-artifacts/${pack.alias ?? pack.scriptKey}/attempt-${attempt}`,
        prepare: (artifactRoot) =>
          fs.mkdirSync(artifactRoot, { recursive: true }),
      });

      expect(peak).toBe(3);
      expect(retryOrder).toEqual(["test:e2e:staging:smoke"]);
      expect(Object.fromEntries(calls)).toEqual({
        "test:e2e:staging:smoke": 2,
        "test:e2e:staging:second-readonly": 1,
        "test:e2e:staging:third-readonly": 1,
        "test:e2e:staging:fourth-readonly": 1,
      });
      expect(result).toMatchObject({
        failedCount: 2,
        infrastructureFailureCount: 1,
        evidence: {
          serial_retry_limit: 1,
          results: [
            {
              script_key: "test:e2e:staging:smoke",
              status: "passed",
              attempt_count: 2,
              attempts: [
                {
                  attempt: 1,
                  status: "failed",
                  failure_class: "infrastructure",
                },
                { attempt: 2, status: "passed", failure_class: null },
              ],
            },
            {
              script_key: "test:e2e:staging:second-readonly",
              status: "failed",
              attempt_count: 1,
            },
            {
              script_key: "test:e2e:staging:third-readonly",
              status: "failed",
              attempt_count: 1,
            },
            {
              script_key: "test:e2e:staging:fourth-readonly",
              status: "passed",
              attempt_count: 1,
            },
          ],
        },
      });
    } finally {
      fs.rmSync(summaryDir, { recursive: true, force: true });
    }
  });

  it("does not retry deterministic output-buffer exhaustion", async () => {
    let calls = 0;
    const result = await runner.runPacks([samplePacks[0]!], {
      artifactRoot: null,
      parallel: 1,
      retryFailedPacks: 1,
      forward: [],
      spawn: () => {
        calls += 1;
        return {
          status: null,
          signal: null,
          stdout: "",
          stderr: "",
          error: Object.assign(new Error("pack output exceeded the buffer"), {
            code: "ENOBUFS",
          }),
        };
      },
      cleanup: () => undefined,
      preserve: () => "",
      prepare: () => undefined,
    });

    expect(calls).toBe(1);
    expect(result).toMatchObject({
      failedCount: 1,
      infrastructureFailureCount: 1,
      evidence: {
        serial_retry_limit: 1,
        results: [
          {
            script_key: "test:e2e:staging:smoke",
            status: "failed",
            failure_class: "infrastructure",
            attempt_count: 1,
          },
        ],
      },
    });
  });

  it("keeps running when the optional GitHub summary cannot be written", async () => {
    const summaryDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-summary-"));
    const previousSummary = process.env["GITHUB_STEP_SUMMARY"];
    process.env["GITHUB_STEP_SUMMARY"] = summaryDir;
    const warning = jest.spyOn(console, "warn").mockImplementation();
    let call = 0;

    try {
      const result = await runner.runPacks([samplePacks[0]!], {
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
        prepare: (artifactRoot) =>
          fs.mkdirSync(artifactRoot, { recursive: true }),
      });

      expect(result).toMatchObject({
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

  it("bounds parallelism to readonly packs and assigns unique output paths", async () => {
    const unsafe = { ...samplePacks[0]!, safety: "sandbox" };
    expect(() => runner.assertParallelSafe([unsafe], 2)).toThrow(
      "manifest-declared readonly packs"
    );

    let active = 0;
    let peak = 0;
    const seenRoots = new Set<string>();
    const result = await runner.runPacks(
      [
        samplePacks[0]!,
        {
          ...samplePacks[0]!,
          scriptKey: "test:e2e:staging:second-readonly",
        },
        {
          ...samplePacks[0]!,
          scriptKey: "test:e2e:staging:third-readonly",
        },
      ],
      {
        artifactRoot: null,
        parallel: 2,
        forward: [],
        spawn: async (_pack, _forward, outputPaths) => {
          seenRoots.add(outputPaths.root);
          active += 1;
          peak = Math.max(peak, active);
          await new Promise((resolve) => setTimeout(resolve, 10));
          active -= 1;
          return {
            status: 0,
            signal: null,
            stdout: "",
            stderr: "",
          };
        },
        cleanup: () => undefined,
        preserve: () => "",
        prepare: () => undefined,
      }
    );

    expect(peak).toBe(2);
    expect(seenRoots.size).toBe(3);
    expect(result.evidence.parallelism_requested).toBe(2);
    expect(result.evidence.worker_count).toBe(2);
  });

  it.each(["launch", "cleanup", "preservation"] as const)(
    "classifies %s failures as infrastructure without false-green evidence",
    async (failurePoint) => {
      const result = await runner.runPacks([samplePacks[0]!], {
        artifactRoot: null,
        parallel: 1,
        forward: [],
        spawn: () => {
          if (failurePoint === "launch") {
            throw new Error("launch failed");
          }
          return {
            status: 0,
            signal: null,
            stdout: "",
            stderr: "",
          };
        },
        cleanup: () => {
          if (failurePoint === "cleanup") {
            throw new Error("cleanup failed");
          }
        },
        preserve: () => {
          if (failurePoint === "preservation") {
            throw new Error("preservation failed");
          }
          return "";
        },
        prepare: () => undefined,
      });

      expect(result).toMatchObject({
        failedCount: 1,
        infrastructureFailureCount: 1,
        evidence: {
          failed_count: 1,
          infrastructure_failure_count: 1,
          results: [{ failure_class: "infrastructure" }],
        },
      });
    }
  );

  it("rejects a malformed deployment source SHA before preparing or running packs", async () => {
    const previous = process.env["DEPLOYMENT_E2E_SOURCE_SHA"];
    process.env["DEPLOYMENT_E2E_SOURCE_SHA"] = "not-a-sha";
    const prepare = jest.fn();
    const spawn = jest.fn();

    try {
      await expect(
        runner.runPacks([samplePacks[0]!], {
          artifactRoot: null,
          forward: [],
          cleanup: () => undefined,
          preserve: () => "",
          prepare,
          spawn,
        })
      ).rejects.toThrow("Deployment E2E source SHA is malformed");
      expect(prepare).not.toHaveBeenCalled();
      expect(spawn).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) {
        delete process.env["DEPLOYMENT_E2E_SOURCE_SHA"];
      } else {
        process.env["DEPLOYMENT_E2E_SOURCE_SHA"] = previous;
      }
    }
  });

  it("times out and terminates the complete POSIX process group", async () => {
    const startedAt = Date.now();
    const pidFile = path.join(
      os.tmpdir(),
      `e2e-pack-grandchild-${process.pid}-${Date.now()}.pid`
    );
    const stubbornChild =
      'process.on("SIGTERM",()=>{});setInterval(()=>{},1000);';
    const parentCode = [
      'const {spawn}=require("node:child_process");',
      'const fs=require("node:fs");',
      `const child=spawn(process.execPath,["-e",${JSON.stringify(
        stubbornChild
      )}],{stdio:"ignore"});`,
      "fs.writeFileSync(process.argv[1],String(child.pid));",
      "setInterval(()=>{},1000);",
    ].join("");
    const result = await runner.runProcessGroup(
      process.execPath,
      ["-e", parentCode, pidFile],
      {
        cwd: ROOT,
        env: process.env,
        maxBuffer: 1024 * 1024,
        // Leave enough time for the parent to publish the grandchild PID on
        // slower local/CI process startup before exercising group teardown.
        timeout: 500,
      }
    );

    expect(result.error?.code).toBe("ETIMEDOUT");
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(1400);
    const grandchildPid = Number(fs.readFileSync(pidFile, "utf8"));
    fs.rmSync(pidFile, { force: true });
    expect(grandchildPid).toBeGreaterThan(0);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(() => process.kill(grandchildPid, 0)).toThrow();
  });

  it("returns a bounded infrastructure result if close never follows escalation", async () => {
    jest.useFakeTimers();
    const fakeChild = Object.assign(new EventEmitter(), {
      kill: jest.fn().mockReturnValue(true),
      pid: 987654,
      stderr: new PassThrough(),
      stdout: new PassThrough(),
    }) as unknown as ChildProcess;
    const processKill = jest.spyOn(process, "kill").mockImplementation(() => {
      throw Object.assign(new Error("No such process group"), {
        code: "ESRCH",
      });
    });

    try {
      const resultPromise = runner.runProcessGroup("never-closes", [], {
        cwd: ROOT,
        env: process.env,
        maxBuffer: 1024,
        spawnProcess: () => fakeChild,
        timeout: 100,
      });
      await jest.advanceTimersByTimeAsync(1100);
      await expect(resultPromise).resolves.toMatchObject({
        status: null,
        signal: "SIGKILL",
        error: { code: "ETIMEDOUT" },
      });
      expect(fakeChild.kill).toHaveBeenCalledTimes(2);
    } finally {
      processKill.mockRestore();
      jest.useRealTimers();
    }
  });

  it("truncates output while a noisy process is being terminated", async () => {
    jest.useFakeTimers();
    const fakeChild = Object.assign(new EventEmitter(), {
      kill: jest.fn().mockReturnValue(true),
      pid: 987654,
      stderr: new PassThrough(),
      stdout: new PassThrough(),
    }) as unknown as ChildProcess;
    const processKill = jest.spyOn(process, "kill").mockImplementation(() => {
      throw Object.assign(new Error("No such process group"), {
        code: "ESRCH",
      });
    });

    try {
      const resultPromise = runner.runProcessGroup("noisy", [], {
        cwd: ROOT,
        env: process.env,
        maxBuffer: 32,
        spawnProcess: () => fakeChild,
        timeout: 10_000,
      });
      fakeChild.stdout!.emit("data", Buffer.alloc(4096, "x"));
      fakeChild.stdout!.emit("data", Buffer.alloc(4096, "y"));
      await jest.advanceTimersByTimeAsync(1000);
      const result = await resultPromise;
      expect(result.error?.code).toBe("ENOBUFS");
      expect(Buffer.byteLength(result.stdout)).toBeLessThanOrEqual(32);
    } finally {
      processKill.mockRestore();
      jest.useRealTimers();
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
    ["staging", "post-deploy", 17],
    ["production", "cron", 11],
    ["production", "post-deploy", 16],
  ])(
    "lists %s/%s as a non-empty deterministic pack set",
    (env, trigger, count) => {
      const result = run(["--env", env, "--trigger", trigger, "--list"]);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(`resolved ${count} pack(s)`);
    }
  );

  it.each(["staging", "production"])(
    "uses disjoint readonly %s post-deploy packs",
    (environment) => {
      const packs = PACKS.filter(
        (pack) =>
          pack.environments.includes(environment) &&
          pack.triggers.includes("post-deploy")
      );
      expect(packs.length).toBeGreaterThan(1);
      expect(packs.every((pack) => pack.safety === "readonly")).toBe(true);
      const specs = packs.flatMap((pack) => pack.specs ?? []);
      expect(new Set(specs).size).toBe(specs.length);
    }
  );

  it("preserves the complete production aggregate inventory in disjoint packs", () => {
    const aggregate = PACKS.find(
      (pack) => pack.scriptKey === "test:e2e:production:readonly"
    );
    expect(aggregate?.triggers).toEqual(["manual"]);
    const postDeploySpecs = PACKS.filter(
      (pack) =>
        pack.environments.includes("production") &&
        pack.triggers.includes("post-deploy")
    ).flatMap((pack) => pack.specs ?? []);
    expect([...postDeploySpecs].sort()).toEqual(
      [...(aggregate?.specs ?? [])].sort()
    );
  });

  it("keeps the Museum institutional-practice sweep read-only across every release environment", () => {
    const museumPacks = PACKS.filter((pack) =>
      pack.specs?.includes(
        "tests/museum/institutional-practice-readonly.spec.ts"
      )
    );

    expect(museumPacks.map((pack) => pack.environments[0])).toEqual([
      "local",
      "staging",
      "production",
      "production",
    ]);
    expect(
      museumPacks.slice(0, 3).every((pack) => pack.safety === "readonly")
    ).toBe(true);
    expect(
      museumPacks
        .slice(0, 3)
        .every((pack) => pack.projects?.includes("web-desktop-chromium"))
    ).toBe(true);
    expect(
      museumPacks
        .slice(0, 3)
        .every((pack) => pack.projects?.includes("web-mobile-chromium"))
    ).toBe(true);
    expect(museumPacks[0]?.triggers).toEqual(["manual"]);
    expect(museumPacks[1]?.triggers).toEqual(["post-deploy", "manual"]);
    expect(museumPacks[2]?.triggers).toEqual(["cron", "post-deploy", "manual"]);
    expect(museumPacks.slice(1, 3).map((pack) => pack.workers)).toEqual([2, 2]);
  });

  it("classifies every dedicated Museum pack across local and deployed environments", () => {
    const museumPacks = PACKS.filter((pack) => pack.changeScope === "museum");

    expect(museumPacks).toHaveLength(15);
    expect(
      museumPacks.every(
        (pack) =>
          (pack.specs?.length ?? 0) > 0 &&
          pack.specs?.every((spec) => spec.startsWith("tests/museum/"))
      )
    ).toBe(true);
    expect(
      museumPacks.filter((pack) => pack.environments[0] === "local")
    ).toHaveLength(5);
    expect(
      museumPacks.filter((pack) => pack.environments[0] === "staging")
    ).toHaveLength(5);
    expect(
      museumPacks.filter((pack) => pack.environments[0] === "production")
    ).toHaveLength(5);
  });
});
