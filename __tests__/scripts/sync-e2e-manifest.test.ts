import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type Pack = {
  scriptKey: string;
  alias?: string;
  description: string;
  safety: "local" | "readonly" | "sandbox";
  environments: string[];
  triggers: string[];
  env?: Record<string, string>;
  specs?: string[];
  projects?: string[];
  workers?: number;
  timeoutMinutes: number;
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const manifestTools = require("../../scripts/sync-e2e-manifest.cjs") as {
  applyScriptsToPackageJson: (
    pkg: { scripts?: Record<string, string> },
    rendered: Record<string, string>
  ) => { scripts: Record<string, string> };
  buildTargets: (root?: string) => Array<{
    path: string;
    current: string;
    next: string;
  }>;
  loadManifest: (manifestPath?: string) => Pack[];
  renderPackageJsonScripts: (packs: Pack[]) => Record<string, string>;
  validateManifest: (packs: Pack[], options?: { root?: string }) => string[];
};

const ROOT = process.cwd();
const SCRIPT_PATH = path.join(ROOT, "scripts", "sync-e2e-manifest.cjs");
const MANIFEST_PATH = path.join(ROOT, "tests", "packs.manifest.cjs");
const clonePack = (pack: Pack) => JSON.parse(JSON.stringify(pack)) as Pack;

describe("E2E pack manifest", () => {
  const packs = manifestTools.loadManifest(MANIFEST_PATH);

  it("defines every package pack once and satisfies the safety contract", () => {
    expect(manifestTools.validateManifest(packs, { root: ROOT })).toEqual([]);
    expect(packs).toHaveLength(54);

    const rendered = manifestTools.renderPackageJsonScripts(packs);
    const packageScripts = JSON.parse(
      fs.readFileSync(path.join(ROOT, "package.json"), "utf8")
    ).scripts as Record<string, string>;
    const checkedInE2eScripts = Object.fromEntries(
      Object.entries(packageScripts).filter(([key]) =>
        /^test:e2e($|:)/.test(key)
      )
    );
    expect(checkedInE2eScripts).toEqual(rendered);
  });

  it("makes deployed packs explicitly read-only and non-empty", () => {
    const staging = packs.filter((pack) => pack.environments[0] === "staging");
    const production = packs.filter(
      (pack) => pack.environments[0] === "production"
    );

    expect(staging).toHaveLength(13);
    expect(
      production.filter((pack) => pack.triggers.includes("cron"))
    ).toHaveLength(10);
    expect(
      production.filter((pack) => pack.triggers.includes("post-deploy"))
    ).toHaveLength(1);

    for (const pack of [...staging, ...production]) {
      expect(pack.safety).toBe("readonly");
      expect(pack.specs?.length).toBeGreaterThan(0);
      expect(pack.env).toMatchObject({
        PLAYWRIGHT_ENV: pack.environments[0],
        PLAYWRIGHT_READONLY: "1",
        PLAYWRIGHT_SKIP_WEB_SERVER: "1",
      });
    }
  });

  it("rejects unsafe production and ambiguous aliases", () => {
    const production = clonePack(
      packs.find((pack) => pack.environments[0] === "production") as Pack
    );
    production.safety = "local";
    (production as Pack & { typo?: boolean }).typo = true;
    production.env = {
      ...production.env,
      PLAYWRIGHT_BASE_URL: "https://example.invalid",
      PLAYWRIGHT_READONLY: "0",
    };
    expect(manifestTools.validateManifest([production])).toEqual(
      expect.arrayContaining([
        expect.stringContaining('production packs must use safety "readonly"'),
        expect.stringContaining(
          "production packs must set PLAYWRIGHT_BASE_URL=https://6529.io"
        ),
        expect.stringContaining(
          "production packs must set PLAYWRIGHT_READONLY=1"
        ),
        expect.stringContaining('unknown field "typo"'),
      ])
    );

    const first = clonePack(packs[0]);
    const second = clonePack(packs[1]);
    first.alias = "duplicate";
    second.alias = "duplicate";
    expect(manifestTools.validateManifest([first, second])).toEqual(
      expect.arrayContaining([
        expect.stringContaining('duplicate alias "duplicate"'),
      ])
    );
  });

  it("rejects spec paths outside the repository", () => {
    const absolute = clonePack(packs[0]);
    absolute.specs = ["/etc/hosts"];
    const traversing = clonePack(packs[0]);
    traversing.specs = ["tests/../package.json"];

    expect(manifestTools.validateManifest([absolute, traversing])).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'spec path "/etc/hosts" must be a safe repository-relative path'
        ),
        expect.stringContaining(
          'spec path "tests/../package.json" must be a safe repository-relative path'
        ),
      ])
    );
  });

  it("adds generated scripts when a package has no previous E2E keys", () => {
    const nextPackage = manifestTools.applyScriptsToPackageJson(
      { scripts: { lint: "eslint ." } },
      {
        "test:e2e": "playwright test",
        "test:e2e:smoke": "playwright test tests/smoke.spec.ts",
      }
    );
    expect(nextPackage.scripts).toEqual({
      lint: "eslint .",
      "test:e2e": "playwright test",
      "test:e2e:smoke": "playwright test tests/smoke.spec.ts",
    });
  });

  it("requires every production cron alias to pass staging first", () => {
    const withoutStagingSocial = packs.filter(
      (pack) =>
        !(
          pack.environments[0] === "staging" && pack.alias === "social-readonly"
        )
    );
    expect(manifestTools.validateManifest(withoutStagingSocial)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'production cron alias "social-readonly" requires a staging post-deploy counterpart'
        ),
      ])
    );
  });

  it("renders both generated targets without changing unrelated scripts", () => {
    const targets = manifestTools.buildTargets(ROOT);
    expect(targets.map((target) => path.basename(target.path))).toEqual([
      "package.json",
      "README.md",
    ]);
    expect(targets.every((target) => target.next.length > 0)).toBe(true);
  });
});

