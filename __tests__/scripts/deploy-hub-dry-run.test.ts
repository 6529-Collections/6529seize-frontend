const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

const {
  createFailureSummary,
  createSummary,
  executeDryRun,
  statusContext,
} = require("../../ops/scripts/deploy-hub-dry-run.cjs");
const {
  EXPECTED_REPOSITORY,
  normalizeManifest,
  partitionCohorts,
} = require("../../ops/scripts/deploy-hub-manifest.cjs");

const SHA_A = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const SHA_B = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const SHA_C = "cccccccccccccccccccccccccccccccccccccccc";
const SHA_D = "dddddddddddddddddddddddddddddddddddddddd";
const ACTOR = "prxt6529";
const RUN_URL =
  "https://github.com/6529-Collections/6529seize-frontend/actions/runs/12345";

function request(pr: number, sha: string, target: "staging" | "production") {
  return {
    repository: EXPECTED_REPOSITORY,
    pr,
    sha,
    target,
    requester: ACTOR,
    requested_at: "2026-08-04T12:00:00.000Z",
  };
}

function githubForHeads(heads: Record<number, string>) {
  const statuses: Array<{
    sha: string;
    status: Record<string, string>;
  }> = [];
  return {
    statuses,
    async createCommitStatus(sha: string, status: Record<string, string>) {
      statuses.push({ sha, status });
      return {};
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
      return { role_name: "maintain" };
    },
    async getCombinedStatus() {
      return { statuses: [] };
    },
    async getPullRequest(pr: number) {
      return {
        state: "open",
        draft: false,
        base: { ref: "main" },
        head: { sha: heads[pr] },
        mergeable: true,
        mergeable_state: "clean",
      };
    },
    async getRef() {
      return { object: { sha: SHA_D } };
    },
  };
}

function gitPlanner() {
  const mergeContent = jest
    .fn()
    .mockReturnValueOnce(SHA_B)
    .mockReturnValueOnce(SHA_C);
  return {
    fetchExact: jest.fn(),
    mergeContent,
    readCommitMessage: jest.fn().mockReturnValue("Manual staging commit"),
    remoteSha: jest.fn().mockReturnValue(SHA_A),
  };
}

describe("Deploy Hub FE dry-run workflow", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), ".github/workflows/deploy-hub-shadow.yml"),
    "utf8"
  );
  const workflow = YAML.parse(source);

  it("has read-only controller permissions apart from PR status projection", () => {
    expect(workflow.on).toEqual({
      workflow_dispatch: {
        inputs: {
          operation_id: expect.objectContaining({ required: true }),
          manifest: expect.objectContaining({ required: true }),
        },
      },
    });
    expect(workflow.permissions).toEqual({
      checks: "read",
      contents: "read",
      "pull-requests": "read",
      statuses: "write",
    });
    expect(workflow.jobs.shadow.permissions).toEqual(workflow.permissions);
    expect(source).not.toContain("secrets.");
    expect(source).not.toContain("contents: write");
    expect(source).not.toContain("actions: write");
    expect(source).not.toContain("deployments:");
    expect(source).not.toContain("id-token:");
    expect(source).not.toContain("environment:");
    expect(source).not.toContain("aws-actions/");
  });

  it("runs immutable default-branch code without checkout credentials", () => {
    const steps = workflow.jobs.shadow.steps;
    expect(steps[0].name).toBe("Require default-branch dispatch");
    expect(steps[0].run).toContain('test "$GITHUB_REF" = "$EXPECTED_REF"');
    expect(steps[1].with).toMatchObject({
      ref: "${{ github.workflow_sha }}",
      "fetch-depth": 0,
      "persist-credentials": false,
      "sparse-checkout": "ops/scripts",
    });
    expect(steps.at(-1).run).toContain("deploy-hub-dry-run.cjs");
  });
});

