import { spawn } from "node:child_process";
import { createServer } from "node:http";
import path from "node:path";

type RunResult = {
  readonly code: number | null;
  readonly stderr: string;
  readonly payload: Record<string, unknown> | null;
};

type ManualWorkflowFixture = {
  readonly workflow: "Web Deploy - STAGING" | "Web Deploy - PROD";
  readonly workflowFile: "deploy-staging.yml" | "build-upload-deploy-prod.yml";
  readonly branch: "1a-staging" | "main";
  readonly targetEnvironment: "staging" | "prod";
};

const MANUAL_WORKFLOW_FIXTURES: readonly ManualWorkflowFixture[] = [
  {
    workflow: "Web Deploy - STAGING",
    workflowFile: "deploy-staging.yml",
    branch: "1a-staging",
    targetEnvironment: "staging",
  },
  {
    workflow: "Web Deploy - PROD",
    workflowFile: "build-upload-deploy-prod.yml",
    branch: "main",
    targetEnvironment: "prod",
  },
];

async function runNotifier(
  overrides: Record<string, string> = {}
): Promise<RunResult> {
  let payload: Record<string, unknown> | null = null;
  let requestError: Error | null = null;
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      try {
        payload = JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<
          string,
          unknown
        >;
        response.writeHead(204);
        response.end();
      } catch (error) {
        requestError =
          error instanceof Error ? error : new Error("invalid request body");
        response.writeHead(400);
        response.end();
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("missing port");
  }
  const child = spawn(
    process.execPath,
    [path.join(process.cwd(), "scripts/notify-ci-wave.mjs")],
    {
      env: {
        ...process.env,
        CI_PIPELINES_ALERT_URL: `http://127.0.0.1:${address.port}`,
        CI_PIPELINES_ALERT_SECRET: "test-secret",
        CI_PIPELINES_TARGET_ENV: "prod",
        CI_PIPELINES_STATUS: "success",
        CI_PIPELINES_TITLE: "Deploy complete",
        CI_PIPELINES_SERVICE: "web",
        GITHUB_REPOSITORY: "6529-Collections/6529seize-frontend",
        GITHUB_WORKFLOW: "Release Bus - Deploy Frontend Production",
        GITHUB_RUN_ID: "123",
        GITHUB_RUN_NUMBER: "45",
        GITHUB_SHA: "a".repeat(40),
        GITHUB_REF_NAME: "main",
        ...overrides,
      },
    }
  );
  let stderr = "";
  child.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString("utf8");
  });
  const code = await new Promise<number | null>((resolve) =>
    child.on("exit", resolve)
  );
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
  if (requestError) throw requestError;
  return { code, stderr, payload };
}

async function runManualNotifier({
  fixture = MANUAL_WORKFLOW_FIXTURES[1],
  currentRunOverrides = {},
  commits = [
    {
      sha: "c".repeat(40),
      author: { login: "Commit-Author", type: "User" },
      committer: { login: "web-flow", type: "User" },
    },
  ],
  pullRequests = [
    {
      number: 3498,
      merged_at: "2026-07-23T10:00:00Z",
      user: { login: "PR-Author", type: "User" },
    },
  ],
  pullCommits = [
    {
      author: { login: "commit-author", type: "User" },
      committer: { login: "Commit-Committer", type: "User" },
    },
  ],
}: {
  readonly fixture?: ManualWorkflowFixture;
  readonly currentRunOverrides?: Record<string, unknown>;
  readonly commits?: readonly Record<string, unknown>[];
  readonly pullRequests?: readonly Record<string, unknown>[];
  readonly pullCommits?: readonly Record<string, unknown>[];
} = {}): Promise<RunResult> {
  const githubServer = createServer((request, response) => {
    const pathName = request.url ?? "";
    let body: unknown;
    if (pathName.endsWith("/actions/runs/123")) {
      body = {
        id: 123,
        name: fixture.workflow,
        path: `.github/workflows/${fixture.workflowFile}@refs/heads/${fixture.branch}`,
        head_sha: "a".repeat(40),
        head_branch: fixture.branch,
        status: "in_progress",
        conclusion: null,
        created_at: "2026-07-23T11:38:00Z",
        ...currentRunOverrides,
      };
    } else if (
      pathName.includes(`/actions/workflows/${fixture.workflowFile}/runs`)
    ) {
      body = {
        workflow_runs: [
          {
            id: 122,
            name: fixture.workflow,
            path: `.github/workflows/${fixture.workflowFile}@refs/heads/${fixture.branch}`,
            head_sha: "b".repeat(40),
            head_branch: fixture.branch,
            status: "completed",
            conclusion: "success",
            created_at: "2026-07-22T11:38:00Z",
          },
        ],
      };
    } else if (
      pathName.includes(
        "/actions/workflows/release-bus-deploy-production.yml/runs"
      )
    ) {
      body = { workflow_runs: [] };
    } else if (pathName.includes("/compare/")) {
      body = { status: "ahead", commits };
    } else if (pathName.includes(`/commits/${"c".repeat(40)}/pulls`)) {
      body = pullRequests;
    } else if (pathName.includes("/pulls/3498/commits")) {
      body = pullCommits;
    } else {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(body));
  });
  await new Promise<void>((resolve) =>
    githubServer.listen(0, "127.0.0.1", resolve)
  );
  const address = githubServer.address();
  if (!address || typeof address === "string") {
    throw new Error("missing port");
  }

  try {
    return await runNotifier({
      CI_PIPELINES_TARGET_ENV: fixture.targetEnvironment,
      GITHUB_WORKFLOW: fixture.workflow,
      GITHUB_REF_NAME: fixture.branch,
      GITHUB_TOKEN: "test-token",
      GITHUB_API_URL: `http://127.0.0.1:${address.port}`,
    });
  } finally {
    await new Promise<void>((resolve, reject) =>
      githubServer.close((error) => (error ? reject(error) : resolve()))
    );
  }
}

