#!/usr/bin/env node

const {
  EXPECTED_REPOSITORY,
  normalizeManifest,
  partitionCohorts,
} = require("./deploy-hub-shadow.cjs");
const {
  createGitClient,
  createGithubClient,
} = require("./deploy-hub-operation-clients.cjs");
const {
  classifyE2eStatus,
  correlationId,
  dispatchAndWait,
  e2eContext,
  publishStatus,
  statusContext,
  stopContext,
  stopRequested,
  targetLabel,
  validateWithRetry,
  waitForWorkflow,
} = require("./deploy-hub-operation-workflows.cjs");

const STAGING_REF = "1a-staging";
const OPERATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/;
const RUN_URL_PATTERN =
  /^https:\/\/github\.com\/6529-Collections\/6529seize-frontend\/actions\/runs\/[1-9]\d*$/;
const SHA_PATTERN = /^[a-f0-9]{40}$/;
const WRITE_PERMISSIONS = new Set(["admin", "maintain", "write"]);
const PRODUCTION_PERMISSIONS = new Set(["admin", "maintain"]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateRuntime({ operationId, repository, runUrl, baseRef }) {
  assert(repository === EXPECTED_REPOSITORY, "Repository is not supported.");
  assert(
    OPERATION_ID_PATTERN.test(operationId),
    "Operation ID has an invalid format."
  );
  assert(RUN_URL_PATTERN.test(runUrl), "Run URL has an invalid format.");
  assert(
    typeof baseRef === "string" && /^[A-Za-z0-9._/-]{1,255}$/.test(baseRef),
    "Default branch has an invalid format."
  );
}

async function assertAuthority(github, actor, requests) {
  const result = await github.getCollaboratorPermission(actor);
  const permission = result.permission ?? result.user?.permissions;
  assert(
    WRITE_PERMISSIONS.has(permission),
    "Requester does not have frontend write authority."
  );
  if (requests.some((request) => request.target === "production")) {
    assert(
      PRODUCTION_PERMISSIONS.has(permission),
      "Production requires maintain or admin authority."
    );
  }
}

async function assertExactPulls(github, requests, baseRef) {
  for (const request of requests) {
    const pull = await github.getPullRequest(request.pr);
    assert(pull.state === "open", `PR #${request.pr} is not open.`);
    assert(
      pull.base?.ref === baseRef,
      `PR #${request.pr} does not target ${baseRef}.`
    );
    assert(pull.head?.sha === request.sha, `PR #${request.pr} head moved.`);
    assert(pull.mergeable !== false, `PR #${request.pr} is not mergeable.`);
  }
}

async function publishContent({ git, expectedOldSha, contentSha, message }) {
  const nextSha = git.forwardContent(expectedOldSha, contentSha, message);
  git.pushStaging(expectedOldSha, nextSha);
  return nextSha;
}

async function reconcileProductFailure(options) {
  const {
    github,
    git,
    cohort,
    knownGoodSha,
    operationId,
    runId,
    runAttempt,
    cohortIndex,
    sleep,
    now,
  } = options;
  let stagingHead = git.remoteSha(STAGING_REF);

  if (cohort.requests.length === 1) {
    const restoredSha = await publishContent({
      git,
      expectedOldSha: stagingHead,
      contentSha: knownGoodSha,
      message: `Deploy Hub ${operationId}: restore verified staging content`,
    });
    const restored = await validateWithRetry({
      github,
      sha: restoredSha,
      operationId,
      runId,
      runAttempt,
      cohortIndex,
      phase: "restore",
      sleep,
      now,
    });
    assert(
      restored.conclusion === "success",
      "Failed to restore and verify the prior staging content."
    );
    return { accepted: [], rejected: cohort.requests, safeSha: restoredSha };
  }

  const rejected = [];
  for (const [requestIndex, request] of cohort.requests.entries()) {
    git.fetchExact([knownGoodSha, request.sha]);
    const contentSha = git.mergeContent(
      knownGoodSha,
      [request],
      `Deploy Hub ${operationId} replay`
    );
    stagingHead = git.remoteSha(STAGING_REF);
    const replaySha = await publishContent({
      git,
      expectedOldSha: stagingHead,
      contentSha,
      message: `Deploy Hub ${operationId}: replay frontend PR #${request.pr}`,
    });
    const replay = await validateWithRetry({
      github,
      sha: replaySha,
      operationId,
      runId,
      runAttempt,
      cohortIndex,
      phase: `replay${requestIndex + 1}`,
      sleep,
      now,
    });
    if (replay.conclusion === "infrastructure") {
      throw new Error("Staging replay infrastructure retries were exhausted.");
    }
    if (replay.conclusion === "success") {
      return {
        accepted: [request],
        rejected: [...rejected, ...cohort.requests.slice(requestIndex + 1)],
        safeSha: replaySha,
        correlation: replay.correlation,
      };
    }
    rejected.push(request);
  }

  stagingHead = git.remoteSha(STAGING_REF);
  const restoredSha = await publishContent({
    git,
    expectedOldSha: stagingHead,
    contentSha: knownGoodSha,
    message: `Deploy Hub ${operationId}: restore verified staging content`,
  });
  const restored = await validateWithRetry({
    github,
    sha: restoredSha,
    operationId,
    runId,
    runAttempt,
    cohortIndex,
    phase: "restore",
    sleep,
    now,
  });
  assert(
    restored.conclusion === "success",
    "Failed to restore and verify the prior staging content."
  );
  return { accepted: [], rejected, safeSha: restoredSha };
}

async function dispatchProduction({
  github,
  operationId,
  cohort,
  requester,
  stagingSha,
  stagingCorrelation,
  parentRunId,
}) {
  await github.dispatchWorkflow("deploy-hub-production.yml", "main", {
    operation_id: operationId,
    manifest: JSON.stringify(cohort.requests),
    requester,
    staging_sha: stagingSha,
    staging_correlation: stagingCorrelation,
    parent_run_id: String(parentRunId),
  });
}

async function processStagingCohort({
  github,
  git,
  cohort,
  requests,
  operationId,
  actor,
  runId,
  runAttempt,
  runUrl,
  baseRef,
  cohortIndex,
  sleep,
  now,
}) {
  await assertExactPulls(github, cohort.requests, baseRef);
  if (await stopRequested(github, requests, operationId)) {
    await publishStatus(
      github,
      cohort.requests,
      runUrl,
      "error",
      "Stopped before staging mutation"
    );
    return "stopped";
  }

  const knownGoodSha = git.remoteSha(STAGING_REF);
  git.fetchExact([knownGoodSha, ...cohort.requests.map(({ sha }) => sha)]);
  const contentSha = git.mergeContent(
    knownGoodSha,
    cohort.requests,
    `Deploy Hub ${operationId}`
  );
  const stagingSha = await publishContent({
    git,
    expectedOldSha: knownGoodSha,
    contentSha,
    message: `Deploy Hub ${operationId}: stage cohort ${cohortIndex + 1}`,
  });
  await publishStatus(
    github,
    cohort.requests,
    runUrl,
    "pending",
    `Deploying staging SHA ${stagingSha.slice(0, 12)}`
  );

  const validation = await validateWithRetry({
    github,
    sha: stagingSha,
    operationId,
    runId,
    runAttempt,
    cohortIndex,
    phase: "staging",
    sleep,
    now,
  });
  if (validation.conclusion === "infrastructure") {
    await publishStatus(
      github,
      cohort.requests,
      validation.runUrl,
      "error",
      "Staging infrastructure retries exhausted; exact SHA retained"
    );
    return "failure";
  }

  let accepted = cohort.requests;
  let safeSha = stagingSha;
  let stagingCorrelation = validation.correlation;
  if (validation.conclusion === "product") {
    await publishStatus(
      github,
      cohort.requests,
      validation.runUrl,
      "pending",
      "Staging E2E failed; reconciling exact requests"
    );
    const reconciliation = await reconcileProductFailure({
      github,
      git,
      cohort,
      knownGoodSha,
      operationId,
      runId,
      runAttempt,
      cohortIndex,
      sleep,
      now,
    });
    accepted = reconciliation.accepted;
    safeSha = reconciliation.safeSha;
    stagingCorrelation = reconciliation.correlation ?? validation.correlation;
    await publishStatus(
      github,
      reconciliation.rejected,
      runUrl,
      "failure",
      "Rejected after bounded staging replay"
    );
  }

  if (await stopRequested(github, requests, operationId)) {
    await publishStatus(
      github,
      accepted,
      runUrl,
      "error",
      `Stopped safely at staging SHA ${safeSha.slice(0, 12)}`
    );
    return "stopped";
  }

  const stagingOnly = accepted.filter(({ target }) => target === "staging");
  const production = accepted.filter(({ target }) => target === "production");
  await publishStatus(
    github,
    stagingOnly,
    runUrl,
    "success",
    `Staging validated at ${safeSha.slice(0, 12)}`
  );
  if (production.length > 0) {
    await publishStatus(
      github,
      production,
      runUrl,
      "pending",
      `Staging passed at ${safeSha.slice(0, 12)}; production queued`
    );
    await dispatchProduction({
      github,
      operationId,
      cohort: { target: "production", requests: production },
      requester: actor,
      stagingSha: safeSha,
      stagingCorrelation,
      parentRunId: runId,
    });
  }
  return "success";
}

async function executeStaging(options) {
  const {
    operationId,
    manifestJson,
    repository,
    baseRef,
    actor,
    runId,
    runAttempt = "1",
    runUrl,
    github,
    git,
    sleep = (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds)),
    now = Date.now,
  } = options;
  validateRuntime({ operationId, repository, runUrl, baseRef });
  assert(
    options.confirmation === "DEPLOY",
    "Live deployment was not confirmed."
  );
  const requests = normalizeManifest(manifestJson, actor, repository);
  await assertAuthority(github, actor, requests);
  await assertExactPulls(github, requests, baseRef);
  const cohorts = partitionCohorts(requests);

  for (const request of requests) {
    await publishStatus(
      github,
      [request],
      runUrl,
      "pending",
      `Queued exact ${request.sha.slice(0, 12)} for ${targetLabel(request.target)}`
    );
  }

  for (const [cohortIndex, cohort] of cohorts.entries()) {
    const conclusion = await processStagingCohort({
      github,
      git,
      cohort,
      requests,
      operationId,
      actor,
      runId,
      runAttempt,
      runUrl,
      baseRef,
      cohortIndex,
      sleep,
      now,
    });
    if (conclusion !== "success") {
      return { conclusion, requests, cohorts };
    }
  }

  return { conclusion: "success", requests, cohorts };
}

