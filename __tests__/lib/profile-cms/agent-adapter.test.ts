import { spawnSync } from "node:child_process";
import path from "node:path";

it("passes the actual stdio client/server, API boundary and reproducible download contract tests", () => {
  const directory = path.join(process.cwd(), "standalone", "profile-cms-agent");
  for (const args of [
    [
      "--test",
      path.join(directory, "api.test.mjs"),
      path.join(directory, "server.test.mjs"),
    ],
    [path.join(directory, "build.mjs"), "--check"],
  ]) {
    const result = spawnSync(process.execPath, args, {
      encoding: "utf8",
      timeout: 20000,
      windowsHide: true,
    });
    if (result.status !== 0)
      throw new Error(
        `CMS agent integration failed: ${result.stdout}\n${result.stderr}`
      );
  }
}, 45000);
