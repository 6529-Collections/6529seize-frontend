import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const YAML = require("yaml") as { parse: (text: string) => unknown };

type WorkflowStep = {
  name?: string;
  if?: string;
  env?: Record<string, string>;
  run?: string;
  uses?: string;
};

type Workflow = {
  on?: { workflow_dispatch?: { inputs?: Record<string, unknown> } };
  jobs?: Record<
    string,
    {
      if?: string;
      needs?: string | string[];
      steps?: WorkflowStep[];
      strategy?: { "fail-fast"?: boolean; matrix?: unknown };
    }
  >;
};

function readWorkflow(filename: string): Workflow {
  return YAML.parse(
    fs.readFileSync(path.join(process.cwd(), filename), "utf8")
  ) as Workflow;
}

function findStep(workflow: Workflow, name: string): WorkflowStep | undefined {
  return Object.values(workflow.jobs ?? {})
    .flatMap((job) => job.steps ?? [])
    .find((step) => step.name === name);
}

describe("Release Bus structured Jest reporting", () => {
  it("keeps the base canary fail-closed and exact-SHA isolated", () => {
    const workflow = readWorkflow(
      ".github/workflows/release-bus-base-canary.yml"
    );
    const requiredJobs = [
      "legacy",
      "lint",
      "typecheck",
      "production-build",
      "jest-inventory",
      "jest",
      "aggregate",
    ];

    expect(
      Object.keys(workflow.on?.workflow_dispatch?.inputs ?? {})
    ).toHaveLength(10);

    for (const name of requiredJobs) {
      const steps = workflow.jobs?.[name]?.steps ?? [];
      const expectedSteps = [
        "Check out exact frontend base",
        "Stage immutable gate tooling",
        "Verify gate did not mutate source",
      ];
      if (name !== "aggregate") {
        expectedSteps.push("Install and verify frozen dependencies");
      }
      expect(steps.map((step) => step.name)).toEqual(
        expect.arrayContaining(expectedSteps)
      );
    }
    expect(workflow.jobs?.jest?.strategy?.["fail-fast"]).toBe(false);
    expect(workflow.jobs?.aggregate?.needs).toEqual(
      expect.arrayContaining(
        requiredJobs.filter((name) => name !== "aggregate")
      )
    );
    expect(workflow.jobs?.aggregate?.if).toContain("always()");

    const actionRefs = Object.values(workflow.jobs ?? {})
      .flatMap((job) => job.steps ?? [])
      .map((step) => step.uses)
      .filter(Boolean);
    for (const ref of actionRefs) {
      expect(ref).toMatch(/@[a-f0-9]{40}$/);
    }
    const workflowText = fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/release-bus-base-canary.yml"),
      "utf8"
    );
    expect(workflowText).not.toContain("node_modules");
    expect(workflowText).not.toContain("actions/cache");
  });

  it("surfaces exact suites and tests without failure messages or raw logs", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "release-bus-jest-"));
    const input = path.join(tempDir, "jest.json");
    const output = path.join(tempDir, "summary.json");
    try {
      fs.writeFileSync(
        input,
        JSON.stringify({
          numFailedTestSuites: 1,
          numFailedTests: 1,
          testResults: [
            {
              name: path.join(
                process.cwd(),
                "__tests__/waves/wavesCreatePageClient.test.tsx"
              ),
              numFailingTests: 1,
              failureMessage: "secret raw stack must not be persisted",
              assertionResults: [
                {
                  status: "failed",
                  fullName: "create page renders with pathname\u0000",
                  failureMessages: ["raw assertion stack"],
                },
              ],
            },
          ],
        })
      );

      execFileSync(
        process.execPath,
        [
          "scripts/release-bus-summarize-jest.mjs",
          "--input",
          input,
          "--output",
          output,
        ],
        { cwd: process.cwd() }
      );

      const summary = JSON.parse(fs.readFileSync(output, "utf8"));
      expect(summary).toEqual(
        expect.objectContaining({
          num_failed_test_suites: 1,
          num_failed_tests: 1,
          failing_suites: ["__tests__/waves/wavesCreatePageClient.test.tsx"],
          failing_tests: [
            {
              suite: "__tests__/waves/wavesCreatePageClient.test.tsx",
              test: "create page renders with pathname",
            },
          ],
        })
      );
      expect(JSON.stringify(summary)).not.toContain("secret raw stack");
      expect(JSON.stringify(summary)).not.toContain("raw assertion stack");
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("builds a deterministic no-OpenAI progress payload", () => {
    const output = execFileSync(
      process.execPath,
      ["scripts/release-bus-report-progress.mjs", "--payload-only"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          GITHUB_RUN_ID: "29812073647",
          RELEASE_BUS_TRAIN_ID: "b9e46a6f-94e4-46a7-9938-6e9d55306c17",
          RELEASE_BUS_OPERATION_KEY: "base-canary-frontend",
          RELEASE_BUS_JOB_STATUS: "failure",
          RELEASE_BUS_GATE_LINT_OUTCOME: "success",
          RELEASE_BUS_GATE_TYPECHECK_OUTCOME: "success",
          RELEASE_BUS_GATE_UNIT_TESTS_OUTCOME: "failure",
          RELEASE_BUS_GATE_BUILD_OUTCOME: "skipped",
          RELEASE_BUS_CODEX_ENABLED: "false",
          OPENAI_API_KEY: "",
        },
      }
    );
    const payload = JSON.parse(output.toString("utf8"));

    expect(payload).toEqual(
      expect.objectContaining({
        workflow_run_id: "29812073647",
        phase: "complete",
        status: "FAILED",
        summary: null,
      })
    );
    expect(payload.stages).toContainEqual({
      name: "unit_tests",
      status: "FAILED",
    });
    expect(JSON.stringify(payload)).not.toContain("OPENAI");
  });

  it("omits malformed or unsafe Jest details deterministically", () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "release-bus-report-")
    );
    const summaryPath = path.join(tempDir, "summary.json");
    try {
      fs.writeFileSync(summaryPath, "{not-json");
      const malformed = execFileSync(
        process.execPath,
        ["scripts/release-bus-report-progress.mjs", "--payload-only"],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            RELEASE_BUS_JEST_SUMMARY: summaryPath,
          },
        }
      );
      expect(JSON.parse(malformed.toString("utf8")).jest).toBeNull();

      fs.writeFileSync(
        summaryPath,
        JSON.stringify({
          num_failed_test_suites: 1,
          num_failed_tests: 1,
          failing_suites: ["suite.test.ts\u0000"],
          failing_tests: [
            {
              suite: "suite.test.ts",
              test: "fails\u0007 cleanly",
              stack: "raw",
            },
            { suite: null, test: "discarded" },
          ],
          raw_log: "must not leave the runner",
        })
      );
      const safe = execFileSync(
        process.execPath,
        ["scripts/release-bus-report-progress.mjs", "--payload-only"],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            RELEASE_BUS_JEST_SUMMARY: summaryPath,
          },
        }
      );
      const payload = JSON.parse(safe.toString("utf8"));
      expect(payload.jest).toEqual({
        num_failed_test_suites: 1,
        num_failed_tests: 1,
        failing_suites: ["suite.test.ts"],
        failing_tests: [{ suite: "suite.test.ts", test: "fails  cleanly" }],
      });
      expect(JSON.stringify(payload)).not.toContain("raw_log");
      expect(JSON.stringify(payload)).not.toContain("stack");
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("exits successfully when progress reporting is not configured", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/release-bus-report-progress.mjs"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          ...process.env,
          RELEASE_BUS_API_URL: "",
          RELEASE_BUS_WORKFLOW_AUTH_TOKEN: "",
        },
      }
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("not configured; skipping");
  });

  it("retries only transport and server failures with the exact payload", () => {
    const moduleUrl = pathToFileURL(
      path.join(process.cwd(), "scripts/release-bus-report-progress.mjs")
    ).href;
    const output = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        `import { postProgress } from ${JSON.stringify(moduleUrl)};
         let attempts = 0;
         const bodies = [];
         await postProgress("https://api.example.test", "token", {operation:"same"}, {
           fetchImpl: async (_url, options) => {
             attempts += 1;
             bodies.push(options.body);
             return {ok: attempts === 2, status: attempts === 2 ? 200 : 503};
           },
           sleep: async () => {},
           timeoutMs: 10
         });
         process.stdout.write(JSON.stringify({attempts,bodies}));`,
      ],
      { cwd: process.cwd() }
    );
    const result = JSON.parse(output.toString("utf8"));

    expect(result).toEqual({
      attempts: 2,
      bodies: ['{"operation":"same"}', '{"operation":"same"}'],
    });
  });

  it("fails after three persistent server responses", () => {
    const moduleUrl = pathToFileURL(
      path.join(process.cwd(), "scripts/release-bus-report-progress.mjs")
    ).href;
    const source = `import { postProgress } from ${JSON.stringify(moduleUrl)};
      let attempts = 0;
      try {
        await postProgress("https://api.example.test", "token", {operation:"same"}, {
          fetchImpl: async () => { attempts += 1; return {ok:false,status:503}; },
          sleep: async () => {},
          timeoutMs: 10
        });
      } catch (error) {
        process.stdout.write(JSON.stringify({attempts,message:error.message}));
      }`;
    const output = execFileSync(
      process.execPath,
      ["--input-type=module", "--eval", source],
      { cwd: process.cwd() }
    );

    expect(JSON.parse(output.toString("utf8"))).toEqual({
      attempts: 3,
      message:
        "Release Bus progress report failed after bounded transport retries (503)",
    });
  });

  it.each([401, 600])(
    "fails immediately for non-retryable HTTP status %s",
    (status) => {
      const moduleUrl = pathToFileURL(
        path.join(process.cwd(), "scripts/release-bus-report-progress.mjs")
      ).href;
      const source = `import { postProgress } from ${JSON.stringify(moduleUrl)};
        let attempts = 0;
        try {
          await postProgress("https://api.example.test", "token", {operation:"same"}, {
            fetchImpl: async () => { attempts += 1; return {ok:false,status:${status}}; },
            sleep: async () => {},
            timeoutMs: 10
          });
        } catch (error) {
          process.stdout.write(JSON.stringify({attempts,message:error.message}));
        }`;
      const output = execFileSync(
        process.execPath,
        ["--input-type=module", "--eval", source],
        { cwd: process.cwd() }
      );

      expect(JSON.parse(output.toString("utf8"))).toEqual({
        attempts: 1,
        message: `Release Bus progress report failed (${status})`,
      });
    }
  );

  it("projects a versioned aggregate into the strict reusable summary", () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "release-bus-aggregate-")
    );
    const aggregatePath = path.join(tempDir, "aggregate.json");
    try {
      fs.writeFileSync(
        aggregatePath,
        JSON.stringify({
          status: "SUCCEEDED",
          gate_mode: "sharded",
          base_sha: "a".repeat(40),
          environment: "orchestration",
          gate_fingerprint: "b".repeat(64),
          workflow_sha: "c".repeat(40),
          workflow_digest: "d".repeat(64),
          node_version: "22",
          package_manager: "pnpm@10.14.0",
          shard_count: 1,
          summary_artifact_name: "release-bus-base-canary-summary-123",
          phase_durations_ms: {
            lint: 10,
            typecheck: 20,
            unit_tests: 30,
            build: 40,
          },
          phases: [
            { name: "lint", status: "SUCCEEDED" },
            { name: "typecheck", status: "SUCCEEDED" },
            { name: "unit_tests", status: "SUCCEEDED" },
            { name: "build", status: "SUCCEEDED" },
          ],
          totals: {
            test_files: 2,
            test_suites: 2,
            tests: 3,
            failed_test_suites: 0,
            failed_tests: 0,
            pending_tests: 0,
            todo_tests: 0,
          },
          shards: [
            {
              index: 1,
              count: 1,
              status: "SUCCEEDED",
              duration_ms: 30,
              counts: {
                test_files: 2,
                test_suites: 2,
                tests: 3,
                failed_test_suites: 0,
                failed_tests: 0,
              },
            },
          ],
          missing_files: [],
          duplicate_files: [],
          failing_suites: [],
          failing_tests: [],
          raw_log: "must never leave the runner",
        })
      );

      const output = execFileSync(
        process.execPath,
        ["scripts/release-bus-report-progress.mjs", "--payload-only"],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            GITHUB_RUN_ID: "123",
            RELEASE_BUS_AGGREGATE_SUMMARY: aggregatePath,
            RELEASE_BUS_SUMMARY_ARTIFACT_DIGEST: "e".repeat(64),
          },
        }
      );
      const payload = JSON.parse(output.toString("utf8"));

      expect(payload).toMatchObject({
        status: "SUCCEEDED",
        failure_class: null,
        failure_phase: null,
        retryable: false,
        summary: {
          base_sha: "a".repeat(40),
          shard_count: 1,
          summary_artifact_digest: "e".repeat(64),
          phase_durations_ms: { total: 40 },
          totals: { files: 2, tests: 3, failed_tests: 0 },
          fresh_or_reused: "fresh",
          shards: [{ coordinate: "1/1", status: "SUCCEEDED" }],
        },
      });
      expect(JSON.stringify(payload)).not.toContain("raw_log");
      expect(Object.keys(payload.summary).sort()).toEqual(
        [
          "base_sha",
          "duplicate_files",
          "environment",
          "fresh_or_reused",
          "gate_fingerprint",
          "missing_files",
          "node_version",
          "package_manager",
          "phase_durations_ms",
          "shard_count",
          "shards",
          "summary_artifact_digest",
          "summary_artifact_name",
          "totals",
          "workflow_digest",
          "workflow_sha",
        ].sort()
      );

      const shadowAggregate = {
        ...JSON.parse(fs.readFileSync(aggregatePath, "utf8")),
        gate_mode: "shadow",
      };
      fs.writeFileSync(aggregatePath, JSON.stringify(shadowAggregate));
      const shadowOutput = execFileSync(
        process.execPath,
        ["scripts/release-bus-report-progress.mjs", "--payload-only"],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            GITHUB_RUN_ID: "123",
            RELEASE_BUS_AGGREGATE_SUMMARY: aggregatePath,
            RELEASE_BUS_SUMMARY_ARTIFACT_DIGEST: "e".repeat(64),
          },
        }
      );
      const shadowPayload = JSON.parse(shadowOutput.toString("utf8"));
      expect(payload.summary.phase_durations_ms.total).toBe(40);
      expect(shadowPayload.summary.phase_durations_ms.total).toBe(100);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("keeps legacy aggregate reporting compatible without reusable identity", () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "release-bus-aggregate-legacy-")
    );
    const aggregatePath = path.join(tempDir, "aggregate.json");
    try {
      fs.writeFileSync(
        aggregatePath,
        JSON.stringify({
          status: "SUCCEEDED",
          base_sha: "a".repeat(40),
          environment: "orchestration",
          gate_fingerprint: "unversioned",
          workflow_sha: "c".repeat(40),
          workflow_digest: "unversioned",
          phases: [],
          totals: {},
        })
      );
      const output = execFileSync(
        process.execPath,
        ["scripts/release-bus-report-progress.mjs", "--payload-only"],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            RELEASE_BUS_AGGREGATE_SUMMARY: aggregatePath,
          },
        }
      );
      expect(JSON.parse(output.toString("utf8"))).toMatchObject({
        status: "SUCCEEDED",
        summary: null,
      });
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("reports preflight and isolation independently of optional Codex", () => {
    const preflight = readWorkflow(
      ".github/workflows/release-bus-preflight.yml"
    );
    const isolation = readWorkflow(
      ".github/workflows/release-bus-isolate-candidate.yml"
    );
    const appPrCi = readWorkflow(".github/workflows/app-pr-ci.yml");
    const preflightReport = findStep(
      preflight,
      "Report structured preflight result"
    );
    const isolationReport = findStep(
      isolation,
      "Report structured isolation result"
    );

    expect(preflightReport).toEqual(
      expect.objectContaining({
        if: "always() && inputs.validation_only != true",
        run: 'node "$RELEASE_BUS_REPORT_TOOL"',
      })
    );
    expect(isolationReport).toEqual(
      expect.objectContaining({
        if: "always()",
        run: "node scripts/release-bus-report-progress.mjs",
        env: expect.objectContaining({
          RELEASE_BUS_REPORT_INCLUDE_STAGES: "false",
        }),
      })
    );
    expect(isolationReport?.env).not.toHaveProperty(
      "RELEASE_BUS_CODEX_ENABLED"
    );
    const gateContract = findStep(
      appPrCi,
      "Verify Release Bus gate command contract"
    );
    expect(gateContract?.run).toContain(
      "scripts/release-bus-summarize-jest.mjs"
    );
    expect(gateContract?.run).toContain(
      "scripts/release-bus-preflight-evidence.cjs"
    );
    expect(gateContract?.run).toContain(
      "__tests__/scripts/release-bus-jest-reporting.test.ts"
    );
  });
});