async function assertProductionOrigin({
  github,
  parentRunId,
  stagingSha,
  stagingCorrelation,
}) {
  assert(/^[1-9]\d*$/.test(String(parentRunId)), "Parent run ID is invalid.");
  assert(SHA_PATTERN.test(stagingSha), "Staging SHA is invalid.");
  const parent = await github.getWorkflowRun(parentRunId);
  assert(
    parent.path === ".github/workflows/deploy-hub.yml" &&
      parent.event === "workflow_dispatch",
    "Production continuation did not originate from Deploy Hub."
  );
  const combined = await github.getCombinedStatus(stagingSha);
  assert(
    classifyE2eStatus(combined, stagingCorrelation) === "success",
    "Exact passing staging E2E evidence is unavailable."
  );
}

async function mergeProductionRequests({
  github,
  requests,
  operationId,
  baseRef,
  runUrl,
}) {
  let mainSha = (await github.getRef(baseRef)).object?.sha;
  assert(SHA_PATTERN.test(mainSha ?? ""), "Current main SHA is unavailable.");
  for (const request of requests) {
    const merged = await github.mergePullRequest(
      request.pr,
      request.sha,
      operationId
    );
    if (!merged.merged || !SHA_PATTERN.test(merged.sha ?? "")) {
      await publishStatus(
        github,
        requests,
        runUrl,
        "error",
        `Production stopped; main is ${mainSha.slice(0, 12)}`
      );
      return { conclusion: "failure", mainSha };
    }
    mainSha = merged.sha;
  }
  const observedMain = (await github.getRef(baseRef)).object?.sha;
  assert(
    observedMain === mainSha,
    "Main moved after the exact production merges."
  );
  return { conclusion: "success", mainSha };
}

