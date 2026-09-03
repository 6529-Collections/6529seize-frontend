import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const YAML = require("yaml") as { parse: (text: string) => unknown };

type RiskResult = {
  computed_floor: number;
  risk_level: string;
  files: string[];
  reasons: Array<{ path: string; level: number; rule: string }>;
  modifiers: Array<{ name: string; level_delta: number }>;
  route_impacts: string[];
};

type ValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

type CiPlan = {
  schema_version: string;
  generated_at: string;
  changed_files: string[];
  risk: RiskResult;
  untrusted_pr: boolean;
  checks: Record<string, { required: boolean; reason: string }>;
  security: {
    fork_pr_policy: string;
    secrets_allowed: boolean;
    token_permissions: string;
  };
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  CI_PLAN_SCHEMA_VERSION,
  EXISTING_REVIEWBOT_INITIAL_LANES,
  MUTATION_REGISTRY_SCHEMA_VERSION,
  SECRET_SCAN_SCHEMA_VERSION,
  VALIDATION_MANIFEST_SCHEMA_VERSION,
  WORKFLOW_SECURITY_SCHEMA_VERSION,
  classifyChangedFiles,
  createCiPlan,
  scanFilesForSecrets,
  validateArtifactPointer,
  validateMutationRegistry,
  validateValidationManifest,
  validateWorkflowSecurityFiles,
} = require("../../ops/scripts/testing-strategy.cjs") as {
  CI_PLAN_SCHEMA_VERSION: string;
  EXISTING_REVIEWBOT_INITIAL_LANES: string[];
  MUTATION_REGISTRY_SCHEMA_VERSION: string;
  SECRET_SCAN_SCHEMA_VERSION: string;
  VALIDATION_MANIFEST_SCHEMA_VERSION: string;
  WORKFLOW_SECURITY_SCHEMA_VERSION: string;
  classifyChangedFiles: (files: string[]) => RiskResult;
  createCiPlan: (
    files: string[],
    options?: { cwd?: string; untrustedPr?: boolean }
  ) => CiPlan;
  scanFilesForSecrets: (
    files: string[],
    cwd?: string
  ) => {
    schema_version: string;
    ok: boolean;
    findings: Array<{ file: string; line: number; pattern: string }>;
    skipped: Array<{ file: string; reason: string }>;
  };
  validateArtifactPointer: (artifact: unknown, index: number) => string[];
  validateMutationRegistry: (registry: unknown) => ValidationResult;
  validateValidationManifest: (manifest: unknown) => ValidationResult;
  validateWorkflowSecurityFiles: (
    files: string[],
    cwd?: string
  ) => {
    schema_version: string;
    ok: boolean;
    checked_files: string[];
    findings: Array<{ file: string; pattern: string; reason: string }>;
  };
};

const REVIEWBOT_LANES = [
  "general",
  "wcag",
  "i18n",
  "security",
  "responsiveness",
];
const GLM_SWARM_LANE = "glm-swarm";

function validManifest(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: VALIDATION_MANIFEST_SCHEMA_VERSION,
    risk: {
      computed_floor: 2,
      declared: 2,
      final: 2,
      reasons: [
        {
          path: "components/example/Example.tsx",
          level: 2,
          rule: "user-visible-runtime",
        },
      ],
      downgrade_approval: null,
    },
    changed_files: [{ path: "components/example/Example.tsx" }],
    hazards: [
      {
        hazard: "Visible label regression",
        severity: "medium",
        likelihood: "low",
        detection: "focused component test",
        required_test:
          "seize run test:no-coverage -- __tests__/scripts/testing-strategy.test.ts",
        rollback_or_fix_forward: "revert label change",
      },
    ],
    commands: [
      {
        command:
          "seize run test:no-coverage -- __tests__/scripts/testing-strategy.test.ts",
        status: "passed",
      },
    ],
    artifacts: [],
    review: {
      reviewbot: {
        required_lanes: REVIEWBOT_LANES,
      },
    },
    ...overrides,
  };
}

function artifactPointer(overrides: Record<string, unknown> = {}) {
  return {
    kind: "playwright-trace",
    uri: "s3://6529-artifacts/frontend/pr-1/trace.zip",
    sha256: "abc123",
    redaction_status: "verified-redacted",
    retention_class: "pr-validation",
    producing_command: "seize run test:e2e",
    ...overrides,
  };
}

