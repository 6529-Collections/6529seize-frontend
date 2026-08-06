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
  changeScope?: "museum";
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
    expect(packs).toHaveLength(71);

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

  it("marks every dedicated Museum pack for change-set selection", () => {
    const museumOnlyPacks = packs.filter(
      (pack) =>
        (pack.specs?.length ?? 0) > 0 &&
        pack.specs?.every((spec) => spec.startsWith("tests/museum/"))
    );

    expect(museumOnlyPacks).toHaveLength(15);
    expect(museumOnlyPacks.every((pack) => pack.changeScope === "museum")).toBe(
      true
    );
    expect(
      museumOnlyPacks
        .map((pack) => `${pack.environments[0]}:${pack.scriptKey}`)
        .sort()
    ).toEqual(
      [
        "local:test:e2e:museum-about",
        "local:test:e2e:museum-data-architecture",
        "local:test:e2e:museum-institutional-practice",
        "local:test:e2e:museum-inside-system",
        "local:test:e2e:museum-rights",
        "production:test:e2e:production:museum-about",
        "production:test:e2e:production:museum-data-architecture",
        "production:test:e2e:production:museum-institutional-practice",
        "production:test:e2e:production:museum-inside-system",
        "production:test:e2e:production:museum-rights",
        "staging:test:e2e:staging:museum-about",
        "staging:test:e2e:staging:museum-data-architecture",
        "staging:test:e2e:staging:museum-institutional-practice",
        "staging:test:e2e:staging:museum-inside-system",
        "staging:test:e2e:staging:museum-rights",
      ].sort()
    );
  });

  it("rejects missing, unknown, or overbroad Museum change scopes", () => {
    const museumPack = clonePack(
      packs.find(
        (pack) => pack.scriptKey === "test:e2e:staging:museum-inside-system"
      ) as Pack
    );
    delete museumPack.changeScope;
    expect(manifestTools.validateManifest([museumPack])).toContain(
      'pack "test:e2e:staging:museum-inside-system": Museum-only packs must set changeScope "museum".'
    );

    const unknownScope = clonePack(museumPack);
    Object.defineProperty(unknownScope, "changeScope", {
      value: "other",
      enumerable: true,
    });
    expect(manifestTools.validateManifest([unknownScope])).toContain(
      'pack "test:e2e:staging:museum-inside-system": unknown changeScope "other".'
    );

    const nonMuseumPack = clonePack(
      packs.find((pack) => pack.scriptKey === "test:e2e:staging") as Pack
    );
    nonMuseumPack.changeScope = "museum";
    expect(manifestTools.validateManifest([nonMuseumPack])).toContain(
      'pack "test:e2e:staging": changeScope "museum" requires only tests/museum specs.'
    );

    const mixedPostDeployPack = clonePack(museumPack);
    delete mixedPostDeployPack.changeScope;
    mixedPostDeployPack.specs?.push("tests/home/home.spec.ts");
    expect(manifestTools.validateManifest([mixedPostDeployPack])).toContain(
      'pack "test:e2e:staging:museum-inside-system": post-deploy packs must not mix Museum and non-Museum specs.'
    );

    const mutatedManifest = packs.map(clonePack);
    delete (
      mutatedManifest.find(
        (pack) => pack.scriptKey === "test:e2e:staging:museum-inside-system"
      ) as Pack
    ).changeScope;
    expect(
      manifestTools.validateManifest(mutatedManifest, { root: ROOT })
    ).toContain(
      'pack "test:e2e:staging:museum-inside-system": Museum-only packs must set changeScope "museum".'
    );
  });

  it("makes deployed packs explicitly read-only and non-empty", () => {
    const staging = packs.filter((pack) => pack.environments[0] === "staging");
    const production = packs.filter(
      (pack) => pack.environments[0] === "production"
    );

    expect(staging).toHaveLength(18);
    expect(
      staging.filter((pack) => pack.triggers.includes("post-deploy"))
    ).toHaveLength(17);
    expect(production).toHaveLength(17);
    expect(
      production.filter((pack) => pack.triggers.includes("cron"))
    ).toHaveLength(10);
    expect(
      production.filter((pack) => pack.triggers.includes("post-deploy"))
    ).toHaveLength(16);

    for (const environmentPacks of [staging, production]) {
      const specs = environmentPacks
        .filter((pack) => pack.triggers.includes("post-deploy"))
        .flatMap((pack) => pack.specs ?? []);
      expect(new Set(specs).size).toBe(specs.length);
    }

    for (const pack of [...staging, ...production]) {
      expect(pack.safety).toBe("readonly");
      expect(pack.specs?.length).toBeGreaterThan(0);
      expect(pack.env).toMatchObject({
        PLAYWRIGHT_ENV: pack.environments[0],
        PLAYWRIGHT_READONLY: "1",
        PLAYWRIGHT_SKIP_WEB_SERVER: "1",
      });
    }

    for (const environment of ["local", "staging", "production"]) {
      const museumPack = packs.find(
        (pack) =>
          pack.environments[0] === environment &&
          pack.specs?.includes(
            "tests/museum/institutional-practice-readonly.spec.ts"
          ) &&
          pack.scriptKey !== "test:e2e:production:readonly"
      );
      expect(museumPack).toMatchObject({
        safety: "readonly",
        projects: ["web-desktop-chromium", "web-mobile-chromium"],
        workers: 1,
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

    const first = clonePack(packs[0]!);
    const second = clonePack(packs[1]!);
    first.alias = "duplicate";
    second.alias = "duplicate";
    expect(manifestTools.validateManifest([first, second])).toEqual(
      expect.arrayContaining([
        expect.stringContaining('duplicate alias "duplicate"'),
      ])
    );
  });

  it("rejects spec paths outside the repository", () => {
    const absolute = clonePack(packs[0]!);
    absolute.specs = ["/etc/hosts"];
    const traversing = clonePack(packs[0]!);
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