async function validateProductionDeployment({
  github,
  requests,
  operationId,
  runId,
  runAttempt,
  runUrl,
  baseRef,
  mainSha,
  sleep,
  now,
}) {
  let finalResult;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const correlation = correlationId(
      operationId,
      `${runId}r${runAttempt}`,
      0,
      "production",
      attempt
    );
    await publishStatus(
      github,
      requests,
      runUrl,
      "pending",
      `Deploying production SHA ${mainSha.slice(0, 12)}`
    );
    const deploy = await dispatchAndWait({
      github,
      workflow: "build-upload-deploy-prod.yml",
      ref: baseRef,
      inputs: { deploy_hub_operation_id: correlation },
      displayTitle: `Deploy Hub ${correlation} — production`,
      expectedSha: mainSha,
      sleep,
      now,
    });
    finalResult = { conclusion: "infrastructure", runUrl: deploy.html_url };
    if (deploy.conclusion === "success") {
      const e2e = await dispatchAndWait({
        github,
        workflow: "production-e2e.yml",
        ref: baseRef,
        inputs: {
          deploy_hub_operation_id: correlation,
          source_ref: baseRef,
          expected_sha: mainSha,
        },
        displayTitle: `Production E2E [${correlation}]`,
        sleep,
        now,
      });
      finalResult = {
        conclusion: classifyE2eStatus(
          await github.getCombinedStatus(mainSha),
          correlation
        ),
        runUrl: e2e.html_url,
      };
    }
    if (finalResult.conclusion !== "infrastructure" || attempt === 2) break;
  }
  return finalResult;
}