describe("testing strategy risk floor", () => {
  it("keeps docs and tests in the fast lane", () => {
    const result = classifyChangedFiles([
      "ops/workstreams/README.md",
      "__tests__/components/example.test.tsx",
    ]);

    expect(result.computed_floor).toBe(0);
    expect(result.risk_level).toBe("level-0");
    expect(result.reasons.map((reason) => reason.rule)).toEqual([
      "docs-tests-or-metadata",
      "docs-tests-or-metadata",
    ]);
  });

  it("classifies user-visible app code as standard risk", () => {
    const result = classifyChangedFiles(["components/header/AppHeader.tsx"]);

    expect(result.computed_floor).toBe(2);
    expect(result.reasons[0]).toMatchObject({
      level: 2,
      rule: "user-visible-runtime",
    });
  });

  it("routes auth wallet upload and admin surfaces to guarded risk", () => {
    const result = classifyChangedFiles([
      "components/wallet/ConnectButton.tsx",
      "components/admin/DeleteWaveButton.tsx",
      "helpers/upload/sanitizeUrl.ts",
    ]);

    expect(result.computed_floor).toBe(3);
    expect(result.reasons.map((reason) => reason.rule)).toEqual([
      "auth-wallet-upload-admin",
      "auth-wallet-upload-admin",
      "auth-wallet-upload-admin",
    ]);
  });

  it("routes workflows and testing controls to release-captain risk", () => {
    const result = classifyChangedFiles([
      ".github/workflows/app-pr.yml",
      "ops/scripts/testing-strategy.cjs",
    ]);

    expect(result.computed_floor).toBe(4);
    expect(result.reasons.map((reason) => reason.rule)).toEqual([
      "deployment-or-release-control",
      "deployment-or-release-control",
    ]);
  });

  it("does not let config or routing infrastructure fall into Level 0", () => {
    const result = classifyChangedFiles([
      "config/securityHeaders.ts",
      "config/env.schema.ts",
      "middleware.ts",
      "instrumentation.ts",
    ]);

    expect(result.computed_floor).toBe(4);
    expect(result.reasons.map((reason) => reason.rule)).toEqual([
      "deployment-or-release-control",
      "deployment-or-release-control",
      "deployment-or-release-control",
      "deployment-or-release-control",
    ]);
  });

  it("classifies unknown source files conservatively and catches hyphenated sensitive names", () => {
    const result = classifyChangedFiles([
      "src/errors/renderFailure.ts",
      "src/errors/wallet-auth.ts",
    ]);

    expect(result.computed_floor).toBe(3);
    expect(result.reasons).toEqual([
      expect.objectContaining({
        path: "src/errors/renderFailure.ts",
        level: 2,
        rule: "user-visible-runtime",
      }),
      expect.objectContaining({
        path: "src/errors/wallet-auth.ts",
        level: 3,
        rule: "auth-wallet-upload-admin",
      }),
    ]);
  });

  it("defaults unmatched files to standard risk instead of docs risk", () => {
    const result = classifyChangedFiles(["unknown-runtime-file.foo"]);

    expect(result.computed_floor).toBe(2);
    expect(result.reasons[0]).toMatchObject({
      level: 2,
      rule: "unclassified-runtime-or-config",
    });
  });

  it("routes secret and production authority paths to critical risk", () => {
    const result = classifyChangedFiles([
      ".env.production",
      ".github/workflows/build-upload-deploy-prod.yml",
    ]);

    expect(result.computed_floor).toBe(5);
    expect(result.reasons.map((reason) => reason.rule)).toEqual([
      "credentials-or-secrets",
      "deploy-authority-or-artifact-access",
    ]);
  });

  it("raises feature flag runtime changes by one level below release risk", () => {
    const result = classifyChangedFiles(["lib/feature-flags/eligibility.ts"]);

    expect(result.computed_floor).toBe(3);
    expect(result.modifiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "feature-flag-diff-risk" }),
      ])
    );
  });

  it("records i18n layout modifiers and route impact hints", () => {
    const result = classifyChangedFiles([
      "i18n/messages.ts",
      "app/waves/[waveId]/page.tsx",
    ]);

    expect(result.modifiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "i18n-layout-risk" }),
      ])
    );
    expect(result.route_impacts).toContain("/waves/:param");
  });
});

