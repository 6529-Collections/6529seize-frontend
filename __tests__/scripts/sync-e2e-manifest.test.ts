import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SCRIPT = path.join(REPO_ROOT, "scripts", "sync-e2e-manifest.cjs");

const {
  loadManifest,
  validateManifest,
  renderPackageJsonScripts,
  applyScriptsToPackageJson,
  renderReadmeTables,
} = require(SCRIPT);

const FIXTURE_MANIFEST = `
const PACKS = [
  {
    scriptKey: "test:e2e:smoke",
    description: "Fixture smoke pack.",
    safety: "local",
    environments: ["local"],
    triggers: ["pr-ci", "manual"],
    specs: ["tests/home/home.spec.ts"],
    grep: "@smoke",
    projects: ["web-desktop-chromium"],
    workers: 1,
  },
  {
    scriptKey: "test:e2e:staging:smoke",
    description: "Fixture staging pack.",
    safety: "readonly",
    environments: ["staging"],
    triggers: ["post-deploy", "manual"],
    env: {
      PLAYWRIGHT_BASE_URL: "https://staging.6529.io",
      PLAYWRIGHT_SKIP_WEB_SERVER: "1",
    },
    specs: ["tests/home/home.spec.ts"],
    projects: ["web-desktop-chromium", "web-mobile-chromium"],
    workers: 1,
  },
];

module.exports = { PACKS };
`;

function writeFixtureRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-manifest-"));
  fs.mkdirSync(path.join(root, "tests"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "tests", "packs.manifest.ts"),
    FIXTURE_MANIFEST
  );
  const packs = loadManifest(path.join(root, "tests", "packs.manifest.ts"));
  const rendered = renderPackageJsonScripts(packs);
  const pkg = {
    name: "fixture",
    scripts: {
      lint: "eslint .",
      ...rendered,
      after: "echo after",
    },
  };
  fs.writeFileSync(
    path.join(root, "package.json"),
    `${JSON.stringify(pkg, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(root, "tests", "README.md"),
    [
      "# Fixture",
      "",
      "<!-- BEGIN GENERATED: e2e-pack-tables -->",
      renderReadmeTables(packs).split("\n").slice(1, -1).join("\n"),
      "<!-- END GENERATED: e2e-pack-tables -->",
      "",
    ].join("\n")
  );
  return root;
}

function runScript(root: string, args: string[]) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: "utf8",
    env: { ...process.env, E2E_MANIFEST_ROOT: root },
  });
}

describe("sync-e2e-manifest", () => {
  it("renders every real manifest pack byte-identically to package.json", () => {
    const packs = loadManifest(
      path.join(REPO_ROOT, "tests", "packs.manifest.ts")
    );
    const rendered = renderPackageJsonScripts(packs);
    const pkg = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf8")
    );
    for (const [key, value] of Object.entries(rendered)) {
      expect(pkg.scripts[key]).toBe(value);
    }
    const ownedInPackage = Object.keys(pkg.scripts).filter((key) =>
      /^test:e2e($|:)/.test(key)
    );
    expect(Object.keys(rendered).sort()).toEqual(ownedInPackage.sort());
  });

  it("validates the real manifest cleanly", () => {
    const packs = loadManifest(
      path.join(REPO_ROOT, "tests", "packs.manifest.ts")
    );
    expect(validateManifest(packs)).toEqual([]);
  });

  it("rejects duplicate keys, unknown projects and unsafe env combos", () => {
    const base = {
      description: "x",
      safety: "readonly",
      environments: ["staging"],
      triggers: ["manual"],
    };
    expect(
      validateManifest([
        { ...base, scriptKey: "test:e2e:a" },
        { ...base, scriptKey: "test:e2e:a" },
      ])
    ).toEqual([expect.stringContaining("duplicate scriptKey")]);
    expect(
      validateManifest([
        { ...base, scriptKey: "test:e2e:a", projects: ["nope"] },
      ])
    ).toEqual([expect.stringContaining('unknown project "nope"')]);
    expect(
      validateManifest([
        {
          ...base,
          scriptKey: "test:e2e:a",
          safety: "staging-write",
          environments: ["production"],
        },
      ])
    ).toEqual([
      expect.stringContaining(
        "staging-write packs must never run in production"
      ),
    ]);
  });

  it("replaces owned keys in place and preserves interleaved keys", () => {
    const pkg = {
      scripts: {
        "test:e2e": "old",
        "test:native-evidence": "keep-me",
        "test:e2e:smoke": "old",
        lint: "keep-me-too",
      },
    };
    const next = applyScriptsToPackageJson(pkg, {
      "test:e2e": "new-default",
      "test:e2e:smoke": "new-smoke",
      "test:e2e:added": "brand-new",
    });
    expect(Object.keys(next.scripts)).toEqual([
      "test:e2e",
      "test:native-evidence",
      "test:e2e:smoke",
      "test:e2e:added",
      "lint",
    ]);
    expect(next.scripts["test:native-evidence"]).toBe("keep-me");
    expect(next.scripts["test:e2e"]).toBe("new-default");
    expect(next.scripts["test:e2e:added"]).toBe("brand-new");
  });

  it("--check passes on a synced fixture and fails with guidance on drift", () => {
    const root = writeFixtureRoot();
    const synced = runScript(root, ["--check"]);
    expect(synced.stderr).toBe("");
    expect(synced.status).toBe(0);

    const pkgPath = path.join(root, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    pkg.scripts["test:e2e:smoke"] = "hand-edited";
    fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

    const drifted = runScript(root, ["--check"]);
    expect(drifted.status).toBe(1);
    expect(drifted.stderr).toContain("package.json is out of sync");
    expect(drifted.stderr).toContain("e2e-manifest:sync");
  });

  it("write mode is idempotent on the fixture", () => {
    const root = writeFixtureRoot();
    const first = runScript(root, []);
    expect(first.status).toBe(0);
    const before = fs.readFileSync(path.join(root, "package.json"), "utf8");
    const second = runScript(root, []);
    expect(second.status).toBe(0);
    const after = fs.readFileSync(path.join(root, "package.json"), "utf8");
    expect(after).toBe(before);
  });
});
