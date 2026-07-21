import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("Release Bus frontend gate contract", () => {
  const gate = read("scripts/release-bus-frontend-gate.sh");
  const preflight = read(".github/workflows/release-bus-preflight.yml");
  const isolation = read(".github/workflows/release-bus-isolate-candidate.yml");
  const canary = read(".github/workflows/release-bus-base-canary.yml");
  const appPrCi = read(".github/workflows/app-pr-ci.yml");

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
        "__tests__/scripts/release-bus-jest-reporting.test.ts",
        "__tests__/scripts/release-bus-shard-injection.test.ts",
      ]);
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
    expect(canary).toContain('RELEASE_BUS_REPO_ROOT="$GITHUB_WORKSPACE"');
    expect(canary).not.toContain("ref: ${{ inputs.base_sha }}");
  });

  it("keeps all required phases and deterministic shard controls", () => {
    for (const phase of ["lint", "typecheck", "unit_tests", "build"]) {
      expect(gate).toContain(phase);
    }
    expect(gate).toContain('--shard="$shard_index/$shard_count"');
    expect(gate).toContain("--bail=0");
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
