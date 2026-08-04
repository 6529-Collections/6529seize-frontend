import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type EffectivePlan = {
  checks: Record<string, { required: boolean }>;
};

function plan(changedFiles: string[]) {
  return {
    changed_files: changedFiles,
    checks: {
      install: { required: true, reason: "existing" },
      playwright_smoke: { required: true, reason: "superseded" },
      playwright_critical_shell: { required: true, reason: "superseded" },
      test_typecheck: { required: true, reason: "superseded" },
    },
  };
}

function executePlan(changedFiles: string[]): EffectivePlan {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "app-pr-ci-plan-"));
  const planPath = path.join(tempDir, "ci-plan.json");
  try {
    fs.writeFileSync(planPath, JSON.stringify(plan(changedFiles)));
    execFileSync(
      process.execPath,
      [
        path.join(process.cwd(), "scripts/app-pr-ci-effective-plan.cjs"),
        "--plan",
        planPath,
      ],
      { cwd: process.cwd(), stdio: "pipe" }
    );
    return JSON.parse(fs.readFileSync(planPath, "utf8")) as EffectivePlan;
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

describe("effective App PR CI plan", () => {
  it("keeps ordinary runtime changes on focused static checks", () => {
    const effective = executePlan(["components/header/AppHeader.tsx"]);

    expect(effective.checks.deadcode.required).toBe(false);
    expect(effective.checks.release_bus_contract.required).toBe(false);
    expect(effective.checks.test_typecheck.required).toBe(false);
    expect(effective.checks.playwright_smoke).toBeUndefined();
    expect(effective.checks.playwright_critical_shell).toBeUndefined();
  });

  it.each([
    "tests/pages/about.spec.ts",
    "__tests__/scripts/e2e-packs.test.ts",
    "tsconfig.playwright.json",
  ])("requires test typechecking for %s", (file) => {
    expect(executePlan([file]).checks.test_typecheck.required).toBe(true);
  });

  it.each([
    ".github/workflows/deploy-staging.yml",
    "ops/scripts/deploy-staging-artifact.sh",
    "tests/packs.manifest.cjs",
  ])("requires Release Bus contracts for %s", (file) => {
    expect(executePlan([file]).checks.release_bus_contract.required).toBe(true);
  });

  it("requires dead-code analysis for dependency changes or deleted runtime source", () => {
    expect(executePlan(["package.json"]).checks.deadcode.required).toBe(true);
    expect(
      executePlan(["lib/removed-runtime-source.ts"]).checks.deadcode.required
    ).toBe(true);
  });
});
