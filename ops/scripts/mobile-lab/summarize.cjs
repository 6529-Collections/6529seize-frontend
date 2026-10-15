#!/usr/bin/env node
"use strict";

// Summarize measure.cjs results as Markdown, with the stage 0 budgets
// (reported, not enforced) and an optional comparison with an earlier run.
// Usage: node summarize.cjs <results.json> [--compare <earlier results.json>]

const fs = require("node:fs");
const { parseArgs } = require("../cli-args.cjs");

// Mobile plan stage 0 starting budgets. "Start routes" are the pages the
// phone app opens first.
const BUDGETS = {
  jsBeforeFirstPaintBytes: 300 * 1024,
  firstLoadTransferBytes: 1.5 * 1024 * 1024,
  largestContentMs: 2500,
  idleRequestsPerMinute: 1,
};
const START_ROUTES = new Set(["home", "waves"]);

const isMissing = (value) =>
  value === null || value === undefined || Number.isNaN(value);
const formatter = (divisor, digits) => (value) =>
  isMissing(value) ? "-" : (value / divisor).toFixed(digits);
const KB = formatter(1024, 0);
const MB = formatter(1048576, 2);
const seconds = formatter(1000, 1);
const plain = formatter(1, 1);

function median(values) {
  const sorted = values
    .filter((value) => !isMissing(value))
    .sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)] : null;
}

function pageKey(label) {
  return label.split("-")[0];
}

function typeTotal(run, type, field) {
  const entry = run.net.byType[type];
  return entry ? entry[field] : 0;
}

function pageMedians(results) {
  const pages = [...new Set(results.runs.map((run) => pageKey(run.label)))];
  return pages.map((page) => {
    // Runs that failed to navigate are not measurements of the page.
    const cold = results.runs.filter(
      (run) => run.label.startsWith(`${page}-cold`) && !run.navigationError
    );
    const warm =
      results.runs.find(
        (run) => run.label === `${page}-warm-1` && !run.navigationError
      ) || null;
    const pick = (fn) => median(cold.map(fn));
    return {
      page,
      startRoute: START_ROUTES.has(page),
      coldRuns: cold.length,
      requests: pick((run) => run.net.n),
      transfer: pick((run) => run.net.enc),
      jsTransfer: pick((run) => typeTotal(run, "js", "enc")),
      jsDecoded: pick((run) => typeTotal(run, "js", "dec")),
      jsBeforeFirstPaint: pick((run) =>
        run.jsBeforeFcp ? run.jsBeforeFcp.enc : null
      ),
      imageTransfer: pick((run) => typeTotal(run, "img", "enc")),
      mediaTransfer: pick((run) => typeTotal(run, "media", "enc")),
      fcp: pick((run) => run.fcp),
      lcp: pick((run) => run.lcp),
      tbt: pick((run) => run.tbt),
      heapMB: pick((run) => run.heap.usedMB),
      htmlDecoded: pick((run) => (run.html ? run.html.decoded : null)),
      htmlInlineRsc: pick((run) => (run.html ? run.html.inlineRsc : null)),
      warmTransfer: warm ? warm.net.enc : null,
      idlePerMinute: warm?.idle ? warm.idle.perMinute : null,
    };
  });
}

function checkBudget(value, limit) {
  if (isMissing(value)) return "no data";
  return value < limit ? "within" : "over";
}

function evaluateBudgets(row) {
  return {
    jsBeforeFirstPaint: checkBudget(
      row.jsBeforeFirstPaint,
      BUDGETS.jsBeforeFirstPaintBytes
    ),
    firstLoadTransfer: checkBudget(
      row.transfer,
      BUDGETS.firstLoadTransferBytes
    ),
    largestContent: checkBudget(row.lcp, BUDGETS.largestContentMs),
    idleRequests: checkBudget(row.idlePerMinute, BUDGETS.idleRequestsPerMinute),
  };
}

function delta(current, earlier, format) {
  if (isMissing(current) || isMissing(earlier)) return "-";
  const diff = current - earlier;
  const sign = diff > 0 ? "+" : "";
  return `${format(earlier)} → ${format(current)} (${sign}${format(diff)})`;
}

function renderHeader(results) {
  const down = ((results.networkParams.downloadThroughput * 8) / 1e6).toFixed(
    2
  );
  return [
    `## Mobile lab: ${results.base}`,
    "",
    `Run ${results.when}; deployed version ${results.deployedVersion || "unknown"}; Chromium ${results.browser}, ${results.device}, CPU x${results.cpuThrottle}, network ${results.network} (${results.networkParams.latency} ms, ${down} Mbit/s down); signed out. Medians of cold loads; warm is one reload in the last context; idle is the following window.`,
  ];
}

function renderErrors(results) {
  const failed = results.runs.filter((run) => run.navigationError);
  if (!failed.length) return [];
  return [
    "",
    "### Navigation errors (these runs are not valid measurements)",
    "",
    ...failed.map((run) => `- ${run.label}: ${run.navigationError}`),
  ];
}

