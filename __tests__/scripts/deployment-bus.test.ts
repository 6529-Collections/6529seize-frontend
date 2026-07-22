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
  recordPostDeployWatch,
  recordValidationCheck,
  redactArtifactText,
  summarizeManifest,
  uploadValidationArtifact,
  validateManifest,
  verifyArtifactTextRedacted,
} = require("../../ops/scripts/deployment-bus.cjs");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const YAML = require("yaml");

const STAGING_SHA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const MAIN_SHA = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const ARTIFACT_SHA256 =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const REQUIRED_WEB_SURFACES = ["web:desktop-chromium", "web:mobile-chromium"];

describe("release bus optional Codex workflow", () => {
  const composeWorkflow = fs.readFileSync(
    path.join(process.cwd(), ".github/workflows/release-bus-compose.yml"),
    "utf8"
  );

  it("guards and integrity-checks a Codex-disabled deferred composition", () => {
    expect(composeWorkflow).toContain(
      "git rev-parse -q --verify MERGE_HEAD >/dev/null"
    );
    expect(composeWorkflow).toContain("Release-Bus-Defer: true");
    expect(composeWorkflow).toContain(
      "Incomplete composition does not contain a strict candidate prefix."
    );
    expect(composeWorkflow).toContain('test "$missing_seen" = true');
  });
});

describe("release bus immutable frontend artifact", () => {
  const preflightWorkflow = YAML.parse(
    fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/release-bus-preflight.yml"),
      "utf8"
    )
  );

  it("uploads hidden bundle files covered by the checksum manifest", () => {
    const packageStep = preflightWorkflow.jobs.build.steps.find(
      (step: { name?: string }) => step.name === "Package immutable bundle"
    );
    const uploadStep = preflightWorkflow.jobs.build.steps.find(
      (step: { name?: string }) =>
        step.name === "Upload immutable frontend artifact"
    );

    expect(packageStep.run).toContain("find . -type f ! -path ./SHA256SUMS");
    expect(packageStep.run).toContain("sha256sum > SHA256SUMS");
    expect(uploadStep).toMatchObject({
      uses: expect.stringContaining("actions/upload-artifact@"),
      with: {
        path: "release-bus-artifact",
        "include-hidden-files": true,
        "if-no-files-found": "error",
        "retention-days": 90,
      },
    });
  });
});

describe("release bus staging artifact transfer", () => {
  const deployWorkflow = YAML.parse(
    fs.readFileSync(
      path.join(
        process.cwd(),
        ".github/workflows/release-bus-deploy-staging.yml"
      ),
      "utf8"
    )
  );

  it("uses the bucket region and rejects redirect bodies before activation", () => {
    const stageStep = deployWorkflow.jobs.deploy.steps.find(
      (step: { name?: string }) =>
        step.name === "Stage artifact for the managed instance"
    );
    const deployStep = deployWorkflow.jobs.deploy.steps.find(
      (step: { name?: string }) =>
        step.name === "Deploy immutable bundle through SSM"
    );

    expect(deployWorkflow.env.ARTIFACT_BUCKET_REGION).toContain("us-east-1");
    expect(
      stageStep.run.match(/--region "\$ARTIFACT_BUCKET_REGION"/g)
    ).toHaveLength(2);
    const artifactTransfer = deployStep.run.slice(
      deployStep.run.indexOf('http_status="$(curl'),
      deployStep.run.indexOf('test "$http_status" = 200')
    );
    expect(artifactTransfer).not.toContain("curl --fail");
    expect(deployStep.run).toContain("--write-out '%{http_code}'");
    expect(deployStep.run).toContain('test "$http_status" = 200');
    expect(deployStep.run.indexOf('test "$http_status" = 200')).toBeLessThan(
      deployStep.run.indexOf("sha256sum -c -")
    );
  });

  it("migrates only the exact legacy PM2 process and verifies locally", () => {
    const deployStep = deployWorkflow.jobs.deploy.steps.find(
      (step: { name?: string }) =>
        step.name === "Deploy immutable bundle through SSM"
    );
    const script = deployStep.run;

    expect(script).toContain(
      'process_count="$(jq \'[.[] | select(.name == "6529seize")] | length\''
    );
    expect(script).toContain('.pm_exec_path == "/usr/bin/bash"');
    expect(script).toContain(".pm_cwd == $repo_dir");
    expect(script).toContain(
      '.args == ["-lc", ("cd \\\"" + $repo_dir + "\\\" && ./bin/6529 run start:standalone")]'
    );
    expect(script).toContain(
      "Refusing to replace an unrecognized 6529seize PM2 process."
    );
    expect(script).toContain(
      "Refusing to deploy with duplicate 6529seize PM2 processes."
    );
    expect(script).toContain("process_kind='legacy'");
    expect(script).toContain("restore_legacy_process");
    expect(script).toContain("delete_6529_process || return 1");
    expect(script).toContain("restore_previous_link || return 1");
    expect(script).toContain("--update-env || return 1");
    expect(script).toContain("pm2 save || return 1");
    expect(script).toContain(
      'wait_for_local_version "$previous_local_version" || return 1'
    );
    expect(script).toContain('wait_for_local_version "$EXPECTED_SHA"');
    expect(script).toContain(
      "Refusing to deploy without an exact healthy pre-mutation local version."
    );
    expect(script).toContain("http://127.0.0.1:3001/api/version");
    expect(
      script.lastIndexOf('wait_for_local_version "$EXPECTED_SHA"')
    ).toBeLessThan(script.lastIndexOf("pm2 save"));
  });
});

