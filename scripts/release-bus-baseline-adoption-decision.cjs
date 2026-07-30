"use strict";

const SHA_PATTERN = /^[a-f0-9]{40}$/;
const RUN_ID_PATTERN = /^[1-9]\d{0,19}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function required(environment, key) {
  const value = environment[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing ${key}`);
  }
  return value;
}

function exactEnvironment(environment) {
  const apiUrl = new URL(required(environment, "RELEASE_BUS_API_URL"));
  if (
    apiUrl.protocol !== "https:" &&
    !["127.0.0.1", "localhost"].includes(apiUrl.hostname)
  ) {
    throw new Error("Release Bus API URL must use HTTPS");
  }
  const e2eWorkflowRunId = required(environment, "GITHUB_RUN_ID");
  const deployWorkflowRunId = required(environment, "DEPLOY_WORKFLOW_RUN_ID");
  const deployedRef = required(environment, "DEPLOYED_REF");
  const deployedSha = required(environment, "DEPLOYED_SHA").toLowerCase();
  if (
    !RUN_ID_PATTERN.test(e2eWorkflowRunId) ||
    !RUN_ID_PATTERN.test(deployWorkflowRunId) ||
    deployedRef !== "1a-staging" ||
    !SHA_PATTERN.test(deployedSha)
  ) {
    throw new Error("Automatic staging deployment identity is malformed");
  }
  return {
    apiUrl,
    token: required(environment, "RELEASE_BUS_WORKFLOW_AUTH_TOKEN"),
    body: {
      e2e_workflow_run_id: e2eWorkflowRunId,
      deploy_workflow_run_id: deployWorkflowRunId,
      deployed_ref: deployedRef,
      deployed_sha: deployedSha,
    },
  };
}

function exactDecision(value, now = Date.now()) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Baseline-adoption decision response is not an object");
  }
  if (
    value.decision === "LEGACY" &&
    value.adoption_id === null &&
    value.operation_key === null &&
    value.expires_at === null
  ) {
    return { decision: "LEGACY", manifestReady: false };
  }
  if (
    value.decision === "DEFERRED" &&
    typeof value.adoption_id === "string" &&
    UUID_PATTERN.test(value.adoption_id) &&
    value.operation_key ===
      `rb2:${value.adoption_id}:baseline-adoption-e2e:staging:a1` &&
    Number.isSafeInteger(value.expires_at) &&
    value.expires_at > now &&
    typeof value.manifest_ready === "boolean"
  ) {
    return {
      decision: "DEFERRED",
      manifestReady: value.manifest_ready,
    };
  }
  throw new Error("Baseline-adoption decision response is malformed");
}

async function decide(environment, fetchImpl = fetch, now = Date.now()) {
  const identity = exactEnvironment(environment);
  const endpoint = new URL(
    "/deploy/release-bus-v2/maintenance/adopt-exact-staging-baseline/automatic-e2e-decision",
    identity.apiUrl
  );
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${identity.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(identity.body),
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(
      `Baseline-adoption decision failed closed with HTTP ${response.status}`
    );
  }
  const decision = exactDecision(await response.json(), now);
  return decision;
}

function formatDecisionToken({ decision, manifestReady }) {
  return `${decision}:${manifestReady}\n`;
}

if (require.main === module) {
  decide(process.env)
    .then(({ decision, manifestReady }) => {
      process.stdout.write(formatDecisionToken({ decision, manifestReady }));
    })
    .catch((error) => {
      process.stderr.write(
        `${error instanceof Error ? error.message : "Decision failed closed"}\n`
      );
      process.exitCode = 1;
    });
}

module.exports = {
  decide,
  exactDecision,
  formatDecisionToken,
};
