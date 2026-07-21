import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

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

  it("reports preflight and isolation independently of optional Codex", () => {
    const preflight = fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/release-bus-preflight.yml"),
      "utf8"
    );
    const isolation = fs.readFileSync(
      path.join(
        process.cwd(),
        ".github/workflows/release-bus-isolate-candidate.yml"
      ),
      "utf8"
    );
    const appPrCi = fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/app-pr-ci.yml"),
      "utf8"
    );

    expect(preflight).toContain("Report structured preflight result");
    expect(preflight).toContain("release-bus-report-progress.mjs");
    expect(isolation).toContain("Report structured isolation result");
    expect(isolation).toContain("release-bus-report-progress.mjs");
    expect(isolation).not.toMatch(
      /Report structured isolation result[\s\S]{0,350}RELEASE_BUS_CODEX_ENABLED/
    );
    expect(appPrCi).toContain("scripts/release-bus-summarize-jest.mjs");
    expect(appPrCi).toContain(
      "__tests__/scripts/release-bus-jest-reporting.test.ts"
    );
  });
});