describe("Deploy Hub FE manifest", () => {
  it("freezes exact requests and partitions adjacent equal targets", () => {
    const manifest = [
      request(1, SHA_A, "production"),
      request(2, SHA_B, "production"),
      request(3, SHA_C, "staging"),
    ];
    const normalized = normalizeManifest(
      JSON.stringify(manifest),
      ACTOR,
      EXPECTED_REPOSITORY
    );
    expect(normalized).toEqual(manifest);
    expect(partitionCohorts(normalized)).toEqual([
      { target: "production", requests: normalized.slice(0, 2) },
      { target: "staging", requests: normalized.slice(2) },
    ]);
    expect(Object.isFrozen(normalized[0])).toBe(true);
  });

  it("rejects a manifest whose requester is not the dispatching actor", () => {
    expect(() =>
      normalizeManifest(
        JSON.stringify([
          { ...request(1, SHA_A, "staging"), requester: "someone-else" },
        ]),
        ACTOR,
        EXPECTED_REPOSITORY
      )
    ).toThrow("requester must match");
  });
});

describe("Deploy Hub FE dry-run execution", () => {
  it("validates real staging and production plans without remote mutation", async () => {
    const github = githubForHeads({ 1: SHA_A, 2: SHA_B });
    const git = gitPlanner();
    const manifest = [
      request(1, SHA_A, "staging"),
      request(2, SHA_B, "production"),
    ];
    const result = await executeDryRun({
      operationId: "operation-1",
      manifestJson: JSON.stringify(manifest),
      repository: EXPECTED_REPOSITORY,
      baseRef: "main",
      actor: ACTOR,
      runUrl: RUN_URL,
      github,
      git,
    });

    expect(result).toMatchObject({
      conclusion: "success",
      mainSha: SHA_D,
      stagingSha: SHA_A,
    });
    expect(result.cohorts).toHaveLength(2);
    expect(git.mergeContent).toHaveBeenCalledTimes(2);
    expect(github.statuses).toHaveLength(4);
    expect(github.statuses.at(-1)).toEqual({
      sha: SHA_B,
      status: {
        state: "success",
        target_url: RUN_URL,
        description:
          "DRY RUN passed: exact deployment plan is valid; nothing deployed",
        context: "Deploy Hub Shadow — Target: Production",
      },
    });
    expect(github).not.toHaveProperty("dispatchWorkflow");
    expect(git).not.toHaveProperty("pushStaging");
  });

  it("fails closed and reports a moved exact PR head", async () => {
    const github = githubForHeads({ 1: SHA_B });
    await expect(
      executeDryRun({
        operationId: "operation-stale",
        manifestJson: JSON.stringify([request(1, SHA_A, "staging")]),
        repository: EXPECTED_REPOSITORY,
        baseRef: "main",
        actor: ACTOR,
        runUrl: RUN_URL,
        github,
        git: gitPlanner(),
      })
    ).rejects.toThrow("PR #1 head moved");
    expect(github.statuses.at(-1)?.status).toMatchObject({
      state: "error",
      context: "Deploy Hub Shadow — Target: Staging",
    });
  });

  it("publishes clear read-only summaries", async () => {
    const github = githubForHeads({ 1: SHA_A });
    const result = await executeDryRun({
      operationId: "operation-summary",
      manifestJson: JSON.stringify([request(1, SHA_A, "staging")]),
      repository: EXPECTED_REPOSITORY,
      baseRef: "main",
      actor: ACTOR,
      runUrl: RUN_URL,
      github,
      git: gitPlanner(),
    });
    const summary = createSummary(result, RUN_URL);
    expect(summary).toContain("READ ONLY");
    expect(summary).toContain("deploy-staging.yml");
    expect(summary).toContain("never pushed");
    expect(createFailureSummary("PR head moved")).toContain("PR head moved");
  });

  it("keeps target-specific shadow status contexts for the existing UI", () => {
    expect(statusContext("staging")).toBe(
      "Deploy Hub Shadow — Target: Staging"
    );
    expect(statusContext("production")).toBe(
      "Deploy Hub Shadow — Target: Production"
    );
  });
});
