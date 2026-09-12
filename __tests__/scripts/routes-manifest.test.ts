import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SCRIPT = path.join(REPO_ROOT, "scripts", "routes-manifest.cjs");

const { scanAppRoutes, validateEntry } =
  require("../../scripts/routes-manifest.cjs") as {
    scanAppRoutes: (appDir: string) => string[];
    validateEntry: (route: string, entry: unknown) => string[];
  };
const fixtureRoots: string[] = [];
afterEach(() => {
  for (const root of fixtureRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function writeFixtureApp(routes: string[]): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "routes-manifest-"));
  fixtureRoots.push(root);
  fs.mkdirSync(path.join(root, "app"), { recursive: true });
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
  ) as {
    schema_version: number;
    routes: Record<
      string,
      {
        classification: string;
        fixture?: Record<string, string>;
        fixtureOmissions?: Record<string, string>;
      }
    >;
  };
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

  it("removes route groups, excludes private subtrees and decodes escaped underscores", () => {
    const root = writeFixtureApp([
      "/(group)/inside",
      "/plain",
      "/_private/nested",
      "/%5Fpublic",
    ]);
    expect(scanAppRoutes(path.join(root, "app"))).toEqual([
      "/_public",
      "/inside",
      "/plain",
    ]);
  });

  it.each(["@modal", "(.)photo", "(..)photo", "(..)(..)photo", "(...)photo"])(
    "fails closed for unsupported %s segments",
    (segment) => {
      const root = writeFixtureApp([`/${segment}/thing`]);
      expect(() => scanAppRoutes(path.join(root, "app"))).toThrow(
        "Unsupported route segment"
      );
      const before = runScript(root, ["--update"]);
      expect(before.status).toBe(1);
      expect(
        fs.existsSync(path.join(root, "tests", "routes.manifest.json"))
      ).toBe(false);
    }
  );

  it("discovers all standard page extensions, but excludes handlers and colocation files", () => {
    const root = writeFixtureApp([]);
    for (const ext of ["js", "jsx", "ts", "tsx"]) {
      const dir = path.join(root, "app", ext);
      fs.mkdirSync(dir);
      fs.writeFileSync(path.join(dir, `page.${ext}`), "");
    }
    fs.writeFileSync(path.join(root, "app", "route.ts"), "");
    fs.writeFileSync(path.join(root, "app", "page.client.tsx"), "");
    expect(scanAppRoutes(path.join(root, "app"))).toEqual([
      "/js",
      "/jsx",
      "/ts",
      "/tsx",
    ]);
  });

  it("rejects route-group collisions instead of overwriting a page", () => {
    const root = writeFixtureApp(["/(one)/same", "/(two)/same"]);
    expect(() => scanAppRoutes(path.join(root, "app"))).toThrow(
      "Duplicate page route /same"
    );
  });
});

