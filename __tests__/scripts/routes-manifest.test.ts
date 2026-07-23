import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SCRIPT = path.join(REPO_ROOT, "scripts", "routes-manifest.cjs");

const { scanAppRoutes, validateEntry } = require(SCRIPT);

function writeFixtureApp(routes: string[]): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "routes-manifest-"));
  for (const route of routes) {
    const dir = path.join(root, "app", ...route.split("/").filter(Boolean));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "page.tsx"),
      "export default () => null;\n"
    );
  }
  fs.mkdirSync(path.join(root, "tests"), { recursive: true });
  return root;
}

function runScript(root: string, args: string[]) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: "utf8",
    env: { ...process.env, ROUTES_MANIFEST_ROOT: root },
  });
}

function readManifest(root: string) {
  return JSON.parse(
    fs.readFileSync(path.join(root, "tests", "routes.manifest.json"), "utf8")
  );
}

describe("routes-manifest scan", () => {
  it("walks nested, dynamic and root routes deterministically", () => {
    const root = writeFixtureApp([
      "/",
      "/about",
      "/waves/[wave]",
      "/a/[...rest]",
    ]);
    const scanned = scanAppRoutes(path.join(root, "app"));
    expect(scanned).toEqual(["/", "/a/[...rest]", "/about", "/waves/[wave]"]);
    expect(scanAppRoutes(path.join(root, "app"))).toEqual(scanned);
  });

  it("ignores route groups and parallel-route slots", () => {
    const root = writeFixtureApp(["/plain"]);
    const grouped = path.join(root, "app", "(group)", "inside");
    fs.mkdirSync(grouped, { recursive: true });
    fs.writeFileSync(
      path.join(grouped, "page.tsx"),
      "export default () => null;\n"
    );
    const slot = path.join(root, "app", "@modal", "thing");
    fs.mkdirSync(slot, { recursive: true });
    fs.writeFileSync(
      path.join(slot, "page.tsx"),
      "export default () => null;\n"
    );
    expect(scanAppRoutes(path.join(root, "app"))).toEqual([
      "/inside",
      "/plain",
    ]);
  });
});

describe("routes-manifest validateEntry", () => {
  it("demands a reason for exemptions and known projects", () => {
    expect(validateEntry("/x", { classification: "exempt" })).toEqual([
      expect.stringContaining("no exemptReason"),
    ]);
    expect(
      validateEntry("/x", { classification: "crawlable", projects: ["nope"] })
    ).toEqual([expect.stringContaining('unknown project "nope"')]);
    expect(
      validateEntry("/x", {
        classification: "exempt",
        exemptReason: "test page",
      })
    ).toEqual([]);
  });
});

describe("routes-manifest CLI ratchet", () => {
  it("update inserts UNCLASSIFIED, check fails with actionable guidance, classify fixes it", () => {
    const root = writeFixtureApp(["/", "/about"]);

    const update = runScript(root, ["--update"]);
    expect(update.status).toBe(0);
    expect(update.stdout).toContain("2 new as UNCLASSIFIED");

    const failing = runScript(root, []);
    expect(failing.status).toBe(1);
    expect(failing.stderr).toContain("/about is UNCLASSIFIED");
    expect(failing.stderr).toContain("crawlable");

    const manifest = readManifest(root);
    manifest.routes["/"] = { classification: "crawlable" };
    manifest.routes["/about"] = { classification: "crawlable" };
    fs.writeFileSync(
      path.join(root, "tests", "routes.manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`
    );
    const passing = runScript(root, []);
    expect(passing.stderr).toBe("");
    expect(passing.status).toBe(0);
    expect(passing.stdout).toContain("2 routes classified");
  });

  it("flags new routes on disk and stale manifest entries", () => {
    const root = writeFixtureApp(["/one"]);
    runScript(root, ["--update"]);
    const manifest = readManifest(root);
    manifest.routes["/one"] = { classification: "crawlable" };
    fs.writeFileSync(
      path.join(root, "tests", "routes.manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`
    );
    expect(runScript(root, []).status).toBe(0);

    // New route appears on disk -> red with the file named.
    const added = path.join(root, "app", "two");
    fs.mkdirSync(added, { recursive: true });
    fs.writeFileSync(
      path.join(added, "page.tsx"),
      "export default () => null;\n"
    );
    const newRoute = runScript(root, []);
    expect(newRoute.status).toBe(1);
    expect(newRoute.stderr).toContain("/two exists on disk");
    expect(newRoute.stderr).toContain("routes-manifest:update");

    // Route deleted from disk -> stale entry red.
    fs.rmSync(path.join(root, "app", "two"), { recursive: true });
    fs.rmSync(path.join(root, "app", "one"), { recursive: true });
    const stale = runScript(root, []);
    expect(stale.status).toBe(1);
    expect(stale.stderr).toContain("/one is in tests/routes.manifest.json");

    // update drops stale entries and preserves nothing unexpected.
    const drop = runScript(root, ["--update"]);
    expect(drop.stdout).toContain("stale dropped");
  });

  it("update preserves existing classifications", () => {
    const root = writeFixtureApp(["/keep"]);
    runScript(root, ["--update"]);
    const manifest = readManifest(root);
    manifest.routes["/keep"] = {
      classification: "fixture",
      fixture: { staging: "/keep/1" },
    };
    fs.writeFileSync(
      path.join(root, "tests", "routes.manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`
    );
    runScript(root, ["--update"]);
    expect(readManifest(root).routes["/keep"].fixture.staging).toBe("/keep/1");
  });
});
