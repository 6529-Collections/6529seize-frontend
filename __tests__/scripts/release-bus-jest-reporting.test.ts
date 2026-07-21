import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const YAML = require("yaml") as { parse: (text: string) => unknown };

type WorkflowStep = {
  name?: string;
  if?: string;
  env?: Record<string, string>;
  run?: string;
};

type Workflow = {
  jobs?: Record<string, { steps?: WorkflowStep[] }>;
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
        if: "always()",
        run: "node scripts/release-bus-report-progress.mjs",
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
      "__tests__/scripts/release-bus-jest-reporting.test.ts"
    );
  });
});
