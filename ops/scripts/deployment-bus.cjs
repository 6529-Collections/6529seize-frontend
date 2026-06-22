#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { parseArgs } = require("./cli-args.cjs");

const SCHEMA_VERSION = "deployment-bus.v1";
const SHA_RE = /^[0-9a-f]{40}$/i;
const SHA256_RE = /^[0-9a-f]{64}$/i;
const ETAG_RE = /^"?[0-9a-f]{32}(?:-\d+)?"?$/i;
const CID_RE = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{20,})$/;
const VALID_ENVIRONMENTS = new Set(["staging", "production"]);
const REQUIRED_WEB_SURFACES = Object.freeze([
  "web:desktop-chromium",
  "web:mobile-chromium",
]);
const PLAYWRIGHT_ARTIFACT_PATTERNS = Object.freeze([
  "test-results/playwright/**",
  "playwright-report/**",
]);
const VALIDATION_PACKS = Object.freeze({
  "playwright:core-smoke": createPlaywrightPack({
    id: "playwright:core-smoke",
    description: "Read-only core route smoke pack for deployed web health.",
    stagingCommand: "seize run test:e2e:staging:smoke",
    productionCommand:
      "PLAYWRIGHT_BASE_URL=https://6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:smoke:surface-matrix",
  }),
  "playwright:surface-matrix": createPlaywrightPack({
    id: "playwright:surface-matrix",
    description:
      "Read-only route, navigation, search, network, and delegation surface matrix.",
    stagingCommand: "seize run test:e2e:staging",
    productionCommand:
      "PLAYWRIGHT_BASE_URL=https://6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:surface-matrix",
  }),
  "playwright:wcag-i18n": createPlaywrightPack({
    id: "playwright:wcag-i18n",
    description:
      "Read-only WCAG/i18n route evidence pack for deployed public routes.",
    stagingCommand:
      "PLAYWRIGHT_BASE_URL=https://staging.6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:wcag-i18n:surface-matrix",
    productionCommand:
      "PLAYWRIGHT_BASE_URL=https://6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:wcag-i18n:surface-matrix",
  }),
  "playwright:production-readonly": createPlaywrightPack({
    id: "playwright:production-readonly",
    description:
      "Aggregate production-safe read-only pack across public high-value app workflows.",
    productionCommand: "seize run test:e2e:production:readonly",
    surfaces: ["web:desktop-chromium"],
  }),
});
const DEFAULT_REQUIRED_PACKS = Object.freeze([
  "playwright:core-smoke",
  "playwright:surface-matrix",
  "playwright:wcag-i18n",
]);
const APPROVED_DURABLE_ARTIFACT_PREFIXES = Object.freeze([
  "s3://6529-artifacts/",
  "https://artifacts.6529.io/",
  "ipfs://",
]);
const VALID_RETENTION_POLICIES = new Set([
  "standard-30-days",
  "standard-90-days",
  "standard-1-year",
  "permanent",
]);
const RELEASE_READINESS_STATUSES = new Set([
  "deploy_verified",
  "validating",
  "promoting",
  "passed",
  "released",
]);
const SUCCESSFUL_RELEASE_STATUSES = new Set(["passed", "released"]);
const VALID_CHECK_STATUSES = new Set([
  "passed",
  "failed",
  "blocked",
  "timed_out",
  "timeout",
  "skipped",
  "not_run",
]);
const VALID_POST_DEPLOY_WATCH_STATUSES = new Set([
  "not_started",
  "in_progress",
  "passed",
  "failed",
  "blocked",
  "skipped",
]);
const VALID_POST_DEPLOY_WATCH_CHECKPOINT_STATUSES = new Set([
  "not_run",
  "in_progress",
  "passed",
  "failed",
  "blocked",
  "skipped",
]);
const VALID_CANARY_CAPABILITIES = new Set([
  "auto-hold-only",
  "feature-flag-only",
  "traffic-split",
  "not-applicable",
]);
const VALID_STATUSES = new Set([
  "collecting",
  "queued",
  "leased",
  "dispatching",
  "deploying",
  "deploy_verified",
  "validating",
  "passed",
  "failed",
  "held",
  "superseded",
  "stale",
  "promoting",
  "released",
  "rollback_required",
  "rolled_back",
  "fix_forward_required",
  "cancelled",
]);
const GITHUB_DEPLOYMENT_STATES = new Set([
  "error",
  "failure",
  "inactive",
  "in_progress",
  "queued",
  "pending",
  "success",
]);

function createPlaywrightPack({
  id,
  description,
  stagingCommand,
  productionCommand,
  surfaces = REQUIRED_WEB_SURFACES,
}) {
  const environments = [
    ...(stagingCommand ? ["staging"] : []),
    ...(productionCommand ? ["production"] : []),
  ];

  return Object.freeze({
    id,
    size: "large",
    description,
    environments,
    surfaces,
    commands: Object.freeze({
      staging: stagingCommand,
      production: productionCommand,
    }),
    artifacts: PLAYWRIGHT_ARTIFACT_PATTERNS,
  });
}

function readJson(file) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI reads manifest paths supplied by workflow arguments.
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  const target = path.resolve(file);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI writes manifest artifacts to supplied workflow paths.
  fs.mkdirSync(path.dirname(target), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI writes manifest artifacts to supplied workflow paths.
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function writeStdout(value) {
  process.stdout.write(`${value}\n`);
}

function parseBoolean(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }
  if (value === true || value === "true" || value === "1" || value === "yes") {
    return true;
  }
  if (value === false || value === "false" || value === "0" || value === "no") {
    return false;
  }
  throw new Error(`Invalid boolean value: ${value}`);
}

