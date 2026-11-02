import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type Pack = {
  scriptKey: string;
  alias?: string;
  description: string;
  safety: "local" | "readonly" | "sandbox" | "stateful";
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
    // Independent sandbox packs can land together on the staging branch.
    // Validate the complete checked-in inventory below instead of a fixed count.
    expect(packs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scriptKey: "test:e2e:notifications-inbox-sandbox",
          specs: ["tests/auth/notifications-inbox-sandbox.spec.ts"],
        }),
      ])
    );

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

  it("runs wave creation on both web shells in its isolated PR sandbox lane", () => {
    expect(
      packs.find((pack) => pack.scriptKey === "test:e2e:wave-creation-sandbox")
    ).toMatchObject({
      safety: "sandbox",
      environments: ["local"],
      triggers: ["pr-ci", "manual"],
      specs: ["tests/social/create-wave-sandbox.spec.ts"],
      projects: ["web-desktop-chromium", "web-mobile-chromium"],
      env: {
        PLAYWRIGHT_BASE_URL: "http://localhost:3298",
        NEXT_DEV_DIST_DIR: ".next-playwright-wave-creation",
      },
    });
    const workflow = fs.readFileSync(
      path.join(ROOT, ".github/workflows/app-pr-ci.yml"),
      "utf8"
    );
    expect(workflow).toContain("if (waveCreationBrowserRequired)");
    expect(workflow).toContain("if: matrix.lane == 'playwright-wave-creation'");
    expect(workflow).toContain(
      "run: ./bin/6529 run test:e2e:wave-creation-sandbox"
    );
  });

  it("runs native competitions on both web shells in a dedicated PR sandbox lane", () => {
    const native = packs.find(
      (pack) => pack.scriptKey === "test:e2e:native-competition-sandbox"
    );
    expect(native).toMatchObject({
      safety: "sandbox",
      environments: ["local"],
      triggers: ["pr-ci", "manual"],
      specs: [
        "tests/social/native-competition-sandbox.spec.ts",
        "tests/social/wave-notification-settings-sandbox.spec.ts",
        "tests/social/wave-switch-loading.spec.ts",
        "tests/social/wave-loading-sandbox.spec.ts",
      ],
      projects: ["web-desktop-chromium", "web-mobile-chromium"],
      env: {
        PLAYWRIGHT_BASE_URL: "http://localhost:3297",
      },
    });
    const workflow = fs.readFileSync(
      path.join(ROOT, ".github/workflows/app-pr-ci.yml"),
      "utf8"
    );
    expect(workflow).toContain(
      "plan.checks.playwright_native_competition?.required"
    );
    expect(workflow).toContain(
      "if: matrix.lane == 'playwright-native-competition'"
    );
    expect(workflow).toContain(
      "run: ./bin/6529 run test:e2e:native-competition-sandbox"
    );
  });

  it("keeps the encrypted messages pack on loopback with its own ports and dist dir", () => {
    const e2ee = packs.filter(
      (pack) => pack.scriptKey === "test:e2e:e2ee-sandbox"
    );
    expect(e2ee).toHaveLength(1);
    expect(e2ee[0]).toMatchObject({
      safety: "sandbox",
      environments: ["local"],
      specs: ["tests/e2ee"],
      projects: ["web-desktop-chromium", "web-mobile-chromium"],
      workers: 1,
      env: {
        PLAYWRIGHT_ENV: "local",
        PLAYWRIGHT_E2EE_SANDBOX: "1",
        USE_DEV_AUTH: "true",
        PLAYWRIGHT_BASE_URL: "http://localhost:3299",
        PLAYWRIGHT_WEB_SERVER_URL: "http://localhost:3299",
        PLAYWRIGHT_COMPOSER_SANDBOX_API_PORT: "4299",
        NEXT_DEV_DIST_DIR: ".next-playwright-e2ee",
        PLAYWRIGHT_WEB_SERVER_COMMAND:
          "node tests/support/composerSandboxServer.cjs",
      },
    });
  });

  it("isolates submission artwork from the complete competition pack", () => {
    expect(
      packs.find(
        (pack) => pack.scriptKey === "test:e2e:submission-artwork-sandbox"
      )
    ).toMatchObject({
      safety: "sandbox",
      environments: ["local"],
      triggers: ["pr-ci", "manual"],
      specs: ["tests/media/submission-artwork-sandbox.spec.ts"],
      projects: ["web-desktop-chromium", "web-mobile-chromium"],
      env: {
        PLAYWRIGHT_AUTH_SANDBOX: "1",
        NEXT_DEV_DIST_DIR: ".next-playwright-submission-artwork",
      },
    });
    const nativeSpec = fs.readFileSync(
      path.join(ROOT, "tests/social/native-competition-sandbox.spec.ts"),
      "utf8"
    );
    expect(nativeSpec).not.toContain("defineSubmissionArtworkPreviewTests");
    const workflow = fs.readFileSync(
      path.join(ROOT, ".github/workflows/app-pr-ci.yml"),
      "utf8"
    );
    expect(workflow).toContain(
      "if: matrix.lane == 'playwright-submission-artwork'"
    );
    expect(workflow).toContain(
      "run: ./bin/6529 run test:e2e:submission-artwork-sandbox"
    );
  });

  it("keeps artwork documentation mutations in the local desktop and mobile sandbox", () => {
    const artwork = packs.filter(
      (pack) => pack.scriptKey === "test:e2e:artwork-documentation-sandbox"
    );
    expect(artwork).toHaveLength(1);
    expect(artwork[0]).toMatchObject({
      safety: "sandbox",
      environments: ["local"],
      triggers: ["pr-ci", "manual"],
      specs: ["tests/artwork-documentation/workflow-sandbox.spec.ts"],
      projects: ["web-desktop-chromium", "web-mobile-chromium"],
      env: {
        PLAYWRIGHT_ENV: "local",
        PLAYWRIGHT_COMPOSER_SANDBOX: "1",
        PLAYWRIGHT_BASE_URL: "http://localhost:3295",
        PLAYWRIGHT_WEB_SERVER_URL: "http://localhost:3295",
        PLAYWRIGHT_COMPOSER_SANDBOX_API_PORT: "4295",
        PLAYWRIGHT_READONLY: "0",
        USE_DEV_AUTH: "false",
      },
    });
  });

  it("marks every dedicated Museum pack for change-set selection", () => {
    const museumOnlyPacks = packs.filter(
      (pack) =>
        (pack.specs?.length ?? 0) > 0 &&
        pack.specs?.every((spec) => spec.startsWith("tests/museum/"))
    );

    expect(museumOnlyPacks).toHaveLength(18);
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
        "local:test:e2e:museum-network-ia",
        "local:test:e2e:museum-rights",
        "production:test:e2e:production:museum-about",
        "production:test:e2e:production:museum-data-architecture",
        "production:test:e2e:production:museum-institutional-practice",
        "production:test:e2e:production:museum-inside-system",
        "production:test:e2e:production:museum-network-ia",
        "production:test:e2e:production:museum-rights",
        "staging:test:e2e:staging:museum-about",
        "staging:test:e2e:staging:museum-data-architecture",
        "staging:test:e2e:staging:museum-institutional-practice",
        "staging:test:e2e:staging:museum-inside-system",
        "staging:test:e2e:staging:museum-network-ia",
        "staging:test:e2e:staging:museum-rights",
      ].sort()
    );
  });

  it("parallelizes deployed institutional-practice sweeps without inflating staging timeout", () => {
    const staging = packs.find(
      (pack) =>
        pack.scriptKey === "test:e2e:staging:museum-institutional-practice"
    );
    const production = packs.find(
      (pack) =>
        pack.scriptKey === "test:e2e:production:museum-institutional-practice"
    );
    expect(staging).toMatchObject({ timeoutMinutes: 15, workers: 2 });
    expect(production).toMatchObject({ timeoutMinutes: 30, workers: 2 });
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
    // Opt-in stateful packs have their own contract (next test).
    const staging = packs.filter(
      (pack) => pack.environments[0] === "staging" && pack.safety !== "stateful"
    );
    const production = packs.filter(
      (pack) => pack.environments[0] === "production"
    );

    expect(staging).toHaveLength(20);
    expect(
      staging.filter((pack) => pack.triggers.includes("post-deploy"))
    ).toHaveLength(19);
    expect(production).toHaveLength(19);
    expect(
      production.filter((pack) => pack.triggers.includes("cron"))
    ).toHaveLength(12);
    expect(
      production.filter((pack) => pack.triggers.includes("post-deploy"))
    ).toHaveLength(18);

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
        workers: environment === "local" ? 1 : 2,
      });
    }
  });

  it("keeps the staging E2EE pack opt-in, single-worker and off every automatic lane", () => {
    const stateful = packs.filter((pack) => pack.safety === "stateful");
    expect(stateful).toEqual([
      expect.objectContaining({
        scriptKey: "test:e2e:staging:e2ee",
        alias: "e2ee-staging",
        environments: ["staging"],
        triggers: ["manual"],
        specs: ["tests/staging-e2ee/encrypted-dm-staging.spec.ts"],
        projects: ["web-desktop-chromium"],
        workers: 1,
        env: {
          PLAYWRIGHT_BASE_URL: "https://staging.6529.io",
          PLAYWRIGHT_SKIP_WEB_SERVER: "1",
          PLAYWRIGHT_ENV: "staging",
          PLAYWRIGHT_READONLY: "0",
          PLAYWRIGHT_E2EE_STAGING: "1",
        },
      }),
    ]);
    expect((stateful[0] as Pack & { traceOff?: boolean }).traceOff).toBe(true);

    const misconfigured = clonePack(stateful[0]!);
    misconfigured.triggers = ["post-deploy", "manual"];
    misconfigured.workers = 2;
    misconfigured.env = {
      ...misconfigured.env,
      PLAYWRIGHT_BASE_URL: "https://6529.io",
    };
    delete (misconfigured as Pack & { traceOff?: boolean }).traceOff;
    expect(manifestTools.validateManifest([misconfigured])).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "stateful packs must use only the manual trigger"
        ),
        expect.stringContaining("stateful packs must set workers to 1"),
        expect.stringContaining("stateful packs must turn traces off"),
        expect.stringContaining(
          "stateful packs must set PLAYWRIGHT_BASE_URL=https://staging.6529.io"
        ),
      ])
    );

    const production = clonePack(stateful[0]!);
    production.environments = ["production"];
    expect(manifestTools.validateManifest([production])).toEqual(
      expect.arrayContaining([
        expect.stringContaining("stateful packs must target staging"),
      ])
    );
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

    const first = clonePack(
      packs.find((pack) => pack.scriptKey === "test:e2e") as Pack
    );
    const second = clonePack(
      packs.find((pack) => pack.scriptKey === "test:e2e:all-projects") as Pack
    );
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