describe("testing strategy CI plan", () => {
  it("keeps docs-only PRs in the no-install fast lane", () => {
    const plan = createCiPlan(["ops/workstreams/README.md"]);

    expect(plan.schema_version).toBe(CI_PLAN_SCHEMA_VERSION);
    expect(plan.risk.computed_floor).toBe(0);
    expect(plan.checks.risk_floor.required).toBe(true);
    expect(plan.checks.secret_scan.required).toBe(true);
    expect(plan.checks.install.required).toBe(false);
    expect(plan.checks["playwright_smoke"]!.required).toBe(false);
    expect(plan.checks["playwright_critical_shell"]!.required).toBe(false);
    expect(plan.security).toMatchObject({
      secrets_allowed: false,
      token_permissions:
        "contents:read; packages:read only in same-repository frozen-install jobs",
    });
  });

  it("routes ordinary UI changes through changed checks and smoke", () => {
    const plan = createCiPlan(["components/header/AppHeader.tsx"], {
      untrustedPr: true,
    });

    expect(plan.untrusted_pr).toBe(true);
    expect(plan.security.fork_pr_policy).toContain(
      "do not execute for fork PRs"
    );
    expect(plan.risk.computed_floor).toBe(2);
    expect(plan.checks.install.required).toBe(true);
    expect(plan.checks.lint_changed.required).toBe(true);
    expect(plan.checks.typecheck_changed.required).toBe(true);
    expect(plan.checks["test_typecheck"]!.required).toBe(true);
    expect(plan.checks["test_typecheck"]?.reason).toContain(
      "Jest diagnostic ratchet"
    );
    expect(plan.checks.jest_changed.required).toBe(true);
    expect(plan.checks["playwright_smoke"]!.required).toBe(true);
    expect(plan.checks["playwright_critical_shell"]!.required).toBe(false);
    expect(plan.checks.build.required).toBe(false);
  });

  it("routes guarded or build-sensitive changes through build and workflow review", () => {
    const plan = createCiPlan([
      ".github/workflows/app-pr-ci.yml",
      "package.json",
    ]);

    expect(plan.risk.computed_floor).toBe(4);
    expect(plan.checks.workflow_security_review.required).toBe(true);
    expect(plan.checks.dependency_governance.required).toBe(true);
    expect(plan.checks.build.required).toBe(true);
    expect(plan.checks["playwright_critical_shell"]!.required).toBe(true);
  });

  it("filters non-file related Jest discovery output before resolving paths", () => {
    const workflow = fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/app-pr-ci.yml"),
      "utf8"
    );

    const guardIndex = workflow.indexOf('if [ -z "$related_test" ]; then');
    const fileGuardIndex = workflow.indexOf(
      'if [ ! -f "$related_test" ]; then'
    );
    const resolveIndex = workflow.indexOf(
      'related_path="$(realpath "$related_test")"'
    );

    expect(guardIndex).toBeGreaterThanOrEqual(0);
    expect(fileGuardIndex).toBeGreaterThan(guardIndex);
    expect(resolveIndex).toBeGreaterThan(guardIndex);
    expect(resolveIndex).toBeGreaterThan(fileGuardIndex);
    const fileGuardBlock = workflow.slice(fileGuardIndex, resolveIndex);
    expect(fileGuardBlock).toContain("Skipping non-file Jest discovery output");
    expect(fileGuardBlock).toContain("continue");
  });

  it.each([
    "config/public-reviews/6529-stream.reference.json",
    "public/review-data/6529-stream/index.json",
    "scripts/public-reviews/solidity-reference.cjs",
  ])("treats public review reference input %s as build-sensitive", (file) => {
    const plan = createCiPlan([file]);

    expect(plan.checks["build"]!.required).toBe(true);
    expect(plan.checks["playwright_critical_shell"]!.required).toBe(true);
    expect(plan.checks["build"]!.reason).toContain("build-sensitive");
  });

  it("requires build coverage for deleted runtime source", () => {
    const plan = createCiPlan(["components/example/DeletedWidget.tsx"]);

    expect(plan.risk.computed_floor).toBe(2);
    expect(plan.checks.build.required).toBe(true);
    expect(plan.checks["playwright_critical_shell"]!.required).toBe(true);
    expect(plan.checks.build.reason).toContain("deleted runtime source");
  });

  it("does not treat existing runtime fixture source as deleted", () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "6529-testing-strategy-plan-")
    );
    try {
      fs.mkdirSync(path.join(tempDir, "components", "example"), {
        recursive: true,
      });
      fs.writeFileSync(
        path.join(tempDir, "components", "example", "ExistingWidget.tsx"),
        "export function ExistingWidget() { return null; }\n"
      );

      const plan = createCiPlan(["components/example/ExistingWidget.tsx"], {
        cwd: tempDir,
      });

      expect(plan.checks.build.required).toBe(false);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("runs the reviewbot contract when bot config can drift", () => {
    const plan = createCiPlan([".github/6529bot.yml"]);

    expect(plan.checks.reviewbot_contract.required).toBe(true);
  });

  it("verifies agent files sync when the help corpus changes", () => {
    const plan = createCiPlan(["ops/help/help-index.json"]);

    expect(plan.checks.agent_files_sync.required).toBe(true);
    expect(plan.checks.install.required).toBe(true);
  });

  it("verifies agent files sync when only committed artifacts change", () => {
    const plan = createCiPlan(["public/llms.txt"]);

    expect(plan.risk.computed_floor).toBe(1);
    expect(plan.checks.agent_files_sync.required).toBe(true);
    expect(plan.checks.install.required).toBe(true);
  });

  it.each([
    "ops/help/llms.txt.template",
    "public/glossary.json",
    "public/help-index.json",
    "public/robots.txt",
    "scripts/sync-agent-files.cjs",
    "scripts/sync-help-index.cjs",
    "next-sitemap.config.ts",
    "__tests__/scripts/sync-agent-files.test.ts",
  ])("verifies agent files sync when %s changes", (file) => {
    const plan = createCiPlan([file]);

    expect(plan.checks.agent_files_sync.required).toBe(true);
    expect(plan.checks.install.required).toBe(true);
  });

  it("keeps corpus docs in the fast lane without agent files sync", () => {
    const plan = createCiPlan(["ops/help/README.md"]);

    expect(plan.checks.agent_files_sync.required).toBe(false);
    expect(plan.checks.install.required).toBe(false);
  });

  it("runs Museum browser coverage only for Museum-impacting PRs and deployed changes", () => {
    const workflow = fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/app-pr-ci.yml"),
      "utf8"
    );
    const stagingWorkflow = fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/staging-e2e.yml"),
      "utf8"
    );
    const productionWorkflow = fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/production-e2e.yml"),
      "utf8"
    );
    const museumReleaseSelector = fs.readFileSync(
      path.join(process.cwd(), "scripts/museum-release-selection.cjs"),
      "utf8"
    );
    const museumSpec = fs.readFileSync(
      path.join(
        process.cwd(),
        "tests/museum/institutional-practice-readonly.spec.ts"
      ),
      "utf8"
    );
    const aboutSpec = fs.readFileSync(
      path.join(process.cwd(), "tests/museum/about-readonly.spec.ts"),
      "utf8"
    );
    const networkIaSpec = fs.readFileSync(
      path.join(process.cwd(), "tests/museum/network-ia-readonly.spec.ts"),
      "utf8"
    );

    expect(workflow).not.toContain("playwright install --with-deps chromium");
    expect(stagingWorkflow).not.toContain(
      "playwright install --with-deps chromium"
    );
    expect(productionWorkflow).not.toContain(
      "playwright install --with-deps chromium"
    );
    expect(workflow).toContain("test:e2e:smoke");
    expect(workflow).toContain("test:e2e:critical-shell");
    for (const museumBrowserSpec of [
      "tests/museum/data-architecture-readonly.spec.ts",
      "tests/museum/institutional-practice-readonly.spec.ts",
      "tests/museum/network-ia-readonly.spec.ts",
      "tests/museum/about-readonly.spec.ts",
      "tests/museum/inside-system-readonly.spec.ts",
      "tests/museum/rights-readonly.spec.ts",
    ]) {
      expect(workflow).toContain(museumBrowserSpec);
    }
    expect(workflow).toContain("PLAYWRIGHT_WEB_SERVER_COMMAND");
    expect(stagingWorkflow).toContain("--trigger post-deploy");
    expect(stagingWorkflow).toContain("SELECTED_PACK");
    expect(stagingWorkflow).toContain("--exclude-pack");
    expect(stagingWorkflow).not.toContain("const isMuseumPack = (pack) =>");
    expect(stagingWorkflow).not.toContain("release-bus-museum-hold");
    expect(productionWorkflow).toContain("--exclude-pack");
    expect(productionWorkflow).not.toContain("release-bus-museum-hold");
    expect(stagingWorkflow).not.toContain("scripts/museum-e2e-change-set.cjs");
    expect(museumReleaseSelector).toContain("failClosedClassification");
    expect(museumReleaseSelector).toContain("effectiveActivation");
    expect(museumReleaseSelector).toContain("source commit must be an exact");
    expect(workflow).toContain(
      "playwright_museum_required: ${{ steps.plan_outputs.outputs.playwright_museum_required }}"
    );
    expect(workflow).toContain(
      "Resolve exact Museum publication for Playwright"
    );
    expect(workflow).toContain("GH_TOKEN: ${{ github.token }}");
    expect(workflow).toContain(
      "MUSEUM_PUBLICATION_TEST_COMMIT: ${{ steps.museum_publication.outputs.catalog_commit }}"
    );
    expect(workflow).toContain(
      "MUSEUM_PUBLICATION_EXPECTED_COMMIT: ${{ steps.museum_publication.outputs.source_commit }}"
    );
    expect(workflow).toContain(
      'MUSEUM_PUBLICATION_TEST_CATALOG_COMMIT: "858d3ebc049b59219d6fa639dbd325b6adc7345a"'
    );
    expect(workflow).toContain(
      'MUSEUM_PUBLICATION_TEST_SOURCE_COMMIT: "92966f2836ebf2af06edfe0fe2cff25041307c92"'
    );
    expect(workflow).toContain('case "$selected_pack"');
    expect(workflow).toContain(
      "museum_gate_spec=tests/museum/network-ia-readonly.spec.ts"
    );
    expect(workflow).toContain("selected_specs=()");
    expect(workflow).toContain('[ ! -f "$selected_spec" ]');
    expect(workflow).toContain("./bin/6529 exec playwright test");
    expect(workflow).not.toContain('./bin/6529 run "$selected_pack"');
    expect(workflow).toContain("--workers=1");
    expect(stagingWorkflow).toContain("DEPLOYMENT_E2E_SOURCE_SHA");
    expect(stagingWorkflow).toContain("--retry-failed-packs 1");
    expect(museumSpec).not.toContain(
      'test.describe.configure({ mode: "serial" })'
    );
    expect(museumSpec).not.toContain("let sourceCommit");
    expect(museumSpec).toContain("for (const profile of PROFILE_ROUTES)");
    expect(aboutSpec).toContain("MUSEUM_PUBLICATION_EXPECTED_COMMIT");
    expect(aboutSpec).toContain("museum_publication_expected_commit_not_exact");
    expect(networkIaSpec).not.toContain("page.screenshot");
    expect(networkIaSpec).not.toContain("fullPage:");
    expect(networkIaSpec).toContain("newCDPSession(page)");
    expect(networkIaSpec).toContain('cdpSession.send("Page.captureScreenshot"');
    expect(networkIaSpec).toContain("captureBeyondViewport: false");
    expect(networkIaSpec).toContain("fromSurface: true");
    expect(networkIaSpec).toContain(
      "await cdpSession.detach().catch(() => undefined)"
    );
    expect(networkIaSpec).toContain(
      "const EVIDENCE_SCREENSHOT_TIMEOUT_MS = 15_000;"
    );
    expect(networkIaSpec).toContain(
      "Museum viewport evidence capture timed out after"
    );
    expect(
      fs.existsSync(
        path.join(
          process.cwd(),
          "__tests__/lib/museum/publication/institutionalPractice.test.ts"
        )
      )
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          process.cwd(),
          "__tests__/lib/museum/publication/pageSources.test.ts"
        )
      )
    ).toBe(true);

    const parsed = YAML.parse(workflow) as {
      jobs: Record<
        string,
        {
          if?: string;
          name?: string;
          needs?: string | string[];
          strategy?: { matrix?: string };
          "runs-on"?: string;
          "timeout-minutes"?: number;
          container?: { image?: string; options?: string };
          defaults?: { run?: { shell?: string } };
          steps?: Array<{
            name?: string;
            if?: string;
            id?: string;
            run?: string;
            "timeout-minutes"?: number;
            "continue-on-error"?: boolean;
          }>;
        }
      >;
    };
    expect(parsed.jobs["app-checks"]).toMatchObject({
      if: "needs.plan.outputs.install_required == 'true' && github.event.pull_request.head.repo.full_name == github.repository",
      "runs-on": "${{ matrix.runner }}",
      strategy: {
        matrix: "${{ fromJSON(needs.plan.outputs.app_check_matrix) }}",
      },
    });
    expect(parsed.jobs["app-checks"]?.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Build production profile",
          if: "matrix.lane == 'build'",
        }),
        expect.objectContaining({
          name: "Run Network Museum Playwright packs",
          if: "startsWith(matrix.lane, 'playwright-museum-')",
        }),
      ])
    );
    expect(parsed.jobs["app-checks"]?.steps).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Run small Playwright smoke pack" }),
        expect.objectContaining({
          name: "Run critical route-shell Playwright pack",
        }),
      ])
    );
    expect(parsed.jobs["core-playwright-checks"]).toMatchObject({
      if: "needs.plan.outputs.core_playwright_required == 'true' && github.event.pull_request.head.repo.full_name == github.repository",
      "runs-on": "${{ matrix.runner }}",
      "timeout-minutes": 20,
      container: {
        image:
          "mcr.microsoft.com/playwright:v1.61.1-noble@sha256:5b8f294aff9041b7191c34a4bab3ac270157a28774d4b0660e9743297b697e48",
        options: "--ipc=host",
      },
      defaults: { run: { shell: "bash" } },
      strategy: {
        matrix: "${{ fromJSON(needs.plan.outputs.core_playwright_matrix) }}",
      },
    });
    expect(parsed.jobs["core-playwright-checks"]?.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Run small Playwright smoke pack",
          if: "matrix.lane == 'playwright-smoke'",
        }),
        expect.objectContaining({
          name: "Run critical route-shell Playwright pack",
          if: "matrix.lane == 'playwright-critical-shell'",
        }),
      ])
    );
    expect(parsed.jobs["core-playwright-checks"]?.steps).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Restore Playwright browser" }),
        expect.objectContaining({ name: "Install Playwright dependencies" }),
        expect.objectContaining({ name: "Install Playwright browser" }),
      ])
    );
    const museumBrowserStep = parsed.jobs["app-checks"]?.steps?.find(
      (step) => step.name === "Run Network Museum Playwright packs"
    );
    const museumBrowserRun = museumBrowserStep?.run ?? "";
    expect(
      museumBrowserRun.match(/tests\/museum\/[a-z-]+\.spec\.ts/gu) ?? []
    ).toEqual([
      "tests/museum/network-ia-readonly.spec.ts",
      "tests/museum/data-architecture-readonly.spec.ts",
      "tests/museum/institutional-practice-readonly.spec.ts",
      "tests/museum/about-readonly.spec.ts",
      "tests/museum/inside-system-readonly.spec.ts",
      "tests/museum/rights-readonly.spec.ts",
    ]);
    expect(workflow).toContain('lane: "playwright-museum-desktop"');
    expect(workflow).toContain('label: "Network Museum desktop"');
    expect(workflow).toContain('museum_project: "web-desktop-chromium"');
    expect(workflow).toContain('lane: "playwright-museum-mobile"');
    expect(workflow).toContain('label: "Network Museum mobile"');
    expect(workflow).toContain('museum_project: "web-mobile-chromium"');
    expect(museumBrowserRun).toContain('--project="$MUSEUM_PROJECT"');
    expect(museumBrowserRun).not.toContain("--project=web-desktop-chromium");
    expect(museumBrowserRun).not.toContain("--project=web-mobile-chromium");
    expect(museumBrowserRun).not.toContain("--project=web-desktop-firefox");
    expect(museumBrowserRun).not.toContain("--project=web-desktop-webkit");
    expect(museumBrowserRun).toContain(
      'contract: "museum-playwright-isolated-project-v3"'
    );
    expect(museumBrowserRun).toContain(
      "Museum execution overlap or unexpected test"
    );
    expect(museumBrowserRun).toContain(
      "Museum execution coverage is incomplete"
    );
    expect(museumBrowserRun).toContain(
      "Museum execution spec coverage is incomplete"
    );
    expect(museumBrowserRun).toContain(
      "Museum execution inventory must cover only ${project}"
    );
    expect(museumBrowserRun).toContain(
      "Museum fail-fast gate must cover Network IA on ${project}"
    );
    expect(museumBrowserRun).toContain(
      'PLAYWRIGHT_OUTPUT_DIR="test-results/playwright/museum-gate"'
    );
    expect(museumBrowserRun).toContain(
      "timeout --signal=TERM --kill-after=30s 10m"
    );
    expect(museumBrowserRun).toContain("--retries=0");
    expect(museumBrowserRun).toContain("--max-failures=1");
    expect(museumBrowserRun).toContain(
      "Museum $MUSEUM_PROJECT Network IA gate exceeded its 10-minute timeout."
    );
    expect(museumBrowserRun).toContain(
      'PLAYWRIGHT_OUTPUT_DIR="test-results/playwright/museum-remaining"'
    );
    expect(museumBrowserRun).toContain(
      'PLAYWRIGHT_HTML_REPORT_DIR="playwright-report/museum-remaining"'
    );
    expect(museumBrowserRun).toContain(
      'NEXT_DEV_DIST_DIR=".next-playwright-${MUSEUM_PROJECT}"'
    );
    expect(museumBrowserRun).toContain("./bin/6529 run dev");
    expect(museumBrowserRun).not.toContain("PORT_SEARCH_LIMIT=0");
    expect(museumBrowserRun).toContain("PLAYWRIGHT_SKIP_WEB_SERVER=1");
    expect(museumBrowserRun).toContain("trap cleanup_museum_server EXIT");
    expect(museumBrowserRun).toContain(
      'echo "Museum server did not become ready for $MUSEUM_PROJECT."'
    );
    expect(museumBrowserRun).toContain(
      "timeout --signal=TERM --kill-after=30s 20m"
    );
    expect(museumBrowserRun).toContain(
      '| sed -u "s/^/[museum $MUSEUM_PROJECT remaining] /"'
    );
    expect(museumBrowserRun).toContain('| tee "$museum_remaining_log"');
    expect(museumBrowserRun).toContain(
      "Museum $MUSEUM_PROJECT remaining coverage exceeded its 20-minute timeout."
    );
    expect(museumBrowserRun).toContain(
      "Museum $MUSEUM_PROJECT remaining coverage failed with exit ${museum_remaining_exit}."
    );
    expect(museumBrowserRun).toContain('tail -n 120 "$museum_remaining_log"');
    expect(museumBrowserRun).toContain("--workers=1");
    expect(museumBrowserRun).not.toContain("--workers=2");
    expect(museumBrowserRun).not.toContain("wait -n");
    expect(museumBrowserRun).not.toContain("setsid");
    expect(museumBrowserRun).not.toContain("./bin/6529 run base-build");
    expect(museumBrowserRun).not.toContain("start:standalone");
    expect(parsed.jobs["installed-checks"]).toMatchObject({
      name: "Installed app checks",
      needs: ["plan", "app-checks", "core-playwright-checks"],
      if: "always() && needs.plan.result == 'success' && needs.plan.outputs.install_required == 'true'",
    });
    expect(workflow).toContain(
      'write("app_check_matrix", JSON.stringify({ include: appCheckLanes }))'
    );
    expect(workflow).toContain(
      'write("core_playwright_matrix", JSON.stringify({ include: corePlaywrightLanes }))'
    );
    expect(workflow).toContain(
      'write("core_playwright_required", String(corePlaywrightLanes.length > 0))'
    );
    expect(workflow).toContain("BUILD_CI_RUNNER");
    expect(workflow).toContain("Restore Playwright browser");
    expect(workflow).toContain("node22-pr-production-nextjs");

    for (const source of [workflow, stagingWorkflow, productionWorkflow]) {
      const workflowJobs = YAML.parse(source) as {
        jobs: Record<
          string,
          {
            steps?: Array<{
              name?: string;
              run?: string;
              "timeout-minutes"?: number;
              "continue-on-error"?: boolean;
            }>;
          }
        >;
      };
      const steps = Object.values(workflowJobs.jobs).flatMap(
        (job) => job.steps ?? []
      );
      expect(steps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Install Playwright dependencies",
            run: "./bin/6529 exec playwright install-deps chromium",
            "timeout-minutes": 3,
            "continue-on-error": true,
          }),
          expect.objectContaining({
            name: "Retry Playwright dependencies",
            run: "./bin/6529 exec playwright install-deps chromium",
            "timeout-minutes": 3,
            "continue-on-error": true,
          }),
          expect.objectContaining({
            name: "Install Playwright browser",
            run: "./bin/6529 exec playwright install chromium",
            "timeout-minutes": 10,
          }),
        ])
      );
    }
  });

  it("keeps full-history CI checkouts blobless", () => {
    const appPrCi = fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/app-pr-ci.yml"),
      "utf8"
    );
    const coverageFloor = fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/coverage-floor.yml"),
      "utf8"
    );
    const parsedCoverageFloor = YAML.parse(coverageFloor) as {
      jobs: {
        "coverage-floor": {
          steps: Array<{
            uses?: string;
            with?: Record<string, unknown>;
          }>;
        };
      };
    };
    const coverageCheckoutSteps = parsedCoverageFloor.jobs[
      "coverage-floor"
    ].steps.filter((step) => step.uses?.startsWith("actions/checkout@"));
    const pushSecretScan = fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/push-secret-scan.yml"),
      "utf8"
    );

    expect(appPrCi.match(/filter: blob:none/gu)).toHaveLength(2);
    expect(appPrCi.match(/fetch-depth: 0/gu)).toHaveLength(2);
    expect(coverageCheckoutSteps).toHaveLength(1);
    expect(coverageCheckoutSteps[0]?.with).toMatchObject({
      "fetch-depth": 0,
      filter: "blob:none",
    });
    expect(pushSecretScan).toContain("filter: blob:none");
    expect(pushSecretScan).toContain("fetch-depth: 0");
  });
});