function parseInteger(value, fallback) {
  if (value === undefined || value === "") {
    return fallback;
  }
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid integer value: ${value}`);
  }
  return parsed;
}

function parseCsv(value) {
  if (!value) {
    return [];
  }
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonOption(value, fallback) {
  if (!value) {
    return fallback;
  }
  return JSON.parse(value);
}

function buildPackPlan(packId, environment) {
  const pack = VALIDATION_PACKS[packId];
  if (!pack) {
    return {
      id: packId,
      known: false,
      command: null,
      size: "unknown",
      surfaces: [],
      artifact_paths: [],
      description:
        "Custom validation pack. Record command, owner, artifacts, and result in validation.checks.",
    };
  }

  return {
    id: pack.id,
    known: true,
    command: pack.commands[environment] || null,
    size: pack.size,
    surfaces: [...pack.surfaces],
    artifact_paths: [...pack.artifacts],
    description: pack.description,
  };
}

function buildPackPlanList(requiredPacks, environment) {
  return requiredPacks.map((packId) => buildPackPlan(packId, environment));
}

function addMinutes(iso, minutes) {
  return new Date(new Date(iso).getTime() + minutes * 60 * 1000).toISOString();
}

function shortSha(sha) {
  return sha ? sha.slice(0, 12) : "unknown";
}

function timestampSlug(iso) {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function defaultRunUrl(env = process.env) {
  if (!env.GITHUB_SERVER_URL || !env.GITHUB_REPOSITORY || !env.GITHUB_RUN_ID) {
    return null;
  }
  return `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`;
}

function defaultEnvironmentUrl(environment) {
  if (environment === "production") {
    return "https://6529.io";
  }
  if (environment === "staging") {
    return "https://staging.6529.io";
  }
  return null;
}

function buildManifest(options, env = process.env) {
  const now = options.now || new Date().toISOString();
  const environment = options.environment;
  if (!VALID_ENVIRONMENTS.has(environment)) {
    throw new Error(
      `--environment must be one of: ${[...VALID_ENVIRONMENTS].join(", ")}`
    );
  }

  const stagingDeploySha = options.stagingDeploySha || null;
  const productionCandidateSha = options.productionCandidateSha || null;
  const productionEligibleDefault =
    environment === "production" || Boolean(productionCandidateSha);
  const productionEligible = parseBoolean(
    options.productionEligible,
    productionEligibleDefault
  );
  const expectedDurationMinutes = parseInteger(
    options.expectedDurationMinutes,
    environment === "production" ? 120 : 75
  );
  const complexity =
    options.complexity ||
    (expectedDurationMinutes > 120 ? "complex" : "standard");
  const heartbeatIntervalMinutes = parseInteger(
    options.heartbeatIntervalMinutes,
    expectedDurationMinutes > 120 ? 30 : 15
  );
  const staleAfterMinutes = parseInteger(
    options.staleAfterMinutes,
    Math.max(
      heartbeatIntervalMinutes * 3,
      expectedDurationMinutes > 120 ? 90 : 45
    )
  );
  const releaseCaptain =
    options.releaseCaptain || env.GITHUB_ACTOR || "unassigned";
  const baseSha =
    productionCandidateSha ||
    stagingDeploySha ||
    options.ref ||
    env.GITHUB_SHA ||
    null;
  const releaseId =
    options.releaseId ||
    `fe-${environment}-${timestampSlug(now)}-${shortSha(baseSha)}`;
  const workflowRunUrl = options.workflowRunUrl || defaultRunUrl(env);
  const environmentUrl =
    options.environmentUrl || defaultEnvironmentUrl(environment);
  const requiredPacks = parseCsv(
    options.requiredPacks || DEFAULT_REQUIRED_PACKS.join(",")
  );
  const packPlan = buildPackPlanList(requiredPacks, environment);
  const productionLikeEvidenceRequired =
    environment === "production" || productionEligible;
  const postDeployWatchRequired =
    environment === "production"
      ? true
      : parseBoolean(options.postDeployWatchRequired, false);
  const longRunning =
    complexity === "complex" || expectedDurationMinutes > 120
      ? {
          enabled: true,
          heartbeat_interval_minutes: heartbeatIntervalMinutes,
          progress_update_channels: parseCsv(
            options.progressUpdateChannels || "github-deployment-status,wave"
          ),
          escalation_after_minutes: parseInteger(
            options.escalationAfterMinutes,
            Math.max(staleAfterMinutes * 2, 180)
          ),
          checkpoint_labels: parseCsv(
            options.checkpointLabels ||
              "preflight,deploy-started,mid-deploy,validation-started,terminal"
          ),
        }
      : {
          enabled: false,
        };

  return {
    schema_version: SCHEMA_VERSION,
    release_id: releaseId,
    repository:
      options.repository ||
      env.GITHUB_REPOSITORY ||
      "6529-Collections/6529seize-frontend",
    environment,
    status: options.status || "queued",
    created_at: now,
    updated_at: now,
    release_captain: releaseCaptain,
    complexity,
    production_eligible: productionEligible,
    staging_branch:
      options.stagingBranch ||
      (environment === "staging" ? "1a-staging" : null),
    shas: {
      staging_deploy_sha: stagingDeploySha,
      production_candidate_sha: productionCandidateSha,
    },
    lane: {
      owner: releaseCaptain,
      acquired_at: now,
      heartbeat_at: now,
      heartbeat_interval_minutes: heartbeatIntervalMinutes,
      stale_after_minutes: staleAfterMinutes,
      expected_duration_minutes: expectedDurationMinutes,
      expected_completion_at: addMinutes(now, expectedDurationMinutes),
    },
    included_prs: parseJsonOption(options.includedPrs, []),
    backend_dependencies: parseJsonOption(options.backendDependencies, []),
    validation: {
      core_smoke_owner: options.coreSmokeOwner || releaseCaptain,
      required_packs: requiredPacks,
      pack_plan: packPlan,
      exploratory_checks: parseJsonOption(options.exploratoryChecks, []),
      checks: parseJsonOption(options.validationChecks, []),
      durable_artifacts: {
        required: productionLikeEvidenceRequired
          ? true
          : parseBoolean(options.durableArtifactsRequired, false),
        accepted_prefixes: [...APPROVED_DURABLE_ARTIFACT_PREFIXES],
        git_lfs_allowed: false,
        notes:
          "Retained deployment evidence belongs on 6529-controlled artifact storage. Git LFS and committed generated artifacts are not durable evidence stores.",
      },
      auto_hold_criteria: [
        {
          id: "required-pack-failed",
          hold_when:
            "Any required validation pack records status failed, blocked, or timed_out.",
          recovery:
            "Fix forward or rerun once with evidence; repeated failures hold production.",
        },
        {
          id: "required-pack-missing-terminal-evidence",
          hold_when:
            "A terminal passed/released manifest is missing a passed check for any required validation pack.",
          recovery:
            "Run the missing pack or record a release-captain exception before promotion.",
        },
        {
          id: "durable-artifact-pointer-missing",
          hold_when:
            "A production-eligible terminal manifest lacks approved durable artifact pointers.",
          recovery:
            "Upload redacted evidence to approved storage and record the URI, hash/CID/ETag, retention, and redaction status.",
        },
        {
          id: "required-pack-command-mismatch",
          hold_when:
            "A standard required validation pack's latest passing check does not record the expected pack-plan command.",
          recovery:
            "Rerun the standard command or record a release-captain exception outside the standard pack.",
        },
        {
          id: "required-pack-surface-evidence-missing",
          hold_when:
            "A standard required validation pack's latest passing check does not list all required pack-plan surfaces.",
          recovery:
            "Rerun the full pack or record all covered surfaces before promotion.",
        },
        {
          id: "candidate-sha-mismatch",
          hold_when:
            "Production candidate SHA differs from current origin/main or from the staging-validated release set.",
          recovery:
            "Rerun staging for the current candidate or remove superseded work from the train.",
        },
        {
          id: "post-deploy-watch-validation-checkpoint-missing",
          hold_when:
            "A production release manifest lacks a passed release-captain-validation checkpoint with evidence.",
          recovery:
            "Run production-safe validation, then record the release-captain-validation checkpoint with canonical evidence before release notes.",
        },
      ],
    },
    post_deploy_watch: {
      required: postDeployWatchRequired,
      status: options.postDeployWatchStatus || "not_started",
      min_duration_minutes: parseInteger(
        options.postDeployWatchMinDurationMinutes,
        environment === "production" ? 30 : 0
      ),
      observed_duration_minutes: parseInteger(
        options.postDeployWatchObservedDurationMinutes,
        0
      ),
      started_at: options.postDeployWatchStartedAt || null,
      completed_at: options.postDeployWatchCompletedAt || null,
      checkpoints: parseJsonOption(options.postDeployWatchCheckpoints, []),
      notes:
        options.postDeployWatchNotes ||
        "Post-deploy watch records health evidence before release notes. It is separate from traffic-split canary rollout.",
    },
    canary_readiness: {
      current_capability:
        options.canaryCapability ||
        (environment === "production" ? "auto-hold-only" : "not-applicable"),
      traffic_splitting_supported: parseBoolean(
        options.trafficSplittingSupported,
        false
      ),
      feature_flag_strategy:
        options.featureFlagStrategy ||
        "App-specific flags only; no deployment-bus traffic splitting.",
      candidate_control_metrics: parseCsv(
        options.candidateControlMetrics ||
          "version-match,core-route-smoke,api-health,static-asset-health,frontend-error-rate"
      ),
      prerequisites_for_traffic_split: parseCsv(
        options.canaryPrerequisites ||
          "traffic-router-support,automated-health-thresholds,rollback-automation,artifact-storage-ready"
      ),
      notes:
        options.canaryNotes ||
        "Current deployment bus supports auto-hold plus explicit watch. Traffic-split canary rollout is a future infrastructure capability.",
    },
    deployment: {
      github_deployment_id: options.githubDeploymentId || null,
      workflow_run_url: workflowRunUrl,
      environment_url: environmentUrl,
      ssm_command_id: options.ssmCommandId || null,
      elastic_beanstalk_version_label:
        options.elasticBeanstalkVersionLabel || null,
    },
    long_running: longRunning,
    plans: {
      rollback:
        options.rollbackPlan ||
        "Use the release captain decision log to choose rollback or fix-forward before production promotion.",
      fix_forward:
        options.fixForwardPlan ||
        "Fix through the normal PR path, merge to origin/main, redeploy staging, and rerun failed validation.",
    },
    human_gates: {
      production_approval_required: environment === "production",
      approvals: parseJsonOption(options.approvals, []),
      override_reason: options.overrideReason || null,
    },
    progress: [
      {
        at: now,
        phase: options.phase || "queued",
        message:
          options.message ||
          `${environment} deployment bus manifest created for ${shortSha(baseSha)}`,
      },
    ],
  };
}

function pushError(errors, pathName, message) {
  errors.push(`${pathName}: ${message}`);
}

function validateSha(errors, pathName, value, required) {
  if (!value) {
    if (required) {
      pushError(errors, pathName, "required");
    }
    return;
  }
  if (!SHA_RE.test(value)) {
    pushError(errors, pathName, "must be a 40-character git SHA");
  }
}

function validateIso(errors, pathName, value) {
  if (!value || Number.isNaN(Date.parse(value))) {
    pushError(errors, pathName, "must be an ISO timestamp");
  }
}

function validateManifest(manifest) {
  const errors = [];
  const warnings = [];

  if (manifest.schema_version !== SCHEMA_VERSION) {
    pushError(errors, "schema_version", `must be ${SCHEMA_VERSION}`);
  }
  if (!manifest.release_id) {
    pushError(errors, "release_id", "required");
  }
  if (!VALID_ENVIRONMENTS.has(manifest.environment)) {
    pushError(errors, "environment", "must be staging or production");
  }
  if (!VALID_STATUSES.has(manifest.status)) {
    pushError(
      errors,
      "status",
      `must be one of ${[...VALID_STATUSES].join(", ")}`
    );
  }
  if (!manifest.release_captain) {
    pushError(errors, "release_captain", "required");
  }
  validateIso(errors, "created_at", manifest.created_at);
  validateIso(errors, "updated_at", manifest.updated_at);

  const shas = manifest.shas || {};
  validateSha(
    errors,
    "shas.staging_deploy_sha",
    shas.staging_deploy_sha,
    manifest.environment === "staging"
  );
  validateSha(
    errors,
    "shas.production_candidate_sha",
    shas.production_candidate_sha,
    manifest.environment === "production" || manifest.production_eligible
  );

  if (
    manifest.environment === "production" &&
    manifest.production_eligible !== true
  ) {
    pushError(
      errors,
      "production_eligible",
      "production manifests must be eligible"
    );
  }

  const lane = manifest.lane || {};
  if (!lane.owner) {
    pushError(errors, "lane.owner", "required");
  }
  validateIso(errors, "lane.acquired_at", lane.acquired_at);
  validateIso(errors, "lane.heartbeat_at", lane.heartbeat_at);
  if (
    !Number.isInteger(lane.heartbeat_interval_minutes) ||
    lane.heartbeat_interval_minutes <= 0
  ) {
    pushError(
      errors,
      "lane.heartbeat_interval_minutes",
      "must be a positive integer"
    );
  }
  if (
    !Number.isInteger(lane.stale_after_minutes) ||
    lane.stale_after_minutes <= 0
  ) {
    pushError(errors, "lane.stale_after_minutes", "must be a positive integer");
  }
  if (
    !Number.isInteger(lane.expected_duration_minutes) ||
    lane.expected_duration_minutes <= 0
  ) {
    pushError(
      errors,
      "lane.expected_duration_minutes",
      "must be a positive integer"
    );
  }
  validateIso(
    errors,
    "lane.expected_completion_at",
    lane.expected_completion_at
  );

  if (
    Number.isInteger(lane.heartbeat_interval_minutes) &&
    Number.isInteger(lane.stale_after_minutes) &&
    lane.heartbeat_interval_minutes * 2 > lane.stale_after_minutes
  ) {
    pushError(
      errors,
      "lane.heartbeat_interval_minutes",
      "must be at most half of lane.stale_after_minutes"
    );
  }

  const longRunningRequired =
    manifest.complexity === "complex" || lane.expected_duration_minutes > 120;
  const longRunning = manifest.long_running || {};
  if (longRunningRequired) {
    if (longRunning.enabled !== true) {
      pushError(
        errors,
        "long_running.enabled",
        "required for complex or multi-hour deploys"
      );
    }
    if (
      !Array.isArray(longRunning.progress_update_channels) ||
      longRunning.progress_update_channels.length === 0
    ) {
      pushError(
        errors,
        "long_running.progress_update_channels",
        "must name at least one channel"
      );
    }
    if (
      !Number.isInteger(longRunning.escalation_after_minutes) ||
      longRunning.escalation_after_minutes <= lane.stale_after_minutes
    ) {
      pushError(
        errors,
        "long_running.escalation_after_minutes",
        "must exceed stale_after_minutes"
      );
    }
    if (
      !Array.isArray(longRunning.checkpoint_labels) ||
      longRunning.checkpoint_labels.length < 3
    ) {
      pushError(
        errors,
        "long_running.checkpoint_labels",
        "must include at least three checkpoints"
      );
    }
    if (!manifest.plans || !manifest.plans.rollback) {
      pushError(
        errors,
        "plans.rollback",
        "required for complex or multi-hour deploys"
      );
    }
    if (!manifest.plans || !manifest.plans.fix_forward) {
      pushError(
        errors,
        "plans.fix_forward",
        "required for complex or multi-hour deploys"
      );
    }
  }

  if (!Array.isArray(manifest.included_prs)) {
    pushError(errors, "included_prs", "must be an array");
  }
  if (!Array.isArray(manifest.backend_dependencies)) {
    pushError(errors, "backend_dependencies", "must be an array");
  }
  if (!manifest.validation || !manifest.validation.core_smoke_owner) {
    pushError(errors, "validation.core_smoke_owner", "required");
  }
  validateValidationPlan(manifest, errors, warnings);
  validatePostDeployWatch(manifest, errors);
  validateCanaryReadiness(manifest, errors);
  if (!Array.isArray(manifest.progress) || manifest.progress.length === 0) {
    pushError(errors, "progress", "must include at least one event");
  }

  if (
    manifest.environment === "staging" &&
    manifest.production_eligible !== true
  ) {
    warnings.push(
      "staging manifest is exploratory only; it does not satisfy the production same-SHA gate"
    );
  }

  return { ok: errors.length === 0, errors, warnings };
}

function validatePostDeployWatch(manifest, errors) {
  const postDeployWatch = manifest.post_deploy_watch;
  if (!postDeployWatch) {
    if (manifest.environment === "production") {
      pushError(
        errors,
        "post_deploy_watch",
        "required for production manifests"
      );
    }
    return;
  }

  if (typeof postDeployWatch.required !== "boolean") {
    pushError(errors, "post_deploy_watch.required", "must be boolean");
  }
  if (
    manifest.environment === "production" &&
    postDeployWatch.required !== true
  ) {
    pushError(
      errors,
      "post_deploy_watch.required",
      "must be true for production manifests"
    );
  }
  if (!VALID_POST_DEPLOY_WATCH_STATUSES.has(postDeployWatch.status)) {
    pushError(
      errors,
      "post_deploy_watch.status",
      `must be one of ${[...VALID_POST_DEPLOY_WATCH_STATUSES].join(", ")}`
    );
  }
  if (
    !Number.isInteger(postDeployWatch.min_duration_minutes) ||
    postDeployWatch.min_duration_minutes < 0
  ) {
    pushError(
      errors,
      "post_deploy_watch.min_duration_minutes",
      "must be a non-negative integer"
    );
  }
  if (
    !Number.isInteger(postDeployWatch.observed_duration_minutes) ||
    postDeployWatch.observed_duration_minutes < 0
  ) {
    pushError(
      errors,
      "post_deploy_watch.observed_duration_minutes",
      "must be a non-negative integer"
    );
  }
  validateOptionalIso(
    errors,
    "post_deploy_watch.started_at",
    postDeployWatch.started_at
  );
  validateOptionalIso(
    errors,
    "post_deploy_watch.completed_at",
    postDeployWatch.completed_at
  );
  validateWatchCheckpoints(postDeployWatch.checkpoints, errors);
}

function validateOptionalIso(errors, pathName, value) {
  if (value === null || value === undefined || value === "") {
    return;
  }
  validateIso(errors, pathName, value);
}

function validateWatchCheckpoints(checkpoints, errors) {
  if (!Array.isArray(checkpoints)) {
    pushError(errors, "post_deploy_watch.checkpoints", "must be an array");
    return;
  }

  checkpoints.forEach((checkpoint, index) => {
    const pathName = `post_deploy_watch.checkpoints[${index}]`;
    if (!checkpoint?.id) {
      pushError(errors, `${pathName}.id`, "required");
    }
    if (!VALID_POST_DEPLOY_WATCH_CHECKPOINT_STATUSES.has(checkpoint?.status)) {
      pushError(
        errors,
        `${pathName}.status`,
        `must be one of ${[...VALID_POST_DEPLOY_WATCH_CHECKPOINT_STATUSES].join(", ")}`
      );
    }
    validateOptionalIso(
      errors,
      `${pathName}.recorded_at`,
      checkpoint?.recorded_at
    );
    if (
      checkpoint?.evidence !== undefined &&
      !Array.isArray(checkpoint.evidence)
    ) {
      pushError(errors, `${pathName}.evidence`, "must be an array");
    } else if (Array.isArray(checkpoint?.evidence)) {
      checkpoint.evidence.forEach((uri, evidenceIndex) => {
        if (typeof uri !== "string") {
          pushError(
            errors,
            `${pathName}.evidence[${evidenceIndex}]`,
            "must be a string"
          );
          return;
        }
        if (uri.includes("?") || uri.includes("#")) {
          pushError(
            errors,
            `${pathName}.evidence[${evidenceIndex}]`,
            "evidence URI must not include query strings or fragments"
          );
        }
      });
    }
  });
}

function validateCanaryReadiness(manifest, errors) {
  const canaryReadiness = manifest.canary_readiness;
  if (!canaryReadiness) {
    return;
  }

  if (!VALID_CANARY_CAPABILITIES.has(canaryReadiness.current_capability)) {
    pushError(
      errors,
      "canary_readiness.current_capability",
      `must be one of ${[...VALID_CANARY_CAPABILITIES].join(", ")}`
    );
  }
  if (typeof canaryReadiness.traffic_splitting_supported !== "boolean") {
    pushError(
      errors,
      "canary_readiness.traffic_splitting_supported",
      "must be boolean"
    );
  }
  if (
    canaryReadiness.current_capability === "traffic-split" &&
    canaryReadiness.traffic_splitting_supported !== true
  ) {
    pushError(
      errors,
      "canary_readiness.traffic_splitting_supported",
      "must be true when current_capability is traffic-split"
    );
  }
  if (!Array.isArray(canaryReadiness.candidate_control_metrics)) {
    pushError(
      errors,
      "canary_readiness.candidate_control_metrics",
      "must be an array"
    );
  }
  if (!Array.isArray(canaryReadiness.prerequisites_for_traffic_split)) {
    pushError(
      errors,
      "canary_readiness.prerequisites_for_traffic_split",
      "must be an array"
    );
  }
}

function validateValidationPlan(manifest, errors, warnings) {
  const validation = manifest.validation || {};
  const requiredPacks = validateRequiredPacks(
    manifest,
    validation,
    errors,
    warnings
  );
  if (!requiredPacks) {
    return;
  }

  validatePackPlan(validation, errors);
  validateDurableArtifactsConfig(
    validation.durable_artifacts,
    manifest,
    errors
  );

  const checksOk = validateValidationChecks(validation, errors, warnings);
  if (!checksOk) {
    return;
  }

  addReadinessFindings(manifest, errors, warnings);
}

function validateRequiredPacks(manifest, validation, errors, warnings) {
  const requiredPacks = validation.required_packs;
  if (!Array.isArray(requiredPacks) || requiredPacks.length === 0) {
    pushError(
      errors,
      "validation.required_packs",
      "must include at least one pack"
    );
    return null;
  }

  for (const packId of requiredPacks) {
    const pack = VALIDATION_PACKS[packId];
    if (!pack) {
      warnings.push(
        `validation.required_packs: ${packId} is not a standard frontend pack; record command and artifacts in validation.checks`
      );
    } else if (!pack.commands[manifest.environment]) {
      pushError(
        errors,
        "validation.required_packs",
        `${packId} has no standard command for ${manifest.environment}`
      );
    }
  }

  return requiredPacks;
}

function validatePackPlan(validation, errors) {
  if (
    validation.pack_plan !== undefined &&
    !Array.isArray(validation.pack_plan)
  ) {
    pushError(errors, "validation.pack_plan", "must be an array when present");
  }
}

function validateDurableArtifactsConfig(durableArtifacts, manifest, errors) {
  const durableEvidenceRequired =
    manifest.environment === "production" ||
    manifest.production_eligible === true;
  if (durableEvidenceRequired && durableArtifacts?.required !== true) {
    pushError(
      errors,
      "validation.durable_artifacts.required",
      "must be true for production or production-eligible manifests"
    );
  }

  if (durableArtifacts !== undefined) {
    if (typeof durableArtifacts.required !== "boolean") {
      pushError(
        errors,
        "validation.durable_artifacts.required",
        "must be boolean"
      );
    }
    if (Array.isArray(durableArtifacts.accepted_prefixes)) {
      validateAcceptedArtifactPrefixes(
        durableArtifacts.accepted_prefixes,
        errors
      );
    } else {
      pushError(
        errors,
        "validation.durable_artifacts.accepted_prefixes",
        "must be an array"
      );
    }
    if (durableArtifacts.git_lfs_allowed !== false) {
      pushError(
        errors,
        "validation.durable_artifacts.git_lfs_allowed",
        "must be false"
      );
    }
  }
}

function validateAcceptedArtifactPrefixes(acceptedPrefixes, errors) {
  acceptedPrefixes.forEach((prefix, index) => {
    if (!isApprovedDurableArtifactPrefix(prefix)) {
      pushError(
        errors,
        `validation.durable_artifacts.accepted_prefixes[${index}]`,
        "must be one of the approved durable artifact prefixes"
      );
    }
  });
}

function isApprovedDurableArtifactPrefix(prefix) {
  return (
    typeof prefix === "string" &&
    APPROVED_DURABLE_ARTIFACT_PREFIXES.includes(prefix)
  );
}

function validationAcceptedArtifactPrefixes(validation) {
  const acceptedPrefixes = validation.durable_artifacts?.accepted_prefixes;
  let approvedPrefixes = [...APPROVED_DURABLE_ARTIFACT_PREFIXES];

  if (Array.isArray(acceptedPrefixes)) {
    const manifestPrefixes = acceptedPrefixes.filter(
      isApprovedDurableArtifactPrefix
    );
    if (manifestPrefixes.length > 0) {
      approvedPrefixes = manifestPrefixes;
    }
  }

  return approvedPrefixes;
}

function validateValidationChecks(validation, errors, warnings) {
  const checks = validation.checks;
  if (!Array.isArray(checks)) {
    pushError(errors, "validation.checks", "must be an array");
    return false;
  }

  const acceptedPrefixes = validationAcceptedArtifactPrefixes(validation);
  checks.forEach((check, checkIndex) => {
    validateCheckArtifacts(
      check,
      checkIndex,
      acceptedPrefixes,
      errors,
      warnings
    );
  });

  return true;
}

function validateCheckArtifacts(
  check,
  checkIndex,
  acceptedPrefixes,
  errors,
  warnings
) {
  const checkStatus = normalizeCheckStatus(check.status);
  checkArtifacts(check).forEach((artifact, artifactIndex) => {
    const path = `validation.checks[${checkIndex}].artifacts[${artifactIndex}]`;
    const rejectionReason = artifactRejectionReason(
      artifactUri(artifact),
      acceptedPrefixes
    );

    if (rejectionReason) {
      pushError(errors, `${path}.uri`, rejectionReason);
      return;
    }

    addArtifactMetadataWarnings(path, artifact, checkStatus, warnings);
  });
}

function addArtifactMetadataWarnings(path, artifact, checkStatus, warnings) {
  if (typeof artifact === "string" || checkStatus !== "passed") {
    return;
  }

  if (artifact.redaction_status !== "verified-redacted") {
    warnings.push(
      `${path}.redaction_status: passed checks need verified-redacted durable evidence before release readiness`
    );
  }
  if (!artifactHasIntegrityMetadata(artifact)) {
    warnings.push(
      `${path}: passed checks need sha256, etag, or cid metadata before release readiness`
    );
  }
  if (!artifactHasRetentionMetadata(artifact)) {
    warnings.push(
      `${path}: passed checks need retention metadata before release readiness`
    );
  }
}

function addReadinessFindings(manifest, errors, warnings) {
  if (!RELEASE_READINESS_STATUSES.has(manifest.status)) {
    return;
  }

  const readiness = evaluateReleaseReadiness(manifest);
  if (SUCCESSFUL_RELEASE_STATUSES.has(manifest.status)) {
    for (const hold of readiness.holds) {
      pushError(errors, `release_readiness.${hold.id}`, hold.message);
    }
  } else {
    for (const hold of readiness.holds) {
      warnings.push(`release_readiness.${hold.id}: ${hold.message}`);
    }
  }
}

function normalizeCheckStatus(status) {
  return String(status || "not-run").toLowerCase();
}

function checkPackId(check) {
  return check.pack || check.pack_id || check.id || check.name || null;
}

function checkArtifacts(check) {
  const artifacts = check.artifacts || check.artifact_pointers || [];
  return Array.isArray(artifacts) ? artifacts : [];
}

function parseArtifactPointers(value, options = {}) {
  return parseCsv(value).map((uri) => ({
    uri,
    redaction_status: options.redactionStatus || "not-recorded",
    ...(options.sha256 ? { sha256: options.sha256 } : {}),
    ...(options.etag ? { etag: options.etag } : {}),
    ...(options.cid ? { cid: options.cid } : {}),
    ...(options.retentionDays
      ? { retention_days: parseInteger(options.retentionDays) }
      : {}),
    ...(options.retentionUntil
      ? { retention_until: options.retentionUntil }
      : {}),
    ...(options.retentionPolicy
      ? { retention_policy: options.retentionPolicy }
      : {}),
  }));
}

function artifactUri(artifact) {
  if (typeof artifact === "string") {
    return artifact;
  }
  return artifact?.uri || artifact?.url || artifact?.href || "";
}

function formatArtifactUriForReport(uri) {
  const text = String(uri || "");
  const queryIndex = text.search(/[?#]/);
  if (queryIndex === -1) {
    return text;
  }
  return `${text.slice(0, queryIndex)} [query-or-fragment redacted]`;
}

function artifactRejectionReason(uri, acceptedPrefixes) {
  const text = String(uri || "");
  if (!text) {
    return "missing uri";
  }
  if (text.startsWith("git-lfs:")) {
    return "Git LFS pointers are not durable release evidence";
  }
  if (
    /^[a-z]:\\/i.test(text) ||
    text.startsWith("\\\\") ||
    text.startsWith("file:")
  ) {
    return "local filesystem paths are not durable release evidence";
  }
  if (text.includes("?") || text.includes("#")) {
    return "artifact URI must not include query strings or fragments";
  }
  if (!acceptedPrefixes.some((prefix) => text.startsWith(prefix))) {
    return "artifact URI does not use an approved durable artifact prefix";
  }
  return null;
}

function artifactHasIntegrityMetadata(artifact) {
  return Boolean(
    isValidSha256(artifact?.sha256) ||
    isValidEtag(artifact?.etag) ||
    isValidCid(artifact?.cid)
  );
}

function artifactHasRetentionMetadata(artifact) {
  return Boolean(
    isPositiveIntegerValue(artifact?.retention_days) ||
    isValidDateValue(artifact?.retention_until) ||
    isValidRetentionPolicy(artifact?.retention_policy)
  );
}

function isValidSha256(value) {
  return typeof value === "string" && SHA256_RE.test(value.trim());
}

function isValidEtag(value) {
  return typeof value === "string" && ETAG_RE.test(value.trim());
}

function isValidCid(value) {
  return typeof value === "string" && CID_RE.test(value.trim());
}

function isPositiveIntegerValue(value) {
  if (Number.isInteger(value)) {
    return value > 0;
  }
  return typeof value === "string" && /^[1-9]\d*$/.test(value.trim());
}

function isValidDateValue(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }
  return !Number.isNaN(Date.parse(value));
}

function isValidRetentionPolicy(value) {
  return (
    typeof value === "string" && VALID_RETENTION_POLICIES.has(value.trim())
  );
}

function artifactIsReleaseReady(artifact, acceptedPrefixes) {
  if (typeof artifact === "string") {
    return false;
  }
  const uri = artifactUri(artifact);
  return (
    artifactRejectionReason(uri, acceptedPrefixes) === null &&
    artifact.redaction_status === "verified-redacted" &&
    artifactHasIntegrityMetadata(artifact) &&
    artifactHasRetentionMetadata(artifact)
  );
}

function approvedDurableArtifactsForCheck(manifest, check) {
  const acceptedPrefixes = validationAcceptedArtifactPrefixes(
    manifest.validation || {}
  );

  return checkArtifacts(check).filter((artifact) =>
    artifactIsReleaseReady(artifact, acceptedPrefixes)
  );
}

function checkTimestampMs(check) {
  const value = check?.recorded_at || check?.completed_at || check?.at;
  const ms = Date.parse(value || "");
  return Number.isNaN(ms) ? null : ms;
}

function isNewerValidationCheck(
  candidate,
  candidateIndex,
  latest,
  latestIndex
) {
  const candidateMs = checkTimestampMs(candidate);
  const latestMs = checkTimestampMs(latest);

  if (candidateMs !== null && latestMs !== null) {
    return (
      candidateMs > latestMs ||
      (candidateMs === latestMs && candidateIndex > latestIndex)
    );
  }
  if (candidateMs !== null) {
    return true;
  }
  if (latestMs !== null) {
    return false;
  }
  return candidateIndex > latestIndex;
}

function latestCheckForPack(checks, packId) {
  let latest = null;
  let latestIndex = -1;

  checks.forEach((check, index) => {
    if (checkPackId(check) !== packId) {
      return;
    }
    if (!latest || isNewerValidationCheck(check, index, latest, latestIndex)) {
      latest = check;
      latestIndex = index;
    }
  });

  return latest;
}

function expectedCommandForStandardPack(manifest, packId) {
  const pack = VALIDATION_PACKS[packId];
  if (!pack) {
    return null;
  }
  return pack.commands[manifest.environment] || null;
}

function missingStandardPackSurfaces(packId, check) {
  const expectedSurfaces = VALIDATION_PACKS[packId]?.surfaces;
  if (!expectedSurfaces || expectedSurfaces.length === 0) {
    return [];
  }

  const recordedSurfaces = Array.isArray(check?.surfaces)
    ? new Set(check.surfaces)
    : new Set();

  return [...expectedSurfaces].filter(
    (surface) => !recordedSurfaces.has(surface)
  );
}

function evaluateReleaseReadiness(manifest) {
  const holds = [];
  const warnings = [];
  const validation = manifest.validation || {};
  const checks = Array.isArray(validation.checks) ? validation.checks : [];
  const requiredPacks = Array.isArray(validation.required_packs)
    ? validation.required_packs
    : [];

  for (const packId of requiredPacks) {
    const latestCheck = latestCheckForPack(checks, packId);
    const latestStatus = normalizeCheckStatus(latestCheck?.status);

    if (["failed", "blocked", "timed_out", "timeout"].includes(latestStatus)) {
      holds.push({
        id: "required-pack-failed",
        pack: packId,
        message: `${packId} recorded ${latestStatus}`,
      });
    } else if (latestStatus !== "passed") {
      holds.push({
        id: "required-pack-missing-terminal-evidence",
        pack: packId,
        message: `${packId} has no passed validation check recorded`,
      });
    } else if (
      expectedCommandForStandardPack(manifest, packId) &&
      latestCheck?.command !== expectedCommandForStandardPack(manifest, packId)
    ) {
      holds.push({
        id: "required-pack-command-mismatch",
        pack: packId,
        message: `${packId} latest passing check did not record the expected command`,
      });
    } else if (missingStandardPackSurfaces(packId, latestCheck).length > 0) {
      holds.push({
        id: "required-pack-surface-evidence-missing",
        pack: packId,
        message: `${packId} latest passing check is missing required surfaces: ${missingStandardPackSurfaces(
          packId,
          latestCheck
        ).join(", ")}`,
      });
    } else if (
      validation.durable_artifacts?.required === true &&
      approvedDurableArtifactsForCheck(manifest, latestCheck).length === 0
    ) {
      holds.push({
        id: "durable-artifact-pointer-missing",
        pack: packId,
        message: `${packId} has no approved durable artifact pointer with verified redaction, integrity metadata, and retention metadata`,
      });
    }
  }

  evaluatePostDeployWatchReadiness(manifest, holds);

  if (manifest.production_eligible !== true) {
    warnings.push("Manifest is not production eligible.");
  }

  return { ok: holds.length === 0, holds, warnings };
}

function evaluatePostDeployWatchReadiness(manifest, holds) {
  if (manifest.environment !== "production") {
    return;
  }

  const postDeployWatch = manifest.post_deploy_watch;
  if (!postDeployWatch || postDeployWatch.required !== true) {
    holds.push({
      id: "post-deploy-watch-required",
      message: "production release requires a post-deploy watch contract",
    });
    return;
  }

  if (["failed", "blocked"].includes(postDeployWatch.status)) {
    holds.push({
      id: "post-deploy-watch-failed",
      message: `post-deploy watch recorded ${postDeployWatch.status}`,
    });
    return;
  }

  if (postDeployWatch.status !== "passed") {
    holds.push({
      id: "post-deploy-watch-missing",
      message: "post-deploy watch has not recorded a passed status",
    });
    return;
  }

  if (
    postDeployWatch.observed_duration_minutes <
    postDeployWatch.min_duration_minutes
  ) {
    holds.push({
      id: "post-deploy-watch-too-short",
      message: `post-deploy watch observed ${postDeployWatch.observed_duration_minutes}m, below required ${postDeployWatch.min_duration_minutes}m`,
    });
  }

  const failedCheckpoint = postDeployWatch.checkpoints?.find((checkpoint) =>
    ["failed", "blocked"].includes(checkpoint.status)
  );
  if (failedCheckpoint) {
    holds.push({
      id: "post-deploy-watch-checkpoint-failed",
      message: `${failedCheckpoint.id} recorded ${failedCheckpoint.status}`,
    });
  }

  const releaseCaptainCheckpoint = postDeployWatch.checkpoints?.find(
    (checkpoint) => checkpoint.id === "release-captain-validation"
  );
  if (
    releaseCaptainCheckpoint?.status !== "passed" ||
    !hasCheckpointEvidence(releaseCaptainCheckpoint)
  ) {
    holds.push({
      id: "post-deploy-watch-validation-checkpoint-missing",
      message:
        "post-deploy watch requires a passed release-captain-validation checkpoint with evidence",
    });
  }
}

function hasCheckpointEvidence(checkpoint) {
  return (
    Array.isArray(checkpoint?.evidence) &&
    checkpoint.evidence.some((uri) => typeof uri === "string" && uri.trim())
  );
}

function recordValidationCheck(manifest, options) {
  const pack = options.pack || options.packId;
  if (!pack) {
    throw new Error("record-validation-check requires --pack");
  }

  const status = normalizeCheckStatus(options.status || "passed");
  if (!VALID_CHECK_STATUSES.has(status)) {
    throw new Error(`Invalid validation check status: ${options.status}`);
  }

  const now = options.now || new Date().toISOString();
  const validation = manifest.validation || {};
  const packPlan = buildPackPlan(pack, manifest.environment);
  const artifacts = parseArtifactPointers(
    options.artifactUri || options.artifactUris,
    {
      redactionStatus: options.redactionStatus,
      sha256: options.artifactSha256,
      etag: options.artifactEtag,
      cid: options.artifactCid,
      retentionDays: options.retentionDays,
      retentionUntil: options.retentionUntil,
      retentionPolicy: options.retentionPolicy,
    }
  );
  const check = {
    pack,
    status,
    command: options.command || packPlan.command,
    surfaces: parseCsv(
      options.surfaces ||
        options.surface ||
        (Array.isArray(packPlan.surfaces) ? packPlan.surfaces.join(",") : "")
    ),
    owner:
      options.owner ||
      validation.core_smoke_owner ||
      manifest.release_captain ||
      "unassigned",
    recorded_at: now,
    source: options.source || "deployment-bus",
    artifacts,
  };

  if (options.runUrl) {
    check.run_url = options.runUrl;
  }
  if (options.notes) {
    check.notes = options.notes;
  }

  return {
    ...manifest,
    lane: {
      ...manifest.lane,
      heartbeat_at: now,
    },
    validation: {
      ...validation,
      checks: [
        ...(Array.isArray(validation.checks) ? validation.checks : []),
        check,
      ],
    },
    progress: [
      ...(Array.isArray(manifest.progress) ? manifest.progress : []),
      {
        at: now,
        phase: "validation",
        status: manifest.status,
        message: `${pack} validation recorded as ${status}`,
      },
    ],
  };
}

function summarizeManifest(manifest) {
  const deploymentId = manifest.deployment?.github_deployment_id || "none";
  const productionSha = manifest.shas?.production_candidate_sha || "none";
  const stagingSha = manifest.shas?.staging_deploy_sha || "none";
  const owner =
    manifest.lane?.owner || manifest.release_captain || "unassigned";

  return [
    `${manifest.release_id} (${manifest.environment})`,
    `status: ${manifest.status}`,
    `captain: ${owner}`,
    `staging_deploy_sha: ${stagingSha}`,
    `production_candidate_sha: ${productionSha}`,
    `production_eligible: ${manifest.production_eligible === true}`,
    `expected_duration_minutes: ${manifest.lane?.expected_duration_minutes ?? "unknown"}`,
    `heartbeat: every ${manifest.lane?.heartbeat_interval_minutes ?? "?"}m, stale after ${manifest.lane?.stale_after_minutes ?? "?"}m`,
    `github_deployment_id: ${deploymentId}`,
  ].join("\n");
}

function formatMarkdownList(values) {
  if (!values || values.length === 0) {
    return "- none";
  }
  return values.map((value) => `- ${value}`).join("\n");
}

function formatPackPlan(manifest) {
  const packPlan = manifest.validation?.pack_plan || [];
  if (!Array.isArray(packPlan) || packPlan.length === 0) {
    return "- no pack plan recorded";
  }

  return packPlan
    .map((pack) => {
      const command = pack.command || "record command in validation.checks";
      const surfaces =
        Array.isArray(pack.surfaces) && pack.surfaces.length > 0
          ? pack.surfaces.join(", ")
          : "unspecified";
      return `- ${pack.id}: ${pack.description || "validation pack"}\n  - command: \`${command}\`\n  - surfaces: ${surfaces}`;
    })
    .join("\n");
}

