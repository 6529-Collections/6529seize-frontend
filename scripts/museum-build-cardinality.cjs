"use strict";

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const CONTRACT = "museum-build-cardinality-v1";
const PUBLIC_REVIEW_ID = "6529-stream";
const PUBLIC_REVIEW_ROOT = path.join("public", "review-data", PUBLIC_REVIEW_ID);
const BASELINE_BUILD_ROUTES = 31_716;
const BASELINE_GENERATED_PARAMS = 31_437;
const REVIEWED_REDUCTION = 28_060;
const STATIC_ROUTE_OVERHEAD = BASELINE_BUILD_ROUTES - BASELINE_GENERATED_PARAMS;
const EXPECTED_REMAINING_GENERATED_PARAMS =
  BASELINE_GENERATED_PARAMS - REVIEWED_REDUCTION;
const EXPECTED_BUILD_ROUTES_AFTER_REVIEWED_REDUCTION =
  BASELINE_BUILD_ROUTES - REVIEWED_REDUCTION;
const MAX_PRERENDERED_ROUTES = 500;
const EXPECTED_DYNAMIC_DECLARATION_ROUTES = Object.freeze([
  "/reviews/[review]/reference/definitions/[definitionKey]/functions/[declarationKey]",
  "/reviews/[review]/reference/definitions/[definitionKey]/events/[declarationKey]",
  "/reviews/[review]/reference/definitions/[definitionKey]/errors/[declarationKey]",
  "/reviews/[review]/versions/[version]/reference/definitions/[definitionKey]/functions/[declarationKey]",
  "/reviews/[review]/versions/[version]/reference/definitions/[definitionKey]/events/[declarationKey]",
  "/reviews/[review]/versions/[version]/reference/definitions/[definitionKey]/errors/[declarationKey]",
]);

const REVIEWED_HIGH_CARDINALITY_EXPORTS = Object.freeze([
  {
    path: "app/reviews/[review]/reference/definitions/[definitionKey]/functions/[declarationKey]/page.tsx",
    kind: "functions",
    mode: "active",
  },
  {
    path: "app/reviews/[review]/reference/definitions/[definitionKey]/events/[declarationKey]/page.tsx",
    kind: "events",
    mode: "active",
  },
  {
    path: "app/reviews/[review]/reference/definitions/[definitionKey]/errors/[declarationKey]/page.tsx",
    kind: "errors",
    mode: "active",
  },
  {
    path: "app/reviews/[review]/versions/[version]/reference/definitions/[definitionKey]/functions/[declarationKey]/page.tsx",
    kind: "functions",
    mode: "versioned",
  },
  {
    path: "app/reviews/[review]/versions/[version]/reference/definitions/[definitionKey]/events/[declarationKey]/page.tsx",
    kind: "events",
    mode: "versioned",
  },
  {
    path: "app/reviews/[review]/versions/[version]/reference/definitions/[definitionKey]/errors/[declarationKey]/page.tsx",
    kind: "errors",
    mode: "versioned",
  },
]);

const EXPECTED_REMAINING_EXPORTS = Object.freeze([
  "app/about/tech/[reportSlug]/page.tsx",
  "app/reviews/[review]/[page]/page.tsx",
  "app/reviews/[review]/feedback/page.tsx",
  "app/reviews/[review]/page.tsx",
  "app/reviews/[review]/reference/declarations/[declarationKey]/page.tsx",
  "app/reviews/[review]/reference/definitions/[definitionKey]/page.tsx",
  "app/reviews/[review]/reference/interfaces/[definitionKey]/page.tsx",
  "app/reviews/[review]/reference/page.tsx",
  "app/reviews/[review]/reference/sources/[...source]/page.tsx",
  "app/reviews/[review]/versions/[version]/[page]/page.tsx",
  "app/reviews/[review]/versions/[version]/feedback/page.tsx",
  "app/reviews/[review]/versions/[version]/page.tsx",
  "app/reviews/[review]/versions/[version]/reference/declarations/[declarationKey]/page.tsx",
  "app/reviews/[review]/versions/[version]/reference/definitions/[definitionKey]/page.tsx",
  "app/reviews/[review]/versions/[version]/reference/interfaces/[definitionKey]/page.tsx",
  "app/reviews/[review]/versions/[version]/reference/page.tsx",
  "app/reviews/[review]/versions/[version]/reference/sources/[...source]/page.tsx",
]);

