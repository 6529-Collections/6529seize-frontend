#!/usr/bin/env node
"use strict";

// Static route-classification gate, not a browser-coverage report. See
// tests/README.md. --update preserves decisions and adds UNCLASSIFIED entries;
// --json prints the discovered page patterns. No network requests are made.
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(
  process.env["ROUTES_MANIFEST_ROOT"] || path.join(__dirname, "..")
);
const MANIFEST_PATH = path.join(ROOT, "tests", "routes.manifest.json");
const CLASSIFICATIONS = new Set(["crawlable", "fixture", "auth", "exempt"]);
const UNCLASSIFIED = "UNCLASSIFIED";
const ENVIRONMENTS = ["staging", "production"];
const KNOWN_PROJECTS = new Set([
  "web-desktop-chromium",
  "web-mobile-chromium",
  "web-desktop-firefox",
  "web-desktop-webkit",
  "capacitor-ios-sim",
  "capacitor-android-sim",
  "electron-shell-sim",
]);
const ENTRY_FIELDS = new Set([
  "classification",
  "family",
  "projects",
  "fixture",
  "fixtureOmissions",
  "exemptReason",
]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function routeSegments(segments, segment) {
  // Slots and interception have navigation-dependent behavior that this
  // one-entry-per-URL inventory cannot describe. Fail until support is explicit.
  if (segment.startsWith("@") || /^\(\.{1,3}\)/u.test(segment)) {
    throw new Error(
      `Unsupported route segment "${segment}". Extend the routes manifest scanner before adopting parallel or intercepting routes.`
    );
  }
  if (/^\([^()]+\)$/u.test(segment)) return segments;
  return [...segments, segment.replaceAll(/%5F/giu, "_")];
}

function scanAppRoutes(appDir = path.join(ROOT, "app")) {
  const routes = new Map();
  function walk(dir, segments) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const source = path.join(dir, entry.name);
      // Next private folders opt their entire subtree out of routing.
      if (entry.name.startsWith("_")) continue;
      if (entry.isSymbolicLink()) {
        throw new Error(
          `Unsupported symlink in app routes: ${path.relative(appDir, source)}`
        );
      }
      if (entry.isDirectory()) {
        walk(source, routeSegments(segments, entry.name));
      } else if (/^page\.(?:tsx?|jsx?)$/u.test(entry.name)) {
        const route = `/${segments.join("/")}`;
        if (routes.has(route))
          throw new Error(
            `Duplicate page route ${route}: ${routes.get(route)} and ${path.relative(appDir, source)}`
          );
        routes.set(route, path.relative(appDir, source));
      }
    }
  }
  walk(appDir, []);
  // Code-unit order is stable across OS locales.
  return [...routes.keys()].sort();
}

function loadManifest(manifestPath = MANIFEST_PATH) {
  if (!fs.existsSync(manifestPath)) return { schema_version: 1, routes: {} };
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    throw new Error("tests/routes.manifest.json is not valid JSON.");
  }
  if (
    !isRecord(manifest) ||
    manifest.schema_version !== 1 ||
    !isRecord(manifest.routes)
  ) {
    throw new Error(
      "Manifest must have schema_version: 1 and a routes object."
    );
  }
  return manifest;
}

function validateEnvMap(route, name, value) {
  if (value === undefined) return [];
  if (!isRecord(value))
    return [`${route} ${name} must be an object keyed by staging/production.`];
  return Object.entries(value).flatMap(([env, item]) => {
    if (!ENVIRONMENTS.includes(env))
      return [`${route} ${name} has unknown environment "${env}".`];
    if (!isText(item))
      return [`${route} ${name}.${env} must be a non-empty string.`];
    return [];
  });
}

function matchesRoute(route, urlPath) {
  const pattern = route.split("/").filter(Boolean);
  const actual = urlPath.split("/").filter(Boolean);
  for (const [index, segment] of pattern.entries()) {
    if (/^\[\[\.\.\.[^\]]+\]\]$/u.test(segment))
      return index === pattern.length - 1;
    if (/^\[\.\.\.[^\]]+\]$/u.test(segment))
      return index === pattern.length - 1 && actual.length > index;
    if (actual[index] === undefined) return false;
    if (!/^\[[^\]]+\]$/u.test(segment) && segment !== actual[index])
      return false;
  }
  return actual.length === pattern.length;
}

