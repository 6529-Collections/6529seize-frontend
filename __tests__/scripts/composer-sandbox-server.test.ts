/** @jest-environment node */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const serverPath = path.join(
  process.cwd(),
  "tests/support/composerSandboxServer.cjs"
);

function loadSandbox(apiOnly?: string) {
  const child = { on: jest.fn(), kill: jest.fn(), killed: false };
  const spawn = jest.fn(() => child);
  const spawnSync = jest.fn(() => ({ status: 0 }));
  const server = {
    on: jest.fn(),
    close: jest.fn((done: () => void) => done()),
    listen: jest.fn((_port: number, _host: string, ready: () => void) =>
      ready()
    ),
  };
  const dependencies: Record<string, unknown> = {
    http: { createServer: jest.fn(() => server) },
    path,
    child_process: { spawn, spawnSync },
    dotenv: { config: jest.fn() },
    "./competitionRuleDefaults.json": JSON.parse(
      fs.readFileSync(
        path.join(path.dirname(serverPath), "competitionRuleDefaults.json"),
        "utf8"
      )
    ),
    "./composerSandboxConstants.json": JSON.parse(
      fs.readFileSync(
        path.join(path.dirname(serverPath), "composerSandboxConstants.json"),
        "utf8"
      )
    ),
  };
  const requireFixture = Object.assign(
    (name: string) => {
      if (!(name in dependencies))
        throw new Error("Unexpected sandbox dependency");
      return dependencies[name];
    },
    { resolve: jest.fn(() => "/fixture/next") }
  );
  const context = {
    readFixture: (_pathname: string): unknown => undefined,
    mutateChat: (_edit: boolean, _res: unknown): unknown => undefined,
    Date,
    require: requireFixture,
    __dirname: path.dirname(serverPath),
    Buffer,
    structuredClone: (value: unknown) => JSON.parse(JSON.stringify(value)),
    URL,
    console: { log: jest.fn(), error: jest.fn() },
    process: {
      env: {
        PORT: "3295",
        PLAYWRIGHT_COMPOSER_SANDBOX_API_PORT: "4295",
        PLAYWRIGHT_COMPOSER_SANDBOX_API_ONLY: apiOnly,
      },
      execPath: process.execPath,
      on: jest.fn(),
      exit: jest.fn(),
    },
  };
  vm.runInNewContext(
    fs.readFileSync(serverPath, "utf8") +
      "\nglobalThis.readFixture = (pathname) => mockApiPatternReadRoutes.find((route) => route.pattern.test(pathname))?.response();" +
      '\nglobalThis.mutateChat = (edit, res) => edit ? handleAllowedChatDropEditPost("POST", `/api/drops/${SANDBOX_SUBMITTED_CHAT_DROP_ID}`, "allowed-sandbox-mutation", res) : handleAllowedChatDropPost("POST", "/api/drops", {parts: [{content: SANDBOX_CHAT_DROP_CONTENT}]}, "allowed-sandbox-mutation", res);',
    context
  );
  return {
    server,
    spawn,
    spawnSync,
    readFixture: context.readFixture,
    mutateChat: context.mutateChat,
  };
}

describe("composer sandbox API-only mode", () => {
  it("binds only loopback and does not build or start Next when explicitly enabled", () => {
    const result = loadSandbox("1");
    expect(result.server.listen).toHaveBeenCalledWith(
      4295,
      "127.0.0.1",
      expect.any(Function)
    );
    expect(result.spawnSync).not.toHaveBeenCalled();
    expect(result.spawn).not.toHaveBeenCalled();
  });

  it.each([undefined, "0"])(
    "preserves the existing dev server mode for %s",
    (mode) => {
      const result = loadSandbox(mode);
      expect(result.server.listen).toHaveBeenCalledWith(
        4295,
        "127.0.0.1",
        expect.any(Function)
      );
      expect(result.spawnSync).toHaveBeenCalledTimes(1);
      expect(result.spawn).toHaveBeenCalledWith(
        process.execPath,
        ["/fixture/next", "dev", "-p", "3295", "-H", "localhost"],
        expect.objectContaining({ stdio: "inherit" })
      );
    }
  );
});

it("returns explicit unmanaged invitation state for ordinary sandbox drops", () => {
  const { readFixture } = loadSandbox("1");
  expect(readFixture("/api/drops/ordinary-artwork/collaborations")).toEqual({
    managed: false,
    closed: false,
    artwork_hash: "",
    terms_version: "",
    acceptance_copy: "",
    terms: null,
    collaborators: [],
    invitations: [],
  });
  expect(
    readFixture(
      "/api/drops/ordinary-artwork/collaborations/invitation/response"
    )
  ).toBeUndefined();
});

it("keeps newly submitted and edited sandbox drops inside the live edit window", () => {
  const { mutateChat } = loadSandbox("1");
  const res = { writeHead: jest.fn(), end: jest.fn() };
  const createdAt = 1_799_222_400_000;
  const now = jest.spyOn(Date, "now").mockReturnValue(createdAt);
  try {
    expect(mutateChat(false, res)).toBe(true);
    const submitted = JSON.parse(res.end.mock.calls[0][0]);
    expect(submitted.created_at).toBe(createdAt);
    expect(submitted.updated_at).toBeNull();

    now.mockReturnValue(createdAt + 60_000);
    expect(mutateChat(true, res)).toBe(true);
    const edited = JSON.parse(res.end.mock.calls[1][0]);
    expect(edited.created_at).toBe(createdAt);
    expect(edited.updated_at).toBe(createdAt + 60_000);
  } finally {
    now.mockRestore();
  }
});