const PUBLIC_REVIEW_LIFECYCLE_STATES = new Set([
  "PUBLIC_REVIEW",
  "REVIEW_CLOSED",
]);

function normalizeRepoPath(value) {
  return value.split(path.sep).join("/");
}

function readJson(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `Museum build cardinality fixture is missing: ${relativePath}`
    );
  }
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    throw new Error(
      `Museum build cardinality fixture is invalid: ${relativePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function readSource(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `Museum build cardinality source is missing: ${relativePath}`
    );
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function createSourceFile(relativePath, source) {
  const scriptKind = relativePath.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    relativePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );
  if (sourceFile.parseDiagnostics.length > 0) {
    throw new Error(
      `Museum build cardinality source does not parse: ${relativePath}`
    );
  }
  return sourceFile;
}

function hasExportModifier(node) {
  return Boolean(
    node.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
    )
  );
}

function isGenerateStaticParamsDeclaration(node) {
  if (
    ts.isFunctionDeclaration(node) &&
    node.name?.text === "generateStaticParams"
  ) {
    return hasExportModifier(node);
  }
  if (
    ts.isVariableDeclaration(node) &&
    ts.isIdentifier(node.name) &&
    node.name.text === "generateStaticParams"
  ) {
    return hasExportModifier(node.parent.parent);
  }
  return false;
}

function sourceExportsGenerateStaticParams(relativePath, source) {
  const sourceFile = createSourceFile(relativePath, source);
  let found = false;
  function visit(node) {
    if (isGenerateStaticParamsDeclaration(node)) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return found;
}

function walkFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      continue;
    }
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(absolutePath));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }
  return files;
}

function routePatternForPage(relativePath) {
  const appRelativePath = relativePath.replace(/^app\//u, "");
  return `/${appRelativePath.replace(/\/page\.(?:tsx|ts|jsx|js)$/u, "")}`;
}

function discoverGenerateStaticParamsFiles(root) {
  const appRoot = path.join(root, "app");
  if (!fs.existsSync(appRoot)) {
    throw new Error(
      "Museum build cardinality source directory is missing: app"
    );
  }
  return walkFiles(appRoot)
    .filter((absolutePath) =>
      /(?:page|layout)\.(?:tsx|ts|jsx|js)$/u.test(absolutePath)
    )
    .map((absolutePath) => normalizeRepoPath(path.relative(root, absolutePath)))
    .filter((relativePath) =>
      sourceExportsGenerateStaticParams(
        relativePath,
        readSource(root, relativePath)
      )
    )
    .sort()
    .map((relativePath) => ({
      path: relativePath,
      route: routePatternForPage(relativePath),
    }));
}

function unwrapExpression(expression) {
  let current = expression;
  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isParenthesizedExpression(current))
  ) {
    current = current.expression;
  }
  return current;
}

function findVariableArrayCount(sourceFile, variableName, relativePath) {
  let result;
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName
    ) {
      const initializer = unwrapExpression(node.initializer);
      if (!initializer || !ts.isArrayLiteralExpression(initializer)) {
        throw new Error(
          `Museum build cardinality source contract is not an array: ${relativePath}:${variableName}`
        );
      }
      result = initializer.elements.length;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  if (result === undefined) {
    throw new Error(
      `Museum build cardinality source contract is missing: ${relativePath}:${variableName}`
    );
  }
  return result;
}

function getReviewSourceContracts(root) {
  const reportsPath = "components/about/tech/reports.ts";
  const reportsFile = createSourceFile(
    reportsPath,
    readSource(root, reportsPath)
  );
  return {
    techReportCount: findVariableArrayCount(
      reportsFile,
      "TECH_PR_REPORTS",
      reportsPath
    ),
    sourceContracts: [
      `${reportsPath}:TECH_PR_REPORTS`,
      "content/public-reviews/6529-stream/versions/*/editorial/manifest.json:pages",
    ],
  };
}

function getPublicReviewFixtures(root) {
  const publicationPath = "config/public-reviews/6529-stream.publication.json";
  const publication = readJson(root, publicationPath);
  if (
    publication.reviewId !== PUBLIC_REVIEW_ID ||
    !Array.isArray(publication.versions)
  ) {
    throw new Error(
      "Museum build cardinality publication contract is invalid."
    );
  }
  const publicVersions = publication.versions.filter((version) =>
    PUBLIC_REVIEW_LIFECYCLE_STATES.has(version.lifecycleState)
  );
  if (publicVersions.length === 0) {
    throw new Error("Museum build cardinality has no public review versions.");
  }
  const activeVersions = publication.versions.filter(
    (version) => version.lifecycleState === "PUBLIC_REVIEW"
  );
  if (activeVersions.length !== 1) {
    throw new Error(
      `Museum build cardinality requires exactly one active public review version; found ${activeVersions.length}.`
    );
  }
  const [activeVersion] = activeVersions;

  const manifests = new Map();
  for (const version of publicVersions) {
    const relativePath = path.join(
      PUBLIC_REVIEW_ROOT,
      "versions",
      version.version,
      "reference-manifest.json"
    );
    const manifest = readJson(root, relativePath);
    const editorialPath = path.join(
      "content",
      "public-reviews",
      PUBLIC_REVIEW_ID,
      "versions",
      version.version,
      "editorial",
      "manifest.json"
    );
    const editorialManifest = readJson(root, editorialPath);
    if (
      !Array.isArray(manifest.declarationIndex) ||
      !Array.isArray(manifest.definitionIndex) ||
      !Array.isArray(manifest.files) ||
      editorialManifest.review_id !== PUBLIC_REVIEW_ID ||
      editorialManifest.review_version !== version.version ||
      !Array.isArray(editorialManifest.pages)
    ) {
      throw new Error(
        `Museum build cardinality manifest is invalid: ${relativePath} or ${editorialPath}`
      );
    }
    const communityReviewPages = editorialManifest.pages.filter(
      (page) => page.id === "community-review"
    );
    if (communityReviewPages.length !== 1) {
      throw new Error(
        `Museum build cardinality editorial manifest must contain exactly one community-review page: ${editorialPath}`
      );
    }
    manifests.set(version.version, {
      version: version.version,
      routeCounts: {
        narrativePages: editorialManifest.pages.length - 1,
        definitions: manifest.definitionIndex.length,
        interfaces: manifest.definitionIndex.filter(
          (entry) => entry.interface?.published === true
        ).length,
        sources: manifest.files.length,
        topLevelDeclarations: manifest.declarationIndex.filter(
          (entry) => entry.topLevel === true
        ).length,
        functions: manifest.declarationIndex.filter(
          (entry) =>
            entry.kind === "function" &&
            entry.topLevel !== true &&
            Boolean(entry.definitionKey)
        ).length,
        events: manifest.declarationIndex.filter(
          (entry) =>
            entry.kind === "event" &&
            entry.topLevel !== true &&
            Boolean(entry.definitionKey)
        ).length,
        errors: manifest.declarationIndex.filter(
          (entry) =>
            entry.kind === "error" &&
            entry.topLevel !== true &&
            Boolean(entry.definitionKey)
        ).length,
      },
    });
  }

  return {
    activeVersion: activeVersion.version,
    activeIsPublic: true,
    publicVersions: publicVersions.map(({ version }) => version),
    manifests,
  };
}

function sumVersioned(manifests, selector) {
  let total = 0;
  for (const manifest of manifests.values()) {
    total += selector(manifest.routeCounts);
  }
  return total;
}

function getRouteEstimates(root) {
  const reviewSource = getReviewSourceContracts(root);
  const reviewFixtures = getPublicReviewFixtures(root);
  const activeManifest = reviewFixtures.manifests.get(
    reviewFixtures.activeVersion
  );
  if (!activeManifest) {
    throw new Error("Museum build cardinality active manifest is missing.");
  }
  const active = activeManifest.routeCounts;
  const versioned = (key) =>
    sumVersioned(reviewFixtures.manifests, (counts) => counts[key]);
  const routes = new Map([
    [
      "app/about/tech/[reportSlug]/page.tsx",
      {
        id: "about.tech.report",
        estimate: reviewSource.techReportCount,
        source: reviewSource.sourceContracts[0],
      },
    ],
    [
      "app/reviews/[review]/[page]/page.tsx",
      {
        id: "public-review.active-page",
        estimate: active.narrativePages,
        source: reviewSource.sourceContracts[1],
      },
    ],
    [
      "app/reviews/[review]/feedback/page.tsx",
      {
        id: "public-review.active-feedback",
        estimate: reviewFixtures.activeIsPublic ? 1 : 0,
        source:
          "config/public-reviews/6529-stream.publication.json:active lifecycle",
      },
    ],
    [
      "app/reviews/[review]/page.tsx",
      {
        id: "public-review.active-root",
        estimate: reviewFixtures.activeIsPublic ? 1 : 0,
        source:
          "config/public-reviews/6529-stream.publication.json:active lifecycle",
      },
    ],
    [
      "app/reviews/[review]/reference/declarations/[declarationKey]/page.tsx",
      {
        id: "public-review.active-top-level-declaration",
        estimate: active.topLevelDeclarations,
        source:
          "public/review-data/6529-stream/versions/*/reference-manifest.json:declarationIndex.topLevel",
      },
    ],
    [
      "app/reviews/[review]/reference/definitions/[definitionKey]/page.tsx",
      {
        id: "public-review.active-definition",
        estimate: active.definitions,
        source:
          "public/review-data/6529-stream/versions/*/reference-manifest.json:definitionIndex",
      },
    ],
    [
      "app/reviews/[review]/reference/interfaces/[definitionKey]/page.tsx",
      {
        id: "public-review.active-interface",
        estimate: active.interfaces,
        source:
          "public/review-data/6529-stream/versions/*/reference-manifest.json:definitionIndex.interface.published",
      },
    ],
    [
      "app/reviews/[review]/reference/page.tsx",
      {
        id: "public-review.active-reference-root",
        estimate: reviewFixtures.activeIsPublic ? 1 : 0,
        source:
          "config/public-reviews/6529-stream.publication.json:active lifecycle",
      },
    ],
    [
      "app/reviews/[review]/reference/sources/[...source]/page.tsx",
      {
        id: "public-review.active-source",
        estimate: active.sources,
        source:
          "public/review-data/6529-stream/versions/*/reference-manifest.json:files",
      },
    ],
    [
      "app/reviews/[review]/versions/[version]/[page]/page.tsx",
      {
        id: "public-review.versioned-page",
        estimate: versioned("narrativePages"),
        source: reviewSource.sourceContracts[1],
      },
    ],
    [
      "app/reviews/[review]/versions/[version]/feedback/page.tsx",
      {
        id: "public-review.versioned-feedback",
        estimate: reviewFixtures.publicVersions.length,
        source:
          "config/public-reviews/6529-stream.publication.json:public lifecycle versions",
      },
    ],
    [
      "app/reviews/[review]/versions/[version]/page.tsx",
      {
        id: "public-review.versioned-root",
        estimate: reviewFixtures.publicVersions.length,
        source:
          "config/public-reviews/6529-stream.publication.json:public lifecycle versions",
      },
    ],
    [
      "app/reviews/[review]/versions/[version]/reference/declarations/[declarationKey]/page.tsx",
      {
        id: "public-review.versioned-top-level-declaration",
        estimate: versioned("topLevelDeclarations"),
        source:
          "public/review-data/6529-stream/versions/*/reference-manifest.json:declarationIndex.topLevel",
      },
    ],
    [
      "app/reviews/[review]/versions/[version]/reference/definitions/[definitionKey]/page.tsx",
      {
        id: "public-review.versioned-definition",
        estimate: versioned("definitions"),
        source:
          "public/review-data/6529-stream/versions/*/reference-manifest.json:definitionIndex",
      },
    ],
    [
      "app/reviews/[review]/versions/[version]/reference/interfaces/[definitionKey]/page.tsx",
      {
        id: "public-review.versioned-interface",
        estimate: versioned("interfaces"),
        source:
          "public/review-data/6529-stream/versions/*/reference-manifest.json:definitionIndex.interface.published",
      },
    ],
    [
      "app/reviews/[review]/versions/[version]/reference/page.tsx",
      {
        id: "public-review.versioned-reference-root",
        estimate: reviewFixtures.publicVersions.length,
        source:
          "config/public-reviews/6529-stream.publication.json:public lifecycle versions",
      },
    ],
    [
      "app/reviews/[review]/versions/[version]/reference/sources/[...source]/page.tsx",
      {
        id: "public-review.versioned-source",
        estimate: versioned("sources"),
        source:
          "public/review-data/6529-stream/versions/*/reference-manifest.json:files",
      },
    ],
  ]);
  return { routes, reviewFixtures, reviewSource };
}

function getReviewedHighCardinalityEstimates(reviewFixtures) {
  const active = reviewFixtures.manifests.get(reviewFixtures.activeVersion);
  if (!active) {
    throw new Error("Museum build cardinality active manifest is missing.");
  }
  return REVIEWED_HIGH_CARDINALITY_EXPORTS.map((entry) => ({
    ...entry,
    estimatedParams:
      entry.mode === "active"
        ? active.routeCounts[entry.kind]
        : sumVersioned(
            reviewFixtures.manifests,
            (counts) => counts[entry.kind]
          ),
  }));
}

function assertReviewedExportsAbsent(discoveredPaths) {
  const discovered = new Set(discoveredPaths);
  const present = REVIEWED_HIGH_CARDINALITY_EXPORTS.filter((entry) =>
    discovered.has(entry.path)
  ).map((entry) => entry.path);
  if (present.length > 0) {
    throw new Error(
      `Museum build cardinality reviewed high-cardinality exports still enumerate params: ${present.join(", ")}`
    );
  }
}

function assertExpectedContributorSet(discoveredPaths) {
  const discovered = new Set(discoveredPaths);
  const expected = new Set(EXPECTED_REMAINING_EXPORTS);
  const missing = EXPECTED_REMAINING_EXPORTS.filter(
    (relativePath) => !discovered.has(relativePath)
  );
  const unknown = [...discovered].filter(
    (relativePath) => !expected.has(relativePath)
  );
  if (missing.length > 0 || unknown.length > 0) {
    throw new Error(
      `Museum build cardinality contributor inventory drifted: missing=${missing.join(",") || "none"}; unknown=${unknown.join(",") || "none"}`
    );
  }
}

function readBuildEvidence({
  root,
  buildDirectory = ".next",
  maxPrerenderedRoutes = MAX_PRERENDERED_ROUTES,
}) {
  const prerenderManifestPath = normalizeRepoPath(
    path.join(buildDirectory, "prerender-manifest.json")
  );
  const appPathsManifestPath = normalizeRepoPath(
    path.join(buildDirectory, "server", "app-paths-manifest.json")
  );
  const prerenderManifest = readJson(root, prerenderManifestPath);
  const appPathsManifest = readJson(root, appPathsManifestPath);
  if (
    !prerenderManifest.routes ||
    typeof prerenderManifest.routes !== "object"
  ) {
    throw new Error(
      `Museum build cardinality emitted evidence has no routes object: ${prerenderManifestPath}`
    );
  }
  if (!appPathsManifest || typeof appPathsManifest !== "object") {
    throw new Error(
      `Museum build cardinality emitted evidence has no app paths object: ${appPathsManifestPath}`
    );
  }
  const prerenderedRoutePaths = Object.keys(prerenderManifest.routes);
  const dynamicPrerenderRoutePaths = Object.keys(
    prerenderManifest.dynamicRoutes ?? {}
  );
  const applicationRoutePaths = Object.keys(appPathsManifest);
  const prerenderedRoutes = prerenderedRoutePaths.length;
  if (prerenderedRoutes > maxPrerenderedRoutes) {
    throw new Error(
      `Museum build cardinality budget exceeded: ${prerenderedRoutes} prerendered routes > ${maxPrerenderedRoutes}`
    );
  }
  const missingApplicationRoutes = EXPECTED_DYNAMIC_DECLARATION_ROUTES.filter(
    (route) => !applicationRoutePaths.includes(`${route}/page`)
  );
  const unexpectedlyPrerenderedRoutes = EXPECTED_DYNAMIC_DECLARATION_ROUTES.filter(
    (route) =>
      prerenderedRoutePaths.includes(route) ||
      dynamicPrerenderRoutePaths.includes(route)
  );
  if (
    missingApplicationRoutes.length > 0 ||
    unexpectedlyPrerenderedRoutes.length > 0
  ) {
    throw new Error(
      `Museum build cardinality declaration routes are not request-time dynamic: missing=${missingApplicationRoutes.join(", ") || "none"}; prerendered=${unexpectedlyPrerenderedRoutes.join(", ") || "none"}`
    );
  }
  return {
    evidencePaths: [prerenderManifestPath, appPathsManifestPath],
    prerenderedRoutes,
    applicationRouteEntries: applicationRoutePaths.length,
    dynamicPrerenderRouteEntries: dynamicPrerenderRoutePaths.length,
    maxPrerenderedRoutes,
    requiredDynamicDeclarationRoutes: [...EXPECTED_DYNAMIC_DECLARATION_ROUTES],
  };
}

function analyze({ root = process.cwd(), includeBuildEvidence = true } = {}) {
  const discovered = discoverGenerateStaticParamsFiles(root);
  const discoveredPaths = discovered.map(
    ({ path: relativePath }) => relativePath
  );
  assertReviewedExportsAbsent(discoveredPaths);
  assertExpectedContributorSet(discoveredPaths);
  const { routes, reviewFixtures, reviewSource } = getRouteEstimates(root);
  const contributors = discovered.map(({ path: relativePath, route }) => {
    const contract = routes.get(relativePath);
    if (!contract) {
      throw new Error(
        `Museum build cardinality has no estimator for ${relativePath}`
      );
    }
    return {
      id: contract.id,
      path: relativePath,
      route,
      estimatedParams: contract.estimate,
      source: contract.source,
    };
  });
  const observedGeneratedParams = contributors.reduce(
    (total, contributor) => total + contributor.estimatedParams,
    0
  );
  const reviewed = getReviewedHighCardinalityEstimates(reviewFixtures);
  const observedReviewedReduction = reviewed.reduce(
    (total, entry) => total + entry.estimatedParams,
    0
  );
  const result = {
    contract: CONTRACT,
    sourceInventory: {
      baselineContributorCount:
        discovered.length + REVIEWED_HIGH_CARDINALITY_EXPORTS.length,
      discoveredContributorCount: discovered.length,
      reviewedRemovedContributorCount: REVIEWED_HIGH_CARDINALITY_EXPORTS.length,
      reviewedRemovedExports: reviewed,
      sourceContracts: reviewSource.sourceContracts,
    },
    cardinality: {
      baselineBuildRoutes: BASELINE_BUILD_ROUTES,
      baselineGenerateStaticParams: BASELINE_GENERATED_PARAMS,
      staticRouteOverhead: STATIC_ROUTE_OVERHEAD,
      reviewedReduction: REVIEWED_REDUCTION,
      observedReviewedReduction,
      expectedRemainingGenerateStaticParams:
        EXPECTED_REMAINING_GENERATED_PARAMS,
      expectedBuildRoutesAfterReviewedReduction:
        EXPECTED_BUILD_ROUTES_AFTER_REVIEWED_REDUCTION,
      observedRemainingGenerateStaticParams: observedGeneratedParams,
      museumRoutesWereNotTheBottleneck: true,
    },
    contributors,
  };
  if (includeBuildEvidence) {
    result.buildEvidence = readBuildEvidence({ root });
  }
  return result;
}

function parseArgs(argv) {
  const options = { includeBuildEvidence: true, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--source-only") {
      options.includeBuildEvidence = false;
    } else if (argument === "--json") {
      options.json = true;
    } else {
      throw new Error(
        `Museum build cardinality: unknown argument ${argument}; use --source-only or --json`
      );
    }
  }
  return options;
}

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const report = analyze(options);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`
    );
    process.exitCode = 1;
  }
}

module.exports = {
  BASELINE_BUILD_ROUTES,
  BASELINE_GENERATED_PARAMS,
  CONTRACT,
  EXPECTED_BUILD_ROUTES_AFTER_REVIEWED_REDUCTION,
  EXPECTED_DYNAMIC_DECLARATION_ROUTES,
  EXPECTED_REMAINING_GENERATED_PARAMS,
  EXPECTED_REMAINING_EXPORTS,
  MAX_PRERENDERED_ROUTES,
  REVIEWED_HIGH_CARDINALITY_EXPORTS,
  REVIEWED_REDUCTION,
  analyze,
  assertExpectedContributorSet,
  assertReviewedExportsAbsent,
  discoverGenerateStaticParamsFiles,
  readBuildEvidence,
};