function validateFixturePath(route, env, value) {
  // Paths only: credentials, external URLs, queries, placeholders and URL
  // normalization must not accidentally turn a fixture into another target.
  if (!isText(value)) return [];
  if (
    !value.startsWith("/") ||
    /[\\\s?#\[\]]/u.test(value) ||
    value.includes("//")
  ) {
    return [
      `${route} fixture.${env} must be a concrete root-relative URL path.`,
    ];
  }
  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return [`${route} fixture.${env} has invalid URL encoding.`];
  }
  if (
    /[\\?#\[\]\u0000-\u0020\u007f]/u.test(decoded) ||
    /%2f/iu.test(value) ||
    decoded.split("/").some((part) => part === "." || part === "..") ||
    new URL(value, "https://fixture.invalid").pathname !== value
  ) {
    return [
      `${route} fixture.${env} must not contain encoded delimiters or normalized segments.`,
    ];
  }
  if (!matchesRoute(route, decoded))
    return [`${route} fixture.${env} does not match its route pattern.`];
  return [];
}

function validateFixtures(route, entry) {
  const problems = [
    ...validateEnvMap(route, "fixture", entry.fixture),
    ...validateEnvMap(route, "fixtureOmissions", entry.fixtureOmissions),
  ];
  if (problems.length > 0) return problems;
  for (const env of ENVIRONMENTS) {
    const fixture = entry.fixture?.[env];
    const omission = entry.fixtureOmissions?.[env];
    if (fixture !== undefined && omission !== undefined) {
      problems.push(
        `${route} must choose a fixture URL or fixtureOmissions.${env}, not both.`
      );
    } else if (fixture === undefined && omission === undefined) {
      problems.push(
        `${route} needs fixture.${env} or an explicit fixtureOmissions.${env} reason.`
      );
    } else {
      problems.push(...validateFixturePath(route, env, fixture));
    }
  }
  return problems;
}

function validateProjects(route, projects) {
  if (projects === undefined) return [];
  if (!Array.isArray(projects) || projects.length === 0)
    return [`${route} projects must be a non-empty array.`];
  if (new Set(projects).size !== projects.length)
    return [`${route} projects must not contain duplicates.`];
  return projects
    .filter((project) => !KNOWN_PROJECTS.has(project))
    .map((project) => `${route} lists unknown project "${project}".`);
}

function validateEntry(route, entry) {
  if (!isRecord(entry)) return [`${route} must be a classification object.`];
  const classification = entry.classification;
  if (classification === UNCLASSIFIED) {
    return [
      `${route} is UNCLASSIFIED. Classify it in tests/routes.manifest.json as crawlable (public static path), fixture (per-env paths or omission reasons), auth (session required), or exempt (add exemptReason).`,
    ];
  }
  const problems = Object.keys(entry)
    .filter((key) => !ENTRY_FIELDS.has(key))
    .map((key) => `${route} has unknown field "${key}".`);
  if (!CLASSIFICATIONS.has(classification))
    problems.push(`${route} has unknown classification "${classification}".`);
  if (classification === "exempt" && !isText(entry.exemptReason))
    problems.push(`${route} is exempt but has no exemptReason.`);
  if (classification !== "exempt" && entry.exemptReason !== undefined)
    problems.push(`${route} exemptReason is only valid for exempt routes.`);
  if (classification === "crawlable" && route.includes("["))
    problems.push(
      `${route} is dynamic and needs fixture, auth, or exempt classification.`
    );
  if (entry.family !== undefined && !isText(entry.family))
    problems.push(`${route} family must be a non-empty string.`);
  if (classification === "fixture")
    problems.push(...validateFixtures(route, entry));
  else if (entry.fixture !== undefined || entry.fixtureOmissions !== undefined)
    problems.push(`${route} fixture fields require fixture classification.`);
  return [...problems, ...validateProjects(route, entry.projects)];
}

function checkManifest() {
  const scanned = scanAppRoutes();
  const known = loadManifest().routes;
  const errors = [];
  for (const route of scanned) {
    if (!Object.hasOwn(known, route)) {
      errors.push(
        `${route} exists on disk but is not in tests/routes.manifest.json. Run ./bin/6529 run routes-manifest:update, classify the new entry, and commit the manifest.`
      );
    } else errors.push(...validateEntry(route, known[route]));
  }
  const scannedSet = new Set(scanned);
  for (const route of Object.keys(known)) {
    if (!scannedSet.has(route))
      errors.push(
        `${route} is in tests/routes.manifest.json but no longer exists on disk. Run ./bin/6529 run routes-manifest:update to drop the stale entry.`
      );
  }
  if (errors.length > 0) throw new Error(errors.join("\n"));
  const counts = {};
  for (const route of scanned) {
    const classification = known[route].classification;
    counts[classification] = (counts[classification] || 0) + 1;
  }
  console.log(
    `routes-manifest: ${scanned.length} routes classified (${Object.entries(
      counts
    )
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ")}). This is an inventory, not measured browser coverage.`
  );
}

function updateManifest() {
  const scanned = scanAppRoutes();
  const known = loadManifest().routes;
  const routes = Object.fromEntries(
    scanned.map((route) => [
      route,
      Object.hasOwn(known, route)
        ? known[route]
        : { classification: UNCLASSIFIED },
    ])
  );
  const added = scanned.filter((route) => !Object.hasOwn(known, route)).length;
  const dropped = Object.keys(known).filter(
    (route) => !Object.hasOwn(routes, route)
  ).length;
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(
    MANIFEST_PATH,
    `${JSON.stringify({ schema_version: 1, routes }, null, 2)}\n`
  );
  console.log(
    `routes-manifest: wrote ${scanned.length} routes (${added} new as ${UNCLASSIFIED}, ${dropped} stale dropped). Classify new entries before the check will pass.`
  );
}

function main() {
  const args = process.argv.slice(2);
  if (
    args.length > 1 ||
    (args.length === 1 && !["--json", "--update"].includes(args[0]))
  )
    throw new Error("Usage: routes-manifest.cjs [--json | --update]");
  if (args[0] === "--json")
    console.log(JSON.stringify(scanAppRoutes(), null, 2));
  else if (args[0] === "--update") updateManifest();
  else checkManifest();
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`routes-manifest: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { scanAppRoutes, loadManifest, validateEntry };