function formatRecordedChecks(manifest) {
  const checks = manifest.validation?.checks || [];
  if (!Array.isArray(checks) || checks.length === 0) {
    return "- no validation checks recorded yet";
  }

  return checks
    .map((check) => {
      const pack = checkPackId(check) || "unmapped";
      const status = normalizeCheckStatus(check.status);
      const command = check.command
        ? `\n  - command: \`${check.command}\``
        : "";
      const surfaces =
        Array.isArray(check.surfaces) && check.surfaces.length > 0
          ? `\n  - surfaces: ${check.surfaces.join(", ")}`
          : "";
      const artifacts = checkArtifacts(check)
        .map((artifact) => {
          const uri = formatArtifactUriForReport(artifactUri(artifact));
          if (typeof artifact === "string") {
            return uri;
          }
          const metadata = [
            artifact.redaction_status
              ? `redaction: ${artifact.redaction_status}`
              : null,
            artifact.sha256 ? "sha256 recorded" : null,
            artifact.etag ? "etag recorded" : null,
            artifact.cid ? "cid recorded" : null,
            artifact.retention_days
              ? `retention: ${artifact.retention_days} days`
              : null,
            artifact.retention_until
              ? `retention until: ${artifact.retention_until}`
              : null,
            artifact.retention_policy
              ? `retention policy: ${artifact.retention_policy}`
              : null,
          ].filter(Boolean);
          return metadata.length > 0 ? `${uri} (${metadata.join(", ")})` : uri;
        })
        .filter(Boolean);
      const artifactList = artifacts.map((uri) => `    - ${uri}`).join("\n");
      const artifactLines =
        artifacts.length > 0 ? `\n  - artifacts:\n${artifactList}` : "";
      return `- ${pack}: ${status}${command}${surfaces}${artifactLines}`;
    })
    .join("\n");
}

