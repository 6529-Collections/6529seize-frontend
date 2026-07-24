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

describe("notify-ci-wave Release Train metadata", () => {
  it("sends canonical contributors and the deployed SHA", async () => {
    const expectedSha = "b".repeat(40);
    const result = await runNotifier({
      CI_RELEASE_TRAIN_ID: "train-123",
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
        release_train_id: "train-123",
        contributor_github_logins: ["GelatoGenesis", "prxt6529"],
        sha: expectedSha,
      },
    });
  });

  it("rejects contributors without a train id", async () => {
    const result = await runNotifier({
      CI_RELEASE_CONTRIBUTORS: JSON.stringify(["GelatoGenesis"]),
    });

    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      "CI_RELEASE_TRAIN_ID is required with CI_RELEASE_CONTRIBUTORS"
    );
    expect(result.payload).toBeNull();
  });

  it("keeps new fields atomic until the updated dispatcher supplies contributors", async () => {
    const result = await runNotifier({
      CI_RELEASE_TRAIN_ID: "train-123",
      CI_RELEASE_CONTRIBUTORS: "[]",
    });

    expect(result.code).toBe(0);
    expect(result.payload).not.toHaveProperty("release_train_id");
    expect(result.payload).not.toHaveProperty("contributor_github_logins");
  });

  it("rejects an invalid contributor login", async () => {
    const result = await runNotifier({
      CI_RELEASE_TRAIN_ID: "train-123",
      CI_RELEASE_CONTRIBUTORS: JSON.stringify(["not a login"]),
    });

    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      "CI_RELEASE_CONTRIBUTORS contains an invalid GitHub login"
    );
    expect(result.payload).toBeNull();
  });

  it.each(["trailing-", "double--hyphen"])(
    "rejects impossible GitHub login %s",
    async (login) => {
      const result = await runNotifier({
        CI_RELEASE_TRAIN_ID: "train-123",
        CI_RELEASE_CONTRIBUTORS: JSON.stringify([login]),
      });

      expect(result.code).toBe(1);
      expect(result.stderr).toContain(
        "CI_RELEASE_CONTRIBUTORS contains an invalid GitHub login"
      );
    }
  );
});
