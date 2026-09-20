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
  vm.runInNewContext(fs.readFileSync(serverPath, "utf8"), {
    require: requireFixture,
    __dirname: path.dirname(serverPath),
    Buffer,
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
  });
  return { server, spawn, spawnSync };
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