function renderMedians(rows) {
  const out = [
    "",
    "| Page | Req | Transfer MB | JS KB (decoded KB) | JS requested before first paint KB | Images KB | Media KB | First paint s | Largest content s | Blocked s | Heap MB | HTML KB (inline RSC KB) | Repeat visit MB | Idle req/min |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  ];
  for (const row of rows) {
    out.push(
      `| ${row.page} | ${row.requests ?? "-"} | ${MB(row.transfer)} | ${KB(row.jsTransfer)} (${KB(row.jsDecoded)}) | ${KB(row.jsBeforeFirstPaint)} | ${KB(row.imageTransfer)} | ${KB(row.mediaTransfer)} | ${seconds(row.fcp)} | ${seconds(row.lcp)} | ${seconds(row.tbt)} | ${row.heapMB ?? "-"} | ${KB(row.htmlDecoded)} (${KB(row.htmlInlineRsc)}) | ${MB(row.warmTransfer)} | ${row.idlePerMinute ?? "-"} |`
    );
  }
  return out;
}

function renderBudgets(rows) {
  const out = [
    "",
    "### Budgets (reported, not enforced)",
    "",
    "| Page | JS requested before first paint < 300 KB | First-load transfer < 1.5 MB (start routes) | Largest content < 2.5 s | Idle < 1 request/min |",
    "|---|---|---|---|---|",
  ];
  for (const row of rows) {
    const budget = evaluateBudgets(row);
    const transfer = row.startRoute
      ? budget.firstLoadTransfer
      : `${budget.firstLoadTransfer} (not a start route)`;
    out.push(
      `| ${row.page} | ${budget.jsBeforeFirstPaint} | ${transfer} | ${budget.largestContent} | ${budget.idleRequests} |`
    );
  }
  return out;
}

function renderComparison(rows, earlier) {
  const before = new Map(pageMedians(earlier).map((row) => [row.page, row]));
  const out = [
    "",
    `### Compared with ${earlier.base} at ${earlier.deployedVersion || earlier.when}`,
    "",
    "| Page | Transfer MB | JS decoded KB | Largest content s | Blocked s | Heap MB | Repeat visit MB | Idle req/min |",
    "|---|---|---|---|---|---|---|---|",
  ];
  for (const row of rows) {
    const old = before.get(row.page);
    if (!old) continue;
    out.push(
      `| ${row.page} | ${delta(row.transfer, old.transfer, MB)} | ${delta(row.jsDecoded, old.jsDecoded, KB)} | ${delta(row.lcp, old.lcp, seconds)} | ${delta(row.tbt, old.tbt, seconds)} | ${delta(row.heapMB, old.heapMB, plain)} | ${delta(row.warmTransfer, old.warmTransfer, MB)} | ${delta(row.idlePerMinute, old.idlePerMinute, plain)} |`
    );
  }
  return out;
}

function renderIdle(results) {
  const out = ["", "### Idle requests (warm page left open)", ""];
  for (const run of results.runs.filter((r) => r.idle)) {
    const top = Object.entries(run.idle.endpoints)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([endpoint, count]) => `${endpoint} x${count}`)
      .join("; ");
    out.push(
      `- ${pageKey(run.label)}: ${run.idle.requests} in ${run.idle.seconds.toFixed(0)} s. ${top || "none"}`
    );
  }
  return out;
}

function renderLargest(results, rows) {
  const out = ["", "### Largest transfers (cold run 1)", ""];
  for (const row of rows) {
    const run = results.runs.find((r) => r.label === `${row.page}-cold-1`);
    if (!run) continue;
    const largest = [...run.requests]
      .sort((a, b) => (b.enc || 0) - (a.enc || 0))
      .slice(0, 6)
      .map((r) => `${r.type} ${r.host} …${r.path.slice(-40)} ${KB(r.enc)} KB`)
      .join("; ");
    out.push(`- ${row.page}: ${largest}`);
  }
  return out;
}

function renderCoverage(results) {
  const covered = results.runs.filter((r) => r.coverage);
  if (!covered.length) return [];
  const out = ["", "### JavaScript never run (warm load with coverage)", ""];
  for (const run of covered) {
    const unused = isMissing(run.coverage.unusedPct)
      ? "-"
      : `${run.coverage.unusedPct}%`;
    out.push(
      `- ${pageKey(run.label)}: ${(run.coverage.totalChars / 1e6).toFixed(2)} M characters evaluated, ${unused} not run by settle`
    );
  }
  return out;
}

function render(results, earlier) {
  const rows = pageMedians(results);
  return [
    ...renderHeader(results),
    ...renderErrors(results),
    ...renderMedians(rows),
    ...renderBudgets(rows),
    ...(earlier ? renderComparison(rows, earlier) : []),
    ...renderIdle(results),
    ...renderLargest(results, rows),
    ...renderCoverage(results),
  ].join("\n");
}

function readJson(file) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI reads the results files it is given.
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const [file] = args._;
  if (!file) {
    throw new Error(
      "Usage: summarize.cjs <results.json> [--compare <earlier results.json>]"
    );
  }
  const earlier =
    typeof args.compare === "string" ? readJson(args.compare) : null;
  process.stdout.write(`${render(readJson(file), earlier)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = { BUDGETS, evaluateBudgets, median, pageMedians, render };
