const {
  normalizeManifest,
  partitionCohorts,
} = require("./deploy-hub-manifest.cjs");
const { addRequests } = require("./deploy-hub-staging-composition.cjs");
const {
  assert,
  assertExactPulls,
  assertRequestAuthorities,
  validateRuntime,
} = require("./deploy-hub-operation-contracts.cjs");
const {
  composeContent,
  compositionAt,
  publishContent,
  publishStagingPresence,
  STAGING_REF,
  stagingMessage,
} = require("./deploy-hub-staging-content.cjs");
const {
  claimQueuedRequests,
  discoverQueuedRequests,
  mergeQueuedRequests,
  publishStatus,
  stopRequested,
  targetLabel,
  validateWithRetry,
} = require("./deploy-hub-operation-workflows.cjs");

async function reconcileProductFailure(options) {
  const {
    github,
    git,
    cohort,
    knownGoodSha,
    knownGoodComposition,
    stagingSha,
    operationId,
    runId,
    runAttempt,
    cohortIndex,
    sleep,
    now,
  } = options;
  let safeSha = knownGoodSha;
  let safeComposition = knownGoodComposition;
  let safeCorrelation;
  const accepted = [];
  const rejected = [];
  let lastPublishedSha = stagingSha;

  async function restoreSafeContent(phase) {
    const stagingHead = git.remoteSha(STAGING_REF);
    assert(
      stagingHead === lastPublishedSha,
      "Staging changed during reconciliation; refusing to overwrite concurrent changes."
    );
    const restoredSha = await publishContent({
      git,
      expectedOldSha: lastPublishedSha,
      contentSha: safeSha,
      message: stagingMessage(
        `Deploy Hub ${operationId}: restore verified staging content`,
        safeComposition
      ),
    });
    lastPublishedSha = restoredSha;
    const restored = await validateWithRetry({
      github,
      sha: restoredSha,
      operationId,
      runId,
      runAttempt,
      cohortIndex,
      phase,
      sleep,
      now,
    });
    assert(
      restored.conclusion === "success",
      "Failed to restore and verify the prior staging content."
    );
    safeSha = restoredSha;
    safeCorrelation = restored.correlation;
  }

  for (const [requestIndex, request] of cohort.requests.entries()) {
    const candidateComposition = addRequests(safeComposition, [request]);
    const contentSha = composeContent(
      git,
      candidateComposition,
      operationId,
      "replay"
    );
    const stagingHead = git.remoteSha(STAGING_REF);
    assert(
      stagingHead === lastPublishedSha,
      "Staging changed during reconciliation; refusing to overwrite concurrent changes."
    );
    const replaySha = await publishContent({
      git,
      expectedOldSha: lastPublishedSha,
      contentSha,
      message: stagingMessage(
        `Deploy Hub ${operationId}: replay frontend PR #${request.pr}`,
        candidateComposition
      ),
    });
    lastPublishedSha = replaySha;
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
      await restoreSafeContent(`restore${requestIndex + 1}`);
      throw new Error("Staging replay infrastructure retries were exhausted.");
    }
    if (replay.conclusion === "success") {
      accepted.push(request);
      safeSha = replaySha;
      safeComposition = candidateComposition;
      safeCorrelation = replay.correlation;
    } else {
      rejected.push(request);
      await restoreSafeContent(`restore${requestIndex + 1}`);
    }
  }
  return {
    accepted,
    rejected,
    safeSha,
    correlation: safeCorrelation,
  };
}

async function dispatchProduction({
  github,
  operationId,
  requests,
  stagingSha,
  stagingCorrelation,
  parentRunId,
  baseRef,
}) {
  await github.dispatchWorkflow("deploy-hub-production.yml", baseRef, {
    operation_id: operationId,
    manifest: JSON.stringify(requests),
    staging_sha: stagingSha,
    staging_correlation: stagingCorrelation,
    parent_run_id: String(parentRunId),
  });
}