describe("testing strategy CI security checks", () => {
  let tempDir = "";

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "6529-testing-strategy-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("reports changed-file secret patterns without returning secret values", () => {
    fs.mkdirSync(path.join(tempDir, "components"), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, "components", "Token.ts"),
      `export const bad = "${"ANTHROPIC"}_API_KEY=sk-ant-fake-secret-value";\n`
    );

    const result = scanFilesForSecrets(["components/Token.ts"], tempDir);

    expect(result.schema_version).toBe(SECRET_SCAN_SCHEMA_VERSION);
    expect(result.ok).toBe(false);
    expect(result.findings).toEqual([
      {
        file: "components/Token.ts",
        line: 1,
        pattern: "named-secret-assignment",
      },
    ]);
    expect(JSON.stringify(result)).not.toContain("sk-ant-fake-secret-value");
  });

  it("reports every occurrence of the same changed-file secret pattern", () => {
    fs.mkdirSync(path.join(tempDir, "components"), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, "components", "MultiToken.ts"),
      [
        `export const first = "${"STAGING"}_AUTH=first_fake_value";`,
        `export const second = "${"STAGING"}_API_KEY=second_fake_value";`,
      ].join("\n")
    );

    const result = scanFilesForSecrets(["components/MultiToken.ts"], tempDir);

    expect(result.findings).toEqual([
      {
        file: "components/MultiToken.ts",
        line: 1,
        pattern: "named-secret-assignment",
      },
      {
        file: "components/MultiToken.ts",
        line: 2,
        pattern: "named-secret-assignment",
      },
    ]);
  });

  it("does not treat YAML secret declarations as assigned values", () => {
    fs.mkdirSync(path.join(tempDir, ".github", "workflows"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(tempDir, ".github", "workflows", "reusable.yml"),
      [
        "on:",
        "  workflow_call:",
        "    secrets:",
        "      ALCHEMY_API_KEY:",
        "        required: false",
        "      SENTRY_AUTH_TOKEN:",
        "        required: true",
      ].join("\n")
    );

    const result = scanFilesForSecrets(
      [".github/workflows/reusable.yml"],
      tempDir
    );

    expect(result).toMatchObject({ ok: true, findings: [] });
  });

  it("scans common credential files that do not look like source", () => {
    fs.writeFileSync(
      path.join(tempDir, ".npmrc"),
      `//registry.npmjs.org/:_${"auth"}Token=npm_fake_secret_value\n`
    );
    fs.writeFileSync(
      path.join(tempDir, "id_rsa"),
      `-----BEGIN OPENSSH ${"PRIVATE"} KEY-----\nnot-real\n`
    );

    const result = scanFilesForSecrets([".npmrc", "id_rsa"], tempDir);

    expect(result.ok).toBe(false);
    expect(result.findings.map((finding) => finding.pattern)).toEqual(
      expect.arrayContaining(["npm-auth-token", "private-key-block"])
    );
  });

  it("allows the runtime NODE_AUTH_TOKEN npm placeholder", () => {
    fs.writeFileSync(
      path.join(tempDir, ".npmrc"),
      "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}\n"
    );

    const result = scanFilesForSecrets([".npmrc"], tempDir);

    expect(result).toMatchObject({ ok: true, findings: [] });
  });

  it.each(["${NODE_AUTH_TOKEN}extra", '"${NODE_AUTH_TOKEN}"'])(
    "rejects the near-miss npm auth placeholder %s",
    (tokenValue) => {
      fs.writeFileSync(
        path.join(tempDir, ".npmrc"),
        `//npm.pkg.github.com/:_authToken=${tokenValue}\n`
      );

      const result = scanFilesForSecrets([".npmrc"], tempDir);

      expect(result.ok).toBe(false);
      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ pattern: "npm-auth-token" }),
        ])
      );
    }
  );

  it("reports raw JWT-shaped tokens in JSON payload files", () => {
    const fakeJwt = [
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
      "eyJzdWIiOiJmYWtlLXVzZXIiLCJpYXQiOjE1MTYyMzkwMjJ9",
      "fake_signature_segment",
    ].join(".");
    fs.mkdirSync(path.join(tempDir, "tmp"), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, "tmp", "browser-auth.json"),
      `${JSON.stringify({ jwt: fakeJwt, refreshToken: fakeJwt })}\n`
    );

    const result = scanFilesForSecrets(["tmp/browser-auth.json"], tempDir);

    expect(result.ok).toBe(false);
    expect(result.findings.map((finding) => finding.pattern)).toEqual(
      expect.arrayContaining(["jwt-like-token"])
    );
    expect(JSON.stringify(result)).not.toContain("fake_signature_segment");
  });

  it("accepts a read-only pull_request workflow", () => {
    fs.mkdirSync(path.join(tempDir, ".github", "workflows"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(tempDir, ".github", "workflows", "safe.yml"),
      [
        "name: Safe",
        "on:",
        "  pull_request:",
        "permissions:",
        "  contents: read",
        "jobs:",
        "  plan:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - run: echo ok",
      ].join("\n")
    );

    const result = validateWorkflowSecurityFiles(
      [".github/workflows/safe.yml"],
      tempDir
    );

    expect(result).toEqual({
      schema_version: WORKFLOW_SECURITY_SCHEMA_VERSION,
      ok: true,
      checked_files: [".github/workflows/safe.yml"],
      findings: [],
    });
  });

  it("flags ordinary pull_request_target workflows", () => {
    fs.mkdirSync(path.join(tempDir, ".github", "workflows"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(tempDir, ".github", "workflows", "target.yml"),
      [
        "name: Unsafe target",
        "on:",
        "  pull_request_target:",
        "permissions:",
        "  contents: read",
        "jobs:",
        "  inspect:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - run: echo ok",
      ].join("\n")
    );

    const result = validateWorkflowSecurityFiles(
      [".github/workflows/target.yml"],
      tempDir
    );

    expect(result.ok).toBe(false);
    expect(result.findings.map((finding) => finding.pattern)).toContain(
      "pull_request_target"
    );
  });

  it.each([
    "on: { pull_request_target: {} }",
    "on:\n  'pull_request_target':",
    'on: "pull_request_target"',
  ])("flags alternate pull_request_target syntax: %s", (trigger) => {
    fs.mkdirSync(path.join(tempDir, ".github", "workflows"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(tempDir, ".github", "workflows", "alternate-target.yml"),
      [
        "name: Alternate target",
        trigger,
        "permissions:",
        "  contents: write",
        "jobs:",
        "  inspect:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        '      - run: echo "${{ secrets.STAGING_AUTH }}"',
      ].join("\n")
    );

    const result = validateWorkflowSecurityFiles(
      [".github/workflows/alternate-target.yml"],
      tempDir
    );

    expect(result.ok).toBe(false);
    expect(result.findings.map((finding) => finding.pattern)).toEqual(
      expect.arrayContaining([
        "pull_request_target",
        "pull_request-secrets",
        "pull_request-write-permission",
      ])
    );
  });

  it("accepts only the exact base-owned public-review trust workflow", () => {
    const workflowPath = path.join(
      ".github",
      "workflows",
      "public-review-snapshot-trust.yml"
    );
    const source = fs
      .readFileSync(path.join(process.cwd(), workflowPath), "utf8")
      .replaceAll("\r\n", "\n");
    fs.mkdirSync(path.join(tempDir, ".github", "workflows"), {
      recursive: true,
    });
    fs.writeFileSync(path.join(tempDir, workflowPath), source);

    const result = validateWorkflowSecurityFiles(
      [workflowPath.replaceAll("\\", "/")],
      tempDir
    );

    expect(result.ok).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it("rejects any privilege or candidate-execution drift in the trusted workflow", () => {
    const workflowPath = path.join(
      ".github",
      "workflows",
      "public-review-snapshot-trust.yml"
    );
    const source = fs
      .readFileSync(path.join(process.cwd(), workflowPath), "utf8")
      .replaceAll("\r\n", "\n");
    const mutations = [
      source.replace(
        "permissions:\n  contents: read",
        "permissions:\n  contents: write"
      ),
      source.replace(
        '          git checkout --detach "$SNAPSHOT_BASE_SHA"',
        '          git checkout --detach "$SNAPSHOT_HEAD_SHA"'
      ),
      source.replace(
        "actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020",
        "actions/setup-node@v4"
      ),
      source.replace(
        "      - name: Verify candidate snapshot from Git objects",
        [
          '      - run: echo "${{ secrets.STAGING_AUTH }}"',
          "      - name: Verify candidate snapshot from Git objects",
        ].join("\n")
      ),
    ];
    fs.mkdirSync(path.join(tempDir, ".github", "workflows"), {
      recursive: true,
    });

    for (const mutation of mutations) {
      fs.writeFileSync(path.join(tempDir, workflowPath), mutation);
      const result = validateWorkflowSecurityFiles(
        [workflowPath.replaceAll("\\", "/")],
        tempDir
      );
      expect(result.ok).toBe(false);
      expect(result.findings.map((finding) => finding.pattern)).toContain(
        "pull_request_target"
      );
    }
  });

  it("flags pull_request workflows that expose secrets or write permissions", () => {
    fs.mkdirSync(path.join(tempDir, ".github", "workflows"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(tempDir, ".github", "workflows", "unsafe.yml"),
      [
        "name: Unsafe",
        "on:",
        "  pull_request:",
        "permissions:",
        "  contents: write",
        "jobs:",
        "  bad:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        '      - run: echo "${{ secrets.STAGING_AUTH }}"',
      ].join("\n")
    );

    const result = validateWorkflowSecurityFiles(
      [".github/workflows/unsafe.yml"],
      tempDir
    );

    expect(result.ok).toBe(false);
    expect(result.findings.map((finding) => finding.pattern)).toEqual(
      expect.arrayContaining([
        "pull_request-secrets",
        "pull_request-write-permission",
      ])
    );
  });

  it("flags compact pull_request syntax with bracket secrets and broader write scopes", () => {
    fs.mkdirSync(path.join(tempDir, ".github", "workflows"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(tempDir, ".github", "workflows", "compact.yml"),
      [
        "name: Compact",
        "on: [pull_request]",
        "permissions:",
        "  checks: write",
        "jobs:",
        "  bad:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - run: echo \"${{ secrets['STAGING_AUTH'] }}\"",
      ].join("\n")
    );

    const result = validateWorkflowSecurityFiles(
      [".github/workflows/compact.yml"],
      tempDir
    );

    expect(result.ok).toBe(false);
    expect(result.findings.map((finding) => finding.pattern)).toEqual(
      expect.arrayContaining([
        "pull_request-secrets",
        "pull_request-write-permission",
      ])
    );
  });
});

describe("testing strategy validation manifest", () => {
  it("accepts the checked-in minimal example", () => {
    const manifest = JSON.parse(
      fs.readFileSync(
        path.join(
          process.cwd(),
          "ops/testing-strategy/examples/minimal.validation-manifest.json"
        ),
        "utf8"
      )
    );

    expect(validateValidationManifest(manifest)).toEqual({
      ok: true,
      errors: [],
      warnings: [],
    });
  });

  it("requires release-captain approval for risk downgrades", () => {
    const manifest = validManifest({
      risk: {
        computed_floor: 4,
        declared: 2,
        final: 2,
        reasons: [],
      },
    });

    const result = validateValidationManifest(manifest);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "risk.downgrade_approval.approver: required",
        "risk.downgrade_approval.reason: required",
        "risk.downgrade_approval.expires_at: required",
      ])
    );
  });

  it("requires durable artifact pointers for Level 3 and higher manifests", () => {
    const manifest = validManifest({
      risk: {
        computed_floor: 3,
        declared: 3,
        final: 3,
        reasons: [],
        downgrade_approval: null,
      },
      artifacts: [],
    });

    const result = validateValidationManifest(manifest);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "artifacts: Level 3+ manifests require at least one validated durable artifact pointer"
    );
  });

  it("rejects local or unredacted artifact pointers", () => {
    const errors = validateArtifactPointer(
      artifactPointer({
        uri: "file:///tmp/trace.zip",
        redaction_status: "raw",
        sha256: undefined,
      }),
      0
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        "artifacts[0].uri: must be a durable artifact pointer, not a local path or Git LFS object",
        "artifacts[0].uri: must start with s3://6529-artifacts/, https://artifacts.6529.io/, ipfs://, or ipns://",
        "artifacts[0]: must include at least one integrity field: sha256, cid, etag, or version_id",
        "artifacts[0].redaction_status: must be one of verified-redacted, not-sensitive, public-redacted",
      ])
    );
  });

  it("rejects artifact pointers outside 6529-controlled storage", () => {
    const s3Errors = validateArtifactPointer(
      artifactPointer({ uri: "s3://not-6529-owned/private-trace.zip" }),
      0
    );
    const httpsErrors = validateArtifactPointer(
      artifactPointer({
        uri: "https://6529-artifacts.evil.example/trace.zip",
      }),
      1
    );
    const ipfsErrors = validateArtifactPointer(
      artifactPointer({
        uri: "ipfs://bafyexample",
        redaction_status: "verified-redacted",
      }),
      2
    );
    const uppercaseErrors = validateArtifactPointer(
      artifactPointer({
        uri: "S3://6529-ARTIFACTS/private-trace.zip",
      }),
      3
    );

    expect(s3Errors).toContain(
      "artifacts[0].uri: must start with s3://6529-artifacts/, https://artifacts.6529.io/, ipfs://, or ipns://"
    );
    expect(httpsErrors).toContain(
      "artifacts[1].uri: must start with s3://6529-artifacts/, https://artifacts.6529.io/, ipfs://, or ipns://"
    );
    expect(ipfsErrors).toContain(
      "artifacts[2].redaction_status: must be public-redacted for IPFS/IPNS artifact pointers"
    );
    expect(uppercaseErrors).toContain(
      "artifacts[3].uri: must start with s3://6529-artifacts/, https://artifacts.6529.io/, ipfs://, or ipns://"
    );
  });

  it("keeps all existing reviewbot initial lanes required", () => {
    expect(EXISTING_REVIEWBOT_INITIAL_LANES).toEqual(REVIEWBOT_LANES);

    const manifest = validManifest({
      review: {
        reviewbot: {
          required_lanes: ["general", "wcag", "i18n", "security"],
        },
      },
    });

    const result = validateValidationManifest(manifest);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "review.reviewbot.required_lanes: must include existing reviewbot lane: responsiveness"
    );
  });

  it("requires manifests to record the existing reviewbot lanes", () => {
    const manifest = validManifest({
      review: {},
    });

    const result = validateValidationManifest(manifest);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "review.reviewbot.required_lanes: required; every PR must preserve the existing reviewbot lanes"
    );
  });

  it("rejects missing required manifest array sections", () => {
    const manifest = validManifest();
    delete (manifest as Record<string, unknown>).hazards;
    delete (manifest as Record<string, unknown>).commands;
    delete (manifest as Record<string, unknown>).artifacts;

    const result = validateValidationManifest(manifest);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "hazards: must be an array",
        "commands: must be an array",
        "artifacts: must be an array",
      ])
    );
  });

  it("keeps the schema const in sync with the validator", () => {
    const schema = JSON.parse(
      fs.readFileSync(
        path.join(
          process.cwd(),
          "ops/testing-strategy/validation-manifest.v1.schema.json"
        ),
        "utf8"
      )
    );

    expect(schema.properties.schema_version.const).toBe(
      VALIDATION_MANIFEST_SCHEMA_VERSION
    );
  });

  it("keeps required reviewbot lanes in sync with the schema and repo config", () => {
    const schema = JSON.parse(
      fs.readFileSync(
        path.join(
          process.cwd(),
          "ops/testing-strategy/validation-manifest.v1.schema.json"
        ),
        "utf8"
      )
    );
    const configText = fs.readFileSync(
      path.join(process.cwd(), ".github/6529bot.yml"),
      "utf8"
    );
    const config = YAML.parse(configText) as {
      limits?: { maxJobsPerDelivery?: number };
      reviewKinds?: { allowed?: string[]; initial?: string[] };
    };
    const allowedLanes = config.reviewKinds?.allowed ?? [];
    const configLanes = config.reviewKinds?.initial ?? [];
    const schemaLanes =
      schema.properties.review.properties.reviewbot.properties.required_lanes.allOf.map(
        (rule: { contains: { const: string } }) => rule.contains.const
      );

    expect(configLanes).toEqual(expect.arrayContaining(REVIEWBOT_LANES));
    expect(new Set(configLanes).size).toBe(configLanes.length);
    expect(allowedLanes).toEqual(
      expect.arrayContaining([...REVIEWBOT_LANES, GLM_SWARM_LANE])
    );
    expect(configLanes).toContain(GLM_SWARM_LANE);
    expect(config.limits?.maxJobsPerDelivery ?? 0).toBeGreaterThanOrEqual(
      configLanes.length
    );
    expect(schemaLanes).toEqual(REVIEWBOT_LANES);
    expect(EXISTING_REVIEWBOT_INITIAL_LANES).toEqual(REVIEWBOT_LANES);
  });
});