function releaseArtifact(uri, metadata) {
  return {
    uri,
    redaction_status: "verified-redacted",
    retention_days: 90,
    ...metadata,
  };
}

function releasePackCheck({ pack, command, artifact, surfaces }) {
  return {
    pack,
    status: "passed",
    command,
    surfaces: surfaces ?? [...REQUIRED_WEB_SURFACES],
    artifacts: [artifact],
  };
}

function withTempArtifactDir(callback) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tmp-artifact-"));
  try {
    return callback(tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function mockSuccessfulS3Upload() {
  return jest.spyOn(childProcess, "spawnSync").mockReturnValue({
    status: 0,
    stdout: "",
    stderr: "",
  });
}

function writeJsonEvidence(tempDir, fileName, value) {
  const sourceFile = path.join(tempDir, fileName);
  fs.writeFileSync(sourceFile, JSON.stringify(value));
  return sourceFile;
}

function releaseReadyValidationChecks() {
  return [
    releasePackCheck({
      pack: "playwright:core-smoke",
      command:
        "PLAYWRIGHT_BASE_URL=https://6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:smoke:surface-matrix",
      artifact: releaseArtifact(
        "s3://6529-artifacts/frontend/release/core-smoke.json",
        { sha256: ARTIFACT_SHA256 }
      ),
    }),
    releasePackCheck({
      pack: "playwright:surface-matrix",
      command:
        "PLAYWRIGHT_BASE_URL=https://6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:surface-matrix",
      artifact: releaseArtifact(
        "s3://6529-artifacts/frontend/release/surface-matrix.json",
        { sha256: ARTIFACT_SHA256 }
      ),
    }),
    releasePackCheck({
      pack: "playwright:wcag-i18n",
      command:
        "PLAYWRIGHT_BASE_URL=https://6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:wcag-i18n:surface-matrix",
      artifact: releaseArtifact(
        "https://artifacts.6529.io/frontend/release/wcag-i18n.json",
        { etag: "9b2cf535f27731c974343645a3985328" }
      ),
    }),
  ];
}

function releaseReadyPostDeployWatch(overrides = {}) {
  return {
    required: true,
    status: "passed",
    min_duration_minutes: 30,
    observed_duration_minutes: 30,
    started_at: "2026-06-18T13:00:00.000Z",
    completed_at: "2026-06-18T13:30:00.000Z",
    checkpoints: [
      {
        id: "release-captain-validation",
        status: "passed",
        recorded_at: "2026-06-18T13:30:00.000Z",
        evidence: [
          "https://github.com/6529-Collections/6529seize-frontend/actions/runs/123",
        ],
      },
    ],
    notes: "Post-deploy watch passed.",
    ...overrides,
  };
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
        command: "seize run test:e2e:staging:smoke",
      }),
      expect.objectContaining({
        id: "playwright:surface-matrix",
        command: "seize run test:e2e:staging",
      }),
      expect.objectContaining({
        id: "playwright:wcag-i18n",
        command:
          "PLAYWRIGHT_BASE_URL=https://staging.6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:wcag-i18n:surface-matrix",
      }),
    ]);
    expect(manifest.validation.durable_artifacts).toMatchObject({
      required: true,
      git_lfs_allowed: false,
    });
    expect(manifest.post_deploy_watch).toMatchObject({
      required: false,
      status: "not_started",
    });
    expect(manifest.canary_readiness).toMatchObject({
      current_capability: "not-applicable",
      traffic_splitting_supported: false,
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
          "PLAYWRIGHT_BASE_URL=https://6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:smoke:surface-matrix",
      }),
      expect.objectContaining({
        id: "playwright:surface-matrix",
        command:
          "PLAYWRIGHT_BASE_URL=https://6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:surface-matrix",
      }),
      expect.objectContaining({
        id: "playwright:wcag-i18n",
        command:
          "PLAYWRIGHT_BASE_URL=https://6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:wcag-i18n:surface-matrix",
      }),
    ]);
    expect(manifest.post_deploy_watch).toMatchObject({
      required: true,
      min_duration_minutes: 30,
    });
    expect(manifest.canary_readiness).toMatchObject({
      current_capability: "auto-hold-only",
      traffic_splitting_supported: false,
    });
  });

  it("supports the production read-only aggregate as required production evidence", () => {
    const requiredPacks = [
      ...DEFAULT_REQUIRED_PACKS,
      "playwright:production-readonly",
    ];
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      status: "released",
      requiredPacks: requiredPacks.join(","),
      validationChecks: JSON.stringify([
        ...releaseReadyValidationChecks(),
        releasePackCheck({
          pack: "playwright:production-readonly",
          command: "seize run test:e2e:production:readonly",
          surfaces: ["web:desktop-chromium"],
          artifact: releaseArtifact(
            "s3://6529-artifacts/frontend/release/production-readonly.json",
            { sha256: ARTIFACT_SHA256 }
          ),
        }),
      ]),
      postDeployWatchStatus: "passed",
      postDeployWatchObservedDurationMinutes: "30",
      postDeployWatchStartedAt: "2026-06-18T13:00:00.000Z",
      postDeployWatchCompletedAt: "2026-06-18T13:30:00.000Z",
      postDeployWatchCheckpoints: JSON.stringify(
        releaseReadyPostDeployWatch().checkpoints
      ),
      now: "2026-06-18T12:00:00.000Z",
    });

    expect(manifest.validation.required_packs).toEqual(requiredPacks);
    expect(manifest.validation.pack_plan).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "playwright:production-readonly",
          command: "seize run test:e2e:production:readonly",
          surfaces: ["web:desktop-chromium"],
        }),
      ])
    );
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

  it("supports native surface evidence as an optional standard pack", () => {
    const requiredPacks = [
      ...DEFAULT_REQUIRED_PACKS,
      "native:surface-evidence",
    ];
    const manifest = buildManifest({
      environment: "staging",
      stagingDeploySha: STAGING_SHA,
      productionCandidateSha: MAIN_SHA,
      productionEligible: "true",
      requiredPacks: requiredPacks.join(","),
      now: "2026-06-18T12:00:00.000Z",
    });

    expect(VALIDATION_PACKS["native:surface-evidence"]).toMatchObject({
      size: "large",
      artifacts: ["test-results/native-surface-evidence*.json"],
    });
    expect(manifest.validation.required_packs).toEqual(requiredPacks);
    expect(manifest.validation.pack_plan).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "native:surface-evidence",
          command: "seize run test:native-evidence",
          surfaces: ["native:surface-evidence-classifier"],
        }),
      ])
    );
    expect(validateManifest(manifest)).toEqual({
      ok: true,
      errors: [],
      warnings: [],
    });
  });

  it("rejects production-only standard packs on staging manifests", () => {
    const manifest = buildManifest({
      environment: "staging",
      stagingDeploySha: STAGING_SHA,
      productionCandidateSha: MAIN_SHA,
      productionEligible: "true",
      requiredPacks: [
        ...DEFAULT_REQUIRED_PACKS,
        "playwright:production-readonly",
      ].join(","),
      now: "2026-06-18T12:00:00.000Z",
    });

    expect(manifest.validation.pack_plan).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "playwright:production-readonly",
          command: null,
        }),
      ])
    );
    expect(validateManifest(manifest).errors).toContain(
      "validation.required_packs: playwright:production-readonly has no standard command for staging"
    );
  });

  it("forces durable evidence for production-like manifests", () => {
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      durableArtifactsRequired: "false",
      now: "2026-06-18T12:00:00.000Z",
    });

    expect(manifest.validation.durable_artifacts.required).toBe(true);

    manifest.validation.durable_artifacts.required = false;
    expect(validateManifest(manifest).errors).toContain(
      "validation.durable_artifacts.required: must be true for production or production-eligible manifests"
    );
  });

  it("forces post-deploy watch requirements for production manifests", () => {
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      postDeployWatchRequired: "false",
      now: "2026-06-18T12:00:00.000Z",
    });

    expect(manifest.post_deploy_watch.required).toBe(true);

    manifest.post_deploy_watch.required = false;
    expect(validateManifest(manifest).errors).toContain(
      "post_deploy_watch.required: must be true for production manifests"
    );
    expect(evaluateReleaseReadiness(manifest).holds).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "post-deploy-watch-required" }),
      ])
    );
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

  it("records durable artifact retention policy metadata", () => {
    const base = buildManifest({
      environment: "staging",
      stagingDeploySha: STAGING_SHA,
      productionCandidateSha: MAIN_SHA,
      now: "2026-06-18T12:00:00.000Z",
    });

    const updated = recordValidationCheck(base, {
      pack: "playwright:core-smoke",
      status: "passed",
      artifactUri: "s3://6529-artifacts/frontend/release/core-smoke.json",
      artifactSha256: ARTIFACT_SHA256,
      redactionStatus: "verified-redacted",
      retentionPolicy: "standard-90-days",
      now: "2026-06-18T12:30:00.000Z",
    });

    expect(updated.validation.checks[0].artifacts[0]).toMatchObject({
      retention_policy: "standard-90-days",
    });
    expect(validateManifest(updated).errors).toEqual([]);
  });

  it("uploads redacted validation evidence to approved S3 storage", () => {
    withTempArtifactDir((tempDir) => {
      const redactedOutput = path.join(tempDir, "redacted.json");
      const tokenValue = ["fake", "token", "value", "1234567890"].join("-");
      const stagingEnvKey = ["STAGING", "AUTH"].join("_");
      const stagingValue = ["fake", "stage", "code"].join("-");
      const sourceFile = writeJsonEvidence(
        tempDir,
        "deployment-version-evidence.json",
        {
          status: "ok",
          authorization: ["Authorization", `Bearer ${tokenValue}`].join(": "),
          staging: `${stagingEnvKey}=${stagingValue}`,
        }
      );
      const spawnSpy = mockSuccessfulS3Upload();
      const base = buildManifest({
        environment: "staging",
        stagingDeploySha: STAGING_SHA,
        productionCandidateSha: MAIN_SHA,
        now: "2026-06-18T12:00:00.000Z",
      });

      const updated = uploadValidationArtifact(
        base,
        {
          pack: "deployment:http-version",
          status: "passed",
          sourceFile,
          artifactName: "deployment-version-evidence.json",
          s3Prefix: "s3://6529reviewbot-prod-artifacts/frontend-deployment/",
          retentionPolicy: "standard-90-days",
          redactedOutput,
          now: "2026-06-18T12:30:00.000Z",
        },
        {}
      );

      const check = updated.validation.checks[0];
      const artifact = check.artifacts[0];
      const redacted = fs.readFileSync(redactedOutput, "utf8");
      expect(check).toMatchObject({
        pack: "deployment:http-version",
        status: "passed",
        command: VALIDATION_PACKS["deployment:http-version"].commands.staging,
        surfaces: [],
      });
      expect(redacted).toContain("[REDACTED]");
      expect(redacted).not.toContain(tokenValue);
      expect(redacted).not.toContain(stagingValue);
      expect(verifyArtifactTextRedacted(redacted)).toEqual({
        ok: true,
        findings: [],
      });
      expect(artifact).toMatchObject({
        uri: "s3://6529reviewbot-prod-artifacts/frontend-deployment/fe-staging-20260618T120000Z-bbbbbbbbbbbb/deployment-http-version/20260618T123000Z-deployment-version-evidence.json",
        redaction_status: "verified-redacted",
        retention_policy: "standard-90-days",
      });
      expect(artifact.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(spawnSpy).toHaveBeenCalledWith(
        "aws",
        expect.arrayContaining([
          "s3",
          "cp",
          redactedOutput,
          artifact.uri,
          "--only-show-errors",
        ]),
        expect.any(Object)
      );
      expect(validateManifest(updated).errors).toEqual([]);
      expect(evaluateReleaseReadiness(updated).holds).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "required-pack-missing-terminal-evidence",
            pack: "playwright:core-smoke",
          }),
          expect.objectContaining({
            id: "required-pack-missing-terminal-evidence",
            pack: "playwright:surface-matrix",
          }),
          expect.objectContaining({
            id: "required-pack-missing-terminal-evidence",
            pack: "playwright:wcag-i18n",
          }),
        ])
      );
      expect(
        evaluateReleaseReadiness({
          ...updated,
          validation: {
            ...updated.validation,
            required_packs: ["deployment:http-version"],
          },
        }).holds
      ).toEqual([]);
    });
  });

  it("records workflow-shaped durable evidence without explicit surfaces", () => {
    withTempArtifactDir((tempDir) => {
      const sourceFile = writeJsonEvidence(
        tempDir,
        "deployment-version-evidence.json",
        {
          status: "ok",
          expected_sha: STAGING_SHA,
        }
      );
      const spawnSpy = mockSuccessfulS3Upload();
      const base = buildManifest({
        environment: "staging",
        stagingDeploySha: STAGING_SHA,
        productionCandidateSha: MAIN_SHA,
        now: "2026-06-18T12:00:00.000Z",
      });

      const updated = uploadValidationArtifact(
        base,
        {
          pack: "deployment:http-version",
          status: "passed",
          sourceFile,
          artifactName: "deployment-version-evidence.json",
          retentionPolicy: "standard-90-days",
          runUrl:
            "https://github.com/6529-Collections/6529seize-frontend/actions/runs/1",
          notes: "Durable staging GET /api/version evidence.",
          now: "2026-06-18T12:30:00.000Z",
        },
        {
          DEPLOYMENT_ARTIFACT_S3_PREFIX:
            "s3://6529reviewbot-prod-artifacts/frontend-deployment/",
        }
      );

      const check = updated.validation.checks[0];
      expect(check).toMatchObject({
        pack: "deployment:http-version",
        status: "passed",
        surfaces: [],
      });
      expect(check.artifacts[0].uri).toBe(
        "s3://6529reviewbot-prod-artifacts/frontend-deployment/fe-staging-20260618T120000Z-bbbbbbbbbbbb/deployment-http-version/20260618T123000Z-deployment-version-evidence.json"
      );
      expect(validateManifest(updated).errors).toEqual([]);
      expect(spawnSpy).toHaveBeenCalledWith(
        "aws",
        expect.arrayContaining([
          "s3",
          "cp",
          expect.any(String),
          check.artifacts[0].uri,
          "--only-show-errors",
        ]),
        expect.any(Object)
      );
    });
  });

  it("rejects unapproved S3 artifact prefixes before upload", () => {
    withTempArtifactDir((tempDir) => {
      const sourceFile = writeJsonEvidence(tempDir, "evidence.json", {
        status: "ok",
      });
      const spawnSpy = jest.spyOn(childProcess, "spawnSync");
      const base = buildManifest({
        environment: "staging",
        stagingDeploySha: STAGING_SHA,
        productionCandidateSha: MAIN_SHA,
        now: "2026-06-18T12:00:00.000Z",
      });

      expect(() =>
        uploadValidationArtifact(
          base,
          {
            pack: "deployment:http-version",
            sourceFile,
            s3Prefix: "s3://unapproved-artifacts/",
          },
          {}
        )
      ).toThrow("Artifact S3 prefix must be approved by the deployment bus");
      expect(spawnSpy).not.toHaveBeenCalled();
    });
  });

  it("removes traversal segments from artifact S3 keys", () => {
    withTempArtifactDir((tempDir) => {
      const sourceFile = writeJsonEvidence(tempDir, "evidence.json", {
        status: "ok",
      });
      mockSuccessfulS3Upload();
      const base = buildManifest({
        environment: "staging",
        stagingDeploySha: STAGING_SHA,
        productionCandidateSha: MAIN_SHA,
        now: "2026-06-18T12:00:00.000Z",
      });

      const updated = uploadValidationArtifact(
        base,
        {
          pack: "a/../../x",
          sourceFile,
          artifactName: "../../deployment-version-evidence.json",
          s3Prefix: "s3://6529reviewbot-prod-artifacts/frontend-deployment/",
          retentionPolicy: "standard-90-days",
          now: "2026-06-18T12:30:00.000Z",
        },
        {}
      );

      const artifactUri = updated.validation.checks[0].artifacts[0].uri;
      expect(artifactUri).not.toContain("..");
      expect(artifactUri).toContain("/a/x/");
      expect(artifactUri).toContain(
        "/20260618T123000Z-deployment-version-evidence.json"
      );
    });
  });

  it("redacts deployment artifact text with the shared release patterns", () => {
    const cookieLine = ["Cookie", "session=fake-cookie-value"].join(": ");
    const tokenValue = ["fake", "token", "value", "1234567890"].join("-");
    const authLine = ["Authorization", `Bearer ${tokenValue}`].join(": ");
    const basicAuthLine = ["Authorization", `Basic ${tokenValue}`].join(": ");
    const raw = `${cookieLine}\n${authLine}\n${basicAuthLine}`;
    const redacted = redactArtifactText(raw);

    expect(redacted).toContain("[REDACTED]");
    expect(redacted).not.toContain(tokenValue);
    expect(verifyArtifactTextRedacted(redacted)).toEqual({
      ok: true,
      findings: [],
    });

    const overlappingKey = ["STAGING", "API", "KEY"].join("_");
    const overlappingValue = ["fake", "token", "value", "1234567890"].join("-");
    const overlapping = redactArtifactText(
      `${overlappingKey}=${overlappingValue}`
    );
    expect(overlapping).toBe("[REDACTED]");
    expect(overlapping).not.toContain(overlappingValue);
    expect(verifyArtifactTextRedacted(overlapping)).toEqual({
      ok: true,
      findings: [],
    });
  });

  it("redacts pretty-printed JSON secret keys before verification", () => {
    const tokenValue = ["json", "secret", "value", "1234567890"].join("-");
    const raw = `{
  "status": "ok",
  "nested": {
    "token":
      "${tokenValue}"
  }
}`;

    expect(verifyArtifactTextRedacted(raw)).toMatchObject({
      ok: false,
      findings: [expect.objectContaining({ pattern: "json-secret-key" })],
    });

    const redacted = redactArtifactText(raw);
    expect(redacted).toContain("[REDACTED]");
    expect(redacted).not.toContain(tokenValue);
    expect(verifyArtifactTextRedacted(redacted)).toEqual({
      ok: true,
      findings: [],
    });
  });

  it("passes release readiness with required packs and durable artifacts", () => {
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      status: "released",
      validationChecks: JSON.stringify(releaseReadyValidationChecks()),
      postDeployWatchStatus: "passed",
      postDeployWatchObservedDurationMinutes: "30",
      postDeployWatchStartedAt: "2026-06-18T13:00:00.000Z",
      postDeployWatchCompletedAt: "2026-06-18T13:30:00.000Z",
      postDeployWatchCheckpoints: JSON.stringify(
        releaseReadyPostDeployWatch().checkpoints
      ),
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

  it("holds production readiness until post-deploy watch passes", () => {
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      status: "released",
      validationChecks: JSON.stringify(releaseReadyValidationChecks()),
      now: "2026-06-18T12:00:00.000Z",
    });

    expect(validateManifest(manifest).errors).toContain(
      "release_readiness.post-deploy-watch-missing: post-deploy watch has not recorded a passed status"
    );
    expect(evaluateReleaseReadiness(manifest).holds).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "post-deploy-watch-missing" }),
      ])
    );
  });

  it("holds production readiness until release-captain validation evidence is recorded", () => {
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      status: "released",
      validationChecks: JSON.stringify(releaseReadyValidationChecks()),
      postDeployWatchStatus: "passed",
      postDeployWatchObservedDurationMinutes: "30",
      postDeployWatchStartedAt: "2026-06-18T13:00:00.000Z",
      postDeployWatchCompletedAt: "2026-06-18T13:30:00.000Z",
      postDeployWatchCheckpoints: JSON.stringify([
        {
          id: "version-match",
          status: "passed",
          recorded_at: "2026-06-18T13:30:00.000Z",
          evidence: [
            "https://github.com/6529-Collections/6529seize-frontend/actions/runs/123",
          ],
        },
      ]),
      now: "2026-06-18T12:00:00.000Z",
    });

    expect(validateManifest(manifest).errors).toContain(
      "release_readiness.post-deploy-watch-validation-checkpoint-missing: post-deploy watch requires a passed release-captain-validation checkpoint with evidence"
    );
    expect(evaluateReleaseReadiness(manifest).holds).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "post-deploy-watch-validation-checkpoint-missing",
        }),
      ])
    );
  });

  it("records post-deploy watch evidence without satisfying durable artifact holds", () => {
    const checksWithoutArtifacts = releaseReadyValidationChecks().map(
      (check) => ({
        ...check,
        artifacts: [],
      })
    );
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      status: "deploy_verified",
      validationChecks: JSON.stringify(checksWithoutArtifacts),
      now: "2026-06-18T12:00:00.000Z",
    });

    const watched = recordPostDeployWatch(manifest, {
      status: "passed",
      observedDurationMinutes: "30",
      checkpoint: "release-captain-validation",
      evidence:
        "https://github.com/6529-Collections/6529seize-frontend/actions/runs/123",
      notes: "EB health green and deployed version matched.",
      now: "2026-06-18T13:30:00.000Z",
    });
    const readiness = evaluateReleaseReadiness(watched);
    const report = createReleaseReport(watched, {
      now: "2026-06-18T13:35:00.000Z",
    });

    expect(watched.post_deploy_watch).toMatchObject({
      status: "passed",
      observed_duration_minutes: 30,
    });
    expect(watched.post_deploy_watch.checkpoints[0]).toMatchObject({
      id: "release-captain-validation",
      status: "passed",
      evidence: [
        "https://github.com/6529-Collections/6529seize-frontend/actions/runs/123",
      ],
    });
    expect(readiness.holds).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "durable-artifact-pointer-missing" }),
      ])
    );
    expect(readiness.holds).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "post-deploy-watch-missing" }),
      ])
    );
    expect(report).toContain("## Post-Deploy Watch");
    expect(report).toContain("release-captain-validation: passed");
    expect(report).toContain(
      "https://github.com/6529-Collections/6529seize-frontend/actions/runs/123"
    );
    expect(report).toContain("## Canary Readiness");
    expect(report).toContain("current capability: auto-hold-only");
  });

  it("defaults not-started checkpoint records to not-run", () => {
    const manifest = buildManifest({
      environment: "staging",
      stagingDeploySha: STAGING_SHA,
      productionCandidateSha: MAIN_SHA,
      now: "2026-06-18T12:00:00.000Z",
    });

    const watched = recordPostDeployWatch(manifest, {
      status: "not_started",
      checkpoint: "manual-watch",
      now: "2026-06-18T12:05:00.000Z",
    });

    expect(watched.post_deploy_watch.checkpoints[0]).toMatchObject({
      id: "manual-watch",
      status: "not_run",
    });
    expect(validateManifest(watched).errors).toEqual([]);
  });

  it("rejects impossible traffic-split canary declarations", () => {
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      canaryCapability: "traffic-split",
      trafficSplittingSupported: "false",
      now: "2026-06-18T12:00:00.000Z",
    });

    expect(validateManifest(manifest).errors).toContain(
      "canary_readiness.traffic_splitting_supported: must be true when current_capability is traffic-split"
    );
  });

  it("rejects unapproved durable artifact prefixes before artifact matching", () => {
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
              uri: "https://untrusted.example/artifacts/core-smoke.json",
              redaction_status: "verified-redacted",
              sha256: ARTIFACT_SHA256,
              retention_days: 90,
            },
          ],
        },
        releaseReadyValidationChecks()[1],
      ]),
      now: "2026-06-18T12:00:00.000Z",
    });
    manifest.validation.durable_artifacts.accepted_prefixes = [
      "https://untrusted.example/artifacts/",
    ];

    const errors = validateManifest(manifest).errors;
    expect(errors).toContain(
      "validation.durable_artifacts.accepted_prefixes[0]: must be one of the approved durable artifact prefixes"
    );
    expect(errors).toContain(
      "validation.checks[0].artifacts[0].uri: artifact URI does not use an approved durable artifact prefix"
    );
  });

  it("requires well-formed artifact metadata for release readiness", () => {
    const checks = releaseReadyValidationChecks();
    checks[0].artifacts[0].sha256 = "not-a-sha";
    checks[0].artifacts[0].retention_days = -1;
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      status: "released",
      validationChecks: JSON.stringify(checks),
      now: "2026-06-18T12:00:00.000Z",
    });

    expect(validateManifest(manifest).errors).toContain(
      "release_readiness.durable-artifact-pointer-missing: playwright:core-smoke has no approved durable artifact pointer with verified redaction, integrity metadata, and retention metadata"
    );
  });

  it("holds release readiness when a standard pack records the wrong command", () => {
    const checks = releaseReadyValidationChecks();
    checks[0].command = "seize run test:e2e";
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      status: "released",
      validationChecks: JSON.stringify(checks),
      now: "2026-06-18T12:00:00.000Z",
    });

    expect(validateManifest(manifest).errors).toContain(
      "release_readiness.required-pack-command-mismatch: playwright:core-smoke latest passing check did not record the expected command"
    );
  });

  it("holds release readiness when a standard pack is missing required surfaces", () => {
    const checks = releaseReadyValidationChecks();
    checks[1].surfaces = ["web:desktop-chromium"];
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      status: "released",
      validationChecks: JSON.stringify(checks),
      now: "2026-06-18T12:00:00.000Z",
    });

    expect(validateManifest(manifest).errors).toContain(
      "release_readiness.required-pack-surface-evidence-missing: playwright:surface-matrix latest passing check is missing required surfaces: web:mobile-chromium"
    );
  });

  it("uses recorded_at ordering for latest validation checks", () => {
    const checks = releaseReadyValidationChecks();
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      status: "released",
      validationChecks: JSON.stringify([
        {
          pack: "playwright:core-smoke",
          status: "failed",
          recorded_at: "2026-06-18T12:30:00.000Z",
        },
        {
          ...checks[0],
          recorded_at: "2026-06-18T12:15:00.000Z",
        },
        checks[1],
      ]),
      now: "2026-06-18T12:00:00.000Z",
    });

    expect(validateManifest(manifest).errors).toContain(
      "release_readiness.required-pack-failed: playwright:core-smoke recorded failed"
    );
  });

  it("requires release-grade durable artifacts on the latest passing check for each pack", () => {
    const checks = releaseReadyValidationChecks();
    checks[2].artifacts = [];

    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      status: "released",
      validationChecks: JSON.stringify([
        ...checks,
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

  it("rejects tokenized post-deploy watch evidence and redacts it in reports", () => {
    const manifest = buildManifest({
      environment: "production",
      productionCandidateSha: MAIN_SHA,
      status: "released",
      validationChecks: JSON.stringify(releaseReadyValidationChecks()),
      postDeployWatchStatus: "passed",
      postDeployWatchObservedDurationMinutes: "30",
      postDeployWatchStartedAt: "2026-06-18T13:00:00.000Z",
      postDeployWatchCompletedAt: "2026-06-18T13:30:00.000Z",
      postDeployWatchCheckpoints: JSON.stringify([
        {
          id: "release-captain-validation",
          status: "passed",
          recorded_at: "2026-06-18T13:30:00.000Z",
          evidence: [
            "https://artifacts.6529.io/frontend/release/watch.json?X-Amz-Signature=secret#frag",
          ],
        },
      ]),
      now: "2026-06-18T12:00:00.000Z",
    });

    const result = validateManifest(manifest);
    const report = createReleaseReport(manifest, {
      now: "2026-06-18T14:00:00.000Z",
    });

    expect(result.errors).toContain(
      "post_deploy_watch.checkpoints[0].evidence[0]: evidence URI must not include query strings or fragments"
    );
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
      postDeployWatchStatus: "passed",
      postDeployWatchObservedDurationMinutes: "30",
      postDeployWatchCheckpoints: JSON.stringify(
        releaseReadyPostDeployWatch().checkpoints
      ),
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
