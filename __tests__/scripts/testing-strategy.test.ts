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
  changed_files: string[];
  risk: RiskResult;
  untrusted_pr: boolean;
  checks: Record<string, { required: boolean; reason: string }>;
  security: { secrets_allowed: boolean; token_permissions: string };
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
    options?: { untrustedPr?: boolean }
  ) => CiPlan;
  scanFilesForSecrets: (
    files: string[],
    cwd?: string
  ) => {
    schema_version: string;
    ok: boolean;
    findings: Array<{ file: string; line: number; pattern: string }>;
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
      "ops/workstreams/frontend-a11y-i18n/testing-improvement-plan.md",
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
    const plan = createCiPlan([
      "ops/workstreams/frontend-a11y-i18n/testing-improvement-plan.md",
    ]);

    expect(plan.schema_version).toBe(CI_PLAN_SCHEMA_VERSION);
    expect(plan.risk.computed_floor).toBe(0);
    expect(plan.checks.risk_floor.required).toBe(true);
    expect(plan.checks.secret_scan.required).toBe(true);
    expect(plan.checks.install.required).toBe(false);
    expect(plan.checks.playwright_smoke.required).toBe(false);
    expect(plan.security).toMatchObject({
      secrets_allowed: false,
      token_permissions: "contents:read",
    });
  });

  it("routes ordinary UI changes through changed checks and smoke", () => {
    const plan = createCiPlan(["components/header/AppHeader.tsx"], {
      untrustedPr: true,
    });

    expect(plan.untrusted_pr).toBe(true);
    expect(plan.risk.computed_floor).toBe(2);
    expect(plan.checks.install.required).toBe(true);
    expect(plan.checks.lint_changed.required).toBe(true);
    expect(plan.checks.typecheck_changed.required).toBe(true);
    expect(plan.checks.test_typecheck.required).toBe(true);
    expect(plan.checks.jest_changed.required).toBe(true);
    expect(plan.checks.playwright_smoke.required).toBe(true);
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
  });

  it("requires build coverage for deleted runtime source", () => {
    const plan = createCiPlan(["components/example/DeletedWidget.tsx"]);

    expect(plan.risk.computed_floor).toBe(2);
    expect(plan.checks.build.required).toBe(true);
    expect(plan.checks.build.reason).toContain("deleted runtime source");
  });

  it("runs the reviewbot contract when bot config can drift", () => {
    const plan = createCiPlan([".github/6529bot.yml"]);

    expect(plan.checks.reviewbot_contract.required).toBe(true);
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
      reviewKinds?: { initial?: string[] };
    };
    const configLanes = config.reviewKinds?.initial ?? [];
    const schemaLanes =
      schema.properties.review.properties.reviewbot.properties.required_lanes.allOf.map(
        (rule: { contains: { const: string } }) => rule.contains.const
      );

    expect(configLanes).toEqual(REVIEWBOT_LANES);
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
