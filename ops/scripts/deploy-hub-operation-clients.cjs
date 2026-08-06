const { execFileSync } = require("node:child_process");
const {
  OPERATION_ID_PATTERN,
} = require("./deploy-hub-operation-contracts.cjs");

const SHA_PATTERN = /^[a-f0-9]{40}$/;
const STAGING_REF = "1a-staging";
const REF_PATTERN = /^[A-Za-z0-9._/-]{1,255}$/;
const ACTOR_PATTERN = /^[A-Za-z0-9-]{1,39}$/;
const GIT_TIMEOUT_MILLISECONDS = 60_000;
const GIT_MAX_BUFFER_BYTES = 10 * 1024 * 1024;
const INVALID_GITHUB_SHA = "GitHub SHA is invalid.";
const WORKFLOWS = new Set([
  "build-upload-deploy-prod.yml",
  "deploy-hub-production.yml",
  "deploy-staging.yml",
  "production-e2e.yml",
  "staging-e2e.yml",
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createRequestUrl(apiUrl, repository, segments, query) {
  const url = new URL(
    ["repos", ...repository.split("/"), ...segments]
      .map(encodeURIComponent)
      .join("/"),
    `${apiUrl}/`
  );
  for (const [key, value] of Object.entries(query ?? {})) {
    url.searchParams.set(key, value);
  }
  return url;
}

function retryableResponse(response) {
  return (
    response.status === 429 ||
    response.status >= 500 ||
    (response.status === 403 &&
      (response.headers?.get?.("retry-after") ||
        response.headers?.get?.("x-ratelimit-remaining") === "0"))
  );
}

function responsePayload(response) {
  return response.status === 204 ? null : response.json();
}

function retryDelayMilliseconds(response, attempt) {
  const retryAfter = response.headers?.get?.("retry-after")?.trim() ?? "";
  const retryAfterSeconds = Number(retryAfter);
  if (
    retryAfter !== "" &&
    Number.isFinite(retryAfterSeconds) &&
    retryAfterSeconds >= 0
  ) {
    return Math.min(Math.ceil(retryAfterSeconds * 1_000), 30_000);
  }
  return attempt * 1_000;
}

async function githubRequest({
  apiUrl,
  repository,
  token,
  fetchImpl,
  sleepImpl,
  segments,
  options = {},
}) {
  const url = createRequestUrl(apiUrl, repository, segments, options.query);
  const method = options.method ?? "GET";
  const attempts = method === "GET" ? 3 : 1;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(url, {
        method,
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: AbortSignal.timeout(30_000),
      });
    } catch (error) {
      if (method !== "GET" || attempt === attempts) throw error;
      await sleepImpl(attempt * 1_000);
      continue;
    }
    if (response.ok) return responsePayload(response);
    if (!retryableResponse(response) || attempt === attempts) {
      throw new Error(`GitHub request failed with HTTP ${response.status}.`);
    }
    await sleepImpl(retryDelayMilliseconds(response, attempt));
  }
  throw new Error("GitHub request retry budget was exhausted.");
}

async function mergeExactPullRequest(
  request,
  pr,
  sha,
  operationId,
  expectedMainSha
) {
  assert(Number.isInteger(pr) && pr > 0, "GitHub PR number is invalid.");
  assert(SHA_PATTERN.test(sha), INVALID_GITHUB_SHA);
  assert(
    OPERATION_ID_PATTERN.test(operationId),
    "GitHub operation ID is invalid."
  );
  const merged = await request(["pulls", String(pr), "merge"], {
    method: "PUT",
    body: {
      sha,
      merge_method: "merge",
      commit_title: `Deploy Hub ${operationId}: merge frontend PR #${pr}`,
    },
  });
  if (expectedMainSha === undefined || merged?.merged !== true) return merged;
  assert(SHA_PATTERN.test(expectedMainSha), INVALID_GITHUB_SHA);
  assert(SHA_PATTERN.test(merged.sha), INVALID_GITHUB_SHA);
  const commit = await request(["commits", merged.sha]);
  // GitHub's merge endpoint only supports a head-SHA precondition. The exact
  // merge parents are the fail-closed base binding before production continues.
  return {
    ...merged,
    base_matched:
      commit?.parents?.[0]?.sha === expectedMainSha &&
      commit?.parents?.[1]?.sha === sha,
  };
}

