#!/usr/bin/env node
"use strict";

/**
 * Validates tests/packs.manifest.cjs and synchronizes its generated consumers:
 * package.json test:e2e scripts and the pack table in tests/README.md.
 *
 * Usage:
 *   seize run e2e-manifest:sync
 *   seize run e2e-manifest:check
 */

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_ROOT = process.env["E2E_MANIFEST_ROOT"]
  ? path.resolve(process.env["E2E_MANIFEST_ROOT"])
  : path.resolve(__dirname, "..");

const OWNED_KEY_PATTERN = /^test:e2e($|:)/;
const GUARD_PREFIX = "node scripts/require-6529-command.cjs && ";
const README_BEGIN = "<!-- BEGIN GENERATED: e2e-pack-table -->";
const README_END = "<!-- END GENERATED: e2e-pack-table -->";
const KNOWN_PROJECTS = new Set([
  "web-desktop-chromium",
  "web-mobile-chromium",
  "web-desktop-firefox",
  "web-desktop-webkit",
  "capacitor-ios-sim",
  "capacitor-android-sim",
  "electron-shell-sim",
]);
const KNOWN_SAFETY = new Set(["local", "readonly", "sandbox"]);
const KNOWN_ENVIRONMENTS = new Set(["local", "staging", "production"]);
const KNOWN_TRIGGERS = new Set(["manual", "pr-ci", "post-deploy", "cron"]);
const KNOWN_FIELDS = new Set([
  "scriptKey",
  "alias",
  "description",
  "safety",
  "environments",
  "triggers",
  "env",
  "specs",
  "grep",
  "projects",
  "workers",
  "traceOff",
  "extraArgs",
  "timeoutMinutes",
]);
const REMOTE_CONTRACTS = {
  staging: {
    PLAYWRIGHT_BASE_URL: "https://staging.6529.io",
    PLAYWRIGHT_SKIP_WEB_SERVER: "1",
    PLAYWRIGHT_ENV: "staging",
    PLAYWRIGHT_READONLY: "1",
  },
  production: {
    PLAYWRIGHT_BASE_URL: "https://6529.io",
    PLAYWRIGHT_SKIP_WEB_SERVER: "1",
    PLAYWRIGHT_ENV: "production",
    PLAYWRIGHT_READONLY: "1",
  },
};

function getPaths(root = DEFAULT_ROOT) {
  return {
    root,
    manifest: path.join(root, "tests", "packs.manifest.cjs"),
    packageJson: path.join(root, "package.json"),
    readme: path.join(root, "tests", "README.md"),
  };
}

function loadManifest(manifestPath = getPaths().manifest) {
  const resolvedPath = require.resolve(manifestPath);
  delete require.cache[resolvedPath];
  const loaded = require(resolvedPath);
  if (!loaded || !Array.isArray(loaded.PACKS)) {
    throw new Error(
      `${normalizePath(manifestPath)} must export { PACKS: PackDefinition[] }.`
    );
  }
  return loaded.PACKS;
}

function validateStringArray(problems, pack, field, knownValues) {
  const values = pack[field];
  if (!Array.isArray(values) || values.length === 0) {
    problems.push(`${packLabel(pack)}: ${field} must be a non-empty array.`);
    return;
  }
  const seen = new Set();
  for (const value of values) {
    if (typeof value !== "string" || !knownValues.has(value)) {
      problems.push(`${packLabel(pack)}: unknown ${field} value "${value}".`);
    }
    if (seen.has(value)) {
      problems.push(`${packLabel(pack)}: duplicate ${field} value "${value}".`);
    }
    seen.add(value);
  }
}

function validateEnvironmentVariables(problems, pack) {
  if (pack.env === undefined) {
    return;
  }
  if (
    pack.env === null ||
    Array.isArray(pack.env) ||
    typeof pack.env !== "object"
  ) {
    problems.push(`${packLabel(pack)}: env must be an object.`);
    return;
  }
  for (const [key, value] of Object.entries(pack.env)) {
    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
      problems.push(`${packLabel(pack)}: invalid environment key "${key}".`);
    }
    if (typeof value !== "string" || !/^[A-Za-z0-9_./:@ -]+$/.test(value)) {
      problems.push(
        `${packLabel(pack)}: environment value "${key}" contains unsafe shell characters.`
      );
    }
  }
}