function createReleaseReport(manifest, options = {}) {
  const manifestValidation = validateManifest(manifest);
  const readiness = evaluateReleaseReadiness(manifest);
  const status = readiness.ok && manifestValidation.ok ? "ready" : "hold";
  const generatedAt = options.now || new Date().toISOString();
  const holds = [
    ...manifestValidation.errors.map(
      (error) => `manifest-validation: ${error}`
    ),
    ...readiness.holds.map((hold) => `${hold.id}: ${hold.message}`),
  ];
  const warnings = [
    ...(manifestValidation.warnings || []),
    ...readiness.warnings,
  ];
  const environmentUrl = manifest.deployment?.environment_url || "not recorded";

  return [
    `# ${manifest.environment} Release Report`,
    "",
    `Generated: ${generatedAt}`,
    `Release ID: ${manifest.release_id}`,
    `Report status: ${status}`,
    `Manifest status: ${manifest.status}`,
    `Environment URL: ${environmentUrl}`,
    "",
    "## Candidate",
    "",
    `- repository: ${manifest.repository}`,
    `- release captain: ${manifest.release_captain}`,
    `- staging deploy SHA: ${manifest.shas?.staging_deploy_sha || "none"}`,
    `- production candidate SHA: ${manifest.shas?.production_candidate_sha || "none"}`,
    `- production eligible: ${manifest.production_eligible === true}`,
    "",
    "## Required Packs",
    "",
    formatPackPlan(manifest),
    "",
    "## Recorded Validation",
    "",
    formatRecordedChecks(manifest),
    "",
    "## Auto-Hold Evaluation",
    "",
    holds.length === 0
      ? "- no auto-hold criteria triggered"
      : [...new Set(holds)].map((hold) => `- ${hold}`).join("\n"),
    "",
    "## Warnings",
    "",
    formatMarkdownList([...new Set(warnings)]),
    "",
    "## Post-Deploy Watch",
    "",
    formatPostDeployWatch(manifest),
    "",
    "## Canary Readiness",
    "",
    formatCanaryReadiness(manifest),
    "",
    "## Included PRs",
    "",
    formatMarkdownList(
      (manifest.included_prs || []).map(
        (pr) => `#${pr.number} ${pr.title || ""} (${pr.merge_sha || "no sha"})`
      )
    ),
    "",
    "## Artifact Policy",
    "",
    `- durable artifacts required: ${manifest.validation?.durable_artifacts?.required === true}`,
    `- accepted prefixes: ${(manifest.validation?.durable_artifacts?.accepted_prefixes || APPROVED_DURABLE_ARTIFACT_PREFIXES).join(", ")}`,
    "- Git LFS allowed: false",
    "",
  ].join("\n");
}

