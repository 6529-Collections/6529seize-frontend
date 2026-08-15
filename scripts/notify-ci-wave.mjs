#!/usr/bin/env node
import crypto from "node:crypto";

const {
  CI_PIPELINES_ALERT_URL,
  CI_PIPELINES_ALERT_SECRET,
  CI_PIPELINES_ALERT_API_AUTH,
  CI_PIPELINES_ALERT_TYPE,
  CI_PIPELINES_TARGET_ENV,
  CI_PIPELINES_STATUS,
  CI_PIPELINES_TITLE,
  CI_PIPELINES_DESCRIPTION,
  CI_PIPELINES_ENVIRONMENT,
  CI_PIPELINES_SERVICE,
  CI_PIPELINES_WORKFLOW,
  CI_RELEASE_NOTES_PROMPT_PATH,
  CI_RELEASE_GROUP_ID,
  CI_RELEASE_GROUP_SERVICES,
  CI_RELEASE_TRAIN_ID,
  CI_RELEASE_CONTRIBUTORS,
  CI_RELEASE_OPERATION_KEY,
  CI_PIPELINES_SHA,
  CI_PIPELINES_PARENT_DEPLOY_RUN_ID,
  CI_PIPELINES_PARENT_RELEASE_TRAIN_ID,
  CI_PIPELINES_VALIDATION_PACK,
  GITHUB_REPOSITORY,
  GITHUB_WORKFLOW,
  GITHUB_RUN_ID,
  GITHUB_RUN_NUMBER,
  GITHUB_RUN_ATTEMPT,
  GITHUB_SERVER_URL = "https://github.com",
  GITHUB_SHA,
  GITHUB_REF_NAME,
  GITHUB_TRIGGERING_ACTOR,
  GITHUB_ACTOR,
  GITHUB_TOKEN,
  GITHUB_API_URL = "https://api.github.com",
  CI_GITHUB_EVIDENCE_REQUEST_TIMEOUT_MS,
  CI_GITHUB_EVIDENCE_DEADLINE_MS,
  CI_PIPELINES_ALERT_TIMEOUT_MS,
} = process.env;

function requireValue(name, value) {
  if (!value) {
    console.error(`${name} is required`);
    process.exit(1);
  }
  return value;
}

function normalizeTargetEnvironment(value) {
  const targetEnv = (value || "").trim().toLowerCase();
  if (!targetEnv) {
    return null;
  }
  if (targetEnv === "staging") {
    return "staging";
  }
  if (targetEnv === "prod" || targetEnv === "production") {
    return "prod";
  }
  return `unsupported:${targetEnv}`;
}

function getFetchFailureMessage(error) {
  if (error instanceof Error) {
    return error.name === "AbortError" ? "request timed out" : error.message;
  }
  return "unknown request error";
}

function boundedDuration(value, fallback, minimum, maximum) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : fallback;
}

const GITHUB_EVIDENCE_REQUEST_TIMEOUT_MS = boundedDuration(
  CI_GITHUB_EVIDENCE_REQUEST_TIMEOUT_MS,
  3_000,
  25,
  10_000
);
const GITHUB_EVIDENCE_DEADLINE_MS = boundedDuration(
  CI_GITHUB_EVIDENCE_DEADLINE_MS,
  12_000,
  50,
  30_000
);
const GITHUB_EVIDENCE_MAX_ATTEMPTS = 3;
const GITHUB_EVIDENCE_FALLBACK_RETRY_MS = 250;
const PIPELINES_ALERT_TIMEOUT_MS = boundedDuration(
  CI_PIPELINES_ALERT_TIMEOUT_MS,
  10_000,
  25,
  30_000
);

function isContributorGithubLogin(value) {
  return (
    value.length <= 39 &&
    /^(?:[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38})(?:\[bot\])?$/.test(
      value
    )
  );
}

