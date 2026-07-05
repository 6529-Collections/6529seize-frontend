#!/usr/bin/env node

// Debt ratchet: keeps structural-debt counters from rising.
//
// Counts a fixed set of debt signals over the source tree and compares them
// against the checked-in baseline (scripts/debt-ratchet-baseline.json).
//
//   node scripts/debt-ratchet.cjs            -> check against baseline (CI mode)
//   node scripts/debt-ratchet.cjs --update   -> rewrite the baseline from actuals
//   node scripts/debt-ratchet.cjs --json     -> print actual counts as JSON
//   node scripts/debt-ratchet.cjs --details <metric>
//                                            -> per-file counts for one metric
//
// Rules enforced by the check:
//   - A count above its baseline fails the check.
//   - A source file over the line cap that is not in the grandfather list
//     fails the check, even if the total oversized count did not rise.
//   - A count below its baseline passes with a stale-baseline warning; lower
//     the baseline in the same PR with `--update` so the improvement sticks.
//
// Counting semantics (deliberate trade-offs):
//   - Metrics are textual heuristics, not AST analysis: the `any` and
//     TODO/FIXME/HACK regexes also match inside strings, comments, and JSDoc.
//     Counts are symmetric between baseline and actuals, so the ratchet
//     still moves in the right direction; do not read them as exact.
//   - The oversized grandfather list keys on exact relative paths. Renaming
//     or moving a grandfathered file makes it count as a NEW oversized file
//     (fail-closed); run `--update` in the same PR to re-grandfather the new
//     path, or use the move as the moment to split the file.
//
// The script is dependency-free on purpose so CI can run it on a bare
// checkout without installing node_modules.

const fs = require("node:fs");
const path = require("node:path");

// DEBT_RATCHET_ROOT is a test seam; production runs use the repo root.
const REPO_ROOT = process.env["DEBT_RATCHET_ROOT"]
  ? path.resolve(process.env["DEBT_RATCHET_ROOT"])
  : path.resolve(__dirname, "..");
const BASELINE_PATH = path.join(
  REPO_ROOT,
  "scripts",
  "debt-ratchet-baseline.json"
);
const SCHEMA_VERSION = 1;
const MAX_SOURCE_FILE_LINES = 800;

// Directories that make up the shippable source tree. Generated code and
// test trees are excluded below.
const SCAN_DIRS = [
  "app",
  "components",
  "contexts",
  "entities",
  "helpers",
  "hooks",
  "lib",
  "services",
  "src",
  "store",
  "styles",
  "utils",
  "wagmiConfig",
];

const EXCLUDED_DIR_NAMES = new Set(["__tests__", "__mocks__", "node_modules"]);
const EXCLUDED_FILE_PATTERNS = [
  /\.test\.[cm]?[jt]sx?$/,
  /\.spec\.[cm]?[jt]sx?$/,
];

const CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".cjs",
  ".mjs",
  ".cts",
  ".mts",
]);
const TYPESCRIPT_EXTENSIONS = new Set([".ts", ".tsx", ".cts", ".mts"]);
const STYLE_EXTENSIONS = new Set([".css", ".scss"]);

const METRIC_DEFINITIONS = {
  any_casts: {
    description:
      "`: any` and `as any` occurrences in TypeScript source (tests excluded)",
    hint: "Replace `any` with a real type or `unknown` plus narrowing.",
  },
  todo_comments: {
    description: "TODO/FIXME/HACK markers in source and style files",
    hint: "Fix it, ticket it and link the ticket, or delete the stale marker.",
  },
  oversized_files: {
    description: `source files over ${MAX_SOURCE_FILE_LINES} lines`,
    hint: "Split the file into smaller, single-concern modules.",
  },
  bootstrap_imports: {
    description: "bootstrap / react-bootstrap import statements",
    hint: "Build new UI with Tailwind; do not add Bootstrap usage.",
  },
  redux_imports: {
    description:
      "react-redux / @reduxjs/toolkit / next-redux-wrapper import statements",
    hint: "Use React Query or local state; Redux is being removed.",
  },
  pages_router_files: {
    description: "files under a root-level pages/ directory (pages router)",
    hint: "New routes belong in the App Router (app/).",
  },
};

const isExcludedFile = (fileName) =>
  EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(fileName));

function walkFiles(absoluteDir, relativeDir, collected) {
  let entries;
  try {
    entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const absolutePath = path.join(absoluteDir, entry.name);
    const relativePath = relativeDir
      ? `${relativeDir}/${entry.name}`
      : entry.name;

    if (entry.isDirectory()) {
      if (EXCLUDED_DIR_NAMES.has(entry.name)) continue;
      walkFiles(absolutePath, relativePath, collected);
      continue;
    }

    if (!entry.isFile() || isExcludedFile(entry.name)) continue;
    collected.push(relativePath);
  }
}

