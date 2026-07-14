#!/usr/bin/env node
import crypto from 'node:crypto';

const {
  CI_PIPELINES_ALERT_URL,
  CI_PIPELINES_ALERT_SECRET,
  CI_PIPELINES_ALERT_API_AUTH,
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
  GITHUB_REPOSITORY,
  GITHUB_WORKFLOW,
  GITHUB_RUN_ID,
  GITHUB_RUN_NUMBER,
  GITHUB_SERVER_URL = 'https://github.com',
  GITHUB_SHA,
  GITHUB_REF_NAME
} = process.env;

function requireValue(name, value) {
  if (!value) {
    console.error(`${name} is required`);
    process.exit(1);
  }
  return value;
}

function normalizeTargetEnvironment(value) {
  const targetEnv = (value || '')
    .trim()
    .toLowerCase();
  if (!targetEnv) {
    return null;
  }
  if (targetEnv === 'staging') {
    return 'staging';
  }
  if (targetEnv === 'prod' || targetEnv === 'production') {
    return 'prod';
  }
  return `unsupported:${targetEnv}`;
}

function getFetchFailureMessage(error) {
  if (error instanceof Error) {
    return error.name === 'AbortError'
      ? 'request timed out'
      : error.message;
  }
  return 'unknown request error';
}

const targetEnvironment = normalizeTargetEnvironment(
  CI_PIPELINES_TARGET_ENV || CI_PIPELINES_ENVIRONMENT
);

if (targetEnvironment?.startsWith('unsupported:')) {
  console.error(
    `Unsupported CI pipeline alert target environment: ${targetEnvironment.slice(12)}`
  );
  process.exit(1);
}

if (!CI_PIPELINES_ALERT_URL || !CI_PIPELINES_ALERT_SECRET) {
  console.log('CI pipeline alert receiver is not configured; skipping.');
  process.exit(0);
}

const repository = requireValue('GITHUB_REPOSITORY', GITHUB_REPOSITORY);
const runId = requireValue('GITHUB_RUN_ID', GITHUB_RUN_ID);
const status = requireValue('CI_PIPELINES_STATUS', CI_PIPELINES_STATUS);
const title = requireValue('CI_PIPELINES_TITLE', CI_PIPELINES_TITLE);
const isReleaseNotesEligible =
  status === 'success' &&
  targetEnvironment === 'prod' &&
  Boolean(CI_RELEASE_NOTES_PROMPT_PATH);
const releaseGroupServices = (
  CI_RELEASE_GROUP_SERVICES ||
  CI_PIPELINES_SERVICE ||
  ''
)
  .split(',')
  .map((service) => service.trim())
  .filter(Boolean);
const releaseNotesFields = isReleaseNotesEligible
  ? {
      release_notes_prompt_path: CI_RELEASE_NOTES_PROMPT_PATH,
      release_group_id: CI_RELEASE_GROUP_ID || `${repository}:${runId}`,
      release_group_services: releaseGroupServices,
      deployed_at: new Date().toISOString()
    }
  : {};

const payload = {
  repo: repository.split('/').pop() ?? repository,
  workflow: CI_PIPELINES_WORKFLOW || GITHUB_WORKFLOW || 'GitHub Actions',
  status,
  title,
  description: CI_PIPELINES_DESCRIPTION || null,
  run_id: runId,
  run_number: GITHUB_RUN_NUMBER || null,
  run_url: `${GITHUB_SERVER_URL}/${repository}/actions/runs/${runId}`,
  sha: GITHUB_SHA || null,
  branch: GITHUB_REF_NAME || null,
  environment: targetEnvironment || null,
  service: CI_PIPELINES_SERVICE || null,
  ...releaseNotesFields
};

const body = Buffer.from(JSON.stringify(payload));
const timestamp = Math.floor(Date.now() / 1000).toString();
const signature = crypto
  .createHmac('sha256', CI_PIPELINES_ALERT_SECRET)
  .update(`${timestamp}.`)
  .update(body)
  .digest('hex');

const headers = {
  'content-type': 'application/json',
  'x-6529-ci-timestamp': timestamp,
  'x-6529-ci-signature': `sha256=${signature}`
};

if (CI_PIPELINES_ALERT_API_AUTH) {
  headers['x-6529-auth'] = CI_PIPELINES_ALERT_API_AUTH;
}

const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10_000);

let response;
try {
  response = await fetch(CI_PIPELINES_ALERT_URL, {
    method: 'POST',
    headers,
    body,
    signal: controller.signal
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

console.log('CI pipeline wave notification sent.');
