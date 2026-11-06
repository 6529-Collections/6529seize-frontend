#!/usr/bin/env node
"use strict";

// Keeps ops/telemetry/telemetry-collector.v1.schema.json equal to the
// backend's collector schema, which owns the wire format of POST /e.
//
//   node ops/scripts/sync-telemetry-schema.cjs            -> check (exit 1 on drift)
//   node ops/scripts/sync-telemetry-schema.cjs --update   -> rewrite the vendored copy
//   node ops/scripts/sync-telemetry-schema.cjs --ref <branch-or-sha>
//
// Reads the backend file through the authenticated GitHub CLI (`gh api`).
// The Jest contract test then checks the client registry and emitted batches
// against the vendored copy.

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const REPO = "6529-Collections/6529seize-backend";
const SOURCE =
  "src/api-serverless/src/telemetry/telemetry-collector.v1.schema.json";
const VENDORED = path.join(
  __dirname,
  "..",
  "telemetry",
  "telemetry-collector.v1.schema.json"
);

const args = process.argv.slice(2);
const update = args.includes("--update");
const refIndex = args.indexOf("--ref");
const ref = refIndex >= 0 ? args[refIndex + 1] : "main";
if (!ref || !/^[\w./-]+$/.test(ref)) {
  console.error("--ref needs a branch name or commit SHA.");
  process.exit(2);
}

const encoded = execFileSync(
  "gh",
  ["api", `repos/${REPO}/contents/${SOURCE}?ref=${ref}`, "--jq", ".content"],
  { encoding: "utf8" }
);
const upstream = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
const formatted = `${JSON.stringify(upstream, null, 2)}\n`;

if (update) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed repo path built from __dirname.
  fs.writeFileSync(VENDORED, formatted);
  process.stdout.write(`Updated the vendored schema from ${REPO}@${ref}.\n`);
  process.exit(0);
}

// eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed repo path built from __dirname.
const vendored = JSON.parse(fs.readFileSync(VENDORED, "utf8"));
if (JSON.stringify(vendored) !== JSON.stringify(upstream)) {
  console.error(
    `The vendored collector schema differs from ${REPO}@${ref}. ` +
      "Run with --update, then fix services/analytics/telemetry/wire.ts until the contract test passes."
  );
  process.exit(1);
}
process.stdout.write(`The vendored collector schema matches ${REPO}@${ref}.\n`);
