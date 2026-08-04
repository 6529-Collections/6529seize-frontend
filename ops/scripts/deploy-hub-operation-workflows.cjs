const {
  assert,
  OPERATION_ID_PATTERN,
} = require("./deploy-hub-operation-contracts.cjs");

const STAGING_REF = "1a-staging";
const POLL_MILLISECONDS = 10_000;
const WORKFLOW_TIMEOUT_MILLISECONDS = 110 * 60 * 1000;
const QUEUED_REQUEST_CONTEXT = "Deploy Hub Request";
const QUEUED_REQUEST_PATTERN =
  /^Queued ([1-9]\d?)\/([1-9]\d?) for (Staging|Production) · ([A-Za-z0-9._-]+) · (\S+)$/;
const MAX_PENDING_REQUESTS = 100;

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

function latestMatchingStatus(statuses, predicate) {
  return [...(statuses ?? [])]
    .filter(predicate)
    .sort(
      (left, right) =>
        Date.parse(right.created_at ?? "") - Date.parse(left.created_at ?? "")
    )[0];
}

function queuedRequestDescription(
  target,
  operationId,
  requestIndex,
  requestCount,
  requestedAt
) {
  assert(OPERATION_ID_PATTERN.test(operationId), "Operation ID is invalid.");
  const description = `Queued ${requestIndex}/${requestCount} for ${targetLabel(target)} · ${operationId} · ${requestedAt}`;
  assert(description.length <= 140, "Queued request description is too long.");
  return description;
}

async function discoverQueuedRequests(github, repository, baseRef) {
  const queued = [];
  const pulls = await github.listOpenPullRequests(baseRef);
  for (const pull of pulls) {
    const sha = pull.head?.sha ?? "";
    const combined = await github.getCombinedStatus(sha);
    const status = latestMatchingStatus(
      combined.statuses,
      (candidate) => candidate.context === QUEUED_REQUEST_CONTEXT
    );
    const match = QUEUED_REQUEST_PATTERN.exec(status?.description ?? "");
    const requestIndex = Number(match?.[1]);
    const requestCount = Number(match?.[2]);
    const operationId = match?.[4] ?? "";
    const requestedAtIso = match?.[5] ?? "";
    const requestedAt = Date.parse(requestedAtIso);
    const statusCreatedAt = Date.parse(status?.created_at ?? "");
    const requester = status?.creator?.login ?? "";
    if (
      status?.state !== "pending" ||
      !match ||
      !OPERATION_ID_PATTERN.test(operationId) ||
      !Number.isInteger(pull.number) ||
      requestIndex > requestCount ||
      !Number.isFinite(requestedAt) ||
      !Number.isFinite(statusCreatedAt) ||
      new Date(requestedAt).toISOString() !== requestedAtIso ||
      !/^[A-Za-z0-9-]{1,39}$/.test(requester)
    ) {
      continue;
    }
    queued.push({
      operationId,
      requestIndex,
      statusCreatedAt,
      request: {
        repository,
        pr: pull.number,
        sha,
        target: match[3].toLowerCase(),
        requester,
        requested_at: requestedAtIso,
        source_operation_id: operationId,
      },
    });
  }
  queued.sort(
    (left, right) =>
      left.request.requested_at.localeCompare(right.request.requested_at) ||
      left.statusCreatedAt - right.statusCreatedAt ||
      left.operationId.localeCompare(right.operationId) ||
      left.requestIndex - right.requestIndex
  );
  return queued.map(({ request }) => request);
}

function mergeQueuedRequests(submitted, queued) {
  const ordered = [...submitted, ...queued]
    .map((request, index) => ({ index, request }))
    .sort(
      (left, right) =>
        left.request.requested_at.localeCompare(right.request.requested_at) ||
        left.index - right.index
    )
    .map(({ request }) => request);
  const byPull = new Map();
  for (const request of ordered) {
    byPull.delete(request.pr);
    byPull.set(request.pr, request);
  }
  const requests = [...byPull.values()];
  if (requests.length > MAX_PENDING_REQUESTS) {
    throw new Error("Deploy Hub has too many pending frontend requests.");
  }
  return requests;
}

async function claimQueuedRequests(github, requests, runUrl, runId) {
  for (const request of requests) {
    await github.createCommitStatus(request.sha, {
      state: "success",
      target_url: runUrl,
      description: `Claimed by Deploy Hub run ${runId}`,
      context: QUEUED_REQUEST_CONTEXT,
    });
  }
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

async function stopRequested(
  github,
  requests,
  operationId,
  { includeSourceOperations = true } = {}
) {
  for (const request of requests) {
    const combined = await github.getCombinedStatus(request.sha);
    const operationIds = new Set([operationId]);
    if (includeSourceOperations && request.source_operation_id) {
      operationIds.add(request.source_operation_id);
    }
    const latest = latestMatchingStatus(combined.statuses, (status) =>
      operationIds.has(
        status.context?.startsWith("Deploy Hub Stop — ")
          ? status.context.slice("Deploy Hub Stop — ".length)
          : ""
      )
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
  while (true) {
    const listing = await github.listWorkflowRuns(workflow, branch);
    run = listing.workflow_runs?.find(
      (candidate) =>
        candidate.display_title === displayTitle &&
        (!expectedSha || candidate.head_sha === expectedSha) &&
        Date.parse(candidate.created_at ?? "") >= notBefore
    );
    if (run?.status === "completed") return run;
    if (now() >= deadline) break;
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
  const notBefore = Math.floor(now() / 1000) * 1000 - 1000;
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
  const status = latestMatchingStatus(
    combined.statuses,
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
  claimQueuedRequests,
  classifyE2eStatus,
  correlationId,
  discoverQueuedRequests,
  dispatchAndWait,
  e2eContext,
  mergeQueuedRequests,
  publishStatus,
  QUEUED_REQUEST_CONTEXT,
  queuedRequestDescription,
  statusContext,
  stagingPresenceContext,
  stopContext,
  stopRequested,
  targetLabel,
  validateWithRetry,
  waitForWorkflow,
};
