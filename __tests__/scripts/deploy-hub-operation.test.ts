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
  statusContext,
  stopContext,
  waitForWorkflow,
} = require("../../ops/scripts/deploy-hub-operation.cjs");
const {
  addRequests,
  commitMessage,
  parseComposition,
  removeRequest,
} = require("../../ops/scripts/deploy-hub-staging-composition.cjs");
const {
  EXPECTED_REPOSITORY,
} = require("../../ops/scripts/deploy-hub-shadow.cjs");

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

function request(target: "staging" | "production" = "staging") {
  return {
    repository: EXPECTED_REPOSITORY,
    pr: 123,
    sha: SHA_A,
    target,
    requester: ACTOR,
    requested_at: "2026-08-04T12:00:00.000Z",
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
          DEPLOY_HUB_OPERATION_ID: "${{ inputs.deploy_hub_operation_id }}",
        }),
      });
      expect(steps[0].run).toContain(
        'test "$GITHUB_ACTOR" = "github-actions[bot]"'
      );
      expect(steps[0].run).toContain("manual-deployment-readiness");
    }
  );

  it("keeps automatic staging E2E out of correlated Deploy Hub deploys", () => {
    const staging = workflow("staging-e2e.yml");
    expect(staging.jobs["baseline-adoption-decision"].if).toContain(
      "!startsWith(github.event.workflow_run.display_title, 'Deploy Hub ')"
    );
    expect(staging.jobs["staging-packs"].if).toContain(
      "!startsWith(github.event.workflow_run.display_title, 'Deploy Hub ')"
    );
    expect(staging.jobs["staging-packs"].steps[0].run).toContain(
      'test "$GITHUB_ACTOR" = "github-actions[bot]"'
    );
    const production = workflow("production-e2e.yml");
    expect(production.jobs.readonly.steps[0].run).toContain(
      'test "$GITHUB_ACTOR" = "github-actions[bot]"'
    );
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
});

describe("Deploy Hub operation clients", () => {
  it("reports merge conflicts explicitly", () => {
    const exec = jest.fn((_command, args: string[]) => {
      if (args[0] === "merge-tree") throw new Error("conflict");
      return "";
    });
    const git = createGitClient({ exec });
    expect(() =>
      git.mergeContent(SHA_B, [{ pr: 123, sha: SHA_A }], "Deploy Hub test")
    ).toThrow("Frontend PR #123 conflicts with staging.");
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
    expect(harness.git.mergeContent).toHaveBeenCalledWith(
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
    expect(statuses.at(-2)).toMatchObject({
      state: "success",
      description: "In staging at cccccccccccc",
    });
  });
});

describe("Deploy Hub stop boundaries", () => {
  it("stops before staging without touching the staging ref", async () => {
    const statuses: Array<Record<string, unknown>> = [];
    const github = {
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
          statuses: [{ context: stopContext("operation-1"), state: "pending" }],
        };
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
      requester: ACTOR,
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

  it("settles an issued production flow before honoring Stop", async () => {
    const statuses: Array<Record<string, unknown>> = [];
    let stop = false;
    let refReads = 0;
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
        if (sha === "c".repeat(40)) {
          return {
            statuses: [{ context: e2eContext(correlation), state: "success" }],
          };
        }
        return {
          statuses: stop
            ? [{ context: stopContext("operation-1"), state: "pending" }]
            : [],
        };
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
      async getRef() {
        refReads += 1;
        return { object: { sha: refReads === 1 ? SHA_B : "c".repeat(40) } };
      },
      async mergePullRequest() {
        return { merged: true, sha: "c".repeat(40) };
      },
      async dispatchWorkflow() {},
      async listWorkflowRuns(workflowName: string) {
        if (workflowName === "build-upload-deploy-prod.yml") {
          return {
            workflow_runs: [
              {
                display_title: `Deploy Hub ${correlation} — production`,
                head_sha: "c".repeat(40),
                created_at: new Date().toISOString(),
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
              created_at: new Date().toISOString(),
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
      requester: ACTOR,
      parentRunId: "12345",
      stagingSha: SHA_B,
      stagingCorrelation: "dh-12345r1-c1-staging-a1",
      runId: "67890",
      runAttempt: "1",
      runUrl: RUN_URL,
      github,
      sleep: jest.fn().mockResolvedValue(undefined),
      now: Date.now,
    });
    expect(result.conclusion).toBe("stopped");
    expect(statuses.at(-1)).toMatchObject({
      state: "error",
      description: "Stopped after production settled at cccccccccccc",
    });
  });
});