const NON_HUMAN_GITHUB_LOGINS = new Set([
  "dependabot",
  "github-actions",
  "renovate",
  "web-flow",
]);

function isHumanGithubUser(user) {
  const login = user?.login?.trim();
  const type = user?.type?.trim().toLowerCase();
  return Boolean(
    login &&
    type === "user" &&
    !login.toLowerCase().endsWith("[bot]") &&
    !NON_HUMAN_GITHUB_LOGINS.has(login.toLowerCase())
  );
}

function normalizeContributorGithubLogins(entries) {
  const contributors = [];
  const seen = new Set();
  for (const entry of entries) {
    const login = entry.trim();
    const key = login.toLowerCase();
    if (
      seen.has(key) ||
      key.endsWith("[bot]") ||
      NON_HUMAN_GITHUB_LOGINS.has(key)
    )
      continue;
    seen.add(key);
    contributors.push(login);
  }
  return contributors;
}

function parseReleaseContributors(value) {
  if (!value) return [];
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed) || parsed.length > 100) {
    throw new Error(
      "CI_RELEASE_CONTRIBUTORS must be an array with at most 100 entries"
    );
  }
  const contributors = [];
  for (const entry of parsed) {
    if (typeof entry !== "string" || !isContributorGithubLogin(entry.trim())) {
      throw new Error(
        "CI_RELEASE_CONTRIBUTORS contains an invalid GitHub login"
      );
    }
    contributors.push(entry);
  }
  return normalizeContributorGithubLogins(contributors);
}

function githubRetryDelayMs(response, attempt) {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter !== null) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.ceil(seconds * 1_000);
    }
    const retryAt = Date.parse(retryAfter);
    if (Number.isFinite(retryAt)) {
      return Math.max(0, retryAt - Date.now());
    }
  }
  const rateLimitReset = Number(response.headers.get("x-ratelimit-reset"));
  if (Number.isFinite(rateLimitReset) && rateLimitReset > 0) {
    return Math.max(0, rateLimitReset * 1_000 - Date.now());
  }
  return GITHUB_EVIDENCE_FALLBACK_RETRY_MS * 2 ** (attempt - 1);
}

function isRetryableGithubEvidenceResponse(response) {
  if (response.status === 429) return true;
  return (
    response.status === 403 &&
    (response.headers.has("retry-after") ||
      response.headers.get("x-ratelimit-remaining") === "0" ||
      response.headers.has("x-ratelimit-reset"))
  );
}

function githubEvidenceDeadlineError() {
  return new Error(
    `GitHub contributor evidence deadline expired after ${GITHUB_EVIDENCE_DEADLINE_MS}ms`
  );
}