describe("testing strategy mutation registry", () => {
  it("accepts the checked-in empty registry contract", () => {
    const registry = JSON.parse(
      fs.readFileSync(
        path.join(
          process.cwd(),
          "ops/testing-strategy/mutation-endpoint-registry.json"
        ),
        "utf8"
      )
    );

    expect(validateMutationRegistry(registry)).toEqual({
      ok: true,
      errors: [],
      warnings: [],
    });
  });

  it("rejects duplicate or read-only-allowed mutation entries", () => {
    const registry = {
      schema_version: MUTATION_REGISTRY_SCHEMA_VERSION,
      owner: "frontend-release-captain",
      updated_at: "2026-06-20T00:00:00.000Z",
      endpoints: [
        {
          id: "post-wave",
          pattern: "/api/waves/**",
          methods: ["POST"],
          surface: "posting",
          risk_level: 3,
          mutation: true,
          allowed_in_readonly_tests: false,
        },
        {
          id: "post-wave",
          pattern: "/api/waves/**",
          methods: ["TRACE"],
          surface: "posting",
          risk_level: 3,
          mutation: true,
          allowed_in_readonly_tests: true,
        },
      ],
    };

    const result = validateMutationRegistry(registry);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "endpoints[1].id: duplicate id: post-wave",
        "endpoints[1].methods: invalid HTTP method: TRACE",
        "endpoints[1].allowed_in_readonly_tests: must be false unless a separate allowlist explicitly handles the endpoint",
      ])
    );
  });

  it("keeps the mutation registry schema const in sync with the validator", () => {
    const schema = JSON.parse(
      fs.readFileSync(
        path.join(
          process.cwd(),
          "ops/testing-strategy/mutation-endpoint-registry.v1.schema.json"
        ),
        "utf8"
      )
    );

    expect(schema.properties.schema_version.const).toBe(
      MUTATION_REGISTRY_SCHEMA_VERSION
    );
  });
});
