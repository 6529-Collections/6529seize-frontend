#!/usr/bin/env node

const { addRequests } = require("./deploy-hub-staging-composition.cjs");
const {
  normalizeManifest,
  partitionCohorts,
} = require("./deploy-hub-manifest.cjs");
const {
  createGitClient,
  createGithubClient,
} = require("./deploy-hub-operation-clients.cjs");
const {
  assert,
  assertExactPulls,
  assertProductionPreflight,
  assertRequestAuthorities,
  validateRuntime,
} = require("./deploy-hub-operation-contracts.cjs");
const {
  composeContent,
  compositionOnLatestBase,
  STAGING_REF,
} = require("./deploy-hub-staging-content.cjs");
const { targetLabel } = require("./deploy-hub-operation-workflows.cjs");

function statusContext(target) {
  return `Deploy Hub Shadow — Target: ${targetLabel(target)}`;
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

async function publishFailure(github, requests, runUrl, reason) {
  await publishStatus(
    github,
    requests,
    runUrl,
    "error",
    `DRY RUN failed: ${reason}; nothing deployed`
  ).catch(() => {});
}

function planStagingContent({ git, cohorts, operationId, baseRef }) {
  const stagingSha = git.remoteSha(STAGING_REF);
  let composition = compositionOnLatestBase(git, stagingSha, baseRef);

  return {
    stagingSha,
    mainSha: composition.baseSha,
    cohorts: cohorts.map((cohort, index) => {
      composition = addRequests(composition, cohort.requests);
      const localContentSha = composeContent(
        git,
        composition,
        operationId,
        `dry-run-${index + 1}`
      );
      return {
        target: cohort.target,
        requests: cohort.requests,
        localContentSha,
      };
    }),
  };
}

async function executeDryRun(options) {
  const {
    operationId,
    manifestJson,
    repository,
    baseRef,
    actor,
    runUrl,
    github,
    git,
  } = options;
  validateRuntime({ operationId, repository, runUrl, baseRef });
  const requests = normalizeManifest(manifestJson, actor, repository);
  const cohorts = partitionCohorts(requests);

  try {
    await publishStatus(
      github,
      requests,
      runUrl,
      "pending",
      "DRY RUN: validating exact deployment plan; nothing will deploy"
    );
    await assertRequestAuthorities(github, requests);
    await assertExactPulls(github, requests, baseRef);
    const stagingPlan = planStagingContent({
      git,
      cohorts,
      operationId,
      baseRef,
    });
    const productionRequests = requests.filter(
      ({ target }) => target === "production"
    );
    const mainSha =
      productionRequests.length > 0
        ? await assertProductionPreflight(
            github,
            productionRequests,
            baseRef
          )
        : (await github.getRef(baseRef)).object?.sha;
    assert(
      /^[a-f0-9]{40}$/.test(mainSha ?? ""),
      "Current main SHA is unavailable."
    );
    assert(
      mainSha === stagingPlan.mainSha,
      "Main moved while the dry-run staging plan was being built."
    );
    await publishStatus(
      github,
      requests,
      runUrl,
      "success",
      "DRY RUN passed: exact deployment plan is valid; nothing deployed"
    );
    return {
      operationId,
      conclusion: "success",
      requests,
      mainSha,
      stagingSha: stagingPlan.stagingSha,
      cohorts: stagingPlan.cohorts,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unexpected error";
    await publishFailure(github, requests, runUrl, reason);
    throw error;
  }
}

function createSummary(result, runUrl) {
  const lines = [
    "# Deploy Hub FE dry run",
    "",
    "> READ ONLY — no branch, workflow, or environment was changed.",
    "",
    `- Operation: \`${result.operationId}\``,
    `- Conclusion: \`${result.conclusion}\``,
    `- Current main: \`${result.mainSha}\``,
    `- Current staging: \`${result.stagingSha}\``,
    `- Run: ${runUrl}`,
    "",
    "## Exact requests",
    "",
    "| PR | Exact SHA | Final target | Requester |",
    "| ---: | --- | --- | --- |",
    ...result.requests.map(
      (request) =>
        `| #${request.pr} | \`${request.sha}\` | ${targetLabel(request.target)} | @${request.requester} |`
    ),
    "",
    "## Planned cohorts",
    "",
    ...result.cohorts.flatMap((cohort, index) => {
      const requests = cohort.requests.map(({ pr }) => `#${pr}`).join(", ");
      const steps = [
        `${index + 1}. **${targetLabel(cohort.target)}** — ${requests}`,
        `   - Local merge/conflict proof: \`${cohort.localContentSha}\` (never pushed)`,
        "   - Would publish a forward-only `1a-staging` commit",
        "   - Would run `deploy-staging.yml`, then `staging-e2e.yml`",
      ];
      if (cohort.target === "production") {
        steps.push(
          "   - After staging passes, would recheck and merge the exact PR heads into `main`",
          "   - Would run `build-upload-deploy-prod.yml`, then `production-e2e.yml`"
        );
      }
      return steps;
    }),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function createFailureSummary(reason) {
  return [
    "# Deploy Hub FE dry run",
    "",
    "> READ ONLY — no branch, workflow, or environment was changed.",
    "",
    "- Conclusion: `failure`",
    `- Reason: ${reason}`,
    "",
  ].join("\n");
}

async function main() {
  const repository = process.env.DEPLOY_HUB_REPOSITORY ?? "";
  const token = process.env.GITHUB_TOKEN ?? "";
  assert(token.length > 0, "GitHub token is unavailable.");
  const result = await executeDryRun({
    operationId: process.env.DEPLOY_HUB_OPERATION_ID ?? "",
    manifestJson: process.env.DEPLOY_HUB_MANIFEST ?? "",
    repository,
    baseRef: process.env.DEPLOY_HUB_BASE_REF ?? "",
    actor: process.env.DEPLOY_HUB_ACTOR ?? "",
    runUrl: process.env.DEPLOY_HUB_RUN_URL ?? "",
    github: createGithubClient({
      apiUrl: process.env.DEPLOY_HUB_API_URL ?? "https://api.github.com",
      repository,
      token,
    }),
    git: createGitClient(),
  });
  process.stdout.write(createSummary(result, process.env.DEPLOY_HUB_RUN_URL));
}

if (require.main === module) {
  void (async () => {
    try {
      await main();
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Unexpected dry-run failure.";
      process.stdout.write(createFailureSummary(reason));
      console.error(`Deploy Hub dry run failed: ${reason}`);
      process.exitCode = 1;
    }
  })();
}

module.exports = {
  createFailureSummary,
  createSummary,
  executeDryRun,
  planStagingContent,
  statusContext,
};