async function finishCohort(options) {
  const {
    github,
    accepted,
    operationId,
    runId,
    runUrl,
    safeSha,
    stagingCorrelation,
    baseRef,
  } = options;
  if (await stopRequested(github, accepted, operationId)) {
    await publishStatus(
      github,
      accepted,
      runUrl,
      "error",
      `Stopped safely at staging SHA ${safeSha.slice(0, 12)}`
    );
    return "stopped";
  }

  for (const request of accepted) {
    await publishStagingPresence(
      github,
      request,
      runUrl,
      "success",
      `In staging at ${safeSha.slice(0, 12)}`
    );
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
  if (production.length === 0) return "success";

  await publishStatus(
    github,
    production,
    runUrl,
    "pending",
    `Staging passed at ${safeSha.slice(0, 12)}; production queued`
  );
  if (await stopRequested(github, accepted, operationId)) {
    await publishStatus(
      github,
      production,
      runUrl,
      "error",
      `Stopped safely at staging SHA ${safeSha.slice(0, 12)}`
    );
    return "stopped";
  }
  await dispatchProduction({
    github,
    operationId,
    requests: production,
    stagingSha: safeSha,
    stagingCorrelation,
    parentRunId: runId,
    baseRef,
  });
  return "success";
}

async function processStagingCohort(options) {
  const {
    github,
    git,
    cohort,
    requests,
    operationId,
    runId,
    runAttempt,
    runUrl,
    baseRef,
    cohortIndex,
    sleep,
    now,
  } = options;
  await assertExactPulls(github, cohort.requests, baseRef);
  if (
    await stopRequested(github, requests, operationId, {
      includeSourceOperations: false,
    })
  ) {
    await publishStatus(
      github,
      cohort.requests,
      runUrl,
      "error",
      "Stopped before staging mutation"
    );
    return "stopped";
  }

  const activeRequests = [];
  for (const request of cohort.requests) {
    const stoppedBeforeClaim =
      request.source_operation_id &&
      (await stopRequested(github, [request], request.source_operation_id));
    if (stoppedBeforeClaim) {
      await publishStatus(
        github,
        [request],
        runUrl,
        "error",
        "Stopped before staging mutation"
      );
    } else {
      activeRequests.push(request);
    }
  }
  if (activeRequests.length === 0) return "success";
  const activeCohort = { ...cohort, requests: activeRequests };

  const knownGoodSha = git.remoteSha(STAGING_REF);
  git.fetchExact([knownGoodSha]);
  const knownGoodComposition = compositionAt(git, knownGoodSha);
  const candidateComposition = addRequests(
    knownGoodComposition,
    activeCohort.requests
  );
  const contentSha = composeContent(
    git,
    candidateComposition,
    operationId,
    "stage"
  );
  const stagingSha = await publishContent({
    git,
    expectedOldSha: knownGoodSha,
    contentSha,
    message: stagingMessage(
      `Deploy Hub ${operationId}: stage cohort ${cohortIndex + 1}`,
      candidateComposition
    ),
  });
  await publishStatus(
    github,
    activeCohort.requests,
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
      activeCohort.requests,
      validation.runUrl,
      "error",
      "Staging infrastructure retries exhausted; exact SHA retained"
    );
    return "failure";
  }

  let accepted = activeCohort.requests;
  let safeSha = stagingSha;
  let stagingCorrelation = validation.correlation;
  if (validation.conclusion === "product") {
    await publishStatus(
      github,
      activeCohort.requests,
      validation.runUrl,
      "pending",
      "Staging E2E failed; reconciling exact requests"
    );
    const reconciliation = await reconcileProductFailure({
      ...options,
      cohort: activeCohort,
      knownGoodSha,
      knownGoodComposition,
      stagingSha,
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
    for (const request of reconciliation.rejected) {
      await publishStagingPresence(
        github,
        request,
        runUrl,
        "success",
        `Not in staging; restored at ${safeSha.slice(0, 12)}`
      );
    }
  }
  return finishCohort({
    ...options,
    accepted,
    safeSha,
    stagingCorrelation,
  });
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
  const submittedRequests = normalizeManifest(manifestJson, actor, repository);
  const queuedRequests = await discoverQueuedRequests(
    github,
    repository,
    baseRef
  );
  const requests = mergeQueuedRequests(submittedRequests, queuedRequests);
  await assertRequestAuthorities(github, requests);
  await assertExactPulls(github, requests, baseRef);
  const cohorts = partitionCohorts(requests);

  await claimQueuedRequests(github, queuedRequests, runUrl, runId);

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
    let conclusion;
    try {
      conclusion = await processStagingCohort({
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
    } catch (error) {
      const unfinished = cohorts
        .slice(cohortIndex)
        .flatMap(({ requests: pending }) => pending);
      await publishStatus(
        github,
        unfinished,
        runUrl,
        "error",
        "Operation failed before every request reached a terminal result"
      ).catch(() => {});
      throw error;
    }
    if (conclusion !== "success") {
      const waiting = cohorts
        .slice(cohortIndex + 1)
        .flatMap(({ requests: pending }) => pending);
      await publishStatus(
        github,
        waiting,
        runUrl,
        "error",
        conclusion === "stopped"
          ? "Not started because an earlier cohort stopped"
          : "Not started because an earlier staging cohort failed"
      );
      return { conclusion, requests, cohorts };
    }
  }
  return { conclusion: "success", requests, cohorts };
}

module.exports = { executeStaging };