function validateRemoteContract(problems, pack, environment) {
  const expected = REMOTE_CONTRACTS[environment];
  if (!expected) {
    return;
  }
  if (pack.safety !== "readonly") {
    problems.push(
      `${packLabel(pack)}: ${environment} packs must use safety "readonly".`
    );
  }
  if (typeof pack.alias !== "string" || !pack.alias) {
    problems.push(
      `${packLabel(pack)}: ${environment} packs must declare an alias.`
    );
  }
  if (!Array.isArray(pack.specs) || pack.specs.length === 0) {
    problems.push(
      `${packLabel(pack)}: ${environment} packs must select at least one spec.`
    );
  }
  if (!Array.isArray(pack.projects) || pack.projects.length === 0) {
    problems.push(
      `${packLabel(pack)}: ${environment} packs must select at least one project.`
    );
  }
  if (pack.workers !== 1) {
    problems.push(
      `${packLabel(pack)}: ${environment} packs must set workers=1.`
    );
  }
  for (const [key, value] of Object.entries(expected)) {
    if (pack.env?.[key] !== value) {
      problems.push(
        `${packLabel(pack)}: ${environment} packs must set ${key}=${value}.`
      );
    }
  }
}

function validateCommandShape(problems, pack, root) {
  for (const field of ["specs", "projects", "extraArgs"]) {
    const values = pack[field];
    if (values === undefined) {
      continue;
    }
    if (
      !Array.isArray(values) ||
      values.length === 0 ||
      values.some((value) => typeof value !== "string" || value.length === 0)
    ) {
      problems.push(
        `${packLabel(pack)}: ${field} must be a non-empty string array when set.`
      );
    }
  }
  for (const project of pack.projects ?? []) {
    if (!KNOWN_PROJECTS.has(project)) {
      problems.push(`${packLabel(pack)}: unknown project "${project}".`);
    }
  }
  for (const spec of pack.specs ?? []) {
    if (!/^[A-Za-z0-9_./*-]+$/.test(spec)) {
      problems.push(
        `${packLabel(pack)}: spec path "${spec}" contains unsafe shell characters.`
      );
    } else if (root && !fs.existsSync(path.resolve(root, spec))) {
      problems.push(`${packLabel(pack)}: spec path "${spec}" does not exist.`);
    }
  }
  if (pack.grep !== undefined && !/^[A-Za-z0-9@._:-]+$/.test(pack.grep)) {
    problems.push(`${packLabel(pack)}: grep contains unsafe shell characters.`);
  }
  for (const arg of pack.extraArgs ?? []) {
    if (!/^--[A-Za-z0-9][A-Za-z0-9=:,./-]*$/.test(arg)) {
      problems.push(
        `${packLabel(pack)}: extra argument "${arg}" is not a safe long option.`
      );
    }
  }
  if (
    pack.workers !== undefined &&
    (!Number.isInteger(pack.workers) || pack.workers < 1)
  ) {
    problems.push(`${packLabel(pack)}: workers must be a positive integer.`);
  }
  if (
    !Number.isInteger(pack.timeoutMinutes) ||
    pack.timeoutMinutes < 1 ||
    pack.timeoutMinutes > 90
  ) {
    problems.push(
      `${packLabel(pack)}: timeoutMinutes must be an integer from 1 to 90.`
    );
  }
}

function validateManifest(packs, { root } = {}) {
  const problems = [];
  const scriptKeys = new Set();
  const aliases = new Set();

  if (!Array.isArray(packs) || packs.length === 0) {
    return ["manifest must contain at least one pack."];
  }

  for (const pack of packs) {
    if (!pack || typeof pack !== "object") {
      problems.push("every manifest entry must be an object.");
      continue;
    }
    for (const field of Object.keys(pack)) {
      if (!KNOWN_FIELDS.has(field)) {
        problems.push(`${packLabel(pack)}: unknown field "${field}".`);
      }
    }
    if (
      typeof pack.scriptKey !== "string" ||
      !/^test:e2e(?::[a-z0-9][a-z0-9-]*)*$/.test(pack.scriptKey)
    ) {
      problems.push(
        `${packLabel(pack)}: scriptKey must be a lowercase test:e2e key.`
      );
      continue;
    }
    if (scriptKeys.has(pack.scriptKey)) {
      problems.push(`${packLabel(pack)}: duplicate scriptKey.`);
    }
    scriptKeys.add(pack.scriptKey);

    if (
      typeof pack.description !== "string" ||
      !pack.description.trim() ||
      /[\r\n|]/.test(pack.description)
    ) {
      problems.push(
        `${packLabel(pack)}: description must be one non-empty table-safe line.`
      );
    }
    if (!KNOWN_SAFETY.has(pack.safety)) {
      problems.push(`${packLabel(pack)}: unknown safety "${pack.safety}".`);
    }
    validateStringArray(problems, pack, "environments", KNOWN_ENVIRONMENTS);
    validateStringArray(problems, pack, "triggers", KNOWN_TRIGGERS);
    if (pack.environments?.length !== 1) {
      problems.push(
        `${packLabel(pack)}: exactly one environment is required per pack.`
      );
    }

    const environment = pack.environments?.[0];
    if (environment && pack.alias !== undefined) {
      if (
        typeof pack.alias !== "string" ||
        !/^[a-z0-9][a-z0-9-]*$/.test(pack.alias)
      ) {
        problems.push(
          `${packLabel(pack)}: alias must be lowercase kebab-case.`
        );
      } else {
        const aliasKey = `${environment}:${pack.alias}`;
        if (aliases.has(aliasKey)) {
          problems.push(`${packLabel(pack)}: duplicate alias "${pack.alias}".`);
        }
        aliases.add(aliasKey);
      }
    }

    validateEnvironmentVariables(problems, pack);
    validateCommandShape(problems, pack, root);
    validateRemoteContract(problems, pack, environment);

    if (pack.safety === "sandbox" && environment !== "local") {
      problems.push(`${packLabel(pack)}: sandbox packs must be local-only.`);
    }
    if (
      pack.safety === "readonly" &&
      environment === "local" &&
      pack.env?.["PLAYWRIGHT_READONLY"] !== "1"
    ) {
      problems.push(
        `${packLabel(pack)}: local readonly packs must set PLAYWRIGHT_READONLY=1.`
      );
    }
    if (pack.triggers?.includes("cron") && environment !== "production") {
      problems.push(
        `${packLabel(pack)}: cron packs must be production read-only packs.`
      );
    }
    if (
      pack.triggers?.includes("post-deploy") &&
      environment !== "staging" &&
      environment !== "production"
    ) {
      problems.push(
        `${packLabel(pack)}: post-deploy packs must target staging or production.`
      );
    }
    if (pack.triggers?.includes("pr-ci") && environment !== "local") {
      problems.push(`${packLabel(pack)}: pr-ci packs must target local.`);
    }
  }

  const stagingPostDeployAliases = new Set(
    packs
      .filter(
        (pack) =>
          pack?.environments?.[0] === "staging" &&
          pack.triggers?.includes("post-deploy") &&
          typeof pack.alias === "string"
      )
      .map((pack) => pack.alias)
  );
  for (const pack of packs) {
    if (
      pack?.environments?.[0] === "production" &&
      pack.triggers?.includes("cron") &&
      typeof pack.alias === "string" &&
      !stagingPostDeployAliases.has(pack.alias)
    ) {
      problems.push(
        `${packLabel(pack)}: production cron alias "${pack.alias}" requires a staging post-deploy counterpart.`
      );
    }
  }

  return problems;
}

function packLabel(pack) {
  return `pack "${pack?.scriptKey ?? "<missing>"}"`;
}

function renderEnvPrefix(env) {
  const entries = Object.entries(env ?? {});
  if (entries.length === 0) {
    return "";
  }
  const values = entries.map(([key, value]) => {
    if (value.includes('"')) {
      throw new Error(`${key} contains an unsupported double quote.`);
    }
    return /\s/.test(value) ? `${key}="${value}"` : `${key}=${value}`;
  });
  return `cross-env ${values.join(" ")} `;
}

function renderScript(pack) {
  let command = `${GUARD_PREFIX}${renderEnvPrefix(pack.env)}playwright test`;
  if (pack.specs?.length) {
    command += ` ${pack.specs.join(" ")}`;
  }
  if (pack.grep) {
    command += ` --grep ${pack.grep}`;
  }
  for (const project of pack.projects ?? []) {
    command += ` --project=${project}`;
  }
  if (pack.workers) {
    command += ` --workers=${pack.workers}`;
  }
  if (pack.traceOff) {
    command += " --trace=off";
  }
  if (pack.extraArgs?.length) {
    command += ` ${pack.extraArgs.join(" ")}`;
  }
  return command;
}

function renderPackageJsonScripts(packs) {
  return Object.fromEntries(
    packs.map((pack) => [pack.scriptKey, renderScript(pack)])
  );
}

function applyScriptsToPackageJson(pkg, rendered) {
  const scripts = pkg.scripts ?? {};
  const entries = Object.entries(scripts);
  const existingOwned = entries
    .filter(([key]) => OWNED_KEY_PATTERN.test(key))
    .map(([key]) => key);
  const missingFromManifest = existingOwned.filter(
    (key) => !Object.hasOwn(rendered, key)
  );
  if (missingFromManifest.length > 0) {
    throw new Error(
      "package.json has test:e2e scripts with no manifest entry: " +
        missingFromManifest.join(", ")
    );
  }

  const nextScripts = {};
  const lastOwnedIndex = entries.reduce(
    (last, [key], index) => (OWNED_KEY_PATTERN.test(key) ? index : last),
    -1
  );
  const appendMissing = () => {
    for (const [key, value] of Object.entries(rendered)) {
      if (!Object.hasOwn(scripts, key)) {
        nextScripts[key] = value;
      }
    }
  };

  entries.forEach(([key, value], index) => {
    nextScripts[key] = OWNED_KEY_PATTERN.test(key) ? rendered[key] : value;
    if (index === lastOwnedIndex) {
      appendMissing();
    }
  });
  if (lastOwnedIndex === -1) {
    appendMissing();
  }

  return { ...pkg, scripts: nextScripts };
}

function renderReadmeTable(packs) {
  const tableRows = [
    [
      "Pack",
      "Alias",
      "Safety",
      "Environment",
      "Triggers",
      "Timeout",
      "Description",
    ],
    ...packs.map((pack) => [
      `\`${pack.scriptKey}\``,
      pack.alias ?? "—",
      pack.safety,
      pack.environments[0],
      pack.triggers.join(", "),
      `${pack.timeoutMinutes}m`,
      pack.description,
    ]),
  ];
  const widths = tableRows[0].map((_cell, column) =>
    Math.max(...tableRows.map((row) => row[column].length), 3)
  );
  const renderRow = (row) =>
    `| ${row.map((cell, column) => cell.padEnd(widths[column])).join(" | ")} |`;

  const lines = [
    README_BEGIN,
    "",
    "Generated from `tests/packs.manifest.cjs` by",
    "`seize run e2e-manifest:sync`. Edit the manifest, not this table.",
    "",
    renderRow(tableRows[0]),
    `| ${widths.map((width) => "-".repeat(width)).join(" | ")} |`,
  ];
  for (const row of tableRows.slice(1)) {
    lines.push(renderRow(row));
  }
  lines.push("", README_END);
  return lines.join("\n");
}

function spliceReadme(readme, generated) {
  const beginIndex = readme.indexOf(README_BEGIN);
  const endIndex = readme.indexOf(README_END);
  if (beginIndex === -1 || endIndex < beginIndex) {
    throw new Error(
      `tests/README.md must contain ${README_BEGIN} and ${README_END}.`
    );
  }
  return (
    readme.slice(0, beginIndex) +
    generated +
    readme.slice(endIndex + README_END.length)
  );
}

function buildTargets(root = DEFAULT_ROOT) {
  const paths = getPaths(root);
  const packs = loadManifest(paths.manifest);
  const problems = validateManifest(packs, { root });
  if (problems.length > 0) {
    throw new Error(problems.join("\n"));
  }

  const packageRaw = fs.readFileSync(paths.packageJson, "utf8");
  const pkg = JSON.parse(packageRaw);
  const nextPackage = applyScriptsToPackageJson(
    pkg,
    renderPackageJsonScripts(packs)
  );
  const readmeRaw = fs.readFileSync(paths.readme, "utf8");
  return [
    {
      path: paths.packageJson,
      current: packageRaw,
      next: `${JSON.stringify(nextPackage, null, 2)}\n`,
    },
    {
      path: paths.readme,
      current: readmeRaw,
      next: spliceReadme(readmeRaw, renderReadmeTable(packs)),
    },
  ];
}

function normalizePath(filePath) {
  return filePath.replaceAll("\\", "/");
}

function relativePath(root, filePath) {
  return normalizePath(path.relative(root, filePath));
}

function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--check")) {
    console.error("e2e-manifest: usage: sync-e2e-manifest.cjs [--check]");
    process.exit(2);
  }
  const checkOnly = args.includes("--check");

  try {
    const targets = buildTargets();
    const drifted = targets.filter((target) => target.current !== target.next);
    if (checkOnly && drifted.length > 0) {
      for (const target of drifted) {
        console.error(
          `::error::${relativePath(DEFAULT_ROOT, target.path)} is out of sync with tests/packs.manifest.cjs.`
        );
      }
      console.error(
        "e2e-manifest: generated files drifted. Run " +
          "`seize run e2e-manifest:sync` and commit the results."
      );
      process.exit(1);
    }

    for (const target of targets) {
      const relative = relativePath(DEFAULT_ROOT, target.path);
      if (target.current === target.next) {
        console.log(`e2e-manifest: ${relative} already in sync`);
      } else if (!checkOnly) {
        fs.writeFileSync(target.path, target.next);
        console.log(`e2e-manifest: wrote ${relative}`);
      }
    }
    if (checkOnly) {
      console.log(
        `e2e-manifest: ${targets.length} generated targets are in sync.`
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    for (const line of message.split("\n")) {
      console.error(`e2e-manifest: ${line}`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  applyScriptsToPackageJson,
  buildTargets,
  loadManifest,
  renderPackageJsonScripts,
  renderReadmeTable,
  renderScript,
  spliceReadme,
  validateManifest,
};
