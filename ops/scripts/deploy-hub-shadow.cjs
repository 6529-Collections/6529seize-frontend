#!/usr/bin/env node

const { execFileSync } = require("node:child_process");

const EXPECTED_REPOSITORY = "6529-Collections/6529seize-frontend";
const STAGING_REF = "1a-staging";
const MAX_REQUESTS = 20;
const SHA_PATTERN = /^[a-f0-9]{40}$/;
const OPERATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;
const ACTOR_PATTERN = /^[A-Za-z0-9-]{1,39}$/;
const TARGETS = new Set(["staging", "production"]);
const WRITE_PERMISSIONS = new Set(["admin", "maintain", "write"]);
const PRODUCTION_PERMISSIONS = new Set(["admin", "maintain"]);
const ALLOWED_CHECK_CONCLUSIONS = new Set(["neutral", "skipped", "success"]);
const COMPOSITION_TRAILER = "Deploy-Hub-Composition:";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeManifest(manifestJson, actor, repository) {
  assert(repository === EXPECTED_REPOSITORY, "Repository is not supported.");
  assert(ACTOR_PATTERN.test(actor), "GitHub actor has an invalid format.");
  let parsed;
  try {
    parsed = JSON.parse(manifestJson);
  } catch {
    throw new Error("Manifest must be valid JSON.");
  }
  assert(Array.isArray(parsed), "Manifest must be a JSON array.");
  assert(parsed.length > 0, "Manifest must contain at least one request.");
  assert(parsed.length <= MAX_REQUESTS, "Manifest contains too many requests.");
  const seen = new Set();
  return parsed.map((request, index) => {
    const label = `Manifest request ${index + 1}`;
    assert(request?.repository === repository, `${label} repository is invalid.`);
    assert(Number.isInteger(request.pr) && request.pr > 0, `${label} PR is invalid.`);
    assert(!seen.has(request.pr), `${label} repeats PR #${request.pr}.`);
    seen.add(request.pr);
    assert(SHA_PATTERN.test(request.sha ?? ""), `${label} SHA is invalid.`);
    assert(TARGETS.has(request.target), `${label} target is invalid.`);
    assert(
      String(request.requester).toLowerCase() === actor.toLowerCase(),
      `${label} requester must match the dispatching actor.`
    );
    assert(
      typeof request.requested_at === "string" &&
        Number.isFinite(Date.parse(request.requested_at)),
      `${label} request time is invalid.`
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
  return `Deploy Hub Dry Run — Target: ${targetLabel(target)}`;
}

function createGithubClient({ apiUrl, repository, token, fetchImpl = fetch }) {
  assert(apiUrl === "https://api.github.com", "GitHub API URL is invalid.");

  async function request(segments, options = {}) {
    const url = new URL(
      ["repos", ...repository.split("/"), ...segments]
        .map(encodeURIComponent)
        .join("/"),
      `${apiUrl}/`
    );
    for (const [key, value] of Object.entries(options.query ?? {})) {
      url.searchParams.set(key, value);
    }
    const response = await fetchImpl(url, {
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
    return response.status === 204 ? null : response.json();
  }

  return {
    createCommitStatus: (sha, status) =>
      request(["statuses", sha], { method: "POST", body: status }),
    getCheckRuns: (sha) =>
      request(["commits", sha, "check-runs"], {
        query: { filter: "latest", per_page: "100" },
      }),
    getCollaboratorPermission: (actor) =>
      request(["collaborators", actor, "permission"]),
    getCombinedStatus: async (sha) => ({
      statuses: await request(["commits", sha, "statuses"], {
        query: { per_page: "100" },
      }),
    }),
    getPullRequest: (pr) => request(["pulls", String(pr)]),
    getRef: (ref) => request(["git", "ref", "heads", ...ref.split("/")]),
  };
}

function createGitPlanner({ exec = execFileSync } = {}) {
  function run(args, options = {}) {
    return exec("git", args, {
      encoding: "utf8",
      input: options.input,
      stdio: [options.input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
      timeout: 60_000,
      maxBuffer: 10 * 1024 * 1024,
    }).trim();
  }

  function validSha(sha) {
    assert(SHA_PATTERN.test(sha), "Git SHA is invalid.");
    return sha;
  }

  function remoteSha(ref) {
    assert(ref === STAGING_REF || ref === "main", "Git ref is unsupported.");
    const output = run(["ls-remote", "--heads", "origin", `refs/heads/${ref}`]);
    const sha = output.split(/\s+/)[0] ?? "";
    assert(SHA_PATTERN.test(sha), `Unable to resolve origin/${ref}.`);
    return sha;
  }

  return {
    remoteSha,
    fetchExact(shas) {
      run(["fetch", "--no-tags", "origin", STAGING_REF, "main"]);
      for (const sha of new Set(shas)) {
        run(["fetch", "--no-tags", "origin", validSha(sha)]);
      }
    },
    readCommitMessage(sha) {
      return run(["show", "-s", "--format=%B", validSha(sha)]);
    },
    sameTree(left, right) {
      return (
        run(["rev-parse", `${validSha(left)}^{tree}`]) ===
        run(["rev-parse", `${validSha(right)}^{tree}`])
      );
    },
    mergeContent(baseSha, requests, operationId) {
      let current = validSha(baseSha);
      for (const request of requests) {
        let tree;
        try {
          tree = run(["merge-tree", "--write-tree", current, validSha(request.sha)]);
        } catch (error) {
          if (error?.status === 1) {
            throw new Error(`Frontend PR #${request.pr} conflicts with the plan.`);
          }
          throw error;
        }
        current = run(["commit-tree", tree, "-p", current, "-p", request.sha], {
          input: `Deploy Hub dry run ${operationId}: include PR #${request.pr}\n`,
        });
        assert(SHA_PATTERN.test(current), "Planned commit SHA is invalid.");
      }
      return current;
    },
  };
}

function parseComposition(message) {
  const line = String(message)
    .split(/\r?\n/)
    .find((candidate) => candidate.startsWith(COMPOSITION_TRAILER));
  if (!line) return null;
  try {
    const value = JSON.parse(
      Buffer.from(line.slice(COMPOSITION_TRAILER.length).trim(), "base64url").toString("utf8")
    );
    assert(value.version === 1 && SHA_PATTERN.test(value.base_sha), "invalid");
    assert(Array.isArray(value.prs) && value.prs.length <= 100, "invalid");
    const requests = value.prs.map((request) => {
      assert(Number.isInteger(request.pr) && request.pr > 0, "invalid");
      assert(SHA_PATTERN.test(request.sha ?? ""), "invalid");
      return { pr: request.pr, sha: request.sha };
    });
    assert(new Set(requests.map(({ pr }) => pr)).size === requests.length, "invalid");
    return { baseSha: value.base_sha, requests };
  } catch {
    throw new Error("Staging composition metadata is invalid.");
  }
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

async function validateRequests(github, requests, actor, baseRef) {
  const access = await github.getCollaboratorPermission(actor);
  const permission = access.role_name ?? access.permission;
  assert(WRITE_PERMISSIONS.has(permission), "Requester lacks frontend write access.");
  if (requests.some(({ target }) => target === "production")) {
    assert(PRODUCTION_PERMISSIONS.has(permission), "Production requires maintain access.");
  }
  for (const request of requests) {
    const pull = await github.getPullRequest(request.pr);
    assert(pull.state === "open", `PR #${request.pr} is not open.`);
    assert(pull.base?.ref === baseRef, `PR #${request.pr} does not target ${baseRef}.`);
    assert(pull.head?.sha === request.sha, `PR #${request.pr} head moved.`);
    assert(pull.mergeable !== false, `PR #${request.pr} is not mergeable.`);
  }
}

async function validateProductionChecks(github, requests) {
  for (const request of requests.filter(({ target }) => target === "production")) {
    const [checks, combined] = await Promise.all([
      github.getCheckRuns(request.sha),
      github.getCombinedStatus(request.sha),
    ]);
    const runs = checks.check_runs ?? [];
    assert(
      runs.some(
        ({ name, status, conclusion }) =>
          name === "Installed app checks" && status === "completed" && conclusion === "success"
      ),
      `PR #${request.pr} did not pass Installed app checks.`
    );
    for (const check of runs) {
      assert(
        check.status === "completed" && ALLOWED_CHECK_CONCLUSIONS.has(check.conclusion),
        `PR #${request.pr} check ${check.name ?? "unknown"} is not successful.`
      );
    }
    const latestStatuses = new Map();
    for (const status of combined.statuses ?? []) {
      const context = String(status.context ?? "");
      if (!context.startsWith("Deploy Hub") && !latestStatuses.has(context)) {
        latestStatuses.set(context, status);
      }
    }
    for (const status of latestStatuses.values()) {
      assert(status.state === "success", `PR #${request.pr} has a failing status.`);
    }
  }
}

function planStagingContent({ git, requests, operationId, baseRef }) {
  const stagingSha = git.remoteSha(STAGING_REF);
  const mainSha = git.remoteSha(baseRef);
  git.fetchExact([stagingSha, mainSha, ...requests.map(({ sha }) => sha)]);
  const tracked = parseComposition(git.readCommitMessage(stagingSha));
  const baselineRequired = !tracked && !git.sameTree(stagingSha, mainSha);
  let active = tracked?.requests ?? [];
  const cohorts = partitionCohorts(requests).map((cohort) => {
    const replacements = new Set(cohort.requests.map(({ pr }) => pr));
    active = [
      ...active.filter(({ pr }) => !replacements.has(pr)),
      ...cohort.requests.map(({ pr, sha }) => ({ pr, sha })),
    ];
    return {
      target: cohort.target,
      requests: cohort.requests,
      localContentSha: git.mergeContent(mainSha, active, operationId),
    };
  });
  return { stagingSha, mainSha, baselineRequired, cohorts };
}

async function executeShadow(options) {
  const { operationId, manifestJson, repository, baseRef, actor, runUrl, github, git } = options;
  assert(OPERATION_ID_PATTERN.test(operationId), "Operation ID has an invalid format.");
  assert(baseRef === "main", "Default branch is unsupported.");
  assert(runUrl.startsWith(`https://github.com/${EXPECTED_REPOSITORY}/actions/runs/`), "Run URL is invalid.");
  const requests = normalizeManifest(manifestJson, actor, repository);
  try {
    await publishStatus(github, requests, runUrl, "pending", "DRY RUN: validating exact deployment plan; nothing will deploy");
    await validateRequests(github, requests, actor, baseRef);
    const plan = planStagingContent({ git, requests, operationId, baseRef });
    await validateProductionChecks(github, requests);
    const githubMainSha = (await github.getRef(baseRef)).object?.sha;
    assert(githubMainSha === plan.mainSha, "Main moved while the dry run was executing.");
    await publishStatus(github, requests, runUrl, "success", "DRY RUN passed: exact deployment plan is valid; nothing deployed");
    return { operationId, conclusion: "success", requests, ...plan };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unexpected error";
    await publishStatus(github, requests, runUrl, "error", `DRY RUN failed: ${reason}; nothing deployed`).catch(() => {});
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
    `- Initial baseline needed: \`${result.baselineRequired ? "yes" : "no"}\``,
    `- Run: ${runUrl}`,
    "",
    "## Planned cohorts",
    "",
    ...result.cohorts.map((cohort, index) => {
      const pullRequests = cohort.requests
        .map(({ pr }) => `#${pr}`)
        .join(", ");
      return `${index + 1}. ${targetLabel(cohort.target)} — ${pullRequests} — local proof \`${cohort.localContentSha}\``;
    }),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function createFailureSummary(reason) {
  return `# Deploy Hub FE dry run\n\n> READ ONLY — nothing was deployed.\n\n- Conclusion: \`failure\`\n- Reason: ${reason}\n`;
}

async function main() {
  const repository = process.env.DEPLOY_HUB_REPOSITORY ?? "";
  const token = process.env.GITHUB_TOKEN ?? "";
  assert(token.length > 0, "GitHub token is unavailable.");
  const result = await executeShadow({
    operationId: process.env.DEPLOY_HUB_OPERATION_ID ?? "",
    manifestJson: process.env.DEPLOY_HUB_MANIFEST ?? "",
    repository,
    baseRef: process.env.DEPLOY_HUB_BASE_REF ?? "",
    actor: process.env.DEPLOY_HUB_ACTOR ?? "",
    runUrl: process.env.DEPLOY_HUB_RUN_URL ?? "",
    github: createGithubClient({
      apiUrl: process.env.DEPLOY_HUB_API_URL ?? "",
      repository,
      token,
    }),
    git: createGitPlanner(),
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
  EXPECTED_REPOSITORY,
  createFailureSummary,
  createGitPlanner,
  createGithubClient,
  createSummary,
  executeShadow,
  normalizeManifest,
  parseComposition,
  partitionCohorts,
  planStagingContent,
  statusContext,
};
