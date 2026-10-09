/** @jest-environment node */
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

describe("development server exit status", () => {
  it.each([0, 7, null])(
    "preserves exit code %s and fails on a signal",
    async (code) => {
      // Stub the port check and Next.js process; no development server is started.
      const child = new EventEmitter();
      const exit = jest.fn();
      const dependencies: Record<string, unknown> = {
        child_process: { spawn: jest.fn(() => child) },
        "node:path": path,
        net: {
          createServer: () => {
            const server = Object.assign(new EventEmitter(), {
              listen: () => server.emit("listening"),
              close: (callback: () => void) => callback(),
            });
            return server;
          },
        },
      };
      const requireStub = Object.assign(
        (name: string) => {
          if (!(name in dependencies))
            throw new Error(`Unexpected module ${name}`);
          return dependencies[name];
        },
        { resolve: () => "/stub/next" }
      );
      vm.runInNewContext(
        fs.readFileSync("scripts/dev-with-fallback.cjs", "utf8"),
        {
          require: requireStub,
          __dirname: path.resolve("scripts"),
          process: {
            env: {},
            argv: ["node", "scripts/dev-with-fallback.cjs"],
            execPath: process.execPath,
            exit,
          },
          console: { log: jest.fn(), error: jest.fn() },
        }
      );
      await new Promise<void>((resolve) => setImmediate(resolve));
      child.emit("exit", code, code === null ? "SIGKILL" : null);
      expect(exit).toHaveBeenCalledWith(code ?? 1);
      expect(exit).toHaveBeenCalledTimes(1);
    }
  );
});
