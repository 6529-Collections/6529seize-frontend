const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

const {
  EXPECTED_REPOSITORY,
  createGitPlanner,
  createSummary,
  executeShadow,
  normalizeManifest,
  parseComposition,
  partitionCohorts,
  planStagingContent,
  statusContext,
} = require("../../ops/scripts/deploy-hub-shadow.cjs");

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
    requested_at: "2026-08-06T12:00:00.000Z",
  };
}

function githubHarness(heads: Record<number, string>) {
  const statuses: Array<{ sha: string; status: Record<string, string> }> = [];
  return {
    statuses,
    async createCommitStatus(sha: string, status: Record<string, string>) {
      statuses.push({ sha, status });
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
      return { statuses: [{ context: "DCO", state: "success" }] };
    },
    async getPullRequest(pr: number) {
      return {
        state: "open",
        base: { ref: "main" },
        head: { sha: heads[pr] },
        mergeable: true,
      };
    },
    async getRef() {
      return { object: { sha: SHA_D } };
    },
  };
}

function gitHarness({ tracked = false, sameTree = true } = {}) {
  const mergeContent = jest
    .fn()
    .mockReturnValueOnce(SHA_B)
    .mockReturnValueOnce(SHA_C);
  const composition = Buffer.from(
    JSON.stringify({
      version: 1,
      base_sha: SHA_A,
      prs: [{ pr: 99, sha: SHA_C }],
    })
  ).toString("base64url");
  return {
    remoteSha: jest.fn((ref: string) => (ref === "main" ? SHA_D : SHA_A)),
    fetchExact: jest.fn(),
    readCommitMessage: jest
      .fn()
      .mockReturnValue(
        tracked
          ? `Deploy Hub prior\n\nDeploy-Hub-Composition: ${composition}`
          : "Manual staging commit"
      ),
    sameTree: jest.fn().mockReturnValue(sameTree),
    mergeContent,
  };
}

describe("Deploy Hub FE dry-run workflow", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), ".github/workflows/deploy-hub-shadow.yml"),
    "utf8"
  );
  const workflow = YAML.parse(source);

  it("is manual-only and cannot deploy or change a branch", () => {
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
    expect(steps[0].run).toContain('test "$GITHUB_REF" = "$EXPECTED_REF"');
    expect(steps[1].with).toMatchObject({
      ref: "${{ github.workflow_sha }}",
      "fetch-depth": 0,
      "persist-credentials": false,
    });
    expect(steps[2].run).toContain("deploy-hub-shadow.cjs");
  });
});

describe("Deploy Hub FE dry-run planning", () => {
  it("freezes exact requests and retains adjacent target order", () => {
    const requests = normalizeManifest(
      JSON.stringify([
        request(1, SHA_A, "production"),
        request(2, SHA_B, "production"),
        request(3, SHA_C, "staging"),
      ]),
      ACTOR,
      EXPECTED_REPOSITORY
    );
    expect(partitionCohorts(requests)).toEqual([
      { target: "production", requests: requests.slice(0, 2) },
      { target: "staging", requests: requests.slice(2) },
    ]);
    expect(Object.isFrozen(requests[0])).toBe(true);
  });

  it("rebuilds on latest main and preserves tracked staged PRs", () => {
    const git = gitHarness({ tracked: true });
    const plan = planStagingContent({
      git,
      requests: [request(1, SHA_A, "staging")],
      operationId: "operation-1",
      baseRef: "main",
    });
    expect(plan).toMatchObject({
      stagingSha: SHA_A,
      mainSha: SHA_D,
      baselineRequired: false,
    });
    expect(git.mergeContent).toHaveBeenCalledWith(
      SHA_D,
      [
        { pr: 99, sha: SHA_C },
        { pr: 1, sha: SHA_A },
      ],
      "operation-1"
    );
  });

  it("reports when the one-time live baseline is still needed", () => {
    const plan = planStagingContent({
      git: gitHarness({ sameTree: false }),
      requests: [request(1, SHA_A, "staging")],
      operationId: "operation-1",
      baseRef: "main",
    });
    expect(plan.baselineRequired).toBe(true);
  });

  it("rejects invalid composition metadata", () => {
    expect(() => parseComposition("Deploy-Hub-Composition: invalid")).toThrow(
      "Staging composition metadata is invalid."
    );
  });

  it("does not mislabel an unavailable merge-tree command as a conflict", () => {
    const exec = jest.fn((_command, args: string[]) => {
      if (args[0] === "merge-tree") {
        throw Object.assign(new Error("unsupported"), { status: 129 });
      }
      return "";
    });
    const git = createGitPlanner({ exec });
    expect(() =>
      git.mergeContent(SHA_D, [{ pr: 1, sha: SHA_A }], "operation-1")
    ).toThrow("unsupported");
  });
});

describe("Deploy Hub FE dry-run execution", () => {
  it("validates the real plan and only publishes dry-run statuses", async () => {
    const github = githubHarness({ 1: SHA_A, 2: SHA_B });
    const git = gitHarness();
    const result = await executeShadow({
      operationId: "operation-1",
      manifestJson: JSON.stringify([
        request(1, SHA_A, "staging"),
        request(2, SHA_B, "production"),
      ]),
      repository: EXPECTED_REPOSITORY,
      baseRef: "main",
      actor: ACTOR,
      runUrl: RUN_URL,
      github,
      git,
    });
    expect(result.conclusion).toBe("success");
    expect(github.statuses).toHaveLength(4);
    expect(github.statuses.at(-1)).toEqual({
      sha: SHA_B,
      status: expect.objectContaining({
        state: "success",
        context: "Deploy Hub Dry Run — Target: Production",
      }),
    });
    expect(github).not.toHaveProperty("dispatchWorkflow");
    expect(git).not.toHaveProperty("pushStaging");
    expect(createSummary(result, RUN_URL)).toContain("READ ONLY");
  });

  it("fails closed when an exact PR head moved", async () => {
    const github = githubHarness({ 1: SHA_B });
    await expect(
      executeShadow({
        operationId: "operation-stale",
        manifestJson: JSON.stringify([request(1, SHA_A, "staging")]),
        repository: EXPECTED_REPOSITORY,
        baseRef: "main",
        actor: ACTOR,
        runUrl: RUN_URL,
        github,
        git: gitHarness(),
      })
    ).rejects.toThrow("PR #1 head moved.");
    expect(github.statuses.at(-1)?.status).toMatchObject({ state: "error" });
  });

  it("requires the production installed-app check to have passed", async () => {
    const github = githubHarness({ 1: SHA_A });
    github.getCheckRuns = async () => ({
      check_runs: [
        {
          name: "Installed app checks",
          status: "completed",
          conclusion: "skipped",
        },
      ],
    });
    await expect(
      executeShadow({
        operationId: "operation-checks",
        manifestJson: JSON.stringify([request(1, SHA_A, "production")]),
        repository: EXPECTED_REPOSITORY,
        baseRef: "main",
        actor: ACTOR,
        runUrl: RUN_URL,
        github,
        git: gitHarness(),
      })
    ).rejects.toThrow("did not pass Installed app checks");
  });

  it("uses target-specific dry-run status contexts", () => {
    expect(statusContext("staging")).toBe(
      "Deploy Hub Dry Run — Target: Staging"
    );
    expect(statusContext("production")).toBe(
      "Deploy Hub Dry Run — Target: Production"
    );
  });
});
