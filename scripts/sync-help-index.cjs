const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const appDir = path.join(repoRoot, "app");
const sourcePath = path.join(repoRoot, "ops", "help", "help-index.json");
const outputPath = path.join(repoRoot, "public", "help-index.json");
const REQUIRED_RECORD_IDS = [
  "network.tdh",
  "network.xtdh",
  "waves.create.entrypoint.sidebar",
  "waves.create.flow",
  "waves.direct-messages",
  "profiles.subscriptions-tab",
  "subscriptions.report",
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Failed to read ${filePath}: ${error.message}`);
  }
}

function requireString(value, field, recordId) {
  if (typeof value !== "string" || !value.trim()) {
    fail(`${recordId}: ${field} must be a non-empty string`);
  }
}

function requireStringArray(value, field, recordId) {
  if (!Array.isArray(value) || !value.length) {
    fail(`${recordId}: ${field} must be a non-empty array`);
  }
  value.forEach((item, index) => {
    if (typeof item !== "string" || !item.trim()) {
      fail(`${recordId}: ${field}[${index}] must be a non-empty string`);
    }
  });
}

function listFiles(dir, fileName) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFiles(entryPath, fileName);
    }
    return entry.name === fileName ? [entryPath] : [];
  });
}

function routePatternFromPage(pagePath) {
  const relativeDir = path.dirname(path.relative(appDir, pagePath));
  const segments = relativeDir === "." ? [] : relativeDir.split(path.sep);
  return segments
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")))
    .map((segment) => {
      if (segment.startsWith("[[...") && segment.endsWith("]]")) {
        return { kind: "optionalCatchAll" };
      }
      if (segment.startsWith("[...") && segment.endsWith("]")) {
        return { kind: "catchAll" };
      }
      if (segment.startsWith("[") && segment.endsWith("]")) {
        return { kind: "dynamic" };
      }
      return { kind: "static", value: segment };
    });
}

function createRoutePatterns() {
  return listFiles(appDir, "page.tsx").map(routePatternFromPage);
}

function stripPathDecorators(value) {
  return value.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
}

function pathMatchesRoute(rawPath, routePattern) {
  const cleanedPath = stripPathDecorators(rawPath);
  const pathSegments =
    cleanedPath === "/" ? [] : cleanedPath.slice(1).split("/");
  let pathIndex = 0;

  for (const routeSegment of routePattern) {
    if (routeSegment.kind === "optionalCatchAll") {
      return true;
    }
    if (routeSegment.kind === "catchAll") {
      return pathIndex < pathSegments.length;
    }
    const pathSegment = pathSegments[pathIndex];
    if (!pathSegment) {
      return false;
    }
    if (routeSegment.kind === "static" && routeSegment.value !== pathSegment) {
      return false;
    }
    pathIndex += 1;
  }

  return pathIndex === pathSegments.length;
}

function validateInternalPath(value, field, recordId, routePatterns) {
  if (value.startsWith("https://")) {
    return;
  }
  if (!value.startsWith("/")) {
    fail(`${recordId}: ${field} must be an internal path or https URL`);
  }
  if (!routePatterns.some((routePattern) => pathMatchesRoute(value, routePattern))) {
    fail(`${recordId}: ${field} does not resolve to a known app route: ${value}`);
  }
}

function validateSourceRefs(record) {
  for (const sourceRef of record.source_refs || []) {
    if (sourceRef.startsWith("https://")) {
      continue;
    }
    if (!fs.existsSync(path.join(repoRoot, sourceRef))) {
      fail(`${record.id}: source_refs entry does not exist: ${sourceRef}`);
    }
  }
}

function validateRecord(record, ids, routePatterns) {
  requireString(record.id, "id", "record");
  if (ids.has(record.id)) {
    fail(`${record.id}: duplicate record id`);
  }
  ids.add(record.id);

  requireString(record.kind, "kind", record.id);
  requireString(record.title, "title", record.id);
  requireString(record.canonical_path, "canonical_path", record.id);
  validateInternalPath(
    record.canonical_path,
    "canonical_path",
    record.id,
    routePatterns
  );
  requireStringArray(record.aliases, "aliases", record.id);
  requireStringArray(record.keywords, "keywords", record.id);
  requireStringArray(record.facts, "facts", record.id);

  for (const field of ["related_paths", "tags", "source_refs"]) {
    if (record[field] !== undefined) {
      requireStringArray(record[field], field, record.id);
    }
  }
  for (const relatedPath of record.related_paths || []) {
    validateInternalPath(relatedPath, "related_paths", record.id, routePatterns);
  }
  validateSourceRefs(record);
}

function validateIndex(index) {
  if (index.schema_version !== 1) {
    fail("schema_version must be 1");
  }
  requireString(index.generated_at, "generated_at", "index");
  requireString(index.commit_sha, "commit_sha", "index");
  requireString(index.base_url, "base_url", "index");
  if (!Array.isArray(index.records) || index.records.length < 25) {
    fail("records must contain at least 25 records");
  }
  const ids = new Set();
  const routePatterns = createRoutePatterns();
  index.records.forEach((record) => validateRecord(record, ids, routePatterns));
  for (const requiredId of REQUIRED_RECORD_IDS) {
    if (!ids.has(requiredId)) {
      fail(`Missing required help record: ${requiredId}`);
    }
  }
}

const index = readJson(sourcePath);
validateIndex(index);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`);
console.log(`Synced ${index.records.length} help records to public/help-index.json`);
