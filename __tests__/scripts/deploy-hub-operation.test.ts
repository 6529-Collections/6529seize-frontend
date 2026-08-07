const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

const {
  classifyE2eStatus,
  correlationId,
  createGitClient,
  createGithubClient,
  e2eContext,
  executeProduction,
  executeRemoveFromStaging,
  executeStaging,
  mergeProductionRequests,
  statusContext,
  stopContext,
  waitForWorkflow,
} = require("../../ops/scripts/deploy-hub-operation.cjs");
const {
  claimQueuedRequests,
  discoverQueuedRequests,
  mergeQueuedRequests,
  QUEUED_REQUEST_CONTEXT,
  queuedRequestDescription,
  stopRequested,
  validateWithRetry,
} = require("../../ops/scripts/deploy-hub-operation-workflows.cjs");
const {
  assertAuthority,
  assertProductionPreflight,
  assertProductionRequestPreflight,
} = require("../../ops/scripts/deploy-hub-operation-contracts.cjs");
const {
  addRequests,
  commitMessage,
  parseComposition,
  removeRequest,
} = require("../../ops/scripts/deploy-hub-staging-composition.cjs");
const {
  compositionOnLatestBase,
} = require("../../ops/scripts/deploy-hub-staging-content.cjs");
const {
  EXPECTED_REPOSITORY,
} = require("../../ops/scripts/deploy-hub-manifest.cjs");

const ACTOR = "prxt6529";
const SHA_A = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const SHA_B = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const SHA_C = "cccccccccccccccccccccccccccccccccccccccc";
const SHA_D = "dddddddddddddddddddddddddddddddddddddddd";
const SHA_E = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const RUN_URL =
  "https://github.com/6529-Collections/6529seize-frontend/actions/runs/12345";

function workflow(file: string) {
  return YAML.parse(
    fs.readFileSync(path.join(process.cwd(), ".github/workflows", file), "utf8")
  );
}

function request(
  target: "staging" | "production" = "staging",
  pr = 123,
  sha = SHA_A,
  requestedAt = "2026-08-04T12:00:00.000Z"
) {
  return {
    repository: EXPECTED_REPOSITORY,
    pr,
    sha,
    target,
    requester: ACTOR,
    requested_at: requestedAt,
  };
}

describe("Deploy Hub live workflow contracts", () => {
  it("keeps the public controller frontend-only and explicitly dispatched", () => {
    const live = workflow("deploy-hub.yml");
    expect(live.on.workflow_dispatch.inputs).toEqual(
      expect.objectContaining({
        operation_id: expect.objectContaining({ required: true }),
        action: expect.objectContaining({
          options: ["deploy", "remove-from-staging"],
        }),
        manifest: expect.objectContaining({ required: true }),
        confirmation: expect.objectContaining({
          options: ["DEPLOY", "REMOVE"],
        }),
      })
    );
    expect(live.permissions).toEqual({
      actions: "write",
      contents: "write",
      "pull-requests": "read",
      statuses: "write",
    });
    expect(live.concurrency).toEqual({
      group: "deploy-hub-frontend-controller",
      "cancel-in-progress": false,
    });
    const source = fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/deploy-hub.yml"),
      "utf8"
    );
    expect(source).not.toContain("secrets.");
    expect(source).not.toContain("RELEASE_BUS_API_URL");
    expect(source).not.toContain("aws-actions/");
    expect(source).not.toContain("environment:");
    expect(live.jobs.operate.steps[0].run).toContain(
      'test "$GITHUB_REF" = "$EXPECTED_REF"'
    );
    expect(live.jobs.operate.steps[1].with.ref).toBe(
      "${{ github.workflow_sha }}"
    );
  });

  it("runs production independently through one bot-only continuation", () => {
    const production = workflow("deploy-hub-production.yml");
    expect(production.permissions).toEqual({
      actions: "write",
      checks: "read",
      contents: "write",
      "pull-requests": "write",
      statuses: "write",
    });
    expect(production.concurrency).toEqual({
      group: "deploy-hub-frontend-production",
      "cancel-in-progress": false,
    });
    expect(production.jobs.production.steps[0].run).toContain(
      'test "$GITHUB_ACTOR" = "github-actions[bot]"'
    );
    expect(production.jobs.production.steps[0].run).toContain(
      'test "$GITHUB_REF" = "$EXPECTED_REF"'
    );
    expect(production.jobs.production.steps[1].with.ref).toBe(
      "${{ github.workflow_sha }}"
    );
  });

  it.each(["deploy-staging.yml", "build-upload-deploy-prod.yml"])(
    "preserves manual readiness and adds a narrow Deploy Hub bypass in %s",
    (file) => {
      const parsed = workflow(file);
      const steps = parsed.jobs["manual-deployment-guard"].steps;
      expect(steps[0]).toMatchObject({
        env: expect.objectContaining({
          DEPLOY_HUB_CONTROLLER_OPERATION_ID:
            "${{ inputs.deploy_hub_controller_operation_id }}",
          DEPLOY_HUB_OPERATION_ID: "${{ inputs.deploy_hub_operation_id }}",
        }),
      });
      expect(steps[0].run).toContain(
        'test "$GITHUB_ACTOR" = "github-actions[bot]"'
      );
      expect(steps[0].run).toContain("manual-deployment-readiness");
      expect(parsed.jobs["manual-deployment-guard"].permissions).toEqual({
        actions: "read",
        contents: "read",
      });
      expect(steps[0].run).toContain("gh api");
      expect(steps[0].run).toContain(".head_repository.full_name");
      expect(steps[0].run).toContain(".display_title == $display_title");
      expect(steps[0].run).toContain("commits/$GITHUB_SHA");
      expect(steps[0].run).toContain(
        'startswith("Deploy Hub " + $operation + ":")'
      );
    }
  );

  it("keeps the canonical production deploy pinned while main advances", () => {
    const production = workflow("build-upload-deploy-prod.yml");
    expect(production.on.workflow_dispatch.inputs.allow_rollback).toEqual(
      expect.objectContaining({ default: false, type: "boolean" })
    );
    const preflight = production.jobs["build-upload-deploy"].steps.find(
      ({ name }: { name?: string }) =>
        name === "Confirm frozen production candidate remains safe"
    );
    expect(preflight).toBeDefined();
    expect(preflight.run).toContain("--current-production-sha");
    expect(preflight.run).toContain("--allow-rollback");
    expect(preflight.run).toContain("git ls-remote");
    expect(preflight.run).not.toContain("git fetch");
  });

  it("binds Deploy Hub E2E to the successful canonical deploy run", () => {
    const staging = workflow("staging-e2e.yml");
    expect(staging.jobs["baseline-adoption-decision"].if).toBe(
      "inputs.automatic_deploy_run_id != ''"
    );
    expect(staging.jobs["staging-packs"].steps[0].run).toContain(
      'test "$GITHUB_ACTOR" = "github-actions[bot]"'
    );
    expect(staging.jobs["staging-packs"].permissions.actions).toBe("read");
    expect(staging.jobs["staging-packs"].steps[0].run).toContain(
      '[[ "$AUTOMATIC_DEPLOY_RUN_ID" =~'
    );
    const stagingPublisher = staging.jobs["publish-deploy-hub-result"];
    expect(stagingPublisher).toBeDefined();
    expect(stagingPublisher.needs).toEqual([
      "baseline-adoption-decision",
      "staging-packs",
    ]);
    expect(stagingPublisher.if).toContain("always()");
    expect(stagingPublisher.permissions.statuses).toBe("write");
    expect(stagingPublisher.steps[0].run).toContain(
      'test "$GITHUB_ACTOR" = "github-actions[bot]"'
    );
    expect(stagingPublisher.steps[1].run).toContain(
      "Staging E2E did not run to completion"
    );
    const production = workflow("production-e2e.yml");
    expect(production.jobs.readonly.permissions.actions).toBe("read");
    const productionPublish = production.jobs["verify-evidence"].steps.find(
      ({ name }: { name?: string }) => name === "Publish Deploy Hub E2E result"
    );
    expect(productionPublish).toBeDefined();
    expect(productionPublish.env.EXPECTED_SHA).toBe(
      "${{ steps.release-identity.outputs.expected-sha }}"
    );

    for (const file of [
      "staging-e2e-dispatch.yml",
      "production-e2e-dispatch.yml",
    ]) {
      const source = fs.readFileSync(
        path.join(process.cwd(), ".github/workflows", file),
        "utf8"
      );
      expect(source).toContain("DEPLOY_DISPLAY_TITLE");
      expect(source).toContain(
        "deploy_hub_operation_id:$deploy_hub_operation_id"
      );
    }
    expect(staging["run-name"]).toContain("inputs.deploy_hub_operation_id");
    expect(production["run-name"]).toContain("inputs.deploy_hub_operation_id");
  });
});

