#!/usr/bin/env node
"use strict";

// First-load JavaScript budget.
//
// Reads a finished production build (`.next`) and sums the compressed size of
// the JavaScript each tracked entry downloads on first load, then compares the
// sums with the checked-in budget (scripts/perf-budget.json).
//
//   6529 run perf:budget                  -> check against the budget (CI mode)
//   6529 run perf:budget --update         -> rewrite the budget from this build
//   6529 run perf:budget --report <file>  -> also write the measurement as JSON
//   6529 run perf:budget --next-dir <dir> -> read another build directory
//
// What is measured:
//   - root: build-manifest `rootMainFiles` plus the root layout's client entry
//     files. Every page downloads these.
//   - each route: `rootMainFiles` plus every client entry file listed in the
//     route's `page_client-reference-manifest.js` (root layout, boundaries,
//     nested layouts and the page). Lazy `import()`/`next/dynamic` chunks are
//     not first-load and are not counted.
//
// Rules enforced by the check:
//   - gzip or brotli bytes above budget + tolerance fail the check.
//   - Bytes below budget - tolerance pass with a stale-budget warning; lower
//     the budget in the same PR with `--update` so the win sticks.
//   - A tracked route missing from the build fails; a renamed or removed route
//     must update the budget file in the same PR.
//
// Next.js 16 with Turbopack no longer prints "First Load JS" in `next build`,
// so this check is the only place a first-load regression becomes visible.

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const zlib = require("node:zlib");

const SCHEMA_VERSION = 1;
const DEFAULT_BUDGET_PATH = path.join(__dirname, "perf-budget.json");
const ROOT_LAYOUT_ENTRY = "[project]/app/layout";
const ROOT_TARGET_ID = "root";
const MEASURED_FIELDS = Object.freeze(["gzip_bytes", "brotli_bytes"]);

function normalizeAssetPath(file) {
  const value = String(file).replaceAll("\\", "/");
  // Entries are build-relative ("static/chunks/x.js"), "/_next/"-prefixed or,
  // with an asset prefix, absolute URLs. The build directory always holds the
  // file under "static/".
  const index = value.indexOf("static/");
  if (index < 0) {
    throw new Error(`Unexpected client asset path in build manifest: ${file}`);
  }
  return value.slice(index);
}

function readJson(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} is missing: ${filePath}`);
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(
      `${label} is not valid JSON: ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function readRootMainFiles(nextDir) {
  const manifest = readJson(
    path.join(nextDir, "build-manifest.json"),
    "Build manifest (run a production build first)"
  );
  if (
    !Array.isArray(manifest.rootMainFiles) ||
    manifest.rootMainFiles.length === 0
  ) {
    throw new Error("Build manifest has no rootMainFiles.");
  }
  return manifest.rootMainFiles.map(normalizeAssetPath);
}

function readClientReferenceManifest(nextDir, route) {
  const manifestPath = path.join(
    nextDir,
    "server",
    "app",
    ...route.split("/"),
    "page_client-reference-manifest.js"
  );
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `Tracked route "${route}" has no client reference manifest ` +
        `(${path.relative(nextDir, manifestPath)}). If the route moved or was ` +
        "removed, update scripts/perf-budget.json in the same change."
    );
  }
  // The manifest is a script that assigns globalThis.__RSC_MANIFEST[...].
  // Evaluate it in an isolated context so it cannot touch this process.
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(fs.readFileSync(manifestPath, "utf8"), sandbox, {
    filename: manifestPath,
    timeout: 5000,
  });
  const manifests = Object.values(sandbox.__RSC_MANIFEST ?? {});
  if (manifests.length !== 1 || !manifests[0]?.entryJSFiles) {
    throw new Error(
      `Client reference manifest for "${route}" has an unexpected shape.`
    );
  }
  return manifests[0];
}

function createAssetSizer(nextDir) {
  const cache = new Map();
  return function sizeOf(relativePath) {
    const cached = cache.get(relativePath);
    if (cached) {
      return cached;
    }
    const filePath = path.join(nextDir, ...relativePath.split("/"));
    if (!fs.existsSync(filePath)) {
      throw new Error(`Client asset listed in a manifest is missing: ${filePath}`);
    }
    const bytes = fs.readFileSync(filePath);
    const size = {
      raw_bytes: bytes.length,
      gzip_bytes: zlib.gzipSync(bytes, { level: 9 }).length,
      brotli_bytes: zlib.brotliCompressSync(bytes, {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
          [zlib.constants.BROTLI_PARAM_SIZE_HINT]: bytes.length,
        },
      }).length,
    };
    cache.set(relativePath, size);
    return size;
  };
}