async function githubApi(repository, path, evidenceBudget) {
  for (let attempt = 1; attempt <= GITHUB_EVIDENCE_MAX_ATTEMPTS; attempt += 1) {
    const remainingMs = evidenceBudget.deadlineAt - Date.now();
    if (remainingMs <= 0) throw githubEvidenceDeadlineError();
    const requestTimeoutMs = Math.min(
      GITHUB_EVIDENCE_REQUEST_TIMEOUT_MS,
      remainingMs
    );
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);
    let response;
    try {
      response = await fetch(
        `${GITHUB_API_URL.replace(/\/$/, "")}/repos/${repository}${path}`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            ...(GITHUB_TOKEN
              ? { Authorization: `Bearer ${GITHUB_TOKEN}` }
              : {}),
            "User-Agent": "6529-ci-contributor-attribution",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          signal: controller.signal,
        }
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        if (Date.now() >= evidenceBudget.deadlineAt) {
          throw githubEvidenceDeadlineError();
        }
        throw new Error(
          `GitHub contributor evidence request timed out after ${requestTimeoutMs}ms: ${path}`
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    const retryable = isRetryableGithubEvidenceResponse(response);
    if (!retryable || attempt === GITHUB_EVIDENCE_MAX_ATTEMPTS) {
      throw new Error(
        `GitHub contributor evidence request failed after ${attempt} attempt${attempt === 1 ? "" : "s"}: ${response.status} ${response.statusText}`
      );
    }
    const retryDelayMs = githubRetryDelayMs(response, attempt);
    const retryBudgetMs = evidenceBudget.deadlineAt - Date.now();
    if (retryDelayMs >= retryBudgetMs) {
      throw githubEvidenceDeadlineError();
    }
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  }
  throw new Error("GitHub contributor evidence request exhausted retries");
}

const MANUAL_FRONTEND_WORKFLOWS = Object.freeze({
  "Web Deploy - STAGING": Object.freeze({
    workflowFile: "deploy-staging.yml",
    branch: "1a-staging",
    pullRequestBase: "main",
  }),
  "Web Deploy - PROD": Object.freeze({
    workflowFile: "build-upload-deploy-prod.yml",
    branch: "main",
    pullRequestBase: "main",
  }),
});
const APPROVED_FRONTEND_PRODUCTION_WORKFLOWS = Object.freeze({
  "Web Deploy - PROD": "build-upload-deploy-prod.yml",
  "Release Bus - Deploy Frontend Production":
    "release-bus-deploy-production.yml",
});

function validateCurrentManualWorkflowRun({
  currentRun,
  runId,
  workflow,
  workflowFile,
  approvedBranch,
  deployedSha,
  branch,
}) {
  if (String(currentRun.id) !== runId) {
    throw new Error("Current workflow run ID does not match GITHUB_RUN_ID");
  }
  if (currentRun.name !== workflow) {
    throw new Error("Current workflow run name is not the approved workflow");
  }
  const currentWorkflowPath = currentRun.path?.split("@")[0];
  const approvedWorkflowPath = `.github/workflows/${workflowFile}`;
  if (currentWorkflowPath !== approvedWorkflowPath) {
    throw new Error("Current workflow run path is not the approved workflow");
  }
  if (currentRun.head_sha !== deployedSha) {
    throw new Error("Current workflow run SHA does not match the deployed SHA");
  }
  if (branch !== approvedBranch) {
    throw new Error(
      `Deployment branch ${branch} is not approved for workflow ${workflow}`
    );
  }
  if (currentRun.head_branch !== branch) {
    throw new Error(
      "Current workflow run branch does not match the deployed branch"
    );
  }
  const isLiveSuccessNotification =
    currentRun.status === "in_progress" && currentRun.conclusion === null;
  const isSuccessfulReplay =
    currentRun.status === "completed" && currentRun.conclusion === "success";
  if (!isLiveSuccessNotification && !isSuccessfulReplay) {
    throw new Error(
      `Current workflow run state ${currentRun.status ?? "unknown"}/${currentRun.conclusion ?? "null"} is not valid for a success notification`
    );
  }
  if (
    !currentRun.created_at ||
    Number.isNaN(Date.parse(currentRun.created_at))
  ) {
    throw new Error("Current workflow run creation time is invalid");
  }
}

async function listPreviousWorkflowRuns({
  repository,
  workflowName,
  workflowFile,
  currentRun,
  branch,
  evidenceBudget,
}) {
  const runs = [];
  for (let page = 1; page <= 10; page += 1) {
    const payload = await githubApi(
      repository,
      `/actions/workflows/${encodeURIComponent(workflowFile)}/runs?status=success&branch=${encodeURIComponent(branch)}&per_page=100&page=${page}`,
      evidenceBudget
    );
    const pageRuns = payload.workflow_runs ?? [];
    if (!Array.isArray(pageRuns)) {
      throw new Error(`Production history for ${workflowName} is malformed`);
    }
    for (const run of pageRuns) {
      if (
        String(run.id) === String(currentRun.id) ||
        run.name !== workflowName ||
        run.path?.split("@")[0] !== `.github/workflows/${workflowFile}` ||
        run.status !== "completed" ||
        run.conclusion !== "success" ||
        run.head_branch !== branch ||
        !run.created_at ||
        Date.parse(run.created_at) >= Date.parse(currentRun.created_at)
      )
        continue;
      runs.push(run);
    }
    if (runs.length > 0) break;
    if (pageRuns.length < 100) break;
    if (page === 10) {
      throw new Error(`Production history for ${workflowName} is too large`);
    }
  }
  return runs;
}

async function deriveManualRangeContributors({
  repository,
  runId,
  workflow,
  deployedSha,
  branch,
}) {
  const evidenceBudget = {
    deadlineAt: Date.now() + GITHUB_EVIDENCE_DEADLINE_MS,
  };
  const workflowConfig = MANUAL_FRONTEND_WORKFLOWS[workflow];
  if (!workflowConfig) {
    throw new Error(`Workflow ${workflow} is not an approved manual path`);
  }
  const { workflowFile, branch: approvedBranch, pullRequestBase } =
    workflowConfig;
  const currentRun = await githubApi(
    repository,
    `/actions/runs/${runId}`,
    evidenceBudget
  );
  validateCurrentManualWorkflowRun({
    currentRun,
    runId,
    workflow,
    workflowFile,
    approvedBranch,
    deployedSha,
    branch,
  });
  const baselineWorkflows =
    workflow === "Web Deploy - PROD"
      ? APPROVED_FRONTEND_PRODUCTION_WORKFLOWS
      : { [workflow]: workflowFile };
  const baselineRuns = (
    await Promise.all(
      Object.entries(baselineWorkflows).map(([name, file]) =>
        listPreviousWorkflowRuns({
          repository,
          workflowName: name,
          workflowFile: file,
          currentRun,
          branch,
          evidenceBudget,
        })
      )
    )
  )
    .flat()
    .sort((left, right) => {
      const chronology =
        Date.parse(right.created_at) - Date.parse(left.created_at);
      return chronology || Number(right.id) - Number(left.id);
    });
  const baseline = baselineRuns[0];
  if (!baseline) {
    throw new Error("No prior approved successful deployment baseline exists");
  }
  const commits = [];
  for (let page = 1; page <= 3; page += 1) {
    const comparison = await githubApi(
      repository,
      `/compare/${encodeURIComponent(baseline.head_sha)}...${encodeURIComponent(deployedSha)}?per_page=100&page=${page}`,
      evidenceBudget
    );
    if (comparison.status !== "ahead" && comparison.status !== "identical") {
      throw new Error("Deployment comparison is not a forward range");
    }
    const pageCommits = comparison.commits ?? [];
    if (!Array.isArray(pageCommits)) {
      throw new Error("Deployment comparison commit evidence is malformed");
    }
    commits.push(...pageCommits);
    if (pageCommits.length < 100) break;
    if (page === 3) {
      throw new Error("Deployment comparison exceeds the evidence bound");
    }
  }
  const users = [];
  const pullRequests = new Map();
  for (const commit of commits) {
    users.push(commit.author, commit.committer);
    const associated = await githubApi(
      repository,
      `/commits/${encodeURIComponent(commit.sha)}/pulls`,
      evidenceBudget
    );
    if (!Array.isArray(associated)) {
      throw new Error(
        `Pull-request evidence for commit ${commit.sha} is malformed`
      );
    }
    for (const pull of associated) {
      if (pull.merged_at && pull.base?.ref === pullRequestBase) {
        pullRequests.set(pull.number, pull);
      }
    }
  }
  for (const pull of pullRequests.values()) {
    users.push(pull.user);
    for (let page = 1; page <= 3; page += 1) {
      const pullCommits = await githubApi(
        repository,
        `/pulls/${pull.number}/commits?per_page=100&page=${page}`,
        evidenceBudget
      );
      if (!Array.isArray(pullCommits)) {
        throw new Error(`PR #${pull.number} commit evidence is malformed`);
      }
      for (const commit of pullCommits) {
        users.push(commit.author, commit.committer);
      }
      if (pullCommits.length < 100) break;
      if (page === 3) {
        throw new Error(
          `PR #${pull.number} contributor evidence is incomplete`
        );
      }
    }
  }
  const contributors = normalizeContributorGithubLogins(
    users.filter(isHumanGithubUser).map((user) => user.login)
  );
  if (contributors.length > 100) {
    throw new Error(
      "Verified manual deployment contributor evidence exceeds 100 users"
    );
  }
  return contributors;
}

function releaseContributorMetadataErrorMessage(error) {
  if (error instanceof SyntaxError) {
    return "CI_RELEASE_CONTRIBUTORS is not valid JSON";
  }
  if (error instanceof Error) return error.message;
  return "Release contributor metadata is invalid";
}

const targetEnvironment = normalizeTargetEnvironment(
  CI_PIPELINES_TARGET_ENV || CI_PIPELINES_ENVIRONMENT
);

if (targetEnvironment?.startsWith("unsupported:")) {
  console.error(
    `Unsupported CI pipeline alert target environment: ${targetEnvironment.slice(12)}`
  );
  process.exit(1);
}

if (!CI_PIPELINES_ALERT_URL || !CI_PIPELINES_ALERT_SECRET) {
  console.log("CI pipeline alert receiver is not configured; skipping.");
  process.exit(0);
}

const repository = requireValue("GITHUB_REPOSITORY", GITHUB_REPOSITORY);
const runId = requireValue("GITHUB_RUN_ID", GITHUB_RUN_ID);
const status = requireValue("CI_PIPELINES_STATUS", CI_PIPELINES_STATUS);
const title = requireValue("CI_PIPELINES_TITLE", CI_PIPELINES_TITLE);
const alertType = CI_PIPELINES_ALERT_TYPE || "workflow";
if (!["workflow", "deploy", "web_e2e"].includes(alertType)) {
  console.error("CI_PIPELINES_ALERT_TYPE is invalid");
  process.exit(1);
}
const runAttempt = GITHUB_RUN_ATTEMPT ? Number(GITHUB_RUN_ATTEMPT) : 1;
if (!Number.isSafeInteger(runAttempt) || runAttempt <= 0) {
  console.error("GITHUB_RUN_ATTEMPT must be a positive integer");
  process.exit(1);
}
if (
  CI_PIPELINES_PARENT_DEPLOY_RUN_ID &&
  !/^[1-9][0-9]{0,19}$/.test(CI_PIPELINES_PARENT_DEPLOY_RUN_ID)
) {
  console.error("CI_PIPELINES_PARENT_DEPLOY_RUN_ID is invalid");
  process.exit(1);
}
if (
  CI_PIPELINES_PARENT_RELEASE_TRAIN_ID &&
  !/^[A-Za-z0-9._-]{1,100}$/.test(CI_PIPELINES_PARENT_RELEASE_TRAIN_ID)
) {
  console.error("CI_PIPELINES_PARENT_RELEASE_TRAIN_ID is invalid");
  process.exit(1);
}
if (
  CI_PIPELINES_VALIDATION_PACK &&
  !/^[A-Za-z0-9._-]{1,100}$/.test(CI_PIPELINES_VALIDATION_PACK)
) {
  console.error("CI_PIPELINES_VALIDATION_PACK is invalid");
  process.exit(1);
}
if (alertType === "web_e2e" && !CI_PIPELINES_VALIDATION_PACK) {
  console.error("CI_PIPELINES_VALIDATION_PACK is required for web_e2e alerts");
  process.exit(1);
}
const triggeredByGithubLogin = GITHUB_TRIGGERING_ACTOR || GITHUB_ACTOR || null;
let releaseContributors = [];
try {
  releaseContributors = parseReleaseContributors(CI_RELEASE_CONTRIBUTORS);
} catch (error) {
  console.error(releaseContributorMetadataErrorMessage(error));
  process.exit(1);
}
if (
  CI_RELEASE_TRAIN_ID &&
  !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
    CI_RELEASE_TRAIN_ID
  )
) {
  console.error("CI_RELEASE_TRAIN_ID is invalid");
  process.exit(1);
}
if (
  (CI_RELEASE_TRAIN_ID && !CI_RELEASE_OPERATION_KEY) ||
  (!CI_RELEASE_TRAIN_ID && CI_RELEASE_OPERATION_KEY)
) {
  console.error(
    "CI_RELEASE_TRAIN_ID and CI_RELEASE_OPERATION_KEY must be supplied together"
  );
  process.exit(1);
}
if (
  CI_RELEASE_OPERATION_KEY &&
  (!/^rb2:[A-Za-z0-9:._-]{1,220}:a[1-9]\d{0,8}$/.test(
    CI_RELEASE_OPERATION_KEY
  ) ||
    !CI_RELEASE_OPERATION_KEY.startsWith(`rb2:${CI_RELEASE_TRAIN_ID}:`))
) {
  console.error("CI_RELEASE_OPERATION_KEY is invalid for CI_RELEASE_TRAIN_ID");
  process.exit(1);
}
if (CI_PIPELINES_SHA && !/^[a-f0-9]{40}$/i.test(CI_PIPELINES_SHA)) {
  console.error("CI_PIPELINES_SHA must be a 40-character Git SHA");
  process.exit(1);
}
const alertSha = CI_PIPELINES_SHA
  ? CI_PIPELINES_SHA.toLowerCase()
  : alertType === "web_e2e"
    ? null
    : GITHUB_SHA || null;
