const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const appDir = path.join(repoRoot, "app");
const sourcePath = path.join(repoRoot, "ops", "help", "help-index.json");
const outputPath = path.join(repoRoot, "public", "help-index.json");
// Keep V1 broad enough that the help bot does not regress into a few canned answers.
const MIN_HELP_RECORDS = 25;
const REQUIRED_RECORD_IDS = [
  "network.tdh",
  "network.xtdh",
  "waves.create.entrypoint.sidebar",
  "waves.create.flow",
  "waves.direct-messages",
  "profiles.subscriptions-tab",
  "subscriptions.report",
];
const ALLOWED_RECORD_KINDS = new Set([
  "business_rule",
  "glossary",
  "route",
  "ui_affordance",
  "workflow",
]);
const LEGACY_WORDPRESS_MARKERS = [
  "legacy-wordpress/WordPressLegacyAssets",
  "<WordPressLegacyAssets",
  "wp-json/wp/v2/",
  "wp-content/",
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
  return {
    pagePath,
    segments: segments
      .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")))
      .map((segment) => {
        if (segment.startsWith("[[...") && segment.endsWith("]]")) {
          return { kind: "optionalCatchAll", value: segment.slice(5, -2) };
        }
        if (segment.startsWith("[...") && segment.endsWith("]")) {
          return { kind: "catchAll", value: segment.slice(4, -1) };
        }
        if (segment.startsWith("[") && segment.endsWith("]")) {
          return { kind: "dynamic", value: segment.slice(1, -1) };
        }
        return { kind: "static", value: segment };
      }),
  };
}

function createRoutePatterns() {
  return listFiles(appDir, "page.tsx").map(routePatternFromPage);
}

function trimTrailingSlashes(value) {
  let end = value.length;
  while (end > 1 && value[end - 1] === "/") {
    end -= 1;
  }
  return value.slice(0, end);
}

function stripPathDecorators(value) {
  const withoutQuery = value.split("?")[0].split("#")[0];
  return trimTrailingSlashes(withoutQuery) || "/";
}

function isPlaceholderSegment(segment) {
  return segment.startsWith("{") && segment.endsWith("}");
}

function placeholderName(segment) {
  return isPlaceholderSegment(segment) ? segment.slice(1, -1) : null;
}

function pathSegmentMatchesDynamic(pathSegment, routeSegment, usesPlaceholder) {
  const name = placeholderName(pathSegment);
  if (name) {
    return name === routeSegment.value;
  }
  return !usesPlaceholder;
}

function pathSegmentMatchesRouteSegment(
  pathSegment,
  routeSegment,
  usesPlaceholder
) {
  if (routeSegment.kind === "dynamic") {
    return pathSegmentMatchesDynamic(pathSegment, routeSegment, usesPlaceholder);
  }
  if (routeSegment.kind === "static") {
    return routeSegment.value === pathSegment;
  }
  return true;
}

function pathMatchesRoute(rawPath, routePattern) {
  const cleanedPath = stripPathDecorators(rawPath);
  const pathSegments =
    cleanedPath === "/" ? [] : cleanedPath.slice(1).split("/");
  const usesPlaceholder = pathSegments.some(isPlaceholderSegment);
  let pathIndex = 0;

  for (const routeSegment of routePattern.segments) {
    if (routeSegment.kind === "optionalCatchAll") {
      const remainingSegments = pathSegments.slice(pathIndex);
      if (usesPlaceholder) {
        return remainingSegments.length === 0;
      }
      return true;
    }
    if (routeSegment.kind === "catchAll") {
      return !usesPlaceholder && pathIndex < pathSegments.length;
    }
    const pathSegment = pathSegments[pathIndex];
    if (!pathSegment) {
      return false;
    }
    if (
      !pathSegmentMatchesRouteSegment(
        pathSegment,
        routeSegment,
        usesPlaceholder
      )
    ) {
      return false;
    }
    pathIndex += 1;
  }

  return pathIndex === pathSegments.length;
}

function isLegacyWordPressFile(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  return LEGACY_WORDPRESS_MARKERS.some((marker) => source.includes(marker));
}

function isLegacyWordPressRoute(routePattern) {
  return isLegacyWordPressFile(routePattern.pagePath);
}

function assertRouteMatchingInvariants(routePatterns) {
  const examples = [
    { path: "/{user}/subscriptions", matches: true },
    { path: "/{user}/subscriptionz", matches: false },
  ];
  for (const example of examples) {
    const matches = routePatterns.some((routePattern) =>
      pathMatchesRoute(example.path, routePattern)
    );
    if (matches !== example.matches) {
      fail(`Route matcher invariant failed for ${example.path}`);
    }
  }
}

function validateInternalPath(value, field, recordId, routePatterns) {
  if (value.startsWith("https://")) {
    return;
  }
  if (!value.startsWith("/")) {
    fail(`${recordId}: ${field} must be an internal path or https URL`);
  }
  const matchingRoutes = routePatterns.filter((routePattern) =>
    pathMatchesRoute(value, routePattern)
  );
  if (!matchingRoutes.length) {
    fail(`${recordId}: ${field} does not resolve to a known app route: ${value}`);
  }
  if (matchingRoutes.some(isLegacyWordPressRoute)) {
    fail(
      `${recordId}: ${field} resolves to a legacy WordPress page and cannot be indexed: ${value}`
    );
  }
}

function validateSourceRefs(record) {
  for (const sourceRef of record.source_refs || []) {
    if (sourceRef.startsWith("https://")) {
      continue;
    }
    const sourcePath = path.join(repoRoot, sourceRef);
    if (!fs.existsSync(sourcePath)) {
      fail(`${record.id}: source_refs entry does not exist: ${sourceRef}`);
    }
    if (!fs.statSync(sourcePath).isFile()) {
      fail(`${record.id}: source_refs entry must be a file: ${sourceRef}`);
    }
    if (isLegacyWordPressFile(sourcePath)) {
      fail(
        `${record.id}: source_refs entry points to a legacy WordPress page and cannot be indexed: ${sourceRef}`
      );
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
  if (!ALLOWED_RECORD_KINDS.has(record.kind)) {
    fail(`${record.id}: kind is not allowed: ${record.kind}`);
  }
  requireString(record.title, "title", record.id);
  if (record.link_label !== undefined) {
    requireString(record.link_label, "link_label", record.id);
  }
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
  if (!Array.isArray(index.records) || index.records.length < MIN_HELP_RECORDS) {
    fail(`records must contain at least ${MIN_HELP_RECORDS} records`);
  }
  const ids = new Set();
  const routePatterns = createRoutePatterns();
  assertRouteMatchingInvariants(routePatterns);
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
const source = fs.readFileSync(sourcePath, "utf8");
fs.writeFileSync(outputPath, source.endsWith("\n") ? source : `${source}\n`);
console.log(`Synced ${index.records.length} help records to public/help-index.json`);