function formatPostDeployWatch(manifest) {
  const watch = manifest.post_deploy_watch;
  if (!watch) {
    return "- no post-deploy watch contract recorded";
  }

  const checkpointLines =
    Array.isArray(watch.checkpoints) && watch.checkpoints.length > 0
      ? watch.checkpoints
          .map((checkpoint) => {
            const evidence =
              Array.isArray(checkpoint.evidence) &&
              checkpoint.evidence.length > 0
                ? `; evidence: ${checkpoint.evidence
                    .map(formatArtifactUriForReport)
                    .join(", ")}`
                : "";
            const notes = checkpoint.notes
              ? `; notes: ${checkpoint.notes}`
              : "";
            return `  - ${checkpoint.id}: ${checkpoint.status}${evidence}${notes}`;
          })
          .join("\n")
      : "  - no checkpoints recorded";

  return [
    `- required: ${watch.required === true}`,
    `- status: ${watch.status}`,
    `- duration: ${watch.observed_duration_minutes || 0}/${watch.min_duration_minutes || 0} minutes`,
    "- checkpoints:",
    checkpointLines,
  ].join("\n");
}

function formatCanaryReadiness(manifest) {
  const canary = manifest.canary_readiness;
  if (!canary) {
    return "- no canary readiness contract recorded";
  }

  return [
    `- current capability: ${canary.current_capability}`,
    `- traffic splitting supported: ${canary.traffic_splitting_supported === true}`,
    `- feature flag strategy: ${canary.feature_flag_strategy || "not recorded"}`,
    `- candidate/control metrics: ${(canary.candidate_control_metrics || []).join(", ") || "none"}`,
    `- traffic-split prerequisites: ${(canary.prerequisites_for_traffic_split || []).join(", ") || "none"}`,
  ].join("\n");
}

