const STAGING_REF = "1a-staging";
const POLL_MILLISECONDS = 10_000;
const WORKFLOW_TIMEOUT_MILLISECONDS = 110 * 60 * 1000;

function targetLabel(target) {
  return target === "production" ? "Production" : "Staging";
}

function statusContext(target) {
  return `Deploy Hub — Target: ${targetLabel(target)}`;
}

function stagingPresenceContext() {
  return "Deploy Hub — Staging Presence";
}

function stopContext(operationId) {
  return `Deploy Hub Stop — ${operationId}`;
}

function e2eContext(correlation) {
  return `Deploy Hub E2E — ${correlation}`;
}

function correlationId(_operationId, runIdentity, cohortIndex, phase, attempt) {
  return `dh-${runIdentity}-c${cohortIndex + 1}-${phase}-a${attempt}`;
}

async function publishStatus(github, requests, runUrl, state, description) {
  for (const request of requests) {
    await github.createCommitStatus(request.sha, {
      state,
      target_url: runUrl,
      description: description.slice(0, 140),
      context: statusContext(request.target),
    });
  }
}

async function stopRequested(github, requests, operationId) {
  for (const request of requests) {
    const combined = await github.getCombinedStatus(request.sha);
    const latest = combined.statuses?.find(
      (status) => status.context === stopContext(operationId)
    );
    if (latest?.state === "pending") return true;
  }
  return false;
}

async function waitForWorkflow({
  github,
  workflow,
  branch,
  displayTitle,
  expectedSha,
  sleep,
  now,
  notBefore = 0,
}) {
  const deadline = now() + WORKFLOW_TIMEOUT_MILLISECONDS;
  let run;
  while (now() < deadline) {
    const listing = await github.listWorkflowRuns(workflow, branch);
    run = listing.workflow_runs?.find(
      (candidate) =>
        candidate.display_title === displayTitle &&
        (!expectedSha || candidate.head_sha === expectedSha) &&
        Date.parse(candidate.created_at ?? "") >= notBefore
    );
    if (run?.status === "completed") return run;
    await sleep(POLL_MILLISECONDS);
  }
  throw new Error(`Timed out waiting for ${displayTitle}.`);
}

async function dispatchAndWait({
  github,
  workflow,
  ref,
  inputs,
  displayTitle,
  expectedSha,
  sleep,
  now,
}) {
  const notBefore = Math.floor(now() / 1000) * 1000;
  await github.dispatchWorkflow(workflow, ref, inputs);
  return waitForWorkflow({
    github,
    workflow,
    branch: ref,
    displayTitle,
    expectedSha,
    sleep,
    now,
    notBefore,
  });
}

function classifyE2eStatus(combined, correlation) {
  const status = combined.statuses?.find(
    (candidate) => candidate.context === e2eContext(correlation)
  );
  if (status?.state === "success") return "success";
  if (status?.state === "failure") return "product";
  return "infrastructure";
}

async function validateStagingSnapshot({
  github,
  sha,
  correlation,
  sleep,
  now,
}) {
  const deploy = await dispatchAndWait({
    github,
    workflow: "deploy-staging.yml",
    ref: STAGING_REF,
    inputs: { deploy_hub_operation_id: correlation },
    displayTitle: `Deploy Hub ${correlation} — staging`,
    expectedSha: sha,
    sleep,
    now,
  });
  if (deploy.conclusion !== "success") {
    return { conclusion: "infrastructure", runUrl: deploy.html_url };
  }
  const e2e = await dispatchAndWait({
    github,
    workflow: "staging-e2e.yml",
    ref: "main",
    inputs: {
      pack: "all",
      deploy_hub_operation_id: correlation,
      source_ref: STAGING_REF,
      expected_sha: sha,
    },
    displayTitle: `Staging E2E [${correlation}]`,
    sleep,
    now,
  });
  return {
    conclusion: classifyE2eStatus(
      await github.getCombinedStatus(sha),
      correlation
    ),
    runUrl: e2e.html_url,
  };
}

async function validateWithRetry(options) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const correlation = correlationId(
      options.operationId,
      `${options.runId}r${options.runAttempt}`,
      options.cohortIndex,
      options.phase,
      attempt
    );
    const result = await validateStagingSnapshot({
      github: options.github,
      sha: options.sha,
      correlation,
      sleep: options.sleep,
      now: options.now,
    });
    if (result.conclusion !== "infrastructure" || attempt === 2) {
      return { ...result, correlation };
    }
  }
  throw new Error("Unreachable staging retry state.");
}

module.exports = {
  classifyE2eStatus,
  correlationId,
  dispatchAndWait,
  e2eContext,
  publishStatus,
  statusContext,
  stagingPresenceContext,
  stopContext,
  stopRequested,
  targetLabel,
  validateWithRetry,
  waitForWorkflow,
};
