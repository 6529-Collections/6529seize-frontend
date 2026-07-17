import { execFile } from "node:child_process";
import { chmod, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createServer, type RequestListener, type Server } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";

/* eslint-disable security/detect-non-literal-fs-filename -- Test paths are confined to a fresh OS temp directory. */

const HELPER_PATH = path.resolve(__dirname, "release-bus-status.mjs");
const TOKEN = "test-token-that-must-never-be-printed";
const VALID_CONTROLS = [
  { scope: "ALL", paused: 0 },
  { scope: "STAGING", paused: false },
  { scope: "PRODUCTION", paused: 0 },
];

type HelperResult = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

type TestServer = {
  readonly url: string;
  readonly server: Server;
};

let tempRoot: string;
let mockBin: string;
let emptyBin: string;

beforeAll(async () => {
  tempRoot = await mkdtemp(path.join(tmpdir(), "release-bus-status-"));
  mockBin = path.join(tempRoot, "mock-bin");
  emptyBin = path.join(tempRoot, "empty-bin");
  await mkdir(mockBin);
  await mkdir(emptyBin);
  const ghPath = path.join(mockBin, "gh");
  await writeFile(
    ghPath,
    [
      "#!/bin/sh",
      'if [ "$1" = "auth" ] && [ "$2" = "status" ]; then',
      '  if [ "${MOCK_GH_AUTHENTICATED:-1}" = "1" ]; then exit 0; fi',
      "  exit 1",
      "fi",
      'if [ "$1" = "auth" ] && [ "$2" = "token" ]; then',
      '  printf "%s\\n" "${MOCK_GH_TOKEN:-}"',
      "  exit 0",
      "fi",
      "exit 2",
      "",
    ].join("\n"),
    "utf8"
  );
  await chmod(ghPath, 0o700);
});

afterAll(async () => {
  await rm(tempRoot, { recursive: true, force: true });
});

function runHelper(overrides: NodeJS.ProcessEnv = {}): Promise<HelperResult> {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [HELPER_PATH],
      {
        env: {
          // eslint-disable-next-line no-restricted-syntax -- The isolated subprocess needs the test runner environment.
          ...process.env,
          PATH: mockBin,
          MOCK_GH_AUTHENTICATED: "1",
          MOCK_GH_TOKEN: TOKEN,
          ...overrides,
        },
        maxBuffer: 1024 * 1024,
        timeout: 5_000,
      },
      (error, stdout, stderr) => {
        const output = `${stdout}${stderr}`;
        expect(output).not.toContain(TOKEN);
        resolve({
          code:
            error === null
              ? 0
              : typeof error.code === "number"
                ? error.code
                : 1,
          stdout,
          stderr,
        });
      }
    );
  });
}

async function startServer(listener: RequestListener): Promise<TestServer> {
  const server = createServer(listener);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Test server did not bind to a TCP port");
  }
  return { url: `http://127.0.0.1:${address.port}`, server };
}

async function stopServer(server: Server): Promise<void> {
  server.closeAllConnections?.();
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function runWithResponse(
  body: unknown,
  status = 200
): Promise<HelperResult & { readonly authorization: string | undefined }> {
  let authorization: string | undefined;
  const testServer = await startServer((request, response) => {
    authorization = request.headers.authorization;
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(typeof body === "string" ? body : JSON.stringify(body));
  });
  try {
    return {
      ...(await runHelper({ RELEASE_BUS_API_URL: testServer.url })),
      authorization,
    };
  } finally {
    await stopServer(testServer.server);
  }
}

describe("release-bus-status helper", () => {
  test.each(["OFF", "SHADOW", "STAGING", "PRODUCTION"])(
    "prints sanitized status for %s mode",
    async (mode) => {
      const result = await runWithResponse({
        mode,
        controls: VALID_CONTROLS,
      });

      expect(result.code).toBe(0);
      expect(result.stderr).toBe("");
      expect(result.authorization).toBe(`Bearer ${TOKEN}`);
      expect(JSON.parse(result.stdout)).toEqual({
        mode,
        controls: {
          ALL: "RUNNING",
          STAGING: "RUNNING",
          PRODUCTION: "RUNNING",
        },
      });
    }
  );

  test.each(["ALL", "STAGING", "PRODUCTION"])(
    "reports a paused %s control",
    async (pausedScope) => {
      const result = await runWithResponse({
        mode: "STAGING",
        controls: VALID_CONTROLS.map((control) => ({
          ...control,
          paused: control.scope === pausedScope,
        })),
      });

      expect(result.code).toBe(0);
      expect(JSON.parse(result.stdout).controls[pausedScope]).toBe("PAUSED");
    }
  );

  it("fails when gh is missing", async () => {
    const result = await runHelper({ PATH: emptyBin });

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("GitHub CLI (gh) is required");
  });

  it("fails when gh is unauthenticated", async () => {
    const result = await runHelper({ MOCK_GH_AUTHENTICATED: "0" });

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("Run gh auth login and retry");
  });

  test.each([401, 403, 500])("fails safely for HTTP %s", async (status) => {
    const result = await runWithResponse(
      { error: `response body containing ${TOKEN}` },
      status
    );

    expect(result.code).not.toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(`HTTP ${status}`);
  });

  it("fails on a network error", async () => {
    const unusedServer = await startServer((_request, response) => {
      response.end();
    });
    const url = unusedServer.url;
    await stopServer(unusedServer.server);

    const result = await runHelper({ RELEASE_BUS_API_URL: url });

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("status API is unavailable");
  });

  it("fails on a timeout", async () => {
    const testServer = await startServer(() => undefined);
    try {
      const result = await runHelper({
        RELEASE_BUS_API_URL: testServer.url,
        RELEASE_BUS_STATUS_TIMEOUT_MS: "25",
      });

      expect(result.code).not.toBe(0);
      expect(result.stderr).toContain("request timed out");
    } finally {
      await stopServer(testServer.server);
    }
  });

  it("fails on invalid JSON", async () => {
    const result = await runWithResponse(`not-json-${TOKEN}`);

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("malformed JSON");
  });

  it("fails on an unknown mode", async () => {
    const result = await runWithResponse({
      mode: TOKEN,
      controls: VALID_CONTROLS,
    });

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("invalid status data");
  });

  it("fails when a required control is missing", async () => {
    const result = await runWithResponse({
      mode: "OFF",
      controls: VALID_CONTROLS.filter(
        (control) => control.scope !== "PRODUCTION"
      ),
    });

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("incomplete control information");
  });

  it("fails when a pause state is invalid", async () => {
    const result = await runWithResponse({
      mode: "OFF",
      controls: VALID_CONTROLS.map((control) =>
        control.scope === "ALL" ? { ...control, paused: "false" } : control
      ),
    });

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("invalid status data");
  });
});
