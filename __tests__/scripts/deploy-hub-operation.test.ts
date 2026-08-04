const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

const {
  classifyE2eStatus,
  correlationId,
  e2eContext,
  executeProduction,
  executeStaging,
  statusContext,
  stopContext,
  waitForWorkflow,
} = require("../../ops/scripts/deploy-hub-operation.cjs");
const {
  EXPECTED_REPOSITORY,
} = require("../../ops/scripts/deploy-hub-shadow.cjs");

const ACTOR = "prxt6529";
const SHA_A = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const SHA_B = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
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
        manifest: expect.objectContaining({ required: true }),
        confirmation: expect.objectContaining({ options: ["DEPLOY"] }),
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
  });
});

describe("Deploy Hub operation state", () => {
  it("uses exact target, stop, E2E, and retry identities", () => {
    expect(statusContext("production")).toBe("Deploy Hub — Target: Production");
    expect(stopContext("operation-1")).toBe("Deploy Hub Stop — operation-1");
    expect(e2eContext("correlation-1")).toBe("Deploy Hub E2E — correlation-1");
    expect(correlationId("operation-1", "42r1", 1, "staging", 2)).toBe(
      "operation-1-42r1-c2-staging-a2"
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
              status: "completed",
              conclusion: "success",
            },
          ],
        }),
    };
    let clock = 0;
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
        };
      },
      async getCombinedStatus(sha: string) {
        if (sha === SHA_B) {
          return {
            statuses: [
              { context: e2eContext("staging-proof"), state: "success" },
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
      stagingCorrelation: "staging-proof",
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
    let requestStatusReads = 0;
    let refReads = 0;
    const correlation = "operation-1-67890r1-c1-production-a1";
    const github = {
      async getWorkflowRun() {
        return {
          path: ".github/workflows/deploy-hub.yml",
          event: "workflow_dispatch",
        };
      },
      async getCombinedStatus(sha: string) {
        if (sha === SHA_B) {
          return {
            statuses: [
              { context: e2eContext("staging-proof"), state: "success" },
            ],
          };
        }
        if (sha === "c".repeat(40)) {
          return {
            statuses: [{ context: e2eContext(correlation), state: "success" }],
          };
        }
        requestStatusReads += 1;
        return {
          statuses:
            requestStatusReads === 3
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
                status: "completed",
                conclusion: "success",
                html_url: RUN_URL,
              },
            ],
          };
        }
        return {
          workflow_runs: [
            {
              display_title: `Production E2E [${correlation}]`,
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
      stagingCorrelation: "staging-proof",
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