describe("Deploy Hub operation state", () => {
  it("uses exact target, stop, E2E, and retry identities", () => {
    expect(statusContext("production")).toBe("Deploy Hub — Target: Production");
    expect(stopContext("operation-1")).toBe("Deploy Hub Stop — operation-1");
    expect(e2eContext("correlation-1")).toBe("Deploy Hub E2E — correlation-1");
    expect(correlationId("operation-1", "42r1", 1, "staging", 2)).toBe(
      "dh-42r1-c2-staging-a2"
    );
  });

  it.each([
    ["success", "success"],
    ["failure", "product"],
    ["error", "infrastructure"],
    [undefined, "infrastructure"],
  ])("classifies E2E state %s as %s", (state, conclusion) => {
    const statuses = state
      ? [{ context: e2eContext("correlation-1"), state }]
      : [];
    expect(classifyE2eStatus({ statuses }, "correlation-1")).toBe(conclusion);
  });

  it("waits for the exact correlated workflow run", async () => {
    const sleep = jest.fn().mockResolvedValue(undefined);
    const github = {
      listWorkflowRuns: jest
        .fn()
        .mockResolvedValueOnce({ workflow_runs: [] })
        .mockResolvedValueOnce({
          workflow_runs: [
            {
              display_title: "Deploy Hub exact — staging",
              head_sha: SHA_A,
              created_at: "2026-08-04T12:00:00.000Z",
              status: "completed",
              conclusion: "success",
            },
          ],
        }),
    };
    let clock = Date.parse("2026-08-04T11:59:00.000Z");
    const run = await waitForWorkflow({
      github,
      workflow: "deploy-staging.yml",
      branch: "1a-staging",
      displayTitle: "Deploy Hub exact — staging",
      expectedSha: SHA_A,
      sleep,
      now: () => (clock += 1),
    });
    expect(run.conclusion).toBe("success");
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it("performs one final workflow poll at the deadline", async () => {
    const github = {
      listWorkflowRuns: jest
        .fn()
        .mockResolvedValueOnce({ workflow_runs: [] })
        .mockResolvedValueOnce({
          workflow_runs: [
            {
              display_title: "Deploy Hub exact — staging",
              head_sha: SHA_A,
              created_at: "2026-08-04T12:00:00.000Z",
              status: "completed",
              conclusion: "success",
            },
          ],
        }),
    };
    const clock = [0, 0, 110 * 60 * 1000];
    await expect(
      waitForWorkflow({
        github,
        workflow: "deploy-staging.yml",
        branch: "1a-staging",
        displayTitle: "Deploy Hub exact — staging",
        expectedSha: SHA_A,
        sleep: jest.fn().mockResolvedValue(undefined),
        now: () => clock.shift() ?? 110 * 60 * 1000,
      })
    ).resolves.toMatchObject({ conclusion: "success" });
    expect(github.listWorkflowRuns).toHaveBeenCalledTimes(2);
  });

  it("retries one infrastructure staging failure with a new correlation", async () => {
    let correlation = "";
    let stagingAttempts = 0;
    const github = {
      async dispatchWorkflow(
        workflowName: string,
        _ref: string,
        inputs: Record<string, string>
      ) {
        correlation = inputs["deploy_hub_operation_id"] ?? correlation;
        if (workflowName === "deploy-staging.yml") stagingAttempts += 1;
      },
      async listWorkflowRuns(workflowName: string) {
        return {
          workflow_runs: [
            {
              display_title:
                workflowName === "deploy-staging.yml"
                  ? `Deploy Hub ${correlation} — staging`
                  : `Staging E2E [${correlation}]`,
              head_sha: SHA_A,
              created_at: "1970-01-01T00:00:00.000Z",
              status: "completed",
              conclusion:
                workflowName === "deploy-staging.yml" && stagingAttempts === 1
                  ? "failure"
                  : "success",
              html_url: RUN_URL,
            },
          ],
        };
      },
      async getCombinedStatus() {
        return {
          statuses: [{ context: e2eContext(correlation), state: "success" }],
        };
      },
    };
    await expect(
      validateWithRetry({
        github,
        sha: SHA_A,
        operationId: "operation-1",
        runId: "12345",
        runAttempt: "1",
        cohortIndex: 0,
        phase: "staging",
        sleep: jest.fn().mockResolvedValue(undefined),
        now: () => 0,
      })
    ).resolves.toMatchObject({
      conclusion: "success",
      correlation: "dh-12345r1-c1-staging-a2",
    });
    expect(stagingAttempts).toBe(2);
  });

  it("discovers durable queued requests in accepted status order", async () => {
    const requestedAt = "2026-08-04T12:00:00.000Z";
    const pulls = [
      {
        number: 124,
        head: { sha: SHA_B },
      },
      {
        number: 123,
        head: { sha: SHA_A },
      },
    ];
    const github = {
      async listOpenPullRequests() {
        return pulls;
      },
      async getCombinedStatus(sha: string) {
        const production = sha === SHA_A;
        return {
          statuses: [
            {
              context: QUEUED_REQUEST_CONTEXT,
              state: "pending",
              description: queuedRequestDescription(
                production ? "production" : "staging",
                "ui-batch",
                production ? 1 : 2,
                2,
                requestedAt
              ),
              created_at: requestedAt,
              creator: { login: ACTOR },
            },
          ],
        };
      },
    };

    await expect(
      discoverQueuedRequests(github, EXPECTED_REPOSITORY, "main")
    ).resolves.toEqual([
      {
        ...request("production", 123, SHA_A, requestedAt),
        source_operation_id: "ui-batch",
      },
      {
        ...request("staging", 124, SHA_B, requestedAt),
        source_operation_id: "ui-batch",
      },
    ]);
  });

  it("uses only the newest queued request status for a PR", async () => {
    const github = {
      async listOpenPullRequests() {
        return [{ number: 123, head: { sha: SHA_A } }];
      },
      async getCombinedStatus() {
        return {
          statuses: [
            {
              context: QUEUED_REQUEST_CONTEXT,
              state: "pending",
              description: queuedRequestDescription(
                "staging",
                "old-request",
                1,
                1,
                "2026-08-04T12:00:00.000Z"
              ),
              created_at: "2026-08-04T12:00:00.000Z",
              creator: { login: ACTOR },
            },
            {
              context: QUEUED_REQUEST_CONTEXT,
              state: "success",
              description: "Claimed by Deploy Hub run 12345",
              created_at: "2026-08-04T12:01:00.000Z",
              creator: { login: ACTOR },
            },
          ],
        };
      },
    };
    await expect(
      discoverQueuedRequests(github, EXPECTED_REPOSITORY, "main")
    ).resolves.toEqual([]);
  });

  it("enforces the shared operation ID limit when writing queue statuses", () => {
    expect(() =>
      queuedRequestDescription(
        "staging",
        `a${"b".repeat(80)}`,
        1,
        1,
        "2026-08-04T12:00:00.000Z"
      )
    ).toThrow("Operation ID is invalid.");
  });

  it("lets the newest explicit status replace an older request for one PR", () => {
    const submitted = [request("staging")];
    const queued = [
      request("production", 123, SHA_A, "2026-08-04T12:05:00.000Z"),
    ];
    expect(mergeQueuedRequests(submitted, queued)).toEqual(queued);
  });

  it("claims discovered request statuses before staging execution", async () => {
    const createCommitStatus = jest.fn().mockResolvedValue({});
    await claimQueuedRequests(
      { createCommitStatus },
      [request("staging")],
      RUN_URL,
      "12345"
    );
    expect(createCommitStatus).toHaveBeenCalledWith(
      SHA_A,
      expect.objectContaining({
        context: QUEUED_REQUEST_CONTEXT,
        state: "success",
        target_url: RUN_URL,
        description: "Claimed by Deploy Hub run 12345",
      })
    );
  });

  it("retains the original Stop identity when a later controller claims a request", async () => {
    const github = {
      async getCombinedStatus() {
        return {
          statuses: [{ context: stopContext("ui-original"), state: "pending" }],
        };
      },
    };
    const queued = {
      ...request("staging"),
      source_operation_id: "ui-original",
    };

    await expect(stopRequested(github, [queued], "ui-surviving")).resolves.toBe(
      true
    );
    await expect(
      stopRequested(github, [queued], "ui-surviving", {
        includeSourceOperations: false,
      })
    ).resolves.toBe(false);
  });

  it("does not let an older pending Stop override a newer terminal status", async () => {
    const github = {
      async getCombinedStatus() {
        return {
          statuses: [
            {
              context: stopContext("operation-1"),
              state: "pending",
              created_at: "2026-08-04T12:00:00.000Z",
            },
            {
              context: stopContext("operation-1"),
              state: "success",
              created_at: "2026-08-04T12:01:00.000Z",
            },
          ],
        };
      },
    };
    await expect(
      stopRequested(github, [request()], "operation-1")
    ).resolves.toBe(false);
  });
});

describe("Deploy Hub staging composition", () => {
  it("records exact active PRs in a parseable commit trailer", () => {
    const initial = { baseSha: SHA_B, requests: [] };
    const withRequest = addRequests(initial, [{ pr: 123, sha: SHA_A }]);
    const message = commitMessage("Deploy Hub operation-1: stage", withRequest);
    expect(parseComposition(message)).toEqual(withRequest);
    expect(removeRequest(withRequest, 123)).toEqual(initial);
  });

  it("rejects malformed composition metadata", () => {
    expect(() =>
      parseComposition("Deploy-Hub-Composition: not+base64")
    ).toThrow("Staging composition is invalid.");
  });

  it.each([
    Buffer.from("not-json").toString("base64url"),
    Buffer.from(JSON.stringify({ version: 1, prs: [] })).toString("base64url"),
    Buffer.from(
      JSON.stringify({ version: 1, base_sha: SHA_A, prs: {} })
    ).toString("base64url"),
  ])("rejects an invalid composition payload", (encoded) => {
    expect(() =>
      parseComposition(`Deploy-Hub-Composition: ${encoded}`)
    ).toThrow();
  });

  it("returns null when a commit has no Deploy Hub composition trailer", () => {
    expect(parseComposition("Manual staging commit")).toBeNull();
  });

  it("rebuilds tracked staging content on the latest main without losing active PRs", () => {
    const git = {
      remoteSha: jest.fn((ref: string) => (ref === "main" ? SHA_C : SHA_B)),
      fetchExact: jest.fn(),
      readCommitMessage: jest.fn().mockReturnValue(
        commitMessage("Deploy Hub prior", {
          baseSha: SHA_A,
          requests: [{ pr: 123, sha: SHA_D }],
        })
      ),
      sameTree: jest.fn(),
    };
    expect(compositionOnLatestBase(git, SHA_B, "main")).toEqual({
      baseSha: SHA_C,
      requests: [{ pr: 123, sha: SHA_D }],
    });
    expect(git.fetchExact).toHaveBeenCalledWith([SHA_B, SHA_C]);
    expect(git.sameTree).not.toHaveBeenCalled();
  });

  it("requires a clean main-equivalent baseline before the first live operation", () => {
    const git = {
      remoteSha: jest.fn().mockReturnValue(SHA_C),
      fetchExact: jest.fn(),
      readCommitMessage: jest.fn().mockReturnValue("Manual staging commit"),
      sameTree: jest.fn().mockReturnValue(false),
    };
    expect(() => compositionOnLatestBase(git, SHA_B, "main")).toThrow(
      "Current staging is not a Deploy Hub baseline."
    );
  });
});

describe("Deploy Hub operation clients", () => {
  it("reports merge conflicts explicitly", () => {
    const exec = jest.fn((_command, args: string[]) => {
      if (args[0] === "merge-tree") {
        throw Object.assign(new Error("conflict"), { status: 1 });
      }
      return "";
    });
    const git = createGitClient({ exec });
    expect(() =>
      git.mergeContent(SHA_B, [{ pr: 123, sha: SHA_A }], "Deploy Hub test")
    ).toThrow("Frontend PR #123 conflicts with staging.");
  });

  it("does not misreport an unavailable merge-tree command as a PR conflict", () => {
    const exec = jest.fn((_command, args: string[]) => {
      if (args[0] === "merge-tree") {
        throw Object.assign(new Error("unsupported"), { status: 129 });
      }
      return "";
    });
    const git = createGitClient({ exec });
    expect(() =>
      git.mergeContent(SHA_B, [{ pr: 123, sha: SHA_A }], "Deploy Hub test")
    ).toThrow("git merge-tree --write-tree is unavailable");
  });

  it("uses a non-force push so a staging ref race fails closed", () => {
    const exec = jest.fn().mockImplementation((_command, args: string[]) => {
      if (args[0] === "ls-remote") {
        return `${SHA_A}\trefs/heads/1a-staging\n`;
      }
      if (args[0] === "push") throw new Error("non-fast-forward");
      return "";
    });
    const git = createGitClient({ exec });
    expect(() => git.pushStaging(SHA_A, SHA_B)).toThrow("non-fast-forward");
    expect(exec.mock.calls[1][1]).toEqual(
      expect.arrayContaining([
        "push",
        "origin",
        `${SHA_B}:refs/heads/1a-staging`,
      ])
    );
    expect(exec.mock.calls[1][1]).not.toContainEqual(
      expect.stringContaining("force")
    );
  });

  it("paginates commit statuses before evaluating safety contexts", async () => {
    const first = Array.from({ length: 100 }, (_, index) => ({
      context: `status-${index}`,
      state: "success",
    }));
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => first,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ context: "last", state: "pending" }],
      });
    const github = createGithubClient({
      apiUrl: "https://api.github.com",
      repository: EXPECTED_REPOSITORY,
      token: "token",
      fetchImpl,
    });
    const result = await github.getCombinedStatus(SHA_A);
    expect(result.statuses).toHaveLength(101);
    expect(String(fetchImpl.mock.calls[1][0])).toContain("page=2");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("addresses nested branch refs as path segments", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ object: { sha: SHA_A } }),
    });
    const github = createGithubClient({
      apiUrl: "https://api.github.com",
      repository: EXPECTED_REPOSITORY,
      token: "token",
      fetchImpl,
    });
    await github.getRef("feature/nested");
    expect(String(fetchImpl.mock.calls[0]?.[0] ?? "")).toContain(
      "/git/ref/heads/feature/nested"
    );
  });

  it("retries transient GET requests but never retries writes", async () => {
    const sleepImpl = jest.fn().mockResolvedValue(undefined);
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: { get: () => "7" },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ state: "open" }),
      });
    const github = createGithubClient({
      apiUrl: "https://api.github.com",
      repository: EXPECTED_REPOSITORY,
      token: "token",
      fetchImpl,
      sleepImpl,
    });
    await expect(github.getPullRequest(123)).resolves.toEqual({
      state: "open",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleepImpl).toHaveBeenCalledWith(7_000);

    fetchImpl.mockReset().mockResolvedValue({
      ok: false,
      status: 503,
      headers: {},
    });
    await expect(
      github.createCommitStatus(SHA_A, { state: "pending" })
    ).rejects.toThrow("HTTP 503");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("reports a production merge that is not based on the expected main", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ merged: true, sha: SHA_D }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          sha: SHA_D,
          parents: [{ sha: SHA_E }, { sha: SHA_A }],
        }),
      });
    const github = createGithubClient({
      apiUrl: "https://api.github.com",
      repository: EXPECTED_REPOSITORY,
      token: "token",
      fetchImpl,
    });

    await expect(
      github.mergePullRequest(123, SHA_A, "operation-1", SHA_C)
    ).resolves.toMatchObject({ merged: true, sha: SHA_D, base_matched: false });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe("Deploy Hub production gates", () => {
  it("recognizes GitHub's maintain role as production authority", async () => {
    const github = {
      async getCollaboratorPermission() {
        return { role_name: "maintain", permission: "write" };
      },
    };
    await expect(
      assertAuthority(github, ACTOR, [request("production")])
    ).resolves.toBeUndefined();
  });

  it("waits for GitHub to calculate current PR mergeability", async () => {
    const sleep = jest.fn().mockResolvedValue(undefined);
    const getPullRequest = jest
      .fn()
      .mockResolvedValueOnce({
        state: "open",
        base: { ref: "main" },
        head: { sha: SHA_A },
        mergeable: null,
        mergeable_state: "unknown",
      })
      .mockResolvedValueOnce({
        state: "open",
        base: { ref: "main" },
        head: { sha: SHA_A },
        mergeable: true,
        mergeable_state: "clean",
      });
    const github = {
      async getRef() {
        return { object: { sha: SHA_C } };
      },
      getPullRequest,
      async getCheckRuns() {
        return {
          check_runs: [
            {
              name: "Installed app checks",
              status: "completed",
              conclusion: "success",
            },
          ],
        };
      },
      async getCombinedStatus() {
        return { statuses: [{ context: "DCO", state: "success" }] };
      },
    };
    await expect(
      assertProductionRequestPreflight(
        github,
        request("production"),
        "main",
        SHA_C,
        { sleep }
      )
    ).resolves.toBe(SHA_C);
    expect(getPullRequest).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it("requires the installed App PR CI check, not merely any green evidence", async () => {
    const github = {
      async getRef() {
        return { object: { sha: SHA_C } };
      },
      async getPullRequest() {
        return {
          state: "open",
          base: { ref: "main", sha: SHA_C },
          head: { sha: SHA_A },
          mergeable: true,
          mergeable_state: "clean",
        };
      },
      async getCheckRuns() {
        return {
          check_runs: [
            {
              name: "Installed app checks",
              status: "completed",
              conclusion: "skipped",
            },
            {
              name: "SonarCloud Code Analysis",
              status: "completed",
              conclusion: "success",
            },
          ],
        };
      },
      async getCombinedStatus() {
        return { statuses: [{ context: "DCO", state: "success" }] };
      },
    };

    await expect(
      assertProductionPreflight(github, [request("production")], "main")
    ).rejects.toThrow(
      "PR #123 required check Installed app checks is not successful."
    );
  });

  it("rechecks every PR against the main produced by the previous merge", async () => {
    let mainSha = SHA_C;
    const getPullRequest = jest.fn(async (pr: number) => ({
      state: "open",
      base: { ref: "main", sha: mainSha },
      head: { sha: pr === 123 ? SHA_A : SHA_B },
      mergeable: true,
      mergeable_state: "clean",
    }));
    const getCheckRuns = jest.fn(async () => ({
      check_runs: [
        {
          name: "Installed app checks",
          status: "completed",
          conclusion: "success",
        },
      ],
    }));
    const mergePullRequest = jest.fn(async (pr: number) => {
      mainSha = pr === 123 ? SHA_D : SHA_E;
      return { merged: true, sha: mainSha };
    });
    const github = {
      async getRef() {
        return { object: { sha: mainSha } };
      },
      getPullRequest,
      getCheckRuns,
      async getCombinedStatus() {
        return { statuses: [{ context: "DCO", state: "success" }] };
      },
      mergePullRequest,
    };

    await expect(
      mergeProductionRequests({
        github,
        requests: [
          request("production", 123, SHA_A),
          request("production", 124, SHA_B),
        ],
        operationId: "operation-1",
        baseRef: "main",
        runUrl: RUN_URL,
        expectedMainSha: SHA_C,
      })
    ).resolves.toEqual({ conclusion: "success", mainSha: SHA_E });
    expect(getPullRequest).toHaveBeenCalledTimes(2);
    expect(getCheckRuns).toHaveBeenCalledTimes(2);
    expect(mergePullRequest).toHaveBeenNthCalledWith(
      1,
      123,
      SHA_A,
      "operation-1",
      SHA_C
    );
    expect(mergePullRequest).toHaveBeenNthCalledWith(
      2,
      124,
      SHA_B,
      "operation-1",
      SHA_D
    );
  });

  it("stops production when GitHub merges against an advanced main", async () => {
    const createCommitStatus = jest.fn();
    const github = {
      async getRef() {
        return { object: { sha: SHA_C } };
      },
      async getPullRequest() {
        return {
          state: "open",
          base: { ref: "main", sha: SHA_C },
          head: { sha: SHA_A },
          mergeable: true,
          mergeable_state: "clean",
        };
      },
      async getCheckRuns() {
        return {
          check_runs: [
            {
              name: "Installed app checks",
              status: "completed",
              conclusion: "success",
            },
          ],
        };
      },
      async getCombinedStatus() {
        return { statuses: [{ context: "DCO", state: "success" }] };
      },
      async mergePullRequest() {
        return { merged: true, sha: SHA_D, base_matched: false };
      },
      createCommitStatus,
    };

    await expect(
      mergeProductionRequests({
        github,
        requests: [request("production")],
        operationId: "operation-1",
        baseRef: "main",
        runUrl: RUN_URL,
        expectedMainSha: SHA_C,
      })
    ).resolves.toEqual({ conclusion: "failure", mainSha: SHA_D });
    expect(createCommitStatus).toHaveBeenCalledWith(
      SHA_A,
      expect.objectContaining({
        state: "error",
        description: "Production stopped; main changed during PR #123 merge",
      })
    );
  });
});

describe("Deploy Hub remove from staging", () => {
  function removalHarness(removalConclusion: "success" | "product") {
    const statuses: Array<Record<string, unknown>> = [];
    let correlation = "";
    const github = {
      async getCollaboratorPermission() {
        return { permission: "write" };
      },
      async getPullRequest() {
        return {
          state: "open",
          merged: false,
          merged_at: null,
          base: { ref: "main" },
          head: { sha: SHA_A },
        };
      },
      async getCombinedStatus(sha: string) {
        if (sha === SHA_A) return { statuses: [] };
        const state =
          sha === SHA_C && removalConclusion === "product"
            ? "failure"
            : "success";
        return { statuses: [{ context: e2eContext(correlation), state }] };
      },
      async createCommitStatus(sha: string, status: Record<string, unknown>) {
        statuses.push({ sha, ...status });
      },
      async dispatchWorkflow(
        _workflow: string,
        _ref: string,
        inputs: Record<string, string>
      ) {
        correlation = inputs["deploy_hub_operation_id"] ?? "";
      },
      async listWorkflowRuns(workflowName: string) {
        const restoring = correlation.includes("remove-restore");
        return {
          workflow_runs: [
            {
              display_title:
                workflowName === "deploy-staging.yml"
                  ? `Deploy Hub ${correlation} — staging`
                  : `Staging E2E [${correlation}]`,
              head_sha: restoring ? SHA_E : SHA_C,
              created_at: "1970-01-01T00:00:00.000Z",
              status: "completed",
              conclusion: "success",
              html_url: RUN_URL,
            },
          ],
        };
      },
    };
    const forwardContent = jest
      .fn()
      .mockReturnValueOnce(SHA_C)
      .mockReturnValueOnce(SHA_E);
    const git = {
      remoteSha: jest
        .fn()
        .mockReturnValueOnce(SHA_B)
        .mockReturnValueOnce(SHA_D)
        .mockReturnValueOnce(SHA_C),
      fetchExact: jest.fn(),
      readCommitMessage: jest.fn().mockReturnValue(
        commitMessage("Deploy Hub prior", {
          baseSha: SHA_D,
          requests: [{ pr: 123, sha: SHA_A }],
        })
      ),
      mergeContent: jest.fn().mockReturnValue(SHA_D),
      forwardContent,
      pushStaging: jest.fn(),
    };
    return { github, git, statuses, forwardContent };
  }

  it("removes one tracked exact PR and validates the new staging snapshot", async () => {
    const harness = removalHarness("success");
    const result = await executeRemoveFromStaging({
      operationId: "remove-123",
      manifestJson: JSON.stringify([request()]),
      repository: EXPECTED_REPOSITORY,
      baseRef: "main",
      actor: ACTOR,
      runId: "12345",
      runUrl: RUN_URL,
      confirmation: "REMOVE",
      github: harness.github,
      git: harness.git,
      sleep: jest.fn().mockResolvedValue(undefined),
      now: () => 0,
    });
    expect(result.conclusion).toBe("success");
    expect(harness.git.mergeContent).toHaveBeenLastCalledWith(
      SHA_D,
      [],
      "Deploy Hub remove-123 remove"
    );
    expect(harness.statuses.at(-1)).toMatchObject({
      state: "success",
      description: "Not in staging; validated at cccccccccccc",
    });
  });

  it("restores and revalidates the prior snapshot when removal E2E fails", async () => {
    const harness = removalHarness("product");
    const result = await executeRemoveFromStaging({
      operationId: "remove-123",
      manifestJson: JSON.stringify([request()]),
      repository: EXPECTED_REPOSITORY,
      baseRef: "main",
      actor: ACTOR,
      runId: "12345",
      runUrl: RUN_URL,
      confirmation: "REMOVE",
      github: harness.github,
      git: harness.git,
      sleep: jest.fn().mockResolvedValue(undefined),
      now: () => 0,
    });
    expect(result).toMatchObject({ conclusion: "failure", stagingSha: SHA_E });
    expect(harness.forwardContent).toHaveBeenCalledTimes(2);
    expect(parseComposition(harness.forwardContent.mock.calls[1][2])).toEqual({
      baseSha: SHA_D,
      requests: [{ pr: 123, sha: SHA_A }],
    });
    expect(harness.statuses.at(-1)).toMatchObject({
      state: "success",
      description: "Still in staging at eeeeeeeeeeee",
    });
  });

  it("refuses to restore over a concurrent staging change", async () => {
    const harness = removalHarness("product");
    harness.git.remoteSha
      .mockReset()
      .mockReturnValueOnce(SHA_B)
      .mockReturnValueOnce(SHA_D)
      .mockReturnValueOnce(SHA_D);
    await expect(
      executeRemoveFromStaging({
        operationId: "remove-123",
        manifestJson: JSON.stringify([request()]),
        repository: EXPECTED_REPOSITORY,
        baseRef: "main",
        actor: ACTOR,
        runId: "12345",
        runUrl: RUN_URL,
        confirmation: "REMOVE",
        github: harness.github,
        git: harness.git,
        sleep: jest.fn().mockResolvedValue(undefined),
        now: () => 0,
      })
    ).rejects.toThrow(
      "Staging changed after removal; refusing to overwrite concurrent changes."
    );
    expect(harness.forwardContent).toHaveBeenCalledTimes(1);
  });

  it("stops before removal without touching staging", async () => {
    const statuses: Array<Record<string, unknown>> = [];
    let statusReads = 0;
    const github = {
      async getCollaboratorPermission() {
        return { permission: "write" };
      },
      async getPullRequest() {
        return {
          state: "open",
          merged: false,
          merged_at: null,
          base: { ref: "main" },
          head: { sha: SHA_A },
        };
      },
      async getCombinedStatus() {
        statusReads += 1;
        return {
          statuses:
            statusReads === 2
              ? [{ context: stopContext("remove-123"), state: "pending" }]
              : [],
        };
      },
      async createCommitStatus(sha: string, status: Record<string, unknown>) {
        statuses.push({ sha, ...status });
      },
    };
    const git = {
      remoteSha: jest.fn(),
      fetchExact: jest.fn(),
      readCommitMessage: jest.fn(),
      mergeContent: jest.fn(),
      forwardContent: jest.fn(),
      pushStaging: jest.fn(),
    };
    const result = await executeRemoveFromStaging({
      operationId: "remove-123",
      manifestJson: JSON.stringify([request()]),
      repository: EXPECTED_REPOSITORY,
      baseRef: "main",
      actor: ACTOR,
      runId: "12345",
      runUrl: RUN_URL,
      confirmation: "REMOVE",
      github,
      git,
    });
    expect(result.conclusion).toBe("stopped");
    expect(git.remoteSha).not.toHaveBeenCalled();
    expect(statuses.at(-1)).toMatchObject({
      target_url: RUN_URL,
      state: "error",
      description: "Stopped before staging removal",
    });
  });
});

describe("Deploy Hub tracked staging deploy", () => {
  it("publishes exact composition metadata with a successful staging cohort", async () => {
    const statuses: Array<Record<string, unknown>> = [];
    let correlation = "";
    const github = {
      async listOpenPullRequests() {
        return [];
      },
      async getCollaboratorPermission() {
        return { permission: "write" };
      },
      async getPullRequest() {
        return {
          state: "open",
          base: { ref: "main" },
          head: { sha: SHA_A },
          mergeable: true,
        };
      },
      async getCombinedStatus(sha: string) {
        if (sha === SHA_A) return { statuses: [] };
        return {
          statuses: [{ context: e2eContext(correlation), state: "success" }],
        };
      },
      async createCommitStatus(sha: string, status: Record<string, unknown>) {
        statuses.push({ sha, ...status });
      },
      async dispatchWorkflow(
        _workflow: string,
        _ref: string,
        inputs: Record<string, string>
      ) {
        correlation = inputs["deploy_hub_operation_id"] ?? "";
      },
      async listWorkflowRuns(workflowName: string) {
        return {
          workflow_runs: [
            {
              display_title:
                workflowName === "deploy-staging.yml"
                  ? `Deploy Hub ${correlation} — staging`
                  : `Staging E2E [${correlation}]`,
              head_sha: SHA_C,
              created_at: "1970-01-01T00:00:00.000Z",
              status: "completed",
              conclusion: "success",
              html_url: RUN_URL,
            },
          ],
        };
      },
    };
    const forwardContent = jest.fn().mockReturnValue(SHA_C);
    const git = {
      remoteSha: jest.fn().mockReturnValue(SHA_B),
      fetchExact: jest.fn(),
      readCommitMessage: jest.fn().mockReturnValue("Manual staging commit"),
      sameTree: jest.fn().mockReturnValue(true),
      mergeContent: jest.fn().mockReturnValue(SHA_D),
      forwardContent,
      pushStaging: jest.fn(),
    };
    const result = await executeStaging({
      operationId: "operation-1",
      manifestJson: JSON.stringify([request()]),
      repository: EXPECTED_REPOSITORY,
      baseRef: "main",
      actor: ACTOR,
      runId: "12345",
      runUrl: RUN_URL,
      confirmation: "DEPLOY",
      github,
      git,
      sleep: jest.fn().mockResolvedValue(undefined),
      now: () => 0,
    });
    expect(result.conclusion).toBe("success");
    const publishedMessage = forwardContent.mock.calls[0][2];
    expect(parseComposition(publishedMessage)).toEqual({
      baseSha: SHA_B,
      requests: [{ pr: 123, sha: SHA_A }],
    });
    expect(
      statuses.find(
        ({ context }) => context === "Deploy Hub — Staging Presence"
      )
    ).toMatchObject({
      state: "success",
      description: "In staging at cccccccccccc",
    });
  });

  it("dispatches production continuation on the configured base branch", async () => {
    let correlation = "";
    const dispatchWorkflow = jest.fn(
      async (
        workflowName: string,
        _ref: string,
        inputs: Record<string, string>
      ) => {
        if (workflowName === "deploy-staging.yml") {
          correlation = inputs["deploy_hub_operation_id"] ?? "";
        }
      }
    );
    const github = {
      async listOpenPullRequests() {
        return [];
      },
      async getCollaboratorPermission() {
        return { role_name: "maintain" };
      },
      async getPullRequest() {
        return {
          state: "open",
          base: { ref: "main" },
          head: { sha: SHA_A },
          mergeable: true,
        };
      },
      async getCombinedStatus(sha: string) {
        return sha === SHA_A
          ? { statuses: [] }
          : {
              statuses: [
                { context: e2eContext(correlation), state: "success" },
              ],
            };
      },
      async createCommitStatus() {},
      dispatchWorkflow,
      async listWorkflowRuns(workflowName: string) {
        return {
          workflow_runs: [
            {
              display_title:
                workflowName === "deploy-staging.yml"
                  ? `Deploy Hub ${correlation} — staging`
                  : `Staging E2E [${correlation}]`,
              head_sha: SHA_C,
              created_at: "1970-01-01T00:00:00.000Z",
              status: "completed",
              conclusion: "success",
              html_url: RUN_URL,
            },
          ],
        };
      },
    };
    const git = {
      remoteSha: jest.fn().mockReturnValue(SHA_B),
      fetchExact: jest.fn(),
      readCommitMessage: jest.fn().mockReturnValue("Manual staging commit"),
      sameTree: jest.fn().mockReturnValue(true),
      mergeContent: jest.fn().mockReturnValue(SHA_D),
      forwardContent: jest.fn().mockReturnValue(SHA_C),
      pushStaging: jest.fn(),
    };
    await expect(
      executeStaging({
        operationId: "operation-1",
        manifestJson: JSON.stringify([request("production")]),
        repository: EXPECTED_REPOSITORY,
        baseRef: "main",
        actor: ACTOR,
        runId: "12345",
        runUrl: RUN_URL,
        confirmation: "DEPLOY",
        github,
        git,
        sleep: jest.fn().mockResolvedValue(undefined),
        now: () => 0,
      })
    ).resolves.toMatchObject({ conclusion: "success" });
    expect(dispatchWorkflow).toHaveBeenLastCalledWith(
      "deploy-hub-production.yml",
      "main",
      expect.any(Object)
    );
  });
});

describe("Deploy Hub stop boundaries", () => {
  it("stops before staging without touching the staging ref", async () => {
    const statuses: Array<Record<string, unknown>> = [];
    const github = {
      async listOpenPullRequests() {
        return [];
      },
      async getCollaboratorPermission() {
        return { permission: "admin" };
      },
      async getPullRequest() {
        return {
          state: "open",
          base: { ref: "main" },
          head: { sha: SHA_A },
          mergeable: true,
        };
      },
      async getCombinedStatus() {
        return {
          statuses: [{ context: stopContext("operation-1"), state: "pending" }],
        };
      },
      async createCommitStatus(sha: string, status: Record<string, unknown>) {
        statuses.push({ sha, ...status });
      },
    };
    const git = {
      remoteSha: jest.fn(),
      fetchExact: jest.fn(),
      mergeContent: jest.fn(),
      forwardContent: jest.fn(),
      pushStaging: jest.fn(),
    };
    const result = await executeStaging({
      operationId: "operation-1",
      manifestJson: JSON.stringify([request()]),
      repository: EXPECTED_REPOSITORY,
      baseRef: "main",
      actor: ACTOR,
      runId: "12345",
      runUrl: RUN_URL,
      confirmation: "DEPLOY",
      github,
      git,
    });
    expect(result.conclusion).toBe("stopped");
    expect(git.remoteSha).not.toHaveBeenCalled();
    expect(statuses.at(-1)).toMatchObject({
      state: "error",
      description: "Stopped before staging mutation",
    });
  });

  it("terminalizes later cohorts when an earlier cohort stops", async () => {
    const statuses: Array<Record<string, unknown>> = [];
    const requests = [
      request("staging", 123, SHA_A),
      request("production", 124, SHA_B, "2026-08-04T12:05:00.000Z"),
    ];
    const github = {
      async listOpenPullRequests() {
        return [];
      },
      async getCollaboratorPermission() {
        return { permission: "admin" };
      },
      async getPullRequest(pr: number) {
        return {
          state: "open",
          base: { ref: "main" },
          head: { sha: pr === 123 ? SHA_A : SHA_B },
          mergeable: true,
        };
      },
      async getCombinedStatus() {
        return {
          statuses: [{ context: stopContext("operation-1"), state: "pending" }],
        };
      },
      async createCommitStatus(sha: string, status: Record<string, unknown>) {
        statuses.push({ sha, ...status });
      },
    };
    const git = {
      remoteSha: jest.fn(),
      fetchExact: jest.fn(),
      mergeContent: jest.fn(),
      forwardContent: jest.fn(),
      pushStaging: jest.fn(),
    };

    const result = await executeStaging({
      operationId: "operation-1",
      manifestJson: JSON.stringify(requests),
      repository: EXPECTED_REPOSITORY,
      baseRef: "main",
      actor: ACTOR,
      runId: "12345",
      runUrl: RUN_URL,
      confirmation: "DEPLOY",
      github,
      git,
    });

    expect(result.conclusion).toBe("stopped");
    expect(git.remoteSha).not.toHaveBeenCalled();
    expect(statuses.at(-1)).toMatchObject({
      sha: SHA_B,
      state: "error",
      description: "Not started because an earlier cohort stopped",
    });
  });

  it("terminalizes later cohorts when an earlier cohort fails", async () => {
    const statuses: Array<Record<string, unknown>> = [];
    let correlation = "";
    const requests = [
      request("staging", 123, SHA_A),
      request("production", 124, SHA_B, "2026-08-04T12:05:00.000Z"),
    ];
    const github = {
      async listOpenPullRequests() {
        return [];
      },
      async getCollaboratorPermission() {
        return { permission: "admin" };
      },
      async getPullRequest(pr: number) {
        return {
          state: "open",
          base: { ref: "main" },
          head: { sha: pr === 123 ? SHA_A : SHA_B },
          mergeable: true,
        };
      },
      async getCombinedStatus() {
        return { statuses: [] };
      },
      async createCommitStatus(sha: string, status: Record<string, unknown>) {
        statuses.push({ sha, ...status });
      },
      async dispatchWorkflow(
        _workflow: string,
        _ref: string,
        inputs: Record<string, string>
      ) {
        correlation = inputs["deploy_hub_operation_id"] ?? "";
      },
      async listWorkflowRuns() {
        return {
          workflow_runs: [
            {
              display_title: `Deploy Hub ${correlation} — staging`,
              head_sha: SHA_C,
              created_at: "1970-01-01T00:00:00.000Z",
              status: "completed",
              conclusion: "failure",
              html_url: RUN_URL,
            },
          ],
        };
      },
    };
    const git = {
      remoteSha: jest.fn().mockReturnValue(SHA_D),
      fetchExact: jest.fn(),
      readCommitMessage: jest.fn().mockReturnValue("Manual staging commit"),
      sameTree: jest.fn().mockReturnValue(true),
      mergeContent: jest.fn().mockReturnValue(SHA_E),
      forwardContent: jest.fn().mockReturnValue(SHA_C),
      pushStaging: jest.fn(),
    };

    const result = await executeStaging({
      operationId: "operation-1",
      manifestJson: JSON.stringify(requests),
      repository: EXPECTED_REPOSITORY,
      baseRef: "main",
      actor: ACTOR,
      runId: "12345",
      runUrl: RUN_URL,
      confirmation: "DEPLOY",
      github,
      git,
      sleep: jest.fn().mockResolvedValue(undefined),
      now: () => 0,
    });

    expect(result.conclusion).toBe("failure");
    expect(statuses.at(-1)).toMatchObject({
      sha: SHA_B,
      state: "error",
      description: "Not started because an earlier staging cohort failed",
    });
  });

  it("requires exact staging proof before a bot continuation can touch main", async () => {
    const statuses: Array<Record<string, unknown>> = [];
    const github = {
      async getWorkflowRun() {
        return {
          path: ".github/workflows/deploy-hub.yml",
          event: "workflow_dispatch",
          head_branch: "main",
          head_repository: { full_name: EXPECTED_REPOSITORY },
        };
      },
      async getCombinedStatus(sha: string) {
        if (sha === SHA_B) {
          return {
            statuses: [
              {
                context: e2eContext("dh-12345r1-c1-staging-a1"),
                state: "success",
              },
            ],
          };
        }
        return {
          statuses: [
            { context: "DCO", state: "success" },
            { context: stopContext("operation-1"), state: "pending" },
          ],
        };
      },
      async getCheckRuns() {
        return {
          check_runs: [
            {
              name: "Installed app checks",
              status: "completed",
              conclusion: "success",
            },
          ],
        };
      },
      async getCollaboratorPermission() {
        return { permission: "admin" };
      },
      async getPullRequest() {
        return {
          state: "open",
          base: { ref: "main", sha: SHA_C },
          head: { sha: SHA_A },
          mergeable: true,
          mergeable_state: "clean",
        };
      },
      async getRef() {
        return { object: { sha: SHA_C } };
      },
      async createCommitStatus(sha: string, status: Record<string, unknown>) {
        statuses.push({ sha, ...status });
      },
      mergePullRequest: jest.fn(),
    };
    const result = await executeProduction({
      operationId: "operation-1",
      manifestJson: JSON.stringify([request("production")]),
      repository: EXPECTED_REPOSITORY,
      baseRef: "main",
      actor: "github-actions[bot]",
      parentRunId: "12345",
      stagingSha: SHA_B,
      stagingCorrelation: "dh-12345r1-c1-staging-a1",
      runId: "67890",
      runUrl: RUN_URL,
      github,
    });
    expect(result.conclusion).toBe("stopped");
    expect(github.mergePullRequest).not.toHaveBeenCalled();
    expect(statuses.at(-1)).toMatchObject({
      description: "Stopped before main mutation",
    });
  });

  it("rejects a production cohort with a failing current PR check", async () => {
    const mergePullRequest = jest.fn();
    const github = {
      async getWorkflowRun() {
        return {
          path: ".github/workflows/deploy-hub.yml",
          event: "workflow_dispatch",
          head_branch: "main",
          head_repository: { full_name: EXPECTED_REPOSITORY },
        };
      },
      async getCombinedStatus(sha: string) {
        if (sha === SHA_B) {
          return {
            statuses: [
              {
                context: e2eContext("dh-12345r1-c1-staging-a1"),
                state: "success",
              },
            ],
          };
        }
        return { statuses: [{ context: "DCO", state: "success" }] };
      },
      async getCheckRuns() {
        return {
          check_runs: [
            {
              name: "Installed app checks",
              status: "completed",
              conclusion: "failure",
            },
          ],
        };
      },
      async getCollaboratorPermission() {
        return { permission: "admin" };
      },
      async getPullRequest() {
        return {
          state: "open",
          base: { ref: "main", sha: SHA_C },
          head: { sha: SHA_A },
          mergeable: true,
          mergeable_state: "clean",
        };
      },
      async getRef() {
        return { object: { sha: SHA_C } };
      },
      mergePullRequest,
    };

    await expect(
      executeProduction({
        operationId: "operation-1",
        manifestJson: JSON.stringify([request("production")]),
        repository: EXPECTED_REPOSITORY,
        baseRef: "main",
        actor: "github-actions[bot]",
        parentRunId: "12345",
        stagingSha: SHA_B,
        stagingCorrelation: "dh-12345r1-c1-staging-a1",
        runId: "67890",
        runUrl: RUN_URL,
        github,
      })
    ).rejects.toThrow(
      "PR #123 required check Installed app checks is not successful."
    );
    expect(mergePullRequest).not.toHaveBeenCalled();
  });

  it("settles an issued production flow before honoring Stop", async () => {
    const statuses: Array<Record<string, unknown>> = [];
    let stop = false;
    let currentMainSha = SHA_B;
    const correlation = "dh-67890r1-c1-production-a1";
    const github = {
      async getWorkflowRun() {
        return {
          path: ".github/workflows/deploy-hub.yml",
          event: "workflow_dispatch",
          head_branch: "main",
          head_repository: { full_name: EXPECTED_REPOSITORY },
        };
      },
      async getCombinedStatus(sha: string) {
        if (sha === SHA_B) {
          return {
            statuses: [
              {
                context: e2eContext("dh-12345r1-c1-staging-a1"),
                state: "success",
              },
            ],
          };
        }
        if (sha === SHA_C) {
          return {
            statuses: [{ context: e2eContext(correlation), state: "success" }],
          };
        }
        return {
          statuses: [
            { context: "DCO", state: "success" },
            ...(stop
              ? [{ context: stopContext("operation-1"), state: "pending" }]
              : []),
          ],
        };
      },
      async getCheckRuns() {
        return {
          check_runs: [
            {
              name: "Installed app checks",
              status: "completed",
              conclusion: "success",
            },
          ],
        };
      },
      async getCollaboratorPermission() {
        return { permission: "admin" };
      },
      async getPullRequest() {
        return {
          state: "open",
          base: { ref: "main", sha: SHA_B },
          head: { sha: SHA_A },
          mergeable: true,
          mergeable_state: "clean",
        };
      },
      async getRef() {
        return { object: { sha: currentMainSha } };
      },
      async mergePullRequest() {
        currentMainSha = SHA_C;
        return { merged: true, sha: currentMainSha };
      },
      async dispatchWorkflow() {},
      async listWorkflowRuns(workflowName: string) {
        if (workflowName === "build-upload-deploy-prod.yml") {
          return {
            workflow_runs: [
              {
                display_title: `Deploy Hub ${correlation} — production`,
                head_sha: SHA_C,
                created_at: "2026-08-04T12:00:00.000Z",
                status: "completed",
                conclusion: "success",
                html_url: RUN_URL,
              },
            ],
          };
        }
        stop = true;
        return {
          workflow_runs: [
            {
              display_title: `Production E2E [${correlation}]`,
              created_at: "2026-08-04T12:00:00.000Z",
              status: "completed",
              conclusion: "success",
              html_url: RUN_URL,
            },
          ],
        };
      },
      async createCommitStatus(sha: string, status: Record<string, unknown>) {
        statuses.push({ sha, ...status });
      },
    };
    const result = await executeProduction({
      operationId: "operation-1",
      manifestJson: JSON.stringify([request("production")]),
      repository: EXPECTED_REPOSITORY,
      baseRef: "main",
      actor: "github-actions[bot]",
      parentRunId: "12345",
      stagingSha: SHA_B,
      stagingCorrelation: "dh-12345r1-c1-staging-a1",
      runId: "67890",
      runAttempt: "1",
      runUrl: RUN_URL,
      github,
      sleep: jest.fn().mockResolvedValue(undefined),
      now: () => Date.parse("2026-08-04T12:00:00.000Z"),
    });
    expect(result.conclusion).toBe("stopped");
    expect(statuses.at(-1)).toMatchObject({
      state: "error",
      description: "Stopped after production settled at cccccccccccc",
    });
  });
});
