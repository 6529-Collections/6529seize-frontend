#!/usr/bin/env node

const EXPECTED_REPOSITORY = "6529-Collections/6529seize-frontend";
const MAX_REQUESTS = 20;
const OPERATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;
const SHA_PATTERN = /^[a-f0-9]{40}$/;
const REQUESTER_PATTERN = /^[A-Za-z0-9-]{1,39}$/;
const TARGETS = new Set(["staging", "production"]);
const SCENARIOS = new Set([
  "success",
  "product-failure",
  "infrastructure-failure",
  "cancelled",
  "stale",
]);
const DELAYS = new Set([0, 5]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeManifest(manifestJson, actor, repository) {
  let parsed;
  try {
    parsed = JSON.parse(manifestJson);
  } catch {
    throw new Error("Manifest must be valid JSON.");
  }

  assert(Array.isArray(parsed), "Manifest must be a JSON array.");
  assert(parsed.length > 0, "Manifest must contain at least one request.");
  assert(
    parsed.length <= MAX_REQUESTS,
    `Manifest cannot contain more than ${MAX_REQUESTS} requests.`
  );

  const seenPrs = new Set();
  return parsed.map((request, index) => {
    const label = `Manifest request ${index + 1}`;
    assert(
      request && typeof request === "object" && !Array.isArray(request),
      `${label} must be an object.`
    );
    assert(
      request.repository === repository && repository === EXPECTED_REPOSITORY,
      `${label} has an invalid repository.`
    );
    assert(
      Number.isInteger(request.pr) && request.pr > 0,
      `${label} has an invalid PR number.`
    );
    assert(!seenPrs.has(request.pr), `${label} repeats PR ${request.pr}.`);
    seenPrs.add(request.pr);
    assert(
      typeof request.sha === "string" && SHA_PATTERN.test(request.sha),
      `${label} has an invalid exact SHA.`
    );
    assert(TARGETS.has(request.target), `${label} has an invalid target.`);
    assert(
      typeof request.requester === "string" &&
        REQUESTER_PATTERN.test(request.requester) &&
        !request.requester.startsWith("-") &&
        !request.requester.endsWith("-") &&
        request.requester.toLowerCase() === actor.toLowerCase(),
      `${label} requester must match the dispatching GitHub actor.`
    );
    assert(
      typeof request.requested_at === "string" &&
        new Date(request.requested_at).toISOString() === request.requested_at,
      `${label} has an invalid request time.`
    );

    return Object.freeze({
      repository: request.repository,
      pr: request.pr,
      sha: request.sha,
      target: request.target,
      requester: request.requester,
      requested_at: request.requested_at,
    });
  });
}

function partitionCohorts(requests) {
  return requests.reduce((cohorts, request) => {
    const current = cohorts.at(-1);
    if (!current || current.target !== request.target) {
      cohorts.push({ target: request.target, requests: [request] });
    } else {
      current.requests.push(request);
    }
    return cohorts;
  }, []);
}

function targetLabel(target) {
  return target === "production" ? "Production" : "Staging";
}

function statusContext(target) {
  return `Deploy Hub Shadow — Target: ${targetLabel(target)}`;
}

function statusPlan(target, scenario) {
  const label = targetLabel(target);
  const queued = {
    phase: "queued",
    state: "pending",
    description: `SHADOW: ${label} request queued; no deployment`,
  };
  const staging = {
    phase: "running",
    state: "pending",
    description: "SHADOW: simulating staging; no deployment",
  };

  if (scenario === "stale") {
    return [
      {
        phase: "stale",
        state: "error",
        description: "SHADOW: stale exact PR head; no deployment",
      },
    ];
  }
  if (scenario === "cancelled") {
    return [
      queued,
      {
        phase: "cancelled",
        state: "error",
        description: "SHADOW: simulated cancellation; no deployment",
      },
    ];
  }
  if (scenario === "infrastructure-failure") {
    return [
      queued,
      staging,
      {
        phase: "infrastructure-failure",
        state: "error",
        description: "SHADOW: simulated infrastructure failure; no deployment",
      },
    ];
  }
  if (scenario === "product-failure") {
    return [
      queued,
      staging,
      {
        phase: "reconciling",
        state: "pending",
        description: "SHADOW: simulating bounded reconciliation",
      },
      {
        phase: "product-failure",
        state: "failure",
        description: "SHADOW: simulated product failure; not deployed",
      },
    ];
  }

  const plan = [queued, staging];
  if (target === "production") {
    plan.push({
      phase: "staging-succeeded",
      state: "pending",
      description: "SHADOW: staging passed; simulating production",
    });
  }
  plan.push({
    phase: "succeeded",
    state: "success",
    description: `SHADOW: ${label} simulation complete; not deployed`,
  });
  return plan;
}

function createGithubClient({ apiUrl, repository, token, fetchImpl = fetch }) {
  async function request(path, options = {}) {
    const response = await fetchImpl(`${apiUrl}/repos/${repository}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`GitHub request failed with HTTP ${response.status}.`);
    }
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  return {
    getPullRequest(pr) {
      return request(`/pulls/${pr}`);
    },
    createCommitStatus(sha, status) {
      return request(`/statuses/${sha}`, {
        method: "POST",
        body: status,
      });
    },
  };
}

async function writeStatus(github, request, runUrl, phase) {
  await github.createCommitStatus(request.sha, {
    state: phase.state,
    target_url: runUrl,
    description: phase.description,
    context: statusContext(request.target),
  });
}

async function resolveStaleRequests(github, requests) {
  const stale = new Set();
  for (const request of requests) {
    const pull = await github.getPullRequest(request.pr);
    if (
      pull.state !== "open" ||
      pull.base?.ref !== "main" ||
      pull.head?.sha !== request.sha
    ) {
      stale.add(request.pr);
    }
  }
  return stale;
}

async function publishStaleResult({
  github,
  requests,
  runUrl,
  forceStale,
  staleRequests,
}) {
  const stalePhase = statusPlan("staging", "stale")[0];
  for (const request of requests) {
    const description =
      forceStale || staleRequests.has(request.pr)
        ? stalePhase.description
        : "SHADOW: blocked by stale cohort input; no deployment";
    await writeStatus(github, request, runUrl, {
      ...stalePhase,
      description,
    });
  }
}

async function publishCohorts({
  github,
  cohorts,
  runUrl,
  scenario,
  delaySeconds,
  sleep,
}) {
  for (const cohort of cohorts) {
    const plan = statusPlan(cohort.target, scenario);
    for (const phase of plan) {
      for (const request of cohort.requests) {
        await writeStatus(github, request, runUrl, phase);
      }
      if (delaySeconds > 0 && phase !== plan.at(-1)) {
        await sleep(delaySeconds * 1000);
      }
    }
  }
}

function validateOperation({ operationId, scenario, delaySeconds, runUrl }) {
  assert(
    OPERATION_ID_PATTERN.test(operationId),
    "Operation ID has an invalid format."
  );
  assert(SCENARIOS.has(scenario), "Scenario is not supported.");
  assert(DELAYS.has(delaySeconds), "Phase delay is not supported.");
  assert(
    /^https:\/\/github\.com\/6529-Collections\/6529seize-frontend\/actions\/runs\/[1-9][0-9]*$/.test(
      runUrl
    ),
    "Run URL has an invalid format."
  );
}

async function executeShadow({
  operationId,
  manifestJson,
  scenario,
  delaySeconds,
  repository,
  actor,
  runUrl,
  github,
  sleep = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
}) {
  validateOperation({ operationId, scenario, delaySeconds, runUrl });
  const requests = normalizeManifest(manifestJson, actor, repository);
  const cohorts = partitionCohorts(requests);
  const staleRequests = await resolveStaleRequests(github, requests);
  const forceStale = scenario === "stale";

  if (forceStale || staleRequests.size > 0) {
    await publishStaleResult({
      github,
      requests,
      runUrl,
      forceStale,
      staleRequests,
    });
    return {
      operationId,
      scenario: "stale",
      conclusion: "failure",
      requests,
      cohorts,
    };
  }

  await publishCohorts({
    github,
    cohorts,
    runUrl,
    scenario,
    delaySeconds,
    sleep,
  });

  return {
    operationId,
    scenario,
    conclusion: scenario === "success" ? "success" : "failure",
    requests,
    cohorts,
  };
}

function createSummary(result, runUrl) {
  const lines = [
    "# Deploy Hub FE Shadow",
    "",
    "> SHADOW ONLY — no branch or environment was changed.",
    "",
    `- Operation: \`${result.operationId}\``,
    `- Scenario: \`${result.scenario}\``,
    `- Conclusion: \`${result.conclusion}\``,
    `- Authoritative run: ${runUrl}`,
    "",
    "## Frozen requests",
    "",
    "| PR | Exact SHA | Target | Requester | Requested at |",
    "| ---: | --- | --- | --- | --- |",
    ...result.requests.map(
      (request) =>
        `| #${request.pr} | \`${request.sha}\` | ${targetLabel(request.target)} | @${request.requester} | ${request.requested_at} |`
    ),
    "",
    "## Adjacent target cohorts",
    "",
    ...result.cohorts.map(
      (cohort, index) =>
        `${index + 1}. ${targetLabel(cohort.target)}: ${cohort.requests
          .map((request) => `#${request.pr}`)
          .join(", ")}`
    ),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

async function main() {
  const repository = process.env.DEPLOY_HUB_REPOSITORY ?? "";
  const token = process.env.GITHUB_TOKEN ?? "";
  assert(token.length > 0, "GitHub token is unavailable.");

  const result = await executeShadow({
    operationId: process.env.DEPLOY_HUB_OPERATION_ID ?? "",
    manifestJson: process.env.DEPLOY_HUB_MANIFEST ?? "",
    scenario: process.env.DEPLOY_HUB_SCENARIO ?? "",
    delaySeconds: Number(process.env.DEPLOY_HUB_PHASE_DELAY_SECONDS),
    repository,
    actor: process.env.DEPLOY_HUB_ACTOR ?? "",
    runUrl: process.env.DEPLOY_HUB_RUN_URL ?? "",
    github: createGithubClient({
      apiUrl: process.env.DEPLOY_HUB_API_URL ?? "https://api.github.com",
      repository,
      token,
    }),
  });

  process.stdout.write(createSummary(result, process.env.DEPLOY_HUB_RUN_URL));
  if (result.conclusion !== "success") {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  void (async () => {
    try {
      await main();
    } catch (error) {
      console.error(`Deploy Hub shadow failed: ${error.message}`);
      process.exitCode = 1;
    }
  })();
}

module.exports = {
  EXPECTED_REPOSITORY,
  createSummary,
  createGithubClient,
  executeShadow,
  normalizeManifest,
  partitionCohorts,
  statusContext,
  statusPlan,
  validateOperation,
};