const isReleaseNotesEligible =
  status === "success" &&
  targetEnvironment === "prod" &&
  Boolean(CI_RELEASE_NOTES_PROMPT_PATH);
const releaseGroupServices = (
  CI_RELEASE_GROUP_SERVICES ||
  CI_PIPELINES_SERVICE ||
  ""
)
  .split(",")
  .map((service) => service.trim())
  .filter(Boolean);
const releaseNotesFields = isReleaseNotesEligible
  ? {
      release_notes_prompt_path: CI_RELEASE_NOTES_PROMPT_PATH,
      release_group_id: CI_RELEASE_GROUP_ID || `${repository}:${runId}`,
      release_group_services: releaseGroupServices,
      deployed_at: new Date().toISOString(),
    }
  : {};
let contributorEvidence = null;
if (CI_RELEASE_TRAIN_ID && CI_RELEASE_OPERATION_KEY) {
  contributorEvidence = "release-bus-operation";
} else if (releaseContributors.length > 0) {
  console.warn(
    "Ignoring user-supplied contributors on a manual deployment; immutable GitHub evidence is required."
  );
  releaseContributors = [];
}
const deployedSha = alertSha;
if (
  status === "success" &&
  !CI_RELEASE_TRAIN_ID &&
  GITHUB_TOKEN &&
  deployedSha &&
  GITHUB_REF_NAME
) {
  try {
    releaseContributors = await deriveManualRangeContributors({
      repository,
      runId,
      workflow: CI_PIPELINES_WORKFLOW || GITHUB_WORKFLOW,
      deployedSha,
      branch: GITHUB_REF_NAME,
    });
    contributorEvidence = releaseContributors.length ? "manual-range" : null;
  } catch (error) {
    console.warn(
      `Contributors row omitted because exact manual deployment scope could not be established: ${getFetchFailureMessage(error)}`
    );
  }
}
const releaseIdentityFields =
  CI_RELEASE_TRAIN_ID && CI_RELEASE_OPERATION_KEY
    ? {
        release_train_id: CI_RELEASE_TRAIN_ID,
        release_operation_key: CI_RELEASE_OPERATION_KEY,
      }
    : {};
