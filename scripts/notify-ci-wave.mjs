#!/usr/bin/env node
import crypto from 'node:crypto';

const {
  CI_PIPELINES_WAVE_WEBHOOK_URL,
  CI_PIPELINES_WAVE_WEBHOOK_SECRET,
  CI_PIPELINES_WAVE_WEBHOOK_URL_STAGING,
  CI_PIPELINES_WAVE_WEBHOOK_SECRET_STAGING,
  CI_PIPELINES_WAVE_WEBHOOK_URL_PROD,
  CI_PIPELINES_WAVE_WEBHOOK_SECRET_PROD,
  CI_PIPELINES_TARGET_ENV,
  CI_PIPELINES_STATUS,
  CI_PIPELINES_TITLE,
  CI_PIPELINES_DESCRIPTION,
  CI_PIPELINES_ENVIRONMENT,
  CI_PIPELINES_SERVICE,
  CI_PIPELINES_WORKFLOW,
  GITHUB_REPOSITORY,
  GITHUB_WORKFLOW,
  GITHUB_RUN_ID,
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

function resolveWebhookConfig() {
  const targetEnv = (CI_PIPELINES_TARGET_ENV || CI_PIPELINES_ENVIRONMENT || '')
    .trim()
    .toLowerCase();
  if (targetEnv === 'prod' || targetEnv === 'production') {
    return {
      targetEnv,
      url: CI_PIPELINES_WAVE_WEBHOOK_URL_PROD,
      secret: CI_PIPELINES_WAVE_WEBHOOK_SECRET_PROD
    };
  }
  if (targetEnv === 'staging') {
    return {
      targetEnv,
      url: CI_PIPELINES_WAVE_WEBHOOK_URL_STAGING,
      secret: CI_PIPELINES_WAVE_WEBHOOK_SECRET_STAGING
    };
  }
  if (targetEnv) {
    return {
      targetEnv,
      unsupported: true
    };
  }
  return {
    targetEnv: 'default',
    url: CI_PIPELINES_WAVE_WEBHOOK_URL,
    secret: CI_PIPELINES_WAVE_WEBHOOK_SECRET
  };
}

const webhookConfig = resolveWebhookConfig();

if (webhookConfig.unsupported) {
  console.error(
    `Unsupported CI pipeline wave target environment: ${webhookConfig.targetEnv}`
  );
  process.exit(1);
}

if (!webhookConfig.url || !webhookConfig.secret) {
  console.log(
    `CI pipeline wave webhook is not configured for ${webhookConfig.targetEnv}; skipping.`
  );
  process.exit(0);
}

const repository = requireValue('GITHUB_REPOSITORY', GITHUB_REPOSITORY);
const runId = requireValue('GITHUB_RUN_ID', GITHUB_RUN_ID);
const status = requireValue('CI_PIPELINES_STATUS', CI_PIPELINES_STATUS);
const title = requireValue('CI_PIPELINES_TITLE', CI_PIPELINES_TITLE);
const targetEnvironment =
  CI_PIPELINES_TARGET_ENV || CI_PIPELINES_ENVIRONMENT || null;

const payload = {
  repo: repository.split('/').pop() ?? repository,
  workflow: CI_PIPELINES_WORKFLOW || GITHUB_WORKFLOW || 'GitHub Actions',
  status,
  title,
  description: CI_PIPELINES_DESCRIPTION || null,
  run_id: runId,
  run_url: `${GITHUB_SERVER_URL}/${repository}/actions/runs/${runId}`,
  sha: GITHUB_SHA || null,
  branch: GITHUB_REF_NAME || null,
  environment: targetEnvironment,
  service: CI_PIPELINES_SERVICE || null
};

const body = Buffer.from(JSON.stringify(payload));
const timestamp = Math.floor(Date.now() / 1000).toString();
const signature = crypto
  .createHmac('sha256', webhookConfig.secret)
  .update(`${timestamp}.`)
  .update(body)
  .digest('hex');

const response = await fetch(webhookConfig.url, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-6529-ci-timestamp': timestamp,
    'x-6529-ci-signature': `sha256=${signature}`
  },
  body
});

if (!response.ok) {
  console.error(
    `CI pipeline wave notification failed: ${response.status} ${response.statusText}`
  );
  process.exit(1);
}

console.log('CI pipeline wave notification sent.');
