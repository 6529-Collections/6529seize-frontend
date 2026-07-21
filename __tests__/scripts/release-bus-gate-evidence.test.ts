import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const {
  buildGateSummary,
  finalSummary,
  jestRecord,
  manifestFromRaw,
  phaseRecord,
  safeText,
}: {
  buildGateSummary: (input: Record<string, unknown>) => Record<string, any>;
  finalSummary: (input: Record<string, unknown>) => Record<string, any>;
  jestRecord: (input: Record<string, unknown>) => Record<string, any>;
  manifestFromRaw: (raw: string, root: string) => string[];
  phaseRecord: (input: Record<string, unknown>) => Record<string, any>;
  safeText: (value: unknown, maximum?: number) => string;
} = require("../../scripts/release-bus-gate-evidence.cjs");

describe("Release Bus gate evidence", () => {
  it("normalizes an exact repository-local test inventory", () => {
    const root = path.join(os.tmpdir(), "release-bus-evidence-root");
    const raw = [
      "pnpm wrapper output",
      path.join(root, "__tests__/b.test.ts"),
      path.join(root, "__tests__/a.test.ts"),
    ].join("\n");

    expect(manifestFromRaw(raw, root)).toEqual([
      "__tests__/a.test.ts",
      "__tests__/b.test.ts",
    ]);
  });

  it("sanitizes bounded operator-facing strings", () => {
    expect(safeText("failed\n\u0000suite", 20)).toBe("failed suite");
    expect(safeText("x".repeat(50), 10)).toHaveLength(10);
  });

  it("proves every expected Jest file executed exactly once", () => {
    const root = path.join(os.tmpdir(), "release-bus-evidence-root");
    const files = ["__tests__/a.test.ts", "__tests__/b.test.ts"];
    const records = [
      {
        kind: "manifest",
        source: "parallel",
        scope: "all",
        files,
      },
      ...files.map((file, index) => ({
        kind: "manifest",
        source: "parallel",
        scope: "shard",
        shard_index: index + 1,
        shard_count: 2,
        files: [file],
      })),
      ...files.map((file, index) =>
        jestRecord({
          result: {
            success: true,
            numTotalTestSuites: 1,
            numPassedTestSuites: 1,
            numFailedTestSuites: 0,
            numTotalTests: 2,
            numPassedTests: 2,
            numFailedTests: 0,
            testResults: [
              {
                name: path.join(root, file),
                status: "passed",
                assertionResults: [],
              },
            ],
          },
          manifest: { files: [file] },
          repoRoot: root,
          shardIndex: index + 1,
          shardCount: 2,
          durationMs: 10 + index,
          exitCode: 0,
          source: "parallel",
        })
      ),
      ...["lint", "typecheck", "build"].map((name) =>
        phaseRecord({
          name,
          status: "SUCCEEDED",
          durationMs: 10,
          exitCode: 0,
          source: "parallel",
        })
      ),
    ];

    const summary = buildGateSummary({
      records,
      source: "parallel",
      shardCount: 2,
      jobResults: {
        lint: "success",
        typecheck: "success",
        build: "success",
        inventory: "success",
        jest: "success",
      },
    });

    expect(summary).toMatchObject({
      status: "SUCCEEDED",
      counts: { test_files: 2, test_suites: 2, tests: 4 },
      missing_files: [],
      duplicate_files: [],
    });
  });

  it("fails closed for a duplicate, omitted, or failed shard", () => {
    const records = [
      {
        kind: "manifest",
        source: "parallel",
        scope: "all",
        files: ["a.test.ts", "b.test.ts"],
      },
      {
        kind: "manifest",
        source: "parallel",
        scope: "shard",
        files: ["a.test.ts"],
      },
      {
        kind: "jest_shard",
        source: "parallel",
        shard_index: 1,
        shard_count: 2,
        status: "FAILED",
        duration_ms: 1,
        counts: {},
        executed_test_files: ["a.test.ts", "a.test.ts"],
      },
    ];

    const summary = buildGateSummary({
      records,
      source: "parallel",
      shardCount: 2,
      jobResults: { jest: "failure" },
    });

    expect(summary.status).toBe("FAILED");
    expect(summary.missing_files).toContain("b.test.ts");
    expect(summary.duplicate_files).toContain("a.test.ts");
  });

  it("fails when an individual shard does not execute its exact plan", () => {
    const records = [
      {
        kind: "manifest",
        source: "parallel",
        scope: "all",
        files: ["a.test.ts", "b.test.ts"],
      },
      {
        kind: "manifest",
        source: "parallel",
        scope: "shard",
        shard_index: 1,
        shard_count: 2,
        files: ["a.test.ts"],
      },
      {
        kind: "manifest",
        source: "parallel",
        scope: "shard",
        shard_index: 2,
        shard_count: 2,
        files: ["b.test.ts"],
      },
      {
        kind: "jest_shard",
        source: "parallel",
        shard_index: 1,
        shard_count: 2,
        status: "SUCCEEDED",
        duration_ms: 1,
        counts: {},
        executed_test_files: ["b.test.ts"],
      },
      {
        kind: "jest_shard",
        source: "parallel",
        shard_index: 2,
        shard_count: 2,
        status: "SUCCEEDED",
        duration_ms: 1,
        counts: {},
        executed_test_files: ["a.test.ts"],
      },
    ];

    const summary = buildGateSummary({
      records,
      source: "parallel",
      shardCount: 2,
      jobResults: { jest: "success" },
    });

    expect(summary.status).toBe("FAILED");
    expect(summary.errors).toContain(
      "Jest shard 1/2 did not execute its exact plan"
    );
    expect(summary.errors).toContain(
      "Jest shard 2/2 did not execute its exact plan"
    );
  });

  it("attributes a deliberate first-run failure to its exact shard", () => {
    const files = Array.from({ length: 4 }, (_, index) => `${index}.test.ts`);
    const records = [
      {
        kind: "manifest",
        source: "parallel",
        scope: "all",
        files,
      },
      ...files.map((file, index) => ({
        kind: "manifest",
        source: "parallel",
        scope: "shard",
        shard_index: index + 1,
        shard_count: 4,
        files: [file],
      })),
      ...files.map((file, index) => ({
        kind: "jest_shard",
        source: "parallel",
        shard_index: index + 1,
        shard_count: 4,
        status: index === 2 ? "FAILED" : "SUCCEEDED",
        duration_ms: 10,
        counts: {
          test_files: 1,
          test_suites: 1,
          passed_test_suites: index === 2 ? 0 : 1,
          failed_test_suites: index === 2 ? 1 : 0,
          pending_test_suites: 0,
          tests: 1,
          passed_tests: index === 2 ? 0 : 1,
          failed_tests: index === 2 ? 1 : 0,
          pending_tests: 0,
          todo_tests: 0,
        },
        executed_test_files: [file],
        failing_suites: index === 2 ? [file] : [],
        failing_tests:
          index === 2 ? [{ suite: file, test: "deliberate failure" }] : [],
      })),
      ...["lint", "typecheck", "build"].map((name) =>
        phaseRecord({
          name,
          status: "SUCCEEDED",
          durationMs: 1,
          exitCode: 0,
          source: "parallel",
        })
      ),
    ];

    const summary = buildGateSummary({
      records,
      source: "parallel",
      shardCount: 4,
      jobResults: { jest: "failure" },
    });

    expect(summary).toMatchObject({
      status: "FAILED",
      shards: expect.arrayContaining([
        expect.objectContaining({ index: 3, status: "FAILED" }),
      ]),
      failing_suites: ["2.test.ts"],
      failing_tests: [{ suite: "2.test.ts", test: "deliberate failure" }],
    });
  });

  it("keeps serial authoritative in shadow mode and records equivalence", () => {
    const evidenceRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "release-bus-final-summary-")
    );
    const jobsFile = path.join(evidenceRoot, "jobs.json");
    fs.writeFileSync(jobsFile, JSON.stringify({ jobs: [] }));
    const records: Array<Record<string, unknown>> = [];
    for (const source of ["legacy", "parallel"] as const) {
      records.push({
        kind: "manifest",
        source,
        scope: "all",
        files: ["a.test.ts"],
      });
      records.push({
        kind: "manifest",
        source,
        scope: "shard",
        shard_index: 1,
        shard_count: 1,
        files: ["a.test.ts"],
      });
      records.push({
        kind: "jest_shard",
        source,
        shard_index: 1,
        shard_count: 1,
        status: "SUCCEEDED",
        duration_ms: 1,
        counts: {
          test_files: 1,
          test_suites: 1,
          passed_test_suites: 1,
          failed_test_suites: 0,
          pending_test_suites: 0,
          tests: 2,
          passed_tests: 2,
          failed_tests: 0,
          pending_tests: 0,
          todo_tests: 0,
        },
        executed_test_files: ["a.test.ts"],
      });
      for (const name of ["lint", "typecheck", "build"]) {
        records.push(
          phaseRecord({
            name,
            status: "SUCCEEDED",
            durationMs: 1,
            exitCode: 0,
            source,
          })
        );
      }
    }

    const summary = finalSummary({
      args: {
        mode: "shadow",
        "shard-count": "1",
        "run-url":
          "https://github.com/6529-Collections/6529seize-frontend/actions/runs/123",
        "base-sha": "a".repeat(40),
        environment: "STAGING",
        "gate-fingerprint": "b".repeat(64),
        "workflow-sha": "c".repeat(40),
        "workflow-digest": "d".repeat(64),
        "node-version": "22",
        "package-manager": "pnpm@10.14.0",
        "artifact-name": "release-bus-base-canary-summary-123",
        "jobs-file": jobsFile,
      },
      records,
      jobResults: {
        legacy: "success",
        lint: "success",
        typecheck: "success",
        build: "success",
        inventory: "success",
        jest: "success",
      },
    });

    expect(summary).toMatchObject({
      status: "SUCCEEDED",
      gate_mode: "shadow",
      equivalence: { equivalent: true },
    });
  });
});