const contributorFields =
  contributorEvidence && releaseContributors.length
    ? {
        contributor_github_logins: releaseContributors,
        contributor_evidence: contributorEvidence,
      }
    : {};
const webE2EFields =
  alertType === "web_e2e"
    ? {
        parent_deploy_run_id: CI_PIPELINES_PARENT_DEPLOY_RUN_ID || null,
        parent_release_train_id: CI_PIPELINES_PARENT_RELEASE_TRAIN_ID || null,
        validation_pack: CI_PIPELINES_VALIDATION_PACK,
      }
    : {};

const payload = {
  alert_type: alertType,
  repo: repository.split("/").pop() ?? repository,
  workflow: CI_PIPELINES_WORKFLOW || GITHUB_WORKFLOW || "GitHub Actions",
  status,
  title,
  description: CI_PIPELINES_DESCRIPTION || null,
  triggered_by_github_login: triggeredByGithubLogin,
  run_id: runId,
  run_number: GITHUB_RUN_NUMBER || null,
  run_attempt: runAttempt,
  run_url: `${GITHUB_SERVER_URL}/${repository}/actions/runs/${runId}`,
  sha: alertSha,
  branch: GITHUB_REF_NAME || null,
  environment: targetEnvironment || null,
  service: CI_PIPELINES_SERVICE || null,
  ...webE2EFields,
  ...releaseIdentityFields,
  ...contributorFields,
  ...releaseNotesFields,
};

