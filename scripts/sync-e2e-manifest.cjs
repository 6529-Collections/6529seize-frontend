#!/usr/bin/env node
"use strict";

/**
 * Syncs everything derived from tests/packs.manifest.ts:
 *
 * - the `test:e2e*` script block in package.json (in-place, key-by-key, so
 *   hand-managed keys interleaved with the block keep their position)
 * - the generated pack tables in tests/README.md (marker region)
 *
 * Usage:
 *   node scripts/sync-e2e-manifest.cjs            # write generated targets
 *   node scripts/sync-e2e-manifest.cjs --check    # fail on drift (CI)
 *
 * Dependency-free by design: it runs on a bare checkout in the Debt Ratchet
 * workflow. The manifest is CommonJS-styled TypeScript loaded through Node's
 * built-in type stripping, which needs Node >= 22.18.
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env["E2E_MANIFEST_ROOT"]
  ? path.resolve(process.env["E2E_MANIFEST_ROOT"])
  : path.resolve(__dirname, "..");

const MANIFEST_PATH = path.join(ROOT, "tests", "packs.manifest.ts");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");
const README_PATH = path.join(ROOT, "tests", "README.md");

const OWNED_KEY_PATTERN = /^test:e2e($|:)/;
const GUARD_PREFIX = "node scripts/require-6529-command.cjs && ";
const README_BEGIN = "<!-- BEGIN GENERATED: e2e-pack-tables -->";
const README_END = "<!-- END GENERATED: e2e-pack-tables -->";

const KNOWN_PROJECTS = new Set([
  "web-desktop-chromium",
  "web-mobile-chromium",
  "web-desktop-firefox",
  "web-desktop-webkit",
  "capacitor-ios-sim",
  "capacitor-android-sim",
  "electron-shell-sim",
]);
const KNOWN_SAFETY = new Set([
  "readonly",
  "sandbox",
  "local",
  "staging-write",
  "prod-canary",
]);
const KNOWN_ENVIRONMENTS = new Set(["local", "staging", "production"]);
const KNOWN_TRIGGERS = new Set(["post-deploy", "cron", "pr-ci", "manual"]);

function loadManifest(manifestPath = MANIFEST_PATH) {
  let loaded;
  try {
    loaded = require(manifestPath);
  } catch (error) {
    const code = error && error.code;
    if (
      code === "ERR_UNKNOWN_FILE_EXTENSION" ||
      code === "ERR_INVALID_TYPESCRIPT_SYNTAX" ||
      code === "ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX"
    ) {
      fail(
        `Could not load ${rel(manifestPath)} (${code}). ` +
          "The e2e manifest tooling needs Node >= 22.18 (built-in TypeScript " +
          "type stripping) and an import/export-free, erasable-syntax-only " +
          "manifest file."
      );
    }
    throw error;
  }
  if (!loaded || !Array.isArray(loaded.PACKS)) {
    fail(`${rel(manifestPath)} must export { PACKS: PackDefinition[] }.`);
  }
  return loaded.PACKS;
}

function validateManifest(packs) {
  const problems = [];
  const seen = new Set();
  for (const pack of packs) {
    const where = `pack "${pack && pack.scriptKey}"`;
    if (!pack.scriptKey || !OWNED_KEY_PATTERN.test(pack.scriptKey)) {
      problems.push(`${where}: scriptKey must match ${OWNED_KEY_PATTERN}.`);
      continue;
    }
    if (seen.has(pack.scriptKey)) {
      problems.push(`${where}: duplicate scriptKey.`);
    }
    seen.add(pack.scriptKey);
    if (!pack.description) {
      problems.push(`${where}: description is required.`);
    }
    if (!KNOWN_SAFETY.has(pack.safety)) {
      problems.push(`${where}: unknown safety "${pack.safety}".`);
    }
    if (
      !Array.isArray(pack.environments) ||
      pack.environments.length === 0 ||
      pack.environments.some((env) => !KNOWN_ENVIRONMENTS.has(env))
    ) {
      problems.push(`${where}: environments must be non-empty and known.`);
    }
    if (
      !Array.isArray(pack.triggers) ||
      pack.triggers.length === 0 ||
      pack.triggers.some((trigger) => !KNOWN_TRIGGERS.has(trigger))
    ) {
      problems.push(`${where}: triggers must be non-empty and known.`);
    }
    for (const project of pack.projects || []) {
      if (!KNOWN_PROJECTS.has(project)) {
        problems.push(`${where}: unknown project "${project}".`);
      }
    }
    if (
      pack.safety === "staging-write" &&
      (pack.environments || []).includes("production")
    ) {
      problems.push(
        `${where}: staging-write packs must never run in production.`
      );
    }
    if (
      pack.safety === "readonly" &&
      (pack.environments || []).includes("production") &&
      !(pack.env && pack.env["PLAYWRIGHT_BASE_URL"] === "https://6529.io")
    ) {
      problems.push(
        `${where}: production readonly packs must set PLAYWRIGHT_BASE_URL=https://6529.io.`
      );
    }
  }
  return problems;
}

function renderEnvPrefix(env) {
  if (!env) {
    return "";
  }
  const pairs = Object.entries(env).map(([key, value]) =>
    /\s/.test(value) ? `${key}="${value}"` : `${key}=${value}`
  );
  return `cross-env ${pairs.join(" ")} `;
}

function renderScript(pack) {
  let command = `${GUARD_PREFIX}${renderEnvPrefix(pack.env)}playwright test`;
  if (pack.specs && pack.specs.length > 0) {
    command += ` ${pack.specs.join(" ")}`;
  }
  if (pack.grep) {
    command += ` --grep ${pack.grep}`;
  }
  for (const project of pack.projects || []) {
    command += ` --project=${project}`;
  }
  if (pack.workers) {
    command += ` --workers=${pack.workers}`;
  }
  if (pack.traceOff) {
    command += " --trace=off";
  }
  if (pack.extraArgs && pack.extraArgs.length > 0) {
    command += ` ${pack.extraArgs.join(" ")}`;
  }
  return command;
}

function renderPackageJsonScripts(packs) {
  const rendered = {};
  for (const pack of packs) {
    rendered[pack.scriptKey] = renderScript(pack);
  }
  return rendered;
}

/**
 * Replaces owned keys in place so hand-managed scripts interleaved with the
 * generated block (for example test:native-evidence*) keep their position.
 * Packs without an existing key are appended after the last owned key.
 */
