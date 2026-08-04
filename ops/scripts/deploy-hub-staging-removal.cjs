const { normalizeManifest } = require("./deploy-hub-shadow.cjs");
const { removeRequest } = require("./deploy-hub-staging-composition.cjs");
const {
  assert,
  assertAuthority,
  validateRuntime,
} = require("./deploy-hub-operation-contracts.cjs");
const {
  composeContent,
  compositionAt,
  publishContent,
  publishStagingPresence,
  stagingMessage,
} = require("./deploy-hub-staging-content.cjs");
const {
  publishStatus,
  statusContext,
  stopRequested,
  validateWithRetry,
} = require("./deploy-hub-operation-workflows.cjs");

const STAGING_REF = "1a-staging";

async function restoreFailedRemoval(options) {
  const {
    github,
    git,
    request,
    requests,
    removal,
    removalSha,
    knownGoodSha,
    knownGoodComposition,
    operationId,
    runId,
    runAttempt,
    sleep,
    now,
  } = options;
  const observed = git.remoteSha(STAGING_REF);
  assert(
    observed === removalSha,
    "Staging changed after removal; refusing to overwrite concurrent changes."
  );
  const restoredSha = await publishContent({
    git,
    expectedOldSha: removalSha,
    contentSha: knownGoodSha,
    message: stagingMessage(
      `Deploy Hub ${operationId}: restore staging after failed removal`,
      knownGoodComposition
    ),
  });
  const restored = await validateWithRetry({
    github,
    sha: restoredSha,
    operationId,
    runId,
    runAttempt,
    cohortIndex: 0,
    phase: "remove-restore",
    sleep,
    now,
  });
  assert(
    restored.conclusion === "success",
    "Removal failed and prior staging could not be restored and verified."
  );
  await publishStatus(
    github,
    requests,
    removal.runUrl,
    removal.conclusion === "product" ? "failure" : "error",
    `Removal failed; restored staging at ${restoredSha.slice(0, 12)}`
  );
  await publishStagingPresence(
    github,
    request,
    restored.runUrl,
    "success",
    `Still in staging at ${restoredSha.slice(0, 12)}`
  );
  return { conclusion: "failure", requests, stagingSha: restoredSha };
}

async function executeRemoveFromStaging(options) {
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
  assert(options.confirmation === "REMOVE", "Live removal was not confirmed.");
  const requests = normalizeManifest(manifestJson, actor, repository);
  assert(requests.length === 1, "Removal requires exactly one frontend PR.");
  const [request] = requests;
  assert(request.target === "staging", "Only staging requests can be removed.");
  await assertAuthority(github, actor, requests);

  const currentStatuses = await github.getCombinedStatus(request.sha);
  const activeProduction = currentStatuses.statuses?.find(
    (status) => status.context === statusContext("production")
  );
  assert(
    activeProduction?.state !== "pending",
    `PR #${request.pr} has an active production operation.`
  );

  const pull = await github.getPullRequest(request.pr);
  assert(
    pull.base?.ref === baseRef,
    `PR #${request.pr} does not target ${baseRef}.`
  );
  assert(
    pull.merged !== true && !pull.merged_at,
    `PR #${request.pr} is already part of production.`
  );
  if (await stopRequested(github, requests, operationId)) {
    await publishStatus(
      github,
      requests,
      runUrl,
      "error",
      "Stopped before staging removal"
    );
    return { conclusion: "stopped", requests };
  }

  const knownGoodSha = git.remoteSha(STAGING_REF);
  git.fetchExact([knownGoodSha]);
  const knownGoodComposition = compositionAt(git, knownGoodSha, {
    required: true,
  });
  const staged = knownGoodComposition.requests.find(
    ({ pr }) => pr === request.pr
  );
  assert(staged, `PR #${request.pr} is not tracked in staging.`);
  assert(
    staged.sha === request.sha,
    `PR #${request.pr} staged SHA does not match the removal request.`
  );

  await publishStatus(
    github,
    requests,
    runUrl,
    "pending",
    "Removing exact PR from staging"
  );
  await publishStagingPresence(
    github,
    request,
    runUrl,
    "pending",
    "Removing from staging"
  );
  const candidateComposition = removeRequest(
    knownGoodComposition,
    request.pr
  );
  const contentSha = composeContent(
    git,
    candidateComposition,
    operationId,
    "remove"
  );
  const removalSha = await publishContent({
    git,
    expectedOldSha: knownGoodSha,
    contentSha,
    message: stagingMessage(
      `Deploy Hub ${operationId}: remove frontend PR #${request.pr} from staging`,
      candidateComposition
    ),
  });
  const removal = await validateWithRetry({
    github,
    sha: removalSha,
    operationId,
    runId,
    runAttempt,
    cohortIndex: 0,
    phase: "remove",
    sleep,
    now,
  });
  if (removal.conclusion !== "success") {
    return restoreFailedRemoval({
      github,
      git,
      request,
      requests,
      removal,
      removalSha,
      knownGoodSha,
      knownGoodComposition,
      operationId,
      runId,
      runAttempt,
      sleep,
      now,
    });
  }

  await publishStatus(
    github,
    requests,
    removal.runUrl,
    "success",
    `Removed from staging at ${removalSha.slice(0, 12)}`
  );
  await publishStagingPresence(
    github,
    request,
    removal.runUrl,
    "success",
    `Not in staging; validated at ${removalSha.slice(0, 12)}`
  );
  return { conclusion: "success", requests, stagingSha: removalSha };
}

module.exports = { executeRemoveFromStaging };
