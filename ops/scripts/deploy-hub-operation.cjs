#!/usr/bin/env node

const {
  EXPECTED_REPOSITORY,
  normalizeTrustedManifest,
} = require("./deploy-hub-shadow.cjs");
const {
  createGitClient,
  createGithubClient,
} = require("./deploy-hub-operation-clients.cjs");
const {
  assert,
  assertProductionPreflight,
  assertRequestAuthorities,
  validateRuntime,
} = require("./deploy-hub-operation-contracts.cjs");
const {
  classifyE2eStatus,
  correlationId,
  dispatchAndWait,
  e2eContext,
  publishStatus,
  statusContext,
  stopContext,
  stopRequested,
  waitForWorkflow,
} = require("./deploy-hub-operation-workflows.cjs");
const { executeStaging } = require("./deploy-hub-staging-deploy.cjs");
const {
  executeRemoveFromStaging,
} = require("./deploy-hub-staging-removal.cjs");

const SHA_PATTERN = /^[a-f0-9]{40}$/;

async function assertProductionOrigin({
  github,
  parentRunId,
  stagingSha,
  stagingCorrelation,
  baseRef,
}) {
  assert(/^[1-9]\d*$/.test(String(parentRunId)), "Parent run ID is invalid.");
  assert(SHA_PATTERN.test(stagingSha), "Staging SHA is invalid.");
  const parent = await github.getWorkflowRun(parentRunId);
  assert(
    parent.path === ".github/workflows/deploy-hub.yml" &&
      parent.event === "workflow_dispatch" &&
      parent.head_branch === baseRef &&
      parent.head_repository?.full_name === EXPECTED_REPOSITORY,
    "Production continuation did not originate from Deploy Hub."
  );
  const correlation =
    /^dh-([1-9]\d*)r[1-9]\d*-c[1-9]\d*-[a-z0-9-]{1,32}-a[12]$/.exec(
      stagingCorrelation
    );
  assert(
    correlation?.[1] === String(parentRunId),
    "Staging evidence is not bound to the parent Deploy Hub run."
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
  expectedMainSha,
}) {
  let mainSha = (await github.getRef(baseRef)).object?.sha;
  assert(mainSha === expectedMainSha, "Main moved after production preflight.");
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
    if (await stopRequested(github, requests, operationId)) {
      return { conclusion: "stopped", runUrl };
    }
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
  const requests = normalizeTrustedManifest(manifestJson, repository);
  assert(
    requests.every(({ target }) => target === "production"),
    "Production continuation contains a staging-only request."
  );
  await assertProductionOrigin({
    github,
    parentRunId: options.parentRunId,
    stagingSha: options.stagingSha,
    stagingCorrelation: options.stagingCorrelation,
    baseRef,
  });
  await assertRequestAuthorities(github, requests);
  const expectedMainSha = await assertProductionPreflight(
    github,
    requests,
    baseRef
  );
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
    expectedMainSha,
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
  const action = process.env.DEPLOY_HUB_ACTION ?? "deploy";
  assert(
    new Set(["staging", "production"]).has(mode),
    "Deploy Hub mode is invalid."
  );
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
  let result;
  if (mode === "production") {
    result = await executeProduction({
      ...common,
      parentRunId: process.env.DEPLOY_HUB_PARENT_RUN_ID ?? "",
      stagingSha: process.env.DEPLOY_HUB_STAGING_SHA ?? "",
      stagingCorrelation: process.env.DEPLOY_HUB_STAGING_CORRELATION ?? "",
    });
  } else {
    assert(
      new Set(["deploy", "remove-from-staging"]).has(action),
      "Deploy Hub action is invalid."
    );
    const operation = {
      ...common,
      confirmation: process.env.DEPLOY_HUB_CONFIRMATION ?? "",
      git: createGitClient(),
    };
    result =
      action === "remove-from-staging"
        ? await executeRemoveFromStaging(operation)
        : await executeStaging(operation);
  }
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
  executeRemoveFromStaging,
  executeStaging,
  statusContext,
  stopContext,
  validateRuntime,
  waitForWorkflow,
};
