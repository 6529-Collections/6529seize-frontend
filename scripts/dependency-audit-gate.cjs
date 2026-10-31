#!/usr/bin/env node

// Turns `6529 audit --prod --audit-level=high --json` output into a pass/fail
// result for the scheduled Dependency Audit workflow.
//
// High and critical advisories fail the gate because an upgrade can fix them.
// Advisories with no published fix cannot be actioned by any dependency
// change, so they are listed in the report but do not fail the run. They fail
// again on their own once a patched release exists.

const fs = require("node:fs");

const BLOCKING_SEVERITIES = new Set(["high", "critical"]);
// pnpm reports an empty patched range as "<0.0.0" when no fix is published.
const NO_FIX_PATCHED_RANGE = "<0.0.0";

function describeAdvisory(advisory) {
  const paths = (advisory.findings ?? []).flatMap((finding) => {
    return finding.paths ?? [];
  });
  return {
    id: String(advisory.github_advisory_id ?? advisory.id ?? "unknown"),
    severity: advisory.severity,
    packageName: advisory.module_name ?? "unknown",
    vulnerableVersions: advisory.vulnerable_versions ?? "unknown",
    patchedVersions: advisory.patched_versions ?? "unknown",
    title: advisory.title ?? "",
    url: advisory.url ?? "",
    firstPath: paths[0] ?? "",
  };
}

function classifyAudit(report) {
  if (
    report === null ||
    typeof report !== "object" ||
    typeof report.advisories !== "object" ||
    report.advisories === null
  ) {
    throw new Error("Audit output does not contain an advisories object.");
  }

  const fixable = [];
  const unfixable = [];
  for (const advisory of Object.values(report.advisories)) {
    if (!BLOCKING_SEVERITIES.has(advisory?.severity)) {
      continue;
    }
    const entry = describeAdvisory(advisory);
    if (entry.patchedVersions === NO_FIX_PATCHED_RANGE) {
      unfixable.push(entry);
    } else {
      fixable.push(entry);
    }
  }
  return { fixable, unfixable };
}

function formatAdvisoryLine(entry) {
  return (
    `- ${entry.packageName} ${entry.vulnerableVersions} (${entry.severity}, ` +
    `${entry.id}): ${entry.title}. Patched: ${entry.patchedVersions}. ` +
    `Path: ${entry.firstPath || "n/a"}`
  );
}

function formatReport({ fixable, unfixable }) {
  const lines = ["## Production dependency audit", ""];
  if (fixable.length === 0) {
    lines.push("No high or critical advisories with an available fix.");
  } else {
    lines.push(
      `${fixable.length} high or critical advisories have a fix available:`,
      "",
      ...fixable.map(formatAdvisoryLine)
    );
  }
  if (unfixable.length > 0) {
    lines.push(
      "",
      `${unfixable.length} high or critical advisories have no published fix yet (informational):`,
      "",
      ...unfixable.map(formatAdvisoryLine)
    );
  }
  return `${lines.join("\n")}\n`;
}

function main(argv) {
  const reportPath = argv[0];
  if (!reportPath) {
    console.error("Usage: dependency-audit-gate.cjs <audit-json-file>");
    return 2;
  }

  let result;
  try {
    result = classifyAudit(JSON.parse(fs.readFileSync(reportPath, "utf8")));
  } catch (error) {
    console.error(`Could not read the audit report: ${error.message}`);
    return 2;
  }

  process.stdout.write(formatReport(result));
  return result.fixable.length > 0 ? 1 : 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = { classifyAudit, formatReport };