function listSourceFiles() {
  const files = [];
  for (const dir of SCAN_DIRS) {
    walkFiles(path.join(REPO_ROOT, dir), dir, files);
  }
  return files.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function countMatches(content, pattern) {
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
}

function countImportStatements(content, packageNames) {
  const packageAlternation = packageNames
    .map((name) => name.replaceAll(/[.*+?^${}()|[\]\\/-]/g, "\\$&"))
    .join("|");
  // The specifier must start at an opening quote (optionally followed by the
  // Sass "~" prefix) so package names that merely contain a target name as a
  // substring ("ng-bootstrap", "my-react-redux-utils") never match.
  const specifier = new RegExp(
    `["'\`]~?(?:${packageAlternation})(?:/[^"'\`]*)?["'\`]`
  );
  const importKeyword = /(?:^|\s)(?:import|export|from|require|@import|@use)\b/;

  let count = 0;
  for (const line of content.split("\n")) {
    if (importKeyword.test(line) && specifier.test(line)) {
      count += 1;
    }
  }
  return count;
}

function countLines(content) {
  if (content.length === 0) return 0;
  let newlines = 0;
  for (let index = 0; index < content.length; index += 1) {
    if (content[index] === "\n") newlines += 1;
  }
  return content.endsWith("\n") ? newlines : newlines + 1;
}

function countPagesRouterFiles() {
  const pagesDir = path.join(REPO_ROOT, "pages");
  if (!fs.existsSync(pagesDir)) return 0;
  const files = [];
  walkFiles(pagesDir, "pages", files);
  return files.filter((file) => CODE_EXTENSIONS.has(path.extname(file))).length;
}

function computeActuals() {
  const perFile = {
    any_casts: new Map(),
    todo_comments: new Map(),
    bootstrap_imports: new Map(),
    redux_imports: new Map(),
  };
  const oversizedFiles = [];

  for (const relativePath of listSourceFiles()) {
    const extension = path.extname(relativePath);
    const isCode = CODE_EXTENSIONS.has(extension);
    const isStyle = STYLE_EXTENSIONS.has(extension);
    if (!isCode && !isStyle) continue;

    const content = fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

    const todoCount = countMatches(content, /\b(?:TODO|FIXME|HACK)\b/g);
    if (todoCount > 0) perFile.todo_comments.set(relativePath, todoCount);

    if (isStyle || isCode) {
      const bootstrapCount = countImportStatements(content, [
        "react-bootstrap",
        "bootstrap",
      ]);
      if (bootstrapCount > 0) {
        perFile.bootstrap_imports.set(relativePath, bootstrapCount);
      }
    }

    if (!isCode) continue;

    if (TYPESCRIPT_EXTENSIONS.has(extension)) {
      const anyCount = countMatches(content, /:\s*any\b|\bas\s+any\b/g);
      if (anyCount > 0) perFile.any_casts.set(relativePath, anyCount);
    }

    const reduxCount = countImportStatements(content, [
      "react-redux",
      "@reduxjs/toolkit",
      "next-redux-wrapper",
    ]);
    if (reduxCount > 0) perFile.redux_imports.set(relativePath, reduxCount);

    if (countLines(content) > MAX_SOURCE_FILE_LINES) {
      oversizedFiles.push(relativePath);
    }
  }

  const sum = (map) => [...map.values()].reduce((total, n) => total + n, 0);

  return {
    counts: {
      any_casts: sum(perFile.any_casts),
      todo_comments: sum(perFile.todo_comments),
      oversized_files: oversizedFiles.length,
      bootstrap_imports: sum(perFile.bootstrap_imports),
      redux_imports: sum(perFile.redux_imports),
      pages_router_files: countPagesRouterFiles(),
    },
    oversizedFiles,
    perFile,
  };
}

function buildBaseline(actuals) {
  return {
    schema_version: SCHEMA_VERSION,
    max_source_file_lines: MAX_SOURCE_FILE_LINES,
    counts: actuals.counts,
    oversized_file_allowlist: actuals.oversizedFiles,
  };
}

function readBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) {
    console.error(
      `Baseline not found at ${path.relative(REPO_ROOT, BASELINE_PATH)}. ` +
        "Run `node scripts/debt-ratchet.cjs --update` and commit the result."
    );
    process.exit(1);
  }
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
  if (baseline.schema_version !== SCHEMA_VERSION) {
    console.error(
      `Baseline schema_version ${baseline.schema_version} does not match ` +
        `script schema_version ${SCHEMA_VERSION}. Regenerate with --update.`
    );
    process.exit(1);
  }
  return baseline;
}

function emitAnnotation(kind, message) {
  if (process.env["GITHUB_ACTIONS"] === "true") {
    console.log(`::${kind}::${message}`);
  }
}

function appendStepSummary(lines) {
  const summaryPath = process.env["GITHUB_STEP_SUMMARY"];
  if (!summaryPath) return;
  fs.appendFileSync(summaryPath, `${lines.join("\n")}\n`);
}

