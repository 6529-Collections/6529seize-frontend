const { execFileSync } = require("node:child_process");

const SHA_PATTERN = /^[a-f0-9]{40}$/;
const STAGING_REF = "1a-staging";

function assert(condition, message) {
  if (!condition) throw new Error(message);
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
    if (response.status === 204) return null;
    return response.json();
  }

  return {
    createCommitStatus: (sha, status) =>
      request(`/statuses/${sha}`, { method: "POST", body: status }),
    dispatchWorkflow: (workflow, ref, inputs) =>
      request(`/actions/workflows/${workflow}/dispatches`, {
        method: "POST",
        body: { ref, inputs },
      }),
    getCollaboratorPermission: (actor) =>
      request(`/collaborators/${encodeURIComponent(actor)}/permission`),
    getCombinedStatus: (sha) => request(`/commits/${sha}/status?per_page=100`),
    getPullRequest: (pr) => request(`/pulls/${pr}`),
    getRef: (ref) => request(`/git/ref/heads/${encodeURIComponent(ref)}`),
    getWorkflowRun: (runId) => request(`/actions/runs/${runId}`),
    listWorkflowRuns(workflow, branch) {
      const query = new URLSearchParams({
        event: "workflow_dispatch",
        branch,
        per_page: "50",
      });
      return request(`/actions/workflows/${workflow}/runs?${query}`);
    },
    mergePullRequest: (pr, sha, operationId) =>
      request(`/pulls/${pr}/merge`, {
        method: "PUT",
        body: {
          sha,
          merge_method: "merge",
          commit_title: `Deploy Hub ${operationId}: merge frontend PR #${pr}`,
        },
      }),
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
    const output = run(["ls-remote", "--heads", "origin", `refs/heads/${ref}`]);
    const sha = output.split(/\s+/)[0] ?? "";
    assert(SHA_PATTERN.test(sha), `Unable to resolve origin/${ref}.`);
    return sha;
  }

  return {
    fetchExact(shas) {
      run(["fetch", "--no-tags", "origin", STAGING_REF, "main"]);
      for (const sha of new Set(shas)) {
        run(["fetch", "--no-tags", "origin", sha]);
      }
    },
    mergeContent(baseSha, requests, messagePrefix) {
      let current = baseSha;
      for (const request of requests) {
        const tree = run(["merge-tree", "--write-tree", current, request.sha]);
        current = run(["commit-tree", tree, "-p", current, "-p", request.sha], {
          input: `${messagePrefix}: include frontend PR #${request.pr}\n`,
        });
      }
      return current;
    },
    forwardContent(parentSha, contentSha, message) {
      const tree = run(["rev-parse", `${contentSha}^{tree}`]);
      return run(["commit-tree", tree, "-p", parentSha], {
        input: `${message}\n`,
      });
    },
    pushStaging(expectedOldSha, nextSha) {
      const observed = remoteSha(STAGING_REF);
      assert(
        observed === expectedOldSha,
        `Staging moved from ${expectedOldSha} to ${observed}; refusing mutation.`
      );
      run(["push", "origin", `${nextSha}:refs/heads/${STAGING_REF}`]);
      assert(
        remoteSha(STAGING_REF) === nextSha,
        "Staging ref did not resolve to the published SHA."
      );
    },
    remoteSha,
  };
}

module.exports = { createGitClient, createGithubClient };