function productionResultPresentation(conclusion, mainSha) {
  if (conclusion === "success") {
    return {
      state: "success",
      description: `Production validated at ${mainSha.slice(0, 12)}`,
    };
  }
  if (conclusion === "product") {
    return {
      state: "failure",
      description: `Production E2E failed at ${mainSha.slice(0, 12)}; no automatic rollback`,
    };
  }
  return {
    state: "error",
    description: `Production infrastructure retries exhausted at ${mainSha.slice(0, 12)}`,
  };
}

async function executeProduction(options) {
  const {
    operationId,
    manifestJson,
    repository,
    baseRef,
    requester,
    runId,
    runAttempt = "1",
    runUrl,
    github,
    sleep = (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds)),
    now = Date.now,
  } = options;
  validateRuntime({ operationId, repository, runUrl, baseRef });
  assert(
    options.actor === "github-actions[bot]",
    "Production dispatch is not trusted."
  );
  const requests = normalizeManifest(manifestJson, requester, repository);
  assert(
    requests.every(({ target }) => target === "production"),
    "Production continuation contains a staging-only request."
  );
  await assertProductionOrigin({
    github,
    parentRunId: options.parentRunId,
    stagingSha: options.stagingSha,
    stagingCorrelation: options.stagingCorrelation,
  });
  await assertAuthority(github, requester, requests);
  await assertExactPulls(github, requests, baseRef);
  if (await stopRequested(github, requests, operationId)) {
    await publishStatus(
      github,
      requests,
      runUrl,
      "error",
      "Stopped before main mutation"
    );
    return { conclusion: "stopped", requests };
  }

  await publishStatus(
    github,
    requests,
    runUrl,
    "pending",
    "Staging passed; merging exact PR heads to main"
  );
  const merge = await mergeProductionRequests({
    github,
    requests,
    operationId,
    baseRef,
    runUrl,
  });
  const { mainSha } = merge;
  if (merge.conclusion !== "success") {
    return { conclusion: "failure", requests, mainSha };
  }
  if (await stopRequested(github, requests, operationId)) {
    await publishStatus(
      github,
      requests,
      runUrl,
      "error",
      `Stopped after main mutation at ${mainSha.slice(0, 12)}; production not started`
    );
    return { conclusion: "stopped", requests, mainSha };
  }
  const finalResult = await validateProductionDeployment({
    github,
    requests,
    operationId,
    runId,
    runAttempt,
    runUrl,
    baseRef,
    mainSha,
    sleep,
    now,
  });
  if (await stopRequested(github, requests, operationId)) {
    await publishStatus(
      github,
      requests,
      finalResult.runUrl,
      "error",
      `Stopped after production settled at ${mainSha.slice(0, 12)}`
    );
    return { conclusion: "stopped", requests, mainSha };
  }
  const presentation = productionResultPresentation(
    finalResult.conclusion,
    mainSha
  );
  await publishStatus(
    github,
    requests,
    finalResult.runUrl,
    presentation.state,
    presentation.description
  );
  return {
    conclusion: finalResult.conclusion === "success" ? "success" : "failure",
    requests,
    mainSha,
  };
}