function runCheck() {
  const baseline = readBaseline();
  const actuals = computeActuals();
  const failures = [];
  const warnings = [];
  const rows = [];

  for (const [metric, definition] of Object.entries(METRIC_DEFINITIONS)) {
    const baselineCount = baseline.counts?.[metric];
    const actualCount = actuals.counts[metric];
    if (typeof baselineCount !== "number") {
      failures.push(
        `Baseline is missing metric "${metric}". Regenerate with --update.`
      );
      continue;
    }

    let status = "ok";
    if (actualCount > baselineCount) {
      status = "RISE";
      failures.push(
        `${metric} rose from ${baselineCount} to ${actualCount} ` +
          `(${definition.description}). ${definition.hint}`
      );
    } else if (actualCount < baselineCount) {
      status = "stale baseline";
      warnings.push(
        `${metric} dropped from ${baselineCount} to ${actualCount}. ` +
          "Lock in the improvement: run `node scripts/debt-ratchet.cjs --update` " +
          "and commit the new baseline in this PR."
      );
    }
    rows.push({ metric, baseline: baselineCount, actual: actualCount, status });
  }

  const allowlist = new Set(baseline.oversized_file_allowlist ?? []);
  const oversizedNow = new Set(actuals.oversizedFiles);
  const newOversized = actuals.oversizedFiles.filter(
    (file) => !allowlist.has(file)
  );
  const healedOversized = [...allowlist].filter(
    (file) => !oversizedNow.has(file)
  );
  for (const file of newOversized) {
    failures.push(
      `${file} exceeds ${MAX_SOURCE_FILE_LINES} lines and is not in the ` +
        "grandfather list. Split it instead of growing the list. If this " +
        "path is a rename/move of a grandfathered file, run --update in " +
        "this PR to carry the grandfather entry to the new path."
    );
  }
  if (healedOversized.length > 0) {
    warnings.push(
      `${healedOversized.length} grandfathered file(s) are no longer oversized ` +
        `(${healedOversized.join(", ")}). Run --update to shrink the list.`
    );
  }

  console.log("Debt ratchet report");
  console.log("===================");
  for (const row of rows) {
    console.log(
      `${row.metric.padEnd(20)} baseline ${String(row.baseline).padStart(5)} ` +
        `actual ${String(row.actual).padStart(5)}  ${row.status}`
    );
  }

  for (const warning of warnings) {
    console.log(`\nWARNING: ${warning}`);
    emitAnnotation("warning", warning);
  }
  for (const failure of failures) {
    console.error(`\nFAIL: ${failure}`);
    emitAnnotation("error", failure);
  }

  appendStepSummary([
    "## Debt ratchet",
    "",
    "| Metric | Baseline | Actual | Status |",
    "| --- | ---: | ---: | --- |",
    ...rows.map(
      (row) =>
        `| ${row.metric} | ${row.baseline} | ${row.actual} | ${row.status} |`
    ),
    ...(failures.length > 0
      ? ["", "**Failures**", ...failures.map((failure) => `- ${failure}`)]
      : []),
    ...(warnings.length > 0
      ? ["", "**Warnings**", ...warnings.map((warning) => `- ${warning}`)]
      : []),
  ]);

  if (failures.length > 0) {
    console.error(
      "\nDebt ratchet failed. Reduce the new debt, or if a count legitimately " +
        "dropped, refresh the baseline with `node scripts/debt-ratchet.cjs --update`. " +
        "Use `node scripts/debt-ratchet.cjs --details <metric>` to locate offenders."
    );
    process.exit(1);
  }

  console.log("\nDebt ratchet passed.");
}

function runUpdate() {
  const actuals = computeActuals();
  const baseline = buildBaseline(actuals);
  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(
    `Baseline written to ${path.relative(REPO_ROOT, BASELINE_PATH)}:`
  );
  for (const [metric, count] of Object.entries(baseline.counts)) {
    console.log(`  ${metric}: ${count}`);
  }
}

function runDetails(metric) {
  const actuals = computeActuals();
  if (metric === "oversized_files") {
    for (const file of actuals.oversizedFiles) console.log(file);
    return;
  }
  const perFile = actuals.perFile[metric];
  if (!perFile) {
    console.error(
      `Unknown metric "${metric}". Metrics with per-file details: ` +
        `${[...Object.keys(actuals.perFile), "oversized_files"].join(", ")}.`
    );
    process.exit(1);
  }
  const sorted = [...perFile.entries()].sort(
    (a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)
  );
  for (const [file, count] of sorted) {
    console.log(`${String(count).padStart(5)}  ${file}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--update")) {
    runUpdate();
    return;
  }
  if (args.includes("--json")) {
    const actuals = computeActuals();
    console.log(JSON.stringify(buildBaseline(actuals), null, 2));
    return;
  }
  const detailsIndex = args.indexOf("--details");
  if (detailsIndex !== -1) {
    const metric = args[detailsIndex + 1];
    if (!metric) {
      console.error("Usage: node scripts/debt-ratchet.cjs --details <metric>");
      process.exit(1);
    }
    runDetails(metric);
    return;
  }
  runCheck();
}

if (require.main === module) {
  main();
}

module.exports = {
  MAX_SOURCE_FILE_LINES,
  SCAN_DIRS,
  countImportStatements,
  countLines,
  countMatches,
};
