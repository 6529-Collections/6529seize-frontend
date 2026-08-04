const { applyEffectiveAppPrCiPlan } =
  require("../../scripts/app-pr-ci-effective-plan.cjs") as {
    applyEffectiveAppPrCiPlan: (
      plan: Record<string, unknown>,
      options?: { cwd?: string }
    ) => {
      checks: Record<string, { required: boolean }>;
    };
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

describe("effective App PR CI plan", () => {
  it("keeps ordinary runtime changes on focused static checks", () => {
    const effective = applyEffectiveAppPrCiPlan(
      plan(["components/header/AppHeader.tsx"])
    );

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
    expect(
      applyEffectiveAppPrCiPlan(plan([file])).checks.test_typecheck.required
    ).toBe(true);
  });

  it.each([
    ".github/workflows/deploy-staging.yml",
    "ops/scripts/deploy-staging-artifact.sh",
    "tests/packs.manifest.cjs",
  ])("requires Release Bus contracts for %s", (file) => {
    expect(
      applyEffectiveAppPrCiPlan(plan([file])).checks.release_bus_contract
        .required
    ).toBe(true);
  });

  it("requires dead-code analysis for dependency changes or deleted runtime source", () => {
    expect(
      applyEffectiveAppPrCiPlan(plan(["package.json"])).checks.deadcode.required
    ).toBe(true);
    expect(
      applyEffectiveAppPrCiPlan(plan(["lib/removed-runtime-source.ts"]), {
        cwd: "/path-that-does-not-exist",
      }).checks.deadcode.required
    ).toBe(true);
  });
});
