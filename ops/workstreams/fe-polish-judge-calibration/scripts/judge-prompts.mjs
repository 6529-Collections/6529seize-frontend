#!/usr/bin/env node
// Writes the judge prompt for each calibration agent to prompts.jsonl:
// {"agent": "c11-curatorial", "case": "c11", "lens": "curatorial", "prompt": "..."}
//
// Usage: judge-prompts.mjs [case...] (default: every case)

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const REPO = path.resolve(ROOT, "../../..");
const LENS_PREFIX = { curatorial: "C-", visual: "V-", copy: "E-" };

function cellsOf(run) {
  if (Array.isArray(run.scope.cells)) {
    return run.scope.cells;
  }
  const cells = [];
  for (const route of run.scope.routes) {
    for (const state of run.scope.states) {
      for (const viewport of run.scope.viewports) {
        for (const locale of run.scope.locales) {
          cells.push({ route, state, viewport, locale });
        }
      }
    }
  }
  return cells;
}

// Evidence files are named <page>-<viewport>-NN.png. Seeded and mint cases use
// a single page per run (page-, confirm-wallet-, submitted-, success-); Museum
// cases name the page after the route's collection (home, gift, object, ...).
function pageKey(route) {
  const segments = route.split("/").filter(Boolean);
  const last = segments.at(-1) ?? "";
  const named = last.startsWith("[") ? segments.at(-2) : last;
  const key = named === "network" || !named ? "home" : named;
  return key.replace(/s$/u, "");
}

function evidenceFor(cell, files) {
  const byViewport = files.filter((file) => file.includes(`-${cell.viewport}-`));
  const byState = byViewport.filter((file) =>
    file.startsWith(cell.state.replaceAll("_", "-"))
  );
  if (byState.length > 0) {
    return byState;
  }
  const byRoute = byViewport.filter((file) =>
    file.startsWith(`${pageKey(cell.route)}-`)
  );
  return byRoute.length > 0 ? byRoute : byViewport;
}

function prompt(id, run, files, lens) {
  const roundFile = lens ? "00/" + lens + ".json" : "00-baseline.json";
  const caseDir = path.join(ROOT, "cases", id).replaceAll("\\", "/");
  const repo = REPO.replaceAll("\\", "/");
  const cells = cellsOf(run).map((cell) => {
    const tiles = evidenceFor(cell, files).join(", ");
    return `  - route "${cell.route}", state "${cell.state}", viewport "${cell.viewport}", locale "${cell.locale}" -> evidence: ${tiles}`;
  });
  const lensLines = lens
    ? [
        `You are the ${lens} lens judge for a Museum-profile run (see "Museum lenses" in the judge prompt). Score only the dimensions and checks your lens owns, file findings only against them, prefix every finding id with "${LENS_PREFIX[lens]}", and list every coverage cell below.`,
        "",
      ]
    : [];
  const pinnedS = ["S1", "S2", "S3", "S4", "S5"].filter(
    (check) => check in (run.not_applicable ?? {})
  );
  const reportedS = ["S1", "S2", "S3", "S4", "S5", "S6"].filter(
    (check) => !pinnedS.includes(check)
  );
  const pinNote = pinnedS.length
    ? ` Omit ${pinnedS.join(", ")}: pinned N/A in run.json.`
    : "";
  const reported = pinnedS.length ? reportedS.join(", ") : "S1-S6";
  const crypto = run.not_applicable?.J13
    ? "J13 is pinned N/A; omit J13 and the S checks."
    : `J13 applies: score J13 and report ${reported}. Mark an S check unverified when the screenshots cannot show it.${pinNote}`;
  return [
    "You are the independent frontend judge for a 6529 frontend calibration case.",
    "",
    ...lensLines,
    "1. Read these files in full:",
    `   - ${repo}/ops/skills/fe-polish-judge/references/judge-prompt.md (your instructions and output format)`,
    `   - ${repo}/ops/standards/frontend-polish-judge.md (the rubric)`,
    `   - ${repo}/ops/standards/frontend-design-ui-ux.md (the 6529 design standard)`,
    `2. Read the run record: ${caseDir}/run.json`,
    `3. View every evidence image in ${caseDir}/evidence/: ${files.join(", ")}. Files named <page>-<viewport>-NN.png are consecutive viewport-height tiles of one full page, top to bottom.`,
    "",
    "Rules for this run:",
    "- Judge only from these files. Do not open a browser, fetch URLs, run commands, or read or search any other file in the repository.",
    "- This is the baseline round: set every finding's admission to \"baseline\" and reopen_reason to null.",
    `- Set "candidate" to "${run.candidate.commit}".`,
    "- Coverage: list exactly these cells, each once, using the route/state/viewport/locale fields (not a single cell string):",
    ...cells,
    "- Omit dimensions pinned N/A in run.json.",
    `- ${crypto}`,
    "",
    ...(run.rubric_version.endsWith("/2.1")
      ? [
          `When done, write the JSON with the Write tool to ${caseDir}/rounds/${roundFile}; that is the only file you may write.`,
        ]
      : []),
    "Return only the JSON object described in the judge prompt's Output section, with no prose before or after it.",
  ].join("\n");
}

const only = process.argv.slice(2);
const out = [];
for (const id of fs.readdirSync(path.join(ROOT, "cases")).sort()) {
  if (only.length > 0 && !only.includes(id)) {
    continue;
  }
  const run = JSON.parse(
    fs.readFileSync(path.join(ROOT, "cases", id, "run.json"), "utf8")
  );
  const files = fs.readdirSync(path.join(ROOT, "cases", id, "evidence")).sort();
  const lenses = run.profile === "museum" ? ["curatorial", "visual", "copy"] : [null];
  for (const lens of lenses) {
    out.push({
      agent: lens ? `${id}-${lens}` : id,
      case: id,
      lens,
      prompt: prompt(id, run, files, lens),
    });
  }
}
fs.writeFileSync(
  path.join(ROOT, "prompts.jsonl"),
  out.map((entry) => JSON.stringify(entry)).join("\n") + "\n"
);
process.stdout.write(`${out.length} judge prompts\n`);
