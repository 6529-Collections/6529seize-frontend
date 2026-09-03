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
  CI_RELEASE_NOTE_OPT_OUT,
  CI_RELEASE_GROUP_ID,
  CI_RELEASE_GROUP_SERVICES,
  CI_RELEASE_CONTRIBUTORS,
  CI_PIPELINES_SHA,
  CI_PIPELINES_PARENT_DEPLOY_RUN_ID,
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

function isContributorGithubLogin(value) {
  return (
    value.length <= 39 &&
    /^(?:[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38})(?:\[bot\])?$/.test(
      value
    )
  );
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
  const seen = new Set();
  for (const entry of parsed) {
    if (typeof entry !== "string" || !isContributorGithubLogin(entry.trim())) {
      throw new Error(
        "CI_RELEASE_CONTRIBUTORS contains an invalid GitHub login"
      );
    }
    const login = entry.trim();
    const key = login.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    contributors.push(login);
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
if (CI_PIPELINES_SHA && !/^[a-f0-9]{40}$/i.test(CI_PIPELINES_SHA)) {
  console.error("CI_PIPELINES_SHA must be a 40-character Git SHA");
  process.exit(1);
}
const alertSha = CI_PIPELINES_SHA
  ? CI_PIPELINES_SHA.toLowerCase()
  : alertType === "web_e2e"
    ? null
    : GITHUB_SHA || null;
const releaseNoteOptOut = CI_RELEASE_NOTE_OPT_OUT === "true";
if (
  CI_RELEASE_NOTE_OPT_OUT &&
  !["true", "false"].includes(CI_RELEASE_NOTE_OPT_OUT)
) {
  console.error("CI_RELEASE_NOTE_OPT_OUT must be true or false");
  process.exit(1);
}
const isReleaseNotesEligible =
  !releaseNoteOptOut &&
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
const contributorFields =
  releaseContributors.length > 0
    ? { contributor_github_logins: releaseContributors }
    : {};
const webE2EFields =
  alertType === "web_e2e"
    ? {
        parent_deploy_run_id: CI_PIPELINES_PARENT_DEPLOY_RUN_ID || null,
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
const timeoutId = setTimeout(() => controller.abort(), 10_000);

let response;
try {
  response = await fetch(CI_PIPELINES_ALERT_URL, {
    method: "POST",
    headers,
    body,
    signal: controller.signal,
  });
} catch (error) {
  console.error(
    `CI pipeline wave notification request failed: ${getFetchFailureMessage(error)}`
  );
  process.exit(1);
} finally {
  clearTimeout(timeoutId);
}

if (!response.ok) {
  console.error(
    `CI pipeline wave notification failed: ${response.status} ${response.statusText}`
  );
  process.exit(1);
}

console.log("CI pipeline wave notification sent.");
