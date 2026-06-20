import fs from "node:fs";
import path from "node:path";

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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  EXISTING_REVIEWBOT_INITIAL_LANES,
  MUTATION_REGISTRY_SCHEMA_VERSION,
  VALIDATION_MANIFEST_SCHEMA_VERSION,
  classifyChangedFiles,
  validateArtifactPointer,
  validateMutationRegistry,
  validateValidationManifest,
} = require("../../ops/scripts/testing-strategy.cjs") as {
  EXISTING_REVIEWBOT_INITIAL_LANES: string[];
  MUTATION_REGISTRY_SCHEMA_VERSION: string;
  VALIDATION_MANIFEST_SCHEMA_VERSION: string;
  classifyChangedFiles: (files: string[]) => RiskResult;
  validateArtifactPointer: (artifact: unknown, index: number) => string[];
  validateMutationRegistry: (registry: unknown) => ValidationResult;
  validateValidationManifest: (manifest: unknown) => ValidationResult;
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
    const result = classifyChangedFiles(["components/header/NavMenu.tsx"]);

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
      ]),
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
      ]),
    );
    expect(result.route_impacts).toContain("/waves/:param");
  });
});

describe("testing strategy validation manifest", () => {
  it("accepts the checked-in minimal example", () => {
    const manifest = JSON.parse(
      fs.readFileSync(
        path.join(
          process.cwd(),
          "ops/testing-strategy/examples/minimal.validation-manifest.json",
        ),
        "utf8",
      ),
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
      ]),
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
      "artifacts: Level 3+ manifests require at least one validated durable artifact pointer",
    );
  });

  it("rejects local or unredacted artifact pointers", () => {
    const errors = validateArtifactPointer(
      artifactPointer({
        uri: "file:///tmp/trace.zip",
        redaction_status: "raw",
        sha256: undefined,
      }),
      0,
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        "artifacts[0].uri: must be a durable artifact pointer, not a local path or Git LFS object",
        "artifacts[0].uri: must start with one of s3://, ipfs://, ipns://, https://artifacts.6529.io/, https://6529-artifacts",
        "artifacts[0]: must include at least one integrity field: sha256, cid, etag, or version_id",
        "artifacts[0].redaction_status: must be one of verified-redacted, not-sensitive, public-redacted",
      ]),
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
      "review.reviewbot.required_lanes: must include existing reviewbot lane: responsiveness",
    );
  });

  it("requires manifests to record the existing reviewbot lanes", () => {
    const manifest = validManifest({
      review: {},
    });

    const result = validateValidationManifest(manifest);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "review.reviewbot.required_lanes: required; every PR must preserve the existing reviewbot lanes",
    );
  });

  it("keeps the schema const in sync with the validator", () => {
    const schema = JSON.parse(
      fs.readFileSync(
        path.join(
          process.cwd(),
          "ops/testing-strategy/validation-manifest.v1.schema.json",
        ),
        "utf8",
      ),
    );

    expect(schema.properties.schema_version.const).toBe(
      VALIDATION_MANIFEST_SCHEMA_VERSION,
    );
  });
});

describe("testing strategy mutation registry", () => {
  it("accepts the checked-in empty registry contract", () => {
    const registry = JSON.parse(
      fs.readFileSync(
        path.join(
          process.cwd(),
          "ops/testing-strategy/mutation-endpoint-registry.json",
        ),
        "utf8",
      ),
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
      ]),
    );
  });

  it("keeps the mutation registry schema const in sync with the validator", () => {
    const schema = JSON.parse(
      fs.readFileSync(
        path.join(
          process.cwd(),
          "ops/testing-strategy/mutation-endpoint-registry.v1.schema.json",
        ),
        "utf8",
      ),
    );

    expect(schema.properties.schema_version.const).toBe(
      MUTATION_REGISTRY_SCHEMA_VERSION,
    );
  });
});