function heartbeatManifest(manifest, options) {
  const now = options.now || new Date().toISOString();
  const next = {
    ...manifest,
    status: options.status || manifest.status,
    updated_at: now,
    lane: {
      ...manifest.lane,
      heartbeat_at: now,
    },
    progress: [
      ...(manifest.progress || []),
      {
        at: now,
        phase: options.phase || options.status || "heartbeat",
        message: options.message || "Deployment bus heartbeat",
      },
    ],
  };
  return next;
}

function recordPostDeployWatch(manifest, options) {
  const now = options.now || new Date().toISOString();
  const existingWatch = manifest.post_deploy_watch || {};
  const status = options.status || existingWatch.status || "in_progress";
  if (!VALID_POST_DEPLOY_WATCH_STATUSES.has(status)) {
    throw new Error(`Invalid post-deploy watch status: ${status}`);
  }

  const startedAt =
    options.startedAt ||
    existingWatch.started_at ||
    (status === "in_progress" ? now : null);
  const completedAt =
    options.completedAt ||
    existingWatch.completed_at ||
    (["passed", "failed", "blocked", "skipped"].includes(status) ? now : null);
  const watch = {
    required:
      existingWatch.required !== undefined
        ? existingWatch.required
        : manifest.environment === "production",
    status,
    min_duration_minutes:
      existingWatch.min_duration_minutes ??
      (manifest.environment === "production" ? 30 : 0),
    observed_duration_minutes: parseInteger(
      options.observedDurationMinutes,
      existingWatch.observed_duration_minutes || 0
    ),
    started_at: startedAt,
    completed_at: completedAt,
    checkpoints: updateWatchCheckpoints(existingWatch.checkpoints || [], {
      id: options.checkpoint || options.checkpointId,
      status: options.checkpointStatus || defaultWatchCheckpointStatus(status),
      evidence: parseCsv(options.evidence || options.evidenceUri),
      notes: options.notes,
      recorded_at: now,
    }),
    notes: options.notes || existingWatch.notes || null,
  };

  return {
    ...manifest,
    updated_at: now,
    lane: {
      ...manifest.lane,
      heartbeat_at: now,
    },
    post_deploy_watch: watch,
    progress: [
      ...(Array.isArray(manifest.progress) ? manifest.progress : []),
      {
        at: now,
        phase: "post-deploy-watch",
        status: manifest.status,
        message: `Post-deploy watch recorded as ${status}`,
      },
    ],
  };
}