function applyScriptsToPackageJson(pkg, rendered) {
  const scripts = pkg.scripts || {};
  const existingOwned = Object.keys(scripts).filter((key) =>
    OWNED_KEY_PATTERN.test(key)
  );
  const missingFromManifest = existingOwned.filter((key) => !(key in rendered));
  if (missingFromManifest.length > 0) {
    fail(
      "package.json has test:e2e scripts with no manifest entry: " +
        `${missingFromManifest.join(", ")}. Add them to tests/packs.manifest.ts ` +
        "(or remove them there deliberately) and rerun " +
        "`./bin/6529 run e2e-manifest:sync`."
    );
  }
  const nextScripts = {};
  let lastOwnedIndex = -1;
  const entries = Object.entries(scripts);
  entries.forEach(([key], index) => {
    if (OWNED_KEY_PATTERN.test(key)) {
      lastOwnedIndex = index;
    }
  });
  entries.forEach(([key, value], index) => {
    nextScripts[key] = OWNED_KEY_PATTERN.test(key) ? rendered[key] : value;
    if (index === lastOwnedIndex) {
      for (const [renderedKey, renderedValue] of Object.entries(rendered)) {
        if (!(renderedKey in scripts)) {
          nextScripts[renderedKey] = renderedValue;
        }
      }
    }
  });
  return { ...pkg, scripts: nextScripts };
}

function renderReadmeTables(packs) {
  const lines = [
    README_BEGIN,
    "",
    "This section is generated from `tests/packs.manifest.ts` by",
    "`./bin/6529 run e2e-manifest:sync`. Do not edit it by hand.",
    "",
    "| Pack | Safety | Environments | Triggers | Description |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const pack of packs) {
    lines.push(
      `| \`${pack.scriptKey}\` | ${pack.safety} | ${pack.environments.join(
        ", "
      )} | ${pack.triggers.join(", ")} | ${pack.description} |`
    );
  }
  lines.push("", README_END);
  return lines.join("\n");
}

function spliceReadme(readme, generated) {
  const beginIndex = readme.indexOf(README_BEGIN);
  const endIndex = readme.indexOf(README_END);
  if (beginIndex === -1 || endIndex === -1 || endIndex < beginIndex) {
    fail(
      `tests/README.md is missing the generated pack-table markers. Add a ` +
        `"${README_BEGIN}" / "${README_END}" region and rerun the sync.`
    );
  }
  return (
    readme.slice(0, beginIndex) +
    generated +
    readme.slice(endIndex + README_END.length)
  );
}

function buildTargets(packs) {
  const pkgRaw = fs.readFileSync(PACKAGE_JSON_PATH, "utf8");
  const pkg = JSON.parse(pkgRaw);
  const nextPkg = applyScriptsToPackageJson(
    pkg,
    renderPackageJsonScripts(packs)
  );
  const readmeRaw = fs.readFileSync(README_PATH, "utf8");
  return [
    {
      path: PACKAGE_JSON_PATH,
      current: pkgRaw,
      next: `${JSON.stringify(nextPkg, null, 2)}\n`,
    },
    {
      path: README_PATH,
      current: readmeRaw,
      next: spliceReadme(readmeRaw, renderReadmeTables(packs)),
    },
  ];
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function fail(message) {
  console.error(`e2e-manifest: ${message}`);
  process.exit(1);
}

function main() {
  const args = new Set(process.argv.slice(2));
  const checkOnly = args.has("--check");

  const packs = loadManifest();
  const problems = validateManifest(packs);
  if (problems.length > 0) {
    for (const problem of problems) {
      console.error(`e2e-manifest: ${problem}`);
    }
    process.exit(1);
  }

  const targets = buildTargets(packs);
  const drifted = targets.filter((target) => target.current !== target.next);

  if (checkOnly) {
    if (drifted.length > 0) {
      for (const target of drifted) {
        console.error(
          `::error::${rel(target.path)} is out of sync with tests/packs.manifest.ts.`
        );
      }
      console.error(
        "e2e-manifest: generated files drifted. Edit tests/packs.manifest.ts " +
          "(not the generated blocks), run `./bin/6529 run e2e-manifest:sync`, " +
          "and commit the result."
      );
      process.exit(1);
    }
    console.log(`e2e-manifest: ${targets.length} generated target(s) in sync.`);
    return;
  }

  for (const target of targets) {
    if (target.current !== target.next) {
      fs.writeFileSync(target.path, target.next);
      console.log(`e2e-manifest: wrote ${rel(target.path)}`);
    } else {
      console.log(`e2e-manifest: ${rel(target.path)} already in sync`);
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  loadManifest,
  validateManifest,
  renderScript,
  renderPackageJsonScripts,
  applyScriptsToPackageJson,
  renderReadmeTables,
};
