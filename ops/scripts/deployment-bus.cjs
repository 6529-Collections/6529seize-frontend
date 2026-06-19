#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const SCHEMA_VERSION = "deployment-bus.v1";
const SHA_RE = /^[0-9a-f]{40}$/i;
const VALID_ENVIRONMENTS = new Set(["staging", "production"]);
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

function parseArgs(argv) {
  const args = { _: [] };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }

    const rawKey = token.slice(2);
    const eqIndex = rawKey.indexOf("=");
    if (eqIndex !== -1) {
      args[rawKey.slice(0, eqIndex)] = rawKey.slice(eqIndex + 1);
      continue;
    }

    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[rawKey] = true;
      continue;
    }

    args[rawKey] = next;
    i += 1;
  }

  return args;
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
    throw new Error(`--environment must be one of: ${[...VALID_ENVIRONMENTS].join(", ")}`);
  }

  const stagingDeploySha = options.stagingDeploySha || null;
  const productionCandidateSha = options.productionCandidateSha || null;
  const productionEligibleDefault =
    environment === "production" || Boolean(productionCandidateSha);
  const productionEligible = parseBoolean(
    options.productionEligible,
    productionEligibleDefault,
  );
  const expectedDurationMinutes = parseInteger(
    options.expectedDurationMinutes,
    environment === "production" ? 120 : 75,
  );
  const complexity =
    options.complexity ||
    (expectedDurationMinutes > 120 ? "complex" : "standard");
  const heartbeatIntervalMinutes = parseInteger(
    options.heartbeatIntervalMinutes,
    expectedDurationMinutes > 120 ? 30 : 15,
  );
  const staleAfterMinutes = parseInteger(
    options.staleAfterMinutes,
    Math.max(heartbeatIntervalMinutes * 3, expectedDurationMinutes > 120 ? 90 : 45),
  );
  const releaseCaptain = options.releaseCaptain || env.GITHUB_ACTOR || "unassigned";
  const baseSha =
    productionCandidateSha || stagingDeploySha || options.ref || env.GITHUB_SHA || null;
  const releaseId =
    options.releaseId ||
    `fe-${environment}-${timestampSlug(now)}-${shortSha(baseSha)}`;
  const workflowRunUrl = options.workflowRunUrl || defaultRunUrl(env);
  const environmentUrl =
    options.environmentUrl || defaultEnvironmentUrl(environment);
  const longRunning =
    complexity === "complex" || expectedDurationMinutes > 120
      ? {
          enabled: true,
          heartbeat_interval_minutes: heartbeatIntervalMinutes,
          progress_update_channels: parseCsv(
            options.progressUpdateChannels || "github-deployment-status,wave",
          ),
          escalation_after_minutes: parseInteger(
            options.escalationAfterMinutes,
            Math.max(staleAfterMinutes * 2, 180),
          ),
          checkpoint_labels: parseCsv(
            options.checkpointLabels ||
              "preflight,deploy-started,mid-deploy,validation-started,terminal",
          ),
        }
      : {
          enabled: false,
        };

  return {
    schema_version: SCHEMA_VERSION,
    release_id: releaseId,
    repository:
      options.repository || env.GITHUB_REPOSITORY || "6529-Collections/6529seize-frontend",
    environment,
    status: options.status || "queued",
    created_at: now,
    updated_at: now,
    release_captain: releaseCaptain,
    complexity,
    production_eligible: productionEligible,
    staging_branch: options.stagingBranch || (environment === "staging" ? "1a-staging" : null),
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
      required_packs: parseCsv(options.requiredPacks || "core-smoke"),
      exploratory_checks: parseJsonOption(options.exploratoryChecks, []),
      checks: parseJsonOption(options.validationChecks, []),
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
    pushError(errors, "status", `must be one of ${[...VALID_STATUSES].join(", ")}`);
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
    manifest.environment === "staging",
  );
  validateSha(
    errors,
    "shas.production_candidate_sha",
    shas.production_candidate_sha,
    manifest.environment === "production" || manifest.production_eligible,
  );

  if (manifest.environment === "production" && manifest.production_eligible !== true) {
    pushError(errors, "production_eligible", "production manifests must be eligible");
  }

  const lane = manifest.lane || {};
  if (!lane.owner) {
    pushError(errors, "lane.owner", "required");
  }
  validateIso(errors, "lane.acquired_at", lane.acquired_at);
  validateIso(errors, "lane.heartbeat_at", lane.heartbeat_at);
  if (!Number.isInteger(lane.heartbeat_interval_minutes) || lane.heartbeat_interval_minutes <= 0) {
    pushError(errors, "lane.heartbeat_interval_minutes", "must be a positive integer");
  }
  if (!Number.isInteger(lane.stale_after_minutes) || lane.stale_after_minutes <= 0) {
    pushError(errors, "lane.stale_after_minutes", "must be a positive integer");
  }
  if (!Number.isInteger(lane.expected_duration_minutes) || lane.expected_duration_minutes <= 0) {
    pushError(errors, "lane.expected_duration_minutes", "must be a positive integer");
  }
  validateIso(errors, "lane.expected_completion_at", lane.expected_completion_at);

  if (
    Number.isInteger(lane.heartbeat_interval_minutes) &&
    Number.isInteger(lane.stale_after_minutes) &&
    lane.heartbeat_interval_minutes * 2 > lane.stale_after_minutes
  ) {
    pushError(
      errors,
      "lane.heartbeat_interval_minutes",
      "must be at most half of lane.stale_after_minutes",
    );
  }

  const longRunningRequired =
    manifest.complexity === "complex" || lane.expected_duration_minutes > 120;
  const longRunning = manifest.long_running || {};
  if (longRunningRequired) {
    if (longRunning.enabled !== true) {
      pushError(errors, "long_running.enabled", "required for complex or multi-hour deploys");
    }
    if (!Array.isArray(longRunning.progress_update_channels) || longRunning.progress_update_channels.length === 0) {
      pushError(errors, "long_running.progress_update_channels", "must name at least one channel");
    }
    if (!Number.isInteger(longRunning.escalation_after_minutes) || longRunning.escalation_after_minutes <= lane.stale_after_minutes) {
      pushError(errors, "long_running.escalation_after_minutes", "must exceed stale_after_minutes");
    }
    if (!Array.isArray(longRunning.checkpoint_labels) || longRunning.checkpoint_labels.length < 3) {
      pushError(errors, "long_running.checkpoint_labels", "must include at least three checkpoints");
    }
    if (!manifest.plans || !manifest.plans.rollback) {
      pushError(errors, "plans.rollback", "required for complex or multi-hour deploys");
    }
    if (!manifest.plans || !manifest.plans.fix_forward) {
      pushError(errors, "plans.fix_forward", "required for complex or multi-hour deploys");
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
  if (!Array.isArray(manifest.progress) || manifest.progress.length === 0) {
    pushError(errors, "progress", "must include at least one event");
  }

  if (
    manifest.environment === "staging" &&
    manifest.production_eligible !== true
  ) {
    warnings.push(
      "staging manifest is exploratory only; it does not satisfy the production same-SHA gate",
    );
  }

  return { ok: errors.length === 0, errors, warnings };
}

function summarizeManifest(manifest) {
  const deploymentId = manifest.deployment?.github_deployment_id || "none";
  const productionSha = manifest.shas?.production_candidate_sha || "none";
  const stagingSha = manifest.shas?.staging_deploy_sha || "none";
  const owner = manifest.lane?.owner || manifest.release_captain || "unassigned";

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

function productionPreflight(manifest, options = {}) {
  const branch = options.branch || "main";
  const remote = options.remote || "origin";
  const mainSha = options.currentMainSha;
  const candidateSha = manifest.shas?.production_candidate_sha;
  const validation = validateManifest(manifest);
  const errors = [...validation.errors];

  if (manifest.environment !== "production" && manifest.production_eligible !== true) {
    errors.push("manifest is not marked production_eligible");
  }
  if (!mainSha) {
    errors.push(`${remote}/${branch}: current main SHA is required`);
  } else if (!SHA_RE.test(mainSha)) {
    errors.push(`${remote}/${branch}: must be a 40-character git SHA`);
  }
  if (mainSha && (!candidateSha || candidateSha !== mainSha)) {
    errors.push(
      `production candidate ${candidateSha || "none"} does not match ${remote}/${branch} ${mainSha}`,
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

async function githubRequest(method, route, body, env = process.env, options = {}) {
  const context = githubContext(env);
  const attempts = parseInteger(options.attempts, 3);
  const timeoutMs = parseInteger(options.timeoutMs, 10000);
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(
        `${context.apiUrl}/repos/${context.owner}/${context.repo}${route}`,
        {
          method,
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${context.token}`,
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        },
      );
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      if (response.ok) {
        return data;
      }

      const message = data?.message || response.statusText;
      lastError = new Error(
        `GitHub API ${method} ${route} failed: ${response.status} ${message}`,
      );
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === attempts) {
        lastError.nonRetryable = !retryable;
        throw lastError;
      }
    } catch (error) {
      lastError = error;
      if (error?.nonRetryable) {
        throw lastError;
      }
      if (attempt === attempts) {
        throw lastError;
      }
    } finally {
      clearTimeout(timeout);
    }

    await sleep(attempt * 1000);
  }

  throw lastError;
}

function normalizeDeploymentId(value) {
  const deploymentId = String(value || "").trim();
  if (!/^\d+$/.test(deploymentId)) {
    throw new Error(`GitHub deployment id must be numeric, received: ${value || "empty"}`);
  }
  return deploymentId;
}

async function createGithubDeployment(manifest, options, env = process.env) {
  const validation = validateManifest(manifest);
  if (!validation.ok) {
    throw new Error(`Deployment bus manifest is invalid: ${validation.errors.join("; ")}`);
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
    env,
  );

  if (!Number.isInteger(deployment?.id)) {
    throw new Error(
      `GitHub create deployment response did not include a numeric id: ${JSON.stringify(deployment)}`,
    );
  }

  deployment.id = Number(normalizeDeploymentId(deployment.id));
  return deployment;
}

async function createGithubDeploymentStatus(options, env = process.env) {
  const deploymentId = normalizeDeploymentId(options.deploymentId);
  const state = options.state;
  if (!GITHUB_DEPLOYMENT_STATES.has(state)) {
    throw new Error(`--state must be one of ${[...GITHUB_DEPLOYMENT_STATES].join(", ")}`);
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
    env,
  );

  if (!status?.state) {
    throw new Error(
      `GitHub create deployment status response did not include a state: ${JSON.stringify(status)}`,
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
  node ops/scripts/deployment-bus.cjs heartbeat-manifest --file <file> --message <text> [--status deploying] [--phase build]
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
        const manifest = buildManifest({
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
          rollbackPlan: args["rollback-plan"],
          fixForwardPlan: args["fix-forward-plan"],
          approvals: args.approvals,
          workflowRunUrl: args["workflow-run-url"],
          environmentUrl: args["environment-url"],
          ref: args.ref,
          now: args.now,
        }, env);
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
          `Production preflight passed: ${result.candidateSha} matches ${args.remote || "origin"}/${args.branch || "main"}.`,
        );
        break;
      }
      case "github-create-deployment": {
        const deployment = await createGithubDeployment(readJson(args.file), {
          ref: args.ref,
          task: args.task,
          environment: args.environment,
          description: args.description,
        }, env);
        console.error(`Created GitHub deployment ${deployment.id}`);
        writeStdout(deployment.id);
        break;
      }
      case "github-create-status": {
        const status = await createGithubDeploymentStatus({
          deploymentId: args["deployment-id"],
          state: args.state,
          description: args.description,
          logUrl: args["log-url"],
          environmentUrl: args["environment-url"],
          autoInactive: args["auto-inactive"],
        }, env);
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
  VALID_STATUSES,
  buildManifest,
  createGithubDeployment,
  createGithubDeploymentStatus,
  heartbeatManifest,
  parseArgs,
  productionPreflight,
  summarizeManifest,
  validateManifest,
};
