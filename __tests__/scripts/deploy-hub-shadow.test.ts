const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

const {
  EXPECTED_REPOSITORY,
  executeShadow,
  normalizeManifest,
  partitionCohorts,
  statusContext,
  statusPlan,
} = require("../../ops/scripts/deploy-hub-shadow.cjs");

const SHA_A = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const SHA_B = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const SHA_C = "cccccccccccccccccccccccccccccccccccccccc";
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
    async getPullRequest(pr: number) {
      return {
        state: "open",
        base: { ref: "main" },
        head: { sha: heads[pr] },
      };
    },
    async createCommitStatus(sha: string, status: Record<string, string>) {
      statuses.push({ sha, status });
      return {};
    },
  };
}

describe("Deploy Hub FE shadow workflow", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), ".github/workflows/deploy-hub-shadow.yml"),
    "utf8"
  );
  const workflow = YAML.parse(source);

  it("is manually dispatched with only read and shadow-status authority", () => {
    expect(workflow.on).toEqual({
      workflow_dispatch: {
        inputs: expect.objectContaining({
          operation_id: expect.objectContaining({ required: true }),
          manifest: expect.objectContaining({ required: true }),
          scenario: expect.objectContaining({
            options: [
              "success",
              "product-failure",
              "infrastructure-failure",
              "cancelled",
              "stale",
            ],
          }),
        }),
      },
    });
    expect(workflow.permissions).toEqual({
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
    expect(source).not.toContain("deploy-staging.yml");
    expect(source).not.toContain("build-upload-deploy-prod.yml");
  });

  it("runs immutable workflow code from the default branch without checkout credentials", () => {
    const steps = workflow.jobs.shadow.steps;
    expect(steps[0].name).toBe("Require default-branch dispatch");
    expect(steps[0].run).toContain('test "$GITHUB_REF" = "$EXPECTED_REF"');
    expect(steps[1].with).toMatchObject({
      ref: "${{ github.workflow_sha }}",
      "persist-credentials": false,
      "sparse-checkout": "ops/scripts/deploy-hub-shadow.cjs",
      "sparse-checkout-cone-mode": false,
    });
  });
});

describe("Deploy Hub FE shadow manifest", () => {
  it("freezes exact requests and partitions only adjacent equal targets", () => {
    const manifest = [
      request(1, SHA_A, "production"),
      request(2, SHA_B, "production"),
      request(3, SHA_C, "staging"),
      request(4, SHA_A, "production"),
    ];
    const normalized = normalizeManifest(
      JSON.stringify(manifest),
      ACTOR,
      EXPECTED_REPOSITORY
    );

    expect(normalized).toEqual(manifest);
    expect(partitionCohorts(normalized)).toEqual([
      { target: "production", requests: normalized.slice(0, 2) },
      { target: "staging", requests: normalized.slice(2, 3) },
      { target: "production", requests: normalized.slice(3, 4) },
    ]);
    expect(Object.isFrozen(normalized[0])).toBe(true);
  });

  it.each([
    [
      "another repository",
      { ...request(1, SHA_A, "staging"), repository: "owner/other" },
    ],
    [
      "a moved requester",
      { ...request(1, SHA_A, "staging"), requester: "someone-else" },
    ],
    ["a non-exact SHA", { ...request(1, SHA_A, "staging"), sha: "main" }],
    [
      "an unknown target",
      { ...request(1, SHA_A, "staging"), target: "preview" },
    ],
  ])("rejects %s", (_name, invalidRequest) => {
    expect(() =>
      normalizeManifest(
        JSON.stringify([invalidRequest]),
        ACTOR,
        EXPECTED_REPOSITORY
      )
    ).toThrow();
  });
});

describe("Deploy Hub FE shadow execution", () => {
  it("posts exact-run-linked phases and an unambiguous success", async () => {
    const github = githubForHeads({ 1: SHA_A, 2: SHA_B });
    const manifest = [
      request(1, SHA_A, "production"),
      request(2, SHA_B, "production"),
    ];

    const result = await executeShadow({
      operationId: "operation-1",
      manifestJson: JSON.stringify(manifest),
      scenario: "success",
      delaySeconds: 0,
      repository: EXPECTED_REPOSITORY,
      actor: ACTOR,
      runUrl: RUN_URL,
      github,
    });

    expect(result.conclusion).toBe("success");
    expect(github.statuses).toHaveLength(8);
    expect(github.statuses.at(-1)).toEqual({
      sha: SHA_B,
      status: {
        state: "success",
        target_url: RUN_URL,
        description: "SHADOW: Production simulation complete; not deployed",
        context: "Deploy Hub Shadow — Target: Production",
      },
    });
    expect(
      github.statuses.every(({ status }) => status["target_url"] === RUN_URL)
    ).toBe(true);
  });

  it("fails closed and marks every request when one exact PR head moved", async () => {
    const github = githubForHeads({ 1: SHA_A, 2: SHA_C });
    const result = await executeShadow({
      operationId: "operation-stale",
      manifestJson: JSON.stringify([
        request(1, SHA_A, "staging"),
        request(2, SHA_B, "staging"),
      ]),
      scenario: "success",
      delaySeconds: 0,
      repository: EXPECTED_REPOSITORY,
      actor: ACTOR,
      runUrl: RUN_URL,
      github,
    });

    expect(result.conclusion).toBe("failure");
    expect(result.scenario).toBe("stale");
    expect(github.statuses).toEqual([
      expect.objectContaining({
        sha: SHA_A,
        status: expect.objectContaining({
          state: "error",
          description: "SHADOW: blocked by stale cohort input; no deployment",
        }),
      }),
      expect.objectContaining({
        sha: SHA_B,
        status: expect.objectContaining({
          state: "error",
          description: "SHADOW: stale exact PR head; no deployment",
        }),
      }),
    ]);
  });

  it.each([
    ["product-failure", "failure", "product-failure"],
    ["infrastructure-failure", "error", "infrastructure-failure"],
    ["cancelled", "error", "cancelled"],
    ["stale", "error", "stale"],
  ])(
    "projects the %s terminal outcome without deployment evidence",
    (scenario, terminalState, terminalPhase) => {
      const plan = statusPlan("staging", scenario);
      expect(plan.at(-1)).toMatchObject({
        phase: terminalPhase,
        state: terminalState,
      });
      expect(plan.at(-1).description).toMatch(/SHADOW:/);
      expect(plan.at(-1).description).toMatch(/deployment|deployed/);
    }
  );

  it("uses target-specific shadow contexts", () => {
    expect(statusContext("staging")).toBe(
      "Deploy Hub Shadow — Target: Staging"
    );
    expect(statusContext("production")).toBe(
      "Deploy Hub Shadow — Target: Production"
    );
  });
});
