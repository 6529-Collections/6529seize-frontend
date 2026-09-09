import { spawn } from "node:child_process";
import { createServer } from "node:http";
import path from "node:path";

type RunResult = {
  readonly code: number | null;
  readonly stderr: string;
  readonly payload: Record<string, unknown> | null;
};

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
        GITHUB_WORKFLOW: "Web Deploy - PROD",
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

describe("notify-ci-wave payload", () => {
  it("sends canonical contributors and the deployed SHA", async () => {
    const expectedSha = "b".repeat(40);
    const result = await runNotifier({
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
        contributor_github_logins: ["GelatoGenesis", "prxt6529"],
        sha: expectedSha,
      },
    });
    expect(result.payload).not.toHaveProperty("release_notes_prompt_path");
    expect(result.payload).not.toHaveProperty("release_group_id");
    expect(result.payload).not.toHaveProperty("deployed_at");
  });

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

  it("omits empty contributor credits", async () => {
    const result = await runNotifier({ CI_RELEASE_CONTRIBUTORS: "[]" });
    expect(result.code).toBe(0);
    expect(result.payload).not.toHaveProperty("contributor_github_logins");
  });

  it("sends ordinary deploy identity without contributor credits", async () => {
    const result = await runNotifier({
      CI_PIPELINES_ALERT_TYPE: "deploy",
      GITHUB_RUN_ATTEMPT: "2",
    });
    expect(result).toMatchObject({
      code: 0,
      payload: { alert_type: "deploy", run_id: "123", run_attempt: 2 },
    });
  });

  it("keeps deployment alerts while opting out of release notes", async () => {
    const result = await runNotifier({
      CI_PIPELINES_ALERT_TYPE: "deploy",
      CI_RELEASE_NOTES_PROMPT_PATH: "ops/release-notes/release-notes.prompt.md",
      CI_RELEASE_NOTE_OPT_OUT: "true",
    });
    expect(result).toMatchObject({
      code: 0,
      payload: { alert_type: "deploy" },
    });
    expect(result.payload).not.toHaveProperty("release_notes_prompt_path");
    expect(result.payload).not.toHaveProperty("release_group_id");
    expect(result.payload).not.toHaveProperty("deployed_at");
  });

  it("rejects malformed release-note opt-out", async () => {
    const result = await runNotifier({ CI_RELEASE_NOTE_OPT_OUT: "yes" });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      "CI_RELEASE_NOTE_OPT_OUT must be true or false"
    );
    expect(result.payload).toBeNull();
  });

  it("sends WEB E2E parent identity and validation metadata", async () => {
    const result = await runNotifier({
      CI_PIPELINES_ALERT_TYPE: "web_e2e",
      CI_PIPELINES_PARENT_DEPLOY_RUN_ID: "791",
      CI_PIPELINES_VALIDATION_PACK: "core",
      GITHUB_RUN_ATTEMPT: "2",
    });

    expect(result).toMatchObject({
      code: 0,
      stderr: "",
      payload: {
        alert_type: "web_e2e",
        parent_deploy_run_id: "791",
        validation_pack: "core",
        run_attempt: 2,
        sha: null,
      },
    });
  });

  it("normalizes an uppercase deployed SHA override", async () => {
    const result = await runNotifier({
      CI_PIPELINES_SHA: "ABCDEF0123456789ABCDEF0123456789ABCDEF01",
    });

    expect(result).toMatchObject({
      code: 0,
      stderr: "",
      payload: {
        sha: "abcdef0123456789abcdef0123456789abcdef01",
      },
    });
  });

  it("requires a validation pack for WEB E2E alerts", async () => {
    const result = await runNotifier({
      CI_PIPELINES_ALERT_TYPE: "web_e2e",
    });

    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      "CI_PIPELINES_VALIDATION_PACK is required for web_e2e alerts"
    );
    expect(result.payload).toBeNull();
  });

  it("rejects an invalid contributor login", async () => {
    const result = await runNotifier({
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
      "CI_PIPELINES_SHA must be a 40-character Git SHA"
    );
    expect(result.payload).toBeNull();
  });
});