describe("notify-ci-wave Release Train metadata", () => {
  it.each(MANUAL_WORKFLOW_FIXTURES)(
    "derives $workflow contributors while its success step is still in progress",
    async (fixture) => {
      const result = await runManualNotifier({ fixture });
      expect(result).toMatchObject({
        code: 0,
        stderr: "",
        payload: {
          contributor_evidence: "manual-range",
          contributor_github_logins: [
            "Commit-Author",
            "PR-Author",
            "Commit-Committer",
          ],
        },
      });
      expect(result.payload).not.toHaveProperty("release_train_id");
    }
  );

  it("supports completed successful manual notification replays", async () => {
    const result = await runManualNotifier({
      currentRunOverrides: {
        status: "completed",
        conclusion: "success",
      },
    });

    expect(result.payload).toMatchObject({
      contributor_evidence: "manual-range",
      contributor_github_logins: [
        "Commit-Author",
        "PR-Author",
        "Commit-Committer",
      ],
    });
  });

  it.each([
    ["queued", null],
    ["completed", "failure"],
    ["completed", "cancelled"],
  ])("rejects manual run state %s/%s", async (status, conclusion) => {
    const result = await runManualNotifier({
      currentRunOverrides: { status, conclusion },
    });

    expect(result.code).toBe(0);
    expect(result.stderr).toContain(
      `Current workflow run state ${status}/${conclusion ?? "null"} is not valid for a success notification`
    );
    expect(result.payload).not.toHaveProperty("contributor_github_logins");
  });

  it.each([
    [
      "run ID",
      { id: 124 },
      "Current workflow run ID does not match GITHUB_RUN_ID",
    ],
    [
      "workflow name",
      { name: "Release Bus - Deploy Frontend Production" },
      "Current workflow run name is not the approved workflow",
    ],
    [
      "workflow path",
      {
        path: "untrusted/build-upload-deploy-prod.yml@refs/heads/main",
      },
      "Current workflow run path is not the approved workflow",
    ],
    [
      "deployed SHA",
      { head_sha: "d".repeat(40) },
      "Current workflow run SHA does not match the deployed SHA",
    ],
    [
      "branch",
      { head_branch: "untrusted-branch" },
      "Current workflow run branch does not match the deployed branch",
    ],
  ])(
    "rejects manual contributor evidence with the wrong %s",
    async (_field, currentRunOverrides, diagnostic) => {
      const result = await runManualNotifier({ currentRunOverrides });

      expect(result.code).toBe(0);
      expect(result.stderr).toContain(diagnostic);
      expect(result.payload).not.toHaveProperty("contributor_github_logins");
    }
  );

  it.each([
    ["empty", [], []],
    [
      "bot-only",
      [
        {
          sha: "c".repeat(40),
          author: { login: "dependabot[bot]", type: "Bot" },
          committer: { login: "github-actions", type: "Bot" },
        },
      ],
      [],
    ],
  ])(
    "omits manual contributors for a %s deployment range",
    async (_name, commits, pullRequests) => {
      const result = await runManualNotifier({
        commits,
        pullRequests,
        pullCommits: [],
      });

      expect(result.code).toBe(0);
      expect(result.payload).not.toHaveProperty("contributor_evidence");
      expect(result.payload).not.toHaveProperty("contributor_github_logins");
    }
  );

  it.each([
    ["staging", "Release Bus - Deploy Frontend Staging", "staging"],
    ["prod", "Release Bus - Deploy Frontend Production", "prod"],
  ])(
    "preserves scoped Release Bus frontend %s contributors",
    async (environment, workflow, targetEnvironment) => {
      const expectedSha = "b".repeat(40);
      const result = await runNotifier({
        GITHUB_WORKFLOW: workflow,
        CI_PIPELINES_TARGET_ENV: targetEnvironment,
        CI_RELEASE_TRAIN_ID: "a7d3433d-e145-4578-bc78-e96fbd34f591",
        CI_RELEASE_OPERATION_KEY: `rb2:a7d3433d-e145-4578-bc78-e96fbd34f591:deploy:${environment}:frontend:a1`,
        CI_RELEASE_CONTRIBUTORS: JSON.stringify([
          "GelatoGenesis",
          "prxt6529",
          "gelatogenesis",
        ]),
        CI_PIPELINES_SHA: expectedSha,
      });

      expect(result).toMatchObject({
        code: 0,
        stderr: "",
        payload: {
          release_train_id: "a7d3433d-e145-4578-bc78-e96fbd34f591",
          release_operation_key: `rb2:a7d3433d-e145-4578-bc78-e96fbd34f591:deploy:${environment}:frontend:a1`,
          contributor_evidence: "release-bus-operation",
          contributor_github_logins: ["GelatoGenesis", "prxt6529"],
          sha: expectedSha,
        },
      });
      expect(result.payload).not.toHaveProperty("release_notes_prompt_path");
      expect(result.payload).not.toHaveProperty("release_group_id");
      expect(result.payload).not.toHaveProperty("deployed_at");
    }
  );

  it("adds the autonomous release-note contract for frontend production", async () => {
    const result = await runNotifier({
      CI_RELEASE_NOTES_PROMPT_PATH: "ops/release-notes/release-notes.prompt.md",
    });

    expect(result).toMatchObject({
      code: 0,
      stderr: "",
      payload: {
        release_notes_prompt_path: "ops/release-notes/release-notes.prompt.md",
        release_group_id: "6529-Collections/6529seize-frontend:123",
        release_group_services: ["web"],
      },
    });
    expect(result.payload?.["deployed_at"]).toEqual(expect.any(String));
    expect(
      Number.isNaN(Date.parse(String(result.payload?.["deployed_at"])))
    ).toBe(false);
  });

  it("does not trust user-supplied contributors on a manual deployment", async () => {
    const result = await runNotifier({
      CI_RELEASE_CONTRIBUTORS: JSON.stringify(["GelatoGenesis"]),
    });

    expect(result.code).toBe(0);
    expect(result.stderr).toContain(
      "Ignoring user-supplied contributors on a manual deployment"
    );
    expect(result.payload).not.toHaveProperty("contributor_github_logins");
  });

  it("requires Release Bus train and operation identities together", async () => {
    const result = await runNotifier({
      CI_RELEASE_TRAIN_ID: "a7d3433d-e145-4578-bc78-e96fbd34f591",
      CI_RELEASE_CONTRIBUTORS: "[]",
    });

    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      "CI_RELEASE_TRAIN_ID and CI_RELEASE_OPERATION_KEY must be supplied together"
    );
    expect(result.payload).toBeNull();
  });

  it("rejects an invalid contributor login", async () => {
    const result = await runNotifier({
      CI_RELEASE_TRAIN_ID: "a7d3433d-e145-4578-bc78-e96fbd34f591",
      CI_RELEASE_OPERATION_KEY:
        "rb2:a7d3433d-e145-4578-bc78-e96fbd34f591:deploy:prod:frontend:a1",
      CI_RELEASE_CONTRIBUTORS: JSON.stringify(["not a login"]),
    });

    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      "CI_RELEASE_CONTRIBUTORS contains an invalid GitHub login"
    );
    expect(result.payload).toBeNull();
  });

  it.each(["trailing-", "double--hyphen", `${"a".repeat(35)}[bot]`])(
    "rejects impossible GitHub login %s",
    async (login) => {
      const result = await runNotifier({
        CI_RELEASE_TRAIN_ID: "a7d3433d-e145-4578-bc78-e96fbd34f591",
        CI_RELEASE_OPERATION_KEY:
          "rb2:a7d3433d-e145-4578-bc78-e96fbd34f591:deploy:prod:frontend:a1",
        CI_RELEASE_CONTRIBUTORS: JSON.stringify([login]),
      });

      expect(result.code).toBe(1);
      expect(result.stderr).toContain(
        "CI_RELEASE_CONTRIBUTORS contains an invalid GitHub login"
      );
    }
  );

  it("rejects an invalid deployed SHA override", async () => {
    const result = await runNotifier({
      CI_PIPELINES_SHA: "not-a-git-sha",
    });

    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      "CI_PIPELINES_SHA must be a 40-character lowercase Git SHA"
    );
    expect(result.payload).toBeNull();
  });
});
