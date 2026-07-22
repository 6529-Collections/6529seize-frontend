import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const {
  aggregate,
  preflightContract,
}: {
  aggregate: (args: Record<string, string>) => Record<string, any>;
  preflightContract: (input: Record<string, unknown>) => Record<string, any>;
} = require("../../scripts/release-bus-preflight-evidence.cjs");

describe("Release Bus preflight evidence", () => {
  const baseFileContents = {
    "bin/6529": "runner",
    "jest.config.js": "config",
    "jest.setup.js": "setup",
    "package.json": JSON.stringify({ packageManager: "pnpm@10.14.0" }),
    "pnpm-lock.yaml": "lockfile",
  };
  const workflowFileContents = {
    ".github/workflows/release-bus-preflight.yml": "workflow",
    "scripts/release-bus-authorize-operation.sh": "authorize",
    "scripts/release-bus-build-profile.cjs": "profile",
    "scripts/release-bus-frontend-gate.sh": "gate",
    "scripts/release-bus-gate-evidence.cjs": "gate evidence",
    "scripts/release-bus-install-dependencies.cjs": "installer",
    "scripts/release-bus-preflight-evidence.cjs": "preflight evidence",
    "scripts/release-bus-report-progress.mjs": "reporter",
  };
  const input = {
    sourceSha: "a".repeat(40),
    workflowSha: "b".repeat(40),
    baseFileContents,
    workflowFileContents,
    shardCount: 2,
  };

  it("keys behavioral continuity on every executable contract byte", () => {
    const baseline = preflightContract(input);
    expect(preflightContract(input)).toEqual(baseline);
    expect(baseline).toMatchObject({
      kind: "frontend_preflight_contract",
      node_version: "22",
      package_manager: "pnpm@10.14.0",
      shard_count: 2,
      max_workers: 2,
    });

    for (const file of Object.keys(baseFileContents)) {
      const changedContents =
        file === "package.json"
          ? JSON.stringify({ packageManager: "pnpm@10.15.0" })
          : `${baseFileContents[file as keyof typeof baseFileContents]} changed`;
      const changed = preflightContract({
        ...input,
        baseFileContents: {
          ...baseFileContents,
          [file]: changedContents,
        },
      });
      expect(changed.behavior_digest).not.toBe(baseline.behavior_digest);
      expect(changed.gate_fingerprint).not.toBe(baseline.gate_fingerprint);
    }
    for (const file of Object.keys(workflowFileContents)) {
      const changed = preflightContract({
        ...input,
        workflowFileContents: {
          ...workflowFileContents,
          [file]: `${workflowFileContents[file as keyof typeof workflowFileContents]} changed`,
        },
      });
      expect(changed.behavior_digest).not.toBe(baseline.behavior_digest);
      expect(changed.gate_fingerprint).not.toBe(baseline.gate_fingerprint);
    }
  });

  it("separates behavioral identity from commit ancestry and exact source identity", () => {
    const baseline = preflightContract(input);
    const moved = preflightContract({
      ...input,
      sourceSha: "c".repeat(40),
      workflowSha: "d".repeat(40),
    });
    expect(moved.behavior_digest).toBe(baseline.behavior_digest);
    expect(moved.gate_fingerprint).not.toBe(baseline.gate_fingerprint);

    const resharded = preflightContract({ ...input, shardCount: 4 });
    expect(resharded.behavior_digest).not.toBe(baseline.behavior_digest);
    expect(resharded.gate_fingerprint).not.toBe(baseline.gate_fingerprint);
  });

  it("fail-closes unsupported shard and worker contracts", () => {
    expect(() => preflightContract({ ...input, shardCount: 3 })).toThrow(
      "Unsupported shard count"
    );
    expect(() => preflightContract({ ...input, maxWorkers: 3 })).toThrow(
      "Invalid Jest worker contract"
    );
    expect(() =>
      preflightContract({
        ...input,
        baseFileContents: { ...baseFileContents, "package.json": "{" },
      })
    ).toThrow("Invalid package-manager contract");
  });

  it.each([
    ["STAGING", "staging", "true"],
    ["PRODUCTION", "production", "false"],
  ])(
    "binds one %s compilation to the exact immutable deploy artifact",
    (targetLane, buildEnvironment, promotionEligible) => {
      const evidenceRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "release-bus-preflight-aggregate-")
      );
      const jobResultsFile = path.join(evidenceRoot, "job-results.json");
      const identity = {
        base_sha: "a".repeat(40),
        environment: "orchestration",
        build_profile_digest: "b".repeat(64),
        gate_fingerprint: "c".repeat(64),
        workflow_sha: "d".repeat(40),
        workflow_digest: "e".repeat(64),
        node_version: "22",
        package_manager: "pnpm@10.14.0",
      };
      const counts = {
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
      };
      const records = [
        {
          schema_version: 1,
          kind: "manifest",
          ...identity,
          source: "parallel",
          scope: "all",
          files: ["__tests__/a.test.ts"],
        },
        {
          schema_version: 1,
          kind: "manifest",
          ...identity,
          source: "parallel",
          scope: "shard",
          shard_index: 1,
          shard_count: 1,
          files: ["__tests__/a.test.ts"],
        },
        {
          schema_version: 1,
          kind: "jest_shard",
          ...identity,
          source: "parallel",
          shard_index: 1,
          shard_count: 1,
          status: "SUCCEEDED",
          duration_ms: 10,
          counts,
          executed_test_files: ["__tests__/a.test.ts"],
        },
        ...["lint", "typecheck", "build"].map((name) => ({
          schema_version: 1,
          kind: "phase",
          ...identity,
          source: "parallel",
          name,
          status: "SUCCEEDED",
          duration_ms: 10,
          exit_code: 0,
        })),
        {
          schema_version: 1,
          kind: "dependency_install",
          ...identity,
          source: "parallel",
          build_environment: buildEnvironment,
          status: "SUCCEEDED",
          failure_class: null,
          failure_code: null,
        },
        {
          schema_version: 1,
          kind: "immutable_build_artifact",
          artifact_name: `release-bus-frontend-train-1-r1-${buildEnvironment}`,
          run_id: "123",
          source_sha: identity.base_sha,
          environment: buildEnvironment,
          package_digest: "f".repeat(64),
          upload_digest: "1".repeat(64),
          build_profile_digest: identity.build_profile_digest,
        },
      ];
      records.forEach((record, index) =>
        fs.writeFileSync(
          path.join(evidenceRoot, `record-${index}.json`),
          JSON.stringify(record)
        )
      );
      fs.writeFileSync(
        jobResultsFile,
        JSON.stringify({
          lint: "success",
          typecheck: "success",
          build: "success",
          inventory: "success",
          jest: "success",
          source_mutation: "success",
          promotion_eligible: promotionEligible,
        })
      );

      try {
        const summary = aggregate({
          mode: "sharded",
          "shard-count": "1",
          "evidence-root": evidenceRoot,
          "job-results": jobResultsFile,
          "source-sha": identity.base_sha,
          environment: identity.environment,
          "gate-fingerprint": identity.gate_fingerprint,
          "behavior-digest": "2".repeat(64),
          "workflow-sha": identity.workflow_sha,
          "workflow-digest": identity.workflow_digest,
          "node-version": identity.node_version,
          "package-manager": identity.package_manager,
          "build-profile-digest": identity.build_profile_digest,
          "target-lane": targetLane,
          "run-url":
            "https://github.com/6529-Collections/6529seize-frontend/actions/runs/123",
          "artifact-name": "release-bus-preflight-summary-123",
        });

        expect(summary).toMatchObject({
          status: "SUCCEEDED",
          build_environments: [buildEnvironment],
          build_coverage: {
            authoritative_profile: "SUCCEEDED",
            compilation_count: 1,
            deployed_artifact_bound: true,
          },
          immutable_artifact: {
            environment: buildEnvironment,
            source_sha: identity.base_sha,
            package_digest: "f".repeat(64),
            upload_digest: "1".repeat(64),
          },
        });
      } finally {
        fs.rmSync(evidenceRoot, { recursive: true, force: true });
      }
    }
  );
});