function sumFiles(files, sizeOf) {
  const sorted = [...files].sort();
  const totals = { chunks: sorted.length, raw_bytes: 0, gzip_bytes: 0, brotli_bytes: 0 };
  for (const file of sorted) {
    const size = sizeOf(file);
    totals.raw_bytes += size.raw_bytes;
    totals.gzip_bytes += size.gzip_bytes;
    totals.brotli_bytes += size.brotli_bytes;
  }
  return totals;
}

function validateBudget(budget) {
  if (budget?.schema_version !== SCHEMA_VERSION) {
    throw new Error(
      `Budget schema_version ${budget?.schema_version} does not match the ` +
        `script schema_version ${SCHEMA_VERSION}.`
    );
  }
  const tolerance = budget.tolerance;
  if (
    !tolerance ||
    !(tolerance.ratio >= 0 && tolerance.ratio < 1) ||
    !(Number.isInteger(tolerance.min_bytes) && tolerance.min_bytes >= 0)
  ) {
    throw new Error("Budget tolerance needs ratio in [0, 1) and integer min_bytes.");
  }
  if (!Array.isArray(budget.targets) || budget.targets.length === 0) {
    throw new Error("Budget has no targets.");
  }
  const ids = new Set();
  for (const target of budget.targets) {
    if (typeof target.id !== "string" || !target.id || ids.has(target.id)) {
      throw new Error(`Budget target id is missing or duplicated: ${target.id}`);
    }
    ids.add(target.id);
    const isRoot = target.id === ROOT_TARGET_ID;
    if (isRoot ? target.route !== null : typeof target.route !== "string") {
      throw new Error(
        `Budget target "${target.id}" needs ${
          isRoot ? "route: null" : "a route under app/"
        }.`
      );
    }
    if (typeof target.route === "string" && target.route.startsWith("/")) {
      throw new Error(
        `Budget target "${target.id}" route must be relative to app/ (no leading slash).`
      );
    }
  }
  if (!ids.has(ROOT_TARGET_ID)) {
    throw new Error(`Budget must track the "${ROOT_TARGET_ID}" baseline.`);
  }
  if (budget.targets.every((target) => target.route === null)) {
    throw new Error("Budget needs at least one route target.");
  }
}

function measure({ nextDir, budget }) {
  validateBudget(budget);
  const rootMainFiles = readRootMainFiles(nextDir);
  const sizeOf = createAssetSizer(nextDir);
  const rootFiles = new Set(rootMainFiles);
  const routeFiles = new Map();

  for (const target of budget.targets) {
    if (target.route === null) {
      continue;
    }
    const manifest = readClientReferenceManifest(nextDir, target.route);
    const files = new Set(rootMainFiles);
    for (const [entry, list] of Object.entries(manifest.entryJSFiles)) {
      for (const file of list) {
        const normalized = normalizeAssetPath(file);
        files.add(normalized);
        if (entry === ROOT_LAYOUT_ENTRY) {
          rootFiles.add(normalized);
        }
      }
    }
    routeFiles.set(target.id, files);
  }

  const targets = {};
  for (const target of budget.targets) {
    const files =
      target.route === null ? rootFiles : routeFiles.get(target.id);
    targets[target.id] = sumFiles(files, sizeOf);
  }
  return { targets };
}

function toleranceFor(budgetBytes, tolerance) {
  return Math.max(tolerance.min_bytes, Math.ceil(budgetBytes * tolerance.ratio));
}

function compare(budget, measurement) {
  validateBudget(budget);
  const rows = [];
  const failures = [];
  const warnings = [];

  for (const target of budget.targets) {
    const actual = measurement.targets[target.id];
    if (!actual) {
      failures.push(`${target.id}: no measurement was produced.`);
      continue;
    }
    const row = { id: target.id, label: target.label ?? target.id, route: target.route, chunks: actual.chunks };
    let status = "ok";
    for (const field of MEASURED_FIELDS) {
      const limit = target[field];
      if (!(Number.isInteger(limit) && limit > 0)) {
        failures.push(
          `${target.id}: budget ${field} is missing. Run ` +
            "`6529 run perf:budget --update` after a production build."
        );
        status = "fail";
        continue;
      }
      const slack = toleranceFor(limit, budget.tolerance);
      const value = actual[field];
      row[field] = { budget: limit, actual: value, delta: value - limit };
      if (value > limit + slack) {
        status = "fail";
        failures.push(
          `${target.id} (${row.label}): ${field} ${formatBytes(value)} exceeds the ` +
            `budget ${formatBytes(limit)} by ${formatBytes(value - limit)} ` +
            `(tolerance ${formatBytes(slack)}).`
        );
      } else if (value < limit - slack && status === "ok") {
        status = "stale budget";
      }
    }
    if (status === "stale budget") {
      warnings.push(
        `${target.id} (${row.label}) is below its budget. Lock in the win: run ` +
          "`6529 run perf:budget --update` after a production build and commit " +
          "scripts/perf-budget.json in this PR."
      );
    }
    row.status = status;
    rows.push(row);
  }
  return { rows, failures, warnings };
}

