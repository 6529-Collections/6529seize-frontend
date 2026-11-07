#!/usr/bin/env node
"use strict";

// Keeps ops/telemetry/telemetry-collector.v1.schema.json equal to the
// backend's collector schema, which owns the wire format of POST /e.
//
//   GH_TOKEN=$(gh auth token) node ops/scripts/sync-telemetry-schema.cjs
//       -> check (exit 1 on drift)
//   ... --update                    -> rewrite the vendored copy
//   ... --ref <branch-or-sha>       -> compare with another backend ref
//
// Reads the backend file from the GitHub REST API with GH_TOKEN (or
// GITHUB_TOKEN). The Jest contract test then checks the client registry and
// emitted batches against the vendored copy.

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

async function main() {
  const args = process.argv.slice(2);
  const update = args.includes("--update");
  const refIndex = args.indexOf("--ref");
  const ref = refIndex >= 0 ? args[refIndex + 1] : "main";
  if (!ref || !/^[\w./-]+$/.test(ref)) {
    console.error("--ref needs a branch name or commit SHA.");
    return 2;
  }
  const token = process.env["GH_TOKEN"] || process.env["GITHUB_TOKEN"];
  if (!token) {
    console.error("Set GH_TOKEN, for example GH_TOKEN=$(gh auth token).");
    return 2;
  }

  const response = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${SOURCE}?ref=${encodeURIComponent(ref)}`,
    {
      headers: {
        Accept: "application/vnd.github.raw+json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) {
    console.error(`GitHub answered ${response.status} for ${REPO}@${ref}.`);
    return 1;
  }
  const upstream = JSON.parse(await response.text());
  const formatted = `${JSON.stringify(upstream, null, 2)}\n`;

  if (update) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed repo path built from __dirname.
    fs.writeFileSync(VENDORED, formatted);
    process.stdout.write(`Updated the vendored schema from ${REPO}@${ref}.\n`);
    return 0;
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed repo path built from __dirname.
  const vendored = JSON.parse(fs.readFileSync(VENDORED, "utf8"));
  if (JSON.stringify(vendored) !== JSON.stringify(upstream)) {
    console.error(
      `The vendored collector schema differs from ${REPO}@${ref}. ` +
        "Run with --update, then fix services/analytics/telemetry/wire.ts until the contract test passes."
    );
    return 1;
  }
  process.stdout.write(
    `The vendored collector schema matches ${REPO}@${ref}.\n`
  );
  return 0;
}

void (async () => {
  try {
    process.exitCode = await main();
  } catch (failure) {
    console.error(failure instanceof Error ? failure.message : String(failure));
    process.exitCode = 1;
  }
})();