function createGithubClient({
  apiUrl,
  repository,
  token,
  fetchImpl = fetch,
  sleepImpl = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
}) {
  assert(apiUrl === "https://api.github.com", "GitHub API URL is invalid.");
  assert(
    repository === "6529-Collections/6529seize-frontend",
    "GitHub repository is invalid."
  );

  async function request(segments, options = {}) {
    return githubRequest({
      apiUrl,
      repository,
      token,
      fetchImpl,
      sleepImpl,
      segments,
      options,
    });
  }

  function validSha(sha) {
    assert(SHA_PATTERN.test(sha), INVALID_GITHUB_SHA);
    return sha;
  }

  function validPr(pr) {
    assert(Number.isInteger(pr) && pr > 0, "GitHub PR number is invalid.");
    return String(pr);
  }

  function validWorkflow(workflow) {
    assert(WORKFLOWS.has(workflow), "GitHub workflow is invalid.");
    return workflow;
  }

  function validRef(ref) {
    assert(REF_PATTERN.test(ref), "GitHub ref is invalid.");
    return ref;
  }

  function validActor(actor) {
    assert(ACTOR_PATTERN.test(actor), "GitHub actor is invalid.");
    return actor;
  }

  async function getCombinedStatus(sha) {
    const statuses = [];
    for (let page = 1; page <= 100; page += 1) {
      const batch = await request(["commits", validSha(sha), "statuses"], {
        query: { per_page: "100", page: String(page) },
      });
      assert(Array.isArray(batch), "GitHub statuses response is invalid.");
      statuses.push(...batch);
      if (batch.length < 100) {
        statuses.sort(
          (left, right) =>
            Date.parse(right.created_at ?? "") -
            Date.parse(left.created_at ?? "")
        );
        return { statuses };
      }
    }
    throw new Error("GitHub statuses exceeded the safe pagination limit.");
  }

  async function getCheckRuns(sha) {
    const checkRuns = [];
    for (let page = 1; page <= 100; page += 1) {
      const result = await request(["commits", validSha(sha), "check-runs"], {
        query: { filter: "latest", per_page: "100", page: String(page) },
      });
      assert(
        Array.isArray(result?.check_runs),
        "GitHub check-runs response is invalid."
      );
      checkRuns.push(...result.check_runs);
      if (result.check_runs.length < 100) {
        return { check_runs: checkRuns, total_count: checkRuns.length };
      }
    }
    throw new Error("GitHub check runs exceeded the safe pagination limit.");
  }

  async function listOpenPullRequests(baseRef) {
    const pulls = [];
    for (let page = 1; page <= 100; page += 1) {
      const batch = await request(["pulls"], {
        query: {
          base: validRef(baseRef),
          direction: "asc",
          page: String(page),
          per_page: "100",
          sort: "created",
          state: "open",
        },
      });
      assert(Array.isArray(batch), "GitHub pull requests response is invalid.");
      pulls.push(...batch);
      if (batch.length < 100) return pulls;
    }
    throw new Error("GitHub pull requests exceeded the safe pagination limit.");
  }

  return {
    createCommitStatus: (sha, status) =>
      request(["statuses", validSha(sha)], { method: "POST", body: status }),
    dispatchWorkflow: (workflow, ref, inputs) =>
      request(["actions", "workflows", validWorkflow(workflow), "dispatches"], {
        method: "POST",
        body: { ref: validRef(ref), inputs },
      }),
    getCollaboratorPermission: (actor) =>
      request(["collaborators", validActor(actor), "permission"]),
    getCheckRuns,
    getCombinedStatus,
    getPullRequest: (pr) => request(["pulls", validPr(pr)]),
    getRef: (ref) =>
      request(["git", "ref", "heads", ...validRef(ref).split("/")]),
    getWorkflowRun(runId) {
      assert(/^[1-9]\d*$/.test(String(runId)), "GitHub run ID is invalid.");
      return request(["actions", "runs", String(runId)]);
    },
    listWorkflowRuns(workflow, branch) {
      return request(
        ["actions", "workflows", validWorkflow(workflow), "runs"],
        {
          query: {
            event: "workflow_dispatch",
            branch: validRef(branch),
            per_page: "50",
          },
        }
      );
    },
    listOpenPullRequests,
    mergePullRequest: (pr, sha, operationId, expectedMainSha) =>
      mergeExactPullRequest(request, pr, sha, operationId, expectedMainSha),
  };
}