function createSummary(result, mode, runUrl) {
  const label = mode === "production" ? "Production" : "Operation";
  const requests = result.requests.map(({ pr }) => `#${pr}`).join(", ");
  return [
    `# Deploy Hub FE ${label}`,
    "",
    `- Conclusion: \`${result.conclusion}\``,
    `- Requests: ${requests}`,
    `- Authoritative run: ${runUrl}`,
    "",
  ].join("\n");
}

function createFailureSummary(reason) {
  return [
    "# Deploy Hub FE Operation",
    "",
    "- Conclusion: `failure`",
    `- Reason: ${reason}`,
    "",
  ].join("\n");
}

async function main() {
  const token = process.env.GITHUB_TOKEN ?? "";
  assert(token.length > 0, "GitHub token is unavailable.");
  const repository = process.env.DEPLOY_HUB_REPOSITORY ?? "";
  const mode = process.env.DEPLOY_HUB_MODE ?? "staging";
  const github = createGithubClient({
    apiUrl: process.env.DEPLOY_HUB_API_URL ?? "https://api.github.com",
    repository,
    token,
  });
  const common = {
    operationId: process.env.DEPLOY_HUB_OPERATION_ID ?? "",
    manifestJson: process.env.DEPLOY_HUB_MANIFEST ?? "",
    repository,
    baseRef: process.env.DEPLOY_HUB_BASE_REF ?? "",
    actor: process.env.DEPLOY_HUB_ACTOR ?? "",
    runId: process.env.DEPLOY_HUB_RUN_ID ?? "",
    runAttempt: process.env.DEPLOY_HUB_RUN_ATTEMPT ?? "1",
    runUrl: process.env.DEPLOY_HUB_RUN_URL ?? "",
    github,
  };
  const result =
    mode === "production"
      ? await executeProduction({
          ...common,
          requester: process.env.DEPLOY_HUB_REQUESTER ?? "",
          parentRunId: process.env.DEPLOY_HUB_PARENT_RUN_ID ?? "",
          stagingSha: process.env.DEPLOY_HUB_STAGING_SHA ?? "",
          stagingCorrelation: process.env.DEPLOY_HUB_STAGING_CORRELATION ?? "",
        })
      : await executeStaging({
          ...common,
          confirmation: process.env.DEPLOY_HUB_CONFIRMATION ?? "",
          git: createGitClient(),
        });
  process.stdout.write(createSummary(result, mode, common.runUrl));
  if (!new Set(["success", "stopped"]).has(result.conclusion)) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  void (async () => {
    try {
      await main();
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Unexpected failure.";
      process.stdout.write(createFailureSummary(reason));
      console.error(`Deploy Hub operation failed: ${reason}`);
      process.exitCode = 1;
    }
  })();
}

module.exports = {
  classifyE2eStatus,
  correlationId,
  createFailureSummary,
  createGitClient,
  createGithubClient,
  createSummary,
  dispatchAndWait,
  e2eContext,
  executeProduction,
  executeStaging,
  statusContext,
  stopContext,
  validateRuntime,
  waitForWorkflow,
};