function defaultWatchCheckpointStatus(status) {
  return status === "not_started" ? "not_run" : status;
}

function updateWatchCheckpoints(checkpoints, update) {
  if (!update.id) {
    return Array.isArray(checkpoints) ? checkpoints : [];
  }

  const nextCheckpoint = {
    id: update.id,
    status: update.status,
    recorded_at: update.recorded_at,
    evidence: update.evidence,
    ...(update.notes ? { notes: update.notes } : {}),
  };
  const next = Array.isArray(checkpoints) ? [...checkpoints] : [];
  const index = next.findIndex((checkpoint) => checkpoint.id === update.id);
  if (index === -1) {
    next.push(nextCheckpoint);
  } else {
    next[index] = {
      ...next[index],
      ...nextCheckpoint,
      evidence:
        nextCheckpoint.evidence.length > 0
          ? nextCheckpoint.evidence
          : next[index].evidence || [],
    };
  }
  return next;
}

function productionPreflight(manifest, options = {}) {
  const branch = options.branch || "main";
  const remote = options.remote || "origin";
  const mainSha = options.currentMainSha;
  const candidateSha = manifest.shas?.production_candidate_sha;
  const validation = validateManifest(manifest);
  const errors = [...validation.errors];

  if (
    manifest.environment !== "production" &&
    manifest.production_eligible !== true
  ) {
    errors.push("manifest is not marked production_eligible");
  }
  if (!mainSha) {
    errors.push(`${remote}/${branch}: current main SHA is required`);
  } else if (!SHA_RE.test(mainSha)) {
    errors.push(`${remote}/${branch}: must be a 40-character git SHA`);
  }
  if (mainSha && (!candidateSha || candidateSha !== mainSha)) {
    errors.push(
      `production candidate ${candidateSha || "none"} does not match ${remote}/${branch} ${mainSha}`
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings: validation.warnings,
    mainSha,
    candidateSha,
  };
}

function githubContext(env = process.env) {
  const [owner, repo] = (env.GITHUB_REPOSITORY || "").split("/");
  if (!owner || !repo) {
    throw new Error("GITHUB_REPOSITORY must be set as OWNER/REPO");
  }
  if (!env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN must be set");
  }
  return {
    owner,
    repo,
    token: env.GITHUB_TOKEN,
    apiUrl: env.GITHUB_API_URL || "https://api.github.com",
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function githubRequest(
  method,
  route,
  body,
  env = process.env,
  options = {}
) {
  const context = githubContext(env);
  const attempts = parseInteger(options.attempts, 3);
  const timeoutMs = parseInteger(options.timeoutMs, 10000);
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await githubRequestAttempt(
        method,
        route,
        body,
        context,
        controller.signal
      );
    } catch (error) {
      lastError = error;
      if (shouldStopGithubRetry(error, attempt, attempts)) {
        throw lastError;
      }
    } finally {
      clearTimeout(timeout);
    }

    await sleep(attempt * 1000);
  }

  throw lastError;
}

function githubRequestUrl(context, route) {
  return `${context.apiUrl}/repos/${context.owner}/${context.repo}${route}`;
}

function githubRequestInit(method, body, context, signal) {
  return {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${context.token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  };
}

function githubApiError(method, route, response, data) {
  const message = data?.message || response.statusText;
  const error = new Error(
    `GitHub API ${method} ${route} failed: ${response.status} ${message}`
  );
  error.nonRetryable = !isRetryableGithubStatus(response.status);
  return error;
}

function isRetryableGithubStatus(status) {
  return status === 429 || status >= 500;
}

async function parseGithubResponse(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function githubRequestAttempt(method, route, body, context, signal) {
  const response = await fetch(
    githubRequestUrl(context, route),
    githubRequestInit(method, body, context, signal)
  );
  const data = await parseGithubResponse(response);

  if (response.ok) {
    return data;
  }

  throw githubApiError(method, route, response, data);
}

function shouldStopGithubRetry(error, attempt, attempts) {
  return Boolean(error?.nonRetryable || attempt === attempts);
}

function normalizeDeploymentId(value) {
  const deploymentId = String(value || "").trim();
  if (!/^\d+$/.test(deploymentId)) {
    throw new Error(
      `GitHub deployment id must be numeric, received: ${value || "empty"}`
    );
  }
  return deploymentId;
}

async function createGithubDeployment(manifest, options, env = process.env) {
  const validation = validateManifest(manifest);
  if (!validation.ok) {
    throw new Error(
      `Deployment bus manifest is invalid: ${validation.errors.join("; ")}`
    );
  }
  const ref = options.ref;
  if (!ref) {
    throw new Error("--ref is required");
  }
  const environment = options.environment;
  if (!environment) {
    throw new Error("--environment is required");
  }
  const deploymentBusPayload = {
    deployment_bus: {
      schema_version: SCHEMA_VERSION,
      source: "workflow-artifact",
    },
  };
  const deployment = await githubRequest(
    "POST",
    "/deployments",
    {
      ref,
      task: options.task || "deploy",
      auto_merge: false,
      required_contexts: [],
      payload: deploymentBusPayload,
      environment,
      description: options.description || `${environment} deployment bus`,
      transient_environment: false,
      production_environment: environment === "production",
    },
    env
  );

  if (!Number.isInteger(deployment?.id)) {
    throw new Error(
      `GitHub create deployment response did not include a numeric id: ${JSON.stringify(deployment)}`
    );
  }

  deployment.id = Number(normalizeDeploymentId(deployment.id));
  return deployment;
}

async function createGithubDeploymentStatus(options, env = process.env) {
  const deploymentId = normalizeDeploymentId(options.deploymentId);
  const state = options.state;
  if (!GITHUB_DEPLOYMENT_STATES.has(state)) {
    throw new Error(
      `--state must be one of ${[...GITHUB_DEPLOYMENT_STATES].join(", ")}`
    );
  }

  const status = await githubRequest(
    "POST",
    `/deployments/${deploymentId}/statuses`,
    {
      state,
      log_url: options.logUrl || defaultRunUrl(env),
      environment_url: options.environmentUrl || undefined,
      description: options.description || `Deployment ${state}`,
      auto_inactive: parseBoolean(options.autoInactive, false),
    },
    env
  );

  if (!status?.state) {
    throw new Error(
      `GitHub create deployment status response did not include a state: ${JSON.stringify(status)}`
    );
  }

  return status;
}

function printValidation(result) {
  for (const warning of result.warnings) {
    console.warn(`warning: ${warning}`);
  }
  if (!result.ok) {
    for (const error of result.errors) {
      console.error(`error: ${error}`);
    }
  }
}

function usage() {
  return `Usage:
  node ops/scripts/deployment-bus.cjs create-manifest --environment staging --staging-deploy-sha <sha> --output <file>
  node ops/scripts/deployment-bus.cjs validate-manifest --file <file>
  node ops/scripts/deployment-bus.cjs summarize-manifest --file <file>
  node ops/scripts/deployment-bus.cjs record-validation-check --file <file> --pack playwright:core-smoke --status passed --surfaces web:desktop-chromium,web:mobile-chromium --artifact-uri s3://6529-artifacts/... --redaction-status verified-redacted --artifact-sha256 <hex> --retention-days 90
  node ops/scripts/deployment-bus.cjs release-report --file <file> --output <markdown-file>
  node ops/scripts/deployment-bus.cjs heartbeat-manifest --file <file> --message <text> [--status deploying] [--phase build]
  node ops/scripts/deployment-bus.cjs record-post-deploy-watch --file <file> --status passed --observed-duration-minutes 30 --checkpoint version-match --evidence https://github.com/.../actions/runs/...
  node ops/scripts/deployment-bus.cjs production-preflight --file <file> --current-main-sha <sha> [--remote origin] [--branch main]
  node ops/scripts/deployment-bus.cjs github-create-deployment --file <file> --ref <sha> --environment <name>
  node ops/scripts/deployment-bus.cjs github-create-status --deployment-id <id> --state in_progress
`;
}

async function main(argv = process.argv.slice(2), env = process.env) {
  const [command, ...rest] = argv;
  const args = parseArgs(rest);

  try {
    switch (command) {
      case "create-manifest": {
        const manifest = buildManifest(
          {
            environment: args.environment,
            stagingDeploySha: args["staging-deploy-sha"],
            productionCandidateSha: args["production-candidate-sha"],
            productionEligible: args["production-eligible"],
            stagingBranch: args["staging-branch"],
            releaseCaptain: args["release-captain"],
            releaseId: args["release-id"],
            repository: args.repository,
            status: args.status,
            phase: args.phase,
            message: args.message,
            complexity: args.complexity,
            expectedDurationMinutes: args["expected-duration-minutes"],
            heartbeatIntervalMinutes: args["heartbeat-interval-minutes"],
            staleAfterMinutes: args["stale-after-minutes"],
            progressUpdateChannels: args["progress-update-channels"],
            escalationAfterMinutes: args["escalation-after-minutes"],
            checkpointLabels: args["checkpoint-labels"],
            coreSmokeOwner: args["core-smoke-owner"],
            requiredPacks: args["required-packs"],
            includedPrs: args["included-prs"],
            backendDependencies: args["backend-dependencies"],
            exploratoryChecks: args["exploratory-checks"],
            validationChecks: args["validation-checks"],
            durableArtifactsRequired: args["durable-artifacts-required"],
            postDeployWatchRequired: args["post-deploy-watch-required"],
            postDeployWatchStatus: args["post-deploy-watch-status"],
            postDeployWatchMinDurationMinutes:
              args["post-deploy-watch-min-duration-minutes"],
            postDeployWatchObservedDurationMinutes:
              args["post-deploy-watch-observed-duration-minutes"],
            postDeployWatchStartedAt: args["post-deploy-watch-started-at"],
            postDeployWatchCompletedAt: args["post-deploy-watch-completed-at"],
            postDeployWatchCheckpoints: args["post-deploy-watch-checkpoints"],
            postDeployWatchNotes: args["post-deploy-watch-notes"],
            canaryCapability: args["canary-capability"],
            trafficSplittingSupported: args["traffic-splitting-supported"],
            featureFlagStrategy: args["feature-flag-strategy"],
            candidateControlMetrics: args["candidate-control-metrics"],
            canaryPrerequisites: args["canary-prerequisites"],
            canaryNotes: args["canary-notes"],
            rollbackPlan: args["rollback-plan"],
            fixForwardPlan: args["fix-forward-plan"],
            approvals: args.approvals,
            workflowRunUrl: args["workflow-run-url"],
            environmentUrl: args["environment-url"],
            ref: args.ref,
            now: args.now,
          },
          env
        );
        const result = validateManifest(manifest);
        printValidation(result);
        if (!result.ok) {
          process.exitCode = 1;
          return;
        }
        if (!args.output) {
          writeStdout(JSON.stringify(manifest, null, 2));
        } else {
          writeJson(args.output, manifest);
          writeStdout(`Wrote ${args.output}`);
        }
        break;
      }
      case "validate-manifest": {
        const result = validateManifest(readJson(args.file));
        printValidation(result);
        if (!result.ok) {
          process.exitCode = 1;
        } else {
          writeStdout("Deployment bus manifest is valid.");
        }
        break;
      }
      case "summarize-manifest": {
        writeStdout(summarizeManifest(readJson(args.file)));
        break;
      }
      case "record-validation-check": {
        const file = args.file;
        const manifest = recordValidationCheck(readJson(file), {
          pack: args.pack,
          status: args.status,
          command: args.command,
          surfaces: args.surfaces || args.surface,
          owner: args.owner,
          artifactUri: args["artifact-uri"] || args["artifact-uris"],
          redactionStatus: args["redaction-status"],
          artifactSha256: args["artifact-sha256"],
          artifactEtag: args["artifact-etag"],
          artifactCid: args["artifact-cid"],
          retentionDays: args["retention-days"],
          retentionUntil: args["retention-until"],
          retentionPolicy: args["retention-policy"],
          runUrl: args["run-url"],
          source: args.source,
          notes: args.notes,
          now: args.now,
        });
        const result = validateManifest(manifest);
        printValidation(result);
        if (!result.ok) {
          process.exitCode = 1;
          return;
        }
        writeJson(args.output || file, manifest);
        writeStdout(`Updated ${args.output || file}`);
        break;
      }
      case "release-report": {
        const manifest = readJson(args.file);
        const report = createReleaseReport(manifest, {
          now: args.now,
        });
        const result = validateManifest(manifest);
        if (args.output) {
          const target = path.resolve(args.output);
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI writes release reports to supplied workflow paths.
          fs.mkdirSync(path.dirname(target), { recursive: true });
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI writes release reports to supplied workflow paths.
          fs.writeFileSync(target, `${report}\n`);
          writeStdout(`Wrote ${args.output}`);
        } else {
          writeStdout(report);
        }
        printValidation(result);
        if (!result.ok) {
          process.exitCode = 1;
        }
        break;
      }
      case "heartbeat-manifest": {
        const file = args.file;
        const manifest = heartbeatManifest(readJson(file), {
          status: args.status,
          phase: args.phase,
          message: args.message,
          now: args.now,
        });
        const result = validateManifest(manifest);
        printValidation(result);
        if (!result.ok) {
          process.exitCode = 1;
          return;
        }
        writeJson(args.output || file, manifest);
        writeStdout(`Updated ${args.output || file}`);
        break;
      }
      case "record-post-deploy-watch": {
        const file = args.file;
        const manifest = recordPostDeployWatch(readJson(file), {
          status: args.status,
          observedDurationMinutes: args["observed-duration-minutes"],
          startedAt: args["started-at"],
          completedAt: args["completed-at"],
          checkpoint: args.checkpoint,
          checkpointStatus: args["checkpoint-status"],
          evidence: args.evidence || args["evidence-uri"],
          notes: args.notes,
          now: args.now,
        });
        const result = validateManifest(manifest);
        printValidation(result);
        if (!result.ok) {
          process.exitCode = 1;
          return;
        }
        writeJson(args.output || file, manifest);
        writeStdout(`Updated ${args.output || file}`);
        break;
      }
      case "production-preflight": {
        const result = productionPreflight(readJson(args.file), {
          remote: args.remote,
          branch: args.branch,
          currentMainSha: args["current-main-sha"],
        });
        printValidation(result);
        if (!result.ok) {
          process.exitCode = 1;
          return;
        }
        writeStdout(
          `Production preflight passed: ${result.candidateSha} matches ${args.remote || "origin"}/${args.branch || "main"}.`
        );
        break;
      }
      case "github-create-deployment": {
        const deployment = await createGithubDeployment(
          readJson(args.file),
          {
            ref: args.ref,
            task: args.task,
            environment: args.environment,
            description: args.description,
          },
          env
        );
        console.error(`Created GitHub deployment ${deployment.id}`);
        writeStdout(deployment.id);
        break;
      }
      case "github-create-status": {
        const status = await createGithubDeploymentStatus(
          {
            deploymentId: args["deployment-id"],
            state: args.state,
            description: args.description,
            logUrl: args["log-url"],
            environmentUrl: args["environment-url"],
            autoInactive: args["auto-inactive"],
          },
          env
        );
        writeStdout(`Created GitHub deployment status ${status.state}`);
        break;
      }
      default:
        writeStdout(usage());
        process.exitCode = command ? 1 : 0;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  SCHEMA_VERSION,
  DEFAULT_REQUIRED_PACKS,
  VALIDATION_PACKS,
  VALID_STATUSES,
  buildManifest,
  createGithubDeployment,
  createGithubDeploymentStatus,
  createReleaseReport,
  evaluateReleaseReadiness,
  heartbeatManifest,
  parseArgs,
  productionPreflight,
  recordPostDeployWatch,
  recordValidationCheck,
  summarizeManifest,
  validateManifest,
};