describe("routes-manifest validateEntry", () => {
  it.each([
    null,
    [],
    "crawlable",
    {},
    { classification: "typo" },
    { classification: "crawlable", projects: "web-desktop-chromium" },
    { classification: "crawlable", projects: [] },
    {
      classification: "crawlable",
      projects: ["web-desktop-chromium", "web-desktop-chromium"],
    },
    { classification: "exempt", exemptReason: " " },
    { classification: "crawlable", fixtures: {} },
  ])("rejects malformed classification %j", (entry) => {
    expect(validateEntry("/x", entry).length).toBeGreaterThan(0);
  });

  it("rejects dynamic routes marked crawlable and fixture fields on other classifications", () => {
    expect(
      validateEntry("/x/[id]", { classification: "crawlable" }).join()
    ).toContain("is dynamic");
    expect(
      validateEntry("/x", { classification: "auth", fixture: {} }).join()
    ).toContain("require fixture classification");
  });

  it.each([
    undefined,
    null,
    [],
    ["/x/1"],
    "staging",
    { prod: "/x/1" },
    { staging: "" },
    { staging: 1 },
  ])("rejects malformed or incomplete per-env fixtures %j", (fixture) => {
    expect(
      validateEntry("/x/[id]", { classification: "fixture", fixture }).length
    ).toBeGreaterThan(0);
  });

  it("requires an explicit omission for each environment without a fixture", () => {
    const entry = {
      classification: "fixture",
      fixture: { production: "/x/1" },
    };
    expect(validateEntry("/x/[id]", entry)).toEqual([
      expect.stringContaining("fixtureOmissions.staging"),
    ]);
    expect(
      validateEntry("/x/[id]", {
        ...entry,
        fixtureOmissions: { staging: "No stable staging record." },
      })
    ).toEqual([]);
    expect(
      validateEntry("/x/[id]", {
        ...entry,
        fixtureOmissions: { staging: " ", production: "Duplicate." },
      }).length
    ).toBeGreaterThan(0);
    expect(
      validateEntry("/x/[id]", {
        ...entry,
        fixtureOmissions: { staging: "No record.", production: "Duplicate." },
      }).join()
    ).toContain("not both");
    expect(
      validateEntry("/x/[id]", {
        classification: "fixture",
        fixtureOmissions: {
          staging: "No staging record.",
          production: "No production record.",
        },
      })
    ).toEqual([]);
  });

  it.each([
    "https://example.com/x/1",
    "//example.com/x/1",
    "/x/[id]",
    "/x/1?token=secret",
    "/x/1#part",
    "/x/../1",
    "/x/%2e%2e",
    "/x/%5bid%5d",
    "/x/%5cother",
    "/other/1",
    "/x/1/extra",
    "/x/%zz",
  ])("rejects an unsafe, unresolved or mismatched fixture %s", (url) => {
    expect(
      validateEntry("/x/[id]", {
        classification: "fixture",
        fixture: { staging: url, production: url },
      }).length
    ).toBeGreaterThan(0);
  });

  it.each([
    ["/x/[...path]", "/x/one/two"],
    ["/x/[[...path]]", "/x"],
    ["/x/[[...path]]", "/x/one"],
    ["/[user]/[...path]", "/alice/one/two"],
  ])("accepts matching catch-all %s -> %s", (route, url) => {
    expect(
      validateEntry(route, {
        classification: "fixture",
        fixture: { staging: url, production: url },
      })
    ).toEqual([]);
  });

  it("rejects an empty required catch-all", () => {
    expect(
      validateEntry("/x/[...path]", {
        classification: "fixture",
        fixture: { staging: "/x", production: "/x" },
      }).join()
    ).toContain("does not match");
  });
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
    expect(readManifest(root).routes["/keep"]?.fixture?.["staging"]).toBe(
      "/keep/1"
    );
  });

  it.each([
    "{",
    "null",
    "[]",
    '{"schema_version":2,"routes":{}}',
    '{"schema_version":1,"routes":[]}',
    '{"schema_version":1}',
  ])("fails clearly without overwriting malformed manifest %s", (source) => {
    const root = writeFixtureApp(["/"]);
    const target = path.join(root, "tests", "routes.manifest.json");
    fs.writeFileSync(target, source);
    for (const args of [[], ["--update"]]) {
      const result = runScript(root, args);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("routes-manifest:");
      expect(fs.readFileSync(target, "utf8")).toBe(source);
    }
  });

  it("prints route JSON and rejects unknown or conflicting flags", () => {
    const root = writeFixtureApp(["/one"]);
    expect(JSON.parse(runScript(root, ["--json"]).stdout)).toEqual(["/one"]);
    expect(runScript(root, ["--typo"]).status).toBe(1);
    expect(runScript(root, ["--json", "--update"]).status).toBe(1);
  });

  it("checks the current application inventory in CI", () => {
    const result = runScript(REPO_ROOT, []);
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("not measured browser coverage");
  });
});
