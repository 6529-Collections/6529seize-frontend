const { execFileSync } = require("node:child_process");

const SHA_PATTERN = /^[a-f0-9]{40}$/;
const STAGING_REF = "1a-staging";
const REF_PATTERN = /^[A-Za-z0-9._/-]{1,255}$/;
const ACTOR_PATTERN = /^[A-Za-z0-9-]{1,39}$/;
const OPERATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
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

function createGithubClient({ apiUrl, repository, token, fetchImpl = fetch }) {
  assert(apiUrl === "https://api.github.com", "GitHub API URL is invalid.");
  assert(
    repository === "6529-Collections/6529seize-frontend",
    "GitHub repository is invalid."
  );

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
    if (response.status === 204) return null;
    return response.json();
  }

  function validSha(sha) {
    assert(SHA_PATTERN.test(sha), "GitHub SHA is invalid.");
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
      if (batch.length < 100) return { statuses };
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
    getRef: (ref) => request(["git", "ref", "heads", validRef(ref)]),
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
    mergePullRequest: (pr, sha, operationId) => {
      assert(
        OPERATION_ID_PATTERN.test(operationId),
        "GitHub operation ID is invalid."
      );
      return request(["pulls", validPr(pr), "merge"], {
        method: "PUT",
        body: {
          sha: validSha(sha),
          merge_method: "merge",
          commit_title: `Deploy Hub ${operationId}: merge frontend PR #${pr}`,
        },
      });
    },
  };
}

function createGitClient({ exec = execFileSync } = {}) {
  function run(args, options = {}) {
    return exec("git", args, {
      encoding: "utf8",
      stdio: [options.input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
      input: options.input,
    }).trim();
  }

  function remoteSha(ref) {
    assert(ref === STAGING_REF, "Unsupported remote ref.");
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
        } catch {
          throw new Error(`Frontend PR #${request.pr} conflicts with staging.`);
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
      assert(
        remoteSha(STAGING_REF) === next,
        "Staging ref did not resolve to the published SHA."
      );
    },
    readCommitMessage(sha) {
      return run(["show", "-s", "--format=%B", validGitSha(sha)]);
    },
    remoteSha,
  };
}

function validGitSha(sha) {
  assert(SHA_PATTERN.test(sha), "Git SHA is invalid.");
  return sha;
}

module.exports = { createGitClient, createGithubClient };