describe("E2E manifest drift command", () => {
  let fixtureRoot = "";

  beforeEach(() => {
    fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-manifest-"));
    fs.mkdirSync(path.join(fixtureRoot, "tests"), { recursive: true });
    fs.writeFileSync(
      path.join(fixtureRoot, "tests", "packs.manifest.cjs"),
      [
        '"use strict";',
        "module.exports = { PACKS: [{",
        'scriptKey: "test:e2e",',
        'description: "Fixture pack.",',
        'safety: "local",',
        'environments: ["local"],',
        'triggers: ["manual"],',
        'specs: ["tests/example.spec.ts"],',
        'projects: ["web-desktop-chromium"],',
        "timeoutMinutes: 5",
        "}] };",
      ].join("\n")
    );
    fs.writeFileSync(path.join(fixtureRoot, "tests", "example.spec.ts"), "");
    fs.writeFileSync(
      path.join(fixtureRoot, "tests", "README.md"),
      [
        "# Fixture",
        "",
        "<!-- BEGIN GENERATED: e2e-pack-table -->",
        "<!-- END GENERATED: e2e-pack-table -->",
        "",
      ].join("\n")
    );
    fs.writeFileSync(
      path.join(fixtureRoot, "package.json"),
      `${JSON.stringify({ name: "fixture", scripts: { lint: "eslint ." } })}\n`
    );
  });

  afterEach(() => {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  });

  const runSync = (args: string[]) =>
    spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
      encoding: "utf8",
      env: { ...process.env, E2E_MANIFEST_ROOT: fixtureRoot },
    });

  it("fails drift, synchronizes, and then passes check mode", () => {
    const drifted = runSync(["--check"]);
    expect(drifted.status).toBe(1);
    expect(drifted.stderr).toContain("generated files drifted");

    expect(runSync([]).status).toBe(0);
    const checked = runSync(["--check"]);
    expect(checked.status).toBe(0);
    expect(checked.stdout).toContain("2 generated targets are in sync");
  });
});
