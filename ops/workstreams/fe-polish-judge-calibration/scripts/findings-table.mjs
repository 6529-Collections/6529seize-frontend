#!/usr/bin/env node
// Prints every judge finding per case as one line, for adjudication.
//
// Usage (from the repository root):
//   node ops/workstreams/fe-polish-judge-calibration/scripts/findings-table.mjs [case...]

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const CASES = path.join(ROOT, "cases");

function outputs(id) {
  const rounds = path.join(CASES, id, "rounds");
  const single = path.join(rounds, "00-baseline.json");
  if (fs.existsSync(single)) {
    return [["general", JSON.parse(fs.readFileSync(single, "utf8"))]];
  }
  return ["curatorial", "visual", "copy"]
    .map((lens) => [lens, path.join(rounds, "00", `${lens}.json`)])
    .filter(([, file]) => fs.existsSync(file))
    .map(([lens, file]) => [lens, JSON.parse(fs.readFileSync(file, "utf8"))]);
}

const ids = process.argv.slice(2);
const selected = ids.length ? ids : fs.readdirSync(CASES).sort();
for (const id of selected) {
  for (const [lens, output] of outputs(id)) {
    const scores = Object.entries(output.dimensions ?? {})
      .map(([key, value]) => `${key}=${value.score}`)
      .join(" ");
    const checks = Object.entries(output.checks ?? {})
      .filter(([, value]) => value !== "pass")
      .map(([key, value]) => `${key}:${value}`)
      .join(" ");
    process.stdout.write(`\n## ${id} ${lens} | ${scores} | ${checks || "all checks pass"}\n`);
    for (const finding of output.findings ?? []) {
      const text = String(finding.observation ?? "").replace(/\s+/g, " ");
      process.stdout.write(
        `${finding.id} ${finding.severity} [${(finding.targets ?? []).join(",")}] ${text.slice(0, 160)}\n`
      );
    }
  }
}