const body = Buffer.from(JSON.stringify(payload));
const timestamp = Math.floor(Date.now() / 1000).toString();
const signature = crypto
  .createHmac("sha256", CI_PIPELINES_ALERT_SECRET)
  .update(`${timestamp}.`)
  .update(body)
  .digest("hex");

const headers = {
  "content-type": "application/json",
  "x-6529-ci-timestamp": timestamp,
  "x-6529-ci-signature": `sha256=${signature}`,
};

if (CI_PIPELINES_ALERT_API_AUTH) {
  headers["x-6529-auth"] = CI_PIPELINES_ALERT_API_AUTH;
}

const controller = new AbortController();
const timeoutId = setTimeout(
  () => controller.abort(),
  PIPELINES_ALERT_TIMEOUT_MS
);

let response;
let outcome = null;
try {
  response = await fetch(CI_PIPELINES_ALERT_URL, {
    method: "POST",
    headers,
    body,
    signal: controller.signal,
  });
  if (!response.ok) {
    console.error(
      `CI pipeline wave notification failed: ${response.status} ${response.statusText}`
    );
    process.exit(1);
  }
  try {
    outcome = await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    // Older receivers returned an empty response. Preserve rollout compatibility.
  }
} catch (error) {
  console.error(
    `CI pipeline wave notification request failed: ${getFetchFailureMessage(error)}`
  );
  process.exit(1);
} finally {
  clearTimeout(timeoutId);
}
if (outcome?.ci_drop === "accepted") {
  console.log("CI drop accepted.");
} else if (outcome?.ci_drop === "duplicate") {
  console.log("CI drop already accepted; duplicate notification skipped.");
} else if (outcome?.ci_drop === "failed") {
  console.error("CI drop processing failed after receiver acceptance.");
} else {
  console.log("CI pipeline wave notification accepted by receiver.");
}
if (outcome?.release_note === "enqueued") {
  console.log("Release-note request eligible and enqueued.");
} else if (outcome?.release_note === "queue-failed") {
  console.error(
    `Release-note queue failure: ${outcome.release_note_reason || "unknown"}`
  );
} else if (
  outcome?.release_note === "skipped" ||
  outcome?.release_note === "ineligible"
) {
  console.log(
    `Release-note request ${outcome.release_note}: ${outcome.release_note_reason || "unspecified"}`
  );
}
