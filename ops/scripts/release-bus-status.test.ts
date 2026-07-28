import { execFile } from "node:child_process";
import { once } from "node:events";
import { chmod, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createServer, type RequestListener, type Server } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

/* eslint-disable security/detect-non-literal-fs-filename -- Test paths are confined to a fresh OS temp directory. */

const HELPER_PATH = path.resolve(__dirname, "release-bus-status.mjs");
const TOKEN = "test-token-that-must-never-be-printed";
const HARD_STOP_REASON = "Internal Release Bus hard stop is active";
const INVALID_STAGING_STATE = "invalid staging state";
const INVALID_STAGING_IDENTITY = "invalid staging identity";
const CURRENT_MANIFEST_ID = "manifest-current";
const execFileAsync = promisify(execFile);
const VALID_CONTROLS = [
  { scope: "ALL", paused: 0, reason: "Global recovery complete" },
  { scope: "STAGING", paused: false, reason: "Staging enabled" },
  { scope: "PRODUCTION", paused: 0, reason: "Production enabled" },
];
const VALID_STAGING_STATE = {
  status: "LIVE",
  current_manifest_id: CURRENT_MANIFEST_ID,
  last_validated_manifest_id: CURRENT_MANIFEST_ID,
  frontend_sha: "a".repeat(40),
  backend_sha: "b".repeat(40),
  frontend_staging_ref_sha: "a".repeat(40),
  backend_staging_ref_sha: "b".repeat(40),
  clean_main: false,
  last_transition_train_id: "train-current",
  row_version: 7,
};

type HelperResult = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

type TestServer = {
  readonly url: string;
  readonly server: Server;
};

type SanitizedStatus = {
  readonly lanes: Record<
    "STAGING" | "PRODUCTION",
    {
      readonly status: "ON" | "OFF";
      readonly changeable: boolean;
      readonly reason: string | null;
    }
  >;
  readonly staging: {
    readonly status:
      | "UNINITIALIZED"
      | "LIVE"
      | "CLEAN_MAIN"
      | "ROLLBACK_FAILED";
    readonly current_manifest_id: string | null;
    readonly last_validated_manifest_id: string | null;
    readonly frontend_sha: string | null;
    readonly backend_sha: string | null;
    readonly frontend_staging_ref_sha: string | null;
    readonly backend_staging_ref_sha: string | null;
    readonly clean_main: boolean;
    readonly last_transition_train_id: string | null;
    readonly row_version: number;
  };
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

async function runHelper(
  overrides: NodeJS.ProcessEnv = {}
): Promise<HelperResult> {
  let code = 0;
  let stdout = "";
  let stderr = "";
  try {
    const result = await execFileAsync(process.execPath, [HELPER_PATH], {
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
    });
    stdout = result.stdout;
    stderr = result.stderr;
  } catch (error) {
    const failure = error as Error & {
      readonly code?: number;
      readonly stdout?: string;
      readonly stderr?: string;
    };
    code = typeof failure.code === "number" ? failure.code : 1;
    stdout = failure.stdout ?? "";
    stderr = failure.stderr ?? failure.message;
  }
  expect(`${stdout}${stderr}`).not.toContain(TOKEN);
  return { code, stdout, stderr };
}

async function startServer(listener: RequestListener): Promise<TestServer> {
  const server = createServer(listener);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Test server did not bind to a TCP port");
  }
  return { url: `http://127.0.0.1:${address.port}`, server };
}

async function stopServer(server: Server): Promise<void> {
  server.closeAllConnections();
  const closed = once(server, "close");
  server.close();
  await closed;
}

function laneStates(
  mode: "OFF" | "STAGING" | "PRODUCTION",
  controls: readonly {
    readonly scope: string;
    readonly paused: boolean | number;
    readonly reason: string | null;
  }[] = VALID_CONTROLS
) {
  const byScope = Object.fromEntries(
    controls.map((control) => [control.scope, control])
  );
  return ["STAGING", "PRODUCTION"].map((lane) => {
    const allowed =
      mode === "PRODUCTION" || (mode === "STAGING" && lane === "STAGING");
    const globalPaused = Boolean(byScope["ALL"]?.paused);
    const lanePaused = Boolean(byScope[lane]?.paused);
    let reason = byScope[lane]?.reason;
    if (!allowed) {
      reason = HARD_STOP_REASON;
    } else if (globalPaused) {
      reason = byScope["ALL"]?.reason ?? HARD_STOP_REASON;
    }
    return {
      lane,
      status: allowed && !globalPaused && !lanePaused ? "ON" : "OFF",
      changeable: allowed && !globalPaused,
      reason,
    };
  });
}

