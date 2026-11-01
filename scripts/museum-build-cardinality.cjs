"use strict";

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const CONTRACT = "museum-build-cardinality-v2";
const MAX_PRERENDERED_ROUTES = 500;
// Pages that may export generateStaticParams. A new contributor must be
// added here with an estimator in getRouteEstimates.
const EXPECTED_REMAINING_EXPORTS = Object.freeze([
  "app/about/tech/[reportSlug]/page.tsx",
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

function getTechReportContract(root) {
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
    sourceContract: `${reportsPath}:TECH_PR_REPORTS`,
  };
}

function getRouteEstimates(root) {
  const techReports = getTechReportContract(root);
  return new Map([
    [
      "app/about/tech/[reportSlug]/page.tsx",
      {
        id: "about.tech.report",
        estimate: techReports.techReportCount,
        source: techReports.sourceContract,
      },
    ],
  ]);
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
  return {
    evidencePaths: [prerenderManifestPath, appPathsManifestPath],
    prerenderedRoutes,
    applicationRouteEntries: applicationRoutePaths.length,
    dynamicPrerenderRouteEntries: dynamicPrerenderRoutePaths.length,
    maxPrerenderedRoutes,
  };
}

function analyze({ root = process.cwd(), includeBuildEvidence = true } = {}) {
  const discovered = discoverGenerateStaticParamsFiles(root);
  assertExpectedContributorSet(
    discovered.map(({ path: relativePath }) => relativePath)
  );
  const routes = getRouteEstimates(root);
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
  const result = {
    contract: CONTRACT,
    sourceInventory: {
      discoveredContributorCount: discovered.length,
    },
    cardinality: {
      observedGenerateStaticParams: contributors.reduce(
        (total, contributor) => total + contributor.estimatedParams,
        0
      ),
      maxPrerenderedRoutes: MAX_PRERENDERED_ROUTES,
    },
    contributors,
  };
  if (includeBuildEvidence) {
    result.buildEvidence = readBuildEvidence({ root });
  }
  return result;
}

function parseArgs(argv) {
  const options = { includeBuildEvidence: true };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--source-only") {
      options.includeBuildEvidence = false;
    } else {
      throw new Error(
        `Museum build cardinality: unknown argument ${argument}; use --source-only`
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
  CONTRACT,
  EXPECTED_REMAINING_EXPORTS,
  MAX_PRERENDERED_ROUTES,
  analyze,
  assertExpectedContributorSet,
  discoverGenerateStaticParamsFiles,
  readBuildEvidence,
};
