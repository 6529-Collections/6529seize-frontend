const {
  DEFAULT_REQUIRED_PACKS,
  VALID_STATUSES,
  VALIDATION_PACKS,
  buildManifest,
  createGithubDeployment,
  createGithubDeploymentStatus,
  createReleaseReport,
  evaluateReleaseReadiness,
  heartbeatManifest,
  productionPreflight,
  recordValidationCheck,
  summarizeManifest,
  validateManifest,
} = require("../../ops/scripts/deployment-bus.cjs");
const fs = require("node:fs");
const path = require("node:path");

const STAGING_SHA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const MAIN_SHA = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const ARTIFACT_SHA256 =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function releaseReadyValidationChecks() {
  return [
    {
      pack: "playwright:core-smoke",
      status: "passed",
      command:
        "PLAYWRIGHT_BASE_URL=https://6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:smoke",
      artifacts: [
        {
          uri: "s3://6529-artifacts/frontend/release/core-smoke.json",
          redaction_status: "verified-redacted",
          sha256: ARTIFACT_SHA256,
          retention_days: 90,
        },
      ],
    },
    {
      pack: "playwright:wcag-i18n",
      status: "passed",
      command:
        "PLAYWRIGHT_BASE_URL=https://6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:wcag-i18n",
      artifacts: [
        {
          uri: "https://artifacts.6529.io/frontend/release/wcag-i18n.json",
          redaction_status: "verified-redacted",
          etag: "release-wcag-i18n-etag",
          retention_days: 90,
        },
      ],
    },
  ];
}