function parseSanitizedStatus(stdout: string): SanitizedStatus {
  return JSON.parse(stdout) as SanitizedStatus;
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

// eslint-disable-next-line max-lines-per-function -- This integration-style suite shares one isolated helper/server fixture.
describe("release-bus-status helper", () => {
  test.each(["OFF", "STAGING", "PRODUCTION"] as const)(
    "prints sanitized status for %s mode",
    async (mode) => {
      const result = await runWithResponse({
        mode,
        controls: VALID_CONTROLS,
        lanes: laneStates(mode),
        staging_state: VALID_STAGING_STATE,
      });

      expect(result.code).toBe(0);
      expect(result.stderr).toBe("");
      expect(result.authorization).toBe(`Bearer ${TOKEN}`);
      const parsed = parseSanitizedStatus(result.stdout);
      expect(parsed.lanes.STAGING.status).toBe(mode === "OFF" ? "OFF" : "ON");
      expect(parsed.lanes.PRODUCTION.status).toBe(
        mode === "PRODUCTION" ? "ON" : "OFF"
      );
      expect(parsed.staging).toEqual({
        status: "LIVE",
        current_manifest_id: CURRENT_MANIFEST_ID,
        last_validated_manifest_id: CURRENT_MANIFEST_ID,
        frontend_sha: "a".repeat(40),
        backend_sha: "b".repeat(40),
        frontend_staging_ref_sha: "a".repeat(40),
        backend_staging_ref_sha: "b".repeat(40),
        clean_main: false,
        last_transition_train_id: "train-current",
        row_version: 7,
      });
    }
  );

  it("preserves valid nullable staging identity fields", async () => {
    const result = await runWithResponse({
      mode: "PRODUCTION",
      controls: VALID_CONTROLS,
      lanes: laneStates("PRODUCTION"),
      staging_state: {
        ...VALID_STAGING_STATE,
        status: "UNINITIALIZED",
        current_manifest_id: null,
        last_validated_manifest_id: null,
        frontend_sha: null,
        backend_sha: null,
        frontend_staging_ref_sha: null,
        backend_staging_ref_sha: null,
        last_transition_train_id: null,
      },
    });

    expect(result.code).toBe(0);
    expect(parseSanitizedStatus(result.stdout).staging).toEqual({
      status: "UNINITIALIZED",
      current_manifest_id: null,
      last_validated_manifest_id: null,
      frontend_sha: null,
      backend_sha: null,
      frontend_staging_ref_sha: null,
      backend_staging_ref_sha: null,
      clean_main: false,
      last_transition_train_id: null,
      row_version: 7,
    });
  });

  test.each([
    ["ALL", "OFF", "OFF"],
    ["STAGING", "OFF", "ON"],
    ["PRODUCTION", "ON", "OFF"],
  ] as const)(
    "derives the two effective lanes when hidden %s is paused",
    async (pausedScope, expectedStaging, expectedProduction) => {
      const controls = VALID_CONTROLS.map((control) => ({
        ...control,
        paused: control.scope === pausedScope,
        reason:
          pausedScope === "ALL" && control.scope === "ALL"
            ? null
            : control.reason,
      }));
      const result = await runWithResponse({
        mode: "PRODUCTION",
        controls,
        lanes: laneStates("PRODUCTION", controls),
        staging_state: VALID_STAGING_STATE,
      });

      expect(result.code).toBe(0);
      expect(parseSanitizedStatus(result.stdout).lanes).toMatchObject({
        STAGING: { status: expectedStaging },
        PRODUCTION: { status: expectedProduction },
      });
      if (pausedScope === "ALL") {
        expect(parseSanitizedStatus(result.stdout).lanes).toEqual({
          STAGING: {
            status: "OFF",
            changeable: false,
            reason: HARD_STOP_REASON,
          },
          PRODUCTION: {
            status: "OFF",
            changeable: false,
            reason: HARD_STOP_REASON,
          },
        });
      }
    }
  );

  it("fails when derived lane state disagrees with hidden safety controls", async () => {
    const result = await runWithResponse({
      mode: "PRODUCTION",
      controls: VALID_CONTROLS,
      lanes: laneStates("OFF"),
      staging_state: VALID_STAGING_STATE,
    });

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("inconsistent lane information");
  });

  it("fails when a required effective lane is missing or duplicated", async () => {
    const lanes = laneStates("PRODUCTION");
    for (const invalidLanes of [
      lanes.filter(({ lane }) => lane !== "PRODUCTION"),
      [...lanes, lanes[0]],
    ]) {
      const result = await runWithResponse({
        mode: "PRODUCTION",
        controls: VALID_CONTROLS,
        lanes: invalidLanes,
        staging_state: VALID_STAGING_STATE,
      });

      expect(result.code).not.toBe(0);
      expect(result.stderr).toContain("incomplete lane information");
    }
  });

  it("fails when an unknown third effective lane is present", async () => {
    const result = await runWithResponse({
      mode: "PRODUCTION",
      controls: VALID_CONTROLS,
      lanes: [
        ...laneStates("PRODUCTION"),
        {
          lane: "ALL",
          status: "OFF",
          changeable: false,
          reason: null,
        },
      ],
      staging_state: VALID_STAGING_STATE,
    });

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("incomplete lane information");
  });

  it("fails when an effective lane omits its reason", async () => {
    const lanes = laneStates("PRODUCTION").map((lane) =>
      lane.lane === "STAGING"
        ? {
            lane: lane.lane,
            status: lane.status,
            changeable: lane.changeable,
          }
        : lane
    );
    const result = await runWithResponse({
      mode: "PRODUCTION",
      controls: VALID_CONTROLS,
      lanes,
      staging_state: VALID_STAGING_STATE,
    });

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("invalid lane information");
  });

  it("fails closed when the v2 controls endpoint is missing", async () => {
    const paths: string[] = [];
    const testServer = await startServer((request, response) => {
      paths.push(request.url ?? "");
      response.writeHead(404).end();
    });
    try {
      const result = await runHelper({ RELEASE_BUS_API_URL: testServer.url });
      expect(result.code).not.toBe(0);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("status API returned HTTP 404");
      expect(paths).toEqual(["/deploy/release-bus-v2/controls"]);
    } finally {
      await stopServer(testServer.server);
    }
  });

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

  test.each([
    ["not-a-url", "valid HTTP URL"],
    ["ftp://127.0.0.1", "valid HTTP URL"],
    ["http://example.com", "loopback test server"],
    ["https://example.com", "loopback test server"],
  ])("fails safely for API URL %s", async (apiUrl, expectedMessage) => {
    const result = await runHelper({ RELEASE_BUS_API_URL: apiUrl });

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain(expectedMessage);
  });

  test.each(["", "0", "-1", "abc", "60001"])(
    "fails safely for timeout value %j",
    async (timeout) => {
      const result = await runHelper({
        RELEASE_BUS_STATUS_TIMEOUT_MS: timeout,
      });

      expect(result.code).not.toBe(0);
      expect(result.stderr).toContain("must be an integer from 1 to 60000");
    }
  );

  test.each([401, 403, 500])("fails safely for HTTP %s", async (status) => {
    const result = await runWithResponse(
      { error: `response body containing ${TOKEN}` },
      status
    );

    expect(result.code).not.toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      status === 500
        ? "status API returned HTTP 500"
        : `status authentication failed (HTTP ${status})`
    );
  });

  it("fails without following a redirect", async () => {
    const testServer = await startServer((_request, response) => {
      response.writeHead(302, { Location: "https://example.com/redirect" });
      response.end();
    });
    try {
      const result = await runHelper({ RELEASE_BUS_API_URL: testServer.url });

      expect(result.code).not.toBe(0);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("status API is unavailable");
    } finally {
      await stopServer(testServer.server);
    }
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
      lanes: [],
    });

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("invalid status data");
  });

  test.each([null, 1, {}])("fails on non-string mode %j", async (mode) => {
    const result = await runWithResponse({
      mode,
      controls: VALID_CONTROLS,
      lanes: [],
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
      lanes: [],
    });

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("incomplete control information");
  });

  it("fails when a required control is duplicated", async () => {
    const result = await runWithResponse({
      mode: "OFF",
      controls: [...VALID_CONTROLS, VALID_CONTROLS[0]],
      lanes: [],
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
      lanes: [],
    });

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("invalid status data");
  });

  it("fails closed when authoritative staging state is missing", async () => {
    const result = await runWithResponse({
      mode: "OFF",
      controls: VALID_CONTROLS,
      lanes: laneStates("OFF"),
    });

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain(INVALID_STAGING_STATE);
  });

  test.each([
    ["row_version", true, INVALID_STAGING_STATE],
    ["row_version", "7", INVALID_STAGING_STATE],
    ["clean_main", null, INVALID_STAGING_STATE],
    ["frontend_sha", 123, INVALID_STAGING_IDENTITY],
    ["current_manifest_id", 123, INVALID_STAGING_IDENTITY],
    ["last_validated_manifest_id", {}, INVALID_STAGING_IDENTITY],
    ["last_transition_train_id", false, INVALID_STAGING_IDENTITY],
  ])(
    "fails closed when staging %s has malformed value %p",
    async (field, value, message) => {
      const result = await runWithResponse({
        mode: "PRODUCTION",
        controls: VALID_CONTROLS,
        lanes: laneStates("PRODUCTION"),
        staging_state: { ...VALID_STAGING_STATE, [field]: value },
      });

      expect(result.code).not.toBe(0);
      expect(result.stderr).toContain(message);
    }
  );
});