function updateBudget(budget, measurement) {
  validateBudget(budget);
  return {
    ...budget,
    targets: budget.targets.map((target) => {
      const actual = measurement.targets[target.id];
      if (!actual) {
        throw new Error(`${target.id}: no measurement was produced.`);
      }
      return {
        ...target,
        chunks: actual.chunks,
        gzip_bytes: actual.gzip_bytes,
        brotli_bytes: actual.brotli_bytes,
      };
    }),
  };
}

function formatBytes(bytes) {
  const sign = bytes < 0 ? "-" : "";
  return `${sign}${(Math.abs(bytes) / 1024).toFixed(1)} KiB`;
}

function formatDelta(bytes) {
  return bytes > 0 ? `+${formatBytes(bytes)}` : formatBytes(bytes);
}

function renderMarkdown(result) {
  const lines = [
    "## First-load JavaScript budget",
    "",
    "| Target | Route | Chunks | Brotli (budget) | Brotli delta | Gzip (budget) | Gzip delta | Status |",
    "|---|---|---:|---:|---:|---:|---:|---|",
  ];
  for (const row of result.rows) {
    const br = row.brotli_bytes;
    const gz = row.gzip_bytes;
    lines.push(
      `| ${row.label} | ${row.route === null ? "every page" : `\`${row.route}\``} | ${row.chunks} | ` +
        `${br ? `${formatBytes(br.actual)} (${formatBytes(br.budget)})` : "n/a"} | ${br ? formatDelta(br.delta) : "n/a"} | ` +
        `${gz ? `${formatBytes(gz.actual)} (${formatBytes(gz.budget)})` : "n/a"} | ${gz ? formatDelta(gz.delta) : "n/a"} | ${row.status} |`
    );
  }
  if (result.failures.length > 0) {
    lines.push("", "### Over budget", "", ...result.failures.map((line) => `- ${line}`));
  }
  if (result.warnings.length > 0) {
    lines.push("", "### Budget can be lowered", "", ...result.warnings.map((line) => `- ${line}`));
  }
  lines.push(
    "",
    "Sizes are per-file gzip (level 9) and brotli (quality 11) sums of first-load JavaScript from `.next`. " +
      "Raise a budget only in a reviewed change that explains the new bytes."
  );
  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const options = { update: false, report: null, nextDir: ".next", budgetPath: DEFAULT_BUDGET_PATH };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") {
      continue;
    }
    if (argument === "--update") {
      options.update = true;
    } else if (argument === "--report" || argument === "--next-dir" || argument === "--budget") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`perf-budget: ${argument} needs a value.`);
      }
      index += 1;
      if (argument === "--report") options.report = value;
      if (argument === "--next-dir") options.nextDir = value;
      if (argument === "--budget") options.budgetPath = value;
    } else {
      throw new Error(
        `perf-budget: unknown argument ${argument}; use --update, --report <file>, --next-dir <dir> or --budget <file>.`
      );
    }
  }
  return options;
}

function run(argv, { cwd = process.cwd(), stdout = process.stdout, env = process.env } = {}) {
  const options = parseArgs(argv);
  const nextDir = path.resolve(cwd, options.nextDir);
  const budgetPath = path.resolve(cwd, options.budgetPath);
  const budget = readJson(budgetPath, "Performance budget");
  validateBudget(budget);
  const measurement = measure({ nextDir, budget });

  if (options.report) {
    const reportPath = path.resolve(cwd, options.report);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(
      reportPath,
      `${JSON.stringify({ schema_version: SCHEMA_VERSION, ...measurement }, null, 2)}\n`
    );
  }

  if (options.update) {
    const next = updateBudget(budget, measurement);
    fs.writeFileSync(budgetPath, `${JSON.stringify(next, null, 2)}\n`);
    stdout.write(`Updated ${path.relative(cwd, budgetPath)} from ${path.relative(cwd, nextDir)}.\n`);
    for (const target of next.targets) {
      stdout.write(
        `  ${target.id.padEnd(10)} ${String(target.chunks).padStart(4)} chunks  ` +
          `br ${formatBytes(target.brotli_bytes).padStart(12)}  gzip ${formatBytes(target.gzip_bytes).padStart(12)}\n`
      );
    }
    return 0;
  }

  const result = compare(budget, measurement);
  const markdown = renderMarkdown(result);
  stdout.write(markdown);
  if (env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(env.GITHUB_STEP_SUMMARY, markdown);
  }
  return result.failures.length > 0 ? 1 : 0;
}

if (require.main === module) {
  try {
    process.exitCode = run(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  ROOT_LAYOUT_ENTRY,
  SCHEMA_VERSION,
  compare,
  measure,
  normalizeAssetPath,
  parseArgs,
  renderMarkdown,
  run,
  toleranceFor,
  updateBudget,
  validateBudget,
};