function createGitClient({ exec = execFileSync } = {}) {
  function run(args, options = {}) {
    return exec("git", args, {
      encoding: "utf8",
      stdio: [options.input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
      input: options.input,
      maxBuffer: GIT_MAX_BUFFER_BYTES,
      timeout: GIT_TIMEOUT_MILLISECONDS,
    }).trim();
  }

  function remoteSha(ref) {
    assert(ref === STAGING_REF || ref === "main", "Unsupported remote ref.");
    const output = run(["ls-remote", "--heads", "origin", `refs/heads/${ref}`]);
    const sha = output.split(/\s+/)[0] ?? "";
    assert(SHA_PATTERN.test(sha), `Unable to resolve origin/${ref}.`);
    return sha;
  }

  return {
    fetchExact(shas) {
      run(["fetch", "--no-tags", "origin", STAGING_REF, "main"]);
      for (const sha of new Set(shas)) {
        run(["fetch", "--no-tags", "origin", validGitSha(sha)]);
      }
    },
    mergeContent(baseSha, requests, messagePrefix) {
      let current = validGitSha(baseSha);
      for (const request of requests) {
        const requestSha = validGitSha(request.sha);
        let tree;
        try {
          tree = run(["merge-tree", "--write-tree", current, requestSha]);
        } catch (error) {
          if (error?.status === 1) {
            throw new Error(
              `Frontend PR #${request.pr} conflicts with staging.`
            );
          }
          throw new Error(
            "git merge-tree --write-tree is unavailable or failed unexpectedly.",
            { cause: error }
          );
        }
        assert(SHA_PATTERN.test(tree), "Merged staging tree is invalid.");
        current = run(["commit-tree", tree, "-p", current, "-p", requestSha], {
          input: `${messagePrefix}: include frontend PR #${request.pr}\n`,
        });
        assert(SHA_PATTERN.test(current), "Merged staging commit is invalid.");
      }
      return current;
    },
    forwardContent(parentSha, contentSha, message) {
      const parent = validGitSha(parentSha);
      const content = validGitSha(contentSha);
      const tree = run(["rev-parse", `${content}^{tree}`]);
      assert(SHA_PATTERN.test(tree), "Forward staging tree is invalid.");
      const commit = run(["commit-tree", tree, "-p", parent], {
        input: `${message}\n`,
      });
      assert(SHA_PATTERN.test(commit), "Forward staging commit is invalid.");
      return commit;
    },
    pushStaging(expectedOldSha, nextSha) {
      const expected = validGitSha(expectedOldSha);
      const next = validGitSha(nextSha);
      const observed = remoteSha(STAGING_REF);
      assert(
        observed === expected,
        `Staging moved from ${expected} to ${observed}; refusing mutation.`
      );
      run(["push", "origin", `${next}:refs/heads/${STAGING_REF}`]);
    },
    readCommitMessage(sha) {
      return run(["show", "-s", "--format=%B", validGitSha(sha)]);
    },
    sameTree(leftSha, rightSha) {
      const leftTree = run(["rev-parse", `${validGitSha(leftSha)}^{tree}`]);
      const rightTree = run(["rev-parse", `${validGitSha(rightSha)}^{tree}`]);
      return leftTree === rightTree;
    },
    remoteSha,
  };
}

function validGitSha(sha) {
  assert(SHA_PATTERN.test(sha), "Git SHA is invalid.");
  return sha;
}

module.exports = { createGitClient, createGithubClient };
