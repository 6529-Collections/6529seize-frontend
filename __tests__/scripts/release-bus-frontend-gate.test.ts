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
  const authorization = read("scripts/release-bus-authorize-operation.sh");
  const appPrCi = read(".github/workflows/app-pr-ci.yml");
  const reporter = read("scripts/release-bus-report-progress.mjs");
  const stagingE2e = read(".github/workflows/staging-e2e.yml");

  type WorkflowStep = {
    env?: Record<string, string>;
    name?: string;
    run?: string;
    uses?: string;
    with?: Record<string, unknown>;
  };

  const canaryWorkflow = parseYaml(canary) as {
    on?: {
      workflow_dispatch?: {
        inputs?: Record<string, { required?: boolean }>;
      };
    };
    jobs?: Record<
      string,
      {
        needs?: string[] | string;
        outputs?: Record<string, string>;
        steps?: WorkflowStep[];
        "timeout-minutes"?: number;
      }
    >;
  };
  const preflightWorkflow = parseYaml(preflight) as {
    on?: {
      workflow_dispatch?: {
        inputs?: Record<string, { required?: boolean }>;
      };
    };
    jobs?: Record<
      string,
      {
        env?: Record<string, string>;
        needs?: string[] | string;
        outputs?: Record<string, string>;
        permissions?: Record<string, string>;
        steps?: WorkflowStep[];
        strategy?: { "fail-fast"?: boolean };
        "timeout-minutes"?: number;
      }
    >;
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
    expect(authorization).toContain('"$api_url/deploy/release-bus/authorize"');
    expect(canary).toContain("release-bus-report-progress.mjs");
    expect(canary).toContain("Report sanitized terminal evidence");
    const buildProfileStep = Object.values(canaryWorkflow.jobs ?? {})
      .flatMap((job) => job.steps ?? [])
      .find((step) => step.name === "Derive protected staging build profile");
    expect(buildProfileStep?.run).toContain(
      'git cat-file -e "$WORKFLOW_SHA^{commit}"'
    );
    expect(buildProfileStep?.run?.indexOf("git cat-file")).toBeLessThan(
      buildProfileStep?.run?.indexOf("git show") ?? -1
    );
    const buildProfileJob = canaryWorkflow.jobs?.build_profile;
    const authorizeJob = canaryWorkflow.jobs?.authorize;
    expect(buildProfileJob?.outputs).toBeUndefined();
    expect(authorizeJob?.needs).toBe("build_profile");
    expect(buildProfileJob?.steps?.map((step) => step.name)).toEqual(
      expect.arrayContaining([
        "Derive protected staging build profile",
        "Upload protected build profile",
      ])
    );
    expect(authorizeJob?.steps?.map((step) => step.name)).toEqual(
      expect.arrayContaining([
        "Download protected build profile",
        "Verify protected staging build profile",
      ])
    );
    expect(
      authorizeJob?.steps?.some((step) =>
        Object.keys(step.env ?? {}).includes("ALCHEMY_API_KEY")
      )
    ).toBe(false);
    const canaryFetches = canary
      .split("\n")
      .filter((line) => line.includes("git fetch --no-tags"));
    expect(canaryFetches.length).toBeGreaterThan(0);
    expect(canaryFetches.every((line) => line.includes("--depth=1"))).toBe(
      true
    );
    expect(reporter).toContain("/deploy/release-bus/report-progress");
  });

  it("fails closed and reports retryable dependency failures from staging E2E", () => {
    expect(stagingE2e).toContain(
      "scripts/release-bus-install-dependencies.cjs"
    );
    expect(stagingE2e).toContain("continue-on-error: true");
    expect(stagingE2e).toContain("Report structured Release Bus E2E result");
    expect(stagingE2e).toContain("Return staging E2E result");
    expect(stagingE2e).toContain('run: node "$RELEASE_BUS_INSTALL_TOOL"');
    expect(stagingE2e).not.toContain("run: ./bin/6529 install:frozen");
    expect(reporter).toContain("RELEASE_BUS_INSTALL_EVIDENCE");
  });

  it("bounds and retries an ambiguous authorization transport failure", () => {
    expect(canaryWorkflow.jobs?.authorize?.["timeout-minutes"]).toBe(10);
    expect(canary).toContain(
      'git show "$WORKFLOW_SHA:scripts/release-bus-authorize-operation.sh"'
    );

    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "release-bus-authorize-")
    );
    const attemptFile = path.join(tempDir, "attempts.txt");
    try {
      fs.writeFileSync(
        path.join(tempDir, "curl"),
        `#!/usr/bin/env bash\ncount=0\nif [ -f "$RELEASE_BUS_ATTEMPT_FILE" ]; then count="$(cat "$RELEASE_BUS_ATTEMPT_FILE")"; fi\ncount=$((count + 1))\nprintf '%s' "$count" > "$RELEASE_BUS_ATTEMPT_FILE"\nif [ "$count" -eq 1 ]; then exit 28; fi\nprintf '200'\n`
      );
      fs.writeFileSync(path.join(tempDir, "sleep"), "#!/usr/bin/env bash\n");
      fs.chmodSync(path.join(tempDir, "curl"), 0o755);
      fs.chmodSync(path.join(tempDir, "sleep"), 0o755);

      execFileSync(
        "bash",
        ["scripts/release-bus-authorize-operation.sh", '{"operation":"same"}'],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            PATH: `${tempDir}:${process.env.PATH}`,
            RELEASE_BUS_API_URL: "https://api.example.test",
            RELEASE_BUS_ATTEMPT_FILE: attemptFile,
            RELEASE_BUS_WORKFLOW_AUTH_TOKEN: "test-token",
          },
        }
      );

      expect(fs.readFileSync(attemptFile, "utf8")).toBe("2");
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("does not retry a deterministic authorization rejection", () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "release-bus-authorize-reject-")
    );
    const attemptFile = path.join(tempDir, "attempts.txt");
    try {
      fs.writeFileSync(
        path.join(tempDir, "curl"),
        `#!/usr/bin/env bash\nprintf '1' > "$RELEASE_BUS_ATTEMPT_FILE"\nprintf '409'\n`
      );
      fs.chmodSync(path.join(tempDir, "curl"), 0o755);

      expect(() =>
        execFileSync(
          "bash",
          [
            "scripts/release-bus-authorize-operation.sh",
            '{"operation":"same"}',
          ],
          {
            cwd: process.cwd(),
            env: {
              ...process.env,
              PATH: `${tempDir}:${process.env.PATH}`,
              RELEASE_BUS_API_URL: "https://api.example.test",
              RELEASE_BUS_ATTEMPT_FILE: attemptFile,
              RELEASE_BUS_WORKFLOW_AUTH_TOKEN: "test-token",
            },
            stdio: "pipe",
          }
        )
      ).toThrow();
      expect(fs.readFileSync(attemptFile, "utf8")).toBe("1");
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("owns the only Release Bus Jest invocation", () => {
    expect(gate).toContain(
      '"$SEIZE_BIN" run test:no-coverage --maxWorkers=2 --bail=0 "$@"'
    );
    expect(gate).not.toContain("--runInBand");
    expect(gate).not.toContain("test:no-coverage -- --runInBand");

    for (const workflow of [preflight, isolation, canary]) {
      expect(workflow).not.toContain("test:no-coverage");
    }
  });

  it("runs the contract when any fingerprinted base file changes", () => {
    for (const baseFile of [
      "bin/6529",
      "jest.config.js",
      "jest.setup.js",
      "package.json",
      "pnpm-lock.yaml",
    ]) {
      expect(appPrCi).toContain(`${baseFile} \\`);
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
        "--maxWorkers=2",
        "--bail=0",
        "--runTestsByPath",
        "__tests__/scripts/release-bus-frontend-gate.test.ts",
        "__tests__/scripts/release-bus-gate-evidence.test.ts",
        "__tests__/scripts/release-bus-install-dependencies.test.ts",
        "__tests__/scripts/release-bus-jest-reporting.test.ts",
        "__tests__/scripts/release-bus-preflight-evidence.test.ts",
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
      RELEASE_BUS_BUILD_PROFILE_DIGEST: "e".repeat(64),
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
        build_profile_digest: identity.RELEASE_BUS_BUILD_PROFILE_DIGEST,
        node_version: identity.RELEASE_BUS_NODE_VERSION,
        package_manager: identity.RELEASE_BUS_PACKAGE_MANAGER,
      });
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("is shared by preflight, isolation, and exact-base canary", () => {
    expect(preflight).toContain('"$RELEASE_BUS_GATE_TOOL" phase lint');
    expect(preflight).toContain('"$RELEASE_BUS_GATE_TOOL" phase typecheck');
    expect(preflight).toContain('"$RELEASE_BUS_GATE_TOOL" phase build');
    expect(preflight).toContain('"$RELEASE_BUS_GATE_TOOL" inventory');
    expect(preflight).toContain('"$RELEASE_BUS_GATE_TOOL" jest');
    expect(isolation).toContain("./scripts/release-bus-frontend-gate.sh full");
    expect(canary).toContain('"$RELEASE_BUS_GATE_TOOL" serial');
    expect(canary).toContain('"$RELEASE_BUS_GATE_TOOL" phase lint');
    expect(canary).toContain('"$RELEASE_BUS_GATE_TOOL" phase typecheck');
    expect(canary).toContain('"$RELEASE_BUS_GATE_TOOL" phase build');
    expect(canary).toContain('"$RELEASE_BUS_GATE_TOOL" jest');
    expect(canary).toContain(
      'git fetch --no-tags --depth=1 origin "$BASE_SHA"'
    );
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
    expect(aggregate?.env?.MUTATION_RESULT).toBe(
      "${{ steps.source-mutation.outcome }}"
    );
    expect(aggregate?.run).toContain('[[ "$BASE_SHA" =~ ^[a-f0-9]{40}$ ]]');
    expect(aggregate?.run?.match(/--base-sha "\$BASE_SHA"/g)).toHaveLength(2);
    expect(aggregate?.run).toContain(
      '--arg source_mutation "$MUTATION_RESULT"'
    );

    const report = steps.find(
      (step) => step.name === "Report sanitized terminal evidence"
    );
    expect(report?.env?.RELEASE_BUS_AGGREGATE_SUMMARY).toBe(
      "${{ runner.temp }}/release-bus-base-canary-summary.json"
    );
    expect(report?.env?.RELEASE_BUS_OPERATION_KEY).toBe(
      "${{ inputs.operation_key }}"
    );
    expect(report?.env?.RELEASE_BUS_TRAIN_ID).toBe(
      "${{ inputs.release_train_id }}"
    );
    expect(report?.run).toContain('node "$RELEASE_BUS_REPORT_TOOL"');

    const aggregateSteps = canaryWorkflow.jobs?.aggregate?.steps ?? [];
    const sourceMutationIndex = aggregateSteps.findIndex(
      (step) => step.name === "Verify gate did not mutate source"
    );
    const aggregateIndex = aggregateSteps.findIndex(
      (step) => step.name === "Aggregate fail-closed evidence"
    );
    const reportIndex = aggregateSteps.findIndex(
      (step) => step.name === "Report sanitized terminal evidence"
    );
    expect(sourceMutationIndex).toBeGreaterThanOrEqual(0);
    expect(sourceMutationIndex).toBeLessThan(aggregateIndex);
    expect(aggregateIndex).toBeLessThan(reportIndex);

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
    expect(preflight).toContain("fail-fast: false");
    expect(preflight).toContain("FRONTEND_PREFLIGHT_SHARD_COUNT");
    expect(preflight).toContain("validation_shard_count");
    expect(preflight).toContain("validation_inject_failure");
    expect(preflight).toContain("RELEASE_BUS_INJECT_SHARD_FAILURE");
    expect(preflight).toContain("Aggregate fail-closed preflight evidence");
    expect(preflight).toContain("release-bus-preflight-evidence.cjs");
    expect(canary).toContain("FRONTEND_GATE_SHARD_COUNT");
    expect(canary).toContain("RELEASE_BUS_FRONTEND_GATE_MODE");
    expect(canary).toContain("validation_only");
    expect(canary).toContain("inputs.validation_only != true");
    expect(canary).toContain("validation_inject_failure");
    expect(canary).toContain('test "$VALIDATION_ONLY" = true');
    expect(canary).toContain("RELEASE_BUS_INJECT_SHARD_FAILURE");
    expect(gate).toContain("manifest-error");
    expect(gate).toContain("injected_failure=1");
    expect(gate).toContain('[ "$shard_index" -eq "$shard_count" ]');
    expect(gate).toContain('--injected-failure "$injected_failure"');
    expect(gate).not.toContain("release-bus-shard-injection.test.ts");
  });

  it("executes its argument-forwarding contract in ordinary PR CI", () => {
    expect(appPrCi).toContain(
      "./scripts/release-bus-frontend-gate.sh contract"
    );
    expect(appPrCi).toContain("scripts/release-bus-authorize-operation.sh");
    expect(appPrCi).toContain("scripts/release-bus-gate-evidence.cjs");
    expect(appPrCi).toContain("scripts/release-bus-install-dependencies.cjs");
    expect(appPrCi).toContain("scripts/release-bus-preflight-evidence.cjs");
    expect(appPrCi).toContain(
      "__tests__/scripts/release-bus-gate-evidence.test.ts"
    );
  });

  it("keeps preflight dispatch backward compatible and fail-closed", () => {
    const inputs = preflightWorkflow.on?.workflow_dispatch?.inputs ?? {};
    expect(
      Object.entries(inputs)
        .filter(([, contract]) => contract.required === true)
        .map(([name]) => name)
        .sort()
    ).toEqual(
      [
        "release_train_id",
        "release_train_revision",
        "operation_key",
        "target_lane",
        "release_branch",
        "deploy_units",
        "expected_sha",
      ].sort()
    );
    expect(inputs.validation_only?.required).toBe(false);
    expect(inputs.validation_shard_count?.required).toBe(false);
    expect(inputs.validation_inject_failure?.required).toBe(false);
    expect(preflightWorkflow.jobs?.authorize?.needs).toBe("build_profile");
    expect(preflightWorkflow.jobs?.authorize?.["timeout-minutes"]).toBe(10);
    expect(preflightWorkflow.jobs?.jest?.strategy?.["fail-fast"]).toBe(false);
    expect(preflightWorkflow.jobs?.build?.strategy).toBeUndefined();
    expect(preflightWorkflow.jobs?.build?.env).toMatchObject({
      BUILD_ENVIRONMENT: "${{ needs.authorize.outputs.build_environment }}",
    });
    expect(preflightWorkflow.jobs?.build?.env).not.toHaveProperty(
      "RELEASE_BUS_INSTALL_EVIDENCE"
    );
    const buildEvidenceStep = preflightWorkflow.jobs?.build?.steps?.find(
      (step) => step.name === "Select build dependency evidence path"
    );
    expect(buildEvidenceStep?.env).toBeUndefined();
    expect(buildEvidenceStep?.run).toBe(
      'echo "RELEASE_BUS_INSTALL_EVIDENCE=$RUNNER_TEMP/release-bus-evidence/dependency-install-$BUILD_ENVIRONMENT.json" >> "$GITHUB_ENV"'
    );
    expect(preflightWorkflow.jobs?.authorize?.outputs).toMatchObject({
      inject_failure: "${{ steps.inputs.outputs.inject_failure }}",
      build_profile_digest: "${{ steps.build-profile.outputs.digest }}",
    });
    const buildProfileSteps =
      preflightWorkflow.jobs?.build_profile?.steps ?? [];
    expect(preflightWorkflow.jobs?.build_profile?.permissions).toEqual({
      contents: "read",
    });
    expect(
      buildProfileSteps.find(
        (step) => step.name === "Derive protected target build profile"
      )?.env
    ).toHaveProperty("RELEASE_BUS_BUILD_PROFILE_HMAC_KEY");
    expect(
      buildProfileSteps.find(
        (step) => step.name === "Upload protected build profile"
      )
    ).toMatchObject({
      uses: expect.stringContaining("actions/upload-artifact@"),
      with: expect.objectContaining({
        name: "release-bus-preflight-build-profile-${{ github.run_id }}",
        "retention-days": 1,
      }),
    });
    const authorizeSteps = preflightWorkflow.jobs?.authorize?.steps ?? [];
    expect(
      authorizeSteps.find(
        (step) => step.name === "Download protected build profile"
      )
    ).toMatchObject({
      uses: expect.stringContaining("actions/download-artifact@"),
      with: expect.objectContaining({
        name: "release-bus-preflight-build-profile-${{ github.run_id }}",
      }),
    });
    expect(
      authorizeSteps.find(
        (step) => step.name === "Verify protected target build profile"
      )?.run
    ).toContain("digest=$(jq -r '.digest' \"$profile\")");
    const nonProducerJobs = Object.fromEntries(
      Object.entries(preflightWorkflow.jobs ?? {}).filter(
        ([name]) => name !== "build_profile"
      )
    );
    expect(JSON.stringify(nonProducerJobs)).not.toContain(
      "RELEASE_BUS_BUILD_PROFILE_HMAC_KEY"
    );
    expect(preflightWorkflow.jobs?.aggregate?.needs).toEqual([
      "authorize",
      "lint",
      "typecheck",
      "jest-inventory",
      "jest",
      "build",
    ]);

    const steps = Object.values(preflightWorkflow.jobs ?? {}).flatMap(
      (job) => job.steps ?? []
    );
    for (const step of steps) {
      expect(step.run ?? "").not.toMatch(/\$\{\{\s*inputs\./);
    }
    const aggregate = steps.find(
      (step) => step.name === "Aggregate fail-closed preflight evidence"
    );
    const jestGate = preflightWorkflow.jobs?.jest?.steps?.find(
      (step) => step.name === "Run complete deterministic Jest shard"
    );
    expect(jestGate?.env).toMatchObject({
      RELEASE_BUS_INJECT_SHARD_FAILURE:
        "${{ needs.authorize.outputs.inject_failure == 'true' && '1' || '0' }}",
    });
    expect(aggregate?.env).toMatchObject({
      INVENTORY_RESULT: "${{ needs.jest-inventory.result }}",
      JEST_RESULT: "${{ needs.jest.result }}",
      LINT_RESULT: "${{ needs.lint.result }}",
      PROMOTION_ELIGIBLE: "${{ needs.authorize.outputs.promotion_eligible }}",
      TYPECHECK_RESULT: "${{ needs.typecheck.result }}",
    });
    expect(aggregate?.run).toContain(
      '--arg source_mutation "$MUTATION_RESULT"'
    );
    expect(aggregate?.run).toContain(
      'test "$PASSED_BEHAVIOR_DIGEST" = "$behavior_digest"'
    );
    expect(aggregate?.run).toContain('"$RELEASE_BUS_GATE_TOOL" fingerprint');
    expect(aggregate?.run).not.toContain('node "$RELEASE_BUS_GATE_TOOL"');
    expect(preflight).toContain('test "$VALIDATION_ONLY" = true');
    expect(preflight).toContain(
      'echo "inject_failure=$VALIDATION_INJECT_FAILURE"'
    );
    expect(preflight).toContain(
      'git show "$WORKFLOW_SHA:scripts/release-bus-authorize-operation.sh"'
    );
    expect(preflight).toContain('if [ "$PROMOTION_ELIGIBLE" = true ]; then');
    expect(preflight).toContain("Report terminal preflight base evidence");
    expect(preflight).not.toContain("matrix.environment");
    expect(preflight).not.toContain("base-canary-build");
    expect(preflight.match(/name: Build immutable application/g)).toHaveLength(
      1
    );
    expect(preflight).toContain(
      "Bind the single target compilation to its immutable artifact"
    );
  });
});
