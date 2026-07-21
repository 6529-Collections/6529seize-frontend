import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parse as parseYaml } from "yaml";

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("Release Bus frontend gate contract", () => {
  const gate = read("scripts/release-bus-frontend-gate.sh");
  const preflight = read(".github/workflows/release-bus-preflight.yml");
  const isolation = read(".github/workflows/release-bus-isolate-candidate.yml");
  const canary = read(".github/workflows/release-bus-base-canary.yml");
  const appPrCi = read(".github/workflows/app-pr-ci.yml");

  type WorkflowStep = {
    env?: Record<string, string>;
    name?: string;
    run?: string;
  };

  const canaryWorkflow = parseYaml(canary) as {
    on?: {
      workflow_dispatch?: {
        inputs?: Record<string, { required?: boolean }>;
      };
    };
    jobs?: Record<string, { steps?: WorkflowStep[] }>;
  };

  it("keeps deployed worker dispatch and authorization backward compatible", () => {
    const inputs = canaryWorkflow.on?.workflow_dispatch?.inputs ?? {};
    expect(
      Object.entries(inputs)
        .filter(([, contract]) => contract.required === true)
        .map(([name]) => name)
        .sort()
    ).toEqual(
      [
        "base_sha",
        "expected_sha",
        "operation_key",
        "release_train_id",
        "release_train_revision",
      ].sort()
    );
    expect(inputs.gate_contract?.required).toBe(false);
    expect(inputs.validation_only?.required).toBe(false);
    expect(canary).toContain(
      '\'{train_id:$train_id,operation_key:$operation_key,workflow_run_id:$workflow_run_id,artifact_run_id:null,repository:"frontend",environment:"orchestration",service:null,expected_sha:$expected_sha,artifact_digest:null}\''
    );
    expect(canary).toContain(
      "$RELEASE_BUS_API_URL/deploy/release-bus/authorize"
    );
    expect(canary).not.toContain("/deploy/release-bus/report-progress");
    expect(canary).not.toContain("release-bus-report-progress.mjs");
  });

  it("owns the only Release Bus Jest invocation", () => {
    expect(gate).toContain(
      '"$SEIZE_BIN" run test:no-coverage --runInBand --bail=0 "$@"'
    );
    expect(gate).not.toContain("test:no-coverage -- --runInBand");

    for (const workflow of [preflight, isolation, canary]) {
      expect(workflow).not.toContain("test:no-coverage");
    }
  });

  it("forwards the contract arguments to the 6529 runner exactly", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "release-bus-gate-"));
    const runner = path.join(tempDir, "fake-6529");
    const argumentLog = path.join(tempDir, "arguments.txt");
    try {
      fs.writeFileSync(
        runner,
        '#!/usr/bin/env bash\nprintf "%s\\n" "$@" > "$RELEASE_BUS_ARGS_LOG"\n'
      );
      fs.chmodSync(runner, 0o755);

      execFileSync(
        "bash",
        ["scripts/release-bus-frontend-gate.sh", "contract"],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            RELEASE_BUS_6529_BIN: runner,
            RELEASE_BUS_ARGS_LOG: argumentLog,
          },
        }
      );

      expect(fs.readFileSync(argumentLog, "utf8").trim().split("\n")).toEqual([
        "run",
        "test:no-coverage",
        "--runInBand",
        "--bail=0",
        "--runTestsByPath",
        "__tests__/scripts/release-bus-frontend-gate.test.ts",
        "__tests__/scripts/release-bus-gate-evidence.test.ts",
        "__tests__/scripts/release-bus-shard-injection.test.ts",
      ]);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("binds immutable identity to emitted phase evidence", () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "release-bus-evidence-")
    );
    const runner = path.join(tempDir, "fake-6529");
    const outputDir = path.join(tempDir, "evidence");
    const identity = {
      RELEASE_BUS_BASE_SHA: "a".repeat(40),
      RELEASE_BUS_EVIDENCE_ENVIRONMENT: "orchestration",
      RELEASE_BUS_GATE_FINGERPRINT: "b".repeat(64),
      RELEASE_BUS_WORKFLOW_SHA: "c".repeat(40),
      RELEASE_BUS_WORKFLOW_DIGEST: "d".repeat(64),
      RELEASE_BUS_NODE_VERSION: "22",
      RELEASE_BUS_PACKAGE_MANAGER: "pnpm@10.14.0",
    };
    try {
      fs.writeFileSync(runner, "#!/usr/bin/env bash\nexit 0\n");
      fs.chmodSync(runner, 0o755);

      execFileSync(
        "bash",
        ["scripts/release-bus-frontend-gate.sh", "phase", "lint", outputDir],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            ...identity,
            RELEASE_BUS_6529_BIN: runner,
          },
        }
      );

      expect(
        JSON.parse(
          fs.readFileSync(path.join(outputDir, "phase-lint.json"), "utf8")
        )
      ).toMatchObject({
        kind: "phase",
        source: "parallel",
        name: "lint",
        status: "SUCCEEDED",
        base_sha: identity.RELEASE_BUS_BASE_SHA,
        environment: identity.RELEASE_BUS_EVIDENCE_ENVIRONMENT,
        gate_fingerprint: identity.RELEASE_BUS_GATE_FINGERPRINT,
        workflow_sha: identity.RELEASE_BUS_WORKFLOW_SHA,
        workflow_digest: identity.RELEASE_BUS_WORKFLOW_DIGEST,
        node_version: identity.RELEASE_BUS_NODE_VERSION,
        package_manager: identity.RELEASE_BUS_PACKAGE_MANAGER,
      });
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("is shared by preflight, isolation, and exact-base canary", () => {
    expect(preflight).toContain(
      "./scripts/release-bus-frontend-gate.sh validate"
    );
    expect(isolation).toContain("./scripts/release-bus-frontend-gate.sh full");
    expect(canary).toContain('"$RELEASE_BUS_GATE_TOOL" serial');
    expect(canary).toContain('"$RELEASE_BUS_GATE_TOOL" phase lint');
    expect(canary).toContain('"$RELEASE_BUS_GATE_TOOL" phase typecheck');
    expect(canary).toContain('"$RELEASE_BUS_GATE_TOOL" phase build');
    expect(canary).toContain('"$RELEASE_BUS_GATE_TOOL" jest');
    expect(canary).toContain('git fetch --no-tags origin "$BASE_SHA"');
    expect(canary).toContain('git show "$WORKFLOW_SHA:$file"');
    expect(canary).toContain("Derive and verify immutable gate fingerprint");
    expect(canary).toContain("RELEASE_BUS_GATE_FINGERPRINT=$GATE_FINGERPRINT");
    expect(canary).toContain("behavior_digest");
    expect(canary).toContain('--behavior-digest "$behavior_digest"');
    expect(canary).not.toContain("gate_fingerprint=unversioned");
    expect(canary).toContain('RELEASE_BUS_REPO_ROOT="$GITHUB_WORKSPACE"');
    expect(canary).not.toContain("ref: ${{ inputs.base_sha }}");
  });

  it("passes untrusted workflow inputs through the environment before shell use", () => {
    const steps = Object.values(canaryWorkflow.jobs ?? {}).flatMap(
      (job) => job.steps ?? []
    );
    for (const step of steps) {
      expect(step.run ?? "").not.toMatch(/\$\{\{\s*inputs\./);
    }

    const aggregate = steps.find(
      (step) => step.name === "Aggregate fail-closed evidence"
    );
    expect(aggregate?.env?.BASE_SHA).toBe("${{ inputs.base_sha }}");
    expect(aggregate?.run).toContain('[[ "$BASE_SHA" =~ ^[a-f0-9]{40}$ ]]');
    expect(aggregate?.run?.match(/--base-sha "\$BASE_SHA"/g)).toHaveLength(2);

    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "release-bus-input-")
    );
    const marker = path.join(tempDir, "shell-interpolation-ran");
    const validator = path.join(tempDir, "validate-base-sha");
    const maliciousBaseSha = `$(touch ${marker})`;
    try {
      fs.writeFileSync(
        validator,
        '#!/usr/bin/env bash\nset -euo pipefail\n[[ "$BASE_SHA" =~ ^[a-f0-9]{40}$ ]]\n'
      );
      fs.chmodSync(validator, 0o755);
      expect(() =>
        execFileSync(validator, [], {
          env: { ...process.env, BASE_SHA: maliciousBaseSha },
          stdio: "ignore",
        })
      ).toThrow();
      expect(fs.existsSync(marker)).toBe(false);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("keeps all required phases and deterministic shard controls", () => {
    for (const phase of ["lint", "typecheck", "unit_tests", "build"]) {
      expect(gate).toContain(phase);
    }
    expect(gate).toContain('--shard="$shard_index/$shard_count"');
    expect(gate).toContain("--bail=0");
    expect(gate).toContain('raw_dir="$(mktemp -d');
    expect(gate).toContain('results="$raw_dir/jest-results.json"');
    expect(gate).not.toContain('results="$output_dir/jest-results');
    for (const identityFlag of [
      "--base-sha",
      "--environment",
      "--gate-fingerprint",
      "--workflow-sha",
      "--workflow-digest",
      "--node-version",
      "--package-manager",
    ]) {
      expect(gate).toContain(identityFlag);
    }
    expect(canary).toContain("fail-fast: false");
    expect(canary).toContain("FRONTEND_GATE_SHARD_COUNT");
    expect(canary).toContain("RELEASE_BUS_FRONTEND_GATE_MODE");
    expect(canary).toContain("validation_only");
    expect(canary).toContain("inputs.validation_only != true");
    expect(canary).toContain("validation_inject_failure");
    expect(canary).toContain('test "$VALIDATION_ONLY" = true');
    expect(canary).toContain("RELEASE_BUS_INJECT_SHARD_FAILURE");
  });

  it("executes its argument-forwarding contract in ordinary PR CI", () => {
    expect(appPrCi).toContain(
      "./scripts/release-bus-frontend-gate.sh contract"
    );
  });
});