describe("deployment bus manifest", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(globalThis, "fetch");
  });

  it("builds a valid standard staging manifest", () => {
    const manifest = buildManifest({
      environment: "staging",
      stagingDeploySha: STAGING_SHA,
      productionCandidateSha: MAIN_SHA,
      productionEligible: "true",
      releaseCaptain: "release-captain",
      now: "2026-06-18T12:00:00.000Z",
    });

    expect(validateManifest(manifest)).toEqual({
      ok: true,
      errors: [],
      warnings: [],
    });
    expect(manifest.release_id).toContain("fe-staging-20260618T120000Z");
    expect(manifest.lane.heartbeat_interval_minutes).toBe(15);
    expect(manifest.lane.stale_after_minutes).toBe(45);
    expect(manifest.validation.required_packs).toEqual(DEFAULT_REQUIRED_PACKS);
    expect(manifest.validation.pack_plan).toEqual([
      expect.objectContaining({
        id: "playwright:core-smoke",
        command: "seize run test:e2e:staging",
      }),
      expect.objectContaining({
        id: "playwright:wcag-i18n",
        command:
          "PLAYWRIGHT_BASE_URL=https://staging.6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:wcag-i18n",
      }),
    ]);
    expect(manifest.validation.durable_artifacts).toMatchObject({
      required: true,
      git_lfs_allowed: false,
    });
  });

  it("records standard production validation pack commands", () => {
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      now: "2026-06-18T12:00:00.000Z",
    });

    expect(VALIDATION_PACKS["playwright:core-smoke"].size).toBe("large");
    expect(manifest.validation.pack_plan).toEqual([
      expect.objectContaining({
        id: "playwright:core-smoke",
        command:
          "PLAYWRIGHT_BASE_URL=https://6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:smoke",
      }),
      expect.objectContaining({
        id: "playwright:wcag-i18n",
        command:
          "PLAYWRIGHT_BASE_URL=https://6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:wcag-i18n",
      }),
    ]);
  });

  it("marks staging without a production candidate as exploratory", () => {
    const manifest = buildManifest({
      environment: "staging",
      stagingDeploySha: STAGING_SHA,
      productionEligible: "false",
      now: "2026-06-18T12:00:00.000Z",
    });

    const result = validateManifest(manifest);

    expect(result.ok).toBe(true);
    expect(result.warnings).toContain(
      "staging manifest is exploratory only; it does not satisfy the production same-SHA gate"
    );
  });

  it("requires production manifests to identify the production candidate SHA", () => {
    const manifest = buildManifest({
      environment: "production",
      productionEligible: "true",
      now: "2026-06-18T12:00:00.000Z",
    });

    const result = validateManifest(manifest);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("shas.production_candidate_sha: required");
  });

  it("adds long-running controls for multi-hour deployments", () => {
    const manifest = buildManifest({
      environment: "staging",
      stagingDeploySha: STAGING_SHA,
      productionCandidateSha: MAIN_SHA,
      complexity: "complex",
      expectedDurationMinutes: "240",
      releaseCaptain: "release-captain",
      now: "2026-06-18T12:00:00.000Z",
    });

    const result = validateManifest(manifest);

    expect(result.ok).toBe(true);
    expect(manifest.long_running.enabled).toBe(true);
    expect(manifest.long_running.progress_update_channels).toContain("wave");
    expect(manifest.lane.heartbeat_interval_minutes).toBe(30);
    expect(manifest.lane.stale_after_minutes).toBe(90);
    expect(manifest.long_running.escalation_after_minutes).toBe(180);
  });

  it("rejects heartbeat cadences that can stale before a missed update is visible", () => {
    const manifest = buildManifest({
      environment: "staging",
      stagingDeploySha: STAGING_SHA,
      productionCandidateSha: MAIN_SHA,
      heartbeatIntervalMinutes: "30",
      staleAfterMinutes: "45",
      now: "2026-06-18T12:00:00.000Z",
    });

    const result = validateManifest(manifest);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "lane.heartbeat_interval_minutes: must be at most half of lane.stale_after_minutes"
    );
  });

  it("records heartbeat progress without losing existing events", () => {
    const manifest = buildManifest({
      environment: "staging",
      stagingDeploySha: STAGING_SHA,
      productionCandidateSha: MAIN_SHA,
      now: "2026-06-18T12:00:00.000Z",
    });

    const updated = heartbeatManifest(manifest, {
      status: "deploying",
      phase: "mid-deploy",
      message: "SSM command still running",
      now: "2026-06-18T13:00:00.000Z",
    });

    expect(updated.status).toBe("deploying");
    expect(updated.lane.heartbeat_at).toBe("2026-06-18T13:00:00.000Z");
    expect(updated.progress).toHaveLength(2);
    expect(updated.progress[1]).toMatchObject({
      phase: "mid-deploy",
      message: "SSM command still running",
    });
    expect(validateManifest(updated).ok).toBe(true);
  });

  it("warns after deploy verification when required validation evidence is missing", () => {
    const manifest = buildManifest({
      environment: "staging",
      stagingDeploySha: STAGING_SHA,
      productionCandidateSha: MAIN_SHA,
      status: "deploy_verified",
      now: "2026-06-18T12:00:00.000Z",
    });

    const result = validateManifest(manifest);
    const readiness = evaluateReleaseReadiness(manifest);

    expect(result.ok).toBe(true);
    expect(result.warnings).toContain(
      "release_readiness.required-pack-missing-terminal-evidence: playwright:core-smoke has no passed validation check recorded"
    );
    expect(readiness.ok).toBe(false);
    expect(readiness.holds).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "required-pack-missing-terminal-evidence",
          pack: "playwright:core-smoke",
        }),
      ])
    );
  });

  it("does not block recording failed or cancelled deploy terminal status", () => {
    const failed = buildManifest({
      environment: "staging",
      stagingDeploySha: STAGING_SHA,
      productionCandidateSha: MAIN_SHA,
      status: "failed",
      now: "2026-06-18T12:00:00.000Z",
    });
    const cancelled = buildManifest({
      environment: "staging",
      stagingDeploySha: STAGING_SHA,
      productionCandidateSha: MAIN_SHA,
      status: "cancelled",
      now: "2026-06-18T12:00:00.000Z",
    });

    expect(validateManifest(failed).errors).toEqual([]);
    expect(validateManifest(cancelled).errors).toEqual([]);
  });

  it("records validation checks and lets later passing reruns clear pack holds", () => {
    const base = buildManifest({
      environment: "staging",
      stagingDeploySha: STAGING_SHA,
      productionCandidateSha: MAIN_SHA,
      status: "deploy_verified",
      now: "2026-06-18T12:00:00.000Z",
    });

    const failed = recordValidationCheck(base, {
      pack: "playwright:core-smoke",
      status: "failed",
      artifactUri:
        "s3://6529-artifacts/frontend/release/core-smoke-failed.json",
      now: "2026-06-18T12:15:00.000Z",
    });
    const passed = recordValidationCheck(failed, {
      pack: "playwright:core-smoke",
      status: "passed",
      artifactUri:
        "s3://6529-artifacts/frontend/release/core-smoke-passed.json",
      artifactSha256: ARTIFACT_SHA256,
      redactionStatus: "verified-redacted",
      retentionDays: "90",
      now: "2026-06-18T12:30:00.000Z",
    });

    expect(passed.validation.checks).toHaveLength(2);
    expect(evaluateReleaseReadiness(failed).holds).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "required-pack-failed",
          pack: "playwright:core-smoke",
        }),
      ])
    );
    expect(evaluateReleaseReadiness(passed).holds).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "required-pack-failed",
          pack: "playwright:core-smoke",
        }),
      ])
    );
    expect(validateManifest(passed).ok).toBe(true);
  });

  it("passes release readiness with required packs and durable artifacts", () => {
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      status: "released",
      validationChecks: JSON.stringify(releaseReadyValidationChecks()),
      now: "2026-06-18T12:00:00.000Z",
    });

    expect(validateManifest(manifest)).toEqual({
      ok: true,
      errors: [],
      warnings: [],
    });
    expect(evaluateReleaseReadiness(manifest)).toEqual({
      ok: true,
      holds: [],
      warnings: [],
    });
  });

  it("requires release-grade durable artifacts on the latest passing check for each pack", () => {
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      status: "released",
      validationChecks: JSON.stringify([
        {
          pack: "playwright:core-smoke",
          status: "passed",
          artifacts: [
            {
              uri: "s3://6529-artifacts/frontend/release/core-smoke.json",
              redaction_status: "verified-redacted",
              sha256: ARTIFACT_SHA256,
              retention_days: 90,
            },
          ],
        },
        {
          pack: "playwright:wcag-i18n",
          status: "passed",
          artifacts: [],
        },
        {
          pack: "ad-hoc:notes",
          status: "passed",
          artifacts: [
            {
              uri: "s3://6529-artifacts/frontend/release/unrelated.json",
              redaction_status: "verified-redacted",
              sha256: ARTIFACT_SHA256,
              retention_days: 90,
            },
          ],
        },
      ]),
      now: "2026-06-18T12:00:00.000Z",
    });

    expect(validateManifest(manifest).errors).toContain(
      "release_readiness.durable-artifact-pointer-missing: playwright:wcag-i18n has no approved durable artifact pointer with verified redaction, integrity metadata, and retention metadata"
    );
  });

  it("rejects tokenized artifact URIs and redacts them in reports", () => {
    const manifest = buildManifest({
      environment: "staging",
      stagingDeploySha: STAGING_SHA,
      productionCandidateSha: MAIN_SHA,
      productionEligible: "true",
      status: "deploy_verified",
      validationChecks: JSON.stringify([
        {
          pack: "playwright:core-smoke",
          status: "passed",
          artifacts: [
            {
              uri: "https://artifacts.6529.io/frontend/release/core-smoke.json?X-Amz-Signature=secret",
              redaction_status: "verified-redacted",
              sha256: ARTIFACT_SHA256,
              retention_days: 90,
            },
          ],
        },
      ]),
      now: "2026-06-18T12:00:00.000Z",
    });

    const result = validateManifest(manifest);
    const report = createReleaseReport(manifest, {
      now: "2026-06-18T13:00:00.000Z",
    });

    expect(result.errors).toContain(
      "validation.checks[0].artifacts[0].uri: artifact URI must not include query strings or fragments"
    );
    expect(report).toContain("Report status: hold");
    expect(report).toContain("[query-or-fragment redacted]");
    expect(report).not.toContain("X-Amz-Signature");
  });

  it("creates a markdown release report with hold details", () => {
    const manifest = buildManifest({
      environment: "staging",
      stagingDeploySha: STAGING_SHA,
      productionCandidateSha: MAIN_SHA,
      status: "deploy_verified",
      now: "2026-06-18T12:00:00.000Z",
    });

    const report = createReleaseReport(manifest, {
      now: "2026-06-18T13:00:00.000Z",
    });

    expect(report).toContain("# staging Release Report");
    expect(report).toContain("Report status: hold");
    expect(report).toContain("playwright:core-smoke");
    expect(report).toContain("required-pack-missing-terminal-evidence");
    expect(report).toContain("Git LFS allowed: false");
  });

  it("keeps invalid manifests on hold even when release readiness passes", () => {
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      status: "released",
      validationChecks: JSON.stringify(releaseReadyValidationChecks()),
      now: "2026-06-18T12:00:00.000Z",
    });
    manifest.release_id = "";

    const report = createReleaseReport(manifest, {
      now: "2026-06-18T13:00:00.000Z",
    });

    expect(evaluateReleaseReadiness(manifest).ok).toBe(true);
    expect(validateManifest(manifest).ok).toBe(false);
    expect(report).toContain("Report status: hold");
    expect(report).toContain("manifest-validation: release_id: required");
  });

  it("summarizes the release id, shas, and lease timing", () => {
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      now: "2026-06-18T12:00:00.000Z",
    });

    expect(summarizeManifest(manifest)).toContain(
      "production_candidate_sha: bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    );
    expect(summarizeManifest(manifest)).toContain("heartbeat: every 15m");
  });

  it("keeps schema status enum in sync with the CLI validator", () => {
    const schema = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), "ops/deployment-bus/manifest.v1.schema.json"),
        "utf8"
      )
    );

    expect(new Set(schema.properties.status.enum)).toEqual(VALID_STATUSES);
  });

  it("passes production preflight when the staged candidate is still current main", () => {
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      productionEligible: "true",
      now: "2026-06-18T12:00:00.000Z",
    });

    const result = productionPreflight(manifest, {
      currentMainSha: MAIN_SHA,
      remote: "origin",
      branch: "main",
    });

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.mainSha).toBe(MAIN_SHA);
  });

  it("fails production preflight when main advanced during a long deploy", () => {
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      productionEligible: "true",
      now: "2026-06-18T12:00:00.000Z",
    });
    const newerMainSha = "cccccccccccccccccccccccccccccccccccccccc";

    const result = productionPreflight(manifest, {
      currentMainSha: newerMainSha,
      remote: "origin",
      branch: "main",
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      `production candidate ${MAIN_SHA} does not match origin/main ${newerMainSha}`
    );
  });

  it("requires production preflight to receive an explicit current main SHA", () => {
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      productionEligible: "true",
      now: "2026-06-18T12:00:00.000Z",
    });

    const result = productionPreflight(manifest, {
      remote: "origin",
      branch: "main",
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "origin/main: current main SHA is required"
    );
  });

  it("creates a GitHub Deployment with a static bus payload and returns the id", async () => {
    const manifest = buildManifest({
      environment: "staging",
      stagingDeploySha: STAGING_SHA,
      productionCandidateSha: MAIN_SHA,
      productionEligible: "true",
      now: "2026-06-18T12:00:00.000Z",
    });
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 201,
      text: async () => JSON.stringify({ id: 12345 }),
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const deployment = await createGithubDeployment(
      manifest,
      {
        ref: STAGING_SHA,
        task: "deploy:staging",
        environment: "staging",
      },
      {
        GITHUB_REPOSITORY: "6529-Collections/6529seize-frontend",
        GITHUB_TOKEN: "test-token",
        GITHUB_API_URL: "https://api.github.test",
      }
    );

    expect(deployment.id).toBe(12345);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.github.test/repos/6529-Collections/6529seize-frontend/deployments"
    );
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      ref: STAGING_SHA,
      task: "deploy:staging",
      auto_merge: false,
      required_contexts: [],
      environment: "staging",
    });
    expect(body.payload.deployment_bus).toEqual({
      schema_version: "deployment-bus.v1",
      source: "workflow-artifact",
    });
  });

  it("rejects GitHub Deployment responses that do not include a numeric id", async () => {
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      now: "2026-06-18T12:00:00.000Z",
    });
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      status: 202,
      text: async () =>
        JSON.stringify({ message: "Accepted without deployment" }),
    })) as unknown as typeof fetch;

    await expect(
      createGithubDeployment(
        manifest,
        { ref: MAIN_SHA, task: "deploy:production", environment: "production" },
        {
          GITHUB_REPOSITORY: "6529-Collections/6529seize-frontend",
          GITHUB_TOKEN: "test-token",
          GITHUB_API_URL: "https://api.github.test",
        }
      )
    ).rejects.toThrow("did not include a numeric id");
  });

  it("creates GitHub Deployment status calls and rejects invalid ids", async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 201,
      text: async () => JSON.stringify({ id: 456, state: "in_progress" }),
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await createGithubDeploymentStatus(
      {
        deploymentId: "12345",
        state: "in_progress",
        description: "still deploying",
        logUrl: "https://github.example/runs/1",
        environmentUrl: "https://staging.6529.io",
      },
      {
        GITHUB_REPOSITORY: "6529-Collections/6529seize-frontend",
        GITHUB_TOKEN: "test-token",
        GITHUB_API_URL: "https://api.github.test",
      }
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.github.test/repos/6529-Collections/6529seize-frontend/deployments/12345/statuses"
    );
    expect(JSON.parse(init.body)).toMatchObject({
      state: "in_progress",
      description: "still deploying",
      auto_inactive: false,
    });

    await expect(
      createGithubDeploymentStatus(
        { deploymentId: "undefined", state: "queued" },
        {
          GITHUB_REPOSITORY: "6529-Collections/6529seize-frontend",
          GITHUB_TOKEN: "test-token",
          GITHUB_API_URL: "https://api.github.test",
        }
      )
    ).rejects.toThrow("deployment id must be numeric");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
