import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type EffectivePlan = {
  checks: {
    deployment_contract: { required: boolean };
    test_typecheck: { required: boolean };
    playwright_smoke?: { required: boolean };
    playwright_critical_shell?: { required: boolean };
    playwright_museum: { required: boolean };
    install: { required: boolean };
  };
};

function plan(changedFiles: string[]) {
  return {
    changed_files: changedFiles,
    checks: {
      install: { required: true, reason: "existing" },
      lint_changed: { required: true, reason: "existing" },
      typecheck_changed: { required: true, reason: "existing" },
      jest_changed: { required: true, reason: "existing" },
      build: { required: true, reason: "existing" },
      playwright_smoke: { required: true, reason: "superseded" },
      playwright_critical_shell: { required: true, reason: "superseded" },
      dependency_governance: { required: false, reason: "existing" },
      reviewbot_contract: { required: false, reason: "existing" },
      agent_files_sync: { required: false, reason: "existing" },
      test_typecheck: { required: true, reason: "superseded" },
    },
  };
}

function executeRawPlan(rawPlan: unknown): EffectivePlan {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "app-pr-ci-plan-"));
  const planPath = path.join(tempDir, "ci-plan.json");
  try {
    fs.writeFileSync(planPath, JSON.stringify(rawPlan));
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

function executePlan(changedFiles: string[]): EffectivePlan {
  return executeRawPlan(plan(changedFiles));
}

describe("effective App PR CI plan", () => {
  it("preserves risk-selected browser checks for ordinary runtime changes", () => {
    const effective = executePlan(["components/header/AppHeader.tsx"]);

    expect(effective.checks.deployment_contract.required).toBe(false);
    expect(effective.checks.test_typecheck.required).toBe(false);
    expect(effective.checks.playwright_smoke?.required).toBe(true);
    expect(effective.checks.playwright_critical_shell?.required).toBe(true);
  });

  it("requires the installed quality lane for every pull request", () => {
    const rawPlan = plan(["README.md"]);
    rawPlan.checks.install = {
      required: false,
      reason: "No installed checks selected.",
    };

    const effective = executeRawPlan(rawPlan);

    expect(effective.checks.install.required).toBe(true);
    expect(effective.checks).not.toHaveProperty("deadcode");
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
    "ops/docs/developer/frontend-deployment.md",
    "ops/skills/deploy-6529/SKILL.md",
    "ops/scripts/deploy-staging-artifact.sh",
    "ops/scripts/artifact-portability-report-source.cjs",
    "scripts/museum-release-tier.cjs",
    "ops/testing-strategy/museum-surface-registry.v1.json",
    "tests/packs.manifest.cjs",
    "components/museum/MuseumNetworkProposition.tsx",
    "__tests__/components/museum/MuseumNetworkProposition.test.tsx",
    "__tests__/scripts/deployment-e2e-workflows.test.ts",
  ])("requires frontend deployment contracts for %s", (file) => {
    expect(executePlan([file]).checks.deployment_contract.required).toBe(true);
  });

  it("rejects malformed portability paths without ambiguous backtracking", () => {
    const malformed = `ops/scripts/artifact-portability-${"--".repeat(5_000)}.cjs`;

    expect(executePlan([malformed]).checks.deployment_contract.required).toBe(
      false
    );
  });

  it.each([
    "app/museum/network/page.tsx",
    "components/museum/MuseumShell.tsx",
    "lib/museum/publication/load.ts",
    "config/museumPublicationEnv.server.ts",
    "tests/museum/institutional-practice-readonly.spec.ts",
    "i18n/messages/museum.en-US.json",
    "styles/museum.css",
    "public/museum/about-proposition.avif",
    ".github/workflows/staging-e2e.yml",
    "scripts/museum-release-selection.cjs",
  ])("requires the isolated Museum browser lane for %s", (file) => {
    const effective = executePlan([file]);

    expect(effective.checks.playwright_museum.required).toBe(true);
    expect(effective.checks.install.required).toBe(true);
  });

  it.each([
    "app/about/page.tsx",
    "components/header/AppHeader.tsx",
    "tests/pages/about.spec.ts",
    "ops/docs/developer/release.md",
    "ops/docs/museum/release.md",
    "ops/help/help-index.json",
    "public/museum.png",
    "README.md",
  ])("does not run Museum browser coverage for unrelated change %s", (file) => {
    expect(executePlan([file]).checks.playwright_museum.required).toBe(false);
  });

  it.each([
    ["null checks", { changed_files: [], checks: null }],
    ["array checks", { changed_files: [], checks: [] }],
    ["empty checks", { changed_files: [], checks: {} }],
    [
      "missing baseline check",
      (() => {
        const malformed = plan([]);
        const { install: _install, ...checks } = malformed.checks;
        return { ...malformed, checks };
      })(),
    ],
    [
      "non-boolean required value",
      {
        ...plan([]),
        checks: {
          ...plan([]).checks,
          install: { required: "true", reason: "malformed" },
        },
      },
    ],
  ])("rejects a malformed plan with %s", (_description, malformedPlan) => {
    expect(() => executeRawPlan(malformedPlan)).toThrow();
  });
});
