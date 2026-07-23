#!/usr/bin/env node
"use strict";

/**
 * Routes manifest check/update — every app-router route must be classified
 * for E2E purposes in tests/routes.manifest.json.
 *
 * Usage:
 *   node scripts/routes-manifest.cjs            # check (CI gate)
 *   node scripts/routes-manifest.cjs --update   # rescan; preserve existing
 *                                               # classifications; add new
 *                                               # routes as UNCLASSIFIED;
 *                                               # drop stale entries
 *   node scripts/routes-manifest.cjs --json     # print the scanned routes
 *
 * Classifications:
 *   crawlable — public route the generated crawl pack visits directly.
 *   fixture   — dynamic route crawled via per-environment example URLs
 *               (fixture.staging / fixture.production). Missing env URLs
 *               mean the crawl skips that env with an annotation.
 *   auth      — requires a session; excluded from the unauthenticated crawl.
 *   exempt    — deliberately not crawled; exemptReason is required.
 *
 * The ratchet: `--update` inserts new routes as UNCLASSIFIED, and the check
 * stays red until a human (or agent) classifies them. Adding a route without
 * classifying it cannot pass CI.
 *
 * Dependency-free by design (Debt Ratchet workflow runs it on a bare
 * checkout next to debt-ratchet.cjs).
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env["ROUTES_MANIFEST_ROOT"]
  ? path.resolve(process.env["ROUTES_MANIFEST_ROOT"])
  : path.resolve(__dirname, "..");

const APP_DIR = path.join(ROOT, "app");
const MANIFEST_PATH = path.join(ROOT, "tests", "routes.manifest.json");

const CLASSIFICATIONS = new Set(["crawlable", "fixture", "auth", "exempt"]);
const UNCLASSIFIED = "UNCLASSIFIED";
const KNOWN_PROJECTS = new Set([
  "web-desktop-chromium",
  "web-mobile-chromium",
  "web-desktop-firefox",
  "web-desktop-webkit",
  "capacitor-ios-sim",
  "capacitor-android-sim",
  "electron-shell-sim",
]);

function scanAppRoutes(appDir = APP_DIR) {
  const routes = [];
  const walk = (dir, segments) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        // Route groups "(group)" and parallel routes "@slot" do not add URL
        // segments; none exist in this app today, handled defensively.
        const segment = entry.name;
        if (segment.startsWith("@")) {
          continue;
        }
        const nextSegments = segment.startsWith("(")
          ? segments
          : [...segments, segment];
        walk(path.join(dir, entry.name), nextSegments);
      } else if (entry.name === "page.tsx" || entry.name === "page.ts") {
        routes.push(`/${segments.join("/")}`);
      }
    }
  };
  walk(appDir, []);
  return routes.sort((a, b) => a.localeCompare(b));
}

function loadManifest(manifestPath = MANIFEST_PATH) {
  if (!fs.existsSync(manifestPath)) {
    return { schema_version: 1, routes: {} };
  }
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function validateEntry(route, entry) {
  const problems = [];
  const classification = entry.classification;
  if (classification === UNCLASSIFIED) {
    problems.push(
      `${route} is UNCLASSIFIED. Classify it in tests/routes.manifest.json as ` +
        `"crawlable" (public page, crawled directly), "fixture" (dynamic route ` +
        `+ per-env example URLs), "auth" (needs a session), or "exempt" (add ` +
        `exemptReason). If it is a plain public page, crawlable is the usual answer.`
    );
    return problems;
  }
  if (!CLASSIFICATIONS.has(classification)) {
    problems.push(
      `${route} has unknown classification "${classification}" (expected ` +
        `crawlable | fixture | auth | exempt).`
    );
  }
  if (classification === "exempt" && !entry.exemptReason) {
    problems.push(`${route} is exempt but has no exemptReason.`);
  }
  if (
    classification === "fixture" &&
    entry.fixture &&
    typeof entry.fixture !== "object"
  ) {
    problems.push(`${route} fixture must be an object of per-env URLs.`);
  }
  for (const project of entry.projects || []) {
    if (!KNOWN_PROJECTS.has(project)) {
      problems.push(`${route} lists unknown project "${project}".`);
    }
  }
  return problems;
}

function checkManifest() {
  const scanned = scanAppRoutes();
  const manifest = loadManifest();
  const known = manifest.routes || {};
  const errors = [];

  for (const route of scanned) {
    const entry = known[route];
    if (!entry) {
      errors.push(
        `${route} exists on disk (app${route === "/" ? "" : route}/page.tsx) but ` +
          `is not in tests/routes.manifest.json. Run ` +
          "`./bin/6529 run routes-manifest:update`, classify the new entry, " +
          "and commit the manifest."
      );
      continue;
    }
    errors.push(...validateEntry(route, entry));
  }

  const scannedSet = new Set(scanned);
  for (const route of Object.keys(known)) {
    if (!scannedSet.has(route)) {
      errors.push(
        `${route} is in tests/routes.manifest.json but no longer exists on ` +
          "disk. Run `./bin/6529 run routes-manifest:update` to drop the stale " +
          "entry (its classification is removed with it)."
      );
    }
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`::error::routes-manifest: ${error}`);
    }
    console.error(
      `routes-manifest: ${errors.length} problem(s) across ${scanned.length} routes.`
    );
    process.exit(1);
  }
  const counts = {};
  for (const entry of Object.values(known)) {
    counts[entry.classification] = (counts[entry.classification] || 0) + 1;
  }
  console.log(
    `routes-manifest: ${scanned.length} routes classified ` +
      `(${Object.entries(counts)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ")}).`
  );
}

function updateManifest() {
  const scanned = scanAppRoutes();
  const manifest = loadManifest();
  const known = manifest.routes || {};
  const nextRoutes = {};
  let added = 0;
  let dropped = 0;

  for (const route of scanned) {
    if (known[route]) {
      nextRoutes[route] = known[route];
    } else {
      nextRoutes[route] = { classification: UNCLASSIFIED };
      added += 1;
    }
  }
  for (const route of Object.keys(known)) {
    if (!nextRoutes[route]) {
      dropped += 1;
    }
  }

  const next = { schema_version: 1, routes: nextRoutes };
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(next, null, 2)}\n`);
  console.log(
    `routes-manifest: wrote ${scanned.length} routes ` +
      `(${added} new as ${UNCLASSIFIED}, ${dropped} stale dropped).`
  );
  if (added > 0) {
    console.log(
      "routes-manifest: classify the new UNCLASSIFIED entries before the " +
        "check will pass."
    );
  }
}

function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("--json")) {
    console.log(JSON.stringify(scanAppRoutes(), null, 2));
    return;
  }
  if (args.has("--update")) {
    updateManifest();
    return;
  }
  checkManifest();
}

if (require.main === module) {
  main();
}

module.exports = { scanAppRoutes, loadManifest, validateEntry };
